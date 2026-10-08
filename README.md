# PeoplePulse – Employee Attrition Analytics Dashboard

PeoplePulse loads the IBM HR Analytics dataset into PostgreSQL, cleans and validates it with Pandas, and serves the
analysis through a FastAPI backend to a React dashboard.
Flow: **Data → Cleaning → SQL → Analysis → Visualization → Insights.**

```
React frontend  →  FastAPI + Pandas  →  PostgreSQL
 (port 3000)         (port 8000)        (port 5433 on your machine)
```

> The dataset is **fictional**, created by IBM data scientists for analytics practice. It does not represent a real workforce.

---

## Table of contents
1. [What you need](#1-what-you-need)
2. [Get the project](#2-get-the-project)
3. [Download the dataset](#3-download-the-dataset)
4. [Configure environment variables (optional)](#4-configure-environment-variables-optional)
5. [Start the application](#5-start-the-application)
6. [Open the dashboard](#6-open-the-dashboard)
7. [Verify it works](#7-verify-it-works)
8. [Dark theme and PDF export](#8-dark-theme-and-pdf-export)
9. [Fill in the README findings](#9-fill-in-the-readme-findings-optional)
10. [Stop, restart and reset](#10-stop-restart-and-reset)
11. [Run without Docker (development mode)](#11-run-without-docker-development-mode)
12. [Deploying PeoplePulse](#12-deploying-peoplepulse)
13. [Troubleshooting](#13-troubleshooting)
14. [Project structure](#14-project-structure)
15. [Project background](#15-project-background)

---

## 1. What you need

| Tool | Why | Check it is installed |
|---|---|---|
| **Docker Desktop** (Windows/macOS) or **Docker Engine + Compose plugin** (Linux) | Runs the frontend, backend and database | `docker --version` and `docker compose version` |
| **Git** (optional) | Only if you clone the repo instead of unzipping | `git --version` |
| A free **Kaggle account** | To download the dataset | – |

You do **not** need Python, Node.js or PostgreSQL installed to run the project with Docker.

Make sure **Docker Desktop is open and running** (the whale icon should say "Docker Desktop is running") before continuing.

Free ports needed on your machine: **3000** (dashboard), **8000** (API), **5433** (database).

## 2. Get the project

**Option A – unzip:** extract `peoplepulse.zip` somewhere, e.g. `C:\Projects\peoplepulse` or `~/projects/peoplepulse`.

**Option B – Git:**
```bash
git clone <your-repo-url> peoplepulse
```

Then open a terminal (PowerShell, Terminal, or your editor's terminal) **inside the project folder**:
```bash
cd peoplepulse
```
You should see `docker-compose.yml` when you list the folder (`dir` on Windows, `ls` on macOS/Linux).

## 3. Download the dataset

The dataset is not included in the repository.

1. Go to Kaggle and search for **"IBM HR Analytics Employee Attrition & Performance"**
   (https://www.kaggle.com/datasets/pavansubhasht/ibm-hr-analytics-attrition-dataset).
2. Sign in and click **Download**. Unzip the download.
3. You will get a file named `WA_Fn-UseC_-HR-Employee-Attrition.csv`.
4. Copy it into the project's `data/` folder and **rename it exactly** to:

```
data/employee_attrition.csv
```

Your folder should now look like this:
```
peoplepulse/
└── data/
    ├── README.md
    └── employee_attrition.csv   ← the file you just added
```

Quick check (optional): the file should have 1,471 lines (a header + 1,470 employees).
```bash
# macOS / Linux
wc -l data/employee_attrition.csv
# Windows PowerShell
(Get-Content data\employee_attrition.csv).Count
```

## 4. Configure environment variables (optional)

The project works out of the box with default credentials. To use your own:

```bash
# macOS / Linux
cp .env.example .env
# Windows PowerShell
copy .env.example .env
```

Then edit `.env`:

| Variable | Default | Meaning |
|---|---|---|
| `POSTGRES_USER` | `peoplepulse` | Database user |
| `POSTGRES_PASSWORD` | `peoplepulse_dev` (the example file suggests `change_me`) | Database password – change it if you publish or share the project |
| `POSTGRES_DB` | `peoplepulse` | Database name |
| `RELOAD_ON_START` | `true` | Re-clean and reload the CSV into PostgreSQL every time the backend starts |

The file also holds `DOMAIN` (only used for production, see [section 12](#12-deploying-peoplepulse)).

`.env` is listed in `.gitignore`, so your credentials are never committed.

> If you change the database user/password **after** the first run, reset the database volume (see [section 10](#10-stop-restart-and-reset)), because PostgreSQL only reads these values the first time it creates its data.

## 5. Start the application

From the project folder, run:

```bash
docker compose up --build
```

What happens (the first run takes a few minutes while images download and build):

1. **db** – PostgreSQL 16 starts and becomes healthy.
2. **backend** – installs Python packages, waits for the database, then **cleans the CSV with Pandas and loads it into the `employees` table**.
3. **frontend** – builds the React app and serves it with nginx. It only starts after the backend reports healthy.

Wait until you see log lines like these (exact wording may vary):
```
backend-1   | INFO:peoplepulse:Loaded 1470 employees into PostgreSQL
backend-1   | INFO:     Uvicorn running on http://0.0.0.0:8000
frontend-1  | ... ready for start up
```

Leave this terminal open – it shows the logs. To run in the background instead, use `docker compose up --build -d`.

## 6. Open the dashboard

| What | URL |
|---|---|
| **Dashboard** | http://localhost:3000 |
| API documentation (Swagger) | http://localhost:8000/docs |
| API health check | http://localhost:8000/health |

## 7. Verify it works

Work through this checklist:

1. **Health check** – open http://localhost:8000/health. You should see `{"status":"ok","data_error":null}`.
   If `data_error` has text, see [Troubleshooting](#13-troubleshooting).
2. **KPI cards** – the dashboard should show about **1,470** total employees, **237** who left and an attrition rate of about **16.1%**.
3. **Charts** – scroll through Overview, Work conditions, Compensation, Career, Employees and Relationships; every chart should render.
4. **Filters** – pick *Overtime → Works overtime*; the KPIs and charts should update. Click **Reset Filters** to restore them.
5. **Employee table** – scroll to *Employee data*, type a department or employee number in the search box, click a column header to sort, and use Previous/Next.
6. **Data quality** – at the bottom you should see 1,470 records, 0 missing values and 0 duplicate records (35 columns in the original file).
7. **API** – try http://localhost:8000/api/dashboard in the browser, or in a terminal:
   ```bash
   curl "http://localhost:8000/api/attrition?overtime=Yes"
   ```
8. **Database** (optional) – connect any SQL client (DBeaver, pgAdmin, `psql`) to host `localhost`, port **5433**, database/user `peoplepulse`, and run the queries in `scripts/queries.sql`.

## 8. Dark theme and PDF export

**Dark theme**
1. Click the **sun / moon button** in the top-right of the header to switch between light and dark.
2. The first visit follows your operating-system setting. After that your choice is remembered in your browser.
3. The dark theme uses a soft slate-navy palette (not pure black) and all charts adapt to it.

**Export the dashboard to PDF**
1. (Optional) Set the filters you want first – the PDF contains exactly what is on screen, and the active filters are printed in the report header.
2. Click **Export PDF** in the header. For about a second the page switches to a light, A4-width layout (a banner says "Preparing PDF…"). This happens even in dark mode so the PDF is print-friendly.
3. The browser's print dialog opens. Set **Destination** to **Save as PDF**.
4. If colours or chart backgrounds are missing, open **More settings** and tick **Background graphics**. Keep **Scale** at 100% (or Default) and **Margins** at Default.
5. Click **Save**. The file name suggestion is `PeoplePulse-Attrition-Report-<date>`.
6. The dashboard returns to your previous theme when the dialog closes.

What the PDF contains: report title, date, active filters, KPI cards, every chart and insight, recommendations, segments and the data-quality summary. It leaves out navigation, filter controls and the interactive employee table. Pressing `Ctrl/Cmd + P` uses the same print styles. Chrome and Edge give the best results.

## 9. Fill in the README findings (optional)

The **Findings** section below is generated from your real data so it never contains made-up numbers.

```bash
pip install pandas numpy scipy
python scripts/generate_findings.py            # prints the findings
python scripts/generate_findings.py --write    # writes them into this README
```

You can also print the data-quality summary without starting Docker:
```bash
python scripts/data_quality_report.py data/employee_attrition.csv
```

## 10. Stop, restart and reset

| Goal | Command |
|---|---|
| Stop (press in the logs terminal) | `Ctrl + C` |
| Stop background containers, keep data | `docker compose down` |
| Start again (no rebuild needed) | `docker compose up` |
| Rebuild after changing code | `docker compose up --build` |
| **Full reset** (also deletes the database volume) | `docker compose down -v` |
| View logs of one service | `docker compose logs -f backend` |

**Replaced the CSV?** Just restart (`docker compose restart backend`) – with `RELOAD_ON_START=true` the data is cleaned and reloaded automatically.

## 11. Run without Docker (development mode)

Use this if you want hot-reload while editing code. You need **Python 3.12+** and **Node.js 20+**.

**Step 1 – start only the database in Docker**
```bash
docker compose up -d db
```

**Step 2 – run the backend** (new terminal)
```bash
cd backend
python -m venv .venv

# activate the virtual environment
#   macOS/Linux:   source .venv/bin/activate
#   Windows:       .venv\Scripts\Activate.ps1

pip install -r requirements.txt
```
Set the environment variables, then start the server:
```bash
# macOS / Linux
export POSTGRES_HOST=localhost POSTGRES_PORT=5433 DATA_PATH=../data/employee_attrition.csv
# Windows PowerShell
$env:POSTGRES_HOST="localhost"; $env:POSTGRES_PORT="5433"; $env:DATA_PATH="..\data\employee_attrition.csv"

uvicorn app.main:app --reload
```
(Add `POSTGRES_USER`, `POSTGRES_PASSWORD` and `POSTGRES_DB` too if you changed them in `.env`.)

**Step 3 – run the frontend** (another terminal)
```bash
cd frontend
npm install
npm run dev
```
Open http://localhost:5173. The dev server proxies `/api` requests to the backend on port 8000.

Optional type check: `npm run typecheck`.

## 12. Deploying PeoplePulse

PeoplePulse has three parts (frontend, API, PostgreSQL), so it needs a host that can run containers or a database.
Pick **one** of the two options below.

| | Option A – one server (VPS) | Option B – Render + Vercel |
|---|---|---|
| How | The same Docker Compose stack on a Linux server, with automatic HTTPS | API + PostgreSQL on Render, static frontend on Vercel |
| Pros | Simple, identical to local, you control everything | No server maintenance, deploys on every `git push` |
| Cons | You manage the server and updates | Free tiers can sleep or expire – check each provider's current limits |

### 12.0 Before you deploy (both options)
1. **The dataset must be available at build time.** The backend image bundles `data/employee_attrition.csv`, so the file has to be in the folder/repo you deploy from. Check the dataset's licence on Kaggle before pushing it to a *public* repository; use a private repo if unsure.
   Confirm with `git ls-files data` – it should list `data/employee_attrition.csv`.
2. **Never commit `.env`** (it is already in `.gitignore`).
3. **There is no login.** That is fine for this fictional demo dataset. If you ever load real HR data, put authentication in front of the dashboard first.
4. Test locally first: `docker compose up --build` must work (section 5).

### Option A – Single server with Docker Compose and HTTPS

Uses `docker-compose.prod.yml` and `Caddyfile`. Only ports 80/443 are exposed; the database and API stay on the internal Docker network, and Caddy gets a free HTTPS certificate automatically.

**Step 1 – Create a server.** Any provider works (DigitalOcean, Hetzner, AWS Lightsail, Oracle Cloud, …). Choose Ubuntu 22.04 or 24.04 with at least 1 GB RAM (2 GB is more comfortable). Note its public IP address.

**Step 2 – Point your domain at it.** At your domain registrar/DNS provider, create an **A record**: `dashboard.example.com` → your server's IP. Wait a few minutes for DNS to update (`ping dashboard.example.com` should show your IP).

**Step 3 – Connect and install Docker.**
```bash
ssh root@YOUR_SERVER_IP          # or your user
curl -fsSL https://get.docker.com | sh
docker compose version           # should print a version
```

**Step 4 – Open the firewall** (allow SSH first, or you will lock yourself out):
```bash
ufw allow OpenSSH
ufw allow 80
ufw allow 443
ufw enable
```
If your provider has its own cloud firewall, also allow TCP 22, 80 and 443 there.

**Step 5 – Get the code onto the server.**
```bash
git clone <your-repo-url> peoplepulse
cd peoplepulse
```
If the CSV is not in your repo, copy it from your computer instead (run this on **your computer**):
```bash
scp data/employee_attrition.csv root@YOUR_SERVER_IP:~/peoplepulse/data/
```

**Step 6 – Configure.**
```bash
cp .env.example .env
nano .env
```
Set a **strong `POSTGRES_PASSWORD`** and set `DOMAIN=dashboard.example.com` (no `https://`, no trailing slash). Save with `Ctrl+O`, `Enter`, exit with `Ctrl+X`.

**Step 7 – Start.**
```bash
docker compose -f docker-compose.prod.yml up -d --build
```

**Step 8 – Check.**
```bash
docker compose -f docker-compose.prod.yml ps          # all services "running" / "healthy"
docker compose -f docker-compose.prod.yml logs -f caddy backend
```
Open `https://dashboard.example.com`. The first load may take a minute while the certificate is issued. Also check `https://dashboard.example.com/api/dashboard`.

**Updating later**
```bash
cd peoplepulse
git pull
docker compose -f docker-compose.prod.yml up -d --build
```

**Backup (optional).** The data can always be rebuilt from the CSV, but to dump the database:
```bash
docker compose -f docker-compose.prod.yml exec db pg_dump -U peoplepulse peoplepulse > backup.sql
```

### Option B – Render (API + PostgreSQL) and Vercel (frontend)

Menu names on these sites change occasionally; the idea stays the same.

**Step 1 – Push the project to GitHub** (including `data/employee_attrition.csv`, see 12.0).

**Step 2 – Create the database on Render.**
1. Render dashboard → **New +** → **PostgreSQL**.
2. Give it a name, choose a **region** (use the same region for the API), pick a plan, **Create Database**.
3. When it is ready, copy the **Internal Database URL** from its page.

**Step 3 – Create the API on Render.**
1. **New +** → **Web Service** → connect your GitHub repository.
2. Set **Language / Runtime** to **Docker**.
3. **Dockerfile Path:** `./backend/Dockerfile`. Leave the **Docker build context / root directory** as the repository root (it must be the root so the `data/` folder is included).
4. Same region as the database.
5. Add **Environment Variables**:

   | Key | Value |
   |---|---|
   | `DATABASE_URL` | the Internal Database URL from Step 2 |
   | `RELOAD_ON_START` | `true` |
   | `CORS_ORIGINS` | `*` for now (you will lock it down in Step 5) |

6. Set **Health Check Path** to `/health`, then **Create Web Service**.
7. When the deploy finishes, open `https://<your-service>.onrender.com/health` – you should see `{"status":"ok","data_error":null}` – and `https://<your-service>.onrender.com/api/dashboard` should return the KPIs. Copy the service URL.

**Step 4 – Deploy the frontend on Vercel.**
1. Vercel → **Add New… → Project** → import the same GitHub repository.
2. Set **Root Directory** to `frontend`. The framework preset should be detected as **Vite** (build command `npm run build`, output directory `dist`).
3. Under **Environment Variables** add `VITE_API_URL` = your Render service URL, e.g. `https://peoplepulse-api.onrender.com` (**no trailing slash and no `/api`**).
4. **Deploy**, then open the Vercel URL.

**Step 5 – Lock down CORS.** In the Render service → **Environment**, change `CORS_ORIGINS` to your Vercel URL, e.g. `https://peoplepulse.vercel.app` (add a custom domain too if you have one, separated by a comma). Save – Render redeploys.

**Step 6 – Test.** Open the Vercel URL, check the KPI cards, try a filter, switch the theme and export a PDF.

**Updating later:** push to your main branch – both Render and Vercel redeploy automatically.

**Good to know**
- On free plans the API may "sleep" when idle, so the first request after a pause can take a while and the dashboard may briefly show a loading/error state. Free-tier limits (including how long a free database lasts) change – check each provider's pricing page.
- The same pattern works on other hosts (Railway, Fly.io, Koyeb, Netlify, …): run `backend/Dockerfile` with `DATABASE_URL` + `CORS_ORIGINS`, and host the built `frontend/` anywhere static with `VITE_API_URL` set.
- `VITE_API_URL` is baked in at **build time** – after changing it, redeploy the frontend.

### Environment variable reference

| Variable | Used by | Purpose |
|---|---|---|
| `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB` | db, backend (Compose) | Database credentials |
| `POSTGRES_HOST`, `POSTGRES_PORT` | backend | Set by Compose (`db`, `5432`); override for local dev |
| `DATABASE_URL` | backend | Full connection string (managed databases). If set it replaces the `POSTGRES_*` values |
| `DATA_PATH` | backend | CSV location (default `/app/data/employee_attrition.csv`; Compose mounts `./data` at `/data`) |
| `RELOAD_ON_START` | backend | `true` = clean and reload the CSV on every start |
| `CORS_ORIGINS` | backend | Comma-separated allowed browser origins (`*` = any) |
| `PORT` | backend | Injected by hosts such as Render (default 8000) |
| `DOMAIN` | Caddy / prod compose | Public domain for HTTPS |
| `VITE_API_URL` | frontend (build time) | API base URL when it is on a different domain; empty = same origin |

## 13. Troubleshooting

| Problem | Cause and fix |
|---|---|
| `Cannot connect to the Docker daemon` / `docker: command not found` | Docker Desktop is not running or not installed. Start it and wait until it says it is running. |
| Dashboard shows **"Could not load data. Dataset not found at /data/employee_attrition.csv…"** | The CSV is missing or misnamed. Check it is exactly `data/employee_attrition.csv`, then `docker compose restart backend`. |
| `Missing required columns: …` in backend logs | The CSV does not match the IBM schema (e.g. wrong file or edited headers). Re-download the original file. |
| `port is already allocated` / `address already in use` | Another program uses port 3000, 8000 or 5433. Stop it, or change the left-hand number in `docker-compose.yml`, e.g. `"3001:80"`. |
| Frontend container never starts | It waits for the backend health check. Run `docker compose logs backend` to see the real error. |
| `password authentication failed for user` | You changed credentials after the database was created. Run `docker compose down -v` and start again. |
| Dashboard shows old numbers after replacing the CSV | Ensure `RELOAD_ON_START=true`, then `docker compose restart backend`. |
| Blank page or an old version of the dashboard | Hard refresh (`Ctrl+Shift+R`), or rebuild with `docker compose up --build`. |
| Build fails during `npm install` or `pip install` | Usually a network problem. Check your internet connection and retry. |
| Browser console: **CORS error** after deploying | `CORS_ORIGINS` must exactly match the page's origin, including `https://` and with no trailing slash. Update it and redeploy the API. |
| Deployed dashboard says **Failed to fetch** / calls the wrong URL | `VITE_API_URL` is missing or wrong (no trailing slash, no `/api`). It is applied at build time, so redeploy the frontend after fixing it. |
| Render logs: `Dataset not found at /app/data/employee_attrition.csv` | The CSV was not in the repository/build. Commit it (`git ls-files data`) and redeploy. |
| Render: build fails to find `backend/Dockerfile` or `data` | Dockerfile path must be `./backend/Dockerfile` and the build context the repository **root**. |
| VPS: HTTPS certificate is not issued | DNS A record not pointing at the server yet, or ports 80/443 blocked by the firewall. Check `docker compose -f docker-compose.prod.yml logs caddy`. |
| `Set POSTGRES_PASSWORD in .env` / `Set DOMAIN in .env` when starting the prod stack | Create `.env` from `.env.example` and fill in those values. |
| PDF export has no colours or looks cut off | In the print dialog tick **Background graphics**, keep scale at 100%, and use Chrome/Edge. |
| Windows: slow or failing builds | Make sure Docker Desktop uses the WSL 2 backend and the project is not inside a restricted/synced folder. |

Still stuck? Run `docker compose logs` and read the last error lines of each service.

## 14. Project structure

```
peoplepulse/
├── frontend/                 React + TypeScript + Vite + Tailwind + Recharts (served by nginx)
│   └── src/  components/  charts/  pages/  services/   (theme.tsx = dark mode + PDF export)
├── backend/                  FastAPI + Pandas
│   └── app/
│       ├── main.py           app startup (waits for DB, loads data)
│       ├── api/              routes, filters → SQL WHERE clauses
│       ├── analytics/        cleaning, metrics, insights, segments
│       └── database/         connection and CSV → PostgreSQL loader
├── data/                     employee_attrition.csv (you add this)
├── scripts/                  queries.sql, data_quality_report.py, generate_findings.py
├── docker-compose.yml        local stack
├── docker-compose.prod.yml   production stack for a VPS (with HTTPS)
├── Caddyfile                 reverse proxy / automatic HTTPS
├── .env.example
└── README.md
```

**API endpoints:** `GET /api/dashboard · /attrition · /departments · /job-roles · /satisfaction · /compensation · /tenure · /insights · /employees · /filters`.
Filters are query parameters: `department, job_role, gender, overtime, business_travel, education, job_satisfaction, work_life_balance, age_group, tenure_group`
(e.g. `/api/attrition?department=Sales&overtime=Yes`).

## 15. Project background

**Business problem.** Attrition is costly (recruiting, onboarding, lost knowledge) and can signal workload, career-development or management issues. HR needs to know how much attrition there is, where it concentrates and what is associated with it.

**Questions investigated.** Overall rate; departments and roles; income and job level; overtime; work-life balance; job and environment satisfaction; tenure; time since promotion; time in role; work history; age; business travel; distance from home; most affected groups.

**Tech stack.** React, TypeScript, Vite, Tailwind CSS, Recharts · Python, FastAPI, Pandas, SciPy · PostgreSQL 16 · Docker Compose.

**Analytics methodology.**
- *Cleaning:* checks missing values, duplicates, types, ranges, logical consistency and categories. Valid data is not altered; issues are flagged. Constant columns (`EmployeeCount`, `Over18`, `StandardHours`) are dropped; column names become snake_case; `attrition_flag` and grouped columns (age, tenure, distance, promotion, experience, income band) are added. All steps are shown in the *Data quality* section.
- *Attrition rate* = employees who left ÷ employees in the group, always shown with group size. Groups with **fewer than 20 employees** are flagged and excluded from rankings, insights and segments.
- *Groups:* age (Under 25, 25–34, 35–44, 45–54, 55+); tenure (0–2, 3–5, 6–10, 11–20, 21+ years); distance (0–5, 6–10, 11–20, 21+ km); years since promotion (0–2, 3–5, 6–10, 11+).
- *Numeric relationships:* Pearson r (point-biserial for a 0/1 outcome) and Spearman ρ with p-values. Categorical variables are compared with group-level attrition rates.
- *Insights* only say "higher" or "lower" when the gap is at least 2 percentage points and 1.2×; otherwise "similar". *Recommendations* appear only for elevated findings and cite the finding they rely on.
- *Segmentation:* pairs of Department, Job role, Overtime, Job satisfaction, Age group and Tenure group with at least 20 employees and a rate above overall.

> **Correlation is not causation.** Every statement describes an observed association in this dataset, not a proven cause.

### Findings
<!-- FINDINGS:START -->
_Not generated yet. After adding the CSV, run `python scripts/generate_findings.py --write` (see section 9) to fill this section with the real results._
<!-- FINDINGS:END -->

### Recommendations
The dashboard's **HR Recommendations** panel derives suggestions from the calculated findings (e.g. review workload and overtime patterns where overtime shows higher observed attrition; investigate early-tenure retention where short tenure shows higher attrition). They are starting points for investigation, not predictions of impact.

### Future improvements
- Attrition prediction (after the descriptive analysis is trusted)
- Employee segmentation (clustering)
- Time-based HR data (trends, cohorts, survival analysis)
- Cost-of-attrition analysis
- Optional CSV upload with schema validation
