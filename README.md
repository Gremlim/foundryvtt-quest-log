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
| v14             | v0.29.*        |
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
also are two `macro compendiums` available for GQL that provide ready to go macros to drop onto your hotbar that allow
convenient access to GQL for players and several GM related options.

There is a series of useful [in-depth video tutorials on YouTube](https://www.youtube.com/playlist?list=PLHslnNa8QKdD_M29g_Zs0f9zyAUVJ32Ne) 
that cover the `0.7 - 0.8` releases.

GQL is quite user-friendly with an intuitive UI, however you can read the [Automation](#automation) section for macros, hooks and the Quest API for integrations (for example tile triggers). 

## Automation

Everything that can be triggered from outside the Quest Log windows (macros, tile triggers such as Monk's Active Tiles,
other modules, keyboard shortcuts) is documented here.

- [Ways to run an automation](#ways-to-run-an-automation)
- [Referencing quests, objectives and rumors](#referencing-quests-objectives-and-rumors)
- [Opening windows](#opening-windows)
- [Changing quests](#changing-quests)
- [Reading quests](#reading-quests)
- [Players and the GM](#players-and-the-gm)
- [Events (hooks)](#events-hooks)
- [Compendium macros and settings](#compendium-macros-and-settings)
- [Recipes](#recipes)
- [Troubleshooting](#troubleshooting)

### Ways to run an automation

| Way                      | What it does                                                                                           |
|--------------------------|--------------------------------------------------------------------------------------------------------|
| Keybindings              | `openQuestLog` (`CTRL+Q`), `openPrimaryQuest` (`CTRL+SHIFT+Q`), `toggleQuestTracker` (`CTRL+ALT+Q`). Configurable in Foundry's keybindings. |
| Drag a quest to the hotbar | Creates a macro that opens that quest.                                                               |
| Macro compendiums        | `QL Macros (GM)` and `QL Macros (Player)`: ready-made macros to drag to the hotbar (see below).       |
| Foundry hooks            | `Hooks.call('QuestLog.Open.QuestLog')` and similar (see [Opening windows](#opening-windows)).          |
| Public API               | `game.modules.get('quest-log').public.QuestAPI`, to use in script macros, tile triggers or other modules. |

In a script macro it is handy to start with:

```js
const QuestAPI = game.modules.get('quest-log').public.QuestAPI;
```

### Referencing quests, objectives and rumors

- **Quest**: the quest ID (the ID of its journal entry) or the quest name. Names ignore upper / lower case and surrounding
  spaces; if two quests share a name the first one found is used, so use the ID when names can repeat.
- **Objective**: its UUID, its name (plain text, ignoring case) or its position as a number (`1` is the first objective).
- **Rumor**: its UUID, its text (plain text, ignoring case) or its position as a number.
- **Status**: `active` (in progress), `available`, `completed`, `failed` or `inactive` (hidden for the players).

Names are comfortable but break if you rename the quest or the
objective, so the ID / UUID is the safest choice for long campaigns.

### Opening windows

```js
Hooks.call('QuestLog.Open.QuestLog');                        // Quest Log
Hooks.call('QuestLog.Open.QuestLog', { tabId: 'available' }); // a specific tab: active, available, completed, failed, inactive, rumors
Hooks.call('QuestLog.Open.QuestTracker');                    // Quest Tracker

QuestAPI.open({ questId: 'abc123' });  // opens a quest (a notification is shown when it can't be opened)
QuestAPI.openPrimary();                // opens the primary quest
```

Players only open what they are allowed to see; nothing opens if the Quest Log is hidden from the players.

### Changing quests

Every method returns a promise with the result `{ ok, changed?, error? }`. Nothing changes (`changed: false`) when the
quest already was in the requested state, so the macros can be run several times safely. Changes are written to the quest
history with the name of the user that triggered them and all the open windows refresh automatically.

| Method                                                        | Effect                                                                 |
|---------------------------------------------------------------|------------------------------------------------------------------------|
| `QuestAPI.setQuestStatus(quest, status)`                      | Moves the quest to another status (for example `inactive` → `available`). |
| `QuestAPI.setObjectiveState(quest, objective, state)`         | `state` is `completed`, `failed` or `pending`. Completing a counter objective fills its counter. |
| `QuestAPI.setObjectiveVisible(quest, objective, visible)`     | Shows (`true`) or hides (`false`) an objective for the players.        |
| `QuestAPI.setObjectiveCount(quest, objective, { value })`     | Sets the counter of an objective. Use `{ delta: 1 }` to add (or `{ delta: -1 }` to subtract). Reaching the target completes it. |
| `QuestAPI.hearRumor(quest, rumor, heard)`                     | Marks a rumor as heard (default `true`). Hearing enough rumors unlocks the quest and notifies the players. |
| `QuestAPI.setRumorVisible(quest, rumor, visible)`             | Shows or hides a rumor in the Rumors tab of the players.               |
| `QuestAPI.resetQuest(quest)`                                  | Resets the quest and its subquests (objectives pending, counters to 0, rewards restored) and makes it available. |

Possible values of `error`: `quest-not-found`, `objective-not-found`, `rumor-not-found`, `invalid-status`,
`invalid-state`, `invalid-count`, `no-counter`, `not-allowed-or-no-gm`.

### Reading quests

Reading never changes anything and works for everybody, but players only get the quests they can see (hidden / inactive
quests are not loaded in their clients) and never the hidden objectives or the rumors.

| Method                               | Returns                                                                                        |
|--------------------------------------|------------------------------------------------------------------------------------------------|
| `QuestAPI.getQuest(quest)`           | A copy of the data: `{ id, name, status, parent, subquests, objectives, rumors }` or `null`.   |
| `QuestAPI.getStatus(quest)`          | The status of the quest, or `null` if it is not found.                                          |
| `QuestAPI.isStatus(quest, status)`   | `true` / `false`.                                                                               |
| `QuestAPI.getQuests({ status })`     | The data of every quest (optionally only those with a status).                                 |

Each objective is `{ uuidv4, name, completed, failed, hidden, count, target }` and each rumor
`{ uuidv4, text, heard, visible }` (rumors only for the GM).

For advanced uses the `QuestAPI.DB` object (a safe view of the quest database) offers `getQuest`, `getAllQuests`,
`filter`, `find`, `getCount`, `createQuest` and the iterators, and `QuestAPI.DB.hooks` lists the database events.

### Players and the GM

The quests that are hidden for the players are **not loaded in their clients**, so a player's client can't change them.
For that reason:

- When the macro runs in the client of a **GM** the change is made right away.
- When it runs in the client of a **player** (for example a tile triggered by walking over it) the request is sent to
  the connected GM, whose client makes the change. This is disabled by default: enable the world setting
  **Players can run automations**. **At least one GM must be connected** (a Foundry limitation); otherwise nothing
  happens and the call returns `not-allowed-or-no-gm`.
- A player call only returns `{ ok: true, forwarded: true }`, because the GM runs it afterward.

That is what allows players to find and progress quests by exploring the map: the tile triggers a macro that updates
the quest through the connected GM.

### Events (hooks)

Listen to them with `Hooks.on(name, callback)`. They are fired in every client when the quest data changes, whoever
made the change, so they are the way to react to the quests (for example from another module or a macro).

| Hook                       | Arguments                                         | When                                     |
|----------------------------|---------------------------------------------------|------------------------------------------|
| `addedAllQuestEntries`     | -                                                 | All the quests were loaded.              |
| `addQuestEntry`            | `questEntry, flags, options, id`                  | A quest became visible / was added.      |
| `createQuestEntry`         | `questEntry, options, id`                         | A quest was created.                     |
| `updateQuestEntry`         | `questEntry, flags, options, id`                  | A quest changed (status, objectives…).   |
| `removeQuestEntry`         | `questEntry, flags, options, id`                  | A quest stopped being visible.           |
| `deleteQuestEntry`         | `questEntry, options, id`                         | A quest was deleted.                     |
| `removedAllQuestEntries`   | -                                                 | All the quests were removed.             |
| `QuestLog.Lifecycle.ready` | -                                                 | The module is ready.                     |

`questEntry.quest` is the quest (`quest.status`, `quest.tasks`, …). The Quest Tracker also fires
`preUpdateQuestTracker`, `updateQuestTracker` and `questTrackerBoundaries` when it moves or resizes. The names of the
database hooks are in `QuestAPI.DB.hooks`.

```js
Hooks.on(QuestAPI.DB.hooks.updateQuestEntry, (questEntry) => {
   if (questEntry.quest.status === 'completed') { ui.notifications.info(`${questEntry.quest.name} completed`); }
});
```

### Compendium macros and settings

The `QL Macros (GM)` and `QL Macros (Player)` compendiums have macros to drag to the hotbar: open the Quest Log and the
Quest Tracker, open the primary quest and, for the GM, switch some of the settings below with one click (the macro icon
shows the current state). The module settings that influence the automations:

| Setting (world)                  | Effect                                                                              |
|----------------------------------|-------------------------------------------------------------------------------------|
| Players can run automations      | Lets macros / tiles run by players change quests (executed by a connected GM). Off by default. |
| Hide Quest Log from players      | Hides the Quest Log and the API from the players.                                   |
| Players can accept Quests        | Players move quests from Available to In Progress.                                  |
| Players can create Quests        | Players create their own quests.                                                    |
| Allow Trusted Player Quest Editing | Trusted players edit the quests they own.                                         |
| Allow Player Reward Dragging     | Players drag rewards to their actors.                                               |
| Count hidden objectives          | Hidden objectives count in the totals of the Quest Log.                             |
| Show Reward Drop Notifications   | The GM is notified when a reward is dropped on an actor.                            |
| Quest Tracker Resizable / enabled | Client options of the Quest Tracker.                                               |

### Recipes

All of them need the `QuestAPI` constant of [the start of this section](#ways-to-run-an-automation). In a Monk's Active
Tile Trigger use the _Run Macro_ action (or the tile's script option) and, for players to trigger it, enable **Players
can run automations**. Check the options of the tile action to see on which client the macro runs.

**A trap changes the objectives** ("Infiltrate without alerting the guards" → "Fight your way into the camp"):

```js
await QuestAPI.setObjectiveVisible('Infiltrate the camp', 'Infiltrate without alerting the guards', false);
await QuestAPI.setObjectiveVisible('Infiltrate the camp', 'Fight your way into the camp', true);
```

**Finding an item makes a quest available** ("Investigate the mysterious note"):

```js
await QuestAPI.setQuestStatus('Investigate the mysterious note', 'available');
```

**An NPC comments depending on the active quests** (a macro for the GM or a player that has the quest visible):

```js
if (QuestAPI.isStatus('Trouble in the north', 'active')) {
   ChatMessage.create({ speaker: { alias: 'Old Tom' }, content: 'I heard you have business in the north? Be careful out there.' });
}
```

**Complete an objective and advance a counter** (a tile in each pumpkin patch):

```js
await QuestAPI.setObjectiveCount('Pumpkin harvest', 'Find the pumpkins', { delta: 1 });
await QuestAPI.setObjectiveState('Pumpkin harvest', 'Talk to the farmer', 'completed');
```

**A rumor is heard in the tavern** (several rumors can unlock a quest):

```js
await QuestAPI.hearRumor('The lost mine', 'The old miner knows the way');
```

**Unlock the quest list of a chapter** (all the quests of one group become available):

```js
for (const quest of QuestAPI.getQuests({ status: 'inactive' })) {
   if (quest.name.startsWith('Chapter 2')) { await QuestAPI.setQuestStatus(quest.id, 'available'); }
}
```

### Troubleshooting

- _`quest-not-found`_: check the name / ID; as a player you only find the quests you can see. Run the macro as GM or
  use the ID.
- _Nothing happens when a player triggers it_: enable **Players can run automations** and make sure a GM is connected.
- _`getQuests()` is empty for a player_: the Quest Log is hidden from the players or the quests are inactive.
- Calls of the API do not need `await` unless you need the result or the order of several changes matters.

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
- Automation API for macros and tile triggers (quest status, objectives, counters, rumors), with players able to progress quests through a connected GM.

## About

GQL is being updated for stability across core Foundry updates. This stability and long term maintenance of such is 
the _main feature_ of GQL presently. You can rest assured that the quest log experience you know and _love_ will 
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

_If you think you have found a bug or usability issue with GQL itself please file an issue in the 
[GQL Issue Tracker](https://github.com/Gremlim/foundryvtt-quest-log/issues)_.

## Contact

Open an issue in the [issue tracker](https://github.com/Gremlim/foundryvtt-quest-log/issues).

## Acknowledgments

See [Authors](https://github.com/Gremlim/foundryvtt-quest-log/blob/master/AUTHORS) and
[Contributors](https://github.com/Gremlim/foundryvtt-quest-log/graphs/contributors)

## Support (Historical)

Between the summer of '21 and '24 GQL was developed and maintained by Michael Leahy aka [TyphonJS](https://github.com/typhonrt) / 
[TyphonJS Discord](https://typhonjs.io/discord/). Michael took GQL from MVP to the questing powerhouse that GQL became
and maintained the package through a challenging series of Foundry core update `v0.8` through `v12`. 

## License

Quest Log is a module for Foundry VTT by Gremlim, based on Forien's Quest Log, and is licensed under a [MIT License](https://github.com/Gremlim/foundryvtt-quest-log/blob/master/LICENSE). 

This work is licensed under Foundry Virtual Tabletop [EULA - Limited License Agreement for module development from February 17, 2021](https://foundryvtt.com/article/license/).
