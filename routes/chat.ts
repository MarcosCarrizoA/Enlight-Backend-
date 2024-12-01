import { Hono } from "hono"
import type { Variables } from "../data/variables"
import database from "../util/database/database"
import auth from "../middleware/auth"
import type { MessageData } from "../util/database/interfaces"
import { badRequestStatus, internalServerErrorStatus } from "../data/constants"
import admin from "firebase-admin"
import { getMessaging, type Message } from "firebase-admin/messaging"

admin.initializeApp({
    credential: admin.credential.cert("./firebase-private-key.json"),
    databaseURL: "https://enlight-f3a1d-default-rtdb.firebaseio.com",
})
console.log("Firebase initialized")

const app = new Hono<{ Variables: Variables }>()

app.get("/")

app.use(auth.authenticate)

app.get("/", async (c) => {
    const id = c.get("id")
    const role = await database.getRole(id)
    if (role.error) {
        c.status(500)
        return c.text(internalServerErrorStatus)
    }
    const response =
        role.result?.name == "student"
            ? await database.getStudentChats(id)
            : role.result?.name == "teacher"
            ? await database.getTeacherChats(id)
            : null
    if (!response || response.error) {
        c.status(500)
        return c.text(internalServerErrorStatus)
    }
    for (const account of response.result!) {
        const picture = await database.getPicture(account.id)
        if (picture.error) {
            c.status(500)
            return c.text(internalServerErrorStatus)
        }
        account.picture = picture.result?.picture.toString("base64")
    }
    const json = { id: id, chats: response.result }
    return c.json(json)
})

app.post("/", async (c) => {
    const id = c.get("id")
    const { receiver_id } = await c.req.json()
    if (!receiver_id) {
        c.status(400)
        return c.text(badRequestStatus)
    }
    const role = await database.getRole(id)
    if (role.error) {
        c.status(500)
        return c.text(internalServerErrorStatus)
    }
    const receiverRole = await database.getRole(receiver_id)
    if (receiverRole.error) {
        c.status(500)
        return c.text(internalServerErrorStatus)
    }
    if (role.result?.name == receiverRole.result?.name) {
        c.status(403)
        return c.text("Forbidden.")
    }
    const studentId = role.result?.name == "student" ? id : receiver_id
    const teacherId = role.result?.name == "teacher" ? id : receiver_id
    const response = await database.createChat(studentId, teacherId)
    if (response.error) {
        c.status(response.error == 1062 ? 409 : 500)
        return c.text(
            response.error == 1062
                ? "Chat already exists."
                : "Internal server error. Please try again later."
        )
    }
    return c.text("Chat created successfully.")
})

app.post("/message", async (c) => {
    const id = c.get("id")
    const body: MessageData = await c.req.json()
    if (
        !body.sender_id ||
        !body.receiver_id ||
        !body.message ||
        !body.timestamp
    ) {
        c.status(400)
        return c.text(badRequestStatus)
    }
    const account = await database.getAccount(id)
    if (account.error) {
        c.status(500)
        return c.text(internalServerErrorStatus)
    }
    const message: Message = {
        topic: body.receiver_id.toString(),
        notification: {
            title: account.result?.name,
            body: body.message,
        },
    }
    try {
        await admin.messaging().send(message)
        c.status(200)
        return c.text("Message sent.")
    } catch (_) {
        c.status(500)
        return c.text(internalServerErrorStatus)
    }
})

export default app
