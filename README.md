# Hello Neighbor Live Visit Predictor

This version automatically tracks the Roblox experience's public lifetime visit count with a GitHub Actions scheduled job and stores changed counts in `stats.json`.

## Setup

1. Upload all files to the root of a GitHub repository.
2. Keep the `.github/workflows/update-stats.yml` path exactly as shown.
3. Enable GitHub Actions if prompted.
4. Open **Actions → Update Roblox visit tracker → Run workflow** once to test it immediately.
5. Enable GitHub Pages from **Settings → Pages → Deploy from a branch → main → / (root)**.

The scheduled job checks about every 15 minutes. GitHub's scheduler can run later than the exact cron time, so this is periodic rather than instant/live-to-the-second.

## Security

The tracker uses Roblox's public read-only game stats endpoint and does not need a Roblox password, `.ROBLOSECURITY` cookie, or API key. Do not put private Roblox credentials into GitHub Pages or this workflow.

## Game

The configured Place ID is `86495471270335`. The workflow resolves the corresponding Universe ID and then reads the public `visits` field.
