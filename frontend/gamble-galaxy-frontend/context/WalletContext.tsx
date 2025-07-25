"use client"

import { createContext, useContext, useEffect, useState } from "react"
import { api } from "@/lib/api"
import { useAuth } from "@/lib/auth" // ✅ Import auth state

type WalletContextType = {
  balance: number
  refreshBalance: () => Promise<void>
}

const WalletContext = createContext<WalletContextType | undefined>(undefined)

export const WalletProvider = ({ children }: { children: React.ReactNode }) => {
  const [balance, setBalance] = useState(0)
  const { isAuthenticated } = useAuth() // ✅ Check if user is logged in

  const refreshBalance = async () => {
    if (!isAuthenticated) return
    const res = await api.getWallet()
    if (res.data) setBalance(Number(res.data.balance))
  }

  // ✅ Only refresh balance when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      refreshBalance()
    }
  }, [isAuthenticated])

  return (
    <WalletContext.Provider value={{ balance, refreshBalance }}>
      {children}
    </WalletContext.Provider>
  )
}

export function useWallet() {
  const ctx = useContext(WalletContext)
  if (!ctx) throw new Error("useWallet must be used within WalletProvider")
  return ctx
}