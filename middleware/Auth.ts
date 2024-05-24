import type { MiddlewareHandler } from "hono/types"
import { decodeAccessToken, decodeRefreshToken } from "../util/token"

const authenticate: MiddlewareHandler = async (c, next) => {
    const authHeader = c.req.header("Authorization")
    const accessToken = authHeader?.split("Bearer ")[1]
    if (!accessToken) {
        c.status(401)
        return c.text("")
    }
    const decoded = await decodeAccessToken(accessToken!)
    if (!decoded) {
        c.status(401)
        return c.text("")
    }
    c.set("id", decoded)
    await next()
}

const refresh: MiddlewareHandler = async (c, next) => {
    const authHeader = c.req.header("Authorization")
    const refreshToken = authHeader?.split("Bearer ")[1]
    if (!refreshToken) {
        c.status(401)
        return c.text("")
    }
    const decoded = await decodeRefreshToken(refreshToken!)
    if (!decoded) {
        c.status(401)
        return c.text("")
    }
    c.set("token", refreshToken)
    c.set("id", decoded)
    await next()
}

export default { authenticate, refresh }
