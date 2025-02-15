const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema({
    barcode: { type: String, required: true, unique: true }, // Código de Barras
    internalCode: { type: String, required: true }, // Código Interno
    description: { type: String, required: true }, // Descripción
    price: { type: Number, required: true }, // Precio Venta
    family: { type: String }, // Familia
    subFamily: { type: String }, // Sub-Familia
    createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Product', ProductSchema);
