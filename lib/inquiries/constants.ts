/**
 * Identifier of the privacy notice version a submission accepted.
 *
 * Bumped to 2026-08-26 because the notice changed materially again: a
 * corporate block is now a purchase rather than a request, so the roster of
 * named participants is part of a purchase record and follows its five-year
 * fiscal retention, and every purchase can carry an optional referrer the
 * buyer types in. 2026-08-25 introduced that roster on the inquiry form;
 * 2026-08-24 added on-site payments, the fiscal-data category and the
 * five-year retention for purchase records. The version records WHICH text the
 * person accepted; the privacy owner's approval of that text is a separate,
 * still-pending gate tracked in docs/DEPLOYMENT.md.
 */
export const INQUIRY_CONSENT_VERSION = "2026-08-26";
