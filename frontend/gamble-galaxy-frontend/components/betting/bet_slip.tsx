"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "../ui/input"
import { Badge } from "../ui/badge"
import { X, Calculator, DollarSign, Share2, Zap, TrendingUp, Target, Sparkles, Plus, Minus } from 'lucide-react'
import type { Match } from "@/lib/types"
import { api } from "@/lib/api"
import { useAuth } from "@/lib/auth"
import { toast } from "sonner"

interface BetSlipItem {
  match: Match
  selectedOption: string
}

interface BetSlipProps {
  items: BetSlipItem[]
  onRemoveItem: (matchId: number) => void
  onClearAll: () => void
  onPlaceBet?: (amount: number) => Promise<any>
}

export function BetSlip({ items, onRemoveItem, onClearAll, onPlaceBet }: BetSlipProps) {
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
    const match = item.match
    const option = item.selectedOption

    // Comprehensive odds mapping - covers all possible betting markets
    const oddsMap: Record<string, string | undefined> = {
      // Main markets
      home_win: match.odds_home_win,
      draw: match.odds_draw,
      away_win: match.odds_away_win,
      "1": match.odds_home_win,
      "X": match.odds_draw,
      "2": match.odds_away_win,
      
      // Goals markets
      "over_2.5": match.odds_over_2_5,
      "under_2.5": match.odds_under_2_5,
      "over_1.5": match.odds_over_2_5, // Fallback if specific odds not available
      "under_1.5": match.odds_under_2_5,
      "over_3.5": match.odds_over_2_5,
      "under_3.5": match.odds_under_2_5,
      
      // Both teams to score
      btts_yes: match.odds_btts_yes,
      btts_no: match.odds_btts_no,
      
      // Double chance
      home_or_draw: match.odds_home_or_draw,
      draw_or_away: match.odds_draw_or_away,
      home_or_away: match.odds_home_or_away,
      "1X": match.odds_home_or_draw,
      "X2": match.odds_draw_or_away,
      "12": match.odds_home_or_away,
      
      // Half time / Full time
      ht_ft_home_home: match.odds_ht_ft_home_home,
      ht_ft_draw_draw: match.odds_ht_ft_draw_draw,
      ht_ft_away_away: match.odds_ht_ft_away_away,
      "1/1": match.odds_ht_ft_home_home,
      "X/X": match.odds_ht_ft_draw_draw,
      "2/2": match.odds_ht_ft_away_away,
      
      // Correct score
      score_1_0: match.odds_score_1_0,
      score_2_1: match.odds_score_2_1,
      score_0_0: match.odds_score_0_0,
      score_1_1: match.odds_score_1_1,
      "1-0": match.odds_score_1_0,
      "2-1": match.odds_score_2_1,
      "0-0": match.odds_score_0_0,
      "1-1": match.odds_score_1_1,
    }

    // Get odds value
    let odds = oddsMap[option]
    
    // If exact match not found, try some fallbacks
    if (!odds) {
      // Try without underscores
      const normalizedOption = option.replace(/_/g, '')
      odds = oddsMap[normalizedOption]
    }
    
    if (!odds) {
      // Try with different formatting
      const formattedOption = option.toLowerCase().replace(/\s+/g, '_')
      odds = oddsMap[formattedOption]
    }

    // Parse odds or return default
    const parsedOdds = odds ? parseFloat(odds) : null
    
    // If we still don't have odds, return a default value and log warning
    if (!parsedOdds || isNaN(parsedOdds)) {
      console.warn(`No odds found for option: ${option} in match: ${match.home_team} vs ${match.away_team}`)
      return 1.5 // Default odds
    }

    return parsedOdds
  }

  const getOptionText = (option: string) => {
    // Comprehensive label mapping
    const labels: Record<string, string> = {
      // Main markets
      home_win: "Home Win",
      draw: "Draw",
      away_win: "Away Win",
      "1": "Home Win",
      "X": "Draw",
      "2": "Away Win",
      
      // Goals markets
      "over_2.5": "Over 2.5 Goals",
      "under_2.5": "Under 2.5 Goals",
      "over_1.5": "Over 1.5 Goals",
      "under_1.5": "Under 1.5 Goals",
      "over_3.5": "Over 3.5 Goals",
      "under_3.5": "Under 3.5 Goals",
      "over_0.5": "Over 0.5 Goals",
      "under_0.5": "Under 0.5 Goals",
      
      // Both teams to score
      btts_yes: "Both Teams to Score - Yes",
      btts_no: "Both Teams to Score - No",
     
      
      // Double chance
      home_or_draw: "Home or Draw",
      draw_or_away: "Draw or Away",
      home_or_away: "Home or Away",
      "1X": "Home or Draw",
      "X2": "Draw or Away",
      "12": "Home or Away",
      
      // Half time / Full time
      ht_ft_home_home: "HT/FT Home/Home",
      ht_ft_draw_draw: "HT/FT Draw/Draw",
      ht_ft_away_away: "HT/FT Away/Away",
      "1/1": "HT/FT Home/Home",
      "X/X": "HT/FT Draw/Draw",
      "2/2": "HT/FT Away/Away",
      
      // Correct score
      score_1_0: "Correct Score 1-0",
      score_2_1: "Correct Score 2-1",
      score_0_0: "Correct Score 0-0",
      score_1_1: "Correct Score 1-1",
      score_2_0: "Correct Score 2-0",
      score_0_1: "Correct Score 0-1",
      score_0_2: "Correct Score 0-2",
      score_3_0: "Correct Score 3-0",
      score_3_1: "Correct Score 3-1",
      score_1_2: "Correct Score 1-2",
      "1-0": "Correct Score 1-0",
      "2-1": "Correct Score 2-1",
      "0-0": "Correct Score 0-0",
      "1-1": "Correct Score 1-1",
      "2-0": "Correct Score 2-0",
      "0-1": "Correct Score 0-1",
      "0-2": "Correct Score 0-2",
      "3-0": "Correct Score 3-0",
      "3-1": "Correct Score 3-1",
      "1-2": "Correct Score 1-2",
      
      // Asian handicap (common values)
      "handicap_home_-1": "Home -1",
      "handicap_home_-0.5": "Home -0.5",
      "handicap_away_+1": "Away +1",
      "handicap_away_+0.5": "Away +0.5",
      
      // First half markets
      "1h_home": "1st Half Home",
      "1h_draw": "1st Half Draw", 
      "1h_away": "1st Half Away",
      
      // Clean sheet
      "home_clean_sheet": "Home Clean Sheet",
      "away_clean_sheet": "Away Clean Sheet",
      
      // Win to nil
      "home_win_to_nil": "Home Win to Nil",
      "away_win_to_nil": "Away Win to Nil",
    }

    // Return label or create a readable version from the option
    return labels[option] || formatOptionText(option)
  }

  // Helper function to format unknown options
  const formatOptionText = (option: string) => {
    return option
      .replace(/_/g, ' ')
      .replace(/\b\w/g, l => l.toUpperCase())
      .replace(/Ht Ft/g, 'HT/FT')
      .replace(/Btts/g, 'BTTS')
  }

  const getOptionColor = (option: string) => {
    // Color coding based on market type
    if (option.includes("home") || option === "home_win" || option === "1") {
      return "from-green-500 to-emerald-500"
    } else if (option.includes("draw") || option === "draw" || option === "X") {
      return "from-yellow-500 to-orange-500"
    } else if (option.includes("away") || option === "away_win" || option === "2") {
      return "from-blue-500 to-cyan-500"
    } else if (option.includes("over") || option.includes("btts_yes")) {
      return "from-purple-500 to-pink-500"
    } else if (option.includes("under") || option.includes("btts_no")) {
      return "from-red-500 to-rose-500"
    } else if (option.includes("score") || option.match(/\d-\d/)) {
      return "from-indigo-500 to-purple-500"
    } else if (option.includes("ht_ft") || option.includes("/")) {
      return "from-orange-500 to-red-500"
    } else if (option.includes("handicap")) {
      return "from-teal-500 to-cyan-500"
    } else if (option.includes("1h") || option.includes("first")) {
      return "from-pink-500 to-rose-500"
    }
    return "from-gray-500 to-gray-600"
  }

  const totalOdds = items.reduce((acc, item) => acc * getOdds(item), 1)
  const potentialWin = parseFloat(betAmount) * totalOdds
  const profit = potentialWin - parseFloat(betAmount)

  const handlePlaceBet = async () => {
    if (!user) {
      toast.error("Please login to place bets")
      return
    }
    if (items.length === 0) {
      toast.error("Add matches to your bet slip")
      return
    }
    if (parseFloat(betAmount) <= 0) {
      toast.error("Enter a valid bet amount")
      return
    }

    // Check if any items have invalid odds
    const invalidItems = items.filter(item => {
      const odds = getOdds(item)
      return !odds || odds <= 1
    })

    if (invalidItems.length > 0) {
      toast.error("Some selections have invalid odds", {
        description: "Please remove invalid selections and try again",
      })
      return
    }

    setIsPlacing(true)
    try {
      if (onPlaceBet) {
        // Use the parent's enhanced bet placement function
        await onPlaceBet(parseFloat(betAmount))
      } else {
        // Fallback to original implementation
        const betData = {
          amount: parseFloat(betAmount),
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
      }
    } catch (error) {
      console.error("Error placing bet:", error)
      toast.error("Network error. Please check your connection and try again.")
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
    const current = parseFloat(betAmount) || 0
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
        {items.map((item, index) => {
          const odds = getOdds(item)
          const isValidOdds = odds && odds > 1
          
          return (
            <div
              key={`${item.match.id}-${item.selectedOption}`}
              className={`bg-white/5 backdrop-blur-sm rounded-lg xs:rounded-xl sm:rounded-2xl p-2.5 xs:p-3 sm:p-5 border transition-all duration-300 hover:scale-105 group ${
                isValidOdds 
                  ? "border-white/10 hover:border-white/20" 
                  : "border-red-500/30 hover:border-red-500/50"
              }`}
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
                      <TrendingUp className={`w-2.5 h-2.5 xs:w-3 xs:h-3 sm:w-4 sm:h-4 ${isValidOdds ? 'text-green-400' : 'text-red-400'}`} />
                      <span className={`font-bold text-sm sm:text-lg ${isValidOdds ? 'text-green-400' : 'text-red-400'}`}>
                        {isValidOdds ? odds.toFixed(2) : 'N/A'}
                      </span>
                    </div>
                  </div>
                  {!isValidOdds && (
                    <div className="mt-2 text-xs text-red-400">
                      ⚠️ Odds not available for this market
                    </div>
                  )}
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
          )
        })}
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
                KES {parseFloat(betAmount).toFixed(2)}
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
                    {((potentialWin / parseFloat(betAmount) - 1) * 100).toFixed(1)}% return
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
