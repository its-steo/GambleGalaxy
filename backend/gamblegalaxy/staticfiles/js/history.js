document.addEventListener("DOMContentLoaded", () => {
  loadBetHistory();
});

function loadBetHistory() {
  const historyContainer = document.getElementById("history-list");

  // Dummy data for testing before API is connected
  const mockHistory = [
    {
      id: 1,
      match: "Arsenal vs Man City",
      selection: "Over 2.5",
      stake: 500,
      potentialWin: 950,
      status: "Won",
      date: "2025-07-17 15:30"
    },
    {
      id: 2,
      match: "Barcelona vs Real Madrid",
      selection: "BTTS",
      stake: 1000,
      potentialWin: 1800,
      status: "Lost",
      date: "2025-07-15 20:00"
    }
  ];

  historyContainer.innerHTML = "";

  mockHistory.forEach((bet) => {
    const statusColor = bet.status === "Won" ? "text-green-600" : bet.status === "Lost" ? "text-red-600" : "text-yellow-600";

    const betCard = `
      <div class="border p-4 rounded bg-gray-50 shadow-sm">
        <div class="flex justify-between items-center">
          <h3 class="text-lg font-semibold text-gray-700">${bet.match}</h3>
          <span class="text-sm ${statusColor} font-medium">${bet.status}</span>
        </div>
        <p class="text-sm mt-1 text-gray-600"><strong>Selection:</strong> ${bet.selection}</p>
        <p class="text-sm text-gray-600"><strong>Stake:</strong> KES ${bet.stake}</p>
        <p class="text-sm text-gray-600"><strong>Potential Win:</strong> KES ${bet.potentialWin}</p>
        <p class="text-xs text-gray-500 mt-1">Placed on: ${bet.date}</p>
      </div>
    `;
    historyContainer.innerHTML += betCard;
  });
}
