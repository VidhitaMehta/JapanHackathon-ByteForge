/* =========================================================================
   Step 1 — Product: entered once, used by every other step.
   ========================================================================= */
(function () {
  const { esc, t, $, $$ } = ID.ui;

  ID.views.product = {
    render(el) {
      const p = ID.state.product;
      el.innerHTML = `
        <div class="card head"><div><h2>${t("製品情報", "Your product")}</h2>
          <p>${t("ここで一度入力すれば、すべてのステップで使われます。", "Enter this once; every step uses it.")}</p></div></div>
        <div class="card">
          <div class="grid2">
            <label class="stack"><span>${t("製品区分", "Category")}</span>
              <select data-p="category">
                <option value="food" ${p.category === "food" ? "selected" : ""}>加工食品 / Packaged food</option>
                <option value="cosmetics" ${p.category === "cosmetics" ? "selected" : ""}>化粧品 / Cosmetics</option>
              </select></label>
            <label class="stack"><span>${t("商品名", "Product name")}</span><input data-p="name" value="${esc(p.name)}" placeholder="抹茶クッキー (Matcha Cookies)" /></label>
            <label class="stack"><span>${t("工場出荷価格（円）", "Factory price (JPY)")}</span><input data-p="price" type="number" min="0" value="${esc(p.price)}" /></label>
            <div></div>
            <label class="stack"><span>${t("製造日", "Manufacture date")}</span><input data-p="mfg" placeholder="YYYY/MM/DD" inputmode="numeric" value="${esc(p.mfg)}" /></label>
            <label class="stack"><span>${t("賞味期限", "Expiry date")}</span><input data-p="exp" placeholder="YYYY/MM/DD" inputmode="numeric" value="${esc(p.exp)}" /></label>
          </div>
          <p class="small muted" style="margin:14px 0 0">${t("日付は YYYY/MM/DD 形式で入力してください。", "Enter dates as YYYY/MM/DD.")}</p>
        </div>`;
      $$("[data-p]", el).forEach((i) => {
        const k = i.dataset.p;
        const check = () => { if (k === "mfg" || k === "exp") i.classList.toggle("invalid", !!i.value && !ID.parseDate(i.value)); };
        check();
        i.addEventListener("input", () => { p[k] = k === "price" ? (i.value === "" ? "" : +i.value) : i.value.trim(); check(); ID.save("product"); });
        i.addEventListener("change", () => {
          if (k === "category") { ID.state.label = { text: "", image: null, present: [], result: null, nutrition: null, kids: null }; ID.state.map.weights = null; }
          ID.rerender();
        });
      });
    },
  };
})();
