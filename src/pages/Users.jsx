import { useEffect, useState } from "react";
import { BsTrash, BsPencilSquare, BsPlus, BsShieldLock, BsLaptop, BsXCircle } from "react-icons/bs";
import StatCard from "../components/StatCard";
import api from "../api/client";
import { useAuth } from "../hooks/useAuth";
import { usePermission } from "../hooks/usePermission";

// ── Avatar con iniciales ─────────────────────────────────────────
const initials = (name = "") =>
  name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase();

// ── Lectura básica del user agent, solo para mostrar algo legible ──
function parseUserAgent(ua) {
  if (!ua) return "Unknown device";

  let os = "Unknown OS";
  if (ua.includes("Windows")) os = "Windows";
  else if (ua.includes("Mac OS")) os = "macOS";
  else if (ua.includes("Android")) os = "Android";
  else if (ua.includes("iPhone") || ua.includes("iPad")) os = "iOS";
  else if (ua.includes("Linux")) os = "Linux";

  let browser = "Unknown browser";
  if (ua.includes("Edg/")) browser = "Edge";
  else if (ua.includes("Chrome/")) browser = "Chrome";
  else if (ua.includes("Firefox/")) browser = "Firefox";
  else if (ua.includes("Safari/") && !ua.includes("Chrome")) browser = "Safari";

  return `${browser} on ${os}`;
}

// ── Modal de usuario (sin cambios) ────────────────────────────────
function UserModal({ showModal, setShowModal, isEditing, fields, setFields, onSave, saving, roles }) {

  if (!showModal) return null;

  return (
    <div className="modal d-block" tabIndex="-1" style={{ background: "rgba(0,0,0,0.5)" }}>
      <div className="modal-dialog">
        <div className="modal-content" style={{ borderRadius: "16px", border: "none" }}>

          <div className="modal-header" style={{ borderBottom: "1px solid #f1f5f9" }}>
            <h5 className="modal-title" style={{ fontWeight: "600" }}>
              {isEditing ? "Edit User" : "Add User"}
            </h5>
            <button className="btn-close" onClick={() => setShowModal(false)} />
          </div>

          <div className="modal-body">

            <div className="row">

              <div className="col-12 mb-3">
                <label className="form-label" style={{ fontWeight: "500", fontSize: "14px" }}>
                  Full Name
                </label>
                <input
                  type="text"
                  className="form-control"
                  style={{ borderRadius: "10px" }}
                  placeholder="e.g. Jane Manager"
                  value={fields.name}
                  onChange={(e) => setFields({ ...fields, name: e.target.value })}
                />
              </div>

              <div className="col-12 mb-3">
                <label className="form-label" style={{ fontWeight: "500", fontSize: "14px" }}>
                  Email
                </label>
                <input
                  type="email"
                  className="form-control"
                  style={{ borderRadius: "10px" }}
                  placeholder="name@example.com"
                  value={fields.email}
                  onChange={(e) => setFields({ ...fields, email: e.target.value })}
                />
              </div>

              <div className="col-12 mb-3">
                <label className="form-label" style={{ fontWeight: "500", fontSize: "14px" }}>
                  Password {isEditing && <span className="text-muted" style={{ fontWeight: 400 }}>(leave blank to keep current)</span>}
                </label>
                <input
                  type="password"
                  className="form-control"
                  style={{ borderRadius: "10px" }}
                  placeholder={isEditing ? "••••••••" : "Temporary password"}
                  value={fields.password}
                  onChange={(e) => setFields({ ...fields, password: e.target.value })}
                />
              </div>

              <div className="col-md-7 mb-3">
                <label className="form-label" style={{ fontWeight: "500", fontSize: "14px" }}>
                  Role
                </label>
                <select
                  className="form-select"
                  style={{ borderRadius: "10px" }}
                  value={fields.role_id}
                  onChange={(e) => setFields({ ...fields, role_id: e.target.value })}
                >
                  <option value="">— Select a role —</option>
                  {roles.map((r) => (
                    <option key={r.id} value={r.id}>{r.name}</option>
                  ))}
                </select>
              </div>

              <div className="col-md-5 mb-3">
                <label className="form-label" style={{ fontWeight: "500", fontSize: "14px" }}>
                  Status
                </label>
                <select
                  className="form-select"
                  style={{ borderRadius: "10px" }}
                  value={fields.status}
                  onChange={(e) => setFields({ ...fields, status: e.target.value })}
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>

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
              {saving ? "Saving..." : "Save User"}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}

// ── Modal de sesiones — nuevo ──────────────────────────────────────
function SessionsModal({ user, onClose }) {

  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [revokingId, setRevokingId] = useState(null);

  const fetchSessions = () => {
    setLoading(true);
    api.get(`/users/${user.id}/sessions`)
      .then(({ data }) => { setSessions(data); setLoadError(""); })
      .catch(() => setLoadError("Could not load sessions."))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (user) fetchSessions();
  }, [user]);

  if (!user) return null;

  const revokeOne = (tokenId) => {
    if (!window.confirm("Revoke this session? The device will be signed out immediately.")) return;
    setRevokingId(tokenId);
    api.delete(`/users/${user.id}/sessions/${tokenId}`)
      .then(() => fetchSessions())
      .catch((err) => alert(err.response?.data?.message || "Could not revoke session."))
      .finally(() => setRevokingId(null));
  };

  const revokeAll = () => {
    if (!window.confirm(`Revoke ALL sessions for ${user.name}? Every device will be signed out.`)) return;
    api.delete(`/users/${user.id}/sessions`)
      .then(() => fetchSessions())
      .catch((err) => alert(err.response?.data?.message || "Could not revoke sessions."));
  };

  return (
    <div className="modal d-block" tabIndex="-1" style={{ background: "rgba(0,0,0,0.5)" }}>
      <div className="modal-dialog modal-lg">
        <div className="modal-content" style={{ borderRadius: "16px", border: "none" }}>

          <div className="modal-header" style={{ borderBottom: "1px solid #f1f5f9" }}>
            <h5 className="modal-title" style={{ fontWeight: "600" }}>
              Active Sessions — {user.name}
            </h5>
            <button className="btn-close" onClick={onClose} />
          </div>

          <div className="modal-body">

            {loadError && (
              <div style={{ background: "#fee2e2", color: "#b91c1c", padding: "10px 14px", borderRadius: "10px", marginBottom: "14px", fontSize: "13px" }}>
                {loadError}
              </div>
            )}

            {loading ? (
              <p className="text-muted">Loading sessions...</p>
            ) : sessions.length === 0 ? (
              <p className="text-muted">No active sessions.</p>
            ) : (
              <>
                <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "12px" }}>
                  <button
                    onClick={revokeAll}
                    style={{
                      background: "#fee2e2", color: "#b91c1c", border: "none",
                      padding: "7px 14px", borderRadius: "8px", fontWeight: "600",
                      fontSize: "13px", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px"
                    }}
                  >
                    <BsXCircle /> Revoke All Sessions
                  </button>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  {sessions.map((s) => (
                    <div key={s.id} style={{
                      display: "flex", alignItems: "center", justifyContent: "space-between",
                      padding: "12px 16px", background: "#f8fafc", borderRadius: "12px"
                    }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "12px", minWidth: 0 }}>
                        <div style={{
                          width: "38px", height: "38px", borderRadius: "10px", background: "#e8f0fe",
                          color: "#1d4ed8", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0
                        }}>
                          <BsLaptop size={17} />
                        </div>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontWeight: "600", fontSize: "14px", color: "#0f172a" }}>
                            {parseUserAgent(s.user_agent)}
                          </div>
                          <div style={{ fontSize: "12px", color: "#64748b" }}>
                            {s.ip_address || "Unknown IP"} · Last active {s.last_used_at ? new Date(s.last_used_at).toLocaleString() : "never"}
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => revokeOne(s.id)}
                        disabled={revokingId === s.id}
                        style={{
                          background: "#fee2e2", color: "#b91c1c", border: "none",
                          padding: "6px 12px", borderRadius: "8px", fontWeight: "600",
                          fontSize: "12px", cursor: revokingId === s.id ? "default" : "pointer", flexShrink: 0
                        }}
                      >
                        {revokingId === s.id ? "..." : "Revoke"}
                      </button>
                    </div>
                  ))}
                </div>
              </>
            )}

          </div>

          <div className="modal-footer" style={{ borderTop: "1px solid #f1f5f9" }}>
            <button className="btn btn-light" style={{ borderRadius: "10px" }} onClick={onClose}>
              Close
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}

// ── Página principal ─────────────────────────────────────────────
function Users() {

  const { user: currentUser } = useAuth();
  const canManage = usePermission("users.manage");

  const [usersList, setUsersList] = useState([]);
  const [rolesList, setRolesList] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [loadError, setLoadError]  = useState("");
  const [saving, setSaving]       = useState(false);

  const [search, setSearch]         = useState("");
  const [showModal, setShowModal]   = useState(false);
  const [editUserId, setEditUserId] = useState(null);
  const [sessionsUser, setSessionsUser] = useState(null); // usuario cuyas sesiones se están viendo
  const [fields, setFields] = useState({
    name: "", email: "", password: "", role_id: "", status: "active"
  });

  // ── Cargar desde la API ──
  const fetchAll = () => {
    Promise.all([api.get("/users"), api.get("/roles")])
      .then(([usersRes, rolesRes]) => {
        setUsersList(usersRes.data);
        setRolesList(rolesRes.data);
        setLoadError("");
      })
      .catch(() => setLoadError("Could not load users. Is the backend running?"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchAll();
  }, []);

  // ── Stats ──
  const activeUsers   = usersList.filter((u) => u.status === "active").length;
  const inactiveUsers = usersList.filter((u) => u.status === "inactive").length;
  const admins        = usersList.filter((u) => u.role?.name === "Administrator").length;

  // ── Filtrado ──
  const filteredUsers = usersList.filter((u) =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase()) ||
    (u.role?.name || "").toLowerCase().includes(search.toLowerCase())
  );

  // ── Abrir modal nuevo ──
  const openNewUser = () => {
    setEditUserId(null);
    setFields({ name: "", email: "", password: "", role_id: "", status: "active" });
    setShowModal(true);
  };

  // ── Abrir modal editar ──
  const editUser = (user) => {
    setEditUserId(user.id);
    setFields({
      name: user.name, email: user.email, password: "",
      role_id: user.role_id, status: user.status
    });
    setShowModal(true);
  };

  // ── Guardar ──
  const saveUser = () => {
    if (!fields.name || !fields.email || !fields.role_id) {
      alert("Name, email and role are required");
      return;
    }
    if (!editUserId && !fields.password) {
      alert("Password is required for new users");
      return;
    }

    setSaving(true);

    const payload = { ...fields };
    if (editUserId && !payload.password) delete payload.password;

    const request = editUserId
      ? api.put(`/users/${editUserId}`, payload)
      : api.post("/users", payload);

    request
      .then(() => {
        setShowModal(false);
        fetchAll();
      })
      .catch((err) => {
        const msg = err.response?.data?.errors
          ? Object.values(err.response.data.errors).flat().join(" ")
          : err.response?.data?.message || "Could not save user.";
        alert(msg);
      })
      .finally(() => setSaving(false));
  };

  // ── Eliminar ──
  const deleteUser = (id) => {
    if (id === currentUser?.id) {
      alert("You cannot delete your own account while logged in.");
      return;
    }
    if (!window.confirm("Are you sure you want to delete this user?")) return;

    api.delete(`/users/${id}`)
      .then(() => fetchAll())
      .catch((err) => alert(err.response?.data?.message || "Could not delete user."));
  };

  // ── Alternar estado rápido ──
  const toggleStatus = (user) => {
    if (!canManage) return;
    if (user.id === currentUser?.id) {
      alert("You cannot deactivate your own account while logged in.");
      return;
    }

    const newStatus = user.status === "active" ? "inactive" : "active";

    api.put(`/users/${user.id}`, {
      name: user.name, email: user.email, role_id: user.role_id, status: newStatus
    })
      .then(() => fetchAll())
      .catch((err) => alert(err.response?.data?.message || "Could not update status."));
  };

  return (
    <div>

      {/* Fila 1: Título + Search + Botón */}
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">

        <div>
          <h1>Users</h1>
          <p style={{ color: "#64748b", margin: 0 }}>Manage system users and their access</p>
        </div>

        <div className="d-flex flex-wrap gap-2">

          <input
            type="text"
            placeholder="Search user..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              padding: "10px 14px", borderRadius: "10px", border: "1px solid #cbd5e1",
              outline: "none", minWidth: "180px", flex: 1
            }}
          />

          {canManage && (
            <button
              onClick={openNewUser}
              style={{
                background: "#dbeafe", color: "#1d4ed8", border: "none",
                padding: "10px 18px", borderRadius: "10px", fontWeight: "600",
                cursor: "pointer", display: "flex", alignItems: "center", gap: "6px", whiteSpace: "nowrap"
              }}
            >
              <BsPlus size={18} /> Add User
            </button>
          )}

        </div>

      </div>

      {/* Fila 2: StatCards */}
      <div className="row mb-4">

        <div className="col-6 col-lg-3 mb-3">
          <StatCard title="Total Users" value={usersList.length} color="#0f172a" />
        </div>

        <div className="col-6 col-lg-3 mb-3">
          <StatCard title="Active" value={activeUsers} color="#16a34a" />
        </div>

        <div className="col-6 col-lg-3 mb-3">
          <StatCard title="Inactive" value={inactiveUsers} color="#dc2626" />
        </div>

        <div className="col-6 col-lg-3 mb-3">
          <StatCard title="Administrators" value={admins} color="#2563eb" />
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
              {["ID", "User", "Role", "Status", "Actions"].map((h) => (
                <th key={h} style={thStyle}>{h}</th>
              ))}
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td colSpan="5" className="text-center py-4 text-muted">Loading...</td>
              </tr>
            ) : filteredUsers.length > 0 ? (
              filteredUsers.map((u) => (
                <tr key={u.id} style={{ borderBottom: "1px solid #f1f5f9" }}>

                  <td style={tdStyle}>
                    <span style={{ color: "#94a3b8", fontWeight: "500" }}>#{u.id}</span>
                  </td>

                  <td style={tdStyle}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <div style={{
                        width: "34px", height: "34px", borderRadius: "50%",
                        background: "#e8f0fe", color: "#1d4ed8",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: "12px", fontWeight: "700", flexShrink: 0
                      }}>
                        {initials(u.name)}
                      </div>
                      <div>
                        <div style={{ fontWeight: "500", color: "#0f172a" }}>{u.name}</div>
                        <div style={{ fontSize: "12px", color: "#94a3b8" }}>{u.email}</div>
                      </div>
                    </div>
                  </td>

                  <td style={tdStyle}>
                    <span style={{
                      background: "#f1f5f9", color: "#475569", padding: "3px 10px",
                      borderRadius: "20px", fontSize: "12px", fontWeight: "500",
                      display: "inline-flex", alignItems: "center", gap: "5px"
                    }}>
                      <BsShieldLock size={11} />
                      {u.role?.name || "—"}
                    </span>
                  </td>

                  <td style={tdStyle}>
                    <span
                      onClick={() => toggleStatus(u)}
                      title={canManage ? "Click to toggle status" : ""}
                      style={{
                        display: "inline-block", padding: "4px 10px", borderRadius: "20px",
                        fontSize: "12px", fontWeight: "600",
                        cursor: canManage ? "pointer" : "default",
                        background: u.status === "active" ? "#d1f5d3" : "#f1f5f9",
                        color:      u.status === "active" ? "#1a6b2a" : "#64748b"
                      }}
                    >
                      {u.status === "active" ? "Active" : "Inactive"}
                    </span>
                  </td>

                  <td style={tdStyle}>
                    {canManage ? (
                      <div style={{ display: "flex", gap: "8px" }}>

                        <button
                          onClick={() => setSessionsUser(u)}
                          title="View active sessions"
                          style={{ background: "#f1f5f9", color: "#475569", border: "none", borderRadius: "8px", padding: "6px 10px", cursor: "pointer", display: "flex", alignItems: "center" }}
                        >
                          <BsLaptop />
                        </button>

                        <button
                          onClick={() => editUser(u)}
                          style={{ background: "#dbeafe", color: "#1d4ed8", border: "none", borderRadius: "8px", padding: "6px 10px", cursor: "pointer", display: "flex", alignItems: "center" }}
                        >
                          <BsPencilSquare />
                        </button>

                        <button
                          onClick={() => deleteUser(u.id)}
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
                  No users found.
                </td>
              </tr>
            )}
          </tbody>

        </table>
      </div>

      {/* Modal de edición */}
      <UserModal
        showModal={showModal}
        setShowModal={setShowModal}
        isEditing={!!editUserId}
        fields={fields}
        setFields={setFields}
        onSave={saveUser}
        saving={saving}
        roles={rolesList}
      />

      {/* Modal de sesiones */}
      {sessionsUser && (
        <SessionsModal user={sessionsUser} onClose={() => setSessionsUser(null)} />
      )}

    </div>
  );
}

const thStyle = {
  textAlign: "left", padding: "15px", color: "#94a3b8", fontWeight: "600",
  fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.5px"
};

const tdStyle = { padding: "15px" };

export default Users;