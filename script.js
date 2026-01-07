// ============================================
// PPE DASHBOARD - MAIN JAVASCRIPT
// ============================================

// CONFIGURATION - GANTI DENGAN URL ANDA!
// Ganti URL di bawah dengan URL deployment Apps Script anda
const CONFIG = {
    API_URL: "https://script.google.com/macros/s/AKfycbzR20U7gfumeDQNLVnQSZj5-A5Rpi-S8bZfGwf_2CJxQ42d1p0lq7gclRHqwxKJtgzN/exec",
    SHEET_ID: "1UQd4xVSONK4aVy2NKu0pjA__Y4DoM1VFHusznmJJ0Sc",
    AUTO_REFRESH: true,
    REFRESH_INTERVAL: 60000, // 1 minute
    USE_SAMPLE_DATA: false // Set true untuk gunakan data contoh jika API gagal
};

// Global State
let dashboardState = {
    data: null,
    filteredData: null,
    lastUpdate: null,
    apiStatus: 'disconnected'
};

// Initialize Dashboard
function initializeDashboard() {
    console.log('Initializing PPE Dashboard...');
    
    // Update API Status
    updateApiStatus('connecting');
    
    // Setup Event Listeners
    setupEventListeners();
    
    // Test API Connection
    testApiConnection().then(success => {
        if (success) {
            // Load data
            loadData();
            
            // Setup auto-refresh
            if (CONFIG.AUTO_REFRESH) {
                setInterval(loadData, CONFIG.REFRESH_INTERVAL);
            }
        } else {
            // Use sample data if API fails
            if (CONFIG.USE_SAMPLE_DATA) {
                loadSampleData();
            } else {
                showNoDataState();
            }
        }
    });
}

// Setup Event Listeners
function setupEventListeners() {
    // Refresh Button
    const refreshBtn = document.getElementById('refreshBtn');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', loadData);
    }
    
    // Date Filter
    const dateFilter = document.getElementById('dateFilter');
    if (dateFilter) {
        dateFilter.addEventListener('change', handleDateFilter);
    }
    
    // System Info Button
    const systemInfoBtn = document.getElementById('systemInfoBtn');
    if (systemInfoBtn) {
        systemInfoBtn.addEventListener('click', showSystemInfo);
    }
}

// Test API Connection
async function testApiConnection() {
    try {
        const testUrl = `${CONFIG.API_URL}?action=test&t=${Date.now()}`;
        console.log('Testing API connection:', testUrl);
        
        const response = await fetch(testUrl);
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.success) {
            console.log('API Connection successful:', data);
            updateApiStatus('connected');
            showNotification('Connected to Google Sheets API', 'success');
            return true;
        } else {
            throw new Error(data.error || 'API test failed');
        }
    } catch (error) {
        console.error('API Connection failed:', error);
        updateApiStatus('disconnected');
        showNotification(`API Connection failed: ${error.message}`, 'error');
        return false;
    }
}

// Load Data from Google Sheets
async function loadData() {
    try {
        console.log('Loading data from Google Sheets...');
        
        // Show loading state
        showLoadingState();
        
        // Add cache busting
        const url = `${CONFIG.API_URL}?action=getData&t=${Date.now()}`;
        console.log('Fetching from:', url);
        
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error(`HTTP Error ${response.status}: ${response.statusText}`);
        }
        
        const result = await response.json();
        console.log('Data received:', result);
        
        if (!result.success) {
            throw new Error(result.error || 'Unknown error');
        }
        
        // Store data
        dashboardState.data = result.data || [];
        dashboardState.filteredData = [...dashboardState.data];
        dashboardState.lastUpdate = new Date();
        dashboardState.apiStatus = 'connected';
        
        // Update UI
        updateDashboard(result.stats);
        updateTable(dashboardState.filteredData);
        updateLastUpdateTime();
        updateRecordsCount();
        
        // Show success message
        const count = dashboardState.data.length;
        showNotification(`Loaded ${count} PPE records`, 'success');
        
    } catch (error) {
        console.error('Error loading data:', error);
        
        // Update status
        dashboardState.apiStatus = 'disconnected';
        updateApiStatus('disconnected');
        
        // Show error
        showNotification(`Failed to load data: ${error.message}`, 'error');
        
        // Try sample data
        if (CONFIG.USE_SAMPLE_DATA) {
            loadSampleData();
        } else {
            showNoDataState();
        }
    }
}

// Update Dashboard Statistics
function updateDashboard(stats) {
    if (!stats) return;
    
    // Calculate total violations
    const totalViolations = (stats.helmetViolations || 0) + (stats.gloveViolations || 0);
    
    // Update counters
    document.getElementById('totalViolations').textContent = totalViolations;
    document.getElementById('helmetViolations').textContent = stats.helmetViolations || 0;
    document.getElementById('gloveViolations').textContent = stats.gloveViolations || 0;
    document.getElementById('fullPPE').textContent = stats.fullPPE || 0;
    document.getElementById('helmetOK').textContent = stats.helmetOK || 0;
    document.getElementById('gloveOK').textContent = stats.gloveOK || 0;
}

// Update Table with Records
function updateTable(records) {
    const tbody = document.getElementById('tableBody');
    
    if (!tbody) return;
    
    // Clear table
    tbody.innerHTML = '';
    
    if (!records || records.length === 0) {
        showNoDataInTable();
        return;
    }
    
    // Build table rows
    records.forEach((record, index) => {
        const row = createTableRow(record, index + 1);
        tbody.appendChild(row);
    });
}

// Create Table Row
function createTableRow(record, rowNumber) {
    const row = document.createElement('tr');
    
    // Status classes
    const helmetClass = (record.helmetStatus || '').includes('no_helmet') ? 'status-violation' : 'status-ok';
    const gloveClass = (record.gloveStatus || '').includes('no_glove') ? 'status-violation' : 'status-ok';
    
    // Status text
    const helmetText = helmetClass === 'status-ok' ? 'HELMET OK' : 'NO HELMET';
    const gloveText = gloveClass === 'status-ok' ? 'GLOVE OK' : 'NO GLOVE';
    
    // Image URL
    let imageUrl = 'https://via.placeholder.com/160x100/2c3e50/ffffff?text=No+Image';
    let imageAlt = 'No Image Available';
    
    if (record.imageUrl) {
        imageUrl = record.imageUrl;
        imageAlt = 'PPE Snapshot';
        
        // Ensure it's a direct image URL for Google Drive
        if (imageUrl.includes('drive.google.com')) {
            if (!imageUrl.includes('export=view')) {
                imageUrl += (imageUrl.includes('?') ? '&' : '?') + 'export=view';
            }
        }
    }
    
    // Create cells
    row.innerHTML = `
        <td class="row-number">${rowNumber}</td>
        <td class="datetime-cell">
            <div class="datetime-primary">${record.datetime || 'N/A'}</div>
            <div class="datetime-secondary">ID: ${record.id || 'N/A'}</div>
        </td>
        <td class="image-cell">
            <div class="image-wrapper">
                <img src="${imageUrl}" 
                     alt="${imageAlt}" 
                     class="camera-image"
                     loading="lazy"
                     onerror="this.onerror=null; this.src='https://via.placeholder.com/160x100/2c3e50/ffffff?text=Image+Error'">
            </div>
        </td>
        <td class="status-cell">
            <div class="status-wrapper ${helmetClass}">
                <i class="fas fa-${helmetClass === 'status-ok' ? 'check-circle' : 'exclamation-circle'}"></i>
                <div>
                    <div class="status-text">${helmetText}</div>
                    <div class="status-detail">${record.helmetStatus || 'N/A'}</div>
                </div>
            </div>
        </td>
        <td class="status-cell">
            <div class="status-wrapper ${gloveClass}">
                <i class="fas fa-${gloveClass === 'status-ok' ? 'check-circle' : 'exclamation-circle'}"></i>
                <div>
                    <div class="status-text">${gloveText}</div>
                    <div class="status-detail">${record.gloveStatus || 'N/A'}</div>
                </div>
            </div>
        </td>
    `;
    
    return row;
}

// Handle Date Filter
function handleDateFilter() {
    const filter = document.getElementById('dateFilter').value;
    if (!dashboardState.data) return;
    
    let filteredRecords = [...dashboardState.data];
    
    if (filter === 'today') {
        const today = new Date().toDateString();
        filteredRecords = filteredRecords.filter(record => {
            const recordDate = new Date(record.timestamp || record.datetime).toDateString();
            return recordDate === today;
        });
    } else if (filter === 'yesterday') {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toDateString();
        
        filteredRecords = filteredRecords.filter(record => {
            const recordDate = new Date(record.timestamp || record.datetime).toDateString();
            return recordDate === yesterdayStr;
        });
    } else if (filter === 'week') {
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        
        filteredRecords = filteredRecords.filter(record => {
            const recordDate = new Date(record.timestamp || record.datetime);
            return recordDate >= weekAgo;
        });
    } else if (filter === 'month') {
        const monthAgo = new Date();
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        
        filteredRecords = filteredRecords.filter(record => {
            const recordDate = new Date(record.timestamp || record.datetime);
            return recordDate >= monthAgo;
        });
    }
    
    dashboardState.filteredData = filteredRecords;
    updateTable(filteredRecords);
    updateRecordsCount();
    
    showNotification(`Showing ${filteredRecords.length} records`, 'info');
}

// Show No Data State
function showNoDataState() {
    const tbody = document.getElementById('tableBody');
    if (!tbody) return;
    
    tbody.innerHTML = `
        <tr>
            <td colspan="5" class="no-data">
                <div class="no-data-content">
                    <i class="fas fa-database"></i>
                    <h3>No Data Available</h3>
                    <p>Unable to connect to Google Sheets or no data found.</p>
                    <button class="btn-retry" onclick="loadData()">
                        <i class="fas fa-redo"></i> Retry Connection
                    </button>
                    <p style="margin-top: 20px; font-size: 12px;">
                        Check your API URL in CONFIG.API_URL
                    </p>
                </div>
            </td>
        </tr>
    `;
}

function showNoDataInTable() {
    const tbody = document.getElementById('tableBody');
    if (!tbody) return;
    
    tbody.innerHTML = `
        <tr>
            <td colspan="5" class="no-data">
                <div class="no-data-content">
                    <i class="fas fa-search"></i>
                    <h3>No Matching Records</h3>
                    <p>No PPE records found for the selected filter.</p>
                    <button class="btn-retry" onclick="document.getElementById('dateFilter').value='all'; handleDateFilter()">
                        <i class="fas fa-times"></i> Clear Filter
                    </button>
                </div>
            </td>
        </tr>
    `;
}

function showLoadingState() {
    const tbody = document.getElementById('tableBody');
    if (!tbody) return;
    
    tbody.innerHTML = `
        <tr>
            <td colspan="5" class="loading-container">
                <i class="fas fa-spinner fa-spin fa-2x"></i>
                <p>Loading PPE records from Google Sheets...</p>
            </td>
        </tr>
    `;
}

// Sample Data for Testing
function loadSampleData() {
    console.log('Loading sample data...');
    
    const sampleData = [
        {
            id: 1,
            datetime: "Nov 4, 2025, 09:55:42 AM",
            timestamp: "2025-11-04T09:55:42",
            imageUrl: "https://drive.google.com/uc?id=1kaqbrGBlIDoGqj&export=view",
            helmetStatus: "no_helmet",
            gloveStatus: "glove"
        },
        {
            id: 2,
            datetime: "Nov 4, 2025, 09:56:09 AM",
            timestamp: "2025-11-04T09:56:09",
            imageUrl: "https://drive.google.com/uc?id=1nOxycdenBHwUJ&export=view",
            helmetStatus: "helmet",
            gloveStatus: "glove"
        },
        {
            id: 3,
            datetime: "Nov 4, 2025, 10:15:33 AM",
            timestamp: "2025-11-04T10:15:33",
            imageUrl: "https://drive.google.com/uc?id=1abc123def456&export=view",
            helmetStatus: "helmet",
            gloveStatus: "no_glove"
        }
    ];
    
    const sampleStats = {
        helmetViolations: 23,
        gloveViolations: 24,
        helmetOK: 56,
        gloveOK: 55,
        totalRecords: 100,
        violations: 47,
        fullPPE: 53
    };
    
    dashboardState.data = sampleData;
    dashboardState.filteredData = sampleData;
    dashboardState.lastUpdate = new Date();
    
    updateDashboard(sampleStats);
    updateTable(sampleData);
    updateLastUpdateTime();
    updateRecordsCount();
    updateApiStatus('connected');
    
    showNotification('Loaded sample data (Google Sheets unavailable)', 'warning');
}

// Utility Functions
function updateApiStatus(status) {
    const statusElement = document.getElementById('apiStatus');
    if (!statusElement) return;
    
    dashboardState.apiStatus = status;
    
    statusElement.className = 'api-status ' + status;
    
    const icons = {
        connected: 'fas fa-check-circle',
        disconnected: 'fas fa-times-circle',
        connecting: 'fas fa-spinner fa-spin'
    };
    
    const texts = {
        connected: 'Connected',
        disconnected: 'Disconnected',
        connecting: 'Connecting...'
    };
    
    statusElement.innerHTML = `<i class="${icons[status]}"></i> ${texts[status]}`;
}

function updateLastUpdateTime() {
    const element = document.getElementById('lastUpdate');
    if (!element) return;
    
    if (dashboardState.lastUpdate) {
        const timeStr = dashboardState.lastUpdate.toLocaleTimeString([], { 
            hour: '2-digit', 
            minute: '2-digit',
            second: '2-digit'
        });
        element.textContent = `Last updated: ${timeStr}`;
    } else {
        element.textContent = 'Never updated';
    }
}

function updateRecordsCount() {
    const element = document.getElementById('recordsCount');
    if (!element) return;
    
    const count = dashboardState.filteredData ? dashboardState.filteredData.length : 0;
    const total = dashboardState.data ? dashboardState.data.length : 0;
    
    element.textContent = `${count} / ${total}`;
}

function showNotification(message, type = 'info') {
    // Remove existing notifications
    const existingNotifications = document.querySelectorAll('.notification');
    existingNotifications.forEach(notification => {
        if (notification.parentElement) {
            notification.remove();
        }
    });
    
    // Create notification
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    
    const icons = {
        success: 'fas fa-check-circle',
        error: 'fas fa-exclamation-circle',
        warning: 'fas fa-exclamation-triangle',
        info: 'fas fa-info-circle'
    };
    
    notification.innerHTML = `
        <i class="${icons[type] || icons.info}"></i>
        <span>${message}</span>
        <button class="notification-close" onclick="this.parentElement.remove()">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    // Add to body
    document.body.appendChild(notification);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        if (notification.parentElement) {
            notification.remove();
        }
    }, 5000);
}

function showSystemInfo() {
    const info = `
PPE MONITORING DASHBOARD
=========================
Last Update: ${dashboardState.lastUpdate ? dashboardState.lastUpdate.toLocaleString() : 'Never'}
API Status: ${dashboardState.apiStatus}
Records Loaded: ${dashboardState.data ? dashboardState.data.length : 0}
Google Sheet: ${CONFIG.SHEET_ID}
API URL: ${CONFIG.API_URL}
=========================
Contact: UMPSA Safety Department
Version: 2.0
    `.trim();
    
    alert(info);
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', initializeDashboard);
