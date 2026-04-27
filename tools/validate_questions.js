// validate_questions.js
// Run: node validate_questions.js
// Validates all section files and checks cross-section link integrity

const fs   = require('fs');
const path = require('path');

console.log('\n🔑 KEYSTONE — Question Validator');
console.log('──────────────────────────────────\n');

// ── Load all section files ────────────────────────────
const questionsDir  = path.join(__dirname, '..', 'questions');
const sectionFiles  = fs.readdirSync(questionsDir)
  .filter(f => f.startsWith('section_') && f.endsWith('.js'))
  .sort();

if (!sectionFiles.length) {
  console.error('❌ No section files found in questions/');
  process.exit(1);
}

console.log('Section files found:');
sectionFiles.forEach(f => console.log(' ', f));
console.log('');

// ── Execute each file to get questions ────────────────
let allQuestions   = [];
const sectionCounts = {};

sectionFiles.forEach(file => {
  const content = fs.readFileSync(path.join(questionsDir, file), 'utf8');
  const num     = file.replace('section_', '').replace('.js', '');
  const varName = `SECTION_${num}_QUESTIONS`;

  try {
    const fn = new Function(content + `\nreturn ${varName};`);
    const questions = fn();
    if (!Array.isArray(questions)) {
      console.error(`❌ ${file}: ${varName} is not an array`);
      return;
    }
    allQuestions         = allQuestions.concat(questions);
    sectionCounts[file]  = questions.length;
    console.log(`✅ ${file}: ${questions.length} question${questions.length !== 1 ? 's' : ''}`);
  } catch (e) {
    console.error(`❌ ${file}: Parse error:`, e.message);
    process.exit(1);
  }
});

console.log('\nTotal questions loaded:', allQuestions.length);

// ── Build ID set for link validation ─────────────────
const allIds = new Set(allQuestions.map(q => q.id));

// ── Validate each question ────────────────────────────
console.log('\nValidating...\n');
let errors      = 0;
let warnings    = 0;
const brokenLinks = [];
const seenIds   = new Set();

const requiredFields = [
  'id', 'section', 'subsection', 'level',
  'question', 'quick_answer', 'detailed_answer',
  'key_points', 'common_trap'
];

allQuestions.forEach(q => {

  // Duplicate ID check
  if (seenIds.has(q.id)) {
    console.error(`❌ DUPLICATE ID: ${q.id}`);
    errors++;
  }
  seenIds.add(q.id);

  // Required fields
  requiredFields.forEach(field => {
    const val = q[field];
    if (!val || (Array.isArray(val) && val.length === 0)) {
      console.error(`❌ MISSING: ${q.id} → field: ${field}`);
      errors++;
    }
  });

  // quick_answer format
  if (q.quick_answer && !q.quick_answer.includes('→')) {
    console.warn(`⚠️  FORMAT: ${q.id} — quick_answer should use → bullets`);
    warnings++;
  }

  // Follow-up link integrity
  (q.follow_up_questions || []).forEach(fu => {
    if (fu.type === 'linked') {
      if (!fu.links_to) {
        console.error(`❌ LINK: ${q.id} — linked follow-up missing links_to`);
        errors++;
      } else if (!allIds.has(fu.links_to)) {
        console.warn(`⚠️  BROKEN LINK: ${q.id} → ${fu.links_to} (not found yet)`);
        brokenLinks.push({ from: q.id, to: fu.links_to });
        warnings++;
      }
    }
    if (fu.type === 'inline' && !fu.mini_answer) {
      console.error(`❌ INLINE: ${q.id} — inline follow-up missing mini_answer`);
      errors++;
    }
  });

  // Level value check
  if (!['basic', 'intermediate', 'advanced'].includes(q.level)) {
    console.error(`❌ LEVEL: ${q.id} — invalid level "${q.level}"`);
    errors++;
  }

  // Code consistency check
  if (q.has_code && !q.code_snippet) {
    console.error(`❌ CODE: ${q.id} — has_code is true but code_snippet is missing`);
    errors++;
  }
  if (q.has_diagram && !q.diagram) {
    console.error(`❌ DIAGRAM: ${q.id} — has_diagram is true but diagram is missing`);
    errors++;
  }
});

// ── Summary ───────────────────────────────────────────
console.log('──────────────────────────────────');
console.log('VALIDATION SUMMARY');
console.log('──────────────────────────────────');
Object.entries(sectionCounts).forEach(([file, count]) => {
  console.log(`  ${file}: ${count} question${count !== 1 ? 's' : ''}`);
});
console.log(`\n  Total:    ${allQuestions.length}`);
console.log(`  Errors:   ${errors}`);
console.log(`  Warnings: ${warnings}`);

if (brokenLinks.length > 0) {
  console.log('\n  Broken links (target not yet added):');
  brokenLinks.forEach(l => console.log(`    ${l.from} → ${l.to}`));
  console.log('  (These resolve as sections are added)');
}

console.log('');
if (errors === 0) {
  console.log('✅ VALID — Ready to deploy\n');
} else {
  console.log('❌ INVALID — Fix errors before deploying\n');
  process.exit(1);
}
