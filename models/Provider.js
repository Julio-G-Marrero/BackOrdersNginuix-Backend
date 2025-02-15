const mongoose = require("mongoose");

const providerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  contactInfo: {
    contact: { type: String },
    phone: { type: String },
    email: { type: String },
  },
});

module.exports = mongoose.model("Provider", providerSchema);
