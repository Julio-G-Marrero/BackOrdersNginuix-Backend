const express = require("express");
const { getBackOrderStats, getBackOrderStatsByDate } = require("../controllers/statsController");

const router = express.Router();

// 📊 Obtener estadísticas generales de los Back Orders
router.get("/", getBackOrderStats);

// 📅 Obtener estadísticas filtradas por fecha
router.get("/by-date", getBackOrderStatsByDate);

module.exports = router;
