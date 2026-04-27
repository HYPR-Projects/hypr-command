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

    // Save to BigQuery
    await bq.dataset(DATASET).table('tasks').insert([{
      id, type: t.type, client: t.client, agency: t.agency || null,
      products: t.products || [], features: t.features || [],
      budget: t.budget ? parseFloat(t.budget) : null,
      briefing: t.briefing, cs: t.cs, cs_email: t.csEmail || null,
      status: 'open', deadline: t.deadline, doc_link: null,
      requested_by: t.requestedBy || null,
      requester_email: t.requesterEmail || null,
      sla: slaLabel, created_at: now, updated_at: now,
    }])

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

    const setClauses = []
    if (updates.status !== undefined) setClauses.push(`status = '${updates.status}'`)
    if (updates.doc_link !== undefined) setClauses.push(`doc_link = '${updates.doc_link}'`)
    setClauses.push(`updated_at = '${now}'`)

    await bq.query({
      query: `UPDATE \`${PROJECT}.${DATASET}.tasks\` SET ${setClauses.join(', ')} WHERE id = '${id}'`,
      useLegacySql: false
    })

    // If completed, notify requester
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

    res.json({ ok: true })
  } catch (err) {
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
      'submittedByEmail','short_token',
      // praças variants kept out of extras (already mapped above)
      'praças_type','praças_state','praças_city','praças_other','praças_states','praças_cities',
      'praças_city_input','praças_city_state',
    ])
    const extras = {}
    for (const [key, value] of Object.entries(f)) {
      if (KNOWN_KEYS.has(key)) continue
      if (value === undefined || value === null || value === '') continue
      extras[key] = value
    }

    // Save to BigQuery
    await bq.dataset(DATASET).table('checklists').insert([{
      id: crypto.randomUUID(),
      cp_name: f.cp_name || null, cp_email: f.cp_email || null,
      agency: f.agency || null, industry: f.industry || null,
      campaign_type: f.campaign_type || null,
      client: f.client, campaign_name: f.campaign_name,
      start_date: f.start_date || null, end_date: f.end_date || null,
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
      pracas_detail: f.pracas_detail || f.praças_state || f.praças_city || f.praças_other || null,
      had_cs_meeting: f.had_cs_meeting === 'Sim' || f.had_cs_meeting === true,
      marketplaces: f.marketplaces || [],
      features: f.features || [],
      feature_volumes: JSON.stringify(f.feature_volumes || {}),
      pecas_link: f.pecas_link || null,
      redirect_urls: (f.extra_urls || []).filter(Boolean),
      pi_link: f.pi_link || null,
      proposta_link: f.proposta_link || null,
      cs_name: f.cs_name || null, cs_email: f.cs_email || null,
      submitted_by: f.submittedBy || null,
      submitted_by_email: f.submittedByEmail || null,
      short_token: f.short_token || null,
      extras: JSON.stringify(extras),
      created_at: now,
    }])

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
      pracasDetail: f.pracas_detail || f.praças_state || f.praças_city || f.praças_other || null,
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
    const rows = await query(
      `SELECT * FROM \`${PROJECT}.${DATASET}.checklists\` ORDER BY created_at DESC LIMIT 100`
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
      'submittedByEmail','short_token','id','created_at','updated_at','extras',
      'praças_type','praças_state','praças_city','praças_other','praças_states','praças_cities',
      'praças_city_input','praças_city_state',
    ])
    const extras = {}
    for (const [key, value] of Object.entries(f)) {
      if (KNOWN_KEYS.has(key)) continue
      if (value === undefined || value === null || value === '') continue
      extras[key] = value
    }

    // Build UPDATE statement
    const esc = v => {
      if (v === null || v === undefined) return 'NULL'
      if (typeof v === 'boolean') return v ? 'TRUE' : 'FALSE'
      if (typeof v === 'number') return String(v)
      if (Array.isArray(v)) return `[${v.map(x=>`'${String(x).replace(/'/g,"\\'")}'`).join(',')}]`
      return `'${String(v).replace(/'/g,"\\'")}'`
    }
    const sets = []
    const fld = (col, val) => { if (val !== undefined) sets.push(`${col} = ${esc(val)}`) }

    fld('cp_name', f.cp_name ?? null)
    fld('cp_email', f.cp_email ?? null)
    fld('agency', f.agency ?? null)
    fld('industry', f.industry ?? null)
    fld('campaign_type', f.campaign_type ?? null)
    if (f.client !== undefined) fld('client', f.client)
    if (f.campaign_name !== undefined) fld('campaign_name', f.campaign_name)
    if (f.start_date !== undefined) sets.push(`start_date = ${f.start_date ? `DATE '${f.start_date}'` : 'NULL'}`)
    if (f.end_date !== undefined) sets.push(`end_date = ${f.end_date ? `DATE '${f.end_date}'` : 'NULL'}`)
    if (f.investment !== undefined) sets.push(`investment = ${f.investment ? parseFloat(f.investment) : 'NULL'}`)
    if (f.deal_dv360 !== undefined) sets.push(`deal_dv360 = ${f.deal_dv360 === 'Sim' || f.deal_dv360 === true ? 'TRUE' : 'FALSE'}`)
    if (f.formats !== undefined) sets.push(`formats = ${esc(f.formats || [])}`)
    if (f.cpm !== undefined) sets.push(`cpm = ${f.cpm ? parseFloat(f.cpm) : 'NULL'}`)
    if (f.cpcv !== undefined) sets.push(`cpcv = ${f.cpcv ? parseFloat(f.cpcv) : 'NULL'}`)
    if (f.products !== undefined) sets.push(`products = ${esc(f.products || [])}`)
    if (f.o2o_impressoes !== undefined) sets.push(`o2o_impressoes = ${f.o2o_impressoes ? parseInt(f.o2o_impressoes) : 'NULL'}`)
    if (f.o2o_views !== undefined) sets.push(`o2o_views = ${f.o2o_views ? parseInt(f.o2o_views) : 'NULL'}`)
    if (f.has_bonus !== undefined) sets.push(`has_bonus = ${f.has_bonus === 'Sim' || f.has_bonus === true ? 'TRUE' : 'FALSE'}`)
    if (f.bonus_o2o_impressoes !== undefined) sets.push(`bonus_o2o_impressoes = ${f.bonus_o2o_impressoes ? parseInt(f.bonus_o2o_impressoes) : 'NULL'}`)
    if (f.bonus_o2o_views !== undefined) sets.push(`bonus_o2o_views = ${f.bonus_o2o_views ? parseInt(f.bonus_o2o_views) : 'NULL'}`)
    fld('ooh_link', f.ooh_link ?? null)
    fld('audiences', f.audiences ?? null)
    if (f.pracas_type !== undefined || f.praças_type !== undefined) fld('pracas_type', f.pracas_type || f.praças_type || null)
    if (f.pracas_detail !== undefined) fld('pracas_detail', f.pracas_detail ?? null)
    if (f.had_cs_meeting !== undefined) sets.push(`had_cs_meeting = ${f.had_cs_meeting === 'Sim' || f.had_cs_meeting === true ? 'TRUE' : 'FALSE'}`)
    if (f.marketplaces !== undefined) sets.push(`marketplaces = ${esc(f.marketplaces || [])}`)
    if (f.features !== undefined) sets.push(`features = ${esc(f.features || [])}`)
    if (f.feature_volumes !== undefined) sets.push(`feature_volumes = JSON '${JSON.stringify(f.feature_volumes || {}).replace(/'/g,"\\'")}'`)
    fld('pecas_link', f.pecas_link ?? null)
    if (f.extra_urls !== undefined) sets.push(`redirect_urls = ${esc((f.extra_urls || []).filter(Boolean))}`)
    fld('pi_link', f.pi_link ?? null)
    fld('proposta_link', f.proposta_link ?? null)
    fld('cs_name', f.cs_name ?? null)
    fld('cs_email', f.cs_email ?? null)
    sets.push(`extras = JSON '${JSON.stringify(extras).replace(/'/g,"\\'")}'`)

    const sql = `UPDATE \`${PROJECT}.${DATASET}.checklists\` SET ${sets.join(', ')} WHERE id = '${id}'`
    await bq.query({ query: sql, useLegacySql: false })

    res.json({ ok: true })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: err.message })
  }
})

// ── PROPOSALS ───────────────────────────────────────────────────────────────
app.get('/proposals', async (req, res) => {
  try {
    const { status, created_by_email } = req.query
    let sql = `SELECT * FROM \`${PROJECT}.${DATASET}.proposals\``
    const where = []
    if (status) where.push(`status = '${status}'`)
    if (created_by_email) where.push(`created_by_email = '${created_by_email}'`)
    if (where.length) sql += ` WHERE ${where.join(' AND ')}`
    sql += ` ORDER BY created_at DESC LIMIT 100`
    res.json(await query(sql))
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

app.post('/proposals', async (req, res) => {
  try {
    const p = req.body
    const id = crypto.randomUUID()
    const now = new Date().toISOString()

    // Save to BigQuery
    await bq.dataset(DATASET).table('proposals').insert([{
      id,
      created_at: now,
      created_by: p.createdBy || null,
      created_by_email: p.createdByEmail || null,
      client: p.client,
      agency: p.agency || null,
      period_start: p.periodStart || null,
      period_end: p.periodEnd || null,
      praca: p.praca || 'Nacional',
      project_description: p.projectDescription || null,
      proposal_title: p.proposalTitle || 'Pacote HYPR',
      scope_products: JSON.stringify(p.scopeProducts || []),
      contracted_products: JSON.stringify(p.contractedProducts || []),
      bonifications: JSON.stringify(p.bonifications || []),
      features: p.features || [],
      total_display_volume: p.totalVolumetriaDisplay ? parseInt(p.totalVolumetriaDisplay) : null,
      total_video_volume: p.totalVolumetriaVideo ? parseInt(p.totalVolumetriaVideo) : null,
      total_gross_value: p.totalValorBruto ? parseFloat(p.totalValorBruto) : null,
      total_net_value: p.totalValorLiquido ? parseFloat(p.totalValorLiquido) : null,
      total_bonification_value: p.totalBonificacao ? parseFloat(p.totalBonificacao) : null,
      status: p.status || 'draft',
      last_updated: now,
    }])

    res.json({ ok: true, id })
  } catch (err) {
    console.error('Error creating proposal:', err)
    res.status(500).json({ error: err.message })
  }
})

app.put('/proposals/:id', async (req, res) => {
  try {
    const { id } = req.params
    const updates = req.body
    const now = new Date().toISOString()

    const setClauses = []
    if (updates.status !== undefined) setClauses.push(`status = '${updates.status}'`)
    if (updates.client !== undefined) setClauses.push(`client = '${updates.client}'`)
    if (updates.agency !== undefined) setClauses.push(`agency = '${updates.agency}'`)
    // Add more fields as needed
    setClauses.push(`last_updated = '${now}'`)

    await bq.query({
      query: `UPDATE \`${PROJECT}.${DATASET}.proposals\` SET ${setClauses.join(', ')} WHERE id = '${id}'`,
      useLegacySql: false
    })

    res.json({ ok: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

app.delete('/proposals/:id', async (req, res) => {
  try {
    const { id } = req.params
    await bq.query({
      query: `DELETE FROM \`${PROJECT}.${DATASET}.proposals\` WHERE id = '${id}'`,
      useLegacySql: false
    })
    res.json({ ok: true })
  } catch (err) {
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
