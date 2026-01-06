// 🔴 Ganti dengan Apps Script Web App URL kamu
const API_URL = "https://script.google.com/macros/s/AKfycbwjV3eKA0rQ0uru5PNhk69sACMpKnsbLoosDypuORe-Kiq55RqwE3ybq6TOn6CUKIP3/exec";

function loadData() {
    const tableBody = document.getElementById("tableBody");

    fetch(API_URL)
        .then(res => res.json())
        .then(data => {
            if (data.length === 0) {
                tableBody.innerHTML = "<tr><td colspan='5'>No data available</td></tr>";
                return;
            }

            // Summary counters
            let totalViolations = 0;
            let helmetViolations = 0;
            let gloveViolations = 0;
            let fullPPE = 0;
            let helmetOK = 0;
            let gloveOK = 0;

            // Reverse latest first
            const rows = data.reverse();

            let html = "";
            rows.forEach((row, idx) => {
                const helmet_status = row.helmet_status;
                const glove_status = row.glove_status;
                const violation = helmet_status === "no_helmet" || glove_status === "no_glove";

                // Summary stats
                if (violation) totalViolations++;
                if (helmet_status === "no_helmet") helmetViolations++;
                if (glove_status === "no_glove") gloveViolations++;
                if (!violation) {
                    fullPPE++;
                    if (helmet_status === "helmet") helmetOK++;
                    if (glove_status === "glove") gloveOK++;
                }

                html += `
                    <tr>
                        <td>${idx+1}</td>
                        <td>${row.datetime}</td>
                        <td>${row.image_url ? `<img src="${row.image_url}" alt="PPE Image">` : ""}</td>
                        <td>${helmet_status}</td>
                        <td>${glove_status}</td>
                    </tr>
                `;
            });

            tableBody.innerHTML = html;

            // Update summary boxes
            document.getElementById("totalViolations").innerText = totalViolations;
            document.getElementById("helmetViolations").innerText = helmetViolations;
            document.getElementById("gloveViolations").innerText = gloveViolations;
            document.getElementById("fullPPE").innerText = fullPPE;
            document.getElementById("helmetOK").innerText = helmetOK;
            document.getElementById("gloveOK").innerText = gloveOK;
        })
        .catch(err => {
            console.error(err);
            tableBody.innerHTML = "<tr><td colspan='5'>Failed to load data</td></tr>";
        });
}
