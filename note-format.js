/* Content-aware presentation only: note wording, IDs and saved reading state stay unchanged. */
(() => {
  "use strict";
  const escape = value => String(value).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const months = "January|February|March|April|May|June|July|August|September|October|November|December";
  const answerIndexes = new Map();
  const cache = new Map();
  const placeLabels = /^(?:capital|continent|outlet|location|district headquarters|regional association|source region or setting|location or route|drainage destination|tributary|connected waters|opposite shores|range or highland system)$/i;
  const detailLabels = /^(?:identifying feature|literary form|significance|heritage significance|institutional or structural identity|use or identifying property|known contribution|principal function|role|growing conditions|main season|deficiency effect)$/i;
  const blandSubject = /^(?:it|this|that|these|those|the citation|the dated account|the report|the source|the match|the event|the mission|the table|the term|the concept|a person|the year|a country)$/i;
  const wordCount = value => value.trim().split(/\s+/).length;
  function answerIndex(sectionId) {
    if (answerIndexes.has(sectionId)) return answerIndexes.get(sectionId);
    const index = new Map();
    const section = window.GS_DATA?.sections?.find(s => s.id === sectionId);
    (section?.questions || []).forEach(q => {
      if (!index.has(q.explanation)) index.set(q.explanation, []);
      const answer = q.options[q.answer];
      if (typeof answer === "string" && !index.get(q.explanation).includes(answer)) index.get(q.explanation).push(answer);
    });
    answerIndexes.set(sectionId, index);
    return index;
  }
  function render(note, sectionId) {
    const text = String(note?.text ?? "");
    if (!text) return "";
    const key = `${sectionId || ""}\u0000${text}\u0000${note.topic || ""}`;
    if (cache.has(key)) return cache.get(key);
    const candidates = [];
    const add = (start, end, kind, priority = 50) => {
      if (!Number.isInteger(start) || !Number.isInteger(end) || start < 0 || end <= start || end > text.length) return;
      const value = text.slice(start, end);
      if (!value.trim() || /^\W+$/.test(value)) return;
      candidates.push({ start, end, kind, priority });
    };
    const capture = (regex, group, kind, priority = 50) => {
      const match = regex.exec(text);
      if (!match || !match[group]) return;
      const offset = match[0].indexOf(match[group]);
      add(match.index + offset, match.index + offset + match[group].length, kind, priority);
    };
    const each = (regex, kind, priority = 50) => {
      for (const match of text.matchAll(regex)) add(match.index, match.index + match[0].length, kind, priority);
    };

    // Dates remain complete spans; the priority prevents a bare year splitting a full date.
    each(new RegExp(`\\b(?:\\d{1,2}\\s+)?(?:${months})\\s+\\d{4}\\b`, "g"), "date", 110);
    each(/\b(?:[12]\d{3})(?:[–-](?:[12]\d{3}|\d{2}))?(?:\s*(?:BCE|CE|BC|AD))?\b/g, "date", 105);
    each(/\b(?:Article\s+\d+[A-Z]?|Part\s+[IVXLCDM]+[A-Z]?)\b/g, "date", 104);
    each(/\b\d+(?:\.\d+)?(?:[–-]\d+(?:\.\d+)?)?\s+(?:million|billion|lakh|crore|per cent|percent|km|kilometres?|metres?|hectares?|years?|days?|hours?|minutes?|seconds?|medals?|sites?|sports|payloads?|experiments?|wickets?|runs?|teams?|countries|states|tonnes?)\b/gi, "date", 92);
    each(/\b(?:one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen|fifteen|twenty(?:[ -](?:one|two|three|four|five|six|seven|eight|nine))?|thirty)\s+(?:gold medals?|silver medals?|bronze medals?|medals?|sites?|sports|years?|days?|payloads?|experiments?|wickets?|runs?|teams?|countries)\b/gi, "date", 90);

    // The concise table notes explicitly name an entity, then its factual attributes.
    const colon = text.indexOf(":");
    const isWorkTopic = /(?:texts, authors|bengali literature)/i.test(note.topic || "");
    if (colon > 0 && colon < 85 && wordCount(text.slice(0, colon)) <= 12 && !/^\s*(?:Speed|Energy|Power|Newton|Each half-life)/i.test(text)) {
      const prefix = text.slice(0, colon);
      add(0, colon, isWorkTopic ? "work" : "key", 100);
      const tail = text.slice(colon + 1);
      const attrs = /(?:^|;\s*)([^;—]+?)\s+—\s+([^;]+)/g;
      let match;
      while ((match = attrs.exec(tail))) {
        const label = match[1].trim();
        const raw = match[2];
        const value = raw.replace(/[.\s]+$/, "");
        const start = colon + 1 + match.index + match[0].lastIndexOf(raw);
        if (placeLabels.test(label) && wordCount(value) <= 10 && value.length <= 90) add(start, start + value.length, "place", 88);
        else if (detailLabels.test(label) && wordCount(value) <= 9 && value.length <= 80) add(start, start + value.length, "detail", 69);
        else if (!detailLabels.test(label) && wordCount(value) <= 9 && value.length <= 75) add(start, start + value.length, /^(?:year|atomic number|number of protons)/i.test(label) ? "date" : "fact", 86);
      }
      // Definition-style notes have no attribute label: mark a short useful definition only.
      if (!tail.includes("—")) {
        const value = tail.trim().replace(/\.$/, "");
        if (wordCount(value) <= 9 && value.length <= 80 && value.length < text.length * .65) {
          const start = text.indexOf(value, colon + 1);
          add(start, start + value.length, "detail", 62);
        }
      }
    } else if (isWorkTopic) {
      capture(/^(.+?)\s+is associated with\b/, 1, "work", 100);
      capture(/\bis associated with\s+([^;]+)(?=;)/, 1, "fact", 88);
      capture(/\bits principal subject is\s+([^.;]+)(?=[.;]|$)/, 1, "detail", 60);
    }

    // Named concepts and constitutional terminology are more useful than introductory boilerplate.
    capture(/^In (?:(?:Indian historical terminology|Indian public affairs|banking and finance|public finance and trade),\s+|economics,\s+the term\s+)(.+?)\s+(?:means|refers to)\b/, 1, "key", 100);
    capture(/^The historical concept\s+(.+?)\s+refers to\b/, 1, "key", 100);
    capture(/^(.+?)\s+belonged to\b/, 1, "key", 100);
    capture(/\bbelonged to the\s+(.+?)\s+ruling house\b/, 1, "fact", 88);
    capture(/^(.+?)\s+is located at\b/, 1, "key", 100);
    capture(/\bis located at\s+(.+?)(?=\s+and\b|[.;]|$)/, 1, "place", 88);
    if (/freedom movement chronology|monuments and heritage/i.test(note.topic || "")) capture(/\bis associated with\s+([A-Z][\w'’ -]+)(?=[.;]|$)/, 1, "place", 75);
    capture(/\b(?:held|hosted|located|based|situated) in\s+([A-Z][\w'’ -]+?)(?=\s+(?:and|in|on|during|at|after|before)\b|[.;]|$)/, 1, "place", 82);
    capture(/^At the Paris 2024 Paralympics,\s+(.+?)\s+won\b/, 1, "key", 100);
    capture(/^(.+?)\s+won\s+(?:gold|silver|bronze)\b/, 1, "key", 100);
    capture(/^The\s+(.+?)\s+occurred in\b/, 1, "key", 100);
    capture(/^The\s+(.+?)\s+dates to\b/, 1, "key", 100);

    // Match the actual correct answer only when this exact note is the question's explanation.
    // This avoids styling arbitrary place/person names merely because they resemble a keyword.
    for (const answer of answerIndex(sectionId).get(text) || []) {
      if (answer.length < 3 || answer.length > 75 || wordCount(answer) > 7) continue;
      const at = text.toLocaleLowerCase("en-GB").indexOf(answer.toLocaleLowerCase("en-GB"));
      if (at < 0) continue;
      const before = text[at - 1], after = text[at + answer.length];
      if ((before && /[\p{L}\p{N}]/u.test(before)) || (after && /[\p{L}\p{N}]/u.test(after))) continue;
      add(at, at + answer.length, /^\d/.test(answer) ? "date" : "fact", 84);
    }

    // Ordinary science/event sentences: identify the actual short subject before its verb.
    const subject = /^(?:(?:The|An|A)\s+)?(.+?)\s+(?:is|are|was|were|has|have|uses?|contains?|produces?|provides?|carries|converts?|measures?|controls?|helps?|permits?|allows?|prevents?|forms?|protects?|releases?|requires?|absorbs?|stores?|connects?|conducts?|transports?|reduces?|increases?|decreases?|represents?|recognised|reached|demonstrated|became|received|hosted|won|alter|precedes|concluded|completed|operates?|coordinates|supports?|achieved|referred|lay|criticised|sought|provoked|provided|combined|extended|used|introduced|describes?|demonstrates?|activates?|emits?|arises?|opens?|depends?|involves?|triggers?|follows?|explains?|defines?|occurs?|reflects?|transmits?|moves?|bends?|changes?|transfers?|obeys?|results?)\b/i.exec(text);
    if (subject && subject[1].length <= 65 && wordCount(subject[1]) <= 7 && !blandSubject.test(subject[0].slice(0, subject[0].lastIndexOf(" "))) && !/^In\s/i.test(subject[1])) {
      const start = subject[0].indexOf(subject[1]);
      add(start, start + subject[1].length, "key", 97);
    }
    // Short science/result relationships receive italic emphasis without recolouring whole lines.
    capture(/\b(?:refers to|means)\s+([^.;]+)(?=[.;]|$)/, 1, "detail", 55);
    capture(/\b(?:gives|equals)\s+([A-Z]\s*=\s*[^.;]+)(?=[.;]|$)/, 1, "fact", 80);

    const selected = [];
    const maxCharacters = Math.max(18, Math.min(155, Math.floor(text.length * .64)));
    let styledCharacters = 0;
    const sorted = candidates.sort((a, b) => b.priority - a.priority || (b.end - b.start) - (a.end - a.start) || a.start - b.start);
    for (const item of sorted) {
      if (selected.length >= 3) break;
      if (item.end - item.start > 110 || wordCount(text.slice(item.start, item.end)) > 12) continue;
      if (selected.some(s => item.start < s.end && item.end > s.start)) continue;
      if (styledCharacters + item.end - item.start > maxCharacters) continue;
      // A long italic definition is harder to scan; reserve italics for short phrases/titles.
      if (item.kind === "detail" && wordCount(text.slice(item.start, item.end)) > 8) continue;
      selected.push(item);
      styledCharacters += item.end - item.start;
    }
    selected.sort((a, b) => a.start - b.start);
    let html = "", offset = 0;
    for (const item of selected) {
      html += escape(text.slice(offset, item.start));
      const tag = item.kind === "work" || item.kind === "detail" ? "em" : "strong";
      html += `<${tag} class="note-${item.kind}">${escape(text.slice(item.start, item.end))}</${tag}>`;
      offset = item.end;
    }
    html += escape(text.slice(offset));
    cache.set(key, html);
    return html;
  }
  window.GS_NOTE_FORMATTER = Object.freeze({ render });
})();
