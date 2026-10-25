import { build } from 'esbuild';
import { readFile, writeFile } from 'node:fs/promises';
const result = await build({ entryPoints: ['scripts/cube-preview-entry.tsx'], bundle: true, minify: true, write: false, outfile: 'preview.js', jsx: 'automatic', loader: { '.woff2': 'dataurl', '.woff': 'dataurl' }, define: { 'process.env.NODE_ENV': '"production"' } });
const js = result.outputFiles.find(f => f.path.endsWith('.js')).text.replaceAll('</script', '<\\/script');
const css = result.outputFiles.find(f => f.path.endsWith('.css')).text;
const asset = async (path, type) => `data:${type};base64,${(await readFile(path)).toString('base64')}`;
const film = JSON.parse(await readFile('src/lib/cube-film.json', 'utf8'));
const assets = {
  video: await asset(`public${film.video}`, 'video/mp4'),
  posters: await Promise.all(film.chapters.map(chapter => asset(`public/images/spaces/${chapter.id}.jpg`, 'image/jpeg'))),
};
const html = `<!doctype html><html lang="ru"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="dark"><title>ПРОСТРАНСТВО — пример со скроллом</title><style>html{scroll-behavior:smooth}body{margin:0;background:#141616;-webkit-font-smoothing:antialiased}button{font:inherit}img{max-width:100%}@media(prefers-reduced-motion:reduce){html{scroll-behavior:auto}}${css}</style></head><body><div id="root"></div><script>window.__CUBE_ASSETS__=${JSON.stringify(assets)};</script><script>${js}</script></body></html>`;
await writeFile('preview.html', html);
console.log(`preview.html: ${(Buffer.byteLength(html)/1024/1024).toFixed(1)} MB, no server or network required`);
