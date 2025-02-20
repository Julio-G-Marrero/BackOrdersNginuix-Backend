const twilio = require('twilio');

// ✅ Credenciales correctas
const ACCOUNT_SID = "ACa5af537e7de8d375fc557c8417d8fb4a";  
const AUTH_TOKEN = "6286567a34bd77675277674b31e4e074";  
const MESSAGING_SERVICE_SID = "MG2cb5f038c8998278b6003300a47adcdd";  // ✅ Ahora se usa el Messaging Service
const TEMPLATE_SID = "HX26f96a8c9873ef6b54b7dbcdf7eb2a59";  // ✅ SID de la plantilla aprobada

// 🔹 Inicializar el cliente de Twilio
const client = twilio(ACCOUNT_SID, AUTH_TOKEN);

// 📌 Función para enviar un mensaje de WhatsApp con una plantilla
const sendWhatsAppMessage = async (to, variables) => {
    try {
        if (!MESSAGING_SERVICE_SID || !TEMPLATE_SID) {
            console.error("❌ ERROR: No se configuró el Messaging Service SID o el Template SID.");
            return;
        }

        const formattedVariables = JSON.stringify(variables);  // 📌 Formatear las variables para la plantilla

        const response = await client.messages.create({
            messagingServiceSid: MESSAGING_SERVICE_SID,  // 📌 Usa el servicio de mensajería configurado
            to: `whatsapp:${to}`,
            contentSid: TEMPLATE_SID,  // 📌 Usa la plantilla aprobada
            contentVariables: formattedVariables  // 📌 Pasa las variables necesarias para la plantilla
        });

        console.log("📨 WhatsApp enviado con éxito:", response.sid);
        return response;
    } catch (error) {
        console.error("❌ Error enviando mensaje de WhatsApp:", error);
        throw error;
    }
};

// 🔹 Exportar la función para su uso en otras partes del backend
module.exports = { sendWhatsAppMessage };
