import { useAuth } from "./useAuth";

// ── Chequeo de permisos ──────────────────────────────────────────
// Lee user.role.permissions (viene anidado desde /api/login y /api/me)
// y devuelve true/false. Uso: const canEdit = usePermission("products.edit");
export function usePermission(permissionName) {
  const { user } = useAuth();
  const permissions = user?.role?.permissions ?? [];
  return permissions.some((p) => p.name === permissionName);
}

// Variante para chequear varios permisos a la vez (ej. mostrar un
// grupo del sidebar si el usuario tiene AL MENOS UNO de la lista).
export function useAnyPermission(permissionNames = []) {
  const { user } = useAuth();
  const permissions = user?.role?.permissions ?? [];
  const names = new Set(permissions.map((p) => p.name));
  return permissionNames.some((name) => names.has(name));
}