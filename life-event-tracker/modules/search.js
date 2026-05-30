// js/modules/search.js
// Full-text search across notes and categories

import { getState } from './state.js';
import { openEntryModal } from './entryModal.js';

let activeFilter = null; // category id or null

export function initSearch() {
  const input = document.getElementById('searchInput');
  const clearBtn = document.getElementById('searchClear');

  input.addEventListener('input', doSearch);
  clearBtn.addEventListener('click', () => {
    input.value = '';
    activeFilter = null;
    renderFilters();
    renderResults([]);
    document.querySelector('.search-results').innerHTML = `
      <div class="search-empty">
        <div class="empty-doodle">◎</div>
        <p>Start typing to search your entries</p>
      </div>`;
  });
}

export function renderFilters() {
  const state = getState();
  const container = document.getElementById('searchFilters');
  container.innerHTML = '';

  const allBtn = document.createElement('button');
  allBtn.className = 'filter-chip' + (activeFilter === null ? ' active' : '');
  allBtn.textContent = 'All';
  allBtn.addEventListener('click', () => { activeFilter = null; renderFilters(); doSearch(); });
  container.appendChild(allBtn);

  state.categories.forEach(cat => {
    const btn = document.createElement('button');
    btn.className = 'filter-chip' + (activeFilter === cat.id ? ' active' : '');
    btn.textContent = cat.name;
    btn.style.setProperty('--cat-color', cat.color);
    btn.addEventListener('click', () => {
      activeFilter = activeFilter === cat.id ? null : cat.id;
      renderFilters();
      doSearch();
    });
    container.appendChild(btn);
  });
}

function doSearch() {
  const query = document.getElementById('searchInput').value.trim().toLowerCase();
  if (!query && activeFilter === null) {
    document.getElementById('searchResults').innerHTML = `
      <div class="search-empty">
        <div class="empty-doodle">◎</div>
        <p>Start typing to search your entries</p>
      </div>`;
    return;
  }

  const state = getState();
  const results = [];

  Object.entries(state.entries).forEach(([dateKey, dayEntries]) => {
    dayEntries.forEach((entry, idx) => {
      // Category filter
      if (activeFilter && entry.category !== activeFilter) return;

      // Text filter
      const cat = state.categories.find(c => c.id === entry.category);
      const catName = cat ? cat.name.toLowerCase() : '';
      const noteLow = (entry.note || '').toLowerCase();

      if (query && !noteLow.includes(query) && !catName.includes(query)) return;

      results.push({ dateKey, idx, entry, catName: cat ? cat.name : entry.category });
    });
  });

  // Sort newest first
  results.sort((a, b) => (b.entry.timestamp || b.dateKey) > (a.entry.timestamp || a.dateKey) ? 1 : -1);

  renderResults(results, query);
}

function renderResults(results, query = '') {
  const container = document.getElementById('searchResults');
  if (!results.length) {
    container.innerHTML = `
      <div class="search-empty">
        <div class="empty-doodle">◎</div>
        <p>${query ? 'No entries found' : 'Start typing to search your entries'}</p>
      </div>`;
    return;
  }

  container.innerHTML = `<p style="font-size:.78rem;color:var(--text-3);margin-bottom:8px;font-weight:600;">${results.length} result${results.length > 1 ? 's' : ''}</p>`;

  results.forEach(({ dateKey, idx, entry, catName }) => {
    const card = document.createElement('div');
    card.className = 'search-result-card';
    card.style.setProperty('--entry-color', entry.color || '#6366f1');

    const dateFmt = new Date(dateKey + 'T12:00:00').toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric'
    });

    const highlightedNote = highlight(escHtml(entry.note || ''), query);

    card.innerHTML = `
      <div class="result-meta">
        <span class="result-date">${dateFmt}</span>
        <span class="result-category" style="background:${entry.color || '#6366f1'}">${escHtml(catName)}</span>
      </div>
      <div class="result-note">${highlightedNote}</div>`;

    card.addEventListener('click', () => {
      // Navigate to that date's month
      const d = new Date(dateKey + 'T12:00:00');
      const { setState } = window.__app;
      setState({ calYear: d.getFullYear(), calMonth: d.getMonth() });
      const { renderCalendar } = window.__appModules;
      renderCalendar();
      switchView('calendar');
      setTimeout(() => openEntryModal(dateKey), 120);
    });

    container.appendChild(card);
  });
}

function highlight(text, query) {
  if (!query) return text;
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return text.replace(new RegExp(`(${escaped})`, 'gi'), '<mark>$1</mark>');
}

function escHtml(str) {
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

// Will be set by app.js
function switchView(v) { window.__app.switchView(v); }
