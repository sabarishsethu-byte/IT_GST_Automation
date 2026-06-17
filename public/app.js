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
  },
  login(payload) {
    return this.request("/api/auth/login", {
      method: "POST",
      body: JSON.stringify(payload)
    });
  },
  logout() {
    return this.request("/api/auth/logout", { method: "POST" });
  },
  getLeads() {
    return this.request("/api/leads");
  },
  getClients() {
    return this.request("/api/clients");
  },
  updateLead(leadId, payload) {
    return this.request(`/api/leads/${encodeURIComponent(leadId)}`, {
      method: "PATCH",
      body: JSON.stringify(payload)
    });
  },
  convertLead(leadId) {
    return this.request(`/api/leads/${encodeURIComponent(leadId)}/convert`, {
      method: "POST"
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

function leadRecord(lead) {
  const notes = Array.isArray(lead.notes) ? lead.notes : [];
  const latestNote = notes[0]?.text || "No internal notes yet";
  return `
    <article class="record lead-record" data-lead-id="${escapeHtml(lead.id)}">
      <div class="record-title">
        <span>${escapeHtml(lead.name)}</span>
        <span class="badge">${escapeHtml(lead.status.replaceAll("_", " "))}</span>
      </div>
      <div class="record-meta">${escapeHtml(lead.phone || "No phone")} | ${escapeHtml(lead.serviceInterest || "No service")} | ${escapeHtml(lead.city || "City not added")}</div>
      <div class="record-meta">${escapeHtml(lead.onboardingType === "assisted" ? "Assisted call flow" : "Self-service flow")}</div>
      <div class="lead-actions">
        <select data-lead-status="${escapeHtml(lead.id)}" aria-label="Lead status">
          ${["new", "call_required", "contacted", "quote_sent", "converted", "lost"].map(status => `
            <option value="${status}" ${lead.status === status ? "selected" : ""}>${status.replaceAll("_", " ")}</option>
          `).join("")}
        </select>
        <button class="button secondary small-button" type="button" data-save-lead="${escapeHtml(lead.id)}">Save Status</button>
        <button class="button primary small-button" type="button" data-convert-lead="${escapeHtml(lead.id)}" ${lead.status === "converted" ? "disabled" : ""}>Convert</button>
      </div>
      <label class="lead-note-label">Internal note
        <textarea data-lead-note="${escapeHtml(lead.id)}" placeholder="Call summary, documents requested, quote details"></textarea>
      </label>
      <div class="record-meta">Latest note: ${escapeHtml(latestNote)}</div>
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
  const [leads, clients] = await Promise.all([api.getLeads(), api.getClients()]);
  renderMetrics(dashboard.counts);

  renderList(
    "#leads-list",
    leads,
    leadRecord,
    "No leads yet. Submit a call request to create the first one."
  );

  renderList(
    "#clients-list",
    clients,
    client => record(
      client.displayName,
      client.status,
      `${client.phone || "No phone"} | ${client.email || "No email"}`,
      `${client.clientType || "Client"} | ${client.city || "City not added"}`
    ),
    "No clients yet. Convert a lead to create the first client profile."
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
  const loginForm = document.querySelector("#login-form");
  if (loginForm) {
    loginForm.addEventListener("submit", async event => {
      event.preventDefault();
      setStatus("login-form", "Signing in...");
      try {
        await api.login(formDataToObject(loginForm));
        window.location.href = "/admin.html";
      } catch (error) {
        setStatus("login-form", error.message, true);
      }
    });
  }

  const logoutButton = document.querySelector("#logout-button");
  if (logoutButton) {
    logoutButton.addEventListener("click", async () => {
      await api.logout();
      window.location.href = "/login.html";
    });
  }

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

  document.addEventListener("click", async event => {
    const saveButton = event.target.closest("[data-save-lead]");
    if (saveButton) {
      const leadId = saveButton.dataset.saveLead;
      const status = document.querySelector(`[data-lead-status="${leadId}"]`)?.value;
      const noteField = document.querySelector(`[data-lead-note="${leadId}"]`);
      await api.updateLead(leadId, { status, note: noteField?.value || "" });
      if (noteField) noteField.value = "";
      await refreshDashboard();
      return;
    }

    const convertButton = event.target.closest("[data-convert-lead]");
    if (convertButton) {
      await api.convertLead(convertButton.dataset.convertLead);
      await refreshDashboard();
    }
  });
}

bindForms();
if (document.querySelector("#metrics")) {
  refreshDashboard().catch(error => {
    if (error.message === "Admin login required") {
      window.location.href = "/login.html";
      return;
    }
    console.error(error);
  });
}
