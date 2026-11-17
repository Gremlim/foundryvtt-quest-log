import {
   QuestDB,
   ViewManager }                       from '../../control/index.js';

import { FQLDocumentOwnershipConfig }  from '../internal/index.js';

import { HandlerTracker }              from '../tracker/HandlerTracker.js';

/**
 * Provides all DOM event callbacks for the `management` tab.
 */
export class HandlerManage
{
   /**
    * @private
    */
   constructor()
   {
      throw new Error('This is a static class that should not be instantiated.');
   }

   /**
    * @param {Quest}          quest - The current quest being manipulated.
    *
    * @param {QuestPreview}   questPreview - The QuestPreview being manipulated.
    *
    * @returns {Promise<void>}
    */
   static async clearHistory(quest, questPreview)
   {
      const confirmed = await foundry.applications.api.DialogV2.confirm({
         window: { title: game.i18n.localize('ForienQuestLog.QuestPreview.History.ClearTitle') },
         content: `<p>${game.i18n.format('ForienQuestLog.QuestPreview.History.ClearContent', { name: foundry.utils.escapeHTML(quest.name) })}</p>`,
         rejectClose: false,
         modal: false
      });

      if (confirmed)
      {
         quest.clearHistory();
         await questPreview.saveQuest();
      }
   }

   /**
    * Adds a subquest.
    *
    * @param {Quest}          quest - The quest.
    *
    * @param {QuestPreview}   questPreview - The QuestPreview.
    *
    * @returns {Promise<void>}
    */
   static async addSubquest(quest, questPreview)
   {
      // If a permission control app / dialog is open close it.
      if (questPreview._ownershipControl)
      {
         questPreview._ownershipControl.close();
         questPreview._ownershipControl = void 0;
      }

      if (ViewManager.verifyQuestCanAdd())
      {
         const subquest = await QuestDB.createQuest({ parentId: quest.id });
         if (subquest) { ViewManager.questAdded({ quest: subquest }); }
      }
   }

   /**
    * @param {Quest}          quest - The current quest being manipulated.
    *
    * @param {QuestPreview}   questPreview - The QuestPreview being manipulated.
    *
    * @returns {Promise<void>}
    */
   static async configurePermissions(quest, questPreview)
   {
      if (quest.entry)
      {
         if (!questPreview._ownershipControl)
         {
            questPreview._ownershipControl = new FQLDocumentOwnershipConfig({
               document: quest.entry,
               position: {
                  top: Math.min(questPreview.position.top, window.innerHeight - 350),
                  left: questPreview.position.left + 125
               }
            });
         }

         questPreview._ownershipControl.render({ force: true, focus: true });
      }
   }

   /**
    * @param {Quest}          quest - The current quest being manipulated.
    *
    * @param {QuestPreview}   questPreview - The QuestPreview being manipulated.
    *
    * @returns {Promise<void>}
    */
   static async deleteSplashImage(quest, questPreview)
   {
      quest.splash = '';
      await questPreview.saveQuest();
   }

   /**
    * Asks the GM for the players and makes the quest personal for them.
    *
    * @param {Quest}          quest - The current quest being manipulated.
    *
    * @param {QuestPreview}   questPreview - The QuestPreview being manipulated.
    *
    * @returns {Promise<void>}
    */
   static async makePersonal(quest, questPreview)
   {
      const players = game.users.filter((user) => !user.isGM);

      if (!players.length)
      {
         ui.notifications.warn(game.i18n.localize('ForienQuestLog.QuestPreview.Management.NoPlayers'));
         return;
      }

      const selected = new Set(quest.getPersonalActors().map((user) => user.id));
      const escape = (text) => foundry.utils.escapeHTML(String(text ?? ''));

      const rows = players.map((user) => `<label class="checkbox"><input type="checkbox" name="user" ` +
       `value="${escape(user.id)}"${selected.has(user.id) ? ' checked' : ''}> ${escape(user.name)}</label>`).join('<br>');

      const userIds = await foundry.applications.api.DialogV2.prompt({
         window: { title: game.i18n.localize('ForienQuestLog.QuestPreview.Management.PersonalTitle') },
         content: `<p>${game.i18n.localize('ForienQuestLog.QuestPreview.Management.PersonalContent')}</p>${rows}`,
         ok: {
            label: game.i18n.localize('ForienQuestLog.QuestPreview.Buttons.Accept'),
            callback: (event, button) => [...button.form.querySelectorAll('input[name="user"]:checked')]
             .map((input) => input.value)
         },
         rejectClose: false,
         modal: true
      });

      if (Array.isArray(userIds) && userIds.length)
      {
         await QuestDB.makePersonal({ quest, userIds });
         await questPreview.saveQuest();
      }
   }

   /**
    * Makes a personal quest public again.
    *
    * @param {Quest}          quest - The current quest being manipulated.
    *
    * @param {QuestPreview}   questPreview - The QuestPreview being manipulated.
    *
    * @returns {Promise<void>}
    */
   static async makePublic(quest, questPreview)
   {
      await QuestDB.makePublic({ quest });
      await questPreview.saveQuest();
   }

   /**
    * Shows / hides the quest in the Quest Tracker of this user only.
    *
    * @param {MouseEvent} event - MouseEvent
    *
    * @param {Quest}             quest - The current quest being manipulated.
    */
   static setShowInTracker(event, quest)
   {
      HandlerTracker.setQuestRemoved(quest.id, !event.target.checked);

      // Only the tracker of this user is affected; refresh it if it is open.
      if (ViewManager.questTracker?.rendered) { ViewManager.questTracker.render(); }
   }

   /**
    * Sets if players that own a quest created by a GM can edit it.
    *
    * @param {MouseEvent} event - MouseEvent
    *
    * @param {Quest}             quest - The current quest being manipulated.
    *
    * @param {QuestPreview}      questPreview - The QuestPreview being manipulated.
    *
    * @returns {Promise<void>}
    */
   static async setAllowPlayerEdit(event, quest, questPreview)
   {
      quest.allowPlayerEdit = event.target.checked;
      await questPreview.saveQuest();
   }

   /**
    * @param {MouseEvent} event - MouseEvent
    *
    * @param {Quest}             quest - The current quest being manipulated.
    *
    * @param {QuestPreview}      questPreview - The QuestPreview being manipulated.
    *
    * @returns {Promise<void>}
    */
   static async setSplashAsIcon(event, quest, questPreview)
   {
      quest.splashAsIcon = event.target.checked;
      await questPreview.saveQuest();
   }

   /**
    * @param {Quest}          quest - The current quest being manipulated.
    *
    * @param {QuestPreview}   questPreview - The QuestPreview being manipulated.
    *
    * @returns {Promise<void>}
    */
   static async setSplashImage(quest, questPreview)
   {
      const currentPath = quest.splash;
      await new foundry.applications.apps.FilePicker.implementation({
         type: 'image',
         current: currentPath,
         callback: async (path) =>
         {
            quest.splash = path;
            await questPreview.saveQuest();
         },
      }).browse(currentPath);
   }

   /**
    * @param {Quest}          quest - The current quest being manipulated.
    *
    * @param {QuestPreview}   questPreview - The QuestPreview being manipulated.
    *
    * @returns {Promise<void>}
    */
   static async setSplashPos(quest, questPreview)
   {
      if (quest.splashPos === 'center')
      {
         quest.splashPos = 'top';
      }
      else
      {
         quest.splashPos = quest.splashPos === 'top' ? 'bottom' : 'center';
      }

      await questPreview.saveQuest();
   }
}