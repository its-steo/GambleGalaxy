document.addEventListener("DOMContentLoaded", () => {
  loadUserProfile();
  document.getElementById("logout-btn").addEventListener("click", logoutUser);
});

function loadUserProfile() {
  const token = localStorage.getItem("access");
  const usernameEl = document.getElementById("username");
  const phoneEl = document.getElementById("user-phone");
  const avatarEl = document.getElementById("user-avatar");

  fetch("http://127.0.0.1:8000/api/user/", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })
    .then((res) => {
      if (!res.ok) throw new Error("Failed to fetch user");
      return res.json();
    })
    .then((data) => {
      usernameEl.textContent = data.username;
      phoneEl.textContent = data.phone || "N/A";
      avatarEl.src = data.avatar || "./assets/default-avatar.png";
    })
    .catch((err) => {
      usernameEl.textContent = "Error";
      phoneEl.textContent = "";
      console.error(err);
    });
}

function logoutUser() {
  localStorage.removeItem("access");
  localStorage.removeItem("refresh");
  window.location.href = "login.html";
}
