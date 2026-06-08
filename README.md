
## Global stats (optional — shared faction win-rates for balancing)
The game can pool every **online** match into one shared scoreboard (visible via the in-game
**GLOBAL** button). It uses a free **Upstash Redis** datastore so the data survives the server
restarting. If you skip this, everything else still works — the Global screen just says it's off.

**One-time setup (~5 min):**
1. Go to **upstash.com**, sign up (free, no credit card).
2. Create a **Redis** database (any region, free tier).
3. On the database page, open the **REST API** section and copy these two values:
   - `UPSTASH_REDIS_REST_URL`
   - `UPSTASH_REDIS_REST_TOKEN`
4. In **Render** → your `overclock-server` service → **Environment** → **Add Environment Variable**, add both:
   - key `UPSTASH_REDIS_REST_URL`  → value = the URL you copied
   - key `UPSTASH_REDIS_REST_TOKEN` → value = the token you copied
5. **Save** — Render redeploys. Done. From now on, finished online games are tallied globally, and
   anyone can open **GLOBAL** in the game to see faction win-rates across all players.

Only **online** matches are recorded (solo-vs-bot stays on your own device), and only the **host**
reports each game, so there's no double-counting. Faction inputs are validated server-side.

---

## NEW: the server also serves the game
This server now hosts the game page itself. Open the server's URL in a browser and the
game loads — and it auto-fills the server address, so players don't paste anything.

**Your repo (`overclock-server`) should contain three files at the root:**
`server.js`, `package.json`, and `OVERCLOCK.html` (the game).

**To play:** both players just open `https://your-server.onrender.com`. One clicks Host, shares the
code; the other Joins. No file to send, no address to paste.

**To update the game later:** run `python3 build.py` (it refreshes `server/OVERCLOCK.html`), then
upload the new `OVERCLOCK.html` to your repo. Render redeploys; everyone gets it on refresh.

> Tip: when uploading to GitHub, use **Add file → Upload files** and pick the files from your
> `OVERCLOCK/server` folder. (Dragging can occasionally mangle a filename on Windows.)

---
# OVERCLOCK relay server

A tiny WebSocket server that lets two players play online through almost any network.
It does **not** run the game — it just pairs two players in a room and forwards messages
between them (the host's browser is still the authoritative game engine). It's ~60 lines
and needs no database.

You deploy this **once**, get a `wss://…` address, and paste that address into the game's
**Play a Friend** screen (it's remembered after the first time). Both players use the same address.

---

## Run it locally (quick test, same network)
```
cd server
npm install
npm start
```
It prints `listening on port 8080`. Locally the address is `ws://localhost:8080`.
(For two different computers over the internet, deploy it to a free host below.)

## Deploy free — Render (recommended)
1. Put this `server/` folder in a GitHub repo (or fork/upload it).
2. Go to https://render.com → **New → Web Service** → connect the repo.
3. Settings: **Build Command** `npm install`, **Start Command** `npm start`. (Render auto-detects Node.)
4. Create the service. After it deploys you'll get a URL like `https://overclock-xyz.onrender.com`.
5. In the game, use the **wss** version of that URL: `wss://overclock-xyz.onrender.com`
   (just change `https` → `wss`).

> Render's free tier sleeps after ~15 min idle, so the **first** connection of a session can take
> ~30 seconds to wake up. If a join times out, just try once more.

## Deploy free — Railway / Glitch / Fly (alternatives)
- **Railway** (https://railway.app): New Project → Deploy from repo → it runs `npm start`. Use the
  generated domain as `wss://<domain>`.
- **Glitch** (https://glitch.com): New Project → import this folder → it runs automatically. Address is
  `wss://<project-name>.glitch.me`.
- Any host that runs a Node app and gives you an `https`/`wss` URL works — it only needs `npm start`.

## Address format
- Always use **`wss://`** (secure). Cloud hosts give you `https://…`; swap it to `wss://…`.
- No path or port needed — just `wss://your-host.example.com`.

## How it works
- Host clicks **Host** → server makes a 4-letter room code.
- Friend clicks **Join**, enters the code → server links the two sockets.
- After that, every game action/state update is relayed between them. All game rules run in the
  host's browser exactly as in solo play.
