/* =========================================================================
   Module 1 — Label Check
   Reads the ingredient list (pasted, or from a photo via AI text reading),
   matches every ingredient against the dictionary, and applies fixed rules.
   ========================================================================= */
(function () {
  const { esc, t, $, $$, source } = ID.ui;

  const STATUS = {
    "Animal-derived": { cls: "animal", ja: "動物由来", en: "Animal-derived" },
    "OK": { cls: "ok", ja: "問題なし", en: "OK" },
    "Needs review": { cls: "review", ja: "要確認", en: "Needs review" },
    "Restricted": { cls: "restricted", ja: "規制物質", en: "Restricted" },
  };

  const SAMPLES = [
    { ja: "だしせんべい", en: "Dashi senbei", cat: "food", text: "原材料名：うるち米（国産）、植物油脂、しょうゆ、砂糖、かつおぶし粉末、食塩、こんぶエキス" },
    { ja: "抹茶クッキー", en: "Matcha cookies", cat: "food", text: "原材料名：小麦粉、砂糖、植物油脂、抹茶、食塩\n栄養成分表示（1袋50g当たり）エネルギー 262kcal たんぱく質 3.2g 脂質 13.5g 炭水化物 32.0g 食塩相当量 0.2g" },
    { ja: "こんにゃくゼリー", en: "Konjac jelly", cat: "food", text: "原材料名：果糖ぶどう糖液糖、砂糖、りんご果汁、こんにゃく粉／ゲル化剤（増粘多糖類）、酸味料、香料" },
    { ja: "ビーフカレー", en: "Beef curry", cat: "food", text: "原材料名：牛肉、たまねぎ、小麦粉、ラード、カレー粉、食塩、砂糖\n栄養成分表示（1袋200g当たり）エネルギー 230kcal たんぱく質 6.8g 脂質 14.2g 炭水化物 18.6g 食塩相当量 2.6g" },
    { ja: "ミルクチョコ", en: "Milk chocolate", cat: "food", text: "原材料名：砂糖、カカオマス、全粉乳、ココアバター、乳糖、乳化剤（大豆由来）、香料" },
    { ja: "化粧水", en: "Face lotion", cat: "cosmetics", text: "水、グリセリン、BG、ヒアルロン酸Na、フェノキシエタノール" },
  ];

  function verdictCard(r, cat) {
    const names = (list) => esc(list.map((i) => i.raw).join("、"));
    if (cat === "food") {
      if (r.verdict === "NON_VEG") return `<div class="verdict nonveg"><div class="mark nonveg"><i></i></div><div>
        <div class="title">${t("ノンベジ（非菜食）", "NON-VEGETARIAN")}</div>
        <p>${t("動物由来の原材料", "Animal-derived ingredient(s)")}: <b>${names(r.animal)}</b></p>
        ${r.review.length ? `<p class="small">${t("別途確認が必要な原材料", "Also needs review")}: ${names(r.review)}</p>` : ""}</div></div>`;
      if (r.verdict === "VEG") return `<div class="verdict veg"><div class="mark veg"><i></i></div><div>
        <div class="title">${t("ベジ（菜食）", "VEGETARIAN")}</div>
        <p>${t("すべての原材料が菜食として確認されました。", "Every ingredient is confirmed vegetarian.")}</p></div></div>`;
      if (r.verdict === "NEEDS_REVIEW") return `<div class="verdict review"><div class="mark q">?</div><div>
        <div class="title">${t("要確認", "NEEDS REVIEW")}</div>
        <p>${t("辞書にない原材料があるため、判定を保留しています（推測はしません）", "Some ingredients are not in the dictionary, so no verdict is given (we never guess)")}: <b>${names(r.review)}</b></p></div></div>`;
    } else {
      if (r.verdict === "RESTRICTED") return `<div class="verdict restricted"><div class="mark q">!</div><div>
        <div class="title">${t("規制物質を検出", "RESTRICTED SUBSTANCE FOUND")}</div>
        <p>${t("インド向けには処方の見直しが必要です", "Reformulation needed for India")}: <b>${names(r.restricted)}</b></p></div></div>`;
      if (r.verdict === "NONE_FOUND") return `<div class="verdict ok"><div class="mark q">✓</div><div>
        <div class="title">${t("登録済みの規制物質は見つかりません", "No listed restricted substance found")}</div>
        <p>${t("辞書にない成分は個別に確認してください", "Check ingredients not in the dictionary individually")}${r.review.length ? `: ${names(r.review)}` : ""}</p></div></div>`;
    }
    return `<div class="notice info">${t("原材料が見つかりませんでした。", "No ingredients found.")}</div>`;
  }

  function resultsHtml(r, cat) {
    const p = ID.state.product;
    const rows = r.items.map((i) => {
      const s = STATUS[i.status];
      return `<tr><td>${esc(i.raw)}</td><td>${esc(i.entry ? i.entry.en : i.en || "—")}</td>
        <td><span class="tag ${s.cls}">${t(s.ja, s.en)}</span></td>
        <td class="small muted">${i.keyword ? t("一致", "matched") + `: ${esc(i.keyword)}` : t("辞書に未登録", "not in dictionary")}</td></tr>`;
    }).join("");
    const missing = r.missing.length
      ? `<ul>${r.missing.map((m) => `<li>${t(m.ja, m.en)} ${m.stickerOk ? `<span class="small muted">(${t("ステッカー可", "sticker allowed")})</span>` : ""}</li>`).join("")}</ul>`
      : `<p class="status good">✓ ${t("必須項目はすべて表示済み", "All required items present")}</p>`;
    const reviewList = r.review.map((i) => i.raw);
    return `
      <div class="card">${verdictCard(r, cat)}
        <div class="row" style="margin-top:12px">${source(cat === "food" ? "FSSAI_LABEL" : "CDSCO_COS", "2026/10/11")}<span class="spacer"></span>
        ${reviewList.length ? `<button class="btn sm" id="lc-translate">${t("未登録の原材料をAIで翻訳", "Translate unknown items (AI)")}</button>` : ""}
        <button class="btn sm" id="lc-log">${t("テスト記録に保存", "Save to Test Log")}</button></div>
      </div>
      <div class="card"><p class="section-title">${t("原材料の判定", "Ingredient results")}</p>
        <table><thead><tr><th>${t("原材料", "Ingredient")}</th><th>English</th><th>${t("判定", "Status")}</th><th>${t("根拠", "Basis")}</th></tr></thead><tbody>${rows}</tbody></table>
      </div>
      <div class="grid2">
        <div class="card"><p class="section-title">${t("インド向けに不足している表示", "Missing for India")}</p>${missing}
          ${cat === "food" ? `<p class="small muted">${t(ID.STICKER_NOTE.ja, ID.STICKER_NOTE.en)}</p>${source(ID.STICKER_NOTE.source, ID.STICKER_NOTE.lastChecked)}` : ""}
        </div>
        ${cat === "food" ? `<div class="card"><div class="row"><p class="section-title" style="margin:0">${t("ステッカー文案（英語）", "Draft sticker text (English)")}</p><span class="spacer"></span><button class="btn sm" id="lc-copy">${t("コピー", "Copy")}</button></div>
          <pre class="sticker" id="lc-sticker" style="margin-top:10px">${esc(ID.stickerText(p.name, r.verdict, ID.state.partners[0]))}</pre>
          <p class="small muted">${t("ロゴとマークは公式のデザインを使用してください。", "Use the official logo and symbol artwork.")}</p></div>` : ""}
      </div>
      ${cat === "food" ? stateNote(r) + `<div class="grid2">${nutritionCard()}${kidsCard()}</div>` : ""}
      <div class="grid2">${cat === "food" ? dietCard(r) : ""}${heatCard(cat)}</div>`;
  }

  /* ---------- Eggless and Jain (India-specific diet questions) ---------- */
  const DIET_STATUS = {
    yes: ["good", "✓", "はい", "Yes"],
    no: ["bad", "✕", "いいえ", "No"],
    check: ["warn", "?", "要確認", "Check"],
  };
  function dietCard(r) {
    const d = ID.dietCheck(r);
    const head = `<p class="section-title">${t("エッグレス・ジャイナ教対応（インド向け）", "Eggless and Jain-friendly (India)")}</p>`;
    if (!d) return `<div class="card">${head}</div>`;
    const badge = (st) => { const x = DIET_STATUS[st]; return `<span class="status ${x[0]}">${x[1]} ${t(x[2], x[3])}</span>`; };
    const eggWhy = d.eggless.status === "no" ? t("卵を含む", "contains egg") : d.eggless.status === "check" ? t("由来不明の原材料あり：製造元に確認", "some ingredients of unclear origin: confirm with the factory") : r.verdict === "NON_VEG" ? t("卵はなし（ただしノンベジ製品）", "no egg (but the product is non-vegetarian)") : t("卵は見つかりません", "no egg found");
    const jainList = d.jain.found.slice(0, 6).map((f) => `<li><span class="${f.level === "no" ? "bad-text" : ""}">${f.level === "no" ? "✕" : "?"} ${esc(f.raw)}</span> — ${t(f.ja, f.en)}</li>`).join("");
    return `<div class="card diet">${head}
      <p class="small" style="margin:0 0 12px">${t("インドでは「ベジかどうか」に加えて、卵なし（エッグレス）やジャイナ教の食事（根菜・はちみつ・酒類なし）を気にする人が多くいます。", "Many Indian buyers ask more than veg or non-veg: is it eggless, and is it Jain-friendly (no root vegetables, honey or alcohol)?")}</p>
      <div class="diet-row"><b>${t("エッグレス", "Eggless")}</b>${badge(d.eggless.status)}<span class="small muted">${eggWhy}${d.eggless.found.length ? ": " + esc(d.eggless.found.slice(0, 4).map((f) => f.raw).join("、")) : ""}</span></div>
      <div class="diet-row"><b>${t("ジャイナ教対応", "Jain-friendly")}</b>${badge(d.jain.status)}<span class="small muted">${d.jain.status === "yes" ? t("避けるべき原材料は見つかりません", "nothing Jains avoid was found") : ""}</span></div>
      ${jainList ? `<ul class="small" style="margin:6px 0 0;padding-left:18px">${jainList}</ul>` : ""}
      ${d.eggless.status === "yes" && r.verdict === "VEG" ? `<p class="small" style="margin:12px 0 0">💡 ${t("「EGGLESS（卵不使用）」はパッケージで目立たせる価値があります。", "Worth printing \"EGGLESS\" clearly on the pack: Indian buyers look for it.")}</p>` : ""}
      <p class="small muted" style="margin:10px 0 0">${t("参考情報です。ジャイナ教の食習慣は家庭や宗派で異なります。ハラールは原材料だけでは判断できず、認証が必要です。", "Guidance only. Jain practice varies by family and sect. Halal cannot be decided from ingredients: it needs a certificate.")}</p>
      ${ID.ui.source(ID.DIET_RULES.source, ID.DIET_RULES.lastChecked)}
    </div>`;
  }

  /* ---------- Heat warning ---------- */
  function heatCard(cat) {
    const h = ID.heatCheck(ID.state.label.text, ID.state.product.name, cat);
    const head = `<p class="section-title">${t("暑さへの注意（インドの夏）", "Heat warning (Indian summer)")}</p>`;
    if (!h.sensitive) return `<div class="card">${head}<p style="margin:0"><span class="status good">✓ ${t("暑さに弱い原材料は見つかりません", "No heat-sensitive ingredients found")}</span></p>
      <p class="small muted" style="margin:10px 0 0">${t("それでも直射日光と高温多湿は避けて保管してください。", "Still store away from direct sun, heat and humidity.")}</p>${ID.ui.source(ID.HEAT_RULES.source, ID.HEAT_RULES.lastChecked)}</div>`;
    return `<div class="card heat">${head}
      <p style="margin:0 0 8px"><span class="status warn">🌡 ${t("暑さで溶ける・傷むおそれがあります", "May melt or spoil in the heat")}</span></p>
      <ul class="small" style="margin:0 0 10px;padding-left:18px">${h.flags.map((f) => `<li><b>${t(f.ja, f.en)}</b>: ${t(f.dja, f.den)}</li>`).join("")}</ul>
      <p class="small" style="margin:0 0 4px">${t("インドの多くの地域では4〜6月が最も暑く、平野部では40℃を超えることがよくあります。", "In most of India, April to June is the hottest time; the plains often go above 40 °C.")}</p>
      <p style="margin:10px 0 4px"><b>${t("対策", "What to do")}</b></p>
      <ol class="small" style="margin:0;padding-left:20px">${ID.HEAT_RULES.advice.map((a) => `<li>${t(a.ja, a.en)}</li>`).join("")}</ol>
      ${cat === "food" ? `<p class="small" style="margin:10px 0 0"><a href="#shelf">${t("賞味期限チェックで到着月を確認", "Check the arrival month on the Shelf-Life Check")} →</a></p>` : ""}
      ${ID.ui.source(ID.HEAT_RULES.source, ID.HEAT_RULES.lastChecked)}
    </div>`;
  }

  /* Beef or liquor changes where the product can be sold (used by the Launch Map). */
  function stateNote(r) {
    const f = ID.stateFlags(r);
    if (!f.reasons.length) return "";
    const parts = [];
    if (f.reasons.includes("beef")) parts.push(t("牛肉を含むため、牛の屠殺を制限している州は進出州マップから除外されます。", "Contains beef: the Launch Map leaves out states that restrict cattle slaughter."));
    if (f.reasons.includes("alcohol")) parts.push(t("酒類を含むため、禁酒州（ビハール、グジャラート、ナガランド、ミゾラム）には注意が表示されます。", "Contains liquor: prohibition states (Bihar, Gujarat, Nagaland, Mizoram) are marked for caution."));
    return `<div class="notice warn" style="margin-bottom:18px">⚠ ${parts.join(" ")} <a href="#map">${t("マップを見る", "See the map")} →</a> <span class="small">(${t("州法は未確認", "state laws not yet verified")})</span></div>`;
  }

  const fmt = (v, unit) => (v === null || v === undefined ? "—" : `${v}${unit ? " " + unit : ""}`);

  function nutritionCard() {
    const n = ID.state.label.nutrition;
    const head = `<p class="section-title">${t("栄養成分（インドの表示項目と比較）", "Nutrition (compared with what India requires)")}</p>`;
    if (!n || !n.found) return `<div class="card">${head}<div class="notice info">${t("栄養成分表示が見つかりません。文字欄に「栄養成分表示」の部分も貼り付けてください（写真なら自動で読み取ります）。", "No nutrition panel found. Paste the 栄養成分表示 part too (a photo reads it automatically).")}</div></div>`;
    const p100 = ID.per100(n);
    const gap = ID.nutritionGap(n);
    const unitOf = (k) => (k.endsWith("Mg") ? "mg" : k === "energyKcal" ? "kcal" : "g");
    const rows = gap.map((g) => {
      const tag = g.status === "present" ? `<span class="tag ok">${t("あり", "Shown")}</span>` : g.status === "calculable" ? `<span class="tag info">${t("計算可", "Calculable")}</span>` : `<span class="tag review">${t("不足", "Missing")}</span>`;
      const per = p100 ? (g.key === "sodiumMg" && g.status === "calculable" ? p100.sodiumFromSalt : p100[g.key]) : null;
      return `<tr><td>${t(g.ja, g.en)}</td><td class="num">${fmt(g.value, unitOf(g.key))}</td><td class="num">${fmt(per, unitOf(g.key))}</td><td>${tag}</td></tr>`;
    }).join("");
    const missing = gap.filter((g) => g.status === "missing").length;
    return `<div class="card">${head}
      <table><thead><tr><th>${t("項目", "Nutrient")}</th><th class="num">${n.basisG ? t(`ラベル（${n.basisG}g当たり）`, `Label (per ${n.basisG} g)`) : t("ラベル", "Label")}</th><th class="num">${t("100g当たり", "Per 100 g")}</th><th></th></tr></thead><tbody>${rows}</tbody></table>
      ${n.saltG !== null ? `<p class="small muted" style="margin:10px 0 0">${t("食塩相当量", "Salt equivalent")}: ${n.saltG} g${n.sodiumFromSalt !== null ? ` → ${t("ナトリウム", "sodium")} ${n.sodiumFromSalt} mg (${t("食塩 ÷ 2.54", "salt ÷ 2.54")})` : ""}</p>` : ""}
      <p style="margin:10px 0 8px">${missing ? `<span class="status warn">! ${t(`インド向けに${missing}項目の追加が必要`, `${missing} item(s) to add for India`)}</span>` : `<span class="status good">✓ ${t("必要な項目はそろっています", "All required items present")}</span>`}</p>
      ${ID.ui.source(ID.NUTRITION_RULE.source, ID.NUTRITION_RULE.lastChecked)}
    </div>`;
  }

  function kidsCard() {
    const k = ID.state.label.kids;
    const head = `<p class="section-title">${t("子ども向けチェック（参考）", "Children: suitability check (guidance)")}</p>`;
    if (!k) return `<div class="card">${head}</div>`;
    const flags = k.flags.length
      ? `<ul style="margin:8px 0 0;padding-left:18px">${k.flags.map((f) => `<li><b>${t(f.ja, f.en)}</b>: ${esc(f.detail)}</li>`).join("")}</ul>`
      : "";
    return `<div class="card">${head}
      <p style="margin:0">${k.verdict === "NO_FLAGS"
        ? `<span class="status good">✓ ${t("子ども向けとして気になる点はありません", "No flags for children")}</span>`
        : `<span class="status warn">! ${t("子ども向けに販売する前に確認", "Check before marketing to children")}</span>`}</p>
      ${flags}
      ${k.allergens.length ? `<p class="small" style="margin:12px 0 0"><b>${t("アレルゲン（日本の特定原材料）", "Allergens (Japan's mandatory list)")}</b>: ${k.allergens.map((a) => t(a.ja, a.en)).join("、 ")}</p>` : ""}
      ${k.nutritionChecked ? "" : `<p class="small muted" style="margin:8px 0 0">${t("栄養成分が読めないため、脂質・糖類・食塩は未確認です。", "Nutrition not available, so fat, sugar and salt were not checked.")}</p>`}
      <p class="small muted" style="margin:10px 0 0">${t("参考情報です（インドの法的基準ではありません）。脂質・糖類・食塩の基準は英国食品基準庁の「高い」値を参考にしています。", "Guidance only, not an Indian legal standard. Fat, sugar and salt limits use the UK Food Standards Agency 'high' thresholds as a reference.")}</p>
    </div>`;
  }

  function run() {
    const s = ID.state.label;
    s.present = $$("[data-present]:checked").map((c) => c.dataset.present);
    ID.runLabel($("#lc-text").value);
    ID.rerender();
  }

  /* Shrinks a photo to at most 1600 px on its longest side (JPEG) before sending:
     much faster to upload, still plenty for reading label text. */
  function shrink(dataUrl, max = 1600) {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const k = Math.min(1, max / Math.max(img.width, img.height));
        const c = document.createElement("canvas");
        c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
        c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
        resolve(c.toDataURL("image/jpeg", 0.85));
      };
      img.onerror = () => resolve(dataUrl);
      img.src = dataUrl;
    });
  }

  /* Remembers photos already read (in this browser), so a repeat is instant. */
  const hash = (str) => { let h = 2166136261; for (let i = 0; i < str.length; i += 7) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); } return (h >>> 0).toString(36) + str.length; };
  const cache = {
    get(k) { try { return (JSON.parse(localStorage.getItem("indiaDesk.ocrCache") || "{}"))[k]; } catch (e) { return null; } },
    set(k, v) {
      try {
        const all = JSON.parse(localStorage.getItem("indiaDesk.ocrCache") || "{}");
        all[k] = v; const keys = Object.keys(all); if (keys.length > 30) delete all[keys[0]];
        localStorage.setItem("indiaDesk.ocrCache", JSON.stringify(all));
      } catch (e) { /* storage unavailable: skip caching */ }
    },
  };

  async function readPhoto() {
    const s = ID.state.label;
    const out = $("#lc-ocr-msg");
    if (!ID.gemini.hasKey()) {
      out.innerHTML = `<div class="notice warn">${t("写真の読み取りにはAPIキーが必要です（右上の⚙）。原材料の文字を貼り付けて使うこともできます。", "Reading photos needs an API key (⚙ top right). You can paste the ingredient text instead.")}</div>`;
      return;
    }
    const btn = $("#lc-ocr"); btn.disabled = true;
    const started = Date.now();
    const tick = () => { out.innerHTML = `<p class="muted small">${t("読み取り中…", "Reading label…")} ${Math.floor((Date.now() - started) / 1000)}s</p>`; };
    tick(); const timer = setInterval(tick, 500);
    try {
      const key = "v2" + hash(s.image);
      let text = cache.get(key);
      if (!text) {
        const small = await shrink(s.image);
        const r = await ID.gemini.readLabel(small);
        if (!r.found || !r.ingredientsText) throw new Error("No ingredient list found on this photo. Try a closer, sharper photo of the 原材料名 section.");
        text = r.ingredientsText + (r.nutritionText ? "\n" + r.nutritionText : "");
        cache.set(key, text);
      }
      const secs = ((Date.now() - started) / 1000).toFixed(1);
      clearInterval(timer);
      s.text = text;
      $("#lc-text").value = text;
      run(); // check runs immediately; the read text stays visible in the box for review
      const msg = $("#lc-ocr-msg");
      if (msg) msg.innerHTML = `<p class="status good">✓ ${t(`読み取り完了（${secs}秒）：文字を確認してください`, `Read in ${secs}s: check the text`)}</p>`;
    } catch (e) {
      clearInterval(timer);
      out.innerHTML = `<div class="notice bad">${esc(e.message)}</div>`;
      btn.disabled = false;
    }
  }

  async function translateUnknown() {
    const r = ID.state.label.result;
    const btn = $("#lc-translate");
    if (!ID.gemini.hasKey()) { alert("Add an API key in Settings (⚙) first."); return; }
    btn.disabled = true; btn.textContent = "…";
    try {
      const out = await ID.gemini.translate(r.review.map((i) => i.raw));
      for (const it of out.items || []) { const m = r.items.find((i) => i.raw === it.ja); if (m) m.en = it.en + " (AI translation)"; }
      ID.rerender();
    } catch (e) { alert(e.message); btn.disabled = false; }
  }

  function saveToLog() {
    const r = ID.state.label.result;
    ID.state.testLog.unshift({
      id: Date.now(), date: ID.fmtDate(new Date()), product: ID.state.product.name || "(unnamed)",
      category: ID.state.product.category, verdict: r.verdict,
      items: r.items.map((i) => ({ raw: i.raw, status: i.status, mark: "" })),
    });
    ID.save("testLog");
    ID.go("testlog");
  }

  ID.views.label = {
    render(el) {
      const s = ID.state.label, cat = ID.state.product.category;
      const rules = ID.LABEL_RULES.filter((r) => r.category === cat);
      el.innerHTML = `
        <div class="card head"><div><h2>${t("ラベル審査", "Label Check")}</h2>
          <p>${t("日本語の原材料表示を辞書と固定ルールで判定します。辞書にない原材料は推測せず「要確認」にします。", "Checks the Japanese ingredient list against the dictionary and fixed rules. Ingredients not in the dictionary are never guessed: they are marked Needs review.")}</p></div>
          <span class="source">${t("辞書", "Dictionary")}: ${ID.DICTIONARY.length} ${t("項目", "entries")}</span></div>
        <div class="grid2">
          <div class="card">
            <p class="section-title">${t("① ラベル写真（任意・AI読み取り）", "① Label photo (optional, AI reading)")}</p>
            <label class="drop" id="lc-drop">${s.image ? `<img src="${s.image}" alt="Label photo" />` : ""}
              ${t("クリックまたはドラッグで写真を追加", "Click or drag a photo here")}
              <input type="file" accept="image/*" id="lc-file" hidden /></label>
            <div class="row" style="margin-top:10px"><button class="btn sm" id="lc-ocr" ${s.image ? "" : "disabled"}>${t("写真から原材料を読む", "Read ingredients from photo")}</button></div>
            <div id="lc-ocr-msg" style="margin-top:8px"></div>
          </div>
          <div class="card">
            <p class="section-title">${t("② 原材料の文字", "② Ingredient text")}</p>
            <textarea id="lc-text" placeholder="原材料名：小麦粉、砂糖、…">${esc(s.text)}</textarea>
            <p class="small muted" style="margin:8px 0 4px">${t("サンプル", "Samples")}:</p>
            <div class="row">${SAMPLES.map((x, i) => `<button class="btn sm" data-sample="${i}">${t(x.ja, x.en)}</button>`).join("")}</div>
            <p class="small muted" style="margin:6px 0 0">${t("サンプルは説明用で、実際の製品の表示ではありません。", "Samples are illustrative, not real product labels.")}</p>
          </div>
        </div>
        <div class="card">
          <p class="section-title">${t("③ 既にパッケージにある表示（あればチェック）", "③ Already on the pack? (tick if yes)")}</p>
          <div class="row">${rules.map((r) => `<label class="row small"><input type="checkbox" style="width:auto" data-present="${r.id}" ${s.present.includes(r.id) ? "checked" : ""}/> ${t(r.ja, r.en)}</label>`).join("")}</div>
          <div class="row end" style="margin-top:12px"><button class="btn primary" id="lc-run">${t("審査を実行", "Run check")}</button></div>
        </div>
        <div id="lc-results">${s.result ? resultsHtml(s.result, cat) : ""}</div>`;

      const file = $("#lc-file"), drop = $("#lc-drop");
      const load = (f) => { if (!f) return; const rd = new FileReader(); rd.onload = () => { s.image = rd.result; ID.rerender(); }; rd.readAsDataURL(f); };
      file.addEventListener("change", () => load(file.files[0]));
      drop.addEventListener("dragover", (e) => { e.preventDefault(); drop.classList.add("over"); });
      drop.addEventListener("dragleave", () => drop.classList.remove("over"));
      drop.addEventListener("drop", (e) => { e.preventDefault(); load(e.dataTransfer.files[0]); });
      $("#lc-ocr").addEventListener("click", readPhoto);
      $("#lc-run").addEventListener("click", run);
      $$("[data-sample]").forEach((b) => b.addEventListener("click", () => {
        const x = SAMPLES[+b.dataset.sample];
        if (x.cat !== ID.state.product.category) { ID.state.product.category = x.cat; ID.save("product"); ID.state.map.weights = null; }
        $("#lc-text").value = x.text; s.result = null; run();
      }));
      if (s.result) {
        $("#lc-log").addEventListener("click", saveToLog);
        const tr = $("#lc-translate"); if (tr) tr.addEventListener("click", translateUnknown);
        const cp = $("#lc-copy"); if (cp) cp.addEventListener("click", () => {
          navigator.clipboard?.writeText($("#lc-sticker").textContent).then(() => (cp.textContent = "✓"));
        });
      }
    },
  };
})();
