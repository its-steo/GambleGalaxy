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
    isBettingPhase,
    gamePhase,
    bettingTimeLeft,
    cashOut,
    canPlaceBet,
    canCashOut,
    livePlayers,
    recentCashouts,
    activeBets,
    botBets,
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

  // Premium odds state
  const [showLazerSignal, setShowLazerSignal] = useState(false)
  const [isLoadingPremiumOdds, setIsLoadingPremiumOdds] = useState(false)
  const [premiumSureOdd, setPremiumSureOdd] = useState<number | null>(null)
  const [hasPurchasedPremium, setHasPurchasedPremium] = useState(false)

  // Betting state tracking
  const [isPlacingBet, setIsPlacingBet] = useState(false)

  // TRUE OPTIMISTIC CASHOUT STATE
  const [cashedOutUsers, setCashedOutUsers] = useState<Set<number>>(new Set())
  const [cashoutResults, setCashoutResults] = useState<Map<number, { multiplier: number, winAmount: number }>>(new Map())

  const lazerSignalTimer = useRef<NodeJS.Timeout | null>(null)

  // Check if user has active bets (excluding cashed out users)
  const hasBet1 = user ? (activeBets.has(user.id) && !cashedOutUsers.has(user.id)) : false
  const hasBet2 = false

  // Calculate total live players
  const totalLivePlayers = activeBets.size + botBets.size

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

  // HYBRID BET PLACEMENT - API for reliability + WebSocket for real-time updates
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

      // Client-side validation using WebSocket state
      if (!canPlaceBet()) {
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
          description: `You need KES ${parsedBetAmount} but only have KES ${walletBalance.toFixed(2)}.` 
        })
        return
      }

      const autoCashout = betNumber === 1 ? autoCashout1 : autoCashout2
      const parsedAutoCashout = autoCashout ? Number.parseFloat(autoCashout) : undefined

      if (parsedAutoCashout && (isNaN(parsedAutoCashout) || parsedAutoCashout < 1.01)) {
        toast.error("Invalid Auto Cashout", { description: "Auto cashout must be at least 1.01x." })
        return
      }

      // Ensure we have a valid round
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
        description: `KES ${parsedBetAmount}${parsedAutoCashout ? ` @ ${parsedAutoCashout}x` : ''}`
      })

      try {
        console.log("🎲 Placing bet via API:", { 
          amount: parsedBetAmount, 
          round_id: roundIdToUse,
          auto_cashout: parsedAutoCashout 
        })
        
        // Use reliable API for bet placement
        const apiBetResponse = await api.placeAviatorBet({
          amount: parsedBetAmount,
          round_id: roundIdToUse,
          auto_cashout: parsedAutoCashout,
        })

        if (apiBetResponse.error) {
          // Handle specific errors
          if (apiBetResponse.error.includes("Invalid or inactive round")) {
            console.warn("⚠️ Round became invalid, trying to create new round...")
            
            const newRoundResponse = await api.startAviatorRound()
            if (newRoundResponse.data?.id) {
              const retryResponse = await api.placeAviatorBet({
                amount: parsedBetAmount,
                round_id: newRoundResponse.data.id,
                auto_cashout: parsedAutoCashout,
              })
              
              if (retryResponse.error) {
                throw new Error(retryResponse.error)
              }
              
              // Handle successful retry
              console.log("✅ Retry bet successful:", retryResponse.data)
              
              // Update balance
              if (retryResponse.data && typeof retryResponse.data.new_balance === "number") {
                updateBalance(retryResponse.data.new_balance)
              }

              // Add bet to WebSocket state for real-time tracking
              const betData = retryResponse.data.bet || retryResponse.data
              const betId = betData.id || betData.bet_id
              
              if (betId) {
                const betInfo = {
                  id: betId,
                  amount: parsedBetAmount,
                  auto_cashout: parsedAutoCashout,
                  placed_at: Date.now()
                }
                
                addBetToState(user.id, betInfo)
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

        // Update balance from API response
        if (apiBetResponse.data && typeof apiBetResponse.data.new_balance === "number") {
          updateBalance(apiBetResponse.data.new_balance)
        }

        // Add bet to WebSocket state for real-time tracking
        const betData = apiBetResponse.data.bet || apiBetResponse.data
        const betId = betData.id || betData.bet_id
        
        if (betId) {
          const betInfo = {
            id: betId,
            amount: parsedBetAmount,
            auto_cashout: parsedAutoCashout,
            placed_at: Date.now()
          }
          
          addBetToState(user.id, betInfo)
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

  // 🚀 TRUE INSTANT CASHOUT WITH DATABASE PERSISTENCE
  const handleCashOut = useCallback(
    async (betNumber: 1 | 2) => {
      if (!user || !hasBet1) {
        toast.info("No Active Bet", { description: "You don't have an active bet to cash out." })
        return
      }

      if (cashedOutUsers.has(user.id)) {
        console.log("⏳ User already cashed out this round")
        return
      }

      // ONLY check if round is active and plane hasn't crashed on frontend
      if (!isRoundActive || gamePhase === "crashed") {
        toast.error("Round Ended", { description: "The plane has already crashed." })
        return
      }

      // Basic connection check
      if (!isConnected) {
        toast.error("Connection Error", { description: "Not connected to game server." })
        return
      }

      const betInfo = activeBets.get(user.id)
      if (!betInfo || !betInfo.id) {
        toast.error("Bet Not Found", { description: "Could not find your active bet." })
        return
      }

      // 🎯 INSTANT SUCCESS - Frontend decides, no server validation needed
      const cashoutMultiplier = currentMultiplier
      const winAmount = betInfo.amount * cashoutMultiplier
      const newBalance = walletBalance + winAmount
      
      console.log("⚡ INSTANT CASHOUT SUCCESS at:", cashoutMultiplier, "Win amount:", winAmount)

      // 1. IMMEDIATELY mark user as cashed out
      setCashedOutUsers(prev => new Set(prev).add(user.id))
      
      // 2. IMMEDIATELY store cashout result
      setCashoutResults(prev => new Map(prev).set(user.id, {
        multiplier: cashoutMultiplier,
        winAmount: winAmount
      }))

      // 3. IMMEDIATELY remove bet from active state
      removeBetFromState(user.id)

      // 4. IMMEDIATELY update wallet balance (frontend)
      updateBalance(newBalance)

      // 5. IMMEDIATELY show success message
      toast.success("Cashed Out!", {
        description: `Won KES ${winAmount.toFixed(2)} at ${cashoutMultiplier.toFixed(2)}x`,
      })

      // 6. IMMEDIATELY play sound
      playSound("cashout")

      // 7. Add to recent cashouts immediately for UI
      const newCashout = {
        username: user.username || `User${user.id}`,
        multiplier: cashoutMultiplier,
        amount: betInfo.amount,
        win_amount: winAmount,
        timestamp: new Date().toISOString(),
        is_bot: false
      }

      // 🏦 IMMEDIATE DATABASE UPDATE - Critical for persistence
      const updateDatabase = async () => {
        try {
          console.log("💾 Updating database immediately...")
          
          // Create a direct API call to update wallet balance in database
          const dbUpdateResponse = await api.updateWalletBalance({
            user_id: user.id,
            amount: winAmount,
            transaction_type: 'winning',
            description: `Aviator cashout at ${cashoutMultiplier.toFixed(2)}x`,
            bet_id: betInfo.id
          })

          if (dbUpdateResponse.data && typeof dbUpdateResponse.data.new_balance === 'number') {
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

      // Execute database update immediately (not in background)
      updateDatabase()

      // 🔄 BACKGROUND SERVER NOTIFICATION (for WebSocket sync)
      // This is secondary - the database update above is what matters
      setTimeout(async () => {
        try {
          console.log("📡 Notifying server via WebSocket/API (background)...")
          
          const promises = []
          
          if (isConnected) {
            promises.push(
              cashOut(user.id).catch(error => {
                console.log("📡 WebSocket notification failed (ignored):", error.message)
              })
            )
          }
          
          promises.push(
            api.cashoutAviator(betInfo.id, cashoutMultiplier).catch(error => {
              console.log("📡 API notification failed (ignored):", error.message)
            })
          )

          // Fire and forget - database is already updated
          Promise.allSettled(promises).then(results => {
            const successful = results.some(result => 
              result.status === 'fulfilled' && 
              result.value && 
              !result.value.error
            )
            
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

    },
    [
      user, 
      hasBet1, 
      cashedOutUsers,
      isRoundActive, 
      gamePhase,
      isConnected, 
      currentMultiplier, 
      activeBets, 
      cashOut,
      removeBetFromState,
      updateBalance,
      refreshBalance,
      walletBalance
    ],
  )

  // Load initial data
  const loadInitialData = useCallback(async () => {
    try {
      const [winnersRes, crashesRes] = await Promise.all([
        api.getTopWinners(),
        api.getPastCrashes()
      ])
      
      if (winnersRes.data) {
        setTopWinners(winnersRes.data)
      }
      
      if (crashesRes.data) {
        const crashes = crashesRes.data.map((round: any) => round.multiplier)
        setPastCrashes(crashes)
      }
    } catch (error) {
      console.error("❌ Error loading initial data:", error)
    }
  }, [setPastCrashes])

  // Premium odds functions (simplified)
  const checkExistingPremiumOdds = useCallback(async () => {
    if (!user) return
    
    try {
      const [statusRes, oddRes] = await Promise.all([
        api.getSureOddStatus(),
        api.getSureOdd()
      ])
      
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
    
    connect()
    loadInitialData()
    
    if (user && isAuthenticated) {
      refreshBalance()
      checkExistingPremiumOdds()
    }

    // Start lazer signal timer
    lazerSignalTimer.current = setInterval(() => {
      setShowLazerSignal(true)
    }, 5 * 60 * 1000)

    const initTimer = setTimeout(() => {
      setIsInitialized(true)
    }, 1000)

    return () => {
      clearTimeout(initTimer)
      disconnect()
      if (lazerSignalTimer.current) {
        clearInterval(lazerSignalTimer.current)
      }
    }
  }, [connect, disconnect, loadInitialData, refreshBalance, checkExistingPremiumOdds, user, isAuthenticated])

  // Listen for crash events
  useEffect(() => {
    window.addEventListener('planeCrashed', handlePlaneCrash as EventListener)
    return () => {
      window.removeEventListener('planeCrashed', handlePlaneCrash as EventListener)
    }
  }, [handlePlaneCrash])

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
              roundCountdown={bettingTimeLeft}
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
                isPlacingBet={isPlacingBet}
                isCashingOut={false} // Never show cashing out state - it's instant
                canPlaceBet={canPlaceBet()}
                canCashOut={isRoundActive && gamePhase !== "crashed"} // Simple check - if round active and not crashed
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
                onCashOut={() => handleCashOut(2)}
                hasActiveBet={hasBet2}
                isRoundActive={isRoundActive}
                isBettingPhase={isBettingPhase}
                isConnected={isConnected}
                currentMultiplier={currentMultiplier}
                isAuthenticated={isAuthenticated}
                isPlacingBet={isPlacingBet}
                isCashingOut={false}
                canPlaceBet={canPlaceBet()}
                canCashOut={isRoundActive && gamePhase !== "crashed"}
                bettingTimeLeft={bettingTimeLeft}
                hasCashedOut={false}
                cashoutResult={undefined}
              />
            </div>
          </div>

          {/* Sidebar */}
          <AviatorSidebar
            showSidebar={showSidebar}
            topWinners={topWinners}
            livePlayers={totalLivePlayers}
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

// Sound function
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
