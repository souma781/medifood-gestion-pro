import type { Role } from "@/store/auth";

export const ROUTE_ACCESS: Record<string, Role[]> = {
  "/dashboard": ["Admin", "Responsable Commercial", "Responsable Production"],
  "/production": ["Admin", "Responsable Production"],
  "/inventaire": ["Admin"],
  "/commandes": ["Admin", "Responsable Commercial"],
  "/bons-de-livraison": ["Admin", "Responsable Commercial"],
  "/clients": ["Admin", "Responsable Commercial"],
  "/parametres": ["Admin", "Responsable Commercial", "Responsable Production"],
};

export function canAccess(role: Role | undefined, path: string): boolean {
  if (!role) return false;
  const match = Object.keys(ROUTE_ACCESS).find((k) => path.startsWith(k));
  if (!match) return true;
  return ROUTE_ACCESS[match].includes(role);
}

export const ROLE_BADGE: Record<Role, string> = {
  Admin: "bg-purple-500/15 text-purple-700 border-purple-500/30",
  "Responsable Commercial": "bg-info/15 text-info border-info/30",
  "Responsable Production": "bg-success/15 text-success border-success/30",
};

export const ROLE_SHORT: Record<Role, string> = {
  Admin: "Admin",
  "Responsable Commercial": "Commercial",
  "Responsable Production": "Production",
};
