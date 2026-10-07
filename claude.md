# FLL Invasive Plant Reporter

## Who this is for
A FIRST LEGO League team (kids ages 9–14) building their Innovation Project. The kids must be able to explain every file to judges. Simplicity beats cleverness.

## Standing rules
- Plain HTML, CSS, JavaScript only. No frameworks, no npm, no build step.
- Keep it to about 5 files plus /samples. Ask before adding a new file.
- Every function is short and has a plain-English comment above it.
- Explain each choice in 1–2 sentences a kid could repeat.
- Work in small steps. After each step, say exactly how to test it.
- Ask before big changes. Don't rewrite working code just to tidy it.

## Safety and privacy
- This repo will be PUBLIC (free GitHub Pages hosting). Never put names, school, team name, addresses, or anyone's location in code, comments, commits, or sample data.
- Never commit API keys. The Pl@ntNet key lives only in Cloudflare, as the `PLANTNET_KEY` secret of the `plant-helper` worker. Explain where the key lives and its risk.
- The app never sends anything to the DNR (no email, no forms). Step 4 links to the DNR's own page about the plant; people report through the DNR's own channel if they choose.

## Running it
- Local: `python3 -m http.server` then open http://localhost:8000
- Live: https://wi-invasive-plants.github.io (GitHub Pages; HTTPS is required for camera and GPS). Pushing to `main` updates it.
- Plant helper: `plant-helper.js` runs on Cloudflare Workers at https://plant-helper.wi-invasive-plants.workers.dev. After changing it, redeploy it in Cloudflare.

## Living docs
- Keep README.md (how to run/deploy) and EXPLAIN.md (kid-level explanation and judge Q&A) up to date whenever the code changes.
