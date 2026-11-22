/* ---------- water ---------- */
Toolkit.tools.water = () => {
  const $ = id => document.getElementById(id);
  const num = id => parseFloat($(id).value);
  const fmtL = x => (Math.round(x * 100) / 100).toLocaleString(undefined, { maximumFractionDigits: 2 }) + " L";
  const fmtP = x => (Math.floor(x * 1000) / 1000).toFixed(2) + " %";
  const ceilTo = (x, s) => Math.ceil((x - 1e-9) / s) * s;
  const floorTo = (x, s) => Math.floor((x + 1e-9) / s) * s;
  const row = (label, value, cls = "") => `<div class="row"><span>${label}</span><span class="${cls}">${value}</span></div>`;

  function calc() {
    const v1 = num("v1"), p1 = num("p1"), p2 = num("p2"), t = num("t"), step = num("step");
    const cap = parseFloat($("cap").value);
    const out = $("out");
    if ([v1, p1, p2, t].some(Number.isNaN) || v1 <= 0) { out.innerHTML = `<div class="msg warn">Enter the container's volume and purity.</div>`; return; }
    if (p1 >= t) { out.innerHTML = `<div class="msg ok">Already at or above ${t}% — nothing to add.</div>`; return; }
    if (p2 <= t) { out.innerHTML = `<div class="msg bad">The water you add must be purer than the target (${t}%). With ${p2}% you can never reach it.</div>`; return; }

    const ratio = (t - p1) / (p2 - t);
    const exact = v1 * ratio;
    const add = ceilTo(exact, step);
    const total = v1 + add;
    const finalP = (v1 * p1 + add * p2) / total;

    let html = `<div class="big">${fmtL(add)} <small>of ${p2}% water to add</small></div>` + pours(add * 1000);
    html += row("Exact amount", fmtL(exact));
    html += row("Total volume afterwards", fmtL(total));
    html += row("Resulting purity", fmtP(finalP), finalP >= t ? "ok" : "bad");
    html += row("Ratio", `${ratio.toFixed(3)} L clean water per 1 L of this water`);

    if (!Number.isNaN(cap) && cap > 0 && total > cap + 1e-9) {
      let keep = floorTo(cap / (1 + ratio), step);
      let fill = ceilTo(keep * ratio, step);
      while (keep > 0 && keep + fill > cap + 1e-9) { keep = floorTo(keep - step, step); fill = ceilTo(keep * ratio, step); }
      const pAfter = keep > 0 ? (keep * p1 + fill * p2) / (keep + fill) : p2;
      html += `<div class="msg warn" style="margin-top:12px">Doesn't fit in ${fmtL(cap)}.</div>`;
      html += row("Keep in container", fmtL(keep));
      html += row("Pour out / set aside first", fmtL(Math.max(0, v1 - keep)));
      html += row("Then add clean water", fmtL(fill)) + pours(fill * 1000);
      html += row("Purity", fmtP(pAfter), pAfter >= t ? "ok" : "bad");
    }
    out.innerHTML = html;
  }

  function addMixRow(l = "", p = "") {
    const tr = document.createElement("tr");
    tr.innerHTML = `<td><input type="number" min="0" step="0.1" value="${l}" class="ml"></td>
                    <td><input type="number" min="0" max="100" step="0.1" value="${p}" class="mp"></td>
                    <td><button class="x" title="Remove">✕</button></td>`;
    tr.querySelector(".x").onclick = () => { tr.remove(); mix(); };
    tr.querySelectorAll("input").forEach(i => i.addEventListener("input", mix));
    $("mixRows").appendChild(tr);
  }
  function mixTotals() {
    let vol = 0, sum = 0;
    document.querySelectorAll("#mixRows tr").forEach(tr => {
      const l = parseFloat(tr.querySelector(".ml").value), p = parseFloat(tr.querySelector(".mp").value);
      if (l > 0 && !Number.isNaN(p)) { vol += l; sum += l * p; }
    });
    return { vol, purity: vol > 0 ? sum / vol : NaN };
  }
  function mix() {
    // remember the table rows in this browser
    Toolkit.store.set("water-mix", [...document.querySelectorAll("#mixRows tr")].map(tr => [tr.querySelector(".ml").value, tr.querySelector(".mp").value]));
    const { vol, purity } = mixTotals();
    $("mixOut").innerHTML = vol > 0
      ? row("Combined volume", fmtL(vol)) + row("Combined purity", fmtP(purity), purity >= num("t") ? "ok" : "")
      : `<span class="note">Enter at least one container.</span>`;
  }

  function maxCalc() {
    const v1 = num("m_v1"), p1 = num("m_p1"), v2 = num("m_v2"), p2 = num("m_p2");
    const t = num("t"), step = num("step");
    const out = $("maxOut");
    if ([v1, p1, v2, p2, t].some(Number.isNaN) || v1 < 0 || v2 < 0) { out.innerHTML = `<div class="msg warn">Enter both amounts and purities.</div>`; return; }
    if (p1 >= t) {
      const tot = v1 + (p2 >= t ? v2 : 0);
      out.innerHTML = `<div class="big">${fmtL(tot)} <small>— both are already at or above ${t}%, mix everything</small></div>`; return;
    }
    if (p2 <= t) { out.innerHTML = `<div class="msg bad">The clean water must be purer than the target (${t}%), otherwise mixing can't reach it.</div>`; return; }
    const ratio = (t - p1) / (p2 - t);
    let useLow, useClean, limit;
    if (v1 * ratio <= v2) {
      useLow = v1; useClean = ceilTo(v1 * ratio, step); limit = "low-grade water";
      if (useClean > v2) { useLow = floorTo(v2 / ratio, step); useClean = ceilTo(useLow * ratio, step); }
    } else {
      useLow = floorTo(v2 / ratio, step); useClean = ceilTo(useLow * ratio, step); limit = "clean water";
      while (useLow > 0 && useClean > v2 + 1e-9) { useLow = floorTo(useLow - step, step); useClean = ceilTo(useLow * ratio, step); }
    }
    const total = useLow + useClean;
    const finalP = total > 0 ? (useLow * p1 + useClean * p2) / total : 0;
    const leftLow = Math.max(0, v1 - useLow), leftClean = Math.max(0, v2 - useClean);

    let html = `<div class="big">${fmtL(total)} <small>of ≥ ${t}% water</small></div>`;
    html += row("Use low-grade water", fmtL(useLow));
    html += row("Use clean water", fmtL(useClean)) + pours(useClean * 1000);
    html += row("Resulting purity", fmtP(finalP), finalP >= t ? "ok" : "bad");
    html += row("Limited by", limit);
    html += row("Left over (low-grade)", fmtL(leftLow));
    html += row("Left over (clean)", fmtL(leftClean));
    if (leftClean > 0) html += `<p class="note">Clean water left over is still ≥ ${t}% on its own, so in total you have ${fmtL(total + leftClean)} of high-quality water.</p>`;
    out.innerHTML = html;
  }

  $("addRow").onclick = () => { addMixRow(); mix(); };
  $("useMix").onclick = () => {
    const { vol, purity } = mixTotals();
    if (vol > 0) { $("v1").value = +vol.toFixed(2); $("p1").value = +purity.toFixed(3); calc(); window.scrollTo({ top: 0, behavior: "smooth" }); }
  };
  $("useMix3").onclick = () => {
    const { vol, purity } = mixTotals();
    if (vol > 0) { $("m_v1").value = +vol.toFixed(2); $("m_p1").value = +purity.toFixed(3); maxCalc(); $("maxOut").scrollIntoView({ behavior: "smooth", block: "center" }); }
  };
  ["v1","p1","p2","t","cap","step"].forEach(id => $(id).addEventListener("input", () => { calc(); maxCalc(); }));
  ["m_v1","m_p1","m_v2","m_p2"].forEach(id => $(id).addEventListener("input", maxCalc));

  function minerals() {
    const n = num("mn_tabs"), c = num("mn_conc"), size = num("mn_size");
    const out = $("mnOut");
    if (!(n > 0) || !(size > 0) || Number.isNaN(c)) { out.innerHTML = `<div class="msg warn">Enter the number of tablets and the plant's target concentration.</div>`; return; }
    if (c <= 0 || c > 100) { out.innerHTML = `<div class="msg bad">The concentration must be between 0 and 100%.</div>`; return; }
    const min = n * size;                 // mL of minerals
    const total = min / (c / 100);        // mL of finished mix
    const water = Math.ceil(total - min - 1e-6);   // pour whole mL, rounded up
    const ml = x => (Math.round(x * 10) / 10).toLocaleString(undefined, { maximumFractionDigits: 1 }) + " mL";
    let html = `<div class="big">${ml(water)} <small>of water to add${water >= 1000 ? ` (${fmtL(water / 1000)})` : ""}</small></div>` + pours(water);
    html += row("Minerals from tablets", ml(min));
    const mix = min + water, actual = 100 * min / mix;
    html += row("Finished mix", ml(mix) + (mix >= 1000 ? ` (${fmtL(mix / 1000)})` : ""));
    html += row("Concentration", (Math.round(actual * 100) / 100) + " %" + (Math.abs(actual - c) > 0.005 ? ` (target ${c} %)` : ""), "ok");
    html += row("Water per tablet", ml(water / n));
    out.innerHTML = html;
  }
  ["mn_tabs","mn_conc","mn_size"].forEach(id => $(id).addEventListener("input", minerals));
  Toolkit.store.get("water-mix", [[1, 98.2], [0.5, 96]]).forEach(([l, p]) => addMixRow(l, p));
  calc(); mix(); maxCalc(); minerals();
};
