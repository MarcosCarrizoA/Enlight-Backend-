import { Hono } from "hono"
import database from "../util/database/database"
import auth from "../middleware/auth"
import type { Variables } from "../data/variables"

const app = new Hono<{ Variables: Variables }>()

app.use(auth.authenticate)

app.get("/", async (c) => {
    const { id } = c.req.query()
    const teacher = await database.getTeacherPublic(Number(id))
    if (teacher.error) {
        c.status(500)
        return c.text("")
    }
    delete teacher.result?.account_id
    c.status(200)
    return c.json(teacher.result)
})

app.put("/", async (c) => {
    const { description } = await c.req.json()
    if (description == undefined) {
        c.status(400)
        return c.text("")
    }
    const id = c.get("id")
    const response = await database.updateTeacher(id, description)
    if (response.error) {
        c.status(500)
        return c.text("")
    }
    return c.text("")
})

export default app
