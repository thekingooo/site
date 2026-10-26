#!/usr/bin/env python3
"""Restyle only the blocks after the hero in the user's standalone HTML."""
import base64
import hashlib
import json
import re
import sys
from pathlib import Path
from zipfile import ZipFile, ZIP_DEFLATED

ROOT = Path(__file__).resolve().parents[1]
SOURCE = Path(sys.argv[1]) if len(sys.argv)>1 else Path('/workspace/attachments/5ff1dc6a-6501-4632-99b4-5e4cfcf79862/index.html')
original = SOURCE.read_text()
blocks = ROOT/'src/materials-redesign'
output = ROOT/'public/materials-redesign'
output.mkdir(parents=True, exist_ok=True)
def data(path, mime):return f'data:{mime};base64,'+base64.b64encode(path.read_bytes()).decode()
scripts = re.findall(r'<script[^>]*>(.*?)</script>', original, re.S)
items = json.loads(re.search(r'const items=(.*?);\s*const box=',scripts[2],re.S).group(1))
logo = re.search(r'<img[^>]*id="logoImage"[^>]*src="([^"]+)"',original).group(1)
section = (blocks/'sections.html').read_text()
css = (blocks/'styles.css').read_text()
section = section.replace('@@CAFE@@',items[0]['images'][0]).replace('@@BAR@@',items[1]['images'][0]).replace('@@LOGO@@',logo)
for name in ['arrow','right','plus','minus','down']:
    section=section.replace('@@'+name.upper()+'@@',(blocks/f'icon-{name}.svg').read_text())
for name in ['sand','forest','oak','ivory','terracotta','marble']:
    css=css.replace('@@'+name.upper()+'@@',data(output/'textures'/f'{name}.webp','image/webp'))
fonts=''
for package,family,weight,style in [('manrope','FPMaterialSans',400,'normal'),('manrope','FPMaterialSans',500,'normal'),('cormorant-garamond','FPMaterialSerif',400,'normal'),('cormorant-garamond','FPMaterialSerif',400,'italic')]:
    for subset in ['latin','cyrillic']:
        file=ROOT/f'node_modules/@fontsource/{package}/files/{package}-{subset}-{weight}-{style}.woff2'
        region='U+0400-045F,U+0490-0491,U+04B0-04B1,U+2116' if subset=='cyrillic' else 'U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD'
        fonts+=f"@font-face{{font-family:{family};font-weight:{weight};font-style:{style};font-display:swap;src:url({data(file,'font/woff2')}) format('woff2');unicode-range:{region}}}\n"
start=original.index('<section class="nx-intro')
end=original.index('</footer>',start)+len('</footer>')
result=original[:start]+section+original[end:]
result=result.replace('</head>','<style id="fp-materials-style">'+fonts+css+'</style>\n</head>')
# Remove the obsolete pre-gallery zoom listener: its target doesn't exist in the source.
result=result.replace('<script>'+scripts[1]+'</script>','')
result=result.replace('</body>','<script>'+(blocks/'interactions.js').read_text()+'</script>\n</body>')
assert '@@' not in result
# Exact source preservation checks for the hero and all five original style blocks.
hero_start=original.index('<section aria-label="Направления ремонта')
hero=original[hero_start:start].strip()
assert hero in result
styles=re.findall(r'<style[^>]*>(.*?)</style>',original,re.S)
for style in styles:assert style in result
assert scripts[0] in result
(output/'index.html').write_text(result)
(output/'preservation.json').write_text(json.dumps({'source_sha256':hashlib.sha256(original.encode()).hexdigest(),'hero_sha256':hashlib.sha256(hero.encode()).hexdigest(),'hero_markup_unchanged':True,'original_styles_unchanged':len(styles),'hero_script_unchanged':True},indent=2))
archive=ROOT/'public/downloads/fp-group-materials.zip'
with ZipFile(archive,'w',ZIP_DEFLATED,compresslevel=9) as z:
    z.writestr('index.html',result)
    z.writestr('ПРОЧИТАТЬ.txt','FP Group — новая фактурная версия\n\nРаспакуйте архив и откройте index.html в браузере.\nГлавный экран сохранён из вашего файла без изменений.\nНовые блоки находятся ниже пяти направлений первого экрана.\nНажмите «О подходе» в шапке, чтобы сразу перейти к ним.\nУслуги раскрываются по нажатию; фотографии двух проектов открываются в галерее.\nИзображения, новые текстуры и шрифты нижних блоков встроены в файл.\nИсходные ссылки на Google Fonts в первом экране сохранены как в вашем файле.\nКонтактная форма готовит письмо в вашем почтовом приложении.\n')
print(json.dumps({'html_bytes':len(result.encode()),'zip_bytes':archive.stat().st_size,'hero_sha256':hashlib.sha256(hero.encode()).hexdigest()},indent=2))
