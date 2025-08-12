"use client"

import { useEffect, useState, useRef, useCallback } from "react"
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
    cashOut,
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
      loadTopWinners() // Refresh top winners when significant wins occur
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

      // Validate bet amount
      if (isNaN(parsedBetAmount) || parsedBetAmount < 10 || parsedBetAmount > 10000) {
        toast.error("Invalid Amount", { description: "Bet must be between 10 and 10,000 KES." })
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

      if (parsedAutoCashout && (isNaN(parsedAutoCashout) || parsedAutoCashout < 1.01)) {
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
    ],
  )

  // 🔧 IMPROVED: Better cashout with proper validation
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

    if (currentMultiplier < 1.01) {
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

    // 🎯 INSTANT SUCCESS - Frontend decides, no server validation needed
    const cashoutMultiplier = currentMultiplier
    const winAmount = betInfo.amount * cashoutMultiplier
    const newBalance = walletBalance + winAmount

    console.log("⚡ INSTANT CASHOUT SUCCESS at:", cashoutMultiplier, "Win amount:", winAmount)

    // 1. IMMEDIATELY mark user as cashed out
    setCashedOutUsers((prev) => new Set(prev).add(user.id))

    // 2. IMMEDIATELY store cashout result
    setCashoutResults((prev) =>
      new Map(prev).set(user.id, {
        multiplier: cashoutMultiplier,
        winAmount: winAmount,
      }),
    )

    // 3. IMMEDIATELY remove bet from active state
    if (removeBetFromState) {
      removeBetFromState(user.id)
    }

    // 4. IMMEDIATELY update wallet balance (frontend)
    updateBalance(newBalance)

    // 5. IMMEDIATELY show success message
    toast.success("Cashed Out!", {
      description: `Won KES ${winAmount.toFixed(2)} at ${cashoutMultiplier.toFixed(2)}x`,
    })

    // 6. IMMEDIATELY play sound
    await playSound("cashout")

    // 🆕 NEW: Add user cashout to activity feed
    const userCashoutActivity = {
      id: `cashout-${Date.now()}-${user.username}`,
      type: "cashout" as const,
      username: user.username || "You",
      amount: betInfo.amount,
      multiplier: cashoutMultiplier,
      winAmount: winAmount,
      isBot: false,
      timestamp: Date.now(),
    }
    setBotActivities((prev) => [userCashoutActivity, ...prev.slice(0, 19)])

    setIsCashingOut(false)

    // 🏦 IMMEDIATE DATABASE UPDATE - Use the new endpoint
    const updateDatabase = async () => {
      try {
        console.log("💾 Updating database immediately...")
        const dbUpdateResponse = await api.updateWalletBalance({
          user_id: user.id,
          amount: winAmount,
          transaction_type: "winning",
          description: `Aviator cashout at ${cashoutMultiplier.toFixed(2)}x`,
          bet_id: betInfo.id,
        })

        if (dbUpdateResponse.data && typeof dbUpdateResponse.data.new_balance === "number") {
          console.log("✅ Database updated successfully. New balance:", dbUpdateResponse.data.new_balance)
          // Sync frontend with actual database balance
          updateBalance(dbUpdateResponse.data.new_balance)
        } else {
          console.warn("⚠️ Database update response unclear, refreshing balance...")
          await refreshBalance()
        }
      } catch (error) {
        console.error("❌ Database update failed:", error)
        // Show warning but don't revert the cashout
        toast.warning("Balance Sync Issue", {
          description: "Cashout successful but balance sync pending. Refreshing...",
        })
        // Try to refresh balance from server
        setTimeout(async () => {
          try {
            await refreshBalance()
            console.log("🔄 Balance refreshed after database sync issue")
          } catch (refreshError) {
            console.error("❌ Balance refresh also failed:", refreshError)
            toast.error("Sync Error", {
              description: "Please refresh the page to see updated balance.",
            })
          }
        }, 1000)
      }
    }

    // Execute database update immediately
    updateDatabase()

    // 🔄 BACKGROUND SERVER NOTIFICATION (for WebSocket sync)
    setTimeout(async () => {
      try {
        console.log("📡 Notifying server via WebSocket/API (background)...")
        const promises = []

        if (isConnected && cashOut) {
          promises.push(
            cashOut(user.id).catch((error) => {
              console.log("📡 WebSocket notification failed (ignored):", error.message)
            }),
          )
        }

        promises.push(
          api.cashoutAviator(betInfo.id, cashoutMultiplier).catch((error) => {
            console.log("📡 API notification failed (ignored):", error.message)
          }),
        )

        // Fire and forget - database is already updated
        Promise.allSettled(promises).then((results) => {
          const successful = results.some((result) => {
            if (result.status === "fulfilled" && result.value) {
              // Type-safe check for different response types
              const value = result.value
              // Check if it's an ApiResponse with error property
              if (typeof value === "object" && value !== null && "error" in value) {
                return !value.error
              }
              // Check if it's a response with success property
              if (typeof value === "object" && value !== null && "success" in value) {
                return value.success !== false
              }
              // If no error/success properties, consider it successful
              return true
            }
            return false
          })
          if (successful) {
            console.log("✅ Server notified of cashout successfully")
          } else {
            console.log("⚠️ Server notification failed, but database already updated")
          }
        })
      } catch (error) {
        console.log("📡 Background server notification error (ignored):", error)
      }
    }, 0)
  }, [
    user,
    isCashingOut,
    currentRoundId,
    userActiveBets,
    activeBets,
    cashedOutUsers,
    isRoundActive,
    gamePhase,
    isConnected,
    currentMultiplier,
    canCashOut,
    cashOut,
    removeBetFromState,
    updateBalance,
    refreshBalance,
    walletBalance,
  ])

  // 🔧 IMPROVED: Clear bet tracking when new round starts
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

  // Load initial data
  const loadInitialData = useCallback(async () => {
    try {
      const [crashesRes] = await Promise.all([api.getPastCrashes()])

      // Load top winners separately with the fixed function
      await loadTopWinners()

      if (crashesRes.data) {
        const crashes = crashesRes.data.map((round) => round.multiplier)
        if (setPastCrashes) {
          setPastCrashes(crashes)
        }
      }
    } catch (error) {
      console.error("❌ Error loading initial data:", error)
    }
  }, [setPastCrashes, loadTopWinners])

  // Premium odds functions (simplified)
  const checkExistingPremiumOdds = useCallback(async () => {
    if (!user) return
    try {
      const [statusRes, oddRes] = await Promise.all([api.getSureOddStatus(), api.getSureOdd()])

      if (oddRes.data?.odd_value) {
        setPremiumSureOdd(oddRes.data.odd_value)
        setHasPurchasedPremium(true)
      } else if (statusRes.data?.has_pending) {
        setIsLoadingPremiumOdds(true)
        // Poll for premium odd...
      }
    } catch (error) {
      console.error("❌ Error checking premium odds:", error)
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
      }
    } catch (error) {
      console.error("❌ Premium odds purchase failed:", error)
      setIsLoadingPremiumOdds(false)
      toast.error("Payment Failed", {
        description: "Could not process payment. Please try again.",
      })
    }
  }, [user, walletBalance, refreshBalance])

  // Initialize game
  useEffect(() => {
    console.log("🎮 Initializing Aviator Game")
    if (connect) {
      connect()
    }
    loadInitialData()
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
    }
  }, [connect, disconnect, loadInitialData, refreshBalance, checkExistingPremiumOdds, user, isAuthenticated])

  // Listen for crash events
  useEffect(() => {
    window.addEventListener("planeCrashed", handlePlaneCrash as EventListener)
    return () => {
      window.removeEventListener("planeCrashed", handlePlaneCrash as EventListener)
    }
  }, [handlePlaneCrash])

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Enhanced Background with Glassmorphism */}
      <div className="fixed inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900"></div>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-purple-500/10 via-transparent to-transparent"></div>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,_var(--tw-gradient-stops))] from-blue-500/10 via-transparent to-transparent"></div>
        <div className="absolute inset-0 backdrop-blur-3xl"></div>
        {/* Animated background elements */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

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

            {/* Betting Panels */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <BettingPanel
                betNumber={1}
                betAmount={betAmount1}
                setBetAmount={setBetAmount1}
                autoCashout={autoCashout1}
                setAutoCashout={setAutoCashout1}
                onPlaceBet={() => handlePlaceBet(1)}
                onCashOut={handleCashOut}
                hasActiveBet={hasBet1}
                isRoundActive={isRoundActive}
                isBettingPhase={isBettingPhase}
                isConnected={isConnected}
                currentMultiplier={currentMultiplier}
                isAuthenticated={isAuthenticated}
                isPlacingBet={isPlacingBet}
                isCashingOut={isCashingOut}
                canPlaceBet={canPlaceBet ? canPlaceBet() : false}
                canCashOut={hasBet1 && isRoundActive && gamePhase !== "crashed" && !cashedOutUsers.has(user?.id || 0)} // 🔧 IMPROVED: Better cashout validation
                bettingTimeLeft={bettingTimeLeft}
                hasCashedOut={user ? cashedOutUsers.has(user.id) : false}
                cashoutResult={user ? cashoutResults.get(user.id) : undefined}
              />
              <BettingPanel
                betNumber={2}
                betAmount={betAmount2}
                setBetAmount={setBetAmount2}
                autoCashout={autoCashout2}
                setAutoCashout={setAutoCashout2}
                onPlaceBet={() => handlePlaceBet(2)}
                onCashOut={() => handleCashOut()}
                hasActiveBet={hasBet2}
                isRoundActive={isRoundActive}
                isBettingPhase={isBettingPhase}
                isConnected={isConnected}
                currentMultiplier={currentMultiplier}
                isAuthenticated={isAuthenticated}
                isPlacingBet={isPlacingBet}
                isCashingOut={isCashingOut}
                canPlaceBet={canPlaceBet ? canPlaceBet() : false}
                canCashOut={hasBet2 && isRoundActive && gamePhase !== "crashed"}
                bettingTimeLeft={bettingTimeLeft}
                hasCashedOut={false}
                cashoutResult={undefined}
              />
            </div>

            {/* 🆕 NEW: Live Activity Feed */}
            <LiveActivityFeed
              activities={botActivities}
              className="lg:hidden" // Only show on mobile, desktop has sidebar
            />
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
            botActivities={botActivities || []} // 🔧 FIXED: Add null safety
          />
        </div>
      </div>
    </div>
  )
}
