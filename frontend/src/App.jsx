import { useState, useEffect, useMemo, useRef, createContext, useContext, useCallback, Fragment } from "react";
import { LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

// ─── CONSTANTS ───────────────────────────────────────────────────────────────
const CS_LIST = ["Beatriz Severine","Isaac Agiman","João Armelin","João Buzolin","Mariana Lewinski","Thiago Nascimento","Greenfield","Solutions Architect"];
const GREENFIELD_QUEUE = CS_LIST.filter(c => c !== "Greenfield" && c !== "Solutions Architect");
const SA_NAME = "Solutions Architect";
const SA_EMAIL = "solutions@hypr.mobi";
const TASK_TYPES = ["Audience Discovery","Estudo de Mercado","Case de Sucesso","Pós-Venda","Dados Groundflow","Mapa Personalizado"];
const SLA_DAYS = { "Audience Discovery": 3, "Estudo de Mercado": 5, "Case de Sucesso": 7, "Pós-Venda": 2, "Dados Groundflow": 3, "Mapa Personalizado": 3 };
const CORE_PRODUCTS = ["O2O","OOH","RMN Digital","RMN Físico"];
const CHECKLIST_CORE_PRODUCTS = ["O2O","OOH","Groundflow","RMND"];
const FEATURES = ["P-DOOH","Brand Query","Carbon Neutral","Click to Calendar","Design Studio","Downloaded Apps","Tap To Scratch","Tap to Go","Topics","Seat","Tap To Carousel","Tap To Chat","Tap To Max","Weather","Purchase Context","Survey","Video Survey"];
const FEATURES_WITH_VOLUMETRIA = ["P-DOOH","Tap to Go","Tap To Scratch","Weather","Topics","Click to Calendar","Downloaded Apps"];
const MARKETPLACES = ["VTEX","Amazon"];
const MARKETING_ACTIONS = ["SXSW","Festa Aniversário HYPR","Festa São João","Festa Carnaval","Festa Halloween","Gift Card","Taste"];

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
const BRAZIL_REGIONS = {
  "Sudeste":["ES","MG","RJ","SP"],
  "Sul":["PR","RS","SC"],
  "Norte":["AC","AM","AP","PA","RO","RR","TO"],
  "Nordeste":["AL","BA","CE","MA","PB","PE","PI","RN","SE"],
  "Centro-Oeste":["DF","GO","MS","MT"],
};
const BRAZIL_CAPITALS = [
  "Rio Branco (AC)","Maceió (AL)","Macapá (AP)","Manaus (AM)","Salvador (BA)","Fortaleza (CE)",
  "Brasília (DF)","Vitória (ES)","Goiânia (GO)","São Luís (MA)","Cuiabá (MT)","Campo Grande (MS)",
  "Belo Horizonte (MG)","Belém (PA)","João Pessoa (PB)","Curitiba (PR)","Recife (PE)","Teresina (PI)",
  "Rio de Janeiro (RJ)","Natal (RN)","Porto Alegre (RS)","Porto Velho (RO)","Boa Vista (RR)",
  "Florianópolis (SC)","São Paulo (SP)","Aracaju (SE)","Palmas (TO)",
];
const MONTHS_PT = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];

// ─── CLIENT DATABASE (fetched from Cloud Function → Google Sheets) ──────────
// URL of the Cloud Function that reads the Sheet
const CLIENTS_API_URL = "https://southamerica-east1-site-hypr.cloudfunctions.net/hypr-command-clients";
const STUDIES_API_URL = "https://southamerica-east1-site-hypr.cloudfunctions.net/hypr-command-studies";
const BACKEND_URL = "https://hypr-command-backend-453955675457.southamerica-east1.run.app";

// Fallback empty — will be populated by API
let CLIENT_DB_FALLBACK = [];

// Context for sharing client data across components
const ClientsCtx = createContext([]);
const useClients = () => useContext(ClientsCtx);
const StudiesCtx = createContext([]);
const useStudies = () => useContext(StudiesCtx);


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
// Nome curto: primeiro nome + inicial do sobrenome (ex: "João A.")
// Se só tem 1 nome, retorna só ele. Se vazio, retorna "—".
function shortName(full) {
  if (!full) return "—";
  const parts = String(full).trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "—";
  if (parts.length === 1) return parts[0];
  return `${parts[0]} ${parts[parts.length-1].charAt(0).toUpperCase()}.`;
}
// Parse YYYY-MM-DD como data LOCAL (evita timezone shift que joga 01/05 → 30/04 em fusos UTC-)
function parseLocalDate(d) {
  if (!d) return null;
  const s = typeof d === "object" && d.value ? d.value : String(d);
  const m = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (m) return new Date(parseInt(m[1]), parseInt(m[2])-1, parseInt(m[3]));
  const dt = new Date(s);
  return isNaN(dt) ? null : dt;
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
const INITIAL_NOTIFS = [];

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
    "users":<><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></>,
    "layout-grid":<><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></>,
    "list":<><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></>,
    "columns":<><path d="M12 3v18"/><rect x="3" y="3" width="18" height="18" rx="2"/></>,
    "trash":<><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a2 2 0 012-2h2a2 2 0 012 2v2"/></>,
    "shield":<><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></>,
    "user-plus":<><path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/></>,
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
    "folder":<path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/>,
    "edit":<><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z"/></>,
  };
  return <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{flexShrink:0,...st}} {...r}>{p[n]}</svg>;
};

function getTaskStatus(t) {
  const s = (t.status || "").toLowerCase();
  if (s === "entregue" || s === "completed") return "Concluída";
  if (s === "iniciada" || s === "in_progress") return "Iniciado";
  return new Date() > new Date(t.deadline) ? "Atrasada" : "Dentro do SLA";
}
// Helpers de status: aceitam tanto vocabulário pt-BR (backend atual) quanto en (legacy)
const isTaskCompleted  = t => { const s=(t?.status||"").toLowerCase(); return s==="entregue" || s==="completed"; };
const isTaskInProgress = t => { const s=(t?.status||"").toLowerCase(); return s==="iniciada" || s==="in_progress"; };
const isTaskOpen       = t => !isTaskCompleted(t) && !isTaskInProgress(t);

// ─── CSS ─────────────────────────────────────────────────────────────────────
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Urbanist:ital,wght@0,300..900;1,300..900&display=swap');
:root{--navy:#1C262F;--teal:#3397B9;--teal-l:#4ab3d6;--teal-dim:rgba(51,151,185,0.12);--yellow:#EDD900;--yellow-dim:rgba(237,217,0,0.10);--bg1:#F4F6F8;--bg2:#FFFFFF;--bg3:#EEF1F4;--bg-card:#FFFFFF;--bg-sidebar:#1C262F;--bg-input:#FFFFFF;--t1:#1C262F;--t2:#4A6070;--t3:#8DA0AE;--bdr:#DDE3E8;--bdr-focus:#3397B9;--bdr-card:#E8ECF0;--sh-sm:0 1px 3px rgba(28,38,47,0.06);--sh-md:0 4px 12px rgba(28,38,47,0.08);--sh-lg:0 8px 24px rgba(28,38,47,0.10);--green:#22C55E;--green-bg:rgba(34,197,94,0.10);--red:#EF4444;--red-bg:rgba(239,68,68,0.10);--yellow-s:#F59E0B;--yellow-s-bg:rgba(245,158,11,0.10);--r:10px;--ff:'Urbanist',sans-serif;--fd:'Urbanist',sans-serif;--tr:0.18s ease}
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

/* ════════════════════════════════════════════════════════════════
   MOBILE FOUNDATION — Phase 1
   Tudo dentro de @media (max-width:768px) — zero efeito em desktop
   ════════════════════════════════════════════════════════════════ */
@media(max-width:768px){
  /* Previne zoom no iOS quando o usuário toca em inputs (precisa ser >=16px) */
  .fi,.fs,.ft,input[type="text"],input[type="email"],input[type="number"],input[type="date"],input[type="search"],input[type="tel"],input[type="password"],textarea,select{font-size:16px !important}

  /* Topbar com padding reduzido */
  .tb{padding:0 14px;height:52px}

  /* Modais fullscreen em mobile, sem padding ao redor, sem border-radius */
  .mo{padding:0;align-items:stretch;justify-content:stretch}
  .ml,.ml-lg{max-width:100% !important;width:100% !important;max-height:100vh !important;height:100vh;border-radius:0 !important;display:flex;flex-direction:column}
  .mh{padding:16px 18px 0;position:sticky;top:0;background:var(--bg-card);z-index:5;flex-shrink:0}
  .mt{font-size:16px}
  .mb{padding:14px 18px 24px;gap:14px;flex:1;overflow-y:auto;-webkit-overflow-scrolling:touch}

  /* Botões com tap target mínimo de 44px (recomendação Apple/Google) */
  .btn{padding:10px 16px;min-height:40px;font-size:13px}
  .btn.bg{padding:8px 10px;min-height:36px}

  /* Card padding mais compacto */
  .card{border-radius:12px}

  /* Disclaimer mais legível */
  .disc{font-size:12px;padding:10px 12px}

  /* Tabelas — adicionar scroll horizontal quando precisar */
  .dt-wrap{overflow-x:auto;-webkit-overflow-scrolling:touch;margin:0 -16px;padding:0 16px}

  /* Notif panel — quase full width em mobile, ancorado ao topo */
  .notif-panel{width:calc(100vw - 24px);right:-8px;max-width:360px}

  /* Toast — bottom centralizado */
  .toast-c{bottom:16px;right:16px;left:16px;align-items:stretch}
  .toast{min-width:0;width:100%}

  /* Sidebar drawer — adiciona um respiro melhor no top */
  .sb{padding-top:env(safe-area-inset-top, 0px)}

  /* Page padding lateral reduzido (já estava 16, vou um pouco menor pra ter mais espaço) */
  .pg{padding:14px 12px}

  /* Garante que nada cause horizontal scroll na página */
  body,html,#root{overflow-x:hidden;max-width:100vw}

  /* Inputs cheios — em mobile sempre 100% width */
  .fi,.fs,.ft{width:100%}

  /* Selects/buttons que tinham largura fixa por inline style — força quebra */
  input[type="date"]{width:100% !important;max-width:100%}

  /* Headings dos modais — quebra de linha melhor */
  .mt{line-height:1.3;word-break:break-word}

  /* Accordion mais espaçoso */
  .acc-h{padding:12px 14px}

  /* Tap target maior pra chips */
  .chip{min-height:32px;padding:6px 12px}

  /* Sidebar — itens da nav um pouco maiores */
  .ni{padding:12px 14px;font-size:14px}
}

/* ════════════════════════════════════════════════════════════════
   MOBILE PHASE 2 — Read screens (Task Center, Checklist Center)
   Tudo dentro de @media (max-width:768px)
   ════════════════════════════════════════════════════════════════ */
@media(max-width:768px){
  /* ── TASK CENTER ──────────────────────────────────────────── */

  /* Utility: força grid 1 coluna em mobile (aplicado via className="mob-stack-1") */
  .mob-stack-1{
    grid-template-columns:1fr !important;
    min-width:0;
  }
  /* TaskCard fix: quebra texto longo (URLs, palavras sem espaço) que estavam
     forçando o card a exceder a largura da tela */
  .mob-stack-1 > .card{
    min-width:0;
    max-width:100%;
    overflow:hidden;
    word-wrap:break-word;
    overflow-wrap:break-word;
  }
  .mob-stack-1 > .card *{
    min-width:0;
    max-width:100%;
    overflow-wrap:break-word;
    word-break:break-word;
  }
  /* Briefing do TaskCard usa -webkit-box pra clamp em 3 linhas — preserva,
     mas garante que dentro da box o texto quebra */
  .mob-stack-1 > .card div[style*="-webkit-box"]{
    word-break:break-word !important;
    overflow-wrap:break-word !important;
  }

  /* Inputs e selects da barra de filtros — sempre 100% em mobile (sobreescreve width inline) */
  .card select.fs,
  .card input.fi{
    width:100% !important;
    max-width:100% !important;
    min-width:0;
  }

  /* ── CHECKLIST CENTER — TABELA RESPONSIVA ───────────────────── */
  /* Estratégia: tabela vira lista de cards. Usa atributo data-cell-label que
     o JSX vai adicionar em cada <td>. Em mobile, mostra label antes do valor. */
  table.cl-table thead{display:none}
  table.cl-table,table.cl-table tbody,table.cl-table tr,table.cl-table td{display:block;width:100%}
  table.cl-table tr{
    background:var(--bg-card);
    border:1px solid var(--bdr-card);
    border-radius:12px;
    margin:0 0 10px;
    padding:14px 14px 12px;
    box-shadow:var(--sh-sm);
    position:relative;
    cursor:pointer;
  }
  table.cl-table tr:hover{background:var(--bg-card) !important}
  table.cl-table td{
    border:none !important;
    padding:6px 0 !important;
    text-align:left !important;
    display:flex !important;
    align-items:center;
    justify-content:space-between;
    gap:12px;
    min-height:auto;
    white-space:normal !important;
  }
  /* Cabeçalho do card (primeira td: Cliente) — quebra linha visual */
  table.cl-table td[data-cell-label="cliente"]{
    border-bottom:1px solid var(--bdr-card) !important;
    padding-bottom:10px !important;
    margin-bottom:4px;
    display:block !important;
    padding-right:36px !important;
  }
  /* Label antes do valor — adicionado via data-cell-label */
  table.cl-table td[data-cell-label]:not([data-cell-label="cliente"]):not([data-cell-label="actions"])::before{
    content:attr(data-cell-label);
    font-size:10px;
    font-weight:700;
    color:var(--t3);
    text-transform:uppercase;
    letter-spacing:.06em;
    flex-shrink:0;
  }
  /* Valor à direita pode quebrar */
  table.cl-table td[data-cell-label] > div{
    overflow:visible !important;
    text-overflow:unset !important;
    white-space:normal !important;
    max-width:none !important;
    text-align:right;
  }
  /* Produtos: chips quebram em várias linhas, alinhados à direita */
  table.cl-table td[data-cell-label="produtos"]{align-items:flex-start}
  table.cl-table td[data-cell-label="produtos"] > div{justify-content:flex-end;display:flex !important;flex-wrap:wrap;gap:4px}
  /* Botão excluir — canto sup direito */
  table.cl-table td[data-cell-label="actions"]{
    position:absolute;
    top:10px;
    right:10px;
    padding:0 !important;
    width:auto !important;
    display:block !important;
  }

  /* Header do accordion mês — flexível */
  .acc-h{padding:14px 16px;flex-wrap:wrap;gap:10px}
}

/* ════════════════════════════════════════════════════════════════
   MOBILE PHASE 3 — Forms & Modals (create/edit)
   Tudo dentro de @media (max-width:768px) — zero efeito desktop
   ════════════════════════════════════════════════════════════════ */
@media(max-width:768px){

  /* ── CHIPS NOS FORMS (Features, Estados, etc) ─────────────── */
  /* Tap targets maiores pra clicar mais fácil */
  .chip{min-height:34px;padding:7px 14px;font-size:12px}

  /* ── FORM ERGONOMICS DENTRO DE MODAIS ─────────────────────── */
  .mb{gap:14px}
  .fl{font-size:11px}
  .ft{min-height:80px}

  /* Disclaimer mais compacto */
  .disc{font-size:11px;padding:8px 10px}

  /* Inputs e textareas — quebram URLs e textos longos */
  .ml input,.ml textarea,.fi,.ft{word-break:break-word;overflow-wrap:break-word}

  /* Modal title — quebra linha sem overflow */
  .mt{word-break:break-word;line-height:1.3;font-size:16px}

  /* Botão de fechar do header — tap target maior */
  .mh button.bg{min-width:40px;min-height:40px;padding:8px}

  /* Sec card padding menor em mobile */
  .page-enter > .card{padding:14px}

  /* ── STICKY FOOTERS ────────────────────────────────────────── */
  /* Classe aplicada via className no JSX em modais de criação/edição.
     Funciona em 2 contextos: dentro de .mb (NewTaskModal) ou fora de .mb (TaskDetailModal).
     Em desktop não tem efeito (regra dentro de media query mobile). */
  .mb > .modal-sticky-footer{
    position:sticky !important;
    bottom:0 !important;
    background:var(--bg-card) !important;
    margin:14px -18px -24px !important;
    padding:14px 18px !important;
    border-top:1px solid var(--bdr) !important;
    box-shadow:0 -2px 8px rgba(0,0,0,0.08) !important;
    z-index:10;
  }
  /* Quando .modal-sticky-footer é filho direto de .ml (não dentro de .mb) — TaskDetailModal */
  .ml > .modal-sticky-footer{
    position:sticky !important;
    bottom:0 !important;
    z-index:10;
    box-shadow:0 -2px 8px rgba(0,0,0,0.08);
  }
  .modal-sticky-footer > button{
    flex:1;
    min-height:44px;
    font-size:14px;
    padding:12px 16px;
  }

  /* Page-level sticky footer (Novo Checklist - Enviar Checklist) */
  .page-sticky-footer{
    position:sticky !important;
    bottom:0;
    z-index:20;
    margin-left:-12px;
    margin-right:-12px;
    border-radius:0 !important;
    border-left:none !important;
    border-right:none !important;
    border-bottom:none !important;
    box-shadow:0 -4px 12px rgba(0,0,0,0.08);
  }

  /* Input date — altura confortável */
  input[type="date"]{min-height:44px}
}

/* ════════════════════════════════════════════════════════════════
   MOBILE PHASE 4 — Polish (Admin, Task List view)
   Generaliza o tratamento responsivo de tabela → cards
   ════════════════════════════════════════════════════════════════ */
@media(max-width:768px){
  /* Aplica o mesmo tratamento já provado (Fase 2) nas tabelas-lista */
  table.task-table,table.admin-table{
    min-width:0 !important;
  }
  table.task-table thead,table.admin-table thead{display:none}
  table.task-table,table.task-table tbody,table.task-table tr,table.task-table td,
  table.admin-table,table.admin-table tbody,table.admin-table tr,table.admin-table td{
    display:block;width:100%
  }
  table.task-table tr,table.admin-table tr{
    background:var(--bg-card);
    border:1px solid var(--bdr-card);
    border-radius:12px;
    margin:0 12px 10px;
    padding:14px 14px 12px;
    box-shadow:var(--sh-sm);
    position:relative;
    cursor:pointer;
  }
  table.task-table tr:hover,table.admin-table tr:hover{background:var(--bg-card) !important}
  table.task-table td,table.admin-table td{
    border:none !important;
    padding:6px 0 !important;
    text-align:left !important;
    display:flex !important;
    align-items:center;
    justify-content:space-between;
    gap:12px;
    min-height:auto;
    white-space:normal !important;
    max-width:none !important;
  }

  /* Cabeçalho do card (primeira td: Cliente/Usuário) — quebra linha visual */
  table.task-table td[data-cell-label="cliente"],
  table.admin-table td[data-cell-label="usuário"]{
    border-bottom:1px solid var(--bdr-card) !important;
    padding-bottom:10px !important;
    margin-bottom:4px;
    display:block !important;
    padding-right:36px !important;
  }

  /* Label antes do valor (data-cell-label) — exceto cliente/usuário e actions */
  table.task-table td[data-cell-label]:not([data-cell-label="cliente"]):not([data-cell-label="actions"])::before,
  table.admin-table td[data-cell-label]:not([data-cell-label="usuário"]):not([data-cell-label="actions"])::before{
    content:attr(data-cell-label);
    font-size:10px;
    font-weight:700;
    color:var(--t3);
    text-transform:uppercase;
    letter-spacing:.06em;
    flex-shrink:0;
  }

  /* Valor alinhado à direita pode quebrar */
  table.task-table td > *,
  table.admin-table td > *{
    text-align:right;
    overflow:visible;
    text-overflow:unset;
    white-space:normal;
    max-width:100%;
    word-break:break-word;
  }

  /* AdminPanel: select de role precisa ficar largo e bonito */
  table.admin-table td[data-cell-label="função"] select{
    min-width:140px !important;
    flex:1;
    text-align:left;
  }

  /* TaskListView: botões de ação (última td) — full width sticky bottom */
  table.task-table td[data-cell-label="actions"],
  table.admin-table td[data-cell-label="actions"]{
    border-top:1px solid var(--bdr-card);
    margin-top:8px;
    padding-top:10px !important;
    justify-content:flex-end;
    flex-wrap:wrap;
    gap:6px;
  }
  /* AdminPanel actions: botão de remover discreto, vai pro canto sup direito */
  table.admin-table td[data-cell-label="actions"]{
    position:absolute;
    top:10px;
    right:10px;
    padding:0 !important;
    margin:0;
    border-top:none;
    width:auto !important;
    display:block !important;
  }

}

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
  const team = useTeam();
  const myRole = teamRoleOf(team.members, user?.email);
  const initialScope = (myRole === 'cs' || myRole === 'sales' || myRole === 'cp') ? 'mine' : 'all';
  const [scope,setScope] = useState(initialScope);
  const now = new Date();
  const [dateFilter,setDateFilter]=useState("all");
  const [customFrom,setCustomFrom]=useState("");
  const [customTo,setCustomTo]=useState("");

  useEffect(()=>{
    if (!team.members.length || !user?.email) return;
    const r = teamRoleOf(team.members, user.email);
    if (r === 'cs' || r === 'sales' || r === 'cp') setScope('mine');
    else setScope('all');
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[team.members.length, user?.email]);

  // Filtra por scope (mine = só os meus)
  const scopedChecklists = useMemo(()=>{
    if (scope === 'all') return checklists;
    return checklists.filter(c => checklistOwnedBy(c, user?.email));
  },[checklists,scope,user?.email]);
  const scopedTasks = useMemo(()=>{
    if (scope === 'all') return tasks;
    return tasks.filter(t => taskOwnedBy(t, user?.email));
  },[tasks,scope,user?.email]);

  // Date filter presets
  const getDateRange = useCallback(() => {
    const today = new Date(); today.setHours(0,0,0,0);
    const end = new Date(); end.setHours(23,59,59,999);
    switch(dateFilter) {
      case "today": return [today, end];
      case "yesterday": { const y=new Date(today); y.setDate(y.getDate()-1); return [y, new Date(today.getTime()-1)]; }
      case "7d": { const d=new Date(today); d.setDate(d.getDate()-7); return [d, end]; }
      case "30d": { const d=new Date(today); d.setDate(d.getDate()-30); return [d, end]; }
      case "last_month": { const d=new Date(today.getFullYear(),today.getMonth()-1,1); const e=new Date(today.getFullYear(),today.getMonth(),0,23,59,59); return [d,e]; }
      case "prev_quarter": { const q=Math.floor(today.getMonth()/3); const d=new Date(today.getFullYear(),q*3-3,1); const e=new Date(today.getFullYear(),q*3,0,23,59,59); return [d,e]; }
      case "custom": { return [customFrom?new Date(customFrom):new Date("2020-01-01"), customTo?new Date(customTo+"T23:59:59"):end]; }
      default: return [null, null];
    }
  }, [dateFilter, customFrom, customTo]);

  // Filtered checklists by date range
  const filteredChecklists = useMemo(() => {
    const [from, to] = getDateRange();
    if (!from) return scopedChecklists;
    return scopedChecklists.filter(c => {
      const d = parseLocalDate(c.start_date);
      if (!d) return false;
      return d >= from && d <= to;
    });
  }, [scopedChecklists, getDateRange]);

  const filteredTasks = useMemo(() => {
    const [from, to] = getDateRange();
    if (!from) return scopedTasks;
    return scopedTasks.filter(t => {
      const d = new Date(t.createdAt || t.created_at?.value || t.created_at);
      return d >= from && d <= to;
    });
  }, [tasks, getDateRange]);

  // Active campaigns = checklists where today is between start_date and end_date
  const active = useMemo(() => {
    return filteredChecklists.filter(c => {
      const s = parseLocalDate(c.start_date);
      const e = parseLocalDate(c.end_date);
      if (!s || !e) return false;
      return now >= s && now <= e;
    });
  }, [filteredChecklists]);

  const totalInvestment = filteredChecklists.reduce((s,c) => s + (parseFloat(c.investment)||0), 0);
  const openTasks = filteredTasks.filter(t => getTaskStatus(t) !== "Concluída");
  const overdueTasks = filteredTasks.filter(t => getTaskStatus(t) === "Atrasada");

  // Unique active clients (sem duplicar) e tickets médios — sobre as ATIVAS
  const uniqueActiveClients = useMemo(() => {
    const set = new Set();
    active.forEach(c => { if (c.client) set.add(String(c.client).trim()); });
    return set.size;
  }, [active]);

  const activeInvestment = useMemo(() =>
    active.reduce((s,c) => s + (parseFloat(c.investment)||0), 0)
  , [active]);

  const ticketByCampaign = active.length ? activeInvestment / active.length : 0;
  const ticketByClient   = uniqueActiveClients ? activeInvestment / uniqueActiveClients : 0;

  // Agrupamento mensal por start_date — usado no gráfico e na seção mensal abaixo
  const monthlyGroups = useMemo(() => {
    const map = {}; // key: YYYY-MM
    filteredChecklists.forEach(c => {
      const d = parseLocalDate(c.start_date);
      if (!d) return;
      const key = `${d.getFullYear()}-${String(d.getMonth()).padStart(2,"0")}`;
      if (!map[key]) {
        map[key] = {
          key,
          year: d.getFullYear(),
          month: d.getMonth(),
          label: `${MONTHS_PT[d.getMonth()]} ${d.getFullYear()}`,
          shortLabel: MONTHS_PT[d.getMonth()].substring(0,3),
          checklists: [],
        };
      }
      map[key].checklists.push(c);
    });
    const groups = Object.values(map).map(g => {
      const clients = new Set();
      let investment = 0;
      let activeCount = 0;
      g.checklists.forEach(c => {
        if (c.client) clients.add(String(c.client).trim());
        investment += parseFloat(c.investment)||0;
        const s = parseLocalDate(c.start_date);
        const e = parseLocalDate(c.end_date);
        if (s && e && now >= s && now <= e) activeCount++;
      });
      const campaigns = g.checklists.length;
      return {
        ...g,
        campaigns,
        activeCount,
        uniqueClients: clients.size,
        investment,
        ticketByCampaign: campaigns ? investment/campaigns : 0,
        ticketByClient: clients.size ? investment/clients.size : 0,
      };
    });
    groups.sort((a,b) => (b.year - a.year) || (b.month - a.month));
    return groups;
  }, [filteredChecklists]);

  // Chart usa ordem cronológica (mais antigo primeiro)
  const monthlyData = useMemo(() =>
    [...monthlyGroups]
      .sort((a,b) => (a.year - b.year) || (a.month - b.month))
      .map(g => ({ name: `${g.shortLabel}/${String(g.year).slice(-2)}`, value: g.investment }))
  , [monthlyGroups]);

  // Task by CS (filtered period)
  const taskByCS = useMemo(() => {
    const m = {};
    filteredTasks.forEach(t => { if(t.cs) m[t.cs] = (m[t.cs]||0) + 1; });
    return Object.entries(m).map(([name,count]) => ({name:name.split(" ")[0],tasks:count})).sort((a,b)=>b.tasks-a.tasks);
  }, [filteredTasks]);

  const FILTER_OPTS=[
    {key:"all",label:"Tudo"},
    {key:"today",label:"Hoje"},
    {key:"yesterday",label:"Ontem"},
    {key:"7d",label:"Últimos 7 dias"},
    {key:"30d",label:"Últimos 30 dias"},
    {key:"last_month",label:"Mês anterior"},
    {key:"prev_quarter",label:"Trimestre anterior"},
    {key:"custom",label:"Personalizado"},
  ];

  return (
    <div className="page-enter">
      {/* Welcome + scope toggle */}
      <div style={{marginBottom:24,display:"flex",justifyContent:"space-between",alignItems:"flex-end",gap:14,flexWrap:"wrap"}}>
        <div>
          <h1 style={{fontFamily:"var(--fd)",fontSize:22,fontWeight:800,color:"var(--t1)",marginBottom:4}}>{new Date().getHours()<12?"Bom dia":new Date().getHours()<18?"Boa tarde":"Boa noite"}, {user?.name?.split(" ")[0]||"!"}</h1>
          <p style={{color:"var(--t2)",fontSize:13}}>{scope==="mine"?"Mostrando apenas as suas campanhas e tasks":"Mostrando dados de toda a equipe"} — {new Date().toLocaleDateString("pt-BR",{weekday:"long",day:"numeric",month:"long"})}</p>
        </div>
        <div style={{display:"flex",gap:0,background:"var(--bg3)",border:"1px solid var(--bdr)",borderRadius:"var(--r)",padding:2}}>
          {[{k:"mine",label:"Meus"},{k:"all",label:"Equipe"}].map(o=>(
            <button key={o.k}
              style={{padding:"6px 16px",border:"none",background:scope===o.k?"var(--bg-card)":"transparent",borderRadius:6,cursor:"pointer",fontSize:12,fontWeight:600,color:scope===o.k?"var(--teal)":"var(--t3)",boxShadow:scope===o.k?"var(--sh-sm)":"none",transition:"all .15s"}}
              onClick={()=>setScope(o.k)}>
              {o.label}
            </button>
          ))}
        </div>
      </div>

      {/* Date filter */}
      <div className="card" style={{padding:"12px 16px",marginBottom:20,display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>
        <I n="calendar" s={14} c="var(--t3)"/>
        <span style={{fontSize:12,color:"var(--t3)",fontWeight:600}}>Período:</span>
        {FILTER_OPTS.map(o=>(
          <button key={o.key} className={`btn ${dateFilter===o.key?"bp":"bs"}`} style={{fontSize:11,padding:"4px 12px"}} onClick={()=>setDateFilter(o.key)}>{o.label}</button>
        ))}
        {dateFilter==="custom"&&(
          <div style={{display:"flex",gap:6,alignItems:"center",marginLeft:4}}>
            <input type="date" className="fi" style={{padding:"4px 8px",fontSize:11,width:130}} value={customFrom} onChange={e=>setCustomFrom(e.target.value)}/>
            <span style={{fontSize:11,color:"var(--t3)"}}>→</span>
            <input type="date" className="fi" style={{padding:"4px 8px",fontSize:11,width:130}} value={customTo} onChange={e=>setCustomTo(e.target.value)}/>
          </div>
        )}
      </div>

      {/* Stat cards */}
      <div className="g3" style={{marginBottom:24,gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))"}}>
        {[
          {label:"Campanhas Ativas",value:active.length,icon:"zap",color:"var(--green)",sub:`de ${filteredChecklists.length} no período`},
          {label:"Clientes Ativos",value:uniqueActiveClients,icon:"users",color:"var(--teal)",sub:"sem duplicar"},
          {label:"Tkt Médio / Anunciante",value:fmtCompact(ticketByClient),icon:"dollar",color:"var(--teal-l)",sub:fmtCurrency(ticketByClient)},
          {label:"Tkt Médio / Campanha",value:fmtCompact(ticketByCampaign),icon:"dollar",color:"var(--teal-l)",sub:fmtCurrency(ticketByCampaign)},
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

      {/* Resumo Mensal — agrupado por data de início da campanha */}
      {monthlyGroups.length>0 && (
        <div className="card" style={{padding:"18px 20px",marginBottom:24}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14,flexWrap:"wrap",gap:8}}>
            <div>
              <div style={{fontSize:13,fontWeight:700,color:"var(--t1)",fontFamily:"var(--fd)"}}>Resumo Mensal</div>
              <div style={{fontSize:11,color:"var(--t3)",marginTop:2}}>Agrupado pela data de início da campanha</div>
            </div>
            <span style={{fontSize:11,color:"var(--t3)"}}>{monthlyGroups.length} {monthlyGroups.length===1?"mês":"meses"}</span>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))",gap:12}}>
            {monthlyGroups.map(g => (
              <div key={g.key} style={{padding:14,background:"var(--bg3)",borderRadius:"var(--r)",border:"1px solid var(--bdr)"}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
                  <span style={{fontSize:13,fontWeight:700,color:"var(--t1)",fontFamily:"var(--fd)",textTransform:"capitalize"}}>{g.label}</span>
                  {g.activeCount>0 && (
                    <span className="badge b-grn" style={{fontSize:10}}>{g.activeCount} ativa{g.activeCount>1?"s":""}</span>
                  )}
                </div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:10}}>
                  <div>
                    <div style={{fontSize:10,color:"var(--t3)",textTransform:"uppercase",fontWeight:700,letterSpacing:".04em"}}>Campanhas</div>
                    <div style={{fontSize:18,fontWeight:800,color:"var(--t1)",fontFamily:"var(--fd)"}}>{g.campaigns}</div>
                  </div>
                  <div>
                    <div style={{fontSize:10,color:"var(--t3)",textTransform:"uppercase",fontWeight:700,letterSpacing:".04em"}}>Clientes</div>
                    <div style={{fontSize:18,fontWeight:800,color:"var(--t1)",fontFamily:"var(--fd)"}}>{g.uniqueClients}</div>
                  </div>
                  <div>
                    <div style={{fontSize:10,color:"var(--t3)",textTransform:"uppercase",fontWeight:700,letterSpacing:".04em"}}>Tkt / Anunciante</div>
                    <div style={{fontSize:13,fontWeight:700,color:"var(--teal)"}}>{fmtCurrency(g.ticketByClient)}</div>
                  </div>
                  <div>
                    <div style={{fontSize:10,color:"var(--t3)",textTransform:"uppercase",fontWeight:700,letterSpacing:".04em"}}>Tkt / Campanha</div>
                    <div style={{fontSize:13,fontWeight:700,color:"var(--teal)"}}>{fmtCurrency(g.ticketByCampaign)}</div>
                  </div>
                </div>
                <div style={{paddingTop:10,borderTop:"1px solid var(--bdr)",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                  <span style={{fontSize:10,color:"var(--t3)",textTransform:"uppercase",fontWeight:700,letterSpacing:".04em"}}>Investimento</span>
                  <span style={{fontSize:14,fontWeight:800,color:"var(--teal)",fontFamily:"var(--fd)"}}>{fmtCurrency(g.investment)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

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
function TaskCenter({tasks,setTasks,onRefetch}) {
  const user = useAuth();
  const team = useTeam();
  const isAdmin = isAdminFromTeam(team.members, user?.email);
  const myRole = teamRoleOf(team.members, user?.email);
  // Default: "mine" pra CP/CS/sales; admin começa com "all"
  const initialScope = (myRole === 'cs' || myRole === 'sales' || myRole === 'cp') ? 'mine' : 'all';
  const [scope,setScope] = useState(initialScope); // "mine" | "all"
  const [showNew,setShowNew]=useState(false);
  const [linkModal,setLinkModal]=useState(null);
  const [selectedTask,setSelectedTask]=useState(null);
  const [search,setSearch]=useState("");
  const [filterStatus,setFilterStatus]=useState("all");
  const [filterCS,setFilterCS]=useState("");
  const [filterCP,setFilterCP]=useState(""); // email do CP (solicitante)
  const [viewMode,setViewMode]=useState(()=>localStorage.getItem("hypr_task_view")||"cards"); // cards | list | kanban
  const [draggingId,setDraggingId]=useState(null);
  const toast = useToast();
  const gfIdx = useRef(0);
  // Lista de CS para o dropdown de edição de task.
  // Fonte primária: o CS_LIST hardcoded (sem Greenfield/SA, que não são CS reais).
  // Email: extraído das próprias tasks (mais confiável) ou montado pelo padrão nome.sobrenome@hypr.mobi
  const csList = useMemo(()=>{
    // Mapa name → email coletado das tasks existentes
    const nameToEmail = new Map();
    tasks.forEach(t=>{
      const n = t.cs;
      const e = t.csEmail || t.cs_email;
      if(n && e && !nameToEmail.has(n)) nameToEmail.set(n, e);
    });
    const slugEmail = name => {
      const slug = name.toLowerCase()
        .normalize("NFD").replace(/[\u0300-\u036f]/g,"") // remove acentos
        .replace(/[^a-z\s]/g,"")
        .trim().split(/\s+/).join(".");
      return `${slug}@hypr.mobi`;
    };
    return CS_LIST
      .filter(n => n !== "Greenfield" && n !== "Solutions Architect")
      .map(name => ({ name, email: nameToEmail.get(name) || slugEmail(name) }));
  },[tasks]);

  useEffect(()=>{ try{localStorage.setItem("hypr_task_view",viewMode)}catch(e){} },[viewMode]);
  // Recalcula scope inicial quando time carrega (evita race)
  useEffect(()=>{
    if (!team.members.length || !user?.email) return;
    const r = teamRoleOf(team.members, user.email);
    if (r === 'cs' || r === 'sales' || r === 'cp') setScope('mine');
    else setScope('all');
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[team.members.length, user?.email]);

  // Lista de Solicitantes (CPs) únicos pra dropdown
  const cpOptions = useMemo(()=>{
    const m = new Map();
    tasks.forEach(t=>{
      const e = t.requesterEmail || t.requester_email;
      const n = t.requestedBy || t.requested_by;
      if (e && n) m.set(e.toLowerCase(), n);
    });
    return [...m.entries()].sort((a,b)=>a[1].localeCompare(b[1]));
  },[tasks]);

  const filtered = useMemo(()=>{
    return tasks.filter(t=>{
      // Scope "minhas": eu sou CS responsável OU solicitante
      if (scope === 'mine' && !taskOwnedBy(t, user?.email)) return false;
      const q=search.toLowerCase();
      const mQ=!q||t.client.toLowerCase().includes(q)||t.type.toLowerCase().includes(q)||t.cs.toLowerCase().includes(q);
      const mCS=!filterCS||t.cs===filterCS;
      const mCP=!filterCP||((t.requesterEmail||t.requester_email||'').toLowerCase()===filterCP.toLowerCase());
      const st=getTaskStatus(t);
      // No kanban, ignoramos o filtro de status (todas as colunas devem aparecer)
      if(viewMode==="kanban") return mQ && mCS && mCP;
      const mSt=filterStatus==="all"
        ||(filterStatus==="aberta"&&(st==="Dentro do SLA"||st==="Atrasada"))
        ||(filterStatus==="iniciada"&&st==="Iniciado")
        ||(filterStatus==="atrasada"&&st==="Atrasada")
        ||(filterStatus==="entregue"&&st==="Concluída");
      return mQ&&mCS&&mCP&&mSt;
    });
  },[tasks,scope,user?.email,search,filterStatus,filterCS,filterCP,viewMode]);

  // Contagens reagem ao scope tb
  const tasksScoped = useMemo(()=>{
    if (scope === 'all') return tasks;
    return tasks.filter(t => taskOwnedBy(t, user?.email));
  },[tasks,scope,user?.email]);

  const counts=useMemo(()=>({
    all:tasksScoped.length,
    aberta:tasksScoped.filter(t=>{const s=getTaskStatus(t);return s==="Dentro do SLA"||s==="Atrasada"}).length,
    iniciada:tasksScoped.filter(t=>getTaskStatus(t)==="Iniciado").length,
    atrasada:tasksScoped.filter(t=>getTaskStatus(t)==="Atrasada").length,
    entregue:tasksScoped.filter(t=>getTaskStatus(t)==="Concluída").length,
  }),[tasksScoped]);

  // Buckets do kanban — usam a lista FILTRADA
  const kanbanBuckets = useMemo(()=>{
    const open=[], inProgress=[], done=[];
    filtered.forEach(t=>{
      const st=getTaskStatus(t);
      if(st==="Concluída") done.push(t);
      else if(st==="Iniciado") inProgress.push(t);
      else open.push(t); // "Dentro do SLA" e "Atrasada" caem em Aberta
    });
    // ordem: atrasadas primeiro dentro de "Aberta", depois por deadline
    open.sort((a,b)=>new Date(a.deadline)-new Date(b.deadline));
    inProgress.sort((a,b)=>new Date(a.deadline)-new Date(b.deadline));
    done.sort((a,b)=>new Date(b.createdAt||0)-new Date(a.createdAt||0));
    return {open,inProgress,done};
  },[filtered]);

  const handleSubmit=async(data)=>{
    const newTask={...data,id:Date.now(),requestedBy:data.requestedBy||"Você"};
    setTasks(t=>[newTask,...t]);
    setShowNew(false);
    toast("Task criada com sucesso!");
    try{
      await fetch(`${BACKEND_URL}/tasks`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(data)});
    }catch(err){console.error("Backend task POST error:",err)}
  };
  // Mudança de status genérica: "aberta" | "iniciada" | "entregue"
  // Backend valida permissão: só o CS responsável pode mudar status.
  const handleStatusChange=async(id,newStatus)=>{
    const task=tasks.find(t=>t.id===id);
    if(!task) return;
    if((task.status||"").toLowerCase()===newStatus) return;
    const previousStatus = task.status;
    setTasks(ts=>ts.map(t=>t.id===id?{...t,status:newStatus}:t));
    const labels={aberta:"Task reaberta",iniciada:"Task iniciada",entregue:"Task concluída!"};
    toast(labels[newStatus]||"Status atualizado!");
    try{
      const res = await fetch(`${BACKEND_URL}/tasks/${id}`,{
        method:"PUT",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({
          status:newStatus,
          task:{...task,status:newStatus},
          changedBy: user?.name,
          changedByEmail: user?.email,
        })
      });
      if(!res.ok){
        // Reverte e exibe motivo (ex: 403 quando não é o CS responsável)
        let serverMsg = `Erro ${res.status}`;
        try { const body = await res.json(); if(body?.error) serverMsg = body.error; } catch(_){}
        setTasks(ts=>ts.map(t=>t.id===id?{...t,status:previousStatus}:t));
        toast(serverMsg);
        console.error("Backend task PUT failed:",res.status,serverMsg);
      } else if(onRefetch){
        // Refetch para garantir que estamos sincronizados com o BQ
        setTimeout(onRefetch, 500);
      }
    }catch(err){
      setTasks(ts=>ts.map(t=>t.id===id?{...t,status:previousStatus}:t));
      toast("Erro ao salvar — alteração revertida");
      console.error("Backend task PUT error:",err);
    }
  };
  const handleStart   =(id)=>handleStatusChange(id,"iniciada");
  const handleComplete=(id)=>handleStatusChange(id,"entregue");
  const handleReopen  =(id)=>handleStatusChange(id,"aberta");

  const handleSaveLink=async(link)=>{
    const id=linkModal.id;
    setTasks(ts=>ts.map(t=>t.id===id?{...t,docLink:link}:t));
    setLinkModal(null);
    toast("Link salvo!");
    try{
      await fetch(`${BACKEND_URL}/tasks/${id}`,{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify({doc_link:link})});
    }catch(err){console.error("Backend link PUT error:",err)}
  };

  // Edição completa de uma task (briefing, prazo, investimento, CS, produtos, features).
  // Permitido para admin, o CS responsável ou o solicitante (CP que abriu).
  const canEditTask=(task)=>{
    if(!task||!user?.email) return false;
    if(isAdmin) return true;
    const me=user.email.toLowerCase();
    if((task.csEmail||"").toLowerCase()===me) return true;
    if((task.requesterEmail||"").toLowerCase()===me) return true;
    return false;
  };
  const handleEditTask=async(updated)=>{
    const id=updated.id;
    const previous=tasks.find(t=>t.id===id);
    setTasks(ts=>ts.map(t=>t.id===id?{...t,...updated}:t));
    setSelectedTask(s=>s&&s.id===id?{...s,...updated}:s);
    // Payload com chaves nos dois formatos para o backend (cobre snake_case e camelCase)
    const merged={...previous,...updated};
    const payload={
      task:merged,
      // Campos individuais explícitos para o backend persistir
      cs: merged.cs,
      csEmail: merged.csEmail,
      cs_email: merged.csEmail,
      cs_name: merged.cs,
      briefing: merged.briefing,
      deadline: merged.deadline,
      budget: merged.budget,
      products: merged.products,
      features: merged.features,
      editedBy: user?.name,
      editedByEmail: user?.email,
    };
    console.log("[handleEditTask] PUT payload:",payload);
    toast("Task atualizada!");
    try{
      const res = await fetch(`${BACKEND_URL}/tasks/${id}`,{
        method:"PUT",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify(payload)
      });
      console.log("[handleEditTask] response status:",res.status);
      if(!res.ok){
        let msg=`Erro ${res.status}`;
        try{ const body=await res.json(); console.error("[handleEditTask] error body:",body); if(body?.error) msg=body.error; }catch(_){}
        if(previous) setTasks(ts=>ts.map(t=>t.id===id?previous:t));
        if(previous) setSelectedTask(s=>s&&s.id===id?previous:s);
        toast(msg);
        console.error("Backend task edit PUT failed:",res.status,msg);
      } else if(onRefetch){
        setTimeout(onRefetch,500);
      }
    }catch(err){
      if(previous) setTasks(ts=>ts.map(t=>t.id===id?previous:t));
      if(previous) setSelectedTask(s=>s&&s.id===id?previous:s);
      toast("Erro ao salvar — alteração revertida");
      console.error("Backend task edit PUT error:",err);
    }
  };

  // Drag & drop handlers para o kanban
  const onDragStart=(e,id)=>{ setDraggingId(id); try{e.dataTransfer.effectAllowed="move"}catch(_){} };
  const onDragOver=(e)=>{ e.preventDefault(); try{e.dataTransfer.dropEffect="move"}catch(_){} };
  const onDropCol=(e,colStatus)=>{
    e.preventDefault();
    if(draggingId!=null){ handleStatusChange(draggingId,colStatus); }
    setDraggingId(null);
  };

  const tabs=[
    {key:"all",label:"Todas",count:counts.all},
    {key:"aberta",label:"Aberta",count:counts.aberta},
    {key:"iniciada",label:"Iniciado",count:counts.iniciada},
    {key:"atrasada",label:"Atrasadas",count:counts.atrasada},
    {key:"entregue",label:"Concluídas",count:counts.entregue},
  ];

  const VIEW_MODES=[
    {key:"cards",icon:"layout-grid",label:"Cards"},
    {key:"list",icon:"list",label:"Lista"},
    {key:"kanban",icon:"columns",label:"Kanban"},
  ];

  return (
    <div className="page-enter">
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:24,flexWrap:"wrap",gap:12}}>
        <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
          {tabs.map(t=>(
            <button key={t.key} className={`btn ${filterStatus===t.key?"bp":"bs"}`} style={{fontSize:12,padding:"6px 14px",gap:6,opacity:viewMode==="kanban"?.5:1}} disabled={viewMode==="kanban"} onClick={()=>setFilterStatus(t.key)}>
              {t.label}<span style={{background:filterStatus===t.key?"rgba(255,255,255,0.25)":"var(--bg3)",borderRadius:99,padding:"1px 7px",fontSize:11,fontWeight:700}}>{t.count}</span>
            </button>
          ))}
        </div>
        <div style={{display:"flex",gap:8,alignItems:"center"}}>
          {/* View mode toggle */}
          <div style={{display:"flex",gap:0,background:"var(--bg3)",border:"1px solid var(--bdr)",borderRadius:"var(--r)",padding:2}}>
            {VIEW_MODES.map(v=>(
              <button key={v.key} title={v.label}
                style={{display:"flex",alignItems:"center",gap:6,padding:"6px 12px",border:"none",background:viewMode===v.key?"var(--bg-card)":"transparent",borderRadius:6,cursor:"pointer",fontSize:11,fontWeight:600,color:viewMode===v.key?"var(--teal)":"var(--t3)",boxShadow:viewMode===v.key?"var(--sh-sm)":"none",transition:"all .15s"}}
                onClick={()=>setViewMode(v.key)}>
                <I n={v.icon} s={13}/>{v.label}
              </button>
            ))}
          </div>
          <button className="btn bp" onClick={()=>setShowNew(true)}><I n="plus" s={14} /> Nova Task</button>
        </div>
      </div>

      <div className="card" style={{padding:"12px 16px",marginBottom:20}}>
        <div style={{display:"flex",alignItems:"center",gap:12,flexWrap:"wrap"}}>
          {/* Toggle Minhas / Todas */}
          <div style={{display:"flex",gap:0,background:"var(--bg3)",border:"1px solid var(--bdr)",borderRadius:"var(--r)",padding:2}}>
            {[{k:"mine",label:"Minhas"},{k:"all",label:"Todas"}].map(o=>(
              <button key={o.k}
                style={{padding:"6px 14px",border:"none",background:scope===o.k?"var(--bg-card)":"transparent",borderRadius:6,cursor:"pointer",fontSize:11,fontWeight:600,color:scope===o.k?"var(--teal)":"var(--t3)",boxShadow:scope===o.k?"var(--sh-sm)":"none",transition:"all .15s"}}
                onClick={()=>setScope(o.k)}>
                {o.label}
              </button>
            ))}
          </div>
          <div style={{position:"relative",flex:1,minWidth:180,maxWidth:280}}>
            <I n="search" s={13} style={{position:"absolute",left:10,top:"50%",transform:"translateY(-50%)"}} c="var(--t3)" />
            <input className="fi" style={{paddingLeft:32}} placeholder="Buscar..." value={search} onChange={e=>setSearch(e.target.value)} />
          </div>
          <select className="fs" style={{width:180}} value={filterCS} onChange={e=>setFilterCS(e.target.value)}>
            <option value="">Todos os CS</option>
            {CS_LIST.filter(c=>c!=="Greenfield").map(cs=><option key={cs}>{cs}</option>)}
          </select>
          <select className="fs" style={{width:200}} value={filterCP} onChange={e=>setFilterCP(e.target.value)}>
            <option value="">Todos os Solicitantes</option>
            {cpOptions.map(([email,name])=><option key={email} value={email}>{shortName(name)}</option>)}
          </select>
        </div>
      </div>

      {filtered.length===0?(
        <div className="card"><div className="empty"><I n="check-circle" s={40} c="var(--t3)" /><h3 style={{fontFamily:"var(--fd)",fontSize:15,color:"var(--t2)"}}>Nenhuma task encontrada</h3></div></div>
      ):viewMode==="cards"?(
        <div className="mob-stack-1" style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(360px,1fr))",gap:16}}>
          {filtered.map(t=><TaskCard key={t.id} task={t} onStart={handleStart} onComplete={handleComplete} onReopen={handleReopen} onAddLink={setLinkModal} onOpen={setSelectedTask} />)}
        </div>
      ):viewMode==="list"?(
        <TaskListView tasks={filtered} onStart={handleStart} onComplete={handleComplete} onReopen={handleReopen} onAddLink={setLinkModal} onOpen={setSelectedTask}/>
      ):(
        /* KANBAN */
        <div className="mob-stack-1" style={{display:"grid",gridTemplateColumns:"repeat(3,minmax(0,1fr))",gap:16,alignItems:"flex-start"}}>
          {[
            {key:"open",       status:"aberta",       title:"Aberta",    color:"var(--yellow-s)",bg:"var(--yellow-s-bg)",  items:kanbanBuckets.open       },
            {key:"in_progress",status:"iniciada",     title:"Iniciado",  color:"var(--teal)",    bg:"var(--teal-dim)",     items:kanbanBuckets.inProgress },
            {key:"done",       status:"entregue",     title:"Concluído", color:"var(--green)",   bg:"var(--green-bg)",     items:kanbanBuckets.done       },
          ].map(col=>(
            <div key={col.key}
              onDragOver={onDragOver}
              onDrop={(e)=>onDropCol(e,col.status)}
              style={{background:"var(--bg3)",borderRadius:"var(--r)",border:"1px solid var(--bdr)",padding:12,minHeight:300,display:"flex",flexDirection:"column",gap:10}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",paddingBottom:10,borderBottom:`2px solid ${col.color}`}}>
                <div style={{display:"flex",alignItems:"center",gap:8}}>
                  <span style={{width:10,height:10,borderRadius:"50%",background:col.color}}/>
                  <span style={{fontSize:13,fontWeight:800,fontFamily:"var(--fd)",color:"var(--t1)"}}>{col.title}</span>
                </div>
                <span style={{background:col.bg,color:col.color,fontSize:11,fontWeight:700,padding:"2px 9px",borderRadius:99}}>{col.items.length}</span>
              </div>
              {col.items.length===0&&(
                <div style={{padding:"20px 8px",textAlign:"center",fontSize:11,color:"var(--t3)"}}>Solte tasks aqui</div>
              )}
              {col.items.map(t=>(
                <KanbanCard key={t.id} task={t} draggable
                  onDragStart={(e)=>onDragStart(e,t.id)}
                  onStart={handleStart} onComplete={handleComplete} onReopen={handleReopen}
                  onAddLink={setLinkModal} onOpen={setSelectedTask}/>
              ))}
            </div>
          ))}
        </div>
      )}

      {showNew && <NewTaskModal onClose={()=>setShowNew(false)} onSubmit={handleSubmit} gfIdx={gfIdx} />}
      {linkModal && <DocLinkModal task={linkModal} onClose={()=>setLinkModal(null)} onSave={handleSaveLink} />}
      {selectedTask && <TaskDetailModal task={selectedTask} onClose={()=>setSelectedTask(null)} onStart={handleStart} onComplete={handleComplete} onReopen={handleReopen} onAddLink={(t)=>{setSelectedTask(null);setLinkModal(t)}} canEdit={canEditTask(selectedTask)} onSaveEdit={handleEditTask} csList={csList}/>}
    </div>
  );
}

// ──────────── Visão de Lista (tabela) ────────────
function TaskListView({tasks,onStart,onComplete,onReopen,onAddLink,onOpen}){
  return (
    <div className="card" style={{padding:0,overflow:"hidden"}}>
      <div style={{overflowX:"auto"}}>
        <table className="task-table" style={{width:"100%",borderCollapse:"collapse",fontSize:13}}>
          <thead>
            <tr style={{borderBottom:"1px solid var(--bdr)",background:"var(--bg3)"}}>
              {["Cliente","Tipo","CS","Solicitante","Prazo","Status","Doc","Ação"].map(h=>(
                <th key={h} style={{textAlign:h==="Ação"||h==="Status"||h==="Doc"?"center":"left",padding:"10px 14px",fontSize:10,fontWeight:700,color:"var(--t3)",textTransform:"uppercase",letterSpacing:".06em"}}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {tasks.map(t=>{
              const st=getTaskStatus(t);
              const stBg = st==="Concluída"?"var(--teal-dim)":st==="Iniciado"?"var(--teal-dim)":st==="Atrasada"?"var(--red-bg)":"var(--green-bg)";
              const stColor = st==="Concluída"?"var(--teal-l)":st==="Iniciado"?"var(--teal)":st==="Atrasada"?"var(--red)":"var(--green)";
              return (
                <tr key={t.id}
                  style={{borderBottom:"1px solid var(--bdr-card)",cursor:onOpen?"pointer":"default",transition:"background .15s"}}
                  onClick={()=>onOpen&&onOpen(t)}
                  onMouseEnter={e=>{if(onOpen)e.currentTarget.style.background="var(--bg3)"}}
                  onMouseLeave={e=>{e.currentTarget.style.background="transparent"}}>
                  <td data-cell-label="cliente" style={{padding:"12px 14px"}}>
                    <div style={{fontSize:13,fontWeight:700,color:"var(--t1)"}}>{t.client}</div>
                    {t.budget>0&&<div style={{fontSize:11,color:"var(--t3)",marginTop:1}}>R$ {Number(t.budget).toLocaleString("pt-BR")}</div>}
                  </td>
                  <td data-cell-label="tipo" style={{padding:"12px 14px",fontSize:12,color:"var(--t2)"}}>{t.type}</td>
                  <td data-cell-label="cs" style={{padding:"12px 14px",fontSize:12,color:"var(--t2)",whiteSpace:"nowrap"}}>{shortName(t.cs)}</td>
                  <td data-cell-label="solicitante" style={{padding:"12px 14px",fontSize:12,color:"var(--t2)",whiteSpace:"nowrap"}}>{shortName(t.requestedBy)}</td>
                  <td data-cell-label="prazo" style={{padding:"12px 14px",fontSize:12,color:st==="Atrasada"?"var(--red)":"var(--t2)",whiteSpace:"nowrap"}}>{fmtDate(t.deadline)}</td>
                  <td data-cell-label="status" style={{padding:"12px 14px",textAlign:"center"}}>
                    <span className="badge" style={{fontSize:10,whiteSpace:"nowrap",background:stBg,color:stColor}}>{st}</span>
                  </td>
                  <td data-cell-label="doc" style={{padding:"12px 14px",textAlign:"center"}}>
                    {t.docLink?(
                      <a href={t.docLink} target="_blank" rel="noreferrer" style={{color:"var(--teal)",display:"inline-flex",alignItems:"center",gap:4,fontSize:11,textDecoration:"none"}} onClick={e=>e.stopPropagation()}><I n="external" s={11}/>Abrir</a>
                    ):(
                      <button className="btn bs" style={{fontSize:10,padding:"3px 8px"}} onClick={e=>{e.stopPropagation();onAddLink(t)}}><I n="link" s={11}/>Anexar</button>
                    )}
                  </td>
                  <td data-cell-label="actions" style={{padding:"12px 14px",textAlign:"center",whiteSpace:"nowrap"}}>
                    {isTaskOpen(t)&&(
                      <button className="btn bs" style={{fontSize:10,padding:"3px 8px",marginRight:4}} onClick={e=>{e.stopPropagation();onStart(t.id)}}><I n="play" s={11}/>Iniciar</button>
                    )}
                    {isTaskInProgress(t)&&(
                      <button className="btn bp" style={{fontSize:10,padding:"3px 8px"}} onClick={e=>{e.stopPropagation();onComplete(t.id)}}><I n="check" s={11}/>Concluir</button>
                    )}
                    {isTaskCompleted(t)&&(
                      <button className="btn bs" style={{fontSize:10,padding:"3px 8px"}} onClick={e=>{e.stopPropagation();onReopen(t.id)}}><I n="rotate" s={11}/>Reabrir</button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ──────────── Card compacto para Kanban ────────────
function KanbanCard({task,draggable,onDragStart,onStart,onComplete,onReopen,onAddLink,onOpen}){
  const st=getTaskStatus(task);
  const isOverdue=st==="Atrasada";
  return (
    <div draggable={draggable} onDragStart={onDragStart}
      onClick={()=>onOpen&&onOpen(task)}
      style={{padding:12,background:"var(--bg-card)",borderRadius:"var(--r)",border:`1px solid ${isOverdue?"var(--red)":"var(--bdr)"}`,cursor:onOpen?"pointer":"grab",boxShadow:"var(--sh-sm)",display:"flex",flexDirection:"column",gap:8,transition:"all .15s"}}
      onMouseEnter={e=>{if(onOpen&&!isOverdue)e.currentTarget.style.borderColor="var(--teal)"}}
      onMouseLeave={e=>{if(onOpen&&!isOverdue)e.currentTarget.style.borderColor="var(--bdr)"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:6}}>
        <div style={{minWidth:0,flex:1}}>
          <div style={{fontSize:12,fontWeight:700,color:"var(--t1)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{task.client}</div>
          {task.campaign_name&&<div style={{fontSize:11,color:"var(--teal-l)",fontWeight:600,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",marginTop:1}}>{task.campaign_name}</div>}
          <div style={{fontSize:10,color:"var(--t3)",marginTop:2}}>{task.type}</div>
        </div>
        {isOverdue&&<span className="badge b-red" style={{fontSize:9}}>Atrasada</span>}
      </div>
      {task.briefing&&(
        <div style={{fontSize:11,color:"var(--t2)",lineHeight:1.4,display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical",overflow:"hidden"}}>{task.briefing}</div>
      )}
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",fontSize:10,color:"var(--t3)",paddingTop:6,borderTop:"1px solid var(--bdr-card)"}}>
        <span style={{display:"inline-flex",alignItems:"center",gap:4}}><I n="user" s={10}/>{shortName(task.cs)}</span>
        <span style={{display:"inline-flex",alignItems:"center",gap:4,color:isOverdue?"var(--red)":"var(--t3)"}}><I n="calendar" s={10}/>{fmtDate(task.deadline)}</span>
      </div>
      <div style={{display:"flex",gap:4}}>
        {isTaskOpen(task)&&(
          <button className="btn bs" style={{fontSize:10,padding:"4px 8px",flex:1}} onClick={(e)=>{e.stopPropagation();onStart(task.id)}}><I n="play" s={11}/>Iniciar</button>
        )}
        {isTaskInProgress(task)&&(
          <button className="btn bp" style={{fontSize:10,padding:"4px 8px",flex:1}} onClick={(e)=>{e.stopPropagation();onComplete(task.id)}}><I n="check" s={11}/>Concluir</button>
        )}
        {isTaskCompleted(task)&&(
          <button className="btn bs" style={{fontSize:10,padding:"4px 8px",flex:1}} onClick={(e)=>{e.stopPropagation();onReopen(task.id)}}><I n="rotate" s={11}/>Reabrir</button>
        )}
        {task.docLink?(
          <a href={task.docLink} target="_blank" rel="noreferrer" className="btn bs" style={{fontSize:10,padding:"4px 8px",textDecoration:"none"}} onClick={(e)=>e.stopPropagation()}><I n="external" s={11}/></a>
        ):(
          <button className="btn bs" style={{fontSize:10,padding:"4px 8px"}} onClick={(e)=>{e.stopPropagation();onAddLink(task)}}><I n="link" s={11}/></button>
        )}
      </div>
    </div>
  );
}

function TaskCard({task,onStart,onComplete,onReopen,onAddLink,onOpen}) {
  const st=getTaskStatus(task);
  const stCls=st==="Concluída"?"b-teal":st==="Iniciado"?"b-teal":st==="Atrasada"?"b-red":"b-grn";
  return (
    <div className="card" style={{padding:"18px 20px",display:"flex",flexDirection:"column",gap:12,cursor:onOpen?"pointer":"default",transition:"all .15s"}}
      onClick={()=>onOpen&&onOpen(task)}
      onMouseEnter={e=>{if(onOpen)e.currentTarget.style.borderColor="var(--teal)"}}
      onMouseLeave={e=>{if(onOpen)e.currentTarget.style.borderColor=""}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <div style={{display:"flex",alignItems:"center",gap:6}}>
          <span style={{padding:"3px 10px",borderRadius:99,background:"var(--bg3)",border:"1px solid var(--bdr)",fontSize:11,fontWeight:700,color:"var(--t2)",fontFamily:"var(--fd)"}}>{task.type}</span>
          <span className={`badge ${stCls}`}><I n={st==="Atrasada"?"alert-circle":st==="Iniciado"?"play":"check-circle"} s={10} /> {st}</span>
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
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",paddingTop:10,borderTop:"1px solid var(--bdr)",flexWrap:"wrap",gap:8}}>
        <div style={{display:"flex",alignItems:"center",gap:12,flexWrap:"wrap"}}>
          <div style={{display:"flex",alignItems:"center",gap:4}}><I n="user" s={12} c="var(--t3)" /><span style={{fontSize:12,color:"var(--t2)",fontWeight:600}}>{task.cs}</span></div>
          <div style={{display:"flex",alignItems:"center",gap:4}}><I n="calendar" s={12} c="var(--t3)" /><span style={{fontSize:12,color:st==="Atrasada"?"var(--red)":"var(--t2)"}}>{fmtDate(task.deadline)}</span></div>
        </div>
        <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
          {task.docLink&&<a href={task.docLink} target="_blank" rel="noreferrer" className="btn bs" style={{fontSize:11,padding:"5px 10px",textDecoration:"none"}} onClick={e=>e.stopPropagation()}><I n="external" s={12} />Doc</a>}
          <button className="btn bg" style={{fontSize:11,padding:"5px 10px"}} onClick={e=>{e.stopPropagation();onAddLink(task)}} title={task.docLink?"Editar link":"Adicionar link"}><I n="link" s={12} />{task.docLink?"Editar":"Link"}</button>
          {isTaskOpen(task)&&onStart&&<button className="btn bs" style={{fontSize:11,padding:"5px 12px"}} onClick={e=>{e.stopPropagation();onStart(task.id)}}><I n="play" s={12} />Iniciar</button>}
          {isTaskInProgress(task)&&<button className="btn bp" style={{fontSize:11,padding:"5px 12px"}} onClick={e=>{e.stopPropagation();onComplete(task.id)}}><I n="check" s={12} />Concluir</button>}
          {isTaskCompleted(task)&&onReopen&&<button className="btn bs" style={{fontSize:11,padding:"5px 12px"}} onClick={e=>{e.stopPropagation();onReopen(task.id)}}><I n="rotate" s={12} />Reabrir</button>}
        </div>
      </div>
    </div>
  );
}

// ──────────── Modal de detalhes da Task ────────────
function TaskDetailModal({task,onClose,onStart,onComplete,onReopen,onAddLink,canEdit,onSaveEdit,csList=[]}){
  const st=getTaskStatus(task);
  const stBg = st==="Concluída"?"var(--teal-dim)":st==="Iniciado"?"var(--teal-dim)":st==="Atrasada"?"var(--red-bg)":"var(--green-bg)";
  const stColor = st==="Concluída"?"var(--teal-l)":st==="Iniciado"?"var(--teal)":st==="Atrasada"?"var(--red)":"var(--green)";
  const [isEditing,setIsEditing]=useState(false);
  const [editForm,setEditForm]=useState(null);
  const startEdit=()=>{
    // Se a task tem cs (nome) mas não tem csEmail (legado/BQ NULL),
    // tenta achar o email pelo nome dentro da csList
    let csEmail=task.csEmail||task.cs_email||"";
    if(!csEmail && task.cs){
      const found=csList.find(c=>c.name===task.cs);
      if(found) csEmail=found.email;
    }
    setEditForm({
      id:task.id,
      briefing:task.briefing||"",
      cs:task.cs||"",
      csEmail,
      deadline:task.deadline||"",
      budget:task.budget||"",
      products:task.products||[],
      features:task.features||[],
      campaign_name:task.campaign_name||"",
    });
    setIsEditing(true);
  };
  const cancelEdit=()=>{ setIsEditing(false); setEditForm(null); };
  const saveEdit=()=>{
    onSaveEdit&&onSaveEdit({
      ...editForm,
      budget: editForm.budget===""?null:Number(editForm.budget),
    });
    setIsEditing(false); setEditForm(null);
  };
  const togItem=(key,val)=>setEditForm(p=>{
    const arr=p[key]||[];
    return{...p,[key]:arr.includes(val)?arr.filter(x=>x!==val):[...arr,val]};
  });
  return (
    <div className="mo" onClick={onClose}>
      <div className="ml" style={{maxWidth:720,maxHeight:"90vh",display:"flex",flexDirection:"column"}} onClick={e=>e.stopPropagation()}>
        {/* Header */}
        <div style={{padding:"20px 24px",borderBottom:"1px solid var(--bdr)",display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:14,flexShrink:0}}>
          <div style={{minWidth:0,flex:1}}>
            <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:6,flexWrap:"wrap"}}>
              <span style={{padding:"3px 10px",borderRadius:99,background:"var(--bg3)",border:"1px solid var(--bdr)",fontSize:11,fontWeight:700,color:"var(--t2)",fontFamily:"var(--fd)"}}>{task.type}</span>
              <span className="badge" style={{fontSize:10,background:stBg,color:stColor}}>
                <I n={st==="Atrasada"?"alert-circle":st==="Iniciado"?"play":st==="Concluída"?"check-circle":"clock"} s={10}/> {st}
              </span>
              <span style={{fontSize:11,color:"var(--t3)"}}>#{task.id}</span>
            </div>
            <div style={{fontFamily:"var(--fd)",fontSize:20,fontWeight:800,color:"var(--t1)",lineHeight:1.2}}>{task.client}</div>
            {task.campaign_name&&!isEditing&&<div style={{fontFamily:"var(--fd)",fontSize:14,fontWeight:600,color:"var(--teal-l)",marginTop:4}}>{task.campaign_name}</div>}
            {isEditing&&(
              <div style={{marginTop:8}}>
                <label style={{fontSize:10,fontWeight:700,textTransform:"uppercase",letterSpacing:".06em",color:"var(--t3)",marginBottom:4,display:"block"}}>Nome da Campanha</label>
                <input className="fi" type="text" placeholder="Ex: Black Friday 2026..." value={editForm.campaign_name||""} onChange={e=>setEditForm(p=>({...p,campaign_name:e.target.value}))} style={{fontSize:13,width:"100%",maxWidth:400}}/>
              </div>
            )}
          </div>
          <div style={{display:"flex",alignItems:"center",gap:6,flexShrink:0}}>
            {canEdit&&!isEditing&&(
              <button title="Editar task" onClick={startEdit} className="btn bs" style={{fontSize:11,padding:"5px 10px"}}>
                <I n="edit" s={13}/>Editar
              </button>
            )}
            <button title="Fechar" onClick={onClose}
              style={{background:"transparent",border:"none",padding:6,cursor:"pointer",color:"var(--t3)",borderRadius:6,display:"inline-flex",alignItems:"center"}}
              onMouseEnter={e=>{e.currentTarget.style.color="var(--t1)";e.currentTarget.style.background="var(--bg3)"}}
              onMouseLeave={e=>{e.currentTarget.style.color="var(--t3)";e.currentTarget.style.background="transparent"}}>
              <I n="x" s={18}/>
            </button>
          </div>
        </div>

        {/* Body */}
        <div style={{padding:"20px 24px",overflowY:"auto",flex:1}}>
          {/* Briefing — destaque principal */}
          <div style={{marginBottom:18}}>
            <div style={{fontSize:11,fontWeight:700,textTransform:"uppercase",letterSpacing:".06em",color:"var(--t3)",marginBottom:8}}>Briefing</div>
            {isEditing?(
              <textarea className="ft" rows={5} value={editForm.briefing} onChange={e=>setEditForm(p=>({...p,briefing:e.target.value}))} style={{width:"100%",fontSize:13,lineHeight:1.5}}/>
            ):(
              <div style={{padding:14,background:"var(--bg3)",border:"1px solid var(--bdr)",borderRadius:"var(--r)",fontSize:13,color:"var(--t1)",lineHeight:1.6,whiteSpace:"pre-wrap",wordBreak:"break-word"}}>
                {task.briefing||<span style={{color:"var(--t3)",fontStyle:"italic"}}>Sem briefing informado</span>}
              </div>
            )}
          </div>

          {/* Metadados em grid */}
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))",gap:12,marginBottom:18}}>
            <div style={{padding:12,background:"var(--bg-card)",border:"1px solid var(--bdr)",borderRadius:"var(--r)"}}>
              <div style={{fontSize:10,fontWeight:700,textTransform:"uppercase",letterSpacing:".06em",color:"var(--t3)",marginBottom:6}}>CS Responsável</div>
              {isEditing?(<>
                <select className="fs" style={{fontSize:13,width:"100%"}}
                  value={editForm.csEmail || (editForm.cs?`__NAME__:${editForm.cs}`:"")}
                  onChange={e=>{
                    const v=e.target.value;
                    if(v.startsWith("__NAME__:")) return; // opção fantasma, ignora
                    const email=v;
                    const found=csList.find(c=>c.email===email);
                    setEditForm(p=>({...p,csEmail:email,cs:found?found.name:p.cs}));
                  }}>
                  <option value="">— Selecione um CS —</option>
                  {csList.map(cs=><option key={cs.email} value={cs.email}>{cs.name}</option>)}
                  {/* Fallback: CS atual não foi encontrado no time (por email ou por nome) */}
                  {editForm.cs && !editForm.csEmail && !csList.find(c=>c.name===editForm.cs) && (
                    <option value={`__NAME__:${editForm.cs}`}>{editForm.cs} (atual — sem e-mail registrado)</option>
                  )}
                  {editForm.csEmail && !csList.find(c=>c.email===editForm.csEmail) && (
                    <option value={editForm.csEmail}>{editForm.cs||editForm.csEmail} (atual — fora do time)</option>
                  )}
                </select>
                {((editForm.csEmail && !csList.find(c=>c.email===editForm.csEmail)) ||
                  (editForm.cs && !editForm.csEmail && !csList.find(c=>c.name===editForm.cs))) && (
                  <div style={{fontSize:10,color:"var(--yellow-s)",marginTop:4,display:"flex",alignItems:"center",gap:4}}>
                    <I n="alert-circle" s={10} c="var(--yellow-s)"/>
                    {editForm.csEmail?"CS atual não está mais no time":"CS atual sem e-mail registrado"}
                  </div>
                )}
              </>):(<>
                <div style={{display:"flex",alignItems:"center",gap:6,fontSize:13,fontWeight:600,color:"var(--t1)"}}>
                  <I n="user" s={13} c="var(--teal)"/>{task.cs||"—"}
                </div>
                {task.csEmail&&<div style={{fontSize:11,color:"var(--t3)",marginTop:2}}>{task.csEmail}</div>}
              </>)}
            </div>
            <div style={{padding:12,background:"var(--bg-card)",border:"1px solid var(--bdr)",borderRadius:"var(--r)"}}>
              <div style={{fontSize:10,fontWeight:700,textTransform:"uppercase",letterSpacing:".06em",color:"var(--t3)",marginBottom:6}}>Solicitante</div>
              <div style={{display:"flex",alignItems:"center",gap:6,fontSize:13,fontWeight:600,color:"var(--t1)"}}>
                <I n="user" s={13} c="var(--teal)"/>{task.requestedBy||"—"}
              </div>
              {task.requesterEmail&&<div style={{fontSize:11,color:"var(--t3)",marginTop:2}}>{task.requesterEmail}</div>}
            </div>
            <div style={{padding:12,background:"var(--bg-card)",border:"1px solid var(--bdr)",borderRadius:"var(--r)"}}>
              <div style={{fontSize:10,fontWeight:700,textTransform:"uppercase",letterSpacing:".06em",color:"var(--t3)",marginBottom:6}}>Prazo</div>
              {isEditing?(
                <input type="date" className="fi" value={(editForm.deadline||"").slice(0,10)} onChange={e=>setEditForm(p=>({...p,deadline:e.target.value}))} style={{fontSize:13}}/>
              ):(<>
                <div style={{display:"flex",alignItems:"center",gap:6,fontSize:13,fontWeight:600,color:st==="Atrasada"?"var(--red)":"var(--t1)"}}>
                  <I n="calendar" s={13} c={st==="Atrasada"?"var(--red)":"var(--teal)"}/>{fmtDate(task.deadline)}
                </div>
                {task.sla&&<div style={{fontSize:11,color:"var(--t3)",marginTop:2}}>SLA: {task.sla}</div>}
              </>)}
            </div>
            {(isEditing||task.budget>0)&&(
              <div style={{padding:12,background:"var(--bg-card)",border:"1px solid var(--bdr)",borderRadius:"var(--r)"}}>
                <div style={{fontSize:10,fontWeight:700,textTransform:"uppercase",letterSpacing:".06em",color:"var(--t3)",marginBottom:6}}>Investimento</div>
                {isEditing?(
                  <input type="number" className="fi" value={editForm.budget} onChange={e=>setEditForm(p=>({...p,budget:e.target.value}))} placeholder="0" style={{fontSize:13}}/>
                ):(
                  <div style={{display:"flex",alignItems:"center",gap:6,fontSize:13,fontWeight:700,color:"var(--teal)"}}>
                    <I n="dollar" s={13} c="var(--teal)"/>{fmtCurrency(task.budget)}
                  </div>
                )}
              </div>
            )}
            {!isEditing&&(task.saMode==="support"||task.saMode==="lead"||task.isSA)&&(
              <div style={{padding:12,background:task.saMode==="lead"?"var(--yellow-s-bg)":"var(--teal-dim)",border:`1px solid ${task.saMode==="lead"?"var(--yellow-s)":"var(--teal)"}`,borderRadius:"var(--r)"}}>
                <div style={{fontSize:10,fontWeight:700,textTransform:"uppercase",letterSpacing:".06em",color:task.saMode==="lead"?"var(--yellow-s)":"var(--teal)",marginBottom:6}}>Solutions Architect</div>
                <div style={{display:"flex",alignItems:"center",gap:6,fontSize:13,fontWeight:700,color:task.saMode==="lead"?"var(--yellow-s)":"var(--teal-l)"}}>
                  <I n={task.saMode==="lead"?"shield":"users"} s={13} c={task.saMode==="lead"?"var(--yellow-s)":"var(--teal)"}/>
                  {task.saMode==="lead"?"Time SA é o responsável":"Time SA acompanhando"}
                </div>
                {task.saMode==="lead"&&task.originalCs&&(
                  <div style={{fontSize:11,color:"var(--t3)",marginTop:4}}>CS original do cliente: {task.originalCs}</div>
                )}
              </div>
            )}
          </div>

          {/* Produtos e features */}
          {isEditing?(
            <div style={{marginBottom:18,display:"flex",flexDirection:"column",gap:12}}>
              <div>
                <div style={{fontSize:11,fontWeight:700,textTransform:"uppercase",letterSpacing:".06em",color:"var(--t3)",marginBottom:8}}>Produtos</div>
                <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
                  {CORE_PRODUCTS.map(p=>(
                    <span key={p} className={`chip${(editForm.products||[]).includes(p)?" sel":""}`} style={{fontSize:11,cursor:"pointer"}} onClick={()=>togItem("products",p)}>{p}</span>
                  ))}
                </div>
              </div>
              <div>
                <div style={{fontSize:11,fontWeight:700,textTransform:"uppercase",letterSpacing:".06em",color:"var(--t3)",marginBottom:8}}>Features</div>
                <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
                  {FEATURES.map(f=>(
                    <span key={f} className={`chip${(editForm.features||[]).includes(f)?" sel":""}`} style={{fontSize:11,cursor:"pointer"}} onClick={()=>togItem("features",f)}>{f}</span>
                  ))}
                </div>
              </div>
            </div>
          ):(task.products?.length>0||task.features?.length>0)&&(
            <div style={{marginBottom:18}}>
              <div style={{fontSize:11,fontWeight:700,textTransform:"uppercase",letterSpacing:".06em",color:"var(--t3)",marginBottom:8}}>Produtos & Features</div>
              <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
                {task.products?.map(p=><span key={p} className="chip sel" style={{fontSize:11}}>{p}</span>)}
                {task.features?.map(f=><span key={f} style={{padding:"3px 10px",background:"var(--bg3)",border:"1px solid var(--bdr)",borderRadius:99,fontSize:11,color:"var(--t2)",fontWeight:600}}>{f}</span>)}
              </div>
            </div>
          )}

          {/* Doc link */}
          {!isEditing&&(
            <div style={{marginBottom:18}}>
              <div style={{fontSize:11,fontWeight:700,textTransform:"uppercase",letterSpacing:".06em",color:"var(--t3)",marginBottom:8}}>Documento de Apoio</div>
              {task.docLink?(
                <a href={task.docLink} target="_blank" rel="noreferrer"
                  style={{display:"inline-flex",alignItems:"center",gap:8,padding:"10px 14px",background:"var(--teal-dim)",border:"1px solid var(--teal)",borderRadius:"var(--r)",fontSize:12,fontWeight:600,color:"var(--teal-l)",textDecoration:"none",maxWidth:"100%"}}>
                  <I n="external" s={13}/>
                  <span style={{overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{task.docLink}</span>
                </a>
              ):(
                <div style={{fontSize:12,color:"var(--t3)",fontStyle:"italic"}}>Nenhum link anexado ainda</div>
              )}
            </div>
          )}

          {/* Datas */}
          {!isEditing&&task.createdAt&&(
            <div style={{fontSize:11,color:"var(--t3)",paddingTop:12,borderTop:"1px solid var(--bdr)"}}>
              Aberta em {fmtDate(task.createdAt)}
            </div>
          )}
        </div>

        {/* Footer com ações */}
        <div className="modal-sticky-footer" style={{padding:"14px 24px",borderTop:"1px solid var(--bdr)",display:"flex",justifyContent:"flex-end",gap:8,flexWrap:"wrap",flexShrink:0,background:"var(--bg-card)"}}>
          {isEditing?(<>
            <button className="btn bs" style={{fontSize:12}} onClick={cancelEdit}>Cancelar</button>
            <button className="btn bp" style={{fontSize:12}} onClick={saveEdit}><I n="check" s={13}/>Salvar Alterações</button>
          </>):(<>
            <button className="btn bg" style={{fontSize:12}} onClick={()=>onAddLink(task)}>
              <I n="link" s={13}/>{task.docLink?"Editar Link":"Anexar Link"}
            </button>
            {isTaskOpen(task)&&onStart&&(
              <button className="btn bs" style={{fontSize:12}} onClick={()=>{onStart(task.id);onClose()}}>
                <I n="play" s={13}/>Iniciar Task
              </button>
            )}
            {isTaskInProgress(task)&&(
              <button className="btn bp" style={{fontSize:12}} onClick={()=>{onComplete(task.id);onClose()}}>
                <I n="check" s={13}/>Marcar como Concluída
              </button>
            )}
            {isTaskCompleted(task)&&onReopen&&(
              <button className="btn bs" style={{fontSize:12}} onClick={()=>{onReopen(task.id);onClose()}}>
                <I n="rotate" s={13}/>Reabrir Task
              </button>
            )}
          </>)}
        </div>
      </div>
    </div>
  );
}

function NewTaskModal({onClose,onSubmit,gfIdx}) {
  const user = useAuth();
  const CLIENT_DB = useClients();
  const [f,sF]=useState({type:"",client:"",campaign_name:"",products:[],features:[],budget:"",briefing:"",cs:"",csEmail:"",customDeadline:null,slaDate:null,autoCS:false,saMode:"none",originalCs:null,originalCsEmail:null});
  const set=(k,v)=>sF(p=>({...p,[k]:v}));
  const tog=(k,v)=>sF(p=>({...p,[k]:p[k].includes(v)?p[k].filter(x=>x!==v):[...p[k],v]}));
  useEffect(()=>{if(f.type&&SLA_DAYS[f.type]){const d=addBusinessDays(new Date(),SLA_DAYS[f.type]);set("slaDate",d.toISOString().split("T")[0]);set("customDeadline",null);}},[f.type]);
  useEffect(()=>{const h=e=>{if(e.key==="Escape")onClose()};window.addEventListener("keydown",h);return()=>window.removeEventListener("keydown",h);},[onClose]);

  const handleClientSelect=(entry)=>{
    if(!entry){sF(p=>({...p,cs:"",csEmail:"",autoCS:false,saMode:"none",originalCs:null,originalCsEmail:null}));return;}
    if(entry.cs&&entry.csEmail){sF(p=>({...p,cs:entry.cs,csEmail:entry.csEmail,autoCS:true,saMode:"none",originalCs:null,originalCsEmail:null}));}
    else{sF(p=>({...p,cs:"",csEmail:"",autoCS:false,saMode:"none",originalCs:null,originalCsEmail:null}));}
  };
  const handleCS=cs=>{
    if(cs==="Solutions Architect"){
      // SA assume — preserva CS anterior (se houver e for válido) como referência histórica
      sF(p=>{
        const hasPrevCs = p.cs && p.cs !== SA_NAME;
        return {...p,
          cs: SA_NAME,
          csEmail: SA_EMAIL,
          autoCS: false,
          saMode: "lead",
          originalCs: hasPrevCs ? p.cs : null,
          originalCsEmail: hasPrevCs ? (p.csEmail || null) : null,
        };
      });
    } else if(cs==="Greenfield"){
      const next=GREENFIELD_QUEUE[gfIdx.current%GREENFIELD_QUEUE.length];
      gfIdx.current++;
      sF(p=>({...p,cs:next,csEmail:"",autoCS:false,saMode:"none",originalCs:null,originalCsEmail:null}));
    } else {
      sF(p=>({...p,cs:cs,csEmail:"",autoCS:false,saMode:p.saMode==="lead"?"none":p.saMode,originalCs:null,originalCsEmail:null}));
    }
  };
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
          <div className="fg"><label className="fl">Nome da Campanha</label><input className="fi" type="text" placeholder="Ex: Black Friday 2026, Lançamento Produto X..." value={f.campaign_name} onChange={e=>set("campaign_name",e.target.value)}/></div>

          {/* Auto-filled CS info card */}
          {f.autoCS&&f.cs&&(
            <div style={{padding:"12px 16px",borderRadius:"var(--r)",background:"var(--green-bg)",border:"1px solid var(--green)",display:"flex",alignItems:"center",gap:10}}>
              <I n="check-circle" s={16} c="var(--green)"/>
              <div style={{flex:1}}>
                <div style={{fontSize:12,fontWeight:700,color:"var(--green)"}}>CS identificado automaticamente</div>
                <div style={{fontSize:13,color:"var(--t1)",fontWeight:600,marginTop:2}}>{f.cs} <span style={{fontWeight:400,color:"var(--t3)"}}>({f.csEmail})</span></div>
              </div>
              <button className="btn bg" style={{fontSize:11,padding:"4px 8px"}} onClick={()=>sF(p=>({...p,autoCS:false}))}>Alterar</button>
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

          {/* SA — quando o CS escolhido é o próprio Solutions Architect, mostra aviso */}
          {f.saMode==="lead"&&f.cs===SA_NAME&&(
            <div className="disc" style={{fontSize:11,background:"var(--yellow-s-bg)",borderLeft:"3px solid var(--yellow-s)"}}>
              <I n="shield" s={13} c="var(--yellow-s)"/>
              <div>
                <strong>Time de SA é o responsável por esta task.</strong> A notificação será enviada apenas para <code style={{background:"rgba(0,0,0,0.06)",padding:"1px 5px",borderRadius:4}}>{SA_EMAIL}</code>
                {f.originalCs&&<> — o CS original do cliente ({f.originalCs}) <strong>não</strong> será notificado.</>}
              </div>
            </div>
          )}

          {/* SA acompanha — checkbox compacto quando o CS é alguém da equipe */}
          {f.cs && f.cs !== SA_NAME && (
            <label style={{display:"flex",alignItems:"center",gap:10,padding:"10px 12px",border:`1px solid ${f.saMode==="support"?"var(--teal)":"var(--bdr)"}`,borderRadius:"var(--r)",cursor:"pointer",background:f.saMode==="support"?"var(--teal-dim)":"var(--bg-card)",transition:"all .15s"}}>
              <input type="checkbox" checked={f.saMode==="support"} onChange={e=>set("saMode",e.target.checked?"support":"none")} style={{margin:0,accentColor:"var(--teal)",cursor:"pointer"}}/>
              <I n="users" s={14} c={f.saMode==="support"?"var(--teal)":"var(--t3)"}/>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:13,fontWeight:700,color:f.saMode==="support"?"var(--teal)":"var(--t1)"}}>SA acompanha esta task</div>
                <div style={{fontSize:11,color:"var(--t3)",marginTop:1}}>O Time de SA recebe em cópia. {f.cs} segue como responsável.</div>
              </div>
            </label>
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
          <div className="modal-sticky-footer" style={{display:"flex",gap:10,justifyContent:"flex-end",marginTop:8}}>
            <button className="btn bs" onClick={onClose}>Cancelar</button>
            <button className="btn bp" disabled={!valid} onClick={()=>{
              onSubmit({
                ...f,
                requesterEmail: user?.email,
                requestedBy: user?.name,
                deadline: sla,
                status: "aberta",
                createdAt: new Date().toISOString().split("T")[0],
                isSA: f.saMode==="support" || f.saMode==="lead", // mantém compat com backend antigo
              });
            }}><I n="send" s={14}/>Abrir Task</button>
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
          <div className="modal-sticky-footer" style={{display:"flex",gap:10,justifyContent:"flex-end"}}><button className="btn bs" onClick={onClose}>Cancelar</button><button className="btn bp" onClick={()=>onSave(link)}><I n="link" s={14}/>Salvar</button></div>
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
  const availableStudies = useStudies();
  const INIT={cp_name:"",cp_email:"",agency:"",industry:"",start_date:"",end_date:"",client:"",campaign_type:"",campaign_name:"",investment:"",deal_dv360:"",formats:[],cpm:"",cpcv:"",products:[],o2o_impressoes:"",o2o_views:"",has_bonus:"",bonus_o2o_impressoes:"",bonus_o2o_views:"",ooh_link:"",audiences:"",selected_studies:[],praças_type:"",praças_states:[],praças_cities:[],praças_city_input:"",praças_city_state:"",praças_other:"",had_cs_meeting:"",marketplaces:[],features:[],feature_volumes:{},pecas_link:"",pi_link:"",proposta_link:"",extra_urls:[""],observations:"",marketing_action:"",cs_name:"",cs_email:""};
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

  const showO2O=f.products.includes("O2O"),showOOH=f.products.includes("OOH"),showRMND=f.products.includes("RMND"),showRMNF=f.products.includes("Groundflow")||f.products.includes("RMNF");
  const hasBonus=f.has_bonus==="Sim",hasVideo=f.formats.includes("Video"),hasDisplay=f.formats.includes("Display");
  const [validationError,setValidationError]=useState(null);
  const [requiredErrors,setRequiredErrors]=useState(null); // {missing: [{label, section}]}

  // Investment validation
  const validateInvestment = () => {
    const investment = parseFloat(f.investment) || 0;
    if (investment === 0) return null; // no investment to validate
    
    const cpm = parseFloat(f.cpm) || 0;
    const cpcv = parseFloat(f.cpcv) || 0;
    const products = f.products || [];
    
    let totalDisplay = 0;
    let totalVideo = 0;
    const details = [];

    // Sum display (CPM) across all products
    if (hasDisplay && cpm > 0) {
      products.forEach(prod => {
        const imp = parseFloat(f[`${prod}_imp`]) || 0;
        if (imp > 0) {
          const val = (cpm * imp) / 1000;
          totalDisplay += val;
          details.push({ product: prod, type: "Display", formula: `CPM R$${cpm} × ${imp.toLocaleString("pt-BR")} imp / 1.000`, value: val });
        }
      });
    }

    // Sum video (CPCV) across all products
    if (hasVideo && cpcv > 0) {
      products.forEach(prod => {
        const views = parseFloat(f[`${prod}_views`]) || 0;
        if (views > 0) {
          const val = cpcv * views;
          totalVideo += val;
          details.push({ product: prod, type: "Video", formula: `CPCV R$${cpcv} × ${views.toLocaleString("pt-BR")} views`, value: val });
        }
      });
    }

    const totalCalc = totalDisplay + totalVideo;
    
    // If no volumetry was filled, skip validation
    if (totalCalc === 0) return null;
    
    const diff = Math.abs(totalCalc - investment);
    const tolerance = investment * 0.01; // 1% tolerance
    
    if (diff > tolerance) {
      return {
        investment,
        totalCalc,
        diff: totalCalc - investment,
        details,
        totalDisplay,
        totalVideo,
      };
    }
    return null;
  };

  const handleReset=()=>{sF(INIT);sSub(false);setValidationError(null);setRequiredErrors(null)};

  // Validação de campos obrigatórios — chamada antes do submit
  const validateRequired = () => {
    const missing = [];

    // Seção 1
    if (!f.client?.trim()) missing.push({ label: "Cliente", section: "1. Informações Gerais" });
    if (!f.campaign_name?.trim()) missing.push({ label: "Campanha", section: "1. Informações Gerais" });
    if (!f.industry?.trim()) missing.push({ label: "Indústria", section: "1. Informações Gerais" });
    if (!f.campaign_type?.trim()) missing.push({ label: "Tipo de Campanha", section: "1. Informações Gerais" });
    if (!f.start_date) missing.push({ label: "Data de Início", section: "1. Informações Gerais" });
    if (!f.end_date) missing.push({ label: "Data Final", section: "1. Informações Gerais" });
    if (!f.investment || parseFloat(f.investment) <= 0) missing.push({ label: "Investimento", section: "1. Informações Gerais" });

    // Seção 2: Formatos
    if (!Array.isArray(f.formats) || f.formats.length === 0) {
      missing.push({ label: "Pelo menos 1 formato (Display ou Video)", section: "2. Formatos e Métricas" });
    }

    // Seção 3: Produtos Core + Volumetria
    const products = f.products || [];
    if (products.length === 0) {
      missing.push({ label: "Pelo menos 1 Produto Core", section: "3. Produtos Core e Volumetria" });
    } else {
      products.forEach(prod => {
        const imp = parseFloat(f[`${prod}_imp`]) || 0;
        const views = parseFloat(f[`${prod}_views`]) || 0;
        if (hasDisplay && !hasVideo && imp <= 0) {
          missing.push({ label: `Volumetria (impressões) para ${prod}`, section: "3. Produtos Core e Volumetria" });
        } else if (hasVideo && !hasDisplay && views <= 0) {
          missing.push({ label: `Volumetria (views) para ${prod}`, section: "3. Produtos Core e Volumetria" });
        } else if (hasDisplay && hasVideo && imp <= 0 && views <= 0) {
          missing.push({ label: `Volumetria para ${prod} (impressões ou views)`, section: "3. Produtos Core e Volumetria" });
        }
      });
    }

    // Seção 4: Praças
    const pracasType = f.praças_type || f.pracas_type;
    if (!pracasType) {
      missing.push({ label: "Tipo de Praça", section: "4. Audiências, Features e Praças" });
    } else {
      if (pracasType === "Estado" && (!Array.isArray(f.praças_states) || f.praças_states.length === 0)) {
        missing.push({ label: "Estados selecionados", section: "4. Audiências, Features e Praças" });
      }
      if (pracasType === "Cidade" && (!Array.isArray(f.praças_cities) || f.praças_cities.length === 0)) {
        missing.push({ label: "Cidades selecionadas", section: "4. Audiências, Features e Praças" });
      }
      if (pracasType === "Outro" && !f.praças_other?.trim()) {
        missing.push({ label: "Detalhamento de praças (Outro)", section: "4. Audiências, Features e Praças" });
      }
    }

    // Seção 5: Links e Documentos — todos obrigatórios
    if (!f.pecas_link?.trim()) missing.push({ label: "Link das Peças", section: "5. Links e Documentos" });
    const validUrls = (f.extra_urls || []).filter(u => u && u.trim());
    if (validUrls.length === 0) missing.push({ label: "Pelo menos 1 URL de Direcionamento", section: "5. Links e Documentos" });
    if (!f.pi_link?.trim()) missing.push({ label: "Link do PI", section: "5. Links e Documentos" });
    if (!f.proposta_link?.trim()) missing.push({ label: "Link da Proposta", section: "5. Links e Documentos" });

    return missing.length > 0 ? missing : null;
  };

  const handleSubmit=async()=>{
    // 1) Valida campos obrigatórios PRIMEIRO
    const missing = validateRequired();
    if (missing) {
      setRequiredErrors(missing);
      return;
    }
    // 2) Valida investimento vs volumetria (se passou no required)
    const error = validateInvestment();
    if (error) {
      setValidationError(error);
      return;
    }

    const short_token = generateShortToken();
    const cleanedMarketingAction = (f.marketing_action||"").trim();
    const payload={...f,marketing_action:cleanedMarketingAction,submittedBy:user?.name,submittedByEmail:user?.email,cp_name:user?.name,cp_email:user?.email,short_token};
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
            {hasDisplay&&<CF l="CPM Negociado">
              <div style={{display:"flex",flexDirection:"column",gap:8}}>
                <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                  {["14.40","36.00"].map(v=>(
                    <span key={v} className={`chip${f.cpm===v?" sel":""}`} style={{fontSize:12,padding:"6px 14px"}} onClick={()=>set("cpm",v)}>R$ {v}</span>
                  ))}
                  <span className={`chip${f.cpm&&!["14.40","36.00"].includes(f.cpm)?" sel":""}`} style={{fontSize:12,padding:"6px 14px"}} onClick={()=>set("cpm","custom")}>Outro</span>
                </div>
                {f.cpm&&!["14.40","36.00"].includes(f.cpm)&&(
                  <div>
                    <input className="fi" placeholder="Ex: 18.50" value={f.cpm==="custom"?"":f.cpm} onChange={e=>set("cpm",e.target.value)}/>
                    <div className="disc" style={{marginTop:6}}><I n="alert-circle" s={12} c="var(--teal)"/>Use ponto (.) como separador decimal. Ex: 14.40</div>
                  </div>
                )}
              </div>
            </CF>}
            {hasVideo&&<CF l="CPCV Negociado">
              <div style={{display:"flex",flexDirection:"column",gap:8}}>
                <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                  {["0.90","0.36","0.18"].map(v=>(
                    <span key={v} className={`chip${f.cpcv===v?" sel":""}`} style={{fontSize:12,padding:"6px 14px"}} onClick={()=>set("cpcv",v)}>R$ {v}</span>
                  ))}
                  <span className={`chip${f.cpcv&&!["0.90","0.36","0.18"].includes(f.cpcv)?" sel":""}`} style={{fontSize:12,padding:"6px 14px"}} onClick={()=>set("cpcv","custom")}>Outro</span>
                </div>
                {f.cpcv&&!["0.90","0.36","0.18"].includes(f.cpcv)&&(
                  <div>
                    <input className="fi" placeholder="Ex: 0.45" value={f.cpcv==="custom"?"":f.cpcv} onChange={e=>set("cpcv",e.target.value)}/>
                    <div className="disc" style={{marginTop:6}}><I n="alert-circle" s={12} c="var(--teal)"/>Use ponto (.) como separador decimal. Ex: 0.36</div>
                  </div>
                )}
              </div>
            </CF>}
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

          {/* Estudos disponíveis */}
          <CF l="Estudos disponíveis">
            {availableStudies.filter(s=>s.status==="Feito").length===0?(
              <div style={{fontSize:12,color:"var(--t3)",padding:"8px 0"}}>Nenhum estudo disponível no momento.</div>
            ):(
              <div style={{display:"flex",flexDirection:"column",gap:8}}>
                <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
                  {availableStudies.filter(s=>s.status==="Feito").map(s=>{
                    const isSel=(f.selected_studies||[]).some(x=>x.name===s.name);
                    return(
                      <span key={s.name} className={`chip${isSel?" sel":""}`} style={{fontSize:11,padding:"4px 12px"}}
                        onClick={()=>sF(p=>{const arr=p.selected_studies||[];return{...p,selected_studies:isSel?arr.filter(x=>x.name!==s.name):[...arr,s]}})}>
                        {s.name}
                      </span>
                    );
                  })}
                </div>
                {(f.selected_studies||[]).length>0&&(
                  <div style={{padding:12,background:"var(--bg3)",borderRadius:"var(--r)",border:"1px solid var(--bdr)"}}>
                    <div style={{fontSize:11,color:"var(--t3)",textTransform:"uppercase",fontWeight:700,marginBottom:8}}>Estudos Selecionados ({(f.selected_studies||[]).length})</div>
                    {(f.selected_studies||[]).map(s=>(
                      <div key={s.name} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"6px 0",borderBottom:"1px solid var(--bdr)"}}>
                        <div>
                          <span style={{fontSize:12,fontWeight:600,color:"var(--t1)"}}>{s.name}</span>
                          <span style={{fontSize:11,color:"var(--t3)",marginLeft:8}}>CS: {s.cs}</span>
                          {s.delivery&&<span style={{fontSize:11,color:"var(--t3)",marginLeft:8}}>Entrega: {s.delivery}</span>}
                        </div>
                        {s.link&&<a href={s.link} target="_blank" rel="noreferrer" className="btn bs" style={{fontSize:10,padding:"2px 8px",textDecoration:"none"}}><I n="external" s={11}/>Ver</a>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </CF>

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
            {f.praças_type==="Estado"&&<div style={{marginTop:10}}>
              <div style={{display:"flex",gap:6,marginBottom:8,flexWrap:"wrap"}}>
                {Object.entries(BRAZIL_REGIONS).map(([region,states])=>(
                  <button key={region} className="btn bs" style={{fontSize:10,padding:"3px 10px"}} onClick={()=>sF(p=>{const current=p.praças_states||[];const allSelected=states.every(s=>current.includes(s));return{...p,praças_states:allSelected?current.filter(s=>!states.includes(s)):[...new Set([...current,...states])]}})}>
                    {region}
                  </button>
                ))}
                <button className="btn bs" style={{fontSize:10,padding:"3px 10px"}} onClick={()=>sF(p=>({...p,praças_states:[...BRAZIL_STATES]}))}>Todos</button>
                <button className="btn bg" style={{fontSize:10,padding:"3px 10px"}} onClick={()=>sF(p=>({...p,praças_states:[]}))}>Limpar</button>
              </div>
              <div style={{display:"flex",flexWrap:"wrap",gap:6}}>{BRAZIL_STATES.map(s=><span key={s} className={`chip${(f.praças_states||[]).includes(s)?" sel":""}`} style={{fontSize:11,padding:"3px 10px"}} onClick={()=>sF(p=>({...p,praças_states:(p.praças_states||[]).includes(s)?(p.praças_states||[]).filter(x=>x!==s):[...(p.praças_states||[]),s]}))}>{s}</span>)}</div>
              {(f.praças_states||[]).length>0&&<div style={{fontSize:11,color:"var(--teal)",marginTop:6}}>{(f.praças_states||[]).length} estado{(f.praças_states||[]).length>1?"s":""} selecionado{(f.praças_states||[]).length>1?"s":""}</div>}
            </div>}
            {f.praças_type==="Cidade"&&<div style={{marginTop:10,display:"flex",flexDirection:"column",gap:10}}>
              <button className="btn bs" style={{fontSize:11,alignSelf:"flex-start"}} onClick={()=>sF(p=>({...p,praças_cities:[...new Set([...(p.praças_cities||[]),...BRAZIL_CAPITALS])]}))}>
                <I n="zap" s={12}/>Todas as Capitais
              </button>
              <div className="g2" style={{gap:10}}>
                <select className="fs" value={f.praças_city_state||""} onChange={e=>set("praças_city_state",e.target.value)}><option value="">Estado...</option>{BRAZIL_STATES.map(s=><option key={s}>{s}</option>)}</select>
                <div style={{display:"flex",gap:6}}><input className="fi" placeholder="Nome da cidade" value={f.praças_city_input||""} onChange={e=>set("praças_city_input",e.target.value)} onKeyDown={e=>{if(e.key==="Enter"&&f.praças_city_input&&f.praças_city_state){e.preventDefault();const city=`${f.praças_city_input} (${f.praças_city_state})`;sF(p=>({...p,praças_cities:[...(p.praças_cities||[]),city],praças_city_input:""}))}}}/><button className="btn bs" style={{fontSize:11,whiteSpace:"nowrap"}} onClick={()=>{if(f.praças_city_input&&f.praças_city_state){const city=`${f.praças_city_input} (${f.praças_city_state})`;sF(p=>({...p,praças_cities:[...(p.praças_cities||[]),city],praças_city_input:""}))}}}><I n="plus" s={12}/>Adicionar</button></div>
              </div>
              {(f.praças_cities||[]).length>0&&<div>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}}>
                  <span style={{fontSize:11,color:"var(--teal)"}}>{(f.praças_cities||[]).length} cidade{(f.praças_cities||[]).length>1?"s":""}</span>
                  <button className="btn bg" style={{fontSize:10,padding:"2px 8px"}} onClick={()=>sF(p=>({...p,praças_cities:[]}))}>Limpar</button>
                </div>
                <div style={{display:"flex",flexWrap:"wrap",gap:6}}>{(f.praças_cities||[]).map((c,i)=><span key={i} className="chip sel" style={{fontSize:11,padding:"3px 10px",display:"flex",gap:4,alignItems:"center"}}>{c}<span style={{cursor:"pointer",fontWeight:700}} onClick={()=>sF(p=>({...p,praças_cities:(p.praças_cities||[]).filter((_,j)=>j!==i)}))}>×</span></span>)}</div>
              </div>}
            </div>}
            {f.praças_type==="Outro"&&<input className="fi" style={{marginTop:10}} placeholder="Descreva..." value={f.praças_other} onChange={e=>set("praças_other",e.target.value)}/>}
          </CF>
          <CF l="Reunião pré-campanha com CS?" req><RG row opts={["Sim","Não"]} val={f.had_cs_meeting} onChange={v=>set("had_cs_meeting",v)}/></CF>
        </div>
      </Sec>

      <Sec title="5. Links e Documentos">
        <div style={{display:"flex",flexDirection:"column",gap:18}}>
          <CF l="Link das peças" req><input className="fi" placeholder="Link do Drive..." value={f.pecas_link} onChange={e=>set("pecas_link",e.target.value)}/><div style={{marginTop:8,display:"flex",alignItems:"center",gap:12,flexWrap:"wrap"}}><a href="https://drive.google.com/drive/folders/1wVsxLY9EsKihkEE6ceTiF07rpf5aVX-t" target="_blank" rel="noopener noreferrer" style={{display:"inline-flex",alignItems:"center",gap:6,fontSize:12,fontWeight:600,color:"var(--teal)",textDecoration:"none",padding:"6px 10px",borderRadius:"var(--r)",background:"var(--teal-dim)",border:"1px solid var(--teal)"}}><I n="folder" s={13}/>Pasta de upload de peças<I n="external" s={11}/></a><div className="disc" style={{margin:0}}><I n="alert-triangle" s={13} c="var(--yellow)"/>Verificar peso máximo das peças.</div></div></CF>
          <CF l="URLs de direcionamento" req><div style={{display:"flex",flexDirection:"column",gap:8}}>{f.extra_urls.map((u,i)=><div key={i} style={{display:"flex",gap:8}}><input className="fi" placeholder="https://..." value={u} onChange={e=>{const a=[...f.extra_urls];a[i]=e.target.value;set("extra_urls",a)}}/>{f.extra_urls.length>1&&<button className="btn bg" onClick={()=>set("extra_urls",f.extra_urls.filter((_,j)=>j!==i))}><I n="x" s={14}/></button>}</div>)}<button className="btn bs" style={{alignSelf:"flex-start",fontSize:12}} onClick={()=>set("extra_urls",[...f.extra_urls,""])}><I n="plus" s={12}/>Adicionar URL</button></div></CF>
          <CF l="Link do PI" req><input className="fi" value={f.pi_link} onChange={e=>set("pi_link",e.target.value)}/><div style={{marginTop:8}}><a href="https://drive.google.com/drive/folders/19oeOni4mwJHSnt7GSP5tTpW8xM-hIslx" target="_blank" rel="noopener noreferrer" style={{display:"inline-flex",alignItems:"center",gap:6,fontSize:12,fontWeight:600,color:"var(--teal)",textDecoration:"none",padding:"6px 10px",borderRadius:"var(--r)",background:"var(--teal-dim)",border:"1px solid var(--teal)"}}><I n="folder" s={13}/>Pasta de faturamento (PIs)<I n="external" s={11}/></a></div></CF>
          <CF l="Link da Proposta" req><input className="fi" value={f.proposta_link} onChange={e=>set("proposta_link",e.target.value)}/></CF>
        </div>
      </Sec>

      <Sec title="6. Observações e Ação de Marketing">
        <div style={{display:"flex",flexDirection:"column",gap:18}}>
          <CF l="Ação de Marketing (opcional)">
            <select className="fs" value={f.marketing_action&&!MARKETING_ACTIONS.includes(f.marketing_action)?"__outro__":f.marketing_action} onChange={e=>{const v=e.target.value;set("marketing_action",v==="__outro__"?" ":v)}}>
              <option value="">Nenhuma</option>
              {MARKETING_ACTIONS.map(a=><option key={a} value={a}>{a}</option>)}
              <option value="__outro__">Outro</option>
            </select>
            {f.marketing_action&&!MARKETING_ACTIONS.includes(f.marketing_action)&&(
              <input className="fs" type="text" placeholder="Descreva a ação de marketing" value={f.marketing_action.trim()===""?"":f.marketing_action} onChange={e=>set("marketing_action",e.target.value||" ")} style={{marginTop:8}}/>
            )}
            <div className="disc" style={{marginTop:6}}><I n="alert-circle" s={12} c="var(--teal)"/>Selecione apenas se a campanha está vinculada a uma ação de marketing específica.</div>
          </CF>
          <CF l="Observações (opcional)">
            <textarea className="ft" rows={4} placeholder="Inclua aqui qualquer observação relevante sobre a campanha: contexto do cliente, alinhamentos prévios, sensibilidades, pedidos específicos do CP, etc."
              value={f.observations} onChange={e=>set("observations",e.target.value)}
              style={{width:"100%",fontSize:13,lineHeight:1.5,resize:"vertical",minHeight:90}}/>
            <div className="disc" style={{marginTop:8}}><I n="alert-triangle" s={13} c="var(--yellow)"/>Essas observações ficam visíveis para o CS responsável e para o time de Client Services.</div>
          </CF>
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
      <div className="card page-sticky-footer" style={{padding:20,display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:12}}>
        <span style={{fontSize:12,color:"var(--t3)"}}>Verifique todas as informações antes de enviar.</span>
        <div style={{display:"flex",gap:8}}>
          <button className="btn bs" onClick={handleReset}><I n="rotate" s={14}/>Limpar</button>
          <button className="btn bp" onClick={handleSubmit}><I n="send" s={14}/>Enviar Checklist</button>
        </div>
      </div>

      {/* Required Fields Error Modal */}
      {requiredErrors&&(
        <div className="mo" onClick={e=>e.target===e.currentTarget&&setRequiredErrors(null)}>
          <div className="ml" style={{maxWidth:560}}>
            <div className="mh" style={{background:"rgba(239,68,68,0.08)",borderBottom:"2px solid var(--red)"}}>
              <div style={{display:"flex",alignItems:"center",gap:10}}>
                <div style={{width:36,height:36,borderRadius:"50%",background:"var(--red)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                  <I n="alert-triangle" s={18} c="#fff"/>
                </div>
                <div>
                  <div style={{fontFamily:"var(--fd)",fontSize:16,fontWeight:800,color:"var(--t1)"}}>Campos obrigatórios não preenchidos</div>
                  <div style={{fontSize:12,color:"var(--t2)",marginTop:2}}>Preencha os campos abaixo antes de enviar o checklist.</div>
                </div>
              </div>
              <button className="btn bg" onClick={()=>setRequiredErrors(null)} style={{padding:"6px 10px"}}><I n="x" s={16}/></button>
            </div>
            <div className="mb" style={{padding:"18px 22px",maxHeight:"60vh",overflowY:"auto"}}>
              {(() => {
                // Agrupa por seção
                const bySection = {};
                requiredErrors.forEach(e => { (bySection[e.section] = bySection[e.section] || []).push(e.label); });
                return Object.entries(bySection).map(([section,labels],i) => (
                  <div key={i} style={{marginBottom:14}}>
                    <div style={{fontFamily:"var(--fd)",fontSize:12,fontWeight:700,color:"var(--teal)",textTransform:"uppercase",letterSpacing:".06em",marginBottom:6}}>{section}</div>
                    <ul style={{margin:0,paddingLeft:18,fontSize:13,color:"var(--t1)",lineHeight:1.7}}>
                      {labels.map((l,j)=><li key={j}>{l}</li>)}
                    </ul>
                  </div>
                ));
              })()}
            </div>
            <div className="mf modal-sticky-footer" style={{display:"flex",justifyContent:"flex-end",gap:8,padding:"12px 22px",borderTop:"1px solid var(--bdr)"}}>
              <button className="btn bp" onClick={()=>setRequiredErrors(null)}><I n="check" s={14}/>Entendi</button>
            </div>
          </div>
        </div>
      )}

      {/* Validation Error Modal */}
      {validationError&&(
        <div className="mo" onClick={e=>e.target===e.currentTarget&&setValidationError(null)}>
          <div className="ml" style={{maxWidth:600}}>
            <div className="mh" style={{background:"rgba(239,68,68,0.08)",borderBottom:"2px solid var(--red)"}}>
              <div style={{display:"flex",alignItems:"center",gap:10}}>
                <div style={{width:40,height:40,borderRadius:"50%",background:"rgba(239,68,68,0.15)",display:"flex",alignItems:"center",justifyContent:"center"}}><I n="alert-triangle" s={20} c="var(--red)"/></div>
                <div>
                  <div className="mt" style={{color:"var(--red)"}}>Investimento não bate com volumetria</div>
                  <div style={{fontSize:12,color:"var(--t3)",marginTop:2}}>Ajuste os valores antes de enviar</div>
                </div>
              </div>
              <button className="btn bg" onClick={()=>setValidationError(null)}><I n="x" s={18}/></button>
            </div>
            <div className="mb">
              <div style={{display:"flex",flexDirection:"column",gap:16}}>
                {/* Summary */}
                <div className="g2" style={{gap:12}}>
                  <div style={{padding:14,background:"var(--bg3)",borderRadius:"var(--r)",textAlign:"center"}}>
                    <div style={{fontSize:11,color:"var(--t3)",textTransform:"uppercase",fontWeight:700,marginBottom:4}}>Investimento Informado</div>
                    <div style={{fontSize:20,fontWeight:800,fontFamily:"var(--fd)",color:"var(--t1)"}}>R$ {validationError.investment.toLocaleString("pt-BR",{minimumFractionDigits:2})}</div>
                  </div>
                  <div style={{padding:14,background:validationError.diff>0?"rgba(239,68,68,0.06)":"rgba(239,68,68,0.06)",borderRadius:"var(--r)",textAlign:"center",border:"1px solid var(--red)"}}>
                    <div style={{fontSize:11,color:"var(--t3)",textTransform:"uppercase",fontWeight:700,marginBottom:4}}>Investimento Calculado</div>
                    <div style={{fontSize:20,fontWeight:800,fontFamily:"var(--fd)",color:"var(--red)"}}>R$ {validationError.totalCalc.toLocaleString("pt-BR",{minimumFractionDigits:2})}</div>
                  </div>
                </div>

                {/* Difference */}
                <div style={{padding:12,background:"rgba(239,68,68,0.06)",borderRadius:"var(--r)",border:"1px solid rgba(239,68,68,0.2)",textAlign:"center"}}>
                  <span style={{fontSize:13,fontWeight:700,color:"var(--red)"}}>
                    Diferença: R$ {Math.abs(validationError.diff).toLocaleString("pt-BR",{minimumFractionDigits:2})}
                    {validationError.diff>0?" (volumetria acima do investimento)":" (volumetria abaixo do investimento)"}
                  </span>
                </div>

                {/* Detail breakdown */}
                <div>
                  <div style={{fontSize:12,fontWeight:700,color:"var(--t1)",marginBottom:8}}>Detalhamento do cálculo:</div>
                  {validationError.details.map((d,i)=>(
                    <div key={i} style={{padding:"8px 12px",background:"var(--bg3)",borderRadius:"var(--r)",marginBottom:6,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                      <div>
                        <span style={{fontSize:12,fontWeight:600,color:"var(--t1)"}}>{d.product} — {d.type}</span>
                        <div style={{fontSize:11,color:"var(--t3)",marginTop:2}}>{d.formula}</div>
                      </div>
                      <span style={{fontSize:13,fontWeight:700,color:"var(--t1)"}}>R$ {d.value.toLocaleString("pt-BR",{minimumFractionDigits:2})}</span>
                    </div>
                  ))}
                  {validationError.totalDisplay>0&&validationError.totalVideo>0&&(
                    <div style={{display:"flex",gap:12,marginTop:8}}>
                      <div style={{flex:1,padding:8,background:"var(--bg3)",borderRadius:"var(--r)",textAlign:"center"}}>
                        <div style={{fontSize:10,color:"var(--t3)"}}>Total Display</div>
                        <div style={{fontSize:12,fontWeight:700}}>R$ {validationError.totalDisplay.toLocaleString("pt-BR",{minimumFractionDigits:2})}</div>
                      </div>
                      <div style={{flex:1,padding:8,background:"var(--bg3)",borderRadius:"var(--r)",textAlign:"center"}}>
                        <div style={{fontSize:10,color:"var(--t3)"}}>Total Video</div>
                        <div style={{fontSize:12,fontWeight:700}}>R$ {validationError.totalVideo.toLocaleString("pt-BR",{minimumFractionDigits:2})}</div>
                      </div>
                    </div>
                  )}
                </div>

                <div style={{display:"flex",flexDirection:"column",gap:8,marginTop:4}}>
                  <div style={{fontSize:12,fontWeight:700,color:"var(--t1)",textAlign:"center"}}>Como deseja corrigir?</div>
                  <div style={{display:"flex",gap:8,justifyContent:"center",flexWrap:"wrap"}}>
                    <button className="btn bs" onClick={()=>setValidationError(null)}>
                      <I n="file-text" s={14}/>Corrigir Manualmente
                    </button>
                    <button className="btn bp" onClick={()=>{
                      set("investment",String(Math.round(validationError.totalCalc*100)/100));
                      setValidationError(null);
                      toast(`Investimento ajustado para R$ ${validationError.totalCalc.toLocaleString("pt-BR",{minimumFractionDigits:2})}`);
                    }}>
                      <I n="dollar" s={14}/>Ajustar Investimento
                    </button>
                    <button className="btn bp" style={{background:"var(--green)"}} onClick={()=>{
                      const inv=parseFloat(f.investment)||0;
                      const calc=validationError.totalCalc;
                      if(calc===0){setValidationError(null);return;}
                      const ratio=inv/calc;
                      const updates={};
                      const cpm=parseFloat(f.cpm)||0;
                      const cpcv=parseFloat(f.cpcv)||0;
                      (f.products||[]).forEach(prod=>{
                        const imp=parseFloat(f[`${prod}_imp`])||0;
                        const views=parseFloat(f[`${prod}_views`])||0;
                        if(imp>0&&cpm>0) updates[`${prod}_imp`]=String(Math.round(imp*ratio));
                        if(views>0&&cpcv>0) updates[`${prod}_views`]=String(Math.round(views*ratio));
                      });
                      sF(p=>({...p,...updates}));
                      setValidationError(null);
                      toast("Volumetria ajustada proporcionalmente");
                    }}>
                      <I n="trending-up" s={14}/>Ajustar Volumetria
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
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
function ChecklistCenter({checklists,setChecklists,onDuplicate,onRefetch}) {
  const user = useAuth();
  const team = useTeam();
  const myRole = teamRoleOf(team.members, user?.email);
  const initialScope = (myRole === 'cs' || myRole === 'sales' || myRole === 'cp') ? 'mine' : 'all';
  const [scope,setScope] = useState(initialScope);
  const [selected,setSelected]=useState(null);
  const [editing,setEditing]=useState(false);
  const [editData,setEditData]=useState(null);
  const [search,setSearch]=useState("");
  const [monthFilter,setMonthFilter]=useState("all"); // "all" | "YYYY-MM"
  const [yearFilter,setYearFilter]=useState("all");   // "all" | "YYYY"
  const [filterCS,setFilterCS]=useState(""); // email do CS responsável
  const [filterCP,setFilterCP]=useState(""); // email do CP que enviou
  const [collapsedMonths,setCollapsedMonths]=useState({});
  const [deleteConfirm,setDeleteConfirm]=useState(null); // checklist sendo deletado
  const [csList,setCsList]=useState([]); // [{name,email}] derivado de CS_LIST + checklists existentes
  const toast=useToast();

  // Lista de CS pro dropdown do editar — sem depender de /team (que retorna 404)
  // Fonte: CS_LIST hardcoded (sem Greenfield/SA), com email extraído dos checklists existentes
  // ou montado pelo padrão nome.sobrenome@hypr.mobi
  useEffect(()=>{
    const nameToEmail = new Map();
    checklists.forEach(c=>{
      const n = c.cs_name;
      const e = c.cs_email;
      if(n && e && !nameToEmail.has(n)) nameToEmail.set(n, e);
    });
    const slugEmail = name => {
      const slug = name.toLowerCase()
        .normalize("NFD").replace(/[\u0300-\u036f]/g,"")
        .replace(/[^a-z\s]/g,"")
        .trim().split(/\s+/).join(".");
      return `${slug}@hypr.mobi`;
    };
    const list = CS_LIST
      .filter(n => n !== "Greenfield" && n !== "Solutions Architect")
      .map(name => ({ name, email: nameToEmail.get(name) || slugEmail(name) }));
    setCsList(list);
  },[checklists]);

  const now = new Date();

  // Recalcula scope inicial quando time carrega
  useEffect(()=>{
    if (!team.members.length || !user?.email) return;
    const r = teamRoleOf(team.members, user.email);
    if (r === 'cs' || r === 'sales' || r === 'cp') setScope('mine');
    else setScope('all');
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[team.members.length, user?.email]);

  // Listas únicas pra dropdowns de CS e CP (a partir dos checklists existentes)
  const csOptions = useMemo(()=>{
    const m = new Map();
    checklists.forEach(c=>{ if(c.cs_email && c.cs_name) m.set(c.cs_email.toLowerCase(), c.cs_name); });
    return [...m.entries()].sort((a,b)=>a[1].localeCompare(b[1]));
  },[checklists]);
  const cpOptions = useMemo(()=>{
    const m = new Map();
    checklists.forEach(c=>{
      const e = c.submitted_by_email || c.submittedByEmail || c.cp_email;
      const n = c.submitted_by || c.submittedBy || c.cp_name;
      if (e && n) m.set(e.toLowerCase(), n);
    });
    return [...m.entries()].sort((a,b)=>a[1].localeCompare(b[1]));
  },[checklists]);

  const filtered=useMemo(()=>{
    const q=search.toLowerCase();
    return checklists.filter(c=>{
      // Scope "minhas": eu sou CP que enviou OU CS responsável
      if (scope === 'mine' && !checklistOwnedBy(c, user?.email)) return false;
      if (filterCS && (c.cs_email||'').toLowerCase() !== filterCS.toLowerCase()) return false;
      const cpEmail = (c.submitted_by_email || c.submittedByEmail || c.cp_email || '').toLowerCase();
      if (filterCP && cpEmail !== filterCP.toLowerCase()) return false;
      if(q && !(c.client?.toLowerCase().includes(q)||c.campaign_name?.toLowerCase().includes(q)||c.agency?.toLowerCase().includes(q))) return false;
      const d = parseLocalDate(c.start_date);
      if(!d) return monthFilter==="all" && yearFilter==="all";
      if(yearFilter!=="all" && String(d.getFullYear())!==yearFilter) return false;
      if(monthFilter!=="all"){
        const key = `${d.getFullYear()}-${String(d.getMonth()).padStart(2,"0")}`;
        if(key!==monthFilter) return false;
      }
      return true;
    });
  },[checklists,scope,user?.email,search,monthFilter,yearFilter,filterCS,filterCP]);

  // KPIs (calculados sobre as ATIVAS dentro do filtro)
  const kpis = useMemo(() => {
    const activeArr = filtered.filter(c => {
      const s = parseLocalDate(c.start_date);
      const e = parseLocalDate(c.end_date);
      if (!s || !e) return false;
      return now >= s && now <= e;
    });
    const clients = new Set();
    let inv = 0;
    activeArr.forEach(c => {
      if (c.client) clients.add(String(c.client).trim());
      inv += parseFloat(c.investment)||0;
    });
    return {
      activeCampaigns: activeArr.length,
      uniqueClients: clients.size,
      ticketByClient:   clients.size ? inv/clients.size : 0,
      ticketByCampaign: activeArr.length ? inv/activeArr.length : 0,
    };
  }, [filtered]);

  // Agrupamento mensal por start_date — newest first
  const monthlyGroups = useMemo(() => {
    const map = {};
    const undated = [];
    filtered.forEach(c => {
      const d = parseLocalDate(c.start_date);
      if (!d) { undated.push(c); return; }
      const key = `${d.getFullYear()}-${String(d.getMonth()).padStart(2,"0")}`;
      if (!map[key]) {
        map[key] = {
          key,
          year: d.getFullYear(),
          month: d.getMonth(),
          label: `${MONTHS_PT[d.getMonth()]} ${d.getFullYear()}`,
          checklists: [],
        };
      }
      map[key].checklists.push(c);
    });
    const groups = Object.values(map).map(g => {
      const clients = new Set();
      let investment = 0;
      let activeCount = 0;
      g.checklists.forEach(c => {
        if (c.client) clients.add(String(c.client).trim());
        investment += parseFloat(c.investment)||0;
        const s = parseLocalDate(c.start_date);
        const e = parseLocalDate(c.end_date);
        if (s && e && now >= s && now <= e) activeCount++;
      });
      g.checklists.sort((a,b)=>{
        const da = parseLocalDate(a.start_date)?.getTime()||0;
        const db = parseLocalDate(b.start_date)?.getTime()||0;
        return db - da;
      });
      return {
        ...g,
        campaigns: g.checklists.length,
        activeCount,
        uniqueClients: clients.size,
        investment,
        ticketByCampaign: g.checklists.length ? investment/g.checklists.length : 0,
        ticketByClient: clients.size ? investment/clients.size : 0,
      };
    });
    groups.sort((a,b) => (b.year - a.year) || (b.month - a.month));
    if (undated.length) {
      groups.push({
        key:"sem-data", year:0, month:0, label:"Sem data de início",
        checklists: undated,
        campaigns: undated.length,
        activeCount: 0,
        uniqueClients: new Set(undated.map(c=>c.client).filter(Boolean)).size,
        investment: undated.reduce((s,c)=>s+(parseFloat(c.investment)||0),0),
        ticketByCampaign: 0, ticketByClient: 0,
      });
    }
    return groups;
  }, [filtered]);

  const availableYears = useMemo(()=>{
    const s = new Set();
    checklists.forEach(c=>{
      const d = parseLocalDate(c.start_date);
      if(d) s.add(d.getFullYear());
    });
    return [...s].sort((a,b)=>b-a);
  },[checklists]);

  const availableMonths = useMemo(()=>{
    const m = new Map();
    checklists.forEach(c=>{
      const d = parseLocalDate(c.start_date);
      if(!d) return;
      if(yearFilter!=="all" && String(d.getFullYear())!==yearFilter) return;
      const key = `${d.getFullYear()}-${String(d.getMonth()).padStart(2,"0")}`;
      m.set(key, `${MONTHS_PT[d.getMonth()]} ${d.getFullYear()}`);
    });
    return [...m.entries()].sort((a,b)=>b[0].localeCompare(a[0]));
  },[checklists,yearFilter]);

  const toggleMonth = (key) => setCollapsedMonths(p=>({...p,[key]:!p[key]}));

  const handleEdit=(c)=>{setEditData({...c});setEditing(true)};
  const handleSave=async()=>{
    const previousData = checklists.find(c=>c.id===editData.id);
    setChecklists(prev=>prev.map(c=>c.id===editData.id?editData:c));
    setSelected(editData);
    setEditing(false);
    toast("Checklist atualizado!");
    try{
      const res = await fetch(`${BACKEND_URL}/checklists/${editData.id}`,{
        method:"PUT",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({
          ...editData,
          marketing_action: (editData.marketing_action||"").trim(),
          editedBy: user?.name,
          editedByEmail: user?.email,
          // Mandar quem era o CS antes pra backend notificar se mudou
          previousCsEmail: previousData?.cs_email || null,
          previousCsName:  previousData?.cs_name  || null,
        })
      });
      if(!res.ok){
        let msg = `Erro ${res.status}`;
        try{ const body = await res.json(); if(body?.error) msg=body.error; }catch(_){}
        if(previousData) setChecklists(prev=>prev.map(c=>c.id===editData.id?previousData:c));
        toast(msg);
        console.error("Backend checklist PUT failed:",res.status,msg);
      } else if(onRefetch){
        setTimeout(onRefetch,500);
      }
    }catch(err){
      if(previousData) setChecklists(prev=>prev.map(c=>c.id===editData.id?previousData:c));
      toast("Erro ao salvar — alteração revertida");
      console.error("Backend checklist PUT error:",err);
    }
  };

  const handleDelete=async(c)=>{
    setDeleteConfirm(null);
    // remoção otimista
    setChecklists(prev=>prev.filter(x=>x.id!==c.id));
    if(selected?.id===c.id){ setSelected(null); setEditing(false); }
    toast("Excluindo checklist...");
    try{
      const res = await fetch(`${BACKEND_URL}/checklists/${c.id}`,{
        method:"DELETE",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({ requesterEmail: user?.email })
      });
      if(!res.ok){
        let msg = `Erro ${res.status}`;
        try{ const body = await res.json(); if(body?.error) msg=body.error; }catch(_){}
        // reverte
        setChecklists(prev=>[c,...prev]);
        toast(msg);
        console.error("Backend checklist DELETE failed:",res.status,msg);
      } else {
        toast("Checklist excluído!");
        if(onRefetch) setTimeout(onRefetch,500);
      }
    }catch(err){
      setChecklists(prev=>[c,...prev]);
      toast("Erro ao excluir — restaurado");
      console.error("Backend checklist DELETE error:",err);
    }
  };

  // Detail row helper
  const D=({l,v,wide})=>{
    if(!v||v==="—") return null;
    const isUrl=typeof v==="string"&&(v.startsWith("http://")||v.startsWith("https://"));
    return(
      <div style={{padding:12,background:"var(--bg3)",borderRadius:"var(--r)",gridColumn:wide?"1/-1":"auto"}}>
        <div style={{fontSize:11,color:"var(--t3)",textTransform:"uppercase",fontWeight:700,marginBottom:4}}>{l}</div>
        {isUrl?(
          <a href={v} target="_blank" rel="noreferrer" style={{fontSize:13,color:"var(--teal)",fontWeight:600,wordBreak:"break-all",display:"flex",alignItems:"center",gap:6}}>
            <I n="external" s={12}/>{v}
          </a>
        ):(
          <div style={{fontSize:13,color:"var(--t1)",fontWeight:600,whiteSpace:"pre-wrap"}}>{v}</div>
        )}
      </div>
    );
  };

  // Tags helper
  const Tags=({items,color})=>(items||[]).length>0?(
    <div style={{display:"flex",gap:4,flexWrap:"wrap"}}>
      {items.map(p=><span key={p} style={{padding:"2px 8px",background:color==="teal"?"var(--teal-dim)":"var(--bg3)",color:color==="teal"?"var(--teal-l)":"var(--t2)",borderRadius:99,fontSize:11,fontWeight:600,border:color==="teal"?"1px solid var(--teal)":"1px solid var(--bdr)"}}>{p}</span>)}
    </div>
  ):null;

  const fmtNum=(v)=>v?Number(v).toLocaleString("pt-BR"):"—";

  return(
    <div className="page-enter">
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14,flexWrap:"wrap",gap:12}}>
        <div style={{display:"flex",alignItems:"center",gap:14,flexWrap:"wrap"}}>
          <h2 style={{fontFamily:"var(--fd)",fontSize:18,fontWeight:700}}>Checklists Enviados</h2>
          {/* Toggle Minhas / Todas */}
          <div style={{display:"flex",gap:0,background:"var(--bg3)",border:"1px solid var(--bdr)",borderRadius:"var(--r)",padding:2}}>
            {[{k:"mine",label:"Meus"},{k:"all",label:"Todos"}].map(o=>(
              <button key={o.k}
                style={{padding:"6px 14px",border:"none",background:scope===o.k?"var(--bg-card)":"transparent",borderRadius:6,cursor:"pointer",fontSize:11,fontWeight:600,color:scope===o.k?"var(--teal)":"var(--t3)",boxShadow:scope===o.k?"var(--sh-sm)":"none",transition:"all .15s"}}
                onClick={()=>setScope(o.k)}>
                {o.label}
              </button>
            ))}
          </div>
        </div>
        <div style={{display:"flex",gap:8,flexWrap:"wrap",alignItems:"center"}}>
          <select className="fi" style={{padding:"6px 10px",fontSize:12,minWidth:130,width:"auto"}} value={yearFilter} onChange={e=>{setYearFilter(e.target.value);setMonthFilter("all")}}>
            <option value="all">Todos os anos</option>
            {availableYears.map(y=><option key={y} value={y}>{y}</option>)}
          </select>
          <select className="fi" style={{padding:"6px 10px",fontSize:12,minWidth:150,width:"auto"}} value={monthFilter} onChange={e=>setMonthFilter(e.target.value)}>
            <option value="all">Todos os meses</option>
            {availableMonths.map(([k,label])=><option key={k} value={k}>{label}</option>)}
          </select>
          <select className="fi" style={{padding:"6px 10px",fontSize:12,minWidth:140,width:"auto"}} value={filterCS} onChange={e=>setFilterCS(e.target.value)}>
            <option value="">Todos os CS</option>
            {csOptions.map(([email,name])=><option key={email} value={email}>{shortName(name)}</option>)}
          </select>
          <select className="fi" style={{padding:"6px 10px",fontSize:12,minWidth:140,width:"auto"}} value={filterCP} onChange={e=>setFilterCP(e.target.value)}>
            <option value="">Todos os CP</option>
            {cpOptions.map(([email,name])=><option key={email} value={email}>{shortName(name)}</option>)}
          </select>
          <div style={{position:"relative",minWidth:180,maxWidth:260}}>
            <I n="search" s={13} style={{position:"absolute",left:10,top:"50%",transform:"translateY(-50%)"}} c="var(--t3)"/>
            <input className="fi" style={{paddingLeft:32}} placeholder="Buscar cliente ou campanha..." value={search} onChange={e=>setSearch(e.target.value)}/>
          </div>
        </div>
      </div>

      {/* KPIs */}
      {filtered.length>0 && (
        <div className="g3" style={{marginBottom:20,gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))",gap:12}}>
          {[
            {label:"Campanhas Ativas",value:kpis.activeCampaigns,icon:"zap",color:"var(--green)",sub:"no período filtrado"},
            {label:"Clientes Ativos",value:kpis.uniqueClients,icon:"users",color:"var(--teal)",sub:"sem duplicar"},
            {label:"Tkt Médio / Anunciante",value:fmtCompact(kpis.ticketByClient),icon:"dollar",color:"var(--teal-l)",sub:fmtCurrency(kpis.ticketByClient)},
            {label:"Tkt Médio / Campanha",value:fmtCompact(kpis.ticketByCampaign),icon:"dollar",color:"var(--teal-l)",sub:fmtCurrency(kpis.ticketByCampaign)},
          ].map(s=>(
            <div key={s.label} className="card" style={{padding:"14px 16px"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
                <span style={{fontSize:10,fontWeight:700,textTransform:"uppercase",letterSpacing:".06em",color:"var(--t3)"}}>{s.label}</span>
                <div style={{width:28,height:28,borderRadius:8,background:`${s.color}15`,display:"flex",alignItems:"center",justifyContent:"center"}}>
                  <I n={s.icon} s={14} c={s.color} />
                </div>
              </div>
              <div style={{fontSize:22,fontWeight:800,fontFamily:"var(--fd)",color:s.color,marginBottom:2}}>{s.value}</div>
              <div style={{fontSize:10,color:"var(--t3)"}}>{s.sub}</div>
            </div>
          ))}
        </div>
      )}

      {filtered.length===0?(
        <div className="card"><div className="empty"><I n="clipboard" s={40} c="var(--t3)"/><h3 style={{fontFamily:"var(--fd)",fontSize:15,color:"var(--t2)"}}>Nenhum checklist encontrado</h3></div></div>
      ):(
        <div style={{display:"flex",flexDirection:"column",gap:18}}>
          {monthlyGroups.map(g=>{
            const collapsed = collapsedMonths[g.key];
            return (
              <div key={g.key} className="card" style={{padding:0,overflow:"hidden"}}>
                {/* Month header */}
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:12,flexWrap:"wrap",cursor:"pointer",padding:"14px 18px",borderBottom:collapsed?"none":"1px solid var(--bdr)"}} onClick={()=>toggleMonth(g.key)}>
                  <div style={{display:"flex",alignItems:"center",gap:10}}>
                    <I n="chevron-down" s={16} c="var(--t2)" style={{transform:collapsed?"rotate(-90deg)":"none",transition:"transform .15s"}}/>
                    <div>
                      <div style={{fontSize:15,fontWeight:800,fontFamily:"var(--fd)",color:"var(--t1)",textTransform:"capitalize"}}>{g.label}</div>
                      <div style={{fontSize:11,color:"var(--t3)",marginTop:2}}>
                        {g.campaigns} campanha{g.campaigns!==1?"s":""} • {g.uniqueClients} cliente{g.uniqueClients!==1?"s":""} • {fmtCurrency(g.investment)}
                        {g.activeCount>0 && <> • <span style={{color:"var(--green)",fontWeight:700}}>{g.activeCount} ativa{g.activeCount>1?"s":""}</span></>}
                      </div>
                    </div>
                  </div>
                  <div style={{display:"flex",gap:14,alignItems:"center",flexWrap:"wrap"}}>
                    <div style={{textAlign:"right"}}>
                      <div style={{fontSize:9,color:"var(--t3)",textTransform:"uppercase",fontWeight:700,letterSpacing:".04em"}}>Tkt / Anunciante</div>
                      <div style={{fontSize:12,fontWeight:700,color:"var(--teal)"}}>{fmtCurrency(g.ticketByClient)}</div>
                    </div>
                    <div style={{textAlign:"right"}}>
                      <div style={{fontSize:9,color:"var(--t3)",textTransform:"uppercase",fontWeight:700,letterSpacing:".04em"}}>Tkt / Campanha</div>
                      <div style={{fontSize:12,fontWeight:700,color:"var(--teal)"}}>{fmtCurrency(g.ticketByCampaign)}</div>
                    </div>
                  </div>
                </div>

                {/* Table */}
                {!collapsed && (
                  <div style={{overflowX:"auto"}}>
                    <table className="cl-table" style={{width:"100%",borderCollapse:"collapse",fontSize:13}}>
                      <thead>
                        <tr style={{borderBottom:"1px solid var(--bdr)",background:"var(--bg3)"}}>
                          <th style={{textAlign:"left",padding:"10px 14px",fontSize:10,fontWeight:700,color:"var(--t3)",textTransform:"uppercase",letterSpacing:".06em"}}>Cliente</th>
                          <th style={{textAlign:"left",padding:"10px 14px",fontSize:10,fontWeight:700,color:"var(--t3)",textTransform:"uppercase",letterSpacing:".06em"}}>Campanha</th>
                          <th style={{textAlign:"left",padding:"10px 14px",fontSize:10,fontWeight:700,color:"var(--t3)",textTransform:"uppercase",letterSpacing:".06em"}}>Período</th>
                          <th style={{textAlign:"right",padding:"10px 14px",fontSize:10,fontWeight:700,color:"var(--t3)",textTransform:"uppercase",letterSpacing:".06em"}}>Investimento</th>
                          <th style={{textAlign:"left",padding:"10px 14px",fontSize:10,fontWeight:700,color:"var(--t3)",textTransform:"uppercase",letterSpacing:".06em"}}>Produtos</th>
                          <th style={{textAlign:"left",padding:"10px 14px",fontSize:10,fontWeight:700,color:"var(--t3)",textTransform:"uppercase",letterSpacing:".06em"}}>CS</th>
                          <th style={{textAlign:"left",padding:"10px 14px",fontSize:10,fontWeight:700,color:"var(--t3)",textTransform:"uppercase",letterSpacing:".06em"}}>CP</th>
                          <th style={{textAlign:"center",padding:"10px 14px",fontSize:10,fontWeight:700,color:"var(--t3)",textTransform:"uppercase",letterSpacing:".06em"}}>Status</th>
                          <th style={{textAlign:"center",padding:"10px 14px",fontSize:10,fontWeight:700,color:"var(--t3)",textTransform:"uppercase",letterSpacing:".06em",width:50}}></th>
                        </tr>
                      </thead>
                      <tbody>
                        {g.checklists.map(c=>{
                          const sParsed = parseLocalDate(c.start_date);
                          const eParsed = parseLocalDate(c.end_date);
                          const isActive = sParsed && eParsed && now >= sParsed && now <= eParsed;
                          const isFuture = sParsed && now < sParsed;
                          const status = isActive ? "Ativa" : isFuture ? "Não Iniciada" : "Finalizada";
                          const statusBg = isActive ? "var(--green-bg)" : isFuture ? "var(--yellow-s-bg)" : "var(--bg3)";
                          const statusColor = isActive ? "var(--green)" : isFuture ? "var(--yellow-s)" : "var(--t3)";
                          // Iniciais para avatar
                          const initials = (c.client||"?").substring(0,2).toUpperCase();
                          return (
                            <tr key={c.id}
                              style={{borderBottom:"1px solid var(--bdr-card)",cursor:"pointer",transition:"background .15s"}}
                              onMouseEnter={e=>e.currentTarget.style.background="var(--bg3)"}
                              onMouseLeave={e=>e.currentTarget.style.background="transparent"}
                              onClick={()=>{setSelected(c);setEditing(false)}}>
                              <td data-cell-label="cliente" style={{padding:"12px 14px"}}>
                                <div style={{display:"flex",alignItems:"center",gap:10}}>
                                  <div style={{width:32,height:32,borderRadius:"50%",background:"var(--teal)",color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:700,flexShrink:0}}>{initials}</div>
                                  <div style={{minWidth:0}}>
                                    <div style={{fontSize:13,fontWeight:700,color:"var(--t1)"}}>{c.client||"—"}</div>
                                    {c.agency&&<div style={{fontSize:11,color:"var(--t3)",marginTop:1}}>{c.agency}</div>}
                                  </div>
                                </div>
                              </td>
                              <td data-cell-label="campanha" style={{padding:"12px 14px",color:"var(--t2)",fontSize:12,maxWidth:250}}>
                                <div style={{whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{c.campaign_name||"—"}</div>
                              </td>
                              <td data-cell-label="período" style={{padding:"12px 14px",color:"var(--t2)",fontSize:12,whiteSpace:"nowrap"}}>
                                {fmtDate(c.start_date)} → {fmtDate(c.end_date)}
                              </td>
                              <td data-cell-label="investimento" style={{padding:"12px 14px",textAlign:"right",color:"var(--teal)",fontWeight:700,fontSize:13,whiteSpace:"nowrap"}}>
                                {c.investment?`R$ ${Number(c.investment).toLocaleString("pt-BR")}`:"—"}
                              </td>
                              <td data-cell-label="produtos" style={{padding:"12px 14px"}}>
                                <div style={{display:"flex",gap:4,flexWrap:"wrap"}}>
                                  {(c.products||[]).map(p=>(
                                    <span key={p} style={{padding:"2px 7px",background:"var(--teal-dim)",color:"var(--teal-l)",border:"1px solid var(--teal)",borderRadius:99,fontSize:10,fontWeight:600}}>{p}</span>
                                  ))}
                                </div>
                              </td>
                              <td data-cell-label="cs" style={{padding:"12px 14px",color:"var(--t2)",fontSize:12,whiteSpace:"nowrap"}}>{shortName(c.cs_name)}</td>
                              <td data-cell-label="cp" style={{padding:"12px 14px",color:"var(--t2)",fontSize:12,whiteSpace:"nowrap"}}>{shortName(c.cp_name||c.submittedBy||c.submitted_by)}</td>
                              <td data-cell-label="status" style={{padding:"12px 14px",textAlign:"center"}}>
                                <span className="badge" style={{fontSize:10,whiteSpace:"nowrap",background:statusBg,color:statusColor}}>{status}</span>
                              </td>
                              <td data-cell-label="actions" style={{padding:"12px 8px",textAlign:"center"}}>
                                <button title="Excluir checklist"
                                  style={{background:"transparent",border:"none",padding:6,cursor:"pointer",color:"var(--t3)",borderRadius:6,display:"inline-flex",alignItems:"center",justifyContent:"center",transition:"all .15s"}}
                                  onMouseEnter={e=>{e.currentTarget.style.color="var(--red)";e.currentTarget.style.background="var(--red-bg)"}}
                                  onMouseLeave={e=>{e.currentTarget.style.color="var(--t3)";e.currentTarget.style.background="transparent"}}
                                  onClick={(e)=>{e.stopPropagation();setDeleteConfirm(c)}}>
                                  <I n="trash" s={14}/>
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })}
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
                  {/* Section 1: Informações Gerais */}
                  <div style={{fontFamily:"var(--fd)",fontSize:13,fontWeight:700,color:"var(--t1)",borderBottom:"1px solid var(--bdr)",paddingBottom:6}}>1. Informações Gerais</div>
                  <div className="g2" style={{gap:12}}>
                    <CF l="Cliente"><input className="fi" value={editData.client||""} onChange={e=>setEditData(p=>({...p,client:e.target.value}))}/></CF>
                    <CF l="Campanha"><input className="fi" value={editData.campaign_name||""} onChange={e=>setEditData(p=>({...p,campaign_name:e.target.value}))}/></CF>
                    <CF l="Agência"><input className="fi" value={editData.agency||""} onChange={e=>setEditData(p=>({...p,agency:e.target.value}))}/></CF>
                    <CF l="Tipo"><input className="fi" value={editData.campaign_type||""} onChange={e=>setEditData(p=>({...p,campaign_type:e.target.value}))}/></CF>
                    <CF l="Investimento (R$)"><input type="number" className="fi" value={editData.investment||""} onChange={e=>setEditData(p=>({...p,investment:e.target.value}))}/></CF>
                    <CF l="Indústria"><input className="fi" value={editData.industry||""} onChange={e=>setEditData(p=>({...p,industry:e.target.value}))}/></CF>
                    <CF l="Data Início"><input type="date" className="fi" value={editData.start_date?.value||editData.start_date||""} onChange={e=>setEditData(p=>({...p,start_date:e.target.value}))}/></CF>
                    <CF l="Data Final"><input type="date" className="fi" value={editData.end_date?.value||editData.end_date||""} onChange={e=>setEditData(p=>({...p,end_date:e.target.value}))}/></CF>
                  </div>
                  {/* CS responsável — destacado */}
                  <div style={{padding:14,background:"var(--teal-dim)",borderRadius:"var(--r)",border:"1px solid var(--teal)"}}>
                    <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}>
                      <I n="user" s={14} c="var(--teal)"/>
                      <span style={{fontSize:12,fontWeight:700,color:"var(--teal)",textTransform:"uppercase",letterSpacing:".06em"}}>CS Responsável pelo Setup</span>
                    </div>
                    <select className="fs" style={{width:"100%"}} value={editData.cs_email||""}
                      onChange={e=>{
                        const email=e.target.value;
                        const cs=csList.find(c=>c.email===email);
                        setEditData(p=>({...p,cs_email:email||null,cs_name:cs?.name||null}));
                      }}>
                      <option value="">— Selecione um CS —</option>
                      {csList.map(cs=><option key={cs.email} value={cs.email}>{cs.name} ({cs.email})</option>)}
                    </select>
                    {editData.cs_email && !csList.find(c=>c.email===editData.cs_email) && (
                      <div style={{fontSize:11,color:"var(--yellow-s)",marginTop:6,display:"flex",alignItems:"center",gap:4}}>
                        <I n="alert-circle" s={11} c="var(--yellow-s)"/>
                        CS atual ({editData.cs_name||editData.cs_email}) não está na lista — pode ter saído da equipe.
                      </div>
                    )}
                    <div style={{fontSize:11,color:"var(--t3)",marginTop:6}}>Ao trocar, um e-mail será enviado para o CS atual, o anterior (se houver) e o solicitante.</div>
                  </div>

                  {/* Section: Formatos e Métricas */}
                  <div style={{fontFamily:"var(--fd)",fontSize:13,fontWeight:700,color:"var(--t1)",borderBottom:"1px solid var(--bdr)",paddingBottom:6}}>2. Formatos e Métricas</div>
                  <CF l="Formatos">
                    <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                      {["Display","Video"].map(x=>{
                        const arr=editData.formats||[];
                        const sel=arr.includes(x);
                        return(
                          <span key={x} className={`chip${sel?" sel":""}`} style={{cursor:"pointer"}}
                            onClick={()=>setEditData(p=>{const a=p.formats||[];return{...p,formats:a.includes(x)?a.filter(y=>y!==x):[...a,x]}})}>{x}</span>
                        );
                      })}
                    </div>
                  </CF>
                  <div className="g2" style={{gap:12}}>
                    {(editData.formats||[]).includes("Display")&&(
                      <CF l="CPM Negociado (R$)"><input type="number" step="0.01" className="fi" placeholder="Ex: 14.40" value={editData.cpm||""} onChange={e=>setEditData(p=>({...p,cpm:e.target.value}))}/></CF>
                    )}
                    {(editData.formats||[]).includes("Video")&&(
                      <CF l="CPCV Negociado (R$)"><input type="number" step="0.01" className="fi" placeholder="Ex: 0.36" value={editData.cpcv||""} onChange={e=>setEditData(p=>({...p,cpcv:e.target.value}))}/></CF>
                    )}
                  </div>

                  {/* Section 3: Produtos Core */}
                  <div style={{fontFamily:"var(--fd)",fontSize:13,fontWeight:700,color:"var(--t1)",borderBottom:"1px solid var(--bdr)",paddingBottom:6}}>3. Produtos Core e Volumetria</div>
                  <CF l="Produtos">
                    <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
                      {CHECKLIST_CORE_PRODUCTS.map(prod=>(
                        <span key={prod} className={`chip${(editData.products||[]).includes(prod)?" sel":""}`} style={{fontSize:11}}
                          onClick={()=>setEditData(p=>{const arr=p.products||[];return{...p,products:arr.includes(prod)?arr.filter(x=>x!==prod):[...arr,prod]}})}>
                          {prod}
                        </span>
                      ))}
                    </div>
                  </CF>
                  {(editData.products||[]).map(prod=>(
                    <div key={prod} style={{padding:12,background:"var(--bg3)",borderRadius:"var(--r)",border:"1px solid var(--bdr)"}}>
                      <div style={{fontSize:12,fontWeight:700,color:"var(--teal)",marginBottom:8,textTransform:"uppercase"}}>{prod} — Volumetria Contratada</div>
                      <div className="g2" style={{gap:10}}>
                        <CF l="Impressões Visíveis"><input type="number" className="fi" value={editData[`${prod}_imp`]||""} onChange={e=>setEditData(p=>({...p,[`${prod}_imp`]:e.target.value}))}/></CF>
                        <CF l="Views 100%"><input type="number" className="fi" value={editData[`${prod}_views`]||""} onChange={e=>setEditData(p=>({...p,[`${prod}_views`]:e.target.value}))}/></CF>
                      </div>
                    </div>
                  ))}

                  {/* Bonificações — toggle + cards por produto */}
                  {(editData.products||[]).length>0&&(
                    <CF l="Teremos volumetria bonificada nos produtos core?">
                      <div style={{display:"flex",gap:6}}>
                        {["Sim","Não"].map(opt=>{
                          const cur=editData.has_bonus===true?"Sim":(editData.has_bonus||"");
                          return(
                            <button key={opt} className={`btn ${cur===opt?"bp":"bs"}`} style={{fontSize:11,padding:"4px 12px"}}
                              onClick={()=>setEditData(p=>({...p,has_bonus:opt}))}>{opt}</button>
                          );
                        })}
                      </div>
                    </CF>
                  )}
                  {(editData.has_bonus==="Sim"||editData.has_bonus===true)&&(editData.products||[]).map(prod=>(
                    <div key={prod+"_b"} style={{padding:12,background:"var(--yellow-dim)",borderRadius:"var(--r)",border:"1px solid rgba(237,217,0,0.3)"}}>
                      <div style={{fontSize:12,fontWeight:700,color:"#a07a00",marginBottom:8,textTransform:"uppercase"}}>{prod} — Bonificação</div>
                      <div className="g2" style={{gap:10}}>
                        <CF l="Impressões Bonif."><input type="number" className="fi" value={editData[`${prod}_bonus_imp`]||""} onChange={e=>setEditData(p=>({...p,[`${prod}_bonus_imp`]:e.target.value}))}/></CF>
                        <CF l="Views Bonif."><input type="number" className="fi" value={editData[`${prod}_bonus_views`]||""} onChange={e=>setEditData(p=>({...p,[`${prod}_bonus_views`]:e.target.value}))}/></CF>
                      </div>
                    </div>
                  ))}

                  {/* Section 3: Features (incremento de verba pós-início) */}
                  <div style={{fontFamily:"var(--fd)",fontSize:13,fontWeight:700,color:"var(--t1)",borderBottom:"1px solid var(--bdr)",paddingBottom:6}}>4. Features</div>
                  <div className="disc" style={{fontSize:11}}>
                    <I n="alert-circle" s={13} c="var(--teal)"/>
                    <div>Para incrementos de verba após o início da campanha, marque as novas features e preencha a volumetria adicional.</div>
                  </div>
                  <CF l="Features">
                    <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
                      {ALL_CL_FEATURES.map(feat=>(
                        <span key={feat} className={`chip${(editData.cl_features||[]).includes(feat)?" sel":""}`} style={{fontSize:11}}
                          onClick={()=>setEditData(p=>{const arr=p.cl_features||[];return{...p,cl_features:arr.includes(feat)?arr.filter(x=>x!==feat):[...arr,feat]}})}>
                          {feat}
                        </span>
                      ))}
                    </div>
                  </CF>

                  {/* Volumetria das features selecionadas */}
                  {(editData.cl_features||[]).filter(feat=>FEAT_VOL[feat]).length>0&&(
                    <div style={{padding:14,background:"var(--bg3)",borderRadius:"var(--r)",border:"1px solid var(--bdr)"}}>
                      <div style={{fontSize:12,fontWeight:700,color:"var(--teal)",marginBottom:6,textTransform:"uppercase",letterSpacing:".06em"}}>Volumetria de Features</div>
                      <div className="disc" style={{marginBottom:12,fontSize:11}}>
                        <I n="alert-triangle" s={13} c="var(--yellow-s)"/>
                        <div><strong>Contratada</strong> = entregue dentro do volume contratado nos produtos core. <strong>Bonificada</strong> = volume adicional ao contratado.</div>
                      </div>
                      {(editData.cl_features||[]).filter(feat=>FEAT_VOL[feat]).map(feat=>{
                        const cfg=FEAT_VOL[feat];
                        const volType=editData[`fvol_type_${feat}`]||"contratada";
                        return(
                          <div key={feat} style={{padding:12,background:"var(--bg-card)",borderRadius:"var(--r)",border:"1px solid var(--bdr)",marginBottom:10}}>
                            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10,flexWrap:"wrap",gap:6}}>
                              <span style={{fontSize:13,fontWeight:700,color:"var(--t1)"}}>{feat}</span>
                              <div style={{display:"flex",gap:4}}>
                                {["contratada","bonificada"].map(vt=>(
                                  <button key={vt} className={`btn ${volType===vt?"bp":"bs"}`} style={{fontSize:10,padding:"3px 10px",textTransform:"capitalize"}}
                                    onClick={()=>setEditData(p=>({...p,[`fvol_type_${feat}`]:vt}))}>{vt}</button>
                                ))}
                              </div>
                            </div>
                            <div className="g2" style={{gap:10}}>
                              {cfg.fields.map(field=>(
                                <CF key={field} l={field}>
                                  <input type="number" className="fi" placeholder={feat==="P-DOOH"?"Obrigatório":"Opcional"} value={editData[`fv_${feat}_${field}`]||""} onChange={e=>setEditData(p=>({...p,[`fv_${feat}_${field}`]:e.target.value}))}/>
                                </CF>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Survey / Video Survey */}
                  {(editData.cl_features||[]).filter(feat=>FEAT_TEXT.includes(feat)).map(feat=>(
                    <div key={feat} style={{padding:14,background:"var(--bg3)",borderRadius:"var(--r)",border:"1px solid var(--bdr)"}}>
                      <div style={{fontSize:12,fontWeight:700,color:"var(--teal)",marginBottom:10,textTransform:"uppercase"}}>{feat}</div>
                      <CF l="Perguntas e Respostas">
                        <textarea className="ft" rows={4} placeholder="Inclua as perguntas e opções de resposta..." value={editData[`ftext_${feat}`]||""} onChange={e=>setEditData(p=>({...p,[`ftext_${feat}`]:e.target.value}))}/>
                      </CF>
                    </div>
                  ))}

                  {/* Audiências e Praças */}
                  <div style={{fontFamily:"var(--fd)",fontSize:13,fontWeight:700,color:"var(--t1)",borderBottom:"1px solid var(--bdr)",paddingBottom:6}}>5. Audiências e Praças</div>
                  <CF l="Audiências"><textarea className="ft" rows={3} value={editData.audiences||""} onChange={e=>setEditData(p=>({...p,audiences:e.target.value}))}/></CF>

                  <CF l="Tipo de Praça">
                    <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                      {["Brasil","Estado","Cidade","Outro"].map(opt=>{
                        const cur=editData.praças_type||editData.pracas_type||"";
                        return(
                          <button key={opt} className={`btn ${cur===opt?"bp":"bs"}`} style={{fontSize:11,padding:"4px 12px"}}
                            onClick={()=>setEditData(p=>({...p,praças_type:opt,pracas_type:opt}))}>{opt}</button>
                        );
                      })}
                    </div>
                  </CF>

                  {(editData.praças_type||editData.pracas_type)==="Estado"&&(
                    <CF l="Estados">
                      <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
                        {BRAZIL_STATES.map(s=>{
                          const sel=(editData.praças_states||[]).includes(s);
                          return(
                            <span key={s} className={`chip${sel?" sel":""}`} style={{fontSize:11,padding:"3px 10px",cursor:"pointer"}}
                              onClick={()=>setEditData(p=>{
                                const arr=p.praças_states||[];
                                return{...p,praças_states:arr.includes(s)?arr.filter(x=>x!==s):[...arr,s]};
                              })}>{s}</span>
                          );
                        })}
                      </div>
                      {(editData.praças_states||[]).length>0&&<div style={{fontSize:11,color:"var(--teal)",marginTop:6}}>{editData.praças_states.length} estado(s) selecionado(s)</div>}
                    </CF>
                  )}

                  {(editData.praças_type||editData.pracas_type)==="Cidade"&&(
                    <CF l="Cidades">
                      <div style={{display:"flex",flexDirection:"column",gap:8}}>
                        <div style={{display:"flex",gap:6}}>
                          <input className="fi" placeholder="Nome da cidade" value={editData._cityTmp||""}
                            onChange={e=>setEditData(p=>({...p,_cityTmp:e.target.value}))}
                            onKeyDown={e=>{
                              if(e.key==="Enter"&&editData._cityTmp&&editData._cityState){
                                e.preventDefault();
                                const city=`${editData._cityTmp} (${editData._cityState})`;
                                setEditData(p=>({...p,praças_cities:[...(p.praças_cities||[]),city],_cityTmp:""}));
                              }
                            }}/>
                          <select className="fs" style={{maxWidth:80}} value={editData._cityState||""} onChange={e=>setEditData(p=>({...p,_cityState:e.target.value}))}>
                            <option value="">UF</option>
                            {BRAZIL_STATES.map(s=><option key={s} value={s}>{s}</option>)}
                          </select>
                          <button className="btn bs" style={{fontSize:11,whiteSpace:"nowrap"}} onClick={()=>{
                            if(editData._cityTmp&&editData._cityState){
                              const city=`${editData._cityTmp} (${editData._cityState})`;
                              setEditData(p=>({...p,praças_cities:[...(p.praças_cities||[]),city],_cityTmp:""}));
                            }
                          }}><I n="plus" s={12}/>Adicionar</button>
                        </div>
                        {(editData.praças_cities||[]).length>0&&(
                          <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
                            {editData.praças_cities.map((c,i)=>(
                              <span key={i} className="chip sel" style={{fontSize:11,padding:"3px 10px",display:"flex",gap:4,alignItems:"center"}}>
                                {c}<span style={{cursor:"pointer",fontWeight:700}} onClick={()=>setEditData(p=>({...p,praças_cities:p.praças_cities.filter((_,j)=>j!==i)}))}>×</span>
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </CF>
                  )}

                  {(editData.praças_type||editData.pracas_type)==="Outro"&&(
                    <CF l="Detalhe (Outro)">
                      <input className="fi" value={editData.praças_other||""} onChange={e=>setEditData(p=>({...p,praças_other:e.target.value}))}/>
                    </CF>
                  )}

                  {/* Observações */}
                  <div style={{fontFamily:"var(--fd)",fontSize:13,fontWeight:700,color:"var(--t1)",borderBottom:"1px solid var(--bdr)",paddingBottom:6}}>6. Observações e Ação de Marketing</div>
                  <CF l="Ação de Marketing (opcional)">
                    <select className="fs" value={editData.marketing_action&&!MARKETING_ACTIONS.includes(editData.marketing_action)?"__outro__":(editData.marketing_action||"")} onChange={e=>{const v=e.target.value;setEditData(p=>({...p,marketing_action:v==="__outro__"?" ":v}))}}>
                      <option value="">Nenhuma</option>
                      {MARKETING_ACTIONS.map(a=><option key={a} value={a}>{a}</option>)}
                      <option value="__outro__">Outro</option>
                    </select>
                    {editData.marketing_action&&!MARKETING_ACTIONS.includes(editData.marketing_action)&&(
                      <input className="fs" type="text" placeholder="Descreva a ação de marketing" value={editData.marketing_action.trim()===""?"":editData.marketing_action} onChange={e=>setEditData(p=>({...p,marketing_action:e.target.value||" "}))} style={{marginTop:8}}/>
                    )}
                  </CF>
                  <CF l="Observações (opcional)"><textarea className="ft" rows={4} placeholder="Contexto do cliente, alinhamentos prévios, sensibilidades, pedidos específicos..." value={editData.observations||""} onChange={e=>setEditData(p=>({...p,observations:e.target.value}))}/></CF>

                  <div style={{display:"flex",gap:10,justifyContent:"flex-end",marginTop:8,position:"sticky",bottom:0,padding:"10px 0",background:"var(--bg-card)",borderTop:"1px solid var(--bdr)"}}>
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
                  
                  {/* Estudos selecionados */}
                  {(selected.selected_studies||[]).length>0&&(
                    <div style={{padding:14,background:"var(--bg3)",borderRadius:"var(--r)",border:"1px solid var(--bdr)"}}>
                      <div style={{fontSize:11,color:"var(--t3)",textTransform:"uppercase",fontWeight:700,marginBottom:8}}>Estudos Vinculados ({(selected.selected_studies||[]).length})</div>
                      {(selected.selected_studies||[]).map(s=>(
                        <div key={s.name} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 0",borderBottom:"1px solid var(--bdr)"}}>
                          <div>
                            <span style={{fontSize:13,fontWeight:600,color:"var(--t1)"}}>{s.name}</span>
                            <span style={{fontSize:11,color:"var(--t3)",marginLeft:8}}>CS: {s.cs}</span>
                            {s.delivery&&<span style={{fontSize:11,color:"var(--t3)",marginLeft:8}}>Entrega: {s.delivery}</span>}
                          </div>
                          <div style={{display:"flex",gap:6,alignItems:"center"}}>
                            <span className={`badge ${s.status==="Feito"?"b-grn":"b-ylw"}`} style={{fontSize:10}}>{s.status||"Pendente"}</span>
                            {s.link&&<a href={s.link} target="_blank" rel="noreferrer" className="btn bs" style={{fontSize:10,padding:"2px 8px",textDecoration:"none"}}><I n="external" s={11}/>Ver</a>}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  
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
                    <D l="Praças" v={(()=>{const t=selected.pracas_type||selected.praças_type||"";const d=selected.pracas_detail||"";if(t==="Brasil")return d||"Brasil";if(t==="Estado")return d?`Estados: ${d}`:((selected.praças_states||[]).length>0?`Estados: ${(selected.praças_states||[]).join(", ")}`:"—");if(t==="Cidade")return d||((selected.praças_cities||[]).length>0?(selected.praças_cities||[]).join(", "):"—");if(t==="Outro")return d||selected.praças_other||"—";return t||"—";})()}/>
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

                  {/* Section 6: Observações + Ação de Marketing */}
                  {(selected.observations||selected.marketing_action)&&(<>
                    <div style={{fontFamily:"var(--fd)",fontSize:14,fontWeight:700,color:"var(--t1)",borderBottom:"1px solid var(--bdr)",paddingBottom:8}}>6. Observações e Ação de Marketing</div>
                    {selected.marketing_action&&(
                      <div style={{display:"flex",alignItems:"center",gap:10,padding:"10px 14px",background:"var(--teal-dim)",border:"1px solid var(--teal)",borderRadius:"var(--r)"}}>
                        <I n="activity" s={14} c="var(--teal)"/>
                        <div>
                          <div style={{fontSize:11,color:"var(--t3)",textTransform:"uppercase",fontWeight:700,letterSpacing:".06em"}}>Ação de Marketing</div>
                          <div style={{fontSize:13,fontWeight:700,color:"var(--teal-l)",marginTop:2}}>{selected.marketing_action}</div>
                        </div>
                      </div>
                    )}
                    {selected.observations&&(
                      <div style={{padding:14,background:"var(--bg3)",border:"1px solid var(--bdr)",borderRadius:"var(--r)",fontSize:13,color:"var(--t1)",lineHeight:1.6,whiteSpace:"pre-wrap",wordBreak:"break-word"}}>
                        {selected.observations}
                      </div>
                    )}
                  </>)}

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

      {/* Modal de confirmação de exclusão */}
      {deleteConfirm && (
        <div className="mo" onClick={()=>setDeleteConfirm(null)}>
          <div className="ml" style={{maxWidth:480}} onClick={e=>e.stopPropagation()}>
            <div style={{padding:"22px 24px"}}>
              <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:14}}>
                <div style={{width:40,height:40,borderRadius:"50%",background:"var(--red-bg)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                  <I n="trash" s={20} c="var(--red)"/>
                </div>
                <div>
                  <div style={{fontFamily:"var(--fd)",fontSize:16,fontWeight:800,color:"var(--t1)"}}>Excluir checklist?</div>
                  <div style={{fontSize:12,color:"var(--t3)",marginTop:2}}>Essa ação não pode ser desfeita.</div>
                </div>
              </div>
              <div style={{padding:14,background:"var(--bg3)",borderRadius:"var(--r)",border:"1px solid var(--bdr)",marginBottom:14}}>
                <div style={{fontSize:13,fontWeight:700,color:"var(--t1)"}}>{deleteConfirm.client}</div>
                <div style={{fontSize:12,color:"var(--t2)",marginTop:2}}>{deleteConfirm.campaign_name||"—"}</div>
                <div style={{fontSize:11,color:"var(--t3)",marginTop:6}}>{fmtDate(deleteConfirm.start_date)} → {fmtDate(deleteConfirm.end_date)}</div>
              </div>
              <div className="disc" style={{marginBottom:14,fontSize:11}}>
                <I n="alert-triangle" s={13} c="var(--yellow-s)"/>
                <div>O checklist será removido do BigQuery e do Report Hub. Permitido apenas para o CP que enviou, o CS responsável ou admin.</div>
              </div>
              <div style={{display:"flex",gap:10,justifyContent:"flex-end"}}>
                <button className="btn bs" onClick={()=>setDeleteConfirm(null)}>Cancelar</button>
                <button className="btn" style={{background:"var(--red)",color:"#fff"}} onClick={()=>handleDelete(deleteConfirm)}><I n="trash" s={13}/>Excluir</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// PERMISSIONS
// ══════════════════════════════════════════════════════════════════════════════
// Fallback: lista usada apenas se o backend /team estiver indisponível
const FALLBACK_ADMINS = [
  'matheus.machado@hypr.mobi','cesar.moura@hypr.mobi','adrian.ferguson@hypr.mobi',
  'mateus.lambranho@hypr.mobi','gian.nardo@hypr.mobi',
];
const FALLBACK_CPS = [
  'danilo.pereira@hypr.mobi','eduarda.bolzan@hypr.mobi','camila.tenorio@hypr.mobi',
  'egle.stein@hypr.mobi','alexandra.perez@hypr.mobi','karol.siqueira@hypr.mobi',
  'pablo.souza@hypr.mobi','larissa.reis@hypr.mobi','marcelo.nogueira@hypr.mobi',
];
// Context com a lista vinda de GET /team — fonte da verdade pra permissões em runtime
const TeamCtx = createContext({ members: [], reload: ()=>{}, loading: false });
const useTeam = () => useContext(TeamCtx);
const teamRoleOf = (members, email) => {
  if (!email) return null;
  const m = members.find(x => x.email?.toLowerCase() === email.toLowerCase());
  return m?.role || null;
};
const isAdminFromTeam = (members, email) => {
  const r = teamRoleOf(members, email);
  if (r) return r === 'admin';
  return FALLBACK_ADMINS.includes((email||'').toLowerCase());
};

// "Eu sou dono?" → true se eu criei (CP/sales) ou sou o CS responsável
function checklistOwnedBy(checklist, email) {
  if (!checklist || !email) return false;
  const e = email.toLowerCase();
  return [
    checklist.submitted_by_email,
    checklist.submittedByEmail,
    checklist.cp_email,
    checklist.cs_email,
  ].some(v => v && String(v).toLowerCase() === e);
}
function taskOwnedBy(task, email) {
  if (!task || !email) return false;
  const e = email.toLowerCase();
  return [
    task.requester_email,
    task.requesterEmail,
    task.cs_email,
    task.csEmail,
    // SA tasks: o CS original (antes de ser passada pra SA) também é dono
    task.original_cs_email,
    task.originalCsEmail,
  ].some(v => v && String(v).toLowerCase() === e);
}

// ══════════════════════════════════════════════════════════════════════════════
// MAIN APP
// ══════════════════════════════════════════════════════════════════════════════
const NAV=[
  {key:"home",icon:"home",label:"Dashboard"},
  {key:"tasks",icon:"check-square",label:"Task Center"},
  {key:"checklist",icon:"clipboard",label:"Checklist"},
  {key:"checklist-center",icon:"inbox",label:"Checklist Center"},
  {key:"admin",icon:"shield",label:"Admin"},
];

// ══════════════════════════════════════════════════════════════════════════════
// ADMIN PANEL (gerenciamento de usuários)
// ══════════════════════════════════════════════════════════════════════════════
const ROLE_OPTIONS = [
  { value: 'admin', label: 'Admin',           color: 'var(--red)',     desc: 'Acesso total à plataforma' },
  { value: 'sales', label: 'Client Partner',  color: 'var(--teal)',    desc: 'Cria checklists e propostas' },
  { value: 'cs',    label: 'Client Services', color: 'var(--green)',   desc: 'Recebe e executa checklists' },
  { value: 'none',  label: 'Sem acesso',      color: 'var(--t3)',      desc: 'Bloqueado' },
];
// Frontend usa 'sales' (mesmo vocabulário do backend e dos seeds existentes).
// Display sempre como "Client Partner" pra os usuários.
const ROLE_LABEL_MAP = { admin:'Admin', sales:'Client Partner', cp:'Client Partner', cs:'Client Services', none:'Sem acesso' };
const ROLE_COLOR_MAP = { admin:'var(--red)', sales:'var(--teal)', cp:'var(--teal)', cs:'var(--green)', none:'var(--t3)' };

// ══════════════════════════════════════════════════════════════════════════════
// ADMIN PANEL — Análise por CP
// ══════════════════════════════════════════════════════════════════════════════
function AdminPanel() {
  const toast = useToast();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [preset, setPreset] = useState("all"); // all | month | q3 | q6 | custom
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  const [expandedCp, setExpandedCp] = useState(null); // cp_name expandido no accordion

  // Calcula período baseado no preset selecionado
  const computePeriod = useCallback(() => {
    const today = new Date();
    const fmt = (d) => d.toISOString().split("T")[0];
    if (preset === "month") {
      const first = new Date(today.getFullYear(), today.getMonth(), 1);
      return { start_date: fmt(first), end_date: fmt(today) };
    }
    if (preset === "q3") {
      const d = new Date(today); d.setMonth(d.getMonth() - 3);
      return { start_date: fmt(d), end_date: fmt(today) };
    }
    if (preset === "q6") {
      const d = new Date(today); d.setMonth(d.getMonth() - 6);
      return { start_date: fmt(d), end_date: fmt(today) };
    }
    if (preset === "custom") {
      return {
        start_date: customStart || "2026-04-27",
        end_date: customEnd || null,
      };
    }
    // "all"
    return { start_date: "2026-04-27", end_date: null };
  }, [preset, customStart, customEnd]);

  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    try {
      const { start_date, end_date } = computePeriod();
      const params = new URLSearchParams({ start_date });
      if (end_date) params.set("end_date", end_date);
      const r = await fetch(`${BACKEND_URL}/admin/analytics?${params.toString()}`);
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const j = await r.json();
      setData(j);
    } catch (e) {
      console.error("Erro ao buscar analytics:", e);
      toast("Erro ao carregar analytics", "error");
    } finally {
      setLoading(false);
    }
  }, [computePeriod, toast]);

  useEffect(() => { fetchAnalytics(); }, [fetchAnalytics]);

  // Format helpers
  const fmtMoney = (v) => v == null ? "—" : "R$ " + Math.round(v).toLocaleString("pt-BR");
  const fmtImp = (v) => v == null || v === 0 ? "—" : v.toLocaleString("pt-BR");
  const fmtCpm = (v) => v == null ? "—" : "R$ " + v.toFixed(2).replace(".", ",");
  const fmtCpv = (v) => v == null ? "—" : "R$ " + v.toFixed(4).replace(".", ",");
  const fmtDateBr = (s) => {
    if (!s) return "—";
    const [y,m,d] = s.split("-");
    return `${d}/${m}/${y}`;
  };

  return (
    <div className="page-enter" style={{padding:"24px 32px"}}>
      <div style={{marginBottom:24}}>
        <h1 style={{fontFamily:"var(--fd)",fontSize:26,fontWeight:700,color:"var(--t1)",margin:0}}>Admin — Análise</h1>
        <p style={{margin:"4px 0 0",fontSize:13,color:"var(--t3)"}}>Visão consolidada de campanhas, investimento e performance por Client Partner.</p>
      </div>

      {/* Filtro de período */}
      <div className="card" style={{padding:16,marginBottom:16,display:"flex",alignItems:"center",gap:12,flexWrap:"wrap"}}>
        <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
          {[
            {k:"all",label:"Tudo"},
            {k:"month",label:"Mês atual"},
            {k:"q3",label:"3 meses"},
            {k:"q6",label:"6 meses"},
            {k:"custom",label:"Personalizado"},
          ].map(p=>(
            <button key={p.k} className={`btn ${preset===p.k?"bp":"bs"}`} style={{fontSize:12,padding:"7px 14px"}} onClick={()=>setPreset(p.k)}>{p.label}</button>
          ))}
        </div>
        {preset === "custom" && (
          <div style={{display:"flex",gap:8,alignItems:"center"}}>
            <input type="date" className="fi" value={customStart} onChange={e=>setCustomStart(e.target.value)} style={{fontSize:12,padding:"6px 10px"}}/>
            <span style={{fontSize:12,color:"var(--t3)"}}>→</span>
            <input type="date" className="fi" value={customEnd} onChange={e=>setCustomEnd(e.target.value)} style={{fontSize:12,padding:"6px 10px"}}/>
            <button className="btn bp" style={{fontSize:12,padding:"7px 14px"}} onClick={fetchAnalytics}>Aplicar</button>
          </div>
        )}
        {data?.period && (
          <div style={{marginLeft:"auto",fontSize:12,color:"var(--t3)"}}>
            {fmtDateBr(data.period.start)} {data.period.end ? `→ ${fmtDateBr(data.period.end)}` : "→ hoje"}
          </div>
        )}
      </div>

      {loading ? (
        <div className="card" style={{padding:60,textAlign:"center",color:"var(--t3)"}}>Carregando dados…</div>
      ) : !data ? (
        <div className="card" style={{padding:60,textAlign:"center",color:"var(--t3)"}}>Sem dados</div>
      ) : (
        <>
          {/* KPIs gerais — primeira linha: contagem + investimento */}
          <div className="g3" style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))",gap:12,marginBottom:12}}>
            <KpiCard label="Checklists" value={data.totals.checklists.toLocaleString("pt-BR")} color="var(--teal)" icon="inbox"
              tooltip="Total de checklists submetidos no período (qualquer status)."/>
            <KpiCard label="Investimento Total" value={fmtMoney(data.totals.investment)} color="var(--green)" icon="dollar"
              tooltip="Soma do campo 'Investimento' de todos os checklists do período. Inclui checklists com dados incompletos."/>
            <KpiCard label="Impr. Display (Contr.)" value={fmtImp(data.totals.impressoes_display_contratadas)} color="var(--teal-l)" icon="bar-chart"
              tooltip="Soma das impressões Display contratadas (O2O + OOH + Groundflow + RMND). Não inclui bonificadas."/>
            <KpiCard label="Views Video (Contr.)" value={fmtImp(data.totals.views_video_contratadas)} color="var(--teal)" icon="play"
              tooltip="Soma das views Video contratadas (O2O + OOH + RMND). Não inclui bonificadas."/>
          </div>
          {/* KPIs gerais — segunda linha: CPMs e CPVs */}
          <div className="g3" style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))",gap:12,marginBottom:16}}>
            <KpiCard label="CPM Real (Display)" value={fmtCpm(data.totals.cpm_real)} color="var(--teal)" icon="trending-up"
              tooltip="CPM Display efetivo: investimento Display / (impressões contratadas + bonificadas) × 1000. Exclui checklists problemáticos."/>
            <KpiCard label="CPM Negociado (Display)" value={fmtCpm(data.totals.cpm_negociado)} color="var(--t3)" icon="edit"
              tooltip="Média ponderada do CPM digitado pelo CP em cada checklist (ponderação pelo investimento Display)."/>
            <KpiCard label="CPV Real (Video)" value={fmtCpv(data.totals.cpv_real)} color="var(--teal)" icon="trending-up"
              tooltip="CPV Video efetivo: investimento Video / (views contratadas + bonificadas). Exclui checklists problemáticos."/>
            <KpiCard label="CPV Negociado (Video)" value={fmtCpv(data.totals.cpv_negociado)} color="var(--t3)" icon="edit"
              tooltip="Média ponderada do CPCV digitado pelo CP em cada checklist (ponderação pelo investimento Video)."/>
          </div>

          {/* Tabela por CP */}
          <div style={{marginBottom:24}}>
            <h2 style={{fontSize:16,fontWeight:700,color:"var(--t1)",margin:"0 0 10px"}}>Análise por Client Partner</h2>
            <div className="card" style={{padding:0,overflow:"hidden"}}>
              <div style={{overflowX:"auto"}}>
                <table className="admin-table" style={{width:"100%",borderCollapse:"collapse",fontSize:13}}>
                  <thead>
                    <tr style={{borderBottom:"1px solid var(--bdr)",background:"var(--bg3)"}}>
                      {[
                        {h:"",t:""},
                        {h:"CP",t:"Client Partner — clique pra ver detalhes por campanha"},
                        {h:"Check",t:"Quantidade de checklists submetidos no período"},
                        {h:"Investim.",t:"Soma do campo Investimento de todos os checklists deste CP"},
                        {h:"Impr. Display",t:"Total de impressões Display (contratadas + bonificadas)"},
                        {h:"Views Video",t:"Total de views Video (contratadas + bonificadas)"},
                        {h:"CPM Real",t:"Invest. Display / Impressões Display × 1000. Exclui checklists problemáticos."},
                        {h:"CPM Neg.",t:"CPM digitado pelo CP no formulário (média ponderada por investimento Display)"},
                        {h:"CPV Real",t:"Invest. Video / Views Video. Exclui checklists problemáticos."},
                        {h:"CPV Neg.",t:"CPV digitado pelo CP no formulário (média ponderada por investimento Video)"},
                        {h:"Tasks",t:"Tasks abertas pelo email do CP no período"},
                      ].map((col,i)=>(
                        <th key={i} style={{textAlign:col.h==="CP"?"left":"right",padding:"10px 12px",fontSize:10,fontWeight:700,color:"var(--t3)",textTransform:"uppercase",letterSpacing:".06em",whiteSpace:"nowrap"}}>
                          <span style={{display:"inline-flex",alignItems:"center",gap:5,justifyContent:col.h==="CP"?"flex-start":"flex-end"}}>
                            <span>{col.h}</span>
                            {col.t && <InfoTooltip text={col.t} size={13}/>}
                          </span>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {data.by_cp.length === 0 ? (
                      <tr><td colSpan="11" style={{padding:30,textAlign:"center",color:"var(--t3)",fontSize:13}}>Nenhum dado no período selecionado.</td></tr>
                    ) : data.by_cp.map(cp=>{
                      const initials = (cp.cp_name||"?").split(" ").map(n=>n[0]).join("").substring(0,2).toUpperCase();
                      const totalDisplay = (cp.impressoes_display_contratadas||0) + (cp.impressoes_display_bonificadas||0);
                      const totalVideo = (cp.views_video_contratadas||0) + (cp.views_video_bonificadas||0);
                      const isExpanded = expandedCp === cp.cp_name;
                      return (
                        <Fragment key={cp.cp_name}>
                          <tr style={{borderBottom:isExpanded?"none":"1px solid var(--bdr-card)",cursor:"pointer",transition:"background .15s",background:isExpanded?"var(--bg3)":"transparent"}}
                            onClick={()=>setExpandedCp(isExpanded?null:cp.cp_name)}
                            onMouseEnter={e=>{if(!isExpanded)e.currentTarget.style.background="var(--bg3)"}}
                            onMouseLeave={e=>{if(!isExpanded)e.currentTarget.style.background="transparent"}}>
                            <td style={{padding:"12px 4px 12px 12px",width:24,textAlign:"center"}}>
                              <span style={{display:"inline-block",transform:isExpanded?"rotate(90deg)":"rotate(0deg)",transition:"transform .15s",color:"var(--t3)",fontSize:11,fontWeight:700}}>▶</span>
                            </td>
                            <td data-cell-label="cp" style={{padding:"12px"}}>
                              <div style={{display:"flex",alignItems:"center",gap:10}}>
                                <div style={{width:30,height:30,borderRadius:"50%",background:"var(--teal)",color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:700,flexShrink:0}}>{initials}</div>
                                <div style={{minWidth:0}}>
                                  <div style={{fontSize:13,fontWeight:700,color:"var(--t1)"}}>{cp.cp_name}</div>
                                  {cp.cp_email && <div style={{fontSize:11,color:"var(--t3)"}}>{cp.cp_email}</div>}
                                </div>
                              </div>
                            </td>
                            <td data-cell-label="check" style={{padding:"12px",textAlign:"right",fontVariantNumeric:"tabular-nums"}}>{cp.checklists}</td>
                            <td data-cell-label="investim." style={{padding:"12px",textAlign:"right",fontVariantNumeric:"tabular-nums",fontWeight:600,color:"var(--green)"}}>{fmtMoney(cp.investment)}</td>
                            <td data-cell-label="impr. display" style={{padding:"12px",textAlign:"right",fontVariantNumeric:"tabular-nums",color:"var(--t2)"}}>{fmtImp(totalDisplay)}</td>
                            <td data-cell-label="views video" style={{padding:"12px",textAlign:"right",fontVariantNumeric:"tabular-nums",color:"var(--t2)"}}>{fmtImp(totalVideo)}</td>
                            <td data-cell-label="cpm real" style={{padding:"12px",textAlign:"right",fontVariantNumeric:"tabular-nums",fontWeight:700,color:cp.cpm_real==null?"var(--t3)":"var(--teal)"}}>{fmtCpm(cp.cpm_real)}</td>
                            <td data-cell-label="cpm neg." style={{padding:"12px",textAlign:"right",fontVariantNumeric:"tabular-nums",color:cp.cpm_negociado==null?"var(--t3)":"var(--t2)"}}>{fmtCpm(cp.cpm_negociado)}</td>
                            <td data-cell-label="cpv real" style={{padding:"12px",textAlign:"right",fontVariantNumeric:"tabular-nums",fontWeight:700,color:cp.cpv_real==null?"var(--t3)":"var(--teal)"}}>{fmtCpv(cp.cpv_real)}</td>
                            <td data-cell-label="cpv neg." style={{padding:"12px",textAlign:"right",fontVariantNumeric:"tabular-nums",color:cp.cpv_negociado==null?"var(--t3)":"var(--t2)"}}>{fmtCpv(cp.cpv_negociado)}</td>
                            <td data-cell-label="tasks" style={{padding:"12px",textAlign:"right",fontVariantNumeric:"tabular-nums",color:"var(--t2)"}}>{cp.tasks_abertas}</td>
                          </tr>
                          {isExpanded && (
                            <tr style={{borderBottom:"1px solid var(--bdr-card)",background:"var(--bg3)"}}>
                              <td colSpan="11" style={{padding:"0 12px 14px"}}>
                                <CpCampaignsTable campaigns={cp.campaigns||[]} fmtMoney={fmtMoney} fmtImp={fmtImp} fmtCpm={fmtCpm} fmtCpv={fmtCpv} fmtDateBr={fmtDateBr}/>
                              </td>
                            </tr>
                          )}
                        </Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Campanhas com problema */}
          {data.problematic_checklists.length > 0 && (
            <div style={{marginBottom:24}}>
              <h2 style={{fontSize:16,fontWeight:700,color:"var(--t1)",margin:"0 0 4px",display:"flex",alignItems:"center",gap:8}}>
                <I n="alert-triangle" s={18} c="var(--yellow-s)"/>
                Campanhas com problema
                <span className="badge b-ylw" style={{fontSize:11}}>{data.problematic_checklists.length}</span>
              </h2>
              <p style={{margin:"0 0 10px",fontSize:12,color:"var(--t3)"}}>Checklists com investimento cadastrado mas sem impressões. Reveja e corrija.</p>
              <div className="card" style={{padding:0,overflow:"hidden"}}>
                <div style={{overflowX:"auto"}}>
                  <table className="task-table" style={{width:"100%",borderCollapse:"collapse",fontSize:13}}>
                    <thead>
                      <tr style={{borderBottom:"1px solid var(--bdr)",background:"var(--bg3)"}}>
                        {["Cliente","Campanha","CP","Período","Investimento","Problema"].map(h=>(
                          <th key={h} style={{textAlign:h==="Investimento"?"right":"left",padding:"10px 14px",fontSize:10,fontWeight:700,color:"var(--t3)",textTransform:"uppercase",letterSpacing:".06em",whiteSpace:"nowrap"}}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {data.problematic_checklists.map(p=>(
                        <tr key={p.id} style={{borderBottom:"1px solid var(--bdr-card)"}}>
                          <td data-cell-label="cliente" style={{padding:"12px 14px",fontWeight:700,color:"var(--t1)"}}>{p.client}</td>
                          <td data-cell-label="campanha" style={{padding:"12px 14px",color:"var(--t2)"}}>{p.campaign_name || "—"}</td>
                          <td data-cell-label="cp" style={{padding:"12px 14px",color:"var(--t2)",whiteSpace:"nowrap"}}>{shortName(p.cp_name)}</td>
                          <td data-cell-label="período" style={{padding:"12px 14px",color:"var(--t2)",fontSize:12,whiteSpace:"nowrap"}}>{fmtDateBr(p.start_date)}</td>
                          <td data-cell-label="investimento" style={{padding:"12px 14px",textAlign:"right",fontVariantNumeric:"tabular-nums",fontWeight:600,color:"var(--yellow-s)"}}>{fmtMoney(p.investment)}</td>
                          <td data-cell-label="problema" style={{padding:"12px 14px",fontSize:11}}>
                            <span className="badge b-ylw" style={{fontSize:10}}>{p.issue}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// Card de KPI reutilizável
// Tabela aninhada com as campanhas de um CP (drill-down do AdminPanel)
function CpCampaignsTable({campaigns, fmtMoney, fmtImp, fmtCpm, fmtCpv, fmtDateBr}) {
  if (!campaigns || campaigns.length === 0) {
    return <div style={{padding:"16px",textAlign:"center",color:"var(--t3)",fontSize:12}}>Nenhuma campanha no período.</div>;
  }
  // Ordena: problemáticas primeiro, depois por investimento desc
  const sorted = [...campaigns].sort((a,b)=>{
    if ((a.issue?1:0) !== (b.issue?1:0)) return (a.issue?1:0) - (b.issue?1:0);
    return (b.investment||0) - (a.investment||0);
  });
  return (
    <div style={{marginTop:8,padding:"4px 0"}}>
      <div style={{fontSize:11,fontWeight:700,color:"var(--t3)",textTransform:"uppercase",letterSpacing:".06em",marginBottom:8,paddingLeft:4}}>
        {campaigns.length} {campaigns.length===1?"campanha":"campanhas"} no período
      </div>
      <div style={{background:"var(--bg-card)",borderRadius:8,overflow:"hidden",border:"1px solid var(--bdr-card)"}}>
        <div style={{overflowX:"auto"}}>
          <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
            <thead>
              <tr style={{borderBottom:"1px solid var(--bdr)",background:"var(--bg2)"}}>
                {["Cliente","Campanha","Período","Investim.","Impr. Display","Views Video","CPM Real","CPV Real","Status"].map(h=>(
                  <th key={h} style={{textAlign:h==="Cliente"||h==="Campanha"||h==="Status"?"left":"right",padding:"8px 10px",fontSize:9,fontWeight:700,color:"var(--t3)",textTransform:"uppercase",letterSpacing:".06em",whiteSpace:"nowrap"}}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sorted.map(c=>(
                <tr key={c.id} style={{borderBottom:"1px solid var(--bdr-card)"}}>
                  <td style={{padding:"8px 10px",fontWeight:600,color:"var(--t1)"}}>{c.client}</td>
                  <td style={{padding:"8px 10px",color:"var(--t2)"}}>{c.campaign_name||"—"}</td>
                  <td style={{padding:"8px 10px",color:"var(--t2)",fontSize:11,whiteSpace:"nowrap"}}>{fmtDateBr(c.start_date)} → {fmtDateBr(c.end_date)}</td>
                  <td style={{padding:"8px 10px",textAlign:"right",fontVariantNumeric:"tabular-nums",fontWeight:600,color:"var(--green)"}}>{fmtMoney(c.investment)}</td>
                  <td style={{padding:"8px 10px",textAlign:"right",fontVariantNumeric:"tabular-nums",color:"var(--t2)"}}>{fmtImp(c.impressoes_display)}</td>
                  <td style={{padding:"8px 10px",textAlign:"right",fontVariantNumeric:"tabular-nums",color:"var(--t2)"}}>{fmtImp(c.views_video)}</td>
                  <td style={{padding:"8px 10px",textAlign:"right",fontVariantNumeric:"tabular-nums",fontWeight:600,color:c.cpm_real==null?"var(--t3)":"var(--teal)"}}>{fmtCpm(c.cpm_real)}</td>
                  <td style={{padding:"8px 10px",textAlign:"right",fontVariantNumeric:"tabular-nums",fontWeight:600,color:c.cpv_real==null?"var(--t3)":"var(--teal)"}}>{fmtCpv(c.cpv_real)}</td>
                  <td style={{padding:"8px 10px"}}>
                    {c.issue ? (
                      <span className="badge b-ylw" style={{fontSize:10,whiteSpace:"normal",lineHeight:1.3,maxWidth:220,display:"inline-block"}}>{c.issue}</span>
                    ) : (
                      <span className="badge b-grn" style={{fontSize:10}}>OK</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// Tooltip customizado que aparece imediatamente ao hover (sem delay do browser)
// e funciona em mobile (tap-to-toggle)
function InfoTooltip({text, size=13}){
  const [open, setOpen] = useState(false);
  if (!text) return null;
  return (
    <span style={{position:"relative",display:"inline-flex",alignItems:"center"}}
      onMouseEnter={()=>setOpen(true)}
      onMouseLeave={()=>setOpen(false)}
      onClick={e=>{e.stopPropagation();setOpen(v=>!v)}}>
      <span style={{display:"inline-flex",alignItems:"center",justifyContent:"center",width:size,height:size,borderRadius:"50%",background:open?"var(--teal)":"var(--bg3)",color:open?"#fff":"var(--t3)",fontSize:Math.round(size*0.7),fontWeight:700,cursor:"help",userSelect:"none",border:"1px solid "+(open?"var(--teal)":"var(--bdr)"),transition:"all .15s",lineHeight:1}}>i</span>
      {open && (
        <span style={{position:"absolute",top:"calc(100% + 8px)",left:"50%",transform:"translateX(-50%)",zIndex:50,background:"#1a2332",color:"#fff",padding:"8px 12px",borderRadius:6,fontSize:11,fontWeight:400,lineHeight:1.5,letterSpacing:0,textTransform:"none",whiteSpace:"normal",width:240,maxWidth:"90vw",boxShadow:"0 4px 12px rgba(0,0,0,0.25)",pointerEvents:"none"}}>
          {text}
          <span style={{position:"absolute",bottom:"100%",left:"50%",transform:"translateX(-50%)",width:0,height:0,borderLeft:"6px solid transparent",borderRight:"6px solid transparent",borderBottom:"6px solid #1a2332"}}/>
        </span>
      )}
    </span>
  );
}

function KpiCard({label, value, color, icon, tooltip}) {
  return (
    <div className="card" style={{padding:14,display:"flex",alignItems:"center",gap:12}}>
      <div style={{width:38,height:38,borderRadius:8,background:color,display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",flexShrink:0}}>
        <I n={icon} s={18}/>
      </div>
      <div style={{minWidth:0,flex:1}}>
        <div style={{fontSize:10,fontWeight:700,color:"var(--t3)",textTransform:"uppercase",letterSpacing:".06em",display:"flex",alignItems:"center",gap:6}}>
          <span>{label}</span>
          <InfoTooltip text={tooltip} size={14}/>
        </div>
        <div style={{fontSize:18,fontWeight:700,color:"var(--t1)",fontVariantNumeric:"tabular-nums",marginTop:2}}>{value}</div>
      </div>
    </div>
  );
}


// ─── AUTH CONTEXT ────────────────────────────────────────────────────────────
const AuthCtx = createContext();
const useAuth = () => useContext(AuthCtx);
const GOOGLE_CLIENT_ID = "453955675457-mdf12g19of257ol5c6hs1b6qmuvg3r4f.apps.googleusercontent.com";
const SESSION_TTL_MS = 10 * 60 * 60 * 1000; // 10 horas
const SESSION_KEY = "hypr_session_v1";

function loadSavedSession() {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const obj = JSON.parse(raw);
    if (!obj || !obj.user || !obj.expiresAt) return null;
    if (Date.now() > obj.expiresAt) { localStorage.removeItem(SESSION_KEY); return null; }
    return obj.user;
  } catch (e) { return null; }
}
function saveSession(user) {
  try { localStorage.setItem(SESSION_KEY, JSON.stringify({ user, expiresAt: Date.now() + SESSION_TTL_MS })); } catch (e) {}
}
function clearSession() { try { localStorage.removeItem(SESSION_KEY); } catch (e) {} }

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
          const payload = JSON.parse(decodeURIComponent(escape(atob(response.credential.split(".")[1].replace(/-/g,"+").replace(/_/g,"/")))));
          if (!payload.email?.endsWith("@hypr.mobi")) {
            setError("Acesso restrito a contas @hypr.mobi");
            return;
          }
          const user = { name: payload.name, email: payload.email, picture: payload.picture, initials: payload.name?.split(" ").map(n=>n[0]).join("").substring(0,2).toUpperCase() };
          window.__hyprUser = user;
          saveSession(user);
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
    <div style={{minHeight:"100vh",background:"#1C262F",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'Urbanist',sans-serif"}}>
      <div style={{textAlign:"center",padding:40}}>
        <div style={{fontFamily:"'Urbanist',sans-serif",fontSize:36,fontWeight:800,color:"#fff",marginBottom:4}}>
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
  const [user,setUser]=useState(()=>{ const s=loadSavedSession(); if(s) window.__hyprUser=s; return s; });
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
  const [studies,setStudies]=useState([]);
  const [notifs,setNotifs]=useState(INITIAL_NOTIFS);
  const [showNotifs,setShowNotifs]=useState(false);
  const [teamMembers,setTeamMembers]=useState([]);
  const [teamLoading,setTeamLoading]=useState(false);
  const notifRef=useRef();

  useEffect(()=>{document.documentElement.setAttribute("data-theme",theme)},[theme]);
  useEffect(()=>{const fn=e=>{if(notifRef.current&&!notifRef.current.contains(e.target))setShowNotifs(false)};document.addEventListener("mousedown",fn);return()=>document.removeEventListener("mousedown",fn)},[]);
  useEffect(()=>{const fn=()=>setUser(window.__hyprUser);window.addEventListener("hypr-login",fn);return()=>window.removeEventListener("hypr-login",fn);},[]);

  // Fetch helpers — extraídos pra serem chamados no init, em polling, e ao voltar o foco
  const fetchTeam = useCallback(()=>{
    setTeamLoading(true);
    fetch(`${BACKEND_URL}/team`)
      .then(r=>r.json())
      .then(rows=>{ if(Array.isArray(rows)) setTeamMembers(rows.filter(m=>m.active!==false)); })
      .catch(err=>console.error("Error fetching team:",err))
      .finally(()=>setTeamLoading(false));
  },[]);
  const fetchTasks = useCallback(()=>{
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
            isSA:r.is_sa===true||r.is_sa==='true'||r.isSA===true,
            saMode:r.sa_mode||(r.is_sa===true||r.is_sa==='true'?"support":"none"),
            originalCs: r.original_cs||null,
            originalCsEmail: r.original_cs_email||null,
            createdAt:r.created_at?.value||r.created_at,
          })));
        }
      })
      .catch(err=>console.error("Error fetching tasks:",err));
  },[]);
  const fetchChecklists = useCallback(()=>{
    fetch(`${BACKEND_URL}/checklists`)
      .then(r=>r.json())
      .then(rows=>{ if(Array.isArray(rows)){setSubmittedChecklists(rows)} })
      .catch(err=>console.error("Error fetching checklists:",err));
  },[]);

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

    fetchTasks();
    fetchChecklists();
    fetchTeam();

    // Fetch studies from Cloud Function
    fetch(STUDIES_API_URL)
      .then(r=>r.json())
      .then(d=>{if(d.ok&&d.studies)setStudies(d.studies)})
      .catch(err=>console.error("Error fetching studies:",err));
  },[user,fetchTasks,fetchChecklists,fetchTeam]);

  // Polling: a cada 30s rebusca tasks e checklists pra ver mudanças de outros usuários.
  // Pausa quando a aba está oculta (não desperdiça quota) e refresca imediatamente ao voltar.
  useEffect(()=>{
    if(!user) return;
    let timer;
    const refresh = ()=>{ fetchTasks(); fetchChecklists(); };
    const start = ()=>{ stop(); timer = setInterval(refresh, 30000); };
    const stop = ()=>{ if(timer){clearInterval(timer); timer=null;} };
    const onVisibility = ()=>{
      if(document.visibilityState === "visible"){ refresh(); start(); }
      else { stop(); }
    };
    if(document.visibilityState === "visible") start();
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("focus", refresh);
    return ()=>{
      stop();
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("focus", refresh);
    };
  },[user,fetchTasks,fetchChecklists,fetchTeam]);

  // Generate notifications from real tasks
  useEffect(()=>{
    if(tasks.length===0) return;
    const n=[];
    const now=new Date();
    tasks.forEach(t=>{
      if(isTaskCompleted(t)) {
        n.push({id:`done-${t.id}`,type:"task",msg:`${t.client} — ${t.type} concluída`,time:"Concluída",read:true});
        return;
      }
      const dl=t.deadline?.value||t.deadline;
      if(!dl) return;
      const deadline=new Date(dl);
      const diffDays=Math.ceil((deadline-now)/(1000*60*60*24));
      if(diffDays<0){
        n.push({id:`late-${t.id}`,type:"task",msg:`${t.client} — ${t.type} atrasada (${Math.abs(diffDays)} dia${Math.abs(diffDays)>1?"s":""})`,time:"Atrasada",read:false});
      } else if(diffDays===0){
        n.push({id:`today-${t.id}`,type:"task",msg:`${t.client} — ${t.type} vence hoje`,time:"Hoje",read:false});
      } else if(diffDays<=2){
        n.push({id:`soon-${t.id}`,type:"task",msg:`${t.client} — ${t.type} vence em ${diffDays} dia${diffDays>1?"s":""}`,time:`${diffDays}d`,read:false});
      }
    });
    if(n.length>0) setNotifs(n);
  },[tasks]);

  const unread=notifs.filter(n=>!n.read).length;
  const markAllRead=()=>setNotifs(ns=>ns.map(n=>({...n,read:true})));
  const pageTitle=NAV.find(n=>n.key===page)?.label||"Command";

  const handleLogout=()=>{setUser(null);window.__hyprUser=null;clearSession();try{window.google.accounts.id.disableAutoSelect()}catch(e){}};

  if(!user) return <LoginScreen />;

  return(
    <AuthCtx.Provider value={user}>
    <TeamCtx.Provider value={{members:teamMembers,reload:fetchTeam,loading:teamLoading}}>
    <ClientsCtx.Provider value={clients}>
    <StudiesCtx.Provider value={studies}>
    <ThemeCtx.Provider value={{theme,setTheme}}>
    <ToastProvider>
      <style>{CSS}</style>
      <div className="app">
        {mobileOpen&&<div className="mob-ov vis" onClick={()=>setMobileOpen(false)}/>}

        {/* SIDEBAR */}
        <aside className={`sb${collapsed?" col":""}${mobileOpen?" mob":""}`}>
          <div className="sb-logo">
            {collapsed?<svg viewBox="0 0 28 32" style={{height:28,width:28}}><text x="1" y="26" fontFamily="Arial Black,sans-serif" fontWeight="900" fontSize="26" fill="#FFFFFF">H</text></svg>
            :<div style={{fontFamily:"var(--fd)",fontSize:18,fontWeight:800,color:"#fff",letterSpacing:"-0.5px"}}>HYPR<span style={{color:"var(--teal)",fontWeight:800}}>°</span> <span style={{color:"var(--teal)",fontWeight:400,fontSize:12,letterSpacing:".08em"}}>Command</span></div>}
          </div>
          {!collapsed&&<div className="sb-lbl">Módulos</div>}
          <nav className="sb-nav" style={{padding:collapsed?"8px":"8px 10px"}}>
            {NAV.filter(n => {
              if (n.key === 'admin')     return isAdminFromTeam(teamMembers, user?.email);
              return true;
            }).map(n=>(
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
            {page==="tasks"&&<TaskCenter tasks={tasks} setTasks={setTasks} onRefetch={fetchTasks} />}
            {page==="checklist"&&<CampaignChecklist initialData={duplicateData} onChecklistSubmit={(data)=>{setSubmittedChecklists(prev=>[{...data,id:Date.now(),created_at:new Date().toISOString()},...prev]);setDuplicateData(null)}} />}
            {page==="checklist-center"&&<ChecklistCenter checklists={submittedChecklists} setChecklists={setSubmittedChecklists} onDuplicate={(c)=>{setDuplicateData(c);navigate("checklist")}} onRefetch={fetchChecklists} />}
            {page==="admin"&&isAdminFromTeam(teamMembers,user?.email)&&<AdminPanel />}
          </div>
        </div>
      </div>
    </ToastProvider>
    </ThemeCtx.Provider>
    </StudiesCtx.Provider>
    </ClientsCtx.Provider>
    </TeamCtx.Provider>
    </AuthCtx.Provider>
  );
}
