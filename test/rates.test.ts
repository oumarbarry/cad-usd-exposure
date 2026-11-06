import { expect, it } from "vitest"
import { parseRates } from "../server/utils/snaptrade"

it("uses the latest observation, not the first one", () => {
  const result = parseRates([
    { d: "2019-12-31", FXVNDCAD: { v: "0.000056" } },
    { d: "2026-11-05", FXUSDCAD: { v: "1.3989" }, FXEURCAD: { v: "1.5703" } },
    { d: "2026-04-30", FXRUBCAD: { v: "0.01819" } },
  ])
  expect(result).toEqual({ date: "2026-11-05", rates: { USD: 1.3989, EUR: 1.5703 } })
})
