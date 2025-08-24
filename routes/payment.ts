import { Hono } from "hono"
import type { Variables } from "../data/variables"
import auth from "../middleware/auth"
import { badRequestStatus, internalServerErrorStatus } from "../data/constants"
import database from "../util/database/database"
import { MercadoPagoConfig, Preference } from 'mercadopago'
import type { PreferenceRequest } from "mercadopago/dist/clients/preference/commonTypes"
const client = new MercadoPagoConfig({accessToken: 'MERCADO_PAGO_ACCESS_TOKEN'})

const app = new Hono<{ Variables: Variables }>()

app.use(auth.authenticate)

app.post("/", async (c) => {
    const { teacher_name, subject_id} = await c.req.json()
    const unit_price = await database.getPrice(subject_id)
    try {
        const body: PreferenceRequest = {
            items: [
            {
                id: Math.floor(Math.random() * 1000000).toString(),
                title: "Class with " + teacher_name,
                quantity: 1,
                unit_price: Number(unit_price),
                currency_id: 'ARS'
            }
            ],
            back_urls: {
            success: 'https://www.enlight.com/success',
            failure: 'https://www.enlight.com/failure',
            pending: 'https://www.enlight.com/pending'
            },
            auto_return: 'approved',
        };
        const preference = new Preference(client)
        const result = await preference.create({body})
        return c.json(result.sandbox_init_point)
    } catch(error) {
        c.status(500)
        return c.text(internalServerErrorStatus)
    }
})

export default app
