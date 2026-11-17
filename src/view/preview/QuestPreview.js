import {
   FVTTCompat,
   QuestDB,
   Socket,
   Utils }                    from '../../control/index.js';

import { FQLDialog }          from '../internal/index.js';

import { HandlerAny }         from './HandlerAny.js';
import { HandlerDetails }     from './HandlerDetails.js';
import { HandlerManage }      from './HandlerManage.js';
import { HandlerTracker }     from '../tracker/HandlerTracker.js';

import {
   constants,
   domEvents,
   settings }                 from '../../model/constants.js';

const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;

/**
 * The names of the rich text editors (`<prose-mirror>` elements) that store their content in the quest.
 *
 * @type {string[]}
 */
const editorNames = ['description', 'gmnotes', 'playernotes'];

/**
 * Provides the main quest sheet / preview. This is an ApplicationV2 application that is not registered as a
 * Foundry document sheet; {@link Quest.sheet} creates a new instance for a quest and {@link ViewManager} tracks the
 * open instances.
 *
 * The quest data is retrieved in {@link QuestPreview._prepareContext} from the {@link QuestDB} enrich data. Control
 * callbacks are setup once in {@link QuestPreview._onFirstRender} as delegated event listeners and are located in
 * separate static control classes: {@link HandlerAny}, {@link HandlerDetails} and {@link HandlerManage}.
 *
 * The rich text fields use the core `<prose-mirror>` form element which is toggled between the enriched content and
 * the editor. Any change is stored via {@link QuestPreview.saveQuest}.
 *
 * The tab group is `primary`; the active tab is stored in `tabGroups.primary`.
 */
export class QuestPreview extends HandlebarsApplicationMixin(ApplicationV2)
{
   /** @inheritDoc */
   static DEFAULT_OPTIONS = {
      classes: ['ql-quest-preview'],
      position: { width: 1000, height: 640 },
      window: {
         title: 'ForienQuestLog.QuestPreview.Title',
         icon: 'fa-solid fa-scroll',
         minimizable: true,
         resizable: true
      },
      actions: {
         copyLink: QuestPreview.#onCopyLink,
         shareQuest: QuestPreview.#onShareQuest,
         showSplash: QuestPreview.#onShowSplash
      }
   };

   /** @inheritDoc */
   static PARTS = {
      main: { template: 'modules/quest-log/templates/quest-preview.html' }
   };

   /** @inheritDoc */
   static TABS = {
      primary: {
         tabs: [
            { id: 'details' },
            { id: 'playernotes' },
            { id: 'history' },
            { id: 'gmnotes' },
            { id: 'management' }
         ],
         initial: 'details'
      }
   };

   /**
    * Names of the editors that have changed content that needs to be stored in the quest.
    *
    * @type {Set<string>}
    */
   #changedEditors = new Set();

   /**
    * Prevents re-entrant saving of the editors.
    *
    * @type {boolean}
    */
   #flushing = false;

   /**
    * The quest this preview shows.
    *
    * @type {Quest}
    */
   #quest;

   /**
    * @param {Quest}    quest - The quest to show.
    *
    * @param {object}   [options] - Application options.
    */
   constructor(quest, options = {})
   {
      super({ id: `ql-quest-${quest.id}`, ...options });

      this.#quest = quest;

      /**
       * Stores the current state of the module setting {@link FQLSettings.allowPlayersAccept}.
       *
       * @type {boolean}
       */
      this.canAccept = false;

      /**
       * Stores whether the current user can edit the quest (GM or trusted player w/ edit).
       *
       * @type {boolean}
       */
      this.canEdit = false;

      /**
       * Stores whether the current user is an owner of the quest.
       *
       * @type {boolean}
       */
      this.playerEdit = false;

      /**
       * Stores a function that saves the current in place text edit; invoked when the preview is closed.
       *
       * @type {Function}
       */
      this._activeFocusOutFunction = void 0;

      /**
       * Stores the applications (sheets) opened from this preview, so they are closed with the preview.
       *
       * @type {foundry.applications.api.ApplicationV2[]}
       */
      this._openedApps = [];

      /**
       * Stores the ownership configuration app.
       *
       * @type {FQLDocumentOwnershipConfig}
       */
      this._ownershipControl = void 0;

      /**
       * Stores the reward image popout.
       *
       * @type {foundry.applications.apps.ImagePopout}
       */
      this._rewardImagePopup = void 0;

      /**
       * Stores the splash image popout.
       *
       * @type {foundry.applications.apps.ImagePopout}
       */
      this._splashImagePopup = void 0;
   }

   /**
    * @returns {Quest} The quest of this preview.
    */
   get quest() { return this.#quest; }

   /**
    * @returns {string} The title with the name of the quest.
    *
    * @inheritDoc
    */
   get title()
   {
      return game.i18n.format('ForienQuestLog.QuestPreview.Title', this.#quest);
   }

   /**
    * Adds the header controls for sharing to players (GM), showing the splash image and copying the quest link.
    *
    * @returns {object[]} The header controls.
    *
    * @inheritDoc
    */
   _getHeaderControls()
   {
      const controls = [...super._getHeaderControls()];

      if (game.user.isGM)
      {
         controls.unshift({
            icon: 'fa-solid fa-eye',
            label: 'ForienQuestLog.Labels.AppHeader.ShowPlayers',
            action: 'shareQuest'
         });
      }

      if (this.#quest.splash.length)
      {
         controls.unshift({
            icon: 'fa-regular fa-image',
            label: 'ForienQuestLog.QuestPreview.Tooltips.ViewSplashArt',
            action: 'showSplash'
         });
      }

      controls.unshift({
         icon: 'fa-solid fa-link',
         label: 'ForienQuestLog.QuestLog.ContextMenu.CopyEntityLink',
         action: 'copyLink'
      });

      return controls;
   }

   /**
    * Closes the ownership config when the user changes the tab.
    *
    * @inheritDoc
    */
   _onClickTab(event)
   {
      if (this._ownershipControl)
      {
         this._ownershipControl.close();
         this._ownershipControl = void 0;
      }

      super._onClickTab(event);
   }

   /**
    * Sets up all delegated control callbacks with event listeners for click, drag, drop via various CSS selectors.
    * This is done once as the root element of the application persists between renders. Permissions are checked when
    * the event occurs as they may change between renders.
    *
    * @inheritDoc
    */
   async _onFirstRender(context, options)
   {
      await super._onFirstRender(context, options);

      // Store any changed `<prose-mirror>` content. The event is captured as it may not bubble.
      this.element.addEventListener('change', (event) => this.#onEditorChange(event), { capture: true });

      const html = this.element;

      const always = () => true;
      const editOrPlayerEdit = () => this.canEdit || this.playerEdit;
      const editOrAccept = () => this.canEdit || this.canAccept;
      const edit = () => this.canEdit;

      const on = (type, selector, handler, allowed = always) =>
      {
         Utils.on(html, type, selector, (event) => (allowed() ? handler(event) : void 0));
      };

      on(domEvents.click, '.quest-giver-name .open-actor-sheet', async (event) =>
       await HandlerDetails.questGiverShowActorSheet(event, this));

      on(domEvents.click, '.quest-name-link', (event) => HandlerAny.questOpen(event));

      // This registers for any element and prevents the circle / slash icon displaying for not being a drag target.
      html.addEventListener(domEvents.dragenter, (event) => event.preventDefault());

      on(domEvents.dragstart, '.item-reward .editable-container', (event) =>
       HandlerDetails.rewardDragStartItem(event, this.#quest));

      on(domEvents.dragstart, '.quest-rewards .fa-sort', (event) => HandlerDetails.rewardDragStartSort(event));

      on(domEvents.click, '.abstract-reward .editable-container', async (event) =>
       await HandlerDetails.rewardShowImagePopout(event, this.#quest, this));

      on(domEvents.click, '.actor-reward .editable-container', async (event) =>
       await HandlerDetails.rewardShowSheet(event, this.#quest, this));

      on(domEvents.click, '.item-reward .editable-container', async (event) =>
       await HandlerDetails.rewardShowSheet(event, this.#quest, this));

      on(domEvents.click, '.splash-image-link', () => HandlerDetails.splashImagePopupShow(this.#quest, this));

      on(domEvents.dragstart, '.quest-tasks .fa-sort', (event) => HandlerDetails.taskDragStartSort(event));

      // GM / trusted player w/ edit / quest owner -----------------------------------------------------------------

      on(domEvents.click, '.actions-single.quest-name .editable', (event) =>
       HandlerDetails.questEditName(event, this.#quest, this), editOrPlayerEdit);

      on(domEvents.click, '.quest-location .actions-single .editable', (event) =>
       HandlerDetails.questEditName(event, this.#quest, this), editOrPlayerEdit);

      on(domEvents.drop, '.quest-giver-gc', async (event) =>
       await HandlerDetails.questGiverDropDocument(event, this.#quest, this), editOrPlayerEdit);

      on(domEvents.click, '.quest-giver-gc .toggleImage', async () =>
       await HandlerDetails.questGiverToggleImage(this.#quest, this), editOrPlayerEdit);

      on(domEvents.click, '.quest-giver-gc .deleteQuestGiver', async () =>
       await HandlerDetails.questGiverDelete(this.#quest, this), editOrPlayerEdit);

      on(domEvents.click, '.quest-tasks .add-new-task',
       (event) => HandlerDetails.taskAdd(event, this.#quest, this), editOrPlayerEdit);

      on(domEvents.click, '.actions.tasks .delete', async (event) =>
       await HandlerDetails.taskDelete(event, this.#quest, this), editOrPlayerEdit);

      on(domEvents.drop, '.tasks-box', async (event) =>
       await HandlerDetails.taskDropItem(event, this.#quest), editOrPlayerEdit);

      on(domEvents.click, '.actions.tasks .editable',
       (event) => HandlerDetails.taskEditName(event, this.#quest, this), editOrPlayerEdit);

      on(domEvents.click, 'li.task .toggleState', async (event) =>
       await HandlerDetails.taskToggleState(event, this.#quest, this), editOrPlayerEdit);

      // GM / trusted player w/ edit / players that can accept quests -------------------------------------------------

      on(domEvents.click, '.actions.quest-status i.delete', async (event) =>
       await HandlerAny.questDelete(event, this.#quest), editOrAccept);

      on(domEvents.click, '.actions.quest-status i.move', async (event) =>
      {
         await this.saveQuest({ refresh: false });
         await HandlerAny.questStatusSet(event);
      }, editOrAccept);

      // GM / trusted player w/ edit ----------------------------------------------------------------------------------

      on(domEvents.click, '.quest-giver-name .actions-single .editable', (event) =>
       HandlerDetails.questGiverCustomEditName(event, this.#quest, this), edit);

      on(domEvents.click, '.quest-giver-gc .drop-info', () =>
       HandlerDetails.questGiverCustomSelectImage(this.#quest, this), edit);

      on(domEvents.click, '.quest-tabs .is-primary', () => Socket.setQuestPrimary({ quest: this.#quest }), edit);

      on(domEvents.click, '.quest-rewards .add-abstract', (event) =>
       HandlerDetails.rewardAddAbstract(event, this.#quest, this), edit);

      on(domEvents.click, '.actions.rewards .editable', (event) =>
       HandlerDetails.rewardAbstractEditName(event, this.#quest, this), edit);

      on(domEvents.click, '.quest-rewards .add-currency', async (event) =>
       await HandlerDetails.rewardAddCurrency(event, this.#quest, this), edit);

      on(domEvents.click, '.actions.rewards .reward-take-all', async (event) =>
       await HandlerDetails.rewardTake(event, this.#quest, true));

      on(domEvents.click, '.actions.rewards .reward-take-amount', async (event) =>
       await HandlerDetails.rewardTake(event, this.#quest, false));

      on(domEvents.click, '.actions.rewards .edit-quantity', async (event) =>
       await HandlerDetails.rewardEditQuantity(event, this.#quest, this), edit);

      on(domEvents.click, '.actions.rewards .delete', async (event) =>
       await HandlerDetails.rewardDelete(event, this.#quest, this), edit);

      on(domEvents.drop, '.rewards-box', async (event) =>
       await HandlerDetails.rewardDropItem(event, this.#quest, this), edit);

      on(domEvents.click, '.quest-rewards .hide-all-rewards', async () =>
       await HandlerDetails.rewardsHideAll(this.#quest, this), edit);

      on(domEvents.click, '.quest-rewards .lock-all-rewards', async () =>
       await HandlerDetails.rewardsLockAll(this.#quest, this), edit);

      on(domEvents.click, '.reward-image', async (event) =>
       await HandlerDetails.rewardSelectImage(event, this.#quest, this), edit);

      on(domEvents.click, '.quest-rewards .show-all-rewards', async () =>
       await HandlerDetails.rewardsShowAll(this.#quest, this), edit);

      on(domEvents.click, '.actions.rewards .toggleHidden', async (event) =>
       await HandlerDetails.rewardToggleHidden(event, this.#quest, this), edit);

      on(domEvents.click, '.actions.rewards .toggleLocked', async (event) =>
       await HandlerDetails.rewardToggleLocked(event, this.#quest, this), edit);

      on(domEvents.click, '.quest-rewards .unlock-all-rewards', async () =>
       await HandlerDetails.rewardsUnlockAll(this.#quest, this), edit);

      on(domEvents.click, '.actions.tasks .toggleOptional', async (event) =>
       await HandlerDetails.taskToggleOptional(event, this.#quest, this), edit);

      on(domEvents.click, '.actions.tasks .toggleHidden', async (event) =>
       await HandlerDetails.taskToggleHidden(event, this.#quest, this), edit);

      on(domEvents.click, '.history-clear', async () => await HandlerManage.clearHistory(this.#quest, this),
       () => game.user.isGM);

      on(domEvents.click, '.add-subquest-btn', async () => await HandlerManage.addSubquest(this.#quest, this), edit);

      on(domEvents.click, '.manage-allow-player-edit input[name="allow-player-edit"]', async (event) =>
       await HandlerManage.setAllowPlayerEdit(event, this.#quest, this), edit);

      on(domEvents.click, '.manage-show-in-tracker input[name="show-in-tracker"]', (event) =>
       HandlerManage.setShowInTracker(event, this.#quest));

      on(domEvents.click, '.make-personal-btn', async () => await HandlerManage.makePersonal(this.#quest, this),
       () => game.user.isGM);

      on(domEvents.click, '.make-public-btn', async () => await HandlerManage.makePublic(this.#quest, this),
       () => game.user.isGM);

      on(domEvents.click, '.configure-perm-btn', () => HandlerManage.configurePermissions(this.#quest, this), edit);

      on(domEvents.click, '.delete-splash', async () => await HandlerManage.deleteSplashImage(this.#quest, this), edit);

      on(domEvents.click, '.quest-splash input[name="splash-as-icon"]', async (event) =>
       await HandlerManage.setSplashAsIcon(event, this.#quest, this), edit);

      on(domEvents.click, '.quest-splash .drop-info',
       async () => await HandlerManage.setSplashImage(this.#quest, this), edit);

      on(domEvents.click, '.change-splash-pos', async () => await HandlerManage.setSplashPos(this.#quest, this), edit);
   }

   /**
    * Selects the active tab after rendering and optionally brings the preview to the front.
    *
    * @inheritDoc
    */
   async _onRender(context, options)
   {
      await super._onRender(context, options);

      // Show the stored tab if it exists otherwise the details tab.
      let tab = this.tabGroups.primary ?? 'details';
      if (!this.element.querySelector(`.tab[data-tab="${tab}"]`)) { tab = 'details'; }

      this.changeTab(tab, 'primary', { force: true, updatePosition: false });

      if (options.focus) { this.bringToFront(); }
   }

   /**
    * Closes all child apps and saves the quest if the user is an owner.
    *
    * @param {object}   [options] - Close options.
    *
    * @param {boolean}  [options.noSave=false] - Do not save the quest.
    *
    * @returns {Promise<QuestPreview>} This instance.
    *
    * @inheritDoc
    */
   async close({ noSave = false, ...options } = {})
   {
      FQLDialog.closeDialogs({ questId: this.#quest.id });

      if (this._ownershipControl)
      {
         this._ownershipControl.close();
         this._ownershipControl = void 0;
      }

      // Close any sheets opened from this preview.
      for (const app of this._openedApps)
      {
         if (app?.rendered) { app.close(); }
      }

      this._openedApps.length = 0;

      if (this._rewardImagePopup)
      {
         this._rewardImagePopup.close();
         this._rewardImagePopup = void 0;
      }

      if (this._splashImagePopup)
      {
         this._splashImagePopup.close();
         this._splashImagePopup = void 0;
      }

      if (!noSave && this.#quest.isOwner)
      {
         // If there is an in place edit then it must be saved before closing and the other previews are refreshed.
         if (typeof this._activeFocusOutFunction === 'function')
         {
            await this._activeFocusOutFunction(void 0, { refresh: false });

            Socket.refreshQuestPreview({
               questId: this.#quest.parent ? [this.#quest.parent, this.#quest.id, ...this.#quest.subquests] :
                [this.#quest.id, ...this.#quest.subquests],
               focus: false,
            });
         }
         else
         {
            await this.saveQuest({ refresh: false });
         }
      }

      return super.close(options);
   }

   /**
    * Retrieves the enriched quest data and sets several state parameters for GM / player / trusted player edit. The
    * raw (not enriched) rich text content is provided in `source` for the editors.
    *
    * @inheritDoc
    */
   async _prepareContext(options = {})
   {
      const context = await super._prepareContext(options);

      const content = QuestDB.getQuestEntry(this.#quest.id).enrich;

      this.canAccept = game.settings.get(constants.moduleName, settings.allowPlayersAccept);
      this.canEdit = game.user.isGM || (this.#quest.isEditOwner && Utils.isTrustedPlayerEdit());
      this.playerEdit = this.#quest.isEditOwner;

      const canEditPlayerNotes = this.#quest.canUserUpdate || game.users.activeGM !== null;

      // Players that can't edit may only view the details and player notes tabs.
      if (!this.canEdit && this.tabGroups.primary && this.tabGroups.primary !== 'details' &&
       this.tabGroups.primary !== 'playernotes' && !(this.tabGroups.primary === 'history' && content.canViewHistory))
      {
         this.tabGroups.primary = 'details';
      }

      const data = {
         isGM: game.user.isGM,
         isPlayer: !game.user.isGM,
         canAccept: this.canAccept,
         canEdit: this.canEdit,
         canEditPlayerNotes,
         playerEdit: this.playerEdit,
         showInTracker: !HandlerTracker.getRemovedQuests().has(this.#quest.id),
         source: {
            description: this.#quest.description ?? '',
            gmnotes: this.#quest.gmnotes ?? '',
            playernotes: this.#quest.playernotes ?? ''
         }
      };

      return Object.assign(context, foundry.utils.mergeObject(data, content));
   }

   /**
    * Refreshes this and all related previews.
    *
    * @returns {Promise<void>}
    */
   async refresh()
   {
      Socket.refreshQuestPreview({
         questId: this.#quest.parent ? [this.#quest.parent, this.#quest.id, ...this.#quest.subquests] :
          [this.#quest.id, ...this.#quest.subquests],
         focus: false,
      });

      await this.render({ force: true, focus: true });
   }

   /**
    * Stores the content of any changed editors in the quest, saves the quest and by default refreshes the previews.
    *
    * @param {object}   [opts] - Optional parameters.
    *
    * @param {boolean}  [opts.refresh=true] - Refresh the previews after saving.
    *
    * @returns {Promise<void>}
    */
   async saveQuest({ refresh = true } = {})
   {
      this.#flushEditors();

      await this.#quest.save();

      return refresh ? this.refresh() : void 0;
   }

   /**
    * Handles a changed `<prose-mirror>` editor. Players that can't update the quest send their player notes to the
    * GM, otherwise the quest is saved.
    *
    * @param {Event}   event - The change event.
    */
   #onEditorChange(event)
   {
      const element = event.target?.closest?.('prose-mirror');
      const name = element?.getAttribute('name');

      if (!editorNames.includes(name)) { return; }

      this.#changedEditors.add(name);

      // The editors are being saved already.
      if (this.#flushing) { return; }

      if (name === 'playernotes' && !this.#quest.canUserUpdate && game.users.activeGM)
      {
         const playernotes = FVTTCompat.getEditorContent(element);

         if (typeof playernotes === 'string')
         {
            Socket.savePlayerNotes({ quest: this.#quest, playernotes });
         }

         this.#changedEditors.delete(name);
         return;
      }

      this.saveQuest();
   }

   /**
    * Stores the content of the changed editors in the quest. Editors that are currently active w/ unsaved changes are
    * saved first.
    */
   #flushEditors()
   {
      if (!this.rendered) { return; }

      this.#flushing = true;

      try
      {
         for (const name of editorNames)
         {
            const element = this.element.querySelector(`prose-mirror[name="${name}"]`);
            if (!element) { continue; }

            if (element.open && typeof element.isDirty === 'function' && element.isDirty()) { element.save(); }

            if (this.#changedEditors.has(name))
            {
               const content = FVTTCompat.getEditorContent(element);
               if (typeof content === 'string') { this.#quest[name] = content; }
            }
         }
      }
      finally
      {
         this.#changedEditors.clear();
         this.#flushing = false;
      }
   }

   /**
    * Copies the link of the quest to the clipboard.
    *
    * @this {QuestPreview}
    *
    * @returns {Promise<void>}
    */
   static async #onCopyLink()
   {
      if (await Utils.copyTextToClipboard(`@JournalEntry[${this.#quest.id}]{${this.#quest.name}}`))
      {
         ui.notifications.info(game.i18n.format('ForienQuestLog.Notifications.LinkCopied'));
      }
   }

   /**
    * Shares the quest w/ remote clients.
    *
    * @this {QuestPreview}
    */
   static #onShareQuest()
   {
      Socket.showQuestPreview(this.#quest.id);
   }

   /**
    * Shows the splash image.
    *
    * @this {QuestPreview}
    *
    * @returns {Promise<void>}
    */
   static async #onShowSplash()
   {
      if (this.#quest.splash.length)
      {
         await HandlerDetails.splashImagePopupShow(this.#quest, this);
      }
   }
}
