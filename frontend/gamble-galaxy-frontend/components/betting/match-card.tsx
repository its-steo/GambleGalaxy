"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import type { Match } from "@/lib/types"
import {
  Clock,
  Trophy,
  Share2,
  Zap,
  TrendingUp,
  Target,
  Sparkles,
  Users,
  Calendar,
  MapPin,
  Star,
  FlameIcon as Fire,
  Eye,
  ChevronDown,
  ChevronUp,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

interface MatchCardProps {
  match: Match
  onAddToBetSlip: (match: Match, option: string) => void
  selectedOptions: Record<number, string>
}

export function MatchCard({ match, onAddToBetSlip, selectedOptions }: MatchCardProps) {
  const [pulseAnimation, setPulseAnimation] = useState(false)
  const [liveViewers] = useState(Math.floor(Math.random() * 5000) + 1000)
  const [showAllMarkets, setShowAllMarkets] = useState(false)

  // Animate when selection changes
  useEffect(() => {
    if (selectedOptions[match.id]) {
      setPulseAnimation(true)
      const timer = setTimeout(() => setPulseAnimation(false), 600)
      return () => clearTimeout(timer)
    }
  }, [selectedOptions, match.id])

  const getStatusColor = (status: string) => {
    switch (status) {
      case "upcoming":
        return "from-blue-500 to-cyan-500"
      case "live":
      case "first_half":
      case "second_half":
        return "from-green-500 to-emerald-500"
      case "halftime":
        return "from-yellow-500 to-orange-500"
      case "finished":
      case "fulltime":
        return "from-gray-500 to-gray-600"
      default:
        return "from-gray-500 to-gray-600"
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case "upcoming":
        return "Upcoming"
      case "live":
        return "Live"
      case "first_half":
        return "1st Half"
      case "second_half":
        return "2nd Half"
      case "halftime":
        return "Half Time"
      case "finished":
      case "fulltime":
        return "Full Time"
      default:
        return status.charAt(0).toUpperCase() + status.slice(1)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "upcoming":
        return <Calendar className="w-3 h-3" />
      case "live":
      case "first_half":
      case "second_half":
        return <Zap className="w-3 h-3" />
      case "halftime":
        return <Clock className="w-3 h-3" />
      case "finished":
      case "fulltime":
        return <Trophy className="w-3 h-3" />
      default:
        return <Clock className="w-3 h-3" />
    }
  }

  const getOptionGradient = (option: string) => {
    if (option.includes("home") || option === "home_win") {
      return "from-green-500 to-emerald-500"
    } else if (option.includes("draw") || option === "draw") {
      return "from-yellow-500 to-orange-500"
    } else if (option.includes("away") || option === "away_win") {
      return "from-blue-500 to-cyan-500"
    } else if (option.includes("over") || option.includes("btts_yes")) {
      return "from-purple-500 to-pink-500"
    } else if (option.includes("under") || option.includes("btts_no")) {
      return "from-red-500 to-rose-500"
    } else if (option.includes("score")) {
      return "from-indigo-500 to-purple-500"
    } else if (option.includes("ht_ft")) {
      return "from-orange-500 to-red-500"
    }
    return "from-gray-500 to-gray-600"
  }

  const isSelected = (option: string) => selectedOptions[match.id] === option
  const canBet = match.status === "upcoming"
  // Fixed: Use the correct status values that match your Match interface
  const isLive = match.status === "live" || match.status === "first_half" || match.status === "second_half"

  const handleAddToBetSlip = (option: string) => {
    try {
      // Check if odds are available for this option
      const odds = getOddsValue(option)
      if (!odds || Number.parseFloat(odds) <= 0) {
        toast.error("Odds not available", {
          description: "This market doesn't have valid odds",
          className: "bg-red-500/90 text-white border-red-400",
        })
        return
      }

      // Add to bet slip - now supports all markets
      onAddToBetSlip(match, option)

      toast.success("Added to bet slip! 🎯", {
        description: `${match.home_team} vs ${match.away_team} - ${getOptionLabel(option)} @ ${Number.parseFloat(odds).toFixed(2)}`,
        className: "bg-green-500/90 text-white border-green-400",
      })
    } catch (error) {
      console.error("Error adding to bet slip:", error)
      toast.error("Failed to add to bet slip", {
        description: "Please try again",
        className: "bg-red-500/90 text-white border-red-400",
      })
    }
  }

  const handleShare = () => {
    // Use fallback values if odds properties don't exist
    const homeOdds = match.odds_home_win || match.odds?.home?.toString() || "N/A"
    const drawOdds = match.odds_draw || match.odds?.draw?.toString() || "N/A"
    const awayOdds = match.odds_away_win || match.odds?.away?.toString() || "N/A"

    const shareText = `🏆 ${match.home_team} vs ${match.away_team}

📊 Main Odds:
🏠 ${match.home_team}: ${homeOdds}
⚖️ Draw: ${drawOdds}
✈️ ${match.away_team}: ${awayOdds}

⏰ ${new Date(match.match_time || match.start_time).toLocaleString()}

🎯 Match #${match.id} on Gamble Galaxy
Join the action! 🚀`

    if (navigator.share) {
      navigator.share({
        title: `${match.home_team} vs ${match.away_team}`,
        text: shareText,
        url: window.location.href,
      })
    } else {
      navigator.clipboard.writeText(shareText)
      toast.success("Match details copied! 📋", {
        description: "Ready to share with friends",
        className: "bg-purple-500/90 text-white border-purple-400",
      })
    }
  }

  const getOptionLabel = (option: string) => {
    const labels: Record<string, string> = {
      home_win: "Home Win",
      draw: "Draw",
      away_win: "Away Win",
      "over_2.5": "Over 2.5 Goals",
      "under_2.5": "Under 2.5 Goals",
      btts_yes: "Both Teams to Score - Yes",
      btts_no: "Both Teams to Score - No",
      home_or_draw: "Home or Draw",
      draw_or_away: "Draw or Away",
      home_or_away: "Home or Away",
      ht_ft_home_home: "HT/FT Home/Home",
      ht_ft_draw_draw: "HT/FT Draw/Draw",
      ht_ft_away_away: "HT/FT Away/Away",
      score_1_0: "Correct Score 1-0",
      score_2_1: "Correct Score 2-1",
      score_0_0: "Correct Score 0-0",
      score_1_1: "Correct Score 1-1",
    }
    return labels[option] || option.replace("_", " ").replace(/\b\w/g, (l) => l.toUpperCase())
  }

  const getOddsValue = (option: string) => {
    // Create a comprehensive odds mapping with fallbacks
    const oddsMap: Record<string, string | number | undefined> = {
      home_win: match.odds_home_win || match.odds?.home,
      draw: match.odds_draw || match.odds?.draw,
      away_win: match.odds_away_win || match.odds?.away,
      "over_2.5": match.odds_over_2_5,
      "under_2.5": match.odds_under_2_5,
      btts_yes: match.odds_btts_yes,
      btts_no: match.odds_btts_no,
      home_or_draw: match.odds_home_or_draw,
      draw_or_away: match.odds_draw_or_away,
      home_or_away: match.odds_home_or_away,
      ht_ft_home_home: match.odds_ht_ft_home_home,
      ht_ft_draw_draw: match.odds_ht_ft_draw_draw,
      ht_ft_away_away: match.odds_ht_ft_away_away,
      score_1_0: match.odds_score_1_0,
      score_2_1: match.odds_score_2_1,
      score_0_0: match.odds_score_0_0,
      score_1_1: match.odds_score_1_1,
    }

    const odds = oddsMap[option]
    return odds ? odds.toString() : ""
  }

  const getBestOdds = () => {
    const allOdds = [
      match.odds_home_win || match.odds?.home,
      match.odds_draw || match.odds?.draw,
      match.odds_away_win || match.odds?.away,
      match.odds_over_2_5,
      match.odds_under_2_5,
      match.odds_btts_yes,
      match.odds_btts_no,
      match.odds_home_or_draw,
      match.odds_draw_or_away,
      match.odds_home_or_away,
      match.odds_ht_ft_home_home,
      match.odds_ht_ft_draw_draw,
      match.odds_ht_ft_away_away,
      match.odds_score_1_0,
      match.odds_score_2_1,
      match.odds_score_0_0,
      match.odds_score_1_1,
    ].filter((odds) => odds && Number.parseFloat(odds.toString()) > 0)

    return allOdds.length > 0 ? Math.max(...allOdds.map((odds) => Number.parseFloat(odds!.toString()))) : 0
  }

  // Define betting markets with improved structure
  const bettingMarkets = [
    {
      title: "Match Result",
      options: ["home_win", "draw", "away_win"],
      icon: Trophy,
      priority: 1,
    },
    {
      title: "Goals",
      options: ["over_2.5", "under_2.5"],
      icon: Target,
      priority: 2,
    },
    {
      title: "Both Teams to Score",
      options: ["btts_yes", "btts_no"],
      icon: Zap,
      priority: 3,
    },
    {
      title: "Double Chance",
      options: ["home_or_draw", "draw_or_away", "home_or_away"],
      icon: TrendingUp,
      priority: 4,
    },
    {
      title: "Half Time / Full Time",
      options: ["ht_ft_home_home", "ht_ft_draw_draw", "ht_ft_away_away"],
      icon: Clock,
      priority: 5,
    },
    {
      title: "Correct Score",
      options: ["score_1_0", "score_2_1", "score_0_0", "score_1_1"],
      icon: Star,
      priority: 6,
    },
  ]

  // Filter markets that have available odds
  const availableMarkets = bettingMarkets
    .map((market) => ({
      ...market,
      availableOptions: market.options.filter((option) => {
        const odds = getOddsValue(option)
        return odds && Number.parseFloat(odds) > 0
      }),
    }))
    .filter((market) => market.availableOptions.length > 0)
    .sort((a, b) => a.priority - b.priority)

  return (
    <Card
      className={cn(
        "bg-white/5 backdrop-blur-sm border border-white/10 hover:border-white/20 rounded-xl sm:rounded-2xl overflow-hidden transition-all duration-500 hover:scale-105 hover:shadow-2xl group w-full",
        pulseAnimation && "animate-pulse",
        isLive && "ring-2 ring-green-400/50 ring-pulse",
      )}
    >
      {/* Enhanced Header */}
      <div className="relative p-3 sm:p-4 border-b border-white/10 bg-gradient-to-r from-purple-500/10 to-pink-500/10 overflow-hidden">
        {/* Background Animation */}
        <div className="absolute inset-0 bg-gradient-to-r from-purple-600/5 to-pink-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        <div className="relative flex items-center justify-between">
          <div className="flex items-center space-x-2 sm:space-x-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg sm:rounded-xl flex items-center justify-center shadow-lg">
              <Trophy className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </div>
            <div>
              <div className="text-white font-bold text-xs sm:text-sm">Match #{match.id}</div>
              {isLive && (
                <div className="flex items-center text-xs text-green-400">
                  <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-green-400 rounded-full animate-pulse mr-1 sm:mr-2" />
                  <Eye className="w-2.5 h-2.5 sm:w-3 sm:h-3 mr-1" />
                  <span className="text-xs">{liveViewers.toLocaleString()} watching</span>
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center space-x-1 sm:space-x-2">
            {getBestOdds() > 3 && (
              <div className="flex items-center px-1.5 sm:px-2 py-1 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 rounded-full border border-yellow-500/30">
                <Fire className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-yellow-400 mr-0.5 sm:mr-1" />
                <span className="text-yellow-400 text-xs font-bold">Hot</span>
              </div>
            )}
            <Badge
              className={cn(
                "bg-gradient-to-r text-white text-xs px-2 sm:px-3 py-1 shadow-lg",
                getStatusColor(match.status),
              )}
            >
              <div className="flex items-center space-x-1">
                {getStatusIcon(match.status)}
                <span className="text-xs">{getStatusText(match.status)}</span>
              </div>
            </Badge>
          </div>
        </div>
      </div>

      {/* Enhanced Match Info */}
      <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
        {/* Teams & Score with Enhanced Design */}
        <div className="relative">
          <div className="flex items-center justify-between text-white">
            {/* Home Team */}
            <div className="flex-1 text-left">
              <div className="flex items-center space-x-1.5 sm:space-x-2 mb-2">
                <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-r from-green-500 to-emerald-500 rounded-md sm:rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-xs">H</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-sm sm:text-base truncate" title={match.home_team}>
                    {match.home_team}
                  </div>
                  <div className="text-xs text-gray-400">Home</div>
                </div>
              </div>
            </div>

            {/* Enhanced Score/VS */}
            <div className="flex-1 text-center mx-2 sm:mx-4">
              <div className="relative">
                {match.status !== "upcoming" && match.score_home !== undefined && match.score_away !== undefined ? (
                  <div className="bg-white/10 backdrop-blur-sm rounded-xl sm:rounded-2xl p-2 sm:p-4 border border-white/20">
                    <div className="text-xl sm:text-3xl font-black text-white mb-1">
                      {match.score_home} - {match.score_away}
                    </div>
                    {isLive && (
                      <div className="flex items-center justify-center text-green-400 text-xs">
                        <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-green-400 rounded-full animate-pulse mr-1 sm:mr-2" />
                        LIVE
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 backdrop-blur-sm rounded-xl sm:rounded-2xl p-2 sm:p-4 border border-white/20">
                    <div className="text-lg sm:text-2xl font-black text-white mb-1">VS</div>
                    <div className="text-xs text-gray-400">
                      {match.status === "upcoming" ? "Upcoming" : getStatusText(match.status)}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Away Team */}
            <div className="flex-1 text-right">
              <div className="flex items-center justify-end space-x-1.5 sm:space-x-2 mb-2">
                <div className="flex-1 text-right min-w-0">
                  <div className="font-bold text-sm sm:text-base truncate" title={match.away_team}>
                    {match.away_team}
                  </div>
                  <div className="text-xs text-gray-400">Away</div>
                </div>
                <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-md sm:rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-xs">A</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Match Time */}
        <div className="flex flex-col sm:flex-row items-center justify-center space-y-2 sm:space-y-0 sm:space-x-4 text-gray-400 text-xs sm:text-sm bg-white/5 backdrop-blur-sm rounded-lg sm:rounded-xl p-2 sm:p-3 border border-white/10">
          <div className="flex items-center space-x-1 sm:space-x-2">
            <Clock className="w-3 h-3 sm:w-4 sm:h-4 text-purple-400" />
            <span className="text-center sm:text-left">
              {new Date(match.match_time || match.start_time).toLocaleString()}
            </span>
          </div>
          <div className="hidden sm:block w-1 h-1 bg-gray-400 rounded-full" />
          <div className="flex items-center space-x-1 sm:space-x-2">
            <MapPin className="w-3 h-3 sm:w-4 sm:h-4 text-blue-400" />
            <span>Stadium</span>
          </div>
        </div>

        {/* Enhanced Betting Markets */}
        {canBet ? (
          <div className="space-y-3 sm:space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-white font-semibold flex items-center text-sm sm:text-base">
                <Target className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2 text-purple-400" />
                Betting Markets
              </h3>
              <div className="flex items-center text-xs text-gray-400">
                <TrendingUp className="w-2.5 h-2.5 sm:w-3 sm:h-3 mr-1" />
                Live odds
              </div>
            </div>

            {/* Render available betting markets */}
            {availableMarkets.map((market, marketIndex) => {
              const isMainMarket = marketIndex === 0 // Match Result is always shown
              const shouldShow = isMainMarket || showAllMarkets
              if (!shouldShow && !isMainMarket) return null

              return (
                <div key={market.title} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <market.icon className="w-3 h-3 text-purple-400" />
                      <span className="text-white text-sm font-medium">{market.title}</span>
                    </div>
                    <span className="text-xs text-gray-400">{market.availableOptions.length} options</span>
                  </div>
                  <div
                    className={cn(
                      "grid gap-2",
                      market.availableOptions.length === 2
                        ? "grid-cols-2"
                        : market.availableOptions.length === 3
                          ? "grid-cols-3"
                          : "grid-cols-2 sm:grid-cols-4",
                    )}
                  >
                    {market.availableOptions.map((option) => {
                      const odds = getOddsValue(option)
                      const selected = isSelected(option)
                      const oddsValue = Number.parseFloat(odds || "0")

                      return (
                        <Button
                          key={option}
                          variant="ghost"
                          onClick={() => handleAddToBetSlip(option)}
                          className={cn(
                            "relative flex flex-col items-center justify-center p-2 sm:p-3 h-auto text-center transition-all duration-300 hover:scale-105 rounded-lg sm:rounded-xl overflow-hidden group/btn",
                            selected
                              ? `bg-gradient-to-r ${getOptionGradient(option)} text-white shadow-2xl ring-2 ring-white/20`
                              : "bg-white/10 backdrop-blur-sm border border-white/20 hover:border-white/40 text-gray-200 hover:bg-white/20",
                          )}
                        >
                          {/* Background Animation */}
                          <div
                            className={cn(
                              "absolute inset-0 bg-gradient-to-r opacity-0 group-hover/btn:opacity-20 transition-opacity duration-300",
                              getOptionGradient(option),
                            )}
                          />
                          <div className="relative z-10">
                            <span className="text-xs text-gray-400 mb-1 block truncate">{getOptionLabel(option)}</span>
                            <div className="flex items-center justify-center space-x-0.5 sm:space-x-1">
                              {selected && <Star className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-yellow-400" />}
                              <span className="font-bold text-sm sm:text-base">{oddsValue.toFixed(2)}</span>
                            </div>
                            {oddsValue > 3 && (
                              <div className="flex items-center justify-center mt-0.5 sm:mt-1">
                                <Sparkles className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-yellow-400" />
                              </div>
                            )}
                          </div>
                        </Button>
                      )
                    })}
                  </div>
                </div>
              )
            })}

            {/* Show More/Less Button */}
            {availableMarkets.length > 1 && (
              <Button
                variant="ghost"
                onClick={() => setShowAllMarkets(!showAllMarkets)}
                className="w-full bg-white/5 hover:bg-white/10 text-white border border-white/20 hover:border-white/40 rounded-lg sm:rounded-xl py-2 transition-all duration-300"
              >
                {showAllMarkets ? (
                  <>
                    <ChevronUp className="w-4 h-4 mr-2" />
                    Show Less Markets
                  </>
                ) : (
                  <>
                    <ChevronDown className="w-4 h-4 mr-2" />
                    Show More Markets ({availableMarkets.length - 1} more)
                  </>
                )}
              </Button>
            )}

            {/* Odds Summary */}
            {getBestOdds() > 0 && (
              <div className="bg-gradient-to-r from-gray-900/50 to-gray-800/50 backdrop-blur-sm rounded-lg sm:rounded-xl p-2 sm:p-3 border border-white/10">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-400">Best Odds:</span>
                  <div className="flex items-center space-x-1">
                    <TrendingUp className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-green-400" />
                    <span className="text-green-400 font-bold">{getBestOdds().toFixed(2)}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-6 sm:py-8">
            <div className="bg-gray-500/20 backdrop-blur-sm rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-gray-500/30">
              <Trophy className="w-8 h-8 sm:w-12 sm:h-12 mx-auto mb-2 sm:mb-3 text-gray-500" />
              <h3 className="text-gray-400 font-semibold mb-1 text-sm sm:text-base">Betting Closed</h3>
              <p className="text-gray-500 text-xs sm:text-sm">This match is no longer accepting bets</p>
            </div>
          </div>
        )}

        {/* Enhanced Share Button */}
        <div className="flex justify-between items-center pt-3 sm:pt-4 border-t border-white/10">
          <div className="flex items-center space-x-3 sm:space-x-4 text-xs text-gray-400">
            <div className="flex items-center space-x-1">
              <Users className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
              <span>{Math.floor(Math.random() * 500) + 100} bets</span>
            </div>
            <div className="flex items-center space-x-1">
              <Eye className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
              <span>{Math.floor(Math.random() * 1000) + 200} views</span>
            </div>
          </div>
          <Button
            variant="ghost"
            onClick={handleShare}
            className="text-purple-400 hover:text-purple-300 hover:bg-purple-500/20 flex items-center space-x-1 sm:space-x-2 text-xs sm:text-sm transition-all duration-300 hover:scale-105 rounded-lg sm:rounded-xl px-2 sm:px-4 py-1 sm:py-2"
          >
            <Share2 className="w-3 h-3 sm:w-4 sm:h-4" />
            <span>Share</span>
          </Button>
        </div>
      </div>

      {/* Hover Glow Effect */}
      <div
        className={cn(
          "absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none",
          "bg-gradient-to-r from-purple-500/5 to-pink-500/5",
        )}
      />
    </Card>
  )
}
