import auth from "./middleware/Auth";
import database from "./Database";
import type { Database } from "./Database";
import mailer from "./Mailer";
import type { Mailer } from "./Mailer";
import { cors } from "hono/cors";
import { Hono } from "hono";
import token from "./Token";
import { poweredBy } from "hono/powered-by";

type Variables = {
    id: number;
    token: string;
}

const db: Database = database();

const mail: Mailer = mailer();

const app = new Hono<{ Variables: Variables }>();

app.use(cors());

app.use(poweredBy());

// Unprotected endpoints
app.get("/test", (c) => {
    return c.text("API is running correctly.");
});

app.get("/sasi", (c) => {
    return c.text("hola")
})

app.post("/login", async (c) => {
    const { email, password } = await c.req.json();
    if (!email || !password) {
        c.status(400);
        return c.text("");
    }
    const response = await db.getCredentials(email);
    if (response.error) {
        c.status(500);
        return c.text("");
    }
    if (!response.result) {
        c.status(404);
        return c.text("");
    }
    const verified = await Bun.password.verify(password, response.result.password, "bcrypt");
    if (!verified) {
        c.status(401);
        return c.text("");
    }
    const accessToken = await token.signAccessToken(response.result.id);
    const refreshToken = await token.signRefreshToken(response.result.id);
    if (!accessToken || !refreshToken) {
        c.status(500);
        return c.text("");
    }
    const result = await db.insertRefreshToken(refreshToken);
    if (result.error) {
        c.status(500);
        return c.text("");
    }
    return c.json({ access_token: accessToken, refresh_token: refreshToken });
});

app.post("/account", async (c) => {
    const { email, password, name, birthday, address, role } = await c.req.json();
    if (!email || !password || !name || !birthday || !address || !role) {
        c.status(400);
        return c.text("");
    }
    const encrypted = await Bun.password.hash(password, "bcrypt");
    const response = await db.createAccount(email, encrypted, name, birthday, address, role);
    if (response.error) {
        c.status(response.error == 1062 ? 409 : 500);
        return c.text("");
    }
    const connection = response.result;
    const result = await mail.sendRegisterMail(name, email);
    if (!result) {
        connection!.rollback((error) => {
            connection!.release();
        });
        c.status(500);
        return c.text("");
    }
    return c.text("");
});

// Password Reset
app.post("/password-reset/request", async (c) => {
    const { email } = await c.req.json();
    if (!email) {
        c.status(400);
        return c.text("");
    }
    const response = await db.getAccountId(email);
    if (response.error) {
        c.status(500);
        return c.text("");
    }
    if (!response.result) {
        c.status(404);
        return c.text("");
    }
    const signed = await token.signPasswordToken(response.result.id);
    if (!signed) {
        c.status(500);
        return c.text("");
    }
    const result = await mail.sendRecoveryMail(signed, email);
    if (!result) {
        c.status(500);
        return c.text("");
    }
    return c.text("");
});

app.get("/password-reset/:token", async (c) => {
    const file = Bun.file("./pages/password-reset.html");
    const text = await file.text();
    return c.html(text);
});

app.post("/password-reset/:token", async (c) => {
    const data = await c.req.formData();
    const password: string = data.get("password") as string;
    const accessToken = c.req.param("token");
    if (password == undefined || token == undefined) {
        c.status(400);
        return c.text("");
    }
    const decoded = await token.decodePasswordToken(accessToken);
    if (decoded.error) {
        const file = Bun.file(decoded.error == "TokenExpiredError" ? "./pages/token-expired.html" : "./pages/invalid-token.html");
        const text = await file.text();
        // c.status(401).sendFile(path.join(__dirname, "/pages/invalid-token.html"));
        c.status(401);
        return c.html(text);
    }
    const encrypted = await Bun.password.hash(password, "bcrypt");
    const response = await db.updatePassword(decoded.id!, encrypted);
    if (response.error) {
        c.status(500);
        return c.text("");
    }
    const file = Bun.file("./pages/successful-reset.html");
    const text = await file.text();
    return c.html(text);
});

app.get("/logout", auth.refresh, async (c) => {
    const token = c.get("token");
    const response = await db.deleteRefreshToken(token);
    if (response.error) {
        c.status(500);
        return c.text("");
    }
    return c.text("");
});

app.get("/refresh", auth.refresh, async (c) => {
    const accessToken = c.get("token");
    const response = await db.getRefreshToken(accessToken);
    if (response.error) {
        c.status(500);
        return c.text("");
    }
    if (!response.result) {
        c.status(401);
    }
    const id = c.get("id");
    const signed = await token.signAccessToken(id);
    if (!signed) {
        c.status(500);
        return c.text("");
    }
    return c.json({ access_token: signed });
});

// Protected endpoints
app.use(auth.authenticate);

app.get("/verify", async (c) => {
    return c.text("");
});

// Account
app.get("/account", async (c) => {
    const id = c.get("id");
    const response = await db.getAccount(id);
    if (response.error) {
        c.status(500);
        return c.text("");
    }
    if (!response.result) {
        c.status(404);
        return c.text("");
    }
    c.status(200);
    return c.json(response.result);
});

app.put("/account", async (c) => {
    const { name, birthday, address } = await c.req.json();
    if (!name || !birthday || !address) {
        c.status(400);
        return c.text("");
    }
    const id = c.get("id");
    const response = await db.updateAccount(id, name, birthday, address);
    if (response.error) {
        c.status(500);
        return c.text("");
    }
    return c.text("");
});

app.delete("/account", async (context) => {
    const id = context.get("id")
    const response = await db.deleteAccount(id);
    if (response.error) {
        context.status(500);
        return context.text("");
    }
    return context.text("");
});

// Teacher
app.get("/teacher", async (c) => {
    const id = await c.get("id");
    const response = await db.getTeacher(id);
    if (response.error) {
        c.status(500);
        return c.text("");
    }
    if (!response.result) {
        c.status(404);
        return c.text("");
    }
    c.status(200);
    return c.json(response.result);
});

app.put("/teacher", async (c) => {
    const { description, profile_picture } = await c.req.json();
    if (description == undefined || profile_picture == undefined) {
        c.status(400);
        return c.text("");
    }
    const id = c.get("id");
    const response = await db.updateTeacher(id, description, profile_picture);
    if (response.error) {
        c.status(500);
        return c.text("");
    }
    return c.text("");
});

Bun.serve({
    fetch: app.fetch,
    port: 80,
});

console.log("Server is running at http://localhost");