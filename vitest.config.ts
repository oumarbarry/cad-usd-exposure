import { resolve } from "node:path"
import { defineConfig } from "vitest/config"
import { defineVitestProject } from "@nuxt/test-utils/config"

// Nuxt's path aliases, needed by the unit (node) project which has no Nuxt resolver.
const alias = {
  // Nuxt's ~~ / @@ alias resolves to the project root
  "~~": resolve(__dirname, "."),
  "@@": resolve(__dirname, "."),
  // Nuxt's ~ / @ alias resolves to app/
  "~": resolve(__dirname, "app"),
  "@": resolve(__dirname, "app"),
}

export default defineConfig({
  test: {
    // Spies/mocks never leak across tests (vitest.dev/guide/learn/writing-tests-with-ai).
    restoreMocks: true,
    projects: [
      // Unit project: pure Node logic (server utils + shared helpers).
      // No Nuxt runtime, so it needs the explicit aliases and the auto-import
      // polyfills from test/setup.ts (createError / defineEventHandler).
      {
        resolve: { alias },
        test: {
          name: "unit",
          globals: true,
          environment: "node",
          setupFiles: ["./test/setup.ts"],
          include: ["test/*.test.ts", "shared/**/*.test.ts", "server/**/*.test.ts"],
        },
      },
      // Nuxt project: component/composable tests that need the Nuxt runtime.
      // The Nuxt resolver handles aliases and auto-imports (use mockNuxtImport
      // here, not the manual global stubs).
      await defineVitestProject({
        test: {
          name: "nuxt",
          globals: true,
          environment: "nuxt",
          include: ["test/nuxt/**/*.test.ts", "app/**/*.test.ts"],
          // @nuxt/test-utils injects `beforeAll(() => setupNuxt())` into every
          // file here; that boot blows the default 10s hook budget on a loaded
          // machine. The work is real, so give it room.
          hookTimeout: 30_000,
        },
      }),
    ],
  },
})
