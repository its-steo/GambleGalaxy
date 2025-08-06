"use client"

import { create } from "zustand"
import { toast } from "sonner"
import type { WebSocketMessage, RecentCashout } from "./types"

interface WebSocketState {
  socket: WebSocket | null
  isConnected: boolean
  currentMultiplier: number
  currentRoundId: number | null
  isRoundActive: boolean
  lastCrashMultiplier: number
  walletBalance: number
  livePlayers: number
  recentCashouts: RecentCashout[]
  connect: () => void
  disconnect: () => void
  startRound: () => void
  cashOut: (userId: number, multiplier: number) => Promise<void>
  placeBet: (payload: { amount: number; user_id: number; auto_cashout?: number }) => Promise<void>
}

export const useWebSocket = create<WebSocketState>((set, get) => ({
  socket: null,
  isConnected: false,
  currentMultiplier: 1.0,
  currentRoundId: null,
  isRoundActive: false,
  lastCrashMultiplier: 1.0,
  walletBalance: 0.0,
  livePlayers: 0,
  recentCashouts: [],

  connect: () => {
    const state = get()
    if (state.socket?.readyState === WebSocket.OPEN) return

    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8000/ws/aviator/"
    const token = localStorage.getItem("access_token")
    const url = token ? `${wsUrl}?token=${token}` : wsUrl

    const newSocket = new WebSocket(url)
    let pingInterval: NodeJS.Timeout

    newSocket.onopen = () => {
      console.log("🔌 WebSocket connected")
      set({ socket: newSocket, isConnected: true })

      // Setup ping interval
      pingInterval = setInterval(() => {
        if (newSocket.readyState === WebSocket.OPEN) {
          newSocket.send(JSON.stringify({ type: "ping" }))
        } else {
          clearInterval(pingInterval)
        }
      }, 30000)

      // Request initial game state
      setTimeout(() => {
        if (newSocket.readyState === WebSocket.OPEN) {
          newSocket.send(JSON.stringify({ type: "get_game_state" }))
        }
      }, 100)
    }

    newSocket.onmessage = (event) => {
      try {
        const data: WebSocketMessage = JSON.parse(event.data)
        const currentState = get()

        switch (data.type) {
          case "game_state":
            // Batch all game state updates into a single set call
            set({
              currentRoundId: data.round_id ?? currentState.currentRoundId,
              currentMultiplier: data.multiplier ?? 1.0,
              isRoundActive: data.is_active ?? false,
              livePlayers: data.live_players?.length ?? data.count ?? 0,
              recentCashouts: data.recent_cashouts ?? currentState.recentCashouts,
            })
            break

          case "round_started":
            set({
              currentRoundId: data.round_id ?? currentState.currentRoundId,
              currentMultiplier: 1.0,
              isRoundActive: true,
              lastCrashMultiplier: 1.0,
            })
            break

          case "multiplier":
            // Use current state values to avoid calling get() inside set()
            set({
              currentMultiplier: data.multiplier ?? 1.0,
              currentRoundId: data.round_id ?? currentState.currentRoundId,
              isRoundActive: true,
              livePlayers: data.live_players?.length ?? currentState.livePlayers,
            })
            break

          case "crash":
            const crashMultiplier = data.crash_multiplier ?? 1.0
            set({
              isRoundActive: false,
              lastCrashMultiplier: crashMultiplier,
              currentMultiplier: crashMultiplier,
            })
            playSound("crash")
            break

          case "bet_placed":
            // Only update balance if provided
            if (typeof data.new_balance === "number") {
              set({ walletBalance: data.new_balance })
            }
            toast.success("Bet Placed!", {
              description: `KES ${data.amount} bet placed successfully`,
            })
            break

          case "bet_error":
            // Restore original balance if provided
            if (typeof data.original_balance === "number") {
              set({ walletBalance: data.original_balance })
            }
            toast.error("Bet Failed", {
              description: data.message || "Could not place bet",
            })
            break

          case "cash_out_success":
            if (typeof data.new_balance === "number") {
              set({ walletBalance: data.new_balance })
            }
            toast.success("Cashed Out!", {
              description: `Won KES ${data.win_amount?.toFixed(2)} at ${data.multiplier?.toFixed(2)}x`,
            })
            playSound("cashout")
            break

          case "cash_out_error":
            toast.error("Cashout Failed", {
              description: data.message || data.error || "Could not cash out",
            })
            break

          case "player_cashed_out":
            // Use provided cashouts or keep current ones
            if (data.recent_cashouts) {
              set({ recentCashouts: data.recent_cashouts })
            }
            break

          case "balance_update":
            if (typeof data.balance === "number") {
              set({ walletBalance: data.balance })
            }
            break

          case "live_players":
            set({ livePlayers: data.players?.length ?? data.count ?? 0 })
            break

          case "recent_cashouts":
            if (data.cashouts) {
              set({ recentCashouts: data.cashouts })
            }
            break

          case "new_bet":
            console.log("🆕 New Bet Placed", data.bet)
            break

          case "pong":
            // Silent acknowledgment
            break

          default:
            console.warn("⚠️ Unknown WebSocket message type:", data.type)
            break
        }
      } catch (error) {
        console.error("❌ Error parsing WebSocket message:", error)
      }
    }

    newSocket.onclose = (event) => {
      console.log("🔌 WebSocket disconnected", event.code)
      clearInterval(pingInterval)
      set({ socket: null, isConnected: false })

      // Auto-reconnect unless it was a clean close
      if (event.code !== 1000) {
        console.log("🔄 Attempting to reconnect in 3 seconds...")
        setTimeout(() => {
          const currentState = get()
          if (!currentState.isConnected) {
            currentState.connect()
          }
        }, 3000)
      }
    }

    newSocket.onerror = (error) => {
      console.error("🚨 WebSocket error:", error)
      toast.error("Connection Error", {
        description: "Lost connection to game server. Attempting to reconnect...",
      })
    }
  },

  disconnect: () => {
    const { socket } = get()
    if (socket) {
      socket.close(1000, "User disconnected")
      set({ socket: null, isConnected: false })
    }
  },

  startRound: () => {
    const { socket } = get()
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({ action: "start_round" }))
      set({ currentMultiplier: 1.0, isRoundActive: true })
    }
  },

  placeBet: async (payload: { amount: number; user_id: number; auto_cashout?: number }) => {
    return new Promise((resolve, reject) => {
      const { socket, walletBalance } = get()

      if (!socket || socket.readyState !== WebSocket.OPEN) {
        reject(new Error("WebSocket not connected"))
        return
      }

      // Optimistically update balance
      const newBalance = Math.max(0, walletBalance - payload.amount)
      set({ walletBalance: newBalance })

      // Set timeout for bet placement
      const timeout = setTimeout(() => {
        // Restore balance on timeout
        set({ walletBalance })
        reject(new Error("Bet placement timeout"))
      }, 10000)

      try {
        socket.send(
          JSON.stringify({
            type: "place_bet",
            action: "place_bet",
            ...payload,
          }),
        )

        clearTimeout(timeout)
        resolve()
      } catch (error) {
        clearTimeout(timeout)
        // Restore balance on error
        set({ walletBalance })
        reject(error)
      }
    })
  },

  cashOut: async (userId: number, multiplier: number) => {
    return new Promise((resolve, reject) => {
      const { socket } = get()

      if (!socket || socket.readyState !== WebSocket.OPEN) {
        reject(new Error("WebSocket not connected"))
        return
      }

      try {
        socket.send(
          JSON.stringify({
            type: "cash_out",
            action: "manual_cashout",
            user_id: userId,
            multiplier,
          }),
        )
        resolve()
      } catch (error) {
        reject(error)
      }
    })
  },
}))

// Sound utility function
async function playSound(type: "cashout" | "crash") {
  const soundMap: Record<string, string> = {
    crash: "/sounds/crash.mp3",
    cashout: "/sounds/cashout.mp3",
  }

  try {
    const response = await fetch(soundMap[type], { method: "HEAD" })
    if (!response.ok) {
      console.warn(`Sound file ${soundMap[type]} not found`)
      return
    }

    const audio = new Audio(soundMap[type])
    audio.volume = 0.5 // Set reasonable volume
    await audio.play()
  } catch (err) {
    console.warn(`Failed to play ${type} sound:`, err)
  }
}