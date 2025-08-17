//"use client"
//
//import { create } from "zustand"
//import { toast } from "sonner"
//import type { RecentCashout, CashoutResponse } from "./types"
//
//interface BetInfo {
//  id: number
//  amount: number
//  auto_cashout?: number
//  username?: string
//  is_bot?: boolean
//  placed_at?: number
//}
//
//interface WebSocketState {
//  socket: WebSocket | null
//  isConnected: boolean
//  // 🔧 CRITICAL: Server-controlled values only
//  currentMultiplier: number
//  serverCrashMultiplier: number | null
//  currentRoundId: number | null
//  isRoundActive: boolean
//  isBettingPhase: boolean
//  roundCrashed: boolean
//  // Other state
//  roundStartTime: number | null
//  serverTime: number
//  lastCrashMultiplier: number
//  livePlayers: number
//  recentCashouts: RecentCashout[]
//  activeBets: Map<number, BetInfo>
//  pastCrashes: number[]
//  retryCount: number
//  gamePhase: "waiting" | "betting" | "flying" | "crashed"
//  bettingTimeLeft: number
//  // 🔧 SIMPLIFIED: Remove complex message sequencing
//  lastServerSync: number
//  connect: () => void
//  disconnect: () => void
//  cashOut: (userId: number) => Promise<CashoutResponse>
//  setPastCrashes: (crashes: number[]) => void
//  addCrashToHistory: (crashMultiplier: number) => void
//  canPlaceBet: () => boolean
//  canCashOut: (userId: number) => boolean
//  addBetToState: (userId: number, betInfo: BetInfo) => void
//  removeBetFromState: (userId: number) => void
//}
//
//// Type-safe pending request interface
//interface TypedPendingRequest {
//  resolve: (value: CashoutResponse) => void
//  reject: (reason?: unknown) => void
//  timeout: NodeJS.Timeout
//}
//
//// Extend window interface for type safety
//declare global {
//  interface Window {
//    pendingRequests?: Map<string, TypedPendingRequest>
//  }
//}
//
//let bettingCountdownInterval: NodeJS.Timeout | null = null
//let syncCheckInterval: NodeJS.Timeout | null = null
//
//export const useWebSocket = create<WebSocketState>((set, get) => ({
//  socket: null,
//  isConnected: false,
//  // 🔧 CRITICAL: Server-controlled values
//  currentMultiplier: 1.0,
//  serverCrashMultiplier: null,
//  currentRoundId: null,
//  isRoundActive: false,
//  isBettingPhase: false,
//  roundCrashed: false,
//  // Other state
//  roundStartTime: null,
//  serverTime: Date.now(),
//  lastCrashMultiplier: 1.0,
//  livePlayers: 0,
//  recentCashouts: [],
//  activeBets: new Map<number, BetInfo>(),
//  pastCrashes: [],
//  retryCount: 0,
//  gamePhase: "waiting",
//  bettingTimeLeft: 0,
//  lastServerSync: 0,
//
//  canPlaceBet: () => {
//    const state = get()
//    return (
//      state.isConnected &&
//      state.isBettingPhase &&
//      !state.isRoundActive &&
//      !state.roundCrashed &&
//      state.bettingTimeLeft > 0
//    )
//  },
//
//  canCashOut: (userId: number) => {
//    const state = get()
//    const hasBet = state.activeBets?.has(userId) || false
//    const isValidState = state.isConnected && state.isRoundActive && !state.roundCrashed
//    const isValidMultiplier = state.currentMultiplier >= 1.01
//    const isBeforeCrash = state.serverCrashMultiplier === null || state.currentMultiplier < state.serverCrashMultiplier
//
//    console.log("🔍 canCashOut check:", {
//      userId,
//      hasBet,
//      isValidState,
//      isValidMultiplier,
//      isBeforeCrash,
//      activeBetsSize: state.activeBets?.size || 0,
//      activeBetsEntries: state.activeBets ? Array.from(state.activeBets.entries()) : [],
//    })
//
//    return hasBet && isValidState && isValidMultiplier && isBeforeCrash
//  },
//
//  setPastCrashes: (crashes: number[]) => {
//    console.log("📊 Setting past crashes from API:", crashes)
//    set({ pastCrashes: crashes })
//  },
//
//  addCrashToHistory: (crashMultiplier: number) => {
//    const currentState = get()
//    if (currentState.pastCrashes[0] !== crashMultiplier) {
//      const newPastCrashes = [crashMultiplier, ...currentState.pastCrashes].slice(0, 12)
//      console.log("💥 Adding crash to history:", crashMultiplier)
//      set({ pastCrashes: newPastCrashes })
//      return newPastCrashes
//    }
//    return currentState.pastCrashes
//  },
//
//  connect: () => {
//    const state = get()
//    if (state.socket?.readyState === WebSocket.OPEN) return
//
//    //const wsUrl = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8000/ws/aviator/"
//    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || "wss://gamblegalaxy.onrender.com/ws/aviator/"
//    console.log("🔌 Connecting to WebSocket:", wsUrl)
//    const newSocket = new WebSocket(wsUrl)
//    let pingInterval: NodeJS.Timeout
//
//    newSocket.onopen = () => {
//      console.log("✅ WebSocket connected successfully")
//      set({
//        socket: newSocket,
//        isConnected: true,
//        retryCount: 0,
//        serverTime: Date.now(),
//        lastServerSync: Date.now(),
//      })
//
//      pingInterval = setInterval(() => {
//        if (newSocket.readyState === WebSocket.OPEN) {
//          newSocket.send(JSON.stringify({ action: "ping" }))
//        }
//      }, 30000)
//
//      setTimeout(() => {
//        if (newSocket.readyState === WebSocket.OPEN) {
//          newSocket.send(JSON.stringify({ action: "get_game_state" }))
//        }
//      }, 100)
//
//      syncCheckInterval = setInterval(() => {
//        const currentState = get()
//        if (Date.now() - currentState.lastServerSync > 10000) {
//          console.warn("⚠️ No server sync for 10 seconds, requesting state")
//          if (newSocket.readyState === WebSocket.OPEN) {
//            newSocket.send(JSON.stringify({ action: "get_game_state" }))
//          }
//        }
//      }, 5000)
//    }
//
//    newSocket.onmessage = (event) => {
//      try {
//        const data = JSON.parse(event.data)
//        console.log("📨 WebSocket message:", data.type, data)
//        const currentState = get()
//        const now = data.server_time || Date.now()
//
//        switch (data.type) {
//          case "betting_open":
//            console.log("🎰 BETTING PHASE - Server authoritative")
//            if (bettingCountdownInterval) clearInterval(bettingCountdownInterval)
//
//            set({
//              gamePhase: "betting",
//              isBettingPhase: true,
//              isRoundActive: false,
//              roundCrashed: false,
//              currentMultiplier: 1.0,
//              serverCrashMultiplier: null,
//              currentRoundId: null,
//              bettingTimeLeft: data.countdown || 5,
//              activeBets: new Map(),
//              recentCashouts: [],
//              serverTime: now,
//              lastServerSync: now,
//            })
//
//            let timeLeft = data.countdown || 5
//            bettingCountdownInterval = setInterval(() => {
//              timeLeft -= 1
//              set({ bettingTimeLeft: Math.max(0, timeLeft) })
//              if (timeLeft <= 0) {
//                clearInterval(bettingCountdownInterval!)
//                set({ isBettingPhase: false })
//              }
//            }, 1000)
//            break
//
//          case "round_started":
//            console.log("🚀 ROUND STARTED - Server authoritative")
//            console.log(`🎯 Round ID: ${data.round_id}, Server crash point: ${data.crash_multiplier}x`)
//            if (bettingCountdownInterval) clearInterval(bettingCountdownInterval)
//
//            set({
//              gamePhase: "flying",
//              currentRoundId: data.round_id,
//              isRoundActive: true,
//              isBettingPhase: false,
//              roundCrashed: false,
//              currentMultiplier: data.multiplier || 1.0,
//              serverCrashMultiplier: data.crash_multiplier,
//              roundStartTime: now,
//              bettingTimeLeft: 0,
//              serverTime: now,
//              lastServerSync: now,
//            })
//            break
//
//          case "multiplier":
//          case "multiplier_update":
//            if (!currentState.roundCrashed) {
//              console.log(`📈 Server multiplier: ${data.multiplier}x`)
//              set({
//                currentMultiplier: Number.parseFloat((data.multiplier || 1.0).toFixed(2)),
//                isRoundActive: true,
//                gamePhase: "flying",
//                serverTime: now,
//                lastServerSync: now,
//              })
//
//              const totalBets = currentState.activeBets?.size || 0
//              set({ livePlayers: totalBets })
//            }
//            break
//
//          case "crash":
//          case "round_crashed":
//            console.log("💥 ROUND CRASHED - Server authoritative")
//            console.log(`🎯 Final crash: ${data.multiplier}x`)
//            const crashMultiplier = Number.parseFloat((data.multiplier || 1.0).toFixed(2))
//            const newPastCrashes = currentState.addCrashToHistory(crashMultiplier)
//
//            set({
//              gamePhase: "crashed",
//              isRoundActive: false,
//              isBettingPhase: false,
//              roundCrashed: true,
//              lastCrashMultiplier: crashMultiplier,
//              currentMultiplier: crashMultiplier,
//              livePlayers: 0,
//              serverTime: now,
//              lastServerSync: now,
//            })
//
//            if (typeof window !== "undefined") {
//              window.dispatchEvent(
//                new CustomEvent("planeCrashed", {
//                  detail: { crashMultiplier, pastCrashes: newPastCrashes },
//                }),
//              )
//            }
//            playSound("crash")
//            break
//
//          case "game_state":
//          case "game_state_sync":
//            console.log("🔄 GAME STATE SYNC from server")
//            console.log(
//              `📊 Server state: round=${data.round_id}, multiplier=${data.current_multiplier}, crashed=${data.crashed}, crash_at=${data.crash_multiplier}, betting=${data.is_betting}`,
//            )
//
//            set({
//              currentRoundId: data.round_id,
//              currentMultiplier: data.current_multiplier || 1.0,
//              serverCrashMultiplier: data.crash_multiplier,
//              isRoundActive: data.is_active || false,
//              isBettingPhase: data.is_betting || false,
//              roundCrashed: data.crashed || false,
//              serverTime: now,
//              lastServerSync: now,
//            })
//            break
//
//          case "bet_placed":
//            console.log("✅ Bet placed via WebSocket:", data)
//            if (data.user_id && data.bet_id) {
//              const currentBets = currentState.activeBets || new Map<number, BetInfo>()
//              const newBets = new Map(currentBets)
//              newBets.set(data.user_id, {
//                id: data.bet_id,
//                amount: data.amount,
//                auto_cashout: data.auto_cashout,
//                placed_at: now,
//              })
//              set({ activeBets: newBets })
//
//              console.log("📥 Updated activeBets via WebSocket:", {
//                userId: data.user_id,
//                betId: data.bet_id,
//                totalBets: newBets.size,
//                allBets: Array.from(newBets.entries()),
//              })
//            }
//
//            if (typeof data.new_balance === "number" && typeof window !== "undefined") {
//              window.dispatchEvent(
//                new CustomEvent("walletBalanceUpdate", {
//                  detail: { balance: data.new_balance },
//                }),
//              )
//            }
//            break
//
//          case "cash_out":
//            console.log("💰 Cash out:", data)
//            if (data.username) {
//              const newCashout: RecentCashout = {
//                username: data.username,
//                multiplier: data.multiplier,
//                amount: data.amount,
//                win_amount: data.win_amount,
//                timestamp: new Date().toISOString(),
//                is_bot: false,
//              }
//              const newRecentCashouts = [newCashout, ...currentState.recentCashouts].slice(0, 20)
//              set({ recentCashouts: newRecentCashouts })
//            }
//            break
//
//          case "cash_out_success":
//            console.log("💰 Cashout successful:", data)
//            if (data.user_id) {
//              const currentBets = currentState.activeBets || new Map<number, BetInfo>()
//              const newBets = new Map(currentBets)
//              newBets.delete(data.user_id)
//              set({ activeBets: newBets })
//            }
//
//            if (typeof data.new_balance === "number" && typeof window !== "undefined") {
//              window.dispatchEvent(
//                new CustomEvent("walletBalanceUpdate", {
//                  detail: { balance: data.new_balance },
//                }),
//              )
//            }
//            playSound("cashout")
//            break
//
//          case "bet_error":
//          case "cashout_error":
//            console.error("❌ Server error:", data.message)
//            if (data.server_crash) {
//              console.error(`🚨 Server says round crashed at ${data.server_crash}x`)
//            }
//            toast.error("Game Error", {
//              description: data.message || "An error occurred",
//            })
//            break
//
//          case "round_summary":
//            console.log("📊 Round summary:", data)
//            break
//
//          case "pong":
//            set({ serverTime: now, lastServerSync: now })
//            break
//
//          default:
//            console.warn("⚠️ Unknown message type:", data.type)
//            break
//        }
//      } catch (error) {
//        console.error("❌ Error parsing WebSocket message:", error)
//      }
//    }
//
//    newSocket.onclose = (event) => {
//      console.log("🔌 WebSocket disconnected:", event.code)
//      clearInterval(pingInterval)
//      if (bettingCountdownInterval) clearInterval(bettingCountdownInterval)
//      if (syncCheckInterval) clearInterval(syncCheckInterval)
//
//      set({ socket: null, isConnected: false })
//
//      if (event.code !== 1000) {
//        const currentState = get()
//        const maxRetries = 5
//        const retryCount = currentState.retryCount || 0
//
//        if (retryCount < maxRetries) {
//          console.log(`🔄 Reconnecting in 2 seconds... (${retryCount + 1}/${maxRetries})`)
//          setTimeout(() => {
//            currentState.connect()
//            set({ retryCount: retryCount + 1 })
//          }, 2000)
//        } else {
//          toast.error("Connection Lost", {
//            description: "Please refresh the page to reconnect.",
//          })
//        }
//      }
//    }
//
//    newSocket.onerror = (error) => {
//      console.error("🚨 WebSocket error:", error)
//    }
//  },
//
//  disconnect: () => {
//    const { socket } = get()
//    if (socket) {
//      socket.close(1000, "User disconnected")
//    }
//    if (bettingCountdownInterval) clearInterval(bettingCountdownInterval)
//    if (syncCheckInterval) clearInterval(syncCheckInterval)
//
//    set({
//      socket: null,
//      isConnected: false,
//      retryCount: 0,
//    })
//  },
//
//  cashOut: async (userId: number) => {
//    return new Promise<CashoutResponse>((resolve, reject) => {
//      const { socket, canCashOut, activeBets, currentMultiplier, roundCrashed, serverCrashMultiplier } = get()
//
//      console.log("💰 WebSocket cashOut attempt:", {
//        userId,
//        canCashOut: canCashOut(userId),
//        activeBets: activeBets ? Array.from(activeBets.entries()) : [],
//        currentMultiplier,
//        roundCrashed,
//        serverCrashMultiplier,
//      })
//
//      if (!socket || socket.readyState !== WebSocket.OPEN) {
//        reject(new Error("Not connected to game server"))
//        return
//      }
//
//      if (roundCrashed) {
//        reject(new Error(`Round already crashed at ${serverCrashMultiplier}x`))
//        return
//      }
//
//      if (serverCrashMultiplier && currentMultiplier >= serverCrashMultiplier) {
//        reject(new Error(`Too late - plane will crash at ${serverCrashMultiplier}x`))
//        return
//      }
//
//      if (!canCashOut(userId)) {
//        reject(new Error("Cannot cash out at this time"))
//        return
//      }
//
//      const betInfo = activeBets?.get(userId)
//      if (!betInfo) {
//        reject(new Error("No active bet found"))
//        return
//      }
//
//      const requestId = `cashout_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
//      const timeout = setTimeout(() => {
//        reject(new Error("Cashout timeout"))
//      }, 3000)
//
//      // Initialize pendingRequests if it doesn't exist
//      if (!window.pendingRequests) {
//        window.pendingRequests = new Map<string, TypedPendingRequest>()
//      }
//
//      // Store the typed pending request
//      window.pendingRequests.set(requestId, { resolve, reject, timeout })
//
//      try {
//        socket.send(
//          JSON.stringify({
//            action: "cashout",
//            request_id: requestId,
//            bet_id: betInfo.id,
//            multiplier: currentMultiplier,
//          }),
//        )
//      } catch (error) {
//        clearTimeout(timeout)
//        if (window.pendingRequests) {
//          window.pendingRequests.delete(requestId)
//        }
//        reject(error)
//      }
//    })
//  },
//
//  addBetToState: (userId: number, betInfo: BetInfo) => {
//    const currentState = get()
//    const currentBets = currentState.activeBets || new Map<number, BetInfo>()
//    const newBets = new Map(currentBets)
//    newBets.set(userId, betInfo)
//    set({ activeBets: newBets })
//
//    console.log("📥 Added bet to WebSocket state:", {
//      userId,
//      betInfo,
//      totalBets: newBets.size,
//      allBets: Array.from(newBets.entries()),
//    })
//  },
//
//  removeBetFromState: (userId: number) => {
//    const currentState = get()
//    const currentBets = currentState.activeBets || new Map<number, BetInfo>()
//    const newBets = new Map(currentBets)
//    newBets.delete(userId)
//    set({ activeBets: newBets })
//
//    console.log("🗑️ Removed bet from WebSocket state:", {
//      userId,
//      totalBets: newBets.size,
//      allBets: Array.from(newBets.entries()),
//    })
//  },
//}))
//
//async function playSound(type: "cashout" | "crash") {
//  try {
//    if (process.env.NODE_ENV === "development") {
//      console.log(`🔊 Playing ${type} sound`)
//      return
//    }
//    const audio = new Audio(`/sounds/${type}.mp3`)
//    audio.volume = 0.3
//    await audio.play()
//  } catch (err) {
//    console.warn(`Failed to play ${type} sound:`, err)
//  }
//}

//"use client"
//
//import { create } from "zustand"
//import { toast } from "sonner"
//import type { RecentCashout, CashoutResponse } from "./types"
//
//// Declare global backgroundAudio variable for TypeScript
//declare global {
//  interface Window {
//    pendingRequests?: Map<string, TypedPendingRequest>
//    backgroundAudio?: HTMLAudioElement | null
//  }
//}
//
//interface BetInfo {
//  id: number
//  amount: number
//  auto_cashout?: number
//  username?: string
//  is_bot?: boolean
//  placed_at?: number
//}
//
//interface WebSocketState {
//  socket: WebSocket | null
//  isConnected: boolean
//  // 🔧 CRITICAL: Server-controlled values only
//  currentMultiplier: number
//  serverCrashMultiplier: number | null
//  currentRoundId: number | null
//  isRoundActive: boolean
//  isBettingPhase: boolean
//  roundCrashed: boolean
//  // Other state
//  roundStartTime: number | null
//  serverTime: number
//  lastCrashMultiplier: number
//  livePlayers: number
//  recentCashouts: RecentCashout[]
//  activeBets: Map<number, BetInfo>
//  pastCrashes: number[]
//  retryCount: number
//  gamePhase: "waiting" | "betting" | "flying" | "crashed"
//  bettingTimeLeft: number
//  // 🔧 SIMPLIFIED: Remove complex message sequencing
//  lastServerSync: number
//  connect: () => void
//  disconnect: () => void
//  cashOut: (userId: number) => Promise<CashoutResponse>
//  setPastCrashes: (crashes: number[]) => void
//  addCrashToHistory: (crashMultiplier: number) => void
//  canPlaceBet: () => boolean
//  canCashOut: (userId: number) => boolean
//  addBetToState: (userId: number, betInfo: BetInfo) => void
//  removeBetFromState: (userId: number) => void
//}
//
//// Type-safe pending request interface
//interface TypedPendingRequest {
//  resolve: (value: CashoutResponse) => void
//  reject: (reason?: unknown) => void
//  timeout: NodeJS.Timeout
//}
//
//let bettingCountdownInterval: NodeJS.Timeout | null = null
//let syncCheckInterval: NodeJS.Timeout | null = null
//
//async function playSound(type: "cashout" | "crash") {
//  try {
//    if (process.env.NODE_ENV === "development") {
//      console.log(`🔊 Playing ${type} sound`)
//      return
//    }
//    const audio = new Audio(`/sounds/${type}.mp3`)
//    audio.volume = 0.3
//    await audio.play()
//  } catch (err) {
//    console.warn(`Failed to play ${type} sound:`, err)
//  }
//}
//
//function playBackgroundMusic() {
//  // Prevent multiple instances of background audio
//  if (window.backgroundAudio) {
//    return
//  }
//  try {
//    window.backgroundAudio = new Audio('/sounds/crash.mp3')
//    window.backgroundAudio.loop = true // Enable seamless looping
//    window.backgroundAudio.volume = 0.2 // Quieter than one-off sounds
//    window.backgroundAudio.play().catch(err => {
//      console.warn('Failed to play background music:', err)
//      // Handle autoplay restrictions by retrying on user interaction
//      const startAudioOnInteraction = () => {
//        if (window.backgroundAudio) {
//          window.backgroundAudio.play().catch(err => console.warn('Retry failed:', err))
//        }
//        document.removeEventListener('click', startAudioOnInteraction)
//        document.removeEventListener('touchstart', startAudioOnInteraction)
//      }
//      document.addEventListener('click', startAudioOnInteraction)
//      document.addEventListener('touchstart', startAudioOnInteraction)
//    })
//  } catch (err) {
//    console.warn('Error initializing background music:', err)
//  }
//}
//
//function stopBackgroundMusic() {
//  if (window.backgroundAudio) {
//    window.backgroundAudio.pause()
//    window.backgroundAudio.currentTime = 0 // Reset to start for next play
//    window.backgroundAudio = null // Clear reference
//  }
//}
//
//export const useWebSocket = create<WebSocketState>((set, get) => ({
//  socket: null,
//  isConnected: false,
//  // 🔧 CRITICAL: Server-controlled values
//  currentMultiplier: 1.0,
//  serverCrashMultiplier: null,
//  currentRoundId: null,
//  isRoundActive: false,
//  isBettingPhase: false,
//  roundCrashed: false,
//  // Other state
//  roundStartTime: null,
//  serverTime: Date.now(),
//  lastCrashMultiplier: 1.0,
//  livePlayers: 0,
//  recentCashouts: [],
//  activeBets: new Map<number, BetInfo>(),
//  pastCrashes: [],
//  retryCount: 0,
//  gamePhase: "waiting",
//  bettingTimeLeft: 0,
//  lastServerSync: 0,
//
//  canPlaceBet: () => {
//    const state = get()
//    return (
//      state.isConnected &&
//      state.isBettingPhase &&
//      !state.isRoundActive &&
//      !state.roundCrashed &&
//      state.bettingTimeLeft > 0
//    )
//  },
//
//  canCashOut: (userId: number) => {
//    const state = get()
//    const hasBet = state.activeBets?.has(userId) || false
//    const isValidState = state.isConnected && state.isRoundActive && !state.roundCrashed
//    const isValidMultiplier = state.currentMultiplier >= 1.01
//    const isBeforeCrash = state.serverCrashMultiplier === null || state.currentMultiplier < state.serverCrashMultiplier
//
//    console.log("🔍 canCashOut check:", {
//      userId,
//      hasBet,
//      isValidState,
//      isValidMultiplier,
//      isBeforeCrash,
//      activeBetsSize: state.activeBets?.size || 0,
//      activeBetsEntries: state.activeBets ? Array.from(state.activeBets.entries()) : [],
//    })
//
//    return hasBet && isValidState && isValidMultiplier && isBeforeCrash
//  },
//
//  setPastCrashes: (crashes: number[]) => {
//    console.log("📊 Setting past crashes from API:", crashes)
//    set({ pastCrashes: crashes })
//  },
//
//  addCrashToHistory: (crashMultiplier: number) => {
//    const currentState = get()
//    if (currentState.pastCrashes[0] !== crashMultiplier) {
//      const newPastCrashes = [crashMultiplier, ...currentState.pastCrashes].slice(0, 12)
//      console.log("💥 Adding crash to history:", crashMultiplier)
//      set({ pastCrashes: newPastCrashes })
//      return newPastCrashes
//    }
//    return currentState.pastCrashes
//  },
//
//  connect: () => {
//    const state = get()
//    if (state.socket?.readyState === WebSocket.OPEN) return
//
//    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || "wss://gamblegalaxy.onrender.com/ws/aviator/"
//    //const wsUrl = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8000/ws/aviator/"
//    console.log("🔌 Connecting to WebSocket:", wsUrl)
//    const newSocket = new WebSocket(wsUrl)
//    let pingInterval: NodeJS.Timeout
//
//    newSocket.onopen = () => {
//      console.log("✅ WebSocket connected successfully")
//      playBackgroundMusic() // Start background music
//      set({
//        socket: newSocket,
//        isConnected: true,
//        retryCount: 0,
//        serverTime: Date.now(),
//        lastServerSync: Date.now(),
//      })
//
//      pingInterval = setInterval(() => {
//        if (newSocket.readyState === WebSocket.OPEN) {
//          newSocket.send(JSON.stringify({ action: "ping" }))
//        }
//      }, 30000)
//
//      setTimeout(() => {
//        if (newSocket.readyState === WebSocket.OPEN) {
//          newSocket.send(JSON.stringify({ action: "get_game_state" }))
//        }
//      }, 100)
//
//      syncCheckInterval = setInterval(() => {
//        const currentState = get()
//        if (Date.now() - currentState.lastServerSync > 10000) {
//          console.warn("⚠️ No server sync for 10 seconds, requesting state")
//          if (newSocket.readyState === WebSocket.OPEN) {
//            newSocket.send(JSON.stringify({ action: "get_game_state" }))
//          }
//        }
//      }, 5000)
//    }
//
//    newSocket.onmessage = (event) => {
//      try {
//        const data = JSON.parse(event.data)
//        console.log("📨 WebSocket message:", data.type, data)
//        const currentState = get()
//        const now = data.server_time || Date.now()
//
//        switch (data.type) {
//          case "betting_open":
//            console.log("🎰 BETTING PHASE - Server authoritative")
//            if (bettingCountdownInterval) clearInterval(bettingCountdownInterval)
//
//            set({
//              gamePhase: "betting",
//              isBettingPhase: true,
//              isRoundActive: false,
//              roundCrashed: false,
//              currentMultiplier: 1.0,
//              serverCrashMultiplier: null,
//              currentRoundId: null,
//              bettingTimeLeft: data.countdown || 5,
//              activeBets: new Map(),
//              recentCashouts: [],
//              serverTime: now,
//              lastServerSync: now,
//            })
//
//            let timeLeft = data.countdown || 5
//            bettingCountdownInterval = setInterval(() => {
//              timeLeft -= 1
//              set({ bettingTimeLeft: Math.max(0, timeLeft) })
//              if (timeLeft <= 0) {
//                clearInterval(bettingCountdownInterval!)
//                set({ isBettingPhase: false })
//              }
//            }, 1000)
//            break
//
//          case "round_started":
//            console.log("🚀 ROUND STARTED - Server authoritative")
//            console.log(`🎯 Round ID: ${data.round_id}, Server crash point: ${data.crash_multiplier}x`)
//            if (bettingCountdownInterval) clearInterval(bettingCountdownInterval)
//
//            set({
//              gamePhase: "flying",
//              currentRoundId: data.round_id,
//              isRoundActive: true,
//              isBettingPhase: false,
//              roundCrashed: false,
//              currentMultiplier: data.multiplier || 1.0,
//              serverCrashMultiplier: data.crash_multiplier,
//              roundStartTime: now,
//              bettingTimeLeft: 0,
//              serverTime: now,
//              lastServerSync: now,
//            })
//            break
//
//          case "multiplier":
//          case "multiplier_update":
//            if (!currentState.roundCrashed) {
//              console.log(`📈 Server multiplier: ${data.multiplier}x`)
//              set({
//                currentMultiplier: Number.parseFloat((data.multiplier || 1.0).toFixed(2)),
//                isRoundActive: true,
//                gamePhase: "flying",
//                serverTime: now,
//                lastServerSync: now,
//              })
//
//              const totalBets = currentState.activeBets?.size || 0
//              set({ livePlayers: totalBets })
//            }
//            break
//
//          case "crash":
//          case "round_crashed":
//            console.log("💥 ROUND CRASHED - Server authoritative")
//            console.log(`🎯 Final crash: ${data.multiplier}x`)
//            const crashMultiplier = Number.parseFloat((data.multiplier || 1.0).toFixed(2))
//            const newPastCrashes = currentState.addCrashToHistory(crashMultiplier)
//
//            set({
//              gamePhase: "crashed",
//              isRoundActive: false,
//              isBettingPhase: false,
//              roundCrashed: true,
//              lastCrashMultiplier: crashMultiplier,
//              currentMultiplier: crashMultiplier,
//              livePlayers: 0,
//              serverTime: now,
//              lastServerSync: now,
//            })
//
//            if (typeof window !== "undefined") {
//              window.dispatchEvent(
//                new CustomEvent("planeCrashed", {
//                  detail: { crashMultiplier, pastCrashes: newPastCrashes },
//                }),
//              )
//            }
//            playSound("crash")
//            break
//
//          case "game_state":
//          case "game_state_sync":
//            console.log("🔄 GAME STATE SYNC from server")
//            console.log(
//              `📊 Server state: round=${data.round_id}, multiplier=${data.current_multiplier}, crashed=${data.crashed}, crash_at=${data.crash_multiplier}, betting=${data.is_betting}`,
//            )
//
//            set({
//              currentRoundId: data.round_id,
//              currentMultiplier: data.current_multiplier || 1.0,
//              serverCrashMultiplier: data.crash_multiplier,
//              isRoundActive: data.is_active || false,
//              isBettingPhase: data.is_betting || false,
//              roundCrashed: data.crashed || false,
//              serverTime: now,
//              lastServerSync: now,
//            })
//            break
//
//          case "bet_placed":
//            console.log("✅ Bet placed via WebSocket:", data)
//            if (data.user_id && data.bet_id) {
//              const currentBets = currentState.activeBets || new Map<number, BetInfo>()
//              const newBets = new Map(currentBets)
//              newBets.set(data.user_id, {
//                id: data.bet_id,
//                amount: data.amount,
//                auto_cashout: data.auto_cashout,
//                placed_at: now,
//              })
//              set({ activeBets: newBets })
//
//              console.log("📥 Updated activeBets via WebSocket:", {
//                userId: data.user_id,
//                betId: data.bet_id,
//                totalBets: newBets.size,
//                allBets: Array.from(newBets.entries()),
//              })
//            }
//
//            if (typeof data.new_balance === "number" && typeof window !== "undefined") {
//              window.dispatchEvent(
//                new CustomEvent("walletBalanceUpdate", {
//                  detail: { balance: data.new_balance },
//                }),
//              )
//            }
//            break
//
//          case "cash_out":
//            console.log("💰 Cash out:", data)
//            if (data.username) {
//              const newCashout: RecentCashout = {
//                username: data.username,
//                multiplier: data.multiplier,
//                amount: data.amount,
//                win_amount: data.win_amount,
//                timestamp: new Date().toISOString(),
//                is_bot: false,
//              }
//              const newRecentCashouts = [newCashout, ...currentState.recentCashouts].slice(0, 20)
//              set({ recentCashouts: newRecentCashouts })
//            }
//            playSound("cashout")
//            break
//
//          case "cash_out_success":
//            console.log("💰 Cashout successful:", data)
//            if (data.user_id) {
//              const currentBets = currentState.activeBets || new Map<number, BetInfo>()
//              const newBets = new Map(currentBets)
//              newBets.delete(data.user_id)
//              set({ activeBets: newBets })
//            }
//
//            if (typeof data.new_balance === "number" && typeof window !== "undefined") {
//              window.dispatchEvent(
//                new CustomEvent("walletBalanceUpdate", {
//                  detail: { balance: data.new_balance },
//                }),
//              )
//            }
//            playSound("cashout")
//            break
//
//          case "bet_error":
//          case "cashout_error":
//            console.error("❌ Server error:", data.message)
//            if (data.server_crash) {
//              console.error(`🚨 Server says round crashed at ${data.server_crash}x`)
//            }
//            toast.error("Game Error", {
//              description: data.message || "An error occurred",
//            })
//            break
//
//          case "round_summary":
//            console.log("📊 Round summary:", data)
//            break
//
//          case "pong":
//            set({ serverTime: now, lastServerSync: now })
//            break
//
//          default:
//            console.warn("⚠️ Unknown message type:", data.type)
//            break
//        }
//      } catch (error) {
//        console.error("❌ Error parsing WebSocket message:", error)
//      }
//    }
//
//    newSocket.onclose = (event) => {
//      console.log("🔌 WebSocket disconnected:", event.code)
//      clearInterval(pingInterval)
//      if (bettingCountdownInterval) clearInterval(bettingCountdownInterval)
//      if (syncCheckInterval) clearInterval(syncCheckInterval)
//      stopBackgroundMusic() // Stop background music on disconnect
//
//      set({ socket: null, isConnected: false })
//
//      if (event.code !== 1000) {
//        const currentState = get()
//        const maxRetries = 5
//        const retryCount = currentState.retryCount || 0
//
//        if (retryCount < maxRetries) {
//          console.log(`🔄 Reconnecting in 2 seconds... (${retryCount + 1}/${maxRetries})`)
//          setTimeout(() => {
//            currentState.connect()
//            set({ retryCount: retryCount + 1 })
//          }, 2000)
//        } else {
//          toast.error("Connection Lost", {
//            description: "Please refresh the page to reconnect.",
//          })
//        }
//      }
//    }
//
//    newSocket.onerror = (error) => {
//      console.error("🚨 WebSocket error:", error)
//    }
//  },
//
//  disconnect: () => {
//    const { socket } = get()
//    if (socket) {
//      socket.close(1000, "User disconnected")
//    }
//    if (bettingCountdownInterval) clearInterval(bettingCountdownInterval)
//    if (syncCheckInterval) clearInterval(syncCheckInterval)
//    stopBackgroundMusic() // Stop background music on manual disconnect
//
//    set({
//      socket: null,
//      isConnected: false,
//      retryCount: 0,
//    })
//  },
//
//  cashOut: async (userId: number) => {
//    return new Promise<CashoutResponse>((resolve, reject) => {
//      const { socket, canCashOut, activeBets, currentMultiplier, roundCrashed, serverCrashMultiplier } = get()
//
//      console.log("💰 WebSocket cashOut attempt:", {
//        userId,
//        canCashOut: canCashOut(userId),
//        activeBets: activeBets ? Array.from(activeBets.entries()) : [],
//        currentMultiplier,
//        roundCrashed,
//        serverCrashMultiplier,
//      })
//
//      if (!socket || socket.readyState !== WebSocket.OPEN) {
//        reject(new Error("Not connected to game server"))
//        return
//      }
//
//      if (roundCrashed) {
//        reject(new Error(`Round already crashed at ${serverCrashMultiplier}x`))
//        return
//      }
//
//      if (serverCrashMultiplier && currentMultiplier >= serverCrashMultiplier) {
//        reject(new Error(`Too late - plane will crash at ${serverCrashMultiplier}x`))
//        return
//      }
//
//      if (!canCashOut(userId)) {
//        reject(new Error("Cannot cash out at this time"))
//        return
//      }
//
//      const betInfo = activeBets?.get(userId)
//      if (!betInfo) {
//        reject(new Error("No active bet found"))
//        return
//      }
//
//      const requestId = `cashout_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
//      const timeout = setTimeout(() => {
//        reject(new Error("Cashout timeout"))
//      }, 3000)
//
//      // Initialize pendingRequests if it doesn't exist
//      if (!window.pendingRequests) {
//        window.pendingRequests = new Map<string, TypedPendingRequest>()
//      }
//
//      // Store the typed pending request
//      window.pendingRequests.set(requestId, { resolve, reject, timeout })
//
//      try {
//        socket.send(
//          JSON.stringify({
//            action: "cashout",
//            request_id: requestId,
//            bet_id: betInfo.id,
//            multiplier: currentMultiplier,
//          }),
//        )
//      } catch (error) {
//        clearTimeout(timeout)
//        if (window.pendingRequests) {
//          window.pendingRequests.delete(requestId)
//        }
//        reject(error)
//      }
//    })
//  },
//
//  addBetToState: (userId: number, betInfo: BetInfo) => {
//    const currentState = get()
//    const currentBets = currentState.activeBets || new Map<number, BetInfo>()
//    const newBets = new Map(currentBets)
//    newBets.set(userId, betInfo)
//    set({ activeBets: newBets })
//
//    console.log("📥 Added bet to WebSocket state:", {
//      userId,
//      betInfo,
//      totalBets: newBets.size,
//      allBets: Array.from(newBets.entries()),
//    })
//  },
//
//  removeBetFromState: (userId: number) => {
//    const currentState = get()
//    const currentBets = currentState.activeBets || new Map<number, BetInfo>()
//    const newBets = new Map(currentBets)
//    newBets.delete(userId)
//    set({ activeBets: newBets })
//
//    console.log("🗑️ Removed bet from WebSocket state:", {
//      userId,
//      totalBets: newBets.size,
//      allBets: Array.from(newBets.entries()),
//    })
//  },
//}))
//
//// Stop background music when the page unloads
//if (typeof window !== "undefined") {
//  window.addEventListener('beforeunload', () => {
//    stopBackgroundMusic()
//  })
//}
//
//
//


"use client"

import { create } from "zustand"
import { toast } from "sonner"
import type { RecentCashout, CashoutResponse } from "./types"

// Declare global backgroundAudio variable for TypeScript
declare global {
  interface Window {
    pendingRequests?: Map<string, TypedPendingRequest>
    backgroundAudio?: HTMLAudioElement | null
  }
}

interface BetInfo {
  id: number
  amount: number
  auto_cashout?: number
  username?: string
  is_bot?: boolean
  placed_at?: number
}

interface WebSocketState {
  socket: WebSocket | null
  isConnected: boolean
  // 🔧 CRITICAL: Server-controlled values only
  currentMultiplier: number
  serverCrashMultiplier: number | null
  currentRoundId: number | null
  isRoundActive: boolean
  isBettingPhase: boolean
  roundCrashed: boolean
  // Other state
  roundStartTime: number | null
  serverTime: number
  lastCrashMultiplier: number
  livePlayers: number
  recentCashouts: RecentCashout[]
  activeBets: Map<number, BetInfo>
  pastCrashes: number[]
  retryCount: number
  gamePhase: "waiting" | "betting" | "flying" | "crashed"
  bettingTimeLeft: number
  // 🔧 SIMPLIFIED: Remove complex message sequencing
  lastServerSync: number
  connect: () => void
  disconnect: () => void
  cashOut: (userId: number) => Promise<CashoutResponse>
  setPastCrashes: (crashes: number[]) => void
  addCrashToHistory: (crashMultiplier: number) => void
  canPlaceBet: () => boolean
  canCashOut: (userId: number) => boolean
  addBetToState: (userId: number, betInfo: BetInfo) => void
  removeBetFromState: (userId: number) => void
}

// Type-safe pending request interface
interface TypedPendingRequest {
  resolve: (value: CashoutResponse) => void
  reject: (reason?: unknown) => void
  timeout: NodeJS.Timeout
}

let bettingCountdownInterval: NodeJS.Timeout | null = null
let syncCheckInterval: NodeJS.Timeout | null = null

async function playSound(type: "cashout" | "crash") {
  try {
    if (process.env.NODE_ENV === "development") {
      console.log(`🔊 Playing ${type} sound`)
      return
    }
    const audio = new Audio(`/sounds/${type}.mp3`)
    audio.volume = type === "crash" ? 0.5 : 0.3 // Crash sound slightly louder
    await audio.play()
  } catch (err) {
    console.warn(`Failed to play ${type} sound:`, err)
  }
}

function playBackgroundMusic() {
  // Prevent multiple instances of background audio
  if (window.backgroundAudio) {
    return
  }
  try {
    //window.backgroundAudio = new Audio("/sounds/background-music.mp3") // Fixed: use proper background music file
    //window.backgroundAudio.loop = true // Enable seamless looping
    //window.backgroundAudio.volume = 0.15 // Quieter than one-off sounds
    //window.backgroundAudio.play().catch((err) => {
    //  console.warn("Failed to play background music:", err)
    //  // Handle autoplay restrictions by retrying on user interaction
    //  const startAudioOnInteraction = () => {
    //    if (window.backgroundAudio) {
    //      window.backgroundAudio.play().catch((err) => console.warn("Retry failed:", err))
    //    }
    //    document.removeEventListener("click", startAudioOnInteraction)
    //    document.removeEventListener("touchstart", startAudioOnInteraction)
    //  }
    //  document.addEventListener("click", startAudioOnInteraction)
    //  document.addEventListener("touchstart", startAudioOnInteraction)
    //})
  } catch (err) {
    console.warn("Error initializing background music:", err)
  }
}

function stopBackgroundMusic() {
  if (window.backgroundAudio) {
    window.backgroundAudio.pause()
    window.backgroundAudio.currentTime = 0 // Reset to start for next play
    window.backgroundAudio = null // Clear reference
  }
}

export const useWebSocket = create<WebSocketState>((set, get) => ({
  socket: null,
  isConnected: false,
  // 🔧 CRITICAL: Server-controlled values
  currentMultiplier: 1.0,
  serverCrashMultiplier: null,
  currentRoundId: null,
  isRoundActive: false,
  isBettingPhase: false,
  roundCrashed: false,
  // Other state
  roundStartTime: null,
  serverTime: Date.now(),
  lastCrashMultiplier: 1.0,
  livePlayers: 0,
  recentCashouts: [],
  activeBets: new Map<number, BetInfo>(),
  pastCrashes: [],
  retryCount: 0,
  gamePhase: "waiting",
  bettingTimeLeft: 0,
  lastServerSync: 0,

  canPlaceBet: () => {
    const state = get()
    return (
      state.isConnected &&
      state.isBettingPhase &&
      !state.isRoundActive &&
      !state.roundCrashed &&
      state.bettingTimeLeft > 0
    )
  },

  canCashOut: (userId: number) => {
    const state = get()
    const hasBet = state.activeBets?.has(userId) || false
    const isValidState = state.isConnected && state.isRoundActive && !state.roundCrashed
    const isValidMultiplier = state.currentMultiplier >= 1.01
    const isBeforeCrash = state.serverCrashMultiplier === null || state.currentMultiplier < state.serverCrashMultiplier

    console.log("🔍 canCashOut check:", {
      userId,
      hasBet,
      isValidState,
      isValidMultiplier,
      isBeforeCrash,
      activeBetsSize: state.activeBets?.size || 0,
      activeBetsEntries: state.activeBets ? Array.from(state.activeBets.entries()) : [],
    })

    return hasBet && isValidState && isValidMultiplier && isBeforeCrash
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

  connect: () => {
    const state = get()
    if (state.socket?.readyState === WebSocket.OPEN) return

    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || "wss://gamblegalaxy.onrender.com/ws/aviator/"
    //const wsUrl = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8000/ws/aviator/"
    console.log("🔌 Connecting to WebSocket:", wsUrl)
    const newSocket = new WebSocket(wsUrl)
    let pingInterval: NodeJS.Timeout

    newSocket.onopen = () => {
      console.log("✅ WebSocket connected successfully")
      playBackgroundMusic() // Start background music
      set({
        socket: newSocket,
        isConnected: true,
        retryCount: 0,
        serverTime: Date.now(),
        lastServerSync: Date.now(),
      })

      pingInterval = setInterval(() => {
        if (newSocket.readyState === WebSocket.OPEN) {
          newSocket.send(JSON.stringify({ action: "ping" }))
        }
      }, 30000)

      setTimeout(() => {
        if (newSocket.readyState === WebSocket.OPEN) {
          newSocket.send(JSON.stringify({ action: "get_game_state" }))
        }
      }, 100)

      syncCheckInterval = setInterval(() => {
        const currentState = get()
        if (Date.now() - currentState.lastServerSync > 10000) {
          console.warn("⚠️ No server sync for 10 seconds, requesting state")
          if (newSocket.readyState === WebSocket.OPEN) {
            newSocket.send(JSON.stringify({ action: "get_game_state" }))
          }
        }
      }, 5000)
    }

    newSocket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        console.log("📨 WebSocket message:", data.type, data)
        const currentState = get()
        const now = data.server_time || Date.now()

        switch (data.type) {
          case "betting_open":
            console.log("🎰 BETTING PHASE - Server authoritative")
            if (bettingCountdownInterval) clearInterval(bettingCountdownInterval)

            set({
              gamePhase: "betting",
              isBettingPhase: true,
              isRoundActive: false,
              roundCrashed: false,
              currentMultiplier: 1.0,
              serverCrashMultiplier: null,
              currentRoundId: null,
              bettingTimeLeft: data.countdown || 5,
              activeBets: new Map(),
              recentCashouts: [],
              serverTime: now,
              lastServerSync: now,
            })

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
            console.log("🚀 ROUND STARTED - Server authoritative")
            console.log(`🎯 Round ID: ${data.round_id}, Server crash point: ${data.crash_multiplier}x`)
            if (bettingCountdownInterval) clearInterval(bettingCountdownInterval)

            set({
              gamePhase: "flying",
              currentRoundId: data.round_id,
              isRoundActive: true,
              isBettingPhase: false,
              roundCrashed: false,
              currentMultiplier: data.multiplier || 1.0,
              serverCrashMultiplier: data.crash_multiplier,
              roundStartTime: now,
              bettingTimeLeft: 0,
              serverTime: now,
              lastServerSync: now,
            })
            break

          case "multiplier":
          case "multiplier_update":
            if (!currentState.roundCrashed) {
              console.log(`📈 Server multiplier: ${data.multiplier}x`)
              set({
                currentMultiplier: Number.parseFloat((data.multiplier || 1.0).toFixed(2)),
                isRoundActive: true,
                gamePhase: "flying",
                serverTime: now,
                lastServerSync: now,
              })

              const totalBets = currentState.activeBets?.size || 0
              set({ livePlayers: totalBets })
            }
            break

          case "crash":
          case "round_crashed":
            console.log("💥 ROUND CRASHED - Server authoritative")
            console.log(`🎯 Final crash: ${data.multiplier}x`)
            const crashMultiplier = Number.parseFloat((data.multiplier || 1.0).toFixed(2))
            const newPastCrashes = currentState.addCrashToHistory(crashMultiplier)

            set({
              gamePhase: "crashed",
              isRoundActive: false,
              isBettingPhase: false,
              roundCrashed: true,
              lastCrashMultiplier: crashMultiplier,
              currentMultiplier: crashMultiplier,
              livePlayers: 0,
              serverTime: now,
              lastServerSync: now,
            })

            if (typeof window !== "undefined") {
              window.dispatchEvent(
                new CustomEvent("planeCrashed", {
                  detail: { crashMultiplier, pastCrashes: newPastCrashes },
                }),
              )
            }
            playSound("crash")
            break

          case "game_state":
          case "game_state_sync":
            console.log("🔄 GAME STATE SYNC from server")
            console.log(
              `📊 Server state: round=${data.round_id}, multiplier=${data.current_multiplier}, crashed=${data.crashed}, crash_at=${data.crash_multiplier}, betting=${data.is_betting}`,
            )

            set({
              currentRoundId: data.round_id,
              currentMultiplier: data.current_multiplier || 1.0,
              serverCrashMultiplier: data.crash_multiplier,
              isRoundActive: data.is_active || false,
              isBettingPhase: data.is_betting || false,
              roundCrashed: data.crashed || false,
              serverTime: now,
              lastServerSync: now,
            })
            break

          case "bet_placed":
            console.log("✅ Bet placed via WebSocket:", data)
            if (data.user_id && data.bet_id) {
              const currentBets = currentState.activeBets || new Map<number, BetInfo>()
              const newBets = new Map(currentBets)
              newBets.set(data.user_id, {
                id: data.bet_id,
                amount: data.amount,
                auto_cashout: data.auto_cashout,
                placed_at: now,
              })
              set({ activeBets: newBets })

              console.log("📥 Updated activeBets via WebSocket:", {
                userId: data.user_id,
                betId: data.bet_id,
                totalBets: newBets.size,
                allBets: Array.from(newBets.entries()),
              })
            }

            if (typeof data.new_balance === "number" && typeof window !== "undefined") {
              window.dispatchEvent(
                new CustomEvent("walletBalanceUpdate", {
                  detail: { balance: data.new_balance },
                }),
              )
            }
            break

          case "cash_out":
            console.log("💰 Cash out:", data)
            if (data.username) {
              const newCashout: RecentCashout = {
                username: data.username,
                multiplier: data.multiplier,
                amount: data.amount,
                win_amount: data.win_amount,
                timestamp: new Date().toISOString(),
                is_bot: false,
              }
              const newRecentCashouts = [newCashout, ...currentState.recentCashouts].slice(0, 20)
              set({ recentCashouts: newRecentCashouts })
            }
            playSound("cashout")
            break

          case "cash_out_success":
            console.log("💰 Cashout successful:", data)
            if (data.user_id) {
              const currentBets = currentState.activeBets || new Map<number, BetInfo>()
              const newBets = new Map(currentBets)
              newBets.delete(data.user_id)
              set({ activeBets: newBets })
            }

            if (typeof data.new_balance === "number" && typeof window !== "undefined") {
              window.dispatchEvent(
                new CustomEvent("walletBalanceUpdate", {
                  detail: { balance: data.new_balance },
                }),
              )
            }
            playSound("cashout")
            break

          case "bet_error":
          case "cashout_error":
            console.error("❌ Server error:", data.message)
            if (data.server_crash) {
              console.error(`🚨 Server says round crashed at ${data.server_crash}x`)
            }
            toast.error("Game Error", {
              description: data.message || "An error occurred",
            })
            break

          case "round_summary":
            console.log("📊 Round summary:", data)
            break

          case "pong":
            set({ serverTime: now, lastServerSync: now })
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
      if (syncCheckInterval) clearInterval(syncCheckInterval)
      stopBackgroundMusic() // Stop background music on disconnect

      set({ socket: null, isConnected: false })

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
    if (bettingCountdownInterval) clearInterval(bettingCountdownInterval)
    if (syncCheckInterval) clearInterval(syncCheckInterval)
    stopBackgroundMusic() // Stop background music on manual disconnect

    set({
      socket: null,
      isConnected: false,
      retryCount: 0,
    })
  },

  cashOut: async (userId: number) => {
    return new Promise<CashoutResponse>((resolve, reject) => {
      const { socket, canCashOut, activeBets, currentMultiplier, roundCrashed, serverCrashMultiplier } = get()

      console.log("💰 WebSocket cashOut attempt:", {
        userId,
        canCashOut: canCashOut(userId),
        activeBets: activeBets ? Array.from(activeBets.entries()) : [],
        currentMultiplier,
        roundCrashed,
        serverCrashMultiplier,
      })

      if (!socket || socket.readyState !== WebSocket.OPEN) {
        reject(new Error("Not connected to game server"))
        return
      }

      if (roundCrashed) {
        reject(new Error(`Round already crashed at ${serverCrashMultiplier}x`))
        return
      }

      if (serverCrashMultiplier && currentMultiplier >= serverCrashMultiplier) {
        reject(new Error(`Too late - plane will crash at ${serverCrashMultiplier}x`))
        return
      }

      if (!canCashOut(userId)) {
        reject(new Error("Cannot cash out at this time"))
        return
      }

      const betInfo = activeBets?.get(userId)
      if (!betInfo) {
        reject(new Error("No active bet found"))
        return
      }

      const requestId = `cashout_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      const timeout = setTimeout(() => {
        reject(new Error("Cashout timeout"))
      }, 3000)

      // Initialize pendingRequests if it doesn't exist
      if (!window.pendingRequests) {
        window.pendingRequests = new Map<string, TypedPendingRequest>()
      }

      // Store the typed pending request
      window.pendingRequests.set(requestId, { resolve, reject, timeout })

      try {
        socket.send(
          JSON.stringify({
            action: "cashout",
            request_id: requestId,
            bet_id: betInfo.id,
            multiplier: currentMultiplier,
          }),
        )
      } catch (error) {
        clearTimeout(timeout)
        if (window.pendingRequests) {
          window.pendingRequests.delete(requestId)
        }
        reject(error)
      }
    })
  },

  addBetToState: (userId: number, betInfo: BetInfo) => {
    const currentState = get()
    const currentBets = currentState.activeBets || new Map<number, BetInfo>()
    const newBets = new Map(currentBets)
    newBets.set(userId, betInfo)
    set({ activeBets: newBets })

    console.log("📥 Added bet to WebSocket state:", {
      userId,
      betInfo,
      totalBets: newBets.size,
      allBets: Array.from(newBets.entries()),
    })
  },

  removeBetFromState: (userId: number) => {
    const currentState = get()
    const currentBets = currentState.activeBets || new Map<number, BetInfo>()
    const newBets = new Map(currentBets)
    newBets.delete(userId)
    set({ activeBets: newBets })

    console.log("🗑️ Removed bet from WebSocket state:", {
      userId,
      totalBets: newBets.size,
      allBets: Array.from(newBets.entries()),
    })
  },
}))

// Stop background music when the page unloads
if (typeof window !== "undefined") {
  window.addEventListener("beforeunload", () => {
    stopBackgroundMusic()
  })
}
