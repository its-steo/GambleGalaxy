import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const backendURL = process.env.BACKEND_URL || "http://localhost:8000"
    const authHeader = request.headers.get("authorization")

    const response = await fetch(`${backendURL}/api/dashboard/stats/`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        ...(authHeader && { Authorization: authHeader }),
      },
    })

    if (!response.ok) {
      // Fallback to mock data
      return NextResponse.json({
        totalBalance: 15420.5,
        totalBets: 1247,
        totalWins: 892,
        winRate: 71.6,
        todayProfit: 2340.75,
        weeklyProfit: 8920.3,
        monthlyProfit: 34560.8,
        activeBets: 12,
        pendingWithdrawals: 2,
        bonusBalance: 500.0,
      })
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error("Dashboard stats API error:", error)

    // Return mock data on error
    return NextResponse.json({
      totalBalance: 15420.5,
      totalBets: 1247,
      totalWins: 892,
      winRate: 71.6,
      todayProfit: 2340.75,
      weeklyProfit: 8920.3,
      monthlyProfit: 34560.8,
      activeBets: 12,
      pendingWithdrawals: 2,
      bonusBalance: 500.0,
    })
  }
}
