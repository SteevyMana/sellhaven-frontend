import { useEffect, useState } from "react";
import { BsTrash, BsPencilSquare, BsPlus } from "react-icons/bs";
import StatCard from "../components/StatCard";
import api from "../api/client";
import { usePermission } from "../hooks/usePermission";

// ── Modal ────────────────────────────────────────────────────────
function RoleModal({ showModal, setShowModal, isEditing, fields, setFields, onSave, saving, allPermissions }) {

  if (!showModal) return null;

  // Agrupar permisos por módulo para la matriz de checkboxes
  const permissionsByModule = allPermissions.reduce((acc, p) => {
    (acc[p.module] = acc[p.module] || []).push(p);
    return acc;
  }, {});

  const togglePermission = (id) => {
    setFields((f) => ({
      ...f,
      permission_ids: f.permission_ids.includes(id)
        ? f.permission_ids.filter((pid) => pid !== id)
        : [...f.permission_ids, id]
    }));
  };

  const toggleModule = (modulePermissions, allSelected) => {
    const ids = modulePermissions.map((p) => p.id);
    setFields((f) => ({
      ...f,
      permission_ids: allSelected
        ? f.permission_ids.filter((pid) => !ids.includes(pid))
        : [...new Set([...f.permission_ids, ...ids])]
    }));
  };

  return (
    <div className="modal d-block" tabIndex="-1" style={{ background: "rgba(0,0,0,0.5)" }}>
      <div className="modal-dialog modal-lg">
        <div className="modal-content" style={{ borderRadius: "16px", border: "none" }}>

          <div className="modal-header" style={{ borderBottom: "1px solid #f1f5f9" }}>
            <h5 className="modal-title" style={{ fontWeight: "600" }}>
              {isEditing ? "Edit Role" : "Add Role"}
            </h5>
            <button className="btn-close" onClick={() => setShowModal(false)} />
          </div>

          <div className="modal-body">

            <div className="row">

              <div className="col-md-6 mb-3">
                <label className="form-label" style={{ fontWeight: "500", fontSize: "14px" }}>
                  Role Name
                </label>
                <input
                  type="text"
                  className="form-control"
                  style={{ borderRadius: "10px" }}
                  placeholder="e.g. Manager"
                  value={fields.name}
                  onChange={(e) => setFields({ ...fields, name: e.target.value })}
                />
              </div>

              <div className="col-md-6 mb-3">
                <label className="form-label" style={{ fontWeight: "500", fontSize: "14px" }}>
                  Description
                </label>
                <input
                  type="text"
                  className="form-control"
                  style={{ borderRadius: "10px" }}
                  placeholder="Short summary of this role"
                  value={fields.description}
                  onChange={(e) => setFields({ ...fields, description: e.target.value })}
                />
              </div>

            </div>

            <label className="form-label" style={{ fontWeight: "500", fontSize: "14px" }}>
              Permissions ({fields.permission_ids.length} selected)
            </label>

            <div style={{
              border: "1px solid #e2e8f0", borderRadius: "12px",
              maxHeight: "320px", overflowY: "auto", padding: "6px"
            }}>

              {Object.entries(permissionsByModule).map(([module, perms]) => {
                const allSelected = perms.every((p) => fields.permission_ids.includes(p.id));

                return (
                  <div key={module} style={{ padding: "10px 12px", borderBottom: "1px solid #f1f5f9" }}>

                    <div className="d-flex align-items-center justify-content-between mb-2">
                      <span style={{ fontWeight: "600", fontSize: "13px", color: "#1e293b" }}>
                        {module}
                      </span>
                      <label style={{ fontSize: "12px", color: "#2563eb", cursor: "pointer", userSelect: "none" }}>
                        <input
                          type="checkbox"
                          checked={allSelected}
                          onChange={() => toggleModule(perms, allSelected)}
                          style={{ marginRight: "5px" }}
                        />
                        Select all
                      </label>
                    </div>

                    <div className="d-flex flex-wrap gap-2">
                      {perms.map((p) => (
                        <label
                          key={p.id}
                          title={p.description}
                          style={{
                            display: "flex", alignItems: "center", gap: "6px",
                            background: fields.permission_ids.includes(p.id) ? "#e8f0fe" : "#f8fafc",
                            color: fields.permission_ids.includes(p.id) ? "#1d4ed8" : "#475569",
                            padding: "5px 10px", borderRadius: "8px", fontSize: "12px",
                            cursor: "pointer", userSelect: "none"
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={fields.permission_ids.includes(p.id)}
                            onChange={() => togglePermission(p.id)}
                          />
                          {p.name}
                        </label>
                      ))}
                    </div>

                  </div>
                );
              })}

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
              {saving ? "Saving..." : "Save Role"}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}

// ── Página principal ─────────────────────────────────────────────
function Roles() {

  const canManage = usePermission("roles.manage");

  const [rolesList, setRolesList]         = useState([]);
  const [allPermissions, setAllPermissions] = useState([]);
  const [loading, setLoading]             = useState(true);
  const [loadError, setLoadError]          = useState("");
  const [saving, setSaving]               = useState(false);

  const [search, setSearch]           = useState("");
  const [showModal, setShowModal]     = useState(false);
  const [editRoleId, setEditRoleId]   = useState(null);
  const [fields, setFields] = useState({ name: "", description: "", permission_ids: [] });

  // ── Cargar desde la API ──
  const fetchAll = () => {
    Promise.all([api.get("/roles"), api.get("/permissions")])
      .then(([rolesRes, permsRes]) => {
        setRolesList(rolesRes.data);
        setAllPermissions(permsRes.data);
        setLoadError("");
      })
      .catch(() => setLoadError("Could not load roles. Is the backend running?"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchAll();
  }, []);

  // ── Stats ──
  const totalUsersAssigned = rolesList.reduce((t, r) => t + (r.users_count || 0), 0);
  const fullAccessRoles    = rolesList.filter((r) => r.permissions.length === allPermissions.length && allPermissions.length > 0).length;

  // ── Filtrado ──
  const filteredRoles = rolesList.filter((r) =>
    r.name.toLowerCase().includes(search.toLowerCase()) ||
    (r.description || "").toLowerCase().includes(search.toLowerCase())
  );

  // ── Abrir modal nuevo ──
  const openNewRole = () => {
    setEditRoleId(null);
    setFields({ name: "", description: "", permission_ids: [] });
    setShowModal(true);
  };

  // ── Abrir modal editar ──
  const editRole = (role) => {
    setEditRoleId(role.id);
    setFields({
      name: role.name,
      description: role.description || "",
      permission_ids: role.permissions.map((p) => p.id)
    });
    setShowModal(true);
  };

  // ── Guardar ──
  const saveRole = () => {
    if (!fields.name) {
      alert("Role name is required");
      return;
    }

    setSaving(true);

    const request = editRoleId
      ? api.put(`/roles/${editRoleId}`, fields)
      : api.post("/roles", fields);

    request
      .then(() => {
        setShowModal(false);
        fetchAll();
      })
      .catch((err) => {
        alert(err.response?.data?.message || "Could not save role.");
      })
      .finally(() => setSaving(false));
  };

  // ── Eliminar ──
  const deleteRole = (id) => {
    if (!window.confirm("Are you sure you want to delete this role?")) return;

    api.delete(`/roles/${id}`)
      .then(() => fetchAll())
      .catch((err) => alert(err.response?.data?.message || "Could not delete role."));
  };

  return (
    <div>

      {/* Fila 1: Título + Search + Botón */}
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">

        <div>
          <h1>Roles</h1>
          <p style={{ color: "#64748b", margin: 0 }}>Group permissions into reusable roles</p>
        </div>

        <div className="d-flex flex-wrap gap-2">

          <input
            type="text"
            placeholder="Search role..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              padding: "10px 14px", borderRadius: "10px", border: "1px solid #cbd5e1",
              outline: "none", minWidth: "180px", flex: 1
            }}
          />

          {canManage && (
            <button
              onClick={openNewRole}
              style={{
                background: "#dbeafe", color: "#1d4ed8", border: "none",
                padding: "10px 18px", borderRadius: "10px", fontWeight: "600",
                cursor: "pointer", display: "flex", alignItems: "center", gap: "6px", whiteSpace: "nowrap"
              }}
            >
              <BsPlus size={18} /> Add Role
            </button>
          )}

        </div>

      </div>

      {/* Fila 2: StatCards */}
      <div className="row mb-4">

        <div className="col-6 col-lg-3 mb-3">
          <StatCard title="Total Roles" value={rolesList.length} color="#0f172a" />
        </div>

        <div className="col-6 col-lg-3 mb-3">
          <StatCard title="Users Assigned" value={totalUsersAssigned} color="#2563eb" />
        </div>

        <div className="col-6 col-lg-3 mb-3">
          <StatCard title="Full Access Roles" value={fullAccessRoles} color="#dc2626" />
        </div>

        <div className="col-6 col-lg-3 mb-3">
          <StatCard title="Total Permissions" value={allPermissions.length} color="#16a34a" />
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
              {["ID", "Name", "Description", "Permissions", "Users", "Actions"].map((h) => (
                <th key={h} style={thStyle}>{h}</th>
              ))}
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td colSpan="6" className="text-center py-4 text-muted">Loading...</td>
              </tr>
            ) : filteredRoles.length > 0 ? (
              filteredRoles.map((r) => (
                <tr key={r.id} style={{ borderBottom: "1px solid #f1f5f9" }}>

                  <td style={tdStyle}>
                    <span style={{ color: "#94a3b8", fontWeight: "500" }}>#{r.id}</span>
                  </td>

                  <td style={{ ...tdStyle, fontWeight: "500", color: "#0f172a" }}>
                    {r.name}
                  </td>

                  <td style={{ ...tdStyle, color: "#475569" }}>
                    {r.description}
                  </td>

                  <td style={tdStyle}>
                    <span style={{
                      background: "#f1f5f9", color: "#475569", padding: "3px 10px",
                      borderRadius: "20px", fontSize: "12px", fontWeight: "500"
                    }}>
                      {r.permissions.length} / {allPermissions.length}
                    </span>
                  </td>

                  <td style={tdStyle}>
                    <span style={{
                      display: "inline-block", padding: "4px 10px", borderRadius: "20px",
                      fontSize: "12px", fontWeight: "600",
                      background: r.users_count > 0 ? "#d1f5d3" : "#f1f5f9",
                      color:      r.users_count > 0 ? "#1a6b2a" : "#94a3b8"
                    }}>
                      {r.users_count}
                    </span>
                  </td>

                  <td style={tdStyle}>
                    {canManage ? (
                      <div style={{ display: "flex", gap: "8px" }}>

                        <button
                          onClick={() => editRole(r)}
                          style={{ background: "#dbeafe", color: "#1d4ed8", border: "none", borderRadius: "8px", padding: "6px 10px", cursor: "pointer", display: "flex", alignItems: "center" }}
                        >
                          <BsPencilSquare />
                        </button>

                        <button
                          onClick={() => deleteRole(r.id)}
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
                <td colSpan="6" className="text-center py-4 text-muted">
                  No roles found.
                </td>
              </tr>
            )}
          </tbody>

        </table>
      </div>

      {/* Modal */}
      <RoleModal
        showModal={showModal}
        setShowModal={setShowModal}
        isEditing={!!editRoleId}
        fields={fields}
        setFields={setFields}
        onSave={saveRole}
        saving={saving}
        allPermissions={allPermissions}
      />

    </div>
  );
}

const thStyle = {
  textAlign: "left", padding: "15px", color: "#94a3b8", fontWeight: "600",
  fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.5px"
};

const tdStyle = { padding: "15px" };

export default Roles;