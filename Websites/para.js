/* Personalised demo view: <demo>.html?para=Nombre+del+negocio&zona=Ciudad
   Swaps the demo's fictional brand for the lead's name in the browser only. Nothing about the
   business is stored on this site, and a "concepto" banner stays on top (CLAUDE.md content rules). */
(function () {
  var params = new URLSearchParams(location.search);
  var name = (params.get('para') || '').replace(/\s+/g, ' ').trim().slice(0, 60);
  if (!name) return;
  var zona = (params.get('zona') || '').replace(/\s+/g, ' ').trim().slice(0, 40);

  // Fictional brand of each demo (matched case- and accent-insensitively in visible text)
  var BRANDS = {
    'barberia': ['Vértigo'], 'cerveceria': ['Dos Dedos'], 'churreria': [],
    'clinica_dental': ['AUREA'], 'clinica_estetica': ['LUMA'], 'detailing_coches': ['KRONOS'],
    'estudio_interiorismo': ['Atelier Véra'], 'estudio_tatuajes': ['Atelier Noir'],
    'estudio_yoga_pilates': ['CALMA'], 'floristeria_eventos': ['Botánica Real'],
    'inmobiliaria_lujo': ['Valmont & Co.', 'Valmont'], 'joyeria_relojeria': ['Maison Alba'],
    'restaurante-bar': [], 'restaurante-clasico': [], 'restaurante-moderno': []
  };
  var page = (location.pathname.split('/').pop() || '').replace(/\.html?$/, '');
  var brands = BRANDS[page] || [];

  function fold(s) { return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase(); }
  function styled(original) {
    // Keep the demo's typography: an all-caps logo stays all caps
    return original === original.toUpperCase() && /[A-ZÁÉÍÓÚÑ]/.test(original) ? name.toUpperCase() : name;
  }
  function swapIn(text) {
    var out = text;
    for (var i = 0; i < brands.length; i++) {
      var b = brands[i], f = fold(out), fb = fold(b), at = f.indexOf(fb);
      while (at !== -1) {
        out = out.slice(0, at) + styled(out.slice(at, at + b.length)) + out.slice(at + b.length);
        f = fold(out);
        at = f.indexOf(fb, at + name.length);
      }
    }
    return out;
  }

  function run() {
    // 1. Every visible mention of the fictional brand
    var walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
      acceptNode: function (n) { var p = n.parentNode && n.parentNode.nodeName; return p === 'SCRIPT' || p === 'STYLE' ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT; }
    });
    var nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    if (brands.length) nodes.forEach(function (n) { var t = swapIn(n.nodeValue); if (t !== n.nodeValue) n.nodeValue = t; });

    // 2. Logo elements (the restaurant demos use a generic word instead of a brand)
    var logos = document.querySelectorAll('.logo, .logo-giant, .brand-name, .brand-title, .fbrand, .brand > b, a.brand, span.brand');
    Array.prototype.forEach.call(logos, function (el) {
      if (el.querySelector('.brand-name, .brand-title, b')) return; // handled by its child
      var texts = Array.prototype.filter.call(el.childNodes, function (c) { return c.nodeType === 3 && c.nodeValue.trim(); });
      var last = texts[texts.length - 1];
      if (last && fold(last.nodeValue.trim()) !== fold(name)) last.nodeValue = styled(last.nodeValue.trim());
    });
    Array.prototype.forEach.call(document.querySelectorAll('.brand-monogram, .brand-crest, .brand-circle, .brand .mono'), function (el) {
      el.textContent = name.charAt(0).toUpperCase();
    });
    Array.prototype.forEach.call(document.querySelectorAll('[aria-label]'), function (el) {
      var v = el.getAttribute('aria-label');
      var t = brands.length ? swapIn(v) : v.replace(/^(Restaurante|Churrería)(?=,)/, name);
      if (t !== v) el.setAttribute('aria-label', t);
    });
    if (zona) Array.prototype.forEach.call(document.querySelectorAll('.brand-sub'), function (el) {
      el.textContent = el.textContent.replace(/Madrid/, zona);
    });

    // Hero wordmarks split the brand into per-word or per-letter spans for their animation
    var hero = null;
    function keepFirst(spans) {
      if (!spans.length) return null;
      spans[0].textContent = name;
      for (var i = 1; i < spans.length; i++) spans[i].parentNode.removeChild(spans[i]);
      return spans[0];
    }
    if (page === 'churreria') hero = keepFirst(document.querySelectorAll('#h1 .wm .w'));
    else if (page === 'restaurante-clasico') hero = keepFirst(document.querySelectorAll('#wm .w'));
    else if (page === 'cerveceria') hero = keepFirst(document.querySelectorAll('#pour > span:not(.sr)'));
    else if (page === 'restaurante-bar') {
      hero = keepFirst(document.querySelectorAll('h1 > .w'));
      if (hero) { var inner = document.createElement('span'); inner.textContent = name; hero.textContent = ''; hero.appendChild(inner); }
    } else if (page === 'restaurante-moderno') {
      var word = document.getElementById('word');
      if (word) {
        word.innerHTML = '';
        Array.prototype.forEach.call(name, function (ch, i) {
          var s = document.createElement('span');
          s.className = 'ch'; s.style.setProperty('--i', i); s.setAttribute('aria-hidden', 'true');
          s.textContent = ch === ' ' ? ' ' : ch;
          word.appendChild(s);
        });
        hero = word;
      }
    }
    Array.prototype.forEach.call(document.querySelectorAll('h1[aria-label]'), function (h) { h.setAttribute('aria-label', name); });

    // Real names are often longer than the demo brand: shrink each logo until it fits on phones
    var swapped = Array.prototype.filter.call(document.querySelectorAll('.logo, .logo-giant, .brand-name, .brand-title, .fbrand, .brand > b, a.brand, span.brand'),
      function (el) { return fold(el.textContent).indexOf(fold(name)) !== -1; });
    if (hero) swapped.push(hero.closest('h1') || hero);
    function fits(el) {
      var r = el.getBoundingClientRect(), W = document.documentElement.clientWidth;
      return !r.width || (r.right <= W - 4 && r.left >= 0 && el.scrollWidth <= el.clientWidth + 1 && document.documentElement.scrollWidth <= W);
    }
    function fit() {
      swapped.forEach(function (el) {
        el.style.fontSize = '';
        el.style.whiteSpace = '';
        for (var i = 0; i < 8 && !fits(el); i++) {
          var size = parseFloat(getComputedStyle(el).fontSize) * 0.88;
          if (size < 13) break; // below this, wrapping onto two lines reads better than shrinking
          el.style.fontSize = size + 'px';
        }
        if (!fits(el)) { el.style.whiteSpace = 'normal'; el.style.overflowWrap = 'anywhere'; el.style.lineHeight = '1.05'; }
      });
    }
    fit();
    var t;
    addEventListener('resize', function () { clearTimeout(t); t = setTimeout(fit, 150); });
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(fit);

    // 3. Tab title: "<Name> · <what the demo is>" with the city swapped in
    var parts = document.title.split(/\s[·|]\s/);
    var what = (parts[1] || parts[0]).replace(/ en [^,]+, Madrid$| en Madrid$/, zona ? ' en ' + zona : ' en Madrid');
    document.title = name + ' · ' + what;
    var robots = document.createElement('meta');
    robots.name = 'robots'; robots.content = 'noindex,nofollow';
    document.head.appendChild(robots);

    // 4. Concept banner (required on every personalised page)
    var bar = document.createElement('div');
    bar.setAttribute('role', 'note');
    var where = zona && fold(name).indexOf(fold(zona)) === -1 ? ' (' + zona + ')' : '';
    bar.textContent = 'Propuesta de diseño para ' + name + where + ' · concepto, no es la web oficial';
    bar.style.cssText = 'position:relative;z-index:2147483000;background:#0b0b0d;color:#e8e8ec;font:500 13px/1.4 system-ui,-apple-system,Segoe UI,sans-serif;text-align:center;padding:8px 16px;letter-spacing:.01em';
    document.body.insertBefore(bar, document.body.firstChild);

    // Fixed headers would sit on top of the banner: start them below it and let them slide up as you scroll
    var pinned = Array.prototype.filter.call(document.querySelectorAll('body *'), function (el) {
      if (el === bar) return false;
      var cs = getComputedStyle(el);
      return cs.position === 'fixed' && parseFloat(cs.top) === 0 && el.getBoundingClientRect().height < 220 && cs.bottom !== '0px';
    });
    function place() {
      var h = bar.offsetHeight, y = Math.max(0, h - (window.scrollY || 0));
      pinned.forEach(function (el) { el.style.setProperty('top', y + 'px', 'important'); });
    }
    place();
    addEventListener('scroll', place, { passive: true });
    addEventListener('resize', place);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run); else run();
})();
