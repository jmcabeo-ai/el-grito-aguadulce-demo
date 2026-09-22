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

const stepNames = ['Tu visita', 'La hora', 'La zona', 'Tus datos'];
const state = { step: 1, pax: 2, time: '', zone: 'Terraza' };
let returnFocus = null;

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

const setStep = (step) => {
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
    window.setTimeout(() => document.querySelector('[data-pax].is-selected')?.focus(), 80);
  });
});

const closeDialog = () => {
  dialog.close();
  document.body.classList.remove('modal-open');
  returnFocus?.focus();
};

closeButton.addEventListener('click', closeDialog);
doneButton.addEventListener('click', closeDialog);
dialog.addEventListener('cancel', () => document.body.classList.remove('modal-open'));
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
    setStep(Math.min(4, state.step + 1));
  });
});

document.querySelectorAll('.prev-step').forEach((button) => {
  button.addEventListener('click', () => setStep(Math.max(1, state.step - 1)));
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

if ('IntersectionObserver' in window && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });
  document.querySelectorAll('.reveal').forEach((element) => observer.observe(element));
} else {
  document.querySelectorAll('.reveal').forEach((element) => element.classList.add('is-visible'));
}

setDefaultDate();
