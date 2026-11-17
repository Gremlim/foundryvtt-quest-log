/**
 * Provides the delete confirmation dialogs for quests, objectives (tasks) and rewards, built on the ApplicationV2
 * `DialogV2`.
 *
 * Only a single confirmation dialog is shown at a time. Each time one of the static methods below is invoked any
 * dialog that is still open is closed (its pending Promise resolves with `undefined` / `void 0`) and a new dialog is
 * opened with the information of the successive delete confirmation operation. This provides reasonable semi-modal
 * behavior shared across confirmation to delete quests, tasks, and rewards.
 */
export class FQLDialog
{
   /**
    * @private
    */
   constructor()
   {
      throw new Error('This is a static class that should not be instantiated.');
   }

   /**
    * Stores the current delete dialog.
    *
    * @type {FQLDialogImpl}
    */
   static #deleteDialog = void 0;

   /**
    * Closes any delete dialog that is associated with the given quest or the quest log.
    *
    * @param {object}   [opts] - Optional parameters.
    *
    * @param {string}   [opts.questId] - The quest ID of the dialog to close.
    *
    * @param {boolean}  [opts.isQuestLog=false] - Close dialogs that were opened from the quest log.
    */
   static closeDialogs({ questId, isQuestLog = false } = {})
   {
      const dialog = this.#deleteDialog;

      if (dialog && (dialog.fqlQuestId === questId || dialog.fqlIsQuestLog === isQuestLog))
      {
         this.#deleteDialog = void 0;
         dialog.close();
      }
   }

   /**
    * Shows a confirm dialog to delete a quest.
    *
    * @param {object}   options - Options.
    *
    * @param {string}   options.name - Name of the quest.
    *
    * @param {string}   options.result - Result to resolve with when the delete button is chosen.
    *
    * @param {string}   options.questId - ID of the quest the dialog is associated with.
    *
    * @param {boolean}  [options.isQuestLog=false] - Dialog was opened from the quest log.
    *
    * @returns {Promise<*>} `result` when confirmed otherwise `undefined`.
    */
   static async confirmDeleteQuest({ name, result, questId, isQuestLog = false })
   {
      return this.#confirm({
         name,
         result,
         questId,
         isQuestLog,
         title: game.i18n.localize('ForienQuestLog.Labels.Quest'),
         body: 'ForienQuestLog.DeleteDialog.BodyQuest'
      });
   }

   /**
    * Shows a confirm dialog to delete a reward.
    *
    * @param {object}   options - Options.
    *
    * @param {string}   options.name - Name of the reward.
    *
    * @param {string}   options.result - Result to resolve with when the delete button is chosen.
    *
    * @param {string}   options.questId - ID of the quest the dialog is associated with.
    *
    * @param {boolean}  [options.isQuestLog=false] - Dialog was opened from the quest log.
    *
    * @returns {Promise<*>} `result` when confirmed otherwise `undefined`.
    */
   static async confirmDeleteReward({ name, result, questId, isQuestLog = false })
   {
      return this.#confirm({
         name,
         result,
         questId,
         isQuestLog,
         title: game.i18n.localize('ForienQuestLog.QuestPreview.Labels.Reward'),
         body: 'ForienQuestLog.DeleteDialog.BodyReward'
      });
   }

   /**
    * Shows a confirm dialog to delete a task / objective.
    *
    * @param {object}   options - Options.
    *
    * @param {string}   options.name - Name of the task.
    *
    * @param {string}   options.result - Result to resolve with when the delete button is chosen.
    *
    * @param {string}   options.questId - ID of the quest the dialog is associated with.
    *
    * @param {boolean}  [options.isQuestLog=false] - Dialog was opened from the quest log.
    *
    * @returns {Promise<*>} `result` when confirmed otherwise `undefined`.
    */
   static async confirmDeleteTask({ name, result, questId, isQuestLog = false })
   {
      return this.#confirm({
         name,
         result,
         questId,
         isQuestLog,
         title: game.i18n.localize('ForienQuestLog.QuestPreview.Labels.Objective'),
         body: 'ForienQuestLog.DeleteDialog.BodyObjective'
      });
   }

   /**
    * Closes any open delete dialog (resolving its Promise with `undefined`) and opens a new one.
    *
    * @param {object}   options - Dialog options.
    *
    * @returns {Promise<*>} `options.result` when confirmed otherwise `undefined`.
    */
   static async #confirm(options)
   {
      const previous = this.#deleteDialog;
      this.#deleteDialog = void 0;

      if (previous) { await previous.close(); }

      return new Promise((resolve) =>
      {
         this.#deleteDialog = new FQLDialogImpl({ ...options, resolve });
         this.#deleteDialog.render({ force: true });
      });
   }
}

/**
 * Dialog implementation. Resolves the stored Promise with the result when the delete button is chosen and
 * with `undefined` for any other way of closing the dialog.
 */
class FQLDialogImpl extends foundry.applications.api.DialogV2
{
   /** @type {{ isQuestLog: boolean, questId: string, settle: Function }} */
   #fql;

   constructor(options)
   {
      let settled = false;

      // Resolves the dialog Promise exactly once.
      const settle = (value) =>
      {
         if (settled) { return; }
         settled = true;
         options.resolve(value);
      };

      super({
         window: {
            title: game.i18n.format('ForienQuestLog.DeleteDialog.TitleDel', options),
            icon: 'fa-solid fa-trash',
            minimizable: false
         },
         content: `<h3>${game.i18n.format('ForienQuestLog.DeleteDialog.HeaderDel', options)}</h3>` +
          `<p>${game.i18n.localize(options.body)}</p>`,
         buttons: [
            {
               action: 'yes',
               icon: 'fas fa-trash',
               label: game.i18n.localize('ForienQuestLog.DeleteDialog.Delete'),
               callback: () => settle(options.result)
            },
            {
               action: 'no',
               icon: 'fas fa-times',
               label: game.i18n.localize('ForienQuestLog.DeleteDialog.Cancel'),
               default: true,
               callback: () => settle(void 0)
            }
         ]
      });

      this.#fql = { isQuestLog: options.isQuestLog, questId: options.questId, settle };
   }

   /**
    * @returns {boolean} True when the dialog was opened from the quest log.
    */
   get fqlIsQuestLog() { return this.#fql.isQuestLog; }

   /**
    * @returns {string} The ID of the quest the dialog is associated with.
    */
   get fqlQuestId() { return this.#fql.questId; }

   /**
    * Any way of closing the dialog that is not a button choice resolves the Promise with `undefined`.
    *
    * @inheritDoc
    */
   _onClose(options)
   {
      this.#fql.settle(void 0);
      return super._onClose(options);
   }
}
