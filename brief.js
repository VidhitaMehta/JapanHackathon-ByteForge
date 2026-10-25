/* =========================================================================
   Product brief for Indian importers (English, one page).
   "Save as PDF" uses the browser's print dialog. No software needed by the
   importer: they receive this PDF by email or WhatsApp.
   ========================================================================= */
(function () {
  const { esc, $, money } = ID.ui;
  const VEG = { NON_VEG: "Non-vegetarian (brown symbol)", VEG: "Vegetarian (green symbol)", NEEDS_REVIEW: "Under review", RESTRICTED: "Restricted substance found", NONE_FOUND: "No listed restricted substance" };

  ID.views.brief = {
    render(el) {
      const st = ID.state, p = st.product, cat = p.category, lr = st.label.result, nut = st.label.nutrition;
      const sl = cat === "food" ? ID.shelfLife({ mfg: p.mfg, exp: p.exp, dispatch: st.shelf.dispatch, transitDays: st.shelf.transit, clearanceDays: st.shelf.clearance, minPercent: st.shelf.min ?? ID.SHELF_RULE.minPercent }) : null;
      const pr = p.price ? ID.price({ ...st.price, factoryJpy: p.price }) : null;
      const p100 = nut && nut.found ? ID.per100(nut) : null;
      const ing = lr ? lr.items.map((i) => (i.entry ? i.entry.en : i.raw)).filter((v, i, a) => a.indexOf(v) === i).join(", ") : "";
      const top = (st.map.scored || []).slice(0, 5).map((s) => s.state).join(", ");
      const row = (k, v) => (v ? `<tr><td style="width:34%"><b>${k}</b></td><td>${v}</td></tr>` : "");

      el.innerHTML = `
        <div class="card report">
          <div class="row no-print" style="margin-bottom:12px"><a class="btn ghost" href="#partner">← Back</a><span class="spacer"></span>
            <button class="btn primary" id="br-print">Save as PDF / Print</button></div>
          <h2>Product brief: ${esc(p.name || "[Product name]")}</h2>
          <p class="muted small">From: [Company name], Japan · Contact: [name, email, phone] · ${esc(ID.fmtDate(new Date()))}</p>
          <section><h3>Product</h3><table><tbody>
            ${row("Category", cat === "food" ? "Packaged food" : "Cosmetics")}
            ${row("Ingredients (English)", esc(ing))}
            ${row(cat === "food" ? "Veg / non-veg" : "Ingredient check", lr ? VEG[lr.verdict] || "" : "")}
            ${row("Shelf life", sl && !sl.error ? `${sl.total} days (manufacture ${esc(p.mfg)} → expiry ${esc(p.exp)})` : "")}
            ${row("Remaining at clearance", sl && !sl.error ? `${sl.pct}% on the planned schedule (FSSAI minimum: 60%)` : "")}
          </tbody></table></section>
          ${p100 ? `<section><h3>Nutrition per 100 g (from the Japanese label)</h3><table><tbody>
            ${row("Energy", p100.energyKcal !== null ? p100.energyKcal + " kcal" : "")}
            ${row("Protein", p100.proteinG !== null ? p100.proteinG + " g" : "")}
            ${row("Total fat", p100.fatG !== null ? p100.fatG + " g" : "")}
            ${row("Carbohydrate", p100.carbG !== null ? p100.carbG + " g" : "")}
            ${row("Sodium", p100.sodiumMg !== null ? p100.sodiumMg + " mg" : p100.sodiumFromSalt !== null ? p100.sodiumFromSalt + " mg (calculated from salt)" : "")}
          </tbody></table><p class="small muted">Items India also requires (e.g. sugars, saturated and trans fat, cholesterol) to be added before import.</p></section>` : ""}
          ${lr && lr.missing.length ? `<section><h3>To be added on the Indian label (importer sticker)</h3><ul>${lr.missing.map((m) => `<li>${esc(m.en)}</li>`).join("")}</ul></section>` : ""}
          ${pr ? `<section><h3>Indicative pricing</h3><table><tbody>
            ${row("Landed cost (per unit)", money(pr.landed))}
            ${row("Suggested MRP (incl. taxes)", "Rs " + pr.mrp)}
            ${row("Assumptions", `Duty ${pr.dutyPct}%, GST ${st.price.gstPct}%, margins ${st.price.mImp}% / ${st.price.mDist}% / ${st.price.mRet}% (to be agreed)`)}
          </tbody></table></section>` : ""}
          ${top ? `<section><h3>Suggested launch states</h3><p>${esc(top)}</p></section>` : ""}
          <section><h3>What we are looking for</h3><ul>
            <li>A ${cat === "food" ? "licensed importer (FSSAI import licence and IEC)" : "CDSCO-registered importer or authorised agent"}</li>
            <li>Distribution in the states above, with your proposed margin and minimum order</li>
          </ul></section>
          <p class="small muted">Prepared with Shinzoku Setu. Guidance only; to be confirmed with the importer and applicable regulations.</p>
        </div>`;
      $("#br-print").addEventListener("click", () => window.print());
    },
  };
})();
