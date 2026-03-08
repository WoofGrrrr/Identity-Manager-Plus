import { FileSystemBrokerAPI } from '../modules/FileSystemBroker/filesystem_broker_api.js';
import { Logger              } from '../modules/logger.js';
import { logProps, getExtensionId, getExtensionName, getI18nMsg, formatNowToDateTimeForFilename } from './utilities.js';



export class IdmOptions {
  #CLASS_NAME = this.constructor.name;


  #extId      = getExtensionId();
  #extName    = getExtensionName();

  #LOG        = false;
  #DEBUG      = false;
  #WARN       = false;

  static #BACKUP_FILENAME_EXTENSION  = ".idmbackup";
  static #BACKUP_FILENAME_MATCH_GLOB = "*.idmbackup";

  static IDENTITY_AUTO_SORT_BY_VALUE_NONE              = "NONE";           // MABXXX WE NEED A BETTER WAY TO DO THIS!!!
  static IDENTITY_AUTO_SORT_BY_VALUE_NAME              = "NAME";           // MABXXX WE NEED A BETTER WAY TO DO THIS!!!
  static IDENTITY_AUTO_SORT_BY_VALUE_EMAIL             = "EMAIL";          // MABXXX WE NEED A BETTER WAY TO DO THIS!!!
  static IDENTITY_AUTO_SORT_BY_VALUE_DOMAIN            = "DOMAIN";         // MABXXX WE NEED A BETTER WAY TO DO THIS!!!
  static IDENTITY_AUTO_SORT_BY_VALUE_HOST              = "HOST";           // MABXXX WE NEED A BETTER WAY TO DO THIS!!!

  static IDENTITY_AUTO_SORT_DIRECTION_VALUE_NONE       = "NONE";           // MABXXX WE NEED A BETTER WAY TO DO THIS!!!
  static IDENTITY_AUTO_SORT_DIRECTION_VALUE_ASCENDING  = "ASCENDING";      // MABXXX WE NEED A BETTER WAY TO DO THIS!!!
  static IDENTITY_AUTO_SORT_DIRECTION_VALUE_DESCENDING = "DESCENDING";     // MABXXX WE NEED A BETTER WAY TO DO THIS!!!

  static #DEFAULT_OPTION_KEYS = [
    'idmEnableComposeMessage',
    'idmEnableReplyMessage',
    'idmEnableForwardMessage',
    'idmEnableDraftMessage',
    'identitiesExtendedProps',
    'idmEnableKeepComposeOnClose',
    'idmAutoSortBySelect',
    'idmAutoSortDirectionSelect',
    'idmCollectFromAddresses',
    'idmCollectFromAddressAlert',
    'idmSkipOnboarding',
    'idmShowOptionsWindowOnStartup',
    'idmDisplayIdentityPositionInDisplayOrder',
    'idmDisplayIdentityIndexInDisplayOrder',
    'idmDisplayIdentityIdInDisplayOrder',
    'idmIdentityImportIdentitiesSelectorHideExistingCheck',
    'idmIdentityImportFileSelectorFilterGlobText',
    'idmHideDisplayOrderControls',
    'idmShowPopupOptions',
    'idmShowDisplayOrderHints',
    'idmShowDisplayOrderActions'
  ];

  static #DEFAULT_OPTION_VALUES = {
    'idmEnableComposeMessage':                              true,
    'idmEnableReplyMessage':                                true,
    'idmEnableForwardMessage':                              true,
    'idmEnableDraftMessage':                                false,
    'idmEnableKeepComposeOnClose':                          false,
    'idmAutoSortBySelect':                                  IdmOptions.IDENTITY_AUTO_SORT_BY_VALUE_EMAIL,              // MABXXX WE NEED A BETTER WAY TO DO THIS!!!
    'idmAutoSortDirectionSelect':                           IdmOptions.IDENTITY_AUTO_SORT_DIRECTION_VALUE_ASCENDING,   // MABXXX WE NEED A BETTER WAY TO DO THIS!!!
    'idmCollectFromAddresses':                              false,
    'idmCollectFromAddressAlert':                           false,
    'idmSkipOnboarding':                                    false,
    'idmShowOptionsWindowOnStartup':                        false,
    'idmDisplayIdentityPositionInDisplayOrder':             false,
    'idmDisplayIdentityIndexInDisplayOrder':                false,
    'idmDisplayIdentityIdInDisplayOrder':                   false,
    'idmIdentityImportIdentitiesSelectorHideExistingCheck': false,
    'idmIdentityImportFileSelectorFilterGlobText':          undefined,
    'idmHideDisplayOrderControls':                          false,
    'idmShowPopupOptions':                                  true,
    'idmShowDisplayOrderHints':                             true,
    'idmShowDisplayOrderActions':                           true
  };

  static {
    Object.freeze(this.#DEFAULT_OPTION_KEYS);
    Object.freeze(this.#DEFAULT_OPTION_VALUES);
  }

  #logger;
  #fsBrokerApi = new FileSystemBrokerAPI();
  


  constructor(logger) {
    this.#logger = logger;
  }



  log(...info) {
    if (! this.#LOG) return;
    this.#logger.log(this.#CLASS_NAME, ...info);
  }

  logAlways(...info) {
    this.#logger.log(this.#CLASS_NAME, ...info);
  }

  debug(...info) {
    if (! this.#DEBUG) return;
    this.#logger.debug(this.#CLASS_NAME, ...info);
  }

  debugAlways(...info) {
    this.#logger.debugAlways(this.#CLASS_NAME, ...info);
  }

  warn(...info) {
    if (! this.#WARN) return;
    this.#logger.debug(this.#CLASS_NAME, ...info);
  }

  warnAlways(...info) {
    this.#logger.warnAlways(this.#CLASS_NAME, ...info);
  }

  error(...info) {
    this.#logger.error(this.#CLASS_NAME, ...info);
  }

  caught(e, msg, ...info) {
    // always log exceptoions
    this.#logger.error( this.#CLASS_NAME,
                       msg,
                       "\n name:    " + e.name,
                       "\n message: " + e.message,
                       "\n stack:   " + e.stack,
                       ...info
                     );
  }



  async setupDefaultOptions() {
    this.debug("-- begin");

    var idmOptionKeys = await messenger.storage.local.get(IdmOptions.#DEFAULT_OPTION_KEYS);
    this.debug("locally stored options:", idmOptionKeys);

    for(const [optionKey, defaultValue] of Object.entries(IdmOptions.#DEFAULT_OPTION_VALUES)) {
      if (!(optionKey in idmOptionKeys)) {
        await messenger.storage.local.set(
          { [optionKey] : defaultValue }
        );
        this.debug(`new option: [${optionKey}]: ${defaultValue}`);
      }
    }

    this.debug("set extended properties");
    var identitiesProps = {};
    if ('identitiesExtendedProps' in idmOptionKeys) {
      this.debug("got extended properties from store");
      identitiesProps = idmOptionKeys['identitiesExtendedProps'];
    }

    var newIdentities = {};
    var nextPositionInMenu = Object.entries(identitiesProps).length;
    var accounts = await messenger.accounts.list(false); // includeSubFolders=false: do not get sub-folders
    for (const account of accounts) {
      for (const identity of account.identities) {
        if (! (identity.id in identitiesProps)) {
          this.debug(`new extended property for email="${identity.email}" name="${identity.name}" pos=${nextPositionInMenu}`);
          newIdentities[identity.id] = {
            'showInMenu': true,
            'lockInMenu': false,
            'collected':  false,
            'positionInMenu': nextPositionInMenu++
          };
        }
      }
    }

    if (Object.entries(newIdentities).length > 0) {
      this.debug("found new identities", newIdentities);
      var identitiesProps = {...identitiesProps, ...newIdentities};
      await messenger.storage.local.set(
        { 'identitiesExtendedProps' : identitiesProps }
      );

      this.debug("stored extended properties", identitiesProps);
    }

    if (! 'collectedIdentityIds' in idmOptionKeys) {
      this.debug("collectedIdentityIds properties");
      await messenger.storage.local.set(
        { 'collectedIdentityIds': [] }
      );
    }

    this.debug("-- end");
  }

  getDefaultOptionNames() {
    return IdmOptions.#DEFAULT_OPTION_KEYS;
  }

  getDefaultOptions() {
    return IdmOptions.#DEFAULT_OPTION_VALUES;
  }

  isDefaultOption(optionName) {
    return IdmOptions.#DEFAULT_OPTION_KEYS.includes(optionName);
  }



  async isEnabledComposeMessage() {
    return this.isEnabledOption("idmEnableComposeMessage", true);
  }

  async isEnabledReplyMessage() {
    return this.isEnabledOption("idmEnableReplyMessage", true);
  }

  async isEnabledForwardMessage() {
    return this.isEnabledOption("idmEnableForwardMessage", true);
  }

  async isEnabledDraftMessage() {
    return this.isEnabledOption( "idmEnableDraftMessage", false);
  }

  async isEnabledKeepComposeOnClose() {
    return this.isEnabledOption("idmEnableKeepComposeOnClose", false);
  }

  async isAutoSortByNone() {
    return this.isSelectedOption("idmAutoSortBySelect", IdmOptions.IDENTITY_AUTO_SORT_BY_VALUE_NONE, true);                      // MABXXX WE NEED A BETTER WAY TO DO THIS!!!
  }

  async isAutoSortByName() {
    return this.isSelectedOption("idmAutoSortBySelect", IdmOptions.IDENTITY_AUTO_SORT_BY_VALUE_NAME, false);                     // MABXXX WE NEED A BETTER WAY TO DO THIS!!!
  }

  async isAutoSortByEmail() {
    return this.isSelectedOption("idmAutoSortBySelect", IdmOptions.IDENTITY_AUTO_SORT_BY_VALUE_EMAIL, false);                    // MABXXX WE NEED A BETTER WAY TO DO THIS!!!
  }

  async isAutoSortByDomain() {
    return this.isSelectedOption("idmAutoSortBySelect", IdmOptions.IDENTITY_AUTO_SORT_BY_VALUE_DOMAIN, false);                   // MABXXX WE NEED A BETTER WAY TO DO THIS!!!
  }

  async isAutoSortByHost() {
    return this.isSelectedOption("idmAutoSortBySelect", IdmOptions.IDENTITY_AUTO_SORT_BY_VALUE_HOST, false);                     // MABXXX WE NEED A BETTER WAY TO DO THIS!!!
  }

  async isAutoSortDirectionNone() {
    return this.isSelectedOption("idmAutoSortDirectionSelect", IdmOptions.IDENTITY_AUTO_SORT_DIRECTION_VALUE_NONE, true);        // MABXXX WE NEED A BETTER WAY TO DO THIS!!!
  }

  async isAutoSortDirectionAscending() {
    return this.isSelectedOption("idmAutoSortDirectionSelect", IdmOptions.IDENTITY_AUTO_SORT_DIRECTION_VALUE_ASCENDING, false);  // MABXXX WE NEED A BETTER WAY TO DO THIS!!!
  }

  async isAutoSortDirectionDescending() {
    return this.isEnabledOption("idmAutoSortDirectionSelect", IdmOptions.IDENTITY_AUTO_SORT_DIRECTION_VALUE_DESCENDING, false);  // MABXXX WE NEED A BETTER WAY TO DO THIS!!!
  }

  async isEnabledCollectFromAddresses() {
    return this.isEnabledOption("idmCollectFromAddresses", false);
  }

  async isEnabledCollectFromAddressAlert() {
    return this.isEnabledOption("idmCollectFromAddressAlert", false);
  }

  async isEnabledSkipOnboarding() {
    return this.isEnabledOption("idmSkipOnboarding", false);
  }

  async isEnabledShowPopupOptions() {
    return this.isEnabledOption("idmShowPopupOptions", true);
  }

  async isEnabledShowDisplayOrderHints() {
    return this.isEnabledOption("idmShowDisplayOrderHints", true);
  }

  async isEnabledShowDisplayOrderActions() {
    return this.isEnabledOption("idmShowDisplayOrderActions", true);
  }

  async isEnabledShowOptionsWindowOnStartup() {
    return this.isEnabledOption("idmShowOptionsWindowOnStartup", false);
  }

  async isEnabledOption(key, defaultValue) {
    var idmOptions = await messenger.storage.local.get(key); // returns a Promise of an Object with a key-value pair for every key found

    var value = defaultValue;
    if (key in idmOptions) {
      value = idmOptions[key]; // get the value for the specific key
    }

    return value;
  }

  async isSelectedOption(key, option, defaultValue) {
    var idmOptions = await messenger.storage.local.get(key); // returns a Promise of an Object with a key-value pair for every key found

    var value = defaultValue;
    if (key in idmOptions) {
      value = idmOptions[key] === option; // get the value for the specific key
    }

    return value;
  }



  async getAllOptions() {
    return messenger.storage.local.get(); // returns a Promise of an array of Object with a key-value pair for every key found
  }



  async getOption(key, defaultValue) {
    var idmOptions = await messenger.storage.local.get(key); // returns a Promise of an Object with a key-value pair for every key found

    var value = defaultValue;
    if (key in idmOptions) {
      value = idmOptions[key]; // get the value for the specific key
    }

    return value;
  }



  // obj must be object like: {[key], value}
  async storeOption(obj) {
    return await messenger.storage.local.set(obj);
  }



  // build object {[key], value} and store it
  async saveOption(key, value) {
    let obj = {[key]: value};
    return await this.storeOption(obj);
  }



  async getIdentitiesExtendedProps() {
    var props = await messenger.storage.local.get('identitiesExtendedProps'); // returns Object with key-value pair for every key found
    if (props) {
      return props['identitiesExtendedProps'];
    }
  }

  async getExtendedPropsForIdentity(identityId) {
    if (identityId && identityId.length > 0) {
      var identitiesExtendedProps = await this.getIdentitiesExtendedProps()
      if (identitiesExtendedProps) {
        return identitiesExtendedProps[identityId];
      }
    }
  }

  async storeIdentitiesExtendedProps(props) {
    return await messenger.storage.local.set(
      { 'identitiesExtendedProps': props }
    );
  }



  async getWindowBounds(windowName) {
    if (windowName && windowName.length > 0) {
      let allWindowBounds = await this.getOption('windowBounds');
      if (allWindowBounds) return allWindowBounds[windowName];
    }
  }

  async storeWindowBounds(windowName, theWindow) {
    if (windowName && windowName.length > 0 && theWindow) {
      let allWindowBounds = await this.getOption('windowBounds');
      if (! allWindowBounds) allWindowBounds = {};

      let bounds = {
        "top":    theWindow.screenTop,
        "left":   theWindow.screenLeft,
        "width":  theWindow.outerWidth,
        "height": theWindow.outerHeight
      }

      allWindowBounds[windowName] = bounds;

      await this.saveOption('windowBounds', allWindowBounds);

      return bounds;
    }
  }



  async getCollectedIdentityIds() {
    const props = await messenger.storage.local.get('collectedIdentityIds'); // return Object with key-value pair for every key found

    if (! props) {
      this.debug("-- nothing from storage.local");

    } else {
      const collectedIdentityIds = props['collectedIdentityIds'];

      if (! collectedIdentityIds) {
        this.debug("-- no collectedIdentityIds");

      } else {
        this.debug("getCollectedIdentityIds -- collectedIdentityIds.length=" + collectedIdentityIds.length);
        if (collectedIdentityIds.length < 1) {
          this.debug("-- empty collectedIdentityIds");
        } else {
          if (this.#DEBUG) {
            for (const collectedIdentityId of collectedIdentityIds) {
              this.debug(`-- collectedIdentityId="${collectedIdentityId}"`);
            }
          }
        }
      }
      return collectedIdentityIds;
    }

    return [];
  }

  async recordCollectedIdentityId(identityId) {
    const collectedIdentityIds = await this.getCollectedIdentityIds();

    if (collectedIdentityIds && ! collectedIdentityIds.includes(identityId)) {
      collectedIdentityIds.push(identityId);
      await this.storeCollectedIdentityIds(collectedIdentityIds);
    }
  }

  async removeCollectedIdentityId(identityId) {
    const collectedIdentityIds = await this.getCollectedIdentityIds();

    if (collectedIdentityIds) {
      const idx = collectedIdentityIds.indexOf(identityId);
      if (idx >= 0) {
        collectedIdentityIds.splice(idx, 1);
        await this.storeCollectedIdentityIds(collectedIdentityIds);
      }
    }

  }

  async clearCollectedIdentityIds() {
    await this.storeCollectedIdentityIds([]);
  }

  async storeCollectedIdentityIds(identityIds) {
    return await messenger.storage.local.set(
      { collectedIdentityIds: identityIds }
    );
  }

  /* returns { "fileName": string, "bytesWritten":  number }
   *         { "invalid":  string                          } If the fileName or the full pathName for the file became too long. The returned string gives the reason.
   *         { "error":    string                          } If there was some error writing the file. The returned string gives the reason.
   */
  async backupToFile() {
    try {
      const fileName    = formatNowToDateTimeForFilename() + IdmOptions.#BACKUP_FILENAME_EXTENSION;
      const allOptions  = await this.getAllOptions();

      if (this.#DEBUG) {
        this.debugAlways(`-- Backing up all options to file "${fileName}"`);
        this.debugAlways("-- Backing up", allOptions);
        logProps("", "allOptions", allOptions);
      }
      const response = await this.#fsBrokerApi.writeObjectToJSONFile(fileName, allOptions);
      this.debugAlways(`--response: "${response}"`);

      return response;

    } catch (error) {
      this.caught(error, "-- Unexpected FileSystemBroker Error - Failed to write options backup file");
      return { "error": error.name + ": " + error.message };
    }
  }

  /* returns { "fileNames": [],    "length": number }
   *         { "error":     string                   } If there was some error writing the file. The returned string gives the reason.
   */
  async listBackupFiles() {
    try {
      this.debugAlways(`-- Getting list of options backup files with matchGlob "${this.#BACKUP_FILENAME_MATCH_GLOB}"`);
      const response = await this.#fsBrokerApi.listFiles(this.#BACKUP_FILENAME_MATCH_GLOB);
      this.debugAlways(`--response: "${response}"`);

      return response;

    } catch (error) {
      this.caught(error, "-- Unexpected FileSystemBroker Error - Failed to get options backup file list");
      return { "error": error.name + ": " + error.message };
    }
  }

  /* returns { "fileInfo": [],    "length": number } array of IOUtils.FileInfo - see the FileSystemBroker API README file
   *         { "error":    string                  } If there was some error writing the file. The returned string gives the reason.
   */
  async listBackupFileInfo() {
    try {
      this.debugAlways(`-- Getting list of options backup files with matchGlob "${IdmOptions.#BACKUP_FILENAME_MATCH_GLOB}"`);
      const response = await this.#fsBrokerApi.listFileInfo(IdmOptions.#BACKUP_FILENAME_MATCH_GLOB);
      this.debugAlways(`--response: "${response}"`);

      return response;

    } catch (error) {
      this.caught(error, "-- Unexpected FileSystemBroker Error - Failed to get options backup file list");
      return { "error": error.name + ": " + error.message };
    }
  }

  /* returns { "fileName": string, "data": object } javascript object
   *         { "invalid":  string                 } If the fileName is invalid or the full pathName for the file became too long. The returned string gives the reason.
   *         { "error":    string                 } If there was some error reading the file. The returned string gives the reason.
   */
  async readBackupFile(fileName) {
    try {
      this.debug(`-- Reading options backup file "${fileName}"`);
      const response = await this.#fsBrokerApi.readObjectFromJSONFile(fileName);
      this.debug(`--response: "${response}"`);

      return response;

    } catch (error) {
      this.caught(error, "-- Unexpected FileSystemBroker Error - Failed to read options backup file");
      return { "error": error.name + ": " + error.message };
    }
  }

  /* returns { "fileName": string, "object": object } (all options)
   *         { "invalid":  string                   } If the fileName is invalid or the full pathName for the file became too long. The returned string gives the reason.
   *         { "error":    string                   } If there was some error reading the file or restoring options. The returned string gives the reason.
   */
  async readOptionsFromBackupAndRestore(fileName) {
    this.debugAlways(`-- Reading options backup file "${fileName}"`);

    const response = await this.readBackupFile(fileName);

    if (response && response.object) {
      if (this.#DEBUG) {
        this.debugAlways(`-- readBackupFile "${fileName}" -- DATA RETURNED:\n\n${response.object}\n\n`);
        logProps("", "readOptionsFromBackupAndRestore", response.object);
      }

      // sanity checks on the data?

      try {
        await messenger.storage.local.set(response.object);
      } catch (error) {
        this.caught(`-- STORAGE ERROR - Failed to restore options from file "${fileName}" -- messenger.storage.local.set() failed`);
        return { "error": `Failed to restore options from file "${fileName}" --  messenger.storage.local.set() failed` };
      }
    }

    return response;
  }

  /* returns object (all options)
   *
   * throws if unable to read backup file
   * or if unable to restore the options into local storage
   */
  async getOptionsFromBackupAndRestore(fileName) {
    this.debugAlways(`-- Reading options backup file "${fileName}"`);

    const response = await this.readBackupFile(fileName);

    if (! response) {
      this.error(`-- readBackupFile "${fileName}" -- READ FILE ERROR: NO RESPONSE FROM FileSystemBroker`);
      throw new Error(`readBackupFile "${fileName}" -- READ FILE ERROR: NO RESPONSE FROM FileSystemBroker`);
    } else if (response.invalid) {
      this.debugAlways(`-- readBackupFile "${fileName}" -- READ FILE ERROR: ${response.invalid}`);
      throw new Error(`readBackupFile "${fileName}" -- READ FILE ERROR: ${response.invalid}`);
    } else if (response.error) {
      this.debugAlways(`-- readBackupFile "${fileName}" -- READ FILE ERROR: ${response.error}`);
      throw new Error(`readBackupFile "${fileName}" -- READ FILE ERROR: ${response.error}`);
    } else if (! response.fileName) {
      this.error(`-- readBackupFile "${fileName}" -- NO FILENAME RETURNED`);
      throw new Error(`readBackupFile "${fileName}" -- NO FILENAME RETURNED`);
    } else if (! response.object) {
      this.error(`-- readBackupFile "${fileName}" -- NO DATA RETURNED`);
      throw new Error(`readBackupFile "${fileName}" -- NO DATA RETURNED`);
    }

    if (this.#DEBUG) {
      this.debugAlways(`-- readBackupFile "${fileName}" -- DATA RETURNED:`);
      logProps("", "getOptionsFromBackupAndRestore", response.object);
    }

    // sanity checks on the data?

    try {
      await messenger.storage.local.set(response.object);
    } catch (error) {
      this.caught(`-- STORAGE ERROR - Failed to restore options from file "${fileName}" -- messenger.storage.local.set() failed`);
      throw new Error(`Failed to restore options from file "${fileName}" --  messenger.storage.local.set() failed`);
    }

    return response.object;
  }

  /* returns { "fileName": string, "deleted": boolean }
   *         { "invalid":  string                     } If the fileName is invalid or the full pathName for the file became too long. The returned string gives the reason.
   *         { "error":    string                     } If there was some error deleting the file. The returned string gives the reason.
   */
  async deleteBackupFile(fileName) {
    try {
      this.debug(`-- Deleting options backup file "${fileName}"`);
      const response = await this.#fsBrokerApi.deleteFile(fileName);
      this.debug(`--response: "${response}"`);

      return response;

    } catch (error) {
      this.caught(error, `-- FileSystemBrokerError - Failed to delete options backup file "${fileName}"`);
      return { "error": error.name + ": " + error.message };
    }
  }
}
