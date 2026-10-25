/* =========================================================================
   Negotiation Prep — "Before your first call" (bilingual, rule-based, no AI)
   Uses the SME's own numbers from earlier steps:
     - bottom line (lowest factory price) from cost + minimum profit
     - how much extra margin can be given while keeping the MRP
     - prepared answers to the questions Indian importers usually ask
   After the call: an English follow-up email for the importer and a Japanese
   internal memo for the SME's approval process (稟議).
   ========================================================================= */
(function () {
  const { esc, t, $, $$, money } = ID.ui;

  const PAY = {
    advance: ["前払い（100%）", "100% advance payment"],
    split: ["一部前払い＋船積み書類と引換え", "Part advance, balance against shipping documents"],
    lc: ["信用状（L/C）", "Letter of credit (L/C)"],
    credit: ["掛け売り（後払い）", "Credit (pay later)"],
  };

  /* Give -> get: what to ask for when you give something (guidance). */
  const TRADES = [
    { gj: "独占販売権", ge: "Exclusive rights", aj: "年間の最低購入量と、対象州の限定", ae: "A minimum yearly volume, and only for the states they really cover" },
    { gj: "高いマージン", ge: "A higher margin", aj: "主要店舗への陳列・販促の約束", ae: "Listing in named stores and a launch promotion plan" },
    { gj: "長い支払期限", ge: "Longer credit days", aj: "初回は前払いまたはL/C、実績後に掛け売り", ae: "Advance or L/C for the first orders; credit only after a track record" },
    { gj: "小さな最低発注量", ge: "A smaller minimum order", aj: "少し高い単価、または混載（LCL）の運賃負担", ae: "A slightly higher unit price, or they pay the shared-container (LCL) freight" },
    { gj: "無料サンプル", ge: "Free samples", aj: "テスト販売の結果（売れた数・店舗の声）の共有", ae: "Results of the trial: units sold and store feedback" },
  ];

  /* Communication tips: practical differences to plan for (guidance, not rules). */
  const TIPS = [
    { j: "最初の提示には交渉の余地を残す。値下げ要求は普通のことです。", e: "Leave room in your first offer: being asked for a lower price is normal." },
    { j: "「検討します」は曖昧に伝わります。「はい／いいえ／○日までに回答」と明確に。", e: "\"We will consider it\" can sound like a yes. Say yes, no, or \"we will reply by (date)\"." },
    { j: "社内承認（稟議）の手順と回答までの日数を最初に伝える。", e: "Explain your internal approval steps and how many days a decision takes." },
    { j: "通話後は当日中に、決まったことをメールで確認。WhatsAppでの連絡も一般的です。", e: "Confirm what was agreed by email the same day. WhatsApp follow-ups are common." },
  ];

  function nums() {
    const st = ID.state, p = st.product, n = (st.nego = st.nego || ID.ui.store.get("nego", { cost: "", minProfit: 15, extra: 5, partner: 0, out: {} }));
    const pin = st.price, f = +p.price || 0;
    const pr = f ? ID.price({ ...pin, factoryJpy: f }) : null;
    const floor = ID.floorPrice(n.cost, n.minProfit);
    const extra = +n.extra || 0;
    const keepF = f ? ID.factoryToKeepShelf(pin, f, { mImp: (+pin.mImp || 0) + extra }) : null;
    const prUp = f ? ID.price({ ...pin, mImp: (+pin.mImp || 0) + extra, factoryJpy: f }) : null;
    const room = f && floor ? ID.marginRoom(pin, f, floor) : null;
    return { st, p, n, pin, f, pr, floor, extra, keepF, prUp, room };
  }

  function topStates(cat) {
    const rows = ID.rowsForCategory(ID.STATE_DATA, cat);
    const flags = ID.stateFlags(ID.state.label.result);
    return ID.scoreStates(rows, ID.defaultWeights(ID.availableIndicators(rows)))
      .filter((r) => r.coverage && r.coverage.complete && !flags.excluded[r.state]).slice(0, 3).map((r) => r.state);
  }

  function numbersCard(x) {
    const { n, f, pr, floor, extra, keepF, prUp, room, pin } = x;
    if (!f) return `<div class="card"><div class="notice info">${t("先に製品の工場出荷価格を入力してください。", "Enter the product's factory price first.")} <a href="#product">${t("製品へ", "Go to Product")} →</a></div></div>`;
    const safe = floor ? keepF >= floor : null;
    return `<div class="card"><p class="section-title">${t("あなたの数字（交渉の土台）", "Your numbers (the base for negotiating)")}</p>
      <div class="grid3">
        <label class="stack"><span>${t("製造原価（円/個）", "Production cost (¥/unit)")}</span><input type="number" data-n="cost" value="${esc(n.cost)}" placeholder="e.g. 150" /></label>
        <label class="stack"><span>${t("最低限ほしい利益（%）", "Minimum profit you need (%)")}</span><input type="number" data-n="minProfit" value="${esc(n.minProfit)}" /></label>
        <label class="stack"><span>${t("輸入者が求めそうな追加マージン（%）", "Extra margin the importer may ask for (%)")}</span><input type="number" data-n="extra" value="${esc(n.extra)}" /></label>
      </div>
      <div class="grid3 nego-kpis">
        <div class="kpi"><div class="l">${t("提示する工場出荷価格", "Your factory price (offer)")}</div><div class="v">¥${f.toLocaleString()}</div><div class="l">MRP ₹${pr.mrp.toLocaleString("en-IN")}</div></div>
        <div class="kpi big"><div class="l">${t("最低ライン（これ以下は断る）", "Your bottom line (walk away below this)")}</div><div class="v">${floor ? "¥" + floor.toLocaleString() : "—"}</div><div class="l">${floor ? t(`原価＋利益${n.minProfit}%`, `cost + ${n.minProfit}% profit`) : t("原価を入力", "enter your cost")}</div></div>
        <div class="kpi"><div class="l">${t("MRPを変えずに上乗せできるマージン", "Extra margin you can give (same MRP)")}</div><div class="v">${room === null ? "—" : `+${room}%${room === 30 ? "+" : ""}`}</div><div class="l">${t("輸入者マージン", "importer margin")} ${pin.mImp}% → ${room === null ? "—" : (+pin.mImp + room) + "%"}</div></div>
      </div>
      <div class="notice ${safe === false ? "bad" : "info"}" style="margin-top:14px">
        ${t(`輸入者がマージンを＋${extra}%求めた場合：`, `If the importer asks for +${extra}% margin:`)}
        <ul style="margin:6px 0 0;padding-left:18px">
          <li>${t(`工場価格を変えない → MRPは ₹${pr.mrp} から ₹${prUp.mrp} に上がる`, `Keep your factory price → MRP rises from ₹${pr.mrp} to ₹${prUp.mrp}`)}</li>
          <li>${t(`MRPを変えない → 工場価格を ¥${f} から ¥${keepF} に下げる必要`, `Keep the MRP → your factory price must drop from ¥${f} to ¥${keepF}`)}
            ${safe === null ? "" : safe ? `<span class="status good">✓ ${t("最低ライン以上", "still above your bottom line")}</span>` : `<span class="status bad">✕ ${t("最低ラインを下回る：受けない", "below your bottom line: say no")}</span>`}</li>
        </ul></div>
    </div>`;
  }

  function questionsCard(x) {
    const { st, p, pr, room, pin } = x, cat = p.category, lr = st.label.result;
    const sl = cat === "food" ? ID.shelfLife({ mfg: p.mfg, exp: p.exp, dispatch: st.shelf.dispatch, transitDays: st.shelf.transit, clearanceDays: st.shelf.clearance, minPercent: st.shelf.min ?? ID.SHELF_RULE.minPercent }) : null;
    const diet = cat === "food" && lr ? ID.dietCheck(lr) : null;
    const heat = ID.heatCheck(st.label.text, p.name, cat);
    const tops = topStates(cat);
    const notRun = (step) => `<span class="muted">${t("未実施", "not done yet")} — <a href="#${step}">${t("開く", "open")}</a></span>`;
    const L = { yes: t("はい", "yes"), no: t("いいえ", "no"), check: t("要確認", "to confirm") };
    const vegTxt = lr ? ({ NON_VEG: t("ノンベジ", "non-vegetarian"), VEG: t("ベジ", "vegetarian"), NEEDS_REVIEW: t("確認中", "under review") }[lr.verdict] || "—") : null;
    const Q = [
      { qj: "マージンはどれくらい出せますか？", qe: "What margin can you give us?",
        a: pr ? t(`輸入者${pin.mImp}%・卸${pin.mDist}%・小売${pin.mRet}%でMRP ₹${pr.mrp}。MRPを変えずに輸入者マージンは最大＋${room ?? "?"}%まで。`, `Importer ${pin.mImp}%, distributor ${pin.mDist}%, retailer ${pin.mRet}% gives MRP ₹${pr.mrp}. We can add up to +${room ?? "?"}% for the importer without changing the MRP.`) : notRun("price") },
      { qj: "MRPはいくらですか？競争力はありますか？", qe: "What is the MRP? Is it competitive?",
        a: pr ? t(`推奨MRPは ₹${pr.mrp}（IGST控除後の陸揚げ原価 ${money(pr.cost)}）。店頭で似た商品の価格を一緒に確認しましょう。`, `Suggested MRP is ₹${pr.mrp} (landed cost after IGST credit ${money(pr.cost)}). Let's check similar products on the shelf together.`) : notRun("price") },
      { qj: "最低発注量は？", qe: "What is your minimum order?",
        a: t("まずはテスト出荷（少量・混載）から始め、売れ行きを見て増やす提案を。", "Propose a small trial shipment first (shared container), then grow with sales.") },
      { qj: "独占販売権をもらえますか？", qe: "Can we get exclusive rights?",
        a: t(`相手が実際に販売している州だけに限定し、年間の最低購入量と交換で。進出州マップの上位州：${tops.join(", ") || "—"}`, `Only for the states they really cover, and in return for a minimum yearly volume. Top states on your Launch Map: ${tops.join(", ") || "—"}`) },
      { qj: "支払条件は？", qe: "What payment terms?",
        a: t("初回は前払いまたはL/C。2〜3回の取引実績の後に掛け売りを検討。", "Advance or L/C for the first order. Consider credit after 2–3 orders.") },
      ...(cat === "food" ? [{ qj: "到着時の賞味期限は？", qe: "How much shelf life on arrival?",
        a: sl && !sl.error ? t(`通関時に残り ${sl.remaining} 日（${sl.pct}%）。インドの60%ルールに${sl.pass ? "合格" : "不合格"}。`, `${sl.remaining} days (${sl.pct}%) left at customs clearance: ${sl.pass ? "passes" : "fails"} India's 60% rule.`) : notRun("shelf") },
        { qj: "インド向けラベルは誰が対応しますか？", qe: "Who handles the Indian label?",
        a: t("ステッカー文案はこちらで用意済み。保税倉庫で貼付できます（FSSAI輸入規則）。", "We have the sticker text ready; it can be applied in the customs bonded warehouse (FSSAI import rules).") },
        { qj: "ベジ？卵なし？ジャイナ教対応？", qe: "Veg? Eggless? Jain?",
        a: lr && diet ? t(`${vegTxt}・エッグレス：${L[diet.eggless.status]}・ジャイナ教：${L[diet.jain.status]}。ハラールは認証が必要。`, `${vegTxt}; eggless: ${L[diet.eggless.status]}; Jain: ${L[diet.jain.status]}. Halal needs a certificate.`) : notRun("label") }] : []),
      { qj: "冷蔵輸送は必要ですか？", qe: "Does it need cold storage?",
        a: heat.sensitive ? t("はい。暑さに弱いため、4〜6月は冷蔵輸送と冷蔵倉庫が必要です。", "Yes. It is heat-sensitive, so April–June needs cold shipping and cool storage.") : t("通常は不要。直射日光と高温を避けて保管。", "Not usually. Store away from direct sun and heat.") },
      { qj: "販促やサンプルの支援はありますか？", qe: "Will you support marketing and samples?",
        a: t("サンプルとテスト販売の予算を用意。代わりに陳列店舗と販促計画の共有を依頼。", "We budget for samples and a trial. In return, ask for the store list and promotion plan.") },
    ];
    return `<div class="card"><p class="section-title">${t("インド側によく聞かれる質問と、あなたの答え", "Questions Indian importers usually ask — and your answers")}</p>
      <div class="qa">${Q.map((q, i) => `<details ${i < 3 ? "open" : ""}><summary><b>Q${i + 1}.</b> ${t(q.qj, q.qe)}</summary><div class="ans">${q.a}</div></details>`).join("")}</div>
      <p class="small muted" style="margin:10px 0 0">${t("答えはアプリ内のあなたのデータから自動で作られます。", "Answers are built automatically from your own data in the app.")}</p></div>`;
  }

  function tradesCard() {
    return `<div class="card"><p class="section-title">${t("譲るなら、代わりにこれを求める", "If you give this, ask for this in return")}</p>
      <table><thead><tr><th>${t("相手の要望（譲るもの）", "They ask for (you give)")}</th><th>${t("代わりに求めること", "Ask in return")}</th></tr></thead><tbody>
      ${TRADES.map((x) => `<tr><td><b>${t(x.gj, x.ge)}</b></td><td>${t(x.aj, x.ae)}</td></tr>`).join("")}</tbody></table></div>`;
  }

  function tipsCard() {
    return `<div class="card"><p class="section-title">${t("コミュニケーションのポイント", "Communication tips")}</p>
      <ol class="tips">${TIPS.map((x) => `<li>${t(x.j, x.e)}</li>`).join("")}</ol>
      <p class="small muted" style="margin:8px 0 0">${t("実務上のヒントです。相手や会社によって異なります。", "Practical guidance; every company is different.")}</p></div>`;
  }

  function agendaCard(x) {
    const items = [
      ["自己紹介と製品の説明（製品資料を共有）", "Introductions and the product (share the product brief)"],
      ["相手の販売地域・販売チャネル・取扱品目を聞く", "Ask about their states, sales channels and categories"],
      ["価格・マージン・MRPの確認", "Price, margins and MRP"],
      ["最低発注量・支払条件・ラベル対応", "Minimum order, payment terms and labelling"],
      ["次のステップと期限を決める（サンプル送付など）", "Agree next steps and dates (e.g. send samples)"],
    ];
    return `<div class="card"><p class="section-title">${t("最初の通話のアジェンダ（30分）", "Agenda for the first call (30 min)")}</p>
      <ol>${items.map((i) => `<li>${t(i[0], i[1])}</li>`).join("")}</ol>
      <a class="btn sm" href="#brief">${t("製品資料（PDF）を開く", "Open the product brief (PDF)")}</a></div>`;
  }

  /* After the call: English email to the importer + Japanese internal memo. */
  function afterCall(x) {
    const { st, p, n, pr } = x, o = n.out || {};
    const partner = st.partners[+n.partner] || null;
    const pname = partner ? partner.name : "[Importer name]";
    const pay = PAY[o.pay] || null;
    const email = [
      `Subject: Thank you for today's call — ${p.name || "our product"}`,
      ``,
      `Dear ${partner && partner.contact ? partner.contact : "Sir/Madam"},`,
      ``,
      `Thank you for your time today. To confirm what we discussed:`,
      `- Product: ${p.name || "[product]"}`,
      pr ? `- Suggested MRP: Rs ${pr.mrp}` : null,
      o.margin ? `- Importer margin: ${o.margin}%` : null,
      o.moq ? `- First order: ${o.moq}` : null,
      pay ? `- Payment terms: ${pay[1]}` : null,
      o.excl ? `- Exclusivity: ${o.excl}` : null,
      o.next ? `- Next step: ${o.next}${o.date ? " by " + o.date : ""}` : null,
      ``,
      `Our internal approval usually takes about ${o.days || "[X]"} working days. We will reply by ${o.reply || "[date]"}.`,
      `Please let us know if anything above is not correct.`,
      ``,
      `Best regards,`,
      `[Your name]`,
      `[Company], Japan`,
    ].filter((l) => l !== null).join("\n");
    const memo = [
      `件名：インド輸入者との商談報告（${pname}）`,
      ``,
      `1. 相手先：${pname}${partner && partner.address ? "（" + partner.address + "）" : ""}`,
      `2. 製品：${p.name || "—"}`,
      pr ? `3. 価格：工場出荷価格 ¥${x.f}／推奨MRP ₹${pr.mrp}／最低ライン ${x.floor ? "¥" + x.floor : "未設定"}` : `3. 価格：未計算`,
      `4. 合意・提案内容：`,
      `   ・輸入者マージン：${o.margin ? o.margin + "%" : "未定"}`,
      `   ・初回発注：${o.moq || "未定"}`,
      `   ・支払条件：${pay ? pay[0] : "未定"}`,
      `   ・独占販売：${o.excl || "なし／未定"}`,
      `5. 次のステップ：${o.next || "未定"}${o.date ? "（" + o.date + "まで）" : ""}`,
      `6. 回答期限：${o.reply || "未定"}`,
      `7. 判断が必要な点：${o.decide || "—"}`,
    ].join("\n");
    const f = (k, ja, en, ph) => `<label class="stack"><span>${t(ja, en)}</span><input data-o="${k}" value="${esc(o[k] || "")}" placeholder="${esc(ph || "")}" /></label>`;
    return `<div class="card"><p class="section-title">${t("通話の後：確認メールと社内メモ", "After the call: follow-up email and internal memo")}</p>
      <div class="grid3">
        <label class="stack"><span>${t("相手先", "Importer")}</span><select data-nsel="partner">${st.partners.length ? st.partners.map((q, i) => `<option value="${i}" ${+n.partner === i ? "selected" : ""}>${esc(q.name)}</option>`).join("") : `<option>${t("パートナー確認で候補を追加", "Add a candidate in Partner Check")}</option>`}</select></label>
        ${f("margin", "合意した輸入者マージン（%）", "Agreed importer margin (%)", "20")}
        ${f("moq", "初回発注", "First order", "e.g. 1 pallet, 2,000 packs")}
        <label class="stack"><span>${t("支払条件", "Payment terms")}</span><select data-o="pay"><option value="">—</option>${Object.entries(PAY).map(([k, v]) => `<option value="${k}" ${o.pay === k ? "selected" : ""}>${t(v[0], v[1])}</option>`).join("")}</select></label>
        ${f("excl", "独占販売（州など）", "Exclusivity (which states)", "e.g. Karnataka only, 1 year")}
        ${f("next", "次のステップ", "Next step", "e.g. send 50 samples")}
        ${f("date", "次のステップの期限", "Next step by", "2026/11/15")}
        ${f("days", "社内承認の日数", "Internal approval (working days)", "10")}
        ${f("reply", "回答期限", "We will reply by", "2026/11/20")}
        ${f("decide", "社内で判断が必要な点", "Points to decide internally", "e.g. exclusivity request")}
      </div>
      <div class="grid2" style="margin-top:14px">
        <div><div class="row"><b>${t("英語の確認メール（相手へ）", "English follow-up email (to the importer)")}</b><span class="spacer"></span><button class="btn sm" data-copy="ng-email">${t("コピー", "Copy")}</button></div>
          <pre class="sticker" id="ng-email" style="margin-top:8px">${esc(email)}</pre>
          ${partner && partner.email ? `<a class="btn sm" href="mailto:${encodeURIComponent(partner.email)}?subject=${encodeURIComponent("Thank you for today's call — " + (p.name || ""))}&body=${encodeURIComponent(email.split("\n").slice(2).join("\n"))}">${t("メールで送る", "Send by email")}</a>` : ""}</div>
        <div><div class="row"><b>${t("日本語の社内メモ（稟議用）", "Japanese internal memo (for approval)")}</b><span class="spacer"></span><button class="btn sm" data-copy="ng-memo">${t("コピー", "Copy")}</button></div>
          <pre class="sticker" id="ng-memo" style="margin-top:8px">${esc(memo)}</pre></div>
      </div></div>`;
  }

  ID.views.negotiate = {
    render(el) {
      const x = nums();
      el.innerHTML = `
        <div class="card head"><div><h2>${t("交渉準備", "Negotiation Prep")}</h2>
          <p>${t("インドの輸入者との最初の通話の前に。あなたのデータから、最低ライン・想定問答・確認メール・社内メモを作ります。", "Before your first call with an Indian importer. Your own data becomes a bottom line, prepared answers, a follow-up email and an internal memo.")}</p></div></div>
        ${numbersCard(x)}
        ${questionsCard(x)}
        <div class="grid2">${tradesCard()}${tipsCard()}</div>
        ${agendaCard(x)}
        ${afterCall(x)}`;
      const save = () => ID.ui.store.set("nego", ID.state.nego);
      $$("[data-n]", el).forEach((i) => i.addEventListener("change", () => { ID.state.nego[i.dataset.n] = i.value === "" ? "" : +i.value; save(); ID.rerender(); }));
      $$("[data-o]", el).forEach((i) => i.addEventListener("change", () => { ID.state.nego.out = ID.state.nego.out || {}; ID.state.nego.out[i.dataset.o] = i.value.trim(); save(); ID.rerender(); }));
      $$("[data-nsel]", el).forEach((i) => i.addEventListener("change", () => { ID.state.nego.partner = +i.value || 0; save(); ID.rerender(); }));
      $$("[data-copy]", el).forEach((b) => b.addEventListener("click", () => navigator.clipboard?.writeText($("#" + b.dataset.copy).textContent).then(() => (b.textContent = "✓"))));
    },
  };
})();
