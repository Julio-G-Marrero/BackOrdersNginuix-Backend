const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { protect } = require('../middleware/authMiddleware');

router.get('/users/pending', protect, adminController.getPendingUsers);
router.post('/users/approve/:id', protect, adminController.approveUser);
router.post('/users/reject/:id', protect, adminController.rejectUser);
router.patch('/users/:id/role', protect, adminController.updateUserRole);
router.get('/users', protect, adminController.getUsers);
router.put('/users/:id', protect, adminController.updateUser);
router.delete('/users/:id', protect, adminController.deleteUser);
router.patch("/users/:id/restrict", protect, adminController.restrictUserAccess);
router.patch('/users/:id/restore', protect, adminController.restoreUserAccess);

module.exports = router;
