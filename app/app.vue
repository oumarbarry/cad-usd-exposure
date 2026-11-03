<script setup lang="ts">
const { siteName, siteDescription } = useRuntimeConfig().public

useHead({
  meta: [
    { charset: "utf-8" },
    { name: "viewport", content: "width=device-width, initial-scale=1" },
  ],
  link: [{ rel: "icon", type: "image/svg+xml", href: "/favicon.svg" }],
  htmlAttrs: {
    lang: "en",
  },
})

useSeoMeta({
  title: siteName,
  description: siteDescription,
  ogTitle: siteName,
  ogDescription: siteDescription,
})
</script>

<template>
  <UApp>
    <NuxtPage />
  </UApp>
</template>
