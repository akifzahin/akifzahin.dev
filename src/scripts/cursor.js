const cursor = document.createElement("div");
cursor.id = "cursor";
const cursorDot = document.createElement("div");
cursorDot.id = "cursor-dot";
document.body.appendChild(cursor);
document.body.appendChild(cursorDot);

const getPrimary = () => getComputedStyle(document.documentElement).getPropertyValue('--primary').trim();
const getAccent = () => getComputedStyle(document.documentElement).getPropertyValue('--accent').trim();

let mouseX = 0, mouseY = 0;
let cursorX = 0, cursorY = 0;
let moveTimeout;

window.addEventListener("mousemove", (e) => {
  mouseX = e.clientX;
  mouseY = e.clientY;
  cursorDot.style.transform = `translate(${mouseX}px, ${mouseY}px)`;

  const accent = getAccent();
  cursor.style.borderColor = accent;
  cursor.style.boxShadow = `0 0 12px ${accent}`;
  cursorDot.style.background = accent;
  cursorDot.style.boxShadow = `0 0 6px ${accent}`;

  clearTimeout(moveTimeout);
  moveTimeout = setTimeout(() => {
    const primary = getPrimary();
    cursor.style.borderColor = primary;
    cursor.style.boxShadow = `0 0 6px ${primary}`;
    cursorDot.style.background = primary;
    cursorDot.style.boxShadow = `0 0 6px ${primary}`;
  }, 50);
});

document.addEventListener("mousedown", () => {
  cursor.style.transform = `translate(${cursorX + (Math.random() - 0.5) * 10}px, ${cursorY + (Math.random() - 0.5) * 10}px)`;
  const accent = getAccent();
  cursor.style.borderColor = accent;
  cursor.style.boxShadow = `0 0 16px ${accent}`;
  setTimeout(() => {
    const primary = getPrimary();
    cursor.style.borderColor = primary;
    cursor.style.boxShadow = `0 0 6px ${primary}`;
  }, 150);
});

const trail = [];
for (let i = 0; i < 8; i++) {
  const sq = document.createElement("div");
  const primary = getPrimary();
  sq.style.cssText = `position:fixed;pointer-events:none;z-index:99990;border:1px solid ${primary};width:${6 + i * 3}px;height:${6 + i * 3}px;opacity:0;will-change:transform;margin-left:-${3 + i * 1.5}px;margin-top:-${3 + i * 1.5}px;`;
  document.body.appendChild(sq);
  trail.push({ el: sq, x: 0, y: 0 });
}

function updateTrailColors() {
  const primary = getPrimary();
  trail.forEach(t => t.el.style.borderColor = primary);
}

const themeObserver = new MutationObserver(updateTrailColors);
themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['class', 'data-theme'] });

function animateCursor() {
  cursorX += (mouseX - cursorX) * 0.12;
  cursorY += (mouseY - cursorY) * 0.12;
  cursor.style.transform = `translate(${cursorX}px, ${cursorY}px)`;

  trail[0].x = mouseX;
  trail[0].y = mouseY;
  for (let i = 1; i < 8; i++) {
    trail[i].x += (trail[i - 1].x - trail[i].x) * 0.35;
    trail[i].y += (trail[i - 1].y - trail[i].y) * 0.35;
  }
  trail.forEach((t, i) => {
    t.el.style.transform = `translate(${t.x}px,${t.y}px)`;
    t.el.style.opacity = (((8 - i) / 8) * 0.25).toFixed(2);
  });

  requestAnimationFrame(animateCursor);
}
animateCursor();

document.querySelectorAll("a, button").forEach((el) => {
  el.addEventListener("mouseenter", () => cursor.classList.add("cursor-hover"));
  el.addEventListener("mouseleave", () => cursor.classList.remove("cursor-hover"));
});