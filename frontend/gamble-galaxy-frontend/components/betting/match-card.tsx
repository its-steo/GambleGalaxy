"use client"

import { Card } from "@/components/ui/card"
import { Button } from "../ui/button"
import { Badge } from "../ui/badge"
import type { Match } from "@/lib/types"
import { Clock, Trophy } from "lucide-react"
import { cn } from "@/lib/utils"

interface MatchCardProps {
  match: Match
  onAddToBetSlip: (match: Match, option: "home_win" | "draw" | "away_win") => void
  selectedOptions: Record<number, "home_win" | "draw" | "away_win">
}

export function MatchCard({
  match,
  onAddToBetSlip,
  selectedOptions,
}: MatchCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "upcoming":
        return "bg-blue-500"
      case "first_half":
      case "second_half":
        return "bg-green-500"
      case "halftime":
        return "bg-yellow-500"
      case "fulltime":
        return "bg-gray-500"
      default:
        return "bg-gray-500"
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

  const isSelected = (option: "home_win" | "draw" | "away_win") =>
    selectedOptions[match.id] === option

  const canBet = match.status === "upcoming"

  return (
    <Card className="bg-gray-800 border border-gray-700 hover:border-purple-500 transition-colors rounded-2xl shadow-sm">
      <div className="p-4 pb-2 border-b border-gray-700 flex items-center justify-between">
        <div className="text-white font-medium text-sm flex items-center gap-2">
          <Trophy className="w-4 h-4 text-purple-400" />
          Match #{match.id}
        </div>
        <Badge className={cn("text-white text-xs", getStatusColor(match.status))}>
          {getStatusText(match.status)}
        </Badge>
      </div>

      <div className="px-6 py-4 space-y-4">
        {/* Teams & Score */}
        <div className="text-white space-y-2">
          <div className="flex justify-between items-center">
            <span className="truncate max-w-[60%] font-semibold">{match.home_team}</span>
            {match.status !== "upcoming" && (
              <span className="text-2xl font-bold">{match.score_home}</span>
            )}
          </div>
          <div className="text-center text-gray-400 text-sm">VS</div>
          <div className="flex justify-between items-center">
            <span className="truncate max-w-[60%] font-semibold">{match.away_team}</span>
            {match.status !== "upcoming" && (
              <span className="text-2xl font-bold">{match.score_away}</span>
            )}
          </div>
        </div>

        {/* Match Time */}
        <div className="flex items-center justify-center text-gray-400 text-xs">
          <Clock className="w-4 h-4 mr-1" />
          {new Date(match.match_time).toLocaleString()}
        </div>

        {/* Betting Options */}
        {canBet ? (
          <div className="grid grid-cols-3 gap-2">
            <Button
              variant={isSelected("home_win") ? "default" : "outline"}
              onClick={() => onAddToBetSlip(match, "home_win")}
              className={cn(
                "flex flex-col items-center justify-center p-3 h-auto text-center",
                isSelected("home_win")
                  ? "bg-purple-600 hover:bg-purple-700 text-white"
                  : "border-gray-600 hover:border-purple-500 text-gray-200",
              )}
            >
              <span className="text-[11px] text-gray-400 mb-1">Home Win</span>
              <span className="font-bold text-base">
                {parseFloat(match.odds_home_win).toFixed(2)}
              </span>
            </Button>

            <Button
              variant={isSelected("draw") ? "default" : "outline"}
              onClick={() => onAddToBetSlip(match, "draw")}
              className={cn(
                "flex flex-col items-center justify-center p-3 h-auto text-center",
                isSelected("draw")
                  ? "bg-purple-600 hover:bg-purple-700 text-white"
                  : "border-gray-600 hover:border-purple-500 text-gray-200",
              )}
            >
              <span className="text-[11px] text-gray-400 mb-1">Draw</span>
              <span className="font-bold text-base">
                {parseFloat(match.odds_draw).toFixed(2)}
              </span>
            </Button>

            <Button
              variant={isSelected("away_win") ? "default" : "outline"}
              onClick={() => onAddToBetSlip(match, "away_win")}
              className={cn(
                "flex flex-col items-center justify-center p-3 h-auto text-center",
                isSelected("away_win")
                  ? "bg-purple-600 hover:bg-purple-700 text-white"
                  : "border-gray-600 hover:border-purple-500 text-gray-200",
              )}
            >
              <span className="text-[11px] text-gray-400 mb-1">Away Win</span>
              <span className="font-bold text-base">
                {parseFloat(match.odds_away_win).toFixed(2)}
              </span>
            </Button>
          </div>
        ) : (
          <div className="text-center text-gray-500 py-4 text-sm font-medium">
            Betting closed for this match
          </div>
        )}
      </div>
    </Card>
  )
}
