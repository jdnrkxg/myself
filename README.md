# Elseverse · 别境 — v0.5

A mobile-first bilingual-ready, local-first personal worlds archive prototype.

## Included
- Elseverse home with Dream Worlds and Original Worlds collections.
- Preserves legacy `myself-worlds` and `myself-language` localStorage keys.
- World create/edit/delete and category browsing.
- Our Little Universe with six subpages: About the Voices, The Persona, Letters, Conversations, Little Moments, Shared Creation.
- Records support title, body, relation (you / G老师 / D老师 / shared), tags, date, and visibility label.
- IndexedDB storage under a separate database `elseverse-archive-v1`; legacy media database is not modified.
- JSON backup and merge import.
- Responsive mobile layout.
- Our Little Universe live planetarium with two modes: current local sky (browser location permission or manual coordinates) and a fixed shared sky (saved coordinates).
- Real star catalogue rendering with horizon view, constellation lines, optional star labels, Sun/planet layer, and a live clock.
- Shared sky location is stored locally and remains fixed until changed.

## Run
Open `index.html` in a modern browser or deploy the folder to static hosting.

## Data and privacy notes
- All archive content and the shared-sky coordinates are stored locally in the current browser/device. There is no account, server, cloud sync, or cross-device sync.
- Local geolocation is requested only after the visitor taps the location button. Coordinates are used in the browser to calculate the sky; this app does not send them to an Elseverse server.
- `public` is only a visibility label in this prototype; it does not publish anything to the internet.
- Do not treat local browser storage as strong security for sensitive content.
- Back up important data before replacing the deployed site. The app retains the original `myself-worlds` and `myself-language` keys and does not delete the old `myself-media-v1` image database.
- Legacy world cover image upload controls from the previous version are not included in this prototype UI; the existing media database is left untouched. A later pass can reconnect cover-image management.

## Known limitations
- English toggle currently updates language preference and button label; full translation coverage is a follow-up task.
- The world module cards remain previews, not full editors.
- Timeline is a chronological view of archive records; there is no backend sharing.
- SkyEngine and its star catalogue load from jsDelivr at runtime, so the first load of the sky needs an internet connection. If the CDN is blocked, the archive itself still works but the sky renderer cannot load. See `THIRD_PARTY_NOTICES.md`.
- The star field uses real catalogue coordinates. The upstream SkyEngine documentation describes its built-in Sun/planet position algorithm as approximately 1-degree accuracy; it is a live planetarium visualization, not a telescope/camera feed.
