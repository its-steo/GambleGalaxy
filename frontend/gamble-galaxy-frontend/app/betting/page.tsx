// Updated BettingPage (page.tsx) - Remove the fixed mobile menu button
"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { MatchCard } from "@/components/betting/match-card"
import { BetSlip } from "@/components/betting/bet_slip"
import { SureOddsModal } from "@/components/betting/sure-odds-modal"
import { Navbar } from "@/components/ui/navbar"
import GlassSideNav from "@/components/layout/glass-side-nav"
import {
  Trophy,
  History,
  Star,
  Search,
  Filter,
  TrendingUp,
  Users,
  Clock,
  Zap,
  Target,
  Award,
  Crown,
  Coins,
  X,
} from "lucide-react"
import type { Match, Bet } from "@/lib/types"
import { api } from "@/lib/api"
import { useAuth } from "@/lib/auth"
import { toast } from "sonner"
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet"
import { VisuallyHidden } from "@radix-ui/react-visually-hidden"

interface BetSlipItem {
  match: Match
  selectedOption: string
}

// Utility function to safely format numbers
const formatCurrency = (value: number): string => {
  return isNaN(value) ? "0.00" : value.toFixed(2)
}

const formatOdds = (value: number): string => {
  return isNaN(value) ? "1.00" : value.toFixed(2)
}

const BettingPage = () => {
  const { isAuthenticated, isLoading: authLoading } = useAuth()
  const [matches, setMatches] = useState<Match[]>([])
  const [betHistory, setBetHistory] = useState<Bet[]>([])
  const [betSlip, setBetSlip] = useState<BetSlipItem[]>([])
  const [selectedOptions, setSelectedOptions] = useState<Record<number, string>>({})
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [sureOddsOpen, setSureOddsOpen] = useState(false)
  const [betSlipOpen, setBetSlipOpen] = useState(false)
  const [resultsOpen, setResultsOpen] = useState(false)
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const [liveStats, setLiveStats] = useState({
    activeBets: 1247,
    totalPayout: 45280,
    liveMatches: 12,
    winRate: 68.5,
  })
  const [showPromotion, setShowPromotion] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(false)

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

  // Load matches and bet history only when authenticated and not loading
  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      loadMatches()
      loadBetHistory()
    }
  }, [isAuthenticated, authLoading])

  const loadMatches = async () => {
    try {
      const response = await api.getMatches()
      if (response.data) {
        setMatches(response.data)
      } else {
        console.error("Failed to load matches:", response.error)
        toast.error(response.error || "Failed to load matches")
      }
    } catch (error) {
      console.error("Error loading matches:", error)
      toast.error("Failed to load matches")
    } finally {
      setLoading(false)
    }
  }

  const loadBetHistory = async () => {
    try {
      const response = await api.getBetHistory()
      if (response.data) {
        setBetHistory(response.data)
      } else {
        console.error("Failed to load bet history:", response.error)
      }
    } catch (error) {
      console.error("Error loading bet history:", error)
    }
  }

  const handleAddToBetSlip = (match: Match, option: string) => {
    console.log(`Adding to bet slip: ${match.home_team} vs ${match.away_team} - ${option}`)

    try {
      const existingIndex = betSlip.findIndex((item) => item.match.id === match.id)

      if (existingIndex >= 0) {
        const updatedSlip = [...betSlip]
        updatedSlip[existingIndex].selectedOption = option
        setBetSlip(updatedSlip)
        console.log("Updated existing selection in bet slip")
      } else {
        setBetSlip([...betSlip, { match, selectedOption: option }])
        console.log("Added new selection to bet slip")
      }

      setSelectedOptions((prev) => ({ ...prev, [match.id]: option }))
    } catch (error) {
      console.error("Error adding to bet slip:", error)
      toast.error("Failed to add to bet slip", {
        description: "Please try again",
        className: "bg-red-500/90 text-white border-red-400 backdrop-blur-md",
      })
    }
  }

  const handleRemoveFromBetSlip = (matchId: number) => {
    console.log(`Removing match ${matchId} from bet slip`)
    setBetSlip((prev) => prev.filter((item) => item.match.id !== matchId))
    setSelectedOptions((prev) => {
      const updated = { ...prev }
      delete updated[matchId]
      return updated
    })
  }

  const handleClearBetSlip = () => {
    console.log("Clearing bet slip")
    setBetSlip([])
    setSelectedOptions({})
    toast.info("Bet slip cleared", {
      className: "bg-gradient-to-r from-blue-500/90 to-cyan-500/90 text-white border-blue-400 backdrop-blur-md",
    })
  }

  const handlePlaceBet = async (amount: number): Promise<void> => {
    console.log("🎯 Starting bet placement process...")

    if (!isAuthenticated) {
      console.log("❌ User not authenticated")
      toast.error("Please log in to place bets")
      return
    }

    if (betSlip.length === 0) {
      console.log("❌ Bet slip is empty")
      toast.error("Add some matches to your bet slip first")
      return
    }

    if (amount <= 0) {
      console.log("❌ Invalid bet amount:", amount)
      toast.error("Please enter a valid bet amount")
      return
    }

    try {
      const loadingToast = toast.loading("Placing your bet...", {
        className: "bg-gradient-to-r from-blue-500/90 to-cyan-500/90 text-white border-blue-400 backdrop-blur-md",
      })

      const betData = {
        amount: amount,
        selections: betSlip.map((item) => ({
          match_id: item.match.id,
          selected_option: item.selectedOption,
        })),
      }

      const response = await api.placeBet(betData)
      toast.dismiss(loadingToast)

      if (response.data) {
        console.log("✅ Bet placed successfully:", response.data)
        toast.success("Bet placed successfully!", {
          description: `Bet ID: #${response.data.id}`,
          className:
            "bg-gradient-to-r from-green-500/90 to-emerald-500/90 text-white border-green-400 backdrop-blur-md",
        })

        handleClearBetSlip()
        await loadBetHistory()
      } else {
        console.error("❌ Bet placement failed:", response.error)

        let errorMessage = "Failed to place bet"
        if (response.status === 401) {
          errorMessage = "Authentication failed. Please log in again."
        } else if (response.status === 400) {
          errorMessage = response.error || "Invalid bet data. Please check your selections."
        } else if (response.status === 403) {
          errorMessage = "You don't have permission to place bets."
        } else if (response.status === 500) {
          errorMessage = "Server error. Please try again later."
        } else if (response.error) {
          errorMessage = response.error
        }

        toast.error(errorMessage, {
          className: "bg-gradient-to-r from-red-500/90 to-pink-500/90 text-white border-red-400 backdrop-blur-md",
        })
      }
    } catch (error) {
      console.error("💥 Exception during bet placement:", error)
      toast.error("Network error. Please check your connection and try again.", {
        description: "Check console for detailed error information",
        className: "bg-gradient-to-r from-red-500/90 to-pink-500/90 text-white border-red-400 backdrop-blur-md",
      })
    }
  }

  const handleShareBetSlip = () => {
    if (betSlip.length === 0) {
      toast.error("Add some matches to your bet slip first", {
        className: "bg-gradient-to-r from-red-500/90 to-pink-500/90 text-white border-red-400 backdrop-blur-md",
      })
      return
    }

    const betSlipText = betSlip
      .map((item) => `${item.match.home_team} vs ${item.match.away_team} - ${item.selectedOption}`)
      .join("\n")

    const shareText = `Check out my bet slip on Gamble Galaxy:\n\n${betSlipText}\n\nJoin me at ${window.location.origin}`

    if (navigator.share) {
      navigator.share({
        title: "My Bet Slip - Gamble Galaxy",
        text: shareText,
      })
    } else {
      navigator.clipboard.writeText(shareText)
      toast.success("Bet slip copied to clipboard!", {
        className: "bg-gradient-to-r from-green-500/90 to-emerald-500/90 text-white border-green-400 backdrop-blur-md",
      })
    }
  }

  const filteredMatches = matches.filter((match) => {
    const search = searchTerm.toLowerCase()
    const matchesSearch =
      match.home_team.toLowerCase().includes(search) || match.away_team.toLowerCase().includes(search)
    const matchesStatus = statusFilter === "all" || match.status === statusFilter
    return matchesSearch && matchesStatus && match.status !== "fulltime" // Exclude fulltime matches from main list
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
  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-black relative overflow-hidden flex items-center justify-center px-4">
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
          <p className="text-white text-lg sm:text-xl font-semibold mb-2">
            {authLoading ? "Checking authentication..." : "Loading matches..."}
          </p>
          <p className="text-gray-400 text-sm sm:text-base">Please wait a moment</p>
        </div>
      </div>
    )
  }

  // Don't render anything if not authenticated (will redirect)
  if (!isAuthenticated) return null

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      <Navbar
        onMobileMenuToggle={() => setSidebarOpen((prev) => !prev)}
        isMobileMenuOpen={sidebarOpen}
      />

      {/* Enhanced Glassmorphism Background */}
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-pink-900/20 to-blue-900/20" />
        <div
          className="absolute w-48 h-48 sm:w-72 sm:h-72 lg:w-96 lg:h-96 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-full blur-3xl transition-all duration-1000 ease-out"
          style={{
            left: mousePosition.x - 96,
            top: mousePosition.y - 96,
          }}
        />
        <div className="absolute top-1/4 left-1/4 w-36 h-36 sm:w-48 sm:h-48 lg:w-72 lg:h-72 bg-gradient-to-r from-pink-500/10 to-purple-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-40 h-40 sm:w-60 sm:h-60 lg:w-80 lg:h-80 bg-gradient-to-r from-blue-500/10 to-cyan-500/10 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute top-3/4 right-1/3 w-32 h-32 sm:w-44 sm:h-44 lg:w-64 lg:h-64 bg-gradient-to-r from-yellow-500/10 to-orange-500/10 rounded-full blur-3xl animate-pulse delay-500" />
        <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.015] mix-blend-overlay"></div>
        <div className="fixed inset-0 z-0">
          {[...Array(20)].map((_, i) => (
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
      </div>

      <div className="flex relative z-10">
        {/* Mobile Sidebar Overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <div
          className={`fixed left-0 top-0 h-full w-64 xs:w-72 sm:w-80 z-50 transform transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0 lg:z-10 ${
            sidebarOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <div className="h-full pt-16 lg:pt-0">
            <GlassSideNav onShare={handleShareBetSlip} onClose={() => setSidebarOpen(false)} />
          </div>
        </div>

        {/* Main Content */}
        <main className="flex-1 min-h-screen lg:ml-0">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 pt-20 lg:pt-6">
            {/* Hero Section */}
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

              {/* Stats Cards */}
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
                    className="bg-white/5 backdrop-blur-sm rounded-xl sm:rounded-2xl p-3 sm:p-4 border border-white/10 hover:border-white/20 transition-all duration-300 group hover:scale-105"
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent rounded-xl sm:rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    <div
                      className={`w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-r ${stat.color} rounded-lg flex items-center justify-center mx-auto mb-2 shadow-lg relative z-10`}
                    >
                      <stat.icon className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                    </div>
                    <div className="text-lg sm:text-xl font-bold text-white relative z-10">{stat.value}</div>
                    <div className="text-xs text-gray-400 relative z-10">{stat.label}</div>
                  </div>
                ))}
              </div>

              {/* Promotional Banner */}
              {showPromotion && (
                <div className="relative max-w-4xl mx-auto mb-8 sm:mb-10 px-4">
                  <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/20 via-orange-500/20 to-red-500/20 rounded-2xl blur-xl"></div>
                  <div className="relative bg-gradient-to-r from-yellow-900/40 via-orange-900/40 to-red-900/40 backdrop-blur-xl border border-yellow-500/30 hover:border-yellow-400/50 transition-all duration-300 rounded-2xl p-4 sm:p-6 overflow-hidden">
                    <button
                      className="absolute top-2 right-2 text-white/60 hover:text-white/90 transition-colors"
                      onClick={() => setShowPromotion(false)}
                    >
                      <span className="sr-only">Close</span>
                      <X className="w-4 h-4" />
                    </button>
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 sm:gap-6">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg">
                          <Crown className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
                        </div>
                        <div>
                          <h3 className="text-lg sm:text-xl font-bold text-white mb-1">Welcome Bonus: 200% Match</h3>
                          <p className="text-yellow-300 text-sm sm:text-base">
                            Use code <span className="font-bold">GALAXY200</span> on your first deposit!
                          </p>
                        </div>
                      </div>
                      <Button
                        className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white font-bold px-4 py-2 rounded-xl text-sm sm:text-base"
                        onClick={() => {
                          toast.success("Promo code copied!", {
                            description: "Use GALAXY200 during deposit",
                            className:
                              "bg-gradient-to-r from-yellow-500/90 to-orange-500/90 text-white border-yellow-400 backdrop-blur-md",
                          })
                          navigator.clipboard.writeText("GALAXY200")
                        }}
                      >
                        <Coins className="w-4 h-4 mr-2" />
                        Claim Now
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Tabs */}
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

              {/* Matches Tab */}
              <TabsContent value="matches">
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 sm:gap-8">
                  <div className="xl:col-span-2 space-y-4 sm:space-y-6">
                    {/* Search Card */}
                    <Card className="bg-white/5 backdrop-blur-sm border border-white/10 hover:border-white/20 transition-all duration-300 rounded-xl sm:rounded-2xl overflow-hidden">
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
                              className="bg-white/10 backdrop-blur-sm border border-white/10 text-white rounded-lg sm:rounded-xl px-3 sm:px-4 py-2 sm:py-3 focus:border-purple-400 transition-all duration-300 text-sm sm:text-base"
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
                            </select>
                            <Button
                              onClick={() => setResultsOpen(true)}
                              className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white px-3 sm:px-4 py-2 sm:py-3 rounded-lg sm:rounded-xl text-xs sm:text-sm flex items-center transition-all duration-300"
                            >
                              <History className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                              Results
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Match Cards Grid */}
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
                          <Card className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl sm:rounded-2xl overflow-hidden">
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

                  {/* Bet Slip Column */}
                  <div className="xl:col-span-1 hidden lg:block">
                    <div className="sticky top-20 sm:top-24">
                      <div className="transform hover:scale-105 transition-all duration-300">
                        <BetSlip
                          items={betSlip}
                          onRemoveItem={handleRemoveFromBetSlip}
                          onClearAll={handleClearBetSlip}
                          onPlaceBet={handlePlaceBet}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* Bet History Tab */}
              <TabsContent value="history">
                <Card className="bg-white/5 backdrop-blur-sm border border-white/10 hover:border-white/20 transition-all duration-300 rounded-xl sm:rounded-2xl overflow-hidden">
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
                            className="bg-white/5 backdrop-blur-sm rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-white/10 hover:border-white/20 transition-all duration-300 hover:scale-105 group"
                          >
                            <div className="flex items-center justify-between mb-3 sm:mb-4 relative z-10">
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
                                  KES {formatCurrency(Number(bet.amount))}
                                </div>
                                <div className="text-gray-400 text-xs sm:text-sm">
                                  Odds: {formatOdds(Number(bet.total_odds))}
                                </div>
                                {bet.status === "pending" && (
                                  <div className="text-yellow-400 text-xs sm:text-sm mt-1 font-semibold">
                                    Expected: KES {formatCurrency(Number(bet.amount) * Number(bet.total_odds))}
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className="space-y-2 text-xs sm:text-sm text-gray-300 relative z-10">
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
                            <div className="text-xs text-gray-400 mt-3 sm:mt-4 flex items-center relative z-10">
                              <Clock className="w-3 h-3 mr-1" />
                              {new Date(bet.created_at).toLocaleString()}
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

              {/* Sure Odds Tab */}
              <TabsContent value="sure-odds">
                <Card className="bg-gradient-to-br from-yellow-900/20 to-orange-900/20 backdrop-blur-sm border border-yellow-500/30 hover:border-yellow-400/50 transition-all duration-300 rounded-xl sm:rounded-2xl overflow-hidden">
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
                        Get access to our expert analysts guaranteed winning predictions with 95%+ accuracy rate
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
                        {[
                          { label: "Success Rate", value: "95.2%", icon: Award },
                          { label: "Daily Tips", value: "5-8", icon: Target },
                          { label: "Avg Odds", value: "2.5x", icon: TrendingUp },
                        ].map((stat, index) => (
                          <div
                            key={index}
                            className="bg-white/10 backdrop-blur-sm rounded-xl sm:rounded-2xl p-3 sm:p-4 border border-white/10 hover:border-white/20 transition-all duration-300 group"
                          >
                            <stat.icon className="w-6 h-6 sm:w-8 sm:h-8 mx-auto mb-2 text-yellow-400 relative z-10" />
                            <div className="text-xl sm:text-2xl font-bold text-white relative z-10">{stat.value}</div>
                            <div className="text-xs sm:text-sm text-gray-400 relative z-10">{stat.label}</div>
                          </div>
                        ))}
                      </div>
                      <Button
                        onClick={() => setSureOddsOpen(true)}
                        className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-500 text-white px-6 sm:px-8 py-3 sm:py-4 text-base sm:text-lg font-semibold rounded-xl sm:rounded-2xl shadow-2xl hover:shadow-yellow-500/25 transition-all duration-300 hover:scale-105 group"
                      >
                        <Star className="w-4 h-4 sm:w-5 sm:h-5 mr-2 relative z-10" />
                        <span className="relative z-10">Access Sure Odds</span>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
          <SureOddsModal isOpen={sureOddsOpen} onClose={() => setSureOddsOpen(false)} />
          <Sheet open={betSlipOpen} onOpenChange={setBetSlipOpen}>
            <SheetContent side="bottom" className="h-[80vh] bg-black/90 backdrop-blur-md text-white overflow-y-auto">
              <VisuallyHidden>
                <SheetTitle>Bet Slip</SheetTitle>
              </VisuallyHidden>
              <BetSlip
                items={betSlip}
                onRemoveItem={handleRemoveFromBetSlip}
                onClearAll={handleClearBetSlip}
                onPlaceBet={handlePlaceBet}
              />
            </SheetContent>
          </Sheet>
          <Sheet open={resultsOpen} onOpenChange={setResultsOpen}>
            <SheetContent side="right" className="w-full sm:w-[400px] max-w-[90vw] bg-black/90 backdrop-blur-md text-white overflow-y-auto flex flex-col items-center px-4 sm:px-6">
              <SheetTitle className="text-xl font-bold mb-4 text-white text-center">Finished Matches Results</SheetTitle>
              <div className="w-full max-w-md space-y-4">
                {matches.filter((m) => m.status === "fulltime").length > 0 ? (
                  matches
                    .filter((m) => m.status === "fulltime")
                    .map((match) => (
                      <div key={match.id} className="w-full">
                        <MatchCard
                          match={match}
                          onAddToBetSlip={handleAddToBetSlip}
                          selectedOptions={selectedOptions}
                        />
                      </div>
                    ))
                ) : (
                  <p className="text-gray-400 text-center">No finished matches available.</p>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </main>
      </div>

      {/* Floating Action Button for Bet Slip on Mobile */}
      <div className="fixed bottom-24 right-6 lg:hidden z-50">
        <Button
          onClick={() => setBetSlipOpen(true)}
          className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white w-14 h-14 rounded-full shadow-2xl hover:shadow-purple-500/25 transition-all duration-300 hover:scale-105 flex items-center justify-center relative"
        >
          <Coins className="w-6 h-6" />
          {betSlip.length > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
              {betSlip.length}
            </span>
          )}
        </Button>
      </div>

      {/* Floating Action Button for Mobile */}
      <div className="fixed bottom-6 right-6 lg:hidden z-50">
        <Button
          onClick={() => setSureOddsOpen(true)}
          className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-500 text-white w-14 h-14 rounded-full shadow-2xl hover:shadow-yellow-500/25 transition-all duration-300 hover:scale-105 flex items-center justify-center"
        >
          <Star className="w-6 h-6" />
        </Button>
      </div>
    </div>
  )
}

export default BettingPage