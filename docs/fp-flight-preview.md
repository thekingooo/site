# FP Group — discrete room flights

The user supplied a continuous 1280×720, 24 fps film and the five original renders (11.png–15.png). This review version replaces the first screen with a full-screen journey in this order: lobby, restaurant, café, blue office, hotel bedroom. The previously delivered `public/loam-redesign` stays available unchanged.

## Behavior

A single nonzero vertical wheel event starts one complete flight. Further wheel events during the flight are discarded, never queued. A continuous wheel/trackpad tail is also ignored after arrival until a fresh gesture follows a 200 ms quiet interval. A 240 ms arrival cooldown avoids accidental immediate retriggering. Reverse scrolling uses a separately encoded reverse segment. Keyboard arrows/Page Up/Page Down/Space, adjacent-room buttons and touch swipes are supported.

The film pauses indefinitely in each room. After room five, the next downward gesture continues to the company section. Navigation links and the skip link offer an exit before starting a flight; they do not interrupt an active flight. Returning to the first screen preserves the current room. The lower-page navigation, project galleries, materials, globe and mail-preparation form remain from the Loam iteration.

Reduced-motion preference and the visible “Без анимации” toggle show the supplied original renders with immediate room changes. A media failure falls back to the destination still and an honest status message. Audio tracks were removed.

## Media and fidelity

Stop frames: 0, 60, 120, 180, 258 (0, 2.5, 5, 7.5, 10.75 seconds). Each pair of clips shares the exact boundary source frame; forward/reverse clips include both endpoints. Stop posters are lossless WebP extracts of those frames. This prevents the composition from changing suddenly between a video frame and a separately generated original image. Original PNGs were converted to quality-95 WebP for reduced-motion mode and lower sections.

This version deliberately uses the supplied video, not reconstructed 3D or generated extra frames. Its image fidelity and any architectural inconsistencies are limited by the source film. There is no 2K or higher-resolution claim.

## Build and check

```sh
python scripts/prepare-flight-media.py /path/to/source.mp4 /path/to/extracted-originals
python scripts/build-flight-preview.py
python -m http.server 3335 --directory public/flight-preview
# In another terminal:
node scripts/check-flight-preview.cjs
```

The builder generates `public/flight-preview/index.html` and `public/downloads/fp-group-flight.zip`. Extract the entire ZIP and keep `media` next to the HTML. All new fonts, images and video are local or embedded. No backend or additional install is required for the example. Lower-page contact forms still prepare email; they do not submit to a server.

## Verification, 28 October 2026

Chromium desktop 1440×900: one 1-unit wheel delta completes a flight, sustained wheel input across the flight and arrival stays in one destination, reverse direction works, all five stops are reached in order, keyboard navigation works, final exit and return from the lower page work. Mobile emulation 390×844: real CDP touch swipe completes one transition; layout is contained. Reduced motion at 320px switches original stills without playing video. Blocked video requests recover to a destination still. No page JavaScript errors in these checks.

Screenshots and the browser recording were inspected. The testing browser prohibits `file://` navigation with `ERR_BLOCKED_BY_ADMINISTRATOR`; direct file opening could not be checked in that managed browser. HTTP-served behavior was tested. Physical iOS/Android devices and other desktop browsers were not tested.
