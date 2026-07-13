/* quiz.js — the position matcher.
   Uses window.POSITIONS + window.CATEGORIES from data.js. */
(function () {
  "use strict";
  var POS = window.POSITIONS || [];
  var CATS = window.CATEGORIES || {};
  var D = window.PositionDetail;

  /* ---------- question config ---------- */
  var STEPS = [
    { id: "you", type: "single", num: "About you", q: "Your body", sub: "Just so we can tailor sensations. Pick whatever fits — this stays on your device.",
      opts: [
        { v: "penis", emoji: "🍆", b: "Penis" },
        { v: "vulva", emoji: "🌸", b: "Vulva" },
        { v: "either", emoji: "💫", b: "Rather not say", s: "We'll keep it general" }
      ] },
    { id: "partner", type: "single", num: "Your partner", q: "Your partner's body",
      opts: [
        { v: "penis", emoji: "🍆", b: "Penis" },
        { v: "vulva", emoji: "🌸", b: "Vulva" },
        { v: "either", emoji: "💞", b: "Either is good!", s: "Show me a bit of everything" }
      ] },
    { id: "role", type: "single", num: "Your groove", q: "Your favorite role",
      opts: [
        { v: "penetrating", emoji: "➡️", b: "The one penetrating", s: "You're the giver" },
        { v: "receiving", emoji: "⬅️", b: "Being penetrated", s: "You're the receiver" },
        { v: "switch", emoji: "🔁", b: "Switch it up", s: "A bit of both" },
        { v: "oral", emoji: "👅", b: "Less about penetration", s: "Oral, grinding, hands" }
      ] },
    { id: "stim", type: "multi", num: "The good stuff", q: "What feels best?", sub: "Pick all that apply.", dynamic: true },
    { id: "intimacy", type: "single", num: "Closeness", q: "How close do you like it?",
      opts: [
        { v: "face", emoji: "😍", b: "Face-to-face", s: "Eye contact, kissing" },
        { v: "behind", emoji: "🍑", b: "From behind", s: "Rear views, deep angles" },
        { v: "any", emoji: "✨", b: "Mix it up", s: "No strong preference" }
      ] },
    { id: "effort", type: "single", num: "Energy", q: "What's the energy tonight?",
      opts: [
        { v: 1, emoji: "😌", b: "Chill & cozy", s: "Low effort, relaxed" },
        { v: 2, emoji: "🙂", b: "A little work", s: "Moderate" },
        { v: 3, emoji: "🥵", b: "Athletic", s: "Bring a towel" },
        { v: "any", emoji: "🎲", b: "Surprise us", s: "Anything goes" }
      ] },
    { id: "control", type: "single", num: "Driver's seat", q: "Who likes to steer?",
      opts: [
        { v: "lead", emoji: "👑", b: "I like to lead", s: "You set the pace" },
        { v: "partnerlead", emoji: "🙌", b: "I like them to lead", s: "They set the pace" },
        { v: "shared", emoji: "🤝", b: "Shared control" },
        { v: "any", emoji: "🎲", b: "No preference" }
      ] }
  ];

  var STIM_TAGS = {
    clitoral: ["clitoral"], gspot: ["g-spot"], prostate: ["prostate"],
    oral: ["oral-receiving", "oral-giving"],
    grind: ["grinding", "manual", "full-body-contact"], any: []
  };
  var STIM_LABEL = { clitoral: "Clitoral", gspot: "G-spot", prostate: "P-spot", pen: "Penetration", oral: "Oral", grind: "Grinding & hands" };

  /* ---------- state ---------- */
  var answers = {};
  var idx = 0;

  var el = {
    intro: document.getElementById("intro"),
    quiz: document.getElementById("quiz"),
    steps: document.getElementById("steps"),
    results: document.getElementById("results"),
    bar: document.getElementById("bar"),
    back: document.getElementById("back"),
    next: document.getElementById("next"),
    mhint: document.getElementById("multi-hint")
  };

  function esc(s) { return (s == null ? "" : String(s)).replace(/[&<>"]/g, function (c) { return ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]; }); }
  function catMeta(n) { return CATS[n] || { label: n, cls: "c-Misc", emoji: "•", color: "#8a83a0" }; }

  /* ---------- dynamic stimulation options ---------- */
  function stimOpts() {
    // Options reflect the quiz-taker's own anatomy: a penis-owner isn't asked
    // about clitoral/G-spot; a vulva-owner isn't asked about the prostate.
    var a = answers, o = [];
    var selfVulva = a.you === "vulva" || a.you === "either";
    var selfPenis = a.you === "penis" || a.you === "either";
    if (selfVulva) { o.push({ v: "clitoral", emoji: "🌸", b: "Clitoral" }); o.push({ v: "gspot", emoji: "💫", b: "G-spot" }); }
    if (selfPenis) o.push({ v: "prostate", emoji: "🔆", b: "P-spot", s: "Prostate play" });
    o.push({ v: "pen", emoji: "🌊", b: "Penetration" });
    o.push({ v: "oral", emoji: "👅", b: "Oral" });
    o.push({ v: "grind", emoji: "🤏", b: "Grinding & hands" });
    o.push({ v: "any", emoji: "🎲", b: "Surprise me" });
    return o;
  }

  /* ---------- render one step ---------- */
  function optHTML(step, o) {
    var val = answers[step.id];
    var selected = step.type === "multi"
      ? (val || []).indexOf(o.v) !== -1
      : String(val) === String(o.v);
    var pink = step.id === "you" || step.id === "partner" || step.id === "stim";
    return '<button class="opt' + (pink ? " pink" : "") + '" data-v="' + esc(o.v) + '" aria-pressed="' + selected + '">' +
      '<span class="emoji">' + o.emoji + '</span>' +
      '<span class="otext"><b>' + esc(o.b) + '</b>' + (o.s ? '<span>' + esc(o.s) + '</span>' : '') + '</span>' +
      '<span class="tick">' + (step.type === "multi" ? "✓" : "●") + '</span>' +
    '</button>';
  }

  function renderStep() {
    var step = STEPS[idx];
    var opts = step.dynamic ? stimOpts() : step.opts;
    var cols = opts.length >= 4 ? "" : (opts.length === 3 ? "three" : "two");
    if (step.type === "multi") cols = "";
    el.steps.innerHTML =
      '<div class="step active">' +
        '<div class="qnum">Step ' + (idx + 1) + " of " + STEPS.length + " · " + esc(step.num) + '</div>' +
        '<h2>' + esc(step.q) + '</h2>' +
        (step.sub ? '<p class="sub">' + esc(step.sub) + '</p>' : '<p class="sub"></p>') +
        '<div class="opts ' + cols + '" id="opts"></div>' +
      '</div>';
    var box = document.getElementById("opts");
    box.innerHTML = opts.map(function (o) { return optHTML(step, o); }).join("");
    box.querySelectorAll(".opt").forEach(function (btn) {
      btn.addEventListener("click", function () { choose(step, btn.getAttribute("data-v")); });
    });
    el.bar.style.width = ((idx) / STEPS.length * 100) + "%";
    el.back.style.visibility = idx === 0 ? "hidden" : "visible";
    el.next.style.display = step.type === "multi" ? "inline-flex" : "none";
    el.mhint.style.display = step.type === "multi" ? "block" : "none";
    updateNext();
  }

  function coerce(v) { return v === "1" ? 1 : v === "2" ? 2 : v === "3" ? 3 : v; }

  function choose(step, v) {
    v = coerce(v);
    if (step.type === "multi") {
      var arr = answers[step.id] || [];
      var i = arr.indexOf(v);
      if (v === "any") { arr = i !== -1 ? [] : ["any"]; }
      else { arr = arr.filter(function (x) { return x !== "any"; }); if (i !== -1) arr.splice(arr.indexOf(v), 1); else arr.push(v); }
      answers[step.id] = arr;
      renderStep();
    } else {
      answers[step.id] = v;
      // reflect selection briefly, then advance
      document.querySelectorAll("#opts .opt").forEach(function (b) { b.setAttribute("aria-pressed", b.getAttribute("data-v") === String(v) ? "true" : "false"); });
      setTimeout(next, 190);
    }
  }

  function updateNext() {
    var step = STEPS[idx];
    if (step.type !== "multi") return;
    var has = (answers[step.id] || []).length > 0;
    el.next.disabled = !has;
    el.next.style.opacity = has ? "1" : ".5";
  }

  function next() {
    if (idx < STEPS.length - 1) { idx++; renderStep(); window.scrollTo({ top: 0, behavior: "smooth" }); }
    else finish();
  }
  function back() { if (idx > 0) { idx--; renderStep(); window.scrollTo({ top: 0, behavior: "smooth" }); } }

  /* ---------- scoring ---------- */
  function scoreOne(p, a) {
    var s = 0, max = 0, reasons = [];
    // role / penetration relevance
    if (a.role) {
      max += 5;
      if (a.role === "oral") { s += p.oralOnly ? 5 : (p.stimulation.indexOf("grinding") !== -1 || p.stimulation.indexOf("manual") !== -1 ? 2.5 : 0.5); }
      // Wants penetration (penetrating / receiving / switch): strongly demote oral-only
      else { s += p.oralOnly ? -8 : 5; }
    }
    // stimulation (core)
    var stim = (a.stim || []).filter(function (x) { return x !== "any"; });
    if (stim.length) {
      var cap = Math.min(stim.length, 3);
      max += 3 * cap;
      var matched = 0, hits = [];
      stim.forEach(function (v) {
        var isMatch;
        if (v === "pen") isMatch = (p.penetration || []).indexOf("vaginal") !== -1 || (p.penetration || []).indexOf("anal") !== -1;
        else { var tags = STIM_TAGS[v] || []; isMatch = tags.some(function (t) { return p.stimulation.indexOf(t) !== -1; }); }
        if (isMatch) { matched++; hits.push(STIM_LABEL[v]); }
      });
      s += 3 * Math.min(matched, 3);
      if (hits.length) reasons.push("great for " + hits.slice(0, 3).join(" + ").toLowerCase());
    }
    // intimacy
    if (a.intimacy && a.intimacy !== "any") {
      max += 3;
      if (a.intimacy === "face") { if (p.intimacy === "face-to-face") { s += 3; reasons.push("face-to-face"); } else if (p.eyeContact) { s += 1.6; } else if (p.intimacy === "variable") s += 1; }
      else if (a.intimacy === "behind") { if (p.intimacy === "from-behind") { s += 3; reasons.push("from behind"); } else if (p.intimacy === "variable") s += 1; }
    } else if (a.intimacy === "any") { max += 1; s += (p.intimacy === "face-to-face" || p.intimacy === "variable") ? 1 : 0.6; }
    // effort
    if (a.effort && a.effort !== "any") {
      max += 3;
      var d = Math.abs(p.effort - a.effort);
      s += d === 0 ? 3 : d === 1 ? 1.3 : 0;
      if (d === 0) reasons.push(a.effort === 1 ? "nice and relaxed" : a.effort === 3 ? "athletic" : "moderate effort");
    } else if (a.effort === "any") { max += 1; s += p.effort === 1 ? 1 : p.effort === 2 ? 0.75 : 0.35; }
    // control (interpreted through role)
    if (a.control && a.control !== "any") {
      max += 3;
      var want = null;
      if (a.control === "shared") want = "shared";
      else {
        var leadRole = a.role === "penetrating" ? "penetrating-partner" : a.role === "receiving" ? "receiving-partner" : null;
        if (a.control === "lead") want = leadRole;
        else if (a.control === "partnerlead") want = leadRole === "penetrating-partner" ? "receiving-partner" : leadRole === "receiving-partner" ? "penetrating-partner" : null;
      }
      if (want) { if (p.control === want) { s += 3; reasons.push(a.control === "shared" ? "shared control" : "puts you in the driver's seat"); } else if (p.control === "shared") s += 1.2; }
      else { if (p.control === "shared") s += 1.5; } // switch/oral: reward shared
    } else if (a.control === "any") { max += 1; s += p.control === "shared" ? 1 : 0.55; }
    // anatomy: strap-on needed?
    var hasPenis = a.you === "penis" || a.partner === "penis" || a.you === "either" || a.partner === "either";
    var strap = !hasPenis && !p.oralOnly;
    if (strap && !p.strapOnFriendly) s -= 3;
    return { score: s, max: Math.max(max, 1), reasons: reasons, strap: strap };
  }

  function finish() {
    el.bar.style.width = "100%";
    var scored = POS.map(function (p) {
      var r = scoreOne(p, answers);
      return { p: p, pct: Math.max(42, Math.min(99, Math.round(r.score / r.max * 100))), raw: r.score, reasons: r.reasons, strap: r.strap };
    });
    scored.sort(function (a, b) { return b.raw - a.raw || b.pct - a.pct; });
    var top = scored.slice(0, 8);
    renderResults(top);
  }

  function resultCard(r) {
    var p = r.p, cm = catMeta(p.category);
    var why = r.reasons.slice(0, 2).join(" · ");
    if (!why) why = cm.label + " position";
    why = why.charAt(0).toUpperCase() + why.slice(1);
    return '<button class="card ' + cm.cls + '" data-id="' + p.id + '">' +
      '<div class="thumb" style="width:96px;height:88px;flex-shrink:0;border-radius:14px"><img loading="lazy" src="assets/img/' + esc(p.image) + '" alt="' + esc(p.name) + '"></div>' +
      '<div class="cbody" style="padding:2px 0">' +
        '<h3 style="font-size:1.05rem">' + esc(p.name) + '</h3>' +
        '<div class="why">' + esc(why) + (r.strap ? ' · <span title="Works great with a strap-on">strap-on friendly</span>' : '') + '</div>' +
      '</div>' +
      '<div class="score"><div class="pct">' + r.pct + '%</div><div class="lbl">match</div></div>' +
    '</button>';
  }

  function renderResults(top) {
    el.quiz.classList.add("hide");
    el.intro.classList.add("hide");
    el.results.classList.remove("hide");
    var best = top[0];
    el.results.innerHTML =
      '<div class="results-head">' +
        '<div class="match-badge">💘 Your top matches</div>' +
        '<h2>You\'ll probably love these</h2>' +
        '<p>Based on your answers, here are the ' + top.length + ' positions most likely to work for you two. Tap any to see the full how-to.</p>' +
      '</div>' +
      '<div class="result-list">' + top.map(resultCard).join("") + '</div>' +
      '<div class="hero-actions" style="justify-content:center;margin-top:26px">' +
        '<button class="btn btn-ghost" id="retake">↺ Retake quiz</button>' +
        '<a class="btn btn-primary" href="index.html">Browse all 56 →</a>' +
      '</div>';
    el.results.querySelectorAll(".card[data-id]").forEach(function (c) {
      c.addEventListener("click", function () { if (D) D.open(+c.getAttribute("data-id")); });
    });
    document.getElementById("retake").addEventListener("click", function () {
      answers = {}; idx = 0;
      el.results.classList.add("hide"); el.quiz.classList.remove("hide");
      renderStep(); window.scrollTo({ top: 0 });
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  /* ---------- wire up ---------- */
  document.getElementById("start").addEventListener("click", function () {
    el.intro.classList.add("hide"); el.quiz.classList.remove("hide"); renderStep();
  });
  el.next.addEventListener("click", next);
  el.back.addEventListener("click", back);
})();
