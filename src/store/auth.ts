import { create } from "zustand";
import { persist } from "zustand/middleware";

export type Role = "Admin" | "Responsable Commercial" | "Responsable Production";
export type ProductionRole = "cuisson" | "emballage" | "mixte";

export type AuthUser = {
  email: string;
  name: string;
  role: Role;
  assignedProducts?: string[];
  productionRole?: ProductionRole;
  active?: boolean;
};

export type ManagedUser = AuthUser & { id: string; password: string };

const INITIAL_USERS: ManagedUser[] = [
  { id: "u1", email: "admin@medifood.tn", password: "admin123", role: "Admin", name: "Admin MEDIFOOD", active: true },
  { id: "u2", email: "commercial@medifood.tn", password: "comm123", role: "Responsable Commercial", name: "Sarra Ben Ali", active: true },
  { id: "u3", email: "prod.amandes@medifood.tn", password: "prod123", role: "Responsable Production", name: "Khalil Trabelsi", assignedProducts: ["Amandes"], productionRole: "mixte", active: true },
  { id: "u4", email: "prod.pistaches@medifood.tn", password: "prod123", role: "Responsable Production", name: "Youssef Ghribi", assignedProducts: ["Pistaches"], productionRole: "mixte", active: true },
  { id: "u5", email: "cuisson.amandes@medifood.tn", password: "prod123", role: "Responsable Production", name: "Ali Chaouachi", assignedProducts: ["Amandes"], productionRole: "cuisson", active: true },
  { id: "u6", email: "emballage.amandes@medifood.tn", password: "prod123", role: "Responsable Production", name: "Rim Belhaj", assignedProducts: ["Amandes"], productionRole: "emballage", active: true },
];

type AuthState = {
  isAuthenticated: boolean;
  user: AuthUser | null;
  users: ManagedUser[];
  login: (email: string, password: string) => { ok: true } | { ok: false; error: string };
  logout: () => void;
  addUser: (u: Omit<ManagedUser, "id">) => void;
  updateUser: (u: ManagedUser) => void;
  deleteUser: (id: string) => void;
};

export const useAuth = create<AuthState>()(
  persist(
    (set, get) => ({
      isAuthenticated: false,
      user: null,
      users: INITIAL_USERS,
      login: (email, password) => {
        const u = get().users.find(
          (x) => x.email.toLowerCase() === email.toLowerCase() && x.password === password && x.active !== false,
        );
        if (!u) return { ok: false, error: "Identifiants invalides" };
        const { password: _p, id: _id, ...user } = u;
        set({ isAuthenticated: true, user });
        return { ok: true };
      },
      logout: () => set({ isAuthenticated: false, user: null }),
      addUser: (u) =>
        set((s) => ({ users: [...s.users, { ...u, id: `u-${Date.now()}` }] })),
      updateUser: (u) =>
        set((s) => ({ users: s.users.map((x) => (x.id === u.id ? u : x)) })),
      deleteUser: (id) =>
        set((s) => ({ users: s.users.filter((x) => x.id !== id) })),
    }),
    { name: "medifood-auth" },
  ),
);
