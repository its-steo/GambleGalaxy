"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Plane, Zap } from "lucide-react"
import { useNotification } from "./notification-system"

interface GameRound {
  id: string
  multiplier: number
  crashed: boolean
  timestamp: Date
}

interface Bet {
  amount: number
  cashOutAt?: number
  cashedOut: boolean
  profit: number
}

export default function AviatorGame() {
  const [gameState, setGameState] = useState<"waiting" | "flying" | "crashed">("waiting")
  const [currentMultiplier, setCurrentMultiplier] = useState(1.0)
  const [betAmount, setBetAmount] = useState("")
  const [autoCashOut, setAutoCashOut] = useState("")
  const [currentBet, setCurrentBet] = useState<Bet | null>(null)
  const [gameHistory, setGameHistory] = useState<GameRound[]>([])
  const [countdown, setCountdown] = useState(0)
  const [balance, setBalance] = useState(0)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const { addNotification } = useNotification()

  useEffect(() => {
    // Load balance
    const savedBalance = Number.parseFloat(localStorage.getItem("wallet_balance") || "1000")
    setBalance(savedBalance)

    // Load game history
    const savedHistory = localStorage.getItem("aviator_history")
    if (savedHistory) {
      setGameHistory(JSON.parse(savedHistory))
    }

    // Start game loop
    startNewRound()

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [])

  const startNewRound = () => {
    setGameState("waiting")
    setCurrentMultiplier(1.0)
    setCountdown(5)

    const countdownInterval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(countdownInterval)
          startFlying()
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }

  const startFlying = () => {
    setGameState("flying")
    setCurrentMultiplier(1.0)

    // Random crash point between 1.01x and 50x
    const crashPoint =
      Math.random() < 0.5
        ? 1.01 + Math.random() * 2 // 50% chance of crashing early (1.01x - 3x)
        : 1.5 + Math.random() * 48.5 // 50% chance of going higher (1.5x - 50x)

    intervalRef.current = setInterval(() => {
      setCurrentMultiplier((prev) => {
        const newMultiplier = prev + 0.01

        if (newMultiplier >= crashPoint) {
          crashGame(crashPoint)
          return crashPoint
        }

        // Auto cash out check
        if (currentBet && !currentBet.cashedOut && autoCashOut) {
          const autoCashOutValue = Number.parseFloat(autoCashOut)
          if (newMultiplier >= autoCashOutValue) {
            cashOut(newMultiplier)
          }
        }

        return newMultiplier
      })
    }, 100)
  }

  const crashGame = (crashMultiplier: number) => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
    }

    setGameState("crashed")

    // Add to history
    const newRound: GameRound = {
      id: Date.now().toString(),
      multiplier: crashMultiplier,
      crashed: true,
      timestamp: new Date(),
    }

    const updatedHistory = [newRound, ...gameHistory.slice(0, 19)]
    setGameHistory(updatedHistory)
    localStorage.setItem("aviator_history", JSON.stringify(updatedHistory))

    // Handle bet result
    if (currentBet && !currentBet.cashedOut) {
      addNotification({
        type: "error",
        title: "Crashed!",
        message: `The plane crashed at ${crashMultiplier.toFixed(2)}x. You lost KES ${currentBet.amount}`,
      })
      setCurrentBet(null)
    }

    // Start new round after 3 seconds
    setTimeout(() => {
      startNewRound()
    }, 3000)
  }

  const placeBet = () => {
    if (!betAmount || gameState !== "waiting") return

    const amount = Number.parseFloat(betAmount)
    if (amount > balance) {
      addNotification({
        type: "error",
        title: "Insufficient Balance",
        message: "You don't have enough funds to place this bet",
      })
      return
    }

    const newBalance = balance - amount
    setBalance(newBalance)
    localStorage.setItem("wallet_balance", newBalance.toString())

    setCurrentBet({
      amount,
      cashedOut: false,
      profit: 0,
    })

    addNotification({
      type: "info",
      title: "Bet Placed",
      message: `You bet KES ${amount} on this round`,
    })
  }

  const cashOut = (multiplier?: number) => {
    if (!currentBet || currentBet.cashedOut || gameState !== "flying") return

    const cashOutMultiplier = multiplier || currentMultiplier
    const profit = currentBet.amount * cashOutMultiplier
    const newBalance = balance + profit

    setBalance(newBalance)
    localStorage.setItem("wallet_balance", newBalance.toString())

    setCurrentBet({
      ...currentBet,
      cashedOut: true,
      cashOutAt: cashOutMultiplier,
      profit: profit - currentBet.amount,
    })

    addNotification({
      type: "success",
      title: "Cashed Out!",
      message: `You won KES ${profit.toFixed(2)} at ${cashOutMultiplier.toFixed(2)}x`,
    })
  }

  const getMultiplierColor = () => {
    if (currentMultiplier < 2) return "text-green-500"
    if (currentMultiplier < 5) return "text-yellow-500"
    if (currentMultiplier < 10) return "text-orange-500"
    return "text-red-500"
  }

  return (
    <div className="space-y-6 p-4">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2">Aviator</h1>
        <p className="text-muted-foreground">Cash out before the plane flies away!</p>
      </div>

      {/* Game Area */}
      <Card className="relative overflow-hidden bg-gradient-to-br from-blue-900 via-purple-900 to-pink-900">
        <CardContent className="p-8 text-center">
          <div className="relative h-64 flex items-center justify-center">
            {gameState === "waiting" && (
              <div className="text-white">
                <Plane className="h-16 w-16 mx-auto mb-4" />
                <p className="text-2xl font-bold">Starting in {countdown}s</p>
                <p className="text-lg">Place your bets!</p>
              </div>
            )}

            {gameState === "flying" && (
              <div className="text-white">
                <div className="relative">
                  <Plane
                    className={`h-16 w-16 mx-auto mb-4 transform transition-transform ${
                      gameState === "flying" ? "animate-bounce" : ""
                    }`}
                  />
                  <div className="absolute -top-2 -right-2">
                    <Zap className="h-6 w-6 text-yellow-400 animate-pulse" />
                  </div>
                </div>
                <p className={`text-6xl font-bold ${getMultiplierColor()}`}>{currentMultiplier.toFixed(2)}x</p>
                <p className="text-lg">Flying...</p>
              </div>
            )}

            {gameState === "crashed" && (
              <div className="text-white">
                <div className="text-red-500">
                  <Plane className="h-16 w-16 mx-auto mb-4 transform rotate-45" />
                </div>
                <p className="text-4xl font-bold text-red-500">CRASHED at {currentMultiplier.toFixed(2)}x</p>
                <p className="text-lg">Next round starting soon...</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Betting Controls */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Place Bet</CardTitle>
            <CardDescription>Balance: KES {balance.toFixed(2)}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium">Bet Amount</label>
              <Input
                type="number"
                placeholder="Enter bet amount"
                value={betAmount}
                onChange={(e) => setBetAmount(e.target.value)}
                disabled={gameState !== "waiting"}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Auto Cash Out (Optional)</label>
              <Input
                type="number"
                placeholder="e.g., 2.00"
                value={autoCashOut}
                onChange={(e) => setAutoCashOut(e.target.value)}
                disabled={gameState !== "waiting"}
              />
            </div>
            <Button onClick={placeBet} disabled={gameState !== "waiting" || !betAmount} className="w-full">
              {gameState === "waiting" ? "Place Bet" : "Round in Progress"}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Current Bet</CardTitle>
          </CardHeader>
          <CardContent>
            {currentBet ? (
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">Bet Amount</p>
                  <p className="text-lg font-bold">KES {currentBet.amount}</p>
                </div>
                {currentBet.cashedOut ? (
                  <div>
                    <p className="text-sm text-muted-foreground">Cashed Out At</p>
                    <p className="text-lg font-bold text-green-500">{currentBet.cashOutAt?.toFixed(2)}x</p>
                    <p className="text-sm">
                      Profit: <span className="text-green-500 font-medium">KES {currentBet.profit.toFixed(2)}</span>
                    </p>
                  </div>
                ) : (
                  <div>
                    <p className="text-sm text-muted-foreground">Potential Win</p>
                    <p className="text-lg font-bold">KES {(currentBet.amount * currentMultiplier).toFixed(2)}</p>
                    <Button
                      onClick={() => cashOut()}
                      disabled={gameState !== "flying"}
                      className="w-full mt-2"
                      variant={gameState === "flying" ? "default" : "secondary"}
                    >
                      {gameState === "flying" ? `Cash Out ${currentMultiplier.toFixed(2)}x` : "Cash Out"}
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-muted-foreground">No active bet</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Game History */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Results</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {gameHistory.slice(0, 10).map((round) => (
              <Badge
                key={round.id}
                variant={round.multiplier < 2 ? "destructive" : round.multiplier < 5 ? "secondary" : "default"}
                className="text-sm"
              >
                {round.multiplier.toFixed(2)}x
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
