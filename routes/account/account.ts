import { Hono } from "hono"
import type { Variables } from "../../data/variables"
import database from "../../util/database/database"
import mailer from "../../util/mailer"
import auth from "../../middleware/auth"
import picture from "./picture"

const app = new Hono<{ Variables: Variables }>()

app.route("/picture", picture)

app.post("/", async (c) => {
    const { email, password, name, birthday, address, role } =
        await c.req.json()
    if (!email || !password || !name || !birthday || !address || !role) {
        c.status(400)
        return c.text("")
    }
    const encrypted = await Bun.password.hash(password, "bcrypt")
    const response = await database.createAccount(
        email,
        encrypted,
        name,
        birthday,
        address,
        role
    )
    if (response.error) {
        c.status(response.error == 1062 ? 409 : 500)
        return c.text("")
    }
    const connection = response.result!
    const result = await mailer.sendRegisterMail(name, email)
    if (!result) {
        await database.cancelTransaction(connection)
        c.status(500)
        return c.text("")
    }
    await database.completeTransaction(connection)
    return c.text("")
})

app.use(auth.authenticate)

app.get("/", async (c) => {
    const { include_picture } = c.req.query()
    const id = c.get("id")
    const response = await database.getAccount(id)
    if (response.error) {
        c.status(500)
        return c.text("")
    }
    if (!response.result) {
        c.status(404)
        return c.text("")
    }
    const role = await database.getRole(id)
    if (role.error) {
        c.status(500)
        return c.text("")
    }
    if (role.result?.name == "teacher") {
        const teacher = await database.getTeacher(id)
        if (teacher.error) {
            c.status(500)
            return c.text("")
        }
        response.result.teacher = teacher.result
    }
    if (role.result?.name == "student") {
        const student = await database.getStudent(id)
        if (student.error) {
            c.status(500)
            return c.text("")
        }
        response.result.student = student.result
    }
    if (include_picture == "true") {
        const picture = await database.getPicture(id)
        if (picture.error) {
            c.status(500)
            return c.text("")
        }
        response.result.picture = picture.result?.picture.toString("base64")
    }
    c.status(200)
    return c.json(response.result)
})

app.get("/:id", async (c) => {
    const { id } = c.req.param()
    if (!id) {
        c.status(400)
        return c.text("")
    }
    const response = await database.getAccount(parseInt(id))
    if (response.error) {
        c.status(500)
        return c.text("")
    }
    if (!response.result) {
        c.status(404)
        return c.text("")
    }
    return c.json(response.result)
})

app.put("/", async (c) => {
    const { name, birthday, address } = await c.req.json()
    if (!name || !birthday || !address) {
        c.status(400)
        return c.text("")
    }
    const id = c.get("id")
    const response = await database.updateAccount(id, name, birthday, address)
    if (response.error) {
        c.status(500)
        return c.text("")
    }
    return c.text("")
})

app.delete("/", async (c) => {
    const id = c.get("id")
    const response = await database.deleteAccount(id)
    if (response.error) {
        c.status(500)
        return c.text("")
    }
    return c.text("")
})

export default app
