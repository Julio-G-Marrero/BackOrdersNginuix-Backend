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

// Montar rutas
app.use('/api/v1/products', productRoutes); // Rutas para productos
app.use('/api/v1/customers', customerRoutes); // Rutas para clientes
app.use('/api/v1/auth', authRoutes); // Rutas para autenticación
app.use('/api/v1/backorders', backOrderRoutes); // Registra las rutas de Back Orders
app.use("/api/v1/providers", providerRoutes);
app.use("/api/v1/stats", stats);
app.use("/api/v1/users", userRoutes); // ✅ Rutas de usuarios
app.use("/api/v1/admin", adminRoutes); 
require('./jobs/scheduler');
// Servidor
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Servidor corriendo en el puerto ${PORT}`));
