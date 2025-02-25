const twilio = require('twilio');

// ✅ Credenciales correctas
const ACCOUNT_SID = "ACa5af537e7de8d375fc557c8417d8fb4a";  
const AUTH_TOKEN = "0d25ff1303c76835e7de148705ae6b0e";  
const MESSAGING_SERVICE_SID = "MG2cb5f038c8998278b6003300a47adcdd";  
const TEMPLATE_SID = "HX07fcf0689e950941c280d4fe221eb0bb";  // PLantilla whatsapp

const client = twilio(ACCOUNT_SID, AUTH_TOKEN);

const sendWhatsAppMessage = async (to, firstName, date, time) => {
    try {
        if (!MESSAGING_SERVICE_SID || !TEMPLATE_SID) {
            console.error("❌ ERROR: No se configuró el Messaging Service SID o el Template SID.");
            return;
        }

        // ✅ Asegura que las variables coincidan con la plantilla
        const formattedVariables = JSON.stringify({
            first_name: firstName,
            date: date,
            time: time
        });

        const response = await client.messages.create({
            messagingServiceSid: MESSAGING_SERVICE_SID,
            to: `whatsapp:${to}`,
            contentSid: TEMPLATE_SID,
            contentVariables: formattedVariables
        });

        console.log("📨 WhatsApp enviado con éxito:", response.sid);
        return response;
    } catch (error) {
        console.error("❌ Error enviando mensaje de WhatsApp:", error);
        throw error;
    }
};

module.exports = { sendWhatsAppMessage };
