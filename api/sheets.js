const { google } = require('googleapis');

const SCOPES   = ['https://www.googleapis.com/auth/spreadsheets'];
const SHEET_ID = process.env.GOOGLE_SHEET_ID;

// ── Auth ───────────────────────────────────────────
function getAuth() {
  return new google.auth.JWT({
    email:  process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    key:    process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    scopes: SCOPES,
  });
}

async function getSheets() {
  const auth = getAuth();
  await auth.authorize();
  return google.sheets({ version: 'v4', auth });
}

// ── Row parsers ────────────────────────────────────
const parseWeight    = (rows = []) => rows.map(r => ({ id: r[0], date: r[1], weight: r[2], unit: r[3] }));
const parseNutrition = (rows = []) => rows.map(r => ({ id: r[0], date: r[1], label: r[2], calories: r[3], protein: r[4], carbs: r[5], fat: r[6] }));
const parseCardio    = (rows = []) => rows.map(r => ({ id: r[0], date: r[1], activity: r[2], steps: r[3], duration: r[4], distance: r[5] }));
const parseGoals     = (rows = []) => rows[0]
  ? { calories: rows[0][0], steps: rows[0][1], weight: rows[0][2], protein: rows[0][3] }
  : { calories: 2000,       steps: 10000,       weight: 70,         protein: 150 };

// ── Main handler ───────────────────────────────────
module.exports = async function handler(req, res) {
  // CORS — needed for local development
  res.setHeader('Access-Control-Allow-Origin',  '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  // Validate env vars
  if (!SHEET_ID || !process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || !process.env.GOOGLE_PRIVATE_KEY) {
    return res.status(503).json({
      error: 'Google Sheets credentials not configured. Set GOOGLE_SHEET_ID, GOOGLE_SERVICE_ACCOUNT_EMAIL and GOOGLE_PRIVATE_KEY.',
    });
  }

  const { action } = req.query;

  try {
    const sheets = await getSheets();
    const rows   = (r) => r.data.values || [];

    // ── GET all ──────────────────────────────────────
    if (req.method === 'GET' && action === 'all') {
      const [w, n, c, g] = await Promise.all([
        sheets.spreadsheets.values.get({ spreadsheetId: SHEET_ID, range: 'weight!A2:D'    }),
        sheets.spreadsheets.values.get({ spreadsheetId: SHEET_ID, range: 'nutrition!A2:G' }),
        sheets.spreadsheets.values.get({ spreadsheetId: SHEET_ID, range: 'cardio!A2:F'   }),
        sheets.spreadsheets.values.get({ spreadsheetId: SHEET_ID, range: 'goals!A2:D'    }),
      ]);
      return res.json({
        weight:    parseWeight(rows(w)),
        nutrition: parseNutrition(rows(n)),
        cardio:    parseCardio(rows(c)),
        goals:     parseGoals(rows(g)),
      });
    }

    // ── POST addWeight ────────────────────────────────
    if (req.method === 'POST' && action === 'addWeight') {
      const { date, weight, unit } = req.body;
      const id = Date.now().toString();
      await sheets.spreadsheets.values.append({
        spreadsheetId:   SHEET_ID,
        range:           'weight!A:D',
        valueInputOption:'RAW',
        resource:        { values: [[id, date, weight, unit]] },
      });
      return res.json({ success: true, id });
    }

    // ── POST addNutrition ─────────────────────────────
    if (req.method === 'POST' && action === 'addNutrition') {
      const { date, label, calories, protein, carbs, fat } = req.body;
      const id = Date.now().toString();
      await sheets.spreadsheets.values.append({
        spreadsheetId:   SHEET_ID,
        range:           'nutrition!A:G',
        valueInputOption:'RAW',
        resource:        { values: [[id, date, label || '', calories, protein || 0, carbs || 0, fat || 0]] },
      });
      return res.json({ success: true, id });
    }

    // ── POST addCardio ────────────────────────────────
    if (req.method === 'POST' && action === 'addCardio') {
      const { date, activity, steps, duration, distance } = req.body;
      const id = Date.now().toString();
      await sheets.spreadsheets.values.append({
        spreadsheetId:   SHEET_ID,
        range:           'cardio!A:F',
        valueInputOption:'RAW',
        resource:        { values: [[id, date, activity, steps || 0, duration || 0, distance || 0]] },
      });
      return res.json({ success: true, id });
    }

    // ── POST saveGoals ────────────────────────────────
    if (req.method === 'POST' && action === 'saveGoals') {
      const { calories, steps, weight, protein } = req.body;
      await sheets.spreadsheets.values.update({
        spreadsheetId:   SHEET_ID,
        range:           'goals!A2:D2',
        valueInputOption:'RAW',
        resource:        { values: [[calories, steps, weight, protein]] },
      });
      return res.json({ success: true });
    }

    return res.status(400).json({ error: `Unknown action: ${action}` });

  } catch (err) {
    console.error('Sheets API error:', err.message);
    return res.status(500).json({ error: err.message });
  }
};
