import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password } = body
    const backendURL = process.env.BACKEND_URL || "http://localhost:8000"

    console.log("Login attempt for:", email)
    console.log("Backend URL:", backendURL)

    // Forward the request to your Django backend
    const response = await fetch(`${backendURL}/api/accounts/login/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({ email, password }),
    })

    console.log("Backend response status:", response.status)

    if (!response.ok) {
      const errorText = await response.text()
      console.error("Backend error:", errorText)

      try {
        const errorData = JSON.parse(errorText)
        return NextResponse.json(errorData, { status: response.status })
      } catch {
        return NextResponse.json(
          {
            success: false,
            message: errorText || "Authentication failed",
          },
          { status: response.status },
        )
      }
    }

    const data = await response.json()
    console.log("Login successful")
    return NextResponse.json(data)
  } catch (error) {
    console.error("Login API error:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Unable to connect to backend server. Please check if the backend is running.",
      },
      { status: 500 },
    )
  }
}
