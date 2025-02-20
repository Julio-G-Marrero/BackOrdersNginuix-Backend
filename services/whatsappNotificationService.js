const { sendWhatsAppMessage } = require('./whatsappService');
const User = require('../models/User');

const notifySellerOnBackOrderCreation = async (sellerId, orderId) => {
    try {
        const seller = await User.findById(sellerId);
        if (!seller || !seller.phone) {
            console.error("❌ No se encontró al vendedor o su teléfono no está registrado.");
            return;
        }

        const message = `📦 Se ha creado un nuevo Back Order #${orderId}. 
        Por favor revisa y responde a la solicitud en la plataforma.`;

        await sendWhatsAppMessage(seller.phone, message);
    } catch (error) {
        console.error("❌ Error enviando notificación al vendedor sobre Back Order:", error);
    }
};

const notifyManagerOnBackOrderCreation = async (managerId, sellerName, orderId) => {
    try {
        const manager = await User.findById(managerId);
        if (!manager || !manager.phone) {
            console.error("❌ No se encontró al gerente o su teléfono no está registrado.");
            return;
        }

        const message = `📌 El vendedor ${sellerName} ha creado un Back Order #${orderId}. 
        Por favor revisa y aprueba o rechaza los productos.`;

        await sendWhatsAppMessage(manager.phone, message);
    } catch (error) {
        console.error("❌ Error enviando notificación al gerente sobre Back Order:", error);
    }
};

const notifySellerOnApproval = async (sellerId, orderId) => {
    try {
        const seller = await User.findById(sellerId);
        if (!seller || !seller.phone) {
            console.error("❌ No se encontró al vendedor o su teléfono no está registrado.");
            return;
        }

        const message = `✅ Tu Back Order #${orderId} ha sido aprobado por el gerente. 
        Revisa los detalles en la plataforma.`;

        await sendWhatsAppMessage(seller.phone, message);
    } catch (error) {
        console.error("❌ Error enviando notificación de aprobación al vendedor:", error);
    }
};

const notifySellerOnReminder = async (sellerId, orderId) => {
    try {
        const seller = await User.findById(sellerId);
        if (!seller || !seller.phone) {
            console.error("❌ No se encontró al vendedor o su teléfono no está registrado.");
            return;
        }

        const message = `🚨 Recordatorio: No has respondido a la solicitud de aprobación del Back Order #${orderId}. 
        Responde con 'APROBADO' o 'RECHAZADO'.`;

        await sendWhatsAppMessage(seller.phone, message);
    } catch (error) {
        console.error("❌ Error enviando recordatorio al vendedor:", error);
    }
};

const notifyManagerOnNoResponse = async (managerId, orderId) => {
    try {
        const manager = await User.findById(managerId);
        if (!manager || !manager.phone) {
            console.error("❌ No se encontró al gerente o su teléfono no está registrado.");
            return;
        }

        const message = `⚠️ Alerta: El vendedor no ha respondido al Back Order #${orderId} en 3 días. 
        Revisa el estado y toma acción.`;

        await sendWhatsAppMessage(manager.phone, message);
    } catch (error) {
        console.error("❌ Error enviando alerta al gerente:", error);
    }
};

const notifySellerOnRejection = async (sellerId, orderId, productName, reason) => {
    try {
        const seller = await User.findById(sellerId);
        if (!seller || !seller.phone) {
            console.error("❌ No se encontró al vendedor o su teléfono no está registrado.");
            return;
        }

        const message = `❌ Tu producto '${productName}' en Back Order #${orderId} ha sido denegado. 
        📝 Motivo: ${reason || "No especificado"}. 
        Consulta con el gerente si necesitas más información.`;

        await sendWhatsAppMessage(seller.phone, message);
    } catch (error) {
        console.error("❌ Error enviando notificación de rechazo al vendedor:", error);
    }
};

const notifyManagerOnProductRejection = async (managerId, orderId, productName, rejectedBy, reason) => {
    try {
        const manager = await User.findById(managerId);
        if (!manager || !manager.phone) {
            console.error("❌ No se encontró al gerente o su teléfono no está registrado.");
            return;
        }

        const message = `⚠️ El producto '${productName}' en Back Order #${orderId} ha sido denegado por ${rejectedBy}. 
        📝 Motivo: ${reason || "No especificado"}. Revisa el estado y decide los siguientes pasos.`;

        await sendWhatsAppMessage(manager.phone, message);
    } catch (error) {
        console.error("❌ Error enviando notificación de rechazo al gerente:", error);
    }
};

module.exports = {
    notifySellerOnBackOrderCreation,
    notifyManagerOnBackOrderCreation,
    notifySellerOnApproval,
    notifySellerOnRejection,
    notifySellerOnReminder,
    notifyManagerOnNoResponse,
    notifyManagerOnProductRejection
};
