import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

// ── Bloquea el panel admin si no hay sesión activa ─────────────────
function ProtectedRoute({ children }) {

  const { isAuthenticated, checking } = useAuth();
  const location = useLocation();

  // Todavía verificando el token contra /api/me — evita un
  // redirect-flash a /login mientras la petición está en vuelo.
  if (checking) {
    return (
      <div style={{
        minHeight: "100vh", display: "flex",
        alignItems: "center", justifyContent: "center",
        color: "#94a3b8", fontSize: "14px"
      }}>
        Loading...
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  return children;
}

export default ProtectedRoute;