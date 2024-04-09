import mysql from "mysql2";
import type { Pool, PoolConnection, QueryError, ResultSetHeader, RowDataPacket } from "mysql2";

interface Credentials extends RowDataPacket {
    id: number;
    password: string;
}

interface Token extends RowDataPacket {
    token: string;
}

interface Account extends RowDataPacket {
    id?: number;
    email: string;
    password?: string;
    name: string;
    birthday: Date;
    address: string;
}

interface Teacher extends RowDataPacket {
    id?: number;
    description: string;
    profile_picture: Blob;
}

interface ID extends RowDataPacket {
    id: number;
}

type DatabaseResponse<T> = {
    error?: number;
    result?: T;
}

type Subtransaction = {
    sql: string;
    values: any[];
    previousInsert?: number[][];
}

export class Database {
    private readonly pool: Pool;

    constructor() {
        this.pool = mysql.createPool({
            host: "127.0.0.1",
            port: 3307,
            user: Bun.env.DATABASE_USER,
            password: Bun.env.DATABASE_PASSWORD,
            database: "enlight",
            connectionLimit: 3
        });
    }

    private async query<T extends RowDataPacket>(sql: string, values: any[]): Promise<T[]> {
        return new Promise((resolve, reject) => {
            this.pool.getConnection((error, connection) => {
                if (error) {
                    reject(error);
                    return;
                }
                connection.query<T[]>(sql, values, (error, result) => {
                    connection.release();
                    if (error) {
                        reject(error);
                        return;
                    }
                    resolve(result);
                });
            });
        });
    }

    private async transaction(sql: string, values: any[]): Promise<void> {
        return new Promise((resolve, reject) => {
            this.pool.getConnection((error, connection) => {
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
                    connection.query<ResultSetHeader>(sql, values, (error, result) => {
                        if (error) {
                            connection.release();
                            reject(error);
                            return;
                        }
                        connection.commit((error) => {
                            if (error) {
                                connection.rollback((newError) => {
                                    if (newError) {
                                        connection.release();
                                        reject(newError);
                                        return;
                                    }
                                    connection.release();
                                    reject(error);
                                });
                                return;
                            }
                            connection.release();
                            resolve();
                        });
                    });
                });
            });
        });
    }

    private async subtransaction(connection: PoolConnection, sql: string, values: any[]): Promise<number> {
        return new Promise((resolve, reject) => {
            connection.query<ResultSetHeader>(sql, values, (error, result, fields) => {
                if (error) {
                    reject(error);
                    return;
                }
                resolve(result.insertId ?? 0);
            });
        });
    }

    private async multiTransaction(...subtransactions: Subtransaction[][]): Promise<PoolConnection> {
        return new Promise((resolve, reject) => {
            this.pool.getConnection((error, connection) => {
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
                        const completed: number[][] = [];
                        for (const subtransactionSet of subtransactions) {
                            const promises = subtransactionSet.map(async subtransaction => {
                                const values = subtransaction.values;
                                if (subtransaction.previousInsert != undefined) {
                                    for (const value of subtransaction.previousInsert) {
                                        values.unshift(completed[value[0]][value[1]]);
                                    }
                                }
                                return this.subtransaction(connection, subtransaction.sql, values);
                            });
                            const results = await Promise.all(promises);
                            completed.push(results);
                        }
                        resolve(connection);
                    } catch (error) {
                        connection.rollback((newError) => {
                            if (newError) {
                                connection.release();
                                reject(newError);
                                return;
                            }
                            connection.release();
                            reject(error);
                        });
                    }
                });
            });
        });
    }

    async getCredentials(email: string): Promise<DatabaseResponse<Credentials>> {
        return new Promise(async (resolve) => {
            try {
                const result = await this.query<Credentials>("SELECT id, password FROM account WHERE email = ?", [email]);
                resolve({ result: result[0] });
            } catch (error) {
                resolve({ error: (error as QueryError).errno });
            }
        });
    }

    async insertRefreshToken(token: string): Promise<DatabaseResponse<null>> {
        return new Promise(async (resolve) => {
            try {
                await this.transaction("INSERT INTO refresh_token VALUES (NULL, ?)", [token]);
                resolve({});
            } catch (error) {
                resolve({ error: (error as QueryError).errno });
            }
        });
    }

    async deleteRefreshToken(token: string): Promise<DatabaseResponse<null>> {
        return new Promise(async (resolve) => {
            try {
                await this.transaction("DELETE FROM refresh_token WHERE token = ?", [token]);
                resolve({});
            } catch (error) {
                resolve({ error: (error as QueryError).errno });
            }
        });
    }

    async getRefreshToken(token: string): Promise<DatabaseResponse<Token>> {
        return new Promise(async (resolve) => {
            try {
                const result = await this.query<Token>("SELECT id FROM refresh_token WHERE token = ?", [token]);
                resolve({ result: result[0] });
            } catch (error) {
                resolve({ error: (error as QueryError).errno });
            }
        });
    }

    async createAccount(email: string, password: string, name: string, birthday: string, address: string, role: string): Promise<DatabaseResponse<PoolConnection>> {
        return new Promise(async (resolve) => {
            try {
                const secondSet: Subtransaction[] = [{
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
                const result = await this.multiTransaction(
                    [
                        {
                            sql: "INSERT INTO account VALUES (NULL, ?, ?, ?, ?, ?)",
                            values: [email, password, name, birthday, address]
                        }
                    ],
                    secondSet,
                    thirdSet
                );
                resolve({ result: result });
            } catch (error) {
                resolve({ error: (error as QueryError).errno });
            }
        });
    }

    async getAccount(id: number): Promise<DatabaseResponse<Account>> {
        return new Promise(async (resolve) => {
            try {
                const result = await this.query<Account>("SELECT * FROM account WHERE id = ?", [id]);
                delete result[0].id;
                delete result[0].password
                resolve({ result: result[0] });
            } catch (error) {
                resolve({ error: (error as QueryError).errno });
            }
        });
    }

    async getTeacher(accountId: number): Promise<DatabaseResponse<Teacher>> {
        return new Promise(async (resolve) => {
            try {
                const result = await this.query<Teacher>("SELECT description, profile_picture, name, address FROM teacher INNER JOIN account_teacher ON teacher.id = account_teacher.teacher_id INNER JOIN account ON account_teacher.account_id = account.id WHERE account.id = ?", [id]);
                resolve({ result: result[0] });
            } catch (error) {
                resolve({ error: (error as QueryError).errno });
            }
        });
    }

    async updateTeacher(id: number, description: string, profile_picture: Blob): Promise<DatabaseResponse<null>> {
        return new Promise(async (resolve) => {
            try {
                await this.transaction("UPDATE teacher SET description = ?, profile_picture = ? WHERE id = (SELECT teacher_id FROM account_teacher WHERE account_id = ?)", [description, profile_picture, id]);
                resolve({});
            } catch (error) {
                resolve({ error: (error as QueryError).errno });
            }
        });
    }

    async getAccountId(email: string): Promise<DatabaseResponse<ID>> {
        return new Promise(async (resolve) => {
            try {
                const result = await this.query<ID>("SELECT id FROM account WHERE email = ?", [email]);
                resolve({ result: result[0] });
            } catch (error) {
                resolve({ error: (error as QueryError).errno });
            }
        });
    }

    async updatePassword(id: number, password: string): Promise<DatabaseResponse<null>> {
        return new Promise(async (resolve) => {
            try {
                await this.transaction("UPDATE account SET password = ? WHERE id = ?", [password, id]);
                resolve({});
            } catch (error) {
                resolve({ error: (error as QueryError).errno });
            }
        });
    }

    async updateAccount(id: number, name: string, birthday: string, address: string): Promise<DatabaseResponse<null>> {
        return new Promise(async (resolve) => {
            try {
                await this.transaction("UPDATE account SET name = ?, birthday = ?, address = ? WHERE id = ?", [name, birthday, address, id]);
                resolve({});
            } catch (error) {
                resolve({ error: (error as QueryError).errno });
            }
        });
    }

    async deleteAccount(id: number): Promise<DatabaseResponse<null>> {
        return new Promise(async (resolve) => {
            try {
                await this.transaction("DELETE FROM account WHERE id = ?", [id]);
                resolve({});
            } catch (error) {
                resolve({ error: (error as QueryError).errno })
            }
        });
    }

    async getTeacherId(accountId: number): Promise<DatabaseResponse<ID>> {
        return new Promise(async (resolve) => {
            try {
                const result = await this.query<ID>("SELECT id FROM account_teacher WHERE account_id = ?", [accountId]);
                resolve({ result: result[0] });
            } catch (error) {
                resolve({ error: (error as QueryError).errno });
            }
        });
    }

    async createSubject(teacherId: number, categoryId: number, name: string, description: string): Promise<DatabaseResponse<null>> {
        return new Promise(async (resolve) => {
            try {
                const result = await this.multiTransaction(
                    [
                        {
                            sql: "INSERT INTO subject VALUES (NULL, ?, ?)",
                            values: [name, description]
                        }
                    ],
                    [
                        {
                            sql: "INSERT INTO teacher_subject (subject_id, teacher_id) VALUES (?, ?)",
                            values: [teacherId],
                            previousInsert: [[0, 0]]
                        }
                    ]
                )
                result.commit((error) => {
                    if (error) {
                        throw error;
                    }
                    result.release();
                    resolve({});
                })
            } catch (error) {
                resolve({error: (error as QueryError).errno});
            }
        })
    }
}

export default function database(): Database {
    return new Database();
}