const mongoose = require("mongoose");

const backOrderSchema = new mongoose.Schema({
  client: { type: mongoose.Schema.Types.ObjectId, ref: "Customer", required: true },
  products: [
    {
      product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
      description: { type: String, required: true },
      quantity: { type: Number, required: true },
      comments: { type: String, default: "" },
      price: { type: Number, required: true },
      family: { type: String, default: "No especificado" },
      subFamily: { type: String, default: "No especificado" },
      barcode: { type: String, default: "No disponible" },
      internalCode: { type: String, default: "No disponible" },
      provider: { type: String, default: "Diverso" },
      promiseDate: { type: Date },
      status: {
        type: String,
        enum: [
          "pending",             // Pendiente (Vendedor crea el Back Order)
          "denied",              // Denegado (Gerente de Compras o Vendedor rechaza)
          "in_process",          // En proceso (Gerente envía a proveedor)
          "pending_approval",    // Pendiente de Aprobación (Esperando aprobación del Vendedor)
          "shipped",             // ✅ Esperando Confirmación de Envío del Proveedor
          "in_delivery_process", // En Proceso de Surtimiento (Confirmado por el gerente)
          "partial",             // Surtido Parcial
          "fulfilled",           // Surtido Completo
          "delayed"              // Retrasado
        ],
        default: "pending",
      },
      fulfilledQuantity: { type: Number, default: 0 },
      deniedQuantity: { type: Number, default: 0 },
      delayedReason: { type: String, default: "" }, // 🔹 Nueva razón del retraso
      updatedAt: { type: Date, default: Date.now }, // 🔹 Para que el cron job pueda verificar actualizaciones recientes
      history: [
        {
          action: String,
          previousStatus: String,
          newStatus: String,
          updatedBy: { type: String },
          updatedAt: { type: Date, default: Date.now },
          fulfilledQuantity: Number,
          deniedQuantity: Number,
          comments: String,
          reason: { type: String, default: "" } // 🔹 Agregado motivo del cambio de estado
        },
      ],
    },
  ],
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  statusGeneral: {
    type: String,
    enum: [
      "pending",              // Pendiente (Esperando revisión del Gerente de Compras)
      "in_process",           // En Proceso (Al menos un producto enviado a proveedor)
      "pending_approval",     // Pendiente de Aprobación (Esperando respuesta del Vendedor)
      "shipped",              // ✅ Esperando Confirmación de Envío del Proveedor
      "in_delivery_process",  // En Proceso de Surtimiento (Confirmado por el gerente)
      "fulfilled",            // Surtido Completo
      "partial",              // Surtido Parcial
      "denied",               // Denegado
      "delayed"               // Retrasado
    ],
    default: "pending",
  },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("BackOrder", backOrderSchema);
