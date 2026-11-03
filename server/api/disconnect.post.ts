import type { AuthContext } from "better-auth"
import { decryptOAuthToken } from "better-auth/oauth2"
import { and, eq } from "drizzle-orm"
import { auth } from "../utils/auth"
import { db, schema } from "../utils/db"
import { requireAuth } from "../utils/require-auth"
import { revoke } from "../utils/snaptrade"

// Revokes the grant at SnapTrade, then deletes the user. Accounts and sessions
// cascade, so nothing about this person is left in the DB.
export default defineEventHandler(async (event) => {
  const { user } = await requireAuth(event)
  const [account] = await db
    .select()
    .from(schema.accounts)
    .where(and(eq(schema.accounts.userId, user.id), eq(schema.accounts.providerId, "snaptrade")))
  if (account?.refreshToken) {
    const context = (await auth.$context) as unknown as AuthContext
    await revoke(await decryptOAuthToken(account.refreshToken, context))
  }
  await db.delete(schema.users).where(eq(schema.users.id, user.id))
  return { ok: true }
})
