"use client"

import { Wallet } from "lucide-react"
import { useWallet } from "@/context/WalletContext" // <-- import context hook

export function WalletBalance() {
  const { balance } = useWallet()

  return (
    <div className="flex items-center space-x-2 bg-gray-800 px-3 py-1 rounded-lg">
      <Wallet className="w-4 h-4 text-green-400" />
      <span className="text-white font-medium">KES {parseFloat(balance.toString()).toFixed(2)}</span>
    </div>
  )
}
