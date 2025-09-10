const API_URL = "https://script.google.com/macros/s/AKfycbwAbdw8V5QgEKYGt95VNKJEy0v-bWOl772Aos1HN_Tx3gpdq75WXWsQm6YR4IXB8YGe/exec";

// ==============================
// Navigering mellan sektioner
// ==============================
function showSection(id, btn) {
  document.querySelectorAll("main section").forEach(sec => sec.classList.remove("active"));
  document.getElementById(id).classList.add("active");

  document.querySelectorAll("nav button").forEach(b => b.classList.remove("active"));
  btn.classList.add("active");

  if (id === "kroppsvikt") loadLatestWeight();
}

// ==============================
// Toggle exercises in pass
// ==============================
function toggleExercises(el) {
  const exercises = el.querySelector(".exercises");
  exercises.style.display = exercises.style.display === "block" ? "none" : "block";
}

// ==============================
// Prefill form med exercise
// ==============================
function prefillExercise(exercise, muscle) {
  document.getElementById("exercise").value = exercise;
  document.getElementById("primary").value = muscle;
  document.getElementById("reps").value = 10;
  document.getElementById("weight").value = "";
  document.getElementById("effort").value = "Rätt";

  showSection("ovningar", document.querySelector("nav button[onclick*='ovningar']"));
}

// ==============================
// Lägg till träningslogg
// ==============================
document.getElementById("logForm").addEventListener("submit", async (e) => {
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
      loadMuscleGroups(); // uppdatera muskelgrupper också
    } else {
      alert("Kunde inte spara träningsposten.");
    }
  } catch (err) {
    alert("Fel vid anslutning till Google Sheets: " + err);
  }
});

// ==============================
// Hämta och visa träningshistorik
// ==============================
async function loadData() {
  const container = document.getElementById("tableContainer");
  try {
    const res = await fetch(API_URL);
    const data = await res.json();

    if (!data || data.length <= 1) {
      container.innerHTML = `<p class="empty-message">Inga träningsposter ännu.</p>`;
      return;
    }

    let tableHTML = `<table>
      <thead>
        <tr>
          <th>Exercise</th>
          <th>Weight (kg)</th>
          <th>Reps</th>
          <th>Primär muskelgrupp</th>
          <th>Sekundär muskelgrupp</th>
          <th>Insats</th>
          <th>Date</th>
        </tr>
      </thead>
      <tbody>`;

    data.slice(1).forEach(row => {
      tableHTML += `<tr>
        <td>${row[0]}</td>
        <td>${row[1]}</td>
        <td>${row[2]}</td>
        <td>${row[3]}</td>
        <td>${row[4]}</td>
        <td>${row[5]}</td>
        <td>${row[6]}</td>
      </tr>`;
    });

    tableHTML += `</tbody></table>`;
    container.innerHTML = tableHTML;
  } catch (err) {
    container.innerHTML = `<p class="empty-message">Fel vid hämtning av data: ${err}</p>`;
  }
}

// ==============================
// Kroppsvikt - Lägg till ny vikt
// ==============================
document.getElementById("weightForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const newWeight = document.getElementById("newWeight").value;
  if (!newWeight) return alert("Ange en vikt!");

  const today = new Date().toISOString().split("T")[0];
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
      loadMuscleGroups(); // uppdatera muskelgrupper om Kroppsvikt är med
    } else {
      alert("Kunde inte spara kroppsvikten.");
    }
  } catch (err) {
    alert("Fel vid anslutning till Google Sheets: " + err);
  }
});

// ==============================
// Kroppsvikt - Ladda senaste, historik, graf
// ==============================
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

    let weights = data.slice(1)
                      .filter(r => r[0] && r[0].trim().toLowerCase() === "kroppsvikt")
                      .slice(-10);

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

    const labels = weights.map(r => r[6].substring(0,10));
    const values = weights.map(r => parseFloat(r[1]));

    if (window.weightChart && typeof window.weightChart.destroy === 'function') {
    window.weightChart.destroy();
    }
    window.weightChart = new Chart(ctx, {
      type: 'line',
      data: { labels, datasets:[{ label:'Kroppsvikt (kg)', data: values, borderColor:'#3b82f6', backgroundColor:'#2563eb55', fill:true }] },
      options: { responsive:true, plugins:{legend:{display:false}}, scales:{ x:{ ticks:{color:'#ccc', font:{size:10}}}, y:{ticks:{color:'#ccc', font:{size:10}}} } }
    });

  } catch (err) {
    weightDisplay.innerText = `Fel vid hämtning av kroppsvikt: ${err}`;
    historyContainer.innerHTML = "";
  }
}

// ==============================
// Muskelgrupper med undergrupper och grafer
// ==============================
async function loadMuscleGroups() {
  const container = document.getElementById("muskel");
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
      li.textContent = muscle;

      const exUl = document.createElement("ul");
      exUl.className = "exercises";
      exercises.forEach(ex => {
        const exLi = document.createElement("li");
        exLi.textContent = ex;
        exLi.onclick = (ev) => { ev.stopPropagation(); loadExerciseHistory(muscle, ex); };
        exUl.appendChild(exLi);
      });

      li.appendChild(exUl);
      li.onclick = () => toggleExercises(li);
      ul.appendChild(li);
    }
    container.appendChild(ul);

  } catch (err) {
    container.innerHTML += `<p class='empty-message'>Fel vid hämtning av historik: ${err}</p>`;
  }
}

// Historik och graf för enskild övning
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
    const rows = data.slice(1).filter(r => r[0] === exercise && r[3] === muscle);
    if (rows.length === 0) {
      container.innerHTML = "<p class='empty-message'>Ingen träning loggad ännu.</p>";
      return;
    }

    let tableHTML = `<table><thead><tr><th>Datum</th><th>Vikt</th><th>Reps</th></tr></thead><tbody>`;
    rows.forEach(r => { tableHTML += `<tr><td>${r[6].substring(0,10)}</td><td>${r[1]}</td><td>${r[2]}</td></tr>`; });
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
      type:'line',
      data:{labels, datasets:[{label:exercise, data:values, borderColor:'#3b82f6', fill:false}]},
      options:{responsive:true, plugins:{legend:{display:false}}}
    });

  } catch(err) {
    container.innerHTML = `<p class='empty-message'>Fel vid hämtning av historik: ${err}</p>`;
  }
}

// ==============================
// Vilo-timer
// ==============================
let restInterval;
let restTotal;
let restRemaining;

function startRestTimer() {
  const input = document.getElementById("restTime");
  restTotal = parseInt(input.value);
  restRemaining = restTotal;

  const circle = document.querySelector(".circle-timer .progress");
  const text = document.getElementById("timerText");

  // Full cirkel = 2πr ≈ 339 (för r=54)
  const circumference = 2 * Math.PI * 54;

  circle.style.strokeDasharray = circumference;
  circle.style.strokeDashoffset = circumference;

  clearInterval(restInterval);

  text.textContent = restRemaining;

  restInterval = setInterval(() => {
    restRemaining--;

    if (restRemaining < 0) {
      clearInterval(restInterval);
      text.textContent = "Klar! 💪";
      return;
    }

    text.textContent = restRemaining;

    // Uppdatera cirkelns progress
    const offset = circumference - (restRemaining / restTotal) * circumference;
    circle.style.strokeDashoffset = offset;

  }, 1000);
}


// ==============================
// Initial load
// ==============================
loadData();
loadLatestWeight();
loadMuscleGroups();
