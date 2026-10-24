'use client';
import { useCallback, useEffect, useRef, useState, type RefObject } from 'react';


export function useVideoScroll(track: RefObject<HTMLElement | null>, video: RefObject<HTMLVideoElement | null>, fps = 30) {
  const [progress, setProgress] = useState(0);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const target = useRef(0);
  const displayed = useRef(0);
  const requestFrame = useRef<() => void>(() => {});
  const setPosition = useCallback((next: number) => {
    const p = Math.max(0, Math.min(1, next));
    if (reducedMotion) { target.current = p; requestFrame.current(); return; }
    const element = track.current;
    if (!element) return;
    const start = element.getBoundingClientRect().top + window.scrollY;
    window.scrollTo({ top: start + p * Math.max(1, element.offsetHeight - window.innerHeight), behavior: 'instant' });
  }, [track, reducedMotion]);
  useEffect(() => {
    const media = matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReducedMotion(media.matches);
    update(); media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);
  useEffect(() => {
    const element = track.current, player = video.current;
    if (!element || !player) return;
    let raf = 0, last = 0, seeking = false, disposed = false;
    const seek = () => {
      if (disposed || seeking || player.readyState < 1 || !Number.isFinite(player.duration)) return;
      // Match exact source frame timestamps, including the last decoded frame.
      const lastFrame = Math.max(0, Math.round(player.duration * fps) - 1);
      const time = Math.round(displayed.current * lastFrame) / fps;
      if (Math.abs(player.currentTime - time) < 1 / (fps * 2)) return;
      seeking = true; player.currentTime = time;
    };
    const tick = (now: number) => {
      raf = 0;
      const elapsed = last ? Math.min(64, now - last) : 16; last = now;
      const delta = target.current - displayed.current;
      displayed.current = reducedMotion || Math.abs(delta) < .0003 ? target.current : displayed.current + delta * (1 - Math.exp(-elapsed / 65));
      setProgress(displayed.current); seek();
      if (Math.abs(target.current - displayed.current) > .00001) raf = requestAnimationFrame(tick);
      else last = 0;
    };
    const schedule = () => { if (!disposed && !raf) raf = requestAnimationFrame(tick); };
    requestFrame.current = schedule;
    const scroll = () => {
      if (reducedMotion) return;
      const start = element.getBoundingClientRect().top + window.scrollY;
      target.current = Math.max(0, Math.min(1, (window.scrollY - start) / Math.max(1, element.offsetHeight - window.innerHeight)));
      schedule();
    };
    const loaded = () => { setReady(true); setError(false); seeking = false; seek(); };
    const seeked = () => { seeking = false; seek(); };
    const failed = () => { seeking = false; setError(true); };
    player.muted = true; player.pause();
    player.addEventListener('loadeddata', loaded);
    player.addEventListener('loadedmetadata', seek);
    player.addEventListener('seeked', seeked);
    player.addEventListener('error', failed);
    window.addEventListener('scroll', scroll, { passive: true });
    window.addEventListener('resize', scroll);
    if (player.readyState >= 2) loaded();
    scroll();
    return () => {
      disposed = true; cancelAnimationFrame(raf); requestFrame.current = () => {};
      player.removeEventListener('loadeddata', loaded); player.removeEventListener('loadedmetadata', seek);
      player.removeEventListener('seeked', seeked); player.removeEventListener('error', failed);
      window.removeEventListener('scroll', scroll); window.removeEventListener('resize', scroll);
    };
  }, [track, video, reducedMotion, fps]);
  return { progress, ready, error, reducedMotion, setPosition };
}
