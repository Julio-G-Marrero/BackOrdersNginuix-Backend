const express = require("express");
const User = require("../models/User");
const router = express.Router();

// ✅ Obtener un usuario por ID con información útil
router.get("/:id", async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("name email role"); // 🔹 Solo devuelve nombre, email y rol

    if (!user) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role, // ✅ Incluye el rol del usuario (ejemplo: vendedor, admin, etc.)
    });
  } catch (error) {
    console.error("❌ Error al obtener usuario:", error);
    res.status(500).json({ message: "Error en el servidor" });
  }
});

module.exports = router;
