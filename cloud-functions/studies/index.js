const functions = require("@google-cloud/functions-framework");
const { google } = require("googleapis");

const SHEET_ID = "1bus4GQQglvguMjNGcgtvcX0NQd8ubh6z_9licd_n-gs";
let cache = { data: null, ts: 0 };
const TTL = 60 * 1000;

functions.http("studies", async (req, res) => {
  res.set("Access-Control-Allow-Origin", "*");
  res.set("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.set("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(204).send("");

  try {
    const now = Date.now();
    if (cache.data && now - cache.ts < TTL) {
      return res.json({ ok: true, studies: cache.data, count: cache.data.length });
    }

    const auth = new google.auth.GoogleAuth({
      scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
    });
    const sheets = google.sheets({ version: "v4", auth });
    const result = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: "A:F",
    });

    const rows = result.data.values || [];
    if (rows.length < 2) return res.json({ ok: true, studies: [], count: 0 });

    const data = rows.slice(1).map((row) => ({
      name: row[0] || "",
      cs: row[1] || "",
      date: row[2] || "",
      delivery: row[3] || "",
      status: row[4] || "",
      link: row[5] || "",
    })).filter((r) => r.name);

    cache = { data, ts: now };
    res.json({ ok: true, studies: data, count: data.length });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, error: err.message });
  }
});
