import { create } from "zustand";
import { persist } from "zustand/middleware";

type AuthState = {
  isAuthenticated: boolean;
  user: { name: string; email: string } | null;
  login: (email: string) => void;
  logout: () => void;
};

export const useAuth = create<AuthState>()(
  persist(
    (set) => ({
      isAuthenticated: false,
      user: null,
      login: (email) => set({ isAuthenticated: true, user: { name: "Admin", email } }),
      logout: () => set({ isAuthenticated: false, user: null }),
    }),
    { name: "medifood-auth" },
  ),
);