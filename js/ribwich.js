/* ---------- ribwich appraisal ---------- */
Toolkit.tools.ribwich = () => {
  const root = document.getElementById("ribwich");
  const q = s => root.querySelector(s);
  const BASE = 150, MIN = 40;
  const HIGH = [1, 2, 5, 8, 21, 34], LOW = [7, 15, 18, 26, 31];
  const sign = n => (n > 0 ? "+" : n < 0 ? "−" : "±") + Math.abs(n);
  const pad = n => String(n).padStart(2, "0");

  function run(d) {
    if (!d || d.m < 1 || d.m > 12) return 0;
    if (d.y >= 425 && d.y <= 429) return 1;
    if (d.y >= 432 && d.y <= 438) return 2;
    return 0;
  }

  function update() {
    const fake = [], lines = [["Base value", BASE]];
    const packed = q("input[name=rpack]:checked").value === "ok";
    if (!packed) fake.push("packaging missing or torn open");

    // production date: month and year boxes
    const mTxt = q("#rMonth").value, yTxt = q("#rYear").value, missing = q("#rDateMissing").checked;
    q("#rMonth").disabled = q("#rYear").disabled = missing;
    const mm = parseFloat(mTxt), yy = parseFloat(yTxt);
    const filled = mTxt !== "" && yTxt !== "";
    const d = !missing && filled ? { m: mm, y: yy } : null;
    const validMonth = d && Number.isInteger(mm) && mm >= 1 && mm <= 12 && Number.isInteger(yy);
    const r = validMonth ? run(d) : 0;
    let dateMsg = "";
    if (missing) { fake.push("no production date"); dateMsg = `<span class="bad">No date → counterfeit</span>`; }
    else if (!filled) dateMsg = `<span class="note" style="margin:0">Enter month and year as printed, e.g. 01 / 433.</span>`;
    else if (!validMonth) { fake.push(`${mTxt}/${yTxt} is not a valid date`); dateMsg = `<span class="bad">${mTxt}/${yTxt} is not a valid date → counterfeit</span>`; }
    else if (!r) { fake.push(`date ${pad(mm)}/${yy} outside the production runs`); dateMsg = `<span class="bad">${pad(mm)}/${yy} is outside both production runs → counterfeit</span>`; }
    else {
      dateMsg = `<span class="ok">${pad(mm)}/${yy}: ${r === 1 ? "1st" : "2nd"} production run</span>`;
      if (r === 1) lines.push(["1st production run", 80]);
      if ((mm === 1 && yy === 425) || (mm === 12 && yy === 438)) { lines.push(["Very first / last month", 50]); dateMsg += ` <span class="ok">· historic month</span>`; }
    }
    q("#rDateRes").innerHTML = dateMsg;

    // packing facility
    const facMissing = q("#rFacMissing").checked;
    q("#rFac").disabled = facMissing;
    const facTxt = q("#rFac").value, fac = parseFloat(facTxt);
    let facMsg = "";
    if (facMissing) { fake.push("no packing facility number"); facMsg = `<span class="bad">No number → counterfeit</span>`; }
    else if (facTxt === "") facMsg = `<span class="note" style="margin:0">Enter the number from the label.</span>`;
    else if (!Number.isInteger(fac) || fac < 1 || fac > 35) { fake.push(`packing facility #${facTxt} doesn't exist`); facMsg = `<span class="bad">#${facTxt} is not a valid facility (1 – 35) → counterfeit</span>`; }
    else if (HIGH.includes(fac)) { lines.push([`High-quality facility #${pad(fac)}`, 50]); facMsg = `<span class="ok">#${pad(fac)}: high quality (+50)</span>`; }
    else if (LOW.includes(fac)) { lines.push([`Low-quality facility #${pad(fac)}`, -50]); facMsg = `<span class="bad">#${pad(fac)}: low quality (−50)</span>`; }
    else facMsg = `<span class="ok">#${pad(fac)}: regular facility (±0)</span>`;
    q("#rFacRes").innerHTML = facMsg;

    // deluxe, double patty
    const ses = q("#rSesame").checked, pic = q("#rPickles").checked;
    if (ses && pic) lines.push(["Deluxe Edition", 300]);
    else if (ses || pic) fake.push(`${ses ? "sesame bun" : "extra pickles"} without ${ses ? "extra pickles" : "sesame bun"}`);
    if (q("#rDouble").checked) lines.push(["Double meat patty", 800]);

    // logos
    if (q("input[name=rlogo]:checked").value !== "ok") fake.push("Davre logo wrong or missing");
    // Sticker: required and genuine on the 2nd run. The 1st run never has one,
    // so there "Wrong / fake" means a sticker is present at all.
    const sticker = q("input[name=rsticker]:checked").value;
    q("#rStickerNote").innerHTML = r === 1
      ? "<b>1st run:</b> these never have a sticker. No sticker → leave on Genuine. Any sticker → choose Wrong / fake."
      : "2nd-run Ribwiches must have the genuine sticker. 1st-run Ribwiches never have one.";
    if (sticker === "bad") fake.push(r === 1 ? "1st-run Ribwich with a sticker" : "Ribwich sticker wrong or missing");

    // result
    const sub = lines.reduce((a, l) => a + l[1], 0);
    const total = fake.length ? MIN : Math.max(MIN, sub);
    let html;
    if (fake.length) {
      q("#rFake").hidden = false;
      q("#rFake").innerHTML = `<b>${packed ? "Counterfeit" : "Packaging not intact"}: worth 40</b><ul>${fake.map(f => `<li>${f}</li>`).join("")}</ul>`;
      html = `<div class="line sum"><span>Total</span><span>${total}</span></div>`;
    } else {
      q("#rFake").hidden = true;
      html = lines.map(([n, v]) => `<div class="line"><span>${n}</span><span class="${v > 0 ? "pos" : v < 0 ? "neg" : "zero"}">${sign(v)}</span></div>`).join("");
      if (sub < MIN) html += `<div class="line"><span>Subtotal</span><span>${sub}</span></div><div class="line"><span>Minimum value applies</span><span>${MIN}</span></div>`;
      html += `<div class="line sum"><span>Total</span><span>${total}</span></div>`;
      if (!r || facTxt === "") html += `<p class="why">Enter the date and facility number to finish the check.</p>`;
    }
    q("#rBreakdown").innerHTML = html;
    q("#rTotal").innerHTML = `${total} <small>Credits</small>`;
    q("#rTotalMobile").textContent = total;
  }

  root.querySelectorAll("input").forEach(i => { i.addEventListener("change", update); i.addEventListener("input", update); });
  q("#rReset").onclick = () => {
    root.querySelectorAll("input[type=checkbox]").forEach(c => c.checked = false);
    ["rpack", "rlogo", "rsticker"].forEach(n => q(`input[name=${n}]`).checked = true);
    q("#rMonth").value = ""; q("#rYear").value = ""; q("#rFac").value = "";
    update(); document.getElementById("appraiser").scrollIntoView({ behavior: "smooth" });
  };
  root.querySelector(".mtotal a").onclick = e => { e.preventDefault(); q("#rTotalAnchor").scrollIntoView({ behavior: "smooth" }); };
  update();
};
