/* browse.js — category filter + card grid for index.html.
   Modal detail is handled by PositionDetail (detail.js). */
(function () {
  "use strict";
  var POS = window.POSITIONS || [];
  var CATS = window.CATEGORIES || {};
  var D = window.PositionDetail;
  var ORDER = ["Missionary", "Cowgirl/boy", "Doggystyle", "Spooning", "Foreplay", "Misc"];

  var grid = document.getElementById("grid");
  var chipsEl = document.getElementById("chips");
  var countEl = document.getElementById("count");
  var emptyEl = document.getElementById("empty");
  var descEl = document.getElementById("cat-desc");
  var activeCat = "all";

  function esc(s) { return (s == null ? "" : String(s)).replace(/[&<>"]/g, function (c) { return ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]; }); }
  function catMeta(name) { return CATS[name] || { label: name, cls: "c-Misc", emoji: "•", color: "#8a83a0" }; }

  function cardHTML(p) {
    var cm = catMeta(p.category);
    var mini = D.stimLabels(p.stimulation).slice(0, 3);
    return '' +
      '<button class="card ' + cm.cls + '" data-id="' + p.id + '" aria-label="' + esc(p.name) + '">' +
        '<div class="thumb">' +
          '<span class="cat-tag">' + esc(cm.label) + '</span>' +
          '<img loading="lazy" src="assets/img/' + esc(p.image) + '" alt="' + esc(p.name) + ' position illustration">' +
        '</div>' +
        '<div class="cbody">' +
          '<h3>' + esc(p.name) + '</h3>' +
          (p.alsoKnownAs ? '<div class="aka">aka “' + esc(p.alsoKnownAs) + '”</div>' : '') +
          '<p>' + esc(p.benefits || p.technique || "") + '</p>' +
          (mini.length ? '<div class="mini-tags">' + mini.map(function (m) { return '<span class="mini">' + esc(m) + '</span>'; }).join("") + '</div>' : '') +
        '</div>' +
      '</button>';
  }

  function renderChips() {
    var html = '<button class="chip c-all" data-cat="all" aria-pressed="true"><span class="swatch"></span>All <span style="opacity:.6">' + POS.length + '</span></button>';
    ORDER.forEach(function (name) {
      var cm = catMeta(name);
      var n = POS.filter(function (p) { return p.category === name; }).length;
      if (!n) return;
      html += '<button class="chip ' + cm.cls + '" data-cat="' + esc(name) + '" aria-pressed="false">' +
        '<span class="swatch"></span>' + cm.emoji + " " + esc(cm.label) + ' <span style="opacity:.6">' + n + '</span></button>';
    });
    chipsEl.innerHTML = html;
    chipsEl.querySelectorAll(".chip").forEach(function (c) {
      c.addEventListener("click", function () { setCat(c.getAttribute("data-cat")); });
    });
  }

  function setCat(cat) {
    activeCat = cat;
    chipsEl.querySelectorAll(".chip").forEach(function (c) {
      c.setAttribute("aria-pressed", c.getAttribute("data-cat") === cat ? "true" : "false");
    });
    render();
  }

  function render() {
    var list = activeCat === "all" ? POS : POS.filter(function (p) { return p.category === activeCat; });
    grid.innerHTML = list.map(cardHTML).join("");
    countEl.textContent = list.length + " position" + (list.length === 1 ? "" : "s");
    emptyEl.classList.toggle("hide", list.length !== 0);
    // category description
    var cm = activeCat !== "all" ? catMeta(activeCat) : null;
    if (cm && cm.desc) {
      descEl.className = "cat-desc " + cm.cls;
      descEl.innerHTML = '<span class="cd-emoji">' + cm.emoji + '</span><span>' + esc(cm.desc) + '</span>';
    } else {
      descEl.className = "cat-desc hide";
      descEl.innerHTML = "";
    }
    grid.querySelectorAll(".card").forEach(function (c) {
      c.addEventListener("click", function () { D.open(+c.getAttribute("data-id")); });
    });
  }

  renderChips();
  render();
  D.initHash();
})();
