# FP Group / new Full HD film — 30 October 2026

Passed: the new user-supplied film was extracted from all four RAR volumes and replaces the temporary video in the Evercoat version. All eight forward/reverse clips are 1920×1080 at 30fps, silent. Stops are source frames 0 / 75 / 126 / 186 / 279. Explicit CFR timestamps fix a source-duration issue that otherwise caused the arrival frame to be discarded by the MP4 edit list.

Verified decoded frame counts, dimensions, no audio, and both endpoints of all clips against their lossless source posters (mean RGB differences below 3.3/255 after H.264 encoding). Browser checks passed all four forward and four reverse flights, one-wheel-step behavior, sustained-input suppression, cleared blur at rest, no media fallbacks or JavaScript errors, and reduced-motion/mobile layout. Visually reviewed the new hero capture. ZIP integrity, packaged HTML equality, and packaged source hash were checked. Existing company sections are unchanged; two portfolio records still await user materials.

---

# FP Group / Evercoat recording — 30 October 2026

Final result: passed for the review draft. Full requested content is pending the new video and two additional project records.

Compared the supplied recording frames and the rendered implementation at 1902×910. Header height, 1320px content column, color hierarchy, mixed sans/italic headings, service grid, navy benefit section, four-step process, about section, FAQ and form placement follow the recording. The user-requested four-card project row replaces the source before/after slider. Actual source fonts and DOM are unavailable, so this is a visual adaptation, not a pixel-identical clone.

Verified desktop and 390×844 mobile: first forward and reverse flights, blur reaching ~9px during playback and clearing at stops, service dialogs, both real-project galleries with next/Escape, FAQ, mailto preparation, mobile menu, horizontal project row, no page overflow or JS errors. Fixed header logo contrast and horizontal-card entry transforms. All displayed company facts are grounded in the PDF. Two missing cases are explicitly marked pending. New requested film is inaccessible; draft uses the earlier source as disclosed in README and handoff.

---

# FP Group — faster flights, 29 October 2026

The same frame-aligned clips now play at 2× speed in both directions. Room stops and the one-gesture/one-room interaction remain unchanged. Browser checks and an updated walkthrough cover the new timing. See `docs/fp-flight-preview.md` for source limitations and the existing local-file browser restriction.

---

# FP Group flight preview — 28 October 2026

Final result: passed for the HTTP-served prototype.

The source is the user's five-room fly-through video and originals 11.png–15.png. Compared source frame contact sheet against rendered desktop/mobile screenshots and the 24-second browser recording. Stops preserve the source-video composition; original high-resolution images are intentionally used only for reduced motion and lower sections.

Verified: one minimal wheel delta completes one room transition; a sustained wheel burst extending past arrival does not skip a room; reverse playback, keyboard and touch swipe work; all five rooms appear in order; last-room exit and return from company sections work; reduced motion and failed-media fallback work. No page JavaScript errors. Fixed missing text-glyph arrow icons by replacing them with library SVG icons. Removed duplicate visible arrival announcements while preserving the live region. Reviewed desktop 1440×900, mobile 390×844, reduced-motion 320px. ZIP integrity and absence of audio tracks checked.

Limitation: the managed browser blocks `file://` navigation, so direct-file opening is unverified; HTTP behavior is tested. The supplied movie is 720p/24fps and determines motion/detail quality. Physical mobile browsers remain untested.

Implementation and reproducible checks: `docs/fp-flight-preview.md` and `scripts/check-flight-preview.cjs`.

---

# Design QA — FP Group / Loam recording

Final result: **passed**. Date: 2026-10-28.

## Source and comparison evidence

The user supplied `Запись 2026-10-27 181002.mp4`, local path `/workspace/attachments/bc2ba8cc-7734-45a9-916e-0c62ea2f27b9/Запись 2026-10-27 181002.mp4`. The 1904×906 recording resolves the previous URL-access blocker. Source sections are extracted in `/workspace/artifacts/fp-loam/frames/`. The selected visual state is the first numbered full-screen scene below the reference's hero.

Source capture: `/workspace/artifacts/fp-loam/reference-about-1904.png` at 10 seconds, 1904×906 pixels. Implementation capture: `/workspace/artifacts/fp-loam/about-1904.png`, CSS viewport 1904×906, deviceScaleFactor 1. Both have been opened together in `/workspace/artifacts/fp-loam/reference-comparison.jpg`, a vertically stacked comparison uniformly scaled to 75% for viewing. This is a composition adaptation with user-supplied images, Russian company text and an untouched original FP hero; it is not a pixel-identical clone of the real-estate imagery/content.

Focused evidence: desktop section captures `about`, `services`, `production`, `materials`, `projects`, `geography`, `contact` at 1440×1000 and equivalent mobile captures at 390×844 in the same artifacts directory. Form review and dark-material selection are captured separately. Browser-recorded scrolling is in `public/loam-redesign/walkthrough.mp4` and its extracted review frames in the artifacts directory. Static overview: `public/loam-redesign/preview.jpg`.

## Fidelity surfaces

- Typography: Cormorant Garamond regular/italic closely follows the reference's thin, high-contrast display lettering; Onest supplies small, spaced navigation and readable body copy. Distinct embedded font family names prevent changes to the original hero. Russian line breaks are intentionally different. No clipped headings at 320, 390, 768, 1440 or 1904 px.
- Layout: full-screen photographic scenes, numbered upper-left labels, left and centered copy compositions, a thin fixed-looking sticky light navigation, bottom facts and a narrow centered contact form reproduce the recorded hierarchy. The new materials scene and geographic globe adapt the reference's finish/map scenes to the user's instructions.
- Color: warm ivory navigation, natural photographic colors, dark olive geography and restrained white text. Six newly generated material palettes are included without pasting the user's moodboards. No new gold UI accents.
- Images: user-supplied hero photographs, actual supplied project-gallery photos and generated 1254×1254 material images. No synthetic photographs are presented as completed projects. Geographic rendering uses real country polygons, including dateline handling; it is a data visualization rather than a hand-drawn map.
- Content: FP Group services, experience, furniture manufacturing, real case metrics and contact information replace the real-estate copy. “Вся Россия” follows the user's explicit geography request. Contact submission honestly offers a prepared email rather than a simulated success message.

## Findings and iterations

- [P1, fixed] Initial globe texture created bands near the Arctic because country polygons crossed ±180°. Unwrapped ring longitudes and rendered shifted copies. Re-captured `geography-1440.png`; the Russia outline and land surface now align without bands.
- [P2, fixed] City labels initially sat beneath the WebGL canvas and neighboring labels were too close. Added explicit label stacking and individual offsets; labels are visible in the revised geography capture.
- [P2, fixed] Mobile standards text approached the globe. Increased mobile geography section spacing; the globe follows the copy during normal scrolling.
- [P2, fixed] Frame-dependent globe smoothing took too long on a slow renderer. Converted it to elapsed-time smoothing and adjusted the scroll endpoint. Latest browser check observes progress from 0.011 to 1.000, with the full outline shown.
- [P2, fixed] Clipboard permission can leave an unresolved promise. Added immediate feedback and a timed text-selection fallback. Latest browser check confirms “Текст скопирован.”
- One viewport-switch QA capture caught an in-flight reveal. Fresh capture at the matching viewport and state confirms visible copy; final checks report text opacity 1 at all four tested responsive widths.

No actionable P0/P1/P2 visual or functional findings remain in the agreed standalone scope.

## Functional checks

Chromium with local HTTP and external requests blocked. Console page errors: none. Checked service dialogs and Escape, all six material images/selection states, both three-photo galleries including next/close/focus restoration, mobile navigation, required contact validation, all three form steps, generated mailto data and clipboard behavior. Checked globe movement on scroll, reduced-motion static state, and a forced no-WebGL flat-map fallback. Responsive checks at 320/390/768/1904 px show no horizontal overflow or clipped display text. Reports: `interactions-qa.json`, `qa.json`, `final-check.json` in `/workspace/artifacts/fp-loam/`.

The builder asserts original hero markup, hero script and five original style blocks unchanged. ZIP integrity and byte equality between packaged and built HTML are checked separately. No Next.js files were changed by this implementation.

## Boundaries / follow-up

- Direct file:// navigation is restricted by this environment's browser policy; verification used local HTTP. The output has no fetch/module-server dependency and all new assets are inline.
- Original hero external font URLs are deliberately retained. The email workflow needs the visitor's mail application or manual copying; there is no server endpoint.
- Reference animations were reconstructed from the recording, not the inaccessible live site's implementation.
- Physical-device GPU/browser testing remains a useful follow-up; the renderer pauses offscreen, caps pixel ratio, respects reduced motion and supplies a WebGL fallback.

Implementation checklist: source compared; desktop/mobile inspected; geometry artifacts fixed; controls tested; hero preservation asserted; standalone archive packaged. Final result: passed.
