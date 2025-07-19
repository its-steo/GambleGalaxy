// js/main.js

export async function loadDashboardData() {
  const usernameSpan = document.getElementById("username")
  const walletSpan = document.getElementById("wallet-balance")
  const totalBetsSpan = document.getElementById("total-bets")
  const betsWonSpan = document.getElementById("bets-won")
  const betsLostSpan = document.getElementById("bets-lost")

  const token = localStorage.getItem("accessToken")

  try {
    // Load user profile
    const userRes = await fetch("/api/profile/", {
      headers: { Authorization: `Bearer ${token}` },
    })
    const user = await userRes.json()
    usernameSpan.textContent = user.username

    // Load wallet balance
    const walletRes = await fetch("/api/wallet/", {
      headers: { Authorization: `Bearer ${token}` },
    })
    const wallet = await walletRes.json()
    walletSpan.textContent = wallet.balance.toFixed(2)

    // Load betting stats
    const statsRes = await fetch("/api/betting/stats/", {
      headers: { Authorization: `Bearer ${token}` },
    })
    const stats = await statsRes.json()
    totalBetsSpan.textContent = stats.total_bets
    betsWonSpan.textContent = stats.bets_won
    betsLostSpan.textContent = stats.bets_lost

  } catch (err) {
    alert("Failed to load dashboard. You might need to log in again.")
    window.location.href = "login.html"
  }
}

export function logoutUser() {
  localStorage.removeItem("accessToken")
  localStorage.removeItem("refreshToken")
  window.location.href = "login.html"
}
