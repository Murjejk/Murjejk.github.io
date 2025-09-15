// ================================
// main.js – Fullständig rensad version
// ================================

// ---------------- Firebase Setup ----------------
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyCvrXL_n-YNgtxwXegG0BzkHu9_CJUPiDU",
  authDomain: "training-d1d9d.firebaseapp.com",
  projectId: "training-d1d9d",
  storageBucket: "training-d1d9d.firebasestorage.app",
  messagingSenderId: "813923749374",
  appId: "1:813923749374:web:7e301c4970d77893f7c4af",
  measurementId: "G-KPV09FMJB7"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const API_URL = "https://script.google.com/macros/s/AKfycbw6hWtl484M_Bxc3UH6LlbI3r6DS0J1RboncYKF1c_U3VrCXPGu-K28Ft52sschE7S2/exec";

// ---------------- Globals ----------------
let exerciseChart;        // Lägg till träning-graf
let muscleExerciseChart;  // Musklegrupper-graf
let weightChart;          // Kroppsvikt-graf
let restTimerAnimation;  

// ---------------- Helper Functions ----------------
window.showSection = function(id, btn) {
  document.querySelectorAll("main section").forEach(sec => sec.classList.remove("active"));
  document.getElementById(id).classList.add("active");

  document.querySelectorAll("nav button").forEach(b => b.classList.remove("active"));
  if (btn) btn.classList.add("active");

  if (id === "kroppsvikt") loadLatestWeight();
};

window.toggleExercises = function(el) {
  const exercises = el.querySelector(".exercises");
  exercises.style.display = exercises.style.display === "block" ? "none" : "block";
};

// ---------------- Prefill Exercise ----------------
window.prefillExercise = function(ex) {
  document.getElementById("exercise").value = ex.name;
  document.getElementById("primary").value = ex.muscle;
  document.getElementById("weight").value = ex.latestWeight || "";
  document.getElementById("reps").value = 10;
  document.getElementById("effort").value = "Rätt";

  loadExerciseChart(ex.name); // Auto-ladda graf
  const navBtn = document.getElementById("btnOvningar");
  if (navBtn) showSection("ovningar", navBtn);
};

// ---------------- Rest Timer ----------------
window.startRestTimer = function() {
  const input = document.getElementById("restTime");
  let totalSeconds = parseInt(input.value);
  if (isNaN(totalSeconds) || totalSeconds < 10 || totalSeconds > 600) {
    alert("Ange en tid mellan 10 och 600 sekunder.");
    return;
  }

  const timerText = document.getElementById("timerText");
  const progressCircle = document.querySelector(".circle-timer circle.progress");
  const radius = progressCircle.r.baseVal.value;
  const circumference = 2 * Math.PI * radius;
  progressCircle.style.strokeDasharray = circumference;
  progressCircle.style.strokeDashoffset = 0;

  if (restTimerAnimation) cancelAnimationFrame(restTimerAnimation);

  const startTime = performance.now();

  function formatTime(sec) {
    const minutes = Math.floor(sec / 60);
    const seconds = sec % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }

  function animate(now) {
    const elapsedMs = now - startTime;
    const elapsedSec = Math.floor(elapsedMs / 1000);
    const remainingSec = totalSeconds - elapsedSec;

    if (remainingSec >= 0) timerText.innerText = formatTime(remainingSec);

    const progress = Math.min(elapsedMs / (totalSeconds * 1000), 1);
    progressCircle.style.strokeDashoffset = progress * circumference;

    if (progress < 1) restTimerAnimation = requestAnimationFrame(animate);
    else timerText.innerText = "0:00";
  }

  restTimerAnimation = requestAnimationFrame(animate);
};

// ---------------- DOMContentLoaded ----------------
document.addEventListener("DOMContentLoaded", () => {
  // Visa välkomstmeddelande
  document.querySelectorAll("#content section").forEach(sec => sec.classList.remove("active"));
  const welcomeSection = document.getElementById("welcome");
  if (welcomeSection) welcomeSection.classList.add("active");

  // Dynamisk graf kopplad till inputfält
  const exerciseInput = document.getElementById("exercise");
  if (exerciseInput) {
    exerciseInput.addEventListener("input", () => {
      const name = exerciseInput.value.trim();
      if (name.length > 1) loadExerciseChart(name);
      else clearExerciseChart();
    });
  }

  // LOGIN
  const loginBtn = document.getElementById("loginBtn");
  const loginError = document.getElementById("loginError");
  const loginSection = document.getElementById("login");
  const contentSection = document.getElementById("content");
  const logoutBtn = document.getElementById("logoutBtn");

  if (loginBtn) {
    loginBtn.addEventListener("click", () => {
      const email = document.getElementById("email").value;
      const password = document.getElementById("password").value;
      loginError.textContent = "";

      signInWithEmailAndPassword(auth, email, password)
        .then(() => {
          loginSection.style.display = "none";
          contentSection.style.display = "block";
          loadPassMenu();
          loadData();
          loadLatestWeight();
          loadMuscleGroups();
        })
        .catch(error => loginError.textContent = error.message);
    });
  }

  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      signOut(auth)
        .then(() => console.log("Användare utloggad."))
        .catch(err => alert("Fel vid utloggning: " + err.message));
    });
  }

  // AUTH STATE
  onAuthStateChanged(auth, user => {
    if (user) {
      loginSection.style.display = "none";
      contentSection.style.display = "block";
      document.querySelectorAll("main section").forEach(sec => sec.classList.remove("active"));
      if (welcomeSection) welcomeSection.classList.add("active");

      loadPassMenu();
      loadData();
      loadLatestWeight();
      loadMuscleGroups();
    } else {
      loginSection.style.display = "block";
      contentSection.style.display = "none";
      document.querySelectorAll("main section").forEach(sec => sec.classList.remove("active"));
    }
  });

  // LÄGG TILL TRÄNINGSLOGG
  document.getElementById("logForm").addEventListener("submit", async e => {
    e.preventDefault();
    const today = new Date().toISOString().split("T")[0];
    const formData = new FormData();
    formData.append("exercise", document.getElementById("exercise").value);
    formData.append("weight", document.getElementById("weight").value);
    formData.append("reps", document.getElementById("reps").value);
    formData.append("primary", document.getElementById("primary").value);
    formData.append("secondary", document.getElementById("secondary").value);
    formData.append("effort", document.getElementById("effort").value);
    formData.append("date", today);

    try {
      const response = await fetch(API_URL, { method: "POST", body: formData });
      const result = await response.json();
      if (result.status === "success") {
        document.getElementById("logForm").reset();
        loadData();
        loadMuscleGroups();
        const exName = formData.get("exercise");
        if (exName) loadExerciseChart(exName); // Auto-uppdatera grafen
      } else alert("Kunde inte spara träningsposten.");
    } catch (err) {
      alert("Fel vid anslutning till Google Sheets: " + err);
    }
  });
});

// ---------------- Exercise Graph ----------------
async function loadExerciseChart(exerciseName) {
  const ctx = document.getElementById("exerciseChart").getContext("2d");
  const msg = document.getElementById("exerciseChartMessage");

  try {
    const res = await fetch(API_URL);
    const data = await res.json();
    const rows = data.slice(1).filter(r => r[0].trim().toLowerCase() === exerciseName.trim().toLowerCase());

    if (rows.length === 0) {
      clearExerciseChart();
      msg.style.display = "block";
      msg.textContent = "Ingen data hittades.";
      return;
    }

    msg.style.display = "none";
    rows.sort((a,b) => new Date(a[6]) - new Date(b[6]));
    const chartData = rows.map(r => ({ x: r[6].substring(0,10), y: parseFloat(r[1]) }));

    if (exerciseChart) exerciseChart.destroy();
    exerciseChart = new Chart(ctx, {
      type: 'line',
      data: { datasets: [{ label: exerciseName, data: chartData, borderColor: '#3b82f6', backgroundColor: 'rgba(59,130,246,0.45)', tension: 0.3, fill: true }] },
      options: { responsive: false, plugins: { legend: { display: false } }, scales: { x: { type: "time", time: { unit: "week", tooltipFormat: "yyyy-MM-dd" }, ticks: { color: '#fff' }, grid: { color: "rgba(255,255,255,0.8)" } }, y: { ticks: { color: '#fff' }, grid: { color: "rgba(255,255,255,0.8)" } } } }
    });
  } catch (err) {
    clearExerciseChart();
    msg.textContent = "Fel vid hämtning av data.";
    msg.style.display = "block";
  }
}

function clearExerciseChart() {
  if (exerciseChart) exerciseChart.destroy();
  exerciseChart = null;
  const msg = document.getElementById("exerciseChartMessage");
  if (msg) msg.style.display = "none";
}

// ---------------- Muscle Exercise Graph ----------------
async function loadExerciseHistory(muscle, exercise) {
  const containerId = `exerciseHistory-${exercise.replace(/\s/g,"")}`;
  let container = document.getElementById(containerId);
  if (!container) {
    container = document.createElement("div");
    container.id = containerId;
    container.className = "exercise-history";
    document.getElementById("muskel").appendChild(container);
  }
  container.innerHTML = `<h4>${exercise} (${muscle})</h4><p>Laddar...</p>`;

  try {
    const res = await fetch(API_URL);
    const data = await res.json();
    const rows = data.slice(1)
      .filter(r => r[0] === exercise && r[3] === muscle)
      .sort((a,b) => new Date(b[6]) - new Date(a[6]));

    if (rows.length === 0) {
      container.innerHTML = "<p class='empty-message'>Ingen träning loggad ännu.</p>";
      return;
    }

    let tableHTML = `<table><thead><tr><th>Datum</th><th>Vikt</th><th>Reps</th></tr></thead><tbody>`;
    rows.forEach(r => { tableHTML += `<tr><td>${r[6].substring(0,10)}</td><td>${r[1]}</td><td>${r[2]}</td></tr>` });
    tableHTML += "</tbody></table>";
    container.innerHTML = `<h4>${exercise} (${muscle})</h4>` + tableHTML;

    // Chart.js graf
    const canvasId = `chart-${exercise.replace(/\s/g,"")}`;
    let canvas = document.getElementById(canvasId);
    if (!canvas) {
      canvas = document.createElement("canvas");
      canvas.id = canvasId;
      container.appendChild(canvas);
    }
    const ctx = canvas.getContext("2d");
    if (muscleExerciseChart) muscleExerciseChart.destroy();
    const labels = rows.map(r => r[6].substring(0,10));
    const values = rows.map(r => parseFloat(r[1]));

    muscleExerciseChart = new Chart(ctx, {
      type: 'line',
      data: { labels, datasets: [{ label: exercise, data: values, borderColor: '#f6ea3b', backgroundColor: 'rgba(246,234,59,0.25)', tension: 0.3 }] },
      options: { responsive: true, plugins: { legend: { labels: { color: '#fff' } } }, scales: { x: { ticks: { color: '#fff' } }, y: { ticks: { color: '#fff' } } } }
    });

  } catch(err) {
    container.innerHTML = `<p class='empty-message'>Fel vid hämtning av historik: ${err}</p>`;
  }
}

// ================== Rest of your functions like loadLatestWeight(), loadMuscleGroups(), loadPassMenu(), loadData() remain unchanged ==================

// ---------------- Load Latest Weight ----------------
async function loadLatestWeight() {
  const weightDisplay = document.getElementById("latestWeight");
  const historyContainer = document.getElementById("weightHistory");
  const ctx = document.getElementById("weightChart").getContext("2d");

  try {
    const res = await fetch(API_URL);
    const data = await res.json();
    if (!data || data.length <= 1) {
      weightDisplay.innerText = "Ingen kroppsvikt loggad ännu.";
      historyContainer.innerHTML = "";
      return;
    }

    const weights = data.slice(1).filter(r => r[0].trim().toLowerCase() === "kroppsvikt");
    if (weights.length === 0) {
      weightDisplay.innerText = "Ingen kroppsvikt loggad ännu.";
      historyContainer.innerHTML = "";
      return;
    }

    const latest = weights[weights.length - 1];
    weightDisplay.innerText = `Senaste kroppsvikt: ${latest[1]} kg (${latest[6].substring(0,10)})`;

    let tableHTML = `<table><thead><tr><th>Datum</th><th>Vikt (kg)</th></tr></thead><tbody>`;
    weights.forEach(r => tableHTML += `<tr><td>${r[6].substring(0,10)}</td><td>${r[1]}</td></tr>`);
    tableHTML += "</tbody></table>";
    historyContainer.innerHTML = tableHTML;

    // Graf-data
    const chartData = weights.map(r => ({ x: r[6].substring(0,10), y: parseFloat(r[1]) }));
    const minDate = weights[0][6].substring(0,10);
    const maxDate = weights[weights.length-1][6].substring(0,10);

    const yValues = chartData.map(d => d.y);
    const yMin = Math.min(...yValues) - 5;
    const yMax = Math.max(...yValues) + 5;

    if (weightChart) weightChart.destroy();
    weightChart = new Chart(ctx, {
      type: 'line',
      data: { datasets: [{ label: 'Kroppsvikt', data: chartData, borderColor: '#3b82f6', backgroundColor: 'rgba(59,130,246,0.45)', tension: 0.3, fill: true }] },
      options: {
        responsive: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { type: 'time', time: { unit: 'week', tooltipFormat: 'yyyy-MM-dd' }, min: minDate, max: maxDate, ticks: { color: '#fff' }, grid: { color: "rgba(255,255,255,0.8)" } },
          y: { min: yMin, max: yMax, ticks: { color: '#fff' }, grid: { color: "rgba(255,255,255,0.8)" } }
        }
      }
    });

  } catch (err) {
    weightDisplay.innerText = `Fel vid hämtning av kroppsvikt: ${err}`;
    historyContainer.innerHTML = "";
  }
}

// ---------------- Load Muscle Groups ----------------
async function loadMuscleGroups() {
  const container = document.getElementById("muskel");
  if (!container) return;
  container.innerHTML = "<h2>Muskelgrupper</h2>";

  try {
    const res = await fetch(API_URL);
    const data = await res.json();
    if (!data || data.length <= 1) {
      container.innerHTML += "<p class='empty-message'>Ingen data ännu.</p>";
      return;
    }

    const muscles = {};
    data.slice(1).forEach(r => {
      const primary = r[3].trim();
      const exercise = r[0].trim();
      if (!muscles[primary]) muscles[primary] = [];
      if (!muscles[primary].includes(exercise)) muscles[primary].push(exercise);
    });

    const ul = document.createElement("ul");
    for (const [muscle, exercises] of Object.entries(muscles)) {
      const li = document.createElement("li");
      li.className = "muscle-card";
      li.innerHTML = `<span class="muscle-title">${muscle}</span><span class="arrow">&#9662;</span>`;
      const exUl = document.createElement("ul");
      exUl.className = "exercises";

      exercises.forEach(ex => {
        const exLi = document.createElement("li");
        exLi.textContent = ex;
        exLi.onclick = ev => { ev.stopPropagation(); loadExerciseHistory(muscle, ex); };
        exUl.appendChild(exLi);
      });

      li.appendChild(exUl);
      li.onclick = () => { li.classList.toggle("open"); toggleExercises(li); };
      ul.appendChild(li);
    }
    container.appendChild(ul);

  } catch (err) {
    container.innerHTML += `<p class='empty-message'>Fel vid hämtning av historik: ${err}</p>`;
  }
}

// ---------------- Load Main Table ----------------
async function loadData() {
  const container = document.getElementById("tableContainer");
  try {
    const res = await fetch(API_URL);
    const data = await res.json();
    if (!data || data.length <= 1) {
      container.innerHTML = `<p class="empty-message">Inga träningsposter ännu.</p>`;
      return;
    }

    const rows = data.slice(1).sort((a,b) => new Date(b[6]) - new Date(a[6]));
    let tableHTML = `<table><thead><tr><th>Övning</th><th>Vikt (kg)</th><th>Reps</th><th>Primär muskelgrupp</th><th>Sekundär muskelgrupp</th><th>Insats</th><th>Datum</th></tr></thead><tbody>`;
    rows.forEach(row => tableHTML += `<tr><td>${row[0]}</td><td>${row[1]}</td><td>${row[2]}</td><td>${row[3]}</td><td>${row[4]}</td><td>${row[5]}</td><td>${row[6]}</td></tr>`);
    tableHTML += "</tbody></table>";
    container.innerHTML = tableHTML;
  } catch (err) {
    container.innerHTML = `<p class="empty-message">Fel vid hämtning av data: ${err}</p>`;
  }
}

// ---------------- Log Exercise ----------------
async function logExercise(name, muscle, weight=10, reps=10, effort="Rätt") {
  const today = new Date().toISOString().split("T")[0];
  const formData = new FormData();
  formData.append("exercise", name);
  formData.append("weight", weight);
  formData.append("reps", reps);
  formData.append("primary", muscle);
  formData.append("secondary", "");
  formData.append("effort", effort);
  formData.append("date", today);

  try {
    const response = await fetch(API_URL, { method: "POST", body: formData });
    const result = await response.json();
    if (result.status === "success") {
      loadData();
      loadMuscleGroups();
      loadExerciseChart(name); // Auto-uppdatera graf
    } else alert("Kunde inte spara snabb-loggningen.");
  } catch (err) {
    alert("Fel vid snabb-loggning: " + err);
  }
}

// ---------------- Load Pass Menu ----------------
async function loadPassMenu() {
  const container = document.getElementById("passList");
  if (!container) return;
  container.innerHTML = "";

  const passes = [
    { name: "Pass 1, Bröst Triceps Mage", muscles: ["Bröst", "Triceps", "Mage"] },
    { name: "Pass 2, Rygg Biceps Vader", muscles: ["Rygg Lats", "Rygg Mitt", "Ländrygg", "Biceps", "Vader"] },
    { name: "Pass 3, Axlar Ben Underarmar", muscles: ["Axlar", "Ben", "Underarmar"] }
  ];

  let allData = [];
  try { allData = await (await fetch(API_URL)).json(); } 
  catch (err) { container.innerHTML = `<p class="empty-message">Fel vid hämtning av träningsdata.</p>`; return; }
  if (!allData || allData.length <= 1) { container.innerHTML = `<p class="empty-message">Ingen träningsdata hittades.</p>`; return; }

  passes.forEach(pass => {
    const card = document.createElement("div");
    card.className = "pass-card";

    const header = document.createElement("div");
    header.className = "pass-header";
    header.innerHTML = `<span>${pass.name}</span><span class="arrow">▼</span>`;
    card.appendChild(header);

    const exList = document.createElement("ul");
    exList.className = "pass-exercises";
    exList.style.height = "0"; exList.style.opacity = "0"; exList.style.overflow = "hidden";
    exList.style.transition = "height 0.3s ease, opacity 0.3s ease";

    let exercises = [];
    pass.muscles.forEach(muscle => {
      const muscleExercises = allData.slice(1)
        .filter(r => r[3].trim().toLowerCase() === muscle.trim().toLowerCase())
        .map(r => ({ name: r[0].trim(), muscle: muscle, latestDate: r[6]?.substring(0,10), latestWeight: r[1] || null }));
      exercises = exercises.concat(muscleExercises);
    });

    const uniqueExercisesMap = {};
    exercises.forEach(ex => {
      if (!uniqueExercisesMap[ex.name] || (ex.latestDate && new Date(ex.latestDate) > new Date(uniqueExercisesMap[ex.name].latestDate))) {
        uniqueExercisesMap[ex.name] = ex;
      }
    });
    const uniqueExercises = Object.values(uniqueExercisesMap).sort((a,b) => (b.latestDate ? new Date(b.latestDate) : 0) - (a.latestDate ? new Date(a.latestDate) : 0));

    uniqueExercises.forEach(ex => {
      const li = document.createElement("li"); li.style.cursor = "pointer";
      const spanName = document.createElement("span");
      spanName.textContent = ex.latestWeight ? `${ex.name} (${ex.latestWeight} kg) (${ex.latestDate})` : ex.name;
      li.appendChild(spanName);

      const plusBtn = document.createElement("button");
      plusBtn.textContent = "+"; plusBtn.className = "quick-log-btn";
      plusBtn.onclick = e => { e.stopPropagation(); logExercise(ex.name, ex.muscle); };
      li.appendChild(plusBtn);

      li.onclick = ev => { ev.stopPropagation(); prefillExercise(ex); };
      exList.appendChild(li);
    });

    card.appendChild(exList);
    header.addEventListener("click", () => {
      document.querySelectorAll(".pass-card").forEach(other => {
        if (other!==card) { other.classList.remove("open"); const ol = other.querySelector(".pass-exercises"); ol.style.height="0"; ol.style.opacity="0"; other.querySelector(".arrow").style.transform="rotate(0deg)"; }
      });
      const isOpen = card.classList.toggle("open");
      if (isOpen) { exList.style.height=exList.scrollHeight+"px"; exList.style.opacity="1"; header.querySelector(".arrow").style.transform="rotate(180deg)"; }
      else { exList.style.height="0"; exList.style.opacity="0"; header.querySelector(".arrow").style.transform="rotate(0deg)"; }
    });

    container.appendChild(card);
  });
}

