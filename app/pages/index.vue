<script setup lang="ts">
const { session, fetchSession } = useSession()
await fetchSession()

const route = useRoute()
const connecting = ref(false)

async function connect() {
  connecting.value = true
  const { url } = await $fetch<{ url: string }>("/api/auth/sign-in/oauth2", {
    method: "POST",
    body: { providerId: "snaptrade", callbackURL: "/", errorCallbackURL: "/" },
  })
  window.location.href = url
}
</script>

<template>
  <main class="mx-auto max-w-5xl px-4 py-6 sm:px-8 sm:py-10">
    <PortfolioExposure v-if="session?.user" :email="session.user.email" />

    <template v-else>
      <p class="label border-b-3 border-ink pb-2">CAD/USD Exposure</p>
      <h1
        class="font-display mt-8 text-[clamp(2.5rem,8vw,5.5rem)] leading-[0.95] tracking-tight uppercase"
      >
        How much of your portfolio is outside Canadian dollars?
      </h1>
      <p class="mt-8 max-w-2xl">
        Connect your brokerage through SnapTrade. You get the split of your cash and holdings by
        currency, valued in CAD at the Bank of Canada rate.
      </p>

      <p v-if="route.query.error" class="mt-6 font-semibold text-alert" role="alert">
        The connection did not complete ({{ route.query.error }}). Nothing was saved. You can try
        again.
      </p>

      <button class="btn mt-8" :disabled="connecting" @click="connect">
        {{ connecting ? "Opening SnapTrade" : "Connect with SnapTrade" }}
      </button>

      <dl class="mt-12 grid border-t-3 border-ink sm:grid-cols-3">
        <div class="border-b border-rule py-4 sm:border-r sm:pr-4">
          <dt class="label">Reads</dt>
          <dd class="mt-2 text-sm">Accounts, balances and positions.</dd>
        </div>
        <div class="border-b border-rule py-4 sm:border-r sm:px-4">
          <dt class="label">Cannot do</dt>
          <dd class="mt-2 text-sm">
            Place orders or move money. The app never asks for the trade permission.
          </dd>
        </div>
        <div class="border-b border-rule py-4 sm:pl-4">
          <dt class="label">Keeps</dt>
          <dd class="mt-2 text-sm">
            Your SnapTrade email and encrypted tokens. No brokerage data. Disconnect deletes both.
          </dd>
        </div>
      </dl>
    </template>
  </main>
</template>
