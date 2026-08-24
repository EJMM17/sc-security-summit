/**
 * Identifier of the privacy notice version a submission accepted.
 *
 * Bumped to 2026-08-24 because the notice changed materially: on-site
 * payments, a new fiscal-data category and a five-year retention period for
 * purchase records. The version records WHICH text the person accepted; the
 * privacy owner's approval of that text is a separate, still-pending gate
 * tracked in docs/DEPLOYMENT.md.
 */
export const INQUIRY_CONSENT_VERSION = "2026-08-24";
