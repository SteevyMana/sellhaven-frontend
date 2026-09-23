import { useState } from "react";
import { NavLink } from "react-router-dom";
import { useAnyPermission } from "../hooks/usePermission";
import {
  FaChartLine, FaBox, FaShoppingCart, FaUsers, FaTags, FaTruck,
  FaChevronLeft, FaChevronRight, FaChevronDown, FaClipboardList,
  FaUndo, FaCreditCard, FaFileInvoice, FaBoxOpen, FaUserShield,
  FaKey, FaLock, FaTimes
} from "react-icons/fa";

import sellhavenLogo from "../assets/shIniciales.png";

function Sidebar({ collapsed, setCollapsed, isMobile, mobileOpen, setMobileOpen }) {

  // En mobile el drawer siempre se ve expandido (nunca modo iconos) —
  // colapsar no tiene sentido en un panel que ya es temporal/overlay.
  const effectiveCollapsed = isMobile ? false : collapsed;
  const sidebarWidth = effectiveCollapsed ? "70px" : "250px";

  const [openGroup, setOpenGroup] = useState("inventory");
  const [hoveredGroup, setHoveredGroup] = useState(null);
  const [hoveredItem, setHoveredItem] = useState(null);

  const toggleGroup = (group) => setOpenGroup((cur) => (cur === group ? null : group));

  // Cierra el drawer al navegar, solo en mobile.
  const closeOnMobile = () => { if (isMobile) setMobileOpen(false); };

  const groups = {
    inventory: [
      { to: "/products", text: "Products", icon: <FaBox size={16} /> },
      { to: "/categories", text: "Categories", icon: <FaTags size={16} /> },
      { to: "/stock-entries", text: "Stock Entries", icon: <FaBoxOpen size={16} /> }
    ],
    sales: [
      { to: "/customers", text: "Customers", icon: <FaUsers size={16} /> },
      { to: "/orders", text: "Orders", icon: <FaShoppingCart size={16} /> },
      { to: "/sales", text: "Sales / POS", icon: <FaChartLine size={16} /> },
      { to: "/payments", text: "Payments", icon: <FaCreditCard size={16} /> },
      { to: "/returns", text: "Returns", icon: <FaUndo size={16} /> }
    ],
    purchases: [
      { to: "/suppliers", text: "Suppliers", icon: <FaTruck size={16} /> },
      { to: "/purchases", text: "Purchases", icon: <FaClipboardList size={16} /> },
      { to: "/returns", text: "Returns", icon: <FaUndo size={16} /> }
    ],
    reports: [
      { to: "/reports", text: "Reports", icon: <FaFileInvoice size={16} /> }
    ],
    security: [
      { to: "/users", text: "Users", icon: <FaUserShield size={16} /> },
      { to: "/roles", text: "Roles", icon: <FaLock size={16} /> },
      { to: "/permissions", text: "Permissions", icon: <FaKey size={16} /> },
      { to: "/audit-log", text: "Audit Log", icon: <FaFileInvoice size={16} /> }
    ]
  };

  const groupInfo = {
    inventory: { title: "Inventory", icon: <FaBox size={16} /> },
    sales: { title: "Sales", icon: <FaChartLine size={16} /> },
    purchases: { title: "Purchases", icon: <FaTruck size={16} /> },
    reports: { title: "Reports", icon: <FaFileInvoice size={16} /> },
    security: { title: "Security", icon: <FaUserShield size={16} /> }
  };

  const canSeeSecurity = useAnyPermission(["users.manage", "roles.manage", "settings.manage"]);
  const visibleGroups = Object.keys(groups).filter((g) => g !== "security" || canSeeSecurity);

  return (
    <>
      {/* Backdrop — solo en mobile, cuando el drawer está abierto */}
      {isMobile && mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          style={{
            position: "fixed", inset: 0, background: "rgba(15, 23, 42, 0.45)",
            zIndex: 99, transition: "opacity 0.2s ease"
          }}
        />
      )}

      <div
        style={{
          width: sidebarWidth,
          height: "100vh",
          background: "#f8f9fb",
          borderRight: "1px solid #e2e8f0",
          padding: effectiveCollapsed ? "20px 10px" : "20px 14px",
          position: "fixed",
          left: 0,
          top: 0,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          zIndex: 100,
          boxSizing: "border-box",
          transition: isMobile
            ? "transform 0.25s ease"
            : "width 0.25s ease, padding 0.25s ease",
          transform: isMobile ? (mobileOpen ? "translateX(0)" : "translateX(-100%)") : "none",
          boxShadow: isMobile && mobileOpen ? "0 0 30px rgba(0,0,0,0.25)" : "none"
        }}
      >

        {/* Header */}
        <div style={{
          display: "flex", alignItems: "center",
          justifyContent: effectiveCollapsed ? "center" : "space-between",
          marginBottom: "30px", padding: "0 4px"
        }}>

          {!effectiveCollapsed && (
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <img
                src={sellhavenLogo}
                alt="SellHaven"
                style={{
                  width: "50px",
                  height: "50px",
                  objectFit: "contain",
                  filter: "brightness(0) saturate(100%) invert(10%)",
                }}
              />

              <div>
                <h2
                  style={{
                    fontWeight: "700",
                    color: "#1e293b",
                    fontSize: "20px",
                    margin: 0,
                    whiteSpace: "nowrap",
                  }}
                >
                  SellHaven
                </h2>

                <small
                  style={{
                    color: "#94a3b8",
                    fontSize: "12px",
                  }}
                >
                  Admin Panel
                </small>
              </div>
            </div>
          )}

          {/* En mobile: botón de cerrar (X). En desktop: botón de colapsar. */}
          <button
            onClick={() => (isMobile ? setMobileOpen(false) : setCollapsed(!collapsed))}
            style={{
              background: "#e8f0fe", border: "none", borderRadius: "8px",
              width: "32px", height: "32px", display: "flex",
              alignItems: "center", justifyContent: "center", cursor: "pointer",
              color: "#4a6fa5", flexShrink: 0, transition: "background 0.15s"
            }}
            title={isMobile ? "Close menu" : (collapsed ? "Expand sidebar" : "Collapse sidebar")}
          >
            {isMobile ? <FaTimes size={14} /> : (collapsed ? <FaChevronRight size={12} /> : <FaChevronLeft size={12} />)}
          </button>

        </div>

        {!effectiveCollapsed && (
          <p style={{
            fontSize: "11px", fontWeight: "600", color: "#94a3b8",
            textTransform: "uppercase", letterSpacing: "0.8px",
            padding: "0 10px", marginBottom: "8px", whiteSpace: "nowrap"
          }}>
            Navigation
          </p>
        )}

        <SidebarLink to="/" icon={<FaChartLine size={16} />} text="Dashboard" collapsed={effectiveCollapsed} onClick={closeOnMobile} />

        {visibleGroups.map((group) => (
          <div key={group} style={{ position: "relative" }}>

            <button
              onClick={() => toggleGroup(group)}
              onMouseEnter={() => setHoveredGroup(group)}
              onMouseLeave={() => setHoveredGroup(null)}
              style={{
                width: "100%", display: "flex", alignItems: "center",
                justifyContent: effectiveCollapsed ? "center" : "space-between",
                gap: "12px", background: openGroup === group ? "#f1f5f9" : "transparent",
                border: "none", borderRadius: "10px",
                padding: effectiveCollapsed ? "11px" : "10px 14px", marginTop: "7px",
                cursor: "pointer", color: openGroup === group ? "#4a6fa5" : "#64748b",
                fontSize: "14px", fontWeight: openGroup === group ? "600" : "500",
                textAlign: "left", transition: "all 0.15s ease", position: "relative"
              }}
            >
              <span style={{ display: "flex", alignItems: "center", gap: "12px", flexShrink: 0 }}>
                {groupInfo[group].icon}
                {!effectiveCollapsed && <span>{groupInfo[group].title}</span>}
              </span>

              {!effectiveCollapsed && (
                <FaChevronDown
                  size={10}
                  style={{
                    transform: openGroup === group ? "rotate(0deg)" : "rotate(-90deg)",
                    transition: "transform 0.2s ease"
                  }}
                />
              )}

              {effectiveCollapsed && hoveredGroup === group && (
                <GroupTooltip title={groupInfo[group].title} items={groups[group]} />
              )}
            </button>

            {effectiveCollapsed && openGroup === group && (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "3px", marginTop: "3px" }}>
                {groups[group].map((item) => (
                  <CollapsedChildLink key={item.to + item.text} item={item} onHover={setHoveredItem} hoveredItem={hoveredItem} onClick={closeOnMobile} />
                ))}
              </div>
            )}

            {!effectiveCollapsed && openGroup === group && (
              <div>
                {groups[group].map((item) => (
                  <SidebarLink key={item.to + item.text} to={item.to} icon={item.icon} text={item.text} collapsed={effectiveCollapsed} onClick={closeOnMobile} />
                ))}
              </div>
            )}

          </div>
        ))}

        <div className={`developer-sidebar ${effectiveCollapsed ? "collapsed" : ""}`}>
  {!effectiveCollapsed ? (
    <>
      <span className="developer-sidebar-label">
        Developed by
      </span>

      <strong>Steeve Manace</strong>

      <span className="developer-sidebar-role">
        Web Developer · Business Systems
      </span>

      <span className="developer-sidebar-copy">
        © 2026 SellHaven
      </span>
    </>
  ) : (
    <>
      <strong className="developer-initials">SM</strong>

      <span className="developer-sidebar-copy">
        © 2026
      </span>
    </>
  )}
</div>

      </div>
    </>
  );
}

function GroupTooltip({ title, items }) {
  return (
    <div style={{
      position: "fixed", left: "78px", minWidth: "175px", background: "#1e293b",
      color: "#ffffff", borderRadius: "8px", padding: "10px 12px",
      boxShadow: "0 6px 18px rgba(15, 23, 42, 0.18)", zIndex: 1000, pointerEvents: "none"
    }}>
      <div style={{ fontSize: "13px", fontWeight: "600", marginBottom: "6px" }}>{title}</div>
      {items.map((item) => (
        <div key={item.text} style={{ fontSize: "12px", color: "#cbd5e1", lineHeight: "20px" }}>• {item.text}</div>
      ))}
    </div>
  );
}

function CollapsedChildLink({ item, onHover, hoveredItem, onClick }) {
  return (
    <div style={{ position: "relative" }} onMouseEnter={() => onHover(item.text)} onMouseLeave={() => onHover(null)}>
      <NavLink
        to={item.to}
        title={item.text}
        onClick={onClick}
        style={({ isActive }) => ({
          width: "40px", height: "38px", display: "flex", alignItems: "center", justifyContent: "center",
          borderRadius: "8px", textDecoration: "none",
          color: isActive ? "#4a6fa5" : "#64748b",
          background: isActive ? "#e8f0fe" : "transparent",
          transition: "all 0.15s ease"
        })}
      >
        {item.icon}
      </NavLink>

      {hoveredItem === item.text && (
        <div style={{
          position: "fixed", left: "78px", background: "#1e293b", color: "#ffffff",
          padding: "7px 10px", borderRadius: "7px", fontSize: "12px", whiteSpace: "nowrap",
          boxShadow: "0 5px 15px rgba(15, 23, 42, 0.18)", zIndex: 1000, pointerEvents: "none"
        }}>
          {item.text}
        </div>
      )}
    </div>
  );
}

function SidebarLink({ to, icon, text, collapsed, onClick }) {
  return (
    <NavLink
      to={to}
      end={to === "/"}
      title={collapsed ? text : ""}
      onClick={onClick}
      style={({ isActive }) => ({
        display: "flex", alignItems: "center",
        justifyContent: collapsed ? "center" : "flex-start",
        gap: "12px", padding: collapsed ? "11px" : "10px 14px",
        marginBottom: "3px", marginLeft: collapsed ? "0" : "8px",
        borderRadius: "10px", textDecoration: "none",
        fontWeight: isActive ? "600" : "400", fontSize: "14px",
        color: isActive ? "#4a6fa5" : "#475569",
        background: isActive ? "#e8f0fe" : "transparent",
        transition: "all 0.15s ease", whiteSpace: "nowrap", overflow: "hidden"
      })}
    >
      <span style={{ flexShrink: 0, display: "flex", alignItems: "center" }}>{icon}</span>
      {!collapsed && <span>{text}</span>}
    </NavLink>
  );
}

export default Sidebar;