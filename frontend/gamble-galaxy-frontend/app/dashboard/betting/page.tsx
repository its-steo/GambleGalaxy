"use client"

import { useEffect, useState } from "react"
import { Card, CardHeader, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"

interface Match {
  id: number
  home_team: string
  away_team: string
  match_time: string
  odds_home_win: string
  odds_draw: string
  odds_away_win: string
  score_home: number
  score_away: number
  status: string
}

interface Selection {
  match: number
  selected_option: "home_win" | "draw" | "away_win"
  odds: number
}

export default function BettingPage() {
  const [matches, setMatches] = useState<Match[]>([])
  const [selections, setSelections] = useState<Selection[]>([])
  const [stake, setStake] = useState<number>(0)
  const { toast } = useToast()

  useEffect(() => {
    const fetchMatches = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/betting/matches/`)
        const data = await res.json()
        setMatches(data)
      } catch (error) {
        toast({
          title: "Error loading matches",
          description: "Check your connection.",
          variant: "destructive",
        })
      }
    }
    fetchMatches()
  }, [])

  const selectOption = (matchId: number, option: Selection["selected_option"], odds: string) => {
    setSelections((prev) => {
      const filtered = prev.filter((s) => s.match !== matchId)
      return [...filtered, { match: matchId, selected_option: option, odds: parseFloat(odds) }]
    })
  }

  const isSelected = (matchId: number, option: Selection["selected_option"]) =>
    selections.some((s) => s.match === matchId && s.selected_option === option)

  const totalOdds = selections.reduce((acc, s) => acc * s.odds, 1).toFixed(2)

  const handlePlaceBet = async () => {
    if (!stake || stake <= 0) {
      toast({ title: "Enter a valid stake", variant: "destructive" })
      return
    }

    const access = localStorage.getItem("access_token")
    if (!access) {
      toast({ title: "Unauthorized", description: "Please login first", variant: "destructive" })
      return
    }

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/betting/place/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${access}`,
        },
        body: JSON.stringify({
          amount: stake,
          total_odds: totalOdds,
          selections: selections.map((s) => ({
            match: s.match,
            selected_option: s.selected_option,
          })),
        }),
      })

      if (res.ok) {
        toast({
          title: "✅ Bet placed successfully!",
          description: `Potential win: ${stake} x ${totalOdds}`,
        })
        setSelections([])
        setStake(0)
      } else {
        const error = await res.json()
        toast({
          title: "Bet failed",
          description: error?.message || "Try again.",
          variant: "destructive",
        })
      }
    } catch (err) {
      toast({
        title: "Network error",
        description: "Please try again later.",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="min-h-screen p-4 bg-gradient-to-br from-purple-900 via-indigo-900 to-blue-900 text-white">
      <h1 className="text-3xl font-bold mb-6">🎯 Available Matches</h1>
      <div className="grid gap-5">
        {matches.map((match) => (
          <Card key={match.id} className="bg-white/10 border border-purple-600 text-white">
            <CardHeader>
              <h2 className="text-lg font-bold">
                {match.status === "upcoming" ? (
                  <>
                    {match.home_team} <span className="text-purple-400">vs</span> {match.away_team}
                  </>
                ) : (
                  <>
                    {match.home_team}{" "}
                    <span className="text-purple-300 font-semibold">
                      {match.score_home} - {match.score_away}
                    </span>{" "}
                    {match.away_team}
                  </>
                )}
              </h2>
              <p className="text-sm text-purple-300">
                {new Date(match.match_time).toLocaleString()}
              </p>
              <p className="text-xs uppercase text-purple-400">Status: {match.status}</p>
            </CardHeader>
            <CardContent className="flex gap-2">
              <Button
                onClick={() => selectOption(match.id, "home_win", match.odds_home_win)}
                className={`w-full ${isSelected(match.id, "home_win") ? "bg-purple-600" : "bg-purple-800"}`}
              >
                🏠 {match.odds_home_win}
              </Button>
              <Button
                onClick={() => selectOption(match.id, "draw", match.odds_draw)}
                className={`w-full ${isSelected(match.id, "draw") ? "bg-purple-600" : "bg-purple-800"}`}
              >
                🤝 {match.odds_draw}
              </Button>
              <Button
                onClick={() => selectOption(match.id, "away_win", match.odds_away_win)}
                className={`w-full ${isSelected(match.id, "away_win") ? "bg-purple-600" : "bg-purple-800"}`}
              >
                🛫 {match.odds_away_win}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {selections.length > 0 && (
        <div className="fixed bottom-0 left-0 w-full bg-black/90 backdrop-blur p-4 border-t border-purple-500">
          <h2 className="text-lg font-bold mb-2">🎟️ Bet Slip</h2>
          <p className="text-purple-200">Total Odds: {totalOdds}</p>
          <input
            type="number"
            value={stake}
            onChange={(e) => setStake(parseFloat(e.target.value))}
            placeholder="Enter stake"
            className="w-full mt-2 p-2 rounded bg-white/10 text-white"
          />
          <Button
            onClick={handlePlaceBet}
            className="w-full mt-3 bg-gradient-to-r from-pink-500 to-purple-500 font-bold text-white"
          >
            ✅ Place Bet
          </Button>
        </div>
      )}
    </div>
  )
}
