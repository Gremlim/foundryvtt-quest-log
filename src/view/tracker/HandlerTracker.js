import {
   FoundryUIManager,
   QuestDB,
   Socket }          from '../../control/index.js';

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
    * Data for the quest folder open / close state is saved in {@link sessionStorage}.
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
         const folderState = sessionStorage.getItem(`${sessionConstants.trackerFolderState}${questId}`);
         const collapsed = folderState !== 'false';
         sessionStorage.setItem(`${sessionConstants.trackerFolderState}${questId}`, (!collapsed).toString());

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
         const ids = JSON.parse(sessionStorage.getItem(sessionConstants.trackerHiddenQuests) || '[]');
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

      const removed = HandlerTracker.getRemovedQuests();
      if (removed.has(questId)) { removed.delete(questId); }
      else { removed.add(questId); }

      sessionStorage.setItem(sessionConstants.trackerHiddenQuests, JSON.stringify([...removed]));

      questTracker.render();
   }

   /**
    * Handles the header button to also show the quests removed from the tracker.
    *
    * @param {QuestTracker}   questTracker - The QuestTracker.
    */
   static showHiddenQuests(questTracker)
   {
      const newState = !(sessionStorage.getItem(sessionConstants.trackerShowHidden) === 'true');
      sessionStorage.setItem(sessionConstants.trackerShowHidden, (newState).toString());

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
      const newPrimary = !(sessionStorage.getItem(sessionConstants.trackerShowPrimary) === 'true');
      sessionStorage.setItem(sessionConstants.trackerShowPrimary, (newPrimary).toString());

      // The header button icon / tooltip is updated in `QuestTracker._onRender`.
      questTracker.render();
   }

   /**
    * Handles toggling {@link Quest} tasks when clicked on by a user that is the GM or owner of quest.
    *
    * @param {MouseEvent} event - MouseEvent
    */
   static async questTaskToggle(event)
   {
      // Don't handle any clicks of internal anchor elements such as entity content links.
      if (event.target.matches('.quest-tracker-task a')) { return; }

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
      const newBackgroundState = !(sessionStorage.getItem(sessionConstants.trackerShowBackground) === 'true');
      sessionStorage.setItem(sessionConstants.trackerShowBackground, (newBackgroundState).toString());

      // The header button icon / tooltip is updated in `QuestTracker._onRender`.
      questTracker.render();
   }
}