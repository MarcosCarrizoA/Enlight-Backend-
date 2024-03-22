require("dotenv").config();
const express = require("express");
const pass = require("./util/password");
const mysql = require("mysql2");
const nodemailer = require("nodemailer");
const path = require("path");

const pool = mysql.createPool({
    host: "127.0.0.1",
    port: 3307,
    user: "enlight",
    password: process.env.PASSWORD,
    database: "enlight",
    connectionLimit: 3
});

const transporter = nodemailer.createTransport({
    service: "gmail",
    secure: true,
    auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASSWORD
    }
});

const app = express();

app.use(express.json());

app.get("/account", async (req, res) => {
    const { email, password } = req.query;
    if (email == undefined || password == undefined) {
        res.status(400).send();
        return;
    }
    pool.getConnection((err, connection) => {
        if (err) {
            console.error(err);
            res.status(500).send();
            return;
        }
        connection.query("SELECT * FROM account WHERE email = ?", [email], async (err, result, fields) => {
            if (err) {
                console.error(err);
                res.status(500).send();
                connection.release();
                return;
            }
            if (result.length == 0) {
                res.status(404).send();
                connection.release();
                return;
            }
            const verified = await pass.verify(password, result[0].password);
            if (!verified) {
                res.status(401).send();
                connection.release();
                return;
            }
            res.status(200).send(result[0]);
            connection.release();
        });
    });
});

app.post("/account", async (req, res) => {
    const { email, password, name, birth_date, address } = req.body;
    if (email == undefined || password == undefined || name == undefined || birth_date == undefined || address == undefined) {
        res.status(400).send();
        return;
    }
    const encrypted = await pass.encrypt(password);
    pool.getConnection((err, connection) => {
        if (err) {
            console.error(err);
            res.status(500).send();
            return;
        }
        connection.beginTransaction((err) => {
            if (err) {
                console.error(err);
                res.status(500).send();
                connection.release();
                return;
            }
            connection.query("INSERT INTO ACCOUNT VALUES (NULL, ?, ?, ?, ?, ?)", [email, encrypted, name, birth_date, address], (err, result, fields) => {
                if (err && err.errno == 1062) {
                    console.error(err);
                    res.status(409).send();
                    connection.rollback();
                    connection.release();
                    return;
                } else if (err) {
                    console.error(err);
                    res.status(500).send();
                    connection.rollback();
                    connection.release();
                    return;
                }
                transporter.sendMail({
                    from: process.env.MAIL_USER,
                    to: email,
                    subject: "Enlight Registration",
                    text: `Hi ${name}, thanks for signing in to Enlight! If you didn't do this action, click here to delete your account.`
                }, (error, info) => {
                    if (error) {
                        console.error(error);
                        res.status(500).send();
                        connection.rollback();
                        connection.release();
                        return;
                    }
                    connection.commit((err) => {
                        if (err) {
                            console.error(err);
                            res.status(500).send();
                            connection.release();
                            return;
                        }
                        res.status(200).send();
                        connection.release();
                    });
                });
            });
        });
    });
});

app.put("/account", async (req, res) => {

});

app.delete("/account", async (req, res) => {

});

app.post("/password-reset/request", async (req, res) => {
    const { email } = req.body;
    if (email == undefined) {
        res.status(400).send();
        return;
    }
    transporter.sendMail({
        from: "enlightnoreply@gmail.com",
        to: email,
        subject: "Enlight Password Reset",
        html: "<p><a href=http://18.229.107.19/password-reset/123>Click here</a> to reset your password. If this wasn't you, please change your password.</p>"
    }, (error, info) => {
        if (error) {
            console.error(error);
            res.status(500).send();
            return;
        }
        res.status(200).send();
    });
});

app.get("/password-reset/:token", async (req, res) => {
    res.status(200).sendFile(path.join(__dirname, "/password-reset.html"));
});

app.post("/password-reset", async (req, res) => {
    const { token, password } = req.body;
    if (token == undefined) {
        res.status(400).send();
        return;
    }
    pool.getConnection((err, connection) => {
        if (err) {
            console.error(err);
            res.status(500).send();
            return;
        }
        connection.beginTransaction(async (err) => {
            if (err) {
                console.error(err);
                res.status(500).send();
                connection.release();
                return;
            }
            const encrypted = await pass.encrypt(password);
            connection.query()
        });
    });
});

app.listen(80, () => {
    console.log("Server is running at http://localhost");
});