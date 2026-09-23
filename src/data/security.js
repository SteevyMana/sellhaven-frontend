// ── Constantes compartidas del módulo de Seguridad ─────────────────
// Los datos (permisos, roles, usuarios) ahora vienen de la API real
// (/api/permissions, /api/roles, /api/users). Este archivo solo guarda
// lo puramente estático: la lista de módulos del sistema y los
// colores de badge por módulo.

export const MODULES = [
  "Products", "Categories", "Orders", "Customers",
  "Suppliers", "Purchases", "Reports", "Users", "Roles", "Settings"
];

const MODULE_COLORS = {
  Products:  "#2563eb", Categories: "#7c3aed", Orders:    "#16a34a",
  Customers: "#0891b2", Suppliers:  "#c2410c", Purchases: "#b45309",
  Reports:   "#4338ca", Users:      "#be123c", Roles:     "#a16207",
  Settings:  "#475569",
};

export const moduleColor = (m) => MODULE_COLORS[m] || "#64748b";