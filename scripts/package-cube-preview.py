#!/usr/bin/env python3
"""Package the already-built, standalone FP Group HTML. No external dependencies."""
from pathlib import Path
from zipfile import ZipFile, ZIP_DEFLATED
root = Path(__file__).resolve().parents[1]
output = root / 'public/downloads/fp-group-floating-spaces.zip'
output.parent.mkdir(parents=True, exist_ok=True)
with ZipFile(output, 'w', compression=ZIP_DEFLATED, compresslevel=9) as archive:
    archive.write(root / 'preview.html', 'index.html')
    archive.writestr('ПРОЧИТАТЬ.txt', '''FP Group — главная страница

1. Распакуйте архив.
2. Откройте index.html в Chrome, Edge или Safari.
3. Поводите мышью над первым экраном: куб слегка наклоняется.
4. Прокрутите вниз: кафе → офис → салон красоты → клиника → отель.
   Можно использовать названия интерьеров и ползунок.

Все изображения, шрифты и код уже внутри HTML. Установка Node.js не нужна.
На телефоне доступны прокрутка и выбор интерьера, без наклона.
Если в системе включено уменьшение движения, выбирайте интерьер кнопками.
Телефоны и email открывают соответствующее приложение вашего устройства.
''')
print(f'{output}: {output.stat().st_size:,} bytes')
