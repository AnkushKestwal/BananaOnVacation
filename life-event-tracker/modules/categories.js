// js/modules/categories.js
// Category manager view + modal

import { getState, setState } from './state.js';
import { saveCategories } from './storage.js';
import { showToast } from './toast.js';
import { renderCalendar } from './calendar.js';
import { updateEntryCountBadge, populateCategorySelect } from './entryModal.js';

const COLOR_PALETTE = [
  '#6366f1','#8b5cf6','#ec4899','#ef4444','#f97316',
  '#f59e0b','#10b981','#14b8a6','#3b82f6','#06b6d4',
  '#84cc16','#a855f7','#e11d48','#0891b2','#065f46',
];

export function initCategories() {
  document.getElementById('addCategoryBtn').addEventListener('click', () => openCatModal());

  document.getElementById('catModalClose').addEventListener('click', closeCatModal);
  document.getElementById('categoryModal').addEventListener('click', e => {
    if (e.target === e.currentTarget) closeCatModal();
  });

  document.getElementById('catCancel').addEventListener('click', closeCatModal);
  document.getElementById('catSave').addEventListener('click', saveCat);

  // Color presets
  const presets = document.getElementById('colorPresets');
  COLOR_PALETTE.forEach(hex => {
    const btn = document.createElement('button');
    btn.className = 'color-preset';
    btn.style.background = hex;
    btn.dataset.color = hex;
    btn.title = hex;
    btn.addEventListener('click', () => {
      document.getElementById('catColor').value = hex;
      presets.querySelectorAll('.color-preset').forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
    });
    presets.appendChild(btn);
  });

  renderCategoriesView();
}

export function renderCategoriesView() {
  const state = getState();
  const list = document.getElementById('categoriesList');
  list.innerHTML = '';

  if (!state.categories.length) {
    list.innerHTML = '<p class="no-entries-msg">No categories yet — add one!</p>';
    return;
  }

  state.categories.forEach(cat => {
    const entryCount = Object.values(state.entries)
      .reduce((s, arr) => s + arr.filter(e => e.category === cat.id).length, 0);

    const card = document.createElement('div');
    card.className = 'category-card';
    card.style.setProperty('--cat-color', cat.color);
    card.innerHTML = `
      <span class="cat-color-dot" style="background:${cat.color}"></span>
      <div class="cat-card-name">${escHtml(cat.name)}</div>
      <div class="cat-card-count">${entryCount} ${entryCount === 1 ? 'entry' : 'entries'}</div>
      <div class="cat-card-actions">
        <button class="cat-action-btn" data-edit="${cat.id}">Edit</button>
        <button class="cat-action-btn danger" data-del="${cat.id}">Delete</button>
      </div>`;

    card.querySelector('[data-edit]').addEventListener('click', () => openCatModal(cat.id));
    card.querySelector('[data-del]').addEventListener('click', () => deleteCat(cat.id));
    list.appendChild(card);
  });
}

function openCatModal(editId = null) {
  const state = getState();
  setState({ editingCat: editId });

  const modal = document.getElementById('categoryModal');
  const title = document.getElementById('catModalTitle');

  if (editId) {
    const cat = state.categories.find(c => c.id === editId);
    title.textContent = 'Edit Category';
    document.getElementById('catName').value = cat ? cat.name : '';
    document.getElementById('catColor').value = cat ? cat.color : '#6366f1';
    highlightPreset(cat ? cat.color : '');
  } else {
    title.textContent = 'New Category';
    document.getElementById('catName').value = '';
    document.getElementById('catColor').value = '#6366f1';
    highlightPreset('');
  }

  modal.classList.add('active');
  setTimeout(() => document.getElementById('catName').focus(), 60);
}

function closeCatModal() {
  document.getElementById('categoryModal').classList.remove('active');
  setState({ editingCat: null });
}

function saveCat() {
  const state = getState();
  const name  = document.getElementById('catName').value.trim();
  const color = document.getElementById('catColor').value;

  if (!name) { showToast('Category name is required', 'error'); return; }

  let categories = [...state.categories];

  if (state.editingCat) {
    const idx = categories.findIndex(c => c.id === state.editingCat);
    if (idx > -1) categories[idx] = { ...categories[idx], name, color };
    showToast('Category updated ✦', 'success');
  } else {
    // Check duplicate
    if (categories.some(c => c.name.toLowerCase() === name.toLowerCase())) {
      showToast('A category with this name already exists', 'error'); return;
    }
    const id = name.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Date.now().toString(36).slice(-4);
    categories.push({ id, name, color });
    showToast('Category created ✦', 'success');
  }

  setState({ categories });
  saveCategories(categories);
  closeCatModal();
  renderCategoriesView();

  // Update formCategory select if modal is open
  const entryModal = document.getElementById('entryModal');
  if (entryModal.classList.contains('active')) {
    populateCategorySelect('formCategory', categories);
  }

  renderCalendar();
}

function deleteCat(catId) {
  const state = getState();
  const inUse = Object.values(state.entries)
    .some(arr => arr.some(e => e.category === catId));

  if (inUse) {
    showToast('Cannot delete — category has entries', 'error'); return;
  }

  const categories = state.categories.filter(c => c.id !== catId);
  setState({ categories });
  saveCategories(categories);
  renderCategoriesView();
  showToast('Category deleted', 'info');
}

function highlightPreset(color) {
  document.querySelectorAll('.color-preset').forEach(b => {
    b.classList.toggle('selected', b.dataset.color === color);
  });
}

function escHtml(str) {
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}
