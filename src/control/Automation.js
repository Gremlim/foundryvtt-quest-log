import {
   QuestDB,
   Socket
} from './index.js';

import {
   constants,
   questStatus,
   settings
} from '../model/constants.js';

/**
 * Executes the automation actions (see {@link QuestAPI}) on the client of a GM. Players can't change quests that are
 * hidden to them, so their calls are forwarded by {@link Socket.automation} to the active GM that runs them here.
 *
 * Every action receives its arguments as plain data (so they can travel over the socket) and returns a plain result
 * `{ ok, error?, ... }`; it never throws.
 */
export class Automation
{
   /**
    * Names of the actions that can be executed.
    *
    * @type {Set<string>}
    */
   static #actions = new Set(['setQuestStatus', 'setObjectiveState', 'setObjectiveVisible', 'setObjectiveCount',
    'hearRumor', 'setRumorVisible', 'resetQuest']);

   /**
    * Executes an action. It must be called in the client of a GM.
    *
    * @param {object}   options - Options.
    *
    * @param {string}   options.action - Name of the action.
    *
    * @param {object}   [options.args] - Arguments of the action.
    *
    * @param {string}   [options.userName] - Name of the user that requested the action (for the history).
    *
    * @returns {Promise<object>} Result of the action: `{ ok: boolean, error?: string }` plus extra data.
    */
   static async run({ action, args = {}, userName = game.user.name } = {})
   {
      if (!game.user.isGM) { return { ok: false, error: 'not-gm' }; }
      if (!this.#actions.has(action)) { return { ok: false, error: 'unknown-action' }; }

      try
      {
         const quest = this.findQuest(args.quest);
         if (!quest) { return { ok: false, error: 'quest-not-found' }; }

         switch (action)
         {
            case 'setQuestStatus': return await this.#setQuestStatus(quest, args, userName);
            case 'setObjectiveState': return await this.#setObjectiveState(quest, args, userName);
            case 'setObjectiveVisible': return await this.#setObjectiveVisible(quest, args, userName);
            case 'setObjectiveCount': return await this.#setObjectiveCount(quest, args, userName);
            case 'hearRumor': return await this.#hearRumor(quest, args, userName);
            case 'setRumorVisible': return await this.#setRumorVisible(quest, args, userName);
            case 'resetQuest': return await this.#resetQuest(quest, args, userName);
         }

         return { ok: false, error: 'unknown-action' };
      }
      catch (err)
      {
         console.error(err);
         return { ok: false, error: String(err?.message ?? err) };
      }
   }

   /**
    * Finds a quest by ID or by name (ignoring case and surrounding spaces).
    *
    * @param {string}   ref - Quest ID or name.
    *
    * @returns {Quest|undefined} The quest.
    */
   static findQuest(ref)
   {
      if (typeof ref !== 'string' || !ref.trim()) { return void 0; }

      const byId = QuestDB.getQuest(ref);
      if (byId) { return byId; }

      const name = ref.trim().toLowerCase();
      return QuestDB.getAllQuests().find((q) => String(q.name ?? '').trim().toLowerCase() === name);
   }

   /**
    * Finds an objective of a quest by UUID, by name (plain text, ignoring case) or by position (1 is the first).
    *
    * @param {Quest}             quest - The quest.
    *
    * @param {string|number}     ref - UUID, name or position.
    *
    * @returns {Task|null} The objective.
    */
   static findObjective(quest, ref)
   {
      if (typeof ref === 'number') { return quest.tasks[Math.floor(ref) - 1] ?? null; }
      if (typeof ref !== 'string') { return null; }

      const byId = quest.getTask(ref);
      if (byId) { return byId; }

      const plain = (text) => String(text ?? '').replace(/<[^>]*>/g, '').trim().toLowerCase();
      const name = plain(ref);

      return quest.tasks.find((t) => plain(t.name) === name) ?? null;
   }

   /**
    * Finds a rumor of a quest by UUID, by text (plain text, ignoring case) or by position (1 is the first).
    *
    * @param {Quest}             quest - The quest.
    *
    * @param {string|number}     ref - UUID, text or position.
    *
    * @returns {object|null} The rumor.
    */
   static findRumor(quest, ref)
   {
      if (typeof ref === 'number') { return quest.rumors[Math.floor(ref) - 1] ?? null; }
      if (typeof ref !== 'string') { return null; }

      const byId = quest.getRumor(ref);
      if (byId) { return byId; }

      const plain = (text) => String(text ?? '').replace(/<[^>]*>/g, '').trim().toLowerCase();
      const text = plain(ref);

      return quest.rumors.find((r) => plain(r.text) === text) ?? null;
   }

   /**
    * Saves the quest and refreshes the views of all the clients.
    *
    * @param {Quest}   quest - The quest.
    */
   static async #finish(quest)
   {
      await quest.save();
      Socket.refreshQuestPreview({ questId: quest.getQuestIds() });
      Socket.refreshAll();
   }

   static async #setQuestStatus(quest, { status }, userName)
   {
      if (!questStatus[status]) { return { ok: false, error: 'invalid-status' }; }

      const changed = quest.status !== status;
      await quest.setStatus(status, { userName });

      if (changed)
      {
         Socket.refreshQuestPreview({ questId: quest.getQuestIds() });
         Socket.refreshAll();
      }

      return { ok: true, changed };
   }

   static async #setObjectiveState(quest, { objective, state }, userName)
   {
      const task = this.findObjective(quest, objective);
      if (!task) { return { ok: false, error: 'objective-not-found' }; }
      if (!['completed', 'failed', 'pending'].includes(state)) { return { ok: false, error: 'invalid-state' }; }

      const current = task.completed ? 'completed' : (task.failed ? 'failed' : 'pending');
      if (current === state) { return { ok: true, changed: false }; }

      if (state === 'pending') { quest.resetTask(task.uuidv4, { userName }); }
      else
      {
         task.completed = state === 'completed';
         task.failed = state === 'failed';

         if (task.completed && task.target > 0) { task.count = task.target; }
         if (task.completed && task.repeatable) { task.times++; }

         quest.addHistory({
            type: 'task',
            uuidv4: task.uuidv4,
            task: String(task.name ?? '').replace(/<[^>]*>/g, '').trim(),
            state
         }, { userName });
      }

      await this.#finish(quest);
      return { ok: true, changed: true };
   }

   static async #setObjectiveVisible(quest, { objective, visible = true })
   {
      const task = this.findObjective(quest, objective);
      if (!task) { return { ok: false, error: 'objective-not-found' }; }

      const hidden = !visible;
      if (task.hidden === hidden) { return { ok: true, changed: false }; }

      task.hidden = hidden;

      await this.#finish(quest);
      return { ok: true, changed: true };
   }

   static async #setObjectiveCount(quest, { objective, value, delta }, userName)
   {
      const task = this.findObjective(quest, objective);
      if (!task) { return { ok: false, error: 'objective-not-found' }; }
      if (!(task.target > 0)) { return { ok: false, error: 'no-counter' }; }

      const options = { userName };
      if (Number.isFinite(Number(value))) { options.value = Number(value); }
      else if (Number.isFinite(Number(delta))) { options.delta = Number(delta); }
      else { return { ok: false, error: 'invalid-count' }; }

      const before = task.count;
      quest.setTaskCount(task.uuidv4, options);

      if (task.count === before) { return { ok: true, changed: false, count: task.count }; }

      await this.#finish(quest);
      return { ok: true, changed: true, count: task.count };
   }

   static async #hearRumor(quest, { rumor, heard = true }, userName)
   {
      const entry = this.findRumor(quest, rumor);
      if (!entry) { return { ok: false, error: 'rumor-not-found' }; }

      const wanted = !!heard;
      if (entry.heard === wanted) { return { ok: true, changed: false }; }

      const unlocked = await quest.toggleRumorHeard(entry.uuidv4);
      await this.#finish(quest);

      if (unlocked) { QuestDB.announceUnlockedByRumors(); }

      return { ok: true, changed: true, unlocked };
   }

   static async #setRumorVisible(quest, { rumor, visible = true })
   {
      const entry = this.findRumor(quest, rumor);
      if (!entry) { return { ok: false, error: 'rumor-not-found' }; }

      const wanted = !!visible;
      if (entry.visible === wanted) { return { ok: true, changed: false }; }

      entry.visible = wanted;

      await this.#finish(quest);
      return { ok: true, changed: true };
   }

   static async #resetQuest(quest)
   {
      await QuestDB.resetQuest({ quest });
      Socket.refreshQuestPreview({ questId: quest.getQuestIds() });
      Socket.refreshAll();
      return { ok: true, changed: true };
   }

   /**
    * @returns {boolean} True when the players are allowed to run automation actions (forwarded to the GM).
    */
   static get playersAllowed()
   {
      return game.settings.get(constants.moduleName, settings.allowPlayerAutomation);
   }
}
