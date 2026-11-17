# FoundryVTT - Quest Log

![GitHub release (latest SemVer)](https://img.shields.io/github/v/release/Gremlim/foundryvtt-quest-log?style=for-the-badge&label=Quest+Log+version)
![GitHub release](https://img.shields.io/github/release-date/Gremlim/foundryvtt-quest-log?style=for-the-badge)
![License](https://img.shields.io/github/license/Gremlim/foundryvtt-quest-log?style=for-the-badge)
![Zip Downloads](https://img.shields.io/github/downloads/Gremlim/foundryvtt-quest-log/latest/module.zip?style=for-the-badge)
[![GitHub commits](https://img.shields.io/github/commits-since/Gremlim/foundryvtt-quest-log/latest?style=for-the-badge)](https://github.com/Gremlim/foundryvtt-quest-log/commits/)

[![Translation status](https://hosted.weblate.org/widget/foriens-quest-log/287x66-black.png)](https://hosted.weblate.org/engage/foriens-quest-log/)

Based on [Forien's Quest Log](https://github.com/Forien/foundryvtt-forien-quest-log)

This module provides comprehensive Quest Log system for players and Game Masters to use with [Foundry VTT](https://foundryvtt.com/).

### Compatibility

| Foundry Version | Module Version |
|-----------------|----------------|
| v13             | v0.9.*         |
| v12             | v0.8.*         |
| v11             | v0.8.*         |

### Game Systems
_any_

### Language Translations: see [#translations](#translations)

## Installation

1. (Recommended) Install Quest Log from the Foundry package manager directly. 
   - _or_ manually using the manifest URL: `https://github.com/Gremlim/foundryvtt-quest-log/releases/latest/download/module.json`


2. While loaded in your World, enable **_Quest Log_** in the `Module Management` configuration. 

## Recent Updates

The major `0.9.0` update to FQL:

- Foundry v13 support.
- "Jump To Pin" Context Menu option.
- Added Keybindings
  - `openQuestLog` (default: `CTRL+Q`) — Opens Quest Log (if GM or not hidden)
  - `openPrimaryQuest` (default: `CTRL+SHIFT+Q`) — Opens Primary Quest (if any)
  - `toggleQuestTracker` (default: `CTRL+ALT+Q`) — Toggles the Quest Tracker

## Usage

A button to access the Quest Log is situated on the bottom of Journal Directory or in the left hand scene controls icon 
toolbar under notes / journal entries where two new icons (scroll and list) opens the Quest Log and Quest Tracker. There
also are two `macro compendiums` available for FQL that provide ready to go macros to drop onto your hotbar that allow
convenient access to FQL for players and several GM related options.

There is a series of useful [in-depth video tutorials on YouTube](https://www.youtube.com/playlist?list=PLHslnNa8QKdD_M29g_Zs0f9zyAUVJ32Ne) 
that cover the `0.7 - 0.8` releases.

FQL is quite user-friendly with an intuitive UI, however you might want to [check out the Wiki](https://github.com/Gremlim/foundryvtt-quest-log/wiki) for more detailed usage including macros and Quest API details for external developers integrations. 

## Features

- Quest Log windows that lists all quests divided into `In Progress`, `Completed` and `Failed` tabs.
- Quest creator with WYSIWYG editors for description and GM notes.
- Quest objectives.
- Draggable Item rewards.
- Fully editable Quest Details window.
- Personal Quests.
- Quest Branching in the form of Sub Quests.

## About

FQL is being updated for stability across core Foundry updates. This stability and long term maintenance of such is 
the _main feature_ of FQL presently. You can rest assured that the quest log experience you know and _love_ will 
continue to be available now and into the future.

## Translations

FQL uses Weblate to coordinate language translation from community translators. Through this interface you are able to
provide language corrections and translations. I am more than willing to support even more language translations for
FQL, so if your language isn't represented yet please visit the [FQL Weblate Portal](https://hosted.weblate.org/projects/foriens-quest-log/)
and get in contact.

The following Translations are available:

| Language                           | Last updated version |
|------------------------------------|----------------------|
| Chinese (simplified / traditional) | v0.8                 |
| Dutch                              | v0.8                 |
| English                            | v0.9                 |
| Finnish                            | v0.8                 |
| French                             | v0.8                 |
| German                             | v0.8                 |
| Italian                            | v0.8                 |
| Japanese                           | v0.8                 |
| Korean                             | v0.8                 |
| Polish                             | v0.8                 |
| Portuguese (Brazil)                | v0.8                 |
| Russian                            | v0.8                 |
| Spanish                            | v0.8                 |
| Swedish                            | v0.8                 |

## Future plans (current ideas)

Rock solid stability through future releases of Foundry VTT and even more language / internationalization support.
At this time a few quality of life features may be added in any given release as well.

_If you think you have found a bug or usability issue with FQL itself please file an issue in the 
[FQL Issue Tracker](https://github.com/Gremlim/foundryvtt-quest-log/issues)_.

## Contact

TBD

## Acknowledgments

See [Authors](https://github.com/Gremlim/foundryvtt-quest-log/blob/master/AUTHORS) and
[Contributors](https://github.com/Gremlim/foundryvtt-quest-log/graphs/contributors)

## Support (Historical)

Between the summer of '21 and '24 FQL was developed and maintained by Michael Leahy aka [TyphonJS](https://github.com/typhonrt) / 
[TyphonJS Discord](https://typhonjs.io/discord/). Michael took FQL from MVP to the questing powerhouse that FQL became
and maintained the package through a challenging series of Foundry core update `v0.8` through `v12`. 

## License

Quest Log is a module for Foundry VTT by Gremlim and is licensed under a [MIT License](https://github.com/Gremlim/foundryvtt-quest-log/blob/master/LICENSE). 

This work is licensed under Foundry Virtual Tabletop [EULA - Limited License Agreement for module development from February 17, 2021](https://foundryvtt.com/article/license/).
