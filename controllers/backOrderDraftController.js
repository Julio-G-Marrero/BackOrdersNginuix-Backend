const BackOrderDraft = require("../models/BackOrderDraft");

// Obtener borrador de un usuario
exports.getDraft = async (req, res) => {
  try {
    const draft = await BackOrderDraft.findOne({ userId: req.params.userId });
    if (!draft) return res.status(404).json({ message: "No hay borrador guardado" });
    res.json(draft);
  } catch (error) {
    res.status(500).json({ error: "Error al obtener el borrador" });
  }
};

// Guardar o actualizar borrador
exports.saveDraft = async (req, res) => {
    try {
      const { userId, client, products } = req.body;
  
      console.log("📩 Recibiendo solicitud para actualizar borrador:", { userId, client, products });
  
      await BackOrderDraft.findOneAndUpdate(
        { userId },
        { client: client || null, products }, // ✅ Permite `null` en `client`
        { upsert: true, new: true }
      );
  
      res.json({ message: "Borrador actualizado correctamente" });
    } catch (error) {
      console.error("❌ Error al actualizar el borrador:", error);
      res.status(500).json({ error: "Error al actualizar el borrador" });
    }
};    

// Eliminar borrador después de crear Back Order
exports.deleteDraft = async (req, res) => {
  try {
    await BackOrderDraft.deleteOne({ userId: req.params.userId });
    res.json({ message: "Borrador eliminado" });
  } catch (error) {
    res.status(500).json({ error: "Error al eliminar el borrador" });
  }
};
