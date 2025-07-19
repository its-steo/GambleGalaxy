document.addEventListener("DOMContentLoaded", () => {
  getWalletBalance();

  document.getElementById("deposit-btn").addEventListener("click", () => {
    alert("Deposit coming soon...");
  });

  document.getElementById("withdraw-btn").addEventListener("click", () => {
    alert("Withdraw coming soon...");
  });
});

function getWalletBalance() {
  const token = localStorage.getItem("access");
  const balanceEl = document.getElementById("wallet-balance");

  fetch("http://127.0.0.1:8000/api/wallet/", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })
    .then((res) => {
      if (!res.ok) throw new Error("Failed to fetch wallet");
      return res.json();
    })
    .then((data) => {
      balanceEl.textContent = `KES ${data.balance.toLocaleString()}.00`;
    })
    .catch((err) => {
      balanceEl.textContent = "KES 0.00";
      console.error(err);
    });
}
