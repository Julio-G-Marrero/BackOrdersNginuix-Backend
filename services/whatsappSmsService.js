const twilio = require('twilio');

// ✅ Credenciales Twilio
const ACCOUNT_SID = "ACa5af537e7de8d375fc557c8417d8fb4a";
const AUTH_TOKEN = "6286567a34bd77675277674b31e4e074";
const FROM_WHATSAPP_NUMBER = "whatsapp:+14155238886";  // Número de Twilio WhatsApp
const TEMPLATE_SID = "HXa05161e99077c171008f5b6da30b843b";  // Plantilla aprobada

const client = twilio(ACCOUNT_SID, AUTH_TOKEN);

// 🔹 **Función para enviar mensaje por WhatsApp con la plantilla aprobada**
const sendWhatsAppMessage = async (to, variables) => {
    try {
        console.log("🚀 Enviando notificación por WhatsApp...");

        const response = await client.messages.create({
            from: FROM_WHATSAPP_NUMBER,
            to: `whatsapp:${to}`,
            contentSid: TEMPLATE_SID,  // Usar la plantilla aprobada
            contentVariables: JSON.stringify({
                recipient_name: variables.recipient_name,
                event_type: variables.event_type,
                product_name: variables.product_name,
                order_id: variables.order_id,
                client_name: variables.client_name,
                event_date: variables.event_date,
                order_status: variables.order_status,
                comments: variables.comments || "Sin comentarios.",
                platform_url: variables.platform_url
            })
        });

        console.log("📨 WhatsApp enviado con éxito:", response.sid);
        return response;
    } catch (error) {
        console.error("❌ Error enviando mensaje de WhatsApp:", error);
        throw error;
    }
};

// 🔹 **Función para enviar notificación (solo WhatsApp)**
const sendNotification = async (to, variables) => {
    try {
        await sendWhatsAppMessage(to, variables);
        console.log("✅ Notificación enviada exitosamente por WhatsApp.");
    } catch (error) {
        console.error("❌ Error en el envío de notificación:", error);
    }
};

module.exports = { sendNotification };
