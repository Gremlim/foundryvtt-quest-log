import { QuestDB }  from '../../control/index.js';

/**
 * Provides all DOM event callbacks for the `rumors` tab of the quest (#82).
 */
export class HandlerRumors
{
   /**
    * @private
    */
   constructor()
   {
      throw new Error('This is a static class that should not be instantiated.');
   }

   /**
    * Shows a dialog to enter the text of a rumor.
    *
    * @param {string}   title - Title of the dialog.
    *
    * @param {string}   [value] - Current text.
    *
    * @returns {Promise<string|null>} The trimmed text or null when cancelled.
    */
   static async #promptText(title, value = '')
   {
      const result = await foundry.applications.api.DialogV2.prompt({
         window: { title },
         content: `<div class="form-group stacked"><textarea name="text" rows="5" autofocus>${
          foundry.utils.escapeHTML(value)}</textarea></div>`,
         ok: {
            label: game.i18n.localize('QuestLog.QuestPreview.Buttons.Accept'),
            callback: (event, button) => String(button.form.elements.text.value ?? '').trim()
         },
         rejectClose: false,
         modal: true
      });

      return typeof result === 'string' && result.length ? result : null;
   }

   /**
    * @param {Quest}          quest - The quest.
    *
    * @param {QuestPreview}   questPreview - The QuestPreview.
    *
    * @returns {Promise<void>}
    */
   static async add(quest, questPreview)
   {
      const text = await HandlerRumors.#promptText(game.i18n.localize('QuestLog.QuestPreview.Rumors.Add'));
      if (!text) { return; }

      quest.addRumor(text);
      await questPreview.saveQuest();
   }

   /**
    * @param {Event}          event - The click event.
    *
    * @param {Quest}          quest - The quest.
    *
    * @param {QuestPreview}   questPreview - The QuestPreview.
    *
    * @returns {Promise<void>}
    */
   static async edit(event, quest, questPreview)
   {
      const rumor = quest.getRumor(event.currentTarget.dataset.rumorId);
      if (!rumor) { return; }

      const text = await HandlerRumors.#promptText(game.i18n.localize('QuestLog.Tooltips.Edit'), rumor.text);
      if (!text) { return; }

      rumor.text = text;
      await questPreview.saveQuest();
   }

   /**
    * @param {Event}          event - The click event.
    *
    * @param {Quest}          quest - The quest.
    *
    * @param {QuestPreview}   questPreview - The QuestPreview.
    *
    * @returns {Promise<void>}
    */
   static async delete(event, quest, questPreview)
   {
      const rumor = quest.getRumor(event.currentTarget.dataset.rumorId);
      if (!rumor) { return; }

      const confirmed = await foundry.applications.api.DialogV2.confirm({
         window: { title: game.i18n.localize('QuestLog.QuestPreview.Rumors.DeleteTitle') },
         content: `<p>${game.i18n.localize('QuestLog.QuestPreview.Rumors.DeleteContent')}</p>`,
         rejectClose: false,
         modal: false
      });

      if (!confirmed) { return; }

      quest.removeRumor(rumor.uuidv4);
      await questPreview.saveQuest();
   }

   /**
    * Marks a rumor as heard / not heard. Hearing a rumor makes an inactive quest available.
    *
    * @param {Event}          event - The click event.
    *
    * @param {Quest}          quest - The quest.
    *
    * @param {QuestPreview}   questPreview - The QuestPreview.
    *
    * @returns {Promise<void>}
    */
   static async toggleHeard(event, quest, questPreview)
   {
      const statusChanged = await quest.toggleRumorHeard(event.currentTarget.dataset.rumorId);

      await questPreview.saveQuest();

      if (statusChanged)
      {
         ui.notifications.info(game.i18n.format('QuestLog.QuestPreview.Rumors.BecameAvailable',
          { name: quest.name }));

         await QuestDB.announceUnlockedByRumors();
      }
   }

   /**
    * Marks a rumor as optional (it doesn't count to unlock the quest) or required.
    *
    * @param {Event}          event - The click event.
    *
    * @param {Quest}          quest - The quest.
    *
    * @param {QuestPreview}   questPreview - The QuestPreview.
    *
    * @returns {Promise<void>}
    */
   static async toggleOptional(event, quest, questPreview)
   {
      const rumor = quest.getRumor(event.currentTarget.dataset.rumorId);
      if (!rumor) { return; }

      rumor.optional = !rumor.optional;
      await questPreview.saveQuest();
   }

   /**
    * Sets the number of rumors that must be heard to unlock the quest (0 = all the rumors that are not optional).
    *
    * @param {Event}          event - The change event.
    *
    * @param {Quest}          quest - The quest.
    *
    * @param {QuestPreview}   questPreview - The QuestPreview.
    *
    * @returns {Promise<void>}
    */
   static async setRequired(event, quest, questPreview)
   {
      const value = Math.floor(Number(event.currentTarget.value));

      quest.rumorsRequired = Number.isFinite(value) && value > 0 ? value : 0;
      await questPreview.saveQuest();
   }

   /**
    * Shows / hides a rumor to the players.
    *
    * @param {Event}          event - The click event.
    *
    * @param {Quest}          quest - The quest.
    *
    * @param {QuestPreview}   questPreview - The QuestPreview.
    *
    * @returns {Promise<void>}
    */
   static async toggleVisible(event, quest, questPreview)
   {
      if (!game.user.isGM) { return; }

      const rumor = quest.getRumor(event.currentTarget.dataset.rumorId);
      if (!rumor) { return; }

      rumor.visible = !rumor.visible;
      await questPreview.saveQuest();
   }
}
