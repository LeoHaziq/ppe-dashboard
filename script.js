// ✅ Apps Script Web App URL kamu
const API_URL = "https://script.google.com/macros/s/AKfycbwPTAFJzw7k8f7bRhKGBgYW_jlGftNlKth3P3wL9IIfgyMEodqqerNZyyNITbxMMg_5/exec";

// Fungsi untuk normalize semua status supaya consistent
function normalizeStatus(status) {
    if (!status) return "unknown";
    const s = status.trim().toLowerCase();
    // Helmet mapping
    if (["helmet","helm","h"].includes(s)) return "helmet";
    if (["no helmet","no_helmet","nh","n"].includes(s)) return "no_helmet";
    // Glove mapping
    if (["glove","g"].includes(s)) return "glove";
    if (["no glove","no_glove","ng","n"].includes(s)) return "no_glove";
    return "unknown";
}

function loadData() {
    const tableBody = document.getElementById("tableBody");
    const dateFilter = document.getElementById("dateFilter").value;

    tableBody.innerHTML = "<tr><td colspan='5'>Loading...</td></tr>";

    fetch(API_URL)
        .then(res => {
            if (!res.ok) throw new Error("Network response was not ok");
            return res.json();
        })
        .then(data => {
            if (!Array.isArray(data) || data.length === 0) {
                tableBody.innerHTML = "<tr><td colspan='5'>No data available</td></tr>";
                updateSummary(0,0,0,0,0,0);
                return;
            }

            const today = new Date();
            const startOfWeek = new Date(today);
            startOfWeek.setDate(today.getDate() - today.getDay());
            const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

            const filteredData = data.filter(row => {
                const rowDate = new Date(row.datetime);
                if (dateFilter === "today") return rowDate.toDateString() === today.toDateString();
                if (dateFilter === "week") return rowDate >= startOfWeek;
                if (dateFilter === "month") return rowDate >= startOfMonth;
                return true;
            });

            if (filteredData.length === 0) {
                tableBody.innerHTML = "<tr><td colspan='5'>No data for selected date range</td></tr>";
                updateSummary(0,0,0,0,0,0);
                return;
            }

            // Counters
            let totalViolations = 0;
            let helmetViolations = 0;
            let gloveViolations = 0;
            let fullPPE = 0;
            let helmetOK = 0;
            let gloveOK = 0;

            let html = "";
            filteredData.reverse().forEach((row, idx) => {
                const helmet_status_clean = normalizeStatus(row.helmet_status);
                const glove_status_clean = normalizeStatus(row.glove_status);

                // Total Violations: siapa ada pelanggaran
                if (helmet_status_clean === "no_helmet" || glove_status_clean === "no_glove") totalViolations++;

                // Helmet Violations
                if (helmet_status_clean === "no_helmet") helmetViolations++;

                // Glove Violations
                if (glove_status_clean === "no_glove") gloveViolations++;

                // Full PPE
                if (helmet_status_clean === "helmet" && glove_status_clean === "glove") fullPPE++;

                // Status Helmet
                if (helmet_status_clean === "helmet") helmetOK++;

                // Status Glove
                if (glove_status_clean === "glove") gloveOK++;

                html += `
                    <tr>
                        <td>${idx+1}</td>
                        <td>${row.datetime}</td>
                        <td>${row.image_url ? `<img src="${row.image_url}" alt="PPE Image">` : ""}</td>
                        <td>${helmet_status_clean}</td>
                        <td>${glove_status_clean}</td>
                    </tr>
                `;
            });

            tableBody.innerHTML = html;
            updateSummary(totalViolations, helmetViolations, gloveViolations, fullPPE, helmetOK, gloveOK);
        })
        .catch(err => {
            console.error("Error fetching data:", err);
            tableBody.innerHTML = "<tr><td colspan='5'>Failed to load data</td></tr>";
            updateSummary(0,0,0,0,0,0);
        });
}

// Update summary boxes
function updateSummary(total, helmetV, gloveV, full, helmetOK, gloveOK) {
    document.getElementById("totalViolations").innerText = total;
    document.getElementById("helmetViolations").innerText = helmetV;
    document.getElementById("gloveViolations").innerText = gloveV;
    document.getElementById("fullPPE").innerText = full;
    document.getElementById("helmetOK").innerText = helmetOK;
    document.getElementById("gloveOK").innerText = gloveOK;
}

// Load data bila page dibuka
window.addEventListener("DOMContentLoaded", () => {
    loadData();
});
