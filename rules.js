/* =========================================================================
   Shinzoku Setu — regulatory rules
   "Fixed rules decide, AI assists."

   Every rule has:
     source      : the regulation it comes from (name only, no clause numbers
                   unless the team has checked the exact clause)
     lastChecked : the date the team confirmed it against a source,
                   or null = NOT YET VERIFIED (shown as a warning in the app)

   To change a rule: edit the values here, update lastChecked, save, reload.
   ========================================================================= */
window.ID = window.ID || {};

ID.SOURCES = {
  SEA_TRANSIT: {
    name: "Japan → India sea transit: about 20–30 days (OceanFreight.jp); Yokohama → Nhava Sheva 26 days (SeaRates)",
    authority: "Freight-forwarder guides (secondary; confirm with your forwarder)",
    url: "https://hub.oceanfreight.jp/en/routes-2/japan-to-chennai-2/",
  },
  FSSAI_CHARTER: {
    name: "FSSAI Citizen's Charter 2025-26: import NOC 2–10 days",
    authority: "Food Safety and Standards Authority of India (FSSAI)",
    url: "https://fssai.gov.in/upload/6a4373a9408c6citizen_charter_2025-26.pdf",
  },
  JAIN_DIET: {
    name: "Jain vegetarianism (overview; practices vary by family and sect)",
    authority: "Secondary source: Wikipedia, 'Jain vegetarianism'",
    url: "https://en.wikipedia.org/wiki/Jain_vegetarianism",
  },
  IMD_CLIMATE: {
    name: "India Meteorological Department: seasons and heat waves",
    authority: "India Meteorological Department (IMD)",
    url: "https://mausam.imd.gov.in",
  },
  FSSAI_IMPORT: {
    name: "FSSAI Food Import Regulations, 2017",
    authority: "Food Safety and Standards Authority of India (FSSAI)",
    url: "https://www.fssai.gov.in",
  },
  FSSAI_LABEL: {
    name: "FSS (Labelling and Display) Regulations, 2020",
    authority: "Food Safety and Standards Authority of India (FSSAI)",
    url: "https://www.fssai.gov.in",
  },
  CDSCO_COS: {
    name: "CDSCO Cosmetics Rules, 2020",
    authority: "Central Drugs Standard Control Organisation (CDSCO)",
    url: "https://cdsco.gov.in",
  },
  DGFT: {
    name: "DGFT Import-Export Code (IEC)",
    authority: "Directorate General of Foreign Trade (DGFT)",
    url: "https://www.dgft.gov.in",
  },
};

/* Label elements an imported product must carry in India. */
ID.LABEL_RULES = [
  {
    id: "importer_details",
    category: "food",
    ja: "インド輸入者の名称および住所",
    en: "Name and address of the Indian importer",
    stickerOk: true,
    source: "FSSAI_IMPORT",
    lastChecked: "2026/10/11",
  },
  {
    id: "fssai_licence",
    category: "food",
    ja: "FSSAIロゴおよびライセンス番号",
    en: "FSSAI logo and licence number",
    stickerOk: true,
    source: "FSSAI_IMPORT",
    lastChecked: "2026/10/11",
  },
  {
    id: "veg_symbol",
    category: "food",
    ja: "ベジ / ノンベジ表示マーク",
    en: "Vegetarian / non-vegetarian symbol",
    stickerOk: true,
    source: "FSSAI_IMPORT",
    lastChecked: "2026/10/11",
  },
  {
    id: "cdsco_registration",
    category: "cosmetics",
    ja: "CDSCO輸入登録（Form COS-2）",
    en: "CDSCO import registration (Form COS-2)",
    stickerOk: false,
    source: "CDSCO_COS",
    lastChecked: "2026/10/11",
  },
];

ID.STICKER_NOTE = {
  ja: "上記の3項目は、税関保税倉庫内で剥がれないステッカー1枚として貼付できます。表示が不適合の貨物は通関を拒否される場合があります。",
  en: "These three items may be added as a single non-detachable sticker in the customs bonded warehouse. Consignments with non-compliant labels can be rejected.",
  source: "FSSAI_IMPORT",
  lastChecked: "2026/10/11",
};

/* Shelf-life rule for imported food. */
ID.SHELF_RULE = {
  minPercent: 60,
  ja: "通関時点で賞味期間の60%以上が残っていること",
  en: "At least 60% of shelf life must remain at customs clearance",
  note: {
    ja: "FSSAIの資料の一部は「60%または期限の3か月前のいずれか短い方」と記載しています。最新の規則本文を確認してください。",
    en: "One FSSAI document words this as '60% or three months before expiry, whichever is less'. Confirm against the current regulation text.",
  },
  source: "FSSAI_IMPORT",
  lastChecked: "2026/10/11",
};

/* Cosmetics registration pre-check (based on CDSCO's published list of common
   errors in import applications). */
ID.COS_CHECKLIST = [
  { id: "names_match", ja: "全書類で製造者・インド代理人の名称と住所が一致している", en: "Manufacturer and Indian agent names and addresses match across all documents" },
  { id: "agent_undertaking", ja: "インド代理人の誓約書に署名・押印がある", en: "Indian agent's undertaking is signed and stamped" },
  { id: "animal_testing", ja: "製造者による動物実験不実施の宣誓書（署名・押印済み）", en: "Manufacturer's no-animal-testing declaration, signed and stamped" },
  { id: "labels_signed", ja: "提出ラベルに製造者または代理人の署名・押印がある", en: "Submitted labels are signed and stamped by the manufacturer or agent" },
  { id: "countries_list", ja: "既に販売許可・登録を受けている国の一覧", en: "List of countries where the product is already registered or approved" },
];
ID.COS_RULE = {
  targetDays: 180,
  ja: "CDSCOの新規登録の処理目標は180営業日。書類の不備は数か月の遅れにつながります。",
  en: "CDSCO's target for a new registration is 180 working days, so document errors cost months.",
  source: "CDSCO_COS",
  lastChecked: "2026/10/11",
};

/* Partner-number format hints. These check the SHAPE of a number only.
   NOT verified against an official specification: confirm on the portals. */
ID.FORMAT_HINTS = {
  fssai: { pattern: /^\d{14}$/, ja: "14桁の数字", en: "14 digits", lastChecked: null },
  iec: { pattern: /^[A-Z0-9]{10}$/, ja: "10文字の英数字", en: "10 letters/digits", lastChecked: null },
};

/* Entry roadmap: steps from now to first sale. "module" links to the tool
   that helps with that step. */
ID.ROADMAP = {
  food: [
    { ja: "インド輸入者を選定・確認", en: "Choose and verify an Indian importer", who: "SME", time: "Weeks 1–4", module: "partner" },
    { ja: "輸入者のFSSAIライセンスとIECを確認", en: "Confirm the importer's FSSAI licence and IEC", who: "SME + Partner", time: "Week 4", module: "partner" },
    { ja: "ラベルを修正しステッカーを準備", en: "Fix the label and prepare stickers", who: "SME + Partner", time: "Weeks 4–6", module: "label" },
    { ja: "賞味期限ルールを満たす出荷計画", en: "Plan the shipment to meet the shelf-life rule", who: "SME", time: "Week 6", module: "shelf" },
    { ja: "価格と販売チャネルの合意", en: "Agree price and sales channel", who: "SME + Partner", time: "Weeks 5–7", module: "price" },
    { ja: "出荷・通関", en: "Ship and clear customs", who: "Partner + Regulator", time: "Weeks 8–12", module: "shelf" },
    { ja: "初回販売", en: "First sale", who: "Partner", time: "Week 12+", module: "map" },
    { ja: "販売状況の確認と再発注", en: "Review sales and reorder", who: "SME + Partner", time: "Monthly", module: "partner" },
  ],
  cosmetics: [
    { ja: "インド正規代理人を選定・確認", en: "Appoint and verify an authorised Indian agent", who: "SME", time: "Weeks 1–4", module: "partner" },
    { ja: "登録書類を準備し事前チェック", en: "Prepare registration documents and run the pre-check", who: "SME + Partner", time: "Weeks 4–8", module: "shelf" },
    { ja: "代理人がCDSCOへ登録申請（目標180営業日）", en: "Agent files the registration (target: 180 working days)", who: "Partner + Regulator", time: "Months 2–10", module: "shelf" },
    { ja: "登録証（COS-2）の受領", en: "Receive the registration certificate (COS-2)", who: "Regulator", time: "Month ~10", module: "shelf" },
    { ja: "インド向けラベルの準備", en: "Prepare Indian labels", who: "SME + Partner", time: "Month 10", module: "label" },
    { ja: "初回出荷", en: "First shipment", who: "SME + Partner", time: "Month 11", module: "price" },
    { ja: "初回販売", en: "First sale", who: "Partner", time: "Month 12", module: "map" },
    { ja: "再発注", en: "Reorder", who: "SME + Partner", time: "Ongoing", module: "partner" },
  ],
};

/* Nutrition information India expects on the label (per 100 g / 100 ml).
   Partly confirmed from secondary sources: NOT YET VERIFIED against the
   regulation text. Japanese labels usually show only energy, protein, fat,
   carbohydrate and salt equivalent. */
ID.NUTRITION_RULE = {
  required: [
    { key: "energyKcal", ja: "エネルギー", en: "Energy (kcal)" },
    { key: "proteinG", ja: "たんぱく質", en: "Protein (g)" },
    { key: "carbG", ja: "炭水化物", en: "Carbohydrate (g)" },
    { key: "sugarsG", ja: "糖類（総量）", en: "Total sugars (g)" },
    { key: "addedSugarsG", ja: "添加糖類", en: "Added sugars (g)" },
    { key: "fatG", ja: "脂質", en: "Total fat (g)" },
    { key: "satFatG", ja: "飽和脂肪酸", en: "Saturated fat (g)" },
    { key: "transFatG", ja: "トランス脂肪酸", en: "Trans fat (g)" },
    { key: "cholesterolMg", ja: "コレステロール", en: "Cholesterol (mg)" },
    { key: "sodiumMg", ja: "ナトリウム", en: "Sodium (mg)" },
  ],
  source: "FSSAI_LABEL",
  lastChecked: null,
};

/* Children: guidance only, not an Indian legal standard.
   "High" thresholds per 100 g are the UK Food Standards Agency front-of-pack
   traffic-light values, used here as a published reference. */
ID.KIDS_RULES = {
  high: { fatG: 17.5, satFatG: 5, sugarsG: 22.5, saltG: 1.5 },
  reference: "UK Food Standards Agency front-of-pack 'high' thresholds per 100 g (reference only)",
  caffeine: ["抹茶", "緑茶", "煎茶", "ほうじ茶", "紅茶", "玄米茶", "コーヒー", "カフェイン", "ガラナ", "エナジー"],
  alcohol: ["洋酒", "ラム酒", "ブランデー", "リキュール", "ウイスキー", "ワイン", "日本酒", "清酒", "酒", "みりん", "アルコール"],
  choking: ["こんにゃくゼリー", "蒟蒻ゼリー", "こんにゃく", "蒟蒻"],
  /* Japan's mandatory allergens (shown as information) */
  allergens: [
    { k: ["卵"], ja: "卵", en: "egg" }, { k: ["乳", "バター", "チーズ", "ホエイ", "クリーム"], ja: "乳", en: "milk" },
    { k: ["小麦"], ja: "小麦", en: "wheat" }, { k: ["そば"], ja: "そば", en: "buckwheat" },
    { k: ["落花生", "ピーナッツ"], ja: "落花生", en: "peanut" }, { k: ["えび", "エビ", "海老"], ja: "えび", en: "shrimp" },
    { k: ["かに", "カニ", "蟹"], ja: "かに", en: "crab" }, { k: ["くるみ"], ja: "くるみ", en: "walnut" },
  ],
};

/* State rules that change where a product can be sold.
   Laws differ by state and change over time: these are NOT YET VERIFIED
   (lastChecked: null). Confirm the current state law before relying on them. */
ID.STATE_RULES = {
  beef: {
    /* States where sources agree there is no cattle-slaughter restriction.
       Every other state: restricted in some way, so the app says "check state law". */
    unrestricted: ["Kerala", "West Bengal", "Goa", "Arunachal Pradesh", "Meghalaya", "Mizoram", "Nagaland", "Tripura", "Puducherry"],
    ja: "牛肉を含む製品：この州では牛の屠殺が制限されています。州法を確認してください。",
    en: "Contains beef: this state restricts cattle slaughter. Check the state law.",
    source: "Wikipedia, 'Cattle slaughter in India' (reflects about 2022)",
    lastChecked: null,
  },
  alcohol: {
    prohibition: ["Bihar", "Gujarat", "Nagaland", "Mizoram"],
    ja: "酒類を含む製品：この州は禁酒州です。酒類を含む食品の扱いを確認してください。",
    en: "Contains liquor: this state has alcohol prohibition. Check how liquor-containing foods are treated.",
    source: "Wikipedia, 'Alcohol prohibition in India' (reflects about 2025)",
    lastChecked: null,
  },
};

/* Partner due-diligence checklist. The team ticks each item after checking it.
   The score is simply how many checks are done: it is not a rating of the company. */
ID.PARTNER_CHECKS = [
  { id: "licence", food: true, cosmetics: false, ja: "FSSAI輸入ライセンスを公式サイト（FoSCoS）で確認", en: "FSSAI import licence confirmed on the official portal (FoSCoS)" },
  { id: "cdsco", food: false, cosmetics: true, ja: "CDSCO登録（または正規代理人の資格）を確認", en: "CDSCO registration (or authorised-agent status) confirmed" },
  { id: "iec", food: true, cosmetics: true, ja: "IECをDGFTの公式サイトで確認", en: "IEC confirmed on the DGFT portal" },
  { id: "gst", food: true, cosmetics: true, ja: "GST登録番号と会社登記を受領", en: "GST registration and company registration received" },
  { id: "category", food: true, cosmetics: true, ja: "同じ品目を取り扱った実績がある", en: "Already handles our product category" },
  { id: "regions", food: true, cosmetics: true, ja: "進出したい州で販売網を持っている", en: "Distributes in our target states" },
  { id: "references", food: true, cosmetics: true, ja: "他の海外ブランドからの推薦（2社以上）", en: "References from 2+ foreign brands they work with" },
  { id: "meeting", food: true, cosmetics: true, ja: "ビデオ会議または訪問で面談済み", en: "Met by video call or visit" },
  { id: "terms", food: true, cosmetics: true, ja: "マージン・最低発注量・支払条件を書面で合意", en: "Margin, minimum order and payment terms agreed in writing" },
  { id: "sticker", food: true, cosmetics: true, ja: "インド向けラベル（ステッカー）の対応を約束", en: "Agrees to handle the Indian label / stickers" },
];

/* Working with an Indian partner: practical guidance for the SME (not legal advice). */
ID.CULTURE_GUIDE = [
  { ja: "メールの後はWhatsAppや電話でも連絡", en: "Follow up email with WhatsApp or a call", dja: "インドの取引ではWhatsAppがよく使われ、返信が早いことが多いです。", den: "WhatsApp is widely used in Indian business and replies often come faster there." },
  { ja: "価格交渉を前提に準備", en: "Expect to negotiate price", dja: "最低価格とマージンの幅を事前に社内で決めておきましょう。", den: "Agree your lowest price and margin range internally before the first call." },
  { ja: "会議の後は合意事項を書面で確認", en: "Confirm next steps in writing", dja: "毎回の会議後に、決まったこと・担当・期限を短いメールで送ると、双方の誤解を防げます。", den: "After every call, send a short email listing what was agreed, who does what, and by when. It prevents misunderstandings on both sides." },
  { ja: "社内の承認手順と期間を先に伝える", en: "Explain your approval process early", dja: "日本の社内決裁（稟議）には時間がかかります。決定までの手順と目安を最初に伝えましょう。", den: "Japanese internal approval (ringi) takes time. Tell the partner your steps and expected timeline at the start." },
  { ja: "サンプルとテスト出荷の予算を確保", en: "Budget for samples and a test shipment", dja: "大口注文の前に、サンプルや少量のテスト出荷を求められるのが一般的です。", den: "Importers usually want samples and a small test shipment before a large order." },
  { ja: "初回は支払条件を慎重に", en: "Be careful with first-order payment terms", dja: "初回取引は前払いや信用状（L/C）など、安全な条件を書面で合意しましょう。", den: "For the first order, agree safe terms in writing, such as advance payment or a letter of credit." },
  { ja: "契約で独占権・地域・期間を明確に", en: "Put exclusivity, territory and term in the contract", dja: "どの州で、何年間、独占かどうか、最低発注量を契約書に書きましょう。", den: "Write down which states, for how long, whether it is exclusive, and the minimum orders." },
  { ja: "英語は短く明確に", en: "Write short, clear English", dja: "慣用句を避け、日付（2027-04-27）や通貨（INR/JPY）を明記しましょう。", den: "Avoid idioms; write dates (2027-04-27) and currencies (INR / JPY) explicitly." },
];

/* ---------------------------------------------------------------------------
   Diet check: eggless and Jain (India-specific buyer questions).
   Guidance only: Jain practice varies, so this is marked "not verified".
   Jains are vegetarian and also avoid root vegetables (onion, garlic, potato,
   carrot, ginger...), honey, alcohol, and often mushrooms and yeast.
   --------------------------------------------------------------------------- */
ID.DIET_RULES = {
  source: "JAIN_DIET",
  lastChecked: null,
  egg: ["卵", "たまご", "タマゴ", "マヨネーズ", "卵白リゾチーム"],
  jainAvoid: [
    { id: "onion", ja: "玉ねぎ・ねぎ類", en: "onion / leek family", k: ["たまねぎ", "玉ねぎ", "タマネギ", "玉葱", "オニオン", "ねぎ", "ネギ", "葱", "らっきょう", "エシャロット"] },
    { id: "garlic", ja: "にんにく", en: "garlic", k: ["にんにく", "ニンニク", "大蒜", "ガーリック"] },
    { id: "potato", ja: "じゃがいも", en: "potato", k: ["じゃがいも", "ジャガイモ", "ばれいしょ", "馬鈴薯", "ポテト"] },
    { id: "root", ja: "根菜（にんじん・大根・ごぼう等）", en: "root vegetable (carrot, radish, burdock...)", k: ["にんじん", "ニンジン", "人参", "キャロット", "だいこん", "ダイコン", "大根", "ごぼう", "牛蒡", "れんこん", "蓮根", "ビート", "さつまいも", "サツマイモ", "甘藷", "スイートポテト", "さといも", "里芋", "やまいも", "山芋", "長芋", "こんにゃく", "蒟蒻", "グルコマンナン"] },
    { id: "ginger", ja: "しょうが", en: "ginger", k: ["しょうが", "ショウガ", "生姜", "ジンジャー"] },
    { id: "honey", ja: "はちみつ", en: "honey", k: ["はちみつ", "ハチミツ", "蜂蜜", "ハニー"] },
    { id: "alcohol", ja: "酒類", en: "alcohol", k: ["洋酒", "清酒", "日本酒", "料理酒", "酒精", "みりん", "ラム酒", "ブランデー", "リキュール", "ウイスキー", "ワイン", "酒粕", "アルコール"] },
    { id: "mushroom", ja: "きのこ", en: "mushroom", k: ["きのこ", "しいたけ", "椎茸", "シイタケ", "マッシュルーム", "しめじ", "まいたけ", "えのき", "エリンギ", "きくらげ"] },
  ],
  jainCheck: [
    { id: "yeast", ja: "酵母（避ける人もいる）", en: "yeast (some Jains avoid it)", k: ["酵母", "イースト"] },
    { id: "vegetables", ja: "野菜（種類が不明）", en: "vegetables (type not stated)", k: ["野菜"] },
    { id: "spices", ja: "香辛料（にんにく・しょうがを含む場合あり）", en: "spices (may include garlic or ginger)", k: ["香辛料", "スパイス", "カレー粉"] },
  ],
  starch: { k: ["でん粉", "でんぷん", "澱粉"], safe: ["コーン", "とうもろこし", "タピオカ", "小麦", "米", "緑豆", "えんどう"] },
};

/* ---------------------------------------------------------------------------
   Heat check: India's hot season can melt or spoil some products.
   Guidance only ("not verified"). Hottest months in most of India: April–June.
   --------------------------------------------------------------------------- */
ID.HEAT_RULES = {
  source: "IMD_CLIMATE",
  lastChecked: null,
  hotMonths: [4, 5, 6],
  groups: [
    { id: "chocolate", cat: "food", ja: "チョコレート・カカオバター", en: "Chocolate / cocoa butter",
      k: ["チョコレート", "準チョコレート", "チョコ", "ココアバター", "カカオバター", "カカオマス"],
      dja: "カカオバターは体温に近い温度（約34℃）で溶けます。溶けて固まると白い跡（ブルーム）が出ます。", den: "Cocoa butter melts near body temperature (about 34 °C). After melting it can set with white marks (bloom)." },
    { id: "gelatin", cat: "food", ja: "グミ・ゼラチン", en: "Gummies / gelatin",
      k: ["グミ", "ゼラチン", "マシュマロ"],
      dja: "ゼラチンのお菓子は暑さで柔らかくなり、くっついたり溶けたりします。", den: "Gelatin sweets soften, stick together or melt in hot weather." },
    { id: "cream", cat: "food", ja: "クリーム・バター入り", en: "Cream or butter filling",
      k: ["バタークリーム", "生クリーム", "ホイップクリーム", "クリームサンド"],
      dja: "油脂のクリームは暑さで溶けたり分離したりします。", den: "Fat-based cream fillings can melt or separate in the heat." },
    { id: "balm", cat: "cosmetics", ja: "リップ・バーム・ワックス", en: "Lip / balm / wax products",
      k: ["ミツロウ", "蜜ロウ", "ワセリン", "リップ", "口紅", "バーム"],
      dja: "ワックス系の製品は高温で柔らかくなり、形が崩れます。", den: "Wax-based products soften and lose shape at high temperatures." },
    { id: "emulsion", cat: "cosmetics", ja: "クリーム・乳液", en: "Creams / emulsions",
      k: ["クリーム", "乳液", "エマルジョン"],
      dja: "クリームや乳液は高温で分離することがあります。", den: "Creams and emulsions can separate at high temperatures." },
  ],
  advice: [
    { ja: "10月〜2月に到着するよう出荷する（涼しい季節）", en: "Ship so it arrives between October and February (the cooler season)" },
    { ja: "4月〜6月の出荷は冷蔵コンテナ（リーファー）を使う", en: "For April–June, use a refrigerated (reefer) container" },
    { ja: "輸入者に冷蔵倉庫と配送方法を確認する", en: "Ask the importer about cool storage and delivery" },
    { ja: "冷房のある店舗（スーパー・専門店）から販売を始める", en: "Start in air-conditioned stores (supermarkets, speciality shops)" },
  ],
};

/* ---------------------------------------------------------------------------
   Shipping routes for the Shelf-Life Check.
   Sea transit (Japan -> India): about 20-30 days (OceanFreight.jp guide);
   Yokohama -> Nhava Sheva: 26 days (SeaRates). Sources do not give separate
   figures for each port pair, so all routes use the same range.
   Clearance (food): FSSAI import NOC takes 2-10 days (FSSAI Citizen's Charter
   2025-26); customs runs alongside it.
   "serves" = nearby markets (geography), used to suggest a port.
   --------------------------------------------------------------------------- */
ID.SHIPPING = {
  lastChecked: "2026/10/25",
  jpPorts: [
    { id: "tyo", ja: "東京・横浜", en: "Tokyo / Yokohama" },
    { id: "ngo", ja: "名古屋", en: "Nagoya" },
    { id: "ukb", ja: "大阪・神戸", en: "Osaka / Kobe" },
    { id: "hkt", ja: "博多（福岡）", en: "Hakata (Fukuoka)" },
  ],
  inPorts: [
    { id: "nsa", ja: "ナバシェバ（JNPT・ムンバイ）", en: "Nhava Sheva (JNPT, Mumbai)", coast: "west",
      serves: ["Maharashtra", "Gujarat", "Goa", "Madhya Pradesh", "Karnataka"] },
    { id: "maa", ja: "チェンナイ", en: "Chennai", coast: "east",
      serves: ["Tamil Nadu", "Karnataka", "Andhra Pradesh", "Telangana", "Kerala", "Puducherry"] },
    { id: "mun", ja: "ムンドラ（グジャラート）", en: "Mundra (Gujarat)", coast: "west",
      serves: ["Gujarat", "Rajasthan", "Punjab", "Haryana", "Delhi", "Chandigarh", "Uttar Pradesh"] },
    { id: "ccu", ja: "コルカタ", en: "Kolkata", coast: "east",
      serves: ["West Bengal", "Bihar", "Jharkhand", "Odisha", "Assam", "Sikkim", "Meghalaya", "Tripura"] },
  ],
  scenarios: [
    { id: "fast", ja: "早い場合", en: "Fast", sea: 20, clear: 2 },
    { id: "typical", ja: "標準", en: "Typical", sea: 26, clear: 6 },
    { id: "slow", ja: "遅れた場合", en: "Delayed", sea: 31, clear: 10 },
  ],
};
