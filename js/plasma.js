/* ---------- plasma ---------- */
Toolkit.tools.plasma = () => {
  const root = document.getElementById("plasma");
  const q = s => root.querySelector(s);
  const BASE = 300, MIN = 90;
  const MFR = {
    WLD: { bonus: 60,  colors: ["low", "standard"], cond: s => true, condText: "any condition" },
    ZHS: { bonus: 120, colors: ["standard"], cond: s => !s.wear && !s.cracked && !s.screws, condText: "no condition flaws (Reinforced is allowed)" },
    RNR: { bonus: 120, colors: ["standard"], cond: s => !s.cracked, condText: "no cracks" },
    IGN: { bonus: 750, colors: ["high"], cond: s => !s.wear && !s.cracked && !s.screws && !s.reinforced, condText: "no condition attributes at all (not even Reinforced)" },
  };
  const COLOR = { standard: ["Standard colour", 0], low: ["Low-grade colour", -150], high: ["High-grade colour", 150] };
  const COLOR_NAME = { standard: "Standard", low: "Low-grade", high: "High-grade" };
  const sign = n => (n > 0 ? "+" : n < 0 ? "−" : "±") + Math.abs(n);

  function state() {
    return {
      wear: parseInt(q('input[name=wear]:checked').value),
      cracked: q('#cracked').checked,
      screws: q('#screws').checked,
      reinforced: q('#reinforced').checked,
      color: q('input[name=color]:checked').value,
      mfr: q('input[name=mfr]:checked').value,
    };
  }

  function update() {
    const s = state();
    const lines = [["Base value", BASE]];
    if (s.wear) lines.push([s.wear === -45 ? "Light wear" : "Heavy wear", s.wear]);
    if (s.cracked) lines.push(["Cracked", -150]);
    if (s.screws) lines.push(["Exposed screws", -30]);
    if (s.reinforced) lines.push(["Reinforced", 60]);
    if (COLOR[s.color][1]) lines.push(COLOR[s.color]);

    let why = "";
    if (s.mfr !== "none") {
      const m = MFR[s.mfr];
      const colorOk = m.colors.includes(s.color);
      const condOk = m.cond(s);
      if (colorOk && condOk) {
        lines.push([`${s.mfr} manufacturer bonus`, m.bonus]);
        why = `<b>${s.mfr} bonus applies</b> — profile matches.`;
      } else {
        lines.push([`${s.mfr} bonus (doesn't match)`, 0]);
        const reasons = [];
        if (!colorOk) reasons.push(`colour must be ${m.colors.map(c => COLOR_NAME[c]).join(" or ")}, this one is ${COLOR_NAME[s.color]}`);
        if (!condOk) reasons.push(`${s.mfr} requires ${m.condText}`);
        why = `<b>No ${s.mfr} bonus:</b> ${reasons.join("; ")}. A mismatch can also hint at a fake seal.`;
      }
    }

    const sub = lines.reduce((a, l) => a + l[1], 0);
    const total = Math.max(MIN, sub);
    let html = lines.map(([n, v]) => `<div class="line"><span>${n}</span><span class="${v > 0 ? "pos" : v < 0 ? "neg" : "zero"}">${sign(v)}</span></div>`).join("");
    if (sub < MIN) {
      html += `<div class="line"><span>Subtotal</span><span>${sub}</span></div>`;
      html += `<div class="line"><span>Minimum value applies</span><span>${MIN}</span></div>`;
    }
    html += `<div class="line sum"><span>Total</span><span>${total}</span></div>`;
    q('#pBreakdown').innerHTML = html;
    q('#pTotal').innerHTML = `${total} <small>Credits</small>`;
    q('#pTotalMobile').textContent = total;
    q('#pWhy').innerHTML = why;
  }

  root.querySelectorAll('input').forEach(i => i.addEventListener('change', update));
  q('#pReset').onclick = () => {
    root.querySelectorAll('input[type=checkbox]').forEach(c => c.checked = false);
    ['wear', 'color', 'mfr'].forEach(n => q(`input[name=${n}]`).checked = true);
    update(); window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  root.querySelector('.mtotal a').onclick = e => { e.preventDefault(); q('#pTotalAnchor').scrollIntoView({ behavior: 'smooth' }); };
  update();
};
