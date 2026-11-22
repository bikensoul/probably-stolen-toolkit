/* ---------- cybernetic hand appraisal ---------- */
Toolkit.tools.hands = () => {
  const root = document.getElementById("hands");
  const q = s => root.querySelector(s);
  const BASE = 100, MIN = 50;
  const MAT = { alu: ["Aluminum Alloy", 0], carbon: ["Carbon Composite", 50], gold: ["Gold Plated", 200] };
  const CTL = { emg: ["EMG", 0], emgplus: ["EMG+", 45], ni: ["Neural Interface", 120], none: ["Unspecified control", -60] };
  const sign = n => (n > 0 ? "+" : n < 0 ? "−" : "±") + Math.abs(n);

  // Set bonuses: every condition must match. "missing" lists what is not met.
  const SETS = [
    { name: "Tactical", bonus: 100, checks: s => [
      [s.mat === "carbon", "Carbon Composite"],
      [s.ctl === "emgplus" || s.ctl === "ni", "EMG+ or Neural Interface"],
      [s.cond === 0, "no wear or damage"],
      [s.armored, "Armored"],
      [s.blade, "Blade"],
    ] },
    { name: "Deluxe", bonus: 200, checks: s => [
      [s.mat === "gold", "Gold Plated"],
      [s.ctl === "ni", "Neural Interface"],
      [s.cond === 0, "no wear or damage"],
    ] },
  ];

  function state() {
    return {
      mat: q("input[name=hmat]:checked").value,
      cond: parseInt(q("input[name=hcond]:checked").value),
      ctl: q("input[name=hctl]:checked").value,
      armored: q("#hArmored").checked,
      blade: q("#hBlade").checked,
    };
  }

  function update() {
    const s = state();
    const lines = [["Base value", BASE]];
    if (MAT[s.mat][1]) lines.push(MAT[s.mat]);
    if (s.cond) lines.push([s.cond === -35 ? "Wears" : "Damages", s.cond]);
    if (CTL[s.ctl][1]) lines.push(CTL[s.ctl]);
    if (s.armored) lines.push(["Armored", 50]);
    if (s.blade) lines.push(["Blade", 80]);

    // A set counts when all its conditions match. Show the closest miss as a hint.
    let why = "", best = null;
    for (const set of SETS) {
      const checks = set.checks(s), missing = checks.filter(c => !c[0]).map(c => c[1]);
      if (!missing.length) { lines.push([`${set.name} set bonus`, set.bonus]); why += `<b>${set.name} set bonus applies.</b> `; }
      else if (missing.length < checks.length && (!best || missing.length < best.missing.length)) best = { set, missing };
    }
    if (!why && best && best.missing.length <= 2)
      why = `<b>${best.set.name} set (+${best.set.bonus})</b> would also need: ${best.missing.join(", ")}.`;

    const sub = lines.reduce((a, l) => a + l[1], 0);
    const total = Math.max(MIN, sub);
    let html = lines.map(([n, v]) => `<div class="line"><span>${n}</span><span class="${v > 0 ? "pos" : v < 0 ? "neg" : "zero"}">${sign(v)}</span></div>`).join("");
    if (sub < MIN) {
      html += `<div class="line"><span>Subtotal</span><span>${sub}</span></div>`;
      html += `<div class="line"><span>Minimum value applies</span><span>${MIN}</span></div>`;
    }
    html += `<div class="line sum"><span>Total</span><span>${total}</span></div>`;
    q("#hBreakdown").innerHTML = html;
    q("#hTotal").innerHTML = `${total} <small>Credits</small>`;
    q("#hTotalMobile").textContent = total;
    q("#hWhy").innerHTML = why;
  }

  root.querySelectorAll("input").forEach(i => i.addEventListener("change", update));
  q("#hReset").onclick = () => {
    root.querySelectorAll("input[type=checkbox]").forEach(c => c.checked = false);
    ["hmat", "hcond", "hctl"].forEach(n => q(`input[name=${n}]`).checked = true);
    update(); document.getElementById("appraiser").scrollIntoView({ behavior: "smooth" });
  };
  root.querySelector(".mtotal a").onclick = e => { e.preventDefault(); q("#hTotalAnchor").scrollIntoView({ behavior: "smooth" }); };
  update();
};
