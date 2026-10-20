"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type RefObject,
} from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { sceneState } from "@/lib/timeline";

export function useScrollScene(track: RefObject<HTMLElement | null>) {
  const progress = useRef(0);
  const [index, setIndex] = useState(0);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [amount, setAmount] = useState(0);
  const trigger = useRef<ScrollTrigger | null>(null);
  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);
  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    if (!track.current) return;
    const state = { value: 0 };
    const tween = gsap.to(state, {
      value: 1,
      ease: "none",
      onUpdate: () => {
        progress.current = state.value;
        const next = sceneState(state.value).index;
        setIndex((previous) => (previous === next ? previous : next));
        // Keep the final scrub frame exact: quantization can stop a demand-
        // rendered canvas a fraction of a turn before its target.
        setAmount(state.value);
      },
      scrollTrigger: {
        trigger: track.current,
        start: "top top",
        end: "bottom bottom",
        scrub: reducedMotion ? true : 0.65,
        invalidateOnRefresh: true,
      },
    });
    trigger.current = tween.scrollTrigger!;
    return () => {
      trigger.current = null;
      tween.scrollTrigger?.kill();
      tween.kill();
    };
  }, [track, reducedMotion]);
  const navigate = useCallback(
    (next: number) => {
      const t = trigger.current;
      if (!t) return;
      window.scrollTo({
        top: t.start + ((t.end - t.start) * next) / 4,
        behavior: reducedMotion ? "instant" : "smooth",
      });
      window.dispatchEvent(
        new CustomEvent("prostranstvo:interaction", {
          detail: { type: "scene", scene: next },
        }),
      );
    },
    [reducedMotion],
  );
  return { progress, index, amount, navigate, reducedMotion };
}
