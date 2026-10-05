# How Our App Works (for judges, and for us!)

## The big idea

Invasive plants are plants from other places that spread fast and crowd out Wisconsin's own plants. The Wisconsin DNR (Department of Natural Resources) wants people to report them. But most people don't know what they're looking at, or how to report it.

Our app helps: **take a photo → find out if it might be invasive → send a report to the DNR.**

## How the information flows

```
 📷 Photo ──► 📍 Where is it? ──► 🤖 AI guesses the plant ──► 📋 Is it on Wisconsin's list? ──► ✉️ Email to DNR
 (on phone)   (on phone)          (photo → our helper →        (checked on the phone)            (YOU press Send)
                                   Pl@ntNet)
```

1. **Photo:** you take a picture, or pick one from your phone.
2. **Location:** the phone's GPS finds you, or the photo already knows where it was taken, or you tap the map.
3. **AI:** we shrink the photo and send it to our **plant helper**, which passes it to **Pl@ntNet**, a plant-identifying AI made by scientists. It sends back its 3 best guesses and how sure it is about each.
4. **List check:** we look up each guess in our list of 30 Wisconsin invasive plants.
5. **Report:** we write an email to the DNR for you. **You** attach the photo, read it, and press Send.

## What each file does

| File | In kid words |
|---|---|
| `index.html` | The skeleton: all four screens are on one page, and we show one at a time. |
| `style.css` | The clothes: colors, big buttons, and making it fit on any phone. |
| `app.js` | The brain: what happens when you tap each button. It has 10 labeled sections. |
| `invasive-plants.json` | Our list of 30 Wisconsin invasive plants, copied from the state law called NR 40. |
| `plant-helper.js` | The plant helper. It runs in the cloud (on Cloudflare), keeps the AI key locked up, and passes photos to Pl@ntNet. |
| `samples/` | 4 real plant photos with the AI's real saved answers, so our demo works without Wi-Fi. |
| `README.md` | Instructions for grown-ups: running the app, putting it online, adding plants. |
| `EXPLAIN.md` | This file! |

## Words to know

- **Scientific name:** every plant has a two-word name that's the same all over the world, like *Alliaria petiolata* (garlic mustard). The first word is the **genus** (the plant's family group), and the second is the **species**. We match on both words, because some plants in the same genus are native and good!
- **Prohibited:** not common in Wisconsin yet. If we find it early, the DNR can stop it. These reports matter most!
- **Restricted:** already common in parts of Wisconsin. It's against the law to sell it, move it, or plant it.
- **Confidence ("% sure"):** how sure the AI is about its guess. Under 20%, we say "The AI isn't sure."
- **Practice mode:** when the app shows 🧪 Practice, reports go to a pretend address, so practice never bothers the real DNR. Only our team can switch the app to real reports (one line in `app.js`). Users can't, so nobody sends a real report by accident.
- **API key:** like a library card for the plant AI. It lets us use Pl@ntNet, up to 500 checks a day. It's a secret, so only our plant helper has it.
- **Plant helper:** a tiny program in the cloud that holds the key, like a locker. The app asks the helper, and the helper asks Pl@ntNet.

## Questions judges might ask

**How does the AI know what plant it is?**
Pl@ntNet learned from millions of plant photos that scientists and regular people labeled. It looks for patterns, like leaf shape and flower color, and compares them to what it learned. Then it gives its top guesses and a score for how sure it is.

**What if it's wrong?**
It can be wrong! That's why we always say "**possible** invasive plant" and show how sure the AI is. If it's less than 20% sure, we say "The AI isn't sure." A real expert at the DNR makes the final decision. Even if the app says it's not invasive, you can still report it.

**Where does my photo go?**
It stays on your phone until the AI step. Then a smaller copy goes through our plant helper to Pl@ntNet to be identified. The helper only passes it along and saves nothing (you can read all of its code in `plant-helper.js`). There's no database, so we never keep your photo. Your location stays on your phone until **you** send the email. (Drawing the map means downloading map pictures of your area from OpenStreetMap.)

**Why no login?**
A login means storing people's names and passwords, and keeping those safe is a big job. Our app doesn't need to know who you are to help find invasive plants, so we left it out. Safer and simpler!

**How does the DNR get the report?**
The DNR asks people to email Invasive.Species@wisconsin.gov. Our app writes that email for you: plant name, how sure the AI was, date, location, a map link, and your notes. **You** attach the photo, read it, and press Send. The app never sends anything by itself. While the app is in practice mode, it goes to a pretend address instead. Our team decides when the app sends real reports.

**How would you make it better?**
- Add more plants to the list (the law lists over 100!)
- Figure out the county, so we can say "prohibited" or "restricted" exactly
- Work fully offline, even after the phone closes the app
- Attach the photo to the email automatically
- Add our own team photos as samples
- Work in other states, using their invasive plant lists

**Bonus: How do you keep the AI key safe?**
Our code is public on GitHub, so the key can't go there, because anyone could copy it. Instead, the key is locked inside our plant helper on Cloudflare. Phones never see it. The helper only helps our own website, and only sends photos to Pl@ntNet. If someone tries to misuse it, the worst that can happen is using up the day's 500 free checks. No money is involved, and the key stays secret.

**Bonus: Where do the sample photos come from?**
They're real photos from Wikimedia Commons that photographers shared for anyone to use. We credit each photographer in the app's ℹ️ About box. We removed hidden data (like GPS) from the photos, and saved the AI's real answers so the demo works without Wi-Fi.
