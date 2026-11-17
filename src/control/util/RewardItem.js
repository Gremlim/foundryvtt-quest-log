/**
 * Provides adding the item of an item reward to an actor.
 */
export class RewardItem
{
   constructor()
   {
      throw new Error('This is a static class that should not be instantiated.');
   }

   /**
    * Creates a copy of the item with the given UUID on the actor.
    *
    * @param {Actor}    actor - The actor.
    *
    * @param {string}   uuid - The UUID of the item.
    *
    * @param {number}   [amount] - When set and the game system stores a quantity for items the quantity of the new
    *        item is set to this amount; otherwise the quantity of the original item is kept.
    *
    * @returns {Promise<boolean>} True if the item was added to the actor.
    */
   static async giveToActor(actor, uuid, amount = void 0)
   {
      try
      {
         const item = await fromUuid(uuid);
         if (!item)
         {
            ui.notifications.warn(game.i18n.format('ForienQuestLog.QuestPreview.Notifications.BadUUID', { uuid }));
            return false;
         }

         const itemData = Item.implementation.fromCompendium?.(item) ?? item.toObject();
         delete itemData._id;

         if (Number.isFinite(amount) && foundry.utils.hasProperty(itemData, 'system.quantity'))
         {
            foundry.utils.setProperty(itemData, 'system.quantity', amount);
         }

         await actor.createEmbeddedDocuments('Item', [itemData]);
         return true;
      }
      catch (err)
      {
         console.error('ForienQuestLog - Failed to add the reward item to the actor:', err);
         ui.notifications.error(game.i18n.localize('ForienQuestLog.QuestPreview.Notifications.RewardAddFailed'));
         return false;
      }
   }
}
