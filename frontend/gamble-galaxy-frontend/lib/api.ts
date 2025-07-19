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

class ApiClient {
  private async getAccessToken(): Promise<string | null> {
    return localStorage.getItem("access_token")
  }

  private getRefreshToken(): string | null {
    return localStorage.getItem("refresh_token")
  }

  private async refreshAccessToken(): Promise<string | null> {
    const refresh = this.getRefreshToken()
    if (!refresh) return null

    try {
      const res = await fetch(`${API_BASE_URL}/accounts/token/refresh/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh }),
      })
      const data = await res.json()
      if (res.ok && data.access) {
        localStorage.setItem("access_token", data.access)
        return data.access
      } else {
        localStorage.removeItem("access_token")
        localStorage.removeItem("refresh_token")
        return null
      }
    } catch {
      return null
    }
  }

  private async getAuthHeaders(): Promise<Record<string, string>> {
    const token = await this.getAccessToken()
    return token ? { Authorization: `Bearer ${token}` } : {}
  }

  async request<T>(endpoint: string, options: RequestInit = {}, retry = true): Promise<ApiResponse<T>> {
    try {
      const headers: HeadersInit = {
        "Content-Type": "application/json",
        ...(options.headers || {}),
        ...(await this.getAuthHeaders()),
      }

      const res = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers,
      })

      const data = await res.json()

      if (res.status === 401 && retry) {
        const newAccess = await this.refreshAccessToken()
        if (newAccess) {
          return this.request<T>(endpoint, options, false) // retry once
        }
      }

      return {
        data: res.ok ? data : undefined,
        error: !res.ok ? data?.detail || data?.message || "An error occurred" : undefined,
        status: res.status,
      }
    } catch {
      return { error: "Network error", status: 0 }
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

  // ✅ Wallet
  async getWallet() {
    return this.request<Wallet>("/wallet/")
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

  // ✅ Aviator
  async startAviatorRound() {
    return this.request<AviatorRound>("/games/aviator/start/", {
      method: "POST",
    })
  }

  async placeAviatorBet(amount: number, round_id?: number) {
    return this.request<AviatorBet>("/games/aviator/bet/", {
      method: "POST",
      body: JSON.stringify({ amount, round_id }),
    })
  }

  async cashoutAviator(bet_id: number, multiplier: number) {
    return this.request<{ message: string; win_amount?: number }>("/games/aviator/cashout/", {
      method: "POST",
      body: JSON.stringify({ bet_id, multiplier }),
    })
  }

  async getPastCrashes() {
    return this.request<Array<{ id: number; multiplier: number; color: string; timestamp: string }>>(
      "/games/api/aviator/past-crashes/"
    )
  }

  async getTopWinners() {
    return this.request<TopWinner[]>("/games/api/aviator/top-winners/")
  }

  async getUserSureOdds() {
    return this.request<SureOdd[]>("/games/api/aviator/sure-odds/")
  }

  async getMyAviatorBets() {
    return this.request<AviatorBet[]>("/games/api/aviator/my-bets/")
  }
}

export const api = new ApiClient()
