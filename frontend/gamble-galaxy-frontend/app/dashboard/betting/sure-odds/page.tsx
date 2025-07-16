"use client"

import { useEffect, useState } from "react"
import { useToast } from "@/hooks/use-toast"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

interface Match {
  id: number
  home_team: string
  away_team: string
  match_time: string
}

interface SureOddSlip {
  id: number
  code: string
  has_paid: boolean
  amount_paid: string
  matches: Match[]
  revealed_predictions: boolean
}

export default function SureOddsPage() {
  const [slip, setSlip] = useState<SureOddSlip | null>(null)
  const { toast } = useToast()

  const fetchSureOdds = async () => {
    const token = localStorage.getItem("access_token")
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/betting/sure-odds/`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      const data = await res.json()

      if (res.ok) {
        setSlip(data)
      } else {
        toast({ title: "Error loading Sure Odds", description: data?.message, variant: "destructive" })
      }
    } catch (err) {
      toast({ title: "Network error", variant: "destructive" })
    }
  }

  const handlePay = async () => {
    const token = localStorage.getItem("access_token")
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/betting/sure-odds/pay/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ code: slip?.code }),
      })

      if (res.ok) {
        toast({ title: "✅ Payment successful! Slip unlocked." })
        fetchSureOdds()
      } else {
        const err = await res.json()
        toast({ title: "Payment failed", description: err?.message, variant: "destructive" })
      }
    } catch (err) {
      toast({ title: "Something went wrong", variant: "destructive" })
    }
  }

  useEffect(() => {
    fetchSureOdds()
  }, [])

  if (!slip) return <p className="text-center text-white">Loading...</p>

  return (
    <div className="min-h-screen p-5 text-white bg-gradient-to-b from-black via-purple-900 to-indigo-900">
      <h1 className="text-3xl font-bold mb-4">🔥 Sure Odds Slip</h1>

      <Card className="bg-white/10 border border-purple-600">
        <CardHeader>
          <h2 className="text-lg font-bold">Slip Code: {slip.code}</h2>
          <p className="text-purple-300">Amount: KES {slip.amount_paid}</p>
          <p className="text-sm text-purple-400">Status: {slip.has_paid ? "✅ Paid" : "🔒 Locked"}</p>
        </CardHeader>
        <CardContent>
          {slip.has_paid ? (
            <div className="space-y-2">
              {slip.matches.map((match) => (
                <div key={match.id} className="bg-purple-800 p-3 rounded text-white">
                  {match.home_team} vs {match.away_team}
                  <p className="text-sm text-purple-300">
                    Time: {new Date(match.match_time).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center">
              <p className="mb-3 text-purple-300">Pay to unlock this Sure Odds slip.</p>
              <Button
                onClick={handlePay}
                className="bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold"
              >
                💸 Pay KES {slip.amount_paid}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
