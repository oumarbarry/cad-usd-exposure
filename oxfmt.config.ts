import { defineConfig } from "oxfmt"

export default defineConfig({
  semi: false,
  // agent skills are vendored content, drizzle migrations are generated: never format them
  ignorePatterns: [".agents/skills/**", ".claude/skills/**", "server/db/migrations/**"],
})
