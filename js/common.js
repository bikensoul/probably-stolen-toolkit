/* Probably Stolen Toolkit – shared code
   Each tool lives in three files:  tools/<name>.html  (markup),
   css/<name>.css (styles) and js/<name>.js (registers Toolkit.tools.<name>).
   To add a tool: create those three files and add its name to TOOLS below
   and a link in the nav in index.html. */

const Toolkit = { tools: {} };
// Bump the version in index.html (meta "toolkit-version" and every ?v=) on each update,
// so browsers load the new files instead of cached ones.
const VERSION = document.querySelector('meta[name="toolkit-version"]')?.content || Date.now();
const TOOLS = ["home", "water", "appraiser", "chemist", "projector"];
// Old or direct links to an item inside a tab: #plasma opens the Appraiser on that item.
const ALIASES = { plasma: "appraiser", hands: "appraiser", ribwich: "appraiser" };

/* ---------- remembered inputs (this browser only) ---------- */
const STORE_PREFIX = "ps:";
const store = {
  get(k, d = null) { try { const v = localStorage.getItem(STORE_PREFIX + k); return v === null ? d : JSON.parse(v); } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem(STORE_PREFIX + k, JSON.stringify(v)); } catch (e) {} },
  clearAll() {
    try {
      Object.keys(localStorage).filter(k => k.startsWith(STORE_PREFIX) || k.startsWith("ps-recipe")).forEach(k => localStorage.removeItem(k));
    } catch (e) {}
  },
};
Toolkit.store = store;

// Every <input>/<select> with an id is remembered, unless it sits inside [data-nosave].
const savable = el => el && el.id && (el.tagName === "INPUT" || el.tagName === "SELECT") &&
  el.type !== "checkbox" && el.type !== "radio" && !el.closest("[data-nosave]");
function restoreInputs(root) {
  const saved = store.get("inputs", {});
  root.querySelectorAll("input[id], select[id]").forEach(el => {
    if (savable(el) && Object.prototype.hasOwnProperty.call(saved, el.id)) el.value = saved[el.id];
  });
}
let saveBlocked = false;   // set while clearing, so the reload doesn't save the old values again
function saveInputs() {
  if (saveBlocked) return;
  const saved = {};
  document.querySelectorAll("input[id], select[id]").forEach(el => { if (savable(el)) saved[el.id] = el.value; });
  store.set("inputs", saved);
}
let saveTimer;
document.addEventListener("input", e => { if (savable(e.target)) { clearTimeout(saveTimer); saveTimer = setTimeout(saveInputs, 300); } });
document.addEventListener("click", e => { if (e.target.closest("button")) { clearTimeout(saveTimer); saveTimer = setTimeout(saveInputs, 300); } });
window.addEventListener("pagehide", saveInputs);
document.addEventListener("visibilitychange", () => { if (document.visibilityState === "hidden") saveInputs(); });

/* ---------- percentage inputs: never above 100 % (or below 0) ---------- */
document.addEventListener("input", e => {
  const el = e.target;
  if (!(el instanceof HTMLInputElement) || el.type !== "number" || el.max !== "100") return;
  const x = parseFloat(el.value);
  if (Number.isNaN(x) || (x <= 100 && x >= 0)) return;
  el.value = x > 100 ? 100 : 0;
  el.classList.remove("clamped"); void el.offsetWidth; el.classList.add("clamped");
  let tip = el.parentElement.querySelector(".clamp-tip");
  if (!tip) { tip = document.createElement("span"); tip.className = "clamp-tip"; el.insertAdjacentElement("afterend", tip); }
  tip.textContent = x > 100 ? "max. 100 %" : "min. 0 %";
  clearTimeout(tip._t); tip._t = setTimeout(() => tip.remove(), 1800);
}, true);   // capture: runs before the calculators read the value

/* ---------- pour breakdown (shared) ---------- */
const CUPS = [6000, 3000, 2000, 750, 450, 250, 100, 50, 25, 5, 1];
const _pourMemo = new Map();
function cupPlan(n) {            // fewest full cups that add up to n whole mL
  if (_pourMemo.has(n)) return _pourMemo.get(n);
  const best = new Array(n + 1).fill(Infinity), pick = new Array(n + 1).fill(0);
  best[0] = 0;
  for (let a = 1; a <= n; a++) for (const c of CUPS) if (c <= a && best[a - c] + 1 < best[a]) { best[a] = best[a - c] + 1; pick[a] = c; }
  const counts = {};
  for (let a = n; a > 0; a -= pick[a]) counts[pick[a]] = (counts[pick[a]] || 0) + 1;
  _pourMemo.set(n, counts); return counts;
}
function pours(ml) {
  if (!(ml > 0)) return "";
  const whole = Math.ceil(ml - 1e-6);          // cups only take whole mL: round up
  const counts = cupPlan(Math.min(whole, 200000));
  const parts = CUPS.filter(c => counts[c]).map(c => `<span class="cup">${counts[c]} × ${c.toLocaleString()} mL</span>`);
  return `<div class="pour">Pour: ${parts.join(" + ")}</div>`;
}
/* ---------- tabs ---------- */
// Opens the tab in the address (#water …). Without one: the tab used last time,
// or the Home page on a first visit.
function showTab() {
  let name = location.hash.slice(1);
  if (ALIASES[name]) {
    const item = name; name = ALIASES[name];
    store.set("appraiserItem", item);
    if (Toolkit.pickAppraisal) Toolkit.pickAppraisal(item);
    history.replaceState(null, "", "#" + name);
  }
  if (!TOOLS.includes(name)) {
    let last = store.get("lastTab"); if (ALIASES[last]) last = ALIASES[last];
    name = TOOLS.includes(last) ? last : "home";
    history.replaceState(null, "", "#" + name);
  }
  if (!saveBlocked) store.set("lastTab", name);
  TOOLS.forEach(t => { const el = document.getElementById(t); if (el) el.classList.toggle("active", t === name); });
  document.querySelectorAll("#tabs a").forEach(a => {
    const on = a.getAttribute("href") === "#" + name;
    a.classList.toggle("active", on);
    if (on) a.scrollIntoView({ block: "nearest", inline: "nearest" });
  });
}
window.addEventListener("hashchange", () => { showTab(); window.scrollTo(0, 0); });

/* ---------- boot: load each tool's markup, restore inputs, start it ---------- */
window.addEventListener("DOMContentLoaded", async () => {
  const page = document.getElementById("page");
  const html = await Promise.all(TOOLS.map(t =>
    fetch(`tools/${t}.html?v=${VERSION}`, { cache: "no-cache" }).then(r => r.ok ? r.text() : Promise.reject(r.status))
      .catch(err => `<div class="tab" id="${t}"><section class="msg-error">Could not load this tool (${err}).</section></div>`)));
  page.innerHTML = html.join("\n");
  for (const t of TOOLS) {
    const root = document.getElementById(t);
    if (!root) continue;
    restoreInputs(root);
    try { Toolkit.tools[t] && Toolkit.tools[t](); } catch (e) { console.error(`[toolkit] ${t} failed`, e); }
  }
  showTab();
  document.getElementById("clearSaved").onclick = () => { saveBlocked = true; clearTimeout(saveTimer); store.clearAll(); location.reload(); };
});
