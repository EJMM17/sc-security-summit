# Design QA — SC Security Summit 2026

## Scope

- Source of truth: `C:\Users\emman\Downloads\Maqueta SC Summit.dc.html`
- Implementation: `http://127.0.0.1:3000/?lang=es`
- Review date: 2026-07-31
- Viewports reviewed: desktop at approximately 1365 × 990 and mobile at 390 × 844

## Fidelity review

### Typography

- Oswald is loaded as the display family and Inter as the body family.
- The hero hierarchy, condensed headings, sentence case, weights, and blue-highlight treatment match the visual direction of the source.
- A minor line-wrap difference remains in the hero because the implementation uses the real loaded font and responsive production layout. It does not affect hierarchy or meaning.

### Spacing and rhythm

- The implementation follows the source sequence: hero, formation benefits, competencies, specialists, networking, program, gallery, value, audience paths, access options, corporate pass, closing CTA, location, sponsorship, presenters, FAQ, and footer.
- Full-page captures have comparable overall rhythm and height.
- Desktop and mobile layouts have no horizontal overflow.

### Color and surfaces

- The navy, royal blue, slate, white, and soft-gray palette is consistently mapped to production tokens.
- Dark bands, white content sections, bordered cards, blue calls to action, and the closing gradient preserve the source's visual language.

### Imagery and assets

- Existing Summit photography and official presenter/partner logos are reused.
- Hero, networking, speaker, and gallery imagery use responsive crops.
- Browser checks found no broken images.

### Content and production architecture

- The source's training-first positioning is preserved in Spanish and English.
- Individual admission remains off-site through Eventbrite.
- Corporate-pass and sponsorship inquiries continue through the existing production forms.
- Privacy, consent, analytics isolation, on-demand map loading, server-only persistence, and anti-abuse boundaries remain intact.

## Interaction and responsive checks

- Desktop and mobile navigation work, including the mobile dialog and focus behavior.
- Language switching remains available.
- Countdown, speaker carousel, agenda controls, FAQ accordions, map activation, and both inquiry forms render without browser console errors.
- At 390 px, forms and sections stay within the viewport and primary actions remain usable.

## Evidence

- `tmp/design-qa/hero-comparison-final-clean.jpg`
- `tmp/design-qa/full-page-comparison.jpg`
- `tmp/design-qa/app-mobile-390.jpg`
- `tmp/design-qa/app-mobile-menu-open.jpg`
- `tmp/design-qa/app-full-page.jpg`
- `tmp/design-qa/reference-full-page.jpg`

## Findings

- P0: none
- P1: none
- P2: none
- P3: acceptable responsive line-wrap differences between the static source and the production implementation

final result: passed
