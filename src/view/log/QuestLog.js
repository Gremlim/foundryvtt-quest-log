import {
   QuestDB,
   Socket,
   Utils }              from '../../control/index.js';

import {
   FQLContextMenu,
   FQLDialog }          from '../internal/index.js';

import { HandlerLog }   from './HandlerLog.js';

import {
   constants,
   jquery,
   questStatus,
   questStatusI18n,
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

      const html = $(this.element);

      html.on(jquery.click, '.new-quest-btn', HandlerLog.questAdd);

      html.on(jquery.click, '.actions.quest-status i.delete', HandlerLog.questDelete);

      // This registers for any element and prevents the circle / slash icon displaying for not being a drag target.
      html.on(jquery.dragenter, (event) => event.preventDefault());

      html.on(jquery.dragstart, '.drag-quest', void 0, HandlerLog.questDragStart);

      html.on(jquery.click, '.open-quest', void 0, HandlerLog.questOpen);

      html.on(jquery.click, '.actions.quest-status i.move', HandlerLog.questStatusSet);

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

      // Determine the tab to show. Only GMs or trusted players w/ edit may view the inactive tab.
      const canViewInactive = game.user.isGM || Utils.isTrustedPlayerEdit();

      let tabId = this.tabGroups.primary ?? 'active';

      if (typeof options.tabId === 'string' && options.tabId in questStatus &&
       (options.tabId !== questStatus.inactive || canViewInactive))
      {
         tabId = options.tabId;
      }

      if (tabId === questStatus.inactive && !canViewInactive) { tabId = questStatus.active; }

      this.changeTab(tabId, 'primary', { force: true, updatePosition: false });

      this.#updateTableHeight();

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
         quests: QuestDB.sortCollect()
      });
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

         menuItemsOther.push(contextOptions.copyQuestId);
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
