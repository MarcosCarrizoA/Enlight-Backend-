import { cors } from "hono/cors"
import { Hono } from "hono"
import { poweredBy } from "hono/powered-by"
import { logger } from "hono/logger"
import type { Variables } from "./data/variables"
import account from "./routes/account/account"
import teacher from "./routes/teacher"
import chat from "./routes/chat"
import reservation from "./routes/reservation"
import search from "./routes/search"
import passwordReset from "./routes/password_reset"
import credential from "./routes/credential"
import subject from "./routes/subject"
import categories from "./routes/categories"
import rating from "./routes/rating"

const app = new Hono<{ Variables: Variables }>()

app.use(cors())

app.use(poweredBy())

app.use(logger())

app.get("/test", (c) => c.text("API is running correctly."))

app.route("/account", account)

app.route("/teacher", teacher)

app.route("/categories", categories)

app.route("/subject", subject)

app.route("/search", search)

app.route("/reservation", reservation)

app.route("/chat", chat)

app.route("/password-reset", passwordReset)

app.route("/rating", rating)

app.route("/", credential)

Bun.serve({
    fetch: app.fetch,
    port: 80,
})

console.log("Server is running at http://localhost")
