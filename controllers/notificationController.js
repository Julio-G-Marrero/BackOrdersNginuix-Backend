const Notification = require("../models/Notification");

// ✅ Obtener notificaciones de un usuario
const getNotifications = async (req, res) => {
  try {
    const { userId } = req.params;
    const notifications = await Notification.find({ userId }).sort({ createdAt: -1 });
    res.status(200).json(notifications);
  } catch (error) {
    console.error("Error al obtener notificaciones:", error);
    res.status(500).json({ message: "Error al obtener notificaciones" });
  }
};

// ✅ Enviar una notificación a un usuario
const sendNotification = async (req, res) => {
  try {
    const { userId, message, link } = req.body;

    if (!userId || !message) {
      return res.status(400).json({ message: "Faltan datos requeridos (userId, message)" });
    }

    const newNotification = new Notification({
      userId,
      message,
      link: link || "#", // Enlace opcional
      read: false,
    });

    await newNotification.save();

    res.status(201).json({ message: "Notificación enviada correctamente" });
  } catch (error) {
    console.error("Error al enviar notificación:", error);
    res.status(500).json({ message: "Error al enviar notificación" });
  }
};

// ✅ Marcar una notificación como leída
const markAsRead = async (req, res) => {
  try {
    const { notificationId } = req.params;

    const notification = await Notification.findByIdAndUpdate(
      notificationId,
      { read: true },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ message: "Notificación no encontrada" });
    }

    res.status(200).json({ message: "Notificación marcada como leída", notification });
  } catch (error) {
    console.error("Error al marcar notificación como leída:", error);
    res.status(500).json({ message: "Error al actualizar notificación" });
  }
};

// ✅ Marcar todas las notificaciones de un usuario como leídas
const markAllAsRead = async (req, res) => {
  try {
    const { userId } = req.params;

    await Notification.updateMany({ userId, read: false }, { read: true });

    res.status(200).json({ message: "Todas las notificaciones marcadas como leídas" });
  } catch (error) {
    console.error("Error al marcar todas como leídas:", error);
    res.status(500).json({ message: "Error al actualizar notificaciones" });
  }
};

module.exports = {
  getNotifications,
  sendNotification,
  markAsRead,
  markAllAsRead,
};
