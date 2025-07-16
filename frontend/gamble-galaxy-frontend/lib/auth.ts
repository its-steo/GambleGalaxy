"use client"

import { useEffect, useState } from "react"

interface AuthState {
  accessToken: string | null
  refreshToken: string | null
}

export default function useAuth() {
  const [auth, setAuth] = useState<AuthState>({
    accessToken: null,
    refreshToken: null,
  })

  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const access = localStorage.getItem("access_token")
    const refresh = localStorage.getItem("refresh_token")

    setAuth({ accessToken: access, refreshToken: refresh })
    setIsLoading(false)
  }, [])

  const login = async (username: string, password: string) => {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/accounts/login/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    })

    const data = await res.json()

    if (res.ok) {
      localStorage.setItem("access_token", data.access)
      localStorage.setItem("refresh_token", data.refresh)
      setAuth({ accessToken: data.access, refreshToken: data.refresh })
      return { success: true }
    } else {
      return { success: false, message: data?.detail || "Login failed" }
    }
  }

  // ✅ Updated to accept `phone` in registration
  const register = async (
    username: string,
    email: string,
    password: string,
    phone?: string // optional phone number
  ) => {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/accounts/register/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, email, password, phone }), // ✅ include phone
    })

    const data = await res.json()

    if (res.ok) {
      return { success: true }
    } else {
      return { success: false, message: data?.detail || "Registration failed" }
    }
  }

  const logout = () => {
    localStorage.removeItem("access_token")
    localStorage.removeItem("refresh_token")
    setAuth({ accessToken: null, refreshToken: null })
  }

  return {
    ...auth,
    isAuthenticated: !!auth.accessToken,
    isLoading,
    login,
    register,
    logout,
  }
}
