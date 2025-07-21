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