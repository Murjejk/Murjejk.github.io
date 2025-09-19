// ================================
// main.js – med cache för träningdata
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
const API_URL = "https://script.google.com/macros/s/AKfycbxn7t97f8VWskY7QgdpiTk_ga1jPZ2WyWsJARKv3_7tt9d9zt2-RnyX272PSb4F3WlQ/exec";

// ---------------- Globals ----------------
let exerciseChart;        // graf i Lägg till träning
let muscleExerciseChart;  // graf i muskelgrupper
let weightChart;          // kroppsviktgraf
let restTimerAnimation;
window.allTrainingData = []; // cache för alla träningsrader
// ---- chart hantering ----
let exerciseChartInstance = null;

function clearExerciseChart() {
    if (exerciseChartInstance) {
        exerciseChartInstance.destroy();  // stäng ner gamla grafen
        exerciseChartInstance = null;
    }
}

// ---------------- Data Fetch & Cache ----------------
async function fetchAllData() {
  try {
    const res = await fetch(API_URL);
    const data = await res.json();
    if (!data || data.length <= 1) {
      window.allTrainingData = [];
      return [];
    }
    window.allTrainingData = data.slice(1); // hoppa över rubrikraden
    return window.allTrainingData;
  } catch (err) {
    console.error("Fel vid hämtning av data:", err);
    window.allTrainingData = [];
    return [];
  }
}

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
  loadExerciseChart(ex.name); // rita graf lokalt
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

  // Debounced graf för inputfält
  const exerciseInput = document.getElementById("exercise");
  if (exerciseInput) {
    let timeout;
    exerciseInput.addEventListener("input", () => {
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        const name = exerciseInput.value.trim();
        if (name.length > 1) {
          loadExerciseChart(name);
        } else {
          clearExerciseChart();
          loadData(); // Återställ den fullständiga listan
        }
      }, 400);
    });
  }

  // LOGIN / LOGOUT
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
        .then(async () => {
          loginSection.style.display = "none";
          contentSection.style.display = "block";
          await fetchAllData(); // cache data direkt vid login
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
  onAuthStateChanged(auth, async user => {
    if (user) {
      loginSection.style.display = "none";
      contentSection.style.display = "block";
      document.querySelectorAll("main section").forEach(sec => sec.classList.remove("active"));
      if (welcomeSection) welcomeSection.classList.add("active");
      await fetchAllData(); // cache all data när man redan är inloggad
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

  document.getElementById("logForm").addEventListener("submit", async e => {
  e.preventDefault();
  const today = new Date().toISOString().split("T")[0];

  const exerciseName = document.getElementById("exercise").value.trim();
  const weight = document.getElementById("weight").value.trim() || "0";
  const reps = document.getElementById("reps").value.trim() || "10";
  const primary = document.getElementById("primary").value.trim() || "Okänd";
  const secondary = document.getElementById("secondary").value.trim() || "Okänd";
  const effort = document.getElementById("effort").value.trim() || "Rätt";

  const params = new URLSearchParams({
    action: "addRow",
    exercise: exerciseName,
    weight,
    reps,
    primary,
    secondary,
    effort,
    date: today
  });

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: params
    });

    const result = await response.json();
    if (result.status === "success") {
      document.getElementById("logForm").reset();
      await fetchAllData(); // uppdatera cache
      loadData();
      loadMuscleGroups();
      if (exerciseName) loadExerciseChart(exerciseName);
    } else {
      alert("Kunde inte spara träningsposten.");
    }
  } catch (err) {
    alert("Fel vid anslutning till Google Sheets: " + err);
  }
});

}); // <-- stänger DOMContentLoaded

async function loadExerciseChart(exerciseName) {
  const ctx = document.getElementById("exerciseChartExercise").getContext("2d");
  const msg = document.getElementById("exerciseChartMessageExercise");

  const data = window.allTrainingData || [];

  if (!data.length || !exerciseName) {
    clearExerciseChart();
    msg.style.display = "block";
    msg.textContent = "Ingen data tillgänglig.";
    return;
  }

 const rows = data.filter(r => r[0].trim().toLowerCase().includes(exerciseName.trim().toLowerCase()));

  if (!rows.length) {
    clearExerciseChart();
    msg.style.display = "block";
    msg.textContent = "Ingen data hittades.";
    return;
  }

  // Sortera och skapa chart-data
  rows.sort((a, b) => new Date(a[6]) - new Date(b[6]));
  const chartData = rows.map(r => ({ x: r[6].substring(0,10), y: parseFloat(r[1]) }));

  // Beräkna y-axel marginaler
  const yValues = chartData.map(d => d.y);
  let yMin = Math.min(...yValues);
  let yMax = Math.max(...yValues);

  // Om alla värden är samma, ge lite intervall
  if (yMin === yMax) {
    yMin = yMin - 1;
    yMax = yMax + 1;
  } else {
    // Marginaler: 5% under, 20% över
    const marginBottom = (yMax - yMin) * 0.2;
    const marginTop = (yMax - yMin) * 0.4;
    yMin = yMin - marginBottom;
    yMax = yMax + marginTop;
  }
  
  // Gradient
  const gradient = ctx.createLinearGradient(0, 0, 0, 320);
  gradient.addColorStop(0, 'rgba(74, 222, 128, 0.6)');
  gradient.addColorStop(1, 'rgba(74, 222, 128, 0)');

  // Rensa tidigare graf
  clearExerciseChart();

  // Skapa ny graf med rätt global variabel
  exerciseChartInstance = new Chart(ctx, {
    type: 'line',
    data: {
      datasets: [{
        label: exerciseName,
        data: chartData,
        borderColor: '#4ade80',
        backgroundColor: gradient,
        pointBackgroundColor:'#fff',
        pointBorderColor:'#4ade80',
        pointRadius:4,
        pointHoverRadius:6,
        borderWidth:2,
        tension:0.4,
        fill:true
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: { duration: 800, easing: "easeOutQuart" },
      plugins: {
        legend: { display: false },
        tooltip: { backgroundColor: "rgba(0,0,0,0.8)", titleColor:"#fff", bodyColor:"#fff", padding:10, displayColors:false }
      },
      scales: {
       x: { type:"time", time:{ unit:"week", tooltipFormat:"yyyy-MM-dd" }, ticks:{ color:'#fff', font:{ size:12 } }, grid:{ color:"rgba(255,255,255,0.15)" } },
        y: {
        min: yMin,
        max: yMax,
        ticks: { color:'#fff', font:{ size:12 } },
        grid: { color:"rgba(255,255,255,0.15)" }
      }
      }
    }
  });

  msg.style.display = "none";

  // --- SKAPA OCH VISA HISTORIK-TABELL ---
  const tableContainer = document.getElementById("tableContainer");
  if (!tableContainer) return;

  // Sortera för tabellen (senaste först)
  const sortedForTable = [...rows].sort((a, b) => new Date(b[6]) - new Date(a[6]));

  let tableHTML = `<table><thead><tr><th>Övning</th><th>Vikt</th><th>Reps</th><th>Primär</th><th>Sekundär</th><th>Insats</th><th>Datum</th></tr></thead><tbody>`;
  sortedForTable.forEach(r => {
      tableHTML += `<tr><td>${r[0]}</td><td>${r[1]}</td><td>${r[2]}</td><td>${r[3]}</td><td>${r[4]}</td><td>${r[5]}</td><td>${r[6].substring(0,10)}</td></tr>`;
  });
    
  tableHTML += "</tbody></table>";
  tableContainer.innerHTML = tableHTML;

} // <-- stänger loadExerciseChart



// ---------------- Resten: loadExerciseHistory, loadLatestWeight, loadMuscleGroups, loadData, logExercise, loadPassMenu ----------------
// (de ändras bara så att de använder window.allTrainingData istället för att göra nya fetch-anrop!)

// ---------------- Load Latest Weight ----------------
function loadLatestWeight() {
  const rows = window.allTrainingData.filter(r => r[0].toLowerCase() === "kroppsvikt");
  const weightDisplay = document.getElementById("latestWeight");
  const historyContainer = document.getElementById("weightHistory");
  if (rows.length === 0) {
    weightDisplay.innerText = "Ingen kroppsvikt loggad ännu.";
    historyContainer.innerHTML = "";
    return;
  }

  rows.sort((a,b) => new Date(a[6]) - new Date(b[6]));
  const latest = rows[rows.length-1];
  weightDisplay.innerText = `Senaste kroppsvikt: ${latest[1]} kg (${latest[6].substring(0,10)})`;

  // Tabell
  let tableHTML = `<table><thead><tr><th>Datum</th><th>Vikt (kg)</th></tr></thead><tbody>`;
  rows.forEach(r => {
    tableHTML += `<tr><td>${r[6].substring(0,10)}</td><td>${r[1]}</td></tr>`;
  });
  tableHTML += "</tbody></table>";
  historyContainer.innerHTML = tableHTML;

  const ctx = document.getElementById("weightHistoryChart").getContext("2d");
  const msg = document.getElementById("weightChartMessage");

  if (rows.length === 0) {
    if (weightChart) weightChart.destroy();
    msg.style.display = "block";
    msg.textContent = "Ingen viktdata att visa.";
    return;
  }

  const chartData = rows.map(r => ({ x: r[6].substring(0,10), y: parseFloat(r[1]) }));

  const yValues = chartData.map(d => d.y);
  let yMin = Math.min(...yValues);
  let yMax = Math.max(...yValues);

  if (yMin === yMax) {
    yMin = yMin - 1;
    yMax = yMax + 1;
  } else {
    const marginBottom = (yMax - yMin) * 0.2;
    const marginTop = (yMax - yMin) * 0.4;
    yMin = yMin - marginBottom;
    yMax = yMax + marginTop;
  }

  const gradient = ctx.createLinearGradient(0, 0, 0, 320);
  gradient.addColorStop(0, 'rgba(74, 222, 128, 0.6)');
  gradient.addColorStop(1, 'rgba(74, 222, 128, 0)');

  if (weightChart) weightChart.destroy();

  weightChart = new Chart(ctx, {
    type: 'line',
    data: {
      datasets: [{
        label: "Kroppsvikt",
        data: chartData,
        borderColor: '#4ade80',
        backgroundColor: gradient,
        pointBackgroundColor:'#fff',
        pointBorderColor:'#4ade80',
        pointRadius:4,
        pointHoverRadius:6,
        borderWidth:2,
        tension:0.4,
        fill:true
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: { duration: 800, easing: "easeOutQuart" },
      plugins: {
        legend: { display: false },
        tooltip: { backgroundColor: "rgba(0,0,0,0.8)", titleColor:"#fff", bodyColor:"#fff", padding:10, displayColors:false }
      },
      scales: {
       x: { type:"time", time:{ unit:"week", tooltipFormat:"yyyy-MM-dd" }, ticks:{ color:'#fff', font:{ size:12 } }, grid:{ color:"rgba(255,255,255,0.15)" } },
        y: {
        min: yMin,
        max: yMax,
        ticks: { color:'#fff', font:{ size:12 } },
        grid: { color:"rgba(255,255,255,0.15)" }
      }
      }
    }
  });

  msg.style.display = "none";
}

// ---------------- Load Muscle Groups ----------------
async function loadMuscleGroups() {
  const container = document.getElementById("muskel");
  if (!container) return;
  container.innerHTML = "<h2>Muskelgrupper</h2>";

  const data = window.allTrainingData;
  if (!data || data.length === 0) {
    container.innerHTML += "<p class='empty-message'>Ingen data ännu.</p>";
    return;
  }

  const muscles = {};
  data.forEach(r => {
    const primary = r[3].trim();
    const exercise = r[0].trim();
    if (!muscles[primary]) muscles[primary] = new Map();
    const exerciseData = {
      name: exercise,
      muscle: primary,
      latestDate: r[6]?.substring(0, 10),
      latestWeight: r[1] || null
    };

    if (!muscles[primary].has(exercise) || new Date(exerciseData.latestDate) > new Date(muscles[primary].get(exercise).latestDate)) {
      muscles[primary].set(exercise, exerciseData);
    }
  });

  const ul = document.createElement("ul");
  for (const [muscle, exercisesMap] of Object.entries(muscles)) {
    const li = document.createElement("li");
    li.className = "muscle-card";
    li.innerHTML = `<span class="muscle-title">${muscle}</span><span class="arrow">&#9662;</span>`;

    const exUl = document.createElement("ul");
    exUl.className = "exercises";

    const exercises = Array.from(exercisesMap.values());
    exercises.sort((a,b) => (b.latestDate ? new Date(b.latestDate) : 0) - (a.latestDate ? new Date(a.latestDate) : 0));

    exercises.forEach(ex => {
      const exLi = document.createElement("li");
      exLi.textContent = ex.name;
      exLi.onclick = ev => { 
        ev.stopPropagation();
        prefillExercise(ex);
      };
      exUl.appendChild(exLi);
    });

    li.appendChild(exUl);
    li.onclick = () => { 
      li.classList.toggle("open"); 
      toggleExercises(li); 
    };
    ul.appendChild(li);
  }
  container.appendChild(ul);
}

// ---------------- Load Main Table ----------------
function loadData() {
  const container = document.getElementById("tableContainer");
  if (!container) return;
  if (window.allTrainingData.length === 0) {
    container.innerHTML = "<p class='empty-message'>Ingen träningsdata</p>";
    return;
  }
  const rows = window.allTrainingData;
  const table = document.createElement("table");
  const thead = document.createElement("thead");
  thead.innerHTML = "<tr><th>Övning</th><th>Vikt</th><th>Reps</th><th>Muskel</th><th>Datum</th></tr>";
  table.appendChild(thead);
  const tbody = document.createElement("tbody");
  rows.forEach(r => {
    const tr = document.createElement("tr");
    tr.innerHTML = `<td>${r[0]}</td><td>${r[1]}</td><td>${r[2]}</td><td>${r[3]}</td><td>${r[6]}</td>`;
    tbody.appendChild(tr);
  });
  table.appendChild(tbody);
  container.innerHTML = "";
  container.appendChild(table);
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
    { name: "Pass, Bröst Triceps Mage", muscles: ["Bröst", "Triceps", "Mage"] },
    { name: "Pass, Rygg Biceps Vader", muscles: ["Rygg Lats", "Rygg Mitt", "Ländrygg", "Biceps", "Vader"] },
    { name: "Pass, Axlar Ben Underarmar", muscles: ["Axlar", "Ben", "Underarmar"] }
  ];

  const allData = window.allTrainingData;
  if (!allData || allData.length === 0) {
    container.innerHTML = `<p class="empty-message">Ingen träningsdata hittades.</p>`;
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

    let exercises = [];
    pass.muscles.forEach(muscle => {
      const muscleExercises = allData
        .filter(r => r[3].trim().toLowerCase() === muscle.trim().toLowerCase())
        .map(r => ({
          name: r[0].trim(),
          muscle: muscle,
          latestDate: r[6]?.substring(0,10),
          latestWeight: r[1] || null
        }));
      exercises = exercises.concat(muscleExercises);
    });

    // Se till att bara senaste unika övningar visas
    const uniqueExercisesMap = {};
    exercises.forEach(ex => {
      if (
        !uniqueExercisesMap[ex.name] || 
        (ex.latestDate && new Date(ex.latestDate) > new Date(uniqueExercisesMap[ex.name].latestDate))
      ) {
        uniqueExercisesMap[ex.name] = ex;
      }
    });
    const uniqueExercises = Object.values(uniqueExercisesMap)
      .sort((a,b) => (b.latestDate ? new Date(b.latestDate) : 0) - (a.latestDate ? new Date(a.latestDate) : 0));

    uniqueExercises.forEach(ex => {
      const li = document.createElement("li"); 
      li.style.cursor = "pointer";

      const spanName = document.createElement("span");
      spanName.textContent = ex.latestWeight 
        ? `${ex.name} (${ex.latestWeight} kg) (${ex.latestDate})` 
        : ex.name;
      li.appendChild(spanName);

      const plusBtn = document.createElement("button");
      plusBtn.textContent = "+";
      plusBtn.className = "quick-log-btn";
      plusBtn.onclick = e => { 
        e.stopPropagation(); 
        logExercise(ex.name, ex.muscle); 
      };
      li.appendChild(plusBtn);

      li.onclick = ev => { 
        ev.stopPropagation(); 
        prefillExercise(ex); 
      };
      exList.appendChild(li);
    });

    card.appendChild(exList);

    header.addEventListener("click", () => {
      document.querySelectorAll(".pass-card").forEach(other => {
        if (other !== card) {
          other.classList.remove("open"); 
          const ol = other.querySelector(".pass-exercises"); 
          ol.style.height = "0"; 
          ol.style.opacity = "0"; 
          other.querySelector(".arrow").style.transform = "rotate(0deg)";
        }
      });
      const isOpen = card.classList.toggle("open");
      if (isOpen) { 
        exList.style.height = exList.scrollHeight+"px"; 
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
