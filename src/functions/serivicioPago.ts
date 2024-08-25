import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { MercadoPagoConfig, Payment } from 'mercadopago';

// Configuración del SDK
const client = new MercadoPagoConfig({
    accessToken: process.env.MERCADO_PAGO_ACCESS_TOKEN || 'YOUR_ACCESS_TOKEN',
    options: {
        timeout: 5000,
        idempotencyKey: 'abc'  // Opcional
    }
});


const payment = new Payment(client);

interface RequestData {
    amount: string;
    description: string;
    paymentMethodId: string;
    payerEmail: string;
}

export async function createPayment(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    context.log(`Http function processed request for url "${request.url}"`);

    try {
        const requestData = await request.json() as RequestData;

        if (!requestData.amount || !requestData.description || !requestData.paymentMethodId || !requestData.payerEmail) {
            return {
                status: 400,
                body: 'Faltan parámetros necesarios'
            };
        }

        const body = {
            transaction_amount: parseFloat(requestData.amount),
            description: requestData.description,
            payment_method_id: requestData.paymentMethodId,
            payer: {
                email: requestData.payerEmail
            }
        };

        const response = await payment.create({ body });

        return {
            status: 200,
            body: JSON.stringify({ paymentId: response.id })
        };

    } catch (error) {
        context.log('Error creating payment:', error);

        return {
            status: 500,
            body: 'Error creating payment'
        };
    }
}

app.http('createPayment', {
    methods: ['POST'],
    authLevel: 'anonymous',
    handler: createPayment
});
