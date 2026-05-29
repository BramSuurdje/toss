import { INTERNAL_API_KEY_HEADER } from "@transferflow/shared"
import { Hono } from "hono"
import { cors } from "hono/cors"
import { logger } from "hono/logger"

import { env } from "./env"
import { connectRedis } from "./lib/redis"
import { sharesRoutes } from "./routes/shares"
import { startExpirySweeper, startKeyspaceExpiryListener } from "./workers/expiry"

const app = new Hono()

app.use("*", logger())
app.use(
  "*",
  cors({
    origin: env.webOrigin,
    allowMethods: ["GET", "POST", "OPTIONS"],
    allowHeaders: ["Content-Type", INTERNAL_API_KEY_HEADER],
  })
)

app.get("/health", (c) => c.json({ ok: true }))
app.route("/shares", sharesRoutes)

await connectRedis()
startKeyspaceExpiryListener()
startExpirySweeper()

const server = Bun.serve({
  port: env.port,
  fetch: app.fetch,
})

console.log(`API listening on http://localhost:${server.port}`)
