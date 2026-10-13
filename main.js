// Движение страницы: плавный скролл, появление блоков, живой первый экран.
// Всё деградирует мягко: без GSAP/Lenis или при reduced-motion сайт просто
// статичен, но полностью читается.
(() => {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = matchMedia('(pointer: fine)').matches;

  /* ---------- прелоадер: раз за сессию ---------- */
  const pre = document.getElementById('pre');
  const seen = sessionStorage.getItem('sloy_pre');
  const dropPre = () => { pre.classList.add('out'); setTimeout(() => pre.remove(), 800); };
  if (seen || reduced) { pre.remove(); } else { sessionStorage.setItem('sloy_pre', '1'); setTimeout(dropPre, 1500); }

  /* ---------- плавный скролл ---------- */
  let lenis = null;
  if (!reduced && window.Lenis) {
    lenis = new Lenis({ lerp: 0.09, smoothWheel: true });
    const raf = (t) => { lenis.raf(t); requestAnimationFrame(raf); };
    requestAnimationFrame(raf);
  }
  const scrollTo = (hash) => {
    const el = document.querySelector(hash);
    if (!el) return;
    if (lenis) lenis.scrollTo(el, { offset: -72 });
    else el.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth' });
  };
  document.querySelectorAll('a[href^="#"]').forEach((a) => {
    a.addEventListener('click', (e) => {
      const h = a.getAttribute('href');
      if (h.length < 2) return;
      e.preventDefault();
      document.body.classList.remove('menu-open');
      scrollTo(h);
    });
  });

  /* ---------- шапка и мобильное меню ---------- */
  const nav = document.getElementById('nav');
  const burger = document.querySelector('.burger');
  const onScroll = () => nav.classList.toggle('on', scrollY > 24);
  onScroll();
  addEventListener('scroll', onScroll, { passive: true });
  burger.addEventListener('click', () => {
    const open = document.body.classList.toggle('menu-open');
    burger.setAttribute('aria-expanded', String(open));
  });

  /* ---------- появление по скроллу ---------- */
  const io = new IntersectionObserver((es) => {
    es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
  document.querySelectorAll('[data-rv]').forEach((el, i) => {
    // соседи внутри одной сетки появляются с небольшим шагом
    el.style.transitionDelay = `${(i % 4) * 70}ms`;
    io.observe(el);
  });

  /* ---------- плитки ленты: открываются как шторки ---------- */
  const grid = document.getElementById('igGrid');
  if (grid) {
    const tiles = [...grid.querySelectorAll('.tile')];
    const gio = new IntersectionObserver((es) => {
      if (!es[0].isIntersecting) return;
      tiles.forEach((t, i) => setTimeout(() => t.classList.add('in'), 90 * i));
      gio.disconnect();
    }, { threshold: 0.35 });
    gio.observe(grid);
  }

  /* ---------- первый экран ---------- */
  const video = document.getElementById('heroVideo');
  if (video && !reduced && !matchMedia('(max-width: 760px)').matches) {
    // видео подхватываем только на больших экранах и только когда шрифты и
    // постер уже на месте — иначе первый экран ждёт мегабайты зря
    const start = () => {
      video.preload = 'auto';
      video.load();
      video.play().then(() => { video.style.opacity = '1'; }).catch(() => {});
    };
    // не сразу: сначала постер и шрифты, потом видео — иначе первый экран ждёт
    setTimeout(start, document.readyState === 'complete' ? 300 : 1200);
  }

  if (window.gsap && !reduced) {
    gsap.registerPlugin(ScrollTrigger);
    if (lenis) { lenis.on('scroll', ScrollTrigger.update); gsap.ticker.lagSmoothing(0); }
    const delay = seen ? 0.1 : 1.3;
    gsap.from('[data-l]', { yPercent: 105, duration: 1.15, stagger: 0.09, ease: 'power3.out', delay });
    gsap.from('.hero .eyebrow', { opacity: 0, y: 10, duration: .8, delay: delay + 0.1 });
    // лёгкий параллакс фона и затухание при уходе с первого экрана
    gsap.to('.hero-media', { yPercent: 14, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });
    gsap.to('.hero .wrap', { opacity: 0, y: -40, ease: 'none', scrollTrigger: { trigger: '.hero', start: '40% top', end: 'bottom top', scrub: true } });
    // телефон с лентой чуть всплывает навстречу
    gsap.from('.phone', { y: 80, rotate: -2, ease: 'none', scrollTrigger: { trigger: '.feed', start: 'top 80%', end: 'top 20%', scrub: 0.6 } });
  }

  /* ---------- липкая кнопка на телефоне ---------- */
  const sticky = document.getElementById('sticky');
  const stickyTick = () => {
    const nearEnd = scrollY + innerHeight > document.documentElement.scrollHeight - innerHeight * 1.1;
    sticky.classList.toggle('on', scrollY > innerHeight * 1.1 && !nearEnd);
  };
  stickyTick();
  addEventListener('scroll', stickyTick, { passive: true });

  /* ---------- курсор-кольцо ---------- */
  if (fine && !reduced) {
    const ring = document.querySelector('.ring');
    let x = innerWidth / 2, y = innerHeight / 2, tx = x, ty = y;
    addEventListener('mousemove', (e) => { tx = e.clientX; ty = e.clientY; }, { passive: true });
    const loop = () => { x += (tx - x) * 0.18; y += (ty - y) * 0.18; ring.style.transform = `translate(${x}px,${y}px) translate(-50%,-50%)`; requestAnimationFrame(loop); };
    loop();
    document.querySelectorAll('a,button,summary').forEach((el) => {
      el.addEventListener('mouseenter', () => document.body.classList.add('hovering'));
      el.addEventListener('mouseleave', () => document.body.classList.remove('hovering'));
    });
  }
})();
