import { useEffect, useState } from "react";
import StatCard from "../components/StatCard";
import { BsPlus, BsPencilSquare, BsTrash, BsDashCircle } from "react-icons/bs";
import api from "../api/client";
import { usePermission } from "../hooks/usePermission";

const RETURN_REASONS = ["Defective", "Wrong Item", "Changed Mind", "Damaged in Shipping", "Other"];
const ALL_STATUSES = ["Pending", "Approved", "Rejected"];

const STATUS_STYLES = {
  Pending:  { background: "#fef9c3", color: "#854d0e" },
  Approved: { background: "#dcfce7", color: "#166534" },
  Rejected: { background: "#fee2e2", color: "#991b1b" },
};

// ── Helpers ──────────────────────────────────────────────────────
const totalUnitsReturned = (returns) =>
  returns.reduce((s, r) => s + r.details.reduce((si, d) => si + d.qty, 0), 0);

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
function CustomerReturnModal({ showModal, setShowModal, isEditing, fields, setFields, onSave, saving, customers, products, sales, orders }) {

  const [selectedId, setSelectedId] = useState(products[0]?.id || "");
  const [qty, setQty]               = useState(1);
  const [reason, setReason]         = useState(RETURN_REASONS[0]);

  if (!showModal) return null;

  // Solo tiene sentido devolver de algo que ya se completó/entregó
  const completedSales = sales.filter((s) => s.status === "Completed");
  const deliveredOrders = orders.filter((o) => o.status === "Delivered");

  // ── Vincular a la venta/pedido de origen: auto-rellena cliente y
  // productos. Cantidad y motivo siguen siendo editables por línea. ──
  const linkSource = (value) => {
    if (!value) {
      setFields({ ...fields, sale_id: "", order_id: "" });
      return;
    }

    const [type, id] = value.split(":");

    if (type === "sale") {
      const sale = sales.find((s) => s.id === Number(id));
      if (!sale) return;
      setFields({
        ...fields,
        sale_id: sale.id,
        order_id: "",
        customer_id: sale.customer_id || "",
        items: sale.details.map((d) => {
          const liveStock = products.find((p) => p.id === d.product_id)?.stock ?? 0;
          return {
            productId: d.product_id, name: d.product?.name || "—", reason: RETURN_REASONS[0],
            qty: d.quantity, stockBefore: liveStock, stockAfter: liveStock + d.quantity
          };
        })
      });
    } else {
      const order = orders.find((o) => o.id === Number(id));
      if (!order) return;
      setFields({
        ...fields,
        sale_id: "",
        order_id: order.id,
        customer_id: order.customer_id,
        items: order.details.map((d) => {
          const liveStock = products.find((p) => p.id === d.product_id)?.stock ?? 0;
          return {
            productId: d.product_id, name: d.product?.name || "—", reason: RETURN_REASONS[0],
            qty: d.quantity, stockBefore: liveStock, stockAfter: liveStock + d.quantity
          };
        })
      });
    }
  };

  const linkedValue = fields.sale_id ? `sale:${fields.sale_id}` : fields.order_id ? `order:${fields.order_id}` : "";

  const addItem = () => {
    const product = products.find((p) => p.id === Number(selectedId));
    if (!product) return;

    const exists = fields.items.find((i) => i.productId === product.id);
    if (exists) {
      setFields({
        ...fields,
        items: fields.items.map((i) =>
          i.productId === product.id
            ? { ...i, qty: i.qty + Number(qty), stockAfter: i.stockBefore + (i.qty + Number(qty)) }
            : i
        )
      });
    } else {
      setFields({
        ...fields,
        items: [...fields.items, {
          productId: product.id, name: product.name, reason,
          qty: Number(qty), stockBefore: product.stock, stockAfter: product.stock + Number(qty)
        }]
      });
    }
    setQty(1);
  };

  const removeItem = (productId) =>
    setFields({ ...fields, items: fields.items.filter((i) => i.productId !== productId) });

  const changeQty = (productId, newQty) => {
    if (newQty < 1) return;
    setFields({
      ...fields,
      items: fields.items.map((i) =>
        i.productId === productId
          ? { ...i, qty: Number(newQty), stockAfter: i.stockBefore + Number(newQty) }
          : i
      )
    });
  };

  const changeReason = (productId, newReason) => {
    setFields({
      ...fields,
      items: fields.items.map((i) =>
        i.productId === productId ? { ...i, reason: newReason } : i
      )
    });
  };

  return (
    <div className="modal d-block" tabIndex="-1" style={{ background: "rgba(0,0,0,0.5)" }}>
      <div className="modal-dialog modal-lg">
        <div className="modal-content" style={{ borderRadius: "16px", border: "none" }}>

          <div className="modal-header" style={{ borderBottom: "1px solid #f1f5f9" }}>
            <h5 className="modal-title" style={{ fontWeight: "600" }}>
              {isEditing ? "Edit Customer Return" : "New Customer Return"}
            </h5>
            <button className="btn-close" onClick={() => setShowModal(false)} />
          </div>

          <div className="modal-body">

            {!isEditing && (completedSales.length > 0 || deliveredOrders.length > 0) && (
              <div className="mb-4 p-3" style={{ background: "#fef2f2", borderRadius: "10px", border: "1px solid #fecaca" }}>
                <label className="form-label" style={{ fontWeight: "600", fontSize: "13px", color: "#b91c1c" }}>
                  Link to Sale or Order (optional)
                </label>
                <select className="form-select form-select-sm" style={{ borderRadius: "8px" }}
                  value={linkedValue}
                  onChange={(e) => linkSource(e.target.value)}
                >
                  <option value="">— Manual return, not linked —</option>
                  {completedSales.length > 0 && (
                    <optgroup label="Sales (POS)">
                      {completedSales.map((s) => (
                        <option key={`sale:${s.id}`} value={`sale:${s.id}`}>
                          Sale #{s.id} — {s.customer?.name || "Walk-in Customer"} — ${Number(s.total).toLocaleString()}
                        </option>
                      ))}
                    </optgroup>
                  )}
                  {deliveredOrders.length > 0 && (
                    <optgroup label="Orders">
                      {deliveredOrders.map((o) => (
                        <option key={`order:${o.id}`} value={`order:${o.id}`}>
                          Order #{o.id} — {o.customer?.name || "—"} — ${Number(o.total).toLocaleString()}
                        </option>
                      ))}
                    </optgroup>
                  )}
                </select>
                <small style={{ color: "#991b1b" }}>
                  Fills in the customer and products from that sale/order — adjust quantities and reasons as needed.
                </small>
              </div>
            )}

            <p style={{ fontSize: "12px", fontWeight: "600", color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "12px" }}>
              Return Information
            </p>

            <div className="row mb-4">

              <div className="col-md-4 mb-3">
                <label className="form-label" style={{ fontWeight: "500", fontSize: "14px" }}>Customer</label>
                <select className="form-select" style={{ borderRadius: "10px" }}
                  value={fields.customer_id}
                  onChange={(e) => setFields({ ...fields, customer_id: e.target.value })}
                  disabled={!!(fields.sale_id || fields.order_id)}
                >
                  <option value="">— Select customer —</option>
                  {customers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>

              <div className="col-md-4 mb-3">
                <label className="form-label" style={{ fontWeight: "500", fontSize: "14px" }}>Status</label>
                <select className="form-select" style={{ borderRadius: "10px" }}
                  value={fields.status}
                  onChange={(e) => setFields({ ...fields, status: e.target.value })}
                >
                  {ALL_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              <div className="col-md-4 mb-3">
                <label className="form-label" style={{ fontWeight: "500", fontSize: "14px" }}>Date</label>
                <input type="date" className="form-control" style={{ borderRadius: "10px" }}
                  value={fields.date}
                  onChange={(e) => setFields({ ...fields, date: e.target.value })}
                />
              </div>

              <div className="col-12 mb-3">
                <label className="form-label" style={{ fontWeight: "500", fontSize: "14px" }}>Note (optional)</label>
                <input type="text" className="form-control" style={{ borderRadius: "10px" }}
                  placeholder="Additional details..."
                  value={fields.note}
                  onChange={(e) => setFields({ ...fields, note: e.target.value })}
                />
              </div>

            </div>

            <p style={{ fontSize: "12px", fontWeight: "600", color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "12px" }}>
              Products to Return
            </p>

            {!(fields.sale_id || fields.order_id) && (
              <div className="d-flex flex-wrap gap-2 align-items-end mb-3 p-3"
                style={{ background: "#f8fafc", borderRadius: "10px", border: "1px solid #e2e8f0" }}
              >
                <div style={{ flex: 2, minWidth: "140px" }}>
                  <label style={{ fontSize: "12px", color: "#64748b", fontWeight: "500", display: "block", marginBottom: "4px" }}>Product</label>
                  <select className="form-select form-select-sm" style={{ borderRadius: "8px" }}
                    value={selectedId} onChange={(e) => setSelectedId(e.target.value)}
                  >
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>{p.name} (stock: {p.stock})</option>
                    ))}
                  </select>
                </div>

                <div style={{ minWidth: "130px" }}>
                  <label style={{ fontSize: "12px", color: "#64748b", fontWeight: "500", display: "block", marginBottom: "4px" }}>Reason</label>
                  <select className="form-select form-select-sm" style={{ borderRadius: "8px" }}
                    value={reason} onChange={(e) => setReason(e.target.value)}
                  >
                    {RETURN_REASONS.map((r) => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>

                <div style={{ width: "80px" }}>
                  <label style={{ fontSize: "12px", color: "#64748b", fontWeight: "500", display: "block", marginBottom: "4px" }}>Qty</label>
                  <input type="number" className="form-control form-control-sm" style={{ borderRadius: "8px" }}
                    min="1" value={qty} onChange={(e) => setQty(e.target.value)}
                  />
                </div>

                <div>
                  <button onClick={addItem} style={{
                    background: "#fee2e2", color: "#b91c1c", border: "none",
                    padding: "7px 16px", borderRadius: "8px", fontWeight: "600",
                    cursor: "pointer", display: "flex", alignItems: "center", gap: "5px"
                  }}>
                    <BsPlus size={16} /> Add
                  </button>
                </div>
              </div>
            )}

            <div style={{ border: "1px solid #e2e8f0", borderRadius: "10px", overflow: "hidden" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
                    {["Product", "Reason", "Stock Before", "Qty Return", "Stock After", ""].map((h) => (
                      <th key={h} style={{ padding: "10px 14px", textAlign: "left", fontSize: "11px", fontWeight: "600", color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.5px" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {fields.items.length > 0 ? (
                    fields.items.map((item) => (
                      <tr key={item.productId} style={{ borderBottom: "1px solid #f1f5f9" }}>

                        <td style={{ padding: "10px 14px", fontWeight: "500", color: "#0f172a" }}>{item.name}</td>

                        <td style={{ padding: "10px 14px" }}>
                          <select value={item.reason} onChange={(e) => changeReason(item.productId, e.target.value)}
                            style={{ padding: "3px 8px", borderRadius: "6px", border: "1px solid #e2e8f0", fontSize: "12px" }}
                          >
                            {RETURN_REASONS.map((r) => <option key={r} value={r}>{r}</option>)}
                          </select>
                        </td>

                        <td style={{ padding: "10px 14px" }}>
                          <span style={{ background: "#f1f5f9", color: "#475569", padding: "3px 10px", borderRadius: "20px", fontSize: "13px", fontWeight: "500" }}>
                            {item.stockBefore}
                          </span>
                        </td>

                        <td style={{ padding: "10px 14px" }}>
                          <input type="number" min="1" value={item.qty}
                            onChange={(e) => changeQty(item.productId, e.target.value)}
                            style={{ width: "70px", padding: "4px 8px", borderRadius: "6px", border: "1px solid #e2e8f0", outline: "none", textAlign: "center" }}
                          />
                        </td>

                        <td style={{ padding: "10px 14px" }}>
                          <span style={{ background: "#dcfce7", color: "#166534", padding: "3px 10px", borderRadius: "20px", fontSize: "13px", fontWeight: "600" }}>
                            {item.stockAfter}
                          </span>
                        </td>

                        <td style={{ padding: "10px 14px" }}>
                          {!(fields.sale_id || fields.order_id) && (
                            <button onClick={() => removeItem(item.productId)} style={{
                              background: "#fee2e2", color: "#b91c1c", border: "none",
                              borderRadius: "6px", padding: "4px 8px", cursor: "pointer", display: "flex", alignItems: "center"
                            }}>
                              <BsDashCircle size={14} />
                            </button>
                          )}
                        </td>

                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="6" style={{ padding: "20px", textAlign: "center", color: "#94a3b8", fontSize: "13px" }}>
                        No products added yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

          </div>

          <div className="modal-footer" style={{ borderTop: "1px solid #f1f5f9" }}>
            <button className="btn btn-light" style={{ borderRadius: "10px" }} onClick={() => setShowModal(false)}>
              Cancel
            </button>
            <button onClick={onSave} disabled={saving} style={{
              background: saving ? "#fecaca" : "#fee2e2", color: "#b91c1c", border: "none",
              padding: "8px 20px", borderRadius: "10px", fontWeight: "600", cursor: saving ? "default" : "pointer"
            }}>
              {saving ? "Saving..." : "Save Return"}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}

// ── Página principal ─────────────────────────────────────────────
function CustomerReturns() {

  const canManage = usePermission("returns.manage");

  const [returnsList, setReturnsList]   = useState([]);
  const [customers, setCustomers]       = useState([]);
  const [products, setProducts]         = useState([]);
  const [sales, setSales]               = useState([]);
  const [orders, setOrders]             = useState([]);
  const [loading, setLoading]           = useState(true);
  const [loadError, setLoadError]        = useState("");
  const [saving, setSaving]             = useState(false);

  const [search, setSearch]             = useState("");
  const [filterStatus, setFilterStatus] = useState("All");
  const [showModal, setShowModal]       = useState(false);
  const [editReturnId, setEditReturnId] = useState(null);
  const [fields, setFields]             = useState({
    customer_id: "", sale_id: "", order_id: "", status: "Pending",
    date: new Date().toISOString().split("T")[0], note: "", items: []
  });

  // ── Cargar desde la API ──
  const fetchAll = () => {
    Promise.all([
      api.get("/customer-returns"),
      api.get("/customers"),
      api.get("/products"),
      api.get("/sales"),
      api.get("/orders")
    ])
      .then(([returnsRes, customersRes, productsRes, salesRes, ordersRes]) => {
        setReturnsList(returnsRes.data);
        setCustomers(customersRes.data);
        setProducts(productsRes.data);
        setSales(salesRes.data);
        setOrders(ordersRes.data);
        setLoadError("");
      })
      .catch(() => setLoadError("Could not load customer returns. Is the backend running?"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchAll();
  }, []);

  // ── Stats ──
  const totalReturned = totalUnitsReturned(returnsList);
  const totalPending  = returnsList.filter((r) => r.status === "Pending").length;
  const totalApproved = returnsList.filter((r) => r.status === "Approved").length;

  // ── Filtrado ──
  const filteredReturns = returnsList.filter((r) => {
    const matchSearch =
      (r.customer?.name || "").toLowerCase().includes(search.toLowerCase()) ||
      r.details.some((d) => (d.product?.name || "").toLowerCase().includes(search.toLowerCase()));
    const matchStatus = filterStatus === "All" || r.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const openNew = () => {
    setEditReturnId(null);
    setFields({ customer_id: "", sale_id: "", order_id: "", status: "Pending", date: new Date().toISOString().split("T")[0], note: "", items: [] });
    setShowModal(true);
  };

  const editReturn = (r) => {
    setEditReturnId(r.id);
    setFields({
      customer_id: r.customer_id,
      sale_id: r.sale_id || "",
      order_id: r.order_id || "",
      status: r.status,
      date: r.date,
      note: r.note || "",
      items: r.details.map((d) => ({
        productId: d.product_id, name: d.product?.name || "—", reason: d.reason,
        qty: d.qty, stockBefore: d.stock_before, stockAfter: d.stock_after
      }))
    });
    setShowModal(true);
  };

  const saveReturn = () => {
    if (!fields.customer_id) { alert("Select a customer"); return; }
    if (fields.items.length === 0) { alert("Add at least one product"); return; }

    setSaving(true);

    const payload = {
      customer_id: Number(fields.customer_id),
      sale_id: fields.sale_id ? Number(fields.sale_id) : null,
      order_id: fields.order_id ? Number(fields.order_id) : null,
      status: fields.status,
      date: fields.date,
      note: fields.note || null,
      items: fields.items.map((i) => ({
        product_id: i.productId, reason: i.reason, qty: i.qty
      }))
    };

    const request = editReturnId
      ? api.put(`/customer-returns/${editReturnId}`, payload)
      : api.post("/customer-returns", payload);

    request
      .then(() => {
        setShowModal(false);
        fetchAll();
      })
      .catch((err) => alert(err.response?.data?.message || "Could not save return."))
      .finally(() => setSaving(false));
  };

  const deleteReturn = (id) => {
  if (!window.confirm("Are you sure you want to delete this return?")) return;

    api.delete(`/customer-returns/${id}`)
      .then(() => fetchAll())
      .catch((err) => alert(err.response?.data?.message || "Could not delete return."));
  };

  return (
    <div>

      <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
        <div>
          <h1>Customer Returns</h1>
          <p style={{ color: "#64748b", margin: 0 }}>Manage product returns from customers</p>
        </div>
        <div className="d-flex flex-wrap gap-2">

          <input type="text" placeholder="Search return..."
            value={search} onChange={(e) => setSearch(e.target.value)}
            style={{ padding: "10px 14px", borderRadius: "10px", border: "1px solid #cbd5e1", outline: "none", minWidth: "180px" }}
          />

          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}
            style={{ padding: "10px 14px", borderRadius: "10px", border: "1px solid #cbd5e1", outline: "none", background: "white", cursor: "pointer" }}
          >
            <option value="All">All Statuses</option>
            {ALL_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
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

      <div className="row mb-4">
        <div className="col-6 col-lg-3 mb-3">
          <StatCard title="Total Returns" value={returnsList.length} color="#0f172a" />
        </div>
        <div className="col-6 col-lg-3 mb-3">
          <StatCard title="Units Returned" value={totalReturned} color="#dc2626" />
        </div>
        <div className="col-6 col-lg-3 mb-3">
          <StatCard title="Pending" value={totalPending} color="#854d0e" />
        </div>
        <div className="col-6 col-lg-3 mb-3">
          <StatCard title="Approved" value={totalApproved} color="#16a34a" />
        </div>
      </div>

      {loadError && (
        <div style={{ background: "#fee2e2", color: "#b91c1c", padding: "12px 16px", borderRadius: "10px", marginBottom: "16px" }}>
          {loadError}
        </div>
      )}

      <div style={{ background: "white", borderRadius: "15px", padding: "20px", boxShadow: "0 2px 10px rgba(0,0,0,0.05)", overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid #e2e8f0" }}>
              {["ID", "Customer", "Source", "Products", "Units", "Status", "Date", "Actions"].map((h) => (
                <th key={h} style={thStyle}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="8" className="text-center py-4 text-muted">Loading...</td>
              </tr>
            ) : filteredReturns.length > 0 ? (
              filteredReturns.map((r) => (
                <tr key={r.id} style={{ borderBottom: "1px solid #f1f5f9" }}>

                  <td style={tdStyle}><span style={{ color: "#94a3b8", fontWeight: "500" }}>#{r.id}</span></td>

                  <td style={{ ...tdStyle, fontWeight: "600", color: "#0f172a" }}>{r.customer?.name || "—"}</td>

                  <td style={{ ...tdStyle, color: "#475569", fontSize: "13px" }}>
                    {r.sale_id ? `Sale #${r.sale_id}` : r.order_id ? `Order #${r.order_id}` : "Manual"}
                  </td>

                  <td style={{ ...tdStyle, color: "#475569", fontSize: "13px" }}>
                    {r.details.map((d) => (
                      <div key={d.id}>{d.product?.name || "—"} × {d.qty} <span style={{ color: "#94a3b8" }}>({d.reason})</span></div>
                    ))}
                  </td>

                  <td style={tdStyle}>
                    <span style={{ background: "#fee2e2", color: "#b91c1c", padding: "3px 12px", borderRadius: "20px", fontSize: "13px", fontWeight: "600" }}>
                      +{r.details.reduce((s, d) => s + d.qty, 0)}
                    </span>
                  </td>

                  <td style={tdStyle}><StatusBadge status={r.status} /></td>

                  <td style={{ ...tdStyle, color: "#64748b" }}>{r.date}</td>

                  <td style={tdStyle}>
                    {r.status === "Pending" && canManage ? (
                      <div style={{ display: "flex", gap: "8px" }}>
                        <button onClick={() => editReturn(r)} style={{ background: "#dbeafe", color: "#1d4ed8", border: "none", borderRadius: "8px", padding: "6px 10px", cursor: "pointer", display: "flex", alignItems: "center" }}>
                          <BsPencilSquare />
                        </button>
                        <button onClick={() => deleteReturn(r.id)} style={{ background: "#fee2e2", color: "#b91c1c", border: "none", borderRadius: "8px", padding: "6px 10px", cursor: "pointer", display: "flex", alignItems: "center" }}>
                          <BsTrash />
                        </button>
                      </div>
                    ) : canManage ? (
                      <span style={{ color: "#94a3b8", fontSize: "12px", fontStyle: "italic" }}>Locked</span>
                    ) : (
                      <span style={{ color: "#cbd5e1", fontSize: "12px" }}>—</span>
                    )}
                  </td>

                </tr>
              ))
            ) : (
              <tr><td colSpan="8" className="text-center py-4 text-muted">No returns found.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <CustomerReturnModal
        showModal={showModal}
        setShowModal={setShowModal}
        isEditing={!!editReturnId}
        fields={fields}
        setFields={setFields}
        onSave={saveReturn}
        saving={saving}
        customers={customers}
        products={products}
        sales={sales}
        orders={orders}
      />

    </div>
  );
}

const thStyle = { textAlign: "left", padding: "15px", color: "#94a3b8", fontWeight: "600", fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.5px" };
const tdStyle = { padding: "15px" };

export default CustomerReturns;