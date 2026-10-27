# Lost & Found — Daylight Relic

Open `index.html` in a current browser. No installation, server, network
connection, or build step is required.

## Required structure

- `index.html` contains the semantic HTML for both the Memory Orb and Archive.
- `styles.css` contains all styling and responsive rules.
- `app.js` contains navigation, interactions, and browser-local persistence.
- `assets/` contains the approved Daylight Relic scene and Orb images.

The top navigation switches between `#orb` and `#archive` views in the same
document. All visible interface copy and controls are live HTML elements.

## Interaction model

- Place in Orb creates a draft memory.
- Hold On saves a Held record.
- Let It Fade runs a three-second visual crossfade and saves a Released record.
- Held records can be revealed or hidden.
- Released records must be restored with Bring It Back before their text appears.
- Permanent deletion requires confirmation.

Records are stored in `localStorage` under `lost-found.daylight.v1`. They stay in
the current browser and are not synced, encrypted, or associated with accounts.
