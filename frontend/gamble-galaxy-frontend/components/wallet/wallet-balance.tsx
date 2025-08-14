"use client"

import { Wallet } from "lucide-react"
import { useWallet } from "@/context/WalletContext"
import { formatCurrency } from "@/lib/currency"

export function WalletBalance() {
  const { balance, isLoading } = useWallet()

  return (
    <div className="flex items-center space-x-2 sm:space-x-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl sm:rounded-2xl px-2 sm:px-3 py-1 sm:py-2 min-w-0">
      <div className="flex-shrink-0 p-1.5 sm:p-2 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-lg sm:rounded-xl">
        <Wallet className="w-4 h-4 sm:w-5 sm:h-5 text-purple-400" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-white/70 text-xs font-medium truncate">Balance</p>
        <p className="text-white font-bold text-base sm:text-lg truncate">
          {isLoading ? "Loading..." : formatCurrency(balance)}
        </p>
      </div>
    </div>
  )
}
