// questions/tech/java/java_data.js
// Assembles the Java tech bank into the same shape as the architect bank
// (KEYSTONE_DATA): { sections, subsections, questions }. The app reads every
// bank through this shape via the active-bank seam (DB) in app.js.
//
// Each section lives in its own file and exposes a JAVA_<SECTION> const of
// { section, subsections, questions }. Register new sections in PARTS below
// (load order in index.html: section files → this file → app.js).
//
// Planned Java taxonomy (content lands section-by-section):
//   Concurrency ✅ · Core Language & OOP · Collections & Generics · JVM & Memory
//   · Exceptions & I/O · Streams & Functional · Spring
// Only sections with questions are registered, so Home shows honest counts.

const JAVA_DATA = (function () {
  const PARTS = [
    typeof JAVA_CONCURRENCY !== 'undefined' ? JAVA_CONCURRENCY : null,
    // ── ADD NEW JAVA SECTIONS ABOVE THIS LINE ──
  ].filter(Boolean);

  return {
    sections:    PARTS.map(p => p.section),
    subsections: PARTS.flatMap(p => p.subsections),
    questions:   PARTS.flatMap(p => p.questions),
  };
})();
