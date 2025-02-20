const twilio = require('twilio');

// ✅ Credenciales correctas
const ACCOUNT_SID = "ACa5af537e7de8d375fc557c8417d8fb4a";  
const AUTH_TOKEN = "6286567a34bd77675277674b31e4e074";  
const MESSAGING_SERVICE_SID = "MG2cb5f038c8998278b6003300a47adcdd";  // ✅ Ahora se usa el Messaging Service

const client = twilio(ACCOUNT_SID, AUTH_TOKEN);

const sendWhatsAppMessage = async (to, variables) => {
    try {
        if (!MESSAGING_SERVICE_SID) {
            console.error("❌ ERROR: No se configuró el Messaging Service SID.");
            return;
        }

        const response = await client.messages.create({
            messagingServiceSid: MESSAGING_SERVICE_SID,  // 📌 Ahora Twilio selecciona el número correcto
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

module.exports = { sendWhatsAppMessage };
