// ==============================
// Vilo-timer
// ==============================
let restTimerInterval;
let restTimeLeft = 0;

function startRestTimer() {
  const minutes = parseInt(document.getElementById("restMinutes").value) || 0;
  const seconds = parseInt(document.getElementById("restSeconds").value) || 0;
  restTimeLeft = minutes * 60 + seconds;

  if (restTimeLeft <= 0) {
    alert("Ange en tid större än 0 sekunder!");
    return;
  }

  clearInterval(restTimerInterval);
  updateRestDisplay();

  restTimerInterval = setInterval(() => {
    restTimeLeft--;
    updateRestDisplay();

    if (restTimeLeft <= 0) {
      clearInterval(restTimerInterval);
      alert("Vilotiden är slut!");
    }
  }, 1000);
}

function stopRestTimer() {
  clearInterval(restTimerInterval);
}

function updateRestDisplay() {
  const display = document.getElementById("restDisplay");
  const min = Math.floor(restTimeLeft / 60);
  const sec = restTimeLeft % 60;
  display.textContent = `${String(min).padStart(2,"0")}:${String(sec).padStart(2,"0")}`;

  // grafisk cirkel
  const circle = document.getElementById("restCircle");
  const total = parseInt(document.getElementById("restMinutes").value) * 60 + parseInt(document.getElementById("restSeconds").value) || 1;
  const percent = restTimeLeft / total;
  circle.style.background = `conic-gradient(#3b82f6 ${percent*360}deg, #444 ${percent*360}deg)`;
}
