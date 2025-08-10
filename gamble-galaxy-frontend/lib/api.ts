"use client"

class ApiService {
 // private baseURL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api"
 // private wsURL = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8000/ws"
  private baseURL = process.env.NEXT_PUBLIC_API_URL || "https://gamblegalaxy.onrender.com/api"
  private wsURL = process.env.NEXT_PUBLIC_WS_URL || "wss://gamblegalaxy.onrender.com/ws"
  private getAuthHeaders() {
    const token = localStorage.getItem("access_token")
    return {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
    }
  }

  private async handleResponse(response: Response) {
    if (!response.ok) {
      if (response.status === 401) {
        // Token expired, try to refresh
        await this.refreshToken()
        throw new Error("Token expired")
      }
      const error = await response.json().catch(() => ({ message: "Network error" }))
      throw new Error(error.message || "Request failed")
    }
    return response.json()
  }

  private async refreshToken() {
    const refreshToken = localStorage.getItem("refresh_token")
    if (!refreshToken) {
      this.logout()
      return
    }

    try {
      const response = await fetch(`${this.baseURL}/accounts/token/refresh/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh: refreshToken }),
      })

      if (response.ok) {
        const data = await response.json()
        localStorage.setItem("access_token", data.access)
      } else {
        this.logout()
      }
    } catch {
      this.logout()
    }
  }

  private logout() {
    localStorage.removeItem("access_token")
    localStorage.removeItem("refresh_token")
    window.location.href = "/"
  }

  // Auth APIs - Use Next.js API routes as proxy
  async login(credentials: { email: string; password: string }) {
    const response = await fetch("/api/accounts/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(credentials),
    })
    return this.handleResponse(response)
  }

  async register(userData: { username: string; email: string; phone: string; password: string }) {
    const response = await fetch("/api/accounts/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(userData),
    })
    return this.handleResponse(response)
  }

  // Dashboard APIs
  async getDashboardStats() {
    const response = await fetch("/api/dashboard/stats", {
      headers: this.getAuthHeaders(),
    })
    return this.handleResponse(response)
  }

  async getRecentActivity(limit = 20) {
    const response = await fetch(`/api/dashboard/activity?limit=${limit}`, {
      headers: this.getAuthHeaders(),
    })
    return this.handleResponse(response)
  }

  async getTopWinners(period = "today") {
    const response = await fetch(`/api/dashboard/top-winners?period=${period}`, {
      headers: this.getAuthHeaders(),
    })
    return this.handleResponse(response)
  }

  // Betting APIs
  async getMatches() {
    const response = await fetch("/api/betting/matches")
    return this.handleResponse(response)
  }

  async placeBet(betData: { amount: number; selections: any[] }) {
    const response = await fetch("/api/betting/place", {
      method: "POST",
      headers: this.getAuthHeaders(),
      body: JSON.stringify(betData),
    })
    return this.handleResponse(response)
  }

  async getBetHistory() {
    const response = await fetch("/api/betting/history", {
      headers: this.getAuthHeaders(),
    })
    return this.handleResponse(response)
  }

  async getSureOdds() {
    const response = await fetch("/api/betting/sure-odds", {
      headers: this.getAuthHeaders(),
    })
    return this.handleResponse(response)
  }

  async paySureOdds() {
    const response = await fetch("/api/betting/sure-odds/pay", {
      method: "POST",
      headers: this.getAuthHeaders(),
    })
    return this.handleResponse(response)
  }

  // Wallet APIs
  async getWallet() {
    const response = await fetch("/api/wallet", {
      headers: this.getAuthHeaders(),
    })
    return this.handleResponse(response)
  }

  async deposit(amount: number) {
    const response = await fetch("/api/wallet/deposit", {
      method: "POST",
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ amount }),
    })
    return this.handleResponse(response)
  }

  async withdraw(amount: number) {
    const response = await fetch("/api/wallet/withdraw", {
      method: "POST",
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ amount }),
    })
    return this.handleResponse(response)
  }

  async getTransactions() {
    const response = await fetch("/api/wallet/transactions", {
      headers: this.getAuthHeaders(),
    })
    return this.handleResponse(response)
  }

  // Profile APIs
  async getProfile() {
    const response = await fetch("/api/accounts/profile", {
      headers: this.getAuthHeaders(),
    })
    return this.handleResponse(response)
  }

  async updateProfile(profileData: any) {
    const response = await fetch("/api/accounts/profile", {
      method: "PUT",
      headers: this.getAuthHeaders(),
      body: JSON.stringify(profileData),
    })
    return this.handleResponse(response)
  }

  // Aviator APIs
  async getAviatorHistory() {
    const response = await fetch("/api/games/aviator/history")
    return this.handleResponse(response)
  }

  async getAviatorTopWinners() {
    const response = await fetch("/api/games/aviator/top-winners")
    return this.handleResponse(response)
  }

  // WebSocket connection
  connectAviatorWebSocket(onMessage: (data: any) => void) {
    const token = localStorage.getItem("access_token")
    const ws = new WebSocket(`${this.wsURL}/aviator/?token=${token}`)

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data)
      onMessage(data)
    }

    ws.onerror = (error) => {
      console.error("WebSocket error:", error)
    }

    return ws
  }
}

export const apiService = new ApiService()
