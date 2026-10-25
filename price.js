/* =========================================================================
   Module 3 — Price Builder
   Follows the Indian import steps (see ID.price in engine.js):
   CIF -> Basic Customs Duty -> Social Welfare Surcharge -> IGST (credited)
   -> clearance -> margins -> GST on sale -> MRP rounded up
   ========================================================================= */
(function () {
  const { esc, t, $, $$, money, showTip, hideTip } = ID.ui;

  ID.views.price = {
    render(el) {
      const p = ID.state.price, prod = ID.state.product;
      if (p.sws === undefined) p.sws = true;
      const r = ID.price({ ...p, factoryJpy: prod.price });
      const parts = [
        { k: "factoryInr", ja: "工場出荷価格", en: "Factory price", c: "var(--c1)" },
        { k: "freight", ja: "運賃・保険", en: "Freight + insurance", c: "var(--c2)" },
        { k: "duty", ja: "関税＋社会福祉課徴金", en: "Duty + surcharge", c: "var(--c3)" },
        { k: "clearance", ja: "通関・検査費", en: "Clearance + testing", c: "var(--c5)" },
        { k: "margins", ja: "流通マージン", en: "Channel margins", c: "var(--c6)" },
        { k: "gst", ja: "GST（販売時）", en: "GST on sale", c: "var(--c4)" },
      ];
      const field = (key, ja, en, step) => `<label class="stack"><span>${t(ja, en)}</span><input data-k="${key}" type="number" step="${step || "any"}" value="${esc(p[key] ?? "")}" /></label>`;
      const total = r.shelf || 1;
      const steps = [
        ["1", "工場出荷価格（円→ルピー）", `Factory price (¥${prod.price || 0} × ${p.rate})`, r.factoryInr, ""],
        ["2", "＋ 運賃・保険 ＝ 課税価格（CIF）", "+ Freight and insurance = assessable value (CIF)", r.assessable, "sub"],
        ["3", `＋ 基本関税 ${r.dutyPct}%`, `+ Basic Customs Duty ${r.dutyPct}%${p.cepa ? " (CEPA)" : ""}`, r.bcd, ""],
        ["4", `＋ 社会福祉課徴金（関税の${r.swsPct}%）`, `+ Social Welfare Surcharge (${r.swsPct}% of duty)`, r.sws, ""],
        ["5", `IGST ${r.gstPct}%（港で支払い、後で控除）`, `IGST ${r.gstPct}% (paid at port, claimed back later)`, r.igst, "note"],
        ["6", "＋ 通関・検査費", "+ Clearance and testing", r.clearance, ""],
        ["", "＝ 陸揚げ原価（控除後）", "= Landed cost (after IGST credit)", r.cost, "sub"],
        ["7", `＋ 輸入者マージン ${p.mImp}%`, `+ Importer margin ${p.mImp}%`, r.afterImporter - r.cost, ""],
        ["8", `＋ 卸マージン ${p.mDist}%`, `+ Distributor margin ${p.mDist}%`, r.afterDistributor - r.afterImporter, ""],
        ["9", `＋ 小売マージン ${p.mRet}%`, `+ Retailer margin ${p.mRet}%`, r.retailEx - r.afterDistributor, ""],
        ["10", `＋ GST ${r.gstPct}%（消費者が支払う）`, `+ GST ${r.gstPct}% (paid by the shopper)`, r.gst, ""],
        ["", "＝ 店頭価格（税込）", "= Shelf price (tax included)", r.shelf, "sub"],
      ];

      el.innerHTML = `
        <div class="card head"><div><h2>${t("価格ビルダー", "Price Builder")}</h2>
          <p>${t("日本の工場価格が、インドの店頭価格（MRP）になるまでを順番に計算します。輸入時のIGSTは輸入者が後で控除できるため、マージンの計算には含めません。", "Follow your factory price step by step until it becomes the Indian printed price (MRP). The IGST paid at import is claimed back by the importer, so margins are not added on top of it.")}</p></div>
          <span class="source unverified">${t("税率は入力値（例）・HSコードで要確認", "Rates are inputs (examples): confirm for your HS code")}</span></div>
        <div class="grid3 price-kpis">
          <div class="kpi"><div class="l">${t("陸揚げ原価（港で必要な現金）", "Landed cost (cash at the port)")}</div><div class="v">${money(r.landed)}</div><div class="l">${t("IGST控除後", "after IGST credit")}: ${money(r.cost)}</div></div>
          <div class="kpi big"><div class="l">${t("推奨MRP（印字価格）", "Suggested MRP (printed price)")}</div><div class="v">₹${r.mrp.toLocaleString("en-IN")}</div><div class="l">${t("計算値", "calculated")} ${money(r.shelf)} → ${t(`₹${p.roundTo || 5}単位に切り上げ`, `rounded up to ₹${p.roundTo || 5}`)} · ≈ ¥${r.shelfJpy.toLocaleString()}</div></div>
          <div class="kpi"><div class="l">${t("工場価格からの倍率", "Factory-to-shelf multiple")}</div><div class="v">${r.multiplier}×</div><div class="l">${t("日本の工場価格の何倍か", "times the Japanese factory price")}</div></div>
        </div>
        <div class="grid2">
          <div class="card"><p class="section-title">${t("費用と税", "Costs and taxes")}</p>
            <div class="grid2">
              <label class="stack"><span>${t("工場出荷価格（円）", "Factory price (JPY)")}</span><input value="${esc(prod.price)}" disabled /></label>
              ${field("rate", "為替（1円＝ルピー）", "Exchange rate (₹ per ¥1)", "0.01")}
              ${field("freight", "運賃・保険（₹/個）", "Freight + insurance (₹/unit)")}
              ${field("clearance", "通関・検査費（₹/個）", "Clearance + testing (₹/unit)")}
              ${field("dutyPct", "基本関税率（%）", "Basic Customs Duty (%)")}
              ${field("gstPct", "GST / IGST（%）", "GST / IGST (%)")}
            </div>
            <label class="row small" style="margin-top:12px"><input type="checkbox" id="pr-sws" style="width:auto" ${p.sws !== false ? "checked" : ""}/> ${t("社会福祉課徴金（関税の10%）を含める", "Include Social Welfare Surcharge (10% of duty)")}</label>
            <label class="row small" style="margin-top:8px"><input type="checkbox" id="pr-cepa" style="width:auto" ${p.cepa ? "checked" : ""}/> ${t("日本原産品（日印CEPA税率を使う）", "Japan-origin goods (use India–Japan CEPA rate)")}</label>
            ${p.cepa ? `<div style="margin-top:8px">${field("cepaPct", "CEPA優遇税率（%）— HSコードで確認", "CEPA preferential rate (%) — confirm for your HS code")}</div>` : ""}
          </div>
          <div class="card"><p class="section-title">${t("流通マージン", "Channel margins")}</p>
            <div class="grid2">
              ${field("mImp", "輸入者（%）", "Importer (%)")}
              ${field("mDist", "卸（%）", "Distributor (%)")}
              ${field("mRet", "小売（%）", "Retailer (%)")}
              <label class="stack"><span>${t("MRPの切り上げ単位（₹）", "Round MRP up to (₹)")}</span><select data-k="roundTo">${[1, 5, 10].map((v) => `<option value="${v}" ${(+p.roundTo || 5) === v ? "selected" : ""}>₹${v}</option>`).join("")}</select></label>
            </div>
            <p class="small muted" style="margin:10px 0 0">${t("インドでは、すべての税を含むMRP（最大小売価格）を包装に印字する必要があります。", "In India the pack must show the MRP (maximum retail price), including all taxes.")}</p>
          </div>
        </div>
        <div class="card"><p class="section-title">${t("工場価格から店頭価格まで（1個当たり）", "From factory price to shelf price (per unit)")}</p>
          <table class="waterfall"><tbody>
            ${steps.map(([n, ja, en, v, cls]) => `<tr class="${cls}"><td class="num muted">${n}</td><td>${t(ja, en)}</td><td class="num">${cls === "note" ? `<span class="muted">(${money(v)})</span>` : money(v)}</td></tr>`).join("")}
            <tr class="mrp"><td></td><td><b>${t("推奨MRP（印字価格）", "Suggested MRP (printed price)")}</b></td><td class="num"><b>₹${r.mrp.toLocaleString("en-IN")}</b></td></tr>
          </tbody></table>
          <p class="section-title" style="margin-top:20px">${t("店頭価格の内訳", "What makes up the shelf price")}</p>
          <div class="stackbar" role="img" aria-label="Shelf price breakdown">
            ${parts.map((x) => r[x.k] > 0 ? `<div style="width:${(r[x.k] / total) * 100}%;background:${x.c}" data-tip="${esc(`${x.en}: ${money(r[x.k])} (${((r[x.k] / total) * 100).toFixed(1)}%)`)}"></div>` : "").join("")}
          </div>
          <div class="legend">${parts.map((x) => `<span><i style="background:${x.c}"></i>${t(x.ja, x.en)} ${((r[x.k] / total) * 100).toFixed(0)}%</span>`).join("")}</div>
          <p class="small muted" style="margin:12px 0 0">${t("社会福祉課徴金は一部の品目で免除されます。関税・GST率は品目（HSコード）ごとに異なるため、通関業者に確認してください。", "Some goods are exempt from the Social Welfare Surcharge. Duty and GST rates depend on the product's HS code: confirm with your customs broker.")}</p>
        </div>`;

      $$("[data-k]", el).forEach((i) => i.addEventListener("change", () => { p[i.dataset.k] = +i.value; ID.save("price"); ID.rerender(); }));
      $("#pr-cepa").addEventListener("change", (e) => { p.cepa = e.target.checked; ID.save("price"); ID.rerender(); });
      $("#pr-sws").addEventListener("change", (e) => { p.sws = e.target.checked; ID.save("price"); ID.rerender(); });
      $$("[data-tip]", el).forEach((d) => { d.addEventListener("mouseenter", (e) => showTip(esc(d.dataset.tip), e)); d.addEventListener("mouseleave", hideTip); });
    },
  };
})();
