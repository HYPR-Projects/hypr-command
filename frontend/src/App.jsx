import { useState, useEffect, useMemo, useRef, createContext, useContext, useCallback } from "react";
import { LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

// ─── CONSTANTS ───────────────────────────────────────────────────────────────
const CS_LIST = ["Beatriz Severine","Isaac Agiman","João Armelin","João Buzolin","Mariana Lewinski","Thiago Nascimento","Greenfield"];
const CS_EMAILS = {
  "Beatriz Severine":"beatriz.severine@hypr.mobi",
  "Isaac Agiman":"isaac.lobo@hypr.mobi",
  "João Armelin":"joao.armelin@hypr.mobi",
  "João Buzolin":"joao.buzolin@hypr.mobi",
  "Mariana Lewinski":"mariana.lewinski@hypr.mobi",
  "Thiago Nascimento":"thiago.nascimento@hypr.mobi",
};
const GREENFIELD_QUEUE = CS_LIST.filter(c => c !== "Greenfield");
const TASK_TYPES = ["Audience Discovery","Estudo de Mercado","Case de Sucesso","Pós-Venda","Dados RMNF"];
const SLA_DAYS = { "Audience Discovery": 3, "Estudo de Mercado": 5, "Case de Sucesso": 7, "Pós-Venda": 2, "Dados RMNF": 3 };
const HYPR_LOGO = "data:image/png;base64,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";
const CORE_PRODUCTS = ["O2O","OOH","RMN Digital","RMN Físico"];
const CHECKLIST_CORE_PRODUCTS = ["O2O","OOH","RMNF","RMND"];
const FEATURES = ["P-DOOH","Brand Query","Carbon Neutral","Click to Calendar","Design Studio","Downloaded Apps","Survey","Tap To Scratch","Tap to Go","Topics","Seat","Tap To Carousel","Tap To Chat","Tap To Max","Weather","Purchase Context"];
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

// Features that ALSO need an extra text input (asked alongside volumetry)
const FEAT_EXTRA_TEXT = {
  "Topics": { label: "Categorias / Keywords do Topics", placeholder: "Ex: Categoria de eletrodomésticos; keywords: geladeira, fogão, lava-louças..." },
  "Downloaded Apps": { label: "Apps a serem incluídos no setup", placeholder: "Liste os apps (um por linha ou separados por vírgula). Ex: iFood, Rappi, Uber Eats..." },
};

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
const TeamCtx = createContext({members:[],reload:()=>{}});
const useTeam = () => useContext(TeamCtx);
// Helpers derived from team members (with hardcoded fallback for first load)
const teamCS = (team) => {
  const list = team.filter(m=>m.role==='cs'||m.role==='admin').map(m=>m.name);
  return list.length>0 ? [...list, "Greenfield"] : CS_LIST;
};
const teamCSEmails = (team) => {
  const map = {};
  team.forEach(m => { if (m.role==='cs'||m.role==='admin') map[m.name] = m.email; });
  return Object.keys(map).length>0 ? map : CS_EMAILS;
};
const teamHasProposalAccess = (team, email) => {
  if (!email) return false;
  const e = email.toLowerCase();
  const m = team.find(x => x.email.toLowerCase() === e);
  if (!m) return false;
  return m.role === 'admin' || m.role === 'sales';
};
const teamIsAdmin = (team, email) => {
  if (!email) return false;
  const e = email.toLowerCase();
  const m = team.find(x => x.email.toLowerCase() === e);
  return !!m && m.role === 'admin';
};


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
    "list":<><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></>,
    "layout":<><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></>,
    "lock":<><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></>,
    "trash":<><polyline points="3 6 5 6 21 6"/><path d="M19 6l-2 14a2 2 0 01-2 2H9a2 2 0 01-2-2L5 6"/><path d="M10 11v6M14 11v6M9 6V4a2 2 0 012-2h2a2 2 0 012 2v2"/></>,
    "edit":<><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 113 3L12 15l-4 1 1-4 9.5-9.5z"/></>,
  };
  return <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{flexShrink:0,...st}} {...r}>{p[n]}</svg>;
};

function getTaskStatus(t) {
  const s = (t.status || '').toLowerCase();
  if (s === "entregue" || s === "completed") return "Concluída";
  if (s === "iniciada") return "Iniciada";
  return new Date() > new Date(t.deadline) ? "Atrasada" : "Dentro do SLA";
}
// Raw status used by the kanban (aberta / iniciada / entregue)
function rawStatus(t) {
  const s = (t.status || '').toLowerCase();
  if (s === "entregue" || s === "completed") return "entregue";
  if (s === "iniciada") return "iniciada";
  return "aberta";
}

// ─── HYPR Logo ───────────────────────────────────────────────────────────────
// Reproduz a logo "HYPR°" oficial usando texto SVG (Urbanist) + um pequeno
// quadrado preenchido no canto superior direito do R. Aceita a prop `color`
// para se adaptar a fundos claros e escuros.
function HyprLogo({color="#FFFFFF",height=28,style}) {
  // Logo HYPR oficial (PNG branco embedado em base64). O parâmetro `color` é
  // mantido por compatibilidade com chamadas existentes mas não é mais usado —
  // o asset é fixo branco. Para dark backgrounds (sidebar/login) renderiza ideal.
  return (
    <img src={HYPR_LOGO} alt="HYPR" style={{height,width:"auto",display:"block",...style}}/>
  );
}

// ─── CSS ─────────────────────────────────────────────────────────────────────
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=Urbanist:ital,wght@0,300..900;1,300..900&display=swap');

/* ═══════════ LIGHT THEME (refinado) ═══════════ */
:root{
  --navy:#1C262F;--teal:#3397B9;--teal-l:#4ab3d6;--teal-dim:rgba(51,151,185,0.10);--teal-glow:rgba(51,151,185,0.20);
  --yellow:#EDD900;--yellow-dim:rgba(237,217,0,0.10);
  --bg1:#FAFBFC;--bg2:#FFFFFF;--bg3:#F1F4F7;--bg-card:#FFFFFF;--bg-sidebar:#0E151C;--bg-input:#FFFFFF;
  --bg-hero:linear-gradient(135deg,rgba(51,151,185,0.05) 0%,rgba(255,255,255,0.5) 100%);
  --t1:#1C262F;--t2:#4A6070;--t3:#8DA0AE;
  --bdr:#E4EAEF;--bdr-focus:#3397B9;--bdr-card:#EAEEF2;--bdr-soft:#F1F4F7;
  --sh-sm:0 1px 2px rgba(28,38,47,0.04);--sh-md:0 4px 12px rgba(28,38,47,0.06);--sh-lg:0 12px 32px rgba(28,38,47,0.10);
  --green:#22C55E;--green-bg:rgba(34,197,94,0.10);--red:#EF4444;--red-bg:rgba(239,68,68,0.10);--yellow-s:#F59E0B;--yellow-s-bg:rgba(245,158,11,0.10);
  --r:10px;--rl:14px;--rxl:18px;
  --ff:'Urbanist',sans-serif;--fd:'Syne',sans-serif;
  --tr:0.18s ease;
}

/* ═══════════ DARK THEME (premium) ═══════════ */
[data-theme="dark"]{
  --bg1:#0E151C;--bg2:#141D25;--bg3:#1A242E;--bg-card:rgba(255,255,255,0.025);--bg-sidebar:#0A1015;--bg-input:rgba(255,255,255,0.03);
  --bg-hero:linear-gradient(135deg,rgba(51,151,185,0.08) 0%,rgba(28,38,47,0.4) 100%);
  --t1:#F1F5F9;--t2:rgba(255,255,255,0.6);--t3:rgba(255,255,255,0.38);
  --bdr:rgba(255,255,255,0.06);--bdr-card:rgba(255,255,255,0.06);--bdr-soft:rgba(255,255,255,0.04);
  --teal-dim:rgba(51,151,185,0.10);--teal-glow:rgba(51,151,185,0.25);
  --sh-sm:0 1px 2px rgba(0,0,0,0.3);--sh-md:0 4px 12px rgba(0,0,0,0.3);--sh-lg:0 8px 24px rgba(0,0,0,0.4);
}

*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
html{font-size:14px;-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale}
body{font-family:var(--ff);background:var(--bg1);color:var(--t1);transition:background var(--tr),color var(--tr)}
::-webkit-scrollbar{width:6px;height:6px}::-webkit-scrollbar-track{background:transparent}::-webkit-scrollbar-thumb{background:var(--bdr);border-radius:99px}::-webkit-scrollbar-thumb:hover{background:var(--t3)}

.app{display:flex;min-height:100vh;background:var(--bg1);transition:background var(--tr)}

/* ═══════════ SIDEBAR ═══════════ */
.sb{width:230px;min-width:230px;background:linear-gradient(180deg,#080C11 0%,var(--bg-sidebar) 100%);display:flex;flex-direction:column;position:fixed;top:0;left:0;bottom:0;z-index:100;border-right:1px solid rgba(255,255,255,0.04);transition:width .22s cubic-bezier(.4,0,.2,1),min-width .22s cubic-bezier(.4,0,.2,1),transform .22s cubic-bezier(.4,0,.2,1)}
.sb.col{width:68px;min-width:68px}
@media(max-width:768px){.sb{transform:translateX(-100%);width:260px;min-width:260px}.sb.col{width:260px;min-width:260px}.sb.mob{transform:translateX(0);box-shadow:4px 0 32px rgba(0,0,0,0.5)}}
.sb-logo{padding:18px 20px;border-bottom:1px solid rgba(255,255,255,0.05);display:flex;align-items:center;justify-content:center;min-height:64px}
.sb-lbl{font-family:var(--ff);font-size:10px;font-weight:600;letter-spacing:0.12em;text-transform:uppercase;color:rgba(255,255,255,0.32);padding:18px 20px 8px}
.sb-nav{padding:0 10px;display:flex;flex-direction:column;gap:2px}
.ni{display:flex;align-items:center;gap:11px;padding:10px 12px;border-radius:9px;color:rgba(255,255,255,0.58);font-size:13px;font-weight:500;cursor:pointer;border:none;background:none;width:100%;text-align:left;transition:all var(--tr);position:relative;text-decoration:none;font-family:var(--ff)}
.ni svg{flex-shrink:0;opacity:0.7;transition:opacity var(--tr)}
.ni:hover{background:rgba(255,255,255,0.04);color:#fff}
.ni:hover svg{opacity:1}
.ni.act{background:linear-gradient(90deg,rgba(51,151,185,0.18) 0%,rgba(51,151,185,0.02) 100%);color:#fff}
.ni.act svg{opacity:1;color:var(--teal-l)}
.ni.act::before{content:"";position:absolute;left:0;top:9px;bottom:9px;width:2.5px;background:var(--teal);border-radius:99px;box-shadow:0 0 8px rgba(51,151,185,0.6)}
.sb-bot{padding:14px 16px;border-top:1px solid rgba(255,255,255,0.05);display:flex;align-items:center;justify-content:space-between;margin-top:auto}

/* ═══════════ MAIN ═══════════ */
.mn{margin-left:230px;flex:1;display:flex;flex-direction:column;min-height:100vh;transition:margin-left .22s cubic-bezier(.4,0,.2,1)}
.mn.col{margin-left:68px}
@media(max-width:768px){.mn,.mn.col{margin-left:0}}
.tb{height:60px;background:var(--bg2);border-bottom:1px solid var(--bdr);display:flex;align-items:center;justify-content:space-between;padding:0 28px;position:sticky;top:0;z-index:50;transition:background var(--tr),border-color var(--tr);backdrop-filter:blur(8px)}
[data-theme="dark"] .tb{background:rgba(14,21,28,0.7)}
.pg{flex:1;padding:24px 28px}
@media(max-width:768px){.pg{padding:16px}}

/* ═══════════ HERO CARD (Dashboard only) ═══════════ */
.hero{
  background:var(--bg-hero);
  border:1px solid var(--bdr-card);
  border-radius:var(--rxl);
  padding:24px 28px;
  display:flex;justify-content:space-between;align-items:center;
  position:relative;overflow:hidden;
  margin-bottom:24px;
  transition:all var(--tr);
}
[data-theme="dark"] .hero{border-color:rgba(51,151,185,0.15)}
.hero::before{content:"";position:absolute;top:0;left:0;width:100px;height:2px;background:linear-gradient(90deg,var(--teal),transparent)}
.hero-meta{display:flex;align-items:center;gap:12px;margin-bottom:10px;flex-wrap:wrap}
.hero-meta .line{width:28px;height:2px;background:var(--teal);border-radius:99px}
.hero-meta .lbl{font-size:11px;color:var(--teal);letter-spacing:0.1em;font-weight:600}
[data-theme="dark"] .hero-meta .lbl{color:var(--teal-l)}
.hero-meta .status{display:flex;align-items:center;gap:6px;font-size:11px;color:var(--green);font-weight:600;letter-spacing:0.05em}
.hero-meta .status .dot{width:7px;height:7px;border-radius:50%;background:var(--green);box-shadow:0 0 6px rgba(34,197,94,0.5)}
.hero h1{font-family:var(--fd);font-size:26px;color:var(--t1);letter-spacing:-0.5px;margin-bottom:6px;font-weight:700}
.hero p{font-size:13px;color:var(--t2)}
.hero-date{text-align:right;padding:14px 22px;border:1px solid var(--bdr-card);border-radius:var(--rl);background:var(--bg2);min-width:160px}
[data-theme="dark"] .hero-date{background:rgba(255,255,255,0.02);border-color:var(--bdr-card)}
.hero-date .lbl{font-size:10px;color:var(--t3);letter-spacing:0.1em;margin-bottom:4px;font-weight:600}
.hero-date .val{font-family:var(--fd);font-size:16px;color:var(--t1);font-weight:600}
@media(max-width:600px){.hero{flex-direction:column;align-items:flex-start;gap:16px}.hero-date{align-self:stretch;text-align:left}}

/* ═══════════ COMPONENTS ═══════════ */
.card{background:var(--bg-card);border:1px solid var(--bdr-card);border-radius:var(--rl);box-shadow:var(--sh-sm);transition:all var(--tr)}
[data-theme="dark"] .card{background:rgba(255,255,255,0.025);backdrop-filter:blur(4px)}
.card:hover{box-shadow:var(--sh-md);border-color:var(--bdr)}
[data-theme="dark"] .card:hover{background:rgba(255,255,255,0.035);border-color:rgba(255,255,255,0.10)}

/* Metric card variant */
.mc{background:var(--bg-card);border:1px solid var(--bdr-card);border-radius:var(--rl);padding:18px;transition:all var(--tr);position:relative;overflow:hidden}
[data-theme="dark"] .mc{background:linear-gradient(180deg,rgba(255,255,255,0.03) 0%,rgba(255,255,255,0.005) 100%)}
.mc:hover{border-color:var(--bdr);box-shadow:var(--sh-md)}
[data-theme="dark"] .mc:hover{background:linear-gradient(180deg,rgba(255,255,255,0.05) 0%,rgba(255,255,255,0.01) 100%);border-color:rgba(255,255,255,0.10)}
.mc-head{display:flex;align-items:center;gap:6px;margin-bottom:10px}
.mc-dot{width:6px;height:6px;border-radius:50%;background:var(--teal);flex-shrink:0}
.mc-dot.y{background:var(--yellow)}.mc-dot.g{background:var(--green)}.mc-dot.a{background:var(--yellow-s)}.mc-dot.r{background:var(--red)}
.mc-lbl{font-size:10.5px;color:var(--t2);letter-spacing:0.1em;font-weight:600;text-transform:uppercase}
.mc-val{font-family:var(--fd);font-size:30px;color:var(--t1);line-height:1;letter-spacing:-0.8px;font-weight:700}
.mc-val .unit{font-size:13px;color:var(--t2);letter-spacing:0;font-weight:500;margin-left:4px}
.mc-foot{margin-top:12px;display:flex;align-items:center;gap:8px;flex-wrap:wrap}

/* Buttons */
.btn{display:inline-flex;align-items:center;gap:6px;padding:9px 16px;border-radius:var(--r);font-family:var(--ff);font-size:13px;font-weight:600;cursor:pointer;border:none;transition:all var(--tr);white-space:nowrap}
.bp{background:linear-gradient(135deg,var(--teal),var(--teal-l));color:#fff}
.bp:hover{transform:translateY(-1px);box-shadow:0 4px 14px rgba(51,151,185,0.3)}
.bp:disabled{opacity:.5;cursor:not-allowed;transform:none;box-shadow:none}
.bs{background:var(--bg3);color:var(--t1);border:1px solid var(--bdr)}
[data-theme="dark"] .bs{background:rgba(255,255,255,0.04);border-color:rgba(255,255,255,0.10)}
.bs:hover{background:var(--bg-input)}
[data-theme="dark"] .bs:hover{background:rgba(255,255,255,0.08)}
.bg{background:transparent;color:var(--t2);padding:8px 10px}
.bg:hover{background:var(--bg3);color:var(--t1)}
[data-theme="dark"] .bg:hover{background:rgba(255,255,255,0.04)}

/* Forms */
.fg{display:flex;flex-direction:column;gap:6px}
.fl{font-size:11px;font-weight:600;color:var(--t2);letter-spacing:0.05em;text-transform:uppercase}
.fi,.fs,.ft{background:var(--bg-input);border:1px solid var(--bdr);border-radius:var(--r);padding:10px 12px;font-family:var(--ff);font-size:13px;color:var(--t1);transition:all var(--tr);width:100%;outline:none}
[data-theme="dark"] .fi,[data-theme="dark"] .fs,[data-theme="dark"] .ft{background:rgba(255,255,255,0.03);border-color:rgba(255,255,255,0.08)}
.fi:focus,.fs:focus,.ft:focus{border-color:var(--bdr-focus);box-shadow:0 0 0 3px var(--teal-dim)}
[data-theme="dark"] .fi:focus,[data-theme="dark"] .fs:focus,[data-theme="dark"] .ft:focus{background:rgba(255,255,255,0.05)}
.ft{resize:vertical;min-height:90px}
.fs{cursor:pointer;appearance:none;background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%238DA0AE' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E");background-repeat:no-repeat;background-position:right 12px center;padding-right:32px}

/* Chips & Badges */
.chip{display:inline-flex;align-items:center;gap:6px;padding:5px 12px;border-radius:99px;border:1px solid var(--bdr);background:var(--bg-input);color:var(--t2);font-size:12px;font-weight:500;cursor:pointer;transition:all var(--tr);user-select:none}
[data-theme="dark"] .chip{background:rgba(255,255,255,0.03);border-color:rgba(255,255,255,0.08)}
.chip:hover{border-color:var(--teal);color:var(--teal)}
.chip.sel{background:var(--teal-dim);border-color:var(--teal);color:var(--teal-l)}
.badge{display:inline-flex;align-items:center;gap:5px;padding:3px 9px;border-radius:99px;font-size:11px;font-weight:600;letter-spacing:0.02em}
.b-grn{background:var(--green-bg);color:var(--green)}
.b-red{background:var(--red-bg);color:var(--red)}
.b-ylw{background:var(--yellow-s-bg);color:var(--yellow-s)}
.b-teal{background:var(--teal-dim);color:var(--teal-l)}
.b-blue{background:rgba(51,151,185,0.15);color:var(--teal)}

/* Progress bar */
.pbar{height:6px;background:var(--bg3);border-radius:99px;overflow:hidden}
[data-theme="dark"] .pbar{background:rgba(255,255,255,0.06)}
.pfill{height:100%;border-radius:99px;transition:width .6s ease}
.pfill.good{background:var(--green);box-shadow:0 0 6px rgba(34,197,94,0.4)}
.pfill.warn{background:var(--yellow-s);box-shadow:0 0 6px rgba(245,158,11,0.4)}
.pfill.danger{background:var(--red);box-shadow:0 0 6px rgba(239,68,68,0.4)}

/* Modal */
.mo{position:fixed;inset:0;background:rgba(0,0,0,0.5);backdrop-filter:blur(6px);z-index:300;display:flex;align-items:center;justify-content:center;padding:20px;animation:fi .15s ease}
@keyframes fi{from{opacity:0}to{opacity:1}}
.ml{background:var(--bg-card);border:1px solid var(--bdr-card);border-radius:var(--rxl);box-shadow:var(--sh-lg);width:100%;max-width:640px;max-height:90vh;overflow-y:auto;animation:su .2s ease}
[data-theme="dark"] .ml{background:#141D25;border-color:rgba(255,255,255,0.08)}
.ml-lg{max-width:860px}
@keyframes su{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
.mh{padding:24px 28px 0;display:flex;align-items:flex-start;justify-content:space-between;gap:16px}
.mt{font-family:var(--fd);font-size:18px;font-weight:700;color:var(--t1)}
.mb{padding:20px 28px 28px;display:flex;flex-direction:column;gap:18px}

/* Dropdown */
.dd{position:absolute;top:calc(100% + 4px);left:0;right:0;background:var(--bg-card);border:1px solid var(--bdr);border-radius:var(--r);box-shadow:var(--sh-lg);z-index:200;max-height:240px;overflow-y:auto}
[data-theme="dark"] .dd{background:#141D25;border-color:rgba(255,255,255,0.08)}
.di{padding:9px 14px;font-size:13px;cursor:pointer;color:var(--t1);transition:background var(--tr)}
.di:hover{background:var(--bg3)}
[data-theme="dark"] .di:hover{background:rgba(255,255,255,0.05)}
.di.sel{color:var(--teal);font-weight:600}

/* Table */
.dt{width:100%;border-collapse:collapse}
.dt th{padding:11px 14px;text-align:left;font-size:10.5px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:var(--t3);border-bottom:1px solid var(--bdr)}
.dt td{padding:13px 14px;font-size:13px;color:var(--t1);border-bottom:1px solid var(--bdr-soft)}
.dt tr:last-child td{border-bottom:none}
.dt tr:hover td{background:var(--bg3)}
[data-theme="dark"] .dt tr:hover td{background:rgba(255,255,255,0.025)}

/* Accordion */
.acc{border:1px solid var(--bdr-card);border-radius:var(--rl);overflow:hidden;margin-bottom:10px;background:var(--bg-card)}
[data-theme="dark"] .acc{background:rgba(255,255,255,0.025)}
.acc-h{display:flex;align-items:center;justify-content:space-between;padding:14px 20px;cursor:pointer;user-select:none;transition:background var(--tr)}
.acc-h:hover{background:var(--bg3)}
[data-theme="dark"] .acc-h:hover{background:rgba(255,255,255,0.04)}

/* Toast */
.toast-c{position:fixed;bottom:24px;right:24px;z-index:999;display:flex;flex-direction:column;gap:8px}
.toast{background:var(--bg-card);border:1px solid var(--bdr-card);border-radius:var(--r);box-shadow:var(--sh-lg);padding:14px 18px;display:flex;align-items:center;gap:10px;animation:su .2s ease;font-size:13px;min-width:280px;border-left:3px solid var(--green)}
[data-theme="dark"] .toast{background:#141D25;border-color:rgba(255,255,255,0.08)}

/* Disclaimer */
.disc{background:var(--yellow-dim);border:1px solid rgba(237,217,0,0.3);border-radius:var(--r);padding:10px 14px;font-size:12px;color:var(--t2);display:flex;align-items:flex-start;gap:8px}

/* Section label (used between blocks) */
.sec-lbl{font-size:11px;color:var(--t3);letter-spacing:0.12em;font-weight:600;margin-bottom:12px;text-transform:uppercase;display:flex;justify-content:space-between;align-items:center}
.sec-lbl a{color:var(--teal);text-decoration:none;font-weight:500;letter-spacing:0;font-size:12px;text-transform:none}
.sec-lbl a:hover{color:var(--teal-l)}

/* Page header (non-dashboard pages) */
.pg-hd{display:flex;justify-content:space-between;align-items:flex-start;gap:20px;margin-bottom:24px;flex-wrap:wrap}
.pg-hd h1{font-family:var(--fd);font-size:24px;color:var(--t1);font-weight:700;margin-bottom:4px;letter-spacing:-0.4px}
.pg-hd p{color:var(--t2);font-size:13px}

/* Topbar pill (live indicator) */
.pill-live{padding:5px 11px;border-radius:99px;background:var(--teal-dim);border:1px solid rgba(51,151,185,0.25);font-size:11px;color:var(--teal);font-weight:500;display:flex;align-items:center;gap:6px}
[data-theme="dark"] .pill-live{color:var(--teal-l)}
.pill-live .dot{width:6px;height:6px;border-radius:50%;background:var(--teal);box-shadow:0 0 6px rgba(51,151,185,0.6)}

/* Icon button */
.icn-btn{width:34px;height:34px;border-radius:9px;border:1px solid var(--bdr);background:var(--bg2);display:flex;align-items:center;justify-content:center;color:var(--t2);cursor:pointer;transition:all var(--tr);position:relative}
[data-theme="dark"] .icn-btn{background:rgba(255,255,255,0.02);border-color:rgba(255,255,255,0.08)}
.icn-btn:hover{background:var(--bg3);color:var(--t1);border-color:var(--t3)}
[data-theme="dark"] .icn-btn:hover{background:rgba(255,255,255,0.05);border-color:rgba(255,255,255,0.18)}
.icn-btn-dot{position:absolute;top:5px;right:5px;width:7px;height:7px;border-radius:50%;background:var(--red);border:2px solid var(--bg2)}
[data-theme="dark"] .icn-btn-dot{border-color:#0E151C}

/* Grid */
.g2{display:grid;grid-template-columns:1fr 1fr;gap:14px}
.g3{display:grid;grid-template-columns:repeat(3,1fr);gap:14px}
.g4{display:grid;grid-template-columns:repeat(4,1fr);gap:14px}
@media(max-width:1100px){.g4{grid-template-columns:repeat(2,1fr)}.g3{grid-template-columns:1fr 1fr}}
@media(max-width:600px){.g2,.g3,.g4{grid-template-columns:1fr}}

/* Empty state */
.empty{display:flex;flex-direction:column;align-items:center;justify-content:center;padding:60px 20px;text-align:center;gap:12px;color:var(--t3)}

/* Mobile overlay */
.mob-ov{display:none;position:fixed;inset:0;background:rgba(0,0,0,0.4);z-index:99}
@media(max-width:768px){.mob-ov.vis{display:block}}

/* Notification panel */
.notif-panel{position:absolute;top:calc(100% + 8px);right:0;width:340px;background:var(--bg-card);border:1px solid var(--bdr);border-radius:var(--rl);box-shadow:var(--sh-lg);z-index:200;animation:su .15s ease;overflow:hidden}
[data-theme="dark"] .notif-panel{background:#141D25;border-color:rgba(255,255,255,0.08)}
.notif-item{padding:12px 16px;border-bottom:1px solid var(--bdr-soft);display:flex;gap:10px;align-items:flex-start;transition:background var(--tr);cursor:default}
.notif-item:hover{background:var(--bg3)}
[data-theme="dark"] .notif-item:hover{background:rgba(255,255,255,0.025)}
.notif-item:last-child{border-bottom:none}

/* Page transition */
.page-enter{animation:pageIn .25s ease}
@keyframes pageIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}

/* Mobile hamburger */
.hamburger{display:none}
@media(max-width:768px){.hamburger{display:flex}}

/* Recharts custom */
.recharts-cartesian-grid-horizontal line,.recharts-cartesian-grid-vertical line{stroke:var(--bdr) !important}
.recharts-text{fill:var(--t3) !important;font-size:11px !important}
.recharts-tooltip-wrapper{outline:none !important}
.recharts-default-tooltip{background:var(--bg-card) !important;border:1px solid var(--bdr) !important;border-radius:var(--r) !important;box-shadow:var(--sh-md) !important}
[data-theme="dark"] .recharts-default-tooltip{background:#141D25 !important;border-color:rgba(255,255,255,0.10) !important}
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
  const [dateFilter,setDateFilter]=useState("all");
  const [customFrom,setCustomFrom]=useState("");
  const [customTo,setCustomTo]=useState("");

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
    if (!from) return checklists;
    return checklists.filter(c => {
      const sd = c.start_date?.value || c.start_date;
      if (!sd) return false;
      // Parse YYYY-MM-DD localmente (sem TZ shift)
      const m = String(sd).match(/^(\d{4})-(\d{2})-(\d{2})/);
      const d = m ? new Date(parseInt(m[1]),parseInt(m[2])-1,parseInt(m[3])) : new Date(sd);
      return d >= from && d <= to;
    });
  }, [checklists, getDateRange]);

  const filteredTasks = useMemo(() => {
    const [from, to] = getDateRange();
    if (!from) return tasks;
    return tasks.filter(t => {
      const d = new Date(t.createdAt || t.created_at?.value || t.created_at);
      return d >= from && d <= to;
    });
  }, [tasks, getDateRange]);

  // Active campaigns = checklists where today is between start_date and end_date
  const active = useMemo(() => {
    const parseDateLocal = (v) => {
      if (!v) return null;
      const m = String(v).match(/^(\d{4})-(\d{2})-(\d{2})/);
      return m ? new Date(parseInt(m[1]),parseInt(m[2])-1,parseInt(m[3])) : new Date(v);
    };
    const today = new Date(); today.setHours(0,0,0,0);
    return filteredChecklists.filter(c => {
      const s = parseDateLocal(c.start_date?.value || c.start_date);
      const e = parseDateLocal(c.end_date?.value || c.end_date);
      if (!s || !e) return false;
      // end_date inclusive: considera campanha ativa até o final do dia de end_date
      e.setHours(23,59,59,999);
      return today >= s && today <= e;
    });
  }, [filteredChecklists]);

  const totalInvestment = filteredChecklists.reduce((s,c) => s + (parseFloat(c.investment)||0), 0);
  const openTasks = filteredTasks.filter(t => getTaskStatus(t) !== "Concluída");
  const overdueTasks = filteredTasks.filter(t => getTaskStatus(t) === "Atrasada");

  // Monthly investment chart data from checklists
  const monthlyData = useMemo(() => {
    const m = {};
    filteredChecklists.forEach(c => {
      const sd = c.start_date?.value || c.start_date;
      if (!sd) return;
      // Parse YYYY-MM-DD localmente (sem deixar TZ converter de UTC pra local)
      const match = String(sd).match(/^(\d{4})-(\d{2})-(\d{2})/);
      if (!match) return;
      const monthIdx = parseInt(match[2],10) - 1;
      const mo = MONTHS_PT[monthIdx].substring(0,3);
      m[mo] = (m[mo]||0) + (parseFloat(c.investment)||0);
    });
    // Ordena cronologicamente
    return Object.entries(m)
      .map(([name,value]) => ({name,value,_idx:MONTHS_PT.findIndex(x=>x.substring(0,3)===name)}))
      .sort((a,b)=>a._idx-b._idx)
      .map(({name,value})=>({name,value}));
  }, [filteredChecklists]);

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
      {/* Hero card */}
      <div className="hero">
        <div>
          <div className="hero-meta">
            <div className="line"></div>
            <span className="lbl">OPERAÇÕES</span>
            <span className="status"><span className="dot"></span>ATIVO</span>
          </div>
          <h1>{new Date().getHours()<12?"Bom dia":new Date().getHours()<18?"Boa tarde":"Boa noite"}, {user?.name?.split(" ")[0]||"!"}</h1>
          <p>Aqui está o resumo do HYPR Command — {new Date().toLocaleDateString("pt-BR",{weekday:"long",day:"numeric",month:"long"})}</p>
        </div>
        <div className="hero-date">
          <div className="lbl">HOJE</div>
          <div className="val">{new Date().toLocaleDateString("pt-BR",{day:"2-digit",month:"short",year:"numeric"}).replace(/\./g,"")}</div>
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
      <div className="g3" style={{marginBottom:24}}>
        {[
          {label:"Campanhas Ativas",value:active.length,icon:"zap",color:"var(--green)",sub:`de ${filteredChecklists.length} no período`},
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
        {/* Investment by month - Area chart with gradient */}
        <div className="card" style={{padding:"18px 20px"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:14}}>
            <div>
              <div style={{fontSize:14,fontWeight:600,color:"var(--t1)",fontFamily:"var(--fd)"}}>Investimento mensal</div>
              <div style={{fontSize:11,color:"var(--t3)",marginTop:2}}>Últimos meses · em R$</div>
            </div>
            {totalInvestment>0&&<span className="badge b-teal">Total: {fmtCurrency(totalInvestment)}</span>}
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={monthlyData} margin={{top:10,right:8,left:0,bottom:0}}>
              <defs>
                <linearGradient id="gradInvest" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="var(--teal)" stopOpacity={0.4}/>
                  <stop offset="100%" stopColor="var(--teal)" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <XAxis dataKey="name" tick={{fontSize:11,fill:"var(--t3)"}} axisLine={false} tickLine={false} />
              <YAxis hide />
              <Tooltip formatter={v => fmtCurrency(v)} contentStyle={{background:"var(--bg-card)",border:"1px solid var(--bdr)",borderRadius:10,fontSize:12,boxShadow:"var(--sh-md)"}} labelStyle={{color:"var(--t2)",fontSize:11}} />
              <Area type="monotone" dataKey="value" stroke="var(--teal)" strokeWidth={2} fill="url(#gradInvest)" dot={{r:3.5,fill:"var(--teal)",strokeWidth:0}} activeDot={{r:5,fill:"var(--yellow)",stroke:"var(--bg-card)",strokeWidth:2}} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Tasks por CS - Bar chart horizontal */}
        <div className="card" style={{padding:"18px 20px"}}>
          <div style={{marginBottom:14}}>
            <div style={{fontSize:14,fontWeight:600,color:"var(--t1)",fontFamily:"var(--fd)"}}>Tasks por CS</div>
            <div style={{fontSize:11,color:"var(--t3)",marginTop:2}}>Distribuição da equipe</div>
          </div>
          {taskByCS.length===0?(
            <div style={{padding:"40px 0",textAlign:"center",color:"var(--t3)",fontSize:12}}>Sem tasks no período</div>
          ):(
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={taskByCS} layout="vertical" barSize={14} margin={{top:4,right:16,left:0,bottom:0}}>
                <XAxis type="number" tick={{fontSize:11,fill:"var(--t3)"}} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="name" tick={{fontSize:12,fill:"var(--t2)"}} axisLine={false} tickLine={false} width={80} />
                <Tooltip contentStyle={{background:"var(--bg-card)",border:"1px solid var(--bdr)",borderRadius:10,fontSize:12,boxShadow:"var(--sh-md)"}} labelStyle={{color:"var(--t2)",fontSize:11}} cursor={{fill:"var(--bg3)"}} />
                <Bar dataKey="tasks" fill="var(--teal)" radius={[0,99,99,0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
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
  const [editingTask,setEditingTask]=useState(null);
  const [linkModal,setLinkModal]=useState(null);
  const [selected,setSelected]=useState(null);
  const [search,setSearch]=useState("");
  const [filterStatus,setFilterStatus]=useState("all");
  const [filterCS,setFilterCS]=useState("");
  const [viewMode,setViewMode]=useState(()=>localStorage.getItem("hypr_task_view")||"list");
  const [startModal,setStartModal]=useState(null); // {task, message}
  const [permError,setPermError]=useState("");
  const [dragOverCol,setDragOverCol]=useState(null);
  const toast = useToast();
  const gfIdx = useRef(0);
  const user = window.__hyprUser;

  const setView=(v)=>{setViewMode(v);try{localStorage.setItem("hypr_task_view",v);}catch{}};

  const filtered = useMemo(()=>{
    return tasks.filter(t=>{
      const q=search.toLowerCase();
      const mQ=!q||t.client.toLowerCase().includes(q)||t.type.toLowerCase().includes(q)||t.cs.toLowerCase().includes(q);
      const mCS=!filterCS||t.cs===filterCS;
      const st=getTaskStatus(t);
      const mSt=filterStatus==="all"||(filterStatus==="open"&&(st==="Dentro do SLA"||st==="Iniciada"))||(filterStatus==="overdue"&&st==="Atrasada")||(filterStatus==="done"&&st==="Concluída");
      return mQ&&mCS&&mSt;
    });
  },[tasks,search,filterStatus,filterCS]);

  const counts=useMemo(()=>({
    all:tasks.length,
    open:tasks.filter(t=>{const s=getTaskStatus(t);return s==="Dentro do SLA"||s==="Iniciada";}).length,
    overdue:tasks.filter(t=>getTaskStatus(t)==="Atrasada").length,
    done:tasks.filter(t=>getTaskStatus(t)==="Concluída").length,
  }),[tasks]);

  const handleSubmit=async(data)=>{
    const newTask={...data,id:Date.now(),status:"aberta",requestedBy:data.requestedBy||"Você"};
    setTasks(t=>[newTask,...t]);
    setShowNew(false);
    toast("Task criada com sucesso!");
    try{
      await fetch(`${BACKEND_URL}/tasks`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(data)});
    }catch(err){console.error("Backend task POST error:",err)}
  };

  // Permission helper: only the CS who owns the task can change its status
  const canChangeStatus=(task)=>{
    if(!user||!task) return false;
    const owner=(task.csEmail||task.cs_email||"").toLowerCase();
    const me=(user.email||"").toLowerCase();
    return !owner||owner===me;
  };

  // Edit permission: superuser, CP (requester) or CS responsible
  const SUPERUSER_TASK="matheus.machado@hypr.mobi";
  const canEdit=(task)=>{
    if(!user||!task) return false;
    const me=(user.email||"").toLowerCase();
    if(me===SUPERUSER_TASK) return true;
    const allowed=[task.csEmail||task.cs_email,task.requesterEmail||task.requester_email]
      .filter(Boolean).map(e=>e.toLowerCase());
    return allowed.includes(me);
  };

  const handleEdit=async(updatedData)=>{
    if(!canEdit(updatedData)){setPermError("Apenas o solicitante, o CS responsável ou o admin podem editar esta task.");return;}
    // Optimistic update
    const prevTask=tasks.find(t=>t.id===updatedData.id);
    setTasks(ts=>ts.map(t=>t.id===updatedData.id?{...t,...updatedData}:t));
    setEditingTask(null);
    toast("Salvando alterações...");
    try{
      const r=await fetch(`${BACKEND_URL}/tasks/${updatedData.id}`,{
        method:"PUT",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({
          edit:true,
          task:updatedData,
          editedBy:user?.name,
          editedByEmail:user?.email,
        }),
      });
      if(!r.ok){
        // Revert
        if(prevTask) setTasks(ts=>ts.map(t=>t.id===updatedData.id?prevTask:t));
        if(r.status===403){
          setPermError("Apenas o solicitante, o CS responsável ou o admin podem editar esta task.");
        }else{
          toast(`Erro ao salvar (${r.status}).`);
        }
        return;
      }
      toast("Task atualizada! E-mails enviados aos envolvidos.");
    }catch(err){
      console.error("Backend task EDIT error:",err);
      if(prevTask) setTasks(ts=>ts.map(t=>t.id===updatedData.id?prevTask:t));
      toast("Erro de rede ao editar.");
    }
  };

  const handleStart=(task,message)=>{
    if(!canChangeStatus(task)){setPermError("Apenas o CS responsável pode iniciar esta task.");return;}
    setTasks(ts=>ts.map(t=>t.id===task.id?{...t,status:"iniciada"}:t));
    toast("Task iniciada!");
    fetch(`${BACKEND_URL}/tasks/${task.id}`,{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify({status:"iniciada",task,message,changedByEmail:user?.email})})
      .then(r=>{if(!r.ok&&r.status===403){setPermError("Apenas o CS responsável pode iniciar esta task.");setTasks(ts=>ts.map(t=>t.id===task.id?{...t,status:"aberta"}:t));}})
      .catch(err=>console.error("Backend task START error:",err));
    setStartModal(null);
  };

  const handleComplete=async(id)=>{
    const task=tasks.find(t=>t.id===id);
    if(!canChangeStatus(task)){setPermError("Apenas o CS responsável pode concluir esta task.");return;}
    setTasks(ts=>ts.map(t=>t.id===id?{...t,status:"entregue"}:t));
    toast("Task concluída!");
    try{
      const r=await fetch(`${BACKEND_URL}/tasks/${id}`,{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify({status:"entregue",task,changedByEmail:user?.email})});
      if(!r.ok&&r.status===403){setPermError("Apenas o CS responsável pode concluir esta task.");setTasks(ts=>ts.map(t=>t.id===id?task:t));}
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

  const handleDrop=(task,targetCol)=>{
    setDragOverCol(null);
    const current=rawStatus(task);
    if(current===targetCol) return;
    if(!canChangeStatus(task)){setPermError("Apenas o CS responsável pode alterar o status desta task.");return;}
    if(targetCol==="iniciada") setStartModal({task,message:""});
    else if(targetCol==="entregue") handleComplete(task.id);
    // Note: we don't allow dragging back to "aberta" — that would be undoing work.
  };

  const tabs=[{key:"all",label:"Todas",count:counts.all},{key:"open",label:"Em aberto",count:counts.open},{key:"overdue",label:"Atrasadas",count:counts.overdue},{key:"done",label:"Concluídas",count:counts.done}];

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
        <div style={{display:"flex",gap:8,alignItems:"center"}}>
          <div style={{display:"flex",border:"1px solid var(--bdr)",borderRadius:"var(--r)",overflow:"hidden"}}>
            <button onClick={()=>setView("list")} title="Visualização em lista" style={{padding:"6px 12px",border:"none",background:viewMode==="list"?"var(--teal)":"transparent",color:viewMode==="list"?"#fff":"var(--t2)",cursor:"pointer",fontSize:12,fontWeight:600,display:"flex",alignItems:"center",gap:4}}><I n="list" s={13}/>Lista</button>
            <button onClick={()=>setView("kanban")} title="Visualização kanban" style={{padding:"6px 12px",border:"none",background:viewMode==="kanban"?"var(--teal)":"transparent",color:viewMode==="kanban"?"#fff":"var(--t2)",cursor:"pointer",fontSize:12,fontWeight:600,display:"flex",alignItems:"center",gap:4}}><I n="layout" s={13}/>Kanban</button>
          </div>
          <button className="btn bp" onClick={()=>setShowNew(true)}><I n="plus" s={14} /> Nova Task</button>
        </div>
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
      ):viewMode==="kanban"?(
        <KanbanBoard tasks={filtered} canChangeStatus={canChangeStatus} canEdit={canEdit} onEdit={setEditingTask} onOpen={setSelected} onAddLink={setLinkModal} onStart={(t)=>{if(!canChangeStatus(t)){setPermError("Apenas o CS responsável pode iniciar esta task.");return;}setStartModal({task:t,message:""});}} onComplete={handleComplete} onDrop={handleDrop} dragOverCol={dragOverCol} setDragOverCol={setDragOverCol}/>
      ):(
        <div className="card" style={{padding:0,overflow:"hidden"}}>
          <table className="dt">
            <thead>
              <tr>
                <th style={{width:"22%"}}>Cliente</th>
                <th style={{width:"18%"}}>Tipo</th>
                <th style={{width:"18%"}}>CS</th>
                <th style={{width:"12%"}}>Prazo</th>
                <th style={{width:"12%"}}>SLA</th>
                <th style={{width:"14%"}}>Status</th>
                <th style={{width:"4%"}}></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(t=>{
                const st=getTaskStatus(t);
                const stCls=st==="Concluída"?"b-teal":st==="Atrasada"?"b-red":st==="Iniciada"?"b-blue":"b-grn";
                const slaOk=st!=="Atrasada";
                return(
                  <tr key={t.id} onClick={()=>setSelected(t)} style={{cursor:"pointer"}}>
                    <td>
                      <div style={{display:"flex",alignItems:"center",gap:10}}>
                        <div style={{width:32,height:32,borderRadius:"50%",background:"linear-gradient(135deg,var(--teal),var(--teal-l))",display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:700,color:"#fff",flexShrink:0}}>{t.client?.substring(0,2).toUpperCase()||"?"}</div>
                        <div style={{minWidth:0}}>
                          <div style={{fontWeight:600,color:"var(--t1)",fontSize:13,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{t.client}</div>
                          {t.agency&&<div style={{fontSize:11,color:"var(--t3)",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{t.agency}</div>}
                        </div>
                      </div>
                    </td>
                    <td><span style={{padding:"3px 10px",borderRadius:99,background:"var(--bg3)",border:"1px solid var(--bdr)",fontSize:11,fontWeight:600,color:"var(--t2)",fontFamily:"var(--fd)"}}>{t.type}</span></td>
                    <td style={{color:"var(--t2)",fontSize:12.5}}>{t.cs||"—"}</td>
                    <td style={{fontSize:12.5,color:st==="Atrasada"?"var(--red)":"var(--t2)",fontWeight:st==="Atrasada"?600:400}}>{fmtDate(t.deadline)}</td>
                    <td><span className={`badge ${slaOk?"b-grn":"b-red"}`}>{slaOk?"No prazo":"Atrasada"}</span></td>
                    <td><span className={`badge ${stCls}`}>{st}</span></td>
                    <td onClick={e=>e.stopPropagation()}>
                      <div style={{display:"flex",gap:4,justifyContent:"flex-end"}}>
                        {t.docLink&&<a href={t.docLink} target="_blank" rel="noreferrer" className="btn bg" style={{padding:"5px 8px",fontSize:11}} title="Abrir documento"><I n="external" s={12}/></a>}
                        {rawStatus(t)==="aberta"&&<button className="btn bp" style={{fontSize:11,padding:"5px 10px"}} disabled={!canChangeStatus(t)} title={!canChangeStatus(t)?"Apenas o CS responsável pode iniciar":""} onClick={()=>{if(!canChangeStatus(t)){setPermError("Apenas o CS responsável pode iniciar esta task.");return;}setStartModal({task:t,message:""});}}><I n="play" s={11}/></button>}
                        {rawStatus(t)==="iniciada"&&<button className="btn bp" style={{fontSize:11,padding:"5px 10px"}} disabled={!canChangeStatus(t)} title={!canChangeStatus(t)?"Apenas o CS responsável pode concluir":""} onClick={()=>handleComplete(t.id)}><I n="check" s={11}/></button>}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {showNew && <NewTaskModal onClose={()=>setShowNew(false)} onSubmit={handleSubmit} gfIdx={gfIdx} />}
      {editingTask && <NewTaskModal onClose={()=>setEditingTask(null)} onSubmit={handleEdit} gfIdx={gfIdx} initialData={editingTask} />}
      {linkModal && <DocLinkModal task={linkModal} onClose={()=>setLinkModal(null)} onSave={handleSaveLink} />}
      {selected && <TaskDetailModal task={selected} onClose={()=>setSelected(null)} canEdit={canEdit(selected)} onEdit={()=>{setEditingTask(selected);setSelected(null);}} onComplete={(id)=>{handleComplete(id);setSelected(null);}} onStart={(t)=>{if(!canChangeStatus(t)){setPermError("Apenas o CS responsável pode iniciar esta task.");return;}setStartModal({task:t,message:""});setSelected(null);}} canStart={selected&&rawStatus(selected)==="aberta"&&canChangeStatus(selected)} onAddLink={(t)=>{setLinkModal(t);setSelected(null);}} />}
      {startModal && <StartTaskModal task={startModal.task} onClose={()=>setStartModal(null)} onConfirm={(msg)=>handleStart(startModal.task,msg)} />}
      {permError && <PermErrorModal msg={permError} onClose={()=>setPermError("")} />}
    </div>
  );
}

function TaskCard({task,onStart,onComplete,onAddLink,onOpen,canChangeStatus=true}) {
  const st=getTaskStatus(task);
  const raw=rawStatus(task);
  const stCls=st==="Concluída"?"b-teal":st==="Atrasada"?"b-red":st==="Iniciada"?"b-blue":"b-grn";
  const stIcon=st==="Atrasada"?"alert-circle":st==="Iniciada"?"play":"check-circle";
  const stop=e=>e.stopPropagation();
  return (
    <div className="card" style={{padding:"18px 20px",display:"flex",flexDirection:"column",gap:12,cursor:"pointer"}} onClick={()=>onOpen&&onOpen(task)}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <div style={{display:"flex",alignItems:"center",gap:6}}>
          <span style={{padding:"3px 10px",borderRadius:99,background:"var(--bg3)",border:"1px solid var(--bdr)",fontSize:11,fontWeight:700,color:"var(--t2)",fontFamily:"var(--fd)"}}>{task.type}</span>
          <span className={`badge ${stCls}`}><I n={stIcon} s={10} /> {st}</span>
        </div>
        <span style={{fontSize:11,color:"var(--t3)"}}>#{task.id}</span>
      </div>
      <div>
        <div style={{fontSize:15,fontWeight:700,fontFamily:"var(--fd)",marginBottom:2}}>{task.client}</div>
        <div style={{fontSize:12,color:"var(--t2)",lineHeight:1.5,display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical",overflow:"hidden"}}>{task.briefing}</div>
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
        <div style={{display:"flex",gap:6}} onClick={stop}>
          {task.docLink&&<a href={task.docLink} target="_blank" rel="noreferrer" className="btn bs" style={{fontSize:11,padding:"5px 10px",textDecoration:"none"}} onClick={stop}><I n="external" s={12} />Doc</a>}
          <button className="btn bg" style={{fontSize:11,padding:"5px 10px"}} onClick={e=>{stop(e);onAddLink(task);}} title={task.docLink?"Editar link":"Adicionar link"}><I n="link" s={12} />{task.docLink?"Editar":"Link"}</button>
          {raw==="aberta"&&onStart&&<button className="btn bp" style={{fontSize:11,padding:"5px 12px"}} disabled={!canChangeStatus} title={!canChangeStatus?"Apenas o CS responsável pode iniciar":""} onClick={e=>{stop(e);onStart();}}><I n="play" s={12} />Iniciar</button>}
          {raw==="iniciada"&&<button className="btn bp" style={{fontSize:11,padding:"5px 12px"}} disabled={!canChangeStatus} title={!canChangeStatus?"Apenas o CS responsável pode concluir":""} onClick={e=>{stop(e);onComplete(task.id);}}><I n="check" s={12} />Concluir</button>}
        </div>
      </div>
    </div>
  );
}

// ── Task Detail Modal ──────────────────────────────────────────────────────
function TaskDetailModal({task,onClose,onComplete,onAddLink,onStart,canStart,canEdit,onEdit}) {
  useEffect(()=>{const h=e=>{if(e.key==="Escape")onClose()};window.addEventListener("keydown",h);return()=>window.removeEventListener("keydown",h);},[onClose]);
  const st=getTaskStatus(task);
  const raw=rawStatus(task);
  const stCls=st==="Concluída"?"b-teal":st==="Atrasada"?"b-red":st==="Iniciada"?"b-blue":"b-grn";
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
  const Tags=({items,color})=>(items||[]).length>0?(
    <div style={{display:"flex",gap:4,flexWrap:"wrap"}}>
      {items.map(p=><span key={p} style={{padding:"3px 10px",background:color==="teal"?"var(--teal-dim)":"var(--bg3)",color:color==="teal"?"var(--teal-l)":"var(--t2)",borderRadius:99,fontSize:12,fontWeight:600,border:color==="teal"?"1px solid var(--teal)":"1px solid var(--bdr)"}}>{p}</span>)}
    </div>
  ):null;
  return(
    <div className="mo" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="ml ml-lg" style={{maxWidth:760}}>
        <div className="mh">
          <div>
            <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:6}}>
              <span style={{padding:"3px 10px",borderRadius:99,background:"var(--bg3)",border:"1px solid var(--bdr)",fontSize:11,fontWeight:700,color:"var(--t2)",fontFamily:"var(--fd)"}}>{task.type}</span>
              <span className={`badge ${stCls}`}><I n={st==="Atrasada"?"alert-circle":"check-circle"} s={10}/> {st}</span>
              <span style={{fontSize:11,color:"var(--t3)"}}>#{task.id}</span>
            </div>
            <div className="mt">{task.client}</div>
            {task.agency&&<div style={{fontSize:12,color:"var(--t3)",marginTop:4}}>{task.agency}</div>}
          </div>
          <button className="btn bg" onClick={onClose}><I n="x" s={18}/></button>
        </div>
        <div className="mb">
          {/* Briefing - destaque */}
          <div style={{padding:16,background:"var(--teal-dim)",border:"1px solid var(--teal)",borderRadius:"var(--r)",marginBottom:16}}>
            <div style={{fontSize:11,color:"var(--teal-l)",textTransform:"uppercase",fontWeight:700,marginBottom:8,letterSpacing:"0.06em"}}>Briefing</div>
            <div style={{fontSize:14,color:"var(--t1)",lineHeight:1.6,whiteSpace:"pre-wrap"}}>{task.briefing||"—"}</div>
          </div>

          {/* Detalhes em grid */}
          <div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:10,marginBottom:16}}>
            <D l="CS Responsável" v={task.cs}/>
            <D l="E-mail do CS" v={task.csEmail||task.cs_email}/>
            <D l="Solicitante" v={task.requestedBy}/>
            <D l="E-mail Solicitante" v={task.requesterEmail||task.requester_email}/>
            <D l="Prazo" v={fmtDate(task.deadline)}/>
            <D l="Criada em" v={fmtDate(task.createdAt||task.created_at)}/>
            {task.budget>0&&<D l="Investimento" v={fmtCurrency(task.budget)}/>}
            {task.sla&&<D l="SLA" v={task.sla}/>}
            {task.docLink&&<D l="Documento" v={task.docLink} wide/>}
          </div>

          {/* Produtos & Features */}
          {(task.products?.length>0||task.features?.length>0)&&(
            <div style={{padding:16,background:"var(--bg3)",borderRadius:"var(--r)",marginBottom:16}}>
              {task.products?.length>0&&<div style={{marginBottom:task.features?.length>0?12:0}}>
                <div style={{fontSize:11,color:"var(--t3)",textTransform:"uppercase",fontWeight:700,marginBottom:8,letterSpacing:"0.06em"}}>Produtos</div>
                <Tags items={task.products} color="teal"/>
              </div>}
              {task.features?.length>0&&<div>
                <div style={{fontSize:11,color:"var(--t3)",textTransform:"uppercase",fontWeight:700,marginBottom:8,letterSpacing:"0.06em"}}>Features</div>
                <Tags items={task.features}/>
              </div>}
            </div>
          )}

          {/* Ações */}
          <div style={{display:"flex",gap:10,justifyContent:"flex-end",paddingTop:8,borderTop:"1px solid var(--bdr)"}}>
            {task.docLink&&<a href={task.docLink} target="_blank" rel="noreferrer" className="btn bs" style={{textDecoration:"none"}}><I n="external" s={14}/>Abrir Doc</a>}
            <button className="btn bs" onClick={()=>onAddLink(task)}><I n="link" s={14}/>{task.docLink?"Editar Link":"Adicionar Link"}</button>
            {canEdit&&onEdit&&<button className="btn bs" onClick={onEdit} title="Editar task"><I n="file-text" s={14}/>Editar</button>}
            {raw==="aberta"&&onStart&&<button className="btn bp" disabled={!canStart} onClick={()=>onStart(task)} title={!canStart?"Apenas o CS responsável pode iniciar":""}><I n="play" s={14}/>Iniciar Task</button>}
            {raw==="iniciada"&&<button className="btn bp" onClick={()=>onComplete(task.id)}><I n="check" s={14}/>Concluir Task</button>}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Kanban Board ───────────────────────────────────────────────────────────
function KanbanBoard({tasks,canChangeStatus,onOpen,onAddLink,onStart,onComplete,onDrop,dragOverCol,setDragOverCol}) {
  const COLS=[
    {key:"aberta",title:"Aberta",icon:"clipboard",accent:"var(--t3)"},
    {key:"iniciada",title:"Iniciada",icon:"play",accent:"var(--teal)"},
    {key:"entregue",title:"Entregue",icon:"check-circle",accent:"var(--green)"},
  ];
  const grouped=COLS.map(c=>({...c,items:tasks.filter(t=>rawStatus(t)===c.key)}));
  return(
    <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:16,minHeight:400}}>
      {grouped.map(col=>(
        <div key={col.key}
          onDragOver={e=>{e.preventDefault();setDragOverCol(col.key);}}
          onDragLeave={()=>setDragOverCol(null)}
          onDrop={e=>{e.preventDefault();const id=e.dataTransfer.getData("text/plain");const t=tasks.find(x=>String(x.id)===String(id));if(t)onDrop(t,col.key);}}
          style={{background:dragOverCol===col.key?"var(--teal-dim)":"var(--bg3)",borderRadius:"var(--r)",padding:12,border:dragOverCol===col.key?"2px dashed var(--teal)":"2px dashed transparent",transition:"all .15s"}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12,padding:"4px 8px"}}>
            <div style={{display:"flex",alignItems:"center",gap:6}}>
              <I n={col.icon} s={14} c={col.accent}/>
              <span style={{fontFamily:"var(--fd)",fontSize:13,fontWeight:700,color:"var(--t1)"}}>{col.title}</span>
            </div>
            <span style={{fontSize:11,fontWeight:700,color:"var(--t2)",background:"var(--bg2)",borderRadius:99,padding:"2px 8px"}}>{col.items.length}</span>
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:8}}>
            {col.items.length===0?(
              <div style={{padding:"24px 12px",textAlign:"center",fontSize:12,color:"var(--t3)",fontStyle:"italic"}}>Nenhuma task</div>
            ):col.items.map(t=>{
              const canDrag=canChangeStatus(t)&&col.key!=="entregue";
              return <KanbanCard key={t.id} task={t} canDrag={canDrag} canChangeStatus={canChangeStatus(t)} onOpen={onOpen} onAddLink={onAddLink} onStart={onStart} onComplete={onComplete}/>;
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

function KanbanCard({task,canDrag,canChangeStatus,onOpen,onAddLink,onStart,onComplete}) {
  const raw=rawStatus(task);
  const overdue=raw!=="entregue"&&new Date()>new Date(task.deadline);
  const stop=e=>e.stopPropagation();
  return(
    <div
      draggable={canDrag}
      onDragStart={e=>{e.dataTransfer.setData("text/plain",String(task.id));e.dataTransfer.effectAllowed="move";}}
      onClick={()=>onOpen&&onOpen(task)}
      style={{background:"var(--bg-card)",border:`1px solid ${overdue?"var(--red)":"var(--bdr-card)"}`,borderLeft:overdue?"3px solid var(--red)":undefined,borderRadius:"var(--r)",padding:"10px 12px",cursor:canDrag?"grab":"pointer",boxShadow:"var(--sh-sm)",display:"flex",flexDirection:"column",gap:6,transition:"all 0.15s"}}
      onMouseEnter={e=>{e.currentTarget.style.boxShadow="var(--sh-md)";e.currentTarget.style.transform="translateY(-1px)";}}
      onMouseLeave={e=>{e.currentTarget.style.boxShadow="var(--sh-sm)";e.currentTarget.style.transform="translateY(0)";}}
    >
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:6}}>
        <span style={{padding:"2px 7px",borderRadius:99,background:"var(--bg3)",border:"1px solid var(--bdr)",fontSize:9.5,fontWeight:700,color:"var(--t2)",fontFamily:"var(--fd)",whiteSpace:"nowrap",textOverflow:"ellipsis",overflow:"hidden",maxWidth:140}}>{task.type}</span>
        <span style={{fontSize:9.5,color:"var(--t3)"}}>#{String(task.id).slice(-6)}</span>
      </div>
      <div style={{fontSize:13,fontWeight:700,color:"var(--t1)",fontFamily:"var(--fd)",lineHeight:1.2}}>{task.client}</div>
      <div style={{display:"flex",alignItems:"center",gap:10,fontSize:10.5,color:"var(--t3)"}}>
        <span style={{display:"flex",alignItems:"center",gap:3}}><I n="user" s={10}/>{(task.cs||"—").split(" ")[0]}</span>
        <span style={{display:"flex",alignItems:"center",gap:3,color:overdue?"var(--red)":"var(--t3)",fontWeight:overdue?600:400}}><I n="calendar" s={10}/>{fmtDate(task.deadline)}</span>
        {task.docLink&&<a href={task.docLink} target="_blank" rel="noreferrer" onClick={stop} title="Abrir doc" style={{marginLeft:"auto",color:"var(--teal)",display:"flex",alignItems:"center"}}><I n="external" s={11}/></a>}
      </div>
      {(raw==="aberta"||raw==="iniciada")&&(
        <div onClick={stop} style={{display:"flex",gap:4,marginTop:2}}>
          {raw==="aberta"&&<button className="btn bp" disabled={!canChangeStatus} title={!canChangeStatus?"Apenas o CS responsável":""} style={{fontSize:10,padding:"4px 8px",flex:1,gap:4}} onClick={()=>onStart(task)}><I n="play" s={10}/>Iniciar</button>}
          {raw==="iniciada"&&<button className="btn bp" disabled={!canChangeStatus} title={!canChangeStatus?"Apenas o CS responsável":""} style={{fontSize:10,padding:"4px 8px",flex:1,gap:4}} onClick={()=>onComplete(task.id)}><I n="check" s={10}/>Concluir</button>}
          <button className="btn bg" style={{fontSize:10,padding:"4px 6px"}} onClick={()=>onAddLink(task)} title="Link"><I n="link" s={10}/></button>
        </div>
      )}
    </div>
  );
}

// ── Start Task Modal ───────────────────────────────────────────────────────
function StartTaskModal({task,onClose,onConfirm}) {
  const [msg,setMsg]=useState("");
  useEffect(()=>{const h=e=>{if(e.key==="Escape")onClose()};window.addEventListener("keydown",h);return()=>window.removeEventListener("keydown",h);},[onClose]);
  return(
    <div className="mo" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="ml" style={{maxWidth:480}}>
        <div className="mh">
          <div>
            <div className="mt"><I n="play" s={18} c="var(--teal)" style={{verticalAlign:"middle",marginRight:8}}/>Iniciar Task</div>
            <div style={{fontSize:12,color:"var(--t3)",marginTop:4}}>#{task.id} — {task.type} · {task.client}</div>
          </div>
          <button className="btn bg" onClick={onClose}><I n="x" s={18}/></button>
        </div>
        <div className="mb">
          <div style={{padding:14,background:"var(--teal-dim)",border:"1px solid var(--teal)",borderRadius:"var(--r)",marginBottom:16,fontSize:13,color:"var(--t1)",lineHeight:1.5}}>
            <I n="bell" s={14} c="var(--teal)" style={{verticalAlign:"middle",marginRight:6}}/>
            <strong>{task.requestedBy||"O solicitante"}</strong> será notificado por e-mail que você iniciou esta task.
          </div>
          <div className="fg">
            <label className="fl">Comentário (opcional)</label>
            <textarea className="ft" rows={4} placeholder="Ex: Tô levantando os dados, entrego até quinta." value={msg} onChange={e=>setMsg(e.target.value)} autoFocus/>
            <div style={{fontSize:11,color:"var(--t3)",marginTop:4}}>Esta mensagem aparecerá no e-mail enviado ao solicitante.</div>
          </div>
          <div style={{display:"flex",gap:10,justifyContent:"flex-end",marginTop:20}}>
            <button className="btn bg" onClick={onClose}>Cancelar</button>
            <button className="btn bp" onClick={()=>onConfirm(msg)}><I n="play" s={14}/>Iniciar e Notificar</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Permission Error Modal ─────────────────────────────────────────────────
function PermErrorModal({msg,onClose}) {
  useEffect(()=>{const h=e=>{if(e.key==="Escape")onClose()};window.addEventListener("keydown",h);return()=>window.removeEventListener("keydown",h);},[onClose]);
  return(
    <div className="mo" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="ml" style={{maxWidth:380}}>
        <div className="mb" style={{textAlign:"center",padding:"30px 20px"}}>
          <I n="lock" s={36} c="var(--yellow-s)" style={{marginBottom:12}}/>
          <div style={{fontFamily:"var(--fd)",fontSize:16,fontWeight:700,marginBottom:8}}>Ação não permitida</div>
          <div style={{fontSize:13,color:"var(--t2)",lineHeight:1.5,marginBottom:20}}>{msg}</div>
          <button className="btn bp" onClick={onClose}>Entendi</button>
        </div>
      </div>
    </div>
  );
}

function NewTaskModal({onClose,onSubmit,gfIdx,initialData}) {
  const user = useAuth();
  const CLIENT_DB = useClients();
  const isEdit = !!initialData;
  const [f,sF]=useState(()=>{
    if (initialData) {
      return {
        type: initialData.type || "",
        client: initialData.client || "",
        agency: initialData.agency || "",
        products: initialData.products || [],
        features: initialData.features || [],
        budget: initialData.budget != null ? String(initialData.budget) : "",
        briefing: initialData.briefing || "",
        cs: initialData.cs || "",
        csEmail: initialData.csEmail || initialData.cs_email || "",
        isSA: typeof initialData.isSA === "boolean" ? initialData.isSA : (typeof initialData.is_sa === "boolean" ? initialData.is_sa : null),
        customDeadline: initialData.deadline || null,
        slaDate: initialData.deadline || null,
        autoCS: false,
      };
    }
    return {type:"",client:"",agency:"",products:[],features:[],budget:"",briefing:"",cs:"",csEmail:"",isSA:null,customDeadline:null,slaDate:null,autoCS:false};
  });
  const set=(k,v)=>sF(p=>({...p,[k]:v}));
  const tog=(k,v)=>sF(p=>({...p,[k]:p[k].includes(v)?p[k].filter(x=>x!==v):[...p[k],v]}));
  // Recalcula SLA padrão quando o tipo muda — mas em modo edit não sobrescreve customDeadline já existente
  useEffect(()=>{
    if(f.type&&SLA_DAYS[f.type]){
      const d=addBusinessDays(new Date(),SLA_DAYS[f.type]);
      set("slaDate",d.toISOString().split("T")[0]);
      if(!isEdit) set("customDeadline",null);
    }
  },[f.type]);
  useEffect(()=>{const h=e=>{if(e.key==="Escape")onClose()};window.addEventListener("keydown",h);return()=>window.removeEventListener("keydown",h);},[onClose]);

  const handleClientSelect=(entry)=>{
    if(!entry){sF(p=>({...p,cs:"",csEmail:"",autoCS:false}));return;}
    if(entry.cs&&entry.csEmail){sF(p=>({...p,cs:entry.cs,csEmail:entry.csEmail,autoCS:true,agency:entry.agency||p.agency}));}
    else{sF(p=>({...p,cs:"",csEmail:"",autoCS:false,agency:entry.agency||p.agency}));}
  };
  const handleCS=cs=>{if(cs===""){sF(p=>({...p,cs:"",csEmail:"",autoCS:false}));return;}if(cs==="Greenfield"){const next=GREENFIELD_QUEUE[gfIdx.current%GREENFIELD_QUEUE.length];gfIdx.current++;sF(p=>({...p,cs:next,csEmail:CS_EMAILS[next]||"",autoCS:false}));}else sF(p=>({...p,cs:cs,csEmail:CS_EMAILS[cs]||"",autoCS:false}));};
  const sla=f.customDeadline||f.slaDate;
  const valid=f.type&&f.client&&f.cs&&f.briefing&&typeof f.isSA==="boolean";

  const handleConfirm=()=>{
    const payload={...f,deadline:sla,sla:SLA_DAYS[f.type]?`${SLA_DAYS[f.type]} dias úteis`:"—"};
    if(isEdit){
      onSubmit({...payload,id:initialData.id,requesterEmail:initialData.requesterEmail||initialData.requester_email,requestedBy:initialData.requestedBy||initialData.requested_by,createdAt:initialData.createdAt||initialData.created_at,status:initialData.status||"open"});
    }else{
      onSubmit({...payload,requesterEmail:user?.email,requestedBy:user?.name,status:"open",createdAt:new Date().toISOString().split("T")[0]});
    }
  };

  return (
    <div className="mo" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="ml ml-lg">
        <div className="mh"><div><div className="mt">{isEdit?"Editar Task":"Nova Solicitação de Task"}</div><div style={{fontSize:12,color:"var(--t3)",marginTop:4}}>{isEdit?"Atualize as informações da task":"Preencha as informações para abrir a task"}</div></div><button className="btn bg" onClick={onClose}><I n="x" s={18}/></button></div>
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

          {/* Solutions Architect (SA) toggle — Gian recebe email em CC se "Sim" */}
          <div className="fg">
            <label className="fl">Solutions Architect (SA)? *</label>
            <div style={{display:"flex",gap:8}}>
              <button type="button" onClick={()=>set("isSA",true)} className={`chip${f.isSA===true?" sel":""}`} style={{padding:"8px 20px",fontSize:13,cursor:"pointer"}}>Sim</button>
              <button type="button" onClick={()=>set("isSA",false)} className={`chip${f.isSA===false?" sel":""}`} style={{padding:"8px 20px",fontSize:13,cursor:"pointer"}}>Não</button>
            </div>
            {f.isSA===true&&<div style={{fontSize:11,color:"var(--teal)",marginTop:6,display:"flex",alignItems:"center",gap:4}}><I n="check-circle" s={10}/>Gian Nardo (SA) será incluído em cópia no e-mail da task</div>}
          </div>

          <div className="fg"><label className="fl">Produto Core</label><div style={{display:"flex",flexWrap:"wrap",gap:8}}>{CORE_PRODUCTS.map(p=><span key={p} className={`chip${f.products.includes(p)?" sel":""}`} onClick={()=>tog("products",p)}>{p}</span>)}</div></div>
          <div className="fg"><label className="fl">Features</label><div style={{display:"flex",flexWrap:"wrap",gap:6}}>{FEATURES.map(x=><span key={x} className={`chip${f.features.includes(x)?" sel":""}`} style={{fontSize:11}} onClick={()=>tog("features",x)}>{x}</span>)}</div></div>
          <div className="fg"><label className="fl">Investimento previsto</label><NumInput decimal placeholder="R$ 150000" value={f.budget} onChange={v=>set("budget",v)}/></div>
          <div className="fg"><label className="fl">Briefing *</label><textarea className="ft" rows={4} placeholder="Descreva objetivos, contexto e necessidades..." value={f.briefing} onChange={e=>set("briefing",e.target.value)}/></div>
          {/* Logged-in user info */}
          {!isEdit&&<div style={{padding:"10px 14px",borderRadius:"var(--r)",background:"var(--bg3)",border:"1px solid var(--bdr)",display:"flex",alignItems:"center",gap:10}}>
            <I n="user" s={14} c="var(--teal)"/>
            <div style={{flex:1}}>
              <div style={{fontSize:11,color:"var(--t3)"}}>Solicitante (logado)</div>
              <div style={{fontSize:13,fontWeight:600,color:"var(--t1)"}}>{user?.name} <span style={{fontWeight:400,color:"var(--t3)"}}>({user?.email})</span></div>
            </div>
          </div>}
          {isEdit&&(initialData.requestedBy||initialData.requested_by)&&<div style={{padding:"10px 14px",borderRadius:"var(--r)",background:"var(--bg3)",border:"1px solid var(--bdr)",display:"flex",alignItems:"center",gap:10}}>
            <I n="user" s={14} c="var(--t3)"/>
            <div style={{flex:1}}>
              <div style={{fontSize:11,color:"var(--t3)"}}>Solicitante (original — não muda na edição)</div>
              <div style={{fontSize:13,fontWeight:600,color:"var(--t2)"}}>{initialData.requestedBy||initialData.requested_by} <span style={{fontWeight:400,color:"var(--t3)"}}>({initialData.requesterEmail||initialData.requester_email||"—"})</span></div>
            </div>
          </div>}
          {f.slaDate&&(<div><div style={{height:1,background:"var(--bdr)",margin:"8px 0 16px"}}/><div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}><div><div style={{fontSize:13,fontWeight:600}}>Data prevista</div><div style={{fontSize:12,color:"var(--t3)"}}>SLA: {SLA_DAYS[f.type]} dias úteis</div></div><div style={{padding:"8px 16px",borderRadius:"var(--r)",background:"var(--teal-dim)",border:"1px solid var(--teal)",fontSize:14,fontWeight:700,color:"var(--teal-l)",fontFamily:"var(--fd)"}}>{fmtDate(sla)}</div></div><div style={{fontSize:12,color:"var(--t3)",marginBottom:8}}>SLA personalizado?</div><input type="date" className="fi" style={{width:200}} value={f.customDeadline||f.slaDate} min={new Date().toISOString().split("T")[0]} onChange={e=>set("customDeadline",e.target.value)}/>{f.customDeadline&&f.customDeadline!==f.slaDate&&<div className="disc" style={{marginTop:10}}><I n="alert-triangle" s={14} c="var(--yellow)"/><span>Data fora do SLA padrão. Alinhe com o CS.</span></div>}</div>)}
          {isEdit&&<div className="disc" style={{marginTop:12}}><I n="alert-circle" s={14} c="var(--teal)"/><span>Ao salvar, um e-mail de notificação será enviado ao CS responsável e ao solicitante.</span></div>}
          <div style={{display:"flex",gap:10,justifyContent:"flex-end",marginTop:8}}>
            <button className="btn bs" onClick={onClose}>Cancelar</button>
            <button className="btn bp" disabled={!valid} onClick={handleConfirm}><I n={isEdit?"check":"send"} s={14}/>{isEdit?"Salvar Alterações":"Abrir Task"}</button>
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
  const availableStudies = useStudies();
  const INIT={cp_name:"",cp_email:"",agency:"",industry:"",start_date:"",end_date:"",client:"",campaign_type:"",campaign_name:"",investment:"",deal_dv360:"",formats:[],cpm:"",cpcv:"",products:[],o2o_impressoes:"",o2o_views:"",has_bonus:"",bonus_o2o_impressoes:"",bonus_o2o_views:"",ooh_link:"",audiences:"",selected_studies:[],praças_type:"",praças_states:[],praças_cities:[],praças_city_input:"",praças_city_state:"",praças_other:"",had_cs_meeting:"",marketplaces:[],features:[],feature_volumes:{},pecas_link:"",pi_link:"",proposta_link:"",extra_urls:[""],cs_name:"",cs_email:"",observations:""};
  const [f,sF]=useState(()=>{
    if(!initialData) return INIT;
    const d={...INIT,...initialData,start_date:"",end_date:"",id:undefined,created_at:undefined,submitted_by:undefined,submitted_by_email:undefined};
    if(!d.extra_urls||d.extra_urls.length===0) d.extra_urls=[""];
    return d;
  });
  const [submitted,sSub]=useState(false);
  const [submitting,sSubmitting]=useState(false);
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

  const showO2O=f.products.includes("O2O"),showOOH=f.products.includes("OOH"),showRMND=f.products.includes("RMND"),showRMNF=f.products.includes("RMNF");
  const hasBonus=f.has_bonus==="Sim",hasVideo=f.formats.includes("Video"),hasDisplay=f.formats.includes("Display");
  const [validationError,setValidationError]=useState(null);

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

  const handleReset=()=>{sF(INIT);sSub(false);setValidationError(null)};
  const handleSubmit=async()=>{
    // Prevent double-submission
    if (submitting) return;
    
    // Validate investment
    const error = validateInvestment();
    if (error) {
      setValidationError(error);
      return;
    }

    sSubmitting(true);
    const short_token = generateShortToken();
    const payload={...f,submittedBy:user?.name,submittedByEmail:user?.email,cp_name:user?.name,cp_email:user?.email,short_token};
    try{
      const r = await fetch(`${BACKEND_URL}/checklists`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload)});
      if(!r.ok){
        const errBody = await r.text().catch(()=>"");
        console.error("Backend checklist POST failed:",r.status,errBody);
        toast(`Erro ao enviar (${r.status}). Tente novamente.`);
        sSubmitting(false);
        return;
      }
      // Use backend-generated id (avoids duplicates from Date.now() if user double-clicks)
      const data = await r.json().catch(()=>({}));
      const finalPayload = {...payload, id: data.id || crypto.randomUUID()};
      if(onChecklistSubmit)onChecklistSubmit(finalPayload);
      sSub(true);
      toast("Checklist enviado com sucesso!");
    }catch(err){
      console.error("Backend checklist POST error:",err);
      toast("Erro de rede ao enviar. Tente novamente.");
      sSubmitting(false);
    }
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
          <CF l="Investimento (R$)" req><NumInput decimal placeholder="0,00" value={f.investment} onChange={v=>set("investment",v)}/></CF>
          <CF l="Deal DV360?" req><RG row opts={["Sim","Não"]} val={f.deal_dv360} onChange={v=>set("deal_dv360",v)}/></CF>
        </div>
        {f.cs_name&&f.cs_email&&(()=>{
          const dbEntry=CLIENT_DB.find(c=>c.client===f.client);
          const isAuto=dbEntry&&dbEntry.cs===f.cs_name;
          return (
            <div style={{marginTop:16,padding:"12px 16px",borderRadius:"var(--r)",background:"var(--green-bg)",border:"1px solid var(--green)",display:"flex",alignItems:"center",gap:10}}>
              <I n="check-circle" s={16} c="var(--green)"/>
              <div style={{flex:1}}><div style={{fontSize:12,fontWeight:700,color:"var(--green)"}}>{isAuto?"CS identificado automaticamente":"CS selecionado manualmente"}</div><div style={{fontSize:13,color:"var(--t1)",fontWeight:600,marginTop:2}}>{f.cs_name} <span style={{fontWeight:400,color:"var(--t3)"}}>({f.cs_email})</span></div></div>
              {!isAuto&&<button className="btn bg" style={{fontSize:11,padding:"4px 8px"}} onClick={()=>sF(p=>({...p,cs_name:"",cs_email:""}))}>Alterar</button>}
            </div>
          );
        })()}
        {f.client&&!f.cs_name&&CLIENT_DB.find(c=>c.client===f.client)&&(
          <div className="fg" style={{marginTop:16}}>
            <div className="disc" style={{marginBottom:8}}><I n="alert-triangle" s={14} c="var(--yellow-s)"/><span>Cliente sem CS encarteirado. Selecione o CS responsável para receber a notificação.</span></div>
            <label className="fl">CS Responsável *</label>
            <select className="fs" value={f.cs_name} onChange={e=>{const cs=e.target.value;sF(p=>({...p,cs_name:cs,cs_email:CS_EMAILS[cs]||""}));}}>
              <option value="">Selecione...</option>
              {CS_LIST.filter(c=>c!=="Greenfield").map(cs=><option key={cs}>{cs}</option>)}
            </select>
          </div>
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
                <CF l="Impressões Visíveis"><NumInput placeholder="Ex: 1000000" value={f[`${prod}_imp`]||""} onChange={v=>set(`${prod}_imp`,v)}/></CF>
                <CF l="Views 100%"><NumInput placeholder="Ex: 500000" value={f[`${prod}_views`]||""} onChange={v=>set(`${prod}_views`,v)}/></CF>
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
                <CF l="Impressões Visíveis Bonif."><NumInput value={f[`${prod}_bonus_imp`]||""} onChange={v=>set(`${prod}_bonus_imp`,v)}/></CF>
                <CF l="Views 100% Bonif."><NumInput value={f[`${prod}_bonus_views`]||""} onChange={v=>set(`${prod}_bonus_views`,v)}/></CF>
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
                        <CF key={field} l={field}><NumInput placeholder={feat==="P-DOOH"?"Obrigatório":"Opcional"} value={f[`fv_${feat}_${field}`]||""} onChange={v=>set(`fv_${feat}_${field}`,v)}/></CF>
                      ))}
                    </div>
                    {FEAT_EXTRA_TEXT[feat]&&(
                      <div style={{marginTop:10}}>
                        <CF l={FEAT_EXTRA_TEXT[feat].label} req>
                          <textarea className="ft" rows={3} placeholder={FEAT_EXTRA_TEXT[feat].placeholder} value={f[`fextra_${feat}`]||""} onChange={e=>set(`fextra_${feat}`,e.target.value)}/>
                        </CF>
                      </div>
                    )}
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
          <CF l="Link das peças"><input className="fi" placeholder="Link do Drive..." value={f.pecas_link} onChange={e=>set("pecas_link",e.target.value)}/><div className="disc" style={{marginTop:8}}><I n="alert-triangle" s={13} c="var(--yellow)"/>Verificar peso máximo das peças.</div></CF>
          <CF l="URLs de direcionamento"><div style={{display:"flex",flexDirection:"column",gap:8}}>{f.extra_urls.map((u,i)=><div key={i} style={{display:"flex",gap:8}}><input className="fi" placeholder="https://..." value={u} onChange={e=>{const a=[...f.extra_urls];a[i]=e.target.value;set("extra_urls",a)}}/>{f.extra_urls.length>1&&<button className="btn bg" onClick={()=>set("extra_urls",f.extra_urls.filter((_,j)=>j!==i))}><I n="x" s={14}/></button>}</div>)}<button className="btn bs" style={{alignSelf:"flex-start",fontSize:12}} onClick={()=>set("extra_urls",[...f.extra_urls,""])}><I n="plus" s={12}/>Adicionar URL</button></div></CF>
          <CF l="Link do PI"><input className="fi" value={f.pi_link} onChange={e=>set("pi_link",e.target.value)}/></CF>
          <CF l="Link da Proposta"><input className="fi" value={f.proposta_link} onChange={e=>set("proposta_link",e.target.value)}/></CF>
        </div>
      </Sec>

      {/* Observações para o CS */}
      <div className="card" style={{padding:"16px 20px",marginBottom:12}}>
        <div style={{fontSize:12,fontWeight:700,color:"var(--t2)",textTransform:"uppercase",letterSpacing:".06em",marginBottom:8}}>Observações</div>
        <div style={{fontSize:12,color:"var(--t3)",marginBottom:10,lineHeight:1.5}}>Inclua qualquer informação adicional necessária para o CS configurar a campanha (instruções, alertas, requisitos especiais, etc.).</div>
        <textarea className="ft" rows={4} placeholder="Ex: Cliente prefere criativo no formato vertical · Flight obrigatório aos sábados · Necessário aprovação prévia da agência antes do go-live..." value={f.observations||""} onChange={e=>set("observations",e.target.value)}/>
      </div>

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
          <button className="btn bs" onClick={handleReset} disabled={submitting}><I n="rotate" s={14}/>Limpar</button>
          <button className="btn bp" onClick={handleSubmit} disabled={submitting} style={submitting?{opacity:0.6,cursor:"wait"}:{}}>
            <I n={submitting?"loader":"send"} s={14}/>
            {submitting?"Enviando...":"Enviar Checklist"}
          </button>
        </div>
      </div>

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

// ── NumInput: numeric input that blocks "." (BR thousand separator) to prevent
// formatting bugs like "300.000" being parsed as 300. Allows "," only when decimal=true.
function NumInput({ value, onChange, decimal = false, placeholder, className = "fi", style }) {
  const [warn, setWarn] = useState("");
  const warnTimer = useRef(null);

  const showWarn = (msg) => {
    setWarn(msg);
    if (warnTimer.current) clearTimeout(warnTimer.current);
    warnTimer.current = setTimeout(() => setWarn(""), 2500);
  };

  const sanitize = (raw) => {
    if (!raw) return "";
    let s = String(raw);
    if (s.includes(".")) {
      s = s.replace(/\./g, "");
      showWarn("Não use ponto (.) — apenas dígitos" + (decimal ? " e vírgula para decimais" : ""));
    }
    if (decimal) {
      s = s.replace(/[^\d,]/g, "");
      const firstComma = s.indexOf(",");
      if (firstComma !== -1) {
        s = s.slice(0, firstComma + 1) + s.slice(firstComma + 1).replace(/,/g, "");
      }
    } else {
      const before = s;
      s = s.replace(/[^\d]/g, "");
      if (before !== s && !before.includes(".")) {
        showWarn("Apenas números inteiros");
      }
    }
    return s;
  };

  const handleKeyDown = (e) => {
    if (e.key === ".") {
      e.preventDefault();
      showWarn("Não use ponto (.) — apenas dígitos" + (decimal ? " e vírgula para decimais" : ""));
    } else if (e.key === "," && !decimal) {
      e.preventDefault();
      showWarn("Apenas números inteiros");
    } else if (e.key === "e" || e.key === "E" || e.key === "+" || e.key === "-") {
      e.preventDefault();
    }
  };

  const handleChange = (e) => {
    const cleaned = sanitize(e.target.value);
    const stored = decimal ? cleaned.replace(",", ".") : cleaned;
    onChange(stored);
  };

  const displayValue = decimal && value ? String(value).replace(".", ",") : (value ?? "");

  return (
    <div style={{ position: "relative" }}>
      <input
        type="text"
        inputMode={decimal ? "decimal" : "numeric"}
        className={className}
        placeholder={placeholder}
        value={displayValue}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        style={{ ...(style || {}), borderColor: warn ? "var(--red)" : undefined }}
      />
      {warn && (
        <div style={{
          position: "absolute", top: "100%", left: 0, right: 0, marginTop: 4,
          padding: "6px 10px", background: "rgba(239,68,68,0.08)",
          border: "1px solid var(--red)", borderRadius: 6,
          fontSize: 11, color: "var(--red)", fontWeight: 600,
          display: "flex", alignItems: "center", gap: 6, zIndex: 10,
        }}>
          <I n="alert-circle" s={12} c="var(--red)" />{warn}
        </div>
      )}
    </div>
  );
}

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
  const [filterMonth,setFilterMonth]=useState("");
  const [filterYear,setFilterYear]=useState("");
  const [confirmDelete,setConfirmDelete]=useState(null); // checklist a ser excluído
  const [permError,setPermError]=useState("");
  const toast=useToast();
  const user=window.__hyprUser;

  const SUPERUSER="matheus.machado@hypr.mobi";
  const canDelete=(c)=>{
    if(!user) return false;
    const me=(user.email||"").toLowerCase();
    if(me===SUPERUSER) return true;
    const allowed=[c.cp_email,c.submitted_by_email,c.cs_email].filter(Boolean).map(e=>e.toLowerCase());
    return allowed.includes(me);
  };

  const handleDelete=async(c)=>{
    setConfirmDelete(null);
    // Optimistic update — remove imediatamente da lista
    setChecklists(prev=>prev.filter(x=>x.id!==c.id));
    if(selected&&selected.id===c.id){setSelected(null);setEditing(false);}
    toast("Excluindo checklist...");
    try{
      const r=await fetch(`${BACKEND_URL}/checklists/${c.id}`,{
        method:"DELETE",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({requesterEmail:user?.email}),
      });
      if(!r.ok){
        // Reverte se backend recusou
        setChecklists(prev=>[c,...prev]);
        if(r.status===403){
          setPermError("Apenas o CP, o CS responsável ou o admin podem excluir este checklist.");
        }else{
          toast(`Erro ao excluir (${r.status}).`);
        }
        return;
      }
      toast("Checklist excluído com sucesso!");
    }catch(err){
      console.error("DELETE checklist error:",err);
      // Reverte em caso de erro de rede
      setChecklists(prev=>[c,...prev]);
      toast("Erro de rede ao excluir.");
    }
  };

  // Extract date string (YYYY-MM-DD or {value}) → {y, m}
  const parseDate=(v)=>{
    if(!v) return null;
    const s=typeof v==="object"&&v.value?v.value:String(v);
    const m=s.match(/(\d{4})-(\d{2})/);
    return m?{y:m[1],m:m[2]}:null;
  };

  // Available years in the data (sorted desc)
  const availableYears=useMemo(()=>{
    const ys=new Set();
    checklists.forEach(c=>{const p=parseDate(c.created_at);if(p)ys.add(p.y);});
    return [...ys].sort((a,b)=>b.localeCompare(a));
  },[checklists]);

  const MONTHS=[
    {v:"01",l:"Janeiro"},{v:"02",l:"Fevereiro"},{v:"03",l:"Março"},{v:"04",l:"Abril"},
    {v:"05",l:"Maio"},{v:"06",l:"Junho"},{v:"07",l:"Julho"},{v:"08",l:"Agosto"},
    {v:"09",l:"Setembro"},{v:"10",l:"Outubro"},{v:"11",l:"Novembro"},{v:"12",l:"Dezembro"},
  ];

  const filtered=useMemo(()=>{
    const q=search.toLowerCase();
    return checklists.filter(c=>{
      if(q&&!(c.client?.toLowerCase().includes(q)||c.campaign_name?.toLowerCase().includes(q)||c.agency?.toLowerCase().includes(q))) return false;
      if(filterYear||filterMonth){
        const p=parseDate(c.created_at);
        if(!p) return false;
        if(filterYear&&p.y!==filterYear) return false;
        if(filterMonth&&p.m!==filterMonth) return false;
      }
      return true;
    });
  },[checklists,search,filterYear,filterMonth]);

  const handleEdit=(c)=>{setEditData({...c});setEditing(true)};
  const handleSave=async()=>{
    setChecklists(prev=>prev.map(c=>c.id===editData.id?editData:c));
    setSelected(editData);
    setEditing(false);
    toast("Checklist atualizado!");
    // Persist to backend
    try{
      await fetch(`${BACKEND_URL}/checklists/${editData.id}`,{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify(editData)});
    }catch(err){console.error("Backend checklist PUT error:",err)}
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
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:24,flexWrap:"wrap",gap:12}}>
        <h2 style={{fontFamily:"var(--fd)",fontSize:18,fontWeight:700}}>Checklists Enviados</h2>
        <div style={{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap"}}>
          <select className="fs" style={{minWidth:130,fontSize:12}} value={filterMonth} onChange={e=>setFilterMonth(e.target.value)}>
            <option value="">Todos os meses</option>
            {MONTHS.map(m=><option key={m.v} value={m.v}>{m.l}</option>)}
          </select>
          <select className="fs" style={{minWidth:100,fontSize:12}} value={filterYear} onChange={e=>setFilterYear(e.target.value)}>
            <option value="">Todos os anos</option>
            {availableYears.map(y=><option key={y} value={y}>{y}</option>)}
          </select>
          {(filterMonth||filterYear)&&(
            <button className="btn bg" style={{fontSize:11,padding:"5px 10px"}} onClick={()=>{setFilterMonth("");setFilterYear("");}} title="Limpar filtros de data">
              <I n="x" s={12}/>Limpar
            </button>
          )}
          <div style={{position:"relative",minWidth:200,maxWidth:300}}>
            <I n="search" s={13} style={{position:"absolute",left:10,top:"50%",transform:"translateY(-50%)"}} c="var(--t3)"/>
            <input className="fi" style={{paddingLeft:32}} placeholder="Buscar cliente ou campanha..." value={search} onChange={e=>setSearch(e.target.value)}/>
          </div>
        </div>
      </div>

      {filtered.length===0?(
        <div className="card"><div className="empty"><I n="clipboard" s={40} c="var(--t3)"/><h3 style={{fontFamily:"var(--fd)",fontSize:15,color:"var(--t2)"}}>{(search||filterMonth||filterYear)?"Nenhum checklist encontrado com esses filtros":"Nenhum checklist enviado ainda"}</h3></div></div>
      ):(
        <div className="card" style={{padding:0,overflow:"hidden"}}>
          <table className="dt">
            <thead>
              <tr>
                <th style={{width:"15%"}}>Cliente</th>
                <th style={{width:"20%"}}>Campanha</th>
                <th style={{width:"14%"}}>Período</th>
                <th style={{width:"12%"}}>Investimento</th>
                <th style={{width:"15%"}}>Produtos</th>
                <th style={{width:"12%"}}>CS</th>
                <th style={{width:"8%"}}>Status</th>
                <th style={{width:"4%"}}></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(c=>{
                // Compute status: Rodando (active) / Pendente (future) / Encerrada (past)
                const parseDateLocal=(v)=>{if(!v)return null;const s=typeof v==="object"&&v.value?v.value:String(v);const m=s.match(/^(\d{4})-(\d{2})-(\d{2})/);return m?new Date(parseInt(m[1]),parseInt(m[2])-1,parseInt(m[3])):null};
                const today=new Date();today.setHours(0,0,0,0);
                const sd=parseDateLocal(c.start_date);
                const ed=parseDateLocal(c.end_date);
                let statusLabel="—",statusCls="b-grn";
                if(sd&&ed){
                  ed.setHours(23,59,59,999);
                  if(today<sd){statusLabel="Pendente";statusCls="b-blue"}
                  else if(today>ed){statusLabel="Encerrada";statusCls="b-grn";statusCls="b-teal"}
                  else{statusLabel="Rodando";statusCls="b-grn"}
                }
                // Format period
                const fmtMonthDay=(d)=>d?`${d.getDate()} ${["jan","fev","mar","abr","mai","jun","jul","ago","set","out","nov","dez"][d.getMonth()]}`:"—";
                const period=(sd&&ed)?`${fmtMonthDay(sd)} – ${fmtMonthDay(ed)}`:"—";
                return(
                  <tr key={c.id} onClick={()=>{setSelected(c);setEditing(false)}} style={{cursor:"pointer"}}>
                    <td>
                      <div style={{display:"flex",alignItems:"center",gap:10}}>
                        <div style={{width:30,height:30,borderRadius:"50%",background:"linear-gradient(135deg,var(--teal),var(--teal-l))",display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:700,color:"#fff",flexShrink:0}}>{c.client?.substring(0,2).toUpperCase()||"?"}</div>
                        <div style={{minWidth:0}}>
                          <div style={{fontWeight:600,color:"var(--t1)",fontSize:13,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{c.client||"—"}</div>
                          {c.agency&&<div style={{fontSize:10.5,color:"var(--t3)",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{c.agency}</div>}
                        </div>
                      </div>
                    </td>
                    <td style={{fontSize:12.5,color:"var(--t1)",maxWidth:200,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{c.campaign_name||"—"}</td>
                    <td style={{fontSize:12,color:"var(--t2)"}}>{period}</td>
                    <td style={{fontSize:13,color:"var(--teal)",fontWeight:600}}>{c.investment?`R$ ${Number(c.investment).toLocaleString("pt-BR",{maximumFractionDigits:0})}`:"—"}</td>
                    <td>
                      {(c.products||[]).length>0?(
                        <div style={{display:"flex",gap:3,flexWrap:"wrap"}}>
                          {(c.products||[]).slice(0,2).map(p=><span key={p} className="badge b-teal" style={{fontSize:10,padding:"2px 7px"}}>{p}</span>)}
                          {(c.products||[]).length>2&&<span style={{fontSize:11,color:"var(--t3)"}}>+{(c.products||[]).length-2}</span>}
                        </div>
                      ):<span style={{fontSize:12,color:"var(--t3)"}}>—</span>}
                    </td>
                    <td style={{fontSize:12.5,color:"var(--t2)"}}>{(c.cs||"—").split(" ")[0]}</td>
                    <td><span className={`badge ${statusCls}`}>{statusLabel}</span></td>
                    <td onClick={e=>e.stopPropagation()}>
                      {canDelete(c)&&(
                        <button
                          onClick={e=>{e.stopPropagation();setConfirmDelete(c);}}
                          title="Excluir checklist"
                          style={{background:"transparent",border:"none",padding:6,cursor:"pointer",borderRadius:6,color:"var(--t3)",display:"flex",alignItems:"center"}}
                          onMouseEnter={e=>{e.currentTarget.style.background="var(--red-bg)";e.currentTarget.style.color="var(--red)";}}
                          onMouseLeave={e=>{e.currentTarget.style.background="transparent";e.currentTarget.style.color="var(--t3)";}}
                        >
                          <I n="trash" s={13}/>
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
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
                    <CF l="Investimento (R$)"><NumInput decimal value={editData.investment||""} onChange={v=>setEditData(p=>({...p,investment:v}))}/></CF>
                    <CF l="Indústria"><input className="fi" value={editData.industry||""} onChange={e=>setEditData(p=>({...p,industry:e.target.value}))}/></CF>
                    <CF l="Data Início"><input type="date" className="fi" value={(typeof editData.start_date==="object"&&editData.start_date?.value)||editData.start_date||""} onChange={e=>setEditData(p=>({...p,start_date:e.target.value}))}/></CF>
                    <CF l="Data Final"><input type="date" className="fi" value={(typeof editData.end_date==="object"&&editData.end_date?.value)||editData.end_date||""} onChange={e=>setEditData(p=>({...p,end_date:e.target.value}))}/></CF>
                  </div>
                  <CF l="Audiências"><textarea className="ft" rows={3} value={editData.audiences||""} onChange={e=>setEditData(p=>({...p,audiences:e.target.value}))}/></CF>

                  {/* Editable Praças */}
                  <CF l="Praças — Tipo">
                    <select className="fs" value={editData.praças_type||editData.pracas_type||""} onChange={e=>{const v=e.target.value;setEditData(p=>({...p,praças_type:v,pracas_type:v}));}}>
                      <option value="">Selecione...</option>
                      <option value="Brasil">Brasil</option>
                      <option value="Estado">Estado</option>
                      <option value="Cidade">Cidade</option>
                      <option value="Outro">Outro</option>
                    </select>
                  </CF>
                  {(editData.praças_type||editData.pracas_type)==="Estado"&&(
                    <div style={{padding:14,background:"var(--bg3)",borderRadius:"var(--r)",border:"1px solid var(--bdr)"}}>
                      <div style={{fontSize:11,color:"var(--t3)",textTransform:"uppercase",fontWeight:700,marginBottom:8,letterSpacing:".06em"}}>Estados</div>
                      <div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:8}}>
                        {Object.entries(BRAZIL_REGIONS).map(([region,states])=>(
                          <button key={region} className="btn bs" style={{fontSize:10,padding:"3px 10px"}} onClick={()=>setEditData(p=>{const current=p.praças_states||[];const allSelected=states.every(s=>current.includes(s));const next=allSelected?current.filter(s=>!states.includes(s)):[...new Set([...current,...states])];return{...p,praças_states:next,pracas_detail:next.join(", ")};})}>{region}</button>
                        ))}
                        <button className="btn bs" style={{fontSize:10,padding:"3px 10px"}} onClick={()=>setEditData(p=>({...p,praças_states:[...BRAZIL_STATES],pracas_detail:BRAZIL_STATES.join(", ")}))}>Todos</button>
                        <button className="btn bg" style={{fontSize:10,padding:"3px 10px"}} onClick={()=>setEditData(p=>({...p,praças_states:[],pracas_detail:""}))}>Limpar</button>
                      </div>
                      <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
                        {BRAZIL_STATES.map(s=>(
                          <span key={s} className={`chip${(editData.praças_states||[]).includes(s)?" sel":""}`} style={{fontSize:11,padding:"3px 10px",cursor:"pointer"}} onClick={()=>setEditData(p=>{const current=p.praças_states||[];const next=current.includes(s)?current.filter(x=>x!==s):[...current,s];return{...p,praças_states:next,pracas_detail:next.join(", ")};})}>{s}</span>
                        ))}
                      </div>
                      {(editData.praças_states||[]).length>0&&<div style={{fontSize:11,color:"var(--teal)",marginTop:8}}>{(editData.praças_states||[]).length} estado{(editData.praças_states||[]).length>1?"s":""} selecionado{(editData.praças_states||[]).length>1?"s":""}</div>}
                    </div>
                  )}
                  {(editData.praças_type||editData.pracas_type)==="Cidade"&&(
                    <div style={{padding:14,background:"var(--bg3)",borderRadius:"var(--r)",border:"1px solid var(--bdr)",display:"flex",flexDirection:"column",gap:10}}>
                      <div style={{fontSize:11,color:"var(--t3)",textTransform:"uppercase",fontWeight:700,letterSpacing:".06em"}}>Cidades</div>
                      <button className="btn bs" style={{fontSize:11,alignSelf:"flex-start"}} onClick={()=>setEditData(p=>{const next=[...new Set([...(p.praças_cities||[]),...BRAZIL_CAPITALS])];return{...p,praças_cities:next,pracas_detail:next.join(", ")};})}>
                        <I n="plus" s={12}/>Adicionar Capitais (27)
                      </button>
                      <div style={{display:"grid",gridTemplateColumns:"120px 1fr",gap:8,alignItems:"start"}}>
                        <select className="fs" value={editData.praças_city_state||""} onChange={e=>setEditData(p=>({...p,praças_city_state:e.target.value}))}>
                          <option value="">Estado...</option>
                          {BRAZIL_STATES.map(s=><option key={s}>{s}</option>)}
                        </select>
                        <div style={{display:"flex",gap:6}}>
                          <input className="fi" placeholder="Nome da cidade" value={editData.praças_city_input||""} onChange={e=>setEditData(p=>({...p,praças_city_input:e.target.value}))} onKeyDown={e=>{if(e.key==="Enter"&&editData.praças_city_input&&editData.praças_city_state){e.preventDefault();const city=`${editData.praças_city_input} (${editData.praças_city_state})`;setEditData(p=>{const next=[...(p.praças_cities||[]),city];return{...p,praças_cities:next,praças_city_input:"",pracas_detail:next.join(", ")};});}}}/>
                          <button className="btn bs" style={{fontSize:11,whiteSpace:"nowrap"}} onClick={()=>{if(editData.praças_city_input&&editData.praças_city_state){const city=`${editData.praças_city_input} (${editData.praças_city_state})`;setEditData(p=>{const next=[...(p.praças_cities||[]),city];return{...p,praças_cities:next,praças_city_input:"",pracas_detail:next.join(", ")};});}}}><I n="plus" s={12}/>Adicionar</button>
                        </div>
                      </div>
                      {(editData.praças_cities||[]).length>0&&(
                        <div>
                          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
                            <span style={{fontSize:11,color:"var(--teal)"}}>{(editData.praças_cities||[]).length} cidade{(editData.praças_cities||[]).length>1?"s":""}</span>
                            <button className="btn bg" style={{fontSize:10,padding:"2px 8px"}} onClick={()=>setEditData(p=>({...p,praças_cities:[],pracas_detail:""}))}>Limpar</button>
                          </div>
                          <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
                            {(editData.praças_cities||[]).map((c,i)=>(
                              <span key={i} className="chip sel" style={{fontSize:11,padding:"3px 10px",display:"flex",gap:4,alignItems:"center"}}>
                                {c}
                                <span style={{cursor:"pointer",fontWeight:700}} onClick={()=>setEditData(p=>{const next=(p.praças_cities||[]).filter((_,j)=>j!==i);return{...p,praças_cities:next,pracas_detail:next.join(", ")};})}>×</span>
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                  {(editData.praças_type||editData.pracas_type)==="Outro"&&(
                    <CF l="Descreva">
                      <input className="fi" value={editData.praças_other||editData.pracas_detail||""} onChange={e=>{const v=e.target.value;setEditData(p=>({...p,praças_other:v,pracas_detail:v}));}}/>
                    </CF>
                  )}

                  {/* Editable Products & Volumetries */}
                  <CF l="Produtos Core">
                    <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                      {CHECKLIST_CORE_PRODUCTS.map(p=>(
                        <span key={p} className={`chip${(editData.products||[]).includes(p)?" sel":""}`} style={{cursor:"pointer"}} onClick={()=>{
                          setEditData(prev=>{
                            const cur=prev.products||[];
                            const has=cur.includes(p);
                            const next=has?cur.filter(x=>x!==p):[...cur,p];
                            // If removing the product, also clear its volumetry fields
                            const update={...prev,products:next};
                            if(has){delete update[`${p}_imp`];delete update[`${p}_views`];delete update[`${p}_bonus_imp`];delete update[`${p}_bonus_views`];}
                            return update;
                          });
                        }}>{p}</span>
                      ))}
                    </div>
                  </CF>
                  {(editData.products||[]).map(prod=>(
                    <div key={prod} style={{padding:14,background:"var(--bg3)",borderRadius:"var(--r)",border:"1px solid var(--bdr)"}}>
                      <div style={{fontSize:12,fontWeight:700,color:"var(--teal)",marginBottom:10,textTransform:"uppercase",letterSpacing:".06em"}}>{prod} — Volumetria Contratada</div>
                      <div className="g2" style={{gap:12,marginBottom:10}}>
                        <CF l="Impressões Visíveis"><NumInput placeholder="0" value={editData[`${prod}_imp`]||""} onChange={v=>setEditData(p=>({...p,[`${prod}_imp`]:v}))}/></CF>
                        <CF l="Views 100%"><NumInput placeholder="0" value={editData[`${prod}_views`]||""} onChange={v=>setEditData(p=>({...p,[`${prod}_views`]:v}))}/></CF>
                      </div>
                      {(editData[`${prod}_bonus_imp`]||editData[`${prod}_bonus_views`]||editData.has_bonus==="Sim"||editData.has_bonus===true)&&(
                        <>
                          <div style={{fontSize:11,fontWeight:700,color:"#a07a00",marginBottom:8,textTransform:"uppercase",letterSpacing:".06em"}}>{prod} — Bonificação</div>
                          <div className="g2" style={{gap:12}}>
                            <CF l="Impressões Bonif."><NumInput placeholder="0" value={editData[`${prod}_bonus_imp`]||""} onChange={v=>setEditData(p=>({...p,[`${prod}_bonus_imp`]:v}))}/></CF>
                            <CF l="Views Bonif."><NumInput placeholder="0" value={editData[`${prod}_bonus_views`]||""} onChange={v=>setEditData(p=>({...p,[`${prod}_bonus_views`]:v}))}/></CF>
                          </div>
                        </>
                      )}
                    </div>
                  ))}

                  {/* Editable Observations */}
                  <CF l="Observações">
                    <textarea className="ft" rows={4} placeholder="Observações para o CS sobre a campanha..." value={editData.observations||""} onChange={e=>setEditData(p=>({...p,observations:e.target.value}))}/>
                  </CF>

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
                  {(selected.products||[]).map(prod=>{
                    const imp=selected[`${prod}_imp`];
                    const views=selected[`${prod}_views`];
                    return(
                    <div key={prod} style={{padding:14,background:"var(--bg3)",borderRadius:"var(--r)",border:"1px solid var(--bdr)"}}>
                      <div style={{fontSize:12,fontWeight:700,color:"var(--teal)",marginBottom:8,textTransform:"uppercase"}}>{prod} — Volumetria Contratada</div>
                      <div className="g2" style={{gap:10}}>
                        <div style={{padding:12,background:"var(--bg2)",borderRadius:"var(--r)"}}>
                          <div style={{fontSize:11,color:"var(--t3)",textTransform:"uppercase",fontWeight:700,marginBottom:4}}>Impressões Visíveis</div>
                          <div style={{fontSize:13,color:"var(--t1)",fontWeight:600}}>{imp?Number(imp).toLocaleString("pt-BR"):"—"}</div>
                        </div>
                        <div style={{padding:12,background:"var(--bg2)",borderRadius:"var(--r)"}}>
                          <div style={{fontSize:11,color:"var(--t3)",textTransform:"uppercase",fontWeight:700,marginBottom:4}}>Views 100%</div>
                          <div style={{fontSize:13,color:"var(--t1)",fontWeight:600}}>{views?Number(views).toLocaleString("pt-BR"):"—"}</div>
                        </div>
                      </div>
                      {prod==="OOH"&&selected.ooh_link&&<div style={{marginTop:8}}><D l="Link OOH" v={selected.ooh_link}/></div>}
                      {prod==="RMND"&&(selected.marketplaces||[]).length>0&&<div style={{marginTop:8}}><div style={{fontSize:11,color:"var(--t3)",textTransform:"uppercase",fontWeight:700,marginBottom:4}}>Marketplaces</div><Tags items={selected.marketplaces} color="teal"/></div>}
                    </div>
                  );})}
                  {(()=>{
                    const hasBonusFlag=selected.has_bonus==="Sim"||selected.has_bonus===true;
                    const productsWithBonus=(selected.products||[]).filter(prod=>selected[`${prod}_bonus_imp`]||selected[`${prod}_bonus_views`]);
                    if(!hasBonusFlag&&productsWithBonus.length===0) return null;
                    const showProds=productsWithBonus.length>0?productsWithBonus:(selected.products||[]);
                    return(
                    <div>
                      <div style={{fontSize:12,fontWeight:700,color:"#a07a00",marginBottom:8,textTransform:"uppercase"}}>Bonificações</div>
                      {showProds.map(prod=>{
                        const bImp=selected[`${prod}_bonus_imp`];
                        const bViews=selected[`${prod}_bonus_views`];
                        return(
                          <div key={prod+"_b"} style={{padding:14,background:"var(--yellow-dim)",borderRadius:"var(--r)",border:"1px solid rgba(237,217,0,0.3)",marginBottom:8}}>
                            <div style={{fontSize:12,fontWeight:700,color:"#a07a00",marginBottom:8,textTransform:"uppercase"}}>{prod} — Bonificação</div>
                            <div className="g2" style={{gap:10}}>
                              <div style={{padding:12,background:"var(--bg2)",borderRadius:"var(--r)"}}>
                                <div style={{fontSize:11,color:"var(--t3)",textTransform:"uppercase",fontWeight:700,marginBottom:4}}>Impressões Bonif.</div>
                                <div style={{fontSize:13,color:"var(--t1)",fontWeight:600}}>{bImp?Number(bImp).toLocaleString("pt-BR"):"—"}</div>
                              </div>
                              <div style={{padding:12,background:"var(--bg2)",borderRadius:"var(--r)"}}>
                                <div style={{fontSize:11,color:"var(--t3)",textTransform:"uppercase",fontWeight:700,marginBottom:4}}>Views Bonif.</div>
                                <div style={{fontSize:13,color:"var(--t1)",fontWeight:600}}>{bViews?Number(bViews).toLocaleString("pt-BR"):"—"}</div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    );
                  })()}

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
                    return(
                      <div key={feat} style={{padding:14,background:"var(--bg3)",borderRadius:"var(--r)",border:"1px solid var(--bdr)"}}>
                        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
                          <span style={{fontSize:13,fontWeight:700,color:"var(--t1)"}}>{feat}</span>
                          <span className={`badge ${volType==="bonificada"?"b-teal":"b-ylw"}`} style={{textTransform:"capitalize"}}>{volType}</span>
                        </div>
                        <div className="g2" style={{gap:10}}>
                          {cfg.fields.map(field=>{
                            const v=selected[`fv_${feat}_${field}`];
                            return(
                              <div key={field} style={{padding:12,background:"var(--bg2)",borderRadius:"var(--r)"}}>
                                <div style={{fontSize:11,color:"var(--t3)",textTransform:"uppercase",fontWeight:700,marginBottom:4}}>{field}</div>
                                <div style={{fontSize:13,color:"var(--t1)",fontWeight:600}}>{v?Number(v).toLocaleString("pt-BR"):"—"}</div>
                              </div>
                            );
                          })}
                        </div>
                        {FEAT_EXTRA_TEXT[feat]&&(
                          <div style={{marginTop:10,padding:12,background:"var(--bg2)",borderRadius:"var(--r)"}}>
                            <div style={{fontSize:11,color:"var(--t3)",textTransform:"uppercase",fontWeight:700,marginBottom:4}}>{FEAT_EXTRA_TEXT[feat].label}</div>
                            <div style={{fontSize:13,color:"var(--t1)",fontWeight:600,whiteSpace:"pre-wrap"}}>{selected[`fextra_${feat}`]||"—"}</div>
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {/* Survey / Video Survey */}
                  {(selected.cl_features||[]).filter(f=>["Survey","Video Survey"].includes(f)).map(feat=>(
                    <div key={feat} style={{padding:14,background:"var(--bg3)",borderRadius:"var(--r)",border:"1px solid var(--bdr)"}}>
                      <div style={{fontSize:12,fontWeight:700,color:"var(--teal)",marginBottom:8,textTransform:"uppercase"}}>{feat}</div>
                      <div style={{padding:12,background:"var(--bg2)",borderRadius:"var(--r)"}}>
                        <div style={{fontSize:11,color:"var(--t3)",textTransform:"uppercase",fontWeight:700,marginBottom:4}}>Perguntas e Respostas</div>
                        <div style={{fontSize:13,color:"var(--t1)",fontWeight:600,whiteSpace:"pre-wrap"}}>{selected[`ftext_${feat}`]||"—"}</div>
                      </div>
                    </div>
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
                    <D l="Praças" v={(()=>{
                      const t=selected.praças_type||selected.pracas_type;
                      if(!t) return selected.pracas_detail||"—";
                      if(t==="Brasil") return "Brasil";
                      if(t==="Estado"){
                        const states=selected.praças_states||[];
                        if(states.length>0) return `Estados: ${states.join(", ")}`;
                        return selected.pracas_detail?`Estado: ${selected.pracas_detail}`:`Estado${selected.praças_state?": "+selected.praças_state:""}`;
                      }
                      if(t==="Cidade"){
                        const cities=selected.praças_cities||[];
                        if(cities.length>0) return cities.join(", ");
                        return selected.pracas_detail||(selected.praças_state||selected.praças_city?`${selected.praças_state||""} — ${selected.praças_city||""}`:"Cidade");
                      }
                      return selected.praças_other||selected.pracas_detail||t;
                    })()}/>
                    <D l="Reunião pré-campanha com CS" v={selected.had_cs_meeting==="Sim"||selected.had_cs_meeting===true?"Sim":"Não"}/>
                  </div>

                  {/* Observações do CP */}
                  {selected.observations&&(
                    <div style={{padding:16,background:"var(--yellow-dim)",border:"1px solid rgba(237,217,0,0.4)",borderRadius:"var(--r)"}}>
                      <div style={{fontSize:11,color:"#a07a00",textTransform:"uppercase",fontWeight:700,marginBottom:8,letterSpacing:".06em",display:"flex",alignItems:"center",gap:6}}>
                        <I n="alert-triangle" s={13} c="#a07a00"/>Observações do CP
                      </div>
                      <div style={{fontSize:13,color:"var(--t1)",lineHeight:1.6,whiteSpace:"pre-wrap"}}>{selected.observations}</div>
                    </div>
                  )}

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
                    {selected.created_at&&<span> — {(()=>{const v=typeof selected.created_at==="object"&&selected.created_at.value?selected.created_at.value:selected.created_at;const d=new Date(v);return isNaN(d.getTime())?"—":d.toLocaleDateString("pt-BR",{day:"2-digit",month:"2-digit",year:"numeric",hour:"2-digit",minute:"2-digit"})})()}</span>}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Confirmação de exclusão */}
      {confirmDelete&&(
        <div className="mo" onClick={e=>e.target===e.currentTarget&&setConfirmDelete(null)}>
          <div className="ml" style={{maxWidth:440}}>
            <div className="mb" style={{padding:"28px 24px"}}>
              <div style={{textAlign:"center",marginBottom:18}}>
                <div style={{width:54,height:54,borderRadius:"50%",background:"var(--red-bg)",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 12px"}}>
                  <I n="trash" s={24} c="var(--red)"/>
                </div>
                <div style={{fontFamily:"var(--fd)",fontSize:17,fontWeight:700,marginBottom:6}}>Excluir Checklist?</div>
                <div style={{fontSize:13,color:"var(--t2)",lineHeight:1.5}}>
                  Esta ação é <strong>permanente</strong> e remove o checklist <strong>{confirmDelete.client} — {confirmDelete.campaign_name}</strong> tanto do HYPR Command quanto do Report Hub.
                </div>
              </div>
              <div style={{display:"flex",gap:10,justifyContent:"flex-end"}}>
                <button className="btn bg" onClick={()=>setConfirmDelete(null)}>Cancelar</button>
                <button className="btn" style={{background:"var(--red)",color:"#fff"}} onClick={()=>handleDelete(confirmDelete)}>
                  <I n="trash" s={14}/>Excluir Definitivamente
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Erro de permissão */}
      {permError&&(
        <div className="mo" onClick={e=>e.target===e.currentTarget&&setPermError("")}>
          <div className="ml" style={{maxWidth:380}}>
            <div className="mb" style={{textAlign:"center",padding:"30px 20px"}}>
              <I n="lock" s={36} c="var(--yellow-s)" style={{marginBottom:12}}/>
              <div style={{fontFamily:"var(--fd)",fontSize:16,fontWeight:700,marginBottom:8}}>Ação não permitida</div>
              <div style={{fontSize:13,color:"var(--t2)",lineHeight:1.5,marginBottom:20}}>{permError}</div>
              <button className="btn bp" onClick={()=>setPermError("")}>Entendi</button>
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
const ADMINS = [
  'matheus.machado@hypr.mobi','cesar.moura@hypr.mobi','adrian.ferguson@hypr.mobi',
  'mateus.lambranho@hypr.mobi','gian.nardo@hypr.mobi',
];
const SALES_TEAM = [
  'danilo.pereira@hypr.mobi','eduarda.bolzan@hypr.mobi','camila.tenorio@hypr.mobi',
  'egle.stein@hypr.mobi','alexandra.perez@hypr.mobi','karol.siqueira@hypr.mobi',
  'pablo.souza@hypr.mobi','larissa.reis@hypr.mobi','marcelo.nogueira@hypr.mobi',
];
const hasProposalAccess = (email) => ADMINS.includes(email) || SALES_TEAM.includes(email);
const isAdmin = (email) => ADMINS.includes(email);

// ══════════════════════════════════════════════════════════════════════════════
// PROPOSAL BUILDER
// ══════════════════════════════════════════════════════════════════════════════
const PROPOSAL_PRODUCTS = ['O2O','OOH','RMNF','RMND'];
const PROPOSAL_FORMATS = ['Display','Video'];
const PROPOSAL_PAYMENTS = ['CPM','CPCV','CPV','CPC'];
const PROPOSAL_PRACAS = ['Nacional','Regional','Capital','Interior'];
const PROPOSAL_FEATURES = ['P-DOOH','Weather','Topics','Click to Calendar','Downloaded Apps',
  'Tap To Chat','Tap To Hotspot','Attention Ad','Footfall','CTV','TV Sync',
  'Tap To Scratch','Tap to Go','Tap To Carousel','Tap To Max','Purchase Context',
  'HYPR Pass','Survey','Brand Query','Design Studio','Carbon Neutral'];
// Features that do NOT get volumetry fields (just a checkbox)
const FEATURES_NO_VOL = ['Survey','Brand Query','Design Studio','Carbon Neutral'];
// Features with only "Plays" field
const FEATURES_PLAYS = ['P-DOOH'];

// CPM/CPCV reference table (Tabela 2026)
const CPM_TABLE = {
  'O2O': { Display: 24, Video: 0.22 },
  'OOH': { Display: 24, Video: 0.22 },
  'RMNF': { Display: 35, Video: 0 },
  'RMND': { Display: 30, Video: 0.28 },
};

// ══════════════════════════════════════════════════════════════════════════════
// ADMIN CENTER — Gerenciar membros do time
// ══════════════════════════════════════════════════════════════════════════════
function AdminCenter() {
  const { members, reload } = useTeam();
  const user = window.__hyprUser;
  const toast = useToast();
  const [showAdd, setShowAdd] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState(null);
  const [editing, setEditing] = useState(null); // member being edited
  const [search, setSearch] = useState("");
  const [filterRole, setFilterRole] = useState("all");

  const ROLE_LABELS = { admin: "Admin", sales: "Sales", cs: "CS", none: "Nenhum" };
  const ROLE_COLORS = { admin: "var(--red)", sales: "var(--teal)", cs: "var(--green)", none: "var(--t3)" };
  const ROLE_BG     = { admin: "var(--red-bg)", sales: "var(--teal-dim)", cs: "var(--green-bg)", none: "var(--bg3)" };

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return members.filter(m => {
      if (filterRole !== "all" && m.role !== filterRole) return false;
      if (q && !(m.name?.toLowerCase().includes(q) || m.email?.toLowerCase().includes(q))) return false;
      return true;
    }).sort((a,b) => {
      const order = { admin:0, sales:1, cs:2, none:3 };
      const ra = order[a.role]??99, rb = order[b.role]??99;
      if (ra !== rb) return ra - rb;
      return (a.name||'').localeCompare(b.name||'');
    });
  }, [members, search, filterRole]);

  const counts = useMemo(()=>({
    all: members.length,
    admin: members.filter(m=>m.role==='admin').length,
    sales: members.filter(m=>m.role==='sales').length,
    cs: members.filter(m=>m.role==='cs').length,
    none: members.filter(m=>m.role==='none').length,
  }), [members]);

  const fmtAddedAt = (v) => {
    if (!v) return "—";
    const s = typeof v === "object" && v.value ? v.value : String(v);
    const d = new Date(s);
    return isNaN(d.getTime()) ? "—" : d.toLocaleDateString("pt-BR", { day:"2-digit", month:"2-digit", year:"numeric" });
  };

  const handleSave = async (data) => {
    try {
      const r = await fetch(`${BACKEND_URL}/team`, {
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ ...data, requesterEmail: user?.email })
      });
      if (!r.ok) {
        const err = await r.json().catch(()=>({}));
        toast(err.error || `Erro ao salvar (${r.status}).`);
        return;
      }
      toast(editing ? "Membro atualizado!" : "Membro adicionado!");
      setShowAdd(false); setEditing(null);
      reload();
    } catch (err) {
      console.error(err);
      toast("Erro de rede ao salvar.");
    }
  };

  const handleRemove = async (m) => {
    setConfirmRemove(null);
    try {
      const r = await fetch(`${BACKEND_URL}/team/${encodeURIComponent(m.email)}`, {
        method:"DELETE",
        headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ requesterEmail: user?.email })
      });
      if (!r.ok) {
        const err = await r.json().catch(()=>({}));
        toast(err.error || `Erro ao remover (${r.status}).`);
        return;
      }
      toast("Membro removido!");
      reload();
    } catch (err) {
      console.error(err);
      toast("Erro de rede ao remover.");
    }
  };

  const tabs = [
    {key:"all",   label:"Todos",  count:counts.all},
    {key:"admin", label:"Admins", count:counts.admin},
    {key:"sales", label:"Sales",  count:counts.sales},
    {key:"cs",    label:"CS",     count:counts.cs},
    {key:"none",  label:"Sem acesso",  count:counts.none},
  ];

  return (
    <div className="page-enter">
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20,flexWrap:"wrap",gap:12}}>
        <div>
          <h2 style={{fontFamily:"var(--fd)",fontSize:20,fontWeight:800}}>Admin — Gerenciamento de Time</h2>
          <div style={{fontSize:12,color:"var(--t3)",marginTop:4}}>Adicione, edite ou remova membros e seus acessos</div>
        </div>
        <button className="btn bp" onClick={()=>{setEditing(null);setShowAdd(true);}}>
          <I n="plus" s={14}/>Adicionar Membro
        </button>
      </div>

      <div className="card" style={{padding:"12px 16px",marginBottom:16}}>
        <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>
          {tabs.map(t=>(
            <button key={t.key} className={`btn ${filterRole===t.key?"bp":"bs"}`} style={{fontSize:12,padding:"5px 12px",gap:6}} onClick={()=>setFilterRole(t.key)}>
              {t.label}<span style={{background:filterRole===t.key?"rgba(255,255,255,0.25)":"var(--bg3)",borderRadius:99,padding:"1px 7px",fontSize:11,fontWeight:700}}>{t.count}</span>
            </button>
          ))}
          <div style={{position:"relative",flex:1,minWidth:200,maxWidth:280,marginLeft:"auto"}}>
            <I n="search" s={13} style={{position:"absolute",left:10,top:"50%",transform:"translateY(-50%)"}} c="var(--t3)"/>
            <input className="fi" style={{paddingLeft:32}} placeholder="Buscar nome ou e-mail..." value={search} onChange={e=>setSearch(e.target.value)}/>
          </div>
        </div>
      </div>

      {filtered.length===0?(
        <div className="card"><div className="empty"><I n="users" s={40} c="var(--t3)"/><h3 style={{fontFamily:"var(--fd)",fontSize:15,color:"var(--t2)"}}>Nenhum membro encontrado</h3></div></div>
      ):(
        <div className="card" style={{padding:0,overflow:"hidden"}}>
          <div style={{display:"grid",gridTemplateColumns:"1.4fr 1.6fr 0.7fr 1.6fr 0.5fr",alignItems:"center",padding:"10px 16px",background:"var(--bg3)",borderBottom:"1px solid var(--bdr)",fontSize:11,fontWeight:700,textTransform:"uppercase",letterSpacing:".06em",color:"var(--t3)"}}>
            <div>Nome</div><div>E-mail</div><div>Papel</div><div>Adicionado por</div><div></div>
          </div>
          {filtered.map(m=>(
            <div key={m.email} style={{display:"grid",gridTemplateColumns:"1.4fr 1.6fr 0.7fr 1.6fr 0.5fr",alignItems:"center",padding:"12px 16px",borderBottom:"1px solid var(--bdr)",fontSize:13}}>
              <div style={{fontWeight:600,color:"var(--t1)"}}>{m.name}</div>
              <div style={{color:"var(--t2)",fontSize:12,wordBreak:"break-all"}}>{m.email}</div>
              <div>
                <span style={{padding:"3px 10px",borderRadius:99,background:ROLE_BG[m.role]||"var(--bg3)",color:ROLE_COLORS[m.role]||"var(--t2)",fontSize:11,fontWeight:700,fontFamily:"var(--fd)"}}>
                  {ROLE_LABELS[m.role]||m.role}
                </span>
              </div>
              <div style={{fontSize:11,color:"var(--t3)"}}>
                {m.added_by==='system-seed'?<em>Sistema</em>:<>{m.added_by||"—"}</>}
                <div style={{fontSize:10,color:"var(--t3)",opacity:0.7}}>em {fmtAddedAt(m.added_at)}</div>
              </div>
              <div style={{display:"flex",gap:6,justifyContent:"flex-end"}}>
                <button className="btn bs" style={{fontSize:11,padding:"4px 10px"}} onClick={()=>{setEditing(m);setShowAdd(true);}} title="Editar"><I n="edit" s={12}/></button>
                <button className="btn bg" style={{fontSize:11,padding:"4px 10px",color:"var(--red)"}} onClick={()=>setConfirmRemove(m)} title="Remover"><I n="trash" s={12} c="var(--red)"/></button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showAdd && <AdminMemberModal initial={editing} onClose={()=>{setShowAdd(false);setEditing(null);}} onSave={handleSave}/>}
      {confirmRemove && (
        <div className="mo" onClick={e=>e.target===e.currentTarget&&setConfirmRemove(null)}>
          <div className="ml" style={{maxWidth:440}}>
            <div className="mb" style={{padding:"28px 24px"}}>
              <div style={{textAlign:"center",marginBottom:18}}>
                <div style={{width:54,height:54,borderRadius:"50%",background:"var(--red-bg)",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 12px"}}>
                  <I n="trash" s={24} c="var(--red)"/>
                </div>
                <div style={{fontFamily:"var(--fd)",fontSize:17,fontWeight:700,marginBottom:6}}>Remover membro?</div>
                <div style={{fontSize:13,color:"var(--t2)",lineHeight:1.5}}>
                  <strong>{confirmRemove.name}</strong> ({confirmRemove.email}) perderá acesso aos recursos restritos.
                </div>
              </div>
              <div style={{display:"flex",gap:10,justifyContent:"flex-end"}}>
                <button className="btn bg" onClick={()=>setConfirmRemove(null)}>Cancelar</button>
                <button className="btn" style={{background:"var(--red)",color:"#fff"}} onClick={()=>handleRemove(confirmRemove)}>
                  <I n="trash" s={14}/>Remover
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function AdminMemberModal({initial, onClose, onSave}) {
  const [email, setEmail] = useState(initial?.email||"");
  const [name,  setName ] = useState(initial?.name ||"");
  const [role,  setRole ] = useState(initial?.role ||"cs");
  const [error, setError] = useState("");
  useEffect(()=>{const h=e=>{if(e.key==="Escape")onClose()};window.addEventListener("keydown",h);return()=>window.removeEventListener("keydown",h);},[onClose]);

  const submit = () => {
    setError("");
    if (!email.trim() || !name.trim()) { setError("Nome e e-mail são obrigatórios."); return; }
    if (!email.toLowerCase().endsWith("@hypr.mobi")) { setError("Apenas e-mails @hypr.mobi."); return; }
    onSave({ email: email.trim().toLowerCase(), name: name.trim(), role });
  };

  return (
    <div className="mo" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="ml" style={{maxWidth:480}}>
        <div className="mh">
          <div>
            <div className="mt"><I n="user" s={18} c="var(--teal)" style={{verticalAlign:"middle",marginRight:8}}/>{initial?"Editar Membro":"Novo Membro"}</div>
            {initial && <div style={{fontSize:12,color:"var(--t3)",marginTop:4}}>Atualize o papel ou nome do membro</div>}
          </div>
          <button className="btn bg" onClick={onClose}><I n="x" s={18}/></button>
        </div>
        <div className="mb">
          <div className="fg"><label className="fl">Nome completo *</label><input className="fi" placeholder="Ex: Maria Silva" value={name} onChange={e=>setName(e.target.value)} autoFocus/></div>
          <div className="fg"><label className="fl">E-mail @hypr.mobi *</label><input className="fi" placeholder="maria.silva@hypr.mobi" type="email" value={email} disabled={!!initial} onChange={e=>setEmail(e.target.value)}/></div>
          <div className="fg">
            <label className="fl">Papel</label>
            <select className="fs" value={role} onChange={e=>setRole(e.target.value)}>
              <option value="admin">Admin (acesso total — pode gerenciar membros)</option>
              <option value="sales">Sales (acesso ao Proposal Builder)</option>
              <option value="cs">CS (aparece como CS responsável)</option>
              <option value="none">Sem acesso especial</option>
            </select>
            <div style={{fontSize:11,color:"var(--t3)",marginTop:6,lineHeight:1.5}}>
              <strong>Admin</strong> também tem acesso a Sales e CS. Cada papel é cumulativo de cima para baixo.
            </div>
          </div>
          {error && <div style={{padding:"10px 14px",background:"var(--red-bg)",border:"1px solid var(--red)",borderRadius:"var(--r)",color:"var(--red)",fontSize:12,marginBottom:12}}>{error}</div>}
          <div style={{display:"flex",gap:10,justifyContent:"flex-end",marginTop:8}}>
            <button className="btn bg" onClick={onClose}>Cancelar</button>
            <button className="btn bp" onClick={submit}><I n="check" s={14}/>{initial?"Salvar":"Adicionar"}</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ProposalBuilder() {
  const user = useAuth();
  const clients = useClients();
  const toast = useToast();

  const [view, setView] = useState('list');
  const [proposals, setProposals] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editId, setEditId] = useState(null);

  // ── Form state ──
  const [client, setClient] = useState('');
  const [agency, setAgency] = useState('');
  const [proposalTitle, setProposalTitle] = useState('');
  const [praca, setPraca] = useState('Nacional');
  const [projectDescription, setProjectDescription] = useState('');
  const [periodStart, setPeriodStart] = useState('');
  const [periodEnd, setPeriodEnd] = useState('');

  // Scope products
  const [scopeRows, setScopeRows] = useState([{ id: 1, produto: 'O2O', cluster: '', behaviorOff: '', behaviorOn: '', volumetria: '' }]);

  // Contracted products
  const [contractRows, setContractRows] = useState([{
    id: 1, produto: 'O2O', segmentacao: 'Listada na aba "Audiências"', formato: 'Display',
    usuariosEstimados: '', cobertura: 20, frequenciaMaxima: 4,
    tipoPagamento: 'CPM', cpmTabela: 24, desconto: 25,
  }]);

  // Bonifications
  const [hasBonus, setHasBonus] = useState(false);
  const [bonusRows, setBonusRows] = useState([{
    id: 1, produto: 'O2O', segmentacao: 'Listada na aba "Audiências"', formato: 'Display',
    tipoPagamento: 'CPM', cpmTabela: 24, desconto: 25, linkedIdx: 0,
  }]);

  // Features
  const [selectedFeatures, setSelectedFeatures] = useState([]);
  const [featureDetails, setFeatureDetails] = useState({});

  // Client search
  const [clientSearch, setClientSearch] = useState('');
  const [showClientDD, setShowClientDD] = useState(false);
  const filteredClients = useMemo(() => {
    if (!clientSearch) return [];
    const q = clientSearch.toLowerCase();
    return clients.filter(c => c.client?.toLowerCase().includes(q) || c.agency?.toLowerCase().includes(q)).slice(0, 10);
  }, [clientSearch, clients]);

  // ── Auto-fill agency from client ──
  function selectClient(c) {
    setClient(c.client);
    setAgency(c.agency);
    setClientSearch(c.client);
    setShowClientDD(false);
  }

  // ── Calculations ──
  const calcs = useMemo(() => {
    const rows = contractRows.map(r => {
      const users = parseFloat(r.usuariosEstimados) || 0;
      const cob = (parseFloat(r.cobertura) || 0) / 100;
      const freq = parseFloat(r.frequenciaMaxima) || 0;
      const cpmTab = parseFloat(r.cpmTabela) || 0;
      const desc = (parseFloat(r.desconto) || 0) / 100;

      const impressoes = users * cob * freq;
      const cpmBruto = cpmTab * (1 - desc);
      const cpmLiquido = cpmBruto * 0.8;
      const valorBruto = (impressoes / 1000) * cpmBruto;
      const valorLiquido = valorBruto * 0.8;

      return { impressoes, cpmBruto, cpmLiquido, valorBruto, valorLiquido };
    });

    const bonusCalcs = hasBonus ? bonusRows.map((b, i) => {
      const linked = rows[b.linkedIdx] || rows[0] || { impressoes: 0 };
      const cpmTab = parseFloat(b.cpmTabela) || 0;
      const desc = (parseFloat(b.desconto) || 0) / 100;
      const cpmBruto = cpmTab * (1 - desc);
      const valorBruto = (linked.impressoes / 1000) * cpmBruto;
      return { impressoes: linked.impressoes, cpmBruto, valorBruto };
    }) : [];

    const totalDisplay = rows.reduce((s, r, i) => s + (contractRows[i].formato === 'Display' ? r.impressoes : 0), 0);
    const totalVideo = rows.reduce((s, r, i) => s + (contractRows[i].formato === 'Video' ? r.impressoes : 0), 0);
    const totalBruto = rows.reduce((s, r) => s + r.valorBruto, 0);
    const totalLiquido = rows.reduce((s, r) => s + r.valorLiquido, 0);
    const totalBonus = bonusCalcs.reduce((s, r) => s + r.valorBruto, 0);

    return { rows, bonusCalcs, totalDisplay, totalVideo, totalBruto, totalLiquido, totalBonus };
  }, [contractRows, bonusRows, hasBonus]);

  // ── Load proposals ──
  useEffect(() => { loadProposals(); }, []);

  async function loadProposals() {
    setLoading(true);
    try {
      const r = await fetch(`${BACKEND_URL}/proposals`);
      const d = await r.json();
      if (Array.isArray(d)) setProposals(d);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }

  // ── Save proposal ──
  async function saveProposal(status = 'draft') {
    if (!client) { toast('Selecione um cliente', 'error'); return; }
    setSaving(true);
    try {
      const body = {
        client, agency, proposalTitle: proposalTitle || `Pacote HYPR — ${client}`, praca,
        projectDescription, periodStart, periodEnd,
        scopeProducts: scopeRows, contractedProducts: contractRows, bonifications: bonusRows,
        features: selectedFeatures, featureDetails,
        totalVolumetriaDisplay: calcs.totalDisplay,
        totalVolumetriaVideo: calcs.totalVideo,
        totalValorBruto: calcs.totalBruto,
        totalValorLiquido: calcs.totalLiquido,
        totalBonificacao: calcs.totalBonus,
        status, createdBy: user.name, createdByEmail: user.email,
      };
      const r = await fetch(`${BACKEND_URL}/proposals`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const res = await r.json();
      if (res.ok) { toast('Proposta salva com sucesso!'); loadProposals(); setView('list'); resetForm(); }
      else toast('Erro ao salvar proposta', 'error');
    } catch (e) { console.error(e); toast('Erro ao salvar', 'error'); }
    finally { setSaving(false); }
  }

  // ── Delete proposal ──
  async function deleteProposal(id) {
    if (!confirm('Tem certeza que deseja excluir esta proposta?')) return;
    try {
      await fetch(`${BACKEND_URL}/proposals/${id}`, { method: 'DELETE' });
      toast('Proposta excluída');
      loadProposals();
    } catch (e) { toast('Erro ao excluir', 'error'); }
  }

  // ── Generate Excel ──
  async function generateExcel() {
    if (!client) { toast('Preencha pelo menos o cliente', 'error'); return; }
    toast('Gerando Excel...');

    // Dynamically import ExcelJS from CDN
    if (!window.ExcelJS) {
      await new Promise((resolve, reject) => {
        const s = document.createElement('script');
        s.src = 'https://cdn.jsdelivr.net/npm/exceljs@4.4.0/dist/exceljs.min.js';
        s.onload = resolve;
        s.onerror = reject;
        document.head.appendChild(s);
      });
    }

    try {
      const wb = new window.ExcelJS.Workbook();

      // ── Sheet 1: Escopo Projeto ──
      const wsE = wb.addWorksheet('Escopo Projeto');

      // HYPR branding row
      wsE.mergeCells('B1:F1');
      wsE.getCell('B1').value = 'HYPR';
      wsE.getCell('B1').font = { bold: true, size: 20, color: { argb: 'FF3397B9' } };

      wsE.mergeCells('B2:F2');
      wsE.getCell('B2').value = 'ESCOPO DO PROJETO';
      wsE.getCell('B2').font = { bold: true, size: 16, color: { argb: 'FF1C262F' } };

      wsE.mergeCells('B3:F3');
      wsE.getCell('B3').value = proposalTitle || `Pacote HYPR — ${client}`;
      wsE.getCell('B3').font = { size: 13, color: { argb: 'FF4A6070' } };

      wsE.mergeCells('B4:F4');
      wsE.getCell('B4').value = `Descrição do Projeto: ${projectDescription || '—'}`;
      wsE.getCell('B4').font = { size: 11, color: { argb: 'FF4A6070' } };
      wsE.getCell('B4').alignment = { wrapText: true };

      wsE.getCell('B5').value = ''; // spacer

      wsE.mergeCells('B6:F6');
      wsE.getCell('B6').value = `Praça: ${praca}`;
      wsE.getCell('B6').font = { bold: true, size: 11 };

      wsE.getCell('B7').value = ''; // spacer

      // Table headers
      const headerStyle = { font: { bold: true, size: 10, color: { argb: 'FFFFFFFF' } }, fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1C262F' } }, alignment: { horizontal: 'center', vertical: 'middle', wrapText: true }, border: { bottom: { style: 'thin', color: { argb: 'FF3397B9' } } } };
      ['Produto', 'Cluster', 'Comportamento OFF', 'Comportamento ON', 'Volumetria Estimada da Audiência'].forEach((h, i) => {
        const cell = wsE.getCell(8, i + 2);
        cell.value = h;
        Object.assign(cell, headerStyle);
      });

      // Data rows
      const dataFill1 = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF4F6F8' } };
      const dataFill2 = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFFFF' } };
      scopeRows.forEach((sp, idx) => {
        const row = 9 + idx;
        const fill = idx % 2 === 0 ? dataFill1 : dataFill2;
        [sp.produto, sp.cluster, sp.behaviorOff, sp.behaviorOn].forEach((v, ci) => {
          const c = wsE.getCell(row, ci + 2);
          c.value = v || '';
          c.fill = fill;
          c.font = { size: 10 };
          c.alignment = { wrapText: true, vertical: 'middle' };
        });
        const volCell = wsE.getCell(row, 6);
        volCell.value = parseFloat(sp.volumetria) || 0;
        volCell.numFmt = '#,##0';
        volCell.fill = fill;
        volCell.font = { size: 10, bold: true };
        volCell.alignment = { horizontal: 'right' };
      });

      // Total
      const totalR = 9 + scopeRows.length;
      wsE.getCell(totalR, 2).value = 'TOTAL';
      wsE.getCell(totalR, 2).font = { bold: true, size: 11 };
      wsE.getCell(totalR, 6).value = scopeRows.reduce((s, r) => s + (parseFloat(r.volumetria) || 0), 0);
      wsE.getCell(totalR, 6).numFmt = '#,##0';
      wsE.getCell(totalR, 6).font = { bold: true, size: 11 };

      // Column widths
      wsE.getColumn(2).width = 18;
      wsE.getColumn(3).width = 22;
      wsE.getColumn(4).width = 38;
      wsE.getColumn(5).width = 38;
      wsE.getColumn(6).width = 24;

      // ── Sheet 2: Proposta Comercial ──
      const wsP = wb.addWorksheet('Proposta Comercial');

      // Header
      wsP.mergeCells('B1:P1');
      wsP.getCell('B1').value = 'HYPR';
      wsP.getCell('B1').font = { bold: true, size: 20, color: { argb: 'FF3397B9' } };

      wsP.mergeCells('E2:K2');
      wsP.getCell('E2').value = 'PROPOSTA COMERCIAL';
      wsP.getCell('E2').font = { bold: true, size: 16, color: { argb: 'FF1C262F' } };
      wsP.getCell('E2').alignment = { horizontal: 'center' };

      wsP.mergeCells('G3:I3');
      wsP.getCell('G3').value = proposalTitle || `Pacote HYPR — ${client}`;
      wsP.getCell('G3').font = { size: 12, color: { argb: 'FF4A6070' } };
      wsP.getCell('G3').alignment = { horizontal: 'center' };

      // Client info
      wsP.getCell('B5').value = `Cliente: ${client}`;
      wsP.getCell('B5').font = { bold: true, size: 11 };
      wsP.getCell('E5').value = `Agência: ${agency}`;
      wsP.getCell('E5').font = { bold: true, size: 11 };
      wsP.getCell('H5').value = `Período: ${periodStart || 'TBD'} a ${periodEnd || 'TBD'}`;
      wsP.getCell('H5').font = { size: 11 };

      // Summary box (top-right)
      const sumFill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1C262F' } };
      const sumFont = { color: { argb: 'FFFFFFFF' }, size: 10 };
      const sumValFont = { color: { argb: 'FF3397B9' }, size: 11, bold: true };

      [
        ['Volumetria Total Display', fmtCompact(calcs.totalDisplay)],
        ['Volumetria Total Video', fmtCompact(calcs.totalVideo)],
        ['Valor Total Bruto', fmtCurrency(calcs.totalBruto)],
        ['Valor Total Líquido', fmtCurrency(calcs.totalLiquido)],
        ['Bonificação Total', fmtCurrency(calcs.totalBonus)],
      ].forEach(([label, val], i) => {
        const r = 6 + i;
        wsP.mergeCells(`L${r}:N${r}`);
        wsP.getCell(`L${r}`).value = label;
        wsP.getCell(`L${r}`).font = sumFont;
        wsP.getCell(`L${r}`).fill = sumFill;
        wsP.getCell(`O${r}`).value = val;
        wsP.getCell(`O${r}`).font = sumValFont;
        wsP.getCell(`O${r}`).fill = sumFill;
        wsP.getCell(`O${r}`).alignment = { horizontal: 'right' };
      });

      // Product table headers
      const pHeaders = ['Produto', 'Segmentação', 'Formato', 'Período', 'Usuários/Telas\nEstimados',
        'Cobertura*', 'Freq. Máxima', 'Tipo de\npagamento', 'Impressões\nContratadas',
        'CPM/CPCV\nTabela', 'Desconto', 'CPM/CPCV\nNeg. Bruto', 'CPM/CPCV\nNeg. Líquido',
        'Valor Total\nBruto', 'Valor Total\nLíquido'];

      pHeaders.forEach((h, i) => {
        const c = wsP.getCell(12, i + 2);
        c.value = h;
        c.font = { bold: true, size: 9, color: { argb: 'FFFFFFFF' } };
        c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1C262F' } };
        c.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
      });

      // Product data rows
      contractRows.forEach((cr, idx) => {
        const r = 13 + idx;
        const c = calcs.rows[idx];
        const fill = idx % 2 === 0 ? dataFill1 : dataFill2;

        const vals = [
          cr.produto, cr.segmentacao, cr.formato,
          periodStart && periodEnd ? `${periodStart} a ${periodEnd}` : 'TBD',
          parseFloat(cr.usuariosEstimados) || 0,
          (parseFloat(cr.cobertura) || 0) / 100,
          cr.frequenciaMaxima,
          cr.tipoPagamento,
          c.impressoes,
          parseFloat(cr.cpmTabela) || 0,
          (parseFloat(cr.desconto) || 0) / 100,
          c.cpmBruto,
          c.cpmLiquido,
          c.valorBruto,
          c.valorLiquido,
        ];

        vals.forEach((v, ci) => {
          const cell = wsP.getCell(r, ci + 2);
          cell.value = v;
          cell.fill = fill;
          cell.font = { size: 10 };
          cell.alignment = { horizontal: ci >= 4 ? 'right' : 'left', vertical: 'middle' };
          // Number formats
          if (ci === 4 || ci === 8) cell.numFmt = '#,##0';
          if (ci === 5 || ci === 10) cell.numFmt = '0.00%';
          if (ci >= 9 && ci !== 10 || ci >= 11) cell.numFmt = 'R$ #,##0.00';
        });
      });

      // Bonifications section (only if enabled)
      const bonusStart = 13 + contractRows.length + 1;
      if (hasBonus) {
        wsP.mergeCells(`B${bonusStart}:P${bonusStart}`);
        wsP.getCell(`B${bonusStart}`).value = 'Bonificações';
        wsP.getCell(`B${bonusStart}`).font = { bold: true, size: 12, color: { argb: 'FF3397B9' } };

        // Bonus headers
        pHeaders.forEach((h, i) => {
          const c = wsP.getCell(bonusStart + 1, i + 2);
          c.value = h;
          c.font = { bold: true, size: 9, color: { argb: 'FFFFFFFF' } };
          c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF3397B9' } };
          c.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
        });

        // Bonus data
        bonusRows.forEach((br, idx) => {
          const r = bonusStart + 2 + idx;
          const bc = calcs.bonusCalcs[idx];

          const vals = [
            br.produto, br.segmentacao, br.formato, '—', '—', '—', '—',
            br.tipoPagamento, bc.impressoes, parseFloat(br.cpmTabela) || 0,
            (parseFloat(br.desconto) || 0) / 100, bc.cpmBruto, bc.cpmBruto * 0.8,
            bc.valorBruto, bc.valorBruto * 0.8,
          ];

          vals.forEach((v, ci) => {
            const cell = wsP.getCell(r, ci + 2);
            cell.value = v;
            cell.font = { size: 10 };
            if (ci === 8) cell.numFmt = '#,##0';
            if (ci === 10) cell.numFmt = '0.00%';
            if (ci >= 9 && ci !== 10) cell.numFmt = 'R$ #,##0.00';
          });
        });
      }

      // Features section
      const featStart = bonusStart + 2 + (hasBonus ? bonusRows.length : 0) + 1;
      if (selectedFeatures.length > 0) {
        wsP.mergeCells(`B${featStart}:P${featStart}`);
        wsP.getCell(`B${featStart}`).value = 'Features';
        wsP.getCell(`B${featStart}`).font = { bold: true, size: 12, color: { argb: 'FF3397B9' } };

        ['Feature', 'Segmentação/Escopo', 'Formato', 'Período', 'Impressões Visíveis', 'Views 100%', 'Plays'].forEach((h, i) => {
          const c = wsP.getCell(featStart + 1, i + 2);
          c.value = h;
          c.font = { bold: true, size: 9, color: { argb: 'FFFFFFFF' } };
          c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1C262F' } };
          c.alignment = { horizontal: 'center', vertical: 'middle' };
        });

        selectedFeatures.forEach((f, idx) => {
          const r = featStart + 2 + idx;
          const fd = featureDetails[f] || {};
          wsP.getCell(r, 2).value = f;
          wsP.getCell(r, 3).value = fd.scope || '—';
          wsP.getCell(r, 4).value = f;
          wsP.getCell(r, 5).value = periodStart && periodEnd ? `${periodStart} a ${periodEnd}` : 'TBD';
          if (FEATURES_PLAYS.includes(f)) {
            wsP.getCell(r, 8).value = parseFloat(fd.plays) || 0;
            wsP.getCell(r, 8).numFmt = '#,##0';
          } else if (!FEATURES_NO_VOL.includes(f)) {
            wsP.getCell(r, 6).value = parseFloat(fd.impressoes) || 0;
            wsP.getCell(r, 6).numFmt = '#,##0';
            wsP.getCell(r, 7).value = parseFloat(fd.views) || 0;
            wsP.getCell(r, 7).numFmt = '#,##0';
          }
        });
      }

      // Footer notes
      const footerRow = featStart + (selectedFeatures.length > 0 ? selectedFeatures.length + 3 : 1);
      wsP.getCell(`B${footerRow}`).value = `Praça: ${praca}`;
      wsP.getCell(`B${footerRow}`).font = { bold: true, size: 10 };
      wsP.getCell(`B${footerRow + 1}`).value = '* Modelo de compra de Display por CPM - Impressões auditadas por parceiros terceiros que garantem que os anúncios sejam vistos por completo por pelo menos 1 segundo. A HYPR cobra apenas por impressões visíveis.';
      wsP.getCell(`B${footerRow + 1}`).font = { size: 9, color: { argb: 'FF8DA0AE' } };
      wsP.getCell(`B${footerRow + 1}`).alignment = { wrapText: true };
      wsP.getCell(`B${footerRow + 2}`).value = '* Modelo de compra de Vídeo por CPCV - custo por completed view que leva em consideração apenas as visualizações de video completas (100% vistas e auditadas por terceiros).';
      wsP.getCell(`B${footerRow + 2}`).font = { size: 9, color: { argb: 'FF8DA0AE' } };
      wsP.getCell(`B${footerRow + 2}`).alignment = { wrapText: true };
      wsP.getCell(`B${footerRow + 3}`).value = 'TABELA 2026';
      wsP.getCell(`B${footerRow + 3}`).font = { bold: true, size: 10 };
      wsP.getCell(`B${footerRow + 4}`).value = 'Prazo de Pagamento: 15 dfm (15 dias fora o mês de veiculação)';
      wsP.getCell(`B${footerRow + 4}`).font = { size: 9, color: { argb: 'FF8DA0AE' } };
      wsP.getCell(`B${footerRow + 5}`).value = 'Entrega de material: 2 dias úteis antes do início da campanha';
      wsP.getCell(`B${footerRow + 5}`).font = { size: 9, color: { argb: 'FF8DA0AE' } };

      // Column widths
      [2,18],[3,24],[4,12],[5,14],[6,18],[7,12],[8,14],[9,14],[10,18],[11,14],[12,12],[13,16],[14,16],[15,16],[16,16]
      .forEach(([c,w]) => { wsP.getColumn(c).width = w; });

      // Generate and download
      const buffer = await wb.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Proposta_HYPR_${agency ? agency.replace(/\s/g, '_') + '_' : ''}${client.replace(/\s/g, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
      toast('Excel gerado com sucesso!');
    } catch (e) {
      console.error('Error generating Excel:', e);
      toast('Erro ao gerar Excel', 'error');
    }
  }

  // ── Generate PDF ──
  async function generatePDF() {
    if (!client) { toast('Preencha pelo menos o cliente', 'error'); return; }
    toast('Gerando PDF...');

    // Load jsPDF
    if (!window.jspdf) {
      await new Promise((resolve, reject) => {
        const s = document.createElement('script');
        s.src = 'https://cdn.jsdelivr.net/npm/jspdf@2.5.1/dist/jspdf.umd.min.js';
        s.onload = resolve;
        s.onerror = reject;
        document.head.appendChild(s);
      });
    }
    // Load autoTable
    if (!window.jspdf?.jsPDF?.prototype?.autoTable) {
      await new Promise((resolve, reject) => {
        const s = document.createElement('script');
        s.src = 'https://cdn.jsdelivr.net/npm/jspdf-autotable@3.8.2/dist/jspdf.plugin.autotable.min.js';
        s.onload = resolve;
        s.onerror = reject;
        document.head.appendChild(s);
      });
    }

    try {
      const { jsPDF } = window.jspdf;
      const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });

      // Colors
      const navy = [28, 38, 47];
      const teal = [51, 151, 185];
      const grey = [141, 160, 174];

      // Header
      doc.setFillColor(...navy);
      doc.rect(0, 0, 297, 32, 'F');
      doc.setFontSize(22);
      doc.setTextColor(...teal);
      doc.text('HYPR', 14, 18);
      doc.setFontSize(11);
      doc.setTextColor(255, 255, 255);
      doc.text('PROPOSTA COMERCIAL', 50, 14);
      doc.setFontSize(9);
      doc.text(proposalTitle || `Pacote HYPR — ${client}`, 50, 22);
      doc.setFontSize(8);
      doc.text(`${new Date().toLocaleDateString('pt-BR')}`, 270, 14);

      // Client info
      doc.setFontSize(10);
      doc.setTextColor(...navy);
      doc.text(`Cliente: ${client}`, 14, 40);
      doc.text(`Agência: ${agency || '—'}`, 100, 40);
      doc.text(`Período: ${periodStart || 'TBD'} a ${periodEnd || 'TBD'}`, 190, 40);
      doc.text(`Praça: ${praca}`, 14, 47);

      // Summary boxes
      const boxY = 54;
      const boxes = [
        ['Vol. Display', fmtCompact(calcs.totalDisplay)],
        ['Vol. Video', fmtCompact(calcs.totalVideo)],
        ['Valor Bruto', fmtCurrency(calcs.totalBruto)],
        ['Valor Líquido', fmtCurrency(calcs.totalLiquido)],
        ['Bonificação', fmtCurrency(calcs.totalBonus)],
      ];
      boxes.forEach(([label, val], i) => {
        const x = 14 + i * 55;
        doc.setFillColor(244, 246, 248);
        doc.roundedRect(x, boxY, 50, 18, 2, 2, 'F');
        doc.setFontSize(7);
        doc.setTextColor(...grey);
        doc.text(label, x + 4, boxY + 6);
        doc.setFontSize(10);
        doc.setTextColor(...navy);
        doc.text(val, x + 4, boxY + 14);
      });

      // Products table
      const tableData = contractRows.map((cr, idx) => {
        const c = calcs.rows[idx];
        return [
          cr.produto, cr.segmentacao, cr.formato, cr.tipoPagamento,
          new Intl.NumberFormat('pt-BR').format(parseFloat(cr.usuariosEstimados) || 0),
          `${cr.cobertura}%`, cr.frequenciaMaxima,
          new Intl.NumberFormat('pt-BR').format(Math.round(c.impressoes)),
          fmtCurrency(parseFloat(cr.cpmTabela)), `${cr.desconto}%`,
          fmtCurrency(c.cpmBruto), fmtCurrency(c.valorBruto), fmtCurrency(c.valorLiquido),
        ];
      });

      doc.autoTable({
        startY: boxY + 24,
        head: [['Produto', 'Segmentação', 'Formato', 'Pag.', 'Usuários Est.', 'Cobertura', 'Freq.', 'Impressões', 'CPM Tab.', 'Desc.', 'CPM Neg.', 'Val. Bruto', 'Val. Líquido']],
        body: tableData,
        theme: 'grid',
        headStyles: { fillColor: navy, fontSize: 7, halign: 'center' },
        bodyStyles: { fontSize: 7 },
        alternateRowStyles: { fillColor: [244, 246, 248] },
        columnStyles: { 4: { halign: 'right' }, 5: { halign: 'right' }, 7: { halign: 'right' }, 8: { halign: 'right' }, 10: { halign: 'right' }, 11: { halign: 'right' }, 12: { halign: 'right' } },
        margin: { left: 14 },
      });

      // Bonifications table (only if enabled)
      let lastTableY = doc.lastAutoTable.finalY;
      if (hasBonus) {
        const bonusY = lastTableY + 8;
        doc.setFontSize(11);
        doc.setTextColor(...teal);
        doc.text('Bonificações', 14, bonusY);

        const bonusData = bonusRows.map((br, idx) => {
          const bc = calcs.bonusCalcs[idx];
          return [
            br.produto, br.segmentacao, br.formato, br.tipoPagamento,
            '—', '—', '—',
            new Intl.NumberFormat('pt-BR').format(Math.round(bc.impressoes)),
            fmtCurrency(parseFloat(br.cpmTabela)), `${br.desconto}%`,
            fmtCurrency(bc.cpmBruto), fmtCurrency(bc.valorBruto), fmtCurrency(bc.valorBruto * 0.8),
          ];
        });

        doc.autoTable({
          startY: bonusY + 3,
          head: [['Produto', 'Segmentação', 'Formato', 'Pag.', 'Usuários', 'Cobertura', 'Freq.', 'Impressões', 'CPM Tab.', 'Desc.', 'CPM Neg.', 'Val. Bruto', 'Val. Líquido']],
          body: bonusData,
          theme: 'grid',
          headStyles: { fillColor: teal, fontSize: 7, halign: 'center' },
          bodyStyles: { fontSize: 7 },
          margin: { left: 14 },
        });
        lastTableY = doc.lastAutoTable.finalY;
      }

      // Footer
      const fY = lastTableY + 8;
      doc.setFontSize(7);
      doc.setTextColor(...grey);
      doc.text('* Modelo de compra de Display por CPM — Impressões auditadas.', 14, fY);
      doc.text('* Modelo de compra de Vídeo por CPCV — custo por completed view (100% vistas).', 14, fY + 4);
      doc.text('TABELA 2026 | Prazo de Pagamento: 15 dfm | Entrega de material: 2 dias úteis antes do início', 14, fY + 10);

      // HYPR footer bar
      doc.setFillColor(...navy);
      doc.rect(0, 200, 297, 10, 'F');
      doc.setFontSize(7);
      doc.setTextColor(...teal);
      doc.text('HYPR Command — Proposta gerada automaticamente', 14, 206);
      doc.setTextColor(255, 255, 255);
      doc.text(`Gerado por: ${user.name} | ${new Date().toLocaleDateString('pt-BR')}`, 200, 206);

      // Save
      doc.save(`Proposta_HYPR_${agency ? agency.replace(/\s/g, '_') + '_' : ''}${client.replace(/\s/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`);
      toast('PDF gerado com sucesso!');
    } catch (e) {
      console.error('Error generating PDF:', e);
      toast('Erro ao gerar PDF', 'error');
    }
  }

  function resetForm() {
    setClient(''); setAgency(''); setProposalTitle(''); setPraca('Nacional');
    setProjectDescription(''); setPeriodStart(''); setPeriodEnd('');
    setScopeRows([{ id: 1, produto: 'O2O', cluster: '', behaviorOff: '', behaviorOn: '', volumetria: '' }]);
    setContractRows([{ id: 1, produto: 'O2O', segmentacao: 'Listada na aba "Audiências"', formato: 'Display', usuariosEstimados: '', cobertura: 20, frequenciaMaxima: 4, tipoPagamento: 'CPM', cpmTabela: 24, desconto: 25 }]);
    setHasBonus(false);
    setBonusRows([{ id: 1, produto: 'O2O', segmentacao: 'Listada na aba "Audiências"', formato: 'Display', tipoPagamento: 'CPM', cpmTabela: 24, desconto: 25, linkedIdx: 0 }]);
    setSelectedFeatures([]); setFeatureDetails({}); setClientSearch(''); setEditId(null);
  }

  // ── SCOPE ROW HANDLERS ──
  function addScopeRow() { setScopeRows(prev => [...prev, { id: Date.now(), produto: 'O2O', cluster: '', behaviorOff: '', behaviorOn: '', volumetria: '' }]); }
  function removeScopeRow(id) { if (scopeRows.length > 1) setScopeRows(prev => prev.filter(r => r.id !== id)); }
  function updateScopeRow(id, field, value) { setScopeRows(prev => prev.map(r => r.id === id ? { ...r, [field]: value } : r)); }

  // ── CONTRACT ROW HANDLERS ──
  function addContractRow() {
    setContractRows(prev => [...prev, { id: Date.now(), produto: 'O2O', segmentacao: 'Listada na aba "Audiências"', formato: 'Display', usuariosEstimados: '', cobertura: 20, frequenciaMaxima: 4, tipoPagamento: 'CPM', cpmTabela: 24, desconto: 25 }]);
  }
  function removeContractRow(id) { if (contractRows.length > 1) setContractRows(prev => prev.filter(r => r.id !== id)); }
  function updateContractRow(id, field, value) {
    setContractRows(prev => prev.map(r => {
      if (r.id !== id) return r;
      const updated = { ...r, [field]: value };
      // Auto-update CPM tabela when product/format changes
      if (field === 'produto' || field === 'formato') {
        const prod = field === 'produto' ? value : r.produto;
        const fmt = field === 'formato' ? value : r.formato;
        const ref = CPM_TABLE[prod];
        if (ref) updated.cpmTabela = ref[fmt] || 0;
      }
      return updated;
    }));
  }

  // ── BONUS ROW HANDLERS ──
  function addBonusRow() {
    setBonusRows(prev => [...prev, { id: Date.now(), produto: 'O2O', segmentacao: 'Listada na aba "Audiências"', formato: 'Display', tipoPagamento: 'CPM', cpmTabela: 24, desconto: 25, linkedIdx: 0 }]);
  }
  function removeBonusRow(id) { if (bonusRows.length > 1) setBonusRows(prev => prev.filter(r => r.id !== id)); }
  function updateBonusRow(id, field, value) { setBonusRows(prev => prev.map(r => r.id === id ? { ...r, [field]: value } : r)); }

  // ── FEATURE TOGGLE ──
  function toggleFeature(f) {
    setSelectedFeatures(prev => prev.includes(f) ? prev.filter(x => x !== f) : [...prev, f]);
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // RENDER
  // ══════════════════════════════════════════════════════════════════════════════

  // ── LIST VIEW ──
  if (view === 'list') {
    return (
      <div className="page-enter">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 style={{ fontFamily: 'var(--fd)', fontSize: 26, fontWeight: 700, color: 'var(--t1)', margin: 0 }}>Proposal Builder</h1>
            <p style={{ color: 'var(--t3)', fontSize: 14, margin: '6px 0 0' }}>Crie e gerencie propostas comerciais HYPR</p>
          </div>
          <button className="btn" onClick={() => { resetForm(); setView('create'); }}>
            <I n="plus" s={14} /> Nova Proposta
          </button>
        </div>

        {/* KPIs */}
        <div className="g4" style={{ marginBottom: 24 }}>
          {[
            { label: 'Total Propostas', value: proposals.length, icon: 'file-text', color: 'var(--teal)' },
            { label: 'Rascunhos', value: proposals.filter(p => (p.status || 'draft') === 'draft').length, icon: 'clock', color: 'var(--yellow-s)' },
            { label: 'Enviadas', value: proposals.filter(p => p.status === 'sent').length, icon: 'send', color: 'var(--teal)' },
            { label: 'Valor Total', value: fmtCurrency(proposals.reduce((s, p) => s + (parseFloat(p.total_gross_value) || 0), 0)), icon: 'dollar', color: 'var(--green)' },
          ].map((k, i) => (
            <div key={i} className="card" style={{ padding: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 40, height: 40, borderRadius: 12, background: `${k.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <I n={k.icon} s={18} c={k.color} />
                </div>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--t3)', fontWeight: 600 }}>{k.label}</div>
                  <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--t1)', fontFamily: 'var(--fd)' }}>{k.value}</div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* List */}
        {loading ? (
          <div className="empty"><div style={{ color: 'var(--t3)' }}>Carregando propostas...</div></div>
        ) : proposals.length === 0 ? (
          <div className="card" style={{ padding: 60, textAlign: 'center' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>📝</div>
            <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--t2)', marginBottom: 8 }}>Nenhuma proposta criada</div>
            <div style={{ fontSize: 13, color: 'var(--t3)', marginBottom: 20 }}>Clique em "Nova Proposta" para começar a construir propostas comerciais</div>
            <button className="btn" onClick={() => { resetForm(); setView('create'); }}>
              <I n="plus" s={14} /> Criar Primeira Proposta
            </button>
          </div>
        ) : (
          <div className="card" style={{ overflow: 'hidden' }}>
            <table className="dt" style={{ minWidth: 800 }}>
              <thead>
                <tr>
                  <th>Cliente</th>
                  <th>Agência</th>
                  <th>Título</th>
                  <th>Valor Bruto</th>
                  <th>Status</th>
                  <th>Criado por</th>
                  <th>Data</th>
                  <th style={{ textAlign: 'right' }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {proposals.map(p => (
                  <tr key={p.id}>
                    <td style={{ fontWeight: 600 }}>{p.client}</td>
                    <td>{p.agency || '—'}</td>
                    <td style={{ color: 'var(--t2)', fontSize: 12 }}>{p.proposal_title || '—'}</td>
                    <td style={{ fontWeight: 700, color: 'var(--teal)' }}>{fmtCurrency(parseFloat(p.total_gross_value) || 0)}</td>
                    <td>
                      <span className={`badge ${p.status === 'sent' ? 'b-teal' : p.status === 'approved' ? 'b-grn' : 'b-ylw'}`}>
                        {p.status === 'sent' ? 'Enviada' : p.status === 'approved' ? 'Aprovada' : 'Rascunho'}
                      </span>
                    </td>
                    <td style={{ fontSize: 12, color: 'var(--t2)' }}>{p.created_by}</td>
                    <td style={{ fontSize: 12, color: 'var(--t3)' }}>{p.created_at ? new Date(p.created_at?.value || p.created_at).toLocaleDateString('pt-BR') : '—'}</td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                        <button className="btn bg" style={{ padding: '5px 8px', fontSize: 11 }} title="Excluir" onClick={() => deleteProposal(p.id)}>
                          <I n="x" s={12} c="var(--red)" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  }

  // ── CREATE/EDIT VIEW ──
  const sectionStyle = { marginBottom: 28 };
  const sectionTitle = (title, sub) => (
    <div style={{ marginBottom: 16 }}>
      <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--t1)', fontFamily: 'var(--fd)' }}>{title}</div>
      {sub && <div style={{ fontSize: 12, color: 'var(--t3)', marginTop: 2 }}>{sub}</div>}
    </div>
  );

  return (
    <div className="page-enter">
      {/* Top bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button className="btn bg" onClick={() => { setView('list'); resetForm(); }} style={{ padding: '6px 10px' }}>
            <I n="chevron-down" s={14} style={{ transform: 'rotate(90deg)' }} /> Voltar
          </button>
          <h1 style={{ fontFamily: 'var(--fd)', fontSize: 22, fontWeight: 700, color: 'var(--t1)', margin: 0 }}>
            {editId ? 'Editar Proposta' : 'Nova Proposta'}
          </h1>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button className="btn bg" onClick={() => saveProposal('draft')} disabled={saving}>
            {saving ? 'Salvando...' : 'Salvar Rascunho'}
          </button>
          <button className="btn" style={{ background: 'var(--green)', borderColor: 'var(--green)' }} onClick={generateExcel}>
            📊 Gerar Excel
          </button>
          <button className="btn" onClick={generatePDF}>
            📄 Gerar PDF
          </button>
        </div>
      </div>

      {/* ═══ Summary Cards ═══ */}
      <div className="g4" style={{ marginBottom: 24 }}>
        {[
          { label: 'Vol. Display', value: fmtCompact(calcs.totalDisplay), color: 'var(--teal)' },
          { label: 'Vol. Video', value: fmtCompact(calcs.totalVideo), color: 'var(--teal)' },
          { label: 'Valor Bruto', value: fmtCurrency(calcs.totalBruto), color: 'var(--green)' },
          { label: 'Valor Líquido', value: fmtCurrency(calcs.totalLiquido), color: 'var(--yellow-s)' },
        ].map((c, i) => (
          <div key={i} className="card" style={{ padding: '14px 18px', borderLeft: `3px solid ${c.color}` }}>
            <div style={{ fontSize: 11, color: 'var(--t3)', fontWeight: 600, marginBottom: 4 }}>{c.label}</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--t1)', fontFamily: 'var(--fd)' }}>{c.value}</div>
          </div>
        ))}
      </div>

      {/* ═══ 1. Informações Gerais ═══ */}
      <div className="card" style={{ padding: 24, ...sectionStyle }}>
        {sectionTitle('1. Informações Gerais', 'Cliente, agência, período e praça')}
        <div className="g2" style={{ marginBottom: 16 }}>
          <div className="fg">
            <label className="fl">Cliente *</label>
            <div style={{ position: 'relative' }}>
              <input className="fi" placeholder="Buscar cliente..." value={clientSearch}
                onChange={e => { setClientSearch(e.target.value); setShowClientDD(true); }}
                onFocus={() => { if (clientSearch) setShowClientDD(true); }} />
              {showClientDD && filteredClients.length > 0 && (
                <div className="dd">
                  {filteredClients.map(c => (
                    <div key={c.client + c.agency} className="di" onClick={() => selectClient(c)}>
                      <div style={{ fontWeight: 600 }}>{c.client}</div>
                      <div style={{ fontSize: 11, color: 'var(--t3)' }}>{c.agency}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div className="fg">
            <label className="fl">Agência</label>
            <input className="fi" value={agency} onChange={e => setAgency(e.target.value)} placeholder="Agência do cliente" />
          </div>
        </div>
        <div className="g2" style={{ marginBottom: 16 }}>
          <div className="fg">
            <label className="fl">Título da Proposta</label>
            <input className="fi" value={proposalTitle} onChange={e => setProposalTitle(e.target.value)} placeholder="Ex: Pacote de Q4/25" />
          </div>
          <div className="fg">
            <label className="fl">Praça</label>
            <select className="fs" value={praca} onChange={e => setPraca(e.target.value)}>
              {PROPOSAL_PRACAS.map(p => <option key={p}>{p}</option>)}
            </select>
          </div>
        </div>
        <div className="g2" style={{ marginBottom: 16 }}>
          <div className="fg">
            <label className="fl">Período Início</label>
            <input className="fi" type="date" value={periodStart} onChange={e => setPeriodStart(e.target.value)} />
          </div>
          <div className="fg">
            <label className="fl">Período Fim</label>
            <input className="fi" type="date" value={periodEnd} onChange={e => setPeriodEnd(e.target.value)} />
          </div>
        </div>
        <div className="fg">
          <label className="fl">Descrição do Projeto</label>
          <textarea className="ft" value={projectDescription} onChange={e => setProjectDescription(e.target.value)}
            placeholder="Ex: Digitalizar Jornadas do mundo físico, direcionando consumidores para funil de conversão digital" />
        </div>
      </div>

      {/* ═══ 2. Escopo do Projeto ═══ */}
      <div className="card" style={{ padding: 24, ...sectionStyle }}>
        {sectionTitle('2. Escopo do Projeto', 'Produtos, clusters e volumetria estimada de audiência')}
        {scopeRows.map((row, idx) => (
          <div key={row.id} style={{ display: 'flex', gap: 10, marginBottom: 10, alignItems: 'flex-start', padding: 14, background: 'var(--bg3)', borderRadius: 12 }}>
            <div style={{ flex: '0 0 130px' }}>
              <label className="fl" style={{ marginBottom: 4 }}>Produto</label>
              <select className="fs" value={row.produto} onChange={e => updateScopeRow(row.id, 'produto', e.target.value)}>
                {PROPOSAL_PRODUCTS.map(p => <option key={p}>{p}</option>)}
              </select>
            </div>
            <div style={{ flex: '0 0 140px' }}>
              <label className="fl" style={{ marginBottom: 4 }}>Cluster</label>
              <input className="fi" value={row.cluster} onChange={e => updateScopeRow(row.id, 'cluster', e.target.value)} placeholder="Ex: Promo Seekers" />
            </div>
            <div style={{ flex: 1 }}>
              <label className="fl" style={{ marginBottom: 4 }}>Comportamento OFF</label>
              <input className="fi" value={row.behaviorOff} onChange={e => updateScopeRow(row.id, 'behaviorOff', e.target.value)} placeholder="Ex: Visitantes de lojas de departamento..." />
            </div>
            <div style={{ flex: 1 }}>
              <label className="fl" style={{ marginBottom: 4 }}>Comportamento ON</label>
              <input className="fi" value={row.behaviorOn} onChange={e => updateScopeRow(row.id, 'behaviorOn', e.target.value)} placeholder="Ex: Interesse digital em descontos..." />
            </div>
            <div style={{ flex: '0 0 140px' }}>
              <label className="fl" style={{ marginBottom: 4 }}>Volumetria</label>
              <NumInput value={row.volumetria} onChange={v => updateScopeRow(row.id, 'volumetria', v)} placeholder="0" />
            </div>
            <button className="btn bg" style={{ marginTop: 18, padding: '6px 8px', flexShrink: 0 }} onClick={() => removeScopeRow(row.id)} title="Remover">
              <I n="x" s={14} c="var(--red)" />
            </button>
          </div>
        ))}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 }}>
          <button className="btn bg" onClick={addScopeRow}><I n="plus" s={14} /> Adicionar Linha</button>
          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--teal)' }}>
            Total Volumetria: {new Intl.NumberFormat('pt-BR').format(scopeRows.reduce((s, r) => s + (parseFloat(r.volumetria) || 0), 0))}
          </div>
        </div>
      </div>

      {/* ═══ 3. Produtos Contratados ═══ */}
      <div className="card" style={{ padding: 24, ...sectionStyle }}>
        {sectionTitle('3. Produtos Contratados', 'Formatos, volumetria, CPM e desconto — valores calculados automaticamente')}
        {contractRows.map((row, idx) => {
          const c = calcs.rows[idx];
          return (
            <div key={row.id} style={{ marginBottom: 14, padding: 16, background: 'var(--bg3)', borderRadius: 14, border: '1px solid var(--bdr-card)' }}>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 12 }}>
                <div style={{ flex: '0 0 130px' }}>
                  <label className="fl" style={{ marginBottom: 4 }}>Produto</label>
                  <select className="fs" value={row.produto} onChange={e => updateContractRow(row.id, 'produto', e.target.value)}>
                    {PROPOSAL_PRODUCTS.map(p => <option key={p}>{p}</option>)}
                  </select>
                </div>
                <div style={{ flex: 1, minWidth: 180 }}>
                  <label className="fl" style={{ marginBottom: 4 }}>Segmentação</label>
                  <input className="fi" value={row.segmentacao} onChange={e => updateContractRow(row.id, 'segmentacao', e.target.value)} />
                </div>
                <div style={{ flex: '0 0 110px' }}>
                  <label className="fl" style={{ marginBottom: 4 }}>Formato</label>
                  <select className="fs" value={row.formato} onChange={e => updateContractRow(row.id, 'formato', e.target.value)}>
                    {PROPOSAL_FORMATS.map(p => <option key={p}>{p}</option>)}
                  </select>
                </div>
                <div style={{ flex: '0 0 110px' }}>
                  <label className="fl" style={{ marginBottom: 4 }}>Tipo Pag.</label>
                  <select className="fs" value={row.tipoPagamento} onChange={e => updateContractRow(row.id, 'tipoPagamento', e.target.value)}>
                    {PROPOSAL_PAYMENTS.map(p => <option key={p}>{p}</option>)}
                  </select>
                </div>
                <button className="btn bg" style={{ marginTop: 18, padding: '6px 8px', flexShrink: 0 }} onClick={() => removeContractRow(row.id)} title="Remover">
                  <I n="x" s={14} c="var(--red)" />
                </button>
              </div>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <div style={{ flex: '0 0 140px' }}>
                  <label className="fl" style={{ marginBottom: 4 }}>Usuários Estimados</label>
                  <NumInput value={row.usuariosEstimados} onChange={v => updateContractRow(row.id, 'usuariosEstimados', v)} placeholder="0" />
                </div>
                <div style={{ flex: '0 0 100px' }}>
                  <label className="fl" style={{ marginBottom: 4 }}>Cobertura (%)</label>
                  <NumInput decimal value={row.cobertura} onChange={v => updateContractRow(row.id, 'cobertura', v)} />
                </div>
                <div style={{ flex: '0 0 90px' }}>
                  <label className="fl" style={{ marginBottom: 4 }}>Freq. Máx.</label>
                  <NumInput value={row.frequenciaMaxima} onChange={v => updateContractRow(row.id, 'frequenciaMaxima', v)} />
                </div>
                <div style={{ flex: '0 0 110px' }}>
                  <label className="fl" style={{ marginBottom: 4 }}>CPM/CPCV Tab.</label>
                  <NumInput decimal value={row.cpmTabela} onChange={v => updateContractRow(row.id, 'cpmTabela', v)} />
                </div>
                <div style={{ flex: '0 0 90px' }}>
                  <label className="fl" style={{ marginBottom: 4 }}>Desconto (%)</label>
                  <NumInput value={row.desconto} onChange={v => updateContractRow(row.id, 'desconto', v)} />
                </div>
              </div>
              {/* Calculated values */}
              <div style={{ display: 'flex', gap: 16, marginTop: 14, paddingTop: 12, borderTop: '1px solid var(--bdr)', flexWrap: 'wrap' }}>
                {[
                  ['Impressões', new Intl.NumberFormat('pt-BR').format(Math.round(c.impressoes))],
                  ['CPM Neg. Bruto', fmtCurrency(c.cpmBruto)],
                  ['CPM Neg. Líquido', fmtCurrency(c.cpmLiquido)],
                  ['Valor Bruto', fmtCurrency(c.valorBruto)],
                  ['Valor Líquido', fmtCurrency(c.valorLiquido)],
                ].map(([label, val]) => (
                  <div key={label}>
                    <div style={{ fontSize: 10, color: 'var(--t3)', fontWeight: 600 }}>{label}</div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--teal)', fontFamily: 'var(--fd)' }}>{val}</div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
        <button className="btn bg" onClick={addContractRow} style={{ marginTop: 8 }}>
          <I n="plus" s={14} /> Adicionar Produto
        </button>
      </div>

      {/* ═══ 4. Bonificações ═══ */}
      <div className="card" style={{ padding: 24, ...sectionStyle }}>
        {sectionTitle('4. Bonificações', 'Impressões bonificadas vinculadas aos produtos contratados')}
        {/* Toggle */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: hasBonus ? 20 : 0 }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600, color: 'var(--t1)' }}>
            <div onClick={() => setHasBonus(!hasBonus)} style={{
              width: 44, height: 24, borderRadius: 12, background: hasBonus ? 'var(--teal)' : 'var(--bg3)',
              border: `1px solid ${hasBonus ? 'var(--teal)' : 'var(--bdr)'}`, position: 'relative', cursor: 'pointer', transition: 'all 0.2s',
            }}>
              <div style={{
                width: 18, height: 18, borderRadius: '50%', background: '#fff', position: 'absolute', top: 2,
                left: hasBonus ? 22 : 2, transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
              }} />
            </div>
            Esta proposta inclui bonificações
          </label>
        </div>
        {hasBonus && (
          <>
            {bonusRows.map((row, idx) => {
              const bc = calcs.bonusCalcs[idx];
              return (
                <div key={row.id} style={{ marginBottom: 14, padding: 16, background: 'var(--bg3)', borderRadius: 14, border: '1px solid rgba(51,151,185,0.2)' }}>
                  <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 12 }}>
                    <div style={{ flex: '0 0 130px' }}>
                      <label className="fl" style={{ marginBottom: 4 }}>Produto</label>
                      <select className="fs" value={row.produto} onChange={e => updateBonusRow(row.id, 'produto', e.target.value)}>
                        {PROPOSAL_PRODUCTS.map(p => <option key={p}>{p}</option>)}
                      </select>
                    </div>
                    <div style={{ flex: 1, minWidth: 180 }}>
                      <label className="fl" style={{ marginBottom: 4 }}>Segmentação</label>
                      <input className="fi" value={row.segmentacao} onChange={e => updateBonusRow(row.id, 'segmentacao', e.target.value)} />
                    </div>
                    <div style={{ flex: '0 0 110px' }}>
                      <label className="fl" style={{ marginBottom: 4 }}>Formato</label>
                      <select className="fs" value={row.formato} onChange={e => updateBonusRow(row.id, 'formato', e.target.value)}>
                        {PROPOSAL_FORMATS.map(p => <option key={p}>{p}</option>)}
                      </select>
                    </div>
                    <div style={{ flex: '0 0 160px' }}>
                      <label className="fl" style={{ marginBottom: 4 }}>Vinculado ao Produto #</label>
                      <select className="fs" value={row.linkedIdx} onChange={e => updateBonusRow(row.id, 'linkedIdx', parseInt(e.target.value))}>
                        {contractRows.map((cr, i) => <option key={i} value={i}>#{i + 1} — {cr.produto} {cr.formato}</option>)}
                      </select>
                    </div>
                    <button className="btn bg" style={{ marginTop: 18, padding: '6px 8px', flexShrink: 0 }} onClick={() => removeBonusRow(row.id)} title="Remover">
                      <I n="x" s={14} c="var(--red)" />
                    </button>
                  </div>
                  <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                    <div style={{ flex: '0 0 110px' }}>
                      <label className="fl" style={{ marginBottom: 4 }}>CPM/CPCV Tab.</label>
                      <NumInput decimal value={row.cpmTabela} onChange={v => updateBonusRow(row.id, 'cpmTabela', v)} />
                    </div>
                    <div style={{ flex: '0 0 90px' }}>
                      <label className="fl" style={{ marginBottom: 4 }}>Desconto (%)</label>
                      <NumInput value={row.desconto} onChange={v => updateBonusRow(row.id, 'desconto', v)} />
                    </div>
                  </div>
                  {/* Calculated bonus values */}
                  {bc && (
                    <div style={{ display: 'flex', gap: 16, marginTop: 14, paddingTop: 12, borderTop: '1px dashed var(--bdr)', flexWrap: 'wrap' }}>
                      {[
                        ['Impressões Bonificadas', new Intl.NumberFormat('pt-BR').format(Math.round(bc.impressoes))],
                        ['CPM Neg. Bruto', fmtCurrency(bc.cpmBruto)],
                        ['Valor Total', fmtCurrency(bc.valorBruto)],
                      ].map(([label, val]) => (
                        <div key={label}>
                          <div style={{ fontSize: 10, color: 'var(--t3)', fontWeight: 600 }}>{label}</div>
                          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--teal)', fontFamily: 'var(--fd)' }}>{val}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
            <button className="btn bg" onClick={addBonusRow} style={{ marginTop: 8 }}>
              <I n="plus" s={14} /> Adicionar Bonificação
            </button>
          </>
        )}
      </div>

      {/* ═══ 5. Features ═══ */}
      <div className="card" style={{ padding: 24, ...sectionStyle }}>
        {sectionTitle('5. Features', 'Selecione as features adicionais da proposta')}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {PROPOSAL_FEATURES.map(f => (
            <button key={f} className={`chip${selectedFeatures.includes(f) ? ' sel' : ''}`}
              onClick={() => toggleFeature(f)}>
              {selectedFeatures.includes(f) && <I n="check" s={12} />}
              {f}
            </button>
          ))}
        </div>
        {/* Feature details with conditional volumetry */}
        {selectedFeatures.length > 0 && (
          <div style={{ marginTop: 16 }}>
            {selectedFeatures.map(f => {
              const isNoVol = FEATURES_NO_VOL.includes(f);
              const isPlays = FEATURES_PLAYS.includes(f);
              return (
                <div key={f} style={{ display: 'flex', gap: 10, marginBottom: 10, padding: 14, background: 'var(--bg3)', borderRadius: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--teal)', minWidth: 140 }}>{f}</span>
                  <input className="fi" style={{ flex: 1, minWidth: 180 }} placeholder="Escopo / Segmentação"
                    value={featureDetails[f]?.scope || ''}
                    onChange={e => setFeatureDetails(prev => ({ ...prev, [f]: { ...prev[f], scope: e.target.value } }))} />
                  {isPlays && (
                    <div style={{ flex: '0 0 140px' }}>
                      <NumInput placeholder="Plays"
                        value={featureDetails[f]?.plays || ''}
                        onChange={v => setFeatureDetails(prev => ({ ...prev, [f]: { ...prev[f], plays: v } }))} />
                      <div style={{ fontSize: 10, color: 'var(--t3)', marginTop: 2, textAlign: 'center' }}>Plays</div>
                    </div>
                  )}
                  {!isNoVol && !isPlays && (
                    <>
                      <div style={{ flex: '0 0 150px' }}>
                        <NumInput placeholder="Impressões Visíveis"
                          value={featureDetails[f]?.impressoes || ''}
                          onChange={v => setFeatureDetails(prev => ({ ...prev, [f]: { ...prev[f], impressoes: v } }))} />
                        <div style={{ fontSize: 10, color: 'var(--t3)', marginTop: 2, textAlign: 'center' }}>Impressões Visíveis</div>
                      </div>
                      <div style={{ flex: '0 0 140px' }}>
                        <NumInput placeholder="Views 100%"
                          value={featureDetails[f]?.views || ''}
                          onChange={v => setFeatureDetails(prev => ({ ...prev, [f]: { ...prev[f], views: v } }))} />
                        <div style={{ fontSize: 10, color: 'var(--t3)', marginTop: 2, textAlign: 'center' }}>Views 100%</div>
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ═══ Footer actions ═══ */}
      <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', paddingBottom: 40, flexWrap: 'wrap' }}>
        <button className="btn bg" onClick={() => { setView('list'); resetForm(); }}>Cancelar</button>
        <button className="btn bg" onClick={() => saveProposal('draft')} disabled={saving}>
          {saving ? 'Salvando...' : 'Salvar Rascunho'}
        </button>
        <button className="btn" style={{ background: 'var(--green)', borderColor: 'var(--green)' }} onClick={generateExcel}>
          📊 Gerar Excel
        </button>
        <button className="btn" onClick={generatePDF}>
          📄 Gerar PDF
        </button>
      </div>
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
  {key:"proposals",icon:"file-text",label:"Proposal Builder"},
  {key:"admin",icon:"users",label:"Admin"},
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
          const payload = JSON.parse(decodeURIComponent(escape(atob(response.credential.split(".")[1].replace(/-/g,"+").replace(/_/g,"/")))));
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
    <div style={{minHeight:"100vh",background:"#1C262F",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'Urbanist',sans-serif"}}>
      <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Urbanist:wght@300;400;500;600;700;800;900&display=swap"/>
      <div style={{textAlign:"center",padding:40}}>
        <div style={{display:"flex",alignItems:"baseline",justifyContent:"center",gap:14,marginBottom:8}}>
          <HyprLogo color="#FFFFFF" height={48}/>
          <span style={{color:"#3397B9",fontSize:22,fontWeight:300,letterSpacing:"0.08em",fontFamily:"'Urbanist',sans-serif"}}>Command</span>
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
  // Session persistence: restore user from localStorage if not expired (1h TTL)
  const SESSION_TTL_MS = 60 * 60 * 1000; // 1 hour
  const [user,setUser]=useState(()=>{
    try {
      const raw = localStorage.getItem("hypr_session");
      if (!raw) return null;
      const { user, expiresAt } = JSON.parse(raw);
      if (Date.now() > expiresAt) {
        localStorage.removeItem("hypr_session");
        return null;
      }
      // Re-publish so other parts of the app that read window.__hyprUser see it.
      window.__hyprUser = user;
      return user;
    } catch { return null; }
  });
  const [clients,setClients]=useState([]);
  const [clientsLoading,setClientsLoading]=useState(false);
  const [page,setPage]=useState(()=>{const h=window.location.hash.replace("#","");return ["home","monitor","tasks","checklist","checklist-center","proposals"].includes(h)?h:"home"});
  const navigate=(p)=>{setPage(p);window.location.hash=p};
  const [theme,setTheme]=useState(()=>{
    try{const saved=localStorage.getItem("hypr-theme");return saved==="light"||saved==="dark"?saved:"dark"}catch(e){return "dark"}
  });
  useEffect(()=>{try{localStorage.setItem("hypr-theme",theme)}catch(e){}},[theme]);
  const [collapsed,setCollapsed]=useState(false);
  const [mobileOpen,setMobileOpen]=useState(false);
  const [tasks,setTasks]=useState([]);
  const [submittedChecklists,setSubmittedChecklists]=useState([]);
  const [duplicateData,setDuplicateData]=useState(null);
  const [studies,setStudies]=useState([]);
  const [team,setTeam]=useState([]);
  const loadTeam=useCallback(()=>{
    fetch(`${BACKEND_URL}/team`).then(r=>r.json()).then(d=>{
      if(Array.isArray(d)) setTeam(d);
    }).catch(err=>console.error("Error fetching team:",err));
  },[]);
  useEffect(()=>{loadTeam();},[loadTeam]);
  const [notifs,setNotifs]=useState(INITIAL_NOTIFS);
  const [showNotifs,setShowNotifs]=useState(false);
  const notifRef=useRef();
  const [showUserMenu,setShowUserMenu]=useState(false);
  const userMenuRef=useRef();

  useEffect(()=>{document.documentElement.setAttribute("data-theme",theme)},[theme]);
  useEffect(()=>{const fn=e=>{if(notifRef.current&&!notifRef.current.contains(e.target))setShowNotifs(false)};document.addEventListener("mousedown",fn);return()=>document.removeEventListener("mousedown",fn)},[]);
  useEffect(()=>{const fn=e=>{if(userMenuRef.current&&!userMenuRef.current.contains(e.target))setShowUserMenu(false)};document.addEventListener("mousedown",fn);return()=>document.removeEventListener("mousedown",fn)},[]);
  useEffect(()=>{
    const fn=()=>{
      const u = window.__hyprUser;
      setUser(u);
      // Persist session in localStorage with expiration
      if (u) {
        try {
          localStorage.setItem("hypr_session", JSON.stringify({
            user: u,
            expiresAt: Date.now() + SESSION_TTL_MS,
          }));
        } catch {}
      }
    };
    window.addEventListener("hypr-login",fn);
    return()=>window.removeEventListener("hypr-login",fn);
  },[]);

  // Periodically check if the session expired (every 60s) and force re-login if so
  useEffect(()=>{
    if (!user) return;
    const check = ()=>{
      try {
        const raw = localStorage.getItem("hypr_session");
        if (!raw) return;
        const { expiresAt } = JSON.parse(raw);
        if (Date.now() > expiresAt) {
          localStorage.removeItem("hypr_session");
          window.__hyprUser = null;
          setUser(null);
        }
      } catch {}
    };
    const id = setInterval(check, 60_000);
    return ()=>clearInterval(id);
  },[user]);

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

    // Fetch studies from Cloud Function
    fetch(STUDIES_API_URL)
      .then(r=>r.json())
      .then(d=>{if(d.ok&&d.studies)setStudies(d.studies)})
      .catch(err=>console.error("Error fetching studies:",err));
  },[user]);

  // Generate notifications from real tasks
  useEffect(()=>{
    if(tasks.length===0) return;
    const n=[];
    const now=new Date();
    tasks.forEach(t=>{
      if(t.status==="entregue"||t.status==="completed") {
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

  const handleLogout=()=>{
    setUser(null);
    window.__hyprUser=null;
    try{localStorage.removeItem("hypr_session")}catch{}
    try{window.google.accounts.id.disableAutoSelect()}catch(e){}
  };

  if(!user) return <LoginScreen />;

  return(
    <AuthCtx.Provider value={user}>
    <ClientsCtx.Provider value={clients}>
    <StudiesCtx.Provider value={studies}>
    <TeamCtx.Provider value={{members:team,reload:loadTeam}}>
    <ThemeCtx.Provider value={{theme,setTheme}}>
    <ToastProvider>
      <style>{CSS}</style>
      <div className="app">
        {mobileOpen&&<div className="mob-ov vis" onClick={()=>setMobileOpen(false)}/>}

        {/* SIDEBAR */}
        <aside className={`sb${collapsed?" col":""}${mobileOpen?" mob":""}`}>
          <div className="sb-logo">
            {collapsed?(
              <svg viewBox="0 0 110 100" style={{height:28,width:"auto",display:"block"}} xmlns="http://www.w3.org/2000/svg">
                <text x="0" y="82" fontFamily="Urbanist, sans-serif" fontWeight="200" fontSize="100" letterSpacing="2" fill="#FFFFFF">H</text>
                <rect x="80" y="14" width="22" height="22" fill="#FFFFFF"/>
              </svg>
            ):(
              <div style={{display:"flex",alignItems:"center",gap:10}}>
                <HyprLogo color="#FFFFFF" height={22}/>
                <span style={{color:"var(--teal)",fontWeight:400,fontSize:12,letterSpacing:".08em",fontFamily:"var(--fd)"}}>Command</span>
              </div>
            )}
          </div>
          {!collapsed&&<div className="sb-lbl">Módulos</div>}
          <nav className="sb-nav" style={{padding:collapsed?"8px":"8px 10px"}}>
            {NAV.filter(n => {
              if(n.key==='proposals') return teamHasProposalAccess(team, user?.email) || hasProposalAccess(user?.email);
              if(n.key==='admin')     return teamIsAdmin(team, user?.email)         || isAdmin(user?.email);
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
              <span style={{fontFamily:"var(--fd)",fontSize:15,fontWeight:600,letterSpacing:"-0.2px",color:"var(--t1)"}}>{pageTitle}</span>
            </div>
            <div style={{display:"flex",alignItems:"center",gap:8}}>
              <div className="pill-live" style={{marginRight:4}}><span className="dot"></span>Atualizado agora</div>
              <button className="icn-btn" onClick={()=>setTheme(t=>t==="dark"?"light":"dark")} title={theme==="dark"?"Modo claro":"Modo escuro"}><I n={theme==="dark"?"sun":"moon"} s={15}/></button>
              <div style={{position:"relative"}} ref={notifRef}>
                <button className="icn-btn" onClick={()=>setShowNotifs(s=>!s)}>
                  <I n="bell" s={15}/>
                  {unread>0&&<span className="icn-btn-dot"/>}
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
              <div ref={userMenuRef} style={{position:"relative"}}>
                <button onClick={()=>setShowUserMenu(s=>!s)} title={`${user.name} — clique para opções`} style={{background:"transparent",border:"none",padding:0,cursor:"pointer",display:"block"}}>
                  {user.picture?<img src={user.picture} alt="" style={{width:34,height:34,borderRadius:"50%",flexShrink:0,display:"block"}}/>
                  :<div style={{width:34,height:34,background:"linear-gradient(135deg, var(--teal), #1a5f7a)",borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:700,color:"#fff",letterSpacing:".05em",flexShrink:0}}>{user.initials}</div>}
                </button>
                {showUserMenu&&(
                  <div style={{position:"absolute",top:"calc(100% + 8px)",right:0,minWidth:240,background:"var(--bg-card)",border:"1px solid var(--bdr-card)",borderRadius:"var(--r)",boxShadow:"var(--sh-lg)",overflow:"hidden",zIndex:100}}>
                    <div style={{padding:"14px 16px",borderBottom:"1px solid var(--bdr)"}}>
                      <div style={{fontSize:13,fontWeight:700,color:"var(--t1)"}}>{user.name}</div>
                      <div style={{fontSize:11,color:"var(--t3)",marginTop:2}}>{user.email}</div>
                    </div>
                    <button onClick={()=>{setShowUserMenu(false);handleLogout();}} style={{width:"100%",padding:"12px 16px",border:"none",background:"transparent",color:"var(--red)",fontSize:13,fontWeight:600,cursor:"pointer",display:"flex",alignItems:"center",gap:8,fontFamily:"inherit",textAlign:"left"}} onMouseEnter={e=>e.currentTarget.style.background="var(--bg3)"} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                      <I n="x" s={14} c="var(--red)"/>Sair
                    </button>
                  </div>
                )}
              </div>
            </div>
          </header>

          <div className="pg">
            {page==="home"&&<Dashboard checklists={submittedChecklists} tasks={tasks} onNav={navigate} />}
            {page==="tasks"&&<TaskCenter tasks={tasks} setTasks={setTasks} />}
            {page==="checklist"&&<CampaignChecklist initialData={duplicateData} onChecklistSubmit={(data)=>{setSubmittedChecklists(prev=>[{...data,id:data.id||Date.now(),created_at:new Date().toISOString()},...prev]);setDuplicateData(null)}} />}
            {page==="checklist-center"&&<ChecklistCenter checklists={submittedChecklists} setChecklists={setSubmittedChecklists} onDuplicate={(c)=>{setDuplicateData(c);navigate("checklist")}} />}
            {page==="proposals"&&(teamHasProposalAccess(team,user?.email)||hasProposalAccess(user?.email))&&<ProposalBuilder />}
            {page==="admin"&&(teamIsAdmin(team,user?.email)||isAdmin(user?.email))&&<AdminCenter />}
          </div>
        </div>
      </div>
    </ToastProvider>
    </ThemeCtx.Provider>
    </TeamCtx.Provider>
    </StudiesCtx.Provider>
    </ClientsCtx.Provider>
    </AuthCtx.Provider>
  );
}
