import { Hono } from "hono"
import { createBunWebSocket } from "hono/bun"

const app = new Hono()

const { upgradeWebSocket } = createBunWebSocket()

app.get(
    "/reservation",
    upgradeWebSocket((c) => {
        return {
            onMessage(event, ws) {
                console.log("si")
            },
            onClose: (event, ws)  => {
                console.log("si")
            },
            onOpen: (event, ws) => {
                console.log("si")
            },
        }
    })
)

export default app
