// ============================================================
// Invasive Plant Reporter
// Sections: 1 Screens · 2 Practice or real · 3 Photo · 4 Location · 5 Invasive list
//           6 Plant ID · 7 Result · 8 Report · 9 Samples · 10 Start
// ============================================================


// ===== 1. Screens =====

// The names of our four screens, in order.
const SCREENS = ["photo", "location", "result", "report"];

// Show one screen and hide all the others. Some screens need to get ready first.
function showScreen(name) {
  for (const screen of SCREENS) {
    document.getElementById("screen-" + screen).hidden = (screen !== name);
  }
  window.scrollTo(0, 0);
  if (name === "location") showMap();
  if (name === "result") identifyPhoto();
  if (name === "report") updateReport();
}

// Make every button with a data-go="..." move to that screen when tapped.
function setUpNavButtons() {
  for (const button of document.querySelectorAll("[data-go]")) {
    button.addEventListener("click", () => showScreen(button.dataset.go));
  }
}


// ===== 2. Practice or real =====

// Where reports go. Practice uses example.com, a made-up address that can never reach anyone.
const TEST_EMAIL = "test@example.com";
const DNR_EMAIL = "Invasive.Species@wisconsin.gov";

// OUR TEAM decides this, not the people using the app.
// true  = practice: every report goes to test@example.com.
// false = real: reports go to the Wisconsin DNR.
// Change it only when the team is ready for real reports, then push to GitHub.
const PRACTICE_SITE = true;

// Practice if the whole site is in practice, or if the address ends with "?practice" (our team's practice link).
function startsInPractice() {
  return PRACTICE_SITE || new URLSearchParams(location.search).has("practice");
}

// Is this report practice? Samples always are.
let testMode = startsInPractice();

// Show the small "Practice" tag in the header when reports go to the test address.
function showModeTag() {
  document.getElementById("mode-tag").hidden = !testMode;
}

// Open the About box (how the app works, where data goes, credits).
function openAbout() {
  document.getElementById("about").showModal();
}

// Hook up the About and sample buttons.
function setUpTopButtons() {
  document.getElementById("about-button").addEventListener("click", openAbout);
  document.getElementById("intro-about").addEventListener("click", openAbout);
  document.getElementById("sample-button").addEventListener("click", openSamples);
  showModeTag();
}


// ===== 3. Photo =====

// The photo the user picked. We keep it so we can send it to the plant AI.
let photoFile = null;

// Change the tip above the photo.
function showPhotoTip(text) {
  document.getElementById("photo-tip").textContent = text;
}

// When a photo is picked: check it's a picture, save it, show it, and show the Next button.
function usePhoto(file) {
  if (!file) return;
  if (!file.type.startsWith("image/")) {
    showPhotoTip("That doesn't look like a photo. Please try again.");
    return;
  }
  photoFile = file;
  const preview = document.getElementById("photo-preview");
  if (preview.src) URL.revokeObjectURL(preview.src);
  preview.src = URL.createObjectURL(file);
  preview.hidden = false;
  document.getElementById("intro").hidden = true; // make room for the photo
  document.getElementById("sample-button").hidden = true;
  showPhotoTip("Looks good! Tap Next. (Blurry? Take another one.)");
  document.getElementById("photo-camera-label").className = "small"; // Next becomes the main button
  document.getElementById("photo-next").hidden = false;
  readPhotoLocation(file);
}

// Listen to both photo buttons (camera and photo library).
function setUpPhotoButtons() {
  for (const id of ["photo-camera", "photo-gallery"]) {
    const input = document.getElementById(id);
    input.addEventListener("change", () => {
      usePhoto(input.files[0]);
      input.value = ""; // so picking the same photo again still works
    });
  }
}


// ===== 4. Location =====

// Where the plant is: { lat, lon, source }. Empty until we know.
let plantLocation = null;

// The map and the pin on it. We make them the first time the Location screen opens.
let map = null;
let pin = null;

// The middle of Wisconsin, so the map starts somewhere useful.
const WISCONSIN_CENTER = [44.6, -89.9];

// The words we show for each way of finding the location.
const LOCATION_WORDS = {
  gps: "📍 Found you with GPS!",
  photo: "📷 Found the spot saved in your photo!",
  map: "🗺️ Pin dropped where you tapped.",
  sample: "🧪 This is where the sample plant was found.",
};

// The same thing in report words, so the DNR knows how we got the location.
const LOCATION_REPORT_WORDS = {
  gps: "from phone GPS",
  photo: "from GPS saved in the photo",
  map: "picked on a map",
  sample: "sample location",
};

// Change the tip above the map.
function showLocationTip(text) {
  document.getElementById("location-tip").textContent = text;
}

// Make the map the first time it's needed. If the map library didn't load (no internet), say so.
function showMap() {
  if (map) {
    map.invalidateSize(); // the map was hidden, so let it re-measure the screen
    return;
  }
  if (!window.L) {
    if (!plantLocation) showLocationTip('The map needs internet. Tap "Find me" instead.');
    return;
  }
  map = L.map("map").setView(WISCONSIN_CENTER, 6);
  L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
  }).addTo(map);
  map.on("click", (event) => setLocation(event.latlng.lat, event.latlng.lng, "map"));
  if (plantLocation) setLocation(plantLocation.lat, plantLocation.lon, plantLocation.source);
}

// Save where the plant is, put a pin on the map, and show the Next button.
function setLocation(lat, lon, source) {
  // 5 decimal places is about 1 meter: plenty for DNR to find the plant.
  plantLocation = { lat: Number(lat.toFixed(5)), lon: Number(lon.toFixed(5)), source };
  showLocationTip(LOCATION_WORDS[source] + " Wrong spot? Tap the map to move the pin. Then tap Next.");
  if (map) {
    if (pin) pin.setLatLng([lat, lon]);
    else pin = L.circleMarker([lat, lon], { radius: 12, color: "#b71c1c", fillOpacity: 0.8 }).addTo(map);
    // Zoom in close, unless the user is already zoomed in and just moving the pin.
    if (source !== "map" || map.getZoom() < 14) map.setView([lat, lon], 16);
  }
  document.getElementById("gps-button").className = "small"; // Next becomes the main button
  document.getElementById("location-next").hidden = false;
}

// Ask the phone's GPS where we are. The phone asks the user to allow it first.
function findMe() {
  if (!window.isSecureContext || !navigator.geolocation) {
    showLocationTip("GPS only works on a secure (https) page. Tap the map instead.");
    return;
  }
  showLocationTip("Looking for you…");
  navigator.geolocation.getCurrentPosition(
    (position) => setLocation(position.coords.latitude, position.coords.longitude, "gps"),
    (error) => showLocationTip(gpsErrorWords(error)),
    { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 }
  );
}

// Turn a GPS error into plain words.
function gpsErrorWords(error) {
  if (error.code === error.PERMISSION_DENIED) return "Location is turned off. Tap the map where the plant is.";
  if (error.code === error.TIMEOUT) return "GPS is taking too long. Try again, or tap the map.";
  return "Couldn't find you. Tap the map where the plant is.";
}

// Look for GPS info saved inside the photo. Many phones remove it, so often there is none.
async function readPhotoLocation(file) {
  if (!window.exifr) return;
  try {
    const gps = await exifr.gps(file);
    if (gps && Number.isFinite(gps.latitude) && Number.isFinite(gps.longitude)) {
      setLocation(gps.latitude, gps.longitude, "photo");
    }
  } catch {
    // No readable GPS in this photo. That's fine: the user can use "Find me" or the map.
  }
}


// ===== 5. Invasive list =====

// The Wisconsin invasive plant list from invasive-plants.json. Empty (null) until it loads.
let invasivePlants = null;

// Load the invasive plant list from our JSON file.
async function loadInvasiveList() {
  try {
    const response = await fetch("invasive-plants.json");
    invasivePlants = (await response.json()).plants;
  } catch {
    invasivePlants = null; // the result screen will say we couldn't check the list
  }
}

// Shrink a scientific name to just "genus species" in small letters, so names match even when
// they're written differently. "Lonicera × bella Zabel" and "lonicera x bella" both become "lonicera bella".
function shortName(name) {
  const words = String(name || "").toLowerCase().replace(/×/g, " ").split(/\s+/);
  return words.filter((word) => word && word !== "x").slice(0, 2).join(" ");
}

// Look up a scientific name in the invasive list (also checking old names). Returns the plant, or null.
function findInvasive(scientificName) {
  const wanted = shortName(scientificName);
  if (!wanted.includes(" ") || !invasivePlants) return null; // need both genus and species
  const isMatch = (plant) => [plant.scientificName, ...plant.otherNames].some((name) => shortName(name) === wanted);
  return invasivePlants.find(isMatch) || null;
}


// ===== 6. Plant ID (Pl@ntNet, through our plant helper) =====

// Our plant helper on Cloudflare. It holds the secret Pl@ntNet key, so the app never needs it.
// If you set up your own helper (see README), put its address here.
const HELPER_URL = "https://plant-helper.wi-invasive-plants.workers.dev";

// Below this, we say the AI "isn't sure". 0.2 means 20% sure.
const LOW_CONFIDENCE = 0.2;

// The AI's top guesses: [{ scientificName, commonName, score }]. "guessesFor" is the photo they belong to.
let guesses = null;
let guessesFor = null;
let asking = false;

// Make the photo smaller and turn it into a JPG, so it uploads fast. Pl@ntNet only takes JPG and PNG.
async function shrinkPhoto(file) {
  try {
    const picture = await createImageBitmap(file);
    const scale = Math.min(1, 1280 / Math.max(picture.width, picture.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(picture.width * scale);
    canvas.height = Math.round(picture.height * scale);
    canvas.getContext("2d").drawImage(picture, 0, 0, canvas.width, canvas.height);
    return await new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.85));
  } catch {
    return file; // couldn't shrink it, so send the original
  }
}

// Send the photo to our plant helper (which asks Pl@ntNet) and get back the top 3 guesses.
async function askPlantHelper(file) {
  const form = new FormData();
  form.append("images", await shrinkPhoto(file), "plant.jpg");
  form.append("organs", "auto");
  const response = await fetch(HELPER_URL, { method: "POST", body: form });
  if (response.status === 404) return []; // Pl@ntNet says 404 when it finds no plant in the photo
  if (!response.ok) throw Object.assign(new Error("Pl@ntNet error"), { status: response.status });
  const answer = await response.json();
  return answer.results.slice(0, 3).map(simpleGuess);
}

// Keep just the parts of a Pl@ntNet answer we need.
function simpleGuess(result) {
  const name = result.species.scientificNameWithoutAuthor;
  return { scientificName: name, commonName: result.species.commonNames[0] || name, score: result.score };
}

// Turn a plant AI problem into plain words.
function plantIdErrorWords(error) {
  if (error.status === 403) return `This website isn't allowed to use the plant helper yet. An adult needs to add "${location.origin}" to ALLOWED_SITES (see README). You can still try a sample.`;
  if (error.status === 401 || error.status === 500) return "The plant helper's key isn't working. An adult needs to check it (see README). You can still try a sample.";
  if (error.status === 429) return "We used up today's free plant checks. Try again tomorrow, or try a sample.";
  if (error.status === 400 || error.status === 413 || error.status === 415) return "The AI couldn't read this photo. Go back and try a different photo.";
  if (!navigator.onLine) return "No internet. The plant AI needs internet. You can still try a sample.";
  return "The plant AI isn't answering right now. Tap Try again in a minute, or go back to Step 1 and try a sample.";
}

// Ask the AI about the photo (unless we already know the answer), then show the result.
async function identifyPhoto() {
  if (guessesFor === photoFile) return showResult(); // already have the answer for this photo
  if (asking) return;
  if (HELPER_URL.includes("USERNAME")) {
    return showResultProblem("The plant helper isn't set up yet (see README). Go back to Step 1 and try a sample.");
  }
  hideResult();
  showResultTip("🔎 Asking the plant AI… this takes a few seconds.");
  asking = true;
  const askedFor = photoFile;
  try {
    const answer = await askPlantHelper(askedFor);
    guesses = answer;
    guessesFor = askedFor;
    if (askedFor === photoFile) showResult();
  } catch (error) {
    const adultNeeded = [401, 403, 500].includes(error.status); // trying again won't fix these
    showResultProblem(plantIdErrorWords(error), !adultNeeded);
  } finally {
    asking = false;
  }
}


// ===== 7. Result =====

// What we decided about the plant: { kind, guess, plant }. The report uses this.
let decision = null;

// What each list category means, in plain words.
const CATEGORY_WORDS = {
  prohibited: "PROHIBITED in Wisconsin. It's not common here yet, so your report really matters!",
  restricted: "RESTRICTED in Wisconsin. It's already found in parts of the state.",
  "depends-on-county": "Prohibited or restricted in Wisconsin, depending on the county.",
};

// Change the tip at the top of the result screen.
function showResultTip(text) {
  document.getElementById("result-tip").textContent = text;
}

// Hide the old answer and buttons while we work on a new one.
function hideResult() {
  for (const id of ["result-card", "guesses-box", "result-next", "retry-button"]) {
    document.getElementById(id).hidden = true;
  }
}

// Show a problem (like no internet), and a Try again button if trying again could help.
function showResultProblem(text, canRetry) {
  hideResult();
  showResultTip("😕 " + text);
  document.getElementById("retry-button").hidden = !canRetry;
}

// Make a new piece of the page with some text in it, and add it to a parent.
function addText(parent, tag, text, className) {
  const element = document.createElement(tag);
  element.textContent = text;
  if (className) element.className = className;
  parent.append(element);
  return element;
}

// Turn a score like 0.873 into words like "87%".
function percent(score) {
  return score < 0.01 ? "less than 1%" : Math.round(score * 100) + "%";
}

// Decide what to tell the user. If ANY top guess is on the list (and the AI is at least a little sure), it's a possible invasive.
function decide(guesses) {
  if (!invasivePlants) return { kind: "no-list", guess: guesses[0] || null, plant: null };
  const invasiveGuess = guesses.find((guess) => guess.score >= LOW_CONFIDENCE && findInvasive(guess.scientificName));
  if (invasiveGuess) return { kind: "invasive", guess: invasiveGuess, plant: findInvasive(invasiveGuess.scientificName) };
  if (guesses.length && guesses[0].score >= LOW_CONFIDENCE) return { kind: "not-listed", guess: guesses[0], plant: null };
  return { kind: "not-sure", guess: guesses[0] || null, plant: null };
}

// Show the big answer card and the list of guesses.
function showResult() {
  hideResult();
  decision = decide(guesses);
  const card = document.getElementById("result-card");
  card.replaceChildren();
  card.className = "card " + decision.kind;
  if (decision.kind === "invasive") fillInvasiveCard(card, decision);
  else fillOtherCard(card, decision);
  card.hidden = false;
  showGuesses();
  const next = document.getElementById("result-next");
  next.textContent = decision.kind === "invasive" ? "✉️ Report to DNR" : "Report it anyway →";
  next.hidden = false;
  showResultTip(decision.kind === "invasive"
    ? "Read the card, then tap Report to DNR so experts can check it."
    : "Read the card. Not sure? You can still report it.");
}

// Fill the card for a possible invasive plant.
function fillInvasiveCard(card, { guess, plant }) {
  addText(card, "h3", "⚠️ Possible invasive plant!");
  addText(card, "p", plant.commonName, "plant-name");
  addText(card, "p", plant.scientificName, "science-name");
  if (plant.warning) addText(card, "p", "⚠️ " + plant.warning, "warning");
  addText(card, "p", CATEGORY_WORDS[plant.category]);
  addText(card, "p", "Why it's a problem: " + plant.why);
  addText(card, "p", `The AI is ${percent(guess.score)} sure. It can be wrong, so the DNR makes the final call.`, "hint");
}

// Fill the card when it's not on the list, the AI isn't sure, or we couldn't check the list.
function fillOtherCard(card, { kind, guess }) {
  const titles = {
    "not-listed": "✅ Not on Wisconsin's invasive list",
    "not-sure": "🤔 The AI isn't sure",
    "no-list": "😕 We couldn't check the invasive list",
  };
  addText(card, "h3", titles[kind]);
  if (!guess) {
    addText(card, "p", "The AI couldn't find a plant in this photo. Go back and try a closer photo of the leaves or flowers.");
  } else {
    addText(card, "p", `Its best guess is ${guess.commonName} (${guess.scientificName}), ${percent(guess.score)} sure.`);
    if (kind === "not-listed") addText(card, "p", "That plant isn't on our list of Wisconsin invasive plants.");
    if (kind === "not-sure") addText(card, "p", "That's a low score. A closer photo of the leaves or flowers can help.");
  }
  addText(card, "p", "Not sure? You can still report it.", "hint");
}

// Show the AI's top guesses, each with a bar showing how sure it is.
function showGuesses() {
  const list = document.getElementById("guesses");
  list.replaceChildren();
  for (const guess of guesses) {
    const item = document.createElement("li");
    addText(item, "span", guess.commonName, "guess-name");
    if (findInvasive(guess.scientificName)) addText(item, "span", "On WI list", "tag");
    addText(item, "span", guess.scientificName, "science-name");
    const bar = addText(item, "span", "", "bar");
    addText(bar, "span", "").style.width = Math.max(2, Math.round(guess.score * 100)) + "%";
    addText(item, "span", percent(guess.score) + " sure", "hint");
    list.append(item);
  }
  document.getElementById("guesses-box").hidden = guesses.length === 0;
}


// ===== 8. Report =====

// Write the report text from everything we know.
function reportText() {
  const { guess, plant } = decision || {};
  const lines = ["Possible invasive plant report", ""];
  lines.push("Plant (AI guess): " + (guess ? `${guess.commonName} (${guess.scientificName})` : "Unknown. The AI couldn't tell."));
  if (guess) lines.push("How sure the AI was: " + percent(guess.score));
  lines.push("On Wisconsin's NR 40 invasive list: " + (plant ? "Yes, " + plant.category.replace(/-/g, " ") : "No match. Reporting to be safe."));
  const others = (guesses || []).filter((g) => g !== guess).map((g) => `${g.commonName} (${g.scientificName}) ${percent(g.score)}`);
  if (others.length) lines.push("Other AI guesses: " + others.join("; "));
  lines.push("Date and time: " + new Date().toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" }));
  if (plantLocation) {
    const { lat, lon, source } = plantLocation;
    lines.push(`Location: ${lat.toFixed(5)}, ${lon.toFixed(5)} (${LOCATION_REPORT_WORDS[source]})`);
    lines.push(`Map: https://www.openstreetmap.org/?mlat=${lat}&mlon=${lon}#map=18/${lat}/${lon}`);
  }
  const notes = document.getElementById("report-notes").value.trim();
  lines.push("Notes: " + (notes || "(none)"), "");
  lines.push("Photo: attached to this email.");
  lines.push("The plant name is a guess from the Pl@ntNet AI and may be wrong. Please check.");
  return lines.join("\n");
}

// Update everything on the report screen: who it goes to, the email link, the photo link, and the text.
function updateReport() {
  const to = testMode ? TEST_EMAIL : DNR_EMAIL;
  const name = decision && decision.guess ? decision.guess.commonName : "unknown plant";
  const subject = (testMode ? "[TEST] " : "") + "Possible invasive plant: " + name;
  const text = reportText();
  document.getElementById("report-text").textContent = text;
  document.getElementById("email-link").href =
    `mailto:${to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(text)}`;
  document.getElementById("report-to").textContent = testMode
    ? `🧪 Test mode is ON. This email goes to ${TEST_EMAIL}, not the DNR.`
    : `📮 This email goes to the Wisconsin DNR (${DNR_EMAIL}).`;
  document.getElementById("report-to").className = testMode ? "mode-note test" : "mode-note real";
  document.getElementById("save-photo").href = document.getElementById("photo-preview").src;
}

// Copy the report so it can be pasted anywhere (like a text message or the DNR form).
async function copyReport() {
  const button = document.getElementById("copy-button");
  try {
    await navigator.clipboard.writeText(reportText());
    button.textContent = "✅ Copied!";
  } catch {
    button.textContent = "Copy by hand ↑";
    document.getElementById("report-details").open = true; // show the text so it can be selected
  }
  setTimeout(() => (button.textContent = "📋 Copy report"), 3000);
}

// Hook up the report screen's buttons and notes box.
function setUpReport() {
  document.getElementById("report-notes").addEventListener("input", updateReport);
  document.getElementById("copy-button").addEventListener("click", copyReport);
  document.getElementById("start-over").addEventListener("click", startOver);
  document.getElementById("retry-button").addEventListener("click", identifyPhoto);
}


// ===== 9. Samples (demo mode) =====

// Sample plants for practice and for judging rooms with no Wi-Fi. They come from samples/results.json.
let samples = [];

// Load the samples and their photos now, while we have internet, so they still work offline later.
async function loadSamples() {
  try {
    const list = (await (await fetch("samples/results.json")).json()).samples;
    for (const sample of list) {
      const response = await fetch("samples/" + sample.photo);
      if (!response.ok) continue; // skip a sample if its photo is missing
      const blob = await response.blob();
      sample.file = new File([blob], sample.photo, { type: blob.type || "image/jpeg" });
      samples.push(sample);
    }
  } catch {
    // No samples. The "Try a sample" line just stays hidden.
  }
  showSampleButtons();
}

// Make one picture button for each sample, and add each sample photo's credit to the About box.
function showSampleButtons() {
  const holder = document.getElementById("sample-buttons");
  const credits = document.getElementById("credits");
  for (const sample of samples) {
    const button = addText(holder, "button", "", "sample");
    const picture = addText(button, "img", "");
    picture.src = URL.createObjectURL(sample.file);
    picture.alt = "";
    addText(button, "span", sample.name);
    button.addEventListener("click", () => useSample(sample));
    const link = addText(addText(credits, "li", sample.name + " sample: "), "a", sample.credit);
    link.href = sample.creditUrl;
    link.target = "_blank";
  }
  document.getElementById("sample-button").hidden = samples.length === 0;
}

// Open the sample picker.
function openSamples() {
  document.getElementById("sample-picker").showModal();
}

// Use a sample: its photo, its location, and its saved AI answer (so no internet is needed).
function useSample(sample) {
  testMode = true; // samples are always practice
  showModeTag();
  usePhoto(sample.file);
  guesses = sample.guesses;
  guessesFor = sample.file;
  setLocation(sample.location.lat, sample.location.lon, "sample");
  showPhotoTip(`Sample: ${sample.name}. Tap Next. (${sample.credit})`);
}


// ===== 10. Start =====

// The first tips on the photo and map screens, saved when the app opens so "Start over" can put them back.
const FIRST_TIPS = {};

// Clear everything for a new report. (We don't reload the page, so this works without internet.)
function startOver() {
  photoFile = guesses = guessesFor = plantLocation = decision = null;
  testMode = startsInPractice(); // back to the site's normal mode
  showModeTag();
  if (pin) pin.remove();
  pin = null;
  if (map) map.setView(WISCONSIN_CENTER, 6);
  document.getElementById("photo-preview").hidden = true;
  document.getElementById("intro").hidden = false;
  document.getElementById("sample-button").hidden = samples.length === 0;
  document.getElementById("photo-next").hidden = true;
  document.getElementById("location-next").hidden = true;
  document.getElementById("photo-camera-label").className = "big";
  document.getElementById("gps-button").className = "big";
  document.getElementById("report-notes").value = "";
  for (const id in FIRST_TIPS) document.getElementById(id).innerHTML = FIRST_TIPS[id];
  showScreen("photo");
}

// Get the app ready when the page loads.
function start() {
  for (const id of ["photo-tip", "location-tip"]) FIRST_TIPS[id] = document.getElementById(id).innerHTML;
  setUpNavButtons();
  setUpTopButtons();
  setUpPhotoButtons();
  setUpReport();
  document.getElementById("gps-button").addEventListener("click", findMe);
  loadInvasiveList();
  loadSamples();
  showScreen("photo");
}

start();
