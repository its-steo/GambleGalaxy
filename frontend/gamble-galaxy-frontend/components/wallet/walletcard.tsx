"use client"

import React from "react"
import { WalletBalance } from "./wallet-balance"
import { Wallet } from "lucide-react"

export default function WalletCard() {
  return (
    <div className="backdrop-blur-sm bg-white/10 border border-white/20 rounded-2xl shadow-lg p-6 flex items-center justify-between">
      <div>
        <h2 className="text-lg font-semibold text-gray-100 mb-1">Wallet Balance</h2>
        <WalletBalance />
      </div>
      <Wallet className="w-8 h-8 text-green-400" />
    </div>
  )
}
