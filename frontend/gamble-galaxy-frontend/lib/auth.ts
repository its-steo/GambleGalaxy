"use client"

import { create } from "zustand"
import { persist } from "zustand/middleware"
import { api } from "./api"
import type { User, RegisterData } from "./types"
import axios, { type AxiosError } from "axios"

interface AuthState {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (username: string, password: string) => Promise<boolean>
  register: (userData: RegisterData) => Promise<boolean>
  logout: () => void
  loadUser: () => Promise<void>
  checkUsername: (username: string) => Promise<boolean>
}

interface AuthApiResponse {
  detail?: string
}

export const useAuth = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,

      login: async (username: string, password: string) => {
        set({ isLoading: true })
        try {
          const response = await api.login(username, password)
          if (response.data) {
            localStorage.setItem("access_token", response.data.access)
            localStorage.setItem("refresh_token", response.data.refresh)
            await get().loadUser()
            return true
          }
          set({ isLoading: false })
          return false
        } catch {
          set({ isLoading: false })
          return false
        }
      },

      register: async (userData: RegisterData) => {
        set({ isLoading: true })
        try {
          const response = await api.register(userData)
          set({ isLoading: false })
          return !!response.data
        } catch {
          set({ isLoading: false })
          return false
        }
      },

      logout: () => {
        localStorage.removeItem("access_token")
        localStorage.removeItem("refresh_token")
        set({ user: null, isAuthenticated: false, isLoading: false })
      },

      loadUser: async () => {
        set({ isLoading: true })
        const token = localStorage.getItem("access_token")
        if (!token) {
          set({ user: null, isAuthenticated: false, isLoading: false })
          return
        }

        try {
          const response = await api.getProfile()
          if (response.data) {
            set({ user: response.data, isAuthenticated: true, isLoading: false })
          } else {
            // Token might be invalid or expired, try to refresh
            const newToken = await getRefreshedAccessToken()
            if (newToken) {
              localStorage.setItem("access_token", newToken)
              const retryResponse = await api.getProfile()
              if (retryResponse.data) {
                set({ user: retryResponse.data, isAuthenticated: true, isLoading: false })
              } else {
                get().logout()
              }
            } else {
              get().logout()
            }
          }
        } catch (error: unknown) {
          const axiosError = error as AxiosError<AuthApiResponse>
          console.error("Error loading user:", axiosError.response?.data?.detail || axiosError.message)
          get().logout()
        }
      },

      checkUsername: async (username: string) => {
        try {
          const response = await api.checkUsername(username)
          return response.data?.exists || false
        } catch {
          return false
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
          await state.loadUser()
        }
      },
    },
  ),
)

export function getAuthHeader(): Record<string, string> {
  const token = localStorage.getItem("access_token")
  return token ? { Authorization: `Bearer ${token}` } : {}
}

async function getRefreshedAccessToken(): Promise<string | null> {
  const refreshToken = localStorage.getItem("refresh_token")
  if (!refreshToken) {
    return null
  }

  try {
    //const response = await axios.post<{ access: string }>(
    //  `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/token/refresh/`,
    //  { refresh: refreshToken },
    //)
    const response = await axios.post<{ access: string }>(
      `${process.env.NEXT_PUBLIC_API_URL || "https://gamblegalaxy.onrender.com"}/api/token/refresh/`,
      { refresh: refreshToken }
    );
    return response.data.access
  } catch (error: unknown) {
    const axiosError = error as AxiosError<AuthApiResponse>
    console.error("Token refresh failed:", axiosError.response?.data?.detail || axiosError.message)
    return null
  }
}
//"use client";
//
//import { create } from "zustand";
//import { persist } from "zustand/middleware";
//import { api } from "./api";
//import type { User, RegisterData } from "./types";
//
//interface AuthState {
//  user: User | null;
//  isAuthenticated: boolean;
//  isLoading: boolean;
//  login: (username: string, password: string) => Promise<boolean>;
//  register: (userData: RegisterData) => Promise<boolean>;
//  logout: () => void;
//  loadUser: () => Promise<void>;
//  checkUsername: (username: string) => Promise<boolean>;
//}
//
////interface AuthApiResponse {
////  detail?: string;
////}
//
//export const useAuth = create<AuthState>()(
//  persist(
//    (set, get) => ({
//      user: null,
//      isAuthenticated: false,
//      isLoading: false,
//
//      login: async (username: string, password: string) => {
//        set({ isLoading: true });
//        try {
//          const response = await api.login(username, password);
//          if (response.data) {
//            localStorage.setItem("access_token", response.data.access);
//            localStorage.setItem("refresh_token", response.data.refresh);
//            await get().loadUser();
//            return true;
//          }
//          set({ isLoading: false });
//          return false;
//        } catch (error) {
//          console.error("Login error:", error);  // Add logging
//          set({ isLoading: false });
//          return false;
//        }
//      },
//
//      register: async (userData: RegisterData) => {
//        set({ isLoading: true });
//        try {
//          const response = await api.register(userData);
//          set({ isLoading: false });
//          return !!response.data;
//        } catch (error) {
//          console.error("Register error:", error);  // Add logging
//          set({ isLoading: false });
//          return false;
//        }
//      },
//
//      logout: () => {
//        localStorage.removeItem("access_token");
//        localStorage.removeItem("refresh_token");
//        set({ user: null, isAuthenticated: false, isLoading: false });
//      },
//
//      loadUser: async () => {
//        set({ isLoading: true });
//        const token = localStorage.getItem("access_token");
//        if (!token) {
//          set({ user: null, isAuthenticated: false, isLoading: false });
//          return;
//        }
//
//        try {
//          const response = await api.getProfile();
//          if (response.data) {
//            set({ user: response.data, isAuthenticated: true, isLoading: false });
//          } else {
//            // Token might be invalid or expired, try to refresh
//            const newToken = await getRefreshedAccessToken();
//            if (newToken) {
//              localStorage.setItem("access_token", newToken);
//              const retryResponse = await api.getProfile();
//              if (retryResponse.data) {
//                set({ user: retryResponse.data, isAuthenticated: true, isLoading: false });
//              } else {
//                get().logout();
//              }
//            } else {
//              get().logout();
//            }
//          }
//        } catch (error) {
//          console.error("Error loading user:", error);
//          get().logout();
//        }
//      },
//
//      checkUsername: async (username: string) => {
//        try {
//          const response = await api.checkUsername(username);
//          return response.data?.exists || false;
//        } catch (error) {
//          console.error("Check username error:", error);
//          return false;
//        }
//      },
//    }),
//    {
//      name: "auth-storage",
//      partialize: (state) => ({
//        user: state.user,
//        isAuthenticated: state.isAuthenticated,
//      }),
//      onRehydrateStorage: () => async (state) => {
//        if (state) {
//          await state.loadUser();
//        }
//      },
//    }
//  )
//);
//
//export function getAuthHeader(): Record<string, string> {
//  const token = localStorage.getItem("access_token");
//  return token ? { Authorization: `Bearer ${token}` } : {};
//}
//
//async function getRefreshedAccessToken(): Promise<string | null> {
//  const refreshToken = localStorage.getItem("refresh_token");
//  if (!refreshToken) {
//    return null;
//  }
//
//  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "https://gamblegalaxy.onrender.com/api";  // Use consistent env var with HTTPS
//
//  try {
//    console.log("🔄 Attempting to refresh access token...");
//    const response = await fetch(`${API_BASE_URL}/accounts/token/refresh/`, {  // Fix endpoint
//      method: 'POST',
//      headers: { 'Content-Type': 'application/json' },
//      body: JSON.stringify({ refresh: refreshToken }),
//    });
//
//    const data = await response.json();
//    console.log("🔄 Refresh response:", { status: response.status, data });
//
//    if (response.ok && data.access) {
//      return data.access;
//    } else {
//      console.error("Token refresh failed:", data.detail || data.message);
//      localStorage.clear();
//      return null;
//    }
//  } catch (error) {
//    console.error("💥 Token refresh error:", error);
//    return null;
//  }
//}
