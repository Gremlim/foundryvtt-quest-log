import { QuestDBShim }  from './QuestDBShim.js';

import {
   Automation,
   Socket,
   ViewManager
} from '../index.js';

import {
   constants,
   sessionConstants,
   settings
} from '../../model/constants.js';

/**
 * Quest public API. QuestAPI exposes control capabilities publicly. This functionality is gated as necessary depending
 * on user level, quest observability and module settings.
 *
 * A shim to the {@link QuestDB} is available via {@link QuestAPI.DB} which exposes certain QuestDB methods that are
 * available for any player as only currently observable quests are loaded into QuestDB.
 */
class QuestAPI
{
   /**
    * @private
    */
   constructor()
   {
      throw new Error('This is a static class that should not be instantiated.');
   }

   /**
    * @returns {QuestDBShim} Public QuestDB access.
    */
   static get DB() { return QuestDBShim; }

   /**
    * Opens the Quest sheet / QuestPreview for the given questID. A check for the module setting
    * {@link GQLSettings.hideGQLFromPlayers} provides an early out if GQL is hidden from players causing the sheet to
    * not render. {@link ViewManager.questPreview} provides an object.
    *
    * @param {object}   options - Optional parameters.
    *
    * @param {string}   options.questId - Quest ID string to open.
    *
    * @param {boolean}  [options.notify=true] - Post UI notification on any error.
    */
   static open({ questId, notify = true } = {})
   {
      if (!game.user.isGM && game.settings.get(constants.moduleName, settings.hideGQLFromPlayers)) { return; }

      try
      {
         const questPreview = ViewManager.questPreview.get(questId);

         // Optimization to render an existing open QuestPreview with the given quest ID instead of opening a new
         // app / view.
         if (questPreview !== void 0)
         {
            questPreview.render({ force: true, focus: true });
            return;
         }

         const quest = QuestDBShim.getQuest(questId);

         if (quest === void 0)
         {
            if (notify)
            {
               ViewManager.notifications.warn(game.i18n.localize('QuestLog.Notifications.CannotOpen'));
            }
            else
            {
               Socket.userCantOpenQuest();
            }
            return;
         }

         if (quest.isObservable)
         {
            quest.sheet.render({ force: true, focus: true });
         }
      }
      catch (error)
      {
         if (notify)
         {
            ViewManager.notifications.error(game.i18n.localize('QuestLog.Notifications.CannotOpen'));
         }
         else
         {
            Socket.userCantOpenQuest();
         }
      }
   }

   /**
    * Opens the Quest sheet / QuestPreview for the Primary Quest
    *
    * @see QuestAPI.open
    *
    * @param {object}   options - Optional parameters.
    *
    * @param {boolean}  [options.notify=true] - Post UI notification on any error.
    */
   static openPrimary({ notify = true } = {})
   {
      const questId = sessionStorage.getItem(sessionConstants.currentPrimaryQuest);
      this.open({ questId, notify });
   }

   // Automation -----------------------------------------------------------------------------------------------------

   /**
    * Runs an automation action. A GM runs it directly and gets the result. A player forwards it to the active GM
    * (only when the world setting `allowPlayerAutomation` is enabled and a GM is connected) and only gets
    * `{ ok: true, forwarded: true }` as the GM runs it later.
    *
    * @param {string}   action - Name of the action.
    *
    * @param {object}   args - Arguments of the action.
    *
    * @returns {Promise<object>} The result `{ ok, error?, changed? }`.
    */
   static async #automate(action, args)
   {
      if (game.user.isGM) { return Automation.run({ action, args }); }

      if (!Socket.automation({ action, args })) { return { ok: false, error: 'not-allowed-or-no-gm' }; }

      return { ok: true, forwarded: true };
   }

   /**
    * Changes the status of a quest (`active`, `available`, `completed`, `failed` or `inactive`).
    *
    * @param {string}   quest - Quest ID or name.
    *
    * @param {string}   status - New status.
    *
    * @returns {Promise<object>} The result.
    */
   static setQuestStatus(quest, status) { return QuestAPI.#automate('setQuestStatus', { quest, status }); }

   /**
    * Sets an objective as `completed`, `failed` or `pending`.
    *
    * @param {string}          quest - Quest ID or name.
    *
    * @param {string|number}   objective - UUID, name or position (1 = first) of the objective.
    *
    * @param {string}          state - `completed`, `failed` or `pending`.
    *
    * @returns {Promise<object>} The result.
    */
   static setObjectiveState(quest, objective, state)
   {
      return QuestAPI.#automate('setObjectiveState', { quest, objective, state });
   }

   /**
    * Shows or hides an objective for the players.
    *
    * @param {string}          quest - Quest ID or name.
    *
    * @param {string|number}   objective - UUID, name or position (1 = first) of the objective.
    *
    * @param {boolean}         [visible=true] - True to show it, false to hide it.
    *
    * @returns {Promise<object>} The result.
    */
   static setObjectiveVisible(quest, objective, visible = true)
   {
      return QuestAPI.#automate('setObjectiveVisible', { quest, objective, visible });
   }

   /**
    * Changes the counter of an objective (reaching the target completes it).
    *
    * @param {string}          quest - Quest ID or name.
    *
    * @param {string|number}   objective - UUID, name or position (1 = first) of the objective.
    *
    * @param {object}          options - Options.
    *
    * @param {number}          [options.value] - New count.
    *
    * @param {number}          [options.delta] - Amount to add (negative to subtract) when `value` is not given.
    *
    * @returns {Promise<object>} The result.
    */
   static setObjectiveCount(quest, objective, { value, delta } = {})
   {
      return QuestAPI.#automate('setObjectiveCount', { quest, objective, value, delta });
   }

   /**
    * Marks a rumor as heard (or not heard). Hearing enough rumors unlocks the quest.
    *
    * @param {string}          quest - Quest ID or name.
    *
    * @param {string|number}   rumor - UUID, text or position (1 = first) of the rumor.
    *
    * @param {boolean}         [heard=true] - Heard state.
    *
    * @returns {Promise<object>} The result.
    */
   static hearRumor(quest, rumor, heard = true) { return QuestAPI.#automate('hearRumor', { quest, rumor, heard }); }

   /**
    * Shows or hides a rumor in the rumors tab of the players.
    *
    * @param {string}          quest - Quest ID or name.
    *
    * @param {string|number}   rumor - UUID, text or position (1 = first) of the rumor.
    *
    * @param {boolean}         [visible=true] - Visible state.
    *
    * @returns {Promise<object>} The result.
    */
   static setRumorVisible(quest, rumor, visible = true)
   {
      return QuestAPI.#automate('setRumorVisible', { quest, rumor, visible });
   }

   /**
    * Resets a quest (and its subquests): objectives pending, counters at 0, rewards restored, quest available.
    *
    * @param {string}   quest - Quest ID or name.
    *
    * @returns {Promise<object>} The result.
    */
   static resetQuest(quest) { return QuestAPI.#automate('resetQuest', { quest }); }

   // Queries (read only; players only see the quests they can observe) -----------------------------------------------

   /**
    * Returns a plain copy of the data of a quest: `{ id, name, status, parent, subquests, objectives, rumors }`.
    *
    * @param {string}   quest - Quest ID or name.
    *
    * @returns {object|null} The data or null when the quest is not found / not visible.
    */
   static getQuest(quest)
   {
      const q = QuestAPI.#find(quest);
      if (!q) { return null; }

      const plain = (text) => String(text ?? '').replace(/<[^>]*>/g, '').trim();

      return {
         id: q.id,
         name: q.name,
         status: q.status,
         parent: q.parent ?? null,
         subquests: [...q.subquests],
         objectives: q.tasks.filter((t) => game.user.isGM || !t.hidden).map((t) => ({
            uuidv4: t.uuidv4,
            name: plain(t.name),
            completed: t.completed,
            failed: t.failed,
            hidden: t.hidden,
            count: t.count,
            target: t.target
         })),
         rumors: game.user.isGM ? q.rumors.map((r) => ({
            uuidv4: r.uuidv4,
            text: plain(r.text),
            heard: r.heard,
            visible: r.visible
         })) : []
      };
   }

   /**
    * Returns the status of a quest.
    *
    * @param {string}   quest - Quest ID or name.
    *
    * @returns {string|null} `active`, `available`, `completed`, `failed`, `inactive` or null when not found.
    */
   static getStatus(quest) { return QuestAPI.#find(quest)?.status ?? null; }

   /**
    * Checks the status of a quest.
    *
    * @param {string}   quest - Quest ID or name.
    *
    * @param {string}   status - Status to check.
    *
    * @returns {boolean} True when the quest has that status.
    */
   static isStatus(quest, status) { return this.getStatus(quest) === status; }

   /**
    * Returns the data (see {@link QuestAPI.getQuest}) of the quests, optionally filtered by status.
    *
    * @param {object}   [options] - Options.
    *
    * @param {string}   [options.status] - Only the quests with this status.
    *
    * @returns {object[]} The quests.
    */
   static getQuests({ status } = {})
   {
      return QuestDBShim.getAllQuests().filter((q) => status === void 0 || q.status === status)
       .map((q) => this.getQuest(q.id)).filter((q) => q !== null);
   }

   /**
    * @param {string}   ref - Quest ID or name.
    *
    * @returns {Quest|undefined} The quest.
    */
   static #find(ref)
   {
      if (typeof ref !== 'string' || !ref.trim()) { return void 0; }
      if (!game.user.isGM && game.settings.get(constants.moduleName, settings.hideGQLFromPlayers)) { return void 0; }

      return Automation.findQuest(ref);
   }
}

Object.freeze(QuestAPI);

export { QuestAPI };