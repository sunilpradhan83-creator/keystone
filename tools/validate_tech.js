// validate_tech.js
// Run: node tools/validate_tech.js
// Validates the tech banks (slim schema, slug ids, intra-bank only).
// Tech ≠ architect: detailed_answer / key_points / common_trap are OPTIONAL.

const fs   = require('fs');
const path = require('path');

console.log('\n🔧 KEYSTONE — Tech Bank Validator');
console.log('──────────────────────────────────\n');

const LEVELS = ['basic', 'intermediate', 'advanced'];
const CODE_LANGS = ['java', 'python', 'yaml', 'sql', 'bash', 'markdown', 'protobuf'];
const techRoot = path.join(__dirname, '..', 'questions', 'tech');

let errors = 0;
let warnings = 0;
const err  = m => { console.error('❌ ' + m); errors++; };
const warn = m => { console.warn('⚠️  ' + m); warnings++; };

if (!fs.existsSync(techRoot)) {
  console.log('No questions/tech/ directory — nothing to validate.\n');
  process.exit(0);
}

const stacks = fs.readdirSync(techRoot).filter(f =>
  fs.statSync(path.join(techRoot, f)).isDirectory());

if (!stacks.length) {
  console.log('No tech stacks yet — nothing to validate.\n');
  process.exit(0);
}

let grandTotal = 0;

stacks.forEach(stack => {
  const dir = path.join(techRoot, stack);
  const dataFile = path.join(dir, `${stack}_data.js`);
  if (!fs.existsSync(dataFile)) {
    warn(`${stack}: no ${stack}_data.js assembler — skipping`);
    return;
  }

  // Concatenate every section file + the assembler, then return the bank.
  const sectionFiles = fs.readdirSync(dir)
    .filter(f => f.endsWith('.js') && f !== `${stack}_data.js`)
    .sort();
  let src = '';
  sectionFiles.forEach(f => { src += fs.readFileSync(path.join(dir, f), 'utf8') + '\n;'; });
  src += fs.readFileSync(dataFile, 'utf8') + '\n;';

  const VAR = `${stack.toUpperCase()}_DATA`;
  let bank;
  try {
    bank = new Function(src + `\nreturn ${VAR};`)();
  } catch (e) {
    err(`${stack}: failed to evaluate (${e.message})`);
    return;
  }

  const sectionIds = new Set(bank.sections.map(s => s.id));
  const subById    = new Map(bank.subsections.map(s => [s.id, s]));
  const seenIds    = new Set();
  const idRe       = new RegExp(`^${stack}\\.[a-z0-9]+\\.\\d{2}$`);

  console.log(`Stack: ${stack}`);
  console.log(`  sections: ${bank.sections.length} · subsections: ${bank.subsections.length} · questions: ${bank.questions.length}`);

  // Sections must carry UI fields
  bank.sections.forEach(s => {
    if (!s.title || !s.icon || !s.color) err(`${stack}: section ${s.id} missing title/icon/color`);
  });

  bank.questions.forEach(q => {
    const at = `${stack}:${q.id || '(no id)'}`;
    if (!q.id || !idRe.test(q.id)) err(`${at}: bad slug id (expected ${stack}.<topic>.NN)`);
    if (seenIds.has(q.id)) err(`${at}: duplicate id`);
    seenIds.add(q.id);

    if (!q.section || !sectionIds.has(q.section)) err(`${at}: section "${q.section}" not in bank`);
    if (!q.subsection || !subById.has(q.subsection)) err(`${at}: subsection "${q.subsection}" not in bank`);
    else if (subById.get(q.subsection).section !== q.section)
      err(`${at}: subsection ${q.subsection} belongs to a different section`);

    if (!LEVELS.includes(q.level)) err(`${at}: bad level "${q.level}"`);
    if (!q.question || !q.question.trim()) err(`${at}: empty question`);
    if (!q.quick_answer || !q.quick_answer.trim()) err(`${at}: empty quick_answer`);

    // Optional blocks: only checked if present
    if (q.key_points && !Array.isArray(q.key_points)) err(`${at}: key_points must be an array`);
    if (q.has_code && (!q.code_language || !q.code_snippet)) err(`${at}: has_code but missing code_language/code_snippet`);
    if (q.code_language && !CODE_LANGS.includes(q.code_language)) warn(`${at}: unusual code_language "${q.code_language}"`);

    // Banks never interleave — related links must stay within this stack
    (q.related || []).forEach(r => {
      if (!String(r).startsWith(stack + '.')) err(`${at}: related "${r}" crosses bank boundary`);
      else if (!seenIds.has(r) && !bank.questions.some(x => x.id === r)) warn(`${at}: related "${r}" not found yet`);
    });
  });

  grandTotal += bank.questions.length;
  console.log('');
});

console.log('──────────────────────────────────');
console.log(`  Total tech questions: ${grandTotal}`);
console.log(`  Errors:   ${errors}`);
console.log(`  Warnings: ${warnings}\n`);

if (errors) { console.error('❌ INVALID\n'); process.exit(1); }
console.log('✅ VALID\n');
