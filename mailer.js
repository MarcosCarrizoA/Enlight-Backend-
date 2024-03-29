require("dotenv").config();
const nodemailer = require("nodemailer");

class Mailer {
    /**
     * @typedef MailerResponse
     * @property {boolean} ok - Indicates whether the response has an error.
     */
    #transporter;

    constructor() {
        this.#transporter = nodemailer.createTransport({
            service: "gmail",
            secure: true,
            auth: {
                user: process.env.MAIL_USER,
                pass: process.env.MAIL_PASSWORD
            }
        });
    }

    /**
     * 
     * @param {string} name 
     * @param {string} email 
     * @returns {Promise<MailerResponse>}
     */
    async sendRegisterMail(name, email) {
        return new Promise((resolve) => {
            this.#transporter.sendMail({
                from: process.env.MAIL_USER,
                to: email,
                subject: "Enlight Registration",
                text: `Hi ${name}, thanks for signing in to Enlight! If you didn't do this action, click here to delete your account.`
            }, (error, info) => {
                if (error) {
                    resolve({ ok: false });
                }
                resolve({ ok: true });
            });
        });
    }

    /**
     * 
     * @param {string} token 
     * @returns {Promise<MailerResponse>}
     */
    async sendRecoveryMail(token) {
        return new Promise((resolve) => {
            this.#transporter.sendMail({
                from: "enlightnoreply@gmail.com",
                to: email,
                subject: "Enlight Password Reset",
                html: `<p><a href=http://18.229.107.19/password-reset/${token}>Click here</a> to reset your password. If this wasn't you, please change your password.</p>`
            }, (error, info) => {
                if (error) {
                    resolve({ ok: false });
                }
                resolve({ ok: true });
            });
        });
    }
}

function mailer() {
    return new Mailer();
}

module.exports = mailer;