// ✅ User types matching Django User model
export interface User {
  id: number
  username: string
  email: string
  first_name: string
  last_name: string
  date_joined: string
}

// ✅ Wallet types matching Django Wallet model
export interface WalletBalance {
  balance: number
}

export interface Transaction {
  id: number
  transaction_type: "deposit" | "withdraw" | "bet" | "winning" | "bonus" | "penalty"
  amount: number
  status: "pending" | "completed" | "failed"
  description: string
  created_at: string
  payment_method?: string
}

// ✅ Betting types matching Django models
export interface Match {
  id: number
  home_team: string
  away_team: string
  match_time: string
  status: string
  odds_home_win: number
  odds_draw: number
  odds_away_win: number
  odds_over_2_5?: number
  odds_under_2_5?: number
  odds_btts_yes?: number
  odds_btts_no?: number
}

export interface BetSelection {
  match_id: number
  selected_option: string
  odds: number
}

export interface Bet {
  id: number
  amount: number
  total_odds: number
  status: "pending" | "won" | "lost"
  placed_at: string
  selections: BetSelection[]
  potential_payout: number
}

// ✅ Aviator types matching Django models
export interface AviatorRound {
  id: number
  crash_multiplier: number
  created_at: string
}

export interface AviatorGameState {
  round_id: string | null
  multiplier: number
  is_active: boolean
  phase: "betting" | "flying" | "crashed"
  countdown?: number
  live_players?: number
}

export interface AviatorBet {
  id: string
  amount: number
  auto_cashout?: number
  multiplier?: number
  status: "active" | "cashed_out" | "lost"
  bet_number?: number
}

// ✅ Notification types
export interface Notification {
  id: string
  type: "success" | "error" | "info" | "warning"
  title: string
  message: string
  duration?: number
}

// ✅ Dashboard types
export interface DashboardStats {
  total_balance?: number
  total_bets?: number
  total_winnings?: number
  win_rate?: number
}

// ✅ SureOdds types matching Django models
export interface SureOddsMatch {
  id: number
  match_id: string
  home_team: string
  away_team: string
  league: string
  match_time: string
  status: "upcoming" | "live" | "finished"
  home_odds: number
  draw_odds: number
  away_odds: number
  over_2_5_odds?: number
  under_2_5_odds?: number
  btts_yes_odds?: number
  btts_no_odds?: number
  created_at: string
  updated_at: string
}

export interface SureOddsBet {
  id: number
  match: SureOddsMatch
  bet_type: string
  odds: number
  amount: number
  status: "pending" | "won" | "lost"
  placed_at: string
  potential_payout: number
}

export interface SureOddsStats {
  total_matches?: number
  live_matches?: number
  upcoming_matches?: number
  total_bets_today?: number
}
