const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

const generateToken = (user) => {
  return jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET,
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


exports.authenticateUser = (req, res, next) => {
  try {
    const token = req.header("Authorization")?.replace("Bearer ", "");
    if (!token) {
      return res.status(401).json({ message: "No autorizado, token no presente" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;

    // ✅ Bloquear usuarios restringidos en cualquier endpoint protegido
    if (req.user.status === "restricted") {
      return res.status(403).json({ message: "Tu acceso ha sido restringido. Contacta al administrador." });
    }

    next();
  } catch (error) {
    res.status(401).json({ message: "Token inválido o expirado" });
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