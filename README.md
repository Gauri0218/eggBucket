# 🥚 Egg Bucket

Egg Bucket is a fun and practical web-based dashboard designed to help track **daily egg sales and stock records**.  
It provides a clean interface to manage **opening stock**, **closing stock**, **cash and PhonePe payments**, and calculates **profit or loss** automatically — all with an animated egg-bucket theme!

---

## 🧠 Overview

Egg Bucket combines a simple **frontend (HTML, CSS, JavaScript)** with a lightweight **backend (Node.js + Express)** that stores daily entries as JSON files.  
Each day’s record is saved separately, making it easy to retrieve, analyze, and visualize your sales or stock data.

---

## ✨ Key Features

✅ **Animated UI** — Watch eggs fall into a bucket as you record data.  
✅ **Daily Data Storage** — Records are saved per date in JSON files.  
✅ **Automatic Calculations** — Profit/Loss and totals are auto-calculated.  
✅ **Simple Interface** — Built for small vendors and local tracking.  
✅ **Local Backend** — Uses Node.js and Express for file-based storage.  
✅ **Portable Setup** — No database needed; works instantly after setup.  

---

## 🧩 Project Structure
eggBucket/
├── backend/
│ ├── public/ # Frontend files (HTML, CSS, JS)
│ │ ├── index.html # Main interface
│ │ ├── script.js # App logic & animations
│ │ ├── styles.css # Styling and visuals
│ │ └── .gitignore
│ ├── storage/ # Auto-created folder for daily JSON records
│ ├── server.js # Node.js + Express backend
│ ├── package.json # Dependencies and metadata
│ ├── package-lock.json
│ └── .env # Environment variables (e.g., port, ngrok token)
│
├── public/ # Optional front-facing folder (for hosting)
│ ├── index.html
│ ├── script.js
│ ├── styles.css
│ └── .gitignore
│
└── .gitignore # Files & folders to ignore (node_modules, storage, etc.)

---

## ⚙️ How It Works

1. When you open the frontend (`index.html`), you can input:
   - Opening Stock  
   - Closing Stock  
   - Cash Sales  
   - PhonePe Sales  

2. The **JavaScript (script.js)** calculates:
   - Total Sold Eggs  
   - Revenue  
   - Profit/Loss  

3. The **server (server.js)**:
   - Saves data in the `/storage` folder as JSON (by date).
   - Retrieves any previous day’s record when selected.

4. The result:
   - A fun, animated way to log your egg business activity with automatic summaries 🥚📈

---

## 🛠️ Installation & Setup (Local)

Follow these steps to run Egg Bucket on your computer 👇

### 1️⃣ Clone the Repository
```bash
git clone https://github.com/Gauri0218/eggBucket.git


