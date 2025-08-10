"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/auth-context"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Clock, TrendingUp, TrendingDown, RefreshCw } from "lucide-react"
import { motion } from "framer-motion"

interface AviatorRound {
  id: number
  crash_multiplier: number
  start_time: string
  color: string
}

export default function AviatorHistory() {
  const { token } = useAuth()
  const [rounds, setRounds] = useState<AviatorRound[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchHistory()
  }, [])

  const fetchHistory = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/games/aviator/past-crashes")
      if (response.ok) {
        const data = await response.json()
        setRounds(data)
      }
    } catch (error) {
      console.error("Error fetching history:", error)
    } finally {
      setLoading(false)
    }
  }

  const getColorClass = (color: string) => {
    switch (color) {
      case "red":
        return "bg-red-500/20 text-red-300 border-red-500/30"
      case "yellow":
        return "bg-yellow-500/20 text-yellow-300 border-yellow-500/30"
      case "green":
        return "bg-green-500/20 text-green-300 border-green-500/30"
      case "blue":
        return "bg-blue-500/20 text-blue-300 border-blue-500/30"
      case "purple":
        return "bg-purple-500/20 text-purple-300 border-purple-500/30"
      default:
        return "bg-gray-500/20 text-gray-300 border-gray-500/30"
    }
  }

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="w-12 h-12 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin mx-auto mb-4" />
        <p className="text-white">Loading history...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white flex items-center">
          <Clock className="w-6 h-6 mr-2 text-blue-400" />
          Recent Crashes
        </h2>
        <Button onClick={fetchHistory} variant="outline" size="sm" className="glass-button bg-transparent">
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="glass-card">
          <CardContent className="p-4 text-center">
            <TrendingUp className="w-8 h-8 text-green-400 mx-auto mb-2" />
            <p className="text-xl font-bold text-white">{rounds.filter((r) => r.crash_multiplier >= 2).length}</p>
            <p className="text-sm text-gray-400">Above 2.00x</p>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardContent className="p-4 text-center">
            <TrendingDown className="w-8 h-8 text-red-400 mx-auto mb-2" />
            <p className="text-xl font-bold text-white">{rounds.filter((r) => r.crash_multiplier < 2).length}</p>
            <p className="text-sm text-gray-400">Below 2.00x</p>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardContent className="p-4 text-center">
            <div className="text-2xl mb-2">🏆</div>
            <p className="text-xl font-bold text-white">
              {Math.max(...rounds.map((r) => r.crash_multiplier)).toFixed(2)}x
            </p>
            <p className="text-sm text-gray-400">Highest</p>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardContent className="p-4 text-center">
            <div className="text-2xl mb-2">📊</div>
            <p className="text-xl font-bold text-white">
              {(rounds.reduce((acc, r) => acc + r.crash_multiplier, 0) / rounds.length).toFixed(2)}x
            </p>
            <p className="text-sm text-gray-400">Average</p>
          </CardContent>
        </Card>
      </div>

      {/* History Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
        {rounds.map((round, index) => (
          <motion.div
            key={round.id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.05 }}
          >
            <Card className="glass-card hover:bg-white/10 transition-all duration-300 cursor-pointer">
              <CardContent className="p-4 text-center">
                <Badge className={`mb-2 ${getColorClass(round.color)}`}>{round.crash_multiplier.toFixed(2)}x</Badge>
                <p className="text-gray-400 text-xs">{new Date(round.start_time).toLocaleTimeString()}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {rounds.length === 0 && (
        <div className="text-center py-12">
          <Clock className="w-16 h-16 text-gray-400 mx-auto mb-4 opacity-50" />
          <h3 className="text-xl font-semibold text-white mb-2">No History Available</h3>
          <p className="text-gray-400">Recent crashes will appear here</p>
        </div>
      )}
    </div>
  )
}
