const productDropdown = document.getElementById('productDropdown');
const themeBtn = document.getElementById('themeBtn');
const langBtn = document.getElementById('langBtn');

function toggleDropdown(dropdownElement) {
  if (!dropdownElement) return;
  dropdownElement.classList.toggle('open');
}

function closeDropdown(dropdownElement) {
  if (!dropdownElement) return;
  dropdownElement.classList.remove('open');
}

if (productDropdown) {
  const button = productDropdown.querySelector('.dropdown-btn');
  button?.addEventListener('click', (event) => {
    event.stopPropagation();
    toggleDropdown(productDropdown);
  });
}

document.addEventListener('click', () => closeDropdown(productDropdown));

if (themeBtn) {
  themeBtn.addEventListener('click', () => {
    const isLight = document.body.dataset.theme === 'light';
    document.body.dataset.theme = isLight ? 'dark' : 'light';
    themeBtn.textContent = isLight ? '☾' : '☀';
    if (document.body.dataset.theme === 'light') {
      document.documentElement.style.setProperty('--bg', '#f8fafc');
      document.documentElement.style.setProperty('--panel', '#ffffff');
      document.documentElement.style.setProperty('--text', '#0f172a');
      document.documentElement.style.setProperty('--muted', '#475569');
    } else {
      document.documentElement.style.setProperty('--bg', '#0a0f1e');
      document.documentElement.style.setProperty('--panel', '#0f172a');
      document.documentElement.style.setProperty('--text', '#e2e8f0');
      document.documentElement.style.setProperty('--muted', '#94a3b8');
    }
  });
}

if (langBtn) {
  langBtn.addEventListener('click', () => {
    langBtn.textContent = langBtn.textContent === 'EN' ? 'HI' : 'EN';
  });
}

// Auto-scroll for logo carousel + touch drag with momentum
const logosContainer = document.querySelector('.logos');
if (logosContainer) {
  const pauseStates = { hovered: false, focused: false, dragging: false, momentum: false }; 
  const baseItems = Array.from(logosContainer.children).map((el) => el.cloneNode(true));
  baseItems.forEach((clone) => logosContainer.appendChild(clone));

  let scrollPosition = 0;
  const speedPxPerFrame = 0.8; // tweak speed here

  function halfWidth() {
    return logosContainer.scrollWidth / 2;
  }

  function normalizePosition() {
    const half = halfWidth();
    if (logosContainer.scrollLeft >= half) {
      logosContainer.scrollLeft -= half;
      scrollPosition = logosContainer.scrollLeft;
    } else if (logosContainer.scrollLeft < 0) {
      logosContainer.scrollLeft += half;
      scrollPosition = logosContainer.scrollLeft;
    }
  }

  function tick() {
    const isPaused = pauseStates.hovered || pauseStates.focused || pauseStates.dragging || pauseStates.momentum;
    if (!isPaused) {
      scrollPosition += speedPxPerFrame;
      if (scrollPosition >= halfWidth()) scrollPosition = 0;
      logosContainer.scrollLeft = scrollPosition;
    }
    requestAnimationFrame(tick);
  }

  logosContainer.addEventListener('mouseenter', () => (pauseStates.hovered = true));
  logosContainer.addEventListener('mouseleave', () => (pauseStates.hovered = false));
  logosContainer.addEventListener('focusin', () => (pauseStates.focused = true));
  logosContainer.addEventListener('focusout', () => (pauseStates.focused = false));

  // Pointer/touch drag with momentum
  let isDown = false;
  let startX = 0;
  let startScrollLeft = 0;
  let lastX = 0;
  let lastTime = 0;
  let velocity = 0;

  function onPointerDown(e) {
    isDown = true;
    pauseStates.dragging = true;
    const pointX = e.clientX ?? (e.touches && e.touches[0]?.clientX) ?? 0;
    startX = pointX;
    lastX = pointX;
    lastTime = performance.now();
    startScrollLeft = logosContainer.scrollLeft;
    logosContainer.setPointerCapture?.(e.pointerId ?? 0);
  }

  function onPointerMove(e) {
    if (!isDown) return;
    e.preventDefault();
    const now = performance.now();
    const pointX = e.clientX ?? (e.touches && e.touches[0]?.clientX) ?? lastX;
    const dx = pointX - lastX;
    const dt = Math.max(1, now - lastTime);
    velocity = dx / dt * 16; // normalize to ~per-frame velocity
    logosContainer.scrollLeft = startScrollLeft - (pointX - startX);
    scrollPosition = logosContainer.scrollLeft;
    normalizePosition();
    lastX = pointX;
    lastTime = now;
  }

  function glideMomentum() {
    const friction = 0.95;
    const minVel = 0.1;
    function step() {
      velocity *= friction;
      if (Math.abs(velocity) < minVel) {
        pauseStates.momentum = false;
        return;
      }
      logosContainer.scrollLeft -= velocity;
      scrollPosition = logosContainer.scrollLeft;
      normalizePosition();
      requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  function onPointerUp() {
    if (!isDown) return;
    isDown = false;
    pauseStates.dragging = false;
    pauseStates.momentum = true;
    glideMomentum();
  }

  // Mouse + touch events
  logosContainer.addEventListener('mousedown', onPointerDown, { passive: true });
  logosContainer.addEventListener('mousemove', onPointerMove, { passive: false });
  window.addEventListener('mouseup', onPointerUp, { passive: true });

  logosContainer.addEventListener('touchstart', onPointerDown, { passive: true });
  logosContainer.addEventListener('touchmove', onPointerMove, { passive: false });
  window.addEventListener('touchend', onPointerUp, { passive: true });

  requestAnimationFrame(tick);
}

// Blog pagination (client-side)
(() => {
  const grid = document.getElementById('blogGrid');
  if (!grid) return;
  let posts = [];
  let filtered = [];
  let cards = [];
  const prevBtn = document.getElementById('blogPrev');
  const nextBtn = document.getElementById('blogNext');
  const pagesWrap = document.getElementById('blogPages');
  const pageSize = 3;
  const pageCount = Math.max(1, Math.ceil(cards.length / pageSize));
  let page = 1;

  function rebuildGrid() {
    grid.innerHTML = '';
    filtered.forEach((p, idx) => {
      const article = document.createElement('article');
      article.className = 'blog-card';
      article.setAttribute('data-index', String(idx));
      article.style.background = 'var(--panel)';
      article.style.border = '1px solid rgba(148,163,184,.12)';
      article.style.borderRadius = '14px';
      article.style.overflow = 'hidden';
      article.style.display = 'grid';
      article.innerHTML = `
        <img src="${p.image}" alt="${p.title}" style="width:100%;height:160px;object-fit:cover"/>
        <div style="padding:14px;display:grid;gap:8px">
          <div style="display:flex;gap:8px;align-items:center">
            <span style="font-size:12px;padding:2px 8px;border-radius:9999px;background:rgba(148,163,184,.10);color:var(--text);border:1px solid rgba(148,163,184,.25)">${p.category}</span>
            <span style="color:var(--muted);font-size:12px">${new Date(p.date).toLocaleDateString()}</span>
          </div>
          <a href="${p.href}" style="color:var(--text);text-decoration:none;font-weight:700;font-size:18px">${p.title}</a>
          <p style="margin:0;color:var(--muted);line-height:1.7">${p.excerpt}</p>
        </div>`;
      grid.appendChild(article);
    });
    cards = Array.from(grid.querySelectorAll('.blog-card'));
  }

  function render() {
    cards.forEach((card, idx) => {
      const p = Math.ceil((idx + 1) / pageSize);
      card.style.display = p === page ? '' : 'none';
    });
    if (pagesWrap) {
      pagesWrap.innerHTML = '';
      const pages = Math.max(1, Math.ceil(cards.length / pageSize));
      for (let i = 1; i <= pages; i++) {
        const btn = document.createElement('button');
        btn.textContent = String(i);
        btn.className = 'btn';
        btn.style.height = '34px';
        if (i === page) {
          btn.style.borderColor = 'rgba(148,163,184,.35)';
          btn.style.background = 'rgba(148,163,184,.10)';
        }
        btn.addEventListener('click', () => { page = i; render(); });
        pagesWrap.appendChild(btn);
      }
    }
    const pages = Math.max(1, Math.ceil(cards.length / pageSize));
    if (prevBtn) prevBtn.disabled = page === 1;
    if (nextBtn) nextBtn.disabled = page === pages;
  }

  prevBtn?.addEventListener('click', () => { if (page > 1) { page -= 1; render(); } });
  nextBtn?.addEventListener('click', () => { if (page < pageCount) { page += 1; render(); } });
  fetch('/posts.json').then(r => r.json()).then(json => {
    posts = json;
    filtered = posts;
    rebuildGrid();
    render();
  }).catch(() => {
    // Fallback to existing cards if fetch fails
    cards = Array.from(grid.querySelectorAll('.blog-card'));
    render();
  });
})();

// FAQ accordion: allow only one open at a time
(() => {
  const faq = document.querySelector('#faq');
  if (!faq) return;
  const items = Array.from(faq.querySelectorAll('details.faq-item'));
  items.forEach((d) => {
    d.addEventListener('toggle', () => {
      if (d.open) {
        items.forEach((other) => { if (other !== d) other.open = false; });
      }
    });
  });
})();

// Home sidebar interactions
(() => {
  const side = document.getElementById('homeSidebar');
  const toggle = document.getElementById('homeSidebarToggle');
  const themeBtnSide = document.getElementById('homeThemeToggle');
  const searchInput = document.getElementById('homeSearch');
  const searchBtn = document.getElementById('homeSearchBtn');
  if (toggle && side) {
    toggle.addEventListener('click', () => {
      const isOpen = side.style.display === 'block';
      side.style.display = isOpen ? 'none' : 'block';
    });
  }
  if (themeBtnSide) {
    themeBtnSide.addEventListener('click', () => {
      const event = new Event('click');
      document.getElementById('themeBtn')?.dispatchEvent(event);
    });
  }
  function smoothScrollTo(id) {
    const el = document.querySelector(id);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
  function doSearch() {
    const q = (searchInput?.value || '').toLowerCase().trim();
    if (!q) return;
    const map = {
      'feature': '#features',
      'features': '#features',
      'portfolio': '#portfolio',
      'blog': '#blog',
      'article': '#blog',
      'docs': '/docs.html',
      'product': '/product.html',
      'contact': '/contact.html',
      'about': '#about',
      'testimonials': '#testimonials'
    };
    let target = '#features';
    for (const key of Object.keys(map)) {
      if (q.includes(key)) { target = map[key]; break; }
    }
    if (target.startsWith('#')) smoothScrollTo(target);
    else window.location.href = target;
  }
  searchBtn?.addEventListener('click', doSearch);
  searchInput?.addEventListener('keydown', (e) => { if (e.key === 'Enter') doSearch(); });
})();
