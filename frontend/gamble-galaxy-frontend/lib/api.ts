import type {
  User,
  RegisterData,
  LoginResponse,
  Wallet,
  Transaction,
  Match,
  Bet,
  AviatorRound,
  AviatorBet,
  TopWinner,
  SureOdd,
  SureOddSlip,
} from "@/lib/types"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api"

interface ApiResponse<T> {
  data?: T
  error?: string
  status: number
}

interface DashboardStats {
  totalBalance: number
  totalBets: number
  totalWinnings: number
  totalLosses: number
  winRate: number
  activeBets: number
  netProfit: number
  recentActivities: RecentActivity[]
  topWinners: TopWinner[]
}

interface RecentActivity {
  id: number
  activity_type: string
  game_type?: string
  amount: number
  multiplier?: number
  description: string
  status: string
  timestamp: string
}

class ApiClient {
  private async getAccessToken(): Promise<string | null> {
    if (typeof window === 'undefined') return null
    return localStorage.getItem("access_token")
  }

  private getRefreshToken(): string | null {
    if (typeof window === 'undefined') return null
    return localStorage.getItem("refresh_token")
  }

  private async refreshAccessToken(): Promise<string | null> {
    const refresh = this.getRefreshToken()
    if (!refresh) return null

    try {
      console.log("🔄 Attempting to refresh access token...")
      const res = await fetch(`${API_BASE_URL}/accounts/token/refresh/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh }),
      })

      const data = await res.json()
      console.log("🔄 Refresh response:", { status: res.status, data })

      if (res.ok && data.access) {
        localStorage.setItem("access_token", data.access)
        console.log("✅ Access token refreshed successfully")
        return data.access
      } else {
        console.log("❌ Token refresh failed, clearing tokens")
        localStorage.removeItem("access_token")
        localStorage.removeItem("refresh_token")
        return null
      }
    } catch (error) {
      console.error("💥 Token refresh error:", error)
      return null
    }
  }

  private async getAuthHeaders(): Promise<Record<string, string>> {
    const token = await this.getAccessToken()
    return token ? { Authorization: `Bearer ${token}` } : {}
  }

  async request<T>(endpoint: string, options: RequestInit = {}, retry = true): Promise<ApiResponse<T>> {
    try {
      console.log(`🌐 Making API request to: ${API_BASE_URL}${endpoint}`)

      const headers: HeadersInit = {
        "Content-Type": "application/json",
        ...(options.headers || {}),
        ...(await this.getAuthHeaders()),
      }

      const res = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers,
      })

      console.log(`📥 Response status: ${res.status}`)

      let data: any
      const contentType = res.headers.get('content-type')
      
      if (contentType && contentType.includes('application/json')) {
        data = await res.json()
      } else {
        const text = await res.text()
        data = { message: text }
      }

      // Handle 401 with retry
      if (res.status === 401 && retry) {
        console.log("🔄 Got 401, attempting token refresh...")
        const newAccess = await this.refreshAccessToken()
        if (newAccess) {
          console.log("🔄 Retrying request with new token...")
          return this.request<T>(endpoint, options, false)
        }
      }

      const result: ApiResponse<T> = {
        data: res.ok ? data : undefined,
        error: !res.ok ? data?.detail || data?.message || data?.error || `HTTP ${res.status}` : undefined,
        status: res.status,
      }

      return result

    } catch (error) {
      console.error("💥 Network error in API request:", error)
      return { 
        error: `Network error: ${error instanceof Error ? error.message : 'Unknown error'}`, 
        status: 0 
      }
    }
  }

  // ✅ Auth
  async login(username: string, password: string) {
    return this.request<LoginResponse>("/accounts/login/", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    })
  }

  async register(userData: RegisterData) {
    return this.request<User>("/accounts/register/", {
      method: "POST",
      body: JSON.stringify(userData),
    })
  }

  async getProfile() {
    return this.request<User>("/accounts/profile/")
  }

  async checkUsername(username: string) {
    return this.request<{ exists: boolean }>(`/accounts/check-username/?username=${username}`)
  }

  // ✅ Wallet - Fixed to match your backend URL patterns
  async getWallet() {
    // Use the correct endpoint that matches your Django URLs: /api/wallet/
    return this.request<{ balance: number }>("/wallet/")
  }

  async deposit(amount: number) {
    return this.request<Transaction>("/wallet/deposit/", {
      method: "POST",
      body: JSON.stringify({ amount }),
    })
  }

  async withdraw(amount: number) {
    return this.request<Transaction>("/wallet/withdraw/", {
      method: "POST",
      body: JSON.stringify({ amount }),
    })
  }

  async getTransactions() {
    return this.request<Transaction[]>("/wallet/transactions/")
  }

  // ✅ Betting
  async getMatches() {
    return this.request<Match[]>("/betting/matches/")
  }

  async placeBet(betData: { amount: number; selections: Array<{ match_id: number; selected_option: string }> }) {
    return this.request<Bet>("/betting/place/", {
      method: "POST",
      body: JSON.stringify(betData),
    })
  }

  async getBetHistory() {
    return this.request<Bet[]>("/betting/history/")
  }

  async getSureOdds() {
    return this.request<SureOddSlip>("/betting/sure-odds/")
  }

  async paySureOdds() {
    return this.request<{ detail: string }>("/betting/sure-odds/pay/", {
      method: "POST",
    })
  }

  // ✅ Aviator - Fixed to match your backend URLs
  async startAviatorRound() {
    return this.request<AviatorRound>("/games/aviator/start/", {
      method: "POST",
    })
  }

  async placeAviatorBet(payload: { amount: number; round_id: number; auto_cashout?: number }) {
    return this.request<AviatorBet>("/games/aviator/bet/", {
      method: "POST",
      body: JSON.stringify(payload),
    })
  }

  async cashoutAviator(bet_id: number, multiplier: number) {
    return this.request<{ message: string; win_amount?: number; new_balance?: number }>("/games/aviator/cashout/", {
      method: "POST",
      body: JSON.stringify({ bet_id, multiplier }),
    })
  }

  async getPastCrashes() {
    return this.request<Array<{ id: number; multiplier: number; color: string; timestamp: string }>>(
      "/games/aviator/past-crashes/",
    )
  }

  // Fixed to use correct endpoint
  async getTopWinners() {
    return this.request<TopWinner[]>("/games/aviator/top-winners/")
  }

  async getUserSureOdds() {
    return this.request<SureOdd[]>("/games/aviator/sure-odds/")
  }

  async getMyAviatorBets() {
    return this.request<AviatorBet[]>("/games/aviator/my-bets/")
  }

  // ✅ Premium Sure Odds - Matching your backend exactly
  async purchaseSureOdd() {
    return this.request<{ detail: string }>("/games/aviator/sure-odds/purchase/", {
      method: "POST",
    })
  }

  async getSureOdd() {
    return this.request<{
      odd_value: number | null
    }>("/games/aviator/sure-odds/get/")
  }

  async getSureOddStatus() {
    return this.request<{
      has_pending: boolean
    }>("/games/aviator/sure-odds/status/")
  }

  async getSureOddHistory() {
    return this.request<{
      history: Array<{
        odd_value: number | null
        created_at: string
        used: boolean
      }>
    }>("/games/aviator/sure-odds/history/")
  }

  // ✅ Dashboard - Added missing endpoints
  async getDashboardStats() {
    return this.request<DashboardStats>("/dashboard/stats/")
  }

  async getRecentActivity() {
    return this.request<RecentActivity[]>("/dashboard/activity/")
  }
}

export const api = new ApiClient()
