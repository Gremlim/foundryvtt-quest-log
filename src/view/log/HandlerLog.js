import {
   QuestDB,
   Socket,
   Utils,
   ViewManager }     from '../../control/index.js';

import { QuestAPI }  from '../../control/public/index.js';

import { Quest }     from '../../model/index.js';

import { sessionConstants } from '../../model/constants.js';

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
         // A player decides if the new quest is personal.
         let personal = false;
         if (!game.user.isGM)
         {
            personal = await FQLDialog.promptPersonal({
               title: game.i18n.localize('QuestLog.QuestLog.Personal.Title'),
               label: game.i18n.localize('QuestLog.QuestLog.Personal.Label'),
               hint: game.i18n.localize('QuestLog.QuestLog.Personal.Hint')
            });

            if (personal === null) { return; }
         }

         const quest = await QuestDB.createQuest({ personal });
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
    * Sets how the quests of a tab are grouped by this user.
    *
    * @param {Event}      event - The change event of the select.
    *
    * @param {QuestLog}   questLog - The QuestLog.
    */
   static groupBySet(event, questLog)
   {
      const status = event.target.dataset.tab;
      if (!status) { return; }

      sessionStorage.setItem(`${sessionConstants.logGroupBy}${status}`, event.target.value);

      questLog.render();
   }

   /**
    * Collapses / expands a group of quests of the quest log.
    *
    * @param {MouseEvent} event - MouseEvent
    *
    * @param {QuestLog}   questLog - The QuestLog.
    */
   static groupToggle(event, questLog)
   {
      const header = event.target?.closest('.group-header');
      if (!header) { return; }

      const key = `${sessionConstants.logGroupCollapsed}${header.dataset.tab}-${header.dataset.groupBy}-${header.dataset.groupKey}`;
      const collapsed = sessionStorage.getItem(key) === 'true';

      if (collapsed) { sessionStorage.removeItem(key); }
      else { sessionStorage.setItem(key, 'true'); }

      questLog.render();
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
    * Toggles a subquest between optional (bonus) and required objective of its parent quest.
    *
    * @param {MouseEvent} event - MouseEvent
    *
    * @returns {Promise<void>}
    */
   static async questToggleOptional(event)
   {
      const quest = QuestDB.getQuest(Utils.data(event.target, 'quest-id'));
      if (!quest) { return; }

      quest.optional = !quest.optional;
      await quest.save();
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