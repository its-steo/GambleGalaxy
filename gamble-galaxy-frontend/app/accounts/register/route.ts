import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password, name, phone, username } = body
    const backendURL = process.env.BACKEND_URL || "http://localhost:8000"

    console.log("Registration attempt for:", email)
    console.log("Backend URL:", backendURL)

    // Validate required fields
    if (!email || !password || !name) {
      return NextResponse.json(
        {
          success: false,
          message: "Missing required fields",
        },
        { status: 400 },
      )
    }

    // Forward the request to your Django backend
    const response = await fetch(`${backendURL}/api/accounts/register/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        email,
        password,
        username: username || name,
        phone: phone || "",
        first_name: name.split(" ")[0] || "",
        last_name: name.split(" ").slice(1).join(" ") || "",
      }),
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
            message: errorText || "Registration failed",
          },
          { status: response.status },
        )
      }
    }

    const data = await response.json()
    console.log("Registration successful")
    return NextResponse.json(data)
  } catch (error) {
    console.error("Register API error:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Unable to connect to backend server. Please check if the backend is running.",
      },
      { status: 500 },
    )
  }
}
