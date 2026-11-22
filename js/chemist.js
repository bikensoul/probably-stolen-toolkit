/* ---------- chemist ---------- */
Toolkit.tools.chemist = () => {
  const root = document.getElementById("chemist");
  const $ = id => document.getElementById(id);
  const v = id => parseFloat($(id).value);
  const fmt = x => (Math.round(x * 100) / 100).toLocaleString(undefined, { maximumFractionDigits: 2 }) + " mL";

  // --- step checkboxes with progress, remembered in this browser ---
  root.querySelectorAll(".recipe").forEach(rec => {
    const key = "ps-recipe-" + rec.dataset.recipe;
    const boxes = [...rec.querySelectorAll(".step > label input[type=checkbox]")];
    let saved = [];
    try { saved = JSON.parse(localStorage.getItem(key) || "[]"); } catch (e) {}
    boxes.forEach((b, i) => b.checked = !!saved[i]);
    const refresh = () => {
      boxes.forEach(b => b.closest(".step").classList.toggle("done", b.checked));
      const n = boxes.filter(b => b.checked).length;
      rec.querySelector(".bar").style.width = (100 * n / boxes.length) + "%";
      try { localStorage.setItem(key, JSON.stringify(boxes.map(b => b.checked))); } catch (e) {}
    };
    boxes.forEach(b => b.addEventListener("change", refresh));
    rec.querySelector("[data-reset]").onclick = () => {
      boxes.forEach(b => b.checked = false);
      rec.querySelectorAll(".calc input, .calc select").forEach(i => { i.value = i.dataset.default ?? ""; });
      refresh(); calcAll();
    };
    refresh();
  });

  // --- caffeine calculators ---
  const up = x => Math.ceil(x - 1e-6) + " mL";   // what to pour: whole mL, rounded up
  // amount of bottle liquid needed to deliver `need` mL of acid/base at the bottle's concentration
  function bottle(need, concId, what) {
    const c = v(concId), pct = c > 0 && c <= 100 ? c : 100;
    const vol = need / (pct / 100);
    return (pct < 100
      ? `→ pour <b>${up(vol)}</b> from the bottle <span class="note" style="margin:0">(= ${fmt(need)} ${what} at ${pct}%)</span>`
      : `→ add <b>${up(need)}</b> ${what}`) + pours(vol);
  }
  function abOut(pre) {
    const prot = v(pre + "_prot"), left = v(pre + "_left");
    $(pre + "_ab").innerHTML = prot > 0 ? bottle(prot, pre + "_conc", "acid <i>or</i> base") : "–";
    $(pre + "_leftres").innerHTML = Number.isNaN(left) ? "–"
      : left > 0.5 ? bottle(1, pre + "_conc2", "of the other one") : `<span class="ok">OK, nothing more to add</span>`;
  }

  function batches() {
    const pct = v("c_mushPct"), cup = v("c_batch");
    const out = $("c_batchres");
    if (!(pct > 0) || !(cup > 0)) {
      out.innerHTML = `<span class="note" style="margin:0">Enter the coffee mush concentration and your cup size.</span>`;
      return;
    }
    const mush = cup * pct / 100;
    out.innerHTML = `→ add <b>${up(0.75 * mush)}</b> alcohol <span class="note" style="margin:0">(${fmt(cup)} cup holds ${fmt(mush)} mush × 0.75)</span>` + pours(0.75 * mush);
  }

  function calc() {
    const fat = v("c_fat"), prot = v("c_prot"), left = v("c_left");
    if (fat > 0) {
      const lc = v("c_lipoConc"), pct = lc > 0 && lc <= 100 ? lc : 100, need = fat / 8;
      $("c_lipo").innerHTML = (pct < 100
        ? `→ start with about <b>${up(need / (pct / 100))}</b> from the bottle <span class="note" style="margin:0">(= ${fmt(need)} Lipobond at ${pct}%)</span>`
        : `→ start with about <b>${up(need)}</b> Lipobond`) + pours(need / (pct / 100)) +
        `<div class="note" style="margin:2px 0 0">Rescan and add more if fat remains.</div>`;
    } else $("c_lipo").textContent = "–";
    batches();
    abOut("c");

    const ym = (v("y_sol") || 0) * (v("c_mushPct") || 0) / 100, yc = v("y_caf") || 0;
    const caf = 0.75 * ym + yc;
    $("y_out").innerHTML = caf > 0
      ? `<span class="big">${Math.floor(caf / 5)} pills</span> &nbsp;from ${fmt(caf)} caffeine` +
        (caf % 5 > 0.001 ? ` <span class="note">(${fmt(caf % 5)} left over, ${fmt(5 - caf % 5)} short of the next pill)</span>` : "")
      : `<span class="note">Enter the concentration in step 3 and your total solution to see how many pills you'll get.</span>`;
  }
  // --- dream dust ---
  function dust(pre, perDust) {
    const id = x => pre + "_" + x;
    const pct = v(id("pct")), cup = v(id("cup"));
    const out = $(id("batchres"));
    if (pct > 0 && cup > 0) {
      const mush = cup * pct / 100, alc = 5 * mush;
      out.innerHTML = `→ pour <b>${up(alc)}</b> alcohol <span class="note" style="margin:0">(${fmt(cup)} cup holds ${fmt(mush)} mush × 5)</span>` + pours(alc);
    } else {
      out.innerHTML = `<span class="note" style="margin:0">Enter the mush concentration and your cup size.</span>`;
    }
    abOut(pre);
    const ext = 0.5 * (v(id("ysol")) || 0) * (pct || 0) / 100;
    $(id("yout")).innerHTML = ext > 0
      ? `<span class="big">${Math.floor(ext / perDust + 1e-9)} dust</span> &nbsp;from ${fmt(ext)} extract` +
        (ext % perDust > 0.001 ? ` <span class="note">(${fmt(ext % perDust)} left over, ${fmt(perDust - ext % perDust)} short of the next one)</span>` : "")
      : `<span class="note">Enter the concentration in step 2 and your total blended caps to see how much dust you'll get.</span>`;
  }


  const calcAll = () => { calc(); dust("d", 2); dust("n", 4); };
  root.querySelectorAll(".recipe .calc input, .recipe .calc select").forEach(i => i.addEventListener("input", calcAll));
  calcAll();

  // --- recipe picker ---
  const pick = name => {
    root.querySelectorAll(".recipe").forEach(r => r.hidden = r.dataset.recipe !== name);
    root.querySelectorAll("#rpick button").forEach(b => b.classList.toggle("on", b.dataset.pick === name));
    try { localStorage.setItem("ps-recipe-current", name); } catch (e) {}
  };
  root.querySelectorAll("#rpick button").forEach(b => b.onclick = () => pick(b.dataset.pick));
  let cur = "caffeine";
  try { cur = localStorage.getItem("ps-recipe-current") || cur; } catch (e) {}
  pick(root.querySelector(`.recipe[data-recipe="${cur}"]`) ? cur : "caffeine");

  // --- purity price ---
  const GRADES = [
    { name: "Pure Grade",      min: 99, mod: 135,  col: "#7a3a72" },
    { name: "Pharma Grade",    min: 90, mod: 85,   col: "#a0506e" },
    { name: "Near Pharma",     min: 80, mod: 40,   col: "#c09aa6" },
    { name: "Street Standard", min: 60, mod: 0,    col: "#77708a" },
    { name: "Cut Product",     min: 45, mod: -45,  col: "#a86a4a" },
    { name: "Junk Grade",      min: 30, mod: -75,  col: "#d07a58" },
    { name: "Starch Grade",    min: 0,  mod: -95,  col: "#dca07a" },
  ];
  const range = i => i === 0 ? "99%+" : i === GRADES.length - 1 ? "< 30%" : `${GRADES[i].min}–${GRADES[i - 1].min}%`;
  function price() {
    const base = v("pp_base"), pur = v("pp_pur");
    const idx = Number.isNaN(pur) ? -1 : GRADES.findIndex(g => pur >= g.min);
    $("gradeTable").innerHTML = GRADES.map((g, i) =>
      `<tr class="${i === idx ? "hit" : ""}"><td><span class="sw" style="background:${g.col}"></span>${g.name}<br><span class="note" style="margin:0">${range(i)}</span></td>` +
      `<td class="${g.mod > 0 ? "ok" : g.mod < 0 ? "bad" : ""}">${g.mod > 0 ? "+" : ""}${g.mod === 0 ? "±0" : g.mod}%</td></tr>`).join("");
    if (idx < 0) { $("pp_out").innerHTML = `<span class="note">Enter base value and purity.</span>`; return; }
    const g = GRADES[idx];
    $("pp_out").innerHTML = base > 0
      ? `<div class="price">${Math.round(base * (1 + g.mod / 100))} <small class="note">Cr</small></div><div class="note" style="margin:2px 0 0">${g.name}, ${g.mod >= 0 ? "+" : ""}${g.mod}% of base</div>`
      : `<div class="note" style="margin:0">${g.name}, ${g.mod >= 0 ? "+" : ""}${g.mod}% of base value</div>`;
  }
  ["pp_base", "pp_pur"].forEach(id => $(id).addEventListener("input", price));
  price();
};
