# SpecScope

A free website that recommends phones, laptops, PCs, tablets etc. based on a visitor's budget and needs, using Google's Gemini AI (free tier). Built as static HTML/CSS/JS so it can run on GitHub Pages at zero cost.

## Files
- `index.html` — page structure
- `style.css` — all styling
- `script.js` — form logic + the Gemini API call (config lives at the top)

## 1. Get a free Gemini API key
1. Go to https://aistudio.google.com/apikey
2. Sign in with a Google account and click **Create API key** — it's free, no card required.
3. Copy the key.

## 2. Add the key to the site
Open `script.js` and replace:
```js
const GEMINI_API_KEY = "PASTE_YOUR_GEMINI_API_KEY_HERE";
```
with your actual key.

## 3. Lock the key to your domain (important)
Because this is a static site with no server, the key lives in code anyone can view. To stop strangers from using your free quota:
1. In Google AI Studio (or Google Cloud Console → Credentials), open your key's settings.
2. Add an **HTTP referrer restriction**, e.g. `https://YOUR-USERNAME.github.io/*`
3. Save.

Now the key only works when called from your published site.

## 4. Put it on GitHub Pages (free hosting)
1. Create a new repository on GitHub (e.g. `specscope`).
2. Upload `index.html`, `style.css`, and `script.js` to the repo root (drag-and-drop on the GitHub website works fine, or `git push` if you use Git).
3. In the repo, go to **Settings → Pages**.
4. Under "Build and deployment", set **Source: Deploy from a branch**, branch: `main`, folder: `/ (root)`. Save.
5. GitHub gives you a live URL in a minute or two, usually:
   `https://YOUR-USERNAME.github.io/specscope/`
6. Go back and finish step 3 (referrer restriction) using this exact URL.

Your site is now live, free, and working.

## 5. Add ads later (Google AdSense)
Once your site has some real content/traffic and you want to monetize:
1. Apply at https://www.google.com/adsense — you'll need a working, published site (which you'll have) and it can take days to get approved.
2. Once approved, AdSense gives you a `<script>` snippet and per-slot `<ins class="adsbygoogle">` snippets.
3. In `index.html`, there are three marked slots ready for this:
   - `<div id="ad-slot-top">` — right under the header
   - `<div id="ad-slot-mid">` — between the console and "How it works"
   - `<div id="ad-slot-footer">` — in the footer
4. Paste the head `<script>` snippet once, right before `</head>`.
5. Paste each `<ins>` snippet inside its matching `<div>`, and remove that div's `ad-slot--empty` class so it displays.

## Notes on the free tier
- Gemini's free tier has a daily request limit that can change over time — check current limits at https://ai.google.dev/pricing before you expect heavy traffic.
- If you outgrow the free tier or want the key fully hidden from visitors, the next step up is a small serverless function (e.g. a free Vercel or Cloudflare Worker function) that holds the key server-side. Ask if you want that version built.

## Customizing
- Colors, fonts, and layout are all in `style.css` under the `:root` variables at the top.
- Copy/wording lives directly in `index.html`.
- The recommendation prompt sent to Gemini is in `script.js` inside `buildPrompt()` — edit it if you want different output fields or a different tone.

