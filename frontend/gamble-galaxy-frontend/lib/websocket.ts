// @/lib/websocket.ts
"use client"

import { create } from "zustand"
import type { WebSocketMessage } from "./types"

interface WebSocketState {
  socket: WebSocket | null
  isConnected: boolean
  currentMultiplier: number
  currentRoundId: number | null
  isRoundActive: boolean
  lastCrashMultiplier: number
  walletBalance: number
  livePlayers: any[]
  recentCashouts: any[]
  connect: () => void
  disconnect: () => void
  startRound: () => void
  cashOut: (userId: number, multiplier: number) => void
}

export const useWebSocket = create<WebSocketState>((set, get) => ({
  socket: null,
  isConnected: false,
  currentMultiplier: 1.0,
  currentRoundId: null,
  isRoundActive: false,
  lastCrashMultiplier: 1.0,
  walletBalance: 0.0,
  livePlayers: [],
  recentCashouts: [],

  connect: () => {
    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8000/ws/aviator/"
    const socket = new WebSocket(wsUrl)

    socket.onopen = () => {
      console.log("🟢 Connected to WebSocket")
      set({ socket, isConnected: true })
    }

    socket.onmessage = (event) => {
      const data: WebSocketMessage = JSON.parse(event.data)

      switch (data.type) {
        case "multiplier":
          set({
            currentMultiplier: data.multiplier || 1.0,
            currentRoundId: data.round_id || null,
            isRoundActive: true,
          })
          break

        case "crash":
          set({
            isRoundActive: false,
            lastCrashMultiplier: data.crash_multiplier || 1.0,
            currentMultiplier: data.crash_multiplier || 1.0,
          })
          playSound("crash")
          setTimeout(() => get().startRound(), 5000)
          break

        case "manual_cashout_success":
          console.log("✅ Cashout successful:", data.message)
          playSound("cashout")
          break

        case "manual_cashout_error":
          console.error("❌ Cashout error:", data.error)
          break

        case "balance_update":
          if (typeof data.balance === "number") {
            set({ walletBalance: data.balance })
          }
          break

        case "live_players":
          set({ livePlayers: data.players || [] })
          break

        case "recent_cashouts":
          set({ recentCashouts: data.cashouts || [] })
          break

        case "new_bet":
          console.log("🆕 New Bet Placed", data.bet)
          break

        default:
          console.warn("⚠️ Unknown WebSocket message type:", (data as { type?: string }).type)
          break
      }
    }

    socket.onclose = () => {
      console.log("🔌 WebSocket disconnected")
      set({ socket: null, isConnected: false })
      setTimeout(() => get().connect(), 3000)
    }

    socket.onerror = (error) => {
      console.error("🚨 WebSocket error:", error)
    }
  },

  disconnect: () => {
    const { socket } = get()
    if (socket) {
      socket.close()
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

  cashOut: (userId: number, multiplier: number) => {
    const { socket } = get()
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(
        JSON.stringify({
          action: "manual_cashout",
          user_id: userId,
          multiplier: multiplier,
        })
      )
    }
  },
}))

async function playSound(type: "cashout" | "crash") {
  const soundMap: Record<string, string> = {
    crash: "/sounds/crash.mp3",
    cashout: "/sounds/cashout.mp3",
  }
  try {
    // Check if file exists before playing
    const response = await fetch(soundMap[type], { method: "HEAD" })
    if (!response.ok) {
      console.warn(`Sound file ${soundMap[type]} not found`)
      return
    }
    const audio = new Audio(soundMap[type])
    await audio.play()
  } catch (err) {
    console.warn(`Failed to play ${type} sound:`, err)
  }
}