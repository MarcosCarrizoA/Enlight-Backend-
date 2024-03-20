require("dotenv").config();
const express = require("express");
const pass = require("./util/password");
const mysql = require("mysql2");

const connection = mysql.createConnection({
    host: "127.0.0.1",
    port: 3307,
    user: "enlight",
    password: process.env.PASSWORD,
    database: "enlight"
});

connection.connect((err) => {
    if (err) {
        console.error(err);
        return;
    }
    console.log("Connected to database.");
    setInterval(() => {
        connection.query("SELECT 1");
        console.log("Reconnected to database.");
    }, 28800000);
});

const app = express();

app.use(express.json());

app.get("/account", async (req, res) => {
    const { email, password } = req.query;
    if (email == undefined || password == undefined) {
        res.status(400).send();
        return;
    }
    connection.query("SELECT * FROM account WHERE email = ?", [email], async (err, result, fields) => {
        if (err) {
            console.error(err);
            res.status(500).send();
            return;
        }
        if (result.length == 0) {
            res.status(404).send();
            return;
        }
        const verified = await pass.verify(password, result[0].password);
        if (!verified) {
            res.status(401).send();
            return;
        }
        res.status(200).send(result[0]);
    });
});

app.post("/account", async (req, res) => {
    const { email, password, name, birth_date, address } = req.body;
    if (email == undefined || password == undefined || name == undefined || birth_date == undefined || address == undefined) {
        res.status(400).send();
        return;
    }
    const encrypted = await pass.encrypt(password);
    connection.beginTransaction((err) => {
        if (err) {
            console.error(err);
            res.status(500).send();
            return;
        }
        connection.query("INSERT INTO ACCOUNT VALUES (NULL, ?, ?, ?, ?, ?)", [email, encrypted, name, birth_date, address], (err, result, fields) => {
            if (err) {
                console.error(err);
                res.status(500).send();
                connection.rollback();
                return;
            }
            connection.commit((err) => {
                if (err) {
                    console.error(err);
                    res.status(500).send();
                    return;
                }
                res.status(200).send();
            });
        });
    });
});

app.put("/account", async (req, res) => {

});

app.delete("/account", async (req, res) => {

});

app.listen(80, () => {
    console.log("Server is running at http://localhost");
});