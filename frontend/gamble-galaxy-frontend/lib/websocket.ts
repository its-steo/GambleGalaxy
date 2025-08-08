"use client"

import { create } from "zustand"
import { toast } from "sonner"
import type { WebSocketMessage, RecentCashout } from "./types"

interface BetInfo {
  id: number
  amount: number
  auto_cashout?: number
}

interface WebSocketState {
  socket: WebSocket | null
  isConnected: boolean
  currentMultiplier: number
  currentRoundId: number | null
  isRoundActive: boolean
  lastCrashMultiplier: number
  livePlayers: number
  recentCashouts: RecentCashout[]
  activeBets: Map<number, BetInfo>
  pastCrashes: number[]
  connect: () => void
  disconnect: () => void
  startRound: () => void
  cashOut: (userId: number, multiplier: number) => Promise<any>
  placeBet: (payload: { amount: number; user_id: number; auto_cashout?: number }) => Promise<any>
  setPastCrashes: (crashes: number[]) => void
  addCrashToHistory: (crashMultiplier: number) => void
}

export const useWebSocket = create<WebSocketState>((set, get) => ({
  socket: null,
  isConnected: false,
  currentMultiplier: 1.0,
  currentRoundId: null,
  isRoundActive: false,
  lastCrashMultiplier: 1.0,
  livePlayers: 0,
  recentCashouts: [],
  activeBets: new Map(),
  pastCrashes: [],

  setPastCrashes: (crashes: number[]) => {
    console.log("📊 Setting past crashes from API:", crashes)
    set({ pastCrashes: crashes })
  },

  addCrashToHistory: (crashMultiplier: number) => {
    const currentState = get()
    if (currentState.pastCrashes.length === 0 || currentState.pastCrashes[0] !== crashMultiplier) {
      const newPastCrashes = [crashMultiplier, ...currentState.pastCrashes].slice(0, 12)
      console.log("💥 Adding crash to history:", crashMultiplier, "New list:", newPastCrashes)
      set({ pastCrashes: newPastCrashes })
      return newPastCrashes
    }
    return currentState.pastCrashes
  },

  connect: () => {
    const state = get()
    if (state.socket?.readyState === WebSocket.OPEN) return

    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8000/ws/aviator/"
    const token = localStorage.getItem("access_token")
    
    console.log("🔌 Connecting to WebSocket:", wsUrl)

    const newSocket = new WebSocket(wsUrl)
    let pingInterval: NodeJS.Timeout

    newSocket.onopen = () => {
      console.log("✅ WebSocket connected successfully")
      set({ socket: newSocket, isConnected: true })

      pingInterval = setInterval(() => {
        if (newSocket.readyState === WebSocket.OPEN) {
          newSocket.send(JSON.stringify({ type: "ping" }))
        } else {
          clearInterval(pingInterval)
        }
      }, 30000)

      setTimeout(() => {
        if (newSocket.readyState === WebSocket.OPEN) {
          console.log("📡 Requesting initial game state")
          newSocket.send(JSON.stringify({ action: "get_game_state" }))
        }
      }, 500)
    }

    newSocket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        console.log("📨 WebSocket message received:", data)
        
        const currentState = get()

        switch (data.type) {
          case "betting_open":
            console.log("🎰 Betting phase opened", data)
            set({
              isRoundActive: false,
              currentMultiplier: 1.0,
              activeBets: new Map(),
              // ✅ FIXED: Set round ID when betting opens if provided
              currentRoundId: data.round_id || currentState.currentRoundId,
            })
            break

          case "round_started":
            console.log("🚀 Round started:", data.round_id)
            set({
              currentRoundId: data.round_id,
              currentMultiplier: data.multiplier || 1.0,
              isRoundActive: true,
              lastCrashMultiplier: 1.0,
            })
            break

          case "multiplier":
            set({
              currentMultiplier: data.multiplier || 1.0,
              currentRoundId: data.round_id || currentState.currentRoundId,
              isRoundActive: true,
            })
            break

          case "crash":
            console.log("💥 Round crashed at:", data.multiplier)
            const crashMultiplier = data.multiplier || data.crash_multiplier || 1.0
            
            const newPastCrashes = currentState.addCrashToHistory(crashMultiplier)
            
            set({
              isRoundActive: false,
              lastCrashMultiplier: crashMultiplier,
              currentMultiplier: crashMultiplier,
              // ✅ FIXED: Keep round ID after crash for next betting phase
            })
            
            playSound("crash")
            
            if (typeof window !== 'undefined') {
              window.dispatchEvent(new CustomEvent('planeCrashed', { 
                detail: { 
                  crashMultiplier,
                  pastCrashes: newPastCrashes
                } 
              }))
            }
            break

          case "bet_placed":
            console.log("✅ Bet placed successfully:", data)
            
            // Handle pending request resolution
            if (data.request_id && (window as any).pendingBetRequests) {
              const pendingRequest = (window as any).pendingBetRequests.get(data.request_id)
              if (pendingRequest) {
                clearTimeout(pendingRequest.timeout)
                pendingRequest.resolve(data)
                ;(window as any).pendingBetRequests.delete(data.request_id)
              }
            }
            
            // Store bet info for cashout
            if (data.bet_id && data.user_id) {
              const newBets = new Map(currentState.activeBets)
              newBets.set(data.user_id, {
                id: data.bet_id,
                amount: data.amount,
                auto_cashout: data.auto_cashout
              })
              set({ activeBets: newBets })
            }
            
            // ✅ FIXED: Update wallet balance immediately after bet placement
            if (typeof data.new_balance === "number" && typeof window !== 'undefined') {
              console.log("💰 Updating wallet balance from bet_placed:", data.new_balance)
              window.dispatchEvent(new CustomEvent('walletBalanceUpdate', { 
                detail: { balance: data.new_balance } 
              }))
            }
            break

          case "cash_out_success":
            console.log("💰 Cashout successful:", data)
            
            // Handle pending request resolution
            if (data.request_id && (window as any).pendingCashoutRequests) {
              const pendingRequest = (window as any).pendingCashoutRequests.get(data.request_id)
              if (pendingRequest) {
                clearTimeout(pendingRequest.timeout)
                pendingRequest.resolve(data)
                ;(window as any).pendingCashoutRequests.delete(data.request_id)
              }
            }
            
            // Remove bet from active bets
            if (data.user_id) {
              const newBets = new Map(currentState.activeBets)
              newBets.delete(data.user_id)
              set({ activeBets: newBets })
            }
            
            // ✅ FIXED: Update wallet balance immediately after cashout
            if (typeof data.new_balance === "number" && typeof window !== 'undefined') {
              console.log("💰 Updating wallet balance from cash_out_success:", data.new_balance)
              window.dispatchEvent(new CustomEvent('walletBalanceUpdate', { 
                detail: { balance: data.new_balance } 
              }))
            }
            break

          case "auto_cashout":
            console.log("🤖 Auto cashout triggered:", data)
            
            if (data.user_id) {
              const newBets = new Map(currentState.activeBets)
              newBets.delete(data.user_id)
              set({ activeBets: newBets })
            }
            
            // ✅ FIXED: Update wallet balance for auto cashout
            if (typeof data.new_balance === "number" && typeof window !== 'undefined') {
              console.log("💰 Updating wallet balance from auto_cashout:", data.new_balance)
              window.dispatchEvent(new CustomEvent('walletBalanceUpdate', { 
                detail: { balance: data.new_balance } 
              }))
            }
            break

          case "bet_lost":
            console.log("😞 Bet lost:", data)
            
            if (data.user_id) {
              const newBets = new Map(currentState.activeBets)
              newBets.delete(data.user_id)
              set({ activeBets: newBets })
            }
            break

          case "bet_error":
            console.error("❌ Bet placement failed:", data.message)
            
            // Handle pending request rejection
            if (data.request_id && (window as any).pendingBetRequests) {
              const pendingRequest = (window as any).pendingBetRequests.get(data.request_id)
              if (pendingRequest) {
                clearTimeout(pendingRequest.timeout)
                pendingRequest.reject(new Error(data.message || "Bet placement failed"))
                ;(window as any).pendingBetRequests.delete(data.request_id)
              }
            }
            
            // Update balance if provided in error response
            if (typeof data.balance === "number" && typeof window !== 'undefined') {
              console.log("💰 Updating wallet balance from bet_error:", data.balance)
              window.dispatchEvent(new CustomEvent('walletBalanceUpdate', { 
                detail: { balance: data.balance } 
              }))
            }
            break

          case "cashout_error":
            console.error("❌ Cashout failed:", data.message)
            
            if (data.request_id && (window as any).pendingCashoutRequests) {
              const pendingRequest = (window as any).pendingCashoutRequests.get(data.request_id)
              if (pendingRequest) {
                clearTimeout(pendingRequest.timeout)
                pendingRequest.reject(new Error(data.message || "Cashout failed"))
                ;(window as any).pendingCashoutRequests.delete(data.request_id)
              }
            }
            break

          case "round_summary":
            console.log("📊 Round summary:", data)
            break

          case "pong":
            break

          default:
            console.warn("⚠️ Unknown WebSocket message type:", data.type, data)
            break
        }
      } catch (error) {
        console.error("❌ Error parsing WebSocket message:", error, event.data)
      }
    }

    newSocket.onclose = (event) => {
      console.log("🔌 WebSocket disconnected:", event.code, event.reason)
      clearInterval(pingInterval)
      set({ socket: null, isConnected: false })

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
      const { socket, currentRoundId } = get()

      if (!socket || socket.readyState !== WebSocket.OPEN) {
        reject(new Error("WebSocket not connected"))
        return
      }

      if (!currentRoundId) {
        reject(new Error("No active round"))
        return
      }

      console.log("🎲 Placing bet:", payload)

      const requestId = `bet_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
      const timeout = setTimeout(() => {
        if ((window as any).pendingBetRequests) {
          (window as any).pendingBetRequests.delete(requestId)
        }
        reject(new Error("Bet placement timeout"))
      }, 10000)

      const pendingRequest = { resolve, reject, timeout }
    
      if (!(window as any).pendingBetRequests) {
        (window as any).pendingBetRequests = new Map()
      }
      (window as any).pendingBetRequests.set(requestId, pendingRequest)

      try {
        socket.send(
          JSON.stringify({
            action: "place_bet",
            request_id: requestId,
            round_id: currentRoundId,
            amount: payload.amount,
            auto_cashout: payload.auto_cashout,
          }),
        )
      } catch (error) {
        clearTimeout(timeout)
        if ((window as any).pendingBetRequests) {
          (window as any).pendingBetRequests.delete(requestId)
        }
        reject(error)
      }
    })
  },

  cashOut: async (userId: number, multiplier: number) => {
    return new Promise((resolve, reject) => {
      const { socket, activeBets } = get()

      if (!socket || socket.readyState !== WebSocket.OPEN) {
        reject(new Error("WebSocket not connected"))
        return
      }

      const betInfo = activeBets.get(userId)
      if (!betInfo) {
        reject(new Error("No active bet found"))
        return
      }

      console.log("💰 Cashing out bet:", betInfo.id, "at", multiplier)

      const requestId = `cashout_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
      const timeout = setTimeout(() => {
        if ((window as any).pendingCashoutRequests) {
          (window as any).pendingCashoutRequests.delete(requestId)
        }
        reject(new Error("Cashout timeout"))
      }, 5000)

      const pendingRequest = { resolve, reject, timeout }
    
      if (!(window as any).pendingCashoutRequests) {
        (window as any).pendingCashoutRequests = new Map()
      }
      (window as any).pendingCashoutRequests.set(requestId, pendingRequest)

      try {
        socket.send(
          JSON.stringify({
            action: "cashout",
            request_id: requestId,
            bet_id: betInfo.id,
            multiplier,
          }),
        )
      } catch (error) {
        clearTimeout(timeout)
        if ((window as any).pendingCashoutRequests) {
          (window as any).pendingCashoutRequests.delete(requestId)
        }
        reject(error)
      }
    })
  },
}))

async function playSound(type: "cashout" | "crash") {
  const soundMap: Record<string, string> = {
    crash: "/sounds/crash.mp3",
    cashout: "/sounds/cashout.mp3",
  }

  try {
    if (process.env.NODE_ENV === 'development') {
      console.log(`🔊 Would play ${type} sound: ${soundMap[type]}`)
      return
    }

    const response = await fetch(soundMap[type], { method: "HEAD" })
    if (!response.ok) {
      console.warn(`Sound file ${soundMap[type]} not found`)
      return
    }

    const audio = new Audio(soundMap[type])
    audio.volume = 0.3
    await audio.play()
  } catch (err) {
    console.warn(`Failed to play ${type} sound:`, err)
  }
}
