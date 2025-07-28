"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "../ui/input"
import { Badge } from "../ui/badge"
import { X, Calculator, DollarSign, Share2, Zap, TrendingUp, Target, Sparkles, Plus, Minus } from "lucide-react"
import type { Match } from "@/lib/types"
import { api } from "@/lib/api"
import { useAuth } from "@/lib/auth"
import { toast } from "sonner"


interface BetSlipItem {
  match: Match
  selectedOption: "home_win" | "draw" | "away_win"
}

interface BetSlipProps {
  items: BetSlipItem[]
  onRemoveItem: (matchId: number) => void
  onClearAll: () => void
}

export function BetSlip({ items, onRemoveItem, onClearAll }: BetSlipProps) {
  const [betAmount, setBetAmount] = useState("10")
  const [isPlacing, setIsPlacing] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)
  const [quickAmounts] = useState([10, 50, 100, 500, 1000])
  const { user } = useAuth()

  // Animate when items change
  useEffect(() => {
    if (items.length > 0) {
      setIsAnimating(true)
      const timer = setTimeout(() => setIsAnimating(false), 300)
      return () => clearTimeout(timer)
    }
  }, [items.length])

  const getOdds = (item: BetSlipItem) => {
    switch (item.selectedOption) {
      case "home_win":
        return Number.parseFloat(item.match.odds_home_win)
      case "draw":
        return Number.parseFloat(item.match.odds_draw)
      case "away_win":
        return Number.parseFloat(item.match.odds_away_win)
      default:
        return 1
    }
  }

  const getOptionText = (option: BetSlipItem["selectedOption"]) => {
    switch (option) {
      case "home_win":
        return "Home Win"
      case "draw":
        return "Draw"
      case "away_win":
        return "Away Win"
      default:
        return option
    }
  }

  const getOptionColor = (option: BetSlipItem["selectedOption"]) => {
    switch (option) {
      case "home_win":
        return "from-green-500 to-emerald-500"
      case "draw":
        return "from-yellow-500 to-orange-500"
      case "away_win":
        return "from-blue-500 to-cyan-500"
      default:
        return "from-gray-500 to-gray-600"
    }
  }

  const totalOdds = items.reduce((acc, item) => acc * getOdds(item), 1)
  const potentialWin = Number.parseFloat(betAmount) * totalOdds
  const profit = potentialWin - Number.parseFloat(betAmount)

  const handlePlaceBet = async () => {
    if (!user) {
      toast.error("Please login to place bets")
      return
    }
    if (items.length === 0) {
      toast.error("Add matches to your bet slip")
      return
    }
    if (Number.parseFloat(betAmount) <= 0) {
      toast.error("Enter a valid bet amount")
      return
    }

    setIsPlacing(true)
    try {
      const betData = {
        amount: Number.parseFloat(betAmount),
        selections: items.map((item) => ({
          match_id: item.match.id,
          selected_option: item.selectedOption,
        })),
      }
      const response = await api.placeBet(betData)
      if (response.data) {
        toast.success("🎉 Bet placed successfully!", {
          description: `Bet ID: #${response.data.id} | Good luck!`,
          className: "bg-green-500/90 text-white border-green-400",
        })
        onClearAll()
        setBetAmount("10")
      } else {
        toast.error("Failed to place bet", {
          description: response.error || "Please try again",
        })
      }
    } finally {
      setIsPlacing(false)
    }
  }

  const handleShareSlip = () => {
    if (items.length === 0) return

    const summary = items
      .map((item, idx) => {
        return `${idx + 1}. ${item.match.home_team} vs ${item.match.away_team} - ${getOptionText(item.selectedOption)} @ ${getOdds(item).toFixed(2)}`
      })
      .join("\n")

    const message = `🎯 My Bet Slip on Gamble Galaxy\n\n${summary}\n\n💰 Stake: KES ${betAmount}\n🚀 Potential Win: KES ${potentialWin.toFixed(2)}\n📈 Total Odds: ${totalOdds.toFixed(2)}x\n\nJoin me at Gamble Galaxy! 🌟`

    if (navigator.share) {
      navigator.share({
        title: "My Bet Slip - Gamble Galaxy",
        text: message,
        url: window.location.href,
      })
    } else {
      navigator.clipboard.writeText(message)
      toast.success("🎯 Bet slip copied!", {
        description: "Ready to share with friends",
        className: "bg-purple-500/90 text-white border-purple-400",
      })
    }
  }

  const adjustAmount = (increment: boolean) => {
    const current = Number.parseFloat(betAmount) || 0
    const newAmount = increment ? current + 10 : Math.max(1, current - 10)
    setBetAmount(newAmount.toString())
  }

  if (items.length === 0) {
    return (
      <Card className="bg-white/5 backdrop-blur-sm border border-white/10 hover:border-white/20 transition-all duration-300 rounded-lg xs:rounded-xl sm:rounded-2xl overflow-hidden">
        <div className="p-3 xs:p-4 sm:p-6 border-b border-white/10 bg-gradient-to-r from-purple-500/10 to-pink-500/10">
          <div className="text-white flex items-center text-base xs:text-lg sm:text-xl font-bold">
            <div className="w-8 h-8 xs:w-9 xs:h-9 sm:w-10 sm:h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg xs:rounded-xl flex items-center justify-center mr-2 xs:mr-2.5 sm:mr-3">
              <Calculator className="w-4 h-4 xs:w-4.5 xs:h-4.5 sm:w-5 sm:h-5 text-white" />
            </div>
            Bet Slip
          </div>
        </div>
        <div className="p-4 xs:p-6 sm:p-8">
          <div className="text-center text-gray-400 py-8 xs:py-10 sm:py-12">
            <div className="relative mb-4 xs:mb-5 sm:mb-6">
              <Calculator className="w-12 h-12 xs:w-14 xs:h-14 sm:w-16 sm:h-16 mx-auto text-gray-500 opacity-50" />
              <div className="absolute inset-0 w-12 h-12 xs:w-14 xs:h-14 sm:w-16 sm:h-16 mx-auto animate-ping">
                <Calculator className="w-12 h-12 xs:w-14 xs:h-14 sm:w-16 sm:h-16 text-purple-400/30" />
              </div>
            </div>
            <h3 className="text-lg xs:text-xl font-semibold text-white mb-2">Your bet slip is empty</h3>
            <p className="text-gray-400 mb-3 xs:mb-4 text-sm xs:text-base">Click on odds to add selections</p>
            <div className="inline-flex items-center px-3 xs:px-4 py-1.5 xs:py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-white/80 text-xs xs:text-sm">
              <Sparkles className="w-3 h-3 xs:w-4 xs:h-4 mr-1.5 xs:mr-2 text-yellow-400" />
              Start building your winning combination
            </div>
          </div>
        </div>
      </Card>
    )
  }

  return (
    <Card
      className={`bg-white/5 backdrop-blur-sm border border-white/10 hover:border-white/20 transition-all duration-500 rounded-lg xs:rounded-xl sm:rounded-2xl overflow-hidden shadow-2xl w-full ${isAnimating ? "scale-105" : ""}`}
    >
      {/* Enhanced Header */}
      <div className="p-3 xs:p-4 sm:p-6 border-b border-white/10 bg-gradient-to-r from-purple-500/20 to-pink-500/20 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-600/10 to-pink-600/10 animate-pulse" />
        <div className="relative flex items-center justify-between">
          <div className="flex items-center">
            <div className="w-8 h-8 xs:w-9 xs:h-9 sm:w-10 sm:h-10 md:w-12 md:h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg xs:rounded-xl flex items-center justify-center mr-2 xs:mr-2.5 sm:mr-3 md:mr-4 shadow-lg">
              <Calculator className="w-4 h-4 xs:w-4.5 xs:h-4.5 sm:w-5 sm:h-5 md:w-6 md:h-6 text-white" />
            </div>
            <div>
              <h2 className="text-white text-base xs:text-lg sm:text-xl font-bold">Bet Slip</h2>
              <p className="text-gray-300 text-xs sm:text-sm">
                {items.length} selection{items.length !== 1 ? "s" : ""}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            onClick={onClearAll}
            className="text-gray-400 hover:text-red-400 hover:bg-red-500/20 transition-all duration-300 rounded-md xs:rounded-lg sm:rounded-xl p-1.5 xs:p-2"
          >
            <X className="w-3 h-3 xs:w-3.5 xs:h-3.5 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
            <span className="hidden sm:inline text-xs sm:text-sm">Clear</span>
          </Button>
        </div>
      </div>

      {/* Enhanced Match Selections */}
      <div className="space-y-2 xs:space-y-3 sm:space-y-4 p-3 xs:p-4 sm:p-6 max-h-48 xs:max-h-60 sm:max-h-80 overflow-y-auto custom-scrollbar">
        {items.map((item, index) => (
          <div
            key={item.match.id}
            className="bg-white/5 backdrop-blur-sm rounded-lg xs:rounded-xl sm:rounded-2xl p-2.5 xs:p-3 sm:p-5 border border-white/10 hover:border-white/20 transition-all duration-300 hover:scale-105 group"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center mb-1.5 xs:mb-2 sm:mb-3">
                  <div className="w-5 h-5 xs:w-6 xs:h-6 sm:w-8 sm:h-8 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-md sm:rounded-lg flex items-center justify-center mr-1.5 xs:mr-2 sm:mr-3 flex-shrink-0">
                    <span className="text-white font-bold text-xs">#{index + 1}</span>
                  </div>
                  <p className="text-white font-semibold text-xs sm:text-sm truncate">
                    {item.match.home_team} <span className="text-gray-400 mx-1">vs</span> {item.match.away_team}
                  </p>
                </div>
                <div className="flex items-center justify-between">
                  <Badge
                    className={`bg-gradient-to-r ${getOptionColor(item.selectedOption)} text-white text-xs px-1.5 xs:px-2 sm:px-3 py-0.5 xs:py-1 rounded-full shadow-lg`}
                  >
                    {getOptionText(item.selectedOption)}
                  </Badge>
                  <div className="flex items-center space-x-1 sm:space-x-2">
                    <TrendingUp className="w-2.5 h-2.5 xs:w-3 xs:h-3 sm:w-4 sm:h-4 text-green-400" />
                    <span className="text-green-400 font-bold text-sm sm:text-lg">{getOdds(item).toFixed(2)}</span>
                  </div>
                </div>
              </div>
              <Button
                variant="ghost"
                onClick={() => onRemoveItem(item.match.id)}
                className="p-1 xs:p-1.5 sm:p-2 text-gray-500 hover:text-red-500 hover:bg-red-500/20 transition-all duration-300 rounded-md xs:rounded-lg sm:rounded-xl opacity-0 group-hover:opacity-100 ml-1.5 xs:ml-2 flex-shrink-0"
              >
                <X className="w-2.5 h-2.5 xs:w-3 xs:h-3 sm:w-4 sm:h-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Enhanced Input Section */}
      <div className="px-3 xs:px-4 sm:px-6 pb-3 xs:pb-4 sm:pb-6 space-y-3 xs:space-y-4 sm:space-y-6">
        {/* Quick Amount Buttons */}
        <div>
          <label className="block text-xs sm:text-sm font-semibold text-gray-300 mb-1.5 xs:mb-2 sm:mb-3">
            Quick Amounts
          </label>
          <div className="grid grid-cols-5 gap-1 xs:gap-1.5 sm:gap-2">
            {quickAmounts.map((amount) => (
              <Button
                key={amount}
                variant="ghost"
                onClick={() => setBetAmount(amount.toString())}
                className={`text-xs py-1 xs:py-1.5 sm:py-2 rounded-md xs:rounded-lg sm:rounded-xl transition-all duration-300 ${
                  betAmount === amount.toString()
                    ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg"
                    : "bg-white/10 text-gray-300 hover:bg-white/20 hover:text-white"
                }`}
              >
                {amount}
              </Button>
            ))}
          </div>
        </div>

        {/* Amount Input with Controls */}
        <div>
          <label className="block text-xs sm:text-sm font-semibold text-gray-300 mb-1.5 xs:mb-2 sm:mb-3">
            Stake Amount (KES)
          </label>
          <div className="flex items-center space-x-1.5 xs:space-x-2 sm:space-x-3">
            <Button
              variant="ghost"
              onClick={() => adjustAmount(false)}
              className="bg-white/10 hover:bg-white/20 text-white rounded-md xs:rounded-lg sm:rounded-xl p-1.5 xs:p-2 sm:p-3"
            >
              <Minus className="w-2.5 h-2.5 xs:w-3 xs:h-3 sm:w-4 sm:h-4" />
            </Button>
            <Input
              type="number"
              value={betAmount}
              onChange={(e) => setBetAmount(e.target.value)}
              className="flex-1 bg-white/10 backdrop-blur-sm border-white/20 text-white text-center text-sm xs:text-base sm:text-lg font-bold rounded-md xs:rounded-lg sm:rounded-xl h-8 xs:h-10 sm:h-12 focus:border-purple-400 transition-all duration-300"
              min="1"
              step="0.01"
            />
            <Button
              variant="ghost"
              onClick={() => adjustAmount(true)}
              className="bg-white/10 hover:bg-white/20 text-white rounded-md xs:rounded-lg sm:rounded-xl p-1.5 xs:p-2 sm:p-3"
            >
              <Plus className="w-2.5 h-2.5 xs:w-3 xs:h-3 sm:w-4 sm:h-4" />
            </Button>
          </div>
        </div>

        {/* Enhanced Summary */}
        <div className="bg-gradient-to-r from-gray-900/50 to-gray-800/50 backdrop-blur-sm border border-white/10 rounded-lg xs:rounded-xl sm:rounded-2xl p-3 xs:p-4 sm:p-6 space-y-2 xs:space-y-3 sm:space-y-4">
          <div className="flex items-center mb-2 xs:mb-3 sm:mb-4">
            <Target className="w-3 h-3 xs:w-4 xs:h-4 sm:w-5 sm:h-5 text-purple-400 mr-1.5 xs:mr-2" />
            <h3 className="text-white font-semibold text-sm sm:text-base">Bet Summary</h3>
          </div>

          <div className="space-y-1.5 xs:space-y-2 sm:space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-300 text-xs sm:text-sm">Total Odds</span>
              <div className="flex items-center space-x-1 sm:space-x-2">
                <Zap className="w-2.5 h-2.5 xs:w-3 xs:h-3 sm:w-4 sm:h-4 text-yellow-400" />
                <span className="text-white font-bold text-sm sm:text-lg">{totalOdds.toFixed(2)}x</span>
              </div>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-gray-300 text-xs sm:text-sm">Stake</span>
              <span className="text-white font-semibold text-sm sm:text-base">
                KES {Number.parseFloat(betAmount).toFixed(2)}
              </span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-gray-300 text-xs sm:text-sm">Profit</span>
              <span className="text-green-400 font-semibold text-sm sm:text-base">KES {profit.toFixed(2)}</span>
            </div>

            <div className="border-t border-white/10 pt-1.5 xs:pt-2 sm:pt-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-300 font-semibold text-sm sm:text-base">Potential Win</span>
                <div className="text-right">
                  <div className="text-green-400 font-bold text-base xs:text-lg sm:text-xl">
                    KES {potentialWin.toFixed(2)}
                  </div>
                  <div className="text-xs text-gray-400">
                    {((potentialWin / Number.parseFloat(betAmount) - 1) * 100).toFixed(1)}% return
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Action Buttons */}
        <div className="space-y-1.5 xs:space-y-2 sm:space-y-3">
          <Button
            onClick={handlePlaceBet}
            disabled={isPlacing || !user}
            className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-bold py-2.5 xs:py-3 sm:py-4 rounded-lg xs:rounded-xl sm:rounded-2xl transition-all duration-300 hover:scale-105 shadow-2xl hover:shadow-green-500/25 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
          >
            {isPlacing ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-3.5 w-3.5 xs:h-4 xs:w-4 sm:h-5 sm:w-5 border-2 border-white/30 border-t-white mr-1.5 xs:mr-2 sm:mr-3"></div>
                <span className="text-sm sm:text-base">Placing Bet...</span>
              </div>
            ) : (
              <div className="flex items-center justify-center">
                <DollarSign className="w-3.5 h-3.5 xs:w-4 xs:h-4 sm:w-5 sm:h-5 mr-1.5 xs:mr-2" />
                <span className="text-sm sm:text-base">Place Bet</span>
                <Sparkles className="w-2.5 h-2.5 xs:w-3 xs:h-3 sm:w-4 sm:h-4 ml-1.5 xs:ml-2" />
              </div>
            )}
          </Button>

          <Button
            onClick={handleShareSlip}
            variant="outline"
            className="w-full bg-white/10 backdrop-blur-sm border border-white/20 text-white hover:bg-white/20 hover:border-purple-400 hover:text-purple-300 font-semibold py-2.5 xs:py-3 sm:py-4 rounded-lg xs:rounded-xl sm:rounded-2xl transition-all duration-300 hover:scale-105 text-sm sm:text-base"
          >
            <Share2 className="w-3.5 h-3.5 xs:w-4 xs:h-4 sm:w-5 sm:h-5 mr-1.5 xs:mr-2" />
            Share Bet Slip
          </Button>
        </div>

        {/* Auth Note */}
        {!user && (
          <div className="text-center p-2.5 xs:p-3 sm:p-4 bg-yellow-500/10 backdrop-blur-sm border border-yellow-500/30 rounded-lg xs:rounded-xl sm:rounded-2xl">
            <p className="text-yellow-400 font-semibold text-sm sm:text-base">🔐 Login required to place bets</p>
            <p className="text-yellow-300/80 text-xs sm:text-sm mt-0.5 xs:mt-1">Sign in to start winning big!</p>
          </div>
        )}
      </div>

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: linear-gradient(to bottom, #8b5cf6, #ec4899);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(to bottom, #7c3aed, #db2777);
        }
      `}</style>
    </Card>
  )
}
