import { useEffect, useState } from "react";
import StatCard from "../components/StatCard";
import { BsPlus, BsPencilSquare, BsTrash, BsDashCircle } from "react-icons/bs";
import api from "../api/client";
import { usePermission } from "../hooks/usePermission";

const ALL_STATUSES = ["Pending", "Processing", "Shipped", "Delivered", "Cancelled"];

const STATUS_STYLES = {
  Pending:    { background: "#fef9c3", color: "#854d0e" },
  Processing: { background: "#dbeafe", color: "#1e40af" },
  Shipped:    { background: "#e0f2fe", color: "#0369a1" },
  Delivered:  { background: "#dcfce7", color: "#166534" },
  Cancelled:  { background: "#fee2e2", color: "#991b1b" },
};

// ── Helpers ──────────────────────────────────────────────────────
const calcTotal = (items = []) =>
  items.reduce((s, i) => s + Number(i.price) * i.quantity, 0);

// ── Badge ────────────────────────────────────────────────────────
function StatusBadge({ status }) {
  const style = STATUS_STYLES[status] || {};
  return (
    <span style={{ display: "inline-block", padding: "4px 12px", borderRadius: "20px", fontSize: "12px", fontWeight: "600", ...style }}>
      {status}
    </span>
  );
}

// ── Modal ────────────────────────────────────────────────────────
function OrderModal({ showModal, setShowModal, isEditing, fields, setFields, onSave, saving, customers, products }) {

  // Hooks SIEMPRE antes de cualquier return condicional (Reglas de los Hooks).
  const [selectedId, setSelectedId] = useState(products[0]?.id || "");
  const [qty, setQty]               = useState(1);

  useEffect(() => {
    if (showModal && products.length > 0) {
      setSelectedId(products.find((p) => p.stock > 0)?.id || "");
    }
  }, [showModal, products]);

  if (!showModal) return null;

  const total = calcTotal(fields.items);

  // Agregar producto a la lista, respetando el stock disponible.
  const addItem = () => {
    const product = products.find((p) => p.id === Number(selectedId) && p.stock > 0);
    if (!product) return;

    const existing = fields.items.find((i) => i.product_id === product.id);
    const currentQtyInCart = existing ? existing.quantity : 0;
    const newTotalQty = currentQtyInCart + Number(qty);

    if (newTotalQty > product.stock) {
      alert(`Only ${product.stock} units of "${product.name}" are available.`);
      return;
    }

    if (existing) {
      setFields({
        ...fields,
        items: fields.items.map((i) =>
          i.product_id === product.id ? { ...i, quantity: newTotalQty } : i
        )
      });
    } else {
      setFields({
        ...fields,
        items: [...fields.items, {
          product_id: product.id,
          name:       product.name,
          price:      product.price,
          quantity:   Number(qty)
        }]
      });
    }
    setQty(1);
  };

  const removeItem = (product_id) =>
    setFields({ ...fields, items: fields.items.filter((i) => i.product_id !== product_id) });

  const changeQty = (product_id, newQty) => {
    if (newQty < 1) return;
    setFields({
      ...fields,
      items: fields.items.map((i) =>
        i.product_id === product_id ? { ...i, quantity: Number(newQty) } : i
      )
    });
  };

  return (
    <div className="modal d-block" tabIndex="-1" style={{ background: "rgba(0,0,0,0.5)" }}>
      <div className="modal-dialog modal-lg">
        <div className="modal-content" style={{ borderRadius: "16px", border: "none" }}>

          <div className="modal-header" style={{ borderBottom: "1px solid #f1f5f9" }}>
            <h5 className="modal-title" style={{ fontWeight: "600" }}>
              {isEditing ? "Edit Order" : "New Order"}
            </h5>
            <button className="btn-close" onClick={() => setShowModal(false)} />
          </div>

          <div className="modal-body">

            <p style={{ fontSize: "12px", fontWeight: "600", color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "12px" }}>
              Order Information
            </p>

            <div className="row mb-4">

              <div className="col-md-6 mb-3">
                <label className="form-label" style={{ fontWeight: "500", fontSize: "14px" }}>Customer</label>
                <select className="form-select" style={{ borderRadius: "10px" }}
                  value={fields.customer_id}
                  onChange={(e) => setFields({ ...fields, customer_id: e.target.value })}
                >
                  <option value="">— Select customer —</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div className="col-md-3 mb-3">
                <label className="form-label" style={{ fontWeight: "500", fontSize: "14px" }}>Status</label>
                <select className="form-select" style={{ borderRadius: "10px" }}
                  value={fields.status}
                  onChange={(e) => setFields({ ...fields, status: e.target.value })}
                >
                  {ALL_STATUSES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
                <small className="text-muted">
                  "Delivered" resta el stock inmediatamente
                </small>
              </div>

              <div className="col-md-3 mb-3">
                <label className="form-label" style={{ fontWeight: "500", fontSize: "14px" }}>Date</label>
                <input type="date" className="form-control" style={{ borderRadius: "10px" }}
                  value={fields.date}
                  onChange={(e) => setFields({ ...fields, date: e.target.value })}
                />
              </div>

            </div>

            <p style={{ fontSize: "12px", fontWeight: "600", color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "12px" }}>
              Products
            </p>

            {/* Selector */}
            <div className="d-flex flex-wrap gap-2 align-items-end mb-3 p-3"
              style={{ background: "#f8fafc", borderRadius: "10px", border: "1px solid #e2e8f0" }}
            >
              <div style={{ flex: 2, minWidth: "160px" }}>
                <label style={{ fontSize: "12px", color: "#64748b", fontWeight: "500", display: "block", marginBottom: "4px" }}>Product</label>
                <select className="form-select form-select-sm" style={{ borderRadius: "8px" }}
                  value={selectedId}
                  onChange={(e) => setSelectedId(e.target.value)}
                >
                  {products.filter((p) => p.stock > 0).map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} — ${Number(p.price).toLocaleString()} (stock: {p.stock})
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ width: "90px" }}>
                <label style={{ fontSize: "12px", color: "#64748b", fontWeight: "500", display: "block", marginBottom: "4px" }}>Quantity</label>
                <input type="number" className="form-control form-control-sm" style={{ borderRadius: "8px" }}
                  min="1" value={qty}
                  onChange={(e) => setQty(e.target.value)}
                />
              </div>

              <div>
                <button onClick={addItem} style={{
                  background: "#dbeafe", color: "#1d4ed8", border: "none",
                  padding: "7px 16px", borderRadius: "8px", fontWeight: "600",
                  cursor: "pointer", display: "flex", alignItems: "center", gap: "5px"
                }}>
                  <BsPlus size={16} /> Add
                </button>
              </div>
            </div>

            {/* Tabla de items */}
            <div style={{ border: "1px solid #e2e8f0", borderRadius: "10px", overflow: "hidden" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
                    {["Product", "Unit Price", "Quantity", "Subtotal", ""].map((h) => (
                      <th key={h} style={{ padding: "10px 14px", textAlign: "left", fontSize: "11px", fontWeight: "600", color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.5px" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {fields.items.length > 0 ? (
                    fields.items.map((item) => (
                      <tr key={item.product_id} style={{ borderBottom: "1px solid #f1f5f9" }}>

                        <td style={{ padding: "10px 14px", fontWeight: "500", color: "#0f172a" }}>
                          {item.name || item.product?.name}
                        </td>

                        <td style={{ padding: "10px 14px", color: "#475569" }}>
                          ${Number(item.price).toLocaleString()}
                        </td>

                        <td style={{ padding: "10px 14px" }}>
                          <input type="number" min="1" value={item.quantity}
                            onChange={(e) => changeQty(item.product_id, e.target.value)}
                            style={{ width: "70px", padding: "4px 8px", borderRadius: "6px", border: "1px solid #e2e8f0", outline: "none", textAlign: "center" }}
                          />
                        </td>

                        <td style={{ padding: "10px 14px", fontWeight: "600", color: "#16a34a" }}>
                          ${(Number(item.price) * item.quantity).toLocaleString()}
                        </td>

                        <td style={{ padding: "10px 14px" }}>
                          <button onClick={() => removeItem(item.product_id)} style={{
                            background: "#fee2e2", color: "#b91c1c", border: "none",
                            borderRadius: "6px", padding: "4px 8px", cursor: "pointer", display: "flex", alignItems: "center"
                          }}>
                            <BsDashCircle size={14} />
                          </button>
                        </td>

                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="5" style={{ padding: "20px", textAlign: "center", color: "#94a3b8", fontSize: "13px" }}>
                        No products added yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Total */}
            <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: "12px", marginTop: "16px", padding: "12px 16px", background: "#f8fafc", borderRadius: "10px" }}>
              <span style={{ color: "#64748b", fontWeight: "500" }}>TOTAL:</span>
              <span style={{ fontSize: "22px", fontWeight: "700", color: "#16a34a" }}>
                ${total.toLocaleString()}
              </span>
            </div>

          </div>

          <div className="modal-footer" style={{ borderTop: "1px solid #f1f5f9" }}>
            <button className="btn btn-light" style={{ borderRadius: "10px" }} onClick={() => setShowModal(false)}>
              Cancel
            </button>
            <button onClick={onSave} disabled={saving} style={{
              background: saving ? "#bfdbfe" : "#dbeafe", color: "#1d4ed8", border: "none",
              padding: "8px 20px", borderRadius: "10px", fontWeight: "600",
              cursor: saving ? "default" : "pointer"
            }}>
              {saving ? "Saving..." : "Save Order"}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}

// ── Página principal ─────────────────────────────────────────────
function Orders() {

  const canCreate = usePermission("orders.create");
  const canEdit   = usePermission("orders.edit");
  const canDelete = usePermission("orders.delete");

  const [ordersList, setOrdersList]     = useState([]);
  const [customers, setCustomers]       = useState([]);
  const [products, setProducts]         = useState([]);
  const [loading, setLoading]           = useState(true);
  const [loadError, setLoadError]       = useState("");
  const [saving, setSaving]             = useState(false);

  const [search, setSearch]             = useState("");
  const [filterStatus, setFilterStatus] = useState("All");
  const [showModal, setShowModal]       = useState(false);
  const [editOrderId, setEditOrderId]   = useState(null);
  const [fields, setFields]             = useState({
    customer_id: "", status: "Pending",
    date: new Date().toISOString().split("T")[0], items: []
  });

  // ── Cargar datos desde la API ──
  const fetchAll = () => {
    Promise.all([
      api.get("/orders"),
      api.get("/customers"),
      api.get("/products"),
    ])
      .then(([ordersRes, customersRes, productsRes]) => {
        setOrdersList(ordersRes.data);
        setCustomers(customersRes.data);
        setProducts(productsRes.data);
        setLoadError("");
      })
      .catch(() => setLoadError("Could not load orders. Is the backend running?"))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchAll(); }, []);

  // ── Stats ──
  const totalRevenue   = ordersList.reduce((s, o) => s + Number(o.total || 0), 0);
  const totalPending   = ordersList.filter((o) => o.status === "Pending").length;
  const totalDelivered = ordersList.filter((o) => o.status === "Delivered").length;

  // ── Filtrado ──
  const filteredOrders = ordersList.filter((o) => {
    const customerName = o.customer?.name || "";
    const matchSearch  =
      customerName.toLowerCase().includes(search.toLowerCase()) ||
      (o.details || []).some((d) => (d.product?.name || "").toLowerCase().includes(search.toLowerCase()));
    const matchStatus  = filterStatus === "All" || o.status === filterStatus;
    return matchSearch && matchStatus;
  });

  // ── Abrir modal nuevo ──
  const openNew = () => {
    setEditOrderId(null);
    setFields({ customer_id: "", status: "Pending", date: new Date().toISOString().split("T")[0], items: [] });
    setShowModal(true);
  };

  // ── Abrir modal editar ──
  const editOrder = (order) => {
    setEditOrderId(order.id);
    setFields({
      customer_id: order.customer_id || "",
      status:      order.status,
      date:        order.date,
      items:       (order.details || []).map((d) => ({
        product_id: d.product_id,
        name:       d.product?.name || "",
        price:      d.price,
        quantity:   d.quantity
      }))
    });
    setShowModal(true);
  };

  // ── Guardar ──
  const saveOrder = () => {
    if (!fields.customer_id) { alert("Select a customer"); return; }
    if (fields.items.length === 0) { alert("Add at least one product"); return; }

    setSaving(true);

    const payload = {
      customer_id: Number(fields.customer_id),
      status:      fields.status,
      date:        fields.date,
      items:       fields.items.map((i) => ({
        product_id: i.product_id,
        quantity:   i.quantity,
        price:      i.price
      }))
    };

    const request = editOrderId
      ? api.put(`/orders/${editOrderId}`, payload)
      : api.post("/orders", payload);

    request
      .then(() => { setShowModal(false); fetchAll(); })
      .catch((err) => alert(err.response?.data?.message || "Could not save order."))
      .finally(() => setSaving(false));
  };

  // ── Eliminar ──
  const deleteOrder = (id) => {
    if (!window.confirm("Are you sure you want to delete this order?")) return;
    api.delete(`/orders/${id}`)
      .then(() => fetchAll())
      .catch((err) => alert(err.response?.data?.message || "Could not delete order."));
  };

  return (
    <div>

      {/* Fila 1: Título + Search + Filtro + Botón */}
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
        <div>
          <h1>Orders</h1>
          <p style={{ color: "#64748b", margin: 0 }}>Manage your online orders</p>
        </div>
        <div className="d-flex flex-wrap gap-2">

          <input type="text" placeholder="Search order..."
            value={search} onChange={(e) => setSearch(e.target.value)}
            style={{ padding: "10px 14px", borderRadius: "10px", border: "1px solid #cbd5e1", outline: "none", minWidth: "180px" }}
          />

          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}
            style={{ padding: "10px 14px", borderRadius: "10px", border: "1px solid #cbd5e1", outline: "none", background: "white", cursor: "pointer" }}
          >
            <option value="All">All Statuses</option>
            {ALL_STATUSES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>

          {canCreate && (
            <button onClick={openNew} style={{
              background: "#dbeafe", color: "#1d4ed8", border: "none",
              padding: "10px 18px", borderRadius: "10px", fontWeight: "600",
              cursor: "pointer", display: "flex", alignItems: "center", gap: "6px", whiteSpace: "nowrap"
            }}>
              <BsPlus size={18} /> New Order
            </button>
          )}

        </div>
      </div>

      {/* Fila 2: StatCards */}
      <div className="row mb-4">
        <div className="col-6 col-lg-3 mb-3">
          <StatCard title="Total Orders" value={ordersList.length}                color="#0f172a" />
        </div>
        <div className="col-6 col-lg-3 mb-3">
          <StatCard title="Revenue"      value={"$" + totalRevenue.toLocaleString()} color="#16a34a" />
        </div>
        <div className="col-6 col-lg-3 mb-3">
          <StatCard title="Pending"      value={totalPending}                     color="#854d0e" />
        </div>
        <div className="col-6 col-lg-3 mb-3">
          <StatCard title="Delivered"    value={totalDelivered}                   color="#2563eb" />
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
              {["ID", "Customer", "Products", "Total", "Status", "Date", "Actions"].map((h) => (
                <th key={h} style={thStyle}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="7" className="text-center py-4 text-muted">Loading...</td></tr>
            ) : filteredOrders.length > 0 ? (
              filteredOrders.map((order) => (
                <tr key={order.id} style={{ borderBottom: "1px solid #f1f5f9" }}>

                  <td style={tdStyle}>
                    <span style={{ color: "#94a3b8", fontWeight: "500" }}>#{order.id}</span>
                  </td>

                  <td style={{ ...tdStyle, fontWeight: "500", color: "#0f172a" }}>
                    {order.customer?.name || "—"}
                  </td>

                  <td style={{ ...tdStyle, color: "#475569", fontSize: "13px" }}>
                    {(order.details || []).map((d) => (
                      <div key={d.id}>{d.product?.name || "—"} × {d.quantity}</div>
                    ))}
                  </td>

                  <td style={{ ...tdStyle, fontWeight: "600" }}>
                    ${Number(order.total || 0).toLocaleString()}
                  </td>

                  <td style={tdStyle}>
                    <StatusBadge status={order.status} />
                  </td>

                  <td style={{ ...tdStyle, color: "#64748b" }}>{order.date}</td>

                  <td style={tdStyle}>
                    <div style={{ display: "flex", gap: "8px" }}>
                      {canEdit && (
                        <button onClick={() => editOrder(order)} style={{ background: "#dbeafe", color: "#1d4ed8", border: "none", borderRadius: "8px", padding: "6px 10px", cursor: "pointer", display: "flex", alignItems: "center" }}>
                          <BsPencilSquare />
                        </button>
                      )}
                      {canDelete && (
                        <button onClick={() => deleteOrder(order.id)} style={{ background: "#fee2e2", color: "#b91c1c", border: "none", borderRadius: "8px", padding: "6px 10px", cursor: "pointer", display: "flex", alignItems: "center" }}>
                          <BsTrash />
                        </button>
                      )}
                    </div>
                  </td>

                </tr>
              ))
            ) : (
              <tr><td colSpan="7" className="text-center py-4 text-muted">No orders found.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      <OrderModal
        showModal={showModal}
        setShowModal={setShowModal}
        isEditing={!!editOrderId}
        fields={fields}
        setFields={setFields}
        onSave={saveOrder}
        saving={saving}
        customers={customers}
        products={products}
      />

    </div>
  );
}

const thStyle = { textAlign: "left", padding: "15px", color: "#94a3b8", fontWeight: "600", fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.5px" };
const tdStyle = { padding: "15px" };

export default Orders;