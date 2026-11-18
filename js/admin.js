/* ReWear admin panel. One question first: what is waiting to be sorted,
   and which requests can we fill today? */
(function () {
  'use strict';
  var me = RW.session();
  if (!me || me.role !== 'admin') return;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var esc = RW.esc;
  var DAY = 86400000;
  var view = $('[data-view]');
  var invFilter = { status: '', q: '' };

  var VIEWS = [
    { id: 'overview', name: 'Overview' },
    { id: 'sorting', name: 'Sorting queue', count: function () { return RW.stats().waiting; } },
    { id: 'requests', name: 'Requests', count: function () { return RW.db.requests.filter(function (q) { return q.status === 'open' || q.status === 'pending'; }).length; } },
    { id: 'inventory', name: 'Inventory' },
    { id: 'orders', name: 'Outlet orders', count: function () { return RW.db.orders.filter(function (o) { return o.status === 'reserved' || o.status === 'ready'; }).length; } },
    { id: 'drives', name: 'Drives' },
    { id: 'money', name: 'Money' },
    { id: 'people', name: 'People', count: function () { return RW.db.users.filter(function (u) { return u.role === 'family' && !u.verified; }).length; } }
  ];
  var STATUS = { received: 'Waiting to sort', sorted: 'On the rack', matched: 'Matched', delivered: 'Handed over', recycled: 'Recycled', open: 'Looking', pending: 'Hand-over due', fulfilled: 'Collected', reserved: 'Reserved', ready: 'Ready', collected: 'Collected' };

  function current() { var h = location.hash.slice(1); return VIEWS.some(function (v) { return v.id === h; }) ? h : 'overview'; }

  function nav() {
    var cur = current();
    $('[data-nav]').innerHTML = VIEWS.map(function (v) {
      var c = v.count ? v.count() : 0;
      return '<a href="#' + v.id + '"' + (v.id === cur ? ' aria-current="page"' : '') + '><span>' + v.name + '</span>' + (c ? '<span class="count">' + c + '</span>' : '') + '</a>';
    }).join('');
    $('[data-mnav]').innerHTML = VIEWS.map(function (v) { var c = v.count ? v.count() : 0; return '<option value="' + v.id + '"' + (v.id === cur ? ' selected' : '') + '>' + v.name + (c ? ' (' + c + ')' : '') + '</option>'; }).join('');
    $('[data-avatar]').textContent = me.name.charAt(0);
    $('[data-who]').innerHTML = '<b>' + esc(me.name) + '</b>';
  }

  function toast(msg) {
    var t = $('.toast');
    if (!t) { t = document.createElement('div'); t.className = 'toast'; t.setAttribute('role', 'status'); document.body.appendChild(t); }
    t.textContent = msg; t.classList.add('show');
    clearTimeout(t._t); t._t = setTimeout(function () { t.classList.remove('show'); }, 3000);
  }
  function title(h, p, tools) {
    return '<div class="titlebar"><div><h1>' + h + '</h1><p>' + p + '</p></div>' + (tools ? '<div class="tools">' + tools + '</div>' : '') + '</div>';
  }
  function pill(s, text) { return '<span class="pill ' + s + '">' + (text || STATUS[s] || s) + '</span>'; }
  function gl(g) { return '<td class="gl">' + RWglyph(g.type, g.colour, '') + '</td>'; }
  function tagLink(t) { return '<a class="code" href="index.html?tag=' + t + '#track" target="_blank" rel="noopener">' + t + '</a>'; }

  /* candidates on the free rack for a request */
  function candidates(q) {
    return RW.rack('free').filter(function (g) { return g.type === q.type && g.size === q.size; })
      .concat(RW.rack('free').filter(function (g) { return g.type === q.type && g.size !== q.size && g.season === q.season; }).slice(0, 0));
  }

  /* ---------- overview ---------- */
  function overview() {
    var s = RW.stats();
    var g = RW.db.garments;
    var monthAgo = Date.now() - 30 * DAY;
    var handed = g.filter(function (x) { return x.status === 'delivered' && Date.parse(x.events[x.events.length - 1].at) > monthAgo; }).length;
    var open = RW.db.requests.filter(function (q) { return q.status === 'open'; });
    var fillable = open.filter(function (q) { return candidates(q).length; });
    var cashMonth = RW.db.cash.filter(function (c) { return Date.parse(c.date) > monthAgo; }).reduce(function (a, c) { return a + c.amount; }, 0);
    var outletMonth = RW.db.orders.filter(function (o) { return Date.parse(o.date) > monthAgo; }).reduce(function (a, o) { return a + o.total; }, 0);
    var counts = {}; ['received', 'sorted', 'matched', 'delivered', 'recycled'].forEach(function (k) { counts[k] = g.filter(function (x) { return x.status === k; }).length; });
    console.assert(Object.keys(counts).reduce(function (a, k) { return a + counts[k]; }, 0) === g.length, 'flow counts add up to all garments');

    var today = new Date();
    var html = title('Good ' + (today.getHours() < 12 ? 'morning' : today.getHours() < 18 ? 'afternoon' : 'evening') + ', ' + esc(me.name.split(' ')[0]),
      s.waiting + ' garments wait to be sorted and ' + fillable.length + ' of ' + open.length + ' open requests can be filled from the rack today.',
      '<a class="btn primary" href="#sorting">Sort the next garment</a>');
    html += '<div class="kpis">' +
      '<div class="kpi lead"><div class="label">Waiting to sort</div><div class="value">' + s.waiting + '</div><div class="note">oldest from ' + (g.filter(function (x) { return x.status === 'received'; }).map(function (x) { return x.events[0].at; }).sort()[0] ? RW.ago(g.filter(function (x) { return x.status === 'received'; }).map(function (x) { return x.events[0].at; }).sort()[0]) : 'nothing waiting') + '</div></div>' +
      '<div class="kpi"><div class="label">Open requests</div><div class="value">' + open.length + '</div><div class="note">' + fillable.length + ' have a match on the rack</div></div>' +
      '<div class="kpi"><div class="label">Handed over, last 30 days</div><div class="value">' + handed + '</div><div class="note">' + s.families + ' households helped in all</div></div>' +
      '<div class="kpi"><div class="label">Money in, last 30 days</div><div class="value">' + RW.euro(cashMonth + outletMonth) + '</div><div class="note">' + RW.euro(cashMonth) + ' gifts + ' + RW.euro(outletMonth) + ' outlet</div></div>' +
      '</div>';

    html += '<section class="panel" style="margin-top:16px"><div class="panel-head"><h2>Where every tag is now</h2><p>' + g.length + ' garments registered</p></div><div class="panel-body">' +
      '<div class="flow" role="img" aria-label="' + ['received', 'sorted', 'matched', 'delivered', 'recycled'].map(function (k) { return counts[k] + ' ' + STATUS[k].toLowerCase(); }).join(', ') + '">' +
      ['received', 'sorted', 'matched', 'delivered', 'recycled'].map(function (k) { return '<div class="f-' + k + '" style="flex-grow:' + Math.max(counts[k], 1) + '" title="' + STATUS[k] + '">' + counts[k] + '</div>'; }).join('') + '</div>' +
      '<div class="flow-key">' + [['received', '#c9d1c8'], ['sorted', '#6f9e7f'], ['matched', '#2f6f9c'], ['delivered', '#1f6b3d'], ['recycled', '#8a8f86']].map(function (k) { return '<span style="--sw:' + k[1] + '">' + STATUS[k[0]] + '</span>'; }).join('') + '</div></div></section>';

    html += '<section class="panel" style="margin-top:16px"><div class="panel-head"><h2>Next in the sorting queue</h2><a class="btn small" href="#sorting">Open the queue</a></div>' + queueTable(4) + '</section>';
    html += '<div class="cols even">' +
      '<section class="panel"><div class="panel-head"><h2>Requests we can fill today</h2><a class="btn small" href="#requests">All requests</a></div>' + requestList(fillable.slice(0, 5), true) + '</section>' +
      '<section class="panel"><div class="panel-head"><h2>Garments received per week</h2><p>This week highlighted</p></div><div class="panel-body"><div data-weekly></div></div></section>' +
      '</div>';
    html += '<section class="panel" style="margin-top:16px"><div class="panel-head"><h2>Drives</h2><a class="btn small" href="#drives">Manage</a></div>' + drivesList() + '</section>';
    view.innerHTML = html;
    weekly($('[data-weekly]'));
  }

  function weekly(el) {
    var labels = [], values = [];
    for (var w = 7; w >= 0; w--) {
      var from = Date.now() - (w + 1) * 7 * DAY, to = Date.now() - w * 7 * DAY;
      values.push(RW.db.garments.filter(function (g) { var t = Date.parse(g.events[0].at); return t > from && t <= to; }).length);
      labels.push(w === 0 ? 'This week' : new Date(to - 6 * DAY).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }));
    }
    Charts.bars(el, { labels: labels, values: values, highlight: 7, height: 210, xAt: [0, 2, 4, 7] });
  }

  /* ---------- sorting ---------- */
  function queueTable(limit) {
    var q = RW.db.garments.filter(function (g) { return g.status === 'received'; }).sort(function (a, b) { return Date.parse(a.events[0].at) - Date.parse(b.events[0].at); });
    if (!q.length) return '<p class="empty">Nothing waits to be sorted. New donations land here as soon as they are registered.</p>';
    var rows = (limit ? q.slice(0, limit) : q).map(function (g) {
      var don = RW.db.donations.find(function (d) { return d.id === g.donation; });
      var opt = function (vals, v) { return vals.map(function (x) { var val = Array.isArray(x) ? x[0] : x, l = Array.isArray(x) ? x[1] : x; return '<option value="' + val + '"' + (val === v ? ' selected' : '') + '>' + l + '</option>'; }).join(''); };
      return '<tr data-row="' + g.tag + '">' + gl(g) +
        '<td><b>' + esc(RW.label(g)) + '</b><div class="sub">' + tagLink(g.tag) + ' · ' + esc(don ? don.donor : '') + ' · ' + RW.ago(g.events[0].at) + '</div></td>' +
        '<td><label class="sr-only" style="position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0)" for="sz-' + g.tag + '">Size</label><select class="in" id="sz-' + g.tag + '" data-f="size">' + opt(RW.ADULT.concat(RW.KID), g.size) + '</select></td>' +
        '<td class="hide-s"><select class="in" data-f="condition" aria-label="Condition">' + opt(['like new', 'good', 'worn'], g.condition) + '</select></td>' +
        '<td class="hide-s"><select class="in" data-f="season" aria-label="Season">' + opt(['winter', 'summer', 'all-year'], g.season) + '</select></td>' +
        '<td><select class="in" data-f="dest" aria-label="Where it goes">' + opt([['free', 'Families'], ['outlet', 'Outlet'], ['recycle', 'Recycle']], g.condition === 'worn' ? 'outlet' : 'free') + '</select></td>' +
        '<td><input class="in price" data-f="price" aria-label="Outlet price in euros" inputmode="decimal" placeholder="€" value="' + (g.condition === 'worn' ? '4' : '') + '"' + (g.condition === 'worn' ? '' : ' hidden') + '></td>' +
        '<td class="r"><button class="btn small primary" type="button" data-file="' + g.tag + '">File it</button></td></tr>';
    }).join('');
    return '<div class="scroll"><table class="tbl"><thead><tr><th></th><th>Garment</th><th>Size</th><th class="hide-s">Condition</th><th class="hide-s">Season</th><th>Goes to</th><th>Price</th><th></th></tr></thead><tbody>' + rows + '</tbody></table></div>' +
      (limit && q.length > limit ? '<p class="empty" style="padding:12px 18px">' + (q.length - limit) + ' more in the queue.</p>' : '');
  }
  function sorting() {
    var n = RW.stats().waiting;
    view.innerHTML = title('Sorting queue', n ? n + ' garments, oldest first. Check each one, set where it goes, and file it.' : 'All caught up.', '') +
      '<section class="panel">' + queueTable(0) + '</section>';
  }

  /* ---------- requests ---------- */
  function requestList(list, compact) {
    if (!list.length) return '<p class="empty">' + (compact ? 'No open request has a match on the rack right now.' : 'No requests here.') + '</p>';
    return '<ul class="list">' + list.map(function (q) {
      var right = '';
      if (q.status === 'open') {
        var c = candidates(q);
        right = c.length ? '<div class="match-sug">' + RWglyph(c[0].type, c[0].colour, '') + '<button class="btn small primary" type="button" data-match="' + q.id + '" data-tag="' + c[0].tag + '">Match ' + c[0].tag + '</button></div>' : '<span class="sub">No ' + esc(q.need.toLowerCase()) + ' on the rack yet</span>';
      } else if (q.status === 'matched' || q.status === 'pending') {
        right = '<button class="btn small" type="button" data-hand="' + q.id + '">Mark collected</button>';
      } else right = pill(q.status);
      return '<li><div><b>' + esc(q.need) + '</b><div class="sub">' + q.id + ' · ' + esc(q.household) + ' · ' + RW.ago(q.date) + (q.tags.length ? ' · ' + q.tags.map(tagLink).join(', ') : '') + '</div>' + (compact ? '' : '<div style="margin-top:4px">' + pill(q.status) + '</div>') + '</div>' + right + '</li>';
    }).join('') + '</ul>';
  }
  function requests() {
    var r = RW.db.requests;
    var groups = [
      ['Looking for a match', r.filter(function (q) { return q.status === 'open'; })],
      ['Waiting for hand-over', r.filter(function (q) { return q.status === 'matched' || q.status === 'pending'; })],
      ['Collected', r.filter(function (q) { return q.status === 'fulfilled'; })]
    ];
    view.innerHTML = title('Requests', 'Match each need to a garment on the free rack, then mark it collected when the household picks it up.', '') +
      groups.map(function (gp, i) { return '<section class="panel" style="margin-top:' + (i ? 16 : 0) + 'px"><div class="panel-head"><h2>' + gp[0] + '</h2><p>' + gp[1].length + '</p></div>' + requestList(gp[1], false) + '</section>'; }).join('');
  }

  /* ---------- inventory ---------- */
  function inventory() {
    var q = invFilter.q.trim().toLowerCase();
    var list = RW.db.garments.filter(function (g) {
      if (invFilter.status && g.status !== invFilter.status) return false;
      if (q && (g.tag + ' ' + RW.label(g) + ' ' + g.size).toLowerCase().indexOf(q) === -1) return false;
      return true;
    }).slice().reverse();
    view.innerHTML = title('Inventory', RW.db.garments.length + ' garments registered since the start of the project.', '') +
      '<section class="panel"><div class="filters"><label class="sr-only" style="position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0)" for="inv-q">Search</label><input class="in" id="inv-q" data-inv-q placeholder="Search tag, garment or size" value="' + esc(invFilter.q) + '"><select class="in" data-inv-s aria-label="Status"><option value="">Every status</option>' +
      ['received', 'sorted', 'matched', 'delivered', 'recycled'].map(function (s) { return '<option value="' + s + '"' + (invFilter.status === s ? ' selected' : '') + '>' + STATUS[s] + '</option>'; }).join('') + '</select><span class="sub" style="align-self:center">' + list.length + ' shown</span></div>' +
      '<div class="scroll"><table class="tbl"><thead><tr><th></th><th>Tag</th><th>Garment</th><th>Size</th><th class="hide-s">Condition</th><th>Rack</th><th class="r">Price</th><th>Status</th><th class="hide-s">Last change</th></tr></thead><tbody>' +
      list.slice(0, 80).map(function (g) {
        var last = g.events[g.events.length - 1];
        return '<tr>' + gl(g) + '<td>' + tagLink(g.tag) + '</td><td>' + esc(RW.label(g)) + '</td><td>' + esc(g.size) + '</td><td class="hide-s">' + esc(g.condition) + '</td><td>' + (g.mode === 'free' ? 'Families' : g.mode === 'outlet' ? 'Outlet' : '<span class="sub">–</span>') + '</td><td class="r">' + (g.price ? RW.euro(g.price) : '<span class="sub">–</span>') + '</td><td>' + pill(g.status) + '</td><td class="hide-s sub">' + RW.ago(last.at) + '</td></tr>';
      }).join('') + '</tbody></table></div>' + (list.length > 80 ? '<p class="empty" style="padding:12px 18px">Showing the newest 80. Search to narrow.</p>' : '') + '</section>';
  }

  /* ---------- orders ---------- */
  function orders() {
    var o = RW.db.orders.slice();
    var total = o.reduce(function (a, x) { return a + x.total; }, 0);
    view.innerHTML = title('Outlet orders', o.length + ' orders, ' + RW.euro(total) + ' in all. Buyers pay when they collect.', '') +
      '<section class="panel"><div class="scroll"><table class="tbl"><thead><tr><th>Order</th><th>Buyer</th><th>Pieces</th><th class="hide-s">Hub</th><th class="r">To pay</th><th>Status</th><th></th></tr></thead><tbody>' +
      o.map(function (x) {
        return '<tr><td><b>' + x.id + '</b><div class="sub">' + RW.ago(x.date) + '</div></td><td>' + esc(x.buyer) + '</td><td>' + x.tags.map(tagLink).join(', ') + '</td><td class="hide-s">' + esc(x.hub || 'Kreuzberg hub') + '</td><td class="r">' + RW.euro(x.total) + '</td><td>' + pill(x.status) + '</td><td class="r">' + (x.status === 'reserved' || x.status === 'ready' ? '<button class="btn small primary" type="button" data-collect="' + x.id + '">Paid and collected</button>' : '') + '</td></tr>';
      }).join('') + '</tbody></table></div></section>';
  }

  /* ---------- drives ---------- */
  function drivesList(manage) {
    return RW.db.campaigns.map(function (c0) {
      var c = RW.campaign(c0.id);
      return '<div class="camp"><div><h3>' + esc(c.name) + '</h3><div class="sub">' + (c.active ? 'Collecting until ' + RW.dateLong(c.ends) : 'Paused') + '</div></div>' +
        '<div>' + (manage ? '<button class="btn small" type="button" data-toggle="' + c.id + '">' + (c.active ? 'Pause' : 'Open') + '</button>' : pill(c.active ? 'active' : 'closed', c.active ? 'Open' : 'Paused')) + '</div>' +
        '<div class="line"><span>Garments</span><span class="num">' + c.items + ' of ' + c.goal + '</span></div><div class="meter"><i style="width:' + Math.min(100, c.items / c.goal * 100) + '%"></i></div>' +
        '<div class="line"><span>Money</span><span class="num">' + RW.euro(c.raised) + ' of ' + RW.euro(c.cashGoal) + '</span></div><div class="meter cash"><i style="width:' + Math.min(100, c.raised / c.cashGoal * 100) + '%"></i></div></div>';
    }).join('');
  }
  function drives() {
    view.innerHTML = title('Drives', 'Seasonal drives shown on the public site. Garments count by type; money counts by the drive the donor chose.', '') +
      '<section class="panel">' + drivesList(true) + '</section>';
  }

  /* ---------- money ---------- */
  function money() {
    var c = RW.db.cash;
    var total = c.reduce(function (a, x) { return a + x.amount; }, 0);
    var by = {};
    c.forEach(function (x) { by[x.campaign] = (by[x.campaign] || 0) + x.amount; });
    var rows = Object.keys(by).map(function (k) { return { label: k === 'general' ? 'General fund' : RW.campaign(k).name, value: by[k] }; }).sort(function (a, b) { return b.value - a.value; });
    console.assert(rows.reduce(function (a, r) { return a + r.value; }, 0) === total, 'money by fund adds up to the total');
    view.innerHTML = title('Money', RW.euro(total) + ' pledged in ' + c.length + ' gifts, ' + c.filter(function (x) { return x.monthly; }).length + ' of them monthly.', '') +
      '<div class="cols"><section class="panel"><div class="panel-head"><h2>Gifts</h2></div><div class="scroll"><table class="tbl"><thead><tr><th>Gift</th><th>From</th><th>For</th><th class="r">Amount</th></tr></thead><tbody>' +
      c.map(function (x) { return '<tr><td>' + x.id + '<div class="sub">' + RW.dateLong(x.date) + '</div></td><td>' + esc(x.name) + '</td><td>' + (x.campaign === 'general' ? 'General fund' : esc(RW.campaign(x.campaign).name)) + (x.monthly ? '<div class="sub">monthly</div>' : '') + '</td><td class="r">' + RW.euro(x.amount) + '</td></tr>'; }).join('') +
      '</tbody></table></div></section><section class="panel"><div class="panel-head"><h2>By fund</h2><p>' + RW.euro(total) + '</p></div><div class="panel-body"><div data-funds></div></div></section></div>';
    Charts.barList($('[data-funds]'), rows, { format: Charts.fmt.money('EUR', 0) });
  }

  /* ---------- people ---------- */
  function people() {
    var u = RW.db.users;
    view.innerHTML = title('People', u.length + ' accounts. Families are verified once before they can request free clothes.', '') +
      '<section class="panel"><div class="scroll"><table class="tbl"><thead><tr><th>Name</th><th>Role</th><th class="hide-s">Household</th><th class="hide-s">Joined</th><th>Check</th><th></th></tr></thead><tbody>' +
      u.map(function (x) {
        return '<tr><td><div class="who"><span class="avatar">' + esc(x.name.charAt(0)) + '</span><span><b>' + esc(x.name) + '</b><div class="sub">' + esc(x.email) + '</div></span></div></td><td>' + ({ admin: 'Admin', donor: 'Donor', family: 'Family' })[x.role] + '</td><td class="hide-s">' + esc(x.household || '–') + '</td><td class="hide-s sub">' + RW.dateLong(x.joined) + '</td><td>' + (x.role === 'family' ? pill(x.verified ? 'verified' : 'unverified', x.verified ? 'Verified' : 'Not checked yet') : '<span class="sub">–</span>') + '</td><td class="r">' + (x.role === 'family' && !x.verified ? '<button class="btn small primary" type="button" data-verify="' + x.id + '">Verify household</button>' : '') + '</td></tr>';
      }).join('') + '</tbody></table></div></section>';
  }

  var RENDER = { overview: overview, sorting: sorting, requests: requests, inventory: inventory, orders: orders, drives: drives, money: money, people: people };
  function render() {
    nav();
    var cur = current();
    view.classList.remove('view'); void view.offsetWidth; view.classList.add('view');
    RENDER[cur]();
    document.title = VIEWS.find(function (v) { return v.id === cur; }).name + ' · ReWear admin';
  }

  /* ---------- actions ---------- */
  view.addEventListener('change', function (e) {
    if (e.target.dataset.f === 'dest') {
      var row = e.target.closest('tr');
      var price = row.querySelector('[data-f="price"]');
      price.hidden = e.target.value !== 'outlet';
      if (!price.hidden && !price.value) price.value = '6';
    }
    if (e.target.matches('[data-inv-s]')) { invFilter.status = e.target.value; inventory(); }
  });
  view.addEventListener('input', function (e) {
    if (e.target.matches('[data-inv-q]')) { invFilter.q = e.target.value; var pos = e.target.selectionStart; inventory(); var i = $('[data-inv-q]'); i.focus(); i.setSelectionRange(pos, pos); }
  });
  view.addEventListener('click', function (e) {
    var b;
    if ((b = e.target.closest('[data-file]'))) {
      var row = b.closest('tr');
      var f = function (k) { return row.querySelector('[data-f="' + k + '"]').value; };
      var dest = f('dest');
      if (dest === 'recycle') { RW.sort(b.dataset.file, { status: 'recycled' }); toast(b.dataset.file + ' sent to textile recycling.'); return; }
      var price = parseFloat(String(f('price')).replace(',', '.'));
      if (dest === 'outlet' && !(price > 0)) { row.querySelector('[data-f="price"]').focus(); toast('Set an outlet price first.'); return; }
      RW.sort(b.dataset.file, { size: f('size'), condition: f('condition'), season: f('season'), mode: dest, price: dest === 'outlet' ? price : null });
      toast(b.dataset.file + ' filed on the ' + (dest === 'free' ? 'free rack for families.' : 'outlet at ' + RW.euro(price) + '.'));
    } else if ((b = e.target.closest('[data-match]'))) {
      RW.match(b.dataset.match, b.dataset.tag); toast(b.dataset.tag + ' matched with ' + b.dataset.match + '.');
    } else if ((b = e.target.closest('[data-hand]'))) {
      RW.handOver(b.dataset.hand); toast(b.dataset.hand + ' collected. The donor can see it on the tag.');
    } else if ((b = e.target.closest('[data-collect]'))) {
      RW.collectOrder(b.dataset.collect); toast(b.dataset.collect + ' paid and collected.');
    } else if ((b = e.target.closest('[data-toggle]'))) {
      RW.toggleCampaign(b.dataset.toggle);
    } else if ((b = e.target.closest('[data-verify]'))) {
      RW.verifyUser(b.dataset.verify, true); toast('Household verified. They can now request clothes.');
    }
  });
  $('[data-mnav]').addEventListener('change', function (e) { location.hash = e.target.value; });
  document.querySelectorAll('[data-logout]').forEach(function (b) { b.addEventListener('click', function () { RW.logout(); location.href = 'login.html'; }); });
  $('[data-reset]').addEventListener('click', function () {
    if (confirm('Reset all demo data? Donations, requests and accounts made in this browser will be replaced by the sample data.')) { RW.reset(); RW.login('admin@rewear.org', 'admin123'); me = RW.session(); toast('Demo data reset.'); }
  });
  window.addEventListener('hashchange', function () { render(); window.scrollTo(0, 0); });
  RW.on(render);
  render();
})();
