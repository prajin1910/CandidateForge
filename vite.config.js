import appPlugin from "@base44/vite-plugin"
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    appPlugin({
      // Support for legacy SDK imports from @/integrations, @/entities, etc.
      legacySDKImports: process.env.CF_LEGACY_SDK_IMPORTS === 'true',
    }),
    react(),
  ]
});
