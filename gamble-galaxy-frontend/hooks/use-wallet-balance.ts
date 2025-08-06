"use client"

import { useEffect, useState } from "react"
import { apiClient, API_ENDPOINTS } from "@/lib/api-client"
import type { WalletBalance } from "@/lib/types"

export function useWalletBalance() {
  const [balance, setBalance] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchBalance = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await apiClient.get<WalletBalance>(API_ENDPOINTS.WALLET_BALANCE)

      if (response.success && response.data) {
        setBalance(response.data.balance)
      } else {
        setError(response.error || "Failed to fetch balance")
        setBalance(null)
      }
    } catch (error) {
      console.error("Failed to fetch wallet balance:", error)
      setError("Network error")
      setBalance(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchBalance()
  }, [])

  const refreshBalance = () => {
    fetchBalance()
  }

  return {
    balance,
    loading,
    error,
    refreshBalance,
  }
}
