require("dotenv").config();
const mysql = require("mysql2");

class Database {
    /**
     * @typedef DatabaseResponse
     * @property {boolean} ok - Indicates whether the response has an error.
     * @property {number} error - Indicates the response error code.
     * @property {any} result - The result from the operation.
     */

    #pool;

    constructor() {
        this.#pool = mysql.createPool({
            host: "127.0.0.1",
            port: 3307,
            user: "enlight",
            password: process.env.DATABASE_PASSWORD,
            database: "enlight",
            connectionLimit: 3
        });
    }

    /**
     * 
     * @param {string} sql 
     * @param {Array} values 
     * @returns {Promise<any>} 
     * @throws {Error} 
     */
    async #query(sql, values) {
        return new Promise((resolve, reject) => {
            this.#pool.getConnection((error, connection) => {
                if (error) {
                    reject(error.errno);
                    return;
                }
                connection.query(sql, values, (error, result, fields) => {
                    connection.release();
                    if (error) {
                        reject(error.errno);
                        return;
                    }
                    resolve(result);
                });
            });
        });
    }

    /**
     * 
     * @param {string} sql 
     * @param {Array} values 
     * @returns {Promise<any>} 
     * @throws {Error} 
     */
    async #transaction(sql, values) {
        return new Promise((resolve, reject) => {
            this.#pool.getConnection((error, connection) => {
                if (error) {
                    reject(error);
                    return;
                }
                connection.beginTransaction((error) => {
                    if (error) {
                        connection.release();
                        reject(error);
                        return;
                    }
                    connection.query(sql, values, async (error, result, fields) => {
                        if (error) {
                            connection.release();
                            reject(error);
                            return;
                        }
                        connection.commit((error) => {
                            connection.release();
                            if (error) {
                                connection.rollback();
                                reject(error);
                                return;
                            }
                            resolve(result);
                        });
                    });
                });
            });
        });
    }

    /**
     * 
     * @param {string} sql 
     * @param {Array} values 
     * @param  {...Array<{sql: string, values: Array<any>, previousInsert: Array<Array<number>>} subtransactions 
     * @returns {Promise<any>} 
     * @throws {Error} 
     */
    async #multiTransaction(...subtransactions) {
        return new Promise((resolve, reject) => {
            this.#pool.getConnection((error, connection) => {
                if (error) {
                    reject(error);
                    return;
                }
                connection.beginTransaction(async (error) => {
                    if (error) {
                        connection.release();
                        reject(error);
                        return;
                    }
                    try {
                        const completed = [];
                        for (const subtransactionSet of subtransactions) {
                            const promises = subtransactionSet.map(async subtransaction => {
                                const values = subtransaction.values;
                                if (subtransaction.previousInsert != undefined) {
                                    for (const value of subtransaction.previousInsert) {
                                        values.unshift(completed[value[0]][value[1]]);
                                    }
                                }
                                return this.#subtransaction(connection, subtransaction.sql, values);
                            });
                            const results = await Promise.all(promises);
                            completed.push(results);
                        }
                        resolve(connection);
                    } catch (error) {
                        connection.rollback();
                        connection.release();
                        reject(error);
                    }
                });
            });
        });
    }

    /**
     * 
     * @param {any} connection 
     * @param {string} sql 
     * @param {Array} values 
     * @returns {Promise<any>}
     * @throws {Error}
     */
    async #subtransaction(connection, sql, values) {
        return new Promise((resolve, reject) => {
            connection.query(sql, values, (error, result, fields) => {
                if (error) {
                    reject(error);
                    return;
                }
                resolve(result.insertId ?? 0);
            });
        });
    }

    /**
     * 
     * @param {string} email 
     * @returns {Promise<DatabaseResponse>} 
     */
    async getCredentials(email) {
        return new Promise(async (resolve) => {
            try {
                const result = await this.#query("SELECT id, password FROM account WHERE email = ?", [email]);
                if (result.length == 0) {
                    resolve({ ok: false, error: 404 });
                }
                resolve({ ok: true, result: result[0] })
            } catch (error) {
                resolve({ ok: false, error: 500 });
            }
        });
    }

    /**
     * 
     * @param {string} token 
     * @returns {Promise<DatabaseResponse>} 
     */
    async insertRefreshToken(token) {
        return new Promise(async (resolve) => {
            try {
                await this.#transaction("INSERT INTO refresh_token VALUES (NULL, ?)", [token]);
                resolve({ ok: true });
            } catch (error) {
                resolve({ ok: false, error: 500 });
            }
        });
    }

    /**
     * 
     * @param {string} token 
     * @returns {Promise<DatabaseResponse>}
     */
    async deleteRefreshToken(token) {
        return new Promise(async (resolve) => {
            try {
                await this.#transaction("DELETE FROM refresh_token WHERE token = ?", [token]);
                resolve({ ok: true });
            } catch (error) {
                resolve({ ok: false, error: 500 });
            }
        });
    }

    /**
     * 
     * @param {string} token 
     * @returns {Promise<DatabaseResponse>}
     */
    async getRefreshToken(token) {
        return new Promise(async (resolve) => {
            try {
                const result = await this.#transaction("SELECT id FROM refresh_token WHERE token = ?", [token]);
                if (result.length == 0) {
                    resolve({ ok: false, error: 401 });
                }
                resolve({ ok: true });
            } catch (error) {
                resolve({ ok: false, error: 500 });
            }
        });
    }

    /**
     * 
     * @param {string} email 
     * @param {string} password 
     * @param {string} name 
     * @param {string} birthday 
     * @param {string} address 
     * @param {string} role 
     * @returns {Promise<DatabaseResponse>} 
     */
    async createAccount(email, password, name, birthday, address, role) {
        return new Promise(async (resolve) => {
            try {
                const secondSet = [{
                    sql: "INSERT INTO account_role VALUES (?, (SELECT id FROM role WHERE name = ?))",
                    values: [role],
                    previousInsert: [[0, 0]]
                }];
                const thirdSet = [];
                if (role == "teacher") {
                    secondSet.push({
                        sql: "INSERT INTO teacher VALUES (NULL, '', '')",
                        values: []
                    });
                    thirdSet.push({
                        sql: "INSERT INTO account_teacher VALUES (?, ?)",
                        values: [],
                        previousInsert: [[1, 1], [0, 0]]
                    });
                }
                const result = await this.#multiTransaction(
                    [
                        {
                            sql: "INSERT INTO account VALUES (NULL, ?, ?, ?, ?, ?)",
                            values: [email, password, name, birthday, address]
                        }
                    ],
                    secondSet,
                    thirdSet
                );
                resolve({ ok: true, result: result });
            } catch (error) {
                console.error(error);
                if (error.errno == 1062) {
                    resolve({ ok: false, error: 409 });
                }
                resolve({ ok: false, error: 500 });
            }
        });
    }

    /**
     * 
     * @param {number} id 
     * @returns {Promise<DatabaseResponse>} 
     */
    async getAccount(id) {
        return new Promise(async (resolve) => {
            try {
                const result = await this.#query("SELECT * FROM account WHERE id = ?", [id]);
                if (result.length == 0) {
                    resolve({ ok: false, error: 404 });
                }
                resolve({ ok: true, result: result[0] });
            } catch (error) {
                resolve({ ok: false, error: 500 });
            }
        });
    }

    /**
     * 
     * @param {number} id 
     * @returns {Promise<DatabaseResponse>} 
     */
    async getTeacher(id) {
        return new Promise(async (resolve) => {
            try {
                const result = await this.#query("SELECT * FROM teacher WHERE id = (SELECT teacher_id FROM account_teacher WHERE account_id = ?)", [id]);
                if (result.length == 0) {
                    resolve({ ok: false, error: 404 });
                }
                resolve({ ok: true, result: result[0] });
            } catch (error) {
                resolve({ ok: false, error: 500 });
            }
        });
    }

    /**
     * 
     * @param {number} id 
     * @param {string} description 
     * @param {Blob} profile_picture 
     * @returns {Promise<DatabaseResponse>}
     */
    async updateTeacher(id, description, profile_picture) {
        return new Promise(async (resolve) => {
            try {
                await this.#transaction("UPDATE teacher SET description = ?, profile_picture = ? WHERE id = (SELECT teacher_id FROM account_teacher WHERE account_id = ?)", [description, profile_picture, id]);
                resolve({ ok: true });
            } catch (error) {
                resolve({ ok: false, error: 500 });
            }
        });
    }

    /**
     * 
     * @param {string} email 
     * @returns {Promise<DatabaseResponse>}
     */
    async getAccountId(email) {
        return new Promise(async (resolve) => {
            try {
                const result = await this.#query("SELECT id FROM account WHERE email = ?", [email]);
                if (result.length == 0) {
                    resolve({ ok: false, error: 404 });
                }
                resolve({ ok: true, result: result[0].id });
            } catch (error) {
                resolve({ ok: false, error: 500 });
            }
        });
    }

    /**
     * 
     * @param {number} id 
     * @param {string} password 
     * @returns {Promise<DatabaseResponse>} 
     */
    async updatePassword(id, password) {
        return new Promise(async (resolve) => {
            try {
                await this.#transaction("UPDATE account SET password = ? WHERE id = ?", [password, id]);
                resolve({ ok: true });
            } catch (error) {
                resolve({ ok: false, error: 500 });
            }
        });
    }

    /**
     * 
     * @param {number} id 
     * @param {string} password 
     * @returns {Promise<DatabaseResponse>} 
     */
    async updateAccount(id, name, birthday, address) {
        return new Promise(async (resolve) => {
            try {
                await this.#transaction("UPDATE account SET name = ?, birthday = ?, address = ? WHERE id = ?", [name, birthday, address, id]);
                resolve({ ok: true });
            } catch (error) {
                resolve({ ok: false, error: 500 });
            }
        });
    }
}

function database() {
    return new Database();
}

module.exports = database;