#!/usr/bin/env python3
"""Build the Loam-inspired lower page around the user's unmodified hero."""
import base64, hashlib, json, re, sys
from pathlib import Path
from html.parser import HTMLParser
from zipfile import ZipFile, ZIP_DEFLATED
ROOT=Path(__file__).resolve().parents[1]
source=Path(sys.argv[1]) if len(sys.argv)>1 else Path('/workspace/artifacts/fp-materials/original.html')
original=source.read_text();parts=ROOT/'src/loam-redesign';output=ROOT/'public/loam-redesign';output.mkdir(exist_ok=True,parents=True)
scripts=re.findall(r'<script[^>]*>(.*?)</script>',original,re.S)
items=json.loads(re.search(r'const items=(.*?);\s*const box=',scripts[2],re.S).group(1))
class Images(HTMLParser):
 def __init__(self):super().__init__();self.photos=[];self.logo=''
 def handle_starttag(self,t,attrs):
  a=dict(attrs)
  if t=='img' and 'photo' in a.get('class','').split():self.photos.append(a['src'])
  if t=='img' and a.get('id')=='logoImage':self.logo=a['src']
p=Images();p.feed(original)
def data(path,mime):return f'data:{mime};base64,'+base64.b64encode(path.read_bytes()).decode()
asset_names=['RECEPTION','RESTAURANT','HOTEL','CAFE_SCENE','OFFICE']
assets={'PROJECT_CAFE':items[0]['images'][1],'PROJECT_BAR':items[1]['images'][0]}
for name in ['ivory','forest','oak','sand','terracotta','stone']:assets[name.upper()]=data(ROOT/'public/structure-redesign/textures'/f'{name}.webp','image/webp')
section=(parts/'sections.html').read_text()
for name in asset_names+list(assets)+['LOGO']:section=section.replace('src="@@'+name+'@@"','data-lm-asset="'+name+'"')
for name in ['arrow','right','close','menu']:section=section.replace('@@'+name.upper()+'@@',(parts/f'icon-{name}.svg').read_text())
css=(parts/'styles.css').read_text().replace("url('@@FOREST@@')",'var(--lm-forest)')
js=(parts/'interactions.js').read_text()
for name in ['PROJECT_CAFE','PROJECT_BAR']:js=js.replace("'@@"+name+"@@'",'fpLoamAssets.'+name)
asset_init='const fpLoamAssets='+json.dumps(assets,ensure_ascii=False,separators=(',',':'))+';\n'
asset_init+='const fpHeroPhotos=[...document.querySelectorAll("#sequence .photo")];\n'
for i,name in enumerate(asset_names):asset_init+=f'fpLoamAssets.{name}=fpHeroPhotos[{i}].src;\n'
asset_init+='fpLoamAssets.LOGO=document.getElementById("logoImage").src;document.querySelectorAll(".lm-site [data-lm-asset]").forEach(el=>el.src=fpLoamAssets[el.dataset.lmAsset]);document.querySelector(".lm-site").style.setProperty("--lm-forest","url("+fpLoamAssets.FOREST+")");\n'
assert '@@' not in section+css+js
fonts=''
for package,family,weight,style in [('onest','FPLoamSans',400,'normal'),('onest','FPLoamSans',500,'normal'),('cormorant-garamond','FPLoamSerif',400,'normal'),('cormorant-garamond','FPLoamSerif',400,'italic')]:
 for subset in ['latin','cyrillic']:
  filename=f'{package}-{subset}-{weight}-{style}.woff2'
  file=parts/'fonts'/filename if package=='onest' else ROOT/'node_modules/@fontsource'/package/'files'/filename
  region='U+0400-045F,U+0490-0491,U+04B0-04B1,U+2116' if subset=='cyrillic' else 'U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD'
  fonts+=f"@font-face{{font-family:{family};font-weight:{weight};font-style:{style};font-display:swap;src:url({data(file,'font/woff2')}) format('woff2');unicode-range:{region}}}\n"
start=original.index('<section class="nx-intro');end=original.index('</footer>',start)+len('</footer>')
result=original[:start]+section+original[end:]
result=result.replace('</head>','<style id="fp-loam-style">'+fonts+css+'</style>\n</head>')
result=result.replace('<script>'+scripts[1]+'</script>','')
result=result.replace('</body>','<script>'+asset_init+js+'</script>\n<script>'+(parts/'globe.bundle.js').read_text()+'</script>\n</body>')
hero=original[original.index('<section aria-label="Направления ремонта'):start].strip()
assert hero in result
assert scripts[0] in result
styles=re.findall(r'<style[^>]*>(.*?)</style>',original,re.S)
assert all(s in result for s in styles)
(output/'index.html').write_text(result)
manifest={'source_sha256':hashlib.sha256(original.encode()).hexdigest(),'hero_sha256':hashlib.sha256(hero.encode()).hexdigest(),'hero_markup_unchanged':True,'hero_script_unchanged':True,'original_style_blocks_unchanged':len(styles),'reference':'user recording 2026-10-27 181002.mp4','geography_source':'Natural Earth via world-atlas 2.0.2, 1:110m country polygons'}
(output/'preservation.json').write_text(json.dumps(manifest,indent=2,ensure_ascii=False))
with ZipFile(ROOT/'public/downloads/fp-group-loam.zip','w',ZIP_DEFLATED,compresslevel=9) as z:
 z.writestr('index.html',result)
 z.writestr('THIRD_PARTY.txt',(parts/'THIRD_PARTY.txt').read_text())
 z.writestr('ПРОЧИТАТЬ.txt','FP Group — версия по видеореференсу Loam House\n\nРаспакуйте архив и откройте index.html. Устанавливать программы не нужно.\nПервый экран сохранён из вашего исходного файла. Нажмите «О подходе», чтобы перейти к новым разделам.\nПрокрутка двигает фотографии и приближает глобус к России. На мобильном телефоне откройте меню кнопкой справа.\nМатериалы переключаются круглыми образцами; проекты — кнопками с названиями. Фотографии проектов открываются в галерее.\nФорма готовит письмо, которое нужно отправить через ваше почтовое приложение. Автоматической отправки на сервер нет.\nИзображения, новые шрифты и 3D-модуль встроены в HTML. Исходные Google Fonts первого экрана сохранены без изменений.\nПри отключённом WebGL вместо глобуса отображается карта.\n')
print(json.dumps({'html_bytes':len(result.encode()),'zip_bytes':(ROOT/'public/downloads/fp-group-loam.zip').stat().st_size,**manifest},indent=2,ensure_ascii=False))
