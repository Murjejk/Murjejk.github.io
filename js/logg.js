document.addEventListener("DOMContentLoaded", () => {
  const tbody = document.querySelector("#loggTable tbody");
  const toggleBtn = document.getElementById("toggleEdit");
  let editMode = false;
  let logData = [];

  // 1. Hämta loggdata från Sheets
  async function fetchLogData() {
    const res = await fetch("https://script.google.com/macros/s/AKfycbyfXAFUITZsCjiZj4T_8MuY0ROhvN2VbcPFkiW4Lw5qdWntyVuvIy2nE9s3eSpCLsr6/exec");
    const data = await res.json();
    return data;
  }

  // 2. Rendera tabellen
  function renderTable(data) {
    tbody.innerHTML = "";
    data.forEach((row, i) => {
      const tr = document.createElement("tr");

      // Skapa celler för datan
      row.forEach((cell, j) => {
        const td = document.createElement("td");
        td.textContent = cell;
        td.contentEditable = false;
        tr.appendChild(td);
      });

      // Skapa ikoncell
      const editTd = document.createElement("td");
      const icon = document.createElement("span");
      icon.textContent = "✏️"; // ändra till bild om du vill
      icon.classList.add("edit-icon");
      icon.style.cursor = "pointer";
      icon.style.display = "none"; // visas först när editMode är aktiv

      // Klick på ikon → edit/spara rad
      icon.addEventListener("click", async () => {
        const isEditing = tr.contentEditable === "true";

        if (!isEditing) {
          // Aktivera redigering
          tr.contentEditable = "true";
          tr.classList.add("editing");
          icon.textContent = "💾"; // spara
          icon.style.color = "orange";
        } else {
          // Spara ändringar
          tr.contentEditable = "false";
          tr.classList.remove("editing");
          icon.textContent = "✅"; // markerad som sparad
          icon.style.color = "green";

          // Samla uppdaterade värden
          const updatedRow = Array.from(tr.querySelectorAll("td"))
            .slice(0, -1) // sista kolumnen är ikonen
            .map(td => td.textContent);

          // Skicka till Sheets
          await saveRow(i, updatedRow);

          // Ladda om grafen om du har någon global graffunktion
          if (typeof reloadGraph === "function") reloadGraph();
        }
      });

      editTd.appendChild(icon);
      tr.appendChild(editTd);
      tbody.appendChild(tr);
    });
  }

  // 3. Spara rad till Sheets
  async function saveRow(rowIndex, updatedRow) {
    const params = new URLSearchParams({
      action: "updateRow",
      rowIndex: rowIndex,
      exercise: updatedRow[0],
      weight: updatedRow[1],
      reps: updatedRow[2],
      primary: updatedRow[3],
      secondary: updatedRow[4],
      effort: updatedRow[5],
      date: updatedRow[6]
    });

    await fetch("https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec", {
      method: "POST",
      body: params
    });
  }

  // 4. Toggle editMode
  toggleBtn.addEventListener("click", () => {
    editMode = !editMode;
    document.querySelectorAll(".edit-icon").forEach(icon => {
      icon.style.display = editMode ? "inline-block" : "none";
    });
  });

  // Init
  fetchLogData().then(data => {
    logData = data;
    renderTable(logData);
  });
});

