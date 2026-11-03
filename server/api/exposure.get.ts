import { auth } from "../utils/auth"
import { buildExposure } from "../utils/exposure"
import { requireAuth } from "../utils/require-auth"
import { fetchAccounts, fetchRates } from "../utils/snaptrade"

// Computed on each request and never stored: no brokerage data reaches the DB.
export default defineEventHandler(async (event) => {
  await requireAuth(event)
  const { accessToken } = await auth.api.getAccessToken({
    body: { providerId: "snaptrade" },
    headers: event.headers,
  })
  // ponytail: a 401 here sends the user back through consent, no refresh-and-retry.
  const [accounts, { date, rates }] = await Promise.all([fetchAccounts(accessToken), fetchRates()])
  return { ...buildExposure(accounts, rates), accountCount: accounts.length, ratesDate: date }
})
