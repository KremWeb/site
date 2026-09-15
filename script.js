'use strict';

/* ==========================================================================
   CONFIG — единое место для контактных данных.
   Замените значения ниже перед публикацией сайта.
   Все места на странице с data-config="..." обновятся автоматически.
   ========================================================================== */
const CONFIG = {
  telegramLabel: '@sities_ua',             // как отображается текст
  phoneHref: 'tel:+380 66 385 06 63',              // номер в формате для звонка
  phoneLabel: '+380 66 385 06 63',             // как отображается текст
  emailHref: 'mailto:hello@example.com',
  emailLabel: 'hello@example.com',
  instagramUrl: 'https://www.instagram.com/sities_ua?stkn=Y3o4MjMybWkyMDdr&utm_source=qr',
  instagramLabel: '@',
};

document.addEventListener('DOMContentLoaded', () => {
  applyConfig();
  initHeaderScroll();
  initMobileMenu();
  initSmoothScroll();
  initModals();
  initAccordion();
  initBackToTop();
  initRevealAnimations();
  initForm();
});

/* ==========================================================================
   Apply CONFIG values to every element with data-config
   ========================================================================== */
function applyConfig() {
  const labelMap = {
    telegramUrl: CONFIG.telegramLabel,
    phoneHref: CONFIG.phoneLabel,
    emailHref: CONFIG.emailLabel,
    instagramUrl: CONFIG.instagramLabel,
  };

  document.querySelectorAll('[data-config]').forEach((el) => {
    const key = el.getAttribute('data-config');
    if (!(key in CONFIG)) return;
    el.setAttribute('href', CONFIG[key]);
    // Footer icons keep their own short label (Telegram/Instagram/Email),
    // contact-block values show the readable label (e.g. @username).
    if (el.closest('.contacts__list')) {
      el.textContent = labelMap[key] ?? el.textContent;
    }
  });
}

/* ==========================================================================
   Header: shrink/solid background on scroll
   ========================================================================== */
function initHeaderScroll() {
  const header = document.getElementById('header');
  const onScroll = () => {
    header.style.boxShadow = window.scrollY > 10 ? '0 1px 0 rgba(0,0,0,.2)' : 'none';
  };
  document.addEventListener('scroll', onScroll, { passive: true });
}

/* ==========================================================================
   Mobile hamburger menu
   ========================================================================== */
function initMobileMenu() {
  const burger = document.getElementById('burger');
  const mobileNav = document.getElementById('mobile-nav');

  const closeMenu = () => {
    mobileNav.classList.remove('is-open');
    burger.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
  };
  const openMenu = () => {
    mobileNav.classList.add('is-open');
    burger.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
  };

  burger.addEventListener('click', () => {
    const isOpen = mobileNav.classList.contains('is-open');
    isOpen ? closeMenu() : openMenu();
  });

  mobileNav.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', closeMenu);
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeMenu();
  });
}

/* ==========================================================================
   Smooth scroll for in-page anchor links (native CSS handles most of it;
   this closes the mobile menu and accounts for the sticky header offset)
   ========================================================================== */
function initSmoothScroll() {
  const header = document.getElementById('header');
  document.querySelectorAll('a[href^="#"]').forEach((link) => {
    link.addEventListener('click', (e) => {
      const id = link.getAttribute('href');
      if (id.length < 2) return;
      const target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      const headerH = header.getBoundingClientRect().height;
      const top = target.getBoundingClientRect().top + window.scrollY - headerH - 12;
      window.scrollTo({ top, behavior: 'smooth' });
      history.pushState(null, '', id);
    });
  });
}

/* ==========================================================================
   Modals (services, works, privacy)
   ========================================================================== */
function initModals() {
  const overlay = document.getElementById('modal-overlay');
  let lastFocused = null;

  function openModal(id) {
    const modal = document.getElementById(id);
    if (!modal) return;
    document.querySelectorAll('.modal').forEach((m) => (m.hidden = true));
    modal.hidden = false;
    overlay.classList.add('is-open');
    document.body.style.overflow = 'hidden';
    lastFocused = document.activeElement;
    modal.querySelector('.modal__close').focus();
  }

  function closeModal() {
    overlay.classList.remove('is-open');
    document.body.style.overflow = '';
    document.querySelectorAll('.modal').forEach((m) => (m.hidden = true));
    if (lastFocused) lastFocused.focus();
  }

  document.querySelectorAll('[data-modal]').forEach((trigger) => {
    trigger.addEventListener('click', () => openModal(trigger.getAttribute('data-modal')));
    // Work cards are focusable divs — allow Enter/Space to open them
    if (trigger.getAttribute('role') === 'button') {
      trigger.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          openModal(trigger.getAttribute('data-modal'));
        }
      });
    }
  });

  document.querySelectorAll('[data-close]').forEach((btn) => {
    btn.addEventListener('click', closeModal);
  });

  // Click outside modal content closes it
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) closeModal();
  });

  // Escape closes it
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && overlay.classList.contains('is-open')) closeModal();
  });

  // "Открыть проект" buttons inside demo work modals — these are demo
  // projects with no real live link, so we explain that instead of a 404.
  document.querySelectorAll('[data-demo-link]').forEach((btn) => {
    btn.addEventListener('click', () => {
      showToast('Это демонстрационный проект без отдельной ссылки — он создан для примера оформления.');
    });
  });
}

/* ==========================================================================
   FAQ accordion
   ========================================================================== */
function initAccordion() {
  document.querySelectorAll('.accordion__trigger').forEach((trigger) => {
    const panel = trigger.nextElementSibling;
    panel.style.maxHeight = '0px';

    trigger.addEventListener('click', () => {
      const isOpen = trigger.getAttribute('aria-expanded') === 'true';

      // Close any other open item (single-open accordion)
      document.querySelectorAll('.accordion__trigger[aria-expanded="true"]').forEach((other) => {
        if (other !== trigger) {
          other.setAttribute('aria-expanded', 'false');
          other.nextElementSibling.style.maxHeight = '0px';
        }
      });

      trigger.setAttribute('aria-expanded', String(!isOpen));
      panel.style.maxHeight = isOpen ? '0px' : panel.scrollHeight + 'px';
    });
  });
}

/* ==========================================================================
   Back-to-top button
   ========================================================================== */
function initBackToTop() {
  const btn = document.getElementById('to-top');
  document.addEventListener(
    'scroll',
    () => {
      btn.classList.toggle('is-visible', window.scrollY > 600);
    },
    { passive: true }
  );
  btn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
}

/* ==========================================================================
   Reveal-on-scroll — subtle, applied once per element, not stacked with
   any other motion, so it stays a single quiet gesture per section.
   ========================================================================== */
function initRevealAnimations() {
  const targets = document.querySelectorAll('.section__head, .card, .line__item, .contacts__list li');
  targets.forEach((el) => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(16px)';
    el.style.transition = 'opacity .5s ease, transform .5s ease';
  });

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.style.opacity = '1';
          entry.target.style.transform = 'translateY(0)';
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15 }
  );

  targets.forEach((el) => observer.observe(el));
}

/* ==========================================================================
   Toast notifications
   ========================================================================== */
let toastTimer = null;
function showToast(message) {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.classList.add('is-visible');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('is-visible'), 4200);
}

/* ==========================================================================
   Request form — validation + demo submit.
   ========================================================================== */
function initForm() {
  const form = document.getElementById('request-form');
  if (!form) return;

  const status = document.getElementById('form-status');

  const fields = {
    name: { input: document.getElementById('f-name'), error: document.getElementById('err-name') },
    phone: { input: document.getElementById('f-phone'), error: document.getElementById('err-phone') },
  };

  function validate() {
    let valid = true;

    if (!fields.name.input.value.trim()) {
      fields.name.error.textContent = 'Укажите имя';
      fields.name.input.classList.add('is-invalid');
      valid = false;
    } else {
      fields.name.error.textContent = '';
      fields.name.input.classList.remove('is-invalid');
    }

    const phoneDigits = fields.phone.input.value.replace(/\D/g, '');
    if (phoneDigits.length < 9) {
      fields.phone.error.textContent = 'Укажите корректный номер телефона';
      fields.phone.input.classList.add('is-invalid');
      valid = false;
    } else {
      fields.phone.error.textContent = '';
      fields.phone.input.classList.remove('is-invalid');
    }

    return valid;
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!validate()) {
      status.textContent = '';
      return;
    }

    /* ------------------------------------------------------------------
       ДЕМО-РЕЖИМ: сейчас заявка никуда не отправляется — у сайта нет
       backend. Ниже — где подключить реальную отправку:

       Вариант 1 — Formspree (проще всего):
         1) Зарегистрируйтесь на https://formspree.io и создайте форму.
         2) Замените блок ниже на:
              fetch('https://formspree.io/f/ВАШ_ID', {
                method: 'POST',
                headers: { Accept: 'application/json' },
                body: new FormData(form),
              }).then(() => { ...показать успех... });

       Вариант 2 — EmailJS:
         1) Подключите SDK EmailJS через <script> в index.html.
         2) Вызовите emailjs.sendForm('SERVICE_ID', 'TEMPLATE_ID', form)
            вместо блока ниже.

       Вариант 3 — свой backend / Telegram-бот:
         замените блок ниже на fetch() к своему API.
    ------------------------------------------------------------------ */
    status.textContent = 'Форма работает в демонстрационном режиме. Для подключения заявок добавьте сервис обработки формы.';
    showToast('Заявка не отправлена: форма пока в демо-режиме.');
  });
}
