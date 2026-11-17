import {
   constants,
   settings }  from '../../model/constants.js';

/**
 * Provides the delete confirmation dialogs for quests, objectives (tasks) and rewards, built on the ApplicationV2
 * `DialogV2`.
 *
 * Only a single confirmation dialog is shown at a time. Each time one of the static methods below is invoked any
 * dialog that is still open is closed (its pending Promise resolves with `undefined` / `void 0`) and a new dialog is
 * opened with the information of the successive delete confirmation operation. This provides reasonable semi-modal
 * behavior shared across confirmation to delete quests, tasks, and rewards.
 */
export class GQLDialog
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
    * @type {GQLDialogImpl}
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

      if (dialog && (dialog.gqlQuestId === questId || dialog.gqlIsQuestLog === isQuestLog))
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
         title: game.i18n.localize('QuestLog.Labels.Quest'),
         body: 'QuestLog.DeleteDialog.BodyQuest'
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
            label: game.i18n.localize('QuestLog.QuestPreview.Buttons.Accept'),
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
            label: game.i18n.localize('QuestLog.QuestPreview.Buttons.Accept'),
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
    * Asks a player if a new quest is personal (only visible to them and the GM).
    *
    * @param {object}   options - Options.
    *
    * @param {string}   options.title - Title of the dialog.
    *
    * @param {string}   options.label - Label of the checkbox.
    *
    * @param {string}   options.hint - Hint below the checkbox.
    *
    * @returns {Promise<boolean|null>} Whether the quest is personal or null if the dialog was cancelled.
    */
   static async promptPersonal({ title, label, hint })
   {
      const escape = (text) => String(text ?? '').replace(/[&<>"']/g,
       (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

      const result = await foundry.applications.api.DialogV2.prompt({
         window: { title },
         content: `<div class="form-group"><label>${escape(label)}</label><div class="form-fields">` +
          `<input type="checkbox" name="personal"></div><p class="hint">${escape(hint)}</p></div>`,
         ok: {
            label: game.i18n.localize('QuestLog.QuestPreview.Buttons.Accept'),
            callback: (event, button) => button.form.elements.personal.checked === true
         },
         rejectClose: false,
         modal: true
      });

      return typeof result === 'boolean' ? result : null;
   }

   /**
    * Shows a dialog to set the deadline of a quest (#87). With the setting `dateMode` set to `world` and a world
    * calendar with months the date is entered with the fields of the calendar; otherwise a real date and time is used.
    *
    * @param {object}   options - Options.
    *
    * @param {string}   options.title - Title of the dialog.
    *
    * @param {{mode: string, value: number}|null}   [options.deadline] - The current deadline.
    *
    * @returns {Promise<{mode: string, value: number}|{clear: true}|null>} The new deadline, `{ clear: true }` to remove
    *          it or null if the dialog was cancelled.
    */
   static async promptDeadline({ title, deadline = null })
   {
      const escape = (text) => String(text ?? '').replace(/[&<>"']/g,
       (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
      const loc = (key) => game.i18n.localize(`QuestLog.QuestPreview.Labels.${key}`);

      const calendar = game.time?.calendar;
      const months = calendar?.months?.values ?? [];

      const world = game.settings.get(constants.moduleName, settings.dateMode) === 'world' && months.length > 0;

      let content;

      if (world)
      {
         const time = deadline?.mode === 'world' ? deadline.value : game.time.worldTime;
         const comps = calendar.timeToComponents(time);

         const monthOptions = months.map((m, i) =>
         {
            const name = m.name ? game.i18n.localize(m.name) : (m.abbreviation ?? String(i + 1));
            return `<option value="${i}"${i === comps.month ? ' selected' : ''}>${escape(name)}</option>`;
         }).join('');

         const field = (label, name, value, min, max = void 0) => `<div class="form-group"><label>${escape(label)}` +
          `</label><div class="form-fields"><input type="number" name="${name}" value="${value}" min="${min}"` +
          `${max !== void 0 ? ` max="${max}"` : ''} step="1"></div></div>`;

         content = field(loc('DeadlineYear'), 'year', comps.year, -999999) +
          `<div class="form-group"><label>${escape(loc('DeadlineMonth'))}</label><div class="form-fields">` +
          `<select name="month">${monthOptions}</select></div></div>` +
          field(loc('DeadlineDay'), 'day', (comps.dayOfMonth ?? 0) + 1, 1) +
          field(loc('DeadlineHour'), 'hour', comps.hour ?? 0, 0, 23) +
          field(loc('DeadlineMinute'), 'minute', comps.minute ?? 0, 0, 59);
      }
      else
      {
         const date = new Date(deadline?.mode === 'real' ? deadline.value : Date.now());
         const pad = (n) => String(n).padStart(2, '0');
         const local = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T` +
          `${pad(date.getHours())}:${pad(date.getMinutes())}`;

         content = `<div class="form-group"><label>${escape(loc('DeadlineReal'))}</label><div class="form-fields">` +
          `<input type="datetime-local" name="real" value="${local}"></div></div>`;
      }

      const buttons = [{
         action: 'ok',
         label: game.i18n.localize('QuestLog.QuestPreview.Buttons.Accept'),
         default: true,
         callback: (event, button) =>
         {
            const elements = button.form.elements;

            if (world)
            {
               try
               {
                  const value = calendar.componentsToTime({
                     year: Math.floor(Number(elements.year.value)),
                     month: Math.floor(Number(elements.month.value)),
                     dayOfMonth: Math.max(Math.floor(Number(elements.day.value)) - 1, 0),
                     hour: Math.floor(Number(elements.hour.value)) || 0,
                     minute: Math.floor(Number(elements.minute.value)) || 0,
                     second: 0
                  });

                  return Number.isFinite(value) ? { mode: 'world', value } : null;
               }
               catch (err) { return null; }
            }

            const value = new Date(elements.real.value).getTime();
            return Number.isFinite(value) ? { mode: 'real', value } : null;
         }
      }];

      if (deadline)
      {
         buttons.push({
            action: 'clear',
            label: game.i18n.localize('QuestLog.QuestPreview.Buttons.ClearDeadline'),
            callback: () => ({ clear: true })
         });
      }

      const result = await foundry.applications.api.DialogV2.wait({
         window: { title: String(title ?? '').replace(/<[^>]*>/g, '') },
         content,
         buttons,
         rejectClose: false,
         modal: true
      });

      return result && typeof result === 'object' ? result : null;
   }

   /**
    * Shows a dialog to enter a short text with optional suggestions (a datalist).
    *
    * @param {object}   options - Options.
    *
    * @param {string}   options.title - Title of the dialog.
    *
    * @param {string}   options.label - Label of the text input.
    *
    * @param {string}   [options.hint] - Hint below the input.
    *
    * @param {string}   [options.value=''] - The initial value.
    *
    * @param {string[]} [options.suggestions=[]] - Suggested values.
    *
    * @returns {Promise<string|null>} The trimmed text (can be empty) or null if the dialog was cancelled.
    */
   static async promptText({ title, label, hint = '', value = '', suggestions = [] })
   {
      const escape = (text) => String(text ?? '').replace(/[&<>"']/g,
       (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

      const options = suggestions.map((s) => `<option value="${escape(s)}"></option>`).join('');

      const result = await foundry.applications.api.DialogV2.prompt({
         window: { title: String(title ?? '').replace(/<[^>]*>/g, '') },
         content: `<div class="form-group"><label>${escape(label)}</label><div class="form-fields">` +
          `<input type="text" name="text" value="${escape(value)}" list="gql-prompt-text-list" autofocus>` +
          `<datalist id="gql-prompt-text-list">${options}</datalist></div>` +
          `${hint ? `<p class="hint">${escape(hint)}</p>` : ''}</div>`,
         ok: {
            label: game.i18n.localize('QuestLog.QuestPreview.Buttons.Accept'),
            callback: (event, button) => String(button.form.elements.text.value ?? '').trim()
         },
         rejectClose: false,
         modal: true
      });

      return typeof result === 'string' ? result : null;
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
         title: game.i18n.localize('QuestLog.QuestPreview.Labels.Reward'),
         body: 'QuestLog.DeleteDialog.BodyReward'
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
         title: game.i18n.localize('QuestLog.QuestPreview.Labels.Objective'),
         body: 'QuestLog.DeleteDialog.BodyObjective'
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
         this.#deleteDialog = new GQLDialogImpl({ ...options, resolve });
         this.#deleteDialog.render({ force: true });
      });
   }
}

/**
 * Dialog implementation. Resolves the stored Promise with the result when the delete button is chosen and
 * with `undefined` for any other way of closing the dialog.
 */
class GQLDialogImpl extends foundry.applications.api.DialogV2
{
   /** @type {{ isQuestLog: boolean, questId: string, settle: Function }} */
   #gql;

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
            title: game.i18n.format('QuestLog.DeleteDialog.TitleDel', options),
            icon: 'fa-solid fa-trash',
            minimizable: false
         },
         content: `<h3>${game.i18n.format('QuestLog.DeleteDialog.HeaderDel', options)}</h3>` +
          `<p>${game.i18n.localize(options.body)}</p>`,
         buttons: [
            {
               action: 'yes',
               icon: 'fas fa-trash',
               label: game.i18n.localize('QuestLog.DeleteDialog.Delete'),
               callback: () => settle(options.result)
            },
            {
               action: 'no',
               icon: 'fas fa-times',
               label: game.i18n.localize('QuestLog.DeleteDialog.Cancel'),
               default: true,
               callback: () => settle(void 0)
            }
         ]
      });

      this.#gql = { isQuestLog: options.isQuestLog, questId: options.questId, settle };
   }

   /**
    * @returns {boolean} True when the dialog was opened from the quest log.
    */
   get gqlIsQuestLog() { return this.#gql.isQuestLog; }

   /**
    * @returns {string} The ID of the quest the dialog is associated with.
    */
   get gqlQuestId() { return this.#gql.questId; }

   /**
    * Any way of closing the dialog that is not a button choice resolves the Promise with `undefined`.
    *
    * @inheritDoc
    */
   _onClose(options)
   {
      this.#gql.settle(void 0);
      return super._onClose(options);
   }
}
