"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { api } from "./api";
import type { User, RegisterData } from "./types";

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  register: (userData: RegisterData) => Promise<boolean>;
  logout: () => void;
  loadUser: () => Promise<void>;
  checkUsername: (username: string) => Promise<boolean>;
}

export const useAuth = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,

      login: async (username: string, password: string) => {
        set({ isLoading: true });
        try {
          const response = await api.login(username, password);
          if (response.data) {
            localStorage.setItem("access_token", response.data.access);
            localStorage.setItem("refresh_token", response.data.refresh);
            await get().loadUser();
            return true;
          }
          set({ isLoading: false });
          return false;
        } catch (error) {
          set({ isLoading: false });
          return false;
        }
      },

      register: async (userData: RegisterData) => {
        set({ isLoading: true });
        try {
          const response = await api.register(userData);
          set({ isLoading: false });
          return !!response.data;
        } catch (error) {
          set({ isLoading: false });
          return false;
        }
      },

      logout: () => {
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        set({ user: null, isAuthenticated: false, isLoading: false });
      },

      loadUser: async () => {
        set({ isLoading: true });
        const token = localStorage.getItem("access_token");
        if (!token) {
          set({ user: null, isAuthenticated: false, isLoading: false });
          return;
        }

        try {
          const response = await api.getProfile();
          if (response.data) {
            set({ user: response.data, isAuthenticated: true, isLoading: false });
          } else {
            // Token might be invalid or expired, try to refresh
            const newToken = getRefreshedAccessToken();
            if (newToken) {
              const retryResponse = await api.getProfile();
              if (retryResponse.data) {
                set({ user: retryResponse.data, isAuthenticated: true, isLoading: false });
              } else {
                get().logout();
              }
            } else {
              get().logout();
            }
          }
        } catch (error) {
          console.error("Error loading user:", error);
          get().logout();
        }
      },

      checkUsername: async (username: string) => {
        try {
          const response = await api.checkUsername(username);
          return response.data?.exists || false;
        } catch (error) {
          return false;
        }
      },
    }),
    {
      name: "auth-storage",
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
      onRehydrateStorage: () => async (state) => {
        if (state) {
          await state.loadUser();
        }
      },
    }
  )
);

export function getAuthHeader(): Record<string, string> {
  const token = localStorage.getItem("access_token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function getRefreshedAccessToken(): string | null {
  // TODO: Implement token refresh logic and return the new access token or null if failed.
  return null;
}
