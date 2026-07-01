/* ═══════════════════════════════════════════════════════════════════════
   Deadlock Simulator — script.js
   ═══════════════════════════════════════════════════════════════════════ */

"use strict";

/* ── State ──────────────────────────────────────────────────────────── */
const state = {
  detect: { result: null, n: 5, r: 3 },
  banker: { result: null, n: 5, r: 3 },
  history: [],
  historyOpen: true,
};

/* ── Navbar scroll shadow ────────────────────────────────────────────── */
window.addEventListener("scroll", () => {
  document.getElementById("navbar").style.boxShadow =
    window.scrollY > 10 ? "0 2px 24px rgba(0,0,0,.5)" : "none";

  // Active nav link
  const secs = ["home", "detection", "prevention", "about"];
  let current = "";
  secs.forEach(id => {
    const el = document.getElementById(id);
    if (el && window.scrollY >= el.offsetTop - 90) current = id;
  });
  document.querySelectorAll(".nav-link").forEach(a => {
    a.classList.toggle("active", a.getAttribute("href") === "#" + current);
  });
});

/* ── Hamburger ───────────────────────────────────────────────────────── */
document.getElementById("hamburger").addEventListener("click", () => {
  document.getElementById("navLinks").classList.toggle("open");
});

/* ── Theme toggle ────────────────────────────────────────────────────── */
document.getElementById("themeToggle").addEventListener("click", () => {
  const html = document.documentElement;
  const isDark = html.dataset.theme === "dark";
  html.dataset.theme = isDark ? "light" : "dark";
  document.getElementById("themeToggle").textContent = isDark ? "🌞" : "🌙";
});

/* ── Smooth scroll helper ────────────────────────────────────────────── */
function scrollTo(id) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
}

/* ── Toast ───────────────────────────────────────────────────────────── */
function toast(msg, type = "info") {
  const c = document.getElementById("toast-container");
  const t = document.createElement("div");
  t.className = `toast ${type}`;
  t.textContent = msg;
  c.appendChild(t);
  setTimeout(() => {
    t.classList.add("fade-out");
    setTimeout(() => t.remove(), 350);
  }, 3200);
}

/* ── Toggle algo panel ───────────────────────────────────────────────── */
function toggleAlgoPanel(id) {
  document.getElementById(id)?.classList.toggle("open");
}

/* ═══════════════════════  MATRIX BUILDERS  ══════════════════════════ */

/**
 * Build an editable matrix table and inject it into targetId.
 * @param {string} targetId  - DOM id to inject into
 * @param {string} prefix    - input name prefix (e.g. "d-alloc")
 * @param {number} rows      - number of processes
 * @param {number} cols      - number of resources
 * @param {number[][]|null} values - pre-fill values (optional)
 */
function buildMatrix(targetId, prefix, rows, cols, values = null) {
  const labels = [...Array(cols)].map((_, i) => String.fromCharCode(65 + i)); // A,B,C…
  let html = `<table class="matrix-table"><thead><tr><th>P \\ R</th>`;
  labels.forEach(l => { html += `<th>${l}</th>`; });
  html += `</tr></thead><tbody>`;

  for (let i = 0; i < rows; i++) {
    html += `<tr class="process-row"><td>P${i}</td>`;
    for (let j = 0; j < cols; j++) {
      const val = values ? (values[i]?.[j] ?? 0) : 0;
      html += `<td><input class="cell" type="number" min="0"
        id="${prefix}-${i}-${j}" value="${val}" /></td>`;
    }
    html += `</tr>`;
  }
  html += `</tbody></table>`;
  document.getElementById(targetId).innerHTML = html;
}

/**
 * Build the Available vector (single-row) inputs.
 */
function buildAvail(targetId, prefix, cols, values = null) {
  const labels = [...Array(cols)].map((_, i) => String.fromCharCode(65 + i));
  let html = `<div class="avail-table">`;
  for (let j = 0; j < cols; j++) {
    const val = values ? (values[j] ?? 0) : 0;
    html += `<div class="avail-cell-group">
      <label>${labels[j]}</label>
      <input class="avail-cell" type="number" min="0" id="${prefix}-${j}" value="${val}" />
    </div>`;
  }
  html += `</div>`;
  document.getElementById(targetId).innerHTML = html;
}

/**
 * Read matrix values from DOM inputs.
 */
function readMatrix(prefix, rows, cols) {
  const mat = [];
  for (let i = 0; i < rows; i++) {
    const row = [];
    for (let j = 0; j < cols; j++) {
      row.push(Number(document.getElementById(`${prefix}-${i}-${j}`)?.value ?? 0));
    }
    mat.push(row);
  }
  return mat;
}

/**
 * Read Available vector.
 */
function readAvail(prefix, cols) {
  return [...Array(cols)].map((_, j) =>
    Number(document.getElementById(`${prefix}-${j}`)?.value ?? 0)
  );
}

/* ─── Validate inputs (client-side) ────────────────────────────────── */
function validateInputs(matrices, labels) {
  for (let m = 0; m < matrices.length; m++) {
    const mat = matrices[m], label = labels[m];
    const flat = mat.flat ? mat.flat() : mat;
    for (const v of flat) {
      if (isNaN(v) || v < 0) {
        toast(`${label} contains invalid values (must be ≥ 0).`, "error");
        return false;
      }
    }
  }
  return true;
}

/* ═══════════════════════  MODULE 1 — DETECTION  ═════════════════════ */

function generateDetectMatrices() {
  const n = parseInt(document.getElementById("d-proc").value);
  const r = parseInt(document.getElementById("d-res").value);
  if (n < 1 || n > 10 || r < 1 || r > 8) {
    toast("Processes: 1–10, Resources: 1–8", "warning"); return;
  }
  state.detect.n = n; state.detect.r = r;
  buildMatrix("d-alloc-table", "d-alloc", n, r);
  buildMatrix("d-req-table",   "d-req",   n, r);
  buildAvail ("d-avail-table", "d-avail", r);
  document.getElementById("detect-matrices").style.display = "grid";
  document.getElementById("detect-action-bar").style.display = "flex";
  document.getElementById("detect-result").innerHTML = "";
  toast("Matrices generated. Fill in values and click Detect.", "info");
}

async function loadSampleDetect() {
  const res = await fetch("/data/sample.json");
  const sample = (await res.json()).detect;
  const n = sample.processes, r = sample.resources;
  document.getElementById("d-proc").value = n;
  document.getElementById("d-res").value  = r;
  state.detect.n = n; state.detect.r = r;
  buildMatrix("d-alloc-table", "d-alloc", n, r, sample.allocation);
  buildMatrix("d-req-table",   "d-req",   n, r, sample.request);
  buildAvail ("d-avail-table", "d-avail", r, sample.available);
  document.getElementById("detect-matrices").style.display = "grid";
  document.getElementById("detect-action-bar").style.display = "flex";
  document.getElementById("detect-result").innerHTML = "";
  toast("Sample data loaded (Silberschatz textbook example).", "success");
}

function resetDetect() {
  document.getElementById("detect-matrices").style.display = "none";
  document.getElementById("detect-action-bar").style.display = "none";
  document.getElementById("detect-result").innerHTML = "";
  document.getElementById("detect-loader").style.display = "none";
  document.getElementById("d-proc").value = 5;
  document.getElementById("d-res").value  = 3;
  state.detect.result = null;
  toast("Detection module reset.", "info");
}

async function runDetect() {
  const { n, r } = state.detect;
  const allocation = readMatrix("d-alloc", n, r);
  const request    = readMatrix("d-req",   n, r);
  const available  = readAvail ("d-avail", r);

  if (!validateInputs([allocation, request, [available]], ["Allocation", "Request", "Available"])) return;

  // Show loader
  const loader = document.getElementById("detect-loader");
  loader.style.display = "flex";
  document.getElementById("detect-result").innerHTML = "";

  try {
    const res = await fetch("/api/detect", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ allocation, request, available }),
    });
    const data = await res.json();
    loader.style.display = "none";

    if (data.error) { toast(data.error, "error"); return; }

    state.detect.result = data;
    renderDetectResult(data, n, r);
    addHistory("Detection", data.deadlock ? "Deadlock" : "Safe",
      data.deadlock ? data.deadlocked_processes.map(p => `P${p}`).join(", ") || "—"
                    : data.sequence.map(p => `P${p}`).join(" → "));
  } catch (e) {
    loader.style.display = "none";
    toast("Server error. Is Flask running?", "error");
  }
}

function renderDetectResult(data, n, r) {
  const labels = [...Array(r)].map((_, i) => String.fromCharCode(65 + i));
  const safe   = !data.deadlock;
  let html = "";

  // Result banner
  html += `<div class="result-banner ${safe ? "safe" : "unsafe"}">
    <div class="result-icon">${safe ? "✅" : "⛔"}</div>
    <div>
      <div class="result-title ${safe ? "result-safe-color" : "result-danger-color"}">
        ${safe ? "System is Safe — No Deadlock" : "Deadlock Detected!"}
      </div>
      <div class="result-sub">
        ${safe
          ? `All processes can complete. Execution order: ${data.sequence.map(p => `P${p}`).join(" → ")}`
          : `Deadlocked processes: ${data.deadlocked_processes.map(p => `P${p}`).join(", ")}`
        }
      </div>
    </div>
    <span class="badge ${safe ? "badge-green" : "badge-red"}" style="margin-left:auto">
      ${safe ? "SAFE" : "DEADLOCK"}
    </span>
  </div>`;

  // Safe sequence
  if (safe && data.sequence.length) {
    html += `<div class="result-section">
      <h4>Execution Sequence</h4>
      <div class="sequence-display">`;
    data.sequence.forEach((p, idx) => {
      if (idx > 0) html += `<span class="seq-arrow">→</span>`;
      html += `<span class="seq-process" style="animation-delay:${idx * .15}s">P${p}</span>`;
    });
    html += `</div></div>`;
  }

  // Deadlocked processes
  if (!safe && data.deadlocked_processes.length) {
    html += `<div class="result-section">
      <h4>Deadlocked Processes</h4>
      <div class="sequence-display">`;
    data.deadlocked_processes.forEach((p, idx) => {
      html += `<span class="seq-process deadlocked" style="animation-delay:${idx * .15}s">P${p}</span>`;
    });
    html += `</div></div>`;
  }

  // Steps
  if (data.steps?.length) {
    html += `<div class="result-section">
      <h4>Step-by-Step Execution</h4>
      <div class="step-counter">${data.steps.length} step(s)</div>
      <div class="steps-container">`;

    data.steps.forEach((step, idx) => {
      const isFinal = step.process === -1;
      const cls = isFinal ? "step-final" : (safe ? "step-safe" : "step-safe");
      html += `<div class="step-card ${cls}" style="animation-delay:${idx * .08}s">
        <div class="step-header">
          ${!isFinal ? `<span class="badge badge-blue">Iter ${step.iteration}</span>
          <span class="step-proc">${isFinal ? "" : `P${step.process}`}</span>` :
          `<span class="badge badge-purple">Final</span>`}
          <span class="step-action">${step.action}</span>
        </div>`;

      if (!isFinal) {
        html += `<div class="step-resources">
          <div class="step-res-group">
            <strong>Work Before:</strong>
            <span class="step-res-values"> [${step.work_before.join(", ")}]</span>
          </div>
          <div class="step-res-group">
            <strong>Work After:</strong>
            <span class="step-res-values"> [${step.work_after.join(", ")}]</span>
          </div>
          <div class="step-res-group">
            <strong>Released (Alloc):</strong>
            <span class="step-res-values"> [${step.allocation.join(", ")}]</span>
          </div>
        </div>`;
      }
      html += `</div>`;
    });
    html += `</div></div>`;
  }

  document.getElementById("detect-result").innerHTML = html;
  document.getElementById("detect-result").scrollIntoView({ behavior: "smooth", block: "start" });
}

/* ═══════════════════════  MODULE 2 — BANKER'S  ══════════════════════ */

function generateBankerMatrices() {
  const n = parseInt(document.getElementById("b-proc").value);
  const r = parseInt(document.getElementById("b-res").value);
  if (n < 1 || n > 10 || r < 1 || r > 8) {
    toast("Processes: 1–10, Resources: 1–8", "warning"); return;
  }
  state.banker.n = n; state.banker.r = r;
  buildMatrix("b-alloc-table", "b-alloc", n, r);
  buildMatrix("b-max-table",   "b-max",   n, r);
  buildAvail ("b-avail-table", "b-avail", r);
  document.getElementById("banker-matrices").style.display = "grid";
  document.getElementById("banker-action-bar").style.display = "flex";
  document.getElementById("banker-result").innerHTML = "";
  toast("Matrices generated. Fill in values and click Run.", "info");
}

async function loadSampleBanker() {
  const res    = await fetch("/data/sample.json");
  const sample = (await res.json()).banker;
  const n = sample.processes, r = sample.resources;
  document.getElementById("b-proc").value = n;
  document.getElementById("b-res").value  = r;
  state.banker.n = n; state.banker.r = r;
  buildMatrix("b-alloc-table", "b-alloc", n, r, sample.allocation);
  buildMatrix("b-max-table",   "b-max",   n, r, sample.maximum);
  buildAvail ("b-avail-table", "b-avail", r, sample.available);
  document.getElementById("banker-matrices").style.display = "grid";
  document.getElementById("banker-action-bar").style.display = "flex";
  document.getElementById("banker-result").innerHTML = "";
  toast("Sample data loaded (Silberschatz textbook example).", "success");
}

function resetBanker() {
  document.getElementById("banker-matrices").style.display = "none";
  document.getElementById("banker-action-bar").style.display = "none";
  document.getElementById("banker-result").innerHTML = "";
  document.getElementById("banker-loader").style.display = "none";
  document.getElementById("b-proc").value = 5;
  document.getElementById("b-res").value  = 3;
  state.banker.result = null;
  toast("Banker's module reset.", "info");
}

async function runBanker() {
  const { n, r } = state.banker;
  const allocation = readMatrix("b-alloc", n, r);
  const maximum    = readMatrix("b-max",   n, r);
  const available  = readAvail ("b-avail", r);

  // Check allocation <= maximum
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < r; j++) {
      if (allocation[i][j] > maximum[i][j]) {
        toast(`Allocation[${i}][${j}]=${allocation[i][j]} exceeds Maximum[${i}][${j}]=${maximum[i][j]}.`, "error");
        return;
      }
    }
  }
  if (!validateInputs([allocation, maximum, [available]], ["Allocation", "Maximum", "Available"])) return;

  const loader = document.getElementById("banker-loader");
  loader.style.display = "flex";
  document.getElementById("banker-result").innerHTML = "";

  try {
    const res = await fetch("/api/banker", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ allocation, maximum, available }),
    });
    const data = await res.json();
    loader.style.display = "none";

    if (data.error) { toast(data.error, "error"); return; }

    state.banker.result = data;
    renderBankerResult(data, n, r);
    addHistory("Banker's", data.safe ? "Safe" : "Unsafe",
      data.safe ? data.sequence.map(p => `P${p}`).join(" → ") : "No safe sequence");
  } catch (e) {
    loader.style.display = "none";
    toast("Server error. Is Flask running?", "error");
  }
}

function renderBankerResult(data, n, r) {
  const labels = [...Array(r)].map((_, i) => String.fromCharCode(65 + i));
  const safe   = data.safe;
  let html = "";

  // Banner
  html += `<div class="result-banner ${safe ? "safe" : "unsafe"}">
    <div class="result-icon">${safe ? "🔒" : "🚨"}</div>
    <div>
      <div class="result-title ${safe ? "result-safe-color" : "result-danger-color"}">
        ${safe ? "System is in a SAFE State" : "System is in an UNSAFE State"}
      </div>
      <div class="result-sub">
        ${safe
          ? `Safe sequence: ${data.sequence.map(p => `P${p}`).join(" → ")}`
          : "No safe sequence exists. Deadlock may occur."}
      </div>
    </div>
    <span class="badge ${safe ? "badge-green" : "badge-red"}" style="margin-left:auto">
      ${safe ? "SAFE" : "UNSAFE"}
    </span>
  </div>`;

  // Need matrix
  if (data.need) {
    html += `<div class="result-section">
      <h4>Need Matrix (Maximum − Allocation) <span class="tooltip-icon" title="Maximum additional resources each process may request">ⓘ</span></h4>
      <table class="need-table">
        <thead><tr><th>Process</th>`;
    labels.forEach(l => { html += `<th>${l}</th>`; });
    html += `</tr></thead><tbody>`;
    data.need.forEach((row, i) => {
      html += `<tr><td>P${i}</td>`;
      row.forEach(v => { html += `<td>${v}</td>`; });
      html += `</tr>`;
    });
    html += `</tbody></table></div>`;
  }

  // Safe sequence animated
  if (safe && data.sequence.length) {
    html += `<div class="result-section">
      <h4>Safe Execution Sequence</h4>
      <div class="sequence-display">`;
    data.sequence.forEach((p, idx) => {
      if (idx > 0) html += `<span class="seq-arrow">→</span>`;
      html += `<span class="seq-process" style="animation-delay:${idx * .18}s">P${p}</span>`;
    });
    html += `</div></div>`;
  }

  // Steps
  if (data.steps?.length) {
    html += `<div class="result-section">
      <h4>Step-by-Step Banker's Execution</h4>
      <div class="step-counter">${data.steps.length} step(s)</div>
      <div class="steps-container">`;

    data.steps.forEach((step, idx) => {
      const isFinal = step.process === -1;
      html += `<div class="step-card ${isFinal ? "step-final" : "step-safe"}" style="animation-delay:${idx * .08}s">
        <div class="step-header">
          ${!isFinal ? `<span class="badge badge-purple">Iter ${step.iteration}</span>
          <span class="step-proc">P${step.process}</span>` :
          `<span class="badge badge-green">Result</span>`}
          <span class="step-action">${step.action}</span>
        </div>`;

      if (!isFinal) {
        html += `<div class="step-resources">
          <div class="step-res-group"><strong>Need:</strong>
            <span class="step-res-values"> [${step.need.join(", ")}]</span></div>
          <div class="step-res-group"><strong>Work Before:</strong>
            <span class="step-res-values"> [${step.work_before.join(", ")}]</span></div>
          <div class="step-res-group"><strong>Work After:</strong>
            <span class="step-res-values"> [${step.work_after.join(", ")}]</span></div>
        </div>`;
      }
      html += `</div>`;
    });
    html += `</div></div>`;
  }

  document.getElementById("banker-result").innerHTML = html;
  document.getElementById("banker-result").scrollIntoView({ behavior: "smooth", block: "start" });
}

/* ══════════════════════════  HISTORY  ═══════════════════════════════ */

function addHistory(module, status, detail) {
  state.history.unshift({
    module, status, detail,
    time: new Date().toLocaleTimeString()
  });

  const sec  = document.getElementById("history-section");
  const list = document.getElementById("history-list");
  const cnt  = document.getElementById("history-count");

  sec.style.display = "block";
  cnt.textContent   = state.history.length;

  list.innerHTML = state.history.map(h => `
    <div class="history-item">
      <div class="history-dot ${h.status === "Safe" || h.status === "Deadlock-Free" ? "safe" : "unsafe"}"></div>
      <strong>${h.module}</strong>
      <span class="badge ${h.status === "Safe" ? "badge-green" : h.status === "Deadlock" ? "badge-red" : "badge-orange"}">
        ${h.status}
      </span>
      <span>${h.detail}</span>
      <span class="history-ts">${h.time}</span>
    </div>`).join("");
}

function toggleHistory() {
  const body = document.getElementById("history-body");
  const icon = document.getElementById("history-toggle-icon");
  state.historyOpen = !state.historyOpen;
  body.style.display = state.historyOpen ? "block" : "none";
  icon.textContent   = state.historyOpen ? "▲" : "▼";
}

/* ══════════════════════════  EXPORT PDF  ════════════════════════════ */

function exportPDF(module) {
  const result = state[module === "detect" ? "detect" : "banker"].result;
  if (!result) { toast("Run the simulation first.", "warning"); return; }

  const ts   = new Date().toLocaleString();
  const safe = module === "detect" ? !result.deadlock : result.safe;
  const title = module === "detect"
    ? "Deadlock Detection Report"
    : "Banker's Algorithm Report";

  const lines = [
    title,
    "=".repeat(50),
    `Generated: ${ts}`,
    `Status   : ${safe ? "SAFE" : module === "detect" ? "DEADLOCK DETECTED" : "UNSAFE"}`,
    "",
  ];

  if (module === "detect") {
    if (result.sequence.length)
      lines.push("Execution Sequence: " + result.sequence.map(p => `P${p}`).join(" → "));
    if (result.deadlocked_processes.length)
      lines.push("Deadlocked Processes: " + result.deadlocked_processes.map(p => `P${p}`).join(", "));
  } else {
    if (result.sequence.length)
      lines.push("Safe Sequence: " + result.sequence.map(p => `P${p}`).join(" → "));
    if (result.need) {
      lines.push("", "Need Matrix:");
      result.need.forEach((row, i) => lines.push(`  P${i}: [${row.join(", ")}]`));
    }
  }

  lines.push("", "Step-by-Step:");
  (result.steps || []).forEach((s, i) => {
    lines.push(`  Step ${i + 1}: ${s.action}`);
  });

  const blob = new Blob([lines.join("\n")], { type: "text/plain" });
  const a    = document.createElement("a");
  a.href     = URL.createObjectURL(blob);
  a.download = `${title.replace(/\s/g, "_")}_${Date.now()}.txt`;
  a.click();
  toast("Report downloaded.", "success");
}

/* ══════════════  HERO PROCESS RING DECORATION  ══════════════════════ */

(function buildRing() {
  const ring = document.getElementById("processRing");
  if (!ring) return;
  const count = 6;
  for (let i = 0; i < count; i++) {
    const angle = (i / count) * 360;
    const node  = document.createElement("div");
    node.style.cssText = `
      position:absolute; width:36px; height:36px;
      background:rgba(37,99,235,.25); border:1px solid rgba(37,99,235,.4);
      border-radius:50%; display:flex; align-items:center; justify-content:center;
      font-family:var(--mono); font-size:.7rem; font-weight:700; color:#60a5fa;
      top:50%; left:50%;
      transform: rotate(${angle}deg) translateY(-160px) rotate(-${angle}deg);
      animation: pulse 2s ease-in-out ${i * .35}s infinite alternate;
    `;
    node.textContent = `P${i}`;
    ring.appendChild(node);

    // Resource arrow lines (SVG-less simple approach)
    const arrow = document.createElement("div");
    arrow.style.cssText = `
      position:absolute; width:2px; height:120px;
      background:linear-gradient(to top, rgba(37,99,235,.3), transparent);
      top:50%; left:calc(50% - 1px);
      transform-origin:top center;
      transform: rotate(${angle + 90}deg);
    `;
    ring.appendChild(arrow);
  }

  // Centre resource node
  const centre = document.createElement("div");
  centre.style.cssText = `
    position:absolute; top:50%; left:50%;
    transform:translate(-50%,-50%);
    width:56px; height:56px;
    background:rgba(37,99,235,.15); border:2px solid rgba(37,99,235,.4);
    border-radius:8px; display:flex; align-items:center; justify-content:center;
    font-size:.7rem; font-family:var(--mono); font-weight:700; color:#93c5fd;
    flex-direction:column; gap:2px;
  `;
  centre.innerHTML = `<span style="font-size:1rem">🗃</span><span>CPU</span>`;
  ring.appendChild(centre);

  const style = document.createElement("style");
  style.textContent = `@keyframes pulse{from{opacity:.5;transform:rotate(var(--a,0deg)) translateY(-160px) rotate(calc(-1*var(--a,0deg))) scale(.9);}to{opacity:1;transform:rotate(var(--a,0deg)) translateY(-160px) rotate(calc(-1*var(--a,0deg))) scale(1.1);}}`;
  document.head.appendChild(style);
})();
