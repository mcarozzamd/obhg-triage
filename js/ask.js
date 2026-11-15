/* Ask a question (Clinician) + Suggest a card (Clinician and Nurse). 15 Nov 2026.
 * The app runs no AI. Buttons only open an outside site in a new tab, and only when the device is online.
 * Grok accepts a prefilled question by URL (https://grok.com/?q=..., Grok then asks the user to confirm Send).
 * OpenEvidence has no working prefill URL, so its button copies the question and opens the homepage.
 * Nothing typed here is stored. Suggestions go by the user's own mail app (mailto), sent only if they choose. */
(function (root) {
  'use strict';
  const SUGGEST_TO = 'mcarozza@obhg.com';
  const SUGGEST_SUBJECT = 'Triage app card suggestion';
  const OFFLINE = 'Needs internet. Use the cards or call the on-call provider.';
  const DISCLAIMER = 'Outside resource, not CSM or OBHG policy.';
  const OE_URL = 'https://www.openevidence.com/';
  const SUGGEST_TEXT = {
    en: { link: "Can't find it? Suggest a card", body: 'Suggested card topic (no patient identifiers): ' },
    es: { link: '¿No lo encuentra? Sugiera una tarjeta', body: 'Tema sugerido para una tarjeta (sin datos que identifiquen a la paciente): ' }
  };
  const clean = q => String(q == null ? '' : q).replace(/\s+/g, ' ').trim().slice(0, 500);
  const grokURL = q => 'https://grok.com/' + (clean(q) ? '?q=' + encodeURIComponent(clean(q)) : '');
  const openEvidenceURL = () => OE_URL;
  function suggestMailto(lang, topic) {
    const t = SUGGEST_TEXT[lang] || SUGGEST_TEXT.en;
    return 'mailto:' + SUGGEST_TO + '?subject=' + encodeURIComponent(SUGGEST_SUBJECT) + '&body=' + encodeURIComponent(t.body + clean(topic));
  }
  const api = Object.freeze({ SUGGEST_TO, SUGGEST_SUBJECT, OFFLINE, DISCLAIMER, SUGGEST_TEXT, grokURL, openEvidenceURL, suggestMailto, clean });
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.AskLinks = api;

  // ---------- clinician controller (browser only) ----------
  const doc = root.document; if (!doc || !doc.getElementById || !doc.getElementById('ask-box') || typeof root.addEventListener !== 'function' || !root.navigator) return;
  const $ = id => doc.getElementById(id);
  const E = root.TriageEngine;
  const OE_LABEL = 'Ask OpenEvidence (copies question)', GROK_LABEL = 'Ask Grok';
  function status(msg) { $('ask-status').textContent = msg || ''; $('ask-status').hidden = !msg; }
  function online() { return root.navigator.onLine !== false; }
  function syncOnline() {
    const on = online();
    $('ask-oe').disabled = !on; $('ask-grok').disabled = !on;
    $('ask-oe').textContent = on ? OE_LABEL : OFFLINE; $('ask-grok').hidden = !on;
    $('ask-box').classList.toggle('ask-offline', !on); if (!on) status('');
  }
  function check() {
    const q = clean($('ask-q').value);
    const w = E && E.privacyCheck ? E.privacyCheck(q) : [];
    if (w.length) { status('Check for identifiers: ' + w.join(' ') + ' Remove them before asking.'); return null; }
    return q;
  }
  function syncSuggest() { $('ask-suggest').href = suggestMailto('en', $('ask-q').value); }
  $('ask-q').addEventListener('input', () => { status(''); syncSuggest(); });
  $('ask-oe').addEventListener('click', () => {
    if (!online()) return syncOnline();
    const q = check(); if (q === null) return;
    const w = root.open(openEvidenceURL(), '_blank', 'noopener,noreferrer');
    if (!q) { status(w === null ? 'Pop-up blocked. Open openevidence.com in a new tab.' : ''); return; }
    const copy = root.navigator.clipboard && root.navigator.clipboard.writeText ? root.navigator.clipboard.writeText(q).then(() => true, () => false) : Promise.resolve(false);
    copy.then(ok => status(ok ? 'Question copied. Paste it into OpenEvidence.' : 'Copy the question above, then paste it into OpenEvidence.'));
  });
  $('ask-grok').addEventListener('click', () => {
    if (!online()) return syncOnline();
    const q = check(); if (q === null) return;
    root.open(grokURL(q), '_blank', 'noopener,noreferrer');
    status(q ? 'Grok opens with your question filled in. Review it, then tap Send.' : '');
  });
  root.addEventListener('online', syncOnline); root.addEventListener('offline', syncOnline);
  syncOnline(); syncSuggest();
})(typeof self !== 'undefined' ? self : this);
