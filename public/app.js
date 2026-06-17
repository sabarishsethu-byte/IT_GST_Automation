const api = {
  async request(path, options = {}) {
    const response = await fetch(path, {
      headers: { "Content-Type": "application/json" },
      ...options
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || "Request failed");
    }
    return data;
  },
  getDashboard() {
    return this.request("/api/dashboard");
  },
  createLead(payload) {
    return this.request("/api/leads", {
      method: "POST",
      body: JSON.stringify(payload)
    });
  },
  createAutomationProject(payload) {
    return this.request("/api/automation-projects", {
      method: "POST",
      body: JSON.stringify(payload)
    });
  },
  createFilingTask(payload) {
    return this.request("/api/filing-tasks", {
      method: "POST",
      body: JSON.stringify(payload)
    });
  }
};

function formDataToObject(form) {
  return Object.fromEntries(new FormData(form).entries());
}

function setStatus(formId, message, isError = false) {
  const status = document.querySelector(`[data-status-for="${formId}"]`);
  if (!status) return;
  status.textContent = message;
  status.classList.toggle("error", isError);
}

function formatDate(value) {
  if (!value) return "No due date";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  }).format(date);
}

function record(title, badge, meta, detail) {
  return `
    <article class="record">
      <div class="record-title">
        <span>${escapeHtml(title)}</span>
        ${badge ? `<span class="badge">${escapeHtml(badge)}</span>` : ""}
      </div>
      ${meta ? `<div class="record-meta">${escapeHtml(meta)}</div>` : ""}
      ${detail ? `<div class="record-meta">${escapeHtml(detail)}</div>` : ""}
    </article>
  `;
}

function escapeHtml(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function renderMetrics(counts) {
  const metrics = document.querySelector("#metrics");
  if (!metrics) return;

  const labels = [
    ["leads", "Total Leads"],
    ["callRequired", "Calls Required"],
    ["clients", "Clients"],
    ["openTasks", "Open Tasks"],
    ["overdueTasks", "Overdue Tasks"],
    ["activeProjects", "Active Projects"]
  ];

  metrics.innerHTML = labels
    .map(([key, label]) => `
      <div class="metric">
        <strong>${counts[key] || 0}</strong>
        <span>${label}</span>
      </div>
    `)
    .join("");
}

function renderList(selector, items, mapper, emptyText) {
  const element = document.querySelector(selector);
  if (!element) return;
  element.innerHTML = items.length
    ? items.map(mapper).join("")
    : `<div class="empty-state">${emptyText}</div>`;
}

async function refreshDashboard() {
  const dashboard = await api.getDashboard();
  renderMetrics(dashboard.counts);

  renderList(
    "#leads-list",
    dashboard.recentLeads,
    lead => record(
      lead.name,
      lead.status.replaceAll("_", " "),
      `${lead.phone || "No phone"} | ${lead.serviceInterest || "No service"}`,
      `${lead.onboardingType === "assisted" ? "Assisted call flow" : "Self-service flow"} | ${lead.city || "City not added"}`
    ),
    "No leads yet. Submit a call request to create the first one."
  );

  renderList(
    "#tasks-list",
    dashboard.openTasks,
    task => record(
      task.title,
      task.taskType.replaceAll("_", " "),
      `Due: ${formatDate(task.dueAt)}`,
      task.description
    ),
    "No open tasks yet."
  );

  renderList(
    "#projects-list",
    dashboard.activeProjects,
    project => record(
      project.projectName,
      project.status.replaceAll("_", " "),
      `${project.companyName || "Company"} | ${project.projectType}`,
      project.desiredOutput
    ),
    "No automation projects yet."
  );
}

function bindForms() {
  const callbackForm = document.querySelector("#callback-form");
  if (callbackForm) {
    callbackForm.addEventListener("submit", async event => {
      event.preventDefault();
      setStatus("callback-form", "Creating call request...");
      try {
        const payload = {
          ...formDataToObject(callbackForm),
          onboardingType: "assisted"
        };
        await api.createLead(payload);
        callbackForm.reset();
        setStatus("callback-form", "Call request created. Our team can now follow up.");
        await refreshDashboard();
      } catch (error) {
        setStatus("callback-form", error.message, true);
      }
    });
  }

  const automationForm = document.querySelector("#automation-form");
  if (automationForm) {
    automationForm.addEventListener("submit", async event => {
      event.preventDefault();
      setStatus("automation-form", "Creating automation enquiry...");
      try {
        await api.createAutomationProject(formDataToObject(automationForm));
        automationForm.reset();
        setStatus("automation-form", "Automation enquiry created. Discovery task is ready.");
        await refreshDashboard();
      } catch (error) {
        setStatus("automation-form", error.message, true);
      }
    });
  }

  const filingForm = document.querySelector("#filing-form");
  if (filingForm) {
    filingForm.addEventListener("submit", async event => {
      event.preventDefault();
      setStatus("filing-form", "Adding filing task...");
      try {
        await api.createFilingTask(formDataToObject(filingForm));
        filingForm.reset();
        setStatus("filing-form", "Filing task added.");
        await refreshDashboard();
      } catch (error) {
        setStatus("filing-form", error.message, true);
      }
    });
  }

  document.querySelectorAll("[data-refresh]").forEach(button => {
    button.addEventListener("click", refreshDashboard);
  });
}

bindForms();
refreshDashboard().catch(error => {
  console.error(error);
});
