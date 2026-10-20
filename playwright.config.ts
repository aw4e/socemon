import { defineConfig } from '@playwright/test'

/* The API and onchain flow specs need the same secrets as the dev server */
try {
  process.loadEnvFile('.env.local')
} catch {}

const port = Number(process.env.E2E_PORT ?? 3100)
const baseURL = process.env.E2E_BASE_URL ?? `http://localhost:${port}`

export default defineConfig({
  testDir: './e2e',
  reporter: 'list',
  use: { baseURL },
  webServer: process.env.E2E_BASE_URL
    ? undefined
    : { command: `npm run dev -- -p ${port}`, url: baseURL, reuseExistingServer: true, timeout: 240_000 },
})
