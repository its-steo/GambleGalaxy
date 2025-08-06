import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization")
    const { searchParams } = new URL(request.url)

    if (!authHeader) {
      return NextResponse.json({ error: "Authorization required" }, { status: 401 })
    }

    const params = new URLSearchParams()
    if (searchParams.get("type")) params.append("type", searchParams.get("type")!)
    if (searchParams.get("date_range")) params.append("date_range", searchParams.get("date_range")!)
    if (searchParams.get("search")) params.append("search", searchParams.get("search")!)

    const response = await fetch(`${process.env.DJANGO_API_URL}/wallet/transactions/?${params}`, {
      headers: { Authorization: authHeader },
    })

    const data = await response.json()
    return NextResponse.json(data, { status: response.status })
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
