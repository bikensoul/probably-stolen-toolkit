/* ---------- projector ---------- */
Toolkit.tools.projector = () => {
  const $ = id => document.getElementById(id);
  const n = id => { const x = parseFloat($(id).value); return Number.isNaN(x) ? 0 : x; };
  const STEPS = [
    [200, "+1 random customer per day"],
    [250, "+1 random customer per day"],
    [300, "+10% customer budget"],
    [400, "Second customer mix (display-case buyers at the 145 Cr step or higher)"],
    [450, "+25% customer budget"],
    [500, "+1 random customer per day"],
    [600, "+50% customer budget"],
    [650, "Third customer mix"],
    [750, "+75% customer budget"],
    [900, "+100% customer budget"],
  ];
  function update() {
    const base = 250 + 150 * n("pj_reno"), perf = n("pj_perf"), qual = n("pj_qual"), eff = n("pj_eff");
    const pctExact = 100 * (1 + 0.25 * perf / 100 + 0.5 * qual / 100);
    const bonus = Math.max(0, Math.floor(pctExact + 1e-9));
    const energy = Math.max(0, 16 * (1 - eff / 100));
    const total = base + bonus;
    $("pj_bonus").textContent = "+" + bonus;
    $("pj_pct").textContent = `${(Math.round(pctExact * 10) / 10)}% of the base 100`;
    $("pj_total").textContent = total;
    $("pj_energy").textContent = Math.round(energy) + "/day";

    const max = Math.max(1000, total);
    const pct = x => (100 * x / max) + "%";
    let bar = `<div class="seg base" style="left:0;width:${pct(Math.min(base, max))}">${base >= 120 ? "Base" : ""}</div>`;
    if (bonus > 0) bar += `<div class="seg proj" style="left:${pct(base)};width:${pct(bonus)}">${bonus >= 80 ? "Projector" : ""}</div>`;
    bar += STEPS.map(([v], i) => `<div class="tick ${total >= v ? "hit" : ""} ${i % 2 ? "low" : ""}" style="left:${pct(v)}">${v}</div>`).join("");
    $("pj_bar").innerHTML = bar;

    $("pj_perks").innerHTML = STEPS.map(([v, t]) => `<tr class="${total >= v ? "hit" : "miss"}"><td>${v}+</td><td>${t}</td></tr>`).join("");

    const next = STEPS.find(([v]) => total < v);
    if (!next) { $("pj_next").innerHTML = `<span class="ok">All attractiveness perks reached.</span>`; return; }
    const need = next[0] - total;
    $("pj_next").innerHTML = `Next step: <b>${next[0]}</b> (${next[1]}), <b>${need}</b> points away. ` +
      `From the projector alone that's <b>+${Math.ceil(2 * need)}%</b> more Quality or <b>+${Math.ceil(4 * need)}%</b> more Performance.`;
  }
  ["pj_reno", "pj_perf", "pj_qual", "pj_eff"].forEach(id => $(id).addEventListener("input", update));
  update();
};
