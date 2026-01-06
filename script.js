// Configuration
const CONFIG = {
    API_URL: "https://script.google.com/macros/s/AKfycbz-rFc0oJmNip_FBgkjIvvKTK82nqkDhhdJ6wqqxvFeXOZzfXm1JchFwH2vJDB3VxBy/exec" // Ganti dengan URL Web App anda
};

// Global variables
let currentData = null;

// Initialize when page loads
document.addEventListener('DOMContentLoaded', function() {
    console.log('Dashboard loaded');
    loadData();
    
    // Setup refresh button
    document.querySelector('.refresh-btn').addEventListener('click', loadData);
    
    // Setup date filter
    document.getElementById('dateFilter').addEventListener('change', function() {
        if (currentData) {
            filterTable();
        }
    });
});

// Load data from API
function loadData() {
    console.log('Loading data from API...');
    
    const refreshBtn = document.querySelector('.refresh-btn');
    const originalText = refreshBtn.innerHTML;
    
    // Show loading state
    refreshBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Loading...';
    refreshBtn.disabled = true;
    
    // Clear table temporarily
    const tableBody = document.getElementById('tableBody');
    tableBody.innerHTML = `
        <tr>
            <td colspan="5" style="text-align: center; padding: 40px;">
                <i class="fas fa-spinner fa-spin"></i> Loading data from Google Sheets...
            </td>
        </tr>
    `;
    
    // Fetch data from API
    fetch(CONFIG.API_URL)
        .then(response => {
            console.log('API Response status:', response.status);
            return response.json();
        })
        .then(data => {
            console.log('Data received:', data);
            
            if (data.error) {
                throw new Error(data.error);
            }
            
            currentData = data;
            updateDashboard(data);
            populateTable(data.records);
            
            refreshBtn.innerHTML = '<i class="fas fa-check"></i> Data Loaded';
            setTimeout(() => {
                refreshBtn.innerHTML = originalText;
                refreshBtn.disabled = false;
            }, 1500);
        })
        .catch(error => {
            console.error('Error loading data:', error);
            
            // Fallback to sample data
            const sampleData = getSampleData();
            currentData = sampleData;
            updateDashboard(sampleData);
            populateTable(sampleData.records);
            
            refreshBtn.innerHTML = '<i class="fas fa-exclamation-triangle"></i> Using Sample Data';
            setTimeout(() => {
                refreshBtn.innerHTML = originalText;
                refreshBtn.disabled = false;
            }, 2000);
        });
}

// Update dashboard counters
function updateDashboard(data) {
    const summary = data.summary;
    
    // Update all counters
    document.getElementById('totalViolations').textContent = summary.totalViolations || 0;
    document.getElementById('helmetViolations').textContent = summary.helmetViolations || 0;
    document.getElementById('gloveViolations').textContent = summary.gloveViolations || 0;
    document.getElementById('fullPPE').textContent = summary.fullPPE || 0;
    document.getElementById('helmetOK').textContent = summary.helmetOK || 0;
    document.getElementById('gloveOK').textContent = summary.gloveOK || 0;
    
    console.log('Dashboard updated with:', summary);
}

// Populate table with records
function populateTable(records) {
    const tableBody = document.getElementById('tableBody');
    
    if (!records || records.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="5" style="text-align: center; padding: 40px; color: #e74c3c;">
                    <i class="fas fa-database"></i><br>
                    No data found in Google Sheet.
                </td>
            </tr>
        `;
        return;
    }
    
    console.log('Populating table with', records.length, 'records');
    
    let html = '';
    records.forEach((record, index) => {
        // Create status badges with correct colors
        const helmetClass = record.helmetStatus === 'helmet' ? 'status-ok' : 'status-violation';
        const gloveClass = record.gloveStatus === 'glove' ? 'status-ok' : 'status-violation';
        
        // Ensure image URL is properly formatted
        const imageUrl = ensureDirectImageUrl(record.imageUrl);
        
        html += `
        <tr>
            <td>${record.id || (index + 1)}</td>
            <td>${record.datetime || 'No date'}</td>
            <td class="image-cell">
                <div class="image-container">
                    <img src="${imageUrl}" 
                         alt="PPE Snapshot" 
                         class="camera-image"
                         onerror="this.onerror=null; this.src='https://via.placeholder.com/180x120/333/fff?text=No+Image'">
                    ${imageUrl ? `<div class="image-overlay" onclick="viewImage('${imageUrl}')">
                        <i class="fas fa-expand"></i>
                    </div>` : ''}
                </div>
            </td>
            <td><span class="status-badge ${helmetClass}">${record.helmetStatus.toUpperCase()}</span></td>
            <td><span class="status-badge ${gloveClass}">${record.gloveStatus.toUpperCase()}</span></td>
        </tr>
        `;
    });
    
    tableBody.innerHTML = html;
    console.log('Table populated with', records.length, 'rows');
}

// Ensure Google Drive URLs are direct image URLs
function ensureDirectImageUrl(url) {
    if (!url) return 'https://via.placeholder.com/180x120/333/fff?text=No+Image';
    
    // If it's already a direct image URL
    if (url.includes('drive.google.com/uc?id=') || url.includes('drive.google.com/uc?export=view')) {
        return url;
    }
    
    // Extract file ID from various Google Drive URL formats
    let fileId = '';
    
    // Format: https://drive.google.com/file/d/FILE_ID/view
    const match1 = url.match(/\/d\/([^\/]+)/);
    if (match1) fileId = match1[1];
    
    // Format: https://drive.google.com/open?id=FILE_ID
    const match2 = url.match(/id=([^&]+)/);
    if (match2 && !fileId) fileId = match2[1];
    
    // Format: Just the file ID
    if (!url.includes('http') && url.length > 10) {
        fileId = url;
    }
    
    // If we have a file ID, create direct URL
    if (fileId) {
        return `https://drive.google.com/uc?id=${fileId}`;
    }
    
    // Return original URL if no conversion possible
    return url;
}

// Filter table by date
function filterTable() {
    const filterValue = document.getElementById('dateFilter').value;
    let filteredRecords = [...currentData.records];
    
    if (filterValue === 'all') {
        populateTable(filteredRecords);
        return;
    }
    
    const now = new Date();
    let startDate = new Date();
    
    switch(filterValue) {
        case 'today':
            startDate.setHours(0, 0, 0, 0);
            break;
        case 'yesterday':
            startDate.setDate(startDate.getDate() - 1);
            startDate.setHours(0, 0, 0, 0);
            const yesterdayEnd = new Date(startDate);
            yesterdayEnd.setHours(23, 59, 59, 999);
            filteredRecords = filteredRecords.filter(record => {
                const recordDate = new Date(record.timestamp || record.datetime);
                return recordDate >= startDate && recordDate <= yesterdayEnd;
            });
            break;
        case 'week':
            startDate.setDate(startDate.getDate() - 7);
            break;
        case 'month':
            startDate.setMonth(startDate.getMonth() - 1);
            break;
    }
    
    if (filterValue !== 'yesterday') {
        filteredRecords = filteredRecords.filter(record => {
            const recordDate = new Date(record.timestamp || record.datetime);
            return recordDate >= startDate;
        });
    }
    
    populateTable(filteredRecords);
}

// View image in full screen
function viewImage(imageUrl) {
    const modal = document.createElement('div');
    modal.style.cssText = `
        position: fixed;
        top: 0; left: 0;
        width: 100%; height: 100%;
        background: rgba(0,0,0,0.9);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 10000;
        cursor: pointer;
    `;
    
    const img = document.createElement('img');
    img.src = ensureDirectImageUrl(imageUrl);
    img.style.cssText = `
        max-width: 90%;
        max-height: 90%;
        border-radius: 10px;
        box-shadow: 0 0 30px rgba(0,0,0,0.5);
        object-fit: contain;
    `;
    
    modal.appendChild(img);
    document.body.appendChild(modal);
    
    modal.onclick = () => modal.remove();
}

// Sample data for fallback
function getSampleData() {
    return {
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
                id: 1,
                datetime: "Nov 4, 2025, 09:55:42 AM",
                timestamp: "2025-11-04 09:55:42",
                imageUrl: "https://drive.google.com/uc?id=1kaqbrGBlIDoGqj",
                helmetStatus: "no_helmet",
                gloveStatus: "no_glove",
                rawHelmet: "no_helmet",
                rawGlove: "no_glove"
            },
            {
                id: 2,
                datetime: "Nov 4, 2025, 09:56:09 AM",
                timestamp: "2025-11-04 09:56:09",
                imageUrl: "https://drive.google.com/uc?id=1nOxycdenBHwUJ",
                helmetStatus: "no_helmet",
                gloveStatus: "glove",
                rawHelmet: "no_helmet",
                rawGlove: "glove"
            },
            {
                id: 3,
                datetime: "Nov 4, 2025, 09:57:29 AM",
                timestamp: "2025-11-04 09:57:29",
                imageUrl: "https://drive.google.com/uc?id=1SGXLiMJDJkA8J",
                helmetStatus: "no_helmet",
                gloveStatus: "glove",
                rawHelmet: "no_helmet",
                rawGlove: "glove"
            }
        ]
    };
}
