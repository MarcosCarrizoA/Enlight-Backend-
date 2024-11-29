import { Hono } from "hono"
import type { Variables } from "../../data/variables"
import database from "../../util/database/database"
import mailer from "../../util/mailer"
import auth from "../../middleware/auth"
import picture from "./picture"
import {
    badRequestStatus,
    internalServerErrorStatus,
} from "../../data/constants"

const app = new Hono<{ Variables: Variables }>()

app.route("/picture", picture)

app.post("/", async (c) => {
    const { email, password, name, birthday, address, role } =
        await c.req.json()
    if (!email || !password || !name || !birthday || !address || !role) {
        c.status(400)
        return c.text(badRequestStatus)
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
        console.log(response.error)
        return c.text(
            response.error == 1062
                ? "Email already exists."
                : internalServerErrorStatus
        )
    }
    const connection = response.result!
    const result = await mailer.sendRegisterMail(name, email)
    if (!result) {
        await database.cancelTransaction(connection)
        c.status(500)
        return c.text(internalServerErrorStatus)
    }
    await database.completeTransaction(connection)
    return c.text("Account created.")
})

app.use(auth.authenticate)

app.get("/", async (c) => {
    const { include_picture } = c.req.query()
    const id = c.get("id")
    const response = await database.getAccount(id)
    if (response.error) {
        c.status(500)
        return c.text(internalServerErrorStatus)
    }
    if (!response.result) {
        c.status(404)
        return c.text("Account not found.")
    }
    const role = await database.getRole(id)
    if (role.error) {
        c.status(500)
        return c.text(internalServerErrorStatus)
    }
    if (include_picture == "true") {
        const picture = await database.getPicture(id)
        if (picture.error) {
            c.status(500)
            return c.text(internalServerErrorStatus)
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
        return c.text(badRequestStatus)
    }
    const response = await database.getAccount(parseInt(id))
    if (response.error) {
        c.status(500)
        return c.text(internalServerErrorStatus)
    }
    if (!response.result) {
        c.status(404)
        return c.text("Account not found.")
    }
    return c.json(response.result)
})

app.put("/", async (c) => {
    const { name, birthday, address } = await c.req.json()
    if (!name || !birthday || !address) {
        c.status(400)
        return c.text("Bad Request. Please check your input.")
    }
    const id = c.get("id")
    const response = await database.updateAccount(id, name, birthday, address)
    if (response.error) {
        c.status(500)
        return c.text("Internal Server Error. Please try again later.")
    }
    return c.text("Your account was successfully updated.")
})

app.delete("/", async (c) => {
    const id = c.get("id")
    const response = await database.deleteAccount(id)
    if (response.error) {
        c.status(500)
        return c.text(internalServerErrorStatus)
    }
    return c.text("Account deleted.")
})

export default app
