import { expect, it } from "vitest"
import { buildExposure } from "../server/utils/exposure"

const stock = (symbol: string, units: string, price: string, currency: string) => ({
  instrument: { kind: "stock", symbol },
  units,
  price,
  currency,
})

it("converts cash and positions to CAD and splits them by currency", () => {
  const result = buildExposure(
    [
      {
        id: "a",
        name: "TFSA",
        balances: [{ currency: { code: "CAD" }, cash: 100 }],
        positions: [stock("AAPL", "2", "100", "USD"), stock("VFV.TO", "1", "100", "CAD")],
      },
    ],
    { USD: 1.5 },
  )
  expect(result.totalCad).toBe(500)
  expect(result.foreignCad).toBe(300)
  expect(result.currencies).toMatchObject([
    { currency: "USD", valueCad: 300, share: 0.6 },
    { currency: "CAD", valueCad: 200, share: 0.4 },
  ])
})

it("does not count a cash equivalent twice", () => {
  const result = buildExposure(
    [
      {
        id: "a",
        balances: [{ currency: { code: "CAD" }, cash: 100 }],
        positions: [{ ...stock("MMF", "100", "1", "CAD"), cash_equivalent: true }],
      },
    ],
    {},
  )
  expect(result.totalCad).toBe(100)
  expect(result.notCounted).toEqual([])
})

it("lists what it cannot value instead of guessing", () => {
  const result = buildExposure(
    [
      {
        id: "a",
        name: "Margin",
        balances: [],
        positions: [
          { instrument: { kind: "option", symbol: "AAPL C" }, units: "1", price: "5" },
          stock("NOPRICE", "1", null as never, "USD"),
          stock("BMW.DE", "1", "100", "XXX"),
        ],
      },
    ],
    { USD: 1.5 },
  )
  expect(result.totalCad).toBe(0)
  expect(result.notCounted.map((row) => row.reason)).toEqual([
    "option position",
    "no price",
    "no XXX rate",
  ])
})
