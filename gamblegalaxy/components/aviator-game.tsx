"use client"

import { useState, useEffect, useRef } from "react"
import { useAuth } from "@/contexts/auth-context"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { motion } from "framer-motion"
import { Plane, TrendingUp, Zap, Users, Clock, DollarSign } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface GameState {
  roundId: number | null
  multiplier: number
  isActive: boolean
  status: "betting" | "flying" | "crashed"
  countdown: number
  livePlayersCount: number
  recentCashouts: Array<{
    username: string
    amount: string
    multiplier: number
    timestamp: string
  }>
}

interface UserBet {
  betId: number | null
  amount: number
  autoCashout: number | null
  isPlaced: boolean
  isCashedOut: boolean
  winAmount: number
}

export default function AviatorGame() {
  const { user, token } = useAuth()
  const { toast } = useToast()
  const wsRef = useRef<WebSocket | null>(null)
  const [gameState, setGameState] = useState<GameState>({
    roundId: null,
    multiplier: 1.0,
    isActive: false,
    status: "betting",
    countdown: 0,
    livePlayersCount: 0,
    recentCashouts: [],
  })

  const [userBet, setUserBet] = useState<UserBet>({
    betId: null,
    amount: 0,
    autoCashout: null,
    isPlaced: false,
    isCashedOut: false,
    winAmount: 0,
  })

  const [betAmount, setBetAmount] = useState("")
  const [autoCashout, setAutoCashout] = useState("")
  const [balance, setBalance] = useState(0)
  const [recentCrashes, setRecentCrashes] = useState<number[]>([])

  useEffect(() => {
    connectWebSocket()
    fetchBalance()
    fetchRecentCrashes()

    return () => {
      if (wsRef.current) {
        wsRef.current.close()
      }
    }
  }, [])

  const connectWebSocket = () => {
    const wsUrl = `${process.env.NEXT_PUBLIC_WS_URL}/ws/aviator/`
    wsRef.current = new WebSocket(wsUrl)

    wsRef.current.onopen = () => {
      console.log("WebSocket connected")
      // Request current game state
      wsRef.current?.send(JSON.stringify({ action: "get_game_state" }))
    }

    wsRef.current.onmessage = (event) => {
      const data = JSON.parse(event.data)
      handleWebSocketMessage(data)
    }

    wsRef.current.onclose = () => {
      console.log("WebSocket disconnected")
      // Reconnect after 3 seconds
      setTimeout(connectWebSocket, 3000)
    }

    wsRef.current.onerror = (error) => {
      console.error("WebSocket error:", error)
    }
  }

  const handleWebSocketMessage = (data: any) => {
    switch (data.type) {
      case "betting_open":
        setGameState((prev) => ({
          ...prev,
          roundId: data.round_id,
          status: "betting",
          countdown: data.countdown,
          multiplier: 1.0,
          isActive: false,
        }))
        // Reset user bet for new round
        setUserBet({
          betId: null,
          amount: 0,
          autoCashout: null,
          isPlaced: false,
          isCashedOut: false,
          winAmount: 0,
        })
        break

      case "round_started":
        setGameState((prev) => ({
          ...prev,
          status: "flying",
          isActive: true,
          multiplier: data.multiplier,
        }))
        break

      case "multiplier":
        setGameState((prev) => ({
          ...prev,
          multiplier: data.multiplier,
          livePlayersCount: data.live_players || prev.livePlayersCount,
        }))
        break

      case "crash":
        setGameState((prev) => ({
          ...prev,
          status: "crashed",
          isActive: false,
          multiplier: data.crash_multiplier,
        }))
        setRecentCrashes((prev) => [data.crash_multiplier, ...prev.slice(0, 9)])

        // Check if user lost
        if (userBet.isPlaced && !userBet.isCashedOut) {
          toast({
            title: "Crashed! 💥",
            description: `The plane crashed at ${data.crash_multiplier}x. Better luck next time!`,
            variant: "destructive",
          })
        }
        break

      case "player_cashed_out":
        setGameState((prev) => ({
          ...prev,
          recentCashouts: data.recent_cashouts || prev.recentCashouts,
        }))
        break

      case "bet_placed":
        setUserBet((prev) => ({
          ...prev,
          betId: data.bet_id,
          amount: data.amount,
          isPlaced: true,
        }))
        setBalance(data.new_balance)
        toast({
          title: "Bet Placed! 🎯",
          description: `₦${data.amount} bet placed successfully`,
        })
        break

      case "manual_cashout_success":
        setUserBet((prev) => ({
          ...prev,
          isCashedOut: true,
          winAmount: data.win_amount,
        }))
        setBalance(data.new_balance)
        toast({
          title: "Cashed Out! 🎉",
          description: `You won ₦${data.win_amount} at ${data.multiplier}x`,
        })
        break

      case "bet_error":
      case "manual_cashout_error":
        toast({
          title: "Error",
          description: data.message,
          variant: "destructive",
        })
        break
    }
  }

  const fetchBalance = async () => {
    try {
      const response = await fetch("/api/games/balance", {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (response.ok) {
        const data = await response.json()
        setBalance(data.balance)
      }
    } catch (error) {
      console.error("Error fetching balance:", error)
    }
  }

  const fetchRecentCrashes = async () => {
    try {
      const response = await fetch("/api/games/aviator/past-crashes")
      if (response.ok) {
        const data = await response.json()
        setRecentCrashes(data.map((round: any) => round.crash_multiplier))
      }
    } catch (error) {
      console.error("Error fetching recent crashes:", error)
    }
  }

  const placeBet = () => {
    if (!betAmount || Number.parseFloat(betAmount) <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid bet amount",
        variant: "destructive",
      })
      return
    }

    if (Number.parseFloat(betAmount) > balance) {
      toast({
        title: "Insufficient Balance",
        description: "You don't have enough balance for this bet",
        variant: "destructive",
      })
      return
    }

    const betData = {
      action: "place_bet",
      round_id: gameState.roundId,
      amount: Number.parseFloat(betAmount),
      auto_cashout: autoCashout ? Number.parseFloat(autoCashout) : null,
      bet_number: 1,
    }

    wsRef.current?.send(JSON.stringify(betData))
  }

  const cashOut = () => {
    if (!userBet.isPlaced || userBet.isCashedOut) return

    const cashoutData = {
      action: "cashout",
      bet_id: userBet.betId,
      multiplier: gameState.multiplier,
    }

    wsRef.current?.send(JSON.stringify(cashoutData))
  }

  const getMultiplierColor = (multiplier: number) => {
    if (multiplier < 2) return "text-white"
    if (multiplier < 5) return "text-green-400"
    if (multiplier < 10) return "text-yellow-400"
    if (multiplier < 20) return "text-orange-400"
    return "text-red-400"
  }

  const getCrashColor = (crash: number) => {
    if (crash < 2) return "bg-red-500/20 text-red-300"
    if (crash < 5) return "bg-yellow-500/20 text-yellow-300"
    if (crash < 10) return "bg-green-500/20 text-green-300"
    return "bg-purple-500/20 text-purple-300"
  }

  return (
    <div className="space-y-6">
      {/* Game Display */}
      <Card className="glass-card relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5"></div>
        <CardContent className="p-8 relative">
          {/* Game Status */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center space-x-4 mb-4">
              <Badge
                className={
                  gameState.status === "betting"
                    ? "bg-blue-500/20 text-blue-300 border-blue-500/30"
                    : gameState.status === "flying"
                      ? "bg-green-500/20 text-green-300 border-green-500/30"
                      : "bg-red-500/20 text-red-300 border-red-500/30"
                }
              >
                {gameState.status === "betting"
                  ? "PLACE YOUR BETS"
                  : gameState.status === "flying"
                    ? "FLYING"
                    : "CRASHED"}
              </Badge>
              <Badge className="bg-gray-500/20 text-gray-300">
                <Users className="w-3 h-3 mr-1" />
                {gameState.livePlayersCount} players
              </Badge>
            </div>

            {/* Multiplier Display */}
            <motion.div
              key={gameState.multiplier}
              initial={{ scale: 1 }}
              animate={{ scale: gameState.status === "flying" ? [1, 1.1, 1] : 1 }}
              transition={{ duration: 0.3 }}
              className="relative"
            >
              <div className="text-8xl font-bold mb-4">
                <span className={getMultiplierColor(gameState.multiplier)}>{gameState.multiplier.toFixed(2)}x</span>
              </div>

              {/* Plane Animation */}
              <motion.div
                animate={{
                  x: gameState.status === "flying" ? [0, 50, 0] : 0,
                  y: gameState.status === "flying" ? [0, -20, 0] : 0,
                  rotate: gameState.status === "crashed" ? 180 : 0,
                }}
                transition={{
                  duration: gameState.status === "flying" ? 2 : 0.5,
                  repeat: gameState.status === "flying" ? Number.POSITIVE_INFINITY : 0,
                }}
                className="inline-block"
              >
                <Plane className={`w-16 h-16 ${gameState.status === "crashed" ? "text-red-400" : "text-blue-400"}`} />
              </motion.div>
            </motion.div>

            {/* Countdown */}
            {gameState.status === "betting" && gameState.countdown > 0 && (
              <div className="text-2xl font-bold text-yellow-400">Starting in {gameState.countdown}s</div>
            )}
          </div>

          {/* Betting Interface */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Bet Controls */}
            <Card className="glass">
              <CardContent className="p-6">
                <h3 className="text-white font-bold mb-4 flex items-center">
                  <DollarSign className="w-5 h-5 mr-2 text-green-400" />
                  Place Bet
                </h3>

                <div className="space-y-4">
                  <div>
                    <label className="text-gray-300 text-sm mb-2 block">Bet Amount (₦)</label>
                    <Input
                      type="number"
                      value={betAmount}
                      onChange={(e) => setBetAmount(e.target.value)}
                      placeholder="Enter amount"
                      className="glass-input text-white"
                      disabled={gameState.status !== "betting" || userBet.isPlaced}
                    />
                  </div>

                  <div>
                    <label className="text-gray-300 text-sm mb-2 block">Auto Cash Out (Optional)</label>
                    <Input
                      type="number"
                      value={autoCashout}
                      onChange={(e) => setAutoCashout(e.target.value)}
                      placeholder="e.g., 2.00"
                      className="glass-input text-white"
                      disabled={gameState.status !== "betting" || userBet.isPlaced}
                    />
                  </div>

                  {/* Quick Amounts */}
                  <div className="grid grid-cols-4 gap-2">
                    {[100, 500, 1000, 5000].map((amount) => (
                      <Button
                        key={amount}
                        onClick={() => setBetAmount(amount.toString())}
                        variant="outline"
                        size="sm"
                        className="glass-button text-xs"
                        disabled={gameState.status !== "betting" || userBet.isPlaced}
                      >
                        ₦{amount}
                      </Button>
                    ))}
                  </div>

                  {/* Bet Button */}
                  {!userBet.isPlaced ? (
                    <Button
                      onClick={placeBet}
                      disabled={gameState.status !== "betting" || !betAmount}
                      className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
                    >
                      <Zap className="w-4 h-4 mr-2" />
                      Place Bet
                    </Button>
                  ) : (
                    <Button
                      onClick={cashOut}
                      disabled={gameState.status !== "flying" || userBet.isCashedOut}
                      className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 animate-pulse"
                    >
                      {userBet.isCashedOut ? "Cashed Out!" : "Cash Out"}
                    </Button>
                  )}

                  {/* User Bet Info */}
                  {userBet.isPlaced && (
                    <div className="glass p-3 rounded-lg">
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-gray-400">Your Bet:</span>
                        <span className="text-white">₦{userBet.amount}</span>
                      </div>
                      {userBet.autoCashout && (
                        <div className="flex justify-between text-sm mb-2">
                          <span className="text-gray-400">Auto Cash Out:</span>
                          <span className="text-yellow-400">{userBet.autoCashout}x</span>
                        </div>
                      )}
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Potential Win:</span>
                        <span className="text-green-400">₦{(userBet.amount * gameState.multiplier).toFixed(2)}</span>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Live Activity */}
            <Card className="glass">
              <CardContent className="p-6">
                <h3 className="text-white font-bold mb-4 flex items-center">
                  <TrendingUp className="w-5 h-5 mr-2 text-blue-400" />
                  Live Activity
                </h3>

                <div className="space-y-3 max-h-64 overflow-y-auto scrollbar-hide">
                  {gameState.recentCashouts.map((cashout, index) => (
                    <motion.div
                      key={`${cashout.username}-${cashout.timestamp}`}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex items-center justify-between p-2 glass rounded-lg"
                    >
                      <div className="flex items-center space-x-2">
                        <div className="w-6 h-6 bg-green-500/20 rounded-full flex items-center justify-center">
                          <span className="text-green-400 text-xs">✓</span>
                        </div>
                        <span className="text-white text-sm font-medium">{cashout.username}</span>
                      </div>
                      <div className="text-right">
                        <p className="text-green-400 font-bold text-sm">₦{cashout.amount}</p>
                        <p className="text-gray-400 text-xs">{cashout.multiplier.toFixed(2)}x</p>
                      </div>
                    </motion.div>
                  ))}

                  {gameState.recentCashouts.length === 0 && (
                    <div className="text-center py-8 text-gray-400">
                      <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No recent cashouts</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>

      {/* Recent Crashes */}
      <Card className="glass-card">
        <CardContent className="p-6">
          <h3 className="text-white font-bold mb-4 flex items-center">
            <Clock className="w-5 h-5 mr-2 text-gray-400" />
            Recent Crashes
          </h3>
          <div className="flex flex-wrap gap-2">
            {recentCrashes.map((crash, index) => (
              <Badge key={index} className={getCrashColor(crash)}>
                {crash.toFixed(2)}x
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Balance Display */}
      <Card className="glass-card">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-gray-400 text-sm">Your Balance</p>
                <p className="text-2xl font-bold text-white">₦{balance.toLocaleString()}</p>
              </div>
            </div>
            <Button onClick={fetchBalance} variant="outline" size="sm" className="glass-button bg-transparent">
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
