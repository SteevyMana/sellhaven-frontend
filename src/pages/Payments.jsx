import { useEffect, useState } from "react";
import StatCard from "../components/StatCard";
import {
  BsPlus,
  BsPencilSquare,
  BsTrash,
  BsCash
} from "react-icons/bs";
import { FaCreditCard, FaCcMastercard } from "react-icons/fa";
import { FaMoneyBillTransfer } from "react-icons/fa6";
import api from "../api/client";
import { usePermission } from "../hooks/usePermission";

const PAYMENT_METHODS = ["Cash", "Credit Card", "Debit Card", "Transfer"];

const STATUS_STYLES = {
  Paid: { background: "#dcfce7", color: "#166534" },
  Pending: { background: "#fef9c3", color: "#854d0e" },
  Failed: { background: "#fee2e2", color: "#991b1b" },
};

const METHOD_ICONS = {
  Cash: BsCash,
  "Credit Card": FaCreditCard,
  "Debit Card": FaCcMastercard,
  Transfer: FaMoneyBillTransfer,
};

// ── Helpers ──────────────────────────────────────────────────────
function StatusBadge({ status }) {
  const style = STATUS_STYLES[status] || {};
  return (
    <span style={{ display: "inline-block", padding: "4px 12px", borderRadius: "20px", fontSize: "12px", fontWeight: "600", ...style }}>
      {status}
    </span>
  );
}

function TargetBadge({ payment }) {
  const isOrder = !!payment.order_id;
  const style = isOrder
    ? { background: "#dbeafe", color: "#1e40af" }
    : { background: "#dcfce7", color: "#166534" };
  return (
    <span style={{ display: "inline-block", padding: "4px 10px", borderRadius: "20px", fontSize: "12px", fontWeight: "500", ...style }}>
      {isOrder ? "Order" : "Purchase"}
    </span>
  );
}

function MethodIcon({ method }) {
  const Icon = METHOD_ICONS[method];
  if (!Icon) return null;
  return <Icon style={{ marginRight: "4px" }} />;
}

function amountAlreadyPaid(payments, column, id, excludePaymentId) {
  return payments
    .filter((p) => p[column] === id && p.status === "Paid" && p.id !== excludePaymentId)
    .reduce((s, p) => s + Number(p.amount), 0);
}

const sectionLabelStyle = {
  fontSize: "12px", fontWeight: "600", color: "#94a3b8",
  textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "12px"
};

// ── Modal ────────────────────────────────────────────────────────
function PaymentModal({
  showModal, setShowModal, isEditing,
  fields, setFields, onSave, saving,
  orders, purchases, payments, editingPaymentId
}) {

  // Hooks SIEMPRE antes de cualquier return condicional.
  const [cashReceived, setCashReceived] = useState("");

  useEffect(() => {
    if (!showModal || fields.method !== "Cash") setCashReceived("");
  }, [showModal, fields.method]);

  if (!showModal) return null;

  const targetType = fields.order_id
    ? "order"
    : fields.purchase_id
      ? "purchase"
      : fields.targetHint || "";

  const setTargetType = (type) => {
    setFields({ ...fields, order_id: "", purchase_id: "", targetHint: type });
  };

  const ordersWithBalance = orders
    .map((o) => ({ ...o, paid: amountAlreadyPaid(payments, "order_id", o.id, editingPaymentId) }))
    .filter((o) => (o.total - o.paid) > 0 || o.id === Number(fields.order_id));

  const purchasesWithBalance = purchases
    .map((p) => ({ ...p, paid: amountAlreadyPaid(payments, "purchase_id", p.id, editingPaymentId) }))
    .filter((p) => (p.total_cost - p.paid) > 0 || p.id === Number(fields.purchase_id));

  const selectedOrder = orders.find((o) => o.id === Number(fields.order_id));
  const selectedPurchase = purchases.find((p) => p.id === Number(fields.purchase_id));

  const remainingBalance = selectedOrder
    ? selectedOrder.total - amountAlreadyPaid(payments, "order_id", selectedOrder.id, editingPaymentId)
    : selectedPurchase
      ? selectedPurchase.total_cost - amountAlreadyPaid(payments, "purchase_id", selectedPurchase.id, editingPaymentId)
      : null;

  const amountEntered = Number(fields.amount) || 0;
  const afterThisPayment = remainingBalance !== null ? remainingBalance - amountEntered : null;
  const exceedsBalance = remainingBalance !== null && amountEntered > remainingBalance;

  const cashReceivedNum = Number(cashReceived) || 0;
  const change = cashReceivedNum - amountEntered;

  return (
    <div className="modal d-block" tabIndex="-1" style={{ background: "rgba(0,0,0,0.5)" }}>
      <div className="modal-dialog">
        <div className="modal-content" style={{ borderRadius: "16px", border: "none" }}>

          <div className="modal-header" style={{ borderBottom: "1px solid #f1f5f9" }}>
            <h5 className="modal-title" style={{ fontWeight: "600" }}>
              {isEditing ? "Edit Payment" : "Register Payment"}
            </h5>
            <button className="btn-close" onClick={() => setShowModal(false)} />
          </div>

          <div className="modal-body">

            {/* ══════════ SECCIÓN 1: A qué le estoy pagando ══════════ */}
            <p style={sectionLabelStyle}>Payment For</p>

            <div className="d-flex gap-2 mb-3">
              <button
                type="button"
                onClick={() => setTargetType("order")}
                style={{
                  flex: 1, padding: "10px", borderRadius: "10px",
                  fontWeight: "600", fontSize: "13px", cursor: "pointer",
                  border: targetType === "order" ? "2px solid #2563eb" : "1px solid #e2e8f0",
                  background: targetType === "order" ? "#eff6ff" : "white",
                  color: targetType === "order" ? "#1d4ed8" : "#64748b",
                }}
              >
                Order
              </button>
              <button
                type="button"
                onClick={() => setTargetType("purchase")}
                style={{
                  flex: 1, padding: "10px", borderRadius: "10px",
                  fontWeight: "600", fontSize: "13px", cursor: "pointer",
                  border: targetType === "purchase" ? "2px solid #16a34a" : "1px solid #e2e8f0",
                  background: targetType === "purchase" ? "#f0fdf4" : "white",
                  color: targetType === "purchase" ? "#166534" : "#64748b",
                }}
              >
                Purchase
              </button>
            </div>

            {targetType === "order" && (
              <div className="mb-3">
                {ordersWithBalance.length === 0 ? (
                  <p style={{ color: "#94a3b8", fontSize: "13px" }}>No orders with pending balance.</p>
                ) : (
                  <select
                    className="form-select" style={{ borderRadius: "10px" }}
                    value={fields.order_id}
                    onChange={(e) => setFields({ ...fields, order_id: e.target.value, purchase_id: "", targetHint: "order" })}
                  >
                    <option value="">— Select order —</option>
                    {ordersWithBalance.map((o) => (
                      <option key={o.id} value={o.id}>
                        #{o.id} — {o.customer?.name || "—"} (pending: ${(o.total - o.paid).toLocaleString()})
                      </option>
                    ))}
                  </select>
                )}
              </div>
            )}

            {targetType === "purchase" && (
              <div className="mb-3">
                {purchasesWithBalance.length === 0 ? (
                  <p style={{ color: "#94a3b8", fontSize: "13px" }}>No purchases with pending balance.</p>
                ) : (
                  <select
                    className="form-select" style={{ borderRadius: "10px" }}
                    value={fields.purchase_id}
                    onChange={(e) => setFields({ ...fields, purchase_id: e.target.value, order_id: "", targetHint: "purchase" })}
                  >
                    <option value="">— Select purchase —</option>
                    {purchasesWithBalance.map((p) => (
                      <option key={p.id} value={p.id}>
                        #{p.id} — {p.supplier?.name || "—"} (pending: ${((p.total_cost || 0) - p.paid).toLocaleString()})
                      </option>
                    ))}
                  </select>
                )}
              </div>
            )}

            {/* Resumen de saldo — pegado justo debajo del selector, mientras el contexto está fresco */}
            {remainingBalance !== null && (
              <div style={{ background: "#f8fafc", borderRadius: "10px", padding: "12px 14px", marginBottom: "20px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", marginBottom: "4px" }}>
                  <span style={{ color: "#64748b" }}>Pending Balance</span>
                  <span style={{ fontWeight: "600" }}>${remainingBalance.toLocaleString()}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px" }}>
                  <span style={{ color: "#64748b" }}>This Payment</span>
                  <span style={{ fontWeight: "600", color: "#2563eb" }}>${amountEntered.toLocaleString()}</span>
                </div>
                <hr style={{ margin: "8px 0", borderColor: "#e2e8f0" }} />
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontWeight: "700", fontSize: "14px", color: afterThisPayment <= 0 ? "#166534" : "#0f172a" }}>
                    {afterThisPayment <= 0 ? "Fully Paid" : "Balance After This Payment"}
                  </span>
                  <span style={{ fontSize: "20px", fontWeight: "700", color: afterThisPayment <= 0 ? "#16a34a" : "#0f172a" }}>
                    ${Math.abs(afterThisPayment).toLocaleString()}
                  </span>
                </div>
              </div>
            )}

            {/* ══════════ SECCIÓN 2: Cuánto y cómo ══════════ */}
            <p style={sectionLabelStyle}>Payment Details</p>

            <div className="row">

              <div className="col-md-6 mb-3">
                <label className="form-label" style={{ fontWeight: "500", fontSize: "14px" }}>Payment Method</label>
                <select
                  className="form-select" style={{ borderRadius: "10px" }}
                  value={fields.method}
                  onChange={(e) => setFields({ ...fields, method: e.target.value })}
                >
                  {PAYMENT_METHODS.map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>

              <div className="col-md-6 mb-3">
                <label className="form-label" style={{ fontWeight: "500", fontSize: "14px" }}>Amount ($)</label>
                <input
                  type="number" className="form-control" style={{
                    borderRadius: "10px",
                    borderColor: exceedsBalance ? "#dc2626" : undefined
                  }}
                  placeholder="0.00" min="0.01"
                  value={fields.amount}
                  onChange={(e) => setFields({ ...fields, amount: e.target.value })}
                />
                {exceedsBalance && (
                  <small style={{ color: "#dc2626", fontWeight: "500" }}>
                    Exceeds pending balance by ${(amountEntered - remainingBalance).toLocaleString()}
                  </small>
                )}
              </div>

              {fields.method === "Cash" && (
                <div className="col-12 mb-2">
                  <label className="form-label" style={{ fontWeight: "500", fontSize: "14px" }}>
                    Cash Received ($) <span style={{ color: "#94a3b8", fontWeight: "400" }}>(optional, for change calculation)</span>
                  </label>
                  <input type="number" className="form-control" style={{ borderRadius: "10px" }}
                    min="0" placeholder="0.00"
                    value={cashReceived}
                    onChange={(e) => setCashReceived(e.target.value)}
                  />
                  {cashReceivedNum > 0 && (
                    <div style={{
                      display: "flex", justifyContent: "space-between", marginTop: "8px",
                      padding: "10px 14px", borderRadius: "10px",
                      background: change >= 0 ? "#dcfce7" : "#fee2e2"
                    }}>
                      <span style={{ fontWeight: "700", color: change >= 0 ? "#166534" : "#991b1b" }}>
                        {change >= 0 ? "Change Due" : "Insufficient Cash"}
                      </span>
                      <span style={{ fontSize: "18px", fontWeight: "700", color: change >= 0 ? "#16a34a" : "#dc2626" }}>
                        ${Math.abs(change).toLocaleString()}
                      </span>
                    </div>
                  )}
                </div>
              )}

            </div>

            {/* ══════════ SECCIÓN 3: Estado del pago ══════════ */}
            <p style={{ ...sectionLabelStyle, marginTop: "8px" }}>Status</p>

            <div className="row">

              <div className="col-md-6 mb-3">
                <select
                  className="form-select" style={{ borderRadius: "10px" }}
                  value={fields.status}
                  onChange={(e) => setFields({ ...fields, status: e.target.value })}
                >
                  <option value="Paid">Paid</option>
                  <option value="Pending">Pending</option>
                  <option value="Failed">Failed</option>
                </select>
                <small className="text-muted">"Paid" cannot be edited or deleted after saving</small>
              </div>

              <div className="col-md-6 mb-3">
                <input
                  type="date" className="form-control" style={{ borderRadius: "10px" }}
                  value={fields.date}
                  onChange={(e) => setFields({ ...fields, date: e.target.value })}
                />
              </div>

              <div className="col-12">
                <input
                  type="text" className="form-control" style={{ borderRadius: "10px" }}
                  placeholder="Note (optional)"
                  value={fields.note}
                  onChange={(e) => setFields({ ...fields, note: e.target.value })}
                />
              </div>

            </div>

          </div>

          <div className="modal-footer" style={{ borderTop: "1px solid #f1f5f9" }}>
            <button className="btn btn-light" style={{ borderRadius: "10px" }} onClick={() => setShowModal(false)}>
              Cancel
            </button>
            <button
              onClick={onSave}
              disabled={saving || exceedsBalance}
              style={{
                background: (saving || exceedsBalance) ? "#bfdbfe" : "#dbeafe",
                color: "#1d4ed8", border: "none",
                padding: "8px 20px", borderRadius: "10px",
                fontWeight: "600", cursor: (saving || exceedsBalance) ? "default" : "pointer"
              }}
            >
              {saving ? "Saving..." : "Save Payment"}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}

// ── Página principal ─────────────────────────────────────────────
function Payments() {

  const canView = usePermission("payments.view");
  const canManage = usePermission("payments.manage");

  const [paymentsList, setPaymentsList] = useState([]);
  const [orders, setOrders] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [saving, setSaving] = useState(false);

  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");
  const [showModal, setShowModal] = useState(false);
  const [editPaymentId, setEditPaymentId] = useState(null);

  const emptyFields = {
    order_id: "", purchase_id: "", targetHint: "",
    method: "Cash", amount: "",
    status: "Paid",
    date: new Date().toISOString().split("T")[0],
    note: ""
  };

  const [fields, setFields] = useState(emptyFields);

  const fetchAll = () => {
    setLoading(true);
    Promise.all([
      api.get("/payments"),
      api.get("/orders"),
      api.get("/purchases"),
    ])
      .then(([paymentsRes, ordersRes, purchasesRes]) => {
        setPaymentsList(paymentsRes.data);
        setOrders(ordersRes.data);
        setPurchases(purchasesRes.data);
        setLoadError("");
      })
      .catch(() => setLoadError("Could not load payments. Is the backend running?"))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchAll(); }, []);

  const totalPaid = paymentsList.filter((p) => p.status === "Paid").reduce((s, p) => s + Number(p.amount), 0);
  const totalPending = paymentsList.filter((p) => p.status === "Pending").length;
  const totalFailed = paymentsList.filter((p) => p.status === "Failed").length;

  const filteredPayments = paymentsList.filter((p) => {
    const label = p.order_id
      ? `order #${p.order_id} ${p.order?.customer?.name || ""}`
      : `purchase #${p.purchase_id} ${p.purchase?.supplier?.name || ""}`;
    const matchSearch = label.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === "All" || p.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const openNew = () => {
    setEditPaymentId(null);
    setFields(emptyFields);
    setShowModal(true);
  };

  const editPayment = (p) => {
    if (p.status === "Paid") return;
    setEditPaymentId(p.id);
    setFields({
      order_id: p.order_id || "",
      purchase_id: p.purchase_id || "",
      targetHint: p.order_id ? "order" : "purchase",
      method: p.method,
      amount: p.amount,
      status: p.status,
      date: p.date,
      note: p.note || ""
    });
    setShowModal(true);
  };

  const savePayment = () => {
    if (!fields.order_id && !fields.purchase_id) {
      alert("Select an order or a purchase");
      return;
    }
    if (!fields.amount || Number(fields.amount) <= 0) {
      alert("Enter a valid amount");
      return;
    }

    setSaving(true);

    const payload = {
      order_id: fields.order_id ? Number(fields.order_id) : null,
      purchase_id: fields.purchase_id ? Number(fields.purchase_id) : null,
      method: fields.method,
      amount: Number(fields.amount),
      status: fields.status,
      date: fields.date,
      note: fields.note || null,
    };

    const request = editPaymentId
      ? api.put(`/payments/${editPaymentId}`, payload)
      : api.post("/payments", payload);

    request
      .then(() => { setShowModal(false); fetchAll(); })
      .catch((err) => alert(err.response?.data?.message || "Could not save payment."))
      .finally(() => setSaving(false));
  };

  const deletePayment = (id) => {
    if (!window.confirm("Are you sure you want to delete this payment?")) return;
    api.delete(`/payments/${id}`)
      .then(() => fetchAll())
      .catch((err) => alert(err.response?.data?.message || "Could not delete payment."));
  };

  return (
    <div>

      <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
        <div>
          <h1>Payments</h1>
          <p style={{ color: "#64748b", margin: 0 }}>Track payments for orders and purchases</p>
        </div>
        <div className="d-flex flex-wrap gap-2">

          <input
            type="text" placeholder="Search payment..."
            value={search} onChange={(e) => setSearch(e.target.value)}
            style={{ padding: "10px 14px", borderRadius: "10px", border: "1px solid #cbd5e1", outline: "none", minWidth: "180px" }}
          />

          <select
            value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}
            style={{ padding: "10px 14px", borderRadius: "10px", border: "1px solid #cbd5e1", outline: "none", background: "white", cursor: "pointer" }}
          >
            <option value="All">All Statuses</option>
            <option value="Paid">Paid</option>
            <option value="Pending">Pending</option>
            <option value="Failed">Failed</option>
          </select>

          {canManage && (
            <button
              onClick={openNew}
              style={{
                background: "#dbeafe", color: "#1d4ed8", border: "none",
                padding: "10px 18px", borderRadius: "10px", fontWeight: "600",
                cursor: "pointer", display: "flex", alignItems: "center", gap: "6px", whiteSpace: "nowrap"
              }}
            >
              <BsPlus size={18} /> Register Payment
            </button>
          )}
        </div>
      </div>

      <div className="row mb-4">
        <div className="col-6 col-lg-3 mb-3">
          <StatCard title="Total Payments" value={paymentsList.length} color="#0f172a" />
        </div>
        <div className="col-6 col-lg-3 mb-3">
          <StatCard title="Total Paid" value={"$" + totalPaid.toLocaleString()} color="#16a34a" />
        </div>
        <div className="col-6 col-lg-3 mb-3">
          <StatCard title="Pending" value={totalPending} color="#854d0e" />
        </div>
        <div className="col-6 col-lg-3 mb-3">
          <StatCard title="Failed" value={totalFailed} color="#dc2626" />
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
              {["ID", "For", "Target", "Method", "Amount", "Status", "Date", "Actions"].map((h) => (
                <th key={h} style={thStyle}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="8" className="text-center py-4 text-muted">Loading...</td></tr>
            ) : filteredPayments.length > 0 ? (
              filteredPayments.map((p) => (
                <tr key={p.id} style={{ borderBottom: "1px solid #f1f5f9" }}>

                  <td style={tdStyle}>
                    <span style={{ color: "#94a3b8", fontWeight: "500" }}>#{p.id}</span>
                  </td>

                  <td style={tdStyle}>
                    <TargetBadge payment={p} />
                  </td>

                  <td style={{ ...tdStyle, fontWeight: "500", color: "#0f172a" }}>
                    {p.order_id
                      ? `#${p.order_id} — ${p.order?.customer?.name || "—"}`
                      : `#${p.purchase_id} — ${p.purchase?.supplier?.name || "—"}`}
                  </td>

                  <td style={{ ...tdStyle, color: "#475569", display: "flex", alignItems: "center" }}>
                    <MethodIcon method={p.method} /> {p.method}
                  </td>

                  <td style={{ ...tdStyle, fontWeight: "600", color: "#16a34a" }}>
                    ${Number(p.amount).toLocaleString()}
                  </td>

                  <td style={tdStyle}>
                    <StatusBadge status={p.status} />
                  </td>

                  <td style={{ ...tdStyle, color: "#64748b" }}>{p.date}</td>

                  <td style={tdStyle}>
                    {canManage && p.status !== "Paid" ? (
                      <div style={{ display: "flex", gap: "8px" }}>
                        <button
                          onClick={() => editPayment(p)}
                          style={{ background: "#dbeafe", color: "#1d4ed8", border: "none", borderRadius: "8px", padding: "6px 10px", cursor: "pointer", display: "flex", alignItems: "center" }}
                        >
                          <BsPencilSquare />
                        </button>
                        <button
                          onClick={() => deletePayment(p.id)}
                          style={{ background: "#fee2e2", color: "#b91c1c", border: "none", borderRadius: "8px", padding: "6px 10px", cursor: "pointer", display: "flex", alignItems: "center" }}
                        >
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
              <tr><td colSpan="8" className="text-center py-4 text-muted">No payments found.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <PaymentModal
        showModal={showModal}
        setShowModal={setShowModal}
        isEditing={!!editPaymentId}
        fields={fields}
        setFields={setFields}
        onSave={savePayment}
        saving={saving}
        orders={orders}
        purchases={purchases}
        payments={paymentsList}
        editingPaymentId={editPaymentId}
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

export default Payments;