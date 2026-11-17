import { FVTTCompat }   from './index.js';

import {
   constants,
   domEvents,
   settings }           from '../../model/constants.js';

/**
 * Provides several general utility methods interacting with Foundry via UUID lookups to generating UUIDv4 internal
 * FQL IDs. There are also several general methods for Handlebars setup.
 */
export class Utils
{
   /**
    * @private
    */
   constructor()
   {
      throw new Error('This is a static class that should not be instantiated.');
   }

   /**
    * The hidden FQL quests folder name.
    *
    * @type {string}
    */
   static #questDirName = '_ql_quests';

   /**
    * Uses `navigator.clipboard` if available then falls back to `document.execCommand('copy')` if available to copy
    * the given text to the clipboard.
    *
    * @param {string}   text - Text to copy to the browser clipboard.
    *
    * @returns {Promise<boolean>} Copy successful.
    */
   static async copyTextToClipboard(text)
   {
      if (typeof text !== 'string')
      {
         throw new TypeError(`FQL copyTextToClipboard error: 'text' is not a string.`);
      }

      let success = false;

      if (navigator.clipboard)
      {
         try
         {
            await navigator.clipboard.writeText(text);
            success = true;
         }
         catch (err) { /**/ }
      }
      else if (document.execCommand instanceof Function)
      {
         const textArea = document.createElement('textarea');

         // Place in the top-left corner of screen regardless of scroll position.
         textArea.style.position = 'fixed';
         textArea.style.top = '0';
         textArea.style.left = '0';

         // Ensure it has a small width and height. Setting to 1px / 1em
         // doesn't work as this gives a negative w/h on some browsers.
         textArea.style.width = '2em';
         textArea.style.height = '2em';

         // We don't need padding, reducing the size if it does flash render.
         textArea.style.padding = '0';

         // Clean up any borders.
         textArea.style.border = 'none';
         textArea.style.outline = 'none';
         textArea.style.boxShadow = 'none';

         // Avoid flash of the white box if rendered for any reason.
         textArea.style.background = 'transparent';

         textArea.value = text;

         document.body.appendChild(textArea);
         textArea.focus();
         textArea.select();

         try
         {
            success = document.execCommand('copy');
         }
         catch (err) { /**/ }

         document.body.removeChild(textArea);
      }

      return success;
   }

   /**
    * Registers a delegated native event listener on a persistent root element. The handler is invoked when the event
    * target is (inside of) an element matching `selector` that is a descendant of `root`. The handler receives an
    * event that behaves like the native event, except that `currentTarget` is the matched element (like delegated
    * jQuery handlers) and `originalEvent` is the native event.
    *
    * @param {HTMLElement}    root - The persistent element to listen on.
    *
    * @param {string}         type - Event type. `focus` / `blur` are mapped to the bubbling `focusin` / `focusout`.
    *
    * @param {string|null}    selector - CSS selector of the elements to handle; when falsy all events are handled.
    *
    * @param {Function}       handler - Event handler.
    *
    * @param {object}         [options] - Optional `addEventListener` options.
    *
    * @returns {Function} A function that removes the listener.
    */
   static on(root, type, selector, handler, options = void 0)
   {
      const mapped = type === 'focus' ? 'focusin' : type === 'blur' ? 'focusout' : type;

      const listener = (event) =>
      {
         let matched = root;

         if (selector)
         {
            matched = event.target instanceof Element ? event.target.closest(selector) : null;
            if (!matched || !root.contains(matched)) { return; }
         }

         const proxy = new Proxy(event, {
            get: (target, key) =>
            {
               if (key === 'currentTarget') { return matched; }
               if (key === 'originalEvent') { return target; }

               const value = Reflect.get(target, key, target);
               return typeof value === 'function' ? value.bind(target) : value;
            }
         });

         return handler(proxy);
      };

      root.addEventListener(mapped, listener, options);

      return () => root.removeEventListener(mapped, listener, options);
   }

   /**
    * Reads a `data-*` attribute from an element like jQuery `.data()` did: the key may be kebab or camel case and
    * values that are valid JSON (numbers, booleans, objects) are parsed.
    *
    * @param {Element}  element - Target element.
    *
    * @param {string}   key - Data key without the `data-` prefix; for example `quest-id`.
    *
    * @returns {*} The parsed value or undefined if not present.
    */
   static data(element, key)
   {
      const camel = key.replace(/-([a-z])/g, (m, c) => c.toUpperCase());
      const value = element?.dataset?.[camel];

      if (value === void 0) { return void 0; }
      if (value === 'null') { return null; }

      // Only parse numbers, booleans and JSON objects / arrays; everything else (including strings like `01`) is kept.
      if (/^(true|false)$/.test(value) || /^-?(0|[1-9]\d*)(\.\d+)?$/.test(value) || /^[[{]/.test(value))
      {
         try { return JSON.parse(value); } catch (err) { /* Not JSON; use the string. */ }
      }

      return value;
   }

   /**
    * Creates a delegated single / double click handler with a default delay of 400ms.
    *
    * @param {object}      opts - Options.
    *
    * @param {HTMLElement} opts.root - Persistent element the click handlers are delegated from.
    *
    * @param {string}      opts.selector - CSS selector of the clickable elements.
    *
    * @param {Function}    [opts.singleCallback] - Single click callback.
    *
    * @param {Function}    [opts.doubleCallback] - Double click callback.
    *
    * @param {number}      [opts.delay=400] - Double click delay.
    */
   static createDblClick({ root, selector, singleCallback, doubleCallback, delay = 400 } = {})
   {
      let clicks = 0;
      let timer;

      Utils.on(root, domEvents.click, selector, (event) =>
      {
         clicks++;

         if (clicks === 1)
         {
            timer = setTimeout(() =>
            {
               if (typeof singleCallback === 'function') { singleCallback(event); }
               clicks = 0;
            }, delay);
         }
         else
         {
            clearTimeout(timer);
            if (typeof doubleCallback === 'function') { doubleCallback(event); }
            clicks = 0;
         }
      });

      Utils.on(root, domEvents.dblclick, selector, (event) => event.preventDefault());
   }

   /**
    * @returns {boolean} True if the original Forien's Quest Log is also enabled. In that case this module avoids the
    *                    shared hooks / keybindings / UI names so both can run side by side with separate data.
    */
   static isForienActive()
   {
      return !!game.modules.get('forien-quest-log')?.active;
   }

   /**
    * A convenience method to return the module data object for FQL.
    *
    * This is a scoped location where we can store any FQL data.
    *
    * @returns {object} The FQL module data object.
    */
   static getModuleData()
   {
      return game.modules.get(constants.moduleName);
   }

   /**
    * Parses a UUID and returns the component data parts.
    *
    * @param {string|object}  data - The UUID as a string or object with UUID key as a string.
    *
    * @returns {{id: string, type: string}|{id: string, type: string, pack: string}|*} UUID data parts
    */
   static getDataFromUUID(data)
   {
      const uuid = typeof data === 'string' ? data : data.uuid;

      if (typeof uuid !== 'string') { return void 0; }

      const match = uuid.match(/(\w+)/gm);

      switch (match.length)
      {
         case 2:
            return { type: match[0], id: match[1] };
         case 4:
            return { type: match[0], pack: `${match[1]}.${match[2]}`, id: match[3] };
         default:
            return void 0;
      }
   }

   /**
    * Gets a document for the given UUID. An error message will post if the UUID is invalid and a warning
    * message will be posted if the current `game.user` does not have permission to view the document.
    *
    * @param {string|object}  data - The UUID as a string or object with UUID key as a string.
    *
    * @param {boolean}  [permissionCheck] - The UUID as a string or object with UUID key as a string.
    *
    * @returns {Promise<void>}
    */
   static async getDocumentFromUUID(data, { permissionCheck = true } = {})
   {
      const uuid = typeof data === 'string' ? data : data.uuid;

      let document = null;

      try
      {
         const doc = await fromUuid(uuid);

         if (doc === null)
         {
            ui.notifications.error(game.i18n.format('ForienQuestLog.API.Utils.Notifications.NoDocument', { uuid }));
            return null;
         }

         const checkPerm = typeof permissionCheck === 'boolean' ? permissionCheck : true;

         if (checkPerm && !doc.testUserPermission(game.user, CONST.DOCUMENT_OWNERSHIP_LEVELS.OBSERVER))
         {
            ui.notifications.warn('ForienQuestLog.API.Utils.Notifications.NoPermission', { localize: true });
            return null;
         }

         document = doc;
      }
      catch (err)
      {
         ui.notifications.error(game.i18n.format('ForienQuestLog.API.Utils.Notifications.NoDocument', { uuid }));
         console.error(err);
      }

      return document;
   }

   /**
    * Returns the quest folder or initializes and returns the quest folder if it doesn't exist and `create` is true.
    *
    * @returns {Folder} The quest folder.
    * @see https://foundryvtt.com/api/classes/client.Folder.html
    */
   static getQuestFolder()
   {
      // The folder is identified by a flag so that it can be renamed (#156). It is never matched by name so that the
      // data is kept separate from the original Forien's Quest Log (`_fql_quests`) when both modules are enabled.
      return game.journal.folders.find((f) => f.getFlag(constants.moduleName, 'questFolder') === true);
   }

   /**
    * Builds a UUID for the given actor / journal / item data.
    *
    * @param {object}   data - document data
    *
    * @param {string[]|undefined} type - Provide a list of Document types to build a UUID from given data. If the type
    *                                    doesn't match the data undefined is returned. If type is undefined any document
    *                                    will match.
    *
    * @returns {string|undefined} UUID
    */
   static getUUID(data, type = void 0)
   {
      // Verify data.
      if (typeof data !== 'object' || data === null) { return void 0; }

      // 'type' doesn't match the data type.
      if (Array.isArray(type) && !type.includes(data.type)) { return void 0; }
      if (typeof type === 'string' && data.type !== type) { return void 0; }

      if (typeof data.uuid === 'string')
      {
         // Must verify that this is not an owned item from an actor. Search for multiple `.`
         if (data.uuid.startsWith('Actor') && (data.uuid.match(/\./g) || []).length > 1)
         {
            return void 0;
         }

         return data.uuid;
      }
      else
      {
         return void 0;
      }
   }

   /**
    * Returns the quest folder or initializes and returns the quest folder if it doesn't exist and `create` is true.
    *
    * @returns {Promise<Folder>} The quest folder.
    * @see https://foundryvtt.com/api/classes/client.Folder.html
    */
   static async initializeQuestFolder()
   {
      const folder = this.getQuestFolder();
      if (folder !== void 0) { return folder; }

      if (game.user.isGM)
      {
         await Folder.create({
            name: this.#questDirName,
            type: 'JournalEntry',
            parent: null,
            flags: { [constants.moduleName]: { questFolder: true } }
         });
      }

      return this.getQuestFolder();
   }

   /**
    * Returns whether the player is a trusted player and `trustedPlayerEdit` is enabled.
    *
    * @param {User} user - User to check for trusted status and `trustedPlayerEdit`.
    *
    * @returns {boolean} Is trusted player edit.
    */
   static isTrustedPlayerEdit(user = game.user)
   {
      return user.isTrusted && game.settings.get(constants.moduleName, settings.trustedPlayerEdit);
   }

   /**
    * Returns true if FQL is hidden from players. This will always return false if the user is a GM.
    *
    * @returns {boolean} Is FQL hidden from players.
    */
   static isFQLHiddenFromPlayers()
   {
      if (game.user.isGM) { return false; }

      return game.settings.get(constants.moduleName, settings.hideFQLFromPlayers);
   }

   /**
    * Sets an image based on boolean setting state for FQL macros.
    *
    * @param {string|string[]}   setting - Setting name.
    *
    * @param {boolean}           [value] - Current setting value.
    *
    * @returns {Promise<void>}
    */
   static async setMacroImage(setting, value = void 0)
   {
      const userID = game.user.id;

      const fqlSettings = Array.isArray(setting) ? setting : [setting];

      for (const macroEntry of game.macros.contents)
      {
         for (const currentSetting of fqlSettings)
         {
            // Test if the FQL `macro-setting` flag value against the setting supplied.
            const macroSetting = macroEntry.getFlag(constants.moduleName, 'macro-setting');
            if (macroSetting !== currentSetting) { continue; }

            // Only set macro image if the author of the macro matches the user and the user is an owner.
            const macroAuthor = FVTTCompat.authorID(macroEntry);
            if (macroAuthor !== userID || !macroEntry.isOwner) { continue; }

            const state = value ?? game.settings.get(constants.moduleName, currentSetting);

            // Pick the correct image for the current state.
            const img = typeof state === 'boolean' && state ?
             `modules/quest-log/assets/icons/macros/${currentSetting}On.png` :
             `modules/quest-log/assets/icons/macros/${currentSetting}Off.png`;

            await macroEntry.update({ img }, { diff: false });
         }
      }
   }

   /**
    * Shows a document sheet for the given UUID. An error message will post if the UUID is invalid and a warning
    * message will be posted if the current `game.user` does not have permission to view the document.
    *
    * @param {string|object}  data - The UUID as a string or object with UUID key as a string.
    *
    * @param {object}         [opts] - Optional parameters.
    *
    * @param {boolean}        [opts.permissionCheck=true] - Perform permission check.
    *
    * @param {...*}           [opts.options] - Options to pass to sheet render method.
    *
    * @returns {Promise<foundry.applications.api.ApplicationV2|null>} The sheet if newly rendered otherwise null.
    */
   static async showSheetFromUUID(data, { permissionCheck = true, ...options } = {})
   {
      const uuid = typeof data === 'string' ? data : data.uuid;

      try
      {
         const document = await fromUuid(uuid);

         if (document === null)
         {
            ui.notifications.error(game.i18n.format('ForienQuestLog.API.Utils.Notifications.NoDocument', { uuid }));
            return null;
         }

         if (permissionCheck && !document.testUserPermission(game.user, CONST.DOCUMENT_OWNERSHIP_LEVELS.OBSERVER))
         {
            ui.notifications.warn('ForienQuestLog.API.Utils.Notifications.NoPermission', { localize: true });
            return null;
         }

         if (document?.sheet)
         {
            if (document.sheet.rendered)
            {
               document.sheet.bringToFront();
               return null;
            }
            else
            {
               document.sheet.render({ force: true, ...options });
               return document.sheet;
            }
         }
      }
      catch (err)
      {
         ui.notifications.error(game.i18n.format('ForienQuestLog.API.Utils.Notifications.NoDocument', { uuid }));
         console.error(err);
         return null;
      }
   }

   /**
    * Preloads templates for partials
    */
   static preloadTemplates()
   {
      let templates = [
         "templates/partials/quest-log/tab.html",
         "templates/partials/quest-preview/details.html",
         "templates/partials/quest-preview/gmnotes.html",
         "templates/partials/quest-preview/management.html",
         "templates/partials/quest-preview/playernotes.html"
      ];

      templates = templates.map((t) => `modules/quest-log/${t}`);
      foundry.applications.handlebars.loadTemplates(templates);
   }

   /**
    * Register additional Handlebars helpers. `format` allows invoking `game.i18n.format` from a Handlebars template.
    */
   static registerHandlebarsHelpers()
   {
      Handlebars.registerHelper('fql_format', (stringId, ...arrData) =>
      {
         let objData;
         if (typeof arrData[0] === 'object')
         {
            objData = arrData[0];
         }
         else
         {
            objData = { ...arrData };
         }

         return game.i18n.format(stringId, objData);
      });
   }

   /**
    * Generates a UUID v4 compliant ID. This is used by Quest to attach a UUID to any data that isn't backed by a
    * FoundryVTT document. Right now that is particularly {@link Task}. All GUI interaction and storage in Quest data
    * that isn't based on an FVTT document must use a UUIDv4 to interact with this data. Lookups in Quest data must be
    * by UUIDv4 to find an index in Quest data arrays before modifying data. FQL is potentially a multi-user module
    * where many users could potentially be modifying Quest data that isn't backed by an FVTT document, so the Foundry
    * core DB won't be synching or resolving this data.
    *
    * This code is an evolution of the following Gist.
    * https://gist.github.com/jed/982883
    *
    * There is a public domain / free copy license attached to it that is not a standard OSS license...
    * https://gist.github.com/jed/982883#file-license-txt
    *
    * @returns {string} UUIDv4
    */
   static uuidv4()
   {
      return ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, (c) =>
       (c ^ (window.crypto || window.msCrypto).getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16));
   }
}
