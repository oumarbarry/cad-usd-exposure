import { createLocalJWKSet, exportJWK, generateKeyPair, SignJWT } from "jose"
import { expect, it } from "vitest"
import { verifyIdToken } from "../server/utils/id-token"

const { publicKey, privateKey } = await generateKeyPair("RS256")
const jwks = createLocalJWKSet({
  keys: [{ ...(await exportJWK(publicKey)), kid: "k", alg: "RS256" }],
})

function sign(claims: Record<string, unknown>, issuer = "https://api.snaptrade.com") {
  return new SignJWT({ email: "a@b.c", email_verified: true, ...claims })
    .setProtectedHeader({ alg: "RS256", kid: "k" })
    .setIssuer(issuer)
    .setAudience("client")
    .setSubject("user-1")
    .setIssuedAt()
    .setExpirationTime("5m")
    .sign(privateKey)
}

const options = { jwks, clientId: "client", nonce: "n" }

it("accepts a valid token", async () => {
  const claims = await verifyIdToken(await sign({ nonce: "n" }), options)
  expect(claims).toMatchObject({ sub: "user-1", email: "a@b.c" })
})

it("rejects a wrong nonce, a wrong issuer and a missing nonce cookie", async () => {
  await expect(verifyIdToken(await sign({ nonce: "x" }), options)).rejects.toThrow()
  await expect(
    verifyIdToken(await sign({ nonce: "n" }, "https://evil.test"), options),
  ).rejects.toThrow()
  await expect(
    verifyIdToken(await sign({ nonce: "n" }), { ...options, nonce: null }),
  ).rejects.toThrow()
})
