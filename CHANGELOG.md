# Changelog

All notable changes to this project are documented in this file.
The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to [Semantic Versioning](https://semver.org/).

## [1.0.0] - 2026-11-05

Initial public release.

### Added
- Standings table for the MotoGP, Moto2, Moto3 and MotoE categories, with the category chosen by the `category` option.
- Automatic selection of the current (or latest) championship season.
- Full view (Pos, Rider, Nation, Team, Points) and compact view (Pos, Rider, Points), selected with `viewMode`.
- National flags in the Nation column (bundled SVGs from flag-icons), switchable to ISO codes with `showFlags`.
- `maxRows` option to limit the number of riders shown, with a `fadeOut` option that fades the last two visible rows.
- White highlight for position, rider name, nation and team, and bold white points. The rider number keeps the default MagicMirror colour.
- Automatic refresh (`updateInterval`) and retry after errors (`retryDelay`).
- `fallbackToPreviousSeason` option to show the previous season before the first race of a new one.
- Automatic header showing the category and season, overridable with MagicMirror's `header` option.
