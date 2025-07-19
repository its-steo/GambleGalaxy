// User & Auth Types
export interface User {
  id: number
  username: string
  email: string
  phone?: string
  is_verified: boolean
  is_bot: boolean
  avatar?: string
}

export interface RegisterData {
  username: string
  email: string
  phone?: string
  password: string
}

export interface LoginResponse {
  access: string
  refresh: string
}

// Wallet Types
export interface Wallet {
  balance: string
}

export interface Transaction {
  id: number
  transaction_type: "deposit" | "withdraw"
  amount: string
  timestamp: string
  description?: string
}

// Betting Types
export interface Match {
  id: number
  home_team: string
  away_team: string
  match_time: string
  odds_home_win: string
  odds_draw: string
  odds_away_win: string
  status: "upcoming" | "first_half" | "halftime" | "second_half" | "fulltime"
  score_home: number
  score_away: number
}

export interface BetSelection {
  id?: number
  match: Match
  match_id?: number
  selected_option: "home_win" | "draw" | "away_win"
  is_correct?: boolean
}

export interface Bet {
  id: number
  user: number
  amount: string
  total_odds: string
  status: "pending" | "won" | "lost"
  placed_at: string
  selections: BetSelection[]
}

export interface SureOddSlip {
  code: string
  matches: Array<{
    home_team: string
    away_team: string
    match_time: string
    prediction?: string
  }>
  paid: boolean
  allow_payment: boolean
  show_predictions: boolean
  dismiss: boolean
}

// Aviator Game Types
export interface AviatorRound {
  id: number
  crash_multiplier: number
  start_time: string
  is_active: boolean
  color: "red" | "yellow" | "green" | "blue" | "purple"
}

export interface AviatorBet {
  id: number
  user: number
  username: string
  round: number
  round_crash: number
  amount: string
  auto_cashout?: number
  cashed_out_at?: number
  is_winner: boolean
  created_at: string
}

export interface TopWinner {
  username: string
  avatar?: string
  amount: string
  cashed_out_at: number
}

export interface SureOdd {
  id: number
  user: number
  username: string
  odd: string
  is_used: boolean
  verified_by_admin: boolean
  created_at: string
}

// WebSocket Message Types
export interface WebSocketMessage {
  type: "multiplier" | "crash" | "manual_cashout_success" | "manual_cashout_error"
  round_id?: number
  multiplier?: number
  crash_multiplier?: number
  message?: string
  error?: string
  wallet_update?: number
  balance?: number
  live_players?: Array<{ username: string; avatar?: string }>
  recent_cashouts?: Array<{ username: string; amount: string; cashed_out_at: number }>
  players?: Array<{ username: string; avatar?: string }>
  new_bet?: {
    id: number
    user: number
    amount: string
    total_odds: string
  }
}
