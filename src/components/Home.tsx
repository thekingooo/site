"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ArrowDown, ArrowRight, ArrowUpRight, Minus, Plus } from "lucide-react";
import { Experience } from "./experience/Experience";
import { Header } from "./Header";
import { Footer } from "./Footer";
import { ContactForm } from "./ContactForm";
import { projects, scenes, services } from "@/lib/content";

function Blueprint() {
  return (
    <svg
      viewBox="0 0 800 600"
      fill="none"
      className="blueprint-svg"
      aria-label="Архитектурная схема помещения"
      role="img"
    >
      <defs>
        <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
          <path
            d="M40 0H0V40"
            stroke="currentColor"
            strokeWidth=".35"
            opacity=".25"
          />
        </pattern>
      </defs>
      <rect width="800" height="600" fill="url(#grid)" />
      <g stroke="currentColor" strokeWidth="1.3">
        <path d="M140 140H670V470H140ZM150 150H660V460H150M150 260H360V150M365 150V330H660M365 340H540V460M540 340V400M150 370H270V460" />
        <path d="M130 140H100M130 470H100M110 130V480M140 120V90M670 120V90M130 100H680M140 100l8-5M670 100l-8 5M110 140l-5 8M110 470l5-8" />
        <path d="M380 170H630V300H380ZM400 190H610V280H400M515 340v110M200 285h100v60H200ZM195 280h110v70H195M180 285v60M325 285v60M210 273h80M210 358h80" />
        <circle cx="440" cy="390" r="30" />
        <circle cx="225" cy="405" r="20" />
        <path d="M380 370v40M500 370v40M420 345h40M420 435h40M560 355h80v80h-80ZM575 370h50v50h-50" />
      </g>
      <g stroke="currentColor" strokeWidth=".75" strokeDasharray="5 5">
        <path d="M100 210H710M100 410H710M250 80V500M590 80V500" />
        <path d="M170 175H640V440H170Z" />
      </g>
      <g
        fill="currentColor"
        fontFamily="monospace"
        fontSize="10"
        letterSpacing="2"
      >
        <text x="375" y="87">
          8 000
        </text>
        <text x="72" y="310" transform="rotate(-90 72 310)">
          5 600
        </text>
        <text x="450" y="245">
          ПЕРЕГОВОРНАЯ
        </text>
        <text x="200" y="250">
          РЕСЕПШЕН
        </text>
        <text x="350" y="530">
          ПЛАН / ОТМЕТКА ±0.000
        </text>
        <text x="50" y="560">
          ПР—01
        </text>
      </g>
    </svg>
  );
}

function Approach() {
  const [mode, setMode] = useState<"material" | "plan" | null>(null);
  return (
    <section className="approach section-pad" id="about">
      <div className="approach-copy">
        <p className="eyebrow">
          <span>03 /</span> НАШ ПОДХОД
        </p>
        <h2>
          Сложные задачи.
          <br />
          <em>Точные решения.</em>
        </h2>
        <p>
          За эстетикой каждого пространства стоит система: расчёты, технологии,
          инженерия и точность реализации.
        </p>
        <p className="muted">
          Мы смотрим на объект целиком. Учитываем, как он будет выглядеть,
          работать и развиваться вместе с вашим бизнесом.
        </p>
        <a className="text-link" href="#contact">
          Познакомимся с вашей задачей{" "}
          <ArrowUpRight size={18} strokeWidth={1.2} />
        </a>
      </div>
      <div className={`approach-visual ${mode === "plan" ? "show-plan" : ""} ${mode ? "manual-view" : ""}`}>
        <img
          src="/images/restaurant.jpg"
          loading="lazy"
          alt="Концепция интерьера с открытыми инженерными системами"
        />
        <div className="blueprint-overlay">
          <Blueprint />
        </div>
        <div className="approach-visual-top">
          <span>ОТ СХЕМЫ К ПРОСТРАНСТВУ</span>
          <span>ПР—01</span>
        </div>
        <div
          className="visual-toggle"
          role="group"
          aria-label="Вид архитектурного решения"
        >
          <button
            aria-pressed={mode === "plan"}
            onClick={() => setMode("plan")}
          >
            Чертёж
          </button>
          <button
            aria-pressed={mode !== "plan"}
            onClick={() => setMode("material")}
          >
            Материал
          </button>
        </div>
        <span className="visual-cross cross-one">+</span>
        <span className="visual-cross cross-two">+</span>
      </div>
    </section>
  );
}

function Services() {
  const [expanded, setExpanded] = useState<number | null>(0);
  return (
    <section id="services" className="services section-pad">
      <div className="section-topline">
        <p className="eyebrow">
          <span>02 /</span> ПОЛНЫЙ ЦИКЛ РЕАЛИЗАЦИИ
        </p>
        <span className="tiny-note">ОДИН ПАРТНЁР — ОТ ИДЕИ ДО ЗАПУСКА</span>
      </div>
      <div className="services-intro">
        <h2>
          От идеи.
          <br />
          До первого
          <br />
          <em>посетителя.</em>
        </h2>
        <div>
          <p>
            Берём на себя весь цикл создания коммерческого пространства — от
            подготовки объекта до финальной реализации.
          </p>
          <a className="text-link" href="#service-list">
            Внимание к каждому этапу <ArrowDown size={17} strokeWidth={1} />
          </a>
        </div>
      </div>
      <div className="service-list" id="service-list">
        {services.map((service, i) => (
          <article
            className={`service-row ${expanded === i ? "expanded" : ""}`}
            key={service.id}
          >
            <button
              className="service-toggle"
              onClick={() => setExpanded(expanded === i ? null : i)}
              aria-expanded={expanded === i}
              aria-controls={`service-${service.id}`}
            >
              <span className="service-number">0{i + 1}</span>
              <h3>{service.name}</h3>
              <span className="service-short">{service.short}</span>
              <span className="service-plus">
                {expanded === i ? (
                  <Minus size={21} strokeWidth={1} />
                ) : (
                  <Plus size={21} strokeWidth={1} />
                )}
              </span>
            </button>
            <div
              id={`service-${service.id}`}
              className="service-details"
              hidden={expanded !== i}
            >
              <p>{service.description}</p>
              <ul>
                {service.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
              <Link className="text-link" href={`/services/${service.id}`}>
                Подробнее <ArrowUpRight size={17} />
              </Link>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function Projects() {
  const [filter, setFilter] = useState("Все");
  const [showAll, setShowAll] = useState(false);
  const filtered = projects.filter(
    (project) => filter === "Все" || project.type === filter,
  );
  const displayed =
    filter === "Все" && !showAll ? filtered.slice(0, 2) : filtered;
  return (
    <section id="projects" className="projects section-pad">
      <div className="section-topline">
        <p className="eyebrow">
          <span>04 /</span> ВОЗМОЖНОСТИ ПРОСТРАНСТВА
        </p>
        <span className="tiny-note">АРХИТЕКТУРА В ДЕТАЛЯХ</span>
      </div>
      <div className="projects-heading">
        <h2>
          Пространства,
          <br />
          <em>которые работают.</em>
        </h2>
        <p>
          Каждый объект — сочетание архитектуры, инженерии и задач конкретного
          бизнеса.
        </p>
      </div>
      <nav className="project-filters" aria-label="Фильтр проектов">
        {["Все", "Рестораны", "Ритейл", "Офисы", "Банки", "Клиники"].map(
          (item) => (
            <button
              className={filter === item ? "active" : ""}
              key={item}
              onClick={() => setFilter(item)}
              aria-pressed={filter === item}
            >
              {item}
              {filter === item && (
                <small>{filtered.length.toString().padStart(2, "0")}</small>
              )}
            </button>
          ),
        )}
      </nav>
      <p className="portfolio-disclaimer">
        Демонстрационные концепции. Визуализации показывают направления работы и
        не являются реализованными проектами компании.
      </p>
      <div className="project-grid">
        {displayed.map((project) => (
          <Link
            className="project-card"
            href={`/projects/${project.slug}`}
            key={project.slug}
          >
            <div className="project-image">
              <img
                src={scenes[project.index].image}
                alt={`${project.subtitle} — демонстрационная визуализация`}
                loading="lazy"
              />
              <span className="project-tag">
                КОНЦЕПЦИЯ / 0{project.index + 1}
              </span>
              <span className="project-arrow">
                <ArrowUpRight size={23} strokeWidth={1} />
              </span>
            </div>
            <div className="project-meta">
              <div>
                <span>{project.type} / Концепция</span>
                <h3>{project.name}</h3>
              </div>
              <span className="project-type">{project.subtitle}</span>
            </div>
          </Link>
        ))}
      </div>
      {filter === "Все" && (
        <button
          className="button button-outline all-projects"
          onClick={() => setShowAll(!showAll)}
        >
          {showAll ? "Свернуть подборку" : "Все пять направлений"}
          {showAll ? <Minus size={17} /> : <Plus size={17} />}
        </button>
      )}
    </section>
  );
}

function Values() {
  const values = [
    [
      "Комплексный подход",
      "От первоначальной задачи до готового объекта. Видим весь путь и связываем его этапы.",
    ],
    [
      "Инженерная точность",
      "За каждым красивым решением — продуманная техническая инфраструктура.",
    ],
    [
      "Контроль реализации",
      "Системный подход к качеству, последовательности и координации работ.",
    ],
    [
      "Понимание бизнеса",
      "Учитываем реальные процессы будущего объекта, а не только его архитектуру.",
    ],
  ];
  return (
    <section className="values section-pad">
      <p className="eyebrow">
        <span>05 /</span> ВАШ НАДЁЖНЫЙ ПАРТНЁР
      </p>
      <div className="values-layout">
        <h2>
          Всё сложное
          <br />
          <em>берём на себя.</em>
        </h2>
        <div className="values-list">
          {values.map(([title, copy], i) => (
            <article key={title}>
              <span>0{i + 1}</span>
              <div>
                <h3>{title}</h3>
                <p>{copy}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

export function Home() {
  const container = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("revealed");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.08 },
    );
    container.current?.querySelectorAll(".section-pad").forEach((element) => {
      element.classList.add("reveal-section");
      observer.observe(element);
    });
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    const track = (event: MouseEvent) => {
      const target =
        event.target instanceof Element
          ? event.target.closest<HTMLAnchorElement>('a[href$="#contact"]')
          : null;
      if (target)
        window.dispatchEvent(
          new CustomEvent("prostranstvo:interaction", {
            detail: { type: "cta", label: target.textContent?.trim() },
          }),
        );
    };
    container.current?.addEventListener("click", track);
    const element = container.current;
    return () => element?.removeEventListener("click", track);
  }, []);
  return (
    <div ref={container}>
      <Header />
      <main id="main">
        <Experience />
        <div className="manifesto">
          <span className="manifesto-mark">П /</span>
          <p>
            Одно пространство.
            <br />
            <span>Бесконечные возможности.</span>
          </p>
          <a href="#services" aria-label="Перейти к услугам">
            <ArrowDown size={25} strokeWidth={1} />
          </a>
        </div>
        <Services />
        <Approach />
        <Projects />
        <Values />
        <section id="contact" className="contact section-pad">
          <div className="contact-copy">
            <p className="eyebrow">
              <span>06 /</span> ВАШ СЛЕДУЮЩИЙ ШАГ
            </p>
            <h2>
              Ваш следующий
              <br />
              проект начинается
              <br />
              <em>здесь.</em>
            </h2>
            <p>
              Расскажите о своём объекте.
              <br />
              Поможем превратить идею в работающее коммерческое пространство.
            </p>
            <div className="contact-monogram" aria-hidden="true">
              <span>П</span>
              <ArrowUpRight strokeWidth={0.4} />
            </div>
          </div>
          <ContactForm />
        </section>
      </main>
      <Footer />
    </div>
  );
}
