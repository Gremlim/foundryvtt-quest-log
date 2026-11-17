import {
   FoundryUIManager,
   FVTTCompat,
   ModuleSettings,
   QuestDB,
   Socket,
   ViewManager,
   Utils }              from './index.js';

import { QuestAPI }     from './public/index.js';

import { Quest }        from '../model/index.js';

import { QuestPreview } from '../view/index.js';

import { GQLDialog }    from '../view/internal/index.js';

import { RewardItem }   from './util/RewardItem.js';

import { DBMigration }  from '../../database/DBMigration.js';

import {
   constants,
   sessionConstants,
   settings }           from '../model/constants.js';

/**
 * Provides implementations for all Foundry hooks that GQL responds to and registers under. Please view the
 * {@link QuestDB} documentation for hooks that it fires in the QuestDB lifecycle.
 * {@link FoundryUIManager} documentation for hooks that it fires in the UI Manager lifecycle.
 *
 * Foundry lifecycle:
 * - `init` - {@link GQLHooks.foundryInit}
 * - `ready` - {@link GQLHooks.foundryReady} - A hook `QuestLog.Lifecycle.ready` is fired after GQL is ready.
 * - `setup` - {@link GQLHooks.foundrySetup}
 *
 * Foundry game hooks:
 * - `collapseSidebar` - {@link FoundryUIManager.collapseSidebar} - Handle tracking state of the sidebar.
 * - `dropActorSheetData` - {@link GQLHooks.dropActorSheetData} - Handle drop data for reward items in actor sheet.
 * - `dropCanvasData` - {@link GQLHooks.dropCanvasData} - Handle drop data for {@link Quest} on Foundry canvas.
 * - `getSceneControlButtons` - {@link GQLHooks.getSceneControlButtons} - Add GQL scene controls to 'note'.
 * - `hotbarDrop` - {@link GQLHooks.hotbarDrop} - Handle {@link Quest} drops to the macro hotbar.
 * - `renderJournalDirectory` - {@link GQLHooks.renderJournalDirectory} - Add 'open quest log' / show GQL folder.
 * - `renderJournalEntrySheet` / `renderJournalSheet` - {@link GQLHooks.renderJournalSheet} - Hide GQL directory from
 * journal sheet option items (ApplicationV2 / legacy ApplicationV1 sheets respectively).
 *
 * GQL hooks (response):
 * - `QuestLog.Open.QuestLog` - {@link GQLHooks.openQuestLog} - Open the quest log.
 * - `QuestLog.Open.QuestTracker` - {@link GQLHooks.openQuestTracker} - Open the quest tracker.
 * - `QuestLog.Run.DBMigration` - {@link GQLHooks.runDBMigration} - Allow GMs to run the DBMigration manually.
 *
 * GQL hooks (called):
 * - `QuestLog.Lifecycle.ready` - {@link GQLHooks.foundryReady} - Called at the end of the `ready` hook when GQL
 * is fully setup.
 */
export class GQLHooks
{
   /**
    * @private
    */
   constructor()
   {
      throw new Error('This is a static class that should not be instantiated');
   }

   /**
    * Initializes all hooks that GQL responds to in the Foundry lifecycle and in game hooks.
    */
   static init()
   {
      // Foundry startup hooks.
      Hooks.once('init', GQLHooks.foundryInit);
      Hooks.once('ready', GQLHooks.foundryReady);
      Hooks.once('setup', GQLHooks.foundrySetup);

      // Respond to Foundry in game hooks.
      Hooks.on('dropActorSheetData', GQLHooks.dropActorSheetData);
      Hooks.on('dropCanvasData', GQLHooks.dropCanvasData);
      Hooks.on('getSceneControlButtons', GQLHooks.getSceneControlButtons);
      Hooks.on('hotbarDrop', GQLHooks.hotbarDrop);
      Hooks.on('renderJournalDirectory', GQLHooks.renderJournalDirectory);
      Hooks.on('renderJournalEntrySheet', GQLHooks.renderJournalSheet);
      Hooks.on('renderJournalSheet', GQLHooks.renderJournalSheet); // Legacy ApplicationV1 sheets.

      // GQL specific hooks.
      Hooks.on('QuestLog.Open.QuestLog', GQLHooks.openQuestLog);
      Hooks.on('QuestLog.Open.QuestTracker', GQLHooks.openQuestTracker);
      Hooks.on('QuestLog.Run.DBMigration', GQLHooks.runDBMigration);
   }

   /**
    * Responds to when a data drop occurs on an ActorSheet. If there is an {@link GQLDropData} instance attached by
    * checking the `_gqlData.type` set to `reward` then process the reward item drop via {@link Socket.questRewardDrop}
    * to remove the item from the associated quest.
    *
    * @param {Actor}          actor - The Actor which received the data drop.
    *
    * @param {ActorSheet}     sheet - The ActorSheet which received the data drop.
    *
    * @param {RewardDropData} data - Any data drop, but only handle RewardDropData.
    *
    * @returns {Promise<void>}
    * @see https://foundryvtt.com/api/classes/client.Actor.html
    * @see https://foundryvtt.com/api/classes/client.ActorSheet.html
    */
   static dropActorSheetData(actor, sheet, data)
   {
      if (typeof data !== 'object' || data?._gqlData?.type !== 'reward') { return; }

      const quantity = Number(data._gqlData.quantity) || 1;

      // A reward with several units asks for the amount and creates the item on the actor itself, so the default
      // drop must be cancelled synchronously.
      if (quantity > 1)
      {
         GQLHooks.#dropRewardQuantity(actor, sheet, data, quantity);
         return false;
      }

      Socket.questRewardDrop({
         actor: { id: actor.id, name: FVTTCompat.get(actor, 'name') },
         sheet: { id: sheet.id },
         data
      });
   }

   /**
    * Asks for the amount of a reward item with several units, creates the item with that amount on the actor and
    * takes the amount from the reward of the quest.
    *
    * @param {Actor}          actor - The Actor which received the data drop.
    *
    * @param {ActorSheet}     sheet - The ActorSheet which received the data drop.
    *
    * @param {RewardDropData} data - The reward drop data.
    *
    * @param {number}         quantity - The quantity of the reward.
    *
    * @returns {Promise<void>}
    */
   static async #dropRewardQuantity(actor, sheet, data, quantity)
   {
      const amount = await GQLDialog.promptAmount({
         title: data._gqlData.itemName,
         label: game.i18n.localize('QuestLog.QuestPreview.Labels.QuantityTake'),
         value: quantity,
         min: 1,
         max: quantity
      });

      if (!amount) { return; }

      if (!await RewardItem.giveToActor(actor, data.uuid, amount)) { return; }

      await Socket.questRewardDrop({
         actor: { id: actor.id, name: FVTTCompat.get(actor, 'name') },
         sheet: { id: sheet.id },
         data: { ...data, _gqlData: { ...data._gqlData, amount } }
      });
   }

   /**
    * Converts a Quest drop on the canvas type to `JournalEntry` if the quest exists in the QuestDB.
    *
    * @param {Canvas}   foundryCanvas - The Foundry canvas.
    *
    * @param {object}   data - Drop data for canvas.
    */
   static dropCanvasData(foundryCanvas, data)
   {
      if (data.type === Quest.documentName && QuestDB.getQuest(data.id) !== void 0)
      {
         data.type = 'JournalEntry';
         data.uuid = `JournalEntry.${data.id}`;
      }
   }

   /**
    * Provides GQL initialization during the `init` Foundry lifecycle hook.
    */
   static foundryInit()
   {
      // Set the sheet to render quests.
      Quest.setSheet(QuestPreview);

      // Register GQL module settings.
      ModuleSettings.register();

      // Preload Handlebars templates and register helpers.
      Utils.preloadTemplates();
      Utils.registerHandlebarsHelpers();
   }

   /**
    * Provides the remainder of GQL initialization during the `ready` Foundry lifecycle hook.
    *
    * @returns {Promise<void>}
    */
   static async foundryReady()
   {
      // Initialize all main GUI views.
      ViewManager.init();

      // Only attempt to run DB migration for GM.
      if (game.user.isGM) { await DBMigration.migrate(); }

      // Initialize the in-memory QuestDB. Loads all quests that the user can see at this point.
      await QuestDB.init();

      // Allow and process incoming socket data.
      Socket.listen();

      // Start watching sidebar updates.
      FoundryUIManager.init();

      // Need to track any current primary quest as Foundry settings don't provide a old / new state on setting
      // change. The current primary quest state is saved in session storage.
      sessionStorage.setItem(sessionConstants.currentPrimaryQuest,
       game.settings.get(constants.moduleName, settings.primaryQuest));

      // Must set initial client storage state for quest tracker background if it doesn't exist.
      const showBackgroundState = Utils.storage.getItem(sessionConstants.trackerShowBackground);
      if (showBackgroundState !== 'true' && showBackgroundState !== 'false')
      {
         Utils.storage.setItem(sessionConstants.trackerShowBackground, 'true');
      }

      // Initialize current client based macro images based on current state.
      await Utils.setMacroImage([settings.questTrackerEnable, settings.questTrackerResizable]);

      // Show quest tracker if applicable.
      ViewManager.renderOrCloseQuestTracker();

      // Fire our own lifecycle event to inform any other modules that depend on GQL QuestDB.
      Hooks.callAll('QuestLog.Lifecycle.ready');
   }

   /**
    * Provides the setup GQL initialization during the `setup` Foundry lifecycle hook. Make the public QuestAPI
    * accessible from `game.modules.get('quest-log').public.QuestAPI`.
    */
   static foundrySetup()
   {
      const moduleData = Utils.getModuleData();

      /**
       * @type {GQLPublicAPI}
       */
      moduleData.public = {
         QuestAPI
      };

      // Freeze the public API so it can't be modified.
      Object.freeze(moduleData.public);
   }

   /**
    * Responds to the in game hook `getSceneControlButtons` to add the GQL quest log and floating quest log to the
    * journal / 'notes' tool as sub categories. These controls are always added for the GM, but if GQL is hidden from
    * players based on module setting {@link GQLSettings.hideGQLFromPlayers} the note controls do not display.
    *
    * @param {SceneControl[]} controls - The scene controls to add GQL controls.
    *
    * @see noteControls
    * @see https://foundryvtt.com/api/classes/client.SceneControls.html
    */
   static getSceneControlButtons(controls)
   {
      if (game.user.isGM || !game.settings.get(constants.moduleName, settings.hideGQLFromPlayers))
      {
         controls.notes.tools = foundry.utils.mergeObject(controls.notes.tools, FoundryUIManager.noteControls);
      }
   }

   /**
    * Handles Quest data drops. Also handles setting image state of any macro dropped from the GQL macro compendiums.
    *
    * @param {object} data - The dropped data object.
    *
    * @param {number} slot - The target hotbar slot
    *
    * @returns {Promise<void>}
    */
   static async handleMacroHotbarDrop(data, slot)
   {
      const uuid = Utils.getUUID(data);
      const document = await fromUuid(uuid);

      if (!document) { return; }

      const macroCommand = FVTTCompat.get(document, 'command');

      const existingMacro = game.macros.contents.find((m) =>
      {
         return (FVTTCompat.authorID(m) === game.user.id && FVTTCompat.get(m, 'command') === macroCommand);
      });

      let macro = existingMacro;

      // If there is no existing macro then create one.
      if (!existingMacro)
      {
         const macroData = {
            name: FVTTCompat.get(document, 'name'),
            type: FVTTCompat.get(document, 'type'),
            command: FVTTCompat.get(document, 'command'),
            img: FVTTCompat.get(document, 'img'),
            flags: FVTTCompat.get(document, 'flags')
         };

         macro = await Macro.create(macroData, { displaySheet: false });
      }

      // If the macro is from the GQL macro compendiums then update the image state.
      if (macro)
      {
         const macroSetting = macro.getFlag(constants.moduleName, 'macro-setting');

         if (macroSetting) { await Utils.setMacroImage(macroSetting); }

         await game.user.assignHotbarMacro(macro, slot);
      }
   }

   /**
    * Handles creating a macro for a Quest drop on the hotbar. Uses existing macro if possible before creating a macro.
    *
    * @param {object} data - The dropped data object.
    *
    * @param {number} slot - The target hotbar slot
    *
    * @returns {Promise<void>}
    */
   static async handleQuestHotbarDrop(data, slot)
   {
      const questId = data.id;

      const quest = QuestDB.getQuest(questId);

      // Early out if Quest isn't in the QuestDB.
      if (!quest)
      {
         throw new Error(game.i18n.localize('QuestLog.API.Hooks.Notifications.NoQuest'));
      }

      // The macro script data to open the quest via the public QuestAPI.
      const command = `game.modules.get('${constants.moduleName}').public.QuestAPI.open({ questId: '${questId}' });`;

      const macroData = {
         name: game.i18n.format('QuestLog.API.Hooks.Labels.OpenMacro', { name: quest.name }),
         type: 'script',
         command
      };

      // Determine the image for the macro. Use the splash image if `splashAsIcon` is true otherwise the giver image.
      macroData.img = quest.splashAsIcon && quest.splash.length ? quest.splash : quest?.giverData?.img;

      // Search for an already existing macro with the same command.
      let macro = game.macros.contents.find((m) => (FVTTCompat.get(m, 'command') === command));

      // If not found then create a new macro with the command.
      if (!macro)
      {
         macro = await Macro.create(macroData, { displaySheet: false });
      }

      // Assign the macro to the hotbar.
      await game.user.assignHotbarMacro(macro, slot);
   }

   /**
    * Two cases are handled. Because hooks can not be asynchronous an immediate value is returned that reflects whether
    * the drop was handled or not.
    *
    * The first case is when an GQL macro is dropped in from a compendium.
    *
    * The second is when a quest is dropped into the macro hotbar. A new Quest open macro is created. The macro command
    * invokes opening the {@link QuestPreview} via {@link QuestAPI.open} by quest ID.
    *
    * @param {Hotbar} hotbar - The Hotbar application instance.
    *
    * @param {object} data - The dropped data object.
    *
    * @param {number} slot - The target hotbar slot
    *
    * @returns {boolean} - Whether the callback was handled.
    * @see https://foundryvtt.com/api/classes/client.Hotbar.html
    */
   static hotbarDrop(hotbar, data, slot)
   {
      let handled = false;

      // Verify if the hotbar drop is data that is handled; either a quest or macro from GQL macro compendium.
      if (data.type === Quest.documentName || FVTTCompat.isGQLMacroDataTransfer(data))
      {
         handled = true;
      }

      // Wrap the handling code in an async IIFE. If this is a Quest data drop or a macro from the GQL macro compendium
      // pack then handle it.
      (async () =>
      {
         if (FVTTCompat.isGQLMacroDataTransfer(data))
         {
            await GQLHooks.handleMacroHotbarDrop(data, slot);
         }

         if (data.type === Quest.documentName)
         {
            await GQLHooks.handleQuestHotbarDrop(data, slot);
         }
      })();

      // Immediately return the handled state in the hook callback. Foundry expects false to stop the callback change.
      return !handled;
   }

   /**
    * Opens the QuestLog if the game user is a GM or if GQL isn't hidden to players by module setting
    * {@link GQLSettings.hideGQLFromPlayers}.
    *
    * @param {object}               [opts] - Optional parameters.
    *
    * @param {number|null}          [opts.left] - The left offset position in pixels.
    *
    * @param {number|null}          [opts.top] - The top offset position in pixels.
    *
    * @param {number|null}          [opts.width] - The application width in pixels.
    *
    * @param {number|string|null}   [opts.height] - The application height in pixels.
    *
    * @param {string}               [opts.tabId] - The quest status tab to open.
    */
   static openQuestLog(opts)
   {
      if (!game.user.isGM && game.settings.get(constants.moduleName, settings.hideGQLFromPlayers)) { return; }

      let constraints = {};

      let tabId;

      if (typeof opts === 'object')
      {
         // Select only constraint related parameters.
         constraints = (({ left, top, width, height }) => ({ left, top, width, height }))(opts);

         if (typeof opts.tabId === 'string') { tabId = opts.tabId; }
      }

      ViewManager.questLog.render({ force: true, focus: true, ...constraints, tabId });
   }

   /**
    * Opens the {@link QuestTracker} if the game user is a GM or if GQL isn't hidden to players by module setting
    * {@link GQLSettings.hideGQLFromPlayers}.
    *
    * @param {object}               [opts] - Optional parameters.
    *
    * @param {number|null}          [opts.left] - The left offset position in pixels.
    *
    * @param {number|null}          [opts.top] - The top offset position in pixels.
    *
    * @param {number|null}          [opts.width] - The application width in pixels.
    *
    * @param {number|null}          [opts.height] - The application height in pixels.
    *
    * @param {boolean}              [opts.pinned] - Sets the pinned state.
    *
    * @param {boolean}              [opts.primary] - Sets whether showing the primary quest is enabled.
    *
    * @param {boolean}              [opts.resizable] - Sets the resizable state.
    */
   static async openQuestTracker(opts)
   {
      if (!game.user.isGM && game.settings.get(constants.moduleName, settings.hideGQLFromPlayers)) { return; }

      await game.settings.set(constants.moduleName, settings.questTrackerEnable, true);

      if (typeof opts === 'object')
      {
         // Handle setting quest tracker primary change.
         if (typeof opts.primary === 'boolean')
         {
            Utils.storage.setItem(sessionConstants.trackerShowPrimary, (opts.primary).toString());
         }

         // Select only constraint related parameters.
         const constraints = (({ left, top, width, height, pinned }) => ({ left, top, width, height, pinned }))(opts);

         if (Object.keys(constraints).length > 0)
         {
            // Set to indicate an override of any pinned state.
            constraints.override = true;

            const tracker = ViewManager.questTracker;

            // Defer to make sure quest tracker is rendered before setting position.
            setTimeout(() =>
            {
               if (tracker.rendered) { tracker.setPosition(constraints); }
            }, 0);
         }

         // Handle setting quest tracker resizable change.
         if (typeof opts.resizable === 'boolean')
         {
            setTimeout(() =>
            {
               game.settings.set(constants.moduleName, settings.questTrackerResizable, opts.resizable);
            }, 0);
         }
      }
   }

   /**
    * Handles adding the 'open quest log' button at the bottom of the journal directory. Always displayed for the GM,
    * but only displayed to players if GQL isn't hidden via module setting {@link GQLSettings.hideGQLFromPlayers}.
    *
    * For GMs if module setting {@link GQLSettings.showFolder} is true then the hidden `_ql_quests` folder is shown.
    *
    * @param {JournalDirectory}  app - The JournalDirectory app.
    *
    * @param {HTMLElement}       html - The HTML Element for the window content of the app.
    *
    * @see https://foundryvtt.com/api/classes/client.JournalDirectory.html
    */
   static renderJournalDirectory(app, html)
   {
      const element = html instanceof HTMLElement ? html : app?.element;
      if (!(element instanceof HTMLElement)) { return; }

      if (game.user.isGM || !game.settings.get(constants.moduleName, settings.hideGQLFromPlayers))
      {
         // Avoid adding the button twice if the directory is re-rendered without replacing the element.
         if (!element.querySelector('.ql-quest-log-btn'))
         {
            const button = document.createElement('button');
            button.type = 'button';
            button.classList.add('ql-quest-log-btn');

            button.innerText = game.i18n.localize('QuestLog.QuestLog.Title');

            let footer = element.querySelector('.directory-footer');
            if (!footer)
            {
               footer = document.createElement('footer');
               footer.classList.add('directory-footer');
               element.append(footer);
            }
            footer.append(button);

            button.addEventListener('click', () => ViewManager.questLog.render({ force: true }));
         }
      }

      if (!(game.user.isGM && game.settings.get(constants.moduleName, settings.showFolder)))
      {
         const folder = Utils.getQuestFolder();
         if (folder)
         {
            element.querySelector(`.folder[data-folder-id="${folder.id}"]`)?.remove();
         }
      }
   }

   /**
    * Remove option item for quest journal folder when any journal entry is rendered. This prevents users from placing
    * non-quest journals into the quest journal folder.
    *
    * @param {JournalEntrySheet|JournalSheet}   app - The journal sheet app.
    *
    * @param {HTMLElement}                html - The element for the window content of the app.
    *
    * @see https://foundryvtt.com/api/classes/client.JournalSheet.html
    */
   static renderJournalSheet(app, html)
   {
      const element = html instanceof HTMLElement ? html : app?.element;
      if (!(element instanceof HTMLElement)) { return; }

      const folder = Utils.getQuestFolder();
      if (folder)
      {
         element.querySelector(`option[value="${folder.id}"]`)?.remove();
      }
   }

   /**
    * Provides a GM only hook to manually run DB Migration. When schemaVersion is not provided
    * {@link DBMigration.migrate} will perform migration loading this value from module settings. However, a specific
    * migration schema version can be supplied to force DB migration. To run all migration provide `0` otherwise a
    * specific schema version to start migration at which is below the max version.
    *
    * @param {number}   [schemaVersion] - A valid schema version from 0 to {@link DBMigration.version}
    *
    * @returns {Promise<void>}
    */
   static async runDBMigration(schemaVersion = void 0)
   {
      // Only GMs can run the migration.
      if (!game.user.isGM) { return; }

      await DBMigration.migrate(schemaVersion);
   }
}

/**
 * @typedef {object} GQLPublicAPI - Exposes a few GQL classes and instances publicly.
 *
 * @property {QuestAPI} QuestAPI - QuestAPI class - Exposes static methods to interact with the quest system.
 */
