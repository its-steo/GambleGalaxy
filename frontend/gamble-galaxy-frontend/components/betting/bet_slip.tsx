"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "../ui/input"
import { Badge } from "../ui/badge"
import { X, Calculator, DollarSign } from "lucide-react"
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
  const { user } = useAuth()

  const getOdds = (item: BetSlipItem) => {
    switch (item.selectedOption) {
      case "home_win":
        return parseFloat(item.match.odds_home_win)
      case "draw":
        return parseFloat(item.match.odds_draw)
      case "away_win":
        return parseFloat(item.match.odds_away_win)
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

  const totalOdds = items.reduce((acc, item) => acc * getOdds(item), 1)
  const potentialWin = parseFloat(betAmount) * totalOdds

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

    setIsPlacing(true)

    try {
      const betData = {
        amount: parseFloat(betAmount),
        selections: items.map((item) => ({
          match_id: item.match.id,
          selected_option: item.selectedOption,
        })),
      }

      const response = await api.placeBet(betData)

      if (response.data) {
        toast.success("Bet placed successfully!", {
          description: `Bet ID: #${response.data.id}`,
        })
        onClearAll()
        setBetAmount("10")
      } else {
        toast.error("Failed to place bet", {
          description: response.error || "Please try again",
        })
      }
    } catch (error) {
      toast.error("Error placing bet", {
        description: "Please check your connection and try again",
      })
    } finally {
      setIsPlacing(false)
    }
  }

  if (items.length === 0) {
    return (
      <Card className="bg-gray-800 border-gray-700">
        <div className="p-4 border-b border-gray-700">
          <div className="text-white flex items-center text-lg font-semibold">
            <Calculator className="w-5 h-5 mr-2" />
            Bet Slip
          </div>
        </div>
        <div className="p-4">
          <div className="text-center text-gray-400 py-8">
            <Calculator className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Your bet slip is empty</p>
            <p className="text-sm">Click on odds to add selections</p>
          </div>
        </div>
      </Card>
    )
  }

  return (
    <Card className="bg-gray-800 border-gray-700">
      <div className="p-4 border-b border-gray-700">
        <div className="flex items-center justify-between">
          <div className="text-white flex items-center text-lg font-semibold">
            <Calculator className="w-5 h-5 mr-2" />
            Bet Slip ({items.length})
          </div>
          <Button variant="ghost" onClick={onClearAll} className="text-gray-400 hover:text-white">
            Clear All
          </Button>
        </div>
      </div>

      <div className="space-y-4 p-4">
        <div className="space-y-3">
          {items.map((item) => (
            <div key={item.match.id} className="bg-gray-700 rounded-lg p-3">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <div className="text-white font-medium text-sm">
                    {item.match.home_team} vs {item.match.away_team}
                  </div>
                  <div className="flex items-center space-x-2 mt-1">
                    <Badge variant="primary" className="text-xs">
                      {getOptionText(item.selectedOption)}
                    </Badge>
                    <span className="text-green-400 font-bold">{getOdds(item).toFixed(2)}</span>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  onClick={() => onRemoveItem(item.match.id)}
                  className="text-gray-400 hover:text-red-400 p-1"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Bet Amount (KES)</label>
          <Input
            type="number"
            value={betAmount}
            onChange={(e) => setBetAmount(e.target.value)}
            className="bg-gray-700 border-gray-600 text-white"
            min="1"
            step="0.01"
          />
        </div>

        <div className="bg-gray-700 rounded-lg p-3 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Total Odds:</span>
            <span className="text-white font-bold">{totalOdds.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Stake:</span>
            <span className="text-white">KES {parseFloat(betAmount).toFixed(2)}</span>
          </div>
          <div className="flex justify-between border-t border-gray-600 pt-2">
            <span className="text-gray-400">Potential Win:</span>
            <span className="text-green-400 font-bold">KES {potentialWin.toFixed(2)}</span>
          </div>
        </div>

        <Button
          onClick={handlePlaceBet}
          disabled={isPlacing || !user}
          className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800"
        >
          {isPlacing ? (
            "Placing Bet..."
          ) : (
            <>
              <DollarSign className="w-4 h-4 mr-2" />
              Place Bet
            </>
          )}
        </Button>

        {!user && <p className="text-center text-gray-400 text-sm">Please login to place bets</p>}
      </div>
    </Card>
  )
}
