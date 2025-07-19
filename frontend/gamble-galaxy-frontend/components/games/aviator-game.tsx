"use client"

import { useEffect, useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useWebSocket } from "@/lib/websocket"
import { useAuth } from "@/lib/auth"
import { api } from "@/lib/api"
import { Plane, TrendingUp, Users, Trophy, ShieldCheck } from "lucide-react"
import { cn } from "@/lib/utils"
import type { AviatorBet, TopWinner } from "@/lib/types"

export function AviatorGame() {
  const { user } = useAuth()
  const {
    connect,
    disconnect,
    isConnected,
    currentMultiplier,
    isRoundActive,
    cashOut,
  } = useWebSocket()

  const [betAmount, setBetAmount] = useState("10")
  const [autoCashout, setAutoCashout] = useState("")
  const [hasBet, setHasBet] = useState(false)
  const [topWinners, setTopWinners] = useState<TopWinner[]>([])
  const [pastCrashes, setPastCrashes] = useState<number[]>([])
  const [walletBalance, setWalletBalance] = useState<number>(0)
  const [sureOdds, setSureOdds] = useState<number | null>(null)

  useEffect(() => {
    connect()
    loadGameData()
    fetchWalletBalance()
    fetchSureOdds()
    return () => disconnect()
  }, [])

  const loadGameData = async () => {
    const [winnersRes, crashesRes] = await Promise.all([
      api.getTopWinners(),
      api.getPastCrashes(),
    ])
    if (winnersRes.data) setTopWinners(winnersRes.data)
    if (crashesRes.data) {
      setPastCrashes(crashesRes.data.map((round: any) => round.crash_multiplier))
    }
  }

  const fetchWalletBalance = async () => {
    if (user) {
      const res = await api.getWallet()
      if (res.data) setWalletBalance(Number(res.data.balance))
    }
  }

  const fetchSureOdds = async () => {
    const res = await api.getSureOdds()
    // Replace 'multiplier' with the correct property name from SureOddSlip, e.g., 'multiplier' or 'sureOdd'
    if (res.data && res.data.multiplier) {
      setSureOdds(res.data.multiplier)
    }
  }

  const handlePlaceBet = async () => {
    if (!user || hasBet) return
    if (parseFloat(betAmount) > walletBalance) {
      alert("Insufficient balance")
      return
    }
    const response = await api.placeAviatorBet(Number.parseFloat(betAmount))
    if (response.data) {
      setHasBet(true)
      fetchWalletBalance()
    }
  }

  const handleCashOut = () => {
    if (!user || !hasBet) return
    cashOut(user.id, currentMultiplier)
    setHasBet(false)
    fetchWalletBalance()
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-4">
            <Plane className="inline-block w-12 h-12 mr-4 text-purple-400" />
            Aviator
          </h1>
          <p className="text-gray-300 text-lg">Watch the plane soar and cash out before it crashes!</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card className="bg-gray-800 border-gray-700 mb-6 p-8">
              <div className={cn("relative h-64 rounded-lg bg-gradient-to-br flex items-center justify-center", getMultiplierBg(currentMultiplier))}>
                <div className="text-center">
                  <div className={cn("text-6xl md:text-8xl font-bold mb-4", getMultiplierColor(currentMultiplier))}>
                    {currentMultiplier.toFixed(2)}x
                  </div>
                  <div className="text-gray-300">{isRoundActive ? "Flying..." : "Crashed!"}</div>
                </div>
                <div className={cn("absolute transition-all duration-300", isRoundActive ? "animate-bounce" : "")}> 
                  <Plane className={cn("w-16 h-16", isRoundActive ? "text-green-400" : "text-red-400")} />
                </div>
              </div>

              <div className="mt-4 text-center">
                <div className={cn("inline-flex items-center px-3 py-1 rounded-full text-sm", isConnected ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400")}> 
                  <div className={cn("w-2 h-2 rounded-full mr-2", isConnected ? "bg-green-400" : "bg-red-400")} />
                  {isConnected ? "Connected" : "Disconnected"}
                </div>
              </div>

              <div className="mt-4 text-center text-gray-300">
                Wallet: <strong>KES {walletBalance.toFixed(2)}</strong>
              </div>

              {sureOdds && (
                <div className="mt-4 flex items-center justify-center text-blue-400 text-sm">
                  <ShieldCheck className="mr-2 w-5 h-5" /> Admin SureOdd Tip: x{sureOdds}
                </div>
              )}
            </Card>

            <Card className="bg-gray-800 border-gray-700 p-4">
              <div className="text-white text-lg font-semibold mb-4">Place Your Bet</div>
              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Bet Amount (KES)</label>
                  <Input
                    type="number"
                    value={betAmount}
                    onChange={(e) => setBetAmount(e.target.value)}
                    className="bg-gray-700 border-gray-600 text-white"
                    min="1"
                    step="0.01"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Auto Cash Out (Optional)</label>
                  <Input
                    type="number"
                    value={autoCashout}
                    onChange={(e) => setAutoCashout(e.target.value)}
                    className="bg-gray-700 border-gray-600 text-white"
                    placeholder="2.00"
                    min="1.01"
                    step="0.01"
                  />
                </div>
                <div className="flex items-end space-x-2">
                  {!hasBet ? (
                    <Button
                      onClick={handlePlaceBet}
                      disabled={!isConnected || !user}
                      className="bg-green-600 hover:bg-green-700 text-white flex-1"
                    >
                      Place Bet
                    </Button>
                  ) : (
                    <Button
                      onClick={handleCashOut}
                      disabled={!isRoundActive}
                      className="bg-red-600 hover:bg-red-700 text-white flex-1"
                    >
                      Cash Out
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="bg-gray-800 border-gray-700 p-4">
              <div className="text-white flex items-center text-lg font-semibold mb-2">
                <TrendingUp className="w-5 h-5 mr-2" /> Past Crashes
              </div>
              <div className="grid grid-cols-5 gap-2">
                {pastCrashes.slice(0, 20).map((crash, index) => (
                  <div key={index} className={cn("text-center py-2 px-1 rounded text-sm font-medium",
                    crash < 2 ? "bg-red-500/20 text-red-400" :
                    crash < 5 ? "bg-yellow-500/20 text-yellow-400" :
                    crash < 10 ? "bg-green-500/20 text-green-400" :
                    crash < 20 ? "bg-blue-500/20 text-blue-400" :
                    "bg-purple-500/20 text-purple-400")}
                  >
                    {crash.toFixed(2)}x
                  </div>
                ))}
              </div>
            </Card>

            <Card className="bg-gray-800 border-gray-700 p-4">
              <div className="text-white flex items-center text-lg font-semibold mb-2">
                <Trophy className="w-5 h-5 mr-2" /> Top Winners Today
              </div>
              <div className="space-y-3">
                {topWinners.slice(0, 10).map((winner, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-sm font-bold">{winner.username.charAt(0).toUpperCase()}</span>
                      </div>
                      <span className="text-white text-sm">{winner.username}</span>
                    </div>
                    <div className="text-right">
                      <div className="text-green-400 font-medium">KES {Number.parseFloat(winner.amount).toFixed(2)}</div>
                      <div className="text-gray-400 text-xs">x{winner.cashed_out_at.toFixed(2)}</div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="bg-gray-800 border-gray-700 p-4">
              <div className="text-white flex items-center text-lg font-semibold mb-2">
                <Users className="w-5 h-5 mr-2" /> Live Bets
              </div>
              <div className="text-gray-400 text-sm">Live bets are currently unavailable.</div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
