# Fit Track

A personal fitness tracker. Stores data in Google Sheets, hosted on Vercel.

## Stack

- `index.html` — vanilla JS frontend (Chart.js via CDN)
- `api/sheets.js` — Vercel serverless function (Google Sheets API)
- Data stored in a Google Spreadsheet (4 tabs)

---

## Setup

### 1. Create the Google Spreadsheet

1. Go to [sheets.google.com](https://sheets.google.com) and create a new spreadsheet
2. Rename it to **Fit Track** (or anything you like)
3. Create **4 tabs** with these exact names and header rows:

**weight** (tab 1)
| id | date | weight | unit |
|----|------|--------|------|

**nutrition** (tab 2)
| id | date | label | calories | protein | carbs | fat |
|----|------|-------|----------|---------|-------|-----|

**cardio** (tab 3)
| id | date | activity | steps | duration | distance |
|----|------|----------|-------|----------|----------|

**goals** (tab 4)
| calories | steps | weight | protein |
|----------|-------|--------|---------|

4. Copy the spreadsheet ID from the URL:
   `https://docs.google.com/spreadsheets/d/`**`THIS_PART`**`/edit`

---

### 2. Create a Google Cloud Service Account

1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Create a new project (e.g. `fit-track`)
3. Go to **APIs & Services → Library** and enable **Google Sheets API**
4. Go to **APIs & Services → Credentials → Create Credentials → Service Account**
5. Give it a name (e.g. `fit-track-bot`) and click **Done**
6. Click the service account → **Keys** tab → **Add Key → Create new key → JSON**
7. Download the JSON file — you'll need two values from it:
   - `client_email` → this is your `GOOGLE_SERVICE_ACCOUNT_EMAIL`
   - `private_key` → this is your `GOOGLE_PRIVATE_KEY`

---

### 3. Share the Sheet with the Service Account

1. Open your Google Spreadsheet
2. Click **Share**
3. Paste in the service account email (`client_email` from the JSON file)
4. Set permission to **Editor**
5. Click **Send**

---

### 4. Deploy to Vercel via GitHub

1. Push this project to a GitHub repository
2. Go to [vercel.com](https://vercel.com) → **Add New Project**
3. Import your GitHub repo
4. Before deploying, add these **Environment Variables** in Vercel:

| Name | Value |
|------|-------|
| `GOOGLE_SHEET_ID` | The spreadsheet ID from step 1 |
| `GOOGLE_SERVICE_ACCOUNT_EMAIL` | `client_email` from the JSON key |
| `GOOGLE_PRIVATE_KEY` | `private_key` from the JSON key (paste the whole value including `-----BEGIN...-----`) |

5. Click **Deploy**

---

### 5. Local Development

```bash
npm install -g vercel
npm install
cp .env.example .env
# Fill in your real values in .env
vercel dev
```

Then open `http://localhost:3000`

---

## Project Structure

```
index.html        — entire frontend
api/
  sheets.js       — serverless function (all API routes)
package.json      — googleapis dependency
vercel.json       — Vercel config
.env.example      — environment variable template
README.md         — this file
```

## API Reference

All requests go to `/api/sheets?action=<action>`

| Method | Action | Description |
|--------|--------|-------------|
| GET | `all` | Load all data (weight, nutrition, cardio, goals) |
| POST | `addWeight` | Append a weight entry |
| POST | `addNutrition` | Append a nutrition/meal entry |
| POST | `addCardio` | Append a cardio/activity entry |
| POST | `saveGoals` | Update goals row |
