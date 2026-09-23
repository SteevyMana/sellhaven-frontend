import { useEffect, useState } from "react";
import api from "../api/client";
import { AuthContext } from "./auth-context-instance";

// ── Provider de autenticación ──────────────────────────────────────
// Habla con el backend real (POST /api/login, /api/logout, /api/me)
// via Sanctum. El token se guarda en localStorage y viaja en cada
// request como header Authorization: Bearer <token> (ver api/client.js).
// Al montar, valida el token guardado contra GET /api/me — si ya no
// es válido (vencido, revocado, o quedó de una sesión mock vieja),
// se limpia la sesión local en vez de confiar ciegamente en ella.

const TOKEN_KEY = "auth_token";
const USER_KEY  = "auth_user";

function readStoredUser() {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {

  const [user, setUser] = useState(readStoredUser);
  // Solo hay algo que verificar si ya existe un token guardado.
  const [checking, setChecking] = useState(() => !!localStorage.getItem(TOKEN_KEY));

  // ── Verificar sesión real al cargar la app ──
  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) return;

    api.get("/me")
      .then(({ data }) => {
        setUser(data);
        localStorage.setItem(USER_KEY, JSON.stringify(data));
      })
      .catch(() => {
        setUser(null);
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
      })
      .finally(() => setChecking(false));
  }, []);

  // ── Login ──
  const login = async (email, password) => {
    try {
      const { data } = await api.post("/login", { email, password });

      setUser(data.user);
      localStorage.setItem(TOKEN_KEY, data.token);
      localStorage.setItem(USER_KEY, JSON.stringify(data.user));

      return { ok: true };
    } catch (err) {
      const message =
        err.response?.data?.errors?.email?.[0] ||
        err.response?.data?.message ||
        "Unable to sign in. Please try again.";
      return { ok: false, error: message };
    }
  };

  // ── Logout ──
  const logout = async () => {
    try {
      await api.post("/logout");
    } catch {
      // si el token ya venció, igual limpiamos la sesión local
    }
    setUser(null);
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  };

  const value = {
    user,
    isAuthenticated: !!user,
    checking,
    login,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}