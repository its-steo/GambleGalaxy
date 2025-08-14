"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Eye, EyeOff, TrendingUp, TrendingDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useWallet } from "@/context/WalletContext"
import { formatCurrency } from "@/lib/currency"

export default function WalletCard() {
  const { balance } = useWallet()
  const [isBalanceVisible, setIsBalanceVisible] = useState(true)
  const [todayChange] = useState(+234.5) // Keep this as mock data for now

  // Remove loading state handling since 'loading' does not exist in WalletContextType

  // Remove error handling since 'error' does not exist in WalletContextType

  return (
    <div className="space-y-4">
      <Card className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-white/20 backdrop-blur-sm">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-white/70 text-sm font-medium">Available Balance</h3>
            <Button
              variant="ghost"
              onClick={() => setIsBalanceVisible(!isBalanceVisible)}
              className="h-8 w-8 p-0 hover:bg-white/20"
            >
              {isBalanceVisible ? (
                <EyeOff className="w-4 h-4 text-white/70" />
              ) : (
                <Eye className="w-4 h-4 text-white/70" />
              )}
            </Button>
          </div>
          <div className="space-y-2">
            <p className="text-3xl font-bold text-white">{isBalanceVisible ? formatCurrency(balance) : "KES ••••••"}</p>
            <div className="flex items-center space-x-2">
              {todayChange >= 0 ? (
                <TrendingUp className="w-4 h-4 text-green-400" />
              ) : (
                <TrendingDown className="w-4 h-4 text-red-400" />
              )}
              <span className={`text-sm font-medium ${todayChange >= 0 ? "text-green-400" : "text-red-400"}`}>
                {todayChange >= 0 ? "+" : ""}
                {formatCurrency(Math.abs(todayChange))} today
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
