"use client"

import { useEffect, useState } from "react"
import { Wallet } from "lucide-react"
import { api } from "@/lib/api"

export function WalletBalance() {
  const [balance, setBalance] = useState<string>("0.00")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchBalance = async () => {
      const response = await api.getWallet()
      if (response.data) {
        setBalance(response.data.balance)
      }
      setLoading(false)
    }

    fetchBalance()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center space-x-2 text-gray-400">
        <Wallet className="w-4 h-4" />
        <span>Loading...</span>
      </div>
    )
  }

  return (
    <div className="flex items-center space-x-2 bg-gray-800 px-3 py-1 rounded-lg">
      <Wallet className="w-4 h-4 text-green-400" />
      <span className="text-white font-medium">${balance}</span>
    </div>
  )
}
