// js/bet.js

import { getAccessToken } from './auth.js';

const matchesContainer = document.getElementById('matches-container');
const betSlip = document.getElementById('bet-slip');
const stakeInput = document.getElementById('stake');
const potentialWin = document.getElementById('potential-win');
const placeBetBtn = document.getElementById('place-bet-btn');

let selectedBets = [];

document.addEventListener('DOMContentLoaded', () => {
  fetchMatches();
  stakeInput.addEventListener('input', updatePotentialWin);
  placeBetBtn.addEventListener('click', placeBet);
});

// Fetch matches from API and render
async function fetchMatches() {
  const token = getAccessToken();
  try {
    const res = await fetch('/api/betting/matches/', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!res.ok) throw new Error('Failed to fetch matches');

    const matches = await res.json();
    displayMatches(matches);
  } catch (err) {
    matchesContainer.innerHTML = `<p class="text-red-500">Error loading matches</p>`;
    console.error(err);
  }
}

function displayMatches(matches) {
  matchesContainer.innerHTML = '';

  matches.forEach(match => {
    const matchEl = document.createElement('div');
    matchEl.className = 'border p-4 rounded shadow-sm';

    matchEl.innerHTML = `
      <h4 class="text-md font-semibold mb-1">${match.team_a} vs ${match.team_b}</h4>
      <p class="text-sm text-gray-500 mb-2">${match.start_time}</p>
      <div class="grid grid-cols-3 gap-2">
        ${['home', 'draw', 'away'].map(option => `
          <button class="option-btn bg-gray-200 hover:bg-indigo-100 text-sm py-1 px-2 rounded" 
                  data-match-id="${match.id}" 
                  data-option="${option}" 
                  data-odd="${match.odds[option]}">
            ${option.toUpperCase()} (${match.odds[option]})
          </button>
        `).join('')}
      </div>
    `;

    matchesContainer.appendChild(matchEl);
  });

  // Attach event listeners
  document.querySelectorAll('.option-btn').forEach(btn => {
    btn.addEventListener('click', () => addToSlip(btn.dataset));
  });
}

// Add match selection to bet slip
function addToSlip({ matchId, option, odd }) {
  const matchName = document.querySelector(`button[data-match-id="${matchId}"]`).closest('div').querySelector('h4').textContent;

  // Prevent duplicates
  if (selectedBets.some(bet => bet.matchId === matchId)) return;

  selectedBets.push({ matchId, matchName, option, odd: parseFloat(odd) });
  renderSlip();
  updatePotentialWin();
}

function renderSlip() {
  if (selectedBets.length === 0) {
    betSlip.innerHTML = `<p class="text-gray-400">No bets added yet.</p>`;
    return;
  }

  betSlip.innerHTML = '';
  selectedBets.forEach((bet, index) => {
    const slipItem = document.createElement('div');
    slipItem.className = 'border-b pb-2 mb-2 text-sm';
    slipItem.innerHTML = `
      <div class="flex justify-between">
        <span>${bet.matchName}</span>
        <button class="text-red-500 text-xs" data-index="${index}">Remove</button>
      </div>
      <div class="text-gray-600">Pick: <strong>${bet.option.toUpperCase()}</strong> @ ${bet.odd}</div>
    `;
    betSlip.appendChild(slipItem);
  });

  // Remove bet handler
  betSlip.querySelectorAll('button[data-index]').forEach(btn => {
    btn.addEventListener('click', () => {
      const i = parseInt(btn.dataset.index);
      selectedBets.splice(i, 1);
      renderSlip();
      updatePotentialWin();
    });
  });
}

function updatePotentialWin() {
  const stake = parseFloat(stakeInput.value) || 0;
  if (selectedBets.length === 0 || stake <= 0) {
    potentialWin.textContent = 'KSH 0.00';
    return;
  }

  const totalOdds = selectedBets.reduce((acc, bet) => acc * bet.odd, 1);
  const winnings = stake * totalOdds;
  potentialWin.textContent = `KSH ${winnings.toFixed(2)}`;
}

async function placeBet() {
  const token = getAccessToken();
  const stake = parseFloat(stakeInput.value);

  if (selectedBets.length === 0 || !stake || stake <= 0) {
    alert('Please select at least one bet and enter a valid stake.');
    return;
  }

  try {
    const res = await fetch('/api/betting/place/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        stake,
        selections: selectedBets.map(b => ({
          match_id: b.matchId,
          selected_option: b.option
        }))
      })
    });

    if (!res.ok) throw new Error('Failed to place bet');

    alert('Bet placed successfully!');
    selectedBets = [];
    stakeInput.value = '';
    renderSlip();
    updatePotentialWin();
  } catch (err) {
    console.error(err);
    alert('Something went wrong placing your bet.');
  }
}
