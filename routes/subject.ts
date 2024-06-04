import { Hono } from "hono"
import type { Variables } from "../data/variables"
import database from "../util/database/database"
import auth from "../middleware/auth"

const app = new Hono<{ Variables: Variables }>()

app.use(auth.authenticate)

app.get("/:id", async (c) => {
    const { id } = c.req.param()
    const include_timeslot = c.req.query("include_timeslot")
    if (!id || !parseInt(id) || !include_timeslot) {
        c.status(400)
        return c.text("")
    }
    if (include_timeslot === "true") {
        const response = await database.getSubjectForTimeSlot(parseInt(id))
        if (response.error) {
            c.status(500)
            return c.text("")
        }
        return c.json(response.result)
    }
    const response = await database.getSubject(parseInt(id))
    if (response.error) {
        c.status(500)
        return c.text("")
    }
    return c.json(response.result)
})

app.post("/", async (c) => {
    const { category_name, name, description, price, days, modality, size } =
        await c.req.json()
    if (
        !category_name ||
        !name ||
        !description ||
        !price ||
        !days ||
        !modality ||
        !size
    ) {
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
        days,
        modality,
        size
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
