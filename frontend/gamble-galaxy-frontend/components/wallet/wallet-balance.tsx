"use client"

import { Wallet } from "lucide-react"
import { useWallet } from "@/context/WalletContext"
import { formatCurrency } from "@/lib/currency"

export function WalletBalance() {
  const { balance, isLoading } = useWallet()

  return (
    <div className="flex items-center space-x-1 xs:space-x-2 sm:space-x-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg xs:rounded-xl px-1.5 xs:px-2 sm:px-3 py-1 xs:py-1.5 sm:py-2 w-full sm:w-auto min-w-0">
      <div className="flex-shrink-0 p-1 xs:p-1.5 sm:p-2 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-md xs:rounded-lg sm:rounded-xl">
        <Wallet className="w-3 h-3 xs:w-4 xs:h-4 sm:w-5 sm:h-5 text-purple-400" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-white/70 text-[10px] xs:text-xs sm:text-sm font-medium truncate">Balance</p>
        <p className="text-white font-bold text-sm xs:text-base sm:text-lg truncate">
          {isLoading ? "Loading..." : formatCurrency(balance)}
        </p>
      </div>
    </div>
  )
}