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

  return (
    <div className="space-y-3 sm:space-y-4 w-full">
      <Card className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-white/20 backdrop-blur-sm rounded-lg sm:rounded-xl">
        <CardContent className="p-4 xs:p-5 sm:p-6">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <h3 className="text-white/70 text-xs xs:text-sm sm:text-base font-medium">Available Balance</h3>
            <Button
              variant="ghost"
              onClick={() => setIsBalanceVisible(!isBalanceVisible)}
              className="h-7 w-7 xs:h-8 xs:w-8 sm:h-9 sm:w-9 p-0 hover:bg-white/20"
            >
              {isBalanceVisible ? (
                <EyeOff className="w-3 h-3 xs:w-4 xs:h-4 sm:w-5 sm:h-5 text-white/70" />
              ) : (
                <Eye className="w-3 h-3 xs:w-4 xs:h-4 sm:w-5 sm:h-5 text-white/70" />
              )}
            </Button>
          </div>
          <div className="space-y-2">
            <p className="text-2xl xs:text-3xl sm:text-4xl font-bold text-white break-words">
              {isBalanceVisible ? formatCurrency(balance) : "KES ••••••"}
            </p>
            <div className="flex items-center space-x-1 sm:space-x-2">
              {todayChange >= 0 ? (
                <TrendingUp className="w-3 h-3 xs:w-4 xs:h-4 sm:w-5 sm:h-5 text-green-400" />
              ) : (
                <TrendingDown className="w-3 h-3 xs:w-4 xs:h-4 sm:w-5 sm:h-5 text-red-400" />
              )}
              <span className={`text-xs xs:text-sm sm:text-base font-medium ${todayChange >= 0 ? "text-green-400" : "text-red-400"}`}>
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