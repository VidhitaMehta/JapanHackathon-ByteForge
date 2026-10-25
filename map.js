/* =========================================================================
   Module 4 — Launch Map
   Score(state) = sum(weight x indicator scaled 0-100 across states)
   Drawn as a real map of India's states (DataMeet outlines, CC BY 4.0).
   ========================================================================= */
(function () {
  const { esc, t, $, $$, showTip, hideTip } = ID.ui;

  // Sequential blue ramp (light = low score, dark = high score)
  const RAMP = ["#cde2fb", "#b7d3f6", "#9ec5f4", "#86b6ef", "#6da7ec", "#5598e7", "#3987e5", "#2a78d6", "#256abf", "#1c5cab", "#184f95", "#104281", "#0d366b"];
  const color = (score) => RAMP[Math.min(RAMP.length - 1, Math.floor((score / 100) * (RAMP.length - 1) + 0.0001))];
  const darkText = (score) => (score / 100) * (RAMP.length - 1) < 6;

  const ind = (k) => ID.INDICATORS.find((i) => i.key === k);
  /* Moving one slider rebalances the other AVAILABLE indicators so the total stays 100. */
  function setWeight(w, key, val, keys) {
    val = Math.max(0, Math.min(100, val));
    const others = keys.filter((k) => k !== key);
    const rest = 100 - val;
    const sumOthers = others.reduce((a, k) => a + w[k], 0);
    w[key] = val;
    others.forEach((k) => (w[k] = sumOthers > 0 ? (w[k] * rest) / sumOthers : rest / others.length));
    others.forEach((k) => (w[k] = Math.round(w[k] * 10) / 10));
    const drift = Math.round((100 - Object.values(w).reduce((a, b) => a + b, 0)) * 10) / 10;
    if (drift && others.length) { const big = others.sort((a, b) => w[b] - w[a])[0]; w[big] = Math.round((w[big] + drift) * 10) / 10; }
  }

  function toCsv(rows) {
    const keys = ID.CSV_COLUMNS;
    return [keys.join(","), ...rows.map((r) => keys.map((k) => (r[k] === null || r[k] === undefined ? "" : r[k])).join(","))].join("\n");
  }
  function download(name, text) {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob(["﻿" + text], { type: "text/csv;charset=utf-8" }));
    a.download = name; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  }

  ID.views.map = {
    render(el) {
      const m = ID.state.map;
      const cat = ID.state.product.category;
      m.data = m.data || ID.STATE_DATA;
      const rows = ID.rowsForCategory(m.data, cat);
      const avail = ID.availableIndicators(rows);
      const sig = cat + "|" + avail.join(",");
      if (!m.weights || m.wSig !== sig) { m.weights = ID.defaultWeights(avail); m.wSig = sig; }
      const flags = cat === "food" ? ID.stateFlags(ID.state.label.result) : { excluded: {}, caution: {}, reasons: [] };
      const R = ID.STATE_RULES;

      el.innerHTML = `
        <div class="card head"><div><h2>${t("進出州マップ", "Launch Map")}</h2>
          <p>${t("所得水準・ネット購買・日本製品への関心・日系企業の拠点数を州ごとに0〜100に換算し、重みを掛けて合計します。製品に牛肉や酒類が含まれる場合は、州のルールも反映します。これは「市場の準備度」であり、売上予測ではありません。", "Income level, online shopping, interest in Japanese products and Japanese business presence are scaled 0–100 across states, weighted and added up. If the product contains beef or liquor, state rules are applied too. This measures market readiness, not predicted sales.")}</p></div></div>
        <div id="mp-rules"></div>
        <div id="mp-banner"></div>
        <div class="grid2">
          <div class="card">
            <svg class="indiamap" id="mp-svg" viewBox="0 0 ${ID.INDIA_MAP.width} ${ID.INDIA_MAP.height}" role="img" aria-label="Map of India's states coloured by score"></svg>
            <p class="small muted" style="margin:4px 0 0">${t("地図：DataMeet India（CC BY 4.0）を簡略化", "Map outlines: DataMeet India (CC BY 4.0), simplified")}</p>
            <div class="row small muted" style="margin-top:10px"><span>0</span><div class="ramp" style="flex:1"></div><span>100</span></div>
            <div class="legend">
              <span><i style="background:var(--nodata)"></i>${t("データ不足", "Not enough data")}</span>
              ${flags.reasons.includes("beef") ? `<span><i style="background:#f3dcdc;outline:2px solid var(--bad)"></i>${t("州のルールで除外", "Left out by state rule")}</span>` : ""}
              ${flags.reasons.includes("alcohol") ? `<span><i style="background:#fff;outline:2px solid var(--warn)"></i>${t("要注意（禁酒州）", "Caution (prohibition)")}</span>` : ""}
            </div>
          </div>
          <div class="card"><p class="section-title">${t("重み（合計100%）", "Weights (total 100%)")}</p>
            ${ID.INDICATORS.map((i) => `<div class="slider-row" style="${avail.includes(i.key) ? "" : "opacity:.45"}"><span>${t(i.ja, i.en)}${avail.includes(i.key) ? "" : ` <span class="small">(${t("データ未入力", "no data yet")})</span>`}</span><input type="range" min="0" max="100" step="1" data-w="${i.key}" aria-label="${esc(i.en)} weight" ${avail.includes(i.key) ? "" : "disabled"} /><b class="num" data-wv="${i.key}"></b></div>`).join("")}
            <label class="row small" style="margin-top:12px"><input type="checkbox" id="mp-partial" style="width:auto" ${m.showPartial ? "checked" : ""}/> ${t("データが一部不足している州も順位に含める", "Also rank states with incomplete data")}</label>
            <div class="row" style="margin-top:12px">
              <button class="btn sm" id="mp-reset-w">${t("重みを初期値に", "Reset weights")}</button>
              <label class="btn sm">${t("CSVを読込", "Upload CSV")}<input type="file" accept=".csv,text/csv" id="mp-csv" hidden /></label>
              <button class="btn sm" id="mp-dl">${t("データをCSVでダウンロード", "Download data as CSV")}</button>
              ${m.uploaded ? `<button class="btn sm" id="mp-sample">${t("内蔵データに戻す", "Back to built-in data")}</button>` : ""}
            </div>
            <div id="mp-err"></div>
          </div>
        </div>
        <div id="mp-detail"></div>
        <div class="card"><p class="section-title">${t("おすすめの州（上位10）", "Recommended states (top 10)")}</p>
          <table><thead><tr><th class="num">#</th><th>${t("州", "State")}</th><th class="num">${t("スコア", "Score")}</th><th>${t("主な要因", "Main drivers")}</th><th>${t("注意", "Notes")}</th></tr></thead><tbody id="mp-rows"></tbody></table>
          <p class="small muted" id="mp-left" style="margin:10px 0 0"></p></div>`;

      const refresh = (activeKey) => {
        const scored = ID.scoreStates(rows, m.weights);
        const isEx = (s) => !!flags.excluded[s.state];
        const ranked = scored.filter((s) => !isEx(s) && s.coverage.have > 0 && (s.coverage.complete || m.showPartial));
        m.scored = ranked;
        const byName = Object.fromEntries(scored.map((s) => [s.state.toLowerCase(), s]));
        const rank = Object.fromEntries(ranked.map((s, i) => [s.state.toLowerCase(), i + 1]));
        const offMap = scored.filter((s) => !ID.TILES.some((tl) => tl[1].toLowerCase() === s.state.toLowerCase()));
        const sel = m.selected && byName[m.selected.toLowerCase()];

        /* State rules in force for this product */
        const ruleLines = [];
        if (flags.reasons.includes("beef")) ruleLines.push(`<li>${t(R.beef.ja, R.beef.en)} ${t("除外", "Left out")}: ${Object.keys(flags.excluded).length} ${t("州", "states")}. <span class="small muted">${esc(R.beef.source)}</span></li>`);
        if (flags.reasons.includes("alcohol")) ruleLines.push(`<li>${t(R.alcohol.ja, R.alcohol.en)} (${esc(R.alcohol.prohibition.join(", "))}) <span class="small muted">${esc(R.alcohol.source)}</span></li>`);
        $("#mp-rules").innerHTML = ruleLines.length
          ? `<div class="notice warn" style="margin-bottom:16px"><b>${t("この製品に適用される州のルール", "State rules applied to this product")}</b> <span class="small">(${t("未確認・州法を必ず確認", "not yet verified: always check the state law")})</span><ul style="margin:6px 0 0;padding-left:18px">${ruleLines.join("")}</ul></div>`
          : (cat === "food" && !ID.state.label.result ? `<div class="notice info" style="margin-bottom:16px">${t("ラベル審査を実行すると、牛肉・酒類を含む製品の州ルールが反映されます。", "Run the Label Check first: products with beef or liquor then get state rules applied.")} <a href="#label">${t("ラベル審査へ", "Go to Label Check")} →</a></div>` : "");

        const srcLine = (i) => {
          if (!avail.includes(i.key)) return `<li class="muted">✕ ${t(i.ja, i.en)} — ${t("未入力（重み0%）", "not added yet (weight 0%)")}</li>`;
          const col = (i.columns && i.columns[cat]) || i.key;
          const note = m.uploaded ? t("アップロードしたファイル", "your uploaded file") : ID.DATA_NOTES[col] ? t(ID.DATA_NOTES[col].ja, ID.DATA_NOTES[col].en) : "";
          const n = rows.filter((r) => r[i.key] !== null).length;
          return `<li>✓ <b>${t(i.ja, i.en)}</b> (${n} ${t("州", "states")})${note ? ` — ${note}` : ""}</li>`;
        };
        $("#mp-banner").innerHTML =
          `<div class="notice info" style="margin-bottom:16px"><b>${t("使用中のデータ", "Data in use")}</b><ul style="margin:6px 0 0;padding-left:18px">${ID.INDICATORS.map(srcLine).join("")}</ul>
            ${avail.includes("search_interest") ? `<p class="small" style="margin:8px 0 0">${t("Googleトレンドは検索の「割合」で市場規模ではないため、所得水準と組み合わせています。数値がない州は「データ不足」とし、0としては扱いません。", "Google Trends measures the share of searches, not market size, so it is combined with income. States missing a figure are marked 'not enough data', never counted as zero.")}</p>` : ""}</div>` +
          (offMap.length ? `<div class="notice warn" style="margin-bottom:16px">${t("地図にない州名", "Not on the map (check spelling)")}: ${esc(offMap.map((s) => s.state).join(", "))}</div>` : "");

        /* Real India map: one path per state. Small states also get a dot so they are easy to click. */
        const M = ID.INDIA_MAP, tileOf = Object.fromEntries(ID.TILES.map((tl) => [tl[1], tl]));
        const look = (en) => {
          const s = byName[en.toLowerCase()];
          const ex = !!flags.excluded[en], cau = !!flags.caution[en];
          const inRank = s && rank[en.toLowerCase()];
          let fill = "var(--nodata)", ink = "#1d1b19", label = "", cls = "";
          if (ex) { fill = "#f3dcdc"; ink = "#8a1c14"; label = "✕"; cls = "ex"; }
          else if (inRank) { fill = color(s.score); ink = darkText(s.score) ? "#1d1b19" : "#ffffff"; label = String(Math.round(s.score)); }
          else if (s && s.coverage.have > 0) label = "…";
          if (cau && !ex) cls = "cau";
          return { fill, ink, label, cls };
        };
        const shapes = [], marks = [];
        Object.entries(M.paths).forEach(([en, d]) => {
          const tl = tileOf[en], L = look(en), isSel = sel && sel.state === en;
          const ja = tl ? tl[2] : "";
          shapes.push(`<g data-state="${esc(en)}" data-ja="${esc(ja)}" class="${L.cls}${isSel ? " sel" : ""}${tl ? "" : " off"}"><path d="${d}" fill="${L.fill}"></path></g>`);
          const [cx, cy, area] = M.centers[en] || [0, 0, 0];
          if (!tl) return;
          if (area < 120) {
            marks.push(`<g data-state="${esc(en)}" data-ja="${esc(ja)}" class="dot ${L.cls}${isSel ? " sel" : ""}"><circle cx="${cx}" cy="${cy}" r="6.5" fill="${L.fill}"></circle>
              <text x="${cx + 9}" y="${cy + 4}" font-size="10" font-weight="700" fill="#1d1b19">${tl[0]}${L.label ? " " + L.label : ""}</text></g>`);
          } else {
            const big = area > 900;
            marks.push(`<text class="lbl" x="${cx}" y="${cy - (big ? 2 : 0)}" text-anchor="middle" font-size="${big ? 11 : 9}" font-weight="700" fill="${L.ink}">${tl[0]}</text>` +
              (big && L.label ? `<text class="lbl" x="${cx}" y="${cy + 11}" text-anchor="middle" font-size="10" fill="${L.ink}">${L.label}</text>` : ""));
          }
        });
        $("#mp-svg").innerHTML = shapes.join("") + marks.join("");

        ID.INDICATORS.forEach((i) => {
          const r = el.querySelector(`[data-w="${i.key}"]`);
          if (i.key !== activeKey) r.value = m.weights[i.key] || 0;
          el.querySelector(`[data-wv="${i.key}"]`).textContent = Math.round(m.weights[i.key] || 0) + "%";
        });

        const factorName = (k) => t(ind(k).ja, ind(k).en);
        $("#mp-rows").innerHTML = ranked.slice(0, 10).map((s, i) => `<tr data-row="${esc(s.state)}" class="${sel && sel.state === s.state ? "hl" : ""}" style="cursor:pointer">
          <td class="num">${i + 1}</td><td><b>${esc(s.state)}</b></td><td class="num">${s.score}</td>
          <td class="small">${s.top.filter((f) => f.contribution > 0).map((f) => factorName(f.key)).join("、 ")}</td>
          <td class="small">${flags.caution[s.state] ? `<span class="tag review">${t("禁酒州", "Prohibition")}</span> ` : ""}${s.coverage.complete ? "" : `<span class="tag info">${t("データ一部不足", "Incomplete data")}</span>`}</td></tr>`).join("")
          || `<tr><td colspan="5" class="muted">${t("条件に合う州がありません", "No states match")}</td></tr>`;
        const partialN = scored.filter((s) => !isEx(s) && s.coverage.have > 0 && !s.coverage.complete).length;
        $("#mp-left").innerHTML = [
          Object.keys(flags.excluded).length ? t(`州のルールで除外：${Object.keys(flags.excluded).length}州`, `Left out by state rules: ${Object.keys(flags.excluded).length} states`) : "",
          !m.showPartial && partialN ? t(`データ不足で順位外：${partialN}州（上のチェックで含められます）`, `Not ranked for incomplete data: ${partialN} states (tick the box above to include them)`) : "",
        ].filter(Boolean).join(" · ");

        $("#mp-detail").innerHTML = sel ? `<div class="card"><div class="row"><h3>${rank[sel.state.toLowerCase()] ? "#" + rank[sel.state.toLowerCase()] + " " : ""}${esc(sel.state)}</h3><span class="spacer"></span><b>${sel.score} / 100</b></div>
          ${flags.excluded[sel.state] ? `<p class="notice bad" style="margin:8px 0 0">${t(R.beef.ja, R.beef.en)}</p>` : ""}
          ${flags.caution[sel.state] ? `<p class="notice warn" style="margin:8px 0 0">${t(R.alcohol.ja, R.alcohol.en)}</p>` : ""}
          <table style="margin-top:8px"><thead><tr><th>${t("指標", "Indicator")}</th><th class="num">${t("元の値", "Raw value")}</th><th class="num">${t("0–100換算", "Scaled 0–100")}</th><th class="num">${t("重み", "Weight")}</th></tr></thead><tbody>
          ${ID.INDICATORS.map((i) => `<tr><td>${t(i.ja, i.en)}</td><td class="num">${sel.raw[i.key] === null ? "—" : esc(sel.raw[i.key])}</td><td class="num">${sel.scaled[i.key] === null ? "—" : sel.scaled[i.key]}</td><td class="num">${Math.round(m.weights[i.key] || 0)}%</td></tr>`).join("")}
          </tbody></table></div>` : "";

        $$("g[data-state]", el).forEach((g) => {
          const s = byName[g.dataset.state.toLowerCase()], name = g.dataset.state;
          const why = g.classList.contains("off") ? "Not in the built-in data" : flags.excluded[name] ? "Left out: state beef rule" : s && rank[name.toLowerCase()] ? `Score ${s.score} · #${rank[name.toLowerCase()]}` : s && s.coverage.have ? `Score ${s.score} (incomplete data)` : "No data";
          g.addEventListener("mouseenter", (e) => showTip(`<b>${esc(name)}</b> ${esc(g.dataset.ja)}<br>${esc(why)}${flags.caution[name] ? "<br>Caution: alcohol prohibition" : ""}`, e));
          g.addEventListener("mouseleave", hideTip);
          if (s) g.addEventListener("click", () => { m.selected = s.state; refresh(); });
        });
        $$("[data-row]", el).forEach((tr) => tr.addEventListener("click", () => { m.selected = tr.dataset.row; refresh(); }));
      };

      $$("[data-w]", el).forEach((r) => r.addEventListener("input", () => { setWeight(m.weights, r.dataset.w, +r.value, avail); refresh(r.dataset.w); }));
      $("#mp-partial").addEventListener("change", (e) => { m.showPartial = e.target.checked; refresh(); });
      $("#mp-reset-w").addEventListener("click", () => { m.weights = ID.defaultWeights(avail); refresh(); });
      $("#mp-dl").addEventListener("click", () => download("india-desk-states.csv", toCsv(m.data)));
      const back = $("#mp-sample"); if (back) back.addEventListener("click", () => { m.data = ID.STATE_DATA; m.uploaded = false; m.selected = null; m.weights = null; ID.rerender(); });
      $("#mp-csv").addEventListener("change", (e) => {
        const f = e.target.files[0]; if (!f) return;
        const rd = new FileReader();
        rd.onload = () => {
          try { m.data = ID.parseStatesCsv(rd.result); m.uploaded = true; m.selected = null; m.weights = null; ID.rerender(); }
          catch (err) { $("#mp-err").innerHTML = `<div class="notice bad" style="margin-top:10px">${esc(err.message)}</div>`; }
        };
        rd.readAsText(f);
      });
      refresh();
    },
  };
})();
