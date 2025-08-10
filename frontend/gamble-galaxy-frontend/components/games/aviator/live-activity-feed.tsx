"use client"

import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Bot, User, TrendingUp, Coins } from "lucide-react"
import { cn } from "@/lib/utils"

interface LiveActivity {
  id: string
  type: "bet" | "cashout"
  username: string
  amount: number
  multiplier?: number
  winAmount?: number
  isBot: boolean
  timestamp: number
  autoCashout?: number
}

interface LiveActivityFeedProps {
  className?: string
}

export function LiveActivityFeed({ className }: LiveActivityFeedProps) {
  const [activities, setActivities] = useState<LiveActivity[]>([])

  useEffect(() => {
    // Listen for WebSocket messages about bot and user activity
    const handleBotBet = (event: CustomEvent) => {
      const { username, amount, auto_cashout, is_bot, timestamp } = event.detail

      const activity: LiveActivity = {
        id: `bet-${timestamp}-${username}`,
        type: "bet",
        username,
        amount,
        autoCashout: auto_cashout,
        isBot: is_bot || false,
        timestamp: timestamp || Date.now(),
      }

      setActivities((prev) => [activity, ...prev.slice(0, 19)]) // Keep last 20
    }

    const handleBotCashout = (event: CustomEvent) => {
      const { username, amount, multiplier, win_amount, is_bot, timestamp } = event.detail

      const activity: LiveActivity = {
        id: `cashout-${timestamp}-${username}`,
        type: "cashout",
        username,
        amount,
        multiplier,
        winAmount: win_amount,
        isBot: is_bot || false,
        timestamp: timestamp || Date.now(),
      }

      setActivities((prev) => [activity, ...prev.slice(0, 19)]) // Keep last 20
    }

    // Listen for WebSocket events
    window.addEventListener("botBet", handleBotBet as EventListener)
    window.addEventListener("botCashout", handleBotCashout as EventListener)
    window.addEventListener("userBet", handleBotBet as EventListener) // Also listen for user bets
    window.addEventListener("userCashout", handleBotCashout as EventListener) // Also listen for user cashouts

    return () => {
      window.removeEventListener("botBet", handleBotBet as EventListener)
      window.removeEventListener("botCashout", handleBotCashout as EventListener)
      window.removeEventListener("userBet", handleBotBet as EventListener)
      window.removeEventListener("userCashout", handleBotCashout as EventListener)
    }
  }, [])

  const formatTimeAgo = (timestamp: number) => {
    const seconds = Math.floor((Date.now() - timestamp) / 1000)
    if (seconds < 60) return `${seconds}s ago`
    const minutes = Math.floor(seconds / 60)
    if (minutes < 60) return `${minutes}m ago`
    const hours = Math.floor(minutes / 60)
    return `${hours}h ago`
  }

  return (
    <Card
      className={cn(
        "bg-gradient-to-br from-white/10 via-white/5 to-transparent backdrop-blur-3xl border border-white/10 shadow-2xl rounded-2xl overflow-hidden",
        className,
      )}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 via-transparent to-blue-500/5 rounded-2xl"></div>
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>

      <CardContent className="p-4 space-y-3 relative z-10">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 bg-gradient-to-br from-green-500/20 to-blue-500/20 rounded-xl flex items-center justify-center border border-green-500/20 backdrop-blur-xl">
            <TrendingUp className="w-4 h-4 text-green-400" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-white/90">Live Activity</h3>
            <p className="text-xs text-white/60">Real-time bets & cashouts</p>
          </div>
          <Badge className="ml-auto bg-gradient-to-r from-green-500/20 to-blue-500/20 text-green-400 border-green-500/30 text-xs px-2 py-1 animate-pulse">
            LIVE
          </Badge>
        </div>

        <div className="space-y-2 max-h-80 overflow-y-auto">
          {activities.length > 0 ? (
            activities.map((activity) => (
              <div
                key={activity.id}
                className={cn(
                  "group flex items-center justify-between p-3 rounded-xl border backdrop-blur-2xl transition-all duration-300 hover:scale-[1.02] relative overflow-hidden",
                  activity.type === "bet"
                    ? "bg-gradient-to-r from-blue-500/10 to-purple-500/10 border-blue-500/20 hover:from-blue-500/15 hover:to-purple-500/15"
                    : "bg-gradient-to-r from-green-500/10 to-emerald-500/10 border-green-500/20 hover:from-green-500/15 hover:to-emerald-500/15",
                )}
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div
                    className={cn(
                      "w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold text-white backdrop-blur-xl border flex-shrink-0",
                      activity.isBot
                        ? "bg-gradient-to-br from-purple-500/30 to-pink-500/30 border-purple-500/20"
                        : "bg-gradient-to-br from-amber-500/30 to-orange-500/30 border-amber-500/20",
                    )}
                  >
                    {activity.isBot ? <Bot className="w-3 h-3" /> : <User className="w-3 h-3" />}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-xs text-white/90 truncate">{activity.username}</span>
                      {activity.isBot && (
                        <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30 text-xs px-1 py-0">
                          BOT
                        </Badge>
                      )}
                    </div>

                    <div className="flex items-center gap-2 text-xs">
                      {activity.type === "bet" ? (
                        <>
                          <span className="text-blue-400">Bet KES {activity.amount}</span>
                          {activity.autoCashout && <span className="text-white/50">@ {activity.autoCashout}x</span>}
                        </>
                      ) : (
                        <>
                          <span className="text-green-400">Won KES {activity.winAmount?.toFixed(0)}</span>
                          <span className="text-white/50">@ {activity.multiplier?.toFixed(2)}x</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="text-right flex-shrink-0">
                  <div
                    className={cn("text-xs font-medium", activity.type === "bet" ? "text-blue-400" : "text-green-400")}
                  >
                    {activity.type === "bet" ? "PLACED" : "CASHED"}
                  </div>
                  <div className="text-xs text-white/50">{formatTimeAgo(activity.timestamp)}</div>
                </div>

                {/* Animated background effect */}
                <div
                  className={cn(
                    "absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300",
                    activity.type === "bet"
                      ? "bg-gradient-to-r from-blue-500/5 to-transparent"
                      : "bg-gradient-to-r from-green-500/5 to-transparent",
                  )}
                ></div>
              </div>
            ))
          ) : (
            <div className="py-8 text-center">
              <Coins className="w-8 h-8 mx-auto mb-3 text-white/20" />
              <p className="text-white/60 text-sm">No recent activity</p>
              <p className="text-white/40 text-xs">Waiting for bets and cashouts...</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
