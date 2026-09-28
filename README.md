# Hello Neighbor · Live Visit Tracker

Roblox Place ID: `86495471270335`.

This GitHub Pages tracker starts at the known 497 visits and automatically updates `stats.json` through GitHub Actions about every 15 minutes.

## First update
Open GitHub → Actions → **Update Roblox Visit Stats** → **Run workflow**. This gives you an immediate first check instead of waiting for the schedule.

## How it works
Roblox public stats → GitHub Actions → `stats.json` → GitHub Pages.

The workflow resolves the Universe ID from the Place ID, reads the public visit count, validates it, and commits the latest successful check. History receives a new prediction snapshot only when the visit count changes.

## Prediction
The ETA uses real timestamped history and requires at least two useful points with positive growth. It will show **Collecting data…** instead of inventing an ETA.

## Goals
Automatic goals are 500, 600, 700, 800, 900, 1000, etc. Custom goals are saved only on the current device.

## Important
GitHub Actions schedules are approximate; `*/15 * * * *` means roughly every 15 minutes, not an exact guarantee.
