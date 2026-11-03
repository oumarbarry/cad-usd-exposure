// Applies pending SQL migrations. Idempotent. Run with `bun run db:migrate:deploy`.
import { drizzle } from "drizzle-orm/postgres-js"
import { migrate } from "drizzle-orm/postgres-js/migrator"
import postgres from "postgres"

const client = postgres(process.env.DATABASE_URL!, { max: 1 })
await migrate(drizzle({ client }), { migrationsFolder: "./server/db/migrations" })
await client.end()
console.log("migrations applied")
