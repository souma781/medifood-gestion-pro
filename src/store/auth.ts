import { create } from "zustand";
import { persist } from "zustand/middleware";

export type Role = "Admin" | "Responsable Commercial" | "Responsable Production";

export type AuthUser = {
  email: string;
  name: string;
  role: Role;
  assignedProduct?: string;
};

type Cred = AuthUser & { password: string };

export const MOCK_USERS: Cred[] = [
  { email: "admin@medifood.tn", password: "admin123", role: "Admin", name: "Admin MEDIFOOD" },
  { email: "commercial@medifood.tn", password: "comm123", role: "Responsable Commercial", name: "Sarra Ben Ali" },
  { email: "prod.amandes@medifood.tn", password: "prod123", role: "Responsable Production", name: "Khalil Trabelsi", assignedProduct: "Amandes" },
  { email: "prod.pistaches@medifood.tn", password: "prod123", role: "Responsable Production", name: "Youssef Ghribi", assignedProduct: "Pistaches" },
];

type AuthState = {
  isAuthenticated: boolean;
  user: AuthUser | null;
  login: (email: string, password: string) => { ok: true } | { ok: false; error: string };
  logout: () => void;
};

export const useAuth = create<AuthState>()(
  persist(
    (set) => ({
      isAuthenticated: false,
      user: null,
      login: (email, password) => {
        const u = MOCK_USERS.find((x) => x.email.toLowerCase() === email.toLowerCase() && x.password === password);
        if (!u) return { ok: false, error: "Identifiants invalides" };
        const { password: _p, ...user } = u;
        set({ isAuthenticated: true, user });
        return { ok: true };
      },
      logout: () => set({ isAuthenticated: false, user: null }),
    }),
    { name: "medifood-auth" },
  ),
);
