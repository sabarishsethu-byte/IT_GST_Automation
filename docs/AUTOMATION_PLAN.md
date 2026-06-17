# Automation Plan

## Automation Philosophy

Automate repeated, predictable actions while keeping admin control for sensitive tax and finance workflows.

The first version should log reminders and prepare messages. Later versions can send through email, WhatsApp, and SMS APIs.

## Lead Automations

### New Assisted Lead

Trigger:

- User submits "Request a Call" form.

Actions:

- Create lead.
- Set onboarding type to assisted.
- Set status to call_required.
- Create call task for staff.
- Send confirmation message to client.
- Notify admin.

### New Self-Service Lead

Trigger:

- User submits detailed onboarding form.

Actions:

- Create lead.
- Store submitted details.
- Create document checklist.
- Notify admin.
- Send thank-you and next steps.

### Lead Follow-Up

Trigger:

- Lead not converted after configured days.

Actions:

- Send follow-up message.
- Create staff follow-up task.
- Move stale leads into cold lead segment.

## Client Onboarding Automations

### Lead Converted To Client

Actions:

- Create client profile.
- Copy lead details.
- Create default client folder categories.
- Assign services.
- Create initial tasks.
- Create due date schedule if service is recurring.
- Send welcome message.

### Documents Missing

Trigger:

- Required documents not uploaded before task due date.

Actions:

- Remind client.
- Flag admin dashboard.
- Create follow-up task for staff.

## Filing Due Date Automations

Reminder schedule:

- 15 days before due date
- 7 days before due date
- 3 days before due date
- On due date
- After due date if still not completed

Actions:

- Notify client.
- Notify assigned staff.
- Update dashboard counts.
- Record notification log.

## GST Recurring Automations

For GST clients:

- Monthly/quarterly filing tasks should be generated automatically.
- Return types should be editable per client.
- Due date rules should be editable by admin because compliance dates can change.

## Income Tax Season Automations

Campaign ideas:

- ITR season announcement.
- Early filing reminder.
- Form 16 collection reminder.
- Capital gains document reminder.
- Last date reminder.
- Existing client reactivation.

## Company Accounting Automations

Monthly workflow:

- Ask for bank statements.
- Ask for sales and purchase data.
- Ask for payroll/TDS data if applicable.
- Create month-end closing task.
- Create MIS delivery task.
- Alert admin if inputs are missing.

## Finance Automation Project Automations

### Discovery Stage

Actions:

- Create discovery call task.
- Create requirement checklist.
- Ask for sample files.

### Sample Data Pending

Actions:

- Remind client to share sample data.
- Notify assigned staff.

### Development and Testing

Actions:

- Create internal tasks.
- Track project stage.
- Store test files and delivered reports.

### Delivered

Actions:

- Send delivery confirmation.
- Ask for feedback.
- Create maintenance task if recurring.

## Marketing Automation

Segments:

- New leads
- Assisted onboarding leads
- ITR clients
- GST clients
- Accounting clients
- Company clients
- Finance automation prospects
- Cold leads
- Completed clients

Campaigns:

- ITR season campaign
- GST filing reminder campaign
- Company monthly accounting campaign
- MIS automation awareness campaign
- Referral request campaign
- Review request campaign

## Message Channels

MVP:

- Internal dashboard reminders
- Manual WhatsApp-ready templates
- Email-ready templates

Later:

- SMTP / SendGrid / Amazon SES
- WhatsApp Business API provider
- SMS provider such as MSG91 or Twilio

## Reminder Templates To Create Later

- Call request confirmation
- Documents required
- Documents pending
- Filing due soon
- Filing completed
- Payment pending
- MIS sample data request
- Report delivered
- Review request
- Referral request

