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
  getClient(clientId) {
    return this.request(`/api/clients/${encodeURIComponent(clientId)}`);
  },
  updateClient(clientId, payload) {
    return this.request(`/api/clients/${encodeURIComponent(clientId)}`, {
      method: "PATCH",
      body: JSON.stringify(payload)
    });
  },
  uploadDocument(clientId, payload) {
    return this.request(`/api/clients/${encodeURIComponent(clientId)}/documents`, {
      method: "POST",
      body: JSON.stringify(payload)
    });
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

const state = {
  selectedClientId: null,
  clients: []
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

function clientRecord(client) {
  return `
    <article class="record client-record" data-client-id="${escapeHtml(client.id)}">
      <div class="record-title">
        <span>${escapeHtml(client.displayName)}</span>
        <span class="badge">${escapeHtml(client.status || "active")}</span>
      </div>
      <div class="record-meta">${escapeHtml(client.phone || "No phone")} | ${escapeHtml(client.email || "No email")}</div>
      <div class="record-meta">${escapeHtml(client.clientType || "Client")} | ${escapeHtml(client.serviceNotes || "No service notes")}</div>
      <button class="button secondary small-button" type="button" data-select-client="${escapeHtml(client.id)}">Open Profile</button>
    </article>
  `;
}

function documentRecord(document) {
  return record(
    document.originalFilename,
    document.documentCategory.replaceAll("_", " "),
    `${Math.ceil((document.fileSize || 0) / 1024)} KB | ${formatDate(document.createdAt)}`,
    document.notes || document.servicePeriod || document.storedPath
  );
}

function fillClientSelects(clients) {
  const filingSelect = document.querySelector("#filing-client-select");
  if (!filingSelect) return;
  const current = filingSelect.value;
  filingSelect.innerHTML = `
    <option value="">Select client or type name below</option>
    ${clients.map(client => `<option value="${escapeHtml(client.id)}">${escapeHtml(client.displayName)}</option>`).join("")}
  `;
  filingSelect.value = clients.some(client => client.id === current) ? current : "";
}

function setSelectedClientBadges(client) {
  const label = client ? client.displayName : "Select client";
  document.querySelectorAll("#selected-client-badge, #document-client-badge").forEach(element => {
    element.textContent = label;
  });
}

function fillClientForm(client) {
  const form = document.querySelector("#client-form");
  const documentForm = document.querySelector("#document-form");
  if (!form) return;

  state.selectedClientId = client?.id || null;
  setSelectedClientBadges(client);
  form.elements.clientId.value = client?.id || "";

  [
    "displayName",
    "clientType",
    "legalName",
    "tradeName",
    "phone",
    "email",
    "city",
    "state",
    "pan",
    "gstin",
    "cin",
    "serviceNotes"
  ].forEach(field => {
    if (form.elements[field]) form.elements[field].value = client?.[field] || "";
  });
  if (form.elements.note) form.elements.note.value = "";
  if (documentForm?.elements.clientId) documentForm.elements.clientId.value = client?.id || "";
}

async function refreshSelectedClient() {
  if (!state.selectedClientId) return;
  const detail = await api.getClient(state.selectedClientId);
  fillClientForm(detail.client);
  renderList(
    "#documents-list",
    detail.documents,
    documentRecord,
    "No documents uploaded for this client yet."
  );
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
  state.clients = clients;
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
    clientRecord,
    "No clients yet. Convert a lead to create the first client profile."
  );
  fillClientSelects(clients);
  if (!state.selectedClientId && clients[0]) {
    fillClientForm(clients[0]);
    await refreshSelectedClient();
  } else if (state.selectedClientId) {
    await refreshSelectedClient();
  }

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

  const clientForm = document.querySelector("#client-form");
  if (clientForm) {
    clientForm.addEventListener("submit", async event => {
      event.preventDefault();
      const clientId = clientForm.elements.clientId.value;
      if (!clientId) {
        setStatus("client-form", "Select a client first.", true);
        return;
      }
      setStatus("client-form", "Saving client profile...");
      try {
        const payload = formDataToObject(clientForm);
        delete payload.clientId;
        await api.updateClient(clientId, payload);
        setStatus("client-form", "Client profile saved.");
        await refreshDashboard();
      } catch (error) {
        setStatus("client-form", error.message, true);
      }
    });
  }

  const documentForm = document.querySelector("#document-form");
  if (documentForm) {
    documentForm.addEventListener("submit", async event => {
      event.preventDefault();
      const clientId = documentForm.elements.clientId.value;
      const file = documentForm.elements.file.files[0];
      if (!clientId) {
        setStatus("document-form", "Select a client first.", true);
        return;
      }
      if (!file) {
        setStatus("document-form", "Choose a file to upload.", true);
        return;
      }
      setStatus("document-form", "Uploading document...");
      try {
        const contentBase64 = await readFileAsDataUrl(file);
        await api.uploadDocument(clientId, {
          category: documentForm.elements.category.value,
          filename: file.name,
          mimeType: file.type,
          servicePeriod: documentForm.elements.servicePeriod.value,
          notes: documentForm.elements.notes.value,
          contentBase64
        });
        documentForm.reset();
        documentForm.elements.clientId.value = clientId;
        setStatus("document-form", "Document uploaded.");
        await refreshSelectedClient();
      } catch (error) {
        setStatus("document-form", error.message, true);
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
      return;
    }

    const selectClientButton = event.target.closest("[data-select-client]");
    if (selectClientButton) {
      state.selectedClientId = selectClientButton.dataset.selectClient;
      await refreshSelectedClient();
    }
  });
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("Could not read selected file"));
    reader.readAsDataURL(file);
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
