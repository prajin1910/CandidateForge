/**
 * GitHub Extractor
 * Fetches candidate data from the GitHub REST API v3.
 *
 * Endpoints:
 *   GET /users/:username          — profile
 *   GET /users/:username/repos    — repositories (languages, topics, descriptions)
 *   GET /users/:username/orgs     — public organizations
 *
 * Token is passed as Authorization: Bearer <token> header (optional).
 * Returns a RawSourcePayload.
 */

const GITHUB_API_BASE = 'https://api.github.com';

export async function extractFromGitHub(githubUrl, token = null) {
  const username = extractUsername(githubUrl);
  if (!username) {
    throw new ExtractorError(`Could not extract GitHub username from URL: ${githubUrl}`);
  }

  // Use user-supplied token first, fall back to env variable default
  const effectiveToken = token || import.meta.env.VITE_GITHUB_TOKEN || null;

  const headers = {
    'Accept': 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    'User-Agent': 'CandidateForge/1.0',
  };
  if (effectiveToken) {
    headers['Authorization'] = `Bearer ${effectiveToken}`;
  }

  // Fetch profile, repos, and orgs in parallel
  let profileRes, reposRes, orgsRes;
  try {
    [profileRes, reposRes, orgsRes] = await Promise.allSettled([
      fetch(`${GITHUB_API_BASE}/users/${username}`, { headers }),
      fetch(`${GITHUB_API_BASE}/users/${username}/repos?per_page=100&sort=updated`, { headers }),
      fetch(`${GITHUB_API_BASE}/users/${username}/orgs`, { headers }),
    ]);
  } catch (networkError) {
    throw new ExtractorError(
      `Network error while contacting GitHub API: ${networkError.message}. Check your internet connection.`
    );
  }

  // Profile is required — handle rejected promise and HTTP errors separately
  if (profileRes.status === 'rejected') {
    throw new ExtractorError(
      `Failed to reach GitHub API: ${profileRes.reason?.message || 'Network error'}. Check your internet connection.`
    );
  }

  const profileResponse = profileRes.value;
  if (!profileResponse.ok) {
    if (profileResponse.status === 404) {
      throw new NotFoundError(`GitHub user '${username}' not found. Please check the URL.`);
    }
    if (profileResponse.status === 403 || profileResponse.status === 429) {
      const remaining = profileResponse.headers.get('X-RateLimit-Remaining');
      const resetTimestamp = profileResponse.headers.get('X-RateLimit-Reset');
      const resetDate = resetTimestamp ? new Date(parseInt(resetTimestamp, 10) * 1000) : null;
      const resetIn = resetDate ? Math.ceil((resetDate.getTime() - Date.now()) / 60000) : null;

      let message = 'GitHub API rate limit exceeded.';
      if (!token) {
        message += ' Without a GitHub token, the API allows only 60 requests/hour per IP.';
        message += ' Please provide a GitHub Personal Access Token (PAT) in the token field for 5,000 requests/hour.';
      }
      if (resetIn && resetIn > 0) {
        message += ` Rate limit resets in ~${resetIn} minute(s).`;
      }
      throw new RateLimitError(message, resetTimestamp);
    }
    // Other HTTP errors
    let errorBody = '';
    try {
      const errorJson = await profileResponse.json();
      errorBody = errorJson.message || '';
    } catch (_) { /* ignore parse errors */ }
    throw new ExtractorError(
      `GitHub API error (${profileResponse.status}): ${errorBody || profileResponse.statusText}`
    );
  }

  const profile = await profileResponse.json();

  // Parse repos (optional — don't fail pipeline if repos can't be fetched)
  let repos = [];
  if (reposRes.status === 'fulfilled' && reposRes.value.ok) {
    try {
      repos = await reposRes.value.json();
    } catch (_) {
      repos = [];
    }
  }

  // Parse orgs (optional)
  let orgs = [];
  if (orgsRes.status === 'fulfilled' && orgsRes.value.ok) {
    try {
      orgs = await orgsRes.value.json();
    } catch (_) {
      orgs = [];
    }
  }

  // Aggregate languages across all repos (sorted by frequency)
  const languageCounts = {};
  for (const repo of repos) {
    if (repo.language) {
      languageCounts[repo.language] = (languageCounts[repo.language] || 0) + 1;
    }
  }
  const languages = Object.entries(languageCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([lang]) => lang);

  // Aggregate topics across all repos
  const topicSet = new Set();
  for (const repo of repos) {
    if (repo.topics && Array.isArray(repo.topics)) {
      for (const topic of repo.topics) {
        topicSet.add(topic);
      }
    }
  }

  // Top 5 repos by stars (for descriptions)
  const topRepos = [...repos]
    .sort((a, b) => (b.stargazers_count || 0) - (a.stargazers_count || 0))
    .slice(0, 5)
    .map(repo => ({
      name: repo.name,
      description: repo.description,
      stars: repo.stargazers_count || 0,
      url: repo.html_url,
    }));

  // Build raw fields
  const rawFields = {
    fullName: profile.name || profile.login,
    headline: profile.bio || null,
    location: profile.location || null,
    emails: profile.email ? [profile.email] : [],
    links: [
      { type: 'github', url: profile.html_url },
      ...(profile.blog ? [{ type: 'website', url: profile.blog.startsWith('http') ? profile.blog : `https://${profile.blog}` }] : []),
      ...(profile.twitter_username ? [{ type: 'twitter', url: `https://twitter.com/${profile.twitter_username}` }] : []),
    ],
    skills: [...languages, ...Array.from(topicSet)],
    company: profile.company || null,
    followers: profile.followers || 0,
    following: profile.following || 0,
    publicRepos: profile.public_repos || 0,
    githubCreatedAt: profile.created_at || null,
    topRepos,
    organizations: orgs.map(org => ({ name: org.login, url: org.url })),
    // Metadata for confidence scoring
    _meta: {
      repoCount: repos.length,
      totalStars: repos.reduce((sum, r) => sum + (r.stargazers_count || 0), 0),
      languageCount: languages.length,
      topicCount: topicSet.size,
      orgCount: orgs.length,
    },
  };

  return {
    sourceType: 'github',
    sourceName: `github:${username}`,
    rawFields,
    extractedAt: new Date().toISOString(),
    extractorVersion: 'githubExtractor@1.1',
  };
}

function extractUsername(url) {
  if (!url) return null;
  // Handle "username", "github.com/username", "https://github.com/username", "https://github.com/username/"
  const match = url.match(/(?:github\.com\/)?@?([^\/\s]+)\/?$/);
  return match ? match[1] : null;
}

export class ExtractorError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ExtractorError';
  }
}

export class NotFoundError extends Error {
  constructor(message) {
    super(message);
    this.name = 'NotFoundError';
  }
}

export class RateLimitError extends Error {
  constructor(message, retryAfter) {
    super(message);
    this.name = 'RateLimitError';
    this.retryAfter = retryAfter;
  }
}