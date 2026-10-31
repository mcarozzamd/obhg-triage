// Last-reviewed dates for every card and flow diagram (quarterly review).
// To record a review, change that item's date below. DEFAULT applies to any item not listed.
// Display only: shown as small muted text at the bottom of each card and tree. No clinical content here.
self.REVIEW = {
  DEFAULT: 'Oct 2026',
  items: {
    'FORMULARY': 'Oct 2026',
    'ANT-10': 'Oct 2026',
    'LND-01': 'Oct 2026',
    'LND-02': 'Oct 2026',
    'LND-03': 'Oct 2026',
    'LND-04': 'Oct 2026',
    'LND-05': 'Oct 2026',
    'LND-06': 'Oct 2026',
    'LND-07': 'Oct 2026',
    'LND-08': 'Oct 2026',
    'ANT-01': 'Oct 2026',
    'ANT-02': 'Oct 2026',
    'ANT-03': 'Oct 2026',
    'ANT-04': 'Oct 2026',
    'ANT-05': 'Oct 2026',
    'ANT-06': 'Oct 2026',
    'ANT-07': 'Oct 2026',
    'ANT-08': 'Oct 2026',
    'ANT-09': 'Oct 2026',
    'GYN-01': 'Oct 2026',
    'GYN-02': 'Oct 2026',
    'PP-01': 'Oct 2026',
    'PP-02': 'Oct 2026',
    'SYS-01': 'Oct 2026',
    'SYS-02': 'Oct 2026',
    'GYNB-FORMULARY': 'Oct 2026',
    'GYNB-01': 'Oct 2026',
    'GYNB-02': 'Oct 2026',
    'GYNB-03': 'Oct 2026',
    'GYNB-04': 'Oct 2026',
    'GYNB-05': 'Oct 2026',
    'GYNB-06': 'Oct 2026',
    'GYNB-07': 'Oct 2026',
    'GYNB-08': 'Oct 2026',
    'GYNB-09': 'Oct 2026',
    'GYNB-10': 'Oct 2026',
    'SYS-02-EXP': 'Oct 2026',
    'FD-ANT-04': 'Oct 2026',
    'FD-PP-01': 'Oct 2026',
    'FD-LND-01': 'Oct 2026',
    'FD-SYS-03': 'Oct 2026',
    'FD-SYS-02': 'Oct 2026',
    'FD-LND-04': 'Oct 2026',
    'FD-GYN-01': 'Oct 2026',
    'FD-GYNB-02': 'Oct 2026',
    'FD-GYNB-04': 'Oct 2026',
    'FD-LND-06': 'Oct 2026',
    'FD-ANT-01': 'Oct 2026',
    'FD-ANT-07': 'Oct 2026',
    'FD-ED-OB': 'Oct 2026',
    'FD-ANT-02': 'Oct 2026',
    'FD-LND-05': 'Oct 2026',
    'FD-LND-02': 'Oct 2026',
    'FD-ANT-08': 'Oct 2026'
  }
};
(function () {
  'use strict';
  const C = self.CONTENT, R = self.REVIEW;
  if (!C || !C.items) return;
  for (const it of C.items) it.lastReviewed = (R.items && R.items[it.id]) || it.lastReviewed || R.DEFAULT;
})();
if (typeof module !== 'undefined') module.exports = self.REVIEW;
