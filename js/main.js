// ==============================================================================
// IMPORTERA FIREBASE MODULAR SDK
// ==============================================================================
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js";
// import { getAnalytics } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-analytics.js";

// ==============================================================================
// KONFIGURATION & INITIERING
// ==============================================================================
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
// const analytics = getAnalytics(app);

const API_URL = "https://script.google.com/macros/s/AKfycbwAbdw8V5QgEKYGt95VNKJEy0v-bWOl772Aos1HN_Tx3gpdq75WXWsQm6YR4IXB8YGe/exec";

// ==============================================================================
// GLOBALA VARIABLER
// ==============================================================================
let restTimerAnimation;
window.weightChart = null;
window.exerciseChart = null;

// ==============================================================================
// HELPER / GLOBALA FUNKTIONER
// ==============================================================================
window.showSection = (id, btn) => {
  document.querySelectorAll("main section").forEach(sec => sec.classList.remove("active"));
  document.getElementById(id).classList.add("active");

  document.querySelectorAll("nav button").forEach(b => b.classList.remove("active"));
  btn?.classList.add("active");

  if (id === "kroppsvikt") loadLatestWeight();
};

window.toggleExercises = el => {
  const exercises = el.querySelector(".exercises");
  exercises.style.display = exercises.style.display === "block" ? "none" : "block";
};

window.prefillExercise = (exercise, muscle) => {
  document.getElementById("exercise").value = exercise;
  document.getElementById("primary").value = muscle;
  document.getElementById("reps").value = 10;
  document.getElementById("weight").value = "";
  document.getElementById("effort").value = "Rätt";

  showSection("ovningar", document.querySelector("nav button[onclick*='ovningar']"));
};

window.startRestTimer = () => {
  const input = document.getElementById("restTime");
  let totalSeconds = parseInt(input.value);
  if (isNaN(totalSeconds) || totalSeconds < 10 || totalSeconds > 600) {
    return alert("Ange en tid mellan 10 och 600 sekunder.");
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
// DOMCONTENTLOADED - HUVUDLOGIK
// ==============================================================================
document.addEventListener("DOMContentLoaded", () => {
  const loginBtn = document.getElementById("loginBtn");
  const loginError = document.getElementById("loginError");
  const loginSection = document.getElementById("login");
  const contentSection = document.getElementById("content");
  const logoutBtn = document.getElementById("logoutBtn");

  document.querySelectorAll("#content section").forEach(sec => sec.classList.remove("active"));
  document.getElementById("welcome").classList.add("active");

  // ==========================
  // LOGIN
  // ==========================
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

  // ==========================
  // LOGOUT
  // ==========================
  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      signOut(auth)
        .then(() => console.log("Användare utloggad."))
        .catch(error => alert("Fel vid utloggning: " + error.message));
    });
  }

  // ==========================
  // AUTH STATE
  // ==========================
  onAuthStateChanged(auth, user => {
    if (user) {
      loginSection.style.display = "none";
      contentSection.style.display = "block";
      document.querySelectorAll("main section").forEach(sec => sec.classList.remove("active"));
      document.getElementById("content").classList.add("active");
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

  // ==========================
  // FORMS - TRÄNING & VIKT
  // ==========================
  document.getElementById("logForm").addEventListener("submit", async e => {
    e.preventDefault();
    const today = new Date().toISOString().split("T")[0];

    const formData = new FormData();
    ["exercise","weight","reps","primary","secondary","effort"].forEach(id => {
      formData.append(id, document.getElementById(id).value);
    });
    formData.append("date", today);

    try {
      const res = await fetch(API_URL, { method: "POST", body: formData });
      const result = await res.json();
      if (result.status === "success") {
        document.getElementById("logForm").reset();
        loadData();
        loadMuscleGroups();
      } else alert("Kunde inte spara träningsposten.");
    } catch(err) { alert("Fel vid anslutning till Google Sheets: " + err); }
  });

  document.getElementById("weightForm").addEventListener("submit", async e => {
    e.preventDefault();
    const newWeight = document.getElementById("newWeight").value;
    if (!newWeight) return alert("Ange en vikt!");

    const today = new Date().toISOString().split("T")[0];
    const params = new URLSearchParams({
      exercise: "Kroppsvikt",
      weight: newWeight,
      reps: 1,
      primary: "Allmänt",
      secondary: "",
      effort: "Rätt",
      date: today
    });

    try {
      const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: params.toString()
      });
      const result = await res.json();
      if (result.status === "success") {
        document.getElementById("weightForm").reset();
        loadLatestWeight();
        loadMuscleGroups();
      } else alert("Kunde inte spara kroppsvikten.");
    } catch(err) { alert("Fel vid anslutning till Google Sheets: " + err); }
  });

  // ==========================
  // LADDNING AV DATA, MUSKLER, PASS
  // ==========================
  async function loadData() {
    const container = document.getElementById("tableContainer");
    try {
      const data = await (await fetch(API_URL)).json();
      if (!data || data.length <= 1) return container.innerHTML = `<p class="empty-message">Inga träningsposter ännu.</p>`;

      let tableHTML = `<table><thead><tr>
        <th>Exercise</th><th>Weight (kg)</th><th>Reps</th><th>Primär muskelgrupp</th><th>Sekundär muskelgrupp</th><th>Insats</th><th>Date</th>
      </tr></thead><tbody>`;
      data.slice(1).forEach(r => tableHTML += `<tr>${r.map(c => `<td>${c}</td>`).join("")}</tr>`);
      tableHTML += `</tbody></table>`;
      container.innerHTML = tableHTML;
    } catch(err) { container.innerHTML = `<p class="empty-message">Fel vid hämtning av data: ${err}</p>`; }
  }

  async function loadLatestWeight() {
    const weightDisplay = document.getElementById("latestWeight");
    const historyContainer = document.getElementById("weightHistory");
    const ctx = document.getElementById("weightChart").getContext("2d");

    try {
      const data = await (await fetch(API_URL)).json();
      const weights = data.slice(1).filter(r => r[0]?.trim().toLowerCase() === "kroppsvikt").slice(-10);
      if (weights.length === 0) {
        weightDisplay.innerText = "Ingen kroppsvikt loggad ännu.";
        return historyContainer.innerHTML = "";
      }

      const latest = weights[weights.length-1];
      weightDisplay.innerText = `Senaste kroppsvikt: ${latest[1]} kg (${latest[6].substring(0,10)})`;

      let tableHTML = `<table><thead><tr><th>Datum</th><th>Vikt (kg)</th></tr></thead><tbody>`;
      weights.forEach(r => tableHTML += `<tr><td>${r[6].substring(0,10)}</td><td>${r[1]}</td></tr>`);
      tableHTML += `</tbody></table>`;
      historyContainer.innerHTML = tableHTML;

      const labels = weights.map(r => r[6].substring(0,10));
      const values = weights.map(r => parseFloat(r[1]));

      if (window.weightChart?.destroy) window.weightChart.destroy();
      window.weightChart = new Chart(ctx, {
        type:'line',
        data:{labels, datasets:[{label:'Kroppsvikt (kg)', data:values, borderColor:'#3b82f6', backgroundColor:'#2563eb55', fill:true}]},
        options:{responsive:true, plugins:{legend:{display:false}}, scales:{x:{ticks:{color:'#ccc', font:{size:10}}},y:{ticks:{color:'#ccc', font:{size:10}}}}}
      });
    } catch(err) {
      weightDisplay.innerText = `Fel vid hämtning av kroppsvikt: ${err}`;
      historyContainer.innerHTML = "";
    }
  }

  async function loadMuscleGroups() {
    const container = document.getElementById("muskel");
    if (!container) return;
    container.innerHTML = "<h2>Muskelgrupper</h2>";

    try {
      const data = await (await fetch(API_URL)).json();
      if (!data || data.length <= 1) return container.innerHTML += "<p class='empty-message'>Ingen data ännu.</p>";

      const muscles = {};
      data.slice(1).forEach(r => { const [exercise,, ,primary] = r; if (!muscles[primary]) muscles[primary]=[]; if (!muscles[primary].includes(exercise)) muscles[primary].push(exercise); });

      const ul = document.createElement("ul");
      for (const [muscle, exercises] of Object.entries(muscles)) {
        const li = document.createElement("li");
        li.className = "muscle-card";
        li.innerHTML = `<span class="muscle-title">${muscle}</span><span class="arrow">&#9662;</span>`;
        const exUl = document.createElement("ul"); exUl.className="exercises";
        exercises.forEach(ex => { const exLi=document.createElement("li"); exLi.textContent=ex; exLi.onclick=ev=>{ev.stopPropagation(); loadExerciseHistory(muscle,ex)}; exUl.appendChild(exLi); });
        li.appendChild(exUl); li.onclick = () => { li.classList.toggle("open"); toggleExercises(li); };
        ul.appendChild(li);
      }
      container.appendChild(ul);
    } catch(err) { container.innerHTML += `<p class='empty-message'>Fel vid hämtning av historik: ${err}</p>`; }
  }

  async function loadExerciseHistory(muscle, exercise) {
    const containerId = `exerciseHistory-${exercise.replace(/\s/g,"")}`;
    let container = document.getElementById(containerId);
    if (!container) { container=document.createElement("div"); container.id=containerId; container.className="exercise-history"; document.getElementById("muskel").appendChild(container);}
    container.innerHTML=`<h4>${exercise} (${muscle})</h4><p>Laddar...</p>`;

    try {
      const data = await (await fetch(API_URL)).json();
      const rows = data.slice(1).filter(r=>r[0]===exercise && r[3]===muscle);
      if(rows.length===0){container.innerHTML="<p class='empty-message'>Ingen träning loggad ännu.</p>"; return;}

      let tableHTML=`<table><thead><tr><th>Datum</th><th>Vikt</th><th>Reps</th></tr></thead><tbody>`;
      rows.forEach(r=>{tableHTML+=`<tr><td>${r[6].substring(0,10)}</td><td>${r[1]}</td><td>${r[2]}</td></tr>`;});
      tableHTML+=`</tbody></table>`; container.innerHTML=`<h4>${exercise} (${muscle})</h4>`+tableHTML;

      const canvasId=`chart-${exercise.replace(/\s/g,"")}`;
      let canvas=document.getElementById(canvasId); if(!canvas){canvas=document.createElement("canvas");canvas.id=canvasId;container.appendChild(canvas);}
      const ctx=canvas.getContext("2d");
      const labels=rows.map(r=>r[6].substring(0,10)), values=rows.map(r=>parseFloat(r[1]));
      if(window.exerciseChart) window.exerciseChart.destroy();
      window.exerciseChart=new Chart(ctx,{type:'line',data:{labels,datasets:[{label:exercise,data:values,borderColor:'#3b82f6',fill:false}]},options:{responsive:true,plugins:{legend:{display:false}}}});
    } catch(err){ container.innerHTML=`<p class='empty-message'>Fel vid hämtning av historik: ${err}</p>`; }
  }

  function loadPassMenu() {
    const passData=[
      { name:"Bröst, Triceps, Mage", exercises:[{name:"Bänkpress",muscle:"Bröst"},{name:"Flyers",muscle:"Bröst"},{name:"Triceps pushdown",muscle:"Triceps"},{name:"Dips assist",muscle:"Triceps"},{name:"Situps",muscle:"Mage"},{name:"Plankan",muscle:"Mage"}] },
      { name:"Rygg, Triceps, Vader", exercises:[{name:"Latsdrag",muscle:"Rygg"},{name:"Skivstångsrodd",muscle:"Rygg"},{name:"Triceps overhead",muscle:"Triceps"},{name:"Triceps med rep",muscle:"Triceps"},{name:"Tåhävningar",muscle:"Vader"},{name:"Sittande vadpress",muscle:"Vader"}] },
      { name:"Axlar, Handleder, Ben", exercises:[{name:"Axelpress",muscle:"Axlar"},{name:"Sidolyft",muscle:"Axlar"},{name:"Handledscurl (framåt)",muscle:"Handleder"},{name:"Handledscurl (bakåt)",muscle:"Handleder"},{name:"Knäböj",muscle:"Ben"},{name:"Utfallssteg",muscle:"Ben"}] }
    ];

    const container=document.getElementById("passList"); if(!container) return; container.innerHTML="";

    passData.forEach(pass=>{
      const card=document.createElement("div"); card.className="pass-card";
      const header=document.createElement("div"); header.className="pass-header"; header.innerHTML=`<span>${pass.name}</span><span class="arrow">▼</span>`;
      card.appendChild(header);

      const exList=document.createElement("ul"); exList.className="pass-exercises"; exList.style.height="0";
