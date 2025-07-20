"use client"

import type React from "react"
import { WalletBalance } from "./wallet-balance"
import { Wallet, Sparkles } from "lucide-react" // Added Sparkles for visual flair
import { cn } from "@/lib/utils" // Import cn for conditional class names

interface WalletCardProps extends React.HTMLAttributes<HTMLDivElement> {}

export default function WalletCard({ className, ...props }: WalletCardProps) {
  return (
    <div
      className={cn(
        "relative overflow-hidden backdrop-blur-sm bg-white/5 border border-white/10 rounded-2xl sm:rounded-3xl shadow-lg p-4 xs:p-5 sm:p-6 md:p-8 flex flex-col sm:flex-row items-center justify-between gap-4 sm:gap-6 transition-all duration-300 hover:scale-[1.01] group",
        className,
      )}
      {...props}
    >
      {/* Animated Background Elements */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-1/4 -left-1/4 w-1/2 h-1/2 bg-purple-500/10 rounded-full blur-3xl animate-pulse-slow" />
        <div className="absolute -bottom-1/4 -right-1/4 w-1/2 h-1/2 bg-pink-500/10 rounded-full blur-3xl animate-pulse-slow delay-1000" />
      </div>

      <div className="relative z-10 flex flex-col items-center sm:items-start text-center sm:text-left">
        <h2 className="text-lg xs:text-xl sm:text-2xl md:text-3xl font-black mb-2 sm:mb-3 leading-tight">
          <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent">
            Your Wallet Balance
          </span>
        </h2>
        <p className="text-gray-300 text-xs xs:text-sm sm:text-base mb-3 sm:mb-4">Current available funds</p>
        <WalletBalance className="shadow-xl" /> {/* Reusing the enhanced WalletBalance component */}
      </div>

      <div className="relative z-10 flex-shrink-0">
        <div className="w-20 h-20 xs:w-24 xs:h-24 sm:w-28 sm:h-28 md:w-32 md:h-32 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full flex items-center justify-center shadow-2xl group-hover:scale-105 transition-transform duration-300">
          <Wallet className="w-10 h-10 xs:w-12 xs:h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 text-white" />
          <Sparkles className="absolute top-2 right-2 w-6 h-6 text-white/80 animate-pulse" />
        </div>
      </div>

      {/* Add a subtle animation for the background pulse */}
      <style jsx>{`
        @keyframes pulse-slow {
          0%, 100% {
            transform: scale(1);
            opacity: 0.1;
          }
          50% {
            transform: scale(1.1);
            opacity: 0.2;
          }
        }
        .animate-pulse-slow {
          animation: pulse-slow 6s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
      `}</style>
    </div>
  )
}
