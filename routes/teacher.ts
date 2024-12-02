import { Hono } from "hono"
import database from "../util/database/database"
import auth from "../middleware/Auth"
import type { Variables } from "../data/variables"
import { badRequestStatus, internalServerErrorStatus } from "../data/constants"
import type { DatabaseResponse, TeacherPublic } from "../util/database/interfaces"

const app = new Hono<{ Variables: Variables }>()

app.use(auth.authenticate)

app.get("/", async (c) => {
    const id = c.get("id")
    const response = await database.getTeacher(id)
    if (response.error) {
        c.status(500)
        return c.text(internalServerErrorStatus)
    }
    if (response.result) {
        if (response.result.subjects === null || response.result.subjects === undefined) {
            response.result.subjects = []
        }
    }
    return c.json(response.result)
})

app.get("/:id", async (c) => {
    const { id } = c.req.param()
    const teacher: DatabaseResponse<TeacherPublic> = await database.getTeacherPublic(Number(id))
    if (teacher.error) {
        c.status(500)
        return c.text(internalServerErrorStatus)
    }
    delete teacher.result?.account_id
    c.status(200)
    if (teacher.result?.rating === null) {
        teacher.result.rating = 0.0
    }
    if (teacher.result) {
        if (teacher.result.subjects === null || teacher.result.subjects === undefined) {
            teacher.result.subjects = []
        }
    }
    return c.json(teacher.result)
})

app.put("/", async (c) => {
    const { description } = await c.req.json()
    if (description == undefined) {
        c.status(400)
        return c.text(badRequestStatus)
    }
    const id = c.get("id")
    const response = await database.updateTeacher(id, description)
    if (response.error) {
        c.status(500)
        return c.text(internalServerErrorStatus)
    }
    return c.text("Teacher updated.")
})

export default app
