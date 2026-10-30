from pathlib import Path
from html.parser import HTMLParser
from zipfile import ZipFile,ZIP_DEFLATED
import re,json,base64,shutil
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
# The new uploaded film is not accessible yet. This draft explicitly reuses the prior film.
shutil.copytree(root/'public/flight-preview/media',out/'media',dirs_exist_ok=True)
icons=src/'icons.json'
html=(src/'index.html').read_text()
for name,svg in json.loads(icons.read_text()).items():html=html.replace('@@'+name+'@@',svg)
assert '@@' not in html
html=html.replace('/* INLINE_STYLES */',(src/'styles.css').read_text()).replace('/* INLINE_FLIGHT */',(src/'flight.js').read_text()).replace('/* INLINE_APP */',(src/'app.js').read_text())
(out/'index.html').write_text(html)
readme='''FP GROUP — новая версия по записи Evercoat, 30 октября 2026

Распакуйте архив и откройте index.html. Папки assets и media должны оставаться рядом.
Один жест колёсика — один завершённый пролёт. Обратно — предыдущее помещение.
Использован ранее доступный ролик: новое видео больше 32 МБ, Google Drive недоступен из рабочей среды. Этот ролик временный.
Пролёты ×3, размытие усиливается в середине движения и исчезает при остановке.

Структура, размеры и оформление восстановлены по вашей записи Evercoat. Точные исходные шрифты и мобильная версия сайта недоступны; использованы Arial и Georgia с адаптивной вёрсткой.
В портфолио заполнены два подтверждённых объекта. Третье и четвёртое места ожидают фотографий, названий и площадей.
Форма подготавливает письмо для отправки через ваше почтовое приложение. Серверная отправка не подключена.
'''
(out/'README.txt').write_text(readme)
with ZipFile(root/'public/downloads/fp-group-evercoat.zip','w',ZIP_DEFLATED,compresslevel=6) as z:
 for folder in ['assets','media']:
  for f in (out/folder).iterdir():z.write(f,f.relative_to(out))
 z.writestr('index.html',html);z.writestr('ПРОЧИТАТЬ.txt',readme)
 z.writestr('THIRD_PARTY.txt',(root/'node_modules/lucide-react/LICENSE').read_text())
print('Built',out,'ZIP bytes:',(root/'public/downloads/fp-group-evercoat.zip').stat().st_size)
