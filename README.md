# Better Birding Buddy

A shareable website for comparing your [Waarneming.nl](https://waarneming.nl) bird observations with up to four friends', side by side, with rare sightings flagged at the top.

No accounts, no passwords, no emails. All state lives in the URL — every comparison is a shareable link.

---

## What it does

- **Grid view** — up to 4 buddies side by side, each column showing their species for the selected period
- **Rarity highlights** — rare and very rare sightings surfaced at the top of each column
- **5 comparison modes** — "they saw, you didn't", "you saw, they didn't", "both saw", "their lifers over mine", "their full list"
- **Period presets + custom ranges** — last 7/30 days, last week, last month, this year, or any date range
- **Shareable URLs** — the browser URL captures your full setup; copy-paste to share a comparison

## Architecture

Static React app + one Netlify Function (a CORS proxy to the waarneming.nl API).

```
┌─────────────┐      ┌────────────────────┐      ┌──────────────────┐
│ React SPA   │────▶ │ Netlify Function   │────▶ │ waarneming.nl API│
│ (Vite)      │      │ /api/fetch         │      │ (OAuth protected)│
└─────────────┘      └────────────────────┘      └──────────────────┘
```

The function exists because waarneming.nl requires OAuth and doesn't send CORS headers for browser clients. It's a ~40-line stateless proxy — no database, no queue, nothing else.

---

## Setup

### 1. Clone and install

```bash
git clone <your-repo-url> bbb
cd bbb
npm install
```

### 2. Register a Waarneming.nl OAuth client

This is the one slow step — requires emailing the waarneming.nl admin:

- Email **hiskodevries@gmail.com** explaining you're building a personal birding comparison tool and need an OAuth2 client
- Provide an app name ("Better Birding Buddy") and a redirect URI (e.g. `https://your-site.netlify.app/`)
- Wait for a response with your `client_id`

Once you have `client_id`, exchange your waarneming.nl credentials for tokens (one-time):

```bash
curl -X POST https://waarneming.nl/api/v1/oauth2/token/ \
  -d "client_id=YOUR_CLIENT_ID" \
  -d "grant_type=password" \
  -d "email=YOUR_WAARNEMING_EMAIL" \
  -d "password=YOUR_WAARNEMING_PASSWORD"
```

The response has `access_token` (valid ~10 hours) and `refresh_token` (long-lived). The app auto-refreshes the access token — you only do this curl once.

**Note**: your waarneming.nl account is used to read other users' *publicly-visible* observations on their behalf. Private or embargoed sightings are never exposed.

### 3. Deploy to Netlify

1. Push this repo to GitHub (or GitLab/Bitbucket)
2. On [netlify.com](https://netlify.com): **Add new site → Import existing project**, connect your repo
3. Build settings auto-detect from `netlify.toml`
4. After the first deploy, go to **Site configuration → Environment variables** and add:

   ```
   WNMG_CLIENT_ID     = your_client_id_here
   WNMG_ACCESS_TOKEN  = the access_token from the curl above
   WNMG_REFRESH_TOKEN = the refresh_token from the curl above
   ```

5. Trigger a redeploy so functions pick up the vars.

That's it.

---

## Local development

```bash
# Install Netlify CLI if needed
npm install -g netlify-cli

# Copy env template
cp .env.example .env.local
# edit .env.local with your waarneming.nl OAuth tokens

# Start dev server — runs Vite + functions together
npm run dev
# → http://localhost:8888
```

---

## How to use

1. Paste your Waarneming.nl profile URL (e.g. `https://waarneming.nl/users/57388/`)
2. Paste up to four friends' profile URLs
3. Click **Compare**
4. Adjust the **period** and **comparison mode** chips — results update instantly
5. The URL in your browser bar is now a shareable link. Send it to a birding group, paste it into a chat, whatever

### Shareable URL format

```
https://your-site.netlify.app/?me=57388&buddies=43083,24601,13579&period=last-7&mode=they-not-me
```

Every parameter is optional except `me` and `buddies`. Omitted params fall back to defaults (`period=last-7`, `mode=they-not-me`).

### Comparison modes

| Mode              | Shows                                                                          |
|-------------------|--------------------------------------------------------------------------------|
| **They saw, I didn't** (default) | Species your buddy observed in the period that you didn't           |
| **I saw, they didn't**           | Species you observed that your buddy didn't                         |
| **We both saw**                  | Species you both spotted — shared finds                             |
| **Their lifers over mine**       | Species your buddy has ever seen that you've never recorded (hot list for a chase) |
| **Their full list**              | Everything your buddy logged in the period                          |

Within each buddy's column, results are sorted by rarity first, then by recency.

---

## File structure

```
bbb/
├── src/                          # React frontend
│   ├── main.jsx
│   ├── App.jsx                   # routes between Home form and Compare grid
│   ├── styles.css
│   ├── components/Masthead.jsx
│   ├── pages/
│   │   ├── Home.jsx              # landing form
│   │   └── Compare.jsx           # grid view with all buddies side by side
│   └── lib/
│       ├── api.js                # /api/fetch wrapper
│       ├── compare.js            # pure comparison engine (client-side)
│       ├── urlParams.js          # URL ↔ state serialization
│       └── format.js             # date formatting
│
├── netlify/functions/
│   └── fetch-observations.js     # OAuth proxy to waarneming.nl
│
├── shared/
│   └── wnmg.js                   # OAuth auth + API client
│
├── netlify.toml
├── package.json
├── vite.config.js
├── index.html
└── .env.example
```

---

## Troubleshooting

**"waarneming.nl token refresh failed: 400"**
→ Your refresh token was revoked or expired. Re-run the curl from setup step 2 to get a new pair; update env vars in Netlify and redeploy.

**"Invalid userId" error**
→ Only numeric user IDs are accepted. The app auto-extracts the ID from profile URLs like `https://waarneming.nl/users/57388/`. If the input has no digits, it rejects.

**Empty columns for a buddy with observations**
→ Their observations may be private, under embargo, or outside the selected date range. Try extending the period or checking their profile directly.

**Everything loads slowly**
→ The first fetch per user can take 2-4 seconds (waarneming.nl response time + cold-starting the Netlify Function). Subsequent fetches for the same user/period are cached client-side for 5 minutes.

---

## License

MIT — do whatever you want with this.
