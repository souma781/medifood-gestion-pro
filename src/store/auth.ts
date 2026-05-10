import { create } from "zustand";
import { persist } from "zustand/middleware";
import { api } from "@/lib/api";

export type Role = "Admin" | "Responsable Commercial" | "Responsable Production";
export type ProductionRole = "cuisson" | "emballage" | "mixte";

export type AuthUser = {
  id: string;
  email: string;
  name: string;
  role: Role;
  assignedProducts?: string[];
  productionRole?: ProductionRole;
  active?: boolean;
};

export type ManagedUser = AuthUser & { id: string; password: string };

type AuthState = {
  isAuthenticated: boolean;
  user: AuthUser | null;
  token: string | null;
  users: ManagedUser[];
  login: (email: string, password: string) => Promise<{ ok: true } | { ok: false; error: string }>;
  logout: () => void;
  updateProfile: (fields: Partial<Pick<AuthUser, "name" | "email">>) => void;
  addUser: (u: Omit<ManagedUser, "id">) => void;
  updateUser: (u: ManagedUser) => void;
  deleteUser: (id: string) => void;
};

export const useAuth = create<AuthState>()(
  persist(
    (set) => ({
      isAuthenticated: false,
      user: null,
      token: null,                          // ✅ ajouter cette ligne
      users: [],                            // ✅ vide — les users viennent du backend
      login: async (email, password) => {
        try {
          const { token, user } = await api.auth.login(email, password);
          set({ isAuthenticated: true, user: user as AuthUser, token });
          return { ok: true };
        } catch (err: any) {
          return { ok: false, error: err.message || "Identifiants invalides" };
        }
      },
      logout: () => set({ isAuthenticated: false, user: null, token: null }),
      updateProfile: (fields) =>
        set((s) => ({ user: s.user ? { ...s.user, ...fields } : null })),
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