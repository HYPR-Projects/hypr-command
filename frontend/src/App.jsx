import { useState, useEffect, useMemo, useRef, createContext, useContext, useCallback } from "react";
import { LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

// ─── CONSTANTS ───────────────────────────────────────────────────────────────
const CS_LIST = ["Beatriz Severine","Isaac Agiman","João Armelin","João Buzolin","Mariana Lewinski","Thiago Nascimento","Greenfield"];
const GREENFIELD_QUEUE = CS_LIST.filter(c => c !== "Greenfield");
const TASK_TYPES = ["Audience Discovery","Estudo de Mercado","Case de Sucesso","Pós-Venda","Dados RMNF"];
const SLA_DAYS = { "Audience Discovery": 3, "Estudo de Mercado": 5, "Case de Sucesso": 7, "Pós-Venda": 2, "Dados RMNF": 3 };
const CORE_PRODUCTS = ["O2O","OOH","RMN Digital","RMN Físico"];
const CHECKLIST_CORE_PRODUCTS = ["O2O","OOH","RMNF","RMND"];
const FEATURES = ["P-DOOH","Brand Query","Carbon Neutral","Click to Calendar","Design Studio","Downloaded Apps","Tap To Scratch","Tap to Go","Topics","Seat","Tap To Carousel","Tap To Chat","Tap To Max","Weather","Purchase Context"];
const FEATURES_WITH_VOLUMETRIA = ["P-DOOH","Tap to Go","Tap To Scratch","Weather","Topics","Click to Calendar","Downloaded Apps"];
const MARKETPLACES = ["VTEX","Amazon"];

// ── Checklist Feature Config ─────────────────────────────────────────────────
// Features with volumetry fields
const FEAT_VOL = {
  "P-DOOH": { fields: ["Plays"], type: "plays" },
  "Tap to Go": { fields: ["Impressões Visíveis"], type: "imp" },
  "Tap To Scratch": { fields: ["Impressões Visíveis"], type: "imp" },
  "Tap To Slide": { fields: ["Impressões Visíveis"], type: "imp" },
  "Tap To Carousel": { fields: ["Impressões Visíveis"], type: "imp" },
  "Weather": { fields: ["Impressões Visíveis", "Views 100%"], type: "imp_views" },
  "Topics": { fields: ["Impressões Visíveis", "Views 100%"], type: "imp_views" },
  "Click to Calendar": { fields: ["Impressões Visíveis", "Views 100%"], type: "imp_views" },
  "Downloaded Apps": { fields: ["Impressões Visíveis", "Views 100%"], type: "imp_views" },
  "Purchase Context": { fields: ["Impressões Visíveis", "Views 100%"], type: "imp_views" },
  "CTV": { fields: ["Views 100%"], type: "views" },
  "TV Sync": { fields: ["Impressões Visíveis", "Views 100%"], type: "imp_views" },
};
const FEAT_VOL_NAMES = Object.keys(FEAT_VOL);

// Features without volumetry (just checkbox)
const FEAT_NO_VOL = ["HYPR Pass","Tap To Chat","Tap To Hotspot","Attention Ad","Footfall"];

// Features with text box
const FEAT_TEXT = ["Survey","Video Survey"];

// All checklist features
const ALL_CL_FEATURES = [...FEAT_VOL_NAMES, ...FEAT_NO_VOL, ...FEAT_TEXT];

// Inventory partners
const INVENTORY_PARTNERS = ["Globoplay","TwitchTV","DisneyPlus","Activision","Blizzard","SamsungTV","PlutoTV","Roku","Spotify"];
const INDUSTRIES = ["Alimentação & Bebidas","Automotivo","Beleza & Cuidados Pessoais","Construção & Decoração","Educação","Eletrônicos & Tecnologia","Farmácia & Saúde","Financeiro & Seguros","Games & Entretenimento","Higiene & Limpeza","Luxo & Premium","Moda & Vestuário","Pets","Serviços","Supermercado & Varejo","Telecomunicações","Turismo & Viagens","Outro"];
const CAMPAIGN_TYPES = ["Brand Awareness","Consideração","Performance","Retargeting","Trade Marketing","Lançamento de Produto","Sazonal","Always On"];
const BRAZIL_STATES = ["AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG","PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO"];
const MONTHS_PT = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];

// ─── CLIENT DATABASE (fetched from Cloud Function → Google Sheets) ──────────
// URL of the Cloud Function that reads the Sheet
const CLIENTS_API_URL = "https://southamerica-east1-site-hypr.cloudfunctions.net/hypr-command-clients";
const BACKEND_URL = "https://hypr-command-backend-453955675457.southamerica-east1.run.app";

// Fallback empty — will be populated by API
let CLIENT_DB_FALLBACK = [];

// Context for sharing client data across components
const ClientsCtx = createContext([]);
const useClients = () => useContext(ClientsCtx);


function generateShortToken() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 6; i++) result += chars.charAt(Math.floor(Math.random() * chars.length));
  return result;
}

function addBusinessDays(date, days) {
  let r = new Date(date), a = 0;
  while (a < days) { r.setDate(r.getDate() + 1); if (r.getDay() !== 0 && r.getDay() !== 6) a++; }
  return r;
}
function fmtDate(d) {
  if (!d) return "—";
  // Handle BigQuery date format (YYYY-MM-DD) or {value: "YYYY-MM-DD"} without timezone shift
  const s = typeof d === "object" && d.value ? d.value : String(d);
  const m = s.match(/(\d{4})-(\d{2})-(\d{2})/);
  if (m) return `${m[3]}/${m[2]}/${m[1]}`;
  return new Date(d).toLocaleDateString("pt-BR",{day:"2-digit",month:"2-digit",year:"numeric"});
}
function fmtCurrency(v) { if (!v && v !== 0) return "—"; return new Intl.NumberFormat("pt-BR",{style:"currency",currency:"BRL"}).format(v); }
function fmtCompact(v) { if (v >= 1e6) return (v/1e6).toFixed(1)+"M"; if (v >= 1e3) return (v/1e3).toFixed(0)+"K"; return v; }

// ─── MOCK DATA ───────────────────────────────────────────────────────────────
const MOCK_CAMPAIGNS = [
  { id:1, client:"Ambev", campaign:"Brahma Verão 2026", start:"2026-01-05", end:"2026-01-31", pacing_display:92, pacing_video:88, ctr:0.38, vtr:72.5, features:["Brand Query","Topics"], investment:250000 },
  { id:2, client:"Nestlé", campaign:"KitKat Q1", start:"2026-01-10", end:"2026-02-10", pacing_display:105, pacing_video:null, ctr:0.52, vtr:null, features:["Carbon Neutral"], investment:180000 },
  { id:3, client:"Samsung", campaign:"Galaxy S26 Launch", start:"2026-02-01", end:"2026-02-28", pacing_display:78, pacing_video:82, ctr:0.61, vtr:68.2, features:["Tap To Chat","Design Studio"], investment:420000 },
  { id:4, client:"Coca-Cola", campaign:"Carnaval 2026", start:"2026-02-15", end:"2026-03-05", pacing_display:110, pacing_video:95, ctr:0.44, vtr:80.1, features:["P-DOOH","Weather"], investment:350000 },
  { id:5, client:"Toyota", campaign:"RAV4 Awareness", start:"2026-03-01", end:"2026-03-31", pacing_display:66, pacing_video:70, ctr:0.29, vtr:61.3, features:["Click to Calendar","Seat"], investment:200000 },
  { id:6, client:"Unilever", campaign:"Dove Skin Q1", start:"2026-03-10", end:"2026-04-10", pacing_display:99, pacing_video:101, ctr:0.55, vtr:77.8, features:["Brand Query"], investment:290000 },
  { id:7, client:"Friboi", campaign:"Churrasco Season", start:"2026-04-01", end:"2026-04-30", pacing_display:88, pacing_video:84, ctr:0.41, vtr:69.4, features:["Topics","P-DOOH"], investment:175000 },
  { id:8, client:"L'Oréal", campaign:"Paris Collection", start:"2026-04-15", end:"2026-05-15", pacing_display:102, pacing_video:97, ctr:0.67, vtr:82.3, features:["Design Studio"], investment:310000 },
  { id:9, client:"Heineken", campaign:"UEFA Champions", start:"2026-04-01", end:"2026-05-01", pacing_display:93, pacing_video:91, ctr:0.48, vtr:75.6, features:["Brand Query","Weather"], investment:380000 },
  { id:10, client:"Electrolux", campaign:"Dia dos Namorados", start:"2026-04-20", end:"2026-06-12", pacing_display:71, pacing_video:68, ctr:0.33, vtr:58.9, features:["Click to Calendar"], investment:220000 },
];

const INITIAL_TASKS = [
  { id:1, type:"Audience Discovery", client:"Ambev", products:["O2O","RMN Digital"], features:["Brand Query"], budget:150000, briefing:"Campanha de verão para Brahma, precisamos de discovery de audiência focado em consumidores de cerveja premium 25-45 anos.", cs:"João Armelin", status:"open", createdAt:"2026-04-01", deadline:"2026-04-04", docLink:"https://docs.google.com/presentation/d/exemplo1", requestedBy:"Vendedor 1" },
  { id:2, type:"Estudo de Mercado", client:"Samsung", products:["RMN Digital"], features:["Tap To Chat"], budget:200000, briefing:"Lançamento do Galaxy S26, precisamos de estudo de mercado sobre categoria de smartphones premium no Brasil.", cs:"Beatriz Severine", status:"completed", createdAt:"2026-03-20", deadline:"2026-03-25", docLink:"https://docs.google.com/presentation/d/exemplo2", requestedBy:"Vendedor 2" },
  { id:3, type:"Dados RMNF", client:"Nestlé", products:["RMN Físico"], features:[], budget:80000, briefing:"Precisamos dos dados de RMNF para proposta de KitKat no segundo semestre.", cs:"Mariana Lewinski", status:"open", createdAt:"2026-04-13", deadline:"2026-04-16", docLink:null, requestedBy:"Vendedor 3" },
  { id:4, type:"Case de Sucesso", client:"Electrolux", products:["O2O"], features:["Click to Calendar"], budget:120000, briefing:"Case de campanha anterior de Dia dos Namorados para apresentar em reunião com prospect similar.", cs:"Isaac Agiman", status:"open", createdAt:"2026-04-08", deadline:"2026-04-17", docLink:null, requestedBy:"Vendedor 1" },
  { id:5, type:"Pós-Venda", client:"Coca-Cola", products:["O2O","OOH"], features:["P-DOOH"], budget:350000, briefing:"Relatório pós-campanha de Carnaval 2026, incluindo lift study e métricas de footfall attribution.", cs:"Thiago Nascimento", status:"open", createdAt:"2026-04-10", deadline:"2026-04-14", docLink:null, requestedBy:"Vendedor 2" },
];

// ─── NOTIFICATIONS MOCK ──────────────────────────────────────────────────────
const INITIAL_NOTIFS = [
  { id:1, type:"task", msg:"Task #4 de Electrolux vence hoje", time:"Agora", read:false },
  { id:2, type:"task", msg:"Task #5 de Coca-Cola está atrasada (3 dias)", time:"1h atrás", read:false },
  { id:3, type:"campaign", msg:"Pacing Display de Toyota RAV4 está em 66%", time:"2h atrás", read:false },
  { id:4, type:"task", msg:"Samsung — Estudo de Mercado concluído", time:"Ontem", read:true },
];

// ─── CONTEXTS ────────────────────────────────────────────────────────────────
const ThemeCtx = createContext();
const ToastCtx = createContext();
const useToast = () => useContext(ToastCtx);

// ─── ICONS ───────────────────────────────────────────────────────────────────
const I = ({n, s=16, c="currentColor", style:st, ...r}) => {
  const p = {
    "bar-chart":<><line x1="12" y1="20" x2="12" y2="10"/><line x1="18" y1="20" x2="18" y2="4"/><line x1="6" y1="20" x2="6" y2="16"/></>,
    "check-square":<><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/></>,
    "clipboard":<><path d="M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2"/><rect x="8" y="2" width="8" height="4" rx="1"/></>,
    "sun":<><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></>,
    "moon":<path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/>,
    "search":<><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></>,
    "plus":<><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></>,
    "x":<><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></>,
    "check":<polyline points="20 6 9 17 4 12"/>,
    "check-circle":<><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></>,
    "clock":<><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></>,
    "alert-circle":<><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></>,
    "alert-triangle":<><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></>,
    "chevron-down":<polyline points="6 9 12 15 18 9"/>,
    "send":<><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></>,
    "link":<><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/></>,
    "user":<><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></>,
    "calendar":<><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></>,
    "zap":<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>,
    "trending-up":<><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></>,
    "mouse-pointer":<><path d="M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z"/><path d="M13 13l6 6"/></>,
    "play":<polygon points="5 3 19 12 5 21 5 3"/>,
    "refresh":<><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"/></>,
    "file-text":<><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></>,
    "rotate":<><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 102.13-9.36L1 10"/></>,
    "panel-left":<><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="9" y1="3" x2="9" y2="21"/></>,
    "menu":<><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></>,
    "bell":<><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></>,
    "dollar":<><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></>,
    "eye":<><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></>,
    "home":<><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></>,
    "activity":<polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>,
    "target":<><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></>,
    "award":<><circle cx="12" cy="8" r="7"/><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"/></>,
    "inbox":<><polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/><path d="M5.45 5.11L2 12v6a2 2 0 002 2h16a2 2 0 002-2v-6l-3.45-6.89A2 2 0 0016.76 4H7.24a2 2 0 00-1.79 1.11z"/></>,
    "external":<><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></>,
  };
  return <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{flexShrink:0,...st}} {...r}>{p[n]}</svg>;
};

function getTaskStatus(t) {
  if (t.status === "completed") return "Concluída";
  return new Date() > new Date(t.deadline) ? "Atrasada" : "Dentro do SLA";
}

// ─── CSS ─────────────────────────────────────────────────────────────────────
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=DM+Sans:ital,opsz,wght@0,9..40,300..700;1,9..40,300&display=swap');
:root{--navy:#1C262F;--teal:#3397B9;--teal-l:#4ab3d6;--teal-dim:rgba(51,151,185,0.12);--yellow:#EDD900;--yellow-dim:rgba(237,217,0,0.10);--bg1:#F4F6F8;--bg2:#FFFFFF;--bg3:#EEF1F4;--bg-card:#FFFFFF;--bg-sidebar:#1C262F;--bg-input:#FFFFFF;--t1:#1C262F;--t2:#4A6070;--t3:#8DA0AE;--bdr:#DDE3E8;--bdr-focus:#3397B9;--bdr-card:#E8ECF0;--sh-sm:0 1px 3px rgba(28,38,47,0.06);--sh-md:0 4px 12px rgba(28,38,47,0.08);--sh-lg:0 8px 24px rgba(28,38,47,0.10);--green:#22C55E;--green-bg:rgba(34,197,94,0.10);--red:#EF4444;--red-bg:rgba(239,68,68,0.10);--yellow-s:#F59E0B;--yellow-s-bg:rgba(245,158,11,0.10);--r:10px;--ff:'DM Sans',sans-serif;--fd:'Syne',sans-serif;--tr:0.18s ease}
[data-theme="dark"]{--bg1:#111820;--bg2:#1C262F;--bg3:#141D25;--bg-card:#1C262F;--bg-sidebar:#0E151C;--bg-input:#253340;--t1:#E8EDF1;--t2:#94A9B8;--t3:#5A7080;--bdr:#2A3845;--bdr-card:#253340;--sh-sm:0 1px 3px rgba(0,0,0,0.25);--sh-md:0 4px 12px rgba(0,0,0,0.3);--sh-lg:0 8px 24px rgba(0,0,0,0.35)}
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
html{font-size:14px;-webkit-font-smoothing:antialiased}
body{font-family:var(--ff);background:var(--bg1);color:var(--t1)}
::-webkit-scrollbar{width:5px;height:5px}::-webkit-scrollbar-track{background:transparent}::-webkit-scrollbar-thumb{background:var(--bdr);border-radius:99px}

.app{display:flex;min-height:100vh;background:var(--bg1);transition:background var(--tr)}

/* SIDEBAR */
.sb{width:220px;min-width:220px;background:var(--bg-sidebar);display:flex;flex-direction:column;position:fixed;top:0;left:0;bottom:0;z-index:100;border-right:1px solid rgba(255,255,255,0.04);transition:width .22s cubic-bezier(.4,0,.2,1),min-width .22s cubic-bezier(.4,0,.2,1),transform .22s cubic-bezier(.4,0,.2,1)}
.sb.col{width:64px;min-width:64px}
@media(max-width:768px){.sb{transform:translateX(-100%);width:260px;min-width:260px}.sb.col{width:260px;min-width:260px}.sb.mob{transform:translateX(0);box-shadow:4px 0 24px rgba(0,0,0,0.4)}}
.sb-logo{padding:20px;border-bottom:1px solid rgba(255,255,255,0.06);display:flex;align-items:center;justify-content:center;min-height:64px}
.sb-lbl{font-family:var(--fd);font-size:9px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:var(--teal);padding:20px 20px 8px}
.sb-nav{flex:1;padding:8px 10px;display:flex;flex-direction:column;gap:2px}
.ni{display:flex;align-items:center;gap:10px;padding:10px 12px;border-radius:var(--r);color:rgba(255,255,255,0.65);font-size:13px;font-weight:500;cursor:pointer;border:none;background:none;width:100%;text-align:left;transition:all var(--tr);position:relative;text-decoration:none}
.ni:hover{background:rgba(255,255,255,0.06);color:#fff}
.ni.act{background:var(--teal-dim);color:var(--teal-l)}
.sb-bot{padding:16px 12px;border-top:1px solid rgba(255,255,255,0.06);display:flex;align-items:center;justify-content:space-between}

/* MAIN */
.mn{margin-left:220px;flex:1;display:flex;flex-direction:column;min-height:100vh;transition:margin-left .22s cubic-bezier(.4,0,.2,1)}
.mn.col{margin-left:64px}
@media(max-width:768px){.mn,.mn.col{margin-left:0}}
.tb{height:56px;background:var(--bg2);border-bottom:1px solid var(--bdr);display:flex;align-items:center;justify-content:space-between;padding:0 24px;position:sticky;top:0;z-index:50;transition:background var(--tr)}
.pg{flex:1;padding:24px}
@media(max-width:768px){.pg{padding:16px}}

/* COMPONENTS */
.card{background:var(--bg-card);border:1px solid var(--bdr-card);border-radius:14px;box-shadow:var(--sh-sm);transition:all var(--tr)}
.card:hover{box-shadow:var(--sh-md)}
.btn{display:inline-flex;align-items:center;gap:6px;padding:8px 16px;border-radius:var(--r);font-family:var(--ff);font-size:13px;font-weight:600;cursor:pointer;border:none;transition:all var(--tr);white-space:nowrap}
.bp{background:var(--teal);color:#fff}.bp:hover{background:var(--teal-l);transform:translateY(-1px);box-shadow:0 4px 16px rgba(51,151,185,0.25)}.bp:disabled{opacity:.5;cursor:not-allowed;transform:none;box-shadow:none}
.bs{background:var(--bg3);color:var(--t1);border:1px solid var(--bdr)}.bs:hover{background:var(--bg-input)}
.bg{background:transparent;color:var(--t2);padding:8px 10px}.bg:hover{background:var(--bg3);color:var(--t1)}
.fg{display:flex;flex-direction:column;gap:6px}
.fl{font-size:12px;font-weight:600;color:var(--t2);letter-spacing:0.02em;text-transform:uppercase}
.fi,.fs,.ft{background:var(--bg-input);border:1px solid var(--bdr);border-radius:var(--r);padding:9px 12px;font-family:var(--ff);font-size:13px;color:var(--t1);transition:all var(--tr);width:100%;outline:none}
.fi:focus,.fs:focus,.ft:focus{border-color:var(--bdr-focus);box-shadow:0 0 0 3px var(--teal-dim)}
.ft{resize:vertical;min-height:90px}
.fs{cursor:pointer;appearance:none;background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%238DA0AE' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E");background-repeat:no-repeat;background-position:right 12px center;padding-right:32px}
.chip{display:inline-flex;align-items:center;gap:6px;padding:5px 12px;border-radius:99px;border:1px solid var(--bdr);background:var(--bg-input);color:var(--t2);font-size:12px;font-weight:500;cursor:pointer;transition:all var(--tr);user-select:none}
.chip:hover{border-color:var(--teal);color:var(--teal)}.chip.sel{background:var(--teal-dim);border-color:var(--teal);color:var(--teal-l)}
.badge{display:inline-flex;align-items:center;gap:5px;padding:3px 9px;border-radius:99px;font-size:11px;font-weight:600}
.b-grn{background:var(--green-bg);color:var(--green)}.b-red{background:var(--red-bg);color:var(--red)}.b-ylw{background:var(--yellow-s-bg);color:var(--yellow-s)}.b-teal{background:var(--teal-dim);color:var(--teal-l)}
.pbar{height:6px;background:var(--bg3);border-radius:99px;overflow:hidden}
.pfill{height:100%;border-radius:99px;transition:width .6s ease}
.pfill.good{background:var(--green)}.pfill.warn{background:var(--yellow-s)}.pfill.danger{background:var(--red)}

/* MODAL */
.mo{position:fixed;inset:0;background:rgba(0,0,0,0.45);backdrop-filter:blur(4px);z-index:300;display:flex;align-items:center;justify-content:center;padding:20px;animation:fi .15s ease}
@keyframes fi{from{opacity:0}to{opacity:1}}
.ml{background:var(--bg-card);border-radius:20px;box-shadow:var(--sh-lg);width:100%;max-width:640px;max-height:90vh;overflow-y:auto;animation:su .2s ease}
.ml-lg{max-width:860px}
@keyframes su{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
.mh{padding:24px 28px 0;display:flex;align-items:flex-start;justify-content:space-between;gap:16px}
.mt{font-family:var(--fd);font-size:18px;font-weight:700;color:var(--t1)}
.mb{padding:20px 28px 28px;display:flex;flex-direction:column;gap:18px}

/* DROPDOWN */
.dd{position:absolute;top:calc(100% + 4px);left:0;right:0;background:var(--bg-card);border:1px solid var(--bdr);border-radius:var(--r);box-shadow:var(--sh-lg);z-index:200;max-height:240px;overflow-y:auto}
.di{padding:9px 14px;font-size:13px;cursor:pointer;color:var(--t1);transition:background var(--tr)}.di:hover{background:var(--bg3)}.di.sel{color:var(--teal);font-weight:600}

/* TABLE */
.dt{width:100%;border-collapse:collapse}
.dt th{padding:10px 14px;text-align:left;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:var(--t3);border-bottom:1px solid var(--bdr)}
.dt td{padding:12px 14px;font-size:13px;color:var(--t1);border-bottom:1px solid var(--bdr-card)}
.dt tr:last-child td{border-bottom:none}.dt tr:hover td{background:var(--bg3)}

/* ACCORDION */
.acc{border:1px solid var(--bdr-card);border-radius:14px;overflow:hidden;margin-bottom:10px;background:var(--bg-card)}
.acc-h{display:flex;align-items:center;justify-content:space-between;padding:14px 20px;cursor:pointer;user-select:none;transition:background var(--tr)}
.acc-h:hover{background:var(--bg3)}

/* TOAST */
.toast-c{position:fixed;bottom:24px;right:24px;z-index:999;display:flex;flex-direction:column;gap:8px}
.toast{background:var(--bg-card);border:1px solid var(--bdr-card);border-radius:var(--r);box-shadow:var(--sh-lg);padding:14px 18px;display:flex;align-items:center;gap:10px;animation:su .2s ease;font-size:13px;min-width:280px;border-left:3px solid var(--green)}

/* DISCLAIMER */
.disc{background:var(--yellow-dim);border:1px solid rgba(237,217,0,0.3);border-radius:var(--r);padding:10px 14px;font-size:12px;color:var(--t2);display:flex;align-items:flex-start;gap:8px}

/* GRID */
.g2{display:grid;grid-template-columns:1fr 1fr;gap:16px}
.g3{display:grid;grid-template-columns:repeat(3,1fr);gap:16px}
.g4{display:grid;grid-template-columns:repeat(4,1fr);gap:16px}
@media(max-width:1100px){.g4{grid-template-columns:repeat(2,1fr)}.g3{grid-template-columns:1fr 1fr}}
@media(max-width:600px){.g2,.g3,.g4{grid-template-columns:1fr}}

/* EMPTY */
.empty{display:flex;flex-direction:column;align-items:center;justify-content:center;padding:60px 20px;text-align:center;gap:12px;color:var(--t3)}

/* MOBILE OVERLAY */
.mob-ov{display:none;position:fixed;inset:0;background:rgba(0,0,0,0.4);z-index:99}
@media(max-width:768px){.mob-ov.vis{display:block}}

/* NOTIF PANEL */
.notif-panel{position:absolute;top:calc(100% + 8px);right:0;width:340px;background:var(--bg-card);border:1px solid var(--bdr);border-radius:14px;box-shadow:var(--sh-lg);z-index:200;animation:su .15s ease;overflow:hidden}
.notif-item{padding:12px 16px;border-bottom:1px solid var(--bdr-card);display:flex;gap:10px;align-items:flex-start;transition:background var(--tr);cursor:default}
.notif-item:hover{background:var(--bg3)}
.notif-item:last-child{border-bottom:none}

/* PAGE TRANSITION */
.page-enter{animation:pageIn .25s ease}
@keyframes pageIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}

/* MOBILE HAMBURGER */
.hamburger{display:none}
@media(max-width:768px){.hamburger{display:flex}}

/* Recharts custom */
.recharts-cartesian-grid-horizontal line,.recharts-cartesian-grid-vertical line{stroke:var(--bdr) !important}
`;

// ─── TOAST ───────────────────────────────────────────────────────────────────
function ToastProvider({children}) {
  const [toasts, setToasts] = useState([]);
  const add = useCallback((msg, type="success") => {
    const id = Date.now();
    setToasts(t => [...t, {id,msg,type}]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3500);
  }, []);
  return (
    <ToastCtx.Provider value={add}>
      {children}
      <div className="toast-c">
        {toasts.map(t => (
          <div key={t.id} className="toast" style={{borderLeftColor: t.type==="success" ? "var(--green)" : "var(--red)"}}>
            <I n={t.type==="success"?"check-circle":"alert-circle"} s={16} c={t.type==="success"?"var(--green)":"var(--red)"} />
            <span>{t.msg}</span>
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}

// ─── PACING BAR ──────────────────────────────────────────────────────────────
function PacingBar({value, label}) {
  if (value==null) return <span style={{color:"var(--t3)",fontSize:12}}>N/A</span>;
  const c = value>=90&&value<=110?"good":value>=75?"warn":"danger";
  const cv = c==="good"?"var(--green)":c==="warn"?"var(--yellow-s)":"var(--red)";
  return (
    <div style={{minWidth:110}}>
      <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
        <span style={{fontSize:11,color:"var(--t3)"}}>{label}</span>
        <span style={{fontSize:12,fontWeight:700,color:cv}}>{value}%</span>
      </div>
      <div className="pbar"><div className={`pfill ${c}`} style={{width:`${Math.min(value,120)/120*100}%`}} /></div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// DASHBOARD (HOME)
// ══════════════════════════════════════════════════════════════════════════════
function Dashboard({checklists, tasks, onNav}) {
  const user = useAuth();
  const now = new Date();

  // Active campaigns = checklists where today is between start_date and end_date
  const active = useMemo(() => {
    return checklists.filter(c => {
      const s = c.start_date?.value || c.start_date;
      const e = c.end_date?.value || c.end_date;
      if (!s || !e) return false;
      return now >= new Date(s) && now <= new Date(e);
    });
  }, [checklists]);

  const totalInvestment = checklists.reduce((s,c) => s + (parseFloat(c.investment)||0), 0);
  const openTasks = tasks.filter(t => getTaskStatus(t) !== "Concluída");
  const overdueTasks = tasks.filter(t => getTaskStatus(t) === "Atrasada");

  // Monthly investment chart data from checklists
  const monthlyData = useMemo(() => {
    const m = {};
    checklists.forEach(c => {
      const sd = c.start_date?.value || c.start_date;
      if (!sd) return;
      const mo = MONTHS_PT[new Date(sd).getMonth()].substring(0,3);
      m[mo] = (m[mo]||0) + (parseFloat(c.investment)||0);
    });
    return Object.entries(m).map(([name,value]) => ({name,value}));
  }, [checklists]);

  // Task by CS (all tasks, yearly sum)
  const taskByCS = useMemo(() => {
    const m = {};
    tasks.forEach(t => { if(t.cs) m[t.cs] = (m[t.cs]||0) + 1; });
    return Object.entries(m).map(([name,count]) => ({name:name.split(" ")[0],tasks:count})).sort((a,b)=>b.tasks-a.tasks);
  }, [tasks]);

  return (
    <div className="page-enter">
      {/* Welcome */}
      <div style={{marginBottom:24}}>
        <h1 style={{fontFamily:"var(--fd)",fontSize:22,fontWeight:800,color:"var(--t1)",marginBottom:4}}>{new Date().getHours()<12?"Bom dia":new Date().getHours()<18?"Boa tarde":"Boa noite"}, {user?.name?.split(" ")[0]||"!"}</h1>
        <p style={{color:"var(--t2)",fontSize:13}}>Aqui está o resumo do HYPR Command — {new Date().toLocaleDateString("pt-BR",{weekday:"long",day:"numeric",month:"long"})}</p>
      </div>

      {/* Stat cards */}
      <div className="g3" style={{marginBottom:24}}>
        {[
          {label:"Campanhas Ativas",value:active.length,icon:"zap",color:"var(--green)",sub:`de ${checklists.length} total`},
          {label:"Investimento Total",value:fmtCompact(totalInvestment),icon:"dollar",color:"var(--teal)",sub:fmtCurrency(totalInvestment)},
          {label:"Tasks Abertas",value:openTasks.length,icon:"inbox",color:"var(--yellow-s)",sub:overdueTasks.length>0?`${overdueTasks.length} atrasada${overdueTasks.length>1?"s":""}`:"Tudo no prazo"},
        ].map(s => (
          <div key={s.label} className="card" style={{padding:"18px 20px",position:"relative",overflow:"hidden"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
              <span style={{fontSize:11,fontWeight:700,textTransform:"uppercase",letterSpacing:".06em",color:"var(--t3)"}}>{s.label}</span>
              <div style={{width:32,height:32,borderRadius:10,background:`${s.color}15`,display:"flex",alignItems:"center",justifyContent:"center"}}>
                <I n={s.icon} s={16} c={s.color} />
              </div>
            </div>
            <div style={{fontSize:26,fontWeight:800,fontFamily:"var(--fd)",color:s.color,marginBottom:4}}>{s.value}</div>
            <div style={{fontSize:11,color:"var(--t3)"}}>{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Charts row */}
      <div className="g2" style={{marginBottom:24}}>
        {/* Investment by month */}
        <div className="card" style={{padding:"18px 20px"}}>
          <div style={{fontSize:13,fontWeight:700,color:"var(--t1)",marginBottom:16,fontFamily:"var(--fd)"}}>Investimento por Mês</div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={monthlyData} barSize={24}>
              <XAxis dataKey="name" tick={{fontSize:11,fill:"var(--t3)"}} axisLine={false} tickLine={false} />
              <Tooltip formatter={v => fmtCurrency(v)} contentStyle={{background:"var(--bg-card)",border:"1px solid var(--bdr)",borderRadius:8,fontSize:12}} />
              <Bar dataKey="value" fill="var(--teal)" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Tasks by CS */}
        <div className="card" style={{padding:"18px 20px"}}>
          <div style={{fontSize:13,fontWeight:700,color:"var(--t1)",marginBottom:16,fontFamily:"var(--fd)"}}>Tasks por CS (ano)</div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={taskByCS} layout="vertical" barSize={16}>
              <XAxis type="number" tick={{fontSize:11,fill:"var(--t3)"}} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="name" tick={{fontSize:11,fill:"var(--t2)"}} axisLine={false} tickLine={false} width={70} />
              <Tooltip contentStyle={{background:"var(--bg-card)",border:"1px solid var(--bdr)",borderRadius:8,fontSize:12}} />
              <Bar dataKey="tasks" fill="var(--teal-l)" radius={[0,4,4,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Quick access */}
      <div className="g2">
        {/* Tasks needing attention */}
        <div className="card" style={{padding:"18px 20px"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
            <span style={{fontSize:13,fontWeight:700,color:"var(--t1)",fontFamily:"var(--fd)"}}>Tasks que Precisam de Atenção</span>
            <button className="btn bs" style={{fontSize:11,padding:"4px 10px"}} onClick={() => onNav("tasks")}>Ver todas</button>
          </div>
          {[...overdueTasks, ...openTasks.filter(t => getTaskStatus(t) !== "Atrasada")].slice(0,4).map(t => {
            const st = getTaskStatus(t);
            return (
              <div key={t.id} style={{padding:"10px 0",borderBottom:"1px solid var(--bdr-card)",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <div>
                  <div style={{fontSize:13,fontWeight:600,color:"var(--t1)"}}>{t.client} — {t.type}</div>
                  <div style={{fontSize:11,color:"var(--t3)",display:"flex",gap:8,marginTop:2}}>
                    <span>{t.cs}</span>
                    <span>Prazo: {fmtDate(t.deadline)}</span>
                  </div>
                </div>
                <span className={`badge ${st==="Atrasada"?"b-red":"b-grn"}`}>{st}</span>
              </div>
            );
          })}
          {openTasks.length===0&&<div style={{padding:16,textAlign:"center",color:"var(--t3)",fontSize:13}}>Nenhuma task pendente</div>}
        </div>

        {/* Active campaigns from checklists */}
        <div className="card" style={{padding:"18px 20px"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
            <span style={{fontSize:13,fontWeight:700,color:"var(--t1)",fontFamily:"var(--fd)"}}>Campanhas Ativas</span>
            <button className="btn bs" style={{fontSize:11,padding:"4px 10px"}} onClick={() => onNav("checklist-center")}>Ver todas</button>
          </div>
          {active.length===0&&<div style={{padding:16,textAlign:"center",color:"var(--t3)",fontSize:13}}>Nenhuma campanha ativa no momento</div>}
          {active.slice(0,5).map(c => {
            const reportUrl = c.short_token ? `https://report.hypr.mobi/report/${c.short_token}?ak=hypr2026` : null;
            return (
              <div key={c.id} style={{padding:"10px 0",borderBottom:"1px solid var(--bdr-card)",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <div>
                  <div style={{fontSize:13,fontWeight:600,color:"var(--t1)"}}>{c.client}</div>
                  <div style={{fontSize:11,color:"var(--t3)"}}>{c.campaign_name}</div>
                </div>
                {reportUrl?(
                  <a href={reportUrl} target="_blank" rel="noreferrer" className="btn bs" style={{fontSize:11,padding:"4px 10px",textDecoration:"none",gap:4}}>
                    <I n="activity" s={12}/>Report
                  </a>
                ):(
                  <span style={{fontSize:11,color:"var(--t3)"}}>—</span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// CAMPAIGN MONITOR
// ══════════════════════════════════════════════════════════════════════════════
function CampaignMonitor({campaigns}) {
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("month");
  const [filterMonth, setFilterMonth] = useState("");
  const [detail, setDetail] = useState(null);
  const now = new Date();

  const filtered = useMemo(() => {
    let l = campaigns.filter(c => { const q = search.toLowerCase(); return !q || c.client.toLowerCase().includes(q) || c.campaign.toLowerCase().includes(q); });
    if (filterMonth) l = l.filter(c => MONTHS_PT[new Date(c.start).getMonth()] === filterMonth);
    if (sortBy==="az") l = [...l].sort((a,b) => a.client.localeCompare(b.client));
    if (sortBy==="start") l = [...l].sort((a,b) => new Date(a.start)-new Date(b.start));
    return l;
  }, [campaigns,search,sortBy,filterMonth]);

  const grouped = useMemo(() => {
    const m = {};
    filtered.forEach(c => { const d=new Date(c.start); const k=`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`; const lb=`${MONTHS_PT[d.getMonth()]} ${d.getFullYear()}`; if(!m[k]) m[k]={label:lb,campaigns:[]}; m[k].campaigns.push(c); });
    return Object.entries(m).sort(([a],[b])=>a.localeCompare(b)).map(([,v])=>v);
  }, [filtered]);

  const curLabel = `${MONTHS_PT[now.getMonth()]} ${now.getFullYear()}`;
  const stats = useMemo(() => {
    const act = campaigns.filter(c => now >= new Date(c.start) && now <= new Date(c.end));
    const avgPD = act.filter(c=>c.pacing_display!=null).reduce((s,c,_,a)=>s+c.pacing_display/a.length,0);
    const avgCTR = campaigns.filter(c=>c.ctr).reduce((s,c,_,a)=>s+c.ctr/a.length,0);
    return {total:campaigns.length,active:act.length,avgPD:Math.round(avgPD),avgCTR:avgCTR.toFixed(2)};
  },[campaigns]);

  return (
    <div className="page-enter">
      <div className="g4" style={{marginBottom:24}}>
        {[
          {l:"Total Campanhas",v:stats.total,i:"bar-chart",c:"var(--teal)"},
          {l:"Ativas Agora",v:stats.active,i:"zap",c:"var(--green)"},
          {l:"Pacing Médio",v:`${stats.avgPD}%`,i:"trending-up",c:"var(--yellow)"},
          {l:"CTR Médio",v:`${stats.avgCTR}%`,i:"mouse-pointer",c:"var(--teal-l)"},
        ].map(s=>(
          <div key={s.l} className="card" style={{padding:"18px 20px"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
              <span style={{fontSize:11,fontWeight:700,textTransform:"uppercase",letterSpacing:".06em",color:"var(--t3)"}}>{s.l}</span>
              <I n={s.i} s={16} c={s.c} />
            </div>
            <div style={{fontSize:26,fontWeight:800,fontFamily:"var(--fd)",color:s.c}}>{s.v}</div>
          </div>
        ))}
      </div>

      <div className="card" style={{padding:"12px 16px",marginBottom:16}}>
        <div style={{display:"flex",alignItems:"center",gap:12,flexWrap:"wrap"}}>
          <div style={{position:"relative",flex:1,minWidth:200,maxWidth:320}}>
            <I n="search" s={14} style={{position:"absolute",left:10,top:"50%",transform:"translateY(-50%)"}} c="var(--t3)" />
            <input className="fi" style={{paddingLeft:32}} placeholder="Buscar cliente ou campanha..." value={search} onChange={e=>setSearch(e.target.value)} />
          </div>
          <select className="fs" style={{width:160}} value={filterMonth} onChange={e=>setFilterMonth(e.target.value)}>
            <option value="">Todos os meses</option>
            {MONTHS_PT.map(m=><option key={m}>{m}</option>)}
          </select>
          <div style={{display:"flex",gap:6,marginLeft:"auto"}}>
            {[["month","Mês"],["az","A→Z"],["start","Data"]].map(([v,l])=>(
              <button key={v} className={`btn ${sortBy===v?"bp":"bs"}`} style={{fontSize:12,padding:"6px 12px"}} onClick={()=>setSortBy(v)}>{l}</button>
            ))}
          </div>
        </div>
      </div>

      {grouped.length===0?(
        <div className="card"><div className="empty"><I n="bar-chart" s={40} c="var(--t3)" /><h3 style={{fontFamily:"var(--fd)",fontSize:15,color:"var(--t2)"}}>Nenhuma campanha encontrada</h3></div></div>
      ):grouped.map(g=>(
        <div key={g.label} className="acc">
          <MonthAccHead month={g.label} campaigns={g.campaigns} defaultOpen={g.label===curLabel} onDetail={setDetail} />
        </div>
      ))}

      {detail && <CampaignDetail camp={detail} onClose={()=>setDetail(null)} />}
    </div>
  );
}

function MonthAccHead({month,campaigns,defaultOpen,onDetail}) {
  const [open,setOpen]=useState(defaultOpen||false);
  const now = new Date();
  const act = campaigns.filter(c=>now>=new Date(c.start)&&now<=new Date(c.end)).length;
  return (
    <>
      <div className="acc-h" onClick={()=>setOpen(o=>!o)}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <I n="chevron-down" s={16} c="var(--t3)" style={{transform:open?"rotate(180deg)":"rotate(0)",transition:"transform .2s"}} />
          <span style={{fontFamily:"var(--fd)",fontWeight:700,fontSize:14,color:"var(--t1)"}}>{month}</span>
          <span style={{fontSize:12,color:"var(--t3)"}}>{campaigns.length} campanha{campaigns.length!==1?"s":""}</span>
          {act>0 && <span className="badge b-grn">{act} ativa{act!==1?"s":""}</span>}
        </div>
      </div>
      {open && (
        <div style={{borderTop:"1px solid var(--bdr)",overflowX:"auto"}}>
          <table className="dt">
            <thead><tr><th>Cliente / Campanha</th><th>Período</th><th>Pacing</th><th>Métricas</th><th>Features</th></tr></thead>
            <tbody>
              {campaigns.map(c=>{
                const isA = now>=new Date(c.start)&&now<=new Date(c.end), isU = now<new Date(c.start);
                return (
                  <tr key={c.id} style={{cursor:"pointer"}} onClick={()=>onDetail(c)}>
                    <td><div style={{fontWeight:600,marginBottom:2}}>{c.client}</div><div style={{fontSize:12,color:"var(--t3)"}}>{c.campaign}</div></td>
                    <td>
                      <div style={{fontSize:12}}><span style={{color:"var(--t2)"}}>{fmtDate(c.start)}</span><span style={{color:"var(--t3)",margin:"0 4px"}}>→</span><span style={{color:"var(--t2)"}}>{fmtDate(c.end)}</span></div>
                      <div style={{marginTop:4}}>
                        {isA&&<span className="badge b-grn">● Ativa</span>}
                        {isU&&<span className="badge b-teal">Aguardando</span>}
                        {!isA&&!isU&&<span className="badge" style={{background:"var(--bg3)",color:"var(--t3)"}}>Encerrada</span>}
                      </div>
                    </td>
                    <td><div style={{display:"flex",flexDirection:"column",gap:8}}><PacingBar value={c.pacing_display} label="Display" /><PacingBar value={c.pacing_video} label="Vídeo" /></div></td>
                    <td>
                      <div style={{display:"flex",flexDirection:"column",gap:4}}>
                        <Pill icon="mouse-pointer" label="CTR" value={c.ctr} unit="%" />
                        {c.vtr!=null&&<Pill icon="play" label="VTR" value={c.vtr} unit="%" />}
                      </div>
                    </td>
                    <td><div style={{display:"flex",flexWrap:"wrap",gap:4}}>{c.features.map(f=><span key={f} style={{display:"inline-block",padding:"2px 8px",background:"var(--teal-dim)",color:"var(--teal-l)",borderRadius:99,fontSize:11,fontWeight:600}}>{f}</span>)}</div></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}

function Pill({icon,label,value,unit}) {
  if(value==null)return null;
  return (
    <div style={{display:"flex",alignItems:"center",gap:6,padding:"3px 10px",borderRadius:99,background:"var(--bg3)",border:"1px solid var(--bdr)"}}>
      <I n={icon} s={11} c="var(--teal)" /><span style={{fontSize:11,color:"var(--t3)"}}>{label}</span><span style={{fontSize:12,fontWeight:700,color:"var(--t1)"}}>{value}{unit}</span>
    </div>
  );
}

function CampaignDetail({camp,onClose}) {
  useEffect(()=>{ const h=e=>{if(e.key==="Escape")onClose()}; window.addEventListener("keydown",h); return ()=>window.removeEventListener("keydown",h); },[onClose]);
  const now=new Date(), isA=now>=new Date(camp.start)&&now<=new Date(camp.end);
  const elapsed = Math.max(0,Math.min(1,(now-new Date(camp.start))/(new Date(camp.end)-new Date(camp.start))));
  return (
    <div className="mo" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="ml ml-lg">
        <div className="mh">
          <div>
            <div className="mt">{camp.client} — {camp.campaign}</div>
            <div style={{fontSize:12,color:"var(--t3)",marginTop:4,display:"flex",gap:8,alignItems:"center"}}>
              {fmtDate(camp.start)} → {fmtDate(camp.end)}
              {isA&&<span className="badge b-grn">● Ativa</span>}
            </div>
          </div>
          <button className="btn bg" onClick={onClose}><I n="x" s={18} /></button>
        </div>
        <div className="mb">
          {/* Timeline progress */}
          <div>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}>
              <span style={{fontSize:12,color:"var(--t3)"}}>Progresso da Campanha</span>
              <span style={{fontSize:12,fontWeight:700,color:"var(--teal)"}}>{Math.round(elapsed*100)}%</span>
            </div>
            <div className="pbar" style={{height:8}}>
              <div style={{height:"100%",borderRadius:99,background:"linear-gradient(90deg, var(--teal), var(--teal-l))",width:`${elapsed*100}%`,transition:"width .6s"}} />
            </div>
          </div>

          <div className="g2">
            <div className="card" style={{padding:16}}><div style={{fontSize:11,color:"var(--t3)",textTransform:"uppercase",fontWeight:700,marginBottom:6}}>Investimento</div><div style={{fontSize:20,fontWeight:800,fontFamily:"var(--fd)",color:"var(--teal)"}}>{fmtCurrency(camp.investment)}</div></div>
            <div className="card" style={{padding:16}}>
              <div style={{fontSize:11,color:"var(--t3)",textTransform:"uppercase",fontWeight:700,marginBottom:6}}>Pacing</div>
              <div style={{display:"flex",gap:16}}>
                <PacingBar value={camp.pacing_display} label="Display" />
                <PacingBar value={camp.pacing_video} label="Vídeo" />
              </div>
            </div>
          </div>
          <div className="g2">
            <div className="card" style={{padding:16}}>
              <div style={{fontSize:11,color:"var(--t3)",textTransform:"uppercase",fontWeight:700,marginBottom:8}}>Métricas</div>
              <div style={{display:"flex",gap:12}}>
                <Pill icon="mouse-pointer" label="CTR" value={camp.ctr} unit="%" />
                {camp.vtr!=null&&<Pill icon="play" label="VTR" value={camp.vtr} unit="%" />}
              </div>
            </div>
            <div className="card" style={{padding:16}}>
              <div style={{fontSize:11,color:"var(--t3)",textTransform:"uppercase",fontWeight:700,marginBottom:8}}>Features</div>
              <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
                {camp.features.map(f=><span key={f} style={{padding:"4px 10px",background:"var(--teal-dim)",color:"var(--teal-l)",borderRadius:99,fontSize:12,fontWeight:600}}>{f}</span>)}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// TASK CENTER
// ══════════════════════════════════════════════════════════════════════════════
function TaskCenter({tasks,setTasks}) {
  const [showNew,setShowNew]=useState(false);
  const [linkModal,setLinkModal]=useState(null);
  const [search,setSearch]=useState("");
  const [filterStatus,setFilterStatus]=useState("all");
  const [filterCS,setFilterCS]=useState("");
  const toast = useToast();
  const gfIdx = useRef(0);

  const filtered = useMemo(()=>{
    return tasks.filter(t=>{
      const q=search.toLowerCase();
      const mQ=!q||t.client.toLowerCase().includes(q)||t.type.toLowerCase().includes(q)||t.cs.toLowerCase().includes(q);
      const mCS=!filterCS||t.cs===filterCS;
      const st=getTaskStatus(t);
      const mSt=filterStatus==="all"||(filterStatus==="open"&&st==="Dentro do SLA")||(filterStatus==="overdue"&&st==="Atrasada")||(filterStatus==="done"&&st==="Concluída");
      return mQ&&mCS&&mSt;
    });
  },[tasks,search,filterStatus,filterCS]);

  const counts=useMemo(()=>({
    all:tasks.length,
    open:tasks.filter(t=>getTaskStatus(t)==="Dentro do SLA").length,
    overdue:tasks.filter(t=>getTaskStatus(t)==="Atrasada").length,
    done:tasks.filter(t=>getTaskStatus(t)==="Concluída").length,
  }),[tasks]);

  const handleSubmit=async(data)=>{
    const newTask={...data,id:Date.now(),requestedBy:data.requestedBy||"Você"};
    setTasks(t=>[newTask,...t]);
    setShowNew(false);
    toast("Task criada com sucesso!");
    // POST to backend (saves to BQ + sends emails)
    try{
      await fetch(`${BACKEND_URL}/tasks`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(data)});
    }catch(err){console.error("Backend task POST error:",err)}
  };
  const handleComplete=async(id)=>{
    const task=tasks.find(t=>t.id===id);
    setTasks(ts=>ts.map(t=>t.id===id?{...t,status:"completed"}:t));
    toast("Task concluída!");
    try{
      await fetch(`${BACKEND_URL}/tasks/${id}`,{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify({status:"completed",task})});
    }catch(err){console.error("Backend task PUT error:",err)}
  };
  const handleSaveLink=async(link)=>{
    const id=linkModal.id;
    setTasks(ts=>ts.map(t=>t.id===id?{...t,docLink:link}:t));
    setLinkModal(null);
    toast("Link salvo!");
    try{
      await fetch(`${BACKEND_URL}/tasks/${id}`,{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify({doc_link:link})});
    }catch(err){console.error("Backend link PUT error:",err)}
  };

  const tabs=[{key:"all",label:"Todas",count:counts.all},{key:"open",label:"No SLA",count:counts.open},{key:"overdue",label:"Atrasadas",count:counts.overdue},{key:"done",label:"Concluídas",count:counts.done}];

  return (
    <div className="page-enter">
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:24,flexWrap:"wrap",gap:12}}>
        <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
          {tabs.map(t=>(
            <button key={t.key} className={`btn ${filterStatus===t.key?"bp":"bs"}`} style={{fontSize:12,padding:"6px 14px",gap:6}} onClick={()=>setFilterStatus(t.key)}>
              {t.label}<span style={{background:filterStatus===t.key?"rgba(255,255,255,0.25)":"var(--bg3)",borderRadius:99,padding:"1px 7px",fontSize:11,fontWeight:700}}>{t.count}</span>
            </button>
          ))}
        </div>
        <button className="btn bp" onClick={()=>setShowNew(true)}><I n="plus" s={14} /> Nova Task</button>
      </div>

      <div className="card" style={{padding:"12px 16px",marginBottom:20}}>
        <div style={{display:"flex",alignItems:"center",gap:12,flexWrap:"wrap"}}>
          <div style={{position:"relative",flex:1,minWidth:200,maxWidth:300}}>
            <I n="search" s={13} style={{position:"absolute",left:10,top:"50%",transform:"translateY(-50%)"}} c="var(--t3)" />
            <input className="fi" style={{paddingLeft:32}} placeholder="Buscar..." value={search} onChange={e=>setSearch(e.target.value)} />
          </div>
          <select className="fs" style={{width:200}} value={filterCS} onChange={e=>setFilterCS(e.target.value)}>
            <option value="">Todos os CS</option>
            {CS_LIST.filter(c=>c!=="Greenfield").map(cs=><option key={cs}>{cs}</option>)}
          </select>
        </div>
      </div>

      {filtered.length===0?(
        <div className="card"><div className="empty"><I n="check-circle" s={40} c="var(--t3)" /><h3 style={{fontFamily:"var(--fd)",fontSize:15,color:"var(--t2)"}}>Nenhuma task encontrada</h3></div></div>
      ):(
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(360px,1fr))",gap:16}}>
          {filtered.map(t=><TaskCard key={t.id} task={t} onComplete={handleComplete} onAddLink={setLinkModal} />)}
        </div>
      )}

      {showNew && <NewTaskModal onClose={()=>setShowNew(false)} onSubmit={handleSubmit} gfIdx={gfIdx} />}
      {linkModal && <DocLinkModal task={linkModal} onClose={()=>setLinkModal(null)} onSave={handleSaveLink} />}
    </div>
  );
}

function TaskCard({task,onComplete,onAddLink}) {
  const st=getTaskStatus(task);
  const stCls=st==="Concluída"?"b-teal":st==="Atrasada"?"b-red":"b-grn";
  return (
    <div className="card" style={{padding:"18px 20px",display:"flex",flexDirection:"column",gap:12}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <div style={{display:"flex",alignItems:"center",gap:6}}>
          <span style={{padding:"3px 10px",borderRadius:99,background:"var(--bg3)",border:"1px solid var(--bdr)",fontSize:11,fontWeight:700,color:"var(--t2)",fontFamily:"var(--fd)"}}>{task.type}</span>
          <span className={`badge ${stCls}`}><I n={st==="Atrasada"?"alert-circle":"check-circle"} s={10} /> {st}</span>
        </div>
        <span style={{fontSize:11,color:"var(--t3)"}}>#{task.id}</span>
      </div>
      <div>
        <div style={{fontSize:15,fontWeight:700,fontFamily:"var(--fd)",marginBottom:2}}>{task.client}</div>
        <div style={{fontSize:12,color:"var(--t2)",lineHeight:1.5,display:"-webkit-box",WebkitLineClamp:3,WebkitBoxOrient:"vertical",overflow:"hidden"}}>{task.briefing}</div>
      </div>
      {task.budget>0 && <div style={{fontSize:12,color:"var(--teal)",fontWeight:600}}><I n="dollar" s={12} c="var(--teal)" style={{verticalAlign:"middle",marginRight:4}} />{fmtCurrency(task.budget)}</div>}
      {(task.products?.length>0||task.features?.length>0)&&(
        <div style={{display:"flex",flexWrap:"wrap",gap:4}}>
          {task.products?.map(p=><span key={p} className="chip sel" style={{fontSize:11,padding:"2px 8px"}}>{p}</span>)}
          {task.features?.map(f=><span key={f} style={{display:"inline-block",padding:"2px 8px",background:"var(--bg3)",border:"1px solid var(--bdr)",borderRadius:99,fontSize:11,color:"var(--t3)"}}>{f}</span>)}
        </div>
      )}
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",paddingTop:10,borderTop:"1px solid var(--bdr)"}}>
        <div style={{display:"flex",alignItems:"center",gap:12}}>
          <div style={{display:"flex",alignItems:"center",gap:4}}><I n="user" s={12} c="var(--t3)" /><span style={{fontSize:12,color:"var(--t2)",fontWeight:600}}>{task.cs}</span></div>
          <div style={{display:"flex",alignItems:"center",gap:4}}><I n="calendar" s={12} c="var(--t3)" /><span style={{fontSize:12,color:st==="Atrasada"?"var(--red)":"var(--t2)"}}>{fmtDate(task.deadline)}</span></div>
        </div>
        <div style={{display:"flex",gap:6}}>
          {task.docLink&&<a href={task.docLink} target="_blank" rel="noreferrer" className="btn bs" style={{fontSize:11,padding:"5px 10px",textDecoration:"none"}}><I n="external" s={12} />Doc</a>}
          <button className="btn bg" style={{fontSize:11,padding:"5px 10px"}} onClick={()=>onAddLink(task)} title={task.docLink?"Editar link":"Adicionar link"}><I n="link" s={12} />{task.docLink?"Editar":"Link"}</button>
          {task.status!=="completed"&&<button className="btn bp" style={{fontSize:11,padding:"5px 12px"}} onClick={()=>onComplete(task.id)}><I n="check" s={12} />Concluir</button>}
        </div>
      </div>
    </div>
  );
}

function NewTaskModal({onClose,onSubmit,gfIdx}) {
  const user = useAuth();
  const CLIENT_DB = useClients();
  const [f,sF]=useState({type:"",client:"",products:[],features:[],budget:"",briefing:"",cs:"",csEmail:"",customDeadline:null,slaDate:null,autoCS:false});
  const set=(k,v)=>sF(p=>({...p,[k]:v}));
  const tog=(k,v)=>sF(p=>({...p,[k]:p[k].includes(v)?p[k].filter(x=>x!==v):[...p[k],v]}));
  useEffect(()=>{if(f.type&&SLA_DAYS[f.type]){const d=addBusinessDays(new Date(),SLA_DAYS[f.type]);set("slaDate",d.toISOString().split("T")[0]);set("customDeadline",null);}},[f.type]);
  useEffect(()=>{const h=e=>{if(e.key==="Escape")onClose()};window.addEventListener("keydown",h);return()=>window.removeEventListener("keydown",h);},[onClose]);

  const handleClientSelect=(entry)=>{
    if(!entry){sF(p=>({...p,cs:"",csEmail:"",autoCS:false}));return;}
    if(entry.cs&&entry.csEmail){sF(p=>({...p,cs:entry.cs,csEmail:entry.csEmail,autoCS:true}));}
    else{sF(p=>({...p,cs:"",csEmail:"",autoCS:false}));}
  };
  const handleCS=cs=>{if(cs==="Greenfield"){const next=GREENFIELD_QUEUE[gfIdx.current%GREENFIELD_QUEUE.length];gfIdx.current++;sF(p=>({...p,cs:next,autoCS:false}));}else sF(p=>({...p,cs:cs,autoCS:false}));};
  const sla=f.customDeadline||f.slaDate;
  const valid=f.type&&f.client&&f.cs&&f.briefing;

  return (
    <div className="mo" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="ml ml-lg">
        <div className="mh"><div><div className="mt">Nova Solicitação de Task</div><div style={{fontSize:12,color:"var(--t3)",marginTop:4}}>Preencha as informações para abrir a task</div></div><button className="btn bg" onClick={onClose}><I n="x" s={18}/></button></div>
        <div className="mb">
          <div className="g2">
            <div className="fg"><label className="fl">Tipo de Task *</label><select className="fs" value={f.type} onChange={e=>set("type",e.target.value)}><option value="">Selecione...</option>{TASK_TYPES.map(t=><option key={t}>{t}</option>)}</select></div>
            {f.type&&<div className="fg"><label className="fl">SLA Padrão</label><div style={{padding:"9px 12px",borderRadius:"var(--r)",background:"var(--teal-dim)",border:"1px solid var(--teal)",fontSize:13,color:"var(--teal-l)",fontWeight:600,display:"flex",alignItems:"center",gap:8}}><I n="calendar" s={14}/>{SLA_DAYS[f.type]} dias úteis → {fmtDate(f.slaDate)}</div></div>}
          </div>
          <div className="fg"><label className="fl">Cliente *</label><ClientSearch value={f.client} onChange={v=>set("client",v)} onSelect={handleClientSelect} /></div>

          {/* Auto-filled CS info card */}
          {f.autoCS&&f.cs&&(
            <div style={{padding:"12px 16px",borderRadius:"var(--r)",background:"var(--green-bg)",border:"1px solid var(--green)",display:"flex",alignItems:"center",gap:10}}>
              <I n="check-circle" s={16} c="var(--green)"/>
              <div style={{flex:1}}>
                <div style={{fontSize:12,fontWeight:700,color:"var(--green)"}}>CS identificado automaticamente</div>
                <div style={{fontSize:13,color:"var(--t1)",fontWeight:600,marginTop:2}}>{f.cs} <span style={{fontWeight:400,color:"var(--t3)"}}>({f.csEmail})</span></div>
              </div>
              <button className="btn bg" style={{fontSize:11,padding:"4px 8px"}} onClick={()=>sF(p=>({...p,autoCS:false,cs:"",csEmail:""}))}>Alterar</button>
            </div>
          )}

          {/* Manual CS selection — shown when no auto-fill or user clicked "Alterar" */}
          {!f.autoCS&&(
            <div className="fg">
              <label className="fl">CS Responsável *</label>
              {f.client&&!f.autoCS&&CLIENT_DB.find(c=>c.client===f.client)&&!CLIENT_DB.find(c=>c.client===f.client)?.cs&&(
                <div className="disc" style={{marginBottom:8}}><I n="alert-triangle" s={14} c="var(--yellow-s)"/><span>Cliente ainda sem CS encarteirado. Selecione manualmente.</span></div>
              )}
              <select className="fs" value={f.cs} onChange={e=>handleCS(e.target.value)}><option value="">Selecione...</option>{CS_LIST.map(cs=><option key={cs}>{cs}</option>)}</select>
              {f.cs&&<div style={{fontSize:11,color:"var(--teal)",marginTop:4,display:"flex",alignItems:"center",gap:4}}><I n="user" s={10}/>Atribuído: <strong>{f.cs}</strong></div>}
            </div>
          )}

          <div className="fg"><label className="fl">Produto Core</label><div style={{display:"flex",flexWrap:"wrap",gap:8}}>{CORE_PRODUCTS.map(p=><span key={p} className={`chip${f.products.includes(p)?" sel":""}`} onClick={()=>tog("products",p)}>{p}</span>)}</div></div>
          <div className="fg"><label className="fl">Features</label><div style={{display:"flex",flexWrap:"wrap",gap:6}}>{FEATURES.map(x=><span key={x} className={`chip${f.features.includes(x)?" sel":""}`} style={{fontSize:11}} onClick={()=>tog("features",x)}>{x}</span>)}</div></div>
          <div className="fg"><label className="fl">Investimento previsto</label><input className="fi" type="number" placeholder="R$ 150.000" value={f.budget} onChange={e=>set("budget",e.target.value)}/></div>
          <div className="fg"><label className="fl">Briefing *</label><textarea className="ft" rows={4} placeholder="Descreva objetivos, contexto e necessidades..." value={f.briefing} onChange={e=>set("briefing",e.target.value)}/></div>
          {/* Logged-in user info */}
          <div style={{padding:"10px 14px",borderRadius:"var(--r)",background:"var(--bg3)",border:"1px solid var(--bdr)",display:"flex",alignItems:"center",gap:10}}>
            <I n="user" s={14} c="var(--teal)"/>
            <div style={{flex:1}}>
              <div style={{fontSize:11,color:"var(--t3)"}}>Solicitante (logado)</div>
              <div style={{fontSize:13,fontWeight:600,color:"var(--t1)"}}>{user?.name} <span style={{fontWeight:400,color:"var(--t3)"}}>({user?.email})</span></div>
            </div>
          </div>
          {f.slaDate&&(<div><div style={{height:1,background:"var(--bdr)",margin:"8px 0 16px"}}/><div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}><div><div style={{fontSize:13,fontWeight:600}}>Data prevista</div><div style={{fontSize:12,color:"var(--t3)"}}>SLA: {SLA_DAYS[f.type]} dias úteis</div></div><div style={{padding:"8px 16px",borderRadius:"var(--r)",background:"var(--teal-dim)",border:"1px solid var(--teal)",fontSize:14,fontWeight:700,color:"var(--teal-l)",fontFamily:"var(--fd)"}}>{fmtDate(sla)}</div></div><div style={{fontSize:12,color:"var(--t3)",marginBottom:8}}>SLA personalizado?</div><input type="date" className="fi" style={{width:200}} value={f.customDeadline||f.slaDate} min={new Date().toISOString().split("T")[0]} onChange={e=>set("customDeadline",e.target.value)}/>{f.customDeadline&&f.customDeadline!==f.slaDate&&<div className="disc" style={{marginTop:10}}><I n="alert-triangle" s={14} c="var(--yellow)"/><span>Data fora do SLA padrão. Alinhe com o CS.</span></div>}</div>)}
          <div style={{display:"flex",gap:10,justifyContent:"flex-end",marginTop:8}}>
            <button className="btn bs" onClick={onClose}>Cancelar</button>
            <button className="btn bp" disabled={!valid} onClick={()=>onSubmit({...f,requesterEmail:user?.email,requestedBy:user?.name,deadline:sla,status:"open",createdAt:new Date().toISOString().split("T")[0]})}><I n="send" s={14}/>Abrir Task</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ClientSearch({value,onChange,onSelect}) {
  const CLIENT_DB = useClients();
  const [q,sQ]=useState(value||""); const [open,sO]=useState(false); const [isNew,sN]=useState(false); const ref=useRef();
  const fil=CLIENT_DB.filter(c=>c.client.toLowerCase().includes(q.toLowerCase())).slice(0,10);
  useEffect(()=>{const fn=e=>{if(ref.current&&!ref.current.contains(e.target))sO(false)};document.addEventListener("mousedown",fn);return()=>document.removeEventListener("mousedown",fn);},[]);
  const handleSelect=(entry)=>{sQ(entry.client);onChange(entry.client);if(onSelect)onSelect(entry);sO(false)};
  if(isNew) return(<div><button className="btn bg" style={{fontSize:12,padding:"4px 8px",marginBottom:8}} onClick={()=>{sN(false);sQ("");onChange("");if(onSelect)onSelect(null)}}>← Buscar existente</button><input className="fi" placeholder="Nome do novo cliente" value={q} onChange={e=>{sQ(e.target.value);onChange(e.target.value)}}/></div>);
  return(
    <div style={{position:"relative"}} ref={ref}>
      <I n="search" s={13} style={{position:"absolute",left:10,top:"50%",transform:"translateY(-50%)",zIndex:1}} c="var(--t3)"/>
      <input className="fi" style={{paddingLeft:32}} placeholder="Buscar cliente..." value={q} onFocus={()=>sO(true)} onChange={e=>{sQ(e.target.value);sO(true);onChange("")}}/>
      {open&&<div className="dd">{fil.length>0?fil.map(c=>(
        <div key={c.client+c.agency} className={`di${value===c.client?" sel":""}`} onClick={()=>handleSelect(c)}>
          <div style={{fontWeight:600,fontSize:13}}>{c.client}</div>
          <div style={{fontSize:11,color:"var(--t3)",display:"flex",gap:8}}>
            <span>{c.agency}</span>
            {c.cs?<span>CS: {c.cs}</span>:<span style={{color:"var(--yellow-s)"}}>Sem CS</span>}
          </div>
        </div>
      )):<div className="di" style={{color:"var(--t3)",fontStyle:"italic"}}>Nenhum cliente encontrado</div>}<div className="di" style={{color:"var(--teal)",borderTop:"1px solid var(--bdr)",marginTop:4,paddingTop:10}} onClick={()=>{sN(true);sO(false)}}><I n="plus" s={12} style={{display:"inline",marginRight:4,verticalAlign:"middle"}}/>Novo cliente</div></div>}
    </div>
  );
}

function DocLinkModal({task,onClose,onSave}) {
  const [link,sL]=useState(task.docLink||"");
  useEffect(()=>{const h=e=>{if(e.key==="Escape")onClose()};window.addEventListener("keydown",h);return()=>window.removeEventListener("keydown",h);},[onClose]);
  return(
    <div className="mo" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="ml" style={{maxWidth:480}}>
        <div className="mh"><div className="mt">{task.docLink?"Editar":"Adicionar"} Link do Documento</div><button className="btn bg" onClick={onClose}><I n="x" s={18}/></button></div>
        <div className="mb">
          <div className="fg"><label className="fl">Link do Google Presentation / Drive</label><input className="fi" placeholder="https://docs.google.com/..." value={link} onChange={e=>sL(e.target.value)}/></div>
          <div className="disc"><I n="file-text" s={14} c="var(--yellow)"/>O link ficará disponível para o vendedor na lista de tasks.</div>
          <div style={{display:"flex",gap:10,justifyContent:"flex-end"}}><button className="btn bs" onClick={onClose}>Cancelar</button><button className="btn bp" onClick={()=>onSave(link)}><I n="link" s={14}/>Salvar</button></div>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// CAMPAIGN CHECKLIST
// ══════════════════════════════════════════════════════════════════════════════
function CampaignChecklist({onChecklistSubmit,initialData}) {
  const user = useAuth();
  const CLIENT_DB = useClients();
  const INIT={cp_name:"",cp_email:"",agency:"",industry:"",start_date:"",end_date:"",client:"",campaign_type:"",campaign_name:"",investment:"",deal_dv360:"",formats:[],cpm:"",cpcv:"",products:[],o2o_impressoes:"",o2o_views:"",has_bonus:"",bonus_o2o_impressoes:"",bonus_o2o_views:"",ooh_link:"",audiences:"",praças_type:"",praças_state:"",praças_city:"",praças_other:"",had_cs_meeting:"",marketplaces:[],features:[],feature_volumes:{},pecas_link:"",pi_link:"",proposta_link:"",extra_urls:[""],cs_name:"",cs_email:""};
  const [f,sF]=useState(()=>{
    if(!initialData) return INIT;
    const d={...INIT,...initialData,start_date:"",end_date:"",id:undefined,created_at:undefined,submitted_by:undefined,submitted_by_email:undefined};
    if(!d.extra_urls||d.extra_urls.length===0) d.extra_urls=[""];
    return d;
  });
  const [submitted,sSub]=useState(false);
  const toast=useToast();
  const set=(k,v)=>sF(p=>({...p,[k]:v}));
  const tog=(k,v)=>sF(p=>({...p,[k]:p[k].includes(v)?p[k].filter(x=>x!==v):[...p[k],v]}));

  // Checklist progress
  const progress = useMemo(() => {
    const required = ["cp_name","industry","campaign_type","client","campaign_name","start_date","end_date","investment"];
    const filled = required.filter(k => f[k] && f[k] !== "").length;
    const extra = (f.formats.length > 0 ? 1 : 0) + (f.products.length > 0 ? 1 : 0) + (f.deal_dv360 ? 1 : 0) + (f.has_bonus ? 1 : 0) + (f.praças_type ? 1 : 0) + (f.had_cs_meeting ? 1 : 0);
    return Math.round((filled + extra) / 14 * 100);
  }, [f]);

  const showO2O=f.products.includes("O2O"),showOOH=f.products.includes("OOH"),showRMND=f.products.includes("RMND");
  const hasBonus=f.has_bonus==="Sim",hasVideo=f.formats.includes("Video"),hasDisplay=f.formats.includes("Display");
  const handleReset=()=>{sF(INIT);sSub(false)};
  const handleSubmit=async()=>{
    const short_token = generateShortToken();
    const payload={...f,submittedBy:user?.name,submittedByEmail:user?.email,cp_name:user?.name,cp_email:user?.email,short_token};
    if(onChecklistSubmit)onChecklistSubmit(payload);
    sSub(true);
    toast("Checklist enviado com sucesso!");
    try{
      await fetch(`${BACKEND_URL}/checklists`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload)});
    }catch(err){console.error("Backend checklist POST error:",err)}
  };

  if(submitted) return(
    <div className="card page-enter" style={{padding:48,textAlign:"center",maxWidth:500,margin:"40px auto"}}>
      <div style={{width:64,height:64,borderRadius:"50%",background:"var(--green-bg)",border:"2px solid var(--green)",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 20px"}}><I n="check" s={28} c="var(--green)"/></div>
      <div style={{fontFamily:"var(--fd)",fontSize:20,fontWeight:800,marginBottom:8}}>Checklist enviado!</div>
      <div style={{color:"var(--t2)",fontSize:13,marginBottom:24}}>Informações registradas com sucesso.<br/>Uma cópia será enviada para o seu e-mail e para o CS responsável.</div>
      <button className="btn bp" onClick={handleReset}><I n="rotate" s={14}/>Novo Checklist</button>
    </div>
  );

  return(
    <div className="page-enter" style={{maxWidth:800,margin:"0 auto"}}>
      {/* Progress bar */}
      <div className="card" style={{padding:"14px 20px",marginBottom:16}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
          <span style={{fontSize:12,fontWeight:600,color:"var(--t2)"}}>Progresso do Checklist</span>
          <span style={{fontSize:13,fontWeight:700,color:"var(--teal)",fontFamily:"var(--fd)"}}>{progress}%</span>
        </div>
        <div className="pbar" style={{height:8}}><div style={{height:"100%",borderRadius:99,background:"linear-gradient(90deg, var(--teal), var(--teal-l))",width:`${progress}%`,transition:"width .4s"}} /></div>
      </div>

      <Sec title="1. Informações Gerais">
        {/* Logged-in user as CP */}
        <div style={{padding:"12px 16px",borderRadius:"var(--r)",background:"var(--teal-dim)",border:"1px solid var(--teal)",display:"flex",alignItems:"center",gap:10,marginBottom:16}}>
          {user?.picture?<img src={user.picture} alt="" style={{width:32,height:32,borderRadius:"50%"}}/>
          :<div style={{width:32,height:32,background:"var(--teal)",borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:700,color:"#fff"}}>{user?.initials}</div>}
          <div style={{flex:1}}>
            <div style={{fontSize:11,color:"var(--t3)"}}>CP Responsável (logado)</div>
            <div style={{fontSize:13,fontWeight:600,color:"var(--t1)"}}>{user?.name} <span style={{fontWeight:400,color:"var(--t3)"}}>({user?.email})</span></div>
          </div>
        </div>
        <div className="g2" style={{gap:14}}>
          <CF l="Cliente" req><ClientSearch value={f.client} onChange={v=>set("client",v)} onSelect={(entry)=>{
            if(!entry){sF(p=>({...p,agency:"",cs_name:"",cs_email:""}));return;}
            sF(p=>({...p,
              agency:entry.agency||"",
              cs_name:entry.cs||"",
              cs_email:entry.csEmail||"",
            }));
          }}/></CF>
          <CF l="Campanha" req><input className="fi" value={f.campaign_name} onChange={e=>set("campaign_name",e.target.value)}/></CF>
          <CF l="Agência"><input className="fi" value={f.agency} onChange={e=>set("agency",e.target.value)}/></CF>
          <CF l="Indústria" req><select className="fs" value={f.industry} onChange={e=>set("industry",e.target.value)}><option value="">Selecione...</option>{INDUSTRIES.map(i=><option key={i}>{i}</option>)}</select></CF>
          <CF l="Tipo de Campanha" req><select className="fs" value={f.campaign_type} onChange={e=>set("campaign_type",e.target.value)}><option value="">Selecione...</option>{CAMPAIGN_TYPES.map(c=><option key={c}>{c}</option>)}</select></CF>
          <CF l="Data Início" req><input type="date" className="fi" value={f.start_date} onChange={e=>set("start_date",e.target.value)}/></CF>
          <CF l="Data Final" req><input type="date" className="fi" value={f.end_date} onChange={e=>set("end_date",e.target.value)}/></CF>
          <CF l="Investimento (R$)" req><input type="number" className="fi" placeholder="0,00" value={f.investment} onChange={e=>set("investment",e.target.value)}/></CF>
          <CF l="Deal DV360?" req><RG row opts={["Sim","Não"]} val={f.deal_dv360} onChange={v=>set("deal_dv360",v)}/></CF>
        </div>
        {f.cs_name&&f.cs_email&&(
          <div style={{marginTop:16,padding:"12px 16px",borderRadius:"var(--r)",background:"var(--green-bg)",border:"1px solid var(--green)",display:"flex",alignItems:"center",gap:10}}>
            <I n="check-circle" s={16} c="var(--green)"/>
            <div><div style={{fontSize:12,fontWeight:700,color:"var(--green)"}}>CS identificado automaticamente</div><div style={{fontSize:13,color:"var(--t1)",fontWeight:600,marginTop:2}}>{f.cs_name} <span style={{fontWeight:400,color:"var(--t3)"}}>({f.cs_email})</span></div></div>
          </div>
        )}
        {f.client&&!f.cs_name&&CLIENT_DB.find(c=>c.client===f.client)&&(
          <div className="disc" style={{marginTop:16}}><I n="alert-triangle" s={14} c="var(--yellow-s)"/><span>Cliente sem CS encarteirado. O checklist será enviado apenas para o seu e-mail.</span></div>
        )}
      </Sec>

      <Sec title="2. Formatos e Métricas">
        <div style={{display:"flex",flexDirection:"column",gap:18}}>
          <CF l="Formatos" req><div style={{display:"flex",gap:8}}>{["Display","Video"].map(x=><span key={x} className={`chip${f.formats.includes(x)?" sel":""}`} onClick={()=>tog("formats",x)}>{x}</span>)}</div></CF>
          <div className="g2" style={{gap:14}}>
            {hasDisplay&&<CF l="CPM Negociado"><input className="fi" placeholder="R$ por mil" value={f.cpm} onChange={e=>set("cpm",e.target.value)}/></CF>}
            {hasVideo&&<CF l="CPCV Negociado"><input className="fi" placeholder="R$ por view" value={f.cpcv} onChange={e=>set("cpcv",e.target.value)}/></CF>}
          </div>
        </div>
      </Sec>

      <Sec title="3. Produtos Core e Volumetria">
        <div style={{display:"flex",flexDirection:"column",gap:18}}>
          <CF l="Produtos" req><div style={{display:"flex",gap:8,flexWrap:"wrap"}}>{CHECKLIST_CORE_PRODUCTS.map(p=><span key={p} className={`chip${f.products.includes(p)?" sel":""}`} onClick={()=>tog("products",p)}>{p}</span>)}</div></CF>

          {/* Volumetria per selected product */}
          {f.products.map(prod=>(
            <div key={prod} style={{padding:16,background:"var(--bg3)",borderRadius:"var(--r)",border:"1px solid var(--bdr)"}}>
              <div style={{fontSize:12,fontWeight:700,color:"var(--teal)",marginBottom:12,textTransform:"uppercase",letterSpacing:".06em"}}>{prod} — Volumetria Contratada</div>
              <div className="g2" style={{gap:12}}>
                <CF l="Impressões Visíveis"><input type="number" className="fi" placeholder="Ex: 1.000.000" value={f[`${prod}_imp`]||""} onChange={e=>set(`${prod}_imp`,e.target.value)}/></CF>
                <CF l="Views 100%"><input type="number" className="fi" placeholder="Ex: 500.000" value={f[`${prod}_views`]||""} onChange={e=>set(`${prod}_views`,e.target.value)}/></CF>
              </div>
              {prod==="OOH"&&<div style={{marginTop:12}}><CF l="Link dos endereços OOH"><input className="fi" placeholder="https://..." value={f.ooh_link} onChange={e=>set("ooh_link",e.target.value)}/></CF></div>}
              {prod==="RMND"&&<div style={{marginTop:12}}><CF l="Marketplaces"><div style={{display:"flex",gap:8}}>{MARKETPLACES.map(m=><span key={m} className={`chip${f.marketplaces.includes(m)?" sel":""}`} onClick={()=>tog("marketplaces",m)}>{m}</span>)}</div></CF></div>}
            </div>
          ))}

          {/* Bonificação por produto */}
          <CF l="Teremos volumetria bonificada nos produtos core?" req><RG row opts={["Sim","Não"]} val={f.has_bonus} onChange={v=>set("has_bonus",v)}/></CF>
          {f.has_bonus==="Sim"&&f.products.map(prod=>(
            <div key={prod+"_b"} style={{padding:14,background:"var(--yellow-dim)",borderRadius:"var(--r)",border:"1px solid rgba(237,217,0,0.3)"}}>
              <div style={{fontSize:12,fontWeight:700,color:"#a07a00",marginBottom:10,textTransform:"uppercase"}}>{prod} — Bonificação</div>
              <div className="g2" style={{gap:12}}>
                <CF l="Impressões Visíveis Bonif."><input type="number" className="fi" value={f[`${prod}_bonus_imp`]||""} onChange={e=>set(`${prod}_bonus_imp`,e.target.value)}/></CF>
                <CF l="Views 100% Bonif."><input type="number" className="fi" value={f[`${prod}_bonus_views`]||""} onChange={e=>set(`${prod}_bonus_views`,e.target.value)}/></CF>
              </div>
            </div>
          ))}
        </div>
      </Sec>

      <Sec title="4. Audiências, Features e Praças">
        <div style={{display:"flex",flexDirection:"column",gap:18}}>
          <CF l="Audiências vendidas"><textarea className="ft" rows={3} value={f.audiences} onChange={e=>set("audiences",e.target.value)}/></CF>

          {/* Features selection */}
          <CF l="Features">
            <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
              {ALL_CL_FEATURES.map(feat=>(
                <span key={feat} className={`chip${f.cl_features?.includes(feat)?" sel":""}`} style={{fontSize:11}}
                  onClick={()=>sF(p=>{const arr=p.cl_features||[];return{...p,cl_features:arr.includes(feat)?arr.filter(x=>x!==feat):[...arr,feat]}})}>
                  {feat}
                </span>
              ))}
            </div>
          </CF>

          {/* Feature volumetry details */}
          {(f.cl_features||[]).filter(feat=>FEAT_VOL[feat]).length>0&&(
            <div style={{padding:16,background:"var(--bg3)",borderRadius:"var(--r)",border:"1px solid var(--bdr)"}}>
              <div style={{fontSize:12,fontWeight:700,color:"var(--teal)",marginBottom:6,textTransform:"uppercase",letterSpacing:".06em"}}>Volumetria de Features</div>
              <div className="disc" style={{marginBottom:14,fontSize:11}}>
                <I n="alert-triangle" s={13} c="var(--yellow-s)"/>
                <div>
                  <strong>Contratada</strong> = entregue dentro do volume contratado nos produtos core. <strong>Bonificada</strong> = volume adicional ao contratado no produto core.
                  {" "}Exceto P-DOOH, os campos de volumetria são opcionais.
                </div>
              </div>
              {(f.cl_features||[]).filter(feat=>FEAT_VOL[feat]).map(feat=>{
                const cfg=FEAT_VOL[feat];
                const volType=f[`fvol_type_${feat}`]||"contratada";
                return(
                  <div key={feat} style={{padding:12,background:"var(--bg-card)",borderRadius:"var(--r)",border:"1px solid var(--bdr)",marginBottom:10}}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
                      <span style={{fontSize:13,fontWeight:700,color:"var(--t1)"}}>{feat}</span>
                      <div style={{display:"flex",gap:4}}>
                        {["contratada","bonificada"].map(vt=>(
                          <button key={vt} className={`btn ${volType===vt?"bp":"bs"}`} style={{fontSize:10,padding:"3px 10px",textTransform:"capitalize"}}
                            onClick={()=>set(`fvol_type_${feat}`,vt)}>{vt}</button>
                        ))}
                      </div>
                    </div>
                    {volType==="contratada"&&<div className="disc" style={{marginBottom:10,fontSize:10}}><I n="alert-circle" s={12} c="var(--teal)"/>Volume entregue dentro da volumetria contratada nos produtos core.</div>}
                    <div className="g2" style={{gap:10}}>
                      {cfg.fields.map(field=>(
                        <CF key={field} l={field}><input type="number" className="fi" placeholder={feat==="P-DOOH"?"Obrigatório":"Opcional"} value={f[`fv_${feat}_${field}`]||""} onChange={e=>set(`fv_${feat}_${field}`,e.target.value)}/></CF>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Survey / Video Survey text boxes */}
          {(f.cl_features||[]).filter(feat=>FEAT_TEXT.includes(feat)).map(feat=>(
            <div key={feat} style={{padding:16,background:"var(--bg3)",borderRadius:"var(--r)",border:"1px solid var(--bdr)"}}>
              <div style={{fontSize:12,fontWeight:700,color:"var(--teal)",marginBottom:12,textTransform:"uppercase"}}>{feat}</div>
              <CF l="Perguntas e Respostas"><textarea className="ft" rows={4} placeholder="Inclua as perguntas e opções de resposta..." value={f[`ftext_${feat}`]||""} onChange={e=>set(`ftext_${feat}`,e.target.value)}/></CF>
            </div>
          ))}

          {/* Inventário Parceiro */}
          <CF l="Entrega em inventário parceiro">
            <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
              {INVENTORY_PARTNERS.map(p=>(
                <span key={p} className={`chip${(f.inventory_partners||[]).includes(p)?" sel":""}`}
                  onClick={()=>sF(prev=>{const arr=prev.inventory_partners||[];return{...prev,inventory_partners:arr.includes(p)?arr.filter(x=>x!==p):[...arr,p]}})}>
                  {p}
                </span>
              ))}
            </div>
          </CF>

          <CF l="Praças" req>
            <RG row opts={["Brasil","Estado","Cidade","Outro"]} val={f.praças_type} onChange={v=>set("praças_type",v)}/>
            {f.praças_type==="Estado"&&<select className="fs" style={{marginTop:10}} value={f.praças_state} onChange={e=>set("praças_state",e.target.value)}><option value="">Selecione...</option>{BRAZIL_STATES.map(s=><option key={s}>{s}</option>)}</select>}
            {f.praças_type==="Cidade"&&<div className="g2" style={{gap:10,marginTop:10}}><select className="fs" value={f.praças_state} onChange={e=>set("praças_state",e.target.value)}><option value="">Estado...</option>{BRAZIL_STATES.map(s=><option key={s}>{s}</option>)}</select><input className="fi" placeholder="Cidade" value={f.praças_city} onChange={e=>set("praças_city",e.target.value)}/></div>}
            {f.praças_type==="Outro"&&<input className="fi" style={{marginTop:10}} placeholder="Descreva..." value={f.praças_other} onChange={e=>set("praças_other",e.target.value)}/>}
          </CF>
          <CF l="Reunião pré-campanha com CS?" req><RG row opts={["Sim","Não"]} val={f.had_cs_meeting} onChange={v=>set("had_cs_meeting",v)}/></CF>
        </div>
      </Sec>

      <Sec title="5. Links e Documentos">
        <div style={{display:"flex",flexDirection:"column",gap:18}}>
          <CF l="Link das peças"><input className="fi" placeholder="Link do Drive..." value={f.pecas_link} onChange={e=>set("pecas_link",e.target.value)}/><div className="disc" style={{marginTop:8}}><I n="alert-triangle" s={13} c="var(--yellow)"/>Verificar peso máximo das peças.</div></CF>
          <CF l="URLs de direcionamento"><div style={{display:"flex",flexDirection:"column",gap:8}}>{f.extra_urls.map((u,i)=><div key={i} style={{display:"flex",gap:8}}><input className="fi" placeholder="https://..." value={u} onChange={e=>{const a=[...f.extra_urls];a[i]=e.target.value;set("extra_urls",a)}}/>{f.extra_urls.length>1&&<button className="btn bg" onClick={()=>set("extra_urls",f.extra_urls.filter((_,j)=>j!==i))}><I n="x" s={14}/></button>}</div>)}<button className="btn bs" style={{alignSelf:"flex-start",fontSize:12}} onClick={()=>set("extra_urls",[...f.extra_urls,""])}><I n="plus" s={12}/>Adicionar URL</button></div></CF>
          <CF l="Link do PI"><input className="fi" value={f.pi_link} onChange={e=>set("pi_link",e.target.value)}/></CF>
          <CF l="Link da Proposta"><input className="fi" value={f.proposta_link} onChange={e=>set("proposta_link",e.target.value)}/></CF>
        </div>
      </Sec>

      {/* Email summary + Submit */}
      <div className="card" style={{padding:"16px 20px",marginBottom:12}}>
        <div style={{fontSize:12,fontWeight:700,color:"var(--t2)",textTransform:"uppercase",letterSpacing:".06em",marginBottom:12}}>Notificações por e-mail</div>
        <div style={{display:"flex",flexDirection:"column",gap:8}}>
          <div style={{display:"flex",alignItems:"center",gap:10,padding:"8px 12px",borderRadius:"var(--r)",background:"var(--teal-dim)",border:"1px solid var(--teal)"}}>
            <I n="user" s={14} c="var(--teal)"/>
            <div style={{flex:1}}>
              <div style={{fontSize:11,color:"var(--t3)"}}>CP (você)</div>
              <div style={{fontSize:13,fontWeight:600,color:"var(--t1)"}}>{user?.name} — {user?.email}</div>
            </div>
          </div>
          {f.cs_email?(
            <div style={{display:"flex",alignItems:"center",gap:10,padding:"8px 12px",borderRadius:"var(--r)",background:"var(--green-bg)",border:"1px solid var(--green)"}}>
              <I n="send" s={14} c="var(--green)"/>
              <div style={{flex:1}}>
                <div style={{fontSize:11,color:"var(--t3)"}}>CS Responsável</div>
                <div style={{fontSize:13,fontWeight:600,color:"var(--t1)"}}>{f.cs_name} — {f.cs_email}</div>
              </div>
            </div>
          ):(
            <div style={{display:"flex",alignItems:"center",gap:10,padding:"8px 12px",borderRadius:"var(--r)",background:"var(--yellow-dim)",border:"1px solid rgba(237,217,0,0.3)"}}>
              <I n="alert-triangle" s={14} c="var(--yellow-s)"/>
              <div style={{fontSize:12,color:"var(--t2)"}}>Sem CS identificado — apenas você receberá o e-mail</div>
            </div>
          )}
        </div>
      </div>
      <div className="card" style={{padding:20,display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:12}}>
        <span style={{fontSize:12,color:"var(--t3)"}}>Verifique todas as informações antes de enviar.</span>
        <div style={{display:"flex",gap:8}}>
          <button className="btn bs" onClick={handleReset}><I n="rotate" s={14}/>Limpar</button>
          <button className="btn bp" onClick={handleSubmit}><I n="send" s={14}/>Enviar Checklist</button>
        </div>
      </div>
    </div>
  );
}

// Checklist helpers
function Sec({title,children,defaultOpen=true}) {
  const [open,sO]=useState(defaultOpen);
  return(<div className="card" style={{marginBottom:16,overflow:"hidden"}}><div style={{padding:"14px 20px",display:"flex",alignItems:"center",justifyContent:"space-between",cursor:"pointer",borderBottom:open?"1px solid var(--bdr)":"none",background:open?"transparent":"var(--bg3)",transition:"background .15s"}} onClick={()=>sO(o=>!o)}><span style={{fontFamily:"var(--fd)",fontWeight:700,fontSize:13,color:"var(--t1)"}}>{title}</span><I n="chevron-down" s={16} c="var(--t3)" style={{transform:open?"rotate(180deg)":"rotate(0)",transition:"transform .2s"}}/></div>{open&&<div style={{padding:20}}>{children}</div>}</div>);
}
function CF({l,req,children}) { return(<div className="fg"><label className="fl">{l}{req&&<span style={{color:"var(--red)",marginLeft:3}}>*</span>}</label>{children}</div>); }
function RG({opts,val,onChange,row}) {
  return(<div style={{display:"flex",gap:10,flexWrap:"wrap",flexDirection:row?"row":"column"}}>{opts.map(o=>(<label key={o} style={{display:"flex",alignItems:"center",gap:8,cursor:"pointer",fontSize:13}} onClick={()=>onChange(o)}><div style={{width:18,height:18,borderRadius:"50%",border:`2px solid ${val===o?"var(--teal)":"var(--bdr)"}`,background:val===o?"var(--teal)":"transparent",display:"flex",alignItems:"center",justifyContent:"center",transition:"all .15s",flexShrink:0}}>{val===o&&<div style={{width:6,height:6,borderRadius:"50%",background:"#fff"}}/>}</div><span>{o}</span></label>))}</div>);
}
function FeatSearch({value,onChange}) {
  const [q,sQ]=useState(""); const [open,sO]=useState(false);
  const fil=FEATURES.filter(f=>f.toLowerCase().includes(q.toLowerCase())&&!value.includes(f));
  return(<div><div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:value.length?8:0}}>{value.map(f=><span key={f} style={{display:"inline-flex",alignItems:"center",gap:5,padding:"4px 10px",borderRadius:99,background:"var(--teal-dim)",border:"1px solid var(--teal)",fontSize:12,color:"var(--teal-l)",fontWeight:600}}>{f}<span style={{cursor:"pointer"}} onClick={()=>onChange(value.filter(x=>x!==f))}>×</span></span>)}</div><div style={{position:"relative"}}><input className="fi" placeholder="Buscar feature..." value={q} onFocus={()=>sO(true)} onBlur={()=>setTimeout(()=>sO(false),150)} onChange={e=>{sQ(e.target.value);sO(true)}}/>{open&&fil.length>0&&<div className="dd">{fil.map(f=><div key={f} className="di" onClick={()=>{onChange([...value,f]);sQ("");sO(false)}}>{f}</div>)}</div>}</div></div>);
}

// ══════════════════════════════════════════════════════════════════════════════
// CHECKLIST CENTER (view/edit submitted checklists)
// ══════════════════════════════════════════════════════════════════════════════
function ChecklistCenter({checklists,setChecklists,onDuplicate}) {
  const [selected,setSelected]=useState(null);
  const [editing,setEditing]=useState(false);
  const [editData,setEditData]=useState(null);
  const [search,setSearch]=useState("");
  const toast=useToast();

  const filtered=useMemo(()=>{
    const q=search.toLowerCase();
    return checklists.filter(c=>!q||c.client?.toLowerCase().includes(q)||c.campaign_name?.toLowerCase().includes(q)||c.agency?.toLowerCase().includes(q));
  },[checklists,search]);

  const handleEdit=(c)=>{setEditData({...c});setEditing(true)};
  const handleSave=()=>{
    setChecklists(prev=>prev.map(c=>c.id===editData.id?editData:c));
    setSelected(editData);
    setEditing(false);
    toast("Checklist atualizado!");
  };

  // Detail row helper
  const D=({l,v,wide})=>v?(
    <div style={{padding:12,background:"var(--bg3)",borderRadius:"var(--r)",gridColumn:wide?"1/-1":"auto"}}>
      <div style={{fontSize:11,color:"var(--t3)",textTransform:"uppercase",fontWeight:700,marginBottom:4}}>{l}</div>
      <div style={{fontSize:13,color:"var(--t1)",fontWeight:600,whiteSpace:"pre-wrap"}}>{v}</div>
    </div>
  ):null;

  // Tags helper
  const Tags=({items,color})=>(items||[]).length>0?(
    <div style={{display:"flex",gap:4,flexWrap:"wrap"}}>
      {items.map(p=><span key={p} style={{padding:"2px 8px",background:color==="teal"?"var(--teal-dim)":"var(--bg3)",color:color==="teal"?"var(--teal-l)":"var(--t2)",borderRadius:99,fontSize:11,fontWeight:600,border:color==="teal"?"1px solid var(--teal)":"1px solid var(--bdr)"}}>{p}</span>)}
    </div>
  ):null;

  const fmtNum=(v)=>v?Number(v).toLocaleString("pt-BR"):"—";

  return(
    <div className="page-enter">
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:24,flexWrap:"wrap",gap:12}}>
        <h2 style={{fontFamily:"var(--fd)",fontSize:18,fontWeight:700}}>Checklists Enviados</h2>
        <div style={{position:"relative",minWidth:200,maxWidth:300}}>
          <I n="search" s={13} style={{position:"absolute",left:10,top:"50%",transform:"translateY(-50%)"}} c="var(--t3)"/>
          <input className="fi" style={{paddingLeft:32}} placeholder="Buscar cliente ou campanha..." value={search} onChange={e=>setSearch(e.target.value)}/>
        </div>
      </div>

      {filtered.length===0?(
        <div className="card"><div className="empty"><I n="clipboard" s={40} c="var(--t3)"/><h3 style={{fontFamily:"var(--fd)",fontSize:15,color:"var(--t2)"}}>Nenhum checklist enviado ainda</h3></div></div>
      ):(
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(340px,1fr))",gap:16}}>
          {filtered.map(c=>(
            <div key={c.id} className="card" style={{padding:"18px 20px",cursor:"pointer",display:"flex",flexDirection:"column",gap:10}} onClick={()=>{setSelected(c);setEditing(false)}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <span style={{fontSize:15,fontWeight:700,fontFamily:"var(--fd)",color:"var(--t1)"}}>{c.client}</span>
                <span style={{fontSize:11,color:"var(--t3)"}}>{c.created_at?new Date(c.created_at).toLocaleDateString("pt-BR"):"—"}</span>
              </div>
              <div style={{fontSize:13,color:"var(--t2)"}}>{c.campaign_name||"—"}</div>
              <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                {c.agency&&<span style={{fontSize:11,color:"var(--t3)",background:"var(--bg3)",padding:"2px 8px",borderRadius:99}}>{c.agency}</span>}
                {c.campaign_type&&<span style={{fontSize:11,color:"var(--teal)",background:"var(--teal-dim)",padding:"2px 8px",borderRadius:99}}>{c.campaign_type}</span>}
              </div>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",paddingTop:8,borderTop:"1px solid var(--bdr)"}}>
                <span style={{fontSize:13,fontWeight:700,color:"var(--teal)"}}>{c.investment?`R$ ${Number(c.investment).toLocaleString("pt-BR")}`:"—"}</span>
                <Tags items={c.products} color="teal"/>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Detail/Edit Modal */}
      {selected&&(
        <div className="mo" onClick={e=>e.target===e.currentTarget&&setSelected(null)}>
          <div className="ml ml-lg" style={{maxWidth:920}}>
            <div className="mh">
              <div>
                <div className="mt">{editing?"Editar Checklist":"Detalhes do Checklist"}</div>
                <div style={{fontSize:12,color:"var(--t3)",marginTop:4}}>{selected.client} — {selected.campaign_name}</div>
              </div>
              <div style={{display:"flex",gap:6}}>
                {!editing&&<button className="btn bp" style={{fontSize:12}} onClick={()=>{setSelected(null);if(onDuplicate)onDuplicate(selected)}}><I n="rotate" s={14}/>Duplicar</button>}
                {!editing&&<button className="btn bs" style={{fontSize:12}} onClick={()=>handleEdit(selected)}><I n="file-text" s={14}/>Editar</button>}
                <button className="btn bg" onClick={()=>{setSelected(null);setEditing(false)}}><I n="x" s={18}/></button>
              </div>
            </div>
            <div className="mb">
              {editing?(
                /* ── EDIT MODE ── */
                <div style={{display:"flex",flexDirection:"column",gap:14}}>
                  <div className="g2" style={{gap:12}}>
                    <CF l="Cliente"><input className="fi" value={editData.client||""} onChange={e=>setEditData(p=>({...p,client:e.target.value}))}/></CF>
                    <CF l="Campanha"><input className="fi" value={editData.campaign_name||""} onChange={e=>setEditData(p=>({...p,campaign_name:e.target.value}))}/></CF>
                    <CF l="Agência"><input className="fi" value={editData.agency||""} onChange={e=>setEditData(p=>({...p,agency:e.target.value}))}/></CF>
                    <CF l="Tipo"><input className="fi" value={editData.campaign_type||""} onChange={e=>setEditData(p=>({...p,campaign_type:e.target.value}))}/></CF>
                    <CF l="Investimento (R$)"><input type="number" className="fi" value={editData.investment||""} onChange={e=>setEditData(p=>({...p,investment:e.target.value}))}/></CF>
                    <CF l="Indústria"><input className="fi" value={editData.industry||""} onChange={e=>setEditData(p=>({...p,industry:e.target.value}))}/></CF>
                    <CF l="Data Início"><input type="date" className="fi" value={editData.start_date||""} onChange={e=>setEditData(p=>({...p,start_date:e.target.value}))}/></CF>
                    <CF l="Data Final"><input type="date" className="fi" value={editData.end_date||""} onChange={e=>setEditData(p=>({...p,end_date:e.target.value}))}/></CF>
                  </div>
                  <CF l="Audiências"><textarea className="ft" rows={3} value={editData.audiences||""} onChange={e=>setEditData(p=>({...p,audiences:e.target.value}))}/></CF>
                  {/* Editable volumetries */}
                  {(editData.products||[]).map(prod=>(
                    <div key={prod} className="g2" style={{gap:12}}>
                      <CF l={`${prod} — Impressões Visíveis`}><input type="number" className="fi" value={editData[`${prod}_imp`]||""} onChange={e=>setEditData(p=>({...p,[`${prod}_imp`]:e.target.value}))}/></CF>
                      <CF l={`${prod} — Views 100%`}><input type="number" className="fi" value={editData[`${prod}_views`]||""} onChange={e=>setEditData(p=>({...p,[`${prod}_views`]:e.target.value}))}/></CF>
                    </div>
                  ))}
                  <div style={{display:"flex",gap:10,justifyContent:"flex-end",marginTop:8}}>
                    <button className="btn bs" onClick={()=>setEditing(false)}>Cancelar</button>
                    <button className="btn bp" onClick={handleSave}><I n="check" s={14}/>Salvar Alterações</button>
                  </div>
                </div>
              ):(
                /* ── VIEW MODE ── */
                <div style={{display:"flex",flexDirection:"column",gap:16}}>
                  {/* Short Token - Report Hub */}
                  {selected.short_token&&(
                    <div style={{padding:"16px 20px",background:"linear-gradient(135deg, var(--teal-dim), rgba(51,151,185,0.05))",borderRadius:14,border:"2px solid var(--teal)",display:"flex",alignItems:"center",justifyContent:"space-between",gap:16}}>
                      <div>
                        <div style={{fontSize:11,color:"var(--t3)",textTransform:"uppercase",fontWeight:700,letterSpacing:".06em",marginBottom:4}}>Short Token — Report Hub</div>
                        <div style={{fontSize:28,fontWeight:800,fontFamily:"var(--fd)",color:"var(--teal)",letterSpacing:"0.15em"}}>{selected.short_token}</div>
                      </div>
                      <a href={`https://report.hypr.mobi/report/${selected.short_token}?ak=hypr2026`} target="_blank" rel="noreferrer" className="btn bp" style={{textDecoration:"none",fontSize:12,padding:"8px 16px"}}>
                        <I n="activity" s={14}/>Abrir Report
                      </a>
                    </div>
                  )}

                  {/* Section 1: Informações Gerais */}
                  <div style={{fontFamily:"var(--fd)",fontSize:14,fontWeight:700,color:"var(--t1)",borderBottom:"1px solid var(--bdr)",paddingBottom:8}}>1. Informações Gerais</div>
                  <div className="g2" style={{gap:10}}>
                    <D l="Cliente" v={selected.client}/>
                    <D l="Campanha" v={selected.campaign_name}/>
                    <D l="Agência" v={selected.agency}/>
                    <D l="Indústria" v={selected.industry}/>
                    <D l="Tipo de Campanha" v={selected.campaign_type}/>
                    <D l="Período" v={`${fmtDate(selected.start_date)} → ${fmtDate(selected.end_date)}`}/>
                    <D l="Investimento" v={selected.investment?`R$ ${fmtNum(selected.investment)}`:"—"}/>
                    <D l="Deal DV360" v={selected.deal_dv360===true||selected.deal_dv360==="Sim"?"Sim":"Não"}/>
                  </div>
                  {selected.cs_name&&(
                    <div style={{padding:12,background:"var(--green-bg)",borderRadius:"var(--r)",border:"1px solid var(--green)"}}>
                      <div style={{fontSize:12,fontWeight:600,color:"var(--green)"}}>CS: {selected.cs_name} ({selected.cs_email||"—"})</div>
                    </div>
                  )}

                  {/* Section 2: Formatos */}
                  <div style={{fontFamily:"var(--fd)",fontSize:14,fontWeight:700,color:"var(--t1)",borderBottom:"1px solid var(--bdr)",paddingBottom:8}}>2. Formatos e Métricas</div>
                  <div className="g2" style={{gap:10}}>
                    <D l="Formatos" v={(selected.formats||[]).join(", ")}/>
                    {selected.cpm&&<D l="CPM Negociado" v={`R$ ${selected.cpm}`}/>}
                    {selected.cpcv&&<D l="CPCV Negociado" v={`R$ ${selected.cpcv}`}/>}
                  </div>

                  {/* Section 3: Produtos e Volumetria */}
                  <div style={{fontFamily:"var(--fd)",fontSize:14,fontWeight:700,color:"var(--t1)",borderBottom:"1px solid var(--bdr)",paddingBottom:8}}>3. Produtos Core e Volumetria</div>
                  {(selected.products||[]).length>0&&<div><div style={{fontSize:11,color:"var(--t3)",textTransform:"uppercase",fontWeight:700,marginBottom:6}}>Produtos</div><Tags items={selected.products} color="teal"/></div>}
                  {(selected.products||[]).map(prod=>(
                    <div key={prod} style={{padding:14,background:"var(--bg3)",borderRadius:"var(--r)",border:"1px solid var(--bdr)"}}>
                      <div style={{fontSize:12,fontWeight:700,color:"var(--teal)",marginBottom:8,textTransform:"uppercase"}}>{prod} — Volumetria Contratada</div>
                      <div className="g2" style={{gap:10}}>
                        <D l="Impressões Visíveis" v={fmtNum(selected[`${prod}_imp`])}/>
                        <D l="Views 100%" v={fmtNum(selected[`${prod}_views`])}/>
                      </div>
                      {prod==="OOH"&&selected.ooh_link&&<div style={{marginTop:8}}><D l="Link OOH" v={selected.ooh_link}/></div>}
                      {prod==="RMND"&&(selected.marketplaces||[]).length>0&&<div style={{marginTop:8}}><div style={{fontSize:11,color:"var(--t3)",textTransform:"uppercase",fontWeight:700,marginBottom:4}}>Marketplaces</div><Tags items={selected.marketplaces} color="teal"/></div>}
                    </div>
                  ))}
                  {(selected.has_bonus==="Sim"||selected.has_bonus===true)&&(
                    <div>
                      <div style={{fontSize:12,fontWeight:700,color:"#a07a00",marginBottom:8,textTransform:"uppercase"}}>Bonificações</div>
                      {(selected.products||[]).map(prod=>(
                        (selected[`${prod}_bonus_imp`]||selected[`${prod}_bonus_views`])?(
                          <div key={prod+"_b"} style={{padding:14,background:"var(--yellow-dim)",borderRadius:"var(--r)",border:"1px solid rgba(237,217,0,0.3)",marginBottom:8}}>
                            <div style={{fontSize:12,fontWeight:700,color:"#a07a00",marginBottom:8,textTransform:"uppercase"}}>{prod} — Bonificação</div>
                            <div className="g2" style={{gap:10}}>
                              <D l="Impressões Bonif." v={fmtNum(selected[`${prod}_bonus_imp`])}/>
                              <D l="Views Bonif." v={fmtNum(selected[`${prod}_bonus_views`])}/>
                            </div>
                          </div>
                        ):null
                      ))}
                    </div>
                  )}

                  {/* Section 4: Audiências, Features, Praças */}
                  <div style={{fontFamily:"var(--fd)",fontSize:14,fontWeight:700,color:"var(--t1)",borderBottom:"1px solid var(--bdr)",paddingBottom:8}}>4. Audiências, Features e Praças</div>
                  {selected.audiences&&<D l="Audiências Vendidas" v={selected.audiences} wide/>}
                  
                  {(selected.cl_features||[]).length>0&&(
                    <div>
                      <div style={{fontSize:11,color:"var(--t3)",textTransform:"uppercase",fontWeight:700,marginBottom:6}}>Features Selecionadas</div>
                      <Tags items={selected.cl_features} color="teal"/>
                    </div>
                  )}

                  {/* Feature volumetries */}
                  {(selected.cl_features||[]).filter(f=>FEAT_VOL[f]).map(feat=>{
                    const cfg=FEAT_VOL[feat];
                    const volType=selected[`fvol_type_${feat}`]||"contratada";
                    const hasValues=cfg.fields.some(field=>selected[`fv_${feat}_${field}`]);
                    if(!hasValues) return null;
                    return(
                      <div key={feat} style={{padding:14,background:"var(--bg3)",borderRadius:"var(--r)",border:"1px solid var(--bdr)"}}>
                        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
                          <span style={{fontSize:13,fontWeight:700,color:"var(--t1)"}}>{feat}</span>
                          <span className={`badge ${volType==="bonificada"?"b-teal":"b-ylw"}`} style={{textTransform:"capitalize"}}>{volType}</span>
                        </div>
                        <div className="g2" style={{gap:10}}>
                          {cfg.fields.map(field=><D key={field} l={field} v={fmtNum(selected[`fv_${feat}_${field}`])}/>)}
                        </div>
                      </div>
                    );
                  })}

                  {/* Survey / Video Survey */}
                  {(selected.cl_features||[]).filter(f=>["Survey","Video Survey"].includes(f)).map(feat=>(
                    selected[`ftext_${feat}`]?(
                      <div key={feat} style={{padding:14,background:"var(--bg3)",borderRadius:"var(--r)",border:"1px solid var(--bdr)"}}>
                        <div style={{fontSize:12,fontWeight:700,color:"var(--teal)",marginBottom:8,textTransform:"uppercase"}}>{feat}</div>
                        <D l="Perguntas e Respostas" v={selected[`ftext_${feat}`]} wide/>
                      </div>
                    ):null
                  ))}

                  {/* Inventário Parceiro */}
                  {(selected.inventory_partners||[]).length>0&&(
                    <div>
                      <div style={{fontSize:11,color:"var(--t3)",textTransform:"uppercase",fontWeight:700,marginBottom:6}}>Inventário Parceiro</div>
                      <Tags items={selected.inventory_partners}/>
                    </div>
                  )}

                  {/* Praças */}
                  <div className="g2" style={{gap:10}}>
                    <D l="Praças" v={selected.praças_type==="Brasil"?"Brasil":selected.praças_type==="Estado"?`Estado: ${selected.praças_state||"—"}`:selected.praças_type==="Cidade"?`${selected.praças_state||""} — ${selected.praças_city||""}`:selected.praças_other||selected.praças_type||"—"}/>
                    <D l="Reunião pré-campanha com CS" v={selected.had_cs_meeting==="Sim"||selected.had_cs_meeting===true?"Sim":"Não"}/>
                  </div>

                  {/* Section 5: Links */}
                  <div style={{fontFamily:"var(--fd)",fontSize:14,fontWeight:700,color:"var(--t1)",borderBottom:"1px solid var(--bdr)",paddingBottom:8}}>5. Links e Documentos</div>
                  <div style={{display:"flex",flexDirection:"column",gap:8}}>
                    {[
                      ["Link das Peças",selected.pecas_link],
                      ["Link do PI",selected.pi_link],
                      ["Link da Proposta",selected.proposta_link],
                    ].filter(([,v])=>v).map(([label,url])=>(
                      <a key={label} href={url} target="_blank" rel="noreferrer" style={{display:"flex",alignItems:"center",gap:10,padding:"12px 16px",background:"var(--bg3)",borderRadius:"var(--r)",textDecoration:"none",border:"1px solid var(--bdr)",transition:"all 0.15s"}}>
                        <I n="external" s={14} c="var(--teal)"/>
                        <div style={{flex:1,minWidth:0}}>
                          <div style={{fontSize:11,color:"var(--t3)",textTransform:"uppercase",fontWeight:700}}>{label}</div>
                          <div style={{fontSize:12,color:"var(--teal)",fontWeight:500,wordBreak:"break-all",marginTop:2}}>{url}</div>
                        </div>
                      </a>
                    ))}
                    {(selected.extra_urls||[]).filter(Boolean).map((u,i)=>(
                      <a key={i} href={u} target="_blank" rel="noreferrer" style={{display:"flex",alignItems:"center",gap:10,padding:"12px 16px",background:"var(--bg3)",borderRadius:"var(--r)",textDecoration:"none",border:"1px solid var(--bdr)"}}>
                        <I n="link" s={14} c="var(--teal)"/>
                        <div style={{flex:1,minWidth:0}}>
                          <div style={{fontSize:11,color:"var(--t3)",textTransform:"uppercase",fontWeight:700}}>URL de Direcionamento {i+1}</div>
                          <div style={{fontSize:12,color:"var(--teal)",fontWeight:500,wordBreak:"break-all",marginTop:2}}>{u}</div>
                        </div>
                      </a>
                    ))}
                  </div>

                  {/* Submitted by */}
                  <div style={{paddingTop:12,borderTop:"1px solid var(--bdr)",fontSize:12,color:"var(--t3)"}}>
                    Enviado por: <strong style={{color:"var(--t1)"}}>{selected.submittedBy||selected.submitted_by||"—"}</strong>
                    {(selected.submittedByEmail||selected.submitted_by_email)&&<span> ({selected.submittedByEmail||selected.submitted_by_email})</span>}
                    {selected.created_at&&<span> — {new Date(selected.created_at).toLocaleDateString("pt-BR",{day:"2-digit",month:"2-digit",year:"numeric",hour:"2-digit",minute:"2-digit"})}</span>}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// MAIN APP
// ══════════════════════════════════════════════════════════════════════════════
const NAV=[
  {key:"home",icon:"home",label:"Dashboard"},
  {key:"tasks",icon:"check-square",label:"Task Center"},
  {key:"checklist",icon:"clipboard",label:"Checklist"},
  {key:"checklist-center",icon:"inbox",label:"Checklist Center"},
];

// ─── AUTH CONTEXT ────────────────────────────────────────────────────────────
const AuthCtx = createContext();
const useAuth = () => useContext(AuthCtx);
const GOOGLE_CLIENT_ID = "453955675457-mdf12g19of257ol5c6hs1b6qmuvg3r4f.apps.googleusercontent.com";

function LoginScreen() {
  const divRef = useRef();
  const [error, setError] = useState("");

  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.onload = () => {
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: (response) => {
          // Decode JWT token
          const payload = JSON.parse(atob(response.credential.split(".")[1]));
          if (!payload.email?.endsWith("@hypr.mobi")) {
            setError("Acesso restrito a contas @hypr.mobi");
            return;
          }
          const user = { name: payload.name, email: payload.email, picture: payload.picture, initials: payload.name?.split(" ").map(n=>n[0]).join("").substring(0,2).toUpperCase() };
          window.__hyprUser = user;
          window.dispatchEvent(new Event("hypr-login"));
        },
        auto_select: false,
      });
      window.google.accounts.id.renderButton(divRef.current, {
        theme: "filled_blue", size: "large", text: "signin_with", shape: "pill", width: 280, locale: "pt-BR",
      });
    };
    document.head.appendChild(script);
    return () => { try { document.head.removeChild(script); } catch(e) {} };
  }, []);

  return (
    <div style={{minHeight:"100vh",background:"#1C262F",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'DM Sans',sans-serif"}}>
      <div style={{textAlign:"center",padding:40}}>
        <div style={{fontFamily:"'Syne',sans-serif",fontSize:36,fontWeight:800,color:"#fff",marginBottom:4}}>
          HYPR <span style={{color:"#3397B9",fontSize:20,fontWeight:400,letterSpacing:"0.08em"}}>Command</span>
        </div>
        <div style={{color:"#8DA0AE",fontSize:14,marginBottom:40}}>Plataforma integrada Sales & CS</div>
        <div style={{display:"flex",justifyContent:"center",marginBottom:16}} ref={divRef} />
        {error && (
          <div style={{marginTop:16,padding:"12px 20px",borderRadius:10,background:"rgba(239,68,68,0.12)",border:"1px solid rgba(239,68,68,0.3)",color:"#EF4444",fontSize:13,fontWeight:600}}>
            {error}
          </div>
        )}
        <div style={{color:"#5A7080",fontSize:12,marginTop:32}}>Acesso restrito — contas @hypr.mobi</div>
      </div>
    </div>
  );
}

export default function App() {
  const [user,setUser]=useState(null);
  const [clients,setClients]=useState([]);
  const [clientsLoading,setClientsLoading]=useState(false);
  const [page,setPage]=useState(()=>{const h=window.location.hash.replace("#","");return ["home","monitor","tasks","checklist","checklist-center"].includes(h)?h:"home"});
  const navigate=(p)=>{setPage(p);window.location.hash=p};
  const [theme,setTheme]=useState("light");
  const [collapsed,setCollapsed]=useState(false);
  const [mobileOpen,setMobileOpen]=useState(false);
  const [tasks,setTasks]=useState([]);
  const [submittedChecklists,setSubmittedChecklists]=useState([]);
  const [duplicateData,setDuplicateData]=useState(null);
  const [notifs,setNotifs]=useState(INITIAL_NOTIFS);
  const [showNotifs,setShowNotifs]=useState(false);
  const notifRef=useRef();

  useEffect(()=>{document.documentElement.setAttribute("data-theme",theme)},[theme]);
  useEffect(()=>{const fn=e=>{if(notifRef.current&&!notifRef.current.contains(e.target))setShowNotifs(false)};document.addEventListener("mousedown",fn);return()=>document.removeEventListener("mousedown",fn)},[]);
  useEffect(()=>{const fn=()=>setUser(window.__hyprUser);window.addEventListener("hypr-login",fn);return()=>window.removeEventListener("hypr-login",fn);},[]);

  // Fetch clients from Cloud Function when user logs in
  useEffect(()=>{
    if(!user) return;
    setClientsLoading(true);
    fetch(CLIENTS_API_URL)
      .then(r=>r.json())
      .then(d=>{
        if(d.ok&&d.clients){setClients(d.clients);}
        else{console.warn("Failed to load clients:",d);}
      })
      .catch(err=>{console.error("Error fetching clients:",err);})
      .finally(()=>setClientsLoading(false));

    // Fetch tasks from backend
    fetch(`${BACKEND_URL}/tasks`)
      .then(r=>r.json())
      .then(rows=>{
        if(Array.isArray(rows)){
          setTasks(rows.map(r=>({
            id:r.id, type:r.type, client:r.client, agency:r.agency,
            products:r.products||[], features:r.features||[],
            budget:r.budget, briefing:r.briefing, cs:r.cs, csEmail:r.cs_email,
            status:r.status, deadline:r.deadline?.value||r.deadline,
            docLink:r.doc_link, requestedBy:r.requested_by,
            requesterEmail:r.requester_email, sla:r.sla,
            createdAt:r.created_at?.value||r.created_at,
          })));
        }
      })
      .catch(err=>console.error("Error fetching tasks:",err));

    // Fetch checklists from backend
    fetch(`${BACKEND_URL}/checklists`)
      .then(r=>r.json())
      .then(rows=>{
        if(Array.isArray(rows)){setSubmittedChecklists(rows)}
      })
      .catch(err=>console.error("Error fetching checklists:",err));
  },[user]);

  const unread=notifs.filter(n=>!n.read).length;
  const markAllRead=()=>setNotifs(ns=>ns.map(n=>({...n,read:true})));
  const pageTitle=NAV.find(n=>n.key===page)?.label||"Command";

  const handleLogout=()=>{setUser(null);window.__hyprUser=null;try{window.google.accounts.id.disableAutoSelect()}catch(e){}};

  if(!user) return <LoginScreen />;

  return(
    <AuthCtx.Provider value={user}>
    <ClientsCtx.Provider value={clients}>
    <ThemeCtx.Provider value={{theme,setTheme}}>
    <ToastProvider>
      <style>{CSS}</style>
      <div className="app">
        {mobileOpen&&<div className="mob-ov vis" onClick={()=>setMobileOpen(false)}/>}

        {/* SIDEBAR */}
        <aside className={`sb${collapsed?" col":""}${mobileOpen?" mob":""}`}>
          <div className="sb-logo">
            {collapsed?<svg viewBox="0 0 28 32" style={{height:28,width:28}}><text x="1" y="26" fontFamily="Arial Black,sans-serif" fontWeight="900" fontSize="26" fill="#FFFFFF">H</text></svg>
            :<div style={{fontFamily:"var(--fd)",fontSize:18,fontWeight:800,color:"#fff",letterSpacing:"-0.5px"}}>HYPR <span style={{color:"var(--teal)",fontWeight:400,fontSize:12,letterSpacing:".08em"}}>Command</span></div>}
          </div>
          {!collapsed&&<div className="sb-lbl">Módulos</div>}
          <nav className="sb-nav" style={{padding:collapsed?"8px":"8px 10px"}}>
            {NAV.map(n=>(
              <button key={n.key} className={`ni${page===n.key?" act":""}`}
                style={{justifyContent:collapsed?"center":"flex-start",padding:collapsed?10:"10px 12px"}}
                title={collapsed?n.label:undefined}
                onClick={()=>{navigate(n.key);setMobileOpen(false)}}>
                <I n={n.icon} s={16}/>
                {!collapsed&&<span style={{flex:1,fontSize:13}}>{n.label}</span>}
                {n.key==="tasks"&&unread>0&&!collapsed&&<span style={{background:"var(--yellow)",color:"var(--navy)",fontSize:10,fontWeight:700,padding:"1px 6px",borderRadius:99}}>{unread}</span>}
                {n.key==="tasks"&&unread>0&&collapsed&&<span style={{position:"absolute",top:7,right:7,width:7,height:7,borderRadius:"50%",background:"var(--yellow)"}}/>}
              </button>
            ))}
          </nav>
          {/* External links */}
          <div style={{padding:collapsed?"8px":"4px 10px",borderTop:"1px solid rgba(255,255,255,0.06)",display:"flex",flexDirection:"column",gap:2}}>
            {!collapsed&&<div style={{fontFamily:"var(--fd)",fontSize:9,fontWeight:700,letterSpacing:"0.12em",textTransform:"uppercase",color:"var(--teal)",padding:"8px 12px 4px"}}>Links Rápidos</div>}
            <a href="https://report.hypr.mobi" target="_blank" rel="noreferrer"
              className="ni" style={{justifyContent:collapsed?"center":"flex-start",padding:collapsed?10:"10px 12px",textDecoration:"none",color:"rgba(255,255,255,0.65)"}}>
              <I n="activity" s={16}/>
              {!collapsed&&<><span style={{flex:1,fontSize:13}}>Report Hub</span><I n="external" s={12} c="rgba(255,255,255,0.3)"/></>}
            </a>
            <a href="https://sales-manager-murex.vercel.app/login?callbackUrl=%2Fdashboard" target="_blank" rel="noreferrer"
              className="ni" style={{justifyContent:collapsed?"center":"flex-start",padding:collapsed?10:"10px 12px",textDecoration:"none",color:"rgba(255,255,255,0.65)"}}>
              <I n="dollar" s={16}/>
              {!collapsed&&<><span style={{flex:1,fontSize:13}}>Sales Management</span><I n="external" s={12} c="rgba(255,255,255,0.3)"/></>}
            </a>
          </div>
          {/* User info + logout */}
          <div className="sb-bot" style={{padding:collapsed?"12px 0":"12px 16px",justifyContent:collapsed?"center":"flex-start",flexDirection:"column",gap:8}}>
            {!collapsed&&(
              <div style={{display:"flex",alignItems:"center",gap:10,width:"100%",paddingBottom:8,borderBottom:"1px solid rgba(255,255,255,0.06)"}}>
                {user.picture?<img src={user.picture} alt="" style={{width:28,height:28,borderRadius:"50%"}}/>
                :<div style={{width:28,height:28,borderRadius:"50%",background:"linear-gradient(135deg,var(--teal),#1a5f7a)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:700,color:"#fff"}}>{user.initials}</div>}
                <div style={{flex:1,overflow:"hidden"}}>
                  <div style={{fontSize:12,fontWeight:600,color:"#fff",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{user.name}</div>
                  <div style={{fontSize:10,color:"rgba(255,255,255,0.4)",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{user.email}</div>
                </div>
              </div>
            )}
            <div style={{display:"flex",alignItems:"center",justifyContent:collapsed?"center":"space-between",width:"100%"}}>
              {!collapsed&&<span style={{fontSize:11,color:"rgba(255,255,255,0.22)",fontWeight:700,letterSpacing:".06em"}}>v2.0</span>}
              <div style={{display:"flex",gap:4}}>
                <button onClick={handleLogout} title="Sair" style={{background:"none",border:"none",cursor:"pointer",color:"rgba(255,255,255,0.35)",padding:6,borderRadius:8,display:"flex",alignItems:"center"}}>
                  <I n="external" s={14}/>
                </button>
                <button onClick={()=>setCollapsed(c=>!c)} title={collapsed?"Expandir":"Recolher"} style={{background:"none",border:"none",cursor:"pointer",color:"rgba(255,255,255,0.35)",padding:6,borderRadius:8,display:"flex",alignItems:"center"}}><I n="panel-left" s={14}/></button>
              </div>
            </div>
          </div>
        </aside>

        {/* MAIN */}
        <div className={`mn${collapsed?" col":""}`}>
          <header className="tb">
            <div style={{display:"flex",alignItems:"center",gap:12}}>
              <button className="btn bg hamburger" onClick={()=>setMobileOpen(true)}><I n="menu" s={18}/></button>
              <span style={{fontFamily:"var(--ff)",fontSize:16,fontWeight:600,letterSpacing:"-0.01em"}}>{pageTitle}</span>
            </div>
            <div style={{display:"flex",alignItems:"center",gap:8}}>
              <button className="btn bg" onClick={()=>setTheme(t=>t==="dark"?"light":"dark")} title={theme==="dark"?"Modo claro":"Modo escuro"} style={{border:"1px solid var(--bdr)",borderRadius:8,padding:"6px 8px"}}><I n={theme==="dark"?"sun":"moon"} s={16}/></button>
              <div style={{position:"relative"}} ref={notifRef}>
                <button className="btn bg" style={{border:"1px solid var(--bdr)",borderRadius:8,padding:"6px 8px",position:"relative"}} onClick={()=>setShowNotifs(s=>!s)}>
                  <I n="bell" s={16}/>
                  {unread>0&&<span style={{position:"absolute",top:2,right:2,width:8,height:8,borderRadius:"50%",background:"var(--red)",border:"2px solid var(--bg2)"}}/>}
                </button>
                {showNotifs&&(
                  <div className="notif-panel">
                    <div style={{padding:"14px 16px",borderBottom:"1px solid var(--bdr)",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                      <span style={{fontFamily:"var(--fd)",fontWeight:700,fontSize:14}}>Notificações</span>
                      {unread>0&&<button className="btn bg" style={{fontSize:11,padding:"4px 8px"}} onClick={markAllRead}>Marcar lidas</button>}
                    </div>
                    {notifs.length===0?<div style={{padding:24,textAlign:"center",color:"var(--t3)",fontSize:13}}>Sem notificações</div>
                    :notifs.map(n=>(
                      <div key={n.id} className="notif-item" style={{background:n.read?"transparent":"var(--teal-dim)10"}}>
                        <div style={{width:8,height:8,borderRadius:"50%",background:n.read?"transparent":n.type==="task"?"var(--yellow)":"var(--teal)",flexShrink:0,marginTop:5}}/>
                        <div style={{flex:1}}>
                          <div style={{fontSize:13,color:"var(--t1)",fontWeight:n.read?400:600}}>{n.msg}</div>
                          <div style={{fontSize:11,color:"var(--t3)",marginTop:2}}>{n.time}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              {user.picture?<img src={user.picture} alt="" style={{width:34,height:34,borderRadius:"50%",flexShrink:0}}/>
              :<div style={{width:34,height:34,background:"linear-gradient(135deg, var(--teal), #1a5f7a)",borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:700,color:"#fff",letterSpacing:".05em",flexShrink:0}}>{user.initials}</div>}
            </div>
          </header>

          <div className="pg">
            {page==="home"&&<Dashboard checklists={submittedChecklists} tasks={tasks} onNav={navigate} />}
            {page==="tasks"&&<TaskCenter tasks={tasks} setTasks={setTasks} />}
            {page==="checklist"&&<CampaignChecklist initialData={duplicateData} onChecklistSubmit={(data)=>{setSubmittedChecklists(prev=>[{...data,id:Date.now(),created_at:new Date().toISOString()},...prev]);setDuplicateData(null)}} />}
            {page==="checklist-center"&&<ChecklistCenter checklists={submittedChecklists} setChecklists={setSubmittedChecklists} onDuplicate={(c)=>{setDuplicateData(c);navigate("checklist")}} />}
          </div>
        </div>
      </div>
    </ToastProvider>
    </ThemeCtx.Provider>
    </ClientsCtx.Provider>
    </AuthCtx.Provider>
  );
}
