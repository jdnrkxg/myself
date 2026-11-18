# MySelf — v0.3

Mobile-first bilingual (Chinese / English) personal worlds archive prototype.

## Changes in v0.3
- Fixed duplicated English tagline in English mode.
- Language switching updates labels without navigating or resetting the current scroll position.
- New worlds receive a sensible default module selection based on category; users can change it freely.
- Added editing for existing worlds (name, English name, description, category, modules).
- Added cancel-edit behavior.
- Saves and deletions are transactional: the in-memory UI is updated only after localStorage confirms a successful write.
- Deleting the currently open world safely returns to the index.
- Added unique IDs and stricter stored-data validation.
- Kept the minimal visual design and mobile safe-area support.

## Run
1. Extract the ZIP.
2. Open `index.html` in a browser, or upload the folder to a static hosting service.
3. Use **Manage** to add, edit, or delete worlds.
4. Use the language toggle to switch between Chinese and English.

## Important limitations
- This is still a front-end prototype. Module cards are placeholders, not full editors.
- Data is stored only in the current browser on the current device. Clearing browser data can erase it.
- There is no login, cloud sync, access control, or image upload.
- Do not store sensitive/private diary or letter content in this prototype.
- If existing local data is malformed, v0.3 loads starter data in memory and does not automatically overwrite the stored raw value. Export/backup important browser data before replacing project files.

## Validation
- JavaScript syntax checked with `node --check`.
- All literal DOM IDs referenced by the JavaScript were checked against `index.html`.
- A full real-device interaction test has not yet been performed; test on Android Chrome before treating this as a customer-ready product.
