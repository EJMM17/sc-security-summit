"use client";

import type { FormEvent, ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  Building2,
  Check,
  ClipboardPaste,
  Mail,
  Minus,
  Phone,
  Plus,
  ReceiptText,
  Sparkles,
  TicketPercent,
  UserRound,
  UsersRound,
  X,
} from "lucide-react";
import {
  createTicketCheckout,
  validateDiscountCode,
} from "@/app/actions/checkout";
import AttributionCapture from "@/components/AttributionCapture";
import EmptyAttributionFields from "@/components/EmptyAttributionFields";
import { CONTENT } from "@/lib/content";
import { createSubmissionId } from "@/lib/inquiries/client-submit";
import { INQUIRY_CONSENT_VERSION } from "@/lib/inquiries/constants";
import type { Language } from "@/lib/language";
import {
  CORPORATE_MIN_SEATS,
  CORPORATE_SEAT_CHOICE_MAX,
  CORPORATE_SEAT_OPTIONS,
  CORPORATE_SEAT_PRESETS,
  CORPORATE_TIER_ID,
  TICKET_TIERS,
  TICKET_TIER_IDS,
  VOLUME_DISCOUNT_MIN_QUANTITY,
  quoteOrder,
  quoteVolumePricing,
  tierEarnsVolumeDiscount,
  tierUnitPriceCents,
  type TicketTierId,
} from "@/lib/payments/catalog";
import {
  DISCOUNT_CODE_MAX_LENGTH,
  formatDiscountPercentage,
  normalizeDiscountCode,
  percentageDiscountPreview,
} from "@/lib/payments/coupons";
import type {
  CheckoutFailureReason,
  DiscountCodeRejection,
} from "@/lib/payments/result";
import { normalizeRfc, validateRfc } from "@/lib/payments/rfc";
import {
  cfdiUsesForPersonType,
  regimesForPersonType,
  CFDI_USES,
  TAX_REGIMES,
  type TaxPersonType,
} from "@/lib/payments/sat-catalogs";
import { formatMxn } from "@/lib/payments/tax";

type CheckoutStatus =
  | { kind: "idle" }
  | { kind: "redirecting" }
  | { kind: "error"; reason: CheckoutFailureReason };

/**
 * The optional discount code, as the form sees it.
 *
 * `applied` holds only the code and the rate the server returned: enough to
 * show the buyer the new total and to hand the code back at submit. The
 * amounts are never trusted from here — they are re-derived from the catalog
 * price on screen, and re-derived again server side before anything is
 * charged.
 */
type DiscountStatus =
  | { kind: "idle" }
  | { kind: "checking" }
  | { kind: "applied" }
  | { kind: "rejected"; reason: DiscountCodeRejection | "empty" };

const MERCADOPAGO_HOST = /^(www\.)?mercadopago\.com(\.[a-z]{2})?$/;

function isSafeCheckoutUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && MERCADOPAGO_HOST.test(url.hostname);
  } catch {
    return false;
  }
}

export type CheckoutVariant = "individual" | "corporate";

export default function TicketCheckoutForm({
  language,
  previewDisabled = false,
  initialTier = "plus",
  variant = "individual",
}: {
  language: Language;
  previewDisabled?: boolean;
  /** Preselected by the pricing section so the visitor lands on their plan. */
  initialTier?: TicketTierId;
  /**
   * A corporate block is the same purchase with a different shape: one tier,
   * a seat picker and a named roster. It shares this component so the buyer
   * data, the CFDI block and the MercadoPago redirect can never drift apart
   * between the two ways of buying.
   */
  variant?: CheckoutVariant;
}) {
  const isCorporate = variant === "corporate";
  const copy = CONTENT[language].checkout;
  const ui = CONTENT[language].ui;
  const pricing = CONTENT[language].pricing;

  const [status, setStatus] = useState<CheckoutStatus>({ kind: "idle" });
  const [isSending, setIsSending] = useState(false);
  const [submissionId, setSubmissionId] = useState("");
  const [tier, setTier] = useState<TicketTierId>(initialTier);
  const [quantity, setQuantity] = useState(
    isCorporate ? CORPORATE_MIN_SEATS : 1,
  );
  // The roster is controlled so that changing the number of accesses keeps the
  // names already typed instead of remounting the inputs and losing them.
  const [attendees, setAttendees] = useState<string[]>(() =>
    isCorporate ? Array.from({ length: CORPORATE_MIN_SEATS }, () => "") : [],
  );
  const [bulkNames, setBulkNames] = useState("");
  const [bulkNotice, setBulkNotice] = useState("");
  const [requiresInvoice, setRequiresInvoice] = useState(false);
  const [rfc, setRfc] = useState("");
  const [discountInput, setDiscountInput] = useState("");
  const [discount, setDiscount] = useState<
    { code: string; discountBasisPoints: number } | null
  >(null);
  const [discountStatus, setDiscountStatus] = useState<DiscountStatus>({
    kind: "idle",
  });

  useEffect(() => {
    setSubmissionId(createSubmissionId());
  }, []);

  /**
   * The shape of the order the last attempt sent.
   *
   * The submission id is what makes a retry a replay instead of a second
   * charge, but it only holds while the order is the same one. A buyer whose
   * first attempt persisted a row and then failed at the provider (or was told
   * the block is sold out) will change the seats and press again — with the
   * same id and a different payload that is exactly the `idempotency_conflict`
   * the database is built to reject. Minting a fresh id the moment the priced
   * order changes after an attempt keeps the replay guarantee for a true retry
   * and turns the edited order into the new order it actually is.
   */
  const [attemptedOrderShape, setAttemptedOrderShape] = useState<string | null>(
    null,
  );

  const maxQuantity = isCorporate
    ? CORPORATE_SEAT_CHOICE_MAX
    : TICKET_TIERS[tier].maxQuantity;

  // Clamping here rather than in the submit handler keeps the live summary
  // honest when the buyer switches from a 10-seat tier to the 2-seat student
  // tier without touching the quantity field.
  useEffect(() => {
    setQuantity((current) => Math.min(current, maxQuantity));
  }, [maxQuantity]);

  const orderTier = isCorporate ? CORPORATE_TIER_ID : tier;

  const quote = useMemo(() => {
    try {
      return quoteOrder(orderTier, quantity);
    } catch {
      return null;
    }
  }, [orderTier, quantity]);

  // The same order quoted as the buyer reads it: list price, discount and
  // total. Both ways of buying share the rule, so both show the same lines.
  const volumeQuote = useMemo(() => {
    try {
      return quoteVolumePricing(orderTier, quantity);
    } catch {
      return null;
    }
  }, [orderTier, quantity]);

  /**
   * The applied code re-priced against the quantity currently on screen.
   *
   * It is recomputed rather than remembered so the summary stays honest when
   * the buyer changes the number of accesses after applying a code: the same
   * half-up arithmetic on the same catalog unit price the server will use.
   */
  const discountPreview = useMemo(() => {
    if (!discount || !volumeQuote) return null;
    return percentageDiscountPreview(
      volumeQuote.unitPriceCents,
      volumeQuote.quantity,
      discount.discountBasisPoints,
    );
  }, [discount, volumeQuote]);

  const payableTotalCents = discountPreview?.totalCents ?? quote?.totalCents ?? 0;

  // Only what the server prices and hashes counts as a different order: the
  // tier, the quantity, the roster names and the code that changes the price.
  // Buyer contact details are part of the same purchase, and editing a typo in
  // a phone number must stay a replay.
  const orderShape = useMemo(
    () =>
      JSON.stringify([
        orderTier,
        quantity,
        attendees.map((name) => name.trim().replace(/\s+/g, " ")),
        discount?.code ?? "",
      ]),
    [orderTier, quantity, attendees, discount],
  );

  useEffect(() => {
    if (attemptedOrderShape === null || attemptedOrderShape === orderShape) {
      return;
    }
    setSubmissionId(createSubmissionId());
    setAttemptedOrderShape(null);
    // The error belonged to the order that was just replaced, so it is
    // cleared with it — but never the redirect state, which means the browser
    // is already on its way to MercadoPago, and never the message about a
    // discount code that stopped applying: dropping that code is exactly what
    // replaced the order, so the explanation has to outlive it.
    setStatus((current) =>
      current.kind === "error" && current.reason !== "discount_code_changed"
        ? { kind: "idle" }
        : current,
    );
  }, [attemptedOrderShape, orderShape]);

  const earnsVolumeDiscount = tierEarnsVolumeDiscount(
    isCorporate ? "plus" : tier,
  );
  const missingForDiscount = Math.max(
    VOLUME_DISCOUNT_MIN_QUANTITY - quantity,
    0,
  );
  const discountedUnitPrice = formatMxn(
    tierUnitPriceCents(isCorporate ? "plus" : tier, VOLUME_DISCOUNT_MIN_QUANTITY),
    language,
  );

  /** Announces the discount before it applies and confirms it once it does. */
  const volumeNotice = (() => {
    if (!earnsVolumeDiscount) return null;
    if (missingForDiscount === 0) return copy.volumeApplied;
    const template =
      missingForDiscount === 1 ? copy.volumeProgressOne : copy.volumeProgressMany;
    return template
      .replace("{missing}", String(missingForDiscount))
      .replace("{min}", String(VOLUME_DISCOUNT_MIN_QUANTITY))
      .replace("{price}", discountedUnitPrice);
  })();

  const resizeRoster = (seats: number) => {
    const next = Math.min(
      Math.max(seats, CORPORATE_MIN_SEATS),
      CORPORATE_SEAT_CHOICE_MAX,
    );
    setQuantity(next);
    setAttendees((current) =>
      Array.from({ length: next }, (_, index) => current[index] ?? ""),
    );
  };

  // Counted against the seats actually being bought, so the bar can never
  // report more names than the block has or divide by an empty roster.
  const filledAttendees = attendees
    .slice(0, quantity)
    .filter((name) => name.trim() !== "").length;
  const rosterProgress =
    quantity > 0 ? Math.round((filledAttendees / quantity) * 100) : 0;

  /**
   * Pasting a roster is how a company actually holds it: in a column of a
   * spreadsheet, not typed one field at a time. Names beyond the current block
   * grow it up to the picker maximum instead of being dropped silently.
   */
  const applyBulkNames = () => {
    const names = bulkNames
      .split(/[\n,;]+/)
      .map((entry) => entry.trim())
      .filter(Boolean);

    if (names.length === 0) {
      setBulkNotice(copy.corporateBulkEmpty);
      return;
    }

    const accepted = names.slice(0, CORPORATE_SEAT_CHOICE_MAX);
    const seats = Math.max(quantity, accepted.length, CORPORATE_MIN_SEATS);

    setQuantity(seats);
    setAttendees((current) =>
      Array.from(
        { length: seats },
        (_, index) => accepted[index] ?? current[index] ?? "",
      ),
    );
    setBulkNames("");

    if (names.length > CORPORATE_SEAT_CHOICE_MAX) {
      setBulkNotice(
        copy.corporateBulkOverflow
          .replace("{n}", String(accepted.length))
          .replace("{max}", String(CORPORATE_SEAT_CHOICE_MAX)),
      );
      return;
    }
    setBulkNotice(
      seats > quantity
        ? copy.corporateBulkGrew
            .replace("{n}", String(accepted.length))
            .replace("{seats}", String(seats))
        : copy.corporateBulkFilled.replace("{n}", String(accepted.length)),
    );
  };

  const clearRoster = () => {
    setAttendees((current) => current.map(() => ""));
    setBulkNotice("");
  };

  // The RFC length tells us whether the buyer is a persona física or moral,
  // which is what decides the valid regimes and CFDI uses. Showing the wrong
  // ones is the fastest way to get a CFDI rejected by the PAC.
  const personType: TaxPersonType | null = useMemo(() => {
    const validated = validateRfc(rfc);
    if (validated.valid) return validated.personType;
    const normalized = normalizeRfc(rfc);
    if (normalized.length === 12) return "moral";
    if (normalized.length === 13) return "fisica";
    return null;
  }, [rfc]);

  const regimeOptions = personType ? regimesForPersonType(personType) : TAX_REGIMES;
  const cfdiUseOptions = personType ? cfdiUsesForPersonType(personType) : CFDI_USES;

  const isCheckingDiscount = discountStatus.kind === "checking";

  /**
   * Asks the server whether a code applies.
   *
   * The answer is informational: it moves the number on screen and nothing
   * else. The code itself is what travels with the order, and the pay action
   * looks it up again from scratch.
   */
  const applyDiscount = async () => {
    if (isCheckingDiscount) return;

    const code = normalizeDiscountCode(discountInput);
    if (!code) {
      setDiscount(null);
      setDiscountStatus({ kind: "rejected", reason: "empty" });
      return;
    }

    setDiscountStatus({ kind: "checking" });

    try {
      const result = await validateDiscountCode({
        tier: orderTier,
        quantity,
        code,
      });

      if (result.valid) {
        setDiscount({
          code: result.code,
          discountBasisPoints: result.discountBasisPoints,
        });
        setDiscountInput(result.code);
        setDiscountStatus({ kind: "applied" });
        return;
      }

      // A code that does not apply is never a blocker: the price simply goes
      // back to the published one and the buyer can pay.
      setDiscount(null);
      setDiscountStatus({ kind: "rejected", reason: result.reason });
    } catch {
      setDiscount(null);
      setDiscountStatus({ kind: "rejected", reason: "unavailable" });
    }
  };

  const removeDiscount = () => {
    setDiscount(null);
    setDiscountInput("");
    setDiscountStatus({ kind: "idle" });
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (previewDisabled || isSending || status.kind === "redirecting") return;

    const form = event.currentTarget;
    const currentSubmissionId = submissionId || createSubmissionId();
    if (!submissionId) setSubmissionId(currentSubmissionId);

    // `required` is satisfied by a single space, so a roster pasted from a
    // spreadsheet with a blank row would reach the server and come back as the
    // generic "check the fields". Normalizing here is what the server does
    // anyway, and it puts the browser's own message on the offending input.
    const normalizedAttendees = attendees.map((name) =>
      name.trim().replace(/\s+/g, " "),
    );
    if (isCorporate) {
      // Writing the trimmed value back leaves the offending seats visibly
      // empty, so the buyer sees which row of the pasted list was blank. The
      // React state update has not reached the DOM yet, which is why the
      // message comes from the form's own status line rather than from
      // `reportValidity`.
      setAttendees(normalizedAttendees);
      if (normalizedAttendees.some((name) => name === "")) {
        setStatus({ kind: "error", reason: "invalid" });
        return;
      }
    }

    setStatus({ kind: "idle" });
    setIsSending(true);

    try {
      const formData = new FormData(form);
      formData.set("submissionId", currentSubmissionId);
      if (isCorporate) {
        formData.delete("attendees");
        for (const name of normalizedAttendees) {
          formData.append("attendees", name);
        }
      }
      // Remembered before the round trip: whatever this attempt may have
      // persisted is keyed to this exact order.
      setAttemptedOrderShape(
        JSON.stringify([
          orderTier,
          quantity,
          normalizedAttendees,
          discount?.code ?? "",
        ]),
      );

      const result = await createTicketCheckout(formData);

      if (result.ok && isSafeCheckoutUrl(result.checkoutUrl)) {
        // The button stays disabled from here on: the page is being replaced,
        // and re-enabling it would invite a second order against a preference
        // that is already paid for.
        setStatus({ kind: "redirecting" });
        window.location.assign(result.checkoutUrl);
        return;
      }

      const reason = result.ok ? "provider_unavailable" : result.reason;
      // The coupon changed under the buyer between checking it and paying.
      // Dropping it here is what makes the next press work: the form goes back
      // to the published price, and the message above the button explains why.
      if (reason === "discount_code_changed") {
        setDiscount(null);
        setDiscountStatus({ kind: "idle" });
      }

      setStatus({ kind: "error", reason });
      setIsSending(false);
    } catch {
      setStatus({ kind: "error", reason: "unexpected" });
      setIsSending(false);
    }
  };

  const isBusy = isSending || status.kind === "redirecting";

  const discountBlock = (
    <DiscountCodeField
      copy={copy}
      value={discountInput}
      onChange={setDiscountInput}
      onApply={applyDiscount}
      onRemove={removeDiscount}
      status={discountStatus}
      appliedCode={discount?.code ?? null}
      appliedRate={
        discount ? formatDiscountPercentage(discount.discountBasisPoints) : null
      }
      disabled={previewDisabled || isBusy}
    />
  );

  const summary = quote && volumeQuote && (
    <div className="checkout-summary" aria-live="polite">
      <h3>{copy.summaryTitle}</h3>
      <dl>
        <div>
          <dt>{copy.summaryAccesses}</dt>
          <dd>
            {quote.quantity} × {formatMxn(quote.unitPriceCents, language)}
          </dd>
        </div>
        {volumeQuote.discountCents > 0 && (
          <>
            <div>
              <dt>
                {copy.summaryListLine
                  .replace("{quantity}", String(volumeQuote.quantity))
                  .replace(
                    "{price}",
                    formatMxn(volumeQuote.listUnitPriceCents, language),
                  )}
              </dt>
              <dd>{formatMxn(volumeQuote.listTotalCents, language)}</dd>
            </div>
            <div className="checkout-summary-discount">
              <dt>{copy.summaryDiscount}</dt>
              <dd>−{formatMxn(volumeQuote.discountCents, language)}</dd>
            </div>
          </>
        )}
        {/* Subtotal is shown whether or not a code is applied, so the buyer can
            read the discount as the difference between two lines they can both
            see rather than as a number that appeared. */}
        <div>
          <dt>{copy.summarySubtotal}</dt>
          <dd>{formatMxn(quote.totalCents, language)}</dd>
        </div>
        {discount && discountPreview && (
          <div className="checkout-summary-discount">
            <dt>
              {copy.summaryCouponDiscount
                .replace("{code}", discount.code)
                .replace(
                  "{rate}",
                  formatDiscountPercentage(discount.discountBasisPoints),
                )}
            </dt>
            <dd>−{formatMxn(discountPreview.discountCents, language)}</dd>
          </div>
        )}
        <div className="checkout-summary-total">
          <dt>{copy.summaryTotal}</dt>
          <dd>{formatMxn(payableTotalCents, language)} MXN</dd>
        </div>
      </dl>
      {/* The IVA is inside the published price, so the buyer sees one final
          number. The base and the tax still travel to the order row and the
          CFDI; they are just not a checkout decision. */}
      <p className="checkout-summary-note">{copy.summaryTaxIncluded}</p>
    </div>
  );

  return (
    <form
      onSubmit={handleSubmit}
      className={`inquiry-form ${isCorporate ? "corporate-checkout" : ""}`}
      aria-describedby={previewDisabled ? "checkout-preview-disabled" : undefined}
    >
      {previewDisabled && (
        <p
          id="checkout-preview-disabled"
          className="inquiry-status is-error mb-5"
          role="status"
        >
          {copy.previewDisabled}
        </p>
      )}
      <fieldset
        disabled={previewDisabled}
        className="m-0 min-w-0 border-0 p-0 disabled:opacity-60"
      >
        <input type="hidden" name="submissionId" value={submissionId} readOnly />
        {/* Only a code the server itself said applies is ever submitted, so a
            code the buyer typed and got rejected never reaches the order. */}
        {discount && (
          <input
            type="hidden"
            name="discountCode"
            value={discount.code}
            readOnly
          />
        )}
        <input type="hidden" name="language" value={language} readOnly />
        <input
          type="hidden"
          name="consentVersion"
          value={INQUIRY_CONSENT_VERSION}
          readOnly
        />
        {previewDisabled ? <EmptyAttributionFields /> : <AttributionCapture asInputs />}
        <input
          className="sr-only"
          type="text"
          name="website"
          tabIndex={-1}
          autoComplete="off"
          aria-hidden="true"
        />

        {isCorporate && volumeQuote ? (
          <div className="corporate-layout">
            {/* The live price rail travels with the form rather than sitting in
                the section around it: the number a company is deciding on
                changes with every seat, and a static panel could only repeat
                the list price. */}
            <aside className="corporate-rail" aria-live="polite">
              <div className="corporate-rail-inner">
              <span className="corporate-rail-label">
                <UsersRound aria-hidden="true" />
                {copy.corporateRailLabel}
              </span>
              <p className="corporate-rail-seats">
                {copy.corporateRailSeats.replace("{n}", String(quantity))}
              </p>
              <div className="corporate-rail-unit">
                <span>{copy.corporateRailPerSeat}</span>
                <strong>{formatMxn(volumeQuote.unitPriceCents, language)}</strong>
                {volumeQuote.discountCents > 0 && (
                  <s>
                    {copy.corporateRailBefore.replace(
                      "{price}",
                      formatMxn(volumeQuote.listUnitPriceCents, language),
                    )}
                  </s>
                )}
              </div>
              <div className="corporate-rail-total">
                <span>{copy.corporateRailTotal}</span>
                <strong>
                  {formatMxn(
                    discountPreview?.totalCents ?? volumeQuote.totalCents,
                    language,
                  )}
                  <span>MXN</span>
                </strong>
                <small>{ui.taxNote}</small>
              </div>
              {volumeQuote.discountCents > 0 ? (
                <p className="corporate-rail-saving">
                  <BadgeCheck aria-hidden="true" />
                  {copy.corporateRailSaving.replace(
                    "{amount}",
                    formatMxn(volumeQuote.discountCents, language),
                  )}
                </p>
              ) : (
                <p className="corporate-rail-progress">{volumeNotice}</p>
              )}
              <p className="corporate-rail-includes">{copy.corporateRailIncludes}</p>
              <ul className="corporate-rail-list">
                <li>
                  <Check aria-hidden="true" />
                  {ui.corporateAccessNote}
                </li>
                <li>
                  <Check aria-hidden="true" />
                  {ui.corporateAccessDiscount}
                </li>
                </ul>
              </div>
            </aside>

            <div className="corporate-steps">
              <input type="hidden" name="tier" value={CORPORATE_TIER_ID} readOnly />

              <section className="corporate-step">
                <StepHeading
                  step={1}
                  label={copy.corporateStepLabel}
                  title={copy.corporateStepSeats}
                />
                <div className="corporate-seat-picker">
                  <button
                    type="button"
                    className="corporate-seat-step"
                    aria-label={copy.corporateSeatsDecrease}
                    disabled={quantity <= CORPORATE_MIN_SEATS}
                    onClick={() => resizeRoster(quantity - 1)}
                  >
                    <Minus aria-hidden="true" />
                  </button>
                  <label className="corporate-seat-field">
                    <span className="sr-only">{copy.corporateSeats}</span>
                    <select
                      required
                      name="quantity"
                      aria-label={copy.corporateSeats}
                      value={quantity}
                      onChange={(event) =>
                        resizeRoster(Number.parseInt(event.target.value, 10))
                      }
                    >
                      {CORPORATE_SEAT_OPTIONS.map((seats) => (
                        <option key={seats} value={seats}>
                          {copy.corporateSeatsOption.replace("{n}", String(seats))}
                        </option>
                      ))}
                    </select>
                  </label>
                  <button
                    type="button"
                    className="corporate-seat-step"
                    aria-label={copy.corporateSeatsIncrease}
                    disabled={quantity >= CORPORATE_SEAT_CHOICE_MAX}
                    onClick={() => resizeRoster(quantity + 1)}
                  >
                    <Plus aria-hidden="true" />
                  </button>
                </div>

                <div
                  className="corporate-presets"
                  role="group"
                  aria-label={copy.corporateSeatsPresetLabel}
                >
                  {CORPORATE_SEAT_PRESETS.map((seats) => (
                    <button
                      key={seats}
                      type="button"
                      aria-pressed={quantity === seats}
                      className={`corporate-preset ${quantity === seats ? "is-active" : ""}`}
                      onClick={() => resizeRoster(seats)}
                    >
                      {copy.corporateSeatsOption.replace("{n}", String(seats))}
                    </button>
                  ))}
                </div>

                <p className="corporate-step-hint">{copy.corporateSeatsHint}</p>
                <p className="corporate-step-hint">
                  {copy.corporateLargeBlockHint.replace(
                    "{max}",
                    String(CORPORATE_SEAT_CHOICE_MAX),
                  )}
                </p>
              </section>

              <section className="corporate-step">
                <StepHeading
                  step={2}
                  label={copy.corporateStepLabel}
                  title={copy.corporateStepRoster}
                />
                <p className="corporate-step-hint">{copy.corporateRosterHint}</p>

                <div className="corporate-roster-progress">
                  <div
                    className="corporate-roster-bar"
                    role="progressbar"
                    aria-valuemin={0}
                    aria-valuemax={quantity}
                    aria-valuenow={filledAttendees}
                    aria-label={copy.corporateRosterLegend}
                  >
                    <span
                      style={{ width: `${rosterProgress}%` }}
                    />
                  </div>
                  <p>
                    {filledAttendees === quantity
                      ? copy.corporateRosterComplete
                      : copy.corporateRosterProgress
                          .replace("{done}", String(filledAttendees))
                          .replace("{total}", String(quantity))}
                  </p>
                </div>

                <details className="corporate-bulk">
                  <summary>
                    <ClipboardPaste aria-hidden="true" />
                    {copy.corporateBulkToggle}
                  </summary>
                  <p>{copy.corporateBulkHint}</p>
                  <textarea
                    rows={4}
                    aria-label={copy.corporateBulkToggle}
                    value={bulkNames}
                    placeholder={copy.corporateBulkPlaceholder}
                    onChange={(event) => setBulkNames(event.target.value)}
                  />
                  <div className="corporate-bulk-actions">
                    <button
                      type="button"
                      className="btn-outline"
                      onClick={applyBulkNames}
                    >
                      {copy.corporateBulkApply}
                    </button>
                    <button
                      type="button"
                      className="corporate-bulk-clear"
                      onClick={clearRoster}
                    >
                      {copy.corporateBulkClear}
                    </button>
                  </div>
                  {bulkNotice ? (
                    <p className="corporate-bulk-notice" role="status">
                      {bulkNotice}
                    </p>
                  ) : null}
                </details>

                <fieldset className="m-0 mt-6 min-w-0 border-0 p-0">
                  <legend className="sr-only">{copy.corporateRosterLegend}</legend>
                  <ul className="corporate-roster">
                    {attendees.map((name, index) => (
                      <li key={index} className={name.trim() ? "is-filled" : ""}>
                        <span className="corporate-roster-index" aria-hidden="true">
                          {name.trim() ? <Check /> : index + 1}
                        </span>
                        <label className="inquiry-field">
                          <span className="sr-only">
                            {copy.corporateAttendee.replace("{n}", String(index + 1))}
                          </span>
                          <span className="inquiry-input-wrap">
                            <input
                              required
                              name="attendees"
                              type="text"
                              value={name}
                              aria-label={copy.corporateAttendee.replace(
                                "{n}",
                                String(index + 1),
                              )}
                              placeholder={copy.corporateAttendeePlaceholder}
                              autoComplete="off"
                              onChange={(event) => {
                                const next = event.target.value;
                                setAttendees((current) =>
                                  current.map((entry, position) =>
                                    position === index ? next : entry,
                                  ),
                                );
                              }}
                            />
                          </span>
                        </label>
                      </li>
                    ))}
                  </ul>
                </fieldset>
              </section>

              <section className="corporate-step">
                <StepHeading
                  step={3}
                  label={copy.corporateStepLabel}
                  title={copy.corporateStepBuyer}
                />
                <BuyerFields copy={copy} companyRequired />
                <InvoiceBlock
                  copy={copy}
                  language={language}
                  requiresInvoice={requiresInvoice}
                  setRequiresInvoice={setRequiresInvoice}
                  rfc={rfc}
                  setRfc={setRfc}
                  regimeOptions={regimeOptions}
                  cfdiUseOptions={cfdiUseOptions}
                />
                <div className="mt-8">
                  {discountBlock}
                  {summary}
                </div>
                <Legal copy={copy} />
                <SubmitButton
                  copy={copy}
                  previewDisabled={previewDisabled}
                  isSending={isBusy}
                  submissionId={submissionId}
                />
              </section>
            </div>
          </div>
        ) : (
          <>
            <fieldset className="m-0 min-w-0 border-0 p-0">
              <legend className="checkout-legend">{copy.tierLegend}</legend>
              <div className="mt-3 grid gap-3 sm:grid-cols-3">
                {TICKET_TIER_IDS.map((id) => {
                  const plan = pricing.find((entry) => entry.id === id);
                  return (
                    <label
                      key={id}
                      className={`checkout-tier ${tier === id ? "is-selected" : ""}`}
                    >
                      <input
                        type="radio"
                        name="tier"
                        value={id}
                        checked={tier === id}
                        onChange={() => setTier(id)}
                        className="sr-only"
                      />
                      <span className="checkout-tier-name">
                        {plan?.label ?? TICKET_TIERS[id].label[language]}
                      </span>
                      <span className="checkout-tier-price">
                        {formatMxn(TICKET_TIERS[id].unitPriceCents, language)}
                      </span>
                      <span className="checkout-tier-note">
                        {CONTENT[language].ui.taxNote}
                      </span>
                      {tierEarnsVolumeDiscount(id) && (
                        <span className="checkout-tier-badge">
                          {copy.volumeBadge.replace(
                            "{min}",
                            String(VOLUME_DISCOUNT_MIN_QUANTITY),
                          )}
                        </span>
                      )}
                    </label>
                  );
                })}
              </div>
            </fieldset>

            <label className="inquiry-field mt-5 max-w-[12rem]">
              <span>{copy.quantity}</span>
              <span className="inquiry-input-wrap">
                <select
                  required
                  name="quantity"
                  value={quantity}
                  onChange={(event) =>
                    setQuantity(Number.parseInt(event.target.value, 10))
                  }
                >
                  {Array.from({ length: maxQuantity }, (_, index) => index + 1).map(
                    (value) => (
                      <option key={value} value={value}>
                        {value}
                      </option>
                    ),
                  )}
                </select>
              </span>
            </label>
            <p className="checkout-hint">
              {copy.quantityHint.replace("{max}", String(maxQuantity))}
            </p>

            {/* The volume discount is announced where the quantity is chosen,
                not only once it has already been earned in the summary. */}
            {volumeNotice ? (
              <p
                className={`checkout-volume-note ${missingForDiscount === 0 ? "is-applied" : ""}`}
                aria-live="polite"
              >
                <BadgeCheck aria-hidden="true" />
                {volumeNotice}
              </p>
            ) : null}

            <BuyerFields copy={copy} />
            <InvoiceBlock
              copy={copy}
              language={language}
              requiresInvoice={requiresInvoice}
              setRequiresInvoice={setRequiresInvoice}
              rfc={rfc}
              setRfc={setRfc}
              regimeOptions={regimeOptions}
              cfdiUseOptions={cfdiUseOptions}
            />
            <div className="mt-8">
              {discountBlock}
              {summary}
            </div>
            <Legal copy={copy} />
            <SubmitButton
              copy={copy}
              previewDisabled={previewDisabled}
              isSending={isBusy}
              submissionId={submissionId}
            />
          </>
        )}
      </fieldset>

      {status.kind === "error" && (
        <p className="inquiry-status is-error" role="alert">
          {checkoutErrorMessage(status.reason, copy)}
        </p>
      )}
    </form>
  );
}

/** The copy block as the subcomponents read it: keys of the checkout
    dictionary, widened from the literal strings `CONTENT` freezes so the
    Spanish and English blocks are the same type here. */
type CheckoutCopy = {
  [K in keyof (typeof CONTENT)["es"]["checkout"]]: string;
};

function StepHeading({
  step,
  label,
  title,
}: {
  step: number;
  label: string;
  title: string;
}) {
  return (
    <div className="corporate-step-heading">
      <span className="corporate-step-index" aria-hidden="true">
        {step}
      </span>
      <span>
        <small>{label.replace("{n}", String(step))}</small>
        <h3>{title}</h3>
      </span>
    </div>
  );
}

function BuyerFields({
  copy,
  companyRequired = false,
}: {
  copy: CheckoutCopy;
  companyRequired?: boolean;
}) {
  return (
    <fieldset className="m-0 mt-8 min-w-0 border-0 p-0">
      <legend className="checkout-legend">{copy.buyerLegend}</legend>
      <div className="mt-3 grid gap-5 sm:grid-cols-2">
        <TextField
          icon={<UserRound aria-hidden="true" />}
          label={copy.firstName}
          name="firstName"
          placeholder={copy.firstNamePlaceholder}
          autoComplete="given-name"
        />
        <TextField
          icon={<UserRound aria-hidden="true" />}
          label={copy.lastName}
          name="lastName"
          placeholder={copy.lastNamePlaceholder}
          autoComplete="family-name"
        />
        <TextField
          icon={<Mail aria-hidden="true" />}
          label={copy.email}
          name="email"
          type="email"
          placeholder={copy.emailPlaceholder}
          autoComplete="email"
        />
        <TextField
          icon={<Phone aria-hidden="true" />}
          label={copy.phone}
          name="phone"
          type="tel"
          placeholder={copy.phonePlaceholder}
          autoComplete="tel"
        />
        <TextField
          icon={<Building2 aria-hidden="true" />}
          label={copy.company}
          name="company"
          placeholder={copy.companyPlaceholder}
          autoComplete="organization"
          // A block is bought by a company; an individual access is not.
          required={companyRequired}
        />
        <TextField
          icon={<Sparkles aria-hidden="true" />}
          label={copy.referral}
          name="referral"
          placeholder={copy.referralPlaceholder}
          autoComplete="off"
          required={false}
          hint={copy.referralHint}
        />
      </div>
    </fieldset>
  );
}

/**
 * The optional discount code.
 *
 * Deliberately unobtrusive: a question, one field and one button, with no
 * "required" anywhere near it. A code that does not work says so and leaves
 * the payment button exactly as it was — buying without a code is the normal
 * case, not a fallback.
 */
function DiscountCodeField({
  copy,
  value,
  onChange,
  onApply,
  onRemove,
  status,
  appliedCode,
  appliedRate,
  disabled,
}: {
  copy: CheckoutCopy;
  value: string;
  onChange: (value: string) => void;
  onApply: () => void;
  onRemove: () => void;
  status: DiscountStatus;
  appliedCode: string | null;
  appliedRate: string | null;
  disabled: boolean;
}) {
  const isChecking = status.kind === "checking";
  const isApplied = appliedCode !== null;

  return (
    <div className={`checkout-discount ${isApplied ? "is-applied" : ""}`}>
      <span className="checkout-discount-title">
        <TicketPercent aria-hidden="true" />
        {copy.discountLegend}
      </span>
      <p className="checkout-discount-hint">{copy.discountHint}</p>

      <div className="checkout-discount-row">
        <label className="inquiry-field">
          <span className="sr-only">{copy.discountLabel}</span>
          <span className="inquiry-input-wrap">
            <input
              type="text"
              name="discountCodeInput"
              value={value}
              maxLength={DISCOUNT_CODE_MAX_LENGTH}
              placeholder={copy.discountPlaceholder}
              autoComplete="off"
              spellCheck={false}
              disabled={disabled || isApplied}
              aria-label={copy.discountLabel}
              onChange={(event) => onChange(event.target.value.toUpperCase())}
              onKeyDown={(event) => {
                // The code field lives inside the checkout form, so Enter would
                // otherwise submit the order instead of checking the code.
                if (event.key !== "Enter") return;
                event.preventDefault();
                if (!isApplied) onApply();
              }}
            />
          </span>
        </label>
        {isApplied ? (
          <button
            type="button"
            className="checkout-discount-remove"
            onClick={onRemove}
            disabled={disabled}
          >
            <X aria-hidden="true" />
            {copy.discountRemove}
          </button>
        ) : (
          <button
            type="button"
            className="btn-outline checkout-discount-apply"
            onClick={onApply}
            // Disabled only while a check is in flight, so a double click
            // cannot fire two lookups against the rate limit.
            disabled={disabled || isChecking}
            aria-busy={isChecking}
          >
            {isChecking ? copy.discountApplying : copy.discountApply}
          </button>
        )}
      </div>

      <p className="checkout-discount-status" role="status" aria-live="polite">
        {isApplied ? (
          <span className="checkout-discount-ok">
            <Check aria-hidden="true" />
            {copy.discountApplied.replace("{code}", appliedCode)}
            {appliedRate
              ? ` — ${copy.discountAppliedRate.replace("{rate}", appliedRate)}`
              : ""}
          </span>
        ) : status.kind === "rejected" ? (
          <span className="checkout-discount-error">
            {discountRejectionMessage(status.reason, copy)}
          </span>
        ) : null}
      </p>
    </div>
  );
}

export function discountRejectionMessage(
  reason: DiscountCodeRejection | "empty",
  copy: {
    discountEmpty: string;
    discountInvalid: string;
    discountRateLimited: string;
    discountUnavailable: string;
  },
): string {
  switch (reason) {
    case "empty":
      return copy.discountEmpty;
    case "rate_limited":
      return copy.discountRateLimited;
    case "unavailable":
      return copy.discountUnavailable;
    default:
      // "unknown" and "not_applicable" answer alike on purpose: the form must
      // not become a way to learn which codes exist.
      return copy.discountInvalid;
  }
}

function InvoiceBlock({
  copy,
  language,
  requiresInvoice,
  setRequiresInvoice,
  rfc,
  setRfc,
  regimeOptions,
  cfdiUseOptions,
}: {
  copy: CheckoutCopy;
  language: Language;
  requiresInvoice: boolean;
  setRequiresInvoice: (value: boolean) => void;
  rfc: string;
  setRfc: (value: string) => void;
  regimeOptions: readonly { code: string; label: { es: string; en: string } }[];
  cfdiUseOptions: readonly { code: string; label: { es: string; en: string } }[];
}) {
  return (
    <>
      <label className="checkout-invoice-toggle">
        <input
          type="checkbox"
          name="requiresInvoice"
          checked={requiresInvoice}
          onChange={(event) => setRequiresInvoice(event.target.checked)}
          className="mt-1"
        />
        <span>
          <span className="checkout-invoice-toggle-title">
            <ReceiptText aria-hidden="true" />
            {copy.invoiceToggle}
          </span>
          <span className="checkout-invoice-toggle-hint">{copy.invoiceHint}</span>
        </span>
      </label>

      {requiresInvoice && (
        <fieldset className="m-0 mt-6 min-w-0 border-0 p-0">
          <legend className="checkout-legend">{copy.invoiceLegend}</legend>
          <div className="mt-3 grid gap-5 sm:grid-cols-2">
            <label className="inquiry-field">
              <span>{copy.rfc}</span>
              <span className="inquiry-input-wrap">
                <input
                  required
                  name="rfc"
                  type="text"
                  value={rfc}
                  maxLength={20}
                  placeholder={copy.rfcPlaceholder}
                  autoComplete="off"
                  spellCheck={false}
                  onChange={(event) => setRfc(event.target.value.toUpperCase())}
                />
              </span>
            </label>
            <TextField
              icon={<Building2 aria-hidden="true" />}
              label={copy.legalName}
              name="legalName"
              placeholder={copy.legalNamePlaceholder}
              autoComplete="organization"
            />
            <SelectField
              label={copy.taxRegime}
              name="taxRegime"
              placeholder={copy.selectPlaceholder}
              options={regimeOptions.map((entry) => ({
                value: entry.code,
                label: `${entry.code} — ${entry.label[language]}`,
              }))}
            />
            <SelectField
              label={copy.cfdiUse}
              name="cfdiUse"
              placeholder={copy.selectPlaceholder}
              options={cfdiUseOptions.map((entry) => ({
                value: entry.code,
                label: `${entry.code} — ${entry.label[language]}`,
              }))}
            />
            <TextField
              icon={<ReceiptText aria-hidden="true" />}
              label={copy.postalCode}
              name="postalCode"
              placeholder={copy.postalCodePlaceholder}
              autoComplete="postal-code"
              inputMode="numeric"
              maxLength={5}
            />
            <TextField
              icon={<Mail aria-hidden="true" />}
              label={copy.billingEmail}
              name="billingEmail"
              type="email"
              placeholder={copy.billingEmailPlaceholder}
              autoComplete="email"
              required={false}
            />
          </div>
        </fieldset>
      )}
    </>
  );
}

function Legal({ copy }: { copy: CheckoutCopy }) {
  return (
    <p className="checkout-legal">
      {copy.privacy}{" "}
      <Link href="/aviso-de-privacidad">{copy.privacyLink}</Link>
    </p>
  );
}

function SubmitButton({
  copy,
  previewDisabled,
  isSending,
  submissionId,
}: {
  copy: CheckoutCopy;
  previewDisabled: boolean;
  isSending: boolean;
  submissionId: string;
}) {
  return (
    <button
      type="submit"
      disabled={previewDisabled || isSending || !submissionId}
      aria-busy={isSending}
      className="btn-primary mt-6 w-full px-8 py-4 text-sm sm:w-auto"
    >
      {previewDisabled
        ? copy.previewDisabledButton
        : isSending
          ? copy.submitSending
          : copy.submit}
      <ArrowRight className="h-4 w-4" aria-hidden="true" />
    </button>
  );
}

export function checkoutErrorMessage(
  reason: CheckoutFailureReason,
  copy: {
    invalid: string;
    invalidInvoice: string;
    rateLimited: string;
    conflict: string;
    soldOut: string;
    providerUnavailable: string;
    discountChanged: string;
    error: string;
  },
): string {
  switch (reason) {
    case "invalid":
      return copy.invalid;
    case "invalid_invoice":
      return copy.invalidInvoice;
    case "rate_limited":
      return copy.rateLimited;
    case "idempotency_conflict":
      return copy.conflict;
    case "sold_out":
      return copy.soldOut;
    case "provider_unavailable":
      return copy.providerUnavailable;
    case "discount_code_changed":
      return copy.discountChanged;
    default:
      return copy.error;
  }
}

function TextField({
  icon,
  label,
  name,
  placeholder,
  type = "text",
  autoComplete,
  required = true,
  inputMode,
  maxLength,
  hint,
}: {
  icon: ReactNode;
  label: string;
  name: string;
  placeholder: string;
  type?: "text" | "email" | "tel";
  autoComplete: string;
  required?: boolean;
  inputMode?: "numeric" | "text";
  maxLength?: number;
  hint?: string;
}) {
  return (
    <label className="inquiry-field">
      <span>{label}</span>
      <span className="inquiry-input-wrap">
        {icon}
        <input
          required={required}
          name={name}
          type={type}
          placeholder={placeholder}
          autoComplete={autoComplete}
          inputMode={inputMode}
          maxLength={maxLength}
        />
      </span>
      {hint ? <small className="inquiry-field-hint">{hint}</small> : null}
    </label>
  );
}

function SelectField({
  label,
  name,
  placeholder,
  options,
}: {
  label: string;
  name: string;
  placeholder: string;
  options: { value: string; label: string }[];
}) {
  return (
    <label className="inquiry-field">
      <span>{label}</span>
      <span className="inquiry-input-wrap">
        <select required name={name} defaultValue="">
          <option value="" disabled>
            {placeholder}
          </option>
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </span>
    </label>
  );
}
