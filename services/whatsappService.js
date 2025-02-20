require('dotenv').config();
const twilio = require('twilio');

// Configurar cliente de Twilio con las nuevas credenciales
const client = twilio("ACa5af537e7de8d375fc557c8417d8fb4a", "f8f7a2e9638c787f698e5dab72a4273f");

const sendWhatsAppMessage = async (to, variables) => {
    try {
        if (!process.env.TWILIO_WHATSAPP_NUMBER || !process.env.TWILIO_TEMPLATE_SID) {
            console.error("❌ ERROR: Faltan configurar las variables de entorno.");
            console.error("TWILIO_WHATSAPP_NUMBER:", process.env.TWILIO_WHATSAPP_NUMBER || "No configurado ❌");
            console.error("TWILIO_TEMPLATE_SID:", process.env.TWILIO_TEMPLATE_SID || "No configurado ❌");
            return;
        }

        const response = await client.messages.create({
            from: process.env.TWILIO_WHATSAPP_NUMBER,
            to: `whatsapp:${to}`,
            contentSid: process.env.TWILIO_TEMPLATE_SID,  // SID de la plantilla de Twilio
            contentVariables: JSON.stringify(variables)  // Variables dinámicas del mensaje
        });

        console.log("📨 Mensaje enviado con éxito:", response.sid);
        return response;
    } catch (error) {
        console.error("❌ Error enviando mensaje de WhatsApp:", error);
        throw error;
    }
};

module.exports = { sendWhatsAppMessage };
