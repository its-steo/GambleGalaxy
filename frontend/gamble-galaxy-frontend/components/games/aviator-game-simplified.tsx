"use client"

import React from "react"

import { useEffect, useState, useRef, useCallback, useMemo } from "react"
import { useWebSocket } from "@/lib/websocket"
import { useAuth } from "@/lib/auth"
import { useWallet } from "@/context/WalletContext"
import { api } from "@/lib/api"
import { toast } from "sonner"
import type { TopWinner } from "@/lib/types"

// Import components
import { GameHeader } from "./aviator/game-header"
import { RecentCrashes } from "./aviator/recent-crashes"
import { AviatorCanvas } from "./aviator/aviator-canvas"
import { BettingPanel } from "./aviator/betting-panel"
import { AviatorSidebar } from "./aviator/aviator-sidebar"
import { LazerSignalModal } from "./aviator/lazer-signal-modal"
import { LiveActivityFeed } from "./aviator/live-activity-feed"

// Sound function - moved inside component scope
const playSound = async (type: "cashout" | "crash") => {
  try {
    if (process.env.NODE_ENV === "development") {
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

const OptimizedGameBackground = React.memo(() => {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const [isTouchDevice, setIsTouchDevice] = useState(false)

  useEffect(() => {
    setIsTouchDevice("ontouchstart" in window || navigator.maxTouchPoints > 0)
  }, [])

  useEffect(() => {
    if (isTouchDevice) return

    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY })
    }

    window.addEventListener("mousemove", handleMouseMove)
    return () => window.removeEventListener("mousemove", handleMouseMove)
  }, [isTouchDevice])

  const stars = React.useMemo(() => {
    const starCount = typeof window !== "undefined" && window.innerWidth < 768 ? 30 : 50
    return Array.from({ length: starCount }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 2 + 1,
      opacity: Math.random() * 0.8 + 0.2,
      animationDelay: Math.random() * 3,
    }))
  }, [])

  return (
    <div className="fixed inset-0 overflow-hidden">
      {/* Base background */}
      <div className="absolute inset-0 bg-black" />

      {/* Main gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-pink-900/20 to-blue-900/20" />

      {/* Mouse-following gradient (desktop only) */}
      {!isTouchDevice && (
        <div
          className="absolute w-96 h-96 bg-gradient-radial from-purple-500/10 via-pink-500/5 to-transparent rounded-full blur-3xl transition-all duration-300 ease-out pointer-events-none"
          style={{
            left: mousePosition.x - 192,
            top: mousePosition.y - 192,
          }}
        />
      )}

      {/* Static background gradients */}
      <div className="absolute top-0 left-0 w-72 h-72 bg-gradient-radial from-blue-500/20 via-purple-500/10 to-transparent rounded-full blur-3xl" />
      <div className="absolute top-1/4 right-0 w-96 h-96 bg-gradient-radial from-pink-500/15 via-purple-500/8 to-transparent rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-1/3 w-80 h-80 bg-gradient-radial from-purple-500/20 via-blue-500/10 to-transparent rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-gradient-radial from-cyan-500/15 via-blue-500/8 to-transparent rounded-full blur-3xl" />

      {/* Animated stars */}
      {stars.map((star) => (
        <div
          key={star.id}
          className="absolute w-1 h-1 bg-white rounded-full animate-pulse"
          style={{
            left: `${star.x}%`,
            top: `${star.y}%`,
            width: `${star.size}px`,
            height: `${star.size}px`,
            opacity: star.opacity,
            animationDelay: `${star.animationDelay}s`,
            animationDuration: "3s",
          }}
        />
      ))}
    </div>
  )
})

OptimizedGameBackground.displayName = "OptimizedGameBackground"

export function AviatorGameSimplified() {
  const { user, isAuthenticated } = useAuth()
  const { balance: walletBalance, updateBalance, refreshBalance } = useWallet()

  // 🔧 SAFE: Use WebSocket with null safety
  const {
    connect,
    disconnect,
    isConnected,
    currentMultiplier,
    currentRoundId,
    isRoundActive,
    isBettingPhase,
    gamePhase,
    bettingTimeLeft,
    canPlaceBet,
    canCashOut,
    recentCashouts,
    activeBets,
    pastCrashes,
    setPastCrashes,
    addBetToState,
    removeBetFromState,
  } = useWebSocket()

  // Betting state
  const [betAmount1, setBetAmount1] = useState("100")
  const [betAmount2, setBetAmount2] = useState("100")
  const [autoCashout1, setAutoCashout1] = useState("")
  const [autoCashout2, setAutoCashout2] = useState("")

  // Game state
  const [topWinners, setTopWinners] = useState<TopWinner[]>([])
  const [showSidebar, setShowSidebar] = useState(false)
  const [isInitialized, setIsInitialized] = useState(false)
  const [showCrashScreen, setShowCrashScreen] = useState(false)
  const [crashMultiplier, setCrashMultiplier] = useState(1.0)

  // 🆕 NEW: Bot activity state
  const [botActivities, setBotActivities] = useState<
    Array<{
      id: string
      type: "bet" | "cashout"
      username: string
      amount: number
      multiplier?: number
      winAmount?: number
      isBot: boolean
      timestamp: number
      autoCashout?: number
    }>
  >([]) // 🔧 FIXED: Initialize with empty array instead of undefined

  // Premium odds state
  const [showLazerSignal, setShowLazerSignal] = useState(false)
  const [isLoadingPremiumOdds, setIsLoadingPremiumOdds] = useState(false)
  const [premiumSureOdd, setPremiumSureOdd] = useState<number | null>(null)
  const [hasPurchasedPremium, setHasPurchasedPremium] = useState(false)

  // Betting state tracking
  const [isPlacingBet, setIsPlacingBet] = useState(false)
  const [isCashingOut, setIsCashingOut] = useState(false)

  // 🔧 IMPROVED: Better bet tracking with more detailed state
  const [userActiveBets, setUserActiveBets] = useState<
    Map<
      number,
      {
        id: number
        amount: number
        roundId: number
        autoCashout?: number
        placedAt: number
      }
    >
  >(new Map())

  const [cashedOutUsers, setCashedOutUsers] = useState<Set<number>>(new Set())
  const [cashoutResults, setCashoutResults] = useState<Map<number, { multiplier: number; winAmount: number }>>(
    new Map(),
  )

  const lazerSignalTimer = useRef<NodeJS.Timeout | null>(null)
  const premiumOddsPollingTimer = useRef<NodeJS.Timeout | null>(null)

  // 🔧 IMPROVED: Better bet detection logic
  const hasBet1 =
    user && currentRoundId
      ? userActiveBets.has(currentRoundId) || (activeBets?.has(user.id) && !cashedOutUsers.has(user.id))
      : false
  const hasBet2 = false

  // 🔧 SAFE: Calculate total live players with null safety
  const totalLivePlayers = activeBets?.size || 0

  // 🆕 NEW: WebSocket event listeners for bot activity
  useEffect(() => {
    const handleBotBet = (event: CustomEvent) => {
      const { username, amount, auto_cashout, is_bot, timestamp, user_id } = event.detail

      console.log("🤖 Bot bet received:", event.detail)

      const activity = {
        id: `bet-${timestamp}-${username}`,
        type: "bet" as const,
        username,
        amount: Number(amount),
        autoCashout: auto_cashout,
        isBot: is_bot || false,
        timestamp: timestamp || Date.now(),
      }

      setBotActivities((prev) => [activity, ...prev.slice(0, 19)]) // Keep last 20

      // Add to active bets if WebSocket state exists
      if (addBetToState && user_id) {
        addBetToState(user_id, {
          id: Date.now(), // Temporary ID for bots
          amount: Number(amount),
          auto_cashout: auto_cashout,
          placed_at: timestamp || Date.now(),
        })
      }
    }

    const handleBotCashout = (event: CustomEvent) => {
      const { username, amount, multiplier, win_amount, is_bot, timestamp, user_id } = event.detail

      console.log("💰 Bot cashout received:", event.detail)

      const activity = {
        id: `cashout-${timestamp}-${username}`,
        type: "cashout" as const,
        username,
        amount: Number(amount),
        multiplier: Number(multiplier),
        winAmount: Number(win_amount),
        isBot: is_bot || false,
        timestamp: timestamp || Date.now(),
      }

      setBotActivities((prev) => [activity, ...prev.slice(0, 19)]) // Keep last 20

      // Remove from active bets if WebSocket state exists
      if (removeBetFromState && user_id) {
        removeBetFromState(user_id)
      }

      // Play cashout sound for big wins
      if (win_amount >= 1000) {
        playSound("cashout")
      }
    }

    const handleTopWinnersUpdate = () => {
      console.log("🏆 Top winners update triggered")
      //loadTopWinners() // Refresh top winners when significant wins occur
    }

    // Listen for WebSocket events
    window.addEventListener("botBet", handleBotBet as EventListener)
    window.addEventListener("botCashout", handleBotCashout as EventListener)
    window.addEventListener("topWinnersUpdate", handleTopWinnersUpdate as EventListener)

    return () => {
      window.removeEventListener("botBet", handleBotBet as EventListener)
      window.removeEventListener("botCashout", handleBotCashout as EventListener)
      window.removeEventListener("topWinnersUpdate", handleTopWinnersUpdate as EventListener)
    }
  }, [addBetToState, removeBetFromState])

  // 🔧 DEBUG: Log current state for debugging
  useEffect(() => {
    if (user && currentRoundId) {
      console.log("🔍 DEBUG STATE:", {
        userId: user.id,
        currentRoundId,
        hasBet1,
        userActiveBets: Array.from(userActiveBets.entries()),
        activeBets: activeBets ? Array.from(activeBets.entries()) : [],
        cashedOutUsers: Array.from(cashedOutUsers),
        canCashOut: canCashOut ? canCashOut(user.id) : false,
        isRoundActive,
        gamePhase,
        currentMultiplier,
      })
    }
  }, [
    user,
    currentRoundId,
    hasBet1,
    userActiveBets,
    activeBets,
    cashedOutUsers,
    canCashOut,
    isRoundActive,
    gamePhase,
    currentMultiplier,
  ])

  // Handle plane crash events
  const handlePlaneCrash = useCallback((event: CustomEvent) => {
    const { crashMultiplier: crashMult } = event.detail
    console.log("💥 Plane crashed at:", crashMult)
    setCrashMultiplier(crashMult)
    setShowCrashScreen(true)
    // Clear cashout states for next round
    setCashedOutUsers(new Set())
    setCashoutResults(new Map())
    setTimeout(() => {
      setShowCrashScreen(false)
    }, 3000)
  }, [])

  const betValidation = useMemo(
    () => ({
      minBet: 10,
      maxBet: 10000,
      minAutoCashout: 1.01,
    }),
    [],
  )

  // 🔧 IMPROVED: Better bet placement with proper state tracking
  const handlePlaceBet = useCallback(
    async (betNumber: 1 | 2) => {
      if (!user) {
        toast.error("Login Required", { description: "Please log in to place bets." })
        return
      }

      if (isPlacingBet) {
        console.log("⏳ Bet placement already in progress")
        return
      }

      // 🔧 SAFE: Client-side validation using WebSocket state with null safety
      if (!canPlaceBet || !canPlaceBet()) {
        if (!isConnected) {
          toast.error("Connection Error", { description: "Not connected to game server." })
        } else if (!isBettingPhase) {
          toast.error("Betting Closed", { description: "Betting phase has ended." })
        } else if (bettingTimeLeft <= 0) {
          toast.error("Time's Up", { description: "Betting time has expired." })
        } else {
          toast.error("Cannot Bet", { description: "Unable to place bet at this time." })
        }
        return
      }

      if (hasBet1) {
        toast.info("Bet Already Placed", { description: "You already have an active bet." })
        return
      }

      const betAmount = betNumber === 1 ? betAmount1 : betAmount2
      const parsedBetAmount = Number.parseFloat(betAmount)

      if (isNaN(parsedBetAmount) || parsedBetAmount < betValidation.minBet || parsedBetAmount > betValidation.maxBet) {
        toast.error("Invalid Amount", {
          description: `Bet must be between ${betValidation.minBet} and ${betValidation.maxBet} KES.`,
        })
        return
      }

      // Check balance
      await refreshBalance()
      if (parsedBetAmount > walletBalance) {
        toast.error("Insufficient Balance", {
          description: `You need KES ${parsedBetAmount} but only have KES ${walletBalance.toFixed(2)}.`,
        })
        return
      }

      const autoCashout = betNumber === 1 ? autoCashout1 : autoCashout2
      const parsedAutoCashout = autoCashout ? Number.parseFloat(autoCashout) : undefined

      if (parsedAutoCashout && (isNaN(parsedAutoCashout) || parsedAutoCashout < betValidation.minAutoCashout)) {
        toast.error("Invalid Auto Cashout", { description: "Auto cashout must be at least 1.01x." })
        return
      }

      // 🔧 IMPROVED: Use current round ID or create new round
      let roundIdToUse = currentRoundId
      if (!roundIdToUse) {
        console.warn("⚠️ No current round ID, creating new round...")
        try {
          const roundResponse = await api.startAviatorRound()
          if (roundResponse.data?.id) {
            roundIdToUse = roundResponse.data.id
            console.log("✅ Created new round:", roundIdToUse)
          } else {
            toast.error("Round Error", { description: "Could not create active round." })
            return
          }
        } catch (error) {
          console.error("❌ Error creating round:", error)
          toast.error("Round Error", { description: "Could not create active round." })
          return
        }
      }

      setIsPlacingBet(true)
      const loadingToast = toast.loading("Placing bet...", {
        description: `KES ${parsedBetAmount}${parsedAutoCashout ? ` @ ${parsedAutoCashout}x` : ""}`,
      })

      try {
        console.log("🎲 Placing bet via API:", {
          amount: parsedBetAmount,
          round_id: roundIdToUse,
          auto_cashout: parsedAutoCashout,
        })

        // Use reliable API for bet placement
        const apiBetResponse = await api.placeAviatorBet({
          amount: parsedBetAmount,
          round_id: roundIdToUse,
          auto_cashout: parsedAutoCashout,
        })

        // 🔧 CRITICAL: Check if API response has data before accessing properties
        if (!apiBetResponse.data) {
          throw new Error("No response data received from server")
        }

        if (apiBetResponse.error) {
          throw new Error(apiBetResponse.error)
        }

        console.log("✅ API bet placed successfully:", apiBetResponse.data)

        // 🔧 SAFE: Update balance from API response with null safety
        if (apiBetResponse.data.new_balance !== undefined && typeof apiBetResponse.data.new_balance === "number") {
          updateBalance(apiBetResponse.data.new_balance)
        }

        // 🔧 CRITICAL: Properly track bet in multiple places with null safety
        const betData = apiBetResponse.data.bet || apiBetResponse.data
        const betId = betData?.id || betData?.bet_id
        const actualRoundId = apiBetResponse.data.round_id || roundIdToUse

        if (betId && actualRoundId) {
          console.log("🎯 TRACKING BET:", { betId, actualRoundId, userId: user.id })

          // 1. Track in local state
          setUserActiveBets((prev) =>
            new Map(prev).set(actualRoundId, {
              id: betId,
              amount: parsedBetAmount,
              roundId: actualRoundId,
              autoCashout: parsedAutoCashout,
              placedAt: Date.now(),
            }),
          )

          // 2. Track in WebSocket state
          if (addBetToState) {
            const betInfo = {
              id: betId,
              amount: parsedBetAmount,
              auto_cashout: parsedAutoCashout,
              placed_at: Date.now(),
            }
            addBetToState(user.id, betInfo)
            console.log("📥 Added bet to WebSocket state:", betInfo)
          }

          // 3. Clear any previous cashout state for this user
          setCashedOutUsers((prev) => {
            const newSet = new Set(prev)
            newSet.delete(user.id)
            return newSet
          })

          // 🆕 NEW: Add user bet to activity feed
          const userActivity = {
            id: `bet-${Date.now()}-${user.username}`,
            type: "bet" as const,
            username: user.username || "You",
            amount: parsedBetAmount,
            autoCashout: parsedAutoCashout,
            isBot: false,
            timestamp: Date.now(),
          }
          setBotActivities((prev) => [userActivity, ...prev.slice(0, 19)])

          console.log("✅ BET TRACKING COMPLETE - User should now be able to cash out")
        } else {
          console.warn("⚠️ Missing bet ID or round ID, bet tracking incomplete")
        }

        toast.dismiss(loadingToast)
        toast.success("Bet Placed!", {
          description: `KES ${parsedBetAmount} bet placed successfully`,
        })
      } catch (error: unknown) {
        console.error("❌ Bet placement failed:", error)
        toast.dismiss(loadingToast)
        const errorMessage = error instanceof Error ? error.message : "Failed to place bet"

        if (errorMessage.includes("timeout")) {
          toast.error("Connection Timeout", {
            description: "Please check your connection and try again.",
          })
        } else if (errorMessage.includes("Invalid or inactive round")) {
          toast.error("Round Error", {
            description: "The betting round has ended. Wait for the next round.",
          })
        } else if (errorMessage.includes("Insufficient")) {
          toast.error("Insufficient Balance", {
            description: "Please deposit more funds to place this bet.",
          })
        } else {
          toast.error("Bet Failed", {
            description: errorMessage,
          })
        }
        // Refresh balance in case of error
        await refreshBalance()
      } finally {
        setIsPlacingBet(false)
      }
    },
    [
      user,
      isPlacingBet,
      canPlaceBet,
      isConnected,
      isBettingPhase,
      bettingTimeLeft,
      hasBet1,
      betAmount1,
      betAmount2,
      walletBalance,
      autoCashout1,
      autoCashout2,
      currentRoundId,
      refreshBalance,
      updateBalance,
      addBetToState,
      betValidation,
    ],
  )

  // 🔧 FIXED: Proper cashout with server-side validation and balance update
  const handleCashOut = useCallback(async () => {
    // 🔧 FIXED: Proper user validation
    if (!user) {
      toast.info("Login Required", { description: "Please log in to cash out." })
      return
    }

    if (isCashingOut) {
      console.log("⏳ Cashout already in progress")
      return
    }

    // 🔧 IMPROVED: Better bet detection
    const currentBet = currentRoundId ? userActiveBets.get(currentRoundId) : null
    const hasWebSocketBet = activeBets?.has(user.id) || false
    const hasCashedOut = cashedOutUsers.has(user.id)

    console.log("💰 CASHOUT ATTEMPT:", {
      userId: user.id,
      currentRoundId,
      currentBet,
      hasWebSocketBet,
      hasCashedOut,
      canCashOut: canCashOut ? canCashOut(user.id) : false,
      isRoundActive,
      gamePhase,
      currentMultiplier,
    })

    if (!currentBet && !hasWebSocketBet) {
      toast.info("No Active Bet", { description: "You don't have an active bet to cash out." })
      return
    }

    if (hasCashedOut) {
      toast.info("Already Cashed Out", { description: "You have already cashed out this round." })
      return
    }

    // Basic validation
    if (!isRoundActive || gamePhase === "crashed") {
      toast.error("Round Ended", { description: "The plane has already crashed." })
      return
    }

    if (!isConnected) {
      toast.error("Connection Error", { description: "Not connected to game server." })
      return
    }

    if (currentMultiplier < betValidation.minAutoCashout) {
      toast.error("Too Early", { description: "Wait for the multiplier to reach at least 1.01x." })
      return
    }

    // Get bet info (prefer local tracking, fallback to WebSocket)
    const betInfo = currentBet || (hasWebSocketBet ? activeBets?.get(user.id) : null)
    if (!betInfo || !betInfo.id) {
      toast.error("Bet Not Found", { description: "Could not find your active bet." })
      return
    }

    setIsCashingOut(true)
    const cashoutMultiplier = currentMultiplier
    const expectedWinAmount = betInfo.amount * cashoutMultiplier

    const loadingToast = toast.loading("Cashing out...", {
      description: `At ${cashoutMultiplier.toFixed(2)}x multiplier`,
    })

    try {
      console.log("💰 Calling API cashout with:", { bet_id: betInfo.id, multiplier: cashoutMultiplier })

      const cashoutResponse = await api.cashoutAviator(betInfo.id, cashoutMultiplier)

      if (cashoutResponse.error) {
        throw new Error(cashoutResponse.error)
      }

      const actualWinAmount = cashoutResponse.data?.win_amount || expectedWinAmount
      const newBalance = cashoutResponse.data?.new_balance

      console.log("✅ Cashout successful:", {
        winAmount: actualWinAmount,
        newBalance,
        serverResponse: cashoutResponse.data,
      })

      // Update local state
      setCashedOutUsers((prev) => new Set(prev).add(user.id))
      setCashoutResults((prev) =>
        new Map(prev).set(user.id, {
          multiplier: cashoutMultiplier,
          winAmount: actualWinAmount,
        }),
      )

      if (newBalance !== undefined) {
        updateBalance(newBalance)
      } else {
        // Fallback: refresh balance from server
        await refreshBalance()
      }

      // Remove bet from WebSocket state
      if (removeBetFromState) {
        removeBetFromState(user.id)
      }

      // Remove from local tracking
      if (currentRoundId) {
        setUserActiveBets((prev) => {
          const newMap = new Map(prev)
          newMap.delete(currentRoundId)
          return newMap
        })
      }

      const userCashoutActivity = {
        id: `cashout-${Date.now()}-${user.username}`,
        type: "cashout" as const,
        username: user.username || "You",
        amount: betInfo.amount,
        multiplier: cashoutMultiplier,
        winAmount: actualWinAmount,
        isBot: false,
        timestamp: Date.now(),
      }
      setBotActivities((prev) => [userCashoutActivity, ...prev.slice(0, 19)])

      toast.dismiss(loadingToast)
      toast.success("Cashed Out!", {
        description: `Won KES ${actualWinAmount.toFixed(2)} at ${cashoutMultiplier.toFixed(2)}x`,
      })

      // Play cashout sound for successful cashout
      playSound("cashout")
    } catch (error: unknown) {
      console.error("❌ Cashout failed:", error)
      toast.dismiss(loadingToast)

      const errorMessage = error instanceof Error ? error.message : "Failed to cash out"

      if (errorMessage.includes("already cashed out")) {
        toast.error("Already Cashed Out", { description: "You have already cashed out this round." })
        setCashedOutUsers((prev) => new Set(prev).add(user.id))
      } else if (errorMessage.includes("round ended") || errorMessage.includes("crashed")) {
        toast.error("Round Ended", { description: "The plane has already crashed." })
      } else if (errorMessage.includes("bet not found")) {
        toast.error("Bet Not Found", { description: "Could not find your active bet." })
      } else {
        toast.error("Cashout Failed", { description: errorMessage })
      }

      // Refresh balance and state in case of error
      await refreshBalance()
    } finally {
      setIsCashingOut(false)
    }
  }, [
    user,
    isCashingOut,
    currentMultiplier,
    currentRoundId,
    userActiveBets,
    activeBets,
    cashedOutUsers,
    isRoundActive,
    gamePhase,
    isConnected,
    updateBalance,
    refreshBalance,
    removeBetFromState,
    betValidation,
    canCashOut,
  ])

  // 🔧 SAFE: Clear bet tracking when new round starts
  useEffect(() => {
    if (gamePhase === "betting" && currentRoundId) {
      // New round started, clear previous round's cashout states
      setCashedOutUsers(new Set())
      setCashoutResults(new Map())
      console.log("🔄 New round started, cleared cashout states")
    }
  }, [gamePhase, currentRoundId])

  // 🆕 FIXED: Load top winners with proper win amount calculation
  const loadTopWinners = useCallback(async () => {
    try {
      console.log("🏆 Loading top winners...")
      const winnersRes = await api.getTopWinners()

      if (winnersRes.data) {
        // 🔧 FIXED: Ensure we're showing win amounts, not bet amounts
        const processedWinners = winnersRes.data.map((winner) => ({
          ...winner,
          // Calculate actual win amount if not provided
          amount: winner.win_amount || Number(winner.amount) * Number(winner.multiplier || 1),
        }))

        console.log("✅ Top winners loaded:", processedWinners)
        setTopWinners(processedWinners)
      }
    } catch (error) {
      console.error("❌ Error loading top winners:", error)
    }
  }, [])

  // Premium odds functions (simplified)
  const checkExistingPremiumOdds = useCallback(async () => {
    if (!user) return
    try {
      const [statusRes, oddRes] = await Promise.all([api.getSureOddStatus(), api.getSureOdd()])

      if (oddRes.data?.odd_value) {
        setPremiumSureOdd(oddRes.data.odd_value)
        setHasPurchasedPremium(true)
        setIsLoadingPremiumOdds(false)
        if (premiumOddsPollingTimer.current) {
          clearInterval(premiumOddsPollingTimer.current)
          premiumOddsPollingTimer.current = null
        }
      } else if (statusRes.data?.has_pending) {
        setIsLoadingPremiumOdds(true)
        //startPremiumOddsPolling()
      }
    } catch (error) {
      console.error("❌ Error checking premium odds:", error)
    }
  }, [user])

  const startPremiumOddsPolling = useCallback(() => {
    // Clear any existing polling
    if (premiumOddsPollingTimer.current) {
      clearInterval(premiumOddsPollingTimer.current)
    }

    console.log("🔄 Starting premium odds polling...")

    premiumOddsPollingTimer.current = setInterval(async () => {
      try {
        console.log("🔍 Polling for premium odd update...")
        const oddRes = await api.getSureOdd()

        if (oddRes.data?.odd_value) {
          console.log("✅ Premium odd received:", oddRes.data.odd_value)
          setPremiumSureOdd(Number(oddRes.data.odd_value))
          setHasPurchasedPremium(true)
          setIsLoadingPremiumOdds(false)

          // Stop polling
          if (premiumOddsPollingTimer.current) {
            clearInterval(premiumOddsPollingTimer.current)
            premiumOddsPollingTimer.current = null
          }

          toast.success("Premium Odd Assigned!", {
            description: `Sure odd: ${oddRes.data.odd_value}x multiplier`,
          })
        }
      } catch (error) {
        console.error("❌ Error polling for premium odd:", error)
      }
    }, 3000) // Poll every 3 seconds
  }, [])

  useEffect(() => {
    const handleSureOddAssigned = (event: CustomEvent) => {
      const { odd_value, user_id } = event.detail

      console.log("🎯 Sure odd assigned via WebSocket:", event.detail)

      // Check if this sureodd is for the current user
      if (user && user_id === user.id && odd_value) {
        setPremiumSureOdd(Number(odd_value))
        setHasPurchasedPremium(true)
        setIsLoadingPremiumOdds(false)

        // Stop polling
        if (premiumOddsPollingTimer.current) {
          clearInterval(premiumOddsPollingTimer.current)
          premiumOddsPollingTimer.current = null
        }

        toast.success("Premium Odd Assigned!", {
          description: `Sure odd: ${odd_value}x multiplier`,
        })
      }
    }

    // Listen for WebSocket sureodd events
    window.addEventListener("sureOddAssigned", handleSureOddAssigned as EventListener)

    return () => {
      window.removeEventListener("sureOddAssigned", handleSureOddAssigned as EventListener)
    }
  }, [user])

  const handlePayForPremiumOdds = useCallback(async () => {
    if (!user || walletBalance < 10000) {
      toast.error("Insufficient Balance", {
        description: "You need KES 10,000 to purchase premium odds.",
      })
      return
    }

    try {
      setIsLoadingPremiumOdds(true)
      const response = await api.purchaseSureOdd()
      if (response.data) {
        await refreshBalance()
        toast.success("Payment Successful!", {
          description: "Waiting for premium sure odd assignment...",
        })
        startPremiumOddsPolling()
      }
    } catch (error) {
      console.error("❌ Premium odds purchase failed:", error)
      setIsLoadingPremiumOdds(false)
      toast.error("Payment Failed", {
        description: "Could not process payment. Please try again.",
      })
    }
  }, [user, walletBalance, refreshBalance, startPremiumOddsPolling])

  const bettingPanelProps = useMemo(
    () => ({
      betNumber: 1,
      betAmount: betAmount1,
      setBetAmount: setBetAmount1,
      autoCashout: autoCashout1,
      setAutoCashout: setAutoCashout1,
      onPlaceBet: () => handlePlaceBet(1),
      onCashOut: handleCashOut,
      hasActiveBet: hasBet1,
      isRoundActive,
      isBettingPhase,
      isConnected,
      currentMultiplier,
      isAuthenticated,
      isPlacingBet,
      isCashingOut,
      canPlaceBet: canPlaceBet ? canPlaceBet() : false,
      canCashOut: hasBet1 && isRoundActive && gamePhase !== "crashed" && !cashedOutUsers.has(user?.id || 0),
      bettingTimeLeft,
      hasCashedOut: user ? cashedOutUsers.has(user.id) : false,
      cashoutResult: user ? cashoutResults.get(user.id) : undefined,
    }),
    [
      betAmount1,
      setBetAmount1,
      autoCashout1,
      setAutoCashout1,
      handlePlaceBet,
      handleCashOut,
      hasBet1,
      isRoundActive,
      isBettingPhase,
      isConnected,
      currentMultiplier,
      isAuthenticated,
      isPlacingBet,
      isCashingOut,
      canPlaceBet,
      gamePhase,
      cashedOutUsers,
      user,
      bettingTimeLeft,
      cashoutResults,
    ],
  )

  // Initialize game
  useEffect(() => {
    console.log("🎮 Initializing Aviator Game")
    if (connect) {
      connect()
    }
    loadTopWinners()
    if (user && isAuthenticated) {
      refreshBalance()
      checkExistingPremiumOdds()
    }

    // Start lazer signal timer
    lazerSignalTimer.current = setInterval(
      () => {
        setShowLazerSignal(true)
      },
      5 * 60 * 1000,
    )

    const initTimer = setTimeout(() => {
      setIsInitialized(true)
    }, 1000)

    return () => {
      clearTimeout(initTimer)
      if (disconnect) {
        disconnect()
      }
      if (lazerSignalTimer.current) {
        clearInterval(lazerSignalTimer.current)
      }
      if (premiumOddsPollingTimer.current) {
        clearInterval(premiumOddsPollingTimer.current)
      }
    }
  }, [connect, disconnect, loadTopWinners, refreshBalance, checkExistingPremiumOdds, user, isAuthenticated])

  // Listen for crash events
  useEffect(() => {
    window.addEventListener("planeCrashed", handlePlaneCrash as EventListener)
    return () => {
      window.removeEventListener("planeCrashed", handlePlaneCrash as EventListener)
    }
  }, [handlePlaneCrash])

  // Load initial data
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        // Load past crashes
        const pastCrashesRes = await api.getPastCrashes()
        if (pastCrashesRes.data) {
          const multipliers = pastCrashesRes.data.map((crash) => crash.multiplier)
          setPastCrashes(multipliers)
        }

        // Load top winners
        await loadTopWinners()

        // Check existing premium odds
        if (user) {
          await checkExistingPremiumOdds()
        }
      } catch (error) {
        console.error("❌ Error loading initial data:", error)
      }
    }

    loadInitialData()
  }, [setPastCrashes, loadTopWinners, user, checkExistingPremiumOdds])

  return (
    <div className="min-h-screen relative overflow-hidden">
      <OptimizedGameBackground />

      {/* Lazer Signal Modal */}
      <LazerSignalModal
        showLazerSignal={showLazerSignal}
        isLoadingPremiumOdds={isLoadingPremiumOdds}
        hasPurchasedPremium={hasPurchasedPremium}
        premiumSureOdd={premiumSureOdd}
        walletBalance={walletBalance}
        onDismiss={() => setShowLazerSignal(false)}
        onPayForPremiumOdds={handlePayForPremiumOdds}
      />

      {/* Header */}
      <GameHeader
        isConnected={isConnected}
        showSidebar={showSidebar}
        setShowSidebar={setShowSidebar}
        premiumSureOdd={premiumSureOdd}
      />

      <div className="max-w-7xl mx-auto px-4 py-6 relative z-10">
        {/* Recent Crashes Bar */}
        <RecentCrashes pastCrashes={pastCrashes || []} premiumSureOdd={premiumSureOdd} />

        <div className="grid lg:grid-cols-[1fr_380px] gap-6">
          <div className="space-y-6">
            {/* Game Canvas */}
            <AviatorCanvas
              currentMultiplier={currentMultiplier}
              isRoundActive={isRoundActive}
              isBettingPhase={isBettingPhase}
              roundCountdown={bettingTimeLeft}
              isInitialized={isInitialized}
              gamePhase={gamePhase === "betting" ? "waiting" : gamePhase}
              showCrashScreen={showCrashScreen}
              crashMultiplier={crashMultiplier}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <BettingPanel {...bettingPanelProps} betNumber={1} />
              <BettingPanel
                {...bettingPanelProps}
                betNumber={2}
                betAmount={betAmount2}
                setBetAmount={setBetAmount2}
                autoCashout={autoCashout2}
                setAutoCashout={setAutoCashout2}
                onPlaceBet={() => handlePlaceBet(2)}
                hasActiveBet={hasBet2}
                canCashOut={hasBet2 && isRoundActive && gamePhase !== "crashed"}
                hasCashedOut={false}
                cashoutResult={undefined}
              />
            </div>

            {/* Live Activity Feed */}
            <LiveActivityFeed activities={botActivities} className="lg:hidden" />
          </div>

          {/* Sidebar */}
          <AviatorSidebar
            showSidebar={showSidebar}
            topWinners={topWinners}
            livePlayers={totalLivePlayers}
            recentCashouts={recentCashouts || []}
            pastCrashes={pastCrashes || []}
            setBetAmount1={setBetAmount1}
            setBetAmount2={setBetAmount2}
            isBettingPhase={isBettingPhase}
            botActivities={botActivities || []}
          />
        </div>
      </div>
    </div>
  )
}
