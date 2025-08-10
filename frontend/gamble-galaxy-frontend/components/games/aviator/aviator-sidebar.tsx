"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Trophy, Users, TrendingUp, Crown } from "lucide-react"
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
  //setBetAmount1,
  //setBetAmount2,
  //isBettingPhase,
}: AviatorSidebarProps) {
  return (
    <div className={cn("space-y-4 sm:space-y-6", showSidebar ? "block" : "hidden lg:block")}>
      <Tabs defaultValue="winners" className="w-full">
        <TabsList className="w-full grid grid-cols-3 bg-white/5 border border-white/10 backdrop-blur-3xl rounded-xl sm:rounded-2xl h-10 sm:h-12 p-1">
          <TabsTrigger
            value="winners"
            className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-amber-500/20 data-[state=active]:to-orange-500/20 data-[state=active]:border data-[state=active]:border-amber-500/30 rounded-lg sm:rounded-xl text-xs py-2 text-white/70 data-[state=active]:text-amber-300 backdrop-blur-xl transition-all duration-300 data-[state=active]:shadow-lg"
          >
            <Trophy className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
            <span className="hidden sm:inline">Winners</span>
            <span className="sm:hidden">Win</span>
          </TabsTrigger>
          <TabsTrigger
            value="live"
            className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500/20 data-[state=active]:to-purple-500/20 data-[state=active]:border data-[state=active]:border-blue-500/30 rounded-lg sm:rounded-xl text-xs py-2 text-white/70 data-[state=active]:text-blue-300 backdrop-blur-xl transition-all duration-300 data-[state=active]:shadow-lg"
          >
            <Users className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
            <span className="hidden sm:inline">Live</span>
            <span className="sm:hidden">Live</span>
          </TabsTrigger>
          <TabsTrigger
            value="stats"
            className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-500/20 data-[state=active]:to-emerald-500/20 data-[state=active]:border data-[state=active]:border-green-500/30 rounded-lg sm:rounded-xl text-xs py-2 text-white/70 data-[state=active]:text-green-300 backdrop-blur-xl transition-all duration-300 data-[state=active]:shadow-lg"
          >
            <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
            <span className="hidden sm:inline">Stats</span>
            <span className="sm:hidden">Stats</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="winners" className="mt-4">
          <Card className="bg-gradient-to-br from-white/10 via-white/5 to-transparent backdrop-blur-3xl border border-white/10 shadow-2xl rounded-2xl sm:rounded-3xl overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 via-transparent to-orange-500/5 rounded-2xl sm:rounded-3xl"></div>
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>

            <CardContent className="p-4 sm:p-6 space-y-3 sm:space-y-4 relative z-10">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-amber-500/20 to-orange-500/20 rounded-xl sm:rounded-2xl flex items-center justify-center border border-amber-500/20 backdrop-blur-xl">
                  <Trophy className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400" />
                </div>
                <div>
                  <h3 className="font-bold text-sm sm:text-base text-white/90">Top Winners</h3>
                  <p className="text-xs text-white/60">Hall of Fame</p>
                </div>
              </div>

              {topWinners.length > 0 ? (
                <div className="space-y-2 sm:space-y-3 max-h-64 sm:max-h-80 overflow-y-auto">
                  {topWinners.slice(0, 8).map((winner, index) => (
                    <div
                      key={index}
                      className="group flex items-center justify-between p-3 sm:p-4 bg-gradient-to-r from-white/5 to-white/10 rounded-xl sm:rounded-2xl border border-white/10 backdrop-blur-2xl hover:from-white/10 hover:to-white/15 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg"
                    >
                      <div className="flex items-center gap-3 sm:gap-4">
                        <div className="relative">
                          <div className="w-8 h-8 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-gradient-to-br from-amber-500/30 to-orange-500/30 flex items-center justify-center text-xs sm:text-sm font-bold text-white backdrop-blur-xl border border-amber-500/20">
                            {winner.username ? winner.username.charAt(0).toUpperCase() : "?"}
                          </div>
                          {index === 0 && (
                            <div className="absolute -top-1 -right-1">
                              <Crown className="w-3 h-3 sm:w-4 sm:h-4 text-amber-400 animate-pulse" />
                            </div>
                          )}
                        </div>
                        <div>
                          <div className="font-semibold text-xs sm:text-sm text-white/90 truncate max-w-20 sm:max-w-none">
                            {winner.username}
                          </div>
                          <div className="text-xs text-amber-400 font-medium">
                            {winner.multiplier ? `${winner.multiplier.toFixed(2)}x` : "—"}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-green-400 font-bold text-xs sm:text-sm">
                          KES {Number.parseFloat(winner.amount.toString()).toFixed(0)}
                        </div>
                        <div className="text-xs text-white/50">winnings</div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-8 sm:py-12 text-center">
                  <Trophy className="w-8 h-8 sm:w-12 sm:h-12 mx-auto mb-3 text-white/20" />
                  <p className="text-white/60 text-sm">No winners yet</p>
                  <p className="text-white/40 text-xs">Be the first to win big!</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="live" className="mt-4">
          <Card className="bg-gradient-to-br from-white/10 via-white/5 to-transparent backdrop-blur-3xl border border-white/10 shadow-2xl rounded-2xl sm:rounded-3xl overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-purple-500/5 rounded-2xl sm:rounded-3xl"></div>
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>

            <CardContent className="p-4 sm:p-6 space-y-3 sm:space-y-4 relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-xl sm:rounded-2xl flex items-center justify-center border border-blue-500/20 backdrop-blur-xl">
                    <Users className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm sm:text-base text-white/90">Live Bets</h3>
                    <p className="text-xs text-white/60">Active players</p>
                  </div>
                </div>
                <Badge className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 text-blue-400 border-blue-500/30 text-xs sm:text-sm px-2 sm:px-3 py-1 backdrop-blur-xl animate-pulse">
                  {livePlayers || 0}
                </Badge>
              </div>

              {recentCashouts.length > 0 ? (
                <div className="space-y-2 sm:space-y-3 max-h-64 sm:max-h-80 overflow-y-auto">
                  {recentCashouts.slice(0, 8).map((bet, index) => (
                    <div
                      key={index}
                      className="group flex items-center justify-between p-3 sm:p-4 bg-gradient-to-r from-white/5 to-white/10 rounded-xl sm:rounded-2xl border border-white/10 backdrop-blur-2xl hover:from-white/10 hover:to-white/15 transition-all duration-300 hover:scale-[1.02]"
                    >
                      <div className="flex items-center gap-3 sm:gap-4">
                        <div className="w-8 h-8 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-gradient-to-br from-blue-500/30 to-purple-500/30 flex items-center justify-center text-xs sm:text-sm font-bold text-white backdrop-blur-xl border border-blue-500/20">
                          {(bet.username || "A").charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-semibold text-xs sm:text-sm text-white/90 truncate max-w-20 sm:max-w-none">
                            {bet.username || "Anonymous"}
                          </div>
                          {bet.cashout_multiplier !== undefined && (
                            <div className="text-xs text-blue-400 font-medium">
                              {bet.cashout_multiplier.toFixed(2)}x
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-green-400 font-bold text-xs sm:text-sm">
                          KES {Number(bet.amount || 0).toFixed(0)}
                        </div>
                        <div className="text-xs text-white/50">bet</div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-8 sm:py-12 text-center">
                  <Users className="w-8 h-8 sm:w-12 sm:h-12 mx-auto mb-3 text-white/20" />
                  <p className="text-white/60 text-sm">No live bets</p>
                  <p className="text-white/40 text-xs">Waiting for players...</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="stats" className="mt-4">
          <Card className="bg-gradient-to-br from-white/10 via-white/5 to-transparent backdrop-blur-3xl border border-white/10 shadow-2xl rounded-2xl sm:rounded-3xl overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 via-transparent to-emerald-500/5 rounded-2xl sm:rounded-3xl"></div>
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>

            <CardContent className="p-4 sm:p-6 space-y-3 sm:space-y-4 relative z-10">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-xl sm:rounded-2xl flex items-center justify-center border border-green-500/20 backdrop-blur-xl">
                  <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-green-400" />
                </div>
                <div>
                  <h3 className="font-bold text-sm sm:text-base text-white/90">Statistics</h3>
                  <p className="text-xs text-white/60">Game insights</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                <div className="p-3 sm:p-4 bg-gradient-to-br from-amber-500/10 to-orange-500/10 rounded-xl sm:rounded-2xl border border-amber-500/20 backdrop-blur-2xl relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-transparent"></div>
                  <div className="relative z-10">
                    <div className="text-xs text-amber-400 mb-2 font-medium">Highest</div>
                    <div className="text-lg sm:text-2xl font-bold text-amber-400">
                      {Math.max(...pastCrashes, 1).toFixed(2)}x
                    </div>
                  </div>
                </div>
                <div className="p-3 sm:p-4 bg-gradient-to-br from-red-500/10 to-pink-500/10 rounded-xl sm:rounded-2xl border border-red-500/20 backdrop-blur-2xl relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 to-transparent"></div>
                  <div className="relative z-10">
                    <div className="text-xs text-red-400 mb-2 font-medium">Lowest</div>
                    <div className="text-lg sm:text-2xl font-bold text-red-400">
                      {Math.min(...pastCrashes, 10).toFixed(2)}x
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-3 sm:p-4 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-xl sm:rounded-2xl border border-blue-500/20 backdrop-blur-2xl relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent"></div>
                <div className="relative z-10">
                  <div className="text-xs text-blue-400 mb-2 font-medium">Average Multiplier</div>
                  <div className="text-lg sm:text-2xl font-bold text-blue-400">
                    {pastCrashes.length > 0
                      ? (pastCrashes.reduce((a, b) => a + b, 0) / pastCrashes.length).toFixed(2)
                      : "0.00"}
                    x
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
