require('dotenv').config(); // Cargar variables de entorno desde .env
const twilio = require('twilio');

// ✅ Credenciales Twilio desde variables de entorno
const ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const WHATSAPP_TEMPLATE_SID = process.env.TWILIO_WHATSAPP_TEMPLATE_SID;  // ✅ Plantilla aprobada
const MESSAGING_SERVICE_SID = process.env.TWILIO_MESSAGING_SERVICE_SID;  // ✅ Servicio de mensajería Twilio

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
