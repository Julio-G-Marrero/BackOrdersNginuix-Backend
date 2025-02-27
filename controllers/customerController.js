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
    let totalRead = 0; // Conteo de registros leídos del CSV
    let totalInserted = 0; // Conteo de registros insertados en MongoDB
    let totalDuplicates = 0; // Conteo de registros duplicados ignorados
    const batchSize = 500; // Procesar en bloques de 500 registros

    console.log("📂 Iniciando importación del archivo:", filePath);

    const stream = fs.createReadStream(filePath)
      .pipe(csvParser())
      .on('data', (row) => {
        if (!row['No. Cliente'] || !row['Nombre']) return;

        totalRead++; // Contar registros leídos

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
        console.log(`✅ Fin de importación: Leídos: ${totalRead}, Insertados: ${totalInserted}, Duplicados: ${totalDuplicates}`);
        res.status(200).json({ 
          message: `Importación completada: ${totalInserted} clientes insertados, ${totalDuplicates} duplicados ignorados.` 
        });
        fs.unlinkSync(filePath);
      });

    async function processBatch(batch) {
      try {
        const customerNumbers = batch.map(c => c.customerNumber);

        // 🔹 Verificar cuántos ya existen en MongoDB
        const existingCustomers = await Customer.find({ 
          customerNumber: { $in: customerNumbers } 
        }).select('customerNumber');

        const existingCustomerNumbers = new Set(existingCustomers.map(c => c.customerNumber));
        totalDuplicates += existingCustomerNumbers.size; // Contar duplicados

        // Filtrar solo los nuevos clientes
        const newCustomers = batch.filter(c => !existingCustomerNumbers.has(c.customerNumber));

        if (newCustomers.length > 0) {
          const result = await Customer.insertMany(newCustomers, { ordered: false });
          totalInserted += result.length;
          console.log(`🟢 Insertados ${result.length} registros.`);
        } else {
          console.log("⚠ No hay nuevos registros para insertar en este batch.");
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