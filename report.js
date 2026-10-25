/* =========================================================================
   Report — one-page summary. "Save as PDF" uses the browser's print dialog,
   which handles Japanese text correctly with no extra fonts.
   ========================================================================= */
(function () {
  const { esc, t, $, money } = ID.ui;
  const V = {
    NON_VEG: ["ノンベジ（非菜食）", "Non-vegetarian"], VEG: ["ベジ（菜食）", "Vegetarian"], NEEDS_REVIEW: ["要確認", "Needs review"],
    RESTRICTED: ["規制物質あり", "Restricted substance found"], NONE_FOUND: ["規制物質なし（登録分）", "No listed restricted substance"], EMPTY: ["未入力", "No ingredients"],
  };
  const notRun = () => `<p class="muted">${t("未実施", "Not run yet")}</p>`;

  /* ---------- Go / Not yet card ---------- */
  const STEP_NAME = {
    label: ["ラベル審査", "Label Check", "label"], shelf: ["賞味期限", "Shelf life", "shelf"], price: ["価格", "Price", "price"],
    map: ["進出州", "Launch states", "map"], partner: ["パートナー", "Partner", "partner"],
  };
  const COS_STEP = ["登録前チェック", "Registration pre-check", "shelf"];
  const WHY = {
    not_run: ["未実施です。このステップを実行してください", "Not done yet: run this step"],
    restricted: ["インドで規制されている成分があります。配合を見直してください", "Contains a substance restricted in India: change the recipe"],
    review: ["確認が必要な原材料があります。製造元に由来を確認してください", "Some ingredients need checking: ask your factory what they are made from"],
    sticker: ["問題なし（インド向けステッカーを貼付）", "OK (add the India sticker)"],
    clear: ["問題なし", "OK"],
    pass: ["60%ルールに合格", "Passes the 60% rule"],
    fail: ["通関時に賞味期限が足りません。出荷を早めるか、期限の長いロットを使ってください", "Not enough shelf life at customs: ship earlier or use a longer-dated batch"],
    cos_done: ["登録書類がそろいました", "Registration documents ready"],
    cos_partial: ["登録書類がまだそろっていません", "Registration documents not complete yet"],
    set: ["店頭価格を算出済み", "Shelf price worked out"],
    ranked: ["上位州", "Top states"],
    red_flags: ["必要な番号がない、または形式が不正です", "A required licence number is missing or in the wrong format"],
    sample: ["サンプル会社です。実在の候補を追加してください", "This is the sample company: add a real candidate"],
    checks: ["確認チェックリストを最後まで終えてください", "Finish the due-diligence checklist"],
    ready: ["確認がほぼ完了", "Checks almost all done"],
  };
  const ICON = { ok: "✓", warn: "!", bad: "✕", todo: "○" };
  const VERDICT = {
    GO: ["good", "輸出の準備ができています", "Ready to export", "次は輸入者とテスト出荷の条件を決めましょう。", "Next: agree a test shipment with your importer."],
    ALMOST: ["warn", "あと少しです", "Almost ready", "下の「やること」を終えれば準備完了です。", "Finish the to-do items below and you are ready."],
    IN_PROGRESS: ["idle", "まだ途中です", "Still in progress", "未実施のステップを順に進めてください。", "Work through the steps not done yet."],
    NOT_YET: ["bad", "まだ輸出できません", "Not ready yet", "✕ の項目は輸出を止める問題です。先に解決してください。", "Items marked ✕ block export. Fix them first."],
  };

  function readyCard(r, cat, tops) {
    const v = VERDICT[r.verdict];
    const todo = r.items.filter((i) => i.status !== "ok");
    const name = (id) => { const n = id === "shelf" && cat === "cosmetics" ? COS_STEP : STEP_NAME[id]; return t(n[0], n[1]); };
    const link = (id) => (id === "shelf" && cat === "cosmetics" ? COS_STEP : STEP_NAME[id])[2];
    const why = (i) => t(WHY[i.why][0], WHY[i.why][1]) + (i.why === "ranked" ? ": " + esc(tops.slice(0, 3).join(", ")) : "");
    return `<div class="ready ready-${v[0]}">
      <div class="ready-top">
        <div><div class="ready-kicker">${t("輸出準備の判定", "Export readiness")}</div>
          <div class="ready-verdict">${t(v[1], v[2])}</div>
          <div class="ready-sub">${t(v[3], v[4])}</div></div>
        <div class="ready-score"><b>${r.ok}</b><span>/ ${r.total}</span><small>${t("項目OK", "checks OK")}</small></div>
      </div>
      <ul class="ready-list">${r.items.map((i) => `<li class="s-${i.status}"><span class="ri" aria-hidden="true">${ICON[i.status]}</span><b>${name(i.id)}</b><span class="rw">${why(i)}</span></li>`).join("")}</ul>
      ${todo.length ? `<div class="ready-todo"><b>${t("やること", "To do")}</b><ol>${todo.sort((a, b) => (a.status === "bad" ? -1 : 0) - (b.status === "bad" ? -1 : 0)).map((i) => `<li>${name(i.id)}: ${why(i)} <a class="no-print" href="#${link(i.id)}">${t("開く", "Open")} →</a></li>`).join("")}</ol></div>` : ""}
      <p class="small muted" style="margin:10px 0 0">${t("固定ルールによる判定です。最終確認は輸入者または規制の専門家と行ってください。", "Decided by fixed rules. Do a final check with your importer or a regulatory adviser.")}</p>
    </div>`;
  }

  ID.views.report = {
    render(el) {
      const st = ID.state, p = st.product, cat = p.category, lr = st.label.result;
      const sl = cat === "food" ? ID.shelfLife({ mfg: p.mfg, exp: p.exp, dispatch: st.shelf.dispatch, transitDays: st.shelf.transit, clearanceDays: st.shelf.clearance, minPercent: st.shelf.min ?? ID.SHELF_RULE.minPercent }) : null;
      const pr = ID.price({ ...st.price, factoryJpy: p.price });
      const m = st.map;
      const rows = ID.rowsForCategory(m.data || ID.STATE_DATA, cat);
      const avail = ID.availableIndicators(rows);
      const sflags = cat === "food" ? ID.stateFlags(lr) : { excluded: {}, caution: {}, reasons: [] };
      const scored = ID.scoreStates(rows, m.weights && m.wSig === cat + "|" + avail.join(",") ? m.weights : ID.defaultWeights(avail))
        .filter((x) => !sflags.excluded[x.state] && x.coverage.have > 0 && (x.coverage.complete || m.showPartial));
      const nut = st.label.nutrition, kids = st.label.kids;
      const gapMissing = nut && nut.found ? ID.nutritionGap(nut).filter((g) => g.status === "missing") : [];
      const dataUsed = ID.INDICATORS.filter((i) => avail.includes(i.key)).map((i) => t(i.ja, i.en)).join("、 ");
      const best = st.partners.length ? ID.recommendPartner(st.partners, cat, scored.slice(0, 5).map((x) => x.state)).best : null;
      const ready = ID.readiness({
        category: cat,
        label: lr ? { verdict: lr.verdict, restricted: lr.restricted.length, missing: lr.missing.length } : null,
        shelf: sl && !sl.error ? { pass: sl.pass } : null,
        cos: { done: ID.COS_CHECKLIST.filter((c) => (st.shelf.cos || {})[c.id]).length, total: ID.COS_CHECKLIST.length },
        priceSet: !!p.price,
        topStates: st.visited.map ? scored.slice(0, 5).map((x) => x.state) : [],
        partner: best,
      });
      const usedSources = cat === "food" ? ["FSSAI_IMPORT", "FSSAI_LABEL", "DGFT"] : ["CDSCO_COS", "DGFT"];

      el.innerHTML = `
        <div class="card report">
          <div class="row no-print" style="margin-bottom:12px"><span class="spacer"></span>
            <button class="btn primary" id="rp-print">${t("PDFとして保存 / 印刷", "Save as PDF / Print")}</button></div>
          <h2>Shinzoku Setu — ${t("インド輸出レポート", "India export report")}</h2>
          <p class="muted small">${esc(ID.fmtDate(new Date()))} · ${t("参考情報。輸入者または規制の専門家に確認してください。", "Guidance only. Confirm with your importer or a regulatory adviser.")}</p>

          ${readyCard(ready, cat, scored.map((x) => x.state))}

          <section><h3>1. ${t("製品", "Product")}</h3>
            <table><tbody>
              <tr><td>${t("商品名", "Name")}</td><td>${esc(p.name || "—")}</td><td>${t("区分", "Category")}</td><td>${cat === "food" ? t("加工食品", "Packaged food") : t("化粧品", "Cosmetics")}</td></tr>
              <tr><td>${t("工場出荷価格", "Factory price")}</td><td>¥${esc(p.price || "—")}</td><td>${t("製造日 / 賞味期限", "Mfg / expiry")}</td><td>${esc(p.mfg || "—")} / ${esc(p.exp || "—")}</td></tr>
            </tbody></table></section>

          <section><h3>2. ${t("ラベル審査", "Label Check")}</h3>
            ${lr ? `<p><b>${t(...V[lr.verdict])}</b>${lr.animal.length ? ` — ${t("動物由来", "animal-derived")}: ${esc(lr.animal.map((i) => i.raw).join("、"))}` : ""}${lr.restricted.length ? ` — ${esc(lr.restricted.map((i) => i.raw).join("、"))}` : ""}</p>
              ${lr.review.length ? `<p class="small">${t("要確認", "Needs review")}: ${esc(lr.review.map((i) => i.raw).join("、"))}</p>` : ""}
              <p class="small">${t("不足している表示", "Missing for India")}: ${lr.missing.length ? lr.missing.map((x) => t(x.ja, x.en)).join("、 ") : t("なし", "none")}</p>
              ${cat === "food" ? `<p class="small">${t("栄養成分", "Nutrition")}: ${nut && nut.found ? (gapMissing.length ? t("インド向けに追加が必要", "to add for India") + ": " + gapMissing.map((g) => t(g.ja, g.en)).join("、 ") : t("必要項目あり", "all required items shown")) : t("栄養成分表示なし", "no nutrition panel read")} <span class="muted">(${t("規則は未確認", "rule not yet verified")})</span></p>` : ""}
              ${kids ? `<p class="small">${t("子ども向け（参考）", "Children (guidance)")}: ${kids.verdict === "NO_FLAGS" ? t("気になる点なし", "no flags") : kids.flags.map((f) => t(f.ja, f.en) + " (" + esc(f.detail) + ")").join("、 ")}</p>` : ""}
              ${(() => { const d = cat === "food" ? ID.dietCheck(lr) : null; const L = { yes: t("はい", "yes"), no: t("いいえ", "no"), check: t("要確認", "check") };
                return d ? `<p class="small">${t("エッグレス", "Eggless")}: <b>${L[d.eggless.status]}</b> · ${t("ジャイナ教対応", "Jain-friendly")}: <b>${L[d.jain.status]}</b>${d.jain.found.length ? " (" + esc(d.jain.found.slice(0, 4).map((f) => f.raw).join("、")) + ")" : ""} <span class="muted">(${t("参考", "guidance")})</span></p>` : ""; })()}
              ${(() => { const h = ID.heatCheck(st.label.text, p.name, cat);
                return `<p class="small">${t("暑さへの注意", "Heat")}: ${h.sensitive ? `<b>${t("暑さに弱い", "heat-sensitive")}</b> — ${h.flags.map((f) => t(f.ja, f.en)).join("、 ")}${sl && !sl.error && ID.inHotSeason(sl.clearanceDate) ? ` · <b>${t("4〜6月に到着：冷蔵輸送が必要", "arrives April–June: use cold shipping")}</b>` : ""}` : t("問題なし", "no flags")}</p>`; })()}
              ${sflags.reasons.length ? `<p class="small">${t("州のルール", "State rules")}: ${sflags.reasons.includes("beef") ? t("牛肉：制限州を除外", "beef: restricted states left out") : ""} ${sflags.reasons.includes("alcohol") ? t("酒類：禁酒州に注意", "liquor: caution in prohibition states") : ""} <span class="muted">(${t("未確認", "not yet verified")})</span></p>` : ""}` : notRun()}</section>

          <section><h3>3. ${cat === "food" ? t("賞味期限チェック", "Shelf-Life Check") : t("登録前チェック", "Registration pre-check")}</h3>
            ${cat === "food"
              ? (sl && !sl.error ? `<p><b>${sl.pass ? t("合格", "PASS") : t("不合格", "FAIL")}</b> — ${t("通関日", "clears")} ${sl.clearanceDate}, ${t("残り", "remaining")} ${sl.remaining} ${t("日", "days")} (${sl.pct}%), ${t("最終出荷可能日", "latest safe dispatch")} ${sl.latestDispatch}</p>` : notRun())
              : `<p>${ID.COS_CHECKLIST.filter((c) => (st.shelf.cos || {})[c.id]).length} / ${ID.COS_CHECKLIST.length} ${t("項目完了", "items ready")} · ${t("CDSCO処理目標 180営業日", "CDSCO target 180 working days")}</p>`}</section>

          <section><h3>4. ${t("価格", "Price")}</h3>
            ${p.price ? `<p>${t("陸揚げ原価", "Landed cost")} <b>${money(pr.landed)}</b> · ${t("推奨MRP", "Suggested MRP")} <b>₹${pr.mrp.toLocaleString("en-IN")}</b> (${pr.multiplier}×) · ${t("関税", "Duty")} ${pr.dutyPct}%${st.price.cepa ? " (CEPA)" : ""}${pr.sws ? ` + ${t("社会福祉課徴金", "SWS")} ${pr.swsPct}%` : ""}, GST ${st.price.gstPct}%</p>
              <p class="small muted">${t("税率は入力値です。HSコードで確認してください。", "Rates are inputs; confirm for the HS code.")}</p>` : notRun()}</section>

          <section><h3>5. ${t("進出候補州（上位5）", "Top 5 launch states")} </h3>
            <p class="small muted">${t("使用データ", "Based on")}: ${dataUsed || "—"}${avail.length < ID.INDICATORS.length ? ` · ${t("その他の指標は未入力", "other indicators not yet added")}` : ""}</p>
            <ol>${scored.slice(0, 5).map((s) => `<li>${esc(s.state)} — ${s.score} / 100</li>`).join("")}</ol></section>

          <section><h3>6. ${t("パートナー候補", "Partner candidates")}</h3>
            ${st.partners.length ? `<ul>${st.partners.map((x) => `<li>${esc(x.name)}${x.sample ? ` <span class="tag review">${t("サンプル会社", "Sample company")}</span>` : ""} — ${t("確認", "checks done")} ${ID.partnerScore(x, cat).done}/${ID.partnerScore(x, cat).total} <span class="small muted">(${t("ライセンスは公式サイトで要確認", "confirm licences on the official portals")})</span></li>`).join("")}</ul>` : notRun()}</section>


          <section><h3>${t("出典", "Sources")}</h3>
            <ul class="small">${usedSources.map((k) => `<li>${esc(ID.SOURCES[k].name)} — ${esc(ID.SOURCES[k].authority)} (${esc(ID.SOURCES[k].url)})</li>`).join("")}</ul></section>
        </div>`;
      $("#rp-print").addEventListener("click", () => window.print());
    },
  };
})();
