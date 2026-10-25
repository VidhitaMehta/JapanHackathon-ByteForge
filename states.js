/* =========================================================================
   Shinzoku Setu — state data for the Launch Map

   REAL DATA so far: urban spending (MoSPI HCES), online shopping (MoSPI CMS
   Telecom 2025), Japanese business sites (Embassy of Japan / JETRO, Oct 2024)
   and search interest (Google Trends). See ID.DATA_NOTES.
   Columns set to null have not been collected yet: the app gives them 0% weight
   and says so on screen. Fill them in by editing this file, or in the app with
   "Download CSV" -> fill the blanks -> "Upload CSV".

   CSV columns:
     state, spending, online_spending, search_interest_food,
     search_interest_cosmetics, japanese_presence

   Where to get the missing columns:
     spending          : HCES 2023-24 (MoSPI), state average MPCE, urban (Rs/month)
     japanese_presence : Embassy of Japan / JETRO, Japanese Business Establishments in India (state table)
     online_spending   : MoSPI CMS Telecom 2025, Table 15, urban % of households buying online
   ========================================================================= */
window.ID = window.ID || {};

ID.INDICATORS = [
  { key: "spending", ja: "所得水準（都市部の1人当たり消費支出）", en: "Income level (urban spending per person)", weight: 30 },
  { key: "online_spending", ja: "ネット購買（都市部世帯の割合）", en: "Online shopping (% of urban households)", weight: 20 },
  { key: "search_interest", ja: "日本製品への検索関心", en: "Search interest in Japanese products", weight: 35,
    columns: { food: "search_interest_food", cosmetics: "search_interest_cosmetics" } },
  { key: "japanese_presence", ja: "日系企業の拠点数", en: "Japanese business presence (no. of sites)", weight: 15 },
];

ID.CSV_COLUMNS = ["state", "spending", "online_spending", "search_interest_food", "search_interest_cosmetics", "japanese_presence"];

/* Where each real column came from (shown on screen and in the report). */
ID.DATA_NOTES = {
  spending: { ja: "MoSPI 家計消費支出調査 2023-24、都市部の月間1人当たり消費支出（MPCE、帰属なし）、主要18州", en: "MoSPI Household Consumption Expenditure Survey 2023-24: urban monthly per-capita spending (MPCE, without imputation), 18 major states" },
  search_interest_food: { ja: "Googleトレンド：トピック「日本料理」、インド、2025/10/23〜2026/10/23", en: "Google Trends: topic 'Japanese cuisine', India, 2025/10/23–2026/10/23" },
  online_spending: { ja: "MoSPI 包括的モジュール調査：通信 2025（NSS報告書593号）表15、2025年1〜3月、過去30日にネットで商品を購入した都市部世帯の割合（%）", en: "MoSPI Comprehensive Modular Survey: Telecom 2025 (NSS Report No. 593), Table 15, Jan–Mar 2025: % of urban households that bought goods online in the last 30 days" },
  japanese_presence: { ja: "在インド日本国大使館・総領事館・JETRO「インド日系企業拠点数」2025年6月版（2024年10月1日時点）州別表。「その他の州」にまとめられた州は空欄", en: "Embassy & Consulates-General of Japan in India and JETRO, Japanese Business Establishments in India, June 2025 (as of 1 Oct 2024), state table. States grouped under 'Other States' are left blank" },
  search_interest_cosmetics: { ja: "Googleトレンド：「Japanese cosmetics」、インド、2025/10/23〜2026/10/23", en: "Google Trends: 'Japanese cosmetics', India, 2025/10/23–2026/10/23" },
};

/* null = not collected yet. Google Trends omits states with too few searches (also null). */
ID.STATE_DATA = [
  { state: "Goa", spending: null, online_spending: 51.5, search_interest_food: 100, search_interest_cosmetics: null, japanese_presence: 15 },
  { state: "Mizoram", spending: null, online_spending: 51.5, search_interest_food: 90, search_interest_cosmetics: null, japanese_presence: null },
  { state: "Nagaland", spending: null, online_spending: 42.9, search_interest_food: 88, search_interest_cosmetics: null, japanese_presence: null },
  { state: "Manipur", spending: null, online_spending: 53.1, search_interest_food: 80, search_interest_cosmetics: null, japanese_presence: null },
  { state: "Arunachal Pradesh", spending: null, online_spending: 58.8, search_interest_food: 77, search_interest_cosmetics: null, japanese_presence: null },
  { state: "Delhi", spending: null, online_spending: 49.7, search_interest_food: 72, search_interest_cosmetics: 100, japanese_presence: 601 },
  { state: "Sikkim", spending: null, online_spending: 46.6, search_interest_food: 70, search_interest_cosmetics: null, japanese_presence: null },
  { state: "Karnataka", spending: 8076, online_spending: 44.1, search_interest_food: 68, search_interest_cosmetics: 65, japanese_presence: 543 },
  { state: "Chandigarh", spending: null, online_spending: 68.7, search_interest_food: 55, search_interest_cosmetics: null, japanese_presence: 7 },
  { state: "Maharashtra", spending: 7363, online_spending: 48.3, search_interest_food: 54, search_interest_cosmetics: 59, japanese_presence: 813 },
  { state: "Haryana", spending: 8427, online_spending: 44.3, search_interest_food: 52, search_interest_cosmetics: 69, japanese_presence: 286 },
  { state: "Meghalaya", spending: null, online_spending: 55.1, search_interest_food: 52, search_interest_cosmetics: null, japanese_presence: null },
  { state: "Puducherry", spending: null, online_spending: 36.1, search_interest_food: 49, search_interest_cosmetics: null, japanese_presence: 9 },
  { state: "Tamil Nadu", spending: 8165, online_spending: 35.0, search_interest_food: 48, search_interest_cosmetics: 72, japanese_presence: 583 },
  { state: "Tripura", spending: null, online_spending: 36.8, search_interest_food: 44, search_interest_cosmetics: null, japanese_presence: null },
  { state: "Kerala", spending: 7783, online_spending: 34.3, search_interest_food: 41, search_interest_cosmetics: 50, japanese_presence: 113 },
  { state: "Assam", spending: 6794, online_spending: 61.4, search_interest_food: 39, search_interest_cosmetics: null, japanese_presence: null },
  { state: "Telangana", spending: 8978, online_spending: 56.6, search_interest_food: 39, search_interest_cosmetics: 60, japanese_presence: 169 },
  { state: "Uttarakhand", spending: null, online_spending: 42.0, search_interest_food: 36, search_interest_cosmetics: null, japanese_presence: 47 },
  { state: "Punjab", spending: 7359, online_spending: 41.2, search_interest_food: 34, search_interest_cosmetics: 45, japanese_presence: 76 },
  { state: "West Bengal", spending: 5775, online_spending: 37.2, search_interest_food: 34, search_interest_cosmetics: 36, japanese_presence: 197 },
  { state: "Himachal Pradesh", spending: null, online_spending: 38.5, search_interest_food: 32, search_interest_cosmetics: null, japanese_presence: null },
  { state: "Gujarat", spending: 7175, online_spending: 26.1, search_interest_food: 29, search_interest_cosmetics: 46, japanese_presence: 360 },
  { state: "Jammu and Kashmir", spending: null, online_spending: 32.4, search_interest_food: 29, search_interest_cosmetics: null, japanese_presence: null },
  { state: "Andhra Pradesh", spending: 7182, online_spending: 35.0, search_interest_food: 25, search_interest_cosmetics: 52, japanese_presence: 127 },
  { state: "Odisha", spending: 5825, online_spending: 29.2, search_interest_food: 25, search_interest_cosmetics: 64, japanese_presence: 58 },
  { state: "Rajasthan", spending: 6574, online_spending: 34.3, search_interest_food: 24, search_interest_cosmetics: 38, japanese_presence: 27 },
  { state: "Uttar Pradesh", spending: 5395, online_spending: 34.1, search_interest_food: 24, search_interest_cosmetics: 35, japanese_presence: 177 },
  { state: "Jharkhand", spending: 5393, online_spending: 34.7, search_interest_food: 23, search_interest_cosmetics: null, japanese_presence: 61 },
  { state: "Chhattisgarh", spending: 4927, online_spending: 24.3, search_interest_food: 21, search_interest_cosmetics: null, japanese_presence: 32 },
  { state: "Madhya Pradesh", spending: 5538, online_spending: 35.0, search_interest_food: 20, search_interest_cosmetics: 44, japanese_presence: 115 },
  { state: "Bihar", spending: 5080, online_spending: 40.1, search_interest_food: 16, search_interest_cosmetics: 36, japanese_presence: 67 },
  { state: "Ladakh", spending: null, online_spending: 30.1, search_interest_food: null, search_interest_cosmetics: null, japanese_presence: null },
];

/* Tile map: one square per state, placed roughly where it is in India.
   [code, English name, Japanese name, column, row] */
ID.TILES = [
  ["JK", "Jammu and Kashmir", "ジャンムー・カシミール", 3, 0],
  ["CH", "Chandigarh", "チャンディーガル", 1, 1],
  ["LA", "Ladakh", "ラダック", 4, 0],
  ["PB", "Punjab", "パンジャーブ", 2, 1],
  ["HP", "Himachal Pradesh", "ヒマーチャル・プラデーシュ", 3, 1],
  ["UK", "Uttarakhand", "ウッタラーカンド", 4, 1],
  ["RJ", "Rajasthan", "ラージャスターン", 1, 2],
  ["HR", "Haryana", "ハリヤーナー", 2, 2],
  ["DL", "Delhi", "デリー", 3, 2],
  ["UP", "Uttar Pradesh", "ウッタル・プラデーシュ", 4, 2],
  ["BR", "Bihar", "ビハール", 5, 2],
  ["SK", "Sikkim", "シッキム", 6, 2],
  ["AR", "Arunachal Pradesh", "アルナーチャル・プラデーシュ", 8, 2],
  ["GJ", "Gujarat", "グジャラート", 1, 3],
  ["MP", "Madhya Pradesh", "マディヤ・プラデーシュ", 2, 3],
  ["CT", "Chhattisgarh", "チャッティースガル", 3, 3],
  ["JH", "Jharkhand", "ジャールカンド", 4, 3],
  ["WB", "West Bengal", "西ベンガル", 5, 3],
  ["AS", "Assam", "アッサム", 7, 3],
  ["NL", "Nagaland", "ナガランド", 8, 3],
  ["MH", "Maharashtra", "マハーラーシュトラ", 1, 4],
  ["TG", "Telangana", "テランガーナ", 2, 4],
  ["OD", "Odisha", "オディシャ", 4, 4],
  ["ML", "Meghalaya", "メーガーラヤ", 6, 4],
  ["MN", "Manipur", "マニプル", 8, 4],
  ["GA", "Goa", "ゴア", 1, 5],
  ["KA", "Karnataka", "カルナータカ", 2, 5],
  ["AP", "Andhra Pradesh", "アーンドラ・プラデーシュ", 3, 5],
  ["TR", "Tripura", "トリプラ", 7, 5],
  ["MZ", "Mizoram", "ミゾラム", 8, 5],
  ["KL", "Kerala", "ケーララ", 2, 6],
  ["TN", "Tamil Nadu", "タミル・ナードゥ", 3, 6],
  ["PY", "Puducherry", "プドゥチェリー", 4, 6],
];

/* Other spellings people use in data files. */
ID.STATE_ALIASES = {
  "orissa": "Odisha",
  "nct of delhi": "Delhi",
  "delhi ncr": "Delhi",
  "new delhi": "Delhi",
  "j&k": "Jammu and Kashmir",
  "jammu & kashmir": "Jammu and Kashmir",
  "uttaranchal": "Uttarakhand",
  "chattisgarh": "Chhattisgarh",
  "pondicherry": "Puducherry",
  "tamilnadu": "Tamil Nadu",
};
