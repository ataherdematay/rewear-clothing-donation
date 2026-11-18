/* Donate: a four-step registration that hands back a tag per garment, and a cash pledge. */
(function () {
  'use strict';
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var esc = RW.esc;
  var params = new URLSearchParams(location.search);
  var user = RW.session();
  var form = $('[data-wizard]');
  var items = [];
  var step = 0;
  var HOURS = { 'Kreuzberg hub': 'Mon to Sat, 10:00 to 18:00', 'Neukölln hub': 'Tue to Sat, 12:00 to 19:00', 'Wedding hub': 'Thu and Fri, 14:00 to 19:00', 'School drop box, Moabit': 'School days, 7:30 to 16:00' };
  var PICK = ['coat', 'jacket', 'sweater', 'tee', 'shirt', 'jeans', 'dress', 'skirt', 'blazer', 'scarf', 'beanie', 'shoes'];
  var COL = ['#e8794a', '#7fb4d8', '#d98fb5', '#9ccf8a', '#f2efe4', '#6c7fd1', '#d9a35b', '#c94f4f'];

  $('[data-pick]').innerHTML = PICK.map(function (t, i) {
    return '<button type="button" data-add="' + t + '">' + RWglyph(t, COL[i % COL.length], '') + RW.TYPES[t].name + '</button>';
  }).join('');

  function seasonOf(t) { return ['coat', 'beanie', 'scarf', 'sweater', 'jacket'].indexOf(t) > -1 ? 'winter' : ['tee', 'dress', 'skirt', 'polo'].indexOf(t) > -1 ? 'summer' : 'all-year'; }
  function sel(name, opts, val, label) {
    return '<label class="sr-only" for="' + name + '">' + label + '</label><select id="' + name + '" data-k="' + name.split('-')[0] + '">' + opts.map(function (o) { var v = Array.isArray(o) ? o[0] : o, l = Array.isArray(o) ? o[1] : o; return '<option value="' + v + '"' + (v === val ? ' selected' : '') + '>' + l + '</option>'; }).join('') + '</select>';
  }
  function renderItems() {
    var ul = $('[data-added]');
    ul.innerHTML = items.map(function (it, i) {
      return '<li data-i="' + i + '">' + RWglyph(it.type, it.colour, '') +
        '<div><span class="name">' + RW.TYPES[it.type].name + '</span><div class="grid2">' +
        sel('size-' + i, [['', 'Size']].concat(RW.ADULT, RW.KID), it.size, 'Size of ' + RW.TYPES[it.type].name) +
        sel('gender-' + i, [['women', 'Women'], ['men', 'Men'], ['unisex', 'Unisex'], ['kids', 'Kids']], it.gender, 'Who it is for') +
        sel('season-' + i, [['winter', 'Winter'], ['summer', 'Summer'], ['all-year', 'All year']], it.season, 'Season') +
        sel('condition-' + i, [['like new', 'Like new'], ['good', 'Good'], ['worn', 'Worn']], it.condition, 'Condition') +
        '</div></div><button type="button" class="link-btn" data-remove="' + i + '">Remove</button></li>';
    }).join('');
    $('[data-total]').textContent = items.length ? items.length + (items.length === 1 ? ' garment' : ' garments') + ' added' : 'Nothing added yet';
  }
  $('[data-pick]').addEventListener('click', function (e) {
    var b = e.target.closest('[data-add]'); if (!b) return;
    var t = b.dataset.add;
    items.push({ type: t, colour: COL[PICK.indexOf(t) % COL.length], size: '', gender: 'unisex', season: seasonOf(t), condition: 'good' });
    renderItems();
    $('[data-err0]').textContent = '';
    var last = $('[data-added] li:last-child select');
    if (last) last.focus();
  });
  $('[data-added]').addEventListener('change', function (e) {
    var li = e.target.closest('li'); if (!li) return;
    items[+li.dataset.i][e.target.dataset.k] = e.target.value;
  });
  $('[data-added]').addEventListener('click', function (e) {
    var r = e.target.closest('[data-remove]'); if (!r) return;
    items.splice(+r.dataset.remove, 1); renderItems();
  });

  var hub = $('#hub');
  hub.innerHTML = RW.HUBS.map(function (h) { return '<option>' + h + '</option>'; }).join('');
  var setHours = function () { $('[data-hub-hours]').textContent = 'Open ' + HOURS[hub.value]; };
  hub.addEventListener('change', setHours); setHours();
  form.addEventListener('change', function (e) {
    if (e.target.name === 'how') { var p = e.target.value === 'pickup'; $('[data-pickup]').hidden = !p; $('[data-drop]').hidden = p; }
  });
  var tomorrow = new Date(Date.now() + 86400000);
  $('#day').min = tomorrow.toISOString().slice(0, 10);

  if (user) { form.name.value = user.name; form.email.value = user.email; }
  var drive = params.get('drive');
  if (drive === 'school') $('[data-drive-label]').textContent = 'Count this towards the school uniform drive';
  if (drive) $('[data-drive-box]').checked = true;

  function go(n) {
    step = n;
    form.querySelectorAll('.step').forEach(function (s) { s.classList.toggle('on', +s.dataset.step === n); });
    $('[data-steps]').querySelectorAll('li').forEach(function (li, i) { li.className = i === n ? 'on' : i < n ? 'done' : ''; });
    var h = form.querySelector('.step.on h2');
    if (h) { h.setAttribute('tabindex', '-1'); h.focus({ preventScroll: true }); }
    form.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
  function validate(n) {
    if (n === 0) {
      if (!items.length) { $('[data-err0]').textContent = 'Add at least one garment by choosing it above.'; return false; }
      var missing = items.findIndex(function (it) { return !it.size; });
      if (missing > -1) { $('[data-err0]').textContent = 'Choose a size for the ' + RW.TYPES[items[missing].type].name.toLowerCase() + '.'; $('#size-' + missing).focus(); return false; }
      $('[data-err0]').textContent = '';
    }
    if (n === 1 && form.how.value === 'pickup') {
      if (items.length < 5) { $('[data-err1]').textContent = 'Pick-ups start at five garments. You have ' + items.length + '; choose a hub instead or add more.'; return false; }
      if (!form.addr.value.trim()) { $('[data-err1]').textContent = 'Add the address we should collect from.'; form.addr.focus(); return false; }
      if (!form.day.value) { $('[data-err1]').textContent = 'Choose a day for the pick-up.'; form.day.focus(); return false; }
      $('[data-err1]').textContent = '';
    }
    if (n === 2) {
      if (form.email.value && !/^\S+@\S+\.\S+$/.test(form.email.value)) { $('[data-err2]').textContent = 'That email does not look complete. Use the form name@example.org, or leave it empty.'; form.email.focus(); return false; }
      $('[data-err2]').textContent = '';
    }
    return true;
  }
  form.addEventListener('click', function (e) {
    if (e.target.closest('[data-next]')) { if (validate(step)) go(step + 1); }
    if (e.target.closest('[data-back]')) go(step - 1);
    if (e.target.closest('[data-again]')) { items = []; renderItems(); go(0); }
  });
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (!validate(2)) return;
    var pickup = form.how.value === 'pickup';
    var don = RW.donateClothes({ name: form.name.value.trim(), userId: user && user.id, hub: pickup ? form.addr.value.trim() + ' on ' + new Date(form.day.value).toLocaleDateString('en-GB', { day: 'numeric', month: 'long' }) : hub.value, pickup: pickup, items: items });
    if (form.drive.checked) don.tags.forEach(function (t) { var g = RW.garment(t); g.campaign = drive || 'winter'; });
    $('[data-receipt]').innerHTML = '<div class="receipt tag"><h3>Donation ' + don.id + '</h3><p style="margin-top:8px">' + (pickup ? 'We will collect from ' : 'Bring it to the ') + esc(don.hub) + '. Write each code on a slip of paper and pin it to the garment.</p><ul>' +
      don.tags.map(function (t) { var g = RW.garment(t); return '<li><span>' + esc(RW.TYPES[g.type].name) + ', size ' + esc(g.size) + '</span><a href="index.html?tag=' + t + '#track">' + t + '</a></li>'; }).join('') + '</ul></div>';
    go(3);
    RWtoast(don.tags.length + (don.tags.length === 1 ? ' tag' : ' tags') + ' created. Thank you.');
  });

  /* money */
  var m = $('[data-money]');
  var camp = $('#m-camp');
  RW.db.campaigns.filter(function (c) { return c.active; }).forEach(function (c) { camp.insertAdjacentHTML('beforeend', '<option value="' + c.id + '">' + c.name + ' drive</option>'); });
  if (drive) camp.value = drive;
  var amountParam = params.get('amount');
  if (amountParam) {
    var r = m.querySelector('input[name="amount"][value="' + amountParam + '"]');
    if (r) r.checked = true; else { m.querySelector('input[value="other"]').checked = true; m.other.value = amountParam; $('[data-other]').hidden = false; }
  }
  if (user) m.name.value = user.name;
  function amount() { var v = m.amount.value; return v === 'other' ? parseFloat(String(m.other.value).replace(',', '.')) : +v; }
  function impact() {
    var a = amount();
    $('[data-other]').hidden = m.amount.value !== 'other';
    if (!a || a <= 0) { $('[data-impact]').textContent = 'Type an amount to see what it pays for.'; $('[data-msubmit]').textContent = 'Pledge'; return; }
    var text = a >= 50 ? RW.euro(a) + ' rents a van for a whole collection day.' : a >= 30 ? RW.euro(a) + ' buys hangers and boxes for a new hub shelf.' : RW.euro(a) + ' sorts and hangs about ' + Math.round(a * 2) + ' garments.';
    $('[data-impact]').textContent = text + (m.monthly.checked ? ' Every month.' : '');
    $('[data-msubmit]').textContent = 'Pledge ' + RW.euro(a) + (m.monthly.checked ? ' a month' : '');
  }
  m.addEventListener('input', impact); m.addEventListener('change', impact); impact();
  m.addEventListener('submit', function (e) {
    e.preventDefault();
    var a = amount();
    if (!a || a < 1) { $('[data-merr]').textContent = 'Choose an amount of at least €1.'; return; }
    $('[data-merr]').textContent = '';
    var c = RW.donateCash({ name: m.name.value.trim(), amount: a, campaign: camp.value, monthly: m.monthly.checked });
    m.innerHTML = '<h2 style="font-size:clamp(2rem,1.4rem + 2vw,3.25rem)">Thank you' + (c.name !== 'Anonymous' ? ', ' + esc(c.name.split(' ')[0]) : '') + '.</h2><p class="impact" style="margin-top:12px">Your pledge of ' + RW.euro(c.amount) + (c.monthly ? ' a month' : '') + ' is recorded as ' + c.id + '.</p><p>It now counts towards ' + esc(camp.options[camp.selectedIndex].text.toLowerCase()) + ' on the home page.</p><a class="btn" href="index.html#drives">See the drives</a>';
  });
  if (location.hash === '#money') setTimeout(function () { $('#money').scrollIntoView(); }, 50);
})();
