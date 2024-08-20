import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { EmailClient, EmailMessage, KnownEmailSendStatus } from "@azure/communication-email";
import { loadEmailTemplate, replacePlaceholders } from '../utils/emailUtils';

interface RequestData {
    message: string;
    buttonUrl: string;
    title: string;
    recipients: string;
    emailType: string;
    buttonText: string;
}

const connectionString = process.env.COMMUNICATION_SERVICE_CONNECTION_STRING;
const emailClient = new EmailClient(connectionString)

export async function envioCorreos(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    context.log(`Http function processed request for url "${request.url}"`);

    try {
        const requestData = await request.json() as RequestData;

        let emailContent = await loadEmailTemplate('emailTemplate');

        emailContent = replacePlaceholders(emailContent, {
            title: requestData.title,
            imageUrl: getImageUrl(requestData.emailType),
            message: requestData.message,
            buttonUrl: requestData.buttonUrl,
            buttonText: requestData.buttonText || 've a la aplicacion'
        });

        const emailMessage: EmailMessage = {
            senderAddress: "DoNotReply@8a7ba571-05e4-435c-8a85-03f299e2fb71.azurecomm.net",
            content: {
                subject: requestData.title,
                html: emailContent,
            },
            recipients: {
                to : [{address : requestData.recipients}] 
            }
        };

        const poller = await emailClient.beginSend(emailMessage);
        const response = await poller.pollUntilDone();

        if (response.status === KnownEmailSendStatus.Succeeded) {
            context.log("Email sent successfully.");
            return { status: 200, body: "Email sent successfully" };
        } else {
            context.log(`Failed to send email. Status: ${response.status}`);
            return { status: 500, body: `Failed to send email. Status: ${response.status}` };
        }

    } catch (error) {
        context.log(`Error occurred: ${error.message}`);
        return { status: 500, body: `Error occurred: ${error.message}` };
    }
}

function getImageUrl(emailType: string): string {
    switch (emailType) {
        case "welcome":
            return "https://www.questionpro.com/blog/wp-content/uploads/2023/07/2440-Portada-mensaje-de-bienvenida.jpg";
        case "passwordReset":
            return "https://scmlatam.com/wp-content/uploads/2023/09/induccion-de-personal.jpg";
        default:
            return "https://scmlatam.com/wp-content/uploads/2023/09/induccion-de-personal.jpg";
    }
}

app.http('envioCorreos', {
    methods: ['POST'],
    authLevel: 'anonymous',
    handler: envioCorreos
});
