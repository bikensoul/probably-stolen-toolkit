/* ---------- appraiser tab: switches between the items to appraise ---------- */
Toolkit.tools.appraiser = () => {
  const root = document.getElementById("appraiser");
  const items = [...root.querySelectorAll(".appraisal")].map(el => el.dataset.item);
  items.forEach(i => { try { Toolkit.tools[i] && Toolkit.tools[i](); } catch (e) { console.error(`[toolkit] ${i} failed`, e); } });

  const pick = name => {
    if (!items.includes(name)) name = items[0];
    root.querySelectorAll(".appraisal").forEach(el => el.hidden = el.dataset.item !== name);
    root.querySelectorAll("#apick button").forEach(b => b.classList.toggle("on", b.dataset.pick === name));
    Toolkit.store.set("appraiserItem", name);
  };
  root.querySelectorAll("#apick button").forEach(b => b.onclick = () => pick(b.dataset.pick));
  Toolkit.pickAppraisal = pick;   // used by old links like #plasma
  pick(Toolkit.store.get("appraiserItem", items[0]));
};
