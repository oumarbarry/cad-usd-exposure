<script setup lang="ts">
defineProps<{ email: string }>()

const { data, status, error, refresh } = useLazyFetch("/api/exposure", { server: false })

// en-US prints CA$, where en-CA prints a bare $ that reads as USD on this page.
const cad = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "CAD",
  maximumFractionDigits: 0,
})
const number = new Intl.NumberFormat("en-CA", { maximumFractionDigits: 2 })
const percent = new Intl.NumberFormat("en-CA", { style: "percent", maximumFractionDigits: 0 })

const foreignShare = computed(() =>
  data.value?.totalCad ? data.value.foreignCad / data.value.totalCad : 0,
)

// Black for CAD so the foreign part is what stands out.
const barColors = ["bg-alert", "bg-rule", "bg-ink/40"]
function barColor(currency: string, index: number) {
  return currency === "CAD" ? "bg-ink text-paper" : barColors[index % barColors.length]
}

const disconnecting = ref(false)

async function disconnect() {
  disconnecting.value = true
  await $fetch("/api/disconnect", { method: "POST" })
  window.location.href = "/"
}
</script>

<template>
  <div>
    <header class="flex items-center justify-between gap-4 border-b-3 border-ink pb-2">
      <p class="label truncate">CAD/USD Exposure / {{ email }}</p>
      <button class="btn btn-ghost shrink-0" :disabled="disconnecting" @click="disconnect">
        Disconnect
      </button>
    </header>

    <p v-if="status === 'pending' || status === 'idle'" class="mt-10" role="status">
      Reading your accounts.
    </p>

    <div v-else-if="error" class="mt-10" role="alert">
      <p v-if="error.statusCode === 401">
        SnapTrade no longer accepts this connection. Disconnect, then connect again.
      </p>
      <p v-else>SnapTrade or the brokerage did not answer.</p>
      <button class="btn mt-4" @click="refresh()">Try again</button>
    </div>

    <div v-else-if="data && data.accountCount === 0" class="mt-10">
      <h1 class="font-display text-4xl uppercase">No accounts yet</h1>
      <p class="mt-4 max-w-xl">
        Your SnapTrade workspace has no brokerage connection. Add one in the
        <a class="underline" href="https://dashboard.snaptrade.com">SnapTrade dashboard</a>, then
        come back.
      </p>
      <button class="btn mt-6" @click="refresh()">Check again</button>
    </div>

    <template v-else-if="data">
      <section class="mt-8">
        <h1 class="font-display text-[clamp(5rem,22vw,13rem)] leading-[0.85] tracking-tighter">
          {{ percent.format(foreignShare) }}
        </h1>
        <p class="mt-4 max-w-2xl text-lg">
          of your {{ cad.format(data.totalCad) }} portfolio is outside Canadian dollars.
        </p>
      </section>

      <div
        class="mt-8 flex h-14 border-3 border-ink"
        role="img"
        :aria-label="
          data.currencies.map((c) => `${c.currency} ${percent.format(c.share)}`).join(', ')
        "
      >
        <div
          v-for="(c, index) in data.currencies.filter((row) => row.share > 0)"
          :key="c.currency"
          class="flex items-center overflow-hidden px-2 text-sm font-semibold"
          :class="barColor(c.currency, index)"
          :style="{ width: `${c.share * 100}%` }"
        >
          {{ c.currency }}
        </div>
      </div>

      <p class="mt-8 border-l-8 border-alert pl-4">
        If foreign currencies fall 5% against the Canadian dollar, this portfolio loses
        <strong>{{ cad.format(data.foreignCad * 0.05) }}</strong
        >, before any change in the assets themselves.
      </p>

      <section class="mt-12">
        <h2 class="label mb-2">By currency</h2>
        <table class="data">
          <thead>
            <tr>
              <th>Currency</th>
              <th class="num">Rate to CAD</th>
              <th class="num">Value in CAD</th>
              <th class="num">Share</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="c in data.currencies" :key="c.currency">
              <td>{{ c.currency }}</td>
              <td class="num">{{ c.rate }}</td>
              <td class="num">{{ cad.format(c.valueCad) }}</td>
              <td class="num">{{ percent.format(c.share) }}</td>
            </tr>
          </tbody>
        </table>
      </section>

      <section class="mt-12">
        <h2 class="label mb-2">Holdings</h2>
        <div class="overflow-x-auto">
          <table class="data">
            <thead>
              <tr>
                <th>Holding</th>
                <th>Account</th>
                <th class="num">Value</th>
                <th class="num">In CAD</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in data.holdings" :key="`${row.account}-${row.label}-${row.currency}`">
                <td>{{ row.label }}</td>
                <td>{{ row.account }}</td>
                <td class="num">{{ number.format(row.value) }} {{ row.currency }}</td>
                <td class="num">{{ cad.format(row.valueCad) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section v-if="data.notCounted.length" class="mt-12">
        <h2 class="label mb-2">Not counted</h2>
        <ul class="text-sm">
          <li v-for="row in data.notCounted" :key="`${row.account}-${row.label}`">
            {{ row.label }} in {{ row.account }}: {{ row.reason }}
          </li>
        </ul>
      </section>

      <p class="mt-12 border-t border-rule pt-4 text-xs">
        Currency is the one your broker prices each position in. VFV.TO is priced in CAD but holds
        US stocks, so your real exposure can be higher than shown. Rates: Bank of Canada daily
        average, {{ data.ratesDate }}. Balances are as of SnapTrade's last sync.
      </p>
    </template>
  </div>
</template>
