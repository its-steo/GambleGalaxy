"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/auth-context"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Trophy, Crown, Medal, Star, RefreshCw } from "lucide-react"
import { motion } from "framer-motion"

interface TopWinner {
  username: string
  avatar?: string
  amount: number
  cashed_out_at: number
}

export default function AviatorLeaderboard() {
  const { token } = useAuth()
  const [winners, setWinners] = useState<TopWinner[]>([])
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState("today")

  useEffect(() => {
    fetchLeaderboard()
  }, [period])

  const fetchLeaderboard = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/games/aviator/top-winners?period=${period}`)
      if (response.ok) {
        const data = await response.json()
        setWinners(data)
      }
    } catch (error) {
      console.error("Error fetching leaderboard:", error)
    } finally {
      setLoading(false)
    }
  }

  const getRankIcon = (index: number) => {
    switch (index) {
      case 0:
        return <Crown className="w-6 h-6 text-yellow-400" />
      case 1:
        return <Medal className="w-6 h-6 text-gray-400" />
      case 2:
        return <Medal className="w-6 h-6 text-orange-400" />
      default:
        return <Star className="w-6 h-6 text-purple-400" />
    }
  }

  const getRankColor = (index: number) => {
    switch (index) {
      case 0:
        return "bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border-yellow-500/30"
      case 1:
        return "bg-gradient-to-r from-gray-500/20 to-slate-500/20 border-gray-500/30"
      case 2:
        return "bg-gradient-to-r from-orange-500/20 to-red-500/20 border-orange-500/30"
      default:
        return "glass-card"
    }
  }

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="w-12 h-12 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin mx-auto mb-4" />
        <p className="text-white">Loading leaderboard...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white flex items-center">
          <Trophy className="w-6 h-6 mr-2 text-yellow-400" />
          Top Winners
        </h2>
        <Button onClick={fetchLeaderboard} variant="outline" size="sm" className="glass-button bg-transparent">
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Period Selector */}
      <div className="flex space-x-2">
        {["today", "week", "month"].map((p) => (
          <Button
            key={p}
            onClick={() => setPeriod(p)}
            variant={period === p ? "default" : "outline"}
            size="sm"
            className={period === p ? "bg-gradient-to-r from-purple-500 to-pink-500" : "glass-button"}
          >
            {p.charAt(0).toUpperCase() + p.slice(1)}
          </Button>
        ))}
      </div>

      {/* Leaderboard */}
      <div className="space-y-4">
        {winners.map((winner, index) => (
          <motion.div
            key={`${winner.username}-${index}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className={getRankColor(index)}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-3">
                      {getRankIcon(index)}
                      <div className="text-2xl font-bold text-white">#{index + 1}</div>
                    </div>

                    <div className="flex items-center space-x-3">
                      {winner.avatar ? (
                        <img
                          src={winner.avatar || "/placeholder.svg"}
                          alt={winner.username}
                          className="w-12 h-12 rounded-full border-2 border-white/20"
                        />
                      ) : (
                        <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                          <span className="text-white font-bold text-lg">
                            {winner.username.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      )}
                      <div>
                        <p className="text-white font-bold text-lg">{winner.username}</p>
                        <p className="text-gray-400 text-sm">Aviator Champion</p>
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="text-2xl font-bold text-green-400">₦{winner.amount.toLocaleString()}</p>
                    <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30">
                      {winner.cashed_out_at.toFixed(2)}x
                    </Badge>
                  </div>
                </div>

                {index < 3 && (
                  <div className="mt-4 pt-4 border-t border-white/10">
                    <div className="flex items-center justify-center space-x-2">
                      <div className="flex space-x-1">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`w-4 h-4 ${
                              i < (index === 0 ? 5 : index === 1 ? 4 : 3)
                                ? "text-yellow-400 fill-current"
                                : "text-gray-600"
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-gray-400 text-sm">
                        {index === 0 ? "Legendary" : index === 1 ? "Master" : "Expert"} Player
                      </span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {winners.length === 0 && (
        <div className="text-center py-12">
          <Trophy className="w-16 h-16 text-gray-400 mx-auto mb-4 opacity-50" />
          <h3 className="text-xl font-semibold text-white mb-2">No Winners Yet</h3>
          <p className="text-gray-400">Be the first to make it to the leaderboard!</p>
        </div>
      )}
    </div>
  )
}
