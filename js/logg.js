document.addEventListener("DOMContentLoaded", () => {
  const tbody = document.querySelector("#loggTable tbody");
  let logData = [];

  // Hämta loggdata från Sheets
  async function fetchLogData() {
    const res = await fetch("https://script.google.com/macros/s/AKfycbxn7t97f8VWskY7QgdpiTk_ga1jPZ2WyWsJARKv3_7tt9d9zt2-RnyX272PSb4F3WlQ/exec");
    const data = await res.json();
    return data;
  }

  // Rendera tabellen
  function renderTable(data) {
    tbody.innerHTML = "";
    data.forEach((row, i) => {
      const tr = document.createElement("tr");

      // Skapa celler för datan
      row.forEach(cell => {
        const td = document.createElement("td");
        td.textContent = cell;
        td.contentEditable = false;
        tr.appendChild(td);
      });

      // Ikoncell: redigera + radera
      const iconTd = document.createElement("td");
      iconTd.classList.add("icon-cell");

      // Redigera-ikon
      const editIcon = document.createElement("span");
      editIcon.textContent = "✏️";
      editIcon.classList.add("edit-icon");
      editIcon.style.marginRight = "5px";
      editIcon.style.backgroundColor = "#ffd699";
      editIcon.style.color = "#ff8000";
      editIcon.style.borderRadius = "4px";
      editIcon.style.padding = "4px 6px";
      editIcon.style.cursor = "pointer";

      // Radera-ikon
      const deleteIcon = document.createElement("span");
      deleteIcon.textContent = "🗑️";
      deleteIcon.classList.add("delete-icon");
      deleteIcon.style.backgroundColor = "#ffb3b3";
      deleteIcon.style.color = "#cc0000";
      deleteIcon.style.borderRadius = "4px";
      deleteIcon.style.padding = "4px 6px";
      deleteIcon.style.cursor = "pointer";

      // Klick på redigera
      editIcon.addEventListener("click", async () => {
        const isEditing = tr.getAttribute("data-editing") === "true";

        if (!isEditing) {
          tr.querySelectorAll("td").forEach((td, idx) => {
            if (idx < tr.children.length - 1) td.contentEditable = "true";
          });
          tr.setAttribute("data-editing", "true");
          tr.classList.add("editing");
          editIcon.textContent = "💾";
          editIcon.style.backgroundColor = "#ffd699";
          editIcon.style.color = "#ff8000";
        } else {
          tr.querySelectorAll("td").forEach((td, idx) => {
            if (idx < tr.children.length - 1) td.contentEditable = "false";
          });
          tr.setAttribute("data-editing", "false");
          tr.classList.remove("editing");
          editIcon.textContent = "✅";
          editIcon.style.backgroundColor = "#c6f5c6";
          editIcon.style.color = "#009900";

          const updatedRow = Array.from(tr.querySelectorAll("td"))
            .slice(0, -1)
            .map(td => td.textContent);

          await saveRow(i, updatedRow);
          if (typeof reloadGraph === "function") reloadGraph();
        }
      });

      // Klick på radera
      deleteIcon.addEventListener("click", async () => {
        if (!confirm("Vill du verkligen radera denna rad?")) return;
        await deleteRow(i);
        tr.remove();
        if (typeof reloadGraph === "function") reloadGraph();
      });

      iconTd.appendChild(editIcon);
      iconTd.appendChild(deleteIcon);
      tr.appendChild(iconTd);
      tbody.appendChild(tr);
    });
  }

// Spara rad till Sheets
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

  const res = await fetch("https://script.google.com/macros/s/AKfycbxn7t97f8VWskY7QgdpiTk_ga1jPZ2WyWsJARKv3_7tt9d9zt2-RnyX272PSb4F3WlQ/exec", {
    method: "POST",
    body: params,
    headers: {
      "Content-Type": "application/x-www-form-urlencoded"
    }
  });

  const data = await res.json();
  if (data.status !== "updated") {
    console.error("Uppdateringen misslyckades:", data);
  }
}

// Radera rad i Sheets
async function deleteRow(rowIndex) {
  const params = new URLSearchParams({
    action: "deleteRow",
    rowIndex: rowIndex
  });

  const res = await fetch("https://script.google.com/macros/s/AKfycbxn7t97f8VWskY7QgdpiTk_ga1jPZ2WyWsJARKv3_7tt9d9zt2-RnyX272PSb4F3WlQ/exec", {
    method: "POST",
    body: params,
    headers: {
      "Content-Type": "application/x-www-form-urlencoded"
    }
  });

  const data = await res.json();
  if (data.status !== "deleted") {
    console.error("Raderingen misslyckades:", data);
  }
}


  // Init
  fetchLogData().then(data => {
    logData = data;
    renderTable(logData);
  });
});
