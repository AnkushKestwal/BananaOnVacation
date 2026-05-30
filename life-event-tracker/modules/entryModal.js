// js/modules/entryModal.js
// Open/close the entry manager modal, add/edit/delete entries

import { getState, setState } from './state.js';
import { saveEntries } from './storage.js';
import { renderCalendar } from './calendar.js';
import { showToast } from './toast.js';

const DATE_FMT = new Intl.DateTimeFormat('en-US', {
  weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
});

export function openEntryModal(dateKey) {
  setState({ openDateKey: dateKey, editingEntry: null });
  const state = getState();

  document.getElementById('entryModalDate').textContent =
    DATE_FMT.format(new Date(dateKey + 'T12:00:00'));

  populateCategorySelect('formCategory', state.categories);
  hideEntryForm();
  renderEntriesList(dateKey);

  document.getElementById('entryModal').classList.add('active');
}

export function closeEntryModal() {
  document.getElementById('entryModal').classList.remove('active');
  setState({ openDateKey: null, editingEntry: null });
}

export function initEntryModal() {
  document.getElementById('entryModalClose').addEventListener('click', closeEntryModal);
  document.getElementById('entryModal').addEventListener('click', e => {
    if (e.target === e.currentTarget) closeEntryModal();
  });

  document.getElementById('addEntryBtn').addEventListener('click', () => {
    setState({ editingEntry: null });
    showEntryForm();
  });

  document.getElementById('formSave').addEventListener('click', saveEntry);
  document.getElementById('formCancel').addEventListener('click', () => {
    hideEntryForm();
    setState({ editingEntry: null });
  });

  // Sync color when category changes
  document.getElementById('formCategory').addEventListener('change', () => {
    const state = getState();
    const catId = document.getElementById('formCategory').value;
    const cat = state.categories.find(c => c.id === catId);
    if (cat && !state.editingEntry) {
      document.getElementById('formColor').value = cat.color;
    }
  });
}

function populateCategorySelect(selectId, categories) {
  const sel = document.getElementById(selectId);
  sel.innerHTML = categories.map(c =>
    `<option value="${c.id}" style="color:${c.color}">${c.name}</option>`
  ).join('');
}

function renderEntriesList(dateKey) {
  const state = getState();
  const dayEntries = state.entries[dateKey] || [];
  const list = document.getElementById('entriesList');
  list.innerHTML = '';

  if (!dayEntries.length) {
    list.innerHTML = '<p class="no-entries-msg">No entries yet — add one below ✦</p>';
    return;
  }

  dayEntries.forEach((entry, idx) => {
    const catName = (state.categories.find(c => c.id === entry.category) || {}).name || entry.category;
    const item = document.createElement('div');
    item.className = 'entry-item';
    item.style.setProperty('--entry-color', entry.color);

    const ts = entry.timestamp ? new Date(entry.timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit', minute: '2-digit'
    }) : '';

    item.innerHTML = `
      <div class="entry-item-header">
        <span class="entry-cat-badge" style="background:${entry.color}">${catName}</span>
        <span class="entry-time">${ts}</span>
      </div>
      <div class="entry-note">${escHtml(entry.note || '')}</div>
      <div class="entry-actions">
        <button class="entry-edit-btn" data-idx="${idx}">Edit</button>
        <button class="entry-del-btn"  data-idx="${idx}">Delete</button>
      </div>`;

    item.querySelector('.entry-edit-btn').addEventListener('click', () => editEntry(dateKey, idx));
    item.querySelector('.entry-del-btn').addEventListener('click', () => deleteEntry(dateKey, idx));
    list.appendChild(item);
  });
}

function showEntryForm(existingEntry = null) {
  const form = document.getElementById('entryForm');
  const subtitle = document.getElementById('formSubtitle');
  const state = getState();

  if (existingEntry) {
    subtitle.textContent = 'Edit Entry';
    document.getElementById('formCategory').value = existingEntry.category;
    document.getElementById('formColor').value = existingEntry.color || '#6366f1';
    document.getElementById('formNote').value = existingEntry.note || '';
  } else {
    subtitle.textContent = 'New Entry';
    const firstCat = state.categories[0];
    document.getElementById('formCategory').value = firstCat ? firstCat.id : '';
    document.getElementById('formColor').value = firstCat ? firstCat.color : '#6366f1';
    document.getElementById('formNote').value = '';
  }

  form.classList.add('visible');
  document.getElementById('addEntryBtn').style.display = 'none';
  setTimeout(() => document.getElementById('formNote').focus(), 60);
}

function hideEntryForm() {
  document.getElementById('entryForm').classList.remove('visible');
  document.getElementById('addEntryBtn').style.display = 'block';
}

function editEntry(dateKey, idx) {
  const state = getState();
  const entry = (state.entries[dateKey] || [])[idx];
  if (!entry) return;
  setState({ editingEntry: { dateKey, idx } });
  showEntryForm(entry);
}

function deleteEntry(dateKey, idx) {
  const state = getState();
  const dayEntries = state.entries[dateKey] ? [...state.entries[dateKey]] : [];
  dayEntries.splice(idx, 1);
  const entries = { ...state.entries };
  if (dayEntries.length === 0) delete entries[dateKey];
  else entries[dateKey] = dayEntries;
  setState({ entries });
  saveEntries(entries);
  renderEntriesList(dateKey);
  renderCalendar();
  updateEntryCountBadge();
  showToast('Entry deleted', 'info');
}

function saveEntry() {
  const state = getState();
  const category = document.getElementById('formCategory').value;
  const color    = document.getElementById('formColor').value;
  const note     = document.getElementById('formNote').value.trim();

  if (!note) { showToast('Please write a note', 'error'); return; }
  if (!category) { showToast('Please select a category', 'error'); return; }

  const entries = { ...state.entries };
  const dateKey = state.openDateKey;

  if (state.editingEntry && state.editingEntry.dateKey === dateKey) {
    // Edit existing
    const { idx } = state.editingEntry;
    const dayEntries = [...(entries[dateKey] || [])];
    dayEntries[idx] = { ...dayEntries[idx], category, color, note };
    entries[dateKey] = dayEntries;
    showToast('Entry updated ✦', 'success');
  } else {
    // New entry
    const entry = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2,6),
      category, color, note,
      timestamp: new Date().toISOString()
    };
    if (!entries[dateKey]) entries[dateKey] = [];
    entries[dateKey] = [...entries[dateKey], entry];
    showToast('Entry saved ✦', 'success');
  }

  setState({ entries, editingEntry: null });
  saveEntries(entries);
  hideEntryForm();
  renderEntriesList(dateKey);
  renderCalendar();
  updateEntryCountBadge();
}

function updateEntryCountBadge() {
  const state = getState();
  const total = Object.values(state.entries).reduce((s, a) => s + a.length, 0);
  document.getElementById('entryCountBadge').textContent =
    `${total} ${total === 1 ? 'entry' : 'entries'}`;
}

export { updateEntryCountBadge, populateCategorySelect };

function escHtml(str) {
  return str
    .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}
