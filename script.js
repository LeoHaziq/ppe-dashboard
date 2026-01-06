// Configuration
const CONFIG = {
  API_URL: "https://script.google.com/macros/s/AKfycbzesZiENZHVqVKovL3ws0-uGr4l6Q8HzZFF1YtbitRwWuVieVqOayjR-pH4_gqBc8-W/exec"
};

// Global state
let currentData = null;

// Initialize
document.addEventListener('DOMContentLoaded', function() {
  console.log('Dashboard initialized');
  loadData();
  
  // Setup event listeners
  document.querySelector('.refresh-btn').addEventListener('click', loadData);
  document.getElementById('dateFilter').addEventListener('change', filterTable);
});

// Load data function
async function loadData() {
  try {
    console.log('Loading data from:', CONFIG.API_URL);
    
    // Show loading state
    document.getElementById('tableBody').innerHTML = `
      <tr>
        <td colspan="5" style="text-align: center; padding: 40px;">
          <i class="fas fa-spinner fa-spin fa-2x"></i>
          <p>Loading data from Google Sheets...</p>
        </td>
      </tr>
    `;
    
    // Fetch data with error handling
    const response = await fetch(CONFIG.API_URL);
    const data = await response.json();
    
    console.log('Data received:', data);
    
    if (data.error) {
      throw new Error(data.error);
    }
    
    currentData = data;
    updateDashboard(data.summary);
    populateTable(data.records);
    
    showNotification('Data loaded successfully', 'success');
    
  } catch (error) {
    console.error('Error loading data:', error);
    
    // Use sample data
    const sampleData = getSampleData();
    currentData = sampleData;
    updateDashboard(sampleData.summary);
    populateTable(sampleData.records);
    
    showNotification('Using sample data: ' + error.message, 'error');
  }
}

function updateDashboard(summary) {
  // Update counters
  document.getElementById('totalViolations').textContent = summary.totalViolations || 0;
  document.getElementById('helmetViolations').textContent = summary.helmetViolations || 0;
  document.getElementById('gloveViolations').textContent = summary.gloveViolations || 0;
  document.getElementById('fullPPE').textContent = summary.fullPPE || 0;
  document.getElementById('helmetOK').textContent = summary.helmetOK || 0;
  document.getElementById('gloveOK').textContent = summary.gloveOK || 0;
}

function populateTable(records) {
  const tbody = document.getElementById('tableBody');
  
  if (!records || records.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="5" style="text-align: center; padding: 40px;">
          <i class="fas fa-database"></i>
          <p>No data found</p>
        </td>
      </tr>
    `;
    return;
  }
  
  let html = '';
  records.forEach((record, index) => {
    const helmetClass = record.helmetStatus === 'helmet' ? 'status-ok' : 'status-violation';
    const gloveClass = record.gloveStatus === 'glove' ? 'status-ok' : 'status-violation';
    
    html += `
      <tr>
        <td>${index + 1}</td>
        <td>${record.datetime}</td>
        <td>
          <img src="${record.imageUrl || 'https://via.placeholder.com/180x120'}" 
               alt="PPE Snapshot" 
               style="width: 180px; height: 120px; object-fit: cover; border-radius: 5px;"
               onerror="this.src='https://via.placeholder.com/180x120'">
        </td>
        <td>
          <span class="status-badge ${helmetClass}">
            ${record.helmetStatus.toUpperCase()}
          </span>
        </td>
        <td>
          <span class="status-badge ${gloveClass}">
            ${record.gloveStatus.toUpperCase()}
          </span>
        </td>
      </tr>
    `;
  });
  
  tbody.innerHTML = html;
}

function filterTable() {
  const filter = document.getElementById('dateFilter').value;
  
  if (!currentData) return;
  
  // For now, just reload data with filter
  loadData();
}

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
        datetime: "Nov 4, 2025, 09:55:42 AM",
        imageUrl: "https://drive.google.com/uc?id=1kaqbrGBlIDoGqj",
        helmetStatus: "no_helmet",
        gloveStatus: "no_glove"
      },
      {
        datetime: "Nov 4, 2025, 09:56:09 AM",
        imageUrl: "https://drive.google.com/uc?id=1nOxycdenBHwUJ",
        helmetStatus: "no_helmet",
        gloveStatus: "glove"
      }
    ]
  };
}

function showNotification(message, type) {
  const notification = document.createElement('div');
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 15px 20px;
    background: ${type === 'success' ? '#2ecc71' : '#e74c3c'};
    color: white;
    border-radius: 5px;
    z-index: 1000;
    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
  `;
  notification.textContent = message;
  document.body.appendChild(notification);
  
  setTimeout(() => notification.remove(), 3000);
}
