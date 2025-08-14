"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Users, TrendingUp, Bot, User } from "lucide-react"
import { useWebSocket } from "@/lib/websocket"
import { useAuth } from "@/lib/auth"

export function LiveBetsPanel() {
  const { user } = useAuth()
  const { activeBets, recentCashouts, currentMultiplier, isRoundActive } = useWebSocket()

  // Convert activeBets Map to array with null safety
  const allActiveBets = activeBets
    ? Array.from(activeBets.entries()).map(([userId, bet]) => ({
        ...bet,
        userId,
        username: userId === user?.id ? user.username || `Player${userId}` : `Player${userId}`,
        is_bot: false,
      }))
    : []

  const totalLivePlayers = allActiveBets.length
  const totalBetAmount = allActiveBets.reduce((sum, bet) => sum + (bet.amount || 0), 0)

  return (
    <Card className="bg-gradient-to-br from-slate-900/80 via-slate-800/60 to-slate-900/80 backdrop-blur-3xl border border-white/10 shadow-2xl rounded-2xl sm:rounded-3xl overflow-hidden relative">
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-indigo-500/5 rounded-2xl sm:rounded-3xl"></div>
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>

      <CardHeader className="pb-3 relative z-10">
        <CardTitle className="text-lg font-semibold text-white flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500/20 to-indigo-500/20 rounded-xl flex items-center justify-center border border-blue-500/20 backdrop-blur-xl">
            <Users className="w-4 h-4 text-blue-400" />
          </div>
          Live Bets ({totalLivePlayers})
        </CardTitle>
        <div className="flex items-center gap-4 text-sm text-slate-300">
          <span>Total: KES {totalBetAmount.toLocaleString()}</span>
          {isRoundActive && <span className="text-green-400">@ {currentMultiplier.toFixed(2)}x</span>}
        </div>
      </CardHeader>

      <CardContent className="p-0 relative z-10">
        <ScrollArea className="h-64">
          <div className="space-y-2 p-4">
            {allActiveBets.length === 0 ? (
              <div className="text-center text-slate-400 py-8">
                <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>No active bets</p>
              </div>
            ) : (
              allActiveBets
                .sort((a, b) => (b.amount || 0) - (a.amount || 0)) // Sort by bet amount descending
                .map((bet) => (
                  <div
                    key={`${bet.userId}-${bet.id || Date.now()}`}
                    className={`flex items-center justify-between p-3 rounded-xl transition-all duration-300 hover:scale-[1.02] backdrop-blur-2xl border ${
                      bet.userId === user?.id
                        ? "bg-gradient-to-r from-blue-500/20 to-indigo-500/20 border-blue-500/30"
                        : "bg-gradient-to-r from-white/5 to-white/10 border-white/10 hover:from-white/10 hover:to-white/15"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-8 h-8 rounded-xl flex items-center justify-center backdrop-blur-xl border ${
                            bet.is_bot
                              ? "bg-gradient-to-br from-indigo-500/30 to-purple-500/30 border-indigo-500/20"
                              : bet.userId === user?.id
                                ? "bg-gradient-to-br from-amber-500/30 to-yellow-500/30 border-amber-500/20"
                                : "bg-gradient-to-br from-blue-500/30 to-cyan-500/30 border-blue-500/20"
                          }`}
                        >
                          {bet.is_bot ? (
                            <Bot className="w-4 h-4 text-indigo-400" />
                          ) : (
                            <User className="w-4 h-4 text-blue-400" />
                          )}
                        </div>
                        <span className={`font-medium ${bet.userId === user?.id ? "text-blue-300" : "text-slate-200"}`}>
                          {bet.username}
                          {bet.userId === user?.id && (
                            <Badge
                              variant="secondary"
                              className="ml-2 text-xs bg-amber-500/20 text-amber-400 border-amber-500/30"
                            >
                              You
                            </Badge>
                          )}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <div className="text-sm font-medium text-white">KES {(bet.amount || 0).toLocaleString()}</div>
                        {bet.auto_cashout && <div className="text-xs text-yellow-400">Auto @ {bet.auto_cashout}x</div>}
                      </div>

                      {isRoundActive && (
                        <div className="text-right">
                          <div className="text-sm font-medium text-green-400">
                            {((bet.amount || 0) * currentMultiplier).toFixed(0)}
                          </div>
                          <div className="text-xs text-slate-400">potential</div>
                        </div>
                      )}
                    </div>
                  </div>
                ))
            )}
          </div>
        </ScrollArea>

        {/* Recent Cashouts */}
        {recentCashouts && recentCashouts.length > 0 && (
          <div className="border-t border-white/10 p-4">
            <h4 className="text-sm font-medium text-slate-300 mb-3 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-green-400" />
              Recent Cashouts
            </h4>
            <div className="space-y-2">
              {recentCashouts.slice(0, 5).map((cashout, index) => (
                <div
                  key={`${cashout.username || "unknown"}-${cashout.timestamp || Date.now()}-${index}`}
                  className="flex items-center justify-between text-sm p-2 rounded-lg bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20"
                >
                  <div className="flex items-center gap-2">
                    {cashout.is_bot ? (
                      <Bot className="w-3 h-3 text-indigo-400" />
                    ) : (
                      <User className="w-3 h-3 text-blue-400" />
                    )}
                    <span className="text-slate-300">{cashout.username || "Unknown"}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-green-400 font-medium">
                      {(cashout.multiplier || cashout.cashout_multiplier || 0).toFixed(2)}x
                    </span>
                    <span className="text-slate-400">
                      +
                      {cashout.win_amount !== undefined
                        ? typeof cashout.win_amount === "string"
                          ? Number.parseFloat(cashout.win_amount).toFixed(0)
                          : cashout.win_amount.toFixed(0)
                        : typeof cashout.amount === "string"
                          ? Number.parseFloat(cashout.amount).toFixed(0)
                          : (cashout.amount || 0).toFixed(0)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
