# Mandapaka Chinni Durga Vara Prasad — Elite Portfolio

A single-page, production-ready portfolio built with **Flask + HTML/CSS/JavaScript + Three.js**.
Premium dark/white design, cinematic scroll reveals, and an interactive 3D desk
workspace as the hero visual (drag to orbit, scroll to zoom).

No database, no paid APIs, no API keys. Flask's only jobs are (1) rendering the
page from the resume data below and (2) preparing the contact email server-side.

---

## 1. Setup

```bash
# from inside this folder
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt

python app.py
# → open http://127.0.0.1:5000
```

That's it — one dependency (Flask), no build step, no bundler.

---

## 2. Project structure

```
portfolio-elite/
├── app.py                  # Flask app: resume data (source of truth), routes
├── requirements.txt
├── templates/
│   └── index.html          # Jinja template — loops over app.py's RESUME dict
└── static/
    ├── css/style.css       # design system: colors, type, layout, animations
    ├── js/main.js          # nav, scroll reveals, role pills, contact form logic
    ├── js/scene.js         # Three.js interactive 3D desk scene
    └── assets/resume.pdf   # your uploaded résumé — linked from the "View résumé" button
```

## 3. How the contact form works

1. Visitor fills in name, email, "what's this about" (Full-time Hire, Freelance
   Project, AI/ML, Python/Backend, Data Analytics, Collaboration), an optional
   project/timeline, and a message.
2. The form `fetch()`s `POST /api/prepare-contact`. Flask validates the fields
   and builds both a Gmail web-compose URL and a `mailto:` fallback — see
   `prepare_contact()` in `app.py`.
3. The browser opens Gmail's compose window in a **new tab**, addressed to
   `chinnidurgavaraprasad0@gmail.com` with subject and body already filled
   in (this opens in the browser itself, not a desktop mail app). If the new
   tab gets blocked by a popup blocker, it falls back to a plain `mailto:` link.
4. Nothing is stored and nothing is sent by the server — the visitor still has
   to hit "send" themselves. No SMTP, no database, no keys.

There's also a **"Contact me via"** row of quick-access icons (Gmail, WhatsApp,
Call) in the Contact section for people who'd rather skip the form — these are
plain links built from `RESUME["gmail_quick_url"]`, `RESUME["whatsapp_url"]`,
and `RESUME["phone_digits"]` in `app.py`.

## 4. The 3D hero

`static/js/scene.js` builds a desk, monitor (with a small animated "code" texture
on the screen), laptop, keyboard, mouse, mug, plant and an office chair out of
plain Three.js geometries — no external 3D model files. It uses:

- **OrbitControls** for drag-to-orbit / scroll-to-zoom, with a locked distance
  and polar-angle range so visitors can't flip the camera under the floor.
- A slow **auto-rotate** when idle, which pauses the moment someone interacts
  and resumes a few seconds later.
- `prefers-reduced-motion` support — auto-rotate and the idle bob animation
  are skipped entirely for visitors who've asked their OS for less motion.
- A graceful fallback: if WebGL isn't available, the canvas is hidden and a
  plain gradient background is shown instead — the rest of the site still works.

Three.js itself is loaded from a CDN (`unpkg.com`) via an import map in
`templates/index.html`, so the visitor's browser needs internet access to load
it (this doesn't affect the Flask server, which stays 100% local/offline).

## 5. Other visual features

- **Tech-stack icons** — skill tags for named technologies (Python, Java, Git,
  GitHub, AWS, GCP, MySQL, PostgreSQL, Flask, Django, Jupyter) show their real
  brand logo via [Devicon](https://devicon.dev), loaded from a CDN in
  `templates/index.html`. Abstract skills (OOP, SEO, DBMS, etc.) stay plain
  text — add more mappings in `ICON_MAP` in `app.py` if you want icons on
  more of them.
- **Rotating profile avatar** — a circular "MC" avatar in the About section
  with tech-icon "moons" orbiting around it (`.orbit-avatar` in
  `style.css`). The icon set comes from `RESUME["orbit_icons"]` in `app.py`.
  Auto-pauses for `prefers-reduced-motion`.
- **Connect section** — dedicated cards linking to your real GitHub, LinkedIn
  and LeetCode profiles (`RESUME["socials"]`), styled as glassy hover cards.
- **Glassy hover states** — project cards, skill tags, fact tiles and nav
  links all get a blurred glass hover with a soft gold highlight sweep
  (`.hover-glass` / `.nav-link-highlight` in `style.css`).

## 6. Customizing

- **All resume content** (name, experience, skills, projects, certifications,
  achievements, contact roles) lives in the `RESUME` dict at the top of
  `app.py` — edit it there and the whole site updates.
- **Social links** — `RESUME["socials"]` already points at your real GitHub,
  LinkedIn and LeetCode profiles. Update those three values if they ever
  change.
- **Colors / type** — everything is driven by CSS variables at the top of
  `static/css/style.css` (`:root { --ink, --paper, --gold, ... }`).
- **Résumé file** — replace `static/assets/resume.pdf` with a newer version
  any time; keep the same filename, or update `RESUME["resume_pdf"]`.
- **Photo** — there's no headshot wired in; the nav/hero/orbit avatar use
  initials. Drop an image into `static/assets/` and swap it into
  `.avatar-center` in `templates/index.html` if you'd like a real photo.

## 7. Deploying

Any host that runs Python + Flask works: Render, Railway, PythonAnywhere,
Fly.io, a small VPS with gunicorn behind nginx, etc. For production, run it
behind a real WSGI server rather than `app.run(debug=True)`, e.g.:

```bash
pip install gunicorn --break-system-packages   # or add to requirements.txt
gunicorn -w 2 -b 0.0.0.0:8000 app:app
```

Remember to turn `debug=False` (or just don't set `FLASK_DEBUG`) in production.

## 8. Accessibility & performance notes

- Skip link, visible focus states, semantic headings/landmarks throughout.
- The 3D canvas is `aria-hidden` (it's decorative); all real content is in
  normal HTML text, so screen readers get the full site regardless of WebGL.
- Reveal animations and the 3D auto-rotate both respect
  `prefers-reduced-motion: reduce`.
- Renderer pixel ratio is capped at 2x and geometry is kept low-poly/primitive
  to stay smooth on mid-range laptops and phones.
