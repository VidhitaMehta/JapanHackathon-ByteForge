/* =========================================================================
   Shinzoku Setu — ingredient dictionary
   status:   "Animal-derived" -> food becomes NON-VEGETARIAN
             "OK"             -> confirmed vegetarian / allowed
             "Restricted"     -> cosmetics substance limited or banned in India
             "Needs review"   -> deliberately NOT decided (can be plant or animal)
   category: "food", "cosmetics" or "both"
   keywords: Japanese terms. The matcher picks the LONGEST keyword found in an
             ingredient name, so 牛乳 (milk) wins over 牛 (beef).

   Basis for veg / non-veg: FSSAI treats food containing any part of an animal,
   including fish, seafood and eggs, as non-vegetarian; milk and milk products
   are vegetarian.

   Add entries freely. Unknown ingredients are never guessed: they show as
   "Needs review".
   ========================================================================= */
window.ID = window.ID || {};

ID.DICTIONARY = [
  // ---- Animal-derived (food -> non-vegetarian) ----
  { id: "katsuo", category: "food", status: "Animal-derived", en: "Bonito / bonito flakes", keywords: ["かつお", "カツオ", "かつおぶし", "鰹節", "かつお節", "鰹節エキス", "かつおエキス", "鰹エキス", "鰹"] },
  { id: "fish_stock", category: "food", status: "Animal-derived", en: "Fish stock / seafood extract", keywords: ["だし", "魚介エキス", "魚介類", "魚醤", "魚肉", "フィッシュエキス", "魚粉"] },
  { id: "niboshi", category: "food", status: "Animal-derived", en: "Dried sardine", keywords: ["煮干し", "煮干", "にぼし", "かたくちいわし", "いわしエキス", "いわし"] },
  { id: "anchovy", category: "food", status: "Animal-derived", en: "Anchovy", keywords: ["アンチョビ", "アンチョヴィ"] },
  { id: "ebi", category: "food", status: "Animal-derived", en: "Shrimp / prawn", keywords: ["えび", "エビ", "海老", "えびエキス", "オキアミ"] },
  { id: "kani", category: "food", status: "Animal-derived", en: "Crab", keywords: ["かに", "カニ", "蟹", "かにエキス"] },
  { id: "ika", category: "food", status: "Animal-derived", en: "Squid", keywords: ["いか", "イカ", "烏賊", "いかエキス", "イカスミ"] },
  { id: "hotate", category: "food", status: "Animal-derived", en: "Scallop / shellfish extract", keywords: ["ほたて", "ホタテ", "帆立", "ほたてエキス", "貝エキス"] },
  { id: "oyster_sauce", category: "food", status: "Animal-derived", en: "Oyster sauce", keywords: ["オイスターソース", "牡蠣エキス", "かきエキス"] },
  { id: "gelatin", category: "both", status: "Animal-derived", en: "Gelatin", keywords: ["ゼラチン"] },
  { id: "collagen", category: "both", status: "Animal-derived", en: "Collagen", keywords: ["コラーゲン", "コラーゲンペプチド"] },
  { id: "pork", category: "food", status: "Animal-derived", en: "Pork / pork extract", keywords: ["ポークエキス", "ポーク", "豚肉", "豚", "ポークパウダー"] },
  { id: "lard", category: "food", status: "Animal-derived", en: "Lard", keywords: ["ラード", "豚脂"] },
  { id: "beef", category: "food", status: "Animal-derived", en: "Beef / beef extract", keywords: ["ビーフエキス", "ビーフ", "牛肉", "牛", "ビーフパウダー"] },
  { id: "beef_tallow", category: "food", status: "Animal-derived", en: "Beef tallow", keywords: ["牛脂", "ヘット"] },
  { id: "chicken", category: "food", status: "Animal-derived", en: "Chicken / chicken extract", keywords: ["チキンエキス", "チキン", "鶏肉", "鶏", "鶏油", "チキンパウダー"] },
  { id: "egg", category: "food", status: "Animal-derived", en: "Egg", keywords: ["卵", "たまご", "タマゴ", "卵黄", "卵白", "全卵", "鶏卵", "液卵", "卵殻カルシウム"] },

  // ---- Vegetarian (OK) ----
  { id: "milk", category: "food", status: "OK", en: "Milk / dairy", keywords: ["乳", "牛乳", "生乳", "乳製品", "脱脂粉乳", "全粉乳", "生クリーム", "バター", "チーズ", "ホエイ", "ホエー", "乳清", "練乳", "乳糖", "乳酸菌"] },
  { id: "sugar", category: "food", status: "OK", en: "Sugar", keywords: ["砂糖", "グラニュー糖", "上白糖", "黒糖", "ブドウ糖", "果糖", "水飴", "水あめ", "異性化液糖", "糖類"] },
  { id: "wheat", category: "food", status: "OK", en: "Wheat flour", keywords: ["小麦粉", "小麦", "強力粉", "薄力粉", "中力粉", "全粒粉"] },
  { id: "rice", category: "food", status: "OK", en: "Rice", keywords: ["うるち米", "粳米", "うるち米粉", "米", "米粉", "もち米", "玄米"] },
  { id: "veg_oil", category: "both", status: "OK", en: "Vegetable oil and fat", keywords: ["植物油脂", "植物油", "食用植物油脂", "サラダ油", "キャノーラ油", "なたね油", "パーム油", "大豆油", "コーン油", "ごま油", "米油"] },
  { id: "soy_sauce", category: "food", status: "OK", en: "Soy sauce", keywords: ["醤油", "しょうゆ", "しょう油", "本醸造醤油"] },
  { id: "salt", category: "food", status: "OK", en: "Salt", keywords: ["食塩", "塩", "海水塩", "岩塩"] },
  { id: "matcha", category: "both", status: "OK", en: "Matcha / green tea", keywords: ["抹茶", "緑茶", "茶", "緑茶抽出物", "煎茶"] },
  { id: "konbu", category: "food", status: "OK", en: "Kelp (kombu) / kelp stock", keywords: ["昆布", "こんぶ", "コンブ", "昆布粉末", "こんぶエキス", "昆布エキス", "コンブエキス", "こんぶだし", "昆布だし"] },
  { id: "shiitake", category: "food", status: "OK", en: "Shiitake mushroom / shiitake stock", keywords: ["しいたけ", "椎茸", "シイタケ", "しいたけエキス", "しいたけだし", "椎茸だし"] },
  { id: "soybean", category: "food", status: "OK", en: "Soybean / soy milk", keywords: ["大豆", "脱脂加工大豆", "大豆たんぱく", "きな粉", "豆乳"] },
  { id: "sesame", category: "food", status: "OK", en: "Sesame", keywords: ["ごま", "ゴマ", "胡麻", "すりごま", "いりごま"] },
  { id: "cocoa", category: "food", status: "OK", en: "Cocoa / cocoa butter", keywords: ["カカオマス", "ココアバター", "ココアパウダー", "ココア", "カカオ"] },
  { id: "yeast", category: "food", status: "OK", en: "Yeast extract", keywords: ["酵母エキス", "酵母"] },
  { id: "water", category: "both", status: "OK", en: "Water", keywords: ["水", "精製水"] },

  // ---- More fish, seafood and meat (animal-derived) ----
  { id: "fish_more", category: "food", status: "Animal-derived", en: "Fish (salmon, mackerel, tuna, cod, whitebait…)", keywords: ["さけ", "鮭", "サーモン", "さば", "鯖", "まぐろ", "鮪", "ツナ", "鱈", "タラ", "たらこ", "明太子", "しらす", "ちりめん", "魚", "白身魚", "すけそうだら", "すり身"] },
  { id: "shellfish_more", category: "food", status: "Animal-derived", en: "Shellfish (clam, oyster, sea urchin)", keywords: ["あさり", "しじみ", "牡蠣", "うに", "貝"] },
  { id: "meat_more", category: "food", status: "Animal-derived", en: "Meat extract / bone stock", keywords: ["肉エキス", "ミートエキス", "鶏ガラ", "がらスープ", "ベーコン", "ハム", "ソーセージ", "ウインナー", "肉"] },
  { id: "egg_more", category: "food", status: "Animal-derived", en: "Egg products (mayonnaise, lysozyme)", keywords: ["マヨネーズ", "卵白リゾチーム", "卵殻"] },

  // ---- More vegetarian ingredients ----
  { id: "milk_more", category: "food", status: "OK", en: "Milk products", keywords: ["乳たんぱく", "乳タンパク", "カゼイン", "クリーム", "ヨーグルト", "乳酸", "乳酸カルシウム", "ミルク"] },
  { id: "sugar_more", category: "food", status: "OK", en: "Sugars and syrups", keywords: ["還元水あめ", "還元水飴", "麦芽糖", "麦芽エキス", "オリゴ糖", "トレハロース", "ソルビトール", "デキストリン", "難消化性デキストリン", "はちみつ", "蜂蜜", "メープルシロップ", "てんさい糖", "粉糖", "液糖"] },
  { id: "starch", category: "food", status: "OK", en: "Starch", keywords: ["でん粉", "でんぷん", "澱粉", "加工でん粉", "コーンスターチ", "馬鈴薯でん粉", "タピオカ"] },
  { id: "grains_more", category: "food", status: "OK", en: "Grains and flours", keywords: ["もち粉", "白玉粉", "上新粉", "パン粉", "オーツ", "大麦", "そば粉", "とうもろこし", "コーン", "コーングリッツ"] },
  { id: "beans_nuts", category: "food", status: "OK", en: "Beans, nuts and seeds", keywords: ["小豆", "あずき", "あん", "餡", "落花生", "ピーナッツ", "アーモンド", "くるみ", "カシューナッツ", "マカダミアナッツ", "ピスタチオ", "ヘーゼルナッツ", "えんどう豆", "黒豆"] },
  { id: "vegetables", category: "food", status: "OK", en: "Vegetables", keywords: ["野菜", "野菜エキス", "たまねぎ", "玉ねぎ", "オニオン", "にんにく", "ガーリック", "しょうが", "生姜", "ねぎ", "キャベツ", "にんじん", "かぼちゃ", "じゃがいも", "馬鈴薯", "ポテト", "さつまいも", "トマト", "ごぼう", "牛蒡", "大根"] },
  { id: "fruits", category: "food", status: "OK", en: "Fruit", keywords: ["果汁", "果実", "りんご", "いちご", "ぶどう", "桃", "白桃", "ピーチ", "果肉", "レモン", "オレンジ", "みかん", "ゆず", "柚子", "梅", "バナナ", "マンゴー", "ブルーベリー"] },
  { id: "seaweed", category: "food", status: "OK", en: "Seaweed (nori, wakame, aonori)", keywords: ["のり", "海苔", "青のり", "あおさ", "わかめ", "ひじき", "寒天"] },
  { id: "seasonings", category: "food", status: "OK", en: "Seasonings (vinegar, miso, mirin, spices)", keywords: ["醸造酢", "米酢", "酢", "みそ", "味噌", "みりん", "本みりん", "清酒", "料理酒", "香辛料", "こしょう", "胡椒", "唐辛子", "とうがらし", "カレー粉", "わさび", "からし", "シナモン", "バニラ"] },
  { id: "chocolate", category: "food", status: "OK", en: "Chocolate", keywords: ["チョコレート", "準チョコレート"] },
  { id: "tea_more", category: "food", status: "OK", en: "Tea", keywords: ["ほうじ茶", "紅茶", "玄米茶"] },
  { id: "coffee", category: "food", status: "OK", en: "Coffee (contains caffeine)", keywords: ["コーヒー", "インスタントコーヒー", "コーヒーエキス"] },
  { id: "liquor", category: "food", status: "OK", en: "Liquor (alcohol)", keywords: ["洋酒", "ラム酒", "ブランデー", "リキュール", "ウイスキー", "ワイン", "日本酒"] },
  { id: "konjac", category: "food", status: "OK", en: "Konjac", keywords: ["こんにゃく", "蒟蒻", "こんにゃく粉", "グルコマンナン"] },
  { id: "plant_additives", category: "food", status: "OK", en: "Plant/mineral additives (leavening, acids, plant gums, vitamins)", keywords: ["膨張剤", "膨脹剤", "ベーキングパウダー", "重曹", "炭酸水素ナトリウム", "酸味料", "クエン酸", "pH調整剤", "甘味料", "スクラロース", "ステビア", "増粘多糖類", "キサンタンガム", "ペクチン", "グァーガム", "ビタミンC", "ビタミンE", "V.C", "V.E", "酸化防止剤", "塩化マグネシウム", "にがり", "炭酸カルシウム", "アスパルテーム", "大豆由来"] },
  { id: "plant_colours", category: "food", status: "OK", en: "Plant-based colours", keywords: ["カラメル色素", "カラメル", "キャラメル", "カロテン", "カロテノイド", "パプリカ色素", "クチナシ色素", "クチナシ", "紅花黄", "紅花", "紅麹色素", "アントシアニン", "ウコン", "ターメリック", "ベニバナ", "クロロフィル"] },

  // ---- Deliberately undecided: can come from plants OR animals ----
  { id: "emulsifier", category: "food", status: "Needs review", en: "Emulsifier (plant or animal origin)", keywords: ["乳化剤"] },
  { id: "flavouring", category: "food", status: "Needs review", en: "Flavouring (origin not stated)", keywords: ["香料"] },
  { id: "seasoning_amino", category: "food", status: "Needs review", en: "Seasoning (amino acids etc.: may include fish- or meat-derived nucleotides)", keywords: ["アミノ酸等", "核酸", "イノシン酸"] },
  { id: "fats_unknown", category: "food", status: "Needs review", en: "Fat of unstated origin (may be animal)", keywords: ["ショートニング", "マーガリン", "加工油脂", "粉末油脂", "ファットスプレッド", "油脂"] },
  { id: "colour_unknown", category: "food", status: "Needs review", en: "Colour of unstated origin (may include insect-derived cochineal)", keywords: ["着色料", "コチニール", "カルミン酸"] },
  { id: "thickener_unknown", category: "food", status: "Needs review", en: "Thickener / stabiliser of unstated origin (may include gelatin)", keywords: ["増粘剤", "安定剤", "ゲル化剤"] },
  { id: "other_unknown", category: "food", status: "Needs review", en: "Ingredient of uncertain origin (enzymes, glycerin, L-cysteine, glazing agent)", keywords: ["酵素", "グリセリン", "L-システイン", "光沢剤", "シェラック"] },

  // ---- Cosmetics: restricted substances ----
  { id: "mercury", category: "cosmetics", status: "Restricted", en: "Mercury / mercury compounds", keywords: ["水銀", "塩化水銀", "水銀化合物"] },
  { id: "lead", category: "cosmetics", status: "Restricted", en: "Lead / lead compounds", keywords: ["鉛", "酢酸鉛", "酸化鉛", "鉛化合物"] },
  { id: "arsenic", category: "cosmetics", status: "Restricted", en: "Arsenic / arsenic compounds", keywords: ["ヒ素", "ひ素", "亜ヒ酸"] },
  { id: "hexachlorophene", category: "cosmetics", status: "Restricted", en: "Hexachlorophene", keywords: ["ヘキサクロロフェン"] },
];
