# Lost & Found — Daylight Relic

**TC5003 — Designing the Structure and Style of an Interactive Experience**

## Project Overview

Lost & Found is a personal, browser-based memory experience. Users can write a
memory, place it inside a glass Memory Orb, choose to hold on or let it fade,
and revisit saved records in a private-feeling Memory Archive.

The project is a working front-end prototype built with semantic HTML, CSS, and
vanilla JavaScript. It has no framework, build system, backend, or account
system.

## Design Concept

The selected visual direction, **Daylight Relic**, combines realistic glass,
smoke, natural daylight, warm neutral tones, and a stone surface. The Memory
Orb is the central visual object, while restrained typography and spacing keep
the writing experience calm and reflective.

The Orb uses transparent PNG assets for Empty, Holding, Fading, and Released.
The Empty and Released files currently contain the same clear-Orb artwork. The
Fading transition is a three-second crossfade between still Orb images rather
than a particle or video simulation.

## How to Run

1. Download or clone the repository.
2. If downloaded as a ZIP, extract it to a normal folder.
3. Open [`site/index.html`](site/index.html) in a current browser.

No installation, terminal command, local server, or internet connection is
required. The direct-file experience has been tested in desktop Chrome.

## Project Structure

The interactive website uses exactly three code files:

```text
site/
├── index.html   # Memory Orb and Memory Archive structure
├── styles.css   # Daylight Relic styling, layout, and transitions
├── app.js       # Navigation, interactions, and local storage
└── assets/      # Approved scene and transparent Orb imagery
```

Both the Memory Orb and Memory Archive are views inside `index.html`. Hash-based
navigation (`#orb` and `#archive`) supports switching views, refreshing, and
browser history without loading a second HTML page. The live interface uses
`background-scene.png` and the `orb-*.png` state assets. The source
`references/` folder also contains an Archive mockup and a standalone smoke
overlay, but neither is a runtime dependency.

## Interactions

- Write a memory and use **Place in Orb** to enter the Holding state.
- Use **Hold On** to save the memory as **Held**.
- Use **Let It Fade** to begin the Fading transition and save it as
  **Released** when the transition completes.
- Pause a fading memory and return it to Holding.
- Filter Archive records by **All**, **Held**, or **Released**.
- Reveal or hide the text of Held memories.
- Use **Bring It Back** to restore a Released memory to Held and make its text
  available again.
- Permanently delete a selected record after confirmation.
- Preserve unique, sequential memory numbers across saved records.

## AI-Assisted Design Process

AI tools supported different stages of the project while design decisions were
reviewed and refined by the team:

- **ChatGPT** supported early concept exploration, interaction ideas, and UX
  writing discussions.
- **Work** was used to develop the Daylight Relic visual mockups and image
  assets.
- **Codex** translated the approved design into HTML and CSS, implemented the
  JavaScript interactions, and helped audit and refine the final prototype.

## Storage and Limitations

Memories are stored in the browser with `localStorage` under the key
`lost-found.daylight.v1`. They remain on the current device, browser profile,
and file origin only. Saved memories are not included when the repository is
downloaded or transferred to another computer.

This prototype does not provide encryption, password protection, cloud sync,
accounts, or server-side backup. Clearing browser data may remove saved
records, and browser handling of storage for local files can vary. Released
memories are hidden in the interface but remain stored until they are restored
or permanently deleted.
