<script setup lang="ts">
import type { NuxtError } from "#app"
import { fr } from "@nuxt/ui/locale"

const props = defineProps<{
  error: NuxtError
}>()

const is404 = computed(() => props.error.status === 404)
const title = computed(() => (is404.value ? "Page introuvable" : "Une erreur est survenue"))

useSeoMeta({
  title,
  description: computed(() =>
    is404.value
      ? "Désolé, cette page n'existe pas."
      : "Désolé, quelque chose s'est mal passé. Réessayez dans un instant.",
  ),
})

useHead({
  htmlAttrs: {
    lang: "fr",
  },
})
</script>

<template>
  <UApp :locale="fr">
    <UError :error="error" />
  </UApp>
</template>
