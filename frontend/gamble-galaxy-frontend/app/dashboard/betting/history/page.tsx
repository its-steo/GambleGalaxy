"use client"

import { useEffect, useState } from "react"
import { useToast } from "@/hooks/use-toast"
import { Card, CardContent, CardHeader } from "@/components/ui/card"

interface Bet {
  id: number
  amount: string
  total_odds: string
  status: "pending" | "won" | "lost"
  placed_at: string
  selections: {
    match: number
    selected_option: "home_win" | "draw" | "away_win"
    is_correct: boolean | null
  }[]
}

export default function BetHistoryPage() {
  const [bets, setBets] = useState<Bet[]>([])
  const { toast } = useToast()

  useEffect(() => {
    const fetchHistory = async () => {
      const token = localStorage.getItem("access_token")

      if (!token) {
        toast({
          title: "Unauthorized",
          description: "Please login to view your history",
          variant: "destructive",
        })
        return
      }

      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/betting/history/`, {
          headers: {
            "Authorization": `Bearer ${token}`,
          },
        })

        if (!res.ok) {
          const error = await res.json()
          throw new Error(error.detail || "Failed to load history")
        }

        const data = await res.json()

        if (Array.isArray(data)) {
          setBets(data)
        } else {
          throw new Error("Invalid response format")
        }

      } catch (err: any) {
        toast({
          title: "Error",
          description: err.message,
          variant: "destructive",
        })
      }
    }

    fetchHistory()
  }, [])

  return (
    <div className="p-4 min-h-screen bg-gradient-to-br from-purple-900 via-indigo-900 to-blue-900 text-white">
      <h1 className="text-2xl font-bold mb-4">🎰 Bet History</h1>

      {bets.length === 0 ? (
        <p className="text-purple-200">You haven't placed any bets yet.</p>
      ) : (
        bets.map((bet) => (
          <Card key={bet.id} className="mb-4 bg-white/10 border border-purple-500">
            <CardHeader>
              <h2 className="text-lg font-semibold">💰 Bet #{bet.id}</h2>
              <p className="text-sm text-purple-300">
                Amount: {bet.amount} | Odds: {bet.total_odds} | Status:{" "}
                <span
                  className={
                    bet.status === "won"
                      ? "text-green-400"
                      : bet.status === "lost"
                      ? "text-red-400"
                      : "text-yellow-300"
                  }
                >
                  {bet.status.toUpperCase()}
                </span>
              </p>
              <p className="text-xs text-purple-400">Placed at: {new Date(bet.placed_at).toLocaleString()}</p>
            </CardHeader>
            <CardContent>
              <ul className="list-disc ml-5 text-sm text-white/90">
                {bet.selections.map((sel, i) => (
                  <li key={i}>
                    Match ID: {sel.match} — Picked: <strong>{sel.selected_option}</strong> —{" "}
                    {sel.is_correct === true
                      ? "✅ Correct"
                      : sel.is_correct === false
                      ? "❌ Wrong"
                      : "🕒 Pending"}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  )
}
