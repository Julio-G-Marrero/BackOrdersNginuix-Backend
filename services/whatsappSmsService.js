require('dotenv').config(); // Cargar variables de entorno desde .env
const twilio = require('twilio');

// ✅ Credenciales Twilio desde variables de entorno
const ACCOUNT_SID = 'ACa5af537e7de8d375fc557c8417d8fb4a';
const AUTH_TOKEN = '0d25ff1303c76835e7de148705ae6b0e';
const WHATSAPP_TEMPLATE_SID = 'HXa05161e99077c171008f5b6da30b843b';  // ✅ Plantilla aprobada
const MESSAGING_SERVICE_SID = 'MG2cb5f038c8998278b6003300a47adcdd';  // ✅ Servicio de mensajería Twilio

const client = twilio(ACCOUNT_SID, AUTH_TOKEN);

// 🔹 **Función para enviar mensaje por WhatsApp con la plantilla aprobada**
const sendWhatsAppMessage = async (to, variables) => {
    try {
        const response = await client.messages.create({
            to: `whatsapp:${to}`,
            messagingServiceSid:MESSAGING_SERVICE_SID,
            contentSid: WHATSAPP_TEMPLATE_SID,
            contentVariables: JSON.stringify({
                recipient_name: variables.recipient_name || "Usuario",
                event_type: variables.event_type || "Actualización",
                product_name: variables.product_name || "Producto desconocido",
                order_id: variables.order_id || "N/A",
                client_name: variables.client_name || "Cliente desconocido",
                event_date: variables.event_date || new Date().toISOString().split('T')[0],
                order_status: variables.order_status || "Pendiente",
                comments: variables.comments || "Sin comentarios",
                platform_url: variables.platform_url || "https://backordersnginuix-frontend-production.up.railway.app"
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
