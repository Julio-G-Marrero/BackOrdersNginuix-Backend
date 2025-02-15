const fs = require('fs');
const csv = require('csv-parser');
const Product = require('../models/Product');

// Crear producto
exports.createProduct = async (req, res) => {
    try {
        const product = await Product.create(req.body);
        res.status(201).json(product);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

// Obtener todos los productos
exports.getProducts = async (req, res) => {
  try {
    const { search, limit = 50, page = 1 } = req.query;

    // Filtro de búsqueda
    const filter = search
      ? {
          $or: [
            { description: { $regex: search, $options: "i" } },
            { internalCode: { $regex: search, $options: "i" } },
            { barcode: { $regex: search, $options: "i" } },
          ],
        }
      : {};

    let products;
    let totalProducts;

    if (search) {
      // 🔹 Si hay búsqueda, traer TODOS los productos sin paginar
      products = await Product.find(filter);
      totalProducts = products.length;
    } else {
      // 🔹 Si NO hay búsqueda, aplicar paginación normal
      const skip = (page - 1) * Number(limit);
      totalProducts = await Product.countDocuments(filter);
      products = await Product.find(filter).skip(skip).limit(Number(limit));
    }

    res.status(200).json({
      products,
      totalProducts,
      totalPages: Math.ceil(totalProducts / limit),
      currentPage: Number(page),
    });
  } catch (error) {
    console.error("Error al obtener productos:", error);
    res.status(500).json({ message: "Error al obtener productos" });
  }
};


// Actualizar producto
exports.updateProduct = async (req, res) => {
    try {
        const product = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.status(200).json(product);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

// Eliminar producto
exports.deleteProduct = async (req, res) => {
    try {
        await Product.findByIdAndDelete(req.params.id);
        res.status(200).json({ message: 'Producto eliminado' });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

// Importar productos desde CSV
exports.importProducts = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No se proporcionó ningún archivo' });
    }

    const products = [];
    const duplicateBarcodes = new Set(); // Almacenar códigos duplicados detectados
    const filePath = req.file.path;

    // Leer y procesar el archivo CSV
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (row) => {
        try {
          // Validar y transformar los datos
          const price = parseFloat(row.price);

          if (
            !row.barcode || // Código de barras obligatorio
            !row.internalCode || // Código interno obligatorio
            !row.description || // Descripción obligatoria
            isNaN(price) || // El precio debe ser un número válido
            price <= 0 // El precio debe ser mayor a 0
          ) {
            console.warn(
              `Fila inválida: falta información requerida o el precio es incorrecto para el producto con código: ${row.barcode || 'desconocido'}`
            );
            return;
          }

          // Convertir barcode a string para evitar problemas con notación científica
          const barcode = String(row.barcode).trim();

          // Agregar producto válido a la lista si no es duplicado localmente
          if (!duplicateBarcodes.has(barcode)) {
            duplicateBarcodes.add(barcode); // Marcar como procesado
            products.push({
              barcode: barcode,
              internalCode: row.internalCode,
              description: row.description,
              price: price,
              family: row.family || null,
              subFamily: row.subFamily || null,
            });
          } else {
            console.warn(`Producto duplicado en el archivo ignorado: ${barcode}`);
          }
        } catch (error) {
          console.error('Error al procesar la fila:', error.message);
        }
      })
      .on('end', async () => {
        try {
          // Filtrar productos duplicados existentes en la base de datos
          const barcodes = products.map((product) => product.barcode);
          const existingProducts = await Product.find({ barcode: { $in: barcodes } });
          const existingBarcodes = new Set(existingProducts.map((p) => p.barcode));

          const productsToInsert = products.filter(
            (product) => !existingBarcodes.has(product.barcode)
          );

          // Insertar productos válidos en la base de datos
          if (productsToInsert.length > 0) {
            await Product.insertMany(productsToInsert);
          }

          res.status(201).json({
            message: 'Productos importados correctamente',
            importedCount: productsToInsert.length,
            duplicatesIgnored: products.length - productsToInsert.length,
          });
        } catch (error) {
          console.error('Error al insertar productos:', error);
          res.status(500).json({ message: 'Error al insertar productos', error });
        } finally {
          fs.unlinkSync(filePath); // Eliminar el archivo temporal
        }
      });
  } catch (error) {
    console.error('Error al importar productos:', error);
    res.status(500).json({ message: 'Error al importar productos' });
  }
};
