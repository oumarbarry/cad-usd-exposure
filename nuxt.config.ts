export default defineNuxtConfig({
  compatibilityDate: "latest",
  devtools: { enabled: true },

  css: ["~/assets/css/main.css"],

  modules: ["@nuxt/eslint", "@nuxt/ui", "@vueuse/nuxt"],

  experimental: {
    typescriptPlugin: true,
    typedPages: true,
    // Nuxt 4.5: single shared file watcher between Nuxt and Vite (faster dev, fewer FS handles)
    watcher: "builder",
  },

  runtimeConfig: {
    // Server-only secrets (DATABASE_URL, BETTER_AUTH_*, SNAPTRADE_*) are read
    // directly from process.env in server code: not via runtimeConfig. Only
    // `public` lives here because those values must reach the browser; each
    // default is overridable at runtime by the matching NUXT_PUBLIC_* env var.
    public: {
      siteName: "CAD/USD Exposure",
      siteDescription: "How much of your portfolio is outside Canadian dollars.",
    },
  },

  colorMode: {
    preference: "light",
    fallback: "light",
  },

  // Sourcemaps: server-only in dev, none in prod builds: the default makes
  // prod builds memory-heavy (OOMs in CI / small Docker VMs).
  $development: { sourcemap: { server: true, client: false } },
  sourcemap: false,

  typescript: {
    nodeTsConfig: {
      include: ["../drizzle.config.ts", "../vitest.config.ts", "../oxfmt.config.ts"],
    },
  },

  nitro: {
    // Node-side unit tests + scripts import server/utils: typecheck them in
    // the server context (nitro types + ~~ alias).
    typescript: {
      tsConfig: { include: ["../test/*.ts", "../scripts/**/*.ts"] },
    },
  },
})
