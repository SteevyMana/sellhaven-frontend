import { useEffect, useState } from "react";
import StatCard from "../components/StatCard";
import {
  BsPlus,
  BsPencilSquare,
  BsTrash
} from "react-icons/bs";
import api from "../api/client";
import { usePermission } from "../hooks/usePermission";


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
function CustomerModal({ showModal, setShowModal, isEditing, fields, setFields, onSave, saving }) {

  if (!showModal) return null;

  return (
    <div
      className="modal d-block"
      tabIndex="-1"
      style={{ background: "rgba(0,0,0,0.5)" }}
    >
      <div className="modal-dialog">
        <div className="modal-content" style={{ borderRadius: "16px", border: "none" }}>

          <div className="modal-header" style={{ borderBottom: "1px solid #f1f5f9" }}>
            <h5 className="modal-title" style={{ fontWeight: "600" }}>
              {isEditing ? "Edit Customer" : "New Customer"}
            </h5>
            <button className="btn-close" onClick={() => setShowModal(false)} />
          </div>

          <div className="modal-body">

            <div className="row">

              <div className="col-md-6 mb-3">
                <label className="form-label" style={{ fontWeight: "500", fontSize: "14px" }}>
                  Full Name
                </label>
                <input
                  type="text"
                  className="form-control"
                  style={{ borderRadius: "10px" }}
                  placeholder="e.g. Maria Lopez"
                  value={fields.name}
                  onChange={(e) => setFields({ ...fields, name: e.target.value })}
                />
              </div>

              <div className="col-md-6 mb-3">
                <label className="form-label" style={{ fontWeight: "500", fontSize: "14px" }}>
                  Email
                </label>
                <input
                  type="email"
                  className="form-control"
                  style={{ borderRadius: "10px" }}
                  placeholder="e.g. maria@email.com"
                  value={fields.email}
                  onChange={(e) => setFields({ ...fields, email: e.target.value })}
                />
              </div>

              <div className="col-md-6 mb-3">
                <label className="form-label" style={{ fontWeight: "500", fontSize: "14px" }}>
                  Phone
                </label>
                <input
                  type="text"
                  className="form-control"
                  style={{ borderRadius: "10px" }}
                  placeholder="e.g. 809-555-0000"
                  value={fields.phone}
                  onChange={(e) => setFields({ ...fields, phone: e.target.value })}
                />
              </div>

              <div className="col-md-6 mb-3">
                <label className="form-label" style={{ fontWeight: "500", fontSize: "14px" }}>
                  City
                </label>
                <input
                  type="text"
                  className="form-control"
                  style={{ borderRadius: "10px" }}
                  placeholder="e.g. Santiago"
                  value={fields.city}
                  onChange={(e) => setFields({ ...fields, city: e.target.value })}
                />
              </div>

              <div className="col-md-6 mb-3">
                <label className="form-label" style={{ fontWeight: "500", fontSize: "14px" }}>
                  Status
                </label>
                <select
                  className="form-select"
                  style={{ borderRadius: "10px" }}
                  value={fields.status}
                  onChange={(e) => setFields({ ...fields, status: e.target.value })}
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
                <small className="text-muted">
                  Inactive customers won't show up when creating new sales
                </small>
              </div>

            </div>

          </div>

          <div className="modal-footer" style={{ borderTop: "1px solid #f1f5f9" }}>
            <button
              className="btn btn-light"
              style={{ borderRadius: "10px" }}
              onClick={() => setShowModal(false)}
            >
              Cancel
            </button>
            <button
              onClick={onSave}
              disabled={saving}
              style={{
                background: saving ? "#bfdbfe" : "#dbeafe",
                color: "#1d4ed8",
                border: "none",
                padding: "8px 20px",
                borderRadius: "10px",
                fontWeight: "600",
                cursor: saving ? "default" : "pointer"
              }}
            >
              {saving ? "Saving..." : "Save Customer"}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}

// ── Página principal ─────────────────────────────────────────────
function Customers() {

  const canManage = usePermission("customers.manage");

  const [customersList, setCustomersList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [saving, setSaving] = useState(false);

  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");
  const [showModal, setShowModal] = useState(false);
  const [editCustomerId, setEditCustomerId] = useState(null);
  const [fields, setFields] = useState({
    name: "", email: "", phone: "", city: "", status: "Active"
  });

  // ── Cargar desde la API ──
  const fetchAll = () => {
    api.get("/customers")
      .then((res) => {
        setCustomersList(res.data);
        setLoadError("");
      })
      .catch(() => setLoadError("Could not load customers. Is the backend running?"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchAll();
  }, []);

  // ── Stats ── (orders_count viene de Customer::withCount('orders'))
  const totalActive = customersList.filter((c) => c.status === "Active").length;
  const totalInactive = customersList.filter((c) => c.status === "Inactive").length;
  const totalOrders = customersList.reduce((s, c) => s + c.orders_count, 0);

  // ── Filtrado ──
  const filteredCustomers = customersList.filter((c) => {
    const matchSearch =
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      (c.email || "").toLowerCase().includes(search.toLowerCase()) ||
      (c.city || "").toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === "All" || c.status === filterStatus;
    return matchSearch && matchStatus;
  });

  // ── Abrir modal nuevo ──
  const openNewCustomer = () => {
    setEditCustomerId(null);
    setFields({ name: "", email: "", phone: "", city: "", status: "Active" });
    setShowModal(true);
  };

  // ── Abrir modal editar ──
  const editCustomer = (customer) => {
    setEditCustomerId(customer.id);
    setFields({
      name: customer.name,
      email: customer.email || "",
      phone: customer.phone || "",
      city: customer.city || "",
      status: customer.status
    });
    setShowModal(true);
  };

  // ── Guardar ──
  const saveCustomer = () => {
    if (!fields.name) {
      alert("Name is required");
      return;
    }

    setSaving(true);

    const payload = {
      name: fields.name,
      email: fields.email || null,
      phone: fields.phone || null,
      city: fields.city || null,
      status: fields.status
    };

    const request = editCustomerId
      ? api.put(`/customers/${editCustomerId}`, payload)
      : api.post("/customers", payload);

    request
      .then(() => {
        setShowModal(false);
        fetchAll();
      })
      .catch((err) => {
        const emailError = err.response?.data?.errors?.email?.[0];
        alert(emailError || err.response?.data?.message || "Could not save customer.");
      })
      .finally(() => setSaving(false));
  };

  // ── Eliminar ──
  const deleteCustomer = (id) => {
    if (!window.confirm("Are you sure you want to delete this customer?")) return;

    api.delete(`/customers/${id}`)
      .then(() => fetchAll())
      .catch((err) => alert(err.response?.data?.message || "Could not delete customer."));
  };

  return (
    <div>

      {/* Fila 1: Título + Search + Filtro + Botón */}
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">

        <div>
          <h1>Customers</h1>
          <p style={{ color: "#64748b", margin: 0 }}>Manage your customers</p>
        </div>

        <div className="d-flex flex-wrap gap-2">

          <input
            type="text"
            placeholder="Search customer..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              padding: "10px 14px",
              borderRadius: "10px",
              border: "1px solid #cbd5e1",
              outline: "none",
              minWidth: "180px"
            }}
          />

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            style={{
              padding: "10px 14px",
              borderRadius: "10px",
              border: "1px solid #cbd5e1",
              outline: "none",
              background: "white",
              cursor: "pointer"
            }}
          >
            <option value="All">All Statuses</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>
          {canManage && (
            <button
              onClick={openNewCustomer}
              style={{
                background: "#dbeafe",
                color: "#1d4ed8",
                border: "none",
                padding: "10px 18px",
                borderRadius: "10px",
                fontWeight: "600",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "6px",
                whiteSpace: "nowrap"
              }}
            >
              <BsPlus size={18} /> New Customer
            </button>
          )}
        </div>

      </div>

      {/* Fila 2: StatCards */}
      <div className="row mb-4">

        <div className="col-6 col-lg-3 mb-3">
          <StatCard title="Total Customers" value={customersList.length} color="#0f172a" />
        </div>

        <div className="col-6 col-lg-3 mb-3">
          <StatCard title="Active" value={totalActive} color="#16a34a" />
        </div>

        <div className="col-6 col-lg-3 mb-3">
          <StatCard title="Inactive" value={totalInactive} color="#dc2626" />
        </div>

        <div className="col-6 col-lg-3 mb-3">
          <StatCard title="Total Orders" value={totalOrders} color="#2563eb" />
        </div>

      </div>

      {loadError && (
        <div style={{ background: "#fee2e2", color: "#b91c1c", padding: "12px 16px", borderRadius: "10px", marginBottom: "16px" }}>
          {loadError}
        </div>
      )}

      {/* Tabla */}
      <div style={{
        background: "white",
        borderRadius: "15px",
        padding: "20px",
        boxShadow: "0 2px 10px rgba(0,0,0,0.05)",
        overflowX: "auto"
      }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>

          <thead>
            <tr style={{ borderBottom: "1px solid #e2e8f0" }}>
              {["ID", "Name", "Email", "Phone", "City", "Orders", "Status", "Actions"].map((h) => (
                <th key={h} style={thStyle}>{h}</th>
              ))}
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td colSpan="8" className="text-center py-4 text-muted">Loading...</td>
              </tr>
            ) : filteredCustomers.length > 0 ? (
              filteredCustomers.map((customer) => (
                <tr key={customer.id} style={{ borderBottom: "1px solid #f1f5f9" }}>

                  <td style={tdStyle}>
                    <span style={{ color: "#94a3b8", fontWeight: "500" }}>
                      #{customer.id}
                    </span>
                  </td>

                  <td style={{ ...tdStyle, fontWeight: "500", color: "#0f172a" }}>
                    {customer.name}
                  </td>

                  <td style={{ ...tdStyle, color: "#475569" }}>
                    {customer.email || "—"}
                  </td>

                  <td style={{ ...tdStyle, color: "#475569" }}>
                    {customer.phone || "—"}
                  </td>

                  <td style={{ ...tdStyle, color: "#475569" }}>
                    {customer.city || "—"}
                  </td>

                  <td style={{ ...tdStyle, textAlign: "center" }}>
                    <span style={{
                      background: "#f1f5f9",
                      color: "#0f172a",
                      fontWeight: "600",
                      padding: "3px 10px",
                      borderRadius: "20px",
                      fontSize: "13px"
                    }}>
                      {customer.orders_count}
                    </span>
                  </td>

                  <td style={tdStyle}>
                    <StatusBadge status={customer.status} />
                  </td>

                  <td style={tdStyle}>
                    {canManage ? (
                    <div style={{ display: "flex", gap: "8px" }}>

                      <button
                        onClick={() => editCustomer(customer)}
                        style={{
                          background: "#dbeafe", color: "#1d4ed8",
                          border: "none", borderRadius: "8px",
                          padding: "6px 10px", cursor: "pointer",
                          display: "flex", alignItems: "center"
                        }}
                      >
                        <BsPencilSquare />
                      </button>

                      <button
                        onClick={() => deleteCustomer(customer.id)}
                        style={{
                          background: "#fee2e2", color: "#b91c1c",
                          border: "none", borderRadius: "8px",
                          padding: "6px 10px", cursor: "pointer",
                          display: "flex", alignItems: "center"
                        }}
                      >
                        <BsTrash />
                      </button>

                    </div>
                    ) : (
                      <span style={{ color: "#94a3b8", fontSize: "13px" }}>No permission</span>
                    )}
                  </td>

                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="8" className="text-center py-4 text-muted">
                  No customers found.
                </td>
              </tr>
            )}
          </tbody>

        </table>
      </div>

      {/* Modal */}
      <CustomerModal
        showModal={showModal}
        setShowModal={setShowModal}
        isEditing={!!editCustomerId}
        fields={fields}
        setFields={setFields}
        onSave={saveCustomer}
        saving={saving}
      />

    </div>
  );
}

const thStyle = {
  textAlign: "left",
  padding: "15px",
  color: "#94a3b8",
  fontWeight: "600",
  fontSize: "12px",
  textTransform: "uppercase",
  letterSpacing: "0.5px"
};

const tdStyle = { padding: "15px" };

export default Customers;