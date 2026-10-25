'use client';
import { useEffect, useRef, useState } from 'react';
import { ArrowDown, ArrowRight, ArrowUpRight, Menu, X } from 'lucide-react';
import { useSpaceScroll, usePointerTilt } from './useSpaceMotion';
import spaces from '../../lib/cube-spaces.json';
import './cube-scroll.css';

export type CubeAssets = { posters: string[]; logo: string };
const defaultAssets: CubeAssets = { logo: '/images/brand/fp-group.svg', posters: spaces.map(chapter => `/images/cutouts/${chapter.id}.webp`) };
const directions = ['Кафе', 'Офисы', 'Салоны красоты', 'Клиники', 'Отели'];
export function CubeScrollDemo({ assets = defaultAssets }: { assets?: CubeAssets }) {
  const track = useRef<HTMLElement>(null), hero = useRef<HTMLDivElement>(null), surface = useRef<HTMLDivElement>(null);
  const { progress, reducedMotion, setPosition } = useSpaceScroll(track);
  usePointerTilt(hero, surface, reducedMotion);
  const [loaded, setLoaded] = useState<boolean[]>(spaces.map(() => false));
  const [failed, setFailed] = useState<boolean[]>(spaces.map(() => false));
  useEffect(() => {
    // Cached images can finish before React attaches onLoad during hydration.
    const images = Array.from(surface.current?.querySelectorAll<HTMLImageElement>('img') ?? []);
    setLoaded(images.map(image => image.complete && image.naturalWidth > 0));
    setFailed(images.map(image => image.complete && image.naturalWidth === 0));
  }, [assets]);
  const [menu, setMenu] = useState(false);
  const [activeProject, setActiveProject] = useState<number | null>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const stories = [
    { name: 'Место встречи', text: 'Тёплый свет, натуральные материалы и внимание к каждому гостю.' },
    { name: 'Среда для идей', text: 'Рабочие места, переговорные и общие зоны — пространство для команды.' },
    { name: 'Время для себя', text: 'Продуманное освещение, удобные рабочие места и атмосфера спокойствия.' },
    { name: 'Пространство заботы', text: 'Чистые линии, точная инженерия и комфорт пациентов.' },
    { name: 'Искусство гостеприимства', text: 'Выразительная стойка приёма, мягкий свет и первое впечатление, которое остаётся.' },
  ];
  const projects = spaces.map((chapter, index) => ({
    ...stories[index], type: chapter.label, image: assets.posters[index],
    progress: index / (spaces.length - 1),
  }));
  const position = progress * (spaces.length - 1);
  const base = Math.min(spaces.length - 1, Math.floor(position));
  const next = Math.min(spaces.length - 1, base + 1);
  const fraction = Math.max(0, Math.min(1, (position - base - .22) / .64));
  const blend = reducedMotion ? (fraction >= .5 ? 1 : 0) : fraction * fraction * (3 - 2 * fraction);
  const activeScene = blend >= .5 ? next : base;
  const fallback = loaded.findIndex(Boolean);
  const bottom = loaded[base] ? base : fallback;
  const top = loaded[next] ? next : bottom;
  function opacity(index: number) {
    if (index === bottom) return top === bottom ? 1 : 1 - blend;
    if (index === top) return blend;
    return 0;
  }
  useEffect(() => {
    if (activeProject !== null) dialog.current?.showModal();
    else dialog.current?.close();
  }, [activeProject]);
  return <main className="cs-demo" id="main">
    <header className="cs-header">
      <a className="cs-brand" href="#main" aria-label="FP Group — на главную"><img src={assets.logo} alt="FP Group" width={552} height={140}/></a>
      <nav aria-label="Основная навигация" className={menu ? 'is-open' : ''} id="cs-navigation">
        {[['projects', 'Пространства'], ['services', 'Услуги'], ['about', 'О компании']].map(([id, title]) => <a key={id} href={`#${id}`} onClick={() => setMenu(false)}>{title}</a>)}
      </nav>
      <a className="cs-header-cta" href="#contact">Обсудить объект <ArrowUpRight size={15}/></a>
      <button className="cs-menu" onClick={() => setMenu(!menu)} aria-label={menu ? 'Закрыть меню' : 'Открыть меню'} aria-expanded={menu} aria-controls="cs-navigation">{menu ? <X/> : <Menu/>}</button>
    </header>
    <section ref={track} className={`cs-track ${reducedMotion ? 'is-reduced' : ''}`} aria-label="Пять интерьеров: смена при прокрутке">
      <div ref={hero} className="cs-hero" data-progress={progress.toFixed(5)} data-scene={spaces[activeScene].id}>
        <div className="cs-visual">
          <div className="cs-scene-glow" aria-hidden="true"/>
          <div className="cs-scene-perspective">
            <div className="cs-scene-plane" ref={surface}>
              {spaces.map((space, index) => <img key={space.id} className="cs-scene-image" src={assets.posters[index]} alt={`${space.label} — архитектурный разрез`} width={1402} height={1122} loading="eager" decoding="async" fetchPriority={index === 0 ? 'high' : 'auto'} draggable={false} style={{ opacity: opacity(index), zIndex: index === top && top !== bottom ? 2 : 1 }} aria-hidden={index !== activeScene}
                onLoad={() => setLoaded(previous => previous.map((value, i) => i === index ? true : value))}
                onError={() => setFailed(previous => previous.map((value, i) => i === index ? true : value))}/>) }
            </div>
          </div>
          <div className="cs-film-top"><span>ОДНО ПРОСТРАНСТВО. РАЗНЫЕ ВОЗМОЖНОСТИ</span><span>0{activeScene + 1} / 05</span></div>
          <div className="cs-film-caption"><span className="cs-live-dot"/>{projects[activeScene].type} · {projects[activeScene].name.toLowerCase()}</div>
          {failed[activeScene] && <p className="cs-video-error">Изображение этого интерьера недоступно. Выберите другое пространство.</p>}
        </div>
        <div className="cs-copy">
          <p className="cs-eyebrow"><span>01 /</span> ПРОСТРАНСТВО В ДЕТАЛЯХ</p>
          <h1>Пространство<br/>для вашего<br/><em>бизнеса.</em></h1>
          <span className="cs-short-line"/>
          <p className="cs-subtitle">Коммерческие пространства<br/> под ключ</p>
          <div className="cs-hero-actions"><a href="#contact" className="cs-button cs-button-filled">Обсудить проект <ArrowRight size={20}/></a><a href="#projects" className="cs-button cs-button-outline">Наши направления <ArrowUpRight size={17}/></a></div>
          <p className="cs-scroll-hint"><ArrowDown size={17}/>{reducedMotion ? 'Выберите интерьер внизу' : 'Двигайте мышью. Листайте, чтобы сменить интерьер.'}</p>
        </div>
        <div className="cs-bottom">
          <div className="cs-types" aria-label="Выбор пространства">{projects.map((p, i) => <button key={p.type} className={activeScene === i ? 'active' : ''} onClick={() => setPosition(p.progress)} aria-pressed={activeScene === i}><small>0{i + 1}</small>{p.type}<span>/</span></button>)}</div>
          <div className="cs-progress"><div className="cs-progress-label"><span>{reducedMotion ? 'ВЫБЕРИТЕ ИНТЕРЬЕР' : 'ЛИСТАЙТЕ. ПРОСТРАНСТВО МЕНЯЕТСЯ.'}</span><output aria-live="off">{Math.round(progress * 100).toString().padStart(2, '0')}%</output></div><input aria-label="Смена интерьеров" aria-valuetext={`${projects[activeScene].type}, ${Math.round(progress * 100)}%`} type="range" min="0" max="1000" step="1" value={Math.round(progress * 1000)} onChange={e => setPosition(Number(e.target.value) / 1000)} style={{ '--cs-progress': `${progress * 100}%` } as React.CSSProperties}/></div>
        </div>
      </div>
    </section>
    <div className="cs-directions" aria-label="Направления работы">{directions.map((name, index) => <span key={name}><small>0{index + 1}</small>{name}</span>)}</div>
    <section id="projects" className="cs-section cs-projects">
      <div className="cs-section-heading"><div><p className="cs-eyebrow"><span>02 /</span> ВОЗМОЖНОСТИ ПРОСТРАНСТВА</p><h2>Разные пространства.<br/><em>Один уровень внимания.</em></h2></div><p>От первого впечатления до каждой детали.<br/>Создаём среду, в которой ваш бизнес<br/>обретает свой характер.</p></div>
      <div className="cs-project-grid">{projects.map((p, i) => <button className="cs-project" key={p.name} onClick={() => setActiveProject(i)}><div className="cs-project-image"><img src={p.image} alt={p.type + ' — кадр архитектурной концепции'} loading="lazy"/><span className="cs-project-arrow"><ArrowUpRight size={22}/></span><span className="cs-concept">ВИЗУАЛЬНАЯ КОНЦЕПЦИЯ</span></div><div className="cs-project-meta"><h3>{p.name}</h3><span>{p.type}</span></div></button>)}</div>
    </section>
    <section id="services" className="cs-section cs-services"><div><p className="cs-eyebrow"><span>03 /</span> КОМПЛЕКСНАЯ РЕАЛИЗАЦИЯ</p><h2>Всё начинается<br/><em>с вашей идеи.</em></h2></div><div className="cs-service-list">{[['Проект и дизайн', 'Разрабатываем концепцию, рабочий проект с 3D-визуализацией и пакет разрешительной документации.'], ['Строительные работы', 'Выполняем общестроительные работы, реконструкцию и перепланировку по утверждённому проекту.'], ['Инженерия и отделка', 'Прокладываем электрику, сантехнику и вентиляцию. Выполняем чистовую отделку и готовим объект к оснащению.'], ['Оборудование для HoReCa', 'Поставляем, монтируем и налаживаем профессиональное кухонное, барное и технологическое оборудование.'], ['Мебель и обстановка', 'Изготавливаем мебель на собственном производстве. Комплектуем интерьер мебелью, текстилем и декором.']].map(([name, text], i) => <details key={name}><summary><span>0{i + 1}</span><h3>{name}</h3><ArrowUpRight size={22}/></summary><p>{text}</p><a href="#contact">Обсудить задачу →</a></details>)}</div></section>
    <section id="about" className="cs-about cs-section">
      <p className="cs-eyebrow">FP GROUP / ОТ ИДЕИ ДО РЕАЛИЗАЦИИ</p>
      <h2>Создаём пространства,<br/><em>которые работают.</em></h2>
      <p className="cs-about-intro">Строительно-монтажная компания полного цикла. Реализуем под ключ проекты для коммерческого и государственного сектора. Подключаемся на любом этапе — от подбора помещения и дизайн-проекта до комплектации и запуска объекта.</p>
      <div className="cs-company-facts"><div><strong>8</strong><span>лет на рынке</span></div><div><strong>100+</strong><span>реализованных проектов</span></div><div><strong>Своё</strong><span>мебельное производство</span></div></div>
      <p className="cs-geography">Работаем в Башкортостане, Челябинской области, Москве и других регионах России. В команде — дизайнеры, инженеры и строители.</p>
      <div className="cs-clients"><p className="cs-eyebrow">СРЕДИ НАШИХ КЛИЕНТОВ</p><div><span>Мама варит кофе</span><span>PASTEL</span><span>El Machete</span><span>Сбербанк</span><span>Совкомбанк</span></div></div>
    </section>
    <section id="contact" className="cs-contact cs-section"><div><p className="cs-eyebrow"><span>04 /</span> СЛЕДУЮЩИЙ ШАГ</p><h2>Начнём<br/><em>с разговора.</em></h2><p>Расскажите о пространстве,<br/>которое вы хотите создать.</p></div>
      <div className="cs-contact-details"><p className="cs-eyebrow">СВЯЖИТЕСЬ С КОМАНДОЙ FP GROUP</p><a className="cs-phone" href="tel:+79509343388">+7 (950) 934-33-88</a><a className="cs-phone cs-phone-secondary" href="tel:+73472573388">+7 (347) 257-33-88</a><a className="cs-email" href="mailto:proekt@fp-g.ru">proekt@fp-g.ru <ArrowUpRight size={18}/></a><address>Республика Башкортостан, г. Уфа,<br/>Калининский район, ул. 6-й Кордон,<br/>зд. 10к1, офис 4</address><a className="cs-button cs-button-filled" href="mailto:proekt@fp-g.ru?subject=Обсудить%20проект">Написать о проекте <ArrowRight size={19}/></a></div>
    </section>
    <footer className="cs-footer"><a className="cs-brand" href="#main" aria-label="FP Group — на главную"><img src={assets.logo} alt="FP Group" width={552} height={140}/></a><span>Архитектура · Инженерия · Реализация</span><a href="#main">Наверх ↑</a></footer>
    <dialog ref={dialog} className="cs-project-dialog" onClose={() => setActiveProject(null)} onClick={e => { if (e.target === e.currentTarget) setActiveProject(null); }}>{activeProject !== null && <><button className="cs-dialog-close" aria-label="Закрыть проект" onClick={() => setActiveProject(null)}><X/></button><img src={projects[activeProject].image} alt={projects[activeProject].type}/><div><p className="cs-eyebrow">ВИЗУАЛЬНАЯ КОНЦЕПЦИЯ</p><h2>{projects[activeProject].name}</h2><p>{projects[activeProject].text}</p><button className="cs-button cs-button-outline" onClick={() => { setActiveProject(null); setPosition(projects[activeProject].progress); }}>Посмотреть в движении <ArrowRight size={18}/></button></div></>}</dialog>
  </main>;
}
