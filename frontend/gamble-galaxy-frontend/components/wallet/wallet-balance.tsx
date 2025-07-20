"use client"

import type React from "react"
import { Wallet } from "lucide-react"
import { useWallet } from "@/context/WalletContext"
import { cn } from "@/lib/utils"

interface WalletBalanceProps extends React.HTMLAttributes<HTMLDivElement> {}

export function WalletBalance({ className, ...props }: WalletBalanceProps) {
  const { balance } = useWallet()

  return (
    <div
      className={cn(
        "flex items-center space-x-1.5 xs:space-x-2 sm:space-x-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-md xs:rounded-lg sm:rounded-xl px-2 xs:px-3 sm:px-4 py-1.5 xs:py-2 sm:py-2.5 text-white transition-all duration-300 hover:bg-white/20 hover:border-white/30 group",
        className,
      )}
      {...props}
    >
      <div className="w-5 h-5 xs:w-6 xs:h-6 sm:w-7 sm:h-7 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center shadow-md group-hover:scale-110 transition-transform duration-300">
        <Wallet className="w-3 h-3 xs:w-3.5 xs:h-3.5 sm:w-4 sm:h-4 text-white" />
      </div>
      <span className="text-sm xs:text-base sm:text-lg font-bold text-white">
        KES {Number.parseFloat(balance.toString()).toFixed(2)}
      </span>
    </div>
  )
}
