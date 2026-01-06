// Ganti dengan Apps Script Web App URL kamu
const API_URL = "https://script.google.com/macros/s/AKfycbwQQ--ITriDlxvNTboMMMxY724fVl7K9UtZcdKXWb0-6yPxBlZHTbD3r3O-dBv9D6dx/exec";

function loadData() {
    const tableBody = document.getElementById("tableBody");
    const dateFilter = document.getElementById("dateFilter").value;

    tableBody.innerHTML = "<tr><td colspan='5'>Loading...</td></tr>";

    fetch(API_URL)
        .then(res => res.ok ? res.json() : Promise.reject("Network error"))
        .then(data => {
            const {summary, rows} = data;

            if (!rows || rows.length === 0) {
                tableBody.innerHTML = "<tr><td colspan='5'>No data available</td></tr>";
                updateSummary(0,0,0,0,0,0);
                return;
            }

            // Date filter
            const today = new Date();
            const startOfWeek = new Date(today); startOfWeek.setDate(today.getDate() - today.getDay());
            const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

            const filtered = rows.filter(r => {
                const d = new Date(r.datetime);
                if (dateFilter === "today") return d.toDateString() === today.toDateString();
                if (dateFilter === "week") return d >= startOfWeek;
                if (dateFilter === "month") return d >= startOfMonth;
                return true;
            });

            if (filtered.length === 0) {
                tableBody.innerHTML = "<tr><td colspan='5'>No data for selected date range</td></tr>";
                updateSummary(0,0,0,0,0,0);
                return;
            }

            // Render table
            let html = "";
            filtered.reverse().forEach((r, idx) => {
                html += `
                    <tr>
                        <td>${idx+1}</td>
                        <td>${r.datetime}</td>
                        <td>${r.image_url ? `<img src="${r.image_url}" alt="PPE Image">` : ""}</td>
                        <td>${r.helmet_status}</td>
                        <td>${r.glove_status}</td>
                    </tr>
                `;
            });
            tableBody.innerHTML = html;

            // Render summary
            updateSummary(
                summary.totalViolations,
                summary.helmetViolations,
                summary.gloveViolations,
                summary.fullPPE,
                summary.helmetOK,
                summary.gloveOK
            );
        })
        .catch(err => {
            console.error(err);
            tableBody.innerHTML = "<tr><td colspan='5'>Failed to load data</td></tr>";
            updateSummary(0,0,0,0,0,0);
        });
}

function updateSummary(total, helmetV, gloveV, full, helmetOK, gloveOK){
    document.getElementById("totalViolations").innerText = total;
    document.getElementById("helmetViolations").innerText = helmetV;
    document.getElementById("gloveViolations").innerText = gloveV;
    document.getElementById("fullPPE").innerText = full;
    document.getElementById("helmetOK").innerText = helmetOK;
    document.getElementById("gloveOK").innerText = gloveOK;
}

// Load data bila page dibuka
window.addEventListener("DOMContentLoaded", loadData);

