/* =========================================================================
   Shinzoku Setu — Gemini helper
   AI is used ONLY to: read text from label photos, translate, draft messages.
   It never decides compliance. Without an API key, these features show a
   message and the rest of the app works normally.
   ========================================================================= */
(function () {
  const DEFAULT_MODEL = "gemini-3.8-flash";
  const RETIRED = ["gemini-2.5-flash"]; // saved names Google no longer accepts for new users

  const store = {
    get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* storage blocked: keep in memory */ } },
  };
  let memKey = null;

  ID.gemini = {
    key() { return memKey || store.get("indiaDesk.geminiKey") || ""; },
    model() {
      const m = store.get("indiaDesk.geminiModel");
      return m && !RETIRED.includes(m) ? m : DEFAULT_MODEL;
    },
    backup() { return store.get("indiaDesk.backupModel") || ""; },
    save(key, model, backup) {
      memKey = key || null;
      store.set("indiaDesk.geminiKey", key || "");
      store.set("indiaDesk.geminiModel", model || DEFAULT_MODEL);
      if (backup !== undefined) store.set("indiaDesk.backupModel", backup || "");
    },
    hasKey() { return !!this.key(); },

    /* parts: [{text}] or [{inline_data:{mime_type,data}}]. Returns parsed JSON.
       Asks for minimal "thinking" (faster for simple tasks like copying text);
       if the model rejects that setting, retries once without it and remembers. */
    async json(parts) {
      if (!this.hasKey()) throw new Error("NO_KEY");
      const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
      const BUSY = [429, 500, 503];
      const send = (model, fast) => fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(this.key())}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts }],
          generationConfig: { responseMimeType: "application/json", temperature: 0.2, ...(fast ? { thinkingConfig: { thinkingLevel: "low" } } : {}) },
        }),
      });
      /* One model: fast-mode fallback, then up to 2 retries when the service is busy. */
      const tryModel = async (model) => {
        let res;
        for (let attempt = 0; attempt < 3; attempt++) {
          const fastOk = store.get("indiaDesk.fastMode") !== "off";
          res = await send(model, fastOk);
          if (!res.ok && fastOk && res.status === 400) {
            const t = await res.clone().text();
            if (/thinking/i.test(t)) { store.set("indiaDesk.fastMode", "off"); res = await send(model, false); }
          }
          if (res.ok || !BUSY.includes(res.status) || attempt === 2) break;
          await sleep(attempt === 0 ? 2000 : 5000);
        }
        return res;
      };
      let res = await tryModel(this.model());
      if (!res.ok && BUSY.includes(res.status) && this.backup()) res = await tryModel(this.backup());
      if (!res.ok) {
        const t = await res.text();
        if (BUSY.includes(res.status)) {
          const e = new Error("The AI service is busy right now. Please try again in a minute, or paste the ingredient text instead. (AI 混雑中：1分後に再試行するか、原材料の文字を貼り付けてください)");
          e.busy = true; throw e;
        }
        throw new Error(`AI service error ${res.status}: ${t.slice(0, 200)}`);
      }
      const data = await res.json();
      const text = data?.candidates?.[0]?.content?.parts?.map((p) => p.text || "").join("") || "";
      try { return JSON.parse(text); }
      catch (e) { throw new Error("The AI service returned an unreadable answer. Please try again."); }
    },

    /* Reads the ingredient list from a label photo. Returns Japanese text only. */
    async readLabel(dataUrl) {
      const [meta, b64] = dataUrl.split(",");
      const mime = (meta.match(/data:(.*?);/) || [])[1] || "image/jpeg";
      return this.json([
        { text: "You are an OCR tool. From this Japanese product label, transcribe exactly as printed, in Japanese: (1) the ingredient list (原材料名) keeping the original separators, and (2) the nutrition panel (栄養成分表示) including its serving basis line, e.g. 1袋（43g）当たり. Do not translate, judge, calculate, add or remove anything. Return JSON: {\"ingredientsText\": string, \"nutritionText\": string (empty if none), \"found\": boolean}." },
        { inline_data: { mime_type: mime, data: b64 } },
      ]);
    },

    /* Translates a list of Japanese ingredient names to English. Translation only. */
    async translate(list) {
      return this.json([{ text: `Translate these Japanese food or cosmetic ingredient names into plain English. Translation only: do not say whether they are vegetarian or allowed. Return JSON: {"items":[{"ja":string,"en":string}]}.\n${JSON.stringify(list)}` }]);
    },
  };
})();
