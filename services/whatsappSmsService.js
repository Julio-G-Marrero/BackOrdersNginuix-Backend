const twilio = require('twilio');

// ✅ Credenciales Twilio
const ACCOUNT_SID = "ACa5af537e7de8d375fc557c8417d8fb4a";
const AUTH_TOKEN = "6286567a34bd77675277674b31e4e074";
const MESSAGING_SERVICE_SID = "MG2cb5f038c8998278b6003300a47adcdd";  // Mensajería para WhatsApp

const client = twilio(ACCOUNT_SID, AUTH_TOKEN);

// 🔹 **Función para enviar mensaje por WhatsApp**
const sendWhatsAppMessage = async (to, variables) => {
    console.log('Intento de envio whats')
    // try {
    //     const response = await client.messages.create({
    //         messagingServiceSid: MESSAGING_SERVICE_SID,  
    //         to: `whatsapp:${to}`,
    //         body: `📢 Notificación de Backorders: ${variables.message}`
    //     });

    //     console.log("📨 WhatsApp enviado con éxito:", response.sid);
    //     return response;
    // } catch (error) {
    //     console.error("❌ Error enviando mensaje de WhatsApp:", error);
    //     throw error;
    // }
};

// 🔹 **Función para enviar notificación (solo WhatsApp)**
const sendNotification = async (to, message) => {
    console.log('Intento de envio sms')
    // try {
    //     console.log("🚀 Enviando notificación por WhatsApp...");
    //     await sendWhatsAppMessage(to, { message });
    //     console.log("✅ Notificación enviada exitosamente por WhatsApp.");
    // } catch (error) {
    //     console.error("❌ Error en el envío de notificación:", error);
    // }
};

module.exports = { sendNotification };
