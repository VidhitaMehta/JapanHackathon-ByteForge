# Guide: real product testing and real state data

Two jobs that turn Shinzoku Setu from a prototype into something with evidence.
Split them: two people on product testing, one on state data.

---

## Part 1: Test Label Check on 25–30 real Japanese products

### Where to get real ingredient lists (原材料名)
- **Shops:** Japanese and Korean snacks sold in Indian supermarkets or Asian grocery stores. Photograph the back label.
- **Online listings:** Amazon India and other stores often show photos of the back label. Take screenshots.
- **Manufacturer websites:** Japanese makers often list 原材料名 on each product page. Copy the text.
- **Open Food Facts** (world.openfoodfacts.org): search for products sold in Japan; many entries include the Japanese ingredient text.

Aim for a mix: rice crackers, chocolate, biscuits, instant ramen, curry roux, furikake, dashi or miso packs, mayonnaise, candy, matcha drinks. Savoury products are the hard cases (fish and meat extracts), so include plenty.

### The method (this is what makes the result credible)
1. **Round 1: improve (10 products).** Run each through Label Check. When an ingredient is wrongly classified or is a common term the app doesn't know, look up what it is and add it to `js/data/dictionary.js`. If it can come from plants *or* animals, add it as `"Needs review"`; don't guess.
2. **Round 2: measure (15–20 *different* products).** Don't change the dictionary during this round. For each product:
   - Paste the text, press **Run check**, then **Save to Test Log**.
   - In **Test Log**, mark every ingredient ✓ (correct) or ✕ (wrong), and mark the overall verdict ✓ or ✕.
   - "Needs review" counts as correct if the ingredient really is uncertain, and wrong if it's an obvious, common term the app should have known.
3. **Export the CSV** from Test Log and keep it as your evidence.

Keeping the two rounds separate matters: an accuracy figure measured on the same products you used to fix the dictionary would overstate how well it works. Say so in the pitch: judges respect it.

### What to report
From the Test Log summary, for round 2 only:
- products tested and ingredients checked,
- % of ingredients classified correctly,
- how many were sent to review,
- **number of wrong veg/non-veg verdicts** (the most important number; it should be 0).

Example sentence for the slide (use your real numbers):
> "Tested on 18 real Japanese products (312 ingredients) not used to build the dictionary: 93% classified correctly, 21 sent to human review, 0 wrong veg/non-veg verdicts."

---

## Part 2: Add the remaining state data

Search interest (Google Trends, food and cosmetics) is already built in. In the app: **Launch Map → Download data as CSV**. Fill the blank columns, then **Upload CSV**. Blank cells are treated as "not collected", never as zero. Use the exact state names shown on the map (Odisha, Delhi, Tamil Nadu…).

| Column | What to put | Where to get it |
|---|---|---|
| `spending` | Average monthly per-capita consumption expenditure (MPCE), **urban**, in ₹ | MoSPI, Household Consumption Expenditure Survey 2023–24: the state-wise tables in the published factsheet or report (mospi.gov.in) |
| `search_interest_food` / `search_interest_cosmetics` | Google Trends score (0–100). **Already done** | trends.google.com → set **India**, **past 12 months** → search a term such as *Japanese food* or *matcha* (use *J-beauty* or *Japanese skincare* for cosmetics) → **Interest by subregion** → download CSV. Optionally average 3–4 terms |
| `japanese_presence` | Number of Japanese companies or business establishments in the state | Embassy of Japan in India, *List of Japanese Companies in India* (state-wise table) |
| `online_spending` | Household spending on online purchases | HCES 2023–24 microdata (microdata.gov.in). Needs processing; **if you can't get it, leave the column blank**: the app then gives it 0% weight automatically |

Tips:
- Google Trends leaves out states with too few searches. Enter 0 for those and mention it as a limitation.
- Keep a note of the exact table or search term and the date you downloaded each source. Put it on your data slide.
- Leave out small union territories you have no data for; they simply show as "No data" on the map.
- After uploading, the "Data in use" box on the map lists which indicators now have data.

### Check your file before uploading
Upload `tests/data/test1.csv` first: you should see 100 / 50 / 0 (then press "Back to built-in data"). That proves the scoring works, so any odd result with your real file is a data problem (a typo, wrong units, or a misspelled state name, which the app lists in a warning).
