import { useEffect, useState } from "react";
import { BsChevronDown, BsChevronRight } from "react-icons/bs";
import api from "../api/client";

const ACTIONS = ["created", "updated", "deleted"];

const MODEL_TYPES = [
  "Product", "Category", "Supplier", "Customer",
  "Purchase", "StockEntry", "ReturnToSupplier",
  "Order", "Sale", "Payment", "CustomerReturn",
  "Role", "Permission", "User"
];

const ACTION_STYLES = {
  created: { background: "#dcfce7", color: "#166534" },
  updated: { background: "#dbeafe", color: "#1e40af" },
  deleted: { background: "#fee2e2", color: "#991b1b" },
};

function ActionBadge({ action }) {
  const style = ACTION_STYLES[action] || {};
  return (
    <span style={{ display: "inline-block", padding: "3px 10px", borderRadius: "20px", fontSize: "12px", fontWeight: "600", textTransform: "capitalize", ...style }}>
      {action}
    </span>
  );
}

// ── Página principal ─────────────────────────────────────────────
function AuditLog() {

  const [logs, setLogs] = useState([]);
  const [users, setUsers] = useState([]);
  const [pagination, setPagination] = useState({ current_page: 1, last_page: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const [filters, setFilters] = useState({ user_id: "", model_type: "", action: "" });
  const [page, setPage] = useState(1);
  const [expandedIds, setExpandedIds] = useState(new Set());

  // ── Cargar usuarios (para el filtro) — una sola vez ──
  useEffect(() => {
    api.get("/users").then(({ data }) => setUsers(data)).catch(() => {});
  }, []);

  // ── Cargar logs, cada vez que cambian filtros o página ──
  const fetchLogs = () => {
    setLoading(true);
    const params = new URLSearchParams({ page, ...filters });
    // Quita claves vacías para no mandar "?user_id=&model_type=" sucio
    Object.keys(filters).forEach((k) => { if (!filters[k]) params.delete(k); });

    api.get(`/audit-logs?${params.toString()}`)
      .then(({ data }) => {
        setLogs(data.data);
        setPagination({ current_page: data.current_page, last_page: data.last_page, total: data.total });
        setLoadError("");
      })
      .catch(() => setLoadError("Could not load audit logs. Is the backend running?"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchLogs();
  }, [page, filters]);

  const updateFilter = (key, value) => {
    setPage(1); // cualquier cambio de filtro reinicia a la página 1
    setFilters((f) => ({ ...f, [key]: value }));
  };

  const toggleExpanded = (id) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  return (
    <div>

      <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
        <div>
          <h1>Audit Log</h1>
          <p style={{ color: "#64748b", margin: 0 }}>Every create, edit and delete across the system</p>
        </div>
      </div>

      {/* Filtros */}
      <div className="d-flex flex-wrap gap-2 mb-4">

        <select value={filters.user_id} onChange={(e) => updateFilter("user_id", e.target.value)}
          style={{ padding: "10px 14px", borderRadius: "10px", border: "1px solid #cbd5e1", outline: "none", background: "white", cursor: "pointer" }}
        >
          <option value="">All Users</option>
          {users.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
        </select>

        <select value={filters.model_type} onChange={(e) => updateFilter("model_type", e.target.value)}
          style={{ padding: "10px 14px", borderRadius: "10px", border: "1px solid #cbd5e1", outline: "none", background: "white", cursor: "pointer" }}
        >
          <option value="">All Modules</option>
          {MODEL_TYPES.map((m) => <option key={m} value={m}>{m}</option>)}
        </select>

        <select value={filters.action} onChange={(e) => updateFilter("action", e.target.value)}
          style={{ padding: "10px 14px", borderRadius: "10px", border: "1px solid #cbd5e1", outline: "none", background: "white", cursor: "pointer" }}
        >
          <option value="">All Actions</option>
          {ACTIONS.map((a) => <option key={a} value={a} style={{ textTransform: "capitalize" }}>{a}</option>)}
        </select>

        {(filters.user_id || filters.model_type || filters.action) && (
          <button
            onClick={() => { setPage(1); setFilters({ user_id: "", model_type: "", action: "" }); }}
            style={{ padding: "10px 14px", borderRadius: "10px", border: "1px solid #e2e8f0", background: "white", color: "#64748b", cursor: "pointer" }}
          >
            Clear filters
          </button>
        )}

      </div>

      {loadError && (
        <div style={{ background: "#fee2e2", color: "#b91c1c", padding: "12px 16px", borderRadius: "10px", marginBottom: "16px" }}>
          {loadError}
        </div>
      )}

      {/* Tabla */}
      <div style={{ background: "white", borderRadius: "15px", padding: "20px", boxShadow: "0 2px 10px rgba(0,0,0,0.05)", overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "600px" }}>

          <thead>
            <tr style={{ borderBottom: "1px solid #e2e8f0" }}>
              {["", "Date", "User", "Action", "Module", "Description"].map((h) => (
                <th key={h} style={thStyle}>{h}</th>
              ))}
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td colSpan="6" className="text-center py-4 text-muted">Loading...</td>
              </tr>
            ) : logs.length > 0 ? (
              logs.map((log) => {
                const isExpanded = expandedIds.has(log.id);
                return (
                  <>
                    <tr key={log.id} style={{ borderBottom: "1px solid #f1f5f9", cursor: log.changes ? "pointer" : "default" }}
                      onClick={() => log.changes && toggleExpanded(log.id)}
                    >
                      <td style={{ ...tdStyle, width: "24px", color: "#94a3b8" }}>
                        {log.changes ? (isExpanded ? <BsChevronDown /> : <BsChevronRight />) : null}
                      </td>
                      <td style={{ ...tdStyle, color: "#64748b", fontSize: "13px", whiteSpace: "nowrap" }}>
                        {new Date(log.created_at).toLocaleString()}
                      </td>
                      <td style={{ ...tdStyle, fontWeight: "500", color: "#0f172a" }}>
                        {log.user?.name || "System"}
                      </td>
                      <td style={tdStyle}>
                        <ActionBadge action={log.action} />
                      </td>
                      <td style={tdStyle}>
                        <span style={{ background: "#f1f5f9", color: "#475569", padding: "3px 10px", borderRadius: "20px", fontSize: "12px", fontWeight: "500" }}>
                          {log.model_type}
                        </span>
                      </td>
                      <td style={{ ...tdStyle, color: "#475569" }}>{log.description}</td>
                    </tr>

                    {isExpanded && log.changes && (
                      <tr key={`${log.id}-details`} style={{ borderBottom: "1px solid #f1f5f9" }}>
                        <td colSpan="6" style={{ padding: "0 16px 16px 44px" }}>
                          <pre style={{
                            background: "#0f172a", color: "#e2e8f0", padding: "14px 16px",
                            borderRadius: "10px", fontSize: "12px", overflowX: "auto", margin: 0
                          }}>
                            {JSON.stringify(log.changes, null, 2)}
                          </pre>
                        </td>
                      </tr>
                    )}
                  </>
                );
              })
            ) : (
              <tr>
                <td colSpan="6" className="text-center py-4 text-muted">No activity found.</td>
              </tr>
            )}
          </tbody>

        </table>
      </div>

      {/* Paginación */}
      {!loading && pagination.last_page > 1 && (
        <div className="d-flex justify-content-between align-items-center mt-3">
          <small style={{ color: "#94a3b8" }}>
            Page {pagination.current_page} of {pagination.last_page} — {pagination.total} total
          </small>
          <div className="d-flex gap-2">
            <button
              disabled={pagination.current_page <= 1}
              onClick={() => setPage((p) => p - 1)}
              style={{
                padding: "8px 16px", borderRadius: "8px", border: "1px solid #e2e8f0",
                background: "white", cursor: pagination.current_page <= 1 ? "default" : "pointer",
                opacity: pagination.current_page <= 1 ? 0.5 : 1
              }}
            >
              Previous
            </button>
            <button
              disabled={pagination.current_page >= pagination.last_page}
              onClick={() => setPage((p) => p + 1)}
              style={{
                padding: "8px 16px", borderRadius: "8px", border: "1px solid #e2e8f0",
                background: "white", cursor: pagination.current_page >= pagination.last_page ? "default" : "pointer",
                opacity: pagination.current_page >= pagination.last_page ? 0.5 : 1
              }}
            >
              Next
            </button>
          </div>
        </div>
      )}

    </div>
  );
}

const thStyle = {
  textAlign: "left", padding: "15px",
  color: "#94a3b8", fontWeight: "600",
  fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.5px"
};
const tdStyle = { padding: "15px" };

export default AuditLog;