import nodemailer, { type Transporter } from "nodemailer"

export class Mailer {
    private transporter: Transporter

    constructor() {
        this.transporter = nodemailer.createTransport({
            service: "gmail",
            secure: true,
            auth: {
                user: Bun.env.MAIL_USER,
                pass: Bun.env.MAIL_PASSWORD,
            },
        })
    }

    async sendRegisterMail(name: string, email: string): Promise<boolean> {
        return new Promise((resolve) => {
            this.transporter.sendMail(
                {
                    from: Bun.env.MAIL_USER,
                    to: email,
                    subject: "Enlight Registration",
                    text: `Hi ${name}, thanks for signing in to Enlight! If you didn't do this action, click here to delete your account.`,
                },
                (error) => {
                    if (error) {
                        resolve(false)
                    }
                    resolve(true)
                }
            )
        })
    }

    async sendRecoveryMail(token: string, email: string): Promise<boolean> {
        return new Promise((resolve) => {
            this.transporter.sendMail(
                {
                    from: "enlightnoreply@gmail.com",
                    to: email,
                    subject: "Enlight Password Reset",
                    html: `<p><a href=http://18.229.107.19/password-reset/${token}>Click here</a> to reset your password. If this wasn't you, please change your password.</p>`,
                },
                (error) => {
                    if (error) {
                        resolve(false)
                    }
                    resolve(true)
                }
            )
        })
    }
}

export default function mailer() {
    return new Mailer()
}
