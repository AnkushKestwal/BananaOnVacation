// js/modules/storage.js
// All LocalStorage read/write operations

const KEYS = {
  ENTRIES:    'chronicle_entries',
  CATEGORIES: 'chronicle_categories',
  THEME:      'chronicle_theme',
};

/** Load all entries: { "YYYY-MM-DD": [ entryObj, … ] } */
export function loadEntries() {
  try {
    return JSON.parse(localStorage.getItem(KEYS.ENTRIES) || '{}');
  } catch { return {}; }
}

/** Save all entries map */
export function saveEntries(entries) {
  localStorage.setItem(KEYS.ENTRIES, JSON.stringify(entries));
}

/** Load categories array */
export function loadCategories() {
  try {
    const saved = JSON.parse(localStorage.getItem(KEYS.CATEGORIES) || 'null');
    if (saved) return saved;
  } catch { /* fall through */ }
  // Default categories
  return [
    { id: 'personal', name: 'Personal',    color: '#6366f1' },
    { id: 'work',     name: 'Work',        color: '#f59e0b' },
    { id: 'health',   name: 'Health',      color: '#10b981' },
    { id: 'travel',   name: 'Travel',      color: '#3b82f6' },
    { id: 'family',   name: 'Family',      color: '#ec4899' },
    { id: 'finance',  name: 'Finance',     color: '#14b8a6' },
    { id: 'creative', name: 'Creative',    color: '#f97316' },
  ];
}

/** Save categories array */
export function saveCategories(categories) {
  localStorage.setItem(KEYS.CATEGORIES, JSON.stringify(categories));
}

/** Load theme preference */
export function loadTheme() {
  return localStorage.getItem(KEYS.THEME) || 'light';
}

/** Save theme preference */
export function saveTheme(theme) {
  localStorage.setItem(KEYS.THEME, theme);
}

/** Export full backup as JSON string */
export function exportBackup(entries, categories) {
  return JSON.stringify({
    version: 2,
    exportedAt: new Date().toISOString(),
    categories,
    entries,
  }, null, 2);
}

/** Validate and parse an imported backup JSON string */
export function parseBackup(jsonStr) {
  const data = JSON.parse(jsonStr);
  if (!data || typeof data !== 'object') throw new Error('Invalid backup format');
  if (!data.entries || typeof data.entries !== 'object') throw new Error('Missing entries field');
  if (!Array.isArray(data.categories)) throw new Error('Missing categories array');
  return { entries: data.entries, categories: data.categories };
}
