(() => {
  "use strict";

  const C = {
    statsUrl: "./stats.json",
    fallback: 497,
    goal: 500,
    step: 100,
    refresh: 60000,
    key: "hello-neighbor-tracker-v2"
  };

  const $ = id => document.getElementById(id);

  const e = {
    visits: $("visits"),
    banner: $("banner"),
    dot: $("dot"),
    status: $("status"),
    note: $("status-note"),
    goal: $("goal"),
    bar: $("bar"),
    fill: $("fill"),
    progress: $("progress-text"),
    pct: $("pct"),
    remaining: $("remaining"),
    edit: $("edit-goal"),
    form: $("goal-form"),
    input: $("goal-input"),
    error: $("goal-error"),
    auto: $("goal-auto"),
    mode: $("goal-mode"),
    eta: $("eta"),
    etaNote: $("eta-note"),
    avg: $("avg"),
    avgNote: $("avg-note"),
    last: $("last"),
    lastAbs: $("last-abs"),
    milestones: $("milestones"),
    clear: $("clear-local")
  };

  let s = {
    visits: C.fallback,
    checkedAt: null,
    source: "initial",
    history: [],
    customGoal: null,
    goalMode: "automatic"
  };

  function save() {
    try {
      localStorage.setItem(C.key, JSON.stringify(s));
    } catch (_) {}
  }

  function load() {
    try {
      const x = JSON.parse(localStorage.getItem(C.key) || "null");

      if (!x) return;

      if (Number.isSafeInteger(x.visits) && x.visits >= 0) {
        s.visits = x.visits;
      }

      if (Array.isArray(x.history)) {
        s.history = x.history;
      }

      if (typeof x.checkedAt === "string" || x.checkedAt === null) {
        s.checkedAt = x.checkedAt;
      }

      if (typeof x.source === "string") {
        s.source = x.source;
      }

      if (Number.isSafeInteger(x.customGoal) && x.customGoal > 0) {
        s.customGoal = x.customGoal;
      }

      if (x.goalMode === "custom") {
        s.goalMode = "custom";
      }
    } catch (_) {}
  }

  function num(n) {
    return new Intl.NumberFormat("en-US").format(n);
  }

  function autoGoal(v) {
    return v < C.goal
      ? C.goal
      : (Math.floor(v / C.step) + 1) * C.step;
  }

  function goal() {
    return (
      s.goalMode === "custom" &&
      Number.isSafeInteger(s.customGoal) &&
      s.customGoal > s.visits
    )
      ? s.customGoal
      : autoGoal(s.visits);
  }

  function relative(iso) {
    if (!iso) {
      return "Waiting for first tracker update";
    }

    const d = Date.now() - Date.parse(iso);
    const m = Math.floor(Math.max(0, d) / 60000);

    if (m < 1) return "Just now";

    if (m < 60) {
      return `${m} minute${m === 1 ? "" : "s"} ago`;
    }

    const h = Math.floor(m / 60);

    if (h < 24) {
      return `${h} hour${h === 1 ? "" : "s"} ago`;
    }

    const days = Math.floor(h / 24);

    return `${days} day${days === 1 ? "" : "s"} ago`;
  }

  function absolute(iso) {
    if (!iso) return "";

    const t = Date.parse(iso);

    return Number.isFinite(t)
      ? new Intl.DateTimeFormat(undefined, {
          dateStyle: "medium",
          timeStyle: "short"
        }).format(new Date(t))
      : "";
  }

  function rate() {
    const a = s.history
      .filter(
        x =>
          Number.isSafeInteger(x.visits) &&
          Number.isFinite(Date.parse(x.timestamp))
      )
      .sort(
        (x, y) =>
          Date.parse(x.timestamp) - Date.parse(y.timestamp)
      );

    if (a.length < 2) return null;

    const first = a[0];
    const last = a[a.length - 1];

    const days =
      (Date.parse(last.timestamp) -
        Date.parse(first.timestamp)) /
      86400000;

    const growth = last.visits - first.visits;

    if (days <= 0 || growth <= 0) return null;

    const overall = growth / days;

    const cut =
      Date.parse(last.timestamp) -
      7 * 86400000;

    const recent = a.filter(
      x => Date.parse(x.timestamp) >= cut
    );

    let r = null;

    if (recent.length >= 2) {
      const x = recent[0];
      const y = recent[recent.length - 1];

      const d =
        (Date.parse(y.timestamp) -
          Date.parse(x.timestamp)) /
        86400000;

      const g = y.visits - x.visits;

      if (d > 0 && g > 0) {
        r = g / d;
      }
    }

    return {
      perDay:
        r !== null
          ? r * 0.65 + overall * 0.35
          : overall,
      samples: a.length
    };
  }

  function render() {
    const v = s.visits;
    const g = goal();

    const p = Math.min(
      100,
      Math.max(0, (v / g) * 100)
    );

    const left = Math.max(0, g - v);

    e.visits.textContent = num(v);
    e.goal.textContent = num(g);

    e.fill.style.width = p + "%";

    e.bar.setAttribute(
      "aria-valuenow",
      p.toFixed(1)
    );

    e.progress.textContent =
      `${num(v)} / ${num(g)}`;

    e.pct.textContent =
      p.toFixed(1) + "%";

    e.remaining.textContent = left
      ? `${num(left)} visit${left === 1 ? "" : "s"} remaining`
      : "Milestone reached!";

    if (left && left <= 10) {
      e.banner.hidden = false;
      e.banner.className = "banner hot";
      e.banner.textContent =
        `🔥 ${num(left)} visit${left === 1 ? "" : "s"} until ${num(g)}!`;
    } else if (!left) {
      e.banner.hidden = false;
      e.banner.className = "banner win";
      e.banner.textContent =
        `🎉 ${num(g)} visits reached!`;
    } else {
      e.banner.hidden = true;
    }

    const age = s.checkedAt
      ? Date.now() - Date.parse(s.checkedAt)
      : Infinity;

    const online =
      s.source === "roblox" &&
      Number.isFinite(age) &&
      age < 45 * 60000;

    e.dot.className =
      "dot " + (online ? "online" : "stale");

    e.status.textContent = online
      ? "Tracker Online"
      : s.source === "initial"
        ? "Tracker Initializing"
        : "Using Last Known Data";

    e.note.textContent = online
      ? "Latest successful Roblox visit check received."
      : s.source === "initial"
        ? "Tracker ready — waiting for first automatic Roblox update"
        : "Roblox check is delayed; showing the last valid data.";

    e.last.textContent =
      relative(s.checkedAt);

    e.lastAbs.textContent =
      absolute(s.checkedAt);

    const r = rate();

    if (!r) {
      e.eta.textContent =
        "Collecting data…";

      e.etaNote.textContent =
        "Need at least two time-stamped visit points with positive growth.";

      e.avg.textContent =
        "Collecting data…";

      e.avgNote.textContent =
        "Waiting for measurable visit growth.";
    } else {
      const days =
        Math.max(0, (g - v) / r.perDay);

      e.eta.textContent =
        !left
          ? "Milestone reached"
          : days < 1
            ? `${Math.max(1, Math.round(days * 24))} hours`
            : days < 7
              ? `${Math.max(1, Math.round(days))} days`
              : `${(days / 7).toFixed(1)} weeks`;

      e.etaNote.textContent = left
        ? `Approx. ${new Date(
            Date.now() +
            days * 86400000
          ).toLocaleDateString(undefined, {
            dateStyle: "medium"
          })}`
        : "Next goal will activate automatically.";

      e.avg.textContent =
        `${r.perDay < 1
          ? r.perDay.toFixed(2)
          : r.perDay < 10
            ? r.perDay.toFixed(1)
            : Math.round(r.perDay)
        } visits / day`;

      e.avgNote.textContent =
        `Based on ${r.samples} snapshots`;
    }

    e.input.value = g;

    e.mode.textContent =
      s.goalMode === "custom"
        ? "Custom goal saved on this device."
        : "Automatic goals advance in +100 visit steps.";

    e.milestones.replaceChildren();

    const set = new Set([g]);

    const start = Math.max(
      C.step,
      Math.floor(v / C.step) * C.step - C.step
    );

    const end = Math.max(
      g,
      Math.ceil((v + 1) / C.step) * C.step +
        C.step * 3
    );

    for (
      let n = start;
      n <= end;
      n += C.step
    ) {
      set.add(n);
    }

    [...set]
      .sort((a, b) => a - b)
      .forEach(n => {
        const li =
          document.createElement("li");

        const done = v >= n;
        const now = !done && n === g;

        li.className =
          (done ? "done " : "") +
          (now ? "now" : "");

        li.innerHTML = `
          <span class="i">
            ${done ? "✓" : now ? "→" : "○"}
          </span>
          <span class="n">${num(n)}</span>
          <span class="s">
            ${done
              ? "Reached"
              : now
                ? "Current Goal"
                : "Upcoming"}
          </span>
        `;

        e.milestones.append(li);
      });
  }

  async function refresh() {
    try {
      const r = await fetch(
        `${C.statsUrl}?cache=${Date.now()}`,
        {
          cache: "no-store"
        }
      );

      if (!r.ok) {
        throw new Error(
          "stats.json unavailable"
        );
      }

      const d = await r.json();

      const v = Number(d.visits);

      if (
        !Number.isSafeInteger(v) ||
        v < 0 ||
        (v < s.visits && s.source === "roblox")
      ) {
        throw new Error(
          "Invalid/decreasing data"
        );
      }

      s.visits = v;

      s.checkedAt =
        typeof d.checkedAt === "string"
          ? d.checkedAt
          : null;

      s.source =
        d.source || "roblox";

      s.history =
        Array.isArray(d.history)
          ? d.history
          : [];

      save();
      render();
    } catch (err) {
      console.warn(err);
      render();
    }
  }

  e.edit.addEventListener(
    "click",
    () => {
      const open = e.form.hidden;

      e.form.hidden = !open;

      e.edit.setAttribute(
        "aria-expanded",
        open
      );

      if (open) {
        e.input.focus();
      }
    }
  );

  e.form.addEventListener(
    "submit",
    ev => {
      ev.preventDefault();

      const v = Number(
        e.input.value
      );

      e.error.hidden = true;

      if (
        !Number.isSafeInteger(v) ||
        v <= s.visits
      ) {
        e.error.textContent =
          `Goal must be greater than the current ${num(s.visits)} visits.`;

        e.error.hidden = false;

        return;
      }

      s.customGoal = v;
      s.goalMode = "custom";

      save();

      e.form.hidden = true;

      e.edit.setAttribute(
        "aria-expanded",
        "false"
      );

      render();
    }
  );

  e.auto.addEventListener(
    "click",
    () => {
      s.customGoal = null;
      s.goalMode = "automatic";

      save();

      e.form.hidden = true;

      e.edit.setAttribute(
        "aria-expanded",
        "false"
      );

      render();
    }
  );

  e.clear.addEventListener(
    "click",
    () => {
      localStorage.removeItem(C.key);

      s = {
        visits: C.fallback,
        checkedAt: null,
        source: "initial",
        history: [],
        customGoal: null,
        goalMode: "automatic"
      };

      render();
      refresh();
    }
  );

  load();
  render();
  refresh();

  setInterval(
    refresh,
    C.refresh
  );

  setInterval(
    render,
    30000
  );
})();
