// script.js - frontend logic for EggBucket UI
const LOCATIONS = ["AECS LAYOUT","BANDEPALYA","HOSA ROAD"];
const tbody = document.querySelector("#locationsTable tbody");
const searchDate = document.getElementById("searchDate");
const searchLocation = document.getElementById("searchLocation");
const showSavedBtn = document.getElementById("showSaved");
const applyNeccBtn = document.getElementById("applyNecc");
const saveDateBtn = document.getElementById("saveDate");

// init
document.addEventListener('DOMContentLoaded', async () => {
  populateLocationDropdown();
  buildEmptyTable();
  const today = new Date().toISOString().slice(0,10);
  const dateInput = tbody.querySelector('.date-input');
  dateInput.value = today;
  searchDate.value = today;
});

// build table: date row + rows for locations
function buildEmptyTable() {
  tbody.innerHTML = "";
  const dateRow = document.createElement('tr');
  dateRow.classList.add('row-date');
  dateRow.innerHTML = `
    <td><input class="date-input" type="date" /></td>
    <td colspan="1"></td>
    <td></td><td></td><td></td>
    <td><input class="date-necc" type="number" step="0.01" placeholder="enter NECC for date" /></td>
    <td></td><td></td><td></td><td></td><td></td>
  `;
  tbody.appendChild(dateRow);

  LOCATIONS.forEach(loc => {
    const tr = createLocationRow({ location: loc, qty: 3000 });
    tbody.appendChild(tr);
  });
  tbody.querySelector('.date-input').addEventListener('change', () => { searchDate.value = tbody.querySelector('.date-input').value; });
}

// create location row
function createLocationRow(data={}) {
  const tr = document.createElement('tr');
  tr.innerHTML = `
    <td class="label-date">--</td>
    <td class="loc">${data.location}</td>
    <td><input class="opening" type="number" /></td>
    <td><input class="qty" type="number" value="${data.qty ?? 3000}" /></td>
    <td><input class="closing" type="number" /></td>
    <td><input class="neccRow" type="number" step="0.01" placeholder="blank=use date NECC" /></td>
    <td><input class="phonepe" type="number" /></td>
    <td><input class="cash" type="number" /></td>
    <td class="total-amount">0</td>
    <td class="profit-td">0</td>
    <td><button class="refresh">Refresh</button></td>
  `;
  tr.querySelectorAll('input').forEach(i => i.addEventListener('input', () => recalcRow(tr)));
  tr.querySelector('.refresh').addEventListener('click', () => refreshRow(tr));
  recalcRow(tr);
  return tr;
}

// recalc
function recalcRow(tr) {
  const qty = Number(tr.querySelector('.qty').value) || 0;
  const rowNeccVal = tr.querySelector('.neccRow').value;
  const dateNecc = Number(document.querySelector('.date-necc').value) || 0;
  const rate = (rowNeccVal !== "" && !isNaN(Number(rowNeccVal))) ? Number(rowNeccVal) : dateNecc;
  const phonepe = Number(tr.querySelector('.phonepe').value) || 0;
  const cash = Number(tr.querySelector('.cash').value) || 0;
  const totalAmount = phonepe + cash;
  const cost = qty * rate;
  const profit = totalAmount - cost;

  tr.querySelector('.total-amount').textContent = formatNumber(totalAmount);
  const ptd = tr.querySelector('.profit-td');
  ptd.textContent = formatNumber(profit);
  ptd.classList.toggle('profit-posit', profit >= 0);
  ptd.classList.toggle('profit-neg', profit < 0);
}

// totals not shown in UI currently; can be added if needed

function formatNumber(n) {
  if (n === null || n === undefined || isNaN(Number(n))) return "0";
  return Intl.NumberFormat('en-IN').format(Math.round(Number(n)));
}

function populateLocationDropdown() {
  const sel = document.getElementById('searchLocation');
  sel.innerHTML = LOCATIONS.map(l => `<option value="${l}">${l}</option>`).join('');
}

// show saved
showSavedBtn?.addEventListener('click', async () => {
  const date = document.getElementById('searchDate').value;
  const loc = document.getElementById('searchLocation').value;
  if (!date) return alert("Pick a date to search");
  try {
    showSavedBtn.textContent = "Loading...";
    const resp = await fetch(`/api/entries?date=${encodeURIComponent(date)}&location=${encodeURIComponent(loc)}`);
    const j = await resp.json();
    if (!j.rows || j.rows.length === 0) {
      alert("No saved entry for this date and layout.");
      showSavedBtn.textContent = "Show Saved";
      return;
    }
    const rowData = j.rows[0];
    document.querySelector('.date-input').value = j.date;
    document.querySelector('.date-necc').value = j.necc || "";
    Array.from(tbody.querySelectorAll('tr')).forEach(tr => {
      if (tr.classList.contains('row-date')) return;
      const rloc = tr.querySelector('.loc').textContent;
      if (rloc === rowData.location) {
        tr.querySelector('.opening').value = rowData.opening ?? "";
        tr.querySelector('.qty').value = rowData.qty ?? 0;
        tr.querySelector('.closing').value = rowData.closing ?? "";
        tr.querySelector('.neccRow').value = rowData.neccRate ?? "";
        tr.querySelector('.phonepe').value = rowData.phonepe ?? 0;
        tr.querySelector('.cash').value = rowData.cash ?? 0;
        recalcRow(tr);
      }
    });
  } catch (err) {
    alert("Failed to load saved entry.");
    console.error(err);
  } finally {
    showSavedBtn.textContent = "Show Saved";
  }
});

// apply date NECC to all rows
applyNeccBtn?.addEventListener('click', async () => {
  const date = document.querySelector('.date-input').value;
  const neccVal = document.querySelector('.date-necc').value;
  if (!date) return alert("Pick a date in the first column.");
  if (neccVal === "" || isNaN(Number(neccVal))) return alert("Enter valid NECC value.");
  Array.from(tbody.querySelectorAll('tr')).forEach(tr => {
    if (tr.classList.contains('row-date')) return;
    const cell = tr.querySelector('.neccRow');
    if (!cell.value) cell.value = neccVal;
    recalcRow(tr);
  });
  applyNeccBtn.textContent = "Applying...";
  try {
    const payloadRows = Array.from(tbody.querySelectorAll('tr')).filter(t=>!t.classList.contains('row-date')).map(tr => ({
      location: tr.querySelector('.loc').textContent,
      opening: tr.querySelector('.opening').value,
      qty: Number(tr.querySelector('.qty').value) || 0,
      closing: tr.querySelector('.closing').value,
      neccRate: tr.querySelector('.neccRow').value || neccVal,
      phonepe: Number(tr.querySelector('.phonepe').value) || 0,
      cash: Number(tr.querySelector('.cash').value) || 0
    }));
    const saveResp = await fetch('/api/entries', {
      method: 'POST', headers: {'Content-Type':'application/json'},
      body: JSON.stringify({ date, necc: neccVal, rows: payloadRows })
    });
    const saveRes = await saveResp.json();
    if (saveRes.success) {
      applyNeccBtn.textContent = "Applied ✓";
      setTimeout(()=> applyNeccBtn.textContent = "Apply NECC to all rows", 800);
    } else {
      alert("Failed to apply NECC: " + JSON.stringify(saveRes));
      applyNeccBtn.textContent = "Apply NECC to all rows";
    }
  } catch (err) {
    console.error(err);
    alert("Server error when applying NECC.");
    applyNeccBtn.textContent = "Apply NECC to all rows";
  }
});

// save full table for date
saveDateBtn?.addEventListener('click', async () => {
  const date = document.querySelector('.date-input').value;
  if (!date) return alert("Pick a date in the first column.");
  const neccVal = document.querySelector('.date-necc').value || "";
  const rows = Array.from(tbody.querySelectorAll('tr')).filter(t=>!t.classList.contains('row-date')).map(tr => ({
    location: tr.querySelector('.loc').textContent,
    opening: tr.querySelector('.opening').value,
    qty: Number(tr.querySelector('.qty').value) || 0,
    closing: tr.querySelector('.closing').value,
    neccRate: tr.querySelector('.neccRow').value,
    phonepe: Number(tr.querySelector('.phonepe').value) || 0,
    cash: Number(tr.querySelector('.cash').value) || 0
  }));
  try {
    saveDateBtn.textContent = "Saving...";
    const resp = await fetch('/api/entries', {
      method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ date, necc: neccVal, rows })
    });
    const j = await resp.json();
    if (j.success) {
      saveDateBtn.textContent = "Saved ✓";
      setTimeout(()=> saveDateBtn.textContent = "Save All for Date", 900);
    } else {
      alert("Save failed: " + JSON.stringify(j));
      saveDateBtn.textContent = "Save All for Date";
    }
  } catch (err) {
    console.error(err);
    alert("Save failed (server error).");
    saveDateBtn.textContent = "Save All for Date";
  }
});

// refresh row (placeholder that calls /api/mybillbook-revenue)
async function refreshRow(tr) {
  const loc = tr.querySelector('.loc').textContent;
  const date = document.querySelector('.date-input').value;
  const btn = tr.querySelector('.refresh');
  const old = btn.textContent;
  btn.textContent = '...';
  try {
    const resp = await fetch(`/api/mybillbook-revenue?location=${encodeURIComponent(loc)}&date=${encodeURIComponent(date)}`);
    const j = await resp.json();
    const revenue = j.revenue || 0;
    const phone = Math.round(revenue * 0.36);
    const cash = revenue - phone;
    if (!tr.querySelector('.phonepe').value) tr.querySelector('.phonepe').value = phone;
    if (!tr.querySelector('.cash').value) tr.querySelector('.cash').value = cash;
    recalcRow(tr);
  } catch (err) {
    alert("Refresh failed (server).");
  } finally {
    btn.textContent = old;
  }
}
