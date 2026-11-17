import {
   QuestDB,
   Socket,
   Utils,
   ViewManager }     from '../../control/index.js';

import { QuestAPI }  from '../../control/public/index.js';

import { Quest }     from '../../model/index.js';

import { FQLDialog } from '../internal/index.js';

/**
 * Provides all DOM event callbacks for the {@link QuestLog}.
 */
export class HandlerLog
{
   /**
    * @private
    */
   constructor()
   {
      throw new Error('This is a static class that should not be instantiated.');
   }

   /**
    * Handles the quest add button.
    *
    * @returns {Promise<void>}
    */
   static async questAdd()
   {
      if (ViewManager.verifyQuestCanAdd())
      {
         const quest = await QuestDB.createQuest();
         if (quest) { ViewManager.questAdded({ quest }); }
      }
   }

   /**
    * Handles deleting a quest. The trashcan icon.
    *
    * @param {MouseEvent} event - MouseEvent
    *
    * @returns {Promise<void>}
    */
   static async questDelete(event)
   {
      const questId = Utils.data(event.target, 'quest-id');
      const name = Utils.data(event.target, 'quest-name');

      const result = await FQLDialog.confirmDeleteQuest({ name, result: questId, questId, isQuestLog: true });
      if (result)
      {
         await QuestDB.deleteQuest({ questId: result });
      }
   }

   /**
    * Prepares the data transfer when a quest is dragged from the {@link QuestLog}.
    *
    * @param {DragEvent} event - DragEvent
    */
   static questDragStart(event)
   {
      const dataTransfer = {
         type: Quest.documentName,
         id: Utils.data(event.target, 'quest-id')
      };

      event.dataTransfer.setData('text/plain', JSON.stringify(dataTransfer));
   }

   /**
    * Handles the quest open click via {@link QuestAPI.open}.
    *
    * @param {MouseEvent} event - MouseEvent
    */
   static questOpen(event)
   {
      const questId = Utils.data(event.target?.closest('.drag-quest'), 'quest-id');
      QuestAPI.open({ questId });
   }

   /**
    * Handles changing the quest status via {@link Socket.setQuestStatus}.
    *
    * @param {MouseEvent} event - MouseEvent
    *
    * @returns {Promise<void>}
    */
   static async questStatusSet(event)
   {
      const target = Utils.data(event.target, 'target');
      const questId = Utils.data(event.target, 'quest-id');

      const quest = QuestDB.getQuest(questId);
      if (quest) { await Socket.setQuestStatus({ quest, target }); }
   }
}