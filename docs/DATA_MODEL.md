# Data Model Draft

This is a first draft. Names can change during implementation.

## Users

Represents admins, staff, and later clients.

Fields:

- id
- name
- email
- phone
- password_hash
- role: admin, staff, client
- status
- created_at
- updated_at

## Leads

Represents enquiries before conversion to client.

Fields:

- id
- name
- phone
- email
- city
- preferred_language
- preferred_call_time
- service_interest
- lead_source
- onboarding_type: assisted, self_service
- status: new, call_required, contacted, quote_sent, converted, lost
- notes
- assigned_to_user_id
- created_at
- updated_at

## Clients

Represents individuals, firms, and companies.

Fields:

- id
- client_type: individual, proprietor, partnership, company, llp, trust, other
- display_name
- legal_name
- trade_name
- phone
- email
- city
- state
- pan
- aadhaar_last4
- gstin
- cin
- onboarding_type: assisted, self_service
- status: active, inactive, archived
- assigned_to_user_id
- created_from_lead_id
- created_at
- updated_at

## ClientContacts

For company clients with multiple people.

Fields:

- id
- client_id
- name
- role_title
- phone
- email
- is_primary
- created_at
- updated_at

## Services

Service catalog.

Fields:

- id
- name
- category: income_tax, gst, accounting, compliance, finance_automation, mis_reporting
- description
- is_recurring
- default_frequency
- active

## ClientServices

Services subscribed/requested by a client.

Fields:

- id
- client_id
- service_id
- status: active, paused, completed, cancelled
- start_date
- end_date
- price
- billing_frequency
- notes

## Documents

File metadata for uploaded documents.

Fields:

- id
- client_id
- uploaded_by_user_id
- document_category: kyc, income_tax, gst, accounting, bank_statement, filed_return, acknowledgement, mis_report, automation_project, other
- original_filename
- stored_path
- mime_type
- file_size
- service_period
- tags
- notes
- created_at

## FilingTasks

Tracks tax/compliance return work.

Fields:

- id
- client_id
- service_id
- return_type: itr, gstr_1, gstr_3b, cmp_08, tds, roc, accounting_close, other
- period_start
- period_end
- due_date
- status: not_started, documents_pending, in_progress, filed, completed, overdue, cancelled
- assigned_to_user_id
- filed_date
- acknowledgement_document_id
- notes
- created_at
- updated_at

## DueDateRules

Editable rules used to create filing tasks.

Fields:

- id
- service_id
- return_type
- frequency: monthly, quarterly, yearly, one_time
- default_day
- default_month
- grace_days
- active
- notes

## Tasks

General operational tasks.

Fields:

- id
- client_id
- lead_id
- title
- description
- task_type: call, document_followup, filing, payment, project, internal
- due_at
- status: open, in_progress, done, cancelled
- assigned_to_user_id
- created_by_user_id
- created_at
- updated_at

## AutomationProjects

Tracks finance automation and MIS work.

Fields:

- id
- client_id
- project_name
- project_type: mis_report, excel_automation, google_sheets, power_bi, custom_dashboard, reconciliation, other
- current_process_summary
- data_sources
- desired_output
- frequency: one_time, daily, weekly, monthly, quarterly
- tool_preference
- status: discovery, sample_data_pending, quote_sent, approved, in_development, testing, delivered, maintenance, cancelled
- assigned_to_user_id
- quoted_amount
- start_date
- target_delivery_date
- delivered_date
- notes
- created_at
- updated_at

## Payments

Tracks fees and payment status.

Fields:

- id
- client_id
- service_id
- automation_project_id
- amount
- currency
- status: pending, paid, partial, overdue, cancelled
- due_date
- paid_date
- payment_method
- reference
- notes

## Notifications

Logs reminders and messages.

Fields:

- id
- client_id
- lead_id
- task_id
- channel: email, whatsapp, sms, phone, internal
- template_name
- subject
- message
- status: queued, sent, failed, skipped
- scheduled_at
- sent_at
- error_message

## ActivityLogs

Audit trail for important actions.

Fields:

- id
- actor_user_id
- client_id
- lead_id
- entity_type
- entity_id
- action
- metadata_json
- created_at

