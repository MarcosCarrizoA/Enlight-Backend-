import { Hono } from "hono"
import type { Variables } from "../data/variables"
import database from "../util/database/database"
import auth from "../middleware/auth"
import { badRequestStatus, internalServerErrorStatus } from "../data/constants"

const app = new Hono<{ Variables: Variables }>()

app.use(auth.authenticate)

app.get("/", async (c) => {
    const { reservation_id } = c.req.query()
    if (!reservation_id) {
        c.status(400)
        return c.text(badRequestStatus)
    }
    const verification = await database.verifyReservation(
        Number(reservation_id)
    )
    if (verification.error) {
        c.status(500)
        return c.text(internalServerErrorStatus)
    }
    if (verification.result === false) {
        c.status(409)
        return c.text("You cannot complete a class before it happens.")
    }
    c.status(200)
    return c.text("Rating is available.")
})

app.put("/", async (c) => {
    const { reservation_id, teacher_id, rating } = await c.req.json()
    if (!reservation_id || !teacher_id || !rating) {
        c.status(400)
        return c.text(badRequestStatus)
    }
    const teacher = await database.getTeacher(teacher_id)
    const verification = await database.verifyReservation(reservation_id)
    if (verification.error) {
        c.status(500)
        return c.text(internalServerErrorStatus)
    }
    if (verification.result === false) {
        c.status(409)
        return c.text("You cannot complete a class before it happens.")
    }
    const response = await database.createRating(
        reservation_id,
        teacher.result?.id!,
        rating
    )
    if (response.error) {
        c.status(500)
        return c.text(internalServerErrorStatus)
    }
    c.status(200)
    return c.text("Rating created.")
})

export default app
