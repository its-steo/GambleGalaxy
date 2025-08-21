"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { TrendingUp, Zap, Users, Crown, Bot, User, CheckCircle, Target, Plane } from "lucide-react"
import { cn } from "@/lib/utils"
import type { RecentCashout, User as UserType, BetInfo } from "@/lib/types"

interface LiveCashoutsProps {
  recentCashouts: RecentCashout[]
  activeBets: Map<number, BetInfo> | null
  currentMultiplier: number
  isRoundActive: boolean
  user: UserType | null
  cashedOutUsers: Set<number>
  cashoutResults: Map<number, { multiplier: number; winAmount: number }>
}

export function LiveCashouts({
  recentCashouts,
  activeBets,
  currentMultiplier,
  isRoundActive,
  user,
  cashedOutUsers,
  cashoutResults,
}: LiveCashoutsProps) {
  const totalActiveBets = activeBets?.size || 0
  const userCashoutResult = user ? cashoutResults.get(user.id) : null
  const userHasCashedOut = user ? cashedOutUsers.has(user.id) : false

  // 🔧 FIXED: Better data combination and display logic
  type ActivityItem = {
    id: string
    username: string
    amount: number
    type: "cashed_out" | "active"
    multiplier: number
    winAmount: number
    is_bot: boolean
    timestamp?: number
    userId?: number
    autoCashout?: number
  }

  const getLiveActivity = (): ActivityItem[] => {
    const activity: ActivityItem[] = []

    // 1. Add recent cashouts (prioritize these)
    if (recentCashouts && recentCashouts.length > 0) {
      recentCashouts.slice(0, 6).forEach((cashout, index) => {
        const amount = typeof cashout.amount === "string" ? Number.parseFloat(cashout.amount) : cashout.amount || 0
        const winAmount =
          typeof cashout.win_amount === "string" ? Number.parseFloat(cashout.win_amount) : cashout.win_amount || amount

        activity.push({
          id: `cashout-${cashout.username || "unknown"}-${cashout.timestamp || Date.now()}-${index}`,
          username: cashout.username || "Anonymous",
          amount: amount,
          type: "cashed_out" as const,
          multiplier: cashout.cashout_multiplier || cashout.multiplier || 0,
          winAmount: winAmount,
          is_bot: cashout.is_bot || false,
          timestamp: cashout.timestamp !== undefined ? Number(cashout.timestamp) : Date.now(),
        })
      })
    }

    // 2. Add active bets (if round is active)
    if (isRoundActive && activeBets && activeBets.size > 0) {
      Array.from(activeBets.entries())
        .slice(0, 8)
        .forEach(([userId, bet]) => {
          // Don't show if user already cashed out
          if (!cashedOutUsers.has(userId)) {
            const username = userId === user?.id ? user.username || "You" : `Player${userId}`
            const betAmount = bet.amount || 0
            const potentialWin = betAmount * currentMultiplier

            activity.push({
              id: `active-${userId}-${bet.id || Date.now()}`,
              username,
              amount: betAmount,
              type: "active" as const,
              multiplier: currentMultiplier,
              winAmount: potentialWin,
              is_bot: false,
              userId,
              autoCashout: bet.auto_cashout,
            })
          }
        })
    }

    // 3. Sort by type (cashouts first, then active bets) and limit
    return activity
      .sort((a, b) => {
        if (a.type === "cashed_out" && b.type === "active") return -1
        if (a.type === "active" && b.type === "cashed_out") return 1
        return (b.timestamp || 0) - (a.timestamp || 0)
      })
      .slice(0, 12)
  }

  const liveActivity = getLiveActivity()

  return (
    <div className="relative">
      <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 via-emerald-500/5 to-teal-500/10 rounded-2xl blur-xl"></div>

      <Card className="relative bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>

        <CardHeader className="pb-3 lg:pb-4 relative z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 lg:gap-3">
              <div className="w-8 h-8 lg:w-10 lg:h-10 bg-gradient-to-br from-green-500/20 to-blue-500/20 rounded-xl lg:rounded-2xl flex items-center justify-center border border-green-500/20 backdrop-blur-xl">
                <TrendingUp className="w-4 h-4 lg:w-5 lg:h-5 text-green-400" />
              </div>
              <div>
                <CardTitle className="text-sm lg:text-lg font-bold text-white/90">Live Activity</CardTitle>
                <p className="text-xs text-white/60">Real-time bets & cashouts</p>
              </div>
            </div>
            <div className="flex items-center gap-1 lg:gap-2">
              <Badge className="bg-gradient-to-r from-green-500/20 to-blue-500/20 text-green-400 border-green-500/30 px-2 lg:px-3 py-1 backdrop-blur-xl animate-pulse text-xs">
                <Users className="w-3 h-3 mr-1" />
                {totalActiveBets}
              </Badge>
              {isRoundActive && (
                <Badge className="bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-400 border-amber-500/30 px-2 lg:px-3 py-1 backdrop-blur-xl text-xs">
                  {currentMultiplier.toFixed(2)}x
                </Badge>
              )}
            </div>
          </div>

          {/* User's Cashout Result - Always Visible */}
          {userHasCashedOut && userCashoutResult && (
            <div className="mt-3 lg:mt-4 p-3 lg:p-4 bg-gradient-to-r from-green-500/15 to-emerald-500/15 border border-green-500/30 rounded-xl lg:rounded-2xl backdrop-blur-2xl animate-pulse">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 lg:gap-3">
                  <div className="w-8 h-8 lg:w-10 lg:h-10 bg-gradient-to-br from-green-500/30 to-emerald-500/30 rounded-xl lg:rounded-2xl flex items-center justify-center border border-green-500/20">
                    <CheckCircle className="w-4 h-4 lg:w-5 lg:h-5 text-green-400" />
                  </div>
                  <div>
                    <div className="text-sm lg:text-base font-bold text-green-400">You Cashed Out!</div>
                    <div className="text-xs lg:text-sm text-green-300">
                      {userCashoutResult.multiplier.toFixed(2)}x multiplier
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg lg:text-xl font-bold text-green-400">
                    +KES {userCashoutResult.winAmount.toFixed(0)}
                  </div>
                  <div className="text-xs text-green-300">winnings</div>
                </div>
              </div>
            </div>
          )}
        </CardHeader>

        <CardContent className="p-0 relative z-10">
          <ScrollArea className="h-40 sm:h-48 lg:h-56">
            <div className="space-y-2 p-3 lg:p-4 pt-0">
              {liveActivity.length === 0 ? (
                <div className="py-6 lg:py-8 text-center">
                  <Target className="w-8 h-8 lg:w-12 lg:h-12 mx-auto mb-3 text-white/20" />
                  <p className="text-white/60 text-sm">No activity yet</p>
                  <p className="text-white/40 text-xs">Waiting for players...</p>
                </div>
              ) : (
                liveActivity.map((activity) => (
                  <div
                    key={activity.id}
                    className={cn(
                      "group flex items-center justify-between p-2 lg:p-3 rounded-xl lg:rounded-2xl border backdrop-blur-2xl transition-all duration-300 hover:scale-[1.02] relative overflow-hidden",
                      activity.type === "cashed_out"
                        ? "bg-gradient-to-r from-green-500/10 to-emerald-500/10 border-green-500/30 hover:from-green-500/15 hover:to-emerald-500/15"
                        : "bg-gradient-to-r from-blue-500/10 to-purple-500/10 border-blue-500/30 hover:from-blue-500/15 hover:to-purple-500/15",
                      activity.username === user?.username && "ring-1 lg:ring-2 ring-amber-500/50",
                    )}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

                    <div className="flex items-center gap-2 lg:gap-3 relative z-10">
                      <div className="relative">
                        <div
                          className={cn(
                            "w-8 h-8 lg:w-10 lg:h-10 rounded-xl lg:rounded-2xl flex items-center justify-center text-xs lg:text-sm font-bold text-white backdrop-blur-xl border",
                            activity.type === "cashed_out"
                              ? "bg-gradient-to-br from-green-500/30 to-emerald-500/30 border-green-500/20"
                              : "bg-gradient-to-br from-blue-500/30 to-purple-500/30 border-blue-500/20",
                          )}
                        >
                          {activity.is_bot ? (
                            <Bot className="w-3 h-3 lg:w-4 lg:h-4" />
                          ) : activity.username === user?.username ? (
                            <Crown className="w-3 h-3 lg:w-4 lg:h-4 text-amber-400" />
                          ) : (
                            <User className="w-3 h-3 lg:w-4 lg:h-4" />
                          )}
                        </div>
                        {activity.type === "cashed_out" && (
                          <div className="absolute -top-1 -right-1">
                            <CheckCircle className="w-3 h-3 lg:w-4 lg:h-4 text-green-400" />
                          </div>
                        )}
                        {activity.type === "active" && isRoundActive && (
                          <div className="absolute -top-1 -right-1">
                            <Zap className="w-3 h-3 lg:w-4 lg:h-4 text-amber-400 animate-pulse" />
                          </div>
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div
                          className={cn(
                            "font-semibold text-xs lg:text-sm truncate",
                            activity.username === user?.username ? "text-amber-400" : "text-white/90",
                          )}
                        >
                          {activity.username || "Anonymous"}
                          {activity.username === user?.username && (
                            <Badge
                              variant="secondary"
                              className="ml-1 lg:ml-2 text-xs bg-amber-500/20 text-amber-400 border-amber-500/30 px-1 lg:px-2 py-0"
                            >
                              You
                            </Badge>
                          )}
                        </div>
                        <div
                          className={cn(
                            "text-xs font-medium",
                            activity.type === "cashed_out" ? "text-green-400" : "text-blue-400",
                          )}
                        >
                          {activity.type === "cashed_out"
                            ? `Cashed @ ${activity.multiplier.toFixed(2)}x`
                            : `Live @ ${activity.multiplier.toFixed(2)}x`}
                          {activity.autoCashout && activity.type === "active" && (
                            <span className="text-yellow-400 ml-1">(Auto @ {activity.autoCashout}x)</span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="text-right relative z-10 min-w-0">
                      <div
                        className={cn(
                          "font-bold text-xs lg:text-sm",
                          activity.type === "cashed_out" ? "text-green-400" : "text-blue-400",
                        )}
                      >
                        {activity.type === "cashed_out" ? "+" : ""}KES {activity.winAmount.toFixed(0)}
                      </div>
                      <div className="text-xs text-white/50">
                        {activity.type === "cashed_out" ? "won" : "potential"}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>

          {/* Quick Stats Footer */}
          <div className="border-t border-white/10 p-3 lg:p-4 bg-gradient-to-r from-white/5 to-transparent backdrop-blur-2xl">
            <div className="flex items-center justify-between text-xs lg:text-sm">
              <div className="flex items-center gap-2 lg:gap-4">
                <div className="flex items-center gap-1 lg:gap-2 text-green-400">
                  <CheckCircle className="w-3 h-3 lg:w-4 lg:h-4" />
                  <span>{recentCashouts?.length || 0} cashouts</span>
                </div>
                <div className="flex items-center gap-1 lg:gap-2 text-blue-400">
                  <Users className="w-3 h-3 lg:w-4 lg:h-4" />
                  <span>{totalActiveBets} active</span>
                </div>
              </div>
              {isRoundActive && (
                <div className="flex items-center gap-1 lg:gap-2 text-amber-400 animate-pulse">
                  <Plane className="w-3 h-3 lg:w-4 lg:h-4" />
                  <span className="font-bold">{currentMultiplier.toFixed(2)}x LIVE</span>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
