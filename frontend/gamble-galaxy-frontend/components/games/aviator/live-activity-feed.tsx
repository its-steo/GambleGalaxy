"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Bot, User, TrendingUp, Coins, Crown, CheckCircle, Zap } from "lucide-react"
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
  activities?: LiveActivity[] // 🔧 FIXED: Make optional
  className?: string
}

export function LiveActivityFeed({ activities = [], className }: LiveActivityFeedProps) {
  const formatTimeAgo = (timestamp: number) => {
    const seconds = Math.floor((Date.now() - timestamp) / 1000)
    if (seconds < 60) return `${seconds}s ago`
    const minutes = Math.floor(seconds / 60)
    if (minutes < 60) return `${minutes}m ago`
    const hours = Math.floor(minutes / 60)
    return `${hours}h ago`
  }

  const getActivityIcon = (activity: LiveActivity) => {
    if (activity.type === "cashout") {
      return <CheckCircle className="w-3 h-3 lg:w-4 lg:h-4 text-green-400" />
    }
    if (activity.isBot) {
      return <Bot className="w-3 h-3 lg:w-4 lg:h-4 text-purple-400" />
    }
    return <User className="w-3 h-3 lg:w-4 lg:h-4 text-blue-400" />
  }

  const getBigWinBadge = (activity: LiveActivity) => {
    if (activity.type === "cashout" && activity.winAmount) {
      if (activity.winAmount >= 10000) return "🔥 MEGA WIN!"
      if (activity.winAmount >= 5000) return "💎 BIG WIN!"
      if (activity.winAmount >= 2000) return "⭐ NICE WIN!"
    }
    return null
  }

  return (
    <div className="relative">
      <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 via-blue-500/5 to-indigo-500/10 rounded-2xl blur-xl"></div>

      <Card
        className={cn(
          "relative bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl shadow-2xl overflow-hidden",
          className,
        )}
      >
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
              activities.slice(0, 15).map((activity) => {
                const bigWinBadge = getBigWinBadge(activity)

                return (
                  <div
                    key={activity.id}
                    className={cn(
                      "group flex items-center justify-between p-3 rounded-xl border backdrop-blur-2xl transition-all duration-300 hover:scale-[1.02] relative overflow-hidden",
                      activity.type === "bet"
                        ? "bg-gradient-to-r from-blue-500/10 to-purple-500/10 border-blue-500/20 hover:from-blue-500/15 hover:to-purple-500/15"
                        : "bg-gradient-to-r from-green-500/10 to-emerald-500/10 border-green-500/20 hover:from-green-500/15 hover:to-emerald-500/15",
                      bigWinBadge && "ring-2 ring-amber-500/50 animate-pulse",
                    )}
                  >
                    {/* Big win celebration effect */}
                    {bigWinBadge && (
                      <div className="absolute inset-0 bg-gradient-to-r from-amber-500/10 via-yellow-500/10 to-amber-500/10 animate-pulse"></div>
                    )}

                    <div className="flex items-center gap-3 min-w-0 flex-1 relative z-10">
                      <div
                        className={cn(
                          "w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold text-white backdrop-blur-xl border flex-shrink-0 relative",
                          activity.isBot
                            ? "bg-gradient-to-br from-purple-500/30 to-pink-500/30 border-purple-500/20"
                            : activity.username === "You"
                              ? "bg-gradient-to-br from-amber-500/30 to-orange-500/30 border-amber-500/20"
                              : "bg-gradient-to-br from-blue-500/30 to-cyan-500/30 border-blue-500/20",
                        )}
                      >
                        {activity.username === "You" ? (
                          <Crown className="w-3 h-3 text-amber-400" />
                        ) : (
                          getActivityIcon(activity)
                        )}

                        {/* Activity type indicator */}
                        <div className="absolute -top-1 -right-1">
                          {activity.type === "bet" ? (
                            <Zap className="w-3 h-3 text-blue-400" />
                          ) : (
                            <CheckCircle className="w-3 h-3 text-green-400" />
                          )}
                        </div>
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span
                            className={cn(
                              "font-semibold text-xs truncate",
                              activity.username === "You" ? "text-amber-400" : "text-white/90",
                            )}
                          >
                            {activity.username}
                          </span>
                          {activity.isBot && (
                            <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30 text-xs px-1 py-0">
                              BOT
                            </Badge>
                          )}
                          {bigWinBadge && (
                            <Badge className="bg-gradient-to-r from-amber-500/30 to-yellow-500/30 text-amber-300 border-amber-500/30 text-xs px-1 py-0 animate-pulse">
                              {bigWinBadge}
                            </Badge>
                          )}
                        </div>

                        <div className="flex items-center gap-2 text-xs">
                          {activity.type === "bet" ? (
                            <>
                              <span className="text-blue-400 font-medium">
                                Bet KES {activity.amount.toLocaleString()}
                              </span>
                              {activity.autoCashout && (
                                <span className="text-yellow-400">@ {activity.autoCashout}x</span>
                              )}
                            </>
                          ) : (
                            <>
                              <span className="text-green-400 font-medium">
                                Won KES {activity.winAmount?.toLocaleString()}
                              </span>
                              <span className="text-white/50">@ {activity.multiplier?.toFixed(2)}x</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="text-right flex-shrink-0 relative z-10">
                      <div
                        className={cn(
                          "text-xs font-medium",
                          activity.type === "bet" ? "text-blue-400" : "text-green-400",
                        )}
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
                )
              })
            ) : (
              <div className="py-8 text-center">
                <Coins className="w-8 h-8 mx-auto mb-3 text-white/20" />
                <p className="text-white/60 text-sm">No recent activity</p>
                <p className="text-white/40 text-xs">Waiting for bets and cashouts...</p>
              </div>
            )}
          </div>

          {/* Activity Stats */}
          {activities.length > 0 && (
            <div className="border-t border-white/10 pt-3 mt-3">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1 text-blue-400">
                    <Zap className="w-3 h-3" />
                    <span>{activities.filter((a) => a.type === "bet").length} bets</span>
                  </div>
                  <div className="flex items-center gap-1 text-green-400">
                    <CheckCircle className="w-3 h-3" />
                    <span>{activities.filter((a) => a.type === "cashout").length} cashouts</span>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-purple-400">
                  <Bot className="w-3 h-3" />
                  <span>{activities.filter((a) => a.isBot).length} bots</span>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
