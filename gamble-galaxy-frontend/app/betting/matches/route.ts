import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const backendURL = process.env.BACKEND_URL || "http://localhost:8000"

    const response = await fetch(`${backendURL}/api/betting/matches/`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    })

    if (!response.ok) {
      // Fallback to mock data
      return NextResponse.json([
        {
          id: "1",
          homeTeam: "Manchester United",
          awayTeam: "Liverpool",
          league: "Premier League",
          startTime: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
          status: "upcoming",
          odds: {
            home: 2.1,
            draw: 3.4,
            away: 3.2,
          },
        },
        {
          id: "2",
          homeTeam: "Barcelona",
          awayTeam: "Real Madrid",
          league: "La Liga",
          startTime: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(),
          status: "upcoming",
          odds: {
            home: 2.5,
            draw: 3.1,
            away: 2.8,
          },
        },
        {
          id: "3",
          homeTeam: "Bayern Munich",
          awayTeam: "Borussia Dortmund",
          league: "Bundesliga",
          startTime: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString(),
          status: "live",
          score: { home: 1, away: 0 },
          odds: {
            home: 1.8,
            draw: 3.6,
            away: 4.2,
          },
        },
      ])
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error("Matches API error:", error)

    // Return mock data on error
    return NextResponse.json([
      {
        id: "1",
        homeTeam: "Manchester United",
        awayTeam: "Liverpool",
        league: "Premier League",
        startTime: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
        status: "upcoming",
        odds: {
          home: 2.1,
          draw: 3.4,
          away: 3.2,
        },
      },
      {
        id: "2",
        homeTeam: "Barcelona",
        awayTeam: "Real Madrid",
        league: "La Liga",
        startTime: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(),
        status: "upcoming",
        odds: {
          home: 2.5,
          draw: 3.1,
          away: 2.8,
        },
      },
    ])
  }
}
