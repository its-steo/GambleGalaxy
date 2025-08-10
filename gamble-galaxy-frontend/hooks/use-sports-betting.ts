"use client"

import { useState, useEffect } from "react"
import { apiClient, API_ENDPOINTS } from "@/lib/api-client"
import { useNotifications } from "@/contexts/notification-context"
import type { Match, BetSelection, Bet } from "@/lib/types"

export function useSportsBetting() {
  const [matches, setMatches] = useState<Match[]>([])
  const [betHistory, setBetHistory] = useState<Bet[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const { addNotification } = useNotifications()

  useEffect(() => {
    fetchMatches()
    fetchBetHistory()
  }, [])

  const fetchMatches = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await apiClient.get<Match[]>(API_ENDPOINTS.MATCHES)

      if (response.success && response.data) {
        // Ensure all odds are numbers
        const processedMatches = response.data.map((match) => ({
          ...match,
          odds_home_win: Number(match.odds_home_win) || 0,
          odds_draw: Number(match.odds_draw) || 0,
          odds_away_win: Number(match.odds_away_win) || 0,
          odds_over_2_5: match.odds_over_2_5 ? Number(match.odds_over_2_5) : undefined,
          odds_under_2_5: match.odds_under_2_5 ? Number(match.odds_under_2_5) : undefined,
          odds_btts_yes: match.odds_btts_yes ? Number(match.odds_btts_yes) : undefined,
          odds_btts_no: match.odds_btts_no ? Number(match.odds_btts_no) : undefined,
        }))
        setMatches(processedMatches)
      } else {
        setError(response.error || "Failed to fetch matches")
        setMatches([])
      }
    } catch (error: any) {
      console.error("Failed to fetch matches:", error)
      setError(error.message || "Network error occurred")
      setMatches([])
    } finally {
      setLoading(false)
    }
  }

  const fetchBetHistory = async () => {
    try {
      const response = await apiClient.get<Bet[]>(API_ENDPOINTS.BET_HISTORY)

      if (response.success && response.data) {
        setBetHistory(response.data)
      } else {
        console.error("Failed to fetch bet history:", response.error)
        setBetHistory([])
      }
    } catch (error: any) {
      console.error("Failed to fetch bet history:", error)
      setBetHistory([])
    }
  }

  const placeBet = async (selections: BetSelection[], amount: number): Promise<boolean> => {
    try {
      if (amount <= 0) {
        addNotification({
          type: "error",
          title: "Invalid Amount",
          message: "Amount must be greater than 0",
        })
        return false
      }

      if (selections.length === 0) {
        addNotification({
          type: "error",
          title: "No Selections",
          message: "At least one selection is required",
        })
        return false
      }

      const response = await apiClient.post(API_ENDPOINTS.PLACE_BET, {
        amount,
        selections: selections.map((sel) => ({
          match_id: sel.match_id,
          selected_option: sel.selected_option,
          odds: sel.odds,
        })),
      })

      if (response.success) {
        addNotification({
          type: "success",
          title: "Bet Placed",
          message: "Your bet has been placed successfully",
        })
        await fetchBetHistory()
        return true
      } else {
        addNotification({
          type: "error",
          title: "Bet Failed",
          message: response.error || "Failed to place bet",
        })
        return false
      }
    } catch (error: any) {
      console.error("Failed to place bet:", error)
      addNotification({
        type: "error",
        title: "Bet Failed",
        message: error.message || "Network error occurred",
      })
      return false
    }
  }

  return {
    matches,
    betHistory,
    loading,
    error,
    placeBet,
    refreshMatches: fetchMatches,
    refreshBetHistory: fetchBetHistory,
  }
}
