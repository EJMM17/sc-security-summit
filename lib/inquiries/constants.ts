/**
 * Identifier of the privacy notice version a submission accepted.
 *
 * Bumped to 2026-08-25 because the notice changed materially again: a
 * corporate request now carries the names of the people who will attend, which
 * is personal data about third parties the requester provides on their behalf.
 * 2026-08-24 added on-site payments, the fiscal-data category and the
 * five-year retention for purchase records. The version records WHICH text the
 * person accepted; the privacy owner's approval of that text is a separate,
 * still-pending gate tracked in docs/DEPLOYMENT.md.
 */
export const INQUIRY_CONSENT_VERSION = "2026-08-25";
