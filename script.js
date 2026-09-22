const dialog = document.querySelector('#booking-dialog');
const bookingForm = document.querySelector('#booking-form');
const bookingSteps = [...document.querySelectorAll('.booking-step')];
const openButtons = document.querySelectorAll('.js-book');
const closeButton = document.querySelector('.booking-close');
const doneButton = document.querySelector('.booking-done');
const progressBar = document.querySelector('.booking-progress__bar span');
const stepLabel = document.querySelector('#step-label');
const stepName = document.querySelector('#step-name');
const successPanel = document.querySelector('#booking-success');
const dateInput = document.querySelector('#booking-date');
const timeGrid = document.querySelector('#time-grid');
const timeContext = document.querySelector('#time-context');
const timeError = document.querySelector('#time-error');
const detailsError = document.querySelector('#details-error');
const bookingSummary = document.querySelector('#booking-summary');
const successSummary = document.querySelector('#success-summary');
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const canAnimate = Boolean(window.gsap && window.ScrollTrigger && !prefersReducedMotion);

const stepNames = ['Tu visita', 'La hora', 'La zona', 'Tus datos'];
const state = { step: 1, pax: 2, time: '', zone: 'Terraza' };
let returnFocus = null;
let closingDialog = false;

if (canAnimate) {
  window.gsap.registerPlugin(window.ScrollTrigger);
}

const formatDate = (value) => {
  if (!value) return '';
  return new Intl.DateTimeFormat('es-ES', {
    weekday: 'short', day: 'numeric', month: 'short'
  }).format(new Date(`${value}T12:00:00`));
};

const localISODate = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const setDefaultDate = () => {
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  dateInput.min = localISODate(today);
  dateInput.value = localISODate(tomorrow);
};

const selectedService = () => bookingForm.querySelector('input[name="service"]:checked').value;

const setStep = (step, direction = 1) => {
  state.step = step;
  successPanel.hidden = true;
  bookingSteps.forEach((panel) => {
    const active = Number(panel.dataset.step) === step;
    panel.hidden = !active;
    panel.classList.toggle('is-active', active);
  });
  progressBar.style.width = `${step * 25}%`;
  stepLabel.textContent = `Paso ${step} de 4`;
  stepName.textContent = stepNames[step - 1];

  if (step === 2) renderTimes();
  if (step === 4) renderSummary(bookingSummary);

  const panel = bookingSteps[step - 1];
  const focusTarget = panel.querySelector('.is-selected, input, button');
  if (canAnimate && dialog.open) {
    window.gsap.fromTo(
      [...panel.children],
      { autoAlpha: 0, x: direction * 22 },
      { autoAlpha: 1, x: 0, duration: .38, stagger: .035, ease: 'power2.out', clearProps: 'opacity,visibility,transform' }
    );
  }
  window.setTimeout(() => focusTarget?.focus(), 80);
};

const resetBooking = () => {
  bookingForm.reset();
  state.pax = 2;
  state.time = '';
  state.zone = 'Terraza';
  document.querySelectorAll('[data-pax]').forEach((button) => {
    const selected = button.dataset.pax === '2';
    button.classList.toggle('is-selected', selected);
    button.setAttribute('aria-pressed', String(selected));
  });
  document.querySelectorAll('[data-zone]').forEach((button) => {
    const selected = button.dataset.zone === 'Terraza';
    button.classList.toggle('is-selected', selected);
    button.setAttribute('aria-pressed', String(selected));
  });
  setDefaultDate();
  detailsError.textContent = '';
  timeError.textContent = '';
  setStep(1);
};

const renderTimes = () => {
  const service = selectedService();
  const date = dateInput.value;
  const day = new Date(`${date}T12:00:00`).getDay();
  const isSundayDinner = day === 0 && service === 'Cena';
  const times = service === 'Comida'
    ? ['13:00', '13:30', '14:00', '14:30', '15:00', '15:30']
    : ['20:00', '20:30', '21:00', '21:30', '22:00', '22:30'];

  state.time = '';
  timeGrid.innerHTML = '';
  timeError.textContent = '';
  timeContext.textContent = `${formatDate(date)} · ${state.pax === 7 ? '7 o más' : state.pax} personas · ${service}`;

  if (isSundayDinner) {
    timeGrid.innerHTML = '<p class="booking-note">Los domingos solo se publica servicio de comida. Vuelve atrás y selecciona “Comida”.</p>';
    return;
  }

  times.forEach((time) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'time-slot';
    button.dataset.time = time;
    button.setAttribute('aria-pressed', 'false');
    button.textContent = time;
    button.addEventListener('click', () => {
      timeGrid.querySelectorAll('.time-slot').forEach((slot) => {
        slot.classList.remove('is-selected');
        slot.setAttribute('aria-pressed', 'false');
      });
      button.classList.add('is-selected');
      button.setAttribute('aria-pressed', 'true');
      state.time = time;
      timeError.textContent = '';
    });
    timeGrid.appendChild(button);
  });
};

const renderSummary = (target) => {
  target.innerHTML = `
    <span>${formatDate(dateInput.value)}</span>
    <span>${state.time} · ${selectedService()}</span>
    <span>${state.pax === 7 ? '7+ personas' : `${state.pax} personas`}</span>
    <span>${state.zone}</span>
  `;
};

openButtons.forEach((button) => {
  button.addEventListener('click', () => {
    returnFocus = button;
    resetBooking();
    dialog.showModal();
    document.body.classList.add('modal-open');
    if (canAnimate) {
      window.gsap.fromTo(
        dialog,
        { autoAlpha: 0, y: 34, scale: .965 },
        { autoAlpha: 1, y: 0, scale: 1, duration: .55, ease: 'back.out(1.35)', clearProps: 'transform' }
      );
    }
    window.setTimeout(() => document.querySelector('[data-pax].is-selected')?.focus(), 80);
  });
});

const closeDialog = () => {
  if (closingDialog || !dialog.open) return;
  closingDialog = true;
  const finish = () => {
    dialog.close();
    document.body.classList.remove('modal-open');
    closingDialog = false;
    returnFocus?.focus();
  };
  if (canAnimate) {
    window.gsap.to(dialog, { autoAlpha: 0, y: 22, scale: .98, duration: .24, ease: 'power2.in', onComplete: finish });
  } else {
    finish();
  }
};

closeButton.addEventListener('click', closeDialog);
doneButton.addEventListener('click', closeDialog);
dialog.addEventListener('cancel', () => {
  document.body.classList.remove('modal-open');
  closingDialog = false;
  if (canAnimate) window.gsap.set(dialog, { clearProps: 'all' });
});
dialog.addEventListener('click', (event) => {
  const rect = dialog.getBoundingClientRect();
  const outside = event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom;
  if (outside) closeDialog();
});

document.querySelectorAll('[data-pax]').forEach((button) => {
  button.addEventListener('click', () => {
    document.querySelectorAll('[data-pax]').forEach((option) => {
      option.classList.remove('is-selected');
      option.setAttribute('aria-pressed', 'false');
    });
    button.classList.add('is-selected');
    button.setAttribute('aria-pressed', 'true');
    state.pax = Number(button.dataset.pax);
  });
});

document.querySelectorAll('[data-zone]').forEach((button) => {
  button.addEventListener('click', () => {
    document.querySelectorAll('[data-zone]').forEach((option) => {
      option.classList.remove('is-selected');
      option.setAttribute('aria-pressed', 'false');
    });
    button.classList.add('is-selected');
    button.setAttribute('aria-pressed', 'true');
    state.zone = button.dataset.zone;
  });
});

document.querySelectorAll('.next-step').forEach((button) => {
  button.addEventListener('click', () => {
    if (state.step === 1 && !dateInput.checkValidity()) {
      dateInput.reportValidity();
      return;
    }
    if (state.step === 2 && !state.time) {
      timeError.textContent = 'Selecciona una hora disponible para continuar.';
      return;
    }
    setStep(Math.min(4, state.step + 1), 1);
  });
});

document.querySelectorAll('.prev-step').forEach((button) => {
  button.addEventListener('click', () => setStep(Math.max(1, state.step - 1), -1));
});

bookingForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const requiredFields = [...bookingForm.querySelectorAll('[data-step="4"] [required]')];
  const invalid = requiredFields.find((field) => !field.checkValidity());
  if (invalid) {
    detailsError.textContent = invalid.name === 'privacy'
      ? 'Acepta el aviso de esta vista previa para continuar.'
      : 'Completa los campos obligatorios para continuar.';
    invalid.focus();
    return;
  }

  detailsError.textContent = '';
  bookingSteps.forEach((step) => { step.hidden = true; });
  renderSummary(successSummary);
  successPanel.hidden = false;
  progressBar.style.width = '100%';
  stepLabel.textContent = 'Completado';
  stepName.textContent = 'Resumen de solicitud';
  if (canAnimate) {
    window.gsap.fromTo(
      [...successPanel.children],
      { autoAlpha: 0, y: 24 },
      { autoAlpha: 1, y: 0, duration: .48, stagger: .07, ease: 'power3.out', clearProps: 'opacity,visibility,transform' }
    );
  }
  successPanel.querySelector('button')?.focus();
});

const navToggle = document.querySelector('.poster-nav-toggle');
const navLinks = document.querySelector('#poster-nav');
navToggle.addEventListener('click', () => {
  const open = navToggle.getAttribute('aria-expanded') === 'true';
  navToggle.setAttribute('aria-expanded', String(!open));
  navLinks.classList.toggle('is-open', !open);
});
navLinks.querySelectorAll('a').forEach((link) => link.addEventListener('click', () => {
  navToggle.setAttribute('aria-expanded', 'false');
  navLinks.classList.remove('is-open');
}));

const menuPreviewImage = document.querySelector('#menu-preview-image');
const menuPreviewCaption = document.querySelector('#menu-preview-caption');
const menuItems = [...document.querySelectorAll('.menu-ledger__item')];

const activateMenuItem = (item) => {
  if (item.classList.contains('is-active')) return;
  menuItems.forEach((option) => option.classList.toggle('is-active', option === item));
  const swap = () => {
    menuPreviewImage.src = item.dataset.menuImage;
    menuPreviewImage.alt = item.dataset.menuAlt;
    menuPreviewCaption.textContent = item.dataset.menuCaption;
  };

  if (canAnimate) {
    window.gsap.to(menuPreviewImage, {
      autoAlpha: 0,
      scale: 1.04,
      duration: .16,
      overwrite: true,
      onComplete: () => {
        swap();
        window.gsap.fromTo(menuPreviewImage, { autoAlpha: 0, scale: 1.04 }, { autoAlpha: 1, scale: 1, duration: .42, ease: 'power3.out', overwrite: true });
      }
    });
  } else {
    swap();
  }
};

menuItems.forEach((item) => {
  item.addEventListener('pointerenter', () => activateMenuItem(item));
  item.addEventListener('focus', () => activateMenuItem(item));
  item.addEventListener('click', () => activateMenuItem(item));
});

const initMotion = () => {
  if (!canAnimate) {
    document.querySelector('.intro-loader')?.remove();
    return;
  }

  const gsap = window.gsap;
  const ScrollTrigger = window.ScrollTrigger;
  const loader = document.querySelector('.intro-loader');
  document.body.style.overflow = 'hidden';

  const intro = gsap.timeline({ defaults: { ease: 'power3.out' } });
  intro
    .from('.intro-loader__content > p', { autoAlpha: 0, y: 16, duration: .45 })
    .from('.intro-loader__word span', { yPercent: 120, rotation: 3, duration: .72, stagger: .09, ease: 'power4.out' }, .08)
    .fromTo('.intro-loader__line span', { scaleX: 0 }, { scaleX: 1, duration: .7, ease: 'power3.inOut' }, .22)
    .from('.intro-loader__content > small', { autoAlpha: 0, y: -10, duration: .4 }, .45)
    .to('.intro-loader__word span', { yPercent: -125, duration: .55, stagger: .045, ease: 'power3.in' }, 1.12)
    .to('.intro-loader__content > p, .intro-loader__content > small, .intro-loader__line', { autoAlpha: 0, duration: .28 }, 1.12)
    .to(loader, { yPercent: -100, duration: .72, ease: 'power4.inOut' }, 1.4)
    .set(loader, { display: 'none' })
    .call(() => { document.body.style.overflow = ''; })
    .from('.poster-header', { y: -40, autoAlpha: 0, duration: .6 }, 1.66)
    .from('.hero-word__el', { xPercent: -115, duration: .9, ease: 'power4.out' }, 1.68)
    .from('.hero-word__grito', { xPercent: 112, duration: 1, ease: 'power4.out' }, 1.74)
    .from('.hero-frame', { scale: .72, rotation: -8, autoAlpha: 0, duration: 1.05, ease: 'expo.out' }, 1.72)
    .from('.hero-copy > *', { y: 24, autoAlpha: 0, duration: .55, stagger: .07 }, 1.98)
    .from('.rating-seal', { scale: 0, rotation: -45, duration: .7, ease: 'back.out(1.8)' }, 2.18)
    .from('.hero-scroll', { autoAlpha: 0, duration: .4 }, 2.3);

  gsap.to('.scroll-progress span', {
    scaleX: 1,
    ease: 'none',
    scrollTrigger: { start: 0, end: 'max', scrub: .18 }
  });

  ScrollTrigger.create({
    start: 80,
    end: 'max',
    toggleClass: { targets: '.poster-header', className: 'is-scrolled' }
  });

  gsap.to('.hero-frame img', {
    yPercent: 12,
    scale: 1.12,
    ease: 'none',
    scrollTrigger: { trigger: '.hero-poster', start: 'top top', end: 'bottom top', scrub: .8 }
  });
  gsap.to('.hero-word__el', {
    xPercent: -12,
    ease: 'none',
    scrollTrigger: { trigger: '.hero-poster', start: 'top top', end: 'bottom top', scrub: .7 }
  });
  gsap.to('.hero-word__grito', {
    xPercent: 10,
    ease: 'none',
    scrollTrigger: { trigger: '.hero-poster', start: 'top top', end: 'bottom top', scrub: .7 }
  });

  gsap.to('.shout-track', { xPercent: -50, duration: 24, ease: 'none', repeat: -1 });

  const regularReveals = [...document.querySelectorAll('.js-reveal')];
  gsap.set(regularReveals, { autoAlpha: 0, y: 42 });
  ScrollTrigger.batch(regularReveals, {
    interval: .08,
    batchMax: 3,
    start: 'top 86%',
    once: true,
    onEnter: (batch) => gsap.to(batch, { autoAlpha: 1, y: 0, duration: .78, stagger: .1, ease: 'power3.out', overwrite: true })
  });

  gsap.from('.manifesto-title span', {
    xPercent: (index) => index === 1 ? 90 : -90,
    autoAlpha: 0,
    duration: 1.05,
    stagger: .08,
    ease: 'power4.out',
    scrollTrigger: { trigger: '.manifesto-title', start: 'top 84%', once: true }
  });
  gsap.to('.manifesto-shot--one', {
    yPercent: 18,
    rotation: 10,
    ease: 'none',
    scrollTrigger: { trigger: '.manifesto', start: 'top bottom', end: 'bottom top', scrub: .8 }
  });
  gsap.to('.manifesto-shot--two', {
    yPercent: -15,
    rotation: -10,
    ease: 'none',
    scrollTrigger: { trigger: '.manifesto', start: 'top bottom', end: 'bottom top', scrub: .8 }
  });
  gsap.to('.manifesto-stamp', {
    rotation: 52,
    ease: 'none',
    scrollTrigger: { trigger: '.manifesto', start: 'top bottom', end: 'bottom top', scrub: 1 }
  });

  gsap.from('.menu-ledger__item', {
    x: 70,
    autoAlpha: 0,
    duration: .75,
    stagger: .08,
    ease: 'power3.out',
    scrollTrigger: { trigger: '.menu-ledger', start: 'top 83%', once: true }
  });

  const serviceTimeline = gsap.timeline({
    scrollTrigger: { trigger: '.service-story', start: 'top top', end: 'bottom bottom', scrub: 1 }
  });
  serviceTimeline
    .to('.service-panel--day', { autoAlpha: 0, scale: 1.08, duration: 1, ease: 'none' }, 0)
    .fromTo('.service-panel--night', { autoAlpha: 0, scale: 1.1 }, { autoAlpha: 1, scale: 1, duration: 1, ease: 'none' }, 0)
    .to('.service-clock span', { scaleY: 1, duration: 1, ease: 'none' }, 0);

  const motionMedia = gsap.matchMedia();
  motionMedia.add('(min-width: 821px)', () => {
    const lookbook = document.querySelector('.lookbook');
    const track = document.querySelector('.lookbook__track');
    const distance = () => Math.max(0, track.scrollWidth - window.innerWidth + 80);
    const horizontal = gsap.to(track, {
      x: () => -distance(),
      ease: 'none',
      scrollTrigger: {
        trigger: lookbook,
        start: 'top top',
        end: () => `+=${distance()}`,
        pin: true,
        scrub: .85,
        invalidateOnRefresh: true
      }
    });
    return () => horizontal.kill();
  });

  gsap.to('.reserve-poster__rings', {
    scale: 1.18,
    rotation: 8,
    ease: 'none',
    scrollTrigger: { trigger: '.reserve-poster', start: 'top bottom', end: 'bottom top', scrub: .8 }
  });

  if (window.matchMedia('(pointer: fine)').matches) document.querySelectorAll('.poster-cta').forEach((button) => {
    button.addEventListener('pointermove', (event) => {
      const rect = button.getBoundingClientRect();
      gsap.to(button, {
        x: (event.clientX - rect.left - rect.width / 2) * .16,
        y: (event.clientY - rect.top - rect.height / 2) * .22,
        duration: .35,
        ease: 'power3.out',
        overwrite: true
      });
    });
    button.addEventListener('pointerleave', () => {
      gsap.to(button, { x: 0, y: 0, duration: .55, ease: 'elastic.out(1, .45)', overwrite: true });
    });
  });

  const hero = document.querySelector('.hero-poster');
  const heroFrame = document.querySelector('.hero-frame');
  if (window.matchMedia('(pointer: fine)').matches && hero && heroFrame) {
    const xTo = gsap.quickTo(heroFrame, 'x', { duration: .8, ease: 'power3.out' });
    const rotateTo = gsap.quickTo(heroFrame, 'rotation', { duration: 1, ease: 'power3.out' });
    hero.addEventListener('pointermove', (event) => {
      const ratio = event.clientX / window.innerWidth - .5;
      xTo(ratio * 18);
      rotateTo(-2.4 + ratio * 1.4);
    });
    hero.addEventListener('pointerleave', () => { xTo(0); rotateTo(-2.4); });
  }

  if (window.matchMedia('(pointer: fine)').matches) {
    const cursor = document.querySelector('.poster-cursor');
    const cursorX = gsap.quickTo(cursor, 'x', { duration: .32, ease: 'power3.out' });
    const cursorY = gsap.quickTo(cursor, 'y', { duration: .32, ease: 'power3.out' });
    window.addEventListener('pointermove', (event) => { cursorX(event.clientX); cursorY(event.clientY); });
    document.querySelectorAll('.image-interactive').forEach((image) => {
      image.addEventListener('pointerenter', () => gsap.to(cursor, { autoAlpha: 1, scale: 1, duration: .22, overwrite: true }));
      image.addEventListener('pointerleave', () => gsap.to(cursor, { autoAlpha: 0, scale: .4, duration: .22, overwrite: true }));
    });
  }

  const refresh = () => ScrollTrigger.refresh();
  document.fonts?.ready.then(refresh);
  window.addEventListener('load', refresh, { once: true });
};

if (!canAnimate && 'IntersectionObserver' in window && !prefersReducedMotion) {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });
  document.querySelectorAll('.js-reveal').forEach((element) => observer.observe(element));
} else if (!canAnimate) {
  document.querySelectorAll('.js-reveal').forEach((element) => element.classList.add('is-visible'));
}

setDefaultDate();
initMotion();
