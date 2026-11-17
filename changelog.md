# Changelog

## Release 0.9.16
- Quest Tracker: the objective status is now shown as a small label instead of `[ ]` / `[+]` / `[-]`: a white `P` (pending), a green `C` (completed) and a red `F` (failed), each with a tooltip ("Pending" / "Completed" / "Failed"). Completed and failed objectives keep the strike through. Subquests use the same labels.
- Added the English and Spanish tooltips for the labels.

## Release 0.9.15
- Quest Tracker: the window now opens even when there are no in progress quests (previously it did not open, which left players without visible quests with a button that did nothing). It shows "No quests available." instead.
- Quest Tracker: objectives no longer depend on an icon font for their marker (it displayed as an empty box). They now show `[ ]` when pending, `[+]` when completed and `[-]` when failed, in addition to the strike through; completed objectives are green and failed ones red.
- Added the English and Spanish text for the empty tracker message.

## Release 0.9.14
- Quest Tracker: the Quest Tracker button in the scene controls now always responds. When the tracker setting was already enabled (for example for a player with no visible in progress quests) the click did nothing because setting the same value does not trigger a refresh; it now renders the tracker or posts the "no in progress quests" notification.

## Release 0.9.13
- Quest Tracker: a chevron button is now shown next to the title of quests that have objectives, so it is clear that the objectives can be shown / hidden. It points right when the objectives are hidden and down when they are shown, with a tooltip, and toggles immediately when clicked (the title keeps single click to toggle and double click to open the quest).
- Added the English and Spanish tooltips for the new button.

## Release 0.9.12
- Fixed the Quest Tracker window growing taller while dragging it by the title: the height is now calculated from the natural height of its content instead of the stretched window content.

## Release 0.9.11
- Fixed the Quest Tracker failing to position itself when opened (`Cannot add property resizeWidth, object is not extensible`): the resize state is no longer stored in the position object, which is not extensible in Foundry v14. This left the tracker stuck in the top left corner without being able to move it.
- A hidden hotbar (zero size) no longer limits the Quest Tracker position to the top of the screen.
- The pinned position of the Quest Tracker can no longer end up with a negative position.

## Release 0.9.10
- Removed the remaining jQuery usage (technical debt). All event handling now uses native DOM events: delegated listeners (`Utils.on`), `data-*` reading (`Utils.data`) and a native single / double click helper (`Utils.createDblClick`), replacing `Utils.createJQueryDblClick`.
- Inline editing fields (quest name, quest giver name, objectives, rewards) are created with the DOM API; this also fixes names containing quotes being cut when editing.
- The Esc key now cancels inline editing with the standard `event.key` instead of the deprecated `event.which`.
- Renamed the internal `jquery` event name constants to `domEvents`.

## Release 0.9.9
- Fixed the quest text not adapting to the window size when resizing it (#151): removed the fixed maximum widths of the objective, reward and quest name texts.
- The macro compendiums (FQL Macros GM / Player) now use the `quest-log` module id (settings keys and icon paths); they still pointed to `forien-quest-log`.
- Quest tab "In Progress" capitalization (#64) was already correct; no change needed.

## Release 0.9.8
- Fixed reward items not being draggable to character sheets: the drag data was set after an `await`, when the browser has already locked the DataTransfer. It is now set synchronously.
- Restored the visible dashed borders of all drag & drop zones in the quest edit window (quest giver, rewards, splash art); the border now follows the text color so it is visible on dark and light windows.
- Quest Log and Quest windows can be minimized again by double clicking the title: the minimum size no longer applies while minimized.

## Release 0.9.7
- Quest Log and Quest windows: the tabs are now a horizontal bar at the top of the window, right under the window header, using the window background. The active tab is highlighted with an accent underline.
- Removed the bookmark tab style and its settings (`navStyle`, `dynamicBookmarkBackground`).
- Fixed the window title not showing ("Quest Log" / "Quest Details - name") and the header buttons being pushed to the left: the `h1` content style was also applied to the window title.
- Removed the "show to players" header button; the action remains in the Quest Log window menu (three dots).

## Release 0.9.6
- Fixed untranslated labels (`ForienQuestLog.QuestPreview.Labels.ShowSplash` / `CopyLink`) in the quest window menu; they now reuse existing translated strings.
- "Show to players" is available both as a header button and in the Quest Log window menu (three dots).

## Release 0.9.5
- Fixed the Quest Log bookmark tabs being transparent: the dynamic bookmark background copied the (transparent) window content style; it now reads the window frame and falls back to the parchment image with an opaque color and dark text.

## Release 0.9.4
- Fixed the "Show to players" button missing from the Quest Log header (it was in the window's controls menu); it is a header button again (GM only).
- Fixed the Quest Log bookmark tabs (Available / In Progress / Completed / Failed / Inactive) not being visible: the ApplicationV2 frame clipped them, and the frame also matched the inner `.quest-log` layout class.

## Release 0.9.3
- Can now run side by side with the original Forien's Quest Log (`forien-quest-log`) with fully separate data:
  - The quest journal folder is now `_ql_quests` and is only found by its flag, never by name, so it no longer picks up the original module's `_fql_quests` folder.
  - Journal button, scene control tools, window ids, CSS classes / keyframes and session storage keys are now unique to this module. When both modules are enabled the journal button is labelled with this module's title.
  - The shared hooks (`ForienQuestLog.Open.*`, `ForienQuestLog.Lifecycle.ready`) and default keybindings are not registered while the original module is enabled, so macros and shortcuts only open the original.
- Fixed the Quest Log window styles not applying after the module id change (the stylesheet still targeted the old `#forien-quest-log` id).

## Release 0.9.2
- The quest folder is now identified by a flag, so renaming `_fql_quests` no longer breaks "Add Quest" (#156). Failing to create a quest now shows an error instead of failing silently.
- Quest images are centered instead of anchored to the top-left, which cropped the right/bottom edges (#155).
- Text inputs have an explicit dark text color, so they stay readable with dark themes (#79).
- The Quest Tracker is now a standard ApplicationV2 window (core drag / close / resize), which should resolve it being stuck or jumping to the center with other modules installed (#152, #153); needs in-world confirmation.

## Release 0.9.1
- Compatibility with Foundry v14 (verified on 14.370); minimum remains v13.
  - `module.json`: compatibility `maximum` raised to 14 (v14 refuses to load packages above their declared maximum).
  - Macro compendium pack paths now point to the LevelDB folders (`packs/macro-gm`, `packs/macro-player`).
  - Replaced bare globals deprecated in v13 (`FilePicker`, `Application.RENDER_STATES`) with their `foundry.*` namespaces.
  - Removed the `async` option from `TextEditor.enrichHTML` calls (always async).
  - Removed the `engine="prosemirror"` parameter from the `{{editor}}` helper (TinyMCE was removed in v14).
  - Fixed the Journal Directory hook throwing when the footer / quest folder element was missing, and made the
    "hide quest folder" journal sheet hook work with the ApplicationV2 `JournalEntrySheet`.
- Migrated every window to ApplicationV2 (ApplicationV1 is deprecated and slated for removal):
  - Quest Log, Quest Tracker and Quest Preview now use `ApplicationV2` + `HandlebarsApplicationMixin` (tabs, header
    controls and actions use the V2 APIs). The Quest Preview is no longer a `FormApplication`.
  - Rich text fields use the core `<prose-mirror>` element instead of the `{{editor}}` helper.
  - Confirmation dialogs use `DialogV2`; the ownership configuration uses `DocumentOwnershipConfig` (V2).
  - Context menus use the v14 `ContextMenu` API (`label` / `onClick`, no jQuery).
  - `ImagePopout` and `FilePicker` are used through `foundry.applications.apps`.
  - SCSS: `@import` replaced by `@use`; selectors updated for V2 (`.application`, `.window-resize-handle`,
    `prose-mirror`).
  - API note: `Utils.showSheetFromUUID` now resolves with the opened sheet instead of an `appId`.

## Release 0.9.0
- Compatibility with Foundry v13
  - This does not include migration to ApplicationV2 as that will take longer and 
    I wanted to release v13 update as soon as possible
- "Jump To Pin" Context Menu option. ([#142](https://github.com/Forien/foundryvtt-forien-quest-log/issues/142))
- Added Keybindings
  - `openQuestLog` (default: `CTRL+Q`) — Opens Quest Log ([#140](https://github.com/Forien/foundryvtt-forien-quest-log/issues/140))
  - `openPrimaryQuest` (default: `CTRL+SHIFT+Q`) — Opens Primary Quest (if any)
  - `toggleQuestTracker` (default: `CTRL+ALT+Q`) — Toggles the Quest Tracker
- Added `openPrimary` API method, which opens the Quest Preview / Quest Sheet for the current Primary Quest
- Refactored Quest Tracker's position handling to respect 4-directional boundaries
- Added `updateQuestTrackerState` Hook with single param (`boundaries` object) that can be used by Module 
  and System developers to modify the Quest Tracker's Boundaries and respect any custom UI.
      
## Release 0.8.1
The minor `0.8.1` update brings to FQL:
- Improvements to Chinese Localization ([#137](https://github.com/Forien/foundryvtt-forien-quest-log/pull/137)) by AlphaStarguide/Kuroni
- [DND5e] Fix to [#135](https://github.com/Forien/foundryvtt-forien-quest-log/issues/135) – not being able to Award from an Encounter set as a Reward

## Release 0.8.0
This major `0.8.0` update brings to FQL:
- Actors can be set as quest rewards (Item Piles / game system loot support).
- Player Notes - players can now leave notes on quests in a separate section similar to `GM Notes`
- ProseMirror editor support / removed TinyMCE.
- Streamlined codebase updating to ES2022.
- Dual v11 / v12 support.
- This is the last release by Michael Leahy (TyphonJS) before FQL returned to Forien.

## Release 0.7.12
The minor `0.7.12` update brings to FQL:

- Foundry v11 support.
- Removed support for v9 / v10 to prevent any compatibility warnings.
- Fixed minor TinyMCE configuration for correct font support.
- Updated Spanish translation.

## Release 0.7.11
The minor `0.7.11` update brings to FQL:

- Corrects a new compatibility warning that came up w/ the 10.285 Foundry release.
- Provides workarounds for various misbehaving game systems (Gurps / L5R).
- Refines the "show quest log to players" feature showing the players the specific quest status tab the GM currently
  has selected.
- Adds a Dutch language translation.

## Release 0.7.10
This is a major release that brings dual compatibility on Foundry `v9` & `v10`. 

Several quality of life improvements including:

- Quest document linking is enabled again.
- Show quest log to players link in quest log app header (for GM).
- Show quest tracker to players with icon in quest tracker header (for GM).
- Ability to set quest tracker to transparent via fill icon in app header.
- Expanded language / translation support. 

[Weblate setup](https://weblate.foundryvtt-hub.com/engage/forien-quest-log/) for language / translation community 
updates.

## Release 0.7.9
- Disable synthetic quest type registration for Foundry `v9+`. As it turns out `CONST` was locked down last
minute in the v9 release cycle. The feature affected is "document linking" for quests. There is a replacement module / 
continuing the quest log that will enable this functionality again with a different implementation. You can join the 
TyphonJS Discord server to get an announcement when the new module is available: https://discord.gg/mnbgN8f

## Release 0.7.8
- A few fixes for external module conflicts.

## Release 0.7.7
This release is a major quality of life update.

- Quest Tracker overhaul 
  - Removed floating quest log.
  - Quest tracker is now dockable / resizable.
  - UI management 

- Macro Compendiums
  - GM & Player macro compendiums.
  - Most common macros to control FQL are pre-made and ready to drop in hotbar.

- TinyMCE Corrections
  - Default font in editor is the same when viewing quest.
  - New smaller font sizes.
  - Correct implementation for line spacing.

- Theming 
  - Support for Whetstone.
  - Support for Lib Themer (beta) / not officially released yet.

## Release 0.7.6
This release is a major quality of life update. There is deeper integration with Foundry allowing quests to be made into Notes on the canvas and many enhancements to the TinyMCE content editing capabilities.

- FQL journal entry opens quest details.
- Drag FQL journal entry or quest from quest log to canvas as a Note.
- Quest tracker / floating log can interact w/ objectives.
- Content entity linking in objectives / abstract rewards
- TinyMCE
   - New fonts
   - oEmbed plugin
      - style border
      - style drop shadow
   - Styles
      - Blend mode
      - Border
      - Filters
         - Blur
         - Drop Shadow
         - Grayscale
      - Float
      - Fonts
         - Neon
         - Line height
      - Margin
      - Opacity
   - Source Code Editing
   - CSS selector
      - background gradient
      - background before / after
     
## Release 0.7.5
Small quality of life update.

Fix for Issue #98.
Esc key now cancels all single line input editing.
For all single line input fields cursor is set to end of input.
The default module setting for countHidden is now false instead of true.
Updated French translation / language file.

## Release 0.7.4
Brings substantial finishing aspects to FQL

Improved user experience
Trusted Player Edit
New quest creation workflow
In-memory QuestDB
and much more!

## Release 0.7.0-0.7.3
Total rewrite that fixes most known bugs, courtesy of @typhonrt.
Existing quests will be migrated, except that quest rewards will be removed and need to re-added manually.
Remember to back up your world before installing.

This is the first release from Michael Leahy (TyphonJS).

## Release 0.6.0
* Set compatible with Foundry 0.8.6 (and removes compatibility with lower versions)
* Left sidebar buttons moved from it's own menu (the pen icon) to buttons under the Notes menu (the bookmark icon)

## Release 0.5.8
* Set compatible with Foundry 0.7.10
* Updated Chinese localization courtesy of FuyuEnnju
* Localization fix courtesy of FuyuEnnju

## Release 0.5.7
* Buttons to delete and change vertical alignment of quest giver and splash image added courtesy of @Dilomos

## Release 0.5.6
* Added the QuestTracker from the 'party-unit-frames' project courtesy of @p4535992
* Added support for Bug Reporter
* Hopefully fixed the broken release flow...

## Release 0.5.5
* Failed release, withdrawn

## Release 0.5.4
* A floating quest window, by Rughalt
* Translation to zh-tw, by zeteticl
* Set compatible Foundry version to 0.7.9 (as that is what I tested the above with)

## Release v0.5.3
* [BUG] Quest not loading when user removed from world (@xdy)
* Add Svenska (Swedish) translation (@xdy)
* Updated release to point to the League fork instead of the death-save one (@eclarke12)

## v0.5.2
* [BUG] Quest Preview not saving
* [BUG] Can't close new Quest Window
* Provide compatibility with Foundry VTT 0.7.7

## v0.5.1
* [BUG] "_fql_quests" folder not being created on fresh installs

## v0.5.0
* Quest Log UI Overhaul, big thanks to sdenec for designing new UI and for help implementing it!
* Quests can now have Quest Source that consists of custom image and name, without relying on any existing Entity
* Quest are now sortable in Quest Log
* Rewards and Tasks are now sortable in Quest Details
* You can now click on Item Rewards and preview item sheet.
* Removed old Welcome Screen
* Added prompt to install new Workshop's Welcome Screen
* Tested and bumped compatible core version to 0.7.1
* [BUG] Subquest inherits description and gm notes from parent
* [BUG] Error when invalid quest or non-quest journal entry is present in `_fql_quests` folder

### v0.4.4
* Added compatibility changes to work with D&D5E Dark Mode module by Stryxin
* Added Brazilian Portuguese translation thanks to Discord member Innocenti
* Updated French translation with help of original contributor (Naoki)

### v0.4.3
* Fixed error showing up and rejecting submitting Quest Form if Quest Giver is invalid string
* Fixed Quest Details to properly refresh parent when created subquest
* Fixed Quest Details to properly refresh parent when deleted subquest
* Updated translations with help of original contributors

### v0.4.2
* Fixed Players list overflowing on Managenemt tab for those crazy people with more than 12 players

### v0.4.1
* Fixed Players list overflowing on Managenemt tab for those crazy people with 8 or more players
* Fixed hidden subquests showing empty row to players
* Fixed deleting subquests not being removed from parents
* Fixed updating subquests not refreshing Parent's details

## v0.4.0
* Added Quest Branching in form of ability to create SubQuests
* Added support for Item and JournalEntry as quest giver entities.
    * localization string `ForienQuestLog.QuestForm.DragDropActor` needs updating for all languages
    * localization string `ForienQuestLog.QuestForm.QuestGiverPlaceholder` needs updating for all languages
    * localization string `ForienQuestLog.Quests` needs updating for all languages
* Added optional Setting to allow Players to create quests
    * Player also needs "Create Journal Entry" permission
* Added Splash Art / Featured Image for Quests
* Added optional Setting to allow Players to accept quests
* Added Quest Setting to allow Players to edit that quest
* Added "Copy Link" button on Quest Preview window
* Added Configuration setting to decide if hidden tasks should be counted
* Added Chinese translation provided by Discord member Ztt1996
* Added status edit buttons to Quest Details window
* Added Quest Status to Quest Details window
* Allowed to drag&drop Quests from Quest Log to create rich-text entity links
* Allowed for multiple Quest Detail windows to be displayed at once
* Migrated from quest folders to quest statuses. 
* Fixed linking Quests in Quest tasks causing stack overflow
* Fixed Secret disappearing from Description
* Fixed additional Macros being created for opening the Quests while dragging quest to Hotbar

## v0.3.X

### v0.3.4
* Added Spanish translation provided by GitHub member JJBocanegra

### v0.3.3
* Fixed editable inputs cutting off text after double quotation character
* Added popup when attempting to close the Quest Form window without submitting.
* Added option to link quests in rich text environments with `@Quest[id]` and `@Quest[quest name]`. Hacky way, might be unstable. 
* Added Configuration setting that allows GM turn off displaying Welcome Screen to players. Enabled by default
* Added "Help" button in Quest Log's header that allows to open Welcome Screen at any time. 

### v0.3.2
* Added French translation provided by Discord members rectulo and Naoki
* Abstract Rewards now are a little transparent (0.9 opacity) and their text is in italic

### v0.3.1
* Added Korean translation provided by Discord member KLO
* Show GM information if players can't see shared quest

## v0.3.0
* Added „Personal Quests”, a feature that allows GM to show any Quest to only specific player(s).
* Added Entity linking to Tasks (for example `@Actor[Vash]` or `@Item[Cursed Sword]`).
    * Fixed Entity linking in Description for players.
* Added „Available Tab” as an optional setting. Redone actions so they make more sense in their context.
* Added option allowing GM to hide any Task and Reward from players.
* Added "Abstract" type Rewards, which are not "Item" entities, are not draggable, but can have any name and image applied to them. 
* Added optional Settings option that when checked, allows Players to drag Rewards onto their Actor sheets. (disabled by default)
* Added "Show Players" button for Quest Details, that will force open Quests Details for all players that have permission to see it.
* Hidden journal folder for quest data even for GM. Can be turned on back in settings.
* Changed some module settings to be client-side (centering titles, way of rendering bookmarks).
* Styling adjustments, including:
    * Fixed floating checkmarks for tasks when tasks overflow box. 
    * Added visible indication of each Task to help players distinguish separate tasks.
    * Changed the way Quest Log is scrolling with many quests.
    * Added scrolling to Tasks and Rewards, because people are crazy.
* Created API at `game.quests` for use in Macros and Modules.
* Using API, allowed to drag&drop Quests from Quest Log onto Hotbar to create an "Open Quest" macro. 
* Provided code comment blocks for most Functions. Not yet a Documentation, but could help those who peek at my module to learn. 


## v0.2.X

### v0.2.4
* Added German translation provided by Discord member Acd-Jake

### v0.2.3
* Added Japanese translation provided by Discord member Brother Sharp
* Added option to sort Quest Log
* Hidden "add new task" from players
* Added option to change rendering style of tabs
* Added module setting for centering titles in Quest Log
* Added Actor's name as a tooltip in Quest Log

### v0.2.2
* Allowed to change quest giver to existing quest by draggin new actor onto preview
* Widened and squished Tasks and Rewards boxes respectively to allow better space management
* Added word wrapping for tasks
* Fixed distorted Quest Giver's images
* Moved window initialization to 'ready' hook to fix translation

### v0.2.1
* Fully prepared module for translation - all strings should be translatable
* Added scroll for overflowing quest's description
* Added toggle between Actor's/Token's image for Quest Giver's image
* Added failed state for tasks
* Translated to Polish

## v0.2.0
* Initial release
