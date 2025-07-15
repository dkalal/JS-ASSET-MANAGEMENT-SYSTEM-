// Dashboard Interactivity
function setTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('theme', theme);
}
function toggleTheme() {
  const current = localStorage.getItem('theme') || 'light';
  setTheme(current === 'light' ? 'dark' : 'light');
}

// Icon and color mapping for KPIs
const KPI_CONFIG = [
  { key: 'total_assets', label: 'Total Assets', icon: '📦', color: '#00A6EB', filter: {} },
  { key: 'active_assets', label: 'Active Assets', icon: '🟢', color: '#28a745', filter: { status: 'active' } },
  { key: 'maintenance_assets', label: 'In Maintenance', icon: '🛠️', color: '#ffc107', filter: { status: 'maintenance' } },
  { key: 'retired_assets', label: 'Retired Assets', icon: '🗑️', color: '#6c757d', filter: { status: 'retired' } },
  { key: 'lost_assets', label: 'Lost Assets', icon: '❌', color: '#dc3545', filter: { status: 'lost' } },
  { key: 'assigned_assets', label: 'Assigned', icon: '👤', color: '#007bff', filter: { assigned: 'yes' } },
  { key: 'unassigned_assets', label: 'Unassigned', icon: '👥', color: '#adb5bd', filter: { assigned: 'no' } },
  { key: 'warranty_expiring_soon', label: 'Warranty Expiring Soon', icon: '⏳', color: '#fd7e14', filter: { warranty: 'expiring' } },
  { key: 'transferred_assets', label: 'Transferred', icon: '🔄', color: '#6610f2', filter: { status: 'transferred' } },
];

function kpiCardUrl(filter) {
  // Build a URL to the asset list with query params for filtering
  const params = new URLSearchParams();
  if (filter.status) params.set('status', filter.status);
  if (filter.assigned === 'yes') params.set('assigned', 'yes');
  if (filter.assigned === 'no') params.set('assigned', 'no');
  if (filter.warranty === 'expiring') params.set('warranty', 'expiring');
  // Add more filters as needed
  return '/assets/?' + params.toString();
}

function renderDashboardCards(summary) {
  const kpis = summary.kpis || {};
  const trends = summary.trends || {};
  return `<div class='dashboard-cards' style='display:flex;flex-wrap:wrap;gap:32px;margin-bottom:32px;'>${KPI_CONFIG.map(card => {
    const value = kpis[card.key] !== undefined ? kpis[card.key] : '-';
    const trend = trends[`${card.key}_monthly_change`] || '';
    const tooltip = `${card.label}${trend ? ` | Change: ${trend}` : ''}`;
    return `
      <a href="${kpiCardUrl(card.filter)}" class='kpi-card glass' tabindex="0" aria-label="${tooltip}" title="${tooltip}" style="
        flex:1;min-width:180px;max-width:220px;padding:24px 20px;display:flex;flex-direction:column;align-items:flex-start;gap:8px;
        border-left:6px solid ${card.color};text-decoration:none;color:inherit;transition:box-shadow 0.2s;outline:none;">
        <div style='font-size:2.2rem;'>${card.icon}</div>
        <div style='font-size:2.1rem;font-weight:bold;'>${value}</div>
        <div style='font-size:1.1rem;color:var(--accent);'>${card.label}</div>
        ${trend ? `<div style='font-size:0.95rem;color:#888;'>${trend}</div>` : ''}
      </a>
    `;
  }).join('')}</div>`;
}

function renderActivityTable(activity) {
  return `
    <div class='glass' style='padding:24px;'>
      <div style='font-size:1.2rem;font-weight:bold;margin-bottom:12px;'>Recent Activity Logs</div>
      <div style='overflow-x:auto;'>
      <table class='table' style='width:100%;background:transparent;'>
        <thead><tr>
          <th>User</th><th>Action</th><th>Asset</th><th>Timestamp</th><th>Details</th>
        </tr></thead>
        <tbody>
          ${activity.map(log => `
            <tr>
              <td>${log.user}</td>
              <td>${log.action}</td>
              <td>${log.asset}</td>
              <td>${log.timestamp}</td>
              <td>${log.details || ''}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
      </div>
    </div>
  `;
}

function renderActivityFeed(listId, data, type) {
    const ul = document.getElementById(listId);
    ul.innerHTML = '';
    if (!data || data.length === 0) {
        const li = document.createElement('li');
        li.className = 'text-muted text-center py-2';
        li.innerHTML = `<i class='bi bi-info-circle me-2'></i>No recent ${type}.`;
        ul.appendChild(li);
        return;
    }
    data.forEach(item => {
        const li = document.createElement('li');
        li.className = 'activity-item py-2 border-bottom';
        let icon = '';
        let main = '';
        let details = '';
        switch (type) {
            case 'added assets':
                icon = "<i class='bi bi-plus-circle text-success me-2'></i>";
                main = `<strong>${item.asset_name || 'Asset'}</strong>`;
                details = `by <span class='text-primary'>${item.user}</span> on <span class='text-secondary'>${item.timestamp}</span>`;
                break;
            case 'scans':
                icon = "<i class='bi bi-upc-scan text-info me-2'></i>";
                main = `<strong>${item.asset_name || 'Asset'}</strong>`;
                details = `scanned by <span class='text-primary'>${item.user}</span> on <span class='text-secondary'>${item.timestamp}</span>`;
                break;
            case 'transfers':
                icon = "<i class='bi bi-arrow-left-right text-warning me-2'></i>";
                main = `<strong>${item.asset_name || 'Asset'}</strong>`;
                details = `from <span class='text-primary'>${item.from_user}</span> to <span class='text-success'>${item.to_user}</span> on <span class='text-secondary'>${item.timestamp}</span>`;
                break;
            case 'maintenance':
                icon = "<i class='bi bi-tools text-danger me-2'></i>";
                main = `<strong>${item.asset_name || 'Asset'}</strong>`;
                details = `by <span class='text-primary'>${item.user}</span> on <span class='text-secondary'>${item.timestamp}</span>`;
                break;
            case 'audit log':
                icon = "<i class='bi bi-clipboard-data text-secondary me-2'></i>";
                main = `<strong>${item.action}</strong> - <span>${item.asset_name || ''}</span>`;
                details = `by <span class='text-primary'>${item.user}</span> on <span class='text-secondary'>${item.timestamp}</span>`;
                break;
        }
        li.innerHTML = `${icon} ${main}<br><small>${details}</small>`;
        if (item.asset_id) {
            li.innerHTML = `<a href="/assets/${item.asset_id}/" class="text-decoration-none">${li.innerHTML}</a>`;
        }
        ul.appendChild(li);
    });
}

function fetchAndRenderActivityFeeds() {
    fetch('/recent-added-assets-api/').then(res => res.json()).then(data => {
        renderActivityFeed('recent-added-assets', data.recent_added_assets, 'added assets');
    });
    fetch('/recent-scans-api/').then(res => res.json()).then(data => {
        renderActivityFeed('recent-scans', data.recent_scans, 'scans');
    });
    fetch('/recent-transfers-api/').then(res => res.json()).then(data => {
        renderActivityFeed('recent-transfers', data.recent_transfers, 'transfers');
    });
    fetch('/recent-maintenance-api/').then(res => res.json()).then(data => {
        renderActivityFeed('recent-maintenance', data.recent_maintenance, 'maintenance');
    });
    const auditLogUl = document.getElementById('audit-log');
    if (auditLogUl) {
        fetch('/full-audit-log-api/').then(res => res.json()).then(data => {
            renderActivityFeed('audit-log', data.audit_log, 'audit log');
        });
    }
}

function loadDashboardData() {
  Promise.all([
    fetch('/dashboard_summary_api/').then(r => r.json())
    // Removed fetch('/dashboard_activity_api/') and renderActivityTable
  ]).then(([summary]) => {
    const widgets = [
      renderDashboardCards(summary)
      // Removed legacy activity table rendering
    ].join('');
    document.getElementById('dashboard-widgets').innerHTML = widgets;
  });
}

// Chart.js integration for dashboard charts
function renderDashboardCharts() {
  const chartConfigs = [
    { id: 'chart-category', type: 'doughnut', chart: 'category', label: 'Assets by Category' },
    { id: 'chart-acquisition', type: 'line', chart: 'acquisition', label: 'Asset Acquisition Over Time' },
    { id: 'chart-department', type: 'pie', chart: 'department', label: 'Assets by Department' },
    { id: 'chart-location', type: 'pie', chart: 'location', label: 'Assets by Location' },
    { id: 'chart-depreciation', type: 'line', chart: 'depreciation', label: 'Depreciation / Value Trend' },
  ];
  chartConfigs.forEach(cfg => {
    fetch(`/dashboard_chart_data_api/?chart=${cfg.chart}`)
      .then(r => r.json())
      .then(data => {
        const ctx = document.getElementById(cfg.id);
        if (!ctx) return;
        // Destroy previous chart instance if exists
        if (ctx._chartInstance) {
          ctx._chartInstance.destroy();
        }
        if (!data || !data.labels || !data.data || data.data.every(v => v === 0)) {
          ctx.parentNode.querySelector('h5').innerHTML += ' <span style="color:#888;font-size:0.95rem;">(No data)</span>';
          return;
        }
        ctx._chartInstance = new Chart(ctx, {
          type: cfg.type,
          data: {
            labels: data.labels,
            datasets: [{
              label: cfg.label,
              data: data.data,
              backgroundColor: [
                '#00A6EB','#28a745','#ffc107','#6c757d','#dc3545','#007bff','#adb5bd','#fd7e14','#6610f2','#17a2b8','#343a40'
              ],
              borderColor: '#fff',
              borderWidth: 1,
              fill: cfg.type === 'line' ? true : false,
              tension: 0.3
            }]
          },
          options: {
            responsive: true,
            plugins: {
              legend: { display: cfg.type !== 'line' },
              tooltip: { enabled: true },
              title: { display: false }
            },
            scales: cfg.type === 'line' ? {
              x: { display: true, title: { display: false } },
              y: { display: true, beginAtZero: true }
            } : {}
          }
        });
      })
      .catch(() => {
        const ctx = document.getElementById(cfg.id);
        if (ctx) ctx.parentNode.querySelector('h5').innerHTML += ' <span style="color:#888;font-size:0.95rem;">(Error loading data)</span>';
      });
  });
}

function renderDepreciationChart(apiResponse) {
    const container = document.getElementById('depreciation-chart-container');
    // Clear previous content
    container.innerHTML = '';

    // Check for no data or message from API
    if (!apiResponse.data || apiResponse.data.length === 0) {
        const msg = document.createElement('div');
        msg.className = 'no-data-message text-muted text-center py-4';
        msg.setAttribute('role', 'status');
        msg.setAttribute('aria-live', 'polite');
        msg.innerHTML = `<i class='bi bi-info-circle me-2'></i>${apiResponse.message || 'No data available for depreciation trend.'}`;
        container.appendChild(msg);
        return;
    }

    // Render the chart as usual
    const canvas = document.createElement('canvas');
    canvas.setAttribute('aria-label', 'Depreciation/Value Trend Chart');
    container.appendChild(canvas);
    new Chart(canvas.getContext('2d'), {
        type: 'line',
        data: {
            labels: apiResponse.labels,
            datasets: [{
                label: 'Depreciated Value',
                data: apiResponse.data,
                borderColor: '#007bff',
                backgroundColor: 'rgba(0,123,255,0.1)',
                fill: true,
                tension: 0.3
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { display: false },
                tooltip: { enabled: true }
            },
            scales: {
                y: { beginAtZero: true, title: { display: true, text: 'Value' } },
                x: { title: { display: true, text: 'Month' } }
            }
        }
    });
}

function renderActivityLogTable(data, page, numPages, total) {
    const tbody = document.getElementById('activity-log-tbody');
    tbody.innerHTML = '';
    if (!data || data.length === 0) {
        const tr = document.createElement('tr');
        tr.innerHTML = `<td colspan="5" class="text-center text-muted">No activity logs found.</td>`;
        tbody.appendChild(tr);
    } else {
        data.forEach(item => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${item.user || ''}</td>
                <td>${item.action || ''}</td>
                <td>${item.asset_name ? `<a href='/assets/${item.asset_id}/'>${item.asset_name}</a>` : ''}</td>
                <td>${item.timestamp || ''}</td>
                <td>${item.details || ''}</td>
            `;
            tbody.appendChild(tr);
        });
    }
    // Update pagination info
    document.getElementById('activity-log-page-info').textContent = `Page ${page} of ${numPages} (${total} logs)`;
    // Enable/disable buttons
    document.getElementById('activity-log-prev').disabled = (page <= 1);
    document.getElementById('activity-log-next').disabled = (page >= numPages);
}

function fetchAndRenderActivityLogTable(page = 1) {
    fetch(`/full-audit-log-api/?page=${page}&page_size=10`)
        .then(res => res.json())
        .then(data => {
            renderActivityLogTable(data.audit_log, data.page, data.num_pages, data.total);
            // Store current page for navigation
            window._activityLogCurrentPage = data.page;
            window._activityLogNumPages = data.num_pages;
        });
}

document.addEventListener('DOMContentLoaded', function() {
  // Theme toggle button
  const themeBtn = document.getElementById('theme-toggle-btn');
  if (themeBtn) {
    themeBtn.addEventListener('click', toggleTheme);
  }
  // Set initial theme
  const savedTheme = localStorage.getItem('theme') || 'light';
  setTheme(savedTheme);
  // Sidebar collapse (future)
  // Dropdowns, tooltips, etc. (future)
  loadDashboardData();
  renderDashboardCharts();
  fetchAndRenderActivityFeeds();
  fetchAndRenderActivityLogTable();
  document.getElementById('activity-log-prev').addEventListener('click', function() {
        if (window._activityLogCurrentPage > 1) {
            fetchAndRenderActivityLogTable(window._activityLogCurrentPage - 1);
        }
    });
    document.getElementById('activity-log-next').addEventListener('click', function() {
        if (window._activityLogCurrentPage < window._activityLogNumPages) {
            fetchAndRenderActivityLogTable(window._activityLogCurrentPage + 1);
        }
    });
  // Optionally, refresh every 60s for real-time effect
  setInterval(loadDashboardData, 60000);
  setInterval(renderDashboardCharts, 60000);
}); 