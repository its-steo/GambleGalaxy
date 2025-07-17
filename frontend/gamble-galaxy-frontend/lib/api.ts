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
  private getAuthHeaders(): Record<string, string> {
    if (typeof window === "undefined") return {}
    const token = localStorage.getItem("access_token")
    return token ? { Authorization: `Bearer ${token}` } : {}
  }

  async request<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
    try {
      const headers: HeadersInit = {
        "Content-Type": "application/json",
        ...this.getAuthHeaders(),
        ...(options.headers ? (options.headers as Record<string, string>) : {}),
      }
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        headers,
        ...options,
      })

      const data = await response.json()

      return {
        data: response.ok ? data : undefined,
        error: !response.ok ? data.detail || data.message || "An error occurred" : undefined,
        status: response.status,
      }
    } catch (error) {
      return {
        error: "Network error",
        status: 0,
      }
    }
  }

  // Auth endpoints
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

  // Wallet endpoints
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

  // Betting endpoints
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

  // Aviator endpoints
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
      "/games/api/aviator/past-crashes/",
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
