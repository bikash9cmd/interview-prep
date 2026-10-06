(function () {
  "use strict";
  var P = window.PREP;
  var TRACKS = [P.linux, P.git, P.docker];
  var BY_ID = { linux: P.linux, git: P.git, docker: P.docker };
  var LVL = { b: "Basic", i: "Intermediate", s: "Scenario" };
  var TARGET = new Date("2027-01-04T00:00:00");
  var view = document.getElementById("view");

  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function fmt(s) { return esc(s).replace(/«([^»]+)»/g, "<code>$1</code>").replace(/\n/g, "<br>"); }
  function hash(s) { var h = 5381; for (var i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0; return (h >>> 0).toString(36); }
  function el(html) { var t = document.createElement("template"); t.innerHTML = html.trim(); return t.content.firstElementChild; }

  var QUESTIONS = [];
  TRACKS.forEach(function (t) {
    t.qa.forEach(function (x, i) { x.id = t.id + "-" + hash(x.q); x.track = t.id; x.n = i + 1; QUESTIONS.push(x); });
  });
  var TASK_TOTAL = P.plan.reduce(function (n, w) { return n + w.tasks.length; }, 0);

  /* ---------- progress state: browser copy first, account copy when available ---------- */
  var LS_KEY = "prep-progress-v1";
  var state = { cards: {}, tasks: {} };
  try {
    var raw = localStorage.getItem(LS_KEY);
    if (raw) { var s0 = JSON.parse(raw); state.cards = s0.cards || {}; state.tasks = s0.tasks || {}; }
  } catch (e) {}
  var remote = null, saveTimer = null, saving = Promise.resolve(), lastSaved = "";
  function setSync(t) { document.getElementById("sync").textContent = t; }
  function snapshot() { return JSON.stringify({ cards: state.cards, tasks: state.tasks }); }
  function persist() {
    try { localStorage.setItem(LS_KEY, snapshot()); } catch (e) {}
    if (!remote) return;
    clearTimeout(saveTimer);
    saveTimer = setTimeout(function () {
      var body = snapshot();
      if (body === lastSaved) return;
      saving = saving.then(function () {
        if (!remote) return;
        return remote.set(JSON.parse(body)).then(function () {
          lastSaved = body; setSync("Progress: saved to your Claude account");
        }, function (e) {
          if (e && e.code === "quota_exceeded") setSync("Progress: account storage is full, saving in this browser only");
          else if (e && (e.code === "invalid_argument" || e.code === "revoked" || e.code === "not_granted")) { remote = null; setSync("Progress: saving in this browser only"); }
          else setSync("Progress: last save to your account failed, will retry on the next change");
        });
      });
    }, 1200);
  }
  (function connect() {
    if (!window.claude || typeof window.claude.use !== "function") return;
    Promise.all([window.claude.use("db"), window.claude.use("user")]).then(function (r) {
      var db = r[0], user = r[1];
      if (!db || !user) return null;
      return user.id().then(function (uid) {
        if (!uid) return null;
        var ref = db.doc("data/users/" + uid + "/progress");
        return ref.get().then(function (snap) {
          if (snap.exists) {
            var d = snap.data() || {};
            lastSaved = JSON.stringify({ cards: d.cards || {}, tasks: d.tasks || {} });
            state.cards = Object.assign({}, state.cards, d.cards || {});
            state.tasks = Object.assign({}, state.tasks, d.tasks || {});
          }
          remote = ref;
          setSync("Progress: saved to your Claude account");
          render(); renderStats();
          persist();
        });
      });
    }).catch(function () { setSync("Progress: saving in this browser only"); });
  })();

  function status(id) { return state.cards[id] || ""; }
  function setStatus(id, v) { if (state.cards[id] === v) delete state.cards[id]; else state.cards[id] = v; persist(); renderStats(); }
  function known(list) { return list.filter(function (q) { return status(q.id) === "know"; }).length; }

  /* ---------- header stats ---------- */
  function weekNow() {
    var now = new Date(), idx = 0;
    P.plan.forEach(function (w, i) { if (now >= new Date(w.start + "T00:00:00")) idx = i; });
    return idx;
  }
  function renderStats() {
    var days = Math.max(0, Math.ceil((TARGET - new Date()) / 86400000));
    var k = known(QUESTIONS), done = Object.keys(state.tasks).length, wi = weekNow(), w = P.plan[wi];
    document.getElementById("stats").innerHTML =
      '<div class="stat"><div class="k">Days to January 2027</div><div class="v">' + days + '</div><div class="s">Internship ends 3 Dec</div></div>' +
      '<div class="stat"><div class="k">This week</div><div class="v">Week ' + (wi + 1) + '</div><div class="s">' + esc(w.title) + '</div></div>' +
      '<div class="stat"><div class="k">Questions mastered</div><div class="v">' + k + ' / ' + QUESTIONS.length + '</div><div class="s">Marked "I know this"</div></div>' +
      '<div class="stat"><div class="k">Plan tasks done</div><div class="v">' + done + ' / ' + TASK_TOTAL + '</div><div class="s">' + Math.round(done * 100 / TASK_TOTAL) + '% of the plan</div></div>';
  }

  /* ---------- tabs ---------- */
  var TABS = [
    { id: "plan", label: "Study plan" }, { id: "linux", label: "Linux" }, { id: "git", label: "Git & GitHub" },
    { id: "docker", label: "Docker" }, { id: "drill", label: "Flashcard drill" }, { id: "mock", label: "Mock interview" },
    { id: "tips", label: "Interview tips" }
  ];
  function validTab(t) { return TABS.some(function (x) { return x.id === t; }); }
  var tab = (location.hash || "").slice(1);
  if (!validTab(tab)) { try { tab = localStorage.getItem("prep-tab") || "plan"; } catch (e) { tab = "plan"; } }
  if (!validTab(tab)) tab = "plan";
  var sub = { linux: "concepts", git: "concepts", docker: "concepts" };
  var qFilter = "all";

  function renderTabs() {
    var nav = document.getElementById("tabs");
    nav.innerHTML = "";
    TABS.forEach(function (t) {
      var b = el('<button role="tab" id="tab-' + t.id + '" aria-selected="' + (t.id === tab) + '">' + esc(t.label) + '</button>');
      b.addEventListener("click", function () { go(t.id); });
      nav.appendChild(b);
    });
  }
  function go(t) {
    tab = t;
    try { localStorage.setItem("prep-tab", t); } catch (e) {}
    renderTabs(); render();
    var nav = document.getElementById("tabs");
    if (nav.getBoundingClientRect().top < 0) nav.scrollIntoView({ block: "start" });
  }
  function render() {
    view.innerHTML = "";
    if (tab === "plan") renderPlan();
    else if (BY_ID[tab]) renderTrack(BY_ID[tab]);
    else if (tab === "drill") renderDrill();
    else if (tab === "mock") renderMock();
    else renderTips();
  }

  /* ---------- plan ---------- */
  function dshort(d) { return d.toLocaleDateString("en-GB", { day: "numeric", month: "short" }); }
  function renderPlan() {
    var FLOW = [
      ["Git", "Write code on a branch, one branch per ticket"],
      ["GitHub", "Open a pull request; a teammate reviews it"],
      ["GitHub Actions", "CI runs tests and builds a Docker image"],
      ["Registry", "The image is pushed with the commit SHA as its tag"],
      ["Linux + cloud", "Servers or Kubernetes pull and run the container"],
      ["Linux", "You debug with SSH, logs, ss, docker exec"]
    ];
    view.appendChild(el('<section class="list" style="gap:12px"><h2>The big picture</h2><p class="why">The three topics are one pipeline. Interviewers like candidates who can explain how code travels from a laptop to a running AI service.</p><ol class="flow">' +
      FLOW.map(function (f) { return '<li><b>' + esc(f[0]) + '</b><span>' + esc(f[1]) + '</span></li>'; }).join("") + '</ol></section>'));
    view.appendChild(el('<section class="list" style="gap:8px"><h2>14-week plan</h2><p class="muted">About 60 to 90 minutes a day: 20 minutes of flashcards, 40 minutes of reading plus a lab, 10 minutes answering one question out loud. Tick tasks as you finish them.</p></section>'));
    var wrap = el('<div class="list"></div>'), now = weekNow();
    P.plan.forEach(function (w, wi) {
      var start = new Date(w.start + "T00:00:00"), end = new Date(start.getTime() + 6 * 86400000);
      var doneN = w.tasks.filter(function (_, i) { return state.tasks[w.id + "-" + i]; }).length;
      var trackName = w.track === "all" ? "All topics" : BY_ID[w.track].name;
      var sec = el('<section class="week' + (wi === now ? " now" : "") + '"><div class="when"><span class="wk">Week ' + (wi + 1) + '</span><span>' + dshort(start) + ' – ' + dshort(end) + '</span><span class="cnt">' + doneN + ' / ' + w.tasks.length + ' done</span></div>' +
        '<div><h3>' + esc(w.title) + ' <span class="chip all">' + esc(trackName) + '</span>' + (wi === now ? ' <span class="chip b">This week</span>' : '') + '</h3><ul class="tasks"></ul></div></section>');
      var ul = sec.querySelector(".tasks");
      w.tasks.forEach(function (t, i) {
        var id = w.id + "-" + i;
        var li = el('<li><label><input type="checkbox" id="task-' + id + '"' + (state.tasks[id] ? " checked" : "") + '><span>' + esc(t) + '</span></label></li>');
        li.querySelector("input").addEventListener("change", function (ev) {
          if (ev.target.checked) state.tasks[id] = true; else delete state.tasks[id];
          persist(); renderStats();
          var n = w.tasks.filter(function (_, j) { return state.tasks[w.id + "-" + j]; }).length;
          sec.querySelector(".cnt").textContent = n + " / " + w.tasks.length + " done";
        });
        ul.appendChild(li);
      });
      wrap.appendChild(sec);
    });
    view.appendChild(wrap);
    view.appendChild(el('<section class="list" style="gap:8px"><h2>After these three</h2><p class="muted">Cloud + AI roles usually also ask about the topics below. Start them after the capstone, or in parallel if you have time.</p><div class="next">' +
      P.next.map(function (n) { return '<div><h3>' + esc(n.t) + '</h3><p class="muted">' + esc(n.d) + '</p></div>'; }).join("") + '</div></section>'));
  }

  /* ---------- topic pages ---------- */
  function renderTrack(t) {
    var k = known(t.qa);
    view.appendChild(el('<section class="list" style="gap:8px"><h2>' + esc(t.name) + '</h2><p class="why">' + esc(t.why) + '</p><p class="small muted">' + k + ' of ' + t.qa.length + ' questions marked "I know this"</p><div class="meter"><i style="width:' + Math.round(k * 100 / t.qa.length) + '%"></i></div></section>'));
    var nav = el('<div class="subnav" role="group" aria-label="Topic sections"></div>');
    [["concepts", "Concepts"], ["commands", "Commands"], ["questions", "Interview questions"], ["labs", "Hands-on labs"]].forEach(function (s) {
      var b = el('<button class="pill" aria-pressed="' + (sub[t.id] === s[0]) + '">' + s[1] + '</button>');
      b.addEventListener("click", function () { sub[t.id] = s[0]; render(); });
      nav.appendChild(b);
    });
    view.appendChild(nav);
    var box = el('<div></div>');
    view.appendChild(box);
    ({ concepts: concepts, commands: commands, questions: questions, labs: labs })[sub[t.id]](t, box);
  }

  function concepts(t, box) {
    var list = el('<div class="list"></div>');
    t.concepts.forEach(function (c) {
      var sec = el('<section class="concept"><h3><span class="chip ' + c.lvl + '">' + LVL[c.lvl] + '</span>' + esc(c.t) + '</h3></section>');
      c.p.forEach(function (p) { sec.appendChild(el('<p>' + fmt(p) + '</p>')); });
      if (c.ex) { var pre = document.createElement("pre"); pre.className = "ex"; pre.textContent = c.ex.join("\n"); sec.appendChild(pre); }
      if (c.tip) sec.appendChild(el('<div class="tip"><b>Interview tip</b>' + fmt(c.tip) + '</div>'));
      list.appendChild(sec);
    });
    box.appendChild(list);
  }

  function copyBtn(text, codeEl) {
    var b = el('<button class="copy" type="button">Copy</button>');
    b.addEventListener("click", function () {
      var done = function () { b.textContent = "Copied"; setTimeout(function () { b.textContent = "Copy"; }, 1400); };
      var fallback = function () { var r = document.createRange(); r.selectNodeContents(codeEl); var sel = getSelection(); sel.removeAllRanges(); sel.addRange(r); b.textContent = "Selected"; };
      try { navigator.clipboard.writeText(text).then(done, fallback); } catch (e) { fallback(); }
    });
    return b;
  }
  function commands(t, box) {
    var search = el('<input class="search" type="search" id="cmd-search-' + t.id + '" placeholder="Filter commands, e.g. port, log, branch" aria-label="Filter commands">');
    var list = el('<div></div>');
    box.appendChild(el('<p class="muted" style="margin-bottom:12px">Type each command yourself at least once. Muscle memory is what you rely on in a live screen-share interview.</p>'));
    box.appendChild(search); box.appendChild(list);
    function draw() {
      var q = search.value.trim().toLowerCase(), groups = {};
      t.cmds.forEach(function (c) {
        if (q && (c.c + " " + c.d + " " + c.g).toLowerCase().indexOf(q) < 0) return;
        (groups[c.g] = groups[c.g] || []).push(c);
      });
      list.innerHTML = "";
      var names = Object.keys(groups);
      if (!names.length) { list.appendChild(el('<p class="muted" style="padding-block:16px">No command matches "' + esc(q) + '". Try a shorter word.</p>')); return; }
      names.forEach(function (g) {
        var sec = el('<section class="cmdgroup"><h3>' + esc(g) + '</h3></section>');
        groups[g].forEach(function (c) {
          var row = el('<div class="cmdrow"><code></code><span class="d"></span></div>');
          row.querySelector("code").textContent = c.c;
          row.querySelector(".d").textContent = c.d;
          row.appendChild(copyBtn(c.c, row.querySelector("code")));
          sec.appendChild(row);
        });
        list.appendChild(sec);
      });
    }
    search.addEventListener("input", draw);
    draw();
  }

  function statusChip(id) {
    var s = status(id);
    return s === "know" ? '<span class="chip know">Know it</span>' : s === "review" ? '<span class="chip review">Review</span>' : '<span></span>';
  }
  function questions(t, box) {
    var filters = el('<div class="filters" role="group" aria-label="Filter questions"></div>');
    [["all", "All"], ["b", "Basic"], ["i", "Intermediate"], ["s", "Scenario"], ["review", "Marked review"], ["new", "Not marked yet"]].forEach(function (f) {
      var b = el('<button class="pill" aria-pressed="' + (qFilter === f[0]) + '">' + f[1] + '</button>');
      b.addEventListener("click", function () { qFilter = f[0]; render(); });
      filters.appendChild(b);
    });
    box.appendChild(el('<p class="muted" style="margin-bottom:12px">Say your answer out loud first. Then open the card and compare. Be honest with the buttons: "Review" cards come back more often in the drill.</p>'));
    box.appendChild(filters);
    var list = el('<div class="list" style="margin-top:12px"></div>');
    var shown = t.qa.filter(function (q) {
      if (qFilter === "all") return true;
      if (qFilter === "review") return status(q.id) === "review";
      if (qFilter === "new") return !status(q.id);
      return q.lvl === qFilter;
    });
    if (!shown.length) list.appendChild(el('<p class="muted" style="padding-block:16px">No questions in this filter yet.</p>'));
    shown.forEach(function (q) {
      var d = el('<details class="qa"><summary><span class="n">' + String(q.n).padStart(2, "0") + '</span><span>' + esc(q.q) + ' <span class="chip ' + q.lvl + '">' + LVL[q.lvl] + '</span></span><span class="st">' + statusChip(q.id) + '</span></summary>' +
        '<div class="ans"><p>' + fmt(q.a) + '</p><div class="row"></div></div></details>');
      var row = d.querySelector(".row");
      [["know", "I know this", "good"], ["review", "Review again", "bad"]].forEach(function (b) {
        var btn = el('<button class="btn ' + b[2] + '" type="button">' + b[1] + '</button>');
        btn.addEventListener("click", function () { setStatus(q.id, b[0]); d.querySelector(".st").innerHTML = statusChip(q.id); });
        row.appendChild(btn);
      });
      var mockBtn = el('<button class="btn" type="button">Practise in mock interview</button>');
      mockBtn.addEventListener("click", function () { mock.q = q; mock.answer = ""; mock.feedback = ""; mock.showRef = false; go("mock"); });
      row.appendChild(mockBtn);
      list.appendChild(d);
    });
    box.appendChild(list);
  }

  function labs(t, box) {
    box.appendChild(el('<p class="muted" style="margin-bottom:4px">Run these on your own Ubuntu laptop. Lines starting with $ are commands: type them, do not paste. Read the output each time and say what it means.' + (t.id === "docker" ? " You need Docker Engine installed (docs.docker.com/engine/install/ubuntu)." : "") + '</p>'));
    t.labs.forEach(function (l) {
      var sec = el('<section class="lab"><h3>' + esc(l.t) + '</h3><ol></ol></section>');
      l.steps.forEach(function (s) {
        var li = document.createElement("li");
        if (s.indexOf("$ ") === 0) li.className = "cmd";
        li.textContent = s;
        sec.querySelector("ol").appendChild(li);
      });
      box.appendChild(sec);
    });
  }

  /* ---------- flashcard drill ---------- */
  var drill = { track: "all", card: null, shown: false, knew: 0, again: 0 };
  function pickCard(track, avoid) {
    var pool = QUESTIONS.filter(function (q) { return (track === "all" || q.track === track) && q !== avoid; });
    var weights = pool.map(function (q) { var s = status(q.id); return s === "review" ? 4 : s === "know" ? 0.6 : 2.5; });
    var total = weights.reduce(function (a, b) { return a + b; }, 0), r = Math.random() * total;
    for (var i = 0; i < pool.length; i++) { r -= weights[i]; if (r <= 0) return pool[i]; }
    return pool[pool.length - 1];
  }
  function renderDrill() {
    if (!drill.card || (drill.track !== "all" && drill.card.track !== drill.track)) { drill.card = pickCard(drill.track); drill.shown = false; }
    var q = drill.card, pool = QUESTIONS.filter(function (x) { return drill.track === "all" || x.track === drill.track; });
    view.appendChild(el('<section class="list" style="gap:8px"><h2>Flashcard drill</h2><p class="why">Cards you mark "Review" come back about seven times as often as cards you know. Answer in your head, then reveal.</p></section>'));
    var pills = el('<div class="subnav" role="group" aria-label="Drill topic"></div>');
    [["all", "All topics"]].concat(TRACKS.map(function (t) { return [t.id, t.name]; })).forEach(function (o) {
      var b = el('<button class="pill" aria-pressed="' + (drill.track === o[0]) + '">' + esc(o[1]) + '</button>');
      b.addEventListener("click", function () { drill.track = o[0]; drill.card = null; render(); });
      pills.appendChild(b);
    });
    view.appendChild(pills);
    var card = el('<div class="card"><div class="row"><span class="chip all">' + esc(BY_ID[q.track].name) + '</span><span class="chip ' + q.lvl + '">' + LVL[q.lvl] + '</span>' + statusChip(q.id) + '</div><div class="q">' + esc(q.q) + '</div>' +
      (drill.shown ? '<p class="ans0">' + fmt(q.a) + '</p>' : '') + '<div class="row act"></div></div>');
    var act = card.querySelector(".act");
    function next(mark) {
      if (mark) { if (status(q.id) !== mark) setStatus(q.id, mark); if (mark === "know") drill.knew++; else drill.again++; }
      drill.card = pickCard(drill.track, q); drill.shown = false; render();
    }
    if (!drill.shown) {
      var show = el('<button class="btn primary" type="button">Show answer</button>');
      show.addEventListener("click", function () { drill.shown = true; render(); });
      act.appendChild(show);
    } else {
      var a = el('<button class="btn good" type="button">I knew it</button>'); a.addEventListener("click", function () { next("know"); }); act.appendChild(a);
      var b2 = el('<button class="btn bad" type="button">Review again</button>'); b2.addEventListener("click", function () { next("review"); }); act.appendChild(b2);
    }
    var skip = el('<button class="btn" type="button">Skip</button>'); skip.addEventListener("click", function () { next(null); }); act.appendChild(skip);
    view.appendChild(card);
    view.appendChild(el('<p class="small muted">This session: ' + drill.knew + ' knew, ' + drill.again + ' to review. In this set: ' + known(pool) + ' of ' + pool.length + ' mastered.</p>'));
  }

  /* ---------- mock interview (asks Claude to grade) ---------- */
  var mock = { track: "all", lvl: "any", q: null, answer: "", feedback: "", showRef: false };
  var sampleFn = null, sampleChecked = false, ctl = null;
  if (window.claude && typeof window.claude.use === "function") {
    window.claude.use("sample").then(function (f) { sampleFn = f; sampleChecked = true; if (tab === "mock") render(); }, function () { sampleChecked = true; });
  } else sampleChecked = true;
  var HIDE = ["not_granted", "sampling_disabled", "not_declared", "capability_disabled", "capability_removed"];
  function sampleMsg(code) {
    if (code === "cancelled") return "Stopped.";
    if (HIDE.indexOf(code) >= 0) return "Claude grading is not available in this view. Open the reference answer and grade yourself.";
    if (code === "rate_limited") return "Too many grading requests right now. Wait a minute, then press Grade again.";
    if (code === "session_expired") return "Your Claude session expired. Sign in again, then press Grade again.";
    if (code === "refused") return "Claude could not grade this answer. Rephrase it and try again.";
    return "The grading request failed. Press Grade again.";
  }
  function newMockQ() {
    var pool = QUESTIONS.filter(function (q) { return (mock.track === "all" || q.track === mock.track) && (mock.lvl === "any" || q.lvl === mock.lvl); });
    if (!pool.length) pool = QUESTIONS;
    var fresh = pool.filter(function (q) { return status(q.id) !== "know" && q !== mock.q; });
    var from = fresh.length ? fresh : pool;
    mock.q = from[Math.floor(Math.random() * from.length)];
    mock.answer = ""; mock.feedback = ""; mock.showRef = false;
  }
  function gradePrompt(q, answer) {
    var topic = BY_ID[q.track] ? BY_ID[q.track].name : "Linux, Git and Docker";
    return "You are a friendly but honest technical interviewer for a junior Cloud + AI engineer role. The candidate is a beginner finishing a software engineering internship.\n\n" +
      "Topic: " + topic + "\nQuestion: " + q.q + "\n" +
      (q.ref === false ? "There is no reference answer; judge from your own knowledge.\n" : "Reference answer (the candidate may be correct in other ways too): " + q.a.replace(/[«»]/g, "") + "\n") +
      "Candidate's answer: " + answer.slice(0, 6000) + "\n\n" +
      "Grade it. Reply in plain text, no markdown headings or bold, with exactly these sections:\n" +
      "Score: N/10\nWhat was good:\n- ...\nWhat was missing or wrong:\n- ...\nStronger answer: (3 to 5 plain sentences the candidate could say)\nFollow-up question: (one question a real interviewer would ask next, on one line)\n\n" +
      "Use simple English. Stay under 250 words.";
  }
  function renderMock() {
    if (!mock.q) newMockQ();
    var q = mock.q;
    view.appendChild(el('<section class="list" style="gap:8px"><h2>Mock interview</h2><p class="why">Answer the way you would speak in an interview: full sentences, an example, a trade-off. Claude scores it out of 10, shows what was missing and asks a follow-up. Grading uses your own Claude account.</p></section>'));
    var ctr = el('<div class="row"><label class="small muted" for="mock-track">Topic</label><select id="mock-track"><option value="all">All topics</option>' +
      TRACKS.map(function (t) { return '<option value="' + t.id + '">' + esc(t.name) + '</option>'; }).join("") + '</select>' +
      '<label class="small muted" for="mock-lvl">Level</label><select id="mock-lvl"><option value="any">Any level</option><option value="b">Basic</option><option value="i">Intermediate</option><option value="s">Scenario</option></select>' +
      '<button class="btn" type="button" id="mock-new">New question</button></div>');
    ctr.querySelector("#mock-track").value = mock.track;
    ctr.querySelector("#mock-lvl").value = mock.lvl;
    ctr.querySelector("#mock-track").addEventListener("change", function (e) { mock.track = e.target.value; newMockQ(); render(); });
    ctr.querySelector("#mock-lvl").addEventListener("change", function (e) { mock.lvl = e.target.value; newMockQ(); render(); });
    ctr.querySelector("#mock-new").addEventListener("click", function () { if (ctl) ctl.abort(); newMockQ(); render(); });
    view.appendChild(ctr);

    var card = el('<div class="card"><div class="row"><span class="chip all">' + esc(BY_ID[q.track] ? BY_ID[q.track].name : "Follow-up") + '</span><span class="chip ' + q.lvl + '">' + (LVL[q.lvl] || "Follow-up") + '</span></div>' +
      '<div class="q">' + esc(q.q) + '</div><label class="small muted" for="mock-answer">Your answer</label><textarea id="mock-answer" placeholder="Type your answer here, as you would say it out loud."></textarea>' +
      '<div class="row"><button class="btn primary" type="button" id="mock-grade">Grade my answer</button><button class="btn" type="button" id="mock-stop" hidden>Stop</button>' +
      (q.ref === false ? '' : '<button class="btn" type="button" id="mock-ref">' + (mock.showRef ? "Hide" : "Show") + ' reference answer</button>') +
      '<button class="btn" type="button" id="mock-follow" hidden>Answer the follow-up</button></div>' +
      '<p class="small muted" id="mock-note"></p><div class="feedback" id="mock-fb" hidden></div>' +
      (mock.showRef && q.ref !== false ? '<div class="tip"><b>Reference answer</b>' + fmt(q.a) + '</div>' : '') + '</div>');
    var ta = card.querySelector("#mock-answer"), fb = card.querySelector("#mock-fb"), note = card.querySelector("#mock-note");
    var gradeBtn = card.querySelector("#mock-grade"), stopBtn = card.querySelector("#mock-stop"), followBtn = card.querySelector("#mock-follow");
    ta.value = mock.answer;
    ta.addEventListener("input", function () { mock.answer = ta.value; });
    function showFeedback(t) { mock.feedback = t; fb.hidden = !t; fb.textContent = t; var m = /Follow-up question:\s*(.+)/i.exec(t); followBtn.hidden = !m; }
    showFeedback(mock.feedback);
    if (!sampleFn) {
      gradeBtn.hidden = true;
      note.textContent = sampleChecked ? "Claude grading is not available in this view. Answer, then open the reference answer and score yourself out of 10." : "Connecting to Claude for grading...";
    }
    var ref = card.querySelector("#mock-ref");
    if (ref) ref.addEventListener("click", function () { mock.showRef = !mock.showRef; render(); });
    stopBtn.addEventListener("click", function () { if (ctl) ctl.abort(); });
    followBtn.addEventListener("click", function () {
      var m = /Follow-up question:\s*(.+)/i.exec(mock.feedback);
      if (!m) return;
      mock.q = { q: m[1].trim(), a: "", lvl: "f", track: q.track, ref: false };
      mock.answer = ""; mock.feedback = ""; mock.showRef = false; render();
    });
    gradeBtn.addEventListener("click", function () {
      var answer = ta.value.trim();
      if (answer.length < 20) { note.textContent = "Write at least two sentences first. Short answers lose points in real interviews too."; return; }
      if (!sampleFn) return;
      ctl = new AbortController();
      var my = ctl;
      note.textContent = ""; showFeedback("Thinking...");
      gradeBtn.disabled = true; stopBtn.hidden = false;
      sampleFn(gradePrompt(q, answer), { signal: my.signal, cache: false, onText: function (u) { showFeedback(u.text); } }).then(function (r) {
        showFeedback(r.text);
        if (r.truncated) note.textContent = "The feedback was cut short. Try a shorter answer.";
      }, function (e) {
        var code = e && e.code;
        showFeedback(code === "refused" ? "" : (e && e.text) || "");
        note.textContent = sampleMsg(code);
        if (HIDE.indexOf(code) >= 0) { sampleFn = null; gradeBtn.hidden = true; }
      }).then(function () { gradeBtn.disabled = false; stopBtn.hidden = true; if (ctl === my) ctl = null; });
    });
    view.appendChild(card);
  }

  /* ---------- tips ---------- */
  function renderTips() {
    view.appendChild(el('<section class="list" style="gap:8px"><h2>Interview tips</h2><p class="why">Knowing the material is half of it. The other half is answering in a clear shape and showing how you think.</p></section>'));
    var list = el('<div class="list"></div>');
    P.tips.forEach(function (t) { list.appendChild(el('<section class="concept"><h3>' + esc(t.t) + '</h3><p>' + fmt(t.p) + '</p></section>')); });
    view.appendChild(list);
  }

  renderTabs(); renderStats(); render();
})();
