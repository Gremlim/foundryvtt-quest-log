import {
   QuestDB,
   ViewManager }                       from '../../control/index.js';

import { FQLDocumentOwnershipConfig }  from '../internal/index.js';

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