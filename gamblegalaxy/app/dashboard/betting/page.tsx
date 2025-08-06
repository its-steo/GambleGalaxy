"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/contexts/auth-context"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { motion, AnimatePresence } from "framer-motion"
import { Trophy, Clock, TrendingUp, Star, Users, Target, Zap } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import BetSlip from "@/components/bet-slip"
import SureOddsModal from "@/components/sure-odds-modal"

interface Match {
  id: number
  home_team: string
  away_team: string
  match_time: string
  status: string
  odds_home_win: number
  odds_draw: number
  odds_away_win: number
  odds_over_2_5?: number
  odds_under_2_5?: number
  odds_btts_yes?: number
  odds_btts_no?: number
  score_home: number
  score_away: number
}

interface BetSelection {
  matchId: number
  match: Match
  selection: string
  odds: number
  selectionLabel: string
}

export default function BettingPage() {
  const { token } = useAuth()
  const { toast } = useToast()
  const [matches, setMatches] = useState<Match[]>([])
  const [loading, setLoading] = useState(true)
  const [betSelections, setBetSelections] = useState<BetSelection[]>([])
  const [showBetSlip, setShowBetSlip] = useState(false)
  const [showSureOdds, setShowSureOdds] = useState(false)
  const [activeTab, setActiveTab] = useState("all")

  useEffect(() => {
    fetchMatches()
  }, [])

  const fetchMatches = async () => {
    try {
      const response = await fetch("/api/betting/matches", {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (response.ok) {
        const data = await response.json()
        setMatches(data)
      }
    } catch (error) {
      console.error("Error fetching matches:", error)
    } finally {
      setLoading(false)
    }
  }

  const addToBetSlip = (match: Match, selection: string, odds: number, selectionLabel: string) => {
    const existingIndex = betSelections.findIndex((bet) => bet.matchId === match.id)

    if (existingIndex >= 0) {
      const updated = [...betSelections]
      updated[existingIndex] = { matchId: match.id, match, selection, odds, selectionLabel }
      setBetSelections(updated)
    } else {
      setBetSelections([...betSelections, { matchId: match.id, match, selection, odds, selectionLabel }])
    }

    setShowBetSlip(true)
    toast({
      title: "Added to Bet Slip",
      description: `${match.home_team} vs ${match.away_team} - ${selectionLabel}`,
    })
  }

  const removeFromBetSlip = (matchId: number) => {
    setBetSelections(betSelections.filter((bet) => bet.matchId !== matchId))
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "upcoming":
        return "bg-blue-500/20 text-blue-300 border-blue-500/30"
      case "first_half":
      case "second_half":
        return "bg-green-500/20 text-green-300 border-green-500/30"
      case "halftime":
        return "bg-yellow-500/20 text-yellow-300 border-yellow-500/30"
      case "fulltime":
        return "bg-gray-500/20 text-gray-300 border-gray-500/30"
      default:
        return "bg-gray-500/20 text-gray-300 border-gray-500/30"
    }
  }

  const filteredMatches = matches.filter((match) => {
    if (activeTab === "live") return ["first_half", "second_half", "halftime"].includes(match.status)
    if (activeTab === "upcoming") return match.status === "upcoming"
    if (activeTab === "finished") return match.status === "fulltime"
    return true
  })

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="animate-pulse space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-32 bg-white/10 rounded-2xl"></div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Sports Betting 🏆</h1>
            <p className="text-gray-400">Place your bets on live and upcoming matches</p>
          </div>
          <Button
            onClick={() => setShowSureOdds(true)}
            className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 animate-glow"
          >
            <Star className="w-4 h-4 mr-2" />
            Sure Odds
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="glass-card">
            <CardContent className="p-4 text-center">
              <Trophy className="w-8 h-8 text-yellow-400 mx-auto mb-2" />
              <p className="text-xl font-bold text-white">{matches.length}</p>
              <p className="text-sm text-gray-400">Total Matches</p>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardContent className="p-4 text-center">
              <Zap className="w-8 h-8 text-green-400 mx-auto mb-2" />
              <p className="text-xl font-bold text-white">
                {matches.filter((m) => ["first_half", "second_half"].includes(m.status)).length}
              </p>
              <p className="text-sm text-gray-400">Live Now</p>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardContent className="p-4 text-center">
              <Clock className="w-8 h-8 text-blue-400 mx-auto mb-2" />
              <p className="text-xl font-bold text-white">{matches.filter((m) => m.status === "upcoming").length}</p>
              <p className="text-sm text-gray-400">Upcoming</p>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardContent className="p-4 text-center">
              <Target className="w-8 h-8 text-purple-400 mx-auto mb-2" />
              <p className="text-xl font-bold text-white">{betSelections.length}</p>
              <p className="text-sm text-gray-400">In Bet Slip</p>
            </CardContent>
          </Card>
        </div>
      </motion.div>

      {/* Tabs */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="glass-card p-1 w-full">
            <TabsTrigger value="all" className="flex-1">
              All Matches
            </TabsTrigger>
            <TabsTrigger value="live" className="flex-1">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span>Live</span>
              </div>
            </TabsTrigger>
            <TabsTrigger value="upcoming" className="flex-1">
              Upcoming
            </TabsTrigger>
            <TabsTrigger value="finished" className="flex-1">
              Finished
            </TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-6 space-y-4">
            <AnimatePresence>
              {filteredMatches.map((match, index) => (
                <motion.div
                  key={match.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="glass-card hover:bg-white/10 transition-all duration-300">
                    <CardContent className="p-6">
                      {/* Match Header */}
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-4">
                          <div className="text-center">
                            <p className="text-white font-bold text-lg">{match.home_team}</p>
                            <p className="text-gray-400 text-sm">vs</p>
                            <p className="text-white font-bold text-lg">{match.away_team}</p>
                          </div>
                          {match.status !== "upcoming" && (
                            <div className="text-center">
                              <p className="text-2xl font-bold text-white">
                                {match.score_home} - {match.score_away}
                              </p>
                            </div>
                          )}
                        </div>

                        <div className="text-right space-y-2">
                          <Badge className={getStatusColor(match.status)}>
                            {match.status === "first_half"
                              ? "1st Half"
                              : match.status === "second_half"
                                ? "2nd Half"
                                : match.status === "halftime"
                                  ? "Half Time"
                                  : match.status === "fulltime"
                                    ? "Full Time"
                                    : "Upcoming"}
                          </Badge>
                          <p className="text-gray-400 text-sm">{new Date(match.match_time).toLocaleDateString()}</p>
                          <p className="text-gray-400 text-sm">{new Date(match.match_time).toLocaleTimeString()}</p>
                        </div>
                      </div>

                      {/* Betting Options */}
                      {match.status === "upcoming" && (
                        <div className="space-y-4">
                          {/* 1X2 Betting */}
                          <div>
                            <h4 className="text-white font-semibold mb-3 flex items-center">
                              <Trophy className="w-4 h-4 mr-2 text-yellow-400" />
                              Match Result (1X2)
                            </h4>
                            <div className="grid grid-cols-3 gap-3">
                              <Button
                                onClick={() =>
                                  addToBetSlip(match, "home_win", match.odds_home_win, `${match.home_team} Win`)
                                }
                                className="glass-button h-16 flex flex-col space-y-1 hover:bg-green-500/20"
                              >
                                <span className="text-sm">1</span>
                                <span className="font-bold">{match.odds_home_win}</span>
                                <span className="text-xs text-gray-400">{match.home_team}</span>
                              </Button>

                              <Button
                                onClick={() => addToBetSlip(match, "draw", match.odds_draw, "Draw")}
                                className="glass-button h-16 flex flex-col space-y-1 hover:bg-yellow-500/20"
                              >
                                <span className="text-sm">X</span>
                                <span className="font-bold">{match.odds_draw}</span>
                                <span className="text-xs text-gray-400">Draw</span>
                              </Button>

                              <Button
                                onClick={() =>
                                  addToBetSlip(match, "away_win", match.odds_away_win, `${match.away_team} Win`)
                                }
                                className="glass-button h-16 flex flex-col space-y-1 hover:bg-green-500/20"
                              >
                                <span className="text-sm">2</span>
                                <span className="font-bold">{match.odds_away_win}</span>
                                <span className="text-xs text-gray-400">{match.away_team}</span>
                              </Button>
                            </div>
                          </div>

                          {/* Over/Under & BTTS */}
                          <div className="grid md:grid-cols-2 gap-6">
                            {/* Over/Under 2.5 */}
                            {match.odds_over_2_5 && match.odds_under_2_5 && (
                              <div>
                                <h4 className="text-white font-semibold mb-3 flex items-center">
                                  <Target className="w-4 h-4 mr-2 text-blue-400" />
                                  Total Goals (O/U 2.5)
                                </h4>
                                <div className="grid grid-cols-2 gap-3">
                                  <Button
                                    onClick={() =>
                                      addToBetSlip(match, "over_2.5", match.odds_over_2_5!, "Over 2.5 Goals")
                                    }
                                    className="glass-button h-12 hover:bg-green-500/20"
                                  >
                                    <div className="text-center">
                                      <p className="font-bold">{match.odds_over_2_5}</p>
                                      <p className="text-xs text-gray-400">Over 2.5</p>
                                    </div>
                                  </Button>

                                  <Button
                                    onClick={() =>
                                      addToBetSlip(match, "under_2.5", match.odds_under_2_5!, "Under 2.5 Goals")
                                    }
                                    className="glass-button h-12 hover:bg-red-500/20"
                                  >
                                    <div className="text-center">
                                      <p className="font-bold">{match.odds_under_2_5}</p>
                                      <p className="text-xs text-gray-400">Under 2.5</p>
                                    </div>
                                  </Button>
                                </div>
                              </div>
                            )}

                            {/* Both Teams To Score */}
                            {match.odds_btts_yes && match.odds_btts_no && (
                              <div>
                                <h4 className="text-white font-semibold mb-3 flex items-center">
                                  <Users className="w-4 h-4 mr-2 text-purple-400" />
                                  Both Teams To Score
                                </h4>
                                <div className="grid grid-cols-2 gap-3">
                                  <Button
                                    onClick={() => addToBetSlip(match, "btts_yes", match.odds_btts_yes!, "BTTS Yes")}
                                    className="glass-button h-12 hover:bg-green-500/20"
                                  >
                                    <div className="text-center">
                                      <p className="font-bold">{match.odds_btts_yes}</p>
                                      <p className="text-xs text-gray-400">Yes</p>
                                    </div>
                                  </Button>

                                  <Button
                                    onClick={() => addToBetSlip(match, "btts_no", match.odds_btts_no!, "BTTS No")}
                                    className="glass-button h-12 hover:bg-red-500/20"
                                  >
                                    <div className="text-center">
                                      <p className="font-bold">{match.odds_btts_no}</p>
                                      <p className="text-xs text-gray-400">No</p>
                                    </div>
                                  </Button>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Live Match Info */}
                      {["first_half", "second_half", "halftime"].includes(match.status) && (
                        <div className="text-center py-4">
                          <div className="flex items-center justify-center space-x-2 text-green-400">
                            <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                            <span className="font-semibold">LIVE MATCH IN PROGRESS</span>
                          </div>
                          <p className="text-gray-400 text-sm mt-2">Betting is closed for this match</p>
                        </div>
                      )}

                      {/* Finished Match */}
                      {match.status === "fulltime" && (
                        <div className="text-center py-4">
                          <Badge className="bg-gray-500/20 text-gray-300">Match Finished</Badge>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>

            {filteredMatches.length === 0 && (
              <div className="text-center py-12">
                <Trophy className="w-16 h-16 text-gray-400 mx-auto mb-4 opacity-50" />
                <h3 className="text-xl font-semibold text-white mb-2">No matches found</h3>
                <p className="text-gray-400">
                  {activeTab === "live"
                    ? "No live matches at the moment"
                    : activeTab === "upcoming"
                      ? "No upcoming matches"
                      : activeTab === "finished"
                        ? "No finished matches"
                        : "No matches available"}
                </p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </motion.div>

      {/* Bet Slip */}
      <BetSlip
        selections={betSelections}
        isOpen={showBetSlip}
        onClose={() => setShowBetSlip(false)}
        onRemoveSelection={removeFromBetSlip}
      />

      {/* Sure Odds Modal */}
      <SureOddsModal isOpen={showSureOdds} onClose={() => setShowSureOdds(false)} />

      {/* Floating Bet Slip Button */}
      {betSelections.length > 0 && !showBetSlip && (
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="fixed bottom-24 right-6 z-40">
          <Button
            onClick={() => setShowBetSlip(true)}
            className="w-16 h-16 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 shadow-2xl animate-glow"
          >
            <div className="text-center">
              <TrendingUp className="w-6 h-6 mx-auto" />
              <span className="text-xs font-bold">{betSelections.length}</span>
            </div>
          </Button>
        </motion.div>
      )}
    </div>
  )
}
