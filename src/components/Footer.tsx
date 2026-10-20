import Link from "next/link";

export function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-top">
        <Link className="wordmark" href="/">
          ПРОСТРАНСТВО
        </Link>
        <p>Архитектура. Инженерия. Реализация.</p>
        <a href="/#contact">Начнём с вашей идеи ↗</a>
      </div>
      <div className="footer-bottom">
        <span>© {new Date().getFullYear()} ПРОСТРАНСТВО</span>
        <span>Концепция сайта · Контакты компании уточняются</span>
        <Link href="/privacy">Обработка данных</Link>
        <a href="#main">Наверх ↑</a>
      </div>
    </footer>
  );
}
