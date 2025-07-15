// Dashboard Interactivity
function setTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('theme', theme);
}
function toggleTheme() {
  const current = localStorage.getItem('theme') || 'light';
  setTheme(current === 'light' ? 'dark' : 'light');
}
function renderDashboardCards(summary) {
  const cards = [
    { title: 'Total Assets', value: summary.total_assets, icon: '📦' },
    { title: 'Assets by Category', value: Object.entries(summary.by_category).map(([cat, count]) => `<div><strong>${cat}:</strong> ${count}</div>`).join(''), icon: '🗂️' },
    { title: 'Assets in Maintenance', value: summary.by_status.maintenance || 0, icon: '🛠️' },
  ];
  return `<div class='dashboard-cards' style='display:flex;gap:32px;margin-bottom:32px;'>${cards.map(card => `
    <div class='glass' style='flex:1;min-width:180px;padding:24px 20px;display:flex;flex-direction:column;align-items:flex-start;gap:8px;'>
      <div style='font-size:2.2rem;'>${card.icon}</div>
      <div style='font-size:2.1rem;font-weight:bold;'>${card.value}</div>
      <div style='font-size:1.1rem;color:var(--accent);'>${card.title}</div>
    </div>
  `).join('')}</div>`;
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
function loadDashboardData() {
  Promise.all([
    fetch('/dashboard_summary_api/').then(r => r.json()),
    fetch('/dashboard_activity_api/').then(r => r.json())
  ]).then(([summary, activity]) => {
    const widgets = [
      renderDashboardCards(summary),
      renderActivityTable(activity.activity)
    ].join('');
    document.getElementById('dashboard-widgets').innerHTML = widgets;
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
  // Optionally, refresh every 60s for real-time effect
  setInterval(loadDashboardData, 60000);
}); 