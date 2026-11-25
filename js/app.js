/* Mama Auto Parts - online store for motorcycle parts
   A single-page app: the part after "#" in the address bar decides which page is shown.
   All data is kept in the browser (localStorage), so the site works offline. */
(function () {
  "use strict";

  var D = window.MAP_DATA;
  var DB_KEY = "map_db_v5", SESSION_KEY = "map_session", CART_KEY = "map_cart", GARAGE_KEY = "map_garage";

  /* ------------------------------------------------------------------ helpers */
  function $(sel, el) { return (el || document).querySelector(sel); }
  function $all(sel, el) { return Array.prototype.slice.call((el || document).querySelectorAll(sel)); }

  // Escape everything that comes from users before it goes into the page (prevents XSS).
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function npr(n) { return "Rs. " + Math.round(Number(n) || 0).toLocaleString("en-IN"); }
  function fmtDate(iso, withTime) {
    var d = new Date(iso);
    var s = d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
    return withTime ? s + ", " + d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }) : s;
  }
  function uid(prefix) { return prefix + Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }
  function clean(s) { return String(s == null ? "" : s).trim(); }

  // SHA-256 (passwords are stored only as salted hashes, never as plain text)
  function sha256(str) {
    var ascii = unescape(encodeURIComponent(str));
    function rr(v, a) { return (v >>> a) | (v << (32 - a)); }
    var maxWord = Math.pow(2, 32), i, j, result = "", words = [], bitLen = ascii.length * 8;
    var hash = sha256.h = sha256.h || [], k = sha256.k = sha256.k || [], pc = k.length, comp = {};
    for (var cand = 2; pc < 64; cand++) {
      if (!comp[cand]) {
        for (i = 0; i < 313; i += cand) comp[i] = cand;
        hash[pc] = (Math.pow(cand, 0.5) * maxWord) | 0;
        k[pc++] = (Math.pow(cand, 1 / 3) * maxWord) | 0;
      }
    }
    ascii += "\x80";
    while (ascii.length % 64 - 56) ascii += "\x00";
    for (i = 0; i < ascii.length; i++) { j = ascii.charCodeAt(i); words[i >> 2] |= j << ((3 - i) % 4) * 8; }
    words[words.length] = (bitLen / maxWord) | 0;
    words[words.length] = bitLen;
    for (j = 0; j < words.length;) {
      var w = words.slice(j, j += 16), old = hash;
      hash = hash.slice(0, 8);
      for (i = 0; i < 64; i++) {
        var w15 = w[i - 15], w2 = w[i - 2], a = hash[0], e = hash[4];
        var t1 = hash[7] + (rr(e, 6) ^ rr(e, 11) ^ rr(e, 25)) + ((e & hash[5]) ^ ((~e) & hash[6])) + k[i] +
          (w[i] = (i < 16) ? w[i] : (w[i - 16] + (rr(w15, 7) ^ rr(w15, 18) ^ (w15 >>> 3)) + w[i - 7] + (rr(w2, 17) ^ rr(w2, 19) ^ (w2 >>> 10))) | 0);
        var t2 = (rr(a, 2) ^ rr(a, 13) ^ rr(a, 22)) + ((a & hash[1]) ^ (a & hash[2]) ^ (hash[1] & hash[2]));
        hash = [(t1 + t2) | 0].concat(hash);
        hash[4] = (hash[4] + t1) | 0;
      }
      for (i = 0; i < 8; i++) hash[i] = (hash[i] + old[i]) | 0;
    }
    for (i = 0; i < 8; i++) for (j = 3; j + 1; j--) { var b = (hash[i] >> (j * 8)) & 255; result += (b < 16 ? "0" : "") + b.toString(16); }
    return result;
  }
  function hashPassword(pw, salt) { return sha256(salt + ":" + pw); }

  /* ------------------------------------------------------------------ storage */
  var memory = {};
  var store = {
    get: function (k, def) {
      try { var v = localStorage.getItem(k); return v ? JSON.parse(v) : def; }
      catch (e) { return k in memory ? memory[k] : def; }
    },
    set: function (k, v) {
      try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { memory[k] = v; }
    },
    del: function (k) { try { localStorage.removeItem(k); } catch (e) { delete memory[k]; } }
  };

  var db;
  function save() { store.set(DB_KEY, db); }

  function seed() {
    var now = Date.now(), day = 86400000;
    var users = D.users.map(function (u) {
      var salt = Math.random().toString(36).slice(2, 10);
      return { id: u.id, name: u.name, email: u.email, role: u.role, phone: u.phone, area: u.area, address: u.address,
        salt: salt, passHash: hashPassword(u.password, salt), wishlist: [], createdAt: new Date(now - 30 * day).toISOString() };
    });
    var products = D.products.map(function (p, i) {
      var c = JSON.parse(JSON.stringify(p));
      c.createdAt = new Date(now - (40 - i) * day).toISOString();
      return c;
    });
    var reviews = D.reviews.map(function (r, i) {
      var u = users.filter(function (x) { return x.id === r.user; })[0];
      return { id: "r" + (i + 1), pid: r.pid, userId: r.user, name: u.name, rating: r.rating, text: r.text,
        date: new Date(now - (6 - i) * day).toISOString() };
    });
    db = { products: products, users: users, reviews: reviews, orders: [], emails: [], seq: 1000 };

    D.orders.forEach(function (o) {
      var user = users.filter(function (x) { return x.id === o[0]; })[0];
      var created = new Date(now - o[1] * day - 3600000 * (2 + o[1] % 5));
      var items = o[2].map(function (it) {
        var p = findProduct(it[0]);
        return { pid: p.id, name: p.name, sku: p.sku, price: p.price, qty: it[1] };
      });
      var order = buildOrder({ userId: user.id, name: user.name, phone: user.phone, email: user.email,
        area: o[3], address: user.address, method: o[4], items: items, date: created.toISOString() });
      if (o[4] !== "cod") { order.payment.status = "Paid"; order.payment.txn = (o[4] === "esewa" ? "ESW" : "KHT") + (900000 + db.seq); }
      var flow = ["Processing", "Shipped", "Delivered"], stop = flow.indexOf(o[5]);
      for (var s = 0; s <= stop; s++) {
        order.status = flow[s];
        order.history.push({ status: flow[s], date: new Date(created.getTime() + (s + 1) * 6 * 3600000).toISOString(), note: "" });
      }
      if (o[5] === "Delivered" && o[4] === "cod") order.payment.status = "Paid";
      db.orders.push(order);
    });
    save();
  }

  function load() {
    db = store.get(DB_KEY, null);
    if (!db || !db.products) seed();
  }

  /* ------------------------------------------------------------------ lookups */
  function findProduct(id) { return db.products.filter(function (p) { return p.id === id; })[0]; }
  function findUser(id) { return db.users.filter(function (u) { return u.id === id; })[0]; }
  function findOrder(id) { return db.orders.filter(function (o) { return o.id === id; })[0]; }
  function catById(id) { return D.categories.filter(function (c) { return c.id === id; })[0] || { id: id, name: id }; }
  function areaById(id) { return D.delivery.filter(function (a) { return a.id === id; })[0] || D.delivery[D.delivery.length - 1]; }
  var MODELS = {};
  D.bikes.forEach(function (b) { b.models.forEach(function (m) { MODELS[m.id] = { id: m.id, name: m.name, brand: b.brand, full: b.brand + " " + m.name }; }); });
  function modelsOfBrand(brand) {
    var b = D.bikes.filter(function (x) { return x.brand === brand; })[0];
    return b ? b.models : [];
  }
  function fitsModel(p, modelId) { return p.fits.indexOf("universal") > -1 || p.fits.indexOf(modelId) > -1; }
  function fitsBrand(p, brand) {
    if (p.fits.indexOf("universal") > -1) return true;
    return p.fits.some(function (m) { return MODELS[m] && MODELS[m].brand === brand; });
  }
  function fitsText(p) {
    if (p.fits.indexOf("universal") > -1) return "Universal fit (most bikes)";
    return p.fits.map(function (m) { return MODELS[m] ? MODELS[m].full : m; }).join(", ");
  }
  function productReviews(pid) { return db.reviews.filter(function (r) { return r.pid === pid; }); }
  function rating(pid) {
    var rs = productReviews(pid);
    if (!rs.length) return { avg: 0, count: 0 };
    return { avg: rs.reduce(function (s, r) { return s + r.rating; }, 0) / rs.length, count: rs.length };
  }

  /* ------------------------------------------------------------------ session, cart, garage */
  function currentUser() {
    var s = store.get(SESSION_KEY, null);
    return s ? findUser(s.userId) || null : null;
  }
  function isAdmin() { var u = currentUser(); return !!(u && u.role === "admin"); }
  function getCart() { return store.get(CART_KEY, []); }
  function setCart(c) { store.set(CART_KEY, c); renderHeader(); }
  function cartCount() { return getCart().reduce(function (s, i) { return s + i.qty; }, 0); }
  function cartLines() {
    return getCart().map(function (i) { var p = findProduct(i.pid); return p ? { p: p, qty: i.qty } : null; }).filter(Boolean);
  }
  function cartTotals(areaId) {
    var sub = cartLines().reduce(function (s, l) { return s + l.p.price * l.qty; }, 0);
    var fee = isArea(areaId) ? (sub >= D.freeDeliveryAbove ? 0 : areaById(areaId).fee) : 0;
    return { sub: sub, fee: fee, total: sub + fee };
  }
  function isArea(id) { return D.delivery.some(function (a) { return a.id === id; }); }
  function getGarage() { var g = store.get(GARAGE_KEY, null); return g && MODELS[g] ? g : null; }

  /* ------------------------------------------------------------------ emails (simulated) */
  function sendEmail(to, subject, body, orderId) {
    db.emails.unshift({ id: uid("e"), to: to, subject: subject, body: body, orderId: orderId || null, date: new Date().toISOString() });
    save();
  }
  function adminEmail() { var a = db.users.filter(function (u) { return u.role === "admin"; })[0]; return a ? a.email : "admin"; }

  function checkLowStock(p) {
    if (p.stock <= D.lowStockLimit) {
      sendEmail(adminEmail(), "Low stock alert: " + p.name,
        p.name + " (" + p.sku + ") has only " + p.stock + " left in stock. Please restock soon.");
    }
  }

  /* ------------------------------------------------------------------ orders */
  function buildOrder(o) {
    db.seq += 1;
    var sub = o.items.reduce(function (s, i) { return s + i.price * i.qty; }, 0);
    var fee = sub >= D.freeDeliveryAbove ? 0 : areaById(o.area).fee;
    return {
      id: "MAP-" + db.seq, userId: o.userId || null,
      customer: { name: o.name, phone: o.phone, email: o.email },
      area: o.area, address: o.address, note: o.note || "",
      items: o.items, subtotal: sub, delivery: fee, total: sub + fee,
      payment: { method: o.method, status: o.method === "cod" ? "Cash on delivery" : "Awaiting payment", txn: "" },
      status: "Pending", createdAt: o.date || new Date().toISOString(),
      history: [{ status: "Pending", date: o.date || new Date().toISOString(), note: "Order placed" }]
    };
  }
  var PAY_NAMES = { esewa: "eSewa", khalti: "Khalti", cod: "Cash on Delivery" };
  var STATUS_FLOW = ["Pending", "Processing", "Shipped", "Delivered"];

  function setOrderStatus(order, status, note) {
    if (order.status === status) return;
    var wasCancelled = order.status === "Cancelled";
    order.status = status;
    order.history.push({ status: status, date: new Date().toISOString(), note: note || "" });
    if (status === "Cancelled" && !wasCancelled) {
      order.items.forEach(function (i) { var p = findProduct(i.pid); if (p) { p.stock += i.qty; p.sold = Math.max(0, (p.sold || 0) - i.qty); } });
      if (order.payment.status === "Paid") order.payment.status = "Refunded";
    }
    if (status === "Delivered" && order.payment.method === "cod") order.payment.status = "Paid";
    var msgs = {
      Processing: "We have started packing your order.",
      Shipped: "Your order is on the way and should reach you today (or by the next morning in the far wards of Hetauda).",
      Delivered: "Your order has been delivered. Thank you for shopping with us!",
      Cancelled: "Your order has been cancelled." + (order.payment.status === "Refunded" ? " Your payment will be refunded to your wallet within 3-5 working days." : "")
    };
    sendEmail(order.customer.email || order.customer.phone, "Order " + order.id + " is now " + status,
      "Hi " + order.customer.name + ", " + (msgs[status] || "Your order status changed to " + status + ".") +
      " Track it any time with order ID " + order.id + ".", order.id);
    save();
  }

  /* ------------------------------------------------------------------ toasts */
  function toast(msg, type) {
    var t = document.createElement("div");
    t.className = "toast " + (type || "");
    t.textContent = msg;
    $("#toasts").appendChild(t);
    setTimeout(function () { t.classList.add("out"); }, 2600);
    setTimeout(function () { t.remove(); }, 3100);
  }

  /* ------------------------------------------------------------------ icons */
  function sprocketPath(cx, cy, r1, r2, n) {
    var pts = [];
    for (var i = 0; i < n * 2; i++) {
      var r = i % 2 ? r1 : r2, a = Math.PI * i / n;
      pts.push((cx + r * Math.cos(a)).toFixed(1) + "," + (cy + r * Math.sin(a)).toFixed(1));
    }
    return "M" + pts.join("L") + "Z";
  }
  var ICONS = {
    brakes: '<circle cx="32" cy="32" r="20"/><circle cx="32" cy="32" r="6"/><circle cx="32" cy="19" r="1.6"/><circle cx="45" cy="32" r="1.6"/><circle cx="32" cy="45" r="1.6"/><circle cx="19" cy="32" r="1.6"/><path d="M44 14c6 3 9 8 10 13l-7 2c-1-4-3-7-6-9z"/>',
    engine: '<rect x="20" y="12" width="24" height="18" rx="3"/><path d="M20 18h24M20 24h24"/><path d="M28 30v8h8v-8"/><path d="M32 38v14"/><circle cx="32" cy="52" r="4"/>',
    transmission: '<path d="' + sprocketPath(32, 32, 16, 21, 14) + '"/><circle cx="32" cy="32" r="7"/>',
    electrical: '<rect x="14" y="20" width="36" height="28" rx="3"/><path d="M20 20v-5h6v5M38 20v-5h6v5"/><path d="M34 26l-6 10h7l-4 8"/>',
    oil: '<path d="M22 22h18l6 6v24H22z"/><path d="M26 22v-6h10v6"/><path d="M46 30l6-4"/><path d="M34 34c-3 4-4 6-4 8a4 4 0 0 0 8 0c0-2-1-4-4-8z"/>',
    tyres: '<circle cx="32" cy="32" r="21"/><circle cx="32" cy="32" r="12"/><circle cx="32" cy="32" r="3"/><path d="M32 11v6M32 47v6M11 32h6M47 32h6M17 17l4 4M43 43l4 4M17 47l4-4M43 21l4-4"/>',
    body: '<path d="M12 40c2-12 12-20 26-20 8 0 14 4 14 10v10z"/><path d="M12 40h40"/><path d="M26 40v-8h14"/>',
    gear: '<path d="M14 38c0-13 8-24 20-24 10 0 16 8 16 18v8H14z"/><path d="M14 38h36v6H14z"/><path d="M30 26h20v8H30z"/>'
  };
  function productArt(p, size) {
    return '<div class="art ' + (size || "") + '">' +
      '<svg viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (ICONS[p.cat] || "") + '</svg>' +
      '<span class="art-brand">' + esc(p.brand) + '</span></div>';
  }
  function stars(avg, count) {
    var full = Math.round(avg), s = "";
    for (var i = 1; i <= 5; i++) s += '<span class="' + (i <= full ? "on" : "") + '">&#9733;</span>';
    return '<span class="stars" title="' + avg.toFixed(1) + ' out of 5">' + s + "</span>" + (count != null ? ' <span class="muted small">(' + count + ")</span>" : "");
  }
  function stockBadge(p) {
    if (p.stock <= 0) return '<span class="badge out">Out of stock</span>';
    if (p.stock <= D.lowStockLimit) return '<span class="badge low">Only ' + p.stock + " left</span>";
    return '<span class="badge in">In stock</span>';
  }

  /* ------------------------------------------------------------------ router */
  function parseHash() {
    var h = location.hash.replace(/^#/, "") || "/";
    var qi = h.indexOf("?");
    var path = qi > -1 ? h.slice(0, qi) : h;
    var params = new URLSearchParams(qi > -1 ? h.slice(qi + 1) : "");
    return { parts: path.split("/").filter(Boolean), params: params };
  }
  function go(hash) { if (location.hash === hash) render(); else location.hash = hash; }
  function qs(obj) {
    var p = new URLSearchParams();
    Object.keys(obj).forEach(function (k) { if (obj[k] !== "" && obj[k] != null) p.set(k, obj[k]); });
    var s = p.toString();
    return s ? "?" + s : "";
  }
  function setMeta(title, desc) {
    document.title = title ? title + " | Mama Auto Parts" : "Mama Auto Parts | Motorcycle Parts & Accessories in Manahari & Hetauda";
    if (desc) $('meta[name="description"]').setAttribute("content", desc);
  }

  var routes = {
    "": viewHome, shop: viewShop, product: viewProduct, cart: viewCart, checkout: viewCheckout, pay: viewPay,
    order: viewOrder, invoice: viewInvoice, track: viewTrack, login: viewLogin, register: viewRegister,
    account: viewAccount, admin: viewAdmin, delivery: viewDelivery, about: viewAbout
  };

  function render() {
    var r = parseHash();
    var view = routes[r.parts[0] || ""] || viewNotFound;
    $("#main-nav").classList.remove("open");
    var html = view(r.parts.slice(1), r.params);
    if (html == null) return; // view redirected
    $("#app").innerHTML = html;
    renderHeader();
    if (!r.params.get("keep")) window.scrollTo(0, 0);
    var after = render.after; render.after = null;
    if (after) after();
  }

  /* ------------------------------------------------------------------ header & shared bits */
  function renderHeader() {
    var u = currentUser(), n = cartCount();
    $("#header-actions").innerHTML =
      (u ? '<a class="hdr-link" href="' + (u.role === "admin" ? "#/admin" : "#/account") + '" title="My account">' +
        '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-7 8-7s8 3 8 7"/></svg>' +
        '<span class="hide-sm">' + (u.role === "admin" ? "Admin" : esc(u.name.split(" ")[0])) + "</span></a>" +
        '<button class="hdr-link linkish hide-sm" data-action="logout">Logout</button>'
        : '<a class="hdr-link" href="#/login"><svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-7 8-7s8 3 8 7"/></svg><span class="hide-sm">Login</span></a>') +
      (u && u.role !== "admin" ? '<a class="hdr-link" href="#/account?tab=wishlist" title="Wishlist"><svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 21s-8-5-8-11a4.5 4.5 0 0 1 8-3 4.5 4.5 0 0 1 8 3c0 6-8 11-8 11z"/></svg></a>' : "") +
      '<a class="hdr-link cart-link" href="#/cart" title="Cart"><svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2"><circle cx="9" cy="20" r="1.5"/><circle cx="18" cy="20" r="1.5"/><path d="M2 3h3l2.7 12.4a2 2 0 0 0 2 1.6h7.6a2 2 0 0 0 2-1.6L21 8H6"/></svg>' +
      (n ? '<span class="cart-count">' + n + "</span>" : "") + "</a>";

    var r = parseHash(), active = r.parts[0] === "shop" ? r.params.get("cat") : null;
    $("#nav-links").innerHTML = '<a href="#/shop"' + (r.parts[0] === "shop" && !active ? ' class="active"' : "") + '>All Parts</a>' +
      D.categories.map(function (c) {
        return '<a href="#/shop?cat=' + c.id + '"' + (active === c.id ? ' class="active"' : "") + ">" + esc(c.short || c.name) + "</a>";
      }).join("");

    var sq = $('form[data-form="search"] input');
    if (document.activeElement !== sq) sq.value = r.parts[0] === "shop" ? (r.params.get("q") || "") : "";

    var g = r.parts[0] === "admin" ? null : getGarage();
    $("#garage-bar").innerHTML = g ?
      '<div class="wrap"><span>Your bike: <b>' + esc(MODELS[g] ? MODELS[g].full : g) + '</b></span>' +
      '<a href="#/shop?model=' + esc(g) + '">Show parts for this bike</a><button class="linkish" data-action="clear-garage">Change</button></div>' : "";
    $("#garage-bar").style.display = g ? "" : "none";
  }

  function productCard(p) {
    var r = rating(p.id), g = getGarage();
    var fit = g ? (fitsModel(p, g) ? '<span class="fit yes">&#10003; Fits your ' + esc(MODELS[g].name) + "</span>" : '<span class="fit no">Does not fit your bike</span>') : "";
    return '<article class="card">' +
      '<a href="#/product/' + p.id + '" class="card-img">' + productArt(p) + (p.oldPrice ? '<span class="sale">Sale</span>' : "") + "</a>" +
      '<div class="card-body">' +
      '<div class="card-cat">' + esc(catById(p.cat).name) + "</div>" +
      '<h3><a href="#/product/' + p.id + '">' + esc(p.name) + "</a></h3>" +
      '<div class="card-brand">' + esc(p.brand) + "</div>" +
      (r.count ? stars(r.avg, r.count) : '<span class="muted small">No reviews yet</span>') +
      fit +
      '<div class="price-row"><span class="price">' + npr(p.price) + "</span>" + (p.oldPrice ? '<s class="old">' + npr(p.oldPrice) + "</s>" : "") + "</div>" +
      '<div class="card-foot">' + stockBadge(p) +
      '<button class="btn sm" data-action="add-cart" data-id="' + p.id + '"' + (p.stock <= 0 ? " disabled" : "") + ">Add to cart</button></div>" +
      "</div></article>";
  }

  function bikeFinder(compact) {
    var g = getGarage(), gb = g && MODELS[g] ? MODELS[g].brand : "";
    return '<form class="finder' + (compact ? " compact" : "") + '" data-form="finder">' +
      (compact ? "" : "<h2>Find parts for your bike</h2><p>Choose your motorcycle and we will only show parts that fit.</p>") +
      '<div class="finder-row">' +
      '<label><span>Brand</span><select name="brand" data-action-change="finder-brand" required><option value="">Select brand</option>' +
      D.bikes.map(function (b) { return '<option' + (b.brand === gb ? " selected" : "") + ">" + esc(b.brand) + "</option>"; }).join("") + "</select></label>" +
      '<label><span>Model</span><select name="model" required>' + modelOptions(gb, g) + "</select></label>" +
      '<label><span>Part type</span><select name="cat"><option value="">All part types</option>' +
      D.categories.map(function (c) { return '<option value="' + c.id + '">' + esc(c.name) + "</option>"; }).join("") + "</select></label>" +
      '<button class="btn" type="submit">Find parts</button></div>' +
      '<label class="check"><input type="checkbox" name="remember" checked> Remember my bike</label></form>';
  }
  function modelOptions(brand, selected) {
    if (!brand) return '<option value="">Select brand first</option>';
    return '<option value="">Select model</option>' + modelsOfBrand(brand).map(function (m) {
      return '<option value="' + m.id + '"' + (m.id === selected ? " selected" : "") + ">" + esc(m.name) + "</option>";
    }).join("");
  }

  /* ------------------------------------------------------------------ pages: home */
  var LOGO = '<a href="#/" class="logo"><svg class="logo-mark" viewBox="0 0 40 40" aria-hidden="true"><circle cx="20" cy="20" r="13" fill="none" stroke="currentColor" stroke-width="6" stroke-dasharray="4.2 2.6"/><circle cx="20" cy="20" r="4.5" fill="currentColor"/></svg>' +
    '<span class="logo-text"><b>MAMA</b> AUTO PARTS<small>Bike parts &amp; accessories</small></span></a>';
  var STRIP_ICONS = {
    truck: '<path d="M2 7h12v9H2zM14 10h4l3 3v3h-7z"/><circle cx="6" cy="17.5" r="1.8"/><circle cx="17" cy="17.5" r="1.8"/>',
    cash: '<rect x="2" y="6" width="20" height="12" rx="1"/><circle cx="12" cy="12" r="3"/><path d="M5 9v6M19 9v6"/>',
    back: '<path d="M4 10h11a5 5 0 0 1 0 10h-3"/><path d="M8 6 4 10l4 4"/>',
    phone: '<path d="M5 3h4l2 5-2.5 1.5a11 11 0 0 0 6 6L16 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 5a2 2 0 0 1 2-2"/>'
  };
  function stripItem(icon, title, text) {
    return '<div><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">' + STRIP_ICONS[icon] + "</svg><p style=\"margin:0\"><b>" + title + "</b><span>" + text + "</span></p></div>";
  }

  function viewHome() {
    setMeta("", "Buy genuine motorcycle parts online. Home delivery in Manahari and Hetauda. Pay with eSewa, Khalti or cash on delivery.");
    var featured = db.products.slice().sort(function (a, b) { return (b.sold || 0) - (a.sold || 0); }).slice(0, 8);
    var deals = db.products.filter(function (p) { return p.oldPrice; });
    return '<section class="hero"><div class="wrap hero-grid">' +
      '<div class="hero-text">' +
      "<h1>Bike parts delivered to your door in Manahari and Hetauda</h1>" +
      "<p>Brake pads, chain kits, batteries, tyres, engine oil and riding gear for Bajaj, Honda, Yamaha, TVS, Hero and Royal Enfield. " +
      "Not sure what fits? Tell us your bike and we will only show parts made for it.</p>" +
      '<span class="hero-note">Free delivery on orders above Rs. 5,000</span>' +
      '<div class="hero-btns"><a class="btn lg" href="#/shop">Browse all parts</a><a class="btn lg ghost" href="#/track">Track my order</a></div></div>' +
      '<div class="hero-finder" id="finder">' + bikeFinder(false) + "</div></div></section>" +

      '<div class="wrap"><div class="strip">' +
      stripItem("truck", "Same day delivery", "Manahari Rs. 50, Hetauda Rs. 100-250") +
      stripItem("cash", "Cash on delivery", "Or pay with eSewa / Khalti") +
      stripItem("back", "7 day return", "If the part does not fit your bike") +
      stripItem("phone", "Need help?", "Call 980-0000000") +
      "</div></div>" +

      '<section class="wrap section"><div class="sec-head"><h2>Shop by category</h2><a href="#/shop">All parts</a></div><div class="cat-grid">' +
      D.categories.map(function (c) {
        var n = db.products.filter(function (p) { return p.cat === c.id; }).length;
        return '<a class="cat-tile" href="#/shop?cat=' + c.id + '">' +
          '<svg viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round">' + ICONS[c.id] + "</svg>" +
          "<div><b>" + esc(c.name) + '</b><span>' + n + " items</span></div></a>";
      }).join("") + "</div></section>" +

      '<section class="wrap section"><div class="sec-head"><h2>Parts by bike brand</h2></div><div class="brand-row">' +
      D.bikes.map(function (b) { return '<a class="brand-chip" href="#/shop?brand=' + encodeURIComponent(b.brand) + '">' + esc(b.brand) + "</a>"; }).join("") +
      "</div></section>" +

      '<section class="wrap section"><div class="sec-head"><h2>Most bought</h2><a href="#/shop">See more</a></div><div class="grid">' +
      featured.map(productCard).join("") + "</div></section>" +

      (deals.length ? '<section class="wrap section"><div class="sec-head"><h2>Offers this week</h2></div><div class="grid">' + deals.map(productCard).join("") + "</div></section>" : "");
  }

  /* ------------------------------------------------------------------ pages: shop */
  function viewShop(_, params) {
    var q = clean(params.get("q")).toLowerCase(), cat = params.get("cat") || "", brand = params.get("brand") || "",
      model = params.get("model") || "", min = params.get("min") || "", max = params.get("max") || "",
      instock = params.get("instock") === "1", sort = params.get("sort") || "popular";
    if (model && MODELS[model] && !brand) brand = MODELS[model].brand;

    var list = db.products.filter(function (p) {
      if (cat && p.cat !== cat) return false;
      if (model && !fitsModel(p, model)) return false;
      if (!model && brand && !fitsBrand(p, brand)) return false;
      if (min && p.price < Number(min)) return false;
      if (max && p.price > Number(max)) return false;
      if (instock && p.stock <= 0) return false;
      if (q) {
        var hay = [p.name, p.brand, p.sku, catById(p.cat).name, p.desc, fitsText(p)].join(" ").toLowerCase();
        return q.split(/\s+/).every(function (w) { return hay.indexOf(w) > -1; });
      }
      return true;
    });
    var sorters = {
      popular: function (a, b) { return (b.sold || 0) - (a.sold || 0); },
      "price-asc": function (a, b) { return a.price - b.price; },
      "price-desc": function (a, b) { return b.price - a.price; },
      newest: function (a, b) { return a.createdAt < b.createdAt ? 1 : -1; },
      rating: function (a, b) { return rating(b.id).avg - rating(a.id).avg; }
    };
    list.sort(sorters[sort] || sorters.popular);

    var title = q ? 'Results for "' + params.get("q") + '"' : model && MODELS[model] ? "Parts for " + MODELS[model].full :
      cat ? catById(cat).name : brand ? brand + " parts" : "All motorcycle parts";
    setMeta(title, "Shop " + title.toLowerCase() + " online at Mama Auto Parts, Manahari.");

    var cur = { q: params.get("q") || "", cat: cat, brand: brand, model: model, min: min, max: max, instock: instock ? "1" : "", sort: sort };
    function link(changes) { var o = {}; for (var k in cur) o[k] = cur[k]; for (var c in changes) o[c] = changes[c]; if (o.sort === "popular") o.sort = ""; return "#/shop" + qs(o); }
    var chips = [];
    if (cur.q) chips.push(['Search: "' + cur.q + '"', link({ q: "" })]);
    if (cat) chips.push([catById(cat).name, link({ cat: "" })]);
    if (brand) chips.push([brand, link({ brand: "", model: "" })]);
    if (model && MODELS[model]) chips.push([MODELS[model].name, link({ model: "" })]);
    if (min || max) chips.push(["Price: " + (min || 0) + " - " + (max || "any"), link({ min: "", max: "" })]);
    if (instock) chips.push(["In stock only", link({ instock: "" })]);

    return '<div class="wrap page"><nav class="crumbs"><a href="#/">Home</a> / <span>Shop</span></nav>' +
      '<div class="shop-layout"><aside class="filters" id="filters"><form data-form="filters">' +
      '<input type="hidden" name="q" value="' + esc(cur.q) + '"><input type="hidden" name="sort" value="' + esc(sort) + '">' +
      '<h3>Filter</h3>' +
      '<label class="fl"><span>Part type</span><select name="cat" data-autosubmit><option value="">All part types</option>' +
      D.categories.map(function (c) { return '<option value="' + c.id + '"' + (c.id === cat ? " selected" : "") + ">" + esc(c.name) + "</option>"; }).join("") + "</select></label>" +
      '<label class="fl"><span>Bike brand</span><select name="brand" data-autosubmit data-reset-model><option value="">All brands</option>' +
      D.bikes.map(function (b) { return "<option" + (b.brand === brand ? " selected" : "") + ">" + esc(b.brand) + "</option>"; }).join("") + "</select></label>" +
      '<label class="fl"><span>Bike model</span><select name="model" data-autosubmit' + (brand ? "" : " disabled") + '>' +
      (brand ? '<option value="">All ' + esc(brand) + " models</option>" + modelsOfBrand(brand).map(function (m) {
        return '<option value="' + m.id + '"' + (m.id === model ? " selected" : "") + ">" + esc(m.name) + "</option>"; }).join("") : '<option value="">Choose a brand first</option>') +
      "</select></label>" +
      '<div class="fl"><span>Price (Rs.)</span><div class="price-inputs"><input type="number" name="min" min="0" placeholder="Min" value="' + esc(min) + '"><span>to</span><input type="number" name="max" min="0" placeholder="Max" value="' + esc(max) + '"></div></div>' +
      '<label class="check"><input type="checkbox" name="instock" value="1" data-autosubmit' + (instock ? " checked" : "") + "> In stock only</label>" +
      '<button class="btn block" type="submit">Apply filters</button>' +
      '<a class="btn ghost block" href="#/shop">Clear all</a>' +
      "</form></aside>" +
      '<section class="shop-main"><div class="shop-top"><div><h1>' + esc(title) + '</h1><span class="muted">' + list.length + " product" + (list.length === 1 ? "" : "s") + "</span></div>" +
      '<div class="shop-tools"><button class="btn ghost sm show-sm" data-action="toggle-filters">Filters</button>' +
      '<label class="sort"><span class="hide-sm">Sort by</span><select data-action-change="sort">' +
      [["popular", "Most popular"], ["price-asc", "Price: low to high"], ["price-desc", "Price: high to low"], ["newest", "Newest"], ["rating", "Top rated"]].map(function (o) {
        return '<option value="' + o[0] + '"' + (o[0] === sort ? " selected" : "") + ">" + o[1] + "</option>"; }).join("") +
      "</select></label></div></div>" +
      (chips.length ? '<div class="chips">' + chips.map(function (c) { return '<a class="chip" href="' + c[1] + '">' + esc(c[0]) + " &times;</a>"; }).join("") + "</div>" : "") +
      (list.length ? '<div class="grid">' + list.map(productCard).join("") + "</div>" :
        '<div class="empty"><h3>No parts found</h3><p>Try a different search or remove some filters.</p><a class="btn" href="#/shop">See all parts</a></div>') +
      "</section></div></div>";
  }

  /* ------------------------------------------------------------------ pages: product */
  function viewProduct(parts) {
    var p = findProduct(parts[0]);
    if (!p) return viewNotFound();
    setMeta(p.name + " - " + p.brand, p.desc);
    var r = rating(p.id), u = currentUser(), g = getGarage();
    var revs = productReviews(p.id).sort(function (a, b) { return a.date < b.date ? 1 : -1; });
    var inWish = u && u.wishlist.indexOf(p.id) > -1;
    var related = db.products.filter(function (x) { return x.cat === p.cat && x.id !== p.id; }).slice(0, 4);
    var already = u && revs.some(function (x) { return x.userId === u.id; });
    var fitBox = g ? (fitsModel(p, g) ? '<div class="fitbox yes">&#10003; This part fits your <b>' + esc(MODELS[g].full) + "</b></div>" :
      '<div class="fitbox no">&#9888; This part does not fit your <b>' + esc(MODELS[g].full) + '</b>. <a href="#/shop?model=' + g + "&cat=" + p.cat + '">See ' + esc(catById(p.cat).name.toLowerCase()) + " that fit</a></div>") :
      '<form class="fitcheck" data-form="fitcheck" data-id="' + p.id + '"><b>Will it fit my bike?</b><select name="model" required><option value="">Choose your bike</option>' +
      D.bikes.map(function (b) { return '<optgroup label="' + esc(b.brand) + '">' + b.models.map(function (m) { return '<option value="' + m.id + '">' + esc(m.name) + "</option>"; }).join("") + "</optgroup>"; }).join("") +
      '</select><button class="btn sm" type="submit">Check</button></form>';

    return '<div class="wrap page"><nav class="crumbs"><a href="#/">Home</a> / <a href="#/shop?cat=' + p.cat + '">' + esc(catById(p.cat).name) + "</a> / <span>" + esc(p.name) + "</span></nav>" +
      '<div class="pdp"><div class="pdp-img">' + productArt(p, "big") + "</div>" +
      '<div class="pdp-info"><div class="card-cat">' + esc(catById(p.cat).name) + " &middot; SKU " + esc(p.sku) + "</div>" +
      "<h1>" + esc(p.name) + "</h1>" +
      '<div class="pdp-brand">Brand: <b>' + esc(p.brand) + "</b></div>" +
      '<div class="pdp-rating">' + (r.count ? stars(r.avg, null) + " " + r.avg.toFixed(1) + ' <a href="#reviews" data-action="scroll-reviews">(' + r.count + " review" + (r.count > 1 ? "s" : "") + ")</a>" : '<span class="muted">No reviews yet</span>') + "</div>" +
      '<div class="price-row big"><span class="price">' + npr(p.price) + "</span>" + (p.oldPrice ? '<s class="old">' + npr(p.oldPrice) + '</s><span class="save">Save ' + npr(p.oldPrice - p.price) + "</span>" : "") + "</div>" +
      '<div class="muted small">Price includes VAT</div>' +
      stockBadge(p) + fitBox +
      '<div class="buy-row"><div class="qty"><button data-action="qty-dec" aria-label="Decrease">&minus;</button><input id="pdp-qty" type="number" min="1" max="' + Math.max(1, p.stock) + '" value="1" aria-label="Quantity"><button data-action="qty-inc" aria-label="Increase">+</button></div>' +
      '<button class="btn lg" data-action="add-cart" data-id="' + p.id + '" data-qty-from="#pdp-qty"' + (p.stock <= 0 ? " disabled" : "") + ">Add to cart</button>" +
      '<button class="btn lg ghost" data-action="buy-now" data-id="' + p.id + '"' + (p.stock <= 0 ? " disabled" : "") + ">Buy now</button>" +
      '<button class="icon-btn wish' + (inWish ? " on" : "") + '" data-action="wish" data-id="' + p.id + '" title="' + (inWish ? "Remove from wishlist" : "Add to wishlist") + '"><svg viewBox="0 0 24 24" width="22" height="22" stroke="currentColor" stroke-width="2"><path d="M12 21s-8-5-8-11a4.5 4.5 0 0 1 8-3 4.5 4.5 0 0 1 8 3c0 6-8 11-8 11z"/></svg></button></div>' +
      '<ul class="perks"><li>Same day delivery in Manahari and Hetauda</li><li>Pay with eSewa, Khalti or cash on delivery</li><li>7 day return if the part does not fit</li></ul>' +
      "</div></div>" +

      '<div class="pdp-tabs"><section><h2>Description</h2><p>' + esc(p.desc) + "</p></section>" +
      "<section><h2>Specifications</h2><table class=\"specs\"><tbody>" +
      "<tr><th>Brand</th><td>" + esc(p.brand) + "</td></tr><tr><th>SKU</th><td>" + esc(p.sku) + "</td></tr>" +
      Object.keys(p.specs || {}).map(function (k) { return "<tr><th>" + esc(k) + "</th><td>" + esc(p.specs[k]) + "</td></tr>"; }).join("") +
      "</tbody></table></section>" +
      '<section><h2>Compatible bikes</h2><div class="compat">' +
      (p.fits.indexOf("universal") > -1 ? '<span class="chip">Universal - fits most motorcycles</span>' :
        p.fits.map(function (m) { return MODELS[m] ? '<a class="chip" href="#/shop?model=' + m + '">' + esc(MODELS[m].full) + "</a>" : ""; }).join("")) +
      "</div></section></div>" +

      '<section class="reviews" id="reviews"><h2>Customer reviews</h2><div class="rev-layout"><div class="rev-summary">' +
      (r.count ? '<div class="big-rating">' + r.avg.toFixed(1) + "</div>" + stars(r.avg, null) + '<div class="muted">' + r.count + " review" + (r.count > 1 ? "s" : "") + "</div>" + ratingBars(revs) : '<p class="muted">Be the first to review this product.</p>') +
      "</div><div>" +
      (u ? (already ? '<p class="note">You have already reviewed this product. Thank you!</p>' :
        '<form class="rev-form" data-form="review" data-id="' + p.id + '"><h3>Write a review</h3>' +
        '<div class="star-input" role="radiogroup" aria-label="Rating">' + [5, 4, 3, 2, 1].map(function (n) {
          return '<input type="radio" name="rating" id="rs' + n + '" value="' + n + '"' + (n === 5 ? " checked" : "") + '><label for="rs' + n + '" title="' + n + ' stars">&#9733;</label>'; }).join("") + "</div>" +
        '<textarea name="text" rows="3" maxlength="500" required placeholder="How was the quality and fit?"></textarea>' +
        '<button class="btn" type="submit">Submit review</button></form>') :
        '<p class="note"><a href="#/login?next=' + encodeURIComponent("#/product/" + p.id) + '">Log in</a> to write a review.</p>') +
      (revs.length ? revs.map(function (x) {
        var verified = db.orders.some(function (o) { return o.userId === x.userId && o.items.some(function (i) { return i.pid === p.id; }); });
        return '<div class="rev"><div class="rev-head">' + stars(x.rating, null) + " <b>" + esc(x.name) + "</b>" +
          (verified ? '<span class="badge in">Verified purchase</span>' : "") + '<span class="muted small">' + fmtDate(x.date) + "</span></div><p>" + esc(x.text) + "</p></div>";
      }).join("") : "") +
      "</div></div></section>" +

      (related.length ? '<section class="section"><div class="sec-head"><h2>Related products</h2></div><div class="grid">' + related.map(productCard).join("") + "</div></section>" : "") +
      "</div>";
  }
  function ratingBars(revs) {
    var out = "";
    for (var n = 5; n >= 1; n--) {
      var c = revs.filter(function (r) { return r.rating === n; }).length;
      out += '<div class="rbar"><span>' + n + ' &#9733;</span><div><i style="width:' + (revs.length ? c / revs.length * 100 : 0) + '%"></i></div><span>' + c + "</span></div>";
    }
    return out;
  }

  /* ------------------------------------------------------------------ pages: cart */
  function viewCart() {
    setMeta("Your cart");
    var lines = cartLines(), t = cartTotals();
    if (!lines.length) return '<div class="wrap page"><div class="empty"><h1>Your cart is empty</h1><p>Find the parts you need and add them here.</p><a class="btn" href="#/shop">Start shopping</a></div></div>';
    var need = D.freeDeliveryAbove - t.sub;
    return '<div class="wrap page"><h1>Shopping cart</h1><div class="cart-layout"><div class="cart-items">' +
      lines.map(function (l) {
        return '<div class="cart-line">' + '<a href="#/product/' + l.p.id + '" class="cl-img">' + productArt(l.p, "sm") + "</a>" +
          '<div class="cl-info"><a href="#/product/' + l.p.id + '"><b>' + esc(l.p.name) + "</b></a><span class=\"muted small\">" + esc(l.p.brand) + " &middot; " + esc(l.p.sku) + "</span>" +
          (l.qty > l.p.stock ? '<span class="err small">Only ' + l.p.stock + " in stock</span>" : "") + "</div>" +
          '<div class="qty"><button data-action="cart-dec" data-id="' + l.p.id + '" aria-label="Decrease">&minus;</button><input type="number" value="' + l.qty + '" min="1" max="' + l.p.stock + '" data-action-change="cart-qty" data-id="' + l.p.id + '" aria-label="Quantity"><button data-action="cart-inc" data-id="' + l.p.id + '" aria-label="Increase">+</button></div>' +
          '<div class="cl-price">' + npr(l.p.price * l.qty) + (l.qty > 1 ? '<span class="muted small">' + npr(l.p.price) + " each</span>" : "") + "</div>" +
          '<button class="icon-btn" data-action="cart-remove" data-id="' + l.p.id + '" title="Remove">&times;</button></div>';
      }).join("") + '<a href="#/shop">&larr; Continue shopping</a></div>' +
      '<aside class="summary"><h2>Order summary</h2><div class="sum-row"><span>Subtotal (' + cartCount() + " items)</span><b>" + npr(t.sub) + "</b></div>" +
      '<div class="sum-row"><span>Delivery</span><span class="muted">Calculated at checkout</span></div>' +
      (need > 0 ? '<div class="note small">Add ' + npr(need) + " more for free delivery.</div>" : '<div class="note ok small">You get free delivery!</div>') +
      '<div class="sum-row total"><span>Total</span><b>' + npr(t.sub) + "</b></div>" +
      '<a class="btn block lg" href="#/checkout">Proceed to checkout</a></aside></div></div>';
  }

  /* ------------------------------------------------------------------ pages: checkout */
  function viewCheckout(_, params) {
    setMeta("Checkout");
    var lines = cartLines();
    if (!lines.length) { go("#/cart"); return null; }
    var u = currentUser(), area = params.get("area") || (u && u.area) || "manahari", t = cartTotals(area);
    var city = area === "manahari" ? "manahari" : "hetauda", a = isArea(area) ? areaById(area) : null;
    return '<div class="wrap page"><h1>Checkout</h1>' +
      (u ? "" : '<div class="note">Already have an account? <a href="#/login?next=' + encodeURIComponent("#/checkout") + '">Log in</a> for faster checkout and order history. Or continue as a guest below.</div>') +
      '<form class="checkout" data-form="checkout" novalidate><div class="co-main">' +
      '<section class="box"><h2><span class="step">1</span> Delivery details</h2><div class="form-grid">' +
      field("name", "Full name", u ? u.name : "", "text", true) +
      field("phone", "Mobile number", u ? u.phone : "", "tel", true, 'pattern="9[678][0-9]{8}" placeholder="98XXXXXXXX"') +
      field("email", "Email (for order updates)", u ? u.email : "", "email", true) +
      '<label class="fld"><span>City *</span><select name="city" data-action-change="co-city">' +
      '<option value="manahari"' + (city === "manahari" ? " selected" : "") + ">Manahari</option>" +
      '<option value="hetauda"' + (city === "hetauda" ? " selected" : "") + ">Hetauda</option></select></label>" +
      (city === "hetauda" ?
        '<label class="fld"><span>Ward *</span><select name="area" data-action-change="co-area">' + wardOptions(area) + "</select></label>" :
        '<input type="hidden" name="area" value="manahari"><div class="fld"><span>Ward</span><div class="fake-input">Anywhere in Manahari</div></div>') +
      '<div class="delivery-info wide">' + deliveryInfo(a, t) + "</div>" +
      '<label class="fld wide"><span>Full address *</span><input name="address" required value="' + esc(u ? u.address : "") + '" placeholder="Tole, ward no. and a landmark, e.g. Manahari-5, near the bazaar"></label>' +
      '<label class="fld wide"><span>Note for delivery (optional)</span><input name="note" placeholder="e.g. call before coming"></label>' +
      "</div></section>" +
      '<section class="box"><h2><span class="step">2</span> Payment method</h2><div class="pay-options">' +
      payOption("esewa", "eSewa", "Pay instantly from your eSewa wallet", true) +
      payOption("khalti", "Khalti", "Pay with Khalti wallet, mobile or internet banking") +
      payOption("cod", "Cash on Delivery", "Pay in cash when the part reaches you") +
      "</div></section></div>" +
      '<aside class="summary"><h2>Your order</h2>' +
      lines.map(function (l) { return '<div class="sum-item"><span>' + esc(l.p.name) + ' <span class="muted">&times; ' + l.qty + "</span></span><span>" + npr(l.p.price * l.qty) + "</span></div>"; }).join("") +
      '<div class="sum-row"><span>Subtotal</span><span>' + npr(t.sub) + "</span></div>" +
      '<div class="sum-row"><span>Delivery<br><span class="muted small">' + (a ? (a.ward ? "Hetauda, Ward " + a.ward + " &middot; Zone " + a.zone : "Manahari") : "Choose your ward") + "</span></span><span>" +
      (!a ? '<span class="muted">&ndash;</span>' : t.fee ? npr(t.fee) : '<b class="ok">FREE</b>') + "</span></div>" +
      '<div class="sum-row total"><span>Total</span><b>' + npr(t.total) + "</b></div>" +
      '<button class="btn block lg" type="submit">Place order</button>' +
      '<p class="muted small center">&#128274; Your details are sent over a secure connection.</p></aside></form></div>';
  }
  function field(name, label, val, type, req, extra) {
    return '<label class="fld"><span>' + esc(label) + (req ? " *" : "") + '</span><input name="' + name + '" type="' + (type || "text") + '" value="' + esc(val) + '"' + (req ? " required" : "") + " " + (extra || "") + "></label>";
  }
  function payOption(id, name, desc, checked) {
    return '<label class="pay-opt"><input type="radio" name="method" value="' + id + '"' + (checked ? " checked" : "") + '><span class="pay-badge ' + id + '">' + name + "</span><span>" + desc + "</span></label>";
  }

  /* ------------------------------------------------------------------ pages: simulated payment gateway */
  function viewPay(parts) {
    var o = findOrder(parts[0]);
    if (!o) return viewNotFound();
    setMeta("Payment");
    if (o.payment.method === "cod" || o.payment.status !== "Awaiting payment" || o.status === "Cancelled") { go("#/order/" + o.id); return null; }
    var gw = o.payment.method, name = PAY_NAMES[gw];
    return '<div class="wrap page narrow"><div class="gateway ' + gw + '">' +
      '<div class="gw-head"><span class="pay-badge ' + gw + '">' + name + '</span><span class="gw-test">SANDBOX / TEST MODE</span></div>' +
      '<p class="muted small">This is the ' + name + ' payment step in sandbox (test) mode. No real money is taken. With the live merchant account the customer is sent to ' + name + "'s own secure page.</p>" +
      '<div class="gw-amount"><span>Paying to</span><b>Mama Auto Parts</b><span>Order</span><b>' + esc(o.id) + '</b><span>Amount</span><b class="big">' + npr(o.total) + "</b></div>" +
      '<div class="gw-btns"><button class="btn lg block" data-action="pay-confirm" data-id="' + o.id + '">Confirm test payment</button>' +
      '<button class="btn ghost block" data-action="pay-cancel" data-id="' + o.id + '">Cancel payment</button></div></div></div>';
  }

  /* ------------------------------------------------------------------ pages: order confirmation & tracking */
  function canSeeOrder(o, params) {
    var u = currentUser();
    if (u && (u.role === "admin" || o.userId === u.id)) return true;
    var ok = store.get("map_guest_orders", []);
    return ok.indexOf(o.id) > -1 || (params && params.get("phone") === o.customer.phone);
  }
  function viewOrder(parts, params) {
    var o = findOrder(parts[0]);
    if (!o || !canSeeOrder(o, params)) return viewNotFound("We could not find that order. Check the order ID or use Track Order.");
    setMeta("Order " + o.id);
    var fresh = params.get("new") === "1";
    var cancellable = (o.status === "Pending" || o.status === "Processing") && !isAdmin();
    return '<div class="wrap page narrow">' +
      (fresh ? '<div class="success-banner"><div class="tick">&#10003;</div><div><h1>Thank you, your order is placed!</h1><p>Order ID <b>' + esc(o.id) + "</b>. A confirmation has been sent to " + esc(o.customer.email) + ".</p></div></div>" :
        "<h1>Order " + esc(o.id) + "</h1>") +
      (o.payment.status === "Awaiting payment" && o.status !== "Cancelled" ? '<div class="note warn">Payment for this order is not complete. <button class="btn sm" data-action="pay-retry" data-id="' + o.id + '">Pay with ' + PAY_NAMES[o.payment.method] + '</button> <button class="btn sm ghost" data-action="pay-cod" data-id="' + o.id + '">Switch to cash on delivery</button></div>' : "") +
      tracker(o) +
      '<div class="order-grid"><section class="box"><h2>Items</h2>' +
      o.items.map(function (i) { return '<div class="sum-item"><span><a href="#/product/' + i.pid + '">' + esc(i.name) + '</a> <span class="muted">&times; ' + i.qty + "</span></span><span>" + npr(i.price * i.qty) + "</span></div>"; }).join("") +
      '<div class="sum-row"><span>Subtotal</span><span>' + npr(o.subtotal) + '</span></div><div class="sum-row"><span>Delivery</span><span>' + (o.delivery ? npr(o.delivery) : "FREE") + "</span></div>" +
      '<div class="sum-row total"><span>Total</span><b>' + npr(o.total) + "</b></div></section>" +
      '<section class="box"><h2>Details</h2><dl class="dl">' +
      "<dt>Placed on</dt><dd>" + fmtDate(o.createdAt, true) + "</dd>" +
      "<dt>Deliver to</dt><dd>" + esc(o.customer.name) + "<br>" + esc(o.address) + "<br>" + esc(areaById(o.area).name) + "<br>" + esc(o.customer.phone) + "</dd>" +
      (o.note ? "<dt>Delivery note</dt><dd>" + esc(o.note) + "</dd>" : "") +
      "<dt>Payment</dt><dd>" + PAY_NAMES[o.payment.method] + " &middot; " + payStatusBadge(o) + (o.payment.txn ? '<br><span class="muted small">Txn: ' + esc(o.payment.txn) + "</span>" : "") + "</dd>" +
      "</dl>" +
      '<div class="btn-row"><a class="btn ghost sm" href="#/invoice/' + o.id + '">View / print invoice</a>' +
      (cancellable ? '<button class="btn ghost sm danger" data-action="cancel-order" data-id="' + o.id + '">Cancel order</button>' : "") + "</div></section></div>" +
      '<p><a href="#/shop">&larr; Continue shopping</a></p></div>';
  }
  function payStatusBadge(o) {
    var s = o.payment.status, cls = s === "Paid" ? "in" : s === "Refunded" ? "low" : s === "Awaiting payment" ? "out" : "neutral";
    return '<span class="badge ' + cls + '">' + esc(s) + "</span>";
  }
  function tracker(o) {
    if (o.status === "Cancelled") return '<div class="tracker cancelled"><b>This order was cancelled</b> on ' + fmtDate(o.history[o.history.length - 1].date, true) + ".</div>";
    var idx = STATUS_FLOW.indexOf(o.status);
    return '<ol class="tracker">' + STATUS_FLOW.map(function (s, i) {
      var h = o.history.filter(function (x) { return x.status === s; })[0];
      var labels = { Pending: "Order placed", Processing: "Packed", Shipped: "On the way", Delivered: "Delivered" };
      return '<li class="' + (i <= idx ? "done" : "") + (i === idx ? " current" : "") + '"><span class="dot">' + (i < idx || o.status === "Delivered" ? "&#10003;" : i + 1) + "</span><b>" + labels[s] + "</b>" +
        (h ? '<span class="muted small">' + fmtDate(h.date, true) + "</span>" : "") + "</li>";
    }).join("") + "</ol>";
  }
  function viewTrack(_, params) {
    setMeta("Track your order", "Track your Mama Auto Parts order with your order ID and phone number.");
    var id = clean(params.get("id")).toUpperCase(), phone = clean(params.get("phone")), res = "";
    if (id) {
      var o = findOrder(id);
      res = o && o.customer.phone === phone ? '<div class="box"><h2>' + esc(o.id) + " &middot; " + esc(o.status) + "</h2>" + tracker(o) + '<a class="btn sm" href="#/order/' + o.id + "?phone=" + encodeURIComponent(phone) + '">See full order</a></div>' :
        '<div class="note warn">No order found with that ID and phone number. Please check and try again.</div>';
    }
    return '<div class="wrap page narrow"><h1>Track your order</h1><p class="muted">Enter the order ID from your confirmation email and the phone number used at checkout.</p>' +
      '<form class="box form-grid" data-form="track">' + field("id", "Order ID", id, "text", true, 'placeholder="MAP-1001"') + field("phone", "Phone number", phone, "tel", true) +
      '<button class="btn" type="submit">Track</button></form>' + res + "</div>";
  }

  /* ------------------------------------------------------------------ pages: invoice */
  function viewInvoice(parts) {
    var o = findOrder(parts[0]);
    if (!o || !canSeeOrder(o)) return viewNotFound();
    setMeta("Invoice " + o.id);
    return '<div class="wrap page narrow"><div class="no-print btn-row"><button class="btn" data-action="print">Print invoice</button><a class="btn ghost" href="' + (isAdmin() ? "#/admin?tab=orders" : "#/order/" + o.id) + '">Back</a></div>' +
      '<div class="invoice"><div class="inv-head"><div>' + LOGO +
      '<p class="small">Bhundrung, Manahari-3, Makawanpur<br>Phone: 980-0000000 &middot; PAN: 600000000</p></div>' +
      '<div class="right"><h2>TAX INVOICE</h2><p class="small">Invoice no: INV-' + esc(o.id.replace("MAP-", "")) + "<br>Order: " + esc(o.id) + "<br>Date: " + fmtDate(o.createdAt) + "</p></div></div>" +
      '<div class="inv-to"><b>Bill to</b><br>' + esc(o.customer.name) + "<br>" + esc(o.address) + ", " + esc(areaById(o.area).name) + "<br>" + esc(o.customer.phone) + "</div>" +
      '<table class="table"><thead><tr><th>#</th><th>Item</th><th>SKU</th><th class="r">Qty</th><th class="r">Rate</th><th class="r">Amount</th></tr></thead><tbody>' +
      o.items.map(function (i, n) { return "<tr><td>" + (n + 1) + "</td><td>" + esc(i.name) + "</td><td>" + esc(i.sku || "") + '</td><td class="r">' + i.qty + '</td><td class="r">' + npr(i.price) + '</td><td class="r">' + npr(i.price * i.qty) + "</td></tr>"; }).join("") +
      '</tbody><tfoot><tr><td colspan="5" class="r">Subtotal</td><td class="r">' + npr(o.subtotal) + '</td></tr><tr><td colspan="5" class="r">Delivery</td><td class="r">' + npr(o.delivery) + '</td></tr>' +
      '<tr class="total"><td colspan="5" class="r">Grand total (incl. VAT)</td><td class="r">' + npr(o.total) + "</td></tr></tfoot></table>" +
      '<p class="small">Payment: ' + PAY_NAMES[o.payment.method] + " (" + esc(o.payment.status) + ")" + (o.payment.txn ? " &middot; Txn " + esc(o.payment.txn) : "") + "</p>" +
      '<p class="small muted">Thank you for shopping with Mama Auto Parts. Parts that do not fit can be returned within 7 days in original packing.</p></div></div>';
  }

  /* ------------------------------------------------------------------ pages: login / register */
  function viewLogin(_, params) {
    setMeta("Login");
    if (currentUser()) { go(isAdmin() ? "#/admin" : "#/account"); return null; }
    return '<div class="wrap page auth"><div class="box"><h1>Log in</h1><p class="muted">Welcome back! Log in to see your orders and wishlist.</p>' +
      '<form data-form="login" data-next="' + esc(params.get("next") || "") + '" class="stack">' +
      field("email", "Email", "", "email", true, 'autocomplete="username"') +
      field("password", "Password", "", "password", true, 'autocomplete="current-password"') +
      '<p class="err small" id="login-err" hidden></p>' +
      '<button class="btn block lg" type="submit">Log in</button></form>' +
      '<p class="center">New here? <a href="#/register' + (params.get("next") ? "?next=" + encodeURIComponent(params.get("next")) : "") + '">Create an account</a></p></div>' +
      '<div class="demo-box"><b>Test accounts</b>' +
      '<button class="demo-acc" data-action="demo-login" data-email="admin@mamaautoparts.test" data-pass="admin123"><span>Administrator</span>admin@mamaautoparts.test / admin123</button>' +
      '<button class="demo-acc" data-action="demo-login" data-email="ram@demo.test" data-pass="ram123"><span>Customer</span>ram@demo.test / ram123</button>' +
      '<p class="muted small">Click one to fill in the form, then press Log in.</p></div></div>';
  }
  function viewRegister(_, params) {
    setMeta("Create account");
    if (currentUser()) { go("#/account"); return null; }
    return '<div class="wrap page auth"><div class="box"><h1>Create an account</h1><p class="muted">Save your addresses, track orders and write reviews.</p>' +
      '<form data-form="register" data-next="' + esc(params.get("next") || "") + '" class="stack">' +
      field("name", "Full name", "", "text", true, 'autocomplete="name"') +
      field("email", "Email", "", "email", true, 'autocomplete="email"') +
      field("phone", "Mobile number", "", "tel", true, 'pattern="9[678][0-9]{8}" placeholder="98XXXXXXXX"') +
      field("password", "Password (at least 6 characters)", "", "password", true, 'minlength="6" autocomplete="new-password"') +
      field("password2", "Confirm password", "", "password", true, 'minlength="6" autocomplete="new-password"') +
      '<p class="err small" id="reg-err" hidden></p>' +
      '<button class="btn block lg" type="submit">Create account</button></form>' +
      '<p class="center">Already registered? <a href="#/login">Log in</a></p></div></div>';
  }

  /* ------------------------------------------------------------------ pages: customer account */
  function viewAccount(_, params) {
    var u = currentUser();
    if (!u) { go("#/login?next=" + encodeURIComponent("#/account")); return null; }
    if (u.role === "admin") { go("#/admin"); return null; }
    setMeta("My account");
    var tab = params.get("tab") || "orders";
    var orders = db.orders.filter(function (o) { return o.userId === u.id; }).sort(function (a, b) { return a.createdAt < b.createdAt ? 1 : -1; });
    var mails = db.emails.filter(function (e) { return e.to === u.email; });
    var body = "";
    if (tab === "orders") {
      body = "<h2>My orders</h2>" + (orders.length ? '<div class="table-wrap"><table class="table"><thead><tr><th>Order</th><th>Date</th><th>Items</th><th>Total</th><th>Status</th><th></th></tr></thead><tbody>' +
        orders.map(function (o) {
          return "<tr><td><b>" + esc(o.id) + "</b></td><td>" + fmtDate(o.createdAt) + "</td><td>" + o.items.reduce(function (s, i) { return s + i.qty; }, 0) + "</td><td>" + npr(o.total) + "</td><td>" + statusBadge(o.status) + '</td><td><a href="#/order/' + o.id + '">View</a></td></tr>';
        }).join("") + "</tbody></table></div>" : '<div class="empty"><p>You have not placed any orders yet.</p><a class="btn" href="#/shop">Start shopping</a></div>');
    } else if (tab === "wishlist") {
      var items = u.wishlist.map(findProduct).filter(Boolean);
      body = "<h2>My wishlist</h2>" + (items.length ? '<div class="grid">' + items.map(productCard).join("") + "</div>" : '<div class="empty"><p>Your wishlist is empty. Tap the heart on any product to save it.</p></div>');
    } else if (tab === "profile") {
      body = '<h2>Profile &amp; address</h2><form class="box form-grid" data-form="profile">' +
        field("name", "Full name", u.name, "text", true) + field("phone", "Mobile number", u.phone, "tel", true, 'pattern="9[678][0-9]{8}"') +
        '<label class="fld"><span>Email</span><input value="' + esc(u.email) + '" disabled></label>' +
        '<label class="fld"><span>Default delivery area</span><select name="area">' + areaOptions(u.area) + "</select></label>" +
        '<label class="fld wide"><span>Default address</span><input name="address" value="' + esc(u.address || "") + '"></label>' +
        '<button class="btn" type="submit">Save changes</button></form>' +
        '<h2>Change password</h2><form class="box form-grid" data-form="password">' +
        field("current", "Current password", "", "password", true) + field("next", "New password", "", "password", true, 'minlength="6"') +
        '<button class="btn" type="submit">Update password</button></form>';
    } else if (tab === "inbox") {
      body = '<h2>Email notifications</h2><p class="muted small">Messages about your account and orders, addressed to ' + esc(u.email) + ".</p>" +
        (mails.length ? mails.map(mailItem).join("") : '<div class="empty"><p>No emails yet. Place an order to see the confirmation email.</p></div>');
    }
    var tabs = [["orders", "My orders"], ["wishlist", "Wishlist (" + u.wishlist.length + ")"], ["profile", "Profile & address"], ["inbox", "Notifications (" + mails.length + ")"]];
    return '<div class="wrap page"><div class="acc-head"><div><h1>Namaste, ' + esc(u.name.split(" ")[0]) + '!</h1><span class="muted">' + esc(u.email) + '</span></div><button class="btn ghost sm" data-action="logout">Log out</button></div>' +
      '<div class="tabs">' + tabs.map(function (t) { return '<a href="#/account?tab=' + t[0] + '" class="' + (t[0] === tab ? "active" : "") + '">' + esc(t[1]) + "</a>"; }).join("") + "</div>" + body + "</div>";
  }
  function mailItem(e) {
    return '<details class="mail"><summary><b>' + esc(e.subject) + '</b><span class="muted small">' + fmtDate(e.date, true) + "</span></summary><p>" + esc(e.body) + "</p>" +
      (e.orderId ? '<a href="#/order/' + esc(e.orderId) + '">View order</a>' : "") + "</details>";
  }
  function statusBadge(s) {
    var cls = { Pending: "neutral", Processing: "low", Shipped: "info", Delivered: "in", Cancelled: "out" }[s] || "neutral";
    return '<span class="badge ' + cls + '">' + esc(s) + "</span>";
  }

  /* ------------------------------------------------------------------ pages: admin */
  function viewAdmin(parts, params) {
    var u = currentUser();
    if (!u) { go("#/login?next=" + encodeURIComponent("#/admin")); return null; }
    if (u.role !== "admin") return '<div class="wrap page"><div class="empty"><h1>Access denied</h1><p>Only the store administrator can open this page.</p><a class="btn" href="#/">Go home</a></div></div>';
    setMeta("Admin panel");
    var tab = params.get("tab") || "dashboard";
    var tabs = [["dashboard", "Dashboard"], ["products", "Products"], ["orders", "Orders"], ["customers", "Customers"], ["reviews", "Reviews"], ["emails", "Email log"]];
    var lowCount = db.products.filter(function (p) { return p.stock <= D.lowStockLimit; }).length;
    var pend = db.orders.filter(function (o) { return o.status === "Pending"; }).length;
    var body = { dashboard: adminDashboard, products: adminProducts, orders: adminOrders, customers: adminCustomers, reviews: adminReviews, emails: adminEmails }[tab];
    return '<div class="admin"><aside class="admin-side"><div class="admin-title">Admin Panel</div>' +
      tabs.map(function (t) {
        var badge = t[0] === "products" && lowCount ? '<span class="pill warn">' + lowCount + "</span>" : t[0] === "orders" && pend ? '<span class="pill">' + pend + "</span>" : "";
        return '<a href="#/admin?tab=' + t[0] + '" class="' + (t[0] === tab ? "active" : "") + '">' + t[1] + badge + "</a>";
      }).join("") +
      '<a href="#/">View store &rarr;</a><button class="linkish" data-action="logout">Log out</button></aside>' +
      '<section class="admin-main">' + (body ? body(params) : "") + "</section></div>";
  }

  function adminDashboard() {
    var valid = db.orders.filter(function (o) { return o.status !== "Cancelled"; });
    var revenue = valid.reduce(function (s, o) { return s + o.total; }, 0);
    var customers = db.users.filter(function (u) { return u.role === "customer"; }).length;
    var low = db.products.filter(function (p) { return p.stock <= D.lowStockLimit; }).sort(function (a, b) { return a.stock - b.stock; });
    var pending = db.orders.filter(function (o) { return o.status === "Pending" || o.status === "Processing"; }).length;

    // sales for the last 7 days
    var days = [], day = 86400000, today = new Date(); today.setHours(0, 0, 0, 0);
    for (var i = 6; i >= 0; i--) {
      var start = today.getTime() - i * day, end = start + day;
      var sum = valid.filter(function (o) { var t = new Date(o.createdAt).getTime(); return t >= start && t < end; }).reduce(function (s, o) { return s + o.total; }, 0);
      days.push({ label: new Date(start).toLocaleDateString("en-GB", { weekday: "short" }), date: new Date(start).toLocaleDateString("en-GB", { day: "numeric", month: "short" }), v: sum });
    }
    var maxV = Math.max.apply(null, days.map(function (d) { return d.v; }).concat([1]));
    var week = days.reduce(function (s, d) { return s + d.v; }, 0);

    // top products by quantity sold in orders
    var qty = {};
    valid.forEach(function (o) { o.items.forEach(function (i) { qty[i.pid] = (qty[i.pid] || 0) + i.qty; }); });
    var top = Object.keys(qty).map(function (k) { return { p: findProduct(k), q: qty[k] }; }).filter(function (x) { return x.p; }).sort(function (a, b) { return b.q - a.q; }).slice(0, 5);
    var topMax = top.length ? top[0].q : 1;

    // sales by payment method
    var byPay = { esewa: 0, khalti: 0, cod: 0 };
    valid.forEach(function (o) { byPay[o.payment.method] += o.total; });

    var recent = db.orders.slice().sort(function (a, b) { return a.createdAt < b.createdAt ? 1 : -1; }).slice(0, 6);

    return '<div class="admin-head"><h1>Dashboard</h1><span class="muted">' + new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" }) + "</span></div>" +
      '<div class="kpis">' +
      kpi("Total sales", npr(revenue), valid.length + " orders") +
      kpi("This week", npr(week), "last 7 days") +
      kpi("Orders to handle", pending, "pending or processing", pending ? "#/admin?tab=orders&status=Pending" : "") +
      kpi("Customers", customers, "registered") +
      kpi("Products", db.products.length, low.length + " low on stock", "#/admin?tab=products&filter=low", low.length ? "warn" : "") +
      "</div>" +
      '<div class="dash-grid">' +
      '<div class="box"><h2>Sales in the last 7 days</h2><div class="bars">' + days.map(function (d) {
        return '<div class="bar-col" title="' + d.date + ": " + npr(d.v) + '"><span class="bar-val">' + (d.v ? (d.v >= 1000 ? (d.v / 1000).toFixed(1) + "k" : d.v) : "") + '</span><div class="bar" style="height:' + Math.max(2, d.v / maxV * 100) + '%"></div><span class="bar-lbl">' + d.label + "</span></div>";
      }).join("") + "</div></div>" +
      '<div class="box"><h2>Low stock alerts</h2>' + (low.length ? '<ul class="alert-list">' + low.map(function (p) {
        return "<li><span>" + esc(p.name) + ' <span class="muted small">' + esc(p.sku) + "</span></span>" + (p.stock <= 0 ? '<span class="badge out">Out of stock</span>' : '<span class="badge low">' + p.stock + " left</span>") +
          '<button class="btn sm ghost" data-action="restock" data-id="' + p.id + '">+10 stock</button></li>'; }).join("") + "</ul>" : '<p class="muted">All products have enough stock.</p>') + "</div>" +
      '<div class="box"><h2>Top selling products</h2>' + (top.length ? top.map(function (t) {
        return '<div class="hbar"><span>' + esc(t.p.name) + '</span><div><i style="width:' + (t.q / topMax * 100) + '%"></i></div><b>' + t.q + "</b></div>"; }).join("") : '<p class="muted">No sales yet.</p>') + "</div>" +
      '<div class="box"><h2>Sales by payment method</h2>' + ["esewa", "khalti", "cod"].map(function (m) {
        return '<div class="hbar"><span><span class="pay-badge ' + m + ' sm">' + PAY_NAMES[m] + '</span></span><div><i style="width:' + (revenue ? byPay[m] / revenue * 100 : 0) + '%" class="' + m + '"></i></div><b>' + npr(byPay[m]) + "</b></div>"; }).join("") + "</div>" +
      "</div>" +
      '<div class="box"><div class="sec-head"><h2>Recent orders</h2><a href="#/admin?tab=orders">All orders</a></div>' + ordersTable(recent) + "</div>";
  }
  function kpi(label, value, sub, href, cls) {
    var inner = '<span class="kpi-label">' + label + '</span><b class="kpi-val">' + value + '</b><span class="muted small">' + sub + "</span>";
    return href ? '<a class="kpi ' + (cls || "") + '" href="' + href + '">' + inner + "</a>" : '<div class="kpi ' + (cls || "") + '">' + inner + "</div>";
  }
  // statuses an order can move to: only forward, and cancel only before it is shipped
  function nextStatuses(o) {
    var i = STATUS_FLOW.indexOf(o.status);
    if (i < 0 || o.status === "Delivered") return [];
    var list = STATUS_FLOW.slice(i + 1);
    if (o.status === "Pending" || o.status === "Processing") list.push("Cancelled");
    return list;
  }
  function statusControl(o) {
    var next = nextStatuses(o);
    if (!next.length) return statusBadge(o.status);
    return '<select class="status-sel" data-action-change="order-status" data-id="' + o.id + '" aria-label="Order status"><option selected>' + o.status + "</option>" +
      next.map(function (s) { return "<option>" + s + "</option>"; }).join("") + "</select>";
  }
  function ordersTable(list) {
    if (!list.length) return '<p class="muted">No orders match.</p>';
    return '<div class="table-wrap"><table class="table"><thead><tr><th>Order</th><th>Customer</th><th>Date</th><th>Total</th><th>Payment</th><th>Status</th><th></th></tr></thead><tbody>' +
      list.map(function (o) {
        return "<tr><td><b>" + esc(o.id) + "</b></td><td>" + esc(o.customer.name) + (o.userId ? "" : ' <span class="muted small">(guest)</span>') +
          (o.note ? '<br><span class="order-note" title="Delivery note">&#9998; ' + esc(o.note) + "</span>" : "") + "</td><td>" + fmtDate(o.createdAt) + "</td><td>" + npr(o.total) + "</td>" +
          "<td>" + PAY_NAMES[o.payment.method] + "<br>" + payStatusBadge(o) + "</td>" +
          "<td>" + statusControl(o) + "</td>" +
          '<td class="nowrap"><a href="#/order/' + o.id + '">View</a> &middot; <a href="#/invoice/' + o.id + '">Invoice</a></td></tr>';
      }).join("") + "</tbody></table></div>";
  }

  function adminProducts(params) {
    var edit = params.get("edit"), filter = params.get("filter") || "", q = clean(params.get("q")).toLowerCase(), cat = params.get("cat") || "";
    if (edit) return productForm(edit === "new" ? null : findProduct(edit));
    var list = db.products.filter(function (p) {
      if (filter === "low" && p.stock > D.lowStockLimit) return false;
      if (cat && p.cat !== cat) return false;
      if (q && (p.name + " " + p.sku + " " + p.brand).toLowerCase().indexOf(q) < 0) return false;
      return true;
    });
    return '<div class="admin-head"><h1>Products</h1><div class="btn-row"><a class="btn" href="#/admin?tab=products&edit=new">+ Add product</a>' +
      '<label class="btn ghost">Import CSV<input type="file" accept=".csv,text/csv" hidden data-action-change="csv-import"></label>' +
      '<button class="btn ghost" data-action="csv-sample">Sample CSV</button></div></div>' +
      '<form class="admin-filter" data-form="admin-prod-filter"><input name="q" type="search" placeholder="Search name, SKU or brand" value="' + esc(params.get("q") || "") + '">' +
      '<select name="cat"><option value="">All categories</option>' + D.categories.map(function (c) { return '<option value="' + c.id + '"' + (c.id === cat ? " selected" : "") + ">" + esc(c.name) + "</option>"; }).join("") + "</select>" +
      '<label class="check"><input type="checkbox" name="filter" value="low"' + (filter === "low" ? " checked" : "") + "> Low stock only</label><button class=\"btn sm\" type=\"submit\">Filter</button></form>" +
      '<div class="table-wrap"><table class="table"><thead><tr><th></th><th>Product</th><th>Category</th><th class="r">Price</th><th>Stock</th><th class="r">Sold</th><th></th></tr></thead><tbody>' +
      list.map(function (p) {
        return '<tr class="' + (p.stock <= D.lowStockLimit ? "row-warn" : "") + '"><td>' + productArt(p, "xs") + "</td><td><b>" + esc(p.name) + '</b><br><span class="muted small">' + esc(p.brand) + " &middot; " + esc(p.sku) + "</span></td>" +
          "<td>" + esc(catById(p.cat).name) + '</td><td class="r">' + npr(p.price) + "</td>" +
          '<td><input class="stock-in" type="number" min="0" value="' + p.stock + '" data-action-change="stock" data-id="' + p.id + '" aria-label="Stock"> ' + (p.stock <= 0 ? '<span class="badge out">Out</span>' : p.stock <= D.lowStockLimit ? '<span class="badge low">Low</span>' : "") + "</td>" +
          '<td class="r">' + (p.sold || 0) + "</td>" +
          '<td class="nowrap"><a href="#/admin?tab=products&edit=' + p.id + '">Edit</a> &middot; <button class="linkish danger" data-action="delete-product" data-id="' + p.id + '">Delete</button></td></tr>';
      }).join("") + "</tbody></table></div>";
  }
  function productForm(p) {
    var isNew = !p;
    p = p || { name: "", cat: "brakes", brand: "", sku: "", price: "", oldPrice: "", stock: 10, fits: [], desc: "", specs: {} };
    var universal = p.fits.indexOf("universal") > -1;
    return '<div class="admin-head"><h1>' + (isNew ? "Add product" : "Edit product") + '</h1><a class="btn ghost" href="#/admin?tab=products">Back to products</a></div>' +
      '<form class="box form-grid" data-form="product" data-id="' + (isNew ? "" : p.id) + '">' +
      '<label class="fld wide"><span>Product name *</span><input name="name" required value="' + esc(p.name) + '"></label>' +
      '<label class="fld"><span>Category *</span><select name="cat">' + D.categories.map(function (c) { return '<option value="' + c.id + '"' + (c.id === p.cat ? " selected" : "") + ">" + esc(c.name) + "</option>"; }).join("") + "</select></label>" +
      field("brand", "Part brand", p.brand, "text", true) +
      field("sku", "SKU / part number", p.sku, "text", true) +
      field("price", "Price (Rs.)", p.price, "number", true, 'min="1"') +
      field("oldPrice", "Old price (for sale, optional)", p.oldPrice || "", "number", false, 'min="0"') +
      field("stock", "Stock quantity", p.stock, "number", true, 'min="0"') +
      '<div class="fld wide"><span>Fits these bikes *</span><label class="check"><input type="checkbox" name="universal"' + (universal ? " checked" : "") + "> Universal (fits most bikes)</label>" +
      '<div class="fits-grid">' + D.bikes.map(function (b) {
        return "<div><b>" + esc(b.brand) + "</b>" + b.models.map(function (m) {
          return '<label class="check"><input type="checkbox" name="fits" value="' + m.id + '"' + (p.fits.indexOf(m.id) > -1 ? " checked" : "") + "> " + esc(m.name) + "</label>"; }).join("") + "</div>";
      }).join("") + "</div></div>" +
      '<label class="fld wide"><span>Description *</span><textarea name="desc" rows="4" required>' + esc(p.desc) + "</textarea></label>" +
      '<label class="fld wide"><span>Specifications (one per line, e.g. Size: 100/90-17)</span><textarea name="specs" rows="3">' +
      esc(Object.keys(p.specs || {}).map(function (k) { return k + ": " + p.specs[k]; }).join("\n")) + "</textarea></label>" +
      '<p class="muted small wide">The product picture is shown automatically from the category.</p>' +
      '<div class="btn-row wide"><button class="btn lg" type="submit">' + (isNew ? "Add product" : "Save changes") + '</button><a class="btn ghost lg" href="#/admin?tab=products">Cancel</a></div></form>';
  }

  function adminOrders(params) {
    var st = params.get("status") || "", q = clean(params.get("q")).toLowerCase();
    var list = db.orders.filter(function (o) {
      if (st && o.status !== st) return false;
      if (q && (o.id + " " + o.customer.name + " " + o.customer.phone).toLowerCase().indexOf(q) < 0) return false;
      return true;
    }).sort(function (a, b) { return a.createdAt < b.createdAt ? 1 : -1; });
    return '<div class="admin-head"><h1>Orders</h1></div>' +
      '<div class="tabs small">' + [""].concat(STATUS_FLOW, ["Cancelled"]).map(function (s) {
        var n = db.orders.filter(function (o) { return !s || o.status === s; }).length;
        return '<a href="#/admin?tab=orders' + (s ? "&status=" + s : "") + '" class="' + (s === st ? "active" : "") + '">' + (s || "All") + " (" + n + ")</a>"; }).join("") + "</div>" +
      '<form class="admin-filter" data-form="admin-order-filter"><input type="hidden" name="status" value="' + esc(st) + '"><input name="q" type="search" placeholder="Search order ID, name or phone" value="' + esc(params.get("q") || "") + '"><button class="btn sm" type="submit">Search</button></form>' +
      '<p class="muted small">Move an order forward with the dropdown; the customer gets an email each time. An order can be cancelled only before it is shipped. Cancelling puts the items back in stock and marks wallet payments as refunded.</p>' +
      ordersTable(list);
  }
  function adminCustomers() {
    var cs = db.users.filter(function (u) { return u.role === "customer"; });
    return '<div class="admin-head"><h1>Customers</h1></div><div class="table-wrap"><table class="table"><thead><tr><th>Name</th><th>Email</th><th>Phone</th><th>Area</th><th class="r">Orders</th><th class="r">Total spent</th><th>Joined</th></tr></thead><tbody>' +
      cs.map(function (u) {
        var os = db.orders.filter(function (o) { return o.userId === u.id && o.status !== "Cancelled"; });
        return "<tr><td><b>" + esc(u.name) + "</b></td><td>" + esc(u.email) + "</td><td>" + esc(u.phone) + "</td><td>" + esc(areaById(u.area).name) + '</td><td class="r">' + os.length + '</td><td class="r">' + npr(os.reduce(function (s, o) { return s + o.total; }, 0)) + "</td><td>" + fmtDate(u.createdAt) + "</td></tr>";
      }).join("") + "</tbody></table></div>" +
      '<p class="muted small">Passwords are stored only as salted SHA-256 hashes, so even the admin cannot see them.</p>';
  }
  function adminReviews() {
    var rs = db.reviews.slice().sort(function (a, b) { return a.date < b.date ? 1 : -1; });
    return '<div class="admin-head"><h1>Reviews</h1></div>' + (rs.length ? '<div class="table-wrap"><table class="table"><thead><tr><th>Product</th><th>Customer</th><th>Rating</th><th>Review</th><th>Date</th><th></th></tr></thead><tbody>' +
      rs.map(function (r) {
        var p = findProduct(r.pid);
        return "<tr><td>" + (p ? '<a href="#/product/' + p.id + '">' + esc(p.name) + "</a>" : "(deleted)") + "</td><td>" + esc(r.name) + "</td><td>" + stars(r.rating, null) + "</td><td>" + esc(r.text) + "</td><td>" + fmtDate(r.date) + '</td><td><button class="linkish danger" data-action="delete-review" data-id="' + r.id + '">Delete</button></td></tr>';
      }).join("") + "</tbody></table></div>" : '<p class="muted">No reviews yet.</p>');
  }
  function adminEmails() {
    return '<div class="admin-head"><h1>Email log</h1><button class="btn ghost danger" data-action="reset-demo">Reset data</button></div>' +
      '<p class="muted small">Every email created by the store: order confirmations, payment receipts, status updates and low stock alerts for the admin.</p>' +
      (db.emails.length ? db.emails.map(function (e) { return mailItem(e).replace("<summary>", '<summary><span class="mail-to">To: ' + esc(e.to) + "</span>"); }).join("") : '<p class="muted">No emails yet.</p>');
  }

  /* ------------------------------------------------------------------ other pages */
  function hetaudaWards() {
    return D.delivery.filter(function (a) { return a.ward; }).slice().sort(function (x, y) { return x.ward - y.ward; });
  }
  // ward dropdown for Hetauda (ward number order, no prices - the charge is shown below it)
  function wardOptions(selected) {
    return '<option value="">Select your ward</option>' + hetaudaWards().map(function (a) {
      return '<option value="' + a.id + '"' + (a.id === selected ? " selected" : "") + ">Ward " + a.ward + " - " + esc(a.place) + "</option>";
    }).join("");
  }
  // simple list for the profile page
  function areaOptions(selected) {
    return '<option value="manahari"' + (selected === "manahari" ? " selected" : "") + ">Manahari</option>" + hetaudaWards().map(function (a) {
      return '<option value="' + a.id + '"' + (a.id === selected ? " selected" : "") + ">Hetauda, Ward " + a.ward + " - " + esc(a.place) + "</option>";
    }).join("");
  }
  function deliveryInfo(a, t) {
    if (!a) return "Choose your ward to see the delivery charge. In Hetauda it is Rs. 100 to Rs. 250 depending on the distance.";
    var free = t.sub >= D.freeDeliveryAbove;
    var fee = free ? '<b class="ok">Free delivery</b> (order above ' + npr(D.freeDeliveryAbove) + ")" : "Delivery charge <b>" + npr(a.fee) + "</b>";
    if (!a.ward) return "<b>Local delivery</b> from our shop in Manahari &middot; " + fee + " &middot; " + esc(a.time);
    return "<b>Zone " + a.zone + "</b> &middot; " + esc(a.km.replace("~", "about ")) + " from Bastipur &middot; " + fee + " &middot; " + esc(a.time);
  }

  function viewDelivery() {
    setMeta("Delivery charges", "Delivery charges for Mama Auto Parts orders in Manahari and the 19 wards of Hetauda.");
    return '<div class="wrap page narrow"><h1>Delivery charges</h1>' +
      "<p>Our shop is in Bhundrung, Manahari-3. We deliver in Manahari and in all 19 wards of Hetauda Sub-Metropolitan City. " +
      "Hetauda wards are grouped into four zones by road distance from Bastipur (Ward 19), the first part of Hetauda on the highway from Manahari. " +
      "Orders above <b>" + npr(D.freeDeliveryAbove) + "</b> are delivered free.</p>" +
      '<h2>Charges by zone</h2><div class="table-wrap"><table class="table"><thead><tr><th>Zone</th><th>Distance</th><th>Covers</th><th class="r">Charge</th><th>Time</th></tr></thead><tbody>' +
      D.zones.map(function (z) {
        var wards = D.delivery.filter(function (a) { return a.zone === z.id && a.ward; }).map(function (a) { return a.ward; });
        return "<tr><td><b>" + esc(z.id ? z.name : "Manahari") + "</b></td><td>" + esc(z.id ? z.range : "Local") + "</td><td>" +
          (z.id ? "Wards " + wards.join(", ") + '<br><span class="muted small">' + esc(z.note) + "</span>" : "Anywhere in Manahari") +
          '</td><td class="r"><b>' + npr(z.fee) + "</b></td><td>" + esc(z.time) + "</td></tr>";
      }).join("") + "</tbody></table></div>" +
      '<h2 style="margin-top:22px">Find your ward</h2><div class="table-wrap"><table class="table"><thead><tr><th>Ward</th><th>Area / landmark</th><th>Distance from Bastipur</th><th>Zone</th><th class="r">Charge</th></tr></thead><tbody>' +
      D.delivery.filter(function (a) { return a.ward; }).slice().sort(function (a, b) { return a.ward - b.ward; }).map(function (a) {
        return "<tr><td>Hetauda-" + a.ward + "</td><td>" + esc(a.place) + "</td><td>" + esc(a.km) + "</td><td>Zone " + a.zone + '</td><td class="r">' + npr(a.fee) + "</td></tr>";
      }).join("") + "</tbody></table></div>" +
      '<p class="muted small">Distances are estimates along the main roads. For addresses deep inside Padampokhari West (Ward 12), we may call you about a small extra charge for the inner road.</p></div>';
  }
  function viewAbout() {
    setMeta("About us");
    return '<div class="wrap page narrow"><h1>About Mama Auto Parts</h1><p>Mama Auto Parts is a motorcycle parts shop based at Bhundrung, Manahari-3, Makawanpur. For now we deliver in Manahari and inside Hetauda, where most of our customers ride every day. Instead of going from shop to shop asking for a part, riders can check what we have, see which bikes each part fits, and get it delivered at home.</p>' +
      "<p>Every product on our site lists the exact bikes it fits. Save your bike once and the store shows only compatible parts. You can pay with eSewa, Khalti or cash on delivery, and track your order until it reaches you.</p>" +
      '<p class="muted small">This website was developed as a BICTE 7th semester project at Makawanpur Multiple Campus, Hetauda.</p></div>';
  }
  function viewNotFound(msg) {
    setMeta("Page not found");
    return '<div class="wrap page"><div class="empty"><h1>Not found</h1><p>' + esc(msg || "Sorry, we could not find that page.") + '</p><a class="btn" href="#/">Go to home page</a></div></div>';
  }

  /* ------------------------------------------------------------------ actions (clicks) */
  function addToCart(id, qty) {
    var p = findProduct(id); if (!p) return false;
    var cart = getCart(), line = cart.filter(function (l) { return l.pid === id; })[0];
    var have = line ? line.qty : 0;
    if (have + qty > p.stock) { toast("Sorry, only " + p.stock + " in stock.", "err"); return false; }
    if (line) line.qty += qty; else cart.push({ pid: id, qty: qty });
    setCart(cart);
    return true;
  }
  function changeCartQty(id, qty) {
    var p = findProduct(id), cart = getCart();
    qty = Math.max(1, Math.min(qty, p ? p.stock : qty));
    cart.forEach(function (l) { if (l.pid === id) l.qty = qty; });
    setCart(cart); render();
  }

  // keep what the user typed, then re-render the checkout for the new delivery area
  function rerenderCheckout(f, area) {
    var keep = {};
    ["name", "phone", "email", "address", "note"].forEach(function (n) { keep[n] = f[n].value; });
    var method = (f.querySelector('input[name="method"]:checked') || {}).value;
    render.after = function () {
      var nf = $('form[data-form="checkout"]');
      Object.keys(keep).forEach(function (n) { nf[n].value = keep[n]; });
      if (method) nf.querySelector('input[value="' + method + '"]').checked = true;
    };
    go("#/checkout?area=" + area + "&keep=1");
  }

  var actions = {
    "toggle-menu": function () { $("#main-nav").classList.toggle("open"); },
    "toggle-filters": function () { $("#filters").classList.toggle("open"); },
    "add-cart": function (el) {
      var qty = el.dataset.qtyFrom ? Math.max(1, parseInt($(el.dataset.qtyFrom).value, 10) || 1) : 1;
      if (addToCart(el.dataset.id, qty)) toast("Added to cart: " + findProduct(el.dataset.id).name, "ok");
    },
    "buy-now": function (el) {
      var qty = Math.max(1, parseInt($("#pdp-qty").value, 10) || 1);
      var inCart = getCart().some(function (l) { return l.pid === el.dataset.id; });
      if (inCart || addToCart(el.dataset.id, qty)) go("#/checkout");
    },
    "qty-dec": function () { var i = $("#pdp-qty"); i.value = Math.max(1, (parseInt(i.value, 10) || 1) - 1); },
    "qty-inc": function () { var i = $("#pdp-qty"); i.value = Math.min(Number(i.max), (parseInt(i.value, 10) || 1) + 1); },
    "cart-inc": function (el) { var l = getCart().filter(function (x) { return x.pid === el.dataset.id; })[0]; var p = findProduct(el.dataset.id); if (l.qty >= p.stock) { toast("Only " + p.stock + " in stock.", "err"); return; } changeCartQty(el.dataset.id, l.qty + 1); },
    "cart-dec": function (el) { var l = getCart().filter(function (x) { return x.pid === el.dataset.id; })[0]; changeCartQty(el.dataset.id, l.qty - 1); },
    "cart-remove": function (el) { setCart(getCart().filter(function (x) { return x.pid !== el.dataset.id; })); render(); toast("Item removed from cart"); },
    wish: function (el) {
      var u = currentUser();
      if (!u) { toast("Please log in to save items to your wishlist."); go("#/login?next=" + encodeURIComponent(location.hash)); return; }
      var i = u.wishlist.indexOf(el.dataset.id);
      if (i > -1) { u.wishlist.splice(i, 1); toast("Removed from wishlist"); } else { u.wishlist.push(el.dataset.id); toast("Saved to wishlist", "ok"); }
      save(); render();
    },
    logout: function () { store.del(SESSION_KEY); toast("You have been logged out."); go("#/"); },
    "demo-login": function (el) { var f = $('form[data-form="login"]'); f.email.value = el.dataset.email; f.password.value = el.dataset.pass; f.email.focus(); },
    "clear-garage": function () { store.del(GARAGE_KEY); renderHeader(); render(); },
    "scroll-reviews": function (el, e) { e.preventDefault(); $("#reviews").scrollIntoView({ behavior: "smooth" }); },
    print: function () { window.print(); },
    "pay-confirm": function (el) {
      var o = findOrder(el.dataset.id);
      o.payment.status = "Paid";
      o.payment.txn = (o.payment.method === "esewa" ? "ESW" : "KHT") + Date.now().toString().slice(-8);
      o.history[0].note = "Order placed, paid with " + PAY_NAMES[o.payment.method];
      save();
      sendEmail(o.customer.email, "Payment received for order " + o.id, "We received " + npr(o.total) + " via " + PAY_NAMES[o.payment.method] + " (transaction " + o.payment.txn + "). We will start packing your order soon.", o.id);
      toast("Payment successful", "ok");
      go("#/order/" + o.id + "?new=1");
    },
    "pay-cancel": function (el) { toast("Payment cancelled. Your order is saved, you can pay later.", "err"); go("#/order/" + el.dataset.id); },
    "pay-retry": function (el) { go("#/pay/" + el.dataset.id); },
    "pay-cod": function (el) {
      var o = findOrder(el.dataset.id); o.payment.method = "cod"; o.payment.status = "Cash on delivery"; save();
      toast("Payment method changed to cash on delivery", "ok"); render();
    },
    "cancel-order": function (el) {
      var o = findOrder(el.dataset.id);
      if (nextStatuses(o).indexOf("Cancelled") < 0 || !confirm("Cancel this order?")) return;
      setOrderStatus(o, "Cancelled", "Cancelled by customer");
      toast("Order cancelled"); render();
    },
    restock: function (el) { var p = findProduct(el.dataset.id); p.stock += 10; save(); toast(p.name + " restocked (+10)", "ok"); render(); },
    "delete-product": function (el) {
      var p = findProduct(el.dataset.id);
      if (!confirm('Delete "' + p.name + '"? This cannot be undone.')) return;
      db.products = db.products.filter(function (x) { return x.id !== p.id; });
      setCart(getCart().filter(function (l) { return l.pid !== p.id; }));
      save(); toast("Product deleted"); render();
    },
    "delete-review": function (el) {
      if (!confirm("Delete this review?")) return;
      db.reviews = db.reviews.filter(function (r) { return r.id !== el.dataset.id; }); save(); toast("Review deleted"); render();
    },
    "csv-sample": function () {
      var csv = "name,category,brand,sku,price,stock,fits,description\n" +
        '"Front Brake Pad Set",brakes,Endurance,BRK-EN-301,690,20,"fz;r15","Front brake pads for Yamaha FZ and R15"\n' +
        '"Chain Lube Spray 150ml",oil,Motul,OIL-MT-CL1,650,25,universal,"Chain lubricant for all bikes"\n';
      var a = document.createElement("a");
      a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
      a.download = "sample-products.csv"; document.body.appendChild(a); a.click(); a.remove();
    },
    "reset-demo": function () {
      if (!confirm("Reset all data? New orders, products and accounts will be removed and the sample data loaded again.")) return;
      store.del(DB_KEY); store.del(CART_KEY); store.del(SESSION_KEY); store.del(GARAGE_KEY); store.del("map_guest_orders");
      load(); toast("Data has been reset", "ok"); go("#/");
    }
  };

  /* ------------------------------------------------------------------ change handlers */
  var changes = {
    "finder-brand": function (el) { el.form.model.innerHTML = modelOptions(el.value, null); },
    sort: function (el) {
      var r = parseHash(); r.params.set("sort", el.value); if (el.value === "popular") r.params.delete("sort");
      go("#/shop" + (r.params.toString() ? "?" + r.params.toString() : ""));
    },
    "cart-qty": function (el) { changeCartQty(el.dataset.id, parseInt(el.value, 10) || 1); },
    "co-city": function (el) { rerenderCheckout(el.form, el.value === "manahari" ? "manahari" : "hetauda"); },
    "co-area": function (el) { rerenderCheckout(el.form, el.value || "hetauda"); },
    "order-status": function (el) {
      var o = findOrder(el.dataset.id);
      if (nextStatuses(o).indexOf(el.value) < 0) { el.value = o.status; return; }
      if (el.value === "Cancelled" && !confirm("Cancel order " + o.id + "? Stock will be returned" + (o.payment.status === "Paid" ? " and the payment refunded." : "."))) { el.value = o.status; return; }
      setOrderStatus(o, el.value, "Updated by admin");
      toast(o.id + " marked as " + el.value + ". Customer notified by email.", "ok");
      render();
    },
    stock: function (el) {
      var p = findProduct(el.dataset.id), v = Math.max(0, parseInt(el.value, 10) || 0);
      p.stock = v; save(); checkLowStock(p); toast("Stock updated: " + p.name + " = " + v, "ok"); render();
    },
    "csv-import": function (el) {
      var file = el.files[0]; if (!file) return;
      var reader = new FileReader();
      reader.onload = function () { importCSV(String(reader.result)); el.value = ""; };
      reader.readAsText(file);
    }
  };

  function parseCSV(text) {
    var rows = [], row = [], cell = "", q = false;
    for (var i = 0; i < text.length; i++) {
      var c = text[i];
      if (q) { if (c === '"' && text[i + 1] === '"') { cell += '"'; i++; } else if (c === '"') q = false; else cell += c; }
      else if (c === '"') q = true;
      else if (c === ",") { row.push(cell); cell = ""; }
      else if (c === "\n" || c === "\r") { if (c === "\r" && text[i + 1] === "\n") i++; row.push(cell); rows.push(row); row = []; cell = ""; }
      else cell += c;
    }
    if (cell || row.length) { row.push(cell); rows.push(row); }
    return rows.filter(function (r) { return r.some(function (x) { return x.trim(); }); });
  }
  function importCSV(text) {
    var rows = parseCSV(text);
    if (rows.length < 2) { toast("The CSV file has no product rows.", "err"); return; }
    var head = rows[0].map(function (h) { return h.trim().toLowerCase(); });
    var col = function (r, n) { var i = head.indexOf(n); return i > -1 ? clean(r[i]) : ""; };
    var added = 0, updated = 0, skipped = 0;
    rows.slice(1).forEach(function (r) {
      var name = col(r, "name"), cat = col(r, "category"), price = Number(col(r, "price"));
      if (!name || !price || !D.categories.some(function (c) { return c.id === cat; })) { skipped++; return; }
      var fits = col(r, "fits").split(/[;|]/).map(clean).filter(function (m) { return m === "universal" || MODELS[m]; });
      var data = { name: name, cat: cat, brand: col(r, "brand") || "Generic", sku: col(r, "sku") || "SKU-" + Date.now().toString(36).toUpperCase(),
        price: price, stock: Math.max(0, parseInt(col(r, "stock"), 10) || 0), fits: fits.length ? fits : ["universal"], desc: col(r, "description") || name };
      var existing = db.products.filter(function (p) { return p.sku === data.sku; })[0];
      if (existing) { Object.keys(data).forEach(function (k) { existing[k] = data[k]; }); updated++; }
      else { data.id = uid("p"); data.specs = {}; data.sold = 0; data.createdAt = new Date().toISOString(); db.products.push(data); added++; }
    });
    save();
    toast("CSV import: " + added + " added, " + updated + " updated" + (skipped ? ", " + skipped + " skipped" : ""), added + updated ? "ok" : "err");
    render();
  }

  /* ------------------------------------------------------------------ form handlers */
  function formErr(f, msg) {
    var el = f.querySelector(".err");
    if (el) { el.textContent = msg; el.hidden = false; } else toast(msg, "err");
  }
  var forms = {
    search: function (f) { var q = clean(f.q.value); go("#/shop" + qs({ q: q })); f.q.blur(); },
    finder: function (f) {
      if (!f.model.value) { toast("Please choose your bike model.", "err"); return; }
      if (f.remember.checked) store.set(GARAGE_KEY, f.model.value);
      go("#/shop" + qs({ model: f.model.value, cat: f.cat.value }));
    },
    fitcheck: function (f) {
      var p = findProduct(f.dataset.id), m = f.model.value;
      if (!m) return;
      store.set(GARAGE_KEY, m);
      toast(fitsModel(p, m) ? "Yes! This part fits your " + MODELS[m].full : "This part does not fit your " + MODELS[m].full, fitsModel(p, m) ? "ok" : "err");
      render();
    },
    filters: function (f) {
      var fd = new FormData(f), o = {};
      fd.forEach(function (v, k) { o[k] = clean(v); });
      if (o.sort === "popular") o.sort = "";
      if (o.min && o.max && Number(o.min) > Number(o.max)) { var t = o.min; o.min = o.max; o.max = t; }
      go("#/shop" + qs(o));
    },
    review: function (f) {
      var u = currentUser(), text = clean(f.text.value), rate = Number((f.querySelector('input[name="rating"]:checked') || {}).value || 5);
      if (text.length < 5) { toast("Please write a few words about the product.", "err"); return; }
      db.reviews.push({ id: uid("r"), pid: f.dataset.id, userId: u.id, name: u.name, rating: rate, text: text, date: new Date().toISOString() });
      save(); toast("Thank you for your review!", "ok"); render();
    },
    checkout: function (f) {
      var v = {}; ["name", "phone", "email", "address", "note", "area"].forEach(function (n) { v[n] = clean(f[n].value); });
      v.method = (f.querySelector('input[name="method"]:checked') || {}).value;
      var errs = [];
      if (v.name.length < 3) errs.push("Please enter your full name.");
      if (!/^9[678]\d{8}$/.test(v.phone)) errs.push("Please enter a valid 10-digit Nepali mobile number (98XXXXXXXX).");
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.email)) errs.push("Please enter a valid email address.");
      if (v.address.length < 5) errs.push("Please enter your full delivery address.");
      if (!isArea(v.area)) errs.push("Please choose your ward in Hetauda.");
      if (!v.method) errs.push("Please choose a payment method.");
      $all(".fld input", f).forEach(function (i) { i.classList.remove("invalid"); });
      if (errs.length) {
        if (v.name.length < 3) f.name.classList.add("invalid");
        if (!/^9[678]\d{8}$/.test(v.phone)) f.phone.classList.add("invalid");
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.email)) f.email.classList.add("invalid");
        if (v.address.length < 5) f.address.classList.add("invalid");
        toast(errs[0], "err"); return;
      }
      var lines = cartLines();
      for (var i = 0; i < lines.length; i++) if (lines[i].qty > lines[i].p.stock) { toast("Only " + lines[i].p.stock + " of " + lines[i].p.name + " left. Please update your cart.", "err"); go("#/cart"); return; }
      var u = currentUser();
      var order = buildOrder({ userId: u ? u.id : null, name: v.name, phone: v.phone, email: v.email, area: v.area, address: v.address, note: v.note, method: v.method,
        items: lines.map(function (l) { return { pid: l.p.id, name: l.p.name, sku: l.p.sku, price: l.p.price, qty: l.qty }; }) });
      db.orders.push(order);
      lines.forEach(function (l) { l.p.stock -= l.qty; l.p.sold = (l.p.sold || 0) + l.qty; if (l.p.stock <= D.lowStockLimit) checkLowStock(l.p); });
      if (u && !u.address) { u.address = v.address; u.area = v.area; }
      save();
      if (!u) { var g = store.get("map_guest_orders", []); g.push(order.id); store.set("map_guest_orders", g); }
      sendEmail(v.email, "Order " + order.id + " confirmed - Mama Auto Parts",
        "Hi " + v.name + ", thank you for your order! Total: " + npr(order.total) + " (" + PAY_NAMES[v.method] + "). Items: " +
        order.items.map(function (i) { return i.name + " x" + i.qty; }).join(", ") + ". Track it with order ID " + order.id + " and your phone number.", order.id);
      sendEmail(adminEmail(), "New order " + order.id + " (" + npr(order.total) + ")", v.name + " from " + areaById(v.area).name + " placed an order. Payment: " + PAY_NAMES[v.method] + "." + (v.note ? " Delivery note: " + v.note : ""), order.id);
      setCart([]);
      if (v.method === "cod") { toast("Order placed!", "ok"); go("#/order/" + order.id + "?new=1"); }
      else go("#/pay/" + order.id);
    },
    track: function (f) { go("#/track" + qs({ id: clean(f.id.value).toUpperCase(), phone: clean(f.phone.value) })); },
    login: function (f) {
      var email = clean(f.email.value).toLowerCase(), pw = f.password.value;
      var u = db.users.filter(function (x) { return x.email.toLowerCase() === email; })[0];
      if (!u || hashPassword(pw, u.salt) !== u.passHash) { formErr(f, "Wrong email or password. Please try again."); return; }
      store.set(SESSION_KEY, { userId: u.id, at: Date.now() });
      toast("Welcome back, " + u.name.split(" ")[0] + "!", "ok");
      go(f.dataset.next || (u.role === "admin" ? "#/admin" : "#/account"));
    },
    register: function (f) {
      var v = { name: clean(f.name.value), email: clean(f.email.value).toLowerCase(), phone: clean(f.phone.value), pw: f.password.value, pw2: f.password2.value };
      if (v.name.length < 3) return formErr(f, "Please enter your full name.");
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.email)) return formErr(f, "Please enter a valid email address.");
      if (!/^9[678]\d{8}$/.test(v.phone)) return formErr(f, "Please enter a valid 10-digit mobile number.");
      if (v.pw.length < 6) return formErr(f, "Password must be at least 6 characters.");
      if (v.pw !== v.pw2) return formErr(f, "The two passwords do not match.");
      if (db.users.some(function (u) { return u.email.toLowerCase() === v.email; })) return formErr(f, "An account with this email already exists. Please log in.");
      var salt = Math.random().toString(36).slice(2, 10);
      var u = { id: uid("u"), name: v.name, email: v.email, phone: v.phone, role: "customer", area: "manahari", address: "", salt: salt, passHash: hashPassword(v.pw, salt), wishlist: [], createdAt: new Date().toISOString() };
      db.users.push(u); save();
      sendEmail(u.email, "Welcome to Mama Auto Parts", "Hi " + u.name + ", your account has been created. You can now track orders, save a wishlist and review products.");
      store.set(SESSION_KEY, { userId: u.id, at: Date.now() });
      toast("Account created. Welcome, " + u.name.split(" ")[0] + "!", "ok");
      go(f.dataset.next || "#/account");
    },
    profile: function (f) {
      var u = currentUser(), name = clean(f.name.value), phone = clean(f.phone.value);
      if (name.length < 3) return toast("Please enter your full name.", "err");
      if (!/^9[678]\d{8}$/.test(phone)) return toast("Please enter a valid mobile number.", "err");
      u.name = name; u.phone = phone; u.area = f.area.value; u.address = clean(f.address.value);
      save(); toast("Profile saved", "ok"); render();
    },
    password: function (f) {
      var u = currentUser();
      if (hashPassword(f.current.value, u.salt) !== u.passHash) return toast("Current password is wrong.", "err");
      if (f.next.value.length < 6) return toast("New password must be at least 6 characters.", "err");
      u.salt = Math.random().toString(36).slice(2, 10); u.passHash = hashPassword(f.next.value, u.salt);
      save(); f.reset(); toast("Password updated", "ok");
    },
    product: function (f) {
      var id = f.dataset.id, universal = f.universal.checked;
      var fits = universal ? ["universal"] : $all('input[name="fits"]:checked', f).map(function (i) { return i.value; });
      if (!fits.length) return toast("Please choose at least one bike, or tick Universal.", "err");
      var specs = {};
      f.specs.value.split("\n").forEach(function (line) { var i = line.indexOf(":"); if (i > 0) specs[clean(line.slice(0, i))] = clean(line.slice(i + 1)); });
      var data = { name: clean(f.name.value), cat: f.cat.value, brand: clean(f.brand.value), sku: clean(f.sku.value).toUpperCase(),
        price: Number(f.price.value), oldPrice: Number(f.oldPrice.value) || 0, stock: Math.max(0, parseInt(f.stock.value, 10) || 0), fits: fits, desc: clean(f.desc.value), specs: specs };
      if (!data.name || !data.brand || !data.sku || !data.desc) return toast("Please fill in all required fields.", "err");
      if (!(data.price > 0)) return toast("Please enter a valid price.", "err");
      if (data.oldPrice && data.oldPrice <= data.price) data.oldPrice = 0;
      if (db.products.some(function (p) { return p.sku === data.sku && p.id !== id; })) return toast("Another product already uses this SKU.", "err");
      if (!data.oldPrice) delete data.oldPrice;
      if (id) { var p = findProduct(id); delete p.oldPrice; Object.keys(data).forEach(function (k) { p[k] = data[k]; }); checkLowStock(p); toast("Product updated", "ok"); }
      else { data.id = uid("p"); data.sold = 0; data.createdAt = new Date().toISOString(); db.products.push(data); checkLowStock(data); toast("Product added", "ok"); }
      save(); go("#/admin?tab=products");
    },
    "admin-prod-filter": function (f) { go("#/admin" + qs({ tab: "products", q: clean(f.q.value), cat: f.cat.value, filter: f.filter.checked ? "low" : "" })); },
    "admin-order-filter": function (f) { go("#/admin" + qs({ tab: "orders", status: f.status.value, q: clean(f.q.value) })); }
  };

  /* ------------------------------------------------------------------ wiring */
  document.addEventListener("click", function (e) {
    var el = e.target.closest("[data-action]");
    if (!el || el.tagName === "SELECT" || el.tagName === "INPUT" && el.type !== "button") return;
    var fn = actions[el.dataset.action];
    if (fn) { if (el.tagName === "BUTTON" || el.tagName === "A") e.preventDefault(); fn(el, e); }
  });
  document.addEventListener("change", function (e) {
    var el = e.target;
    if (el.dataset.actionChange && changes[el.dataset.actionChange]) { changes[el.dataset.actionChange](el, e); return; }
    if (el.hasAttribute("data-autosubmit") && el.form) {
      if (el.hasAttribute("data-reset-model") && el.form.model) el.form.model.value = "";
      if (el.form.requestSubmit) el.form.requestSubmit(); else forms[el.form.dataset.form](el.form);
    }
  });
  document.addEventListener("submit", function (e) {
    var f = e.target, fn = forms[f.dataset.form];
    if (!fn) return;
    e.preventDefault();
    fn(f);
  });
  window.addEventListener("hashchange", render);
  window.addEventListener("storage", function (e) { if (e.key === DB_KEY) { load(); render(); } });

  load();
  $("#footer-cats").innerHTML = D.categories.map(function (c) { return '<li><a href="#/shop?cat=' + c.id + '">' + esc(c.name) + "</a></li>"; }).join("");
  render();
})();
