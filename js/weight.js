// weight.js

const API_URL = "https://script.google.com/macros/s/AKfycbwAbdw8V5QgEKYGt95VNKJEy0v-bWOl772Aos1HN_Tx3gpdq75WXWsQm6YR4IXB8YGe/exec";

// ==============================
// Lägg till ny kroppsvikt
// ==============================
document.getElementById("weightForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const today = new Date().toISOString().split("T")[0];
  const newWeight = document.getElementById("newWeight").value;

  const formData = new FormData();
  formData.append("exercise", "Kroppsvikt");
  formData.append("weight", newWeight);
  formData.append("reps", 1);
  formData.append("primary", "Allmänt");
  formData.append("secondary", "");
  formData.append("effort", "Rätt");
  formData.append("date", today);

  try {
    const response = await fetch(API_URL, { method: "POST", body: formData });
    const result = await response.json();
    if (result.status === "success") {
      document.getElementById("weightForm").reset();
      loadLatestWeight();
    } else {
      alert("Kunde inte spara kroppsvikten.");
    }
  } catch (err) {
    alert("Fel vid anslutning till Google Sheets: " + err);
  }
});

// ==============================
// Hämta senaste kroppsvikten, historik och graf (10 senaste)
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

    // Filtrera endast Kroppsvikt och ta de 10 senaste
    let weights = data.slice(1).filter(row => row[0] === "Kroppsvikt").slice(-10);

    if (weights.length === 0) {
      weightDisplay.innerText = "Ingen kroppsvikt loggad ännu.";
      historyContainer.innerHTML = "";
      return;
    }

    // Senaste vikt
    const latest = weights[weights.length - 1];
    weightDisplay.innerText = `Senaste kroppsvikt: ${latest[1]} kg (${latest[6]})`;

    // Historik-tabell (10 senaste)
    let tableHTML = `<table>
      <thead><tr><th>Datum</th><th>Vikt (kg)</th></tr></thead><tbody>`;
    weights.forEach(row => {
      tableHTML += `<tr><td>${row[6]}</td><td>${row[1]}</td></tr>`;
    });
    tableHTML += `</tbody></table>`;
    historyContainer.innerHTML = tableHTML;

    // Data för graf med förkortat datum
    const labels = weights.map(row => {
      const dateParts = row[6].split('-'); // YYYY-MM-DD
      const day = parseInt(dateParts[2], 10);
      const month = parseInt(dateParts[1], 10);
      const monthNames = ["jan","feb","mar","apr","maj","jun","jul","aug","sep","okt","nov","dec"];
      return `${day} ${monthNames[month-1]}`;
    });
    const values = weights.map(row => parseFloat(row[1]));

    // Rensa gammal graf om den finns
    if (window.weightChart) {
      window.weightChart.destroy();
    }

    // Skapa graf
    window.weightChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [{
          label: 'Kroppsvikt (kg)',
          data: values,
          borderColor: '#3b82f6',
          backgroundColor: '#2563eb55',
          tension: 0.3,
          fill: true,
          pointRadius: 3,
          pointBackgroundColor: '#3b82f6'
        }]
      },
      options: {
        responsive: true,
        plugins: { legend: { display: false } },
        scales: {
          x: { ticks: { color: '#ccc', font: { size: 10 } } },
          y: { ticks: { color: '#ccc', font: { size: 10 } } }
        }
      }
    });

  } catch (err) {
    weightDisplay.innerText = `Fel vid hämtning av kroppsvikt: ${err}`;
    historyContainer.innerHTML = "";
  }
}
