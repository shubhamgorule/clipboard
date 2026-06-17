# UI Components (from Figma)

This folder is a reusable component library for the browser extension UI.

## Sources

- Icon container states (Default/Hover/Pressed): Figma node `3008:7002`
- Text row states (Default/Hover/Edit): Figma node `3008:7462`
- Icon names: Figma node `3008:7039`

## Usage

Load CSS:

- `ui/styles/tokens.css`
- `ui/components/iconButton.css`
- `ui/components/clipRow.css`

Then in JS:

- `createIconButton({ icon: "solar:settings-linear" })`
- `createClipRow({ text: "..." })`

