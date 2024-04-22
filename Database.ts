import mysql from "mysql2";
import type { Pool, PoolConnection, QueryError, ResultSetHeader, RowDataPacket } from "mysql2";

interface Credentials extends RowDataPacket {
    id: number;
    password: string;
    role_id: number;
}

interface ID extends RowDataPacket {
    id: number;
}

interface TimeID extends RowDataPacket {
    start_time_id: number;
    end_time_id: number;
}

interface Token extends RowDataPacket {
    token: string;
}

interface Account extends RowDataPacket {
    email: string;
    name: string;
    birthday: Date;
    address: string;
    picture?: string;
    teacher?: Teacher
    categories?: Category[]
}

interface Picture extends RowDataPacket {
    picture: Buffer;
}

interface Role extends RowDataPacket {
    id?: number;
    name: string;
}

interface Teacher extends RowDataPacket {
    id?: number;
    description: string;
    categories: Category[];
    subjects?: Subject[];
}

interface Subject extends RowDataPacket {
    id: number;
    category_name: string;
    name: string;
    description: string;
    price: number;
    days?: Day[];
}

interface Day extends RowDataPacket {
    id?: number;
    name: string;
    timeslots?: Timeslot[];
}

interface Time extends RowDataPacket {
    id?: number;
    time: string;
}

interface Timeslot {
    id?: number;
    start_time: string;
    end_time: string;
}

interface Category extends RowDataPacket {
    id?: number;
    name: String;
}

interface DatabaseResponse<T> {
    error?: number;
    result?: T;
}

interface TransactionResult {
    connection: PoolConnection;
    insertIds: number[][];
}

interface Subtransaction {
    sql: string;
    values: any[];
    /** Insert ID of previous subtransaction to be inserted as the first value parameter. */
    previousInsert?: number[][];
}

export class Database {
    private readonly pool: Pool;

    constructor() {
        this.pool = mysql.createPool({
            host: Bun.env.DATABASE_HOST,
            port: parseInt(Bun.env.DATABASE_PORT!),
            user: Bun.env.DATABASE_USER,
            password: Bun.env.DATABASE_PASSWORD,
            database: "enlight",
            connectionLimit: 3
        });
    }

    // Elemental operations
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

    private async multiTransaction(...subtransactions: Subtransaction[][]): Promise<TransactionResult> {
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
                        resolve({ connection: connection, insertIds: completed });
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

    async completeTransaction(connection: PoolConnection): Promise<DatabaseResponse<null>> {
        return new Promise((resolve) => {
            connection.commit((error) => {
                if (error) {
                    connection.rollback((error) => {
                        if (error) {
                            connection.release();
                            resolve({ error: error.errno });
                        }
                    });
                    connection.release();
                    resolve({ error: error.errno });
                }
                connection.release();
                resolve({});
            });
        });
    }

    async cancelTransaction(connection: PoolConnection): Promise<DatabaseResponse<null>> {
        return new Promise((resolve) => {
            connection.rollback((error) => {
                if (error) {
                    connection.release();
                    resolve({ error: error.errno });
                }
                connection.release();
                resolve({});
            });
        });
    }

    // Authentication
    async getCredentials(email: string): Promise<DatabaseResponse<Credentials>> {
        return new Promise(async (resolve) => {
            try {
                const result = await this.query<Credentials>("SELECT id, password, role_id FROM account INNER JOIN account_role on account.id = account_role.account_id WHERE email  = ?", [email]);
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

    // Account
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
                        sql: "INSERT INTO teacher VALUES (NULL, '')",
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
                resolve({ result: result.connection });
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
                delete result[0].password;
                resolve({ result: result[0] });
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

    // Password
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

    // Role
    async getRole(accountId: number): Promise<DatabaseResponse<Role>> {
        return new Promise(async (resolve) => {
            try {
                const roleId = await this.query<ID>("SELECT role_id as id FROM account_role WHERE account_id = ?", [accountId]);
                const role = await this.query<Role>("SELECT * FROM role WHERE id = ?", [roleId[0].id]);
                delete role[0].id;
                resolve({ result: role[0] });
            } catch (error) {
                resolve({ error: (error as QueryError).errno });
            }
        });
    }

    // Picture
    async insertPicture(accountId: number, picture: Buffer): Promise<DatabaseResponse<null>> {
        return new Promise(async (resolve) => {
            try {
                const pictureId = await this.query<ID>("SELECT picture_id as id FROM account_picture WHERE account_id = ?", [accountId]);
                if (pictureId.length == 0) {
                    const result = await this.multiTransaction(
                        [
                            {
                                sql: "INSERT INTO picture VALUES (NULL, ?)",
                                values: [picture]
                            }
                        ],
                        [
                            {
                                sql: "INSERT INTO account_picture (picture_id, account_id) VALUES (?, ?)",
                                values: [accountId],
                                previousInsert: [[0, 0]]
                            }
                        ]
                    )
                    await this.completeTransaction(result.connection);
                    resolve({});
                    return;
                }
                await this.transaction("UPDATE picture SET picture = ? WHERE id = ?", [picture, pictureId[0].id]);
                resolve({});
            } catch (error) {
                resolve({ error: (error as QueryError).errno });
            }
        });
    }

    async getPicture(accountId: number): Promise<DatabaseResponse<Picture>> {
        return new Promise(async (resolve) => {
            try {
                const pictureId = await this.query<ID>("SELECT picture_id as id FROM account_picture WHERE account_id = ?", [accountId]);
                const picture = await this.query<Picture>("SELECT picture FROM picture WHERE id = ?", [pictureId[0].id]);
                resolve({ result: picture[0] });
            } catch (error) {
                resolve({ error: (error as QueryError).errno });
            }
        });
    }

    async deletePicture(accountId: number): Promise<DatabaseResponse<null>> {
        return new Promise(async (resolve) => {
            try {
                const pictureId = await this.query<ID>("SELECT picture_id FROM account_picture WHERE account_id = ?", [accountId]);
                await this.transaction("DELETE FROM picture WHERE id = ?", [pictureId]);
                resolve({});
            } catch (error) {
                resolve({ error: (error as QueryError).errno });
            }
        });
    }

    // Teacher
    async getTeacher(accountId: number): Promise<DatabaseResponse<Teacher>> {
        return new Promise(async (resolve) => {
            try {
                const teacherId = await this.query<ID>("SELECT teacher_id as id FROM account_teacher WHERE account_id = ?", [accountId]);
                const result = await this.query<Teacher>("SELECT * FROM teacher WHERE teacher.id = ?", [teacherId[0].id]);
                delete result[0].id;
                const categories = await this.getCategories();
                if (categories.error) {
                    resolve({ error: categories.error });
                    return;
                }
                result[0].categories = categories.result!;
                const subjectIds = await this.query<ID>("SELECT subject_id AS id FROM teacher_subject WHERE teacher_id = ?", [teacherId[0].id]);
                if (subjectIds.length != 0) {
                    const subjects = await this.query<Subject>(
                        `SELECT subject.*, category.name AS category_name
                        FROM subject INNER JOIN category_subject ON subject.id = subject_id
                        INNER JOIN category ON category_id = category.id WHERE subject.id IN (?)`,
                        [subjectIds.map((id) => id.id)]
                    );
                    for (const subject of subjects) {
                        const dayIds = await this.query<ID>("SELECT day_id AS id FROM timeslot WHERE subject_id = ?", [subject.id]);
                        if (dayIds.length != 0) {
                            subject.days = [];
                            const days = await this.query<Day>("SELECT * FROM day WHERE id IN (?)", [dayIds.map((day) => day.id)]);
                            for (const day of days) {
                                const timeIds = await this.query<TimeID>("SELECT start_time_id, end_time_id FROM timeslot WHERE subject_id = ? AND day_id = ?", [subject.id, day.id]);
                                if (timeIds.length != 0) {
                                    day.timeslots = [];
                                    for (const timeId in timeIds) {
                                        const startTime = await this.query<Time>("SELECT * FROM time WHERE id = ?", [timeIds[0].start_time_id]);
                                        delete startTime[0].id;
                                        const endTime = await this.query<Time>("SELECT * FROM time WHERE id = ?", [timeIds[0].end_time_id]);
                                        delete endTime[0].id;
                                        day.timeslots.push({
                                            start_time: startTime[0].time,
                                            end_time: endTime[0].time,
                                        });
                                    }
                                }
                                delete day.id;
                                subject.days.push(day);
                            }
                        }
                    }
                    result[0].subjects = subjects;
                }
                resolve({ result: result[0] });
            } catch (error) {
                resolve({ error: (error as QueryError).errno });
            }
        });
    }

    async updateTeacher(id: number, description: string): Promise<DatabaseResponse<null>> {
        return new Promise(async (resolve) => {
            try {
                await this.transaction("UPDATE teacher SET description = ? WHERE id = (SELECT teacher_id FROM account_teacher WHERE account_id = ?)", [description, id]);
                resolve({});
            } catch (error) {
                resolve({ error: (error as QueryError).errno });
            }
        });
    }

    // Categories
    async getCategories(): Promise<DatabaseResponse<Category[]>> {
        return new Promise(async (resolve) => {
            try {
                const result = await this.query<Category>("SELECT * FROM category", []);
                result.forEach((category) => delete category.id);
                resolve({ result: result });
            } catch (error) {
                resolve({ error: (error as QueryError).errno });
            }
        });
    }

    // Subject
    async createSubject(accountId: number, categoryName: string, name: string, description: string, price: number, days: Day[]): Promise<DatabaseResponse<number>> {
        return new Promise(async (resolve) => {
            try {
                const teacherId = await this.query<ID>("SELECT teacher_id as id FROM account_teacher WHERE account_id = ?", [accountId]);
                const categoryId = await this.query<ID>("SELECT id FROM category WHERE name = ?", [categoryName]);
                const secondSet: Subtransaction[] = [
                    {
                        sql: "INSERT INTO teacher_subject (subject_id, teacher_id) VALUES (?, ?)",
                        values: [teacherId[0].id],
                        previousInsert: [[0, 0]]
                    },
                    {
                        sql: "INSERT INTO category_subject (subject_id, category_id) VALUES (?, ?)",
                        values: [categoryId[0].id],
                        previousInsert: [[0, 0]]
                    }
                ];
                for (const day of days) {
                    const dayId = await this.query<ID>("SELECT id FROM day WHERE name LIKE ?", [day.name]);
                    if (dayId.length == 0) {
                        resolve({ error: 66 });
                        return;
                    }
                    for (const timeslot of day.timeslots!) {
                        const startTimeId = await this.query<ID>("SELECT id FROM time WHERE time = ?", [timeslot.start_time]);
                        const endTimeId = await this.query<ID>("SELECT id FROM time WHERE time = ?", [timeslot.end_time]);
                        var startId: number | null = null;
                        if (startTimeId.length == 0) {
                            const result = await this.multiTransaction([{
                                sql: "INSERT INTO time VALUES (NULL, ?)",
                                values: [timeslot.start_time]
                            }]);
                            startId = result.insertIds[0][0];
                            await this.completeTransaction(result.connection);
                        }
                        var endId: number | null = null;
                        if (endTimeId.length == 0) {
                            const result = await this.multiTransaction([{
                                sql: "INSERT INTO time VALUES (NULL, ?)",
                                values: [timeslot.end_time]
                            }]);
                            endId = result.insertIds[0][0];
                            await this.completeTransaction(result.connection);
                        }
                        secondSet.push({
                            sql: "INSERT INTO timeslot VALUES (?, ?, ?, ?)",
                            values: [dayId[0].id, startId ?? startTimeId[0].id, endId ?? endTimeId[0].id],
                            previousInsert: [[0, 0]]
                        });
                    }
                }
                const result = await this.multiTransaction([{
                    sql: "INSERT INTO subject VALUES (NULL, ?, ?, ?)",
                    values: [name, description, price]
                }],
                    secondSet
                );
                await this.completeTransaction(result.connection);
                resolve({ result: result.insertIds[0][0] });
            } catch (error) {
                resolve({ error: (error as QueryError).errno });
            }
        });
    }

    async deleteSubject(accountId: number, id: number): Promise<DatabaseResponse<null>> {
        return new Promise(async (resolve) => {
            try {
                const teacherId = await this.query<ID>("SELECT teacher_id AS id FROM account_teacher WHERE account_id = ?", [accountId]);
                const subjectId = await this.query<ID>("SELECT subject_id AS id FROM teacher_subject WHERE teacher_id = ? AND subject_id = ?", [teacherId[0].id, id]);
                if (subjectId.length == 0) {
                    resolve({ error: 66 });
                    return;
                }
                await this.transaction("DELETE FROM subject WHERE id = ?", [subjectId]);
                resolve({});
            } catch (error) {
                resolve({ error: (error as QueryError).errno });
            }
        });
    }
}

export default function database(): Database {
    return new Database();
}