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
  function update(){ nav.classList.toggle('solid', menuOpen || window.scrollY > 40); }
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
