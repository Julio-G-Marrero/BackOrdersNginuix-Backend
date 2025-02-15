const express = require('express');
const {
  createCustomer,
  getCustomers,
  updateCustomer,
  deleteCustomer,
  importCustomers,
} = require('../controllers/customerController');
const { protect, authorize } = require('../middleware/authMiddleware'); // Importar `authorize`
const multer = require('multer');

const router = express.Router();
const upload = multer({ dest: 'uploads/' });

router.route('/')
  .post(protect, authorize("gerente"), createCustomer) // Solo Gerente puede crear clientes
  .get(protect, getCustomers); // Todos los roles pueden ver clientes

router.route('/:id')
  .put(protect, authorize("gerente"), updateCustomer) // Solo Gerente puede editar clientes
  .delete(protect, authorize("gerente"), deleteCustomer); // Solo Gerente puede eliminar clientes

router.post('/import', protect, authorize("gerente"), upload.single('file'), importCustomers);

module.exports = router;
