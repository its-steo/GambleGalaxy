"use client"

import { useState, useEffect, useRef } from "react"
import { useNotifications } from "@/contexts/notification-context"
import { useWalletBalance } from "@/hooks/use-wallet-balance"
import { apiClient, API_ENDPOINTS, WS_ENDPOINTS } from "@/lib/api-client"
import type { AviatorGameState, AviatorBet, AviatorRound } from "@/lib/types"

export function useAviatorGame() {
  const [gameState, setGameState] = useState<AviatorGameState>({
    round_id: null,
    multiplier: 1.0,
    is_active: false,
    phase: "betting",
    live_players: 0,
  })

  const [activeBets, setActiveBets] = useState<AviatorBet[]>([])
  const [pastCrashes, setPastCrashes] = useState<number[]>([])
  const [isConnected, setIsConnected] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<"connecting" | "connected" | "disconnected">("connecting")

  const { addNotification } = useNotifications()
  const { refreshBalance } = useWalletBalance()
  const wsRef = useRef<WebSocket | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const reconnectAttempts = useRef(0)

  useEffect(() => {
    connectWebSocket()
    fetchPastCrashes()

    return () => {
      if (wsRef.current) {
        wsRef.current.close()
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
      }
    }
  }, [])

  const connectWebSocket = () => {
    try {
      // Only try to connect if we have a token (user is authenticated)
      const token = localStorage.getItem("access_token")
      if (!token) {
        console.log("No access token found, skipping Aviator WebSocket connection")
        setConnectionStatus("disconnected")
        return
      }

      const wsUrl = `${WS_ENDPOINTS.AVIATOR}?token=${token}`
      console.log("Connecting to Aviator WebSocket:", wsUrl)

      wsRef.current = new WebSocket(wsUrl)
      setConnectionStatus("connecting")

      wsRef.current.onopen = () => {
        console.log("Aviator WebSocket connected")
        setIsConnected(true)
        setConnectionStatus("connected")
        reconnectAttempts.current = 0

        // Request current game state
        wsRef.current?.send(
          JSON.stringify({
            action: "get_game_state",
          }),
        )
      }

      wsRef.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          handleWebSocketMessage(data)
        } catch (error) {
          console.error("Error parsing Aviator WebSocket message:", error)
        }
      }

      wsRef.current.onclose = (event) => {
        console.log("Aviator WebSocket disconnected:", event.code, event.reason)
        setIsConnected(false)
        setConnectionStatus("disconnected")

        // Only attempt to reconnect if it wasn't a clean close and we haven't exceeded max attempts
        if (event.code !== 1000 && reconnectAttempts.current < 5) {
          reconnectAttempts.current++
          const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 30000)
          console.log(`Attempting to reconnect Aviator WebSocket in ${delay}ms... (${reconnectAttempts.current}/5)`)

          reconnectTimeoutRef.current = setTimeout(() => {
            connectWebSocket()
          }, delay)
        }
      }

      wsRef.current.onerror = (error) => {
        console.log("Aviator WebSocket error occurred:", error)
        setConnectionStatus("disconnected")
        setIsConnected(false)
      }
    } catch (error) {
      console.error("Failed to create Aviator WebSocket connection:", error)
      setConnectionStatus("disconnected")
      setIsConnected(false)
    }
  }

  const handleWebSocketMessage = (data: any) => {
    switch (data.type) {
      case "betting_open":
        setGameState((prev) => ({
          ...prev,
          phase: "betting",
          round_id: data.round_id?.toString() || null,
          countdown: data.countdown,
          multiplier: 1.0,
          is_active: false,
        }))
        setActiveBets([])
        break

      case "round_started":
        setGameState((prev) => ({
          ...prev,
          phase: "flying",
          is_active: true,
          multiplier: data.multiplier || 1.0,
          countdown: 0,
        }))
        break

      case "multiplier":
        setGameState((prev) => ({
          ...prev,
          multiplier: data.multiplier,
          live_players: data.live_players || prev.live_players,
        }))
        break

      case "crash":
        setGameState((prev) => ({
          ...prev,
          phase: "crashed",
          is_active: false,
          multiplier: data.crash_multiplier,
        }))

        setPastCrashes((prev) => [data.crash_multiplier, ...prev.slice(0, 19)])

        setActiveBets((prev) => prev.map((bet) => (bet.status === "active" ? { ...bet, status: "lost" } : bet)))

        addNotification({
          type: "info",
          title: "Round Ended",
          message: `Plane crashed at ${data.crash_multiplier?.toFixed(2)}x`,
        })
        break

      case "bet_placed":
        if (data.bet_id) {
          const newBet: AviatorBet = {
            id: data.bet_id.toString(),
            amount: data.amount,
            auto_cashout: data.auto_cashout,
            status: "active",
            bet_number: data.bet_number,
          }
          setActiveBets((prev) => [...prev, newBet])

          addNotification({
            type: "success",
            title: "Bet Placed",
            message: `Bet of KES ${data.amount} placed successfully`,
          })
          refreshBalance()
        }
        break

      case "manual_cashout_success":
        setActiveBets((prev) =>
          prev.map((bet) =>
            bet.id === data.bet_id?.toString() ? { ...bet, status: "cashed_out", multiplier: data.multiplier } : bet,
          ),
        )

        addNotification({
          type: "success",
          title: "Cashout Successful",
          message: `Won KES ${data.win_amount} at ${data.multiplier?.toFixed(2)}x`,
        })
        refreshBalance()
        break

      case "game_state":
        setGameState((prev) => ({
          ...prev,
          round_id: data.round_id?.toString() || null,
          multiplier: data.multiplier || 1.0,
          is_active: data.is_active || false,
          phase: data.is_active ? "flying" : "betting",
          live_players: data.live_players || 0,
        }))
        break

      case "bet_error":
      case "manual_cashout_error":
        addNotification({
          type: "error",
          title: "Error",
          message: data.message || "An error occurred",
        })
        break

      default:
        console.log("Unhandled message type:", data.type)
    }
  }

  const fetchPastCrashes = async () => {
    try {
      const response = await apiClient.get<AviatorRound[]>(API_ENDPOINTS.AVIATOR_HISTORY)
      if (response.success && response.data) {
        const crashes = response.data.map((round) => round.crash_multiplier).slice(0, 20)
        setPastCrashes(crashes)
      }
    } catch (error) {
      console.error("Failed to fetch past crashes:", error)
    }
  }

  const placeBet = async (amount: number, autoCashout?: number, betNumber = 1) => {
    if (!wsRef.current || !isConnected) {
      addNotification({
        type: "error",
        title: "Connection Error",
        message: "Not connected to game server",
      })
      return false
    }

    if (!gameState.round_id) {
      addNotification({
        type: "error",
        title: "No Active Round",
        message: "Wait for the next round to start",
      })
      return false
    }

    try {
      wsRef.current.send(
        JSON.stringify({
          action: "place_bet",
          round_id: gameState.round_id,
          amount: amount,
          auto_cashout: autoCashout,
          bet_number: betNumber,
        }),
      )
      return true
    } catch (error) {
      console.error("Failed to place bet:", error)
      addNotification({
        type: "error",
        title: "Bet Failed",
        message: "Failed to place bet",
      })
      return false
    }
  }

  const cashOut = async (betId: string) => {
    if (!wsRef.current || !isConnected) {
      addNotification({
        type: "error",
        title: "Connection Error",
        message: "Not connected to game server",
      })
      return false
    }

    try {
      wsRef.current.send(
        JSON.stringify({
          action: "cashout",
          bet_id: betId,
          multiplier: gameState.multiplier,
        }),
      )
      return true
    } catch (error) {
      console.error("Failed to cash out:", error)
      addNotification({
        type: "error",
        title: "Cashout Failed",
        message: "Failed to cash out bet",
      })
      return false
    }
  }

  return {
    gameState,
    activeBets,
    pastCrashes,
    isConnected,
    connectionStatus,
    placeBet,
    cashOut,
    refreshBalance,
  }
}
