import { useEffect, useState } from "react";
import { BsTrash, BsPencilSquare, BsPlus } from "react-icons/bs";
import StatCard from "../components/StatCard";
import api from "../api/client";
import { MODULES, moduleColor } from "../data/security";
import { usePermission } from "../hooks/usePermission";

// ── Modal ────────────────────────────────────────────────────────
function PermissionModal({ showModal, setShowModal, isEditing, fields, setFields, onSave, saving }) {

  if (!showModal) return null;

  return (
    <div className="modal d-block" tabIndex="-1" style={{ background: "rgba(0,0,0,0.5)" }}>
      <div className="modal-dialog">
        <div className="modal-content" style={{ borderRadius: "16px", border: "none" }}>

          <div className="modal-header" style={{ borderBottom: "1px solid #f1f5f9" }}>
            <h5 className="modal-title" style={{ fontWeight: "600" }}>
              {isEditing ? "Edit Permission" : "Add Permission"}
            </h5>
            <button className="btn-close" onClick={() => setShowModal(false)} />
          </div>

          <div className="modal-body">

            <div className="mb-3">
              <label className="form-label" style={{ fontWeight: "500", fontSize: "14px" }}>
                Permission Key
              </label>
              <input
                type="text"
                className="form-control"
                style={{ borderRadius: "10px" }}
                placeholder="e.g. products.view"
                value={fields.name}
                onChange={(e) => setFields({ ...fields, name: e.target.value })}
              />
              <small className="text-muted">Convention: module.action (lowercase, dot-separated)</small>
            </div>

            <div className="mb-3">
              <label className="form-label" style={{ fontWeight: "500", fontSize: "14px" }}>
                Module
              </label>
              <select
                className="form-select"
                style={{ borderRadius: "10px" }}
                value={fields.module}
                onChange={(e) => setFields({ ...fields, module: e.target.value })}
              >
                <option value="">— Select a module —</option>
                {MODULES.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>

            <div className="mb-3">
              <label className="form-label" style={{ fontWeight: "500", fontSize: "14px" }}>
                Description
              </label>
              <textarea
                className="form-control"
                style={{ borderRadius: "10px" }}
                rows="3"
                placeholder="What does this permission allow?"
                value={fields.description}
                onChange={(e) => setFields({ ...fields, description: e.target.value })}
              />
            </div>

          </div>

          <div className="modal-footer" style={{ borderTop: "1px solid #f1f5f9" }}>
            <button className="btn btn-light" style={{ borderRadius: "10px" }} onClick={() => setShowModal(false)}>
              Cancel
            </button>
            <button
              onClick={onSave}
              disabled={saving}
              style={{
                background: saving ? "#bfdbfe" : "#dbeafe", color: "#1d4ed8", border: "none",
                padding: "8px 20px", borderRadius: "10px", fontWeight: "600",
                cursor: saving ? "default" : "pointer"
              }}
            >
              {saving ? "Saving..." : "Save Permission"}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}

// ── Página principal ─────────────────────────────────────────────
function Permissions() {

  const canManage = usePermission("settings.manage");

  const [permissionsList, setPermissionsList] = useState([]);
  const [loading, setLoading]                 = useState(true);
  const [loadError, setLoadError]              = useState("");
  const [saving, setSaving]                    = useState(false);

  const [search, setSearch]                    = useState("");
  const [showModal, setShowModal]               = useState(false);
  const [editPermissionId, setEditPermissionId] = useState(null);
  const [fields, setFields] = useState({ name: "", module: "", description: "" });

  // ── Cargar desde la API ──
  const fetchPermissions = () => {
    api.get("/permissions")
      .then(({ data }) => {
        setPermissionsList(data);
        setLoadError("");
      })
      .catch(() => setLoadError("Could not load permissions. Is the backend running?"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchPermissions();
  }, []);

  // ── Stats ──
  const totalModules = new Set(permissionsList.map((p) => p.module)).size;
  const biggestModule = Object.entries(
    permissionsList.reduce((acc, p) => {
      acc[p.module] = (acc[p.module] || 0) + 1;
      return acc;
    }, {})
  ).sort((a, b) => b[1] - a[1])[0];

  // ── Filtrado ──
  const filteredPermissions = permissionsList.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.module.toLowerCase().includes(search.toLowerCase()) ||
    (p.description || "").toLowerCase().includes(search.toLowerCase())
  );

  // ── Abrir modal nuevo ──
  const openNewPermission = () => {
    setEditPermissionId(null);
    setFields({ name: "", module: "", description: "" });
    setShowModal(true);
  };

  // ── Abrir modal editar ──
  const editPermission = (permission) => {
    setEditPermissionId(permission.id);
    setFields({ name: permission.name, module: permission.module, description: permission.description || "" });
    setShowModal(true);
  };

  // ── Guardar ──
  const savePermission = () => {
    if (!fields.name || !fields.module) {
      alert("Permission key and module are required");
      return;
    }

    setSaving(true);

    const request = editPermissionId
      ? api.put(`/permissions/${editPermissionId}`, fields)
      : api.post("/permissions", fields);

    request
      .then(() => {
        setShowModal(false);
        fetchPermissions();
      })
      .catch((err) => {
        alert(err.response?.data?.message || "Could not save permission.");
      })
      .finally(() => setSaving(false));
  };

  // ── Eliminar ──
  const deletePermission = (id) => {
    if (!window.confirm("Are you sure you want to delete this permission? Roles using it will lose this access.")) return;

    api.delete(`/permissions/${id}`)
      .then(() => fetchPermissions())
      .catch((err) => alert(err.response?.data?.message || "Could not delete permission."));
  };

  return (
    <div>

      {/* Fila 1: Título + Search + Botón */}
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">

        <div>
          <h1>Permissions</h1>
          <p style={{ color: "#64748b", margin: 0 }}>Define the granular actions available in the system</p>
        </div>

        <div className="d-flex flex-wrap gap-2">

          <input
            type="text"
            placeholder="Search permission..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              padding: "10px 14px", borderRadius: "10px", border: "1px solid #cbd5e1",
              outline: "none", minWidth: "180px", flex: 1
            }}
          />

          {canManage && (
            <button
              onClick={openNewPermission}
              style={{
                background: "#dbeafe", color: "#1d4ed8", border: "none",
                padding: "10px 18px", borderRadius: "10px", fontWeight: "600",
                cursor: "pointer", display: "flex", alignItems: "center", gap: "6px", whiteSpace: "nowrap"
              }}
            >
              <BsPlus size={18} /> Add Permission
            </button>
          )}

        </div>

      </div>

      {/* Fila 2: StatCards */}
      <div className="row mb-4">

        <div className="col-6 col-lg-4 mb-3">
          <StatCard title="Total Permissions" value={permissionsList.length} color="#0f172a" />
        </div>

        <div className="col-6 col-lg-4 mb-3">
          <StatCard title="Modules Covered" value={totalModules} color="#2563eb" />
        </div>

        <div className="col-6 col-lg-4 mb-3">
          <StatCard title="Largest Module" value={biggestModule ? `${biggestModule[0]} (${biggestModule[1]})` : "—"} color="#16a34a" />
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
              {["ID", "Key", "Module", "Description", "Actions"].map((h) => (
                <th key={h} style={thStyle}>{h}</th>
              ))}
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td colSpan="5" className="text-center py-4 text-muted">Loading...</td>
              </tr>
            ) : filteredPermissions.length > 0 ? (
              filteredPermissions.map((p) => (
                <tr key={p.id} style={{ borderBottom: "1px solid #f1f5f9" }}>

                  <td style={tdStyle}>
                    <span style={{ color: "#94a3b8", fontWeight: "500" }}>#{p.id}</span>
                  </td>

                  <td style={{ ...tdStyle, fontWeight: "500", color: "#0f172a" }}>
                    <code style={{ background: "#f8fafc", padding: "2px 6px", borderRadius: "6px", fontSize: "13px" }}>
                      {p.name}
                    </code>
                  </td>

                  <td style={tdStyle}>
                    <span style={{
                      background: moduleColor(p.module) + "1a",
                      color: moduleColor(p.module),
                      padding: "3px 10px", borderRadius: "20px", fontSize: "12px", fontWeight: "600"
                    }}>
                      {p.module}
                    </span>
                  </td>

                  <td style={{ ...tdStyle, color: "#475569" }}>
                    {p.description}
                  </td>

                  <td style={tdStyle}>
                    {canManage ? (
                      <div style={{ display: "flex", gap: "8px" }}>

                        <button
                          onClick={() => editPermission(p)}
                          style={{ background: "#dbeafe", color: "#1d4ed8", border: "none", borderRadius: "8px", padding: "6px 10px", cursor: "pointer", display: "flex", alignItems: "center" }}
                        >
                          <BsPencilSquare />
                        </button>

                        <button
                          onClick={() => deletePermission(p.id)}
                          style={{ background: "#fee2e2", color: "#b91c1c", border: "none", borderRadius: "8px", padding: "6px 10px", cursor: "pointer", display: "flex", alignItems: "center" }}
                        >
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
                <td colSpan="5" className="text-center py-4 text-muted">
                  No permissions found.
                </td>
              </tr>
            )}
          </tbody>

        </table>
      </div>

      {/* Modal */}
      <PermissionModal
        showModal={showModal}
        setShowModal={setShowModal}
        isEditing={!!editPermissionId}
        fields={fields}
        setFields={setFields}
        onSave={savePermission}
        saving={saving}
      />

    </div>
  );
}

const thStyle = {
  textAlign: "left", padding: "15px", color: "#94a3b8", fontWeight: "600",
  fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.5px"
};

const tdStyle = { padding: "15px" };

export default Permissions;