// main.js

const API_URL = "https://script.google.com/macros/s/AKfycbwAbdw8V5QgEKYGt95VNKJEy0v-bWOl772Aos1HN_Tx3gpdq75WXWsQm6YR4IXB8YGe/exec";

// ==============================
// Navigering mellan sektioner
// ==============================
function showSection(id, btn) {
  // Dölj alla sektioner
  document.querySelectorAll("main section").forEach(sec => sec.classList.remove("active"));
  // Visa vald sektion
  document.getElementById(id).classList.add("active");
  // Markera active knapp i navbar
  document.querySelectorAll("nav button").forEach(b => b.classList.remove("active"));
  btn.classList.add("active");

  // Om kroppsvikt, ladda senaste data
  if (id === "kroppsvikt") {
    if (typeof loadLatestWeight === "function") loadLatestWeight();
  }
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
  document.getElementById("reps").value = 10;      // default reps
  document.getElementById("weight").value = "";    // tom vikt
  document.getElementById("effort").value = "Rätt"; // default effort
  // Visa Lägg till-övning sektion
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
// Initial load
// ==============================
loadData();
