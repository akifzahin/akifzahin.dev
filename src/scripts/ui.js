// ── ui.js ────────────────────────────────────────────────────────────────────
// Runs once on hard load. Persistent DOM elements (#progress-bar, #back-to-top)
// are created once and guarded. The nav scramble re-binds on every page load
// because navigation replaces the page content (and could replace the nav
// if it ever stops being persistent).

// ── Scroll Progress Bar (created once) ───────────────────────────────────────
if (!document.getElementById("progress-bar")) {
  const progressBar = document.createElement("div");
  progressBar.id = "progress-bar";
  document.body.appendChild(progressBar);
}
const progressBar = document.getElementById("progress-bar");

// ── Back to Top Button (created once) ────────────────────────────────────────
if (!document.getElementById("back-to-top")) {
  const backToTop = document.createElement("button");
  backToTop.id = "back-to-top";
  backToTop.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-square-arrow-up-icon lucide-square-arrow-up"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="m16 12-4-4-4 4"/><path d="M12 16V8"/></svg>`;
  backToTop.setAttribute("aria-label", "Back to top");
  document.body.appendChild(backToTop);

  backToTop.addEventListener("click", () =>
    window.scrollTo({ top: 0, behavior: "smooth" })
  );
}
const backToTop = document.getElementById("back-to-top");

// ── Scroll handler (on window, persists across navigations) ──────────────────
window.addEventListener("scroll", () => {
  const scrollTop = window.scrollY;
  const docHeight = document.documentElement.scrollHeight - window.innerHeight;
  const progress = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;

  progressBar.style.width = `${progress}%`;
  progressBar.style.boxShadow =
    progress > 95 ? "0 0 12px #0fd28c, 0 0 24px #6b21d4" : "none";

  backToTop.style.opacity = scrollTop > 300 ? "1" : "0";
  backToTop.style.pointerEvents = scrollTop > 300 ? "auto" : "none";
});

// ── Nav Scramble — re-bound on every page load ────────────────────────────────
// The nav links survive SPA navigations (they're in the persistent nav-wrapper),
// but active-state mutations and any re-renders could drop the listeners.
// Re-binding on page-load is cheap and safe; the Set guard prevents stacking
// duplicate listeners on the same element across multiple navigations.
const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%";
const scrambleInitialized = new WeakSet();

function bindNavScramble() {
  document.querySelectorAll(".nav-links a, .nav-drawer ul li a").forEach((link) => {
    if (scrambleInitialized.has(link)) return;
    scrambleInitialized.add(link);

    const original = link.textContent.trim();
    let interval;

    const scramble = () => {
      let iterations = 0;
      clearInterval(interval);
      interval = setInterval(() => {
        link.textContent = original
          .split("")
          .map((char, i) => {
            if (char === " ") return " ";
            if (i < iterations) return original[i];
            return chars[Math.floor(Math.random() * chars.length)];
          })
          .join("");
        iterations += 0.5;
        if (iterations >= original.length) {
          clearInterval(interval);
          link.textContent = original;
        }
      }, 55);
    };

    const reset = () => {
      clearInterval(interval);
      link.textContent = original;
    };

    link.addEventListener("mouseenter", scramble);
    link.addEventListener("mouseleave", reset);
    link.addEventListener("touchstart", scramble, { passive: true });
  });
}

document.addEventListener("astro:page-load", bindNavScramble);