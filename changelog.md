# Changelog

## Release 0.23.0
- Rumors: when a quest becomes available because enough rumors were heard, the players get a basic Foundry notification ("A new quest is available."; only when the quest is not hidden from them). Rumors can be marked as optional (star icon in their 3 dots menu, shown as "(optional)"): they don't count to unlock the quest. The Rumors tab of the quest has a new field with the number of rumors that must be heard to unlock the quest (0 = all the rumors that are not optional) and a counter of the heard rumors. An inactive quest becomes available as soon as that number of required rumors is heard.

## Release 0.22.1
- Objectives list: the space between the 3 dots menu and the sort arrows is now the same for subquests and normal objectives (the menu of a subquest had a minimum width that added extra space).
- Rumors tab of the Quest Log: the GM can mark a rumor as heard / not heard directly in the list by clicking its ear icon (an inactive quest becomes available, as in the quest's Rumors tab).

## Release 0.22.0
- #82 Rumors, redesigned. The "Rumor" quest status of 0.21.0 is removed. Now every quest has a new "Rumors" tab (for those who can edit the quest) where rumors can be added as text, edited and deleted. Each rumor can be marked as heard (completed: struck through and muted) or not heard, and can be shown or hidden to the players. When a rumor is marked as heard and the quest is inactive, the quest becomes available. The Quest Log has a new "Rumors" tab that is always shown: players see the visible rumors of all the quests mixed together (without saying which quest they belong to; heard rumors struck through) or "There are no rumors."; the GM sees all of them, with the hidden ones flagged and the quest name. Because quests hidden from the players are not sent to them, the GM client keeps the visible rumors in a new world setting (`rumors`) that is updated automatically.

## Release 0.21.1
- Objectives and subquests: removed the divider lines to the left of the buttons and unified the spacing, so subquests and normal objectives look the same ([3 dots menu] [sort arrows], same as the rewards).

## Release 0.21.0
- #82 Rumors. New quest status "Rumor" with its own tab in the Quest Log (the first tab), for quests that the characters have only heard about. The GM can set any quest as a rumor with a new entry in the 3 dots menu (the speech bubble icon, "Set as Rumor"), and a rumor can be turned into a normal quest with the usual entries of the menu: "Set as Available", "Set as In Progress" or "Set as Inactive". Rumors work like any other quest (details, objectives, rewards, notes, history, groups, search, hidden quests, personal quests), players can see and open the rumors that are not hidden but can't change their status, and the tab is only shown to players when there is at least one rumor they can see (it is always shown to the GM). Rumors are not shown in the Quest Tracker, which only shows the quests in progress.

## Release 0.20.2
- 3 dots menu: the entries of the dropdown menus are aligned to the left (the icons in a column followed by the text), instead of centered.

## Release 0.20.1
- 3 dots menu: the menu is now placed before the sort handle (arrows) in the objectives, the subquests and the rewards, with the same order and spacing in all of them. The rewards no longer have the divider lines around the buttons. The menu is always shown, even when there is only one action available (for example a player accepting a quest), so the look of the lists is the same.

## Release 0.20.0
- The action icons of the quests, objectives and rewards are now grouped in a 3 dots menu (a dropdown) instead of being shown in a row: the status buttons (complete, fail, set inactive, available, accept / join, delete) in the Quest Log list, in the Details tab and in the subquest lists of the Manage tab, the objective buttons (optional, visible / hidden, edit, delete) and the reward buttons for the GM (choice group, visible / hidden, lock, edit / quantity, delete). The entries show the same icon and text as the original buttons, so the state (visible / hidden, locked / unlocked, optional / required) is still shown, the delete entries are in red, and the menu closes with `Esc`, clicking outside or choosing an entry. The sort handles, the take buttons of the rewards, the lock indicator of the players and the single edit pencils are unchanged, and when there is only one action available (for example a player accepting a quest) the icon is shown directly.

## Release 0.19.2
- #56 Entity links in the objectives. A document (actor, item, journal entry or page, scene, roll table, macro, compendium entry, etc.) can be dragged from the sidebar, a compendium or a sheet onto the objectives of the Details tab: dropped on an objective that is being edited it is inserted as a link at the cursor, dropped on any other objective it is appended to the name of the objective, and dropped on the empty area of the objectives list it creates a new objective with the link. This also works when the edit field of the objective has already closed because the drag was started outside of the window. The maximum length of an objective being edited has been raised (96 to 512) to fit the links.

## Release 0.19.1
- #18 Search box in the Quest Log. Each tab has a search box in its header (the text is shared by all the tabs and kept while the window is open) that filters the quests while typing, ignoring case and accents. It searches the name, quest giver, location, group, labels and accepted characters of the quests, and every word must match. The group headers without matches are hidden, the group counters show the number of matches, and the quests inside collapsed groups are included in the search.

## Release 0.19.0
- The buttons of the Quest Tracker window header (share with players for the GM, primary quest only, group by, show removed quests and background) have been moved to the 3-dots menu of the window, leaving the header clean. The state of each option is shown in the entry itself (icon and text: primary quest only Yes/No, group by None/Group/Giver/Location, show removed Yes/No, background Opaque/Transparent).

## Release 0.18.2
- #87 Dates and deadline. New setting "Quest Dates" (world calendar by default, or real date): the history of the quest now shows the date of the world calendar of Foundry (the real date is still stored, and entries created before this version show the real date). New optional "Deadline" of the quest: it is edited with the pencil under the group in the Details tab (a dialog with the fields of the world calendar, or a real date and time when the setting is set to real date), it can be removed, and it is shown in the Details tab, in the Quest Log list and in the Quest Tracker. When the deadline has passed and the quest is available or in progress it is shown in red.
- Duplicating a quest keeps the deadline.

## Release 0.18.1
- #138 Accepting a quest with a character. When a player accepts a quest (sets it in progress) the quest registers the character assigned to the player (or only the player when there is no character). While the quest is in progress, the other players have a new button (accept with your character) to join it, so each character can register. The characters that accepted the quest are shown in the Details tab and in the Quest Log list (the GM also sees the player in the tooltip) and are logged in the history ("accepted the quest with ..." / "joined the quest with ..."); the GM gets a notification when a player joins. The list is cleared when the quest goes back to available or inactive, and joining does not change the start date of the quest.
- Duplicating a quest starts with an empty list of characters.

## Release 0.18.0
- #92 Choice between rewards. Each reward has a new icon (for the GM) to set a "choice group". Rewards of the same group are alternatives: only one of them can be taken. When a player (or the GM) takes one of them, by dragging it to a sheet or with the take buttons, the other rewards of the group are closed (dimmed, with a lock icon and a tooltip explaining why) and players can't take them. Taking part of a reward does not reopen the others. The GM can reopen a closed reward with its lock icon. The group name is shown as a small label before the reward name, so players know which rewards are alternatives.
- Rewards of different groups and rewards without a group work independently as before.
- Duplicating a quest reopens its closed rewards.

## Release 0.17.2
- Redesigned the look of the Player Notes, GM Notes and History tabs of the Quest Details window. The three tabs share the same heading as the other tabs (accent underline and same height), the notes editors are cards with a bit more padding and a slightly larger text, and the description editor of the Details tab matches the new heading height.

## Release 0.17.1
- Redesigned the look of the Quest Details window (Details and Manage Quest tabs), in the same style as the Quest Tracker and the Quest Log.
- Description, objectives, rewards, history entries and subquests are now cards with a line at the left, a hover highlight and colors that adapt to the text color, so they are readable on dark and light windows (before they were light gray boxes with low contrast).
- The icons of the action buttons (status, sort, edit, hide...) now use the text color instead of black, so they can be seen on dark windows, and the separator lines are visible too.
- The quest status, personal, creator and parent quest are shown as small labels in the header instead of being separated by pipes; location and group lines are more compact.
- The Description heading has the same underline and height as Objectives and Rewards, so both columns are aligned.
- Manage Quest: Quest Settings and Splash Art share the same heading with underline, the buttons wrap in a row, the "Show in my Quest Tracker" and "Allow players to edit" options are cards, the "Set as quest icon" checkbox sits aligned to the right of its heading and the subquest list uses the new card style.

## Release 0.17.0
- Redesigned the look of the Quest Log list, in the same style as the Quest Tracker. Each quest is a card with an accent line at the left (in the accent color for the primary quest) and a hover highlight.
- The image slot is always reserved (with a placeholder icon when the quest has no image) so the titles of all the quests are aligned.
- The subquest, personal, location and creator labels are now shown in one wrapping line under the title, each with its icon, instead of one line each, so the quests take less height.
- The hidden and primary icons are grouped before the objectives counter with a reserved width, so the counters and the status buttons are aligned in all the quests.
- The group headers are uppercase with an accent underline and the quest count in a small badge.

## Release 0.16.3
- Quest Tracker: the group button of the header now cycles through the ways to group the quests every time it is clicked: by group, by giver, by location and not grouped, and starts again. Its tooltip shows the current grouping. Collapsed groups are remembered separately for each way of grouping.

## Release 0.16.2
- Quest Tracker: a new header button groups the quests by their group (alphabetically, with the quests without group at the end). Each group has a header with the quest count that can be collapsed with a click; it is stored per user in the browser session. Grouping is off by default. (Forien #154, #60, #66, #14)

## Release 0.16.1
- Quest Log: each status tab (Available, In Progress, Completed, Failed, Inactive) has a new selector in its header to group its quests by group, by giver or by location, or to not group them (the default). The groups are listed alphabetically with the quest count, can be collapsed with a click, and the quests without a value are listed last. The choice and the collapsed groups are stored per user in the browser session and do not affect other users. (Forien #154, #60, #66, #14, #17, #119)

## Release 0.16.0
- Quests have a new optional Group (folder, category, chapter...) that is edited with the pencil below the location in the quest window, suggesting the groups already in use. Duplicated quests keep their group. It will be used to group the quests in the Quest Log and the Quest Tracker. (Forien #154, #60, #66, #14)
- Cleanup: the quest location field was declared twice in the quest data; it is now declared once.

## Release 0.15.3
- The Management tab of the quest window has a new "Show in my Quest Tracker" checkbox to hide or show that quest in your own Quest Tracker (the same state as the new remove button of the tracker, so a removed quest can always be put back from its quest window). It does not affect other users.

## Release 0.15.2
- Quest Tracker: each quest has a new button (visible when hovering it) to remove it from your own tracker, and a new header button to also show the quests you removed (dimmed, with a button to restore them). It only affects your tracker; the quest and the other users are not changed. (Forien #121)

## Release 0.15.1
- Quests now have an optional Location (free text, for example a city or region). It is edited with the pencil below the quest giver name in the quest window (GM or players who can edit the quest) and it is shown in the quest window and in the Quest Log list. Duplicated quests keep their location. (Forien #100)

## Release 0.15.0
- Objectives can now be marked as optional (bonus) with a star button in the quest window (GM or players who can edit the quest). Optional objectives show an "(optional)" label in the quest window and in the Quest Tracker, and they are not counted in the completed / total objectives of the quest. (Forien #102)

## Release 0.14.0
- Redesigned the look of the Quest Tracker. Each quest is now a card (a slightly darker block with an accent line at the left; with the window background removed only the line remains) so quests are easy to tell apart, and the primary quest has its line in the accent color.
- All the quest titles are aligned: a quest without objectives reserves the space of the chevron, and the objectives and subquests are aligned with the title text instead of being indented differently.
- The primary, hidden and personal icons are grouped at the end of the row with equal spacing, in quests and in subquests, instead of relying on the last icon of the row.
- Long titles and objectives wrap next to their P / C / F label with a hanging indent instead of overflowing, and the title and objective font sizes and spacing are tighter so more quests fit.
- Removed the unused subquest separator.

## Release 0.13.1
- The hidden and personal icons of the quest window tab bar are now aligned with the primary quest star instead of sitting higher.

## Release 0.13.0
- Personal quests. A personal quest is only seen by the players it belongs to and by the GMs. It is based on the permissions of the quest (default permission none, and one or more players with access), so it works with the existing "Configure Permissions".
- Everyone that can see a personal quest now sees a "Personal" label in the quest list and in the quest window, and the personal icon in the Quest Tracker (before only the GM saw the icon). The names of the players are only shown to the GM, in the tooltip of the icon.
- When a player adds a quest a dialog asks if it is personal; a personal quest is only visible to that player and the GM.
- The Manage Quest tab has new GM buttons: "Make personal" (choose one or more players; the quest and its subquests become visible only to them and the GMs), "Change players" and "Make public" (restores the default permission of the module settings for everyone; the permissions of the players are kept).
- A subquest added inside a personal quest is personal for the same players.
- Added the English and Spanish text for personal quests.

## Release 0.12.0
- Each quest now stores who created it (the GM or a player). Only GMs see this: a "Created by the GM" / "Created by <player>" label appears in the quest list of the Quest Log and in the status line of the quest window. Quests that already existed count as created by the GM.
- Players that own a quest created by a GM can no longer edit it (description, objectives, rewards, status, objective checkboxes) unless the GM enables the new "Allow players to edit" checkbox in the Manage Quest tab of that quest. They can still write their player notes and accept the quest when the setting allows it. Quests created by a player keep working as before. The checkbox only appears for quests created by a GM.
- A duplicated quest keeps the creator of the original.
- Added the English and Spanish text for the label and the checkbox.

## Release 0.11.1
- Fixed the "Clear" button of the quest history, which raised an error (`allowed is not a function`) and did nothing.

## Release 0.11.0
- Added the quest history. Each quest now keeps an activity log, shown in a new "History" tab of the quest window (newest entries first, with the date and the user). It records: who created the quest, every change of status (a player moving an available quest to in progress is logged as accepting it), who marks an objective as completed, failed or back to pending (from the quest window or from the Quest Tracker), and every reward taken (item or currency, the amount and the actor that received it, whether dragged or taken with the buttons).
- New module setting "Quest History Visibility": only GMs can see the History tab (default), or everyone that can see the quest. Players never see entries about hidden objectives or about the hidden status.
- The GM has a "Clear" button in the History tab to delete all the entries (with confirmation). A quest keeps its newest 200 entries; older ones are discarded. Existing quests start with an empty history, and a duplicated quest starts with its own history.
- Added the English and Spanish text for the history and the new setting.

## Release 0.10.5
- Subquests can now be intermixed with the objectives of a quest (#141). Each subquest listed in the objectives has a sort handle at the end of its row; drag it (or any objective) over another entry to move it to that position. The order is stored in the quest and is also used by the Quest Tracker, so subquests and objectives appear in the same order there (the old separator between subquests and objectives was removed). Quests that were never reordered keep the previous order (subquests first, then objectives), and new subquests / objectives are added at the end once an order exists.
- Duplicating a quest resets the order of its objectives.
- Added the English and Spanish text for the new "Drag to reorder" tooltip.

## Release 0.10.4
- Item rewards now have the same "Take all" and "Take an amount" buttons as currency rewards ("Take an amount" only when there is more than one unit), so an item can be given to an actor without dragging it. The item goes to the assigned character of a player or to the actor of the single selected token for a GM, and the quest and the GM chat message are updated as when dragging. A reward with a single unit keeps the quantity of the original item.
- A small space now separates the take buttons from the rest of the reward buttons.
- The warnings for a missing character / token now refer to the reward instead of the currency.

## Release 0.10.3
- Added currency rewards. In a game system with supported currencies (currently dnd5e: platinum, gold, electrum, silver and copper, read from the system configuration) the GM gets a new "Currency" button next to "Custom" in the rewards. It asks for the currency and the amount, and adding more of a currency already in the quest increases its amount. The amount can be edited with the `#` button.
- Currency rewards show their amount and have "Take all" and "Take an amount" buttons (the second only when there is more than one unit). The currency is added to the assigned character of a player, or to the actor of the single selected token for a GM. Players can take currency when they are allowed to drag rewards and the reward is unlocked. The amount taken is removed from the quest (the reward disappears when nothing remains) and the GMs get the usual reward chat message.
- Added the English and Spanish text for currencies.

## Release 0.10.2
- Reward drops now post a chat message, whispered only to the GMs, instead of a UI notification (which could stay invisible if Foundry's notification queue is stuck). The message says who took which item (and how many) from which quest and to which actor. It uses the existing "Show Reward Drop Messages" setting (formerly "Show Reward Drop Notifications"), and when several GMs are connected only one posts it.
- The chat message stores the transaction in its flags for a future activity log.
- Added the English and Spanish text for the message and updated the setting label and hint.

## Release 0.10.1
- Added quantities to item rewards. The GM can set the quantity with the new `#` button of an item reward; quantities greater than one are shown as "x N" next to the name.
- Dragging an item reward with more than one unit onto an actor sheet now asks how many to take; the actor receives that amount (the item quantity is set when the game system has one) and the remaining quantity stays in the quest. The reward is removed when nothing remains. Rewards with a single unit work as before.
- The reward drop notification for the GM includes the amount taken.
- Added the English and Spanish text for the new dialog and buttons.

## Release 0.10.0
- Added #159: quests can be duplicated from the Quest Log by right clicking a quest and choosing "Duplicate quest" (GM only). The copy keeps the details, status, objectives, rewards and permissions of the original with a new name ("... (Copy)"), and new objective / reward IDs. Subquests are not copied; if the original is a subquest the copy is added to the same parent quest.
- #68 (indent subquests and collapse their quest) is covered by the Quest Tracker changes of 0.9.13 - 0.9.18, where subquests are listed under their parent quest with their own icon and quests can be shown / hidden.
- Added the English and Spanish text for the new menu option and notification.

## Release 0.9.18
- Quest Tracker: a subquest listed inside its parent quest is no longer expandable (it is still shown as a quest of its own, with its objectives, in the tracker) and now has a subquest icon to tell it apart from the objectives of the parent quest.
- Quest Tracker: the P / C / F label is no longer struck through; only the objective text is.
- Added the English and Spanish tooltip for the subquest icon.

## Release 0.9.17
- Quest Tracker: subquests now show their own objectives (and their own subquests) and can be shown / hidden with a chevron button next to the subquest, just like quests. Objectives of a subquest can be toggled by the GM / owners as before, and nested content is indented.

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
