// cursor.js — replaces cursor-canvas entirely, no blur
const TRAIL_COUNT = 8;
const LERP_BLOB  = 0.10; // blob lag (lower = more lag)
const LERP_TRAIL = 0.30; // trail tightness

const blob  = document.getElementById('cursor-blob');
const dot   = document.getElementById('cursor-dot');

// Build trail dots
const trail = Array.from({ length: TRAIL_COUNT }, (_, i) => {
  const el = document.createElement('div');
  const size = Math.max(1, 5 - i * 0.5);
  el.className = 'cursor-trail';
  el.style.cssText = `width:${size}px;height:${size}px;
    margin-left:-${size/2}px;margin-top:-${size/2}px;
    opacity:${(1 - i / TRAIL_COUNT).toFixed(2)}`;
  document.body.appendChild(el);
  return { el, x: 0, y: 0 };
});

let mx = 0, my = 0, bx = 0, by = 0;

document.addEventListener('mousemove', e => {
  mx = e.clientX; my = e.clientY;
  dot.style.left = mx + 'px';
  dot.style.top  = my + 'px';
});

document.querySelectorAll('a, button, [data-hover]').forEach(el => {
  el.addEventListener('mouseenter', () => {
    blob.classList.add('cursor-hover');
    dot.classList.add('cursor-hover');
  });
  el.addEventListener('mouseleave', () => {
    blob.classList.remove('cursor-hover');
    dot.classList.remove('cursor-hover');
  });
});

(function tick() {
  bx += (mx - bx) * LERP_BLOB;
  by += (my - by) * LERP_BLOB;
  blob.style.left = bx + 'px';
  blob.style.top  = by + 'px';

  trail[0].x += (mx - trail[0].x) * LERP_TRAIL;
  trail[0].y += (my - trail[0].y) * LERP_TRAIL;
  for (let i = 1; i < TRAIL_COUNT; i++) {
    trail[i].x += (trail[i-1].x - trail[i].x) * LERP_TRAIL;
    trail[i].y += (trail[i-1].y - trail[i].y) * LERP_TRAIL;
  }
  trail.forEach(d => {
    d.el.style.left = d.x + 'px';
    d.el.style.top  = d.y + 'px';
  });
  requestAnimationFrame(tick);
})();