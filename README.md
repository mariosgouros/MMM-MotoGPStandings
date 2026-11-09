# MMM-MotoGPStandings

A [MagicMirror²](https://magicmirror.builders/) module that shows the current world championship standings for MotoGP, Moto2, Moto3 or MotoE.


Data comes from the well documented MotoGP API from [robschmitt/MotoGP-API](https://github.com/robschmitt/MotoGP-API). No API key is needed.

There is lots of room for improvement and new features are still to come.

For now, the module offers two main display views, ``full`` and ``compact``, which affect the amount of columns to be displayed (see ``config.js``).
Regarding riders user has the option to display all riders ``maxRows: 0`` of the selected MotoGP category ``category`` or a part of them with ``maxRows`` > 0.
Finally, there is an option to display national flags  in the Nation column if ``viewMode: "full"`` is selected instead of country ISO codes.

## Flags

Flags are bundled locally in `flags/` (SVG, 4:3) from [flag-icons](https://github.com/lipis/flag-icons) (MIT, see `flags/LICENSE-flag-icons.txt`). If a flag file is missing the ISO code is shown instead.

## Screenshots

``viewMode: "full"``, ``maxRows: 10`` and ``showFlags: true`` 
<img width="1442" height="810" alt="preview-full-flags" src="https://github.com/user-attachments/assets/563c355b-de7b-46d1-a06c-ab20fffcf7bd" />

``viewMode: "full"``, ``maxRows: 10`` and ``showFlags: false`` 
<img width="1442" height="810" alt="preview-full-iso" src="https://github.com/user-attachments/assets/61a389c1-f91e-4091-9088-94440c725085" />

``viewMode: "compact"`` and ``maxRows: 10``
<img width="794" height="810" alt="preview-compact" src="https://github.com/user-attachments/assets/50c9d0c0-f8c4-4e9e-ba5f-49f4b0473b87" />

## Installation

```bash
cd ~/MagicMirror/modules
git clone https://github.com/mariosgouros/MMM-MotoGPStandings
```
Requires a MagicMirror version running on Node.js 18 or newer. No `npm install` is needed.

## Update

```bash
cd ~/MagicMirror/modules
git pull
```

## Configuration

```js
{
  module: "MMM-MotoGPStandings",
  position: "top_left",
  config: {
    category: "MotoGP" // "MotoGP", "Moto2", "Moto3" or "MotoE"
  }
}
```

| Option | Default | Description |
|--------|---------|-------------|
| `category` | `"MotoGP"` | `"MotoGP"`, `"Moto2"`, `"Moto3"` or `"MotoE"`. |
| `viewMode` | `"full"` | `"full"` shows all columns; `"compact"` shows only Pos, Rider and Points. |
| `showFlags` | `true` | Show national flags in the Nation column. Set `false` for ISO codes (e.g. `ES`). |
| `maxRows` | `0` | Limit the number of riders shown. `0` shows everyone. When set to anything else, the last two rows fade out. |
| `updateInterval` | `3600000` | Refresh period in ms (1 hour). |
| `retryDelay` | `300000` | Retry period in ms after a failed update (5 minutes). |
| `fallbackToPreviousSeason` | `true` | If the newest season has no standings yet (before the first race), show the previous season instead. |
| `animationSpeed` | `1000` | DOM update animation in ms. |

## How it works

1. `GET /results/seasons` and select the season with `current: true` (otherwise the newest year).
2. `GET /results/categories?seasonUuid=…` and match `category` against the category names.
3. `GET /results/standings?seasonUuid=…&categoryUuid=…` and render `classification`.

All requests are made by `node_helper.js` on the server side.

