import { drizzle } from "drizzle-orm/postgres-js"
import postgres from "postgres"
import * as schema from "../db/schema"

export { schema }

// postgres-js connects lazily: the app boots without a reachable DB; only
// queries (auth, admin routes) require it. Explicit pool limits so several
// services can share one small PostgreSQL instance.
const client = postgres(process.env.DATABASE_URL!, {
  max: 10,
  idle_timeout: 20,
  connect_timeout: 10,
})

export const db = drizzle({ client })
