# FP Group — Evercoat recording adaptation

New independent review version at `public/evercoat-preview`. Source: the user's 1902×910 screen recording `Запись 2026-10-30 130340.mp4`, 14.43 seconds. The live reference `evercoatpainterco.com` and its www hostname were inaccessible in the execution environment (CONNECT 403 / browser tunnel failure). This is a reconstruction from the supplied recording, not a claim to have retrieved or copied the site's DOM/CSS.

## Design evidence

The recording shows a fixed 94px ivory header with centered navigation, a dark-blue pill CTA, a full-width video hero, a 1320px central content column at 1902px viewport, heavy sans-serif headings with Georgia-like italic second phrases, three service cards, a before/after block, a two-image inspiration section, a navy advantages section, four process columns, an image/text company section with an experience medallion, a central statement, FAQ accordions, a pale contact section with a white form, and navy footer. These patterns and desktop proportions are carried into the draft. The user explicitly replaced the before/after block with four portfolio cards in one row.

Fonts are local system Arial and Georgia, selected from visible shapes; the actual source font files and mobile source were unavailable. Mobile layout is an adaptation. Recorded entry motion is approximated with opacity/vertical reveals, and cards have hover zoom. Navigation, service dialogs, galleries, FAQ, menu, and email preparation work locally. No source-company photos, branding, claims or contact data are reused.

## Company content

The supplied PDF was inspected as 16 rendered slides (it contains no extractable text). Claims: 8 years, more than 100 projects, own furniture production, full cycle design/construction/engineering/equipment/furniture, and SRO; contacts from slide 16. The two documented projects are the Moscow café on Stremyanny (168m², 45 days, slides 11–12) and EL MACHETE in Ufa (111m², 42 days, slides 13–14). Existing embedded photos from the user's earlier HTML provide their galleries. The logo is the same supplied mark, displayed dark in the header and white in the footer.

Two portfolio slots are explicitly pending and are not represented as verified completed case studies. Names, areas, business types and photos are still needed. The row stays horizontal on small screens with swipe scrolling.

## Flight module

Temporary source: the previously available 720p/24fps fly-through, with frame-aligned forward and reverse clips. The newly uploaded `e12752d3466bdbdeb7260be739a7f100_b1e1f7db-d765-46e9-9bb2-be7fa72c2684.mp4` exceeds the 32 MiB transfer limit. The supplied Google Drive page/download URLs also returned 403. The new video has not been viewed or substituted in this draft.

One gesture launches one whole transition; further input is discarded during the flight. 3× playback gives about 0.85–1.10 second flights. The blur rises smoothly to 11px with a 4.5% overscan, then resets completely at arrival. Reverse uses baked reversed clips. No audio. Original renders are available through reduced-motion mode. Large-scale geometry inconsistencies already present in the source film are not reconstructed or repaired.

## Run and build

```sh
python scripts/build-evercoat-preview.py
python -m http.server 3340 --directory public/evercoat-preview
```

The downloadable ZIP includes index.html, assets and media. Extract all files together. Contact form prepares a mailto message; no server delivery is implemented. Previous Loam and flight versions are left intact.

## Remaining inputs

- Accessible new video (archive parts under 30 MB can preserve original quality).
- Two more completed project photo sets and metadata.
- The exact source fonts/mobile behavior require source access if pixel-level reproduction is needed.
