"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/auth-context"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { motion } from "framer-motion"
import { Plane, TrendingUp, Users, Clock, Star, Trophy, AlertCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import AviatorGame from "@/components/aviator-game"
import AviatorHistory from "@/components/aviator-history"
import AviatorLeaderboard from "@/components/aviator-leaderboard"

export default function GamesPage() {
  const { user, token } = useAuth()
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState("game")
  const [gameStats, setGameStats] = useState({
    totalPlayers: 0,
    currentRound: null,
    userBalance: 0,
  })

  useEffect(() => {
    fetchGameStats()
  }, [])

  const fetchGameStats = async () => {
    try {
      const response = await fetch("/api/games/stats", {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (response.ok) {
        const data = await response.json()
        setGameStats(data)
      }
    } catch (error) {
      console.error("Error fetching game stats:", error)
    }
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2 flex items-center">
              <Plane className="w-8 h-8 mr-3 text-blue-400" />
              Aviator Game ✈️
            </h1>
            <p className="text-gray-400">Watch the plane fly and cash out before it crashes!</p>
          </div>
          <div className="text-right">
            <p className="text-gray-400 text-sm">Your Balance</p>
            <p className="text-2xl font-bold text-white">₦{gameStats.userBalance.toLocaleString()}</p>
          </div>
        </div>

        {/* Game Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="glass-card">
            <CardContent className="p-4 text-center">
              <Users className="w-8 h-8 text-blue-400 mx-auto mb-2" />
              <p className="text-xl font-bold text-white">{gameStats.totalPlayers}</p>
              <p className="text-sm text-gray-400">Players Online</p>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardContent className="p-4 text-center">
              <TrendingUp className="w-8 h-8 text-green-400 mx-auto mb-2" />
              <p className="text-xl font-bold text-white">Live</p>
              <p className="text-sm text-gray-400">Game Status</p>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardContent className="p-4 text-center">
              <Clock className="w-8 h-8 text-yellow-400 mx-auto mb-2" />
              <p className="text-xl font-bold text-white">24/7</p>
              <p className="text-sm text-gray-400">Available</p>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardContent className="p-4 text-center">
              <Star className="w-8 h-8 text-purple-400 mx-auto mb-2" />
              <p className="text-xl font-bold text-white">Premium</p>
              <p className="text-sm text-gray-400">Experience</p>
            </CardContent>
          </Card>
        </div>
      </motion.div>

      {/* Game Tabs */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="glass-card p-1 w-full">
            <TabsTrigger value="game" className="flex-1">
              <Plane className="w-4 h-4 mr-2" />
              Play Game
            </TabsTrigger>
            <TabsTrigger value="history" className="flex-1">
              <Clock className="w-4 h-4 mr-2" />
              History
            </TabsTrigger>
            <TabsTrigger value="leaderboard" className="flex-1">
              <Trophy className="w-4 h-4 mr-2" />
              Leaderboard
            </TabsTrigger>
          </TabsList>

          <TabsContent value="game" className="mt-6">
            <AviatorGame />
          </TabsContent>

          <TabsContent value="history" className="mt-6">
            <AviatorHistory />
          </TabsContent>

          <TabsContent value="leaderboard" className="mt-6">
            <AviatorLeaderboard />
          </TabsContent>
        </Tabs>
      </motion.div>

      {/* Game Rules */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <Card className="glass-card">
          <CardContent className="p-6">
            <h3 className="text-white font-bold text-lg mb-4 flex items-center">
              <AlertCircle className="w-5 h-5 mr-2 text-blue-400" />
              How to Play Aviator
            </h3>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-blue-500/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-blue-400 text-sm font-bold">1</span>
                  </div>
                  <div>
                    <p className="text-white font-semibold">Place Your Bet</p>
                    <p className="text-gray-400 text-sm">Enter your bet amount before the round starts</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-green-500/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-green-400 text-sm font-bold">2</span>
                  </div>
                  <div>
                    <p className="text-white font-semibold">Watch the Multiplier</p>
                    <p className="text-gray-400 text-sm">The plane takes off and the multiplier increases</p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-yellow-500/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-yellow-400 text-sm font-bold">3</span>
                  </div>
                  <div>
                    <p className="text-white font-semibold">Cash Out in Time</p>
                    <p className="text-gray-400 text-sm">Click cash out before the plane crashes</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-purple-500/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-purple-400 text-sm font-bold">4</span>
                  </div>
                  <div>
                    <p className="text-white font-semibold">Win Big!</p>
                    <p className="text-gray-400 text-sm">Your bet is multiplied by the cash out value</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
