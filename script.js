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
      ? 'Confirma que entiendes el carácter demostrativo del formulario.'
      : 'Completa los campos obligatorios para ver la confirmación de ejemplo.';
    invalid.focus();
    return;
  }

  detailsError.textContent = '';
  bookingSteps.forEach((step) => { step.hidden = true; });
  renderSummary(successSummary);
  successPanel.hidden = false;
  progressBar.style.width = '100%';
  stepLabel.textContent = 'Completado';
  stepName.textContent = 'Vista de confirmación';
  if (canAnimate) {
    window.gsap.fromTo(
      [...successPanel.children],
      { autoAlpha: 0, y: 24 },
      { autoAlpha: 1, y: 0, duration: .48, stagger: .07, ease: 'power3.out', clearProps: 'opacity,visibility,transform' }
    );
  }
  successPanel.querySelector('button')?.focus();
});

const navToggle = document.querySelector('.nav-toggle');
const navLinks = document.querySelector('#nav-links');
navToggle.addEventListener('click', () => {
  const open = navToggle.getAttribute('aria-expanded') === 'true';
  navToggle.setAttribute('aria-expanded', String(!open));
  navLinks.classList.toggle('is-open', !open);
});
navLinks.querySelectorAll('a').forEach((link) => link.addEventListener('click', () => {
  navToggle.setAttribute('aria-expanded', 'false');
  navLinks.classList.remove('is-open');
}));

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
    .from('.nav', { y: -34, autoAlpha: 0, duration: .62, ease: 'power3.out' }, 1.68)
    .from('.hero .eyebrow', { y: 18, autoAlpha: 0, duration: .5 }, 1.72)
    .from('.hero-title__line > span', { yPercent: 118, duration: .92, stagger: .1, ease: 'power4.out' }, 1.72)
    .from('.hero__lede', { y: 24, autoAlpha: 0, duration: .62 }, 2.02)
    .from('.hero__actions > *', { y: 18, autoAlpha: 0, duration: .48, stagger: .09 }, 2.16)
    .from('.hero__rating', { x: 30, autoAlpha: 0, duration: .55 }, 2.22)
    .from('.hero__scroll', { autoAlpha: 0, duration: .45 }, 2.34);

  gsap.to('.scroll-progress span', {
    scaleX: 1,
    ease: 'none',
    scrollTrigger: { start: 0, end: 'max', scrub: .18 }
  });

  ScrollTrigger.create({
    start: 80,
    end: 'max',
    toggleClass: { targets: '.site-header', className: 'is-scrolled' }
  });

  gsap.to('.hero__image', {
    yPercent: 11,
    scale: 1.075,
    ease: 'none',
    scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: .7 }
  });
  gsap.to('.hero__content', {
    yPercent: -10,
    autoAlpha: .25,
    ease: 'none',
    scrollTrigger: { trigger: '.hero', start: '35% top', end: 'bottom top', scrub: .55 }
  });

  gsap.from('.quick-facts article', {
    y: 46,
    autoAlpha: 0,
    duration: .7,
    stagger: .1,
    ease: 'back.out(1.2)',
    scrollTrigger: { trigger: '.quick-facts', start: 'top 88%', once: true }
  });

  gsap.to('.flavour-marquee__track', { xPercent: -50, duration: 24, ease: 'none', repeat: -1 });

  const regularReveals = [...document.querySelectorAll('.reveal:not(.dish)')];
  gsap.set(regularReveals, { autoAlpha: 0, y: 42 });
  ScrollTrigger.batch(regularReveals, {
    interval: .08,
    batchMax: 3,
    start: 'top 86%',
    once: true,
    onEnter: (batch) => gsap.to(batch, { autoAlpha: 1, y: 0, duration: .78, stagger: .1, ease: 'power3.out', overwrite: true })
  });

  ['.story h2', '.menu h2', '.reservation-cta h2', '.visit h2'].forEach((selector) => {
    const heading = document.querySelector(selector);
    if (!heading) return;
    gsap.fromTo(heading,
      { clipPath: 'inset(0 0 100% 0)', y: 34 },
      { clipPath: 'inset(0 0 0% 0)', y: 0, duration: .95, ease: 'power4.out', scrollTrigger: { trigger: heading, start: 'top 87%', once: true } }
    );
  });

  gsap.to('.story__image--main img', {
    yPercent: 9,
    scale: 1.08,
    ease: 'none',
    scrollTrigger: { trigger: '.story__visual', start: 'top bottom', end: 'bottom top', scrub: .7 }
  });
  gsap.to('.story__image--small', {
    yPercent: -15,
    rotation: -2,
    ease: 'none',
    scrollTrigger: { trigger: '.story__visual', start: 'top bottom', end: 'bottom top', scrub: .8 }
  });
  gsap.to('.story__stamp', {
    rotation: 30,
    ease: 'none',
    scrollTrigger: { trigger: '.story__visual', start: 'top bottom', end: 'bottom top', scrub: 1 }
  });

  const dishes = [...document.querySelectorAll('.dish')];
  gsap.set(dishes, { autoAlpha: 1, y: 0, clipPath: 'inset(100% 0 0 0)' });
  gsap.timeline({
    scrollTrigger: { trigger: '.menu-grid', start: 'top 82%', once: true }
  })
    .to(dishes, { clipPath: 'inset(0% 0 0 0)', duration: 1.05, stagger: .11, ease: 'power4.inOut' })
    .from('.dish__copy', { y: 26, autoAlpha: 0, duration: .5, stagger: .08, ease: 'power3.out' }, '-=.55');

  dishes.forEach((dish, index) => {
    const image = dish.querySelector('img');
    gsap.fromTo(image,
      { yPercent: -4, scale: 1.06 },
      { yPercent: 5, scale: 1.06, ease: 'none', scrollTrigger: { trigger: dish, start: 'top bottom', end: 'bottom top', scrub: .7 } }
    );
    dish.style.setProperty('--dish-delay', `${index * .04}s`);
  });

  gsap.to('.reservation-cta__ghost', {
    xPercent: -28,
    ease: 'none',
    scrollTrigger: { trigger: '.reservation-cta', start: 'top bottom', end: 'bottom top', scrub: .8 }
  });

  window.matchMedia('(pointer: fine)').matches && document.querySelectorAll('.nav .button, .hero__actions .button, .reservation-cta .button').forEach((button) => {
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

  const hero = document.querySelector('.hero');
  const heroImage = document.querySelector('.hero__image');
  if (window.matchMedia('(pointer: fine)').matches && hero && heroImage) {
    const xTo = gsap.quickTo(heroImage, 'x', { duration: .8, ease: 'power3.out' });
    const rotateTo = gsap.quickTo(heroImage, 'rotation', { duration: 1, ease: 'power3.out' });
    hero.addEventListener('pointermove', (event) => {
      const ratio = event.clientX / window.innerWidth - .5;
      xTo(ratio * 14);
      rotateTo(ratio * .35);
    });
    hero.addEventListener('pointerleave', () => { xTo(0); rotateTo(0); });
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
  document.querySelectorAll('.reveal').forEach((element) => observer.observe(element));
} else if (!canAnimate) {
  document.querySelectorAll('.reveal').forEach((element) => element.classList.add('is-visible'));
}

setDefaultDate();
initMotion();
