/* Студия 20,93 — поведение страниц. Без библиотек. */
(function () {
  'use strict';
  var doc = document.documentElement;
  doc.classList.add('js');
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- прелоадер (главная, один раз за сессию) ---------- */
  var pre = document.querySelector('.preloader');
  if (pre) {
    var seen = false;
    try { seen = sessionStorage.getItem('s2093-intro') === '1'; } catch (e) {}
    if (seen || reduce) {
      pre.remove();
    } else {
      try { sessionStorage.setItem('s2093-intro', '1'); } catch (e) {}
      document.body.style.overflow = 'hidden';
      setTimeout(function () {
        pre.classList.add('is-done');
        document.body.style.overflow = '';
        setTimeout(function () { pre.remove(); }, 700);
        check();
      }, 3000);
    }
  }

  /* ---------- меню ---------- */
  var menu = document.getElementById('menu');
  var burger = document.querySelector('.burger');
  function openMenu() {
    menu.classList.add('is-open');
    menu.setAttribute('aria-hidden', 'false');
    burger.setAttribute('aria-expanded', 'true');
    var f = menu.querySelector('.menu__close');
    if (f) f.focus();
  }
  function closeMenu() {
    menu.classList.remove('is-open');
    menu.setAttribute('aria-hidden', 'true');
    burger.setAttribute('aria-expanded', 'false');
  }
  if (menu && burger) {
    burger.addEventListener('click', openMenu);
    menu.addEventListener('click', function (e) {
      if (e.target.closest('[data-close]') || e.target.closest('.menu__panel a')) closeMenu();
    });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeMenu(); });
  }

  /* ---------- «Назад» на страницах кейсов ---------- */
  var back = document.querySelector('[data-back]');
  if (back) back.addEventListener('click', function (e) {
    if (document.referrer && document.referrer.indexOf(location.host) !== -1 && history.length > 1) {
      e.preventDefault();
      history.back();
    }
  });

  /* ---------- появление при прокрутке и «залипание» картинок коллажа ----------
     Проверяем положение по scroll/resize, а не через IntersectionObserver:
     на быстрой прокрутке он пропускал элементы. */
  var anims = [].slice.call(document.querySelectorAll('[data-anim]'));
  var pins = [].slice.call(document.querySelectorAll('[data-pin]'));
  var desktop = window.matchMedia('(min-width: 961px)');
  var ticking = false;

  function check() {
    ticking = false;
    var vh = window.innerHeight;
    if (anims.length) {
      anims = anims.filter(function (el) {
        var r = el.getBoundingClientRect();
        if (r.top < vh * 0.92 && r.bottom > 0) { el.classList.add('is-in'); return false; }
        return true;
      });
    }
    if (!reduce && desktop.matches) {
      pins.forEach(function (el) {
        var box = el.parentNode.getBoundingClientRect();
        var max = parseFloat(el.getAttribute('data-pin')) * doc.clientWidth / 1200;
        var y = Math.min(Math.max(-box.top, 0), max);
        el.style.transform = y ? 'translateY(' + y + 'px)' : '';
      });
    }
  }
  function onScroll() { if (!ticking) { ticking = true; requestAnimationFrame(check); } }
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  window.addEventListener('load', check);
  check();

  /* ---------- видео Kinescope: iframe создаётся, когда блок близко к экрану ---------- */
  var kins = [].slice.call(document.querySelectorAll('.kin[data-kin]'));
  function loadKin() {
    var vh = window.innerHeight;
    kins = kins.filter(function (box) {
      var r = box.getBoundingClientRect();
      if (r.top < vh * 2 && r.bottom > -vh) {
        var auto = box.hasAttribute('data-auto');
        var src = 'https://kinescope.io/embed/' + box.getAttribute('data-kin') +
          (auto ? '?autoplay=true&muted=true&loop=true&autopause=false&playsinline=true' : '');
        var f = document.createElement('iframe');
        f.src = src;
        f.title = box.getAttribute('data-title') || 'Видео';
        f.allow = 'autoplay; fullscreen; picture-in-picture; encrypted-media; gyroscope; accelerometer; clipboard-write';
        f.setAttribute('allowfullscreen', '');
        f.loading = 'lazy';
        box.appendChild(f);
        return false;
      }
      return true;
    });
    if (!kins.length) {
      window.removeEventListener('scroll', loadKin);
      window.removeEventListener('resize', loadKin);
    }
  }
  if (kins.length) {
    window.addEventListener('scroll', loadKin, { passive: true });
    window.addEventListener('resize', loadKin);
    loadKin();
  }

  /* ---------- слайдер услуг на главной ---------- */
  var slider = document.querySelector('.slider');
  if (slider) {
    var slides = [].slice.call(slider.querySelectorAll('.slide'));
    var navs = [].slice.call(slider.querySelectorAll('.slider__nav button'));
    var cur = 0;
    var go = function (i) {
      cur = (i + slides.length) % slides.length;
      slides.forEach(function (s, k) {
        s.classList.toggle('is-active', k === cur);
        s.setAttribute('aria-hidden', k === cur ? 'false' : 'true');
        s.inert = k !== cur;
      });
      navs.forEach(function (b, k) { b.classList.toggle('is-active', k === cur); b.setAttribute('aria-current', k === cur ? 'true' : 'false'); });
    };
    navs.forEach(function (b, k) { b.addEventListener('click', function () { go(k); }); });
    slider.querySelector('.prev').addEventListener('click', function () { go(cur - 1); });
    slider.querySelector('.next').addEventListener('click', function () { go(cur + 1); });
    var x0 = null;
    slider.addEventListener('touchstart', function (e) { x0 = e.touches[0].clientX; }, { passive: true });
    slider.addEventListener('touchend', function (e) {
      if (x0 === null) return;
      var dx = e.changedTouches[0].clientX - x0;
      if (Math.abs(dx) > 50) go(cur + (dx < 0 ? 1 : -1));
      x0 = null;
    });
    go(0);
  }

  /* ---------- вкладки «на модели / предметная» ---------- */
  var tabs = [].slice.call(document.querySelectorAll('.tabs [data-tab]'));
  tabs.forEach(function (btn) {
    btn.addEventListener('click', function () {
      tabs.forEach(function (b) {
        var on = b === btn;
        b.classList.toggle('is-active', on);
        b.setAttribute('aria-selected', on ? 'true' : 'false');
        document.getElementById(b.getAttribute('data-tab')).hidden = !on;
      });
    });
  });
})();
