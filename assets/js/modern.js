// Motion and theme helpers for the modern skin
(function () {
  var root = document.documentElement;
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ---- light / dark toggle (initial value is applied inline in <head>) ----
  function isDark() {
    var t = root.getAttribute('data-theme');
    return t ? t === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches;
  }
  document.querySelectorAll('[data-theme-toggle]').forEach(function (btn) {
    btn.addEventListener('click', function (e) {
      e.preventDefault();
      var next = isDark() ? 'light' : 'dark';
      root.setAttribute('data-theme', next);
      try { localStorage.setItem('theme', next); } catch (err) {}
    });
  });

  // ---- staggered entrance for headings and cards ----
  var items = [];
  document.querySelectorAll('.main-content h4.text-gray').forEach(function (h) { items.push(h); });
  document.querySelectorAll('.main-content .row').forEach(function (row) {
    Array.prototype.forEach.call(row.children, function (col, i) {
      col.style.setProperty('--d', (i % 4) * 60 + 'ms');
      items.push(col);
    });
  });
  if ('IntersectionObserver' in window && !reduceMotion) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          en.target.classList.add('in');
          io.unobserve(en.target);
        }
      });
    }, { rootMargin: '0px 0px -40px 0px', threshold: 0.05 });
    items.forEach(function (el) { el.classList.add('reveal'); io.observe(el); });
  }

  // ---- cursor-following spotlight on cards ----
  document.querySelectorAll('.box2').forEach(function (card) {
    card.addEventListener('mousemove', function (e) {
      var r = card.getBoundingClientRect();
      card.style.setProperty('--mx', e.clientX - r.left + 'px');
      card.style.setProperty('--my', e.clientY - r.top + 'px');
    });
  });

  // ---- highlight the sidebar entry of the section in view ----
  var headings = Array.prototype.map.call(document.querySelectorAll('.main-content h4.text-gray > i[id]'), function (i) {
    return { id: i.id, el: i.parentNode, link: document.querySelector('#main-menu a[href="#' + i.id + '"]') };
  });
  var current = null;
  function spy() {
    var hit = headings[0];
    for (var k = 0; k < headings.length; k++) {
      if (headings[k].el.getBoundingClientRect().top <= 120) hit = headings[k];
    }
    if (window.innerHeight + window.scrollY >= document.body.scrollHeight - 2) hit = headings[headings.length - 1];
    if (!hit || hit === current || !hit.link) return;
    current = hit;
    document.querySelectorAll('#main-menu li.active, #main-menu li.child-active').forEach(function (li) {
      li.classList.remove('active', 'child-active');
    });
    var li = hit.link.parentNode;
    li.classList.add('active');
    var parent = li.parentNode.closest('li');
    if (parent) parent.classList.add('child-active');
  }
  var ticking = false;
  window.addEventListener('scroll', function () {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () { ticking = false; spy(); });
  }, { passive: true });
  spy();
})();
