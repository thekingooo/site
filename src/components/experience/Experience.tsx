"use client";

import dynamic from "next/dynamic";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import { ArrowDown, ArrowRight, Layers3, Minus, Plus } from "lucide-react";
import { scenes } from "@/lib/content";
import { useScrollScene } from "./ScrollSceneController";

const ExperienceCanvas = dynamic(() => import("./ExperienceCanvas"), {
  ssr: false,
});

export function Experience() {
  const track = useRef<HTMLElement>(null);
  const { progress, index, amount, navigate, reducedMotion } =
    useScrollScene(track);
  const [ready, setReady] = useState(false);
  const [fallback, setFallback] = useState(false);
  const [exploded, setExploded] = useState(false);
  const [lowPower, setLowPower] = useState(false);
  const [info, setInfo] = useState<number | null>(null);
  const onReady = useCallback(() => setReady(true), []);
  const onLowPower = useCallback(() => setLowPower(true), []);
  const onError = useCallback(() => {
    setFallback(true);
    setReady(true);
  }, []);
  const scene = scenes[index];
  useEffect(() => {
    const canvas = document.createElement("canvas");
    if (!canvas.getContext("webgl2")) onError();
    const nav = navigator as Navigator & { deviceMemory?: number };
    if (
      (nav.deviceMemory && nav.deviceMemory <= 4) ||
      window.matchMedia("(pointer: coarse)").matches
    )
      setLowPower(true);
  }, [onError]);
  useEffect(() => {
    setInfo(null);
  }, [index]);
  useEffect(() => {
    window.dispatchEvent(
      new CustomEvent("prostranstvo:interaction", {
        detail: { type: "scene_view", scene: scenes[index].id },
      }),
    );
  }, [index]);
  return (
    <section
      ref={track}
      className="experience-track"
      id="experience"
      aria-label="Пять пространств для вашего бизнеса"
    >
      <div
        className="experience"
        data-scene={scene.id}
        data-progress={amount.toFixed(3)}
      >
        <div className="hero-atmosphere" />
        <div className={`model-stage ${ready ? "is-ready" : ""}`}>
          {fallback ? (
            <div className="model-fallback">
              <img src={scene.image} alt={`Концепция: ${scene.category}`} />
              <span>Визуализация пространства</span>
            </div>
          ) : (
            <ExperienceCanvas
              progress={progress}
              renderProgress={amount}
              reducedMotion={reducedMotion}
              exploded={exploded}
              lowPower={lowPower}
              onReady={onReady}
              onError={onError}
              onLowPower={onLowPower}
            />
          )}
        </div>
        {!ready && (
          <div className="scene-loader" role="status">
            <span>ПРОСТРАНСТВО</span>
            <i />
            <small>Собираем архитектуру</small>
          </div>
        )}
        <div className="hero-copy" key={index}>
          <p className="eyebrow">
            <span>{String(index + 1).padStart(2, "0")} /</span>{" "}
            {index === 0
              ? "КОММЕРЧЕСКИЕ ПРОСТРАНСТВА"
              : scene.category.toUpperCase()}
          </p>
          <h1>
            {scene.title.map((line) => (
              <span className="headline-line" key={line}>
                <span>{line}</span>
              </span>
            ))}
          </h1>
          <div className="copper-dash" />
          <p className="hero-description">{scene.description}</p>
          <div className="hero-actions">
            <a className="button button-copper" href="#contact">
              Обсудить проект <ArrowRight size={20} strokeWidth={1} />
            </a>
            <a className="button button-outline" href="#projects">
              Смотреть проекты
            </a>
          </div>
          <p className="hero-disciplines">
            {scene.tags.map((tag, i) => (
              <span key={tag}>
                {i > 0 && <i>/</i>}
                {tag}
              </span>
            ))}
          </p>
        </div>
        <div
          className={`scene-annotations ${(amount * 4) % 1 > 0.15 && (amount * 4) % 1 < 0.85 ? "is-turning" : ""}`}
        >
          {scene.annotations.map((text, i) => (
            <button
              key={i}
              className={`annotation annotation-${i} ${info === i ? "is-open" : ""}`}
              onClick={() => setInfo(info === i ? null : i)}
              aria-expanded={info === i}
            >
              <span>{text}</span>
              <svg viewBox="0 0 180 80" aria-hidden="true">
                <path d={i === 0 ? "M0 8 H110 L175 73" : "M180 8 H90 L5 73"} />
                <circle cx={i === 0 ? 175 : 5} cy="73" r="3" />
              </svg>
            </button>
          ))}
          {info !== null && (
            <div className="annotation-note" role="status">
              <span>
                0{info + 1} / {scene.annotations[info]}
              </span>
              <p>
                {
                  [
                    "Продумываем технические системы вместе с архитектурой. Учитываем назначение и нагрузки объекта.",
                    "Создаём световые сценарии для каждого процесса: от работы команды до впечатления гостя.",
                    "Подбираем покрытия под ежедневную эксплуатацию, эстетику и особенности вашего бизнеса.",
                  ][info]
                }
              </p>
            </div>
          )}
        </div>
        <div className="model-toolbar">
          <span className="model-label">
            <i /> {fallback ? "ВИЗУАЛИЗАЦИЯ" : "ЖИВАЯ 3D-МОДЕЛЬ"}
          </span>
          {!fallback && (
            <>
              <button
                className={exploded ? "tool-button active" : "tool-button"}
                aria-pressed={exploded}
                onClick={() => setExploded(!exploded)}
                title="Раздвинуть инженерные слои"
              >
                <Layers3 size={16} strokeWidth={1.3} />
                <span>{exploded ? "Собрать" : "Разобрать"} объект</span>
                {exploded ? <Minus size={12} /> : <Plus size={12} />}
              </button>
              <button
                className="quality-button"
                onClick={() => setLowPower(!lowPower)}
                aria-pressed={lowPower}
                title="Переключить качество 3D"
              >
                {lowPower ? "Эко" : "HQ"}
              </button>
            </>
          )}
        </div>
        <div className="experience-bottom">
          <nav className="scene-navigation" aria-label="Тип пространства">
            {scenes.map((item, i) => (
              <button
                onClick={() => navigate(i)}
                key={item.id}
                className={index === i ? "active" : ""}
                aria-current={index === i ? "step" : undefined}
              >
                <small>0{i + 1}</small>
                {item.name}
                {i < 4 && <span className="nav-slash">/</span>}
              </button>
            ))}
          </nav>
          <div className="scene-progress">
            <span className="progress-index">
              0{index + 1}
              <span>/ 05</span>
            </span>
            <div
              className="progress-line"
              style={{ "--progress": amount } as CSSProperties}
            >
              <i />
            </div>
            <span className="scroll-hint">
              ЛИСТАЙТЕ, ЧТОБЫ ИССЛЕДОВАТЬ{" "}
              <ArrowDown size={15} strokeWidth={1.2} />
            </span>
          </div>
        </div>
        <div className="side-coordinate" aria-hidden="true">
          АРХИТЕКТУРА · ИНЖЕНЕРИЯ · РЕАЛИЗАЦИЯ
        </div>
      </div>
    </section>
  );
}
