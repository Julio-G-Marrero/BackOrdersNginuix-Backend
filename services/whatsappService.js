require('dotenv').config();
const twilio = require('twilio');

// Configurar cliente de Twilio
const client = twilio("ACa5af537e7de8d375fc557c8417d8fb4a", "f8f7a2e9638c787f698e5dab72a4273f");

// Función para enviar mensajes de WhatsApp con una plantilla
const sendWhatsAppMessage = async (to, variables) => {
    try {
        const response = await client.messages.create({
            from: process.env.TWILIO_WHATSAPP_NUMBER,
            to: `whatsapp:${to}`,
            contentSid: process.env.TWILIO_TEMPLATE_SID,  // SID de la plantilla
            contentVariables: JSON.stringify(variables)  // Variables dinámicas del mensaje
        });

        console.log('Mensaje enviado:', response.sid);
        return response;
    } catch (error) {
        console.error('Error enviando mensaje:', error);
        throw error;
    }
};

module.exports = { sendWhatsAppMessage };
