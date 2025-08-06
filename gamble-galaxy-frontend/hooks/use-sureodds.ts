"use client"

import { useState, useEffect } from "react"
import { apiClient, API_ENDPOINTS } from "@/lib/api-client"
import { useNotifications } from "@/contexts/notification-context"
import type { SureOddsMatch, SureOddsBet, SureOddsStats } from "@/lib/types"

export function useSureOdds() {
  const [matches, setMatches] = useState<SureOddsMatch[]>([])
  const [liveMatches, setLiveMatches] = useState<SureOddsMatch[]>([])
  const [upcomingMatches, setUpcomingMatches] = useState<SureOddsMatch[]>([])
  const [betHistory, setBetHistory] = useState<SureOddsBet[]>([])
  const [stats, setStats] = useState<SureOddsStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const { addNotification } = useNotifications()

  useEffect(() => {
    fetchAllData()
  }, [])

  const fetchAllData = async () => {
    await Promise.all([fetchMatches(), fetchLiveMatches(), fetchUpcomingMatches(), fetchBetHistory(), fetchStats()])
  }

  const fetchMatches = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await apiClient.get<SureOddsMatch[]>(API_ENDPOINTS.SUREODDS_MATCHES)

      if (response.success && response.data) {
        // Ensure all odds are numbers
        const processedMatches = response.data.map((match) => ({
          ...match,
          home_odds: Number(match.home_odds) || 0,
          draw_odds: Number(match.draw_odds) || 0,
          away_odds: Number(match.away_odds) || 0,
          over_2_5_odds: match.over_2_5_odds ? Number(match.over_2_5_odds) : undefined,
          under_2_5_odds: match.under_2_5_odds ? Number(match.under_2_5_odds) : undefined,
          btts_yes_odds: match.btts_yes_odds ? Number(match.btts_yes_odds) : undefined,
          btts_no_odds: match.btts_no_odds ? Number(match.btts_no_odds) : undefined,
        }))
        setMatches(processedMatches)
      } else {
        setError(response.error || "Failed to fetch SureOdds matches")
        setMatches([])
      }
    } catch (error: any) {
      console.error("Failed to fetch SureOdds matches:", error)
      setError(error.message || "Network error occurred")
      setMatches([])
    } finally {
      setLoading(false)
    }
  }

  const fetchLiveMatches = async () => {
    try {
      const response = await apiClient.get<SureOddsMatch[]>(API_ENDPOINTS.SUREODDS_LIVE_MATCHES)

      if (response.success && response.data) {
        const processedMatches = response.data.map((match) => ({
          ...match,
          home_odds: Number(match.home_odds) || 0,
          draw_odds: Number(match.draw_odds) || 0,
          away_odds: Number(match.away_odds) || 0,
          over_2_5_odds: match.over_2_5_odds ? Number(match.over_2_5_odds) : undefined,
          under_2_5_odds: match.under_2_5_odds ? Number(match.under_2_5_odds) : undefined,
          btts_yes_odds: match.btts_yes_odds ? Number(match.btts_yes_odds) : undefined,
          btts_no_odds: match.btts_no_odds ? Number(match.btts_no_odds) : undefined,
        }))
        setLiveMatches(processedMatches)
      } else {
        console.error("Failed to fetch live matches:", response.error)
        setLiveMatches([])
      }
    } catch (error: any) {
      console.error("Failed to fetch live matches:", error)
      setLiveMatches([])
    }
  }

  const fetchUpcomingMatches = async () => {
    try {
      const response = await apiClient.get<SureOddsMatch[]>(API_ENDPOINTS.SUREODDS_UPCOMING_MATCHES)

      if (response.success && response.data) {
        const processedMatches = response.data.map((match) => ({
          ...match,
          home_odds: Number(match.home_odds) || 0,
          draw_odds: Number(match.draw_odds) || 0,
          away_odds: Number(match.away_odds) || 0,
          over_2_5_odds: match.over_2_5_odds ? Number(match.over_2_5_odds) : undefined,
          under_2_5_odds: match.under_2_5_odds ? Number(match.under_2_5_odds) : undefined,
          btts_yes_odds: match.btts_yes_odds ? Number(match.btts_yes_odds) : undefined,
          btts_no_odds: match.btts_no_odds ? Number(match.btts_no_odds) : undefined,
        }))
        setUpcomingMatches(processedMatches)
      } else {
        console.error("Failed to fetch upcoming matches:", response.error)
        setUpcomingMatches([])
      }
    } catch (error: any) {
      console.error("Failed to fetch upcoming matches:", error)
      setUpcomingMatches([])
    }
  }

  const fetchBetHistory = async () => {
    try {
      const response = await apiClient.get<SureOddsBet[]>(API_ENDPOINTS.SUREODDS_BET_HISTORY)

      if (response.success && response.data) {
        setBetHistory(response.data)
      } else {
        console.error("Failed to fetch SureOdds bet history:", response.error)
        setBetHistory([])
      }
    } catch (error: any) {
      console.error("Failed to fetch SureOdds bet history:", error)
      setBetHistory([])
    }
  }

  const fetchStats = async () => {
    try {
      const response = await apiClient.get<SureOddsStats>(API_ENDPOINTS.SUREODDS_STATS)

      if (response.success && response.data) {
        setStats(response.data)
      } else {
        console.error("Failed to fetch SureOdds stats:", response.error)
        setStats(null)
      }
    } catch (error: any) {
      console.error("Failed to fetch SureOdds stats:", error)
      setStats(null)
    }
  }

  const placeBet = async (matchId: number, betType: string, odds: number, amount: number): Promise<boolean> => {
    try {
      if (amount <= 0) {
        addNotification({
          type: "error",
          title: "Invalid Amount",
          message: "Amount must be greater than 0",
        })
        return false
      }

      const response = await apiClient.post(API_ENDPOINTS.SUREODDS_PLACE_BET, {
        match_id: matchId,
        bet_type: betType,
        odds: odds,
        amount: amount,
      })

      if (response.success) {
        addNotification({
          type: "success",
          title: "SureOdds Bet Placed",
          message: "Your SureOdds bet has been placed successfully",
        })
        await fetchBetHistory()
        return true
      } else {
        addNotification({
          type: "error",
          title: "SureOdds Bet Failed",
          message: response.error || "Failed to place SureOdds bet",
        })
        return false
      }
    } catch (error: any) {
      console.error("Failed to place SureOdds bet:", error)
      addNotification({
        type: "error",
        title: "SureOdds Bet Failed",
        message: error.message || "Network error occurred",
      })
      return false
    }
  }

  return {
    matches,
    liveMatches,
    upcomingMatches,
    betHistory,
    stats,
    loading,
    error,
    placeBet,
    refreshMatches: fetchMatches,
    refreshLiveMatches: fetchLiveMatches,
    refreshUpcomingMatches: fetchUpcomingMatches,
    refreshBetHistory: fetchBetHistory,
    refreshStats: fetchStats,
    refreshAll: fetchAllData,
  }
}
