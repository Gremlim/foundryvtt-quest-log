import {
   Socket,
   Utils }           from '../../control/index.js';

import { Quest }     from '../../model/index.js';

import { Currency }  from '../../control/util/Currency.js';

import { RewardItem } from '../../control/util/RewardItem.js';

import { FQLDialog } from '../internal/index.js';

import {
   constants,
   settings }        from '../../model/constants.js';

/**
 * Creates an inline editing `<input>` element.
 *
 * @param {object}   [opts] - Options.
 *
 * @param {string}   [opts.value] - Initial value.
 *
 * @param {string}   [opts.target] - Value for the `data-target` attribute.
 *
 * @param {string}   [opts.uuidv4] - Value for the `data-uuidv4` attribute.
 *
 * @param {number}   [opts.maxlength] - Maximum input length.
 *
 * @returns {HTMLInputElement} The input element.
 */
function createInput({ value = '', target, uuidv4, maxlength } = {})
{
   const input = document.createElement('input');
   input.type = 'text';
   input.className = 'editable-input';
   input.value = value;

   if (target !== void 0) { input.dataset.target = target; }
   if (uuidv4 !== void 0) { input.dataset.uuidv4 = uuidv4; }
   if (typeof maxlength === 'number') { input.maxLength = maxlength; }

   return input;
}

/**
 * Replaces the content of `parent` with the input, focuses it and puts the cursor at the end.
 *
 * @param {HTMLInputElement}  input - Input element.
 *
 * @param {Element}           parent - Parent element to show the input in.
 */
function showInput(input, parent)
{
   parent.replaceChildren(input);
   input.focus();
   input.setSelectionRange(input.value.length, input.value.length);
}

/**
 * Gets the previous sibling element of `element` if it matches `selector`.
 *
 * @param {Element|null}   element - An element.
 *
 * @param {string}         selector - CSS selector the sibling must match.
 *
 * @returns {Element|null} The previous sibling or null.
 */
function prevSibling(element, selector)
{
   const sibling = element?.previousElementSibling;
   return sibling && sibling.matches(selector) ? sibling : null;
}

/**
 * Handles the `Esc` key of an inline edit input; `callback` is invoked and the key event is consumed.
 *
 * @param {HTMLInputElement}  input - Input element.
 *
 * @param {Function}          callback - Invoked on `Esc` key down.
 */
function onEscape(input, callback)
{
   input.addEventListener('keydown', (event) =>
   {
      if (event.key === 'Escape')
      {
         callback();
         event.preventDefault();
         event.stopPropagation();
      }
   });
}

/**
 * Provides all delegated DOM event callbacks for the `details` tab.
 */
export class HandlerDetails
{
   /**
    * @private
    */
   constructor()
   {
      throw new Error('This is a static class that should not be instantiated.');
   }

   /**
    * @param {MouseEvent} event - The click event.
    *
    * @param {Quest}             quest - The current quest being manipulated.
    *
    * @param {QuestPreview}      questPreview - The QuestPreview being manipulated.
    */
   static questEditName(event, quest, questPreview)
   {
      const target = Utils.data(event.target, 'target');

      const input = createInput({ value: quest[target], target, maxlength: 48 });

      showInput(input, prevSibling(event.target.closest('.actions-single'), '.editable-container'));

      /**
       * Store the input focus callback in the associated QuestPreview instance so that it can be invoked if the app is
       * closed in {@link QuestPreview.close} while the input field is focused / being edited allowing any edits to be
       * saved. Otherwise the callback is invoked normally below as part of the input focus out event.
       *
       * @param {FocusEvent|void}  event - The focusout event.
       *
       * @param {object}      saveOptions - Options to pass to `saveQuest`; used in {@link QuestPreview.close}.
       *
       * @returns {Promise<void>}
       * @package
       *
       * @see QuestPreview.close
       * @see QuestPreview._activeFocusOutFunction
       */
      questPreview._activeFocusOutFunction = async (event, saveOptions = void 0) =>
      {
         const valueOut = input.value;
         questPreview._activeFocusOutFunction = void 0;

         switch (target)
         {
            case 'name':
               quest.name = valueOut;
               break;
         }
         await questPreview.saveQuest(saveOptions);
      };

      input.addEventListener('focusout', questPreview._activeFocusOutFunction);

      // Handle `Esc` key down to cancel editing.
      onEscape(input, () =>
      {
         questPreview._activeFocusOutFunction = void 0;
         questPreview.render({ force: true, focus: true });
      });
   }

   /**
    * @param {MouseEvent} event - The click event.
    *
    * @param {Quest}             quest - The current quest being manipulated.
    *
    * @param {QuestPreview}      questPreview - The QuestPreview being manipulated.
    */
   static questGiverCustomEditName(event, quest, questPreview)
   {
      const target = Utils.data(event.target, 'target');

      const input = createInput({ value: quest[target], target, maxlength: 36 });

      const parent = prevSibling(event.target.closest('.actions-single'), '.editable-container');
      parent.style.flex = '0 0 230px';

      showInput(input, parent);

      /**
       * Store the input focus callback in the associated QuestPreview instance so that it can be invoked if the app is
       * closed in {@link QuestPreview.close} while the input field is focused / being edited allowing any edits to be
       * saved. Otherwise the callback is invoked normally below as part of the input focus out event.
       *
       * @param {FocusEvent|void}  event - The focusout event.
       *
       * @param {object}      saveOptions - Options to pass to `saveQuest`; used in {@link QuestPreview.close}.
       *
       * @returns {Promise<void>}
       * @package
       *
       * @see QuestPreview.close
       * @see QuestPreview._activeFocusOutFunction
       */
      questPreview._activeFocusOutFunction = async (event, saveOptions = void 0) =>
      {
         const valueOut = input.value;
         questPreview._activeFocusOutFunction = void 0;

         switch (target)
         {
            case 'giverName':
               quest.giverName = valueOut;
               if (typeof quest.giverData === 'object') { quest.giverData.name = valueOut; }
               await questPreview.saveQuest(saveOptions);
               break;
         }
      };

      input.addEventListener('focusout', questPreview._activeFocusOutFunction);

      // Handle `Esc` key down to cancel editing.
      onEscape(input, () =>
      {
         questPreview._activeFocusOutFunction = void 0;
         questPreview.render({ force: true, focus: true });
      });
   }

   /**
    * @param {Quest}          quest - The current quest being manipulated.
    *
    * @param {QuestPreview}   questPreview - The QuestPreview being manipulated.
    */
   static questGiverCustomSelectImage(quest, questPreview)
   {
      const currentPath = quest.giver === 'abstract' ? quest.image : void 0;

      new foundry.applications.apps.FilePicker.implementation({
         type: 'image',
         current: currentPath,
         callback: async (path) =>
         {
            quest.giver = 'abstract';
            quest.image = path;
            quest.giverName = game.i18n.localize('ForienQuestLog.QuestPreview.Labels.CustomSource');
            quest.giverData = await Quest.giverFromQuest(quest);
            delete quest.giverData.uuid;

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
   static async questGiverDelete(quest, questPreview)
   {
      quest.resetGiver();
      return questPreview.saveQuest();
   }

   /**
    * @param {DragEvent}  event - The drop event.
    *
    * @param {Quest}             quest - The current quest being manipulated.
    *
    * @param {QuestPreview}      questPreview - The QuestPreview being manipulated.
    *
    * @returns {Promise<void>}
    */
   static async questGiverDropDocument(event, quest, questPreview)
   {
      event.preventDefault();

      let data;

      try
      {
         data = JSON.parse(event.dataTransfer.getData('text/plain'));
      }
      catch (err)
      {
         console.warn(`ForienQuestLog HandlerDetails.questGiverDropDocument warning: failed to parse data transfer`);
      }

      const uuid = Utils.getUUID(data, ['Actor', 'Item', 'JournalEntry']);

      if (typeof uuid === 'string')
      {
         const giverData = await Quest.giverFromUUID(uuid);
         if (giverData)
         {
            quest.giver = uuid;
            quest.giverData = giverData;
            await questPreview.saveQuest();
         }
         else
         {
            ui.notifications.warn(game.i18n.format('ForienQuestLog.QuestPreview.Notifications.BadUUID', { uuid }));
         }
      }
      else
      {
         // Slightly awkward as we need to check if this is an actor owned item specifically.
         if (typeof data?.uuid === 'string' &&
          data.uuid.startsWith('Actor') && (data.uuid.match(/\./g) || []).length > 1)
         {
            ui.notifications.warn(game.i18n.localize('ForienQuestLog.QuestPreview.Notifications.WrongDocType'));
         }
      }
   }

   /**
    * @param {MouseEvent} event - The click event.
    *
    * @param {QuestPreview}      questPreview - The QuestPreview being manipulated.
    *
    * @returns {Promise<void>}
    */
   static async questGiverShowActorSheet(event, questPreview)
   {
      const uuid = Utils.data(event.target, 'actor-uuid');

      if (typeof uuid === 'string' && uuid.length)
      {
         const sheet = await Utils.showSheetFromUUID(uuid, { editable: false });

         // If a new sheet is rendered track it so it is closed with the preview.
         if (sheet && !questPreview._openedApps.includes(sheet)) { questPreview._openedApps.push(sheet); }
      }
   }

   /**
    * @param {Quest}          quest - The current quest being manipulated.
    *
    * @param {QuestPreview}   questPreview - The QuestPreview being manipulated.
    *
    * @returns {Promise<void>}
    */
   static async questGiverToggleImage(quest, questPreview)
   {
      quest.toggleImage();

      const giverData = await Quest.giverFromQuest(quest);
      if (giverData)
      {
         quest.giverData = giverData;
         await questPreview.saveQuest();
      }
   }

   /**
    * @param {MouseEvent} event - The click event.
    *
    * @param {Quest}             quest - The current quest being manipulated.
    *
    * @param {QuestPreview}      questPreview - The QuestPreview being manipulated.
    */
   static rewardAbstractEditName(event, quest, questPreview)
   {
      const target = Utils.data(event.target, 'target');

      let value = quest[target];
      let uuidv4;

      if (target === 'reward.name')
      {
         uuidv4 = Utils.data(event.target, 'uuidv4');

         const reward = quest.getReward(uuidv4);
         if (!reward) { return; }

         value = reward.name;
      }

      const input = createInput({ value, target, uuidv4, maxlength: 96 });

      // This consumes any clicks on the input element preventing the abstract reward image popup from showing when
      // clicking on the input element.
      input.addEventListener('click', (event) => { event.stopImmediatePropagation(); });

      showInput(input, prevSibling(event.target.closest('.actions'), '.editable-container'));

      /**
       * Store the input focus callback in the associated QuestPreview instance so that it can be invoked if the app is
       * closed in {@link QuestPreview.close} while the input field is focused / being edited allowing any edits to be
       * saved. Otherwise the callback is invoked normally below as part of the input focus out event.
       *
       * @param {FocusEvent|void}  event - The focusout event.
       *
       * @param {object}      saveOptions - Options to pass to `saveQuest`; used in {@link QuestPreview.close}.
       *
       * @returns {Promise<void>}
       * @package
       *
       * @see QuestPreview.close
       * @see QuestPreview._activeFocusOutFunction
       */
      questPreview._activeFocusOutFunction = async (event, saveOptions = void 0) =>
      {
         const valueOut = input.value;
         questPreview._activeFocusOutFunction = void 0;

         switch (target)
         {
            case 'reward.name':
            {
               uuidv4 = Utils.data(input, 'uuidv4');
               const reward = quest.getReward(uuidv4);
               if (!reward) { return; }

               reward.data.name = valueOut;
               await questPreview.saveQuest(saveOptions);
               break;
            }
         }
      };

      input.addEventListener('focusout', questPreview._activeFocusOutFunction);

      // Handle `Esc` key down to cancel editing.
      onEscape(input, () =>
      {
         questPreview._activeFocusOutFunction = void 0;
         questPreview.render({ force: true, focus: true });
      });
   }

   /**
    * Creates a new abstract reward if the input entry is successful or contains data and a focus out event occurs.
    *
    * The module setting: {@link FQLSettings.defaultAbstractRewardImage} stores the default abstract reward image.
    *
    * @param {MouseEvent} event - The click event.
    *
    * @param {Quest}             quest - The current quest being manipulated.
    *
    * @param {QuestPreview}      questPreview - The QuestPreview being manipulated.
    */
   static rewardAddAbstract(event, quest, questPreview)
   {
      const li = document.createElement('li');
      li.className = 'reward';

      const input = createInput({ maxlength: 96 });

      const box = event.target.closest('.quest-rewards')?.querySelector('.rewards-box ul');

      li.append(input);
      box?.append(li);

      input.focus();

      input.addEventListener('focusout', async (event) =>
      {
         const value = event.target.value;
         if (value !== void 0 && value.length)
         {
            quest.addReward({
               data: {
                  name: value,
                  img: game.settings.get(constants.moduleName, settings.defaultAbstractRewardImage)
               },
               hidden: true,
               type: 'Abstract'
            });
         }
         await questPreview.saveQuest();
      });

      // Handle `Esc` key down to cancel editing.
      onEscape(input, () => questPreview.render({ force: true, focus: true }));
   }

   /**
    * @param {MouseEvent} event - The click event.
    *
    * @param {Quest}             quest - The current quest being manipulated.
    *
    * @param {QuestPreview}      questPreview - The QuestPreview being manipulated.
    *
    * @returns {Promise<void>}
    */
   static async rewardDelete(event, quest, questPreview)
   {
      const uuidv4 = Utils.data(event.target, 'uuidv4');
      const name = Utils.data(event.target, 'reward-name');

      // Await a semi-modal dialog.
      const result = await FQLDialog.confirmDeleteReward({ name, result: uuidv4, questId: quest.id });
      if (result)
      {
         quest.removeReward(result);

         await questPreview.saveQuest();
      }
   }

   /**
    * @param {DragEvent}   event - The dragstart event.
    *
    * @param {Quest}                   quest - The current quest being manipulated.
    */
   static rewardDragStartItem(event, quest)
   {
      // The drag data must be set synchronously; after an `await` the browser has already locked the DataTransfer.
      let data = Utils.data(event.currentTarget, 'transfer');
      if (typeof data === 'string') { try { data = JSON.parse(data); } catch (err) { data = void 0; } }
      if (!data || typeof data.uuid !== 'string') { return; }

      const uuidData = Utils.getDataFromUUID(data);

      /**
       * @type {RewardDropData}
       */
      const dataTransfer = {
         _fqlData: {
            type: 'reward',
            questId: quest.id,
            uuidv4: data.uuidv4,
            itemName: data.name,
            userName: game.user.name,
            quantity: data.quantity ?? 1,
         },
         type: 'Item',
         uuid: data.uuid,
         id: uuidData?.id
      };

      // Add compendium pack info if applicable.
      if (uuidData && uuidData.pack) { dataTransfer.pack = uuidData.pack; }

      event.dataTransfer.setData('text/plain', JSON.stringify(dataTransfer));
   }

   /**
    * @param {DragEvent}   event - The dragstart event.
    */
   static rewardDragStartSort(event)
   {
      event.stopPropagation();

      const li = event.target.closest('li') || null;
      if (!li) { return; }

      const dataTransfer = {
         type: 'Reward',
         mode: 'Sort',
         uuidv4: Utils.data(li, 'uuidv4')
      };
      event.dataTransfer.setData('text/plain', JSON.stringify(dataTransfer));
   }

   /**
    * Handles an external item reward drop. Also handles the sort reward item drop.
    *
    * @param {DragEvent}  event - The drop event.
    *
    * @param {Quest}             quest - The current quest being manipulated.
    *
    * @param {QuestPreview}      questPreview - The QuestPreview being manipulated.
    *
    * @returns {Promise<void>}
    */
   static async rewardDropItem(event, quest, questPreview)
   {
      event.preventDefault();

      let data;
      try
      {
         data = JSON.parse(event.dataTransfer.getData('text/plain'));
      }
      catch (e)
      {
         return;
      }

      if (data?.mode === 'Sort' && data?.type === 'Reward')
      {
         const dt = event.target.closest('li.reward') || null;
         quest.sortRewards(data.uuidv4, dt?.dataset.uuidv4);
         await quest.save();
         Socket.refreshQuestPreview({ questId: quest.id });
      }

      if (data?._fqlData !== void 0) { return; }

      if (data?.type === 'Actor')
      {
         const uuid = Utils.getUUID(data);

         if (typeof uuid === 'string')
         {
            const actor = await Quest.giverFromUUID(uuid);
            if (actor)
            {
               quest.addReward({ type: 'Actor', data: actor, hidden: true });
               await questPreview.saveQuest();
            }
            else
            {
               ui.notifications.warn(game.i18n.format('ForienQuestLog.QuestPreview.Notifications.BadUUID', { uuid }));
            }
         }
      }
      else if (data?.type === 'Item')
      {
         const uuid = Utils.getUUID(data);

         if (typeof uuid === 'string')
         {
            const item = await Quest.giverFromUUID(uuid);
            if (item)
            {
               quest.addReward({ type: 'Item', data: item, hidden: true });
               await questPreview.saveQuest();
            }
            else
            {
               ui.notifications.warn(game.i18n.format('ForienQuestLog.QuestPreview.Notifications.BadUUID', { uuid }));
            }
         }
         else
         {
            // Slightly awkward as we need to check if this is an actor owned item specifically.
            if (typeof data?.uuid === 'string' &&
             data.uuid.startsWith('Actor') && (data.uuid.match(/\./g) || []).length > 1)
            {
               ui.notifications.warn(game.i18n.localize('ForienQuestLog.QuestPreview.Notifications.WrongItemType'));
            }
         }
      }
   }

   /**
    * @param {Quest}          quest - The current quest being manipulated.
    *
    * @param {QuestPreview}   questPreview - The QuestPreview being manipulated.
    *
    * @returns {Promise<void>}
    */
   static async rewardsHideAll(quest, questPreview)
   {
      for (const reward of quest.rewards) {  reward.hidden = true; }
      if (quest.rewards.length) { await questPreview.saveQuest(); }
   }

   /**
    * @param {Quest}          quest - The current quest being manipulated.
    *
    * @param {QuestPreview}   questPreview - The QuestPreview being manipulated.
    *
    * @returns {Promise<void>}
    */
   static async rewardsLockAll(quest, questPreview)
   {
      for (const reward of quest.rewards) {  reward.locked = true; }
      if (quest.rewards.length) { await questPreview.saveQuest(); }
   }

   /**
    * @param {MouseEvent} event - The click event.
    *
    * @param {Quest}             quest - The current quest being manipulated.
    *
    * @param {QuestPreview}      questPreview - The QuestPreview being manipulated.
    *
    * @returns {Promise<void>}
    */
   static async rewardSelectImage(event, quest, questPreview)
   {
      const uuidv4 = Utils.data(event.target, 'uuidv4');

      let reward = quest.getReward(uuidv4);
      if (!reward) { return; }

      const currentPath = reward.data.img;
      await new foundry.applications.apps.FilePicker.implementation({
         type: 'image',
         current: currentPath,
         callback: async (path) =>
         {
            reward = quest.getReward(uuidv4);
            if (reward)
            {
               reward.data.img = path;
               await questPreview.saveQuest();
            }
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
   static async rewardsShowAll(quest, questPreview)
   {
      for (const reward of quest.rewards) {  reward.hidden = false; }
      if (quest.rewards.length) { await questPreview.saveQuest(); }
   }

   /**
    * If an abstract reward has an image set then show an image popout.
    *
    * @param {MouseEvent} event - The click event.
    *
    * @param {Quest}             quest - The current quest being manipulated.
    *
    * @param {QuestPreview}      questPreview - The QuestPreview being manipulated.
    *
    * @returns {Promise<void>}
    */
   static async rewardShowImagePopout(event, quest, questPreview)
   {
      // Check the event target and make sure it is `p.reward-name` otherwise early out.
      if (event.target && !event.target.matches('p.reward-name')) { return; }

      event.stopPropagation();

      const uuidv4 = Utils.data(event.currentTarget, 'uuidv4');

      const reward = quest.getReward(uuidv4);

      if (reward && (questPreview.canEdit || !reward.locked))
      {
         if (reward.data?.img?.length)
         {
            // ImagePopout options are frozen once created, so a visible popout is replaced.
            if (questPreview._rewardImagePopup?.rendered) { await questPreview._rewardImagePopup.close(); }

            questPreview._rewardImagePopup = new foundry.applications.apps.ImagePopout({
               src: reward.data.img,
               window: { title: reward.name ?? quest.name },
               shareable: true
            });
            await questPreview._rewardImagePopup.render({ force: true });
         }
      }
   }

   /**
    * @param {MouseEvent} event - The click event.
    *
    * @param {Quest}             quest - The current quest being manipulated.
    *
    * @param {QuestPreview}      questPreview - The QuestPreview being manipulated.
    *
    * @returns {Promise<void>}
    */
   static async rewardShowSheet(event, quest, questPreview)
   {
      event.stopPropagation();
      const data = Utils.data(event.currentTarget, 'transfer');
      const uuidv4 = Utils.data(event.currentTarget, 'uuidv4');

      const reward = quest.getReward(uuidv4);

      if (reward && (questPreview.canEdit || !reward.locked))
      {
         const sheet = await Utils.showSheetFromUUID(data, { permissionCheck: false, editable: questPreview.canEdit });

         // If a new sheet is rendered track it so it is closed with the preview.
         if (sheet && !questPreview._openedApps.includes(sheet)) { questPreview._openedApps.push(sheet); }
      }
   }

   /**
    * Adds a currency reward. If the quest already has a reward for the currency the amount is added to it.
    *
    * @param {MouseEvent} event - The click event.
    *
    * @param {Quest}             quest - The current quest being manipulated.
    *
    * @param {QuestPreview}      questPreview - The QuestPreview being manipulated.
    *
    * @returns {Promise<void>}
    */
   static async rewardAddCurrency(event, quest, questPreview)
   {
      const currencies = Currency.getCurrencies();
      if (!currencies.length) { return; }

      const choice = await FQLDialog.promptCurrency({
         currencies,
         title: game.i18n.localize('ForienQuestLog.QuestPreview.Tooltips.AddCurrency'),
         currencyLabel: game.i18n.localize('ForienQuestLog.QuestPreview.Labels.Currency'),
         amountLabel: game.i18n.localize('ForienQuestLog.QuestPreview.Labels.Quantity')
      });

      if (!choice) { return; }

      const currency = Currency.get(choice.currency);
      if (!currency) { return; }

      const existing = quest.rewards.find((r) => r.type?.toLowerCase() === 'currency' &&
       r.data?.currency === currency.id);

      if (existing) { existing.quantity += choice.amount; }
      else
      {
         quest.addReward({
            type: 'Currency',
            data: { currency: currency.id, name: currency.label, img: Currency.IMAGE },
            quantity: choice.amount,
            hidden: true
         });
      }

      await questPreview.saveQuest();
   }

   /**
    * Takes all or an amount of a currency or item reward and gives it to the actor of the user: the assigned character
    * of a player or the actor of the selected token of a GM.
    *
    * @param {MouseEvent} event - The click event.
    *
    * @param {Quest}             quest - The current quest being manipulated.
    *
    * @param {boolean}           all - Take everything instead of asking for an amount.
    *
    * @returns {Promise<void>}
    */
   static async rewardTake(event, quest, all)
   {
      const uuidv4 = Utils.data(event.target, 'uuidv4');
      const reward = quest.getReward(uuidv4);

      const type = reward?.type?.toLowerCase();
      if (type !== 'currency' && type !== 'item') { return; }

      // Players can only take unlocked rewards when they can drag rewards.
      if (!game.user.isGM && (reward.locked ||
       !game.settings.get(constants.moduleName, settings.allowPlayersDrag))) { return; }

      const isCurrency = type === 'currency';

      const currency = isCurrency ? Currency.get(reward.data.currency) : void 0;
      if (isCurrency && !currency) { return; }

      if (!isCurrency && typeof reward.data.uuid !== 'string') { return; }

      const name = isCurrency ? currency.label : reward.name;

      const actor = Currency.getRecipientActor();
      if (!actor) { return; }

      let amount = reward.quantity;

      if (!all && reward.quantity > 1)
      {
         amount = await FQLDialog.promptAmount({
            title: name,
            label: game.i18n.localize('ForienQuestLog.QuestPreview.Labels.QuantityTake'),
            value: reward.quantity,
            min: 1,
            max: reward.quantity
         });
      }

      if (!amount) { return; }

      // An item reward with a single unit keeps the quantity of the original item.
      const given = isCurrency ? await Currency.giveToActor(actor, currency.id, amount) :
       await RewardItem.giveToActor(actor, reward.data.uuid, reward.quantity > 1 ? amount : void 0);

      if (!given) { return; }

      await Socket.questRewardDrop({
         actor: { id: actor.id, name: actor.name },
         sheet: { id: null },
         data: {
            _fqlData: {
               type: 'reward',
               questId: quest.id,
               uuidv4,
               itemName: name,
               userName: game.user.name,
               quantity: reward.quantity,
               amount
            }
         }
      });
   }

   /**
    * Edits the quantity of a reward.
    *
    * @param {MouseEvent} event - The click event.
    *
    * @param {Quest}             quest - The current quest being manipulated.
    *
    * @param {QuestPreview}      questPreview - The QuestPreview being manipulated.
    *
    * @returns {Promise<void>}
    */
   static async rewardEditQuantity(event, quest, questPreview)
   {
      const uuidv4 = Utils.data(event.target, 'uuidv4');
      const reward = quest.getReward(uuidv4);
      if (!reward) { return; }

      const amount = await FQLDialog.promptAmount({
         title: reward.name,
         label: game.i18n.localize('ForienQuestLog.QuestPreview.Labels.Quantity'),
         value: reward.quantity,
         min: 1
      });

      if (amount !== null && amount !== reward.quantity)
      {
         reward.quantity = amount;
         await questPreview.saveQuest();
      }
   }

   /**
    * @param {MouseEvent} event - The click event.
    *
    * @param {Quest}             quest - The current quest being manipulated.
    *
    * @param {QuestPreview}      questPreview - The QuestPreview being manipulated.
    *
    * @returns {Promise<void>}
    */
   static async rewardToggleHidden(event, quest, questPreview)
   {
      const uuidv4 = Utils.data(event.target, 'uuidv4');
      const reward = quest.getReward(uuidv4);
      if (reward)
      {
         reward.toggleVisible();
         await questPreview.saveQuest();
      }
   }

   /**
    * @param {MouseEvent} event - The click event.
    *
    * @param {Quest}             quest - The current quest being manipulated.
    *
    * @param {QuestPreview}      questPreview - The QuestPreview being manipulated.
    *
    * @returns {Promise<void>}
    */
   static async rewardToggleLocked(event, quest, questPreview)
   {
      const uuidv4 = Utils.data(event.target, 'uuidv4');
      const reward = quest.getReward(uuidv4);
      if (reward)
      {
         reward.toggleLocked();
         await questPreview.saveQuest();
      }
   }

   /**
    * @param {Quest}          quest - The current quest being manipulated.
    *
    * @param {QuestPreview}   questPreview - The QuestPreview being manipulated.
    *
    * @returns {Promise<void>}
    */
   static async rewardsUnlockAll(quest, questPreview)
   {
      for (const reward of quest.rewards) {  reward.locked = false; }
      if (quest.rewards.length) { await questPreview.saveQuest(); }
   }

   /**
    * @param {Quest}          quest - The current quest being manipulated.
    *
    * @param {QuestPreview}   questPreview - The QuestPreview being manipulated.
    */
   static async splashImagePopupShow(quest, questPreview)
   {
      if (questPreview._splashImagePopup?.rendered)
      {
         questPreview._splashImagePopup.bringToFront();
      }
      else
      {
         questPreview._splashImagePopup = new foundry.applications.apps.ImagePopout({
            src: quest.splash,
            window: { title: quest.name },
            shareable: true
         });
         await questPreview._splashImagePopup.render({ force: true });
      }
   }

   /**
    * @param {MouseEvent} event - The click event.
    *
    * @param {Quest}             quest - The current quest being manipulated.
    *
    * @param {QuestPreview}      questPreview - The QuestPreview being manipulated.
    */
   static taskAdd(event, quest, questPreview)
   {
      event.preventDefault();

      const li = document.createElement('li');
      li.className = 'task';

      const placeholder = document.createElement('span');
      placeholder.innerHTML = '<i class="fas fa-check hidden"></i>';

      const input = createInput();

      const box = event.target.closest('.quest-tasks')?.querySelector('.tasks-box ul');

      li.append(placeholder, input);
      box?.append(li);

      input.focus();

      input.addEventListener('focusout', async (event) =>
      {
         const value = event.target.value;
         if (value !== void 0 && value.length)
         {
            quest.addTask({ name: value, hidden: questPreview.canEdit });
         }
         await questPreview.saveQuest();
      });

      // Handle `Esc` key down to cancel editing.
      onEscape(input, () => questPreview.render({ force: true, focus: true }));
   }

   /**
    * @param {MouseEvent} event - The click event.
    *
    * @param {Quest}             quest - The current quest being manipulated.
    *
    * @param {QuestPreview}      questPreview - The QuestPreview being manipulated.
    *
    * @returns {Promise<void>}
    */
   static async taskDelete(event, quest, questPreview)
   {
      const uuidv4 = Utils.data(event.target, 'uuidv4');
      const name = Utils.data(event.target, 'task-name');

      const result = await FQLDialog.confirmDeleteTask({ name, result: uuidv4, questId: quest.id });
      if (result)
      {
         quest.removeTask(result);

         await questPreview.saveQuest();
      }
   }

   /**
    * @param {DragEvent}   event - The dragstart event.
    */
   static taskDragStartSort(event)
   {
      event.stopPropagation();

      const li = event.target.closest('li') || null;
      if (!li) { return; }

      const dataTransfer = {
         type: 'Task',
         mode: 'Sort',
         uuidv4: Utils.data(li, 'uuidv4')
      };

      event.dataTransfer.setData('text/plain', JSON.stringify(dataTransfer));
   }

   /**
    * @param {DragEvent}  event - The drop event.
    *
    * @param {Quest}             quest - The current quest being manipulated.
    *
    * @returns {Promise<void>}
    */
   static async taskDropItem(event, quest)
   {
      event.preventDefault();

      let data;
      try
      {
         data = JSON.parse(event.dataTransfer.getData('text/plain'));
      }
      catch (e)
      {
         return;
      }

      if (data?.mode === 'Sort' && data?.type === 'Task')
      {
         const dt = event.target.closest('li.task') || null;
         quest.sortTasks(data.uuidv4, dt?.dataset.uuidv4);
         await quest.save();
         Socket.refreshQuestPreview({ questId: quest.id });
      }
   }

   /**
    * @param {MouseEvent} event - The click event.
    *
    * @param {Quest}             quest - The current quest being manipulated.
    *
    * @param {QuestPreview}      questPreview - The QuestPreview being manipulated.
    */
   static taskEditName(event, quest, questPreview)
   {
      const target = Utils.data(event.target, 'target');
      let uuidv4 = Utils.data(event.target, 'uuidv4');
      let task = quest.getTask(uuidv4);

      // Early out conditional if the target isn't `task.name` or the task doesn't exist.
      if (target === void 0 || target !== 'task.name' || !task) { return; }

      let value = task.name;

      const input = createInput({ value, target, uuidv4 });

      showInput(input, prevSibling(event.target.closest('.actions'), '.editable-container'));

      /**
       * Store the input focus callback in the associated QuestPreview instance so that it can be invoked if the app is
       * closed in {@link QuestPreview.close} while the input field is focused / being edited allowing any edits to be
       * saved. Otherwise the callback is invoked normally below as part of the input focus out event.
       *
       * @param {FocusEvent|void}  event -The focusout event.
       *
       * @param {object}      saveOptions - Options to pass to `saveQuest`; used in {@link QuestPreview.close}.
       *
       * @returns {Promise<void>}
       * @protected
       * @see QuestPreview.close
       * @see QuestPreview._activeFocusOutFunction
       */
      questPreview._activeFocusOutFunction = async (event, saveOptions = void 0) =>
      {
         const valueOut = input.value;
         questPreview._activeFocusOutFunction = void 0;

         switch (target)
         {
            case 'task.name':
            {
               uuidv4 = Utils.data(input, 'uuidv4');
               task = quest.getTask(uuidv4);
               if (task)
               {
                  task.name = valueOut;
                  await questPreview.saveQuest(saveOptions);
               }
               break;
            }
         }
      };

      input.addEventListener('focusout', questPreview._activeFocusOutFunction);

      // Handle `Esc` key down to cancel editing.
      onEscape(input, () =>
      {
         questPreview._activeFocusOutFunction = void 0;
         questPreview.render({ force: true, focus: true });
      });
   }

   /**
    * @param {MouseEvent} event - The click event.
    *
    * @param {Quest}             quest - The current quest being manipulated.
    *
    * @param {QuestPreview}      questPreview - The QuestPreview being manipulated.
    *
    * @returns {Promise<void>}
    */
   static async taskToggleHidden(event, quest, questPreview)
   {
      const uuidv4 = Utils.data(event.target, 'uuidv4');
      const task = quest.getTask(uuidv4);
      if (task)
      {
         task.toggleVisible();
         await questPreview.saveQuest();
      }
   }

   /**
    * @param {MouseEvent} event - The click event.
    *
    * @param {Quest}             quest - The current quest being manipulated.
    *
    * @param {QuestPreview}      questPreview - The QuestPreview being manipulated.
    *
    * @returns {Promise<void>}
    */
   static async taskToggleState(event, quest, questPreview)
   {
      const uuidv4 = Utils.data(event.target, 'uuidv4');

      const task = quest.getTask(uuidv4);
      if (task)
      {
         task.toggle();
         await questPreview.saveQuest();
      }
   }
}

/**
 * @typedef {object} FQLDropData An object attached to drop data transfer which describes the FQL reward item and who
 *                               is dropping it into an actor sheet.
 *
 * @property {string} type - The type of FQL drop data; one of: ['reward']
 *
 * @property {string} questId - The Quest ID
 *
 * @property {string} uuidv4 - The associated UUIDv4 of a quest reward.
 *
 * @property {string} itemName - The reward item name.
 *
 * @property {string} userName - The username who is dropping the item.
 */

/**
 * @typedef {object} RewardDropData
 *
 * @property {FQLDropData} _fqlData - FQL drop data used to remove the reward from a quest.
 *
 * @property {string}      type - Type of document.
 *
 * @property {object}      [data] - Document data on V9
 *
 * @property {string}      uuid - The UUID of the document.
 *
 * @property {id}          id - The ID of the document.
 *
 * @property {string}      [pack] - Any associated compendium pack.
 */
