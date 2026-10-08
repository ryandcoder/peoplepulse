# PeoplePulse – Employee Attrition Analytics Dashboard

**PeoplePulse** is a full-stack HR analytics dashboard that explores *who leaves a company and what is associated with it*.
It takes a raw employee dataset through **data cleaning → SQL → statistical analysis → visualization → generated insights**
and presents the results in an interactive, filterable dashboard with dark mode and PDF export.

It is built as a **data analyst portfolio project**: the emphasis is on correct analysis and honest interpretation, not on machine learning.

**Live demo:** https://peoplepulse-henna.vercel.app *(the API runs on a free tier and may take a moment to wake up)*

---

## Business problem

Employee attrition is expensive: recruiting, onboarding and lost knowledge all add up, and unusually high turnover in a team can point to
workload, career-development or management issues. HR and management need to know:

- how many people are leaving, and where attrition is concentrated
- which working conditions, pay and career patterns are *associated* with leaving
- which employee groups have elevated attrition
- what HR could investigate to improve retention

## Dataset and credits

This project uses the **IBM HR Analytics Employee Attrition & Performance** dataset (≈1,470 employees, 35 columns).

> **Data source:** Pavan Subhash, *IBM HR Analytics Employee Attrition & Performance*, published on [Kaggle](https://www.kaggle.com/datasets/pavansubhasht/ibm-hr-analytics-attrition-dataset).
> **Created by:** IBM data scientists, as a fictional dataset for analytics practice.

- The data is **fictional**. It does not describe a real IBM workforce, and no conclusion here should be read as a statement about IBM or any real company.
- Full credit for the dataset goes to its creators and to the Kaggle provider above. Please refer to the licence and terms shown on the Kaggle dataset page if you reuse or redistribute it.
- This project is an independent work and is **not affiliated with or endorsed by IBM, Kaggle or the dataset provider**.

## What the dashboard answers

| Area | Questions |
|---|---|
| **Overall** | Attrition rate, employees who left / remain, departments and job roles with the highest attrition |
| **Compensation** | Income of leavers vs stayers, job level, income bands |
| **Work conditions** | Overtime, work-life balance, job satisfaction, environment satisfaction, business travel |
| **Career development** | Tenure, years since last promotion, years in role and with manager, total work history |
| **Employee characteristics** | Age, distance from home, gender, education |
| **Relationships** | Correlation of numeric variables with attrition |
| **Action** | Generated key findings, HR recommendations and high-attrition employee segments |

## Features

- **8 KPI cards** (employees, left, remaining, attrition rate, average income, tenure, satisfaction, age) – all calculated from the database
- **20+ charts**: donut, rate bars with employee counts, income distribution, career comparison, correlation chart
- **10 dashboard filters** (department, role, gender, overtime, travel, education, satisfaction, work-life balance, age group, tenure group) that update every KPI, chart and insight
- **Generated insights and recommendations** – computed from the data (and the active filters), never hard-coded
- **Employee segmentation** – two-factor groups with elevated attrition (minimum 20 employees)
- **Searchable, sortable, paginated employee table**
- **Data-quality report** – records, columns, missing values, duplicates, invalid values and every cleaning step
- **Dark theme** (soft slate-navy) and **PDF export** of the current view
- **Dockerised** – one command to run locally, plus a production setup with HTTPS

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | React, TypeScript, Vite, Tailwind CSS, Recharts |
| Backend | Python, FastAPI, Pandas, SciPy, SQLAlchemy |
| Database | PostgreSQL 16 |
| Infrastructure | Docker, Docker Compose, nginx, Caddy (HTTPS) |

```
React frontend  →  FastAPI + Pandas  →  PostgreSQL
```

## Analytical approach

1. **What happened?** Overall rates and counts.
2. **What patterns do we observe?** Group-level attrition rates across departments, roles, conditions and career stages.
3. **What is associated with attrition?** Correlations and group comparisons.
4. **What could HR investigate?** Recommendations tied to the findings.

Key methodology choices:

- **Cleaning without over-editing.** Missing values, duplicates, data types, numeric ranges, logical consistency (e.g. years in role ≤ years at company) and categories are checked. Valid data is left unchanged and issues are flagged. Constant columns (`EmployeeCount`, `Over18`, `StandardHours`) are dropped; grouped columns (age, tenure, distance, promotion, experience, income band) are derived and documented in the app.
- **Rates, not just counts.** Attrition rate = employees who left ÷ employees in the group, always displayed with group size.
- **Minimum group size of 20.** Smaller groups are flagged and excluded from rankings, insights and segments to avoid misleading percentages.
- **Cautious wording.** An insight only says "higher" or "lower" when the gap is at least 2 percentage points and 1.2×; otherwise it reports "similar".
- **Statistics.** Pearson r (point-biserial for a 0/1 outcome) and Spearman ρ with p-values for numeric variables; group-level rates for categorical variables.
- **Segmentation.** Pairs of department, job role, overtime, job satisfaction, age group and tenure group with at least 20 employees and an attrition rate above overall.

> **Correlation is not causation.** Every statement describes an observed association in this dataset. For example, a higher attrition rate among
> employees working overtime does not prove that overtime causes people to leave.

## Key findings

<!-- FINDINGS:START -->
**1,470 employees, 237 left → overall attrition rate 16.1%.**

| Department | Employees | Left | Attrition rate |
|---|---:|---:|---:|
| Sales | 446 | 92 | 20.6% |
| Human Resources | 63 | 12 | 19.0% |
| Research & Development | 961 | 133 | 13.8% |

| Job role | Employees | Left | Attrition rate |
|---|---:|---:|---:|
| Sales Representative | 83 | 33 | 39.8% |
| Laboratory Technician | 259 | 62 | 23.9% |
| Human Resources | 52 | 12 | 23.1% |
| Sales Executive | 326 | 57 | 17.5% |
| Research Scientist | 292 | 47 | 16.1% |
| Manufacturing Director | 145 | 10 | 6.9% |
| Healthcare Representative | 131 | 9 | 6.9% |
| Manager | 102 | 5 | 4.9% |
| Research Director | 80 | 2 | 2.5% |

| Overtime | Employees | Left | Attrition rate |
|---|---:|---:|---:|
| Works overtime | 416 | 127 | 30.5% |
| No overtime | 1,054 | 110 | 10.4% |

**Key findings (generated by the app's insight engine):**

- 237 of 1,470 employees (16.1%) left, while 1,233 remain.
- Sales has the highest observed attrition among departments (20.6%, n=446) compared with 16.1% overall.
- Job roles differ substantially: Sales Representative shows the highest observed attrition (39.8%, n=83) and Research Director the lowest (2.5%, n=80).
- Employees working overtime show a higher observed attrition rate (30.5%, n=416) than employees who do not work overtime (10.4%, n=1054). This is an association and does not show that overtime causes attrition.
- Employees reporting lower job satisfaction (1–2) show a higher observed attrition rate (19.7%, n=569) than those reporting higher satisfaction (3–4) (13.9%, n=901).
- Employees reporting lower work-life balance (1–2) show a higher observed attrition rate (19.6%, n=424) than those reporting higher work-life balance (3–4) (14.7%, n=1046).
- Employees reporting lower environment satisfaction (1–2) show a higher observed attrition rate (20.1%, n=571) than those reporting higher environment satisfaction (3–4) (13.6%, n=899).
- Employees who left had a lower median monthly income ($3,202) compared with those who stayed ($5,204); mean income was $4,787 vs $6,833. Income overlaps with job level and tenure, so this does not show that pay alone drives attrition.
- Employees with 0–2 years at the company show a higher observed attrition rate (29.8%, n=342) than employees with longer tenure (12.0%, n=1128).
- Among time-since-last-promotion groups, 6–10 years shows the highest observed attrition (18.1%, n=149) versus 16.1% overall.
- The Under 25 age group shows the highest observed attrition (39.2%, n=97) versus 16.1% overall.
- Employees living 21+ km from work show a higher observed attrition rate (22.1%, n=204) than employees living closer (15.2%, n=1266). Higher observed attrition is associated with the longer-distance group; this does not show that distance is the cause.
- Employees who travel frequently show a higher observed attrition rate (24.9%, n=277) than other employees (14.1%, n=1193).

**Highest-attrition segments (min. 20 employees):**

| Segment | Employees | Attrition rate |
|---|---:|---:|
| Overtime + Age Under 25 | 31 | 67.7% |
| Sales Representative + Overtime | 24 | 66.7% |
| Sales Representative + Age Under 25 | 23 | 56.5% |
| Sales + Age Under 25 | 27 | 51.9% |
| Overtime + 0–2 years tenure | 104 | 51.0% |

_All findings are observed associations, not proof of causation._
<!-- FINDINGS:END -->

## API

A small FastAPI service exposes the analysis (interactive docs at `/docs`):

`GET /api/dashboard · /attrition · /departments · /job-roles · /satisfaction · /compensation · /tenure · /insights · /employees · /filters`

All endpoints accept the dashboard filters as query parameters, e.g. `/api/attrition?department=Sales&overtime=Yes`.

## Quick start

```bash
# 1. Save the Kaggle CSV as data/employee_attrition.csv
# 2. Run everything (frontend + API + PostgreSQL)
docker compose up --build
```

Then open http://localhost:3000.

## Project structure

```
peoplepulse/
├── frontend/          React + TypeScript dashboard (components, charts, pages, services)
├── backend/app/       FastAPI app: api/ (routes, filters), analytics/ (cleaning, metrics, insights), database/ (loader)
├── data/              employee_attrition.csv (from Kaggle)
├── scripts/           SQL examples, data-quality report, findings generator
├── docs/SETUP.md      setup, run and deployment guide
├── docker-compose.yml / docker-compose.prod.yml / Caddyfile
└── README.md
```

## Limitations

- The dataset is a single, fictional snapshot: there is no time dimension, so trends and "time to leave" cannot be analysed.
- Observational associations only – no causal claims, and no control for confounding beyond what the filters allow.
- Some groups are small; they are marked in the charts and excluded from rankings.
- The dashboard has no authentication. It is intended for fictional demo data; add access control before using real HR data.

## Future improvements

- Attrition prediction (after the descriptive analysis is validated)
- Clustering-based employee segmentation
- Time-based HR data (trends, cohorts, survival analysis)
- Cost-of-attrition analysis
- CSV upload with schema validation

## Author

**Ryan Nabo** – [@ryandcoder](https://github.com/ryandcoder)

## Acknowledgements

- **Pavan Subhash** and **Kaggle** for hosting the dataset, and the **IBM data scientists** who created it.
- The open-source projects this app is built on: React, Vite, Tailwind CSS, Recharts, FastAPI, Pandas, SciPy, SQLAlchemy, PostgreSQL, Docker, nginx and Caddy.
