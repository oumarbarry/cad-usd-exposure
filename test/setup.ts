/**
 * Vitest setup for the "unit" (node-environment) project only.
 *
 * The unit project runs pure server/shared logic with no Nuxt runtime, so the
 * Nuxt/Nitro auto-imports those files rely on must be polyfilled by hand. Tests
 * that need the real auto-imports belong in the "nuxt" project, where the Nuxt
 * environment provides them (use mockNuxtImport there instead of these stubs).
 */
import { createError, defineEventHandler } from "h3"

// Required by Better Auth to sign/verify tokens. Use the existing value if set
// (CI or .env); otherwise a deterministic test-only string. NEVER a real secret.
if (!process.env.BETTER_AUTH_SECRET) {
  process.env.BETTER_AUTH_SECRET =
    "test-secret-only-for-vitest-not-for-production-padding-xxxxxxxxxxxx"
}

if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = "postgresql://postgres:postgres@localhost:5432/app"
}

// Nitro auto-import stubs so server/ files resolve without the Nuxt build pipeline.
// @ts-expect-error - global injection for test environment
globalThis.createError = createError
// @ts-expect-error - global injection for test environment
globalThis.defineEventHandler = defineEventHandler
