# IT and GST Filer Platform - Project Status

Last updated: 2026-06-17

## Current Goal

Build a website and backend platform for an IT/GST filing, accounting, company account handling, finance automation, and MIS reporting service business.

The platform should support:

- Public service website
- Lead capture
- Assisted onboarding for layman clients
- Detailed onboarding for clients who can submit information themselves
- Admin backend / CRM
- Client records and folders
- Document uploads by client or staff
- Filing due date tracking
- Automated reminders
- Marketing automation
- Finance automation and MIS report project tracking

## Current Stage

Phase 1 app foundation started.

Created a local-first Node.js MVP with:

- Static public website in `public/`
- Node standard-library backend in `server.js`
- Runtime JSON data store at `data/app.json`
- Public assisted callback form
- Public finance automation enquiry form
- Admin dashboard section
- Filing task creation form
- Generated hero image at `public/assets/finance-operations-hero.png`

`data/app.json` and uploaded files are ignored by git to avoid pushing future client data.

Latest frontend pass:

- Reworked the website into a stronger marketing/service page.
- Added a more engaging hero section with operational highlights.
- Added proof strip, audience pathways, finance automation showcase, and improved conversion sections.
- Kept existing lead, automation enquiry, admin dashboard, and filing task forms wired to the backend.
- Moved the admin workspace off the public homepage into `public/admin.html`.
- Added simple admin login at `public/login.html`.
- Protected admin page and internal APIs with an HTTP-only session cookie.
- Added lead status updates, internal lead notes, and lead-to-client conversion.

Current local admin password:

```text
admin123
```

This is only for the local MVP. Use `ADMIN_PASSWORD` in the environment before deploying.

## Key Product Direction

This should not be only a tax filing website. It should become a practical service operations platform for:

- Individuals needing ITR help
- GST-registered businesses
- Companies needing accounting support
- Businesses needing finance workflow automation
- Companies needing MIS reports and custom automated reporting

## Important Client Flows

### 1. Assisted / Layman Client Flow

Some clients should not be forced to fill long forms.

They can choose "Call Me" or "I Need Help" and provide only:

- Name
- Phone
- City
- Preferred language
- Preferred call time
- Basic service interest

The backend should then:

- Create a lead
- Mark it as assisted onboarding
- Create a call task for staff
- Allow staff to add details manually after a call
- Allow staff to upload files into the client folder

### 2. Self-Service Client Flow

Clients who know what they need can:

- Select a service
- Fill a detailed form
- Upload documents
- Track their filing status later through a client dashboard

### 3. Company Finance Automation Flow

Companies can request automation for:

- MIS reports
- Sales reports
- Purchase reports
- GST reconciliation
- TDS tracking
- P&L dashboards
- Cash flow dashboards
- Debtor/creditor ageing
- Bank statement processing
- Excel, Google Sheets, Power BI, or custom dashboards

These should be handled as project workflows, not only recurring tax tasks.

## Recommended Build Order

1. Create project structure and planning docs. Done.
2. Choose stack and scaffold application. In progress with local-first Node.js MVP.
3. Build public website pages and lead forms. In progress.
4. Build admin login and dashboard.
5. Add client records and client folder system.
6. Add manual staff uploads.
7. Add due date and filing task tracker.
8. Add automation project tracker.
9. Add reminder engine.
10. Add client login/dashboard.
11. Add email/WhatsApp/SMS integrations.
12. Add payment and advanced marketing automation.

## Open Decisions

- Final production tech stack
- Business name / brand name
- Exact services and packages
- Whether first MVP should be local-only or cloud-ready
- Whether WhatsApp automation should start with manual templates or full WhatsApp Business API
- Whether document storage should be local first or cloud object storage from day one

## Local Development

Run:

```powershell
npm start
```

Open:

```text
http://127.0.0.1:4173
```

Current MVP intentionally uses no external npm packages.

## Files To Read First When Resuming

1. `PROJECT_STATUS.md`
2. `docs/PROJECT_PLAN.md`
3. `docs/MVP_ROADMAP.md`
4. `docs/DATA_MODEL.md`
5. `docs/AUTOMATION_PLAN.md`
