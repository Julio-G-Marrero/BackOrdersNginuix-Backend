const Provider = require("../models/Provider");
const csv = require("csv-parser");
const fs = require("fs");

// 📌 Crear un nuevo proveedor
exports.createProvider = async (req, res) => {
  try {
    const { name, contactInfo } = req.body;

    // Validar que el proveedor no exista
    const existingProvider = await Provider.findOne({ name });
    if (existingProvider) {
      return res.status(400).json({ message: "El proveedor ya existe" });
    }

    const provider = new Provider({ name, contactInfo });
    await provider.save();
    res.status(201).json(provider);
  } catch (error) {
    console.error("Error al crear proveedor:", error);
    res.status(500).json({ message: "Error al crear proveedor" });
  }
};

// 📌 Obtener todos los proveedores
exports.getProviders = async (req, res) => {
  try {
    const { search, limit = 10, page = 1 } = req.query;

    // Filtro de búsqueda
    const filter = search
      ? {
          $or: [
            { name: { $regex: search, $options: "i" } },
            { "contactInfo.contact": { $regex: search, $options: "i" } },
            { "contactInfo.phone": { $regex: search, $options: "i" } },
            { "contactInfo.email": { $regex: search, $options: "i" } },
          ],
        }
      : {};

    // Si hay búsqueda, traer todos los resultados sin paginación
    let providers;
    let totalProviders;

    if (search) {
      providers = await Provider.find(filter);
      totalProviders = providers.length;
    } else {
      // Si NO hay búsqueda, aplicar paginación normal
      const skip = (page - 1) * Number(limit);
      totalProviders = await Provider.countDocuments(filter);
      providers = await Provider.find(filter).skip(skip).limit(Number(limit));
    }

    res.status(200).json({
      providers,
      totalProviders,
      totalPages: Math.ceil(totalProviders / limit),
      currentPage: Number(page),
    });
  } catch (error) {
    console.error("Error al obtener proveedores:", error);
    res.status(500).json({ message: "Error al obtener proveedores" });
  }
};

// 📌 Actualizar un proveedor
exports.updateProvider = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, contactInfo } = req.body;

    const updatedProvider = await Provider.findByIdAndUpdate(
      id,
      { name, contactInfo },
      { new: true }
    );

    if (!updatedProvider) {
      return res.status(404).json({ message: "Proveedor no encontrado" });
    }

    res.status(200).json(updatedProvider);
  } catch (error) {
    console.error("Error al actualizar proveedor:", error);
    res.status(500).json({ message: "Error al actualizar proveedor" });
  }
};

// 📌 Eliminar un proveedor
exports.deleteProvider = async (req, res) => {
  try {
    const { id } = req.params;

    const deletedProvider = await Provider.findByIdAndDelete(id);

    if (!deletedProvider) {
      return res.status(404).json({ message: "Proveedor no encontrado" });
    }

    res.status(200).json({ message: "Proveedor eliminado con éxito" });
  } catch (error) {
    console.error("Error al eliminar proveedor:", error);
    res.status(500).json({ message: "Error al eliminar proveedor" });
  }
};

// Importar proveedores desde un archivo CSV
exports.importProviders = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: "No se ha subido ningún archivo" });
  }

  const providers = [];

  fs.createReadStream(req.file.path)
    .pipe(csv())
    .on("data", (row) => {
      if (row.name && row.name.trim() !== "") {
        let contactInfo = {
          contact: row.contact ? row.contact.trim() : "",
          phone: row.phone ? row.phone.trim() : "",
        };

        if (row.email && row.email.trim() !== "") {
          contactInfo.email = row.email.trim();
        }

        providers.push({
          name: row.name.trim(),
          contactInfo,
        });
      }
    })
    .on("end", async () => {
      try {
        fs.unlinkSync(req.file.path); // Eliminar el archivo después de procesarlo

        if (providers.length === 0) {
          return res.status(400).json({ success: false, message: "El archivo CSV no contiene proveedores válidos." });
        }

        // Intentar insertar los proveedores ignorando duplicados
        const result = await Provider.insertMany(providers, { ordered: false });

        res.status(200).json({
          success: true,
          message: `Importación completada: ${result.length} nuevos proveedores agregados.`,
          duplicatesIgnored: providers.length - result.length,
        });
      } catch (error) {
        if (error.code === 11000 || error.name === "MongoBulkWriteError") {
          // Verificamos si writeErrors existe y es un array antes de intentar mapear
          const duplicatedProviders = (error.writeErrors || []).map((err) => {
            if (err.errmsg && typeof err.errmsg === "string") {
              const match = err.errmsg.match(/dup key: { name: "([^"]+)" }/);
              return match ? match[1] : "Proveedor desconocido";
            }
            return "Proveedor desconocido";
          });

          console.log("🚨 Proveedores duplicados ignorados:", duplicatedProviders);

          return res.status(200).json({
            success: true,
            message: `Importación parcial: Se agregaron algunos proveedores, pero ${duplicatedProviders.length} ya existían y fueron ignorados.`,
            duplicatesIgnored: duplicatedProviders.length,
            duplicatedProviders,
          });
        }

        console.error("❌ Error al importar proveedores:", error);
        res.status(500).json({ success: false, message: "Error al importar proveedores", error: error.message });
      }
    });
};
