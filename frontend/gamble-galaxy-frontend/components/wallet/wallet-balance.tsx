"use client"

import { Wallet } from "lucide-react"
import { useWallet } from "@/context/WalletContext"
import { formatCurrency } from "@/lib/currency"

export function WalletBalance() {
  const { balance, isLoading } = useWallet()

  return (
    <div className="flex items-center space-x-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl px-4 py-3">
      <div className="p-2 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-xl">
        <Wallet className="w-5 h-5 text-purple-400" />
      </div>
      <div>
        <p className="text-white/70 text-xs font-medium">Balance</p>
        <p className="text-white font-bold text-lg">
          {isLoading ? "Loading..." : formatCurrency(balance)}
        </p>
      </div>
    </div>
  )
}
