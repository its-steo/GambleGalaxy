"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Plane, X, Crown, Sparkles } from "lucide-react"
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
    <div className="sticky top-0 z-50 bg-black/95 backdrop-blur-sm border-b border-white/10 shadow-2xl">
      <div className="absolute inset-0 bg-gradient-to-r from-purple-900/20 via-pink-900/20 to-blue-900/20"></div>
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>

      <div className="px-2 sm:px-4 lg:px-6 py-3 sm:py-4 relative z-10">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3 sm:gap-4">
            <Button
              variant="outline"
              onClick={() => setShowSidebar(!showSidebar)}
              className="md:hidden bg-white/10 border-white/20 hover:bg-purple-500/20 hover:border-purple-500/30 h-10 w-10 sm:h-12 sm:w-12 p-0 backdrop-blur-xl rounded-xl sm:rounded-2xl transition-all duration-300 hover:scale-105 text-white flex flex-col items-center justify-center gap-0.5 sm:gap-1"
            >
              {showSidebar ? (
                <X className="w-5 h-5 sm:w-6 sm:h-6" />
              ) : (
                <div className="flex flex-col items-center justify-center gap-0.5 sm:gap-1">
                  <div className="w-4 h-0.5 sm:w-5 sm:h-0.5 bg-white rounded-full transition-all duration-300"></div>
                  <div className="w-4 h-0.5 sm:w-5 sm:h-0.5 bg-white rounded-full transition-all duration-300"></div>
                  <div className="w-4 h-0.5 sm:w-5 sm:h-0.5 bg-white rounded-full transition-all duration-300"></div>
                </div>
              )}
            </Button>

            <div className="flex items-center gap-2 sm:gap-3">
              <div className="relative group">
                <div className="w-8 h-8 sm:w-12 sm:h-12 bg-gradient-to-br from-purple-500/30 to-pink-500/30 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg backdrop-blur-xl border border-purple-500/20 group-hover:scale-105 transition-transform duration-300">
                  <Plane className="w-4 h-4 sm:w-6 sm:h-6 text-purple-400" />
                </div>
                <div className="absolute -top-1 -right-1 w-2 h-2 sm:w-3 sm:h-3 bg-green-400 rounded-full animate-ping"></div>
                <div className="absolute -top-1 -right-1 w-2 h-2 sm:w-3 sm:h-3 bg-green-400 rounded-full"></div>
              </div>
              <div>
                <h1 className="text-lg sm:text-2xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent">
                  Aviator
                </h1>
                <p className="text-xs text-white/60 hidden sm:block">Crash Game</p>
              </div>
            </div>

            <Badge
              variant={isConnected ? "default" : "destructive"}
              className={cn(
                "border px-2 sm:px-4 py-1 sm:py-2 text-xs sm:text-sm font-bold backdrop-blur-xl rounded-lg sm:rounded-xl transition-all duration-300",
                isConnected
                  ? "bg-gradient-to-r from-green-500/20 to-emerald-500/20 text-green-400 border-green-500/40 shadow-lg shadow-green-500/20"
                  : "bg-gradient-to-r from-red-500/20 to-pink-500/20 text-red-400 border-red-500/40 shadow-lg shadow-red-500/20",
              )}
            >
              <div
                className={cn(
                  "w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full mr-1 sm:mr-2 animate-pulse",
                  isConnected ? "bg-green-400" : "bg-red-400",
                )}
              ></div>
              {isConnected ? "LIVE" : "OFFLINE"}
            </Badge>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            {premiumSureOdd && (
              <div className="hidden sm:flex items-center gap-2 sm:gap-3 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 text-yellow-400 px-3 sm:px-4 py-2 sm:py-3 rounded-xl sm:rounded-2xl border border-yellow-500/30 shadow-lg backdrop-blur-xl animate-pulse">
                <Crown className="w-4 h-4 sm:w-5 sm:h-5" />
                <div className="flex flex-col">
                  <span className="font-bold text-xs sm:text-sm">Premium: {premiumSureOdd.toFixed(2)}x</span>
                  <span className="text-xs text-yellow-300">Sure Odd</span>
                </div>
                <Sparkles className="w-3 h-3 sm:w-4 sm:h-4 animate-spin" />
              </div>
            )}

            {premiumSureOdd && (
              <div className="flex sm:hidden items-center gap-1 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 text-yellow-400 px-2 py-1 rounded-lg border border-yellow-500/30 shadow-lg backdrop-blur-xl">
                <Crown className="w-3 h-3" />
                <span className="font-bold text-xs">{premiumSureOdd.toFixed(2)}x</span>
              </div>
            )}

            <WalletBalance />
          </div>
        </div>
      </div>
    </div>
  )
}
