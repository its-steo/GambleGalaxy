document.addEventListener('DOMContentLoaded', () => {
  fetchSureOdds();

  const form = document.getElementById('payment-form');
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    handlePayment();
  });
});

function fetchSureOdds() {
  const container = document.getElementById('sure-odds-container');

  fetch('/api/betting/sure-odds/')
    .then(response => {
      if (!response.ok) throw new Error('Failed to load sure odds');
      return response.json();
    })
    .then(data => {
      container.innerHTML = '';
      data.forEach(odd => {
        container.innerHTML += `
          <div class="border p-4 rounded shadow-sm bg-gray-100">
            <p><strong>Match:</strong> ${odd.match}</p>
            <p><strong>Tip:</strong> ${odd.tip}</p>
            <p><strong>Odds:</strong> ${odd.odds}</p>
            <p class="text-sm text-gray-500">Added: ${new Date(odd.created_at).toLocaleString()}</p>
          </div>
        `;
      });
    })
    .catch(error => {
      container.innerHTML = `<p class="text-red-600">Error loading odds: ${error.message}</p>`;
    });
}

function handlePayment() {
  const email = document.getElementById('email').value;
  const amount = document.getElementById('amount').value;
  const status = document.getElementById('payment-status');

  fetch('/api/betting/sure-odds/payment/', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, amount }),
  })
    .then(response => {
      if (!response.ok) throw new Error('Payment failed');
      return response.json();
    })
    .then(() => {
      status.classList.remove('hidden');
      document.getElementById('payment-form').reset();
    })
    .catch(error => {
      status.textContent = `Error: ${error.message}`;
      status.classList.remove('text-green-600');
      status.classList.add('text-red-600');
      status.classList.remove('hidden');
    });
}

