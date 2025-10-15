const express = require("express");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

// if you plan to provide the service account JSON in an env var (RENDER-friendly)
if (process.env.GOOGLE_SERVICE_ACCOUNT_JSON_CONTENT) {
  // Write content to a file accessible to googleapis
  const tmpPath = path.join(__dirname, 'service-account.json');
  try {
    fs.writeFileSync(tmpPath, process.env.GOOGLE_SERVICE_ACCOUNT_JSON_CONTENT, 'utf8');
    // Set env var expected by the getSheetsClient helper
    process.env.GOOGLE_SERVICE_ACCOUNT_JSON = tmpPath;
    console.log('Wrote service account JSON to', tmpPath);
  } catch (e) {
    console.error('Failed writing service account json', e);
  }
}

const app = express();
app.use(express.json());
app.use(express.static("public"));

const PORT = process.env.PORT || 4000;
const STORAGE_DIR = path.join(__dirname, "storage");
const LOCATIONS = (process.env.LOCATIONS || "AECS LAYOUT,BANDEPALYA,HOSA ROAD").split(",").map(s => s.trim());

// ensure storage dir
if (!fs.existsSync(STORAGE_DIR)) fs.mkdirSync(STORAGE_DIR, { recursive: true });

// helpers
function storagePathFor(date) {
  return path.join(STORAGE_DIR, `${date}.json`);
}
function defaultDataForDate(date) {
  const rows = LOCATIONS.map(loc => ({
    date,
    location: loc,
    opening: "",
    qty: 3000,
    closing: "",
    neccRate: "",
    phonepe: 0,
    cash: 0
  }));
  return { date, necc: "", rows };
}
function readDate(date) {
  const p = storagePathFor(date);
  if (!fs.existsSync(p)) return defaultDataForDate(date);
  try {
    const raw = fs.readFileSync(p, "utf8");
    const obj = JSON.parse(raw);
    if (!obj.rows || !Array.isArray(obj.rows)) obj.rows = defaultDataForDate(date).rows;
    if (typeof obj.necc === "undefined") obj.necc = "";
    return obj;
  } catch (err) {
    console.error("readDate error", err);
    return defaultDataForDate(date);
  }
}
function writeDate(dataObj) {
  if (!dataObj || !dataObj.date) throw new Error("invalid data: date required");
  const p = storagePathFor(dataObj.date);
  fs.writeFileSync(p, JSON.stringify(dataObj, null, 2), "utf8");
}

// API: list saved dates
app.get("/api/dates", (req, res) => {
  try {
    const files = fs.readdirSync(STORAGE_DIR).filter(f => f.endsWith(".json")).map(f => f.replace(/\.json$/, ""));
    res.json({ dates: files.sort().reverse() });
  } catch (err) {
    res.status(500).json({ error: "list_failed", message: err.message });
  }
});

// API: get entries for a date (optional location)
app.get("/api/entries", (req, res) => {
  const date = req.query.date;
  if (!date) return res.status(400).json({ error: "missing_date" });
  try {
    const data = readDate(date);
    if (req.query.location) {
      const rows = data.rows.filter(r => r.location === req.query.location);
      return res.json({ date: data.date, necc: data.necc, rows });
    }
    return res.json(data);
  } catch (err) {
    return res.status(500).json({ error: "read_failed", message: err.message });
  }
});

// API: save entries for a date (merge/replace)
app.post("/api/entries", (req, res) => {
  const { date, necc, rows } = req.body || {};
  if (!date) return res.status(400).json({ error: "missing_date" });
  try {
    const existing = readDate(date);
    const base = existing.rows.reduce((acc, r) => { acc[r.location] = r; return acc; }, {});
    if (Array.isArray(rows)) {
      rows.forEach(r => {
        if (!r || !r.location) return;
        base[r.location] = Object.assign({}, base[r.location] || {}, r);
      });
    }
    const mergedRows = LOCATIONS.map(loc => base[loc] || { date, location: loc, opening: "", qty: 3000, closing: "", neccRate: "", phonepe: 0, cash: 0 });
    const out = { date, necc: typeof necc !== "undefined" ? necc : existing.necc, rows: mergedRows };
    writeDate(out);
    res.json({ success: true, date, rows: mergedRows.length });
  } catch (err) {
    res.status(500).json({ error: "save_failed", message: err.message });
  }
});

// placeholder myBillBook revenue endpoint (replace later with real parsing)
app.get("/api/mybillbook-revenue", (req, res) => {
  const location = req.query.location || LOCATIONS[0];
  const base = (location || "").length * 200;
  const revenue = Math.floor(base + Math.random() * 15000);
  res.json({ location, revenue });
});

// fallback 404 for other routes
app.use((req, res) => res.status(404).json({ error: "not_found" }));

app.listen(PORT, () => {
  console.log(`✅ Egg backend running: http://localhost:${PORT}`);
  console.log("Storage folder:", STORAGE_DIR);
});
