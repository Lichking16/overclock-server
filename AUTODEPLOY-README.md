# OVERCLOCK — hands-off auto-deploy

Goal: when Claude rebuilds the game, your PC pushes the new files to GitHub and
Render redeploys automatically — no manual uploads. Claude never touches your
GitHub login; your own machine's git does the push.

These files all live in your **server** folder.

---

## One-time setup (≈5 minutes)

1. **Install Git** (if you don't have it). Get "Git for Windows" from
   https://git-scm.com/download/win — install with the default options.

2. **Double-click `SETUP-AUTODEPLOY.bat`.**
   - It links this folder to your `overclock-server` repo and pushes the current
     files up.
   - The first push will pop up a **GitHub sign-in** — log in as **Lichking16**.
     (This is the one step only you can do. Git remembers it after this.)
   - It force-pushes, i.e. it makes GitHub match these local files exactly. That's
     what you want — these are always the latest build.

3. **In Render** (one-time check), open the `overclock-server` service →
   **Settings**: set **Branch = `main`** and **Auto-Deploy = On**.

---

## Daily use — nothing to do

1. **Double-click `deploy-watch.bat`** and leave that window open (minimize it).
2. That's it. Whenever Claude rebuilds the game, the watcher pushes within a few
   seconds and Render redeploys in ~1–2 minutes. Play at
   `https://overclock-server.onrender.com`.

If you reboot your PC, just double-click `deploy-watch.bat` again.

---

## If you'd rather push manually

Double-click **`deploy-now.bat`** any time to push the current files once.

---

## Troubleshooting

- **"git is not installed"** → install Git for Windows (step 1) and re-run.
- **Push asks for login every time** → install "Git Credential Manager" (bundled
  with Git for Windows) or just sign in via the browser popup once.
- **Pushed but Render didn't change** → in Render, confirm Branch = `main` and
  Auto-Deploy = On, or hit **Manual Deploy → Deploy latest commit** once.
- **Branch error mentioning `master`** → tell Claude; we'll switch the scripts to
  `master` to match your repo.
- The `node_modules` folder and the old `OVERCLOCK.html` are ignored on purpose
  (Render installs packages itself).
