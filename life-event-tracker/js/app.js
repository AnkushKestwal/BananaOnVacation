// js/app.js
// Application bootstrap — wires everything together

import { initState, getState, setState } from '../modules/state.js';
import { loadTheme, saveTheme, exportBackup, parseBackup, saveEntries, saveCategories } from '../modules/storage.js';
import { initCalendarControls, renderCalendar } from '../modules/calendar.js';
import { initEntryModal, updateEntryCountBadge } from '../modules/entryModal.js';
import { initCategories, renderCategoriesView } from '../modules/categories.js';
import { initSearch, renderFilters } from '../modules/search.js';
import { renderStats } from '../modules/stats.js';
import { showToast } from '../modules/toast.js';

// ── Expose helpers for cross-module use ────────
window.__app = { setState, switchView };
window.__appModules = { renderCalendar };

// ── INIT ───────────────────────────────────────
initState();
applyTheme(getState().theme);
initCalendarControls();
initEntryModal();
initCategories();
initSearch();
renderFilters();
renderCalendar();
updateEntryCountBadge();

// ── VIEW SWITCHER ──────────────────────────────
const VIEW_TITLES = {
  calendar:   'Calendar',
  stats:      'Statistics',
  search:     'Search',
  categories: 'Categories',
};

export function switchView(viewId) {
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));

  const view = document.getElementById(`view-${viewId}`);
  if (view) view.classList.add('active');

  const btn = document.querySelector(`[data-view="${viewId}"]`);
  if (btn) btn.classList.add('active');

  document.getElementById('topbarTitle').textContent = VIEW_TITLES[viewId] || viewId;
  setState({ view: viewId });

  if (viewId === 'stats') renderStats();
  if (viewId === 'search') renderFilters();

  // Close sidebar on mobile
  if (window.innerWidth <= 768) closeSidebar();
}

document.querySelectorAll('[data-view]').forEach(btn => {
  btn.addEventListener('click', () => switchView(btn.dataset.view));
});

// ── SIDEBAR TOGGLE ─────────────────────────────
const sidebar  = document.getElementById('sidebar');
const overlay  = document.getElementById('overlay');
const menuBtn  = document.getElementById('menuBtn');
const closeBtn = document.getElementById('sidebarClose');

menuBtn.addEventListener('click',  openSidebar);
closeBtn.addEventListener('click', closeSidebar);
overlay.addEventListener('click',  closeSidebar);

function openSidebar() {
  sidebar.classList.add('open');
  overlay.classList.add('active');
}
function closeSidebar() {
  sidebar.classList.remove('open');
  overlay.classList.remove('active');
}

// ── THEME TOGGLE ───────────────────────────────
document.getElementById('themeToggle').addEventListener('click', () => {
  const current = document.documentElement.getAttribute('data-theme') || 'light';
  const next = current === 'light' ? 'dark' : 'light';
  applyTheme(next);
  saveTheme(next);
  setState({ theme: next });
  // Re-render stats charts with new theme colours
  if (getState().view === 'stats') renderStats();
});

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  document.getElementById('themeIcon').textContent = theme === 'dark' ? '◑' : '◐';
  document.getElementById('themeLabel').textContent = theme === 'dark' ? 'Light Mode' : 'Dark Mode';
}

// ── EXPORT ─────────────────────────────────────
document.getElementById('exportBtn').addEventListener('click', () => {
  const state = getState();
  const json = exportBackup(state.entries, state.categories);
  const blob = new Blob([json], { type: 'application/json' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = `chronicle-backup-${new Date().toISOString().slice(0,10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
  showToast('Backup exported ✦', 'success');
});

// ── IMPORT ─────────────────────────────────────
document.getElementById('importFile').addEventListener('change', e => {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = evt => {
    try {
      const { entries, categories } = parseBackup(evt.target.result);
      setState({ entries, categories });
      saveEntries(entries);
      saveCategories(categories);
      renderCalendar();
      renderCategoriesView();
      renderFilters();
      updateEntryCountBadge();
      if (getState().view === 'stats') renderStats();
      showToast('Backup imported successfully ✦', 'success');
    } catch (err) {
      showToast('Import failed: ' + err.message, 'error', 5000);
    }
    // Reset file input
    e.target.value = '';
  };
  reader.readAsText(file);
});

// ── KEYBOARD SHORTCUTS ─────────────────────────
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    // Close any open modal
    document.querySelectorAll('.modal-backdrop.active').forEach(m => m.classList.remove('active'));
    closeSidebar();
  }
});
