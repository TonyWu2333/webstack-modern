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

  // ---- sidebar submenu expand / collapse ----
  // Replaces Xenon's TweenMax versions (looked up globally at click time) with CSS transitions:
  // height eases open, child items fade and slide in one after another.
  var SUB_MS = 360;
  document.querySelectorAll('#main-menu > li > ul').forEach(function (ul) {
    Array.prototype.forEach.call(ul.children, function (li, i) { li.style.setProperty('--i', i); });
  });
  function whenDone(el, fn) {
    var done = false;
    function finish(e) {
      if (done || (e && (e.target !== el || e.propertyName !== 'height'))) return;
      done = true;
      el.removeEventListener('transitionend', finish);
      fn();
    }
    el.addEventListener('transitionend', finish);
    setTimeout(finish, SUB_MS + 80);
  }
  function scrollbarUpdate() {
    if (typeof window.ps_update === 'function') window.ps_update(true);
  }
  window.sidebar_menu_item_expand = function ($li, $sub) {
    var sidebarCollapsed = window.public_vars && public_vars.$sidebarMenu.hasClass('collapsed');
    if ($li.data('is-busy') || ($li.parent('.main-menu').length && sidebarCollapsed)) return;
    var ul = $sub[0];
    $li.addClass('expanded').data('is-busy', true);
    ul.classList.remove('sub-out');
    ul.classList.add('sub-pre');
    ul.style.display = 'block';
    var target = ul.scrollHeight;
    ul.style.height = '0px';
    void ul.offsetHeight; // commit the start state before animating
    ul.classList.remove('sub-pre');
    ul.style.height = target + 'px';
    whenDone(ul, function () {
      ul.style.height = '';
      $li.data('is-busy', false);
      scrollbarUpdate();
    });
  };
  window.sidebar_menu_item_collapse = function ($li, $sub) {
    if ($li.data('is-busy')) return;
    var ul = $sub[0];
    $li.removeClass('expanded').data('is-busy', true);
    ul.style.height = ul.offsetHeight + 'px';
    void ul.offsetHeight;
    ul.classList.add('sub-out');
    ul.style.height = '0px';
    whenDone(ul, function () {
      // no inline display:none, so the hover flyout still works when the sidebar is collapsed
      ul.removeAttribute('style');
      ul.classList.remove('sub-out');
      $li.data('is-busy', false).removeClass('opened');
      scrollbarUpdate();
    });
  };

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
