"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect, useCallback } from "react"
import { api } from "@/lib/api"
import { useAuth } from "@/lib/auth"
import { toast } from "sonner"

interface WalletContextType {
  balance: number
  isLoading: boolean
  refreshBalance: () => Promise<void>
  updateBalance: (newBalance: number) => void
}

const WalletContext = createContext<WalletContextType | undefined>(undefined)

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const [balance, setBalance] = useState<number>(0)
  const [isLoading, setIsLoading] = useState(false)
  const { user, isAuthenticated } = useAuth()

  const refreshBalance = useCallback(async () => {
    if (!user || !isAuthenticated) {
      console.log("🚫 No user or not authenticated, setting balance to 0")
      setBalance(0)
      return
    }

    setIsLoading(true)
    try {
      console.log("💰 Fetching wallet balance for user:", user.id)

      // Use the same API call that your dashboard uses - getDashboardStats
      // This is what works correctly in your dashboard
      const response = await api.getDashboardStats()
      console.log("💰 Dashboard stats API response:", response)

      if (response.data && typeof response.data.totalBalance === "number") {
        const newBalance = response.data.totalBalance
        console.log("💰 Setting wallet balance from dashboard stats to:", newBalance)
        setBalance(newBalance)
      } else if (response.error) {
        console.error("❌ Dashboard stats API error:", response.error)

        // Fallback to direct wallet API if dashboard stats fails
        console.log("💰 Trying fallback wallet API...")
        const walletResponse = await api.getWallet()
        console.log("💰 Fallback wallet API response:", walletResponse)

        if (walletResponse.data && typeof walletResponse.data.balance === "number") {
          const fallbackBalance = walletResponse.data.balance
          console.log("💰 Setting wallet balance from fallback to:", fallbackBalance)
          setBalance(fallbackBalance)
        } else {
          console.warn("⚠️ Both dashboard stats and wallet API failed")
          toast.error("Failed to fetch wallet balance", {
            description: response.error,
          })
        }
      } else {
        console.warn("⚠️ Invalid dashboard stats response:", response)
        setBalance(0)
      }
    } catch (error) {
      console.error("❌ Error fetching wallet balance:", error)
      toast.error("Network error fetching wallet balance")
      // Don't reset balance on network errors
    } finally {
      setIsLoading(false)
    }
  }, [user, isAuthenticated])

  const updateBalance = useCallback((newBalance: number) => {
    console.log("💰 Updating wallet balance to:", newBalance)
    if (typeof newBalance === "number" && !isNaN(newBalance)) {
      setBalance(newBalance)
    } else {
      console.warn("⚠️ Invalid balance update:", newBalance)
    }
  }, [])

  // Fetch balance when user changes or component mounts
  useEffect(() => {
    if (isAuthenticated && user) {
      console.log("👤 User authenticated, fetching balance")
      refreshBalance()
    } else {
      console.log("👤 User not authenticated, clearing balance")
      setBalance(0)
    }
  }, [user, isAuthenticated, refreshBalance])

  // Listen for wallet balance updates from WebSocket or other sources
  useEffect(() => {
    const handleWalletUpdate = (event: CustomEvent) => {
      const { balance: newBalance } = event.detail
      console.log("📡 Received wallet balance update from WebSocket:", newBalance)
      if (typeof newBalance === "number" && !isNaN(newBalance)) {
        updateBalance(newBalance)
      }
    }

    window.addEventListener("walletBalanceUpdate", handleWalletUpdate as EventListener)
    return () => {
      window.removeEventListener("walletBalanceUpdate", handleWalletUpdate as EventListener)
    }
  }, [updateBalance])

  const value: WalletContextType = {
    balance,
    isLoading,
    refreshBalance,
    updateBalance,
  }

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>
}

export function useWallet() {
  const context = useContext(WalletContext)
  if (context === undefined) {
    throw new Error("useWallet must be used within a WalletProvider")
  }
  return context
}
