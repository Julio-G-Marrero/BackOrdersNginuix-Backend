const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    phone: { type: String, required: true, unique: true }, // 📌 Teléfono obligatorio y único
    password: { type: String, required: true },
    role: { type: String, enum: ['admin', 'gerente', 'vendedor'], default: 'vendedor' },
    status: { type: String, enum: ['pending_approval', 'approved', 'rejected', 'restricted'], default: 'pending_approval' },
    resetToken: { type: String, default: null },
    resetTokenExpires: { type: Date, default: null }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
