import type { H3Event } from "h3"
import { expect, it, vi } from "vitest"
import { requireAuth } from "../server/utils/require-auth"
import { auth } from "../server/utils/auth"

// Mock the true boundary (Better Auth session lookup), not internals.
vi.mock("../server/utils/auth", () => ({
  auth: { api: { getSession: vi.fn() } },
}))

const event = { headers: new Headers() } as unknown as H3Event

it("throws 401 when there is no session", async () => {
  vi.mocked(auth.api.getSession).mockResolvedValue(null as never)
  await expect(requireAuth(event)).rejects.toMatchObject({ statusCode: 401 })
})
