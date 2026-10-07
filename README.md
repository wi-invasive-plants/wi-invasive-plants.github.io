# Invasive Plant Reporter

A phone-friendly web app for a FIRST LEGO League Innovation Project. Take a photo of a plant, mark where it is, find out if it might be a Wisconsin invasive plant, and go to the Wisconsin DNR's page about it to learn more.

**How it works:** Photo → Location → AI identifies the plant → check Wisconsin's invasive list → open the DNR's page about that plant. The app never sends anything to the DNR.

```
 📱 app ──photo──► 🔒 plant helper (Cloudflare, holds the secret key) ──► 🌿 Pl@ntNet AI
   ▲                                                                          │
   └─────────────────────────── top 3 guesses ◄───────────────────────────────┘
```

## Our live setup

| What | Address |
|---|---|
| The app (GitHub Pages) | https://wi-invasive-plants.github.io |
| The code (GitHub) | https://github.com/wi-invasive-plants/wi-invasive-plants.github.io |
| The plant helper (Cloudflare) | https://plant-helper.wi-invasive-plants.workers.dev |

The Pl@ntNet key is stored **only** in Cloudflare, as the `PLANTNET_KEY` secret of the `plant-helper` worker. `ALLOWED_SITES` is `https://wi-invasive-plants.github.io,http://localhost:8000`.

## Using the app

| Step | What you see | What you do |
|---|---|---|
| 1. Photo | A short welcome note, then **📷 Take photo** / **🖼️ My photos** | Take or pick a clear, close photo. No plant nearby? Tap **🧪 No plant nearby? Try a sample**. |
| 2. Where is it? | A map of Wisconsin | Tap **📍 Find me** (GPS), or tap the map. If the photo has GPS saved inside, the pin drops by itself. |
| 3. What plant is it? | "Asking the plant AI…", then a card: **⚠️ Possible invasive plant!**, **✅ Not on Wisconsin's invasive list**, or **🤔 The AI isn't sure**, plus the AI's top 3 guesses | Read the card. Dangerous plants show a red **Don't touch!** warning. Tap **Learn more →**. |
| 4. Learn more from the DNR | A big button to the DNR's page about that plant, and **📍 Where you found it** (coordinates + map link) | Tap the button to read the DNR's advice. To report the plant, use the DNR's **How to report** link. **🔁 Check another plant** starts over. |

The **ℹ️** button (top right) opens the **About** box: how to use the app, why the AI can be wrong, staying safe, where photos and locations go, and all sources and photo credits.

## Run it on a laptop

1. Open Terminal in this folder.
2. Run `python3 -m http.server`
3. Open http://localhost:8000 in Chrome.
4. To see it like a phone: press `Cmd+Option+I`, then click the phone icon.
5. Press `Ctrl+C` in Terminal to stop.

Before the plant helper is set up, tap a **sample** on the first screen. Samples work without the helper and without internet.

## One-time setup (an adult does this)

Setup happens once. After that, **nobody types a key on any phone.** Do the steps in this order.

### 1. Get a Pl@ntNet key
1. Sign up at https://my.plantnet.org and confirm your email.
2. Go to **Settings → API key** and copy the key. Keep it private: don't put it in the code, a chat, or an email.

The free plan allows **500 plant checks per day**. Going back and forth between screens doesn't use extra checks, and samples use none.

### 2. Put the app on GitHub Pages (free `https://` website)
Phone camera and GPS only work on secure `https://` pages. A laptop on Wi-Fi serves plain `http://` (like `http://192.168.1.5:8000`), and phones block the camera and GPS there. GitHub Pages gives a free `https://` address.

1. Make a GitHub account at https://github.com. ⚠️ The username appears in the website address, so don't use a real name, school, or team name.
2. Click **+** → **New repository**. Name it (example: `invasive-plant-reporter`), choose **Public**, and click **Create repository**.
3. In Terminal, in this folder (replace `USERNAME` and `REPO`):
   ```
   git add .
   git commit -m "Invasive Plant Reporter"
   git remote add origin https://github.com/USERNAME/REPO.git
   git push -u origin main
   ```
4. In the repository, go to **Settings → Pages** → **Deploy from a branch** → **main** and **/ (root)** → **Save**.
5. After 1–2 minutes, the app is at `https://USERNAME.github.io/REPO/`

### 3. Set up the plant helper (Cloudflare Workers, free)
The plant helper is `plant-helper.js`: a tiny program that runs on Cloudflare, not on phones. It keeps the key secret, accepts photos only from our website, and passes them to Pl@ntNet. It saves nothing.

1. Sign up at https://dash.cloudflare.com/sign-up (the Free plan is enough). ⚠️ When Cloudflare asks for a **workers.dev subdomain**, don't use a real name; it appears in the helper's address.
2. Go to **Workers & Pages** → **Create** → **Start with Hello World** → name it `plant-helper` → **Deploy**.
3. Click **Edit code**, delete everything, paste in all of `plant-helper.js`, and click **Deploy**.
4. Open the worker's **Settings → Variables and Secrets** and add two:
   - Type **Secret**, name `PLANTNET_KEY`, value: your Pl@ntNet key
   - Type **Text**, name `ALLOWED_SITES`, value: `https://USERNAME.github.io,http://localhost:8000`
   
   Save or deploy.
5. Copy the helper's address (like `https://plant-helper.YOUR-SUBDOMAIN.workers.dev`).
6. In `app.js`, find `HELPER_URL` and paste that address in. Then run `git add .`, `git commit -m "Connect plant helper"` and `git push`.
7. **Check it:** open the helper's address in a browser. If you see `This website isn't allowed to use the plant helper`, it's running. (A browser address bar isn't on the allowed list, so that "no" is correct.) Then open the app and try a real photo.

**Optional:** the helper calls Pl@ntNet from a server, not from a web page, so it doesn't need Pl@ntNet's "expose my API key" or "Authorized domains" settings. You can turn those off at my.plantnet.org. If the app then says the helper's key isn't working, turn "expose my API key" back on.

### Updating the plant helper
`plant-helper.js` on GitHub is just a copy for reading. The one that runs lives in Cloudflare. If you change it, paste the new version into Cloudflare (**Workers & Pages → plant-helper → Edit code → Deploy**). Your `PLANTNET_KEY` and `ALLOWED_SITES` settings stay as they are.

### Where the key lives, and the risk
- **The key is only inside Cloudflare,** stored as an encrypted secret. It's not in the code, not on GitHub, and not on any phone, and the helper never sends it back.
- **To change the key,** update `PLANTNET_KEY` in Cloudflare. Every phone keeps working, with nothing to change.
- **The helper only accepts requests from the websites in `ALLOWED_SITES`**, and only passes photos (up to 5 MB) to Pl@ntNet's identify service. It can't be used for anything else.
- **Remaining risk:** a determined person could write a program that pretends to be our website and use the helper to identify plants. That uses up our 500 free checks for the day, and then the app says "We used up today's free plant checks." They still can't see the key, and there's no money involved on free plans. For extra protection, an adult can add a Cloudflare rate-limiting rule.
- **Photos pass through Cloudflare** on their way to Pl@ntNet. The helper doesn't save them (you can read every line of `plant-helper.js`).

## Learning more from the DNR (step 4)

The last screen sends people to the **Wisconsin DNR's own page about their plant**, for example [Garlic mustard](https://dnr.wisconsin.gov/topic/Invasives/fact/GarlicMustard). Each plant in `invasive-plants.json` has a `dnrPage` link. If the plant isn't on our list, the button goes to the DNR's main [invasive species page](https://dnr.wisconsin.gov/topic/Invasives).

The last screen also shows **where the plant was found** (coordinates and a map link), plus a link to the DNR's [Report invasive species](https://dnr.wisconsin.gov/topic/Invasives/report) page. That way, anyone who wants to report the plant can do it the DNR's own way, with the location ready.

**The app never sends anything to the DNR:** no emails and no forms. People decide for themselves whether to report.

## Demo mode (samples)

On the first screen, **🧪 No plant nearby? Try a sample** opens a picker with 4 picture buttons: garlic mustard (invasive), wild parsnip (invasive, burns skin), golden Alexanders (its native look-alike), and common milkweed (native). Each one has:
- **a real photo** from Wikimedia Commons (credits are in the app's ℹ️ About box and in `samples/results.json`), with its hidden data, including any GPS, removed;
- **the real answer** the Pl@ntNet AI gave for that photo, saved on 2026-10-04;
- **a location** at a public park or landmark.

Samples work with **no internet and no helper**. The app loads them as soon as it opens, so open it once with Wi-Fi before walking into a room without Wi-Fi, and keep the tab open. The fully offline option is the laptop (`python3 -m http.server`); only the map pictures need internet there.

### Add your own sample
1. Put **your own** photo in `samples/` (for example `samples/buckthorn.jpg`), under 1 MB. Phone photos can hide GPS inside, so take a screenshot of the photo, or use a public place.
2. Run it through the real app once and note the AI's guesses.
3. In `samples/results.json`, copy a block and change it:
   ```json
   {
     "name": "Buckthorn",
     "photo": "buckthorn.jpg",
     "location": { "lat": 43.4194, "lon": -89.7329 },
     "guesses": [
       { "scientificName": "Rhamnus cathartica", "commonName": "Common buckthorn", "score": 0.88 }
     ],
     "credit": "Photo: our team",
     "creditUrl": "https://github.com/USERNAME/REPO"
   }
   ```
4. **Location:** use a public place like a park, never a home or school.

## Files

| File | What it does |
|---|---|
| `index.html` | The four screens (Photo → Location → What plant is it? → Learn more) plus the About box and sample picker |
| `style.css` | Colors, big buttons, phone layout |
| `app.js` | Everything the app does, in 10 labeled sections |
| `invasive-plants.json` | The Wisconsin invasive plant list |
| `plant-helper.js` | The plant helper that runs on Cloudflare and keeps the key secret |
| `samples/` | Sample photos and `results.json` (saved real AI answers + photo credits) |
| `README.md` | This file |
| `EXPLAIN.md` | Kid-friendly explanation and judge Q&A |
| `claude.md` | Rules for the AI coding assistant that helped build the app |
| `.gitignore` | Files that should never be uploaded to GitHub |

## Libraries and services we use

| What | Why | From |
|---|---|---|
| [Pl@ntNet API](https://my.plantnet.org) | Identifies the plant from the photo | my-api.plantnet.org |
| [Cloudflare Workers](https://workers.cloudflare.com) | Runs the plant helper that holds the key | cloudflare.com (free plan: 100,000 requests/day) |
| [Leaflet](https://leafletjs.com/) 1.9.4 | Draws the map | cdnjs.cloudflare.com |
| [exifr](https://github.com/MikeKovarik/exifr) 7.1.3 | Reads GPS saved inside photos | cdn.jsdelivr.net |
| [OpenStreetMap](https://www.openstreetmap.org/copyright) | Map pictures (tiles) | tile.openstreetmap.org |
| [Wikimedia Commons](https://commons.wikimedia.org) | Sample photos (CC0 and CC BY 4.0) | stored in `samples/` |

Each library has an `integrity` fingerprint in `index.html`. The browser refuses the file if anyone changed it, so if you upgrade a library, update its fingerprint too.

## The invasive plant list

**Source:** Wisconsin Administrative Code [chapter NR 40](https://docs.legis.wisconsin.gov/code/admin_code/nr/001/40), *Invasive Species Identification, Classification and Control*, Register November 2024 No. 827. Prohibited plants are in NR 40.04(2)(b) and restricted plants are in NR 40.05(2)(b). The "why it's a problem" sentences are our own short summaries.

**Categories:**
- `prohibited`: not yet common in Wisconsin. The goal is to stop it before it spreads, so reports are very important.
- `restricted`: already common in parts of Wisconsin. It's illegal to sell, move, or plant it.
- `depends-on-county`: NR 40 lists it as prohibited in some counties and restricted in others.

**How matching works:** we compare only the first two words of the scientific name (genus + species), ignoring capital letters and the hybrid sign `×`. So `Lonicera × bella Zabel` matches `lonicera x bella`. We also check `otherNames`, because scientists sometimes rename plants. For example, NR 40 says *Fallopia japonica*, but Pl@ntNet says *Reynoutria japonica*.

**When we say "possible invasive":** if any of the AI's top 3 guesses is on the list **and** the AI is at least 20% sure about that guess. Below 20%, we say "The AI isn't sure." Either way, **Learn more** takes you to the DNR's website.

### Add a plant
1. Find it in NR 40.04(2)(b) (prohibited) or NR 40.05(2)(b) (restricted). If it's in both, use `depends-on-county`. Then find its page on the DNR website (they look like `https://dnr.wisconsin.gov/topic/Invasives/fact/PlantName`).
2. Add a block inside `"plants": [ ... ]` in `invasive-plants.json`, with a comma between blocks:
   ```json
   {
     "scientificName": "Euphorbia cyparissias",
     "otherNames": [],
     "commonName": "Cypress spurge",
     "dnrPage": "https://dnr.wisconsin.gov/topic/Invasives/fact/CypressSpurge",
     "category": "restricted",
     "why": "One short sentence a 4th grader can read."
   }
   ```
3. If it's dangerous to touch or eat, add `"warning": "Don't touch! ..."`.
4. Put the plant's other scientific names in `otherNames`. The name Pl@ntNet uses is the most important one.
5. Reload the app. If something breaks, paste the file into https://jsonlint.com to find the missing comma.

### Known limits
- **Phragmites:** a native kind has the same genus + species, so it also shows as "possible". DNR experts make the final call.
- **Japanese barberry** and a few others: NR 40 exempts some garden varieties, and the app can't tell them apart from a photo.
- **County splits:** the app doesn't know the county, so it says "depending on the county."
