import type { JWTVerifyGetKey } from "jose"
import { jwtVerify } from "jose"

type Options = { jwks: JWTVerifyGetKey; clientId: string; nonce: string | null | undefined }

// Checks everything the guide lists: signature, iss, aud, exp and nonce.
export async function verifyIdToken(idToken: string | undefined, options: Options) {
  if (!idToken || !options.nonce) throw Object.assign(new Error(), { code: "missing_token" })
  const { payload } = await jwtVerify<{ email: string; email_verified: boolean; nonce: string }>(
    idToken,
    options.jwks,
    {
      algorithms: ["RS256"],
      issuer: "https://api.snaptrade.com",
      audience: options.clientId,
      requiredClaims: ["sub", "email", "exp", "iat"],
    },
  )
  if (payload.nonce !== options.nonce) throw Object.assign(new Error(), { code: "bad_nonce" })
  return payload as typeof payload & { sub: string }
}
