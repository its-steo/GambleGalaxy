"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { MatchCard } from "@/components/betting/match-card"
import { BetSlip } from "@/components/betting/bet_slip"
import { SureOddsModal } from "@/components/betting/sure-odds-modal"
import { Navbar } from "@/components/ui/navbar"
import { Trophy, History, Star, Search, Filter, TrendingUp, Users, Clock, Zap, Target, Award } from "lucide-react"
import type { Match, Bet } from "@/lib/types"
import { api } from "@/lib/api"
import { useAuth } from "@/lib/auth"
import { toast } from "sonner"
import SideNav from "@/components/ui/SideNav"

interface BetSlipItem {
  match: Match
  selectedOption: "home_win" | "draw" | "away_win"
}

export default function BettingPage() {
  const router = useRouter()
  const { isAuthenticated, isLoading: authLoading } = useAuth()
  const [matches, setMatches] = useState<Match[]>([])
  const [betHistory, setBetHistory] = useState<Bet[]>([])
  const [betSlip, setBetSlip] = useState<BetSlipItem[]>([])
  const [selectedOptions, setSelectedOptions] = useState<Record<number, "home_win" | "draw" | "away_win">>({})
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [sureOddsOpen, setSureOddsOpen] = useState(false)
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [liveStats, setLiveStats] = useState({
    activeBets: 1247,
    totalPayout: 45280,
    liveMatches: 12,
    winRate: 68.5,
  })

  // Mouse tracking for interactive background
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY })
    }
    window.addEventListener("mousemove", handleMouseMove)
    return () => window.removeEventListener("mousemove", handleMouseMove)
  }, [])

  // Simulate live stats updates
  useEffect(() => {
    const interval = setInterval(() => {
      setLiveStats((prev) => ({
        activeBets: prev.activeBets + Math.floor(Math.random() * 5) - 2,
        totalPayout: prev.totalPayout + Math.floor(Math.random() * 1000) - 500,
        liveMatches: Math.max(8, prev.liveMatches + Math.floor(Math.random() * 3) - 1),
        winRate: Math.max(60, Math.min(75, prev.winRate + (Math.random() - 0.5) * 2)),
      }))
    }, 3000)
    return () => clearInterval(interval)
  }, [])

  // Fixed authentication check - wait for auth loading to complete
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/auth/login")
    }
  }, [isAuthenticated, authLoading, router])

  useEffect(() => {
    // Only load data when authenticated and not loading
    if (!authLoading && isAuthenticated) {
      loadMatches()
      loadBetHistory()
    }
  }, [isAuthenticated, authLoading])

  const loadMatches = async () => {
    try {
      const response = await api.getMatches()
      if (response.data) setMatches(response.data)
    } catch {
      toast.error("Failed to load matches")
    } finally {
      setLoading(false)
    }
  }

  const loadBetHistory = async () => {
    try {
      const response = await api.getBetHistory()
      if (response.data) setBetHistory(response.data)
    } catch {
      console.error("Failed to load bet history")
    }
  }

  const handleAddToBetSlip = (match: Match, option: "home_win" | "draw" | "away_win") => {
    const existingIndex = betSlip.findIndex((item) => item.match.id === match.id)
    if (existingIndex >= 0) {
      const updatedSlip = [...betSlip]
      updatedSlip[existingIndex].selectedOption = option
      setBetSlip(updatedSlip)
    } else {
      setBetSlip([...betSlip, { match, selectedOption: option }])
    }
    setSelectedOptions((prev) => ({ ...prev, [match.id]: option }))

    toast.success("Added to bet slip!", {
      duration: 2000,
      className: "bg-green-500/90 text-white border-green-400",
    })
  }

  const handleRemoveFromBetSlip = (matchId: number) => {
    setBetSlip((prev) => prev.filter((item) => item.match.id !== matchId))
    setSelectedOptions((prev) => {
      const updated = { ...prev }
      delete updated[matchId]
      return updated
    })
  }

  const handleClearBetSlip = () => {
    setBetSlip([])
    setSelectedOptions({})
    toast.info("Bet slip cleared")
  }

  const handleShare = () => {
    if (betSlip.length === 0) {
      toast.error("Add some bets to your slip first!")
      return
    }

    const shareText = `Check out my bet slip on Gamble Galaxy!\n${betSlip
      .map((item) => `${item.match.home_team} vs ${item.match.away_team} - ${item.selectedOption.replace("_", " ")}`)
      .join("\n")}`

    if (navigator.share) {
      navigator.share({
        title: "My Bet Slip - Gamble Galaxy",
        text: shareText,
        url: window.location.href,
      })
    } else {
      navigator.clipboard.writeText(shareText)
      toast.success("Bet slip copied to clipboard!")
    }
  }

  const filteredMatches = matches.filter((match) => {
    const search = searchTerm.toLowerCase()
    const matchesSearch =
      match.home_team.toLowerCase().includes(search) || match.away_team.toLowerCase().includes(search)
    const matchesStatus = statusFilter === "all" || match.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-gradient-to-r from-yellow-500 to-orange-500"
      case "won":
        return "bg-gradient-to-r from-green-500 to-emerald-500"
      case "lost":
        return "bg-gradient-to-r from-red-500 to-pink-500"
      default:
        return "bg-gradient-to-r from-gray-500 to-gray-600"
    }
  }

  // Show loading while auth is being checked
  if (authLoading) {
    return (
      <div className="min-h-screen bg-black relative overflow-hidden flex items-center justify-center px-4">
        {/* Animated Background */}
        <div className="fixed inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-pink-900/20 to-blue-900/20" />
          <div className="absolute top-1/4 left-1/4 w-48 h-48 sm:w-72 sm:h-72 bg-purple-500/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-60 h-60 sm:w-80 sm:h-80 bg-pink-500/10 rounded-full blur-3xl animate-pulse delay-1000" />
        </div>

        <div className="relative z-10 text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-12 w-12 sm:h-16 sm:w-16 border-4 border-purple-500/30 border-t-purple-500 mx-auto mb-4 sm:mb-6"></div>
            <div className="absolute inset-0 animate-ping rounded-full h-12 w-12 sm:h-16 sm:w-16 border-2 border-purple-400/50 mx-auto"></div>
          </div>
          <p className="text-white text-lg sm:text-xl font-semibold mb-2">Checking authentication...</p>
          <p className="text-gray-400 text-sm sm:text-base">Please wait a moment</p>
        </div>
      </div>
    )
  }

  // Don't render anything if not authenticated (will redirect)
  if (!isAuthenticated) return null

  if (loading) {
    return (
      <div className="min-h-screen bg-black relative overflow-hidden flex items-center justify-center px-4">
        {/* Animated Background */}
        <div className="fixed inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-pink-900/20 to-blue-900/20" />
          <div className="absolute top-1/4 left-1/4 w-48 h-48 sm:w-72 sm:h-72 bg-purple-500/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-60 h-60 sm:w-80 sm:h-80 bg-pink-500/10 rounded-full blur-3xl animate-pulse delay-1000" />
        </div>

        <div className="relative z-10 text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-12 w-12 sm:h-16 sm:w-16 border-4 border-purple-500/30 border-t-purple-500 mx-auto mb-4 sm:mb-6"></div>
            <div className="absolute inset-0 animate-ping rounded-full h-12 w-12 sm:h-16 sm:w-16 border-2 border-purple-400/50 mx-auto"></div>
          </div>
          <p className="text-white text-lg sm:text-xl font-semibold mb-2">Loading matches...</p>
          <p className="text-gray-400 text-sm sm:text-base">Preparing your betting experience</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      {/* Enhanced Navbar */}
      <Navbar onMobileMenuToggle={() => setIsMobileMenuOpen(!isMobileMenuOpen)} isMobileMenuOpen={isMobileMenuOpen} />

      {/* Animated Background */}
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-pink-900/20 to-blue-900/20" />
        <div
          className="absolute w-48 h-48 sm:w-72 sm:h-72 lg:w-96 lg:h-96 bg-purple-500/10 rounded-full blur-3xl transition-all duration-1000 ease-out"
          style={{
            left: mousePosition.x - 96,
            top: mousePosition.y - 96,
          }}
        />
        <div className="absolute top-1/4 left-1/4 w-36 h-36 sm:w-48 sm:h-48 lg:w-72 lg:h-72 bg-pink-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-40 h-40 sm:w-60 sm:h-60 lg:w-80 lg:h-80 bg-blue-500/10 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>

      {/* Floating Particles */}
      <div className="fixed inset-0 z-0">
        {[...Array(15)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-white/20 rounded-full animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${2 + Math.random() * 3}s`,
            }}
          />
        ))}
      </div>

      <div className="relative z-10 flex w-full pt-16 lg:pt-0">
        {/* Mobile Menu Overlay */}
        {isMobileMenuOpen && (
          <div
            className="lg:hidden fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
            onClick={() => setIsMobileMenuOpen(false)}
          />
        )}

        {/* Mobile Menu Panel */}
        <div
          className={`lg:hidden fixed left-0 top-16 h-[calc(100vh-4rem)] z-50 transform transition-transform duration-300 ${
            isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <SideNav onShare={handleShare} onClose={() => setIsMobileMenuOpen(false)} />
        </div>

        {/* Desktop SideNav */}
        <div className="hidden lg:block">
          <SideNav onShare={handleShare} />
        </div>

        <main className="flex-1 min-h-screen lg:ml-0 pt-0 lg:pt-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
            {/* Hero Header */}
            <div className="text-center mb-8 sm:mb-12">
              <div className="inline-flex items-center px-3 py-2 sm:px-4 sm:py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-white/80 text-xs sm:text-sm mb-4 sm:mb-6">
                <Zap className="w-3 h-3 sm:w-4 sm:h-4 mr-2 text-yellow-400" />
                Live Betting Platform
              </div>

              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-white mb-4 sm:mb-6 leading-tight px-4">
                <Trophy className="inline w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 mr-2 sm:mr-3 text-purple-400" />
                Sports{" "}
                <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent block sm:inline">
                  Betting
                </span>
              </h1>

              <p className="text-base sm:text-lg lg:text-xl text-gray-300 mb-6 sm:mb-8 max-w-3xl mx-auto px-4">
                Experience the thrill of live sports betting with real-time odds and instant payouts
              </p>

              {/* Live Stats */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 max-w-4xl mx-auto mb-6 sm:mb-8 px-4">
                {[
                  {
                    label: "Active Bets",
                    value: liveStats.activeBets.toLocaleString(),
                    icon: Users,
                    color: "from-blue-500 to-cyan-500",
                  },
                  {
                    label: "Live Matches",
                    value: liveStats.liveMatches.toString(),
                    icon: Clock,
                    color: "from-green-500 to-emerald-500",
                  },
                  {
                    label: "Total Payout",
                    value: `$${(liveStats.totalPayout / 1000).toFixed(1)}K`,
                    icon: TrendingUp,
                    color: "from-purple-500 to-pink-500",
                  },
                  {
                    label: "Win Rate",
                    value: `${liveStats.winRate.toFixed(1)}%`,
                    icon: Target,
                    color: "from-yellow-500 to-orange-500",
                  },
                ].map((stat, index) => (
                  <div
                    key={index}
                    className="bg-white/5 backdrop-blur-sm rounded-xl sm:rounded-2xl p-3 sm:p-4 border border-white/10 hover:border-white/20 transition-all duration-300"
                  >
                    <div
                      className={`w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-r ${stat.color} rounded-lg flex items-center justify-center mx-auto mb-2`}
                    >
                      <stat.icon className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                    </div>
                    <div className="text-lg sm:text-xl font-bold text-white">{stat.value}</div>
                    <div className="text-xs text-gray-400">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>

            <Tabs defaultValue="matches" className="space-y-6 sm:space-y-8">
              <div className="flex justify-center px-4">
                <TabsList className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl sm:rounded-2xl p-1 sm:p-2 grid grid-cols-3 w-full max-w-md sm:max-w-lg">
                  <TabsTrigger
                    value="matches"
                    className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-pink-500 data-[state=active]:text-white rounded-lg sm:rounded-xl px-3 sm:px-6 py-2 sm:py-3 transition-all duration-300 text-xs sm:text-sm"
                  >
                    <Trophy className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                    <span className="hidden xs:inline">Live </span>Matches
                  </TabsTrigger>
                  <TabsTrigger
                    value="history"
                    disabled={!isAuthenticated}
                    className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-pink-500 data-[state=active]:text-white rounded-lg sm:rounded-xl px-3 sm:px-6 py-2 sm:py-3 transition-all duration-300 text-xs sm:text-sm"
                  >
                    <History className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                    <span className="hidden xs:inline">My </span>Bets
                  </TabsTrigger>
                  <TabsTrigger
                    value="sure-odds"
                    disabled={!isAuthenticated}
                    className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-pink-500 data-[state=active]:text-white rounded-lg sm:rounded-xl px-3 sm:px-6 py-2 sm:py-3 transition-all duration-300 text-xs sm:text-sm"
                  >
                    <Star className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                    <span className="hidden xs:inline">Sure </span>Odds
                  </TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="matches">
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 sm:gap-8">
                  <div className="xl:col-span-2 space-y-4 sm:space-y-6">
                    {/* Search and Filter */}
                    <Card className="bg-white/5 backdrop-blur-sm border border-white/10 hover:border-white/20 transition-all duration-300">
                      <CardContent className="p-4 sm:p-6">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
                          <div className="flex-1 relative">
                            <Search className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 sm:w-5 sm:h-5" />
                            <Input
                              placeholder="Search teams..."
                              value={searchTerm}
                              onChange={(e) => setSearchTerm(e.target.value)}
                              className="pl-10 sm:pl-12 bg-white/10 backdrop-blur-sm border-white/20 text-white placeholder-gray-400 rounded-lg sm:rounded-xl h-10 sm:h-12 focus:border-purple-400 transition-all duration-300 text-sm sm:text-base"
                            />
                          </div>
                          <div className="flex items-center space-x-2 sm:space-x-3">
                            <Filter className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
                            <select
                              value={statusFilter}
                              onChange={(e) => setStatusFilter(e.target.value)}
                              className="bg-white/10 backdrop-blur-sm border border-white/20 text-white rounded-lg sm:rounded-xl px-3 sm:px-4 py-2 sm:py-3 focus:border-purple-400 transition-all duration-300 text-sm sm:text-base"
                            >
                              <option value="all" className="bg-gray-800">
                                All Matches
                              </option>
                              <option value="upcoming" className="bg-gray-800">
                                Upcoming
                              </option>
                              <option value="first_half" className="bg-gray-800">
                                Live
                              </option>
                              <option value="fulltime" className="bg-gray-800">
                                Finished
                              </option>
                            </select>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Matches Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                      {filteredMatches.length > 0 ? (
                        filteredMatches.map((match) => (
                          <div key={match.id} className="transform hover:scale-105 transition-all duration-300">
                            <MatchCard
                              match={match}
                              onAddToBetSlip={handleAddToBetSlip}
                              selectedOptions={selectedOptions}
                            />
                          </div>
                        ))
                      ) : (
                        <div className="col-span-full">
                          <Card className="bg-white/5 backdrop-blur-sm border border-white/10">
                            <CardContent className="p-8 sm:p-12 text-center">
                              <Trophy className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-4 sm:mb-6 text-gray-500" />
                              <h3 className="text-lg sm:text-xl font-semibold text-white mb-2">No matches found</h3>
                              <p className="text-gray-400 text-sm sm:text-base">
                                Try adjusting your search or filter criteria
                              </p>
                            </CardContent>
                          </Card>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Enhanced Bet Slip */}
                  <div className="xl:col-span-1">
                    <div className="sticky top-20 sm:top-24">
                      <div className="transform hover:scale-105 transition-all duration-300">
                        <BetSlip
                          items={betSlip}
                          onRemoveItem={handleRemoveFromBetSlip}
                          onClearAll={handleClearBetSlip}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="history">
                <Card className="bg-white/5 backdrop-blur-sm border border-white/10 hover:border-white/20 transition-all duration-300">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center text-xl sm:text-2xl">
                      <History className="w-5 h-5 sm:w-6 sm:h-6 mr-2 sm:mr-3 text-purple-400" />
                      My Betting History
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 sm:p-6">
                    {betHistory.length > 0 ? (
                      <div className="space-y-3 sm:space-y-4">
                        {betHistory.map((bet) => (
                          <div
                            key={bet.id}
                            className="bg-white/5 backdrop-blur-sm rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-white/10 hover:border-white/20 transition-all duration-300 hover:scale-105"
                          >
                            <div className="flex items-center justify-between mb-3 sm:mb-4">
                              <div className="flex items-center space-x-3 sm:space-x-4">
                                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg sm:rounded-xl flex items-center justify-center">
                                  <span className="text-white font-bold text-xs sm:text-sm">#{bet.id}</span>
                                </div>
                                <span
                                  className={`px-2 sm:px-3 py-1 rounded-full text-xs font-semibold text-white ${getStatusBadgeColor(bet.status)}`}
                                >
                                  {bet.status.toUpperCase()}
                                </span>
                              </div>
                              <div className="text-right">
                                <div className="text-white font-bold text-base sm:text-lg">
                                  KES {Number.parseFloat(bet.amount).toFixed(2)}
                                </div>
                                <div className="text-gray-400 text-xs sm:text-sm">
                                  Odds: {Number.parseFloat(bet.total_odds).toFixed(2)}
                                </div>
                                {bet.status === "pending" && (
                                  <div className="text-yellow-400 text-xs sm:text-sm mt-1 font-semibold">
                                    Expected: KES{" "}
                                    {(Number.parseFloat(bet.amount) * Number.parseFloat(bet.total_odds)).toFixed(2)}
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className="space-y-2 text-xs sm:text-sm text-gray-300">
                              {bet.selections.map((selection, index) => (
                                <div
                                  key={index}
                                  className="flex items-center justify-between bg-white/5 rounded-lg p-2 sm:p-3"
                                >
                                  <span className="truncate mr-2">
                                    {selection.match.home_team} vs {selection.match.away_team}
                                  </span>
                                  <span className="text-purple-400 font-semibold flex-shrink-0">
                                    {selection.selected_option.replace("_", " ")}
                                  </span>
                                </div>
                              ))}
                            </div>
                            <div className="text-xs text-gray-400 mt-3 sm:mt-4 flex items-center">
                              <Clock className="w-3 h-3 mr-1" />
                              {new Date(bet.placed_at).toLocaleString()}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 sm:py-12">
                        <History className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-4 sm:mb-6 text-gray-500" />
                        <h3 className="text-lg sm:text-xl font-semibold text-white mb-2">No betting history</h3>
                        <p className="text-gray-400 mb-4 sm:mb-6 text-sm sm:text-base">
                          Place your first bet to see it here
                        </p>
                        <Button className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-xl text-sm sm:text-base">
                          <Trophy className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                          Start Betting
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="sure-odds">
                <Card className="bg-gradient-to-br from-yellow-900/20 to-orange-900/20 backdrop-blur-sm border border-yellow-500/30 hover:border-yellow-400/50 transition-all duration-300">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center text-xl sm:text-2xl">
                      <Star className="w-5 h-5 sm:w-6 sm:h-6 mr-2 sm:mr-3 text-yellow-500" />
                      Premium Sure Odds
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 sm:p-8">
                    <div className="text-center py-8 sm:py-12">
                      <div className="relative mb-6 sm:mb-8">
                        <Star className="w-16 h-16 sm:w-20 sm:h-20 mx-auto text-yellow-500 animate-pulse" />
                        <div className="absolute inset-0 w-16 h-16 sm:w-20 sm:h-20 mx-auto animate-ping">
                          <Star className="w-16 h-16 sm:w-20 sm:h-20 text-yellow-400/50" />
                        </div>
                      </div>
                      <h3 className="text-2xl sm:text-3xl font-bold text-white mb-3 sm:mb-4">
                        Guaranteed Winning Predictions
                      </h3>
                      <p className="text-gray-300 mb-6 sm:mb-8 text-base sm:text-lg max-w-2xl mx-auto">
                        Get access to our expert analysts' guaranteed winning predictions with 95%+ accuracy rate
                      </p>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
                        {[
                          { label: "Success Rate", value: "95.2%", icon: Award },
                          { label: "Daily Tips", value: "5-8", icon: Target },
                          { label: "Avg Odds", value: "2.5x", icon: TrendingUp },
                        ].map((stat, index) => (
                          <div
                            key={index}
                            className="bg-white/10 backdrop-blur-sm rounded-xl sm:rounded-2xl p-3 sm:p-4 border border-white/10"
                          >
                            <stat.icon className="w-6 h-6 sm:w-8 sm:h-8 mx-auto mb-2 text-yellow-400" />
                            <div className="text-xl sm:text-2xl font-bold text-white">{stat.value}</div>
                            <div className="text-xs sm:text-sm text-gray-400">{stat.label}</div>
                          </div>
                        ))}
                      </div>

                      <Button
                        onClick={() => setSureOddsOpen(true)}
                        className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white px-6 sm:px-8 py-3 sm:py-4 text-base sm:text-lg font-semibold rounded-xl sm:rounded-2xl shadow-2xl hover:shadow-yellow-500/25 transition-all duration-300 hover:scale-105"
                      >
                        <Star className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                        Access Sure Odds
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          <SureOddsModal isOpen={sureOddsOpen} onClose={() => setSureOddsOpen(false)} />
        </main>
      </div>
    </div>
  )
}
