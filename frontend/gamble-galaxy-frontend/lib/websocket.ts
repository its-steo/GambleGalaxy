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

  connect: () => {
    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8000/ws/aviator/"
    const socket = new WebSocket(wsUrl)

    socket.onopen = () => {
      console.log("🚀 WebSocket connected to Aviator game")
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
          // Auto-start next round after 5 seconds
          setTimeout(() => {
            get().startRound()
          }, 5000)
          break
        case "manual_cashout_success":
          console.log("✅ Cashout successful:", data.message)
          break
        case "manual_cashout_error":
          console.error("❌ Cashout error:", data.error)
          break
      }
    }

    socket.onclose = () => {
      console.log("🔌 WebSocket disconnected")
      set({ socket: null, isConnected: false })
      // Auto-reconnect after 3 seconds
      setTimeout(() => {
        get().connect()
      }, 3000)
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
        }),
      )
    }
  },
}))
