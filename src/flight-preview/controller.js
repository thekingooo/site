(() => {
  'use strict';
  const hero = document.querySelector('.flight');
  if (!hero) return;
  const still = hero.querySelector('#flight-still');
  const players = [...hero.querySelectorAll('video')];
  const previous = hero.querySelector('#flight-prev');
  const next = hero.querySelector('#flight-next');
  const motion = hero.querySelector('#flight-motion');
  const status = hero.querySelector('#flight-status');
  const route = [...hero.querySelectorAll('.flight-route>span')];
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const rooms = [
    ['Лобби', 'Первое впечатление, которое остаётся.', 'Прокрутите, чтобы войти в ресторан', 'Пролететь в ресторан'],
    ['Ресторан', 'Атмосфера, ради которой возвращаются.', 'Прокрутите, чтобы войти в кафе', 'Пролететь в кафе'],
    ['Кафе', 'Место для встреч и любимых привычек.', 'Прокрутите, чтобы войти в офис', 'Пролететь в офис'],
    ['Офис', 'Пространство для команды и новых идей.', 'Прокрутите, чтобы войти в номер отеля', 'Пролететь в номер отеля'],
    ['Номер отеля', 'Комфорт, в котором хочется остаться.', 'Прокрутите, чтобы узнать о нас больше', 'Перейти к информации о компании']
  ];
  let room = 0, busy = false, released = false, noMotion = reduced.matches;
  let active = null, lastWheel = -Infinity, latched = false, cooldown = 0, touchY = null;
  let flightToken = 0, watchdog = 0;
  const posters = rooms.map((_, i) => { const image = new Image(); image.src = `media/room-${i}.webp`; return image; });
  const staticImage = i => `media/${noMotion ? 'original' : 'room'}-${i}.webp`;
  const clip = (from, to) => `media/${to > from ? 'forward' : 'reverse'}-${Math.min(from, to)}.mp4`;
  const anchored = () => !released && window.scrollY < 4 && hero.getBoundingClientRect().top > -4;
  const ui = () => {
    hero.dataset.room = String(room);
    hero.setAttribute('aria-busy', String(busy));
    previous.disabled = busy || room === 0;
    next.disabled = busy;
    motion.disabled = busy;
    next.setAttribute('aria-label', rooms[room][3]);
    hero.querySelector('#flight-room-name').textContent = rooms[room][0];
    hero.querySelector('#flight-room-detail').textContent = rooms[room][1];
    hero.querySelector('#flight-number').textContent = `${String(room + 1).padStart(2, '0')} / 05`;
    hero.querySelector('#flight-hint').textContent = busy ? 'Переходим в следующее пространство…' : rooms[room][2];
    route.forEach((item, i) => i === room ? item.setAttribute('aria-current', 'step') : item.removeAttribute('aria-current'));
    motion.setAttribute('aria-pressed', String(noMotion));
  };
  const prepare = (from, to) => {
    if (to < 0 || to > 4 || noMotion) return null;
    const path = clip(from, to);
    const existing = players.find(p => p.dataset.clip === path);
    if (existing) return existing;
    const p = players.find(p => p !== active);
    p.dataset.clip = path;
    p.src = path;
    p.muted = true;
    p.load();
    return p;
  };
  const preloadNext = () => { if (!busy) prepare(room, room < 4 ? room + 1 : room - 1); };
  function waitForVideo(player) {
    if (player.error) return Promise.reject(new Error('Video unavailable'));
    if (player.readyState >= 3 && !player.error) return Promise.resolve();
    return new Promise((resolve, reject) => {
      const done = error => { clearTimeout(timer);player.removeEventListener('canplay',ok);player.removeEventListener('error',bad);error ? reject(error) : resolve(); };
      const ok = () => done();
      const bad = () => done(new Error('Video unavailable'));
      const timer = setTimeout(() => done(new Error('Video loading timeout')), 12000);
      player.addEventListener('canplay',ok,{once:true});player.addEventListener('error',bad,{once:true});
    });
  }
  function leave(id = 'about') {
    if (busy) return; // The current flight is never interrupted by navigation.
    released = true;
    document.getElementById(id)?.scrollIntoView({behavior:noMotion ? 'instant' : 'smooth',block:'start'});
  }
  async function move(direction) {
    if (busy) return;
    const destination = room + direction;
    if (destination < 0) return;
    if (destination > 4) { leave(); return; }
    busy = true;
    const token = ++flightToken;
    hero.dataset.state = 'loading';
    status.textContent = 'Подготавливаем пролёт…';
    ui();
    const finish = (failed = false) => {
      if (token !== flightToken || !busy) return;
      clearTimeout(watchdog);
      if (active) { active.pause();active.onended=null;active.onerror=null;active.onwaiting=null;active.onplaying=null; }
      room = destination;
      still.src = staticImage(room);
      players.forEach(p => p.classList.remove('is-playing'));
      busy = false;
      hero.dataset.state = 'idle';
      cooldown = performance.now() + 240;
      status.textContent = failed ? 'Видео недоступно. Показано помещение.' : '';
      hero.querySelector('#flight-announcement').textContent = `${rooms[room][0]}. ${room + 1} из 5.`;
      ui();
      preloadNext();
    };
    if (noMotion) {
      const image = new Image();image.src=staticImage(destination);
      try { await image.decode(); } catch (_) { /* Existing frame remains available. */ }
      finish();return;
    }
    try {
      const player = prepare(room,destination);
      active = player;
      await Promise.all([waitForVideo(player),posters[destination].decode().catch(()=>{})]);
      if (token !== flightToken) return;
      player.currentTime = 0;
      player.playbackRate = 1;
      player.onended = () => finish();
      player.onerror = () => finish(true);
      // Waiting does not change the room or clear the last decoded frame.
      player.onwaiting = () => { status.textContent='Загружаем продолжение…'; };
      player.onplaying = () => { status.textContent=''; };
      const reveal = () => { if (token !== flightToken || !busy) return;player.classList.add('is-playing');hero.dataset.state='playing';status.textContent=''; };
      if ('requestVideoFrameCallback' in player) player.requestVideoFrameCallback(reveal);
      await player.play();
      if (!('requestVideoFrameCallback' in player)) reveal();
      watchdog = setTimeout(() => finish(true),18000);
    } catch (_) { finish(true); }
  }
  function onWheel(event) {
    if (event.ctrlKey || Math.abs(event.deltaX)>Math.abs(event.deltaY) || !event.deltaY) return;
    if (!anchored()) return;
    event.preventDefault();
    const now=performance.now(),gap=now-lastWheel;lastWheel=now;
    if (busy || now<cooldown) return;
    // A trackpad tail or a continuous wheel burst is the same gesture.
    if (latched && gap < 200) return;
    latched=true;
    move(event.deltaY>0?1:-1);
  }
  window.addEventListener('wheel',onWheel,{passive:false});
  window.addEventListener('scroll',()=>{if(window.scrollY<3)released=false;},{passive:true});
  next.addEventListener('click',()=>move(1));previous.addEventListener('click',()=>move(-1));
  hero.querySelectorAll('a[href^="#"]').forEach(a=>a.addEventListener('click',e=>{
    e.preventDefault();
    if(busy)return;
    if(a.hash==='#sequence'){window.scrollTo({top:0,behavior:'instant'});return;}
    leave(a.hash.slice(1));
  }));
  document.addEventListener('keydown',e=>{
    if(!anchored() || e.ctrlKey || e.metaKey || e.altKey || e.target.closest('input,textarea,select,button,a,[contenteditable]'))return;
    const forward=['ArrowDown','PageDown',' '].includes(e.key),back=['ArrowUp','PageUp'].includes(e.key);
    if(!forward&&!back)return;e.preventDefault();if(!e.repeat&&!busy)move(forward?1:-1);
  });
  hero.addEventListener('touchstart',e=>{touchY=e.touches.length===1?e.touches[0].clientY:null;},{passive:true});
  hero.addEventListener('touchmove',e=>{if(anchored()&&touchY!==null&&e.touches.length===1)e.preventDefault();},{passive:false});
  hero.addEventListener('touchend',e=>{if(!anchored()||touchY===null)return;const distance=touchY-e.changedTouches[0].clientY;touchY=null;if(Math.abs(distance)>30&&!busy&&performance.now()>cooldown)move(distance>0?1:-1);},{passive:true});
  hero.addEventListener('touchcancel',()=>{touchY=null;},{passive:true});
  motion.addEventListener('click',()=>{if(busy)return;noMotion=!noMotion;still.src=staticImage(room);ui();preloadNext();});
  reduced.addEventListener('change',()=>{if(!busy){noMotion=reduced.matches;still.src=staticImage(room);ui();preloadNext();}});
  document.addEventListener('visibilitychange',()=>{if(!document.hidden&&busy&&active?.paused&&hero.dataset.state==='playing')active.play().catch(()=>{});});
  // Read-only diagnostics used in browser checks; never changes navigation state.
  Object.defineProperty(window,'fpFlight',{get:()=>({room,busy,state:hero.dataset.state,reduced:noMotion,time:active?.currentTime||0})});
  still.src=staticImage(0);
  ui();preloadNext();
})();
