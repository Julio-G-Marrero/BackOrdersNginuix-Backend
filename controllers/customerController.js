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
    // Verifica que el archivo se haya recibido
    if (!req.file) {
      return res.status(400).json({ message: 'No se proporcionó ningún archivo' });
    }

    const filePath = req.file.path;
    const customers = [];

    // Leer y procesar el archivo CSV
    fs.createReadStream(filePath)
      .pipe(csvParser())
      .on('data', (row) => {
        // Verifica que las columnas requeridas existan en el archivo CSV
        if (!row['No. Cliente'] || !row['Nombre'] || !row['Direccion']) {
          console.error('Error en el archivo CSV: Falta información requerida');
          return;
        }

        customers.push({
          customerNumber: row['No. Cliente'],
          name: row['Nombre'],
          address: row['Direccion'],
          phone: row['Telefono'] || '', // Campo opcional
        });
      })
      .on('end', async () => {
        try {
          // Obtener los números de cliente únicos del CSV
          const customerNumbers = customers.map(c => c.customerNumber);

          // Consultar en la base de datos cuáles clientes ya existen
          const existingCustomers = await Customer.find({ customerNumber: { $in: customerNumbers } }).select('customerNumber');
          const existingCustomerNumbers = new Set(existingCustomers.map(c => c.customerNumber));

          // Filtrar solo los clientes que no existen
          const newCustomers = customers.filter(c => !existingCustomerNumbers.has(c.customerNumber));

          if (newCustomers.length > 0) {
            // Insertar solo los nuevos clientes
            await Customer.insertMany(newCustomers, { ordered: false });
            res.status(200).json({ message: `Clientes importados correctamente. Se ignoraron ${customers.length - newCustomers.length} duplicados.` });
          } else {
            res.status(200).json({ message: 'No se importaron nuevos clientes, todos estaban registrados.' });
          }
        } catch (error) {
          console.error('Error al guardar clientes:', error);
          res.status(500).json({ message: 'Error al guardar clientes', error });
        }

        // Elimina el archivo temporal después de procesarlo
        fs.unlinkSync(filePath);
      });
  } catch (error) {
    console.error('Error al procesar el archivo CSV:', error);
    res.status(500).json({ message: 'Error al procesar el archivo CSV', error });
  }
};