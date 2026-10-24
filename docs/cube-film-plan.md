# Сценарий куба — 24 октября 2026

Подтверждённый порядок: **1. Кафе → 2. Офис → 3. Салон красоты → 4. Клиника → 5. Отель.**
Вращение по часовой стрелке, звука нет. Сохраняются бетонная оболочка,
приподнятая плита с вентиляцией и отдельное основание с коммуникациями.
Камера, масштаб и центр вращения постоянны.

## Реально доступные материалы

- Кафе: пользовательский файл `301d2ccaf93447e794b73b38b6ada1b9_2ee9b607-615e-40bc-b562-81962ec87c98.mp4`, 1280×864, 30 fps.
- Офис: пользовательский файл `6e15326096b6e9715745844ff16104fe_bdfcb2ce-d5d8-40e9-9e35-068b71c266e0.mp4`, 1280×960, 30 fps.
- Остальные изображения видны в переписке, но не получены как доступные локальные
  файлы для включения в сайт или передачи видеосервису.
- Вход официальным Kling CLI 0.2.1 заканчивается DNS-ошибкой EAI_AGAIN для kling.ai.
  Аккаунт не подключён; генерации не отправлялись и токены не расходовались.

## Текущий просмотр

Главная использует монтаж двух пользовательских видео, а не новую генерацию.
Кафе сменяется офисом возле закрывающей интерьер перегородки. Мягкий диагональный
переход длится 0,35 секунды исходного времени. Разница геометрии двух исходников
остаётся ограничением этого монтажа. Нативная прокрутка управляет кадрами 30 fps.
Три оставшихся направления перечислены на странице, но их вращение не показано.
Это промежуточный результат, не завершённый цикл из пяти интерьеров.

## Следующий производственный шаг

Нужны оригиналы пяти изображений и подключённый видеосервис либо готовые клипы.
Для проверки диагональной концепции сначала получить один согласованный переход
кафе → офис. После проверки — офис → салон, салон → клиника, клиника → отель.
Каждый переход использует точные конечные композиции соседних клипов, чтобы
монтаж не менял масштаб или положение куба. Модель, длительность, разрешение,
доступные роли изображений и стоимость выбираются по возможностям аккаунта.

## Основа запроса для генерации

Premium photorealistic architectural cutaway on a dark charcoal studio background.
The reference images define the exact materials, furniture and lighting of the two
interiors. A single square architectural volume has two open interior sides,
separated by a rigid diagonal concrete partition. Rotate the entire architectural
assembly clockwise as viewed from above to reveal the next interior behind the
partition. The camera remains locked, with constant focal length, elevation,
framing and object scale. The concrete roof slab, suspended ventilation systems,
occupied floor and lower service foundation rotate together around one vertical
axis. Their dimensions and vertical gaps remain constant. Start with the cafe
facing the viewer and end with the office facing the viewer. The change of visible
interior is caused by the rotation and occlusion, with furniture fixed to each
side. Maintain straight edges and stable geometry throughout. Preserve existing
warm lighting and realistic material detail. One continuous shot, silent.

Контроль результата: нет перестройки плит, исчезающих стен, дублирования мебели,
скачков камеры, дрожания света и обрезанных частей куба. Проверить промежуточные
кадры, поскольку пользователь может остановить скролл на любом из них.
