/* An offline, single-browser learning companion. No network calls or accounts. */
(() => {
  "use strict";
  const DATA = window.GS_DATA;
  const main = document.getElementById("main-content");
  if (!DATA || !Array.isArray(DATA.sections) || !DATA.sections.length) {
    main.innerHTML = '<div class="empty"><h2>The study library could not load.</h2><p>Keep index.html, study-data.js, app.js, styles.css and assets together in the same folder, then reopen index.html.</p></div>';
    return;
  }
  const KEY = "psc-general-studies-reading-v1";
  const sections = DATA.sections;
  const sectionMap = new Map(sections.map(s => [s.id, s]));
  const questionMap = new Map();
  const noteMap = new Map();
  const sourceMap = new Map();
  sections.forEach(s => {
    s.questions.forEach((q, i) => questionMap.set(q.id, { ...q, sectionId: s.id, number: i + 1 }));
    s.notes.forEach(n => noteMap.set(n.id, { ...n, sectionId: s.id }));
    s.sources.forEach(source => sourceMap.set(source.id, source));
  });
  const escape = value => String(value ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const bookmarkIcon = '<svg aria-hidden="true" viewBox="0 0 20 20"><path d="M5 2.5h10v15l-5-3.5-5 3.5z"/></svg>';
  const flagIcon = '<svg aria-hidden="true" viewBox="0 0 20 20"><path d="M4 18V2h11l-2.5 4L15 10H4"/></svg>';
  const baseState = () => ({ schema: 1, answers: {}, bookmarks: {}, flagged: {}, notesRead: {}, positions: {}, lastQuestion: null, view: "notes", subject: "all", updatedAt: 0 });
  let storageAvailable = true;
  let state = baseState();
  const validOption = v => Number.isInteger(v) && v >= 0 && v <= 3;
  const validTime = v => Number.isFinite(v) && v > 0 ? v : 0;
  function sanitise(raw) {
    if (!raw || typeof raw !== "object" || raw.schema !== 1) throw new Error("Unrecognised progress format");
    const clean = baseState();
    for (const [id, value] of Object.entries(raw.answers || {})) {
      if (!questionMap.has(id) || !value || typeof value !== "object") continue;
      const selected = validOption(value.selected) ? value.selected : null;
      const checkedAt = validTime(value.checkedAt);
      clean.answers[id] = {
        selected, checked: value.checked === true && selected !== null,
        checkedAt, lastCorrect: typeof value.lastCorrect === "boolean" ? value.lastCorrect : (checkedAt && selected !== null ? selected === questionMap.get(id).answer : null),
        updatedAt: validTime(value.updatedAt) || checkedAt
      };
    }
    for (const field of ["bookmarks", "flagged"]) {
      for (const [id, when] of Object.entries(raw[field] || {})) if (questionMap.has(id) && validTime(when)) clean[field][id] = when;
    }
    for (const [id, when] of Object.entries(raw.notesRead || {})) if (noteMap.has(id) && validTime(when)) clean.notesRead[id] = when;
    for (const [id, qid] of Object.entries(raw.positions || {})) if (sectionMap.has(id) && questionMap.get(qid)?.sectionId === id) clean.positions[id] = qid;
    if (questionMap.has(raw.lastQuestion)) clean.lastQuestion = raw.lastQuestion;
    if (["notes", "practice", "bookmarks"].includes(raw.view)) clean.view = raw.view;
    if (sectionMap.has(raw.subject) || raw.subject === "all") clean.subject = raw.subject;
    clean.updatedAt = validTime(raw.updatedAt);
    return clean;
  }
  function storageWarning(text) {
    const warning = document.getElementById("storage-warning");
    warning.textContent = text;
    warning.hidden = false;
    document.getElementById("saved-status").textContent = "Changes are kept in this open tab. Download a backup.";
  }
  try {
    const saved = localStorage.getItem(KEY);
    if (saved) {
      try { state = sanitise(JSON.parse(saved)); }
      catch { storageWarning("The saved study record could not be read. You can keep learning in this tab; the original record has been left in storage. Download a backup before closing."); storageAvailable = false; }
    }
  } catch {
    storageAvailable = false;
    storageWarning("Browser storage is unavailable. Learning still works in this tab. Download a progress backup before closing, then restore it next time.");
  }
  let view = state.view;
  let subject = state.subject;
  let practiceFilter = "all";
  let noteSearch = "";
  let noteTopic = "all";
  let bookmarkFilter = "all";
  let activeId = null;
  let recallMode = false;
  let recallChoice = null;
  let queueSnapshot = null;
  const announce = text => { document.getElementById("announcer").textContent = text; };
  function save() {
    state.updatedAt = Date.now();
    state.view = view;
    state.subject = subject;
    if (storageAvailable) {
      try {
        localStorage.setItem(KEY, JSON.stringify(state));
        document.getElementById("saved-status").textContent = "Saved in this browser.";
      } catch {
        storageAvailable = false;
        storageWarning("Your latest changes could not be saved to this browser. Keep this tab open and download a progress backup before closing.");
      }
    }
  }
  const totalChecked = s => s.questions.filter(q => state.answers[q.id]?.checkedAt).length;
  const totalRead = s => s.notes.filter(n => state.notesRead[n.id]).length;
  function renderShell() {
    document.getElementById("total-questions").textContent = questionMap.size.toLocaleString("en-GB");
    document.getElementById("total-notes-read").textContent = Object.keys(state.notesRead).length.toLocaleString("en-GB");
    document.getElementById("bookmark-total").textContent = Object.keys(state.bookmarks).length;
    document.querySelectorAll("[data-view]").forEach(button => {
      if (button.dataset.view === view) button.setAttribute("aria-current", "page"); else button.removeAttribute("aria-current");
    });
    const all = `<button class="subject-button" data-subject="all" ${subject === "all" ? 'aria-current="true"' : ""}>All subjects<small>${noteMap.size.toLocaleString("en-GB")} concise notes · 4,000 questions</small></button>`;
    document.getElementById("subject-list").innerHTML = all + sections.map(s => `<button class="subject-button" data-subject="${s.id}" ${subject === s.id ? 'aria-current="true"' : ""}>${escape(s.title)}<small>${totalRead(s)}/${s.notes.length} notes read · ${totalChecked(s)}/${s.questions.length} checked</small></button>`).join("");
    const resume = document.getElementById("resume-global");
    const q = questionMap.get(state.lastQuestion);
    resume.hidden = !q;
    if (q) { resume.textContent = `Continue ${sectionMap.get(q.sectionId).title} · Q${q.number} →`; resume.dataset.qid = q.id; }
  }
  function go(viewName, chosenSubject = subject, focus = true) {
    view = viewName;
    subject = chosenSubject;
    noteTopic = "all";
    noteSearch = "";
    practiceFilter = "all";
    queueSnapshot = null;
    recallMode = false;
    activeId = null;
    if (view === "practice" && subject === "all") subject = questionMap.get(state.lastQuestion)?.sectionId || sections[0].id;
    save(); render();
    if (focus) focusWorkspace();
    else document.querySelector(`[data-subject="${subject}"]`)?.focus({ preventScroll: true });
  }
  function focusWorkspace() { document.getElementById("workspace").scrollIntoView({ block: "start" }); main.focus({ preventScroll: true }); }
  function render() {
    renderShell();
    if (view === "practice") renderPractice();
    else if (view === "bookmarks") renderBookmarks();
    else renderNotes();
  }
  function sourceLinks(ids) {
    return [...new Set(ids)].map(id => sourceMap.get(id)).filter(Boolean).filter(s => /^https?:\/\//.test(s.url)).map(s => `<li><a href="${escape(s.url)}" target="_blank" rel="noopener noreferrer">${escape(s.title)}</a> <span>— ${escape(s.publisher)}${s.accessed ? ` · consulted ${escape(s.accessed)}` : ""}</span></li>`).join("");
  }
  function renderNotes() {
    const chosen = subject === "all" ? sections : [sectionMap.get(subject)];
    const topics = [...new Set(chosen.flatMap(s => s.notes.map(n => n.topic)))];
    main.innerHTML = `<div class="page-heading"><div><p class="eyebrow">01 / BUILD YOUR FOUNDATION</p><h2>Short notes. Strong foundations.</h2><p class="page-description">Read a small topic, cover it, and recall the key facts in your own words. Tick a line when you have read it; revisit it later to make it stick.</p></div><button class="button secondary small" data-action="practise">Go to questions →</button></div><div class="notice">Start with the notes across all six subjects. You can practise at any time; your reading ticks and question progress save separately.</div><div class="note-colour-key" aria-label="Note emphasis key"><span class="note-key">Key terms</span><span class="note-date">Dates &amp; numbers</span><span class="note-place">Places &amp; facts</span><span class="note-work">Titles &amp; definitions</span></div><div class="tools"><label class="field search-field">Search notes<input id="note-search" type="search" value="${escape(noteSearch)}" placeholder="Try: river, Constitution, vitamin…" autocomplete="off"></label><label class="field topic-field">Topic<select id="note-topic"><option value="all">All topics</option>${topics.map(t => `<option value="${escape(t)}" ${noteTopic === t ? "selected" : ""}>${escape(t)}</option>`).join("")}</select></label><span class="result-count" id="note-result-count"></span></div><div id="notes-body"></div><div class="notes-end"><p>Recall first. Then use questions to find what needs another look.</p>${subject !== "all" && sections.indexOf(chosen[0]) < sections.length - 1 ? `<button class="button secondary small" data-next-notes="${sections[sections.indexOf(chosen[0]) + 1].id}">Next subject’s notes →</button>` : '<button class="button primary small" data-action="practise">Start practising →</button>'}</div>`;
    renderNotesBody();
  }
  function renderNotesBody() {
    const chosen = subject === "all" ? sections : [sectionMap.get(subject)];
    const search = noteSearch.trim().toLocaleLowerCase("en-GB");
    let count = 0;
    const html = chosen.map(s => {
      const notes = s.notes.filter(n => (noteTopic === "all" || n.topic === noteTopic) && (!search || `${n.text} ${n.topic}`.toLocaleLowerCase("en-GB").includes(search)));
      count += notes.length;
      if (!notes.length) return "";
      const groups = new Map();
      notes.forEach(n => { if (!groups.has(n.topic)) groups.set(n.topic, []); groups.get(n.topic).push(n); });
      return `<section class="note-section" data-section="${escape(s.id)}"><div class="section-line"><h2>${escape(s.title)}</h2><span>${totalRead(s)} / ${s.notes.length} notes read</span></div><p class="page-description">${escape(s.description)}</p>${[...groups].map(([topic, rows]) => `<div class="note-topic"><div class="topic-heading"><h3>${escape(topic)}</h3><button class="link-button" data-mark-topic="${escape(s.id)}" data-topic="${escape(topic)}">Mark topic read</button></div><ul class="notes-list">${rows.map(n => `<li class="note-row ${state.notesRead[n.id] ? "read" : ""}"><input type="checkbox" id="${escape(n.id)}" data-note="${escape(n.id)}" ${state.notesRead[n.id] ? "checked" : ""}><label for="${escape(n.id)}">${window.GS_NOTE_FORMATTER?.render ? window.GS_NOTE_FORMATTER.render(n, s.id) : escape(n.text)}</label></li>`).join("")}</ul><details class="topic-sources"><summary>Sources for this topic</summary><ul class="source-list">${sourceLinks(rows.flatMap(n => n.sourceIds))}</ul></details></div>`).join("")}</section>`;
    }).join("");
    document.getElementById("note-result-count").textContent = `${count.toLocaleString("en-GB")} notes`;
    document.getElementById("notes-body").innerHTML = html || '<div class="empty"><h3>No matching notes</h3><p>Try a shorter search or select all topics.</p></div>';
  }
  function selectedSection() { return sectionMap.get(subject) || sections[0]; }
  function queue() {
    const s = selectedSection();
    if (practiceFilter === "all") return s.questions.map(q => q.id);
    if (queueSnapshot) return queueSnapshot;
    queueSnapshot = s.questions.filter(q => practiceFilter === "bookmarked" ? state.bookmarks[q.id] : practiceFilter === "review" ? (state.flagged[q.id] || state.answers[q.id]?.lastCorrect === false) : !state.answers[q.id]?.checkedAt).map(q => q.id);
    return queueSnapshot;
  }
  function visit(id) {
    const q = questionMap.get(id);
    if (!q) return;
    activeId = id;
    state.positions[q.sectionId] = id;
    state.lastQuestion = id;
    save();
  }
  function renderPractice() {
    const s = selectedSection();
    subject = s.id;
    const ids = queue();
    if (!activeId || !ids.includes(activeId)) activeId = ids.includes(state.positions[s.id]) ? state.positions[s.id] : ids[0];
    if (activeId) visit(activeId);
    const bookmarked = s.questions.filter(q => state.bookmarks[q.id]);
    const latestBookmark = bookmarked.slice().sort((a, b) => state.bookmarks[b.id] - state.bookmarks[a.id])[0];
    main.innerHTML = `<div class="page-heading"><div><p class="eyebrow">02 / RECALL & UNDERSTAND</p><h2>${escape(s.title)}</h2><p class="page-description">Choose an answer, then check it to see the explanation. Bookmark your place or flag a fact for revision.</p></div><button class="button secondary small" data-action="subject-notes">Read this subject’s notes ↗</button></div><div class="practice-controls"><label class="field">Practice set<select id="practice-filter"><option value="all">All ${s.questions.length} questions</option><option value="bookmarked" ${practiceFilter === "bookmarked" ? "selected" : ""}>Bookmarked questions</option><option value="review" ${practiceFilter === "review" ? "selected" : ""}>Flagged or answered incorrectly</option><option value="unseen" ${practiceFilter === "unseen" ? "selected" : ""}>Not checked yet</option></select></label><form class="jump-form" id="jump-form"><label class="field" for="jump-number">Question number<input id="jump-number" type="number" inputmode="numeric" min="1" max="${s.questions.length}" value="${activeId ? questionMap.get(activeId).number : 1}" required aria-label="Question number in ${escape(s.title)}"></label><button class="button secondary small" type="submit">Go →</button></form></div><div class="practice-status"><span><strong>${totalChecked(s)} / ${s.questions.length}</strong> questions checked · ${bookmarked.length} bookmarked</span>${latestBookmark ? `<button class="button ghost small" data-open-question="${latestBookmark.id}">Jump to bookmark · Q${questionMap.get(latestBookmark.id).number} ↗</button>` : ""}</div><div id="question-host"></div>`;
    renderQuestion();
    renderShell();
  }
  function renderQuestion() {
    const ids = queue();
    const q = questionMap.get(activeId);
    const host = document.getElementById("question-host");
    if (!q || !ids.length) {
      host.innerHTML = `<div class="empty"><h3>${practiceFilter === "bookmarked" ? "No bookmarks in this subject yet" : practiceFilter === "review" ? "Your revision set is clear" : "No questions in this set"}</h3><p>${practiceFilter === "bookmarked" ? "Use Bookmark on any question. It will appear here and in the Bookmarks tab." : "Choose all questions to keep learning, or pick another subject."}</p><button class="button primary small" data-action="all-questions">Show all questions →</button></div>`;
      return;
    }
    const entry = state.answers[q.id] || {};
    const checked = !recallMode && entry.checked === true;
    const selected = recallMode ? recallChoice : entry.selected;
    const correct = checked && selected === q.answer;
    const index = ids.indexOf(q.id);
    host.innerHTML = `<article class="question-card" aria-label="Question ${q.number}" data-question-id="${q.id}"><div class="question-meta"><span>QUESTION ${q.number} OF ${selectedSection().questions.length} · ${escape(q.topic)}</span><div class="question-actions"><button class="toggle" id="bookmark-question" aria-pressed="${!!state.bookmarks[q.id]}" data-toggle-bookmark="${q.id}">${bookmarkIcon}${state.bookmarks[q.id] ? "Bookmarked" : "Bookmark"}</button><button class="toggle" id="flag-question" aria-pressed="${!!state.flagged[q.id]}" data-toggle-flag="${q.id}">${flagIcon}${state.flagged[q.id] ? "Flagged for revision" : "Flag for revision"}</button></div></div><fieldset class="question-fieldset"><legend>${escape(q.question)}</legend><div class="options">${q.options.map((option, i) => `<label class="option ${checked ? "checked" : ""} ${checked && i === q.answer ? "correct" : ""} ${checked && i === selected && !correct ? "incorrect" : ""}"><input type="radio" name="answer" value="${i}" ${selected === i ? "checked" : ""} ${checked ? "disabled" : ""}><span class="option-letter">${"ABCD"[i]}.</span><span class="option-text">${escape(option)}</span>${checked && i === q.answer ? '<span class="option-note">Correct answer</span>' : checked && i === selected ? '<span class="option-note">Your answer</span>' : ""}</label>`).join("")}</div></fieldset>${checked ? `<div class="feedback ${correct ? "" : "wrong"}" id="answer-feedback" role="region" aria-label="Answer explanation"><h3>${correct ? "Right — well remembered." : "Wrong — here’s the fact to remember."}</h3><p class="answer-line"><strong>Correct answer: ${escape(q.options[q.answer])}</strong></p><p>${escape(q.explanation)}</p><details><summary>Read the supporting sources</summary><ul class="source-list">${sourceLinks(q.sourceIds)}</ul></details><p class="recall-prompt">Say the fact once without looking. If it needs another visit, flag it for revision.</p><button class="link-button" id="recall-again">Hide explanation & practise again</button></div>` : `<div class="check-line"><button class="button primary" id="check-answer" ${validOption(selected) ? "" : "disabled"}>Check answer <span aria-hidden="true">↗</span></button><p>${recallMode ? "Your previous checked result stays saved until you check again." : "The explanation appears after you check."}</p></div>`}<div class="question-navigation"><button class="button secondary" id="previous-question" ${index <= 0 ? "disabled" : ""}>← Previous</button><span>${index + 1} / ${ids.length}${practiceFilter !== "all" ? " in this set" : ""}</span><button class="button ${index < ids.length - 1 ? "primary" : "secondary"}" id="next-question" ${index >= ids.length - 1 ? "disabled" : ""}>Next question →</button></div>${index === ids.length - 1 ? '<p class="page-description">You have reached the end of this set. Choose another subject or open your bookmarks to revisit a fact.</p>' : ""}</article>`;
  }
  function openQuestion(id) {
    const q = questionMap.get(id);
    if (!q) return;
    view = "practice"; subject = q.sectionId; practiceFilter = "all"; queueSnapshot = null; recallMode = false; activeId = id;
    visit(id); render(); focusWorkspace();
  }
  function toggle(field, id) {
    if (state[field][id]) delete state[field][id]; else state[field][id] = Date.now();
    save();
    renderShell();
    if (view === "practice") {
      const qid = activeId;
      const keepRecall = recallMode;
      renderPractice();
      recallMode = keepRecall;
      activeId = qid;
      renderQuestion();
      document.getElementById(field === "bookmarks" ? "bookmark-question" : "flag-question")?.focus({ preventScroll: true });
    } else renderBookmarks();
    announce(`${field === "bookmarks" ? "Bookmark" : "Revision flag"} ${state[field][id] ? "saved" : "removed"}.`);
  }
  function renderBookmarks() {
    const chosen = subject === "all" ? sections : [sectionMap.get(subject)];
    const field = bookmarkFilter === "flagged" ? "flagged" : "bookmarks";
    let count = 0;
    const body = chosen.map(s => {
      const rows = s.questions.filter(q => state[field][q.id]);
      count += rows.length;
      if (!rows.length) return "";
      return `<section class="bookmark-group"><h3>${escape(s.title)} <span class="muted">· ${rows.length}</span></h3>${rows.map(q => `<div class="bookmark-row"><div><p class="eyebrow">QUESTION ${questionMap.get(q.id).number} · ${escape(q.topic)}</p><p>${escape(q.question)}</p></div><div class="row-actions"><button class="button primary small" data-open-question="${q.id}">Jump to Q${questionMap.get(q.id).number} →</button><button class="link-button" data-remove-saved="${q.id}" data-field="${field}">Remove ${field === "flagged" ? "flag" : "bookmark"}</button></div></div>`).join("")}</section>`;
    }).join("");
    main.innerHTML = `<div class="page-heading"><div><p class="eyebrow">YOUR SAVED PLACES</p><h2>Pick up a fact tomorrow.</h2><p class="page-description">Every bookmark opens the exact question in its subject. Your answer and explanation stay saved too.</p></div></div><div class="bookmark-tools"><label class="field">Show<select id="bookmark-filter"><option value="all">Bookmarked questions</option><option value="flagged" ${bookmarkFilter === "flagged" ? "selected" : ""}>Flagged for revision</option></select></label><span class="muted">${count} saved ${count === 1 ? "question" : "questions"}${subject === "all" ? " across all subjects" : " in this subject"}</span></div>${body || '<div class="empty"><h3>Save a place as you learn.</h3><p>Open any question and use Bookmark or Flag for revision. Your saved questions will appear here, ready to jump to.</p><button class="button primary small" data-action="practise">Choose a question →</button></div>'}`;
  }
  document.addEventListener("click", event => {
    const button = event.target.closest("button");
    if (!button) return;
    if (button.dataset.view) return go(button.dataset.view);
    if (button.dataset.subject) return go(view, button.dataset.subject, false);
    if (button.dataset.openQuestion) return openQuestion(button.dataset.openQuestion);
    if (button.dataset.nextNotes) return go("notes", button.dataset.nextNotes);
    if (button.dataset.toggleBookmark) return toggle("bookmarks", button.dataset.toggleBookmark);
    if (button.dataset.toggleFlag) return toggle("flagged", button.dataset.toggleFlag);
    if (button.dataset.removeSaved) return toggle(button.dataset.field, button.dataset.removeSaved);
    if (button.id === "resume-global") return openQuestion(button.dataset.qid);
    if (button.dataset.action === "read") return go("notes", "all");
    if (button.dataset.action === "practise") return go("practice");
    if (button.dataset.action === "subject-notes") return go("notes", subject);
    if (button.dataset.action === "all-questions") { practiceFilter = "all"; queueSnapshot = null; activeId = null; recallMode = false; return renderPractice(); }
    if (button.dataset.markTopic) {
      const s = sectionMap.get(button.dataset.markTopic);
      const visible = new Set([...document.querySelectorAll("[data-note]")].map(n => n.dataset.note));
      const notes = s.notes.filter(n => n.topic === button.dataset.topic && visible.has(n.id));
      notes.forEach(n => { state.notesRead[n.id] = Date.now(); }); save(); renderShell(); renderNotesBody(); announce(`${notes.length} visible notes marked read.`); return;
    }
    if (button.id === "check-answer") {
      const q = questionMap.get(activeId);
      const selected = recallMode ? recallChoice : state.answers[activeId]?.selected;
      if (!validOption(selected)) return;
      const now = Date.now();
      state.answers[activeId] = { selected, checked: true, checkedAt: now, lastCorrect: selected === q.answer, updatedAt: now };
      recallMode = false; save(); renderPractice();
      document.getElementById("answer-feedback").scrollIntoView({ block: "nearest" });
      announce(`${selected === q.answer ? "Right." : "Incorrect."} Correct answer: ${q.options[q.answer]}. ${q.explanation}`); return;
    }
    if (button.id === "recall-again") { recallMode = true; recallChoice = null; renderQuestion(); main.querySelector('input[name="answer"]')?.focus(); return; }
    if (["previous-question", "next-question"].includes(button.id)) {
      const ids = queue(); const index = ids.indexOf(activeId); const next = index + (button.id === "next-question" ? 1 : -1);
      if (next >= 0 && next < ids.length) { recallMode = false; visit(ids[next]); renderPractice(); document.querySelector(".question-card").scrollIntoView({ block: "start" }); announce(`Question ${questionMap.get(activeId).number}.`); } return;
    }
    if (button.id === "export-progress") {
      const blob = new Blob([JSON.stringify({ app: "psc-general-studies-reading", exportedAt: new Date().toISOString(), contentVersion: DATA.version, progress: state }, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob); const link = document.createElement("a"); link.href = url; link.download = `general-studies-progress-${new Date().toISOString().slice(0, 10)}.json`; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
      document.getElementById("backup-message").textContent = "Progress backup downloaded. It contains reading ticks, answers, bookmarks and saved places.";
    }
  });
  document.addEventListener("input", event => {
    if (event.target.id === "note-search") { noteSearch = event.target.value; renderNotesBody(); }
  });
  document.addEventListener("change", async event => {
    const target = event.target;
    if (target.dataset.note) { if (target.checked) state.notesRead[target.dataset.note] = Date.now(); else delete state.notesRead[target.dataset.note]; target.closest("li").classList.toggle("read", target.checked); save(); renderShell(); const section = target.closest(".note-section"); const s = sectionMap.get(noteMap.get(target.dataset.note).sectionId); section.querySelector(".section-line>span").textContent = `${totalRead(s)} / ${s.notes.length} notes read`; }
    if (target.id === "note-topic") { noteTopic = target.value; renderNotesBody(); }
    if (target.id === "practice-filter") { practiceFilter = target.value; queueSnapshot = null; activeId = null; recallMode = false; renderPractice(); }
    if (target.id === "bookmark-filter") { bookmarkFilter = target.value; renderBookmarks(); }
    if (target.name === "answer") {
      const selected = Number(target.value);
      if (recallMode) recallChoice = selected;
      else { const old = state.answers[activeId] || {}; if (old.checked) return; state.answers[activeId] = { ...old, selected, checked: false, updatedAt: Date.now() }; save(); }
      document.getElementById("check-answer").disabled = false;
    }
    if (target.id === "import-progress" && target.files[0]) {
      const message = document.getElementById("backup-message");
      try {
        if (target.files[0].size > 5000000) throw new Error("This file is too large for a progress backup.");
        const imported = JSON.parse(await target.files[0].text());
        if (imported.app !== "psc-general-studies-reading") throw new Error("Choose a General Studies progress backup.");
        const incoming = sanitise(imported.progress);
        for (const field of ["notesRead", "bookmarks", "flagged"]) for (const [id, when] of Object.entries(incoming[field])) state[field][id] = Math.max(state[field][id] || 0, when);
        for (const [id, answer] of Object.entries(incoming.answers)) if (!state.answers[id] || answer.updatedAt > (state.answers[id].updatedAt || 0)) state.answers[id] = answer;
        if (incoming.updatedAt > state.updatedAt) { Object.assign(state.positions, incoming.positions); if (incoming.lastQuestion) state.lastQuestion = incoming.lastQuestion; }
        save(); render(); message.textContent = "Backup restored. Saved bookmarks and reading ticks were merged; newer answers were kept."; announce("Progress backup restored.");
      } catch (error) { message.textContent = `Could not restore: ${error.message}`; }
      target.value = "";
    }
  });
  document.addEventListener("submit", event => {
    if (event.target.id !== "jump-form") return;
    event.preventDefault();
    const number = Number(document.getElementById("jump-number").value);
    if (Number.isInteger(number) && number >= 1 && number <= selectedSection().questions.length) openQuestion(selectedSection().questions[number - 1].id);
  });
  render();
})();
