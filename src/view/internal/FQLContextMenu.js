/**
 * Provides a context menu for the FQL apps that always uses native `HTMLElement` callbacks (`jQuery: false`) and a
 * fixed position by default. Menu entries must use the `label`, `onClick` and `visible` keys; the `name`, `callback`
 * and `condition` keys are deprecated since Foundry v14.
 */
export class FQLContextMenu extends foundry.applications.ux.ContextMenu
{
   /**
    * @param {HTMLElement}   container - The element that contains the targets of the context menu.
    *
    * @param {string}        selector - CSS selector of the targets inside `container`.
    *
    * @param {object[]}      menuItems - Context menu entries.
    *
    * @param {object}        [options] - Additional ContextMenu options.
    *
    * @inheritDoc
    */
   constructor(container, selector, menuItems, options = {})
   {
      super(container, selector, menuItems, { fixed: true, ...options, jQuery: false });
   }
}
