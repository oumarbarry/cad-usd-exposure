import { getCurrentAuthContext } from "@better-auth/core/context"
import { betterAuth } from "better-auth"
import { drizzleAdapter } from "better-auth/adapters/drizzle"
import { genericOAuth } from "better-auth/plugins/generic-oauth"
import { createRemoteJWKSet } from "jose"
import * as schema from "../db/schema"
import { db } from "./db"
import { verifyIdToken } from "./id-token"

const NONCE_COOKIE = "snaptrade_nonce"

// jose caches the keys and refetches on an unknown `kid`, as the guide asks.
const jwks = createRemoteJWKSet(new URL("https://api.snaptrade.com/.well-known/jwks.json"))

// `secret` (BETTER_AUTH_SECRET) is read from env automatically and intentionally
// NOT passed here: hardcoding `process.env.X || ""` would defeat Better Auth's
// built-in rejection of missing / placeholder / low-entropy secrets.
export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL,

  advanced: { cookiePrefix: "cad-usd-exposure" },

  database: drizzleAdapter(db, {
    provider: "pg",
    // Explicit Better Auth model → Drizzle table map: our table exports are
    // plural while Better Auth's model names are singular.
    schema: {
      user: schema.users,
      account: schema.accounts,
      session: schema.sessions,
      verification: schema.verifications,
    },
  }),

  account: { encryptOAuthTokens: true },

  plugins: [
    genericOAuth({
      config: [
        {
          providerId: "snaptrade",
          clientId: process.env.SNAPTRADE_CLIENT_ID!,
          clientSecret: process.env.SNAPTRADE_CLIENT_SECRET!,
          discoveryUrl: "https://api.snaptrade.com/.well-known/openid-configuration",
          // `read` is the whole grant: without `trade` the token cannot place orders.
          scopes: ["openid", "email", "read"],
          pkce: true,
          authentication: "basic",

          // The plugin has no nonce support, so it travels in its own cookie.
          authorizationUrlParams: (ctx) => {
            const nonce = crypto.randomUUID()
            ctx.setCookie(NONCE_COOKIE, nonce, {
              httpOnly: true,
              secure: ctx.context.baseURL.startsWith("https://"),
              sameSite: "lax",
              path: "/",
              maxAge: 600,
            })
            return { nonce }
          },

          // SnapTrade has no userinfo endpoint and the plugin's default only
          // decodes the id_token, so verify it here.
          getUserInfo: async (tokens) => {
            const ctx = await getCurrentAuthContext()
            const claims = await verifyIdToken(tokens.idToken, {
              jwks,
              clientId: process.env.SNAPTRADE_CLIENT_ID!,
              nonce: ctx.getCookie?.(NONCE_COOKIE),
            }).catch((error) => {
              ctx.context.logger.error("id_token rejected", error.code)
              return null
            })
            // The guide says to discard the id_token once verified: dropping it
            // here keeps it out of the accounts table.
            delete tokens.idToken
            if (!claims) return null
            return {
              id: claims.sub,
              email: claims.email,
              emailVerified: claims.email_verified,
              // Better Auth requires a name, and we don't ask for `profile`.
              name: claims.email,
            }
          },
        },
      ],
    }),
  ],
})
