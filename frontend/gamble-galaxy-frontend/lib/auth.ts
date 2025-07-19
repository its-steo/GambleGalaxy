"use client"

import { create } from "zustand"
import { persist } from "zustand/middleware"
import { api } from "./api"
import type { User, RegisterData } from "./types"

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

export const useAuth = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,

      login: async (username: string, password: string) => {
        set({ isLoading: true })
        const response = await api.login(username, password)

        if (response.data) {
          localStorage.setItem("access_token", response.data.access)
          localStorage.setItem("refresh_token", response.data.refresh)
          await get().loadUser()
          set({ isLoading: false })
          return true
        }

        set({ isLoading: false })
        return false
      },

      register: async (userData: RegisterData) => {
        set({ isLoading: true })
        const response = await api.register(userData)
        set({ isLoading: false })
        return !!response.data
      },

      logout: () => {
        localStorage.removeItem("access_token")
        localStorage.removeItem("refresh_token")
        set({ user: null, isAuthenticated: false })
      },

      loadUser: async () => {
        const token = localStorage.getItem("access_token")
        if (!token) return

        const response = await api.getProfile()
        if (response.data) {
          set({ user: response.data, isAuthenticated: true })
        } else {
          get().logout()
        }
      },

      checkUsername: async (username: string) => {
        const response = await api.checkUsername(username)
        return response.data?.exists || false
      },
    }),
    {
      name: "auth-storage",
      partialize: (state) => ({ user: state.user, isAuthenticated: state.isAuthenticated }),
    },
  ),
)
// lib/auth.ts

export function getAuthHeader(): Record<string, string> {
  const token = localStorage.getItem("access_token")
  return token ? { Authorization: `Bearer ${token}` } : {}
}

