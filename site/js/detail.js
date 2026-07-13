/* detail.js — shared position detail modal + "more like this".
   Used by both index.html (browse) and quiz.html (results).
   Exposes window.PositionDetail. Load BEFORE browse.js / quiz.js. */
window.PositionDetail = (function () {
  "use strict";
  var POS = window.POSITIONS || [];
  var CATS = window.CATEGORIES || {};

  var STIM = {
    "clitoral": "Clitoral", "g-spot": "G-spot", "prostate": "P-spot",
    "deep-penetration": "Deep", "oral-receiving": "Oral", "oral-giving": "Oral",
    "manual": "Hands-free", "grinding": "Grinding", "full-body-contact": "Full-body"
  };
  var INTIMACY = { "face-to-face": "Face-to-face", "from-behind": "From behind", "side-by-side": "Side by side", "variable": "Flexible" };
  var EFFORT = { 1: "Easy", 2: "Moderate", 3: "Athletic" };
  var CONTROL = { "penetrating-partner": "Penetrator leads", "receiving-partner": "Receiver leads", "shared": "Shared control" };

  function esc(s) { return (s == null ? "" : String(s)).replace(/[&<>"]/g, function (c) { return ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]; }); }
  function uniq(a) { var s = {}, out = []; a.forEach(function (x) { if (x && !s[x]) { s[x] = 1; out.push(x); } }); return out; }
  function byId(id) { for (var i = 0; i < POS.length; i++) if (POS[i].id === id) return POS[i]; return null; }
  function catMeta(n) { return CATS[n] || { label: n, cls: "c-Misc", emoji: "•", color: "#8a83a0" }; }

  // human-readable stimulation labels for a position (for browse mini-tags)
  function stimLabels(arr) { return uniq((arr || []).map(function (s) { return STIM[s]; })); }

  /* ---------- similar positions ---------- */
  function similar(p, n) {
    var scored = POS.filter(function (q) { return q.id !== p.id; }).map(function (q) {
      var s = 0;
      if (q.category === p.category) s += 3;
      (p.stimulation || []).forEach(function (t) { if ((q.stimulation || []).indexOf(t) !== -1) s += 1.4; });
      if (q.intimacy === p.intimacy) s += 1;
      var d = Math.abs((q.effort || 2) - (p.effort || 2));
      s += d === 0 ? 1 : d === 1 ? 0.5 : 0;
      if (q.control === p.control) s += 0.6;
      if (!!q.oralOnly === !!p.oralOnly) s += 0.6;
      return { q: q, s: s };
    });
    scored.sort(function (a, b) { return b.s - a.s; });
    return scored.slice(0, n || 4).map(function (x) { return x.q; });
  }

  /* ---------- rendering ---------- */
  function pill(text, cls) { return text ? '<span class="tagpill ' + (cls || "") + '">' + esc(text) + '</span>' : ""; }
  function field(label, ic, text, color, tip) {
    if (!text) return "";
    return '<div class="field ' + (tip ? "tip" : "") + '" style="--c:' + color + '">' +
      '<div class="label"><span class="ic">' + ic + '</span>' + label + '</div>' +
      '<p>' + esc(text) + '</p></div>';
  }
  function simCard(q) {
    var cm = catMeta(q.category);
    return '<button class="sim ' + cm.cls + '" data-id="' + q.id + '">' +
      '<span class="sim-thumb"><img loading="lazy" src="assets/img/' + esc(q.image) + '" alt="' + esc(q.name) + '"></span>' +
      '<span class="sim-txt"><b>' + esc(q.name) + '</b><span>' + cm.emoji + " " + esc(cm.label) + '</span></span>' +
    '</button>';
  }

  function modalHTML(p) {
    var cm = catMeta(p.category);
    var labels = [];
    if (p.oralOnly) labels.push("Oral");
    stimLabels(p.stimulation).forEach(function (s) { labels.push(s); });
    labels.push(INTIMACY[p.intimacy]);
    if (p.eyeContact) labels.push("Eye contact");
    labels.push(EFFORT[p.effort]);
    labels.push(CONTROL[p.control]);
    var pills = uniq(labels.filter(Boolean)).map(function (l) { return pill(l, cm.cls); });

    var sims = similar(p, 4);
    return '' +
      '<div class="hero-img ' + cm.cls + '">' +
        '<span class="grab"></span>' +
        '<button class="close" aria-label="Close">✕</button>' +
        '<span class="cat-tag">' + cm.emoji + " " + esc(cm.label) + '</span>' +
        '<img src="assets/img/' + esc(p.image) + '" alt="' + esc(p.name) + ' position illustration">' +
      '</div>' +
      '<div class="modal-body ' + cm.cls + '">' +
        '<h2 id="m-title">' + esc(p.name) + '</h2>' +
        (p.alsoKnownAs ? '<div class="aka">also known as “' + esc(p.alsoKnownAs) + '”</div>' : '<div class="aka" style="margin-bottom:14px"></div>') +
        '<div class="tagrow">' + pills.join("") + '</div>' +
        field("Why you'll like it", "✨", p.benefits, cm.color) +
        field("How to do it", "📋", p.technique, cm.color) +
        field("Also try", "🔄", p.alsoTry, cm.color) +
        field("Hot tip", "🔥", p.hotTip, cm.color, true) +
        '<div class="sim-block">' +
          '<div class="sim-head">💡 More like this</div>' +
          '<div class="sim-grid">' + sims.map(simCard).join("") + '</div>' +
        '</div>' +
      '</div>';
  }

  /* ---------- modal control ---------- */
  var modal, content, hashModeEl;
  function init() {
    modal = document.getElementById("modal");
    content = document.getElementById("modal-content");
    if (!modal) return;
    modal.addEventListener("click", function (e) { if (e.target === modal) close(); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape" && modal.classList.contains("open")) close(); });
  }

  function open(id) {
    if (!modal) init();
    var p = byId(+id);
    if (!p) return;
    content.innerHTML = modalHTML(p);
    modal.classList.add("open");
    document.body.style.overflow = "hidden";
    if (location.hash !== "#p" + id) history.replaceState(null, "", "#p" + id);
    content.querySelector(".close").addEventListener("click", close);
    content.querySelectorAll(".sim").forEach(function (b) {
      b.addEventListener("click", function () {
        open(+b.getAttribute("data-id"));
        var mb = content.querySelector(".modal-body"); if (mb) mb.scrollTop = 0;
        modal.scrollTop = 0;
      });
    });
    var mb = content.querySelector(".modal-body"); if (mb) mb.scrollTop = 0;
  }

  function close() {
    if (!modal) return;
    modal.classList.remove("open");
    document.body.style.overflow = "";
    if (location.hash) history.replaceState(null, "", location.pathname + location.search);
  }

  function initHash() {
    if (!modal) init();
    var m = /^#p(\d+)$/.exec(location.hash);
    if (m) open(+m[1]);
    window.addEventListener("hashchange", function () {
      var mm = /^#p(\d+)$/.exec(location.hash);
      if (mm) open(+mm[1]); else close();
    });
  }

  init();
  return { open: open, close: close, initHash: initHash, stimLabels: stimLabels, similar: similar };
})();
