"""
Elite portfolio — Flask backend.

Responsibilities (intentionally minimal, no DB, no external/paid APIs, no API keys):
  1. Render the single-page site from resume data below (source of truth).
  2. Serve static assets (css/js/resume pdf).
  3. Prepare the "Hire me" contact email server-side: validate the submitted
     fields and build a mailto: URL (subject + body). The browser then opens
     that URL in a new tab, handing off to the visitor's own email client.
     No email is ever sent by the server — nothing is stored, nothing is mailed
     from here.
"""

from __future__ import annotations

from flask import Flask, render_template, request, jsonify
from urllib.parse import quote
import re

app = Flask(__name__)

# ---------------------------------------------------------------------------
# Resume data — single source of truth for the whole site.
# Edit this dict to update the site; templates/index.html just renders it.
# ---------------------------------------------------------------------------

OWNER_EMAIL = "chinnidurgavaraprasad0@gmail.com"
OWNER_PHONE = "+91 93923 69329"
OWNER_PHONE_DIGITS = "919392369329"  # country code + number, no symbols — used for wa.me / tel:

# Skill name -> Devicon class (https://devicon.dev). Only concrete, named
# technologies get a logo; abstract skills (e.g. "OOP", "SEO") stay plain
# text tags. `invert` marks icons that render dark-on-transparent and need
# a CSS filter to stay visible on the dark skills section.
ICON_MAP = {
    "Python": ("devicon-python-plain colored", False),
    "Java": ("devicon-java-plain colored", False),
    "Git": ("devicon-git-plain colored", False),
    "GitHub": ("devicon-github-original", True),
    "Jupyter Notebook": ("devicon-jupyter-plain colored", False),
    "AWS": ("devicon-amazonwebservices-plain-wordmark colored", False),
    "GCP": ("devicon-googlecloud-plain colored", False),
    "MySQL": ("devicon-mysql-plain colored", False),
    "PostgreSQL": ("devicon-postgresql-plain colored", False),
    "Flask": ("devicon-flask-original", True),
    "Django": ("devicon-django-plain colored", False),
}


def with_icons(names: list[str]) -> list[dict]:
    """Turn a plain list of skill names into [{name, icon, invert}, ...]."""
    out = []
    for n in names:
        icon, invert = ICON_MAP.get(n, (None, False))
        out.append({"name": n, "icon": icon, "invert": invert})
    return out


RESUME = {
    "name": "Mandapaka Chinni Durga Vara Prasad",
    "short_name": "Chinni Durga Vara Prasad",
    "initials": "MC",
    "tagline": "AI/ML Engineer & Data Analyst",
    "roles": ["AI/ML Engineer", "Data Analyst", "Python Developer", "Educator"],
    "headline": "I turn raw data into decisions worth acting on.",
    "summary": (
        "B.Tech AI/ML graduate (2026) with hands-on experience across agentic AI "
        "engineering, data analysis and cross-functional project execution. "
        "Comfortable moving between Python notebooks, SQL queries and stakeholder "
        "conversations — proficient in Google Workspace, SQL and spreadsheet "
        "analytics, with a strong foundation in problem-solving and quality-driven "
        "delivery."
    ),
    "about_paragraphs": [
        "I'm a B.Tech AI/ML graduate from Swarnandhra College of Engineering and "
        "Technology (CGPA 8.67/10), currently teaching as an Assistant Professor "
        "while preparing to join Deloitte as an Analyst Trainee.",
        "My path so far has run through agentic AI engineering, data validation "
        "and auditing, dashboarding, and full-stack project builds — with a "
        "constant thread of using data to make better decisions, whether that's "
        "forecasting footfall from satellite imagery or mining sentiment out of "
        "YouTube comments.",
        "I'm adaptable, self-motivated and fluent in English, and I like working "
        "in fast-paced, collaborative environments where the goal is solving a "
        "real business problem — not just shipping code.",
    ],
    "quick_facts": [
        {"label": "Graduating", "value": "2026"},
        {"label": "CGPA", "value": "8.67 / 10"},
        {"label": "Based in", "value": "Andhra Pradesh, India"},
        {"label": "Next stop", "value": "Deloitte · Analyst Trainee"},
    ],
    "email": OWNER_EMAIL,
    "phone": OWNER_PHONE,
    "phone_digits": OWNER_PHONE_DIGITS,
    "socials": {
        "github": "https://github.com/chinni-123-157",
        "linkedin": "https://www.linkedin.com/in/mandapaka-chinni-durga-vara-prasad-b0510b2ba/",
        "leetcode": "https://leetcode.com/u/__Chinni__/",
    },
    "orbit_icons": [
        "devicon-python-plain colored",
        "devicon-amazonwebservices-plain-wordmark colored",
        "devicon-mysql-plain colored",
        "devicon-googlecloud-plain colored",
        "devicon-git-plain colored",
        "devicon-django-plain colored",
    ],
    "resume_pdf": "assets/resume.pdf",
    "gmail_quick_url": (
        "https://mail.google.com/mail/?view=cm&fs=1"
        f"&to={quote(OWNER_EMAIL)}&su={quote('Hi Chinni — reaching out from your portfolio')}"
    ),
    "whatsapp_url": f"https://wa.me/{OWNER_PHONE_DIGITS}?text={quote('Hi Chinni, I found your portfolio and would like to connect.')}",
    "experience": [
        {
            "date": "Expected Aug 2026",
            "role": "Analyst Trainee",
            "org": "Deloitte",
            "badge": "Selected · awaiting joining",
        },
        {
            "date": "Jun 2026 — Present",
            "role": "Assistant Professor",
            "org": "Swarnandhra College of Engineering and Technology",
            "badge": None,
        },
        {
            "date": "Aug 2025 — Nov 2025",
            "role": "Agentic AI Engineer",
            "org": "SkillyHeads Pvt Ltd",
            "badge": "Paid internship",
        },
    ],
    "education": [
        {
            "degree": "B.Tech, AIML",
            "school": "Swarnandhra College of Engineering and Technology",
            "date": "2022 – 2026",
            "meta": "CGPA 8.67 / 10",
        },
        {
            "degree": "Intermediate (12th), CBSE",
            "school": "Bharatiya Vidya Bhavan's International Residential Public School",
            "date": "2020 – 2022",
            "meta": "77.9%",
        },
        {
            "degree": "SSC (10th), CBSE",
            "school": "J Sikile School",
            "date": "2019 – 2020",
            "meta": "77.6%",
        },
    ],
    "skills": [
        {"key": "languages", "entries": with_icons(["Python", "Java", "SQL"])},
        {
            "key": "core_cs",
            "entries": with_icons([
                "Data Structures", "Algorithms", "OOP", "DBMS",
                "Operating Systems", "Computer Vision", "Machine Learning",
            ]),
        },
        {
            "key": "data_ops",
            "entries": with_icons([
                "SQL Querying", "Data Validation", "Data Auditing",
                "Quality Checking", "Dashboarding",
            ]),
        },
        {
            "key": "digital_marketing",
            "entries": with_icons(["Google Ads Fundamentals", "SEO", "Campaign Analytics", "Social Media Marketing"]),
        },
        {
            "key": "tools",
            "entries": with_icons(["Google Workspace", "Microsoft Excel", "Git", "GitHub", "Jupyter Notebook", "Google Colab"]),
        },
        {"key": "cloud", "entries": with_icons(["AWS", "GCP"])},
        {"key": "databases_frameworks", "entries": with_icons(["MySQL", "PostgreSQL", "Flask", "Django"])},
    ],
    "projects": [
        {
            "index": "01",
            "title": "Predictive Customer Flow Analysis Using Satellite Data",
            "description": (
                "Analyzed peak footfall and traffic patterns for local tea stalls "
                "using satellite imagery and location data to support demand "
                "forecasting and site-selection decisions."
            ),
            "tags": ["Python", "Geospatial Data", "Forecasting"],
        },
        {
            "index": "02",
            "title": "Smart Village Car Rental & Auto Booking System",
            "description": (
                "Booking platform with real-time driver and vehicle availability "
                "tracking, streamlining local transport access in semi-urban and "
                "rural areas."
            ),
            "tags": ["Flask / Django", "SQL", "Real-time"],
        },
        {
            "index": "03",
            "title": "YouTube Comment Insight Engine",
            "description": (
                "Used NLP and machine learning to classify and surface key viewer "
                "feedback from comments, helping creators identify actionable "
                "insights to improve content quality."
            ),
            "tags": ["NLP", "Machine Learning", "Python"],
        },
        {
            "index": "04",
            "title": "WorkerConnect: Service Marketplace Analytics Platform",
            "description": (
                "Analytics-driven marketplace connecting customers with plumbing, "
                "cleaning and electrician service providers, featuring profiles, "
                "reviews and real-time job-status tracking."
            ),
            "tags": ["Marketplace", "Analytics", "Dashboarding"],
        },
    ],
    "certifications": [
        "IBM SkillsBuild — Artificial Intelligence Fundamentals",
        "AWS Academy — Cloud Foundations",
        "AWS Academy — Data Engineering",
        "Google Cloud — AI Applications",
        "Google Cloud — Data Warehouse with BigQuery",
        "Cisco — Data Analytics Essentials",
        "ServiceNow Certified Implementation Specialist — Data Foundations",
    ],
    "achievements": [
        "Cleared the TCS National Qualifier Test (TCS NQT) and received the TCS Ninja offer letter",
        "Secured a Top 5 position in a National-Level Hackathon",
        "Organized and led a hackathon with 250+ participants",
        "Won 1st Prize in a District-Level Designing Competition",
        "Achieved 3rd Prize in a Business Idea Competition",
    ],
    "leadership": [
        "Head Boy (10th & 12th) — led student governance and coordinated 15+ institutional events with 500+ attendees",
        "Event Coordinator — owned end-to-end planning for technical fests and workshops, including vendor coordination",
        "NSS Volunteer — participated in social service and community development programs",
    ],
    "contact_roles": [
        "Full-time Hire",
        "Freelance Project",
        "AI/ML",
        "Python / Backend",
        "Data Analytics",
        "Collaboration",
    ],
}


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------

@app.route("/")
def index():
    return render_template("index.html", r=RESUME)


@app.route("/api/prepare-contact", methods=["POST"])
def prepare_contact():
    """
    Validates the contact form server-side and builds a Gmail web-compose
    URL (opens in the browser, not a desktop mail app) plus a mailto:
    fallback. No data is stored or emailed by the server — the client opens
    the returned URL in a new tab; the visitor still hits send themselves.
    """
    data = request.get_json(silent=True) or {}

    name = (data.get("name") or "").strip()
    email = (data.get("email") or "").strip()
    role = (data.get("role") or "").strip()
    project = (data.get("project") or "").strip()
    timeline = (data.get("timeline") or "").strip()
    message = (data.get("message") or "").strip()

    errors = {}
    if not name:
        errors["name"] = "Please enter your name."
    if not email or not re.match(r"^[^@\s]+@[^@\s]+\.[^@\s]+$", email):
        errors["email"] = "Please enter a valid email address."
    if not role or role not in RESUME["contact_roles"]:
        errors["role"] = "Please choose what this is about."
    if not message:
        errors["message"] = "Please add a short message."

    if errors:
        return jsonify({"ok": False, "errors": errors}), 400

    subject = f"{role}: {name} would like to connect"

    body_lines = [
        f"Hi {RESUME['short_name']},",
        "",
        f"{name} is reaching out about: {role}",
    ]
    if project:
        body_lines.append(f"Project / request: {project}")
    if timeline:
        body_lines.append(f"Timeline: {timeline}")
    body_lines += [
        "",
        "Message:",
        message,
        "",
        "— Sent from your portfolio contact form",
        f"Reply-to: {email}",
    ]
    body = "\n".join(body_lines)

    mailto = f"mailto:{OWNER_EMAIL}?subject={quote(subject)}&body={quote(body)}"
    gmail_url = (
        "https://mail.google.com/mail/?view=cm&fs=1"
        f"&to={quote(OWNER_EMAIL)}&su={quote(subject)}&body={quote(body)}"
    )

    return jsonify({"ok": True, "mailto": mailto, "gmail_url": gmail_url})


if __name__ == "__main__":
    app.run(debug=True)
