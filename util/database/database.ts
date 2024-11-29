import mysql from "mysql2"
import type {
    Pool,
    PoolConnection,
    QueryError,
    ResultSetHeader,
    RowDataPacket,
} from "mysql2"
import {
    type DayInternal,
    type TimeInternal,
    type Account,
    type Category,
    type Credentials,
    type DatabaseResponse,
    type DateInternal,
    type Day,
    type ID,
    type Picture,
    type Query,
    type Rating,
    type Reservation,
    type Role,
    type Subject,
    type Subtransaction,
    type Teacher,
    type TeacherPublic,
    type Time,
    type TimeID,
    type Timeslot,
    type TimeslotInternal,
    type Token,
    type TransactionResult,
    type Student,
    type SubjectForTimeSlot,
    type ReservationVerify,
    type ReservationInternal,
} from "./interfaces"

class Database {
    private readonly pool: Pool

    constructor() {
        this.pool = mysql.createPool({
            host: Bun.env.DATABASE_HOST,
            port: parseInt(Bun.env.DATABASE_PORT!),
            user: Bun.env.DATABASE_USER,
            password: Bun.env.DATABASE_PASSWORD,
            database: "enlight",
            connectionLimit: 3,
        })
        console.log("Database connected")
    }

    // Elemental operations
    private async query<T extends RowDataPacket>(
        sql: string,
        values: any[]
    ): Promise<T[]> {
        return new Promise((resolve, reject) => {
            this.pool.getConnection((error, connection) => {
                if (error) {
                    reject(error)
                    return
                }
                connection.query<T[]>(sql, values, (error, result) => {
                    connection.release()
                    if (error) {
                        reject(error)
                        return
                    }
                    resolve(result)
                })
            })
        })
    }

    private async transaction(sql: string, values: any[]): Promise<void> {
        return new Promise((resolve, reject) => {
            this.pool.getConnection((error, connection) => {
                if (error) {
                    reject(error)
                    return
                }
                connection.beginTransaction((error) => {
                    if (error) {
                        connection.release()
                        reject(error)
                        return
                    }
                    connection.query<ResultSetHeader>(
                        sql,
                        values,
                        (error, result) => {
                            if (error) {
                                connection.release()
                                reject(error)
                                return
                            }
                            connection.commit((error) => {
                                if (error) {
                                    connection.rollback((newError) => {
                                        if (newError) {
                                            connection.release()
                                            reject(newError)
                                            return
                                        }
                                        connection.release()
                                        reject(error)
                                    })
                                    return
                                }
                                connection.release()
                                resolve()
                            })
                        }
                    )
                })
            })
        })
    }

    private async subtransaction(
        connection: PoolConnection,
        sql: string,
        values: any[]
    ): Promise<number> {
        return new Promise((resolve, reject) => {
            connection.query<ResultSetHeader>(
                sql,
                values,
                (error, result, fields) => {
                    if (error) {
                        reject(error)
                        return
                    }
                    resolve(result.insertId ?? 0)
                }
            )
        })
    }

    private async multiTransaction(
        ...subtransactions: Subtransaction[][]
    ): Promise<TransactionResult> {
        return new Promise((resolve, reject) => {
            this.pool.getConnection((error, connection) => {
                if (error) {
                    reject(error)
                    return
                }
                connection.beginTransaction(async (error) => {
                    if (error) {
                        connection.release()
                        reject(error)
                        return
                    }
                    try {
                        const completed: number[][] = []
                        for (const subtransactionSet of subtransactions) {
                            const promises = subtransactionSet.map(
                                async (subtransaction) => {
                                    const values = subtransaction.values
                                    if (
                                        subtransaction.previousInsert !=
                                        undefined
                                    ) {
                                        for (const value of subtransaction.previousInsert) {
                                            values.unshift(
                                                completed[value[0]][value[1]]
                                            )
                                        }
                                    }
                                    return this.subtransaction(
                                        connection,
                                        subtransaction.sql,
                                        values
                                    )
                                }
                            )
                            const results = await Promise.all(promises)
                            completed.push(results)
                        }
                        resolve({
                            connection: connection,
                            insertIds: completed,
                        })
                    } catch (error) {
                        connection.rollback((newError) => {
                            if (newError) {
                                connection.release()
                                reject(newError)
                                return
                            }
                            connection.release()
                            reject(error)
                        })
                    }
                })
            })
        })
    }

    async completeTransaction(
        connection: PoolConnection
    ): Promise<DatabaseResponse<null>> {
        return new Promise((resolve) => {
            connection.commit((error) => {
                if (error) {
                    connection.rollback((error) => {
                        if (error) {
                            connection.release()
                            resolve({ error: error.errno })
                        }
                    })
                    connection.release()
                    resolve({ error: error.errno })
                }
                connection.release()
                resolve({})
            })
        })
    }

    async cancelTransaction(
        connection: PoolConnection
    ): Promise<DatabaseResponse<null>> {
        return new Promise((resolve) => {
            connection.rollback((error) => {
                if (error) {
                    connection.release()
                    resolve({ error: error.errno })
                }
                connection.release()
                resolve({})
            })
        })
    }

    // Authentication
    async getCredentials(
        email: string
    ): Promise<DatabaseResponse<Credentials>> {
        return new Promise(async (resolve) => {
            try {
                const result = await this.query<Credentials>(
                    "SELECT id, password, role_id FROM account INNER JOIN account_role on account.id = account_role.account_id WHERE email  = ?",
                    [email]
                )
                resolve({ result: result[0] })
            } catch (error) {
                resolve({ error: (error as QueryError).errno })
            }
        })
    }

    async insertRefreshToken(token: string): Promise<DatabaseResponse<null>> {
        return new Promise(async (resolve) => {
            try {
                await this.transaction(
                    "INSERT INTO refresh_token VALUES (NULL, ?)",
                    [token]
                )
                resolve({})
            } catch (error) {
                resolve({ error: (error as QueryError).errno })
            }
        })
    }

    async getRefreshToken(token: string): Promise<DatabaseResponse<Token>> {
        return new Promise(async (resolve) => {
            try {
                const result = await this.query<Token>(
                    "SELECT id FROM refresh_token WHERE token = ?",
                    [token]
                )
                resolve({ result: result[0] })
            } catch (error) {
                resolve({ error: (error as QueryError).errno })
            }
        })
    }

    async deleteRefreshToken(token: string): Promise<DatabaseResponse<null>> {
        return new Promise(async (resolve) => {
            try {
                await this.transaction(
                    "DELETE FROM refresh_token WHERE token = ?",
                    [token]
                )
                resolve({})
            } catch (error) {
                resolve({ error: (error as QueryError).errno })
            }
        })
    }

    // Account
    async createAccount(
        email: string,
        password: string,
        name: string,
        birthday: string,
        address: string,
        role: string
    ): Promise<DatabaseResponse<PoolConnection>> {
        return new Promise(async (resolve) => {
            try {
                const secondSet: Subtransaction[] = [
                    {
                        sql: "INSERT INTO account_role VALUES (?, (SELECT id FROM role WHERE name = ?))",
                        values: [role],
                        previousInsert: [[0, 0]],
                    },
                ]
                const thirdSet = []
                if (role == "teacher") {
                    secondSet.push({
                        sql: "INSERT INTO teacher VALUES (NULL, '')",
                        values: [],
                    })
                    thirdSet.push({
                        sql: "INSERT INTO account_teacher VALUES (?, ?)",
                        values: [],
                        previousInsert: [
                            [1, 1],
                            [0, 0],
                        ],
                    })
                }
                const result = await this.multiTransaction(
                    [
                        {
                            sql: "INSERT INTO account VALUES (NULL, ?, ?, ?, ?, ?)",
                            values: [email, password, name, birthday, address],
                        },
                    ],
                    secondSet,
                    thirdSet
                )
                resolve({ result: result.connection })
            } catch (error) {
                resolve({ error: (error as QueryError).errno })
            }
        })
    }

    async getAccount(id: number): Promise<DatabaseResponse<Account>> {
        return new Promise(async (resolve) => {
            try {
                const result = await this.query<Account>(
                    "SELECT * FROM account WHERE id = ?",
                    [id]
                )
                delete result[0].id
                delete result[0].password
                resolve({ result: result[0] })
            } catch (error) {
                resolve({ error: (error as QueryError).errno })
            }
        })
    }

    async getAccountId(email: string): Promise<DatabaseResponse<ID>> {
        return new Promise(async (resolve) => {
            try {
                const result = await this.query<ID>(
                    "SELECT id FROM account WHERE email = ?",
                    [email]
                )
                resolve({ result: result[0] })
            } catch (error) {
                resolve({ error: (error as QueryError).errno })
            }
        })
    }

    async updateAccount(
        id: number,
        name: string,
        birthday: string,
        address: string
    ): Promise<DatabaseResponse<null>> {
        return new Promise(async (resolve) => {
            try {
                await this.transaction(
                    "UPDATE account SET name = ?, birthday = ?, address = ? WHERE id = ?",
                    [name, birthday, address, id]
                )
                resolve({})
            } catch (error) {
                resolve({ error: (error as QueryError).errno })
            }
        })
    }

    async deleteAccount(id: number): Promise<DatabaseResponse<null>> {
        return new Promise(async (resolve) => {
            try {
                await this.transaction("DELETE FROM account WHERE id = ?", [id])
                resolve({})
            } catch (error) {
                resolve({ error: (error as QueryError).errno })
            }
        })
    }

    // Password
    async updatePassword(
        id: number,
        password: string
    ): Promise<DatabaseResponse<null>> {
        return new Promise(async (resolve) => {
            try {
                await this.transaction(
                    "UPDATE account SET password = ? WHERE id = ?",
                    [password, id]
                )
                resolve({})
            } catch (error) {
                resolve({ error: (error as QueryError).errno })
            }
        })
    }

    // Role
    async getRole(accountId: number): Promise<DatabaseResponse<Role>> {
        return new Promise(async (resolve) => {
            try {
                const roleId = await this.query<ID>(
                    "SELECT role_id as id FROM account_role WHERE account_id = ?",
                    [accountId]
                )
                const role = await this.query<Role>(
                    "SELECT * FROM role WHERE id = ?",
                    [roleId[0].id]
                )
                delete role[0].id
                resolve({ result: role[0] })
            } catch (error) {
                resolve({ error: (error as QueryError).errno })
            }
        })
    }

    // Picture
    async insertPicture(
        accountId: number,
        picture: Buffer
    ): Promise<DatabaseResponse<null>> {
        return new Promise(async (resolve) => {
            try {
                const pictureId = await this.query<ID>(
                    "SELECT picture_id as id FROM account_picture WHERE account_id = ?",
                    [accountId]
                )
                if (pictureId.length == 0) {
                    const result = await this.multiTransaction(
                        [
                            {
                                sql: "INSERT INTO picture VALUES (NULL, ?)",
                                values: [picture],
                            },
                        ],
                        [
                            {
                                sql: "INSERT INTO account_picture (picture_id, account_id) VALUES (?, ?)",
                                values: [accountId],
                                previousInsert: [[0, 0]],
                            },
                        ]
                    )
                    await this.completeTransaction(result.connection)
                    resolve({})
                    return
                }
                await this.transaction(
                    "UPDATE picture SET picture = ? WHERE id = ?",
                    [picture, pictureId[0].id]
                )
                resolve({})
            } catch (error) {
                resolve({ error: (error as QueryError).errno })
            }
        })
    }

    async getPicture(accountId: number): Promise<DatabaseResponse<Picture>> {
        return new Promise(async (resolve) => {
            try {
                const pictureId = await this.query<ID>(
                    "SELECT picture_id as id FROM account_picture WHERE account_id = ?",
                    [accountId]
                )
                const picture = await this.query<Picture>(
                    "SELECT picture FROM picture WHERE id = ?",
                    [pictureId[0].id]
                )
                resolve({ result: picture[0] })
            } catch (error) {
                resolve({ error: (error as QueryError).errno })
            }
        })
    }

    async deletePicture(accountId: number): Promise<DatabaseResponse<null>> {
        return new Promise(async (resolve) => {
            try {
                const pictureId = await this.query<ID>(
                    "SELECT picture_id FROM account_picture WHERE account_id = ?",
                    [accountId]
                )
                await this.transaction("DELETE FROM picture WHERE id = ?", [
                    pictureId,
                ])
                resolve({})
            } catch (error) {
                resolve({ error: (error as QueryError).errno })
            }
        })
    }

    // Teacher
    async getTeacher(accountId: number): Promise<DatabaseResponse<Teacher>> {
        return new Promise(async (resolve) => {
            try {
                const teacherId = await this.query<ID>(
                    "SELECT teacher_id as id FROM account_teacher WHERE account_id = ?",
                    [accountId]
                )
                const result = await this.query<Teacher>(
                    "SELECT * FROM teacher WHERE teacher.id = ?",
                    [teacherId[0].id]
                )
                // QUE ALGUIEN ME EXPLIQUE PORQUE BORRABA EL ID
                // delete result[0].id
                const categories = await this.getCategories()
                if (categories.error) {
                    resolve({ error: categories.error })
                    return
                }
                result[0].categories = categories.result!
                const subjectIds = await this.query<ID>(
                    "SELECT subject_id AS id FROM teacher_subject WHERE teacher_id = ?",
                    [teacherId[0].id]
                )
                if (subjectIds.length != 0) {
                    const subjects = await this.query<Subject>(
                        `SELECT subject.*, category.name AS category_name
                        FROM subject INNER JOIN category_subject ON subject.id = subject_id
                        INNER JOIN category ON category_id = category.id WHERE subject.id IN (?)`,
                        [subjectIds.map((id) => id.id)]
                    )
                    for (const subject of subjects) {
                        const days = await this.getDays(subject.id)
                        if (days) {
                            subject.days = days
                        } else {
                            subject.days = []
                        }
                    }
                    result[0].subjects = subjects
                }
                const rating = await this.getRating(teacherId[0].id)
                if (rating.error) {
                    resolve({ error: rating.error })
                    return
                }
                result[0].rating = rating.result!.rating
                resolve({ result: result[0] })
            } catch (error) {
                resolve({ error: (error as QueryError).errno })
            }
        })
    }

    private async getDays(subject_id: number): Promise<Day[] | undefined> {
        return new Promise(async (resolve) => {
            const dayIds = await this.query<ID>(
                "SELECT day_id AS id FROM timeslot WHERE subject_id = ?",
                [subject_id]
            )
            if (dayIds.length != 0) {
                const list: Day[] = []
                const days = await this.query<Day>(
                    "SELECT * FROM day WHERE id IN (?)",
                    [dayIds.map((day) => day.id)]
                )
                for (const day of days) {
                    const timeIds = await this.query<TimeID>(
                        "SELECT id, start_time_id, end_time_id FROM timeslot WHERE subject_id = ? AND day_id = ?",
                        [subject_id, day.id]
                    )
                    if (timeIds.length != 0) {
                        day.timeslots = []
                        for (const timeId of timeIds) {
                            const startTime = await this.query<Time>(
                                "SELECT * FROM time WHERE id = ?",
                                [timeId.start_time_id]
                            )
                            delete startTime[0].id
                            const endTime = await this.query<Time>(
                                "SELECT * FROM time WHERE id = ?",
                                [timeId.end_time_id]
                            )
                            delete endTime[0].id
                            day.timeslots.push({
                                id: timeId.id,
                                start_time: startTime[0].time,
                                end_time: endTime[0].time,
                            })
                        }
                    }
                    delete day.id
                    list.push(day)
                }
                resolve(list)
            }
            resolve(undefined)
        })
    }

    async getTeacherPublic(
        teacher_id: Number
    ): Promise<DatabaseResponse<TeacherPublic>> {
        return new Promise(async (resolve) => {
            try {
                const result = await this.query<TeacherPublic>(
                    "SELECT teacher.*, account.name, account.id AS account_id FROM teacher INNER JOIN account_teacher ON teacher.id = teacher_id INNER JOIN account ON account_id = account.id WHERE teacher.id = ?",
                    [teacher_id]
                )
                const picture = await this.getPicture(result[0].account_id!)
                result[0].picture = picture.result?.picture.toString("base64")
                const subjectIds = await this.query<ID>(
                    "SELECT subject_id AS id FROM teacher_subject WHERE teacher_id = ?",
                    [teacher_id]
                )
                if (subjectIds.length != 0) {
                    const subjects = await this.query<Subject>(
                        `SELECT subject.*, category.name AS category_name
                        FROM subject INNER JOIN category_subject ON subject.id = subject_id
                        INNER JOIN category ON category_id = category.id WHERE subject.id IN (?)`,
                        [subjectIds.map((id) => id.id)]
                    )
                    for (const subject of subjects) {
                        const dayIds = await this.query<ID>(
                            "SELECT day_id AS id FROM timeslot WHERE subject_id = ?",
                            [subject.id]
                        )
                        if (dayIds.length != 0) {
                            subject.days = []
                            const days = await this.query<Day>(
                                "SELECT * FROM day WHERE id IN (?)",
                                [dayIds.map((day) => day.id)]
                            )
                            for (const day of days) {
                                const timeIds = await this.query<TimeID>(
                                    "SELECT start_time_id, end_time_id FROM timeslot WHERE subject_id = ? AND day_id = ?",
                                    [subject.id, day.id]
                                )
                                if (timeIds.length != 0) {
                                    day.timeslots = []
                                    for (const timeId in timeIds) {
                                        const startTime =
                                            await this.query<Time>(
                                                "SELECT * FROM time WHERE id = ?",
                                                [timeIds[0].start_time_id]
                                            )
                                        delete startTime[0].id
                                        const endTime = await this.query<Time>(
                                            "SELECT * FROM time WHERE id = ?",
                                            [timeIds[0].end_time_id]
                                        )
                                        delete endTime[0].id
                                        day.timeslots.push({
                                            start_time: startTime[0].time,
                                            end_time: endTime[0].time,
                                        })
                                    }
                                }
                                delete day.id
                                subject.days.push(day)
                            }
                        }
                    }
                    result[0].subjects = subjects
                }
                const rating = await this.getRating(teacher_id)
                if (rating.error) {
                    resolve({ error: rating.error })
                    return
                }
                result[0].rating = rating.result!.rating
                resolve({ result: result[0] })
            } catch (error) {
                resolve({ error: (error as QueryError).errno })
            }
        })
    }

    async updateTeacher(
        id: number,
        description: string
    ): Promise<DatabaseResponse<null>> {
        return new Promise(async (resolve) => {
            try {
                await this.transaction(
                    "UPDATE teacher SET description = ? WHERE id = (SELECT teacher_id FROM account_teacher WHERE account_id = ?)",
                    [description, id]
                )
                resolve({})
            } catch (error) {
                resolve({ error: (error as QueryError).errno })
            }
        })
    }

    async getTeacherAccountId(
        teacherId: number
    ): Promise<DatabaseResponse<ID>> {
        return new Promise(async (resolve) => {
            try {
                const result = await this.query<ID>(
                    `SELECT account_id AS id FROM account_teacher
                    INNER JOIN teacher ON teacher_id = teacher.id
                    WHERE teacher.id = ?`,
                    [teacherId]
                )
                resolve({ result: result[0] })
            } catch (error) {
                resolve({ error: (error as QueryError).errno })
            }
        })
    }

    // Categories
    async getCategories(): Promise<DatabaseResponse<Category[]>> {
        return new Promise(async (resolve) => {
            try {
                const result = await this.query<Category>(
                    "SELECT * FROM category",
                    []
                )
                result.forEach((category) => delete category.id)
                resolve({ result: result })
            } catch (error) {
                resolve({ error: (error as QueryError).errno })
            }
        })
    }

    // Subject
    async createSubject(
        accountId: number,
        categoryName: string,
        name: string,
        description: string,
        price: number,
        days: Day[],
        modality: string,
        size: number
    ): Promise<DatabaseResponse<number>> {
        return new Promise(async (resolve) => {
            try {
                const modalityId = await this.query<ID>(
                    "SELECT id FROM class_modality WHERE class_modality.option = ?",
                    [modality.toLowerCase()]
                )
                const teacherId = await this.query<ID>(
                    "SELECT teacher_id as id FROM account_teacher WHERE account_id = ?",
                    [accountId]
                )
                const categoryId = await this.query<ID>(
                    "SELECT id FROM category WHERE name = ?",
                    [categoryName]
                )
                const secondSet: Subtransaction[] = [
                    {
                        sql: "INSERT INTO teacher_subject (subject_id, teacher_id) VALUES (?, ?)",
                        values: [teacherId[0].id],
                        previousInsert: [[0, 0]],
                    },
                    {
                        sql: "INSERT INTO category_subject (subject_id, category_id) VALUES (?, ?)",
                        values: [categoryId[0].id],
                        previousInsert: [[0, 0]],
                    },
                ]
                for (const day of days) {
                    const dayId = await this.query<ID>(
                        "SELECT id FROM day WHERE name LIKE ?",
                        [day.name]
                    )
                    if (dayId.length == 0) {
                        resolve({ error: 66 })
                        return
                    }
                    for (const timeslot of day.timeslots!) {
                        const startTimeId = await this.query<ID>(
                            "SELECT id FROM time WHERE time = ?",
                            [timeslot.start_time]
                        )
                        const endTimeId = await this.query<ID>(
                            "SELECT id FROM time WHERE time = ?",
                            [timeslot.end_time]
                        )
                        var startId: number | null = null
                        if (startTimeId.length == 0) {
                            const result = await this.multiTransaction([
                                {
                                    sql: "INSERT INTO time VALUES (NULL, ?)",
                                    values: [timeslot.start_time],
                                },
                            ])
                            startId = result.insertIds[0][0]
                            await this.completeTransaction(result.connection)
                        }
                        var endId: number | null = null
                        if (endTimeId.length == 0) {
                            const result = await this.multiTransaction([
                                {
                                    sql: "INSERT INTO time VALUES (NULL, ?)",
                                    values: [timeslot.end_time],
                                },
                            ])
                            endId = result.insertIds[0][0]
                            await this.completeTransaction(result.connection)
                        }
                        secondSet.push({
                            sql: "INSERT INTO timeslot VALUES (NULL, ?, ?, ?, ?)",
                            values: [
                                dayId[0].id,
                                startId ?? startTimeId[0].id,
                                endId ?? endTimeId[0].id,
                            ],
                            previousInsert: [[0, 0]],
                        })
                    }
                }
                const result = await this.multiTransaction(
                    [
                        {
                            sql: "INSERT INTO subject VALUES (NULL, ?, ?, ?, ?, ?)",
                            values: [
                                name,
                                description,
                                price,
                                size,
                                modalityId[0].id,
                            ],
                        },
                    ],
                    secondSet
                )
                await this.completeTransaction(result.connection)
                resolve({ result: result.insertIds[0][0] })
            } catch (error) {
                resolve({ error: (error as QueryError).errno })
            }
        })
    }

    async getSubject(id: number): Promise<DatabaseResponse<Subject>> {
        return new Promise(async (resolve) => {
            try {
                const subject = await this.query<Subject>(
                    `SELECT subject.*, category.name AS category_name
                    FROM subject INNER JOIN category_subject ON subject.id = subject_id
                    INNER JOIN category ON category_id = category.id WHERE subject.id = ?`,
                    [id]
                )
                if (subject.length == 0) {
                    resolve({})
                    return
                }
                const days = await this.getDays(subject[0].id)
                if (days) {
                    subject[0].days = days
                }
                resolve({ result: subject[0] })
            } catch (error) {
                resolve({ error: (error as QueryError).errno })
            }
        })
    }

    async getSubjectForTimeSlot(
        id: number
    ): Promise<DatabaseResponse<SubjectForTimeSlot>> {
        return new Promise(async (resolve) => {
            try {
                const subject = await this.query<SubjectForTimeSlot>(
                    `SELECT subject.id, subject.name, subject.description, subject.price, subject.size, class_modality.option as modality, category.name AS category_name,
                    account.id AS teacher_id FROM subject
                    INNER JOIN category_subject ON subject.id = category_subject.subject_id
                    INNER JOIN category ON category_id = category.id
                    INNER JOIN  class_modality ON class_modality.id = subject.modality
                    INNER JOIN teacher_subject ON teacher_subject.subject_id = subject.id
                    INNER JOIN account_teacher ON account_teacher.teacher_id = teacher_subject.teacher_id
                    INNER JOIN account ON account_teacher.account_id = account.id
                    WHERE subject.id = ?`,
                    [id]
                )
                if (subject.length == 0) {
                    resolve({})
                    return
                }
                const days = await this.getDays(subject[0].id)
                if (days) {
                    subject[0].days = days
                }
                resolve({ result: subject[0] })
            } catch (error) {
                resolve({ error: (error as QueryError).errno })
            }
        })
    }

    async deleteSubject(
        accountId: number,
        id: number
    ): Promise<DatabaseResponse<null>> {
        return new Promise(async (resolve) => {
            try {
                const teacherId = await this.query<ID>(
                    "SELECT teacher_id AS id FROM account_teacher WHERE account_id = ?",
                    [accountId]
                )
                const subjectId = await this.query<ID>(
                    "SELECT subject_id AS id FROM teacher_subject WHERE teacher_id = ? AND subject_id = ?",
                    [teacherId[0].id, id]
                )
                if (subjectId.length == 0) {
                    resolve({ error: 66 })
                    return
                }
                await this.transaction("DELETE FROM subject WHERE id = ?", [
                    subjectId[0].id,
                ])
                resolve({})
            } catch (error) {
                resolve({ error: (error as QueryError).errno })
            }
        })
    }

    // Search
    async search(query: string): Promise<DatabaseResponse<Query>> {
        return new Promise(async (resolve) => {
            try {
                const subjects = await this.query<Subject>(
                    `SELECT subject.*, category.name AS category_name
                    FROM subject INNER JOIN category_subject ON subject.id = subject_id
                    INNER JOIN category ON category_id = category.id
                    WHERE subject.name LIKE ? OR category.name LIKE ? LIMIT 10`,
                    [`%${query}%`, `%${query}%`]
                )
                const teachers = await this.query<TeacherPublic>(
                    `SELECT
                    teacher.*,
                    account.name,
                    account.id AS account_id,
                    AVG(r.rating) AS rating
                FROM
                    teacher
                INNER JOIN
                    account_teacher ON teacher.id = account_teacher.teacher_id
                INNER JOIN
                    account ON account_teacher.account_id = account.id
                LEFT JOIN
                    rating r ON teacher.id = r.teacher_id
                WHERE
                    name LIKE ?
                GROUP BY
                    teacher.id, account.name, account.id;
                `,
                    [`%${query}%`]
                )
                const result: Query = {
                    subjects: subjects.length != 0 ? subjects : undefined,
                    teachers: teachers,
                }
                resolve({ result: result })
            } catch (error) {
                resolve({ error: (error as QueryError).errno })
            }
        })
    }

    //rating
    async getRating(teacher_id: Number): Promise<DatabaseResponse<Rating>> {
        return new Promise(async (resolve) => {
            try {
                const result = await this.query<Rating>(
                    "SELECT AVG(rating) as rating FROM rating WHERE teacher_id = ?",
                    [teacher_id]
                )
                if (result[0].rating == null) {
                    result[0].rating = 0
                }
                resolve({ result: result[0] })
            } catch (error) {
                resolve({ error: (error as QueryError).errno })
            }
        })
    }

    async createRating(
        reservation_id: Number,
        teacher_id: Number,
        givenRating: Number
    ): Promise<DatabaseResponse<null>> {
        return new Promise(async (resolve) => {
            try {
                await this.transaction("INSERT INTO rating VALUES (?, ?)", [
                    teacher_id,
                    givenRating,
                ])
                await this.transaction("DELETE FROM reservation WHERE id = ?", [
                    reservation_id,
                ])
                resolve({})
            } catch (error) {
                resolve({ error: (error as QueryError).errno })
            }
        })
    }

    // Reservation
    async createReservation(
        account_id: number,
        timeslot_id: number,
        date: string,
        modality: string
    ): Promise<DatabaseResponse<number>> {
        return new Promise(async (resolve) => {
            try {
                const modalityId = await this.query<ID>(
                    "SELECT id FROM class_modality WHERE class_modality.option = ?",
                    [modality.toLowerCase()]
                )
                const dateId = await this.query<ID>(
                    "SELECT id FROM DATE WHERE date = ?",
                    [date]
                )
                var id = undefined
                if (dateId.length == 0) {
                    const result = await this.multiTransaction([
                        {
                            sql: "INSERT INTO DATE VALUES (NULL, ?)",
                            values: [date],
                        },
                    ])
                    await this.completeTransaction(result.connection)
                    id = result.insertIds[0][0]
                }
                const size = await this.query<ID>(
                    "SELECT size FROM subject INNER JOIN timeslot ON timeslot.subject_id = subject.id WHERE timeslot.id = ?",
                    [timeslot_id]
                )
                const reservations = await this.query<ID>(
                    "SELECT COUNT(timeslot_id) as current_student_count FROM reservation WHERE timeslot_id = ? AND date_id = ? GROUP BY timeslot_id",
                    [timeslot_id, id ?? dateId[0].id]
                )
                const checkExisting = await this.query<ID>(
                    "SELECT * FROM reservation WHERE account_id = ? AND timeslot_id = ? AND date_id = ?",
                    [account_id, timeslot_id, id ?? dateId[0].id]
                )
                if (
                    checkExisting.length != 0 ||
                    (reservations[0] != undefined &&
                        reservations[0]["current_student_count"] >=
                            size[0]["size"])
                ) {
                    resolve({ error: 66 })
                    return
                }
                const result = await this.multiTransaction([
                    {
                        sql: "INSERT INTO reservation VALUES (NULL, ?, ?, ?, ?)",
                        values: [
                            account_id,
                            timeslot_id,
                            id ?? dateId[0].id,
                            modalityId[0].id,
                        ],
                    },
                ])
                await this.completeTransaction(result.connection)
                resolve({ result: result.insertIds[0][0] })
            } catch (error) {
                resolve({ error: (error as QueryError).errno })
            }
        })
    }

    async getReservations(
        account_id: Number
    ): Promise<DatabaseResponse<Reservation[]>> {
        return new Promise(async (resolve) => {
            try {
                // Query for cases where the account is a student
                let result = await this.query<Reservation>(
                    `select reservation.id as reservation_id,
                    t.id as timeslot_id,
                    s.name as subject_name,
                    s.id as subject_id,
                    a.name as teacher_name,
                    at.account_id as teacher_id,
                    d.date as date,
                    t2.time as start_time,
                    t3.time as end_time,
                    acc.id as student_id,
                    acc.name as student_name
                    from reservation
                    inner join timeslot t on t.id = reservation.timeslot_id
                    inner join subject s on s.id = t.subject_id
                    inner join teacher_subject ts on s.id = ts.subject_id
                    inner join account_teacher at on at.teacher_id = ts.teacher_id
                    inner join account a on a.id = at.account_id
                    inner join account acc on acc.id = reservation.account_id
                    inner join date d on d.id = reservation.date_id
                    inner join time t3 on t3.id = t.end_time_id
                    inner join time t2 on t2.id = t.start_time_id
                    where reservation.account_id = ?`,
                    [account_id]
                )

                // If no results, query for cases where the account is a teacher
                if (result.length === 0) {
                    result = await this.query<Reservation>(
                        `select reservation.id as reservation_id,
                        t.id as timeslot_id,
                        s.name as subject_name,
                        s.id as subject_id,
                        acc.name as student_name,
                        acc.id as student_id,
                        d.date as date,
                        t2.time as start_time,
                        t3.time as end_time,
                        a.id as teacher_id,
                        a.name as teacher_name
                        from reservation
                        inner join timeslot t on t.id = reservation.timeslot_id
                        inner join subject s on s.id = t.subject_id
                        inner join teacher_subject ts on s.id = ts.subject_id
                        inner join account_teacher at on at.teacher_id = ts.teacher_id
                        inner join account a on a.id = at.account_id
                        inner join account acc on acc.id = reservation.account_id
                        inner join date d on d.id = reservation.date_id
                        inner join time t3 on t3.id = t.end_time_id
                        inner join time t2 on t2.id = t.start_time_id
                        where at.account_id = ?`,
                        [account_id]
                    )
                }
                resolve({ result })
            } catch (error) {
                resolve({ error: (error as QueryError).errno })
            }
        })
    }

    async deleteReservation(id: Number): Promise<DatabaseResponse<null>> {
        return new Promise(async (resolve) => {
            try {
                await this.transaction("DELETE FROM reservation WHERE id = ?", [
                    id,
                ])
                resolve({})
            } catch (error) {
                resolve({ error: (error as QueryError).errno })
            }
        })
    }

    async verifyReservation(id: number): Promise<DatabaseResponse<boolean>> {
        return new Promise(async (resolve) => {
            try {
                const result = await this.query<ReservationVerify>(
                    `SELECT d.date, time.time AS end_time
                    FROM reservation r
                    INNER JOIN date d ON r.date_id = d.id
                    INNER JOIN timeslot t ON r.timeslot_id = t.id
                    INNER JOIN time ON t.end_time_id = time.id
                    WHERE r.id = ?`,
                    [id]
                )

                if (result.length === 0) {
                    resolve({ result: false })
                    return
                }

                const today = new Date()
                const reservationDate = new Date(result[0].date)
                const [hours, minutes, seconds] = result[0].end_time
                    .split(":")
                    .map(Number)
                reservationDate.setHours(hours, minutes, seconds, 0)

                if (today > reservationDate) {
                    resolve({ result: true })
                    return
                }

                resolve({ result: false })
            } catch (error) {
                resolve({ error: (error as QueryError).errno })
            }
        })
    }

    private async getTimeslot(id: number): Promise<Timeslot> {
        return new Promise(async (resolve) => {
            const result = (
                await this.query<TimeslotInternal>(
                    "SELECT * FROM timeslot WHERE id = ?",
                    [id]
                )
            )[0]
            const start_time = await this.getTime(result.start_time_id)
            const end_time = await this.getTime(result.end_time_id)
            resolve({ start_time: start_time, end_time: end_time })
        })
    }

    private async getDay(id: number): Promise<string> {
        return new Promise(async (resolve) => {
            const result = await this.query<DayInternal>(
                "SELECT * FROM day WHERE id = ?",
                [id]
            )
            if (result.length == 0) throw Error("Day not found.")
            resolve(result[0].name)
        })
    }

    private async getTime(id: number): Promise<string> {
        return new Promise(async (resolve) => {
            const result = await this.query<TimeInternal>(
                "SELECT * FROM time WHERE id = ?",
                [id]
            )
            if (result.length == 0) throw Error("Time not found.")
            resolve(result[0].time)
        })
    }

    private async getDate(id: number): Promise<Date> {
        return new Promise(async (resolve) => {
            const result = await this.query<DateInternal>(
                "SELECT * FROM DATE WHERE id = ?",
                [id]
            )
            if (result.length == 0) throw Error("Date not found.")
            resolve(result[0].date)
        })
    }

    async getStudentChats(
        account_id: number
    ): Promise<DatabaseResponse<Account[]>> {
        return new Promise(async (resolve) => {
            try {
                const accounts = await this.query<Account>(
                    `SELECT account.* FROM chat INNER JOIN account
                    ON chat.teacher_account_id = account.id
                    WHERE chat.student_account_id = ?`,
                    [account_id]
                )
                for (const account of accounts) {
                    delete account.password
                }
                resolve({ result: accounts })
            } catch (error) {
                resolve({ error: (error as QueryError).errno })
            }
        })
    }

    async getTeacherChats(
        account_id: number
    ): Promise<DatabaseResponse<Account[]>> {
        return new Promise(async (resolve) => {
            try {
                const accounts = await this.query<Account>(
                    `SELECT account.* FROM chat INNER JOIN account
                    ON chat.student_account_id = account.id
                    WHERE chat.teacher_account_id = ?`,
                    [account_id]
                )
                for (const account of accounts) {
                    delete account.password
                }
                resolve({ result: accounts })
            } catch (error) {
                resolve({ error: (error as QueryError).errno })
            }
        })
    }

    async createChat(
        studentId: number,
        teacherId: number
    ): Promise<DatabaseResponse<null>> {
        return new Promise(async (resolve) => {
            try {
                const result = await this.transaction(
                    "INSERT INTO chat VALUES (?, ?)",
                    [studentId, teacherId]
                )
                resolve({})
            } catch (error) {
                resolve({ error: (error as QueryError).errno })
            }
        })
    }
}

const database = new Database()

export default database
