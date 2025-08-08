"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Plane, ChevronUp, ChevronDown, Crown } from 'lucide-react'
import { cn } from "@/lib/utils"
import { WalletBalance } from "@/components/wallet/wallet-balance"

interface GameHeaderProps {
  isConnected: boolean
  showSidebar: boolean
  setShowSidebar: (show: boolean) => void
  premiumSureOdd: number | null
}

export function GameHeader({ isConnected, showSidebar, setShowSidebar, premiumSureOdd }: GameHeaderProps) {
  return (
    <div className="sticky top-0 z-50 bg-white/5 backdrop-blur-2xl border-b border-white/10 shadow-2xl">
      <div className="absolute inset-0 bg-gradient-to-r from-white/5 via-white/10 to-white/5"></div>
      <div className="max-w-7xl mx-auto px-3 py-3 relative z-10">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="relative">
                <div className="w-10 h-10 bg-gradient-to-br from-red-500/80 to-orange-500/80 rounded-xl flex items-center justify-center shadow-lg backdrop-blur-xl border border-white/20">
                  <Plane className="w-5 h-5 text-white" />
                </div>
                <div className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-green-400 rounded-full animate-ping"></div>
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-red-400 to-orange-400 bg-clip-text text-transparent">
                  Aviator
                </h1>
              </div>
            </div>
            <Badge
              variant={isConnected ? "success" : "danger"}
              className={cn(
                "border px-3 py-1 text-xs font-bold backdrop-blur-xl",
                isConnected
                  ? "bg-green-500/20 text-green-400 border-green-500/40"
                  : "bg-red-500/20 text-red-400 border-red-500/40",
              )}
            >
              <div className={cn("w-1.5 h-1.5 rounded-full mr-1", isConnected ? "bg-green-400" : "bg-red-400")}></div>
              {isConnected ? "LIVE" : "OFF"}
            </Badge>
          </div>

          <div className="flex items-center gap-3">
            {premiumSureOdd && (
              <div className="flex items-center gap-2 bg-gradient-to-r from-green-500/20 to-emerald-500/20 text-green-400 px-3 py-2 rounded-xl border border-green-500/30 shadow-lg backdrop-blur-xl">
                <Crown className="w-4 h-4" />
                <span className="font-bold text-sm">
                  <span className="hidden sm:inline">Premium: </span>
                  {premiumSureOdd.toFixed(2)}x
                </span>
              </div>
            )}
            <WalletBalance />
            <Button
              variant="outline"
              onClick={() => setShowSidebar(!showSidebar)}
              className="lg:hidden bg-white/10 border-white/20 hover:bg-white/20 h-10 w-10 p-0 backdrop-blur-xl"
            >
              {showSidebar ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
