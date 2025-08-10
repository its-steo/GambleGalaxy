import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const response = await fetch(`${process.env.DJANGO_API_URL}/api/accounts/login/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    })

    const data = await response.json()

    if (response.ok) {
      // Fetch user profile
      const profileResponse = await fetch(`${process.env.DJANGO_API_URL}/api/accounts/profile/`, {
        headers: {
          Authorization: `Bearer ${data.access}`,
        },
      })

      if (profileResponse.ok) {
        const userData = await profileResponse.json()
        return NextResponse.json({
          access: data.access,
          refresh: data.refresh,
          user: userData,
        })
      }
    }

    return NextResponse.json(data, { status: response.status })
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
