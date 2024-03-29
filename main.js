require("dotenv").config();
const express = require("express");
const pass = require("./util/password");
const mysql = require("mysql2");
const nodemailer = require("nodemailer");
const path = require("path");
const jwt = require("jsonwebtoken");
const auth = require("./middleware/authenticate");
const database = require("./database");
const mailer = require("./mailer");

const db = database();

const mail = mailer();

const app = express();

app.use(express.json());

app.use(express.urlencoded({ extended: true }));

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
    if (!response.ok) {
        res.status(response.error).send();
        return;
    }
    const verified = await pass.verify(password, response.result.password);
    if (!verified) {
        res.status(401).send();
        return;
    }
    jwt.sign({ id: response.result.id }, process.env.ACCESS_TOKEN_KEY, { expiresIn: 900 }, (error, accessToken) => {
        if (error) {
            console.error(error);
            res.status(500).send();
            return;
        }
        jwt.sign({ id: response.result.id }, process.env.REFRESH_TOKEN_KEY, async (error, refreshToken) => {
            if (error) {
                console.error(error);
                res.status(500).send();
                return;
            }
            const token = await db.insertRefreshToken(refreshToken);
            if (!token.ok) {
                res.status(token.error).send();
                return;
            }
            res.status(200).send({ access_token: accessToken, refresh_token: refreshToken });
        });
    });
});

app.post("/account", async (req, res) => {
    const { email, password, name, birth_date, address, role } = req.body;
    if (email == undefined || password == undefined || name == undefined || birth_date == undefined || address == undefined || role == undefined) {
        res.status(400).send();
        return;
    }
    const encrypted = await pass.encrypt(password);
    const response = await db.createAccount(email, encrypted, name, birth_date, address, role);
    if (!response.ok) {
        res.status(response.error).send();
        return;
    }
    const connection = response.result;
    const result = await mail.sendRegisterMail(name, email);
    if (!result.ok) {
        connection.rollback();
        connection.release();
        res.status(500).send();
        return;
    }
    connection.commit();
    connection.release();
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
    if (!response.ok) {
        res.status(response.error).send();
        return;
    }
    jwt.sign({ id: response.result }, process.env.PASSWORD_TOKEN_KEY, { expiresIn: 900 }, async (error, token) => {
        if (error) {
            console.error(error);
            res.status(500).send();
            return;
        }
        const result = await mail.sendRecoveryMail(token, email);
        if (!result.ok) {
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
    jwt.verify(token, process.env.PASSWORD_TOKEN_KEY, async (error, decoded) => {
        if (error && error.name == "TokenExpiredError") {
            console.error(error);
            res.status(401).sendFile(path.join(__dirname, "/pages/token-expired.html"));
            return;
        }
        if (error) {
            console.error(error);
            res.status(401).sendFile(path.join(__dirname + "/pages/invalid-token.html"));
            return;
        }
        const encrypted = await pass.encrypt(password);
        const response = await db.updatePassword(decoded.id, encrypted);
        if (!response.ok) {
            res.status(response.error).send();
            return;
        }
        res.status(200).send();
    });
});

app.get("/logout", auth.refresh, async (req, res) => {
    const response = await db.deleteRefreshToken(req.body.token);
    if (!response.ok) {
        res.status(response.error).send();
        return;
    }
    res.status(200).send();
});

app.get("/refresh", auth.refresh, async (req, res) => {
    const response = await db.getRefreshToken(req.body.token);
    if (!response.ok) {
        res.status(response.error).send();
        return;
    }
    jwt.sign({ id: req.body.id }, process.env.ACCESS_TOKEN_KEY, { expiresIn: 900 }, (error, accessToken) => {
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
    if (!response.ok) {
        res.status(response.error).send();
        return;
    }
    delete response.result.id;
    delete response.result.password;
    res.status(200).send(response.result);
});

app.put("/account", async (req, res) => {

});

app.delete("/account", async (req, res) => {

});

// Teacher
app.get("/teacher", async (req, res) => {
    const response = await db.getTeacher(req.body.id);
    if (!response.ok) {
        res.status(response.error).send();
        return;
    }
    delete response.result.id;
    res.status(200).send(response.result);
});

app.put("/teacher", async (req, res) => {
    const { description, profile_picture } = req.body;
    if (description == undefined || profile_picture == undefined) {
        res.status(400).send();
        return;
    }
    const response = await db.updateTeacher();
    if (!response.ok) {
        res.status(response.error).send();
        return;
    }
    res.status(200).send();
});

app.listen(80, () => {
    console.log("Server is running at http://localhost");
});