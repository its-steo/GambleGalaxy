"use client"

import { useEffect, useState, useRef, useCallback } from "react"
import { useWebSocket } from "@/lib/websocket"
import { useAuth } from "@/lib/auth"
import { useWallet } from "@/context/WalletContext"
import { api } from "@/lib/api"
import { toast } from "sonner"
import type { TopWinner } from "@/lib/types"

// Import our components
import { GameHeader } from "./aviator/game-header"
import { RecentCrashes } from "./aviator/recent-crashes"
import { AviatorCanvas } from "./aviator/aviator-canvas"
import { BettingPanel } from "./aviator/betting-panel"
import { AviatorSidebar } from "./aviator/aviator-sidebar"
import { LazerSignalModal } from "./aviator/lazer-signal-modal"

export function AviatorGameSimplified() {
  const { user, isAuthenticated } = useAuth()
  const { balance: walletBalance, updateBalance, refreshBalance } = useWallet()
  const {
    connect,
    disconnect,
    isConnected,
    currentMultiplier,
    currentRoundId,
    isRoundActive,
    cashOut,
    placeBet,
    livePlayers,
    recentCashouts,
    activeBets,
    pastCrashes,
    setPastCrashes,
  } = useWebSocket()

  // Betting state
  const [betAmount1, setBetAmount1] = useState("100")
  const [betAmount2, setBetAmount2] = useState("100")
  const [autoCashout1, setAutoCashout1] = useState("")
  const [autoCashout2, setAutoCashout2] = useState("")

  // Game state
  const [topWinners, setTopWinners] = useState<TopWinner[]>([])
  const [isBettingPhase, setIsBettingPhase] = useState(true)
  const [roundCountdown, setRoundCountdown] = useState(5)
  const [showSidebar, setShowSidebar] = useState(false)
  const [isInitialized, setIsInitialized] = useState(false)
  const [gamePhase, setGamePhase] = useState<"waiting" | "flying" | "crashed">("waiting")
  const [showCrashScreen, setShowCrashScreen] = useState(false)
  const [crashMultiplier, setCrashMultiplier] = useState(1.0)
  const [hasLoadedInitialData, setHasLoadedInitialData] = useState(false)

  // Premium odds state
  const [showLazerSignal, setShowLazerSignal] = useState(false)
  const [isLoadingPremiumOdds, setIsLoadingPremiumOdds] = useState(false)
  const [premiumSureOdd, setPremiumSureOdd] = useState<number | null>(null)
  const [hasPurchasedPremium, setHasPurchasedPremium] = useState(false)

  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const lazerSignalTimer = useRef<NodeJS.Timeout | null>(null)

  // Check if user has active bets
  const hasBet1 = user ? activeBets.has(user.id) : false
  const hasBet2 = false // For now, only support one bet per user

  // Handle plane crash events from WebSocket
  const handlePlaneCrash = useCallback((event: CustomEvent) => {
    const { crashMultiplier: crashMult } = event.detail
    console.log("💥 Plane crashed event received:", crashMult)
    
    setGamePhase("crashed")
    setCrashMultiplier(crashMult)
    setShowCrashScreen(true)

    // Hide crash screen after 3 seconds
    setTimeout(() => {
      setShowCrashScreen(false)
      setGamePhase("waiting")
    }, 3000)
  }, [])

  // ✅ FIXED: Create or get active round function
  const ensureActiveRound = useCallback(async () => {
    try {
      console.log("🔄 Ensuring active round exists...")
      
      // Try to start a new round via API
      const roundResponse = await api.startAviatorRound()
      
      if (roundResponse.data && roundResponse.data.id) {
        console.log("✅ New round created:", roundResponse.data.id)
        
        // Update WebSocket state with new round
        useWebSocket.setState({ 
          currentRoundId: roundResponse.data.id,
          isRoundActive: false // New round should be in betting phase
        })
        
        return roundResponse.data.id
      } else {
        console.warn("⚠️ Failed to create new round:", roundResponse.error)
        return null
      }
    } catch (error) {
      console.error("❌ Error creating round:", error)
      return null
    }
  }, [])

  // Handle place bet
  const handlePlaceBet = useCallback(
    async (betNumber: 1 | 2) => {
      if (!user) {
        toast.error("Login Required", { description: "Please log in to place bets." })
        return
      }

      if (!isConnected) {
        toast.error("Connection Error", { description: "Not connected to game server." })
        return
      }

      if (hasBet1) {
        toast.info("Bet Already Placed", { description: "You already have an active bet." })
        return
      }

      if (!isBettingPhase) {
        toast.error("Betting Phase Closed", { description: "Wait for the next round to place a bet." })
        return
      }

      // Check if round is active (shouldn't bet during active round)
      if (isRoundActive) {
        console.error("❌ Cannot bet during active round:", { currentRoundId, isRoundActive, isBettingPhase })
        toast.error("Round Already Started", { description: "Cannot place bet after round has started." })
        return
      }

      const betAmount = betNumber === 1 ? betAmount1 : betAmount2
      const parsedBetAmount = Number.parseFloat(betAmount)

      // Validate bet amount
      if (isNaN(parsedBetAmount) || parsedBetAmount < 10 || parsedBetAmount > 10000) {
        toast.error("Invalid Bet Amount", { description: "Bet must be between 10 and 10,000 KES." })
        return
      }

      // Refresh balance before checking if we have enough funds
      console.log("💰 Refreshing wallet balance before betting...")
      await refreshBalance()
      
      // Get the most current balance
      const currentBalance = walletBalance
      console.log("💰 Current wallet balance:", currentBalance, "Bet amount:", parsedBetAmount)

      if (parsedBetAmount > currentBalance) {
        toast.error("Insufficient Balance", { 
          description: `You need KES ${parsedBetAmount} but only have KES ${currentBalance.toFixed(2)}. Please deposit funds.` 
        })
        return
      }

      const autoCashout = betNumber === 1 ? autoCashout1 : autoCashout2
      const parsedAutoCashout = autoCashout ? Number.parseFloat(autoCashout) : undefined

      // Validate auto cashout
      if (parsedAutoCashout && (isNaN(parsedAutoCashout) || parsedAutoCashout < 1.01)) {
        toast.error("Invalid Auto Cashout", { description: "Auto cashout must be at least 1.01x." })
        return
      }

      // ✅ FIXED: Ensure we have a valid round before betting
      let roundIdToUse = currentRoundId

      if (!roundIdToUse) {
        console.warn("⚠️ No current round ID, attempting to create new round...")
        const newRoundId = await ensureActiveRound()
        
        if (!newRoundId) {
          toast.error("Round Error", { 
            description: "Could not create or find an active round. Please try again." 
          })
          return
        }
        
        roundIdToUse = newRoundId
        console.log("✅ Using new round ID:", roundIdToUse)
      }

      // Show loading state
      const loadingToast = toast.loading("Placing bet...", {
        description: `Betting KES ${parsedBetAmount}${parsedAutoCashout ? ` with auto cashout at ${parsedAutoCashout}x` : ''}`
      })

      try {
        console.log("🎲 Placing bet via API with round ID:", roundIdToUse, {
          amount: parsedBetAmount,
          round_id: roundIdToUse,
          auto_cashout: parsedAutoCashout,
          isRoundActive,
          isBettingPhase
        })

        // Place bet via API to deduct from wallet and register in admin
        const apiBetResponse = await api.placeAviatorBet({
          amount: parsedBetAmount,
          round_id: roundIdToUse,
          auto_cashout: parsedAutoCashout,
        })

        if (apiBetResponse.error) {
          // ✅ FIXED: Handle specific round errors
          if (apiBetResponse.error.includes("Invalid or inactive round")) {
            console.warn("⚠️ Round became invalid, trying to create new round...")
            
            const newRoundId = await ensureActiveRound()
            if (newRoundId) {
              console.log("🔄 Retrying bet with new round:", newRoundId)
              
              // Retry with new round
              const retryResponse = await api.placeAviatorBet({
                amount: parsedBetAmount,
                round_id: newRoundId,
                auto_cashout: parsedAutoCashout,
              })
              
              if (retryResponse.error) {
                throw new Error(retryResponse.error)
              }
              
              // Use retry response for the rest of the logic
              console.log("✅ Retry bet successful:", retryResponse.data)
              
              // Update wallet balance from retry response
              if (retryResponse.data && typeof retryResponse.data.new_balance === "number") {
                console.log("💰 Updating wallet balance from retry response:", retryResponse.data.new_balance)
                updateBalance(retryResponse.data.new_balance)
              }

              // Store bet info in WebSocket state
              if (retryResponse.data) {
                const betInfo = {
                  id: retryResponse.data.bet_id || retryResponse.data.bet_id,
                  amount: parsedBetAmount,
                  auto_cashout: parsedAutoCashout,
                }
              
                const currentState = useWebSocket.getState()
                const newBets = new Map(currentState.activeBets)
                newBets.set(user.id, betInfo)
                useWebSocket.setState({ activeBets: newBets })
              }

              toast.dismiss(loadingToast)
              toast.success("Bet Placed!", {
                description: `KES ${parsedBetAmount} bet placed successfully`,
              })
              return
            }
          }
          
          throw new Error(apiBetResponse.error)
        }

        console.log("✅ API bet placed successfully:", apiBetResponse.data)

        // Update wallet balance immediately from API response
        if (apiBetResponse.data && typeof apiBetResponse.data.new_balance === "number") {
          console.log("💰 Updating wallet balance from API response:", apiBetResponse.data.new_balance)
          updateBalance(apiBetResponse.data.new_balance)
        }

        // Store bet info in WebSocket state for cashout
        if (apiBetResponse.data) {
          const betInfo = {
            id: apiBetResponse.data.bet_id || apiBetResponse.data.bet_id,
            amount: parsedBetAmount,
            auto_cashout: parsedAutoCashout,
          }
        
          // Update WebSocket state directly
          const currentState = useWebSocket.getState()
          const newBets = new Map(currentState.activeBets)
          newBets.set(user.id, betInfo)
          useWebSocket.setState({ activeBets: newBets })
        }

        toast.dismiss(loadingToast)
        toast.success("Bet Placed!", {
          description: `KES ${parsedBetAmount} bet placed successfully`,
        })

      } catch (error: unknown) {
        console.error("❌ Error placing bet:", error)
        toast.dismiss(loadingToast)
        
        const errorMessage = error instanceof Error ? error.message : "Network error or server issue. Please try again."
        toast.error("Error Placing Bet", {
          description: errorMessage,
        })
        
        // Refresh balance after error to get accurate state
        await refreshBalance()
      }
    },
    [
      user,
      isConnected,
      hasBet1,
      isBettingPhase,
      isRoundActive,
      currentRoundId,
      betAmount1,
      betAmount2,
      walletBalance,
      autoCashout1,
      autoCashout2,
      refreshBalance,
      updateBalance,
      ensureActiveRound,
    ],
  )

  // Handle cash out
  const handleCashOut = useCallback(
    async (betNumber: 1 | 2) => {
      if (!user || !hasBet1) {
        toast.info("No Active Bet", { description: "You don't have an active bet to cash out." })
        return
      }

      if (!isRoundActive) {
        toast.error("Round Ended", { description: "The round has already crashed." })
        return
      }

      if (!isConnected) {
        toast.error("Connection Error", { description: "Not connected to game server." })
        return
      }

      const betInfo = activeBets.get(user.id)
      if (!betInfo) {
        toast.error("No Bet Found", { description: "Could not find your active bet." })
        return
      }

      // Show loading state
      const loadingToast = toast.loading("Cashing out...", {
        description: `Cashing out at ${currentMultiplier.toFixed(2)}x`
      })

      try {
        console.log("💰 Cashing out via API...")
        
        // Cash out via API to add winnings to wallet
        const apiCashoutResponse = await api.cashoutAviator(betInfo.id, currentMultiplier)

        if (apiCashoutResponse.error) {
          throw new Error(apiCashoutResponse.error)
        }

        console.log("✅ API cashout successful:", apiCashoutResponse.data)

        // Update wallet balance immediately from API response
        if (apiCashoutResponse.data && typeof apiCashoutResponse.data.new_balance === "number") {
          console.log("💰 Updating wallet balance from cashout:", apiCashoutResponse.data.new_balance)
          updateBalance(apiCashoutResponse.data.new_balance)
        }

        // Remove bet from WebSocket state
        const currentState = useWebSocket.getState()
        const newBets = new Map(currentState.activeBets)
        newBets.delete(user.id)
        useWebSocket.setState({ activeBets: newBets })

        toast.dismiss(loadingToast)
        
        const winAmount = apiCashoutResponse.data?.win_amount || (betInfo.amount * currentMultiplier)
        toast.success("Cashed Out!", {
          description: `Won KES ${winAmount.toFixed(2)} at ${currentMultiplier.toFixed(2)}x`,
        })

        playSound("cashout")

      } catch (error: unknown) {
        console.error("❌ Error cashing out:", error)
        toast.dismiss(loadingToast)
        
        const errorMessage = error instanceof Error ? error.message : "Failed to cash out. Please try again."
        toast.error("Error Cashing Out", {
          description: errorMessage,
        })
      }
    },
    [user, hasBet1, isRoundActive, isConnected, currentMultiplier, activeBets, updateBalance],
  )

  // Load initial game data only once
  const loadInitialGameData = useCallback(async () => {
    if (hasLoadedInitialData) return
    
    try {
      console.log("📊 Loading initial game data...")
      const [winnersRes, crashesRes] = await Promise.all([api.getTopWinners(), api.getPastCrashes()])
      
      if (winnersRes.data) {
        console.log("🏆 Loaded top winners:", winnersRes.data)
        setTopWinners(winnersRes.data)
      }
      
      if (crashesRes.data) {
        const crashes = crashesRes.data.map((round: any) => round.multiplier)
        console.log("📊 Loaded past crashes from API:", crashes)
        setPastCrashes(crashes)
      }
      
      setHasLoadedInitialData(true)
    } catch (error) {
      console.error("❌ Error loading initial game data:", error)
    }
  }, [hasLoadedInitialData, setPastCrashes])

  // Separate function for refreshing winners only
  const refreshTopWinners = useCallback(async () => {
    try {
      const winnersRes = await api.getTopWinners()
      if (winnersRes.data) {
        console.log("🏆 Refreshed top winners:", winnersRes.data)
        setTopWinners(winnersRes.data)
      }
    } catch (error) {
      console.error("❌ Error refreshing top winners:", error)
    }
  }, [])

  // Premium odds functions
  const checkExistingPremiumOdds = useCallback(async () => {
    try {
      const response = await api.getSureOddStatus()
      if (response.data) {
        const { has_pending } = response.data
        const sureOddResponse = await api.getSureOdd()
        if (sureOddResponse.data && sureOddResponse.data.odd_value) {
          setPremiumSureOdd(sureOddResponse.data.odd_value)
          setHasPurchasedPremium(true)
        }
        if (has_pending && !sureOddResponse.data?.odd_value) {
          setIsLoadingPremiumOdds(true)
          pollForPremiumOdd()
        }
      }
    } catch (error) {
      console.error("❌ Error checking existing premium odds:", error)
    }
  }, [])

  const pollForPremiumOdd = useCallback(() => {
    const pollInterval = setInterval(async () => {
      try {
        const response = await api.getSureOdd()
        if (response.data && response.data.odd_value) {
          setPremiumSureOdd(response.data.odd_value)
          setHasPurchasedPremium(true)
          setIsLoadingPremiumOdds(false)
          setShowLazerSignal(false)
          clearInterval(pollInterval)
          toast.success("Premium Sure Odd Received!", {
            description: `Your premium sure odd is ${response.data.odd_value.toFixed(2)}x`,
          })
        }
      } catch (error) {
        console.error("❌ Error polling for premium odd:", error)
      }
    }, 3000)

    setTimeout(
      () => {
        clearInterval(pollInterval)
        if (isLoadingPremiumOdds) {
          setIsLoadingPremiumOdds(false)
          toast.error("Timeout", {
            description: "Premium sure odd assignment timed out. Contact support.",
          })
        }
      },
      10 * 60 * 1000,
    )
  }, [isLoadingPremiumOdds])

  const handlePayForPremiumOdds = useCallback(async () => {
    if (!user) {
      toast.error("Login Required", { description: "Please log in to purchase premium odds." })
      return
    }

    // Refresh balance before checking
    await refreshBalance()

    if (walletBalance < 10000) {
      toast.error("Insufficient Balance", {
        description: `You need KES 10,000 but only have KES ${walletBalance.toFixed(2)} to purchase premium sure odds.`,
      })
      return
    }

    setIsLoadingPremiumOdds(true)
    try {
      console.log("💎 Starting premium sure odds purchase for user:", user.id)
      const response = await api.purchaseSureOdd()
      console.log("💎 Purchase API response:", response)
      if (response.data && (response.status === 200 || response.status === 201)) {
        // Refresh balance after successful purchase
        await refreshBalance()
        pollForPremiumOdd()
        toast.success("Payment Successful!", {
          description: "KES 10,000 deducted. Waiting for premium sure odd assignment...",
        })
      } else {
        throw new Error(response.error || "Payment failed")
      }
    } catch (error: unknown) {
      console.error("❌ Error purchasing premium odds:", error)
      toast.error("Payment Failed", {
        description: error instanceof Error ? error.message : "Could not process payment. Please try again.",
      })
      setIsLoadingPremiumOdds(false)
      // Refresh balance after error to get accurate state
      await refreshBalance()
    }
  }, [user, walletBalance, refreshBalance, pollForPremiumOdd])

  const startLazerSignalTimer = useCallback(() => {
    if (lazerSignalTimer.current) {
      clearInterval(lazerSignalTimer.current)
    }
    const timer = setInterval(
      () => {
        if (!showLazerSignal) {
          setShowLazerSignal(true)
          console.log("⚡ Lazer Signal appeared!")
        }
      },
      5 * 60 * 1000,
    )
    lazerSignalTimer.current = timer
  }, [showLazerSignal])

  // Listen for plane crash events
  useEffect(() => {
    window.addEventListener('planeCrashed', handlePlaneCrash as EventListener)
    return () => {
      window.removeEventListener('planeCrashed', handlePlaneCrash as EventListener)
    }
  }, [handlePlaneCrash])

  // Debug function to check game state
  const debugGameState = useCallback(() => {
    console.log("🔍 Current game state:", {
      isConnected,
      currentRoundId,
      isRoundActive,
      isBettingPhase,
      roundCountdown,
      isInitialized,
      gamePhase,
      activeBets: Array.from(activeBets.entries()),
    })
  }, [isConnected, currentRoundId, isRoundActive, isBettingPhase, roundCountdown, isInitialized, gamePhase, activeBets])

  // Function to request new round if stuck
  const requestNewRound = useCallback(async () => {
    console.log("🔄 Requesting new round...")
    const newRoundId = await ensureActiveRound()
    if (newRoundId) {
      toast.success("New Round Created", { description: `Round ${newRoundId} is ready for betting` })
    } else {
      toast.error("Failed to Create Round", { description: "Could not create a new round" })
    }
  }, [ensureActiveRound])

  // Initialize game on mount
  useEffect(() => {
    console.log("🎮 Initializing Aviator Game")
    setIsInitialized(false)
    setIsBettingPhase(true)
    setRoundCountdown(5)
    setShowCrashScreen(false)
    setGamePhase("waiting")

    connect()
    loadInitialGameData()
  
    // Force refresh wallet balance when game initializes
    if (user && isAuthenticated) {
      console.log("💰 Force refreshing wallet balance on game init")
      refreshBalance()
    }
  
    startLazerSignalTimer()

    if (user) {
      checkExistingPremiumOdds()
    }

    const initTimer = setTimeout(() => {
      console.log("✅ Game initialized")
      setIsInitialized(true)
    }, 2000)

    return () => {
      console.log("🧹 Cleaning up Aviator Game")
      clearTimeout(initTimer)
      disconnect()
      if (lazerSignalTimer.current) {
        clearInterval(lazerSignalTimer.current)
      }
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current)
      }
    }
  }, [
    connect,
    disconnect,
    refreshBalance,
    checkExistingPremiumOdds,
    startLazerSignalTimer,
    user,
    isAuthenticated,
    loadInitialGameData,
  ])

  // Handle round state changes
  useEffect(() => {
    console.log("🔄 Round state changed:", { 
      isRoundActive, 
      currentRoundId, 
      currentMultiplier, 
      isInitialized,
      isBettingPhase 
    })

    if (isRoundActive && isInitialized) {
      console.log("🚀 Round is active")
      setIsBettingPhase(false)
      setShowCrashScreen(false)
      setGamePhase("flying")
    } else if (!isRoundActive && isInitialized) {
      console.log("🏁 Round ended - starting betting phase")
      setIsBettingPhase(true)
      setRoundCountdown(5)

      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current)

      countdownIntervalRef.current = setInterval(() => {
        setRoundCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(countdownIntervalRef.current!)
            refreshTopWinners()
            
            // Request game state if no round ID after countdown
            if (!currentRoundId) {
              console.log("⚠️ No round ID after countdown, requesting game state...")
              const { socket } = useWebSocket.getState()
              if (socket && socket.readyState === WebSocket.OPEN) {
                socket.send(JSON.stringify({ action: "get_game_state" }))
              }
            }
            
            return 0
          }
          return prev - 1
        })
      }, 1000)
    }
  }, [isRoundActive, isInitialized, currentRoundId, currentMultiplier, refreshTopWinners])

  // Make debug functions available in development
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      (window as any).debugAviatorGame = debugGameState;
      (window as any).requestNewRound = requestNewRound;
      (window as any).ensureActiveRound = ensureActiveRound;
      console.log("🔧 Debug functions available: debugAviatorGame(), requestNewRound(), ensureActiveRound()")
    }
  }, [debugGameState, requestNewRound, ensureActiveRound])

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background */}
      <div className="fixed inset-0 bg-gradient-to-br from-slate-900/95 via-purple-900/30 to-slate-900/95 backdrop-blur-3xl">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-purple-900/20 via-slate-900/40 to-black/60"></div>
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

      <div className="max-w-7xl mx-auto px-3 py-4 relative z-10">
        {/* Recent Crashes Bar */}
        <RecentCrashes pastCrashes={pastCrashes} premiumSureOdd={premiumSureOdd} />

        <div className="grid lg:grid-cols-[1fr_320px] gap-4">
          <div className="space-y-4">
            {/* Game Canvas */}
            <AviatorCanvas
              currentMultiplier={currentMultiplier}
              isRoundActive={isRoundActive}
              isBettingPhase={isBettingPhase}
              roundCountdown={roundCountdown}
              isInitialized={isInitialized}
              gamePhase={gamePhase}
              showCrashScreen={showCrashScreen}
              crashMultiplier={crashMultiplier}
            />

            {/* Betting Panels */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <BettingPanel
                betNumber={1}
                betAmount={betAmount1}
                setBetAmount={setBetAmount1}
                autoCashout={autoCashout1}
                setAutoCashout={setAutoCashout1}
                onPlaceBet={() => handlePlaceBet(1)}
                onCashOut={() => handleCashOut(1)}
                hasActiveBet={hasBet1}
                isRoundActive={isRoundActive}
                isBettingPhase={isBettingPhase}
                isConnected={isConnected}
                currentMultiplier={currentMultiplier}
                isAuthenticated={isAuthenticated}
              />
              <BettingPanel
                betNumber={2}
                betAmount={betAmount2}
                setBetAmount={setBetAmount2}
                autoCashout={autoCashout2}
                setAutoCashout={setAutoCashout2}
                onPlaceBet={() => handlePlaceBet(2)}
                onCashOut={() => handleCashOut(2)}
                hasActiveBet={hasBet2}
                isRoundActive={isRoundActive}
                isBettingPhase={isBettingPhase}
                isConnected={isConnected}
                currentMultiplier={currentMultiplier}
                isAuthenticated={isAuthenticated}
              />
            </div>
          </div>

          {/* Sidebar */}
          <AviatorSidebar
            showSidebar={showSidebar}
            topWinners={topWinners}
            livePlayers={livePlayers}
            recentCashouts={recentCashouts}
            pastCrashes={pastCrashes}
            setBetAmount1={setBetAmount1}
            setBetAmount2={setBetAmount2}
            isBettingPhase={isBettingPhase}
          />
        </div>
      </div>
    </div>
  )
}

// Add sound function
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

