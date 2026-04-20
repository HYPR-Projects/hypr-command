# HYPR Command

Plataforma integrada de operações Sales & Client Services da HYPR.

![HYPR Command](https://img.shields.io/badge/HYPR-Command-3397B9?style=for-the-badge&labelColor=1C262F)

## Módulos

| Módulo | Descrição |
|---|---|
| **Dashboard** | Visão executiva com KPIs, gráficos de investimento, pacing e tasks |
| **Campaign Monitor** | Acompanhamento de campanhas com pacing, CTR, VTR e features |
| **Task Center** | Solicitações de tasks para CS com SLA automático e notificação por e-mail |
| **Checklist** | Formulário pós-venda completo com volumetrias, features e inventário parceiro |
| **Checklist Center** | Visualização e edição de checklists enviados |

## Stack

| Camada | Tecnologia |
|---|---|
| Frontend | React 18 + Vite + Recharts |
| Backend | Node.js + Express |
| Banco de dados | Google BigQuery |
| Clientes (lookup) | Google Sheets API (Cloud Function) |
| E-mail | Nodemailer (Gmail SMTP) |
| Autenticação | Google OAuth 2.0 (restrito @hypr.mobi) |
| Deploy frontend | Netlify |
| Deploy backend | GCP Cloud Run |
| Deploy Cloud Function | GCP Cloud Functions (Gen2) |

## Estrutura do Repositório

```
hypr-command/
├── frontend/                  # React + Vite (Netlify)
│   ├── src/
│   │   ├── App.jsx           # Aplicação completa (single-file)
│   │   └── main.jsx          # Entry point
│   ├── public/
│   │   └── favicon.svg
│   ├── index.html
│   ├── vite.config.js
│   ├── netlify.toml
│   └── package.json
├── backend/                   # Express + BigQuery + Nodemailer (Cloud Run)
│   ├── index.js              # API completa com email templates
│   ├── .env.example          # Variáveis de ambiente
│   └── package.json
├── cloud-functions/           # Google Cloud Functions
│   └── clients/              # Lookup de clientes via Google Sheets
│       ├── index.js
│       └── package.json
└── README.md
```

## URLs de Produção

| Serviço | URL |
|---|---|
| Frontend | https://hypr-command.netlify.app |
| Backend API | https://hypr-command-backend-453955675457.southamerica-east1.run.app |
| Cloud Function (Clientes) | https://southamerica-east1-site-hypr.cloudfunctions.net/hypr-command-clients |

## Setup Local

### Frontend

```bash
cd frontend
npm install
npm run dev
# Acesse http://localhost:5173
```

### Backend

```bash
cd backend
npm install
cp .env.example .env
# Edite .env com suas credenciais
# Coloque service-account.json na pasta
npm run dev
```

### Cloud Function (Clientes)

```bash
cd cloud-functions/clients
npm install
# Para deploy:
gcloud functions deploy hypr-command-clients \
  --gen2 --runtime=nodejs20 --trigger-http \
  --allow-unauthenticated --region=southamerica-east1 \
  --entry-point=clients --project=site-hypr
```

## Deploy

### Frontend → Netlify

```bash
cd frontend
npm run build
# Arraste a pasta dist/ para o Netlify
```

### Backend → Cloud Run

```bash
cd backend
gcloud run deploy hypr-command-backend \
  --source=. --platform=managed \
  --region=southamerica-east1 \
  --allow-unauthenticated --project=site-hypr
```

## BigQuery — Tabelas

| Tabela | Descrição |
|---|---|
| `tasks` | Tasks abertas/concluídas com SLA, CS, briefing e doc link |
| `checklists` | Formulários pós-venda completos com volumetrias e features |
| `campaigns` | Campanhas com pacing, CTR, VTR e features |

Para criar as tabelas:
```bash
curl -X POST https://hypr-command-backend-453955675457.southamerica-east1.run.app/setup
```

## Notificações por E-mail

### Task
- **Task criada** → CP (solicitante) + CS responsável recebem e-mail com briefing e prazo
- **Task concluída** → Solicitante recebe e-mail com link do documento

### Checklist
- **Checklist enviado** → CP + CS responsável recebem e-mail com resumo completo

## Google Sheets — Base de Clientes

A base de clientes é mantida em uma Google Sheet com as colunas:
- Agência | Cliente | CP Atual | Email CP | CS Atual | Email CS

Ao selecionar um cliente no formulário, o sistema auto-preenche Agência, CS e Email CS.

## Autenticação

Login via Google OAuth restrito a contas `@hypr.mobi`. O usuário logado é automaticamente identificado como CP (solicitante) em tasks e checklists.

## Links Rápidos (Sidebar)

- [Report Hub](https://report.hypr.mobi)
- [Sales Management](https://sales-manager-murex.vercel.app)

---

**HYPR Command v2.0** — Built for HYPR MediaBrands
