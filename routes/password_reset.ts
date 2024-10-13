import { Hono } from "hono"
import database from "../util/database/database"
import mailer from "../util/mailer"
import { decodePasswordToken, signPasswordToken } from "../util/token"
import type { Variables } from "../data/variables"
import { badRequestStatus, internalServerErrorStatus } from "../data/constants"

const app = new Hono<{ Variables: Variables }>()

app.post("/request", async (c) => {
    const { email } = await c.req.json()
    if (!email) {
        c.status(400)
        return c.text(badRequestStatus)
    }
    const response = await database.getAccountId(email)
    if (response.error) {
        c.status(500)
        return c.text(internalServerErrorStatus)
    }
    if (!response.result) {
        c.status(200)
        return c.text("Reset password request sent. Check your email to reset your password.")
    }
    const signed = await signPasswordToken(response.result.id)
    if (!signed) {
        c.status(500)
        return c.text(internalServerErrorStatus)
    }
    const result = await mailer.sendRecoveryMail(signed, email)
    if (!result) {
        c.status(500)
        return c.text(internalServerErrorStatus)
    }
    return c.text("Reset password request sent. Check your email to reset your password.")
})

app.get("/:token", async (c) => {
    const file = Bun.file("./pages/password-reset.html")
    const text = await file.text()
    return c.html(text)
})

app.post("/:token", async (c) => {
    const data = await c.req.formData()
    const password: string = data.get("password") as string
    const passwordToken = c.req.param("token")
    if (password == undefined || passwordToken == undefined) {
        c.status(400)
        return c.text(badRequestStatus)
    }
    const decoded = await decodePasswordToken(passwordToken)
    if (decoded.error) {
        const file = Bun.file(
            decoded.error == "TokenExpiredError"
                ? "./pages/token-expired.html"
                : "./pages/invalid-token.html"
        )
        const text = await file.text()
        c.status(401)
        return c.html(text)
    }
    const encrypted = await Bun.password.hash(password, "bcrypt")
    const response = await database.updatePassword(decoded.id!, encrypted)
    if (response.error) {
        c.status(500)
        return c.text(internalServerErrorStatus)
    }
    const file = Bun.file("./pages/successful-reset.html")
    const text = await file.text()
    return c.html(text)
})

export default app
