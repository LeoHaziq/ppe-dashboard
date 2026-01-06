// Configuration
const CONFIG = {
    // Replace this with your Google Apps Script Web App URL
    API_URL: "https://script.google.com/macros/s/AKfycbwacmIPjA3i_yyk3WNcrHlkWIWTQ_qv0lf80ekWOq-cw2RLi0ruHCsT1KhtpKFJUu9T/exec",
    
    // Mock data for initial display (will be replaced by API data)
    mockData: {
        summary: {
            totalViolations: 200,
            helmetViolations: 59,
            gloveViolations: 141,
            fullPPE: 26,
            helmetOK: 117,
            gloveOK: 36
        },
        records: [
            {
                id: 15,
                datetime: "Dec 4, 2025, 11:37:12 AM",
                imageUrl: "https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=400&h=250&fit=crop",
                helmetStatus: "no_helmet",
                gloveStatus: "no_glove"
            },
            {
                id: 16,
                datetime: "Nov 5, 2023, 11:07:54 AM",
                imageUrl: "https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=400&h=250&fit=crop",
                helmetStatus: "no_helmet",
                gloveStatus: "glove"
            },
            {
                id: 17,
                datetime: "Nov 5, 2023, 10:45:22 AM",
                imageUrl: "https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=400&h=250&fit=crop",
                helmetStatus: "helmet",
                gloveStatus: "no_glove"
            },
            {
                id: 18,
                datetime: "Nov 5, 2023, 10:30:15 AM",
                imageUrl: "https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=400&h=250&fit=crop",
                helmetStatus: "helmet",
                gloveStatus: "glove"
            }
        ]
    }
};

// DOM Elements
let currentData = null;

// Initialize when page loads
document.addEventListener('DOMContentLoaded', function() {
    // Load initial data
    loadInitialData();
    
    // Setup event listeners
    document.getElementById('dateFilter').addEventListener('change', filterTable);
    
    // Setup auto-refresh every 30 seconds
    setInterval(refreshData, 30000);
});

// Load initial data (mock for now)
function loadInitialData() {
    currentData = CONFIG.mockData;
    updateDashboard(currentData);
    populateTable(currentData.records);
}

// Refresh data from API
function refreshData() {
    const refreshBtn = document.querySelector('.refresh-btn');
    const originalText = refreshBtn.innerHTML;
    
    // Show loading state
    refreshBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Loading...';
    refreshBtn.disabled = true;
    
    // In real implementation, fetch from API:
    // fetch(CONFIG.API_URL)
    //     .then(response => response.json())
    //     .then(data => {
    //         currentData = data;
    //         updateDashboard(data);
    //         populateTable(data.records);
    //         refreshBtn.innerHTML = originalText;
    //         refreshBtn.disabled = false;
    //     })
    //     .catch(error => {
    //         console.error('Error fetching data:', error);
    //         refreshBtn.innerHTML = '<i class="fas fa-exclamation-triangle"></i> Error';
    //         setTimeout(() => {
    //             refreshBtn.innerHTML = originalText;
    //             refreshBtn.disabled = false;
    //         }, 2000);
    //     });
    
    // For demo, use mock data with slight changes
    setTimeout(() => {
        const newData = {
            summary: {
                totalViolations: Math.floor(200 + Math.random() * 10),
                helmetViolations: Math.floor(59 + Math.random() * 5),
                gloveViolations: Math.floor(141 + Math.random() * 5),
                fullPPE: Math.floor(26 + Math.random() * 3),
                helmetOK: Math.floor(117 + Math.random() * 5),
                gloveOK: Math.floor(36 + Math.random() * 3)
            },
            records: CONFIG.mockData.records.map(record => ({
                ...record,
                datetime: new Date().toLocaleString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                    hour12: true
                })
            }))
        };
        
        currentData = newData;
        updateDashboard(newData);
        populateTable(newData.records);
        
        refreshBtn.innerHTML = '<i class="fas fa-check"></i> Refreshed!';
        setTimeout(() => {
            refreshBtn.innerHTML = originalText;
            refreshBtn.disabled = false;
        }, 1500);
    }, 1000);
}

// Update dashboard stats
function updateDashboard(data) {
    const summary = data.summary;
    
    // Update big numbers
    document.getElementById('totalViolations').textContent = summary.totalViolations;
    document.getElementById('helmetViolations').textContent = summary.helmetViolations;
    document.getElementById('gloveViolations').textContent = summary.gloveViolations;
    document.getElementById('fullPPE').textContent = summary.fullPPE;
    document.getElementById('helmetOK').textContent = summary.helmetOK;
    document.getElementById('gloveOK').textContent = summary.gloveOK;
}

// Populate table with records
function populateTable(records) {
    const tableBody = document.getElementById('tableBody');
    tableBody.innerHTML = '';
    
    records.forEach((record, index) => {
        const row = document.createElement('tr');
        
        // Create status badges
        const helmetBadge = createStatusBadge(record.helmetStatus, 'helmet');
        const gloveBadge = createStatusBadge(record.gloveStatus, 'glove');
        
        row.innerHTML = `
            <td>${record.id || index + 1}</td>
            <td>${record.datetime}</td>
            <td class="image-cell">
                <img src="${record.imageUrl}" 
                     alt="Camera Snapshot" 
                     class="camera-image"
                     onerror="this.src='https://via.placeholder.com/180x120?text=No+Image'">
            </td>
            <td>${helmetBadge}</td>
            <td>${gloveBadge}</td>
        `;
        
        tableBody.appendChild(row);
    });
}

// Create status badge HTML
function createStatusBadge(status, type) {
    const isOk = status === 'helmet' || status === 'glove';
    const badgeClass = isOk ? 'status-ok' : 'status-violation';
    const displayText = status.replace('_', ' ').toUpperCase();
    
    return `<span class="status-badge ${badgeClass}">${displayText}</span>`;
}

// Filter table by date range
function filterTable() {
    const filterValue = document.getElementById('dateFilter').value;
    
    if (!currentData) return;
    
    let filteredRecords = [...currentData.records];
    
    // Apply filters based on selection
    switch(filterValue) {
        case 'today':
            // Filter for today's records
            filteredRecords = filteredRecords.filter(record => {
                const recordDate = new Date(record.datetime);
                const today = new Date();
                return recordDate.toDateString() === today.toDateString();
            });
            break;
            
        case 'yesterday':
            // Filter for yesterday's records
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            filteredRecords = filteredRecords.filter(record => {
                const recordDate = new Date(record.datetime);
                return recordDate.toDateString() === yesterday.toDateString();
            });
            break;
            
        case 'week':
            // Filter for this week's records
            const oneWeekAgo = new Date();
            oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
            filteredRecords = filteredRecords.filter(record => {
                const recordDate = new Date(record.datetime);
                return recordDate >= oneWeekAgo;
            });
            break;
            
        case 'month':
            // Filter for this month's records
            const oneMonthAgo = new Date();
            oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
            filteredRecords = filteredRecords.filter(record => {
                const recordDate = new Date(record.datetime);
                return recordDate >= oneMonthAgo;
            });
            break;
            
        // 'all' shows all records
    }
    
    populateTable(filteredRecords);
}

// Export data function (optional)
function exportData() {
    if (!currentData) return;
    
    const dataStr = JSON.stringify(currentData, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = 'ppe-data-' + new Date().toISOString().split('T')[0] + '.json';
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
}
