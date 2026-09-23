import { useEffect, useState } from "react";
import StatCard from "../components/StatCard";
import { BsPlus, BsPencilSquare, BsTrash, BsDashCircle } from "react-icons/bs";
import api from "../api/client";
import { usePermission } from "../hooks/usePermission";

const RETURN_REASONS = ["Defective", "Wrong Item", "Excess Stock", "Expired", "Other"];
const ALL_STATUSES = ["Pending", "Confirmed"];

const STATUS_STYLES = {
  Pending: { background: "#fef9c3", color: "#854d0e" },
  Confirmed: { background: "#dcfce7", color: "#166534" },
};

// ── Helpers ──────────────────────────────────────────────────────
const totalUnitsReturned = (returns) =>
  returns.reduce((s, r) => s + r.details.reduce((si, d) => si + d.qty, 0), 0);

// ── Badges ───────────────────────────────────────────────────────
function StatusBadge({ status }) {
  const style = STATUS_STYLES[status] || {};
  return (
    <span style={{ display: "inline-block", padding: "4px 12px", borderRadius: "20px", fontSize: "12px", fontWeight: "600", ...style }}>
      {status}
    </span>
  );
}

// ── Modal ────────────────────────────────────────────────────────
function ReturnModal({ showModal, setShowModal, isEditing, fields, setFields, onSave, saving, purchases }) {

  // Hooks SIEMPRE antes de cualquier return condicional.
  const [selectedProductId, setSelectedProductId] = useState("");
  const [qty, setQty] = useState(1);
  const [reason, setReason] = useState(RETURN_REASONS[0]);

  const receivedPurchases = purchases.filter((p) => p.status === "Received" || p.id === Number(fields.purchase_id));
  const selectedPurchase = purchases.find((p) => p.id === Number(fields.purchase_id));
  const availableProducts = selectedPurchase?.details || [];

  useEffect(() => {
    if (showModal && availableProducts.length > 0 && !selectedProductId) {
      setSelectedProductId(availableProducts[0].product_id);
    }
  }, [showModal, fields.purchase_id]);

  if (!showModal) return null;

  // ── Elegir compra ──
  const handleSelectPurchase = (purchaseId) => {
    const purchase = purchases.find((p) => p.id === Number(purchaseId));
    setSelectedProductId(purchase?.details?.[0]?.product_id || "");
    setFields({
      ...fields,
      purchase_id: purchase ? purchase.id : "",
      items: [] // al cambiar de compra, se reinicia lo agregado
    });
  };

  // ── Agregar producto a la lista ──
  const addItem = () => {
    const purchasedDetail = availableProducts.find((d) => d.product_id === Number(selectedProductId));
    if (!purchasedDetail) return;

    const product = purchasedDetail.product;
    const exists = fields.items.find((i) => i.productId === product.id);

    if (exists) {
      setFields({
        ...fields,
        items: fields.items.map((i) =>
          i.productId === product.id ? { ...i, qty: i.qty + Number(qty) } : i
        )
      });
    } else {
      setFields({
        ...fields,
        items: [...fields.items, {
          productId: product.id,
          name: product.name,
          reason,
          qty: Number(qty),
          purchasedQty: purchasedDetail.quantity,
          currentStock: product.stock
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
        i.productId === productId ? { ...i, qty: Number(newQty) } : i
      )
    });
  };

  return (
    <div className="modal d-block" tabIndex="-1" style={{ background: "rgba(0,0,0,0.5)" }}>
      <div className="modal-dialog modal-lg">
        <div className="modal-content" style={{ borderRadius: "16px", border: "none" }}>

          <div className="modal-header" style={{ borderBottom: "1px solid #f1f5f9" }}>
            <h5 className="modal-title" style={{ fontWeight: "600" }}>
              {isEditing ? "Edit Return" : "New Return to Supplier"}
            </h5>
            <button className="btn-close" onClick={() => setShowModal(false)} />
          </div>

          <div className="modal-body">

            <p style={{ fontSize: "12px", fontWeight: "600", color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "12px" }}>
              Return Information
            </p>

            <div className="row mb-4">

              <div className="col-md-6 mb-3">
                <label className="form-label" style={{ fontWeight: "500", fontSize: "14px" }}>Purchase (Received)</label>
                <select className="form-select" style={{ borderRadius: "10px" }}
                  value={fields.purchase_id}
                  onChange={(e) => handleSelectPurchase(e.target.value)}
                  disabled={isEditing}
                >
                  <option value="">— Select a received purchase —</option>
                  {receivedPurchases.map((p) => (
                    <option key={p.id} value={p.id}>
                      #{p.id} — {p.supplier?.name} (${Number(p.total).toLocaleString()})
                    </option>
                  ))}
                </select>
                {isEditing && (
                  <small className="text-muted">La compra no se puede cambiar al editar</small>
                )}
              </div>

              <div className="col-md-3 mb-3">
                <label className="form-label" style={{ fontWeight: "500", fontSize: "14px" }}>Status</label>
                <select className="form-select" style={{ borderRadius: "10px" }}
                  value={fields.status}
                  onChange={(e) => setFields({ ...fields, status: e.target.value })}
                >
                  {ALL_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              <div className="col-md-3 mb-3">
                <label className="form-label" style={{ fontWeight: "500", fontSize: "14px" }}>Date</label>
                <input type="date" className="form-control" style={{ borderRadius: "10px" }}
                  value={fields.date}
                  onChange={(e) => setFields({ ...fields, date: e.target.value })}
                />
              </div>

              <div className="col-12 mb-3">
                <label className="form-label" style={{ fontWeight: "500", fontSize: "14px" }}>Note (optional)</label>
                <input type="text" className="form-control" style={{ borderRadius: "10px" }}
                  placeholder="Reason or additional details..."
                  value={fields.note}
                  onChange={(e) => setFields({ ...fields, note: e.target.value })}
                />
              </div>

            </div>

            <p style={{ fontSize: "12px", fontWeight: "600", color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "12px" }}>
              Products to Return
            </p>

            {!fields.purchase_id ? (
              <div style={{ padding: "16px", textAlign: "center", color: "#94a3b8", background: "#f8fafc", borderRadius: "10px", fontSize: "13px" }}>
                Selecciona primero una compra recibida para ver sus productos.
              </div>
            ) : (
              <>
                <div className="d-flex flex-wrap gap-2 align-items-end mb-3 p-3"
                  style={{ background: "#f8fafc", borderRadius: "10px", border: "1px solid #e2e8f0" }}
                >
                  <div style={{ flex: 2, minWidth: "160px" }}>
                    <label style={{ fontSize: "12px", color: "#64748b", fontWeight: "500", display: "block", marginBottom: "4px" }}>Product</label>
                    <select className="form-select form-select-sm" style={{ borderRadius: "8px" }}
                      value={selectedProductId} onChange={(e) => setSelectedProductId(e.target.value)}
                    >
                      {availableProducts.map((d) => (
                        <option key={d.product_id} value={d.product_id}>
                          {d.product.name} (comprado: {d.quantity}, stock actual: {d.product.stock})
                        </option>
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

                <div style={{ border: "1px solid #e2e8f0", borderRadius: "10px", overflow: "hidden" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                      <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
                        {["Product", "Reason", "Purchased", "Current Stock", "Qty Return", ""].map((h) => (
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
                              <span style={{ background: "#fef9c3", color: "#854d0e", padding: "3px 8px", borderRadius: "20px", fontSize: "12px", fontWeight: "500" }}>
                                {item.reason}
                              </span>
                            </td>

                            <td style={{ padding: "10px 14px", color: "#64748b" }}>{item.purchasedQty}</td>

                            <td style={{ padding: "10px 14px" }}>
                              <span style={{
                                background: item.qty > item.currentStock ? "#fee2e2" : "#f1f5f9",
                                color: item.qty > item.currentStock ? "#991b1b" : "#475569",
                                padding: "3px 10px", borderRadius: "20px", fontSize: "13px", fontWeight: "500"
                              }}>
                                {item.currentStock}
                              </span>
                            </td>

                            <td style={{ padding: "10px 14px" }}>
                              <input type="number" min="1" value={item.qty}
                                onChange={(e) => changeQty(item.productId, e.target.value)}
                                style={{ width: "70px", padding: "4px 8px", borderRadius: "6px", border: "1px solid #e2e8f0", outline: "none", textAlign: "center" }}
                              />
                            </td>

                            <td style={{ padding: "10px 14px" }}>
                              <button onClick={() => removeItem(item.productId)} style={{
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
                          <td colSpan="6" style={{ padding: "20px", textAlign: "center", color: "#94a3b8", fontSize: "13px" }}>
                            No products added yet.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </>
            )}

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
function ReturnToSupplier() {

  const [returnsList, setReturnsList] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [saving, setSaving] = useState(false);

  const canManage = usePermission("returns.manage");
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");
  const [showModal, setShowModal] = useState(false);
  const [editReturnId, setEditReturnId] = useState(null);
  const [fields, setFields] = useState({
    purchase_id: "", status: "Pending",
    date: new Date().toISOString().split("T")[0], note: "", items: []
  });

  // ── Cargar desde la API ──
  const fetchAll = () => {
    Promise.all([api.get("/return-to-suppliers"), api.get("/purchases")])
      .then(([returnsRes, purchasesRes]) => {
        setReturnsList(returnsRes.data);
        setPurchases(purchasesRes.data);
        setLoadError("");
      })
      .catch(() => setLoadError("Could not load returns. Is the backend running?"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchAll();
  }, []);

  // ── Stats ──
  const totalReturned = totalUnitsReturned(returnsList);
  const totalPending = returnsList.filter((r) => r.status === "Pending").length;
  const totalConfirmed = returnsList.filter((r) => r.status === "Confirmed").length;

  // ── Filtrado ──
  const filteredReturns = returnsList.filter((r) => {
    const matchSearch =
      (r.supplier?.name || "").toLowerCase().includes(search.toLowerCase()) ||
      r.details.some((d) => (d.product?.name || "").toLowerCase().includes(search.toLowerCase()));
    const matchStatus = filterStatus === "All" || r.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const openNew = () => {
    setEditReturnId(null);
    setFields({ purchase_id: "", status: "Pending", date: new Date().toISOString().split("T")[0], note: "", items: [] });
    setShowModal(true);
  };

  const editReturn = (r) => {
    if (r.status === "Confirmed") return;

    setEditReturnId(r.id);
    setFields({
      purchase_id: r.purchase_id,
      status: r.status,
      date: r.date,
      note: r.note || "",
      items: r.details.map((d) => ({
        productId: d.product_id,
        name: d.product?.name || "—",
        reason: d.reason,
        qty: d.qty,
        purchasedQty: d.qty, // referencia visual; el backend valida el tope real
        currentStock: d.product?.stock ?? d.stock_before
      }))
    });
    setShowModal(true);
  };

  const saveReturn = () => {
    if (!fields.purchase_id) { alert("Select a purchase"); return; }
    if (fields.items.length === 0) { alert("Add at least one product"); return; }

    setSaving(true);

    const payload = {
      purchase_id: Number(fields.purchase_id),
      status: fields.status,
      date: fields.date,
      note: fields.note || null,
      items: fields.items.map((i) => ({
        product_id: i.productId,
        qty: i.qty,
        reason: i.reason
      }))
    };

    const request = editReturnId
      ? api.put(`/return-to-suppliers/${editReturnId}`, payload)
      : api.post("/return-to-suppliers", payload);

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

    api.delete(`/return-to-suppliers/${id}`)
      .then(() => fetchAll())
      .catch((err) => alert(err.response?.data?.message || "Could not delete return."));
  };

  return (
    <div>

      <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
        <div>
          <h1>Return to Supplier</h1>
          <p style={{ color: "#64748b", margin: 0 }}>Manage product returns to suppliers</p>
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
          <StatCard title="Confirmed" value={totalConfirmed} color="#16a34a" />
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
              {["ID", "Purchase", "Supplier", "Products", "Units", "Status", "Date", "Actions"].map((h) => (
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

                  <td style={{ ...tdStyle, color: "#475569" }}>#{r.purchase_id}</td>

                  <td style={{ ...tdStyle, fontWeight: "600", color: "#0f172a" }}>{r.supplier?.name || "—"}</td>

                  <td style={{ ...tdStyle, color: "#475569", fontSize: "13px" }}>
                    {r.details.map((d) => (
                      <div key={d.id}>{d.product?.name || "—"} × {d.qty} <span style={{ color: "#94a3b8" }}>({d.reason})</span></div>
                    ))}
                  </td>

                  <td style={tdStyle}>
                    <span style={{ background: "#fee2e2", color: "#b91c1c", padding: "3px 12px", borderRadius: "20px", fontSize: "13px", fontWeight: "600" }}>
                      -{r.details.reduce((s, d) => s + d.qty, 0)}
                    </span>
                  </td>

                  <td style={tdStyle}><StatusBadge status={r.status} /></td>

                  <td style={{ ...tdStyle, color: "#64748b" }}>{r.date}</td>

                  <td style={tdStyle}>
                    canManage &&
                    {r.status !== "Confirmed" ? (
                      <div style={{ display: "flex", gap: "8px" }}>
                        <button onClick={() => editReturn(r)} style={{ background: "#dbeafe", color: "#1d4ed8", border: "none", borderRadius: "8px", padding: "6px 10px", cursor: "pointer", display: "flex", alignItems: "center" }}>
                          <BsPencilSquare />
                        </button>
                        <button onClick={() => deleteReturn(r.id)} style={{ background: "#fee2e2", color: "#b91c1c", border: "none", borderRadius: "8px", padding: "6px 10px", cursor: "pointer", display: "flex", alignItems: "center" }}>
                          <BsTrash />
                        </button>
                      </div>
                    ) : (
                      <span style={{ color: "#94a3b8", fontSize: "12px", fontStyle: "italic" }}>Locked</span>
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

      <ReturnModal
        showModal={showModal}
        setShowModal={setShowModal}
        isEditing={!!editReturnId}
        fields={fields}
        setFields={setFields}
        onSave={saveReturn}
        saving={saving}
        purchases={purchases}
      />

    </div>
  );
}

const thStyle = { textAlign: "left", padding: "15px", color: "#94a3b8", fontWeight: "600", fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.5px" };
const tdStyle = { padding: "15px" };

export default ReturnToSupplier;