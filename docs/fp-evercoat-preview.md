# FP Group — Evercoat recording adaptation

New independent review version at `public/evercoat-preview`. Source: the user's 1902×910 screen recording `Запись 2026-10-30 130340.mp4`, 14.43 seconds. The live reference `evercoatpainterco.com` and its www hostname were inaccessible in the execution environment (CONNECT 403 / browser tunnel failure). This is a reconstruction from the supplied recording, not a claim to have retrieved or copied the site's DOM/CSS.

## Design evidence

The recording shows a fixed 94px ivory header with centered navigation, a dark-blue pill CTA, a full-width video hero, a 1320px central content column at 1902px viewport, heavy sans-serif headings with Georgia-like italic second phrases, three service cards, a before/after block, a two-image inspiration section, a navy advantages section, four process columns, an image/text company section with an experience medallion, a central statement, FAQ accordions, a pale contact section with a white form, and navy footer. These patterns and desktop proportions are carried into the draft. The user explicitly replaced the before/after block with four portfolio cards in one row.

Lower sections use local system Arial and Georgia, selected from visible shapes; the actual source font files and mobile source were unavailable. Mobile layout is an adaptation. Recorded entry motion is approximated with opacity/vertical reveals, and cards have hover zoom. Navigation, service dialogs, galleries, FAQ, menu, and email preparation work locally. No source-company photos, branding, claims or contact data are reused.

## Hero refinement — 31 October 2026

The five room headlines and supporting descriptions now follow the user's supplied screenshots verbatim: lobby, restaurants, cafés, offices, hotels. A shared display layout uses embedded Onest 600 and Cormorant Garamond 400 italic, with the earlier white/sand heading colors retained. These font choices closely follow the supplied shapes; exact screenshot font identification is not claimed. Font licenses are included in the ZIP. The previous hero-only general CTA/facts are replaced by the supplied text layout; the header contact CTA and lower company facts remain.

The header logo is 85% of its former width at each breakpoint (142.8 / 119 / 95.2px), with sand `#b59f6d` for the symbol and navy `#193247` for the lettering. Its original transparent silhouette is used in an inline SVG alpha mask, so recoloring does not redraw or distort the mark and has no external-file dependency.

A one-pixel inset frame sits above both the video and static views (22px desktop inset, 12px mobile). The lower-left caption is replaced by “Прокрутите вниз” and an animated outlined mouse. Clicking the cue advances exactly one room, with the same busy lock as wheel navigation. The cue stops animating in reduced-motion/static mode. Room text updates both forwards and backwards; blur, source film, timing, and all lower sections remain unchanged.

## Company content

The supplied PDF was inspected as 16 rendered slides (it contains no extractable text). Claims: 8 years, more than 100 projects, own furniture production, full cycle design/construction/engineering/equipment/furniture, and SRO; contacts from slide 16. The two documented projects are the Moscow café on Stremyanny (168m², 45 days, slides 11–12) and EL MACHETE in Ufa (111m², 42 days, slides 13–14). Existing embedded photos from the user's earlier HTML provide their galleries. The logo is the same supplied mark, displayed dark in the header and white in the footer.

All four portfolio slots now use the user's 31 October photo archives, in upload order: EL MACHETE (4 images), Мама варит кофе (5), Стоматология «Демократ» (5), Кафе на Стремянном (5). The last object occupies the fourth slot temporarily at the user's request. City/area/duration for the bar and Stremyanny café remain grounded in the presentation; the user has since supplied 215m² for Мама варит кофе and 73m² for Демократ. Card and gallery metadata show the object type instead of the city. Cities remain stored where known. Their descriptions identify visible business spaces without inventing project scope or metrics.

The supplied WebP images are copied byte-for-byte, without additional image processing. JPEG duplicates are not added to galleries. EL MACHETE uses the first image with the machete mural; the clinic uses image four with the dental chair. Both covers align left to retain those subjects; full gallery images use object-fit contain. `src/evercoat-preview/projects.json` is the source for both card markup and gallery data, so replacing the fourth case requires one entry and its photos. Gallery counters and next/previous wrap use each project's actual image count, with arrow-key navigation, Escape and focus restoration. The four-card row stays horizontal on small screens with swipe scrolling.

## Services, work route and company consolidation — 31 October 2026

Section 01 now has four directions from the supplied presentation: project/design, construction, engineering/finishing, and equipment/furniture. `services.json` supplies both card text and service-dialog details. Four coordinated generated photographs share a single local atlas; they illustrate the services and are separate from the actual project galleries. Existing ivory, navy and sand colors remain.

Section 05 follows the supplied route concept with nine steps, from business idea to opening. On sufficiently large desktop viewports the entire route stays visible. One wheel gesture animates the marker to the next stop; additional events during the movement and its inertial tail do not skip stages. Reverse gestures move one stop back. At either end, scrolling can continue to the adjacent page section. The previous footer counter and completion caption are removed. Stage buttons also move to their position. The route becomes vertical below 1000px; short desktop windows use ordinary page flow. System reduced-motion mode shows a static completed route without pinning. Wheel handling is scoped to the pinned route; browser zoom, horizontal gestures and open dialogs retain their normal behavior. On desktop the page stays at the section's natural top while the marker advances, with no artificial scroll-height spacer. Native scrollbar movement can bypass the section; the vertical mobile route selects the nearest complete stop. The marker never rests between stops. Stage data lives in `journey.json`; geometry and progress are measured responsively in `journey.js`.

As of 9 November 2026, section 05 shares the standard section padding (53px desktop, 37.5px tablet, 32.5px mobile) and the same responsive container width. Its height is determined by content. At 1440×1000 the section is 706px high instead of 2100px, with 53px above and below its content instead of about 160px plus a scroll spacer.

The hero's “Без анимации” control is now a labeled native checkbox with a custom visible box and checkmark after the label. Its label stays fixed, its checked value matches the actual hero mode, and keyboard Space works. The five-item trust strip starts with a gold star containing 8 and “лет создаём пространства”. The former section 06 is removed; its headline and both descriptive paragraphs are in a compact, text-only section 03, which the “О компании” navigation opens. Both direction images, captions and visualization credit are removed. Wrapped trust-strip rows are centered, including the last incomplete row. Later section numbers are shifted down by one.

The contact image is replaced by a local regional map, marked at Ufa city center (55.9721 E, 54.7388 N), with a zoomed-out Yandex Maps link. Natural Earth public-domain rivers and administrative boundaries provide the geography. The map remains visible offline. Its red marker pulses gently over 2.8 seconds, with two expanding ripple rings staggered by 1.4 seconds. CSS animation is embedded in the SVG, so the marker remains aligned during responsive scaling and hover. A picture source selects a separate static SVG for system reduced-motion preferences, including browsers that do not forward this preference into embedded SVG animation. To regenerate it, run `python scripts/build-ufa-map.py`; the script downloads/caches source GeoJSON in `/tmp/fp-natural-earth`, or accepts `--data-dir` with pre-downloaded `rivers.geojson` and `regions.geojson`.

## Compact spacing, contacts and footer — 1 November 2026

Section padding is halved at every breakpoint: 106→53px desktop, 75→37.5px tablet, and 65→32.5px mobile. The company and statement sections and the route's outer padding are reduced in the same proportion. The pinned route retains the viewport space and travel required for one-gesture stage navigation.

The contact section no longer shows the full-cycle/own-furniture checkmarks or a separate phone number above the map. The centered contact grid is capped at 1188px; smaller form padding, field spacing and a three-row message field reduce its desktop height from 721 to 637px, with all fields retained. The map sits above the form's lower edge. The offline map uses a neutral light base, blue waterways, gray boundaries and a red Ufa marker, with no green tint; it remains a Natural Earth map linked to Yandex, not Yandex-supplied tiles.

The footer is one tier: logo and copyright on the left, the complete supplied Bashkortostan/Ufa/Kalininsky district address and both phones, website and email centered, and “Наверх” on the right. The slogan, lower divider and second footer row are removed. On mobile, the contact group wraps beneath the logo/back link. Website, telephone and email links retain their proper destinations.

## Flight module

Current source: `e12752d3466bdbdeb7260be739a7f100_b1e1f7db-d765-46e9-9bb2-be7fa72c2684.mp4`, successfully extracted from the user's four RAR volumes. The 80,859,445-byte source is 1920×1080, 30fps, 12 seconds / 360 frames, without audio. The Google Drive link remains inaccessible; the multipart upload resolved delivery. The previous 720p film is no longer used in this version.

Stop frames selected by visual inspection: 0, 75, 126, 186, 279 (0, 2.50, 4.20, 6.20, 9.30 seconds). Each clip includes both boundary frames; lossless posters use those exact source frames. Source resolution is retained in H.264 clips re-encoded at CRF 19 with faststart, and no audio. The final static hotel tail is omitted. The manifest records the source hash, stop indices, and playback timing.

One gesture launches one whole transition; further input is discarded during the flight. 3× playback gives about 0.84, 0.58, 0.68, and 1.04 second flights. The blur rises smoothly to 11px with a 4.5% overscan, then resets completely at arrival. Reverse uses baked reversed clips. Animated and static hero modes now use identical lossless video-stop posters, retaining the same angle, crop and scale. The original renders remain packaged but are no longer used as alternate static hero frames. The room labels are native buttons; selecting a nonadjacent room plays each intervening forward/reverse clip, with controls locked until the destination is reached. In static mode the selected room appears directly. Header heights are 85% of their previous values: 79.9 / 66.3 / 61.2px. Large-scale geometry inconsistencies already present in the source film are not reconstructed or repaired.

## Run and build

```sh
python scripts/prepare-evercoat-media.py /path/to/e12752d3466bdbdeb7260be739a7f100_b1e1f7db-d765-46e9-9bb2-be7fa72c2684.mp4
python scripts/build-evercoat-preview.py
python -m http.server 3340 --directory public/evercoat-preview
EVERCOAT_URL=http://127.0.0.1:3340 node scripts/check-evercoat-preview.cjs
EVERCOAT_URL=http://127.0.0.1:3340 node scripts/check-evercoat-journey.cjs
EVERCOAT_URL=http://127.0.0.1:3340 node scripts/check-evercoat-navigation.cjs
```

The downloadable ZIP includes index.html, assets and media. Extract all files together. Contact form prepares a mailto message; no server delivery is implemented. Previous Loam and flight versions are left intact.

## Remaining inputs

- Cities for Мама варит кофе and Стоматология «Демократ» are not supplied; the current design displays object types instead.
- The exact source fonts/mobile behavior require source access if pixel-level reproduction is needed.

## 9 November 2026 spacing and map verification

`check-evercoat-journey.cjs` verifies section 05 uses the same outer padding and container alignment as the services section at 320, 390, 768, 1024 and 1440px, without extra scroll height. It checks visible animation of the embedded Ufa map, a static picture source under reduced motion, stage buttons and mobile layout. `check-evercoat-navigation.cjs` passes wheel gestures, inertia suppression, reverse movement and exit from the route. Additional browser checks cover entry from both directions, constant page position during stage changes, keyboard navigation and short-window fallback. Evidence is in `/workspace/artifacts/fp-spacing-pulse/`.
