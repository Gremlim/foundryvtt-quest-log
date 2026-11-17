import {
   QuestDB,
   Socket,
   Utils }           from '../../control/index.js';

import { QuestAPI }  from '../../control/public/index.js';

import { GQLDialog } from '../internal/index.js';

/**
 * These handler DOM event callbacks can be called on any tab.
 */
export class HandlerAny
{
   /**
    * @private
    */
   constructor()
   {
      throw new Error('This is a static class that should not be instantiated.');
   }

   /**
    * Confirms deleting a quest with {@link GQLDialog.confirmDeleteQuest} before invoking {@link QuestDB.deleteQuest}.
    *
    * @param {MouseEvent} event - MouseEvent
    *
    * @param {Quest}             quest - The current quest being manipulated.
    *
    * @returns {Promise<void>}
    */
   static async questDelete(event, quest)
   {
      const questId = Utils.data(event.target, 'quest-id');
      const name = Utils.data(event.target, 'quest-name');

      const result = await GQLDialog.confirmDeleteQuest({ name, result: questId, questId: quest.id });
      if (result)
      {
         await QuestDB.deleteQuest({ questId: result });
      }
   }

   /**
    * Opens a {@link QuestPreview} via {@link QuestAPI.open}.
    *
    * @param {MouseEvent} event - MouseEvent.
    */
   static questOpen(event)
   {
      const questId = Utils.data(event.currentTarget, 'quest-id');
      QuestAPI.open({ questId });
   }

   /**
    * Potentially sets a new {@link Quest.status} via {@link Socket.setQuestStatus}. If the current user is not a GM
    * a GM level user must be logged in for a successful completion of the set status operation.
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