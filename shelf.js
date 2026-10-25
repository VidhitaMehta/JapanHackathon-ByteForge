/* =========================================================================
   Module 2 — Shelf-Life Check (food) / Registration Pre-check (cosmetics)
   ========================================================================= */
(function () {
  const { esc, t, $, $$, source, showTip, hideTip } = ID.ui;

  /* ---------- Port route: fills the shipping and clearance days ---------- */
  const SH = () => ID.SHIPPING;
  function applyRoute(s) {
    const sc = SH().scenarios.find((x) => x.id === (s.route.scenario || "typical"));
    s.transit = sc.sea; s.clearance = sc.clear;
  }
  function topStates() {
    const rows = ID.rowsForCategory(ID.STATE_DATA, "food");
    const flags = ID.stateFlags(ID.state.label.result);
    return ID.scoreStates(rows, ID.defaultWeights(ID.availableIndicators(rows)))
      .filter((r) => r.coverage && r.coverage.complete && !flags.excluded[r.state]).slice(0, 5).map((r) => r.state);
  }
  function routeCard(s, p, min) {
    const r = s.route || {}, jp = r.jpPort || "tyo", inp = r.inPort || "nsa", scn = r.scenario || "typical";
    const port = SH().inPorts.find((x) => x.id === inp);
    const tops = topStates(), best = ID.suggestPort(tops);
    const opt = (list, cur) => list.map((x) => `<option value="${x.id}" ${x.id === cur ? "selected" : ""}>${t(x.ja, x.en)}</option>`).join("");
    const rowsHtml = SH().scenarios.map((sc) => {
      const q = ID.shelfLife({ mfg: p.mfg, exp: p.exp, dispatch: s.dispatch, transitDays: sc.sea, clearanceDays: sc.clear, minPercent: min });
      const res = q.error ? `<span class="muted">—</span>` : q.pass ? `<span class="status good">✓ ${q.pct}%</span>` : `<span class="status bad">✕ ${q.pct}%</span>`;
      return `<tr class="${sc.id === scn ? "hl" : ""}"><td><b>${t(sc.ja, sc.en)}</b></td><td class="num">${sc.sea}</td><td class="num">${sc.clear}</td><td>${q.error ? "—" : q.clearanceDate}</td><td>${res}</td><td>${q.error ? "—" : q.latestDispatch}</td></tr>`;
    }).join("");
    return `<div class="card"><p class="section-title">${t("輸送ルート（港）", "Shipping route (ports)")}</p>
      <div class="grid3">
        <label class="stack"><span>${t("日本の積出港", "Port in Japan")}</span><select data-route="jpPort">${opt(SH().jpPorts, jp)}</select></label>
        <label class="stack"><span>${t("インドの到着港", "Port in India")}</span><select data-route="inPort">${opt(SH().inPorts, inp)}</select></label>
        <label class="stack"><span>${t("想定", "Scenario")}</span><select data-route="scenario">${opt(SH().scenarios, scn)}</select></label>
      </div>
      <p class="small" style="margin:10px 0 0">${t("近くの市場", "Nearby markets")}: ${esc(port.serves.join(", "))}</p>
      ${best && best.id !== inp ? `<div class="notice info" style="margin-top:10px">${t("進出州マップの上位州に近い港", "Port closest to your top launch states")}: <b>${t(SH().inPorts.find((x) => x.id === best.id).ja, SH().inPorts.find((x) => x.id === best.id).en)}</b> (${esc(best.hits.join(", "))}) <button class="btn sm" data-port="${best.id}">${t("この港にする", "Use this port")}</button></div>`
        : best ? `<p class="small" style="margin:8px 0 0"><span class="status good">✓ ${t("上位州に近い港です", "Close to your top launch states")}</span> (${esc(best.hits.join(", "))})</p>` : ""}
      <table style="margin-top:14px"><thead><tr><th>${t("想定", "Scenario")}</th><th class="num">${t("海上（日）", "Sea (days)")}</th><th class="num">${t("通関（日）", "Clearance (days)")}</th><th>${t("通関日", "Clears")}</th><th>${t("60%ルール", "60% rule")}</th><th>${t("最終出荷可能日", "Latest safe dispatch")}</th></tr></thead><tbody>${rowsHtml}</tbody></table>
      <p class="small muted" style="margin:10px 0 0">${t("想定を選ぶと下の日数に入ります（手入力も可）。「遅れた場合」でも合格なら安心です。資料には港ごとの日数がないため、全ルートで同じ範囲を使っています。", "Choosing a scenario fills the days below (you can still type your own). If you still pass in the 'Delayed' case, you are safe. Sources do not give days for each port pair, so every route uses the same range.")}</p>
      <div class="row" style="margin-top:6px;gap:6px;flex-wrap:wrap">${source("SEA_TRANSIT", SH().lastChecked)}${source("FSSAI_CHARTER", SH().lastChecked)}</div>
    </div>`;
  }

  /* Heat-sensitive product arriving in India's hottest months? */
  function heatNote(r) {
    const h = ID.heatCheck(ID.state.label.text, ID.state.product.name, "food");
    if (!h.sensitive) return "";
    const names = h.flags.map((f) => t(f.ja, f.en)).join("、 ");
    return ID.inHotSeason(r.clearanceDate)
      ? `<div class="notice warn" style="margin-top:14px">🌡 ${t(`暑さに弱い製品（${names}）が、最も暑い時期（4〜6月）にインドに到着します。冷蔵コンテナを使うか、10〜2月に到着するよう出荷を調整してください。`, `This heat-sensitive product (${names}) arrives in India's hottest months (April–June). Use a refrigerated container, or ship so it arrives between October and February.`)} <a href="#label">${t("詳しく", "Details")} →</a></div>`
      : `<div class="notice info" style="margin-top:14px">🌡 ${t(`暑さに弱い製品（${names}）ですが、到着は最も暑い時期（4〜6月）を避けています。`, `Heat-sensitive product (${names}), but it arrives outside the hottest months (April–June).`)}</div>`;
  }

  function food(el) {
    const p = ID.state.product, s = ID.state.shelf;
    const min = s.min ?? ID.SHELF_RULE.minPercent;
    const r = ID.shelfLife({ mfg: p.mfg, exp: p.exp, dispatch: s.dispatch, transitDays: s.transit, clearanceDays: s.clearance, minPercent: min });

    let result;
    if (r.error) {
      result = `<div class="notice warn">${t("上部の製品情報に製造日と賞味期限、ここに出荷予定日を YYYY/MM/DD 形式で入力してください。", "Enter the mfg and expiry dates in the product bar, and the planned dispatch date here, as YYYY/MM/DD.")}</div>`;
    } else {
      const pre = Math.max(0, r.daysBeforeDispatch), log = r.logistics, rem = Math.max(0, r.remaining);
      const tot = Math.max(r.total, pre + log + rem);
      const w = (d) => (d / tot) * 100;
      const cutX = ((r.total - r.needDays) / tot) * 100;
      result = `
        <div class="grid3">
          <div class="kpi"><div class="l">${t("通関日", "Clears customs")}</div><div class="v">${r.clearanceDate}</div></div>
          <div class="kpi"><div class="l">${t("通関時の残り期間", "Remaining at clearance")}</div><div class="v">${r.remaining} ${t("日", "days")} (${r.pct}%)</div></div>
          <div class="kpi"><div class="l">${t("最終出荷可能日", "Latest safe dispatch")}</div><div class="v">${r.latestDispatch}</div></div>
        </div>
        <p style="margin:16px 0 0">${r.pass
          ? `<span class="status good">✓ ${t("合格", "PASS")}</span> ${t(`基準 ${min}% 以上（必要 ${r.needDays} 日）`, `meets the ${min}% minimum (${r.needDays} days needed)`)}`
          : `<span class="status bad">✕ ${t("不合格", "FAIL")}</span> ${t(`残り期間が基準 ${min}% 未満です。${r.latestDispatch} までに出荷してください。`, `below the ${min}% minimum. Dispatch by ${r.latestDispatch}.`)}`}</p>
        ${heatNote(r)}
        <div class="timeline" role="img" aria-label="Shelf-life timeline">
          <div class="seg-t" style="width:${w(pre)}%;background:var(--nodata)" data-tip="${esc(`${p.mfg} → ${s.dispatch}: ${pre} days before dispatch`)}"></div>
          <div class="seg-t" style="width:${w(log)}%;background:var(--c2)" data-tip="${esc(`Shipping + clearance: ${log} days`)}"></div>
          <div class="seg-t" style="width:${w(rem)}%;background:${r.pass ? "var(--good)" : "var(--bad)"}" data-tip="${esc(`Remaining after clearance: ${r.remaining} days (${r.pct}%)`)}"></div>
          <div class="tick" style="left:${cutX}%"><span class="tick-label">${t("通関期限", "Latest clearance")} ${r.latestClearance}</span></div>
        </div>
        <div class="legend">
          <span><i style="background:var(--nodata)"></i>${t("出荷前", "Before dispatch")}</span>
          <span><i style="background:var(--c2)"></i>${t("輸送＋通関", "Shipping + clearance")}</span>
          <span><i style="background:${r.pass ? "var(--good)" : "var(--bad)"}"></i>${t("通関後の残り期間", "Remaining after clearance")}</span>
        </div>`;
    }

    el.innerHTML = `
      <div class="card head"><div><h2>${t("賞味期限チェック", "Shelf-Life Check")}</h2>
        <p>${t(ID.SHELF_RULE.ja, ID.SHELF_RULE.en)}</p></div>${source(ID.SHELF_RULE.source, ID.SHELF_RULE.lastChecked)}</div>
      ${routeCard(s, p, min)}
      <div class="card">
        <div class="grid3">
          <label class="stack"><span>${t("出荷予定日（日本）", "Planned dispatch (Japan)")}</span><input id="sl-dispatch" placeholder="YYYY/MM/DD" value="${esc(s.dispatch)}" /></label>
          <label class="stack"><span>${t("海上輸送日数", "Sea transit days")}</span><input id="sl-transit" type="number" min="0" value="${esc(s.transit)}" /></label>
          <label class="stack"><span>${t("通関・検査日数", "Clearance + testing days")}</span><input id="sl-clear" type="number" min="0" value="${esc(s.clearance)}" /></label>
        </div>
        <p class="small muted" style="margin:10px 0 0">${t("製造日", "Mfg")}: ${esc(p.mfg || "—")} · ${t("賞味期限", "Expiry")}: ${esc(p.exp || "—")} · ${t("基準", "Minimum")}: <input id="sl-min" type="number" min="1" max="100" value="${min}" style="width:70px;display:inline-block;padding:3px 6px" />%</p>
      </div>
      <div class="card">${result}</div>
      <div class="notice info small">${t(ID.SHELF_RULE.note.ja, ID.SHELF_RULE.note.en)}</div>`;

    const bind = (id, key, num) => $(id).addEventListener("change", (e) => { s[key] = num ? +e.target.value : e.target.value.trim(); ID.save("shelf"); ID.rerender(); });
    $$("[data-route]", el).forEach((sel) => sel.addEventListener("change", () => { s.route = s.route || {}; s.route[sel.dataset.route] = sel.value; applyRoute(s); ID.save("shelf"); ID.rerender(); }));
    $$("[data-port]", el).forEach((b) => b.addEventListener("click", () => { s.route = s.route || {}; s.route.inPort = b.dataset.port; ID.save("shelf"); ID.rerender(); }));
    bind("#sl-dispatch", "dispatch"); bind("#sl-transit", "transit", 1); bind("#sl-clear", "clearance", 1); bind("#sl-min", "min", 1);
    $$("[data-tip]", el).forEach((d) => { d.addEventListener("mouseenter", (e) => showTip(esc(d.dataset.tip), e)); d.addEventListener("mouseleave", hideTip); });
  }

  function cosmetics(el) {
    const s = ID.state.shelf; s.cos = s.cos || {};
    const done = ID.COS_CHECKLIST.filter((c) => s.cos[c.id]).length;
    el.innerHTML = `
      <div class="card head"><div><h2>${t("CDSCO登録前チェック", "Registration Pre-check")}</h2>
        <p>${t(ID.COS_RULE.ja, ID.COS_RULE.en)}</p></div>${source(ID.COS_RULE.source, ID.COS_RULE.lastChecked)}</div>
      <div class="card"><p class="section-title">${t("申請前に確認（CDSCOが公表するよくある不備に基づく）", "Check before filing (based on CDSCO's published common errors)")}</p>
        <ul class="steps">${ID.COS_CHECKLIST.map((c) => `<li class="${s.cos[c.id] ? "done" : ""}"><input type="checkbox" data-c="${c.id}" ${s.cos[c.id] ? "checked" : ""}/><div class="what">${t(c.ja, c.en)}</div><div></div></li>`).join("")}</ul>
        <p style="margin:14px 0 0">${done === ID.COS_CHECKLIST.length
          ? `<span class="status good">✓ ${t("提出準備完了", "Ready to file")}</span>`
          : `<span class="status warn">! ${t(`残り ${ID.COS_CHECKLIST.length - done} 項目`, `${ID.COS_CHECKLIST.length - done} item(s) missing`)}</span>`}</p>
      </div>`;
    $$("[data-c]", el).forEach((c) => c.addEventListener("change", () => { s.cos[c.dataset.c] = c.checked; ID.save("shelf"); ID.rerender(); }));
  }

  ID.views.shelf = { render(el) { (ID.state.product.category === "food" ? food : cosmetics)(el); } };
})();
