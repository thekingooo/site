from pathlib import Path
from html.parser import HTMLParser
from html import escape
from zipfile import ZipFile,ZIP_DEFLATED
import re,json,base64
root=Path(__file__).resolve().parents[1];src=root/'src/evercoat-preview';out=root/'public/evercoat-preview';assets=out/'assets'
assets.mkdir(exist_ok=True,parents=True)
original=Path('/workspace/artifacts/fp-materials/original.html').read_text()
class P(HTMLParser):
 def handle_starttag(self,t,attrs):
  a=dict(attrs)
  if t=='img' and a.get('id')=='logoImage':self.logo=a['src']
p=P();p.feed(original);(assets/'logo.png').write_bytes(base64.b64decode(p.logo.split(',')[1]))
scripts=re.findall(r'<script[^>]*>(.*?)</script>',original,re.S)
items=json.loads(re.search(r'const items=(.*?);\s*const box=',scripts[2],re.S).group(1))
for i,project in enumerate(items[:2]):
 for j,image in enumerate(project['images']):
  (assets/f'project-{i}-{j}.jpg').write_bytes(base64.b64decode(image.split(',')[1]))
# Prepared separately from the new source; never overwrite with the old film.
manifest=json.loads((out/'media/manifest.json').read_text())
assert manifest['width']==1920 and manifest['height']==1080, 'Run prepare-evercoat-media.py first'
icons=src/'icons.json'
html=(src/'index.html').read_text()
projects=json.loads((src/'projects.json').read_text())
cards=[]
for i,project in enumerate(projects):
 assert project['images'] and project['cover'] in project['images']
 for path in project['images']:assert (out/path).is_file(), path
 location=(project['city'] or project['kind']).upper()
 area=f"{project['area']} М²" if project['area'] else ''
 project['meta']=' · '.join(str(value).upper() for value in [project['city'],project['kind'],area,project['duration']] if value)
 cards.append(f'''<button class="project-card reveal" data-project="{i}"><div class="image-wrap"><img src="{escape(project['cover'])}" alt="{escape(project['title'])} — интерьер объекта" loading="lazy"><span class="round">@@PLUS@@</span></div><div class="project-meta"><span>{escape(location)}</span><span>{escape(area)}</span></div><h3>{escape(project['title'])}</h3><p>{escape(project['summary'])}</p></button>''')
html=html.replace('@@PROJECT_CARDS@@','\n'.join(cards))
# Use the original transparent mark as an inline alpha mask: its contours stay
# exact, while the symbol and wordmark receive the requested two brand colors.
logo=f'''<svg class="brand-logo" viewBox="0 0 1096 279" width="142.8" height="36.35" aria-hidden="true"><defs><mask id="fp-brand-mask" maskUnits="userSpaceOnUse" x="0" y="0" width="1096" height="279" style="mask-type:alpha"><image href="{p.logo}" width="1096" height="279"/></mask></defs><g mask="url(#fp-brand-mask)"><path fill="#193247" d="M0 0h1096v279H0z"/><path fill="#b59f6d" d="M0 0h310v279H0z"/></g></svg>'''
html=html.replace('@@HEADER_LOGO@@',logo)
for name,svg in json.loads(icons.read_text()).items():html=html.replace('@@'+name+'@@',svg)
assert '@@' not in html
fonts=''
for package,family,weight,style in [('onest','FPHeroSans',400,'normal'),('onest','FPHeroSans',600,'normal'),('cormorant-garamond','FPHeroSerif',400,'italic')]:
 for subset in ['latin','cyrillic']:
  name=f'{package}-{subset}-{weight}-{style}.woff2'
  file=root/'src/loam-redesign/fonts'/name if package=='onest' else root/'node_modules/@fontsource'/package/'files'/name
  data=base64.b64encode(file.read_bytes()).decode()
  region='U+0400-045F,U+0490-0491,U+04B0-04B1,U+2116' if subset=='cyrillic' else 'U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD'
  fonts+=f"@font-face{{font-family:{family};font-weight:{weight};font-style:{style};font-display:swap;src:url(data:font/woff2;base64,{data}) format('woff2');unicode-range:{region}}}\n"
app=(src/'app.js').read_text().replace('@@PROJECT_DATA@@',json.dumps(projects,ensure_ascii=False,separators=(',',':')).replace('</','<\\/'))
html=html.replace('/* INLINE_STYLES */',fonts+(src/'styles.css').read_text()).replace('/* INLINE_FLIGHT */',(src/'flight.js').read_text()).replace('/* INLINE_APP */',app)
assert '@@' not in html
(out/'index.html').write_text(html)
readme='''FP GROUP — новая версия по записи Evercoat, 31 октября 2026

Распакуйте архив и откройте index.html. Папки assets и media должны оставаться рядом.
Один жест колёсика — один завершённый пролёт. Обратно — предыдущее помещение.
Использовано ваше новое видео e12752d3466bdbdeb7260be739a7f100_b1e1f7db-d765-46e9-9bb2-be7fa72c2684.mp4, полученное из четырёх частей RAR. Исходник: 1920×1080, 30 кадров/с, 12 секунд.
Клипы для сайта сохранены в Full HD, без звука. Пролёты ×3: примерно 0,58–1,04 секунды. Размытие усиливается в середине движения и исчезает при остановке. Движение назад — обратное воспроизведение тех же переходов.

На главном экране обновлены тексты всех пяти помещений по вашим примерам. Логотип в шапке уменьшен на 15% и окрашен в песочный и тёмно-синий. Тонкая рамка отображается в обоих режимах; подсказка прокрутки анимирована (кроме режима без анимации).
Структура, размеры и оформление восстановлены по вашей записи Evercoat. На первом экране используются встроенные Onest и Cormorant Garamond, в остальных блоках — Arial и Georgia.
В портфолио четыре объекта и 19 фотографий из ваших архивов: EL MACHETE, «Мама варит кофе», стоматология «Демократ» и кафе на Стремянном. Последнее временно занимает четвёртое место по вашему выбору. Город и площадь двух новых объектов пока не указаны — их можно добавить позже.
Форма подготавливает письмо для отправки через ваше почтовое приложение. Серверная отправка не подключена.
'''
(out/'README.txt').write_text(readme)
with ZipFile(root/'public/downloads/fp-group-evercoat.zip','w',ZIP_DEFLATED,compresslevel=6) as z:
 for folder in ['assets','media']:
  for f in (out/folder).iterdir():z.write(f,f.relative_to(out))
 z.writestr('index.html',html);z.writestr('ПРОЧИТАТЬ.txt',readme)
 licenses=(root/'node_modules/lucide-react/LICENSE').read_text()
 licenses+='\n\nONEST\n'+(root/'src/loam-redesign/fonts/onest-LICENSE.txt').read_text()
 licenses+='\n\nCORMORANT GARAMOND\n'+(root/'node_modules/@fontsource/cormorant-garamond/LICENSE').read_text()
 z.writestr('THIRD_PARTY.txt',licenses)
print('Built',out,'ZIP bytes:',(root/'public/downloads/fp-group-evercoat.zip').stat().st_size)
