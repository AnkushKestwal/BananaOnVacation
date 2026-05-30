// js/modules/state.js
// Central application state

import { loadEntries, loadCategories, loadTheme } from './storage.js';

const state = {
  entries:    {},   // { "YYYY-MM-DD": [ {id,category,color,note,timestamp}, … ] }
  categories: [],   // [ {id, name, color} ]
  theme:      'light',
  view:       'calendar',

  // Calendar navigation
  calYear:  new Date().getFullYear(),
  calMonth: new Date().getMonth(), // 0-indexed

  // Edit tracking
  editingEntry: null,  // { dateKey, entryIndex } | null
  editingCat:   null,  // category id | null
  openDateKey:  null,  // currently open modal date key
};

export function getState() { return state; }

export function initState() {
  state.entries    = loadEntries();
  state.categories = loadCategories();
  state.theme      = loadTheme();
}

export function setState(patch) {
  Object.assign(state, patch);
}
