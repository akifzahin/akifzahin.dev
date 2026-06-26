// ── home.js ──────────────────────────────────────────────────────────────────
let sectionObserver = null;
let fadeObserver = null;

document.addEventListener("astro:page-load", () => {

  // ── Hero Ready ──────────────────────────────────────────────────────────────
  const hero = document.querySelector(".hero");
  if (hero) hero.classList.add("ready");
const img = document.querySelector(".hero-img");
if (img) {
  if (img.complete) {
    requestAnimationFrame(() => img.classList.add("loaded"));
  } else {
    img.addEventListener("load", () => img.classList.add("loaded"));
  }
}
  // ── Cat Touch ───────────────────────────────────────────────────────────────
  const catContainer = document.querySelector(".cat-container");
  if (catContainer) {
    catContainer.addEventListener(
      "touchstart",
      () => catContainer.classList.toggle("hovered"),
      { passive: true }
    );
  }

  // ── Active Nav Highlighting ─────────────────────────────────────────────────
  const sections = document.querySelectorAll("section[id]");
  const navLinks = document.querySelectorAll('.nav-links a[href^="#"]');

  function clearActiveLinks() {
    navLinks.forEach((link) => link.classList.remove("active"));
  }

  sectionObserver?.disconnect();

  if (sections.length > 0) {
    sectionObserver = new IntersectionObserver(() => {
      if (window.scrollY < 50) { clearActiveLinks(); return; }
      let currentSection = null;
      let maxVisibility = 0;
      sections.forEach((section) => {
        const rect = section.getBoundingClientRect();
        const visibleHeight = Math.min(rect.bottom, window.innerHeight) - Math.max(rect.top, 0);
        const visibilityRatio = visibleHeight / rect.height;
        if (visibilityRatio > maxVisibility && visibilityRatio > 0) {
          maxVisibility = visibilityRatio;
          currentSection = section;
        }
      });
      clearActiveLinks();
      if (currentSection) {
        const activeLink = document.querySelector(
          `.nav-links a[href="#${currentSection.id}"]`
        );
        if (activeLink) activeLink.classList.add("active");
      }
    }, { threshold: [0, 0.25, 0.5, 0.75, 1] });

    sections.forEach((section) => sectionObserver.observe(section));
  }

  // ── Scroll Fade Animations ──────────────────────────────────────────────────
  const fadeEls = document.querySelectorAll(".section");

  fadeObserver?.disconnect();

  if (fadeEls.length > 0) {
    fadeObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          fadeObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1 });

    fadeEls.forEach((el) => fadeObserver.observe(el));
  }
});