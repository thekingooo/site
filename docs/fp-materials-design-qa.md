# Design QA — FP Group materials

Result: **passed for the standalone redesign scope**, 2026-10-26.

## References and implementation

- User's uploaded `index.html`: source hash recorded in `public/materials-redesign/preservation.json`.
- User's attached material moodboard: dusty beige, oak herringbone, botanical forest green, terracotta, fluted ivory plaster, charcoal stone. This is a material direction, not a page layout to copy pixel for pixel.
- Implementation: `public/materials-redesign/index.html`; downloadable ZIP: `public/downloads/fp-group-materials.zip`.
- Browser evidence: `/workspace/artifacts/fp-materials/`, desktop 1440×1000 and mobile 390×844, device scale 1. Section screenshots named `about-1440.png`, `services-1440.png`, `projects-1440.png`, `standards-1440.png`, `production-1440.png`, `clients-1440.png`, `contact-1440.png`, and matching `-390` files. `preview.jpg` gives the material sequence.

## Hero preservation

Exact source assertions pass for hero markup, all five original style blocks and the complete original hero interaction script. Before/after screenshots captured at scroll progress 0 and .5, desktop and mobile, with identical external-font blocking in both versions. Photographic framing, text placement, navigation and scroll stages remain visually unchanged. Raster comparison shows small text-edge antialiasing differences (desktop initial RGB mean absolute difference ~0.46/255); therefore this report does not claim pixel-identical screenshots. No hero typography, content, assets or animation was intentionally edited.

## Visual review

- Layout: generous editorial sections, two staggered real project cards, split oak production section, structured services and restrained footer. Mobile layouts stack without horizontal overflow.
- Typography: locally embedded Manrope and Cormorant Garamond for new sections only; large serif headlines, lighter italic accents and compact navigation labels. Original hero fonts retained.
- Color: alternating material families from the moodboard. Warm ivory type on forest, terracotta and charcoal; muted dark text on sand and ivory. No new gold accents.
- Images: six newly generated raster textures, not CSS approximations. Source project photos retained and decoded successfully. Texture opacity preserves text readability.
- Content: company services, experience, projects, standards, production, clients and contacts retained from the provided material. Only the two documented project galleries are presented.

## Iterations and checks

1. First mobile capture revealed words joining when line breaks were hidden and an intrinsic-width overflow in the furniture grid. Added whitespace after line breaks, shrinkable grid columns and a constrained material note. Re-captured mobile process and production sections; corrected.
2. Removed the source's stale zoom handler, which threw because its target element was absent. No page errors in revised desktop/mobile runs.
3. Chromium checks at 320, 390, 768 and 1440 px: no horizontal overflow or clipped headings/paragraphs. All images with sources decoded; the hidden gallery's initially empty image is a deliberate placeholder, filled on opening.
4. Native service accordions expand; both project galleries open, advance from 1/3 to 2/3, decode their photos, close with Escape and return focus to the triggering card.
5. New contact buttons open the original dialog; original hero scroll and navigation logic remain intact.
6. Checked standalone assets over local HTTP with external requests blocked. Direct `file://` navigation is blocked by this environment's Chromium policy, so local-file opening was not browser-tested here. The artifact uses inline assets and ordinary inline scripts, with no fetch or module dependencies.

## Boundaries

The original hero's external font links and email-based form behavior are preserved. This is a standalone HTML deliverable, not a production deployment or a new form backend.
