'use client';
import { useEffect, useRef, useState } from 'react';
import { ArrowDown, ArrowRight, ArrowUpRight, Check, Menu, X } from 'lucide-react';
import { useVideoScroll } from './useVideoScroll';
import film from '../../lib/cube-film.json';
import './cube-scroll.css';

export type CubeAssets = { video: string; posters: string[] };
const defaultAssets: CubeAssets = { video: film.video, posters: film.chapters.map(chapter => `/images/spaces/${chapter.id}.jpg`) };
const directions = ['Кафе', 'Офисы', 'Салоны красоты', 'Клиники', 'Отели'];
export function CubeScrollDemo({ assets = defaultAssets }: { assets?: CubeAssets }) {
  const track = useRef<HTMLElement>(null), video = useRef<HTMLVideoElement>(null);
  const { progress, ready, error, reducedMotion, setPosition } = useVideoScroll(track, video, film.fps);
  const [menu, setMenu] = useState(false);
  const [activeProject, setActiveProject] = useState<number | null>(null);
  const [brief, setBrief] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  const stories = [
    { name: 'Место встречи', text: 'Тёплый свет, натуральные материалы и внимание к каждому гостю.' },
    { name: 'Среда для идей', text: 'Рабочие места, переговорные и общие зоны — пространство для команды.' },
    { name: 'Время для себя', text: 'Продуманное освещение, удобные рабочие места и атмосфера спокойствия.' },
    { name: 'Пространство заботы', text: 'Чистые линии, точная инженерия и комфорт пациентов.' },
    { name: 'Искусство гостеприимства', text: 'Выразительная стойка приёма, мягкий свет и первое впечатление, которое остаётся.' },
  ];
  const projects = film.chapters.map((chapter, index) => ({
    ...stories[index], type: chapter.label, image: assets.posters[index],
    progress: chapter.frame / (film.frameCount - 1),
  }));
  const currentFrame = Math.round(progress * (film.frameCount - 1));
  const activeScene = film.chapters.reduce((active, chapter, index) => currentFrame >= chapter.fromFrame ? index : active, 0);
  useEffect(() => {
    if (activeProject !== null) dialog.current?.showModal();
    else dialog.current?.close();
  }, [activeProject]);
  function downloadBrief(form: HTMLFormElement) {
    const data = new FormData(form);
    const blob = new Blob([`ПРОСТРАНСТВО — бриф\n\nИмя: ${data.get('name')}\nКонтакт: ${data.get('contact')}\nЗадача: ${data.get('task')}\n\nДемонстрационный сайт. Файл сохранён на вашем устройстве, компании не отправлен.`], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob), link = document.createElement('a');
    link.href = url; link.download = 'project-brief.txt'; link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000); setBrief(true);
  }
  return <main className="cs-demo" id="main">
    <header className="cs-header">
      <a className="cs-brand" href="#main" aria-label="Пространство — на главную">ПРОСТРАНСТВО</a>
      <nav aria-label="Основная навигация" className={menu ? 'is-open' : ''} id="cs-navigation">
        {[['projects', 'Проекты'], ['services', 'Услуги'], ['about', 'О компании']].map(([id, title]) => <a key={id} href={`#${id}`} onClick={() => setMenu(false)}>{title}</a>)}
      </nav>
      <a className="cs-header-cta" href="#contact">Обсудить объект <ArrowUpRight size={15}/></a>
      <button className="cs-menu" onClick={() => setMenu(!menu)} aria-label={menu ? 'Закрыть меню' : 'Открыть меню'} aria-expanded={menu} aria-controls="cs-navigation">{menu ? <X/> : <Menu/>}</button>
    </header>
    <section ref={track} className={`cs-track ${reducedMotion ? 'is-reduced' : ''}`} aria-label="Вращение архитектурного пространства при прокрутке">
      <div className="cs-hero" data-progress={progress.toFixed(5)} data-scene={film.chapters[activeScene].id}>
        <div className="cs-visual">
          <video ref={video} src={assets.video} poster={assets.posters[0]} muted playsInline preload="auto" disablePictureInPicture controls={false} aria-label="Архитектурный куб: кафе, офис, салон красоты, клиника и отель. Кадр управляется прокруткой." className={ready ? 'is-ready' : ''}/>
          <div className="cs-film-top"><span>АРХИТЕКТУРА В ДВИЖЕНИИ</span><span>0{activeScene + 1} / 05</span></div>
          <div className="cs-film-caption"><span className="cs-live-dot"/>{projects[activeScene].type} · {projects[activeScene].name.toLowerCase()}</div>
          {error && <p className="cs-video-error">Не удалось загрузить движение. <button onClick={() => video.current?.load()}>Повторить</button></p>}
        </div>
        <div className="cs-copy">
          <p className="cs-eyebrow"><span>01 /</span> ПРОСТРАНСТВО В ДЕТАЛЯХ</p>
          <h1>Пространство<br/>для вашего<br/><em>бизнеса.</em></h1>
          <span className="cs-short-line"/>
          <p className="cs-subtitle">Ремонт коммерческих<br/>помещений</p>
          <div className="cs-hero-actions"><a href="#contact" className="cs-button cs-button-filled">Обсудить проект <ArrowRight size={20}/></a><a href="#projects" className="cs-button cs-button-outline">Смотреть проекты <ArrowUpRight size={17}/></a></div>
          <p className="cs-scroll-hint"><ArrowDown size={17}/>{reducedMotion ? 'Выберите ракурс ползунком внизу' : 'Прокрутите, чтобы повернуть пространство'}</p>
        </div>
        <div className="cs-bottom">
          <div className="cs-types" aria-label="Выбор пространства">{projects.map((p, i) => <button key={p.type} className={activeScene === i ? 'active' : ''} onClick={() => setPosition(p.progress)} aria-pressed={activeScene === i}><small>0{i + 1}</small>{p.type}<span>/</span></button>)}</div>
          <div className="cs-progress"><div className="cs-progress-label"><span>{reducedMotion ? 'ВЫБЕРИТЕ РАКУРС' : 'ЛИСТАЙТЕ. ПРОСТРАНСТВО МЕНЯЕТСЯ.'}</span><output aria-live="off">{Math.round(progress * 100).toString().padStart(2, '0')}%</output></div><input aria-label="Вращение пространства" aria-valuetext={`${projects[activeScene].type}, ${Math.round(progress * 100)}%`} type="range" min="0" max="1000" step="1" value={Math.round(progress * 1000)} onChange={e => setPosition(Number(e.target.value) / 1000)} style={{ '--cs-progress': `${progress * 100}%` } as React.CSSProperties}/></div>
        </div>
      </div>
    </section>
    <div className="cs-directions" aria-label="Направления работы">{directions.map((name, index) => <span key={name}><small>0{index + 1}</small>{name}</span>)}</div>
    <section id="projects" className="cs-section cs-projects">
      <div className="cs-section-heading"><div><p className="cs-eyebrow"><span>02 /</span> ВОЗМОЖНОСТИ ПРОСТРАНСТВА</p><h2>Разные пространства.<br/><em>Один уровень внимания.</em></h2></div><p>От первого впечатления до каждой детали.<br/>Создаём среду, в которой ваш бизнес<br/>обретает свой характер.</p></div>
      <div className="cs-project-grid">{projects.map((p, i) => <button className="cs-project" key={p.name} onClick={() => setActiveProject(i)}><div className="cs-project-image"><img src={p.image} alt={p.type + ' — кадр архитектурной концепции'} loading="lazy"/><span className="cs-project-arrow"><ArrowUpRight size={22}/></span><span className="cs-concept">ВИЗУАЛЬНАЯ КОНЦЕПЦИЯ</span></div><div className="cs-project-meta"><h3>{p.name}</h3><span>{p.type}</span></div></button>)}</div>
    </section>
    <section id="services" className="cs-section cs-services"><div><p className="cs-eyebrow"><span>03 /</span> КОМПЛЕКСНАЯ РЕАЛИЗАЦИЯ</p><h2>Всё начинается<br/><em>с вашей идеи.</em></h2></div><div className="cs-service-list">{[['Проектирование', 'Продумываем планировку, архитектуру и будущие сценарии использования.'], ['Инженерия', 'Соединяем климат, свет и коммуникации в единую систему.'], ['Ремонт и отделка', 'Превращаем проект в готовое коммерческое пространство.']].map(([name, text], i) => <details key={name}><summary><span>0{i + 1}</span><h3>{name}</h3><ArrowUpRight size={22}/></summary><p>{text}</p><a href="#contact">Обсудить задачу →</a></details>)}</div></section>
    <section id="about" className="cs-about cs-section"><p className="cs-eyebrow">АРХИТЕКТУРА · ИНЖЕНЕРИЯ · РЕАЛИЗАЦИЯ</p><h2>Вы приходите с помещением.<br/><em>Мы видим пространство<br/>для вашего бизнеса.</em></h2><p>Соединяем эстетику, функциональность и инженерные решения.<br/>Чтобы интерьер работал на людей и задачи бизнеса.</p></section>
    <section id="contact" className="cs-contact cs-section"><div><p className="cs-eyebrow"><span>04 /</span> СЛЕДУЮЩИЙ ШАГ</p><h2>Начнём<br/><em>с разговора.</em></h2><p>Расскажите о пространстве,<br/>которое вы хотите создать.</p></div><form onSubmit={e => { e.preventDefault(); downloadBrief(e.currentTarget); }}><label>Как к вам обращаться<input name="name" autoComplete="name" placeholder="Ваше имя" required maxLength={100}/></label><label>Контакт для связи<input name="contact" placeholder="Телефон или email" required maxLength={160}/></label><label>Ваша идея<textarea name="task" placeholder="Какой объект вы планируете?" required rows={2} maxLength={4000}/></label><button className="cs-button cs-button-filled" type="submit">Сохранить бриф <ArrowRight size={19}/></button><p className="cs-form-note">Демонстрационный пример. Бриф скачивается на ваше устройство; данные не отправляются.</p>{brief && <p className="cs-brief-success" role="status"><Check size={15}/> Бриф подготовлен для скачивания.</p>}</form></section>
    <footer className="cs-footer"><a className="cs-brand" href="#main">ПРОСТРАНСТВО</a><span>Архитектура · Инженерия · Реализация</span><a href="#main">Наверх ↑</a></footer>
    <dialog ref={dialog} className="cs-project-dialog" onClose={() => setActiveProject(null)} onClick={e => { if (e.target === e.currentTarget) setActiveProject(null); }}>{activeProject !== null && <><button className="cs-dialog-close" aria-label="Закрыть проект" onClick={() => setActiveProject(null)}><X/></button><img src={projects[activeProject].image} alt={projects[activeProject].type}/><div><p className="cs-eyebrow">ВИЗУАЛЬНАЯ КОНЦЕПЦИЯ / КАДР ИЗ ВИДЕО</p><h2>{projects[activeProject].name}</h2><p>{projects[activeProject].text}</p><button className="cs-button cs-button-outline" onClick={() => { setActiveProject(null); setPosition(projects[activeProject].progress); }}>Посмотреть в движении <ArrowRight size={18}/></button></div></>}</dialog>
  </main>;
}
