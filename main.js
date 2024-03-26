require("dotenv").config();
const express = require("express");
const pass = require("./util/password");
const mysql = require("mysql2");
const nodemailer = require("nodemailer");
const path = require("path");
const jwt = require("jsonwebtoken");

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

app.use(express.urlencoded({ extended: true }));

app.get("/verify", async (req, res) => {
    const authHeader = req.headers.authorization;
    if (authHeader == undefined) {
        res.status(400).send();
        return;
    }
    const token = authHeader.split("Bearer ")[1];
    if (token == undefined) {
        res.status(400).send();
        return;
    }
    jwt.verify(token, process.env.JWT_KEY, (error, decoded) => {
        if (error) {
            console.error(error);
            res.status(401).send();
            return;
        }
        res.status(200).send();
    });
});

app.post("/login", async (req, res) => {
    const { email, password } = req.body;
    if (email == undefined || password == undefined) {
        res.status(400).send();
        return;
    }
    pool.getConnection((error, connection) => {
        if (error) {
            console.error(error);
            res.status(500).send();
            return;
        }
        connection.query("SELECT id, password FROM account WHERE email = ?", [email], async (error, result, fields) => {
            if (error) {
                console.error(error);
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
            connection.release();
            jwt.sign({ id: result[0].id }, process.env.JWT_KEY, { expiresIn: 900 }, (error, token) => {
                if (error) {
                    console.error(error);
                    res.status(500).send();
                    return;
                }
                res.status(200).send(token);
            });
        });
    });
});

app.get("/account", async (req, res) => {
    const authHeader = req.headers.authorization;
    if (authHeader == undefined) {
        res.status(400).send();
        return;
    }
    const token = authHeader.split("Bearer ")[1];
    if (token == undefined) {
        res.status(400).send();
        return;
    }
    jwt.verify(token, process.env.JWT_KEY, (error, decoded) => {
        if (error) {
            console.error(error);
            res.status(401).send();
            return;
        }
        pool.getConnection((error, connection) => {
            if (error) {
                console.error(error);
                res.status(500).send();
                return;
            }
            connection.query("SELECT * FROM account WHERE id = ?", [decoded.id], async (error, result, fields) => {
                if (error) {
                    console.error(error);
                    res.status(500).send();
                    connection.release();
                    return;
                }
                if (result.length == 0) {
                    res.status(404).send();
                    connection.release();
                    return;
                }
                delete result[0].password;
                res.status(200).send(result[0]);
                connection.release();
            });
        });
    });
});

app.post("/account", async (req, res) => {
    const { email, password, name, birth_date, address, role } = req.body;
    if (email == undefined || password == undefined || name == undefined || birth_date == undefined || address == undefined || role == undefined) {
        res.status(400).send();
        return;
    }
    pool.getConnection((error, connection) => {
        if (error) {
            console.error(error);
            res.status(500).send();
            return;
        }
        connection.beginTransaction(async (error) => {
            if (error) {
                console.error(error);
                res.status(500).send();
                connection.release();
                return;
            }
            const encrypted = await pass.encrypt(password);
            connection.query("INSERT INTO account VALUES (NULL, ?, ?, ?, ?, ?)", [email, encrypted, name, birth_date, address], (error, result, fields) => {
                if (error && error.errno == 1062) {
                    console.error(error);
                    res.status(409).send();
                    connection.rollback();
                    connection.release();
                    return;
                }
                if (error) {
                    console.error(error);
                    res.status(500).send();
                    connection.rollback();
                    connection.release();
                    return;
                }
                connection.query("INSERT INTO account_role VALUES(?, (SELECT id FROM role WHERE name = ?))", [result.insertId, role], (error, result, fields) => {
                    if (error) {
                        console.error(error);
                        res.status(500).send();
                        connection.rollback();
                        connection.release();
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
                        connection.commit((error) => {
                            if (error) {
                                console.error(error);
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
    pool.getConnection((error, connection) => {
        if (error) {
            console.error(error);
            res.status(500).send();
            return;
        }
        connection.beginTransaction((error) => {
            if (error) {
                console.error(error);
                res.status(500).send();
                connection.release();
                return;
            }
            connection.query("SELECT id FROM account WHERE email = ?", [email], (error, result, fields) => {
                if (error) {
                    console.error(error);
                    res.status(500).send();
                    connection.release();
                    return;
                }
                if (result.length == 0) {
                    res.status(404).send();
                    connection.release();
                    return;
                }
                jwt.sign({ id: result[0].id }, process.env.JWT_KEY, { expiresIn: 900 }, (error, token) => {
                    if (error) {
                        console.error(error);
                        res.status(500).send();
                        connection.release();
                        return;
                    }
                    transporter.sendMail({
                        from: "enlightnoreply@gmail.com",
                        to: email,
                        subject: "Enlight Password Reset",
                        html: `<p><a href=http://18.229.107.19/password-reset/${token}>Click here</a> to reset your password. If this wasn't you, please change your password.</p>`
                    }, (error, info) => {
                        if (error) {
                            console.error(error);
                            res.status(500).send();
                            connection.rollback();
                            connection.release();
                            return;
                        }
                        connection.commit((error) => {
                            if (error) {
                                console.error(error);
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
});

app.get("/password-reset/:token", async (req, res) => {
    res.status(200).sendFile(path.join(__dirname, "/password-reset.html"));
});

app.post("/password-reset/:token", async (req, res) => {
    const { password } = req.body;
    const { token } = req.params;
    if (password == undefined || token == undefined) {
        res.status(400).send();
        return;
    }
    jwt.verify(token, process.env.JWT_KEY, (error, decoded) => {
        if (error && error.name == "TokenExpiredError") {
            console.error(error);
            res.status(401).sendFile(path.join(__dirname, "/token-expired.html"));
            return;
        }
        if (error) {
            console.error(error);
            res.status(401).sendFile(path.join(__dirname + "/invalid-token.html"));
            return;
        }
        pool.getConnection((error, connection) => {
            if (error) {
                console.error(error);
                res.status(500).send();
                return;
            }
            connection.beginTransaction(async (error) => {
                if (error) {
                    console.error(error);
                    res.status(500).send();
                    connection.release();
                    return;
                }
                const encrypted = await pass.encrypt(password);
                connection.query("UPDATE account SET password = ? WHERE id = ?", [encrypted, decoded.id], (error, result, fields) => {
                    if (error) {
                        console.error(error);
                        res.status(500).send();
                        connection.rollback();
                        connection.release();
                        return;
                    }
                    connection.commit((error) => {
                        if (error) {
                            console.error(error);
                            res.status(500).send();
                            connection.release();
                            return;
                        }
                        res.status(200).sendFile(path.join(__dirname, "/successful-reset.html"));
                        connection.release();
                    });
                });
            });
        });
    });
});

app.listen(80, () => {
    console.log("Server is running at http://localhost");
});