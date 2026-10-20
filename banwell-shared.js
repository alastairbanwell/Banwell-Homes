// Before & After drag-compare sliders
(function(){
  document.querySelectorAll('.ba-compare').forEach(function(el){
    function setPos(clientX){
      var rect = el.getBoundingClientRect();
      var pct = ((clientX - rect.left) / rect.width) * 100;
      pct = Math.max(0, Math.min(100, pct));
      el.style.setProperty('--pos', pct + '%');
    }
    var dragging = false;
    el.addEventListener('pointerdown', function(e){
      dragging = true;
      el.classList.remove('peek');
      el.setPointerCapture(e.pointerId);
      setPos(e.clientX);
    });
    el.addEventListener('pointermove', function(e){
      if(!dragging) return;
      setPos(e.clientX);
    });
    el.addEventListener('pointerup', function(){ dragging = false; });
    el.addEventListener('pointercancel', function(){ dragging = false; });
    // Gentle auto peek on load so it reads as draggable, then settles back.
    var observer = new IntersectionObserver(function(entries){
      entries.forEach(function(entry){
        if(entry.isIntersecting){
          el.classList.add('peek');
          setTimeout(function(){ el.style.setProperty('--pos', '35%'); }, 150);
          setTimeout(function(){ el.style.setProperty('--pos', '50%'); }, 900);
          observer.unobserve(el);
        }
      });
    }, {threshold:0.4});
    observer.observe(el);
  });
})();

// Nav goes solid on scroll, or whenever the mobile menu is open (the
// mobile-menu overlay is always dark, so the nav's logo/hamburger/text
// must switch to their light-on-dark styling even if the page hasn't
// been scrolled yet, otherwise they're invisible against it).
(function(){
  var nav = document.getElementById('nav');
  var btn = document.getElementById('navHamburger');
  var menu = document.getElementById('mobileMenu');
  if(!nav) return;
  var menuOpen = false;
  function update(){ nav.classList.toggle('solid', menuOpen || window.scrollY > 40 || nav.hasAttribute('data-solid')); }
  window.addEventListener('scroll', update, {passive:true});
  update();

  if(!btn || !menu) return;
  function closeMenu(){
    btn.classList.remove('open'); menu.classList.remove('open'); document.body.classList.remove('menu-open');
    menuOpen = false; update();
  }
  function toggleMenu(){
    var isOpen = menu.classList.toggle('open');
    btn.classList.toggle('open', isOpen);
    document.body.classList.toggle('menu-open', isOpen);
    menuOpen = isOpen; update();
  }
  btn.addEventListener('click', toggleMenu);
  menu.querySelectorAll('a').forEach(function(a){ a.addEventListener('click', closeMenu); });
  window.addEventListener('resize', function(){ if(window.innerWidth > 860) closeMenu(); });
})();

// Recent Work strip, prev/next buttons, no custom drag
(function(){
  var track = document.getElementById('workStrip');
  var bar = document.getElementById('workProgressBar');
  var prevBtn = document.getElementById('workPrev');
  var nextBtn = document.getElementById('workNext');
  if(!track || !bar) return;
  function update(){
    var max = track.scrollWidth - track.clientWidth;
    var pct = max > 0 ? track.scrollLeft / max : 0;
    var barWidth = Math.max(15, (track.clientWidth / track.scrollWidth) * 100);
    bar.style.width = barWidth + '%';
    bar.style.left = (pct * (100 - barWidth)) + '%';
    if(prevBtn) prevBtn.disabled = track.scrollLeft <= 4;
    if(nextBtn) nextBtn.disabled = track.scrollLeft >= max - 4;
  }
  track.addEventListener('scroll', update, {passive:true});
  window.addEventListener('resize', update);
  update();
  function step(dir){
    var item = track.querySelector('.work-item');
    var amount = item ? item.getBoundingClientRect().width + 24 : track.clientWidth * 0.8;
    track.scrollBy({left: dir * amount, behavior: 'smooth'});
  }
  if(prevBtn) prevBtn.addEventListener('click', function(){ step(-1); });
  if(nextBtn) nextBtn.addEventListener('click', function(){ step(1); });
})();

// Work page gallery filter
(function(){
  var bar = document.getElementById('galleryFilter');
  var grid = document.getElementById('galleryGrid');
  var empty = document.getElementById('galleryEmpty');
  if(!bar || !grid) return;
  var items = grid.querySelectorAll('.gallery-item');
  bar.querySelectorAll('.filter-btn').forEach(function(btn){
    btn.addEventListener('click', function(){
      bar.querySelectorAll('.filter-btn').forEach(function(b){ b.classList.remove('active'); });
      btn.classList.add('active');
      var filter = btn.dataset.filter;
      var visible = 0;
      items.forEach(function(item){
        var show = filter === 'all' || item.dataset.category === filter;
        item.style.display = show ? '' : 'none';
        if(show) visible++;
      });
      if(empty) empty.hidden = visible > 0;
    });
  });
})();

// FAQ accordion
function faqToggle(btn){
  var row = btn.closest('.faq-row');
  var wasOpen = row.classList.contains('open');
  row.parentElement.querySelectorAll('.faq-row').forEach(function(r){ r.classList.remove('open'); });
  if(!wasOpen) row.classList.add('open');
}

// Scroll-fade reveal
(function(){
  var observer = new IntersectionObserver(function(entries){
    entries.forEach(function(entry){
      if(entry.isIntersecting){
        entry.target.classList.add('in');
        observer.unobserve(entry.target);
      }
    });
  }, {threshold:0.15});
  document.querySelectorAll('.reveal').forEach(function(el){ observer.observe(el); });
})();

// WhatsApp quick quote sheet, and Call buttons that become WhatsApp outside Neville's hours
(function(){
  var NUMBER = '27729609852';
  var BASE = 'https://wa.me/' + NUMBER;
  var DEFAULT_TEXT = "Hi Neville, I found your website and I'm interested in getting a quote for a project. Could we chat?";
  var SERVICES = ['Decking', 'Pergola or structure', 'Staircase', 'Fencing or screening', 'Something else'];
  var PLACES = ["Betty's Bay", 'Rooi Els', 'Kleinmond', 'Pringle Bay', 'Somewhere else'];
  var HOURS = { open: 8 * 60, close: 17 * 60 };

  /* ---------- opening hours, always South African time ---------- */
  function isOpenNow(){
    try {
      var parts = new Intl.DateTimeFormat('en-GB', { timeZone: 'Africa/Johannesburg', weekday: 'short', hour: 'numeric', minute: 'numeric', hour12: false }).formatToParts(new Date());
      var wd = '', h = 0, m = 0;
      parts.forEach(function(p){ if(p.type === 'weekday') wd = p.value; if(p.type === 'hour') h = parseInt(p.value, 10) % 24; if(p.type === 'minute') m = parseInt(p.value, 10); });
      if(['Mon', 'Tue', 'Wed', 'Thu', 'Fri'].indexOf(wd) === -1) return false;
      var mins = h * 60 + m;
      return mins >= HOURS.open && mins < HOURS.close;
    } catch(e){ return true; }
  }

  var callTargets = [].slice.call(document.querySelectorAll('.nav-phone, a.btn[href^="tel:"], a.faq-call'));
  callTargets.forEach(function(el){
    el.dataset.callHref = el.getAttribute('href');
    el.dataset.callText = el.textContent;
  });
  var notes = [];
  [].forEach.call(document.querySelectorAll('.hero-ctas'), function(box){
    var p = document.createElement('p');
    p.className = 'hours-note';
    p.hidden = true;
    p.textContent = 'Calls are answered 8am to 5pm, Monday to Friday. Message us on WhatsApp any time.';
    box.parentNode.insertBefore(p, box.nextSibling);
    notes.push(p);
  });

  function applyHours(){
    var open = isOpenNow();
    callTargets.forEach(function(el){
      var siblingWa = el.parentElement && el.parentElement.querySelector('a[href^="' + BASE + '"]:not([data-was-call])');
      if(open){
        el.hidden = false;
        el.setAttribute('href', el.dataset.callHref);
        el.textContent = el.dataset.callText;
        el.removeAttribute('data-was-call');
        el.removeAttribute('target');
        return;
      }
      if(el.classList.contains('btn') && siblingWa){ el.hidden = true; return; }
      el.hidden = false;
      el.dataset.wasCall = '1';
      el.setAttribute('href', BASE + '?text=' + encodeURIComponent(DEFAULT_TEXT));
      el.setAttribute('target', '_blank');
      el.setAttribute('rel', 'noopener noreferrer');
      el.textContent = el.classList.contains('nav-phone') ? 'WhatsApp' : (el.classList.contains('faq-call') ? 'Still unsure? Message us on WhatsApp' : 'WhatsApp Us');
    });
    notes.forEach(function(p){ p.hidden = open; });
  }
  applyHours();
  setInterval(applyHours, 60000);
  document.addEventListener('visibilitychange', function(){ if(!document.hidden) applyHours(); });

  /* ---------- quick quote sheet ---------- */
  if(typeof HTMLDialogElement === 'undefined') return;
  var dlg = null, body, stepEl, state;

  function build(){
    dlg = document.createElement('dialog');
    dlg.className = 'qq';
    dlg.setAttribute('aria-labelledby', 'qqTitle');
    dlg.innerHTML = '<div class="qq-inner"><div class="qq-top"><span class="qq-step" id="qqStep"></span><button type="button" class="qq-close" aria-label="Close">&times;</button></div><div class="qq-body" id="qqBody"></div><a class="qq-skip" target="_blank" rel="noopener noreferrer">Skip, just open WhatsApp</a></div>';
    document.body.appendChild(dlg);
    body = dlg.querySelector('#qqBody');
    stepEl = dlg.querySelector('#qqStep');
    dlg.querySelector('.qq-skip').href = BASE + '?text=' + encodeURIComponent(DEFAULT_TEXT);
    dlg.querySelector('.qq-close').addEventListener('click', function(){ dlg.close(); });
    dlg.addEventListener('click', function(e){ if(e.target === dlg) dlg.close(); });
    dlg.querySelector('.qq-skip').addEventListener('click', function(){ dlg.close(); });
  }

  function chips(list, key, onPick){
    var wrap = document.createElement('div');
    wrap.className = 'qq-chips';
    list.forEach(function(label){
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'qq-chip';
      b.textContent = label;
      b.setAttribute('aria-pressed', state[key] === label ? 'true' : 'false');
      b.addEventListener('click', function(){
        state[key] = label;
        [].forEach.call(wrap.children, function(c){ c.setAttribute('aria-pressed', c === b ? 'true' : 'false'); });
        onPick(label);
      });
      wrap.appendChild(b);
    });
    return wrap;
  }

  function heading(text){
    var h = document.createElement('h2');
    h.id = 'qqTitle';
    h.textContent = text;
    h.tabIndex = -1;
    return h;
  }

  function message(){
    var place = state.place === 'Somewhere else' && state.placeOther ? state.placeOther : state.place;
    var lines = ["Hi Neville, I found your website and I'd like a quote.", '', 'Job: ' + state.service, 'Where: ' + place];
    if(state.name) lines.push('Name: ' + state.name);
    if(state.details) lines.push('Details: ' + state.details);
    lines.push('', 'I can send photos of the space.');
    return lines.join('\n');
  }

  function render(){
    body.innerHTML = '';
    body.style.animation = 'none';
    void body.offsetWidth;
    body.style.animation = '';
    stepEl.textContent = 'Step ' + state.step + ' of 3';
    if(state.step === 1){
      body.appendChild(heading('What do you need?'));
      body.appendChild(chips(SERVICES, 'service', function(){ setTimeout(function(){ state.step = 2; render(); }, 140); }));
    } else if(state.step === 2){
      body.appendChild(heading('Where is the job?'));
      var extra = document.createElement('div');
      var actions = document.createElement('div');
      actions.className = 'qq-actions';
      actions.innerHTML = '<button type="button" class="qq-back">Back</button><span></span>';
      actions.querySelector('.qq-back').addEventListener('click', function(){ state.step = 1; render(); });
      function showOther(){
        extra.innerHTML = '<label for="qqPlace">Which town?</label><input id="qqPlace" type="text" autocomplete="address-level2" maxlength="60"><div class="qq-actions"><button type="button" class="qq-back">Back</button><button type="button" class="btn btn-primary qq-next">Next</button></div>';
        var inp = extra.querySelector('input');
        inp.value = state.placeOther || '';
        extra.querySelector('.qq-next').addEventListener('click', function(){ state.placeOther = inp.value.trim(); state.step = 3; render(); });
        extra.querySelector('.qq-back').addEventListener('click', function(){ state.step = 1; render(); });
        actions.hidden = true;
        inp.focus();
      }
      var list = chips(PLACES, 'place', function(label){
        if(label === 'Somewhere else'){ showOther(); }
        else { state.placeOther = ''; setTimeout(function(){ state.step = 3; render(); }, 140); }
      });
      body.appendChild(list);
      body.appendChild(extra);
      body.appendChild(actions);
    } else {
      body.appendChild(heading('Nearly there.'));
      var f = document.createElement('div');
      f.innerHTML = '<label for="qqName">Your name</label><input id="qqName" type="text" autocomplete="given-name" maxlength="60"><label for="qqDetails">Anything Neville should know? (optional)</label><textarea id="qqDetails" maxlength="400"></textarea><div class="qq-actions"><button type="button" class="qq-back">Back</button><a class="btn btn-primary qq-go" target="_blank" rel="noopener noreferrer">Open WhatsApp</a></div>';
      body.appendChild(f);
      var name = f.querySelector('#qqName'), details = f.querySelector('#qqDetails'), go = f.querySelector('.qq-go');
      name.value = state.name || ''; details.value = state.details || '';
      var refresh = function(){ state.name = name.value.trim(); state.details = details.value.trim(); go.href = BASE + '?text=' + encodeURIComponent(message()); };
      name.addEventListener('input', refresh); details.addEventListener('input', refresh);
      refresh();
      go.addEventListener('click', function(){ refresh(); setTimeout(function(){ dlg.close(); }, 200); });
      f.querySelector('.qq-back').addEventListener('click', function(){ state.step = 2; render(); });
    }
    var hh = body.querySelector('h2');
    if(hh) hh.focus({ preventScroll: true });
  }

  function openSheet(){
    if(!dlg) build();
    state = { step: 1, service: '', place: '', placeOther: '', name: '', details: '' };
    render();
    if(!dlg.open) dlg.showModal();
  }

  document.addEventListener('click', function(e){
    var a = e.target.closest && e.target.closest('a[href^="' + BASE + '"]');
    if(!a || a.closest('.qq')) return;
    if(e.metaKey || e.ctrlKey || e.shiftKey || e.button === 1) return;
    e.preventDefault();
    openSheet();
  });
})();

// Numbered points on the service pages open and close on phones
(function(){
  var mq = window.matchMedia('(max-width:900px)');
  var items = [].slice.call(document.querySelectorAll('.sv-points .sv-list li'));
  if(!items.length) return;
  function setup(){
    items.forEach(function(li){
      if(mq.matches){
        li.setAttribute('role', 'button');
        li.setAttribute('tabindex', '0');
        li.setAttribute('aria-expanded', li.classList.contains('open') ? 'true' : 'false');
      } else {
        li.removeAttribute('role');
        li.removeAttribute('tabindex');
        li.removeAttribute('aria-expanded');
        li.classList.remove('open');
      }
    });
  }
  function toggle(li){
    if(!mq.matches) return;
    var open = li.classList.toggle('open');
    li.setAttribute('aria-expanded', open ? 'true' : 'false');
  }
  items.forEach(function(li){
    li.addEventListener('click', function(){ toggle(li); });
    li.addEventListener('keydown', function(e){
      if(e.key === 'Enter' || e.key === ' '){ e.preventDefault(); toggle(li); }
    });
  });
  setup();
  if(mq.addEventListener) mq.addEventListener('change', setup); else if(mq.addListener) mq.addListener(setup);
})();

// Lazy videos: load and play only when near the screen, pause when away
(function(){
  var vids = [].slice.call(document.querySelectorAll('video[data-src]'));
  if(!vids.length) return;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if(!('IntersectionObserver' in window) || reduce) return;
  var io = new IntersectionObserver(function(entries){
    entries.forEach(function(en){
      var v = en.target;
      if(en.isIntersecting){
        if(!v.getAttribute('src')){ v.setAttribute('src', v.getAttribute('data-src')); }
        var p = v.play(); if(p && p.catch) p.catch(function(){});
      } else if(v.getAttribute('src')){ v.pause(); }
    });
  }, { rootMargin: '200px 0px' });
  vids.forEach(function(v){ io.observe(v); });
})();

// Reviews: long quotes show four lines with a Read full review toggle. Short ones get no button.
(function(){
  var cards = [].slice.call(document.querySelectorAll('.rv-card'));
  if(!cards.length) return;
  function setup(card){
    var q = card.querySelector('blockquote');
    if(!q) return;
    var btn = card.querySelector('.rv-more');
    var open = q.classList.contains('rv-open');
    if(!open) q.classList.add('rv-clamp');
    var overflows = open || q.scrollHeight > q.clientHeight + 1;
    if(!overflows){ q.classList.remove('rv-clamp'); if(btn) btn.remove(); return; }
    if(btn) return;
    btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'rv-more';
    btn.setAttribute('aria-expanded', 'false');
    btn.textContent = 'Read full review';
    btn.addEventListener('click', function(){
      var nowOpen = q.classList.toggle('rv-open');
      btn.setAttribute('aria-expanded', nowOpen ? 'true' : 'false');
      btn.textContent = nowOpen ? 'Show less' : 'Read full review';
    });
    q.insertAdjacentElement('afterend', btn);
  }
  function run(){ cards.forEach(setup); }
  run();
  if(document.fonts && document.fonts.ready) document.fonts.ready.then(run);
  var t; window.addEventListener('resize', function(){ clearTimeout(t); t = setTimeout(run, 150); });
})();
