import { profile } from "./data/profile.js";
import { skills } from "./data/skills.js";
import { projects } from "./data/projects.js";
import { topics, exercises } from "./data/exercises.js";
import { journey } from "./data/journey.js";
import { initScene } from "./scene.js";

const $ = (selector) => document.querySelector(selector);
const esc = (value = "") => String(value).replace(/[&<>"']/g, (char) => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
}[char]));
const safeUrl = (value = "") => {
  try {
    const url = new URL(value, window.location.href);
    return ["http:", "https:", "mailto:"].includes(url.protocol) ? esc(url.href) : "#";
  } catch { return "#"; }
};
const link = (href, label, className = "inline-link") =>
  `<a class="${className}" href="${safeUrl(href)}" target="_blank" rel="noreferrer">${esc(label)} ↗</a>`;
const empty = (title, note) => `
  <div class="empty-state">
    <span class="empty-symbol">✳</span>
    <p class="empty-title">${esc(title)}</p>
    <p>${esc(note)}</p>
  </div>`;
const chips = (items = []) => items.map(item => `<span class="chip">${esc(item)}</span>`).join("");

function renderSkills() {
  const host = $("#skills-body");
  host.innerHTML = skills.map((group, index) => `
    <article class="skill-group">
      <div class="card-index">0${index + 1}</div>
      <h3>${esc(group.group)}</h3>
      ${group.items.length ? `<ul class="skill-list">${group.items.map(item => {
        const skill = typeof item === "string" ? { name: item, status: "Learning" } : item;
        return `<li><span>${esc(skill.name)}</span><span class="skill-status">${esc(skill.status || "Learning")}</span>${skill.link ? link(skill.link, "Proof") : ""}</li>`;
      }).join("")}</ul>` : `<p class="muted-note">Skills will appear here as I learn, practise and build.</p>`}
    </article>`).join("");
}

function renderProjects() {
  const host = $("#projects-body");
  if (!projects.length) {
    host.innerHTML = empty("The next build is taking shape.", "No showcase projects published yet. This space will feature real work, the problems behind it and the code that makes it work.");
    return;
  }
  host.innerHTML = projects.map((project, i) => `
    <article class="project-card">
      <div class="project-top"><span>PROJECT / ${String(i + 1).padStart(2, "0")}</span><span>${esc(project.status || "In progress")}</span></div>
      <h3>${esc(project.name)}</h3><p>${esc(project.description)}</p>
      ${project.problem ? `<p class="project-problem"><b>Problem</b> ${esc(project.problem)}</p>` : ""}
      <div class="chip-row">${chips(project.tech)}</div>
      ${project.features?.length ? `<ul class="feature-list">${project.features.map(x => `<li>${esc(x)}</li>`).join("")}</ul>` : ""}
      <div class="project-links">${project.repo ? link(project.repo, "Source code") : ""}${project.demo ? link(project.demo, "Live demo") : ""}</div>
    </article>`).join("");
}

let activeTopic = "All";
function renderLab() {
  const filterHost = $("#lab-filters");
  const allTopics = ["All", ...topics];
  filterHost.innerHTML = allTopics.map(topic =>
    `<button class="filter-button ${topic === activeTopic ? "active" : ""}" data-topic="${esc(topic)}">${esc(topic)}</button>`
  ).join("");
  const query = ($("#lab-search").value || "").trim().toLowerCase();
  const filtered = exercises.filter(item => {
    const matchesTopic = activeTopic === "All" || item.topic === activeTopic;
    const haystack = [item.title, item.topic, item.summary, item.approach, item.learned, ...(item.concepts || [])].join(" ").toLowerCase();
    return matchesTopic && haystack.includes(query);
  });
  const host = $("#lab-body");
  if (!filtered.length) {
    host.innerHTML = empty(exercises.length ? "No matching exercises." : "Practice is in progress.", exercises.length ? "Try another topic or search term." : "Completed exercises and problem-solving notes will appear here, linked to their source code.");
    return;
  }
  host.innerHTML = filtered.map((item, i) => `
    <article class="lab-item">
      <span class="lab-number">${String(i + 1).padStart(2, "0")}</span>
      <div class="lab-main"><div class="lab-meta"><span>${esc(item.topic)}</span></div>
        <h3>${esc(item.title)}</h3><p>${esc(item.summary)}</p>
        ${item.approach ? `<p class="lab-detail"><b>Approach</b> ${esc(item.approach)}</p>` : ""}
        ${item.learned ? `<p class="lab-detail"><b>Learned</b> ${esc(item.learned)}</p>` : ""}
        <div class="chip-row">${chips(item.concepts)}</div>
      </div>
      <div class="lab-action">${item.link ? link(item.link, "View code") : ""}</div>
    </article>`).join("");
}

function renderJourney() {
  const host = $("#journey-body");
  if (!journey.length) {
    host.innerHTML = empty("The timeline starts here.", "Real milestones will be added as the journey unfolds. No manufactured achievements.");
    return;
  }
  host.innerHTML = journey.map(item => `
    <article class="journey-item"><span class="journey-date">${esc(item.date)}</span>
      <div><h3>${esc(item.title)}</h3><p>${esc(item.note)}</p></div><span class="journey-marker"></span>
    </article>`).join("");
}

function renderInterests() {
  const host = $("#interests-body");
  const symbols = ["♟", "✳", "↗", "⌁", "◇"];
  host.innerHTML = profile.interests.length ? profile.interests.map((item, i) => `
    <article class="interest-card"><span>${symbols[i % symbols.length]}</span><h3>${esc(item.title)}</h3><p>${esc(item.note)}</p></article>
  `).join("") : empty("More about me, later.", "A few personal interests will appear here.");
}

function renderContact() {
  const host = $("#contact-body");
  const socials = profile.social || {};
  const entries = [
    ["GitHub", socials.github],
    ["LinkedIn", socials.linkedin],
    ["Email", socials.email ? `mailto:${socials.email}` : null]
  ].filter(([, href]) => href);
  host.innerHTML = entries.length ? entries.map(([label, href]) =>
    link(href, label, "contact-link")).join("") : `<p class="muted-note">Contact links will be added soon.</p>`;
}

async function renderGithub() {
  const host = $("#github-body");
  const username = profile.github;
  if (!username) { host.innerHTML = empty("GitHub unavailable.", "A GitHub username has not been added."); return; }
  host.innerHTML = `<div class="github-loading"><span class="loading-orbit"></span> CONNECTING TO GITHUB</div>`;
  try {
    const response = await fetch(`https://api.github.com/users/${encodeURIComponent(username)}/repos?per_page=100&sort=pushed`, {
      headers: { "Accept": "application/vnd.github+json" }
    });
    if (!response.ok) throw new Error("GitHub response unavailable");
    const repos = await response.json();
    const selected = repos.filter(repo => !repo.fork && repo.name !== `${username}.github.io`)
      .sort((a, b) => new Date(b.pushed_at) - new Date(a.pushed_at)).slice(0, 4);
    if (!selected.length) {
      host.innerHTML = empty("Repositories will appear here.", "Public repositories will be featured here when available.");
      return;
    }
    host.innerHTML = selected.map(repo => `
      <a class="repo-card" href="${safeUrl(repo.html_url)}" target="_blank" rel="noreferrer">
        <span class="repo-label">PUBLIC REPOSITORY</span><h3>${esc(repo.name)}</h3>
        <p>${esc(repo.description || "A project in the making.")}</p>
        <div class="repo-meta"><span>${esc(repo.language || "Code")}</span><span>★ ${repo.stargazers_count}</span><span>↗</span></div>
      </a>`).join("");
  } catch {
    host.innerHTML = `<div class="github-fallback">${empty("GitHub preview is unavailable right now.", "You can still explore the repositories directly.")}${link(`https://github.com/${username}`, "Open GitHub profile")}</div>`;
  }
}

function setupPortrait() {
  const stage = $("#portrait-stage");
  const card = $("#portrait-card");
  if (!stage || !card) return;
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  let frame = 0, pointerX = 0, pointerY = 0;
  const apply = (x, y) => {
    pointerX = x; pointerY = y;
    if (frame) return;
    frame = requestAnimationFrame(() => {
      const rx = -pointerY * 13, ry = pointerX * 17;
      card.style.setProperty("--rotate-x", `${rx}deg`);
      card.style.setProperty("--rotate-y", `${ry}deg`);
      card.style.setProperty("--shine-x", `${50 + pointerX * 35}%`);
      card.style.setProperty("--shine-y", `${50 + pointerY * 35}%`);
      stage.style.setProperty("--pointer-x", `${50 + pointerX * 30}%`);
      stage.style.setProperty("--pointer-y", `${50 + pointerY * 30}%`);
      frame = 0;
    });
  };
  const onMove = event => {
    if (reduce) return;
    const rect = stage.getBoundingClientRect();
    apply(((event.clientX - rect.left) / rect.width - 0.5) * 2,
          ((event.clientY - rect.top) / rect.height - 0.5) * 2);
  };
  const reset = () => apply(0, 0);
  stage.addEventListener("pointermove", onMove, { passive: true });
  stage.addEventListener("pointerleave", reset);
  stage.addEventListener("pointerdown", event => {
    if (event.pointerType === "touch") {
      const rect = stage.getBoundingClientRect();
      apply(((event.clientX - rect.left) / rect.width - 0.5) * 2,
            ((event.clientY - rect.top) / rect.height - 0.5) * 2);
      card.classList.remove("touch-pulse");
      void card.offsetWidth;
      card.classList.add("touch-pulse");
    }
  }, { passive: true });
  stage.addEventListener("pointerup", reset, { passive: true });
}

function setupMotion() {
  const progress = $("#scroll-progress");
  const updateProgress = () => {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    progress.style.transform = `scaleX(${max > 0 ? window.scrollY / max : 0})`;
  };
  window.addEventListener("scroll", updateProgress, { passive: true });
  updateProgress();

  const revealNodes = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    const observer = new IntersectionObserver(entries => entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      }
    }), { threshold: 0.12 });
    revealNodes.forEach(node => observer.observe(node));
  } else revealNodes.forEach(node => node.classList.add("is-visible"));

  const toggle = $("#menu-toggle"), nav = $("#nav");
  toggle.addEventListener("click", () => {
    const open = toggle.getAttribute("aria-expanded") !== "true";
    toggle.setAttribute("aria-expanded", String(open));
    nav.classList.toggle("nav-open", open);
  });
  nav.querySelectorAll("a").forEach(anchor => anchor.addEventListener("click", () => {
    nav.classList.remove("nav-open");
    toggle.setAttribute("aria-expanded", "false");
  }));
}

function init() {
  $("#year").textContent = new Date().getFullYear();
  renderSkills(); renderProjects(); renderLab(); renderJourney(); renderInterests(); renderContact();
  renderGithub(); setupPortrait(); setupMotion();
  $("#lab-search").addEventListener("input", renderLab);
  $("#lab-filters").addEventListener("click", event => {
    const button = event.target.closest("[data-topic]");
    if (!button) return;
    activeTopic = button.dataset.topic;
    renderLab();
  });
  const canvas = $("#scene");
  if (canvas) initScene(canvas);
}
init();
