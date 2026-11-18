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
