/* =========================================================================
   Test Log — measure how accurate Label Check is on real products.
   Run a real label in Label Check, press "Save to Test Log", then mark each
   ingredient Correct or Wrong. The summary gives numbers for your pitch.
   ========================================================================= */
(function () {
  const { esc, t, $, $$ } = ID.ui;

  function summary(log) {
    const items = log.flatMap((e) => e.items);
    const marked = items.filter((i) => i.mark);
    const correct = marked.filter((i) => i.mark === "correct").length;
    return {
      products: log.length, ingredients: items.length,
      review: items.filter((i) => i.status === "Needs review").length,
      marked: marked.length, correct, wrong: marked.length - correct,
      pct: marked.length ? Math.round((correct / marked.length) * 1000) / 10 : null,
      wrongVerdicts: log.filter((e) => e.verdictMark === "wrong").length,
    };
  }

  function exportCsv(log) {
    const q = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
    const lines = [["date", "product", "category", "verdict", "verdict_correct", "ingredient", "status", "mark"].join(",")];
    log.forEach((e) => e.items.forEach((i) => lines.push([e.date, e.product, e.category, e.verdict, e.verdictMark || "", i.raw, i.status, i.mark || ""].map(q).join(","))));
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob(["﻿" + lines.join("\n")], { type: "text/csv;charset=utf-8" }));
    a.download = "india-desk-test-log.csv"; a.click();
  }

  ID.views.testlog = {
    render(el) {
      const log = ID.state.testLog, s = summary(log);
      const markBtns = (attr, val) => `<button class="btn sm ${val === "correct" ? "primary" : ""}" ${attr}="correct">✓</button><button class="btn sm ${val === "wrong" ? "primary" : ""}" ${attr}="wrong">✕</button>`;
      el.innerHTML = `
        <div class="card head"><div><h2>${t("テスト記録", "Test Log")}</h2>
          <p>${t("実際の日本製品のラベルで審査し、各原材料の判定が正しいか記録します。", "Run real Japanese labels through Label Check and record whether each result is right.")}</p></div>
          <div class="row"><button class="btn sm" id="tl-csv" ${log.length ? "" : "disabled"}>${t("CSV出力", "Export CSV")}</button>
          <button class="btn sm ghost" id="tl-clear" ${log.length ? "" : "disabled"}>${t("全削除", "Clear all")}</button></div></div>
        <div class="card"><div class="grid3">
          <div class="kpi"><div class="l">${t("製品数 / 原材料数", "Products / ingredients")}</div><div class="v">${s.products} / ${s.ingredients}</div></div>
          <div class="kpi"><div class="l">${t("正しく判定（確認済み分）", "Classified correctly (of marked)")}</div><div class="v">${s.pct === null ? "—" : s.pct + "%"}</div><div class="l">${s.correct} / ${s.marked}</div></div>
          <div class="kpi"><div class="l">${t("要確認 / 誤った総合判定", "Sent to review / wrong verdicts")}</div><div class="v">${s.review} / ${s.wrongVerdicts}</div></div>
        </div></div>
        ${log.length ? log.map((e, ei) => `<div class="card">
          <div class="row"><h3>${esc(e.product)}</h3><span class="muted small">${esc(e.date)} · ${esc(e.category)}</span><span class="spacer"></span>
            <span class="small">${t("総合判定", "Verdict")}: <b>${esc(e.verdict)}</b></span>${markBtns(`data-v="${ei}" data-vm`, e.verdictMark)}
            <button class="btn sm ghost" data-rm="${ei}">${t("削除", "Remove")}</button></div>
          <table style="margin-top:8px"><tbody>${e.items.map((i, ii) => `<tr><td>${esc(i.raw)}</td><td class="small">${esc(i.status)}</td><td class="num">${markBtns(`data-e="${ei}" data-i="${ii}" data-m`, i.mark)}</td></tr>`).join("")}</tbody></table></div>`).join("")
        : `<div class="notice info">${t("まだ記録がありません。ラベル審査の結果画面で「テスト記録に保存」を押してください。", "No tests yet. In Label Check, press “Save to Test Log” after running a check.")}</div>`}`;

      $$("[data-m]", el).forEach((b) => b.addEventListener("click", () => { const it = log[+b.dataset.e].items[+b.dataset.i]; it.mark = it.mark === b.dataset.m ? "" : b.dataset.m; ID.save("testLog"); ID.rerender(); }));
      $$("[data-vm]", el).forEach((b) => b.addEventListener("click", () => { const e = log[+b.dataset.v]; e.verdictMark = e.verdictMark === b.dataset.vm ? "" : b.dataset.vm; ID.save("testLog"); ID.rerender(); }));
      $$("[data-rm]", el).forEach((b) => b.addEventListener("click", () => { log.splice(+b.dataset.rm, 1); ID.save("testLog"); ID.rerender(); }));
      $("#tl-csv").addEventListener("click", () => exportCsv(log));
      $("#tl-clear").addEventListener("click", () => { if (confirm("Delete all test records?")) { log.length = 0; ID.save("testLog"); ID.rerender(); } });
    },
  };
})();
