import { Hono } from "hono"
import database from "../util/database/database"
import type { Variables } from "../data/variables"
import auth from "../middleware/auth"

const app = new Hono<{ Variables: Variables }>()

app.use(auth.authenticate)

app.get("/", async (c) => {
    const response = await database.getCategories()
    if (response.error) {
        c.status(500)
        return c.text("Internal server error. Please try again later.")
    }
    return c.json(response.result)
})

export default app
