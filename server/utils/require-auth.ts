import type { H3Event } from "h3"
import { auth } from "./auth"

// Every protected server route starts with this call.
export async function requireAuth(event: H3Event) {
  const session = await auth.api.getSession({ headers: event.headers })
  if (!session?.user) {
    throw createError({ statusCode: 401, statusMessage: "unauthorized" })
  }
  return session
}
