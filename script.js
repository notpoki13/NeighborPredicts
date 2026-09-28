const DEFAULT_GOAL = 500;
const GOAL_KEY = "hnPredictorGoal";
const STATS_URL = "stats.json";

const $ = (id) => document.getElementById(id);

function readGoal() {
  const value = Number.parseInt(localStorage.getItem(GOAL_KEY) ?? "", 10);
  return Number.isInteger(value) && value > 0 ? value : DEFAULT_GOAL;
}

function saveGoal() {
  const value = Number.parseInt($("goal").value, 10);
  if (!Number.isInteger(value) || value <= 0) return;
  localStorage.setItem(GOAL_KEY, String(value));
  render();
}

function averageRate(snapshots) {
  if (snapshots.length < 2) return null;
  const first = snapshots[0], last = snapshots[snapshots.length - 1];
  const days = (new Date(last.time) - new Date(first.time)) / 86400000;
  const gained = last.visits - first.visits;
  return days > 0 && gained > 0 ? gained / days : null;
}

function formatDate(value) {
  return new Date(value).toLocaleString(undefined, {dateStyle:"medium", timeStyle:"short"});
}

function render(data) {
  const goal = readGoal();
  $("goal").value = goal;
  const snapshots = Array.isArray(data.snapshots) ? data.snapshots : [];
  const current = Number.isInteger(data.visits) ? data.visits : 0;
  const percent = Math.min(100, current / goal * 100);
  $("visits").textContent = current.toLocaleString();
  $("goalLabel").textContent = `/ ${goal.toLocaleString()}`;
  $("progress").style.width = `${percent}%`;
  $("progressText").textContent = `${percent.toFixed(1)}% of the goal`;
  $("updated").textContent = data.updatedAt ? `Last Roblox check: ${formatDate(data.updatedAt)}` : "No automatic update yet.";
  $("count").textContent = `${snapshots.length} automatic snapshot${snapshots.length === 1 ? "" : "s"}`;

  const rate = averageRate(snapshots);
  const remaining = goal - current;
  if (remaining <= 0) {
    $("prediction").textContent = "Goal reached 🎉";
    $("rate").textContent = "The next automatic milestone is ready once the tracker records the new count.";
  } else if (!rate) {
    $("prediction").textContent = "Collecting data…";
    $("rate").textContent = "Two or more automatic snapshots with increasing visits are needed for a rate.";
  } else {
    const eta = new Date(Date.now() + remaining / rate * 86400000);
    $("prediction").textContent = formatDate(eta);
    $("rate").textContent = `${rate.toFixed(2)} visits/day • ${remaining.toLocaleString()} visits remaining`;
  }

  const history = $("history"); history.innerHTML = "";
  [...snapshots].reverse().slice(0, 100).forEach((s) => {
    const row = document.createElement("div"); row.className = "row";
    const date = document.createElement("span"); date.textContent = formatDate(s.time);
    const visits = document.createElement("strong"); visits.textContent = Number(s.visits).toLocaleString();
    row.append(date, visits); history.append(row);
  });
}

async function load() {
  try {
    const response = await fetch(`${STATS_URL}?cacheBust=${Date.now()}`, {cache:"no-store"});
    if (!response.ok) throw new Error(`stats.json returned ${response.status}`);
    const data = await response.json();
    render(data);
    $("status").textContent = "Live tracker online";
    $("status").className = "pill ok";
  } catch (error) {
    console.error("Failed to load automatic Roblox data:", error);
    $("status").textContent = "Tracker unavailable";
    $("status").className = "pill error";
    $("prediction").textContent = "Waiting for GitHub update…";
  }
}

$("saveGoal").addEventListener("click", saveGoal);
load();
setInterval(load, 60000);
