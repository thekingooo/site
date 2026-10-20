import Link from "next/link";
import { Header } from "@/components/Header";

export default function NotFound() {
  return (
    <>
      <Header home={false} />
      <main id="main" className="not-found">
        <span className="eyebrow">404 / ВНЕ ПЛАНА</span>
        <h1>
          Это пространство
          <br />
          <em>ещё не создано.</em>
        </h1>
        <p>Вернёмся туда, где начинаются идеи.</p>
        <Link href="/" className="button button-copper">
          На главную ↗
        </Link>
      </main>
    </>
  );
}
