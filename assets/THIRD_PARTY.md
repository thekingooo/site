# Third-party source textures

All architectural and furniture geometry in the new office GLB is authored by
`scripts/build_architecture.py`. No third-party furniture mesh is included.

## Wood photograph

- File: `source/wood-diffuse.jpg`
- Source: three.js `examples/textures/hardwood2_diffuse.jpg`
- URL and SHA-256: `source/manifest.json`
- License: MIT, three.js authors. Full notice in `source/three-license.txt`.
- Used as a restrained grain source in Blender; Cycles results are baked into
  the GLB light atlases.

## Studio environment

- Files: `source/lebombo.hdr`, runtime copy `../public/models/studio.hdr`
- Asset: Lebombo, Greg Zaal / Poly Haven, CC0.
- Asset page: https://polyhaven.com/a/lebombo
- Downloaded from the pmndrs/drei-assets public mirror. URL and SHA-256 are
  recorded in `source/manifest.json`.

