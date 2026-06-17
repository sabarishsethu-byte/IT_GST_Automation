# MVP Roadmap

## MVP Objective

Build the smallest useful version that can run the service business operations:

- Capture leads
- Let layman clients request calls
- Let advanced clients submit documents
- Let admin manage clients and files
- Track due dates
- Track filing and automation work

## Phase 0 - Planning

Status: In progress

Deliverables:

- Project status file
- Product plan
- Data model draft
- Automation plan
- Initial roadmap

## Phase 1 - App Foundation

Status: In progress

Deliverables:

- Project scaffold: done
- Basic frontend: done
- Basic backend: done
- Database setup: local JSON runtime store created
- Environment configuration: minimal `PORT` support in `server.js`
- Admin authentication

Suggested stack:

- Frontend: React or Next.js
- Backend: FastAPI or Node/Express
- Database: PostgreSQL
- File storage: local first, cloud later

## Phase 2 - Public Website and Lead Capture

Status: Started

Deliverables:

- Home page: done
- Services pages
- Request a Call form: done
- Detailed onboarding form
- Finance automation enquiry form: done
- Lead storage in database: done with local JSON runtime store
- Admin notification placeholder: done as queued notification records

## Phase 3 - Admin CRM

Deliverables:

- Admin dashboard
- Lead list
- Lead detail page
- Convert lead to client
- Client list
- Client detail page
- Staff notes
- Basic task creation

## Phase 4 - Documents and Client Folder

Deliverables:

- Client folder view
- Staff manual upload
- Client upload placeholder
- Document categories
- File metadata
- Download/view file links

## Phase 5 - Due Dates and Filing Tasks

Deliverables:

- Filing task model
- Due date field
- Status tracking
- Upcoming due date dashboard
- Overdue dashboard
- Repeat schedule support

## Phase 6 - Finance Automation Project Tracker

Deliverables:

- Automation project model
- MIS/report request model
- Project stages
- Input file tracking
- Desired output tracking
- Delivery frequency

## Phase 7 - Reminder Engine

Deliverables:

- Reminder rules
- Due date reminders
- Missing document reminders
- Staff call reminders
- Reminder log
- Manual send first
- Email/WhatsApp API later

## Phase 8 - Client Portal

Deliverables:

- Client login
- Client profile
- Required document checklist
- Upload documents
- View filing status
- View due dates
- Download acknowledgements

## Phase 9 - Marketing Automation

Deliverables:

- Lead stages
- Follow-up sequences
- Campaign segments
- ITR season campaign templates
- GST due date campaign templates
- Review/referral request templates

## Build Principle

Start with workflow visibility and manual control. Then automate repeated work once the process is stable.
