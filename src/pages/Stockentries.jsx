import { useEffect, useState } from "react";
import StatCard from "../components/StatCard";
import { BsPlus, BsPencilSquare, BsTrash, BsDashCircle } from "react-icons/bs";
import api from "../api/client";
import { usePermission } from "../hooks/usePermission";

const ENTRY_REASONS = ["Purchase Order", "Manual Adjustment", "Return from Customer", "Initial Stock"];

// Órdenes de compra que todavía tiene sentido recibir (no recibidas/canceladas ya)
const RECEIVABLE_STATUSES = ["Pending", "Ordered"];

// ── Helpers ──────────────────────────────────────────────────────
const totalAdded = (entries) =>
  entries.reduce((s, e) => s + e.details.reduce((si, d) => si + d.quantity, 0), 0);

// ── Modal ────────────────────────────────────────────────────────
function StockEntryModal({ showModal, setShowModal, isEditing, fields, setFields, onSave, saving, suppliers, products, purchases }) {

  const [selectedId, setSelectedId] = useState(products[0]?.id || "");
  const [qtyAdded, setQtyAdded] = useState(1);

  if (!showModal) return null;

  const receivablePurchases = purchases.filter((p) => RECEIVABLE_STATUSES.includes(p.status));

  // ── Vincular una orden de compra: auto-rellena proveedor, referencia y
  // productos con las cantidades pedidas (el usuario todavía puede ajustar
  // las cantidades por si la entrega llega incompleta) ──
  const linkPurchase = (purchaseId) => {
    if (!purchaseId) {
      setFields({ ...fields, purchase_id: "" });
      return;
    }

    const purchase = purchases.find((p) => p.id === Number(purchaseId));
    if (!purchase) return;

    setFields({
      ...fields,
      purchase_id: purchase.id,
      supplier_id: purchase.supplier_id,
      reason: "Purchase Order",
      reference: `PO-${purchase.id}`,
      items: purchase.details.map((d) => {
        const liveStock = products.find((p) => p.id === d.product_id)?.stock ?? 0;
        return {
          productId: d.product_id,
          name: d.product?.name || "—",
          qtyBefore: liveStock,
          qtyAdded: d.quantity
        };
      })
    });
  };

  const addItem = () => {
    const product = products.find((p) => p.id === Number(selectedId));
    if (!product) return;

    const exists = fields.items.find((i) => i.productId === product.id);
    if (exists) {
      setFields({
        ...fields,
        items: fields.items.map((i) =>
          i.productId === product.id
            ? { ...i, qtyAdded: i.qtyAdded + Number(qtyAdded) }
            : i
        )
      });
    } else {
      setFields({
        ...fields,
        items: [...fields.items, {
          productId: product.id,
          name: product.name,
          qtyBefore: product.stock,
          qtyAdded: Number(qtyAdded)
        }]
      });
    }
    setQtyAdded(1);
  };

  const removeItem = (productId) =>
    setFields({ ...fields, items: fields.items.filter((i) => i.productId !== productId) });

  const changeQty = (productId, newQty) => {
    if (newQty < 1) return;
    setFields({
      ...fields,
      items: fields.items.map((i) =>
        i.productId === productId ? { ...i, qtyAdded: Number(newQty) } : i
      )
    });
  };

  return (
    <div className="modal d-block" tabIndex="-1" style={{ background: "rgba(0,0,0,0.5)" }}>
      <div className="modal-dialog modal-lg">
        <div className="modal-content" style={{ borderRadius: "16px", border: "none" }}>

          <div className="modal-header" style={{ borderBottom: "1px solid #f1f5f9" }}>
            <h5 className="modal-title" style={{ fontWeight: "600" }}>
              {isEditing ? "Edit Stock Entry" : "New Stock Entry"}
            </h5>
            <button className="btn-close" onClick={() => setShowModal(false)} />
          </div>

          <div className="modal-body">

            {!isEditing && receivablePurchases.length > 0 && (
              <div className="mb-4 p-3" style={{ background: "#eff6ff", borderRadius: "10px", border: "1px solid #bfdbfe" }}>
                <label className="form-label" style={{ fontWeight: "600", fontSize: "13px", color: "#1d4ed8" }}>
                  Link to Purchase Order (optional)
                </label>
                <select className="form-select form-select-sm" style={{ borderRadius: "8px" }}
                  value={fields.purchase_id}
                  onChange={(e) => linkPurchase(e.target.value)}
                >
                  <option value="">— Manual entry, not linked to a PO —</option>
                  {receivablePurchases.map((p) => (
                    <option key={p.id} value={p.id}>
                      PO #{p.id} — {p.supplier?.name} — ${Number(p.total).toLocaleString()} ({p.status})
                    </option>
                  ))}
                </select>
                <small style={{ color: "#1e40af" }}>
                  Selecting a PO fills in the supplier and products automatically, and marks that order as Received when you save.
                </small>
              </div>
            )}

            <p style={{ fontSize: "12px", fontWeight: "600", color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "12px" }}>
              Entry Information
            </p>

            <div className="row mb-4">

              <div className="col-md-6 mb-3">
                <label className="form-label" style={{ fontWeight: "500", fontSize: "14px" }}>Reason</label>
                <select className="form-select" style={{ borderRadius: "10px" }}
                  value={fields.reason}
                  onChange={(e) => setFields({ ...fields, reason: e.target.value })}
                  disabled={!!fields.purchase_id}
                >
                  {ENTRY_REASONS.map((r) => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>

              <div className="col-md-6 mb-3">
                <label className="form-label" style={{ fontWeight: "500", fontSize: "14px" }}>Supplier (optional)</label>
                <select className="form-select" style={{ borderRadius: "10px" }}
                  value={fields.supplier_id}
                  onChange={(e) => setFields({ ...fields, supplier_id: e.target.value })}
                  disabled={!!fields.purchase_id}
                >
                  <option value="">— None —</option>
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>

              <div className="col-md-6 mb-3">
                <label className="form-label" style={{ fontWeight: "500", fontSize: "14px" }}>Reference</label>
                <input type="text" className="form-control" style={{ borderRadius: "10px" }}
                  placeholder="e.g. PUR-001"
                  value={fields.reference}
                  onChange={(e) => setFields({ ...fields, reference: e.target.value })}
                />
              </div>

              <div className="col-md-6 mb-3">
                <label className="form-label" style={{ fontWeight: "500", fontSize: "14px" }}>Date</label>
                <input type="date" className="form-control" style={{ borderRadius: "10px" }}
                  value={fields.date}
                  onChange={(e) => setFields({ ...fields, date: e.target.value })}
                />
              </div>

              <div className="col-12 mb-3">
                <label className="form-label" style={{ fontWeight: "500", fontSize: "14px" }}>Note (optional)</label>
                <input type="text" className="form-control" style={{ borderRadius: "10px" }}
                  placeholder="Any additional notes..."
                  value={fields.note}
                  onChange={(e) => setFields({ ...fields, note: e.target.value })}
                />
              </div>

            </div>

            <p style={{ fontSize: "12px", fontWeight: "600", color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "12px" }}>
              Products {fields.purchase_id && <span style={{ color: "#2563eb", textTransform: "none", fontWeight: "500" }}>— adjust quantities if the delivery is partial</span>}
            </p>

            {!fields.purchase_id && (
              <div className="d-flex flex-wrap gap-2 align-items-end mb-3 p-3"
                style={{ background: "#f8fafc", borderRadius: "10px", border: "1px solid #e2e8f0" }}
              >
                <div style={{ flex: 2, minWidth: "160px" }}>
                  <label style={{ fontSize: "12px", color: "#64748b", fontWeight: "500", display: "block", marginBottom: "4px" }}>Product</label>
                  <select className="form-select form-select-sm" style={{ borderRadius: "8px" }}
                    value={selectedId}
                    onChange={(e) => setSelectedId(e.target.value)}
                  >
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>{p.name} (stock: {p.stock})</option>
                    ))}
                  </select>
                </div>

                <div style={{ width: "100px" }}>
                  <label style={{ fontSize: "12px", color: "#64748b", fontWeight: "500", display: "block", marginBottom: "4px" }}>Qty to Add</label>
                  <input type="number" className="form-control form-control-sm" style={{ borderRadius: "8px" }}
                    min="1" value={qtyAdded}
                    onChange={(e) => setQtyAdded(e.target.value)}
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
            )}

            <div style={{ border: "1px solid #e2e8f0", borderRadius: "10px", overflow: "hidden" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
                    {["Product", "Before", "Qty Added", "After", ""].map((h) => (
                      <th key={h} style={{ padding: "10px 14px", textAlign: "left", fontSize: "11px", fontWeight: "600", color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.5px" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {fields.items.length > 0 ? (
                    fields.items.map((item) => (
                      <tr key={item.productId} style={{ borderBottom: "1px solid #f1f5f9" }}>

                        <td style={{ padding: "10px 14px", fontWeight: "500", color: "#0f172a" }}>
                          {item.name}
                        </td>

                        <td style={{ padding: "10px 14px" }}>
                          <span style={{ background: "#f1f5f9", color: "#475569", padding: "3px 10px", borderRadius: "20px", fontSize: "13px", fontWeight: "500" }}>
                            {item.qtyBefore}
                          </span>
                        </td>

                        <td style={{ padding: "10px 14px" }}>
                          <input type="number" min="1" value={item.qtyAdded}
                            onChange={(e) => changeQty(item.productId, e.target.value)}
                            style={{ width: "70px", padding: "4px 8px", borderRadius: "6px", border: "1px solid #e2e8f0", outline: "none", textAlign: "center" }}
                          />
                        </td>

                        <td style={{ padding: "10px 14px" }}>
                          <span style={{ background: "#dcfce7", color: "#166534", padding: "3px 10px", borderRadius: "20px", fontSize: "13px", fontWeight: "600" }}>
                            {item.qtyBefore + item.qtyAdded}
                          </span>
                        </td>

                        <td style={{ padding: "10px 14px" }}>
                          {!fields.purchase_id && (
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
                      <td colSpan="5" style={{ padding: "20px", textAlign: "center", color: "#94a3b8", fontSize: "13px" }}>
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
              background: saving ? "#bfdbfe" : "#dbeafe", color: "#1d4ed8", border: "none",
              padding: "8px 20px", borderRadius: "10px", fontWeight: "600", cursor: saving ? "default" : "pointer"
            }}>
              {saving ? "Saving..." : "Save Entry"}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}

// ── Página principal ─────────────────────────────────────────────
function StockEntries() {

  const [entriesList, setEntriesList] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [products, setProducts] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [saving, setSaving] = useState(false);

  const canManage = usePermission("stock-entries.manage");
  const [search, setSearch] = useState("");
  const [filterReason, setFilterReason] = useState("All");
  const [showModal, setShowModal] = useState(false);
  const [editEntryId, setEditEntryId] = useState(null);
  const [fields, setFields] = useState({
    supplier_id: "", purchase_id: "", reason: "Purchase Order",
    reference: "", date: new Date().toISOString().split("T")[0], note: "", items: []
  });

  // ── Cargar desde la API ──
  const fetchAll = () => {
    Promise.all([
      api.get("/stock-entries"),
      api.get("/suppliers"),
      api.get("/products"),
      api.get("/purchases")
    ])
      .then(([entriesRes, suppliersRes, productsRes, purchasesRes]) => {
        setEntriesList(entriesRes.data);
        setSuppliers(suppliersRes.data);
        setProducts(productsRes.data);
        setPurchases(purchasesRes.data);
        setLoadError("");
      })
      .catch(() => setLoadError("Could not load stock entries. Is the backend running?"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchAll();
  }, []);

  // ── Stats ──
  const totalUnitsAdded = totalAdded(entriesList);
  const totalByPO = entriesList.filter((e) => e.reason === "Purchase Order").length;
  const totalByOther = entriesList.filter((e) => e.reason !== "Purchase Order").length;

  // ── Filtrado ──
  const filteredEntries = entriesList.filter((e) => {
    const matchSearch =
      (e.supplier?.name || "").toLowerCase().includes(search.toLowerCase()) ||
      (e.reference || "").toLowerCase().includes(search.toLowerCase()) ||
      e.details.some((d) => (d.product?.name || "").toLowerCase().includes(search.toLowerCase()));
    const matchReason = filterReason === "All" || e.reason === filterReason;
    return matchSearch && matchReason;
  });

  // ── Abrir modal nuevo ──
  const openNew = () => {
    setEditEntryId(null);
    setFields({ supplier_id: "", purchase_id: "", reason: "Purchase Order", reference: "", date: new Date().toISOString().split("T")[0], note: "", items: [] });
    setShowModal(true);
  };

  // ── Abrir modal editar ──
  // Nota: "Before" se aproxima con el stock actual del producto menos la
  // cantidad de esta entrada (el backend solo guarda `quantity`, no un
  // histórico de antes/después).
  const editEntry = (e) => {
    setEditEntryId(e.id);
    setFields({
      supplier_id: e.supplier_id || "",
      purchase_id: e.purchase_id || "",
      reason: e.reason,
      reference: e.reference || "",
      date: e.date,
      note: e.note || "",
      items: e.details.map((d) => {
        const liveProduct = products.find((p) => p.id === d.product_id);
        const qtyBefore = (liveProduct?.stock ?? d.quantity) - d.quantity;
        return {
          productId: d.product_id,
          name: d.product?.name || "—",
          qtyBefore: Math.max(0, qtyBefore),
          qtyAdded: d.quantity
        };
      })
    });
    setShowModal(true);
  };

  // ── Guardar ──
  const saveEntry = () => {
    if (!fields.reference) { alert("Reference is required"); return; }
    if (fields.items.length === 0) { alert("Add at least one product"); return; }

    setSaving(true);

    const payload = {
      supplier_id: fields.supplier_id ? Number(fields.supplier_id) : null,
      purchase_id: fields.purchase_id ? Number(fields.purchase_id) : null,
      reason: fields.reason,
      reference: fields.reference,
      date: fields.date,
      note: fields.note || null,
      items: fields.items.map((i) => ({
        product_id: i.productId,
        quantity: i.qtyAdded
      }))
    };

    const request = editEntryId
      ? api.put(`/stock-entries/${editEntryId}`, payload)
      : api.post("/stock-entries", payload);

    request
      .then(() => {
        setShowModal(false);
        fetchAll();
      })
      .catch((err) => alert(err.response?.data?.message || "Could not save entry."))
      .finally(() => setSaving(false));
  };

  // ── Eliminar ──
  const deleteEntry = (id) => {
    if (!window.confirm("Are you sure you want to delete this stock entry? This will revert the stock it added.")) return;

    api.delete(`/stock-entries/${id}`)
      .then(() => fetchAll())
      .catch((err) => alert(err.response?.data?.message || "Could not delete entry."));
  };

  return (
    <div>

      <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
        <div>
          <h1>Stock Entries</h1>
          <p style={{ color: "#64748b", margin: 0 }}>Record incoming stock movements</p>
        </div>
        <div className="d-flex flex-wrap gap-2">

          <input type="text" placeholder="Search entry..."
            value={search} onChange={(e) => setSearch(e.target.value)}
            style={{ padding: "10px 14px", borderRadius: "10px", border: "1px solid #cbd5e1", outline: "none", minWidth: "180px" }}
          />

          <select value={filterReason} onChange={(e) => setFilterReason(e.target.value)}
            style={{ padding: "10px 14px", borderRadius: "10px", border: "1px solid #cbd5e1", outline: "none", background: "white", cursor: "pointer" }}
          >
            <option value="All">All Reasons</option>
            {ENTRY_REASONS.map((r) => <option key={r} value={r}>{r}</option>)}
          </select>

          {canManage && (
            <button onClick={openNew} style={{
              background: "#dbeafe", color: "#1d4ed8", border: "none",
              padding: "10px 18px", borderRadius: "10px", fontWeight: "600",
              cursor: "pointer", display: "flex", alignItems: "center", gap: "6px", whiteSpace: "nowrap"
            }}>
              <BsPlus size={18} /> New Entry
            </button>
          )}
        </div>
      </div>

      <div className="row mb-4">
        <div className="col-6 col-lg-3 mb-3">
          <StatCard title="Total Entries" value={entriesList.length} color="#0f172a" />
        </div>
        <div className="col-6 col-lg-3 mb-3">
          <StatCard title="Units Added" value={totalUnitsAdded} color="#2563eb" />
        </div>
        <div className="col-6 col-lg-3 mb-3">
          <StatCard title="From PO" value={totalByPO} color="#16a34a" />
        </div>
        <div className="col-6 col-lg-3 mb-3">
          <StatCard title="Other Reasons" value={totalByOther} color="#854d0e" />
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
              {["ID", "Reference", "Supplier", "Reason", "Products", "Units Added", "Date", "Note", "Actions"].map((h) => (
                <th key={h} style={thStyle}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="9" className="text-center py-4 text-muted">Loading...</td>
              </tr>
            ) : filteredEntries.length > 0 ? (
              filteredEntries.map((e) => (
                <tr key={e.id} style={{ borderBottom: "1px solid #f1f5f9" }}>

                  <td style={tdStyle}><span style={{ color: "#94a3b8", fontWeight: "500" }}>#{e.id}</span></td>

                  <td style={{ ...tdStyle, fontWeight: "600", color: "#0f172a" }}>
                    {e.reference || "—"}
                    {e.purchase_id && (
                      <div style={{ fontSize: "11px", color: "#2563eb", fontWeight: "500" }}>
                        linked to PO #{e.purchase_id}
                      </div>
                    )}
                  </td>

                  <td style={{ ...tdStyle, color: "#475569" }}>{e.supplier?.name || "—"}</td>

                  <td style={tdStyle}>
                    <span style={{ background: "#f1f5f9", color: "#475569", padding: "3px 10px", borderRadius: "20px", fontSize: "12px", fontWeight: "500" }}>
                      {e.reason}
                    </span>
                  </td>

                  <td style={{ ...tdStyle, color: "#475569", fontSize: "13px" }}>
                    {e.details.map((d) => (
                      <div key={d.id}>{d.product?.name || "—"} +{d.quantity}</div>
                    ))}
                  </td>

                  <td style={tdStyle}>
                    <span style={{ background: "#dbeafe", color: "#1e40af", padding: "3px 12px", borderRadius: "20px", fontSize: "13px", fontWeight: "600" }}>
                      +{e.details.reduce((s, d) => s + d.quantity, 0)}
                    </span>
                  </td>

                  <td style={{ ...tdStyle, color: "#64748b" }}>{e.date}</td>

                  <td style={{ ...tdStyle, color: "#94a3b8", fontSize: "13px" }}>{e.note || "—"}</td>

                  <td style={tdStyle}>
                    {canManage && (
                      <div style={{ display: "flex", gap: "8px" }}>
                        <button onClick={() => editEntry(e)} style={{ background: "#dbeafe", color: "#1d4ed8", border: "none", borderRadius: "8px", padding: "6px 10px", cursor: "pointer", display: "flex", alignItems: "center" }}>
                          <BsPencilSquare />
                        </button>
                        <button onClick={() => deleteEntry(e.id)} style={{ background: "#fee2e2", color: "#b91c1c", border: "none", borderRadius: "8px", padding: "6px 10px", cursor: "pointer", display: "flex", alignItems: "center" }}>
                          <BsTrash />
                        </button>
                      </div>
                    )}
                  </td>

                </tr>
              ))
            ) : (
              <tr><td colSpan="9" className="text-center py-4 text-muted">No entries found.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <StockEntryModal
        showModal={showModal}
        setShowModal={setShowModal}
        isEditing={!!editEntryId}
        fields={fields}
        setFields={setFields}
        onSave={saveEntry}
        saving={saving}
        suppliers={suppliers}
        products={products}
        purchases={purchases}
      />

    </div>
  );
}

const thStyle = { textAlign: "left", padding: "15px", color: "#94a3b8", fontWeight: "600", fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.5px" };
const tdStyle = { padding: "15px" };

export default StockEntries;
