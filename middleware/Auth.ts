import type { MiddlewareHandler } from "hono/types";
import token from "../Token";

const authenticate: MiddlewareHandler = async (c, next) => {
    const authHeader = c.req.header("Authorization");
    const accessToken = authHeader?.split("Bearer ")[1];
    if (!accessToken) {
        c.status(401);
        return c.text("");
    }
    const decoded = await token.decodeAccessToken(accessToken!);
    if (!decoded) {
        c.status(401);
        return c.text("");
    }
    c.set("id", decoded);
    await next();
}

const refresh: MiddlewareHandler = async (c, next) => {
    const authHeader = c.req.header("Authorization");
    const refreshToken = authHeader?.split("Bearer ")[1];
    if (!refreshToken) {
        c.status(401);
        return c.text("");
    }
    const decoded = await token.decodeRefreshToken(refreshToken!);
    if (!decoded) {
        c.status(401);
        return c.text("");
    }
    c.set("token", refreshToken);
    c.set("id", decoded);
    await next();
}

export default { authenticate, refresh };