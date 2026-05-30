// js/modules/stats.js
// Statistics dashboard and Chart.js charts

import { getState } from './state.js';

let charts = {};

const MONTH_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

export function renderStats() {
  const state = getState();
  const { entries, categories } = state;
  const now = new Date();

  // Total
  const totalEntries = Object.values(entries).reduce((s,a) => s + a.length, 0);
  document.getElementById('statTotalNum').textContent = totalEntries;
  document.getElementById('statCatNum').textContent   = categories.length;

  // This month
  const monthKey = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`;
  let monthCount = 0;
  Object.entries(entries).forEach(([k,arr]) => {
    if (k.startsWith(monthKey)) monthCount += arr.length;
  });
  document.getElementById('statMonthNum').textContent = monthCount;

  // This year
  const yearKey = String(now.getFullYear());
  let yearCount = 0;
  Object.entries(entries).forEach(([k,arr]) => {
    if (k.startsWith(yearKey)) yearCount += arr.length;
  });
  document.getElementById('statYearNum').textContent = yearCount;

  // Category counts
  const catCounts = {};
  categories.forEach(c => { catCounts[c.id] = 0; });
  Object.values(entries).flat().forEach(e => {
    if (catCounts[e.category] !== undefined) catCounts[e.category]++;
    else catCounts[e.category] = (catCounts[e.category] || 0) + 1;
  });

  renderCategoryChart(categories, catCounts);
  renderMonthlyChart(entries, now.getFullYear());
  renderYearlyChart(entries);
  renderCategoryBreakdown(categories, catCounts, totalEntries);
}

function getChartDefaults() {
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  return {
    gridColor:  isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
    tickColor:  isDark ? '#6e6660' : '#9c9388',
    fontFamily: "'DM Sans', system-ui, sans-serif",
  };
}

function destroyChart(id) {
  if (charts[id]) { charts[id].destroy(); delete charts[id]; }
}

function renderCategoryChart(categories, catCounts) {
  destroyChart('category');
  const labels = categories.map(c => c.name);
  const data   = categories.map(c => catCounts[c.id] || 0);
  const colors = categories.map(c => c.color);
  if (!labels.length || data.every(d => d === 0)) return;

  const { gridColor, tickColor, fontFamily } = getChartDefaults();

  charts['category'] = new Chart(document.getElementById('chartCategory'), {
    type: 'doughnut',
    data: {
      labels,
      datasets: [{ data, backgroundColor: colors, borderWidth: 2, borderColor: 'transparent', hoverOffset: 8 }]
    },
    options: {
      cutout: '65%',
      plugins: {
        legend: {
          position: 'bottom',
          labels: { color: tickColor, font: { family: fontFamily, size: 11 }, padding: 12, boxWidth: 12 }
        },
        tooltip: {
          callbacks: {
            label: ctx => ` ${ctx.label}: ${ctx.raw} ${ctx.raw === 1 ? 'entry' : 'entries'}`
          }
        }
      }
    }
  });
}

function renderMonthlyChart(entries, year) {
  destroyChart('monthly');
  const monthlyCounts = new Array(12).fill(0);
  Object.entries(entries).forEach(([k, arr]) => {
    if (k.startsWith(String(year))) {
      const m = parseInt(k.split('-')[1], 10) - 1;
      monthlyCounts[m] += arr.length;
    }
  });

  const { gridColor, tickColor, fontFamily } = getChartDefaults();

  charts['monthly'] = new Chart(document.getElementById('chartMonthly'), {
    type: 'bar',
    data: {
      labels: MONTH_SHORT,
      datasets: [{
        label: 'Entries',
        data: monthlyCounts,
        backgroundColor: 'rgba(193,127,62,0.7)',
        borderColor: '#c17f3e',
        borderWidth: 2,
        borderRadius: 6,
        borderSkipped: false,
      }]
    },
    options: {
      plugins: { legend: { display: false } },
      scales: {
        x: { grid: { color: gridColor }, ticks: { color: tickColor, font: { family: fontFamily, size: 11 } } },
        y: { grid: { color: gridColor }, ticks: { color: tickColor, font: { family: fontFamily, size: 11 }, stepSize: 1, precision: 0 }, beginAtZero: true }
      }
    }
  });
}

function renderYearlyChart(entries) {
  destroyChart('yearly');
  const yearlyCounts = {};
  Object.entries(entries).forEach(([k, arr]) => {
    const y = k.split('-')[0];
    yearlyCounts[y] = (yearlyCounts[y] || 0) + arr.length;
  });
  const labels = Object.keys(yearlyCounts).sort();
  const data   = labels.map(y => yearlyCounts[y]);
  if (!labels.length) return;

  const { gridColor, tickColor, fontFamily } = getChartDefaults();

  charts['yearly'] = new Chart(document.getElementById('chartYearly'), {
    type: 'line',
    data: {
      labels,
      datasets: [{
        label: 'Entries per year',
        data,
        borderColor: '#c17f3e',
        backgroundColor: 'rgba(193,127,62,0.12)',
        borderWidth: 2.5,
        fill: true,
        tension: .4,
        pointBackgroundColor: '#c17f3e',
        pointRadius: 4,
      }]
    },
    options: {
      plugins: { legend: { display: false } },
      scales: {
        x: { grid: { color: gridColor }, ticks: { color: tickColor, font: { family: fontFamily, size: 11 } } },
        y: { grid: { color: gridColor }, ticks: { color: tickColor, font: { family: fontFamily, size: 11 }, stepSize: 1, precision: 0 }, beginAtZero: true }
      }
    }
  });
}

function renderCategoryBreakdown(categories, catCounts, total) {
  const el = document.getElementById('categoryBreakdown');
  if (!categories.length) { el.innerHTML = ''; return; }

  const rows = categories.map(c => ({ ...c, count: catCounts[c.id] || 0 }))
    .sort((a,b) => b.count - a.count);
  const maxCount = rows[0]?.count || 1;

  el.innerHTML = `<h3 style="font-family:var(--font-display);font-size:1rem;font-weight:600;margin-bottom:16px;color:var(--text);">Category Breakdown</h3>`;
  rows.forEach(c => {
    const pct = maxCount ? Math.round((c.count / maxCount) * 100) : 0;
    el.innerHTML += `
      <div class="cat-row">
        <span class="cat-swatch" style="background:${c.color}"></span>
        <span class="cat-name-stat">${escHtml(c.name)}</span>
        <div class="cat-bar-wrap">
          <div class="cat-bar-fill" style="width:${pct}%;background:${c.color}"></div>
        </div>
        <span class="cat-count-stat">${c.count}</span>
      </div>`;
  });
}

function escHtml(str) {
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}
