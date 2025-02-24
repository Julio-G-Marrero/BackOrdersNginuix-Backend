const twilio = require('twilio');

// ✅ Credenciales Twilio
const ACCOUNT_SID = "ACa5af537e7de8d375fc557c8417d8fb4a";
const AUTH_TOKEN = "6286567a34bd77675277674b31e4e074";
const WHATSAPP_TEMPLATE_SID = "HXa05161e99077c171008f5b6da30b843b";  // ✅ Plantilla aprobada
const MESSAGING_SERVICE_SID = "MG2cb5f038c8998278b6003300a47adcdd";  // ✅ Servicio de mensajería Twilio

const client = twilio(ACCOUNT_SID, AUTH_TOKEN);

// 🔹 **Función para enviar mensaje por WhatsApp con la plantilla aprobada**
const sendWhatsAppMessage = async (to, variables) => {
    try {
        // ✅ Formatear fecha correctamente
        const formattedDate = new Date(variables.event_date).toISOString().split('T')[0];

        // ✅ Validar URL de la plataforma
        const validPlatformURL = variables.platform_url.startsWith("http")
            ? variables.platform_url
            : `https://${variables.platform_url}`;

        // ✅ Enviar mensaje usando el servicio de mensajería
        const response = await client.messages.create({
            to: `whatsapp:${to}`,
            messagingServiceSid: MESSAGING_SERVICE_SID,  // ✅ Usa el servicio de mensajería de Twilio
            contentSid: WHATSAPP_TEMPLATE_SID,  // ✅ Usa la plantilla aprobada
            contentVariables: JSON.stringify({
                recipient_name: variables.recipient_name || "Usuario",
                event_type: variables.event_type || "Actualización",
                product_name: variables.product_name || "Varios productos",
                order_id: variables.order_id || "N/A",
                client_name: variables.client_name || "Cliente desconocido",
                event_date: formattedDate,
                order_status: variables.order_status || "Pendiente",
                comments: variables.comments || "Sin comentarios",
                platform_url: validPlatformURL
            })
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
