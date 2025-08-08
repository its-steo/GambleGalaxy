"use client"

import { History, Crown } from 'lucide-react'
import { cn } from "@/lib/utils"

interface RecentCrashesProps {
  pastCrashes: number[]
  premiumSureOdd: number | null
}

export function RecentCrashes({ pastCrashes, premiumSureOdd }: RecentCrashesProps) {
  return (
    <div className="mb-4 overflow-x-auto pb-2">
      <div className="flex gap-2 min-w-max">
        <div className="flex items-center bg-white/10 px-3 py-2 rounded-xl border border-white/20 text-sm backdrop-blur-xl">
          <History className="w-4 h-4 mr-2 text-white/70" />
          <span className="font-medium text-white/90">Recent:</span>
        </div>
        {premiumSureOdd && (
          <div className="flex md:hidden items-center gap-2 bg-gradient-to-r from-green-500/20 to-emerald-500/20 text-green-400 px-3 py-2 rounded-xl border border-green-500/30 text-sm font-bold animate-pulse backdrop-blur-xl">
            <Crown className="w-4 h-4" />
            <span>Sure: {premiumSureOdd.toFixed(2)}x</span>
          </div>
        )}
        {pastCrashes.slice(0, 10).map((crash, index) => (
          <div
            key={index}
            className={cn(
              "px-3 py-2 rounded-xl text-sm font-bold min-w-[60px] text-center border backdrop-blur-xl",
              crash < 2
                ? "bg-red-500/20 text-red-400 border-red-500/30"
                : crash < 5
                  ? "bg-amber-500/20 text-amber-400 border-amber-500/30"
                  : crash < 10
                    ? "bg-green-500/20 text-green-400 border-green-500/30"
                    : "bg-blue-500/20 text-blue-400 border-blue-500/30",
            )}
          >
            {crash.toFixed(2)}x
          </div>
        ))}
      </div>
    </div>
  )
}
