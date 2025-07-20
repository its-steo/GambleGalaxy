"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "../ui/button"
import { Badge } from "../ui/badge"
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
} from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

interface MatchCardProps {
  match: Match
  onAddToBetSlip: (match: Match, option: "home_win" | "draw" | "away_win") => void
  selectedOptions: Record<number, "home_win" | "draw" | "away_win">
}

export function MatchCard({ match, onAddToBetSlip, selectedOptions }: MatchCardProps) {
  const [isHovered, setIsHovered] = useState(false)
  const [pulseAnimation, setPulseAnimation] = useState(false)
  const [liveViewers] = useState(Math.floor(Math.random() * 5000) + 1000)

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
      case "first_half":
      case "second_half":
        return "from-green-500 to-emerald-500"
      case "halftime":
        return "from-yellow-500 to-orange-500"
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
      case "first_half":
        return "1st Half"
      case "second_half":
        return "2nd Half"
      case "halftime":
        return "Half Time"
      case "fulltime":
        return "Full Time"
      default:
        return status
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "upcoming":
        return <Calendar className="w-3 h-3" />
      case "first_half":
      case "second_half":
        return <Zap className="w-3 h-3" />
      case "halftime":
        return <Clock className="w-3 h-3" />
      case "fulltime":
        return <Trophy className="w-3 h-3" />
      default:
        return <Clock className="w-3 h-3" />
    }
  }

  const getOptionGradient = (option: "home_win" | "draw" | "away_win") => {
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

  const isSelected = (option: "home_win" | "draw" | "away_win") => selectedOptions[match.id] === option

  const canBet = match.status === "upcoming"
  const isLive = match.status === "first_half" || match.status === "second_half"

  const handleAddToBetSlip = (option: "home_win" | "draw" | "away_win") => {
    onAddToBetSlip(match, option)
    toast.success("Added to bet slip! 🎯", {
      description: `${match.home_team} vs ${match.away_team} - ${option.replace("_", " ")}`,
      className: "bg-green-500/90 text-white border-green-400",
    })
  }

  const handleShare = () => {
    const shareText = `🏆 ${match.home_team} vs ${match.away_team}
    
📊 Odds:
🏠 ${match.home_team}: ${match.odds_home_win}
⚖️ Draw: ${match.odds_draw}
✈️ ${match.away_team}: ${match.odds_away_win}

⏰ ${new Date(match.match_time).toLocaleString()}
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

  const getBestOdds = () => {
    const odds = [
      Number.parseFloat(match.odds_home_win),
      Number.parseFloat(match.odds_draw),
      Number.parseFloat(match.odds_away_win),
    ]
    return Math.max(...odds)
  }

  return (
    <Card
      className={cn(
        "bg-white/5 backdrop-blur-sm border border-white/10 hover:border-white/20 rounded-xl sm:rounded-2xl overflow-hidden transition-all duration-500 hover:scale-105 hover:shadow-2xl group w-full",
        pulseAnimation && "animate-pulse",
        isLive && "ring-2 ring-green-400/50 ring-pulse",
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
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
                {match.status !== "upcoming" ? (
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
                    <div className="text-xs text-gray-400">Upcoming</div>
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
            <span className="text-center sm:text-left">{new Date(match.match_time).toLocaleString()}</span>
          </div>
          <div className="hidden sm:block w-1 h-1 bg-gray-400 rounded-full" />
          <div className="flex items-center space-x-1 sm:space-x-2">
            <MapPin className="w-3 h-3 sm:w-4 sm:h-4 text-blue-400" />
            <span>Stadium</span>
          </div>
        </div>

        {/* Enhanced Betting Options */}
        {canBet ? (
          <div className="space-y-3 sm:space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-white font-semibold flex items-center text-sm sm:text-base">
                <Target className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2 text-purple-400" />
                Betting Odds
              </h3>
              <div className="flex items-center text-xs text-gray-400">
                <TrendingUp className="w-2.5 h-2.5 sm:w-3 sm:h-3 mr-1" />
                Live odds
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 sm:gap-3">
              {(["home_win", "draw", "away_win"] as const).map((option) => {
                const labels = {
                  home_win: "Home Win",
                  draw: "Draw",
                  away_win: "Away Win",
                }
                const odds = {
                  home_win: match.odds_home_win,
                  draw: match.odds_draw,
                  away_win: match.odds_away_win,
                }

                const selected = isSelected(option)

                return (
                  <Button
                    key={option}
                    variant="ghost"
                    onClick={() => handleAddToBetSlip(option)}
                    className={cn(
                      "relative flex flex-col items-center justify-center p-2 sm:p-4 h-auto text-center transition-all duration-300 hover:scale-105 rounded-lg sm:rounded-2xl overflow-hidden group/btn",
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
                      <span className="text-xs text-gray-400 mb-1 sm:mb-2 block">{labels[option]}</span>
                      <div className="flex items-center justify-center space-x-0.5 sm:space-x-1">
                        {selected && <Star className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-yellow-400" />}
                        <span className="font-bold text-sm sm:text-lg">
                          {Number.parseFloat(odds[option]).toFixed(2)}
                        </span>
                      </div>
                      {Number.parseFloat(odds[option]) > 3 && (
                        <div className="flex items-center justify-center mt-0.5 sm:mt-1">
                          <Sparkles className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-yellow-400" />
                        </div>
                      )}
                    </div>
                  </Button>
                )
              })}
            </div>

            {/* Odds Summary */}
            <div className="bg-gradient-to-r from-gray-900/50 to-gray-800/50 backdrop-blur-sm rounded-lg sm:rounded-xl p-2 sm:p-3 border border-white/10">
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-400">Best Odds:</span>
                <div className="flex items-center space-x-1">
                  <TrendingUp className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-green-400" />
                  <span className="text-green-400 font-bold">{getBestOdds().toFixed(2)}</span>
                </div>
              </div>
            </div>
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
