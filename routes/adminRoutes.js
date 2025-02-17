const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { protect } = require('../middleware/authMiddleware');
const User = require("../models/User"); // Importar con require

router.get('/users/pending', protect, adminController.getPendingUsers);
router.post('/users/approve/:id', protect, adminController.approveUser);
router.post('/users/reject/:id', protect, adminController.rejectUser);
router.patch('/users/:id/role', protect, adminController.updateUserRole);
router.get('/users', protect, adminController.getUsers);
router.put('/users/:id', protect, adminController.updateUser);
router.delete('/users/:id', protect, adminController.deleteUser);
router.patch("/users/:id/restrict", protect, adminController.restrictUserAccess);
router.patch('/users/:id/restore', protect, adminController.restoreUserAccess);
router.post("/create-admin", async (req, res) => {
    try {
        // Verifica si ya existe un admin
        const adminExists = await User.findOne({ role: "admin" });
        if (adminExists) {
            return res.status(400).json({ message: "El usuario admin ya existe." });
        }

        // Crear usuario admin
        const hashedPassword = await bcrypt.hash("globalingco1234", 10);
        const admin = new User({
            name: "Admin",
            email: "admin@email.com",
            password: hashedPassword,
            role: "admin",
            status: "active"
        });

        await admin.save();
        res.status(201).json({ message: "Usuario admin creado con éxito." });
    } catch (error) {
        console.error("Error creando admin:", error);
        res.status(500).json({ message: "Error en el servidor." });
    }
});
module.exports = router;
