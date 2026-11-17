/**
 * Defines the main FQL constants for module name and the DB flag.
 *
 * @type {{folderState: string, flagDB: string, moduleName: string, moduleLabel: string, primaryState: string}}
 */
const constants = {
   moduleName: 'quest-log',
   moduleLabel: `Forien's Quest Log`,
   flagDB: 'json'
};

/**
 * Defines the DOM event events that are used in FQL.
 *
 * @type {{click: string, dblclick: string, dragstart: string, drop: string, focus: string, focusout: string, mousedown: string}}
 */
const domEvents = {
   change: 'change',
   click: 'click',
   dblclick: 'dblclick',
   dragenter: 'dragenter',
   dragover: 'dragover',
   dragstart: 'dragstart',
   drop: 'drop',
   focus: 'focus',
   focusout: 'focusout',
   keydown: 'keydown',
   mousedown: 'mousedown'
};

/**
 * Stores strings for quest types (statuses)
 *
 * @returns {{active: string, available: string, completed: string, failed: string, inactive: string}}
 */
const questStatus = {
   active: 'active',
   available: 'available',
   completed: 'completed',
   failed: 'failed',
   inactive: 'inactive',
   rumor: 'rumor'
};

/**
 * Stores localization strings for quest types (statuses)
 *
 * @type {{active: string, available: string, completed: string, failed: string, inactive: string}}
 */
const questStatusI18n = {
   active: 'ForienQuestLog.QuestTypes.Labels.Active',
   available: 'ForienQuestLog.QuestTypes.Labels.Available',
   completed: 'ForienQuestLog.QuestTypes.Labels.Completed',
   failed: 'ForienQuestLog.QuestTypes.Labels.Failed',
   inactive: 'ForienQuestLog.QuestTypes.Labels.InActive',
   rumor: 'ForienQuestLog.QuestTypes.Labels.Rumor'
};

/**
 * Stores the QuestLog tab indexes. This is used by QuestLog.setPosition to select the current table based on status
 * name.
 *
 * @type {{inactive: number, available: number, active: number, completed: number, failed: number}}
 */
const questTabIndex = {
   active: 1,
   available: 0,
   completed: 2,
   failed: 3,
   inactive: 4,
   rumor: 5
};

/**
 * Stores the keys used with session storage.
 *
 * @type {FQLSessionConstants}
 */
const sessionConstants = {
   currentPrimaryQuest: 'quest-log.questlog.currentPrimaryQuest',
   logGroupBy: 'quest-log.questlog.groupBy-',
   logGroupCollapsed: 'quest-log.questlog.groupCollapsed-',
   trackerFolderState: 'quest-log.questtracker.folderState-',
   trackerGroupCollapsed: 'quest-log.questtracker.groupCollapsed-',
   trackerGroupBy: 'quest-log.questtracker.groupBy',
   trackerHiddenQuests: 'quest-log.questtracker.hiddenQuests',
   trackerShowBackground: 'quest-log.questtracker.showBackground',
   trackerShowHidden: 'quest-log.questtracker.showHidden',
   trackerShowPrimary: 'quest-log.questtracker.showPrimary'
};

/**
 * @type {FQLSettings} Defines all the module settings for world and client.
 */
const settings = {
   allowPlayersAccept: 'allowPlayersAccept',
   allowPlayersCreate: 'allowPlayersCreate',
   allowPlayersDrag: 'allowPlayersDrag',
   countHidden: 'countHidden',
   dateMode: 'dateMode',
   defaultAbstractRewardImage: 'defaultAbstractRewardImage',
   defaultPermission: 'defaultPermission',
   dynamicBookmarkBackground: 'dynamicBookmarkBackground',
   hideFQLFromPlayers: 'hideFQLFromPlayers',
   historyVisibility: 'historyVisibility',
   navStyle: 'navStyle',
   notifyRewardDrop: 'notifyRewardDrop',
   primaryQuest: 'primaryQuest',
   questTrackerEnable: 'questTrackerEnable',
   questTrackerPinned: 'questTrackerPinned',
   questTrackerPosition: 'questTrackerPosition',
   questTrackerResizable: 'questTrackerResizable',
   showFolder: 'showFolder',
   showTasks: 'showTasks',
   trustedPlayerEdit: 'trustedPlayerEdit'
};

/**
 * @type {FQLKeybindings} Defines all the module keybindings for world and client.
 */
const keybindings = {
   openQuestLog: 'openQuestLog',
   openPrimaryQuest: 'openPrimaryQuest',
   toggleQuestTracker: 'toggleQuestTracker',
};

export { constants, domEvents, questStatus, questStatusI18n, questTabIndex, sessionConstants, settings, keybindings };

/**
 * @typedef {object} FQLSessionConstants
 *
 * @property {string}   currentPrimaryQuest - Stores current primary quest set from {@link FQLSettings.primaryQuest}.
 *
 * @property {string}   trackerFolderState - Stores a boolean with tacked on quest ID for whether objectives are shown.
 *
 * @property {string}   logGroupBy - Prefix of the key storing how the quests of a tab of the quest log are grouped.
 *
 * @property {string}   logGroupCollapsed - Prefix of the keys storing the collapsed groups of the quest log.
 *
 * @property {string}   trackerGroupCollapsed - Prefix of the keys storing the collapsed quest groups of the tracker.
 *
 * @property {string}   trackerGroupBy - Stores how the tracker groups the quests: none, group, giver or location.
 *
 * @property {string}   trackerHiddenQuests - Stores a JSON array of the IDs of the quests the user removed from the tracker.
 *
 * @property {string}   trackerShowHidden - Stores a boolean if the tracker also shows the quests removed from it.
 *
 * @property {string}   trackerShowBackground - Shows / hides the quest tracker background.
 *
 * @property {string}   trackerShowPrimary - Stores a boolean if the tracker is showing the primary quest or all quests.
 */

/**
 * @typedef {object} FQLSettings
 *
 * @property {string}   allowPlayersAccept - Allow players to accept quests.
 *
 * @property {string}   allowPlayersCreate - Allow players to create quests.
 *
 * @property {string}   allowPlayersDrag - Allow players to drag reward items to actor sheet.
 *
 * @property {string}   countHidden - Count hidden objectives / subquests.
 *
 * @property {string}   defaultAbstractRewardImage - Sets the default abstract reward image path.
 *
 * @property {string}   defaultPermission - Sets the default permission level for new quests.
 *
 * @property {string}   dateMode - Date shown in the history and used for deadlines: world calendar or real date.
 *
 * @property {string}   dynamicBookmarkBackground - Uses jQuery to dynamically set the tab background image.
 *
 * @property {string}   hideFQLFromPlayers - Completely hides FQL from players.
 *
 * @property {string}   historyVisibility - Who can see the quest history: only GMs or everyone that sees the quest.
 *
 * @property {string}   navStyle - Navigation style / classic / or bookmark tabs.
 *
 * @property {string}   notifyRewardDrop - Post a notification UI message when rewards are dropped in actor sheets.
 *
 * @property {string}   primaryQuest - Stores the quest ID of a quest that is the current primary quest.
 *
 * @property {string}   questTrackerEnable - Enables the quest tracker.
 *
 * @property {string}   questTrackerPinned - Is the QuestTracker pinned to the side bar.
 *
 * @property {string}   questTrackerPosition - Hidden setting to store current quest tracker position.
 *
 * @property {string}   questTrackerResizable - Stores the current window handling mode ('auto' or 'resize').
 *
 * @property {string}   showFolder - Shows the `_fql_quests` directory in the journal entries sidebar.
 *
 * @property {string}   showTasks - Determines if objective counts are rendered.
 *
 * @property {string}   trustedPlayerEdit - Allows trusted players to have full quest editing capabilities.
 */

/**
 * @typedef {object} FQLKeybindings
 *
 * @property {string}   openQuestLog - Press to open Quest Log.
 *
 * @property {string}   openPrimaryQuest - Press to open Primary Quest
 *
 * @property {string}   toggleQuestTracker - Press to toggle Quest Tracker
 */
