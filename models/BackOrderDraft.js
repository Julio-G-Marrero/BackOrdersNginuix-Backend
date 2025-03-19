const mongoose = require("mongoose");

const BackOrderDraftSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, required: true, unique: true },
  client: { type: mongoose.Schema.Types.Mixed, default: null },
  products: { type: Array, default: [] },
  createdAt: { type: Date, default: Date.now },
});

const BackOrderDraft = mongoose.model("BackOrderDraft", BackOrderDraftSchema);
module.exports = BackOrderDraft;
