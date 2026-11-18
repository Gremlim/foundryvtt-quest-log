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
| v14             | v1.0.*         |
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

## Guide to the features

A tour of everything the Quest Log does. Items marked _(GM)_ are only available to Game Masters; those marked
_(editors)_ to the GM and to players who can edit the quest (see [Who can do what](#who-can-do-what)). Most buttons of
quests, objectives and rewards are inside a **3 dots menu** that opens a dropdown with every action.

- [Quest Log window](#quest-log-window)
- [Quest window](#quest-window)
- [Objectives](#objectives)
- [Subquests](#subquests)
- [Rewards](#rewards)
- [Quest information](#quest-information)
- [Accepting quests](#accepting-quests)
- [Rumors](#rumors)
- [Repeatable quests](#repeatable-quests)
- [Personal quests](#personal-quests)
- [Who can do what](#who-can-do-what)
- [Quest history](#quest-history)
- [Quest Tracker](#quest-tracker)
- [Interface and quality of life](#interface-and-quality-of-life)

### Quest Log window

- Tabs for **Available**, **In Progress**, **Completed**, **Failed** and **Inactive** (the last one only for the GM and
  trusted players that can edit) plus the **Rumors** tab. The tabs are a horizontal bar under the window header.
- Every quest is a card with an accent line (in the accent color for the primary quest), its image (a placeholder when it
  has none), labels for subquest / personal / location / creator, the hidden and primary icons and the objectives counter.
- **Search**: every tab has a search box that filters while typing, ignoring case and accents. It looks in the name,
  giver, location, group, labels and accepted characters; every word you type must match.
- **Grouping**: each tab can group its quests by group, by giver or by location (alphabetical, with a quest count, a
  click collapses the group, quests without value last). The choice and the collapsed groups are remembered.
- The 3 dots menu of a quest has the status changes (complete, fail, set inactive, available, accept / join), delete,
  **Duplicate quest** _(GM)_ and **Reset the quest to repeat it** _(GM)_.
- The window menu has **Show to players** _(GM)_, which opens the Quest Log (on the selected tab) for the players.
- Quests can be dragged to the hotbar to create a macro that opens them.

### Quest window

Opens by clicking a quest. Its tabs:

| Tab               | Contents                                                                                           |
|-------------------|----------------------------------------------------------------------------------------------------|
| **Details**       | Description, objectives, rewards, giver, location, group, deadline and the characters that accepted it. |
| **Manage Quest**  | Quest settings _(GM)_: permissions, personal quest, repeatable, "Allow players to edit", splash art, subquests. |
| **Rumors**        | The rumors of the quest _(editors)_.                                                               |
| **Player Notes**  | Notes that the players write; every player with access can edit them.                              |
| **GM Notes**      | Private notes _(GM)_.                                                                              |
| **History**       | Activity log of the quest (see [Quest history](#quest-history)).                                   |

The 3 dots menu of the window has **Show in my Quest Tracker** (yes / no, available to everybody), show the splash and
copy a link to the quest. A star in the tab bar marks the **primary quest**, a crossed eye a hidden quest and a person
a personal quest. Descriptions and notes use a rich text editor.

### Objectives

- Add, edit, reorder (drag the arrows), hide / show and delete objectives _(editors)_. Click the checkbox to cycle
  pending → completed → failed. The Quest Tracker shows them as **P** (pending), **C** (completed, green) and **F**
  (failed, red).
- **Optional objectives** (bonus): star entry of the menu. They show "(optional)" and do not count in the completed /
  total of the quest.
- **Hidden objectives**: not visible for the players. The setting _Count hidden objectives_ decides if they count in the
  totals.
- **Counters**: "Set the counter of the objective" gives a target ("Find the pumpkins [0/3]") with [-] / [+] buttons
  (also in the tracker). Reaching the target completes the objective and going below it makes it pending again.
- **Repeatable objectives**: shown with a repeat icon and the number of times completed; "Reset the objective" makes it
  pending again with the counter at 0.
- **Entity links**: drag an actor, item, journal, scene, roll table, macro... from the sidebar, a compendium or a sheet
  onto an objective. Dropped on an objective being edited it becomes a link at the cursor; on another objective it is
  appended; on the empty area it creates a new objective.

### Subquests

- A quest can have subquests (add them in **Manage Quest** or with the subquest button). A subquest is a quest of its own
  and is listed under its parent in the Quest Log and in the Quest Tracker, with its own objectives.
- Subquests are **intermixed with the objectives**: drag the sort handle to put them in any position (the order is used
  in the Quest Tracker too).
- A subquest can be marked as **optional** (star entry of its menu): it shows "(optional)" and does not count in the
  objectives of its parent.

### Rewards

- Item rewards (drag any item onto the quest), custom rewards and, in game systems with supported currencies
  (currently dnd5e), **currency rewards** with the "Currency" button _(GM)_. Edit the amount with the `#` button.
- **Quantities**: an item reward can have several units ("x 3"). Dragging it onto an actor sheet asks how many to take and
  the rest stays in the quest.
- **Take all / Take an amount** buttons give the reward without dragging: to the character assigned to the player or, for
  the GM, to the actor of the selected token.
- **Choice groups** _(GM)_: rewards of the same group are alternatives; taking one closes (dims and locks) the others.
- Rewards can be locked, hidden and reordered. The setting _Allow Player Reward Dragging_ lets players drag rewards to
  their own actors, and _Show Reward Drop Notifications_ notifies the GM when a reward is dropped on an actor.

### Quest information

- **Quest giver**: drag an actor, or use a custom name and image.
- **Location**: free text (city, region...), edited with the pencil under the giver.
- **Group**: free text (chapter, category...) with suggestions of the groups already in use. Used to group the lists.
- **Deadline**: optional date edited with the pencil under the group, in the world calendar or the real date depending on
  the setting _Quest Dates_.
- **Creator**: the GM sees who created every quest.
- **Duplicate** a quest from its menu: it keeps the details and gets new IDs (subquests are not copied; counters,
  characters, history and closed rewards start from scratch).

### Accepting quests

With the setting _Players can accept Quests_, a player moves an available quest to In Progress. The quest registers the
**character** assigned to the player (or only the player when there is none); while it is in progress the other players
get a button to **join it with their character**. The characters that accepted the quest are shown in the Details tab, in
the Quest Log list and can be searched.

### Rumors

Rumors are loose texts about a quest that the characters can hear.

- The **Rumors** tab of a quest _(editors)_ lets you add, edit and delete rumors, mark each as **heard** (struck through)
  and show or hide it to the players. Rumors can be **optional** (star entry) and do not count to unlock.
- When enough required rumors are heard (all of them, or the number set in "rumors needed") an **inactive quest becomes
  available** and the connected players get a notification.
- The **Rumors** tab of the Quest Log lists the visible rumors to the players. The GM sees all the rumors, can mark one as
  heard by clicking its ear icon and has a search box (text or quest name).

### Repeatable quests

- Tick **Repeatable quest** in **Manage Quest** _(GM)_. A repeatable quest in progress, completed or failed has **Reset the
  quest to repeat it** in its menu: it asks for confirmation, clears the objectives and counters, restores and reopens
  the rewards that were taken (with their original locked state) and makes the quest available again, also resetting its
  subquests. The history records every reset and the times completed.
- Objectives can be repeatable on their own (see [Objectives](#objectives)).

### Personal quests

A personal quest is only seen by the players it belongs to and by the GMs. It is based on the Foundry permissions of the
quest, so "Configure Permissions" works as usual.

- In **Manage Quest** the GM can **Make personal** (choose one or more players; its subquests too), **Change players** or
  **Make public**.
- When a player adds a quest, a dialog asks if it is personal.
- Everybody who sees a personal quest sees its "Personal" label; only the GM sees the names of the players.

### Who can do what

| Who                    | Can                                                                                                    |
|------------------------|--------------------------------------------------------------------------------------------------------|
| **GM**                 | Everything.                                                                                            |
| **Player owner**       | Write player notes and accept quests (if the setting allows it); take the rewards they are allowed to take. |
| **Player editor**      | Edit quests created by the player; quests created by the GM only if the GM ticks **Allow players to edit** in Manage Quest. |
| **Trusted player**     | With the setting _Allow Trusted Player Quest Editing_, expanded editing and status control over the quests they own, and sees the Inactive tab. |

Other related settings: _Players can create Quests_, _Default quest permission level_ and _Hide Quest Log from players_.

### Quest history

Each quest keeps an activity log (the newest 200 entries, with date and user) in its **History** tab: who created it,
every change of status (accepting included), objectives completed, failed or reset, counter changes, rewards taken (with
the amount and the actor) and resets. The setting _Quest History Visibility_ chooses between only the GM
(default) and everybody who sees the quest; players never see entries about hidden objectives or the hidden status. The GM
can **Clear** the history. The setting _Quest Dates_ shows the real date, and the world calendar date next to it when set
to "world".

### Quest Tracker

A small floating window with the quests in progress (opened with the scene controls or `CTRL+ALT+Q`).

- Each quest is a card with its objectives (collapsible with the chevron), subquests, counters and the P / C / F labels.
  Click the title to fold it, double click to open the quest; the GM and editors toggle objectives and use the counters.
- It opens even with no quests ("No quests available.").
- **Per user**: remove a quest from your own tracker (button on hover) and show the removed ones again (dimmed, with a
  restore button); this is also the "Show in my Quest Tracker" option of the quest window.
- The **3 dots menu** of its header has: share with the players _(GM)_, primary quest only, **group by** (group / giver /
  location / none, cycling), show removed quests and background (opaque / transparent).
- Settings: _Quest Tracker enabled_ and _Quest Tracker Resizable_; it can be moved, pinned and resized, and the position
  is kept.

### Interface and quality of life

- Built for Foundry **v14** with `ApplicationV2`, without jQuery; the Quest Log and quest windows can be minimized with a
  double click on the title.
- The state of the interface (collapsed groups and objectives, grouping, removed quests, tracker options) is saved per
  user and per world in the browser and survives closing it.
- Hooks, public API and ready-made macros for automations: see [Automation](#automation).
- 15 languages (see [Translations](#translations)).

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
English and Spanish are kept up to date with each release. The other 13 languages have every string of the English file; the
strings added since the original module were translated with Claude and have not been reviewed by native speakers, so
corrections are welcome, see
[CONTRIBUTING](https://github.com/Gremlim/foundryvtt-quest-log/blob/master/CONTRIBUTING.md).

The following Translations are available:

| Language                           | Last updated version |
|------------------------------------|----------------------|
| Chinese (simplified / traditional) | v1.0                 |
| Dutch                              | v1.0                 |
| English                            | v1.0                 |
| Finnish                            | v1.0                 |
| French                             | v1.0                 |
| German                             | v1.0                 |
| Italian                            | v1.0                 |
| Japanese                           | v1.0                 |
| Korean                             | v1.0                 |
| Polish                             | v1.0                 |
| Portuguese (Brazil)                | v1.0                 |
| Russian                            | v1.0                 |
| Spanish                            | v1.0                 |
| Swedish                            | v1.0                 |

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
