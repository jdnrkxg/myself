# MySelf — v0.4

A mobile-first bilingual (Chinese / English) personal worlds archive prototype.

## What's new in v0.4
- Redesigned the homepage with an editorial / personal-archive visual direction.
- Added a hero area, Dream Worlds and Original Worlds collection covers, a recently collected section, and a personal note.
- Added image customization for the homepage hero, both collection covers, and each individual world.
- Added image preview, replacement, and reset-to-default behavior.
- Images are resized to a maximum 1800px edge and stored as WebP in IndexedDB to reduce storage use.
- Preserved the existing `myself-worlds` localStorage data format and bilingual language preference.
- Kept world add/edit/delete and module selection behavior.
- Responsive layouts for mobile and desktop, including Android image-picker support through `accept="image/*"`.

## Run
1. Extract the ZIP.
2. Open `index.html` in a modern browser, or deploy the folder to a static hosting service.
3. Open **Manage / 管理** to edit worlds and customize images.

## Storage and privacy notes
- World metadata remains in localStorage under `myself-worlds`.
- Custom images are stored separately in IndexedDB in the current browser on the current device.
- Images do not sync between devices and are not uploaded to a server. Clearing site/browser data may erase them.
- Export/backup important world data before replacing an existing deployment.
- Browser storage quotas vary. If an image cannot be saved, try a smaller image.
- The prototype still has no login, cloud sync, access control, or full content editors for modules. Do not store sensitive/private diary or letter content here.

## Validation
- JavaScript syntax checked with `node --check`.
- This package has not been fully tested in a real Android browser. Please test image picking, replacement, reset, and world management on the deployed site before relying on it.
