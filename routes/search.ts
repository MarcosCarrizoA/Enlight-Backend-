import { Hono } from "hono"
import database from "../util/database/database"
import type { Variables } from "../data/variables"
import auth from "../middleware/auth"
import { badRequestStatus, internalServerErrorStatus } from "../data/constants"

const app = new Hono<{ Variables: Variables }>()

app.use(auth.authenticate)

app.get("/", async (c) => {
    const { q } = c.req.query()
    if (!q) {
        c.status(400)
        return c.text(badRequestStatus)
    }
    const response = await database.search(q)
    if (response.error) {
        c.status(500)
        return c.text(internalServerErrorStatus)
    }
    if (response.result?.teachers) {
        for (const teacher of response.result.teachers) {
            const picture = await database.getPicture(teacher.account_id!!)
            if (picture.error) {
                c.status(500)
                return c.text(internalServerErrorStatus)
            }
            delete teacher.account_id
            teacher.picture = picture.result?.picture.toString("base64")
        }
    }
    response.result?.teachers?.forEach((teacher) => { 
        if (teacher.rating === null) {
            teacher.rating = 0.0
        }
    })
    return c.json(response.result)
})

export default app
