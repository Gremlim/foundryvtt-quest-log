/**
 * Ownership configuration for quests. Core's ApplicationV2 `DocumentOwnershipConfig` is a `DocumentSheetV2`; the form
 * submission (and thus the document update) is handled by core, so no `_updateObject` override is needed (that was an
 * ApplicationV1 `FormApplication` API and is never invoked by ApplicationV2).
 *
 * When the underlying document / {@link JournalEntry} is updated the {@link QuestDB} will receive this update and
 * fire {@link QuestDBHooks} that other parts of GQL can respond to handle as necessary. In particular
 * {@link ViewManager} handles these hooks to update the GUI on local and remote clients when ownership change.
 */
export class GQLDocumentOwnershipConfig extends foundry.applications.apps.DocumentOwnershipConfig {}
