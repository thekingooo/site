"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowLeft, Layers3, Upload } from "lucide-react";
import Link from "next/link";

const ExperienceCanvas = dynamic(
  () => import("./experience/ExperienceCanvas"),
  { ssr: false },
);

export function ModelReview() {
  const progress = useRef(0.5);
  const upload = useRef<HTMLInputElement>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState(false);
  const [exploded, setExploded] = useState(false);
  const [lowPower, setLowPower] = useState(false);
  const [reference, setReference] = useState<string | null>(null);
  const onReady = useCallback(() => setReady(true), []);
  const onLowPower = useCallback(() => setLowPower(true), []);
  const onError = useCallback(() => {
    setReady(true);
    setError(true);
  }, []);
  useEffect(
    () => () => {
      if (reference) URL.revokeObjectURL(reference);
    },
    [reference],
  );
  return (
    <main id="main" className="model-review">
      <div className="review-heading">
        <Link href="/?space=office" className="text-link">
          <ArrowLeft size={16} /> К сайту
        </Link>
        <span className="eyebrow">ОФИС / ПРОВЕРКА НОВОЙ 3D-СЦЕНЫ</span>
      </div>
      <h1>Архитектура в деталях.</h1>
      <p className="review-intro">
        Поверните модель мышью или пальцем. Колесо мыши меняет масштаб.
      </p>
      <div className="review-grid">
        <section
          className="review-live"
          aria-label="Интерактивная модель офиса"
        >
          <span className="review-panel-label">ЖИВАЯ 3D-МОДЕЛЬ</span>
          <div className="review-canvas">
            {error ? (
              <img
                src="/images/office-model-review.jpg"
                alt="Рендер офисной модели. WebGL недоступен."
              />
            ) : (
              <ExperienceCanvas
                progress={progress}
                renderProgress={0.5}
                reducedMotion={false}
                exploded={exploded}
                lowPower={lowPower}
                onReady={onReady}
                onError={onError}
                interactive
                onLowPower={onLowPower}
              />
            )}
            {!ready && (
              <span className="review-loading" role="status">
                Загружаем геометрию и материалы…
              </span>
            )}
          </div>
          <div className="review-controls">
            <button
              className="tool-button"
              aria-pressed={exploded}
              onClick={() => setExploded(!exploded)}
            >
              <Layers3 size={16} />
              {exploded ? "Собрать слои" : "Раздвинуть слои"}
            </button>
            <button
              className="tool-button"
              aria-pressed={lowPower}
              onClick={() => setLowPower(!lowPower)}
            >
              {lowPower ? "Эко" : "HQ"}
            </button>
          </div>
        </section>
        <section
          className="review-reference"
          aria-label="Изображение для сравнения"
        >
          <span className="review-panel-label">
            {reference ? "ВАШ РЕФЕРЕНС" : "РЕНДЕР ЭТОЙ ЖЕ МОДЕЛИ"}
          </span>
          <div className="review-reference-image">
            <img
              src={reference || "/images/office-model-review.jpg"}
              alt={
                reference
                  ? "Загруженный вами референс"
                  : "Контрольный рендер новой 3D-модели офиса"
              }
            />
          </div>
          <input
            className="visually-hidden"
            type="file"
            ref={upload}
            accept="image/png,image/jpeg,image/webp"
            aria-label="Открыть референс"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) setReference(URL.createObjectURL(file));
            }}
          />
          <button
            className="tool-button"
            onClick={() => upload.current?.click()}
          >
            <Upload size={15} />
            Открыть свой референс для сравнения
          </button>
          <p className="review-privacy">
            Изображение открывается только в вашем браузере и не отправляется на
            сервер.
          </p>
        </section>
      </div>
      <p className="review-note">
        Обновлены общая архитектурная оболочка и офисный интерьер. Остальные
        интерьеры пока используют предыдущую геометрию.
      </p>
    </main>
  );
}
