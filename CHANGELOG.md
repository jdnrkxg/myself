# Elseverse v0.5 — Live Sky update

- Added two switchable sky modes in Our Little Universe: local real sky and a fixed shared sky.
- Local sky requests browser geolocation only after the visitor taps the location button.
- Shared sky supports manual latitude/longitude and can save the current location as the shared observing point.
- Added real-star catalogue rendering, horizon view, live clock/date updates, constellation, star-label and planet toggles.
- Added responsive mobile controls and reduced-motion consideration.
- Preserved existing world storage keys and archive record storage.
- SkyEngine and its star catalogue load from jsDelivr at runtime; internet access is required for first load. See THIRD_PARTY_NOTICES.md.

## Known limitations
- This is a browser planetarium based on a real star catalogue, not an actual camera/telescope feed.
- Browser geolocation requires HTTPS and user permission.
- Shared observing coordinates are stored locally in this browser only.
- Planet positions in the upstream SkyEngine are documented as approximately 1-degree accuracy.

## v0.5.1 — Navigation layout bug fix
- Centralized live-sky theme cleanup in `show()` so every transition away from Our Little Universe stops the sky engine and removes `body.sky-active`.
- Fixed the logo-to-home path, which previously bypassed `stopLiveSky()` and could leave the dark global theme active.
- Added defensive light-theme CSS resets for the header, text colors, backdrop canvas, and body when the sky mode is inactive.
- Kept existing storage keys and archive data formats unchanged.

## v0.5.2 — Immersive live sky
- Added a one-tap immersive mode with a minimal floating exit control and Escape-key exit.
- Promoted the real planetarium canvas to a viewport-fixed background so it no longer scrolls with page content.
- Added a separate lightweight atmospheric canvas for subtle star twinkle and occasional meteor streaks; astronomical star/planet positions remain sourced from the real star catalogue/engine.
- Added a persistent motion-effects toggle (local browser preference).
- Kept the live sky active across Our Little Universe archive subpages; it stops when leaving the universe for the main Elseverse site.
- Preserved existing archive and legacy world storage keys.

## v0.6 — Elseverse Observatory
- Added Aladin Lite v3.9.4 as a separate real survey-image explorer alongside the live local/shared star chart.
- Added DSS2, Pan-STARRS DR1, 2MASS and AllWISE HiPS survey choices.
- Added presets for Galactic Centre, M31, M42, M45, M1 and the Hubble Deep Field region, plus named-object lookup.
- Added logarithmic field-of-view slider and retained native touch pinch/drag interaction.
- Added fixed viewport deep-sky layer and floating controls that remain usable in immersive mode.
- Preserved legacy local storage keys, archive IndexedDB schema and old media database.
- Added third-party license and survey attribution notes.

## v0.7 — Photo Sky
- Removed Aladin Lite, the deep-sky observing view, all deep-sky controls, and the external Aladin script.
- Removed SkyEngine and the remote star-catalogue runtime dependency.
- Replaced the astronomy engines with selectable NASA/Hubble/Webb photo backgrounds.
- Kept lightweight local Canvas star twinkle and meteor effects.
- Added decorative constellation lines, zoom, favorites, and immersive mode.
- Preserved archive pages, IndexedDB records, legacy world/language keys, and backup/import behavior.

## IF Lines Bubble Prototype 0.1
- Replaced flat world collection tiles with responsive translucent orb entrances.
- Uses CSS gradients, glass highlights, abstract orbital filaments and restrained sparkle; no interior buildings.
- Preserves existing world IDs, localStorage keys, archive IndexedDB, and world detail navigation.
- Mobile-first two-column bubble layout with reduced-motion support.
