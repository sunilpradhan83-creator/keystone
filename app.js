/* ═══════════════════════════════════════════════════
   KEYSTONE — Application Logic
   ═══════════════════════════════════════════════════ */

(function () {
  'use strict';

  /* ── Constants ───────────────────────────────────── */
  const LS_KEY = 'keystone_progress';
  const REVIEW_DAYS = { weak: 1, ok: 3, strong: 7 };
  const RATING_EMOJI = { weak: '😟', ok: '🙂', strong: '💪' };

  /* ── State ───────────────────────────────────────── */
  const state = {
    currentSection: null,
    currentQuestion: null,
    lastOpenedQuestion: null,
    currentFilter: 'all',
    navStack: [],
    studyQueue: [],
    studyIndex: 0,
    studyMode: false,
    mockSession: {
      questions: [],
      index: 0,
      scores: { weak: 0, ok: 0, strong: 0, skip: 0 },
      startTime: null,
      clockInterval: null,
    },
    timerInterval: null,
    timerSeconds: 0,
    timerRunning: false,
    hintShown: false,
    answerRevealed: false,
    answerMode: 'quick',
    toastTimeout: null,
  };

  /* ── DOM Cache ───────────────────────────────────── */
  const $ = id => document.getElementById(id);
  const DOM = {};

  function cacheDOM() {
    DOM.screens = {
      home:     $('screen-home'),
      section:  $('screen-section'),
      question: $('screen-question'),
      mock:     $('screen-mock'),
      progress: $('screen-progress'),
    };
    DOM.home = {
      statMastered:  $('stat-mastered'),
      statTotal:     $('stat-total'),
      statStreak:    $('stat-streak'),
      statDue:       $('stat-due'),
      overallPct:    $('overall-pct'),
      overallBar:    $('overall-bar'),
      sectionsGrid:  $('sections-grid'),
      btnStudy:      $('btn-study'),
      btnMock:       $('btn-mock'),
      btnProgress:   $('btn-progress'),
    };
    DOM.section = {
      backBtn:       $('section-back-btn'),
      title:         $('section-screen-title'),
      count:         $('section-screen-count'),
      filterBtns:    document.querySelectorAll('.filter-btn'),
      list:          $('question-list'),
    };
    DOM.question = {
      backBtn:       $('question-back-btn'),
      idDisplay:     $('question-id-display'),
      levelBadge:    $('question-level-badge'),
      focusToggle:   $('focus-toggle-btn'),
      breadcrumb:    $('breadcrumb-trail'),
      content:       $('question-content'),
    };
    DOM.mock = {
      backBtn:       $('mock-back-btn'),
      clock:         $('mock-clock'),
      setup:         $('mock-setup'),
      sectionGrid:   $('mock-section-grid'),
      difficulty:    $('mock-difficulty'),
      count:         $('mock-count'),
      startBtn:      $('mock-start-btn'),
      questionPanel: $('mock-question-panel'),
      progressCounter: $('mock-progress-counter'),
      progressBar:   $('mock-progress-bar'),
      cardSectionTag: $('mock-card-section-tag'),
      cardQuestion:  $('mock-card-question'),
      scratchpad:    $('mock-scratchpad'),
      revealBtn:     $('mock-reveal-btn'),
      answerPanel:   $('mock-answer-panel'),
      quickAnswer:   $('mock-quick-answer'),
      keyPoints:     $('mock-key-points'),
      commonTrap:    $('mock-common-trap'),
      ratingBtns:    document.querySelectorAll('.mock-rate-btn'),
      results:       $('mock-results'),
      resultsScore:  $('results-score'),
      strongBar:     $('results-strong-bar'),
      okBar:         $('results-ok-bar'),
      weakBar:       $('results-weak-bar'),
      strongCount:   $('results-strong-count'),
      okCount:       $('results-ok-count'),
      weakCount:     $('results-weak-count'),
      retryBtn:      $('results-retry-btn'),
      homeBtn:       $('results-home-btn'),
    };
    DOM.progress = {
      backBtn:       $('progress-back-btn'),
      resetBtn:      $('progress-reset-btn'),
      mastered:      $('prog-mastered'),
      accuracy:      $('prog-accuracy'),
      streak:        $('prog-streak'),
      sessions:      $('prog-sessions'),
      breakdown:     $('section-breakdown'),
      activityGrid:  $('activity-grid'),
    };
    DOM.toast = $('toast');
  }

  /* ── LocalStorage ────────────────────────────────── */
  function loadProgress() {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (!raw) return defaultProgress();
      return JSON.parse(raw);
    } catch {
      return defaultProgress();
    }
  }

  function defaultProgress() {
    return {
      ratings: {},
      streak: { lastStudyDate: null, count: 0 },
      mockSessions: [],
      dailyActivity: {},
    };
  }

  function saveProgress(data) {
    try {
      localStorage.setItem(LS_KEY, JSON.stringify(data));
    } catch {}
  }

  /* ── Date Helpers ────────────────────────────────── */
  function today() {
    return new Date().toISOString().slice(0, 10);
  }

  function addDays(dateStr, n) {
    const d = new Date(dateStr);
    d.setDate(d.getDate() + n);
    return d.toISOString().slice(0, 10);
  }

  function toTimestamp(dateStr) {
    return Math.floor(new Date(dateStr).getTime() / 1000);
  }

  /* ── Data Helpers ────────────────────────────────── */
  function getSection(id) {
    return KEYSTONE_DATA.sections.find(s => s.id === id);
  }

  function getSubsection(id) {
    return KEYSTONE_DATA.subsections.find(s => s.id === id);
  }

  function getQuestion(id) {
    return KEYSTONE_DATA.questions.find(q => q.id === id);
  }

  function getQuestionsForSection(sectionId) {
    return KEYSTONE_DATA.questions.filter(q => q.section === sectionId);
  }

  function getSubsectionsForSection(sectionId) {
    return KEYSTONE_DATA.subsections.filter(s => s.section === sectionId);
  }

  function questionCount(sectionId) {
    return getQuestionsForSection(sectionId).length;
  }

  /* ── Progress Helpers ────────────────────────────── */
  function getRating(qId) {
    const p = loadProgress();
    return p.ratings[qId] || null;
  }

  function getConfidencePct(questions) {
    if (!questions.length) return 0;
    const p = loadProgress();
    const strong = questions.filter(q => p.ratings[q.id]?.rating === 'strong').length;
    return Math.round((strong / questions.length) * 100);
  }

  function getSectionConfidence(sectionId) {
    return getConfidencePct(getQuestionsForSection(sectionId));
  }

  function getDueCount() {
    const p = loadProgress();
    const t = today();
    return Object.values(p.ratings).filter(r => r.reviewDate && r.reviewDate <= t).length;
  }

  function getMasteredCount() {
    const p = loadProgress();
    return Object.values(p.ratings).filter(r => r.rating === 'strong').length;
  }

  function getOverallPct() {
    return getConfidencePct(KEYSTONE_DATA.questions);
  }

  function saveRating(qId, rating) {
    const p = loadProgress();
    const t = today();
    const existing = p.ratings[qId] || {};

    p.ratings[qId] = {
      rating,
      timestamp: toTimestamp(t),
      reviewDate: addDays(t, REVIEW_DAYS[rating]),
      visitCount: (existing.visitCount || 0) + 1,
    };

    // Streak
    const last = p.streak.lastStudyDate;
    if (last === t) {
      // same day, no change
    } else if (last === addDays(t, -1)) {
      p.streak.count++;
      p.streak.lastStudyDate = t;
    } else {
      p.streak.count = 1;
      p.streak.lastStudyDate = t;
    }

    // Activity
    p.dailyActivity[t] = (p.dailyActivity[t] || 0) + 1;

    saveProgress(p);
  }

  /* ── Screen Navigation ───────────────────────────── */
  function showScreen(name) {
    Object.values(DOM.screens).forEach(s => s.classList.remove('active'));
    DOM.screens[name].classList.add('active');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function navigateTo(screen, fn) {
    if (fn) fn();
    showScreen(screen);
  }

  /* ── Toast ───────────────────────────────────────── */
  function showToast(message, type = 'default') {
    const t = DOM.toast;
    clearTimeout(state.toastTimeout);
    t.textContent = message;
    t.className = 'toast toast-visible' + (type !== 'default' ? ` toast-${type}` : '');
    state.toastTimeout = setTimeout(() => {
      t.classList.remove('toast-visible');
    }, 2000);
  }

  /* ── Render: Arrow-prefixed lines ────────────────── */
  function renderArrowLines(text) {
    if (!text) return '';
    return text.split('\n').map(line => {
      if (line.startsWith('→')) {
        return `<span class="qa-line"><span class="qa-arrow">→</span><span>${escHtml(line.slice(1).trim())}</span></span>`;
      }
      return escHtml(line) ? `<span>${escHtml(line)}</span>` : '';
    }).filter(Boolean).join('\n');
  }

  function renderDetailedText(text) {
    if (!text) return '';
    const paras = text.split('\n\n');
    return paras.map(para => {
      const lines = para.split('\n').map(line => {
        if (line.startsWith('→')) {
          return `<span class="qa-line"><span class="qa-arrow">→</span><span>${escHtml(line.slice(1).trim())}</span></span>`;
        }
        return escHtml(line) ? `<span>${escHtml(line)}</span>` : '';
      }).filter(Boolean).join('<br>');
      return `<p class="da-paragraph">${lines}</p>`;
    }).join('');
  }

  function escHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function levelClass(level) {
    return `level-${level}`;
  }

  function ratingClass(rating) {
    if (rating === 'strong') return 'rated-strong';
    if (rating === 'ok')     return 'rated-ok';
    if (rating === 'weak')   return 'rated-weak';
    return '';
  }

  function statusEmoji(rating) {
    return RATING_EMOJI[rating] || '⭕';
  }

  /* ═══════════════════════════════════════════════════
     SCREEN 1: HOME
     ═══════════════════════════════════════════════════ */

  function renderHome() {
    const p = loadProgress();
    const total = KEYSTONE_DATA.questions.length;
    const mastered = getMasteredCount();
    const streak = p.streak.count || 0;
    const due = getDueCount();
    const pct = getOverallPct();

    DOM.home.statMastered.textContent = mastered;
    DOM.home.statTotal.textContent = total;
    DOM.home.statStreak.textContent = streak + '🔥';
    DOM.home.statDue.textContent = due;
    DOM.home.overallPct.textContent = pct + '%';
    DOM.home.overallBar.style.setProperty('--bar-width', pct + '%');

    renderSectionsGrid();
  }

  function renderSectionsGrid() {
    const grid = DOM.home.sectionsGrid;
    const frag = document.createDocumentFragment();

    KEYSTONE_DATA.sections.forEach((section, idx) => {
      const qs = getQuestionsForSection(section.id);
      const pct = getSectionConfidence(section.id);
      const card = document.createElement('div');
      card.className = 'section-card';
      card.style.setProperty('--card-color', section.color);
      card.style.animationDelay = (idx * 40) + 'ms';
      card.setAttribute('role', 'button');
      card.setAttribute('tabindex', '0');
      card.setAttribute('aria-label', `${section.title}, ${qs.length} questions`);
      card.innerHTML = `
        <span class="section-card-icon">${section.icon}</span>
        <div class="section-card-name">${escHtml(section.title)}</div>
        <div class="section-card-meta">
          <span>${qs.length} question${qs.length !== 1 ? 's' : ''}</span>
          <span class="section-card-pct">${pct}%</span>
        </div>
        <div class="section-mini-bar">
          <div class="section-mini-fill" style="width:${pct}%"></div>
        </div>`;

      card.addEventListener('click', () => openSection(section.id));
      card.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          openSection(section.id);
        }
      });

      frag.appendChild(card);
    });

    grid.innerHTML = '';
    grid.appendChild(frag);

    // Stagger animation trigger
    requestAnimationFrame(() => {
      grid.querySelectorAll('.section-card').forEach(c => c.classList.add('card-visible'));
    });
  }

  /* ═══════════════════════════════════════════════════
     SCREEN 2: SECTION
     ═══════════════════════════════════════════════════ */

  function openSection(sectionId) {
    state.currentSection = sectionId;
    state.currentFilter = 'all';
    state.studyMode = false;

    // Reset filter buttons
    DOM.section.filterBtns.forEach(b => {
      b.classList.toggle('active', b.dataset.level === 'all');
    });

    const section = getSection(sectionId);
    const qs = getQuestionsForSection(sectionId);
    DOM.section.title.textContent = `${section.icon} ${section.title}`;
    DOM.section.count.textContent = `${qs.length}`;

    renderQuestionList(sectionId, 'all');
    navigateTo('section');
  }

  function renderQuestionList(sectionId, filter) {
    const list = DOM.section.list;
    const subsections = getSubsectionsForSection(sectionId);
    const p = loadProgress();
    const frag = document.createDocumentFragment();
    let totalVisible = 0;

    subsections.forEach(sub => {
      let qs = KEYSTONE_DATA.questions.filter(q => q.subsection === sub.id);
      if (filter !== 'all') qs = qs.filter(q => q.level === filter);
      if (!qs.length) return;

      totalVisible += qs.length;
      const group = document.createElement('div');
      group.className = 'subsection-group';
      group.innerHTML = `<div class="subsection-title">${escHtml(sub.title)}</div>`;

      qs.forEach(q => {
        const rating = p.ratings[q.id]?.rating || null;
        const isRated = !!rating;

        const row = document.createElement('div');
        row.className = `question-row ${ratingClass(rating)}`;
        row.dataset.qid = q.id;
        row.setAttribute('role', 'button');
        row.setAttribute('tabindex', '0');
        row.setAttribute('aria-label', q.question);
        row.innerHTML = `
          <span class="question-row-status">${statusEmoji(rating)}</span>
          <div class="question-row-content">
            <div class="question-row-text">${escHtml(q.question)}</div>
            <div class="question-row-meta">
              <span class="level-badge ${levelClass(q.level)}">${q.level}</span>
              <span class="question-row-id">${q.id}</span>
            </div>
          </div>
          <span class="question-row-arrow">›</span>`;

        if (!isRated) {
          row.addEventListener('click', () => openQuestion(q.id, { fromSection: sectionId }));
          row.addEventListener('keydown', e => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              openQuestion(q.id, { fromSection: sectionId });
            }
          });
          group.appendChild(row);
        } else {
          const wrapper = document.createElement('div');
          wrapper.className = 'question-row-wrapper';

          const bulletLines = q.quick_answer.split('\n')
            .filter(l => l.trim())
            .map(l => `<div class="qr-bullet">${escHtml(l.trim())}</div>`)
            .join('');

          const expand = document.createElement('div');
          expand.className = 'question-row-expand';
          expand.innerHTML = `
            <div class="question-row-quick-answer">${bulletLines}</div>
            <button class="question-row-open-btn" aria-label="Open full card ${escHtml(q.id)}">Open card →</button>`;

          row.setAttribute('aria-expanded', 'false');
          const toggle = () => {
            const expanded = wrapper.classList.toggle('expanded');
            row.setAttribute('aria-expanded', String(expanded));
          };
          row.addEventListener('click', toggle);
          row.addEventListener('keydown', e => {
            if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(); }
          });

          expand.querySelector('.question-row-open-btn').addEventListener('click', e => {
            e.stopPropagation();
            openQuestion(q.id, { fromSection: sectionId });
          });

          wrapper.appendChild(row);
          wrapper.appendChild(expand);
          group.appendChild(wrapper);
        }
      });

      frag.appendChild(group);
    });

    if (totalVisible === 0) {
      const empty = document.createElement('div');
      empty.className = 'empty-state';
      empty.innerHTML = `<span class="empty-state-icon">🔍</span><p class="empty-state-text">No ${filter !== 'all' ? filter : ''} questions in this section yet.</p>`;
      frag.appendChild(empty);
    }

    list.innerHTML = '';
    list.appendChild(frag);
    DOM.section.count.textContent = totalVisible;
  }

  /* ═══════════════════════════════════════════════════
     SCREEN 3: QUESTION CARD
     ═══════════════════════════════════════════════════ */

  function openQuestion(qId, opts = {}) {
    const q = getQuestion(qId);
    if (!q) {
      showToast('Question not found', 'warn');
      return;
    }

    // Nav stack for breadcrumb
    if (opts.push) {
      state.navStack.push(state.currentQuestion);
    } else if (!opts.fromSection && !opts.fromStudy) {
      // navigating fresh
    }

    state.currentQuestion = qId;
    state.lastOpenedQuestion = qId;
    state.answerRevealed = false;
    state.answerMode = 'quick';
    state.hintShown = false;

    // Reset timer
    stopTimer();
    state.timerSeconds = 0;
    state.timerRunning = false;

    renderQuestionCard(q);

    // Update sub-header
    DOM.question.idDisplay.textContent = q.id;
    DOM.question.levelBadge.className = `level-badge ${levelClass(q.level)}`;
    DOM.question.levelBadge.textContent = q.level;

    // Breadcrumb
    renderBreadcrumb(q, opts);

    navigateTo('question');
  }

  function renderBreadcrumb(q, opts) {
    const trail = DOM.question.breadcrumb;

    if (state.navStack.length === 0) {
      trail.className = 'breadcrumb-trail breadcrumb-hidden';
      return;
    }

    trail.className = 'breadcrumb-trail';
    const frag = document.createDocumentFragment();

    state.navStack.forEach((id, idx) => {
      const item = document.createElement('span');
      item.className = 'breadcrumb-item';
      item.textContent = id;
      item.addEventListener('click', () => jumpToBreadcrumb(idx));
      frag.appendChild(item);

      const sep = document.createElement('span');
      sep.className = 'breadcrumb-sep';
      sep.textContent = '→';
      frag.appendChild(sep);
    });

    const current = document.createElement('span');
    current.className = 'breadcrumb-item current';
    current.textContent = q.id;
    frag.appendChild(current);

    trail.innerHTML = '';
    trail.appendChild(frag);
  }

  function jumpToBreadcrumb(idx) {
    const targetId = state.navStack[idx];
    state.navStack = state.navStack.slice(0, idx);
    openQuestion(targetId);
  }

  function renderQuestionCard(q) {
    const content = DOM.question.content;
    content.innerHTML = '';

    // Study mode indicator
    if (state.studyMode && state.studyQueue.length > 0) {
      const indicator = document.createElement('div');
      indicator.className = 'study-progress-indicator';
      indicator.textContent = `Question ${state.studyIndex + 1} of ${state.studyQueue.length}`;
      content.appendChild(indicator);
    }

    // ── A: Question Section ──────────────────────────
    const qSection = buildCardSection('question-section', `
      <div class="card-label">Question</div>
      <p class="question-text">${escHtml(q.question)}</p>
      <div class="tags-row hidden" id="tags-row">${
        (q.tags || []).map(t => `<span class="tag-pill">${escHtml(t)}</span>`).join('')
      }</div>`);
    content.appendChild(qSection);

    // ── B: Think Zone ────────────────────────────────
    const thinkSection = buildCardSection('think-section', buildThinkZoneHTML());
    content.appendChild(thinkSection);

    // ── C: Reveal Button ─────────────────────────────
    const revealWrapper = document.createElement('div');
    revealWrapper.id = 'reveal-wrapper';
    revealWrapper.className = 'q-section';
    revealWrapper.innerHTML = `
      <button class="btn-primary reveal-btn" id="reveal-btn" aria-label="Reveal answer">
        👁️ Reveal Answer
      </button>`;
    content.appendChild(revealWrapper);

    // ── Answer Block ─────────────────────────────────
    const answerBlock = document.createElement('div');
    answerBlock.id = 'answer-block';
    answerBlock.className = 'answer-block';

    // Mode toggle
    const modeToggle = document.createElement('div');
    modeToggle.id = 'answer-mode-toggle';
    modeToggle.className = 'answer-mode-toggle q-section';
    modeToggle.innerHTML = `
      <button class="mode-toggle-btn active" data-mode="quick" aria-label="Quick answer mode">⚡ Quick</button>
      <button class="mode-toggle-btn" data-mode="detailed" aria-label="Detailed answer mode">📖 Detailed</button>`;
    answerBlock.appendChild(modeToggle);

    // Quick Answer
    const quickSection = buildCardSection('quick-answer-section q-section', `
      <div class="card-label accent-label">⚡ Quick Answer</div>
      <div class="quick-answer-text">${renderArrowLines(q.quick_answer)}</div>`);
    quickSection.id = 'quick-answer-section';
    answerBlock.appendChild(quickSection);

    // Detailed Answer
    const detailedSection = buildCardSection('detailed-answer-section q-section collapsible-section collapsed', `
      <div class="card-label accent-label">📖 Detailed Answer</div>
      <div class="detailed-answer-text">${renderDetailedText(q.detailed_answer)}</div>`);
    detailedSection.id = 'detailed-answer-section';
    answerBlock.appendChild(detailedSection);

    // Key Points
    const kpSection = buildCardSection('key-points-section q-section collapsible-section collapsed', `
      <div class="card-label key-points-label">✅ Key Points</div>
      <ul class="key-points-list">${
        (q.key_points || []).map(kp =>
          `<li class="key-point-item"><span class="kp-check">✓</span><span>${escHtml(kp)}</span></li>`
        ).join('')
      }</ul>`);
    kpSection.id = 'key-points-section';
    answerBlock.appendChild(kpSection);

    // Diagram
    if (q.has_diagram && q.diagram) {
      const diagramSection = buildCardSection('diagram-section q-section collapsible-section collapsed', `
        <div class="card-label primary-label">🏗️ Architecture Diagram</div>
        <div class="diagram-block">${escHtml(q.diagram)}</div>`);
      diagramSection.id = 'diagram-section';
      answerBlock.appendChild(diagramSection);
    }

    // Code Snippet
    if (q.has_code && q.code_snippet) {
      const codeSection = buildCardSection('code-section q-section collapsible-section collapsed', `
        <div class="code-label-row">
          <div class="card-label" style="margin-bottom:0">💻 Code Snippet</div>
          <span class="code-lang-badge">${escHtml(q.code_language || '')}</span>
          <button class="copy-btn" id="copy-btn" aria-label="Copy code">📋 Copy</button>
        </div>
        <div class="code-block-wrapper">
          <pre><code id="code-content" class="language-${escHtml(q.code_language || 'markup')}">${escHtml(q.code_snippet)}</code></pre>
        </div>`);
      codeSection.id = 'code-section';
      answerBlock.appendChild(codeSection);
    }

    // Common Trap
    const trapSection = buildCardSection('trap-section q-section card-section trap-card', `
      <div class="card-label warn-label">⚠️ Common Trap</div>
      <p class="trap-text">${escHtml(q.common_trap)}</p>`);
    trapSection.id = 'trap-section';
    trapSection.className = 'trap-section q-section card-section trap-card';
    answerBlock.appendChild(trapSection);

    // Follow-up Questions
    if (q.follow_up_questions && q.follow_up_questions.length) {
      const fuSection = buildCardSection('followup-section q-section collapsible-section collapsed', buildFollowUpHTML(q.follow_up_questions));
      fuSection.id = 'followup-section';
      answerBlock.appendChild(fuSection);
    }

    // Related Questions
    if (q.related && q.related.length) {
      const relSection = buildCardSection('related-section q-section collapsible-section collapsed', `
        <div class="card-label">🔗 Related</div>
        <div class="related-pills">${
          (() => {
            const allIds = new Set(KEYSTONE_DATA.questions.map(q => q.id));
            return q.related.map(id =>
              allIds.has(id)
                ? `<button class="related-pill" data-qid="${escHtml(id)}" aria-label="Go to question ${escHtml(id)}">${escHtml(id)}</button>`
                : `<span class="related-pill related-pill-disabled" title="Not yet available" aria-label="${escHtml(id)} — coming soon">${escHtml(id)}</span>`
            ).join('');
          })()
        }</div>`);
      relSection.id = 'related-section';
      answerBlock.appendChild(relSection);
    }

    // Self Rating
    const ratingSection = buildCardSection('rating-section q-section', buildRatingSectionHTML(q.id));
    ratingSection.id = 'rating-section';
    answerBlock.appendChild(ratingSection);

    content.appendChild(answerBlock);

    // ── Wire up events ───────────────────────────────
    wireQuestionEvents(q);

    // Restore existing rating if any
    const existing = getRating(q.id);
    if (existing) {
      const ratingSection_ = content.querySelector('#rating-section');
      const btn = ratingSection_?.querySelector(`[data-rating="${existing.rating}"]`);
      if (btn) btn.classList.add('selected');
      showPostRating(q.id, existing.rating);
    }
  }

  function buildCardSection(classes, innerHTML) {
    const el = document.createElement('div');
    el.className = `card-section q-section ${classes}`;
    el.innerHTML = innerHTML;
    return el;
  }

  function buildThinkZoneHTML() {
    return `
      <div class="card-label">⏱️ Think Zone</div>
      <div class="timer-row">
        <span class="timer-icon">⏱️</span>
        <span class="timer-display" id="timer-display" aria-live="polite">00:00</span>
        <span class="timer-status" id="timer-status">Ready</span>
        <button class="timer-btn timer-btn-start" id="timer-btn" aria-label="Start thinking timer">Start Thinking</button>
      </div>
      <div class="timer-track">
        <div class="timer-fill" id="timer-fill"></div>
      </div>
      <div class="hint-zone" id="hint-zone" style="display:none">
        <button class="hint-reveal-btn" id="hint-reveal-btn" aria-label="Show hint">💡 Show Hint</button>
        <div class="hint-content" id="hint-content"></div>
      </div>
      <textarea class="scratchpad" id="scratchpad" placeholder="Jot your thoughts here...&#10;(optional, not graded)" aria-label="Scratchpad"></textarea>`;
  }

  function buildFollowUpHTML(followUps) {
    const allIds = new Set(KEYSTONE_DATA.questions.map(q => q.id));

    function comingSoonLabel(linksTo) {
      if (!linksTo) return 'Card coming soon';
      const secId  = parseInt(linksTo.split('.')[0]);
      const subId  = linksTo.split('.').slice(0, 2).join('.');
      const sec    = KEYSTONE_DATA.sections.find(s => s.id === secId);
      const sub    = KEYSTONE_DATA.subsections.find(s => s.id === subId);
      const secName = sec  ? sec.title  : `Section ${secId}`;
      const subName = sub  ? sub.title  : `${subId}`;
      return `Card coming soon in ${escHtml(secName)} — ${escHtml(subName)}`;
    }

    const items = followUps.map(fu => {
      const hasTarget  = fu.links_to && allIds.has(fu.links_to);
      const hasLink    = !!fu.links_to;
      const openBtn    = hasLink
        ? hasTarget
          ? `<button class="followup-open-btn" data-qid="${escHtml(fu.links_to)}" aria-label="Open card ${escHtml(fu.links_to)}">Open →</button>`
          : `<span  class="followup-open-btn followup-open-disabled" aria-label="Card not yet available">Open →</span>`
        : '';
      const comingSoon = (!hasTarget)
        ? `<div class="followup-coming-soon">${comingSoonLabel(fu.links_to)}</div>`
        : '';

      return `
        <div class="followup-item" aria-expanded="false">
          <div class="followup-header" tabindex="0" aria-label="${escHtml(fu.text)}">
            <span class="followup-arrow-icon">▶</span>
            <span class="followup-text">${escHtml(fu.text)}</span>
            ${openBtn}
          </div>
          <div class="followup-body">
            <div class="followup-mini-answer">${
              fu.mini_answer
                ? escHtml(fu.mini_answer)
                : hasTarget
                  ? '<span class="followup-open-hint">Open the card for the full answer →</span>'
                  : ''
            }</div>
            ${comingSoon}
          </div>
        </div>`;
    }).join('');

    return `
      <div class="card-label">🔄 Follow-up Questions</div>
      <div class="followup-list">${items}</div>`;
  }

  function buildRatingSectionHTML(qId) {
    const existing = getRating(qId);
    const selectedWeak     = existing?.rating === 'weak'   ? 'selected' : '';
    const selectedOk       = existing?.rating === 'ok'     ? 'selected' : '';
    const selectedStrong   = existing?.rating === 'strong' ? 'selected' : '';

    return `
      <div class="rating-header">
        <div class="rating-label">How well did you answer?</div>
        <div class="rating-sublabel">Compare your notes with the answer above</div>
      </div>
      <div class="rating-buttons">
        <button class="rate-btn rate-btn-weak ${selectedWeak}" data-rating="weak" aria-label="Rate as weak">
          <span class="rate-emoji">😟</span>
          <span class="rate-name">Weak</span>
          <span class="rate-sub">Missed key points</span>
        </button>
        <button class="rate-btn rate-btn-ok ${selectedOk}" data-rating="ok" aria-label="Rate as ok">
          <span class="rate-emoji">🙂</span>
          <span class="rate-name">OK</span>
          <span class="rate-sub">Some gaps remain</span>
        </button>
        <button class="rate-btn rate-btn-strong ${selectedStrong}" data-rating="strong" aria-label="Rate as strong">
          <span class="rate-emoji">💪</span>
          <span class="rate-name">Strong</span>
          <span class="rate-sub">Covered it all</span>
        </button>
      </div>
      <div id="post-rating"></div>`;
  }

  function wireQuestionEvents(q) {
    const content = DOM.question.content;

    // Reveal button
    const revealBtn = content.querySelector('#reveal-btn');
    if (revealBtn) {
      revealBtn.addEventListener('click', () => revealAnswer(q));
    }

    // Timer
    const timerBtn = content.querySelector('#timer-btn');
    if (timerBtn) {
      timerBtn.addEventListener('click', toggleTimer);
    }

    // Hint
    const hintBtn = content.querySelector('#hint-reveal-btn');
    if (hintBtn) {
      const hintContent = content.querySelector('#hint-content');
      hintContent.textContent = q.hint || '';
      hintBtn.addEventListener('click', () => {
        hintContent.classList.toggle('hint-visible');
        hintBtn.textContent = hintContent.classList.contains('hint-visible') ? '💡 Hide Hint' : '💡 Show Hint';
      });
    }

    // Answer mode toggle
    content.querySelectorAll('.mode-toggle-btn').forEach(btn => {
      btn.addEventListener('click', () => switchAnswerMode(btn.dataset.mode, q));
    });

    // Copy button
    const copyBtn = content.querySelector('#copy-btn');
    if (copyBtn) {
      copyBtn.addEventListener('click', () => {
        const code = content.querySelector('#code-content')?.textContent || '';
        copyToClipboard(code, copyBtn);
      });
    }

    // Follow-up items — unified handler
    content.querySelectorAll('.followup-item').forEach(el => {
      const header = el.querySelector('.followup-header');

      // Header toggles expand/collapse
      header.addEventListener('click', () => {
        const expanded = el.classList.toggle('expanded');
        el.setAttribute('aria-expanded', expanded);
      });
      header.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); header.click(); }
      });

      // Open button navigates without collapsing
      const openBtn = el.querySelector('.followup-open-btn[data-qid]');
      if (openBtn) {
        openBtn.addEventListener('click', e => {
          e.stopPropagation();
          state.navStack.push(q.id);
          openQuestion(openBtn.dataset.qid, { push: false });
        });
      }
    });

    // Related pills
    content.querySelectorAll('.related-pill').forEach(el => {
      el.addEventListener('click', () => {
        state.navStack.push(q.id);
        openQuestion(el.dataset.qid, { push: false });
      });
    });

    // Rating buttons
    content.querySelectorAll('.rate-btn').forEach(btn => {
      btn.addEventListener('click', () => handleRating(q.id, btn.dataset.rating, btn));
    });
  }

  function revealAnswer(q) {
    state.answerRevealed = true;
    state.answerMode = 'quick';

    const content = DOM.question.content;
    const revealWrapper = content.querySelector('#reveal-wrapper');
    const answerBlock = content.querySelector('#answer-block');
    const thinkSection = content.querySelector('.think-section');

    // Hide reveal button
    if (revealWrapper) revealWrapper.classList.add('hidden');

    // Reveal answer block
    answerBlock.classList.add('revealed');

    // Stop timer, update status
    if (state.timerRunning) stopTimer();
    updateTimerStatus('done');

    // Hide think zone
    if (thinkSection) thinkSection.classList.add('hidden');

    // Apply quick mode first so hidden sections are set before animating
    applyAnswerMode('quick', q);

    // Stagger animate only visible sections
    const sections = answerBlock.querySelectorAll('.q-section:not(.hidden)');
    sections.forEach((s, i) => {
      s.style.animationDelay = (i * 60) + 'ms';
      s.classList.add('stagger-in');
    });

    // Trigger Prism highlight
    const codeEl = content.querySelector('#code-content');
    if (codeEl && window.Prism) {
      Prism.highlightElement(codeEl);
    }
  }

  function switchAnswerMode(mode, q) {
    if (!state.answerRevealed) return;
    state.answerMode = mode;
    applyAnswerMode(mode, q);

    // Update toggle buttons
    DOM.question.content.querySelectorAll('.mode-toggle-btn').forEach(b => {
      b.classList.toggle('active', b.dataset.mode === mode);
    });
  }

  function applyAnswerMode(mode, q) {
    const content = DOM.question.content;

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
      if (thinkSection && state.answerRevealed) thinkSection.classList.add('hidden');
    } else {
      if (quickSection)    quickSection.classList.add('hidden');
      show(detailedSection);
      show(kpSection);
      if (diagramSection && q.has_diagram && q.diagram)               show(diagramSection);
      if (codeSection    && q.has_code    && q.code_snippet)          show(codeSection);
      if (fuSection      && q.follow_up_questions?.length)            show(fuSection);
      if (relSection     && q.related?.length)                        show(relSection);
      if (tagsRow)         tagsRow.classList.remove('hidden');
      if (thinkSection && state.answerRevealed) thinkSection.classList.add('hidden');
    }
  }

  function show(el) {
    if (el) {
      el.classList.remove('collapsed');
      el.classList.remove('hidden');
    }
  }
  function collapse(el) {
    if (el) el.classList.add('collapsed');
  }
  function expand(el) {
    if (el) el.classList.remove('collapsed');
  }

  function handleRating(qId, rating, btn) {
    saveRating(qId, rating);

    // Visual feedback
    const ratingButtons = DOM.question.content.querySelectorAll('.rate-btn');
    ratingButtons.forEach(b => b.classList.remove('selected'));
    btn.classList.add('selected');

    showPostRating(qId, rating);
    showToast('Progress saved ✓', 'success');

    // Refresh home stats (in memory)
    renderHome();
  }

  function showPostRating(qId, rating) {
    const postRatingEl = DOM.question.content.querySelector('#post-rating');
    if (!postRatingEl) return;

    const days = REVIEW_DAYS[rating] || 1;
    const emoji = RATING_EMOJI[rating] || '';

    // Build prev/next nav
    const queue = state.studyMode ? state.studyQueue : buildSectionQueue();
    const idx = queue.indexOf(qId);
    const prevId = idx > 0 ? queue[idx - 1] : null;
    const nextId = idx < queue.length - 1 ? queue[idx + 1] : null;

    postRatingEl.innerHTML = `
      <div class="post-rating">
        <p class="post-rating-text">Rated ${emoji} · See again in ${days} day${days !== 1 ? 's' : ''}</p>
        <div class="nav-buttons">
          <button class="nav-btn" id="nav-prev" ${!prevId ? 'disabled' : ''} aria-label="Previous question">← Previous</button>
          <button class="nav-btn" id="nav-next" ${!nextId ? 'disabled' : ''} aria-label="Next question">Next →</button>
        </div>
      </div>`;

    const prevBtn = postRatingEl.querySelector('#nav-prev');
    const nextBtn = postRatingEl.querySelector('#nav-next');

    if (prevBtn && prevId) {
      prevBtn.addEventListener('click', () => {
        state.studyIndex = Math.max(0, idx - 1);
        openQuestion(prevId, { fromSection: state.currentSection });
      });
    }
    if (nextBtn && nextId) {
      nextBtn.addEventListener('click', () => {
        state.studyIndex = Math.min(queue.length - 1, idx + 1);
        openQuestion(nextId, { fromSection: state.currentSection });
      });
    }
  }

  function buildSectionQueue() {
    if (!state.currentSection) return KEYSTONE_DATA.questions.map(q => q.id);
    return getQuestionsForSection(state.currentSection).map(q => q.id);
  }

  /* ── Timer ───────────────────────────────────────── */
  function toggleTimer() {
    if (state.timerRunning) stopTimer();
    else startTimer();
  }

  function startTimer() {
    state.timerRunning = true;
    const timerBtn = DOM.question.content.querySelector('#timer-btn');
    const timerDisplay = DOM.question.content.querySelector('#timer-display');
    if (timerBtn) {
      timerBtn.textContent = 'Stop';
      timerBtn.className = 'timer-btn timer-btn-stop';
    }
    if (timerDisplay) timerDisplay.classList.add('timer-running');

    state.timerInterval = setInterval(() => {
      state.timerSeconds++;
      updateTimerUI();
    }, 1000);
  }

  function stopTimer() {
    clearInterval(state.timerInterval);
    state.timerRunning = false;
    const timerBtn = DOM.question.content.querySelector('#timer-btn');
    const timerDisplay = DOM.question.content.querySelector('#timer-display');
    if (timerBtn) {
      timerBtn.textContent = 'Start Thinking';
      timerBtn.className = 'timer-btn timer-btn-start';
    }
    if (timerDisplay) timerDisplay.classList.remove('timer-running');
  }

  function updateTimerUI() {
    const display = DOM.question.content.querySelector('#timer-display');
    const status  = DOM.question.content.querySelector('#timer-status');
    const fill    = DOM.question.content.querySelector('#timer-fill');
    const hintZone = DOM.question.content.querySelector('#hint-zone');
    const s = state.timerSeconds;

    if (display) display.textContent = formatTime(s);
    if (status) {
      if (s === 0)      status.textContent = 'Ready';
      else if (s < 60)  status.textContent = 'Thinking...';
      else              status.textContent = 'Deep thinking 🧠';
    }

    // Progress bar fills over 300s
    const pct = Math.min((s / 300) * 100, 100);
    if (fill) fill.style.width = pct + '%';

    // Show hint after 60s
    if (s >= 60 && hintZone && !state.hintShown) {
      hintZone.style.display = 'block';
      hintZone.style.animation = 'screenIn 0.3s ease forwards';
    }
  }

  function updateTimerStatus(type) {
    const status = DOM.question.content.querySelector('#timer-status');
    if (!status) return;
    if (type === 'done') {
      status.textContent = `You thought for ${formatTime(state.timerSeconds)}`;
    }
  }

  function formatTime(totalSeconds) {
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }

  /* ── Copy to Clipboard ───────────────────────────── */
  function copyToClipboard(text, btn) {
    const doCopy = () => {
      btn.textContent = 'Copied! ✓';
      btn.classList.add('copied');
      showToast('Copied to clipboard', 'success');
      setTimeout(() => {
        btn.textContent = '📋 Copy';
        btn.classList.remove('copied');
      }, 2000);
    };

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(doCopy).catch(() => fallbackCopy(text, doCopy));
    } else {
      fallbackCopy(text, doCopy);
    }
  }

  function fallbackCopy(text, cb) {
    const el = document.createElement('textarea');
    el.value = text;
    el.style.position = 'fixed';
    el.style.opacity = '0';
    document.body.appendChild(el);
    el.select();
    try { document.execCommand('copy'); cb(); } catch {}
    document.body.removeChild(el);
  }

  /* ═══════════════════════════════════════════════════
     STUDY MODE
     ═══════════════════════════════════════════════════ */

  function startStudyMode() {
    // Build prioritised queue across all sections
    const p = loadProgress();
    const t = today();

    const due     = KEYSTONE_DATA.questions.filter(q => {
      const r = p.ratings[q.id];
      return r && r.reviewDate && r.reviewDate <= t;
    });
    const unrated = KEYSTONE_DATA.questions.filter(q => !p.ratings[q.id]);
    const weak    = KEYSTONE_DATA.questions.filter(q => p.ratings[q.id]?.rating === 'weak' && !(p.ratings[q.id]?.reviewDate <= t));
    const rest    = KEYSTONE_DATA.questions.filter(q => {
      const r = p.ratings[q.id];
      return r && r.rating !== 'weak' && !(r.reviewDate <= t);
    });

    const queue = [...new Set([...due, ...unrated, ...weak, ...rest])];

    if (!queue.length) {
      showToast('No questions available', 'warn');
      return;
    }

    state.studyMode = true;
    state.studyQueue = queue.map(q => q.id);
    state.studyIndex = 0;
    state.navStack = [];

    openQuestion(state.studyQueue[0], { fromStudy: true });
  }

  /* ═══════════════════════════════════════════════════
     SCREEN 4: MOCK INTERVIEW
     ═══════════════════════════════════════════════════ */

  function renderMockSetup() {
    const grid = DOM.mock.sectionGrid;
    const frag = document.createDocumentFragment();

    KEYSTONE_DATA.sections.forEach(section => {
      const btn = document.createElement('button');
      btn.className = 'mock-section-btn selected';
      btn.dataset.sectionId = section.id;
      btn.setAttribute('aria-label', section.title);
      btn.innerHTML = `
        <span class="btn-section-icon">${section.icon}</span>
        <span class="btn-section-name">${escHtml(section.title.split(' ').slice(0, 2).join(' '))}</span>`;
      btn.addEventListener('click', () => btn.classList.toggle('selected'));
      frag.appendChild(btn);
    });

    grid.innerHTML = '';
    grid.appendChild(frag);
  }

  function startMockSession() {
    const selectedSectionIds = Array.from(DOM.mock.sectionGrid.querySelectorAll('.mock-section-btn.selected'))
      .map(b => parseInt(b.dataset.sectionId, 10));

    if (!selectedSectionIds.length) {
      DOM.mock.sectionGrid.classList.add('shake');
      setTimeout(() => DOM.mock.sectionGrid.classList.remove('shake'), 400);
      return;
    }

    const difficulty = DOM.mock.difficulty.value;
    const count = parseInt(DOM.mock.count.value, 10);

    let pool = KEYSTONE_DATA.questions.filter(q => selectedSectionIds.includes(q.section));
    if (difficulty !== 'all') pool = pool.filter(q => q.level === difficulty);

    if (!pool.length) {
      showToast('No questions match your selection', 'warn');
      return;
    }

    // Shuffle
    const shuffled = [...pool].sort(() => Math.random() - 0.5);
    const questions = shuffled.slice(0, Math.min(count, shuffled.length));

    state.mockSession.questions = questions;
    state.mockSession.index = 0;
    state.mockSession.scores = { weak: 0, ok: 0, strong: 0, skip: 0 };
    state.mockSession.startTime = Date.now();

    // Show question panel
    DOM.mock.setup.classList.add('hidden');
    DOM.mock.results.classList.add('hidden');
    DOM.mock.questionPanel.classList.remove('hidden');

    startMockClock();
    renderMockQuestion();
  }

  function startMockClock() {
    if (state.mockSession.clockInterval) clearInterval(state.mockSession.clockInterval);
    state.mockSession.clockInterval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - state.mockSession.startTime) / 1000);
      DOM.mock.clock.textContent = formatTime(elapsed);
      if (elapsed > 600) {
        DOM.mock.clock.classList.add('overtime');
      }
    }, 1000);
  }

  function stopMockClock() {
    clearInterval(state.mockSession.clockInterval);
    state.mockSession.clockInterval = null;
  }

  function renderMockQuestion() {
    const { questions, index } = state.mockSession;
    const q = questions[index];
    if (!q) return;

    const total = questions.length;
    const pct = ((index + 1) / total) * 100;

    DOM.mock.progressCounter.textContent = `${index + 1} / ${total}`;
    DOM.mock.progressBar.style.setProperty('--bar-width', pct + '%');

    const section = getSection(q.section);
    DOM.mock.cardSectionTag.textContent = section ? `${section.icon} ${section.title}` : '';
    DOM.mock.cardQuestion.textContent = q.question;

    // Reset state
    DOM.mock.scratchpad.value = '';
    DOM.mock.revealBtn.classList.remove('hidden');
    DOM.mock.answerPanel.classList.add('hidden');

    // Reset rating buttons
    DOM.mock.ratingBtns.forEach(b => b.classList.remove('selected'));
  }

  function revealMockAnswer() {
    const q = state.mockSession.questions[state.mockSession.index];
    if (!q) return;

    DOM.mock.revealBtn.classList.add('hidden');

    // Quick answer
    DOM.mock.quickAnswer.innerHTML = renderArrowLines(q.quick_answer);

    // Key points
    DOM.mock.keyPoints.innerHTML = (q.key_points || []).map(kp =>
      `<li class="key-point-item"><span class="kp-check">✓</span><span>${escHtml(kp)}</span></li>`
    ).join('');

    // Common trap
    DOM.mock.commonTrap.textContent = q.common_trap || '';

    DOM.mock.answerPanel.classList.remove('hidden');
  }

  function handleMockRating(rating) {
    if (rating !== 'skip') {
      state.mockSession.scores[rating]++;
      saveRating(state.mockSession.questions[state.mockSession.index].id, rating);
      DOM.mock.ratingBtns.forEach(b => {
        if (b.dataset.rating === rating) b.classList.add('selected');
      });
    } else {
      state.mockSession.scores.skip++;
    }

    setTimeout(() => advanceMockQuestion(), 800);
  }

  function advanceMockQuestion() {
    state.mockSession.index++;
    if (state.mockSession.index >= state.mockSession.questions.length) {
      endMockSession();
    } else {
      renderMockQuestion();
    }
  }

  function endMockSession() {
    stopMockClock();
    const { scores, questions, startTime } = state.mockSession;
    const duration = Math.floor((Date.now() - startTime) / 1000);
    const total = questions.length;

    // Save session
    const p = loadProgress();
    p.mockSessions.push({
      date: today(),
      score: { weak: scores.weak, ok: scores.ok, strong: scores.strong },
      duration,
    });
    saveProgress(p);

    // Results UI
    DOM.mock.questionPanel.classList.add('hidden');
    DOM.mock.results.classList.remove('hidden');

    DOM.mock.resultsScore.textContent = `${scores.strong} / ${total} Strong`;

    const strongPct = total ? (scores.strong / total) * 100 : 0;
    const okPct     = total ? (scores.ok     / total) * 100 : 0;
    const weakPct   = total ? (scores.weak   / total) * 100 : 0;

    requestAnimationFrame(() => {
      setTimeout(() => {
        DOM.mock.strongBar.style.setProperty('--bar-width', strongPct + '%');
        DOM.mock.okBar.style.setProperty('--bar-width', okPct + '%');
        DOM.mock.weakBar.style.setProperty('--bar-width', weakPct + '%');
      }, 50);
    });

    DOM.mock.strongCount.textContent = scores.strong;
    DOM.mock.okCount.textContent = scores.ok;
    DOM.mock.weakCount.textContent = scores.weak;

    showToast('Session complete 🎯', 'success');
    renderHome();
  }

  function resetMockUI() {
    stopMockClock();
    DOM.mock.clock.textContent = '00:00';
    DOM.mock.clock.classList.remove('overtime');
    DOM.mock.setup.classList.remove('hidden');
    DOM.mock.questionPanel.classList.add('hidden');
    DOM.mock.results.classList.add('hidden');

    // Re-select all sections
    DOM.mock.sectionGrid.querySelectorAll('.mock-section-btn').forEach(b => b.classList.add('selected'));
  }

  /* ═══════════════════════════════════════════════════
     SCREEN 5: PROGRESS
     ═══════════════════════════════════════════════════ */

  function renderProgress() {
    const p = loadProgress();
    const total = KEYSTONE_DATA.questions.length;
    const ratings = Object.values(p.ratings);
    const mastered = ratings.filter(r => r.rating === 'strong').length;
    const rated = ratings.filter(r => r.rating).length;
    const accuracy = rated > 0 ? Math.round((mastered / rated) * 100) : 0;
    const streak = p.streak.count || 0;
    const sessions = p.mockSessions.length;

    DOM.progress.mastered.textContent = mastered;
    DOM.progress.accuracy.textContent = accuracy + '%';
    DOM.progress.streak.textContent = streak + '🔥';
    DOM.progress.sessions.textContent = sessions;

    // Section breakdown
    const frag = document.createDocumentFragment();
    KEYSTONE_DATA.sections.forEach(section => {
      const qs = getQuestionsForSection(section.id);
      if (!qs.length) return;

      const sRatings = qs.map(q => p.ratings[q.id]?.rating);
      const strong = sRatings.filter(r => r === 'strong').length;
      const ok     = sRatings.filter(r => r === 'ok').length;
      const weak   = sRatings.filter(r => r === 'weak').length;
      const unrated = qs.length - sRatings.filter(Boolean).length;
      const pct    = Math.round((strong / qs.length) * 100);

      const card = document.createElement('div');
      card.className = 'breakdown-card';
      card.innerHTML = `
        <div class="breakdown-header">
          <span class="breakdown-icon">${section.icon}</span>
          <span class="breakdown-name">${escHtml(section.title)}</span>
          <span class="breakdown-pct">${pct}%</span>
        </div>
        <div class="breakdown-bar-track">
          <div class="breakdown-bar-fill" style="--section-color:${section.color}; width:0%"
               data-target="${pct}"></div>
        </div>
        <div class="breakdown-detail">${strong} strong · ${ok} ok · ${weak} weak · ${unrated} unrated</div>`;
      frag.appendChild(card);
    });

    DOM.progress.breakdown.innerHTML = '';
    DOM.progress.breakdown.appendChild(frag);

    // Animate bars after mount
    requestAnimationFrame(() => {
      setTimeout(() => {
        DOM.progress.breakdown.querySelectorAll('.breakdown-bar-fill').forEach(bar => {
          bar.style.width = bar.dataset.target + '%';
        });
      }, 50);
    });

    // Activity grid
    renderActivityGrid(p);
  }

  function renderActivityGrid(p) {
    const grid = DOM.progress.activityGrid;
    grid.innerHTML = '';
    const frag = document.createDocumentFragment();

    const now = new Date();
    for (let i = 27; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().slice(0, 10);
      const count = p.dailyActivity[dateStr] || 0;

      const cell = document.createElement('div');
      cell.className = 'activity-cell';
      if (count >= 8)      cell.classList.add('level-3');
      else if (count >= 4) cell.classList.add('level-2');
      else if (count >= 1) cell.classList.add('level-1');

      cell.title = `${dateStr}: ${count} question${count !== 1 ? 's' : ''}`;
      frag.appendChild(cell);
    }

    grid.appendChild(frag);
  }

  function resetAllProgress() {
    if (!confirm('Reset all progress? This cannot be undone.')) return;
    saveProgress(defaultProgress());
    renderProgress();
    renderHome();
    showToast('Progress reset', 'warn');
  }

  /* ═══════════════════════════════════════════════════
     KEYBOARD NAVIGATION
     ═══════════════════════════════════════════════════ */

  function initKeyboard() {
    document.addEventListener('keydown', e => {
      const activeScreen = Object.entries(DOM.screens).find(([, el]) => el.classList.contains('active'))?.[0];

      if (e.key === 'Escape') {
        if (activeScreen === 'question') DOM.question.backBtn.click();
        else if (activeScreen === 'section') DOM.section.backBtn.click();
        else if (activeScreen === 'progress') DOM.progress.backBtn.click();
      }

      if (activeScreen === 'question') {
        if (e.key === 'ArrowRight') {
          const nextBtn = DOM.question.content.querySelector('#nav-next');
          if (nextBtn && !nextBtn.disabled) nextBtn.click();
        }
        if (e.key === 'ArrowLeft') {
          const prevBtn = DOM.question.content.querySelector('#nav-prev');
          if (prevBtn && !prevBtn.disabled) prevBtn.click();
        }
      }
    });
  }

  /* ═══════════════════════════════════════════════════
     DATA VALIDATION
     ═══════════════════════════════════════════════════ */

  function validateData() {
    const allIds = new Set(KEYSTONE_DATA.questions.map(q => q.id));
    KEYSTONE_DATA.questions.forEach(q => {
      (q.follow_up_questions || []).forEach(fu => {
        if (fu.type === 'linked' && fu.links_to && !allIds.has(fu.links_to)) {
          console.warn(`[KEYSTONE] Broken follow-up link in question ${q.id}: links_to "${fu.links_to}" not found.`);
        }
      });
      (q.related || []).forEach(rid => {
        if (!allIds.has(rid)) {
          console.warn(`[KEYSTONE] Broken related link in question ${q.id}: "${rid}" not found.`);
        }
      });
    });
  }

  /* ═══════════════════════════════════════════════════
     EVENT WIRING
     ═══════════════════════════════════════════════════ */

  function wireEvents() {
    // Home
    DOM.home.btnStudy.addEventListener('click', startStudyMode);
    DOM.home.btnMock.addEventListener('click', () => {
      renderMockSetup();
      resetMockUI();
      navigateTo('mock');
    });
    DOM.home.btnProgress.addEventListener('click', () => {
      renderProgress();
      navigateTo('progress');
    });

    // Section back
    DOM.section.backBtn.addEventListener('click', () => {
      state.studyMode = false;
      navigateTo('home', renderHome);
    });

    // Section filter buttons
    DOM.section.filterBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        DOM.section.filterBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        state.currentFilter = btn.dataset.level;
        renderQuestionList(state.currentSection, state.currentFilter);
      });
    });

    // Question back
    DOM.question.backBtn.addEventListener('click', () => {
      stopTimer();
      state.navStack = [];
      state.studyMode = false;
      if (state.currentSection) {
        navigateTo('section', () => renderQuestionList(state.currentSection, state.currentFilter));
        requestAnimationFrame(() => {
          const target = DOM.section.list.querySelector(`[data-qid="${state.lastOpenedQuestion}"]`);
          if (target) target.scrollIntoView({ block: 'center', behavior: 'instant' });
        });
      } else {
        navigateTo('home', renderHome);
      }
    });

    // Focus mode toggle
    DOM.question.focusToggle.addEventListener('click', () => {
      document.body.classList.toggle('focus-mode');
    });

    // Mock back
    DOM.mock.backBtn.addEventListener('click', () => {
      if (!DOM.mock.setup.classList.contains('hidden') && DOM.mock.questionPanel.classList.contains('hidden')) {
        navigateTo('home', renderHome);
        return;
      }
      if (confirm('Exit session? Progress will be saved.')) {
        stopMockClock();
        navigateTo('home', renderHome);
      }
    });

    // Mock start
    DOM.mock.startBtn.addEventListener('click', startMockSession);

    // Mock reveal
    DOM.mock.revealBtn.addEventListener('click', revealMockAnswer);

    // Mock rating
    DOM.mock.ratingBtns.forEach(btn => {
      btn.addEventListener('click', () => handleMockRating(btn.dataset.rating));
    });

    // Mock results
    DOM.mock.retryBtn.addEventListener('click', () => {
      resetMockUI();
      renderMockSetup();
    });
    DOM.mock.homeBtn.addEventListener('click', () => {
      stopMockClock();
      navigateTo('home', renderHome);
    });

    // Progress back
    DOM.progress.backBtn.addEventListener('click', () => navigateTo('home', renderHome));

    // Progress reset
    DOM.progress.resetBtn.addEventListener('click', resetAllProgress);
  }

  /* ═══════════════════════════════════════════════════
     INIT
     ═══════════════════════════════════════════════════ */

  function init() {
    cacheDOM();
    wireEvents();
    initKeyboard();
    validateData();
    renderHome();
  }

  document.addEventListener('DOMContentLoaded', init);

})();
