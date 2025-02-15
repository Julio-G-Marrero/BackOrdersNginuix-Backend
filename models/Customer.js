const mongoose = require('mongoose');

const CustomerSchema = new mongoose.Schema({
    customerNumber: { type: String, required: true, unique: true }, // Número de Cliente
    name: { type: String, required: true }, // Nombre
    address: { type: String, required: true }, // Dirección
    phone: { type: String }, // Teléfono
    createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Customer', CustomerSchema);
