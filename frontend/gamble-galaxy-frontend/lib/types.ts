import type React from "react"
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
  phone: string
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
  transaction_type: "deposit" | "withdraw" | "winning" | "bonus"
  description: string
  created_at: string
  status: "pending" | "completed" | "failed"
}

export interface Match {
  id: number
  home_team: string
  away_team: string
  start_time: string
  match_time: string
  status: "upcoming" | "live" | "finished" | "first_half" | "second_half" | "halftime" | "fulltime"
  score_home?: number
  score_away?: number
  odds: {
    home: number
    draw?: number
    away: number
  }
  // Add all the odds properties your MatchCard is expecting
  odds_home_win?: string
  odds_draw?: string
  odds_away_win?: string
  odds_over_2_5?: string
  odds_under_2_5?: string
  odds_btts_yes?: string
  odds_btts_no?: string
  odds_home_or_draw?: string
  odds_draw_or_away?: string
  odds_home_or_away?: string
  odds_ht_ft_home_home?: string
  odds_ht_ft_draw_draw?: string
  odds_ht_ft_away_away?: string
  odds_score_1_0?: string
  odds_score_2_1?: string
  odds_score_0_0?: string
  odds_score_1_1?: string
}

export interface Bet {
  id: number
  user: number
  amount: number | string
  selections: BetSelection[]
  total_odds: number | string
  potential_win: number
  status: "pending" | "won" | "lost"
  created_at: string
}

export interface BetSelection {
  match: Match
  match_id: number
  selected_option: string
  odds: number
}

// Dashboard Statistics Interface
export interface DashboardStats {
  totalBets: number
  activeBets: number
  totalWinnings: number
  winRate: number
  walletBalance: number
  totalBalance?: number // Add this as optional since API might return either
  totalLosses?: number // Add this as optional
  netProfit?: number // Add this as optional
  recentActivities?: Array<{
    id: number
    activity_type: string
    description: string
    amount: number
    timestamp: string
    game_type?: string
    multiplier?: number
  }>
  topWinners?: Array<{
    id: number
    username: string
    amount: number
    game_type?: string
    multiplier?: number
  }>
  recentTransactions: Transaction[]
  recentBets: Bet[]
  monthlyStats: {
    totalBets: number
    totalWinnings: number
    totalLosses: number
  }
  weeklyStats: {
    totalBets: number
    totalWinnings: number
    totalLosses: number
  }
  favoriteGames: Array<{
    name: string
    count: number
    winRate: number
  }>
  achievements: Array<{
    id: number
    name: string
    description: string
    unlocked: boolean
    unlockedAt?: string
  }>
}

export interface AviatorRound {
  id: number
  crash_multiplier: number
  start_time: string
  is_active: boolean
  ended_at?: string
  color?: string
  server_crash_multiplier?: number
  crashed?: boolean
  sequence?: number
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
  cashout_multiplier?: number
  final_multiplier?: number
  is_winner: boolean
  created_at: string
  placed_at?: number
  cashout_time?: string
  bet_id?: number
}

export interface TopWinner {
  user?: string
  username?: string
  avatar?: string
  amount: number | string
  cash_out_multiplier?: number
  multiplier?: number
  win_amount?: number
}

export interface SureOdd {
  id: number
  user: number
  username?: string
  odd: number
  odd_value?: number
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
  username?: string
  user_id?: number
  multiplier?: number
  cashout_multiplier?: number
  amount: number | string
  win_amount?: number
  timestamp?: string
  is_bot?: boolean
  round_id?: number
  sequence?: number
  placed_at?: number
}

export interface WebSocketMessage {
  type: string
  sequence?: number
  server_time?: number
  round_id?: number | null
  crashed?: boolean
  final?: boolean
}

export interface BotPlayer {
  username: string
  amount: number
  auto_cashout?: number
  multiplier?: number
  win_amount?: number
  is_bot: true
  placed_at?: number
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
  server_crash_multiplier?: number | null
  round_crashed?: boolean
  stop_multiplier_updates?: boolean
  last_sequence?: number
  server_time?: number
}

export interface BettingOpenMessage extends WebSocketMessage {
  type: "betting_open"
  message: string
  countdown: number
}

export interface RoundStartedMessage extends WebSocketMessage {
  type: "round_started"
  multiplier: number
  crash_multiplier?: number
}

export interface MultiplierMessage extends WebSocketMessage {
  type: "multiplier"
  multiplier: number
  crash_at?: number
}

export interface CrashMessage extends WebSocketMessage {
  type: "crash"
  multiplier: number
  crashed: true
  final: true
}

export interface BetPlacedMessage extends WebSocketMessage {
  type: "bet_placed"
  username: string
  amount: number
  auto_cashout?: number
  user_id: number
  bet_id: number
  new_balance?: number
}

export interface CashOutMessage extends WebSocketMessage {
  type: "cash_out"
  username: string
  multiplier: number
  amount: number
  win_amount: number
  user_id?: number
}

export interface CashOutSuccessMessage extends WebSocketMessage {
  type: "cash_out_success"
  message: string
  win_amount: number
  multiplier: number
  new_balance: number
  user_id: number
}

export interface ErrorMessage extends WebSocketMessage {
  type: "bet_error" | "cashout_error"
  message: string
  request_id?: string
}

export interface GameStateMessage extends WebSocketMessage {
  type: "game_state"
  round_id: number | null
  is_active: boolean
  current_multiplier: number
  crashed?: boolean
  crash_multiplier?: number
}

export interface RoundSummaryMessage extends WebSocketMessage {
  type: "round_summary"
  crash_multiplier: number
  message: string
}

export type AviatorWebSocketMessage =
  | BettingOpenMessage
  | RoundStartedMessage
  | MultiplierMessage
  | CrashMessage
  | BetPlacedMessage
  | CashOutMessage
  | CashOutSuccessMessage
  | ErrorMessage
  | GameStateMessage
  | RoundSummaryMessage
  | WebSocketMessage

export interface BetInfo {
  id: number
  amount: number
  auto_cashout?: number
  username?: string
  is_bot?: boolean
  placed_at?: number
  user_id?: number
  round_id?: number
}

export interface WebSocketConnectionState {
  socket: WebSocket | null
  isConnected: boolean
  retryCount: number
  lastPingTime?: number
  connectionId?: string
}

export type GamePhase = "waiting" | "betting" | "flying" | "crashed"

export interface CrashValidationResult {
  isValid: boolean
  reason?: string
  serverCrashMultiplier?: number
  currentMultiplier?: number
  roundCrashed?: boolean
}

export interface CashoutRequest {
  action: "cashout"
  request_id: string
  bet_id: number
  multiplier: number
  user_id?: number
  timestamp?: number
}

export interface BetPlacementRequest {
  action: "place_bet"
  request_id?: string
  round_id: number
  amount: number
  auto_cashout?: number
  user_id?: number
  timestamp?: number
}

export interface BufferedMessage {
  sequence: number
  data: AviatorWebSocketMessage
  timestamp: number
}

export interface PendingRequest {
  resolve: (value: unknown) => void
  reject: (reason: unknown) => void
  timeout: NodeJS.Timeout
  timestamp: number
  type: "bet" | "cashout"
}

export interface AviatorSidebarProps {
  showSidebar: boolean
  topWinners: TopWinner[]
  livePlayers: number
  recentCashouts: RecentCashout[]
  pastCrashes: number[]
  setBetAmount1: (amount: string) => void
  setBetAmount2: (amount: string) => void
  isBettingPhase: boolean
}

export interface BettingPanelProps {
  betNumber: 1 | 2
  betAmount: string
  setBetAmount: (amount: string) => void
  autoCashout: string
  setAutoCashout: (amount: string) => void
  onPlaceBet: () => void
  onCashOut: () => void
  hasActiveBet: boolean
  isRoundActive: boolean
  isBettingPhase: boolean
  isConnected: boolean
  currentMultiplier: number
  isAuthenticated: boolean
  isPlacingBet?: boolean
  isCashingOut?: boolean
  canPlaceBet?: boolean
  canCashOut?: boolean
  bettingTimeLeft?: number
  hasCashedOut?: boolean
  cashoutResult?: { multiplier: number; winAmount: number }
}

export interface GameHeaderProps {
  isConnected: boolean
  showSidebar: boolean
  setShowSidebar: (show: boolean) => void
  premiumSureOdd: number | null
}

export interface RecentCrashesProps {
  pastCrashes: number[]
  premiumSureOdd: number | null
}

export interface AviatorCanvasProps {
  currentMultiplier: number
  isRoundActive: boolean
  isBettingPhase: boolean
  roundCountdown: number
  isInitialized: boolean
  gamePhase: GamePhase
  showCrashScreen: boolean
  crashMultiplier: number
}

export interface LazerSignalModalProps {
  showLazerSignal: boolean
  isLoadingPremiumOdds: boolean
  hasPurchasedPremium: boolean
  premiumSureOdd: number | null
  walletBalance: number
  onDismiss: () => void
  onPayForPremiumOdds: () => void
}

export interface ApiResponse<T = unknown> {
  data?: T
  error?: string
  message?: string
  success?: boolean
  status?: number
}

export interface BetPlacementResponse {
  bet?: AviatorBet
  bet_id?: number
  round_id?: number
  new_balance?: number
  message?: string
}

export interface CashoutResponse {
  win_amount?: number
  multiplier?: number
  new_balance?: number
  message?: string
}

export interface WalletUpdateRequest {
  user_id: number
  amount: number
  transaction_type: "deposit" | "withdraw" | "winning" | "bonus"
  description: string
  bet_id?: number
}

export interface WalletUpdateResponse {
  new_balance: number
  transaction_id?: number
  message?: string
}

export interface SureOddStatusResponse {
  has_pending?: boolean
  status?: string
}

export interface SureOddResponse {
  odd_value?: number
  message?: string
}

export interface PurchaseSureOddResponse {
  success?: boolean
  message?: string
  new_balance?: number
}

export interface PastCrashesResponse {
  data: Array<{
    multiplier: number
    created_at?: string
  }>
}

export interface TopWinnersResponse {
  data: TopWinner[]
}

export interface StartRoundResponse {
  id?: number
  message?: string
}

// Dashboard API Response Types - Use type aliases instead of empty interfaces
export type DashboardStatsResponse = ApiResponse<DashboardStats>

export type UserStatsResponse = ApiResponse<{
  totalBets: number
  activeBets: number
  totalWinnings: number
  winRate: number
}>

export type RecentActivityResponse = ApiResponse<{
  recentBets: Bet[]
  recentTransactions: Transaction[]
}>

export const isTopWinner = (obj: unknown): obj is TopWinner => {
  return (
    typeof obj === "object" &&
    obj !== null &&
    (typeof (obj as TopWinner).amount === "number" || typeof (obj as TopWinner).amount === "string") &&
    (!!(obj as TopWinner).username || !!(obj as TopWinner).user)
  )
}

export const isRecentCashout = (obj: unknown): obj is RecentCashout => {
  return (
    typeof obj === "object" &&
    obj !== null &&
    (typeof (obj as RecentCashout).amount === "number" || typeof (obj as RecentCashout).amount === "string") &&
    (((obj as RecentCashout).multiplier !== undefined && (obj as RecentCashout).multiplier !== null) ||
      ((obj as RecentCashout).cashout_multiplier !== undefined && (obj as RecentCashout).cashout_multiplier !== null))
  )
}

export const isAviatorBet = (obj: unknown): obj is AviatorBet => {
  return (
    typeof obj === "object" &&
    obj !== null &&
    typeof (obj as AviatorBet).id === "number" &&
    typeof (obj as AviatorBet).amount === "number" &&
    typeof (obj as AviatorBet).user === "number"
  )
}

export const isDashboardStats = (obj: unknown): obj is DashboardStats => {
  return (
    typeof obj === "object" &&
    obj !== null &&
    typeof (obj as DashboardStats).totalBets === "number" &&
    typeof (obj as DashboardStats).activeBets === "number" &&
    typeof (obj as DashboardStats).totalWinnings === "number" &&
    typeof (obj as DashboardStats).winRate === "number" &&
    typeof (obj as DashboardStats).walletBalance === "number"
  )
}

export type Nullable<T> = T | null
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>
export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>

export interface UserActiveBet {
  id: number
  amount: number
  roundId: number
  autoCashout?: number
  placedAt: number
}

export interface CashoutResult {
  multiplier: number
  winAmount: number
}

export interface UseWebSocketReturn {
  connect: () => void
  disconnect: () => void
  isConnected: boolean
  currentMultiplier: number
  currentRoundId: number | null
  isRoundActive: boolean
  isBettingPhase: boolean
  gamePhase: GamePhase
  bettingTimeLeft: number
  cashOut: (userId: number) => Promise<CashoutResponse>
  canPlaceBet: () => boolean
  canCashOut: (userId: number) => boolean
  livePlayers: number
  recentCashouts: RecentCashout[] | null
  activeBets: Map<number, BetInfo> | null
  pastCrashes: number[] | null
  setPastCrashes: ((crashes: number[]) => void) | null
  addBetToState: ((userId: number, betInfo: BetInfo) => void) | null
  removeBetFromState: ((userId: number) => void) | null
}

export interface UseAuthReturn {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (credentials: { username: string; password: string }) => Promise<void>
  logout: () => void
  register: (data: RegisterData) => Promise<void>
}

export interface UseWalletReturn {
  balance: number
  updateBalance: (newBalance: number) => void
  refreshBalance: () => Promise<void>
  isLoading: boolean
}

// Dashboard Hook Return Type
export interface UseDashboardReturn {
  stats: DashboardStats | null
  isLoading: boolean
  error: string | null
  refreshStats: () => Promise<void>
}

// Additional Dashboard Types
export interface DashboardCard {
  title: string
  value: string | number
  change?: number
  changeType?: "increase" | "decrease"
  icon?: React.ComponentType<{ className?: string }>
  color?: string
}

export interface ChartData {
  labels: string[]
  datasets: Array<{
    label: string
    data: number[]
    backgroundColor?: string | string[]
    borderColor?: string
    borderWidth?: number
  }>
}

export interface ActivityItem {
  id: number
  type: "bet" | "transaction" | "achievement"
  title: string
  description: string
  amount?: number
  timestamp: string
  status?: "success" | "pending" | "failed"
}
