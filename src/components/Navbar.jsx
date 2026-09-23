import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaBell, FaSearch, FaSignOutAlt, FaBars } from "react-icons/fa";
import { useAuth } from "../hooks/useAuth";

const initials = (name = "") =>
  name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase();

function Navbar({ isMobile, onOpenMenu }) {

  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate("/login", { replace: true });
  };

  return (
    <div style={{
      height: "75px", background: "white", display: "flex",
      alignItems: "center", justifyContent: "space-between",
      padding: isMobile ? "0 16px" : "0 30px",
      boxShadow: "0 2px 10px rgba(0,0,0,0.05)", gap: "12px"
    }}>

      <div style={{ display: "flex", alignItems: "center", gap: "14px", minWidth: 0, flex: 1 }}>

        {/* Hamburguesa — solo en mobile, abre el drawer del sidebar */}
        {isMobile && (
          <button
            onClick={onOpenMenu}
            style={{
              background: "#f1f5f9", border: "none", borderRadius: "10px",
              width: "40px", height: "40px", display: "flex", alignItems: "center",
              justifyContent: "center", cursor: "pointer", color: "#0f172a", flexShrink: 0
            }}
            title="Open menu"
          >
            <FaBars size={16} />
          </button>
        )}

        {/* Búsqueda — se oculta en mobile para dejar espacio */}
        {!isMobile && (
          <div style={{
            display: "flex", alignItems: "center", gap: "10px", background: "#f1f5f9",
            padding: "10px 15px", borderRadius: "10px", width: "300px"
          }}>
            <FaSearch />
            <input
              type="text" placeholder="Search..."
              style={{ border: "none", outline: "none", background: "transparent", width: "100%" }}
            />
          </div>
        )}
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: isMobile ? "12px" : "20px", position: "relative", flexShrink: 0 }}>

        <FaBell size={20} />

        <div onClick={() => setMenuOpen(!menuOpen)} style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer" }}>
          <div style={{
            width: "40px", height: "40px", borderRadius: "50%", background: "#0f172a",
            color: "white", display: "flex", alignItems: "center", justifyContent: "center",
            fontWeight: "bold", fontSize: "14px", flexShrink: 0
          }}>
            {user ? initials(user.name) : "?"}
          </div>

          {/* Nombre/rol — se ocultan en mobile, solo queda el avatar */}
          {user && !isMobile && (
            <div style={{ lineHeight: "1.2" }}>
              <div style={{ fontWeight: "600", fontSize: "13px", color: "#0f172a" }}>{user.name}</div>
              <div style={{ fontSize: "11px", color: "#94a3b8" }}>{user.role?.name}</div>
            </div>
          )}
        </div>

        {menuOpen && (
          <div style={{
            position: "absolute", top: "50px", right: 0, background: "white",
            borderRadius: "10px", boxShadow: "0 4px 20px rgba(0,0,0,0.12)",
            minWidth: "160px", overflow: "hidden", zIndex: 20
          }}>
            <button
              onClick={handleLogout}
              style={{
                width: "100%", display: "flex", alignItems: "center", gap: "8px",
                padding: "12px 16px", background: "none", border: "none",
                color: "#b91c1c", fontWeight: "500", fontSize: "13px", cursor: "pointer"
              }}
            >
              <FaSignOutAlt /> Log out
            </button>
          </div>
        )}

      </div>

    </div>
  );
}

export default Navbar;