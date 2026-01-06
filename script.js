// Ganti dengan URL Apps Script Web App kamu
const API_URL = "https://script.google.com/macros/s/AKfycbwccM4eLMublZ4yjwp_H5RbiSTaNeUQcKUGgDDCYg1PeVHxWiuQUzmduwxNhXw9n2xS/exec";

function loadData() {
  const tableBody = document.getElementById("tableBody");

  fetch(API_URL)
    .then(res => res.json())
    .then(data => {
      const summary = data.summary || {};
      document.getElementById("totalViolations").innerText = summary.totalViolations || 0;
      document.getElementById("helmetViolations").innerText = summary.helmetViolations || 0;
      document.getElementById("gloveViolations").innerText = summary.gloveViolations || 0;
      document.getElementById("fullPPE").innerText = summary.fullPPE || 0;
      document.getElementById("helmetOK").innerText = summary.helmetOK || 0;
      document.getElementById("gloveOK").innerText = summary.gloveOK || 0;

      const rows = data.rows || [];
      if (rows.length === 0) {
        tableBody.innerHTML = "<tr><td colspan='5'>No data available</td></tr>";
        return;
      }

      let html = "";
      rows.reverse().forEach((row, idx) => {
        html += `
          <tr>
            <td>${idx + 1}</td>
            <td>${row.datetime}</td>
            <td>${row.image_url ? `<img src="${row.image_url}" alt="PPE Image">` : ""}</td>
            <td>${row.helmet_status}</td>
            <td>${row.glove_status}</td>
          </tr>
        `;
      });
      tableBody.innerHTML = html;
    })
    .catch(err => {
      console.error(err);
      tableBody.innerHTML = "<tr><td colspan='5'>Failed to load data</td></tr>";
    });
}
