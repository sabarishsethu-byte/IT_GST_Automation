const http = require("http");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const PORT = Number(process.env.PORT || 4173);
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin123";
const ROOT = __dirname;
const PUBLIC_DIR = path.join(ROOT, "public");
const DATA_DIR = path.join(ROOT, "data");
const DATA_FILE = path.join(DATA_DIR, "app.json");

const DEFAULT_DATA = {
  leads: [],
  clients: [],
  tasks: [],
  filingTasks: [],
  automationProjects: [],
  notifications: [],
  activityLogs: []
};

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".svg": "image/svg+xml"
};

const sessions = new Map();
const ADMIN_STATUSES = new Set(["new", "call_required", "contacted", "quote_sent", "converted", "lost"]);

function ensureDataFile() {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify(DEFAULT_DATA, null, 2));
  }
}

function readData() {
  ensureDataFile();
  const raw = fs.readFileSync(DATA_FILE, "utf8");
  return { ...DEFAULT_DATA, ...JSON.parse(raw) };
}

function writeData(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

function nowIso() {
  return new Date().toISOString();
}

function id(prefix) {
  return `${prefix}_${crypto.randomUUID()}`;
}

function sendJson(res, statusCode, payload) {
  const body = JSON.stringify(payload, null, 2);
  res.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store"
  });
  res.end(body);
}

function sendRedirect(res, location) {
  res.writeHead(302, { Location: location });
  res.end();
}

function parseCookies(req) {
  const header = req.headers.cookie || "";
  return Object.fromEntries(
    header
      .split(";")
      .map(item => item.trim())
      .filter(Boolean)
      .map(item => {
        const index = item.indexOf("=");
        return index === -1 ? [item, ""] : [item.slice(0, index), decodeURIComponent(item.slice(index + 1))];
      })
  );
}

function isAuthenticated(req) {
  const cookies = parseCookies(req);
  const session = cookies.admin_session && sessions.get(cookies.admin_session);
  if (!session) return false;
  if (new Date(session.expiresAt) < new Date()) {
    sessions.delete(cookies.admin_session);
    return false;
  }
  return true;
}

function requireAdmin(req, res) {
  if (isAuthenticated(req)) return true;
  sendJson(res, 401, { error: "Admin login required" });
  return false;
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", chunk => {
      body += chunk;
      if (body.length > 1_000_000) {
        reject(new Error("Request body too large"));
        req.destroy();
      }
    });
    req.on("end", () => {
      if (!body) {
        resolve({});
        return;
      }
      try {
        resolve(JSON.parse(body));
      } catch (error) {
        reject(new Error("Invalid JSON"));
      }
    });
    req.on("error", reject);
  });
}

function cleanText(value) {
  return String(value || "").trim();
}

function requireFields(body, fields) {
  const missing = fields.filter(field => !cleanText(body[field]));
  if (missing.length) {
    return `Missing required field${missing.length > 1 ? "s" : ""}: ${missing.join(", ")}`;
  }
  return null;
}

function addActivity(data, action, entityType, entityId, metadata = {}) {
  data.activityLogs.unshift({
    id: id("log"),
    action,
    entityType,
    entityId,
    metadata,
    createdAt: nowIso()
  });
}

function createTask(data, task) {
  const record = {
    id: id("task"),
    title: cleanText(task.title),
    description: cleanText(task.description),
    taskType: task.taskType || "internal",
    status: "open",
    dueAt: task.dueAt || null,
    leadId: task.leadId || null,
    clientId: task.clientId || null,
    assignedTo: task.assignedTo || "admin",
    createdAt: nowIso(),
    updatedAt: nowIso()
  };
  data.tasks.unshift(record);
  return record;
}

function createNotification(data, notification) {
  const record = {
    id: id("note"),
    channel: notification.channel || "internal",
    status: "queued",
    templateName: notification.templateName || null,
    subject: notification.subject || null,
    message: notification.message || "",
    leadId: notification.leadId || null,
    clientId: notification.clientId || null,
    taskId: notification.taskId || null,
    scheduledAt: notification.scheduledAt || nowIso(),
    sentAt: null,
    createdAt: nowIso()
  };
  data.notifications.unshift(record);
  return record;
}

function buildDashboard(data) {
  const today = new Date();
  const upcomingLimit = new Date(today);
  upcomingLimit.setDate(today.getDate() + 15);

  const isOverdue = due => due && new Date(due) < today;
  const isUpcoming = due => due && new Date(due) >= today && new Date(due) <= upcomingLimit;

  return {
    counts: {
      leads: data.leads.length,
      callRequired: data.leads.filter(lead => lead.status === "call_required").length,
      clients: data.clients.length,
      openTasks: data.tasks.filter(task => task.status === "open").length,
      overdueTasks: data.tasks.filter(task => task.status === "open" && isOverdue(task.dueAt)).length,
      upcomingFilings: data.filingTasks.filter(task => isUpcoming(task.dueDate)).length,
      activeProjects: data.automationProjects.filter(project => !["delivered", "cancelled"].includes(project.status)).length
    },
    recentLeads: data.leads.slice(0, 8),
    openTasks: data.tasks.filter(task => task.status === "open").slice(0, 10),
    upcomingFilings: data.filingTasks.filter(task => task.status !== "completed").slice(0, 10),
    activeProjects: data.automationProjects.slice(0, 8)
  };
}

async function handleApi(req, res, pathname) {
  const data = readData();

  if (req.method === "GET" && pathname === "/api/status") {
    sendJson(res, 200, {
      ok: true,
      service: "IT GST Automation MVP",
      timestamp: nowIso()
    });
    return;
  }

  if (req.method === "POST" && pathname === "/api/auth/login") {
    const body = await readBody(req);
    if (cleanText(body.password) !== ADMIN_PASSWORD) {
      sendJson(res, 401, { error: "Invalid admin password" });
      return;
    }

    const sessionId = crypto.randomUUID();
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 12);
    sessions.set(sessionId, { role: "admin", expiresAt: expiresAt.toISOString() });
    res.writeHead(200, {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
      "Set-Cookie": `admin_session=${encodeURIComponent(sessionId)}; HttpOnly; SameSite=Lax; Path=/; Max-Age=43200`
    });
    res.end(JSON.stringify({ ok: true, role: "admin" }, null, 2));
    return;
  }

  if (req.method === "POST" && pathname === "/api/auth/logout") {
    const cookies = parseCookies(req);
    if (cookies.admin_session) sessions.delete(cookies.admin_session);
    res.writeHead(200, {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
      "Set-Cookie": "admin_session=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0"
    });
    res.end(JSON.stringify({ ok: true }, null, 2));
    return;
  }

  if (req.method === "GET" && pathname === "/api/auth/me") {
    if (!requireAdmin(req, res)) return;
    sendJson(res, 200, { ok: true, role: "admin" });
    return;
  }

  if (req.method === "GET" && pathname === "/api/dashboard") {
    if (!requireAdmin(req, res)) return;
    sendJson(res, 200, buildDashboard(data));
    return;
  }

  if (req.method === "GET" && pathname === "/api/leads") {
    if (!requireAdmin(req, res)) return;
    sendJson(res, 200, data.leads);
    return;
  }

  if (req.method === "GET" && pathname === "/api/clients") {
    if (!requireAdmin(req, res)) return;
    sendJson(res, 200, data.clients);
    return;
  }

  if (req.method === "GET" && pathname === "/api/tasks") {
    if (!requireAdmin(req, res)) return;
    sendJson(res, 200, data.tasks);
    return;
  }

  if (req.method === "GET" && pathname === "/api/automation-projects") {
    if (!requireAdmin(req, res)) return;
    sendJson(res, 200, data.automationProjects);
    return;
  }

  if (req.method === "GET" && pathname === "/api/filing-tasks") {
    if (!requireAdmin(req, res)) return;
    sendJson(res, 200, data.filingTasks);
    return;
  }

  if (req.method === "POST" && pathname === "/api/leads") {
    const body = await readBody(req);
    const missing = requireFields(body, ["name", "phone", "serviceInterest"]);
    if (missing) {
      sendJson(res, 400, { error: missing });
      return;
    }

    const onboardingType = body.onboardingType === "self_service" ? "self_service" : "assisted";
    const lead = {
      id: id("lead"),
      name: cleanText(body.name),
      phone: cleanText(body.phone),
      email: cleanText(body.email),
      city: cleanText(body.city),
      preferredLanguage: cleanText(body.preferredLanguage),
      preferredCallTime: cleanText(body.preferredCallTime),
      serviceInterest: cleanText(body.serviceInterest),
      businessType: cleanText(body.businessType),
      message: cleanText(body.message),
      onboardingType,
      leadSource: cleanText(body.leadSource) || "website",
      status: onboardingType === "assisted" ? "call_required" : "new",
      assignedTo: "admin",
      createdAt: nowIso(),
      updatedAt: nowIso()
    };

    data.leads.unshift(lead);
    const task = createTask(data, {
      title: onboardingType === "assisted" ? `Call ${lead.name}` : `Review submission from ${lead.name}`,
      description: onboardingType === "assisted"
        ? `Client requested help for ${lead.serviceInterest}. Preferred time: ${lead.preferredCallTime || "not specified"}.`
        : `Review detailed enquiry and prepare document checklist for ${lead.serviceInterest}.`,
      taskType: onboardingType === "assisted" ? "call" : "document_followup",
      leadId: lead.id,
      dueAt: nowIso()
    });

    createNotification(data, {
      channel: "whatsapp",
      templateName: "lead_confirmation",
      subject: "Lead confirmation",
      leadId: lead.id,
      taskId: task.id,
      message: `Thanks ${lead.name}. We received your request for ${lead.serviceInterest}. Our team will contact you shortly.`
    });

    addActivity(data, "lead_created", "lead", lead.id, { onboardingType });
    writeData(data);
    sendJson(res, 201, { lead, task });
    return;
  }

  if (req.method === "PATCH" && pathname.match(/^\/api\/leads\/[^/]+$/)) {
    if (!requireAdmin(req, res)) return;
    const leadId = pathname.split("/")[3];
    const lead = data.leads.find(item => item.id === leadId);
    if (!lead) {
      sendJson(res, 404, { error: "Lead not found" });
      return;
    }

    const body = await readBody(req);
    const nextStatus = cleanText(body.status);
    if (nextStatus) {
      if (!ADMIN_STATUSES.has(nextStatus)) {
        sendJson(res, 400, { error: "Invalid lead status" });
        return;
      }
      lead.status = nextStatus;
    }

    const note = cleanText(body.note);
    if (note) {
      lead.notes = Array.isArray(lead.notes) ? lead.notes : [];
      lead.notes.unshift({
        id: id("leadnote"),
        text: note,
        createdAt: nowIso()
      });
    }

    lead.assignedTo = cleanText(body.assignedTo) || lead.assignedTo || "admin";
    lead.updatedAt = nowIso();
    addActivity(data, "lead_updated", "lead", lead.id, { status: lead.status, noteAdded: Boolean(note) });
    writeData(data);
    sendJson(res, 200, { lead });
    return;
  }

  if (req.method === "POST" && pathname.match(/^\/api\/leads\/[^/]+\/convert$/)) {
    if (!requireAdmin(req, res)) return;
    const leadId = pathname.split("/")[3];
    const lead = data.leads.find(item => item.id === leadId);
    if (!lead) {
      sendJson(res, 404, { error: "Lead not found" });
      return;
    }

    const existingClient = data.clients.find(client => client.createdFromLeadId === lead.id);
    if (existingClient) {
      sendJson(res, 200, { client: existingClient, alreadyConverted: true });
      return;
    }

    const client = {
      id: id("client"),
      clientType: lead.businessType || "individual",
      displayName: lead.name,
      legalName: lead.name,
      tradeName: "",
      phone: lead.phone,
      email: lead.email,
      city: lead.city,
      state: "",
      pan: "",
      gstin: "",
      cin: "",
      onboardingType: lead.onboardingType,
      status: "active",
      assignedTo: lead.assignedTo || "admin",
      createdFromLeadId: lead.id,
      createdAt: nowIso(),
      updatedAt: nowIso()
    };

    data.clients.unshift(client);
    lead.status = "converted";
    lead.updatedAt = nowIso();
    createTask(data, {
      title: `Create client folder for ${client.displayName}`,
      description: "Add KYC, tax, GST, accounting, and automation folders as applicable.",
      taskType: "internal",
      clientId: client.id,
      leadId: lead.id
    });
    addActivity(data, "lead_converted", "client", client.id, { leadId: lead.id });
    writeData(data);
    sendJson(res, 201, { client });
    return;
  }

  if (req.method === "POST" && pathname === "/api/automation-projects") {
    const body = await readBody(req);
    const missing = requireFields(body, ["companyName", "projectType", "desiredOutput"]);
    if (missing) {
      sendJson(res, 400, { error: missing });
      return;
    }

    const project = {
      id: id("project"),
      clientId: body.clientId || null,
      companyName: cleanText(body.companyName),
      contactName: cleanText(body.contactName),
      phone: cleanText(body.phone),
      email: cleanText(body.email),
      projectName: cleanText(body.projectName) || `${body.projectType} for ${body.companyName}`,
      projectType: cleanText(body.projectType),
      currentProcessSummary: cleanText(body.currentProcessSummary),
      dataSources: cleanText(body.dataSources),
      desiredOutput: cleanText(body.desiredOutput),
      frequency: cleanText(body.frequency) || "monthly",
      toolPreference: cleanText(body.toolPreference),
      status: "discovery",
      assignedTo: "admin",
      targetDeliveryDate: body.targetDeliveryDate || null,
      createdAt: nowIso(),
      updatedAt: nowIso()
    };

    data.automationProjects.unshift(project);
    createTask(data, {
      title: `Discovery call for ${project.companyName}`,
      description: `Understand automation requirement: ${project.desiredOutput}`,
      taskType: "project",
      clientId: project.clientId
    });
    addActivity(data, "automation_project_created", "automationProject", project.id);
    writeData(data);
    sendJson(res, 201, { project });
    return;
  }

  if (req.method === "POST" && pathname === "/api/filing-tasks") {
    if (!requireAdmin(req, res)) return;
    const body = await readBody(req);
    const missing = requireFields(body, ["clientName", "returnType", "dueDate"]);
    if (missing) {
      sendJson(res, 400, { error: missing });
      return;
    }

    const filingTask = {
      id: id("filing"),
      clientId: body.clientId || null,
      clientName: cleanText(body.clientName),
      returnType: cleanText(body.returnType),
      periodStart: body.periodStart || null,
      periodEnd: body.periodEnd || null,
      dueDate: body.dueDate,
      status: "documents_pending",
      assignedTo: "admin",
      notes: cleanText(body.notes),
      createdAt: nowIso(),
      updatedAt: nowIso()
    };

    data.filingTasks.unshift(filingTask);
    addActivity(data, "filing_task_created", "filingTask", filingTask.id);
    writeData(data);
    sendJson(res, 201, { filingTask });
    return;
  }

  sendJson(res, 404, { error: "API route not found" });
}

function serveStatic(req, res, pathname) {
  const safePath = pathname === "/" ? "/index.html" : pathname;
  if (safePath === "/admin.html" && !isAuthenticated(req)) {
    sendRedirect(res, "/login.html");
    return;
  }

  const filePath = path.normalize(path.join(PUBLIC_DIR, safePath));

  if (!filePath.startsWith(PUBLIC_DIR)) {
    res.writeHead(403);
    res.end("Forbidden");
    return;
  }

  fs.readFile(filePath, (error, content) => {
    if (error) {
      fs.readFile(path.join(PUBLIC_DIR, "index.html"), (fallbackError, fallbackContent) => {
        if (fallbackError) {
          res.writeHead(404);
          res.end("Not found");
          return;
        }
        res.writeHead(200, { "Content-Type": MIME_TYPES[".html"] });
        res.end(fallbackContent);
      });
      return;
    }
    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, { "Content-Type": MIME_TYPES[ext] || "application/octet-stream" });
    res.end(content);
  });
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const pathname = decodeURIComponent(url.pathname);

  try {
    if (pathname.startsWith("/api/")) {
      await handleApi(req, res, pathname);
      return;
    }
    serveStatic(req, res, pathname);
  } catch (error) {
    sendJson(res, 500, { error: error.message || "Server error" });
  }
});

ensureDataFile();
server.listen(PORT, () => {
  console.log(`IT GST Automation MVP running at http://127.0.0.1:${PORT}`);
});
