import type { PoolConnection, RowDataPacket } from "mysql2"

export interface Credentials extends RowDataPacket {
    id: number
    password: string
    role_id: number
}

export interface ID extends RowDataPacket {
    id: number
}

export interface TimeID extends RowDataPacket {
    id: number
    start_time_id: number
    end_time_id: number
}

export interface Token extends RowDataPacket {
    token: string
}

export interface Account extends RowDataPacket {
    email: string
    name: string
    birthday: Date
    address: string
    picture?: string
    student?: Student
    teacher?: Teacher
    categories?: Category[]
}

export interface Picture extends RowDataPacket {
    picture: Buffer
}

export interface Role extends RowDataPacket {
    id?: number
    name: string
}

export interface Teacher extends RowDataPacket {
    id?: number
    rating: number
    description: string
    categories: Category[]
    subjects?: Subject[]
}

export interface Student extends RowDataPacket {
    reservations?: Reservation[]
}

export interface TeacherPublic extends RowDataPacket {
    account_id?: number
    id?: number
    rating: number
    name: string
    description: string
    picture?: string
}

export interface Subject extends RowDataPacket {
    id: number
    category_name: string
    name: string
    description: string
    price: number
    days?: Day[]
}

export interface SubjectForTimeSlot extends RowDataPacket {
    id: number
    category_name: string
    name: string
    description: string
    price: number
    days?: Day[]
    modality: string
    size: number
}

export interface Day extends RowDataPacket {
    id?: number
    name: string
    timeslots?: Timeslot[]
}

export interface DayInternal extends RowDataPacket {
    id: number
    name: string
}

export interface Rating extends RowDataPacket {
    rating: number
}

export interface Time extends RowDataPacket {
    id?: number
    time: string
}

export interface TimeInternal extends RowDataPacket {
    id: number
    time: string
}

export interface Timeslot {
    id?: number
    start_time: string
    end_time: string
}

export interface TimeslotInternal extends RowDataPacket {
    id: number
    subject_id: number
    day_id: number
    start_time_id: number
    end_time_id: number
}


export interface Reservation extends RowDataPacket {
    reservation_id: number
    timeslot_id: number
    name_subject: string
    subject_id: number
    name_teacher: string
    teacher_id: number
    date: Date
    start_time: Time
    end_time: Time
}

export interface Category extends RowDataPacket {
    id?: number
    name: String
}

export interface DateInternal extends RowDataPacket {
    id: number
    date: Date
}

export interface DatabaseResponse<T> {
    error?: number
    result?: T
}

export interface TransactionResult {
    connection: PoolConnection
    insertIds: number[][]
}

export interface Query {
    teachers?: TeacherPublic[]
    subjects?: Subject[]
}

export interface Subtransaction {
    sql: string
    values: any[]
    /** Insert ID of previous subtransaction to be inserted as the first value parameter. */
    previousInsert?: number[][]
}
