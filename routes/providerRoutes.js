const express = require("express");
const multer = require("multer");
const upload = multer({ dest: "uploads/" }); // Directorio temporal para los archivos subidos
const {
  createProvider,
  getProviders,
  updateProvider,
  deleteProvider,
  importProviders
} = require("../controllers/providerController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

// 📌 Definir rutas de proveedores
router.route("/")
  .post(protect, createProvider)   // Crear proveedor
  .get(protect, getProviders);      // Obtener proveedores

router.route("/:id")
  .put(protect, updateProvider)     // Actualizar proveedor
  .delete(protect, deleteProvider); // Eliminar proveedor

router.post("/import", upload.single("file"), importProviders);

module.exports = router;
