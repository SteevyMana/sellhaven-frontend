import { useEffect, useState } from "react";
import StatCard from "../components/StatCard";
import { BsPlus, BsPencilSquare, BsTrash, BsDashCircle } from "react-icons/bs";
import api from "../api/client";
import { usePermission } from "../hooks/usePermission";

const ALL_STATUSES = ["Pending", "Ordered", "Received", "Cancelled"];
const EDITABLE_STATUSES = ["Pending", "Ordered", "Cancelled"];

const STATUS_STYLES = {
  Pending: { background: "#fef9c3", color: "#854d0e" },
  Ordered: { background: "#dbeafe", color: "#1e40af" },
  Received: { background: "#dcfce7", color: "#166534" },
  Cancelled: { background: "#fee2e2", color: "#991b1b" },
};

// ── Helpers ──────────────────────────────────────────────────────
const calcTotal = (items) =>
  items.reduce((sum, i) => sum + i.costPrice * i.qty, 0);

// ── Badge de estado ──────────────────────────────────────────────
function StatusBadge({ status }) {
  const style = STATUS_STYLES[status] || {};
  return (
    <span style={{
      display: "inline-block", padding: "4px 12px",
      borderRadius: "20px", fontSize: "12px", fontWeight: "600", ...style
    }}>
      {status}
    </span>
  );
}

// ── Modal ────────────────────────────────────────────────────────
function PurchaseModal({ showModal, setShowModal, isEditing, fields, setFields, onSave, saving, suppliers, products }) {

  const [selectedProductId, setSelectedProductId] = useState(products[0]?.id || "");
  const [qty, setQty] = useState(1);
  const [costPrice, setCostPrice] = useState(products[0]?.price || 0);

  useEffect(() => {
    if (showModal && products.length > 0) {
      setSelectedProductId(products[0].id);
      setCostPrice(products[0].price);
    }
  }, [showModal, products]);

  if (!showModal) return null;

  const total = calcTotal(fields.items);

  // Cuando cambia el producto seleccionado, sugiere su precio como costo
  const handleProductChange = (id) => {
    setSelectedProductId(id);
    const product = products.find((p) => p.id === Number(id));
    if (product) setCostPrice(product.price);
  };

  // Agregar producto a la lista
  const addItem = () => {
    const product = products.find((p) => p.id === Number(selectedProductId));
    if (!product) return;

    const exists = fields.items.find((i) => i.productId === product.id);
    if (exists) {
      setFields({
        ...fields,
        items: fields.items.map((i) =>
          i.productId === product.id
            ? { ...i, qty: i.qty + Number(qty), costPrice: Number(costPrice) }
            : i
        )
      });
    } else {
      setFields({
        ...fields,
        items: [...fields.items, {
          productId: product.id,
          name: product.name,
          costPrice: Number(costPrice),
          qty: Number(qty)
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

  const changeCost = (productId, newCost) => {
    setFields({
      ...fields,
      items: fields.items.map((i) =>
        i.productId === productId ? { ...i, costPrice: Number(newCost) } : i
      )
    });
  };

  return (
    <div className="modal d-block" tabIndex="-1" style={{ background: "rgba(0,0,0,0.5)" }}>
      <div className="modal-dialog modal-lg">
        <div className="modal-content" style={{ borderRadius: "16px", border: "none" }}>

          <div className="modal-header" style={{ borderBottom: "1px solid #f1f5f9" }}>
            <h5 className="modal-title" style={{ fontWeight: "600" }}>
              {isEditing ? "Edit Purchase Order" : "New Purchase Order"}
            </h5>
            <button className="btn-close" onClick={() => setShowModal(false)} />
          </div>

          <div className="modal-body">

            <p style={{ fontSize: "12px", fontWeight: "600", color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "12px" }}>
              Purchase Information
            </p>

            <div className="row mb-4">

              <div className="col-md-6 mb-3">
                <label className="form-label" style={{ fontWeight: "500", fontSize: "14px" }}>Supplier</label>
                <select className="form-select" style={{ borderRadius: "10px" }}
                  value={fields.supplier_id}
                  onChange={(e) => setFields({ ...fields, supplier_id: e.target.value })}
                >
                  <option value="">— None —</option>
                  {suppliers
                    .filter((s) => s.status === "Active" || s.id === Number(fields.supplier_id))
                    .map((s) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
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
                <small className="text-muted">
                  "Received" gets set automatically from Stock Entries
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

            <div className="d-flex flex-wrap gap-2 align-items-end mb-3 p-3"
              style={{ background: "#f8fafc", borderRadius: "10px", border: "1px solid #e2e8f0" }}
            >
              <div style={{ flex: 2, minWidth: "160px" }}>
                <label style={{ fontSize: "12px", color: "#64748b", fontWeight: "500", display: "block", marginBottom: "4px" }}>Product</label>
                <select className="form-select form-select-sm" style={{ borderRadius: "8px" }}
                  value={selectedProductId}
                  onChange={(e) => handleProductChange(e.target.value)}
                >
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div style={{ width: "110px" }}>
                <label style={{ fontSize: "12px", color: "#64748b", fontWeight: "500", display: "block", marginBottom: "4px" }}>Cost Price ($)</label>
                <input type="number" className="form-control form-control-sm" style={{ borderRadius: "8px" }}
                  min="0" value={costPrice}
                  onChange={(e) => setCostPrice(e.target.value)}
                />
              </div>

              <div style={{ width: "80px" }}>
                <label style={{ fontSize: "12px", color: "#64748b", fontWeight: "500", display: "block", marginBottom: "4px" }}>Qty</label>
                <input type="number" className="form-control form-control-sm" style={{ borderRadius: "8px" }}
                  min="1" value={qty}
                  onChange={(e) => setQty(e.target.value)}
                />
              </div>

              <div>
                <button onClick={addItem} style={{
                  background: "#dbeafe", color: "#1d4ed8", border: "none",
                  padding: "7px 16px", borderRadius: "8px", fontWeight: "600",
                  cursor: "pointer", display: "flex", alignItems: "center", gap: "5px", whiteSpace: "nowrap"
                }}>
                  <BsPlus size={16} /> Add
                </button>
              </div>
            </div>

            <div style={{ border: "1px solid #e2e8f0", borderRadius: "10px", overflow: "hidden" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
                    {["Product", "Cost Price ($)", "Quantity", "Subtotal", ""].map((h) => (
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
                          <input type="number" min="0" value={item.costPrice}
                            onChange={(e) => changeCost(item.productId, e.target.value)}
                            style={{ width: "90px", padding: "4px 8px", borderRadius: "6px", border: "1px solid #e2e8f0", outline: "none", textAlign: "center" }}
                          />
                        </td>

                        <td style={{ padding: "10px 14px" }}>
                          <input type="number" min="1" value={item.qty}
                            onChange={(e) => changeQty(item.productId, e.target.value)}
                            style={{ width: "70px", padding: "4px 8px", borderRadius: "6px", border: "1px solid #e2e8f0", outline: "none", textAlign: "center" }}
                          />
                        </td>

                        <td style={{ padding: "10px 14px", fontWeight: "600", color: "#2563eb" }}>
                          ${(item.costPrice * item.qty).toLocaleString()}
                        </td>

                        <td style={{ padding: "10px 14px" }}>
                          <button onClick={() => removeItem(item.productId)} style={{
                            background: "#fee2e2", color: "#b91c1c", border: "none",
                            borderRadius: "6px", padding: "4px 8px", cursor: "pointer",
                            display: "flex", alignItems: "center"
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

            <div style={{
              display: "flex", justifyContent: "flex-end", alignItems: "center",
              gap: "12px", marginTop: "16px", padding: "12px 16px",
              background: "#f8fafc", borderRadius: "10px"
            }}>
              <span style={{ color: "#64748b", fontWeight: "500" }}>TOTAL COST:</span>
              <span style={{ fontSize: "22px", fontWeight: "700", color: "#2563eb" }}>
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
              padding: "8px 20px", borderRadius: "10px", fontWeight: "600", cursor: saving ? "default" : "pointer"
            }}>
              {saving ? "Saving..." : "Save Purchase"}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}

// ── Página principal ─────────────────────────────────────────────
function Purchases() {

  const [purchasesList, setPurchasesList] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [saving, setSaving] = useState(false);

  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");
  const [showModal, setShowModal] = useState(false);
  const [editPurchaseId, setEditPurchaseId] = useState(null);

  const canManage = usePermission("purchases.manage");
  const [fields, setFields] = useState({
    supplier_id: "", date: "", status: "Pending", items: []
  });

  // ── Cargar desde la API ──
  const fetchAll = () => {
    Promise.all([api.get("/purchases"), api.get("/suppliers"), api.get("/products")])
      .then(([purchasesRes, suppliersRes, productsRes]) => {
        setPurchasesList(purchasesRes.data);
        setSuppliers(suppliersRes.data);
        setProducts(productsRes.data);
        setLoadError("");
      })
      .catch(() => setLoadError("Could not load purchases. Is the backend running?"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchAll();
  }, []);

  // ── Stats ──
  const totalCost = purchasesList.reduce((s, p) => s + Number(p.total), 0);
  const totalPending = purchasesList.filter((p) => p.status === "Pending").length;
  const totalReceived = purchasesList.filter((p) => p.status === "Received").length;

  // ── Filtrado ──
  const filteredPurchases = purchasesList.filter((p) => {
    const matchSearch =
      (p.supplier?.name || "").toLowerCase().includes(search.toLowerCase()) ||
      p.details.some((d) => (d.product?.name || "").toLowerCase().includes(search.toLowerCase()));
    const matchStatus = filterStatus === "All" || p.status === filterStatus;
    return matchSearch && matchStatus;
  });

  // ── Abrir modal nuevo ──
  const openNew = () => {
    setEditPurchaseId(null);
    setFields({ supplier_id: "", date: "", status: "Pending", items: [] });
    setShowModal(true);
  };

  // ── Abrir modal editar ──
  const editPurchase = (p) => {
    if (p.status === 'Received') return; // defensa extra, aunque el botón ya no debería aparecer

    setEditPurchaseId(p.id);
    setFields({
      supplier_id: p.supplier_id,
      date: p.date,
      status: p.status,
      items: p.details.map((d) => ({
        productId: d.product_id,
        name: d.product?.name || "—",
        costPrice: Number(d.cost),
        qty: d.quantity
      }))
    });
    setShowModal(true);
  };

  // ── Guardar ──
  const savePurchase = () => {
    if (!fields.supplier_id) { alert("Select a supplier"); return; }
    if (fields.items.length === 0) { alert("Add at least one product"); return; }

    setSaving(true);

    const payload = {
      supplier_id: Number(fields.supplier_id),
      status: fields.status,
      date: fields.date,
      items: fields.items.map((i) => ({
        product_id: i.productId,
        quantity: i.qty,
        cost: i.costPrice
      }))
    };

    const request = editPurchaseId
      ? api.put(`/purchases/${editPurchaseId}`, payload)
      : api.post("/purchases", payload);

    request
      .then(() => {
        setShowModal(false);
        fetchAll();
      })
      .catch((err) => alert(err.response?.data?.message || "Could not save purchase."))
      .finally(() => setSaving(false));
  };

  // ── Eliminar ──
  const deletePurchase = (id) => {
    if (!window.confirm("Are you sure you want to delete this purchase order?")) return;

    api.delete(`/purchases/${id}`)
      .then(() => fetchAll())
      .catch((err) => alert(err.response?.data?.message || "Could not delete purchase."));
  };

  return (
    <div>

      <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">

        <div>
          <h1>Purchase Orders</h1>
          <p style={{ color: "#64748b", margin: 0 }}>Manage purchases from suppliers</p>
        </div>

        <div className="d-flex flex-wrap gap-2">

          <input type="text" placeholder="Search purchase..."
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
              background: "#dbeafe", color: "#1d4ed8", border: "none",
              padding: "10px 18px", borderRadius: "10px", fontWeight: "600",
              cursor: "pointer", display: "flex", alignItems: "center", gap: "6px", whiteSpace: "nowrap"
            }}>
              <BsPlus size={18} /> New Purchase
            </button>
          )}
        </div>
      </div>

      <div className="row mb-4">
        <div className="col-6 col-lg-3 mb-3">
          <StatCard title="Total Purchases" value={purchasesList.length} color="#0f172a" />
        </div>
        <div className="col-6 col-lg-3 mb-3">
          <StatCard title="Total Cost" value={"$" + totalCost.toLocaleString()} color="#2563eb" />
        </div>
        <div className="col-6 col-lg-3 mb-3">
          <StatCard title="Pending" value={totalPending} color="#854d0e" />
        </div>
        <div className="col-6 col-lg-3 mb-3">
          <StatCard title="Received" value={totalReceived} color="#16a34a" />
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
              {["ID", "Supplier", "Products", "Total Cost", "Status", "Date", "Actions"].map((h) => (
                <th key={h} style={thStyle}>{h}</th>
              ))}
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td colSpan="7" className="text-center py-4 text-muted">Loading...</td>
              </tr>
            ) : filteredPurchases.length > 0 ? (
              filteredPurchases.map((p) => (
                <tr key={p.id} style={{ borderBottom: "1px solid #f1f5f9" }}>

                  <td style={tdStyle}>
                    <span style={{ color: "#94a3b8", fontWeight: "500" }}>#{p.id}</span>
                  </td>

                  <td style={{ ...tdStyle, fontWeight: "600", color: "#0f172a" }}>
                    {p.supplier?.name || "—"}
                  </td>

                  <td style={{ ...tdStyle, color: "#475569", fontSize: "13px" }}>
                    {p.details.map((d) => (
                      <div key={d.id}>{d.product?.name || "—"} × {d.quantity}</div>
                    ))}
                  </td>

                  <td style={{ ...tdStyle, fontWeight: "600", color: "#2563eb" }}>
                    ${Number(p.total).toLocaleString()}
                  </td>

                  <td style={tdStyle}>
                    <StatusBadge status={p.status} />
                  </td>

                  <td style={{ ...tdStyle, color: "#64748b" }}>{p.date}</td>

                  <td style={tdStyle}>
                    {p.status !== 'Received' ? (
                      <div style={{ display: "flex", gap: "8px" }}>
                        <button onClick={() => editPurchase(p)} style={{
                          background: "#dbeafe", color: "#1d4ed8", border: "none",
                          borderRadius: "8px", padding: "6px 10px", cursor: "pointer",
                          display: "flex", alignItems: "center"
                        }}>
                          <BsPencilSquare />
                        </button>
                        <button onClick={() => deletePurchase(p.id)} style={{
                          background: "#fee2e2", color: "#b91c1c", border: "none",
                          borderRadius: "8px", padding: "6px 10px", cursor: "pointer",
                          display: "flex", alignItems: "center"
                        }}>
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
              <tr>
                <td colSpan="7" className="text-center py-4 text-muted">No purchases found.</td>
              </tr>
            )}
          </tbody>

        </table>
      </div>

      <PurchaseModal
        showModal={showModal}
        setShowModal={setShowModal}
        isEditing={!!editPurchaseId}
        fields={fields}
        setFields={setFields}
        onSave={savePurchase}
        saving={saving}
        suppliers={suppliers}
        products={products}
      />

    </div>
  );
}

const thStyle = {
  textAlign: "left", padding: "15px",
  color: "#94a3b8", fontWeight: "600",
  fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.5px"
};
const tdStyle = { padding: "15px" };

export default Purchases;