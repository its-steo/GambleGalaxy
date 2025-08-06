"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ClubIcon as Football } from "lucide-react"
import { useNotification } from "./notification-system"

interface Match {
  id: string
  homeTeam: string
  awayTeam: string
  league: string
  time: string
  status: "live" | "upcoming" | "finished"
  homeOdds: number
  drawOdds: number
  awayOdds: number
  homeScore?: number
  awayScore?: number
}

interface Bet {
  id: string
  matchId: string
  selection: string
  odds: number
  stake: number
  potentialWin: number
  status: "pending" | "won" | "lost"
}

export default function SportsBetting() {
  const [matches, setMatches] = useState<Match[]>([])
  const [activeBets, setActiveBets] = useState<Bet[]>([])
  const [betSlip, setBetSlip] = useState<{ matchId: string; selection: string; odds: number } | null>(null)
  const [stake, setStake] = useState("")
  const { addNotification } = useNotification()

  useEffect(() => {
    // Mock matches data
    const mockMatches: Match[] = [
      {
        id: "1",
        homeTeam: "Manchester United",
        awayTeam: "Liverpool",
        league: "Premier League",
        time: "15:30",
        status: "live",
        homeOdds: 2.1,
        drawOdds: 3.2,
        awayOdds: 3.8,
        homeScore: 1,
        awayScore: 0,
      },
      {
        id: "2",
        homeTeam: "Barcelona",
        awayTeam: "Real Madrid",
        league: "La Liga",
        time: "18:00",
        status: "upcoming",
        homeOdds: 1.9,
        drawOdds: 3.5,
        awayOdds: 4.2,
      },
      {
        id: "3",
        homeTeam: "Bayern Munich",
        awayTeam: "Dortmund",
        league: "Bundesliga",
        time: "20:30",
        status: "upcoming",
        homeOdds: 1.7,
        drawOdds: 3.8,
        awayOdds: 5.1,
      },
    ]
    setMatches(mockMatches)

    // Load active bets
    const savedBets = localStorage.getItem("active_bets")
    if (savedBets) {
      setActiveBets(JSON.parse(savedBets))
    }
  }, [])

  const placeBet = () => {
    if (!betSlip || !stake) return

    const stakeAmount = Number.parseFloat(stake)
    const balance = Number.parseFloat(localStorage.getItem("wallet_balance") || "0")

    if (stakeAmount > balance) {
      addNotification({
        type: "error",
        title: "Insufficient Balance",
        message: "You don't have enough funds to place this bet",
      })
      return
    }

    const newBet: Bet = {
      id: Date.now().toString(),
      matchId: betSlip.matchId,
      selection: betSlip.selection,
      odds: betSlip.odds,
      stake: stakeAmount,
      potentialWin: stakeAmount * betSlip.odds,
      status: "pending",
    }

    const updatedBets = [...activeBets, newBet]
    setActiveBets(updatedBets)
    localStorage.setItem("active_bets", JSON.stringify(updatedBets))

    // Update balance
    const newBalance = balance - stakeAmount
    localStorage.setItem("wallet_balance", newBalance.toString())

    addNotification({
      type: "success",
      title: "Bet Placed!",
      message: `Your bet of KES ${stakeAmount} has been placed successfully`,
    })

    setBetSlip(null)
    setStake("")
  }

  const addToBetSlip = (matchId: string, selection: string, odds: number) => {
    setBetSlip({ matchId, selection, odds })
  }

  return (
    <div className="space-y-6 p-4">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2">Sports Betting</h1>
        <p className="text-muted-foreground">Bet on your favorite teams</p>
      </div>

      <Tabs defaultValue="football" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="football">Football</TabsTrigger>
          <TabsTrigger value="basketball">Basketball</TabsTrigger>
          <TabsTrigger value="tennis">Tennis</TabsTrigger>
          <TabsTrigger value="live">Live</TabsTrigger>
        </TabsList>

        <TabsContent value="football" className="space-y-4">
          {matches.map((match) => (
            <Card key={match.id}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Football className="h-5 w-5" />
                    <span className="font-medium">{match.league}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    {match.status === "live" && (
                      <Badge variant="destructive" className="animate-pulse">
                        <div className="w-2 h-2 bg-white rounded-full mr-1" />
                        LIVE
                      </Badge>
                    )}
                    <span className="text-sm text-muted-foreground">
                      {match.status === "live" ? `${match.time}'` : match.time}
                    </span>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <span className="font-medium">{match.homeTeam}</span>
                        {match.status === "live" && <span className="text-xl font-bold">{match.homeScore}</span>}
                      </div>
                      <div className="flex items-center space-x-2 mt-1">
                        <span className="font-medium">{match.awayTeam}</span>
                        {match.status === "live" && <span className="text-xl font-bold">{match.awayScore}</span>}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <Button
                      variant="outline"
                      className="flex flex-col space-y-1 h-16 bg-transparent"
                      onClick={() => addToBetSlip(match.id, `${match.homeTeam} Win`, match.homeOdds)}
                    >
                      <span className="text-xs">1</span>
                      <span className="font-bold">{match.homeOdds}</span>
                    </Button>
                    <Button
                      variant="outline"
                      className="flex flex-col space-y-1 h-16 bg-transparent"
                      onClick={() => addToBetSlip(match.id, "Draw", match.drawOdds)}
                    >
                      <span className="text-xs">X</span>
                      <span className="font-bold">{match.drawOdds}</span>
                    </Button>
                    <Button
                      variant="outline"
                      className="flex flex-col space-y-1 h-16 bg-transparent"
                      onClick={() => addToBetSlip(match.id, `${match.awayTeam} Win`, match.awayOdds)}
                    >
                      <span className="text-xs">2</span>
                      <span className="font-bold">{match.awayOdds}</span>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="basketball">
          <Card>
            <CardContent className="p-6 text-center">
              <p className="text-muted-foreground">Basketball matches coming soon!</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tennis">
          <Card>
            <CardContent className="p-6 text-center">
              <p className="text-muted-foreground">Tennis matches coming soon!</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="live">
          <div className="space-y-4">
            {matches
              .filter((m) => m.status === "live")
              .map((match) => (
                <Card key={match.id} className="border-red-200">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <Badge variant="destructive" className="animate-pulse">
                        <div className="w-2 h-2 bg-white rounded-full mr-1" />
                        LIVE
                      </Badge>
                      <span className="text-sm font-medium">{match.time}'</span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center space-y-2">
                      <div className="text-2xl font-bold">
                        {match.homeTeam} {match.homeScore} - {match.awayScore} {match.awayTeam}
                      </div>
                      <div className="grid grid-cols-3 gap-2 mt-4">
                        <Button variant="outline" size="sm">
                          1 ({match.homeOdds})
                        </Button>
                        <Button variant="outline" size="sm">
                          X ({match.drawOdds})
                        </Button>
                        <Button variant="outline" size="sm">
                          2 ({match.awayOdds})
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Bet Slip */}
      {betSlip && (
        <Card className="fixed bottom-20 left-4 right-4 z-40 border-blue-500">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Bet Slip</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="font-medium">{betSlip.selection}</p>
              <p className="text-sm text-muted-foreground">Odds: {betSlip.odds}</p>
            </div>
            <div>
              <label className="text-sm font-medium">Stake (KES)</label>
              <Input type="number" placeholder="Enter stake" value={stake} onChange={(e) => setStake(e.target.value)} />
            </div>
            {stake && (
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-sm">
                  Potential Win:{" "}
                  <span className="font-bold">KES {(Number.parseFloat(stake) * betSlip.odds).toFixed(2)}</span>
                </p>
              </div>
            )}
            <div className="flex space-x-2">
              <Button onClick={placeBet} className="flex-1">
                Place Bet
              </Button>
              <Button variant="outline" onClick={() => setBetSlip(null)}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Active Bets */}
      {activeBets.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Active Bets</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {activeBets.map((bet) => (
                <div key={bet.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div>
                    <p className="font-medium">{bet.selection}</p>
                    <p className="text-sm text-muted-foreground">
                      Stake: KES {bet.stake} • Odds: {bet.odds}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">KES {bet.potentialWin.toFixed(2)}</p>
                    <Badge variant="secondary">{bet.status}</Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
