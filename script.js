// Configuration
const API_BASE = '/api'; // Relative path to worker
let chart1, chart2;
let dataLimit = 10;

// Initialize dashboard
document.addEventListener('DOMContentLoaded', function() {
    loadAllData();
    setInterval(loadAllData, 30000); // Auto-refresh every 30 seconds
});

// Load all dashboard data
async function loadAllData() {
    showLoading(true);
    try {
        await Promise.all([
            loadDashboardData(),
            loadStatistics(),
            loadRecentData()
        ]);
        updateLastUpdated();
        showConnectionStatus(true);
    } catch (error) {
        console.error('Error loading data:', error);
        showConnectionStatus(false);
    } finally {
        showLoading(false);
    }
}

// Load dashboard/system info
async function loadDashboardData() {
    try {
        const response = await fetch(`${API_BASE}?action=dashboard`);
        const data = await response.json();
        
        if (data.success) {
            updateSystemInfo(data);
        }
    } catch (error) {
        console.error('Error loading dashboard:', error);
        document.getElementById('system-info').innerHTML = `
            <div class="col-12">
                <div class="alert alert-danger">
                    <i class="fas fa-exclamation-triangle me-2"></i>
                    Failed to load system information
                </div>
            </div>
        `;
    }
}

// Load statistics
async function loadStatistics() {
    try {
        const response = await fetch(`${API_BASE}?action=getStats`);
        const data = await response.json();
        
        if (data.success) {
            updateStatsCards(data.stats);
            updateCharts(data.stats);
        }
    } catch (error) {
        console.error('Error loading statistics:', error);
        document.getElementById('stats-cards').innerHTML = `
            <div class="col-12">
                <div class="alert alert-warning">
                    <i class="fas fa-chart-bar me-2"></i>
                    Statistics temporarily unavailable
                </div>
            </div>
        `;
    }
}

// Load recent data
async function loadRecentData() {
    try {
        const response = await fetch(`${API_BASE}?action=getRecent&limit=${dataLimit}`);
        const data = await response.json();
        
        if (data.success) {
            updateRecentTable(data.data);
        }
    } catch (error) {
        console.error('Error loading recent data:', error);
        document.getElementById('recent-data').innerHTML = `
            <tr>
                <td colspan="6" class="text-center py-5 text-muted">
                    <i class="fas fa-exclamation-circle fa-2x mb-3"></i>
                    <p>Failed to load recent data</p>
                </td>
            </tr>
        `;
    }
}

// Load more data
function loadMoreData() {
    dataLimit += 10;
    loadRecentData();
}

// Update system information
function updateSystemInfo(data) {
    const systemInfo = document.getElementById('system-info');
    systemInfo.innerHTML = `
        <div class="col-md-3 col-sm-6">
            <div class="d-flex align-items-center">
                <div class="status-indicator ${data.systemStatus === 'READY' ? 'status-online' : 'status-offline'}"></div>
                <div>
                    <small class="text-muted">System Status</small>
                    <h6 class="mb-0">${data.systemStatus || 'Unknown'}</h6>
                </div>
            </div>
        </div>
        <div class="col-md-3 col-sm-6">
            <small class="text-muted">Server</small>
            <h6 class="mb-0">${data.systemInfo?.serverIP || 'N/A'}</h6>
        </div>
        <div class="col-md-3 col-sm-6">
            <small class="text-muted">Model</small>
            <h6 class="mb-0">${data.systemInfo?.model || 'N/A'}</h6>
        </div>
        <div class="col-md-3 col-sm-6">
            <small class="text-muted">Last Checked</small>
            <h6 class="mb-0">${data.lastChecked || 'N/A'}</h6>
        </div>
    `;
}

// Update statistics cards
function updateStatsCards(stats) {
    const statsCards = document.getElementById('stats-cards');
    statsCards.innerHTML = `
        <div class="col-xl-3 col-lg-6 col-md-6 mb-3">
            <div class="stat-card" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
                <div class="card-body text-center">
                    <div class="stat-icon">
                        <i class="fas fa-helmet-safety"></i>
                    </div>
                    <div class="stat-value">${stats.compliance?.helmet || 0}%</div>
                    <div class="stat-label">Helmet Compliance</div>
                    <small>${stats.helmetOK || 0} OK / ${stats.helmetViolations || 0} Violations</small>
                </div>
            </div>
        </div>
        <div class="col-xl-3 col-lg-6 col-md-6 mb-3">
            <div class="stat-card" style="background: linear-gradient(135deg, #4CAF50 0%, #8BC34A 100%);">
                <div class="card-body text-center">
                    <div class="stat-icon">
                        <i class="fas fa-hand-paper"></i>
                    </div>
                    <div class="stat-value">${stats.compliance?.glove || 0}%</div>
                    <div class="stat-label">Glove Compliance</div>
                    <small>${stats.gloveOK || 0} OK / ${stats.gloveViolations || 0} Violations</small>
                </div>
            </div>
        </div>
        <div class="col-xl-3 col-lg-6 col-md-6 mb-3">
            <div class="stat-card" style="background: linear-gradient(135deg, #FF9800 0%, #FFC107 100%);">
                <div class="card-body text-center">
                    <div class="stat-icon">
                        <i class="fas fa-shield-alt"></i>
                    </div>
                    <div class="stat-value">${stats.compliance?.overall || 0}%</div>
                    <div class="stat-label">Overall Compliance</div>
                    <small>${stats.fullPPE || 0} Full PPE / ${stats.total || 0} Total</small>
                </div>
            </div>
        </div>
        <div class="col-xl-3 col-lg-6 col-md-6 mb-3">
            <div class="stat-card" style="background: linear-gradient(135deg, #F44336 0%, #E91E63 100%);">
                <div class="card-body text-center">
                    <div class="stat-icon">
                        <i class="fas fa-exclamation-triangle"></i>
                    </div>
                    <div class="stat-value">${stats.violationsToday || 0}</div>
                    <div class="stat-label">Today's Violations</div>
                    <small>${stats.todayRecords || 0} records today</small>
                </div>
            </div>
        </div>
    `;
}

// Update charts
function updateCharts(stats) {
    // Compliance Chart
    const complianceCtx = document.getElementById('complianceChart');
    if (!complianceCtx) return;
    
    if (chart1) chart1.destroy();
    
    chart1 = new Chart(complianceCtx.getContext('2d'), {
        type: 'pie',
        data: {
            labels: ['Helmet OK', 'Helmet Violations', 'Glove OK', 'Glove Violations'],
            datasets: [{
                data: [
                    stats.helmetOK || 0,
                    stats.helmetViolations || 0,
                    stats.gloveOK || 0,
                    stats.gloveViolations || 0
                ],
                backgroundColor: [
                    '#27ae60',
                    '#e74c3c',
                    '#3498db',
                    '#f39c12'
                ],
                borderWidth: 2,
                borderColor: '#fff'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        padding: 20,
                        usePointStyle: true
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const label = context.label || '';
                            const value = context.raw || 0;
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = Math.round((value / total) * 100);
                            return `${label}: ${value} (${percentage}%)`;
                        }
                    }
                }
            }
        }
    });

    // Violations Chart
    const violationsCtx = document.getElementById('violationsChart');
    if (!violationsCtx) return;
    
    // Generate sample data for weekly trend
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const baseViolations = Math.floor((stats.totalViolations || 1) / 7);
    const dailyViolations = days.map(() => 
        Math.max(1, Math.floor(baseViolations * (0.5 + Math.random())))
    );
    
    if (chart2) chart2.destroy();
    
    chart2 = new Chart(violationsCtx.getContext('2d'), {
        type: 'line',
        data: {
            labels: days,
            datasets: [{
                label: 'Violations',
                data: dailyViolations,
                borderColor: '#e74c3c',
                backgroundColor: 'rgba(231, 76, 60, 0.1)',
                borderWidth: 3,
                fill: true,
                tension: 0.4,
                pointBackgroundColor: '#e74c3c',
                pointBorderColor: '#fff',
                pointBorderWidth: 2,
                pointRadius: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Number of Violations'
                    },
                    grid: {
                        drawBorder: false
                    }
                },
                x: {
                    grid: {
                        display: false
                    }
                }
            },
            plugins: {
                legend: {
                    display: false
                }
            }
        }
    });
}

// Update recent data table
function updateRecentTable(data) {
    const tbody = document.getElementById('recent-data');
    
    if (!data || data.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" class="text-center py-5 text-muted">
                    <i class="fas fa-database fa-2x mb-3"></i>
                    <p>No detection data available</p>
                </td>
            </tr>
        `;
        return;
    }
    
    let tableHTML = '';
    
    data.forEach((item) => {
        const isCompliant = item.helmetStatus === 'helmet' && item.gloveStatus === 'glove';
        const rowClass = isCompliant ? 'compliance-row' : 'violation-row';
        const time = item.formattedTime || formatTime(item.timestamp) || 'Unknown';
        
        tableHTML += `
            <tr class="${rowClass}">
                <td>
                    <div class="fw-bold">${time}</div>
                    <small class="text-muted">${item.datetime || ''}</small>
                </td>
                <td>
                    <span class="badge ${item.helmetStatus === 'helmet' ? 'bg-success' : 'bg-danger'}">
                        ${item.helmetStatus === 'helmet' ? '✓ Helmet' : '✗ No Helmet'}
                    </span>
                </td>
                <td>
                    <span class="badge ${item.gloveStatus === 'glove' ? 'bg-success' : 'bg-danger'}">
                        ${item.gloveStatus === 'glove' ? '✓ Gloves' : '✗ No Gloves'}
                    </span>
                </td>
                <td>
                    <span class="compliance-badge ${isCompliant ? 'bg-success' : 'bg-danger'}">
                        ${isCompliant ? 'Compliant' : 'Violation'}
                    </span>
                </td>
                <td>
                    ${item.imageUrl ? `
                        <img src="${item.imageUrl}" 
                             alt="Detection" 
                             class="image-thumbnail" 
                             onclick="showImageModal('${item.imageUrl}')"
                             onerror="this.src='https://via.placeholder.com/80x60?text=No+Image'">
                    ` : `
                        <span class="text-muted">No image</span>
                    `}
                </td>
                <td>
                    <button class="btn btn-sm btn-outline-primary" onclick="viewDetails(${item.id})" title="View Details">
                        <i class="fas fa-eye"></i>
                    </button>
                </td>
            </tr>
        `;
    });
    
    tbody.innerHTML = tableHTML;
}

// Helper function to format time
function formatTime(timestamp) {
    if (!timestamp) return '';
    try {
        const date = new Date(timestamp);
        return date.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        });
    } catch (e) {
        return '';
    }
}

// Show image in modal
function showImageModal(imageUrl) {
    document.getElementById('modal-image').src = imageUrl;
    const modal = new bootstrap.Modal(document.getElementById('imageModal'));
    modal.show();
}

// View details (placeholder)
function viewDetails(id) {
    // You can implement detailed view modal here
    alert(`Viewing details for record ID: ${id}\n\nFeature coming soon!`);
}

// Update connection status
function showConnectionStatus(isConnected) {
    const indicator = document.getElementById('status-indicator');
    const statusText = document.getElementById('connection-status');
    const apiStatus = document.querySelector('#api-status .badge');
    
    if (isConnected) {
        indicator.className = 'status-indicator status-online pulse';
        statusText.textContent = 'Connected';
        if (apiStatus) {
            apiStatus.className = 'badge bg-success';
            apiStatus.textContent = 'Online';
        }
    } else {
        indicator.className = 'status-indicator status-offline';
        statusText.textContent = 'Disconnected';
        if (apiStatus) {
            apiStatus.className = 'badge bg-danger';
            apiStatus.textContent = 'Offline';
        }
    }
}

// Show/hide loading state
function showLoading(show) {
    const refreshIcon = document.getElementById('refresh-icon');
    if (refreshIcon) {
        if (show) {
            refreshIcon.classList.add('fa-spin');
        } else {
            refreshIcon.classList.remove('fa-spin');
        }
    }
}

// Update last updated time
function updateLastUpdated() {
    const now = new Date();
    const timeString = now.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });
    const dateElement = document.getElementById('last-updated');
    if (dateElement) {
        dateElement.textContent = timeString;
    }
}

// Test API connection
async function testAPIConnection() {
    try {
        const response = await fetch(`${API_BASE}?action=test`);
        const data = await response.json();
        return data.success;
    } catch (error) {
        return false;
    }
}

// Export data function
function exportData(format = 'csv') {
    alert(`Exporting data as ${format.toUpperCase()}...\n\nFeature coming soon!`);
    // Implement export functionality here
}

