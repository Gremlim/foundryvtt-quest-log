import {
   FVTTCompat,
   Utils }                    from '../control/index.js';

import { QuestPreviewShim }   from '../view/index.js';

import {
   constants,
   questStatus,
   settings }                 from './constants.js';

/**
 * Stores and makes accessible the minimum amount of data that defines a quest. A Quest is loaded from the backing
 * JournalEntry and has the JournalEntry stored for the ability to perform permissions checks. Please see QuestDB
 * as when a Quest is loaded it is stored in a QuestEntry which also contains the enriched quest data for display
 * in Handlebars templates along with caching of several of the methods available in Quest for fast sorting.
 *
 * {@link Quest.giverFromQuest} / {@link Quest.giverFromUUID} are used in {@link HandlerDetails} to look up
 * and store the quest giver image / name in {@link Quest.giverData} when a quest giver is set.
 *
 * @see QuestDB
 * @see QuestEntry
 */
export class Quest
{
   /**
    * Stores the sheet class for Quest which is {@link QuestPreview}. This class / sheet is used to render Quest.
    * While directly accessible from Quest the main way a QuestPreview is shown is through {@link QuestAPI.open} which
    * provides the entry point for external API access and is also used internally when opening a quest.
    *
    * @type {typeof Application}
    * @see Quest.sheet
    */
   static #SheetClass;

   /**
    * The maximum number of entries kept in the history of a quest.
    *
    * @type {number}
    */
   static MAX_HISTORY = 200;

   /**
    * The backing JournalEntry document.
    *
    * @type {JournalEntry}
    */
   #entry;

   /** @type {string | null} */
   #id;

   /** @type {string} */
   #name;

   /**
    * Lookup the Quest giver by UUID and return the data stored in {@link Quest.giverData}.
    *
    * @param {Quest} quest - The quest to look up the quest giver.
    *
    * @returns {Promise<QuestImgNameData|null>} The image / name data associated with this Foundry UUID.
    */
   static async giverFromQuest(quest)
   {
      let data = null;

      if (quest.giver === 'abstract')
      {
         data = {
            name: quest.giverName,
            img: quest.image,
            hasTokenImg: false
         };
      }
      else if (typeof quest.giver === 'string')
      {
         data = Quest.giverFromUUID(quest.giver, quest.image);
      }

      return data;
   }

   /**
    * @param {string}   uuid - The Foundry UUID to lookup for image / name data.
    *
    * @param {string}   [imageType] - The image type: 'actor' or 'token'
    *
    * @returns {Promise<QuestImgNameData|null>} The image / name data associated with this Foundry UUID.
    */
   static async giverFromUUID(uuid, imageType = 'actor')
   {
      let data = null;

      if (typeof uuid === 'string')
      {
         const document = await fromUuid(uuid);

         if (document !== null)
         {
            switch (document.documentName)
            {
               case Actor.documentName:
               {
                  const actorImage = document.img;
                  const tokenImage = FVTTCompat.tokenImg(document);

                  const hasTokenImg = typeof tokenImage === 'string' && tokenImage !== actorImage;

                  data = {
                     uuid,
                     name: document.name,
                     img: imageType === 'token' && hasTokenImg ? tokenImage : actorImage,
                     hasTokenImg
                  };
                  break;
               }

               case Item.documentName:
                  data = {
                     uuid,
                     name: document.name,
                     img: document.img,
                     hasTokenImg: false
                  };
                  break;

               case JournalEntry.documentName:
                  data = {
                     uuid,
                     name: document.name,
                     img: FVTTCompat.journalImage(document),
                     hasTokenImg: false
                  };
                  break;
            }
         }
      }

      return data;
   }

   /**
    * @param {QuestData}      data - The serialized quest data to set.
    *
    * @param {JournalEntry}   entry - The associated Foundry JournalEntry.
    */
   constructor(data = {}, entry = null)
   {
      this.#id = entry !== null ? entry.id : null;

      this.initData(data);

      this.#entry = entry;

      if (this.#entry && this.#id !== null)
      {
         this.#entry._sheet = new QuestPreviewShim(this.#id);
      }
   }

   /**
    * @returns {boolean} Returns whether the current user can update the backing journal document.
    */
   get canUserUpdate()
   {
      const entry = this.entry ? this.entry : game.journal.get(this.#id);

      return entry?.canUserModify?.(game.user, 'update') ?? false;
   }

   /**
    * @returns {JournalEntry} The associated backing journal entry document.
    */
   get entry()
   {
      return this.#entry;
   }

   /**
    * Gets the Foundry ID associated with this Quest.
    *
    * @returns {string} The ID of the quest.
    */
   get id()
   {
      return this.#id;
   }

   /**
    * Sets the associated backing journal entry document.
    *
    * @param {JournalEntry}   entry - A journal entry document.
    */
   set entry(entry)
   {
      this.#entry = entry;
   }

   /**
    * Sets the Foundry ID of the quest.
    *
    * @param {string}   id - A Foundry ID.
    */
   set id(id)
   {
      this.#id = id;
   }

   /**
    * @returns {boolean} Is the quest active / in progress.
    */
   get isActive()
   {
      return questStatus.active === this.status;
   }

   /**
    * True when no players have OBSERVER or OWNER permissions for this quest.
    *
    * @returns {boolean} Quest is hidden.
    */
   get isHidden()
   {
      let isHidden = true;

      if (this.entry && typeof FVTTCompat.ownership(this.entry) === 'object')
      {
         if (FVTTCompat.ownership(this.entry).default >= CONST.DOCUMENT_OWNERSHIP_LEVELS.OBSERVER) { return false; }

         for (const [userId, permission] of Object.entries(FVTTCompat.ownership(this.entry)))
         {
            if (userId === 'default') { continue; }

            const user = game.users.get(userId);

            if (!user || user.isGM) { continue; }

            if (permission >= CONST.DOCUMENT_OWNERSHIP_LEVELS.OBSERVER)
            {
               isHidden = false;
               break;
            }
         }
      }

      return isHidden;
   }

   /**
    * @returns {boolean} Is the quest in the inactive state.
    */
   get isInactive()
   {
      return questStatus.inactive === this.status;
   }

   /**
    * Returns true if this quest is observable for the given player. For trusted player edit when the status is
    * `inactive` the test is ownership instead of simply OBSERVER or higher.
    *
    * @returns {boolean} Is the quest observable.
    */
   get isObservable()
   {
      if (game.user.isGM) { return true; }

      const isInactive = this.isInactive;

      // Special handling for trusted player edit who can only see owned quests in the hidden / inactive category.
      if (Utils.isTrustedPlayerEdit() && isInactive) { return this.isOwner; }

      // Otherwise no one can see hidden / inactive quests; perform user permission check for observer.
      return !isInactive && this.entry.testUserPermission(game.user, CONST.DOCUMENT_OWNERSHIP_LEVELS.OBSERVER);
   }

   /**
    * @returns {boolean} Whether the quest was created by a GM. Quests without creator data count as created by a GM.
    */
   get isCreatedByGM()
   {
      return !this.creator || this.creator.gm;
   }

   /**
    * Is the user an owner of the quest that is allowed to edit it as an owner. For a quest created by a GM the GM
    * must allow it with {@link Quest.allowPlayerEdit}; GMs always can. Players keep the access to their player notes
    * and to accepting quests regardless.
    *
    * @returns {boolean} Is owner with edit access.
    */
   get isEditOwner()
   {
      if (game.user.isGM) { return true; }

      return this.isOwner && (!this.isCreatedByGM || this.allowPlayerEdit);
   }

   /**
    * Gets whether the current user has owner permissions.
    *
    * @returns {boolean} Is owner.
    */
   get isOwner()
   {
      return game.user.isGM ||
       (this.entry && this.entry.testUserPermission(game.user, CONST.DOCUMENT_OWNERSHIP_LEVELS.OWNER));
   }

   /**
    * Gets whether this quest is a personal quest. A personal quest has one or more players with OBSERVER or OWNER
    * permissions.
    *
    * @returns {boolean} Is this quest personal.
    */
   get isPersonal()
   {
      let isPersonal = false;

      if (this.entry && typeof FVTTCompat.ownership(this.entry) === 'object' &&
       FVTTCompat.ownership(this.entry).default < CONST.DOCUMENT_OWNERSHIP_LEVELS.OBSERVER)
      {
         for (const [userId, permission] of Object.entries(FVTTCompat.ownership(this.entry)))
         {
            if (userId === 'default') { continue; }

            const user = game.users.get(userId);

            if (!user || user.isGM) { continue; }

            if (permission < CONST.DOCUMENT_OWNERSHIP_LEVELS.OBSERVER) { continue; }

            isPersonal = true;
            break;
         }
      }

      return isPersonal;
   }

   /**
    * Returns whether this quest is set as the primary quest.
    *
    * @returns {boolean} Primary quest state.
    */
   get isPrimary()
   {
      return this.#id === game.settings.get(constants.moduleName, settings.primaryQuest);
   }

   /**
    * Gets the name of the quest.
    *
    * @returns {string} Quest name.
    */
   get name()
   {
      return this.#name;
   }

   /**
    * Sets the name of the quest.
    *
    * @param {string}   value - The new name.
    */
   set name(value)
   {
      this.#name = typeof value === 'string' && value.length > 0 ? value :
       game.i18n.localize('QuestLog.API.QuestDB.Labels.NewQuest');
   }

   /**
    * Creates a new Reward and pushes to the reward array.
    *
    * @param {object}   data - The reward data.
    */
   addReward(data = {})
   {
      const reward = new Reward(data);
      if (reward.type !== null) { this.rewards.push(reward); }
   }

   /**
    * Pushes a subquest ID to the subquest array.
    *
    * @param {string}   questId - A Foundry ID
    */
   addSubquest(questId)
   {
      if (!this.subquests.includes(questId))
      {
         this.subquests.push(questId);

         // Once a custom order exists new subquests are added to the end of the objectives.
         if (this.order.length) { this.order.push(questId); }
      }
   }

   /**
    * Creates a new Task and pushes to the task array.
    *
    * @param {object}   data - Task data.
    */
   addTask(data = {})
   {
      const task = new Task(data);
      if (task.name && task.name.length)
      {
         this.tasks.push(task);

         // Once a custom order exists new tasks are added to the end of the objectives.
         if (this.order.length) { this.order.push(task.uuidv4); }
      }
   }

   /**
    * Gets all adjacent quest IDs including self. This includes any parent and subquests.
    *
    * @returns {string[]} All adjacent quests including self.
    */
   getQuestIds()
   {
      return this.parent ? [this.parent, this.id, ...this.subquests] : [this.id, ...this.subquests];
   }

   /**
    * Gets a Reward by Foundry VTT UUID or UUIDv4 for abstract Rewards.
    *
    * @param {string}   uuidv4 - The FVTT UUID to find.
    *
    * @returns {Reward} The task or null.
    */
   getReward(uuidv4)
   {
      const index = this.rewards.findIndex((t) => t.uuidv4 === uuidv4);
      return index >= 0 ? this.rewards[index] : null;
   }

   /**
    * Returns a list of Actor data for whom this quest is personal.
    *
    * @returns {object[]} A list of actors who are assigned to this quest.
    */
   getPersonalActors()
   {
      if (!this.isPersonal) { return []; }

      const users = [];

      if (this.entry && typeof FVTTCompat.ownership(this.entry) === 'object')
      {
         for (const [userId, permission] of Object.entries(FVTTCompat.ownership(this.entry)))
         {
            if (userId === 'default') { continue; }

            const user = game.users.get(userId);

            if (!user || user.isGM) { continue; }

            if (permission < CONST.DOCUMENT_OWNERSHIP_LEVELS.OBSERVER) { continue; }

            users.push(user);
         }
      }

      return users;
   }

   /**
    * Returns any stored Foundry sheet class.
    *
    * @returns {typeof Application} The associated sheet class.
    */
   static getSheet() { return Quest.#SheetClass; }

   /**
    * Gets a task by UUID v4.
    *
    * @param {string}   uuidv4 - The UUID v4 to find.
    *
    * @returns {Task} The task or null.
    */
   getTask(uuidv4)
   {
      const index = this.tasks.findIndex((t) => t.uuidv4 === uuidv4);
      return index >= 0 ? this.tasks[index] : null;
   }

   /**
    * Normally would be in constructor(), but is extracted for usage in different methods as well
    *
    * @param {QuestData}   data - The serialized Quest data to initialize.
    */
   initData(data)
   {
      this.name = data.name || game.i18n.localize('QuestLog.API.QuestDB.Labels.NewQuest');

      /**
       * @type {string}
       */
      this.status = data.status || questStatus.inactive;

      /**
       * @type {string|null}
       */
      this.giver = data.giver || null;

      /**
       * @type {object|null}
       */
      this.giverData = data.giverData || null;

      /**
       * @type {string}
       */
      this.description = data.description || '';

      /**
       * @type {string}
       */
      this.gmnotes = data.gmnotes || '';

      /**
       * @type {string}
       */
      this.image = data.image || 'actor';

      /**
       * @type {string}
       */
      this.giverName = data.giverName || 'actor';

      /**
       * @type {string}
       */
      this.splash = data.splash || '';

      /**
       * @type {string}
       */
      this.splashPos = data.splashPos || 'center';

      /**
       * @type {boolean}
       */
      this.splashAsIcon = typeof data.splashAsIcon === 'boolean' ? data.splashAsIcon : false;

      /**
       * Optional location where the quest takes place (free text).
       *
       * @type {string}
       */
      this.location = typeof data.location === 'string' ? data.location : '';

      /**
       * @type {string}
       */
      this.playernotes = data.playernotes || '';

      /**
       * @type {number}
       */
      this.priority = data.priority || 0;

      /**
       * @type {string|null}
       */
      this.type = data.type || null;

      /**
       * @type {string|null}
       */
      this.parent = data.parent || null;

      /**
       * @type {string[]}
       */
      this.subquests = data.subquests || [];

      /**
       * Display order of the objectives of this quest. Contains the UUIDv4 of tasks and the IDs of subquests so that
       * subquests can be intermixed with the tasks. When empty / incomplete the default order is used (subquests
       * first, then tasks). Use {@link Quest.getObjectiveOrder} to get the resolved order.
       *
       * @type {string[]}
       */
      this.order = Array.isArray(data.order) ? data.order.filter((id) => typeof id === 'string') : [];

      /**
       * Activity log of the quest (newest last). Limited to {@link Quest.MAX_HISTORY} entries. See
       * {@link Quest.addHistory}.
       *
       * @type {object[]}
       */
      this.allowPlayerEdit = data.allowPlayerEdit === true;

      /**
       * Optional group (folder, category, chapter...) of the quest, used to group the quests in the lists.
       *
       * @type {string}
       */
      this.group = typeof data.group === 'string' ? data.group.trim() : '';

      /**
       * A subquest can be an optional (bonus) objective of its parent quest: it does not count in the completed /
       * total objectives of the parent.
       *
       * @type {boolean}
       */
      this.optional = data.optional === true;

      /**
       * A repeatable quest can be reset by the GM (objectives, counters, rewards and subquests) to make it available
       * again (#80).
       *
       * @type {boolean}
       */
      this.repeatable = data.repeatable === true;

      /**
       * Number of times a repeatable quest was completed.
       *
       * @type {number}
       */
      this.timesCompleted = Number.isFinite(Number(data.timesCompleted)) ? Math.max(0, Math.floor(Number(data.timesCompleted))) : 0;

      /**
       * Original data of the rewards that were taken (or changed by taking them) since the last reset of a repeatable
       * quest. They are restored when the quest is reset.
       *
       * @type {object[]}
       */
      this.rewardsBackup = Array.isArray(data.rewardsBackup) ? data.rewardsBackup : [];

      /**
       * Who created the quest: `{ id, name, gm }`. Quests without this data (created before the creator was stored)
       * are considered created by a GM.
       *
       * @type {{id: string, name: string, gm: boolean}|null}
       */
      this.creator = data.creator && typeof data.creator === 'object' ? {
         id: String(data.creator.id ?? ''),
         name: String(data.creator.name ?? ''),
         gm: data.creator.gm === true
      } : null;

      this.history = Array.isArray(data.history) ?
       data.history.filter((e) => e && typeof e === 'object').slice(-Quest.MAX_HISTORY) : [];

      /**
       * Rumors (#82): loose texts about the quest that the characters can hear. `heard` marks a rumor as heard
       * (completed) and `visible` makes it visible to the players in the rumors tab of the Quest Log.
       *
       * @type {{uuidv4: string, text: string, heard: boolean, visible: boolean}[]}
       */
      this.rumors = Array.isArray(data.rumors) ? data.rumors.filter((r) => r && typeof r.text === 'string').map((r) => ({
         uuidv4: typeof r.uuidv4 === 'string' && r.uuidv4 ? r.uuidv4 : foundry.utils.randomID(),
         text: r.text,
         heard: r.heard === true,
         visible: r.visible === true,
         optional: r.optional === true
      })) : [];

      /**
       * Number of (not optional) rumors that must be heard to unlock the quest (make it available). 0 means all of
       * them.
       *
       * @type {number}
       */
      this.rumorsRequired = Number.isFinite(Number(data.rumorsRequired)) ?
       Math.max(0, Math.floor(Number(data.rumorsRequired))) : 0;

      /**
       * The characters (and users) that accepted the quest (#138): `{ actorId, actorName, userId, userName, t }`.
       * Cleared when the quest goes back to available / inactive. See {@link Quest.addAccepted}.
       *
       * @type {{actorId: string, actorName: string, userId: string, userName: string, t: number}[]}
       */
      /**
       * Optional deadline (#87): `mode` is `world` (value in seconds of the world calendar) or `real` (timestamp in
       * milliseconds).
       *
       * @type {{mode: string, value: number}|null}
       */
      this.deadline = data.deadline && (data.deadline.mode === 'world' || data.deadline.mode === 'real') &&
       Number.isFinite(data.deadline.value) ? { mode: data.deadline.mode, value: data.deadline.value } : null;

      this.accepted = Array.isArray(data.accepted) ? data.accepted.filter((a) => a && typeof a === 'object').map((a) => ({
         actorId: String(a.actorId ?? ''),
         actorName: String(a.actorName ?? ''),
         userId: String(a.userId ?? ''),
         userName: String(a.userName ?? ''),
         t: Number.isFinite(a.t) ? a.t : 0
      })) : [];

      /**
       * @type {Task[]}
       */
      this.tasks = Array.isArray(data.tasks) ? data.tasks.map((task) => new Task(task)) : [];

      /**
       * @type {Reward[]}
       */
      this.rewards = Array.isArray(data.rewards) ? data.rewards.map((reward) => new Reward(reward)) : [];

      // Sanity check. If status is incorrect set it to inactive.
      if (!questStatus[this.status]) { this.status = questStatus.inactive; }

      if (typeof data.date === 'object')
      {
         /**
          * Provides timestamps for quest create, start, end.
          *
          * @type {{start: (number|null), create: (number|null), end: (number|null)}}
          */
         this.date = {
            create: typeof data.date.create === 'number' ? data.date.create : null,
            start: typeof data.date.start === 'number' ? data.date.start : null,
            end: typeof data.date.end === 'number' ? data.date.end : null
         };
      }
      else
      {
         this.date = {
            create: Date.now(),
         };

         switch (this.status)
         {
            case questStatus.active:
               this.date.start = Date.now();
               this.date.end = null;
               break;

            case questStatus.completed:
            case questStatus.failed:
               this.date.start = Date.now();
               this.date.end = Date.now();
               break;

            case questStatus.inactive:
            case questStatus.available:
            default:
               this.date.start = null;
               this.date.end = null;
               break;
         }
      }
   }

   /**
    * Deletes Reward from Quest.
    *
    * @param {string} uuidv4 - The UUIDv4 associated with a Reward.
    */
   removeReward(uuidv4)
   {
      const index = this.rewards.findIndex((t) => t.uuidv4 === uuidv4);
      if (index >= 0) { this.rewards.splice(index, 1); }
   }

   /**
    * Takes an amount of a reward. If the amount is not provided or is equal or greater than the quantity of the reward
    * then the reward is removed from the quest; otherwise the quantity is reduced by the amount.
    *
    * @param {string}   uuidv4 - The UUIDv4 associated with a Reward.
    *
    * @param {number}   [amount] - The amount taken.
    *
    * @param {object}   [options] - Options for the history entry.
    *
    * @param {string}   [options.userName] - The name of the user that took the reward.
    *
    * @param {string}   [options.actorName] - The name of the actor that received the reward.
    */
   takeReward(uuidv4, amount = void 0, { userName, actorName } = {})
   {
      const reward = this.getReward(uuidv4);
      if (!reward) { return; }

      const taken = Number.isFinite(amount) ? Math.floor(amount) : reward.quantity;

      // A repeatable quest keeps the original reward to restore it when the quest is reset (#80).
      if (taken >= 1 && this.repeatable && !this.rewardsBackup.some((r) => r.uuidv4 === uuidv4))
      {
         this.rewardsBackup.push(JSON.parse(JSON.stringify(reward.toJSON())));
      }

      // Log the reward in the history of the quest.
      if (taken >= 1)
      {
         const type = String(reward.type ?? '').toLowerCase();

         this.addHistory({
            type: 'reward',
            rewardType: type,
            item: reward.data?.name ?? '',
            currency: type === 'currency' ? reward.data?.currency : void 0,
            amount: Math.min(taken, reward.quantity),
            actor: actorName || void 0
         }, { userName });
      }

      // Taking a reward of a choice group closes the other rewards of the group (#92).
      if (taken >= 1 && reward.choice)
      {
         reward.closed = false;

         for (const other of this.rewards)
         {
            if (other !== reward && other.choice === reward.choice) { other.closed = true; }
         }
      }

      if (taken >= reward.quantity) { this.removeReward(uuidv4); }
      else if (taken >= 1) { reward.quantity -= taken; }
   }

   /**
    * Removes subquest from Quest.
    *
    * @param {string} questId - The subquest ID to remove.
    */
   removeSubquest(questId)
   {
      this.subquests = this.subquests.filter((id) => id !== questId);
      this.order = this.order.filter((id) => id !== questId);
   }

   /**
    * Removes the task from this quest by UUIDv4.
    *
    * @param {string} uuidv4 - The UUIDv4 associated with a Task.
    *
    * @see Utils.uuidv4
    */
   removeTask(uuidv4)
   {
      const index = this.tasks.findIndex((t) => t.uuidv4 === uuidv4);
      if (index >= 0) { this.tasks.splice(index, 1); }
      this.order = this.order.filter((id) => id !== uuidv4);
   }

   /**
    * Resets the quest giver.
    */
   resetGiver()
   {
      this.giver = null;
      this.image = 'actor';
      this.giverData = null;
      this.giverName = 'actor';
   }

   /**
    * Saves Quest to JournalEntry's content, and if needed, moves JournalEntry to different folder.
    * Can also update JournalEntry's permissions.
    *
    * @returns {Promise<string|void>} The ID of the quest saved or undefined if user couldn't save the quest.
    */
   async save()
   {
      const entry = this.entry ? this.entry : game.journal.get(this.#id);

      // If the entry doesn't exist or the user can't update the journal entry via ownership then early out.
      if (!entry || !this.canUserUpdate) { return; }

      // Save Quest JSON, but also potentially update the backing JournalEntry folder name.
      const update = {
         name: typeof this.#name === 'string' && this.#name.length > 0 ? this.#name :
          game.i18n.localize('QuestLog.API.QuestDB.Labels.NewQuest'),
         flags: {
            [constants.moduleName]: { json: this.toJSON() }
         }
      };

      this.entry = await entry.update(update, { diff: false });

      return this.#id;
   }

   /**
    * Sets any stored Foundry sheet class.
    *
    * @param {typeof Application}   NewSheetClass - The sheet class.
    */
   static setSheet(NewSheetClass) { Quest.#SheetClass = NewSheetClass; }

   /**
    * Sets new status for the quest. Also updates any timestamp / date data depending on status set.
    *
    * @param {string}   target - The target status to set.
    *
    * @returns {Promise<void>}
    */
   async setStatus(target, { userName, accept } = {})
   {
      if (!this.entry || !questStatus[target]) { return; }

      const wasSameStatus = this.status === target;

      if (!wasSameStatus)
      {
         this.addHistory({ type: 'status', from: this.status, to: target, actor: accept?.actorName || void 0 },
          { userName });
      }

      this.status = target;

      if (!wasSameStatus && target === questStatus.completed && this.repeatable) { this.timesCompleted++; }

      // Register the character that accepted the quest (#138). When the quest was already in progress this is a
      // character joining it, so the status / dates are not changed.
      if (target === questStatus.active && accept && this.addAccepted(accept) && wasSameStatus)
      {
         this.addHistory({ type: 'accept', actor: accept.actorName || void 0 }, { userName });
      }

      // Update the tracked date data based on status.
      switch (this.status)
      {
         case questStatus.active:
            if (!wasSameStatus || this.date.start === null) { this.date.start = Date.now(); }
            this.date.end = null;
            break;

         case questStatus.completed:
         case questStatus.failed:
            this.date.end = Date.now();
            break;

         case questStatus.inactive:
         case questStatus.available:
         default:
            this.date.start = null;
            this.date.end = null;
            this.accepted = [];
            break;
      }

      // Potentially reset any tracked primary quest when the status is no longer active.
      if (this.status !== questStatus.active)
      {
         const primaryQuestId = game.settings.get(constants.moduleName, settings.primaryQuest);
         if (this.#id === primaryQuestId)
         {
            await game.settings.set(constants.moduleName, settings.primaryQuest, '');
         }
      }

      await this.entry.update({
         flags: {
            [constants.moduleName]: { json: this.toJSON() }
         }
      });

      return this.#id;
   }

   /**
    * Locates and swaps the rewards indicated by the source and target UUIDv4s provided.
    *
    * @param {string}   sourceUuidv4 - The source UUIDv4
    *
    * @param {string}   targetUuidv4 - The target UUIDv4
    */
   sortRewards(sourceUuidv4, targetUuidv4)
   {
      const index = this.rewards.findIndex((t) => t.uuidv4 === sourceUuidv4);
      const targetIdx = this.rewards.findIndex((t) => t.uuidv4 === targetUuidv4);

      if (index >= 0 && targetIdx >= 0)
      {
         const entry = this.rewards.splice(index, 1)[0];
         this.rewards.splice(targetIdx, 0, entry);
      }
   }

   /**
    * Adds an entry to the history of the quest. The time and the user are added automatically. Only the newest
    * {@link Quest.MAX_HISTORY} entries are kept. The quest must be saved afterward.
    *
    * @param {object}   entry - The entry; `type` is one of: created, status, task, reward.
    *
    * @param {object}   [options] - Options.
    *
    * @param {string}   [options.userName] - The name of the user; defaults to the current user.
    */
   addHistory(entry, { userName } = {})
   {
      // `w` is the world time (in seconds) for the date of the world calendar (#87).
      const w = Number.isFinite(game.time?.worldTime) ? game.time.worldTime : void 0;

      this.history.push({ t: Date.now(), w, user: userName || game.user?.name || '', ...entry });

      if (this.history.length > Quest.MAX_HISTORY) { this.history.splice(0, this.history.length - Quest.MAX_HISTORY); }
   }

   /**
    * Registers a character / user that accepted the quest (#138). A character is only registered once; without a
    * character the user is registered once.
    *
    * @param {object}   accept - The data of who accepts.
    *
    * @param {string}   [accept.actorId] - The ID of the character (actor).
    *
    * @param {string}   [accept.actorName] - The name of the character.
    *
    * @param {string}   [accept.userId] - The ID of the user.
    *
    * @param {string}   [accept.userName] - The name of the user.
    *
    * @returns {boolean} True when it was added; false when it was already registered.
    */
   addAccepted({ actorId = '', actorName = '', userId = '', userName = '' } = {})
   {
      if (this.hasAccepted({ actorId, userId })) { return false; }

      this.accepted.push({ actorId: String(actorId), actorName: String(actorName), userId: String(userId),
       userName: String(userName), t: Date.now() });

      return true;
   }

   /**
    * @param {object}   who - Who to check.
    *
    * @param {string}   [who.actorId] - The ID of the character; when set the character is checked.
    *
    * @param {string}   [who.userId] - The ID of the user; checked when there is no character.
    *
    * @returns {boolean} Whether the character (or the user without a character) already accepted the quest.
    */
   hasAccepted({ actorId = '', userId = '' } = {})
   {
      return this.accepted.some((a) => (actorId ? a.actorId === actorId : (a.actorId === '' && a.userId === userId)));
   }

   /**
    * Adds a rumor (hidden for the players and not heard). The quest must be saved afterward.
    *
    * @param {string}   text - Text of the rumor.
    *
    * @returns {object|null} The new rumor or null when the text is empty.
    */
   addRumor(text)
   {
      const value = String(text ?? '').trim();
      if (!value) { return null; }

      const rumor = { uuidv4: foundry.utils.randomID(), text: value, heard: false, visible: false, optional: false };
      this.rumors.push(rumor);
      return rumor;
   }

   /**
    * @param {string}   uuidv4 - The ID of a rumor.
    *
    * @returns {object|undefined} The rumor.
    */
   getRumor(uuidv4)
   {
      return this.rumors.find((r) => r.uuidv4 === uuidv4);
   }

   /**
    * Removes a rumor. The quest must be saved afterward.
    *
    * @param {string}   uuidv4 - The ID of a rumor.
    */
   removeRumor(uuidv4)
   {
      this.rumors = this.rumors.filter((r) => r.uuidv4 !== uuidv4);
   }

   /**
    * Progress of the rumors that unlock the quest. Optional rumors don't count.
    *
    * @returns {{heard: number, total: number, needed: number}} Heard required rumors, number of required rumors and
    *          the number of rumors that must be heard (`rumorsRequired`, or all when it is 0 or too high).
    */
   getRumorProgress()
   {
      const required = this.rumors.filter((r) => !r.optional);
      const needed = this.rumorsRequired > 0 ? Math.min(this.rumorsRequired, required.length) : required.length;

      return { heard: required.filter((r) => r.heard).length, total: required.length, needed };
   }

   /**
    * Marks a rumor as heard or not heard. When enough rumors are heard (see {@link Quest.getRumorProgress}) and the
    * quest is inactive it becomes available. The quest must be saved afterward.
    *
    * @param {string}   uuidv4 - The ID of a rumor.
    *
    * @returns {Promise<boolean>} True when the status of the quest changed.
    */
   async toggleRumorHeard(uuidv4)
   {
      const rumor = this.getRumor(uuidv4);
      if (!rumor) { return false; }

      rumor.heard = !rumor.heard;

      const progress = this.getRumorProgress();

      if (rumor.heard && !rumor.optional && this.status === questStatus.inactive && progress.needed > 0 &&
       progress.heard >= progress.needed)
      {
         await this.setStatus(questStatus.available);
         return true;
      }

      return false;
   }

   /**
    * Removes all entries of the history. The quest must be saved afterward.
    */
   clearHistory()
   {
      this.history = [];
   }

   /**
    * Toggles the state of a task (pending, completed, failed) and logs it in the history.
    *
    * @param {string}   uuidv4 - The UUIDv4 of the task.
    *
    * @param {object}   [options] - Options.
    *
    * @param {string}   [options.userName] - The name of the user; defaults to the current user.
    *
    * @returns {Task|null} The task or null when not found.
    */
   toggleTask(uuidv4, { userName } = {})
   {
      const task = this.getTask(uuidv4);
      if (!task) { return null; }

      const wasCompleted = task.completed;

      task.toggle();

      if (task.repeatable && task.completed && !wasCompleted) { task.times++; }

      this.addHistory({
         type: 'task',
         uuidv4,
         task: String(task.name ?? '').replace(/<[^>]*>/g, '').trim(),
         state: task.completed ? 'completed' : (task.failed ? 'failed' : 'pending')
      }, { userName });

      return task;
   }

   /**
    * Resets a repeatable objective: it is pending again and its counter is 0. The quest must be saved afterward.
    *
    * @param {string}   uuidv4 - The UUIDv4 of the task.
    *
    * @param {object}   [options] - Options.
    *
    * @param {string}   [options.userName] - The name of the user; defaults to the current user.
    *
    * @returns {Task|null} The task or null when not found.
    */
   resetTask(uuidv4, { userName } = {})
   {
      const task = this.getTask(uuidv4);
      if (!task) { return null; }

      task.completed = false;
      task.failed = false;
      task.count = 0;

      this.addHistory({
         type: 'task',
         uuidv4,
         task: String(task.name ?? '').replace(/<[^>]*>/g, '').trim(),
         state: 'pending'
      }, { userName });

      return task;
   }

   /**
    * Resets this quest to be repeated (#80): the objectives are pending with their counters at 0, the rewards that
    * were taken are restored and reopened (and locked as they originally were) and the quest becomes available. The
    * subquests must be reset by the caller (see {@link QuestDB.resetQuest}).
    *
    * @param {object}   [options] - Options.
    *
    * @param {string}   [options.userName] - The name of the user; defaults to the current user.
    *
    * @param {string}   [options.status] - Status to set (available by default).
    *
    * @returns {Promise<void>}
    */
   async resetRepeat({ userName, status = questStatus.available } = {})
   {
      for (const task of this.tasks)
      {
         task.completed = false;
         task.failed = false;
         task.count = 0;
      }

      for (const data of this.rewardsBackup)
      {
         const restored = new Reward(data);
         const index = this.rewards.findIndex((r) => r.uuidv4 === restored.uuidv4);

         if (index >= 0) { this.rewards[index] = restored; }
         else { this.rewards.push(restored); }
      }

      this.rewardsBackup = [];

      for (const reward of this.rewards) { reward.closed = false; }

      this.addHistory({ type: 'reset', times: this.timesCompleted }, { userName });

      await this.setStatus(status, { userName });
   }

   /**
    * Changes the counter of an objective. Reaching the target completes the objective and going below the target
    * makes a completed objective pending again. The change is logged in the history. The quest must be saved
    * afterward.
    *
    * @param {string}   uuidv4 - The UUIDv4 of the task.
    *
    * @param {object}   options - Options.
    *
    * @param {number}   [options.delta] - Amount to add to the current count.
    *
    * @param {number}   [options.value] - New count (instead of `delta`).
    *
    * @param {string}   [options.userName] - The name of the user; defaults to the current user.
    *
    * @returns {Task|null} The task or null when not found or without a counter.
    */
   setTaskCount(uuidv4, { delta = 0, value = void 0, userName } = {})
   {
      const task = this.getTask(uuidv4);
      if (!task || !(task.target > 0)) { return null; }

      const next = Math.min(task.target, Math.max(0, Math.floor(value !== void 0 ? Number(value) : task.count + delta)));
      if (!Number.isFinite(next) || next === task.count) { return task; }

      task.count = next;

      this.#syncCounterState(task, { userName });

      this.addHistory({
         type: 'counter',
         uuidv4,
         task: String(task.name ?? '').replace(/<[^>]*>/g, '').trim(),
         count: task.count,
         target: task.target
      }, { userName });

      return task;
   }

   /**
    * Sets the target (and the current count) of the counter of an objective. A target of 0 removes the counter. The
    * quest must be saved afterward.
    *
    * @param {string}   uuidv4 - The UUIDv4 of the task.
    *
    * @param {object}   options - Options.
    *
    * @param {number}   options.target - The number to reach (0 = no counter).
    *
    * @param {number}   [options.count] - The current count.
    *
    * @returns {Task|null} The task or null when not found.
    */
   setTaskCounter(uuidv4, { target, count = 0 } = {})
   {
      const task = this.getTask(uuidv4);
      if (!task) { return null; }

      const targetValue = Math.max(0, Math.floor(Number(target)) || 0);
      task.target = targetValue;
      task.count = targetValue > 0 ? Math.min(targetValue, Math.max(0, Math.floor(Number(count)) || 0)) : 0;

      if (targetValue > 0) { this.#syncCounterState(task); }

      return task;
   }

   /**
    * Completes the task when the counter reached the target and makes a completed task pending when it didn't.
    *
    * @param {Task}     task - The task.
    *
    * @param {object}   [options] - Options.
    *
    * @param {string}   [options.userName] - The name of the user.
    */
   #syncCounterState(task, { userName } = {})
   {
      const wasCompleted = task.completed;

      if (task.count >= task.target)
      {
         task.completed = true;
         task.failed = false;
      }
      else if (task.completed) { task.completed = false; }

      if (task.completed && !wasCompleted && task.repeatable) { task.times++; }

      if (task.completed !== wasCompleted)
      {
         this.addHistory({
            type: 'task',
            uuidv4: task.uuidv4,
            task: String(task.name ?? '').replace(/<[^>]*>/g, '').trim(),
            state: task.completed ? 'completed' : 'pending'
         }, { userName });
      }
   }

   /**
    * Resolves the display order of the objectives (tasks and subquests). Entries in `order` that no longer exist are
    * ignored and any missing entries are added at the end. Without a custom order subquests come first.
    *
    * @returns {string[]} Ordered list of task UUIDv4s and subquest IDs.
    */
   getObjectiveOrder()
   {
      const valid = new Set([...this.subquests, ...this.tasks.map((t) => t.uuidv4)]);

      const result = [];
      const seen = new Set();

      for (const id of this.order)
      {
         if (valid.has(id) && !seen.has(id)) { result.push(id); seen.add(id); }
      }

      for (const id of this.subquests) { if (!seen.has(id)) { result.push(id); seen.add(id); } }
      for (const task of this.tasks) { if (!seen.has(task.uuidv4)) { result.push(task.uuidv4); seen.add(task.uuidv4); } }

      return result;
   }

   /**
    * Moves the objective (task or subquest) indicated by the source ID to the position of the target ID. The
    * resulting order is stored and the tasks / subquests arrays are kept in the same relative order.
    *
    * @param {string}   sourceId - The UUIDv4 of a task or the ID of a subquest.
    *
    * @param {string}   targetId - The UUIDv4 of a task or the ID of a subquest.
    */
   sortObjectives(sourceId, targetId)
   {
      if (!sourceId || !targetId || sourceId === targetId) { return; }

      const order = this.getObjectiveOrder();

      const index = order.indexOf(sourceId);
      const targetIdx = order.indexOf(targetId);

      if (index < 0 || targetIdx < 0) { return; }

      const entry = order.splice(index, 1)[0];
      order.splice(targetIdx, 0, entry);

      this.order = order;

      const position = (id) => order.indexOf(id);

      this.subquests.sort((a, b) => position(a) - position(b));
      this.tasks.sort((a, b) => position(a.uuidv4) - position(b.uuidv4));
   }

   /**
    * Locates and swaps the tasks indicated by the source and target UUIDv4s provided.
    *
    * @param {string}   sourceUuidv4 - The source UUIDv4
    *
    * @param {string}   targetUuidv4 - The target UUIDv4
    */
   sortTasks(sourceUuidv4, targetUuidv4)
   {
      // If there are sub quests in the objectives above tasks then an undefined targetUuidv4 can occur.
      if (!targetUuidv4) { return; }

      const index = this.tasks.findIndex((t) => t.uuidv4 === sourceUuidv4);
      const targetIdx = this.tasks.findIndex((t) => t.uuidv4 === targetUuidv4);

      if (index >= 0 && targetIdx >= 0)
      {
         const entry = this.tasks.splice(index, 1)[0];
         this.tasks.splice(targetIdx, 0, entry);
      }
   }

   /**
    * @returns {QuestData} The serialized JSON for this Quest.
    */
   toJSON()
   {
      return {
         name: this.#name,
         status: this.status,
         giver: this.giver,
         giverData: this.giverData,
         description: this.description,
         gmnotes: this.gmnotes,
         playernotes: this.playernotes,
         image: this.image,
         giverName: this.giverName,
         splash: this.splash,
         splashPos: this.splashPos,
         splashAsIcon: this.splashAsIcon,
         location: this.location,
         priority: this.priority,
         type: this.type,
         parent: this.parent,
         subquests: this.subquests,
         order: this.order,
         history: this.history,
         rumors: this.rumors,
         rumorsRequired: this.rumorsRequired,
         accepted: this.accepted,
         deadline: this.deadline,
         creator: this.creator,
         allowPlayerEdit: this.allowPlayerEdit,
         group: this.group,
         optional: this.optional,
         repeatable: this.repeatable,
         timesCompleted: this.timesCompleted,
         rewardsBackup: this.rewardsBackup,
         tasks: this.tasks,
         rewards: this.rewards,
         date: this.date
      };
   }

   /**
    * Toggles Actor image between sheet's and token's images
    */
   toggleImage()
   {
      this.image = this.image === 'actor' ? 'token' : 'actor';
   }

// Document simulation -----------------------------------------------------------------------------------------------

   /**
    * The canonical name of this Document type, for example "Actor".
    *
    * @returns {string} The document name.
    */
   static get documentName()
   {
      return 'Quest';
   }

   /**
    * The canonical name of this Document type, for example "Actor".
    *
    * @returns {string} The document name.
    */
   get documentName()
   {
      return 'Quest';
   }

   /**
    * This mirrors document.sheet and constructs a new instance of the sheet class.
    *
    * @returns {Application} An associated sheet instance.
    */
   get sheet()
   {
      const SheetClass = Quest.#SheetClass;

      return SheetClass ? new SheetClass(this) : void 0;
   }
}

/**
 * Rewards can be either an item from a Foundry VTT compendium / world item or be an abstract reward. It should be
 * noted that FVTT item data will have a Foundry VTT UUID, but abstract rewards entered by the user will have a UUIDv4
 * generated for them. This UUID regardless of type is accessible in `this.uuid`.
 *
 */
export class Reward
{
   /**
    * @param {object}   data - Serialized reward data.
    */
   constructor(data = {})
   {
      /**
       * @type {string|null}
       */
      this.type = data.type || null;

      /**
       * @type {object}
       */
      this.data = data.data || {};

      /**
       * @type {boolean}
       */
      this.hidden = typeof data.hidden === 'boolean' ? data.hidden : false;

      /**
       * @type {boolean}
       */
      this.locked = typeof data.locked === 'boolean' ? data.locked : true;

      /**
       * @type {string}
       */
      this.uuidv4 = data.uuidv4 || Utils.uuidv4();

      /**
       * The amount of this reward; for example the amount of an item.
       *
       * @type {number}
       */
      this.quantity = Number.isFinite(data.quantity) && data.quantity >= 1 ? Math.floor(data.quantity) : 1;

      /**
       * Optional choice group (#92). Only one of the rewards of the same choice group can be taken; when one is taken
       * the other rewards of the group are closed. An empty string means the reward is not part of a choice group.
       *
       * @type {string}
       */
      this.choice = typeof data.choice === 'string' ? data.choice.trim() : '';

      /**
       * Set when another reward of the choice group has been taken. A closed reward can't be taken by players; the GM
       * can reopen it.
       *
       * @type {boolean}
       */
      this.closed = this.choice !== '' && data.closed === true;
   }

   /**
    * Returns the name of the reward.
    *
    * @returns {string} Reward name.
    */
   get name() { return this.data.name; }

   /**
    * Returns the Foundry UUID associated with this reward. Abstract rewards do not have a Foundry UUID.
    *
    * @returns {string|void} The Foundry UUID.
    */
   get uuid() { return this.data.uuid; }

   /**
    * Serializes this reward.
    *
    * @returns {object} A JSON object.
    */
   toJSON()
   {
      return JSON.parse(JSON.stringify({
         type: this.type,
         data: this.data,
         hidden: this.hidden,
         locked: this.locked,
         uuidv4: this.uuidv4,
         quantity: this.quantity,
         choice: this.choice,
         closed: this.closed
      }));
   }

   /**
    * Toggles the locked status.
    *
    * @returns {boolean} Current locked status.
    */
   toggleLocked()
   {
      this.locked = !this.locked;
      return this.locked;
   }

   /**
    * Toggles the hidden status.
    *
    * @returns {boolean} Current hidden status.
    */
   toggleVisible()
   {
      this.hidden = !this.hidden;
      return this.hidden;
   }
}

/**
 * Encapsulates an objective / task.
 */
export class Task
{
   /**
    * @param {object}   data - The task data.
    */
   constructor(data = {})
   {
      /**
       * @type {string|null}
       */
      this.name = data.name || null;

      /**
       * @type {boolean}
       */
      this.completed = data.completed || false;

      /**
       * @type {boolean}
       */
      this.failed = data.failed || false;

      /**
       * @type {boolean}
       */
      this.hidden = data.hidden || false;

      /**
       * Optional (bonus) objective. It does not count in the completed / total objectives of the quest.
       *
       * @type {boolean}
       */
      this.optional = data.optional || false;

      /**
       * Counter of the objective (for example "find 3 pumpkins"): `target` is the number to reach (0 = no counter)
       * and `count` the current number. Reaching the target completes the objective.
       *
       * @type {number}
       */
      this.target = Number.isFinite(Number(data.target)) ? Math.max(0, Math.floor(Number(data.target))) : 0;

      /**
       * @type {number}
       */
      this.count = Number.isFinite(Number(data.count)) ? Math.max(0, Math.floor(Number(data.count))) : 0;

      if (this.target > 0) { this.count = Math.min(this.count, this.target); }

      /**
       * A repeatable objective can be reset by the GM to be done again (#80).
       *
       * @type {boolean}
       */
      this.repeatable = data.repeatable === true;

      /**
       * Number of times a repeatable objective was completed.
       *
       * @type {number}
       */
      this.times = Number.isFinite(Number(data.times)) ? Math.max(0, Math.floor(Number(data.times))) : 0;

      /**
       * @type {string}
       */
      this.uuidv4 = data.uuidv4 || Utils.uuidv4();
   }

   /**
    * Gets the current CSS class based on state.
    *
    * @returns {string} CSS class
    */
   get state()
   {
      if (this.completed)
      {
         return 'check-square';
      }
      else if (this.failed)
      {
         return 'minus-square';
      }
      return 'square';
   }

   /**
    * Serializes the task.
    *
    * @returns {object} JSON object.
    */
   toJSON()
   {
      return JSON.parse(JSON.stringify({
         name: this.name,
         completed: this.completed,
         failed: this.failed,
         hidden: this.hidden,
         optional: this.optional,
         target: this.target,
         count: this.count,
         repeatable: this.repeatable,
         times: this.times,
         state: this.state,
         uuidv4: this.uuidv4
      }));
   }

   /**
    * Toggles the task state between completed, failed, incomplete.
    */
   toggle()
   {
      if (this.completed === false && this.failed === false)
      {
         this.completed = true;
         if (this.target > 0) { this.count = this.target; }
      }
      else if (this.completed === true)
      {
         this.failed = true;
         this.completed = false;
      }
      else
      {
         this.failed = false;
      }
   }

   /**
    * Toggles the hidden state.
    *
    * @returns {boolean} Current hidden state.
    */
   toggleVisible()
   {
      this.hidden = !this.hidden;

      return this.hidden;
   }
}

/**
 * @typedef {object} QuestData
 *
 * @property {string}            name - The quest name.
 *
 * @property {string}            status - The quest status; one of {@link questStatus}.
 *
 * @property {string|null}       giver - The Foundry UUID or 'abstract' for a custom source.
 *
 * @property {QuestImgNameData}  giverData - The Foundry image / name data looked up by UUID.
 *
 * @property {string}            description - The quest description.
 *
 * @property {string}            gmnotes - The GM Notes.
 *
 * @property {string}            image - `actor` or `token` for UUID based givers or the image link for custom source.
 *
 * @property {string}            giverName - The name of the quest giver.
 *
 * @property {string}            splash - The splash image.
 *
 * @property {string}            splashPos - The splash position (top, center, bottom).
 *
 * @property {boolean}           splashAsIcon - Use the splash image as the quest icon.
 *
 * @property {string}            [location] - Optional location where the quest takes place (free text).
 *
 * @property {string}            playernotes - The Player Notes.
 *
 * @property {number}            priority - Unused / future use for quest priority sorting.
 *
 * @property {string|null}       type - Unused / future use for sorting type of quest.
 *
 * @property {string|null}       parent - The parent quest ID.
 *
 * @property {string[]}          subquests - An array of quest IDs that are subquests.
 * @property {string[]}          [order] - Display order of objectives: task UUIDv4s and subquest IDs.
 * @property {object[]}          [history] - Activity log entries (`t`, `user`, `type` and details).
 *
 * @property {object[]}          [rumors] - Rumors of the quest: `uuidv4`, `text`, `heard` and `visible`.
 *
 * @property {boolean}           [optional] - A subquest that is an optional (bonus) objective of its parent.
 * @property {object|null}       [creator] - Who created the quest (`id`, `name`, `gm`).
 * @property {boolean}           [allowPlayerEdit] - Owners can edit a quest created by a GM.
 *
 * @property {string}            [group] - Optional group (folder, category, chapter...) of the quest.
 *
 * @property {QuestTaskData[]}   tasks - An array of tasks.
 *
 * @property {QuestRewardData[]} rewards - An array of rewards.
 *
 * @property {QuestDateData}     date - The create, end, start dates of the quest.
 */

/**
 * @typedef QuestDateData
 *
 * @property {number|null} create - Time ms since 1970 / Date.now() when quest was created.
 *
 * @property {number|null} end - Time ms since 1970 / Date.now() when quest ended (status: failed / complete).
 *
 * @property {number|null} start - Time ms since 1970 / Date.now() when quest was started (status: active).
 */

/**
 * @typedef QuestRewardData
 *
 * @property {string}   type - Reward type.
 *
 * @property {QuestRewardAddData}   data - Reward add data.
 *
 * @property {boolean}  hidden - Reward hidden.
 *
 * @property {boolean}  locked - Reward locked.
 * @property {string}   choice - Choice group of the reward (only one reward of a group can be taken).
 * @property {boolean}  closed - Another reward of the choice group was taken.
 *
 * @property {string}   uuidv4 - The GQL UUIDv4 / unique ID.
 */

/**
 * @typedef QuestRewardAddData
 *
 * @property {string}            type - Reward type.
 *
 * @property {QuestImgNameData}  data - Reward image / name from {@link Enrich.giverFromUUID}.
 *
 * @property {boolean}           hidden - Reward hidden.
 */

/**
 * @typedef QuestTaskData
 *
 * @property {string}   name - Task name.
 *
 * @property {boolean}  completed - Task completed.
 *
 * @property {boolean}  failed - Task failed.
 *
 * @property {boolean}  hidden - Task hidden.
 *
 * @property {string}   state - Task state.
 *
 * @property {string}   uuidv4 - The GQL UUIDv4 / unique ID.
 */

