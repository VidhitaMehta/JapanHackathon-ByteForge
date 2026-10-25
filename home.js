/* =========================================================================
   Home page
   Photos: put your own (or free-licence) photos in the images/ folder with
   the file names used below. Until then, a labelled placeholder shows.
   ========================================================================= */
(function () {
  const { t, photo } = ID.ui;

  const HOW = [
    { ja: "製品を登録", en: "Enter your product", d: ["名前・価格・日付を一度入力", "Name, price and dates, once"] },
    { ja: "ラベル審査", en: "Check the label", d: ["写真から原材料・栄養・子ども向けを確認", "Ingredients, nutrition and kids check from a photo"] },
    { ja: "出荷と価格", en: "Shipping and price", d: ["60%ルールとインドの店頭価格", "60% rule and Indian shelf price"] },
    { ja: "進出州を選ぶ", en: "Choose states", d: ["所得・関心・州ルールで順位付け", "Ranked by income, interest and state rules"] },
    { ja: "パートナーと交渉", en: "Partner and negotiation", d: ["バイヤー候補・交渉準備・輸出準備の判定", "Buyer leads, call prep and a ready / not-ready answer"] },
  ];
  /* Home banner slides (images/hero-1.jpg ... hero-4.jpg). */
  const SLIDES = [
    { img: "hero-1.jpg", ja: "日本とインドをつなぐ橋", en: "A bridge between Japan and India", pos: "center" },
    { img: "hero-2.jpg", ja: "世界とつながるビジネス", en: "Business connected to the world", pos: "center" },
    { img: "hero-3.jpg", ja: "日本：富士山と東京", en: "Japan: Mt Fuji and Tokyo", pos: "center 30%" },
    { img: "hero-4.jpg", ja: "インド：ウッジャインのガート", en: "India: the ghats of Ujjain", pos: "center" },
  ];
  const SLIDE_MS = 6000;

  function startCarousel(root) {
    clearInterval(ID._heroTimer);
    const slides = [...root.querySelectorAll(".slide")];
    const dots = [...root.querySelectorAll(".dot")];
    const playBtn = root.querySelector(".hc-play");
    const live = root.querySelector(".hc-live");
    const reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let i = 0, playing = !reduce;
    function show(n) {
      i = (n + slides.length) % slides.length;
      slides.forEach((s, k) => { s.classList.toggle("on", k === i); s.setAttribute("aria-hidden", k === i ? "false" : "true"); });
      dots.forEach((d, k) => d.setAttribute("aria-current", k === i ? "true" : "false"));
      live.textContent = `${i + 1} / ${slides.length}: ${SLIDES[i].en}`;
    }
    function tick() {
      if (!document.body.contains(root)) { clearInterval(ID._heroTimer); return; }
      show(i + 1);
    }
    function setPlaying(p) {
      playing = p;
      clearInterval(ID._heroTimer);
      if (p) ID._heroTimer = setInterval(tick, SLIDE_MS);
      playBtn.innerHTML = p ? "❚❚" : "▶";
      playBtn.setAttribute("aria-label", p ? "Pause slideshow / 一時停止" : "Play slideshow / 再生");
    }
    const restart = () => { if (playing) setPlaying(true); };
    root.querySelector(".hc-prev").addEventListener("click", () => { show(i - 1); restart(); });
    root.querySelector(".hc-next").addEventListener("click", () => { show(i + 1); restart(); });
    dots.forEach((d, k) => d.addEventListener("click", () => { show(k); restart(); }));
    playBtn.addEventListener("click", () => setPlaying(!playing));
    root.addEventListener("keydown", (e) => {
      if (e.key === "ArrowLeft") { show(i - 1); restart(); }
      if (e.key === "ArrowRight") { show(i + 1); restart(); }
    });
    show(0);
    setPlaying(playing);
  }

  const TOOLS = [
    { id: "label", img: "tool-label.jpg", ja: "ラベル審査", en: "Label Check", pj: "日本製品の裏面ラベル", pe: "back of a Japanese snack pack", dj: "原材料・栄養成分・子ども向けを確認", de: "Ingredients, nutrition and kids check" },
    { id: "shelf", img: "tool-shelf.jpg", ja: "賞味期限チェック", en: "Shelf-Life Check", pj: "港のコンテナ", pe: "containers at a port", dj: "通関時の60%ルールを確認", de: "Will it pass the 60% rule at customs?" },
    { id: "price", img: "tool-price.jpg", ja: "価格ビルダー", en: "Price Builder", pj: "インドの店頭", pe: "an Indian store shelf", dj: "工場価格から店頭価格まで", de: "From factory price to shelf price" },
    { id: "map", img: "tool-map.jpg", ja: "進出州マップ", en: "Launch Map", pj: "インドの街並み", pe: "an Indian city street", dj: "所得・関心・州ルールで比較", de: "Income, interest and state rules" },
    { id: "partner", img: "tool-partner.jpg", ja: "パートナー確認", en: "Partner Check", pj: "商談", pe: "a business meeting", dj: "輸入者の確認と送付資料", de: "Verify importers; send a ready brief" },
    { id: "report", img: "tool-plan.jpg", ja: "輸出準備レポート", en: "Readiness Report", pj: "計画づくり", pe: "planning on a desk", dj: "輸出できるか一目で判定", de: "One clear answer: ready to export or not" },
  ];

  ID.views.home = {
    render(el) {
      el.innerHTML = `
        <section class="hero" aria-roledescription="carousel" aria-label="Shinzoku Setu">
          <div class="slides">${SLIDES.map((s, k) => `<div class="slide${k === 0 ? " on" : ""}" role="group" aria-roledescription="slide" aria-label="${k + 1} / ${SLIDES.length}">
            <img src="images/${s.img}" alt="${s.en}" style="object-position:${s.pos}" onerror="this.remove()">
            <span class="slide-cap">${t(s.ja, s.en)}</span></div>`).join("")}</div>
          <div class="wrap" style="position:relative">
            <div class="hero-box">
              <div class="kicker">INDIA MARKET ENTRY</div>
              <h1>${t("インド進出を、輸出チームなしで。", "Enter India without an export team.")}</h1>
              <p>${t("ラベル、賞味期限、価格、進出先、パートナーを一か所で確認できます。", "Check your label, shelf life, price, market and partner in one place.")}</p>
              <div class="row">
                <a href="#product" class="btn primary lg">${t("製品をチェック", "Check a product")}</a>
                <button class="btn light lg" id="home-demo">${t("デモを見る", "See the demo")}</button>
              </div>
            </div>
          </div>
          <div class="hero-ctrl">
            <button class="hc-prev" aria-label="Previous image / 前へ">‹</button>
            <div class="dots">${SLIDES.map((s, k) => `<button class="dot" aria-label="Image ${k + 1}: ${s.en}"></button>`).join("")}</div>
            <button class="hc-play" aria-label="Pause slideshow">❚❚</button>
            <button class="hc-next" aria-label="Next image / 次へ">›</button>
            <span class="hc-live sr-only" aria-live="polite"></span>
          </div>
        </section>

        <section class="bridge-band"><div>
          <figure class="bridge-art">
            <img src="images/banner-strip.png" alt="Illustration: a bridge joining Japan (red sun and waves) and India (flower mandala)" />
            <figcaption class="bridge-quote">
              <span class="q-en">“Strong trade grows from strong relationships.”</span>
              <span class="q-ja">良い取引は、良い関係から生まれる。</span>
              <span class="q-tag">${t("日本 × インド", "Japan × India")}</span>
            </figcaption>
          </figure>
        </div></section>

        <section class="wrap home-section">
          <h2>${t("使い方", "How it works")}</h2>
          <p>${t("5つのステップで輸出準備", "Five steps to export-ready")}</p>
          <div class="how">${HOW.map((h, i) => `<div><span class="n">STEP ${i + 1}</span><b>${t(h.ja, h.en)}</b><span class="d">${t(h.d[0], h.d[1])}</span></div>`).join("")}</div>
        </section>

        <section class="wrap home-section">
          <h2>${t("ツール", "Tools")}</h2>
          <p>${t("どのツールからでも始められます", "Start from any tool")}</p>
          <div class="tools">${TOOLS.map((x) => `<a class="tool" href="#${x.id}">${photo(x.img, x.pj, x.pe)}<div class="body"><b>${t(x.ja, x.en)}</b><span class="muted small">${t(x.dj, x.de)}</span><span class="open">${t("開く", "Open")} →</span></div></a>`).join("")}</div>
        </section>`;
      el.querySelector("#home-demo").addEventListener("click", () => ID.loadDemo());
      startCarousel(el.querySelector(".hero"));
    },
  };
})();
