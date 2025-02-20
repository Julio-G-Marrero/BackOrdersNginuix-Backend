const twilio = require('twilio');

// ✅ Usa el `ACCOUNT_SID`, `AUTH_TOKEN` y `MESSAGING_SERVICE_SID` correctos
const ACCOUNT_SID = "ACa5af537e7de8d375fc557c8417d8fb4a";  
const AUTH_TOKEN = "6286567a34bd77675277674b31e4e074";  
const MESSAGING_SERVICE_SID = "MG2cb5f038c8998278b6003300a47adcdd";  // ✅ Nuevo SID del servicio
const TEMPLATE_SID = "HXece5868930f47649cf3b6f0b4b6998eb";  // ✅ Template SID aprobado

// 🔹 Configurar cliente de Twilio con credenciales correctas
const client = twilio(ACCOUNT_SID, AUTH_TOKEN);

const sendWhatsAppMessage = async (to, variables) => {
    try {
        if (!MESSAGING_SERVICE_SID || !TEMPLATE_SID) {
            console.error("❌ ERROR: Faltan credenciales de Twilio.");
            return;
        }

        const formattedVariables = {
            1: variables.orderNumber,  
            2: variables.status        
        };

        const response = await client.messages.create({
            messagingServiceSid: MESSAGING_SERVICE_SID,  // 📌 Usa el Messaging Service
            to: `whatsapp:${to}`,
            contentSid: TEMPLATE_SID,  
            contentVariables: JSON.stringify(formattedVariables)  
        });

        console.log("📨 Mensaje enviado con éxito:", response.sid);
        return response;
    } catch (error) {
        console.error("❌ Error enviando mensaje de WhatsApp:", error);
        throw error;
    }
};

module.exports = { sendWhatsAppMessage };
