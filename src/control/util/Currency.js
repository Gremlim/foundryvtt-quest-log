/**
 * Provides the currencies of the active game system for currency rewards and gives currency to actors. Currently the
 * `dnd5e` game system is supported; the currencies are read from the system configuration.
 */
export class Currency
{
   /**
    * The image used for currency rewards.
    *
    * @type {string}
    */
   static IMAGE = 'icons/svg/coins.svg';

   /**
    * The preferred display order of well known currency IDs.
    *
    * @type {string[]}
    */
   static #order = ['pp', 'gp', 'ep', 'sp', 'cp'];

   constructor()
   {
      throw new Error('This is a static class that should not be instantiated.');
   }

   /**
    * Gets the currencies of the active game system.
    *
    * @returns {{id: string, label: string, abbreviation: string}[]} The currencies or an empty array if the game
    *          system is not supported.
    */
   static getCurrencies()
   {
      if (game.system.id !== 'dnd5e') { return []; }

      const config = CONFIG.DND5E?.currencies;
      if (!config || typeof config !== 'object') { return []; }

      const currencies = Object.entries(config).map(([id, data]) => ({
         id,
         label: game.i18n.localize(data?.label ?? id),
         abbreviation: game.i18n.localize(data?.abbreviation ?? id)
      }));

      const rank = (id) => { const i = this.#order.indexOf(id); return i >= 0 ? i : this.#order.length; };

      return currencies.sort((a, b) => rank(a.id) - rank(b.id));
   }

   /**
    * @param {string}   id - A currency ID.
    *
    * @returns {{id: string, label: string, abbreviation: string}|void} The currency for the ID if it is available.
    */
   static get(id)
   {
      return this.getCurrencies().find((currency) => currency.id === id);
   }

   /**
    * Gets the actor that receives currency taken by the current user. For a player this is the assigned character. For
    * a GM it is the actor of the one selected token. A warning is posted if there is no actor.
    *
    * @returns {Actor|null} The recipient actor.
    */
   static getRecipientActor()
   {
      let actor = null;

      if (game.user.isGM)
      {
         const controlled = canvas?.tokens?.controlled ?? [];

         if (controlled.length === 1) { actor = controlled[0].actor ?? null; }
         else
         {
            ui.notifications.warn(game.i18n.localize('ForienQuestLog.Currency.Notifications.SelectToken'));
            return null;
         }
      }
      else
      {
         actor = game.user.character ?? null;

         if (!actor)
         {
            ui.notifications.warn(game.i18n.localize('ForienQuestLog.Currency.Notifications.NoCharacter'));
            return null;
         }
      }

      if (actor && !actor.isOwner)
      {
         ui.notifications.warn(game.i18n.localize('ForienQuestLog.Currency.Notifications.NotOwner'));
         return null;
      }

      return actor;
   }

   /**
    * Adds an amount of a currency to an actor.
    *
    * @param {Actor}    actor - The actor.
    *
    * @param {string}   id - The currency ID.
    *
    * @param {number}   amount - The amount to add.
    *
    * @returns {Promise<boolean>} True if the actor was updated.
    */
   static async giveToActor(actor, id, amount)
   {
      const path = `system.currency.${id}`;

      if (!this.get(id) || !foundry.utils.hasProperty(actor, path))
      {
         ui.notifications.warn(game.i18n.localize('ForienQuestLog.Currency.Notifications.Unsupported'));
         return false;
      }

      try
      {
         const current = Number(foundry.utils.getProperty(actor, path)) || 0;
         await actor.update({ [path]: current + amount });
         return true;
      }
      catch (err)
      {
         console.error('ForienQuestLog - Failed to add currency to the actor:', err);
         ui.notifications.error(game.i18n.localize('ForienQuestLog.Currency.Notifications.Failed'));
         return false;
      }
   }
}
