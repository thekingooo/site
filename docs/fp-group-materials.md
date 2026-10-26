# FP Group: material palette redesign

The input is the user's standalone `index.html`, SHA-256 `a7cba62258ecf15fc0c9782bfb0ea14367d9b8cfe60e536f9d8ac27c0c526079`. This is a separate deliverable from the previous Next.js cube prototype.

## Open the result

Download `public/downloads/fp-group-materials.zip`, extract it and open `index.html`. Use “О подходе” in the original header to reach the new sections immediately. The deliverable has embedded images, six generated textures and lower-section fonts. The original hero's Google Fonts links remain untouched.

## Scope

The hero markup, all five original stylesheets and the hero's scroll/navigation/contact script are preserved verbatim. Only the sections after the hero are replaced. New styling is scoped to `.mt-site` and `mt-` classes, with distinct font family names. `public/materials-redesign/preservation.json` records the preservation assertions and source hashes.

The new sequence is sand plaster/about, botanical green/services, ivory/projects, terracotta/process, oak/furniture production, charcoal marble/clients, fluted ivory/contact, green/footer. Source company information and the two original project galleries are retained. Project photographs are not synthetic. The six material textures were newly generated from the user's material direction and exported to high-quality WebP at 1254×1254 or 1536×1024.

Removed one obsolete lower-section zoom handler that referenced a nonexistent element and threw on page load. The original gallery remains; keyboard focus restoration and trapping were added. Contact buttons invoke the existing contact dialog, whose form prepares an email in the visitor's mail application; there is no new backend.

## Rebuild

Install the repository's dependencies for `@fontsource/manrope` and `@fontsource/cormorant-garamond`, then run:

```sh
python3 scripts/build-materials-redesign.py /path/to/original/index.html
```

Sources are in `src/materials-redesign/`; textures are in `public/materials-redesign/textures/`. Output is a standalone HTML, preservation manifest and ZIP. The builder asserts that hero markup, styles and script have not changed. It deliberately takes the original user file as an explicit input rather than modifying the prior Next.js app.
