const express = require('express');
const {
    createBackOrder,
    getMyBackOrders,
    getPendingBackOrders,
    getBackOrders,
    updateBackOrder,
    deleteBackOrder,
    exportBackOrders,
    updateProductStatus,
    getStatistics,
    confirmProvider,
    confirmSupplierResponse,
    vendorApproval,
    closeBackOrder,
    getBackOrderById,
    rejectProduct,
    getSellerBackOrders,
    approveOrRejectProduct,
    confirmShipment,
    fulfillProduct,
    receiveProduct,
    handlePartialDelivery,
    revertProductStatus
} = require('../controllers/backOrderController');
const { protect } = require('../middleware/authMiddleware');
const { validateBackOrder } = require('../middleware/validationMiddleware');

const router = express.Router();

// 🟢 **Primero rutas sin parámetros específicos**
router.get('/export', protect, exportBackOrders);
router.get('/statistics', protect, getStatistics);
router.get('/my', protect, getMyBackOrders);
router.get('/pending', protect, getPendingBackOrders);
router.get('/', protect, getBackOrders);

// 🟢 **Rutas que incluyen SOLO el ID del BackOrder**
router.get('/:id', protect, getBackOrderById);
router.put('/:id', protect, validateBackOrder, updateBackOrder);
router.delete('/:id', protect, deleteBackOrder);
router.put('/:id/close', protect, closeBackOrder);

// 🟢 **Rutas para productos dentro de un BackOrder**
router.put('/:id/products/:productId/status', protect, updateProductStatus);
router.put('/:id/products/:productId/vendor-approval', protect, vendorApproval);
router.put('/:id/products/:productId/reject', protect, rejectProduct);

// 🟢 **Rutas separadas para asignación y confirmación**
router.put('/:id/products/:productId/provider-confirmation', protect, confirmProvider); // 🔹 Corrige el nombre del controlador
router.put('/:id/products/:productId/supplier-confirmation', protect, confirmSupplierResponse); // 🔹 Nombre más claro

// 🟢 **Crear un nuevo BackOrder**
router.post('/', protect, validateBackOrder, createBackOrder);

// Obtener Back Orders del vendedor autenticado
router.get("/my", protect, getSellerBackOrders);

// ✅ Nuevo endpoint para confirmar el envío del proveedor
router.put("/:orderId/products/:productId/confirm-shipment", protect, confirmShipment);

// 🔹 Vendedor maneja la entrega parcial
router.put("/:orderId/products/:productId/partial-delivery", protect, handlePartialDelivery);


// Vendedor aprueba o rechaza un producto
router.put("/:orderId/products/:productId/approve", protect, approveOrRejectProduct);

router.put("/:orderId/products/:productId/fulfillment", protect, fulfillProduct);

router.put("/:orderId/products/:productId/receive", protect, receiveProduct);

// 🔄 Ruta para revertir estado de un producto en un Back Order
router.put("/:orderId/products/:productId/revert-status", protect, revertProductStatus);

module.exports = router;
