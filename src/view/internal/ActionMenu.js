import { Utils } from '../../control/index.js';

/**
 * Provides the "3 dots" dropdown menu that groups the action icons of the quests, objectives and rewards.
 *
 * The templates (and {@link Enrich.statusActions}) render the actions as usual (an `<i>` element with a title and the
 * data attributes that the click handlers use), but inside a hidden `.menu-items` container next to the toggle:
 *
 * ```
 * <span class="actions-menu">
 *    <i class="menu-toggle fas fa-ellipsis-vertical"></i>
 *    <span class="menu-items"><i class="delete fas fa-trash" ...></i> ...</span>
 * </span>
 * ```
 *
 * When the toggle is clicked a floating menu is built from those icons (the icon and the title as label) and clicking an
 * entry clicks the original icon, so all the existing handlers keep working untouched. The state of toggles (visible /
 * hidden, locked / unlocked, optional / required) is shown by the icon and the text of the entry, which come from the
 * original icon.
 */
export class ActionMenu
{
   /**
    * The open menu element.
    *
    * @type {HTMLElement|null}
    */
   static #menu = null;

   /**
    * The toggle element of the open menu.
    *
    * @type {HTMLElement|null}
    */
   static #toggle = null;

   /**
    * Removes the listeners of the open menu.
    *
    * @type {Function|null}
    */
   static #cleanup = null;

   /**
    * Registers the click handler of the toggles in the given root element. Call once per application.
    *
    * @param {HTMLElement}   root - The root element of an application.
    */
   static bind(root)
   {
      Utils.on(root, 'click', '.actions-menu .menu-toggle', (event) =>
      {
         event.preventDefault();
         ActionMenu.toggle(event.currentTarget);
      });
   }

   /**
    * Opens the menu of the toggle, or closes it when it is already open.
    *
    * @param {HTMLElement}   toggle - The `.menu-toggle` element.
    */
   static toggle(toggle)
   {
      const wasOpen = ActionMenu.#toggle === toggle;
      ActionMenu.close();
      if (!wasOpen) { ActionMenu.#open(toggle); }
   }

   /**
    * Closes the open menu if any.
    */
   static close()
   {
      if (ActionMenu.#cleanup) { ActionMenu.#cleanup(); }

      ActionMenu.#menu?.remove();
      ActionMenu.#toggle?.classList.remove('open');

      ActionMenu.#menu = null;
      ActionMenu.#toggle = null;
      ActionMenu.#cleanup = null;
   }

   /**
    * Builds and shows the menu.
    *
    * @param {HTMLElement}   toggle - The `.menu-toggle` element.
    */
   static #open(toggle)
   {
      const sources = Array.from(toggle.closest('.actions-menu')?.querySelectorAll('.menu-items > i') ?? []);
      if (!sources.length) { return; }

      const menu = document.createElement('div');
      menu.className = 'gql-action-menu';
      menu.setAttribute('role', 'menu');

      // Take the theme of the application as the menu is added to the body.
      const app = toggle.closest('.application');
      for (const name of ['themed', 'theme-dark', 'theme-light'])
      {
         if (app?.classList.contains(name)) { menu.classList.add(name); }
      }

      for (const source of sources)
      {
         const button = document.createElement('button');
         button.type = 'button';
         button.className = 'entry';
         button.setAttribute('role', 'menuitem');

         if (source.classList.contains('fa-trash')) { button.classList.add('danger'); }

         const icon = document.createElement('i');
         icon.className = Array.from(source.classList).filter((name) => name.startsWith('fa')).join(' ');

         const label = document.createElement('span');
         label.textContent = source.getAttribute('title') ?? source.dataset.tooltip ?? '';

         button.append(icon, label);

         button.addEventListener('click', (event) =>
         {
            event.preventDefault();
            event.stopPropagation();
            ActionMenu.close();
            source.click();
         });

         menu.append(button);
      }

      document.body.append(menu);

      // Right aligned below the toggle, or above when there is no room below.
      const anchor = toggle.getBoundingClientRect();
      const size = menu.getBoundingClientRect();

      const left = Math.max(4, Math.min(anchor.right - size.width, window.innerWidth - size.width - 4));
      let top = anchor.bottom + 2;
      if (top + size.height > window.innerHeight - 4) { top = Math.max(4, anchor.top - size.height - 2); }

      menu.style.left = `${left}px`;
      menu.style.top = `${top}px`;

      toggle.classList.add('open');

      const onPointerDown = (event) =>
      {
         if (!menu.contains(event.target) && !toggle.contains(event.target)) { ActionMenu.close(); }
      };

      const onKeyDown = (event) => { if (event.key === 'Escape') { ActionMenu.close(); } };
      const onClose = () => ActionMenu.close();

      document.addEventListener('pointerdown', onPointerDown, true);
      document.addEventListener('keydown', onKeyDown, true);
      window.addEventListener('blur', onClose);
      window.addEventListener('resize', onClose);
      document.addEventListener('scroll', onClose, true);

      ActionMenu.#menu = menu;
      ActionMenu.#toggle = toggle;

      ActionMenu.#cleanup = () =>
      {
         document.removeEventListener('pointerdown', onPointerDown, true);
         document.removeEventListener('keydown', onKeyDown, true);
         window.removeEventListener('blur', onClose);
         window.removeEventListener('resize', onClose);
         document.removeEventListener('scroll', onClose, true);
      };
   }
}
