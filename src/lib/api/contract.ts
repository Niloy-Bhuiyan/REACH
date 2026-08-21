/**
 * The eight freshness / Delta rules from the Final Handoff Index §11, as named constants.
 *
 * The design behaves as if these are true, so a different answer is not a configuration change —
 * it changes what a screen is allowed to say. They live here so a signed-off amendment is one
 * edit rather than a search across the codebase.
 */

/** Rule 01 — a run is triggered on demand when Discover is opened this long after the last one. */
export const REVERIFY_ON_OPEN_AFTER_HOURS = 6;

/** Rule 02 — ≤ 24 h reads normally in stone. */
export const FRESHNESS_STALE_HOURS = 24;

/** Rule 02 — 24–72 h renders apricot and the word `stale`. */
export const FRESHNESS_EXPIRED_HOURS = 72;

/** Rule 03 — a posting that vanishes from source is retained this long, labelled, then dropped. */
export const DELIST_RETENTION_HOURS = 48;

/** Rule 08 — evidence-source sync age. A different clock from posting freshness. */
export const SOURCE_STALE_DAYS = 14;

/** Rule 02 — postings past the expired band are shown but excluded from every count. */
export const EXPIRED_POSTINGS_COUNT = false;

/** Rules 04 & 05 — the client renders a stored Delta and never derives one. */
export const DELTA_IS_SERVER_COMPUTED = true;
