"use client"

import { create } from "zustand"
import { toast } from "sonner"
import type { WebSocketMessage, RecentCashout } from "./types"

interface BetInfo {
  id: number
  amount: number
  auto_cashout?: number
  username?: string
  is_bot?: boolean
  placed_at?: number // Timestamp when bet was placed
}

interface WebSocketState {
  socket: WebSocket | null
  isConnected: boolean
  currentMultiplier: number
  currentRoundId: number | null
  isRoundActive: boolean
  isBettingPhase: boolean
  roundStartTime: number | null
  serverTime: number
  lastCrashMultiplier: number
  livePlayers: number
  recentCashouts: RecentCashout[]
  activeBets: Map<number, BetInfo>
  botBets: Map<string, BetInfo>
  pastCrashes: number[]
  retryCount: number
  gamePhase: "waiting" | "betting" | "flying" | "crashed"
  bettingTimeLeft: number
  connect: () => void
  disconnect: () => void
  cashOut: (userId: number) => Promise<any>
  setPastCrashes: (crashes: number[]) => void
  addCrashToHistory: (crashMultiplier: number) => void
  canPlaceBet: () => boolean
  canCashOut: (userId: number) => boolean
  addBetToState: (userId: number, betInfo: BetInfo) => void
  removeBetFromState: (userId: number) => void
  // Bot simulation methods
  simulateBotActivity: () => void
  generateBotBets: () => void
  processBotCashouts: (currentMultiplier: number) => void
}

let multiplierUpdateInterval: NodeJS.Timeout | null = null
let bettingCountdownInterval: NodeJS.Timeout | null = null
let botSimulationInterval: NodeJS.Timeout | null = null

// 🤖 BOT CONFIGURATION
const BOT_NAMES = [
  "CryptoKing", "LuckyAce", "BetMaster", "WinnerX", "ProGamer", "RiskTaker", 
  "CashFlow", "BigWin", "FastBet", "GoldRush", "DiamondHands", "MoonShot",
  "BullRun", "QuickCash", "HighRoller", "SafeBet", "WildCard", "JackpotJoe",
  "BetBeast", "CoinFlip", "RocketMan", "SkyHigh", "StarPlayer", "VegasPro",
  "LuckyStar", "BetBoss", "WinWave", "CashCow", "GoldMiner", "BetShark"
]

const BOT_BET_AMOUNTS = [50, 100, 150, 200, 250, 300, 500, 750, 1000, 1500, 2000]
const BOT_CASHOUT_MULTIPLIERS = [1.2, 1.5, 1.8, 2.0, 2.5, 3.0, 3.5, 4.0, 5.0, 7.5, 10.0]

export const useWebSocket = create<WebSocketState>((set, get) => ({
  socket: null,
  isConnected: false,
  currentMultiplier: 1.0,
  currentRoundId: null,
  isRoundActive: false,
  isBettingPhase: false,
  roundStartTime: null,
  serverTime: Date.now(),
  lastCrashMultiplier: 1.0,
  livePlayers: 0,
  recentCashouts: [],
  activeBets: new Map(),
  botBets: new Map(),
  pastCrashes: [],
  retryCount: 0,
  gamePhase: "waiting",
  bettingTimeLeft: 0,

  canPlaceBet: () => {
    const state = get()
    return state.isConnected && 
           state.isBettingPhase && 
           !state.isRoundActive && 
           state.bettingTimeLeft > 0
  },

  canCashOut: (userId: number) => {
    const state = get()
    const hasBet = state.activeBets.has(userId)
    return state.isConnected && 
           state.isRoundActive && 
           hasBet && 
           state.currentMultiplier >= 1.01
  },

  setPastCrashes: (crashes: number[]) => {
    console.log("📊 Setting past crashes from API:", crashes)
    set({ pastCrashes: crashes })
  },

  addCrashToHistory: (crashMultiplier: number) => {
    const currentState = get()
    if (currentState.pastCrashes[0] !== crashMultiplier) {
      const newPastCrashes = [crashMultiplier, ...currentState.pastCrashes].slice(0, 12)
      console.log("💥 Adding crash to history:", crashMultiplier)
      set({ pastCrashes: newPastCrashes })
      return newPastCrashes
    }
    return currentState.pastCrashes
  },

  // 🤖 BOT SIMULATION METHODS
  simulateBotActivity: () => {
    const state = get()
    
    // Clear existing bot simulation
    if (botSimulationInterval) {
      clearInterval(botSimulationInterval)
    }

    // Start bot simulation
    botSimulationInterval = setInterval(() => {
      const currentState = get()
      
      if (currentState.isBettingPhase) {
        currentState.generateBotBets()
      }
      
      if (currentState.isRoundActive) {
        currentState.processBotCashouts(currentState.currentMultiplier)
      }
    }, 500) // Check every 500ms
  },

  generateBotBets: () => {
    const state = get()
    
    // Don't generate bots if not in betting phase
    if (!state.isBettingPhase || state.bettingTimeLeft <= 0) return

    // Generate 3-8 bot bets during betting phase
    const numBots = Math.floor(Math.random() * 6) + 3
    const currentBotCount = state.botBets.size
    
    // Don't exceed reasonable number of bots
    if (currentBotCount >= 15) return

    for (let i = 0; i < numBots && currentBotCount + i < 15; i++) {
      // Random delay to make it look natural
      setTimeout(() => {
        const currentState = get()
        if (!currentState.isBettingPhase) return

        const botName = BOT_NAMES[Math.floor(Math.random() * BOT_NAMES.length)]
        
        // Don't add duplicate bot names
        if (currentState.botBets.has(botName)) return

        const betAmount = BOT_BET_AMOUNTS[Math.floor(Math.random() * BOT_BET_AMOUNTS.length)]
        const autoCashout = Math.random() > 0.6 ? 
          BOT_CASHOUT_MULTIPLIERS[Math.floor(Math.random() * BOT_CASHOUT_MULTIPLIERS.length)] : 
          undefined

        const botBet: BetInfo = {
          id: Math.random() * 1000000,
          amount: betAmount,
          auto_cashout: autoCashout,
          username: botName,
          is_bot: true,
          placed_at: Date.now()
        }

        console.log("🤖 Bot placed bet:", botBet)

        // Add bot bet to state
        const newBotBets = new Map(currentState.botBets)
        newBotBets.set(botName, botBet)
        set({ botBets: newBotBets })

      }, Math.random() * 2000) // Random delay 0-2 seconds
    }
  },

  processBotCashouts: (currentMultiplier: number) => {
    const state = get()
    
    if (!state.isRoundActive || currentMultiplier < 1.2) return

    const newBotBets = new Map(state.botBets)
    const newRecentCashouts = [...state.recentCashouts]

    // Process auto cashouts
    for (const [botName, botBet] of state.botBets.entries()) {
      if (botBet.auto_cashout && currentMultiplier >= botBet.auto_cashout) {
        // Auto cashout triggered
        const winAmount = botBet.amount * botBet.auto_cashout
        
        const cashout: RecentCashout = {
          username: botName,
          multiplier: botBet.auto_cashout,
          amount: botBet.amount,
          win_amount: winAmount,
          timestamp: new Date().toISOString(),
          is_bot: true
        }

        console.log("🤖 Bot auto cashout:", cashout)

        newRecentCashouts.unshift(cashout)
        newBotBets.delete(botName)
      }
    }

    // Random manual cashouts (bots without auto cashout)
    for (const [botName, botBet] of state.botBets.entries()) {
      if (!botBet.auto_cashout) {
        // Calculate cashout probability based on multiplier
        let cashoutChance = 0
        
        if (currentMultiplier >= 1.5) cashoutChance = 0.02  // 2% chance per check
        if (currentMultiplier >= 2.0) cashoutChance = 0.05  // 5% chance
        if (currentMultiplier >= 3.0) cashoutChance = 0.08  // 8% chance
        if (currentMultiplier >= 5.0) cashoutChance = 0.15  // 15% chance
        if (currentMultiplier >= 10.0) cashoutChance = 0.25 // 25% chance

        if (Math.random() < cashoutChance) {
          const winAmount = botBet.amount * currentMultiplier
          
          const cashout: RecentCashout = {
            username: botName,
            multiplier: parseFloat(currentMultiplier.toFixed(2)),
            amount: botBet.amount,
            win_amount: winAmount,
            timestamp: new Date().toISOString(),
            is_bot: true
          }

          console.log("🤖 Bot manual cashout:", cashout)

          newRecentCashouts.unshift(cashout)
          newBotBets.delete(botName)
        }
      }
    }

    // Update state if there were changes
    if (newBotBets.size !== state.botBets.size || newRecentCashouts.length !== state.recentCashouts.length) {
      set({ 
        botBets: newBotBets, 
        recentCashouts: newRecentCashouts.slice(0, 20) // Keep only recent 20
      })
    }
  },

  connect: () => {
    const state = get()
    if (state.socket?.readyState === WebSocket.OPEN) return

    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8000/ws/aviator/"
    console.log("🔌 Connecting to WebSocket:", wsUrl)

    const newSocket = new WebSocket(wsUrl)
    let pingInterval: NodeJS.Timeout

    newSocket.onopen = () => {
      console.log("✅ WebSocket connected successfully")
      set({ 
        socket: newSocket, 
        isConnected: true, 
        retryCount: 0,
        serverTime: Date.now()
      })

      // Start bot simulation
      const currentState = get()
      currentState.simulateBotActivity()

      // Keep connection alive
      pingInterval = setInterval(() => {
        if (newSocket.readyState === WebSocket.OPEN) {
          newSocket.send(JSON.stringify({ action: "ping" }))
        }
      }, 30000)

      // Request initial game state
      setTimeout(() => {
        if (newSocket.readyState === WebSocket.OPEN) {
          newSocket.send(JSON.stringify({ action: "get_game_state" }))
        }
      }, 100)
    }

    newSocket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        console.log("📨 WebSocket:", data.type, data)
        
        const currentState = get()
        const now = Date.now()

        switch (data.type) {
          case "betting_open":
            console.log("🎰 Betting phase started")
            
            // Clear any existing intervals
            if (bettingCountdownInterval) clearInterval(bettingCountdownInterval)
            if (multiplierUpdateInterval) clearInterval(multiplierUpdateInterval)
            
            set({
              gamePhase: "betting",
              isBettingPhase: true,
              isRoundActive: false,
              currentMultiplier: 1.0,
              bettingTimeLeft: data.countdown || 5,
              currentRoundId: data.round_id || currentState.currentRoundId,
              activeBets: new Map(),
              botBets: new Map(), // Clear bot bets for new round
              recentCashouts: [], // Clear recent cashouts for new round
              serverTime: now
            })

            // Start betting countdown
            let timeLeft = data.countdown || 5
            bettingCountdownInterval = setInterval(() => {
              timeLeft -= 1
              set({ bettingTimeLeft: Math.max(0, timeLeft) })
              
              if (timeLeft <= 0) {
                clearInterval(bettingCountdownInterval!)
                set({ isBettingPhase: false })
              }
            }, 1000)
            break

          case "round_started":
            console.log("🚀 Round started:", data.round_id)
            
            if (bettingCountdownInterval) clearInterval(bettingCountdownInterval)
            
            set({
              gamePhase: "flying",
              currentRoundId: data.round_id,
              isRoundActive: true,
              isBettingPhase: false,
              currentMultiplier: data.multiplier || 1.0,
              roundStartTime: now,
              bettingTimeLeft: 0,
              serverTime: now
            })
            break

          case "multiplier":
            const newMultiplier = parseFloat((data.multiplier || 1.0).toFixed(2))
            
            set({
              currentMultiplier: newMultiplier,
              isRoundActive: true,
              gamePhase: "flying",
              serverTime: now
            })

            // Update live players count
            const totalBets = currentState.activeBets.size + currentState.botBets.size
            set({ livePlayers: totalBets })
            break

          case "crash":
            console.log("💥 Round crashed at:", data.multiplier)
            
            if (multiplierUpdateInterval) clearInterval(multiplierUpdateInterval)
            
            const crashMultiplier = parseFloat((data.multiplier || 1.0).toFixed(2))
            const newPastCrashes = currentState.addCrashToHistory(crashMultiplier)
            
            set({
              gamePhase: "crashed",
              isRoundActive: false,
              isBettingPhase: false,
              lastCrashMultiplier: crashMultiplier,
              currentMultiplier: crashMultiplier,
              livePlayers: 0,
              serverTime: now
            })
            
            // Trigger crash event
            if (typeof window !== 'undefined') {
              window.dispatchEvent(new CustomEvent('planeCrashed', { 
                detail: { crashMultiplier, pastCrashes: newPastCrashes } 
              }))
            }
            
            playSound("crash")
            break

          case "bet_placed":
            console.log("✅ Bet placed:", data)
            
            // Handle pending request resolution
            if (data.request_id && (window as any).pendingRequests) {
              const pending = (window as any).pendingRequests.get(data.request_id)
              if (pending) {
                clearTimeout(pending.timeout)
                pending.resolve(data)
                ;(window as any).pendingRequests.delete(data.request_id)
              }
            }
            
            // Update local state
            if (data.user_id && data.bet_id) {
              const newBets = new Map(currentState.activeBets)
              newBets.set(data.user_id, {
                id: data.bet_id,
                amount: data.amount,
                auto_cashout: data.auto_cashout,
                placed_at: now
              })
              set({ activeBets: newBets })
            }
            
            // Update balance
            if (typeof data.new_balance === "number" && typeof window !== 'undefined') {
              window.dispatchEvent(new CustomEvent('walletBalanceUpdate', { 
                detail: { balance: data.new_balance } 
              }))
            }
            break

          case "cash_out_success":
            console.log("💰 Cashout successful:", data)
            
            // Handle pending request resolution
            if (data.request_id && (window as any).pendingRequests) {
              const pending = (window as any).pendingRequests.get(data.request_id)
              if (pending) {
                clearTimeout(pending.timeout)
                pending.resolve(data)
                ;(window as any).pendingRequests.delete(data.request_id)
              }
            }
            
            // Remove bet from active bets
            if (data.user_id) {
              const newBets = new Map(currentState.activeBets)
              newBets.delete(data.user_id)
              set({ activeBets: newBets })
            }
            
            // Add to recent cashouts
            if (data.username) {
              const newCashout: RecentCashout = {
                username: data.username,
                multiplier: data.multiplier,
                amount: data.amount,
                win_amount: data.win_amount,
                timestamp: new Date().toISOString(),
                is_bot: false
              }
              
              const newRecentCashouts = [newCashout, ...currentState.recentCashouts].slice(0, 20)
              set({ recentCashouts: newRecentCashouts })
            }
            
            // Update balance
            if (typeof data.new_balance === "number" && typeof window !== 'undefined') {
              window.dispatchEvent(new CustomEvent('walletBalanceUpdate', { 
                detail: { balance: data.new_balance } 
              }))
            }
            
            playSound("cashout")
            break

          // Remove bot_bet and bot_cashout cases since we're simulating locally
          case "bet_error":
          case "cashout_error":
            console.error("❌ Error:", data.message)
            
            if (data.request_id && (window as any).pendingRequests) {
              const pending = (window as any).pendingRequests.get(data.request_id)
              if (pending) {
                clearTimeout(pending.timeout)
                pending.reject(new Error(data.message || "Operation failed"))
                ;(window as any).pendingRequests.delete(data.request_id)
              }
            }
            break

          case "game_state":
            console.log("🎮 Game state:", data)
            set({
              currentRoundId: data.round_id,
              isRoundActive: data.is_active || false,
              currentMultiplier: data.current_multiplier || 1.0,
              serverTime: now
            })
            break

          case "pong":
            set({ serverTime: now })
            break

          default:
            console.warn("⚠️ Unknown message type:", data.type)
            break
        }
      } catch (error) {
        console.error("❌ Error parsing WebSocket message:", error)
      }
    }

    newSocket.onclose = (event) => {
      console.log("🔌 WebSocket disconnected:", event.code)
      clearInterval(pingInterval)
      if (bettingCountdownInterval) clearInterval(bettingCountdownInterval)
      if (multiplierUpdateInterval) clearInterval(multiplierUpdateInterval)
      if (botSimulationInterval) clearInterval(botSimulationInterval)
      
      set({ socket: null, isConnected: false })

      // Auto-reconnect logic
      if (event.code !== 1000) {
        const currentState = get()
        const maxRetries = 5
        const retryCount = currentState.retryCount || 0

        if (retryCount < maxRetries) {
          console.log(`🔄 Reconnecting in 2 seconds... (${retryCount + 1}/${maxRetries})`)
          setTimeout(() => {
            currentState.connect()
            set({ retryCount: retryCount + 1 })
          }, 2000)
        } else {
          toast.error("Connection Lost", {
            description: "Please refresh the page to reconnect.",
          })
        }
      }
    }

    newSocket.onerror = (error) => {
      console.error("🚨 WebSocket error:", error)
    }
  },

  disconnect: () => {
    const { socket } = get()
    if (socket) {
      socket.close(1000, "User disconnected")
    }
    
    // Clear intervals
    if (bettingCountdownInterval) clearInterval(bettingCountdownInterval)
    if (multiplierUpdateInterval) clearInterval(multiplierUpdateInterval)
    if (botSimulationInterval) clearInterval(botSimulationInterval)
    
    set({ 
      socket: null, 
      isConnected: false, 
      retryCount: 0 
    })
  },

  cashOut: async (userId: number) => {
    return new Promise((resolve, reject) => {
      const { socket, canCashOut, activeBets, currentMultiplier } = get()

      // Validate before sending
      if (!socket || socket.readyState !== WebSocket.OPEN) {
        reject(new Error("Not connected to game server"))
        return
      }

      if (!canCashOut(userId)) {
        reject(new Error("Cannot cash out at this time"))
        return
      }

      const betInfo = activeBets.get(userId)
      if (!betInfo) {
        reject(new Error("No active bet found"))
        return
      }

      const requestId = `cashout_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      
      // Set up timeout
      const timeout = setTimeout(() => {
        if ((window as any).pendingRequests) {
          (window as any).pendingRequests.delete(requestId)
        }
        reject(new Error("Cashout timeout - plane may have crashed"))
      }, 3000) // Shorter timeout for cashout

      // Store pending request
      if (!(window as any).pendingRequests) {
        (window as any).pendingRequests = new Map()
      }
      (window as any).pendingRequests.set(requestId, { resolve, reject, timeout })

      // Send cashout request
      try {
        socket.send(JSON.stringify({
          action: "cashout",
          request_id: requestId,
          bet_id: betInfo.id,
          multiplier: currentMultiplier,
        }))
      } catch (error) {
        clearTimeout(timeout)
        if ((window as any).pendingRequests) {
          (window as any).pendingRequests.delete(requestId)
        }
        reject(error)
      }
    })
  },

  addBetToState: (userId: number, betInfo: BetInfo) => {
    const currentState = get()
    const newBets = new Map(currentState.activeBets)
    newBets.set(userId, betInfo)
    set({ activeBets: newBets })
    console.log("📥 Added bet to WebSocket state:", { userId, betInfo })
  },

  removeBetFromState: (userId: number) => {
    const currentState = get()
    const newBets = new Map(currentState.activeBets)
    newBets.delete(userId)
    set({ activeBets: newBets })
    console.log("🗑️ Removed bet from WebSocket state:", { userId })
  },
}))

async function playSound(type: "cashout" | "crash") {
  try {
    if (process.env.NODE_ENV === 'development') {
      console.log(`🔊 Playing ${type} sound`)
      return
    }

    const audio = new Audio(`/sounds/${type}.mp3`)
    audio.volume = 0.3
    await audio.play()
  } catch (err) {
    console.warn(`Failed to play ${type} sound:`, err)
  }
}
