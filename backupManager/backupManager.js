import { FileSystemBrokerAPI } from '../modules/FileSystemBroker/filesystem_broker_api.js';
import { IdmOptions          } from '../modules/options.js';
import { Logger              } from '../modules/logger.js';
import { getI18nMsg, formatMsToDateTime24HR , formatMsToDateTime12HR } from '../modules/utilities.js';




class BackupManager {
  #CLASS_NAME    = this.constructor.name;

  #LOG           = false;
  #DEBUG         = false;
  #WARN          = false;

  #logger        = new Logger();
  #idmOptionsApi = new IdmOptions(this.#logger);
  #fsBrokerApi   = new FileSystemBrokerAPI();

  #fileSystemBrokerAccessGranted  = false;
  #fileSystemBrokerAccessReadOnly = false;
  #canceled                       = false;

  #fileListHdr_text_fileName          = getI18nMsg("idmBackupManager_fileListHdr_text_fileName");
  #fileListHdr_text_creationTime      = getI18nMsg("idmBackupManager_fileListHdr_text_creationTime");
  #fileListHdr_text_fileSizeFormatted = getI18nMsg("idmBackupManager_fileListHdr_text_fileSizeFormatted");
  #fileListHdr_text_fileSizeBytes     = getI18nMsg("idmBackupManager_fileListHdr_text_fileSizeBytes");



  constructor() {
  }



  log(...info) {
    if (! this.#LOG) return;
    this.#logger.log(this.#CLASS_NAME, ...info);
  }

  logAlways(...info) {
    this.#logger.logAlways(this.#CLASS_NAME, ...info);
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



  async run(e) {
    this.debug("-- begin");

    ////window.onbeforeunload = (e) => this.windowUnloading(e);
    window.addEventListener("beforeunload", (e) => this.#windowUnloading(e));

    await this.#updateBackupFilesDirectoryUI();
    await this.#localizePage();
    await this.#buildUI();
    this.#setupEventListeners();

    this.debug("-- end");
  }



  #setupEventListeners() {
    const backupBtn = document.getElementById("idmBackupManagerBackupButton");
    backupBtn.addEventListener("click", (e) => this.#backupButtonClicked(e));

    const restoreBtn = document.getElementById("idmBackupManagerRestoreButton");
    restoreBtn.addEventListener("click", (e) => this.#restoreButtonClicked(e));

    const deleteBtn = document.getElementById("idmBackupManagerDeleteButton");
    deleteBtn.addEventListener("click", (e) => this.#deleteButtonClicked(e));

    const doneBtn = document.getElementById("idmBackupManagerDoneButton");
    doneBtn.addEventListener("click", (e) => this.#doneButtonClicked(e));
  }



  async #localizePage() {
    this.debug("-- start");

    for (const el of document.querySelectorAll("[data-l10n-id]")) {
      const id = el.getAttribute("data-l10n-id");
      let i18nMessage = browser.i18n.getMessage(id);
      if (i18nMessage == "") {
        i18nMessage = id;
      }
      el.textContent = i18nMessage;
    }

    for (const el of document.querySelectorAll("[data-html-l10n-id]")) {
      const id = el.getAttribute("data-html-l10n-id");
      let i18nMessage = browser.i18n.getMessage(id);
      if (i18nMessage == "") {
        i18nMessage = id;
      }
      el.insertAdjacentHTML('afterbegin', i18nMessage);
    }

    this.debug("-- end");
  }
  


  async #updateBackupFilesDirectoryUI() {
    const backupFilesDirectoryPathNameLabel = document.getElementById("idmBackupFilesDirectoryPathName");
    const response                          = await this.#fsBrokerApi.getFullPathName(); // MABXXX perhaps this should come from idmOptionsApi???

    if (response && response.fullPathName) {
      backupFilesDirectoryPathNameLabel.textContent = response.fullPathName;
    } else {
      backupFilesDirectoryPathNameLabel.textContent = "???";
    }
  }
  


  async #windowUnloading(e) {
    if (this.#DEBUG) this.debugAlways( "--- Window Unloading ---"
                                       + `\n- window.screenTop=${window.screenTop}`
                                       + `\n- window.screenLeft=${window.screenLeft}`
                                       + `\n- window.outerWidth=${window.outerWidth}`
                                       + `\n- window.outerHeight=${window.outerHeight}`
                                       + `\n- this.#canceled=${this.#canceled}`
                                     );
    await this.#idmOptionsApi.storeWindowBounds("backupManagerWindowBounds", window);

    if (this.#DEBUG) {
      let bounds = await this.#idmOptionsApi.getWindowBounds("backupManagerWindowBounds");

      if (! bounds) {
        this.debugAlways("--- WINDOW UNLOADING --- Retrieve Stored Window Bounds --- FAILED TO GET Backup Manager Window Bounds ---");
      } else if (typeof bounds !== 'object') {
        this.debugAlways(`--- WINDOW UNLOADING --- Retrieve Stored Window Bounds --- Backup Manager Window Bounds IS NOT AN OBJECT: typeof='${typeof bounds}' ---`);
      } else {
        this.debugAlways( "--- Retrieve Stored Window Bounds ---"
                          + `\n- bounds.top:    ${bounds.top}`
                          + `\n- bounds.left:   ${bounds.left}`
                          + `\n- bounds.width:  ${bounds.width}`
                          + `\n- bounds.height: ${bounds.height}`
                        );
      }
    }

    // Tell Thunderbird to close the window
    e.returnValue = '';  // any "non-truthy" value will do
    return false;
  }



  async #buildUI() {
    await this.#updateUIForFileSystemBrokerAccess();
    await this.#buildFileNameListUI();
  }



  async #updateUIForFileSystemBrokerAccess() {
    const backupBtn = document.getElementById("idmBackupManagerBackupButton");
    const deleteBtn = document.getElementById("idmBackupManagerDeleteButton");

    // stores to this.#fileSystemBrokerAccessGranted and this.#fileSystemBrokerAccessReadOnly;
    const response = this.#checkAccessToFileSystemBroker();

    if (! backupBtn) {
      this.error("Failed to find Button 'idmBackupManagerBackupButton'");
    } else {
      backupBtn.disabled = ! this.#fileSystemBrokerAccessGranted || this.#fileSystemBrokerAccessReadOnly;
    }

    if (! deleteBtn) {
      this.error("Failed to find Button 'idmBackupManagerDeleteButton'");
    } else {
      deleteBtn.disabled = ! this.#fileSystemBrokerAccessGranted || this.#fileSystemBrokerAccessReadOnly;
    }
  }



  async #buildFileNameListUI() {
    this.#resetErrors();

    const domFileNameList = document.getElementById("idmBackupManagerFileNameList");
    if (! domFileNameList) {
      this.debug("-- failed to get domFileNameList");
      // MABXXX DISPLAY MESSAGE TO USER
      return;
    }

    domFileNameList.innerHTML = '';
    this.#updateUIOnSelectionChanged();

    const i18nMessage = getI18nMsg("idmBackupManager_message_fileNamesLoading", "...");
    const loadingTR = document.createElement("tr");
    loadingTR.classList.add("identities-loading");
    loadingTR.appendChild( document.createTextNode(i18nMessage) ); // you can put a text node in a TR ???
    domFileNameList.appendChild(loadingTR);

    const backupFileInfo = await this.#getBackupFileInfo();

    domFileNameList.innerHTML = '';

    if (! backupFileInfo) {
      // MABXXX
    } else if (backupFileInfo.length < 1) {
      // MABXXX
    } else {
      const listHeaderUI = this.#buildFileListHeaderUI();
      domFileNameList.append(listHeaderUI);

      for (const fileInfo of backupFileInfo) {
        const listItemUI = await this.#buildFileListItemUI(fileInfo);
        domFileNameList.append(listItemUI);
      }
    }
  }



  #buildFileListHeaderUI() {
    const fileListHeaderTR = document.createElement("tr");
      fileListHeaderTR.classList.add("file-list-header");         // file-list-header

      // Create FileName element and add it to the row
      const fileNameTH = document.createElement("th");
        fileNameTH.classList.add("list-header-text");             // file-list-header > list-header-text
        fileNameTH.appendChild( document.createTextNode( this.#fileListHdr_text_fileName ) );
      fileListHeaderTR.appendChild(fileNameTH);

      // Create Creation Date/Time element and add it to the row
      const creationTimeTH = document.createElement("th");
        creationTimeTH.classList.add("list-header-text");         // file-list-header > list-header-text
        creationTimeTH.appendChild( document.createTextNode( this.#fileListHdr_text_creationTime ) );
      fileListHeaderTR.appendChild(creationTimeTH);

      // Create file size (formatted) element and add it to the row
      const fileSizeFmtTH = document.createElement("th");
        fileSizeFmtTH.classList.add("list-header-text");          // file-list-header >  list-header-text
        fileSizeFmtTH.appendChild( document.createTextNode( this.#fileListHdr_text_fileSizeFormatted ) );
      fileListHeaderTR.appendChild(fileSizeFmtTH);

      // Create file size (bytes) element and add it to the row
      const fileSizeBytesTH = document.createElement("th");
        fileSizeBytesTH.classList.add("list-header-text");        // file-list-header > list-header-text
        fileSizeBytesTH.appendChild( document.createTextNode( this.#fileListHdr_text_fileSizeBytes ) );
      fileListHeaderTR.appendChild(fileSizeBytesTH);

    return fileListHeaderTR;
  }



  // async because of messenger.messengerUtilities.formatFileSize()
  async #buildFileListItemUI(fileInfo) {
/*  FileInfo has these values:
    - fileName: the fileName
    - path: the full pathName
    - type: "regular", "directory", or "other"
    - size: for a Regular File, the size in bytes, otherwise -1
    - creationTime (Windows and MacOS only): milliseconds since 1970-01-01T00:00:00.000Z
    - lastAccessed: milliseconds since 1970-01-01T00:00:00.000Z
    - lastModified: milliseconds since 1970-01-01T00:00:00.000Z
    - permissions: expressed as a UNIX file mode (for Windows, the 'user', 'group', and 'other' parts will always be identical)
*/ 

    this.debug(`-- BUILD LIST ITEM UI: -- fileInfo.path="${fileInfo.path}" fileName="${fileInfo.fileName}"`);

    const fileListItemTR = document.createElement("tr");
      fileListItemTR.classList.add("file-list-item");             // file-list-item
      fileListItemTR.setAttribute("fileName", fileInfo.fileName);
      fileListItemTR.addEventListener("click", (e) => this.#backupFileClicked(e));

      // Create FileName element and add it to the row
      const fileNameTD = document.createElement("td");
        fileNameTD.classList.add("file-list-item-data");          // file-list-item > file-list-item-data
        fileNameTD.classList.add("file-list-item-filename");      // file-list-item > file-list-item-filename
        fileNameTD.appendChild(document.createTextNode(fileInfo.fileName));
      fileListItemTR.appendChild(fileNameTD);

      // Create Creation Date/Time element and add it to the row
      const creationTimeTD = document.createElement("td");
        creationTimeTD.classList.add("file-list-item-data");          // file-list-item > file-list-item-data
        creationTimeTD.classList.add("file-list-item-time-creation"); // file-list-item > file-list-item-time-creation
        creationTimeTD.appendChild( document.createTextNode( formatMsToDateTime24HR(fileInfo.creationTime) ) );
      fileListItemTR.appendChild(creationTimeTD);

      // Create file size (formatted) element and add it to the row
      const fileSizeFmtTD = document.createElement("td");
        fileSizeFmtTD.classList.add("file-list-item-data");          // file-list-item > file-list-item-data
        fileSizeFmtTD.classList.add("file-list-item-filesize");      // file-list-item > file-list-item-filesize
        fileSizeFmtTD.appendChild( document.createTextNode( await messenger.messengerUtilities.formatFileSize( fileInfo.size) ) );
      fileListItemTR.appendChild(fileSizeFmtTD);

      // Create file size (bytes) element and add it to the row
      const fileSizeBytesTD = document.createElement("td");
        fileSizeBytesTD.classList.add("file-list-item-data");          // file-list-item > file-list-item-data
        fileSizeBytesTD.classList.add("file-list-item-filesize");      // file-list-item > file-list-item-filesize
        fileSizeBytesTD.appendChild( document.createTextNode(fileInfo.size) );
      fileListItemTR.appendChild(fileSizeBytesTD);

    return fileListItemTR;
  }  



  async #checkAccessToFileSystemBroker() {
    var   isAccessGranted  = false;
    var   isAccessReadOnly = false;
    const response         = await this.#fsBrokerApi.access();

    if (! response) {
      this.error("-- NO RESPONSE FROM FileSystemBroker.access");
    } else if ((typeof response) !== 'object') {
      this.error(`-- RESPONSE FROM FileSystemBroker.access is not an Object: "${typeof response}"`);
    } else if (response.error) {
      this.error(`-- ERROR RESPONSE FROM FileSystemBroker.access: "${response.error}"`);
    } else {

      this.debug(`-- response.access=${response.access} response.readOnly=${response.readOnly}`);

//    if (! response.hasOwnProperty('access')) {
      if (! Object.hasOwn(response, 'access')) {
        this.error("-- INVALID RESPONSE FROM FileSystemBroker.access -- no 'access' key");
      } else if ((typeof response.access) !== 'string') {
        this.error("-- INVALID RESPONSE FROM FileSystemBroker.access -- 'access' is not 'string'");
      } else if (response.access === 'granted') {
        this.debug("-- RESPONSE FROM FileSystemBroker.access -- 'access' is 'granted'");
        isAccessGranted = true;
      } else if (response.access === 'denied') {
        this.debug("-- RESPONSE FROM FileSystemBroker.access -- 'access' is 'denied'");
      } else {
        this.error("-- INVALID RESPONSE FROM FileSystemBroker.access -- 'access' is not 'granted' or 'denied'");
      }

//    if (! response.hasOwnProperty('readOnly')) {
      if (! Object.hasOwn(response, 'readOnly')) {
        this.error("-- INVALID RESPONSE FROM FileSystemBroker.access -- no 'readOnly' key");
      } else if ((typeof response.readOnly) !== 'boolean') {
        this.error("-- INVALID RESPONSE FROM FileSystemBroker.access -- 'readOnly' is not 'boolean'");
      } else {
        isAccessReadOnly = isAccessGranted && response.readOnly;
      }
    }

    this.#fileSystemBrokerAccessGranted  = isAccessGranted
    this.#fileSystemBrokerAccessReadOnly = isAccessReadOnly;

    this.debug(`-- ACCESS TO FileSystemBroker: ${isAccessGranted ? "GRANTED": "DENIED"}${isAccessReadOnly ? " READ-ONLY" : ""}`);
    return { 'granted': isAccessGranted, 'readOnly': isAccessReadOnly };
  }



  async #getBackupFileInfo() {
    let listBackupFileInfoResponse;
    try {
      listBackupFileInfoResponse = await this.#idmOptionsApi.listBackupFileInfo();
    } catch (error) {
      this.caught(error, " -- listBackupFiles");
    }

    if (! listBackupFileInfoResponse) {
      this.error("-- listBackupFileInfo -- NO RESPONSE");
    } else if (listBackupFileInfoResponse.invalid) {
      this.error(`-- listBackupFileInfo -- LIST FILEINFO ERROR: ${listBackupFileInfoResponse.invalid}`);
    } else if (listBackupFileInfoResponse.error) {
      this.error(`-- listBackupFileInfo -- LIST FILEINFO ERROR: ${listBackupFileInfoResponse.error}`);
    } else if (! listBackupFileInfoResponse.fileInfo) {
      this.error("-- listBackupFileInfo -- NO FILEINFO RETURNED");
    } else {
      return listBackupFileInfoResponse.fileInfo
    }
  }



  #updateUIOnSelectionChanged() {
////const backupBtn  = document.getElementById("idmBackupManagerBackupButton");
    const restoreBtn = document.getElementById("idmBackupManagerRestoreButton");
    const deleteBtn  = document.getElementById("idmBackupManagerDeleteButton");
////const doneBtn    = document.getElementById("idmBackupManagerDoneButton");
    const selectedCount = this.#getSelectedDomFileNameListItemCount();

    if (selectedCount == 0) {
      restoreBtn.disabled = true;
      deleteBtn.disabled  = true;
    } else if (selectedCount == 1) {
      restoreBtn.disabled = false;
      deleteBtn.disabled  = ! this.#fileSystemBrokerAccessGranted || this.#fileSystemBrokerAccessReadOnly;
    } else {
      restoreBtn.disabled = true;
      deleteBtn.disabled  = ! this.#fileSystemBrokerAccessGranted || this.#fileSystemBrokerAccessReadOnly;
    }
  }



  // and file-list-item (TR or TD) was clicked
  async #backupFileClicked(e) {
    if (! e) return;

////e.stopPropagation();
////e.stopImmediatePropagation();

    this.debug(`-- e.target.tagName="${e.target.tagName}"`);

    if (e.target.tagName == "TR" || e.target.tagName == "TD") {
      this.debug("-- TR or TD Clicked");

      let trElement = e.target;
      if (e.target.tagName == "TD") {
        trElement = e.target.closest('tr');
      }

      if (! trElement) {
        this.debug("-- Did NOT get our TR");

      } else {
        this.debug(  "-- Got our TR --"
                    + ` file-list-item? ${trElement.classList.contains("file-list-item")}`
                  );
        if (trElement.classList.contains("file-list-item")) {
          const fileName = trElement.getAttribute("fileName");
          const wasSelected = trElement.classList.contains('selected');
      
          this.debug(`-- wasSelected=${wasSelected}  fileName="${fileName}"`);

          if (! wasSelected) {
            trElement.classList.add('selected');
          } else {
            trElement.classList.remove('selected');
          }

          this.#updateUIOnSelectionChanged();
        }
      }
    }
  }



  #deselectAllFileNames() {
    const domFileNameList = document.getElementById("idmBackupManagerFileNameList");
    if (! domFileNameList) {
      this.debug("-- failed to get domFileNameList");
    } else {
      for (const listItem of domFileNameList.children) {
        listItem.classList.remove('selected');
      }

      this.#updateUIOnSelectionChanged();
    }
  }



  // get only the FIRST!!!
  #getSelectedDomFileNameListItem() {
    const domFileNameList = document.getElementById("idmBackupManagerFileNameList");
    if (! domFileNameList) {
      this.debug("-- failed to get domFileNameList");
    } else {
      for (const domFileNameListItemTR of domFileNameList.children) {
        if (domFileNameListItemTR.classList.contains('selected')) {
          return domFileNameListItemTR;
        }
      }
    }
  }

  #getSelectedDomFileNameListItems() {
    const domFileNameList = document.getElementById("idmBackupManagerFileNameList");
    if (! domFileNameList) {
      this.debug("-- failed to get domFileNameList");
    } else {
      const selected = [];
      for (const domFileNameListItemTR of domFileNameList.children) {
        if (domFileNameListItemTR.classList.contains('selected')) {
          selected.push(domFileNameListItemTR);
        }
      }
      return selected;
    }
  }

  #getSelectedDomFileNameListItemCount() {
    let   count           = 0;
    const domFileNameList = document.getElementById("idmBackupManagerFileNameList");

    if (! domFileNameList) {
      this.debug("-- failed to get domFileNameList");
    } else {
      for (const domFileNameListItemTR of domFileNameList.children) {
        if (domFileNameListItemTR.classList.contains('selected')) {
          ++count;
        }
      }
    }

    return count;
  }



  async #backupButtonClicked(e) {
    this.debug(`-- e.target.tagName="${e.target.tagName}"`);

    e.preventDefault();

    this.#resetErrors();

    if (! this.#fileSystemBrokerAccessGranted || this.#fileSystemBrokerAccessReadOnly) {
      this.error("BACKUP Button Clicked when WRITE ACCESS to FileSystemBroker is NOT GRANTED");
      return;
    }

    const backupBtn = document.getElementById("idmBackupManagerBackupButton");
    backupBtn.disabled = true;

    let   errors   = 0;
    const response = await this.#idmOptionsApi.backupToFile();
    if (! response) {
      this.error("-- FAILED TO BACKUP OPTIONS -- NO RESPONSE RETURNED");
      ++errors;
    } else if (response.invalid) {
      this.error("-- FAILED TO BACKUP OPTIONS -- INVALID RETURNED IN RESPONSE");
      ++errors;
    } else if (response.error) {
      var msg = "-- FAILED TO BACKUP OPTIONS -- ERROR RETURNED IN RESPONSE";

      if (response.code === "403") {
        msg += " - ACCESS DENIED";
        if (response.subCode) {
          if (response.subCode === "read-only") {
            msg += " - READ-ONLY ACCESS";
          } else if (response.subCode === "over-quota") {
            msg += " - OVER QUOTA";
          }
        }
      }

      this.error(msg);
      ++errors;
    } else if (! response.fileName) {
      this.error("-- BACKUP OPTIONS -- NO FILENAME RETURNED IN RESPONSE");
      ++errors;
    } else if ((typeof response.bytesWritten) !== 'number') {
      this.error(`-- BACKUP OPTIONS -- INVALID BYTES_WRITTEN RETURNED IN RESPONSE -- backupFileName="${response.fileName}"`);
      ++errors;
    } else if (response.bytesWritten < 1) {
      this.error(`-- BACKUP OPTIONS -- NO BYTES WRITTEN -- backupFileName="${response.fileName}"`);
      ++errors;
    } else {
      this.debug(`-- backupFileName="${response.fileName}" bytesWritten=${response.bytesWritten}`);
      await this.#buildFileNameListUI();
    }

    if (errors) {
      this.#setErrorFor("idmBackupManagerInstructions", "idmBackupManager_message_error_backupFailed"); /*I18N*/
    } else {
    }

    backupBtn.disabled = deleteBtn.disabled = ! this.#fileSystemBrokerAccessGranted || this.#fileSystemBrokerAccessReadOnly;
  }



  async #restoreButtonClicked(e) {
    this.debug(`-- e.target.tagName="${e.target.tagName}"`);

    e.preventDefault();

    this.#resetErrors();

    const restoreBtn = document.getElementById("idmBackupManagerRestoreButton");
    restoreBtn.disabled = true;

    const domSelectedFileNameItemTR = this.#getSelectedDomFileNameListItem();
    let errors = 0;

    if (! domSelectedFileNameItemTR) {
      this.error("-- NO FILENAME SELECTED -- Restore Button should have been disabled!!!");

    } else {
      this.debug(`-- domSelectedFileNameItemTR=${domSelectedFileNameItemTR} domSelectedFileNameItemTR.tagName="${domSelectedFileNameItemTR.tagName}"`);

      const backupFileName = domSelectedFileNameItemTR.getAttribute("fileName");
      this.debug(`-- Restoring Options from backupFileName="${backupFileName}"`);

      const response = await this.#idmOptionsApi.readOptionsFromBackupAndRestore(backupFileName);
      if (! response) {
        this.error(`-- FAILED TO RESTORE OPTIONS -- NO RESPONSE RETURNED -- backupFileName="${backupFileName}"`);
        ++errors;
      } else if (response.invalid) {
        this.error(`-- FAILED TO RESTORE OPTIONS -- INVALID RETURNED -- backupFileName="${backupFileName}"`);
        ++errors;
      } else if (response.error) {
        this.error(`-- FAILED TO RESTORE OPTIONS -- ERROR RETURNED -- backupFileName="${backupFileName}"`);
        ++errors;
      } else if (! response.fileName) {
        this.error(`-- FAILED TO RESTORE OPTIONS -- NO FILENAME RETURNED -- backupFileName="${backupFileName}"`);
        ++errors;
      } else if (! response.object) {
        this.error(`-- FAILED TO RESTORE OPTIONS -- NO DATA OBJECT RETURNED -- backupFileName="${backupFileName}"`);
        ++errors;
      } else {
        if (this.#DEBUG) {
          const entries = Object.entries(response.object);
          this.debugAlways(`-- Options Restored -- response.fileName="${response.fileName}" response.object.entries.length="${entries.length}"`);
          for (const [key, value] of entries) {
            this.debugAlways(`-- OPTION ${key}: "${value}"`);
          }
        }
      }

      if (errors) {
        this.#setErrorFor("idmBackupManagerInstructions", "idmBackupManager_message_error_restoreFailed");
      } else {
        const responseMessage = { 'RESTORED': backupFileName };

        this.debug(`-- Sending responseMessage="${responseMessage}"`);

        try {
          await messenger.runtime.sendMessage(
            { BackupManagerResponse: responseMessage }
          );
        } catch (error) {
          this.caught( error, 
                       "restoreButtonClicked ##### SEND RESPONSE MESSAGE FAILED #####"
                       + `\n- responseMessage="${responseMessage}"`
                     );
          ++errors;
          this.#setErrorFor("idmBackupManagerInstructions", "idmBackupManager_message_error_responseMessageFailed");
        }
      }

      if (errors) {
        // allow the user to see the message
        restoreBtn.disabled = false;

      } else {
        this.debug("-- No Errors - closing window");
        window.close();
      }
    }
  }



  async #deleteButtonClicked(e) {
    this.debug(`-- e.target.tagName="${e.target.tagName}"`);

    e.preventDefault();

    this.#resetErrors();

    if (! this.#fileSystemBrokerAccessGranted || this.#fileSystemBrokerAccessReadOnly) {
      this.error("DELETE Button Clicked when WRITE ACCESS to FileSystemBroker is NOT GRANTED");
      return;
    }

    const deleteBtn = document.getElementById("idmBackupManagerDeleteButton");
    deleteBtn.disabled = true;

    const domSelectedFileNameItemTRs = this.#getSelectedDomFileNameListItems();
    let errors = 0;

    if (! domSelectedFileNameItemTRs) {
      this.error("-- NO FILENAMES SELECTED -- Delete Button should have been disabled!!!");

    } else {
      this.debug(`-- domSelectedFileNameItemTRs.length=${domSelectedFileNameItemTRs.length}`);

      for (const domSelectedFileNameItemTR of domSelectedFileNameItemTRs) {
        const backupFileName = domSelectedFileNameItemTR.getAttribute("fileName");
        this.debug(`-- Deleting Options backupFileName="${backupFileName}"`);

        const response = await this.#idmOptionsApi.deleteBackupFile(backupFileName);
        if (! response) {
          this.error(`-- FAILED TO DELETE OPTIONS BACKUP FILE -- NO RESPONSE RETURNED -- backupFileName="${backupFileName}"`);
          ++errors;
        } else if (response.invalid) {
          this.error(`-- FAILED TO DELETE OPTIONS BACKUP FILE -- INVALID RETURNED -- backupFileName="${backupFileName}"`);
          ++errors;
        } else if (response.error) {
          this.error(`-- FAILED TO DELETE OPTIONS BACKUP FILE -- ERROR RETURNED -- backupFileName="${backupFileName}"`);
          ++errors;
        } else if (! response.fileName) {
          this.error(`-- FAILED TO DELETE OPTIONS BACKUP FILE -- NO FILENAME RETURNED -- backupFileName="${backupFileName}"`);
          ++errors;
        } else if (! response.deleted) {
          this.error(`-- FAILED TO DELETE OPTIONS BACKUP FILE -- backupFileName="${backupFileName}" response.deleted="${response.deleted}"`);
          ++errors;
        } else {
          this.debug(`-- Options Backup File Deleted -- backupFileName="${backupFileName}" response.deleted="${response.deleted}"`);
          domSelectedFileNameItemTR.remove();
        }
      }

      if (errors) {
        this.#setErrorFor("idmBackupManagerInstructions", "idmBackupManager_message_error_deleteFailed"); /* I18N */
      } else {
        // MABXXX NO RESPONSE MESSAGE REQUIRED FOR BACKUP FILE DELETE
//      const responseMessage = { 'RESTORED': backupFileName };
//
//      this.debug(`-- Sending responseMessage="${responseMessage}"`);
//
//      try {
//        await messenger.runtime.sendMessage(
//          { BackupManagerResponse: responseMessage }
//        );
//      } catch (error) {
//        this.caught( error, 
//                     "deleteButtonClicked ##### SEND RESPONSE MESSAGE FAILED #####"
//                     + `\n- responseMessage="${responseMessage}"`
//                   );
//        ++errors;
//        this.#setErrorFor("idmBackupManagerInstructions", "idmBackupManager_message_error_responseMessageFailed"); /* I18N */
//      }
      }
    }

    if (errors) {
      // MABXXX ERROR MESSAGE
    } else {
    }

    this.#updateUIOnSelectionChanged();

    deleteBtn.disabled = ! this.#fileSystemBrokerAccessGranted || this.#fileSystemBrokerAccessReadOnly;
  }



  #resetErrors() {
    let errorDivs = document.querySelectorAll("div.backup-error");
    if (errorDivs) {
      for (let errorDiv of errorDivs) {
        errorDiv.setAttribute("error", "false");
      }
    }

    let errorLabels = document.querySelectorAll("label.backup-error-text");
    if (errorLabels) {
      for (let errorLabel of errorLabels) {
        errorLabel.setAttribute("error", "false");
        errorLabel.innerText = ""; // MABXXX THIS IS A HUGE LESSON:  DO NOT USE: <label/>   USE: <label></label> 
      }
    }
  }

  #setErrorFor(elementId, msgId) {
    if (elementId && msgId) {
      const errorDiv = document.querySelector("div.backup-error[error-for='" + elementId + "']");
      if (errorDiv) {
        errorDiv.setAttribute("error", "true");
      }

      const errorLabel = document.querySelector("label.backup-error-text[error-for='" + elementId + "']");
      if (errorLabel) {
        const i18nMessage = getI18nMsg(msgId);
        errorLabel.innerText = i18nMessage;
      }
    }
  }



  async #doneButtonClicked(e) {
    this.debug(`-- e.target.tagName="${e.target.tagName}"`);

    e.preventDefault();

    this.#resetErrors();

    this.#canceled = true;

    // maybe not the best idea to do this... message receiver gets:
    //     Promise rejected after context unloaded: Actor 'Conduits' destroyed before query 'RuntimeMessage' was resolved
    let responseMessage = "DONE";
    this.debug(`-- Sending responseMessage="${responseMessage}"`);

    try {
      await messenger.runtime.sendMessage(
        { BackupManagerResponse: responseMessage }
      );
    } catch (error) {
      // any need to tell the user???
      this.caught( error,
                   "doneButtonClicked ##### SEND RESPONSE MESSAGE FAILED #####"
                   + `\n- responseMessage="${responseMessage}"`
                 );
    }

    this.debug("-- Closing window");
    window.close();
  }
}



const backupManager = new BackupManager();

document.addEventListener("DOMContentLoaded", (e) => backupManager.run(e), {once: true});
