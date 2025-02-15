import React, { useState, useEffect } from "react";
import axiosInstance from "../services/axiosInstance";
import "./ProviderManagement.css"; // Estilos mejorados
import { data } from "react-router-dom";

const ProviderManagement = () => {
  const [providers, setProviders] = useState([]);
  const [filteredProviders, setFilteredProviders] = useState([]);
  const [search, setSearch] = useState("");
  const [csvFile, setCsvFile] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [form, setForm] = useState({ name: "", contact: "", phone: "", email: "" });
  const [errors, setErrors] = useState({});
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);

  useEffect(() => {
    fetchProviders();
  }, [search, currentPage]);

  const fetchProviders = async () => {
    try {
      const params = search ? { search } : { limit: 10, page: currentPage };
      const response = await axiosInstance.get("/providers", { params });
      console.log(response)
      setProviders(response.data.providers);
      setFilteredProviders(response.data.providers);
      setTotalPages(response.data.totalPages);
    } catch (error) {
      console.error("Error al obtener proveedores:", error);
      setProviders([]);
    }
  };

  const handleDeleteClick = (provider) => {
    setConfirmDelete({ id: provider._id, name: provider.name });
  };

  const validateForm = () => {
    let errors = {};
    let isValid = true;
  
    if (!form.name.trim()) {
      errors.name = "El nombre del proveedor es obligatorio";
      isValid = false;
    }
  
    if (!form.contact.trim()) {
      errors.contact = "El nombre del contacto es obligatorio";
      isValid = false;
    }
  
    if (!form.phone.trim() || isNaN(form.phone)) {
      errors.phone = "El teléfono debe ser numérico";
      isValid = false;
    }
  
    if (!form.email.trim() || !/\S+@\S+\.\S+/.test(form.email)) {
      errors.email = "Debe ser un email válido";
      isValid = false;
    }
  
    setErrors(errors);
    return isValid;
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
  
    try {
      const providerData = {
        name: form.name,
        contactInfo: {
          contact: form.contact,
          phone: form.phone,
          email: form.email,
        },
      };
  
      if (editing) {
        await axiosInstance.put(`/providers/${selectedId}`, providerData);
        setIsEditModalOpen(false);
      } else {
        await axiosInstance.post("/providers", providerData);
        setIsCreateModalOpen(false);
      }
  
      setForm({ name: "", contact: "", phone: "", email: "" });
      setErrors({});
      setEditing(false);
      fetchProviders();
    } catch (error) {
      console.error("Error al guardar proveedor:", error);
  
      if (error.response?.data?.message === "El proveedor ya existe") {
        setErrors({ name: "Este proveedor ya está registrado" });
      } else {
        setErrors({ general: "Error al guardar el proveedor" });
      }
    }
  };

  const handleEdit = (provider) => {
    setForm(provider);
    setEditing(true);
    setSelectedId(provider._id);
    setIsEditModalOpen(true);
  };

  const handleDelete = async () => {
    try {
      await axiosInstance.delete(`/providers/${confirmDelete.id}`);
      setConfirmDelete(null);
      fetchProviders(); // Refrescar la lista después de eliminar
    } catch (error) {
      console.error("Error al eliminar proveedor:", error);
    }
  };

  const handleImport = async () => {
    if (!csvFile) {
      alert("Selecciona un archivo CSV");
      return;
    }

    const formData = new FormData();
    formData.append("file", csvFile);

    try {
      await axiosInstance.post("/providers/import", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      alert("Proveedores importados con éxito!");
      fetchProviders();
      setCsvFile(null);
    } catch (error) {
      console.error("Error al importar proveedores:", error);
      alert("Error al importar proveedores.");
    }
  };

  return (
    <div className="container-full">
      <h1>Gestión de Proveedores</h1>

      <div className="import-section">
        <input type="file" accept=".csv" onChange={(e) => setCsvFile(e.target.files[0])} />
        <button onClick={handleImport}>📥 Importar CSV</button>
      </div>

      <div className="search-section">
        <input
          type="text"
          placeholder="Buscar proveedor..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <button className="add-provider-btn" onClick={() => setIsCreateModalOpen(true)}>➕ Nuevo Proveedor</button>

      <table className="provider-table">
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Contacto</th>
            <th>Teléfono</th>
            <th>Email</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {filteredProviders.length > 0 ? (
            filteredProviders.map((provider) => (
              <tr key={provider._id}>
                <td>{provider.name}</td>
                <td>{provider.contactInfo?.contact || "No disponible"}</td>
                <td>{provider.contactInfo?.phone || "No disponible"}</td>
                <td>{provider.contactInfo?.email || "No disponible"}</td>
                <td>
                  <button className="edit-btn" onClick={() => handleEdit(provider)}>✏️ Editar</button>
                  <button className="delete-btn" onClick={() => handleDeleteClick(provider)}>🗑️ Eliminar</button>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="5" style={{ textAlign: "center", padding: "20px", fontStyle: "italic" }}>
                No se encontraron proveedores.
              </td>
            </tr>
          )}
        </tbody>
      </table>

      <div className="pagination">
        <button onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))} disabled={currentPage === 1}>
          Anterior
        </button>
        <span>Página {currentPage} de {totalPages}</span>
        <button onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages}>
          Siguiente
        </button>
      </div>

      {(isCreateModalOpen || isEditModalOpen) && (
        <div className="modal-overlay">
          <div className="modal-content">
            <button className="modal-close" onClick={() => { setIsCreateModalOpen(false); setIsEditModalOpen(false); }}>✖</button>
            <h2>{editing ? "Editar Proveedor" : "Nuevo Proveedor"}</h2>
            <form onSubmit={handleSubmit}>
              <input
                type="text"
                name="name"
                placeholder="Nombre del Proveedor"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
              {errors.name && <p className="error-text">{errors.name}</p>}

              <input
                type="text"
                name="contact"
                placeholder="Nombre del Contacto"
                value={form.contact}
                onChange={(e) => setForm({ ...form, contact: e.target.value })}
              />
              {errors.contact && <p className="error-text">{errors.contact}</p>}

              <input
                type="text"
                name="phone"
                placeholder="Teléfono"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
              {errors.phone && <p className="error-text">{errors.phone}</p>}

              <input
                type="email"
                name="email"
                placeholder="Correo Electrónico"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
              {errors.email && <p className="error-text">{errors.email}</p>}

              <div className="modal-buttons">
                <button type="submit" className="confirm-btn">{editing ? "Guardar Cambios" : "Crear Proveedor"}</button>
                <button type="button" className="cancel-btn" onClick={() => { setIsCreateModalOpen(false); setIsEditModalOpen(false); }}>Cancelar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {confirmDelete && (
        <div className="modal-overlay">
          <div className="modal-content">
            <button className="modal-close" onClick={() => setConfirmDelete(null)}>✖</button>
            <h2>¿Eliminar el proveedor <strong>{confirmDelete.name}</strong>?</h2>
            <p>Esta acción no se puede deshacer.</p>
            <div className="modal-buttons">
              <button className="confirm-btn" onClick={handleDelete}>Eliminar</button>
              <button className="cancel-btn" onClick={() => setConfirmDelete(null)}>Cancelar</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default ProviderManagement;
