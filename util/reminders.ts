import database from "./database/database"
import type { ID } from "./database/interfaces"
import type { RowDataPacket } from "mysql2"
import mailer from "./mailer"
import firebase from "./firebase"
import type { Message } from "firebase-admin/messaging"

interface ReservationResult extends RowDataPacket {
    account_id: number
    timeslot_id: number
}

interface TimeslotResult extends RowDataPacket {
    subject_id: number
    start_time_id: number
}

interface SubjectResult extends RowDataPacket {
    name: string
}

interface TimeResult extends RowDataPacket {
    time: string
}

function buildMessage(
    topic: number,
    name: string,
    subject: string,
    time: string
): Message {
    return {
        topic: topic.toString(),
        notification: {
            title: "Reminder: Reservation for tomorrow",
            body: `Hi ${name}, you have a reservation for ${subject} at ${time} tomorrow. See you then!`,
        },
        android: {
            priority: "high",
        },
    }
}

async function sendReminders() {
    const dateId = await database.query<ID>(
        "SELECT id FROM date WHERE date = (DATE_ADD(CURDATE(), INTERVAL 1 DAY));",
        []
    )
    if (dateId.length == 0) {
        console.log("No reservations for tomorrow")
        return
    }
    const reservations = await database.query<ReservationResult>(
        "SELECT * FROM reservation WHERE date_id = ?;",
        [dateId[0].id]
    )
    for (const reservation of reservations) {
        const timeslot = await database.query<TimeslotResult>(
            "SELECT * FROM timeslot WHERE id = ?;",
            [reservation.timeslot_id]
        )
        const subject = await database.query<SubjectResult>(
            "SELECT name FROM subject WHERE id = ?;",
            [timeslot[0].subject_id]
        )
        const time = await database.query<TimeResult>(
            "SELECT time FROM time WHERE id = ?;",
            [timeslot[0].start_time_id]
        )
        const account = await database.getAccount(reservation.account_id)
        if (account.error) {
            console.log("Error fetching account")
            return
        }
        await mailer.sendReservationNotification(
            account.result!.name,
            account.result!.email,
            subject[0].name,
            time[0].time
        )
        await firebase
            .messaging()
            .send(
                buildMessage(
                    account.result!.id,
                    account.result!.name,
                    subject[0].name,
                    time[0].time
                )
            )
    }
    console.log("Notifications sent successfully")
}

export { sendReminders }
