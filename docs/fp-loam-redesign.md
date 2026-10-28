# FP Group — full-screen redesign from the supplied Loam House recording

The current reference is the user's 33.97-second recording `Запись 2026-10-27 181002.mp4` (1904×906). It supersedes the inaccessible Structure Engineering URL and the unfinished editorial draft. The original uploaded FP Group hero remains intact.

## Deliverables

- `public/loam-redesign/index.html`: standalone page; images, new fonts, geography data and Three.js are embedded.
- `public/downloads/fp-group-loam.zip`: extract and open `index.html`; no Node installation needed.
- `public/loam-redesign/walkthrough.mp4`: approximately 30 seconds of actual browser-rendered scrolling and interactions, without audio.
- `public/loam-redesign/preview.jpg`: overview of six new sections.

“О подходе” in the original hero goes to the new content. The lower page has its own sticky light navigation; the source hero navigation and five-scene scroll animation are unchanged.

## Implemented behavior

Seven full-screen scenes: company, capabilities, furniture, materials, real projects, geography and contact. Scroll moves the photographs with parallax; copy enters with a small translation and blur and fades as its scene leaves the viewport. Pointer movement adds a subtle photographic offset on desktop. Six newly generated materials crossfade when selected. Services open native dialogs. Both documented projects retain their original three-image galleries, with keyboard focus restoration.

The geography section renders a real Three.js globe using Natural Earth 1:110m country polygons from world-atlas 2.0.2. Scroll turns and zooms the camera toward Russia and progressively draws its outline. Moscow, Ufa and Chelyabinsk markers use geographic coordinates. The user explicitly requested “вся Россия”; this is the displayed coverage message, not an invented list of completed projects. A flat geographic map is available if WebGL cannot initialize. Reduced-motion preference disables parallax and displays the completed globe state.

The contact form has contact/object/email-review steps. It prepares a mailto message and offers copying its text. It does not claim to send data to a backend. The original hero's existing email form remains untouched.

## Preservation and sources

`preservation.json` records byte-exact preservation assertions for the supplied hero markup, its interaction script and all five original style blocks. New styles are scoped to `.lm-site`, and fonts have distinct family names. The obsolete lower-section script that threw on a nonexistent gallery target is removed, as in the prior materials version.

The user's own hero images are reused in the lower scenes. Real project photographs come from the supplied HTML's galleries. Six generated textures are referenced from `public/structure-redesign/textures/`; provenance is recorded there. No frames from the Loam recording are used as background assets. Geographic and library/font notices are in `src/loam-redesign/THIRD_PARTY.txt` and the downloadable ZIP.

Repeated images are assigned through a shared inline asset registry; this reduced the ZIP from approximately 15.5 MB to 8.9 MB without reducing image quality. The original hero retains its Google Fonts links exactly as supplied.

## Rebuild

```sh
node_modules/.bin/esbuild src/loam-redesign/globe.js --bundle --minify --format=iife --outfile=src/loam-redesign/globe.bundle.js
python3 scripts/build-loam-redesign.py /path/to/original/index.html
```

Source components are in `src/loam-redesign/`. The build uses the repository's existing Three.js, esbuild and Cormorant Garamond dependency; Onest fonts are included alongside the new source. This does not modify the existing Next.js application.

See root `design-qa.md` for browser verification and known boundaries. The earlier Chrome download warning has not been diagnosed because its exact text was not supplied; no claim is made that repackaging resolves it.
