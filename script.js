const API_KEY = '0e4f48c2695567f318ef2e178bf0e756325b29d4';
const SPREADSHEET_ID = '1b5NpPONZs7XmG748nK4w6RBdq2M6x9Ju2kIE30FPlcE';
const RANGE = 'Sheet1!A1:D';  // Adjust depending on where your data is

async function getTrainingData() {
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${RANGE}?key=${API_KEY}`;
    
    try {
        const response = await fetch(url);
        const data = await response.json();
        
        const exercises = data.values.slice(1); // Skip the header row
        const tableBody = document.getElementById('exercise-table').getElementsByTagName('tbody')[0];
        
        exercises.forEach(exercise => {
            const row = tableBody.insertRow();
            exercise.forEach((cell, index) => {
                const cellElement = row.insertCell(index);
                cellElement.textContent = cell;
            });
        });
    } catch (error) {
        console.error('Error fetching data:', error);
    }
}

// Call the function to load data when the page loads
document.addEventListener('DOMContentLoaded', getTrainingData);
