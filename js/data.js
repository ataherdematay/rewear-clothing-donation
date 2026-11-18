/* ReWear demo data store.
   Everything lives in localStorage so the public site, the account page and the
   admin panel share one state. No server, no real payments: this is a concept demo. */
(function () {
  'use strict';
  var KEY = 'rewear.db.v1';
  var SESSION = 'rewear.session.v1';
  var CART = 'rewear.cart.v1';
  var DAY = 86400000;

  var TYPES = {
    tee: { name: 'T-shirt', kg: 0.2 },
    polo: { name: 'Polo shirt', kg: 0.25 },
    shirt: { name: 'Shirt', kg: 0.3 },
    blouse: { name: 'Blouse', kg: 0.2 },
    sweater: { name: 'Sweater', kg: 0.5 },
    dress: { name: 'Dress', kg: 0.35 },
    skirt: { name: 'Skirt', kg: 0.3 },
    jeans: { name: 'Jeans', kg: 0.6 },
    coat: { name: 'Winter coat', kg: 1.4 },
    jacket: { name: 'Jacket', kg: 0.9 },
    blazer: { name: 'School blazer', kg: 0.7 },
    scarf: { name: 'Scarf', kg: 0.15 },
    beanie: { name: 'Beanie', kg: 0.1 },
    shoes: { name: 'Trainers', kg: 0.8 }
  };
  var COLOURS = ['#f4d96c', '#e8794a', '#7fb4d8', '#d98fb5', '#9ccf8a', '#f2efe4', '#c94f4f', '#6c7fd1', '#d9a35b', '#4f8a6a'];
  var COLOUR_NAMES = { '#f4d96c': 'mustard', '#e8794a': 'rust', '#7fb4d8': 'sky blue', '#d98fb5': 'rose', '#9ccf8a': 'sage', '#f2efe4': 'off-white', '#c94f4f': 'red', '#6c7fd1': 'denim blue', '#d9a35b': 'camel', '#4f8a6a': 'forest green' };
  var HUBS = ['Kreuzberg hub', 'Neukölln hub', 'Wedding hub', 'School drop box, Moabit'];
  var KID = ['92', '104', '116', '128', '140', '152', '164'];
  var ADULT = ['XS', 'S', 'M', 'L', 'XL'];

  function seeded(seed) {
    return function () {
      seed = (seed * 1664525 + 1013904223) % 4294967296;
      return seed / 4294967296;
    };
  }
  function iso(daysAgo, hour) {
    var d = new Date(Date.now() - daysAgo * DAY);
    d.setHours(hour || 10, 0, 0, 0);
    return d.toISOString();
  }

  function seed() {
    var r = seeded(20261118);
    var pick = function (a) { return a[Math.floor(r() * a.length)]; };
    var users = [
      { id: 'u1', name: 'Mira Admin', email: 'admin@rewear.org', password: 'admin123', role: 'admin', verified: true, joined: iso(220) },
      { id: 'u2', name: 'Lena Hoffmann', email: 'donor@rewear.org', password: 'donor123', role: 'donor', verified: true, joined: iso(64) },
      { id: 'u3', name: 'Aylin Demir', email: 'family@rewear.org', password: 'family123', role: 'family', verified: true, household: 'Family of four, Neukölln', joined: iso(40) },
      { id: 'u4', name: 'Jonas Weber', email: 'jonas@example.org', password: 'demo123', role: 'donor', verified: true, joined: iso(30) },
      { id: 'u5', name: 'Samira Haddad', email: 'samira@example.org', password: 'demo123', role: 'family', verified: false, household: 'Single parent, two children, Wedding', joined: iso(2) },
      { id: 'u6', name: 'Tobias Krüger', email: 'tobias@example.org', password: 'demo123', role: 'donor', verified: true, joined: iso(12) }
    ];
    var donorNames = ['Lena Hoffmann', 'Jonas Weber', 'Tobias Krüger', 'Clara Schmidt', 'Emre Yılmaz', 'Sofia Rossi', 'Paul Becker', 'Hannah Wolf', 'Noah Fischer', 'Ida Neumann'];
    var donorIds = { 'Lena Hoffmann': 'u2', 'Jonas Weber': 'u4', 'Tobias Krüger': 'u6' };
    var typeKeys = Object.keys(TYPES);
    var garments = [], donations = [];
    var tagNo = 2400, donNo = 1000;

    for (var i = 0; i < 26; i++) {
      var days = Math.floor(2 + i * 2.2 + r() * 2);
      var donor = pick(donorNames);
      var don = { id: 'D-' + (++donNo), donor: donor, userId: donorIds[donor] || null, hub: pick(HUBS), date: iso(days, 9 + Math.floor(r() * 8)), tags: [] };
      var n = 1 + Math.floor(r() * 4);
      for (var k = 0; k < n; k++) {
        var t = pick(typeKeys);
        var kid = r() < 0.38;
        var season = (t === 'coat' || t === 'beanie' || t === 'scarf' || t === 'sweater') ? 'winter' : (t === 'tee' || t === 'polo' || t === 'dress' || t === 'skirt') ? 'summer' : 'all-year';
        var g = {
          tag: 'RW-' + (++tagNo), type: t, colour: pick(COLOURS),
          size: kid ? pick(KID) : pick(ADULT),
          gender: kid ? 'kids' : pick(['women', 'men', 'unisex']),
          season: season, condition: pick(['like new', 'good', 'good', 'worn']),
          donation: don.id, status: 'received', mode: null, price: null,
          campaign: t === 'coat' || t === 'jacket' ? 'winter' : t === 'blazer' ? 'school' : null,
          events: [{ s: 'received', at: don.date, note: 'Dropped off at ' + don.hub }]
        };
        // older donations have moved further through the journey
        if (days > 4) {
          var sortedAt = new Date(Date.parse(don.date) + DAY * (1 + Math.floor(r() * 2))).toISOString();
          if (g.condition === 'worn' && r() < 0.35) {
            g.status = 'recycled';
            g.events.push({ s: 'recycled', at: sortedAt, note: 'Too worn to wear again, sent to textile recycling' });
          } else {
            g.status = 'sorted';
            g.mode = r() < 0.62 ? 'free' : 'outlet';
            if (g.mode === 'outlet') g.price = [4, 6, 8, 9, 12, 15, 18][Math.floor(r() * 7)];
            g.events.push({ s: 'sorted', at: sortedAt, note: 'Sorted: size ' + g.size + ', ' + g.season + ', ' + g.condition + (g.mode === 'outlet' ? ', priced for the outlet' : ', set aside for families') });
          }
        }
        garments.push(g);
        don.tags.push(g.tag);
      }
      donations.push(don);
    }

    // requests from families, some already matched and delivered
    var households = ['Family of four, Neukölln', 'Single parent, two children, Wedding', 'Grandmother and grandson, Moabit', 'Family of five, Spandau', 'Student, Kreuzberg', 'Family of three, Marzahn', 'Refugee family, Lichtenberg'];
    var requests = [], reqNo = 300;
    var free = garments.filter(function (g) { return g.status === 'sorted' && g.mode === 'free'; });
    for (var q = 0; q < 11; q++) {
      var want = free[q * 2] || free[q];
      var rDays = Math.max(1, 30 - q * 3);
      var req = {
        id: 'RQ-' + (++reqNo), household: q === 0 ? 'Family of four, Neukölln' : pick(households), userId: q === 0 || q === 4 ? 'u3' : null,
        need: want ? TYPES[want.type].name + ', size ' + want.size : 'Winter coat, size 128',
        type: want ? want.type : 'coat', size: want ? want.size : '128', season: want ? want.season : 'winter',
        date: iso(rDays), status: 'open', tags: []
      };
      if (want && q < 7) {
        var matchedAt = new Date(Date.parse(req.date) + DAY).toISOString();
        want.status = 'matched'; req.status = 'matched'; req.tags.push(want.tag);
        want.request = req.id;
        want.events.push({ s: 'matched', at: matchedAt, note: 'Matched with request ' + req.id + ' (' + req.household + ')' });
        if (q < 5) {
          var delAt = new Date(Date.parse(matchedAt) + DAY * 2).toISOString();
          want.status = 'delivered'; req.status = 'fulfilled';
          want.events.push({ s: 'delivered', at: delAt, note: 'Collected by the family at the ' + pick(HUBS) });
        }
      }
      requests.push(req);
    }

    // outlet orders
    var orders = [], ordNo = 5500;
    var outlet = garments.filter(function (g) { return g.status === 'sorted' && g.mode === 'outlet'; });
    for (var o = 0; o < 6 && o * 2 < outlet.length; o++) {
      var it = outlet[o * 2];
      var oDays = 1 + o * 4;
      it.status = o < 4 ? 'delivered' : 'matched';
      it.order = 'OR-' + (ordNo + 1);
      it.events.push({ s: 'matched', at: iso(oDays + 1), note: 'Bought in the ReWear outlet' });
      if (o < 4) it.events.push({ s: 'delivered', at: iso(oDays), note: 'Picked up by the buyer, the money funds sorting and transport' });
      orders.push({ id: 'OR-' + (++ordNo), buyer: pick(donorNames), tags: [it.tag], total: it.price, date: iso(oDays + 1), status: o < 4 ? 'collected' : 'ready' });
    }

    var cash = [], cashNo = 800;
    var amounts = [5, 10, 15, 20, 25, 30, 50, 15, 10, 100, 20, 5, 30, 15];
    amounts.forEach(function (a, idx) {
      cash.push({ id: 'C-' + (++cashNo), name: idx % 4 === 0 ? 'Anonymous' : pick(donorNames), amount: a, campaign: pick(['winter', 'school', 'general', 'winter']), date: iso(1 + idx * 3), monthly: idx % 5 === 0 });
    });

    var campaigns = [
      { id: 'winter', name: 'Winter coats', blurb: 'Warm coats, jackets, scarves and hats for children and adults before the first frost.', types: ['coat', 'jacket', 'scarf', 'beanie', 'sweater'], goal: 120, cashGoal: 2000, ends: iso(-42), active: true },
      { id: 'school', name: 'School uniforms', blurb: 'Blazers, shirts and trainers so that no child starts the term in clothes that do not fit.', types: ['blazer', 'shirt', 'polo', 'shoes'], goal: 60, cashGoal: 800, ends: iso(-100), active: true },
      { id: 'summer', name: 'Summer clothes', blurb: 'T-shirts, dresses and light trousers, collected from April for the warm months.', types: ['tee', 'dress', 'skirt', 'polo'], goal: 150, cashGoal: 600, ends: iso(-160), active: false }
    ];

    return { version: 1, users: users, garments: garments, donations: donations, requests: requests, orders: orders, cash: cash, campaigns: campaigns, nextTag: tagNo + 1 };
  }

  function load() {
    try {
      var raw = localStorage.getItem(KEY);
      if (raw) return JSON.parse(raw);
    } catch (e) { /* storage blocked: fall through to a fresh seed */ }
    var db = seed();
    save(db);
    return db;
  }
  function save(db) {
    try { localStorage.setItem(KEY, JSON.stringify(db)); } catch (e) { /* demo still works for this page view */ }
  }

  var state = load();
  var listeners = [];
  function commit() { save(state); listeners.forEach(function (fn) { fn(state); }); }

  function nextId(prefix, list, key) {
    var max = 0;
    list.forEach(function (x) { var n = parseInt(String(x[key || 'id']).split('-')[1], 10); if (n > max) max = n; });
    return prefix + '-' + (max + 1);
  }
  function byTag(tag) { return state.garments.find(function (g) { return g.tag === tag; }); }

  var RW = {
    TYPES: TYPES, COLOURS: COLOURS, COLOUR_NAMES: COLOUR_NAMES, HUBS: HUBS, KID: KID, ADULT: ADULT,
    get db() { return state; },
    on: function (fn) { listeners.push(fn); },
    reset: function () { state = seed(); commit(); try { localStorage.removeItem(CART); } catch (e) {} },

    /* formatting */
    euro: function (n) { return '€' + (Math.round(n * 100) / 100).toFixed(n % 1 ? 2 : 0); },
    date: function (s) { return new Date(s).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }); },
    dateLong: function (s) { return new Date(s).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }); },
    ago: function (s) {
      var d = Math.round((Date.now() - Date.parse(s)) / DAY);
      return d <= 0 ? 'today' : d === 1 ? 'yesterday' : d + ' days ago';
    },
    label: function (g) { return (COLOUR_NAMES[g.colour] ? COLOUR_NAMES[g.colour].charAt(0).toUpperCase() + COLOUR_NAMES[g.colour].slice(1) + ' ' : '') + TYPES[g.type].name.toLowerCase(); },
    esc: function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); },

    /* queries */
    garment: byTag,
    rack: function (mode) { return state.garments.filter(function (g) { return g.status === 'sorted' && (!mode || g.mode === mode); }); },
    track: function (tag) {
      tag = String(tag || '').trim().toUpperCase().replace(/^RW-?/, 'RW-');
      if (/^RW-\d+$/.test(tag) === false && /^\d+$/.test(tag)) tag = 'RW-' + tag;
      var g = byTag(tag);
      if (!g) return null;
      return { garment: g, donation: state.donations.find(function (d) { return d.id === g.donation; }) };
    },
    stats: function () {
      var g = state.garments;
      var rehomed = g.filter(function (x) { return x.status === 'delivered'; });
      var circulating = g.filter(function (x) { return x.status !== 'recycled'; });
      var kg = circulating.reduce(function (s, x) { return s + TYPES[x.type].kg; }, 0);
      var families = {};
      state.requests.forEach(function (q) { if (q.status !== 'open') families[q.household] = 1; });
      var cash = state.cash.reduce(function (s, c) { return s + c.amount; }, 0);
      var outlet = state.orders.reduce(function (s, o) { return s + o.total; }, 0);
      return { received: g.length, rehomed: rehomed.length, kg: Math.round(kg), families: Object.keys(families).length, cash: cash, outlet: outlet, waiting: g.filter(function (x) { return x.status === 'received'; }).length, open: state.requests.filter(function (q) { return q.status === 'open'; }).length };
    },
    campaign: function (id) {
      var c = state.campaigns.find(function (x) { return x.id === id; });
      if (!c) return null;
      var items = state.garments.filter(function (g) { return c.types.indexOf(g.type) > -1 && g.status !== 'recycled'; }).length;
      var raised = state.cash.filter(function (x) { return x.campaign === id; }).reduce(function (s, x) { return s + x.amount; }, 0);
      return Object.assign({}, c, { items: items, raised: raised });
    },

    /* public actions */
    donateClothes: function (info) {
      var now = new Date().toISOString();
      var don = { id: nextId('D', state.donations), donor: info.name || 'Anonymous', userId: info.userId || null, hub: info.hub, date: now, tags: [], pickup: info.pickup || false };
      info.items.forEach(function (it) {
        var tag = 'RW-' + (state.nextTag++);
        state.garments.push({
          tag: tag, type: it.type, colour: it.colour || COLOURS[0], size: it.size, gender: it.gender, season: it.season, condition: it.condition,
          donation: don.id, status: 'received', mode: null, price: null, campaign: null,
          events: [{ s: 'received', at: now, note: (info.pickup ? 'Pick-up booked from ' : 'Registered for drop-off at ') + info.hub }]
        });
        don.tags.push(tag);
      });
      state.donations.unshift(don);
      commit();
      return don;
    },
    donateCash: function (info) {
      var c = { id: nextId('C', state.cash), name: info.name || 'Anonymous', amount: Number(info.amount), campaign: info.campaign || 'general', date: new Date().toISOString(), monthly: !!info.monthly };
      state.cash.unshift(c);
      commit();
      return c;
    },
    reserve: function (tags, buyer) {
      var now = new Date().toISOString();
      var total = 0;
      tags.forEach(function (t) {
        var g = byTag(t);
        if (g && g.status === 'sorted') { g.status = 'matched'; total += g.price || 0; g.events.push({ s: 'matched', at: now, note: 'Reserved in the outlet, to be paid at pick-up' }); }
      });
      var o = { id: nextId('OR', state.orders), buyer: buyer.name, userId: buyer.userId || null, tags: tags.slice(), total: total, date: now, status: 'reserved', hub: buyer.hub };
      tags.forEach(function (t) { var g = byTag(t); if (g) g.order = o.id; });
      state.orders.unshift(o);
      commit();
      return o;
    },
    requestFree: function (tags, user) {
      var now = new Date().toISOString();
      var made = [];
      tags.forEach(function (t) {
        var g = byTag(t);
        if (!g || g.status !== 'sorted') return;
        var q = { id: nextId('RQ', state.requests), household: user.household || user.name, userId: user.id, need: TYPES[g.type].name + ', size ' + g.size, type: g.type, size: g.size, season: g.season, date: now, status: 'pending', tags: [g.tag] };
        g.status = 'matched'; g.request = q.id;
        g.events.push({ s: 'matched', at: now, note: 'Requested by a verified household, waiting for hand-over' });
        state.requests.unshift(q);
        made.push(q);
      });
      commit();
      return made;
    },
    requestNeed: function (need, user) {
      var q = { id: nextId('RQ', state.requests), household: user.household || user.name, userId: user.id, need: TYPES[need.type].name + ', size ' + need.size, type: need.type, size: need.size, season: need.season, date: new Date().toISOString(), status: 'open', tags: [] };
      state.requests.unshift(q);
      commit();
      return q;
    },

    /* admin actions */
    sort: function (tag, fields) {
      var g = byTag(tag); if (!g) return;
      Object.assign(g, fields);
      if (fields.status === 'recycled') g.events.push({ s: 'recycled', at: new Date().toISOString(), note: 'Too worn to wear again, sent to textile recycling' });
      else { g.status = 'sorted'; g.events.push({ s: 'sorted', at: new Date().toISOString(), note: 'Sorted: size ' + g.size + ', ' + g.season + ', ' + g.condition + (g.mode === 'outlet' ? ', priced at ' + RW.euro(g.price) + ' for the outlet' : ', set aside for families') }); }
      commit();
    },
    match: function (reqId, tag) {
      var q = state.requests.find(function (x) { return x.id === reqId; });
      var g = byTag(tag);
      if (!q || !g) return;
      g.status = 'matched'; g.request = q.id;
      g.events.push({ s: 'matched', at: new Date().toISOString(), note: 'Matched with request ' + q.id + ' (' + q.household + ')' });
      q.tags.push(tag); q.status = 'matched';
      commit();
    },
    handOver: function (reqId) {
      var q = state.requests.find(function (x) { return x.id === reqId; });
      if (!q) return;
      q.status = 'fulfilled';
      q.tags.forEach(function (t) { var g = byTag(t); if (g) { g.status = 'delivered'; g.events.push({ s: 'delivered', at: new Date().toISOString(), note: 'Collected by the household at the hub' }); } });
      commit();
    },
    approveRequest: function (reqId) {
      var q = state.requests.find(function (x) { return x.id === reqId; });
      if (q) { q.status = 'matched'; commit(); }
    },
    collectOrder: function (id) {
      var o = state.orders.find(function (x) { return x.id === id; });
      if (!o) return;
      o.status = 'collected';
      o.tags.forEach(function (t) { var g = byTag(t); if (g) { g.status = 'delivered'; g.events.push({ s: 'delivered', at: new Date().toISOString(), note: 'Picked up and paid, the money funds sorting and transport' }); } });
      commit();
    },
    verifyUser: function (id, ok) {
      var u = state.users.find(function (x) { return x.id === id; });
      if (u) { u.verified = ok; commit(); }
    },
    toggleCampaign: function (id) {
      var c = state.campaigns.find(function (x) { return x.id === id; });
      if (c) { c.active = !c.active; commit(); }
    },

    /* session */
    session: function () {
      try { var id = localStorage.getItem(SESSION); return id ? state.users.find(function (u) { return u.id === id; }) || null : null; } catch (e) { return null; }
    },
    login: function (email, password) {
      var u = state.users.find(function (x) { return x.email.toLowerCase() === String(email).trim().toLowerCase(); });
      if (!u) return { error: 'There is no account with that email address.' };
      if (u.password !== password) return { error: 'That password does not match this account.' };
      try { localStorage.setItem(SESSION, u.id); } catch (e) {}
      return { user: u };
    },
    register: function (info) {
      if (state.users.some(function (x) { return x.email.toLowerCase() === info.email.toLowerCase(); })) return { error: 'An account with this email already exists. Log in instead.' };
      var u = { id: 'u' + Date.now().toString(36), name: info.name, email: info.email, password: info.password, role: info.role, verified: info.role !== 'family', household: info.household || null, joined: new Date().toISOString() };
      state.users.push(u);
      commit();
      try { localStorage.setItem(SESSION, u.id); } catch (e) {}
      return { user: u };
    },
    logout: function () { try { localStorage.removeItem(SESSION); } catch (e) {} },

    /* cart (outlet reservations) */
    cart: function () { try { return JSON.parse(localStorage.getItem(CART) || '[]'); } catch (e) { return []; } },
    setCart: function (tags) { try { localStorage.setItem(CART, JSON.stringify(tags)); } catch (e) {} listeners.forEach(function (fn) { fn(state); }); }
  };

  window.addEventListener('storage', function (e) { if (e.key === KEY) { state = load(); listeners.forEach(function (fn) { fn(state); }); } });
  window.RW = RW;
})();
