const Client = require('../models/Customer');
const Product = require('../models/Product');

exports.validateBackOrder = async (req, res, next) => {
    const { client, products } = req.body;
  
    // Validar que el cliente y los productos sean proporcionados
    if (!client || !products || products.length === 0) {
      return res.status(400).json({ message: 'Cliente y productos son obligatorios.' });
    }
  
    // Verificar si el cliente existe
    const validClient = await Client.findById(client);
    if (!validClient) {
      return res.status(404).json({ message: 'El cliente no existe.' });
    }
  
    // Verificar si los productos existen
    const productIds = products.map((p) => p.product);
    const validProducts = await Product.find({ _id: { $in: productIds } });
    if (validProducts.length !== productIds.length) {
      return res.status(404).json({ message: 'Uno o más productos no existen.' });
    }
  
    // Verificar que las cantidades sean mayores a cero
    for (const product of products) {
      if (product.quantity <= 0) {
        return res.status(400).json({
          message: `La cantidad del producto con ID ${product.product} debe ser mayor a cero.`,
        });
      }
    }
  
    // Verificar que no haya productos duplicados en el Back Order
    const uniqueProducts = new Set(productIds);
    if (uniqueProducts.size !== productIds.length) {
      return res.status(400).json({ message: 'No se permiten productos duplicados en el Back Order.' });
    }
  
    // Si todas las validaciones pasan, continuar con la lógica principal
    next();
};