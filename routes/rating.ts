import { Hono } from "hono"
import type { Variables } from "../data/variables"
import database from "../util/database/database"
import auth from "../middleware/auth"

const app = new Hono<{ Variables: Variables }>()

app.use(auth.authenticate)

app.get("/", async (c) => {
    const { reservation_id } = c.req.query()
    if (!reservation_id) {
        c.status(400)
        return c.text("")
    }
    const verification = await database.verifyReservation(Number(reservation_id))
    if (verification.error) {
        c.status(500)
        return c.text("")
    }
    if (verification.result === false) {
        c.status(409)
        return c.text("")
    }
    c.status(200)
    console.log(verification.result)
    return c.text("")
})

app.put("/", async (c) => {
    const { reservation_id, teacher_id, rating } = await c.req.json()
    if (!reservation_id || !teacher_id || !rating) {
        c.status(400)
        return c.text("")
    }
    const verification = await database.verifyReservation(reservation_id)
    if (verification.error) {
        c.status(500)
        return c.text("")
    }
    if (verification.result === false) {
        c.status(409)
        return c.text("")
    }
    const response = await database.createRating(reservation_id, teacher_id, rating)
    if (response.error) {
        c.status(500)
        return c.text("")
    }
    c.status(200)
    return c.text("")
})


export default app
