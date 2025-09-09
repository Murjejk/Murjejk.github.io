// weight.js – komplett färdig version
const API_URL = "https://script.google.com/macros/s/AKfycbwAbdw8V5QgEKYGt95VNKJEy0v-bWOl772Aos1HN_Tx3gpdq75WXWsQm6YR4IXB8YGe/exec";

// ==============================
// Lägg till ny kroppsvikt
// ==============================
document.getElementById("weightForm").addEventListener("submit", async (e) => {
  e.preventDefault(); // STOPPAR formuläret från att reloada sidan

  const newWeight = document.getElementById("newWeight").value;
  if (!newWeight) return alert("Ange en vikt!");

  const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD

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

    // Filtrera endast Kroppsvikt, trim och lowercase
    let weights = data.slice(1)
                      .filter(row => row[0].trim().toLowerCase() === "kroppsvikt")
                      .slice(-10); // senaste 10

    if (weights.length === 0) {
      weightDisplay.innerText = "Ingen kroppsvikt loggad ännu.";
      historyContainer.innerHTML = "";
      return;
    }

    // Senaste vikt
    const latest = weights[weights.length - 1];
    const latestDate = latest[6] ? latest[6].substring(0,10) : "";
    weightDisplay.innerText = `Senaste kroppsvikt: ${latest[1]} kg (${latestDate})`;

    // Historik-tabell
    let tableHTML = `<table>
      <thead><tr><th>Datum</th><th>Vikt (kg)</th></tr></thead><tbody>`;
    weights.forEach(row => {
      const date = row[6] ? row[6].substring(0,10) : "";
      tableHTML += `<tr><td>${date}</td><td>${row[1]}</td></tr>`;
    });
    tableHTML += `</tbody></table>`;
    historyContainer.innerHTML = tableHTML;

    // Data för graf
    const labels = weights.map(row => {
      const dateStr = row[6] ? row[6].substring(0, 10) : "";
      const parts = dateStr.split("-");
      const day = parts[2] || "";
      const month = parts[1] ? ["jan","feb","mar","apr","maj","jun","jul","aug","sep","okt","nov","dec"][parseInt(parts[1])-1] : "";
      return `${day} ${month}`;
    });
    const values = weights.map(row => parseFloat(row[1]));

    if (window.weightChart) window.weightChart.destroy();
    window.weightChart = new Chart(ctx, {
      type: 'line',
      data: { 
        labels, 
        datasets: [{
          label:'Kroppsvikt (kg)',
          data: values,
          borderColor:'#3b82f6',
          backgroundColor:'#2563eb55',
          tension:0.3,
          fill:true,
          pointRadius:3,
          pointBackgroundColor:'#3b82f6'
        }] 
      },
      options: {
        responsive:true,
        plugins:{ legend:{ display:false } },
        scales:{
          x:{ ticks:{ color:'#ccc', font:{ size:10 } } },
          y:{ ticks:{ color:'#ccc', font:{ size:10 } } }
        }
      }
    });

  } catch(err) {
    weightDisplay.innerText = `Fel vid hämtning av kroppsvikt: ${err}`;
    historyContainer.innerHTML = "";
  }
}
