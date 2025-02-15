const User = require('../models/User');

exports.getPendingUsers = async (req, res) => {
    try {
        const users = await User.find({ status: 'pending_approval' }).select('-password');
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener usuarios pendientes' });
    }
};

exports.getUsers = async (req, res) => {
  try {
    const { search, page = 1, limit = 15, status } = req.query;
    const query = {};

    if (search) {
      query.$or = [{ name: new RegExp(search, "i") }, { email: new RegExp(search, "i") }];
    }
    if (status) {
      query.status = status;
    }

    const users = await User.find(query)
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const totalUsers = await User.countDocuments(query);
    const totalPages = Math.ceil(totalUsers / limit);

    res.json({
      users: users.map(user => ({
        ...user._doc,
        role: user.role || "sin definir",
      })),
      totalPages,
    });
  } catch (error) {
    console.error("Error al obtener usuarios:", error);
    res.status(500).json({ message: "Error al obtener usuarios" });
  }
};

exports.restrictUserAccess = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { status: "restricted" },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    res.json({ message: "Acceso restringido correctamente", user });
  } catch (error) {
    res.status(500).json({ message: "Error al restringir acceso", error: error.message });
  }
};

exports.restoreUserAccess = async (req, res) => {
    try {
      const user = await User.findByIdAndUpdate(
        req.params.id,
        { status: "approved" }, // Se cambia el estado a "approved"
        { new: true }
      );
  
      if (!user) {
        return res.status(404).json({ message: "Usuario no encontrado" });
      }
  
      res.json({ message: "Acceso restaurado correctamente", user });
    } catch (error) {
      res.status(500).json({ message: "Error al restaurar acceso", error: error.message });
    }
  };
  
exports.updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, role } = req.body;

    const updatedUser = await User.findByIdAndUpdate(
      id,
      { name, email, role },
      { new: true, runValidators: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    res.json({ message: "Usuario actualizado correctamente", user: updatedUser });
  } catch (error) {
    console.error("Error al actualizar usuario:", error);
    res.status(500).json({ message: "Error al actualizar usuario" });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    const deletedUser = await User.findByIdAndDelete(id);

    if (!deletedUser) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    res.json({ message: "Usuario eliminado correctamente" });
  } catch (error) {
    console.error("Error al eliminar usuario:", error);
    res.status(500).json({ message: "Error al eliminar usuario" });
  }
};

exports.approveUser = async (req, res) => {
    try {
        const { id } = req.params;
        const { role } = req.body;

        const user = await User.findById(id);
        if (!user) return res.status(404).json({ message: 'Usuario no encontrado' });

        user.status = 'approved';
        user.role = role;
        await user.save();

        res.json({ message: 'Usuario aprobado correctamente', user });
    } catch (error) {
        res.status(500).json({ message: 'Error al aprobar usuario' });
    }
};

exports.rejectUser = async (req, res) => {
    try {
        const { id } = req.params;
        const user = await User.findById(id);
        if (!user) return res.status(404).json({ message: 'Usuario no encontrado' });

        user.status = 'rejected';
        await user.save();

        res.json({ message: 'Usuario rechazado correctamente' });
    } catch (error) {
        res.status(500).json({ message: 'Error al rechazar usuario' });
    }
};

exports.updateUserRole = async (req, res) => {
    try {
        const { id } = req.params;
        const { role } = req.body;

        if (!['admin', 'gerente', 'vendedor'].includes(role)) {
            return res.status(400).json({ message: 'Rol inválido' });
        }

        const user = await User.findById(id);
        if (!user) return res.status(404).json({ message: 'Usuario no encontrado' });

        user.role = role;
        await user.save();

        res.json({ message: 'Rol actualizado correctamente', user });
    } catch (error) {
        res.status(500).json({ message: 'Error al actualizar rol' });
    }
};
