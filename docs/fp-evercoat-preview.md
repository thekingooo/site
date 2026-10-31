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

All four portfolio slots now use the user's 31 October photo archives, in upload order: EL MACHETE (4 images), Мама варит кофе (5), Стоматология «Демократ» (5), Кафе на Стремянном (5). The last object occupies the fourth slot temporarily at the user's request. City/area/duration for the bar and Stremyanny café remain grounded in the presentation; city and area for the two new cases are omitted pending user details. Their descriptions identify visible business spaces without inventing project scope or metrics.

The supplied WebP images are copied byte-for-byte, without additional image processing. JPEG duplicates are not added to galleries. Covers use the portrait/interior views; full gallery images use object-fit contain. `src/evercoat-preview/projects.json` is the source for both card markup and gallery data, so replacing the fourth case requires one entry and its photos. Gallery counters and next/previous wrap use each project's actual image count, with arrow-key navigation, Escape and focus restoration. The four-card row stays horizontal on small screens with swipe scrolling.

## Flight module

Current source: `e12752d3466bdbdeb7260be739a7f100_b1e1f7db-d765-46e9-9bb2-be7fa72c2684.mp4`, successfully extracted from the user's four RAR volumes. The 80,859,445-byte source is 1920×1080, 30fps, 12 seconds / 360 frames, without audio. The Google Drive link remains inaccessible; the multipart upload resolved delivery. The previous 720p film is no longer used in this version.

Stop frames selected by visual inspection: 0, 75, 126, 186, 279 (0, 2.50, 4.20, 6.20, 9.30 seconds). Each clip includes both boundary frames; lossless posters use those exact source frames. Source resolution is retained in H.264 clips re-encoded at CRF 19 with faststart, and no audio. The final static hotel tail is omitted. The manifest records the source hash, stop indices, and playback timing.

One gesture launches one whole transition; further input is discarded during the flight. 3× playback gives about 0.84, 0.58, 0.68, and 1.04 second flights. The blur rises smoothly to 11px with a 4.5% overscan, then resets completely at arrival. Reverse uses baked reversed clips. Original supplied renders are retained in the lower sections and reduced-motion mode. Large-scale geometry inconsistencies already present in the source film are not reconstructed or repaired.

## Run and build

```sh
python scripts/prepare-evercoat-media.py /path/to/e12752d3466bdbdeb7260be739a7f100_b1e1f7db-d765-46e9-9bb2-be7fa72c2684.mp4
python scripts/build-evercoat-preview.py
python -m http.server 3340 --directory public/evercoat-preview
```

The downloadable ZIP includes index.html, assets and media. Extract all files together. Contact form prepares a mailto message; no server delivery is implemented. Previous Loam and flight versions are left intact.

## Remaining inputs

- City and area for Мама варит кофе and Стоматология «Демократ».
- The exact source fonts/mobile behavior require source access if pixel-level reproduction is needed.
