// ---------------------------------------------
// Footer year
// ---------------------------------------------
document.getElementById('year').textContent = new Date().getFullYear();

// ---------------------------------------------
// Mobile nav toggle
// ---------------------------------------------
const navEl = document.getElementById('siteNav');
const navToggle = document.getElementById('navToggle');
navToggle.addEventListener('click', () => {
  const isOpen = navEl.classList.toggle('open');
  navToggle.setAttribute('aria-expanded', String(isOpen));
});
document.querySelectorAll('.mobile-menu a').forEach(a => {
  a.addEventListener('click', () => {
    navEl.classList.remove('open');
    navToggle.setAttribute('aria-expanded', 'false');
  });
});

// ---------------------------------------------
// Scroll-triggered reveal animations
// ---------------------------------------------
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const revealEls = document.querySelectorAll('.reveal');

if (prefersReducedMotion) {
  revealEls.forEach(el => el.classList.add('is-visible'));
} else {
  const io = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });

  revealEls.forEach(el => io.observe(el));
}

// ---------------------------------------------
// Hero rotating role words
// ---------------------------------------------
const heroRoles = document.querySelectorAll('.hero-role');
if (heroRoles.length > 1 && !prefersReducedMotion) {
  let activeIdx = 0;
  setInterval(() => {
    heroRoles[activeIdx].classList.remove('is-active');
    activeIdx = (activeIdx + 1) % heroRoles.length;
    heroRoles[activeIdx].classList.add('is-active');
  }, 2400);
}

// ---------------------------------------------
// Role pills (contact "what's this about")
// ---------------------------------------------
const rolePills = document.querySelectorAll('.role-pill');
const roleInput = document.getElementById('roleType');

function selectRole(value) {
  rolePills.forEach(p => {
    const match = p.dataset.value === value;
    p.classList.toggle('is-selected', match);
    p.setAttribute('aria-checked', String(match));
  });
  roleInput.value = value;
}

rolePills.forEach(pill => {
  pill.addEventListener('click', () => selectRole(pill.dataset.value));
});

// "Hire me" hero button pre-selects a role before jumping to the form
document.querySelectorAll('[data-role-select]').forEach(el => {
  el.addEventListener('click', () => selectRole(el.getAttribute('data-role-select')));
});

// ---------------------------------------------
// Contact form -> Flask prepares mailto -> open in new tab
// ---------------------------------------------
const form = document.getElementById('contactForm');
const formHint = document.getElementById('formHint');
const sendBtn = document.getElementById('sendBtn');
const sendBtnLabel = document.getElementById('sendBtnLabel');

function clearErrors() {
  ['name', 'email', 'role', 'message'].forEach(f => {
    const el = document.getElementById(`err-${f}`);
    if (el) el.textContent = '';
  });
}

function setHint(text, isError) {
  formHint.textContent = text;
  formHint.style.color = isError ? '#E3745B' : '';
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  clearErrors();

  const payload = {
    name: document.getElementById('fromName').value.trim(),
    email: document.getElementById('fromEmail').value.trim(),
    role: roleInput.value,
    project: document.getElementById('project').value.trim(),
    timeline: document.getElementById('timeline').value.trim(),
    message: document.getElementById('message').value.trim(),
  };

  sendBtn.disabled = true;
  sendBtnLabel.textContent = 'Preparing…';

  try {
    const res = await fetch('/api/prepare-contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();

    if (!res.ok || !data.ok) {
      if (data.errors) {
        Object.entries(data.errors).forEach(([field, msg]) => {
          const el = document.getElementById(`err-${field}`);
          if (el) el.textContent = msg;
        });
      }
      setHint('Please fix the highlighted fields and try again.', true);
      return;
    }

    // Open Gmail's web compose window (pre-filled) in a new browser tab.
    // Falls back to a plain mailto: link if the popup gets blocked.
    const win = window.open(data.gmail_url, '_blank');
    if (!win) {
      window.location.href = data.mailto;
    }
    setHint('Opened Gmail in a new tab, pre-filled — just hit send.', false);
    form.reset();
    selectRole(roleInput.defaultValue || roleInput.value);
  } catch (err) {
    setHint('Something went wrong preparing the email. Please try again, or email directly.', true);
  } finally {
    sendBtn.disabled = false;
    sendBtnLabel.textContent = 'Open pre-filled email ↗';
  }
});
