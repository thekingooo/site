"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowUpRight, Menu, X } from "lucide-react";

export function Header({ home = true }: { home?: boolean }) {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const prefix = home ? "" : "/";
  useEffect(() => {
    const update = () => setScrolled(window.scrollY > 30);
    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, []);
  useEffect(() => {
    if (!open) return;
    const close = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, [open]);
  return (
    <header
      className={`site-header ${scrolled ? "is-scrolled" : ""} ${open ? "menu-is-open" : ""}`}
    >
      <Link
        href="/"
        className="wordmark"
        aria-label="ПРОСТРАНСТВО — на главную"
      >
        ПРОСТРАНСТВО<span className="brand-dot">®</span>
      </Link>
      <nav
        id="main-navigation"
        className={open ? "header-nav is-open" : "header-nav"}
        aria-label="Основная навигация"
      >
        <a href={`${prefix}#projects`} onClick={() => setOpen(false)}>
          Проекты
        </a>
        <a href={`${prefix}#services`} onClick={() => setOpen(false)}>
          Услуги
        </a>
        <a href={`${prefix}#about`} onClick={() => setOpen(false)}>
          О компании
        </a>
        <a
          className="mobile-contact"
          href={`${prefix}#contact`}
          onClick={() => setOpen(false)}
        >
          Обсудить объект <ArrowUpRight size={18} />
        </a>
      </nav>
      <a className="header-cta" href={`${prefix}#contact`}>
        Обсудить объект <ArrowUpRight size={15} strokeWidth={1.2} />
      </a>
      <button
        className="menu-toggle"
        aria-label={open ? "Закрыть меню" : "Открыть меню"}
        aria-expanded={open}
        aria-controls="main-navigation"
        onClick={() => setOpen(!open)}
      >
        {open ? <X /> : <Menu />}
      </button>
    </header>
  );
}
