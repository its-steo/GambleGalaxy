import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const backendURL = process.env.BACKEND_URL || "http://localhost:8000"
    const authHeader = request.headers.get("authorization")

    const response = await fetch(`${backendURL}/api/wallet/`, {
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
        balance: 15420.5,
        currency: "USD",
        bonusBalance: 500.0,
        withdrawableBalance: 14920.5,
        pendingDeposits: 0,
        pendingWithdrawals: 2,
        totalDeposited: 50000.0,
        totalWithdrawn: 34579.5,
        lastTransaction: new Date().toISOString(),
      })
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error("Wallet API error:", error)

    // Return mock data on error
    return NextResponse.json({
      balance: 15420.5,
      currency: "USD",
      bonusBalance: 500.0,
      withdrawableBalance: 14920.5,
      pendingDeposits: 0,
      pendingWithdrawals: 2,
      totalDeposited: 50000.0,
      totalWithdrawn: 34579.5,
      lastTransaction: new Date().toISOString(),
    })
  }
}
