# Production frontend comparison — SC Security Summit 2026

## Audit scope

- Published reference: `https://scsecuritysummit.com/`
- Local implementation: `http://127.0.0.1:3000/?lang=es`
- Review date: 2026-07-31
- Goal: retain the new training-led visual direction while adopting the published site's stronger layout, section rhythm, and conversion structure.

## User goal and accessibility target

Visitors must understand the event, date, venue, access options, and next action without layout collisions. The page must reflow without horizontal overflow, keep readable controls, and preserve keyboard-accessible navigation and inquiry forms.

## Reviewed steps

1. **Header and hero — healthy after correction**
   - Adopted the published site's clear white header and balanced navigation spacing.
   - Reduced the desktop hero from 1,321 px to exactly 1,000 px at the reviewed desktop viewport.
   - Grouped date, venue, and countdown into one compact row.
   - Restored visible text and contrast on the secondary “Ver programa” action.

2. **Training and program flow — healthy**
   - Moved the dark networking band before the specialist carousel, matching the stronger published rhythm between light content sections.
   - Reduced the oversized specialist panel and maintained a two-column agenda on desktop.

3. **Access and inquiry structure — healthy after correction**
   - Restored the published conversion order: access options, sponsorship inquiry, closing CTA, corporate pass, and location.
   - Corrected a legacy grid collision that compressed the sponsorship form to 219 px; the form now uses 491 px inside its desktop panel.
   - Corporate-pass and sponsorship forms remain connected to the existing production architecture.

4. **Mobile reflow — healthy after correction**
   - Removed overlapping four-column statistics and uses a compact two-by-two arrangement.
   - Keeps presenter logos in one balanced row and uses side-by-side primary actions.
   - Hides secondary topic and countdown detail at the smallest breakpoint so the core event information remains readable.
   - Verified no horizontal overflow at 390 px.

5. **Footer, FAQ, and supporting content — healthy**
   - Section widths and backgrounds remain consistent through the full page.
   - FAQ, footer navigation, privacy links, and on-demand map remain in place.

## Strengths retained from production

- A stable white navigation bar with clear brand and CTA separation.
- A hero that exposes the event proposition and conversion path within one desktop viewport.
- Alternating light and dark bands that make the long landing page easier to scan.
- Sponsor inquiry before the corporate-pass flow, separating the two business intents.

## Accessibility findings

- Desktop and mobile layouts reflow without horizontal overflow.
- Navigation, language switcher, mobile dialog, forms, and map activation retain semantic controls.
- The white secondary hero action now has readable dark text and visible focus/hover treatment.
- Screenshot review cannot prove full WCAG conformance; automated browser coverage and semantic DOM inspection were used for the tested paths.

## Verification

- TypeScript: passed
- ESLint: passed with zero warnings
- Production build: passed
- Playwright: 30 passed and 5 intentionally skipped across Chromium, Firefox, WebKit, Mobile Chrome, and Mobile Safari
- Broken images in final desktop browser review: 0
- Final desktop document width: 1,432 px inside a 1,440 px viewport
- Final mobile document width: 390 px inside a 390 px viewport

## Accepted evidence

- `tmp/production-audit/03-production-desktop-chrome.png`
- `tmp/production-audit/09-local-desktop-refined.png`
- `tmp/production-audit/14-local-mobile-final.png`
- `tmp/production-audit/18-local-full-final-clean.png`
- `tmp/production-audit/19-production-vs-local-final.jpg`

## Evidence limits

- Production forms were not submitted; the audit was read-only.
- Provider delivery, persistence, and external email behavior were not exercised against real production services.
- The local production preview intentionally reports missing local Supabase credentials unless controlled integration adapters are configured.

final result: passed
