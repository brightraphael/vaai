# VA+AI Agency — Career Tier Placement Form

This is a ready-to-deploy web app. Follow the steps below to put it live on
Vercel with your own shareable link.

---

## Before you deploy: connect your Google Sheet

Open `src/App.jsx`, find this line near the top:

```js
const GOOGLE_SCRIPT_URL = "PASTE_YOUR_GOOGLE_APPS_SCRIPT_WEB_APP_URL_HERE";
```

Replace the placeholder with your deployed Google Apps Script Web App URL
(see the separate `Google_Apps_Script_Backend.gs.txt` file and setup guide
for how to get this). Save the file.

---

## Option A — Deploy with the Vercel CLI (fastest, no GitHub needed)

1. Install Node.js if you don't already have it: https://nodejs.org (choose
   the LTS version).

2. Open a terminal in this project folder and run:

   ```
   npm install
   ```

3. Install the Vercel CLI (one-time, globally):

   ```
   npm install -g vercel
   ```

4. Deploy:

   ```
   vercel
   ```

   - It will ask you to log in — this opens your browser, log in or create a
     free Vercel account.
   - When asked "Set up and deploy?" → type `Y`
   - "Which scope?" → choose your account
   - "Link to existing project?" → `N`
   - "What's your project's name?" → press Enter to accept the default, or
     type your own (e.g. `va-ai-tier-placement`)
   - "In which directory is your code located?" → press Enter (default `./`)
   - It will detect Vite automatically. Press Enter through the remaining
     prompts to accept the defaults.

5. When it finishes, Vercel gives you a live URL like:

   ```
   https://va-ai-tier-placement.vercel.app
   ```

   This is the link you send to VAs.

6. **To deploy again after making changes** (e.g. updating questions), just
   run:

   ```
   vercel --prod
   ```

---

## Option B — Deploy via GitHub (best if you want automatic updates)

1. Create a free GitHub account if you don't have one: https://github.com
2. Create a new repository and upload this entire folder to it (GitHub's
   website lets you drag-and-drop files directly — no command line needed).
3. Go to https://vercel.com → sign up / log in (you can sign up directly
   with your GitHub account).
4. Click **"Add New" → "Project"**.
5. Select the GitHub repository you just created.
6. Vercel will auto-detect this as a Vite project. Leave all settings as
   default.
7. Click **Deploy**.
8. After ~60 seconds, Vercel gives you a live URL you can share.
9. From now on, any time you push changes to GitHub, Vercel automatically
   redeploys the live site for you.

---

## Using a custom domain (optional)

Once deployed, go to your project on vercel.com → **Settings → Domains** →
add a domain you own (e.g. `apply.vaaiagency.com`) and follow the DNS
instructions Vercel gives you. Free Vercel URLs work perfectly well too —
a custom domain is just a nice-to-have.

---

## Local preview (optional)

To see the form on your own computer before deploying:

```
npm install
npm run dev
```

Then open the local address it prints (usually `http://localhost:5173`).
