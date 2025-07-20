"use client"

import type React from "react"

import { useEffect, useState, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useWebSocket } from "@/lib/websocket" // Assuming this is correctly implemented
import { useAuth } from "@/lib/auth" // Assuming this is correctly implemented
import { api } from "@/lib/api" // Assuming this is correctly implemented
import {
  Plane,
  TrendingUp,
  Users,
  Trophy,
  ShieldCheck,
  Plus,
  Minus,
  Sparkles,
  Loader2,
  DollarSign,
  Banknote,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "sonner" // Using sonner for toasts
import { WalletBalance } from "@/components/wallet/wallet-balance" // Reusing WalletBalance component
import type { TopWinner } from "@/lib/types" // Assuming types are defined

export function AviatorGame() {
  const { user } = useAuth()
  const {
    connect,
    disconnect,
    isConnected,
    currentMultiplier,
    isRoundActive,
    cashOut,
    // isCashingOut, // Removed: not available from useWebSocket
  } = useWebSocket()

  const [betAmount, setBetAmount] = useState("100")
  const [autoCashout, setAutoCashout] = useState("")
  const [hasBet, setHasBet] = useState(false)
  const [topWinners, setTopWinners] = useState<TopWinner[]>([])
  const [pastCrashes, setPastCrashes] = useState<number[]>([])
  const [walletBalance, setWalletBalance] = useState<number>(0)
  const [sureOdds, setSureOdds] = useState<number | null>(null)
  const [isBettingPhase, setIsBettingPhase] = useState(true) // New state for betting phase
  const [roundCountdown, setRoundCountdown] = useState(5) // Countdown for next round
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null)

  // Connect to WebSocket and load initial data
  useEffect(() => {
    connect()
    loadGameData()
    fetchWalletBalance()
    fetchSureOdds()
    return () => disconnect()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Handle round state changes and countdown
  useEffect(() => {
    if (!isRoundActive) {
      setIsBettingPhase(true)
      setRoundCountdown(5) // Reset countdown for next round
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current)
      }
      countdownIntervalRef.current = setInterval(() => {
        setRoundCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(countdownIntervalRef.current!)
            setIsBettingPhase(false) // Start flying phase
            loadGameData() // Refresh data for new round
            return 0
          }
          return prev - 1
        })
      }, 1000)
    } else {
      setIsBettingPhase(false)
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current)
      }
    }
  }, [isRoundActive]) // eslint-disable-line react-hooks/exhaustive-deps

  const loadGameData = async () => {
    try {
      const [winnersRes, crashesRes] = await Promise.all([api.getTopWinners(), api.getPastCrashes()])
      if (winnersRes.data) setTopWinners(winnersRes.data)
      if (crashesRes.data) {
        setPastCrashes(crashesRes.data.map((round: any) => round.crash_multiplier))
      }
    } catch (error) {
      toast.error("Failed to load game data", { description: "Could not fetch winners or past crashes." })
    }
  }

  const fetchWalletBalance = async () => {
    if (user) {
      try {
        const res = await api.getWallet()
        if (res.data) setWalletBalance(Number(res.data.balance))
      } catch (error) {
        toast.error("Failed to load wallet balance", { description: "Please check your connection." })
      }
    }
  }

  const fetchSureOdds = async () => {
    try {
      const res = await api.getSureOdds()
      if (res.data && res.data.odd && typeof res.data.odd.odd === "number") {
        setSureOdds(res.data.odd.odd)
      }
    } catch (error) {
      // console.error("Failed to fetch sure odds:", error);
      // Not critical, so no toast for this
    }
  }

  const handlePlaceBet = async () => {
    if (!user) {
      toast.error("Login Required", { description: "Please log in to place bets." })
      return
    }
    if (hasBet) {
      toast.info("Bet Already Placed", { description: "You can only place one bet per round." })
      return
    }
    const parsedBetAmount = Number.parseFloat(betAmount)
    if (isNaN(parsedBetAmount) || parsedBetAmount <= 0) {
      toast.error("Invalid Bet Amount", { description: "Please enter a valid positive number." })
      return
    }
    if (parsedBetAmount > walletBalance) {
      toast.error("Insufficient Balance", { description: "Please deposit funds to place this bet." })
      return
    }

    try {
      const response = await api.placeAviatorBet(parsedBetAmount)
      if (response.data) {
        setHasBet(true)
        fetchWalletBalance()
        toast.success("Bet Placed!", { description: `KES ${parsedBetAmount.toFixed(2)} placed successfully.` })
      } else {
        toast.error("Failed to Place Bet", { description: response.error || "Please try again." })
      }
    } catch (error) {
      toast.error("Error Placing Bet", { description: "Network error or server issue." })
    }
  }

  const handleCashOut = () => {
    if (!user || !hasBet) {
      toast.info("No Active Bet", { description: "You don't have an active bet to cash out." })
      return
    }
    if (!isRoundActive) {
      toast.error("Round Ended", { description: "The round has already crashed." })
      return
    }

    cashOut(user.id, currentMultiplier)
    setHasBet(false)
    fetchWalletBalance()
    toast.success("Cashed Out!", { description: `You cashed out at ${currentMultiplier.toFixed(2)}x.` })
  }

  const getMultiplierColor = (multiplier: number) => {
    if (multiplier < 2) return "text-red-400"
    if (multiplier < 5) return "text-yellow-400"
    if (multiplier < 10) return "text-green-400"
    if (multiplier < 20) return "text-blue-400"
    return "text-purple-400"
  }

  const getMultiplierBg = (multiplier: number) => {
    if (multiplier < 2) return "from-red-500/20 to-red-600/20"
    if (multiplier < 5) return "from-yellow-500/20 to-yellow-600/20"
    if (multiplier < 10) return "from-green-500/20 to-green-600/20"
    if (multiplier < 20) return "from-blue-500/20 to-blue-600/20"
    return "from-purple-500/20 to-purple-600/20"
  }

  const adjustAmount = (setter: React.Dispatch<React.SetStateAction<string>>, increment: boolean, step: number) => {
    setter((prev) => {
      const current = Number.parseFloat(prev) || 0
      const newAmount = increment ? current + step : Math.max(0, current - step)
      return newAmount.toString()
    })
  }

  const quickAmounts = [10, 50, 100, 500, 1000]

  return (
    <div className="w-full max-w-7xl mx-auto py-8 sm:py-12">
      <div className="text-center mb-8 sm:mb-12">
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-white mb-4 leading-tight">
          <Plane className="inline-block w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 mr-3 sm:mr-4 text-purple-400 animate-pulse-slow" />
          <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent">
            Aviator Game
          </span>
        </h1>
        <p className="text-gray-300 text-base sm:text-lg max-w-2xl mx-auto">
          Watch the plane soar and cash out before it crashes! Test your nerve and timing.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
        {/* Main Game Area */}
        <div className="lg:col-span-2 space-y-6 sm:space-y-8">
          {/* Multiplier Display Card */}
          <Card className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl sm:rounded-3xl overflow-hidden shadow-lg p-4 sm:p-6 md:p-8 relative">
            {/* Animated Background */}
            <div
              className={cn(
                "absolute inset-0 transition-all duration-500 ease-out opacity-20",
                isRoundActive ? `bg-gradient-to-br ${getMultiplierBg(currentMultiplier)}` : "bg-gray-900/50",
              )}
            />
            <div className="relative z-10 flex flex-col items-center justify-center h-64 sm:h-80">
              {isBettingPhase ? (
                <div className="text-center">
                  <div className="text-5xl sm:text-6xl md:text-7xl font-black text-white mb-4 animate-pulse">
                    Next Round in {roundCountdown}s
                  </div>
                  <Plane className="w-20 h-20 sm:w-24 sm:h-24 text-purple-400 animate-bounce-slow" />
                </div>
              ) : (
                <>
                  <div
                    className={cn(
                      "text-7xl sm:text-8xl md:text-9xl font-black mb-4 transition-colors duration-300",
                      getMultiplierColor(currentMultiplier),
                    )}
                    style={{
                      textShadow: `0 0 20px ${getMultiplierColor(currentMultiplier).replace("text-", "").replace("-400", "-600")}`,
                    }}
                  >
                    {currentMultiplier.toFixed(2)}x
                  </div>
                  <div className="text-gray-300 text-lg sm:text-xl font-semibold">
                    {isRoundActive ? "Flying..." : "Crashed!"}
                  </div>
                  <Plane
                    className={cn(
                      "absolute transition-all duration-500 ease-out",
                      isRoundActive
                        ? "w-24 h-24 sm:w-32 sm:h-32 text-green-400 animate-plane-fly"
                        : "w-20 h-20 sm:w-24 sm:h-24 text-red-400",
                    )}
                  />
                </>
              )}
            </div>
            <div className="mt-6 text-center">
              <div
                className={cn(
                  "inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold shadow-md",
                  isConnected ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400",
                )}
              >
                <div
                  className={cn("w-3 h-3 rounded-full mr-2 animate-pulse", isConnected ? "bg-green-400" : "bg-red-400")}
                />
                {isConnected ? "Connected to Game" : "Disconnected"}
              </div>
            </div>
            <div className="mt-4 text-center">
              <WalletBalance />
            </div>
            {sureOdds && (
              <div className="mt-4 flex items-center justify-center text-blue-400 text-sm sm:text-base font-semibold bg-white/5 backdrop-blur-sm border border-blue-500/30 rounded-xl p-3 shadow-inner">
                <ShieldCheck className="mr-2 w-5 h-5 sm:w-6 sm:h-6 text-blue-400" /> Admin SureOdd Tip: x
                {sureOdds.toFixed(2)}
              </div>
            )}
          </Card>

          {/* Betting Controls Card */}
          <Card className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl sm:rounded-3xl shadow-lg p-4 sm:p-6 md:p-8">
            <CardHeader className="p-0 mb-4">
              <CardTitle className="text-white text-xl sm:text-2xl flex items-center">
                <DollarSign className="w-5 h-5 sm:w-6 sm:h-6 mr-2 text-green-400" />
                Place Your Bet
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0 space-y-4 sm:space-y-6">
              {/* Quick Amount Buttons for Bet Amount */}
              <div>
                <label className="block text-xs sm:text-sm font-semibold text-gray-300 mb-1.5 sm:mb-2">
                  Bet Amount (KES)
                </label>
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 sm:gap-3">
                  {quickAmounts.map((val) => (
                    <Button
                      key={`bet-${val}`}
                      type="button"
                      variant="ghost"
                      onClick={() => setBetAmount(val.toString())}
                      className={`text-xs sm:text-sm py-2 sm:py-2.5 rounded-lg sm:rounded-xl transition-all duration-300 ${
                        betAmount === val.toString()
                          ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg"
                          : "bg-white/10 text-gray-300 hover:bg-white/20 hover:text-white"
                      }`}
                    >
                      {val.toLocaleString()}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Bet Amount Input with Controls */}
              <div>
                <div className="flex items-center space-x-2 sm:space-x-3">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => adjustAmount(setBetAmount, false, 10)}
                    className="bg-white/10 hover:bg-white/20 text-white rounded-lg sm:rounded-xl p-2 sm:p-2.5"
                  >
                    <Minus className="w-4 h-4 sm:w-5 sm:h-5" />
                  </Button>
                  <Input
                    type="number"
                    value={betAmount}
                    onChange={(e) => setBetAmount(e.target.value)}
                    className="flex-1 bg-white/10 border-white/20 placeholder:text-gray-400 text-white text-center text-base sm:text-lg font-bold rounded-lg sm:rounded-xl h-10 sm:h-12 focus:border-purple-400 transition-all duration-300"
                    min="1"
                    step="0.01"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => adjustAmount(setBetAmount, true, 10)}
                    className="bg-white/10 hover:bg-white/20 text-white rounded-lg sm:rounded-xl p-2 sm:p-2.5"
                  >
                    <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
                  </Button>
                </div>
              </div>

              {/* Auto Cash Out Input with Controls */}
              <div>
                <label className="block text-xs sm:text-sm font-semibold text-gray-300 mb-1.5 sm:mb-2">
                  Auto Cash Out (Optional)
                </label>
                <div className="flex items-center space-x-2 sm:space-x-3">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => adjustAmount(setAutoCashout, false, 0.1)}
                    className="bg-white/10 hover:bg-white/20 text-white rounded-lg sm:rounded-xl p-2 sm:p-2.5"
                  >
                    <Minus className="w-4 h-4 sm:w-5 sm:h-5" />
                  </Button>
                  <Input
                    type="number"
                    value={autoCashout}
                    onChange={(e) => setAutoCashout(e.target.value)}
                    className="flex-1 bg-white/10 border-white/20 placeholder:text-gray-400 text-white text-center text-base sm:text-lg font-bold rounded-lg sm:rounded-xl h-10 sm:h-12 focus:border-purple-400 transition-all duration-300"
                    placeholder="2.00"
                    min="1.01"
                    step="0.01"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => adjustAmount(setAutoCashout, true, 0.1)}
                    className="bg-white/10 hover:bg-white/20 text-white rounded-lg sm:rounded-xl p-2 sm:p-2.5"
                  >
                    <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
                  </Button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4">
                {!hasBet ? (
                  <>
                    <Button
                      onClick={handlePlaceBet}
                      disabled={!isConnected || !user || !isBettingPhase}
                      className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-bold py-3 sm:py-4 rounded-xl sm:rounded-2xl transition-all duration-300 hover:scale-[1.02] shadow-lg hover:shadow-green-500/25 disabled:opacity-50 disabled:cursor-not-allowed text-base sm:text-lg"
                    >
                      <div className="flex items-center justify-center">
                        <DollarSign className="w-5 h-5 mr-2" />
                        Place Bet
                        <Sparkles className="w-4 h-4 ml-2" />
                      </div>
                    </Button>
                    <Button
                      onClick={handleCashOut}
                      disabled={!isRoundActive}
                      className="w-full bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white font-bold py-3 sm:py-4 rounded-xl sm:rounded-2xl transition-all duration-300 hover:scale-[1.02] shadow-lg hover:shadow-red-500/25 disabled:opacity-50 disabled:cursor-not-allowed text-base sm:text-lg"
                    >
                      <div className="flex items-center justify-center">
                        <Banknote className="w-5 h-5 mr-2" />
                        Cash Out @ {currentMultiplier.toFixed(2)}x
                        <Sparkles className="w-4 h-4 ml-2" />
                      </div>
                    </Button>
                  </>
                ) : null}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Side Panels */}
        <div className="space-y-6 sm:space-y-8">
          {/* Past Crashes */}
          <Card className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl sm:rounded-3xl shadow-lg p-4 sm:p-6">
            <CardHeader className="p-0 mb-4">
              <CardTitle className="text-white text-xl sm:text-2xl flex items-center">
                <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 mr-2 text-blue-400" /> Past Crashes
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0 grid grid-cols-4 sm:grid-cols-5 gap-2">
              {pastCrashes.slice(0, 20).map((crash, index) => (
                <div
                  key={index}
                  className={cn(
                    "text-center py-2 px-1 rounded-lg text-sm font-semibold transition-all duration-300 hover:scale-110 shadow-md",
                    crash < 2
                      ? "bg-red-500/20 text-red-400"
                      : crash < 5
                        ? "bg-yellow-500/20 text-yellow-400"
                        : crash < 10
                          ? "bg-green-500/20 text-green-400"
                          : crash < 20
                            ? "bg-blue-500/20 text-blue-400"
                            : "bg-purple-500/20 text-purple-400",
                  )}
                >
                  {crash.toFixed(2)}x
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Top Winners Today */}
          <Card className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl sm:rounded-3xl shadow-lg p-4 sm:p-6">
            <CardHeader className="p-0 mb-4">
              <CardTitle className="text-white text-xl sm:text-2xl flex items-center">
                <Trophy className="w-5 h-5 sm:w-6 sm:h-6 mr-2 text-yellow-400" /> Top Winners Today
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0 space-y-3">
              {topWinners.length > 0 ? (
                topWinners.slice(0, 10).map((winner, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between bg-white/5 rounded-lg p-2 hover:bg-white/10 transition-colors duration-200"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 sm:w-9 sm:h-9 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center shadow-md">
                        <span className="text-white text-sm font-bold">{winner.username.charAt(0).toUpperCase()}</span>
                      </div>
                      <span className="text-white text-sm sm:text-base font-medium truncate max-w-[100px] sm:max-w-[150px]">
                        {winner.username}
                      </span>
                    </div>
                    <div className="text-right">
                      <div className="text-green-400 font-bold text-sm sm:text-base">
                        KES {Number.parseFloat(winner.amount).toFixed(2)}
                      </div>
                      <div className="text-gray-400 text-xs">x{winner.cashed_out_at.toFixed(2)}</div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-4 text-gray-400">No winners yet. Be the first!</div>
              )}
            </CardContent>
          </Card>

          {/* Live Bets (Placeholder) */}
          <Card className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl sm:rounded-3xl shadow-lg p-4 sm:p-6">
            <CardHeader className="p-0 mb-4">
              <CardTitle className="text-white text-xl sm:text-2xl flex items-center">
                <Users className="w-5 h-5 sm:w-6 sm:h-6 mr-2 text-purple-400" /> Live Bets
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0 text-gray-400 text-sm sm:text-base text-center py-8">
              Live bets are currently unavailable.
              <p className="text-gray-500 text-xs mt-2">Feature coming soon!</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Custom Animations */}
      <style jsx>{`
        @keyframes pulse-slow {
          0%, 100% {
            transform: scale(1);
            opacity: 1;
          }
          50% {
            transform: scale(1.05);
            opacity: 0.8;
          }
        }
        .animate-pulse-slow {
          animation: pulse-slow 3s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }

        @keyframes plane-fly {
          0% {
            transform: translate(-50%, 50%) scale(0.5) rotate(0deg);
            opacity: 0;
          }
          10% {
            opacity: 1;
          }
          100% {
            transform: translate(50%, -50%) scale(1.5) rotate(15deg);
            opacity: 0;
          }
        }
        .animate-plane-fly {
          animation: plane-fly 5s linear forwards; /* Adjust duration as needed */
        }
      `}</style>
    </div>
  )
}
