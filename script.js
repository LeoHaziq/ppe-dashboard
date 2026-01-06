// 🔴 Ganti dengan URL Web App Apps Script kamu
const API_URL = "https://script.google.com/macros/s/AKfycbwjV3eKA0rQ0uru5PNhk69sACMpKnsbLoosDypuORe-Kiq55RqwE3ybq6TOn6CUKIP3/exec";

function loadData() {
    const container = document.getElementById("data");
    container.innerHTML = "<p>Loading data...</p>";

    fetch(API_URL)
        .then(response => response.json())
        .then(data => {
            if (data.length === 0) {
                container.innerHTML = "<p>No data available</p>";
                return;
            }

            let html = "";

            // Papar data terbaru di atas
            data.reverse().forEach(row => {
                const helmet_status = row.helmet_status || "N/A";
                const glove_status = row.glove_status || "N/A";
                const violation = (helmet_status === "no_helmet" || glove_status === "no_glove") ? true : false;

                html += `
                    <div class="card">
                        <p><b>Time:</b> ${row.datetime}</p>
                        <p>Helmet: ${helmet_status}</p>
                        <p>Glove: ${glove_status}</p>
                        <p class="${violation ? 'violation' : ''}">
                            Violation: ${violation ? 'YES' : 'NO'}
                        </p>
                        ${row.image_url ? `<img src="${row.image_url}" alt="PPE Image">` : ""}
                    </div>
                `;
            });

            container.innerHTML = html;
        })
        .catch(error => {
            console.error(error);
            container.innerHTML = "<p>Failed to load data</p>";
        });
}
