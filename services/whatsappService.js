const twilio = require('twilio');

// 🔒 Hardcodeamos las credenciales para pruebas (Úsalo solo temporalmente)
const ACCOUNT_SID = "SKad33a226d9dc3e76c270a445a02ff9a2";
const AUTH_TOKEN = "T5z3He3Lpteo3yFLbotREZsmWOgP5lTf";
const WHATSAPP_NUMBER = "whatsapp:+14155238886";  // 🔹 Número de WhatsApp de Twilio
const TEMPLATE_SID = "HXb5b62575e6e4ff6129ad7c8efe1f983e";  // 🔹 SID de la plantilla de Twilio

// Configurar cliente de Twilio con credenciales fijas
const client = twilio(ACCOUNT_SID, AUTH_TOKEN);

const sendWhatsAppMessage = async (to, variables) => {
    try {
        // 🔹 Asegurar que los valores requeridos existen
        if (!WHATSAPP_NUMBER || !TEMPLATE_SID) {
            console.error("❌ ERROR: Faltan credenciales de Twilio.");
            console.error("TWILIO_WHATSAPP_NUMBER:", WHATSAPP_NUMBER || "No configurado ❌");
            console.error("TWILIO_TEMPLATE_SID:", TEMPLATE_SID || "No configurado ❌");
            return;
        }

        // 🔹 Enviar el mensaje a través de Twilio
        const response = await client.messages.create({
            from: WHATSAPP_NUMBER,
            to: `whatsapp:${to}`,
            contentSid: TEMPLATE_SID,  // Usar la plantilla de Twilio
            contentVariables: JSON.stringify(variables)  // Pasar las variables dinámicas
        });

        console.log("📨 Mensaje enviado con éxito:", response.sid);
        return response;
    } catch (error) {
        console.error("❌ Error enviando mensaje de WhatsApp:", error);
        throw error;
    }
};

module.exports = { sendWhatsAppMessage };
