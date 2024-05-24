import { Hono } from "hono"
import type { Variables } from "../data/variables"
import database from "../util/database/database"
import auth from "../middleware/auth"

const app = new Hono<{ Variables: Variables }>()

app.use(auth.authenticate)

app.get("/", async (c) => {
    const id = c.get("id")
    const role = await database.getRole(id)
    if (role.error) {
        c.status(500)
        return c.text("")
    }
    const response =
        role.result?.name == "student"
            ? await database.getStudentChats(id)
            : role.result?.name == "teacher"
            ? await database.getTeacherChats(id)
            : null
    if (!response || response.error) {
        c.status(500)
        return c.text("")
    }
    for (const account of response.result!) {
        const picture = await database.getPicture(account.id)
        if (picture.error) {
            c.status(500)
            return c.text("")
        }
        account.picture = picture.result?.picture.toString("base64")
    }
    const json = { id: id, chats: response.result }
    return c.json(json)
})

app.post("/", async (c) => {
    const id = c.get("id")
    const { receiver_id } = await c.req.json()
    if (!receiver_id) {
        c.status(400)
        return c.text("")
    }
    const role = await database.getRole(id)
    if (role.error) {
        c.status(500)
        return c.text("")
    }
    const receiverRole = await database.getRole(receiver_id)
    if (receiverRole.error) {
        c.status(500)
        return c.text("")
    }
    if (role.result?.name == receiverRole.result?.name) {
        c.status(403)
        return c.text("")
    }
    const studentId = role.result?.name == "student" ? id : receiver_id
    const teacherId = role.result?.name == "teacher" ? id : receiver_id
    const response = await database.createChat(studentId, teacherId)
    if (response.error) {
        c.status(response.error == 1062 ? 409 : 500)
        return c.text("")
    }
    return c.text("Chat created successfully.")
})

export default app
