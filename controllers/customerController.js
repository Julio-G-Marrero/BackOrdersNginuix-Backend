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
    const batchSize = 500; // Procesar en bloques de 500 registros para evitar errores

    const stream = fs.createReadStream(filePath)
      .pipe(csvParser())
      .on('data', (row) => {
        // Permitir dirección y teléfono vacíos, solo validar "No. Cliente" y "Nombre"
        if (!row['No. Cliente'] || !row['Nombre']) return;

        customers.push({
          customerNumber: row['No. Cliente'],
          name: row['Nombre'],
          address: row['Direccion'] || '', // Permitir vacío
          phone: row['Telefono'] || '',   // Permitir vacío
        });

        if (customers.length >= batchSize) {
          stream.pause();
          processBatch(customers)
            .then(() => {
              customers = [];
              stream.resume();
            })
            .catch((err) => console.error('Error en batch:', err));
        }
      })
      .on('end', async () => {
        if (customers.length > 0) {
          await processBatch(customers);
        }
        res.status(200).json({ message: 'Importación completada correctamente.' });
        fs.unlinkSync(filePath);
      });

    async function processBatch(batch) {
      try {
        const customerNumbers = batch.map(c => c.customerNumber);

        // Filtrar clientes existentes SOLO por número de cliente
        const existingCustomers = await Customer.find({ 
          customerNumber: { $in: customerNumbers } 
        }).select('customerNumber');

        const existingCustomerNumbers = new Set(existingCustomers.map(c => c.customerNumber));

        // Filtrar solo los nuevos clientes que no existen en la base de datos
        const newCustomers = batch.filter(c => !existingCustomerNumbers.has(c.customerNumber));

        if (newCustomers.length > 0) {
          await Customer.insertMany(newCustomers, { ordered: false });
        }
      } catch (error) {
        console.error('Error en batch:', error);
      }
    }
  } catch (error) {
    console.error('Error al procesar el archivo CSV:', error);
    res.status(500).json({ message: 'Error al procesar el archivo CSV', error });
  }
};