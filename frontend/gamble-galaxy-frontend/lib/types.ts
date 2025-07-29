import { ReactNode } from "react";

// User & Auth Types
export interface User {
  balance: number;
  id: number;
  username: string;
  email: string;
  phone?: string;
  is_verified: boolean;
  is_bot: boolean;
  avatar?: string;
}

export interface RegisterData {
  username: string;
  email: string;
  phone?: string;
  password: string;
}

export interface LoginResponse {
  access: string;
  refresh: string;
}

// Wallet Types
export interface Wallet {
  balance: string;
}

export interface Transaction {
  id: number;
  transaction_type: "deposit" | "withdraw";
  amount: string;
  timestamp: string;
  description?: string;
}

// Betting Types
export interface Match {
  id: number
  home_team: string
  away_team: string
  match_time: string
  status: string
  score_home: number
  score_away: number

  // Standard 1X2 odds
  odds_home_win: string
  odds_draw: string
  odds_away_win: string

  // Goals
  odds_over_2_5?: string
  odds_under_2_5?: string

  // BTTS
  odds_btts_yes?: string
  odds_btts_no?: string

  // Double Chance
  odds_home_or_draw?: string
  odds_draw_or_away?: string
  odds_home_or_away?: string

  // Half Time / Full Time
  odds_ht_ft_home_home?: string
  odds_ht_ft_draw_draw?: string
  odds_ht_ft_away_away?: string

  // Correct Score
  odds_score_1_0?: string
  odds_score_2_1?: string
  odds_score_0_0?: string
  odds_score_1_1?: string
}

export interface BetSelection {
  id?: number;
  match: Match;
  match_id?: number;
  selected_option: string;
  is_correct?: boolean;
}

export interface Bet {
  odds: string; // Total odds for the bet
  match: Match; // Replaced any with Match type
  id: number;
  user: number;
  amount: string;
  total_odds: string;
  status:string; // "pending" | "won" | "lost"
  placed_at: string;
  selections: BetSelection[];
}

export interface SureOddSlip {
  code: string
  matches: Array<{
    home_team: string
    away_team: string
    match_time: string
    prediction?: string
  }>
  amount_paid: number
  paid: boolean
  show_predictions: boolean
  allow_payment: boolean
  dismiss: boolean
}

// Aviator Game Types
export interface AviatorRound {
  id: number;
  crash_multiplier: number;
  start_time: string;
  is_active: boolean;
  color: "red" | "yellow" | "green" | "blue" | "purple";
}

export interface AviatorBet {
  id: number;
  user: number;
  username: string;
  round: number;
  round_crash: number;
  amount: string;
  auto_cashout?: number;
  cashed_out_at?: number;
  is_winner: boolean;
  created_at: string;
}

export interface TopWinner {
  username: string;
  avatar?: string;
  amount: string;
  cashed_out_at: number;
}

export interface SureOdd {
  id: number;
  user: number;
  username: string;
  odd: string;
  is_used: boolean;
  verified_by_admin: boolean;
  created_at: string;
}

// WebSocket Message Types
export interface LivePlayer {
  user_id: number;
  username: string;
  bet_amount: string;
  cashout_multiplier?: number;
}

export interface RecentCashout {
  user_id: number;
  username: string;
  amount: string;
  cashout_multiplier: number;
  timestamp: string;
}

export type WebSocketMessage =
  | { type: "multiplier"; live_players: LivePlayer[]; multiplier: number; round_id: number }
  | { type: "crash"; crash_multiplier: number }
  | { type: "manual_cashout_success"; message: string }
  | { type: "manual_cashout_error"; error: string }
  | { type: "cash_out_error"; message: string; error: string }
  | { type: "balance_update"; balance: number }
  | { type: "live_players"; players?: LivePlayer[]; count?: number }
  | { type: "recent_cashouts"; cashouts: RecentCashout[] }
  | { type: "new_bet"; bet: AviatorBet }
  | { type: "game_state"; round_id: number; multiplier: number; is_active: boolean; live_players: LivePlayer[]; recent_cashouts: RecentCashout[]; count?: number }
  | { type: "round_started"; round_id: number }
  | { type: "bet_placed"; new_balance: number; amount: number }
  | { type: "bet_error"; message: string; original_balance?: number }
  | { type: "cash_out_success"; new_balance: number; win_amount: number; multiplier: number }
  | { type: "player_cashed_out"; recent_cashouts: RecentCashout[] }
  | { type: "pong" };


export interface PremiumSureOddPurchase {
  id: string;
  user_id: string;
  amount: number;
  status: "pending" | "assigned" | "expired";
  purchased_at: string;
  assigned_at?: string;
  odd?: number;
  expires_at: string;
}

export interface PremiumSureOddResponse {
  id: string;
  odd: number;
  assigned_at: string;
  expires_at: string;
  status: "active" | "used" | "expired";
}

export interface PendingPremiumOddsResponse {
  has_pending: boolean;
  pending_purchases: PremiumSureOddPurchase[];
  active_odds: PremiumSureOddResponse[];
}

export interface PremiumSureOddPurchaseResponse {
  id: string;
  message: string;
  purchase_id: string;
  amount: number;
  status: string;
}