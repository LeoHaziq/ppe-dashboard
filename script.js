// Configuration
const CONFIG = {
  API_URL: "https://script.google.com/macros/s/AKfycbzesZiENZHVqVKovL3ws0-uGr4l6Q8HzZFF1YtbitRwWuVieVqOayjR-pH4_gqBc8-W/exec",
  CACHE_DURATION: 30000 // 30 seconds
};

// Global state
let currentData = null;
let lastUpdateTime = null;

// Initialize
document.addEventListener('DOMContentLoaded', function() {
  console.log('PPE Dashboard initialized');
  
  // Update last update time
  updateLastUpdateTime();
  
  // Setup event listeners
  const refreshBtn = document.querySelector('.refresh-btn');
  if (refreshBtn) {
    refreshBtn.addEventListener('click', loadData);
  }
  
  const dateFilter = document.getElementById('dateFilter');
  if (dateFilter) {
    dateFilter.addEventListener('change', filterTable);
  }
  
  // Load initial data
  loadData();
  
  // Auto-refresh every 5 minutes
  setInterval(loadData, 5 * 60 * 1000);
});

// Update last update time display
function updateLastUpdateTime() {
  const now = new Date();
  const timeString = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const lastUpdateElement = document.getElementById('lastUpdate');
  if (lastUpdateElement) {
    lastUpdateElement.textContent = `Last updated: ${timeString}`;
  }
}

// Load data from Google Sheets
async function loadData() {
  try {
    console.log('Loading data from Google Sheets...');
    
    // Show loading state
    showLoadingState();
    
    // Add timestamp to avoid caching
    const timestamp = new Date().getTime();
    const url = `${CONFIG.API_URL}?t=${timestamp}`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('Data received:', data);
    
    if (data.error) {
      throw new Error(data.error);
    }
    
    if (data.success === false) {
      throw new Error(data.error || 'Failed to load data');
    }
    
    currentData = data;
    lastUpdateTime = new Date();
    
    // Update dashboard with real data
    updateDashboard(data.stats || data.summary || getDefaultStats());
    populateTable(data.records || []);
    
    showNotification('Data loaded successfully', 'success');
    updateLastUpdateTime();
    
  } catch (error) {
    console.error('Error loading data:', error);
    
    // Fallback to sample data
    const sampleData = getSampleData();
    currentData = sampleData;
    updateDashboard(sampleData.summary);
    populateTable(sampleData.records);
    
    showNotification('Using sample data: ' + error.message, 'warning');
  }
}

// Show loading state in table
function showLoadingState() {
  const tbody = document.getElementById('tableBody');
  if (tbody) {
    tbody.innerHTML = `
      <tr>
        <td colspan="5" class="loading-container">
          <i class="fas fa-spinner fa-spin fa-2x"></i>
          <p>Loading PPE records...</p>
        </td>
      </tr>
    `;
  }
}

// Update dashboard statistics
function updateDashboard(summary) {
  // Ensure we have a summary object
  if (!summary) summary = getDefaultStats();
  
  // Update counters with fallback
  document.getElementById('totalViolations').textContent = 
    (summary.helmetViolations || 0) + (summary.gloveViolations || 0);
  document.getElementById('helmetViolations').textContent = summary.helmetViolations || 0;
  document.getElementById('gloveViolations').textContent = summary.gloveViolations || 0;
  
  // Calculate full PPE compliance
  const totalRecords = summary.totalRecords || 0;
  const violations = (summary.helmetViolations || 0) + (summary.gloveViolations || 0);
  const fullPPE = totalRecords - violations;
  document.getElementById('fullPPE').textContent = fullPPE > 0 ? fullPPE : 0;
  
  document.getElementById('helmetOK').textContent = summary.helmetOk || 0;
  document.getElementById('gloveOK').textContent = summary.gloveOk || 0;
}

// Populate table with records
function populateTable(records) {
  const tbody = document.getElementById('tableBody');
  
  if (!tbody) return;
  
  if (!records || records.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="5" class="no-data">
          <div class="no-data-content">
            <i class="fas fa-database"></i>
            <h3>No Records Found</h3>
            <p>No PPE data available for the selected period</p>
            <button class="btn-retry" onclick="loadData()">
              <i class="fas fa-redo"></i> Retry
            </button>
          </div>
        </td>
      </tr>
    `;
    return;
  }
  
  let html = '';
  
  records.forEach((record, index) => {
    // Determine status classes
    const helmetClass = (record.helmetStatus || '').toLowerCase().includes('no_helmet') 
      ? 'status-violation' 
      : 'status-ok';
    
    const gloveClass = (record.gloveStatus || '').toLowerCase().includes('no_glove') 
      ? 'status-violation' 
      : 'status-ok';
    
    // Determine status text
    const helmetText = helmetClass === 'status-ok' ? 'HELMET OK' : 'NO HELMET';
    const gloveText = gloveClass === 'status-ok' ? 'GLOVE OK' : 'NO GLOVE';
    
    // Format datetime
    let displayDateTime = record.datetime || 'N/A';
    if (record.timestamp) {
      try {
        const date = new Date(record.timestamp);
        if (!isNaN(date.getTime())) {
          displayDateTime = date.toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
          });
        }
      } catch (e) {
        console.log('Error formatting date:', e);
      }
    }
    
    // Image URL handling
    let imageUrl = 'https://via.placeholder.com/180x120?text=No+Image';
    if (record.imageUrl) {
      imageUrl = record.imageUrl;
    } else if (record.imageId) {
      imageUrl = `https://drive.google.com/uc?id=${record.imageId}`;
    }
    
    html += `
      <tr>
        <td class="row-number">${index + 1}</td>
        <td class="datetime-cell">
          <div class="datetime-primary">${displayDateTime}</div>
          ${record.timestamp ? `<div class="datetime-secondary">ID: ${record.id || 'N/A'}</div>` : ''}
        </td>
        <td class="image-cell">
          <div class="image-wrapper">
            <img src="${imageUrl}" 
                 alt="PPE Snapshot" 
                 class="camera-image"
                 onerror="this.src='https://via.placeholder.com/180x120?text=Image+Error'">
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
      </tr>
    `;
  });
  
  tbody.innerHTML = html;
}

// Filter table by date
function filterTable() {
  const filter = document.getElementById('dateFilter').value;
  if (!currentData || !currentData.records) return;
  
  let filteredRecords = [...currentData.records];
  
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
  
  populateTable(filteredRecords);
  showNotification(`Showing ${filteredRecords.length} records`, 'info');
}

// Get default stats structure
function getDefaultStats() {
  return {
    helmetViolations: 0,
    gloveViolations: 0,
    helmetOk: 0,
    gloveOk: 0,
    totalRecords: 0
  };
}

// Sample data for testing
function getSampleData() {
  return {
    summary: {
      totalViolations: 47,
      helmetViolations: 23,
      gloveViolations: 24,
      fullPPE: 32,
      helmetOK: 56,
      gloveOK: 55
    },
    records: [
      {
        id: 1,
        datetime: "Nov 4, 2025, 09:55:42 AM",
        timestamp: "2025-11-04T09:55:42",
        imageUrl: "https://via.placeholder.com/180x120?text=Helmet+Missing",
        helmetStatus: "no_helmet",
        gloveStatus: "glove"
      },
      {
        id: 2,
        datetime: "Nov 4, 2025, 09:56:09 AM",
        timestamp: "2025-11-04T09:56:09",
        imageUrl: "https://via.placeholder.com/180x120?text=Both+OK",
        helmetStatus: "helmet",
        gloveStatus: "glove"
      },
      {
        id: 3,
        datetime: "Nov 4, 2025, 10:15:33 AM",
        timestamp: "2025-11-04T10:15:33",
        imageUrl: "https://via.placeholder.com/180x120?text=Glove+Missing",
        helmetStatus: "helmet",
        gloveStatus: "no_glove"
      }
    ]
  };
}

// Show notification
function showNotification(message, type = 'info') {
  // Create notification element
  const notification = document.createElement('div');
  notification.className = `notification notification-${type}`;
  
  const icons = {
    success: 'fas fa-check-circle',
    error: 'fas fa-exclamation-circle',
    warning: 'fas fa-exclamation-triangle',
    info: 'fas fa-info-circle'
  };
  
  notification.innerHTML = `
    <div class="notification-content">
      <i class="${icons[type] || icons.info}"></i>
      <span>${message}</span>
      <button class="notification-close" onclick="this.parentElement.parentElement.remove()">
        <i class="fas fa-times"></i>
      </button>
    </div>
  `;
  
  // Add to document
  document.body.appendChild(notification);
  
  // Remove after 3 seconds
  setTimeout(() => {
    if (notification.parentElement) {
      notification.remove();
    }
  }, 3000);
}

// View image in modal
function viewImage(url) {
  window.open(url, '_blank');
}

// Show app state info
function showAppState() {
  const info = `
    PPE Monitoring Dashboard
    Last Update: ${lastUpdateTime ? lastUpdateTime.toLocaleString() : 'Never'}
    Records Loaded: ${currentData?.records?.length || 0}
    API Status: ${currentData ? 'Connected' : 'Disconnected'}
  `;
  
  alert(info);
}
