const twilio = require('twilio');

// ✅ Usa el `ACCOUNT_SID` y `AUTH_TOKEN` correctos
const ACCOUNT_SID = "ACa5af537e7de8d375fc557c8417d8fb4a";  
const AUTH_TOKEN = "6286567a34bd77675277674b31e4e074";  
const WHATSAPP_NUMBER = "whatsapp:+19132988990";  
const TEMPLATE_SID = "HXece5868930f47649cf3b6f0b4b6998eb";  // ✅ Usa el correcto de tu plantilla

// 🔹 Configurar cliente de Twilio con credenciales correctas
const client = twilio(ACCOUNT_SID, AUTH_TOKEN);

const sendWhatsAppMessage = async (to, variables) => {
    try {
        if (!WHATSAPP_NUMBER || !TEMPLATE_SID) {
            console.error("❌ ERROR: Faltan credenciales de Twilio.");
            return;
        }

        // 🔹 Asegurar que las variables coincidan con la plantilla
        const formattedVariables = {
            1: variables.orderNumber,  // Debe coincidir con {{1}} en la plantilla
            2: variables.status        // Debe coincidir con {{2}} en la plantilla
        };

        const response = await client.messages.create({
            from: WHATSAPP_NUMBER,
            to: `whatsapp:${to}`,
            contentSid: TEMPLATE_SID,  // Usar la plantilla de Twilio
            contentVariables: JSON.stringify(formattedVariables)  // Formato correcto
        });

        console.log("📨 Mensaje enviado con éxito:", response.sid);
        return response;
    } catch (error) {
        console.error("❌ Error enviando mensaje de WhatsApp:", error);
        throw error;
    }
};

module.exports = { sendWhatsAppMessage };
