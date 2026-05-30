// js/modules/calendar.js
// Renders the monthly calendar grid

import { getState } from './state.js';
import { openEntryModal } from './entryModal.js';

const MONTH_NAMES = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December'
];

/** Build <select> options for month and year controls */
export function initCalendarControls() {
  const monthSel = document.getElementById('monthSelect');
  const yearSel  = document.getElementById('yearSelect');

  monthSel.innerHTML = MONTH_NAMES
    .map((m, i) => `<option value="${i}">${m}</option>`).join('');

  const startYear = 2026, endYear = 2050;
  yearSel.innerHTML = '';
  for (let y = startYear; y <= endYear; y++) {
    yearSel.innerHTML += `<option value="${y}">${y}</option>`;
  }

  monthSel.addEventListener('change', () => {
    const { setState } = window.__app;
    setState({ calMonth: +monthSel.value });
    renderCalendar();
  });
  yearSel.addEventListener('change', () => {
    const { setState } = window.__app;
    setState({ calYear: +yearSel.value });
    renderCalendar();
  });

  document.getElementById('prevMonth').addEventListener('click', () => navigateMonth(-1));
  document.getElementById('nextMonth').addEventListener('click', () => navigateMonth(+1));
  document.getElementById('todayBtn').addEventListener('click', () => {
    const today = new Date();
    const { setState } = window.__app;
    setState({ calYear: today.getFullYear(), calMonth: today.getMonth() });
    renderCalendar();
  });
}

export function navigateMonth(delta) {
  const state = getState();
  let m = state.calMonth + delta;
  let y = state.calYear;
  if (m < 0)  { m = 11; y--; }
  if (m > 11) { m = 0;  y++; }
  // Clamp to range
  if (y < 2026) { y = 2026; m = 0; }
  if (y > 2050 || (y === 2050 && m > 0)) { y = 2050; m = 0; }
  const { setState } = window.__app;
  setState({ calYear: y, calMonth: m });
  renderCalendar();
}

/** Main render function */
export function renderCalendar() {
  const state   = getState();
  const { calYear: year, calMonth: month, entries, categories } = state;

  // Sync selects
  document.getElementById('monthSelect').value = month;
  document.getElementById('yearSelect').value  = year;

  const grid = document.getElementById('calendarGrid');
  grid.innerHTML = '';

  const today      = new Date();
  const firstDay   = new Date(year, month, 1).getDay(); // 0=Sun
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrev  = new Date(year, month, 0).getDate();

  const totalCells = Math.ceil((firstDay + daysInMonth) / 7) * 7;

  for (let i = 0; i < totalCells; i++) {
    const cell = document.createElement('div');
    cell.className = 'cal-day';

    let d, m2, y2;
    if (i < firstDay) {
      d = daysInPrev - firstDay + i + 1; m2 = month - 1; y2 = year;
      if (m2 < 0) { m2 = 11; y2--; }
      cell.classList.add('other-month');
    } else if (i >= firstDay + daysInMonth) {
      d = i - firstDay - daysInMonth + 1; m2 = month + 1; y2 = year;
      if (m2 > 11) { m2 = 0; y2++; }
      cell.classList.add('other-month');
    } else {
      d = i - firstDay + 1; m2 = month; y2 = year;
    }

    const dateKey = `${y2}-${String(m2 + 1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
    const isToday = today.getFullYear() === y2 && today.getMonth() === m2 && today.getDate() === d;

    if (isToday) cell.classList.add('today');

    const dayEntries = entries[dateKey] || [];
    if (dayEntries.length) cell.classList.add('has-entries');

    // Day number
    const numEl = document.createElement('div');
    numEl.className = 'day-num';
    numEl.textContent = d;
    cell.appendChild(numEl);

    // Entry count badge
    if (dayEntries.length > 1) {
      const badge = document.createElement('div');
      badge.className = 'day-entry-count';
      badge.textContent = dayEntries.length;
      cell.appendChild(badge);
    }

    // Color dots
    if (dayEntries.length) {
      const dotsEl = document.createElement('div');
      dotsEl.className = 'day-dots';
      dayEntries.slice(0, 6).forEach(entry => {
        const dot = document.createElement('div');
        dot.className = 'day-dot';
        dot.style.background = entry.color || '#6366f1';
        dotsEl.appendChild(dot);
      });
      cell.appendChild(dotsEl);
    }

    cell.dataset.dateKey = dateKey;
    cell.addEventListener('click', () => {
      if (!cell.classList.contains('other-month')) {
        openEntryModal(dateKey);
      }
    });

    grid.appendChild(cell);
  }

  // Legend
  renderLegend(entries, categories);
}

function renderLegend(entries, categories) {
  const legend = document.getElementById('calendarLegend');
  // Count categories used this month
  const state = getState();
  const used = {};
  Object.keys(entries).forEach(key => {
    if (key.startsWith(`${state.calYear}-${String(state.calMonth + 1).padStart(2,'0')}`)) {
      entries[key].forEach(e => { used[e.category] = e.color; });
    }
  });
  legend.innerHTML = '';
  if (!Object.keys(used).length) return;

  Object.entries(used).forEach(([catId, color]) => {
    const cat = categories.find(c => c.id === catId);
    const item = document.createElement('div');
    item.className = 'legend-item';
    item.innerHTML = `<span class="legend-dot" style="background:${color}"></span>${cat ? cat.name : catId}`;
    legend.appendChild(item);
  });
}
