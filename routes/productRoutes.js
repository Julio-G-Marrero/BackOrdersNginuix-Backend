const express = require('express');
const multer = require('multer');
const router = express.Router();
const { getProducts, createProduct, updateProduct, deleteProduct, importProducts } = require('../controllers/productController');
const { protect } = require('../middleware/authMiddleware');

// Configuración de Multer para manejar la carga de archivos
const upload = multer({ dest: 'uploads/' }); // Archivos se almacenan temporalmente en la carpeta 'uploads/'

// Rutas de productos
router.route('/')
    .get(protect, getProducts) // Obtener lista de productos
    .post(protect, createProduct); // Crear un producto

router.route('/:id')
    .put(protect, updateProduct) // Actualizar un producto por ID
    .delete(protect, deleteProduct); // Eliminar un producto por ID

// Ruta para importar productos desde un archivo CSV
router.post('/import', protect, upload.single('file'), importProducts);

module.exports = router;
