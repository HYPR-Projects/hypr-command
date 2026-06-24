import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import crypto from 'crypto'
import { BigQuery } from '@google-cloud/bigquery'
import { google } from 'googleapis'
import nodemailer from 'nodemailer'

const app = express()
const PORT = process.env.PORT || 8080

app.use(cors({
  origin: [
    'https://hypr-command.netlify.app',
    process.env.FRONTEND_URL || 'http://localhost:5173',
    'http://localhost:5173',
    'http://localhost:4173',
  ]
}))
app.use(express.json())

// ══════════════════════════════════════════════════════════════════════════════
// BIGQUERY
// ══════════════════════════════════════════════════════════════════════════════
const bq = new BigQuery({
  projectId: process.env.GCP_PROJECT_ID,
  keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS,
})
const DATASET = process.env.BQ_DATASET || 'hypr_sales_center'

async function query(sql, params = []) {
  const [rows] = await bq.query({ query: sql, params, useLegacySql: false })
  return rows
}

// ══════════════════════════════════════════════════════════════════════════════
// GOOGLE SHEETS — Client lookup
// ══════════════════════════════════════════════════════════════════════════════
const SHEET_ID = process.env.CLIENTS_SHEET_ID || '1nd6UtJJ5fA81D9VZRiH2ZJGHYsiiv28LPzXhNRtd2aM'
let sheetsCache = { data: null, ts: 0 }
const CACHE_TTL = 60 * 1000 // 1 minute

async function getClientsFromSheet() {
  const now = Date.now()
  if (sheetsCache.data && (now - sheetsCache.ts) < CACHE_TTL) return sheetsCache.data

  const auth = new google.auth.GoogleAuth({
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
  })
  const sheets = google.sheets({ version: 'v4', auth })
  const res = await sheets.spreadsheets.values.get({ spreadsheetId: SHEET_ID, range: 'A:F' })
  const rows = res.data.values || []
  if (rows.length < 2) return []

  const data = rows.slice(1).map(row => ({
    agency: row[0] || '',
    client: row[1] || '',
    cp: row[2] || '',
    cpEmail: row[3] || '',
    cs: (row[4] && row[4] !== '#N/A' && row[4] !== 'Green Field') ? row[4] : null,
    csEmail: (row[5] && row[5] !== '#N/A') ? row[5] : null,
  })).filter(r => r.client)

  sheetsCache = { data, ts: now }
  return data
}

// ══════════════════════════════════════════════════════════════════════════════
// EMAIL — Nodemailer
// ══════════════════════════════════════════════════════════════════════════════
const mailer = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.EMAIL_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
})

const EMAIL_FROM = process.env.EMAIL_FROM || '"HYPR Command" <noreply@hypr.mobi>'
const FRONTEND_URL = process.env.FRONTEND_URL || 'https://hypr-command.netlify.app'

function fmtDate(d) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('pt-BR')
}

function fmtCurrency(val) {
  if (!val && val !== 0) return '—'
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val)
}

function productTags(products) {
  return (products || []).map(p =>
    `<span style="display:inline-block;padding:2px 10px;background:rgba(51,151,185,0.12);color:#3397B9;border-radius:99px;font-size:12px;font-weight:600;margin-right:4px;">${p}</span>`
  ).join('')
}

function featureTags(features) {
  return (features || []).map(f =>
    `<span style="display:inline-block;padding:2px 10px;background:#EEF1F4;color:#4A6070;border-radius:99px;font-size:12px;margin-right:4px;">${f}</span>`
  ).join('')
}

// ── Email header/footer shared ──────────────────────────────────────────────
function emailHeader() {
  return `<div style="background:#1C262F;padding:28px 32px;">
    <div style="font-size:24px;font-weight:800;color:#fff;letter-spacing:-0.5px;font-family:'Helvetica Neue',Arial,sans-serif;">HYPR <span style="color:#3397B9;font-weight:400;font-size:14px;letter-spacing:0.08em;">Command</span></div>
  </div>`
}

function emailFooter() {
  return `<div style="padding:20px 32px;text-align:center;background:#F4F6F8;">
    <div style="color:#8DA0AE;font-size:11px;font-family:'Helvetica Neue',Arial,sans-serif;">HYPR Command — Notificação automática</div>
    <div style="color:#C4D0D8;font-size:10px;margin-top:4px;font-family:'Helvetica Neue',Arial,sans-serif;">Este e-mail foi enviado automaticamente. Não responda.</div>
  </div>`
}

function emailRow(label, value) {
  return `<tr>
    <td style="padding:10px 0;color:#8DA0AE;font-size:11px;text-transform:uppercase;letter-spacing:0.06em;width:140px;vertical-align:top;border-bottom:1px solid #EEF1F4;">${label}</td>
    <td style="padding:10px 0;color:#1C262F;font-size:13px;border-bottom:1px solid #EEF1F4;">${value}</td>
  </tr>`
}

function ctaButton(text, url, bg = '#3397B9') {
  return `<div style="text-align:center;margin-top:24px;">
    <a href="${url}" style="display:inline-block;background:${bg};color:#fff;padding:14px 32px;border-radius:10px;text-decoration:none;font-weight:700;font-size:14px;font-family:'Helvetica Neue',Arial,sans-serif;">${text}</a>
  </div>`
}

// ══════════════════════════════════════════════════════════════════════════════
// EMAIL TEMPLATES — Approved
// ══════════════════════════════════════════════════════════════════════════════

// ── Task Created → CP (Solicitante) ─────────────────────────────────────────
function emailTaskCreatedCP(t) {
  return `<div style="font-family:'Helvetica Neue',Arial,sans-serif;max-width:600px;margin:0 auto;background:#f4f6f8;">
    ${emailHeader()}
    <div style="background:#3397B9;padding:14px 32px;">
      <div style="color:#fff;font-size:13px;font-weight:600;letter-spacing:0.04em;">✅ SUA TASK FOI CRIADA COM SUCESSO</div>
    </div>
    <div style="padding:28px 32px;background:#fff;">
      <p style="color:#4A6070;font-size:14px;line-height:1.6;margin:0 0 20px;">
        Olá, <strong>${t.requestedBy}</strong>! Sua solicitação foi registrada e enviada para o CS responsável.
      </p>
      <table style="width:100%;border-collapse:collapse;margin-bottom:20px;">
        ${emailRow('Task', `<strong>#${t.id}</strong> — ${t.type}`)}
        ${emailRow('Cliente', `<strong>${t.client}</strong> ${t.agency ? `<span style="color:#8DA0AE;font-size:12px;">(${t.agency})</span>` : ''}`)}
        ${(t.campaign_name || t.campaignName) ? emailRow('Campanha', `<strong>${t.campaign_name || t.campaignName}</strong>`) : ''}
        ${emailRow('CS Responsável', `<strong>${t.cs}</strong><br/><span style="color:#3397B9;font-size:12px;">${t.csEmail || '—'}</span>`)}
        ${emailRow('Produtos', productTags(t.products))}
        ${emailRow('Investimento', `<strong style="font-size:15px;">${fmtCurrency(t.budget)}</strong>`)}
        <tr>
          <td style="padding:10px 0;color:#8DA0AE;font-size:11px;text-transform:uppercase;letter-spacing:0.06em;width:140px;vertical-align:top;">Prazo</td>
          <td style="padding:10px 0;">
            <span style="display:inline-block;padding:4px 12px;background:rgba(239,68,68,0.1);color:#EF4444;border-radius:6px;font-weight:700;font-size:13px;">${fmtDate(t.deadline)}</span>
            <span style="color:#8DA0AE;font-size:12px;margin-left:6px;">(${t.sla || '—'})</span>
          </td>
        </tr>
      </table>
      <div style="background:#F4F6F8;border-radius:10px;padding:16px;border-left:3px solid #3397B9;margin-bottom:20px;">
        <div style="font-size:11px;color:#8DA0AE;text-transform:uppercase;letter-spacing:0.06em;margin-bottom:6px;">Briefing</div>
        <div style="color:#1C262F;font-size:13px;line-height:1.7;">${t.briefing}</div>
      </div>
      ${ctaButton('Ver Task no HYPR Command', FRONTEND_URL + '/#tasks')}
    </div>
    ${emailFooter()}
  </div>`
}

// ── Task Created → CS (Responsável) ─────────────────────────────────────────
function emailTaskCreatedCS(t) {
  return `<div style="font-family:'Helvetica Neue',Arial,sans-serif;max-width:600px;margin:0 auto;background:#f4f6f8;">
    ${emailHeader()}
    <div style="background:#EDD900;padding:14px 32px;">
      <div style="color:#1C262F;font-size:13px;font-weight:700;letter-spacing:0.04em;">📋 NOVA TASK RECEBIDA</div>
    </div>
    <div style="padding:28px 32px;background:#fff;">
      <p style="color:#4A6070;font-size:14px;line-height:1.6;margin:0 0 20px;">
        Olá, <strong>${t.cs}</strong>! Você recebeu uma nova solicitação de <strong>${t.requestedBy}</strong>.
      </p>
      <table style="width:100%;border-collapse:collapse;margin-bottom:20px;">
        ${emailRow('Task', `<strong>#${t.id}</strong> — ${t.type}`)}
        ${emailRow('Cliente', `<strong>${t.client}</strong> ${t.agency ? `<span style="color:#8DA0AE;font-size:12px;">(${t.agency})</span>` : ''}`)}
        ${(t.campaign_name || t.campaignName) ? emailRow('Campanha', `<strong>${t.campaign_name || t.campaignName}</strong>`) : ''}
        ${emailRow('Solicitado por', `<strong>${t.requestedBy}</strong><br/><span style="color:#3397B9;font-size:12px;">${t.requesterEmail}</span>`)}
        ${emailRow('Produtos', productTags(t.products))}
        ${(t.features || []).length > 0 ? emailRow('Features', featureTags(t.features)) : ''}
        ${emailRow('Investimento', `<strong style="font-size:15px;">${fmtCurrency(t.budget)}</strong>`)}
        <tr>
          <td style="padding:10px 0;color:#8DA0AE;font-size:11px;text-transform:uppercase;letter-spacing:0.06em;width:140px;vertical-align:top;">Prazo</td>
          <td style="padding:10px 0;">
            <span style="display:inline-block;padding:6px 16px;background:#EF4444;color:#fff;border-radius:8px;font-weight:700;font-size:14px;">${fmtDate(t.deadline)}</span>
            <span style="color:#8DA0AE;font-size:12px;margin-left:6px;">(${t.sla || '—'})</span>
          </td>
        </tr>
      </table>
      <div style="background:#F4F6F8;border-radius:10px;padding:16px;border-left:3px solid #EDD900;margin-bottom:20px;">
        <div style="font-size:11px;color:#8DA0AE;text-transform:uppercase;letter-spacing:0.06em;margin-bottom:6px;">Briefing</div>
        <div style="color:#1C262F;font-size:13px;line-height:1.7;">${t.briefing}</div>
      </div>
      ${ctaButton('Ver Task no HYPR Command', FRONTEND_URL + '/#tasks', '#1C262F')}
    </div>
    ${emailFooter()}
  </div>`
}

// ── Task Completed → Requester ──────────────────────────────────────────────
function emailTaskCompleted(t) {
  return `<div style="font-family:'Helvetica Neue',Arial,sans-serif;max-width:600px;margin:0 auto;background:#f4f6f8;">
    ${emailHeader()}
    <div style="background:#22C55E;padding:14px 32px;">
      <div style="color:#fff;font-size:13px;font-weight:600;letter-spacing:0.04em;">✅ TASK CONCLUÍDA</div>
    </div>
    <div style="padding:28px 32px;background:#fff;">
      <p style="color:#4A6070;font-size:14px;line-height:1.6;margin:0 0 20px;">
        Sua task <strong>#${t.id} — ${t.type}</strong> para <strong>${t.client}</strong> foi concluída pelo CS <strong>${t.cs}</strong>.
      </p>
      ${t.docLink ? `<div style="text-align:center;margin:20px 0;">
        <a href="${t.docLink}" style="display:inline-block;background:#22C55E;color:#fff;padding:14px 32px;border-radius:10px;text-decoration:none;font-weight:700;font-size:14px;">📄 Acessar Documento</a>
      </div>` : ''}
      ${ctaButton('Ver no HYPR Command', FRONTEND_URL + '/#tasks')}
    </div>
    ${emailFooter()}
  </div>`
}

// ── Checklist → CP (Solicitante) ────────────────────────────────────────────
function emailChecklistCP(c) {
  return `<div style="font-family:'Helvetica Neue',Arial,sans-serif;max-width:600px;margin:0 auto;background:#f4f6f8;">
    ${emailHeader()}
    <div style="background:#22C55E;padding:14px 32px;">
      <div style="color:#fff;font-size:13px;font-weight:600;letter-spacing:0.04em;">✅ CHECKLIST ENVIADO COM SUCESSO</div>
    </div>
    <div style="padding:28px 32px;background:#fff;">
      <p style="color:#4A6070;font-size:14px;line-height:1.6;margin:0 0 20px;">
        Olá, <strong>${c.submittedBy}</strong>! O checklist da campanha foi registrado. Confira o resumo:
      </p>
      <div style="background:#F4F6F8;border-radius:12px;padding:20px;margin-bottom:20px;">
        <div style="font-size:18px;font-weight:800;color:#1C262F;margin-bottom:4px;">${c.campaignName}</div>
        <div style="font-size:13px;color:#8DA0AE;">${c.client} — ${c.agency || '—'}</div>
      </div>
      <table style="width:100%;border-collapse:collapse;margin-bottom:20px;">
        ${emailRow('Tipo', c.campaignType)}
        ${emailRow('Indústria', c.industry)}
        ${emailRow('Período', `<strong>${fmtDate(c.startDate)} → ${fmtDate(c.endDate)}</strong>`)}
        ${emailRow('Investimento', `<strong style="font-size:15px;">${fmtCurrency(c.investment)}</strong>`)}
        ${emailRow('Deal DV360', c.dealDv360 ? 'Sim' : 'Não')}
        ${emailRow('Formatos', `${(c.formats || []).join(', ')}${c.cpm ? ` | CPM: ${fmtCurrency(c.cpm)}` : ''}${c.cpcv ? ` | CPCV: ${fmtCurrency(c.cpcv)}` : ''}`)}
        ${emailRow('Produtos', productTags(c.products))}
        ${(c.features || []).length > 0 ? emailRow('Features', featureTags(c.features)) : ''}
        ${c.audiences ? emailRow('Audiências', c.audiences) : ''}
        ${c.pracasDetail ? emailRow('Praças', c.pracasDetail) : ''}
      </table>
      ${c.csName ? `<div style="background:rgba(51,151,185,0.08);border-radius:10px;padding:14px 16px;margin-bottom:20px;">
        <div style="font-size:13px;color:#3397B9;font-weight:600;">CS Responsável: ${c.csName} (${c.csEmail || '—'})</div>
      </div>` : ''}
      ${ctaButton('Ver Checklist no HYPR Command', FRONTEND_URL + '/#checklist-center')}
    </div>
    ${emailFooter()}
  </div>`
}

// ── Checklist → CS (Responsável) ────────────────────────────────────────────
function emailChecklistCS(c) {
  return `<div style="font-family:'Helvetica Neue',Arial,sans-serif;max-width:600px;margin:0 auto;background:#f4f6f8;">
    ${emailHeader()}
    <div style="background:#EDD900;padding:14px 32px;">
      <div style="color:#1C262F;font-size:13px;font-weight:700;letter-spacing:0.04em;">📋 NOVO CHECKLIST RECEBIDO</div>
    </div>
    <div style="padding:28px 32px;background:#fff;">
      <p style="color:#4A6070;font-size:14px;line-height:1.6;margin:0 0 20px;">
        Um novo checklist foi enviado por <strong>${c.submittedBy}</strong> para a campanha abaixo. Revise as informações:
      </p>
      <div style="background:#F4F6F8;border-radius:12px;padding:20px;margin-bottom:20px;">
        <div style="font-size:18px;font-weight:800;color:#1C262F;margin-bottom:4px;">${c.campaignName}</div>
        <div style="font-size:13px;color:#8DA0AE;">${c.client} — ${c.agency || '—'}</div>
        <div style="font-size:12px;color:#3397B9;margin-top:4px;">Enviado por: ${c.submittedBy} (${c.submittedByEmail})</div>
      </div>
      <table style="width:100%;border-collapse:collapse;margin-bottom:20px;">
        ${emailRow('Tipo', c.campaignType)}
        ${emailRow('Período', `<strong>${fmtDate(c.startDate)} → ${fmtDate(c.endDate)}</strong>`)}
        ${emailRow('Investimento', `<strong style="font-size:15px;">${fmtCurrency(c.investment)}</strong>`)}
        ${emailRow('Formatos', `${(c.formats || []).join(', ')}${c.cpm ? ` | CPM: ${fmtCurrency(c.cpm)}` : ''}${c.cpcv ? ` | CPCV: ${fmtCurrency(c.cpcv)}` : ''}`)}
        ${emailRow('Produtos', productTags(c.products))}
        ${(c.features || []).length > 0 ? emailRow('Features', featureTags(c.features)) : ''}
        ${c.audiences ? emailRow('Audiências', c.audiences) : ''}
      </table>
      ${ctaButton('Ver Checklist no HYPR Command', FRONTEND_URL + '/#checklist-center', '#1C262F')}
    </div>
    ${emailFooter()}
  </div>`
}

// ── Send email helper ───────────────────────────────────────────────────────
async function sendEmail(to, subject, html) {
  if (!to) { console.warn('No recipient email, skipping'); return }
  try {
    await mailer.sendMail({ from: EMAIL_FROM, to, subject, html })
    console.log(`📧 Email sent to ${to}: ${subject}`)
  } catch (err) {
    console.error(`❌ Failed to send email to ${to}:`, err.message)
  }
}

// ══════════════════════════════════════════════════════════════════════════════
// BIGQUERY — Table DDL
// ══════════════════════════════════════════════════════════════════════════════
const PROJECT = process.env.GCP_PROJECT_ID
const SETUP_SQL = {
  campaigns: `
    CREATE TABLE IF NOT EXISTS \`${PROJECT}.${DATASET}.campaigns\` (
      id STRING, client STRING, campaign STRING, start_date DATE, end_date DATE,
      pacing_display FLOAT64, pacing_video FLOAT64, ctr FLOAT64, vtr FLOAT64,
      features ARRAY<STRING>, investment FLOAT64, created_at TIMESTAMP
    )`,
  tasks: `
    CREATE TABLE IF NOT EXISTS \`${PROJECT}.${DATASET}.tasks\` (
      id STRING, type STRING, client STRING, agency STRING,
      products ARRAY<STRING>, features ARRAY<STRING>,
      budget FLOAT64, briefing STRING, cs STRING, cs_email STRING,
      status STRING, deadline DATE, doc_link STRING,
      requested_by STRING, requester_email STRING,
      sla STRING, created_at TIMESTAMP, updated_at TIMESTAMP
    )`,
  checklists: `
    CREATE TABLE IF NOT EXISTS \`${PROJECT}.${DATASET}.checklists\` (
      id STRING, cp_name STRING, cp_email STRING, agency STRING,
      industry STRING, campaign_type STRING, client STRING, campaign_name STRING,
      start_date DATE, end_date DATE, investment FLOAT64,
      deal_dv360 BOOL, formats ARRAY<STRING>, cpm FLOAT64, cpcv FLOAT64,
      products ARRAY<STRING>, o2o_impressoes INT64, o2o_views INT64,
      has_bonus BOOL, bonus_o2o_impressoes INT64, bonus_o2o_views INT64,
      ooh_link STRING, audiences STRING, pracas_type STRING, pracas_detail STRING,
      had_cs_meeting BOOL, marketplaces ARRAY<STRING>, features ARRAY<STRING>,
      feature_volumes JSON, pecas_link STRING, redirect_urls ARRAY<STRING>,
      pi_link STRING, proposta_link STRING,
      cs_name STRING, cs_email STRING, submitted_by STRING, submitted_by_email STRING,
      short_token STRING,
      extras JSON,
      created_at TIMESTAMP
    )`
}

// ══════════════════════════════════════════════════════════════════════════════
// ROUTES
// ══════════════════════════════════════════════════════════════════════════════

app.get('/health', (_, res) => res.json({ status: 'ok', service: 'hypr-command', ts: new Date() }))

// ── Setup BQ tables ─────────────────────────────────────────────────────────
app.post('/setup', async (req, res) => {
  try {
    for (const [name, sql] of Object.entries(SETUP_SQL)) {
      await bq.query({ query: sql, useLegacySql: false })
      console.log(`✅ Table ${name} ready`)
    }
    res.json({ ok: true, message: 'All tables created' })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ── Clients from Google Sheet ───────────────────────────────────────────────
app.get('/clients', async (req, res) => {
  try {
    const data = await getClientsFromSheet()
    res.json({ ok: true, clients: data, count: data.length })
  } catch (err) {
    console.error(err)
    res.status(500).json({ ok: false, error: err.message })
  }
})

// ── CAMPAIGNS ───────────────────────────────────────────────────────────────
app.get('/campaigns', async (req, res) => {
  try {
    const { month, year } = req.query
    let sql = `SELECT * FROM \`${PROJECT}.${DATASET}.campaigns\``
    const where = []
    if (month) where.push(`EXTRACT(MONTH FROM start_date) = ${parseInt(month)}`)
    if (year) where.push(`EXTRACT(YEAR FROM start_date) = ${parseInt(year)}`)
    if (where.length) sql += ` WHERE ${where.join(' AND ')}`
    sql += ` ORDER BY start_date DESC`
    res.json(await query(sql))
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

app.post('/campaigns', async (req, res) => {
  try {
    const c = req.body
    await bq.dataset(DATASET).table('campaigns').insert([{
      id: crypto.randomUUID(),
      client: c.client, campaign: c.campaign,
      start_date: c.start, end_date: c.end,
      pacing_display: c.pacing_display ?? null,
      pacing_video: c.pacing_video ?? null,
      ctr: c.ctr ?? null, vtr: c.vtr ?? null,
      features: c.features || [],
      investment: c.investment ? parseFloat(c.investment) : null,
      created_at: new Date().toISOString(),
    }])
    res.json({ ok: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ── TASKS ────────────────────────────────────────────────────────────────────
app.get('/tasks', async (req, res) => {
  try {
    const { cs, status } = req.query
    let sql = `SELECT * FROM \`${PROJECT}.${DATASET}.tasks\``
    const where = []
    if (cs) where.push(`cs = '${cs}'`)
    if (status) where.push(`status = '${status}'`)
    if (where.length) sql += ` WHERE ${where.join(' AND ')}`
    sql += ` ORDER BY created_at DESC`
    res.json(await query(sql))
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

app.post('/tasks', async (req, res) => {
  try {
    const t = req.body
    const id = crypto.randomUUID()
    const now = new Date().toISOString()
    const slaLabel = t.sla || '—'

    // Save to BigQuery via DML INSERT (evita streaming buffer → permite UPDATE imediato)
    const normDateT = v => {
      if (!v) return null
      if (typeof v === 'object' && v?.value) v = v.value
      const s = String(v).slice(0, 10)
      return /^\d{4}-\d{2}-\d{2}$/.test(s) ? s : null
    }
    const tParams = {
      id, type: t.type || null, client: t.client || null, agency: t.agency || null,
      campaign_name: t.campaign_name || t.campaignName || null,
      products: t.products || [], features: t.features || [],
      budget: t.budget ? parseFloat(t.budget) : null,
      briefing: t.briefing || null, cs: t.cs || null, cs_email: t.csEmail || null,
      status: 'open', doc_link: null,
      requested_by: t.requestedBy || null,
      requester_email: t.requesterEmail || null,
      sla: slaLabel, created_at: now, updated_at: now,
    }
    const tTypes = {
      id: 'STRING', type: 'STRING', client: 'STRING', agency: 'STRING',
      campaign_name: 'STRING',
      products: ['STRING'], features: ['STRING'],
      budget: 'FLOAT64', briefing: 'STRING', cs: 'STRING', cs_email: 'STRING',
      status: 'STRING', doc_link: 'STRING',
      requested_by: 'STRING', requester_email: 'STRING',
      sla: 'STRING', created_at: 'STRING', updated_at: 'STRING',
    }
    // deadline como literal (parameter binding DATE bugado no SDK Node)
    const deadlineNorm = normDateT(t.deadline)
    const deadlineLiteral = deadlineNorm ? `DATE '${deadlineNorm}'` : 'NULL'
    const tSql = `
      INSERT INTO \`${PROJECT}.${DATASET}.tasks\` (
        id, type, client, agency, campaign_name, products, features, budget, briefing, cs, cs_email,
        status, deadline, doc_link, requested_by, requester_email, sla, created_at, updated_at
      ) VALUES (
        @id, @type, @client, @agency, @campaign_name, @products, @features, @budget, @briefing, @cs, @cs_email,
        @status, ${deadlineLiteral}, @doc_link, @requested_by, @requester_email, @sla, @created_at, @updated_at
      )
    `
    await bq.query({ query: tSql, params: tParams, types: tTypes, useLegacySql: false })

    const taskData = { ...t, id, sla: slaLabel }

    // Email → CS (responsável)
    if (t.csEmail) {
      await sendEmail(
        t.csEmail,
        `[HYPR Command] 📋 Nova Task — ${t.type} | ${t.client}`,
        emailTaskCreatedCS(taskData)
      )
    }

    // Email → CP (solicitante)
    if (t.requesterEmail) {
      await sendEmail(
        t.requesterEmail,
        `[HYPR Command] ✅ Task Criada — ${t.type} | ${t.client}`,
        emailTaskCreatedCP(taskData)
      )
    }

    res.json({ ok: true, id })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: err.message })
  }
})

app.put('/tasks/:id', async (req, res) => {
  try {
    const { id } = req.params
    const updates = req.body
    const now = new Date().toISOString()

    // Constrói SET clauses usando parâmetros nomeados do BigQuery — escape seguro
    const sets = []
    const params = { id }
    const types = { id: 'STRING' }
    const add = (col, val, type) => {
      const key = `p_${col}`
      sets.push(`${col} = @${key}`)
      params[key] = val
      types[key] = type
    }

    // Status / doc_link (uso original)
    if (updates.status !== undefined) add('status', updates.status, 'STRING')
    if (updates.doc_link !== undefined) add('doc_link', updates.doc_link, 'STRING')

    // Campos editáveis pelo CS/CP/admin via modal de edição
    // Aceita tanto snake_case quanto camelCase
    const cs = updates.cs ?? updates.cs_name
    if (cs !== undefined) add('cs', cs, 'STRING')
    const csEmail = updates.cs_email ?? updates.csEmail
    if (csEmail !== undefined) add('cs_email', csEmail || null, 'STRING')
    if (updates.briefing !== undefined) add('briefing', updates.briefing || null, 'STRING')
    if (updates.deadline !== undefined) {
      const d = typeof updates.deadline === 'object' && updates.deadline?.value
        ? updates.deadline.value
        : updates.deadline
      const ds = d ? String(d).slice(0, 10) : null
      // literal em vez de parameter binding (DATE bugado no SDK)
      if (ds && /^\d{4}-\d{2}-\d{2}$/.test(ds)) {
        sets.push(`deadline = DATE '${ds}'`)
      } else if (d === null || d === '') {
        sets.push(`deadline = NULL`)
      }
    }
    if (updates.budget !== undefined) {
      const b = updates.budget === null || updates.budget === '' ? null : parseFloat(updates.budget)
      add('budget', (b === null || isNaN(b)) ? null : b, 'FLOAT64')
    }
    if (updates.products !== undefined) {
      sets.push(`products = @p_products`)
      params.p_products = updates.products || []
      types.p_products = ['STRING']
    }
    if (updates.features !== undefined) {
      sets.push(`features = @p_features`)
      params.p_features = updates.features || []
      types.p_features = ['STRING']
    }
    if (updates.agency !== undefined) add('agency', updates.agency || null, 'STRING')
    const campaignName = updates.campaign_name ?? updates.campaignName
    if (campaignName !== undefined) add('campaign_name', campaignName || null, 'STRING')

    sets.push(`updated_at = @p_updated_at`)
    params.p_updated_at = now
    types.p_updated_at = 'STRING'

    // Escapa o id como literal no WHERE (mesma razão do PUT /checklists)
    const safeIdT = String(id).replace(/'/g, "''")
    const sql = `UPDATE \`${PROJECT}.${DATASET}.tasks\` SET ${sets.join(', ')} WHERE id = '${safeIdT}'`
    delete params.id
    delete types.id
    await bq.query({ query: sql, params, types, useLegacySql: false })

    // Se foi conclusão, notifica o solicitante
    if (updates.status === 'completed' && updates.task) {
      const t = updates.task
      if (t.requesterEmail) {
        await sendEmail(
          t.requesterEmail,
          `[HYPR Command] ✅ Task Concluída — ${t.type} | ${t.client}`,
          emailTaskCompleted({ ...t, id })
        )
      }
    }

    // Se foi troca de CS responsável, notifica novo CS e CS anterior
    if (csEmail !== undefined && updates.task) {
      const t = updates.task
      const previousCsEmail = updates.previousCsEmail || null
      if (csEmail && csEmail !== previousCsEmail) {
        try {
          await sendEmail(
            csEmail,
            `[HYPR Command] 🔁 Você foi designado para uma Task — ${t.type || ''} | ${t.client || ''}`,
            `<p>Olá,</p><p>Você foi designado como CS responsável pela task <b>${t.type || ''} — ${t.client || ''}</b>.</p><p>Acesse o HYPR Command para conferir os detalhes.</p>`
          )
        } catch (e) { console.error('Email novo CS falhou:', e.message) }
      }
      if (previousCsEmail && previousCsEmail !== csEmail) {
        try {
          await sendEmail(
            previousCsEmail,
            `[HYPR Command] ℹ️ Task reatribuída — ${t.type || ''} | ${t.client || ''}`,
            `<p>Olá,</p><p>A task <b>${t.type || ''} — ${t.client || ''}</b> foi reatribuída para outro CS.</p>`
          )
        } catch (e) { console.error('Email CS anterior falhou:', e.message) }
      }
    }

    res.json({ ok: true })
  } catch (err) {
    console.error('PUT /tasks/:id error:', err)
    res.status(500).json({ error: err.message })
  }
})

// ── CHECKLISTS ──────────────────────────────────────────────────────────────
app.post('/checklists', async (req, res) => {
  try {
    const f = req.body
    const now = new Date().toISOString()

    // Capture all dynamic fields (per-product volumes, feature volumes, surveys, etc.)
    // These come from the frontend with prefixes that don't map to fixed BQ columns.
    const KNOWN_KEYS = new Set([
      'cp_name','cp_email','agency','industry','campaign_type','client','campaign_name',
      'start_date','end_date','investment','deal_dv360','formats','cpm','cpcv','products',
      'o2o_impressoes','o2o_views','has_bonus','bonus_o2o_impressoes','bonus_o2o_views',
      'ooh_link','audiences','pracas_type','pracas_detail','had_cs_meeting','marketplaces',
      'features','feature_volumes','pecas_link','redirect_urls','extra_urls','pi_link',
      'proposta_link','cs_name','cs_email','submitted_by','submitted_by_email','submittedBy',
      'submittedByEmail','short_token','observations','marketing_action','studies_used',
      'groundflow_types','Groundflow_split_lift_imp','Groundflow_split_lift_views',
      'Groundflow_signals_imp','Groundflow_signals_views','Groundflow_plan_imp','Groundflow_plan_views',
      'Groundflow_patterns_imp','Groundflow_patterns_views',
      // praças variants kept out of extras (already mapped above)
      'praças_type','pracas_type','pracas_detail',
    ])
    const extras = {}
    for (const [key, value] of Object.entries(f)) {
      if (KNOWN_KEYS.has(key)) continue
      if (value === undefined || value === null || value === '') continue
      extras[key] = value
    }

    // Save to BigQuery via DML INSERT (não usa streaming buffer → permite UPDATE imediato)
    const checklistId = crypto.randomUUID()
    const normDate = v => {
      if (!v) return null
      if (typeof v === 'object' && v?.value) v = v.value
      const s = String(v).slice(0, 10)
      return /^\d{4}-\d{2}-\d{2}$/.test(s) ? s : null
    }
    const insertParams = {
      id: checklistId,
      cp_name: f.cp_name || null,
      cp_email: f.cp_email || null,
      agency: f.agency || null,
      industry: f.industry || null,
      campaign_type: f.campaign_type || null,
      client: f.client || null,
      campaign_name: f.campaign_name || null,
      investment: f.investment ? parseFloat(f.investment) : null,
      deal_dv360: f.deal_dv360 === 'Sim' || f.deal_dv360 === true,
      formats: f.formats || [],
      cpm: f.cpm ? parseFloat(f.cpm) : null,
      cpcv: f.cpcv ? parseFloat(f.cpcv) : null,
      products: f.products || [],
      o2o_impressoes: f.o2o_impressoes ? parseInt(f.o2o_impressoes) : null,
      o2o_views: f.o2o_views ? parseInt(f.o2o_views) : null,
      has_bonus: f.has_bonus === 'Sim' || f.has_bonus === true,
      bonus_o2o_impressoes: f.bonus_o2o_impressoes ? parseInt(f.bonus_o2o_impressoes) : null,
      bonus_o2o_views: f.bonus_o2o_views ? parseInt(f.bonus_o2o_views) : null,
      ooh_link: f.ooh_link || null,
      audiences: f.audiences || null,
      pracas_type: f.pracas_type || f.praças_type || null,
      pracas_detail: (() => {
        // Tenta encontrar o melhor detalhe baseado no tipo selecionado
        if (Array.isArray(f.praças_states) && f.praças_states.length > 0) return f.praças_states.join(', ');
        if (Array.isArray(f.praças_cities) && f.praças_cities.length > 0) return f.praças_cities.join(', ');
        if ((f.pracas_type || f.praças_type) === 'Brasil') return 'Brasil';
        return f.pracas_detail || f.praças_other || f.praças_state || f.praças_city || null;
      })(),
      had_cs_meeting: f.had_cs_meeting === 'Sim' || f.had_cs_meeting === true,
      marketplaces: f.marketplaces || [],
      features: f.features || [],
      feature_volumes: JSON.stringify(f.feature_volumes || {}),
      pecas_link: f.pecas_link || null,
      redirect_urls: (f.extra_urls || []).filter(Boolean),
      pi_link: f.pi_link || null,
      proposta_link: f.proposta_link || null,
      cs_name: f.cs_name || null,
      cs_email: f.cs_email || null,
      submitted_by: f.submittedBy || null,
      submitted_by_email: f.submittedByEmail || null,
      short_token: f.short_token || null,
      observations: f.observations || null,
      marketing_action: f.marketing_action || null,
      studies_used: Array.isArray(f.studies_used) ? f.studies_used.filter(Boolean) : [],
      groundflow_types: Array.isArray(f.groundflow_types) ? f.groundflow_types.filter(Boolean) : [],
      Groundflow_split_lift_imp: f.Groundflow_split_lift_imp || null,
      Groundflow_split_lift_views: f.Groundflow_split_lift_views || null,
      Groundflow_signals_imp: f.Groundflow_signals_imp || null,
      Groundflow_signals_views: f.Groundflow_signals_views || null,
      Groundflow_plan_imp: f.Groundflow_plan_imp || null,
      Groundflow_plan_views: f.Groundflow_plan_views || null,
      Groundflow_patterns_imp: f.Groundflow_patterns_imp || null,
      Groundflow_patterns_views: f.Groundflow_patterns_views || null,
      extras: JSON.stringify(extras),
      created_at: now,
    }
    const insertTypes = {
      id: 'STRING', cp_name: 'STRING', cp_email: 'STRING', agency: 'STRING', industry: 'STRING',
      campaign_type: 'STRING', client: 'STRING', campaign_name: 'STRING',
      investment: 'FLOAT64', deal_dv360: 'BOOL',
      formats: ['STRING'], cpm: 'FLOAT64', cpcv: 'FLOAT64',
      products: ['STRING'],
      o2o_impressoes: 'INT64', o2o_views: 'INT64', has_bonus: 'BOOL',
      bonus_o2o_impressoes: 'INT64', bonus_o2o_views: 'INT64',
      ooh_link: 'STRING', audiences: 'STRING',
      pracas_type: 'STRING', pracas_detail: 'STRING', had_cs_meeting: 'BOOL',
      marketplaces: ['STRING'], features: ['STRING'],
      feature_volumes: 'STRING', pecas_link: 'STRING',
      redirect_urls: ['STRING'], pi_link: 'STRING', proposta_link: 'STRING',
      cs_name: 'STRING', cs_email: 'STRING',
      submitted_by: 'STRING', submitted_by_email: 'STRING', short_token: 'STRING',
      observations: 'STRING', marketing_action: 'STRING',
      studies_used: ['STRING'],
      groundflow_types: ['STRING'],
      Groundflow_split_lift_imp: 'STRING', Groundflow_split_lift_views: 'STRING',
      Groundflow_signals_imp: 'STRING', Groundflow_signals_views: 'STRING',
      Groundflow_plan_imp: 'STRING', Groundflow_plan_views: 'STRING',
      Groundflow_patterns_imp: 'STRING', Groundflow_patterns_views: 'STRING',
      extras: 'STRING', created_at: 'STRING',
    }
    // Datas como literal (parameter binding de DATE bugado no SDK Node)
    const startDateNorm = normDate(f.start_date)
    const endDateNorm = normDate(f.end_date)
    const startDateLiteral = startDateNorm ? `DATE '${startDateNorm}'` : 'NULL'
    const endDateLiteral = endDateNorm ? `DATE '${endDateNorm}'` : 'NULL'
    const insertSql = `
      INSERT INTO \`${PROJECT}.${DATASET}.checklists\` (
        id, cp_name, cp_email, agency, industry, campaign_type, client, campaign_name,
        start_date, end_date, investment, deal_dv360, formats, cpm, cpcv, products,
        o2o_impressoes, o2o_views, has_bonus, bonus_o2o_impressoes, bonus_o2o_views,
        ooh_link, audiences, pracas_type, pracas_detail, had_cs_meeting, marketplaces,
        features, feature_volumes, pecas_link, redirect_urls, pi_link, proposta_link,
        cs_name, cs_email, submitted_by, submitted_by_email, short_token,
        observations, marketing_action, studies_used,
        groundflow_types, Groundflow_split_lift_imp, Groundflow_split_lift_views,
        Groundflow_signals_imp, Groundflow_signals_views, Groundflow_plan_imp, Groundflow_plan_views,
        Groundflow_patterns_imp, Groundflow_patterns_views,
        extras, created_at
      ) VALUES (
        @id, @cp_name, @cp_email, @agency, @industry, @campaign_type, @client, @campaign_name,
        ${startDateLiteral}, ${endDateLiteral}, @investment, @deal_dv360, @formats, @cpm, @cpcv, @products,
        @o2o_impressoes, @o2o_views, @has_bonus, @bonus_o2o_impressoes, @bonus_o2o_views,
        @ooh_link, @audiences, @pracas_type, @pracas_detail, @had_cs_meeting, @marketplaces,
        @features, PARSE_JSON(@feature_volumes), @pecas_link, @redirect_urls, @pi_link, @proposta_link,
        @cs_name, @cs_email, @submitted_by, @submitted_by_email, @short_token,
        @observations, @marketing_action, @studies_used,
        @groundflow_types, @Groundflow_split_lift_imp, @Groundflow_split_lift_views,
        @Groundflow_signals_imp, @Groundflow_signals_views, @Groundflow_plan_imp, @Groundflow_plan_views,
        @Groundflow_patterns_imp, @Groundflow_patterns_views,
        PARSE_JSON(@extras), @created_at
      )
    `
    console.log('[POST /checklists] start_date literal:', startDateLiteral, '| end_date literal:', endDateLiteral)
    await bq.query({ query: insertSql, params: insertParams, types: insertTypes, useLegacySql: false })

    const emailData = {
      client: f.client, agency: f.agency,
      campaignName: f.campaign_name, campaignType: f.campaign_type,
      industry: f.industry,
      startDate: f.start_date, endDate: f.end_date,
      investment: f.investment ? parseFloat(f.investment) : null,
      dealDv360: f.deal_dv360 === 'Sim' || f.deal_dv360 === true,
      formats: f.formats, cpm: f.cpm ? parseFloat(f.cpm) : null,
      cpcv: f.cpcv ? parseFloat(f.cpcv) : null,
      products: f.products, features: f.features,
      audiences: f.audiences,
      pracasDetail: (() => {
        if (Array.isArray(f.praças_states) && f.praças_states.length > 0) return f.praças_states.join(', ');
        if (Array.isArray(f.praças_cities) && f.praças_cities.length > 0) return f.praças_cities.join(', ');
        return f.pracas_detail || f.praças_other || f.praças_state || f.praças_city || null;
      })(),
      csName: f.cs_name, csEmail: f.cs_email,
      submittedBy: f.submittedBy || f.cp_name,
      submittedByEmail: f.submittedByEmail || f.cp_email,
    }

    // Email → CP (solicitante)
    const cpEmail = f.submittedByEmail || f.cp_email
    if (cpEmail) {
      await sendEmail(
        cpEmail,
        `[HYPR Command] ✅ Checklist Enviado — ${f.campaign_name} | ${f.client}`,
        emailChecklistCP(emailData)
      )
    }

    // Email → CS (responsável)
    if (f.cs_email) {
      await sendEmail(
        f.cs_email,
        `[HYPR Command] 📋 Novo Checklist — ${f.campaign_name} | ${f.client}`,
        emailChecklistCS(emailData)
      )
    }

    res.json({ ok: true })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: err.message })
  }
})

app.get('/checklists', async (req, res) => {
  try {
    // Corte do histórico no Command: apenas campanhas com start_date >= 2026-04-27
    // (primeiros checklists submetidos no HYPR Command). Checklists com start_date NULL
    // também são incluídos (podem ser registros em processo de criação).
    // Dados anteriores continuam no BQ intactos — apenas não são exibidos no app.
    const rows = await query(
      `SELECT * FROM \`${PROJECT}.${DATASET}.checklists\`
       WHERE start_date >= '2026-04-27' OR start_date IS NULL
       ORDER BY created_at DESC LIMIT 5000`
    )
    // Hydrate `extras` JSON back into the row, so dynamic fields like O2O_imp,
    // OOH_imp, fv_Topics_*, ftext_Survey, cl_features, etc. are visible to the frontend.
    const hydrated = rows.map(row => {
      const out = { ...row }
      if (row.extras) {
        let parsed = row.extras
        if (typeof parsed === 'string') {
          try { parsed = JSON.parse(parsed) } catch { parsed = {} }
        }
        if (parsed && typeof parsed === 'object') {
          for (const [k, v] of Object.entries(parsed)) {
            // Don't overwrite existing fixed columns
            if (out[k] === undefined || out[k] === null) out[k] = v
          }
        }
      }
      // Also parse feature_volumes JSON if it came as a string
      if (typeof out.feature_volumes === 'string') {
        try { out.feature_volumes = JSON.parse(out.feature_volumes) } catch {}
      }
      return out
    })
    res.json(hydrated)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ── PUT /checklists/:id — update existing checklist (used by Edit modal) ────
app.put('/checklists/:id', async (req, res) => {
  try {
    const { id } = req.params
    const f = req.body

    // Same separation as POST: known fixed columns vs. dynamic extras
    const KNOWN_KEYS = new Set([
      'cp_name','cp_email','agency','industry','campaign_type','client','campaign_name',
      'start_date','end_date','investment','deal_dv360','formats','cpm','cpcv','products',
      'o2o_impressoes','o2o_views','has_bonus','bonus_o2o_impressoes','bonus_o2o_views',
      'ooh_link','audiences','pracas_type','pracas_detail','had_cs_meeting','marketplaces',
      'features','feature_volumes','pecas_link','redirect_urls','extra_urls','pi_link',
      'proposta_link','cs_name','cs_email','submitted_by','submitted_by_email','submittedBy',
      'submittedByEmail','short_token','id','created_at','updated_at','extras','observations','marketing_action','studies_used','groundflow_types','Groundflow_split_lift_imp','Groundflow_split_lift_views','Groundflow_signals_imp','Groundflow_signals_views','Groundflow_plan_imp','Groundflow_plan_views','Groundflow_patterns_imp','Groundflow_patterns_views',
      'praças_type','pracas_type','pracas_detail',
    ])
    const extras = {}
    for (const [key, value] of Object.entries(f)) {
      if (KNOWN_KEYS.has(key)) continue
      if (value === undefined || value === null || value === '') continue
      extras[key] = value
    }

    // Build UPDATE statement with named parameters (safe escape, handles dates/quotes/specials)
    const sets = []
    const params = { id }
    const types = { id: 'STRING' }
    const add = (col, val, type) => {
      const key = `p_${col}`
      sets.push(`${col} = @${key}`)
      params[key] = val
      types[key] = type
    }
    // Normaliza datas: aceita string ISO, "YYYY-MM-DD", ou objeto {value: "YYYY-MM-DD"} (BQ DATE retornado pelo GET)
    const normDate = v => {
      if (!v) return null
      if (typeof v === 'object' && v?.value) v = v.value
      const s = String(v).slice(0, 10)
      return /^\d{4}-\d{2}-\d{2}$/.test(s) ? s : null
    }
    const toBool = v => v === 'Sim' || v === true || v === 'true'
    const toNum = v => {
      if (v === null || v === undefined || v === '') return null
      const n = parseFloat(v)
      return isNaN(n) ? null : n
    }
    const toInt = v => {
      if (v === null || v === undefined || v === '') return null
      const n = parseInt(v)
      return isNaN(n) ? null : n
    }

    // Para campos críticos (client, campaign_name, datas), só atualiza se o valor for válido.
    // Se o frontend mandar null/vazio/objeto malformado, OMITE do SET — mantém o que está no BQ.
    // Isso evita acidentes onde o edit modal não inclui o campo mas o frontend manda undefined/null.
    if (f.cp_name !== undefined) add('cp_name', f.cp_name || null, 'STRING')
    if (f.cp_email !== undefined) add('cp_email', f.cp_email || null, 'STRING')
    if (f.agency !== undefined) add('agency', f.agency || null, 'STRING')
    if (f.industry !== undefined) add('industry', f.industry || null, 'STRING')
    if (f.campaign_type !== undefined) add('campaign_type', f.campaign_type || null, 'STRING')
    // client e campaign_name: só sobrescreve se vier valor não-vazio
    if (f.client !== undefined && f.client) add('client', f.client, 'STRING')
    if (f.campaign_name !== undefined && f.campaign_name) add('campaign_name', f.campaign_name, 'STRING')
    // datas: só sobrescreve se a normalização produzir uma data válida (YYYY-MM-DD)
    // Usa LITERAL (validado por regex acima) em vez de parameter binding —
    // parameter binding pra DATE no SDK Node às vezes não aplica o UPDATE
    if (f.start_date !== undefined) {
      const nd = normDate(f.start_date)
      if (nd) sets.push(`start_date = DATE '${nd}'`)
    }
    if (f.end_date !== undefined) {
      const nd = normDate(f.end_date)
      if (nd) sets.push(`end_date = DATE '${nd}'`)
    }
    if (f.investment !== undefined) add('investment', toNum(f.investment), 'FLOAT64')
    if (f.deal_dv360 !== undefined) add('deal_dv360', toBool(f.deal_dv360), 'BOOL')
    if (f.formats !== undefined) {
      sets.push(`formats = @p_formats`); params.p_formats = f.formats || []; types.p_formats = ['STRING']
    }
    if (f.cpm !== undefined) add('cpm', toNum(f.cpm), 'FLOAT64')
    if (f.cpcv !== undefined) add('cpcv', toNum(f.cpcv), 'FLOAT64')
    if (f.products !== undefined) {
      sets.push(`products = @p_products`); params.p_products = f.products || []; types.p_products = ['STRING']
    }
    if (f.o2o_impressoes !== undefined) add('o2o_impressoes', toInt(f.o2o_impressoes), 'INT64')
    if (f.o2o_views !== undefined) add('o2o_views', toInt(f.o2o_views), 'INT64')
    if (f.has_bonus !== undefined) add('has_bonus', toBool(f.has_bonus), 'BOOL')
    if (f.bonus_o2o_impressoes !== undefined) add('bonus_o2o_impressoes', toInt(f.bonus_o2o_impressoes), 'INT64')
    if (f.bonus_o2o_views !== undefined) add('bonus_o2o_views', toInt(f.bonus_o2o_views), 'INT64')
    if (f.ooh_link !== undefined) add('ooh_link', f.ooh_link || null, 'STRING')
    if (f.audiences !== undefined) add('audiences', f.audiences || null, 'STRING')
    if (f.pracas_type !== undefined || f.praças_type !== undefined) add('pracas_type', f.pracas_type || f.praças_type || null, 'STRING')
    // Deriva pracas_detail dos campos do form (mesma lógica do POST) sempre que
    // o frontend mandar pelo menos um dos campos detalhados de praças.
    if (
      f.pracas_detail !== undefined ||
      f.praças_states !== undefined ||
      f.praças_cities !== undefined ||
      f.praças_other !== undefined ||
      f.praças_type !== undefined
    ) {
      const derivedDetail = (() => {
        if (Array.isArray(f.praças_states) && f.praças_states.length > 0) return f.praças_states.join(', ')
        if (Array.isArray(f.praças_cities) && f.praças_cities.length > 0) return f.praças_cities.join(', ')
        if ((f.pracas_type || f.praças_type) === 'Brasil') return 'Brasil'
        return f.pracas_detail || f.praças_other || null
      })()
      add('pracas_detail', derivedDetail, 'STRING')
    }
    if (f.had_cs_meeting !== undefined) add('had_cs_meeting', toBool(f.had_cs_meeting), 'BOOL')
    if (f.marketplaces !== undefined) {
      sets.push(`marketplaces = @p_marketplaces`); params.p_marketplaces = f.marketplaces || []; types.p_marketplaces = ['STRING']
    }
    if (f.features !== undefined) {
      sets.push(`features = @p_features`); params.p_features = f.features || []; types.p_features = ['STRING']
    }
    if (f.studies_used !== undefined) {
      sets.push(`studies_used = @p_studies_used`); params.p_studies_used = Array.isArray(f.studies_used) ? f.studies_used.filter(Boolean) : []; types.p_studies_used = ['STRING']
    }
    if (f.groundflow_types !== undefined) {
      sets.push(`groundflow_types = @p_groundflow_types`); params.p_groundflow_types = Array.isArray(f.groundflow_types) ? f.groundflow_types.filter(Boolean) : []; types.p_groundflow_types = ['STRING']
    }
    ;['Groundflow_split_lift_imp','Groundflow_split_lift_views','Groundflow_signals_imp','Groundflow_signals_views','Groundflow_plan_imp','Groundflow_plan_views','Groundflow_patterns_imp','Groundflow_patterns_views'].forEach(col=>{
      if (f[col] !== undefined) {
        sets.push(`${col} = @p_${col}`); params[`p_${col}`] = f[col] || null; types[`p_${col}`] = 'STRING'
      }
    })
    if (f.feature_volumes !== undefined) {
      sets.push(`feature_volumes = PARSE_JSON(@p_feature_volumes)`)
      params.p_feature_volumes = JSON.stringify(f.feature_volumes || {})
      types.p_feature_volumes = 'STRING'
    }
    if (f.pecas_link !== undefined) add('pecas_link', f.pecas_link || null, 'STRING')
    if (f.extra_urls !== undefined) {
      sets.push(`redirect_urls = @p_redirect_urls`)
      params.p_redirect_urls = (f.extra_urls || []).filter(Boolean)
      types.p_redirect_urls = ['STRING']
    }
    if (f.pi_link !== undefined) add('pi_link', f.pi_link || null, 'STRING')
    if (f.proposta_link !== undefined) add('proposta_link', f.proposta_link || null, 'STRING')
    if (f.cs_name !== undefined) add('cs_name', f.cs_name || null, 'STRING')
    if (f.cs_email !== undefined) add('cs_email', f.cs_email || null, 'STRING')
    if (f.observations !== undefined) add('observations', f.observations || null, 'STRING')
    if (f.marketing_action !== undefined) add('marketing_action', f.marketing_action || null, 'STRING')

    sets.push(`extras = PARSE_JSON(@p_extras)`)
    params.p_extras = JSON.stringify(extras)
    types.p_extras = 'STRING'

    // Escapa o id como literal no WHERE — parameter binding em DML
    // tem comportamento esquisito no BQ (retorna 0 rows affected mesmo
    // com id válido). UUID é seguro escapar como literal.
    const safeId = String(id).replace(/'/g, "''")
    const sql = `UPDATE \`${PROJECT}.${DATASET}.checklists\` SET ${sets.join(', ')} WHERE id = '${safeId}'`
    // Remove o id do params já que agora vai como literal
    delete params.id
    delete types.id
    console.log('[PUT /checklists] SQL:', sql)
    console.log('[PUT /checklists] PARAMS:', JSON.stringify(params))
    const [job] = await bq.createQueryJob({ query: sql, params, types, useLegacySql: false })
    await job.getQueryResults()
    const [meta] = await job.getMetadata()
    console.log('[PUT /checklists] numDmlAffectedRows:', meta.statistics?.query?.numDmlAffectedRows)

    res.json({ ok: true })
  } catch (err) {
    console.error('PUT /checklists/:id error:', err)
    res.status(500).json({ error: err.message })
  }
})

// ═══════════════════════════════════════════════════════════════════════
// DELETE /checklists/:id
// Permissão: admin, CP que enviou (submitted_by_email/cp_email), ou CS responsável (cs_email)
// ═══════════════════════════════════════════════════════════════════════
app.delete('/checklists/:id', async (req, res) => {
  try {
    const { id } = req.params
    const requesterEmail = (req.body?.requesterEmail || '').toString().toLowerCase().trim()

    if (!requesterEmail) {
      return res.status(400).json({ error: 'requesterEmail é obrigatório' })
    }
    // Sanitiza id (UUID format) pra evitar SQL injection — só permite alfanumérico e hífens
    if (!/^[a-zA-Z0-9-]+$/.test(id)) {
      return res.status(400).json({ error: 'id inválido' })
    }

    // 1) Busca o checklist pra verificar quem é dono
    const [rows] = await bq.query({
      query: `SELECT submitted_by_email, cp_email, cs_email FROM \`${PROJECT}.${DATASET}.checklists\` WHERE id = '${id}' LIMIT 1`,
      useLegacySql: false
    })
    if (!rows || rows.length === 0) {
      return res.status(404).json({ error: 'Checklist não encontrado' })
    }
    const c = rows[0]
    const submittedByEmail = (c.submitted_by_email || '').toLowerCase()
    const cpEmail = (c.cp_email || '').toLowerCase()
    const csEmail = (c.cs_email || '').toLowerCase()

    // 2) Verifica se requesterEmail é admin via team_members
    const [adminRows] = await bq.query({
      query: `SELECT role FROM \`${PROJECT}.${DATASET}.team_members\` WHERE LOWER(email) = '${requesterEmail.replace(/'/g, "''")}' LIMIT 1`,
      useLegacySql: false
    })
    const isAdmin = adminRows?.[0]?.role === 'admin'

    // 3) Decide se pode deletar
    const isOwnerCP = requesterEmail === submittedByEmail || requesterEmail === cpEmail
    const isOwnerCS = requesterEmail === csEmail
    if (!isAdmin && !isOwnerCP && !isOwnerCS) {
      return res.status(403).json({ error: 'Apenas o CP que enviou, o CS responsável ou admin pode excluir' })
    }

    // 4) Hard delete
    await bq.query({
      query: `DELETE FROM \`${PROJECT}.${DATASET}.checklists\` WHERE id = '${id}'`,
      useLegacySql: false
    })

    res.json({ ok: true, deleted_by: requesterEmail, role: isAdmin ? 'admin' : isOwnerCP ? 'cp' : 'cs' })
  } catch (err) {
    console.error('DELETE /checklists/:id error:', err)
    res.status(500).json({ error: err.message })
  }
})

// ══════════════════════════════════════════════════════════════════════════════
// GET /admin/analytics
// Retorna analytics agregados por CP, com KPIs gerais e lista de checklists com problemas
// Query params (opcionais): start_date, end_date (formato YYYY-MM-DD)
// Default: start_date = 2026-04-27 (início do HYPR Command)
// ══════════════════════════════════════════════════════════════════════════════

// Sanitiza valor de impressão que pode vir em formato BR ("3.000.000" ou "3000000")
// Retorna número ou null
function sanitizeImpressao(v) {
  if (v === null || v === undefined || v === '') return null
  if (typeof v === 'number') return Number.isFinite(v) ? v : null
  let s = String(v).trim()
  if (!s) return null
  // Se tem ponto e os grupos depois do ponto têm 3 dígitos, é separador de milhares BR
  // Ex: "3.000.000", "550.000", "1.234.567"
  // Se tem ponto e o grupo depois tem 1-2 dígitos, é decimal US
  // Ex: "550.00", "3.5"
  // Se tem vírgula, é decimal BR
  if (s.includes(',')) {
    // Decimal BR: remove pontos de milhares, troca vírgula por ponto
    s = s.replace(/\./g, '').replace(',', '.')
  } else if (s.includes('.')) {
    // Verifica se é separador de milhares ou decimal
    const parts = s.split('.')
    const lastPart = parts[parts.length - 1]
    if (parts.length > 2 || lastPart.length === 3) {
      // Separador de milhares BR (múltiplos pontos OU último grupo com 3 dígitos)
      s = s.replace(/\./g, '')
    }
    // Senão, deixa como decimal US
  }
  const n = parseFloat(s)
  return Number.isFinite(n) ? Math.round(n) : null
}

app.get('/admin/analytics', async (req, res) => {
  try {
    const startDate = req.query.start_date || '2026-04-27'
    const endDate = req.query.end_date || null

    // Valida formato de data (YYYY-MM-DD) anti-injection
    const dateRe = /^\d{4}-\d{2}-\d{2}$/
    if (!dateRe.test(startDate)) return res.status(400).json({ error: 'start_date inválido' })
    if (endDate && !dateRe.test(endDate)) return res.status(400).json({ error: 'end_date inválido' })

    // Monta WHERE com filtros de período aplicados ao start_date da campanha
    let where = `start_date >= '${startDate}'`
    if (endDate) where += ` AND start_date <= '${endDate}'`

    // 1) Busca checklists do período (inclui cpm, cpcv e formats pra split Display/Video)
    const checklists = await query(
      `SELECT id, client, campaign_name, cp_name, cp_email, start_date, end_date,
              investment, cpm, cpcv, formats, extras
       FROM \`${PROJECT}.${DATASET}.checklists\`
       WHERE ${where}
       ORDER BY start_date DESC`
    )

    // 2) Busca tasks abertas por solicitante (cp_email/requester_email) no mesmo período
    // Filtro por created_at da task (não tem start_date em task)
    let taskWhere = `created_at >= '${startDate}'`
    if (endDate) taskWhere += ` AND created_at <= '${endDate}T23:59:59'`
    const tasks = await query(
      `SELECT requester_email, requested_by
       FROM \`${PROJECT}.${DATASET}.tasks\`
       WHERE ${taskWhere}`
    )

    // 3) Agrega por CP
    const byCp = new Map() // chave: cp_name (normalizado), valor: agregado
    const problematic = []

    function getOrCreateCp(name, email) {
      const key = (name || 'Desconhecido').trim()
      if (!byCp.has(key)) {
        byCp.set(key, {
          cp_name: key,
          cp_email: email || null,
          checklists: 0,
          investment: 0,
          // Display
          impressoes_display_contratadas: 0,
          impressoes_display_bonificadas: 0,
          invest_display: 0,
          cpm_negociado_sum_weighted: 0, // soma(cpm × invest) pra ponderar
          cpm_negociado_weight: 0,       // soma(invest) onde houve cpm
          // Video
          views_video_contratadas: 0,
          views_video_bonificadas: 0,
          invest_video: 0,
          cpcv_negociado_sum_weighted: 0,
          cpcv_negociado_weight: 0,
          // Misc
          tasks_abertas: 0,
          campaigns: [], // detalhe pra drill-down
        })
      }
      return byCp.get(key)
    }

    // Parse formats (pode ser array nativo ou JSON string)
    function parseFormats(f) {
      if (Array.isArray(f)) return f
      if (typeof f === 'string') {
        try { return JSON.parse(f) } catch { return [] }
      }
      return []
    }

    // Parse cada checklist
    for (const c of checklists) {
      const cp = getOrCreateCp(c.cp_name, c.cp_email)
      cp.checklists++
      const inv = parseFloat(c.investment) || 0
      cp.investment += inv

      // Lê impressões do extras (JSON)
      let extras = c.extras
      if (typeof extras === 'string') {
        try { extras = JSON.parse(extras) } catch { extras = {} }
      }
      extras = extras || {}

      // Display (impressões) — soma O2O + OOH + Groundflow + RMND
      // Groundflow: chave nova 'Groundflow_imp', com fallback pra 'RMNF_imp' (legado — mesmo produto, nome antigo)
      const o2oImp = sanitizeImpressao(extras.O2O_imp)
      const o2oBonus = sanitizeImpressao(extras.O2O_bonus_imp)
      const oohImp = sanitizeImpressao(extras.OOH_imp)
      const oohBonus = sanitizeImpressao(extras.OOH_bonus_imp)
      const gfImp = sanitizeImpressao(extras.Groundflow_imp ?? extras.RMNF_imp)
      const gfBonus = sanitizeImpressao(extras.Groundflow_bonus_imp ?? extras.RMNF_bonus_imp)
      const rmndImp = sanitizeImpressao(extras.RMND_imp)
      const rmndBonus = sanitizeImpressao(extras.RMND_bonus_imp)
      const displayContratada = (o2oImp || 0) + (oohImp || 0) + (gfImp || 0) + (rmndImp || 0)
      const displayBonificada = (o2oBonus || 0) + (oohBonus || 0) + (gfBonus || 0) + (rmndBonus || 0)

      // Video (views) — soma O2O + OOH + Groundflow + RMND views
      const o2oViews = sanitizeImpressao(extras.O2O_views)
      const o2oBonusViews = sanitizeImpressao(extras.O2O_bonus_views)
      const oohViews = sanitizeImpressao(extras.OOH_views)
      const oohBonusViews = sanitizeImpressao(extras.OOH_bonus_views)
      const gfViews = sanitizeImpressao(extras.Groundflow_views ?? extras.RMNF_views)
      const gfBonusViews = sanitizeImpressao(extras.Groundflow_bonus_views ?? extras.RMNF_bonus_views)
      const rmndViews = sanitizeImpressao(extras.RMND_views)
      const rmndBonusViews = sanitizeImpressao(extras.RMND_bonus_views)
      const videoContratada = (o2oViews || 0) + (oohViews || 0) + (gfViews || 0) + (rmndViews || 0)
      const videoBonificada = (o2oBonusViews || 0) + (oohBonusViews || 0) + (gfBonusViews || 0) + (rmndBonusViews || 0)

      const cpmVal = parseFloat(c.cpm) || null
      const cpcvVal = parseFloat(c.cpcv) || null
      const formats = parseFormats(c.formats)
      const hasDisplay = formats.includes('Display') || displayContratada > 0
      const hasVideo = formats.includes('Video') || videoContratada > 0

      // ── Validação: detecta dados incompletos que distorceriam o CPM Real ──
      // Casos problemáticos:
      // 1) Tem investimento mas zero impressões/views → "Sem impressões cadastradas"
      // 2) Tem Display+Video mas cpm OU cpcv = NULL → "CPM/CPV não preenchido"
      // 3) Tem só Display mas cpm = NULL → "CPM não preenchido"
      // 4) Tem só Video mas cpcv = NULL → "CPV não preenchido"
      let issue = null
      if (inv > 0 && displayContratada === 0 && videoContratada === 0) {
        issue = 'Sem impressões/views cadastradas'
      } else if (hasDisplay && hasVideo && (!cpmVal || !cpcvVal)) {
        issue = 'CPM ou CPV não preenchido (Display+Video)'
      } else if (hasDisplay && !hasVideo && !cpmVal && displayContratada > 0) {
        issue = 'CPM não preenchido'
      } else if (hasVideo && !hasDisplay && !cpcvVal && videoContratada > 0) {
        issue = 'CPV não preenchido'
      }

      // Inicializa storage do detalhe da campanha (sempre — pra drill-down)
      let campaignCpmReal = null, campaignCpvReal = null
      let invDisplay = 0, invVideo = 0

      if (issue) {
        // Checklist incompleto → flagga e NÃO acumula nos KPIs reais
        problematic.push({
          id: c.id,
          client: c.client,
          campaign_name: c.campaign_name,
          cp_name: c.cp_name,
          start_date: c.start_date?.value || c.start_date,
          end_date: c.end_date?.value || c.end_date,
          investment: inv,
          issue,
        })
      } else {
        // Divisão de investimento entre Display e Video
        if (hasDisplay && hasVideo && displayContratada > 0 && videoContratada > 0) {
          // Divisão proporcional ao custo teórico (cpm × imp + cpcv × views)
          const custoDisplay = (displayContratada * cpmVal) / 1000
          const custoVideo = videoContratada * cpcvVal
          const total = custoDisplay + custoVideo
          if (total > 0) {
            invDisplay = inv * (custoDisplay / total)
            invVideo = inv * (custoVideo / total)
          } else {
            invDisplay = inv
          }
        } else if (hasVideo && !hasDisplay) {
          invVideo = inv
        } else {
          invDisplay = inv
        }

        // CPM/CPV REAL desta campanha (denominador inclui bonificadas)
        const totalDisp = displayContratada + displayBonificada
        const totalVid = videoContratada + videoBonificada
        if (totalDisp > 0) campaignCpmReal = (invDisplay / totalDisp) * 1000
        if (totalVid > 0) campaignCpvReal = invVideo / totalVid

        cp.impressoes_display_contratadas += displayContratada
        cp.impressoes_display_bonificadas += displayBonificada
        cp.invest_display += invDisplay
        cp.views_video_contratadas += videoContratada
        cp.views_video_bonificadas += videoBonificada
        cp.invest_video += invVideo

        // CPM/CPV negociado (média ponderada por investimento da parte correspondente)
        if (cpmVal && invDisplay > 0) {
          cp.cpm_negociado_sum_weighted += cpmVal * invDisplay
          cp.cpm_negociado_weight += invDisplay
        }
        if (cpcvVal && invVideo > 0) {
          cp.cpcv_negociado_sum_weighted += cpcvVal * invVideo
          cp.cpcv_negociado_weight += invVideo
        }
      }

      // Sempre adiciona ao array de campanhas do CP (mesmo problemáticas)
      cp.campaigns.push({
        id: c.id,
        client: c.client,
        campaign_name: c.campaign_name,
        start_date: c.start_date?.value || c.start_date,
        end_date: c.end_date?.value || c.end_date,
        investment: inv,
        impressoes_display: displayContratada + displayBonificada,
        views_video: videoContratada + videoBonificada,
        cpm_negociado: cpmVal,
        cpv_negociado: cpcvVal,
        cpm_real: campaignCpmReal,
        cpv_real: campaignCpvReal,
        issue,
      })
    }

    // Conta tasks abertas por email do solicitante (cp_email do team_members)
    // Como tasks usam requester_email, e os CPs identificam-se pelo cp_email,
    // vamos contar tasks onde requester_email bate com algum cp_email conhecido
    const cpEmailMap = new Map() // email lowercase -> cp_name (do agregado)
    for (const cp of byCp.values()) {
      if (cp.cp_email) cpEmailMap.set(cp.cp_email.toLowerCase(), cp.cp_name)
    }
    // Tasks: associa pelo requester_email
    for (const t of tasks) {
      const email = (t.requester_email || '').toLowerCase()
      if (!email) continue
      const cpName = cpEmailMap.get(email)
      if (cpName) {
        const cp = byCp.get(cpName)
        if (cp) cp.tasks_abertas++
      }
    }

    // Calcula CPM/CPV por CP e totais
    let totalInv = 0
    let totalDisplayContrat = 0, totalDisplayBonif = 0, totalInvestDisplay = 0
    let totalVideoContrat = 0, totalVideoBonif = 0, totalInvestVideo = 0
    let totalCpmWeightSum = 0, totalCpmWeight = 0
    let totalCpcvWeightSum = 0, totalCpcvWeight = 0

    for (const cp of byCp.values()) {
      // CPM Real Display = invest_display / (impr_display_contratada + bonificada) * 1000
      const totalDisplayImps = cp.impressoes_display_contratadas + cp.impressoes_display_bonificadas
      cp.cpm_real = totalDisplayImps > 0 ? (cp.invest_display / totalDisplayImps) * 1000 : null

      // CPV Real Video = invest_video / (views_contratadas + bonificadas)
      const totalVideoViews = cp.views_video_contratadas + cp.views_video_bonificadas
      cp.cpv_real = totalVideoViews > 0 ? (cp.invest_video / totalVideoViews) : null

      // CPM Negociado = média ponderada
      cp.cpm_negociado = cp.cpm_negociado_weight > 0 ? cp.cpm_negociado_sum_weighted / cp.cpm_negociado_weight : null

      // CPV Negociado = média ponderada
      cp.cpv_negociado = cp.cpcv_negociado_weight > 0 ? cp.cpcv_negociado_sum_weighted / cp.cpcv_negociado_weight : null

      // Remove os campos intermediários (não precisa expor no JSON final)
      delete cp.cpm_negociado_sum_weighted
      delete cp.cpm_negociado_weight
      delete cp.cpcv_negociado_sum_weighted
      delete cp.cpcv_negociado_weight

      // Acumula totais
      totalInv += cp.investment
      totalDisplayContrat += cp.impressoes_display_contratadas
      totalDisplayBonif += cp.impressoes_display_bonificadas
      totalInvestDisplay += cp.invest_display
      totalVideoContrat += cp.views_video_contratadas
      totalVideoBonif += cp.views_video_bonificadas
      totalInvestVideo += cp.invest_video
      if (cp.cpm_negociado != null) {
        totalCpmWeightSum += cp.cpm_negociado * cp.invest_display
        totalCpmWeight += cp.invest_display
      }
      if (cp.cpv_negociado != null) {
        totalCpcvWeightSum += cp.cpv_negociado * cp.invest_video
        totalCpcvWeight += cp.invest_video
      }
    }

    const totalDisplayImpsAll = totalDisplayContrat + totalDisplayBonif
    const totalVideoViewsAll = totalVideoContrat + totalVideoBonif
    const cpmRealGeral = totalDisplayImpsAll > 0 ? (totalInvestDisplay / totalDisplayImpsAll) * 1000 : null
    const cpvRealGeral = totalVideoViewsAll > 0 ? (totalInvestVideo / totalVideoViewsAll) : null
    const cpmNegociadoGeral = totalCpmWeight > 0 ? totalCpmWeightSum / totalCpmWeight : null
    const cpvNegociadoGeral = totalCpcvWeight > 0 ? totalCpcvWeightSum / totalCpcvWeight : null

    // Ordena CPs por investimento desc
    const byCpArray = [...byCp.values()].sort((a, b) => b.investment - a.investment)

    res.json({
      period: { start: startDate, end: endDate },
      totals: {
        checklists: checklists.length,
        investment: totalInv,
        impressoes_display_contratadas: totalDisplayContrat,
        impressoes_display_bonificadas: totalDisplayBonif,
        views_video_contratadas: totalVideoContrat,
        views_video_bonificadas: totalVideoBonif,
        cpm_real: cpmRealGeral,
        cpv_real: cpvRealGeral,
        cpm_negociado: cpmNegociadoGeral,
        cpv_negociado: cpvNegociadoGeral,
      },
      by_cp: byCpArray,
      problematic_checklists: problematic,
    })
  } catch (err) {
    console.error('GET /admin/analytics error:', err)
    res.status(500).json({ error: err.message })
  }
})

// ══════════════════════════════════════════════════════════════════════════════
// START
// ══════════════════════════════════════════════════════════════════════════════
app.listen(PORT, () => {
  console.log(`\n🚀 HYPR Command Backend — http://localhost:${PORT}`)
  console.log(`   BigQuery: ${PROJECT}.${DATASET}`)
  console.log(`   Sheet: ${SHEET_ID}`)
  console.log(`   Frontend: ${FRONTEND_URL}\n`)
})
