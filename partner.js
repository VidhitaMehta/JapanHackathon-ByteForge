/* =========================================================================
   Module 5 — Partner Check
   Checks the SHAPE of licence numbers only, then links to the official
   portals where the team must confirm them. It never claims "verified".
   ========================================================================= */
(function () {
  const { esc, t, $, $$ } = ID.ui;

  const PORTALS = [
    { k: "fssai", ja: "FSSAIライセンス検索", en: "FSSAI licence search", url: "https://foscos.fssai.gov.in" },
    { k: "iec", ja: "DGFT（IEC）", en: "DGFT (IEC)", url: "https://www.dgft.gov.in" },
    { k: "cdsco", ja: "CDSCO", en: "CDSCO", url: "https://cdsco.gov.in" },
  ];
  const SAMPLE = { name: "Sample Foods Importers Pvt Ltd", type: "importer", contact: "Purchase manager", phone: "+91 00000 00000", address: "Mumbai, Maharashtra", cold: "yes", categories: "Packaged snacks, confectionery", years: 8, channels: "Supermarkets, e-commerce", sample: true };

  /* Dealer types and where to find real dealers (official / well-known sources only). */
  const TYPES = [
    { id: "importer", ja: "輸入者（FSSAI輸入ライセンスあり）", en: "Importer (holds FSSAI import licence)" },
    { id: "distributor", ja: "卸・ディストリビューター", en: "Distributor / wholesaler" },
    { id: "retail", ja: "小売チェーン（スーパー等）", en: "Retail chain (supermarket etc.)" },
    { id: "ecom", ja: "ECサイト・クイックコマース", en: "E-commerce / quick commerce" },
    { id: "food", ja: "飲食店（試験導入先）", en: "Restaurant / foodservice (trial account)" },
  ];
  const FIND = [
    { ja: "FSSAI FoSCoS：輸入ライセンスの検索・確認", en: "FSSAI FoSCoS: look up and confirm import licences", url: "https://foscos.fssai.gov.in", cat: "food" },
    { ja: "CDSCO SUGAM：化粧品の輸入登録", en: "CDSCO SUGAM: cosmetics import registration", url: "https://cdscoonline.gov.in", cat: "cosmetics" },
    { ja: "JETRO（インド事務所：ニューデリー・ムンバイ・チェンナイ・ベンガルール・アーメダバード）", en: "JETRO India offices: business matching support", url: "https://www.jetro.go.jp/india/", cat: "both" },
    { ja: "インド日本商工会（IJCCI）", en: "Indo-Japan Chamber of Commerce and Industry (IJCCI)", url: "https://ijcci.com", cat: "both" },
    { ja: "JETRO 見本市データベース（J-messe）：AAHAR（ニューデリー）など", en: "JETRO trade-fair database (J-messe): AAHAR (New Delhi) and more", url: "https://www.jetro.go.jp/en/database/j-messe/tradefair/detail/136782", cat: "both" },
    { ja: "Indusfood（TPCI）：インドの食品輸入者が集まる展示会", en: "Indusfood (TPCI): food trade show where Indian buyers meet suppliers", url: "https://www.indusfood.co.in", cat: "food" },
  ];


  /* ---------- B2B partner pack: nothing to install for either side ---------- */
  ID.enquiryText = function () {
    const st = ID.state, p = st.product, lr = st.label.result, cat = p.category;
    const sl = cat === "food" ? ID.shelfLife({ mfg: p.mfg, exp: p.exp, dispatch: st.shelf.dispatch, transitDays: st.shelf.transit, clearanceDays: st.shelf.clearance, minPercent: st.shelf.min ?? ID.SHELF_RULE.minPercent }) : null;
    const pr = p.price ? ID.price({ ...st.price, factoryJpy: p.price }) : null;
    const veg = lr ? ({ NON_VEG: "Non-vegetarian", VEG: "Vegetarian", NEEDS_REVIEW: "Under review" }[lr.verdict] || "") : "";
    const name = st.partners[0] && !st.partners[0].sample ? st.partners[0].name : "[Importer name]";
    const lines = [
      `Dear ${name},`,
      ``,
      `We are a Japanese manufacturer of ${p.name || "[product]"} and are looking for a licensed importer for the Indian market.`,
      ``,
      `Product summary:`,
      `- Category: ${cat === "food" ? "Packaged food" : "Cosmetics"}`,
      veg ? `- Veg / non-veg status: ${veg}` : null,
      (() => { const d = cat === "food" && lr ? ID.dietCheck(lr) : null; const L = { yes: "Yes", no: "No", check: "To be confirmed" }; return d ? `- Eggless: ${L[d.eggless.status]}; Jain-friendly: ${L[d.jain.status]}` : null; })(),
      ID.heatCheck(st.label.text, p.name, cat).sensitive ? `- Heat-sensitive: needs cool storage / refrigerated shipping in summer` : null,
      sl && !sl.error ? `- Shelf life: ${sl.total} days; ${sl.pct}% remaining at customs clearance on the planned schedule` : null,
      pr ? `- Indicative MRP in India: Rs ${pr.mrp} (our estimate, to be agreed)` : null,
      ``,
      `Could you please share:`,
      cat === "food" ? `1. Your FSSAI import licence number and IEC` : `1. Your CDSCO registration details (or willingness to act as our authorised agent) and IEC`,
      `2. The product categories and regions you distribute to`,
      `3. Your usual margin and minimum order quantity`,
      ``,
      `Our product brief is attached.`,
      ``,
      `Best regards,`,
      `[Your name]`,
      `[Company], Japan`,
    ].filter((l) => l !== null);
    return { subject: `Export enquiry: ${p.name || "Japanese product"} from Japan`, body: lines.join("\n") };
  };

  function packCard() {
    const q = ID.enquiryText();
    const mail = `mailto:${encodeURIComponent((ID.state.partners[0] && ID.state.partners[0].email) || "")}?subject=${encodeURIComponent(q.subject)}&body=${encodeURIComponent(q.body)}`;
    const wa = `https://wa.me/?text=${encodeURIComponent(q.subject + "\n\n" + q.body)}`;
    return `<div class="card"><p class="section-title">${t("輸入者へ送る（ソフト不要）", "Send to an importer (no software needed)")}</p>
      <p style="margin:0 0 14px">${t("相手側は何もインストールする必要がありません。製品資料（PDF）とメッセージを送るだけです。", "The importer installs nothing: they simply receive a product brief (PDF) and a message.")}</p>
      <div class="grid3">
        <a class="btn navy lg" href="#brief">${t("① 製品資料（PDF）", "① Product brief (PDF)")}</a>
        <a class="btn ghost lg" href="${mail}">${t("② メールで問い合わせ", "② Email enquiry")}</a>
        <a class="btn ghost lg" href="${wa}" target="_blank" rel="noopener">${t("③ WhatsAppで送る", "③ Send on WhatsApp")}</a>
      </div>
      <details style="margin-top:14px"><summary class="small">${t("メッセージの文面を見る・コピー", "See or copy the message")}</summary>
        <pre class="sticker" style="margin-top:10px" id="pt-msg">${esc(q.body)}</pre>
        <button class="btn sm" id="pt-copy" style="margin-top:8px">${t("コピー", "Copy")}</button>
      </details>
      <p class="small muted" style="margin:12px 0 0">${t("インドの取引ではWhatsAppがよく使われます。", "WhatsApp is widely used for business in India.")}</p>
    </div>`;
  }

  /* ---------- Buyer leads by state (from the team's research file) ---------- */
  const KIND = {
    importer: ["輸入者・卸", "Importer / distributor", "importer"],
    retail: ["小売・EC", "Retail / e-commerce", "retail"],
    restaurant: ["飲食店（試験導入）", "Restaurant (trial)", "food"],
    ecosystem: ["支援・関連企業", "Support / ecosystem", ""],
  };
  const PRI = { High: ["ok", "高", "High", 0], Medium: ["review", "中", "Medium", 1], Low: ["info", "低", "Low", 2] };
  function leadMatchesState(l, st, tops) {
    if (st === "all") return true;
    const inState = (x) => l.state === x || String(l.region || "").includes(x) || l.state.startsWith("Multi");
    return st === "top" ? tops.some(inState) : inState(st);
  }
  function leadsCard(cat, tops) {
    const F = (ID.state.leadFilter = ID.state.leadFilter || { state: "top", kind: "all" });
    const pool = (ID.LEADS || []).filter((l) => l.cats.includes(cat));
    const states = [...new Set(pool.map((l) => l.state))].sort();
    const all = pool.filter((l) => leadMatchesState(l, F.state, tops) && (F.kind === "all" || l.kind === F.kind))
      .sort((a, b) => PRI[a.priority][3] - PRI[b.priority][3]);
    const list = F.more ? all : all.slice(0, 6);
    const full = ID.state.partners.length >= 3;
    return `<div class="card" style="overflow-x:auto"><p class="section-title">${t("州別のバイヤー候補", "Buyer leads by state")} <span class="muted">(${pool.length})</span></p>
      <div class="row" style="gap:10px;flex-wrap:wrap;margin-bottom:10px">
        <label class="stack" style="min-width:200px"><span class="small">${t("州", "State")}</span><select id="ld-state">
          <option value="top" ${F.state === "top" ? "selected" : ""}>${t("進出州マップの上位州", "Top launch states")}${tops.length ? " (" + esc(tops.slice(0, 3).join(", ")) + "…)" : ""}</option>
          <option value="all" ${F.state === "all" ? "selected" : ""}>${t("すべて", "All states")}</option>
          ${states.map((x) => `<option value="${esc(x)}" ${F.state === x ? "selected" : ""}>${esc(x)}</option>`).join("")}</select></label>
        <label class="stack" style="min-width:200px"><span class="small">${t("種類", "Type")}</span><select id="ld-kind">
          <option value="all">${t("すべて", "All types")}</option>
          ${Object.entries(KIND).map(([k, v]) => `<option value="${k}" ${F.kind === k ? "selected" : ""}>${t(v[0], v[1])}</option>`).join("")}</select></label>
      </div>
      ${list.length ? `<table class="leads"><thead><tr><th>${t("会社・店舗", "Company")}</th><th>${t("場所", "Where")}</th><th>${t("種類・合う製品", "Type and product fit")}</th><th>${t("優先度", "Priority")}</th><th></th></tr></thead><tbody>
        ${list.map((l) => { const i = ID.LEADS.indexOf(l), pr = PRI[l.priority] || PRI.Low, k = KIND[l.kind];
          const added = ID.state.partners.some((p) => p.name === l.name);
          return `<tr><td><b>${esc(l.name)}</b><br><a class="small" href="${esc(l.url)}" target="_blank" rel="noopener">${t("出典", "Source")} ↗</a></td>
            <td class="small">${esc(l.region)}</td>
            <td class="small"><span class="tag info">${t(k[0], k[1])}</span> ${esc(l.fit)}<div class="muted" style="margin-top:4px">${esc(l.note)}</div></td>
            <td><span class="tag ${pr[0]}">${t(pr[1], pr[2])}</span></td>
            <td>${added ? `<span class="small muted">✓ ${t("追加済み", "Added")}</span>` : `<button class="btn sm nowrap" data-lead="${i}" ${full ? "disabled" : ""}>＋ ${t("追加", "Add")}</button>`}</td></tr>`; }).join("")}
      </tbody></table>${all.length > 6 ? `<button class="btn sm ghost" id="ld-more" style="margin-top:8px">${F.more ? t("少なく表示", "Show fewer") : t(`すべて表示（${all.length}件）`, `Show all ${all.length}`)}</button>` : ""}` : `<p class="muted">${t("この条件のバイヤー候補はありません。「すべて」を選んでください。", "No leads for this filter. Try 'All states'.")}</p>`}
      <p class="small muted" style="margin:10px 0 0">${t("チームの調査ファイル（企業サイト、JETRO/JFOODOサポーター店リスト）から。公開されている連絡先のみ。連絡前に最新情報を確認してください。飲食店は卸ではなく、試験導入先の候補です。", "From the team's research file (company websites and the JETRO / JFOODO supporter lists). Public business contacts only: confirm current details before contacting. Restaurants are trial accounts, not wholesalers.")}${full ? " " + t("候補は最大3社です。", "Up to 3 candidates.") : ""}</p>
    </div>`;
  }
  function leadToCandidate(l) {
    const c = String(l.contact || "");
    const email = (c.match(/[\w.+-]+@[\w.-]+\.\w+/) || [""])[0];
    const phone = (c.match(/\+?\d[\d\s-]{8,}\d/) || [""])[0];
    return { name: l.name, type: KIND[l.kind][2], address: l.region, contact: email || phone ? "" : c, phone, email, categories: l.fit, channels: l.type, lead: true, sourceUrl: l.url, checks: {} };
  }

  function findCard(cat) {
    const list = FIND.filter((x) => x.cat === "both" || x.cat === cat);
    return `<div class="card"><p class="section-title">${t("ディーラー（輸入者・卸）の探し方", "Where to find dealers (importers and distributors)")}</p>
      <ul class="find-list">${list.map((x) => `<li><a href="${x.url}" target="_blank" rel="noopener">${t(x.ja, x.en)} ↗</a></li>`).join("")}</ul>
      <p class="small muted" style="margin:8px 0 0">${t("見つけた会社を下の「候補を追加」に入力すると、比較・確認・おすすめが表示されます。会社名はアプリが作るのではなく、実際に確認した会社を入力してください。", "Add the companies you find under 'Add a candidate' to compare, check and get a recommendation. The app does not make up company names: enter real companies you have found.")}</p></div>`;
  }

  /* Due-diligence checklist: the team ticks each check after doing it. */
  function checklistCard(list, cat) {
    const checks = ID.PARTNER_CHECKS.filter((c) => c[cat]);
    const bar = (pct) => `<div style="height:8px;background:var(--line);border-radius:4px;overflow:hidden;margin-top:4px"><div style="width:${pct}%;height:100%;background:${pct >= 80 ? "var(--good)" : pct >= 50 ? "var(--c4)" : "var(--accent)"}"></div></div>`;
    return `<div class="card" style="overflow-x:auto"><p class="section-title">${t("確認チェックリスト", "Due-diligence checklist")}</p>
      <p class="small" style="margin:0 0 10px">${t("確認が終わった項目にチェックを入れてください。スコアは確認の進み具合で、会社の評価ではありません。", "Tick each check once you have done it. The score shows how much you have checked, not a rating of the company.")}</p>
      <table><thead><tr><th>${t("確認項目", "Check")}</th>${list.map((p) => `<th>${esc(p.name || "—")}</th>`).join("")}</tr></thead><tbody>
        ${checks.map((c) => `<tr><td>${t(c.ja, c.en)}</td>${list.map((p, i) => `<td><input type="checkbox" style="width:20px;height:20px;accent-color:var(--accent)" data-chk="${i}:${c.id}" ${p.checks && p.checks[c.id] ? "checked" : ""} aria-label="${esc(c.en)} – ${esc(p.name || "")}" /></td>`).join("")}</tr>`).join("")}
        <tr><td><b>${t("確認スコア", "Checks done")}</b></td>${list.map((p) => { const sc = ID.partnerScore(p, cat); return `<td><b>${sc.done} / ${sc.total}</b>${bar(sc.pct)}</td>`; }).join("")}</tr>
      </tbody></table></div>`;
  }

  /* Top launch states from the map (complete data, state rules applied). */
  function topStates(cat, n) {
    const rows = ID.rowsForCategory(ID.STATE_DATA, cat);
    const avail = ID.availableIndicators(rows);
    const flags = ID.stateFlags(ID.state.label.result);
    return ID.scoreStates(rows, ID.defaultWeights(avail))
      .filter((r) => r.coverage && r.coverage.complete && !flags.excluded[r.state])
      .slice(0, n).map((r) => r.state);
  }

  const LEVEL = {
    ready: ["good", "✓", "次の段階へ：テスト出荷の条件を交渉", "Move forward: negotiate a test shipment"],
    continue: ["warn", "!", "有望：残りの確認を終えてから決定", "Promising: finish the remaining checks before deciding"],
    fix: ["bad", "✕", "まだ進めない：先に問題を解決", "Not ready: fix the red flags first"],
  };

  function recommendCard(list, cat) {
    const tops = topStates(cat, 5);
    const rec = ID.recommendPartner(list, cat, tops);
    const b = rec.best;
    if (!b) return "";
    const lv = LEVEL[b.level];
    const chk = Object.fromEntries(ID.PARTNER_CHECKS.map((c) => [c.id, c]));
    const reasons = [];
    reasons.push(t(`確認済み ${b.done} / ${b.total} 項目`, `${b.done} of ${b.total} checks done`));
    if (b.inTop) reasons.push(t(`拠点が上位の進出州（${b.inTop}）にある`, `Based in a top launch state (${b.inTop})`));
    if (b.years) reasons.push(t(`事業年数 ${b.years} 年`, `${b.years} years in business`));
    const bp = list[b.i] || {};
    const hot = ID.heatCheck(ID.state.label.text, ID.state.product.name, cat).sensitive;
    if (hot && bp.cold === "yes") reasons.push(t("冷蔵倉庫あり（暑さに弱い製品に必要）", "Has cool storage (needed for this heat-sensitive product)"));
    if (hot && bp.cold === "no") reasons.push(`<span class="bad-text">${t("冷蔵倉庫なし：暑さに弱い製品には不向き", "No cool storage: risky for this heat-sensitive product")}</span>`);
    const others = rec.ranked.slice(1).map((r) => `<li><b>${esc(r.name || "—")}</b>: ${t(`確認済み ${r.done} / ${r.total}`, `${r.done} of ${r.total} checks done`)}</li>`).join("");
    return `<div class="card rec-card"><p class="section-title">${t("おすすめ", "Recommendation")}</p>
      <div class="rec-head"><span class="status ${lv[0]}">${lv[1]} ${t(lv[2], lv[3])}</span></div>
      <h3 style="margin:10px 0 4px">${esc(b.name || "—")} ${b.sample ? `<span class="tag review">${t("サンプル会社", "Sample company")}</span>` : ""}</h3>
      <ul class="small" style="margin:6px 0 10px">${reasons.map((r) => `<li>${r}</li>`).join("")}</ul>
      ${b.next.length ? `<p style="margin:8px 0 4px"><b>${t("次にやること", "Do these next")}</b></p><ol class="small" style="margin:0 0 10px">${b.next.slice(0, 3).map((id) => `<li>${t(chk[id].ja, chk[id].en)}</li>`).join("")}</ol>` : ""}
      ${others ? `<details><summary class="small">${t("他の候補", "Other candidates")}</summary><ul class="small">${others}</ul></details>` : ""}
      ${tops.length ? `<p class="small muted" style="margin:10px 0 0">${t("進出州マップの上位州：", "Top states on the Launch Map: ")}${tops.join(", ")}</p>` : ""}
      <p class="small muted" style="margin:6px 0 0">${t("固定ルールによる提案です（確認の進み具合 → 上位州に拠点 → 事業年数の順）。会社が安全だという保証ではありません。", "Suggested by fixed rules (checks done → based in a top state → years in business). It is not a guarantee that the company is safe.")}${b.sample ? " " + t("サンプル会社は実在の候補に置き換えてください。", "Replace the sample company with a real candidate.") : ""}</p>
    </div>`;
  }

  ID.views.partner = {
    render(el) {
      const list = ID.state.partners, cat = ID.state.product.category;
      const editing = ID.state.partnerEdit ?? null;
      const cur = editing !== null ? list[editing] || {} : {};
      const f = (k, ja, en, ph) => `<label class="stack"><span>${t(ja, en)}</span><input data-f="${k}" value="${esc(cur[k] ?? "")}" placeholder="${esc(ph || "")}" /></label>`;

      const typeName = (id) => { const x = TYPES.find((y) => y.id === id); return x ? t(x.ja, x.en) : "—"; };
      const rows = [
        ["type", "種類", "Type", (p) => typeName(p.type)],
        ["contact", "担当者・電話", "Contact / phone", (p) => `${esc(p.contact || "—")}${p.phone ? `<br><span class="small">${esc(p.phone)}</span>` : ""}${p.email ? `<br><span class="small">${esc(p.email)}</span>` : ""}`],
        ["address", "所在地", "Based in", (p) => esc(p.address || "—")],
        ["channels", "販売チャネル", "Sales channels", (p) => esc(p.channels || "—")],
        ["cold", "冷蔵倉庫", "Cool storage", (p) => p.cold === "yes" ? `<span class="status good">✓ ${t("あり", "Yes")}</span>` : p.cold === "no" ? `<span class="status warn">✕ ${t("なし", "No")}</span>` : "—"],
        ["categories", "取扱品目", "Categories handled", (p) => esc(p.categories || "—")],
        ["years", "事業年数", "Years in business", (p) => esc(p.years || "—")],
      ];

      el.innerHTML = `
        <div class="card head"><div><h2>${t("パートナー確認", "Partner Check")}</h2>
          <p>${t("インドの輸入者・代理人候補を最大3社まで比較します。ライセンスは必ず公式サイトで確認してください。", "Compare up to 3 candidate Indian importers or agents. Always confirm their licences on the official portals.")}</p></div>
          <div class="row">${PORTALS.map((p) => `<a class="btn sm" href="${p.url}" target="_blank" rel="noopener">${t(p.ja, p.en)} ↗</a>`).join("")}</div></div>
        ${leadsCard(cat, topStates(cat, 5))}
        ${findCard(cat)}
        ${packCard()}
        <div class="card"><p class="section-title">${editing !== null && list[editing] ? t("候補を編集", "Edit candidate") : t("候補を追加", "Add a candidate")}</p>
          <div class="grid3">
            ${f("name", "会社名", "Company name")}
            <label class="stack"><span>${t("種類", "Type")}</span><select data-f="type"><option value="">—</option>${TYPES.map((x) => `<option value="${x.id}" ${cur.type === x.id ? "selected" : ""}>${t(x.ja, x.en)}</option>`).join("")}</select></label>
            ${f("contact", "担当者名・役職", "Contact person / role")}${f("phone", "電話・WhatsApp", "Phone / WhatsApp")}
            ${f("address", "所在地（都市・州）", "Based in (city, state)")}
            ${f("channels", "販売チャネル", "Sales channels", "Supermarkets, kirana, e-commerce")}
            <label class="stack"><span>${t("冷蔵倉庫", "Cool storage")}</span><select data-f="cold"><option value="">—</option><option value="yes" ${cur.cold === "yes" ? "selected" : ""}>${t("あり", "Yes")}</option><option value="no" ${cur.cold === "no" ? "selected" : ""}>${t("なし", "No")}</option></select></label>
            ${f("email", "メールアドレス", "Email")}${f("categories", "取扱品目", "Categories handled")}${f("years", "事業年数", "Years in business")}
          </div>
          <div class="row end" style="margin-top:12px">
            ${list.length < 3 && editing === null ? `<button class="btn sm ghost" id="pt-sample">${t("サンプル会社を追加", "Add sample company")}</button>` : ""}
            ${editing !== null ? `<button class="btn sm ghost" id="pt-cancel">${t("キャンセル", "Cancel")}</button>` : ""}
            <button class="btn primary" id="pt-save" ${list.length >= 3 && editing === null ? "disabled" : ""}>${t("保存", "Save")}</button>
          </div>
        </div>
        ${list.length ? `<div class="card" style="overflow-x:auto"><p class="section-title">${t("比較", "Comparison")}</p>
          <table><thead><tr><th></th>${list.map((p, i) => `<th>${esc(p.name || "—")} ${p.sample ? `<span class="tag review">${t("サンプル会社", "Sample company")}</span>` : ""}${p.lead ? ` <span class="tag info">${t("リストから", "From leads")}</span>` : ""}
            <div class="row" style="margin-top:6px"><button class="btn sm" data-edit="${i}">${t("編集", "Edit")}</button><button class="btn sm" data-del="${i}">${t("削除", "Remove")}</button></div></th>`).join("")}</tr></thead>
          <tbody>${rows.map(([k, ja, en, fn]) => `<tr><td><b>${t(ja, en)}</b></td>${list.map((p) => `<td>${fn(p)}</td>`).join("")}</tr>`).join("")}</tbody></table>
          <p class="small muted" style="margin-top:10px">${t("ラベル審査のステッカー文案には、1社目の会社名と住所が入ります。", "The first company's name and address are used in the Label Check sticker draft.")}</p></div>
        ${checklistCard(list, cat)}
        ${recommendCard(list, cat)}` : ""}`;

      const cpy = $("#pt-copy"); if (cpy) cpy.addEventListener("click", () => navigator.clipboard?.writeText($("#pt-msg").textContent).then(() => (cpy.textContent = "✓")));
      $$("[data-chk]", el).forEach((c) => c.addEventListener("change", () => {
        const [i, id] = c.dataset.chk.split(":"); const p = list[+i];
        p.checks = p.checks || {}; p.checks[id] = c.checked; ID.save("partners"); ID.rerender();
      }));
      const read = () => Object.fromEntries($$("[data-f]", el).map((i) => [i.dataset.f, i.value.trim()]));
      $("#pt-save").addEventListener("click", () => {
        const p = read(); if (!p.name) { alert("Enter a company name"); return; }
        if (editing !== null && list[editing]) list[editing] = { ...list[editing], ...p, sample: false, checks: list[editing].checks || {} }; else list.push(p);
        ID.state.partnerEdit = null; ID.save("partners"); ID.rerender();
      });
      const ls = $("#ld-state"); if (ls) ls.addEventListener("change", () => { ID.state.leadFilter.state = ls.value; ID.rerender(); });
      const lm = $("#ld-more"); if (lm) lm.addEventListener("click", () => { ID.state.leadFilter.more = !ID.state.leadFilter.more; ID.rerender(); });
      const lk = $("#ld-kind"); if (lk) lk.addEventListener("change", () => { ID.state.leadFilter.kind = lk.value; ID.rerender(); });
      $$("[data-lead]", el).forEach((b) => b.addEventListener("click", () => {
        if (list.length >= 3) return;
        list.push(leadToCandidate(ID.LEADS[+b.dataset.lead])); ID.save("partners"); ID.rerender();
      }));
      const smp = $("#pt-sample"); if (smp) smp.addEventListener("click", () => { list.push({ ...SAMPLE }); ID.save("partners"); ID.rerender(); });
      const cn = $("#pt-cancel"); if (cn) cn.addEventListener("click", () => { ID.state.partnerEdit = null; ID.rerender(); });
      $$("[data-edit]", el).forEach((b) => b.addEventListener("click", () => { ID.state.partnerEdit = +b.dataset.edit; ID.rerender(); }));
      $$("[data-del]", el).forEach((b) => b.addEventListener("click", () => { list.splice(+b.dataset.del, 1); ID.state.partnerEdit = null; ID.save("partners"); ID.rerender(); }));
    },
  };
})();
