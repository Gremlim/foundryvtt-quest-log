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
    * Shows a dialog to enter a whole number.
    *
    * @param {object}   options - Options.
    *
    * @param {string}   options.title - Title of the dialog.
    *
    * @param {string}   options.label - Label of the number input.
    *
    * @param {number}   [options.value=1] - The initial value.
    *
    * @param {number}   [options.min=1] - The minimum value.
    *
    * @param {number}   [options.max] - The maximum value.
    *
    * @returns {Promise<number|null>} The chosen whole number or null if the dialog was cancelled.
    */
   static async promptAmount({ title, label, value = 1, min = 1, max = void 0 })
   {
      const escape = (text) => String(text ?? '').replace(/[&<>"']/g,
       (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

      const maxAttr = Number.isFinite(max) ? ` max="${max}"` : '';

      const result = await foundry.applications.api.DialogV2.prompt({
         window: { title: String(title ?? '').replace(/<[^>]*>/g, '') },
         content: `<div class="form-group"><label>${escape(label)}</label><div class="form-fields">` +
          `<input type="number" name="amount" value="${value}" min="${min}"${maxAttr} step="1" autofocus></div></div>`,
         ok: {
            label: game.i18n.localize('ForienQuestLog.QuestPreview.Buttons.Accept'),
            callback: (event, button) => Math.floor(Number(button.form.elements.amount.value))
         },
         rejectClose: false,
         modal: true
      });

      if (!Number.isFinite(result)) { return null; }

      let amount = Math.max(result, min);
      if (Number.isFinite(max)) { amount = Math.min(amount, max); }

      return amount;
   }

   /**
    * Shows a dialog to choose a currency and an amount.
    *
    * @param {object}   options - Options.
    *
    * @param {{id: string, label: string}[]}   options.currencies - The currencies to choose from.
    *
    * @param {string}   options.title - Title of the dialog.
    *
    * @param {string}   options.currencyLabel - Label of the currency select.
    *
    * @param {string}   options.amountLabel - Label of the amount input.
    *
    * @returns {Promise<{currency: string, amount: number}|null>} The choice or null if the dialog was cancelled.
    */
   static async promptCurrency({ currencies, title, currencyLabel, amountLabel })
   {
      const escape = (text) => String(text ?? '').replace(/[&<>"']/g,
       (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

      const options = currencies.map((c) => `<option value="${escape(c.id)}">${escape(c.label)}</option>`).join('');

      const result = await foundry.applications.api.DialogV2.prompt({
         window: { title },
         content: `<div class="form-group"><label>${escape(currencyLabel)}</label><div class="form-fields">` +
          `<select name="currency">${options}</select></div></div>` +
          `<div class="form-group"><label>${escape(amountLabel)}</label><div class="form-fields">` +
          `<input type="number" name="amount" value="1" min="1" step="1" autofocus></div></div>`,
         ok: {
            label: game.i18n.localize('ForienQuestLog.QuestPreview.Buttons.Accept'),
            callback: (event, button) => ({
               currency: button.form.elements.currency.value,
               amount: Math.floor(Number(button.form.elements.amount.value))
            })
         },
         rejectClose: false,
         modal: true
      });

      if (!result || !Number.isFinite(result.amount) || result.amount < 1) { return null; }

      return result;
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
