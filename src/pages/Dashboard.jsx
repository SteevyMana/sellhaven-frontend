import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/client";
import { useAuth } from "../hooks/useAuth";
import {
  BsCurrencyDollar, BsCart3, BsPeopleFill,
  BsBoxSeam, BsClockHistory, BsArrowCounterclockwise,
  BsExclamationTriangle, BsArrowUpCircle, BsCartCheck,
  BsTruck, BsArrowRight, BsGraphUpArrow
} from "react-icons/bs";

// ── KPI Card ─────────────────────────────────────────────────────
function KpiCard({ icon: Icon, label, value, sub, color, bg, onClick }) {
  return (
    <div
      onClick={onClick}
      style={{
        background: "white",
        borderRadius: "14px",
        padding: "14px 16px",
        boxShadow: "0 1px 8px rgba(0,0,0,0.06)",
        display: "flex",
        alignItems: "center",
        gap: "12px",
        cursor: onClick ? "pointer" : "default",
        transition: "transform 0.15s, box-shadow 0.15s",
        height: "100%"
      }}
      onMouseEnter={e => {
        if (onClick) {
          e.currentTarget.style.transform = "translateY(-2px)";
          e.currentTarget.style.boxShadow = "0 6px 20px rgba(0,0,0,0.1)";
        }
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = "0 1px 8px rgba(0,0,0,0.06)";
      }}
    >
      {/* Ícono */}
      <div style={{
        width: "42px", height: "42px", borderRadius: "12px",
        background: bg, color: color, flexShrink: 0,
        display: "flex", alignItems: "center", justifyContent: "center"
      }}>
        <Icon size={19} />
      </div>

      {/* Texto */}
      <div style={{ minWidth: 0, flex: 1 }}>
        <p style={{
          margin: "0 0 1px",
          fontSize: "10px",
          fontWeight: "600",
          color: "#94a3b8",
          textTransform: "uppercase",
          letterSpacing: "0.5px",
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis"
        }}>
          {label}
        </p>
        <p style={{
          margin: "0 0 2px",
          fontSize: "20px",
          fontWeight: "700",
          color,
          lineHeight: 1.1
        }}>
          {value}
        </p>
        {sub && (
          <p style={{
            margin: 0,
            fontSize: "10px",
            color: "#94a3b8",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis"
          }}>
            {sub}
          </p>
        )}
      </div>

    </div>
  );
}

// ── Activity Item ─────────────────────────────────────────────────
const TYPE_META = {
  Sale:     { icon: BsArrowUpCircle, color: "#16a34a", bg: "#dcfce7", label: "Sale" },
  Order:    { icon: BsCartCheck,     color: "#2563eb", bg: "#dbeafe", label: "Order" },
  Purchase: { icon: BsTruck,         color: "#d97706", bg: "#fef3c7", label: "Purchase" },
};

const STATUS_COLORS = {
  Completed: { color: "#166534", bg: "#dcfce7" },
  Delivered: { color: "#166534", bg: "#dcfce7" },
  Pending:   { color: "#854d0e", bg: "#fef9c3" },
  Received:  { color: "#1e40af", bg: "#dbeafe" },
  Refunded:  { color: "#991b1b", bg: "#fee2e2" },
  Cancelled: { color: "#991b1b", bg: "#fee2e2" },
};

function ActivityItem({ transaction }) {
  const meta   = TYPE_META[transaction.type] || TYPE_META.Sale;
  const status = STATUS_COLORS[transaction.status] || { color: "#64748b", bg: "#f1f5f9" };
  const Icon   = meta.icon;

  return (
    <div style={{
      display: "flex", alignItems: "center", gap: "12px",
      padding: "12px 0", borderBottom: "1px solid #f1f5f9"
    }}>
      <div style={{
        width: "38px", height: "38px", borderRadius: "10px",
        background: meta.bg, color: meta.color, flexShrink: 0,
        display: "flex", alignItems: "center", justifyContent: "center"
      }}>
        <Icon size={16} />
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "2px" }}>
          <span style={{ fontWeight: "600", fontSize: "13px", color: "#0f172a" }}>
            {transaction.id}
          </span>
          <span style={{
            fontSize: "11px", fontWeight: "600", padding: "1px 8px",
            borderRadius: "20px", background: status.bg, color: status.color
          }}>
            {transaction.status}
          </span>
        </div>
        <p style={{ margin: 0, fontSize: "12px", color: "#64748b" }}>
          {transaction.date}
        </p>
      </div>

      <span style={{ fontWeight: "700", fontSize: "14px", color: meta.color, flexShrink: 0 }}>
        ${Number(transaction.amount).toLocaleString()}
      </span>
    </div>
  );
}

// ── Quick Action Card ─────────────────────────────────────────────
function QuickAction({ icon: Icon, label, color, bg, to }) {
  const navigate = useNavigate();
  return (
    <button
      onClick={() => navigate(to)}
      style={{
        background: bg, border: "none", borderRadius: "12px",
        padding: "14px 16px", cursor: "pointer",
        display: "flex", alignItems: "center", gap: "10px",
        width: "100%", textAlign: "left", transition: "opacity 0.15s"
      }}
      onMouseEnter={e => e.currentTarget.style.opacity = "0.85"}
      onMouseLeave={e => e.currentTarget.style.opacity = "1"}
    >
      <Icon size={18} color={color} />
      <span style={{ fontSize: "13px", fontWeight: "600", color }}>{label}</span>
    </button>
  );
}

// ── Página principal ──────────────────────────────────────────────
function Dashboard() {
  const navigate = useNavigate();
  const [summary,   setSummary]   = useState(null);
  const [loading,   setLoading]   = useState(true);
  const [loadError, setLoadError] = useState("");
  const { user, logout } = useAuth();

  useEffect(() => {
    api.get("/reports/summary")
      .then(({ data }) => { setSummary(data); setLoadError(""); })
      .catch(() => setLoadError("Could not load dashboard data."))
      .finally(() => setLoading(false));
  }, []);

  const kpis = summary?.kpis || {};

  const fmt    = (v) => loading ? "—" : (v ?? 0).toLocaleString();
  const fmtUSD = (v) => loading ? "—" : "$" + (v ?? 0).toLocaleString();
  const now  = new Date();
  const hour = now.getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  return (
    <div>

      {/* Header */}
      <div style={{ marginBottom: "28px" }}>
        <h1 style={{ marginBottom: "4px" }}>Dashboard</h1>
        <p style={{ color: "#64748b", margin: 0 }}>
          {greeting}, {user.name} — here's your business overview.
        </p>
      </div>

      {loadError && (
        <div style={{ background: "#fee2e2", color: "#b91c1c", padding: "12px 16px", borderRadius: "10px", marginBottom: "20px", fontSize: "13px" }}>
          {loadError}
        </div>
      )}

      {/* KPI Grid — 2 columnas en móvil, 3 en desktop */}
      <div className="row g-3 mb-4">

        <div className="col-6 col-lg-4">
          <KpiCard icon={BsCurrencyDollar} label="Revenue" value={fmtUSD(kpis.revenue)}
            sub="Completed sales"
            color="#16a34a" bg="#dcfce7"
            onClick={() => navigate("/reports")}
          />
        </div>

        <div className="col-6 col-lg-4">
          <KpiCard icon={BsCart3} label="Orders" value={fmt(kpis.orders)}
            sub="Total online orders"
            color="#2563eb" bg="#dbeafe"
            onClick={() => navigate("/orders")}
          />
        </div>

        <div className="col-6 col-lg-4">
          <KpiCard icon={BsPeopleFill} label="Customers" value={fmt(kpis.customers)}
            sub="Registered customers"
            color="#7c3aed" bg="#ede9fe"
            onClick={() => navigate("/customers")}
          />
        </div>

        <div className="col-6 col-lg-4">
          <KpiCard icon={BsBoxSeam} label="Products" value={fmt(kpis.products)}
            sub="Items in catalog"
            color="#0f172a" bg="#f1f5f9"
            onClick={() => navigate("/products")}
          />
        </div>

        <div className="col-6 col-lg-4">
          <KpiCard icon={BsClockHistory} label="Pending" value={fmt(kpis.pendingOrders)}
            sub="Awaiting processing"
            color="#d97706" bg="#fef3c7"
            onClick={() => navigate("/orders")}
          />
        </div>

        <div className="col-6 col-lg-4">
          <KpiCard icon={BsArrowCounterclockwise} label="Refunds" value={fmt(kpis.refunds)}
            sub="Customer returns"
            color="#dc2626" bg="#fee2e2"
            onClick={() => navigate("/customer-returns")}
          />
        </div>

      </div>

      {/* Main row */}
      <div className="row g-4 mb-4">

        {/* Recent Activity */}
        <div className="col-12 col-lg-7">
          <div style={{ background: "white", borderRadius: "18px", padding: "24px", boxShadow: "0 1px 8px rgba(0,0,0,0.06)", height: "100%" }}>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <h5 style={{ margin: 0, fontWeight: "600" }}>Recent Transactions</h5>
              <button
                onClick={() => navigate("/reports")}
                style={{ background: "none", border: "none", color: "#2563eb", fontWeight: "600", fontSize: "13px", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px" }}
              >
                View Reports <BsArrowRight size={13} />
              </button>
            </div>

            {loading ? (
              <p style={{ color: "#94a3b8", fontSize: "13px" }}>Loading...</p>
            ) : !summary?.recentTransactions?.length ? (
              <div style={{ textAlign: "center", padding: "32px 0", color: "#94a3b8" }}>
                <BsGraphUpArrow size={32} style={{ marginBottom: "8px", opacity: 0.4 }} />
                <p style={{ margin: 0, fontSize: "13px" }}>No transactions yet</p>
              </div>
            ) : (
              summary.recentTransactions.slice(0, 6).map((t) => (
                <ActivityItem key={t.id + t.type} transaction={t} />
              ))
            )}

          </div>
        </div>

        {/* Quick Actions + Low Stock */}
        <div className="col-12 col-lg-5">
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>

            {/* Quick Actions */}
            <div style={{ background: "white", borderRadius: "18px", padding: "24px", boxShadow: "0 1px 8px rgba(0,0,0,0.06)" }}>
              <h5 style={{ margin: "0 0 14px", fontWeight: "600" }}>Quick Actions</h5>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <QuickAction icon={BsArrowUpCircle} label="New Sale / POS"     color="#166534" bg="#dcfce7" to="/sales" />
                <QuickAction icon={BsCartCheck}     label="New Order"           color="#1e40af" bg="#dbeafe" to="/orders" />
                <QuickAction icon={BsTruck}         label="New Purchase"        color="#92400e" bg="#fef3c7" to="/purchases" />
                <QuickAction icon={BsBoxSeam}       label="Stock Entry"         color="#1e3a5f" bg="#e0f2fe" to="/stock-entries" />
              </div>
            </div>

            {/* Low Stock Alert */}
            {!loading && summary?.lowStockProducts?.length > 0 && (
              <div style={{ background: "white", borderRadius: "18px", padding: "24px", boxShadow: "0 1px 8px rgba(0,0,0,0.06)" }}>

                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "14px" }}>
                  <h5 style={{ margin: 0, fontWeight: "600", color: "#d97706" }}>Low Stock Alert</h5>
                </div>

                {summary.lowStockProducts.slice(0, 4).map((p) => (
                  <div key={p.id} style={{
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                    padding: "8px 0", borderBottom: "1px solid #f1f5f9"
                  }}>
                    <div>
                      <p style={{ margin: 0, fontSize: "13px", fontWeight: "500", color: "#0f172a" }}>{p.name}</p>
                      <p style={{ margin: 0, fontSize: "11px", color: "#94a3b8" }}>{p.category}</p>
                    </div>
                    <span style={{
                      fontSize: "12px", fontWeight: "700", padding: "3px 10px",
                      borderRadius: "20px", background: "#fee2e2", color: "#b91c1c"
                    }}>
                      {p.stock} left
                    </span>
                  </div>
                ))}

                <button
                  onClick={() => navigate("/stock-entries")}
                  style={{
                    marginTop: "12px", background: "#fef3c7", color: "#92400e",
                    border: "none", borderRadius: "8px", padding: "8px 14px",
                    fontSize: "12px", fontWeight: "600", cursor: "pointer", width: "100%"
                  }}
                >
                  Manage Stock →
                </button>

              </div>
            )}

          </div>
        </div>

      </div>

    </div>
  );
}

export default Dashboard;