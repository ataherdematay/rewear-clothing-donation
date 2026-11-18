/* Home page behaviour. */
(function () {
  'use strict';
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var esc = RW.esc;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* barcode band on the hero tag: bars from the letters of "REWEAR" */
  var bc = $('[data-barcode]');
  if (bc) {
    var widths = [6, 3, 9, 3, 4, 12, 3, 6, 3, 8, 4, 3, 10, 5, 3, 7, 3, 4, 9, 3, 6, 12, 3, 5, 3, 8, 6, 3, 4, 10, 3, 6, 9, 3, 5, 4, 3, 8];
    bc.innerHTML = widths.map(function (w, i) { return '<i style="width:' + w + 'px;margin-right:' + (i % 3 === 0 ? 6 : 4) + 'px"></i>'; }).join('');
  }

  /* signature move: the hero photograph crossfades slowly */
  var imgs = document.querySelectorAll('.hero-photo .slide');
  var caps = ['Every donated coat carries its own tag', 'Volunteers sort by size and season', 'Handed over to a family that needs it'];
  if (reduce) document.querySelectorAll('video').forEach(function (v) { v.removeAttribute('autoplay'); v.pause(); });
  if (imgs.length > 1 && !reduce) {
    var cur = 0, timer;
    var step = function () {
      imgs[cur].classList.remove('on');
      cur = (cur + 1) % imgs.length;
      imgs[cur].classList.add('on');
      $('[data-caption]').textContent = caps[cur];
    };
    var start = function () { timer = setInterval(step, 5600); };
    start();
    document.addEventListener('visibilitychange', function () { clearInterval(timer); if (!document.hidden) start(); });
  }

  /* the rack: one garment of each kind, chosen from the live data */
  var list = $('[data-rack-list]');
  var picks = [];
  function choosePicks() {
    var seen = {}; picks = [];
    var rank = { delivered: 0, matched: 1, sorted: 2, received: 3, recycled: 4 };
    var photo = ['coat', 'blazer', 'dress', 'jeans'];
    var pool = RW.db.garments.slice().sort(function (a, b) {
      var pa = photo.indexOf(a.type) > -1 ? photo.indexOf(a.type) : 9, pb = photo.indexOf(b.type) > -1 ? photo.indexOf(b.type) : 9;
      return pa - pb || rank[a.status] - rank[b.status];
    });
    pool.forEach(function (g) { if (!seen[g.type] && picks.length < 6) { seen[g.type] = 1; picks.push(g.tag); } });
  }
  var STEPS = [
    { s: 'received', name: 'Donated' },
    { s: 'sorted', name: 'Sorted' },
    { s: 'matched', name: 'Matched' },
    { s: 'delivered', name: 'Handed over' }
  ];
  function showTag(tag, fromForm) {
    var t = RW.track(tag);
    if (!t) return false;
    var g = t.garment;
    list.querySelectorAll('button').forEach(function (b) { b.setAttribute('aria-pressed', b.dataset.tag === g.tag ? 'true' : 'false'); });
    var glyphBox = $('[data-glyph]');
    var old = glyphBox.querySelector('.glyph');
    var paint = function () {
      glyphBox.innerHTML = RWcutout(g.type, RW.TYPES[g.type].name) || RWglyph(g.type, g.colour === '#f4d96c' ? '#e8794a' : g.colour, RW.label(g));
      $('[data-code]').textContent = g.tag;
    };
    if (old && !reduce) { old.classList.add('swap'); setTimeout(paint, 220); } else paint();
    $('[data-big-tag]').style.backgroundColor = g.status === 'delivered' ? 'var(--accent)' : g.status === 'recycled' ? 'var(--muted)' : g.status === 'received' ? 'var(--paper)' : 'var(--sky)';
    $('[data-fact-title]').textContent = (RWcutout(g.type) ? RW.TYPES[g.type].name : RW.label(g)) + ', size ' + g.size;
    $('[data-fact]').innerHTML =
      '<dt>Season</dt><dd>' + esc(g.season) + '</dd>' +
      '<dt>Condition</dt><dd>' + esc(g.condition) + '</dd>' +
      '<dt>For</dt><dd>' + esc(g.gender) + '</dd>' +
      (g.mode === 'outlet' && g.price ? '<dt>Outlet price</dt><dd>' + RW.euro(g.price) + '</dd>' : '') +
      '<dt>Donation</dt><dd>' + esc(t.donation ? t.donation.id + ', ' + RW.date(t.donation.date) : 'unknown') + '</dd>';
    var j = $('[data-journey]');
    if (g.status === 'recycled') {
      j.innerHTML = g.events.map(function (e) { return '<li><b>' + (e.s === 'received' ? 'Donated' : 'Recycled') + '</b><span>' + RW.date(e.at) + ', ' + esc(e.note) + '</span></li>'; }).join('');
    } else {
      j.innerHTML = STEPS.map(function (st) {
        var ev = g.events.filter(function (e) { return e.s === st.s; }).pop();
        return '<li class="' + (ev ? '' : 'todo') + '"><b>' + st.name + '</b><span>' + (ev ? RW.date(ev.at) + ', ' + esc(ev.note) : 'Not yet') + '</span></li>';
      }).join('');
    }
    if (fromForm) $('[data-track-msg]').textContent = 'Showing ' + g.tag + '.';
    return true;
  }
  function renderRack() {
    choosePicks();
    list.innerHTML = picks.map(function (tag) {
      var g = RW.garment(tag);
      return '<li><button type="button" aria-pressed="false" data-tag="' + g.tag + '">' + esc(RW.TYPES[g.type].name) + '</button></li>';
    }).join('');
    var pressed = list.querySelector('[aria-pressed="true"]');
    showTag(pressed ? pressed.dataset.tag : picks[0]);
  }
  if (list) {
    renderRack();
    list.addEventListener('click', function (e) {
      var b = e.target.closest('button[data-tag]');
      if (b) { showTag(b.dataset.tag); $('[data-track-msg]').textContent = ''; }
    });
    var param = new URLSearchParams(location.search).get('tag');
    if (param) showTag(param, true);
    $('[data-track-form]').addEventListener('submit', function (e) {
      e.preventDefault();
      var code = this.code.value;
      if (!code.trim()) { $('[data-track-msg]').textContent = 'Type the code printed on your donation receipt, for example RW-2412.'; return; }
      if (!showTag(code, true)) $('[data-track-msg]').textContent = 'No garment carries the code “' + code.trim() + '”. Check the receipt and try again.';
    });
  }

  /* stats count up once */
  function setStats(animate) {
    var s = RW.stats();
    document.querySelectorAll('[data-count]').forEach(function (el) {
      var to = s[el.dataset.count];
      if (!animate || reduce) { el.textContent = to; return; }
      var t0 = null;
      var tick = function (t) {
        if (!t0) t0 = t;
        var p = Math.min(1, (t - t0) / 1400);
        el.textContent = Math.round(to * (1 - Math.pow(1 - p, 4)));
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });
  }
  var statsEl = $('.stats');
  if (statsEl && 'IntersectionObserver' in window) {
    setStats(false);
    var so = new IntersectionObserver(function (en) { if (en[0].isIntersecting) { setStats(true); so.disconnect(); } }, { threshold: 0.3 });
    so.observe(statsEl);
  } else setStats(false);

  /* outlet preview: two categories from live data */
  function renderOutlet() {
    var el = $('[data-outlet]');
    var rack = RW.rack('outlet');
    var adults = rack.filter(function (g) { return g.gender !== 'kids'; });
    var kids = rack.filter(function (g) { return g.gender === 'kids'; });
    var n = function (l) { return l.length + (l.length === 1 ? ' piece' : ' pieces'); };
    var item = function (g) {
      return '<li class="item rise"><div class="thumb tag">' + RWglyph(g.type, g.colour, RW.label(g)) + '</div><div>' +
        '<div class="row"><span>' + esc(RW.label(g)) + '</span><span>' + RW.euro(g.price) + '</span></div>' +
        '<p>Size ' + esc(g.size) + ', for ' + esc(g.gender) + ', ' + esc(g.condition) + '. Tag ' + g.tag + '.</p>' +
        (g.condition === 'like new' ? '<p class="note">Like new</p>' : '') + '</div></li>';
    };
    el.innerHTML =
      '<div class="cat"><div class="cat-head"><h3>Grown-ups</h3><span>' + n(adults) + '</span></div><ul class="items">' + adults.slice(0, 6).map(item).join('') + '</ul></div>' +
      '<div class="cat"><div class="cat-head"><h3>Children</h3><span>' + n(kids) + '</span></div><ul class="items">' + kids.slice(0, 6).map(item).join('') + '</ul></div>';
    RWreveal(el);
  }
  renderOutlet();

  /* seasonal drives */
  function renderDrives() {
    var el = $('[data-drives]');
    el.innerHTML = RW.db.campaigns.map(function (c0) {
      var c = RW.campaign(c0.id);
      var pct = Math.min(100, Math.round(c.items / c.goal * 100));
      return '<article class="drive tag rise' + (c.active ? '' : ' closed') + '">' +
        '<h3>' + esc(c.name) + '</h3>' +
        '<div class="meta"><span>' + (c.active ? 'Collecting until ' + RW.dateLong(c.ends) : 'Opens again in spring') + '</span><span>' + RW.euro(c.raised) + ' of ' + RW.euro(c.cashGoal) + ' raised</span></div>' +
        '<p>' + esc(c.blurb) + '</p>' +
        '<div class="bar" role="img" aria-label="' + c.items + ' of ' + c.goal + ' garments collected"><i data-w="' + pct + '"></i><span>' + c.items + ' of ' + c.goal + ' garments</span></div>' +
        (c.active ? '<div class="row"><a class="btn small" href="donate.html?drive=' + c.id + '">Give to this drive</a><a class="link" href="shop.html?season=' + (c.id === 'winter' ? 'winter' : '') + '">See what has come in</a></div>' : '') +
        '</article>';
    }).join('');
    RWreveal(el);
    var bars = el.querySelectorAll('.bar i');
    if ('IntersectionObserver' in window) {
      var bo = new IntersectionObserver(function (ens) { ens.forEach(function (en) { if (en.isIntersecting) { en.target.style.width = en.target.dataset.w + '%'; bo.unobserve(en.target); } }); }, { threshold: .4 });
      bars.forEach(function (b) { bo.observe(b); });
    } else bars.forEach(function (b) { b.style.width = b.dataset.w + '%'; });
  }
  renderDrives();

  /* faq drawer */
  var FAQ = [
    ['Giving', 'What clothes can I donate?', 'Clean clothes that someone could wear tomorrow: no holes, no stains, zips and buttons working. Shoes in pairs. Underwear and socks only when new. If something is too worn, we send it to textile recycling and the tag says so.'],
    ['Families', 'Who can request free clothes?', 'Households with a low income: families, single parents, students, refugees and older people. Register as a family, a volunteer checks your details once, and then you can request what fits from the free rack.'],
    ['Tracking', 'How do I follow my donation?', 'When you register a donation, each garment gets a tag code such as RW-2412. Type it into the tracker on this page to see when it was sorted, matched and handed over. Families stay anonymous: you see the district, never a name.'],
    ['Outlet', 'Why do you sell some of the clothes?', 'Clothes that no family has requested within a few weeks go to the second-hand outlet at small prices. The money pays for storage, hangers and transport, which is what makes clothing banks expensive to run.'],
    ['Money', 'Where does a cash gift go?', 'You choose: a seasonal drive such as winter coats, or the general fund. Each drive shows how much has been raised and what it is for.'],
    ['Pick-up', 'Can you collect from my home?', 'Yes, for five garments or more inside the city. Choose pick-up when you register a donation and pick a day.']
  ];
  var drawer = $('[data-faq]');
  if (drawer) {
    drawer.innerHTML = FAQ.map(function (f, i) {
      return '<div class="card' + (i === 0 ? ' open' : '') + '" style="--i:' + i + '">' +
        '<button type="button" aria-expanded="' + (i === 0) + '" aria-controls="faq-' + i + '"><span class="tab">' + f[0] + '</span><span class="q">' + f[1] + '</span></button>' +
        '<div class="a" id="faq-' + i + '"><div><p>' + f[2] + '</p></div></div></div>';
    }).join('');
    drawer.addEventListener('click', function (e) {
      var b = e.target.closest('button'); if (!b) return;
      var card = b.parentNode;
      var wasOpen = card.classList.contains('open');
      drawer.querySelectorAll('.card').forEach(function (c) { c.classList.remove('open'); c.querySelector('button').setAttribute('aria-expanded', 'false'); });
      if (!wasOpen) { card.classList.add('open'); b.setAttribute('aria-expanded', 'true'); }
    });
  }

  /* give money amount */
  var amts = $('[data-amounts]');
  if (amts) amts.addEventListener('click', function (e) {
    var b = e.target.closest('button'); if (!b) return;
    amts.querySelectorAll('button').forEach(function (x) { x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); });
    var a = +b.dataset.amt;
    var give = $('[data-give]');
    give.textContent = 'Give €' + a;
    give.href = 'donate.html?amount=' + a + '#money';
    $('[data-give-note]').textContent = '€' + a + ' sorts and hangs about ' + a * 2 + ' garments.';
  });

  RW.on(function () { renderRack(); renderOutlet(); renderDrives(); setStats(false); });
  if (location.hash.length > 1) { var target = document.getElementById(location.hash.slice(1)); if (target) setTimeout(function () { target.scrollIntoView(); }, 80); }
})();
