import type { Account, Balance, Position, Rates } from "./exposure"

const API = "https://api.snaptrade.com"

// Every SnapTrade call goes through this GET: the app has no code path that can
// write to the brokerage, and its token has no `trade` scope anyway.
function get<T>(path: string, token: string) {
  return $fetch<T>(path, {
    baseURL: API,
    headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
  })
}

export async function fetchAccounts(token: string): Promise<Account[]> {
  const accounts = await get<Omit<Account, "balances" | "positions">[]>("/accounts", token)
  return Promise.all(
    accounts.map(async (account) => {
      const [balances, positions] = await Promise.all([
        get<Balance[]>(`/accounts/${account.id}/balances`, token),
        get<{ results: Position[] }>(`/accounts/${account.id}/positions/all`, token),
      ])
      return { ...account, balances, positions: positions.results }
    }),
  )
}

type Observation = { d: string } & Record<string, { v: string } | string>

// The group also returns discontinued series as older, separate observations,
// so the first one is not the latest. Those currencies end up as "no rate".
export function parseRates(observations: Observation[]) {
  const { d: date, ...series } = observations.reduce((a, b) => (b.d > a.d ? b : a))
  const rates: Rates = {}
  for (const [name, entry] of Object.entries(series)) {
    const currency = /^FX(\w{3})CAD$/.exec(name)?.[1]
    if (currency && typeof entry !== "string") rates[currency] = Number(entry.v)
  }
  return { date, rates }
}

// Bank of Canada daily average rates: official, free, no key, CAD based.
export async function fetchRates() {
  const { observations } = await $fetch<{ observations: Observation[] }>(
    "https://www.bankofcanada.ca/valet/observations/group/FX_RATES_DAILY/json?recent=1",
  )
  return parseRates(observations)
}

export async function revoke(refreshToken: string) {
  const { SNAPTRADE_CLIENT_ID: id, SNAPTRADE_CLIENT_SECRET: secret } = process.env
  await $fetch("/oauth/revoke_token/", {
    baseURL: API,
    method: "POST",
    headers: { Authorization: `Basic ${btoa(`${id}:${secret}`)}` },
    body: new URLSearchParams({ token: refreshToken, token_type_hint: "refresh_token" }),
  })
}
