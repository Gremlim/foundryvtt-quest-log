import {
   FoundryUIManager,
   QuestDB,
   Utils,
   ViewManager }     from './index.js';

import {
   constants, keybindings,
   questStatus,
   sessionConstants,
   settings
} from '../model/constants.js';

import { QuestAPI } from "./public/index.js";

/**
 * Provides registration for all module settings.
 */
export class ModuleSettings
{
   /**
    * @private
    */
   constructor()
   {
      throw new Error('This is a static class that should not be instantiated.');
   }

   /**
    * The default location for the QuestTracker
    *
    * @type {{top: number, width: number}}
    */
   static #defaultQuestTrackerPosition = { top: 80, width: 296 };

   /**
    * Constants for setting scope type.
    *
    * @type {{world: string, client: string}}
    */
   static #scope = {
      client: 'client',
      world: 'world'
   };

   /**
    * Registers all module settings and keybindings.
    */
   static register()
   {
      this.registerSettings();
      this.registerKeybindings();
   }

   /**
    * Registers all module settings.
    *
    * @see GQLSettings
    */
   static registerSettings()
   {
      game.settings.register(constants.moduleName, settings.allowPlayersDrag, {
         name: 'QuestLog.Settings.allowPlayersDrag.Enable',
         hint: 'QuestLog.Settings.allowPlayersDrag.EnableHint',
         scope: this.#scope.world,
         config: true,
         default: false,
         type: Boolean,
         onChange: async (value) =>
         {
            // Swap macro image based on current state. No need to await.
            if (game.user.isGM) { await Utils.setMacroImage(settings.allowPlayersDrag, value); }

            // Must enrich all quests again in QuestDB.
            await QuestDB.enrichAll();

            // Render all views; immediately stops / enables player drag if Quest view is open.
            ViewManager.renderAll({ force: true, questPreview: true });
         }
      });

      game.settings.register(constants.moduleName, settings.allowPlayersCreate, {
         name: 'QuestLog.Settings.allowPlayersCreate.Enable',
         hint: 'QuestLog.Settings.allowPlayersCreate.EnableHint',
         scope: this.#scope.world,
         config: true,
         default: false,
         type: Boolean,
         onChange: async (value) =>
         {
            // Swap macro image based on current state. No need to await.
            if (game.user.isGM) { await Utils.setMacroImage(settings.allowPlayersCreate, value); }

            // Render quest log to show / hide add quest button.
            if (ViewManager.questLog.rendered) { ViewManager.questLog.render(); }
         }
      });

      game.settings.register(constants.moduleName, settings.allowPlayersAccept, {
         name: 'QuestLog.Settings.allowPlayersAccept.Enable',
         hint: 'QuestLog.Settings.allowPlayersAccept.EnableHint',
         scope: this.#scope.world,
         config: true,
         default: false,
         type: Boolean,
         onChange: async (value) =>
         {
            // Swap macro image based on current state. No need to await.
            if (game.user.isGM) { await Utils.setMacroImage(settings.allowPlayersAccept, value); }

            // Must enrich all quests again in QuestDB.
            await QuestDB.enrichAll();

            // Render all views as quest status actions need to be shown or hidden for some players.
            ViewManager.renderAll({ questPreview: true });
         }
      });

      game.settings.register(constants.moduleName, settings.trustedPlayerEdit, {
         name: 'QuestLog.Settings.trustedPlayerEdit.Enable',
         hint: 'QuestLog.Settings.trustedPlayerEdit.EnableHint',
         scope: this.#scope.world,
         config: true,
         default: false,
         type: Boolean,
         onChange: async (value) =>
         {
            // Swap macro image based on current state. No need to await.
            if (game.user.isGM) { await Utils.setMacroImage(settings.trustedPlayerEdit, value); }

            // Must perform a consistency check as there are possible quests that need to be added / removed
            // from the in-memory DB based on trusted player edit status.
            await QuestDB.consistencyCheck();

            // Render all views as trusted player edit adds / removes capabilities.
            ViewManager.renderAll({ questPreview: true });
         }
      });

      game.settings.register(constants.moduleName, settings.countHidden, {
         name: 'QuestLog.Settings.countHidden.Enable',
         hint: 'QuestLog.Settings.countHidden.EnableHint',
         scope: this.#scope.world,
         config: true,
         default: false,
         type: Boolean,
         onChange: async (value) =>
         {
            // Swap macro image based on current state. No need to await.
            if (game.user.isGM) { await Utils.setMacroImage(settings.countHidden, value); }

            // Must enrich all quests again in QuestDB.
            await QuestDB.enrichAll();

            // Must render the quest log / floating quest log / quest tracker.
            ViewManager.renderAll();
         }
      });

      game.settings.register(constants.moduleName, settings.showTasks, {
         name: 'QuestLog.Settings.showTasks.Enable',
         hint: 'QuestLog.Settings.showTasks.EnableHint',
         scope: this.#scope.world,
         config: true,
         default: 'default',
         type: String,
         choices: {
            default: 'QuestLog.Settings.showTasks.default',
            onlyCurrent: 'QuestLog.Settings.showTasks.onlyCurrent',
            no: 'QuestLog.Settings.showTasks.no'
         },
         onChange: async () =>
         {
            // Must enrich all quests again in QuestDB.
            await QuestDB.enrichAll();

            // Must render the quest log.
            ViewManager.renderAll();
         }
      });

      game.settings.register(constants.moduleName, settings.defaultPermission, {
         name: 'QuestLog.Settings.defaultPermissionLevel.Enable',
         hint: 'QuestLog.Settings.defaultPermissionLevel.EnableHint',
         scope: this.#scope.world,
         config: true,
         default: 'Observer',
         type: String,
         choices: {
            OBSERVER: 'QuestLog.Settings.defaultPermissionLevel.OBSERVER',
            NONE: 'QuestLog.Settings.defaultPermissionLevel.NONE',
            OWNER: 'QuestLog.Settings.defaultPermissionLevel.OWNER'
         }
      });

      game.settings.register(constants.moduleName, settings.hideGQLFromPlayers, {
         name: 'QuestLog.Settings.hideGQLFromPlayers.Enable',
         hint: 'QuestLog.Settings.hideGQLFromPlayers.EnableHint',
         scope: this.#scope.world,
         config: true,
         default: false,
         type: Boolean,
         onChange: async(value) =>
         {
            // Swap macro image based on current state. No need to await.
            if (game.user.isGM) { await Utils.setMacroImage(settings.hideGQLFromPlayers, value); }

            if (!game.user.isGM)
            {
               // Hide all GQL apps from non GM user and remove the ui.controls for GQL.
               if (value)
               {
                  ViewManager.closeAll({ questPreview: true, updateSetting: false });

                  const controls = ui?.controls?.controls;
                  if (controls)
                  {
                     delete controls.notes.tools.quest_log;
                     delete controls.notes.tools.quest_tracker;
                  }

                  // Remove all quests from in-memory DB. This is required so that users can not retrieve quests
                  // from the QuestAPI or content links in Foundry resolve when GQL is hidden.
                  QuestDB.removeAll();
               }
               else
               {
                  // Initialize QuestDB loading all quests that are currently observable for the user.
                  await QuestDB.init();

                  // Add back ui.controls
                  const controls = ui?.controls?.controls;
                  if (controls)
                  {
                     controls.notes.tools = foundry.utils.mergeObject(controls.notes.tools, FoundryUIManager.noteControls);
                  }
               }

               ui?.controls?.render({ force: true });
            }

            // Render the journal to show / hide open quest log button & folder.
            game?.journal?.render();

            // Close or open the quest tracker based on active quests (users w/ GQL hidden will have no quests in
            // QuestDB)
            ViewManager.renderOrCloseQuestTracker({ updateSetting: false });
         }
      });

      game.settings.register(constants.moduleName, settings.notifyRewardDrop, {
         name: 'QuestLog.Settings.notifyRewardDrop.Enable',
         hint: 'QuestLog.Settings.notifyRewardDrop.EnableHint',
         scope: this.#scope.world,
         config: true,
         default: false,
         type: Boolean,
         onChange: async (value) =>
         {
            // Swap macro image based on current state. No need to await.
            if (game.user.isGM) { await Utils.setMacroImage(settings.notifyRewardDrop, value); }
         }
      });

      game.settings.register(constants.moduleName, settings.dateMode, {
         name: 'QuestLog.Settings.dateMode.Enable',
         hint: 'QuestLog.Settings.dateMode.EnableHint',
         scope: this.#scope.world,
         config: true,
         default: 'real',
         type: String,
         choices: {
            world: 'QuestLog.Settings.dateMode.world',
            real: 'QuestLog.Settings.dateMode.real'
         },
         onChange: async () =>
         {
            // The labels of the dates are generated when quests are enriched.
            await QuestDB.enrichAll();
            ViewManager.renderAll();
         }
      });

      game.settings.register(constants.moduleName, settings.historyVisibility, {
         name: 'QuestLog.Settings.historyVisibility.Enable',
         hint: 'QuestLog.Settings.historyVisibility.EnableHint',
         scope: this.#scope.world,
         config: true,
         default: 'gm',
         type: String,
         choices: {
            gm: 'QuestLog.Settings.historyVisibility.gm',
            players: 'QuestLog.Settings.historyVisibility.players'
         },
         onChange: async () =>
         {
            // Must enrich all quests again in QuestDB and render the apps to show / hide the history tab.
            await QuestDB.enrichAll();
            ViewManager.renderAll();
         }
      });

      game.settings.register(constants.moduleName, settings.showFolder, {
         name: 'QuestLog.Settings.showFolder.Enable',
         hint: 'QuestLog.Settings.showFolder.EnableHint',
         scope: this.#scope.world,
         config: true,
         default: false,
         type: Boolean,
         onChange: () => game.journal.render()  // Render the journal to show / hide the quest folder.
      });

// Settings not displayed in the module settings ---------------------------------------------------------------------

      // Currently provides a hidden setting to set the default abstract reward image.
      // It may never be displayed in the module settings menu, but if it is in the future this is where it would go.
      game.settings.register(constants.moduleName, settings.defaultAbstractRewardImage, {
         scope: this.#scope.world,
         config: false,
         default: 'icons/svg/item-bag.svg',
         type: String
      });

      game.settings.register(constants.moduleName, settings.questTrackerEnable, {
         scope: this.#scope.client,
         config: false,
         default: false,
         type: Boolean,
         onChange: async (value) =>
         {
            // Swap macro image based on current state. No need to await.
            await Utils.setMacroImage(settings.questTrackerEnable, value);

            ViewManager.renderOrCloseQuestTracker();
         }
      });

      // Rumors that are visible to the players (#82). The quests may be hidden to the players, so the GM keeps the
      // visible rumors in this world setting (see `QuestDB.syncRumors`).
      game.settings.register(constants.moduleName, settings.rumors, {
         scope: this.#scope.world,
         config: false,
         default: [],
         type: Array,
         onChange: () =>
         {
            if (ViewManager.questLog.rendered) { ViewManager.questLog.render(); }
         }
      });

      /**
       * This is the most complex module setting handling as quite a bit of logic is contained below to handle
       * setting the primary quest. Since the onChange event does not pass the old and new value the old value for
       * {@link GQLSettings.primaryQuest} is stored in {@link GQLSessionConstants.currentPrimaryQuest} which is
       * initially set in {@link GQLHooks.foundryReady}.
       *
       * This setting is set from {@link Socket.setQuestPrimary} or the handler in Socket.
       *
       * `value` may be a quest ID or an empty string.
       */
      game.settings.register(constants.moduleName, settings.primaryQuest, {
         scope: this.#scope.world,
         config: false,
         default: '',
         type: String,
         onChange: async (value) =>
         {
            // Any current primary quest.
            const currentQuestEntry = QuestDB.getQuestEntry(
             sessionStorage.getItem(sessionConstants.currentPrimaryQuest));

            // The new primary quest or none at all if value is an empty string.
            const newQuestEntry = QuestDB.getQuestEntry(value);

            // Store all quest IDs that need to be updated which include parent / subquests.
            const updateQuestIds = [];

            // Store the new primary quest name to post a notification.
            let newPrimaryQuestName = void 0;

            // Store the old primary quest IDs that need UI updates.
            if (currentQuestEntry && currentQuestEntry.id !== value)
            {
               updateQuestIds.push(...currentQuestEntry.questIds);

               // If there is a new quest then store the quest name and also all quests that need UI updates.
               if (newQuestEntry)
               {
                  newPrimaryQuestName = newQuestEntry.quest.name;
                  updateQuestIds.push(...newQuestEntry.questIds);
               }
            }
            else if (newQuestEntry)
            {
               // There was not a presently set primary quest, so store only the new
               updateQuestIds.push(...newQuestEntry.questIds);

               if (value.length) { newPrimaryQuestName = newQuestEntry.quest.name; }
            }

            // Store the current primary quest. Either Quest ID or empty string.
            sessionStorage.setItem(sessionConstants.currentPrimaryQuest, value);

            // If any quest IDs were stored then update all QuestPreviews after enriching the quest data.
            if (updateQuestIds.length)
            {
               await QuestDB.enrichQuests(...updateQuestIds);
               ViewManager.refreshQuestPreview(updateQuestIds);
               ViewManager.renderAll({ force: true });
            }

            // Post a notification if a new primary quest was set.
            if (newPrimaryQuestName)
            {
               ViewManager.notifications.info(game.i18n.format('QuestLog.Notifications.QuestPrimary',
                { name: newPrimaryQuestName }));
            }
         }
      });

      game.settings.register(constants.moduleName, settings.questTrackerPinned, {
         scope: this.#scope.client,
         config: false,
         type: Boolean,
         default: false,
         onChange: () =>
         {
            // The quest tracker pinned state has changed so update any Foundry UI management.
            FoundryUIManager.updateTrackerPinned();
         }
      });

      game.settings.register(constants.moduleName, settings.questTrackerPosition, {
         scope: this.#scope.client,
         config: false,
         default: this.#defaultQuestTrackerPosition,
      });

      game.settings.register(constants.moduleName, settings.questTrackerResizable, {
         name: 'QuestLog.Settings.questTrackerResizable.Enable',
         hint: 'QuestLog.Settings.questTrackerResizable.EnableHint',
         scope: this.#scope.client,
         config: true,
         default: false,
         type: Boolean,
         onChange: async (value) =>
         {
            ViewManager.renderOrCloseQuestTracker();

            // Swap macro image based on current state. No need to await.
            await Utils.setMacroImage(settings.questTrackerResizable, value);
         }
      });
   }

   /**
    * Registers all module settings.
    *
    * @see GQLKeybindings
    */
   static registerKeybindings()
   {

      const { SHIFT, CONTROL, ALT } = foundry.helpers.interaction.KeyboardManager.MODIFIER_KEYS;

      game.keybindings.register(constants.moduleName, keybindings.openQuestLog, {
         name: `QuestLog.Keybindings.openQuestLog.Name`,
         hint: `QuestLog.Keybindings.openQuestLog.Hint`,
         editable: [
            {
               modifiers: [CONTROL],
               key: "KeyQ",
            }
         ],
         onDown: () =>
         {
            ViewManager.questLog.render({ force: true });
         }
      });

      game.keybindings.register(constants.moduleName, keybindings.openPrimaryQuest, {
         name: `QuestLog.Keybindings.openPrimaryQuest.Name`,
         hint: `QuestLog.Keybindings.openPrimaryQuest.Hint`,
         precedence: CONST.KEYBINDING_PRECEDENCE.DEFERRED,
         editable: [
            {
               modifiers: [SHIFT, CONTROL],
               key: "KeyQ",
            }
         ],
         onDown: () =>
         {
            QuestAPI.openPrimary();
         }
      });

      game.keybindings.register(constants.moduleName, keybindings.toggleQuestTracker, {
         name: `QuestLog.Keybindings.toggleQuestTracker.Name`,
         hint: `QuestLog.Keybindings.toggleQuestTracker.Hint`,
         precedence: CONST.KEYBINDING_PRECEDENCE.DEFERRED,
         editable: [
            {
               modifiers: [SHIFT, ALT],
               key: "KeyQ",
            }
         ],
         onDown: () =>
         {
            const state = game.settings.get(constants.moduleName, settings.questTrackerEnable);
            game.settings.set(constants.moduleName, settings.questTrackerEnable, !state);
         }
      });
   }
}
