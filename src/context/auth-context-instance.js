import { createContext } from "react";

// Instancia cruda del contexto — vive sola en este archivo para que
// AuthContext.jsx (el Provider) y useAuth.js (el hook) puedan
// importarla sin mezclar exports de componente + no-componente
// en un mismo módulo (regla react-refresh/only-export-components).
export const AuthContext = createContext(null);