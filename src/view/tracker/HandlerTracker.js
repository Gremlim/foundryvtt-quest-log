import {
   FoundryUIManager,
   QuestDB,
   Socket,
   Utils }           from '../../control/index.js';

import { QuestAPI }  from '../../control/public/index.js';

import {
   constants,
   sessionConstants,
   settings }        from '../../model/constants.js';

/**
 * Provides all DOM event and {@link PointerEvent} callbacks for the {@link QuestTracker}.
 */
export class HandlerTracker
{
   /**
    * @private
    */
   constructor()
   {
      throw new Error('This is a static class that should not be instantiated.');
   }

   /**
    * Handles the pointer down event from the header to reset the pinned state.
    *
    * @param {PointerEvent}   event - PointerEvent
    *
    * @param {HTMLElement}    header - The app header element.
    *
    * @param {QuestTracker}   questTracker - The QuestTracker
    */
   static async headerPointerDown(event, header, questTracker)
   {
      if (event.target.classList.contains('window-title') ||
       event.target.classList.contains('window-header'))
      {
         questTracker._dragHeader = true;

         questTracker._pinned = false;

         await game.settings.set(constants.moduleName, settings.questTrackerPinned, false);

         header.setPointerCapture(event.pointerId);
      }
   }

   /**
    * Handles the pointer up event from the header to check for and set the pinned state.
    *
    * @param {PointerEvent}   event - PointerEvent
    *
    * @param {HTMLElement}    header - The app header element.
    *
    * @param {QuestTracker}   questTracker - The QuestTracker
    */
   static async headerPointerUp(event, header, questTracker)
   {
      header.releasePointerCapture(event.pointerId);
      questTracker._dragHeader = false;

      if (questTracker._inPinDropRect)
      {
         questTracker._pinned = true;
         await game.settings.set(constants.moduleName, settings.questTrackerPinned, true);
         questTracker.element.style.animation = '';
         FoundryUIManager.updateTracker();
      }
   }

   /**
    * Handles the quest open click via {@link QuestAPI.open}.
    *
    * @param {MouseEvent} event - MouseEvent
    */
   static questOpen(event)
   {
      const questId = event.currentTarget.dataset.questId;
      QuestAPI.open({ questId });
   }

   /**
    * Data for the quest folder open / close state is saved in {@link Utils.storage}.
    *
    * @param {MouseEvent} event - MouseEvent
    *
    * @param {QuestTracker} questTracker - The QuestTracker.
    */
   static questClick(event, questTracker)
   {
      const questId = event.currentTarget.dataset.questId;

      const questEntry = QuestDB.getQuestEntry(questId);
      if (questEntry && questEntry.enrich.hasObjectives)
      {
         const folderState = Utils.storage.getItem(`${sessionConstants.trackerFolderState}${questId}`);
         const collapsed = folderState !== 'false';
         Utils.storage.setItem(`${sessionConstants.trackerFolderState}${questId}`, (!collapsed).toString());

         questTracker.render();
      }
   }

   /**
    * Gets the IDs of the quests that the user removed from the tracker.
    *
    * @returns {Set<string>} Set of quest IDs.
    */
   static getRemovedQuests()
   {
      try
      {
         const ids = JSON.parse(Utils.storage.getItem(sessionConstants.trackerHiddenQuests) || '[]');
         return new Set(Array.isArray(ids) ? ids : []);
      }
      catch (err) { return new Set(); }
   }

   /**
    * Removes a quest from the tracker of this user or restores it.
    *
    * @param {MouseEvent}     event - The click event.
    *
    * @param {QuestTracker}   questTracker - The QuestTracker.
    */
   static questRemoveToggle(event, questTracker)
   {
      const questId = event.currentTarget.dataset.questId;
      if (!questId) { return; }

      HandlerTracker.setQuestRemoved(questId, !HandlerTracker.getRemovedQuests().has(questId));

      questTracker.render();
   }

   /**
    * Removes a quest from the tracker of this user or restores it without rendering the tracker.
    *
    * @param {string}   questId - The quest ID.
    *
    * @param {boolean}  removed - True to remove the quest from the tracker; false to show it again.
    */
   static setQuestRemoved(questId, removed)
   {
      const ids = HandlerTracker.getRemovedQuests();
      if (removed) { ids.add(questId); }
      else { ids.delete(questId); }

      Utils.storage.setItem(sessionConstants.trackerHiddenQuests, JSON.stringify([...ids]));
   }

   /**
    * The ways to group the quests of the tracker in the order the header button cycles through them.
    *
    * @type {string[]}
    */
   static GROUP_BY = ['none', 'group', 'giver', 'location'];

   /**
    * Gets how the quests of the tracker are grouped by this user.
    *
    * @returns {string} One of {@link HandlerTracker.GROUP_BY}.
    */
   static getGroupBy()
   {
      const value = Utils.storage.getItem(sessionConstants.trackerGroupBy);
      return HandlerTracker.GROUP_BY.includes(value) ? value : 'none';
   }

   /**
    * Handles the header button to cycle how the quests are grouped: by group, by giver, by location and not grouped.
    *
    * @param {QuestTracker}   questTracker - The QuestTracker.
    */
   static showGroups(questTracker)
   {
      const order = HandlerTracker.GROUP_BY;
      const next = order[(order.indexOf(HandlerTracker.getGroupBy()) + 1) % order.length];
      Utils.storage.setItem(sessionConstants.trackerGroupBy, next);

      // The header button icon / tooltip is updated in `QuestTracker._onRender`.
      questTracker.render();
   }

   /**
    * Collapses / expands a group of quests of the tracker.
    *
    * @param {MouseEvent}     event - The click event.
    *
    * @param {QuestTracker}   questTracker - The QuestTracker.
    */
   static groupToggle(event, questTracker)
   {
      const header = event.currentTarget;
      const key = `${sessionConstants.trackerGroupCollapsed}${HandlerTracker.getGroupBy()}-${header.dataset.groupKey ?? ''}`;

      if (Utils.storage.getItem(key) === 'true') { Utils.storage.removeItem(key); }
      else { Utils.storage.setItem(key, 'true'); }

      questTracker.render();
   }

   /**
    * Handles the header button to also show the quests removed from the tracker.
    *
    * @param {QuestTracker}   questTracker - The QuestTracker.
    */
   static showHiddenQuests(questTracker)
   {
      const newState = !(Utils.storage.getItem(sessionConstants.trackerShowHidden) === 'true');
      Utils.storage.setItem(sessionConstants.trackerShowHidden, (newState).toString());

      // The header button icon / tooltip is updated in `QuestTracker._onRender`.
      questTracker.render();
   }

   /**
    * Handles the header button to show the primary quest or all quests.
    *
    * @param {QuestTracker}   questTracker - The QuestTracker.
    */
   static questPrimaryShow(questTracker)
   {
      const newPrimary = !(Utils.storage.getItem(sessionConstants.trackerShowPrimary) === 'true');
      Utils.storage.setItem(sessionConstants.trackerShowPrimary, (newPrimary).toString());

      // The header button icon / tooltip is updated in `QuestTracker._onRender`.
      questTracker.render();
   }

   /**
    * Handles the + / - buttons of the counter of an objective in the tracker (GM or owner of the quest).
    *
    * @param {MouseEvent} event - MouseEvent
    */
   static async questTaskCounter(event)
   {
      // `questTaskToggle` ignores the clicks on the counter buttons.
      const li = event.target.closest('.quest-tracker-task');
      const quest = QuestDB.getQuest(li?.dataset.questId);
      if (!quest) { return; }

      const delta = Number(event.currentTarget.dataset.delta) || 0;

      if (quest.setTaskCount(li.dataset.uuidv4, { delta }))
      {
         await quest.save();

         Socket.refreshQuestPreview({ questId: quest.id, focus: false });
      }
   }

   /**
    * Handles toggling {@link Quest} tasks when clicked on by a user that is the GM or owner of quest.
    *
    * @param {MouseEvent} event - MouseEvent
    */
   static async questTaskToggle(event)
   {
      // Don't handle any clicks of internal anchor elements such as entity content links.
      if (event.target.matches('.quest-tracker-task a, .quest-tracker-task .counter-btn')) { return; }

      const questId = event.currentTarget.dataset.questId;
      const uuidv4 = event.currentTarget.dataset.uuidv4;

      const quest = QuestDB.getQuest(questId);

      if (quest)
      {
         if (quest.toggleTask(uuidv4))
         {
            await quest.save();

            Socket.refreshQuestPreview({
               questId,
               focus: false
            });
         }
      }
   }

   /**
    * Handles the header button to show the quest tracker background or hide it.
    *
    * @param {QuestTracker}   questTracker - The QuestTracker.
    */
   static showBackground(questTracker)
   {
      const newBackgroundState = !(Utils.storage.getItem(sessionConstants.trackerShowBackground) === 'true');
      Utils.storage.setItem(sessionConstants.trackerShowBackground, (newBackgroundState).toString());

      // The header button icon / tooltip is updated in `QuestTracker._onRender`.
      questTracker.render();
   }
}