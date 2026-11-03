import type { auth } from "~~/server/utils/auth"

type Session = Awaited<ReturnType<typeof auth.api.getSession>>

// Wraps a GET to /api/auth/get-session (Better Auth) and exposes a reactive user.
export function useSession() {
  const session = useState<Session>("better-auth-session", () => null)
  async function fetchSession() {
    try {
      // During SSR, plain $fetch does not forward the incoming request's
      // cookies, so Better Auth would see no session. Forward them explicitly
      // (per the Better Auth Nuxt docs) so the session resolves on the server.
      const headers = import.meta.server ? useRequestHeaders(["cookie"]) : undefined
      const r = await $fetch<Session>("/api/auth/get-session", { headers })
      session.value = r
    } catch {
      session.value = null
    }
    return session.value
  }
  return { session, fetchSession }
}
