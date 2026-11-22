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
  // zoom: a small button on each picture opens it full size
  root.querySelectorAll("label.opt img").forEach(img => {
    const btn = document.createElement("button");
    btn.type = "button"; btn.className = "zoom"; btn.title = "Show larger"; btn.textContent = "⤢";
    btn.addEventListener("click", e => {
      e.preventDefault(); e.stopPropagation();
      const name = img.closest("label").querySelector(".name")?.firstChild?.textContent.trim() || "";
      const view = document.createElement("div");
      view.className = "zoomview";
      view.innerHTML = `<img src="${img.getAttribute("src")}" alt=""><span>${name} · tap to close</span>`;
      const close = () => { view.remove(); document.removeEventListener("keydown", esc); };
      const esc = ev => { if (ev.key === "Escape") close(); };
      view.onclick = close; document.addEventListener("keydown", esc);
      document.body.appendChild(view);
    });
    img.closest("label").appendChild(btn);
  });
  Toolkit.pickAppraisal = pick;   // used by old links like #plasma
  pick(Toolkit.store.get("appraiserItem", items[0]));
};
