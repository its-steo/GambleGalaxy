import type {
  User,
  RegisterData,
  LoginResponse,
  Transaction,
  Match,
  Bet,
  AviatorRound,
  AviatorBet,
  TopWinner,
  SureOdd,
  SureOddSlip,
  PredictorPackage,
  PredictorPurchase,
  PredictorPrediction,
  PredictorStats,
  GeneratePredictionResponse, // New import for GeneratePredictionResponse
} from "@/lib/types"

// Define BigGameImage type to match API response
interface BigGameImage {
  id: number
  title: string
  image_url: string
  match_id?: number
  upload_date?: string
  is_active?: boolean
}

//const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api"
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://gamblegalaxy.onrender.com/api"

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

interface RoundStatus {
  is_active: boolean
  crash_multiplier: number
  start_time: string
}

interface ErrorResponse {
  detail?: string
  message?: string
  error?: string
}

class ApiClient {
  private async getAccessToken(): Promise<string | null> {
    if (typeof window === "undefined") return null
    return localStorage.getItem("access_token")
  }

  private getRefreshToken(): string | null {
    if (typeof window === "undefined") return null
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
      console.log(`🌐 Making API request to: ${API_BASE_URL}${endpoint}`, {
        method: options.method,
        body: options.body,
        headers: options.headers,
      })

      const headers: HeadersInit = {
        "Content-Type": "application/json",
        ...(options.headers || {}),
        ...(await this.getAuthHeaders()),
      }

      const res = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers,
      })

      console.log(`📥 Response status: ${res.status}, headers:`, Object.fromEntries(res.headers.entries()))

      let data: unknown = null
      const contentType = res.headers.get("content-type")

      if (contentType && contentType.includes("application/json")) {
        data = await res.json()
      } else {
        const textData = await res.text()
        console.warn(`⚠️ Non-JSON response received: ${textData}`)
        data = { message: textData }
      }

      console.log(`🔍 Raw API response for ${endpoint}:`, data)

      if (res.status === 401 && retry) {
        console.log("🔄 Got 401, attempting token refresh...")
        const newAccess = await this.refreshAccessToken()
        if (newAccess) {
          console.log("🔄 Retrying request with new token...")
          return this.request<T>(endpoint, options, false)
        }
      }

      // Type-safe error handling
      const errorData = data as ErrorResponse
      const result: ApiResponse<T> = {
        data: res.ok ? (data as T) : undefined,
        error: !res.ok
          ? errorData?.detail || errorData?.message || errorData?.error || `HTTP ${res.status}`
          : undefined,
        status: res.status,
      }

      return result
    } catch (error) {
      console.error(`💥 Network error in API request to ${endpoint}:`, error)
      return {
        error: `Network error: ${error instanceof Error ? error.message : "Unknown error"}`,
        status: 0,
      }
    }
  }

  // Auth
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

  // Wallet
  async getWallet() {
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

  // 💾 CRITICAL: Direct wallet balance update for instant cashouts
  async updateWalletBalance(data: {
    user_id: number
    amount: number
    transaction_type: "winning" | "deposit" | "withdraw" | "bonus"
    description: string
    bet_id?: number
  }) {
    console.log("💾 Updating wallet balance in database:", data)
    const response = await this.request<{
      success: boolean
      new_balance: number
      transaction_id: number
    }>("/wallet/update-balance/", {
      method: "POST",
      body: JSON.stringify(data),
    })
    console.log("💾 Wallet balance update response:", response)
    return response
  }

  // Betting
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

  async getBigGames() {
    return this.request<BigGameImage[]>("/betting/big-games/")
  }

  // Predictor API endpoints
  async getPredictorPackages() {
    console.log("📦 Fetching predictor packages")
    const response = await this.request<PredictorPackage[]>("/games/predictors/")
    console.log("🔍 Predictor packages response:", response)
    return response
  }

  async purchasePredictorPackage(packageId: number) {
    console.log("💎 Purchasing predictor package:", packageId)
    const response = await this.request<{
      purchase: PredictorPurchase
      new_balance: number
      message: string
    }>("/games/predictors/purchase/", {
      method: "POST",
      body: JSON.stringify({ predictor_package_id: packageId }),
    })
    console.log("🔍 Predictor purchase response:", response)
    return response
  }

  async getMyPredictorPurchases() {
    console.log("📜 Fetching my predictor purchases")
    const response = await this.request<PredictorPurchase[]>("/games/predictors/my-purchases/")
    console.log("🔍 My predictor purchases response:", response)
    return response
  }

  async generatePrediction(purchaseId: number) {
    console.log("🎯 Generating prediction for purchase:", purchaseId)
    const response = await this.request<GeneratePredictionResponse>("/games/predictors/generate/", {
      method: "POST",
      body: JSON.stringify({ purchase_id: purchaseId }),
    })
    console.log("🔍 Generate prediction response:", response)
    return response
  }

  async getCurrentPrediction() {
    console.log("🎯 Fetching current prediction")
    const response = await this.request<{
      prediction: PredictorPrediction | null
      has_active_package: boolean
      predictions_remaining: number
    }>("/games/predictors/my-purchases/", {
      method: "GET",
    })
    console.log("🔍 Current prediction response:", response)
    return response
  }

  async getPredictorStats() {
    console.log("📊 Fetching predictor stats")
    const response = await this.request<PredictorStats>("/games/aviator/predictor/stats/")
    console.log("🔍 Predictor stats response:", response)
    return response
  }

  async getPredictionHistory() {
    console.log("📜 Fetching prediction history")
    const response = await this.request<PredictorPrediction[]>("/games/aviator/predictor/history/")
    console.log("🔍 Prediction history response:", response)
    return response
  }

  // Aviator
  async startAviatorRound() {
    console.log("🚀 Initiating new Aviator round")
    const response = await this.request<AviatorRound>("/games/aviator/start/", {
      method: "POST",
    })
    console.log("🔍 Start round response:", response)
    return response
  }

  async placeAviatorBet(payload: { amount: number; round_id: number; auto_cashout?: number }) {
    console.log("🎲 Placing Aviator bet:", payload)
    const response = await this.request<{
      bet: AviatorBet
      new_balance: number
      round_id: number
    }>("/games/aviator/bet/", {
      method: "POST",
      body: JSON.stringify(payload),
    })
    console.log(`🔍 Aviator bet response:`, response)

    // 🔧 FIXED: Return the complete response with bet data and balance
    if (response.data) {
      return {
        ...response,
        data: {
          ...response.data.bet,
          new_balance: response.data.new_balance,
          round_id: response.data.round_id,
          bet: response.data.bet,
        },
      }
    }
    return response
  }

  async cashoutAviator(bet_id: number, multiplier: number) {
    console.log("💰 Cashing out Aviator bet:", { bet_id, multiplier })
    const response = await this.request<{
      message: string
      win_amount?: number
      new_balance?: number
      updated_top_winners?: boolean
    }>("/games/aviator/cashout/", {
      method: "POST",
      body: JSON.stringify({ bet_id, multiplier }),
    })
    console.log(`🔍 Aviator cashout response:`, response)
    return response
  }

  async getRoundStatus(round_id: number) {
    console.log("🔄 Fetching round status for round:", round_id)
    const response = await this.request<RoundStatus>(`/games/aviator/round/${round_id}/status/`)
    console.log(`🔍 Round status response:`, response)
    return response
  }

  async getPastCrashes() {
    console.log("📊 Fetching past crashes")
    const response =
      await this.request<Array<{ id: number; multiplier: number; color: string; timestamp: string }>>(
        "/games/aviator/past-crashes/",
      )
    console.log(`🔍 Past crashes response:`, response)
    return response
  }

  // 🔧 IMPROVED: Enhanced top winners fetching with better error handling
  async getTopWinners() {
    console.log("🏆 Fetching top winners")
    const response = await this.request<TopWinner[]>("/games/aviator/top-winners/")
    console.log(`🔍 Top winners response:`, response)

    // 🔧 FIXED: Ensure we always return valid data structure
    if (response.data && Array.isArray(response.data)) {
      // Filter and validate top winners data
      const validWinners = response.data.filter(
        (winner) =>
          winner &&
          (Number(winner.win_amount ?? 0) > 0 || Number(winner.amount ?? 0) > 0) &&
          winner.username &&
          ((winner.multiplier ?? 0) > 0 || (winner.cash_out_multiplier ?? 0) > 0),
      )
      return {
        ...response,
        data: validWinners,
      }
    }
    return {
      ...response,
      data: [],
    }
  }

  // 🔧 NEW: Refresh top winners after significant wins
  async refreshTopWinners() {
    console.log("🔄 Refreshing top winners data")
    return this.getTopWinners()
  }

  async getUserSureOdds() {
    console.log("🎯 Fetching user sure odds")
    const response = await this.request<SureOdd[]>("/games/aviator/sure-odds/")
    console.log(`🔍 Sure odds response:`, response)
    return response
  }

  async getMyAviatorBets() {
    console.log("📜 Fetching user Aviator bets")
    const response = await this.request<AviatorBet[]>("/games/aviator/my-bets/")
    console.log(`🔍 Aviator bets response:`, response)
    return response
  }

  // Premium Sure Odds
  async purchaseSureOdd() {
    console.log("💎 Purchasing sure odd")
    const response = await this.request<{ detail: string }>("/games/aviator/sure-odds/purchase/", {
      method: "POST",
    })
    console.log(`🔍 Sure odd purchase response:`, response)
    return response
  }

  async getSureOdd() {
    console.log("🎯 Fetching current sure odd")
    const response = await this.request<{
      odd_value: number | null
    }>("/games/aviator/sure-odds/get/")
    console.log(`🔍 Sure odd response:`, response)
    return response
  }

  async getSureOddStatus() {
    console.log("🔍 Fetching sure odd status")
    const response = await this.request<{
      has_pending: boolean
    }>("/games/aviator/sure-odds/status/")
    console.log(`🔍 Sure odd status response:`, response)
    return response
  }

  async getSureOddHistory() {
    console.log("📜 Fetching sure odd history")
    const response = await this.request<{
      history: Array<{
        odd_value: number | null
        created_at: string
        used: boolean
      }>
    }>("/games/aviator/sure-odds/history/")
    console.log(`🔍 Sure odd history response:`, response)
    return response
  }

  // Dashboard
  async getDashboardStats() {
    console.log("📊 Fetching dashboard stats")
    const response = await this.request<DashboardStats>("/dashboard/stats/")
    console.log(`🔍 Dashboard stats response:`, response)

    // 🔧 FIXED: Ensure top winners are included in dashboard stats
    if (response.data && !response.data.topWinners) {
      console.log("🔄 Dashboard missing top winners, fetching separately...")
      const winnersResponse = await this.getTopWinners()
      if (winnersResponse.data) {
        response.data.topWinners = winnersResponse.data
      }
    }
    return response
  }

  async getRecentActivity() {
    console.log("📜 Fetching recent activity")
    const response = await this.request<RecentActivity[]>("/dashboard/activity/")
    console.log(`🔍 Recent activity response:`, response)
    return response
  }

  async updateProfile(data: Partial<User>) {
    console.log("🔄 Updating profile with data:", data)
    const response = await this.request<User>("/accounts/profile/", {
      method: "PATCH",
      body: JSON.stringify(data),
    })
    console.log("🔍 Profile update response:", response)
    return response
  }

  async uploadAvatar(file: File) {
    const formData = new FormData()
    formData.append("avatar", file)
    console.log("📸 Uploading avatar")
    const response = await this.request<User>("/accounts/profile/", {
      method: "PATCH",
      body: formData,
      headers: {},
    })
    console.log("🔍 Avatar upload response:", response)
    return response
  }
}

export const api = new ApiClient()

export const setPastCrashes = async (crashes: number[]) => {
  console.log("📊 Setting past crashes:", crashes)
  // This function is used to set past crashes in the WebSocket state
  // It's typically called from the aviator game component
  return crashes
}
