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

  // Collapsing the whole sidebar: fold any open submenu along with it instead of letting it vanish.
  // Capture phase so this runs before Xenon adds .collapsed.
  document.addEventListener('click', function (e) {
    if (!e.target.closest || !e.target.closest('a[data-toggle="sidebar"]')) return;
    if (!window.public_vars || public_vars.$sidebarMenu.hasClass('collapsed')) return;
    document.querySelectorAll('#main-menu > li.expanded').forEach(function (li) {
      window.sidebar_menu_item_collapse(jQuery(li), jQuery(li).children('ul'));
    });
  }, true);

  // ---- highlight the sidebar entry of the section in view ----
  var headings = Array.prototype.map.call(document.querySelectorAll('.main-content h4.text-gray > i[id]'), function (i) {
    return { id: i.id, el: i.parentNode, link: document.querySelector('#main-menu a[href="#' + i.id + '"]') };
  });
  var current = null;
  function spy() {
    // sections hidden by the search filter don't count
    var shown = headings.filter(function (h) { return h.el.offsetParent !== null; });
    var hit = shown[0];
    for (var k = 0; k < shown.length; k++) {
      if (shown[k].el.getBoundingClientRect().top <= 120) hit = shown[k];
    }
    if (window.innerHeight + window.scrollY >= document.body.scrollHeight - 2) hit = shown[shown.length - 1];
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

  // ---- search filter ----
  var input = document.getElementById('search');
  if (!input) return;
  var box = input.parentNode;
  var countEl = box.querySelector('.search-count');
  var empty = document.getElementById('search-empty');

  function esc(t) {
    return t.replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; });
  }
  function highlight(text, re) {
    if (!re) return esc(text);
    var out = '';
    var last = 0;
    text.replace(re, function (m, at) {
      out += esc(text.slice(last, at)) + '<mark>' + esc(m) + '</mark>';
      last = at + m.length;
      return m;
    });
    return out + esc(text.slice(last));
  }

  var groups = headings.map(function (h) {
    var row = h.el.nextElementSibling;
    var badge = h.el.querySelector('.cat-count');
    var cards = Array.prototype.map.call(row.children, function (col) {
      var w = col.querySelector('.xe-widget');
      var t = w.querySelector('strong');
      var d = w.querySelector('p');
      var url = w.getAttribute('data-original-title') || '';
      return { col: col, t: t, d: d, title: t.textContent, desc: d.textContent, url: url,
        hay: (t.textContent + ' ' + d.textContent + ' ' + url).toLowerCase() };
    });
    return { h: h, row: row, badge: badge, total: badge ? badge.textContent : '', cards: cards };
  });

  var lastQuery = '';
  function filter() {
    var q = input.value.trim();
    if (q === lastQuery) return;
    lastQuery = q;
    var terms = q.toLowerCase().split(/\s+/).filter(Boolean);
    var re = terms.length ? new RegExp(terms.map(function (t) { return t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }).join('|'), 'gi') : null;
    var found = 0;
    groups.forEach(function (g) {
      var n = 0;
      g.cards.forEach(function (c) {
        var ok = terms.every(function (t) { return c.hay.indexOf(t) !== -1; });
        c.col.classList.toggle('search-hidden', !ok);
        c.t.innerHTML = highlight(c.title, re);
        c.d.innerHTML = highlight(c.desc, re);
        if (ok) n++;
      });
      found += n;
      var hide = terms.length > 0 && n === 0;
      g.h.el.classList.toggle('search-hidden', hide);
      g.row.classList.toggle('search-hidden', hide);
      if (g.badge) g.badge.textContent = terms.length ? n : g.total;
      if (g.h.link) g.h.link.parentNode.classList.toggle('search-dim', hide);
    });
    // dim a parent group when every one of its subcategories is filtered out
    document.querySelectorAll('#main-menu > li.has-sub').forEach(function (li) {
      li.classList.toggle('search-dim', !li.querySelector('ul > li:not(.search-dim)'));
    });
    box.classList.toggle('has-value', q.length > 0);
    countEl.textContent = terms.length ? found + ' 个结果' : '';
    empty.hidden = !(terms.length && found === 0);
    empty.querySelector('.search-empty-q').textContent = q;
    window.scrollTo(0, 0);
    current = null;
    spy();
  }
  function firstResult() {
    for (var i = 0; i < groups.length; i++) {
      for (var j = 0; j < groups[i].cards.length; j++) {
        var c = groups[i].cards[j];
        if (!c.col.classList.contains('search-hidden')) return c;
      }
    }
    return null;
  }
  function clear() {
    input.value = '';
    filter();
  }

  input.addEventListener('input', filter);
  input.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
      clear();
      input.blur();
    } else if (e.key === 'Enter' && input.value.trim()) {
      var c = firstResult();
      if (c && c.url) window.open(c.url, '_blank');
    }
  });
  box.querySelector('.search-clear').addEventListener('click', function (e) {
    e.preventDefault();
    clear();
    input.focus();
  });
  // "/" or Cmd/Ctrl+K focuses the search box
  document.addEventListener('keydown', function (e) {
    var typing = /^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement.tagName) || document.activeElement.isContentEditable;
    if ((e.key === '/' && !typing) || ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k')) {
      e.preventDefault();
      input.focus();
      input.select();
    }
  });
  if (/Mac|iPhone|iPad/.test(navigator.platform)) box.querySelector('.search-kbd').title = '按 / 或 ⌘K 搜索';
  else box.querySelector('.search-kbd').title = '按 / 或 Ctrl+K 搜索';
})();
