/* Shared chrome for the public pages: header, footer, entrances, toast. */
(function () {
  'use strict';
  document.documentElement.classList.add('js');
  var page = document.body.getAttribute('data-page') || '';
  var user = RW.session();

  var TAG_ICON = '<svg viewBox="0 0 22 30" aria-hidden="true"><path fill="currentColor" fill-rule="evenodd" d="M6 0h10l6 6v24H0V6Zm5 5.5a2.5 2.5 0 1 0 0 5a2.5 2.5 0 0 0 0-5Z"/></svg>';

  var head = document.querySelector('[data-head]');
  if (head) {
    var acct = user
      ? '<a class="cart-link" href="' + (user.role === 'admin' ? 'admin.html' : 'account.html') + '">' + RW.esc(user.name.split(' ')[0]) + (user.role === 'admin' ? ' · Admin' : '') + '</a>'
      : '<a class="cart-link" href="login.html">Log in</a>';
    head.outerHTML =
      '<a class="skip" href="#main">Skip to content</a>' +
      '<header class="site-head">' +
      '<a class="wordmark" href="index.html" aria-label="ReWear home">' + TAG_ICON + 'ReWear</a>' +
      '<button class="menu-btn" aria-expanded="false" aria-controls="site-nav">Menu</button>' +
      '<nav class="site-nav" id="site-nav" aria-label="Main">' +
      link('index.html#how', 'How it works', '') +
      link('shop.html', 'The Rack', 'shop') +
      link('index.html#drives', 'Campaigns', '') +
      link('index.html#track', 'Track a tag', '') +
      link('donate.html#money', 'Give money', '') +
      '</nav>' +
      '<div class="head-actions">' +
      '<a class="cart-link" href="shop.html#basket" aria-label="Basket"><span class="bk">Basket</span><span class="cart-count" data-cart-count>0</span></a>' +
      acct +
      '<a class="btn small" href="donate.html">Donate clothes</a>' +
      '</div></header>';
  }
  function link(href, text, key) {
    return '<a href="' + href + '"' + (key && key === page ? ' aria-current="page"' : '') + '>' + text + '</a>';
  }

  var foot = document.querySelector('[data-foot]');
  if (foot) {
    foot.outerHTML =
      '<footer class="site-foot">' + mark() +
      '<div class="foot-cols">' +
      '<div><h3>Give</h3><ul><li><a href="donate.html">Donate clothes</a></li><li><a href="donate.html#money">Give money</a></li><li><a href="index.html#drives">Seasonal drives</a></li></ul></div>' +
      '<div><h3>Find clothes</h3><ul><li><a href="shop.html">The Rack</a></li><li><a href="shop.html?mode=free">Free for families</a></li><li><a href="shop.html?mode=outlet">Second-hand outlet</a></li></ul></div>' +
      '<div><h3>Follow it</h3><ul><li><a href="index.html#track">Track a tag</a></li><li><a href="account.html">My account</a></li><li><a href="login.html">Log in</a></li></ul></div>' +
      '<div><h3>The project</h3><ul><li><a href="index.html#learned">What we learned</a></li><li><a href="index.html#faq">Questions</a></li><li><a href="admin.html">Admin panel</a></li></ul></div>' +
      '<div><h3>Drop-off hubs</h3><ul><li>Kreuzberg hub, Mon to Sat 10:00 to 18:00</li><li>Neukölln hub, Tue to Sat 12:00 to 19:00</li><li>Wedding hub, Thu and Fri 14:00 to 19:00</li></ul></div>' +
      '</div>' +
      '<p class="credits">Photographs: “Second hand clothes, Prague” by MAKY.OREL, CC BY-SA 4.0; “Clothes rack” by UNIFORM Studio, CC BY 2.0; “Second hand clothes at Sabon Tasha market, Kaduna” by Ishaku Babe, CC BY 4.0; “Second-hand clothes for sale” by Matthew Paul Argall, CC BY 2.0; “Mtumba clothes” by Nasirumbi, CC BY-SA 4.0; all via Wikimedia Commons. Photographs of the rack, sorting, hand-over, outlet shelf and clothing drive, the garment cut-outs and both video loops are AI-generated illustrations made with fal.ai, not real ReWear people or places. Garment drawings by the ReWear team.</p>' +
      '<div class="foot-last"><span>ReWear is a school project on social sustainability, 2026. All figures and accounts on this site are demo data.</span>' +
      '<a class="btn small" href="#top" data-top>Back to top</a></div>' +
      '</footer>';
  }
  function mark() {
    // REWEAR built from blocks of different heights, letters knocked out
    var letters = 'REWEAR'.split('');
    var hs = [100, 78, 92, 66, 86, 100];
    var cols = ['#f4d96c', '#e2ebdd', '#f4d96c', '#8fbcd9', '#e2ebdd', '#f4d96c'];
    var w = 196, g = 6, H = 260, out = '';
    letters.forEach(function (l, i) {
      var h = H * hs[i] / 100, x = i * (w + g), y = H - h;
      out += '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" fill="' + cols[i] + '"/>' +
        '<text x="' + (x + w / 2) + '" y="' + (H - 26) + '" text-anchor="middle" font-family="Schibsted Grotesk, sans-serif" font-weight="800" font-size="190" letter-spacing="-8" fill="#1a4429">' + l + '</text>';
    });
    return '<svg class="foot-mark" viewBox="0 0 ' + (6 * w + 5 * g) + ' ' + H + '" role="img" aria-label="ReWear">' + out + '</svg>';
  }

  var btn = document.querySelector('.menu-btn');
  if (btn) btn.addEventListener('click', function () {
    var nav = document.getElementById('site-nav');
    var open = nav.classList.toggle('open');
    btn.setAttribute('aria-expanded', open);
    btn.textContent = open ? 'Close' : 'Menu';
  });
  document.addEventListener('click', function (e) {
    var t = e.target.closest('[data-top]');
    if (t) { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }); }
  });

  function cartCount() {
    var el = document.querySelector('[data-cart-count]');
    if (el) el.textContent = RW.cart().length;
  }
  cartCount();
  RW.on(cartCount);

  /* entrances: parts of each section rise in reading order, once */
  window.RWreveal = function (root) {
    var els = (root || document).querySelectorAll('.rise:not(.in)');
    if (!('IntersectionObserver' in window)) { els.forEach(function (el) { el.classList.add('in'); }); return; }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); } });
    }, { rootMargin: '0px 0px -8% 0px' });
    els.forEach(function (el) { io.observe(el); });
  };
  window.addEventListener('DOMContentLoaded', function () { RWreveal(); });
  if (document.readyState !== 'loading') RWreveal();

  var toastEl;
  window.RWtoast = function (msg) {
    if (!toastEl) { toastEl = document.createElement('div'); toastEl.className = 'toast'; toastEl.setAttribute('role', 'status'); document.body.appendChild(toastEl); }
    toastEl.textContent = msg;
    toastEl.classList.add('show');
    clearTimeout(toastEl._t);
    toastEl._t = setTimeout(function () { toastEl.classList.remove('show'); }, 3600);
  };
})();
