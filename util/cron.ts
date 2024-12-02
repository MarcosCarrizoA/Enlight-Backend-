import cron from "node-cron"
import { sendReminders } from "./reminders"

function startCron() {
    console.log("Cron job started")
    cron.schedule("0 12 * * *", async () => {
        await sendReminders()
    })
}

export { startCron }
