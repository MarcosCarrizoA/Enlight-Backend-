import { Hono } from "hono"
import type { Variables } from "../../data/variables"
import database from "../../util/database/database"
import auth from "../../middleware/auth"

const app = new Hono<{ Variables: Variables }>()

app.use(auth.authenticate)

app.put("/", async (c) => {
    const { picture } = await c.req.json()
    if (!picture) {
        c.status(400)
        return c.text("")
    }
    const id = c.get("id")
    const buffer = Buffer.from(picture, "base64")
    const response = await database.insertPicture(id, buffer)
    if (response.error) {
        c.status(500)
        return c.text("")
    }
    return c.text("")
})

app.delete("/", async (c) => {
    const id = c.get("id")
    const response = await database.deletePicture(id)
    if (response.error) {
        c.status(500)
        return c.text("")
    }
    return c.text("")
})

export default app
