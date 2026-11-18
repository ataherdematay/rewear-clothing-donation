/* The Rack: browse, filter, reserve from the outlet, request for free. */
(function () {
  'use strict';
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var esc = RW.esc;
  var params = new URLSearchParams(location.search);
  var state = { mode: params.get('mode') || '', q: '', type: '', size: '', season: params.get('season') || '', gender: '', condition: '' };
  var form = $('[data-filters]');
  var lastFocus = null;

  // fill selects
  var typeSel = $('#f-type');
  Object.keys(RW.TYPES).forEach(function (k) { typeSel.insertAdjacentHTML('beforeend', '<option value="' + k + '">' + RW.TYPES[k].name + '</option>'); });
  var sizeSel = $('#f-size');
  sizeSel.insertAdjacentHTML('beforeend', '<optgroup label="Adults">' + RW.ADULT.map(function (s) { return '<option>' + s + '</option>'; }).join('') + '</optgroup>');
  sizeSel.insertAdjacentHTML('beforeend', '<optgroup label="Children (cm)">' + RW.KID.map(function (s) { return '<option>' + s + '</option>'; }).join('') + '</optgroup>');
  form.season.value = state.season;

  function setMode(m) {
    state.mode = m;
    document.querySelectorAll('[data-modes] button').forEach(function (b) { b.setAttribute('aria-selected', b.dataset.mode === m ? 'true' : 'false'); });
    render();
  }
  $('[data-modes]').addEventListener('click', function (e) { var b = e.target.closest('button'); if (b) setMode(b.dataset.mode); });
  form.addEventListener('input', function () {
    ['q', 'type', 'size', 'season', 'gender', 'condition'].forEach(function (k) { state[k] = form[k].value; });
    render();
  });
  form.addEventListener('submit', function (e) { e.preventDefault(); });
  $('[data-clear]').addEventListener('click', function () {
    form.reset(); ['q', 'type', 'size', 'season', 'gender', 'condition'].forEach(function (k) { state[k] = ''; }); render();
  });

  function list() {
    var q = state.q.trim().toLowerCase();
    return RW.rack(state.mode).filter(function (g) {
      if (state.type && g.type !== state.type) return false;
      if (state.size && g.size !== state.size) return false;
      if (state.season && g.season !== state.season) return false;
      if (state.gender && g.gender !== state.gender) return false;
      if (state.condition && g.condition !== state.condition) return false;
      if (q && (RW.label(g) + ' ' + g.tag + ' ' + g.size + ' ' + g.gender).toLowerCase().indexOf(q) === -1) return false;
      return true;
    }).sort(function (a, b) { return Date.parse(b.events[b.events.length - 1].at) - Date.parse(a.events[a.events.length - 1].at); });
  }

  function render() {
    var items = list();
    var cart = RW.cart();
    $('[data-count]').textContent = items.length + (items.length === 1 ? ' garment' : ' garments') + (state.mode === 'free' ? ' free for families' : state.mode === 'outlet' ? ' in the outlet' : ' on the rack');
    $('[data-empty]').hidden = items.length > 0;
    $('[data-grid]').innerHTML = items.map(function (g, i) {
      var inCart = cart.indexOf(g.tag) > -1;
      return '<li class="g-card rise" style="--d:' + (i % 6) + '">' +
        '<button type="button" class="g-open" data-open="' + g.tag + '" aria-label="' + esc(RW.label(g)) + ', size ' + esc(g.size) + ', details">' +
        '<span class="g-tag tag" style="--tone:' + (g.mode === 'free' ? 'var(--paper)' : 'var(--surface-2)') + '"><span class="dot" aria-hidden="true"></span>' + RWglyph(g.type, g.colour, '') + '</span></button>' +
        '<div class="g-info"><h3>' + esc(RW.label(g)) + '</h3>' +
        '<p>Size ' + esc(g.size) + ' · ' + esc(g.gender) + ' · ' + esc(g.condition) + '</p>' +
        '<div class="g-row"><span class="price">' + (g.mode === 'free' ? 'Free for families' : RW.euro(g.price)) + '</span>' +
        (g.mode === 'outlet' ? '<button type="button" class="mini' + (inCart ? ' on' : '') + '" data-cart="' + g.tag + '">' + (inCart ? 'In basket' : 'Reserve') + '</button>'
          : '<button type="button" class="mini" data-request="' + g.tag + '">Request</button>') +
        '</div></div></li>';
    }).join('');
    RWreveal($('[data-grid]'));
  }

  /* sheets */
  function openSheet(sel) {
    lastFocus = document.activeElement;
    var s = $(sel); s.hidden = false;
    requestAnimationFrame(function () { s.classList.add('open'); var c = s.querySelector('.close'); if (c) c.focus(); });
  }
  function closeSheets() {
    document.querySelectorAll('.sheet.open').forEach(function (s) { s.classList.remove('open'); setTimeout(function () { s.hidden = true; }, 350); });
    if (lastFocus) lastFocus.focus();
  }
  document.addEventListener('click', function (e) { if (e.target.closest('[data-close]')) closeSheets(); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeSheets(); });

  function detail(tag) {
    var t = RW.track(tag); if (!t) return;
    var g = t.garment;
    var inCart = RW.cart().indexOf(g.tag) > -1;
    $('[data-sheet-body]').innerHTML =
      '<div class="detail-tag tag">' + RWglyph(g.type, g.colour, RW.label(g)) + '<span>' + g.tag + '</span></div>' +
      '<h2 id="sheet-title">' + esc(RW.label(g)) + '</h2>' +
      '<p class="price-big">' + (g.mode === 'free' ? 'Free for registered families' : RW.euro(g.price) + ', paid at pick-up') + '</p>' +
      '<dl class="facts"><dt>Size</dt><dd>' + esc(g.size) + '</dd><dt>For</dt><dd>' + esc(g.gender) + '</dd><dt>Season</dt><dd>' + esc(g.season) + '</dd><dt>Condition</dt><dd>' + esc(g.condition) + '</dd><dt>Donated</dt><dd>' + RW.dateLong(t.donation.date) + ' at the ' + esc(t.donation.hub) + '</dd></dl>' +
      '<ol class="journey">' + g.events.map(function (e) { return '<li><b>' + ({ received: 'Donated', sorted: 'Sorted', matched: 'Matched', delivered: 'Handed over', recycled: 'Recycled' })[e.s] + '</b><span>' + RW.date(e.at) + ', ' + esc(e.note) + '</span></li>'; }).join('') + '</ol>' +
      '<div class="sheet-actions">' +
      (g.status !== 'sorted' ? '<p>This garment has just been taken.</p>' : g.mode === 'outlet'
        ? '<button class="btn" type="button" data-cart="' + g.tag + '">' + (inCart ? 'Remove from basket' : 'Reserve for pick-up') + '</button>'
        : '<button class="btn" type="button" data-request="' + g.tag + '">Request this for free</button>') +
      '</div>';
    openSheet('[data-sheet]');
  }

  function toggleCart(tag) {
    var c = RW.cart(); var i = c.indexOf(tag);
    if (i > -1) { c.splice(i, 1); RWtoast(tag + ' taken out of your basket.'); }
    else { c.push(tag); RWtoast(RW.label(RW.garment(tag)) + ' reserved in your basket.'); }
    RW.setCart(c);
  }

  function request(tag) {
    var u = RW.session();
    var body = $('[data-sheet-body]');
    if (!u || u.role !== 'family') {
      body.innerHTML = '<h2 id="sheet-title">Free clothes are for registered families</h2><p class="sheet-text">Log in with a family account to request this garment. If you do not have one yet, registering takes two minutes and a volunteer checks it once.</p><div class="sheet-actions"><a class="btn" href="login.html?role=family&next=shop.html">Log in or register</a></div><p class="sheet-text small muted">Demo account: family@rewear.org, password family123</p>';
      if (!$('[data-sheet]').classList.contains('open')) openSheet('[data-sheet]');
      return;
    }
    if (!u.verified) {
      body.innerHTML = '<h2 id="sheet-title">Your account is waiting for a check</h2><p class="sheet-text">A volunteer verifies each household once, usually within two days. You can request clothes as soon as that is done.</p>';
      if (!$('[data-sheet]').classList.contains('open')) openSheet('[data-sheet]');
      return;
    }
    var made = RW.requestFree([tag], u);
    body.innerHTML = '<h2 id="sheet-title">Requested</h2><p class="sheet-text">' + esc(RW.label(RW.garment(tag))) + ' is set aside for you under request ' + made[0].id + '. A volunteer will confirm a pick-up time at your hub. You can follow it in your account.</p><div class="sheet-actions"><a class="btn" href="account.html">Open my account</a></div>';
    if (!$('[data-sheet]').classList.contains('open')) openSheet('[data-sheet]');
  }

  function basket() {
    var tags = RW.cart().filter(function (t) { var g = RW.garment(t); return g && g.status === 'sorted'; });
    var u = RW.session();
    var total = tags.reduce(function (s, t) { return s + (RW.garment(t).price || 0); }, 0);
    var b = $('[data-basket-body]');
    if (!tags.length) {
      b.innerHTML = '<h2 id="basket-title">Your basket is empty</h2><p class="sheet-text">Reserve outlet clothes and collect them at a hub. You pay when you pick them up.</p><div class="sheet-actions"><button class="btn" type="button" data-close>Browse the outlet</button></div>';
      return;
    }
    b.innerHTML = '<h2 id="basket-title">Your basket</h2>' +
      '<ul class="basket">' + tags.map(function (t) { var g = RW.garment(t); return '<li><span class="b-thumb tag">' + RWglyph(g.type, g.colour, '') + '</span><span><b>' + esc(RW.label(g)) + '</b><br><span class="muted small">Size ' + esc(g.size) + ' · ' + g.tag + '</span></span><span>' + RW.euro(g.price) + '</span><button type="button" class="link-btn" data-cart="' + t + '" aria-label="Remove ' + esc(RW.label(g)) + '">Remove</button></li>'; }).join('') + '</ul>' +
      '<p class="basket-total"><span>To pay at pick-up</span><b>' + RW.euro(total) + '</b></p>' +
      '<form class="stack" data-reserve novalidate>' +
      '<div class="field"><label for="b-name">Your name</label><input id="b-name" name="name" required autocomplete="name" value="' + esc(u ? u.name : '') + '"></div>' +
      '<div class="field"><label for="b-email">Email for the pick-up code</label><input id="b-email" name="email" type="email" required autocomplete="email" value="' + esc(u ? u.email : '') + '"></div>' +
      '<div class="field"><label for="b-hub">Collect at</label><select id="b-hub" name="hub">' + RW.HUBS.slice(0, 3).map(function (h) { return '<option>' + h + '</option>'; }).join('') + '</select></div>' +
      '<p class="field err" data-err role="alert"></p>' +
      '<button class="btn" type="submit">Reserve ' + tags.length + (tags.length === 1 ? ' piece' : ' pieces') + '</button>' +
      '<p class="small muted">Nothing is charged online. Reservations are held for five days.</p></form>';
    $('[data-reserve]').addEventListener('submit', function (e) {
      e.preventDefault();
      var f = e.target;
      if (!f.name.value.trim()) { $('[data-err]').textContent = 'Add your name so the hub knows whom to give the clothes to.'; f.name.focus(); return; }
      if (!/^\S+@\S+\.\S+$/.test(f.email.value)) { $('[data-err]').textContent = 'Add an email address like name@example.org for your pick-up code.'; f.email.focus(); return; }
      var o = RW.reserve(tags, { name: f.name.value.trim(), userId: u && u.id, hub: f.hub.value });
      RW.setCart([]);
      b.innerHTML = '<h2 id="basket-title">Reserved</h2><p class="sheet-text">Order ' + o.id + ' waits for you at the ' + esc(f.hub.value) + '. Bring ' + RW.euro(o.total) + ' and show this code: <b>' + o.id + '</b>.</p><p class="sheet-text">Each tag in the order now shows that it was bought, so the donors can see where it went.</p><div class="sheet-actions"><button class="btn" type="button" data-close>Back to the rack</button></div>';
      render();
    });
  }

  function need() {
    var u = RW.session();
    var b = $('[data-need-body]');
    if (!u || u.role !== 'family') {
      b.innerHTML = '<h2 id="need-title">Posting a need is for families</h2><p class="sheet-text">Log in with a family account to tell us what you are looking for.</p><div class="sheet-actions"><a class="btn" href="login.html?role=family&next=shop.html">Log in or register</a></div><p class="sheet-text small muted">Demo account: family@rewear.org, password family123</p>';
      return;
    }
    b.innerHTML = '<h2 id="need-title">What are you looking for?</h2>' +
      '<form class="stack" data-need-form>' +
      '<div class="field"><label for="n-type">Garment</label><select id="n-type" name="type">' + Object.keys(RW.TYPES).map(function (k) { return '<option value="' + k + '">' + RW.TYPES[k].name + '</option>'; }).join('') + '</select></div>' +
      '<div class="field"><label for="n-size">Size</label><select id="n-size" name="size">' + RW.KID.concat(RW.ADULT).map(function (s) { return '<option>' + s + '</option>'; }).join('') + '</select></div>' +
      '<div class="field"><label for="n-season">Season</label><select id="n-season" name="season"><option value="winter">Winter</option><option value="summer">Summer</option><option value="all-year">All year</option></select></div>' +
      '<button class="btn" type="submit">Post this need</button></form>';
    $('[data-need-form]').addEventListener('submit', function (e) {
      e.preventDefault();
      var f = e.target;
      var q = RW.requestNeed({ type: f.type.value, size: f.size.value, season: f.season.value }, u);
      b.innerHTML = '<h2 id="need-title">Posted</h2><p class="sheet-text">Request ' + q.id + ': ' + esc(q.need) + '. When a matching garment is sorted, a volunteer reserves it for you and you will see it in your account.</p><div class="sheet-actions"><a class="btn" href="account.html">Open my account</a></div>';
    });
  }

  document.addEventListener('click', function (e) {
    var o = e.target.closest('[data-open]'); if (o) { detail(o.dataset.open); return; }
    var c = e.target.closest('[data-cart]'); if (c) { toggleCart(c.dataset.cart); if ($('[data-basket]').classList.contains('open')) basket(); else if ($('[data-sheet]').classList.contains('open')) detail(c.dataset.cart); return; }
    var r = e.target.closest('[data-request]'); if (r) { request(r.dataset.request); return; }
    var n = e.target.closest('[data-need-open]'); if (n) { need(); openSheet('[data-need]'); return; }
    var bl = e.target.closest('a[href="shop.html#basket"]'); if (bl) { e.preventDefault(); basket(); openSheet('[data-basket]'); }
  });

  RW.on(render);
  setMode(state.mode);
  if (location.hash === '#basket') { basket(); openSheet('[data-basket]'); }
})();
