"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Trophy, Users, TrendingUp, Zap } from 'lucide-react'
import { cn } from "@/lib/utils"
import type { TopWinner, RecentCashout } from "@/lib/types"

interface AviatorSidebarProps {
  showSidebar: boolean
  topWinners: TopWinner[]
  livePlayers: number
  recentCashouts: RecentCashout[]
  pastCrashes: number[]
  setBetAmount1: (amount: string) => void
  setBetAmount2: (amount: string) => void
  isBettingPhase: boolean
}

export function AviatorSidebar({
  showSidebar,
  topWinners,
  livePlayers,
  recentCashouts,
  pastCrashes,
  setBetAmount1,
  setBetAmount2,
  isBettingPhase
}: AviatorSidebarProps) {
  return (
    <div className={cn("space-y-4", showSidebar ? "block" : "hidden lg:block")}>
      <Tabs defaultValue="winners" className="w-full">
        <TabsList className="w-full grid grid-cols-3 bg-white/10 border border-white/20 backdrop-blur-2xl rounded-xl h-10">
          <TabsTrigger
            value="winners"
            className="data-[state=active]:bg-white/20 rounded-lg text-xs py-2 text-white/80 data-[state=active]:text-white backdrop-blur-xl"
          >
            <Trophy className="w-3 h-3 mr-1" />
            Top
          </TabsTrigger>
          <TabsTrigger
            value="live"
            className="data-[state=active]:bg-white/20 rounded-lg text-xs py-2 text-white/80 data-[state=active]:text-white backdrop-blur-xl"
          >
            <Users className="w-3 h-3 mr-1" />
            Live
          </TabsTrigger>
          <TabsTrigger
            value="stats"
            className="data-[state=active]:bg-white/20 rounded-lg text-xs py-2 text-white/80 data-[state=active]:text-white backdrop-blur-xl"
          >
            <TrendingUp className="w-3 h-3 mr-1" />
            Stats
          </TabsTrigger>
        </TabsList>

        <TabsContent value="winners">
          <Card className="bg-white/5 backdrop-blur-2xl border border-white/10 shadow-2xl rounded-2xl overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent rounded-2xl"></div>
            <CardContent className="p-4 space-y-3 relative z-10">
              <h3 className="font-bold text-sm flex items-center text-white/90">
                <Trophy className="w-4 h-4 mr-2 text-amber-400" />
                Top Winners
              </h3>
              {topWinners.length > 0 ? (
                <div className="space-y-2">
                  {topWinners.slice(0, 5).map((winner, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/10 backdrop-blur-xl"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-r from-amber-500/80 to-orange-500/80 flex items-center justify-center text-xs font-bold text-white backdrop-blur-xl">
                          {winner.username ? winner.username.charAt(0).toUpperCase() : "?"}
                        </div>
                        <div>
                          <div className="font-medium text-xs text-white/90">{winner.username}</div>
                          <div className="text-xs text-white/60">
                            {winner.multiplier ? `${winner.multiplier.toFixed(2)}x` : "—"}
                          </div>
                        </div>
                      </div>
                      <div className="text-green-400 font-bold text-xs">
                        KES {Number.parseFloat(winner.amount.toString()).toFixed(0)}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-6 text-center text-white/60 text-xs">No winners yet</div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="live">
          <Card className="bg-white/5 backdrop-blur-2xl border border-white/10 shadow-2xl rounded-2xl overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent rounded-2xl"></div>
            <CardContent className="p-4 space-y-3 relative z-10">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-sm flex items-center text-white/90">
                  <Users className="w-4 h-4 mr-2 text-blue-400" />
                  Live Bets
                </h3>
                <Badge
                  variant="primary"
                  className="bg-blue-500/20 text-blue-400 border-blue-500/30 text-xs px-2 py-1 backdrop-blur-xl"
                >
                  {livePlayers || 0}
                </Badge>
              </div>
              {recentCashouts.length > 0 ? (
                <div className="space-y-2">
                  {recentCashouts.slice(0, 5).map((bet, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/10 backdrop-blur-xl"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500/80 to-purple-500/80 flex items-center justify-center text-xs font-bold text-white backdrop-blur-xl">
                          {(bet.username || "A").charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-medium text-xs text-white/90">{bet.username || "Anonymous"}</div>
                          {bet.cashout_multiplier !== undefined && (
                            <div className="text-xs text-white/60">{bet.cashout_multiplier.toFixed(2)}x</div>
                          )}
                        </div>
                      </div>
                      <div className="text-green-400 font-bold text-xs">
                        KES {Number(bet.amount || 0).toFixed(0)}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-6 text-center text-white/60 text-xs">No live bets</div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="stats">
          <Card className="bg-white/5 backdrop-blur-2xl border border-white/10 shadow-2xl rounded-2xl overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent rounded-2xl"></div>
            <CardContent className="p-4 space-y-4 relative z-10">
              <h3 className="font-bold text-sm flex items-center text-white/90">
                <TrendingUp className="w-4 h-4 mr-2 text-green-400" />
                Statistics
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-amber-500/10 rounded-xl border border-amber-500/20 backdrop-blur-xl">
                  <div className="text-xs text-white/70 mb-1">High</div>
                  <div className="text-lg font-bold text-amber-400">
                    {Math.max(...pastCrashes, 1).toFixed(2)}x
                  </div>
                </div>
                <div className="p-3 bg-red-500/10 rounded-xl border border-red-500/20 backdrop-blur-xl">
                  <div className="text-xs text-white/70 mb-1">Low</div>
                  <div className="text-lg font-bold text-red-400">{Math.min(...pastCrashes, 10).toFixed(2)}x</div>
                </div>
              </div>
              <div className="p-3 bg-blue-500/10 rounded-xl border border-blue-500/20 backdrop-blur-xl">
                <div className="text-xs text-white/70 mb-1">Average</div>
                <div className="text-lg font-bold text-blue-400">
                  {pastCrashes.length > 0
                    ? (pastCrashes.reduce((a, b) => a + b, 0) / pastCrashes.length).toFixed(2)
                    : "0.00"}
                  x
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Quick Bets */}
      <Card className="bg-white/5 backdrop-blur-2xl border border-white/10 shadow-2xl rounded-2xl overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent rounded-2xl"></div>
        <CardContent className="p-4 relative z-10">
          <div className="flex items-center gap-2 mb-3">
            <Zap className="w-4 h-4 text-amber-400" />
            <h3 className="font-bold text-sm text-white/90">Quick Bets</h3>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {[50, 100, 200, 500].map((amount) => (
              <Button
                key={amount}
                variant="outline"
                className="bg-white/10 border-white/20 hover:bg-white/20 h-8 text-xs font-bold transition-all duration-300 text-white/80 hover:text-white backdrop-blur-xl"
                onClick={() => {
                  setBetAmount1(amount.toString())
                  setBetAmount2(amount.toString())
                }}
                disabled={!isBettingPhase}
              >
                KES {amount}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
