export interface User {
  id: number
  username: string
  email: string
  first_name?: string
  last_name?: string
  avatar?: string
  is_bot?: boolean
}

export interface RegisterData {
  username: string
  email: string
  password: string
  first_name?: string
  last_name?: string
}

export interface LoginResponse {
  access: string
  refresh: string
  user: User
}

export interface Wallet {
  id: number
  user: number
  balance: number
  created_at: string
  updated_at: string
}

export interface Transaction {
  id: number
  user: number
  amount: number
  transaction_type: 'deposit' | 'withdraw' | 'winning' | 'bonus'
  description: string
  created_at: string
  status: 'pending' | 'completed' | 'failed'
}

export interface Match {
  id: number
  home_team: string
  away_team: string
  start_time: string
  status: 'upcoming' | 'live' | 'finished'
  odds: {
    home: number
    draw?: number
    away: number
  }
}

export interface Bet {
  id: number
  user: number
  amount: number
  selections: BetSelection[]
  total_odds: number
  potential_win: number
  status: 'pending' | 'won' | 'lost'
  created_at: string
}

export interface BetSelection {
  match_id: number
  selected_option: string
  odds: number
}

export interface AviatorRound {
  id: number
  crash_multiplier: number
  start_time: string
  is_active: boolean
  color?: string
}

export interface AviatorBet {
  id: number
  user: number
  username?: string
  round: number
  round_crash?: number
  amount: number
  auto_cashout?: number
  cash_out_multiplier?: number
  final_multiplier?: number
  is_winner: boolean
  created_at: string
}

export interface TopWinner {
  user: string
  username?: string
  avatar?: string
  amount: number
  cash_out_multiplier: number
  win_amount?: number
}

export interface SureOdd {
  id: number
  user: number
  username?: string
  odd: number
  is_used: boolean
  verified_by_admin: boolean
  created_at: string
}

export interface SureOddSlip {
  id: number
  matches: Match[]
  total_odds: number
  cost: number
  expires_at: string
}

export interface RecentCashout {
  username: string
  multiplier: number
  amount: number
  win_amount: number
  timestamp: string
  is_bot?: boolean
}

export interface WebSocketMessage {
  type: string
  [key: string]: any
}

// Bot-specific types
export interface BotPlayer {
  username: string
  amount: number
  auto_cashout?: number
  multiplier?: number
  win_amount?: number
  is_bot: true
}

export interface GameState {
  round_id: number | null
  is_active: boolean
  current_multiplier: number
  betting_phase: boolean
  countdown: number
  live_players: number
  recent_cashouts: RecentCashout[]
  bot_players: BotPlayer[]
}
