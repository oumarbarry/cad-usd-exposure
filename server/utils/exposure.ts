export type Balance = { currency?: { code?: string } | null; cash?: number | null }

export type Position = {
  instrument?: { kind?: string; symbol?: string; description?: string | null } | null
  units?: string | null
  price?: string | null
  currency?: string | null
  cash_equivalent?: boolean
}

export type Account = {
  id: string
  name?: string | null
  institution_name?: string | null
  balances: Balance[]
  positions: Position[]
}

// CAD per one unit of each currency.
export type Rates = Record<string, number>

// Options, futures and CFDs need a multiplier and their notional is not their
// value, so they are listed as not counted instead of being guessed at.
const VALUED_KINDS = new Set(["stock", "etf", "mutualfund", "cef", "adr", "crypto"])

export function buildExposure(accounts: Account[], rates: Rates) {
  const holdings: {
    account: string
    label: string
    description: string
    currency: string
    value: number
    valueCad: number
  }[] = []
  const notCounted: { account: string; label: string; reason: string }[] = []

  function add(row: Omit<(typeof holdings)[number], "valueCad">) {
    const rate = row.currency === "CAD" ? 1 : rates[row.currency]
    if (rate === undefined) {
      notCounted.push({
        account: row.account,
        label: row.label,
        reason: `no ${row.currency || "currency"} rate`,
      })
      return
    }
    holdings.push({ ...row, valueCad: row.value * rate })
  }

  for (const account of accounts) {
    const name = account.name || account.institution_name || "Account"

    for (const balance of account.balances) {
      if (!balance.cash) continue
      const currency = balance.currency?.code ?? ""
      add({ account: name, label: "Cash", description: "", currency, value: balance.cash })
    }

    for (const position of account.positions) {
      const kind = position.instrument?.kind ?? ""
      const label = position.instrument?.symbol ?? "Unknown"
      // Money market funds and the like are already inside the cash balance.
      if (position.cash_equivalent || kind === "cash") continue
      if (!VALUED_KINDS.has(kind)) {
        notCounted.push({ account: name, label, reason: `${kind || "unknown"} position` })
        continue
      }
      const value = Number(position.units) * Number(position.price)
      if (!Number.isFinite(value) || position.price == null) {
        notCounted.push({ account: name, label, reason: "no price" })
        continue
      }
      add({
        account: name,
        label,
        description: position.instrument?.description ?? "",
        currency: position.currency ?? "",
        value,
      })
    }
  }

  const totalCad = holdings.reduce((sum, row) => sum + row.valueCad, 0)
  const byCurrency = new Map<string, number>()
  for (const row of holdings) {
    byCurrency.set(row.currency, (byCurrency.get(row.currency) ?? 0) + row.valueCad)
  }
  const currencies = [...byCurrency]
    .map(([currency, valueCad]) => ({
      currency,
      valueCad,
      share: totalCad > 0 ? valueCad / totalCad : 0,
      rate: currency === "CAD" ? 1 : rates[currency]!,
    }))
    .sort((a, b) => b.valueCad - a.valueCad)

  return {
    totalCad,
    foreignCad: totalCad - (byCurrency.get("CAD") ?? 0),
    currencies,
    holdings: holdings.sort((a, b) => b.valueCad - a.valueCad),
    notCounted,
  }
}
