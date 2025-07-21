
// @/app/aviator/page.tsx
"use client"

import type React from "react"
import { useEffect, useState, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useWebSocket } from "@/lib/websocket"
import { useAuth } from "@/lib/auth"
import { api } from "@/lib/api"
import { Plane, TrendingUp, Users, Trophy, ShieldCheck, Plus, Minus, DollarSign, Banknote } from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { WalletBalance } from "@/components/wallet/wallet-balance"
import type { TopWinner } from "@/lib/types"
import styles from "app/games/aviator/Aviatorgame.module.css"

export function AviatorGame() {
  const { user } = useAuth()
  const {
    connect,
    disconnect,
    isConnected,
    currentMultiplier,
    currentRoundId,
    isRoundActive,
    cashOut,
    walletBalance: wsBalance,
    livePlayers,
    recentCashouts,
  } = useWebSocket()

  const [betAmount1, setBetAmount1] = useState("100")
  const [betAmount2, setBetAmount2] = useState("100")
  const [autoCashout1, setAutoCashout1] = useState("")
  const [autoCashout2, setAutoCashout2] = useState("")
  const [hasBet1, setHasBet1] = useState(false)
  const [hasBet2, setHasBet2] = useState(false)
  const [topWinners, setTopWinners] = useState<TopWinner[]>([])
  const [pastCrashes, setPastCrashes] = useState<number[]>([])
  const [walletBalance, setWalletBalance] = useState<number>(0)
  const [sureOdds, setSureOdds] = useState<number | null>(null)
  const [isBettingPhase, setIsBettingPhase] = useState(true)
  const [roundCountdown, setRoundCountdown] = useState(5)
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const prevRoundActiveRef = useRef<boolean>(isRoundActive)

  useEffect(() => {
    console.log("Connecting WebSocket and loading initial data")
    connect()
    loadGameData()
    fetchWalletBalance()
    fetchSureOdds()
    return () => {
      console.log("Disconnecting WebSocket")
      disconnect()
    }
  }, [connect, disconnect])

  useEffect(() => {
    if (wsBalance !== walletBalance) {
      console.log("Updating wallet balance:", wsBalance)
      setWalletBalance(wsBalance)
    }
  }, [wsBalance])

  useEffect(() => {
    console.log("Round active state changed:", isRoundActive)
    if (!isRoundActive && prevRoundActiveRef.current) {
      console.log("Round ended, updating crash history")
      handleRoundEnd()
      setIsBettingPhase(true)
      setRoundCountdown(5)
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current)
      countdownIntervalRef.current = setInterval(() => {
        setRoundCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(countdownIntervalRef.current!)
            setIsBettingPhase(false)
            loadGameData()
            return 0
          }
          return prev - 1
        })
      }, 1000)
    } else if (isRoundActive) {
      setIsBettingPhase(false)
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current)
    }
    prevRoundActiveRef.current = isRoundActive
  }, [isRoundActive])

  useEffect(() => {
    if (isRoundActive) {
      if (hasBet1 && autoCashout1) {
        const parsedAutoCashout = Number.parseFloat(autoCashout1)
        if (parsedAutoCashout && currentMultiplier >= parsedAutoCashout) {
          handleCashOut(1)
        }
      }
      if (hasBet2 && autoCashout2) {
        const parsedAutoCashout = Number.parseFloat(autoCashout2)
        if (parsedAutoCashout && currentMultiplier >= parsedAutoCashout) {
          handleCashOut(2)
        }
      }
    }
  }, [currentMultiplier, hasBet1, hasBet2, autoCashout1, autoCashout2])

  const loadGameData = async () => {
    try {
      const [winnersRes, crashesRes] = await Promise.all([
        api.getTopWinners(),
        api.getPastCrashes(),
      ])
      console.log("Loaded game data:", { winners: winnersRes.data, crashes: crashesRes.data })
      if (winnersRes.data) setTopWinners(winnersRes.data)
      if (crashesRes.data) setPastCrashes(crashesRes.data.map((round: any) => round.multiplier))
    } catch (error) {
      console.error("Error loading game data:", error)
      toast.error("Failed to load game data", { description: "Could not fetch game data." })
    }
  }

  const fetchWalletBalance = async () => {
    if (user) {
      try {
        const res = await api.getWallet()
        console.log("Wallet balance fetched:", res.data)
        if (res.data) setWalletBalance(Number(res.data.balance))
      } catch (error) {
        console.error("Error fetching wallet balance:", error)
        toast.error("Failed to load wallet balance", { description: "Please check your connection." })
      }
    }
  }

  const fetchSureOdds = async () => {
    try {
      const res = await api.getUserSureOdds()
      console.log("Sure odds fetched:", res.data)
      if (res.data && res.data.length > 0 && typeof res.data[0].odd === "string") {
        setSureOdds(Number.parseFloat(res.data[0].odd))
      }
    } catch (error) {
      console.warn("Error fetching sure odds:", error)
    }
  }

  const handleRoundEnd = async () => {
    try {
      console.log("Handling round end, current multiplier:", currentMultiplier)
      setPastCrashes((prev) => [currentMultiplier, ...prev].slice(0, 12))
      const crashesRes = await api.getPastCrashes()
      if (crashesRes.data) {
        console.log("Synced crash history:", crashesRes.data)
        setPastCrashes(crashesRes.data.map((round: any) => round.multiplier).slice(0, 12))
      }
      try {
        const response = await fetch("/sounds/crash.mp3", { method: "HEAD" })
        if (response.ok) {
          const audio = new Audio("/sounds/crash.mp3")
          await audio.play()
          console.log("Crash sound played")
        }
      } catch (err) {
        console.warn("Crash sound not available:", err)
      }
    } catch (error) {
      console.error("Error in handleRoundEnd:", error)
      toast.error("Failed to update crash history", { description: "Could not fetch latest crashes." })
    }
  }

  const handlePlaceBet = async (betNumber: 1 | 2) => {
    if (!user) {
      toast.error("Login Required", { description: "Please log in to place bets." })
      return
    }
    if (betNumber === 1 ? hasBet1 : hasBet2) {
      toast.info("Bet Already Placed", { description: "You can only place one bet per panel per round." })
      return
    }
    if (!isBettingPhase) {
      toast.error("Betting Phase Closed", { description: "Wait for the next round to place a bet." })
      return
    }
    const betAmount = betNumber === 1 ? betAmount1 : betAmount2
    const parsedBetAmount = Number.parseFloat(betAmount)
    if (isNaN(parsedBetAmount) || parsedBetAmount < 10 || parsedBetAmount > 10000) {
      toast.error("Invalid Bet Amount", { description: "Bet must be between 10 and 10,000 KES." })
      return
    }
    if (parsedBetAmount > walletBalance) {
      toast.error("Insufficient Balance", { description: "Please deposit funds to place this bet." })
      return
    }
    const autoCashout = betNumber === 1 ? autoCashout1 : autoCashout2
    const parsedAutoCashout = autoCashout ? Number.parseFloat(autoCashout) : undefined
    if (parsedAutoCashout && (isNaN(parsedAutoCashout) || parsedAutoCashout < 1.01)) {
      toast.error("Invalid Auto Cashout", { description: "Auto cashout must be at least 1.01x." })
      return
    }

    try {
      const payload = {
        amount: parsedBetAmount,
        user_id: user.id,
        auto_cashout: parsedAutoCashout,
        round_id: currentRoundId || undefined,
      }
      console.log("Placing bet:", payload)
      const response = await api.placeAviatorBet(payload)
      console.log("API Response:", response)

      if (response.data && response.status === 201) {
        if (betNumber === 1) setHasBet1(true)
        else setHasBet2(true)
        await fetchWalletBalance()
        toast.success("Bet Placed!", {
          description: `KES ${parsedBetAmount.toFixed(2)}${
            parsedAutoCashout ? ` with auto cashout at ${parsedAutoCashout.toFixed(2)}x` : ""
          } placed successfully.`,
        })
      } else {
        toast.error("Failed to Place Bet", {
          description: response.error || "Unknown error. Please try again.",
        })
      }
    } catch (error: any) {
      console.error("Error in handlePlaceBet:", error)
      toast.error("Error Placing Bet", {
        description: error.message || "Network error or server issue. Please try again.",
      })
    }
  }

  const handleCashOut = async (betNumber: 1 | 2) => {
    if (!user || (betNumber === 1 ? !hasBet1 : !hasBet2)) {
      toast.info("No Active Bet", { description: "You don't have an active bet to cash out." })
      return
    }
    if (!isRoundActive) {
      toast.error("Round Ended", { description: "The round has already crashed." })
      return
    }

    try {
      await cashOut(user.id, currentMultiplier)
      if (betNumber === 1) setHasBet1(false)
      else setHasBet2(false)
      await fetchWalletBalance()
      toast.success("Cashed Out!", { description: `You cashed out at ${currentMultiplier.toFixed(2)}x.` })
      try {
        const response = await fetch("/sounds/cashout.mp3", { method: "HEAD" })
        if (response.ok) {
          const audio = new Audio("/sounds/cashout.mp3")
          await audio.play()
          console.log("Cashout sound played")
        }
      } catch (err) {
        console.warn("Cashout sound not available:", err)
      }
    } catch (error: any) {
      console.error("Error in handleCashOut:", error)
      toast.error("Error Cashing Out", { description: error.message || "Failed to cash out. Please try again." })
    }
  }

  const getMultiplierColor = (multiplier: number) => {
    if (multiplier < 2) return "text-red-600"
    if (multiplier < 5) return "text-yellow-500"
    if (multiplier < 10) return "text-green-500"
    if (multiplier < 20) return "text-blue-500"
    return "text-[#FFD700]"
  }

  const adjustAmount = (setter: React.Dispatch<React.SetStateAction<string>>, increment: boolean, step: number) => {
    setter((prev) => {
      const current = Number.parseFloat(prev) || 0
      const newAmount = increment ? current + step : Math.max(10, current - step)
      return newAmount.toFixed(2)
    })
  }

  return (
    <div className={styles.container}>
      {/* Header with Wallet Balance */}
      <div className={styles.header}>
        <h1 className={styles.headerTitle}>
          <Plane className="w-6 h-6 sm:w-8 sm:h-8 mr-2 text-[#FF0000]" />
          Aviator
        </h1>
        <div className={styles.walletBadge}>
          <DollarSign className="w-4 h-4 sm:w-5 sm:h-5 text-[#FFD700]" />
          <WalletBalance />
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Past Crashes */}
        <div className={styles.crashHistory}>
          <div className={styles.crashRow}>
            {pastCrashes.slice(0, 12).map((crash, index) => (
              <div
                key={index}
                className={cn(
                  "px-4 py-2 rounded-full text-sm font-semibold min-w-[80px] text-center",
                  crash < 2
                    ? "bg-red-600/20 text-red-600"
                    : crash < 5
                    ? "bg-yellow-500/20 text-yellow-500"
                    : crash < 10
                    ? "bg-green-500/20 text-green-500"
                    : crash < 20
                    ? "bg-blue-500/20 text-blue-500"
                    : "bg-[#FFD700]/20 text-[#FFD700]"
                )}
              >
                {crash.toFixed(2)}x
              </div>
            ))}
          </div>
        </div>

        <div className={styles.gameGrid}>
          {/* Main Game Area */}
          <div>
            <Card className={styles.gameCard}>
              <div
                className={cn(
                  styles.gameArea,
                  isRoundActive ? styles.gameAreaActive : styles.gameAreaInactive
                )}
              >
                {isBettingPhase ? (
                  <div className={styles.countdownContainer}>
                    <div className={styles.countdownText}>{roundCountdown}s</div>
                    <div className={styles.waitingText}>Next round in...</div>
                    <Plane className={styles.plane} />
                  </div>
                ) : (
                  <div className={styles.gameActive}>
                    <div
                      className={cn(styles.multiplier, getMultiplierColor(currentMultiplier))}
                      aria-live="polite"
                      aria-label={`Current multiplier: ${currentMultiplier.toFixed(2)}x`}
                    >
                      {currentMultiplier.toFixed(2)}x
                    </div>
                    <Plane
                      className={cn(
                        isRoundActive ? styles.planeActive : styles.planeInactive
                      )}
                    />
                    <div className={styles.statusText}>
                      {isRoundActive ? "Flying..." : "Crashed!"}
                    </div>
                  </div>
                )}
              </div>
              <div className="p-3 text-center">
                <div
                  className={cn(
                    styles.connectionStatus,
                    isConnected ? "bg-green-500/20 text-green-500" : "bg-red-600/20 text-red-600"
                  )}
                >
                  <div
                    className={cn(
                      styles.connectionDot,
                      isConnected ? "bg-green-500" : "bg-red-600"
                    )}
                  />
                  {isConnected ? "Connected" : "Disconnected"}
                </div>
              </div>
            </Card>

            {/* Betting Controls */}
            <div className={styles.bettingGrid}>
              {[1, 2].map((betNumber) => (
                <Card key={betNumber} className={styles.betCard}>
                  <CardHeader className="p-0 mb-2">
                    <CardTitle className={styles.betTitle}>Bet {betNumber}</CardTitle>
                  </CardHeader>
                  <CardContent className="p-0 space-y-2">
                    <div>
                      <label className={styles.inputLabel}>Bet Amount (KES)</label>
                      <div className={styles.inputContainer}>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => adjustAmount(betNumber === 1 ? setBetAmount1 : setBetAmount2, false, 10)}
                          className="bg-[#2A2A2A] text-white border-[#3A3A3A] hover:bg-[#3A3A3A] w-8 h-8 sm:w-9 sm:h-9 rounded-full"
                        >
                          <Minus className="w-4 h-4" />
                        </Button>
                        <Input
                          type="number"
                          value={betNumber === 1 ? betAmount1 : betAmount2}
                          onChange={(e) =>
                            (betNumber === 1 ? setBetAmount1 : setBetAmount2)(e.target.value)
                          }
                          className="bg-[#2A2A2A] border-[#3A3A3A] text-white text-center h-8 sm:h-9 text-sm sm:text-base"
                          min="10"
                          max="10000"
                          step="0.01"
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => adjustAmount(betNumber === 1 ? setBetAmount1 : setBetAmount2, true, 10)}
                          className="bg-[#2A2A2A] text-white border-[#3A3A3A] hover:bg-[#3A3A3A] w-8 h-8 sm:w-9 sm:h-9 rounded-full"
                        >
                          <Plus className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    <div>
                      <label className={styles.inputLabel}>Auto Cashout (x)</label>
                      <div className={styles.inputContainer}>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => adjustAmount(betNumber === 1 ? setAutoCashout1 : setAutoCashout2, false, 0.1)}
                          className="bg-[#2A2A2A] text-white border-[#3A3A3A] hover:bg-[#3A3A3A] w-8 h-8 sm:w-9 sm:h-9 rounded-full"
                        >
                          <Minus className="w-4 h-4" />
                        </Button>
                        <Input
                          type="number"
                          value={betNumber === 1 ? autoCashout1 : autoCashout2}
                          onChange={(e) =>
                            (betNumber === 1 ? setAutoCashout1 : setAutoCashout2)(e.target.value)
                          }
                          className="bg-[#2A2A2A] border-[#3A3A3A] text-white text-center h-8 sm:h-9 text-sm sm:text-base"
                          placeholder="e.g., 2.00"
                          min="1.01"
                          step="0.01"
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => adjustAmount(betNumber === 1 ? setAutoCashout1 : setAutoCashout2, true, 0.1)}
                          className="bg-[#2A2A2A] text-white border-[#3A3A3A] hover:bg-[#3A3A3A] w-8 h-8 sm:w-9 sm:h-9 rounded-full"
                        >
                          <Plus className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    <Button
                      onClick={() => handlePlaceBet(betNumber as 1 | 2)}
                      disabled={
                        !isConnected ||
                        !user ||
                        !isBettingPhase ||
                        (betNumber === 1 ? hasBet1 : hasBet2)
                      }
                      className={cn(
                        styles.betButton,
                        isRoundActive && (betNumber === 1 ? hasBet1 : hasBet2)
                          ? "bg-red-600 hover:bg-red-700"
                          : "bg-[#FFD700] hover:bg-[#FFD700]/90 text-black"
                      )}
                    >
                      {isRoundActive && (betNumber === 1 ? hasBet1 : hasBet2) ? (
                        <div className="flex items-center justify-center">
                          <Banknote className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                          Cash Out @ {currentMultiplier.toFixed(2)}x
                        </div>
                      ) : (
                        <div className="flex items-center justify-center">
                          <DollarSign className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                          Bet
                        </div>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
            {sureOdds && (
              <div className={styles.sureOdds}>
                <ShieldCheck className="inline w-4 h-4 mr-1" /> Sure Odds: {sureOdds.toFixed(2)}x
              </div>
            )}
          </div>

          {/* Side Panels */}
          <div className={styles.sidePanels}>
            {/* Top Winners */}
            <Card className={styles.sideCard}>
              <CardHeader className="p-0 mb-2">
                <CardTitle className={styles.sideTitle}>
                  <Trophy className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-[#FFD700]" /> Top Winners
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0 space-y-2">
                {topWinners.length > 0 ? (
                  topWinners.slice(0, 5).map((winner, index) => (
                    <div key={index} className={styles.winnerItem}>
                      <div className="flex items-center space-x-2">
                        <div className={styles.avatar}>
                          <span>{winner.username.charAt(0).toUpperCase()}</span>
                        </div>
                        <span className={styles.username}>{winner.username}</span>
                      </div>
                      <div className="text-right">
                        <div className="text-green-500 text-xs sm:text-sm font-medium">
                          KES {Number.parseFloat(winner.amount).toFixed(2)}
                        </div>
                        <div className="text-gray-400 text-xs">
                          {winner.cashed_out_at.toFixed(2)}x
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className={styles.noData}>No winners yet</div>
                )}
              </CardContent>
            </Card>

            {/* Live Bets */}
            <Card className={styles.sideCard}>
              <CardHeader className="p-0 mb-2">
                <CardTitle className={styles.sideTitle}>
                  <Users className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-[#FFD700]" /> Live Bets
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0 space-y-2">
                {recentCashouts.length > 0 ? (
                  recentCashouts.slice(0, 5).map((bet, index) => (
                    <div key={index} className={styles.betItem}>
                      <span className={styles.username}>{bet.username || "Anonymous"}</span>
                      <div className="text-right">
                        <div className="text-green-500 text-xs sm:text-sm font-medium">
                          KES {(bet.amount || 0).toFixed(2)}
                        </div>
                        {bet.multiplier && (
                          <div className="text-gray-400 text-xs">
                            Cashed out at {bet.multiplier.toFixed(2)}x
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className={styles.noData}>No live bets</div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}