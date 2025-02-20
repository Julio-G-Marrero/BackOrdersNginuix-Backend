const twilio = require('twilio');

// ✅ Nuevas credenciales de Twilio (según tu captura)
const ACCOUNT_SID = "ACa5af537e7de8d375fc557c8417d8fb4a";  
const AUTH_TOKEN = "6286567a34bd77675277674b31e4e074";  
const WHATSAPP_NUMBER = "whatsapp:+19132988990";  // ✅ Nuevo número de Twilio
const TEMPLATE_SID = "HXb5b62575e6e4ff6129ad7c8efe1f983e";  // ✅ SID de la plantilla (ajústalo si es necesario)

// 🔹 Configurar cliente de Twilio con credenciales correctas
const client = twilio(ACCOUNT_SID, AUTH_TOKEN);

const sendWhatsAppMessage = async (to, variables) => {
    try {
        if (!WHATSAPP_NUMBER || !TEMPLATE_SID) {
            console.error("❌ ERROR: Faltan credenciales de Twilio.");
            console.error("TWILIO_WHATSAPP_NUMBER:", WHATSAPP_NUMBER || "No configurado ❌");
            console.error("TWILIO_TEMPLATE_SID:", TEMPLATE_SID || "No configurado ❌");
            return;
        }

        const response = await client.messages.create({
            from: WHATSAPP_NUMBER,
            to: `whatsapp:${to}`,
            contentSid: TEMPLATE_SID,  // Usar la plantilla de Twilio
            contentVariables: JSON.stringify(variables)
        });

        console.log("📨 Mensaje enviado con éxito:", response.sid);
        return response;
    } catch (error) {
        console.error("❌ Error enviando mensaje de WhatsApp:", error);
        throw error;
    }
};

module.exports = { sendWhatsAppMessage };
