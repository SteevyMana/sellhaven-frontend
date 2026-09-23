import { useEffect, useState } from "react";
import {
  AreaChart, Area,
  BarChart, Bar,
  PieChart, Pie, Cell, Tooltip as PieTooltip, Legend,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer
} from "recharts";
import { BsCashCoin, BsBoxSeam, BsGraphUpArrow, BsPercent, BsArrowUpCircle, BsCartCheck, BsTruck } from "react-icons/bs";
import api from "../api/client";

const PIE_COLORS = ["#3b82f6", "#7c3aed", "#16a34a", "#d97706"];
const RANGES = ["Last 7 days", "Last 30 days", "Last 6 months", "This year"];

const TYPE_META = {
  Sale:     { icon: BsArrowUpCircle, background: "#dcfce7", color: "#166534" },
  Order:    { icon: BsCartCheck,     background: "#dbeafe", color: "#1e40af" },
  Purchase: { icon: BsTruck,         background: "#fef9c3", color: "#854d0e" },
};

// ── Componentes de apoyo ─────────────────────────────────────────

function SectionTitle({ children }) {
  return <h5 style={{ fontWeight: "600", margin: "0 0 16px", color: "#0f172a" }}>{children}</h5>;
}

function Card({ children, style = {} }) {
  return (
    <div style={{ background: "white", borderRadius: "15px", padding: "22px", boxShadow: "0 2px 10px rgba(0,0,0,0.05)", ...style }}>
      {children}
    </div>
  );
}

function KpiCard({ label, value, sub, color, icon: Icon }) {
  return (
    <div style={{
      background: "white", borderRadius: "12px", padding: "18px 20px",
      boxShadow: "0 2px 10px rgba(0,0,0,0.05)", display: "flex", gap: "14px", alignItems: "flex-start"
    }}>
      <div style={{
        width: "40px", height: "40px", borderRadius: "10px", flexShrink: 0,
        background: color + "1a", color: color,
        display: "flex", alignItems: "center", justifyContent: "center"
      }}>
        <Icon size={18} />
      </div>
      <div style={{ minWidth: 0 }}>
        <p style={{ margin: "0 0 4px", fontSize: "12px", fontWeight: "600", color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.5px" }}>{label}</p>
        <p style={{ margin: "0 0 2px", fontSize: "22px", fontWeight: "700", color, wordBreak: "break-word" }}>{value}</p>
        {sub && <p style={{ margin: 0, fontSize: "12px", color: "#64748b" }}>{sub}</p>}
      </div>
    </div>
  );
}

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: "white", border: "1px solid #e2e8f0", borderRadius: "10px", padding: "10px 14px", boxShadow: "0 4px 12px rgba(0,0,0,0.08)" }}>
      <p style={{ fontWeight: "600", marginBottom: "4px", color: "#0f172a" }}>{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color, margin: "2px 0", fontSize: "13px" }}>
          {p.name}: ${p.value.toLocaleString()}
        </p>
      ))}
    </div>
  );
}

// ── Página principal ─────────────────────────────────────────────
function Reports() {

  const [range, setRange] = useState("Last 30 days");
  const [data, setData]   = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    setLoading(true);
    api.get(`/reports/summary?range=${encodeURIComponent(range)}`)
      .then(({ data }) => { setData(data); setLoadError(""); })
      .catch(() => setLoadError("Could not load reports. Is the backend running?"))
      .finally(() => setLoading(false));
  }, [range]);

  if (loading && !data) {
    return <p className="text-muted">Loading reports...</p>;
  }

  if (loadError) {
    return (
      <div style={{ background: "#fee2e2", color: "#b91c1c", padding: "12px 16px", borderRadius: "10px" }}>
        {loadError}
      </div>
    );
  }

  const monthlySales = data.monthlySales;
  const topProducts = data.topProducts;
  const salesByMethod = data.salesByMethod;
  const lowStockProducts = data.lowStockProducts;
  const recentTransactions = data.recentTransactions;

  const totalRevenue = monthlySales.reduce((s, m) => s + m.sales, 0);
  const totalCost    = monthlySales.reduce((s, m) => s + m.purchases, 0);
  const grossProfit  = totalRevenue - totalCost;
  const profitMargin = totalRevenue > 0 ? ((grossProfit / totalRevenue) * 100).toFixed(1) : "0.0";

  return (
    <div>

      <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
        <div>
          <h1>Reports</h1>
          <p style={{ color: "#64748b", margin: 0 }}>Financial overview and analytics</p>
        </div>

        <div style={{ display: "flex", flexWrap: "wrap", background: "#f1f5f9", borderRadius: "10px", padding: "4px", gap: "2px" }}>
          {RANGES.map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              style={{
                border: "none",
                background: range === r ? "white" : "transparent",
                color: range === r ? "#0f172a" : "#64748b",
                fontWeight: range === r ? "600" : "400",
                padding: "7px 14px", borderRadius: "8px", cursor: "pointer", fontSize: "13px",
                boxShadow: range === r ? "0 1px 4px rgba(0,0,0,0.1)" : "none",
                transition: "all 0.2s", whiteSpace: "nowrap"
              }}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      <div className="row mb-4 g-3">
        <div className="col-6 col-lg-3">
          <KpiCard label="Total Revenue" value={"$" + totalRevenue.toLocaleString()} color="#16a34a" sub="Completed sales in range" icon={BsCashCoin} />
        </div>
        <div className="col-6 col-lg-3">
          <KpiCard label="Total Cost" value={"$" + totalCost.toLocaleString()} color="#2563eb" sub="Received purchases in range" icon={BsBoxSeam} />
        </div>
        <div className="col-6 col-lg-3">
          <KpiCard label="Gross Profit" value={"$" + grossProfit.toLocaleString()} color="#7c3aed" sub="Revenue − Cost" icon={BsGraphUpArrow} />
        </div>
        <div className="col-6 col-lg-3">
          <KpiCard label="Profit Margin" value={profitMargin + "%"} color="#d97706" sub="Gross / Revenue" icon={BsPercent} />
        </div>
      </div>

      <div className="mb-4">
        <Card>
          <SectionTitle>Revenue vs Cost — Monthly</SectionTitle>
          {monthlySales.length === 0 ? (
            <p style={{ color: "#94a3b8", textAlign: "center", padding: "40px 0" }}>No data in this range.</p>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={monthlySales} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="gradSales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#16a34a" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#16a34a" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gradPurchases" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: "#94a3b8" }} axisLine={false} tickLine={false}
                  tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: "13px" }} />
                <Area type="monotone" dataKey="sales" name="Revenue" stroke="#16a34a" strokeWidth={2.5} fill="url(#gradSales)" dot={false} activeDot={{ r: 5 }} />
                <Area type="monotone" dataKey="purchases" name="Cost" stroke="#2563eb" strokeWidth={2.5} fill="url(#gradPurchases)" dot={false} activeDot={{ r: 5 }} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </Card>
      </div>

      <div className="row mb-4 g-3">

        <div className="col-lg-7">
          <Card style={{ height: "100%" }}>
            <SectionTitle>Top Products by Revenue</SectionTitle>
            {topProducts.length === 0 ? (
              <p style={{ color: "#94a3b8", textAlign: "center", padding: "40px 0" }}>No sales in this range.</p>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={topProducts} layout="vertical" margin={{ left: 10, right: 30 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 12, fill: "#94a3b8" }} axisLine={false} tickLine={false}
                    tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                  />
                  <YAxis dataKey="name" type="category" tick={{ fontSize: 13, fill: "#0f172a" }} axisLine={false} tickLine={false} width={90} />
                  <Tooltip formatter={(v) => [`$${v.toLocaleString()}`, "Revenue"]}
                    contentStyle={{ borderRadius: "10px", border: "1px solid #e2e8f0", fontSize: "13px" }}
                  />
                  <Bar dataKey="revenue" fill="#7c3aed" radius={[0, 6, 6, 0]} barSize={18} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </Card>
        </div>

        <div className="col-lg-5">
          <Card style={{ height: "100%" }}>
            <SectionTitle>Sales by Payment Method</SectionTitle>
            {salesByMethod.length === 0 ? (
              <p style={{ color: "#94a3b8", textAlign: "center", padding: "40px 0" }}>No sales in this range.</p>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={salesByMethod} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={4} dataKey="value">
                    {salesByMethod.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <PieTooltip formatter={(v) => [`${v}%`, "Share"]}
                    contentStyle={{ borderRadius: "10px", border: "1px solid #e2e8f0", fontSize: "13px" }}
                  />
                  <Legend wrapperStyle={{ fontSize: "13px" }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </Card>
        </div>

      </div>

      <div className="row g-3">

        <div className="col-lg-5">
          <Card>
            <SectionTitle>Low Stock Alert</SectionTitle>
            {lowStockProducts.length === 0 ? (
              <p style={{ color: "#94a3b8", textAlign: "center", padding: "20px 0" }}>All products are well stocked.</p>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "360px" }}>
                  <thead>
                    <tr style={{ borderBottom: "1px solid #e2e8f0" }}>
                      {["Product", "Category", "Stock", "Min"].map((h) => (
                        <th key={h} style={{ padding: "10px 12px", textAlign: "left", fontSize: "11px", fontWeight: "600", color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.5px", whiteSpace: "nowrap" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {lowStockProducts.map((p) => (
                      <tr key={p.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                        <td style={{ padding: "10px 12px", fontWeight: "500", color: "#0f172a", whiteSpace: "nowrap" }}>{p.name}</td>
                        <td style={{ padding: "10px 12px" }}>
                          <span style={{ background: "#f1f5f9", color: "#475569", padding: "2px 8px", borderRadius: "20px", fontSize: "12px", whiteSpace: "nowrap" }}>{p.category}</span>
                        </td>
                        <td style={{ padding: "10px 12px" }}>
                          <span style={{ background: "#fee2e2", color: "#991b1b", padding: "3px 10px", borderRadius: "20px", fontSize: "12px", fontWeight: "600" }}>
                            {p.stock}
                          </span>
                        </td>
                        <td style={{ padding: "10px 12px", color: "#64748b", fontSize: "13px" }}>{p.min}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>

        <div className="col-lg-7">
          <Card>
            <SectionTitle>Recent Transactions</SectionTitle>
            {recentTransactions.length === 0 ? (
              <p style={{ color: "#94a3b8", textAlign: "center", padding: "20px 0" }}>No transactions yet.</p>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "480px" }}>
                  <thead>
                    <tr style={{ borderBottom: "1px solid #e2e8f0" }}>
                      {["Reference", "Type", "Amount", "Method", "Date"].map((h) => (
                        <th key={h} style={{ padding: "10px 12px", textAlign: "left", fontSize: "11px", fontWeight: "600", color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.5px", whiteSpace: "nowrap" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {recentTransactions.map((t) => {
                      const meta = TYPE_META[t.type] || {};
                      const Icon = meta.icon;
                      return (
                        <tr key={t.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                          <td style={{ padding: "10px 12px", fontWeight: "600", color: "#0f172a", whiteSpace: "nowrap" }}>{t.id}</td>
                          <td style={{ padding: "10px 12px" }}>
                            <span style={{
                              background: meta.background, color: meta.color,
                              display: "inline-flex", alignItems: "center", gap: "5px",
                              padding: "3px 10px", borderRadius: "20px", fontSize: "12px", fontWeight: "500", whiteSpace: "nowrap"
                            }}>
                              {Icon && <Icon size={12} />} {t.type}
                            </span>
                          </td>
                          <td style={{ padding: "10px 12px", fontWeight: "600", color: t.type === "Purchase" ? "#2563eb" : "#16a34a", whiteSpace: "nowrap" }}>
                            {t.type === "Purchase" ? "-" : "+"}${t.amount.toLocaleString()}
                          </td>
                          <td style={{ padding: "10px 12px", color: "#475569", fontSize: "13px", whiteSpace: "nowrap" }}>{t.method}</td>
                          <td style={{ padding: "10px 12px", color: "#64748b", fontSize: "13px", whiteSpace: "nowrap" }}>{t.date}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>

      </div>

    </div>
  );
}

export default Reports;