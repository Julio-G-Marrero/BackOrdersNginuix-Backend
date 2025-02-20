const twilio = require('twilio');

// ✅ Credenciales Twilio
const ACCOUNT_SID = "ACa5af537e7de8d375fc557c8417d8fb4a";
const AUTH_TOKEN = "6286567a34bd77675277674b31e4e074";
const MESSAGING_SERVICE_SID = "MG2cb5f038c8998278b6003300a47adcdd";  // Mensajería para WhatsApp
const TWILIO_SMS_NUMBER = "+19132988990";  // Número de Twilio para SMS

const client = twilio(ACCOUNT_SID, AUTH_TOKEN);

// 🔹 **Función para enviar mensaje por WhatsApp**
const sendWhatsAppMessage = async (to, variables) => {
    try {
        const response = await client.messages.create({
            messagingServiceSid: MESSAGING_SERVICE_SID,  
            to: `whatsapp:${to}`,
            body: `📢 Notificación de Backorders: ${variables.message}`
        });

        console.log("📨 WhatsApp enviado con éxito:", response.sid);
        return response;
    } catch (error) {
        console.error("❌ Error enviando mensaje de WhatsApp:", error);
        throw error;
    }
};

// 🔹 **Función para enviar mensaje por SMS**
const sendSmsMessage = async (to, message) => {
    try {
        const response = await client.messages.create({
            from: TWILIO_SMS_NUMBER,
            to: to,
            body: message
        });

        console.log("📨 SMS enviado con éxito:", response.sid);
        return response;
    } catch (error) {
        console.error("❌ Error enviando mensaje por SMS:", error);
        throw error;
    }
};

// 🔹 **Función para enviar por ambos canales**
const sendNotification = async (to, message) => {
    try {
        console.log("🚀 Enviando notificación por WhatsApp y SMS...");

        // Enviar WhatsApp
        await sendWhatsAppMessage(to, { message });

        // Enviar SMS
        await sendSmsMessage(to, message);

        console.log("✅ Notificaciones enviadas exitosamente.");
    } catch (error) {
        console.error("❌ Error en el envío de notificaciones:", error);
    }
};

module.exports = { sendNotification };
