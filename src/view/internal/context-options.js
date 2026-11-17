import { QuestDB, Socket, Utils } from "../../control/index.js";

/**
 * @param {HTMLElement} element - The element the context menu was opened for.
 *
 * @returns {Quest|void} Quest associated with the element, if any.
 */
function getQuestFromElement(element)
{
   const questId = element?.closest?.('[data-quest-id]')?.dataset?.questId;

   return questId ? QuestDB.getQuest(questId) : void 0;
}

export const menuItemCopyLink = {
   label: 'ForienQuestLog.QuestLog.ContextMenu.CopyEntityLink',
   icon: 'fa-solid fa-link',
   onClick: async (event, target) =>
   {
      const quest = getQuestFromElement(target);

      if (quest && await Utils.copyTextToClipboard(`@JournalEntry[${quest.id}]{${quest.name}}`))
      {
         ui.notifications.info(game.i18n.format('ForienQuestLog.Notifications.LinkCopied'));
      }
   }
};

export const copyQuestId = {
   label: 'ForienQuestLog.QuestLog.ContextMenu.CopyQuestID',
   icon: 'fa-solid fa-key',
   onClick: async (event, target) =>
   {
      const quest = getQuestFromElement(target);

      if (quest && await Utils.copyTextToClipboard(quest.id))
      {
         ui.notifications.info(game.i18n.format('ForienQuestLog.Notifications.QuestIDCopied'));
      }
   }
};

export const togglePrimaryQuest = {
   label: 'ForienQuestLog.QuestLog.ContextMenu.PrimaryQuest',
   icon: 'fa-solid fa-star',
   onClick: (event, target) =>
   {
      const quest = getQuestFromElement(target);
      if (quest) { Socket.setQuestPrimary({ quest }); }
   }
};

export const jumpToPin = {
   label: "SIDEBAR.JumpPin",
   icon: 'fa-solid fa-crosshairs',
   visible: (target) => !!getQuestFromElement(target)?.entry.sceneNote,
   onClick: (event, target) =>
   {
      const quest = getQuestFromElement(target);
      quest?.entry.panToNote();
   }
};

export const duplicateQuest = {
   label: 'ForienQuestLog.QuestLog.ContextMenu.DuplicateQuest',
   icon: 'fa-solid fa-clone',
   visible: () => game.user.isGM,
   onClick: async (event, target) =>
   {
      const quest = getQuestFromElement(target);
      if (quest) { await QuestDB.duplicateQuest({ quest }); }
   }
};
