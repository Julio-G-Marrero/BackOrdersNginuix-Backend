const twilio = require('twilio');

// ✅ Credenciales Twilio
const ACCOUNT_SID = "ACa5af537e7de8d375fc557c8417d8fb4a";
const AUTH_TOKEN = "6286567a34bd77675277674b31e4e074";
const WHATSAPP_TEMPLATE_SID = "HXa05161e99077c171008f5b6da30b843b";  // ✅ Plantilla aprobada

const client = twilio(ACCOUNT_SID, AUTH_TOKEN);

// 🔹 **Función para enviar mensaje por WhatsApp con la plantilla aprobada**
const sendWhatsAppMessage = async (to, variables) => {
    try {
        const response = await client.messages.create({
            to: `whatsapp:${to}`,
            from: "whatsapp:+14155238886",  // ✅ Asegúrate de usar tu número de Twilio aprobado
            contentSid: WHATSAPP_TEMPLATE_SID,  // ✅ Usar la plantilla de Twilio
            contentVariables: JSON.stringify(variables)  // ✅ Enviar variables correctamente
        });

        console.log("📨 WhatsApp enviado con éxito:", response.sid);
        return response;
    } catch (error) {
        console.error("❌ Error enviando mensaje de WhatsApp:", error);
        throw error;
    }
};

// 🔹 **Función para enviar notificación usando la plantilla**
const sendNotification = async (to, eventDetails) => {
    try {
        console.log("🚀 Enviando notificación por WhatsApp...");
        await sendWhatsAppMessage(to, eventDetails);
        console.log("✅ Notificación enviada exitosamente.");
    } catch (error) {
        console.error("❌ Error en el envío de notificación:", error);
    }
};

module.exports = { sendNotification };
