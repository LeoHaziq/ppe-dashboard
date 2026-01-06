const API_URL = "https://script.google.com/macros/s/AKfycbwPTAFJzw7k8f7bRhKGBgYW_jlGftNlKth3P3wL9IIfgyMEodqqerNZyyNITbxMMg_5/exec";

// Debug function
function debugLog(message, data = null) {
    console.log(`[PPE Dashboard] ${message}`, data || '');
    // Optional: Show in UI
    const debugDiv = document.getElementById('debug') || (() => {
        const div = document.createElement('div');
        div.id = 'debug';
        div.style.cssText = 'position:fixed; top:10px; right:10px; background:#000; color:#0f0; padding:10px; z-index:9999; font-size:12px; max-width:300px;';
        document.body.appendChild(div);
        return div;
    })();
    debugDiv.innerHTML = `<div>${new Date().toLocaleTimeString()}: ${message}</div>` + debugDiv.innerHTML;
}

function normalizeStatus(status) {
    if (!status) return "unknown";
    const s = status.toString().trim().toLowerCase();
    
    // Debug
    debugLog(`Normalizing status: "${status}" -> "${s}"`);
    
    // Handle both formats from your screenshot
    if (s === "helmet") return "helmet";
    if (s === "no_helmet") return "no_helmet";
    if (s === "glove") return "glove";
    if (s === "no_glove") return "no_glove";
    
    // Try alternative mappings
    if (s.includes("helmet") && !s.includes("no")) return "helmet";
    if (s.includes("no") && s.includes("helmet")) return "no_helmet";
    if (s.includes("glove") && !s.includes("no")) return "glove";
    if (s.includes("no") && s.includes("glove")) return "no_glove";
    
    return "unknown";
}

async function loadData() {
    const tableBody = document.getElementById("tableBody");
    const dateFilter = document.getElementById("dateFilter").value;
    
    debugLog("Starting data load...");
    tableBody.innerHTML = "<tr><td colspan='5' style='text-align:center; padding:20px;'><div class='loading'>🔄 Loading data...</div></td></tr>";
    
    try {
        debugLog("Fetching from API...");
        
        // Add timestamp to prevent caching
        const timestamp = new Date().getTime();
        const url = `${API_URL}?t=${timestamp}`;
        
        const response = await fetch(url, {
            method: 'GET',
            mode: 'cors',
            cache: 'no-cache',
            headers: {
                'Accept': 'application/json'
            }
        });
        
        debugLog(`Response status: ${response.status}`);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const text = await response.text();
        debugLog(`Response received (length: ${text.length})`);
        
        let data;
        try {
            data = JSON.parse(text);
            debugLog(`Parsed JSON, type: ${Array.isArray(data) ? 'array' : typeof data}, length: ${Array.isArray(data) ? data.length : 'N/A'}`);
        } catch (parseError) {
            debugLog(`JSON parse error: ${parseError.message}`);
            throw new Error(`Invalid JSON response: ${text.substring(0, 100)}...`);
        }
        
        if (!Array.isArray(data)) {
            debugLog(`Data is not array:`, data);
            throw new Error("Expected array but got: " + (typeof data));
        }
        
        if (data.length === 0) {
            tableBody.innerHTML = "<tr><td colspan='5' style='text-align:center; padding:20px; color: #ff9900;'>📭 No data available in spreadsheet</td></tr>";
            updateSummary(0,0,0,0,0,0);
            return;
        }
        
        // Debug first few rows
        debugLog("First 3 rows:", data.slice(0, 3));
        
        // Date filtering
        const today = new Date();
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - today.getDay());
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        
        const filteredData = data.filter(row => {
            if (!row.datetime) return false;
            
            const rowDate = new Date(row.datetime);
            if (isNaN(rowDate.getTime())) return true; // Keep if invalid date
            
            if (dateFilter === "today") {
                return rowDate.toDateString() === today.toDateString();
            }
            if (dateFilter === "week") {
                return rowDate >= startOfWeek;
            }
            if (dateFilter === "month") {
                return rowDate >= startOfMonth;
            }
            return true;
        });
        
        debugLog(`Filtered data: ${filteredData.length} rows`);
        
        if (filteredData.length === 0) {
            tableBody.innerHTML = `<tr><td colspan='5' style='text-align:center; padding:20px; color: #ff9900;'>
                📅 No data for selected date range (${dateFilter})
            </td></tr>`;
            updateSummary(0,0,0,0,0,0);
            return;
        }
        
        // Process data
        let totalViolations = 0, helmetViolations = 0, gloveViolations = 0;
        let fullPPE = 0, helmetOK = 0, gloveOK = 0;
        let html = "";
        
        // Sort by datetime descending (newest first)
        filteredData.sort((a, b) => new Date(b.datetime) - new Date(a.datetime));
        
        filteredData.forEach((row, idx) => {
            const helmet = normalizeStatus(row.helmet_status);
            const glove = normalizeStatus(row.glove_status);
            
            // Count statistics
            if (helmet === "no_helmet" || glove === "no_glove") totalViolations++;
            if (helmet === "no_helmet") helmetViolations++;
            if (glove === "no_glove") gloveViolations++;
            if (helmet === "helmet" && glove === "glove") fullPPE++;
            if (helmet === "helmet") helmetOK++;
            if (glove === "glove") gloveOK++;
            
            // Format datetime
            const rawDateTime = row.datetime || '';
            let displayDateTime = rawDateTime;
            try {
                const dateObj = new Date(rawDateTime);
                if (!isNaN(dateObj.getTime())) {
                    displayDateTime = dateObj.toLocaleString('en-MY', {
                        year: 'numeric',
                        month: '2-digit',
                        day: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit'
                    });
                }
            } catch (e) {}
            
            // Status with color coding
            const helmetClass = helmet === "helmet" ? "status-ok" : 
                               helmet === "no_helmet" ? "status-violation" : "status-unknown";
            const gloveClass = glove === "glove" ? "status-ok" : 
                              glove === "no_glove" ? "status-violation" : "status-unknown";
            
            html += `
                <tr>
                    <td>${idx + 1}</td>
                    <td>${displayDateTime}</td>
                    <td>${row.image_url ? 
                        `<a href="${row.image_url}" target="_blank">
                            <img src="${row.image_url}" alt="PPE Image" onerror="this.src='no-image.png'">
                         </a>` : 
                        'No Image'}</td>
                    <td class="${helmetClass}">${helmet.replace('_', ' ').toUpperCase()}</td>
                    <td class="${gloveClass}">${glove.replace('_', ' ').toUpperCase()}</td>
                </tr>
            `;
        });
        
        tableBody.innerHTML = html;
        updateSummary(totalViolations, helmetViolations, gloveViolations, fullPPE, helmetOK, gloveOK);
        debugLog(`Data loaded successfully: ${filteredData.length} rows displayed`);
        
    } catch (error) {
        console.error("Load data error:", error);
        debugLog(`Error: ${error.message}`);
        
        tableBody.innerHTML = `
            <tr>
                <td colspan="5" style="text-align:center; padding:20px; color: #ff4444;">
                    ❌ Error loading data
                    <br><small style="color: #888;">${error.message}</small>
                    <br><button onclick="loadData()" style="margin-top:10px;">🔄 Retry</button>
                    <br><small>Check console (F12) for details</small>
                </td>
            </tr>
        `;
        updateSummary(0,0,0,0,0,0);
    }
}

function updateSummary(total, helmetV, gloveV, full, helmetOK, gloveOK) {
    document.getElementById("totalViolations").innerText = total;
    document.getElementById("helmetViolations").innerText = helmetV;
    document.getElementById("gloveViolations").innerText = gloveV;
    document.getElementById("fullPPE").innerText = full;
    document.getElementById("helmetOK").innerText = helmetOK;
    document.getElementById("gloveOK").innerText = gloveOK;
    
    // Update background color based on violations
    const totalElement = document.getElementById("totalViolations");
    if (total > 0) {
        totalElement.style.color = "#ff4444";
        totalElement.style.fontWeight = "bold";
    } else {
        totalElement.style.color = "white";
        totalElement.style.fontWeight = "normal";
    }
}

// Auto-refresh every 30 seconds
setInterval(() => {
    const debugDiv = document.getElementById('debug');
    if (!debugDiv || debugDiv.textContent.includes('Error')) return;
    debugLog('Auto-refreshing data...');
    loadData();
}, 30000);

// Initialize when page loads
document.addEventListener('DOMContentLoaded', function() {
    debugLog('Page loaded, initializing...');
    loadData();
    
    // Add CSS for status colors
    const style = document.createElement('style');
    style.textContent = `
        .status-ok { color: #4CAF50; font-weight: bold; }
        .status-violation { color: #f44336; font-weight: bold; }
        .status-unknown { color: #ff9800; }
        .loading { animation: pulse 1.5s infinite; }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
        table img { max-width: 150px; max-height: 100px; object-fit: cover; border-radius: 4px; }
        table img:hover { transform: scale(1.05); transition: transform 0.2s; }
    `;
    document.head.appendChild(style);
});
