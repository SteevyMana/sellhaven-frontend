import { useEffect, useState } from "react";
import StatCard from "../components/StatCard";
import { BsPlus, BsPencilSquare, BsTrash } from "react-icons/bs";
import { usePermission } from "../hooks/usePermission";
import api from "../api/client";

const CATEGORIES = ["Electrónica", "Ropa", "Deportes", "Hogar", "Alimentos", "Otros"];

const STATUS_STYLES = {
  Active: { background: "#dcfce7", color: "#166534" },
  Inactive: { background: "#fee2e2", color: "#991b1b" },
};

// ── Badge de estado ──────────────────────────────────────────────
function StatusBadge({ status }) {
  const style = STATUS_STYLES[status] || {};
  return (
    <span style={{
      display: "inline-block",
      padding: "4px 12px",
      borderRadius: "20px",
      fontSize: "12px",
      fontWeight: "600",
      ...style
    }}>
      {status}
    </span>
  );
}

// ── Modal ────────────────────────────────────────────────────────
function SupplierModal({ showModal, setShowModal, isEditing, fields, setFields, onSave, saving }) {

  if (!showModal) return null;

  return (
    <div className="modal d-block" tabIndex="-1" style={{ background: "rgba(0,0,0,0.5)" }}>
      <div className="modal-dialog modal-lg">
        <div className="modal-content" style={{ borderRadius: "16px", border: "none" }}>

          <div className="modal-header" style={{ borderBottom: "1px solid #f1f5f9" }}>
            <h5 className="modal-title" style={{ fontWeight: "600" }}>
              {isEditing ? "Edit Supplier" : "New Supplier"}
            </h5>
            <button className="btn-close" onClick={() => setShowModal(false)} />
          </div>

          <div className="modal-body">

            <p style={{ fontSize: "12px", fontWeight: "600", color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "12px" }}>
              Company Information
            </p>

            <div className="row">

              <div className="col-md-6 mb-3">
                <label className="form-label" style={{ fontWeight: "500", fontSize: "14px" }}>Company Name</label>
                <input type="text" className="form-control" style={{ borderRadius: "10px" }}
                  placeholder="e.g. TechDistrib S.A."
                  value={fields.name}
                  onChange={(e) => setFields({ ...fields, name: e.target.value })}
                />
              </div>

              <div className="col-md-6 mb-3">
                <label className="form-label" style={{ fontWeight: "500", fontSize: "14px" }}>Category</label>
                <select className="form-select" style={{ borderRadius: "10px" }}
                  value={fields.category}
                  onChange={(e) => setFields({ ...fields, category: e.target.value })}
                >
                  <option value="">— Select category —</option>
                  {["Electrónica", "Ropa", "Deportes", "Hogar", "Alimentos", "Otros"].map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div className="col-md-6 mb-3">
                <label className="form-label" style={{ fontWeight: "500", fontSize: "14px" }}>City</label>
                <input type="text" className="form-control" style={{ borderRadius: "10px" }}
                  placeholder="e.g. Santiago"
                  value={fields.city}
                  onChange={(e) => setFields({ ...fields, city: e.target.value })}
                />
              </div>

              <div className="col-md-6 mb-3">
                <label className="form-label" style={{ fontWeight: "500", fontSize: "14px" }}>Status</label>
                <select className="form-select" style={{ borderRadius: "10px" }}
                  value={fields.status}
                  onChange={(e) => setFields({ ...fields, status: e.target.value })}
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
                <small className="text-muted">
                  Inactive suppliers won't show up when creating new purchases
                </small>
              </div>

            </div>

            <p style={{ fontSize: "12px", fontWeight: "600", color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.5px", margin: "8px 0 12px" }}>
              Contact Information
            </p>

            <div className="row">

              <div className="col-md-4 mb-3">
                <label className="form-label" style={{ fontWeight: "500", fontSize: "14px" }}>Contact Person</label>
                <input type="text" className="form-control" style={{ borderRadius: "10px" }}
                  placeholder="e.g. Carlos Méndez"
                  value={fields.contact}
                  onChange={(e) => setFields({ ...fields, contact: e.target.value })}
                />
              </div>

              <div className="col-md-4 mb-3">
                <label className="form-label" style={{ fontWeight: "500", fontSize: "14px" }}>Email</label>
                <input type="email" className="form-control" style={{ borderRadius: "10px" }}
                  placeholder="e.g. contacto@empresa.com"
                  value={fields.email}
                  onChange={(e) => setFields({ ...fields, email: e.target.value })}
                />
              </div>

              <div className="col-md-4 mb-3">
                <label className="form-label" style={{ fontWeight: "500", fontSize: "14px" }}>Phone</label>
                <input type="text" className="form-control" style={{ borderRadius: "10px" }}
                  placeholder="e.g. 809-555-0000"
                  value={fields.phone}
                  onChange={(e) => setFields({ ...fields, phone: e.target.value })}
                />
              </div>

            </div>

          </div>

          <div className="modal-footer" style={{ borderTop: "1px solid #f1f5f9" }}>
            <button className="btn btn-light" style={{ borderRadius: "10px" }} onClick={() => setShowModal(false)}>
              Cancel
            </button>
            <button onClick={onSave} disabled={saving} style={{
              background: saving ? "#bfdbfe" : "#dbeafe", color: "#1d4ed8", border: "none",
              padding: "8px 20px", borderRadius: "10px", fontWeight: "600", cursor: saving ? "default" : "pointer"
            }}>
              {saving ? "Saving..." : "Save Supplier"}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}

// ── Página principal ─────────────────────────────────────────────
function Suppliers() {

  const [suppliersList, setSuppliersList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [saving, setSaving] = useState(false);

  const canManage = usePermission("suppliers.manage");
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");
  const [showModal, setShowModal] = useState(false);
  const [editSupplierId, setEditSupplierId] = useState(null);
  const [fields, setFields] = useState({
    name: "", contact: "", email: "", phone: "", city: "", category: "", status: "Active"
  });

  // ── Cargar desde la API ──
  const fetchAll = () => {
    api.get("/suppliers")
      .then((res) => {
        setSuppliersList(res.data);
        setLoadError("");
      })
      .catch(() => setLoadError("Could not load suppliers. Is the backend running?"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchAll();
  }, []);

  // ── Stats ──
  const totalActive = suppliersList.filter((s) => s.status === "Active").length;
  const totalInactive = suppliersList.filter((s) => s.status === "Inactive").length;
  const totalCategories = [...new Set(suppliersList.map((s) => s.category).filter(Boolean))].length;

  // ── Filtrado ──
  const filteredSuppliers = suppliersList.filter((s) => {
    const matchSearch =
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      (s.contact || "").toLowerCase().includes(search.toLowerCase()) ||
      (s.city || "").toLowerCase().includes(search.toLowerCase()) ||
      (s.category || "").toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === "All" || s.status === filterStatus;
    return matchSearch && matchStatus;
  });

  // ── Abrir modal nuevo ──
  const openNew = () => {
    setEditSupplierId(null);
    setFields({ name: "", contact: "", email: "", phone: "", city: "", category: "", status: "Active" });
    setShowModal(true);
  };

  // ── Abrir modal editar ──
  const editSupplier = (s) => {
    setEditSupplierId(s.id);
    setFields({
      name: s.name, contact: s.contact || "", email: s.email || "",
      phone: s.phone || "", city: s.city || "", category: s.category || "", status: s.status
    });
    setShowModal(true);
  };

  // ── Guardar ──
  const saveSupplier = () => {
    if (!fields.name) {
      alert("Company name is required");
      return;
    }

    setSaving(true);

    const payload = {
      name: fields.name,
      contact: fields.contact || null,
      email: fields.email || null,
      phone: fields.phone || null,
      city: fields.city || null,
      category: fields.category || null,
      status: fields.status
    };

    const request = editSupplierId
      ? api.put(`/suppliers/${editSupplierId}`, payload)
      : api.post("/suppliers", payload);

    request
      .then(() => {
        setShowModal(false);
        fetchAll();
      })
      .catch((err) => {
        const emailError = err.response?.data?.errors?.email?.[0];
        alert(emailError || err.response?.data?.message || "Could not save supplier.");
      })
      .finally(() => setSaving(false));
  };

  // ── Eliminar ──
  const deleteSupplier = (id) => {
    if (!window.confirm("Are you sure you want to delete this supplier?")) return;

    api.delete(`/suppliers/${id}`)
      .then(() => fetchAll())
      .catch((err) => alert(err.response?.data?.message || "Could not delete supplier."));
  };

  return (
    <div>

      {/* Fila 1: Título + Search + Filtro + Botón */}
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">

        <div>
          <h1>Suppliers</h1>
          <p style={{ color: "#64748b", margin: 0 }}>Manage your suppliers and vendors</p>
        </div>

        <div className="d-flex flex-wrap gap-2">

          <input type="text" placeholder="Search supplier..."
            value={search} onChange={(e) => setSearch(e.target.value)}
            style={{ padding: "10px 14px", borderRadius: "10px", border: "1px solid #cbd5e1", outline: "none", minWidth: "180px" }}
          />

          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}
            style={{ padding: "10px 14px", borderRadius: "10px", border: "1px solid #cbd5e1", outline: "none", background: "white", cursor: "pointer" }}
          >
            <option value="All">All Statuses</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>

          {canManage && (
            <button onClick={openNew} style={{
              background: "#fee2e2", color: "#b91c1c", border: "none",
              padding: "10px 18px", borderRadius: "10px", fontWeight: "600",
              cursor: "pointer", display: "flex", alignItems: "center", gap: "6px", whiteSpace: "nowrap"
            }}>
              <BsPlus size={18} /> New Return
            </button>
          )}

        </div>

      </div>

      {/* Fila 2: StatCards */}
      <div className="row mb-4">
        <div className="col-6 col-lg-3 mb-3">
          <StatCard title="Total Suppliers" value={suppliersList.length} color="#0f172a" />
        </div>
        <div className="col-6 col-lg-3 mb-3">
          <StatCard title="Active" value={totalActive} color="#16a34a" />
        </div>
        <div className="col-6 col-lg-3 mb-3">
          <StatCard title="Inactive" value={totalInactive} color="#dc2626" />
        </div>
        <div className="col-6 col-lg-3 mb-3">
          <StatCard title="Categories" value={totalCategories} color="#2563eb" />
        </div>
      </div>

      {loadError && (
        <div style={{ background: "#fee2e2", color: "#b91c1c", padding: "12px 16px", borderRadius: "10px", marginBottom: "16px" }}>
          {loadError}
        </div>
      )}

      {/* Tabla */}
      <div style={{ background: "white", borderRadius: "15px", padding: "20px", boxShadow: "0 2px 10px rgba(0,0,0,0.05)", overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>

          <thead>
            <tr style={{ borderBottom: "1px solid #e2e8f0" }}>
              {["ID", "Company", "Contact", "Email", "Phone", "City", "Category", "Status", "Actions"].map((h) => (
                <th key={h} style={thStyle}>{h}</th>
              ))}
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td colSpan="9" className="text-center py-4 text-muted">Loading...</td>
              </tr>
            ) : filteredSuppliers.length > 0 ? (
              filteredSuppliers.map((s) => (
                <tr key={s.id} style={{ borderBottom: "1px solid #f1f5f9" }}>

                  <td style={tdStyle}>
                    <span style={{ color: "#94a3b8", fontWeight: "500" }}>#{s.id}</span>
                  </td>

                  <td style={{ ...tdStyle, fontWeight: "600", color: "#0f172a" }}>
                    {s.name}
                  </td>

                  <td style={{ ...tdStyle, color: "#475569" }}>{s.contact || "—"}</td>

                  <td style={{ ...tdStyle, color: "#475569" }}>
                    {s.email ? (
                      <a href={`mailto:${s.email}`} style={{ color: "#2563eb", textDecoration: "none" }}>
                        {s.email}
                      </a>
                    ) : "—"}
                  </td>

                  <td style={{ ...tdStyle, color: "#475569" }}>{s.phone || "—"}</td>

                  <td style={{ ...tdStyle, color: "#475569" }}>{s.city || "—"}</td>

                  <td style={tdStyle}>
                    <span style={{ background: "#f1f5f9", color: "#475569", padding: "3px 10px", borderRadius: "20px", fontSize: "12px", fontWeight: "500" }}>
                      {s.category || "—"}
                    </span>
                  </td>

                  <td style={tdStyle}>
                    <StatusBadge status={s.status} />
                  </td>

                  <td style={tdStyle}>
                    {canManage ? (
                      <div style={{ display: "flex", gap: "8px" }}>
                        <button onClick={() => editReturn(r)} style={{ background: "#dbeafe", color: "#1d4ed8", border: "none", borderRadius: "8px", padding: "6px 10px", cursor: "pointer", display: "flex", alignItems: "center" }}>
                          <BsPencilSquare />
                        </button>
                        <button onClick={() => deleteReturn(r.id)} style={{ background: "#fee2e2", color: "#b91c1c", border: "none", borderRadius: "8px", padding: "6px 10px", cursor: "pointer", display: "flex", alignItems: "center" }}>
                          <BsTrash />
                        </button>
                      </div>
                    ) : (
                      <span style={{ color: "#cbd5e1", fontSize: "12px" }}>—</span>
                    )}
                  </td>

                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="9" className="text-center py-4 text-muted">No suppliers found.</td>
              </tr>
            )}
          </tbody>

        </table>
      </div>

      {/* Modal */}
      <SupplierModal
        showModal={showModal}
        setShowModal={setShowModal}
        isEditing={!!editSupplierId}
        fields={fields}
        setFields={setFields}
        onSave={saveSupplier}
        saving={saving}
      />

    </div>
  );
}

const thStyle = {
  textAlign: "left", padding: "15px",
  color: "#94a3b8", fontWeight: "600",
  fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.5px"
};
const tdStyle = { padding: "15px" };

export default Suppliers;