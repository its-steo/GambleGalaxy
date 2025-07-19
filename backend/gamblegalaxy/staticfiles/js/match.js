fetch(`${API_URL}/accounts/token/verify/`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ token })
}).then(res => {
  if (!res.ok) window.location.href = 'login.html';
});

fetch(`${API_URL}/betting/matches/`)
  .then(res => res.json())
  .then(matches => {
    const container = document.getElementById('match-highlights');
    matches.forEach(match => {
      const card = document.createElement('div');
      card.className = 'match-card';
      card.innerHTML = `
        <h3>${match.home_team} vs ${match.away_team}</h3>
        <p>Time: ${new Date(match.match_time).toLocaleString()}</p>
        <p>Odds: 🏠 ${match.odds_home_win} | 🤝 ${match.odds_draw} | 🛫 ${match.odds_away_win}</p>
      `;
      container.appendChild(card);
    });
  });
