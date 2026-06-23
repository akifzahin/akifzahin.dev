// ── Scroll Progress Bar ──
const progressBar = document.createElement("div");
progressBar.id = "progress-bar";
document.body.appendChild(progressBar);

// ── Back to Top Button ──
const backToTop = document.createElement("button");
backToTop.id = "back-to-top";
backToTop.innerHTML = "↑";
backToTop.setAttribute("aria-label", "Back to top");
document.body.appendChild(backToTop);

backToTop.addEventListener("click", () =>
  window.scrollTo({ top: 0, behavior: "smooth" })
);

window.addEventListener("scroll", () => {
  const scrollTop = window.scrollY;
  const docHeight = document.documentElement.scrollHeight - window.innerHeight;
  const progress = (scrollTop / docHeight) * 100;
  progressBar.style.width = `${progress}%`;
  progressBar.style.boxShadow =
    progress > 95 ? "0 0 12px #0fd28c, 0 0 24px #6b21d4" : "none";

  backToTop.style.opacity = scrollTop > 300 ? "1" : "0";
  backToTop.style.pointerEvents = scrollTop > 300 ? "auto" : "none";
});

// ── Nav Scramble ──
const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%";

document.querySelectorAll(".nav-links a").forEach((link) => {
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