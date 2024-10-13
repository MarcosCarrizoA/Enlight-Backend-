import { Hono } from "hono"
import type { Variables } from "../data/variables"
import auth from "../middleware/auth"
import database from "../util/database/database"
import { signAccessToken, signRefreshToken } from "../util/token"

const app = new Hono<{ Variables: Variables }>()

app.post("/login", async (c) => {
    const { email, password } = await c.req.json()
    if (!email || !password) {
        c.status(400)
        return c.text("Bad request. Please try again.")
    }
    const response = await database.getCredentials(email)
    if (response.error) {
        c.status(500)
        return c.text("Internal server error. Please try again later.")
    }
    if (!response.result) {
        c.status(401)
        return c.text("Invalid email or password. Please try again.")
    }
    const verified = await Bun.password.verify(
        password,
        response.result.password,
        "bcrypt"
    )
    if (!verified) {
        c.status(401)
        return c.text("Invalid email or password. Please try again.")
    }
    const accessToken = await signAccessToken(response.result.id)
    const refreshToken = await signRefreshToken(response.result.id)
    if (!accessToken || !refreshToken) {
        c.status(500)
        return c.text("Internal server error. Please try again later.")
    }
    const result = await database.insertRefreshToken(refreshToken)
    if (result.error) {
        c.status(500)
        return c.text("Internal server error. Please try again later.")
    }
    return c.json({
        account_id: response.result.id,
        access_token: accessToken,
        refresh_token: refreshToken,
        role: response.result.role_id,
    })
})

app.get("/verify", auth.authenticate, async (c) => {
    return c.text("Token verified.")
})

app.use(auth.refresh)

app.get("/refresh", async (c) => {
    const accessToken = c.get("token")
    const response = await database.getRefreshToken(accessToken)
    if (response.error) {
        c.status(500)
        return c.text("Internal server error. Please try again later.")
    }
    if (!response.result) {
        c.status(401)
    }
    const id = c.get("id")
    const signed = await signAccessToken(id)
    if (!signed) {
        c.status(500)
        return c.text("Internal server error. Please try again later.")
    }
    return c.json({ access_token: signed })
})

app.get("/logout", async (c) => {
    const token = c.get("token")
    const response = await database.deleteRefreshToken(token)
    if (response.error) {
        c.status(500)
        return c.text("Internal server error. Please try again later.")
    }
    return c.text("You have been logged out.")
})

export default app
