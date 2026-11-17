# FoundryVTT - Quest Log

![GitHub release (latest SemVer)](https://img.shields.io/github/v/release/Gremlim/foundryvtt-quest-log?style=for-the-badge&label=Quest+Log+version)
![GitHub release](https://img.shields.io/github/release-date/Gremlim/foundryvtt-quest-log?style=for-the-badge)
![License](https://img.shields.io/github/license/Gremlim/foundryvtt-quest-log?style=for-the-badge)
![Zip Downloads](https://img.shields.io/github/downloads/Gremlim/foundryvtt-quest-log/latest/module.zip?style=for-the-badge)
[![GitHub commits](https://img.shields.io/github/commits-since/Gremlim/foundryvtt-quest-log/latest?style=for-the-badge)](https://github.com/Gremlim/foundryvtt-quest-log/commits/)

Based on [Forien's Quest Log](https://github.com/Forien/foundryvtt-forien-quest-log), originally created by Forien and maintained for years by Michael Leahy (TyphonJS). This fork is maintained by [Gremlim](https://github.com/Gremlim).

This module provides comprehensive Quest Log system for players and Game Masters to use with [Foundry VTT](https://foundryvtt.com/).

### Compatibility

| Foundry Version | Module Version |
|-----------------|----------------|
| v14             | v0.25.*        |
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

Main additions of this fork since `0.9.0`:

- Foundry v14 support (`ApplicationV2`), without jQuery.
- Quest Tracker redesign: collapsible objectives, groups, a menu with its options, objective counters and per quest removal from your own tracker.
- Quest history (who completed objectives, took rewards or changed the status, with dates).
- Rewards with quantities, currencies and choice groups (taking one closes the others).
- Optional objectives and optional subquests, subquests intermixed with the objectives and objective counters (for example "Find the pumpkins [0/3]").
- Quest giver, location, group and deadline; accepting a quest with a character and the characters that accepted it.
- Rumors: loose texts that players see in their own tab of the Quest Log; hearing enough of them unlocks a quest.
- Repeatable quests and objectives that the GM can reset (objectives, counters, rewards and subquests).
- Personal quests for some players only, and a permission to let players edit the quests created by the GM.
- Quest Log search, grouping of the lists, duplicate quests and an actions menu in quests, objectives and rewards.

See the [changelog](https://github.com/Gremlim/foundryvtt-quest-log/blob/master/changelog.md) for all the details.

Keybindings (since `0.9.0`):

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

- Quest Log windows that lists all quests divided into `Available`, `In Progress`, `Completed`, `Failed` and `Inactive` tabs, plus the `Rumors` tab.
- Quest creator with WYSIWYG editors for description and GM notes.
- Quest objectives (optional ones, with counters, repeatable).
- Draggable Item rewards, currencies and choice groups.
- Fully editable Quest Details window and quest history.
- Personal Quests.
- Quest Branching in the form of Sub Quests.
- Quest Tracker with groups.
- Rumors and repeatable quests.

## About

FQL is being updated for stability across core Foundry updates. This stability and long term maintenance of such is 
the _main feature_ of FQL presently. You can rest assured that the quest log experience you know and _love_ will 
continue to be available now and into the future.

## Translations

The translations are the JSON files of the [lang folder](https://github.com/Gremlim/foundryvtt-quest-log/tree/master/lang).
English and Spanish are kept up to date with each release; the other languages come from the original module and
miss the strings added since then (the missing strings are shown in English). Translations are welcome, see
[CONTRIBUTING](https://github.com/Gremlim/foundryvtt-quest-log/blob/master/CONTRIBUTING.md).

The following Translations are available:

| Language                           | Last updated version |
|------------------------------------|----------------------|
| Chinese (simplified / traditional) | v0.8                 |
| Dutch                              | v0.8                 |
| English                            | v0.25                |
| Finnish                            | v0.8                 |
| French                             | v0.8                 |
| German                             | v0.8                 |
| Italian                            | v0.8                 |
| Japanese                           | v0.8                 |
| Korean                             | v0.8                 |
| Polish                             | v0.8                 |
| Portuguese (Brazil)                | v0.8                 |
| Russian                            | v0.8                 |
| Spanish                            | v0.25                |
| Swedish                            | v0.8                 |

## Future plans (current ideas)

Stability through future releases of Foundry VTT and quality of life features in each release.

_If you think you have found a bug or usability issue with FQL itself please file an issue in the 
[FQL Issue Tracker](https://github.com/Gremlim/foundryvtt-quest-log/issues)_.

## Contact

Open an issue in the [issue tracker](https://github.com/Gremlim/foundryvtt-quest-log/issues).

## Acknowledgments

See [Authors](https://github.com/Gremlim/foundryvtt-quest-log/blob/master/AUTHORS) and
[Contributors](https://github.com/Gremlim/foundryvtt-quest-log/graphs/contributors)

## Support (Historical)

Between the summer of '21 and '24 FQL was developed and maintained by Michael Leahy aka [TyphonJS](https://github.com/typhonrt) / 
[TyphonJS Discord](https://typhonjs.io/discord/). Michael took FQL from MVP to the questing powerhouse that FQL became
and maintained the package through a challenging series of Foundry core update `v0.8` through `v12`. 

## License

Quest Log is a module for Foundry VTT by Gremlim, based on Forien's Quest Log, and is licensed under a [MIT License](https://github.com/Gremlim/foundryvtt-quest-log/blob/master/LICENSE). 

This work is licensed under Foundry Virtual Tabletop [EULA - Limited License Agreement for module development from February 17, 2021](https://foundryvtt.com/article/license/).
