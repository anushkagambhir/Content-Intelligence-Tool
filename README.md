# Influencer Intel — Setup Guide

A tool to analyse Instagram influencer content performance using Apify + Claude AI.

---

## What you need

- An **Apify** account (apify.com) — for Instagram data
- An **Anthropic** API key (console.anthropic.com) — for AI analysis
- A **Vercel** account (vercel.com) — free, for the proxy server
- A **GitHub** account (github.com) — free, to deploy to Vercel

---

## Step 1 — Push to GitHub

1. Create a new repository on github.com (name it `influencer-intel`)
2. Upload all files from this folder into the repo:
   - `index.html`
   - `vercel.json`
   - `api/scrape-start.js`
   - `api/scrape-status.js`
   - `api/scrape-results.js`

---

## Step 2 — Deploy to Vercel

1. Go to vercel.com → **Add New Project**
2. Connect your GitHub account and select the `influencer-intel` repo
3. Click **Deploy** — Vercel auto-detects the config

---

## Step 3 — Add your Apify key

1. In Vercel, go to your project → **Settings → Environment Variables**
2. Add: Name = `APIFY_KEY`, Value = your Apify token (starts with `apify_api_...`)
3. Click **Save** → then go to **Deployments** and click **Redeploy**

---

## Step 4 — Open the tool

1. Vercel gives you a URL like `https://influencer-intel.vercel.app`
2. Open `index.html` in your browser (or host it anywhere — it's a single file)
3. In the config bar at the top:
   - **Proxy URL**: paste your Vercel URL
   - **Anthropic Key**: paste your `sk-ant-...` key
   - Click **Save**

---

## Step 5 — Run your first analysis

1. Paste any Instagram profile URL
2. Click **Analyse**
3. Wait 2–4 minutes for Apify to scrape + Claude to analyse
4. Export results as CSV or JSON

---

## Costs

| Service | Cost |
|---------|------|
| Apify | ~$0.25–0.50 per creator run |
| Anthropic | ~$0.10–0.30 per analysis (depends on reel count) |
| Vercel | Free tier is sufficient |

---

## Need help?

Check that:
- Your Apify account has credits loaded
- The Instagram account is public (private accounts can't be scraped)
- Your Anthropic API key has a positive balance
