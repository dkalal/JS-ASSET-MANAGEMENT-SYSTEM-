// Profile Page JS (moved from inline script in profile.html for CSP compliance)

// --- Pagination State ---
const assignedAssetsPagination = { page: 1, numPages: 1, pageSize: 5 };
const userActivityPagination = { page: 1, numPages: 1, pageSize: 5 };

function updateAssignedAssetsPaginationControls() {
  const prevBtn = document.getElementById('assigned-assets-prev');
  const nextBtn = document.getElementById('assigned-assets-next');
  const pageInfo = document.getElementById('assigned-assets-page-info');
  if (prevBtn && nextBtn && pageInfo) {
    prevBtn.disabled = assignedAssetsPagination.page <= 1;
    nextBtn.disabled = assignedAssetsPagination.page >= assignedAssetsPagination.numPages;
    pageInfo.textContent = `Page ${assignedAssetsPagination.page} of ${assignedAssetsPagination.numPages}`;
  }
}

function updateUserActivityPaginationControls() {
  const prevBtn = document.getElementById('user-activity-prev');
  const nextBtn = document.getElementById('user-activity-next');
  const pageInfo = document.getElementById('user-activity-page-info');
  if (prevBtn && nextBtn && pageInfo) {
    prevBtn.disabled = userActivityPagination.page <= 1;
    nextBtn.disabled = userActivityPagination.page >= userActivityPagination.numPages;
    pageInfo.textContent = `Page ${userActivityPagination.page} of ${userActivityPagination.numPages}`;
  }
}

function loadAssignedAssets(page = 1) {
  const tableBody = document.getElementById('assigned-assets-table-body');
  const emptyDiv = document.getElementById('assigned-assets-empty');
  const countSpan = document.getElementById('assigned-assets-count');
  tableBody.innerHTML = '';
  emptyDiv.classList.add('d-none');
  fetch(`/api/user-assets/?page=${page}&page_size=${assignedAssetsPagination.pageSize}`)
    .then(res => {
      if (!res.ok) throw new Error('Network error');
      if (res.redirected) window.location.href = res.url;
      return res.json();
    })
    .then(data => {
      assignedAssetsPagination.page = data.page || 1;
      assignedAssetsPagination.numPages = data.num_pages || 1;
      updateAssignedAssetsPaginationControls();
      if (data.assets && data.assets.length) {
        data.assets.forEach((a, idx) => {
          const tr = document.createElement('tr');
          tr.innerHTML = `
            <td>${a.name || ''}</td>
            <td>${a.serial || ''}</td>
            <td>${a.assigned || ''}</td>
            <td>${a.status || ''}</td>
          `;
          if (idx % 2 === 1) tr.classList.add('table-active');
          tableBody.appendChild(tr);
        });
        if (countSpan) countSpan.textContent = data.total ? `${data.total} total` : data.assets.length + ' total';
      } else {
        emptyDiv.classList.remove('d-none');
        if (countSpan) countSpan.textContent = '0';
      }
    })
    .catch(e => {
      emptyDiv.classList.remove('d-none');
      emptyDiv.textContent = 'Unable to load assigned assets. Please log in again.';
      if (countSpan) countSpan.textContent = '0';
    });
}

function loadUserActivity(page = 1) {
  const tableBody = document.getElementById('user-activity-table-body');
  const emptyDiv = document.getElementById('user-activity-empty');
  const countSpan = document.getElementById('user-activity-count');
  tableBody.innerHTML = '';
  emptyDiv.classList.add('d-none');
  fetch(`/api/user-activity/?page=${page}&page_size=${userActivityPagination.pageSize}`)
    .then(res => {
      if (!res.ok) throw new Error('Network error');
      if (res.redirected) window.location.href = res.url;
      return res.json();
    })
    .then(data => {
      userActivityPagination.page = data.page || 1;
      userActivityPagination.numPages = data.num_pages || 1;
      updateUserActivityPaginationControls();
      if (data.logs && data.logs.length) {
        data.logs.forEach((l, idx) => {
          const tr = document.createElement('tr');
          tr.innerHTML = `
            <td>${l.action || ''}</td>
            <td>${l.asset || ''}</td>
            <td>${l.time || ''}</td>
            <td>${l.details || ''}</td>
          `;
          if (idx % 2 === 1) tr.classList.add('table-active');
          tableBody.appendChild(tr);
        });
        if (countSpan) countSpan.textContent = data.total ? `${data.total} total` : data.logs.length + ' total';
      } else {
        emptyDiv.classList.remove('d-none');
        if (countSpan) countSpan.textContent = '0';
      }
    })
    .catch(e => {
      emptyDiv.classList.remove('d-none');
      emptyDiv.textContent = 'Unable to load recent activity. Please log in again.';
      if (countSpan) countSpan.textContent = '0';
    });
}

function refreshCategoryDropdowns(newCategory) {
  // Find all category <select> elements by common IDs or names
  const selects = [
    ...document.querySelectorAll('select[name="category"], select#category-select, select#id_category')
  ];
  selects.forEach(select => {
    // Fetch latest categories from backend
    fetch('/api/categories/')
      .then(res => res.json())
      .then(data => {
        if (data.success && Array.isArray(data.categories)) {
          // Clear and repopulate options
          select.innerHTML = '<option value="">All</option>';
          data.categories.forEach(cat => {
            const opt = document.createElement('option');
            opt.value = cat.id;
            opt.textContent = cat.name;
            if (newCategory && cat.id === newCategory.id) {
              opt.selected = true;
            }
            select.appendChild(opt);
          });
        }
      });
  });
}

document.addEventListener('DOMContentLoaded', function() {
  // Edit profile logic
  const editBtn = document.getElementById('edit-profile-btn');
  const form = document.getElementById('profile-form');
  const cancelBtn = document.getElementById('cancel-edit-profile');
  if (editBtn && form && cancelBtn) {
    editBtn.addEventListener('click', () => { form.classList.remove('d-none'); editBtn.classList.add('d-none'); });
    cancelBtn.addEventListener('click', () => { form.classList.add('d-none'); editBtn.classList.remove('d-none'); });
  }
  // Theme preference (robust, professional)
  const themeSelect = document.getElementById('theme-select');
  if (themeSelect) {
    // Set initial value from localStorage or default
    const savedTheme = localStorage.getItem('theme') || 'light';
    themeSelect.value = savedTheme;
    document.documentElement.setAttribute('data-theme', savedTheme);
    // Feedback toast/alert
    function showPrefToast(msg) {
      let toast = document.getElementById('pref-toast');
      if (!toast) {
        toast = document.createElement('div');
        toast.id = 'pref-toast';
        toast.style.position = 'fixed';
        toast.style.bottom = '32px';
        toast.style.right = '32px';
        toast.style.zIndex = 9999;
        toast.style.background = 'rgba(23,107,135,0.98)';
        toast.style.color = '#fff';
        toast.style.padding = '12px 24px';
        toast.style.borderRadius = '8px';
        toast.style.boxShadow = '0 4px 16px 0 rgba(0,0,0,0.12)';
        toast.style.fontSize = '1rem';
        toast.style.transition = 'opacity 0.3s';
        document.body.appendChild(toast);
      }
      toast.textContent = msg;
      toast.style.opacity = 1;
      setTimeout(() => { toast.style.opacity = 0; }, 1800);
    }
    themeSelect.addEventListener('change', function() {
      localStorage.setItem('theme', this.value);
      document.documentElement.setAttribute('data-theme', this.value);
      showPrefToast(`Theme set to ${this.value.charAt(0).toUpperCase() + this.value.slice(1)}`);
    });
  }
  // Future: Language/notification preference persistence
  // const langSelect = document.getElementById('language-select');
  // const notifSelect = document.getElementById('notif-select');
  // ... add similar logic for saving to localStorage or backend when enabled ...
  // Assigned assets AJAX
  function showLoading(target) {
    document.getElementById(target).innerHTML = '<div class="d-flex align-items-center justify-content-center py-3"><div class="spinner-border text-primary me-2" role="status" aria-label="Loading"></div> <span>Loading...</span></div>';
  }
  function showError(target, msg) {
    document.getElementById(target).innerHTML = `<div class='alert alert-danger text-center mb-0'>${msg}</div>`;
  }
  // Pagination event listeners
  document.getElementById('assigned-assets-prev').addEventListener('click', function() {
    if (assignedAssetsPagination.page > 1) {
      assignedAssetsPagination.page--;
      loadAssignedAssets(assignedAssetsPagination.page);
    }
  });
  document.getElementById('assigned-assets-next').addEventListener('click', function() {
    if (assignedAssetsPagination.page < assignedAssetsPagination.numPages) {
      assignedAssetsPagination.page++;
      loadAssignedAssets(assignedAssetsPagination.page);
    }
  });
  document.getElementById('user-activity-prev').addEventListener('click', function() {
    if (userActivityPagination.page > 1) {
      userActivityPagination.page--;
      loadUserActivity(userActivityPagination.page);
    }
  });
  document.getElementById('user-activity-next').addEventListener('click', function() {
    if (userActivityPagination.page < userActivityPagination.numPages) {
      userActivityPagination.page++;
      loadUserActivity(userActivityPagination.page);
    }
  });
  // Initial load
  loadAssignedAssets();
  loadUserActivity();
  
  // View My Permissions functionality
  const viewMyPermissionsBtn = document.getElementById('viewMyPermissions');
  const userPermissionsSummary = document.getElementById('user-permissions-summary');
  const currentUserPermissions = document.getElementById('current-user-permissions');
  
  if (viewMyPermissionsBtn) {
    viewMyPermissionsBtn.addEventListener('click', function() {
      if (userPermissionsSummary.classList.contains('d-none')) {
        loadCurrentUserPermissions();
        userPermissionsSummary.classList.remove('d-none');
        this.textContent = 'Hide My Permissions';
      } else {
        userPermissionsSummary.classList.add('d-none');
        this.textContent = 'View My Permissions';
      }
    });
  }
  
  function loadCurrentUserPermissions() {
    if (!currentUserPermissions) return;
    
    // Get current user role from the page
    const userRole = document.querySelector('.badge').textContent.toLowerCase();
    
    const permissions = {
      admin: [
        { name: 'View Assets', icon: 'bi-eye', color: 'success' },
        { name: 'Create Assets', icon: 'bi-plus-circle', color: 'primary' },
        { name: 'Edit Assets', icon: 'bi-pencil', color: 'warning' },
        { name: 'Delete Assets', icon: 'bi-trash', color: 'danger' },
        { name: 'Manage Users', icon: 'bi-people', color: 'info' },
        { name: 'View Reports', icon: 'bi-graph-up', color: 'secondary' },
        { name: 'Export Data', icon: 'bi-download', color: 'dark' },
        { name: 'System Admin', icon: 'bi-gear', color: 'danger' }
      ],
      manager: [
        { name: 'View Assets', icon: 'bi-eye', color: 'success' },
        { name: 'Create Assets', icon: 'bi-plus-circle', color: 'primary' },
        { name: 'Edit Assets', icon: 'bi-pencil', color: 'warning' },
        { name: 'View Reports', icon: 'bi-graph-up', color: 'secondary' },
        { name: 'Export Data', icon: 'bi-download', color: 'dark' }
      ],
      user: [
        { name: 'View Assets', icon: 'bi-eye', color: 'success' }
      ]
    };
    
    const userPermissions = permissions[userRole] || [];
    currentUserPermissions.innerHTML = '';
    
    userPermissions.forEach(perm => {
      const permDiv = document.createElement('div');
      permDiv.className = 'col-md-6 col-lg-4';
      permDiv.innerHTML = `
        <div class="d-flex align-items-center p-2 bg-light rounded">
          <i class="${perm.icon} text-${perm.color} me-2"></i>
          <small class="fw-semibold">${perm.name}</small>
        </div>
      `;
      currentUserPermissions.appendChild(permDiv);
    });
  }

  // --- Admin: Create Category Custom Modal Logic ---
  const openCreateCategoryBtn = document.getElementById('openCreateCategoryModal');
  const createCategoryModalCustom = document.getElementById('createCategoryModalCustom');
  const closeCreateCategoryModalBtn = document.getElementById('closeCreateCategoryModal');
  const cancelCreateCategoryModalBtn = document.getElementById('cancelCreateCategoryModal');
  const createCategoryForm = document.getElementById('create-category-form');
  const createCategoryFeedback = document.getElementById('create-category-feedback');
  function openCreateCategoryModal() {
    createCategoryForm.reset();
    createCategoryFeedback.innerHTML = '';
    createCategoryModalCustom.classList.add('active');
    createCategoryModalCustom.focus();
  }
  function closeCreateCategoryModal() {
    createCategoryModalCustom.classList.remove('active');
    createCategoryForm.reset();
    createCategoryFeedback.innerHTML = '';
  }
  if (openCreateCategoryBtn && createCategoryModalCustom) {
    openCreateCategoryBtn.addEventListener('click', openCreateCategoryModal);
  }
  if (closeCreateCategoryModalBtn) {
    closeCreateCategoryModalBtn.addEventListener('click', closeCreateCategoryModal);
  }
  if (cancelCreateCategoryModalBtn) {
    cancelCreateCategoryModalBtn.addEventListener('click', closeCreateCategoryModal);
  }
  if (createCategoryModalCustom) {
    createCategoryModalCustom.addEventListener('click', function(e) {
      if (e.target === createCategoryModalCustom) {
        closeCreateCategoryModal();
      }
    });
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape' && createCategoryModalCustom.classList.contains('active')) {
        closeCreateCategoryModal();
      }
    });
  }
  if (createCategoryForm) {
    createCategoryForm.addEventListener('submit', function(e) {
      e.preventDefault();
      createCategoryFeedback.innerHTML = '';
      const name = createCategoryForm.elements['name'].value.trim();
      const description = createCategoryForm.elements['description'].value.trim();
      if (!name) {
        createCategoryFeedback.innerHTML = '<div class="alert alert-danger">Category name is required.</div>';
        return;
      }
      // AJAX call to backend
      createCategoryFeedback.innerHTML = '<div class="alert alert-info">Creating category...</div>';
      const csrfToken = document.querySelector('[name=csrfmiddlewaretoken]')?.value;
      fetch('/api/create-category/', {
        method: 'POST',
        headers: {
          'X-CSRFToken': csrfToken,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({ name, description })
      })
      .then(res => res.json().then(data => ({ status: res.status, data })))
      .then(({ status, data }) => {
        if (status === 200 && data.success) {
          createCategoryFeedback.innerHTML = '<div class="alert alert-success">Category created successfully!</div>';
          refreshCategoryDropdowns(data.category);
          setTimeout(() => {
            closeCreateCategoryModal();
          }, 1200);
        } else {
          createCategoryFeedback.innerHTML = `<div class="alert alert-danger">${data.error || 'Failed to create category.'}</div>`;
        }
      })
      .catch(() => {
        createCategoryFeedback.innerHTML = '<div class="alert alert-danger">Network error. Please try again.</div>';
      });
    });
  }
  // --- Admin: Permissions Management Custom Modal Logic ---
  const openPermissionsBtn = document.getElementById('openPermissionsModal');
  const permissionsModalCustom = document.getElementById('permissionsModalCustom');
  const closePermissionsModalBtn = document.getElementById('closePermissionsModal');
  const closePermissionsModalBtnFooter = document.getElementById('closePermissionsModalBtn');
  const permissionsFeedback = document.getElementById('permissions-feedback');
  const roleSelect = document.getElementById('role-select');
  const rolePermissions = document.getElementById('role-permissions');
  const selectedRoleName = document.getElementById('selected-role-name');
  const usersList = document.getElementById('users-list');

  function openPermissionsModal() {
    if (permissionsFeedback) permissionsFeedback.innerHTML = '';
    if (permissionsModalCustom) {
      permissionsModalCustom.classList.add('active');
      permissionsModalCustom.focus();
      loadUsersList();
    }
  }

  function closePermissionsModal() {
    if (permissionsModalCustom) permissionsModalCustom.classList.remove('active');
    if (permissionsFeedback) permissionsFeedback.innerHTML = '';
    if (roleSelect) roleSelect.value = '';
    if (rolePermissions) rolePermissions.classList.add('d-none');
  }

  let usersData = { page: 1, numPages: 1, users: [] };
  let searchTimeout;

  function loadUsersList(page = 1, search = '') {
    if (!usersList) return;
    usersList.innerHTML = '<tr><td colspan="3" class="text-center"><div class="spinner-border spinner-border-sm me-2"></div>Loading users...</td></tr>';
    
    const params = new URLSearchParams({ page, search });
    fetch(`/api/users/?${params}`)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          usersData = data;
          renderUsersList(data.users);
          updateUsersPagination();
        } else {
          showPermissionsFeedback('Failed to load users', 'danger');
        }
      })
      .catch(() => {
        showPermissionsFeedback('Network error loading users', 'danger');
      });
  }

  function renderUsersList(users) {
    if (!usersList) return;
    usersList.innerHTML = '';
    
    if (!users.length) {
      usersList.innerHTML = '<tr><td colspan="3" class="text-center text-muted">No users found</td></tr>';
      return;
    }
    
    users.forEach(user => {
      const tr = document.createElement('tr');
      const roleColor = user.role === 'admin' ? 'danger' : user.role === 'manager' ? 'warning' : 'secondary';
      tr.innerHTML = `
        <td>
          <div class="fw-semibold">${user.full_name}</div>
          <small class="text-muted">${user.email}</small>
        </td>
        <td><span class="badge bg-${roleColor}">${user.role}</span></td>
        <td>
          <button class="btn btn-sm btn-outline-primary" onclick="openEditUserRole(${user.id}, '${user.full_name}', '${user.role}')" title="Edit Role">
            <i class="bi bi-pencil"></i>
          </button>
        </td>
      `;
      usersList.appendChild(tr);
    });
  }

  function updateUsersPagination() {
    const prevBtn = document.getElementById('users-prev');
    const nextBtn = document.getElementById('users-next');
    const pageInfo = document.getElementById('users-page-info');
    
    if (prevBtn && nextBtn && pageInfo) {
      prevBtn.disabled = usersData.page <= 1;
      nextBtn.disabled = usersData.page >= usersData.num_pages;
      pageInfo.textContent = `Page ${usersData.page} of ${usersData.num_pages}`;
    }
  }

  function showPermissionsFeedback(msg, type = 'info') {
    if (permissionsFeedback) {
      permissionsFeedback.innerHTML = `<div class="alert alert-${type} alert-dismissible fade show"><button type="button" class="btn-close" data-bs-dismiss="alert"></button>${msg}</div>`;
    }
  }

  function showRolePermissions(role) {
    if (!rolePermissions || !selectedRoleName) return;
    
    selectedRoleName.textContent = role.charAt(0).toUpperCase() + role.slice(1);
    rolePermissions.classList.remove('d-none');
    
    // Set permissions based on role
    const permissions = {
      admin: ['perm-view-assets', 'perm-create-assets', 'perm-edit-assets', 'perm-delete-assets', 'perm-manage-users', 'perm-view-reports', 'perm-export-data', 'perm-system-admin'],
      manager: ['perm-view-assets', 'perm-create-assets', 'perm-edit-assets', 'perm-view-reports', 'perm-export-data'],
      user: ['perm-view-assets']
    };
    
    // Reset all checkboxes
    document.querySelectorAll('.permissions-grid input[type="checkbox"]').forEach(cb => {
      cb.checked = false;
    });
    
    // Check permissions for selected role
    if (permissions[role]) {
      permissions[role].forEach(permId => {
        const checkbox = document.getElementById(permId);
        if (checkbox) checkbox.checked = true;
      });
    }
  }

  // Event listeners for permissions modal
  if (openPermissionsBtn && permissionsModalCustom) {
    openPermissionsBtn.addEventListener('click', openPermissionsModal);
  }
  
  if (closePermissionsModalBtn) {
    closePermissionsModalBtn.addEventListener('click', closePermissionsModal);
  }
  
  if (closePermissionsModalBtnFooter) {
    closePermissionsModalBtnFooter.addEventListener('click', closePermissionsModal);
  }
  
  if (roleSelect) {
    roleSelect.addEventListener('change', function() {
      if (this.value) {
        showRolePermissions(this.value);
      } else {
        rolePermissions.classList.add('d-none');
      }
    });
  }
  
  if (permissionsModalCustom) {
    permissionsModalCustom.addEventListener('click', function(e) {
      if (e.target === permissionsModalCustom) {
        closePermissionsModal();
      }
    });
    
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape' && permissionsModalCustom.classList.contains('active')) {
        closePermissionsModal();
      }
    });
  }

  // User role editing functionality
  let currentEditUserId = null;
  const editUserRoleModal = document.getElementById('editUserRoleModal');
  const editUserRoleForm = document.getElementById('edit-user-role-form');
  const editUserInfo = document.getElementById('edit-user-info');
  const editUserRoleSelect = document.getElementById('edit-user-role-select');
  const editRoleFeedback = document.getElementById('edit-role-feedback');

  window.openEditUserRole = function(userId, userName, currentRole) {
    currentEditUserId = userId;
    if (editUserInfo) editUserInfo.innerHTML = `<strong>${userName}</strong><br><small>Current role: ${currentRole}</small>`;
    if (editUserRoleSelect) editUserRoleSelect.value = currentRole;
    if (editRoleFeedback) editRoleFeedback.innerHTML = '';
    if (editUserRoleModal) editUserRoleModal.classList.add('active');
  };

  function closeEditUserRoleModal() {
    if (editUserRoleModal) editUserRoleModal.classList.remove('active');
    currentEditUserId = null;
    if (editUserRoleForm) editUserRoleForm.reset();
    if (editRoleFeedback) editRoleFeedback.innerHTML = '';
  }

  // Event listeners for user role editing
  if (editUserRoleForm) {
    editUserRoleForm.addEventListener('submit', function(e) {
      e.preventDefault();
      if (!currentEditUserId) return;
      
      const newRole = editUserRoleSelect.value;
      if (!newRole) {
        editRoleFeedback.innerHTML = '<div class="alert alert-danger">Please select a role</div>';
        return;
      }
      
      editRoleFeedback.innerHTML = '<div class="alert alert-info">Updating role...</div>';
      
      const csrfToken = document.querySelector('[name=csrfmiddlewaretoken]')?.value;
      fetch('/api/users/update-role/', {
        method: 'POST',
        headers: {
          'X-CSRFToken': csrfToken,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          user_id: currentEditUserId,
          role: newRole
        })
      })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          editRoleFeedback.innerHTML = '<div class="alert alert-success">Role updated successfully!</div>';
          setTimeout(() => {
            closeEditUserRoleModal();
            loadUsersList(usersData.page, document.getElementById('user-search')?.value || '');
          }, 1000);
        } else {
          editRoleFeedback.innerHTML = `<div class="alert alert-danger">${data.error}</div>`;
        }
      })
      .catch(() => {
        editRoleFeedback.innerHTML = '<div class="alert alert-danger">Network error. Please try again.</div>';
      });
    });
  }

  // Close modal event listeners
  document.getElementById('closeEditUserRoleModal')?.addEventListener('click', closeEditUserRoleModal);
  document.getElementById('cancelEditUserRole')?.addEventListener('click', closeEditUserRoleModal);

  // Search functionality
  const userSearch = document.getElementById('user-search');
  if (userSearch) {
    userSearch.addEventListener('input', function() {
      clearTimeout(searchTimeout);
      searchTimeout = setTimeout(() => {
        loadUsersList(1, this.value);
      }, 300);
    });
  }

  // Pagination event listeners
  document.getElementById('users-prev')?.addEventListener('click', function() {
    if (usersData.page > 1) {
      loadUsersList(usersData.page - 1, userSearch?.value || '');
    }
  });

  document.getElementById('users-next')?.addEventListener('click', function() {
    if (usersData.page < usersData.num_pages) {
      loadUsersList(usersData.page + 1, userSearch?.value || '');
    }
  });

  // --- Admin: Dynamic Field Management Custom Modal Logic ---
  const openDynamicFieldBtn = document.getElementById('openDynamicFieldModal');
  const dynamicFieldModalCustom = document.getElementById('dynamicFieldModalCustom');
  const closeDynamicFieldModalBtn = document.getElementById('closeDynamicFieldModal');
  const cancelDfAddEditBtn = document.getElementById('cancelDfAddEditBtn');
  const dfAddEditForm = document.getElementById('df-add-edit-form');
  const dynamicFieldFeedback = document.getElementById('dynamic-field-feedback');
  const dfCategorySelect = document.getElementById('df-category-select');
  const dfFieldsSection = document.getElementById('df-fields-section');
  const dfFieldsTableBody = document.getElementById('df-fields-table-body');
  const dfFieldsEmpty = document.getElementById('df-fields-empty');
  const addDynamicFieldBtn = document.getElementById('addDynamicFieldBtn');
  const dfAddEditSection = document.getElementById('df-add-edit-section');
  const dfAddEditTitle = document.getElementById('df-add-edit-title');
  const dfKey = document.getElementById('df-key');
  const dfLabel = document.getElementById('df-label');
  const dfType = document.getElementById('df-type');
  const dfRequired = document.getElementById('df-required');
  const saveDfAddEditBtn = document.getElementById('saveDfAddEditBtn');

  let editingFieldId = null;
  let currentCategoryId = null;

  function openDynamicFieldModal() {
    if (dfAddEditForm) dfAddEditForm.reset();
    if (dynamicFieldFeedback) dynamicFieldFeedback.innerHTML = '';
    if (dynamicFieldModalCustom) {
      dynamicFieldModalCustom.classList.add('active');
      dynamicFieldModalCustom.focus();
    }
  }
  function closeDynamicFieldModal() {
    if (dynamicFieldModalCustom) dynamicFieldModalCustom.classList.remove('active');
    if (dfAddEditForm) dfAddEditForm.reset();
    if (dynamicFieldFeedback) dynamicFieldFeedback.innerHTML = '';
  }
  // --- Helper Functions ---
  function showDfFeedback(msg, type = 'info') {
    if (dynamicFieldFeedback) {
      dynamicFieldFeedback.innerHTML = `<div class="alert alert-${type}">${msg}</div>`;
    }
  }
  function clearDfFeedback() {
    if (dynamicFieldFeedback) dynamicFieldFeedback.innerHTML = '';
  }
  function resetDfAddEditForm() {
    dfKey.value = '';
    dfLabel.value = '';
    dfType.value = 'text';
    dfRequired.checked = false;
    editingFieldId = null;
    dfKey.disabled = false;
    dfAddEditTitle.textContent = 'Add Field';
    saveDfAddEditBtn.textContent = 'Save Field';
  }
  function showDfAddEditSection(edit = false, field = null) {
    dfAddEditSection.classList.remove('d-none');
    if (edit && field) {
      editingFieldId = field.id;
      dfKey.value = field.key;
      dfKey.disabled = true;
      dfLabel.value = field.label;
      dfType.value = field.type;
      dfRequired.checked = field.required;
      dfAddEditTitle.textContent = 'Edit Field';
      saveDfAddEditBtn.textContent = 'Update Field';
    } else {
      resetDfAddEditForm();
    }
  }
  function hideDfAddEditSection() {
    dfAddEditSection.classList.add('d-none');
    resetDfAddEditForm();
  }
  function renderDfFieldsTable(fields) {
    dfFieldsTableBody.innerHTML = '';
    if (!fields.length) {
      dfFieldsEmpty.classList.remove('d-none');
      dfFieldsSection.classList.remove('d-none');
      return;
    }
    dfFieldsEmpty.classList.add('d-none');
    fields.forEach(field => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${field.key}</td>
        <td>${field.label}</td>
        <td>${field.type.charAt(0).toUpperCase() + field.type.slice(1)}</td>
        <td>${field.required ? '<span class="badge bg-success">Yes</span>' : '<span class="badge bg-secondary">No</span>'}</td>
        <td>
          <button type="button" class="btn btn-sm btn-outline-primary me-1 df-edit-btn" data-id="${field.id}" title="Edit Field" aria-label="Edit Field"><i class="bi bi-pencil"></i></button>
          <button type="button" class="btn btn-sm btn-outline-danger df-delete-btn" data-id="${field.id}" title="Delete Field" aria-label="Delete Field"><i class="bi bi-trash"></i></button>
        </td>
      `;
      dfFieldsTableBody.appendChild(tr);
    });
    dfFieldsSection.classList.remove('d-none');
  }
  function fetchDfFields(categoryId) {
    dfFieldsSection.classList.add('d-none');
    dfFieldsTableBody.innerHTML = '';
    dfFieldsEmpty.classList.add('d-none');
    hideDfAddEditSection();
    if (!categoryId) return;
    showDfFeedback('Loading fields...', 'info');
    fetch(`/api/category/${categoryId}/fields/`)
      .then(res => res.json())
      .then(data => {
        clearDfFeedback();
        if (data.success) {
          renderDfFieldsTable(data.fields);
        } else {
          showDfFeedback(data.error || 'Failed to load fields.', 'danger');
        }
      })
      .catch(() => {
        showDfFeedback('Network error. Please try again.', 'danger');
      });
  }
  function populateDfCategoryDropdown(selectedId = null) {
    fetch('/api/categories/')
      .then(res => res.json())
      .then(data => {
        if (data.success && Array.isArray(data.categories)) {
          dfCategorySelect.innerHTML = '<option value="">-- Select Category --</option>';
          data.categories.forEach(cat => {
            const opt = document.createElement('option');
            opt.value = cat.id;
            opt.textContent = cat.name;
            if (selectedId && cat.id == selectedId) opt.selected = true;
            dfCategorySelect.appendChild(opt);
          });
        }
      });
  }
  // --- Event Listeners ---
  if (openDynamicFieldBtn && dynamicFieldModalCustom) {
    openDynamicFieldBtn.addEventListener('click', function() {
      populateDfCategoryDropdown();
      openDynamicFieldModal();
      hideDfAddEditSection();
      dfFieldsSection.classList.add('d-none');
      dfCategorySelect.value = '';
    });
  }
  if (dfCategorySelect) {
    dfCategorySelect.addEventListener('change', function() {
      currentCategoryId = this.value;
      if (currentCategoryId) {
        fetchDfFields(currentCategoryId);
      } else {
        dfFieldsSection.classList.add('d-none');
        hideDfAddEditSection();
      }
    });
  }
  if (addDynamicFieldBtn) {
    addDynamicFieldBtn.addEventListener('click', function() {
      showDfAddEditSection(false);
    });
  }
  if (dfFieldsTableBody) {
    dfFieldsTableBody.addEventListener('click', function(e) {
      if (e.target.closest('.df-edit-btn')) {
        const fieldId = e.target.closest('.df-edit-btn').dataset.id;
        // Find field data from table row
        const tr = e.target.closest('tr');
        const key = tr.children[0].textContent;
        const label = tr.children[1].textContent;
        const type = tr.children[2].textContent.toLowerCase();
        const required = tr.children[3].textContent.trim().toLowerCase() === 'yes';
        showDfAddEditSection(true, { id: fieldId, key, label, type, required });
      } else if (e.target.closest('.df-delete-btn')) {
        const fieldId = e.target.closest('.df-delete-btn').dataset.id;
        if (confirm('Are you sure you want to delete this field? This action cannot be undone.')) {
          showDfFeedback('Deleting field...', 'info');
          const csrfToken = document.querySelector('[name=csrfmiddlewaretoken]')?.value;
          fetch(`/api/field/${fieldId}/delete/`, {
            method: 'POST',
            headers: { 'X-CSRFToken': csrfToken },
          })
            .then(res => res.json())
            .then(data => {
              if (data.success) {
                showDfFeedback('Field deleted successfully.', 'success');
                fetchDfFields(currentCategoryId);
              } else {
                showDfFeedback(data.error || 'Failed to delete field.', 'danger');
              }
            })
            .catch(() => {
              showDfFeedback('Network error. Please try again.', 'danger');
            });
        }
      }
    });
  }
  if (dfAddEditForm) {
    dfAddEditForm.addEventListener('submit', function(e) {
      e.preventDefault();
      clearDfFeedback();
      if (!currentCategoryId) {
        showDfFeedback('Please select a category first.', 'danger');
        return;
      }
      const key = dfKey.value.trim();
      const label = dfLabel.value.trim();
      const type = dfType.value;
      const required = dfRequired.checked;
      if (!label || !type) {
        showDfFeedback('Label and type are required.', 'danger');
        return;
      }
      const csrfToken = document.querySelector('[name=csrfmiddlewaretoken]')?.value;
      if (editingFieldId) {
        // Update field
        showDfFeedback('Updating field...', 'info');
        fetch(`/api/field/${editingFieldId}/update/`, {
          method: 'POST',
          headers: { 'X-CSRFToken': csrfToken, 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({ label, type, required })
        })
          .then(res => res.json())
          .then(data => {
            if (data.success) {
              showDfFeedback('Field updated successfully.', 'success');
              fetchDfFields(currentCategoryId);
              hideDfAddEditSection();
            } else {
              showDfFeedback(data.error || 'Failed to update field.', 'danger');
            }
          })
          .catch(() => {
            showDfFeedback('Network error. Please try again.', 'danger');
          });
      } else {
        // Create field
        if (!key) {
          showDfFeedback('Key is required.', 'danger');
          return;
        }
        showDfFeedback('Creating field...', 'info');
        fetch(`/api/category/${currentCategoryId}/fields/create/`, {
          method: 'POST',
          headers: { 'X-CSRFToken': csrfToken, 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({ key, label, type, required })
        })
          .then(res => res.json())
          .then(data => {
            if (data.success) {
              showDfFeedback('Field created successfully.', 'success');
              fetchDfFields(currentCategoryId);
              hideDfAddEditSection();
            } else {
              showDfFeedback(data.error || 'Failed to create field.', 'danger');
            }
          })
          .catch(() => {
            showDfFeedback('Network error. Please try again.', 'danger');
          });
      }
    });
  }
  if (cancelDfAddEditBtn) {
    cancelDfAddEditBtn.addEventListener('click', function() {
      hideDfAddEditSection();
    });
  }
  if (dynamicFieldModalCustom) {
    dynamicFieldModalCustom.addEventListener('click', function(e) {
      if (e.target === dynamicFieldModalCustom) {
        closeDynamicFieldModal();
      }
    });
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape' && dynamicFieldModalCustom.classList.contains('active')) {
        closeDynamicFieldModal();
      }
    });
  }
}); 