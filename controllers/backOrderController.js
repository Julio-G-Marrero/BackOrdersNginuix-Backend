const BackOrder = require('../models/BackOrder');
const { createObjectCsvWriter } = require('csv-writer');
const fs = require('fs');
const mongoose = require('mongoose');
const path = require('path');
// Crear un Back Order
const Provider = require("../models/Provider"); // ✅ Importamos el modelo de proveedores
const Product = require('../models/Product');
const User = require("../models/User");
const {
  notifySellerOnBackOrderCreation,
  notifyManagerOnBackOrderCreation
} = require("../services/whatsappNotificationService");
const { sendNotification } = require('../services/whatsappSmsService');
const Customer = require('../models/Customer'); // Asegúrate de que la ruta sea correcta

exports.createBackOrder = async (req, res) => {
  try {
    const { client, products } = req.body;

    // Convertir `client` y `product` a ObjectId
    const cliente_id = new mongoose.Types.ObjectId(client);
    const vendedor_id = req.user.id; // ID del usuario autenticado

    // Buscar el usuario vendedor
    const vendedor = await User.findById(vendedor_id);
    if (!vendedor) {
      return res.status(404).json({ message: "Vendedor no encontrado" });
    }

    // Buscar al gerente (asumimos que hay un usuario con rol "gerente")
    const gerente = await User.findOne({ role: "gerente" });
    if (!gerente) {
      return res.status(404).json({ message: "Gerente no encontrado" });
    }

    // Convertir los IDs de productos en el array y agregar los nuevos datos
    const formattedProducts = products.map((product) => ({
      product: new mongoose.Types.ObjectId(product.product),
      description: product.description,
      quantity: product.quantity,
      comments: product.comments || "",
      price: product.price || 0,
      family: product.family || "No especificado",
      subFamily: product.subFamily || "No especificado",
      barcode: product.barcode || "No disponible",
      internalCode: product.internalCode || "No disponible",
      provider: "Diverso",
      status: "pending",
      fulfilledQuantity: 0,
      deniedQuantity: 0,
      history: [],
    }));

    // Crear el Back Order con los datos convertidos
    const backOrder = new BackOrder({
      client: cliente_id,
      products: formattedProducts,
      createdBy: vendedor_id,
      statusGeneral: "pending",
    });

    // Guardar el back order en la base de datos
    await backOrder.save();
    const cliente = await Customer.findById(backOrder.client);
    const clientName = cliente ? cliente.name : "Cliente Desconocido";
    // 📩 **Notificar al vendedor**
    if (vendedor.phone) {
      const sellerMessage = `¡Nuevo Back Order creado! ID: #${backOrder._id} 
      Cliente: ${clientName} 
      Revisa la plataforma: https://backordersnginuix-frontend-production.up.railway.app/vendedor/backorders`;
      await sendNotification(vendedor.phone, sellerMessage);
  } else {
      console.warn("⚠️ Vendedor no tiene número de teléfono registrado.");
  }
    // 📩 **Notificar al gerente**
    if (gerente.phone) {
      const managerMessage = `📌 El vendedor ${vendedor.name} ha creado un Back Order ID: #${backOrder._id} para el cliente:${clientName}. Revisa la plataforma: https://backordersnginuix-frontend-production.up.railway.app/backorders/purchase`;
      await sendNotification(gerente.phone, managerMessage);
    } else {
      console.warn("⚠️ Gerente no tiene número de teléfono registrado.");
    }

    res.status(201).json({ message: "Back Order creado con éxito", backOrder });

  } catch (error) {
    console.error("❌ Error al crear Back Order:", error);
    res.status(400).json({ message: "Error al crear Back Order", error });
  }
};

// Listar Back Orders del vendedor
exports.getMyBackOrders = async (req, res) => {
  try {
    const backOrders = await BackOrder.find({ createdBy: req.user.id }).populate('client').populate('products.product');
    res.status(200).json(backOrders);
  } catch (error) {
    console.error('Error al obtener Back Orders:', error);
    res.status(400).json({ message: 'Error al obtener Back Orders', error });
  }
};

// Listar Back Orders pendientes para el gerente
exports.getPendingBackOrders = async (req, res) => {
  try {
    const backOrders = await BackOrder.find({ 'products.status': 'pending' })
      .populate('client', 'name')
      .populate('products.product', 'description');

    res.status(200).json(backOrders);
  } catch (error) {
    console.error('Error al obtener Back Orders pendientes:', error);
    res.status(400).json({ message: 'Error al obtener Back Orders pendientes', error });
  }
};

exports.rejectProduct = async (req, res) => {
  console.log("🟢 Recibida solicitud para denegar producto");
  console.log("🔹 orderId recibido:", req.params.id);
  console.log("🔹 productId recibido:", req.params.productId);
  console.log("🔹 Cuerpo recibido:", req.body);

  const { id, productId } = req.params;
  const { comments } = req.body;
  const userName = req.user?.name || "Usuario desconocido";

  try {
    const backOrder = await BackOrder.findById(id).populate("client");
    if (!backOrder) {
      return res.status(404).json({ message: "Back Order no encontrado." });
    }

    const product = backOrder.products.find(p => p._id.toString() === productId);
    if (!product) {
      return res.status(404).json({ message: "Producto no encontrado en el Back Order." });
    }

    const productData = await Product.findById(product.product);
    const previousStatus = product.status;
    const productName = productData?.description || "Producto sin nombre";
    const clientName = backOrder.client?.name || "Cliente desconocido";

    // ✅ Marcar como denegado y registrar historial
    product.status = "denied";
    product.comments = comments || "Sin comentarios";
    product.deniedQuantity = product.quantity;
    product.fulfilledQuantity = 0;

    if (!product.history) {
      product.history = [];
    }

    product.history.push({
      action: `Producto denegado - ${productName}`,
      previousStatus,
      newStatus: "denied",
      updatedBy: userName,
      updatedAt: new Date(),
      deniedQuantity: product.deniedQuantity,
      fulfilledQuantity: 0,
      comments: comments || "Sin comentarios",
    });

    updateBackOrderStatus(backOrder);
    await backOrder.save();

    // 📌 Buscar vendedor y gerente
    const vendedor = await User.findById(backOrder.createdBy);
    const gerente = await User.findOne({ role: "gerente" });

    // ✅ Enviar notificación al vendedor
    if (vendedor && vendedor.phone) {
      const sellerMessage = `⚠️ Tu producto ha sido denegado.
      Producto: ${productName}
      Back Order ID: #${id}
      Cliente: ${clientName}
      Motivo: ${comments || "No especificado"}
      Revisa la plataforma: https://backordersnginuix-frontend-production.up.railway.app/vendedor/backorders`;

      await sendNotification(vendedor.phone, sellerMessage);
    } else {
      console.warn("⚠️ Vendedor no tiene número de teléfono registrado.");
    }

    // ✅ Enviar notificación al gerente
    if (gerente && gerente.phone) {
      const managerMessage = `⚠️ Un producto ha sido denegado por ${userName}.
      Producto: ${productName}
      Back Order ID: #${id}
      Cliente: ${clientName}
      Motivo: ${comments || "No especificado"}
      Revisa la plataforma: https://backordersnginuix-frontend-production.up.railway.app/backorders/purchase`;

      await sendNotification(gerente.phone, managerMessage);
    } else {
      console.warn("⚠️ Gerente no tiene número de teléfono registrado.");
    }

    res.json({ message: "Producto denegado correctamente.", product });
  } catch (error) {
    console.error("❌ Error al denegar el producto:", error);
    res.status(500).json({ message: "Error interno del servidor." });
  }
};

exports.getBackOrderById = async (req, res) => {
  try {
    const backOrder = await BackOrder.findById(req.params.id)
      .populate("client", "name") // ✅ Popula el cliente con su nombre
      .populate("products.product", "description") // ✅ Popula el producto con su descripción
      .populate({
        path: "products.provider", // ✅ Verifica si el proveedor existe antes de poblarlo
        select: "name",
        strictPopulate: false, // 🔹 Permite continuar si `provider` no está definido
      });

    if (!backOrder) {
      return res.status(404).json({ message: "Back Order no encontrado" });
    }

    // 🔥 Convertimos `backOrder` a un objeto seguro para modificarlo sin afectar la BD
    const backOrderWithOrderId = backOrder.toObject();

    // 🔹 Agregar `orderId` manualmente en cada producto
    backOrderWithOrderId.products = backOrderWithOrderId.products.map((prod) => ({
      ...prod,
      orderId: backOrder._id,
    }));

    res.status(200).json(backOrderWithOrderId);
  } catch (error) {
    console.error("❌ Error al obtener el Back Order:", error);

    // 🔹 Si es un error de `populate`, indicar solución
    if (error.name === "StrictPopulateError") {
      return res.status(500).json({
        message:
          "Error al poblar datos. Verifica que `products.provider` esté correctamente definido en el esquema.",
        error: error.message,
      });
    }

    res.status(500).json({ message: "Error interno del servidor.", error });
  }
};

exports.getBackOrders = async (req, res) => {
  const { client, status, startDate, endDate, sort } = req.query;

  const filters = {};
  
  // ✅ Filtrar por cliente
  if (client) filters.client = client;
  
  // ✅ Filtrar por estado del Back Order
  if (status) filters.statusGeneral = status;

  // ✅ Filtrar por rango de fechas
  if (startDate || endDate) {
    filters.createdAt = {};
    if (startDate) filters.createdAt.$gte = new Date(startDate);
    if (endDate) filters.createdAt.$lte = new Date(endDate);
  }

  try {
    const backOrders = await BackOrder.find(filters)
      .populate('client', 'name')  // ✅ Popula cliente con su nombre
      .populate('products.product', 'description') // ✅ Popula productos con descripción
      .populate('createdBy', 'name email') // ✅ Popula el usuario creador con nombre y correo
      .sort(sort ? { [sort]: 1 } : { createdAt: -1 }); // ✅ Ordenar resultados

    res.status(200).json(backOrders);
  } catch (error) {
    console.error('❌ Error al listar Back Orders:', error);
    res.status(500).json({ message: 'Error al listar Back Orders', error });
  }
};

exports.getStatistics = async (req, res) => {
  try {
    const stats = await BackOrder.aggregate([
      { $unwind: '$products' },
      {
        $group: {
          _id: '$products.status',
          count: { $sum: 1 },
        },
      },
    ]);
    res.status(200).json(stats);
  } catch (error) {
    console.error('Error al obtener estadísticas:', error);
    res.status(500).json({ message: 'Error al obtener estadísticas', error });
  }
};

exports.updateBackOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const { client, products } = req.body;

    const updatedBackOrder = await BackOrder.findByIdAndUpdate(
      id,
      { client, products },
      { new: true }
    );

    res.status(200).json(updatedBackOrder);
  } catch (error) {
    res.status(500).json({ message: 'Error al actualizar Back Order', error });
  }
};

exports.deleteBackOrder = async (req, res) => {
  try {
    const { id } = req.params;
    await BackOrder.findByIdAndDelete(id);
    res.status(200).json({ message: 'Back Order eliminado correctamente' });
  } catch (error) {
    res.status(500).json({ message: 'Error al eliminar Back Order', error });
  }
};

exports.exportBackOrders = async (req, res) => {
  try {
    // Ruta de la carpeta y archivo
    const exportDir = path.join(__dirname, '../exports');
    const exportFilePath = path.join(exportDir, 'backOrders.csv');

    // Verificar si la carpeta "exports" existe, si no, crearla
    if (!fs.existsSync(exportDir)) {
      fs.mkdirSync(exportDir, { recursive: true });
    }

    // Obtener los Back Orders de la base de datos
    const backOrders = await BackOrder.find()
      .populate('client', 'name') // Incluye el nombre del cliente
      .populate('products.product', 'description'); // Incluye la descripción de los productos

    // Define el archivo CSV
    const csvWriter = createObjectCsvWriter({
      path: exportFilePath,
      header: [
        { id: 'client', title: 'Cliente' },
        { id: 'status', title: 'Estado' },
        { id: 'product', title: 'Producto' },
        { id: 'quantity', title: 'Cantidad' },
        { id: 'comments', title: 'Comentarios' },
        { id: 'createdAt', title: 'Fecha de Creación' },
      ],
    });

    // Formatear los datos para el CSV
    const records = backOrders.flatMap((order) =>
      order.products.map((product) => ({
        client: order.client ? order.client.name : 'Cliente no asignado',
        status: order.status || 'Sin estado',
        product: product.product ? product.product.description : 'Producto no asignado',
        quantity: product.quantity || 0,
        comments: product.comments || '',
        createdAt: new Date(order.createdAt).toLocaleDateString(),
      }))
    );

    // Escribir los datos en el archivo CSV
    await csvWriter.writeRecords(records);

    // Enviar el archivo al cliente
    res.download(exportFilePath);
  } catch (error) {
    console.error('Error al exportar Back Orders:', error);
    res.status(500).json({ message: 'Error al exportar Back Orders.' });
  }
};

exports.updateProductStatus = async (req, res) => {
  const { id, productId } = req.params;
  const { status, comments } = req.body;
  const userName = req.user?.name || "Usuario desconocido";

  try {
    const backOrder = await BackOrder.findById(id);

    if (!backOrder) {
      return res.status(404).json({ message: "Back Order no encontrado" });
    }

    const product = backOrder.products.find((p) => p._id.toString() === productId);
    if (!product) {
      return res.status(404).json({ message: "Producto no encontrado en este Back Order" });
    }

    // Estados permitidos
    const allowedStatuses = [
      "denied",
      "in_process",
      "pending_approval",
      "in_delivery_process",
      "partial",
      "fulfilled"
    ];
    
    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({ message: `Estado inválido para revisión: ${status}` });
    }

    // Evitar cambios en productos ya surtidos completamente
    if (product.status === "fulfilled") {
      return res.status(400).json({ message: "No se puede cambiar el estado de un producto ya surtido." });
    }

    // Si el estado es denegado, la observación es obligatoria
    if (status === "denied" && !comments) {
      return res.status(400).json({ message: "Debe incluir una observación al negar el producto." });
    }

    // Guardar estado anterior antes de actualizar
    const previousStatus = product.status;
    product.status = status;

    if (comments) {
      product.comments = comments;
    }

    // Agregar al historial de cambios
    product.history = product.history || [];
    product.history.push({
      action: "update_status",
      previousStatus: previousStatus, // Estado antes de actualizar
      newStatus: status,
      updatedBy: userName, 
      updatedAt: new Date(),
      comments: comments || "",
    });

    // 🔹 **Actualizar estado global del Back Order**
    const allDenied = backOrder.products.every((p) => p.status === "denied");
    const allFulfilled = backOrder.products.every((p) => p.status === "fulfilled");
    const inProcess = backOrder.products.some((p) => p.status === "in_process");
    const pendingApproval = backOrder.products.some((p) => p.status === "pending_approval");
    const partial = backOrder.products.some((p) => p.status === "partial");

    if (allDenied) {
      backOrder.statusGeneral = "denied";
    } else if (allFulfilled) {
      backOrder.statusGeneral = "fulfilled";
    } else if (partial) {
      backOrder.statusGeneral = "partial";
    } else if (pendingApproval) {
      backOrder.statusGeneral = "pending_approval";
    } else if (inProcess) {
      backOrder.statusGeneral = "in_process";
    } else {
      backOrder.statusGeneral = "in_delivery_process";
    }

    await backOrder.save();

    res.status(200).json({ message: "Estado del producto actualizado", backOrder });
  } catch (error) {
    console.error("❌ Error al actualizar el estado del producto:", error);
    res.status(500).json({ message: "Error al actualizar el estado del producto", error });
  }
};


exports.closeBackOrder = async (req, res) => {
  const { id } = req.params;

  try {
    const backOrder = await BackOrder.findById(id);

    if (!backOrder) {
      return res.status(404).json({ message: "Back Order no encontrado" });
    }

    const allProductsProcessed = backOrder.products.every(product =>
      ["fulfilled", "denied", "partial"].includes(product.status)
    );

    if (!allProductsProcessed) {
      return res.status(400).json({ message: "No se puede cerrar, hay productos pendientes." });
    }

    backOrder.statusGeneral = "fulfilled";

    backOrder.products.forEach((product) => {
      product.history.push({
        action: "Back Order cerrado",
        previousStatus: product.status,
        newStatus: "fulfilled",
        updatedBy: "Sistema",
        updatedAt: new Date(),
        comments: "Todos los productos procesados.",
      });
    });
    // 🔹 **Actualizar estado global del Back Order**
    updateBackOrderStatus(backOrder);
    await backOrder.save();

    res.status(200).json({ message: "Back Order cerrado con éxito.", backOrder });
  } catch (error) {
    console.error("❌ Error al cerrar Back Order:", error);
    res.status(500).json({ message: "Error al cerrar Back Order." });
  }
};

exports.confirmProviderResponse = async (req, res) => {
  const { id, productId } = req.params;
  const { fulfilledQuantity, deniedQuantity, promiseDate } = req.body;
  const userName = req.user?.name || "Usuario desconocido"; // ✅ Obtener nombre del usuario

  try {
    const backOrder = await BackOrder.findById(id);
    if (!backOrder) {
      return res.status(404).json({ message: "Back Order no encontrado." });
    }

    const product = backOrder.products.find(p => p._id.toString() === productId);
    if (!product) {
      return res.status(404).json({ message: "Producto no encontrado en el Back Order." });
    }

    const previousStatus = product.status; // ✅ Guardar estado previo

    // 🔹 Actualizar cantidades y fecha promesa
    product.status = "pending_approval";
    product.fulfilledQuantity = fulfilledQuantity;
    product.deniedQuantity = deniedQuantity;
    product.promiseDate = promiseDate;

    // 🔹 Agregar al historial
    product.history.push({
      action: "Confirmación de surtimiento",
      previousStatus,
      newStatus: "pending_approval",
      updatedBy: userName, // ✅ Almacena el nombre del usuario
      updatedAt: new Date(),
      fulfilledQuantity, // ✅ Almacena la cantidad surtida
      deniedQuantity, // ✅ Almacena la cantidad denegada
      comments: `Cantidad surtida: ${fulfilledQuantity}, Cantidad denegada: ${deniedQuantity}, Fecha promesa: ${promiseDate}`,
    });
    // 🔹 **Actualizar estado global del Back Order**
    updateBackOrderStatus(backOrder);
    await backOrder.save();
    res.json({ message: "Confirmación de surtimiento registrada.", product });
  } catch (error) {
    console.error("Error al confirmar surtimiento:", error);
    res.status(500).json({ message: "Error interno del servidor." });
  }
};

exports.confirmProvider = async (req, res) => {
  const { id, productId } = req.params;
  const { provider, comments } = req.body;
  const user = req.user.name;

  console.log("🟢 Backend recibió la solicitud:");
  console.log("🟢 Order ID:", id);
  console.log("🟢 Product ID:", productId);
  console.log("🟢 Provider ID:", provider);
  console.log("🟢 Usuario que asigna:", user);

  try {
    const backOrder = await BackOrder.findById(id).populate("client");
    if (!backOrder) {
      return res.status(404).json({ message: "Back Order no encontrado." });
    }

    const product = backOrder.products.find(p => p._id.toString() === productId);
    if (!product) {
      return res.status(404).json({ message: "Producto no encontrado en el Back Order." });
    }

    // 🔹 Obtener información del proveedor desde la BD
    const providerData = await Provider.findById(provider);
    if (!providerData) {
      return res.status(404).json({ message: "Proveedor no encontrado." });
    }

    console.log("🟢 Nombre del proveedor encontrado:", providerData.name);

    // 🔹 Guardar SOLO el nombre del proveedor en el producto
    product.status = "in_process"; // ✅ Estado actualizado
    product.provider = providerData.name; // 🔹 Guardamos solo el nombre

    // 🔹 Agregar registro al historial del producto
    product.history.push({
      action: "Proveedor asignado",
      previousStatus: "pending",
      newStatus: "in_process",
      updatedBy: user,
      updatedAt: new Date(),
      comments: comments || "Proveedor asignado sin comentarios.",
    });

    // 🔹 **Actualizar estado global del Back Order**
    updateBackOrderStatus(backOrder);

    await backOrder.save();
    console.log("✅ Proveedor asignado correctamente en la BD");

    // 📌 Buscar vendedor y gerente
    const vendedor = await User.findById(backOrder.createdBy);
    const gerente = await User.findOne({ role: "gerente" });

    const productName = product.description;
    const clientName = backOrder.client?.name || "Cliente desconocido";

    // ✅ Notificar al vendedor (WhatsApp & SMS)
    if (vendedor && vendedor.phone) {
      const sellerMessage = `Un proveedor ha sido asignado a tu Back Order.
      Producto: ${productName}
      Back Order ID: #${id}
      Cliente: ${clientName}
      Proveedor: ${providerData.name}
      Revisa la plataforma: https://backordersnginuix-frontend-production.up.railway.app/vendedor/backorders`;

      await sendNotification(vendedor.phone, sellerMessage);
    } else {
      console.warn("⚠️ Vendedor no tiene número de teléfono registrado.");
    }

    // ✅ Notificar al gerente (WhatsApp & SMS)
    if (gerente && gerente.phone) {
      const managerMessage = `Se ha asignado un proveedor a un Back Order.
      Producto: ${productName}
      Back Order ID: #${id}
      Cliente: ${clientName}
      Proveedor: ${providerData.name}
      Revisa la plataforma: https://backordersnginuix-frontend-production.up.railway.app/backorders/purchase`;

      await sendNotification(gerente.phone, managerMessage);
    } else {
      console.warn("⚠️ Gerente no tiene número de teléfono registrado.");
    }

    res.json({ message: "Proveedor asignado correctamente.", product });

  } catch (error) {
    console.error("❌ Error al asignar proveedor:", error);
    res.status(500).json({ message: "Error interno del servidor." });
  }
};

exports.confirmSupplierResponse = async (req, res) => {
  const { id, productId } = req.params;
  const { fulfilledQuantity, deniedQuantity, promiseDate, price } = req.body;
  const user = req.user.name;

  console.log("🟢 Confirmando surtimiento...");
  console.log("🟢 Order ID:", id);
  console.log("🟢 Product ID:", productId);
  console.log("🟢 Usuario:", user);
  console.log("🟢 Cantidad surtida:", fulfilledQuantity);
  console.log("🟢 Cantidad denegada:", deniedQuantity);
  console.log("🟢 Fecha promesa:", promiseDate);
  console.log("🟢 Precio unitario:", price);

  try {
    const backOrder = await BackOrder.findById(id);
    if (!backOrder) {
      return res.status(404).json({ message: "Back Order no encontrado." });
    }

    const product = backOrder.products.find(p => p._id.toString() === productId);
    if (!product) {
      return res.status(404).json({ message: "Producto no encontrado en el Back Order." });
    }

    // 🔹 Actualizar cantidades, precio y fecha promesa
    product.status = "pending_approval";
    product.fulfilledQuantity = fulfilledQuantity;
    product.deniedQuantity = deniedQuantity;
    product.promiseDate = promiseDate;
    product.price = price;  // 💰 Actualizar el precio en la BD

    // 🔹 Agregar registro al historial
    product.history.push({
      action: "Confirmación de surtimiento",
      previousStatus: "in_process",
      newStatus: "pending_approval",
      updatedBy: user,
      updatedAt: new Date(),
      comments: `Cantidad surtida: ${fulfilledQuantity}, Denegada: ${deniedQuantity}, Fecha promesa: ${promiseDate}, Precio: $${price}`,
    });

    // 🔹 **Actualizar estado global del Back Order**
    updateBackOrderStatus(backOrder);
    await backOrder.save();
    console.log("✅ Surtimiento confirmado correctamente en la BD");

    res.json({ message: "Confirmación de surtimiento registrada.", product });
  } catch (error) {
    console.error("❌ Error al confirmar surtimiento:", error);
    res.status(500).json({ message: "Error interno del servidor." });
  }
};

exports.vendorApproval = async (req, res) => {
  const { orderId, productId } = req.params;
  const { approved } = req.body;
  const userName = req.user?.name || "Usuario desconocido"; // ✅ Obtener nombre del usuario

  try {
    console.log(`📌 Aprobación/Rechazo del Vendedor`);
    console.log(`📝 Back Order ID: ${orderId}`);
    console.log(`🛒 Producto ID: ${productId}`);
    console.log(`✅ Aprobado: ${approved}`);

    const backOrder = await BackOrder.findById(orderId);
    if (!backOrder) {
      return res.status(404).json({ message: "Back Order no encontrado." });
    }

    const product = backOrder.products.find((p) => p._id.toString() === productId);
    if (!product) {
      return res.status(404).json({ message: "Producto no encontrado en este Back Order." });
    }

    // ✅ Guardar estado previo
    const previousStatus = product.status;

    if (approved) {
      product.status = "shipped"; // ✅ Ahora se espera la confirmación del proveedor antes de surtir
    } else {
      product.status = "denied";
      product.comments = "Rechazado por el cliente";
    }

    // 🔹 Agregar al historial
    product.history.push({
      action: "Aprobación del vendedor",
      previousStatus,
      newStatus: approved ? "shipped" : "denied",
      updatedBy: userName,
      updatedAt: new Date(),
      comments: approved ? "Aprobado por el cliente" : "Rechazado por el cliente",
    });

    // 🔹 **Actualizar estado global del Back Order**
    updateBackOrderStatus(backOrder);

    await backOrder.save();
    res.status(200).json({ message: "Decisión del vendedor registrada", backOrder });
  } catch (error) {
    console.error("❌ Error en la aprobación del vendedor:", error);
    res.status(500).json({ message: "Error en la aprobación del vendedor", error });
  }
};

const updateBackOrderStatus = (backOrder) => {
  const productStatuses = backOrder.products.map((p) => p.status);

  if (productStatuses.every((status) => status === "fulfilled")) {
    backOrder.statusGeneral = "fulfilled";
  } else if (productStatuses.every((status) => status === "denied")) {
    backOrder.statusGeneral = "denied";
  } else if (productStatuses.some((status) => status === "pending_approval")) {
    backOrder.statusGeneral = "pending_approval";
  } else if (productStatuses.some((status) => status === "shipped")) {
    backOrder.statusGeneral = "shipped"; // ✅ Nuevo estado (esperando confirmación del proveedor)
  } else if (productStatuses.some((status) => status === "in_delivery_process")) {
    backOrder.statusGeneral = "in_delivery_process";
  } else if (productStatuses.some((status) => status === "in_process")) {
    backOrder.statusGeneral = "in_process";
  } else if (productStatuses.some((status) => status === "partial")) {
    backOrder.statusGeneral = "partial";
  } else {
    backOrder.statusGeneral = "pending"; // Si no hay cambios, se mantiene pendiente
  }
};

exports.confirmShipment = async (req, res) => {
  try {
    const { orderId, productId } = req.params;
    const { shipmentDate } = req.body;
    const userName = req.user?.name || "Usuario desconocido"; // ✅ Obtener usuario autenticado

    console.log("🟢 Confirmando envío del proveedor");
    console.log("📌 ID del Back Order:", orderId);
    console.log("📌 ID del Producto:", productId);
    console.log("📌 Fecha de Envío Confirmada:", shipmentDate);

    // ✅ Buscar el Back Order en la BD
    const backOrder = await BackOrder.findById(orderId);
    if (!backOrder) {
      console.log("❌ Back Order no encontrado.");
      return res.status(404).json({ message: "Back Order no encontrado." });
    }

    // ✅ Buscar el producto dentro del Back Order
    const product = backOrder.products.find(p => p._id.toString() === productId);
    if (!product) {
      console.log("❌ Producto no encontrado en el Back Order.");
      return res.status(404).json({ message: "Producto no encontrado en el Back Order." });
    }

    // ✅ Validar la fecha de envío
    if (!shipmentDate) {
      console.log("❌ Error: Fecha de envío requerida.");
      return res.status(400).json({ message: "Debe proporcionar una fecha de envío." });
    }

    // ✅ Actualizar el estado del producto a "in_delivery_process"
    product.status = "in_delivery_process";
    product.promiseDate = shipmentDate; // ✅ Guardar la fecha confirmada

    // ✅ Registrar en el historial del producto
    product.history.push({
      action: "Confirmación de Envío",
      previousStatus: "shipped",
      newStatus: "in_delivery_process",
      updatedBy: userName,
      updatedAt: new Date(),
      comments: `Proveedor confirmó envío el ${shipmentDate}. Producto ahora en proceso de surtimiento.`,
    });

    // ✅ Verificar si todos los productos están en proceso de surtimiento
    const allInDelivery = backOrder.products.every(p => p.status === "in_delivery_process");
    if (allInDelivery) {
      backOrder.statusGeneral = "in_delivery_process";
    }

    // ✅ Guardar cambios en la BD
    await backOrder.save();
    console.log("✅ Envío confirmado correctamente. Estado actualizado a 'in_delivery_process'.");

    res.status(200).json({ message: "Envío confirmado y producto en proceso de surtimiento.", backOrder });
  } catch (error) {
    console.error("❌ Error al confirmar envío:", error);
    res.status(500).json({ message: "Error al confirmar el envío del proveedor." });
  }
};

exports.fulfillProduct = async (req, res) => {
  try {
    const { orderId, productId } = req.params;
    const { fulfilledQuantity, comments } = req.body;
    const userName = req.user?.name || "Usuario desconocido";

    console.log("📦 Confirmando surtimiento del producto...");
    console.log("📌 Back Order ID:", orderId);
    console.log("📌 Producto ID:", productId);
    console.log("📌 Cantidad Surtida:", fulfilledQuantity);

    // Obtener el Back Order
    const backOrder = await BackOrder.findById(orderId);
    if (!backOrder) {
      return res.status(404).json({ message: "Back Order no encontrado." });
    }

    // Obtener el producto dentro del Back Order
    const product = backOrder.products.find(p => p._id.toString() === productId);
    if (!product) {
      return res.status(404).json({ message: "Producto no encontrado en el Back Order." });
    }

    // Definir el estado según la cantidad surtida
    let newStatus = "fulfilled"; // Surtido Completo por defecto

    if (fulfilledQuantity < product.quantity && fulfilledQuantity > 0) {
      newStatus = "partial"; // Surtido Parcial
      product.deniedQuantity = product.quantity - fulfilledQuantity;
    } else if (fulfilledQuantity === 0) {
      newStatus = "denied"; // No se entregó el producto
      product.deniedQuantity = product.quantity;
    }

    // Actualizar el estado del producto
    product.status = newStatus;
    product.fulfilledQuantity = fulfilledQuantity;
    product.comments = comments || "";

    // Agregar al historial
    product.history.push({
      action: "Surtimiento Confirmado",
      previousStatus: product.status,
      newStatus,
      updatedBy: userName,
      updatedAt: new Date(),
      fulfilledQuantity,
      deniedQuantity: product.deniedQuantity,
      comments: comments || "",
    });

    // 🔹 **Actualizar estado general del Back Order**
    updateBackOrderStatus(backOrder);

    // Guardar cambios
    await backOrder.save();
    console.log("✅ Producto actualizado correctamente.");

    res.status(200).json({ message: "Surtimiento confirmado correctamente.", backOrder });
  } catch (error) {
    console.error("❌ Error en la confirmación de surtimiento:", error);
    res.status(500).json({ message: "Error en la confirmación de surtimiento.", error });
  }
};

exports.receiveProduct = async (req, res) => {
  try {
    const { orderId, productId } = req.params;
    const { receivedQuantity } = req.body;
    const userName = req.user?.name || "Usuario desconocido";

    console.log("📦 Registrando recepción física del producto...");
    console.log("📌 Back Order ID:", orderId);
    console.log("📌 Producto ID:", productId);
    console.log("📌 Cantidad Recibida:", receivedQuantity);

    // Obtener el Back Order
    const backOrder = await BackOrder.findById(orderId);
    if (!backOrder) {
      return res.status(404).json({ message: "Back Order no encontrado." });
    }

    // Obtener el producto dentro del Back Order
    const product = backOrder.products.find(p => p._id.toString() === productId);
    if (!product) {
      return res.status(404).json({ message: "Producto no encontrado en el Back Order." });
    }

    // Validar cantidad recibida
    if (receivedQuantity < 0 || receivedQuantity > product.fulfilledQuantity) {
      return res.status(400).json({ message: "Cantidad recibida inválida." });
    }

    // Actualizar el estado del producto según la cantidad recibida
    let newStatus = "fulfilled"; // Por defecto, se considera completamente recibido

    if (receivedQuantity < product.fulfilledQuantity && receivedQuantity > 0) {
      newStatus = "partial"; // Surtido Parcial
      product.deniedQuantity = product.fulfilledQuantity - receivedQuantity;
    } else if (receivedQuantity === 0) {
      newStatus = "denied"; // No se recibió nada
      product.deniedQuantity = product.fulfilledQuantity;
    }

    // Actualizar el estado y cantidades
    product.status = newStatus;
    product.fulfilledQuantity = receivedQuantity;

    // Agregar al historial
    product.history.push({
      action: "Recepción Física",
      previousStatus: product.status,
      newStatus,
      updatedBy: userName,
      updatedAt: new Date(),
      fulfilledQuantity: receivedQuantity,
      deniedQuantity: product.deniedQuantity,
      comments: receivedQuantity === 0 ? "No se recibió el producto." : `Recibido ${receivedQuantity} unidades.`,
    });

    // 🔹 **Actualizar estado general del Back Order**
    updateBackOrderStatus(backOrder);

    // Guardar cambios
    await backOrder.save();
    console.log("✅ Recepción registrada correctamente.");

    res.status(200).json({ message: "Recepción registrada correctamente.", backOrder });
  } catch (error) {
    console.error("❌ Error en la recepción física del producto:", error);
    res.status(500).json({ message: "Error en la recepción física del producto.", error });
  }
};

// 🔹 Obtener Back Orders del vendedor autenticado
exports.getSellerBackOrders = async (req, res) => {
  try {
    const sellerId = req.user.id; // ✅ Extraer ID del vendedor autenticado
    const backOrders = await BackOrder.find({ createdBy: sellerId })
      .populate("client", "name")
      .populate("products.product", "description price")
      .sort({ createdAt: -1 });

    res.json(backOrders);
  } catch (error) {
    console.error("❌ Error al obtener Back Orders del vendedor:", error);
    res.status(500).json({ message: "Error al obtener Back Orders" });
  }
};

// 🔹 Vendedor aprueba o rechaza la fecha promesa y cantidad
// 🔹 Vendedor aprueba o rechaza la fecha promesa y cantidad
exports.approveOrRejectProduct = async (req, res) => {
  try {
    const { orderId, productId } = req.params;
    const { decision, createNewBackOrder, remainingQuantity, comments } = req.body;
    const userName = req.user?.name || "Usuario desconocido";

    console.log("🟢 Recibiendo solicitud de aprobación/rechazo");
    console.log("📌 ID del Back Order:", orderId);
    console.log("📌 ID del Producto:", productId);
    console.log("📌 Decisión:", decision);
    console.log("📌 Crear nuevo Back Order:", createNewBackOrder);
    console.log("📌 Cantidad para nuevo Back Order:", remainingQuantity);

    const backOrder = await BackOrder.findById(orderId);
    if (!backOrder) {
      return res.status(404).json({ message: "Back Order no encontrado." });
    }

    const product = backOrder.products.find((p) => p._id.toString() === productId);
    if (!product) {
      return res.status(404).json({ message: "Producto no encontrado en el Back Order." });
    }

    // 📌 Guardar estado previo
    const previousStatus = product.status;

    if (decision === "approve") {
      product.status = "shipped"; // ✅ Esperando confirmación de envío del proveedor
    } else {
      product.status = "denied";
      product.comments = comments || "Rechazado por el cliente.";
    }

    // 🔹 Si el vendedor elige crear un nuevo Back Order con los productos faltantes
    if (createNewBackOrder && remainingQuantity > 0) {
      const newBackOrder = new BackOrder({
        client: backOrder.client,
        products: [
          {
            product: product.product,
            description: product.description,
            quantity: remainingQuantity,
            comments: "Reordenado por falta de stock.",
            price: product.price,
            family: product.family,
            subFamily: product.subFamily,
            barcode: product.barcode,
            internalCode: product.internalCode,
            provider: product.provider,
            promisedDate: null,
            status: "pending",
            history: [
              {
                action: "Reordenado",
                previousStatus: product.status,
                newStatus: "pending",
                updatedBy: userName,
                updatedAt: new Date(),
                comments: "Nueva orden creada por cantidad faltante.",
              },
            ],
          },
        ],
        createdBy: backOrder.createdBy,
        statusGeneral: "pending",
      });

      await newBackOrder.save();
      console.log(`✅ Nuevo Back Order creado con ID: ${newBackOrder._id}`);
    }

    // 🔹 Agregar al historial del producto original
    product.history.push({
      action: "Aprobación del vendedor",
      previousStatus,
      newStatus: product.status,
      updatedBy: userName,
      updatedAt: new Date(),
      comments: comments || (decision === "approve" ? "Aprobado por el cliente" : "Rechazado por el cliente"),
    });

    // 🔹 **Actualizar estado general del Back Order**
    backOrder.statusGeneral = await calculateBackOrderStatus(backOrder);

    await backOrder.save();
    console.log("✅ Decisión aplicada correctamente.");

    res.json({ message: "Decisión registrada correctamente.", backOrder });
  } catch (error) {
    console.error("❌ Error al aprobar/rechazar el producto:", error);
    res.status(500).json({ message: "Error interno del servidor." });
  }
};

// ✅ Obtener un Back Order con el nombre del usuario creador
exports.getBackOrderById = async (req, res) => {
  try {
    const backOrder = await BackOrder.findById(req.params.id)
      .populate("client", "name") // ✅ Obtiene el nombre del cliente
      .populate("createdBy", "name email") // ✅ Obtiene el nombre y correo del usuario creador
      .populate("products.product", "description price") // ✅ Obtiene la descripción y precio del producto
      .populate("products.provider", "name") // ✅ Si `provider` es un ObjectId, lo populará con su nombre

    if (!backOrder) {
      return res.status(404).json({ message: "Back Order no encontrado" });
    }

    res.json(backOrder);
  } catch (error) {
    console.error("❌ Error al obtener el Back Order:", error);
    res.status(500).json({ message: "Error en el servidor" });
  }
};

exports.handlePartialDelivery = async (req, res) => {
  try {
    const { orderId, productId } = req.params;
    const { decision, remainingQuantity, comments } = req.body;
    const userName = req.user?.name || "Usuario desconocido";

    console.log("🟢 Recibiendo decisión de entrega parcial");
    console.log("📌 ID del Back Order:", orderId);
    console.log("📌 ID del Producto:", productId);
    console.log("📌 Decisión:", decision);
    console.log("📌 Cantidad restante:", remainingQuantity);

    const backOrder = await BackOrder.findById(orderId);
    if (!backOrder) {
      return res.status(404).json({ message: "Back Order no encontrado." });
    }

    const product = backOrder.products.find((p) => p._id.toString() === productId);
    if (!product) {
      return res.status(404).json({ message: "Producto no encontrado en el Back Order." });
    }

    // 📌 Guardar estado previo
    const previousStatus = product.status;

    if (decision === "reject_remaining") {
      // 🔹 El vendedor decide cerrar el producto como `denied`
      product.status = "denied";
      product.comments = comments || "Cantidad faltante rechazada.";
    } else if (decision === "create_new_backorder") {
      // 🔹 Se crea un nuevo Back Order con la cantidad pendiente
      const newBackOrder = new BackOrder({
        client: backOrder.client,
        products: [
          {
            product: product.product,
            description: product.description,
            quantity: remainingQuantity,
            comments: "Reordenado por falta de stock.",
            price: product.price,
            family: product.family,
            subFamily: product.subFamily,
            barcode: product.barcode,
            internalCode: product.internalCode,
            provider: product.provider,
            promisedDate: null,
            status: "pending",
            history: [
              {
                action: "Reordenado",
                previousStatus: product.status,
                newStatus: "pending",
                updatedBy: userName,
                updatedAt: new Date(),
                comments: "Nueva orden creada por cantidad faltante.",
              },
            ],
          },
        ],
        createdBy: backOrder.createdBy,
        statusGeneral: "pending",
      });

      await newBackOrder.save();
    }

    // 🔹 Registrar en el historial del producto original
    product.history.push({
      action: "Decisión de entrega parcial",
      previousStatus,
      newStatus: product.status,
      updatedBy: userName,
      updatedAt: new Date(),
      comments: comments || "Decisión aplicada por el vendedor.",
    });

    // 🔹 Recalcular estado del Back Order original
    backOrder.statusGeneral = await calculateBackOrderStatus(backOrder);

    await backOrder.save();
    console.log("✅ Decisión de entrega parcial aplicada correctamente.");

    res.json({ message: "Decisión registrada correctamente.", backOrder });
  } catch (error) {
    console.error("❌ Error al procesar la entrega parcial:", error);
    res.status(500).json({ message: "Error interno del servidor." });
  }
};

exports.getAggregatedBackOrders = async (req, res) => {
  try {
    const backOrders = await BackOrder.find()
      .populate("createdBy", "name")
      .populate("client", "name"); // ✅ Poblar el cliente para obtener su nombre

    const aggregatedData = {};

    backOrders.forEach(order => {
      order.products.forEach(product => {
        const provider = product.provider;
        const productName = product.description;

        if (!aggregatedData[provider]) {
          aggregatedData[provider] = {};
        }

        if (!aggregatedData[provider][productName]) {
          aggregatedData[provider][productName] = {
            totalQuantity: 0,
            details: [],
          };
        }

        aggregatedData[provider][productName].totalQuantity += product.quantity;
        aggregatedData[provider][productName].details.push({
          client: order.client?.name || "Cliente desconocido", // ✅ Ahora sí debería mostrarse correctamente
          quantity: product.quantity,
          status: product.status,
          orderId: order._id,
          createdBy: order.createdBy ? { name: order.createdBy.name } : { name: "Usuario no asignado" }, // ✅ Agregamos el vendedor
        });
      });
    });

    res.json(aggregatedData);
  } catch (error) {
    console.error("Error obteniendo backorders agregados:", error);
    res.status(500).json({ error });
  }
};

exports.revertProductStatus  = async (req, res) => {
  const { orderId, productId } = req.params;
  const { previousStatus, updatedBy } = req.body;

  const validReversions = {
    denied: ["pending", "pending_approval"],
    in_process: ["pending", "pending_approval", "denied"],
    pending_approval: ["in_process", "pending"],
    shipped: ["in_process", "pending_approval"],
    fulfilled: ["partial", "in_process", "denied"],
    delayed: ["in_delivery_process", "in_process"],
  };

  try {
    const backOrder = await BackOrder.findById(orderId);
    if (!backOrder) {
      return res.status(404).json({ message: "Back Order no encontrado" });
    }

    const product = backOrder.products.find((p) => p._id.toString() === productId);
    if (!product) {
      return res.status(404).json({ message: "Producto no encontrado en el Back Order" });
    }

    if (!validReversions[product.status]?.includes(previousStatus)) {
      return res.status(400).json({ message: "Estado no válido para reversión" });
    }

    product.history.push({
      action: `Reversión de estado a ${previousStatus}`,
      previousStatus: product.status,
      newStatus: previousStatus,
      updatedBy,
      updatedAt: new Date(),
    });

    product.status = previousStatus;

    await backOrder.save();

    res.json({ message: "Estado revertido con éxito", product });
  } catch (error) {
    console.error("❌ Error al revertir estado del producto:", error);
    res.status(500).json({ message: "Error en el servidor" });
  }
}


// 🔹 Función para calcular el estado general del Back Order
const calculateBackOrderStatus = (backOrder) => {
  const statuses = backOrder.products.map(p => p.status);

  if (statuses.every(status => status === "denied")) {
    return "denied"; // ❌ Todos los productos rechazados
  }

  if (statuses.every(status => status === "fulfilled")) {
    return "fulfilled"; // ✅ Todos los productos surtidos
  }

  if (statuses.includes("delayed")) {
    return "delayed"; // 🚨 Algún producto está retrasado
  }

  if (statuses.includes("in_delivery_process")) {
    return "in_delivery_process"; // 🚚 Algunos productos están en proceso de entrega
  }

  if (statuses.includes("shipped")) {
    return "shipped"; // 📦 Algún producto está enviado
  }

  if (statuses.includes("pending_approval")) {
    return "pending_approval"; // ⏳ Algún producto está pendiente de aprobación del vendedor
  }

  if (statuses.includes("in_process")) {
    return "in_process"; // 🔄 Algún producto está en proceso con el proveedor
  }

  if (statuses.includes("partial")) {
    return "partial"; // 🟡 Algunos productos fueron surtidos parcialmente
  }

  return "pending"; // 🕒 Si no hay cambios, sigue pendiente
};

