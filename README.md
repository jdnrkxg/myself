# Elseverse · 别境 — v0.7 Photo Sky

A mobile-first, local-first personal worlds archive with a lightweight photo-based sky for Our Little Universe.

## Included
- Elseverse home with Dream Worlds and Original Worlds collections.
- Preserves legacy `myself-worlds` and `myself-language` localStorage keys.
- World create/edit/delete and category browsing.
- Our Little Universe with six subpages: About the Voices, The Persona, Letters, Conversations, Little Moments, Shared Creation.
- Records support title, body, relation (you / G老师 / D老师 / shared), tags, date, and visibility label.
- IndexedDB storage under `elseverse-archive-v1`; legacy media database is not modified.
- JSON backup and merge import.
- Responsive mobile layout.

## Photo Sky (v0.7)
- Uses a small curated set of real NASA/Hubble/Webb astronomical photographs as switchable backgrounds.
- No SkyEngine, Aladin Lite, WebGL, live sky calculations, or deep-sky observing mode.
- Lightweight Canvas overlay draws subtle twinkling stars and occasional meteors locally in the browser.
- Optional decorative constellation lines.
- Background zoom slider, saved favorites, and immersive mode.
- The background is fixed to the viewport and remains in place while archive content scrolls.
- Scene choice, favorites, and effect preferences are stored locally in this browser.

## Run
Open `index.html` in a modern browser or deploy the folder to static hosting. Internet access is required to load the NASA-hosted background photographs. The curated source pages are linked in `THIRD_PARTY_NOTICES.md`. The archive remains usable if an image host is unavailable.

## Data and privacy notes
- Archive content and preferences are stored locally in the current browser/device. There is no account, server, cloud sync, or cross-device sync.
- `public` is only a visibility label in this prototype; it does not publish anything to the internet.
- Do not treat local browser storage as strong security for sensitive content.
- Back up important data before replacing the deployed site. The app retains the original `myself-worlds` and `myself-language` keys and does not delete the old `myself-media-v1` image database.
- This version keeps the existing archive IndexedDB schema and record formats.

## Image credits
- NGC 604: NASA, ESA, CSA, STScI.
- NGC 3603: NASA, ESA, R. O'Connell et al., WFC3 Science Oversight Committee, Hubble Heritage Team (STScI/AURA).
- Hubble Deep Field: R. Williams, the Hubble Deep Field Team, STScI and NASA.
