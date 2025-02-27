const fs = require('fs');
const csv = require('csv-parser');
const Customer = require('../models/Customer');
const csvParser = require('csv-parser'); // Asegúrate de que este paquete está instalado: npm install csv-parser

// Crear cliente
exports.createCustomer = async (req, res) => {
    try {
        const customer = await Customer.create(req.body);
        res.status(201).json(customer);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

// Obtener todos los clientes
exports.getCustomers = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '' } = req.query;

    // Filtro de búsqueda
    const searchFilter = search
      ? {
          $or: [
            { customerNumber: { $regex: search, $options: 'i' } },
            { name: { $regex: search, $options: 'i' } },
            { address: { $regex: search, $options: 'i' } },
          ],
        }
      : {};

    // Total de resultados
    const total = await Customer.countDocuments(searchFilter);

    // Paginación y búsqueda
    const customers = await Customer.find(searchFilter)
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit))
      .sort({ name: 1 });

    res.status(200).json({ customers, total });
  } catch (error) {
    console.error('Error al obtener clientes:', error);
    res.status(500).json({ message: 'Error al obtener clientes' });
  }
};

// Actualizar cliente
exports.updateCustomer = async (req, res) => {
    try {
        const customer = await Customer.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.status(200).json(customer);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

// Eliminar cliente
exports.deleteCustomer = async (req, res) => {
    try {
        await Customer.findByIdAndDelete(req.params.id);
        res.status(200).json({ message: 'Cliente eliminado' });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};


exports.importCustomers = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No se proporcionó ningún archivo' });
    }

    const filePath = req.file.path;
    let customers = [];
    let totalRead = 0;
    let totalInserted = 0;
    let totalFailed = 0;
    let errorList = [];  // Guardar errores específicos por registro
    const batchSize = 500;

    console.log("📂 Iniciando importación del archivo:", filePath);

    const stream = fs.createReadStream(filePath)
      .pipe(csvParser())
      .on('data', (row) => {
        if (!row['No. Cliente'] || !row['Nombre']) return;

        totalRead++;

        customers.push({
          customerNumber: row['No. Cliente'],
          name: row['Nombre'],
          address: row['Direccion'] || '',
          phone: row['Telefono'] || '',
        });

        if (customers.length >= batchSize) {
          stream.pause();
          processBatch(customers)
            .then(() => {
              customers = [];
              stream.resume();
            })
            .catch((err) => console.error('🚨 Error en batch:', err));
        }
      })
      .on('end', async () => {
        if (customers.length > 0) {
          await processBatch(customers);
        }
        console.log(`✅ Fin de importación: Leídos: ${totalRead}, Insertados: ${totalInserted}, Fallidos: ${totalFailed}`);

        // 🔹 Guardar errores en un archivo para revisión
        if (errorList.length > 0) {
          fs.writeFileSync('errores_importacion.json', JSON.stringify(errorList, null, 2));
          console.log("⚠ Se generó el archivo 'errores_importacion.json' con los registros fallidos.");
        }

        res.status(200).json({
          message: `Importación completada: ${totalInserted} clientes insertados, ${totalFailed} fallidos.`,
          errors: errorList.length > 0 ? "Revisa errores_importacion.json para más detalles." : "Sin errores."
        });

        fs.unlinkSync(filePath);
      });

    async function processBatch(batch) {
      try {
        const customerNumbers = batch.map(c => c.customerNumber);

        const existingCustomers = await Customer.find({ 
          customerNumber: { $in: customerNumbers } 
        }).select('customerNumber');

        const existingCustomerNumbers = new Set(existingCustomers.map(c => c.customerNumber));

        const newCustomers = batch.filter(c => !existingCustomerNumbers.has(c.customerNumber));

        if (newCustomers.length > 0) {
          try {
            const result = await Customer.insertMany(newCustomers, { ordered: false });
            totalInserted += result.length;
            console.log(`🟢 Insertados ${result.length} registros.`);
          } catch (mongoError) {
            console.error("🚨 Error al insertar en MongoDB:", mongoError);
            totalFailed += newCustomers.length;
            errorList.push(...newCustomers.map(c => ({
              customerNumber: c.customerNumber,
              error: mongoError.message
            })));
          }
        }
      } catch (error) {
        console.error('🚨 Error en batch:', error);
      }
    }
  } catch (error) {
    console.error('🚨 Error al procesar el archivo CSV:', error);
    res.status(500).json({ message: 'Error al procesar el archivo CSV', error });
  }
};