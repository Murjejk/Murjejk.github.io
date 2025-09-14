// TOPPEN AV main.js: Importera Firebase Modular SDK-funktioner
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js";

// Firebase-konfiguration
const firebaseConfig = {
  apiKey: "AIzaSyCvrXL_n-YNgtxwXegG0BzkHu9_CJUPiDU",
  authDomain: "training-d1d9d.firebaseapp.com",
  projectId: "training-d1d9d",
  storageBucket: "training-d1d9d.firebasestorage.app",
  messagingSenderId: "813923749374",
  appId: "1:813923749374:web:7e301c4970d77893f7c4af",
  measurementId: "G-KPV09FMJB7"
};

// Initiera Firebase-app
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

const API_URL = "https://script.google.com/macros/s/AKfycbwAbdw8V5QgEKYGt95VNKJEy0v-bWOl772Aos1HN_Tx3gpdq75WXWsQm6YR4IXB8YGe/exec";

// Globala funktioner
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

// ================================
// Fyll i övning med senaste värden
// ================================
window.prefillExercise = async function(exercise, muscle) {
  try {
    const res = await fetch(API_URL);
    const data = await res.json();

    // Filtrera poster för samma övning och muskel
    const rows = data.slice(1).filter(r => r[0] === exercise && r[3] === muscle);

    // Ta senaste posten
    const latest = rows.length ? rows[rows.length - 1] : null;

    document.getElementById("exercise").value = exercise;
    document.getElementById("primary").value = muscle;
    document.getElementById("reps").value = latest ? latest[2] : 10;
    document.getElementById("weight").value = latest ? latest[1] : "";
    document.getElementById("effort").value = latest ? latest[5] : "Rätt";

    showSection("ovningar", document.querySelector("nav button[onclick*='ovningar']"));
  } catch (err) {
    console.error("Fel vid hämtning av senaste data:", err);
    // fallback till standardvärden
    document.getElementById("exercise").value = exercise;
    document.getElementById("primary").value = muscle;
    document.getElementById("reps").value = 10;
    document.getElementById("weight").value = "";
    document.getElementById("effort").value = "Rätt";
    showSection("ovningar", document.querySelector("nav button[onclick*='ovningar']"));
  }
};


let restTimerAnimation;
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

// ==============================================================================
// DOMContentLoaded
// ==============================================================================

document.addEventListener("DOMContentLoaded", () => {
  // Visa välkomstmeddelande direkt när sidan är klar
  document.querySelectorAll("#content section").forEach(sec => sec.classList.remove("active"));
  const welcomeSection = document.getElementById("welcome");
  if (welcomeSection) welcomeSection.classList.add("active");

  // Elementreferenser
  const loginBtn = document.getElementById("loginBtn");
  const loginError = document.getElementById("loginError");
  const loginSection = document.getElementById("login");
  const contentSection = document.getElementById("content");
  const logoutBtn = document.getElementById("logoutBtn");

  // LOGIN
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

  // LOGOUT
  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      signOut(auth)
        .then(() => console.log("Användare utloggad."))
        .catch(error => {
          console.error("Fel vid utloggning:", error);
          alert("Ett fel uppstod vid utloggning: " + error.message);
        });
    });
  }

  // AUTH STATE
onAuthStateChanged(auth, user => {
  if (user) {
    // Visa innehållet och göm login
    loginSection.style.display = "none";
    contentSection.style.display = "block";

    // Rensa aktiva sektioner
    document.querySelectorAll("main section").forEach(sec => sec.classList.remove("active"));

    // Visa välkomstmeddelandet
    const welcomeSection = document.getElementById("welcome");
    if (welcomeSection) welcomeSection.classList.add("active");

    // Ladda in data och menyer
    loadPassMenu();
    loadData();
    loadLatestWeight();
    loadMuscleGroups();
  } else {
    // Ingen användare → visa login, dölj innehållet
    loginSection.style.display = "block";
    contentSection.style.display = "none";

    // Rensa aktiva sektioner
    document.querySelectorAll("main section").forEach(sec => sec.classList.remove("active"));
  }
});

  // LÄGG TILL TRÄNINGSLOGG
  document.getElementById("logForm").addEventListener("submit", async e => {
    e.preventDefault();
    const today = new Date().toISOString().split("T")[0].replace(/-/g, "/");
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
      } else alert("Kunde inte spara träningsposten.");
    } catch (err) {
      alert("Fel vid anslutning till Google Sheets: " + err);
    }
  });

  // KROPPSVIKT - NY VIKT
  document.getElementById("weightForm").addEventListener("submit", async e => {
    e.preventDefault();
    const newWeight = document.getElementById("newWeight").value;
    if (!newWeight) return alert("Ange en vikt!");

    const today = new Date().toISOString().split("T")[0].replace(/-/g, "/");
    const params = new URLSearchParams();
    params.append("exercise", "Kroppsvikt");
    params.append("weight", newWeight);
    params.append("reps", 1);
    params.append("primary", "Allmänt");
    params.append("secondary", "");
    params.append("effort", "Rätt");
    params.append("date", today);

    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: params.toString()
      });
      const result = await response.json();
      if (result.status === "success") {
        document.getElementById("weightForm").reset();
        loadLatestWeight();
        loadMuscleGroups();
      } else alert("Kunde inte spara kroppsvikten.");
    } catch (err) {
      alert("Fel vid anslutning till Google Sheets: " + err);
    }
  });

  // HÄMTA DATA
async function loadData() {
  const container = document.getElementById("tableContainer");
  try {
    const res = await fetch(API_URL);
    const data = await res.json();
    if (!data || data.length <= 1) {
      container.innerHTML = `<p class="empty-message">Inga träningsposter ännu.</p>`;
      return;
    }

    // Sortera på datum (även om datum innehåller tid)
    const rows = data.slice(1).sort((a, b) => new Date(a[6]) - new Date(b[6]));

    let tableHTML = `<table><thead><tr>
      <th>Exercise</th><th>Weight (kg)</th><th>Reps</th><th>Primär muskelgrupp</th><th>Sekundär muskelgrupp</th><th>Insats</th><th>Date</th>
    </tr></thead><tbody>`;

    rows.forEach(row => {
      tableHTML += `<tr>
        <td>${row[0]}</td>
        <td>${row[1]}</td>
        <td>${row[2]}</td>
        <td>${row[3]}</td>
        <td>${row[4]}</td>
        <td>${row[5]}</td>
        <td>${row[6].substring(0,10)}</td>
      </tr>`;
    });

    tableHTML += `</tbody></table>`;
    container.innerHTML = tableHTML;
  } catch (err) {
    container.innerHTML = `<p class="empty-message">Fel vid hämtning av data: ${err}</p>`;
  }
}

// KROPPSVIKT - SENASTE
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

    let weights = data.slice(1).filter(r => r[0] && r[0].trim().toLowerCase() === "kroppsvikt");
    if (weights.length === 0) {
      weightDisplay.innerText = "Ingen kroppsvikt loggad ännu.";
      historyContainer.innerHTML = "";
      return;
    }

    const latest = weights[weights.length - 1];
    weightDisplay.innerText = `Senaste kroppsvikt: ${latest[1]} kg (${latest[6].substring(0,10)})`;

    let tableHTML = `<table><thead><tr><th>Datum</th><th>Vikt (kg)</th></tr></thead><tbody>`;
    weights.forEach(r => tableHTML += `<tr><td>${r[6].substring(0,10)}</td><td>${r[1]}</td></tr>`);
    tableHTML += `</tbody></table>`;
    historyContainer.innerHTML = tableHTML;

    // === Här fixar vi data för tidsaxeln ===
    const labels = weights.map(r => r[6].substring(0,10));
    const values = weights.map(r => parseFloat(r[1]));
    const chartData = labels.map((d, i) => ({ x: d, y: values[i] }));

    // === Här sätter vi fasta datumgränser ===
    const minDate = "2025-09-01";
    const maxDate = "2026-01-01";

    // === Nytt: Dynamisk y-axel baserat på första värdet ===
    const baseValue = values[0];
    const yMin = baseValue - 10;
    const yMax = baseValue + 30;
    
    if (window.weightChart && typeof window.weightChart.destroy === 'function') window.weightChart.destroy();
    window.weightChart = new Chart(ctx, {
      type: 'line',
      data: {
        datasets: [{
          label: 'Kroppsvikt (kg)',
          data: chartData,
          borderColor: '#3b82f6',
          backgroundColor: 'rgba(59, 130, 246, 0.45)',
          pointBackgroundColor: '#fff',
          pointBorderColor: '#3b82f6',
          pointRadius: 3,
          pointHoverRadius: 5,
          borderWidth: 2,
          tension: 0.3,
          fill: true
        }]
      },
      options: {
        responsive: false,
        plugins: {
          legend: {
            display: false
          }
        },
        scales: {
          x: {
            type: "time",
            time: {
              unit: "week",
              tooltipFormat: "yyyy-MM-dd"
            },
            min: minDate,
            max: maxDate,
            ticks: { color: '#fff', font: { size: 10, weight: "normal" } },
            grid: { color: "rgba(255,255,255,0.8)" }
          },
          y: {
            min: yMin,      // <-- botten
            max: yMax,      // <-- toppen
            ticks: { color: '#fff', font: { size: 10, weight: "normal" } },
            grid: { color: "rgba(255,255,255,0.8)" }
          }
        }
      }
    });

  } catch (err) {
    weightDisplay.innerText = `Fel vid hämtning av kroppsvikt: ${err}`;
    historyContainer.innerHTML = "";
  }
}


  // MUSKELGRUPPER
  async function loadMuscleGroups() {
    const container = document.getElementById("muskel");
    if (container) container.innerHTML = "<h2>Muskelgrupper</h2>";

    try {
      const res = await fetch(API_URL);
      const data = await res.json();
      if (!data || data.length <= 1) {
        if (container) container.innerHTML += "<p class='empty-message'>Ingen data ännu.</p>";
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
          exLi.onclick = (ev) => { ev.stopPropagation(); loadExerciseHistory(muscle, ex); };
          exUl.appendChild(exLi);
        });
        li.appendChild(exUl);
        li.onclick = () => { li.classList.toggle("open"); toggleExercises(li); };
        ul.appendChild(li);
      }
      if (container) container.appendChild(ul);

    } catch (err) {
      if (container) container.innerHTML += `<p class='empty-message'>Fel vid hämtning av historik: ${err}</p>`;
    }
  }

// HISTORIK PER ÖVNING
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
                     .sort((a, b) => new Date(a[6]) - new Date(b[6])); // sortera

    if (rows.length === 0) {
      container.innerHTML = "<p class='empty-message'>Ingen träning loggad ännu.</p>";
      return;
    }

    let tableHTML = `<table><thead><tr><th>Datum</th><th>Vikt</th><th>Reps</th></tr></thead><tbody>`;
    rows.forEach(r => {
      tableHTML += `<tr>
        <td>${r[6].substring(0,10)}</td>
        <td>${r[1]}</td>
        <td>${r[2]}</td>
      </tr>`;
    });
    tableHTML += `</tbody></table>`;
    container.innerHTML = `<h4>${exercise} (${muscle})</h4>` + tableHTML;

    const canvasId = `chart-${exercise.replace(/\s/g,"")}`;
    let canvas = document.getElementById(canvasId);
    if (!canvas) {
      canvas = document.createElement("canvas");
      canvas.id = canvasId;
      container.appendChild(canvas);
    }
    const ctx = canvas.getContext("2d");

    const labels = rows.map(r => r[6].substring(0,10));
    const values = rows.map(r => parseFloat(r[1]));

    if (window.exerciseChart) window.exerciseChart.destroy();
    window.exerciseChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: [{
          label: exercise,
          data: values,
          borderColor: '#f6ea3b',
          backgroundColor: 'rgba(246, 234, 59, 0.25)',
          pointBackgroundColor: '#fff',
          pointBorderColor: '#f6ea3b',
          pointRadius: 3,
          pointHoverRadius: 5,
          borderWidth: 2,
          tension: 0.3
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: { labels: { color: '#fff' } }
        },
        scales: {
          x: {
            type: 'time',
            time: { unit: 'week' },
            min: '2025-09-01',
            max: '2026-01-01',
            ticks: { color: '#fff', font: { size: 8, weight: "normal" } },
            grid: { color: "rgba(255,255,255,0.8)" }
          },
          y: {
            ticks: { color: '#fff', font: { size: 8, weight: "normal" } },
            grid: { color: "rgba(255,255,255,0.8)" }
          }
        }
      }
    });

  } catch(err) {
    container.innerHTML = `<p class='empty-message'>Fel vid hämtning av historik: ${err}</p>`;
  }
}

// ================================
// Ladda passmeny med visuell feedback
// ================================
async function loadPassMenu() {
  const container = document.getElementById("passList");
  if (!container) return;
  container.innerHTML = "";

  // Hårdkodade pass med muskelgrupper
  const passes = [
    { name: "Pass 1, Bröst Triceps Mage", muscles: ["Bröst", "Triceps", "Mage"] },
    { name: "Pass 2, Rygg Biceps Vader", muscles: ["Rygg Lats", "Rygg Mitt", "Ländrygg", "Biceps", "Vader"] },
    { name: "Pass 3, Axlar Ben Underarmar", muscles: ["Axlar", "Ben", "Underarmar"] }
  ];

  let allData = [];
  try {
    const res = await fetch(API_URL);
    allData = await res.json();
    if (!allData || allData.length <= 1) {
      container.innerHTML = `<p class="empty-message">Ingen träningsdata hittades.</p>`;
      return;
    }
  } catch (err) {
    console.error("Fel vid hämtning av träningsdata för passmenyn:", err);
    container.innerHTML = `<p class="empty-message">Fel vid hämtning av träningsdata.</p>`;
    return;
  }

  passes.forEach(pass => {
    const card = document.createElement("div");
    card.className = "pass-card";

    const header = document.createElement("div");
    header.className = "pass-header";
    header.innerHTML = `<span>${pass.name}</span><span class="arrow">▼</span>`;
    card.appendChild(header);

    const exList = document.createElement("ul");
    exList.className = "pass-exercises";
    exList.style.height = "0";
    exList.style.opacity = "0";
    exList.style.overflow = "hidden";
    exList.style.transition = "height 0.3s ease, opacity 0.3s ease";

    // Hämta övningar från Sheet som matchar muskelgrupper
    let exercises = [];
    pass.muscles.forEach(muscle => {
      const muscleExercises = allData.slice(1)
        .filter(r => r[3].trim() === muscle)
        .map(r => ({
          name: r[0].trim(),
          muscle: muscle,
          latestDate: r[6] ? r[6].substring(0,10) : null,
          latestWeight: r[1] || null
        }));
      exercises = exercises.concat(muscleExercises);
    });

    // Ta bort dubletter, behåll senaste loggen
    const uniqueExercisesMap = {};
    exercises.forEach(ex => {
      if (!uniqueExercisesMap[ex.name]) {
        uniqueExercisesMap[ex.name] = ex;
      } else {
        // Om flera loggar finns, behåll den med senaste datum
        if (ex.latestDate && (!uniqueExercisesMap[ex.name].latestDate || new Date(ex.latestDate) > new Date(uniqueExercisesMap[ex.name].latestDate))) {
          uniqueExercisesMap[ex.name] = ex;
        }
      }
    });

    let uniqueExercises = Object.values(uniqueExercisesMap);

    // Sortera: senaste datum först, övningar utan datum längst ner
    uniqueExercises.sort((a,b) => {
      if (!a.latestDate && !b.latestDate) return 0;
      if (!a.latestDate) return 1;
      if (!b.latestDate) return -1;
      return new Date(b.latestDate) - new Date(a.latestDate);
    });

    // Rendera övningar
    uniqueExercises.forEach(ex => {
      const li = document.createElement("li");
      li.textContent = ex.latestWeight ? `${ex.name} (${ex.latestWeight} kg) (${ex.latestDate})` : ex.name;
      li.onclick = () => prefillExercise(ex.name, ex.muscle);
      exList.appendChild(li);
    });

    card.appendChild(exList);

    // Expandera/kollapsa passkort
    header.addEventListener("click", () => {
      document.querySelectorAll(".pass-card").forEach(otherCard => {
        if (otherCard !== card) {
          otherCard.classList.remove("open");
          const otherList = otherCard.querySelector(".pass-exercises");
          otherList.style.height = "0";
          otherList.style.opacity = "0";
          otherCard.querySelector(".arrow").style.transform = "rotate(0deg)";
        }
      });

      const isOpen = card.classList.toggle("open");
      if (isOpen) {
        exList.style.height = exList.scrollHeight + "px";
        exList.style.opacity = "1";
        header.querySelector(".arrow").style.transform = "rotate(180deg)";
      } else {
        exList.style.height = "0";
        exList.style.opacity = "0";
        header.querySelector(".arrow").style.transform = "rotate(0deg)";
      }
    });

    container.appendChild(card);
  });
}

//===========================

// Hjälpfunktion för snabb-loggning
async function logExercise(name, muscle, weight=10, reps=10, effort="Rätt") {
  // Format: YYYY/MM/DD (text)
  const today = new Date().toISOString().split("T")[0].replace(/-/g, "/");

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
      loadData();         // Uppdatera träningshistorik
      loadMuscleGroups(); // Uppdatera muskelgrupper
    } else alert("Kunde inte spara snabb-loggningen.");
  } catch (err) {
    alert("Fel vid snabb-loggning: " + err);
  }
}
  
}); // Slut på DOMContentLoaded
