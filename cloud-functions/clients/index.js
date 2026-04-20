import { google } from 'googleapis';

const SHEET_ID = '1nd6UtJJ5fA81D9VZRiH2ZJGHYsiiv28LPzXhNRtd2aM';
const RANGE = 'A:F'; // Agência, Cliente, CP ATUAL, Email CP, CS Atual, Email CS

// Cache to avoid hitting Sheets API on every request
let cache = { data: null, ts: 0 };
const CACHE_TTL = 60 * 1000; // 1 minute

async function getSheetData() {
  const now = Date.now();
  if (cache.data && (now - cache.ts) < CACHE_TTL) {
    return cache.data;
  }

  const auth = new google.auth.GoogleAuth({
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
  });

  const sheets = google.sheets({ version: 'v4', auth });
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: RANGE,
  });

  const rows = res.data.values || [];
  if (rows.length < 2) return [];

  // Skip header row
  const data = rows.slice(1).map(row => ({
    agency: row[0] || '',
    client: row[1] || '',
    cp: row[2] || '',
    cpEmail: row[3] || '',
    cs: (row[4] && row[4] !== '#N/A' && row[4] !== 'Green Field') ? row[4] : null,
    csEmail: (row[5] && row[5] !== '#N/A') ? row[5] : null,
  })).filter(r => r.client); // filter out empty rows

  cache = { data, ts: now };
  return data;
}

// Cloud Function entry point
export async function clients(req, res) {
  // CORS
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(204).send('');
  }

  try {
    const data = await getSheetData();
    res.json({ ok: true, clients: data, count: data.length });
  } catch (err) {
    console.error('Error reading sheet:', err);
    res.status(500).json({ ok: false, error: err.message });
  }
}
