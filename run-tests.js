/* Run the engine tests in a terminal:  node tests/run-tests.js */
const path = require("path");
globalThis.window = globalThis;
for (const f of ["js/data/rules.js", "js/data/dictionary.js", "js/data/states.js", "js/data/leads.js", "js/core/engine.js", "tests/engine.test.js"]) {
  require(path.join(__dirname, "..", f));
}
const results = globalThis.ID_TEST_RESULTS;
let failed = 0;
for (const r of results) {
  console.log(`${r.ok ? "PASS" : "FAIL"}  ${r.name}${r.ok ? "" : "\n      " + r.msg}`);
  if (!r.ok) failed++;
}
console.log(`\n${results.length - failed} of ${results.length} tests passed`);
process.exit(failed ? 1 : 0);
