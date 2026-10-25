'use client';
import { useCallback, useEffect, useRef, useState, type RefObject } from 'react';

export function useSpaceScroll(track: RefObject<HTMLElement | null>) {
  const [progress, setProgress] = useState(0);
  const [reducedMotion, setReducedMotion] = useState(false);
  const target = useRef(0), displayed = useRef(0);
  const schedule = useRef<() => void>(() => {});
  useEffect(() => {
    const media = matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReducedMotion(media.matches);
    update(); media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);
  useEffect(() => {
    const element = track.current;
    if (!element) return;
    let raf = 0, last = 0;
    const tick = (now: number) => {
      raf = 0;
      const dt = last ? Math.min(64, now - last) : 16; last = now;
      const delta = target.current - displayed.current;
      displayed.current = reducedMotion || Math.abs(delta) < .0001 ? target.current : displayed.current + delta * (1 - Math.exp(-dt / 110));
      setProgress(displayed.current);
      if (displayed.current !== target.current) raf = requestAnimationFrame(tick);
      else last = 0;
    };
    schedule.current = () => { if (!raf) raf = requestAnimationFrame(tick); };
    const scroll = () => {
      if (reducedMotion) return;
      const start = element.getBoundingClientRect().top + window.scrollY;
      target.current = Math.max(0, Math.min(1, (window.scrollY - start) / Math.max(1, element.offsetHeight - window.innerHeight)));
      schedule.current();
    };
    window.addEventListener('scroll', scroll, { passive: true });
    window.addEventListener('resize', scroll);
    scroll();
    return () => {
      cancelAnimationFrame(raf); schedule.current = () => {};
      window.removeEventListener('scroll', scroll); window.removeEventListener('resize', scroll);
    };
  }, [track, reducedMotion]);
  const setPosition = useCallback((value: number) => {
    const p = Math.max(0, Math.min(1, value));
    if (reducedMotion) { target.current = p; schedule.current(); return; }
    const element = track.current;
    if (!element) return;
    window.scrollTo({ top: element.getBoundingClientRect().top + window.scrollY + p * Math.max(1, element.offsetHeight - window.innerHeight), behavior: 'instant' });
  }, [track, reducedMotion]);
  return { progress, reducedMotion, setPosition };
}

// A small perspective tilt of the entire registered image stack, not a 3D reconstruction.
export function usePointerTilt(hero: RefObject<HTMLDivElement | null>, surface: RefObject<HTMLDivElement | null>, reducedMotion: boolean) {
  useEffect(() => {
    const root = hero.current, plane = surface.current;
    if (!root || !plane) return;
    const fine = matchMedia('(hover: hover) and (pointer: fine)');
    let raf = 0, last = 0, x = 0, y = 0, tx = 0, ty = 0;
    const paint = () => { plane.style.transform = `translate3d(${(x * 11).toFixed(3)}px, ${(y * 7).toFixed(3)}px, 0) rotateX(${(-y * 1.6).toFixed(3)}deg) rotateY(${(x * 2.4).toFixed(3)}deg)`; };
    const tick = (now: number) => {
      raf = 0;
      const dt = last ? Math.min(64, now - last) : 16; last = now;
      const k = 1 - Math.exp(-dt / 170);
      x += (tx - x) * k; y += (ty - y) * k;
      const settled = Math.abs(tx - x) + Math.abs(ty - y) < .001;
      if (settled) { x = tx; y = ty; last = 0; }
      paint();
      if (!settled) raf = requestAnimationFrame(tick);
    };
    const request = () => { if (!raf) raf = requestAnimationFrame(tick); };
    const reset = () => { tx = 0; ty = 0; request(); };
    const move = (event: PointerEvent) => {
      if (reducedMotion || !fine.matches || event.pointerType === 'touch') return;
      const rect = root.getBoundingClientRect();
      tx = Math.max(-1, Math.min(1, (event.clientX - rect.left) / rect.width * 2 - 1));
      ty = Math.max(-1, Math.min(1, (event.clientY - rect.top) / rect.height * 2 - 1));
      request();
    };
    paint();
    root.addEventListener('pointermove', move);
    root.addEventListener('pointerleave', reset);
    window.addEventListener('blur', reset);
    fine.addEventListener('change', reset);
    return () => {
      cancelAnimationFrame(raf); plane.style.transform = '';
      root.removeEventListener('pointermove', move); root.removeEventListener('pointerleave', reset);
      window.removeEventListener('blur', reset); fine.removeEventListener('change', reset);
    };
  }, [hero, surface, reducedMotion]);
}
