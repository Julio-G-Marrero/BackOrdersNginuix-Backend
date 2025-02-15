const cron = require('node-cron');
const mongoose = require('mongoose');
const BackOrder = require('../models/BackOrder'); // Asegúrate de que el path sea correcto
require('dotenv').config();

// Conectar a la base de datos si no está conectada
if (mongoose.connection.readyState === 0) {
  mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  }).then(() => console.log("Conectado a MongoDB para tareas programadas"))
    .catch(err => console.error("Error conectando a MongoDB:", err));
}

// 🔹 Cron Job para revisar aprobaciones automáticas cada día a las 2 AM
cron.schedule('0 2 * * *', async () => {
  console.log("⏳ Ejecutando revisión de aprobaciones pendientes...");

  const threeDaysAgo = new Date();
  threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

  try {
    const backOrders = await BackOrder.find({
      "products.status": "pending_approval",
      "products.updatedAt": { $lte: threeDaysAgo }
    });

    if (backOrders.length > 0) {
      for (const backOrder of backOrders) {
        backOrder.products.forEach(product => {
          if (product.status === "pending_approval") {
            product.status = "denied";
            product.comments.push("⏳ Rechazado automáticamente por falta de respuesta.");
          }
        });
        await backOrder.save();
      }

      console.log(`✅ ${backOrders.length} back orders actualizados automáticamente.`);
    } else {
      console.log("🔍 No se encontraron aprobaciones pendientes para rechazar.");
    }
  } catch (error) {
    console.error("❌ Error en la ejecución del cron job:", error);
  }
});

// 🔹 Cron Job para detectar productos retrasados (Ejecuta todos los días a las 3 AM)
cron.schedule('0 3 * * *', async () => {
  console.log("⏳ Verificando productos retrasados...");

  const today = new Date();

  try {
    // Buscar productos que están en proceso de entrega pero cuya fecha promesa ya pasó
    const delayedOrders = await BackOrder.find({
      "products.status": "in_delivery_process",
      "products.promisedDate": { $lt: today } // PromisedDate es anterior a hoy
    });

    if (delayedOrders.length > 0) {
      for (const backOrder of delayedOrders) {
        backOrder.products.forEach(product => {
          if (product.status === "in_delivery_process" && product.promisedDate < today) {
            product.status = "delayed"; // Cambiar estado a retrasado
            product.comments.push("⏳ Producto marcado como retrasado por incumplimiento de entrega.");
          }
        });
        await backOrder.save();
      }

      console.log(`✅ ${delayedOrders.length} productos actualizados como retrasados.`);
    } else {
      console.log("🔍 No se encontraron productos retrasados.");
    }
  } catch (error) {
    console.error("❌ Error en la ejecución del cron job de retrasos:", error);
  }
});


console.log("✅ Cron Jobs inicializados correctamente.");

