import { useEffect, useState } from "react";
import StatCard from "../components/StatCard";
import { BsPlus, BsPencilSquare, BsTrash, BsDashCircle, BsArrowCounterclockwise } from "react-icons/bs";
import api from "../api/client";
import { usePermission } from "../hooks/usePermission";

const PAYMENT_METHODS = ["Cash", "Credit Card", "Debit Card", "Transfer"];
const ALL_STATUSES = ["Pending", "Completed", "Refunded"];
const EDITABLE_STATUSES = ["Pending", "Completed"]; // Refunded solo vía refund()

const STATUS_STYLES = {
  Pending:   { background: "#fef9c3", color: "#854d0e" },
  Completed: { background: "#dcfce7", color: "#166534" },
  Refunded:  { background: "#fee2e2", color: "#991b1b" },
};

// ── Helpers ──────────────────────────────────────────────────────
const calcTotal = (items = []) =>
  items.reduce((sum, i) => sum + Number(i.price) * i.quantity, 0);

// ── Badge ────────────────────────────────────────────────────────
function StatusBadge({ status }) {
  const style = STATUS_STYLES[status] || {};
  return (
    <span style={{ display: "inline-block", padding: "4px 12px", borderRadius: "20px", fontSize: "12px", fontWeight: "600", ...style }}>
      {status}
    </span>
  );
}

// ── Modal POS ────────────────────────────────────────────────────
function SaleModal({ showModal, setShowModal, isEditing, fields, setFields, onSave, saving, customers, products }) {

  // Hooks SIEMPRE antes de cualquier return condicional.
  const [selectedId, setSelectedId] = useState(products[0]?.id || "");
  const [qty, setQty]               = useState(1);

  useEffect(() => {
    if (showModal && products.length > 0) {
      setSelectedId(products.find((p) => p.stock > 0)?.id || "");
    }
  }, [showModal, products]);

  if (!showModal) return null;

  const total  = calcTotal(fields.items);
  const paid   = Number(fields.amount_paid) || 0;
  const change = paid - total;

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
        items: [...fields.items, { product_id: product.id, name: product.name, price: product.price, quantity: Number(qty) }]
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
              {isEditing ? "Edit Sale" : "New Sale / POS"}
            </h5>
            <button className="btn-close" onClick={() => setShowModal(false)} />
          </div>

          <div className="modal-body">

            <p style={{ fontSize: "12px", fontWeight: "600", color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "12px" }}>
              Sale Information
            </p>

            <div className="row mb-4">

              <div className="col-md-3 mb-3">
                <label className="form-label" style={{ fontWeight: "500", fontSize: "14px" }}>Customer</label>
                <select className="form-select" style={{ borderRadius: "10px" }}
                  value={fields.customer_id}
                  onChange={(e) => setFields({ ...fields, customer_id: e.target.value })}
                >
                  <option value="">— Walk-in Customer —</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div className="col-md-3 mb-3">
                <label className="form-label" style={{ fontWeight: "500", fontSize: "14px" }}>Payment Method</label>
                <select className="form-select" style={{ borderRadius: "10px" }}
                  value={fields.payment_method}
                  onChange={(e) => setFields({ ...fields, payment_method: e.target.value })}
                >
                  {PAYMENT_METHODS.map((m) => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>

              <div className="col-md-3 mb-3">
                <label className="form-label" style={{ fontWeight: "500", fontSize: "14px" }}>Status</label>
                <select className="form-select" style={{ borderRadius: "10px" }}
                  value={fields.status}
                  onChange={(e) => setFields({ ...fields, status: e.target.value })}
                >
                  {EDITABLE_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
                <small className="text-muted">"Refunded" se hace desde la tabla, no aquí</small>
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

            <div className="d-flex flex-wrap gap-2 align-items-end mb-3 p-3"
              style={{ background: "#f8fafc", borderRadius: "10px", border: "1px solid #e2e8f0" }}
            >
              <div style={{ flex: 2, minWidth: "160px" }}>
                <label style={{ fontSize: "12px", color: "#64748b", fontWeight: "500", display: "block", marginBottom: "4px" }}>Product</label>
                <select className="form-select form-select-sm" style={{ borderRadius: "8px" }}
                  value={selectedId} onChange={(e) => setSelectedId(e.target.value)}
                >
                  {products.filter((p) => p.stock > 0).map((p) => (
                    <option key={p.id} value={p.id}>{p.name} — ${Number(p.price).toLocaleString()} (stock: {p.stock})</option>
                  ))}
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
                  background: "#dbeafe", color: "#1d4ed8", border: "none",
                  padding: "7px 16px", borderRadius: "8px", fontWeight: "600",
                  cursor: "pointer", display: "flex", alignItems: "center", gap: "5px"
                }}>
                  <BsPlus size={16} /> Add
                </button>
              </div>
            </div>

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
                        <td style={{ padding: "10px 14px", fontWeight: "500", color: "#0f172a" }}>{item.name}</td>
                        <td style={{ padding: "10px 14px", color: "#475569" }}>${Number(item.price).toLocaleString()}</td>
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

            <div className="row mt-3">
              <div className="col-md-6 mt-2">
                <label className="form-label" style={{ fontWeight: "500", fontSize: "14px" }}>Amount Paid ($)</label>
                <input type="number" className="form-control" style={{ borderRadius: "10px", fontSize: "18px", fontWeight: "600" }}
                  min="0" placeholder="0.00"
                  value={fields.amount_paid}
                  onChange={(e) => setFields({ ...fields, amount_paid: e.target.value })}
                />
              </div>
              <div className="col-md-6 mt-2">
                <div style={{ display: "flex", flexDirection: "column", gap: "6px", paddingTop: "4px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 12px", background: "#f8fafc", borderRadius: "8px" }}>
                    <span style={{ color: "#64748b", fontWeight: "500" }}>Subtotal</span>
                    <span style={{ fontWeight: "600" }}>${total.toLocaleString()}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 12px", background: "#f8fafc", borderRadius: "8px" }}>
                    <span style={{ color: "#64748b", fontWeight: "500" }}>Paid</span>
                    <span style={{ fontWeight: "600", color: "#2563eb" }}>${paid.toLocaleString()}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 14px", background: change >= 0 ? "#dcfce7" : "#fee2e2", borderRadius: "10px" }}>
                    <span style={{ fontWeight: "700", color: change >= 0 ? "#166534" : "#991b1b" }}>
                      {change >= 0 ? "Change" : "Remaining"}
                    </span>
                    <span style={{ fontSize: "20px", fontWeight: "700", color: change >= 0 ? "#16a34a" : "#dc2626" }}>
                      ${Math.abs(change).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>

          </div>

          <div className="modal-footer" style={{ borderTop: "1px solid #f1f5f9" }}>
            <button className="btn btn-light" style={{ borderRadius: "10px" }} onClick={() => setShowModal(false)}>
              Cancel
            </button>
            <button onClick={onSave} disabled={saving} style={{
              background: saving ? "#bbf7d0" : "#dcfce7", color: "#166534", border: "none",
              padding: "8px 20px", borderRadius: "10px", fontWeight: "600", cursor: saving ? "default" : "pointer"
            }}>
              {saving ? "Saving..." : "Save Sale"}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}

// ── Página principal ─────────────────────────────────────────────
function Sales() {

  const canView = usePermission("sales.view");
  const canManage = usePermission("sales.manage");

  const [salesList, setSalesList]       = useState([]);
  const [customers, setCustomers]       = useState([]);
  const [products, setProducts]         = useState([]);
  const [loading, setLoading]           = useState(true);
  const [loadError, setLoadError]        = useState("");
  const [saving, setSaving]             = useState(false);

  const [search, setSearch]             = useState("");
  const [filterStatus, setFilterStatus] = useState("All");
  const [showModal, setShowModal]       = useState(false);
  const [editSaleId, setEditSaleId]     = useState(null);
  const [fields, setFields]             = useState({
    customer_id: "", payment_method: "Cash", status: "Completed",
    date: new Date().toISOString().split("T")[0], amount_paid: "", items: []
  });

  const fetchAll = () => {
    Promise.all([api.get("/sales"), api.get("/customers"), api.get("/products")])
      .then(([salesRes, customersRes, productsRes]) => {
        setSalesList(salesRes.data);
        setCustomers(customersRes.data);
        setProducts(productsRes.data);
        setLoadError("");
      })
      .catch(() => setLoadError("Could not load sales. Is the backend running?"))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchAll(); }, []);

  const totalRevenue  = salesList.filter((s) => s.status === "Completed").reduce((sum, s) => sum + Number(s.total), 0);
  const totalCompleted = salesList.filter((s) => s.status === "Completed").length;
  const totalRefunded  = salesList.filter((s) => s.status === "Refunded").length;

  const filteredSales = salesList.filter((s) => {
    const customerName = s.customer?.name || "Walk-in Customer";
    const matchSearch =
      customerName.toLowerCase().includes(search.toLowerCase()) ||
      (s.details || []).some((d) => (d.product?.name || "").toLowerCase().includes(search.toLowerCase()));
    const matchStatus = filterStatus === "All" || s.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const openNew = () => {
    setEditSaleId(null);
    setFields({ customer_id: "", payment_method: "Cash", status: "Completed", date: new Date().toISOString().split("T")[0], amount_paid: "", items: [] });
    setShowModal(true);
  };

  const editSale = (s) => {
    if (s.status !== "Pending") return; // defensa extra
    setEditSaleId(s.id);
    setFields({
      customer_id: s.customer_id || "",
      payment_method: s.payment_method,
      status: s.status,
      date: s.date,
      amount_paid: s.amount_paid,
      items: (s.details || []).map((d) => ({
        product_id: d.product_id, name: d.product?.name || "", price: d.price, quantity: d.quantity
      }))
    });
    setShowModal(true);
  };

  const saveSale = () => {
    if (fields.items.length === 0) { alert("Add at least one product"); return; }

    setSaving(true);

    const payload = {
      customer_id: fields.customer_id ? Number(fields.customer_id) : null,
      payment_method: fields.payment_method,
      status: fields.status,
      date: fields.date,
      amount_paid: Number(fields.amount_paid) || 0,
      items: fields.items.map((i) => ({ product_id: i.product_id, quantity: i.quantity, price: i.price }))
    };

    const request = editSaleId
      ? api.put(`/sales/${editSaleId}`, payload)
      : api.post("/sales", payload);

    request
      .then(() => { setShowModal(false); fetchAll(); })
      .catch((err) => {
        const itemsError = err.response?.data?.errors?.items?.[0];
        const paidError = err.response?.data?.errors?.amount_paid?.[0];
        alert(itemsError || paidError || err.response?.data?.message || "Could not save sale.");
      })
      .finally(() => setSaving(false));
  };

  const deleteSale = (id) => {
    if (!window.confirm("Are you sure you want to delete this sale?")) return;
    api.delete(`/sales/${id}`)
      .then(() => fetchAll())
      .catch((err) => alert(err.response?.data?.message || "Could not delete sale."));
  };

  const refundSale = (id) => {
    if (!window.confirm("Refund this sale? This will restock the items sold.")) return;
    api.post(`/sales/${id}/refund`)
      .then(() => fetchAll())
      .catch((err) => alert(err.response?.data?.message || "Could not refund sale."));
  };

  return (
    <div>

      <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
        <div>
          <h1>Sales / POS</h1>
          <p style={{ color: "#64748b", margin: 0 }}>In-store point of sale</p>
        </div>
        <div className="d-flex flex-wrap gap-2">
          <input type="text" placeholder="Search sale..."
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
            background: "#dcfce7", color: "#166534", border: "none",
            padding: "10px 18px", borderRadius: "10px", fontWeight: "600",
            cursor: "pointer", display: "flex", alignItems: "center", gap: "6px", whiteSpace: "nowrap"
          }}>
            <BsPlus size={18} /> New Sale
          </button>
          )}
        </div>
      </div>

      <div className="row mb-4">
        <div className="col-6 col-lg-3 mb-3">
          <StatCard title="Total Sales" value={salesList.length}                    color="#0f172a" />
        </div>
        <div className="col-6 col-lg-3 mb-3">
          <StatCard title="Revenue"     value={"$" + totalRevenue.toLocaleString()}  color="#16a34a" />
        </div>
        <div className="col-6 col-lg-3 mb-3">
          <StatCard title="Completed"   value={totalCompleted}                       color="#2563eb" />
        </div>
        <div className="col-6 col-lg-3 mb-3">
          <StatCard title="Refunded"    value={totalRefunded}                        color="#dc2626" />
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
              {["ID", "Customer", "Products", "Total", "Payment", "Status", "Date", "Actions"].map((h) => (
                <th key={h} style={thStyle}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="8" className="text-center py-4 text-muted">Loading...</td></tr>
            ) : filteredSales.length > 0 ? (
              filteredSales.map((s) => (
                <tr key={s.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                  <td style={tdStyle}><span style={{ color: "#94a3b8", fontWeight: "500" }}>#{s.id}</span></td>
                  <td style={{ ...tdStyle, fontWeight: "500", color: "#0f172a" }}>{s.customer?.name || "Walk-in Customer"}</td>
                  <td style={{ ...tdStyle, color: "#475569", fontSize: "13px" }}>
                    {(s.details || []).map((d) => <div key={d.id}>{d.product?.name || "—"} × {d.quantity}</div>)}
                  </td>
                  <td style={{ ...tdStyle, fontWeight: "600", color: "#16a34a" }}>${Number(s.total).toLocaleString()}</td>
                  <td style={tdStyle}>
                    <span style={{ background: "#f1f5f9", color: "#475569", padding: "3px 10px", borderRadius: "20px", fontSize: "12px", fontWeight: "500" }}>
                      {s.payment_method}
                    </span>
                  </td>
                  <td style={tdStyle}><StatusBadge status={s.status} /></td>
                  <td style={{ ...tdStyle, color: "#64748b" }}>{s.date}</td>
                  <td style={tdStyle}>
                    {canManage && s.status === "Pending" && (
                      <div style={{ display: "flex", gap: "8px" }}>
                        <button onClick={() => editSale(s)} style={{ background: "#dbeafe", color: "#1d4ed8", border: "none", borderRadius: "8px", padding: "6px 10px", cursor: "pointer", display: "flex", alignItems: "center" }}>
                          <BsPencilSquare />
                        </button>
                        <button onClick={() => deleteSale(s.id)} style={{ background: "#fee2e2", color: "#b91c1c", border: "none", borderRadius: "8px", padding: "6px 10px", cursor: "pointer", display: "flex", alignItems: "center" }}>
                          <BsTrash />
                        </button>
                      </div>
                    )}
                    {canManage && s.status === "Completed" && (
                      <button onClick={() => refundSale(s.id)} style={{ background: "#fee2e2", color: "#b91c1c", border: "none", borderRadius: "8px", padding: "6px 10px", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", fontWeight: "600" }}>
                        <BsArrowCounterclockwise /> Refund
                      </button>
                    )}
                    {s.status === "Refunded" && (
                      <span style={{ color: "#94a3b8", fontSize: "12px", fontStyle: "italic" }}>Locked</span>
                    )}
                  </td>
                </tr>
              ))
            ) : (
              <tr><td colSpan="8" className="text-center py-4 text-muted">No sales found.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <SaleModal
        showModal={showModal}
        setShowModal={setShowModal}
        isEditing={!!editSaleId}
        fields={fields}
        setFields={setFields}
        onSave={saveSale}
        saving={saving}
        customers={customers}
        products={products}
      />

    </div>
  );
}

const thStyle = { textAlign: "left", padding: "15px", color: "#94a3b8", fontWeight: "600", fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.5px" };
const tdStyle = { padding: "15px" };

export default Sales;