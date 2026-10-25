/* =========================================================================
   Shinzoku Setu — rules engine (pure functions, no screen code)
   Runs in the browser and in Node (for tests/run-tests.js).
   ========================================================================= */
(function (root) {
  const ID = (root.ID = root.ID || {});
  const DAY = 24 * 60 * 60 * 1000;

  /* ---------------- Dates (YYYY/MM/DD, calculated in UTC) ---------------- */
  function parseDate(s) {
    if (s instanceof Date) return s;
    const m = String(s || "").trim().match(/^(\d{4})[\/\-.](\d{1,2})[\/\-.](\d{1,2})$/);
    if (!m) return null;
    const d = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]));
    return isNaN(d) ? null : d;
  }
  function fmtDate(d) {
    if (!d) return "";
    const p = (n) => String(n).padStart(2, "0");
    return `${d.getUTCFullYear()}/${p(d.getUTCMonth() + 1)}/${p(d.getUTCDate())}`;
  }
  const addDays = (d, n) => new Date(d.getTime() + n * DAY);
  const daysBetween = (a, b) => Math.round((b.getTime() - a.getTime()) / DAY);

  /* ---------------- Label Check ---------------- */
  const BOILERPLATE = new Set(["原材料", "原材料名", "調味料", "等", "含む", "国産", "国内産", "国内製造", "外国製造", "外国産", "輸入", "その他"]);

  function splitIngredients(text) {
    if (!text) return [];
    let src = String(text);
    // Stop at the nutrition panel: everything after it is not an ingredient.
    const cut = src.search(/栄養成分|エネルギー\s*[:：]?\s*[\d０-９]/);
    if (cut >= 0) src = src.slice(0, cut);
    const cleaned = src
      .replace(/原材料名?\s*[：:]/g, "")
      .replace(/【原材料】/g, "")
      .replace(/(内容量|賞味期限|消費期限|保存方法|製造者|販売者|原産国名?|栄養成分).*$/gm, "")
      .replace(/[（(](?:国産|国内産|国内製造|外国産|輸入|遺伝子組換えでない|一部に[^）)]*を含む|その他[^）)]*)[）)]/g, "")
      // origin notes such as （アメリカ産）, （中国産、タイ産）
      .replace(/[（(][^（）()]*産[）)]/g, "")
      // An additive class with its members named, e.g. 乳化剤（大豆由来）, 着色料（カラメル、カロテン):
      // judge the named members, not the vague class name.
      .replace(/(乳化剤|着色料|増粘剤|増粘多糖類|酸化防止剤|甘味料|酸味料|膨張剤|安定剤|ゲル化剤|pH調整剤|光沢剤|保存料|香料|調味料)[（(]([^（）()]+)[）)]/g, "、$2、");
    const parts = cleaned.split(/[、,，・\n\/／()（）;；:：「」]/).map((s) => s.trim());
    const out = [];
    for (const s of parts) {
      if (!s || BOILERPLATE.has(s)) continue;
      if (/^[\d\s.%％gGmMlLkK]+$/.test(s)) continue; // numbers / units only
      if (!out.includes(s)) out.push(s);
    }
    return out;
  }

  const SEVERITY = { "Restricted": 3, "Animal-derived": 2, "Needs review": 1, "OK": 0 };

  /* Picks the dictionary entry with the LONGEST keyword contained in the
     ingredient name (so 牛乳 beats 牛). Ties go to the stricter status.
     Never guesses: no match -> "Needs review". */
  function matchIngredient(token, category, dict) {
    const norm = String(token).trim().toLowerCase();
    let best = null;
    for (const e of dict) {
      if (e.category !== "both" && e.category !== category) continue;
      for (const kw of e.keywords) {
        const k = kw.toLowerCase();
        if (!k || !norm.includes(k)) continue;
        if (!best || k.length > best.kw.length ||
            (k.length === best.kw.length && SEVERITY[e.status] > SEVERITY[best.e.status])) {
          best = { e, kw: k };
        }
      }
    }
    if (!best) return { raw: token, status: "Needs review", entry: null, keyword: null };
    return { raw: token, status: best.e.status, entry: best.e, keyword: best.kw };
  }

  /* presentElements: ids of label rules already on the pack (ticked by user). */
  function auditLabel(text, category, dict, presentElements) {
    const present = presentElements || [];
    const items = splitIngredients(text).map((t) => matchIngredient(t, category, dict));
    const animal = items.filter((i) => i.status === "Animal-derived");
    const review = items.filter((i) => i.status === "Needs review");
    const restricted = items.filter((i) => i.status === "Restricted");
    let verdict;
    if (category === "food") {
      // Rule: any animal-derived ingredient => NON-VEGETARIAN, whatever else is unknown.
      verdict = animal.length ? "NON_VEG" : review.length ? "NEEDS_REVIEW" : items.length ? "VEG" : "EMPTY";
    } else {
      verdict = restricted.length ? "RESTRICTED" : items.length ? "NONE_FOUND" : "EMPTY";
    }
    const missing = (ID.LABEL_RULES || []).filter((r) => r.category === category && !present.includes(r.id));
    return { items, animal, review, restricted, verdict, missing };
  }

  function stickerText(productName, verdict, importer) {
    const imp = importer && importer.name ? importer : { name: "[Importer name]", address: "[Importer address, India]", fssai: "[14-digit FSSAI licence no.]" };
    const mark = verdict === "NON_VEG" ? "NON-VEGETARIAN (brown symbol)" : verdict === "VEG" ? "VEGETARIAN (green symbol)" : "[Veg / Non-veg symbol: confirm after review]";
    return [
      `Product: ${productName || "[Product name]"}`,
      `Imported by: ${imp.name}`,
      `Address: ${imp.address || "[Importer address, India]"}`,
      `FSSAI Lic. No.: ${imp.fssai || "[14-digit FSSAI licence no.]"}  [FSSAI logo]`,
      `Food type: ${mark}`,
    ].join("\n");
  }

  /* ---------------- Shelf-Life Check ---------------- */
  function shelfLife({ mfg, exp, dispatch, transitDays, clearanceDays, minPercent }) {
    const m = parseDate(mfg), e = parseDate(exp), d = parseDate(dispatch);
    if (!m || !e || !d) return { error: "dates" };
    const total = daysBetween(m, e);
    if (total <= 0) return { error: "order" };
    const logistics = (+transitDays || 0) + (+clearanceDays || 0);
    const clearance = addDays(d, logistics);
    const remaining = daysBetween(clearance, e);
    const pct = Math.max(0, (remaining / total) * 100);
    const needDays = Math.ceil((minPercent / 100) * total);
    const latestClearance = addDays(e, -needDays);
    const latestDispatch = addDays(latestClearance, -logistics);
    return {
      total, logistics, needDays, remaining,
      pct: Math.round(pct * 10) / 10,
      pass: remaining >= needDays,
      clearanceDate: fmtDate(clearance),
      latestClearance: fmtDate(latestClearance),
      latestDispatch: fmtDate(latestDispatch),
      daysBeforeDispatch: daysBetween(m, d),
    };
  }

  /* ---------------- Price Builder ----------------
     Duty is charged on (factory price + freight); GST on (that + duty). */
  /* Price Builder, following the Indian import steps:
     1. Factory price (JPY) x rate            = factory price in Rs
     2. + freight and insurance               = assessable value (CIF)
     3. Basic Customs Duty (BCD)              = CIF x duty %
     4. Social Welfare Surcharge (SWS)        = BCD x 10 %
     5. IGST at the port                      = (CIF + BCD + SWS) x GST %   (cash paid, later
        claimed back as input tax credit by the importer, so it is not marked up)
     6. Cost for pricing                      = CIF + BCD + SWS + clearance
     7. Importer, distributor, retailer margins on that cost
     8. GST on the final sale                 = retail price before tax x GST %
     9. MRP (printed price, includes all taxes) rounded up to the next Rs 5 */
  function price(p) {
    const r2 = (x) => Math.round(x * 100) / 100;
    const factoryInr = (+p.factoryJpy || 0) * (+p.rate || 0);
    const freight = +p.freight || 0;
    const assessable = factoryInr + freight;
    const dutyPct = p.cepa ? +p.cepaPct || 0 : +p.dutyPct || 0;
    const bcd = assessable * (dutyPct / 100);
    const swsPct = p.sws === false ? 0 : (p.swsPct ?? 10);
    const sws = bcd * (swsPct / 100);
    const gstPct = +p.gstPct || 0;
    const igst = (assessable + bcd + sws) * (gstPct / 100);
    const clearance = +p.clearance || 0;
    const landed = assessable + bcd + sws + igst + clearance;      // cash needed per unit at the port
    const cost = assessable + bcd + sws + clearance;               // after IGST credit
    const afterImporter = cost * (1 + (+p.mImp || 0) / 100);
    const afterDistributor = afterImporter * (1 + (+p.mDist || 0) / 100);
    const retailEx = afterDistributor * (1 + (+p.mRet || 0) / 100);
    const gstFinal = retailEx * (gstPct / 100);
    const shelf = retailEx + gstFinal;
    const step = +p.roundTo || 5;
    const mrp = Math.ceil(r2(shelf) / step) * step;
    return {
      factoryInr: r2(factoryInr), freight: r2(freight), assessable: r2(assessable),
      bcd: r2(bcd), sws: r2(sws), swsPct, duty: r2(bcd + sws), dutyPct, igst: r2(igst), gst: r2(gstFinal), gstPct,
      clearance: r2(clearance), landed: r2(landed), cost: r2(cost),
      afterImporter: r2(afterImporter), afterDistributor: r2(afterDistributor), retailEx: r2(retailEx),
      margins: r2(retailEx - cost), shelf: r2(shelf), mrp,
      shelfJpy: p.rate > 0 ? Math.round(shelf / p.rate) : 0,
      multiplier: factoryInr > 0 ? Math.round((shelf / factoryInr) * 10) / 10 : 0,
    };
  }

  /* ---------------- Launch Map scoring ----------------
     Each indicator is min-max scaled 0-100 across the states in the data,
     then Score = sum(weight x scaled) / sum(weights). */
  function scoreStates(states, weights, indicators) {
    const keys = (indicators || ID.INDICATORS).map((i) => i.key);
    if (!states || !states.length) return [];
    const has = (v) => v !== null && v !== undefined && v !== "" && isFinite(+v);
    const mm = {};
    for (const k of keys) {
      const vals = states.filter((s) => has(s[k])).map((s) => +s[k]);
      mm[k] = vals.length ? { min: Math.min(...vals), max: Math.max(...vals) } : null;
    }
    const active = keys.filter((k) => (+weights[k] || 0) > 0 && mm[k]);
    return states
      .map((s) => {
        const scaled = {}, parts = [];
        const present = active.filter((k) => has(s[k]));
        const wSum = present.reduce((a, k) => a + (+weights[k] || 0), 0);
        let score = 0;
        for (const k of keys) {
          if (!mm[k] || !has(s[k])) { scaled[k] = null; continue; }
          const { min, max } = mm[k];
          const v = max === min ? 0 : ((+s[k]) - min) / (max - min) * 100;
          scaled[k] = Math.round(v * 10) / 10;
          if (!present.includes(k) || !wSum) continue;
          const c = v * ((+weights[k] || 0) / wSum);
          score += c;
          parts.push({ key: k, contribution: Math.round(c * 10) / 10 });
        }
        parts.sort((a, b) => b.contribution - a.contribution);
        return {
          state: s.state, score: Math.round(score * 10) / 10, scaled, raw: s, top: parts.slice(0, 3),
          coverage: { have: present.length, of: active.length, complete: present.length === active.length && active.length > 0 },
        };
      })
      .sort((a, b) => b.score - a.score);
  }

  function canonicalState(name) {
    const n = String(name || "").trim();
    const alias = (ID.STATE_ALIASES || {})[n.toLowerCase()];
    if (alias) return alias;
    const tile = (ID.TILES || []).find((t) => t[1].toLowerCase() === n.toLowerCase());
    return tile ? tile[1] : n;
  }

  const num = (v) => (v === null || v === undefined || v === "" || !isFinite(+v) ? null : +v);

  /* Rows for the selected product category: search_interest comes from the
     category's own column (e.g. search_interest_food) when the data has one. */
  function rowsForCategory(data, category) {
    return (data || []).map((r) => {
      const out = { state: r.state };
      for (const ind of ID.INDICATORS) {
        const col = ind.columns && ind.columns[category];
        out[ind.key] = num(col && r[col] !== undefined ? r[col] : r[ind.key]);
      }
      return out;
    });
  }

  /* Indicators that have at least one real value. */
  function availableIndicators(rows) {
    return ID.INDICATORS.map((i) => i.key).filter((k) => rows.some((r) => num(r[k]) !== null));
  }

  /* Default weights restricted to the indicators that have data, totalling 100. */
  function defaultWeights(available) {
    const w = {}, base = ID.INDICATORS.filter((i) => available.includes(i.key));
    const sum = base.reduce((a, i) => a + i.weight, 0) || 1;
    ID.INDICATORS.forEach((i) => (w[i.key] = available.includes(i.key) ? Math.round((i.weight / sum) * 1000) / 10 : 0));
    return w;
  }

  function parseStatesCsv(text) {
    const lines = String(text).replace(/^\uFEFF/, "").split(/\r?\n/).filter((l) => l.trim());
    if (lines.length < 2) throw new Error("CSV needs a header row and at least one state");
    const split = (l) => l.match(/("([^"]|"")*"|[^,]*)(,|$)/g).slice(0, -1).map((c) => c.replace(/,$/, "").replace(/^"|"$/g, "").replace(/""/g, '"').trim());
    const head = split(lines[0]).map((h) => h.toLowerCase());
    if (!head.includes("state")) throw new Error("Missing column: state");
    const known = [...new Set([...(ID.CSV_COLUMNS || []), ...ID.INDICATORS.map((i) => i.key)])].filter((c) => c !== "state" && head.includes(c));
    if (!known.length) throw new Error("No data columns found. Expected some of: " + (ID.CSV_COLUMNS || []).slice(1).join(", "));
    return lines.slice(1).map((l) => {
      const c = split(l), row = {};
      head.forEach((h, i) => (row[h] = c[i]));
      const out = { state: canonicalState(row.state) };
      known.forEach((k) => (out[k] = num(String(row[k] ?? "").replace(/[^\d.\-]/g, ""))));
      return out;
    });
  }

  /* ---------------- Nutrition (栄養成分表示) ----------------
     Reads the Japanese nutrition panel from label text. Deterministic: no AI. */
  const toHalf = (t) => String(t || "").replace(/[０-９．]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0xFEE0)).replace(/，/g, ",");
  function parseNutrition(text) {
    const t = toHalf(text).replace(/\s+/g, " ");
    const n = (re) => { const m = t.match(re); return m ? parseFloat(m[1]) : null; };
    const out = {
      energyKcal: n(/(?:エネルギー|熱量)\s*[:：]?\s*([\d.]+)\s*kcal/i),
      proteinG: n(/(?:たんぱく質|タンパク質|蛋白質)\s*[:：]?\s*([\d.]+)\s*g/),
      fatG: n(/脂質\s*[:：]?\s*([\d.]+)\s*g/),
      satFatG: n(/飽和脂肪酸\s*[:：]?\s*([\d.]+)\s*g/),
      transFatG: n(/トランス脂肪酸\s*[:：]?\s*([\d.]+)\s*g/),
      cholesterolMg: n(/コレステロール\s*[:：]?\s*([\d.]+)\s*mg/),
      carbG: n(/炭水化物\s*[:：]?\s*([\d.]+)\s*g/),
      sugarsG: n(/糖類\s*[:：]?\s*([\d.]+)\s*g/),
      fibreG: n(/食物繊維\s*[:：]?\s*([\d.]+)\s*g/),
      saltG: n(/食塩相当量\s*[:：]?\s*([\d.]+)\s*g/),
      sodiumMg: n(/ナトリウム\s*[:：]?\s*([\d.]+)\s*mg/),
      addedSugarsG: null,
    };
    const basis = t.match(/([\d.]+)\s*(?:g|ml|mL)\s*\)?\s*(?:当たり|あたり)/) || t.match(/(?:当たり|あたり)\s*\(?\s*([\d.]+)\s*(?:g|ml)/);
    out.basisG = basis ? parseFloat(basis[1]) : null;
    out.found = Object.keys(out).some((k) => !["basisG", "found", "addedSugarsG"].includes(k) && out[k] !== null);
    /* Sodium can be calculated from salt equivalent: salt (g) = sodium (g) x 2.54 */
    out.sodiumFromSalt = out.sodiumMg === null && out.saltG !== null ? Math.round((out.saltG / 2.54) * 1000) : null;
    return out;
  }

  function per100(nut) {
    if (!nut || !nut.basisG) return null;
    const f = 100 / nut.basisG, r = (v) => (v === null || v === undefined ? null : Math.round(v * f * 10) / 10);
    const o = {};
    for (const k of ["energyKcal", "proteinG", "fatG", "satFatG", "transFatG", "cholesterolMg", "carbG", "sugarsG", "fibreG", "saltG", "sodiumMg", "sodiumFromSalt"]) o[k] = r(nut[k]);
    return o;
  }

  /* Which nutrients India expects that the Japanese label does not show. */
  function nutritionGap(nut) {
    const req = (ID.NUTRITION_RULE || { required: [] }).required;
    return req.map((r) => {
      let status = nut && nut[r.key] !== null && nut[r.key] !== undefined ? "present" : "missing";
      if (r.key === "sodiumMg" && status === "missing" && nut && nut.sodiumFromSalt !== null) status = "calculable";
      return { ...r, status, value: nut ? (r.key === "sodiumMg" && status === "calculable" ? nut.sodiumFromSalt : nut[r.key]) : null };
    });
  }

  /* ---------------- Children: guidance check ---------------- */
  function kidsCheck(text, nut) {
    const K = ID.KIDS_RULES, raw = String(text || "");
    const items = splitIngredients(raw);
    const hit = (list) => items.filter((it) => list.some((k) => it.includes(k)));
    const flags = [];
    const caf = hit(K.caffeine); if (caf.length) flags.push({ type: "caffeine", ja: "カフェインを含む原材料", en: "Caffeine source", detail: caf.join("、") });
    const alc = hit(K.alcohol); if (alc.length) flags.push({ type: "alcohol", ja: "アルコールを含む原材料", en: "Alcohol ingredient", detail: alc.join("、") });
    const chk = hit(K.choking); if (chk.length) flags.push({ type: "choking", ja: "こんにゃく（ゼリーは窒息の危険）", en: "Konjac (jelly is a choking risk)", detail: chk.join("、") });
    const p = per100(nut);
    if (p) {
      const hi = [];
      if (p.fatG !== null && p.fatG > K.high.fatG) hi.push(`fat ${p.fatG} g`);
      if (p.satFatG !== null && p.satFatG > K.high.satFatG) hi.push(`saturated fat ${p.satFatG} g`);
      if (p.sugarsG !== null && p.sugarsG > K.high.sugarsG) hi.push(`sugars ${p.sugarsG} g`);
      if (p.saltG !== null && p.saltG > K.high.saltG) hi.push(`salt ${p.saltG} g`);
      if (hi.length) flags.push({ type: "high", ja: "100gあたり高い値", en: "High per 100 g", detail: hi.join(", ") });
    }
    const allergens = K.allergens.filter((a) => items.some((it) => a.k.some((k) => it.includes(k)))).map((a) => ({ ja: a.ja, en: a.en }));
    return { flags, allergens, nutritionChecked: !!p, verdict: flags.length ? "CHECK" : "NO_FLAGS" };
  }

  /* ---------------- State restrictions from the label result ---------------- */
  function stateFlags(result) {
    const out = { excluded: {}, caution: {}, reasons: [] };
    if (!result || !result.items) return out;
    const ids = result.items.map((i) => i.entry && i.entry.id).filter(Boolean);
    const R = ID.STATE_RULES;
    if (ids.some((id) => id === "beef" || id === "beef_tallow")) {
      out.reasons.push("beef");
      (ID.TILES || []).map((t) => t[1]).filter((st) => !R.beef.unrestricted.includes(st)).forEach((st) => (out.excluded[st] = "beef"));
    }
    if (ids.includes("liquor")) {
      out.reasons.push("alcohol");
      R.alcohol.prohibition.forEach((st) => (out.caution[st] = "alcohol"));
    }
    return out;
  }

  /* Partner due-diligence progress: how many of the relevant checks are done. */
  function partnerScore(partner, category) {
    const list = (ID.PARTNER_CHECKS || []).filter((c) => c[category]);
    const done = list.filter((c) => partner && partner.checks && partner.checks[c.id]).length;
    return { done, total: list.length, pct: list.length ? Math.round((done / list.length) * 100) : 0 };
  }

  /* ---------------- Partner Check ---------------- */
  function checkFormat(kind, value) {
    const v = String(value || "").trim().toUpperCase();
    if (!v) return "missing";
    const h = ID.FORMAT_HINTS[kind];
    return h && h.pattern.test(v) ? "format_ok" : "format_bad";
  }

  /* Partner recommendation: fixed rules, no AI.
     Ranked by the share of due-diligence checks done, then whether the dealer
     is based in a top launch state, then years in business. It recommends
     who to keep checking; it never says a company is verified. */
  function recommendPartner(list, category, topStates) {
    const tops = topStates || [];
    const ranked = (list || []).map((p, i) => {
      const flags = [];
      const sc = partnerScore(p, category);
      const checks = (ID.PARTNER_CHECKS || []).filter((c) => c[category]);
      const next = checks.filter((c) => !(p.checks && p.checks[c.id])).map((c) => c.id);
      const addr = String(p.address || "").toLowerCase();
      const inTop = tops.find((s) => addr.includes(s.toLowerCase())) || null;
      const years = parseFloat(p.years) || 0;
      const level = flags.length ? "fix" : sc.pct >= 80 ? "ready" : "continue";
      return { i, name: p.name || "", sample: !!p.sample, flags, done: sc.done, total: sc.total, pct: sc.pct, next, inTop, years, level };
    });
    ranked.sort((a, b) => (a.flags.length > 0) - (b.flags.length > 0) || b.pct - a.pct || (!!b.inTop - !!a.inTop) || b.years - a.years || a.i - b.i);
    return { best: ranked[0] || null, ranked };
  }

  /* ---------------- Negotiation Prep ----------------
     The shelf price is a straight line in the factory price (shelf = a x f + b),
     so we can solve exactly for the factory price that keeps the MRP the same
     after a change such as a higher importer margin. */
  function factoryToKeepShelf(inputs, factoryJpy, changes) {
    const base = price({ ...inputs, factoryJpy }).shelf;
    const q = { ...inputs, ...changes };
    const b = price({ ...q, factoryJpy: 0 }).shelf;
    const a = price({ ...q, factoryJpy: 1000 }).shelf - b;
    if (a <= 0) return null;
    return Math.round(((base - b) / a) * 1000);
  }
  /* Lowest factory price the SME can accept: cost + minimum profit. */
  function floorPrice(costJpy, minProfitPct) {
    const c = +costJpy || 0;
    return c > 0 ? Math.ceil(c * (1 + (+minProfitPct || 0) / 100)) : null;
  }
  /* How many extra importer-margin points can we give, keeping the MRP, before
     the factory price falls below our floor? (0-30 points) */
  function marginRoom(inputs, factoryJpy, floorJpy) {
    if (!floorJpy || !(+factoryJpy > 0)) return null;
    let room = 0;
    for (let k = 1; k <= 30; k++) {
      const f = factoryToKeepShelf(inputs, +factoryJpy, { mImp: (+inputs.mImp || 0) + k });
      if (f === null || f < floorJpy) break;
      room = k;
    }
    return room;
  }

  /* Pick the Indian port that is near the most of the given states. */
  function suggestPort(states) {
    const list = (ID.SHIPPING && ID.SHIPPING.inPorts) || [];
    const scored = list.map((p) => ({ id: p.id, hits: (states || []).filter((s) => p.serves.includes(s)) }));
    scored.sort((a, b) => b.hits.length - a.hits.length);
    return scored[0] && scored[0].hits.length ? scored[0] : null;
  }

  /* Diet check: eggless and Jain-friendly. Never guesses: unclear -> "check". */
  function dietCheck(result) {
    const R = ID.DIET_RULES;
    const out = { eggless: { status: "yes", found: [] }, jain: { status: "yes", found: [] } };
    if (!result || !result.items || !result.items.length) return null;
    const has = (raw, list) => list.find((k) => raw.includes(k));
    result.items.forEach((it) => {
      const raw = it.raw || "", id = it.entry && it.entry.id;
      // Eggless
      if (id === "egg" || id === "egg_more" || has(raw, R.egg)) out.eggless.found.push({ raw, why: "egg" });
      // Jain
      if (it.status === "Animal-derived") { out.jain.found.push({ raw, level: "no", ja: "動物由来", en: "animal-derived" }); return; }
      const avoid = R.jainAvoid.find((g) => has(raw, g.k));
      if (avoid) { out.jain.found.push({ raw, level: "no", ja: avoid.ja, en: avoid.en }); return; }
      const chk = R.jainCheck.find((g) => has(raw, g.k));
      if (chk) { out.jain.found.push({ raw, level: "check", ja: chk.ja, en: chk.en }); return; }
      if (has(raw, R.starch.k) && !has(raw, R.starch.safe)) { out.jain.found.push({ raw, level: "check", ja: "でん粉（原料不明・じゃがいもの可能性）", en: "starch (source not stated; may be potato)" }); return; }
      if (it.status === "Needs review") out.jain.found.push({ raw, level: "check", ja: "由来が不明", en: "origin unclear" });
    });
    const reviewRaw = result.items.filter((i) => i.status === "Needs review").map((i) => i.raw);
    if (out.eggless.found.length) out.eggless.status = "no";
    else if (reviewRaw.length) { out.eggless.status = "check"; out.eggless.found = reviewRaw.map((raw) => ({ raw, why: "unclear" })); }
    out.jain.status = out.jain.found.some((f) => f.level === "no") ? "no" : out.jain.found.length ? "check" : "yes";
    return out;
  }

  /* Heat check: flags products that melt or spoil in India's hot season. */
  function heatCheck(text, productName, category) {
    const all = String(text || "") + " " + String(productName || "");
    const flags = (ID.HEAT_RULES.groups || []).filter((g) => g.cat === category && g.k.some((k) => all.includes(k)));
    return { sensitive: flags.length > 0, flags };
  }
  /* Is a date (YYYY/MM/DD) in India's hottest months? */
  function inHotSeason(dateStr) {
    const d = parseDate(dateStr);
    return !!d && ID.HEAT_RULES.hotMonths.includes(d.getUTCMonth() + 1);
  }

  /* Export readiness: one Go / Not yet answer from the 5 checks.
     Each check is ok, warn (fix soon), bad (blocks export) or todo (not run).
     GO only when all 5 are ok. Any bad -> NOT_YET. More than 2 not run ->
     IN_PROGRESS. Otherwise ALMOST. */
  function readiness(x) {
    const items = [];
    // 1. Label
    if (!x.label) items.push({ id: "label", status: "todo", why: "not_run" });
    else if (x.label.restricted > 0) items.push({ id: "label", status: "bad", why: "restricted" });
    else if (x.label.verdict === "NEEDS_REVIEW") items.push({ id: "label", status: "warn", why: "review" });
    else items.push({ id: "label", status: "ok", why: x.label.missing > 0 ? "sticker" : "clear" });
    // 2. Shelf life (food) or registration pre-check (cosmetics)
    if (x.category === "food") {
      if (!x.shelf) items.push({ id: "shelf", status: "todo", why: "not_run" });
      else items.push({ id: "shelf", status: x.shelf.pass ? "ok" : "bad", why: x.shelf.pass ? "pass" : "fail" });
    } else {
      const d = x.cos ? x.cos.done : 0, tot = x.cos ? x.cos.total : 0;
      items.push({ id: "shelf", status: tot && d === tot ? "ok" : d > 0 ? "warn" : "todo", why: tot && d === tot ? "cos_done" : d > 0 ? "cos_partial" : "not_run" });
    }
    // 3. Price
    items.push({ id: "price", status: x.priceSet ? "ok" : "todo", why: x.priceSet ? "set" : "not_run" });
    // 4. Market
    items.push({ id: "map", status: x.topStates && x.topStates.length ? "ok" : "todo", why: x.topStates && x.topStates.length ? "ranked" : "not_run" });
    // 5. Partner
    const b = x.partner;
    if (!b) items.push({ id: "partner", status: "todo", why: "not_run" });
    else if (b.level === "fix") items.push({ id: "partner", status: "bad", why: "red_flags" });
    else if (b.sample) items.push({ id: "partner", status: "warn", why: "sample" });
    else if (b.level === "continue") items.push({ id: "partner", status: "warn", why: "checks" });
    else items.push({ id: "partner", status: "ok", why: "ready" });
    const ok = items.filter((i) => i.status === "ok").length;
    const todo = items.filter((i) => i.status === "todo").length;
    const verdict = items.some((i) => i.status === "bad") ? "NOT_YET" : ok === items.length ? "GO" : todo > 2 ? "IN_PROGRESS" : "ALMOST";
    return { items, ok, total: items.length, verdict };
  }

  Object.assign(ID, {
    dietCheck, heatCheck, inHotSeason, suggestPort, factoryToKeepShelf, floorPrice, marginRoom,
    readiness, recommendPartner,
    parseDate, fmtDate, addDays, daysBetween,
    splitIngredients, matchIngredient, auditLabel, stickerText,
    shelfLife, price, scoreStates, parseStatesCsv, canonicalState, checkFormat,
    rowsForCategory, availableIndicators, defaultWeights,
    parseNutrition, per100, nutritionGap, kidsCheck, stateFlags, partnerScore,
  });
  if (typeof module !== "undefined") module.exports = ID;
})(typeof window !== "undefined" ? window : globalThis);
