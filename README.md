# Elseverse · 别境 — v0.6 Observatory

A mobile-first, local-first personal worlds archive with an embedded astronomical observatory.

## Included
- Elseverse home with Dream Worlds and Original Worlds collections.
- Preserves legacy `myself-worlds` and `myself-language` localStorage keys.
- World create/edit/delete and category browsing.
- Our Little Universe with six subpages: About the Voices, The Persona, Letters, Conversations, Little Moments, Shared Creation.
- Records support title, body, relation (you / G老师 / D老师 / shared), tags, date, and visibility label.
- IndexedDB storage under a separate database `elseverse-archive-v1`; legacy media database is not modified.
- JSON backup and merge import.
- Responsive mobile layout.

## Observatory
Our Little Universe now has two complementary astronomy views:

1. **Live local/shared sky (SkyEngine)** — real star catalogue positions projected for the selected observer and current time. Choose the current location (browser permission or manual coordinates) or a fixed shared location. Includes constellation lines, optional labels, and Sun/planet layer.
2. **Deep-sky survey explorer (Aladin Lite 3.9.4)** — real astronomical survey imagery with touch/mouse pan and zoom. Available image surveys: DSS2 optical, Pan-STARRS DR1 optical, 2MASS infrared, and AllWISE infrared. Preset targets include the Galactic Centre, Andromeda Galaxy, Orion Nebula, Pleiades, Crab Nebula, and the Hubble Deep Field region. Named-object lookup uses Aladin/Sesame resolution.

The deep-sky view uses a logarithmic field-of-view slider, while Aladin Lite also supports native pinch-to-zoom and drag-to-pan. The map can be used as a fixed full-screen layer while the site content scrolls, and it remains visible in immersive mode. Keep the Aladin Lite logo/attribution visible as required by its project terms.

## Run
Open `index.html` in a modern browser or deploy the folder to static hosting. HTTPS is required for browser geolocation. WebGL2 is required by Aladin Lite.

## Data and privacy notes
- Archive content and shared-sky coordinates are stored locally in the current browser/device. There is no account, server, cloud sync, or cross-device sync.
- Local geolocation is requested only after the visitor taps the location button. Coordinates are used in the browser to calculate the local sky; Elseverse does not send them to an Elseverse server.
- `public` is only a visibility label in this prototype; it does not publish anything to the internet.
- Do not treat local browser storage as strong security for sensitive content.
- Back up important data before replacing the deployed site. The app retains the original `myself-worlds` and `myself-language` keys and does not delete the old `myself-media-v1` image database.
- Legacy world cover image upload controls from the previous version are not included in this prototype UI; the existing media database is left untouched.

## Network and astronomy accuracy
- SkyEngine, its star data, Aladin Lite, and HiPS survey tiles load from their upstream providers at runtime. The observatory requires an internet connection; the rest of the archive remains usable if those services are unavailable.
- The live local/shared sky is a computed planetarium view, not a live camera feed. SkyEngine's built-in Sun/planet position algorithm is described upstream as approximately 1-degree accuracy.
- Deep-sky imagery is real survey photography/observational data assembled into HiPS tiles. It is not a live telescope stream. The available survey's angular resolution and sky coverage differ; changing zoom does not create detail beyond the source survey's resolution.
- The Hubble Deep Field preset opens the corresponding sky region in the selected survey. To inspect actual Hubble imagery at its native observation resolution, a dedicated Hubble FITS/image layer would need to be loaded separately in a later iteration.

## Version notes
### v0.5.1 navigation fix
Unified cleanup of global sky theme on navigation, preventing the dark sky state from leaking into the light homepage.

### v0.5.2 immersive sky
Fixed full-screen background positioning, added separate atmospheric twinkle/meteor effects, and added immersive viewing mode.

### v0.6 Observatory
- Added a separate deep-sky survey view using Aladin Lite 3.9.4.
- Added selectable DSS2, Pan-STARRS DR1, 2MASS, and AllWISE survey layers.
- Added preset astronomical targets and named-object lookup.
- Added logarithmic zoom slider; native pinch zoom and drag navigation remain available.
- Deep-sky imagery is fixed to the viewport and remains available in immersive mode.
- Existing live sky, archive records, local storage keys, and legacy media database are preserved.
