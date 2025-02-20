const { sendWhatsAppMessage } = require('./whatsappService');
const User = require('../models/User');

const notifySellerOnBackOrderCreation = async (sellerId, orderId) => {
    const seller = await User.findById(sellerId);
    if (!seller || !seller.phone) return;

    const message = `📦 Se ha creado un nuevo Back Order #${orderId}. 
    Por favor revisa y responde a la solicitud en la plataforma.`;

    await sendWhatsAppMessage(seller.phone, message);
};

const notifyManagerOnBackOrderCreation = async (managerId, sellerName, orderId) => {
    const manager = await User.findById(managerId);
    if (!manager || !manager.phone) return;

    const message = `📌 El vendedor ${sellerName} ha creado un Back Order #${orderId}. 
    Por favor revisa y aprueba o rechaza los productos.`;

    await sendWhatsAppMessage(manager.phone, message);
};

const notifySellerOnApproval = async (sellerId, orderId) => {
    const seller = await User.findById(sellerId);
    if (!seller || !seller.phone) return;

    const message = `✅ Tu Back Order #${orderId} ha sido aprobado por el gerente. 
    Revisa los detalles en la plataforma.`;

    await sendWhatsAppMessage(seller.phone, message);
};


const notifySellerOnReminder = async (sellerId, orderId) => {
    const seller = await User.findById(sellerId);
    if (!seller || !seller.phone) return;

    const message = `🚨 Recordatorio: No has respondido a la solicitud de aprobación del Back Order #${orderId}. 
    Responde con 'APROBADO' o 'RECHAZADO'.`;

    await sendWhatsAppMessage(seller.phone, message);
};

const notifyManagerOnNoResponse = async (managerId, orderId) => {
    const manager = await User.findById(managerId);
    if (!manager || !manager.phone) return;

    const message = `⚠️ Alerta: El vendedor no ha respondido al Back Order #${orderId} en 3 días. 
    Revisa el estado y toma acción.`;

    await sendWhatsAppMessage(manager.phone, message);
};

const notifySellerOnRejection = async (phone, orderId, productName, reason) => {
    const message = `❌ Tu producto '${productName}' en Back Order #${orderId} ha sido denegado. 
    📝 Motivo: ${reason || "No especificado"}. 
    Consulta con el gerente si necesitas más información.`;

    await sendWhatsAppMessage(phone, message);
};

const notifyManagerOnProductRejection = async (phone, orderId, productName, rejectedBy, reason) => {
    const message = `⚠️ El producto '${productName}' en Back Order #${orderId} ha sido denegado por ${rejectedBy}. 
    📝 Motivo: ${reason || "No especificado"}. Revisa el estado y decide los siguientes pasos.`;

    await sendWhatsAppMessage(phone, message);
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
