// components/providers/auth-provider.tsx
"use client"

import React, { ReactNode, useEffect, useState } from "react"

interface AuthContextType {
  user: any
  loading: boolean
}

export const AuthContext = React.createContext<AuthContextType>({
  user: null,
  loading: true,
})

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Simulate loading user (replace with real auth logic)
    const fakeUser = localStorage.getItem("user")
    if (fakeUser) {
      setUser(JSON.parse(fakeUser))
    }
    setLoading(false)
  }, [])

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  )
}
