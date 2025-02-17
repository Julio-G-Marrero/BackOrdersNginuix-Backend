const jwt = require("jsonwebtoken");
const User = require("../models/User");

exports.protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
    try {
      // Extraer el token del encabezado
      token = req.headers.authorization.split(" ")[1];

      // Verificar el token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Buscar el usuario en la base de datos y adjuntarlo a `req.user`
      req.user = await User.findById(decoded.id).select("-password");

      if (!req.user) {
        return res.status(401).json({ message: "Usuario no encontrado" });
      }

      // 🚀 **Permitir acceso sin verificación adicional si el usuario es admin**
      if (req.user.role === "admin") {
        return next(); // Admin pasa directamente sin más validaciones
      }

      next();
    } catch (error) {
      console.error("Error en la verificación del token:", error);
      return res.status(401).json({ message: "Token inválido o expirado" });
    }
  } else {
    return res.status(401).json({ message: "No autorizado, falta token" });
  }
};

exports.authenticateUser = async (req, res, next) => {
  try {
    const token = req.header("Authorization")?.replace("Bearer ", "");
    if (!token) {
      return res.status(401).json({ message: "No autorizado, token no presente" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id); // ⚠️ Aquí se usaba `decoded._id`, debe ser `decoded.id`

    if (!user) {
      return res.status(401).json({ message: "No autorizado, usuario no encontrado" });
    }

    // 🚀 **Permitir acceso directo a admin sin más validaciones**
    if (user.role === "admin") {
      req.user = user;
      return next();
    }

    // ✅ Bloquear usuarios restringidos en cualquier endpoint protegido
    if (user.status === "restricted") {
      return res.status(403).json({ message: "Tu acceso ha sido restringido. Contacta al administrador." });
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ message: "Token inválido o expirado" });
  }
};

// Middleware para verificar roles
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ message: "No tienes permisos para acceder a esta ruta" });
    }
    next();
  };
};
