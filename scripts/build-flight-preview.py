"""Build a separate review version; keep the previously delivered site untouched."""
from pathlib import Path
from html.parser import HTMLParser
from zipfile import ZipFile,ZIP_DEFLATED
import re,json,hashlib
root=Path(__file__).resolve().parents[1]
parts=root/'src/flight-preview';out=root/'public/flight-preview'
source=(root/'public/loam-redesign/index.html').read_text()
class Logo(HTMLParser):
 def handle_starttag(self,tag,attrs):
  a=dict(attrs)
  if tag=='img' and a.get('id')=='logoImage':self.src=a['src']
p=Logo();p.feed(source)
hero=(parts/'hero.html').read_text().replace('@@LOGO@@',p.src)
for name in ['left','right','down','upright']:hero=hero.replace('@@'+name.upper()+'@@',(parts/(name+'.svg')).read_text())
start=source.index('<section aria-label="Направления ремонта');end=source.index('<div class="lm-site"',start)
result=source[:start]+hero+'\n'+source[end:]
scripts=re.findall(r'<script[^>]*>(.*?)</script>',source,re.S)
assert 'const seq=' in scripts[0]
result=result.replace('<script>'+scripts[0]+'</script>','')
result=result.replace('const fpHeroPhotos=[...document.querySelectorAll("#sequence .photo")];','')
for name,i in [('RECEPTION',0),('RESTAURANT',1),('CAFE_SCENE',2),('OFFICE',3),('HOTEL',4)]:
 result=re.sub(r'fpLoamAssets\.'+name+r'=fpHeroPhotos\[\d\]\.src;',f'fpLoamAssets.{name}="media/original-{i}.webp";',result)
assert 'fpHeroPhotos' not in result
result=re.sub(r'<link[^>]*href=["\'][^"\']*fonts\.google[^>]*>', '', result)
result=result.replace('</head>','<style id="flight-style">'+(parts/'styles.css').read_text()+'</style></head>')
result=result.replace('</body>','<script>'+(parts/'controller.js').read_text()+'</script></body>')
result=re.sub(r'<title>.*?</title>','<title>FP Group — путешествие по пространствам</title>',result,flags=re.S)
(out/'index.html').write_text(result)
readme='''FP GROUP — ПРОЛЁТ МЕЖДУ ПЯТЬЮ ПОМЕЩЕНИЯМИ

Распакуйте весь архив. Откройте index.html в Chrome, Edge, Safari или Firefox.
Папка media должна оставаться рядом с index.html.

Одно движение колёсика — один завершённый пролёт.
Во время пролёта дополнительные прокрутки игнорируются и не копятся.
После остановки сделайте новую прокрутку, чтобы перейти дальше.
Обратная прокрутка возвращает в предыдущее помещение.
Можно пользоваться стрелками на экране, клавишами ↑/↓ или свайпами.
После номера отеля следующая прокрутка открывает информацию о компании.
«Перейти к сайту» позволяет пропустить просмотр; кнопка «Без анимации» переключает оригиналы изображений.

Пролёты используют ваше видео 1280×720, 24 кадра/с, без звука.
Остановки — кадры того же видео, чтобы не было скачка между фотографией и видео.
Оригиналы из архива используются в режиме без анимации и нижних разделах.
Форма в нижней части страницы готовит письмо для отправки через почтовое приложение.
'''
(out/'README.txt').write_text(readme)
zipfile=root/'public/downloads/fp-group-flight.zip'
with ZipFile(zipfile,'w',ZIP_DEFLATED,compresslevel=6) as z:
 z.writestr('index.html',result);z.writestr('ПРОЧИТАТЬ.txt',readme)
 z.writestr('THIRD_PARTY.txt',(root/'src/loam-redesign/THIRD_PARTY.txt').read_text())
 for f in sorted((out/'media').iterdir()):z.write(f,'media/'+f.name)
print(json.dumps({'html_bytes':len(result.encode()),'zip_bytes':zipfile.stat().st_size,'html_sha256':hashlib.sha256(result.encode()).hexdigest()},indent=2))
