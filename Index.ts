import dotenv from "dotenv";
import express from "express";
import type { Express, Request, Response } from "express";
import jwt from "jsonwebtoken";
import auth from "./middleware/Auth";
import type { Token } from "./middleware/Auth";
import database from "./Database";
import type { Database } from "./Database";
import mailer from "./Mailer";
import type { Mailer } from "./Mailer";
import cors from "cors";
import path from "path";


dotenv.config();

const db: Database = database();

const mail: Mailer = mailer();

const app: Express = express();

app.use(express.json());

app.use(express.urlencoded({ extended: true }));

app.use(cors({ origin: true }));

// Unprotected endpoints
app.get("/test", async (req, res) => {
    res.status(200).send("API is running correctly.");
});

app.post("/login", async (req, res) => {
    const { email, password } = req.body;
    if (email == undefined || password == undefined) {
        res.status(400).send();
        return;
    }
    const response = await db.getCredentials(email);
    if (response.error) {
        res.status(500).send();
        return;
    }
    if (!response.result) {
        res.status(404).send();
        return;
    }

    const verified = await Bun.password.verify(password, response.result.password, "bcrypt");
    if (!verified) {
        res.status(401).send();
        return;
    }
    jwt.sign({ id: response.result.id }, process.env.ACCESS_TOKEN_KEY!, { expiresIn: 900 }, (error, accessToken) => {
        if (error) {
            console.error(error);
            res.status(500).send();
            return;
        }
        jwt.sign({ id: response.result!.id }, process.env.REFRESH_TOKEN_KEY!, async (error: any, refreshToken: any) => {
            if (error) {
                console.error(error);
                res.status(500).send();
                return;
            }
            const token = await db.insertRefreshToken(refreshToken);
            if (token.error) {
                res.status(500).send();
                return;
            }
            res.status(200).send({ access_token: accessToken, refresh_token: refreshToken });
        });
    });
});

app.post("/account", async (req, res) => {
    const { email, password, name, birthday, address, role } = req.body;
    if (email == undefined || password == undefined || name == undefined || birthday == undefined || address == undefined || role == undefined) {
        res.status(400).send();
        return;
    }
    const encrypted = await Bun.password.hash(password, "bcrypt");
    const response = await db.createAccount(email, encrypted, name, birthday, address, role);
    if (response.error) {
        res.status(response.error == 1062 ? 409 : 500).send();
        return;
    }
    const connection = response.result;
    const result = await mail.sendRegisterMail(name, email);
    if (!result) {
        connection!.rollback((error) => {
            if (error) {
                console.error(error);
                connection!.release();
                res.status(500).send();
                return;
            }
            connection!.release();
            res.status(500).send();
            return;
        });
    }
    connection!.commit();
    connection!.release();
    res.status(200).send();
});

// Password Reset
app.post("/password-reset/request", async (req, res) => {
    const { email } = req.body;
    if (email == undefined) {
        res.status(400).send();
        return;
    }
    const response = await db.getAccountId(email);
    if (response.error) {
        res.status(500).send();
        return;
    }
    if (!response.result) {
        res.status(404).send();
        return;
    }
    jwt.sign({ id: response.result }, process.env.PASSWORD_TOKEN_KEY!, { expiresIn: 900 }, async (error, token) => {
        if (error) {
            console.error(error);
            res.status(500).send();
            return;
        }
        const result = await mail.sendRecoveryMail(token!, email);
        if (!result) {
            res.status(500).send();
            return;
        }
        res.status(200).send();
    });
});

app.get("/password-reset/:token", async (req, res) => {
    res.status(200).sendFile(path.join(__dirname, "/pages/password-reset.html"));
});

app.post("/password-reset/:token", async (req, res) => {
    const { password } = req.body;
    const { token } = req.params;
    if (password == undefined || token == undefined) {
        res.status(400).send();
        return;
    }
    jwt.verify(token, process.env.PASSWORD_TOKEN_KEY!, async (error, decoded) => {
        if (error && error.name == "TokenExpiredError") {
            console.error(error);
            res.status(401).sendFile(path.join(__dirname, "/pages/token-expired.html"));
            return;
        }
        if (error) {
            console.error(error);
            res.status(401).sendFile(path.join(__dirname, "/pages/invalid-token.html"));
            return;
        }
        const encrypted = await Bun.password.hash(password, "bcrypt");
        const response = await db.updatePassword((decoded as Token).id, encrypted);
        if (response.error) {
            res.status(500).send();
            return;
        }
        res.status(200).sendFile(path.join(__dirname, "/pages/successful-reset.html"));
    });
});

app.get("/logout", auth.refresh, async (req, res) => {
    const response = await db.deleteRefreshToken(req.body.token);
    if (response.error) {
        res.status(500).send();
        return;
    }
    res.status(200).send();
});

app.get("/refresh", auth.refresh, async (req, res) => {
    const response = await db.getRefreshToken(req.body.token);
    if (response.error) {
        res.status(500).send();
        return;
    }
    if (!response.result) {
        res.status(401).send();
    }
    jwt.sign({ id: req.body.id }, process.env.ACCESS_TOKEN_KEY!, { expiresIn: 900 }, (error, accessToken) => {
        if (error) {
            console.error(error);
            res.status(500).send();
            return;
        }
        res.status(200).send({ access_token: accessToken });
    });
});

// Protected endpoints
app.use(auth.authenticate);

app.get("/verify", async (req, res) => {
    res.status(200).send();
});

// Account
app.get("/account", async (req, res) => {
    const response = await db.getAccount(req.body.id);
    if (response.error) {
        res.status(500).send();
        return;
    }
    if (!response.result) {
        res.status(404).send();
        return;
    }
    res.status(200).send(response.result);
});

app.put("/account", async (req, res) => {
    const { name, birthday, address } = req.body;
    if (name == undefined || birthday == undefined || address == undefined) {
        res.status(400).send();
        return;
    }
    const response = await db.updateAccount(req.body.id, name, birthday, address);
    if (response.error) {
        res.status(500).send();
        return;
    }
    res.status(200).send();
});

app.delete("/account", async (req, res) => {

});

// Teacher
app.get("/teacher", async (req, res) => {
    const response = await db.getTeacher(req.body.id);
    if (response.error) {
        res.status(500).send();
        return;
    }
    if (!response.result) {
        res.status(404).send();
        return;
    }
    res.status(200).send(response.result);
});

app.put("/teacher", async (req, res) => {
    const { description, profile_picture } = req.body;
    if (description == undefined || profile_picture == undefined) {
        res.status(400).send();
        return;
    }
    const response = await db.updateTeacher(req.body.id, description, profile_picture);
    if (response.error) {
        res.status(500).send();
        return;
    }
    res.status(200).send();
});

app.listen(80, () => {
    console.log("Server is running at http://localhost");
});