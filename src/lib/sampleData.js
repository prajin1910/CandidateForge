/**
 * Sample Data
 * Provides sample structured files, resume text, and config for testing.
 */

export const SAMPLE_CSV = `name,email,phone,skills,github_url,location,headline
Prajin Kumar,prajin.kumar@gmail.com,+1 (415) 555-0192,"ReactJS,NodeJS,TypeScript,MongoDB,PostgreSQL",https://github.com/prajinkumar,"San Francisco, CA, USA","Senior Full Stack Engineer"`;

export const SAMPLE_JSON = JSON.stringify([
  {
    name: 'Prajin Kumar',
    email: 'prajin.kumar@gmail.com',
    phone: '+1 (415) 555-0192',
    skills: ['ReactJS', 'NodeJS', 'TypeScript', 'MongoDB', 'PostgreSQL'],
    github_url: 'https://github.com/prajinkumar',
    location: 'San Francisco, CA, USA',
    headline: 'Senior Full Stack Engineer',
  },
], null, 2);

export const SAMPLE_RESUME_TEXT = `Prajin Kumar
Senior Full Stack Engineer

Email: prajin.kumar@gmail.com
Phone: +1 (415) 555-0192
Location: San Francisco, CA, USA
GitHub: https://github.com/prajinkumar
LinkedIn: https://www.linkedin.com/in/prajinkumar

SUMMARY
Senior Full Stack Engineer with 7+ years of experience building scalable web applications.
Specialized in React, Node.js, and cloud-native architectures.

SKILLS
React, Node.js, TypeScript, MongoDB, PostgreSQL, AWS, Docker, Kubernetes, GraphQL, Python

EXPERIENCE
Senior Software Engineer | TechCorp | 2021-01 to Present
  - Led migration of monolith to microservices architecture
  - Built real-time analytics dashboard using React and WebSocket

Software Engineer | StartupHub | 2018-06 to 2020-12
  - Developed REST API serving 2M+ requests/day using Node.js and Express
  - Implemented CI/CD pipeline with GitHub Actions

EDUCATION
B.Tech in Computer Science | IIT Bombay | 2014-08 to 2018-05`;

export const SAMPLE_CONFIG = {
  sourcePriority: ['structured', 'github', 'resume', 'linkedin'],
  projection: {
    fields: [
      { from: 'candidateId', to: 'candidate_id' },
      { from: 'fullName', to: 'candidate_name' },
      { from: 'emails[0]', to: 'primary_email' },
      { from: 'phones[0]', to: 'primary_phone' },
      { from: 'location', to: 'location' },
      { from: 'headline', to: 'headline' },
      { from: 'skills', to: 'skills' },
      { from: 'experience', to: 'experience' },
      { from: 'education', to: 'education' },
      { from: 'links', to: 'links' },
      { from: 'overallConfidence', to: 'confidence' },
      { from: 'provenanceMap', to: 'provenance' },
      { from: 'fieldConfidence', to: 'fieldConfidence' },
      { from: 'sources', to: 'sources' },
    ],
  },
  normalization: {
    phoneFormat: 'E164',
    dateFormat: 'ISO',
    skillCanonicalization: true,
  },
  missingValueStrategy: 'null',
};

export const SAMPLE_GITHUB_URL = 'https://github.com/torvalds';