import {
   QuestDB,
   Socket,
   Utils }              from '../../control/index.js';

import {
   ActionMenu,
   FQLContextMenu,
   FQLDialog }          from '../internal/index.js';

import { HandlerLog }   from './HandlerLog.js';

import {
   constants,
   domEvents,
   questStatus,
   questStatusI18n,
   sessionConstants,
   settings }           from '../../model/constants.js';
import * as contextOptions from "../internal/context-options.js";

const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;

/**
 * Provides the main quest log app which shows the quests separated by status either with bookmark or classic tabs.
 *
 * In {@link QuestLog._prepareContext} the {@link QuestsCollect} data is retrieved from {@link QuestDB.sortCollect}
 * which provides automatic sorting of each quest status category by either {@link SortFunctions.ALPHA} or
 * {@link SortFunctions.DATE_END} for status categories {@link questStatus.completed} and {@link questStatus.failed}.
 * Several module settings and whether the current user is a GM is also passed back as data to be used in rendering the
 * {@link Handlebars} template.
 *
 * Control callbacks are setup once in {@link QuestLog._onFirstRender} as delegated event listeners and are located in
 * a separate static control class {@link HandlerLog}.
 *
 * This is an ApplicationV2 application. The tab group is `primary`; the active tab is stored in `tabGroups.primary`.
 */
export class QuestLog extends HandlebarsApplicationMixin(ApplicationV2)
{
   /** @inheritDoc */
   static DEFAULT_OPTIONS = {
      id: 'ql-quest-log',
      classes: ['ql-quest-log-app'],
      position: { width: 700, height: 480 },
      window: {
         title: 'ForienQuestLog.QuestLog.Title',
         icon: 'fa-solid fa-scroll',
         minimizable: true,
         resizable: true,
         controls: [
            {
               icon: 'fa-solid fa-eye',
               label: 'ForienQuestLog.Labels.AppHeader.ShowPlayers',
               action: 'showPlayers',
               visible: () => game.user.isGM
            }
         ]
      },
      actions: {
         showPlayers: QuestLog.#onShowPlayers
      }
   };

   /** @inheritDoc */
   static PARTS = {
      main: { template: 'modules/quest-log/templates/quest-log.html' }
   };

   /** @inheritDoc */
   static TABS = {
      primary: {
         tabs: [
            { id: 'rumors' },
            { id: 'available' },
            { id: 'active' },
            { id: 'completed' },
            { id: 'failed' },
            { id: 'inactive' }
         ],
         initial: 'active'
      }
   };

   /**
    * Share the QuestLog w/ remote clients via {@link Socket.showQuestLog}.
    *
    * @this {QuestLog}
    */
   static #onShowPlayers()
   {
      Socket.showQuestLog(this.tabGroups.primary);
   }

   /**
    * Sets up all delegated control callbacks with event listeners for click, drag, drop via various CSS selectors and
    * the context menus. This is done once as the root element of the application persists between renders.
    *
    * @inheritDoc
    */
   async _onFirstRender(context, options)
   {
      await super._onFirstRender(context, options);

      const html = this.element;

      // The 3 dots menu of the quest actions.
      ActionMenu.bind(html);

      Utils.on(html, domEvents.click, '.new-quest-btn', HandlerLog.questAdd);

      Utils.on(html, domEvents.click, '.actions.quest-status i.delete', HandlerLog.questDelete);

      // This registers for any element and prevents the circle / slash icon displaying for not being a drag target.
      html.addEventListener(domEvents.dragenter, (event) => event.preventDefault());

      Utils.on(html, domEvents.dragstart, '.drag-quest', HandlerLog.questDragStart);

      Utils.on(html, domEvents.click, '.open-quest', HandlerLog.questOpen);

      // Grouping of the quests of a tab.
      Utils.on(html, domEvents.change, '.quest-group-by', (event) => HandlerLog.groupBySet(event, this));

      Utils.on(html, domEvents.click, '.group-header', (event) => HandlerLog.groupToggle(event, this));

      // Search box: filters the quests of all the tabs without rendering the app (keeps the focus on the input).
      Utils.on(html, 'input', '.quest-search', (event) =>
      {
         this.#search = event.target.value;
         this.#applySearch();
      });

      Utils.on(html, domEvents.click, '.actions.quest-status i.move', HandlerLog.questStatusSet);

      this.#contextMenu();
   }

   /**
    * Selects any requested tab and sets the table heights.
    *
    * Supports the optional render option `tabId` that matches an entry in `constants.questStatus` to select the
    * given tab. This comes into play as when a GM uses the `show to players` button in the app header as not only
    * will the quest log open for players, but the specific tab selected by the GM will show. It is also possible to
    * add `tabId` to the `ForienQuestLog.Open.QuestLog` hook to open a specific tab.
    *
    * @inheritDoc
    */
   async _onRender(context, options)
   {
      await super._onRender(context, options);

      ActionMenu.close();

      // Determine the tab to show. Only GMs or trusted players w/ edit may view the inactive tab.
      const canViewInactive = game.user.isGM || Utils.isTrustedPlayerEdit();

      let tabId = this.tabGroups.primary ?? 'active';

      if (typeof options.tabId === 'string' && (options.tabId in questStatus || options.tabId === 'rumors') &&
       (options.tabId !== questStatus.inactive || canViewInactive))
      {
         tabId = options.tabId;
      }

      if (tabId === questStatus.inactive && !canViewInactive) { tabId = questStatus.active; }

      this.changeTab(tabId, 'primary', { force: true, updatePosition: false });

      this.#updateTableHeight();

      this.#applySearch();

      if (options.focus) { this.bringToFront(); }
   }

   /**
    * Some game systems and custom UI theming modules provide hard overrides on overflow-x / overflow-y styles. Alas, we
    * need to set these for '.window-content' to 'visible' which will cause an issue for very long tables. Thus, we must
    * manually set the table max-heights based on the position / height of the {@link ApplicationV2}.
    *
    * @inheritDoc
    */
   _onPosition(position)
   {
      super._onPosition(position);
      this.#updateTableHeight();
   }

   /**
    * Handle closing any confirm delete quest dialog attached to QuestLog.
    *
    * @override
    * @inheritDoc
    */
   async close(options)
   {
      ActionMenu.close();
      FQLDialog.closeDialogs({ isQuestLog: true });
      return super.close(options);
   }

   /**
    * Retrieves the sorted quest collection from the {@link QuestDB.sortCollect} and sets several state parameters for
    * GM / player / trusted player edit along with several module settings: {@link FQLSettings.allowPlayersAccept},
    * {@link FQLSettings.allowPlayersCreate}, and {@link FQLSettings.showTasks}.
    *
    * @override
    * @inheritDoc
    */
   async _prepareContext(options = {})
   {
      const context = await super._prepareContext(options);

      return foundry.utils.mergeObject(context, {
         options,
         isGM: game.user.isGM,
         isPlayer: !game.user.isGM,
         isTrustedPlayerEdit: Utils.isTrustedPlayerEdit(),
         canAccept: game.settings.get(constants.moduleName, settings.allowPlayersAccept),
         canCreate: game.settings.get(constants.moduleName, settings.allowPlayersCreate),
         showTasks: game.settings.get(constants.moduleName, settings.showTasks),
         questStatusI18n,
         rumors: QuestDB.getRumors(),
         quests: QuestDB.sortCollect(),
         groupBy: Object.fromEntries(Object.keys(questStatus).map((status) => [status, QuestLog.getGroupBy(status)])),
         search: this.#search,
         groups: this.#prepareGroups()
      });
   }

   /**
    * Current text of the search box; shared by all the tabs and kept between renders.
    *
    * @type {string}
    */
   #search = '';

   /**
    * Lower case text without accents so that the search ignores the case and the accents.
    *
    * @param {string}   text - Text to normalize.
    *
    * @returns {string} Normalized text.
    */
   static #normalize(text)
   {
      return String(text ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
   }

   /**
    * Applies the search text (#18) to the rendered quests: quests that don't contain all the words of the search in
    * their text (name, giver, location, group, labels, etc.) are hidden, as are the group headers left without quests;
    * the group counters show the number of matches. Quests of collapsed groups are included in the search. The state
    * is only in the DOM, so nothing is stored.
    */
   #applySearch()
   {
      const root = this.element;
      if (!root) { return; }

      const words = QuestLog.#normalize(this.#search).split(/\s+/).filter((word) => word.length);
      const searching = words.length > 0;

      root.querySelector('.quest-log')?.classList.toggle('searching', searching);

      // Keep every search box in sync (one per tab).
      for (const input of root.querySelectorAll('.quest-search'))
      {
         if (input.value !== this.#search) { input.value = this.#search; }
      }

      for (const list of root.querySelectorAll('.table > ul'))
      {
         let header = null;
         let matches = 0;

         const closeGroup = () =>
         {
            if (!header) { return; }

            const counter = header.querySelector('.group-count');
            if (counter) { counter.textContent = searching ? String(matches) : (counter.dataset.count ?? ''); }

            header.classList.toggle('search-hidden', searching && matches === 0);
         };

         for (const li of list.children)
         {
            if (li.classList.contains('group-header'))
            {
               closeGroup();
               header = li;
               matches = 0;
            }
            else if (li.classList.contains('drag-quest'))
            {
               const text = QuestLog.#normalize(`${li.dataset.search ?? ''} ${li.textContent}`);
               const match = !searching || words.every((word) => text.includes(word));

               li.classList.toggle('search-hidden', !match);
               if (match) { matches++; }
            }
         }

         closeGroup();
      }
   }

   /**
    * The available ways to group the quests of a tab.
    *
    * @type {string[]}
    */
   static GROUP_BY = ['none', 'group', 'giver', 'location'];

   /**
    * Gets how the quests of the given tab are grouped by this user.
    *
    * @param {string}   status - A quest status / tab ID.
    *
    * @returns {string} One of {@link QuestLog.GROUP_BY}.
    */
   static getGroupBy(status)
   {
      const value = sessionStorage.getItem(`${sessionConstants.logGroupBy}${status}`);
      return QuestLog.GROUP_BY.includes(value) ? value : 'none';
   }

   /**
    * Builds the groups of quests (with the quests inside) of each tab according to how the user chose to group them.
    * Without grouping each tab has one group without header.
    *
    * @returns {Record<string, object[]>} The groups of each tab.
    */
   #prepareGroups()
   {
      const sorted = QuestDB.sortCollect();
      const result = {};

      const noneLabel = {
         group: game.i18n.localize('ForienQuestLog.QuestLog.Labels.NoGroup'),
         giver: game.i18n.localize('ForienQuestLog.QuestLog.Labels.NoGiver'),
         location: game.i18n.localize('ForienQuestLog.QuestLog.Labels.NoLocation')
      };

      for (const status of Object.keys(sorted))
      {
         const collection = sorted[status];
         const entries = typeof collection?.all === 'function' ? collection.all() : Array.from(collection ?? []);
         const groupBy = QuestLog.getGroupBy(status);

         if (groupBy === 'none')
         {
            result[status] = [{ header: false, quests: entries }];
            continue;
         }

         const keyOf = (entry) =>
         {
            switch (groupBy)
            {
               case 'group': return entry.quest.group ?? '';
               case 'location': return entry.quest.location ?? '';
               case 'giver': return entry.enrich?.giverData?.name ?? '';
               default: return '';
            }
         };

         const map = new Map();
         for (const entry of entries)
         {
            const key = (keyOf(entry) ?? '').trim();
            if (!map.has(key)) { map.set(key, []); }
            map.get(key).push(entry);
         }

         // Named groups alphabetically and the quests without value in the last group.
         const keys = [...map.keys()].filter((key) => key !== '').sort(
          (a, b) => a.localeCompare(b, void 0, { numeric: true, sensitivity: 'base' }));
         if (map.has('')) { keys.push(''); }

         result[status] = keys.map((key) => ({
            header: true,
            key,
            name: key === '' ? noneLabel[groupBy] : key,
            isEmpty: key === '',
            count: map.get(key).length,
            collapsed: sessionStorage.getItem(`${sessionConstants.logGroupCollapsed}${status}-${groupBy}-${key}`) === 'true',
            quests: map.get(key)
         }));
      }

      return result;
   }

   /**
    * Create the context menu. There are two separate context menus for the active / in progress tab and all other tabs.
    */
   #contextMenu()
   {
      /**
       * @type {object[]}
       */
      const menuItemsOther = [
         contextOptions.menuItemCopyLink,
         contextOptions.jumpToPin
      ];

      /**
       * @type {object[]}
       */
      const menuItemsActive = [
         contextOptions.menuItemCopyLink,
         contextOptions.jumpToPin
      ];

      if (game.user.isGM)
      {
         menuItemsActive.push(
          contextOptions.copyQuestId,
          contextOptions.togglePrimaryQuest
         );

         menuItemsActive.push(contextOptions.duplicateQuest);

         menuItemsOther.push(contextOptions.copyQuestId, contextOptions.duplicateQuest);
      }

      // Must show two different context menus as only the active / in progress tab potentially has the menu option to
      // allow the GM to set the primary quest.
      new FQLContextMenu(this.element, '.tab:not([data-tab="active"]) .drag-quest', menuItemsOther, { fixed: true });
      new FQLContextMenu(this.element, '.tab[data-tab="active"] .drag-quest', menuItemsActive, { fixed: true });
   }

   /**
    * Manually sets the max height of the quest tables based on the position / height of the application.
    */
   #updateTableHeight()
   {
      const element = this.element;
      if (!element || !this.rendered) { return; }

      const tableElements = element.querySelectorAll('.table');

      const table = element.querySelector('.tab.active .table');
      if (!table) { return; }

      const fqlPosition = element.getBoundingClientRect();
      const tablePosition = table.getBoundingClientRect();

      // Manually calculate the max height for the table based on the position of the main window div and table.
      const height = typeof this.position.height === 'number' ? this.position.height : fqlPosition.height;

      for (const tableElement of tableElements)
      {
         tableElement.style.maxHeight = `${height - (tablePosition.top - fqlPosition.top + 16)}px`;
      }
   }
}
