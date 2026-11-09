from pathlib import Path
from html.parser import HTMLParser
from html import escape
from zipfile import ZipFile,ZipInfo,ZIP_DEFLATED
from datetime import datetime
import re,json,base64,subprocess,shutil
from evercoat_seo import build_seo
root=Path(__file__).resolve().parents[1];src=root/'src/evercoat-preview';out=root/'public/evercoat-preview';assets=out/'assets'
assets.mkdir(exist_ok=True,parents=True)
subprocess.run(['node',str(root/'scripts/prepare-evercoat-favicons.cjs')],check=True)
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
seo=json.loads((src/'seo.json').read_text())
seo_head,robots,sitemap=build_seo(seo)
html=html.replace('@@SEO_HEAD@@',seo_head)
# Reuse the approved homepage screenshot unchanged for link previews.
shutil.copyfile(out/'preview.jpg',out/seo['image'])
(out/'robots.txt').write_text(robots)
(out/'sitemap.xml').write_bytes(sitemap)
projects=json.loads((src/'projects.json').read_text())
cards=[]
for i,project in enumerate(projects):
 assert project['images'] and project['cover'] in project['images']
 for path in project['images']:assert (out/path).is_file(), path
 location=project['kind'].upper()
 area=f"{project['area']} М²" if project['area'] else ''
 project['meta']=' · '.join(str(value).upper() for value in [project['kind'],area,project['duration']] if value)
 position=escape(project.get('cover_position','center'))
 cards.append(f'''<button class="project-card reveal" data-project="{i}"><div class="image-wrap"><img src="{escape(project['cover'])}" style="object-position:{position}" alt="{escape(project['title'])} — интерьер объекта" loading="lazy"><span class="round">@@PLUS@@</span></div><div class="project-meta"><span>{escape(location)}</span><span>{escape(area)}</span></div><h3>{escape(project['title'])}</h3><p>{escape(project['summary'])}</p></button>''')
html=html.replace('@@PROJECT_CARDS@@','\n'.join(cards))
services=json.loads((src/'services.json').read_text())
service_cards=[]
for i,service in enumerate(services):
 service_cards.append(f'''<button class="service-card reveal" data-service="{i}"><div class="image-wrap service-visual service-visual-{i}" role="img" aria-label="{escape(service['image'])}"><span class="number">{i+1:02}</span><span class="round">@@ARROW@@</span></div><span class="service-title-icon">@@{service['icon']}@@</span><h3>{escape(service['title'])}</h3><p>{escape(service['description'])}</p></button>''')
html=html.replace('@@SERVICE_CARDS@@','\n'.join(service_cards))
journey=json.loads((src/'journey.json').read_text())
steps=[]
for i,(icon,title,description) in enumerate(journey):
 steps.append(f'''<li><button class="road-step" data-step="{i}" aria-label="Этап {i+1}: {escape(title)}"><span class="road-dot" aria-hidden="true"></span><span class="road-icon" aria-hidden="true">@@{icon}@@</span><span class="road-title">{escape(title)}</span><span class="road-description">{escape(description)}</span></button></li>''')
html=html.replace('@@JOURNEY_STEPS@@','\n'.join(steps))
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
service_data=[[s['title'],s['description'],s['details']] for s in services]
app=app.replace('@@SERVICE_DATA@@',json.dumps(service_data,ensure_ascii=False).replace('</','<\\/'))
html=html.replace('/* INLINE_STYLES */',fonts+(src/'styles.css').read_text()).replace('/* INLINE_FLIGHT */',(src/'flight.js').read_text()).replace('/* INLINE_APP */',app)
html=html.replace('/* INLINE_JOURNEY */',(src/'journey.js').read_text())
assert '@@' not in html
(out/'index.html').write_text(html)
readme='''FP GROUP — версия по записи Evercoat, 1 ноября 2026

Обновление 9 ноября 2026: блок 05 получил такие же внешние отступы, как соседние разделы, без растягивания на высоту окна и пустого запаса для прокрутки. Один жест колёсика по-прежнему переводит точку на один этап. Красная отметка Уфы плавно пульсирует с расходящимися кольцами; при системной настройке уменьшения движения карта статична.

Обновление 7 ноября 2026: заголовок вкладки «FP Group — ремонт коммерческих помещений», фавиконка — выбранный золотой знак на тёмно-синей плитке. Иконки PNG, ICO и Apple Touch включены в архив.
Техническая SEO-настройка: основной адрес https://fp-group.su/, описание страницы, robots.txt, sitemap.xml, разметка компании и превью ссылки. Единственный постоянный H1 назначен существующей строке об услуге. Тексты на странице, оформление и пролёты сохранены.

Распакуйте архив и откройте index.html. Папки assets и media должны оставаться рядом.
Один жест колёсика — один завершённый пролёт. Обратно — предыдущее помещение.
Использовано ваше новое видео e12752d3466bdbdeb7260be739a7f100_b1e1f7db-d765-46e9-9bb2-be7fa72c2684.mp4, полученное из четырёх частей RAR. Исходник: 1920×1080, 30 кадров/с, 12 секунд.
Клипы для сайта сохранены в Full HD, без звука. Пролёты ×3: примерно 0,58–1,04 секунды. Размытие усиливается в середине движения и исчезает при остановке. Движение назад — обратное воспроизведение тех же переходов.

На главном экране обновлены тексты всех пяти помещений по вашим примерам. Логотип в шапке уменьшен на 15% и окрашен в песочный и тёмно-синий. Тонкая рамка отображается в обоих режимах; подсказка прокрутки анимирована (кроме режима без анимации).
Структура, размеры и оформление восстановлены по вашей записи Evercoat. На первом экране используются встроенные Onest и Cormorant Garamond, в остальных блоках — Arial и Georgia.
В портфолио четыре объекта и 19 фотографий из ваших архивов: EL MACHETE, «Мама варит кофе», стоматология «Демократ» и кафе на Стремянном. Последнее временно занимает четвёртое место по вашему выбору. Площадь кофейни «Мама варит кофе» — 215 м², стоматологии «Демократ» — 73 м². В карточках указаны типы объектов вместо городов.
Форма подготавливает письмо для отправки через ваше почтовое приложение. Серверная отправка не подключена.

Услуги объединены в четыре направления с новыми иллюстрациями. На карте работ один жест колёсика переводит точку на следующий этап с видимым движением и точной остановкой. Можно выбрать этап нажатием; после последнего этапа прокрутка продолжается по странице. На телефоне маршрут вертикальный. При системном уменьшении движения показан статичный маршрут.
Галочка расположена после слов «Без анимации». В обоих режимах используется один кадр из видео, поэтому ракурс и масштаб не меняются. Названия помещений работают как кнопки: пролёты идут последовательно до выбранного кадра. Высота шапки уменьшена на 15%. Опыт 8 лет перенесён в полосу преимуществ; информация о компании — в компактный текстовый блок 03. Преимущества центрируются при переносе строк. Нижняя строка со счётчиком и итогом маршрута удалена.
Внешние отступы секций уменьшены вдвое. Контактная форма стала примерно на 10% компактнее; подписи с галочками и телефон над картой убраны. Футер содержит логотип, копирайт, адрес, оба телефона, сайт, почту и кнопку «Наверх», без нижней полосы.
Карта Уфы использует светлую подложку, голубую воду и красную отметку города. Она хранится в архиве и работает без интернета; ссылка открывает Яндекс Карты. Географические данные карты — Natural Earth, public domain.
'''
(out/'README.txt').write_text(readme)
hosting='''FP GROUP — ЗАГРУЗКА НА TIMEWEB

1. Создайте пустой сайт в панели Timeweb.
2. В разделе «Файлы» откройте корневую папку этого сайта. Обычно это public_html внутри каталога сайта; точный путь смотрите в настройках созданного сайта.
3. Загрузите ZIP и распакуйте его в этой папке. index.html, assets и media должны находиться непосредственно в корне сайта, рядом друг с другом.
4. Если отображается стандартная заглушка Timeweb, проверьте, не имеет ли её index.php или index.htm приоритет перед нашим index.html. Файл заглушки можно переименовать после проверки его содержимого.
5. Проверьте сайт по техническому адресу, указанному Timeweb: изображения, пролёты, галереи и мобильную версию. Затем подключите fp-group.su и сертификат HTTPS в панели хостинга.

В архиве установлены права: файлы 644, каталоги 755. После успешной распаковки загруженный ZIP можно удалить из публичной папки.

SEO настроено для https://fp-group.su/. В корне должны находиться robots.txt и sitemap.xml, а в assets — social-preview.jpg. Файл карты сайта: https://fp-group.su/sitemap.xml. После привязки домена проверьте HTTPS и настройте в панели Timeweb перенаправление HTTP на HTTPS и www.fp-group.su на fp-group.su. Сертификат должен покрывать оба имени. В архиве нет серверных правил перенаправления: эти настройки зависят от конфигурации хостинга.
Подтверждение сайта в Яндекс Вебмастере и Google Search Console выполняется в аккаунтах владельца. Добавьте туда адрес карты сайта. Канонический адрес в HTML не заменяет перенаправления на хостинге. Счётчики аналитики и коды подтверждения аккаунтов в архив не добавлены.

Сайт размещается на fp-group.su, почта proekt@fp-g.ru обслуживается Яндексом на отдельном домене fp-g.ru. При настройке сайта сохраните почтовые записи Яндекса для fp-g.ru; переносить их на fp-group.su не требуется. Значения SPF/DKIM берите из панели Яндекс 360; DNS-записи редактируются у провайдера, управляющего DNS домена.

ВАЖНО О ФОРМЕ: этот архив пока подготавливает письмо в почтовом приложении посетителя. Автоматическая серверная отправка через Яндекс SMTP ещё не подключена. Для неё нужны обработчик формы, доступность исходящего SMTP на Timeweb и пароль приложения Яндекс Почты, который хранится на сервере. Пароля в этом архиве нет.
'''
(out/'TIMEWEB.txt').write_text(hosting)
with ZipFile(root/'public/downloads/fp-group-evercoat.zip','w',ZIP_DEFLATED,compresslevel=6) as z:
 def add(name,data,directory=False):
  info=ZipInfo(str(name),datetime.now().timetuple()[:6]);info.create_system=3
  info.external_attr=((0o40755 if directory else 0o100644)<<16)|(0x10 if directory else 0)
  info.compress_type=ZIP_DEFLATED
  z.writestr(info,data)
 for folder in ['assets','media']:
  add(folder+'/',b'',directory=True)
  for f in (out/folder).iterdir():add(f.relative_to(out),f.read_bytes())
 add('index.html',html);add('favicon.ico',(out/'favicon.ico').read_bytes());add('ПРОЧИТАТЬ.txt',readme);add('ЗАГРУЗКА_НА_TIMEWEB.txt',hosting)
 add('robots.txt',robots);add('sitemap.xml',sitemap)
 licenses=(root/'node_modules/lucide-react/LICENSE').read_text()
 licenses+='\n\nONEST\n'+(root/'src/loam-redesign/fonts/onest-LICENSE.txt').read_text()
 licenses+='\n\nCORMORANT GARAMOND\n'+(root/'node_modules/@fontsource/cormorant-garamond/LICENSE').read_text()
 licenses+='\n\nMAP DATA: Natural Earth, public domain. https://www.naturalearthdata.com/about/terms-of-use/\n'
 add('THIRD_PARTY.txt',licenses)
print('Built',out,'ZIP bytes:',(root/'public/downloads/fp-group-evercoat.zip').stat().st_size)
