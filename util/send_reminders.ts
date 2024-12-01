import { sendReminders } from "./reminders"

sendReminders().then(() => {
    process.exit(0)
})
