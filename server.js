// Archivo: server.js

const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');

// Importar rutas
const productRoutes = require('./routes/productRoutes');
const customerRoutes = require('./routes/customerRoutes');
const authRoutes = require('./routes/authRoutes');
const backOrderRoutes = require('./routes/backOrderRoutes'); // Importa las rutas de Back Orders
const providerRoutes = require("./routes/providerRoutes"); 
const stats = require("./routes/statsRoutes"); 
const userRoutes = require("./routes/userRoutes"); // ✅ Nueva ruta para obtener usuarios
const adminRoutes = require("./routes/adminRoutes"); // ✅ Nueva ruta para obtener usuarios
const notificationRoutes = require('./routes/notifications');
const twilioRoutes = require("./routes/twilioRoutes");
// Importar modelos
const Customer = require('./models/Customer'); // Importa el modelo de clientes
require('dotenv').config();

dotenv.config();

const app = express();

// Middleware
app.use(express.json());
app.use(cors());

// Conexión a MongoDB Mnaula
mongoose
    // .connect(process.env.MONGO_URI, {
    .connect("mongodb+srv://juliogarciam785:GuLQYc9Nn7Wj1Uyl@backorders.d4q8t.mongodb.net/?retryWrites=true&w=majority&appName=BackOrders", {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    })
    .then(() => console.log('Conectado a MongoDB'))
    .catch((err) => console.error('Error conectando a MongoDB:', err));

// Rutas base
app.get('/', (req, res) => {
    res.send('API Back Orders funcionando');
});
// 🚀 **Ruta Temporal para Eliminar TODOS los Clientes**
// app.delete('/api/v1/customers/delete-all', async (req, res) => {
//     try {
//         const result = await Customer.deleteMany({});
//         console.log(`Clientes eliminados: ${result.deletedCount}`);
//         res.status(200).json({ message: `Clientes eliminados: ${result.deletedCount}` });
//     } catch (error) {
//         console.error('Error al eliminar clientes:', error);
//         res.status(500).json({ message: 'Error al eliminar clientes', error });
//     }
// });


// Montar rutas
app.use('/api/v1/products', productRoutes); // Rutas para productos
app.use('/api/v1/customers', customerRoutes); // Rutas para clientes
app.use('/api/v1/auth', authRoutes); // Rutas para autenticación
app.use('/api/v1/backorders', backOrderRoutes); // Registra las rutas de Back Orders
app.use("/api/v1/providers", providerRoutes);
app.use("/api/v1/stats", stats);
app.use("/api/v1/users", userRoutes); // ✅ Rutas de usuarios
app.use("/api/v1/admin", adminRoutes); 
app.use('/api/notifications', notificationRoutes);
app.use("/twilio", twilioRoutes);
require('./jobs/scheduler');
// Servidor
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Servidor corriendo en el puerto ${PORT}`));