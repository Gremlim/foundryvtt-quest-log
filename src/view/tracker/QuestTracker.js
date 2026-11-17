import {
   FoundryUIManager,
   QuestDB,
   Socket,
   Utils }                 from '../../control/index.js';

import { HandlerTracker }  from './HandlerTracker.js';

import { FQLContextMenu }  from '../internal/index.js';

import { collect }         from '../../../external/index.js';

import {
   constants,
   domEvents,
   questStatus,
   sessionConstants,
   settings }              from '../../model/constants.js';

import * as contextOptions from "../internal/context-options.js";

const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;

/**
 * Provides the quest tracker app which is a framed ApplicationV2 that docks to the Foundry sidebar. The position is
 * constrained by {@link FoundryUIManager.checkPosition} in {@link QuestTracker._updatePosition} and the tracker may be
 * pinned to the top left of the sidebar.
 *
 * The icon buttons in the window header (share, primary quest, background) are added to the frame in
 * {@link QuestTracker._renderFrame} and are handled through the ApplicationV2 `actions` system.
 *
 * Control callbacks are setup once in {@link QuestTracker._onFirstRender} as delegated event listeners and are located
 * in a separate static control class {@link HandlerTracker}.
 */
export class QuestTracker extends HandlebarsApplicationMixin(ApplicationV2)
{
   /**
    * Default width of the tracker.
    *
    * @type {number}
    */
   static #DEFAULT_WIDTH = 296;

   /**
    * Default position of the tracker.
    *
    * @type {{top: number, width: number}}
    */
   static #DEFAULT_POSITION = { top: 80, width: QuestTracker.#DEFAULT_WIDTH };

   /**
    * Delay in ms before storing the position in the module settings.
    *
    * @type {number}
    */
   static #TIMEOUT_POSITION = 1000;

   /**
    * The z-index of the tracker. The tracker is never brought to the front of other windows.
    *
    * @type {number}
    */
   static #Z_INDEX = 99;

   /** @inheritDoc */
   static DEFAULT_OPTIONS = {
      id: 'ql-quest-tracker',
      classes: ['ql-app', 'ql-window-app'],
      position: { width: 300, height: 480 },
      window: {
         title: 'ForienQuestLog.QuestTracker.Title',
         icon: false,
         minimizable: false,
         resizable: true
      },
      actions: {
         shareTracker: QuestTracker.#onShareTracker,
         showBackground: QuestTracker.#onShowBackground,
         showGroups: QuestTracker.#onShowGroups,
         showHidden: QuestTracker.#onShowHidden,
         showPrimary: QuestTracker.#onShowPrimary
      }
   };

   /** @inheritDoc */
   static PARTS = {
      main: { template: 'modules/quest-log/templates/quest-tracker.html' }
   };

   /**
    * Stores the min / max extents of the app from the CSS.
    *
    * @type {{minWidth: number, maxWidth: number, minHeight: number, maxHeight: number}}
    */
   #appExtents = { minWidth: NaN, maxWidth: NaN, minHeight: NaN, maxHeight: NaN };

   /**
    * The last resolved size of the tracker.
    *
    * @type {{width: number, height: number}}
    */
   #lastSize = { width: 0, height: 0 };

   /**
    * Tracks the last state of the scrollbar.
    *
    * @type {boolean}
    */
   #scrollbarActive = false;

   /**
    * Timeout ID for storing the position in the module settings.
    *
    * @type {number}
    */
   #timeoutPosition = void 0;

   /**
    * Stores the module setting for the resizable state.
    *
    * @type {boolean}
    */
   #windowResizable = false;

   /**
    * Sets the initial position from the module settings.
    *
    * @param {object}   [options] - Application options.
    */
   constructor(options = {})
   {
      super(options);

      try
      {
         const position = JSON.parse(game.settings.get(constants.moduleName, settings.questTrackerPosition));

         for (const key of ['top', 'left', 'width', 'height'])
         {
            if (Number.isFinite(position?.[key])) { this.position[key] = position[key]; }
         }

         // When upgrading to `v0.7.7` it is necessary to set the default width.
         if (!position?.width) { this.position.width = QuestTracker.#DEFAULT_WIDTH; }
      }
      catch (err)
      {
         Object.assign(this.position, QuestTracker.#DEFAULT_POSITION);
      }

      this._dragHeader = false;

      this._pinned = game.settings.get(constants.moduleName, settings.questTrackerPinned);

      this._inPinDropRect = false;

      // Must be set before the first render so the stored height isn't overridden when positioning.
      this.#windowResizable = game.settings.get(constants.moduleName, settings.questTrackerResizable);
   }

   /**
    * @returns {number} The minimum width of the tracker.
    */
   get minWidth() { return this.#appExtents.minWidth || 275; }

   /**
    * @returns {boolean} Whether the tracker is pinned.
    */
   get pinned() { return this._pinned; }

   /**
    * The tracker never takes focus away from other windows.
    *
    * @inheritDoc
    */
   bringToFront() {}

   /**
    * Closes the tracker and by default disables the tracker module setting.
    *
    * @param {object}   [options] - Close options.
    *
    * @param {boolean}  [options.updateSetting=true] - Update the module setting for enabling the tracker.
    *
    * @returns {Promise<QuestTracker>} This instance.
    */
   async close({ updateSetting = true, ...options } = {})
   {
      const result = await super.close(options);

      if (updateSetting)
      {
         await game.settings.set(constants.moduleName, settings.questTrackerEnable, false);
      }

      return result;
   }

   /**
    * Adds the icon buttons to the window header. Buttons are updated in {@link QuestTracker.#updateHeaderButtons}.
    *
    * @inheritDoc
    */
   async _renderFrame(options)
   {
      const frame = await super._renderFrame(options);

      const header = frame.querySelector('.window-header');
      if (header)
      {
         const first = header.querySelector('.header-control');

         const actions = ['showPrimary', 'showGroups', 'showHidden', 'showBackground'];

         // Share the tracker w/ remote clients.
         if (game.user.isGM) { actions.push('shareTracker'); }

         for (const action of actions.reverse())
         {
            const button = document.createElement('button');
            button.type = 'button';
            button.dataset.action = action;
            button.classList.add('header-control', 'icon');

            first ? first.before(button) : header.append(button);
         }
      }

      return frame;
   }

   /**
    * Sets up all delegated control callbacks with event listeners for click, drag, drop via various CSS selectors, the
    * header pointer events used for pinning and the context menu. This is done once as the root element of the
    * application persists between renders.
    *
    * @inheritDoc
    */
   async _onFirstRender(context, options)
   {
      await super._onFirstRender(context, options);

      const header = this.window.header;

      header.addEventListener('pointerdown', async (event) =>
       HandlerTracker.headerPointerDown(event, header, this));

      header.addEventListener('pointerup', async (event) =>
       HandlerTracker.headerPointerUp(event, header, this));

      const html = this.element;

      Utils.on(html, domEvents.click, '.quest-tracker-link', HandlerTracker.questOpen);

      // The toggle button next to the quest title shows / hides the objectives without the double click delay.
      Utils.on(html, domEvents.click, '.quest-tracker-toggle', (event) => HandlerTracker.questClick(event, this));

      // Removes / restores a quest in the tracker of this user.
      Utils.on(html, domEvents.click, '.quest-tracker-remove', (event) => HandlerTracker.questRemoveToggle(event, this));

      // Collapses / expands a group of quests.
      Utils.on(html, domEvents.click, '.quest-tracker-group', (event) => HandlerTracker.groupToggle(event, this));

      Utils.on(html, domEvents.click, '.quest-tracker-task', async (event) =>
       await HandlerTracker.questTaskToggle(event));

      // Single click toggles the quest objectives; double click opens the quest.
      Utils.createDblClick({
         root: html,
         selector: '.quest-tracker-header',
         singleCallback: (event) => HandlerTracker.questClick(event, this),
         doubleCallback: HandlerTracker.questOpen,
      });

      this.#contextMenu();

      // Store the min / max extents defined in the CSS.
      const style = window.getComputedStyle(this.element);

      this.#appExtents = {
         minWidth: parseInt(style.minWidth),
         maxWidth: parseInt(style.maxWidth),
         minHeight: parseInt(style.minHeight),
         maxHeight: parseInt(style.maxHeight)
      };
   }

   /**
    * Updates the header buttons, background state and the resizable state of the window.
    *
    * @inheritDoc
    */
   async _onRender(context, options)
   {
      await super._onRender(context, options);

      this.#updateHeaderButtons();

      const showBackgroundState = sessionStorage.getItem(sessionConstants.trackerShowBackground) === 'true';
      this.element.classList.toggle('no-background', !showBackgroundState);

      this.#windowResizable = game.settings.get(constants.moduleName, settings.questTrackerResizable);

      // Only show the resize handle when resizable. When not resizable the height of the tracker always fits the
      // content which is handled in `_updatePosition`.
      if (this.window.resize) { this.window.resize.style.display = this.#windowResizable ? '' : 'none'; }

      this.element.style.minHeight = this.#windowResizable && Number.isFinite(this.#appExtents.minHeight) ?
       `${this.#appExtents.minHeight}px` : `${this.window.header.scrollHeight}px`;

      // The content may have changed, so the position (height) must be recalculated.
      this.setPosition();

      this.#updateScrollbarState();
   }

   /**
    * Provides the quest data to the template.
    *
    * @inheritDoc
    */
   async _prepareContext(options = {})
   {
      const context = await super._prepareContext(options);

      const showOnlyPrimary = sessionStorage.getItem(sessionConstants.trackerShowPrimary) === 'true';
      const primaryQuest = QuestDB.getQuestEntry(game.settings.get(constants.moduleName, settings.primaryQuest));

      // Stores the primary quest ID when all in progress quests are shown so that the star icon is drawn for the
      // primary quest.
      const primaryQuestId = !showOnlyPrimary && primaryQuest ? primaryQuest.id : '';

      const quests = await this.prepareQuests(showOnlyPrimary, primaryQuest);

      return foundry.utils.mergeObject(context, {
         hasQuests: quests.count() > 0,
         showOnlyPrimary,
         primaryQuestId,
         quests
      });
   }

   /**
    * Prepares the quests to display in the tracker.
    *
    * @param {boolean}      showOnlyPrimary - Show only the primary quest.
    *
    * @param {QuestEntry}   primaryQuest - The primary quest entry.
    *
    * @returns {Promise<Collection>} The collection of quest data for the template.
    */
   async prepareQuests(showOnlyPrimary, primaryQuest)
   {
      const questEntries = showOnlyPrimary ? collect(primaryQuest ? [primaryQuest] : []) :
       QuestDB.sortCollect({ status: questStatus.active });

      const isGM = game.user.isGM;
      const isTrustedPlayerEdit = Utils.isTrustedPlayerEdit();
      const primaryQuestId = !showOnlyPrimary && primaryQuest ? primaryQuest.id : '';

      // The folder state is stored as `false` when the objectives are shown (expanded).
      const isExpanded = (id) => sessionStorage.getItem(`${sessionConstants.trackerFolderState}${id}`) === 'false';

      /**
       * Builds the list of rows (subquests, separator and tasks) displayed below an expanded quest. Subquests are
       * only listed (they are also shown as quests of their own with their own objectives) and are not expandable.
       *
       * @param {QuestEntry}  entry - The quest entry to build rows for.
       *
       * @returns {object[]} The rows.
       */
      const buildRows = (entry) =>
      {
         const q = entry.enrich;
         const rows = [];

         const isEditOwner = entry.quest.isEditOwner;
         const canEdit = isGM || (isEditOwner && isTrustedPlayerEdit);
         const playerEdit = !!isEditOwner;

         // Subquests and tasks are listed in the order defined in the quest.
         for (const objective of q.data_objectives)
         {
            if (objective.kind === 'subquest')
            {
               rows.push({ isGM, isPrimary: objective.id === primaryQuestId, ...objective });
            }
            else
            {
               rows.push({ questId: q.id, canEdit, playerEdit, ...objective });
            }
         }

         return rows;
      };

      // Quests removed from the tracker by the user; they are only listed (dimmed) when the user asks for them.
      const removedIds = HandlerTracker.getRemovedQuests();
      const showRemoved = sessionStorage.getItem(sessionConstants.trackerShowHidden) === 'true';

      const visibleEntries = showOnlyPrimary || showRemoved || removedIds.size === 0 ? questEntries :
       questEntries.filter((entry) => !removedIds.has(entry.id));

      // Optionally list the quests by group (alphabetically; the quests without group at the end).
      const showGroups = sessionStorage.getItem(sessionConstants.trackerShowGroups) === 'true';
      const groupOf = (entry) => (showGroups ? (entry.quest.group ?? '').trim() : '');

      let entries = visibleEntries;
      const groupCounts = new Map();
      if (showGroups)
      {
         for (const entry of visibleEntries.all()) { groupCounts.set(groupOf(entry), (groupCounts.get(groupOf(entry)) ?? 0) + 1); }

         entries = visibleEntries.sort((a, b) =>
         {
            const ga = groupOf(a);
            const gb = groupOf(b);
            if (ga === gb) { return 0; }
            if (ga === '') { return 1; }
            if (gb === '') { return -1; }
            return ga.localeCompare(gb, void 0, { numeric: true, sensitivity: 'base' });
         });
      }

      let previousGroup = null;

      return entries.transform((entry) =>
      {
         const q = entry.enrich;
         const expanded = isExpanded(q.id);

         const group = groupOf(entry);
         const groupHeader = showGroups && group !== previousGroup;
         previousGroup = group;
         const groupCollapsed = showGroups &&
          sessionStorage.getItem(`${sessionConstants.trackerGroupCollapsed}${group}`) === 'true';

         const rows = expanded ? buildRows(entry) : [];

         return {
            id: q.id,
            groupHeader,
            groupCollapsed,
            groupName: group === '' ? game.i18n.localize('ForienQuestLog.QuestLog.Labels.NoGroup') : group,
            groupKey: group,
            groupIsEmpty: group === '',
            groupCount: groupCounts.get(group) ?? 0,
            isRemoved: removedIds.has(q.id),
            canEdit: isGM || (entry.quest.isEditOwner && isTrustedPlayerEdit),
            playerEdit: entry.quest.isEditOwner,
            source: q.giver,
            name: q.name,
            isGM,
            isHidden: q.isHidden,
            isInactive: q.isInactive,
            isPersonal: q.isPersonal,
            personalActors: q.personalActors,
            hasObjectives: q.hasObjectives,
            expanded,
            rows
         };
      });
   }

   /**
    * Overrides the position handling to support forcing / overriding the pinned state. This is done from
    * {@link FQLHooks.openQuestTracker}.
    *
    * @param {object}   [position] - The requested position with optional `override` and `pinned` parameters.
    *
    * @returns {object} The resolved position.
    *
    * @inheritDoc
    */
   setPosition({ override, pinned = this._pinned, ...opts } = {})
   {
      // Potentially force override any pinned state.
      if (typeof override === 'boolean')
      {
         if (pinned)
         {
            this._pinned = true;
            this._inPinDropRect = true;
            game.settings.set(constants.moduleName, settings.questTrackerPinned, true);

            FoundryUIManager.updateTracker();
            return this.position; // Early out as updateTracker above calls setPosition again.
         }
         else
         {
            this._pinned = false;
            this._inPinDropRect = false;
            game.settings.set(constants.moduleName, settings.questTrackerPinned, false);
         }
      }

      // When pinned the position is always determined by the sidebar.
      if (pinned)
      {
         if (typeof opts.left === 'number') { opts.left = this.position.left; }
         if (typeof opts.top === 'number') { opts.top = this.position.top; }
         if (typeof opts.width === 'number') { opts.width = this.position.width; }
      }

      return super.setPosition(opts);
   }

   /**
    * Constrains the requested position by the Foundry UI (sidebar / hotbar / controls), the min / max extents, and
    * the height of the content when the tracker is not resizable.
    *
    * @param {object}   position - Requested application position.
    *
    * @returns {object} The resolved application position.
    *
    * @inheritDoc
    */
   _updatePosition(position)
   {
      const hasFrame = !!this.window?.header;

      if (hasFrame)
      {
         // When not resizable the height always matches the header and content.
         if (!this.#windowResizable)
         {
            const height = this.#contentHeight();
            if (height > 0) { position.height = height; }
         }

         // Pin width / height to min / max styles if defined.
         if (Number.isFinite(position.width))
         {
            const { minWidth, maxWidth } = this.#appExtents;
            if (position.width < minWidth) { position.width = minWidth; }
            if (position.width > maxWidth) { position.width = maxWidth; }
         }

         if (Number.isFinite(position.height))
         {
            const { minHeight, maxHeight } = this.#appExtents;
            if (position.height < minHeight) { position.height = minHeight; }
            if (position.height > maxHeight) { position.height = maxHeight; }
         }

         if (Number.isFinite(position.width) && Number.isFinite(position.height))
         {
            // The position object may not be extensible, so the resize state is not stored in it.
            const resizeWidth = this.#lastSize.width < position.width;
            const resizeHeight = this.#lastSize.height < position.height;

            // Mutates `position` to set the maximum left position / pin the position.
            const currentInPinDropRect = this._inPinDropRect;
            this._inPinDropRect = FoundryUIManager.checkPosition(position, { resizeWidth, resizeHeight });

            // Set the jiggle animation if the position movement is coming from dragging the header and the pin drop
            // state has changed.
            if (!this._pinned && this._dragHeader && currentInPinDropRect !== this._inPinDropRect)
            {
               this.element.style.animation = this._inPinDropRect ? 'ql-jiggle 0.3s infinite' : '';
            }
         }
      }

      if ('zIndex' in position || Object.isExtensible(position)) { position.zIndex = QuestTracker.#Z_INDEX; }

      const resolved = super._updatePosition(position);

      if (Number.isFinite(resolved?.width) && Number.isFinite(resolved?.height))
      {
         this.#lastSize = { width: resolved.width, height: resolved.height };
      }

      return resolved;
   }

   /**
    * Updates the scrollbar state and stores the position in the module settings after a short delay.
    *
    * @inheritDoc
    */
   _onPosition(position)
   {
      super._onPosition(position);

      this.#updateScrollbarState();

      const { top, left, width, height } = position;

      if (Number.isFinite(width) && Number.isFinite(height))
      {
         clearTimeout(this.#timeoutPosition);

         this.#timeoutPosition = setTimeout(() =>
         {
            game.settings.set(constants.moduleName, settings.questTrackerPosition,
             JSON.stringify({ top, left, width, height }));
         }, QuestTracker.#TIMEOUT_POSITION);
      }
   }

   /**
    * Toggles the background of the tracker.
    *
    * @this {QuestTracker}
    */
   static #onShowBackground()
   {
      HandlerTracker.showBackground(this);
   }

   /**
    * Toggles grouping the quests by their group.
    *
    * @this {QuestTracker}
    */
   static #onShowGroups()
   {
      HandlerTracker.showGroups(this);
   }

   /**
    * Toggles showing the quests that the user removed from the tracker.
    *
    * @this {QuestTracker}
    */
   static #onShowHidden()
   {
      HandlerTracker.showHiddenQuests(this);
   }

   /**
    * Toggles showing only the primary quest.
    *
    * @this {QuestTracker}
    */
   static #onShowPrimary()
   {
      HandlerTracker.questPrimaryShow(this);
   }

   /**
    * Shares the tracker w/ remote clients.
    */
   static #onShareTracker()
   {
      Socket.showQuestTracker();
   }

   /**
    * Create the context menu.
    */
   #contextMenu()
   {
      const menuItems = [
       contextOptions.menuItemCopyLink,
       contextOptions.jumpToPin
      ];

      if (game.user.isGM)
      {
         menuItems.push(
          contextOptions.copyQuestId,
          contextOptions.togglePrimaryQuest
         );
      }

      new FQLContextMenu(this.element, '.quest-tracker-header', menuItems, { fixed: true });
   }

   /**
    * @returns {number} The height of the window header and content.
    */
   #contentHeight()
   {
      const header = this.window.header;
      const content = this.window.content;
      if (!header || !content) { return 0; }

      // `content` is stretched to fill the window, so its `scrollHeight` never shrinks and the window would grow on
      // every position update (for example when dragging). Measure the natural height of the inner content instead.
      const inner = content.firstElementChild;
      const innerHeight = inner ? inner.scrollHeight : 0;

      const style = window.getComputedStyle(content);
      const padding = (parseFloat(style.paddingTop) || 0) + (parseFloat(style.paddingBottom) || 0);

      // Add the extra `2` for small format (1080P and below screen size).
      return header.scrollHeight + innerHeight + padding + 2;
   }

   /**
    * The tracker is click through unless there is a scrollbar. Sets `pointer-events` based on the scrollbar state.
    */
   #updateScrollbarState()
   {
      const content = this.window?.content;
      if (!content) { return; }

      const scrollbarActive = content.scrollHeight > content.clientHeight;

      if (scrollbarActive !== this.#scrollbarActive)
      {
         this.#scrollbarActive = scrollbarActive;
         this.element.style.pointerEvents = scrollbarActive ? 'auto' : 'none';
      }
   }

   /**
    * Updates the icon, state and tooltip of the header buttons from the session storage state.
    */
   #updateHeaderButtons()
   {
      const header = this.window.header;
      if (!header) { return; }

      const showBackgroundState = sessionStorage.getItem(sessionConstants.trackerShowBackground) === 'true';
      const primaryState = sessionStorage.getItem(sessionConstants.trackerShowPrimary) === 'true';
      const showHiddenState = sessionStorage.getItem(sessionConstants.trackerShowHidden) === 'true';
      const showGroupsState = sessionStorage.getItem(sessionConstants.trackerShowGroups) === 'true';

      const buttons = {
         shareTracker: {
            icon: 'fas fa-eye',
            tooltip: game.i18n.localize('ForienQuestLog.Labels.AppHeader.ShowPlayers')
         },
         showBackground: {
            icon: showBackgroundState ? 'fas fa-fill on' : 'fas fa-fill off',
            tooltip: game.i18n.localize(showBackgroundState ? 'ForienQuestLog.QuestTracker.Tooltips.BackgroundUnshow' :
             'ForienQuestLog.QuestTracker.Tooltips.BackgroundShow')
         },
         showGroups: {
            icon: showGroupsState ? 'fas fa-layer-group on' : 'fas fa-layer-group off',
            tooltip: game.i18n.localize(showGroupsState ? 'ForienQuestLog.QuestTracker.Tooltips.GroupsUnshow' :
             'ForienQuestLog.QuestTracker.Tooltips.GroupsShow')
         },
         showHidden: {
            icon: showHiddenState ? 'fas fa-list-check on' : 'fas fa-list-check off',
            tooltip: game.i18n.localize(showHiddenState ? 'ForienQuestLog.QuestTracker.Tooltips.RemovedUnshow' :
             'ForienQuestLog.QuestTracker.Tooltips.RemovedShow')
         },
         showPrimary: {
            icon: primaryState ? 'fas fa-star' : 'far fa-star',
            tooltip: game.i18n.localize(primaryState ? 'ForienQuestLog.QuestTracker.Tooltips.PrimaryQuestUnshow' :
             'ForienQuestLog.QuestTracker.Tooltips.PrimaryQuestShow')
         }
      };

      for (const [action, data] of Object.entries(buttons))
      {
         const button = header.querySelector(`button[data-action="${action}"]`);
         if (!button) { continue; }

         button.className = `header-control icon ${data.icon}`;
         button.dataset.tooltip = data.tooltip;
         button.setAttribute('aria-label', data.tooltip);
      }
   }
}
