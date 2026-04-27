// Tests applyAnswerMode logic using jsdom — no browser required
const { JSDOM } = require('jsdom');

const dom = new JSDOM(`<!DOCTYPE html><html><body>
  <div id="question-content">
    <div id="quick-answer-section" class="q-section"></div>
    <div id="detailed-answer-section" class="q-section collapsible-section collapsed"></div>
    <div id="key-points-section" class="q-section collapsible-section collapsed"></div>
    <div id="diagram-section" class="q-section collapsible-section collapsed"></div>
    <div id="code-section" class="q-section collapsible-section collapsed"></div>
    <div id="followup-section" class="q-section collapsible-section collapsed"></div>
    <div id="related-section" class="q-section collapsible-section collapsed"></div>
    <div id="tags-row"></div>
    <div class="think-section"></div>
  </div>
</body></html>`);

const content = dom.window.document.getElementById('question-content');

function show(el) {
  if (el) { el.classList.remove('collapsed'); el.classList.remove('hidden'); }
}

function applyAnswerMode(mode, q) {
  const quickSection    = content.querySelector('#quick-answer-section');
  const detailedSection = content.querySelector('#detailed-answer-section');
  const kpSection       = content.querySelector('#key-points-section');
  const diagramSection  = content.querySelector('#diagram-section');
  const codeSection     = content.querySelector('#code-section');
  const fuSection       = content.querySelector('#followup-section');
  const relSection      = content.querySelector('#related-section');
  const tagsRow         = content.querySelector('#tags-row');
  const thinkSection    = content.querySelector('.think-section');

  if (mode === 'quick') {
    if (quickSection)    quickSection.classList.remove('hidden');
    if (detailedSection) detailedSection.classList.add('hidden');
    if (kpSection)       kpSection.classList.add('hidden');
    if (diagramSection)  diagramSection.classList.add('hidden');
    if (codeSection)     codeSection.classList.add('hidden');
    if (fuSection)       fuSection.classList.add('hidden');
    if (relSection)      relSection.classList.add('hidden');
    if (tagsRow)         tagsRow.classList.add('hidden');
    if (thinkSection)    thinkSection.classList.add('hidden');
  } else {
    if (quickSection)    quickSection.classList.add('hidden');
    show(detailedSection);
    show(kpSection);
    if (diagramSection && q.has_diagram && q.diagram)             show(diagramSection);
    if (codeSection    && q.has_code    && q.code_snippet)        show(codeSection);
    if (fuSection      && q.follow_up_questions?.length)          show(fuSection);
    if (relSection     && q.related?.length)                      show(relSection);
    if (tagsRow)         tagsRow.classList.remove('hidden');
    if (thinkSection)    thinkSection.classList.add('hidden');
  }
}

const q_full = {
  has_diagram: true, diagram: 'some diagram',
  has_code: true, code_snippet: 'some code',
  follow_up_questions: ['q1'],
  related: ['r1']
};
const q_minimal = {};

let pass = 0, fail = 0;
function assert(desc, condition) {
  if (condition) { console.log('  ✅', desc); pass++; }
  else           { console.log('  ❌', desc); fail++; }
}

// ── TEST 1: Quick mode hides detailed sections ──
console.log('\nTEST 1 — Quick mode:');
applyAnswerMode('quick', q_full);
assert('quick visible',    !content.querySelector('#quick-answer-section').classList.contains('hidden'));
assert('detailed hidden',   content.querySelector('#detailed-answer-section').classList.contains('hidden'));
assert('kp hidden',         content.querySelector('#key-points-section').classList.contains('hidden'));
assert('diagram hidden',    content.querySelector('#diagram-section').classList.contains('hidden'));
assert('code hidden',       content.querySelector('#code-section').classList.contains('hidden'));
assert('followup hidden',   content.querySelector('#followup-section').classList.contains('hidden'));
assert('related hidden',    content.querySelector('#related-section').classList.contains('hidden'));

// ── TEST 2: Detailed mode shows sections and removes collapsed ──
console.log('\nTEST 2 — Detailed mode (full question):');
applyAnswerMode('detailed', q_full);
const det = content.querySelector('#detailed-answer-section');
const kp  = content.querySelector('#key-points-section');
assert('quick hidden',           content.querySelector('#quick-answer-section').classList.contains('hidden'));
assert('detailed visible',       !det.classList.contains('hidden') && !det.classList.contains('collapsed'));
assert('kp visible',             !kp.classList.contains('hidden')  && !kp.classList.contains('collapsed'));
assert('diagram visible',        !content.querySelector('#diagram-section').classList.contains('hidden'));
assert('code visible',           !content.querySelector('#code-section').classList.contains('hidden'));
assert('followup visible',       !content.querySelector('#followup-section').classList.contains('hidden'));
assert('related visible',        !content.querySelector('#related-section').classList.contains('hidden'));

// ── TEST 3: Detailed mode with minimal question (no optional fields) ──
console.log('\nTEST 3 — Detailed mode (minimal question, no diagram/code/followup/related):');
content.querySelectorAll('.q-section').forEach(el => {
  el.classList.remove('hidden');
  el.classList.add('collapsed');
});
applyAnswerMode('detailed', q_minimal);
assert('detailed visible',   !content.querySelector('#detailed-answer-section').classList.contains('hidden'));
assert('kp visible',         !content.querySelector('#key-points-section').classList.contains('hidden'));
assert('diagram still hidden', content.querySelector('#diagram-section').classList.contains('collapsed') ||
                               !content.querySelector('#diagram-section').classList.contains('hidden') === false);

// ── TEST 4: Toggle Quick → Detailed → Quick ──
console.log('\nTEST 4 — Toggle sequence Q→D→Q:');
applyAnswerMode('quick', q_full);
applyAnswerMode('detailed', q_full);
applyAnswerMode('quick', q_full);
assert('back to quick: quick visible',   !content.querySelector('#quick-answer-section').classList.contains('hidden'));
assert('back to quick: detailed hidden',  content.querySelector('#detailed-answer-section').classList.contains('hidden'));

console.log(`\n${fail === 0 ? '✅ ALL TESTS PASSED' : `❌ ${fail} FAILED`} (${pass} passed, ${fail} failed)\n`);
process.exit(fail > 0 ? 1 : 0);
