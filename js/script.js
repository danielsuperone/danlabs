'use strict';

(function(){
  // --- Diagnostics: capture failed resource loads and unhandled rejections ---
  // This helps identify missing script/css requests (like `cide.min.js`) and where they were requested from.
  try {
    window.addEventListener('error', (ev) => {
      try {
        const target = ev?.target || ev?.srcElement;
        if (target && (target.tagName === 'SCRIPT' || target.tagName === 'LINK' || target.tagName === 'IMG')) {
          // Resource loading error (script, stylesheet, image)
          console.warn('[DIAG] Resource load error detected:', {
            tag: target.tagName,
            url: target.src || target.href || '(unknown)',
            filename: ev?.filename || null,
            lineno: ev?.lineno || null,
            colno: ev?.colno || null,
            message: ev?.message || null
          });
        } else {
          // Generic runtime error
          console.warn('[DIAG] Runtime error', ev.message, ev.filename, ev.lineno, ev.colno);
        }
      } catch (e) { /* swallow diagnostics errors */ }
    }, true);

    window.addEventListener('unhandledrejection', (ev)=>{
      try {
        console.warn('[DIAG] Unhandled promise rejection:', ev.reason);
      } catch (e) {}
    });
  } catch (e) { /* ignore if environment doesn't allow listeners */ }

  const $ = (s) => document.querySelector(s);

  // Populate year
  const yearEl = document.getElementById('year'); if (yearEl) yearEl.textContent = new Date().getFullYear();

  // Theme toggle
  const root = document.documentElement;
  const body = document.body;
  const appWrap = document.querySelector('div.relative.min-h-screen');
  const themeToggle = document.getElementById('theme-toggle');

  function ensureThemeIcon(){
    if (!themeToggle) return;
    if (!themeToggle.querySelector('i')){
      const i = document.createElement('i');
      // show sun when in dark mode (indicates action), moon when in light
      i.setAttribute('data-lucide', root.classList.contains('dark') ? 'sun' : 'moon');
      themeToggle.prepend(i);
      if (window.lucide) window.lucide.createIcons();
    }
  }

  // Theme toggle behavior (button). Default to dark unless user previously chose.
  (function initThemeToggle(){
    const storedTheme = localStorage.getItem('theme');
    
    if (storedTheme === 'dark' || !storedTheme) {
      // Default to dark mode or use stored dark preference
      root.classList.add('dark');
      body.classList.add('dark');
      if (appWrap) appWrap.classList.add('dark');
      if (!storedTheme) {
        try { localStorage.setItem('theme','dark'); } catch(e){}
      }
    } else if (storedTheme === 'light') {
      root.classList.remove('dark');
      body.classList.remove('dark');
      if (appWrap) appWrap.classList.remove('dark');
    }

    // Initialize theme icon after theme is set by the user or default
    ensureThemeIcon();

    function updateToggleUI(){
      if (!themeToggle) return;
      const isDark = root.classList.contains('dark');
      themeToggle.setAttribute('aria-pressed', isDark ? 'true' : 'false');
      // update visible label (span) if present on my site
      const label = themeToggle.querySelector('span');
      if (label) label.textContent = isDark ? 'Dark' : 'Light';
      // update emoji shown on the button (keeps mobile/compact UI meaningful)
      const emojiSpan = themeToggle.querySelector('.btn-emoji');
      if (emojiSpan) emojiSpan.textContent = isDark ? '🌙' : '🌞';
      themeToggle.title = isDark ? 'Switch to Light theme' : 'Switch to Dark theme';
      const icon = themeToggle.querySelector('i');
      // show sun icon when dark (indicates action to go light), moon when light
      if (icon) icon.setAttribute('data-lucide', isDark ? 'sun' : 'moon');
      if (window.lucide) window.lucide.createIcons();
    }

    updateToggleUI();

    // Override the previous click handler to use view transitions if available on the users device
    // Attach click handler properly so my site works with or without view transitions
    if (themeToggle) {
      themeToggle.addEventListener('click', ()=>{
        const doToggle = ()=>{
          const isDark = root.classList.toggle('dark');
          // mirror class on body and main wrapper for better CSS compatibility
          if (isDark) { 
            body.classList.add('dark'); 
            if (appWrap) appWrap.classList.add('dark'); 
          }
          else { 
            body.classList.remove('dark'); 
            if (appWrap) appWrap.classList.remove('dark'); 
          }
          try { localStorage.setItem('theme', isDark ? 'dark' : 'light'); } catch(e){}
          updateToggleUI();
          
          // Force style recalculation cuz there were some issues prior
          document.body.offsetHeight;
        };

        if (!document.startViewTransition) {
          doToggle();
          return;
        }

        document.startViewTransition(() => {
          doToggle();
        });
      });
    }
  })();

  // Tiles data (with emojis)
  const tiles = [
    { title:'GameBox', href:'https://gamebox.danlabs.me', emoji:'🎮', accent:'#60A5FA', description:'Play Mafia, GeoGuessr-style rounds, Who Am I, and more with friends. Fast lobbies, voice-ready rooms, instant invites.', gradient:{from:'#60A5FA',via:'#A78BFA',to:'#22D3EE'} },
    { title:'GAMBL', href:'https://gambl.danlabs.me', emoji:'💎', accent:'#22D3EE', description:'Casino-grade feel with a clean UI. Think Stake-esque: dice, crash, mines, all with on-page stats and fairness proofs.', gradient:{from:'#06B6D4',via:'#22D3EE',to:'#10B981'} },
    { title:'StudyFlow', href:'https://studyflow.danlabs.me', emoji:'📚', accent:'#F59E0B', description:'Smart study management platform with flashcards, progress tracking, and spaced repetition algorithms. Boost your learning efficiency.', gradient:{from:'#F59E0B',via:'#EF4444',to:'#EC4899'} },
    { title:'Photography', href:'https://photography.danlabs.me', emoji:'📸', accent:'#EC4899', description:'Explore my photography portfolio. Capturing moments, stories, and perspectives through the lens.', gradient:{from:'#EC4899',via:'#F59E0B',to:'#EF4444'} },
    { title:'Portfolio', href:'login.html?target=portfolio', emoji:'🌟', accent:'#8B5CF6', description:'View my professional portfolio and projects. Showcasing work, achievements, and creative endeavors.', gradient:{from:'#8B5CF6',via:'#EC4899',to:'#F59E0B'}, requiresLogin:true },
    { title:'About DanLabs', href:'https://danlabs.me/about', emoji:'🌐', accent:'#A78BFA', description:'Team, stack, and roadmap. Minimal words, maximal clarity. Keep it transparent and up-to-date.', gradient:{from:'#A78BFA',via:'#60A5FA',to:'#38BDF8'} }
  ];

  const tilesGrid = document.getElementById('tiles-grid');

  function buildTile(item, idx){
    const a = document.createElement('a');
    a.href = item.href || '#';
    // Only open in new tab if it's an external link (not login.html)
    if (item.href && !item.requiresLogin) a.target = '_blank';
    a.className = 'group relative block rounded-3xl p-[1px] transition overflow-hidden';
    a.style.background = `linear-gradient(140deg, ${item.gradient.from} 0%, ${item.gradient.via} 40%, ${item.gradient.to} 100%)`;
    a.dataset.index = idx;

    const inner = document.createElement('div');
    inner.className = 'tile-glass rounded-3xl p-5 transition-transform duration-500 ease-out transform will-change-transform';

    const row = document.createElement('div'); row.className = 'relative flex items-start gap-4';
    // simplified icon wrapper: no ring or white gradient so emoji sits directly on the tile inner background
    const iconWrap = document.createElement('div'); iconWrap.className = 'icon';
    if (item.emoji){
      const emoji = document.createElement('span'); emoji.textContent = item.emoji; emoji.className = 'text-2xl'; iconWrap.appendChild(emoji);
    }

    const txt = document.createElement('div'); txt.className = 'min-w-0';
    const h3wrap = document.createElement('div'); h3wrap.className = 'flex items-center gap-2';
    const h3 = document.createElement('h3'); h3.className = 'truncate text-xl font-semibold text-black/90 dark:text-white/90'; h3.textContent = item.title;
    const arrow = document.createElement('i'); arrow.setAttribute('data-lucide','arrow-up-right'); arrow.className = 'h-4 w-4 text-black/50 opacity-0 transition group-hover:opacity-100 dark:text-white/60';
    h3wrap.appendChild(h3); h3wrap.appendChild(arrow);

    const p = document.createElement('p'); p.className = 'mt-1 line-clamp-3 text-sm text-black/70 dark:text-white/70';
    p.textContent = item.description;

    txt.appendChild(h3wrap); txt.appendChild(p);
    row.appendChild(iconWrap); row.appendChild(txt); inner.appendChild(row);

    const flare = document.createElement('div'); flare.className = 'pointer-events-none absolute inset-0 rounded-3xl opacity-0 blur-md transition group-hover:opacity-100'; flare.style.background = `radial-gradient(60% 40% at 20% -10%, ${item.accent}40%, transparent 60%)`;
    inner.appendChild(flare);
    a.appendChild(inner);

    return a;
  }

  if (tilesGrid){
    tiles.forEach((t,i)=> tilesGrid.appendChild(buildTile(t,i)));

    // Reveal observer with staggered inner transition
    const obs = new IntersectionObserver((entries)=>{
      entries.forEach(entry=>{
        if (entry.isIntersecting){
          const el = entry.target; const idx = Number(el.dataset.index||0);
          el.classList.add('reveal-visible');
          // apply animation classes to the entire tile anchor so the whole card animates
          const anchor = el;
          anchor.style.animationDelay = `${idx*90}ms`;
          anchor.classList.add('animate__animated','animate__fadeInUp','animate__faster');
          // also ensure the inner element transitions to final state for any subtle transforms
          const inner = el.querySelector('.rounded-3xl');
          if (inner) inner.style.transitionDelay = `${idx*90}ms`;
          obs.unobserve(el);
        }
      });
    }, { root:null, rootMargin:'0px 0px -60px 0px', threshold:0.12 });

    Array.from(tilesGrid.children).forEach(el=>{ el.classList.add('reveal'); obs.observe(el); });

    // Interactive glass glare: track pointer and update CSS vars for each tile
    try {
      const anchors = tilesGrid.querySelectorAll('a.group');
      anchors.forEach(a=>{
        const inner = a.querySelector('.tile-glass');
        if (!inner) return;
        a.addEventListener('pointermove', (e)=>{
          const r = a.getBoundingClientRect();
          const x = Math.max(0, Math.min(100, ((e.clientX - r.left) / r.width) * 100));
          const y = Math.max(0, Math.min(100, ((e.clientY - r.top) / r.height) * 100));
          inner.style.setProperty('--mx', x + '%');
          inner.style.setProperty('--my', y + '%');
        });
        a.addEventListener('pointerleave', ()=>{
          inner.style.removeProperty('--mx');
          inner.style.removeProperty('--my');
        });
      });
    } catch(e) { /* non-fatal */ }
  }

  if (window.lucide) window.lucide.createIcons();

  // Hero translate only and hide scroll cue on first scroll
  const hero = document.getElementById('hero'); const heroInner = document.getElementById('hero-inner');
  const scrollCue = document.getElementById('scroll-cue');
  let scrollCueHidden = false;
  const headerEl = document.querySelector('header.header-bg');
  // Restore compact state from previous visit
  const compactState = localStorage.getItem('compactTiles') === '1';
  if (compactState) document.documentElement.classList.add('compact-tiles');
  window.addEventListener('scroll', ()=>{
    if (!hero || !heroInner) return;
    const rect = hero.getBoundingClientRect();
    const vh = window.innerHeight || document.documentElement.clientHeight;
    const progress = Math.min(Math.max((vh-rect.top)/(vh+rect.height),0),1);
    const y = -progress*80;
    heroInner.style.transform = `translateY(${y}px)`;

    if (!scrollCueHidden && window.scrollY > 10 && scrollCue){
      scrollCueHidden = true;
      scrollCue.classList.add('scroll-hidden');
      // remove from DOM after transition to avoid pointer-events-none mishaps
      setTimeout(()=>{ try{ scrollCue.remove(); }catch(e){} }, 420);
      // enable compact layout so tiles sit closer
      document.documentElement.classList.add('compact-tiles');
      try{ localStorage.setItem('compactTiles','1'); }catch(e){}
    }

    // toggle header elevation after a small scroll threshold so it reads as lifted
    try{
      if (headerEl){
        if (window.scrollY > 8) headerEl.classList.add('header-elevated','scrolled');
        else headerEl.classList.remove('header-elevated','scrolled');
      }
    }catch(e){}
  });

  // --- Admin keypad modal logic ---
  const adminBtn = document.getElementById('admin-btn');
  const adminDialog = document.getElementById('admin-keypad');
  const toastContainer = document.getElementById('toast-container');
  const toastOriginalParent = toastContainer?.parentElement || document.body;
  const toastOriginalNext = toastContainer?.nextSibling || null;

  // Simple toast helper
  function showToast(message, type = 'error', timeout = 2600){
    if (!toastContainer) return alert(message);
    const el = document.createElement('div');
    el.className = `toast ${type}`;
    el.innerHTML = `<span class="msg">${message}</span><button class="close" aria-label="Close">×</button>`;
    toastContainer.appendChild(el);
    const remove = ()=>{ try{ el.remove(); }catch(e){} };
    el.querySelector('.close')?.addEventListener('click', remove);
    setTimeout(remove, timeout);
  }

  const PIN_LENGTH = 6;
  const ADMIN_PIN = '123456';
  let pin = '';

  function updateDots(){
    const dots = adminDialog?.querySelectorAll('.pin-dots .dot');
    if (!dots) return;
    dots.forEach((d, i)=>{
      if (i < pin.length) d.classList.add('filled');
      else d.classList.remove('filled');
    });
  }

  function resetPin(){ pin = ''; updateDots(); }

  function submitPin(){
    if (pin === ADMIN_PIN){
      try { adminDialog?.close(); } catch(e){}
      // Navigate to private page
      window.location.href = 'private.html';
    } else {
      // Shake dots quickly to indicate error
      const dotsWrap = adminDialog?.querySelector('.pin-dots');
      if (dotsWrap){
        dotsWrap.style.animation = 'shake 300ms ease';
        setTimeout(()=>{ dotsWrap.style.animation = ''; }, 320);
      }
      showToast('Incorrect details', 'error');
      resetPin();
    }
  }

  function onKeyPress(val){
    pin += String(val);
    updateDots();
    if (pin.length === PIN_LENGTH) submitPin();
  }

  function onBackspace(){ if (pin.length){ pin = pin.slice(0,-1); updateDots(); } }
  function onClear(){ resetPin(); }

  function openAdmin(){
    if (!adminDialog) return;
    resetPin();
            // Ensure toasts render above backdrop by placing container inside dialog top layer
            try { if (toastContainer && adminDialog && toastContainer.parentElement !== adminDialog) adminDialog.appendChild(toastContainer); } catch(e){}
    try { adminDialog.showModal(); } catch(e) { /* fallback */ }
  }
                adminDialog?.addEventListener('close', ()=>{
          // Move toast container back to its original place so it remains functional outside dialog
          try {
            if (toastContainer && toastContainer.parentElement !== toastOriginalParent) {
              if (toastOriginalNext && toastOriginalNext.parentNode === toastOriginalParent) toastOriginalParent.insertBefore(toastContainer, toastOriginalNext);
              else toastOriginalParent.appendChild(toastContainer);
            }
          } catch(e){}
        });

          // Register a minimal service worker to enable PWA installability and caching
          if ('serviceWorker' in navigator) {
            try {
              // Use root-relative path for registration so the scope covers the site correctly
              // and avoid 404s when the site is deployed under a different base path.
              // Try root-relative first (typical production), fall back to relative path for local testing
              navigator.serviceWorker.register('/sw.js').catch(()=> navigator.serviceWorker.register('sw.js').catch(()=>{}));
            } catch(e){}
          }

  // Wire events
  adminBtn?.addEventListener('click', openAdmin);
  adminDialog?.addEventListener('click', (e)=>{
    // click outside card closes
    const card = adminDialog.querySelector('.admin-card');
    if (e.target === adminDialog && card) { try{ adminDialog.close(); }catch(_){} }
  });
  adminDialog?.querySelector('[data-admin-close]')?.addEventListener('click', ()=>{ try{ adminDialog.close(); }catch(_){} });
  adminDialog?.addEventListener('cancel', (e)=>{ e.preventDefault(); try{ adminDialog.close(); }catch(_){} });

  adminDialog?.querySelectorAll('.keypad .key').forEach(btn=>{
    const key = btn.getAttribute('data-key');
    const action = btn.getAttribute('data-action');
    if (key){ btn.addEventListener('click', ()=> onKeyPress(key)); }
    else if (action === 'backspace'){ btn.addEventListener('click', onBackspace); }
    else if (action === 'clear'){ btn.addEventListener('click', onClear); }
  });

  // Keyboard support for digits and Backspace when dialog open
  document.addEventListener('keydown', (e)=>{
    if (!adminDialog || adminDialog.open !== true) return;
    if (/^[0-9]$/.test(e.key)) { e.preventDefault(); onKeyPress(e.key); }
    else if (e.key === 'Backspace') { e.preventDefault(); onBackspace(); }
    else if (e.key === 'Escape') { e.preventDefault(); try{ adminDialog.close(); }catch(_){} }
  });

  // Small keyframes for error shake (scoped inline)
  const style = document.createElement('style');
  style.textContent = `@keyframes shake{0%,100%{transform:translateX(0)}20%{transform:translateX(-4px)}40%{transform:translateX(4px)}60%{transform:translateX(-3px)}80%{transform:translateX(3px)}}`;
  document.head.appendChild(style);

})();
