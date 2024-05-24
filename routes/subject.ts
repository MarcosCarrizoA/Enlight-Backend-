import { Hono } from "hono"
import type { Variables } from "../data/variables"
import database from "../util/database/database"
import auth from "../middleware/auth"

const app = new Hono<{ Variables: Variables }>()

app.use(auth.authenticate)

app.get("/:id", async (c) => {
    const { id } = c.req.param()
    if (!id || !parseInt(id)) {
        c.status(400)
        return c.text("")
    }
    const response = await database.getSubject(parseInt(id))
    if (response.error) {
        c.status(500)
        return c.text("")
    }
    return c.json(response.result)
})

app.post("/", async (c) => {
    const { category_name, name, description, price, days } = await c.req.json()
    if (!category_name || !name || !description || !price || !days) {
        c.status(400)
        return c.text("")
    }
    const id = c.get("id")
    const response = await database.createSubject(
        id,
        category_name,
        name,
        description,
        price,
        days
    )
    if (response.error) {
        c.status(500)
        return c.text("")
    }
    return c.text(response.result!.toString())
})

app.delete("/", async (c) => {
    const { id } = await c.req.json()
    if (!id) {
        c.status(400)
        return c.text("")
    }
    const accountId = c.get("id")
    const response = await database.deleteSubject(accountId, id)
    if (response.error) {
        c.status(500)
        return c.text("")
    }
    return c.text("")
})

export default app
