import { Hono } from "hono"
import type { Variables } from "../data/variables"
import database from "../util/database/database"
import auth from "../middleware/auth"
import { badRequestStatus, internalServerErrorStatus } from "../data/constants"

const app = new Hono<{ Variables: Variables }>()

app.use(auth.authenticate)

app.get("/", async (c) => {
    const id = c.get("id")
    const response = await database.getReservations(id)
    if (response.error) {
        c.status(500)
        return c.text(internalServerErrorStatus)
    }
    return c.json(response.result)
})

app.post("/", async (c) => {
    const id = c.get("id")
    const { timeslot_id, date, modality } = await c.req.json()
    if (!timeslot_id || !date || !modality) {
        c.status(400)
        return c.text(badRequestStatus)
    }
    const response = await database.createReservation(
        id,
        timeslot_id,
        date,
        modality
    )
    if (response.error) {
        c.status(500)
        return c.text(internalServerErrorStatus)
    }
    return c.text(response.result!.toString())
})

app.delete("/", async (c) => {
    const { id } = await c.req.json()
    if (!id) {
        c.status(400)
        return c.text(badRequestStatus)
    }
    const response = await database.deleteReservation(id)
    if (response.error) {
        c.status(500)
        return c.text(internalServerErrorStatus)
    }
    c.status(200)
    return c.text("Reservation deleted.")
})

export default app
