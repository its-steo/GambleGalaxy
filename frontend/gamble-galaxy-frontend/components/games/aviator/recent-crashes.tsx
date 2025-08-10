"use client"

import { History, Crown, TrendingUp } from "lucide-react"
import { cn } from "@/lib/utils"

interface RecentCrashesProps {
  pastCrashes: number[]
  premiumSureOdd: number | null
}

export function RecentCrashes({ pastCrashes, premiumSureOdd }: RecentCrashesProps) {
  // Responsive number of crashes to show
  const getMaxCrashes = () => {
    if (typeof window === "undefined") return 10
    if (window.innerWidth < 480) return 6
    if (window.innerWidth < 640) return 8
    if (window.innerWidth < 768) return 10
    return 12
  }

  return (
    <div className="overflow-x-auto pb-2">
      <div className="flex gap-2 min-w-max">
        <div className="flex items-center bg-gradient-to-r from-white/10 to-white/5 px-3 py-2 rounded-xl border border-white/20 text-xs font-medium backdrop-blur-xl shadow-lg flex-shrink-0">
          <History className="w-4 h-4 mr-2 text-white/70" />
          <span className="text-white/90 hidden xs:inline">Recent:</span>
          <span className="text-white/90 xs:hidden">Recent</span>
        </div>

        {premiumSureOdd && (
          <div className="flex lg:hidden items-center gap-2 bg-gradient-to-r from-green-500/20 to-emerald-500/20 text-green-400 px-3 py-2 rounded-xl border border-green-500/30 text-xs font-bold animate-pulse backdrop-blur-xl shadow-lg flex-shrink-0">
            <Crown className="w-4 h-4" />
            <span className="hidden xs:inline">Sure: {premiumSureOdd.toFixed(2)}x</span>
            <span className="xs:hidden">{premiumSureOdd.toFixed(2)}x</span>
            <TrendingUp className="w-3 h-3" />
          </div>
        )}

        {pastCrashes.slice(0, getMaxCrashes()).map((crash, index) => (
          <div
            key={index}
            className={cn(
              "px-2 sm:px-3 py-2 rounded-xl text-xs font-bold min-w-[45px] sm:min-w-[60px] text-center border backdrop-blur-xl shadow-lg transition-all duration-300 hover:scale-105 relative overflow-hidden group flex-shrink-0",
              crash < 2
                ? "bg-gradient-to-br from-red-500/20 to-pink-500/20 text-red-400 border-red-500/30"
                : crash < 5
                  ? "bg-gradient-to-br from-amber-500/20 to-orange-500/20 text-amber-400 border-amber-500/30"
                  : crash < 10
                    ? "bg-gradient-to-br from-green-500/20 to-emerald-500/20 text-green-400 border-green-500/30"
                    : "bg-gradient-to-br from-blue-500/20 to-purple-500/20 text-blue-400 border-blue-500/30",
            )}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="relative z-10">{crash.toFixed(2)}x</div>
          </div>
        ))}
      </div>
    </div>
  )
}
