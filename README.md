# CAD/USD Exposure

A Canadian investor often holds US stocks and US dollars across several accounts without knowing the total. This app answers one question: how much of my portfolio is outside Canadian dollars, and what does a 5% currency move cost me?

Sign in with SnapTrade, grant read access, get the answer. Nuxt 4, Better Auth, Postgres.

## Decisions

**OAuth instead of a Commercial integration.** The user already owns their SnapTrade connections, so the app has no user registration, no `userSecret` and no Connection Portal to embed.

**Read only, enforced by the grant.** The scopes are `openid email read`. The token cannot trade. `server/utils/snaptrade.ts` only has a GET helper, plus the revoke call.

**Better Auth's generic OAuth plugin for the flow.** It handles state, PKCE, code exchange, token encryption and refresh. It lacks two things SnapTrade asks for, added in `server/utils/auth.ts`: a `nonce`, and real `id_token` verification (`server/utils/id-token.ts`). The default only decodes the token. The `id_token` is dropped after verification, so it never reaches the database.

**Tokens in Postgres, encrypted.** A cookie-only setup would remove the database, but the refresh token would then leave the server. The guide says it must not.

**No brokerage data is stored.** `/api/exposure` computes the result on each request. The only stored rows are the user, the session and the encrypted tokens. Disconnect revokes the grant at SnapTrade and deletes all of them.

**Bank of Canada for rates.** Official, free, no key, already quoted in CAD. They are daily averages, which is fine for an exposure figure.

**What counts.** Cash per currency plus stocks, ETFs, funds, ADRs and crypto at `units x price`. Cash equivalents are skipped because they are already in the cash balance. Options, futures and CFDs are listed as not counted: their notional is not their value.

## Known limits

- Currency means the currency the broker prices the position in. VFV.TO is priced in CAD and holds US stocks. Look-through would need fund holdings data.
- A SnapTrade 401 asks the user to reconnect. There is no refresh-and-retry, because Better Auth already refreshes an expired token before each call.
- Two parallel requests at token expiry could race on the rotating refresh token. The page makes one request, so a per-user lock is not worth it yet.
- The OAuth app is a Test app: 5 users at most.

## Run it

```bash
docker run -d --name cad-usd-pg -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=app -p 4711:5432 postgres:17-alpine
cp .env.example .env   # fill in the secrets
bun install
bun run db:migrate:deploy
bun run dev            # http://localhost:4710
bun run test
```

Register `http://localhost:4710/api/auth/oauth2/callback/snaptrade` in the SnapTrade dashboard. To test without a real broker, connect the Sandbox broker in a Personal workspace.
