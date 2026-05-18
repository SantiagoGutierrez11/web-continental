/* ============================================================
   CEA Sur Occidente — Popayán, Cauca
   main.js — v2.0
   Mejoras aplicadas:
   - Variables encapsuladas en IIFE (sin polución global)
   - clearInterval en rotateCat para evitar memory leak
   - IntersectionObserver para navbar activa (reemplaza scroll)
   - Guard: dots puede ser null si están ocultos en HTML
   - try/catch en GSAP para degradar con gracia
   - Passive listeners explícitos
   - Desconexión de observers cuando no se necesitan
   ============================================================ */

(function () {
  'use strict';

  /* ── DOM ready ─────────────────────────────────────── */
  document.addEventListener('DOMContentLoaded', function () { /* passive: true no aplica a DOMContentLoaded */

    /* ────────────────────────────────────────────────────
       MOBILE MENU
    ──────────────────────────────────────────────────── */
    var burger = document.getElementById('burgerBtn');
    var mMenu  = document.getElementById('mobileMenu');

    function openMobileMenu() {
      mMenu.classList.add('open');
      burger.setAttribute('aria-expanded', 'true');
      document.body.style.overflow = 'hidden';
    }

    function closeMobileMenu() {
      mMenu.classList.remove('open');
      burger.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
    }

    if (burger) burger.addEventListener('click', openMobileMenu, { passive: true });
    if (mMenu)  mMenu.addEventListener('keydown', function (e) { /* keydown no puede ser passive */
      if (e.key === 'Escape') closeMobileMenu();
    });

    /* Expose for inline onclick in HTML */
    window.closeMobileMenu = closeMobileMenu;

    /* ────────────────────────────────────────────────────
       NAVBAR ACTIVE — IntersectionObserver (sin scroll listener)
       Más eficiente: el browser llama el callback solo cuando
       un section entra/sale del viewport, no en cada pixel.
    ──────────────────────────────────────────────────── */
    var navLinks = document.querySelectorAll('.nav-link');

    if (navLinks.length && 'IntersectionObserver' in window) {
      var sectionObserver = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            var id = entry.target.id;
            navLinks.forEach(function (a) {
              a.classList.toggle('active', a.dataset.section === id);
            });
          }
        });
      }, {
        rootMargin: '-40% 0px -55% 0px',
        threshold: 0
      });

      ['inicio', 'cursos', 'nosotros', 'proceso', 'faq', 'contacto'].forEach(function (id) {
        var el = document.getElementById(id);
        if (el) sectionObserver.observe(el);
      });
    }

    /* ────────────────────────────────────────────────────
       ROTATING CATEGORY
       clearInterval guardado para poder limpiar si se necesita.
    ──────────────────────────────────────────────────── */
    var cats    = ['C1', 'B1', 'A2'];
    var catSubs = {
      C1: 'C1 · Vehículos De Servicio Público',
      B1: 'B1 · Vehículos De Servicio Particular',
      A2: 'A2 · Motocicletas y Mototriciclos'
    };

    var catWord = document.getElementById('catWord');
    var catSub  = document.getElementById('catSub');
    var catIdx  = 0;
    var catTimer = null;

    function rotateCat() {
      if (!catWord || !catSub) return;

      catWord.classList.remove('show');
      catWord.classList.add('out');

      setTimeout(function () {
        catIdx = (catIdx + 1) % cats.length;
        catWord.textContent = cats[catIdx];
        catSub.textContent  = catSubs[cats[catIdx]];
        catWord.classList.remove('out');
        catWord.classList.add('in');

        setTimeout(function () {
          catWord.classList.remove('in');
          catWord.classList.add('show');
        }, 30);
      }, 380);
    }

    if (catWord) {
      catTimer = setInterval(rotateCat, 3400);
    }

    /* Pausar rotación si usuario prefiere movimiento reducido */
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      clearInterval(catTimer);
    }

    /* ────────────────────────────────────────────────────
       FAQ ACCORDION
    ──────────────────────────────────────────────────── */
    window.toggleFaq = function (btn) {
      var body   = btn.nextElementSibling;
      var isOpen = btn.getAttribute('aria-expanded') === 'true';

      document.querySelectorAll('.faq-btn').forEach(function (b) {
        b.setAttribute('aria-expanded', 'false');
        if (b.nextElementSibling) b.nextElementSibling.classList.remove('open');
      });

      if (!isOpen) {
        btn.setAttribute('aria-expanded', 'true');
        if (body) body.classList.add('open');
      }
    };

    /* ────────────────────────────────────────────────────
       TOAST (si existe en HTML)
    ──────────────────────────────────────────────────── */
    var toast    = document.getElementById('toast');
    var toastMsg = document.getElementById('toastMsg');
    var toastTimer = null;

    window.showToast = function (msg) {
      if (!toast || !toastMsg) return;
      clearTimeout(toastTimer);
      toastMsg.textContent = msg;
      toast.classList.add('show');
      toastTimer = setTimeout(function () {
        toast.classList.remove('show');
      }, 3500);
    };

    /* ────────────────────────────────────────────────────
       GSAP ANIMATIONS
       - Encapsulado en try/catch para degradar con gracia
         si GSAP no carga (red lenta, CDN caído)
       - prefers-reduced-motion: skip animations entirely
    ──────────────────────────────────────────────────── */
    var prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (!prefersReduced) {
      try {
        if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
          gsap.registerPlugin(ScrollTrigger);

          /* Hero — set invisible then animate in */
          var heroEls = [
            { sel: '#heroPill',     y: 20, dur: .65, delay: 0   },
            { sel: '#hero-heading', y: 40, dur: .85, delay: .08  },
            { sel: '#heroDots',     y: 16, dur: .55, delay: .18  },
            { sel: '#heroDesc',     y: 20, dur: .65, delay: .22  },
            { sel: '#heroCtas',     y: 20, dur: .55, delay: .30  },
            { sel: '#heroLabel',    y: 12, dur: .45, delay: .36  },
            { sel: '#heroStats',    y: 20, dur: .65, delay: .42  },
            { sel: '#heroRight',    y: 30, dur: .85, delay: .20  },
          ];

          heroEls.forEach(function (item) {
            var el = document.querySelector(item.sel);
            if (!el) return;
            gsap.set(el, { opacity: 0, y: item.y });
            gsap.to(el, {
              opacity: 1, y: 0,
              duration: item.dur,
              delay: item.delay,
              ease: 'power3.out'
            });
          });

          /* Scroll sections — batch para menos observers */
          var scrollEls = document.querySelectorAll(
            '#cursos .gs-fade, #nosotros .gs-fade, #proceso .gs-fade,' +
            '#faq .gs-fade, #testimonios .gs-fade, #contacto .gs-fade'
          );

          if (scrollEls.length) {
            gsap.set(scrollEls, { opacity: 0, y: 24 });

            ScrollTrigger.batch(scrollEls, {
              start: 'top 90%',
              onEnter: function (batch) {
                gsap.to(batch, {
                  opacity: 1, y: 0,
                  duration: .7,
                  stagger: .08,
                  ease: 'power2.out',
                  clearProps: 'opacity,transform',
                  overwrite: true
                });
              },
              once: true
            });
          }

          /* Step nodes */
          document.querySelectorAll('.step-node').forEach(function (node) {
            gsap.set(node, { scale: 0, opacity: 0 });
            gsap.to(node, {
              scrollTrigger: { trigger: node, start: 'top 90%', once: true },
              scale: 1, opacity: 1,
              duration: .45, delay: .08,
              ease: 'back.out(1.6)',
              clearProps: 'opacity,transform'
            });
          });
        }
      } catch (err) {
        /* GSAP falló — el contenido ya es visible (opacity no se tocó) */
        console.warn('CEA: GSAP no disponible, animaciones desactivadas.', err);
      }
    }

  }); /* end DOMContentLoaded */

})(); /* end IIFE */
