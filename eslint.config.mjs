// @ts-check
import withNuxt from "./.nuxt/eslint.config.mjs"
import vitest from "@vitest/eslint-plugin"

export default withNuxt(
  {
    // Installed skill bundles — vendored tooling docs, not project source.
    ignores: [".agents/skills/**", ".claude/skills/**"],
  },
  {
    rules: {
      "no-console": 0,
      "vue/html-self-closing": "off",
      "vue/multi-word-component-names": "off",
      // oxfmt owns attribute layout — this rule fights it (join/split loop)
      "vue/max-attributes-per-line": "off",
      // `any` is allowed but flagged — type it at the boundaries over time.
      "@typescript-eslint/no-explicit-any": "warn",
    },
  },
  {
    // Machine-enforce the Vitest test conventions (AGENTS.md · vitest.dev
    // /guide/learn/writing-tests-with-ai) so review doesn't have to.
    files: ["**/*.test.ts", "test/**"],
    plugins: { vitest },
    rules: {
      ...vitest.configs.recommended.rules,
      // tests mock true boundaries with `any` by convention
      "@typescript-eslint/no-explicit-any": "off",
      // a committed it.only silently disables the rest of the file — block it
      "vitest/no-focused-tests": "error",
      // every test must assert something (catches the lazy no-expect "test")
      "vitest/expect-expect": "error",
      "vitest/no-identical-title": "error",
    },
  },
)
