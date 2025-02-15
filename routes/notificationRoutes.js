const express = require("express");
const router = express.Router();
const {
  sendNotification,
  getNotifications,
  markAsRead,
  markAllAsRead,
} = require("../controllers/notificationController");

// ✅ Obtener todas las notificaciones de un usuario
router.get("/:userId", getNotifications);

// ✅ Enviar una notificación a un usuario
router.post("/send", sendNotification);

// ✅ Marcar una notificación específica como leída
router.put("/read/:notificationId", markAsRead);

// ✅ Marcar todas las notificaciones de un usuario como leídas
router.put("/mark-all-read/:userId", markAllAsRead);

module.exports = router;
