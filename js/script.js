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

        // Add icon rotation animation
        const icon = themeToggle.querySelector('i');
        if (icon) {
          icon.style.transition = 'transform 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55)';
          icon.style.transform = 'rotate(360deg)';
          setTimeout(() => {
            icon.style.transform = 'rotate(0deg)';
          }, 400);
        }

        if (!document.startViewTransition) {
          doToggle();
          return;
        }

        // Use View Transition API for smooth curtain effect
        document.startViewTransition(() => {
          doToggle();
        });
      });
    }
  })();

  // Tiles data - Client work featured first, then personal projects
  // Warm/Sunset Theme Variations (Orange, Red, Pink, Purple)
  const warmGradients = [
    {from:'#F59E0B', via:'#EF4444', to:'#EC4899'}, // Orange -> Red -> Pink
    {from:'#EC4899', via:'#F59E0B', to:'#EF4444'}, // Pink -> Orange -> Red
    {from:'#EF4444', via:'#EC4899', to:'#8B5CF6'}, // Red -> Pink -> Purple
    {from:'#F97316', via:'#DB2777', to:'#7C3AED'}, // Orange -> Pink -> Violet
    {from:'#F43F5E', via:'#FB923C', to:'#FBBF24'}, // Rose -> Orange -> Amber
    {from:'#DB2777', via:'#F59E0B', to:'#F43F5E'}, // Pink -> Orange -> Rose
  ];

  const tiles = [
    // === CLIENT PROJECTS ===
    { 
      title:'Dilja Engineering', 
      href:'https://dilja-engineering.danlabs.me/', 
      emoji:'🏗️', 
      accent:'#F59E0B', 
      description:'Corporate website for industrial engineering firm. Professional design with service showcases and contact integration.',
      gradient: warmGradients[0],
      category: 'client'
    },
    { 
      title:'Tulipan', 
      href:'https://tulipan.danlabs.me/', 
      emoji:'🛍️', 
      accent:'#EC4899', 
      description:'Modern e-commerce platform for fashion reseller. Sleek product displays, cart system, and seamless checkout experience.',
      gradient: warmGradients[1],
      category: 'client'
    },
    { 
      title:'Noah\'s Barber Studio', 
      href:'https://noahsbarberstudio.danlabs.me/', 
      emoji:'✂️', 
      accent:'#EF4444', 
      description:'Custom booking system for barber shop. Real-time appointments, service selection, and client management.',
      gradient: warmGradients[2],
      category: 'client'
    },
    { 
      title:'Desira Barber Studio', 
      href:'https://desirabarberstudio.danlabs.me/', 
      emoji:'💈', 
      accent:'#8B5CF6', 
      description:'Elegant barbershop website with online booking. Clean design, gallery showcase, and appointment scheduler.',
      gradient: warmGradients[3],
      category: 'client'
    },
    
    // === PERSONAL PROJECTS ===
    { 
      title:'GameBox', 
      href:'https://gamebox.danlabs.me', 
      emoji:'🎮', 
      accent:'#F43F5E', 
      description:'Multiplayer social games platform. Mafia, GeoGuessr-style rounds, Who Am I, and more with friends.',
      gradient: warmGradients[4],
      category: 'personal'
    },
    { 
      title:'GAMBL', 
      href:'https://gambl.danlabs.me', 
      emoji:'💎', 
      accent:'#DB2777', 
      description:'Casino-style gaming platform with dice, crash, mines. On-page stats and fairness verification.',
      gradient: warmGradients[5],
      category: 'personal'
    },
    { 
      title:'StudyFlow', 
      href:'https://studyflow.danlabs.me', 
      emoji:'📚', 
      accent:'#F59E0B', 
      description:'Smart study management with flashcards, progress tracking, and spaced repetition algorithms.',
      gradient: warmGradients[0],
      category: 'personal'
    },
    { 
      title:'Photography', 
      href:'https://photography.danlabs.me', 
      emoji:'📸', 
      accent:'#EC4899', 
      description:'Personal photography portfolio. Capturing moments, stories, and perspectives through the lens.',
      gradient: warmGradients[1],
      category: 'personal'
    },
    { 
      title:'DanLabs Portfolio', 
      href:'login.html?target=portfolio', 
      emoji:'🚀', 
      accent:'#EF4444', 
      description:'The main portfolio hub. Access restricted - requires authentication.',
      gradient: warmGradients[2],
      category: 'personal'
    }
  ];

  const tilesGrid = document.getElementById('tiles-grid');

  function buildTile(item, idx){
    const a = document.createElement('a');
    a.href = item.href || '#';
    // Only open in new tab if it's an external link
    if (item.href && !item.requiresLogin) a.target = '_blank';
    a.className = 'group relative block rounded-3xl p-[1px] transition overflow-hidden';
    // Border gradient (via p-[1px] wrapper)
    a.style.background = `linear-gradient(140deg, ${item.gradient.from} 0%, ${item.gradient.via} 40%, ${item.gradient.to} 100%)`;
    a.dataset.index = idx;
    a.dataset.category = item.category; // Store category for filtering
    
    // Uniform grid - removed col-span-2 logic for consistency

    const inner = document.createElement('div');
    inner.className = 'tile-glass rounded-3xl p-5 transition-transform duration-500 ease-out transform will-change-transform';
    // Subtle tinted glass background (10% opacity)
    inner.style.background = `linear-gradient(140deg, ${item.gradient.from}1a, ${item.gradient.via}1a, ${item.gradient.to}1a)`;

    const row = document.createElement('div'); 
    row.className = 'relative flex items-start gap-4';
    
    const iconWrap = document.createElement('div'); 
    iconWrap.className = 'icon';
    if (item.emoji){
      const emoji = document.createElement('span'); 
      emoji.textContent = item.emoji; 
      emoji.className = 'text-2xl'; 
      iconWrap.appendChild(emoji);
    }

    const txt = document.createElement('div'); 
    txt.className = 'min-w-0 flex-1';
    const h3wrap = document.createElement('div'); 
    h3wrap.className = 'flex items-center gap-2';
    const h3 = document.createElement('h3'); 
    h3.className = 'truncate text-xl font-semibold text-black/90 dark:text-white/90'; 
    h3.textContent = item.title;
    const arrow = document.createElement('i'); 
    arrow.setAttribute('data-lucide','arrow-up-right'); 
    arrow.className = 'h-4 w-4 text-black/50 opacity-0 transition group-hover:opacity-100 dark:text-white/60';
    h3wrap.appendChild(h3); 
    h3wrap.appendChild(arrow);

    const p = document.createElement('p'); 
    p.className = 'mt-1 line-clamp-3 text-sm text-black/70 dark:text-white/70';
    p.textContent = item.description;

    txt.appendChild(h3wrap); 
    txt.appendChild(p);
    row.appendChild(iconWrap); 
    row.appendChild(txt); 
    inner.appendChild(row);

    const flare = document.createElement('div'); 
    flare.className = 'pointer-events-none absolute inset-0 rounded-3xl opacity-0 blur-md transition group-hover:opacity-100'; 
    flare.style.background = `radial-gradient(60% 40% at 20% -10%, ${item.accent}40%, transparent 60%)`;
    inner.appendChild(flare);
    a.appendChild(inner);

    return a;
  }

  if (tilesGrid){
    // Initial render
    const renderTiles = (filter = 'all') => {
      tilesGrid.innerHTML = '';
      const filtered = filter === 'all' ? tiles : tiles.filter(t => t.category === filter);
      
      filtered.forEach((t,i)=> {
        const el = buildTile(t,i);
        tilesGrid.appendChild(el);
        // Re-observe for animation
        el.classList.add('reveal');
        obs.observe(el);
      });
      
      // Re-initialize icons
      if (window.lucide) window.lucide.createIcons();
      
      // Re-bind glass effect
      bindGlassEffect();
    };

    // Reveal observer with staggered inner transition
    const obs = new IntersectionObserver((entries)=>{
      entries.forEach(entry=>{
        if (entry.isIntersecting){
          const el = entry.target; const idx = Number(el.dataset.index||0);
          el.classList.add('reveal-visible');
          // apply animation classes to the entire tile anchor so the whole card animates
          const anchor = el;
          // Reduced delay for smoother ripple (50ms instead of 90ms)
          anchor.style.animationDelay = `${idx*50}ms`;
          // Use custom smooth entry animation instead of animate.css
          anchor.classList.add('animate-smooth-entry');
          // also ensure the inner element transitions to final state for any subtle transforms
          const inner = el.querySelector('.rounded-3xl');
          if (inner) inner.style.transitionDelay = `${idx*50}ms`;
          obs.unobserve(el);
        }
      });
    }, { root:null, rootMargin:'0px 0px -60px 0px', threshold:0.12 });

    // Glass effect binding function
    const bindGlassEffect = () => {
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
    };

    // Initial render call
    renderTiles('all');

    // Filter button logic
    const filterBtns = document.querySelectorAll('.filter-btn');
    filterBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        // Update active state
        filterBtns.forEach(b => {
          b.classList.remove('active', 'bg-indigo-500', 'text-white', 'shadow-lg', 'shadow-indigo-500/30');
          b.classList.add('bg-white/5', 'text-slate-600', 'dark:text-slate-300');
        });
        btn.classList.remove('bg-white/5', 'text-slate-600', 'dark:text-slate-300');
        btn.classList.add('active', 'bg-indigo-500', 'text-white', 'shadow-lg', 'shadow-indigo-500/30');
        
        // Render filtered tiles
        renderTiles(btn.dataset.filter);
      });
    });
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

  // === AGENCY FEATURES ===
  
  // Handle contact form submission via AJAX to prevent redirect loop
  const contactForm = document.querySelector('.contact-form');
  if (contactForm) {
    contactForm.addEventListener('submit', function(e) {
      e.preventDefault();
      const btn = this.querySelector('button[type="submit"]');
      const originalText = btn.innerText;
      btn.innerText = 'Sending...';
      btn.disabled = true;

      const formData = new FormData(this);
      
      fetch(this.action, {
        method: 'POST',
        body: formData,
        headers: {
          'Accept': 'application/json'
        }
      })
      .then(response => {
        if (response.ok) {
          // Show success message
          const successDiv = document.createElement('div');
          successDiv.className = 'success-message';
          successDiv.innerHTML = `
            <div style="display:flex;align-items:center;gap:1rem;">
              <div style="width:3rem;height:3rem;border-radius:50%;background:linear-gradient(135deg,#10b981,#059669);display:flex;align-items:center;justify-content:center;font-size:1.5rem;">✓</div>
              <div>
                <h3 style="margin:0 0 0.25rem 0; font-size:1.5rem; font-weight:700;">Message Sent! 🎉</h3>
                <p style="margin:0; opacity:0.95; font-size:0.95rem;">We'll get back to you shortly.</p>
              </div>
            </div>
          `;
          document.body.appendChild(successDiv);
          
          // Trigger confetti
          if (window.confetti) {
            confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 }, colors: ['#10b981', '#059669', '#34d399', '#6ee7b7'] });
          }
          
          // Reset form
          this.reset();
          
          // Remove success message after delay
          setTimeout(() => {
            successDiv.style.animation = 'success-pop 0.3s cubic-bezier(.2,.8,.25,1) reverse both';
            setTimeout(() => successDiv.remove(), 300);
          }, 4000);
        } else {
          alert('Oops! There was a problem submitting your form');
        }
      })
      .catch(error => {
        alert('Oops! There was a problem submitting your form');
      })
      .finally(() => {
        btn.innerText = originalText;
        btn.disabled = false;
      });
    });
  }
  
  // Check for form submission success (legacy support)
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('success') === 'true') {
    // Show success message with confetti
    const successDiv = document.createElement('div');
    successDiv.className = 'success-message';
    successDiv.innerHTML = `
      <div style="display:flex;align-items:center;gap:1rem;">
        <div style="width:3rem;height:3rem;border-radius:50%;background:linear-gradient(135deg,#10b981,#059669);display:flex;align-items:center;justify-content:center;font-size:1.5rem;">✓</div>
        <div>
          <h3 style="margin:0 0 0.25rem 0; font-size:1.5rem; font-weight:700;">Message Sent! 🎉</h3>
          <p style="margin:0; opacity:0.95; font-size:0.95rem;">We'll get back to you shortly.</p>
        </div>
      </div>
    `;
    document.body.appendChild(successDiv);
    
    // Trigger confetti animation
    if (window.confetti) {
      // Center burst
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#10b981', '#059669', '#34d399', '#6ee7b7']
      });
      
      // Side bursts for extra effect
      setTimeout(() => {
        confetti({
          particleCount: 50,
          angle: 60,
          spread: 55,
          origin: { x: 0, y: 0.6 },
          colors: ['#10b981', '#059669', '#34d399']
        });
        confetti({
          particleCount: 50,
          angle: 120,
          spread: 55,
          origin: { x: 1, y: 0.6 },
          colors: ['#10b981', '#059669', '#34d399']
        });
      }, 150);
    }
    
    // Remove after 4 seconds
    setTimeout(() => {
      successDiv.style.animation = 'success-pop 0.3s cubic-bezier(.2,.8,.25,1) reverse both';
      setTimeout(() => successDiv.remove(), 300);
    }, 4000);
    
    // Clean URL
    window.history.replaceState({}, document.title, window.location.pathname);
  }

  // Smooth scroll for all anchor links
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
      const href = this.getAttribute('href');
      if (href === '#' || !href) return;
      
      const target = document.querySelector(href);
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        
        // Update URL without triggering scroll
        if (history.pushState) {
          history.pushState(null, null, href);
        }
      }
    });
  });

})();
