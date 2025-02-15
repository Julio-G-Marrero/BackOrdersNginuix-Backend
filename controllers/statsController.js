const BackOrder = require("../models/BackOrder");

// 📊 Obtener estadísticas generales de los Back Orders
exports.getBackOrderStats = async (req, res) => {
  try {
    // 1️⃣ Cantidad de Back Orders por estado
    const statusCounts = await BackOrder.aggregate([
      { $group: { _id: "$statusGeneral", count: { $sum: 1 } } }
    ]);

    // 2️⃣ Tiempo Promedio de Procesamiento (para Back Orders completados)
    const avgProcessingTime = await BackOrder.aggregate([
      { $match: { statusGeneral: "fulfilled" } },
      {
        $project: {
          processingTime: { $subtract: ["$updatedAt", "$createdAt"] }
        }
      },
      { $group: { _id: null, avgTime: { $avg: "$processingTime" } } }
    ]);

    // 3️⃣ Productos más rechazados
    const mostDeniedProducts = await BackOrder.aggregate([
      { $unwind: "$products" },
      { $match: { "products.status": "denied" } },
      {
        $group: {
          _id: "$products.product",
          totalDenied: { $sum: 1 }
        }
      },
      { $sort: { totalDenied: -1 } },
      { $limit: 5 }
    ]);

    // 4️⃣ Proveedores con mejor cumplimiento
    const supplierPerformance = await BackOrder.aggregate([
      { $unwind: "$products" },
      {
        $group: {
          _id: "$products.provider",
          totalShipped: { $sum: { $cond: [{ $eq: ["$products.status", "shipped"] }, 1, 0] } },
          totalDenied: { $sum: { $cond: [{ $eq: ["$products.status", "denied"] }, 1, 0] } }
        }
      },
      { $sort: { totalShipped: -1 } }
    ]);

    // 5️⃣ Tasa de Aprobación vs. Rechazo
    const approvalRate = await BackOrder.aggregate([
      { $unwind: "$products" },
      {
        $group: {
          _id: "$products.status",
          count: { $sum: 1 }
        }
      }
    ]);

    res.json({
      statusCounts,
      avgProcessingTime: avgProcessingTime.length ? avgProcessingTime[0].avgTime / (1000 * 60 * 60 * 24) : 0, // Convertir a días
      mostDeniedProducts,
      supplierPerformance,
      approvalRate
    });
  } catch (error) {
    console.error("❌ Error obteniendo estadísticas:", error);
    res.status(500).json({ message: "Error obteniendo estadísticas." });
  }
};

// 📅 Obtener estadísticas filtradas por fecha
exports.getBackOrderStatsByDate = async (req, res) => {
  try {
    const { start, end } = req.query;
    if (!start || !end) {
      return res.status(400).json({ message: "Se requieren las fechas de inicio y fin." });
    }

    const startDate = new Date(start);
    const endDate = new Date(end);

    // 1️⃣ Cantidad de Back Orders por estado en el rango de fechas
    const statusCounts = await BackOrder.aggregate([
      { $match: { createdAt: { $gte: startDate, $lte: endDate } } },
      { $group: { _id: "$statusGeneral", count: { $sum: 1 } } }
    ]);

    // 2️⃣ Tiempo Promedio de Procesamiento en el rango de fechas
    const avgProcessingTime = await BackOrder.aggregate([
      { $match: { statusGeneral: "fulfilled", createdAt: { $gte: startDate, $lte: endDate } } },
      {
        $project: {
          processingTime: { $subtract: ["$updatedAt", "$createdAt"] }
        }
      },
      { $group: { _id: null, avgTime: { $avg: "$processingTime" } } }
    ]);

    res.json({
      statusCounts,
      avgProcessingTime: avgProcessingTime.length ? avgProcessingTime[0].avgTime / (1000 * 60 * 60 * 24) : 0,
    });
  } catch (error) {
    console.error("❌ Error obteniendo estadísticas por fecha:", error);
    res.status(500).json({ message: "Error obteniendo estadísticas." });
  }
};
