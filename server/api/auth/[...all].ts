import { auth } from "../../utils/auth"

// Better Auth catch-all: mounts every auth endpoint under /api/auth/**.
export default defineEventHandler((event) => {
  return auth.handler(toWebRequest(event))
})
