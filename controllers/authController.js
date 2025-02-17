const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

const generateToken = (user) => {
  return jwt.sign(
    { id: user._id, role: user.role },
    // "supersecreto123",
    "supersecreto123",
    { expiresIn: "7d" } // Token válido por 7 días
  );
};


// Registro de usuarios

exports.register = async (req, res) => {
  const { name, email, password, role } = req.body;

  try {
    // 📌 Verificar si el usuario ya existe
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: "El usuario ya está registrado" });
    }

    // 📌 Generar hash de la contraseña antes de guardar
    const salt = await bcrypt.genSalt(10); // Generar un salt con factor 10
    const hashedPassword = await bcrypt.hash(password, salt);

    // 📌 Crear usuario con la contraseña hasheada
    const user = await User.create({
      name,
      email,
      password: hashedPassword, // Se guarda el hash, no la contraseña en texto plano
      role: role || "sin definir", // Si no se envía el rol, asignar "sin definir"
    });

    res.status(201).json({ message: "Usuario registrado con éxito", user });
  } catch (error) {
    console.error("Error en el registro:", error);
    res.status(500).json({ message: "Error interno del servidor" });
  }
};

exports.login = async (req, res) => {
  const { email, password } = req.body;
  try {
    console.log("📩 Intento de login con email:", email); // Log del intento de login

    const user = await User.findOne({ email });
    console.log("🔎 Usuario encontrado:", user); // Log de usuario encontrado

    if (!user || !(await bcrypt.compare(password, user.password))) {
      console.log("❌ Credenciales inválidas para:", email);
      return res.status(401).json({ message: "Credenciales inválidas" });
    }

    // ✅ Verificar si el usuario está restringido y bloquear acceso
    if (user.status === "restricted") {
      console.log("🚫 Usuario restringido:", email);
      return res.status(403).json({ message: "Tu acceso ha sido restringido. Contacta al administrador." });
    }

    console.log("✅ Usuario autenticado:", email);

    res.status(200).json({
      token: generateToken(user),
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status, // ✅ Incluir estado en la respuesta
      },
    });
  } catch (error) {
    console.error("❌ Error en /auth/login:", error); // Log detallado del error
    res.status(500).json({ message: "Error en el servidor", error: error.message });
  }
};

exports.authenticateUser = async (req, res, next) => {
  try {
    const token = req.header("Authorization")?.replace("Bearer ", "");
    if (!token) {
      console.log("🚫 No se recibió un token en la solicitud.");
      return res.status(401).json({ message: "No autorizado, token no presente" });
    }

    console.log("📩 Token recibido:", token);

    if (!"supersecreto123") {
      console.error("❌ Error: JWT_SECRET no está definido en el entorno.");
      return res.status(500).json({ message: "Error interno del servidor: JWT_SECRET no está configurado" });
    }

    const decoded = jwt.verify(token, 'supersecreto123');
    console.log("✅ Token decodificado correctamente:", decoded);

    req.user = await User.findById(decoded.id).select("-password");

    if (!req.user) {
      console.log("🚫 Usuario no encontrado en la base de datos.");
      return res.status(401).json({ message: "No autorizado, usuario no encontrado" });
    }

    // 🚀 Permitir que los admins accedan sin validación extra
    if (req.user.role === "admin") {
      console.log("🚀 Usuario admin autenticado correctamente.");
      return next();
    }

    // 🚫 Bloquear usuarios restringidos
    if (req.user.status === "restricted") {
      console.log("🚫 Usuario restringido:", req.user.email);
      return res.status(403).json({ message: "Tu acceso ha sido restringido. Contacta al administrador." });
    }

    next();
  } catch (error) {
    console.error("❌ Error en la verificación del token:", error.message);
    return res.status(401).json({ message: "Token inválido o expirado" });
  }
};


// Perfil del usuario autenticado
exports.profile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.status(200).json(user);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.forgotPassword = async (req, res) => {
  try {
      const { email } = req.body;
      const user = await User.findOne({ email });

      if (!user) return res.status(404).json({ message: 'Usuario no encontrado' });

      const resetToken = crypto.randomBytes(32).toString('hex');
      user.resetToken = resetToken;
      user.resetTokenExpires = Date.now() + 3600000; // Expira en 1 hora
      await user.save();

      const resetURL = `https://tu-dominio.com/reset-password?token=${resetToken}`;
      await sendEmail(user.email, 'Restablecer contraseña', `Haz clic en el siguiente enlace para restablecer tu contraseña: ${resetURL}`);

      res.json({ message: 'Correo de recuperación enviado' });
  } catch (error) {
      res.status(500).json({ message: 'Error al generar enlace de recuperación' });
  }
};

exports.resetPassword = async (req, res) => {
  try {
      const { token, password } = req.body;
      const user = await User.findOne({ resetToken: token, resetTokenExpires: { $gt: Date.now() } });

      if (!user) return res.status(400).json({ message: 'Token inválido o expirado' });

      user.password = await bcrypt.hash(password, 10);
      user.resetToken = null;
      user.resetTokenExpires = null;
      await user.save();

      res.json({ message: 'Contraseña restablecida exitosamente' });
  } catch (error) {
      res.status(500).json({ message: 'Error al restablecer la contraseña' });
  }
};