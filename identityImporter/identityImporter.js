import { FileSystemBrokerAPI } from '../modules/FileSystemBroker/filesystem_broker_api.js';
import { IdmOptions          } from '../modules/options.js';
import { Logger              } from '../modules/logger.js';
import { IdmIdentities       } from '../modules/identities.js';
import { getI18nMsg, isValidEmail } from '../modules/utilities.js';





class IdentityImporter {
  #CLASS_NAME       = this.constructor.name;

  #LOG              = false;
  #DEBUG            = false;
  #DEBUG_VERBOSE    = false && this.#DEBUG;
  #WARN             = false;

  #logger           = new Logger();
  #idmOptionsApi    = new IdmOptions(this.#logger);
  #idmIdentitiesApi = new IdmIdentities(this.#idmOptionsApi, this.#logger);
  #fsBrokerApi      = new FileSystemBrokerAPI();

  #mode             = "init"; // init | select-file | select-criteria | select-identities
  #canceled         = false;

  #MAX_CRITERIA_SHEET_DATA_ROW_NUM = 10;

  // MABXXX If the user enters '##' for the new Identity Label, substitute the User Name from the Identity Email Address
  // MABXXX easier for now, but later maybe allow user to specify RegExp and Subst
/////his.regexForUseIdentityEmailUsernameDomainForNewLabelCmd = new RegExp('^([^.@]+\.(com|net|org|gov|edu|co|app|io|tv|travel))[.@].*$', 'i');
  #regexForUseIdentityEmailUsernameDomainForNewLabelCmd = new RegExp('^(.+\\.(com|net|org|gov|edu|co|app|io|tv|travel))[.@].*$', 'i');
  #substForUseIdentityEmailUsernameDomainForNewLabelCmd = '$1 email';

  #accounts;
  #importFileName;
  #hasHeaderRow;
  #emailColNum;
  #nameColNum;

  #lastSelectedIdentityTR;
  #lastSelectedIdentity;


  #message_fileName_loading                 = getI18nMsg("idmIdentityImportFileSelector_loading");
  #message_fileName_listHeader_FileName     = getI18nMsg("idmIdentityImportFileSelector_listHeader_FileName");

  #message_criteria_loading                 = getI18nMsg("idmIdentityImportCriteriaSelector_loading");
  #message_criteria_listHeader_Column       = getI18nMsg("idmIdentityImportCriteriaSelector_listHeader_Column");
  #message_criteria_colSelectDefault_Email  = getI18nMsg("idmIdentityImportCriteria_emailColumnSelect.default");
  #message_criteria_colSelectDefault_Name   = getI18nMsg("idmIdentityImportCriteria_nameColumnSelect.default");

  #message_identities_loading               = getI18nMsg("idmIdentityImportIdentitiesSelector_loading");
  #message_listHeader_Status                = getI18nMsg("idmIdentityImportIdentitiesSelector_listHeader_Status");
  #message_listHeader_Account               = getI18nMsg("idmIdentityImportIdentitiesSelector_listHeader_Account");
  #message_listHeader_Email                 = getI18nMsg("idmIdentityImportIdentitiesSelector_listHeader_Email");
  #message_listHeader_Name                  = getI18nMsg("idmIdentityImportIdentitiesSelector_listHeader_Name");
  #message_listHeader_Label                 = getI18nMsg("idmIdentityImportIdentitiesSelector_listHeader_Label");
  #message_listHeader_ReplyTo               = getI18nMsg("idmIdentityImportIdentitiesSelector_listHeader_ReplyTo");
  #message_listHeader_Org                   = getI18nMsg("idmIdentityImportIdentitiesSelector_listHeader_Organization");
  #message_listHeader_ComposeHtml           = getI18nMsg("idmIdentityImportIdentitiesSelector_listHeader_ComposeHtml");
  #message_listHeader_Signature             = getI18nMsg("idmIdentityImportIdentitiesSelector_listHeader_Signature");
  #message_listHeader_SigIsHtml             = getI18nMsg("idmIdentityImportIdentitiesSelector_listHeader_SigIsHtml");

  #message_listHeader_Status_tooltip        = getI18nMsg("idmIdentityImportIdentitiesSelector_listHeader_Status-tooltip");
  #message_listHeader_Account_tooltip       = getI18nMsg("idmIdentityImportIdentitiesSelector_listHeader_Account-tooltip");
  #message_listHeader_Email_tooltip         = getI18nMsg("idmIdentityImportIdentitiesSelector_listHeader_Email-tooltip");
  #message_listHeader_Name_tooltip          = getI18nMsg("idmIdentityImportIdentitiesSelector_listHeader_Name-tooltip");
  #message_listHeader_Label_tooltip         = getI18nMsg("idmIdentityImportIdentitiesSelector_listHeader_Label-tooltip");
  #message_listHeader_ReplyTo_tooltip       = getI18nMsg("idmIdentityImportIdentitiesSelector_listHeader_ReplyTo-tooltip");
  #message_listHeader_Org_tooltip           = getI18nMsg("idmIdentityImportIdentitiesSelector_listHeader_Organization-tooltip");
  #message_listHeader_ComposeHtml_tooltip   = getI18nMsg("idmIdentityImportIdentitiesSelector_listHeader_ComposeHtml-tooltip");
  #message_listHeader_Signature_tooltip     = getI18nMsg("idmIdentityImportIdentitiesSelector_listHeader_Signature-tooltip");
  #message_listHeader_SigIsHtml_tooltip     = getI18nMsg("idmIdentityImportIdentitiesSelector_listHeader_SigIsHtml-tooltip");

  #message_listItem_Status_tooltip          = getI18nMsg("idmIdentityImportIdentitiesSelector_listItem_Status-tooltip");
  #message_listItem_Account_tooltip         = getI18nMsg("idmIdentityImportIdentitiesSelector_listItem_Account-tooltip");
  #message_listItem_Email_tooltip           = getI18nMsg("idmIdentityImportIdentitiesSelector_listItem_Email-tooltip");
  #message_listItem_Name_tooltip            = getI18nMsg("idmIdentityImportIdentitiesSelector_listItem_Name-tooltip");
  #message_listItem_Label_tooltip           = getI18nMsg("idmIdentityImportIdentitiesSelector_listItem_Label-tooltip");
  #message_listItem_ReplyTo_tooltip         = getI18nMsg("idmIdentityImportIdentitiesSelector_listItem_ReplyTo-tooltip");
  #message_listItem_Org_tooltip             = getI18nMsg("idmIdentityImportIdentitiesSelector_listItem_Organization-tooltip");
  #message_listItem_ComposeHtml_tooltip     = getI18nMsg("idmIdentityImportIdentitiesSelector_listItem_ComposeHtml-tooltip");
  #message_listItem_Signature_tooltip       = getI18nMsg("idmIdentityImportIdentitiesSelector_listItem_Signature-tooltip");
  #message_listItem_SigIsHtml_tooltip       = getI18nMsg("idmIdentityImportIdentitiesSelector_listItem_SigIsHtml-tooltip");

  #message_editListItem_Status_tooltip      = getI18nMsg("idmIdentityImportIdentitiesSelector_editListItem_Status-tooltip");
  #message_editListItem_Account_tooltip     = getI18nMsg("idmIdentityImportIdentitiesSelector_editListItem_Account-tooltip");
  #message_editListItem_Email_tooltip       = getI18nMsg("idmIdentityImportIdentitiesSelector_editListItem_Email-tooltip");
  #message_editListItem_Name_tooltip        = getI18nMsg("idmIdentityImportIdentitiesSelector_editListItem_Name-tooltip");
  #message_editListItem_Label_tooltip       = getI18nMsg("idmIdentityImportIdentitiesSelector_editListItem_Label-tooltip");
  #message_editListItem_ReplyTo_tooltip     = getI18nMsg("idmIdentityImportIdentitiesSelector_editListItem_ReplyTo-tooltip");
  #message_editListItem_Org_tooltip         = getI18nMsg("idmIdentityImportIdentitiesSelector_editListItem_Organization-tooltip");
  #message_editListItem_ComposeHtml_tooltip = getI18nMsg("idmIdentityImportIdentitiesSelector_editListItem_ComposeHtml-tooltip");
  #message_editListItem_Signature_tooltip   = getI18nMsg("idmIdentityImportIdentitiesSelector_editListItem_Signature-tooltip");
  #message_editListItem_SigIsHtml_tooltip   = getI18nMsg("idmIdentityImportIdentitiesSelector_editListItem_SigIsHtml-tooltip");



  constructor() {
//  this.boundFunction1  = this.identityButtonClicked.bind(this); // this makes sure "identityButtonClicked" can use "this"
  }



  log(...info) {
    if (this.#LOG) this.#logger.log(this.#CLASS_NAME, ...info);
  }

  logAlways(...info) {
    this.#logger.logAlways(this.#CLASS_NAME, ...info);
  }

  debug(...info) {
    if (this.#DEBUG) this.#logger.debug(this.#CLASS_NAME, ...info);
  }

  debugVerbose(...info) {
    if (this.#DEBUG_VERBOSE) this.#logger.debug(this.#CLASS_NAME, ...info);
  }

  debugAlways(...info) {
    this.#logger.debugAlways(this.#CLASS_NAME, ...info);
  }

  warn(...info) {
    if (this.#WARN) this.#logger.debug(this.#CLASS_NAME, ...info);
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
    window.addEventListener("beforeunload", (e) => this.windowUnloading(e));

    try {
      await this.localizePage();
    } catch (error) {
      // allow page to be built, just witout some messages???
      this.debug("-- Localization Failed");
      this.addError("idmIdentityImporter_error_l10nFailed");
    }

    const domSelectImportFilePanel       = document.getElementById("idmIdentityImportFileSelector");
    const domSelectImportCriteriaPanel   = document.getElementById("idmIdentityImportCriteriaSelector");
    const domSelectImportIdentitiesPanel = document.getElementById("idmIdentityImportIdentitiesSelector");
    domSelectImportCriteriaPanel.style.setProperty(   "display", "none" );
    domSelectImportFilePanel.style.setProperty(       "display", "none" );
    domSelectImportIdentitiesPanel.style.setProperty( "display", "none" );

    this.setupEventListeners();

    this.#accounts = await messenger.accounts.list(false); // includeSubFolders=false: do not get sub-folders
    this.debug(`-- got ${this.#accounts.length} Accounts`);

    await this.updateCriteriaImportFilesDirectoryUI();
    await this.updateOptionsUI();

    await this.showSelectImportFilePanel();

    this.debug("-- end");
  }



  setupEventListeners() {
    const activeNavSelectFileElements = document.querySelectorAll("span[nav='select-file'].nav-active");
    for (const el of activeNavSelectFileElements) {
      this.debug(`-- navSelectFileElement=${el}`);
      el.addEventListener("click", (e) => this.navSelectFileClicked(e));
    }

    const activeNavSelectCriteriaElements = document.querySelectorAll("span[nav='select-criteria'].nav-active");
    for (const el of activeNavSelectCriteriaElements) {
      this.debug(`-- navSelectCriteriaElement=${el}`);
      el.addEventListener("click", (e) => this.navSelectCriteriaClicked(e));
    }

    const fileSelectorFilterGlobText = document.getElementById("idmIdentityImportFileSelectorFilterGlobText");
    fileSelectorFilterGlobText.addEventListener("keydown", (e) => this.selectFileFilterGlobTextKeyPressed(e));
    fileSelectorFilterGlobText.addEventListener("input", (e) => this.selectFileFilterGlobTextChanged(e));

    const fileSelectorFilterGlobBtn = document.getElementById("idmIdentityImportFileSelectorFilterGlobButton");
    fileSelectorFilterGlobBtn.setAttribute("data", "glob-filter");
    fileSelectorFilterGlobBtn.addEventListener("click", (e) => this.selectFileFilterGlobButtonClicked(e));

    const fileSelectorFilterResetBtn = document.getElementById("idmIdentityImportFileSelectorFilterResetButton");
    fileSelectorFilterResetBtn.setAttribute("data", "reset");
    fileSelectorFilterResetBtn.addEventListener("click", (e) => this.selectFileFilterResetButtonClicked(e));

    const fileSelectorCancelBtn = document.getElementById("idmIdentityImportFileControlsCancelButton");
    fileSelectorCancelBtn.setAttribute("data", "cancel");
    fileSelectorCancelBtn.addEventListener("click", (e) => this.cancelButtonClicked(e));

    const fileSelectorContinueBtn = document.getElementById("idmIdentityImportFileControlsContinueButton");
    fileSelectorContinueBtn.setAttribute("data", "continue");
    fileSelectorContinueBtn.addEventListener("click", (e) => this.selectFileContinueButtonClicked(e));

    const criteriaSelectorEmailColumnSelect = document.getElementById("idmIdentityImportCriteriaSelectionEmailColumnSelect");
    criteriaSelectorEmailColumnSelect.addEventListener("change", (e) => this.criteriaSelectorColumnSelectChanged(e));

    const criteriaSelectorCancelBtn = document.getElementById("idmIdentityImportCriteriaControlsCancelButton");
    criteriaSelectorCancelBtn.setAttribute("data", "cancel");
    criteriaSelectorCancelBtn.addEventListener("click", (e) => this.cancelButtonClicked(e));

    const criteriaSelectorContinueBtn = document.getElementById("idmIdentityImportCriteriaControlsContinueButton");
    criteriaSelectorContinueBtn.setAttribute("data", "continue");
    criteriaSelectorContinueBtn.addEventListener("click", (e) => this.selectCriteriaContinueButtonClicked(e));

    const identitiesSelectorFilterRegexText = document.getElementById("idmIdentityImportIdentitiesSelectorFilterRegexText");
////identitiesSelectorFilterRegexText.addEventListener("keydown", (e) => this.selectIdentitiesFilterRegexKeyPressed(e)); // we're not operating on enter key -- yet
    identitiesSelectorFilterRegexText.addEventListener("input", (e) => this.selectIdentitiesFilterRegexTextChanged(e));

    const identitiesSelectorFilterRegexResetBtn = document.getElementById("idmIdentityImportIdentitiesSelectorFilterRegexResetButton");
    identitiesSelectorFilterRegexResetBtn.setAttribute("data", "reset-filter");
    identitiesSelectorFilterRegexResetBtn.addEventListener("click", (e) => this.selectIdentitiesFilterRegexResetButtonClicked(e));

    const identitiesSelectorCancelBtn = document.getElementById("idmIdentityImportIdentitiesSelectorControlsCancelButton");
    identitiesSelectorCancelBtn.setAttribute("data", "cancel");
    identitiesSelectorCancelBtn.addEventListener("click", (e) => this.cancelButtonClicked(e));

    const identitiesSelectorImportBtn = document.getElementById("idmIdentityImportIdentitiesSelectorControlsImportButton");
    identitiesSelectorImportBtn.setAttribute("data", "import");
    identitiesSelectorImportBtn.disabled = true; // MABXXX this should be done inside showSelectImportIdentitiesPanel() // requires at least one identity to be selected
    identitiesSelectorImportBtn.addEventListener("click", (e) => this.selectIdentitiesImportButtonClicked(e));

    const identitiesSelectorSelectAllBtn = document.getElementById("idmIdentityImportIdentitiesSelectorSelectAllButton");
    identitiesSelectorSelectAllBtn.setAttribute("data", "select-all");
    identitiesSelectorSelectAllBtn.addEventListener("click", (e) => this.selectAllIdentitiesButtonClicked(e));

    const identitiesSelectorDeselectAllBtn = document.getElementById("idmIdentityImportIdentitiesSelectorDeselectAllButton");
    identitiesSelectorDeselectAllBtn.setAttribute("data", "deselect-all");
    identitiesSelectorDeselectAllBtn.addEventListener("click", (e) => this.deselectAllIdentitiesButtonClicked(e));

    const identitiesSelectorSetDataAllBtn = document.getElementById("idmIdentityImportIdentitiesSelectorSetDataAllButton");
    identitiesSelectorSetDataAllBtn.setAttribute("data", "set-data-all");
    identitiesSelectorSetDataAllBtn.addEventListener("click", (e) => this.setDataAllIdentitiesButtonClicked(e));

    const identitiesSelectorClearDataAllBtn = document.getElementById("idmIdentityImportIdentitiesSelectorClearDataAllButton");
    identitiesSelectorClearDataAllBtn.setAttribute("data", "clear-data-all");
    identitiesSelectorClearDataAllBtn.addEventListener("click", (e) => this.clearDataAllIdentitiesButtonClicked(e));

    const identitiesSelectorSetDataSelectedBtn = document.getElementById("idmIdentityImportIdentitiesSelectorSetDataSelectedButton");
    identitiesSelectorSetDataSelectedBtn.setAttribute("data", "set-data-selected");
    identitiesSelectorSetDataSelectedBtn.disabled = true; // MABXXX this should be done inside showSelectImportIdentitiesPanel() // requires at least one identity to be selected
    identitiesSelectorSetDataSelectedBtn.addEventListener("click", (e) => this.setDataSelectedIdentitiesButtonClicked(e));

    const identitiesSelectorClearDataSelectedBtn = document.getElementById("idmIdentityImportIdentitiesSelectorClearDataSelectedButton");
    identitiesSelectorClearDataSelectedBtn.setAttribute("data", "clear-data-selected");
    identitiesSelectorClearDataSelectedBtn.disabled = true; // MABXXX this should be done inside showSelectImportIdentitiesPanel() // requires at least one identity to be selected
    identitiesSelectorClearDataSelectedBtn.addEventListener("click", (e) => this.clearDataSelectedIdentitiesButtonClicked(e));

    const domSetDataKeepComposeHtmlInputCheck             = document.getElementById("idmIdentityImportIdentitiesSelector_actionsSetData_KeepComposeHtml.check");
    const domSetDataComposeHtmlInputCheck                 = document.getElementById("idmIdentityImportIdentitiesSelector_actionsSetData_ComposeHtml.check");
    const domSetDataComposeHtmlInputCheckLabel            = document.getElementById("idmIdentityImportIdentitiesSelector_actionsSetData_ComposeHtmlCheck.label");
    domSetDataKeepComposeHtmlInputCheck.checked           = false;
    domSetDataComposeHtmlInputCheck.disabled              = false;      // requires that Set Data Keep Compose Html checkbox NOT be checked
    domSetDataComposeHtmlInputCheck.style.visibility      = 'visible';  // set visibility to visible as well
    domSetDataComposeHtmlInputCheckLabel.style.visibility = 'visible';  // set label visibility to visible as well
    domSetDataKeepComposeHtmlInputCheck.addEventListener("click", (e) => this.keepComposeHtmlCheckClicked(e));

    const domSetDataKeepSigIsHtmlInputCheck             = document.getElementById("idmIdentityImportIdentitiesSelector_actionsSetData_KeepSigIsHtml.check");
    const domSetDataSigIsHtmlInputCheck                 = document.getElementById("idmIdentityImportIdentitiesSelector_actionsSetData_SigIsHtml.check");
    const domSetDataSigIsHtmlInputCheckLabel            = document.getElementById("idmIdentityImportIdentitiesSelector_actionsSetData_SigIsHtmlCheck.label");
    domSetDataKeepSigIsHtmlInputCheck.checked           = false;
    domSetDataSigIsHtmlInputCheck.disabled              = false;      // requires that Set Data Keep Signature Is Html checkbox NOT be checked
    domSetDataSigIsHtmlInputCheck.style.visibility      = 'visible';  // set visibility to visible as well
    domSetDataSigIsHtmlInputCheckLabel.style.visibility = 'visible';  // set label visibility to visible as well
    domSetDataKeepSigIsHtmlInputCheck.addEventListener("click", (e) => this.keepSigIsHtmlCheckClicked(e));

    const identitiesSelectorActionsDataResetBtn = document.getElementById("idmIdentityImportIdentitiesSelectorActionsDataButtonReset");
    identitiesSelectorActionsDataResetBtn.setAttribute("data", "set-data-reset");
    identitiesSelectorActionsDataResetBtn.addEventListener("click", (e) => this.identitiesSelectorActionsDataResetButtonClicked(e));

    document.addEventListener( "change", (e) => this.optionChanged(e) );   // One of the option checkboxes or radio buttons was clicked
  }



  async navSelectFileClicked(e) {
    this.reshowSelectImportFilePanel();
  }

  async navSelectCriteriaClicked(e) {
    this.reshowSelectImportCriteriaPanel();
  }



  async updateCriteriaImportFilesDirectoryUI() {
    const importFilesDirectoryPathNameLabel = document.getElementById("idmIdentityImportCriteriaFilesDirectoryPathName");
    const response                          = await this.#fsBrokerApi.getFullPathName();

    if (response && response.fullPathName) {
      importFilesDirectoryPathNameLabel.textContent = response.fullPathName;
    } else {
      importFilesDirectoryPathNameLabel.textContent = "???";
    }
  }



  async updateOptionsUI() {
    this.debug("-- start");

    const options = await this.#idmOptionsApi.getAllOptions();

    this.debug("-- sync options to UI");
    for (const [optionName, optionValue] of Object.entries(options)) {
      this.debug("-- option: ", optionName, "value: ", optionValue);

      if (this.#idmOptionsApi.isDefaultOption(optionName)) { // MABXXX WHY WHY WHY???
        const optionElement = document.getElementById(optionName);

        if (optionElement && optionElement.classList.contains("icGeneralOption")) {
          optionElement.checked = optionValue;
        }
      }
    }

    this.debug("-- end");
  }



  async showSelectImportFilePanel() {
    this.debug("-- begin");

    const domFileNameFilterGlobText     = document.getElementById("idmIdentityImportFileSelectorFilterGlobText");
    const fileSelectorFilterGlobBtn     = document.getElementById("idmIdentityImportFileSelectorFilterGlobButton");
    const fileSelectorFilterResetBtn    = document.getElementById("idmIdentityImportFileSelectorFilterResetButton");
    const fileSelectorContinueBtn       = document.getElementById("idmIdentityImportFileControlsContinueButton");
    fileSelectorFilterGlobBtn.disabled  = true;
    fileSelectorFilterResetBtn.disabled = true;
    fileSelectorContinueBtn.disabled    = true;

    if (! domFileNameFilterGlobText) {
      this.error("-- failed to get domFileNameFilterGlobText: #idmIdentityImportFileSelectorFilterGlobText");
      this.addToErrorList("idmIdentityImporter_error_domIdFailed", "#idmIdentityImportFileSelectorFilterGlobText");

    } else {
      const fileNameFilterGlob = await this.#idmOptionsApi.getOption('idmIdentityImportFileSelectorFilterGlobText', undefined);
      if (fileNameFilterGlob) {
        domFileNameFilterGlobText.value     = fileNameFilterGlob;
        fileSelectorFilterGlobBtn.disabled  = false;
        fileSelectorFilterResetBtn.disabled = false;
      } else {
        domFileNameFilterGlobText.value       = "";
      }
    }

    const domSelectImportFilePanel = document.getElementById("idmIdentityImportFileSelector");
    this.#mode = "select-file"; // init | select-file | select-criteria | select-identities
    domSelectImportFilePanel.style.setProperty("display", "grid");

    const domDataList = document.getElementById("idmIdentityImportFileDataList");
    if (! domDataList) {
      this.error("-- failed to get domDataList: #idmIdentityImportFileDataList");
      this.addToErrorList("idmIdentityImporter_error_domIdFailed", "#idmIdentityImportFileDataList");

    } else {
      domDataList.innerHTML = '';
      const loadingTR = document.createElement("tr");
        const loadingTD = document.createElement("td");
          loadingTD.appendChild( document.createTextNode(this.#message_fileName_loading) );
        loadingTR.appendChild(loadingTD);
      domDataList.appendChild(loadingTR);

      const fileNames = await this.getImportFileNames();

      domDataList.innerHTML = '';

      if (typeof fileNames === 'undefined') {
        this.error("-- failed to get fileNames - undefined");
        this.addToErrorList("idmIdentityImportFileSelector_error_fileNamesFailed");

      } else if (fileNames.length == 0) {
        this.debug("-- failed to get fileNames - length==0");
        this.addToErrorList("idmIdentityImportFileSelector_error_noFileNames");

      } else {

        const fileNameHeaderUI = this.buildFileNameHeaderUI();
        domDataList.appendChild(fileNameHeaderUI);

        let count = 0;
        for (const fileName of fileNames) {
          const fileNameListItemUI = this.buildFileNameListItemUI(fileName);
          domDataList.appendChild(fileNameListItemUI);
          count++;
        }

        if (! count) {
          this.debug( "-- NO FileNames added to list");
        } else {
          this.debug(`-- FileNames added to list: count=${count}`);
        }
      }
    }

    this.debug("-- end");
  }

  reshowSelectImportFilePanel() {
    this.#mode = "select-file"; // init | select-file | select-criteria | select-identities

    const domSelectImportFilePanel       = document.getElementById("idmIdentityImportFileSelector");
    const domSelectImportCriteriaPanel   = document.getElementById("idmIdentityImportCriteriaSelector");
    const domSelectImportIdentitiesPanel = document.getElementById("idmIdentityImportIdentitiesSelector");

    domSelectImportFilePanel.style.setProperty(       "display", "grid" );
    domSelectImportCriteriaPanel.style.setProperty(   "display", "none" );
    domSelectImportIdentitiesPanel.style.setProperty( "display", "none" );
  }



  async getImportFileNames() {
    this.debug("-- begin");

    const fileNameFilterGlob = await this.#idmOptionsApi.getOption('idmIdentityImportFileSelectorFilterGlobText', undefined);
    this.debug(`-- fileNameFilterGlob="${fileNameFilterGlob}"`);

    // returns { "fileNames": array of String, "length": number }
    const response = await this.#fsBrokerApi.listFiles(fileNameFilterGlob);
    const fileNames = response.fileNames;
    this.debug(`-- fileNames="${fileNames}"`);

    if ('error' in response) {
      this.error(`-- GOT AN ERROR: response.error="${response.error}"`);
    } else if (typeof fileNames !== 'object' || ! Array.isArray(fileNames)) {
      this.error("-- Unable to get fileNames - not an Object or Array");
    } else {
      this.debug(`-- end -- fileNames.length=${fileNames.length}`);
      return fileNames;
    }

    this.debug("-- end");
  }



  buildFileNameHeaderUI() {
    const headerTR = document.createElement("tr");
      headerTR.classList.add("filename-list-header");                     // filename-list-header

      const fileNameColTH = document.createElement("th");
        fileNameColTH.classList.add("filename-list-header-text");         // filename-list-header > filename-list-header-text
        fileNameColTH.appendChild( document.createTextNode(this.#message_fileName_listHeader_FileName) );
      headerTR.appendChild(fileNameColTH);

    return headerTR;
  }



  buildFileNameListItemUI(fileName) {
    const fileNameRowTR = document.createElement("tr");
      fileNameRowTR.classList.add("filename-list-item");                     // filename-list-item
      fileNameRowTR.setAttribute("filename", fileName);
      fileNameRowTR.addEventListener("click", (e) => this.fileNameClicked(e));
      // MABXXX what about double-click ???

      const fileNameColTD = document.createElement("td");
        fileNameColTD.classList.add("filename-list-item-data");              // filename-list-item > filename-list-item-data
        fileNameColTD.appendChild( document.createTextNode(fileName) );
      fileNameRowTR.appendChild(fileNameColTD);

    return fileNameRowTR;
  }



  async showSelectImportCriteriaPanel() {
    this.debug(`-- begin -- this.#importFileName="${this.#importFileName}"`);

    const domSelectImportCriteriaPanel = document.getElementById("idmIdentityImportCriteriaSelector");
    const continueBtn                  = document.getElementById("idmIdentityImportCriteriaControlsContinueButton");
    continueBtn.disabled               = true;

    const domFileNameLabel             = document.getElementById("idmIdentityImportCriteriaSelectorFileName");
    domFileNameLabel.textContent       = this.#importFileName; 

    let sheetDataError = false;
    let sheetData;
    let maxCols = 0;

    domSelectImportCriteriaPanel.style.setProperty("display", "grid");

    const domDataList = document.getElementById("idmIdentityImportCriteriaDataList");
    if (! domDataList) {
      this.#mode = "select-criteria"; // init | select-file | select-criteria | select-identities
      this.error("-- failed to get domDataList: #idmIdentityImportCriteriaDataList");
      this.addToErrorList("idmIdentityImporter_error_domIdFailed", "#idmIdentityImportCriteriaDataList");

    } else {
      domDataList.innerHTML = '';
      const loadingTR = document.createElement("tr");
        const loadingTD = document.createElement("td");
          loadingTD.appendChild( document.createTextNode(this.#message_criteria_loading) );
        loadingTR.appendChild(loadingTD);
      domDataList.appendChild(loadingTR);

      const parseResponse = await this.parseImportFileToSheetData(this.#importFileName, this.#MAX_CRITERIA_SHEET_DATA_ROW_NUM);

      if (! parseResponse) {
        this.error("-- got no parseResponse");
        this.addToErrorList("idmIdentityImportCriteriaSelector_error_sheetDataFailed");
        sheetDataError = true;
      } else if (parseResponse.error) {
        this.error(`-- got parseResponse error: "${parseResponse.error}"`);
        this.addToErrorList("idmIdentityImportCriteriaSelector_error_sheetDataError");
        sheetDataError = true;
      } else if (typeof parseResponse.data === 'undefined') {
        this.error("-- parseResponse returned no data");
        this.addToErrorList("idmIdentityImportCriteriaSelector_error_sheetDataUndefined");
        sheetDataError = true;
      } else {

        sheetData = parseResponse.data;
        this.debug(`-- sheetData.length=${sheetData.length}`);

        if (sheetData.length === 0) {
          this.debug("showSelectImportCriteriaPanel -- NO SHEET DATA -- sheetData.length==0");
          this.addToErrorList("idmIdentityImportCriteriaSelector_error_noSheetData");
          sheetDataError = true;

        } else {
          if (this.#DEBUG_VERBOSE) {
            const data = parseResponse.data;
            for (const row of sheetData) {
              this.debugAlways(`-- row.length=${row.length} row[0]=="${row[0]}" row[1]="${row[1]}" row[2]="${row[2]}" row[3]="${row[3]}"`);
            }
          }

          for (const row of sheetData) {
            if (row.length > maxCols) maxCols = row.length;
          }

          if (! maxCols) {
            this.debug("-- NO SHEET DATA -- maxCols==0");
            this.addToErrorList("idmIdentityImportCriteriaSelector_error_noSheetData");
            sheetDataError = true;
          }
        }
      }

      domDataList.innerHTML = '';

      if (sheetDataError) {
        // GO BACK TO FILE SELECTOR PANEL
        domSelectImportCriteriaPanel.style.setProperty("display", "none");
        this.reshowSelectImportFilePanel();

      } else {
        this.#mode = "select-criteria"; // init | select-file | select-criteria | select-identities

        this.populateSheetColumnSelects(maxCols);

        const sheetHeaderUI = this.buildSheetHeaderUI(maxCols);
        domDataList.appendChild(sheetHeaderUI);

        let rowNum = 0;
        for (const sheetRow of sheetData) {
          rowNum++;
          const sheetRowUI = this.buildSheetRowUI(rowNum, sheetRow);
          domDataList.appendChild(sheetRowUI);
          if (rowNum > this.#MAX_CRITERIA_SHEET_DATA_ROW_NUM) break;
        }

        if (! rowNum) { // (sheetData.length === 0) test above should make sure this never happens
          this.debug( "-- NO Sheet Data added to list");
        } else {
          this.debug(`-- Sheet Data added to list: count=${rowNum}`);
        }
      }
    }

    this.debug("-- end");
  }

  reshowSelectImportCriteriaPanel() {
    this.#mode = "select-criteria"; // init | select-file | select-criteria | select-identities

    const domSelectImportFilePanel       = document.getElementById("idmIdentityImportFileSelector");
    const domSelectImportCriteriaPanel   = document.getElementById("idmIdentityImportCriteriaSelector");
    const domSelectImportIdentitiesPanel = document.getElementById("idmIdentityImportIdentitiesSelector");

    domSelectImportFilePanel.style.setProperty(       "display", "none" );
    domSelectImportCriteriaPanel.style.setProperty(   "display", "grid" );
    domSelectImportIdentitiesPanel.style.setProperty( "display", "none" );
  }



  buildSheetHeaderUI(numCols) {
    const headerRowTR = document.createElement("tr");
      headerRowTR.classList.add("sheet-header-row");                            // sheet-header-row

      for (let colNum = 1; colNum <= numCols; colNum++) {
        const headerColTH = document.createElement("th");
          headerColTH.classList.add("sheet-header-col");                        // sheet-header-row -> sheet-header-col
          headerColTH.setAttribute("column", colNum.toString());
          headerColTH.appendChild( document.createTextNode(this.#message_criteria_listHeader_Column + colNum) );
        headerRowTR.appendChild(headerColTH);
      }

    return headerRowTR;
  }



  buildSheetRowUI(rowNum, sheetRowData) {
    const sheetRowTR = document.createElement("tr");
      sheetRowTR.classList.add("sheet-data-row");                            // sheet-data-row
      sheetRowTR.setAttribute("row", rowNum.toString());
//////sheetRowTR.addEventListener("click", (e) => this.sheetRowDataClicked(e)); // NO NEED FOR ROW SELECTION

      let colNum = 1;
      for (const sheetColText of sheetRowData) {
        const sheetColTD = document.createElement("td");
          sheetColTD.classList.add("sheet-data-col");                        // sheet-data-row -> sheet-data-col
          sheetColTD.setAttribute("column", colNum.toString());
          sheetColTD.appendChild( document.createTextNode(sheetColText) );
        sheetRowTR.appendChild(sheetColTD);
        colNum++;
      }

    return sheetRowTR;
  }



  populateSheetColumnSelects(numCols) {
    this.populateSheetColumnSelectById( "idmIdentityImportCriteriaSelectionEmailColumnSelect", this.#message_criteria_colSelectDefault_Email, numCols );
    this.populateSheetColumnSelectById( "idmIdentityImportCriteriaSelectionNameColumnSelect",  this.#message_criteria_colSelectDefault_Name,  numCols );
  }

  populateSheetColumnSelectById(elementId, defaultText, numCols) {
    const select = document.getElementById(elementId);
    if (! select) {
      this.error("-- failed to get <select>: #" + elementId)
      this.addToErrorList("idmIdentityImporter_error_domIdFailed", "#" + elementId);
    } else {
      select.innerHTML = '';

      let option = document.createElement("option");
      option.setAttribute("value", "");
      option.appendChild( document.createTextNode(defaultText) );
      select.appendChild(option);

      for (let colNum = 1; colNum <= numCols; colNum++) {
        option = document.createElement("option");
        option.setAttribute("value", colNum.toString());
        option.appendChild( document.createTextNode( colNum.toString() ) );
        select.appendChild(option);
      }
    }
  }



  // enable the continue button if the requirements are met
  async criteriaSelectorColumnSelectChanged(e) {
    this.debug("-- begin");

    // or just use e.target() ??? One day we might have more requirements than just this one column?
    const emailColSelect = document.getElementById("idmIdentityImportCriteriaSelectionEmailColumnSelect");

    if (! emailColSelect) {
      this.error("-- failed to get emailColSelect: #idmIdentityImportCriteriaSelectionEmailColumnSelect");
      this.addToErrorList("idmIdentityImporter_error_domIdFailed", "#idmIdentityImportCriteriaSelectionEmailColumnSelect");

    } else {
      const continueBtn = document.getElementById("idmIdentityImportCriteriaControlsContinueButton");

      if (! continueBtn) {
        this.error("-- failed to get continueBtn: #idmIdentityImportCriteriaControlsContinueButton");
        this.addToErrorList("idmIdentityImporter_error_domIdFailed", "#idmIdentityImportCriteriaControlsContinueButton");

      } else {
        const emailColNum = emailColSelect.value;
        this.debug(`-- emailColNum="${emailColNum}"`);

        if (emailColNum) {
          continueBtn.disabled = false;
        } else {
          continueBtn.disabled = true;
        }
      }
    }

    this.debug("-- end");
  }



  /**
   * can return:
   * - { 'error': FileSystemBroker error }
   * - { 'error': "File does not exist" }
   * - { 'error': "File is not a Regular File" }
   * - { 'error': "Got no data from the file" }
   * - { 'data':  array (rows) of array (columns) of String }
   */
  async parseImportFileToSheetData(fileName, maxRowNum) {
    this.debug("-- begin");

    // returns { "fileName": string, "exists": boolean }
    let response = await this.#fsBrokerApi.exists(fileName);
    this.debug(`-- fileName="${fileName}" response.error=${response.error}`);

    if ('error' in response) {
      this.error(`-- GOT A FILESYSTEM ERROR: response.error="${response.error}"`);
      return response;

    } else {
      this.debug(`-- fileName="${fileName}" response.exists=${response.exists}`);
      if (! ('exists' in response) || ! response.exists) {
        this.debug(`-- file does not exist: fileName="${fileName}"`);
        return { 'error': `File does not exist: ${fileName}` };

      } else {
        // returns { "fileName": string, "isRegularFile": boolean }
        response = await this.#fsBrokerApi.isRegularFile(fileName);
        this.debug(`-- fileName="${fileName}" response.isRegularFile=${response.isRegularFile}`);

        if ('error' in response) {
          this.error(`-- GOT A FILESYSTEM ERROR: response.error="${response.error}"`);
          return response;

        } else if (! ('isRegularFile' in response) || ! response.isRegularFile) {
          this.debug(`-- file is not a Regular File: fileName="${fileName}"`);
          return { 'error': `File is not a Regular File: ${fileName}` };

        } else {
          // returns { "fileName": string, "data": UTF8-String }
          response = await this.#fsBrokerApi.readFile(fileName);
          if ('error' in response) {
            this.error(`-- GOT A FILESYSTEM ERROR: response.error="${response.error}"`);
            return response;

          } else if (! ('data' in response)) {
            this.error(`-- readFile("${fileName}") did not return response.data`);
            return { 'error': `Got no data from the file: ${fileName}` };

          } else {
            const fileData = response.data;

            if (this.#DEBUG) {
              this.debugAlways(`-- readFile("${fileName}") fileData.length=${fileData.length}`);
              this.debugVerbose(`-- \n\nfileData ==========\n\n${fileData}\n\n==========\n\n`);
              const fileLines = fileData.split(/\r\n|\r|\n/);
              this.debugAlways(`-- fileLines.length=${fileLines.length}`);
              if (this.#DEBUG_VERBOSE) {
                for (const fileLine of fileLines) {
                  this.debugAlways(`-- fileLine="${fileLine}"`);
                }
              }
            }

            const workbook  = XLSX.read( fileData, { type: 'string' } );
            const worksheet = workbook.Sheets[workbook.SheetNames[0]];
            const sheetData = XLSX.utils.sheet_to_json(worksheet, { header: 1 } ); // we want to see the header if it's there, so user can tell us
            this.debug(`-- sheetData.length=${sheetData.length}`);

            const data   = [];
            let   rowNum = 0;
            for (const sheetRow of sheetData) {
              rowNum++;
              this.debugVerbose( `-- row #${rowNum}: `
                                 + ` [0]="${sheetRow[0]}"`
                                 + ` [1]="${sheetRow[1]}"`
                                 + ` [2]="${sheetRow[2]}"`
                                 + ` [3]="${sheetRow[3]}"`
                                 + ` [4]="${sheetRow[4]}"`
                                 + ` [5]="${sheetRow[5]}"`
                               );
              data.push(sheetRow);
              if (maxRowNum > 0 && rowNum >= maxRowNum) break;
            }

            return { 'data': data };
          }
        }
      }
    }

    this.debug("-- end"); // MABXXX the many return statements above make this useless
  }



  /**
   * emailColNum must be an integer >= 1 and <= number of columns in the spreadsheet
   * numeColNum may be undefined, otherwise it must be an integer <= number of columns in the spreadsheet, undefined or < 1 means no name column
   *
   * can return:
   * - { 'error': "Invalid Columm Number" }
   * - { 'error': "Invalid Column Number for Email Address Column" }
   * - { 'error': "Invalid Column Number for Name Column" }
   * - { 'error': "Invalid Column Number - Email Address Column Number (n) > Maximum Column Number (n)" }
   * - { 'error': "Invalid Column Number - Name Column Number (n) > Maximum Column Number (n)" }
   * - { 'error': FileSystemBroker error }
   * - { 'error': "File does not exist" }
   * - { 'error': "File is not a Regular File" }
   * - { 'error': "Got no data from the file" }
   * - { 'data':  array of Object where Object: { 'email': identityEmailAddress [, 'name': identityName] }
   */
  async parseImportFileToIdentities(fileName, hasHeaderRow, emailColNum, nameColNum) {
    this.debug(`-- begin -- hasHeaderRow=${hasHeaderRow} emailColNum=${emailColNum} nameColNum=${nameColNum}`);


    if (typeof hasHeaderRow !== 'boolean') hasHeaderRow = false;
    if (! Number.isInteger(emailColNum) || emailColNum < 1) {
      return { 'error': "Invalid Column Number for Email Address Column" };
    }
    if (typeof nameColNum === 'undefined') { // undefined is allowed
      nameColNum = 0;
    } else if (! Number.isInteger(nameColNum)) {
      return { 'error': "Invalid Column Number for Name Column" };
    }

    // returns { "fileName": string, "exists": boolean }
    let response = await this.#fsBrokerApi.exists(fileName);
    this.debug(`-- fileName="${fileName}" response.error=${response.error}`);

    if ('error' in response) {
      this.debug(`-- GOT AN ERROR: response.error="${response.error}"`);
      return response;

    } else {
      this.debug(`-- fileName="${fileName}" response.exists=${response.exists}`);
      if (! ('exists' in response) || ! response.exists) {
        this.debug(`-- file does not exist: fileName="${fileName}"`);
        return { 'error': "File does not exist" };

      } else {
        // returns { "fileName": string, "isRegularFile": boolean }
        response = await this.#fsBrokerApi.isRegularFile(fileName);
        this.debug(`-- fileName="${fileName}" response.isRegularFile=${response.isRegularFile}`);

        if ('error' in response) {
          this.debug(`-- GOT AN ERROR: response.error="${response.error}"`);
          return response;

        } else if (! ('isRegularFile' in response) || ! response.isRegularFile) {
          this.debug(`-- file is not a Regular File: fileName="${fileName}"`);
          return { 'error': "File is not a Regular File" };

        } else {
          // returns { "fileName": string, "data": UTF8-String }
          response = await this.#fsBrokerApi.readFile(fileName);
          if ('error' in response) {
            this.debug(`-- GOT AN ERROR: response.error="${response.error}"`);
            return response;

          } else if (! ('data' in response)) {
            this.debug(`-- readFile("${fileName}") did not return response.data`);
            return { 'error': "Got no data from the file" };

          } else {
            const fileData = response.data;

            if (this.#DEBUG) {
              this.debugAlways(`-- readFile("${fileName}") fileData.length=${fileData.length}`);
              this.debugVerbose(`-- \n\nfileData ==========\n\n${fileData}\n\n==========\n\n`);
              const fileLines = fileData.split(/\r\n|\r|\n/);
              this.debugAlways(`-- fileLines.length=${fileLines.length}`);
              if (this.#DEBUG_VERBOSE) {
                for (const fileLine of fileLines) {
                  this.debugAlways(`-- fileLine="${fileLine}"`);
                }
              }
            }

            const workbook  = XLSX.read( fileData, { type: 'string' } );
            const worksheet = workbook.Sheets[workbook.SheetNames[0]];
            const sheetData = XLSX.utils.sheet_to_json(worksheet, { header: 1 } ); // We don't eleminate header row here, but instead when processing the data
            this.debug(`-- sheetData.length=${sheetData.length}`);

            const data   = [];
            let   rowNum = 0;
            for (const sheetRow of sheetData) {
              rowNum++;
              this.debug(`-- rowNum=${rowNum} sheetRow.length=${sheetRow.length}`);

              if (rowNum === 1 && hasHeaderRow) {
                this.debug( "-- skipping header row #0:"
                            + `\n- [0]="${sheetRow[0]}"`
                            + `\n- [1]="${sheetRow[1]}"`
                            + `\n- [2]="${sheetRow[2]}"`
                            + `\n- [3]="${sheetRow[3]}"`
                            + `\n- [4]="${sheetRow[4]}"`
                            + `\n- [5]="${sheetRow[5]}"`
                          );
                continue;
              }

              // MABXXX Are all rows the same length even if some columns in some rows have no entries in the file???
              // MABXXX If so, we could move these checks out of the loop
              const maxColNum = sheetRow.length + 1;
              if (emailColNum > maxColNum) {
                return { 'error': `Invalid Column Number - Email Address Column Number (${emailColNum}) > Maximum Column Number (${maxColNum})`};
              }
              if (nameColNum > maxColNum) {
                return { 'error': `Invalid Column Number - Name Column Number (${nameColNum}) > Maximum Column Number (${maxColNum})`};
              }

              this.debugVerbose( `-- row #${rowNum}: `
                                 + `\n- [0]="${sheetRow[0]}"`
                                 + `\n- [1]="${sheetRow[1]}"`
                                 + `\n- [2]="${sheetRow[2]}"`
                                 + `\n- [3]="${sheetRow[3]}"`
                                 + `\n- [4]="${sheetRow[4]}"`
                                 + `\n- [5]="${sheetRow[5]}"`
                               );

              const identity = {};
                                  identity[ 'email' ] = sheetRow[ emailColNum - 1 ];
              if (nameColNum > 0) identity[ 'name'  ] = sheetRow[ nameColNum  - 1 ];

              data.push(identity);
            }

            return { 'data': data };
          }
        }
      }
    }

    this.debug("-- end");
  }



  // requirements for parseImportFileToIdentities: this.#emailColNum must be an Integer,  this.nameCoNum must be an Integer or Undefined
  async showSelectImportIdentitiesPanel() {
    this.debug("-- begin");
    this.debug(`-- importFileName="${this.#importFileName}" hasHeaderRow="${this.#hasHeaderRow}" emailColNum=${this.#emailColNum} nameColum=${this.#nameColNum}`);

    const domSelectImportIdentitiesPanel = document.getElementById("idmIdentityImportIdentitiesSelector");
    this.#mode = "select-identities"; // init | select-file | select-criteria | select-identities
    domSelectImportIdentitiesPanel.style.setProperty("display", "grid");

    const domFileNameLabel       = document.getElementById("idmIdentityImportIdentitiesSelectorFileName");
    domFileNameLabel.textContent = this.#importFileName; 

    const domIdentityImportList = document.getElementById("idmIdentityImportIdentitiesSelectorIdentityList");
    if (! domIdentityImportList) {
      this.error("-- failed to get domIdentityImportList: #idmIdentityImportIdentitiesSelectorIdentityList");
      this.addToErrorList("idmIdentityImporter_error_domIdFailed", "#idmIdentityImportIdentitiesSelectorIdentityList");

    } else {
      domIdentityImportList.innerHTML = '';
      const loadingTR = document.createElement("tr");
        const loadingTD = document.createElement("td");
          loadingTD.appendChild( document.createTextNode(this.#message_identities_loading) );
        loadingTR.appendChild(loadingTD);
      domIdentityImportList.appendChild(loadingTR);

      const accountSelect = document.getElementById("idmIdentityImportIdentitiesSelector_actionsSetData_Account.select");
      if (accountSelect) {
        this.populateAccountSelectUI(accountSelect);
      }

      let   importIdentities = [];
      const parseResponse    = await this.parseImportFileToIdentities(this.#importFileName, this.#hasHeaderRow, this.#emailColNum, this.#nameColNum);

      if (! parseResponse) {
        this.error("-- got no parseResponse");
        this.addToErrorList("idmIdentityImportIdentitiesSelector_error_sheetDataFailed");
      } else if (parseResponse.error) {
        this.error(`-- got parseResponse error: "${parseResponse.error}"`);
        this.addToErrorList("idmIdentityImportIdentitiesSelector_error_sheetDataError");
      } else if (! parseResponse.data) {
        this.error("-- parseResponse returned no data");
        this.addToErrorList("idmIdentityImportIdentitiesSelector_error_sheetDataUndefined");
      } else {
        importIdentities = parseResponse.data;

        if (this.#DEBUG_VERBOSE) {
          for (const identity of importIdentities) {
            this.debugAlways(`-- identity email="${identity.email}" name="${identity.name}"`);
          }
        }
      }
      this.debug(`-- importIdentities.length=${importIdentities.length}`);

      if (! importIdentities || importIdentities.length == 0) {
        this.debug("--  importIdentities.length==0");
        this.addToErrorList("idmIdentityImportIdentitiesSelector_error_noImportIdentities");

        domIdentityImportList.innerHTML = '';
        this.reshowSelectImportCriteriaPanel();

      } else {
        let rowNum                                = this.#hasHeaderRow ? 1 : 0;
        let identityEmailDataTypeErrors           = 0;
        let firstIdentityEmailDataTypeErrorValue  = undefined;
        let firstIdentityEmailDataTypeErrorRowNum = 0;
        let identityEmailInvalidErrors            = 0;
        let firstIdentityEmailInvalidErrorValue   = undefined;
        let firstIdentityEmailInvalidErrorRowNum  = 0;
        let identityNameDataTypeErrors            = 0;
        let firstIdentityNameDataTypeErrorValue   = undefined;
        let firstIdentityNameDataTypeErrorRowNum  = 0;

        for (const ident of importIdentities) {
          rowNum++;
          const typeOfEmail = typeof ident.email;
          const typeOfName  = typeof ident.name;
          if (typeOfEmail !== 'string') {
            if (this.#DEBUG) {
              this.debugAlways( "-- Identity Email Address is Not a String:"
                                + `\n- rowNum=${rowNum} colNum=${this.#emailColNum} type='${typeOfEmail}' email="${ident.email}"`
                              );
            }

            if (! firstIdentityEmailDataTypeErrorValue) {
              firstIdentityEmailDataTypeErrorValue  = ident.email;
              firstIdentityEmailDataTypeErrorRowNum = rowNum;
            }
            identityEmailDataTypeErrors++;

          } else if (! isValidEmail(ident.email)) {
            if (this.#DEBUG) {
              this.debugAlways( "-- Identity Email Address is invalid:"
                                + `\n- rowNum=${rowNum} colNum=${this.#emailColNum} email="${ident.email}"`
                              );
            }

            if (! firstIdentityEmailInvalidErrorValue) {
              firstIdentityEmailInvalidErrorValue  = ident.email;
              firstIdentityEmailInvalidErrorRowNum = rowNum;
            }
            identityEmailInvalidErrors++;
          }

          if (this.#nameColNum > 0 && typeOfName !== 'string') {
            if (this.#DEBUG) {
              this.debugAlways( "-- Identity Name Not a String:"
                                + `\n- rowNum=${rowNum} colNum=${this.#nameColNum} type='${typeOfName}' email="${ident.name}"`
                              );
            }

            if (! firstIdentityNameDataTypeErrorValue) {
              firstIdentityNameDataTypeErrorValue  = ident.name;
              firstIdentityNameDataTypeErrorRowNum = rowNum;
            }
            identityNameDataTypeErrors++;
          }
        }

        if (identityEmailDataTypeErrors || identityEmailInvalidErrors || identityNameDataTypeErrors) {
          if (identityEmailDataTypeErrors) {
            this.debug( `-- ${identityEmailDataTypeErrors} Identities have Email Addresses that are not of type 'string'`
                        + `\n- value="${firstIdentityEmailDataTypeErrorValue}"`
                        + `\n- row:col=(${firstIdentityEmailDataTypeErrorRowNum}:${this.#emailColNum})`
                      );
            this.addToErrorList( "idmIdentityImportIdentitiesSelector_error_invalidEmailAddressDataType_1",
                                 `"${firstIdentityEmailDataTypeErrorValue}" (${firstIdentityEmailDataTypeErrorRowNum}:${this.#emailColNum})`,
                                 "idmIdentityImportIdentitiesSelector_error_invalidEmailAddressDataType_2"
                               );
          }
          if (identityEmailInvalidErrors) {
            this.debug( `-- ${identityEmailInvalidErrors} Identities have Invalid Email Addresses`
                        + `\n- value="${firstIdentityEmailInvalidErrorValue}"`
                        + `\n- row:col=(${firstIdentityEmailInvalidErrorRowNum}:${this.#emailColNum})`
                      );
            this.addToErrorList( "idmIdentityImportIdentitiesSelector_error_invalidEmailAddress_1",
                                 `"${firstIdentityEmailInvalidErrorValue}" (${firstIdentityEmailInvalidErrorRowNum}:${this.#emailColNum})`,
                                 "idmIdentityImportIdentitiesSelector_error_invalidEmailAddress_2"
                               );
          }
          if (identityNameDataTypeErrors) {
            this.debug( `-- ${identityNameDataTypeErrors} Identities have Names that are not of type 'string'`
                        + `\n- value="${firstIdentityNameDataTypeErrorValue}"`
                        + `\n- row:col=(${firstIdentityNameDataTypeErrorRowNum}:${this.#nameColNum})`
                      );
            this.addToErrorList( "idmIdentityImportIdentitiesSelector_error_invalidNameDataType_1",
                                 `"${firstIdentityNameDataTypeErrorValue}" (${firstIdentityNameDataTypeErrorRowNum}:${this.#nameColNum})`,
                                 "idmIdentityImportIdentitiesSelector_error_invalidNameDataType_2"
                               );
          }

          domIdentityImportList.innerHTML = '';
          this.reshowSelectImportCriteriaPanel();

        } else {
          const hideExistingIdentitiesCheck = document.getElementById("idmIdentityImportIdentitiesSelectorHideExistingCheck"); // get from options instead???
          let   hideExistingIdentities      = false;
          if (! hideExistingIdentitiesCheck) {
            this.error("-- failed to get select: #idmIdentityImportIdentitiesSelectorHideExistingCheck");
            this.addToErrorList("idmIdentityImporter_error_domIdFailed", "#idmIdentityImportIdentitiesSelectorHideExistingCheck");
            errors++;
          } else {
            hideExistingIdentities = hideExistingIdentitiesCheck.checked;
            this.debug(`-- hideExistingIdentities=${hideExistingIdentities}`);
          }

          const existingIdentities = await this.#idmIdentitiesApi.getMailIdentities();

          this.debug(`-- importIdentities.length=${importIdentities.length} existingIdentities.length=${existingIdentities.length}`);

          domIdentityImportList.innerHTML = '';

          const importIdentityListHeaderUI = this.buildImportIdentityListHeaderUI();
          domIdentityImportList.appendChild(importIdentityListHeaderUI);

          importIdentities.sort((a, b) => compareIdentitiesByEmail(a,b));

          function compareIdentitiesByEmail(a, b) { // return negative if a before b, positive if a after b, 0 if equal
            if (!a && !b) return 0;
            if (!a)       return -1;
            if (!b)       return +1;

            const emailA = a.email ? a.email.toLowerCase() : '';
            const emailB = b.email ? b.email.toLowerCase() : '';

            if (!emailA && !emailB) return 0;
            if (!emailA)            return -1;
            if (!emailB)            return +1;

            return emailA.localeCompare(emailB);
          }

          let count = 0;
          for (const importIdentity of importIdentities) {
            this.debug(`-- IMPORT Identity: email="${importIdentity.email}"`);
            const existingIdentityMatch    = existingIdentities.find(obj => obj.email.toLowerCase() === importIdentity.email.toLowerCase());
            const importIdentityListItemUI = this.buildImportIdentityListItemUI(importIdentity, existingIdentityMatch, hideExistingIdentities);
            domIdentityImportList.appendChild(importIdentityListItemUI);
            count++;
          }

          if (! count) {
            this.debug("-- NO identities added to list");
          } else {
            this.debug(`-- identities added to list count=${count}`);
          }
        }
      }
    }

    this.debug("-- end");
  }

  resshowSelectImportIdentitiesPanel() {
    this.#mode = "select-identities"; // init | select-file | select-criteria | select-identities

    const domSelectImportFilePanel       = document.getElementById("idmIdentityImportFileSelector");
    const domSelectImportCriteriaPanel   = document.getElementById("idmIdentityImportCriteriaSelector");
    const domSelectImportIdentitiesPanel = document.getElementById("idmIdentityImportIdentitiesSelector");

    domSelectImportFilePanel.style.setProperty(       "display", "none" );
    domSelectImportCriteriaPanel.style.setProperty(   "display", "none" );
    domSelectImportIdentitiesPanel.style.setProperty( "display", "grid" );
  }



  buildImportIdentityListHeaderUI() {
    const headerTR = document.createElement("tr");
      headerTR.classList.add("identity-list-header");                               // identity-list-header

      // Create IdentityImport Status element and add it to the row
      const headerStatusTH = document.createElement("th");
        headerStatusTH.classList.add("identity-list-header-text");                  // identity-list-header > identity-list-header-text
        headerStatusTH.classList.add("identity-list-header-status");                // identity-list-header > identity-list-header-status
        headerStatusTH.appendChild( document.createTextNode(this.#message_listHeader_Status) );
        headerStatusTH.setAttribute("title", this.#message_listHeader_Status_tooltip);
      headerTR.appendChild(headerStatusTH);

      // Create IdentityImport Account Name/Select element and add it to the row
      const headerAccountTH = document.createElement("th");
        headerAccountTH.classList.add("identity-list-header-text");                 // identity-list-header > identity-list-header-text
        headerAccountTH.classList.add("identity-list-header-account");              // identity-list-header > identity-list-header-account
        headerAccountTH.appendChild( document.createTextNode(this.#message_listHeader_Account) );
        headerAccountTH.setAttribute("title", this.#message_listHeader_Account_tooltip);
      headerTR.appendChild(headerAccountTH);

      // Create IdentityImport Email element and add it to the row
      const headerEmailTH = document.createElement("th");
        headerEmailTH.classList.add("identity-list-header-text");                   // identity-list-header > identity-list-header-text
        headerEmailTH.classList.add("identity-list-header-email");                  // identity-list-header > identity-list-header-email
        headerEmailTH.appendChild( document.createTextNode(this.#message_listHeader_Email) );
        headerEmailTH.setAttribute("title", this.#message_listHeader_Email_tooltip);
      headerTR.appendChild(headerEmailTH);

      // Create IdentityImport Name element and add it to the row
      const headerNameTH = document.createElement("th");
        headerNameTH.classList.add("identity-list-header-text");                    // identity-list-header > identity-list-header-text
        headerNameTH.classList.add("identity-list-header-name");                    // identity-list-header > identity-list-header-name
        headerNameTH.appendChild( document.createTextNode(this.#message_listHeader_Name) );
        headerNameTH.setAttribute("title", this.#message_listHeader_Name_tooltip);
      headerTR.appendChild(headerNameTH);

      // Create IdentityImport Label element and add it to the row
      const headerLabelTH = document.createElement("th");
        headerLabelTH.classList.add("identity-list-header-text");                   // identity-list-header > identity-list-header-text
        headerLabelTH.classList.add("identity-list-header-label");                  // identity-list-header > identity-list-header-label
        headerLabelTH.appendChild( document.createTextNode(this.#message_listHeader_Label) );
        headerLabelTH.setAttribute("title", this.#message_listHeader_Label_tooltip);
      headerTR.appendChild(headerLabelTH);

      // Create IdentityImport ComposeHtml element and add it to the row
      const headerComposeHtmlTH = document.createElement("th");
        headerComposeHtmlTH.classList.add("identity-list-header-text");             // identity-list-header > identity-list-header-text
        headerComposeHtmlTH.classList.add("identity-list-header-composeHtml");      // identity-list-header > identity-list-header-composeHtml
        headerComposeHtmlTH.appendChild( document.createTextNode(this.#message_listHeader_ComposeHtml) );
        headerComposeHtmlTH.setAttribute("title", this.#message_listHeader_ComposeHtml_tooltip);
      headerTR.appendChild(headerComposeHtmlTH);

      // Create IdentityImport ReplyTo element and add it to the row
      const headerReplyToTH = document.createElement("th");
        headerReplyToTH.classList.add("identity-list-header-text");                 // identity-list-header > identity-list-header-text
        headerReplyToTH.classList.add("identity-list-header-replyTo");              // identity-list-header > identity-list-header-replyTo
        headerReplyToTH.appendChild( document.createTextNode(this.#message_listHeader_ReplyTo) );
        headerReplyToTH.setAttribute("title", this.#message_listHeader_ReplyTo_tooltip);
      headerTR.appendChild(headerReplyToTH);

      // Create IdentityImport Org (organization) element and add it to the row
      const headerOrgTH = document.createElement("th");
        headerOrgTH.classList.add("identity-list-header-text");                     // identity-list-header > identity-list-header-text
        headerOrgTH.classList.add("identity-list-header-organization");             // identity-list-header > identity-list-header-organization
        headerOrgTH.appendChild( document.createTextNode(this.#message_listHeader_Org) );
        headerOrgTH.setAttribute("title", this.#message_listHeader_Org_tooltip);
      headerTR.appendChild(headerOrgTH);

      // Create IdentityImport Signature element and add it to the row
      const headerSignatureTH = document.createElement("th");
        headerSignatureTH.classList.add("identity-list-header-text");               // identity-list-header > identity-list-header-text
        headerSignatureTH.classList.add("identity-list-header-signature");          // identity-list-header > identity-list-header-signature
        headerSignatureTH.appendChild( document.createTextNode(this.#message_listHeader_Signature) );
        headerSignatureTH.setAttribute("title", this.#message_listHeader_Signature_tooltip);
      headerTR.appendChild(headerSignatureTH);

      // Create IdentityImport SigIsHtml (signatureIsHtml) element and add it to the row
      const headerSigIsHtmlTH = document.createElement("th");
        headerSigIsHtmlTH.classList.add("identity-list-header-text");               // identity-list-header > identity-list-header-text
        headerSigIsHtmlTH.classList.add("identity-list-header-signatureIsHtml");    // identity-list-header > identity-list-header-signatureIsHtml
        headerSigIsHtmlTH.appendChild( document.createTextNode(this.#message_listHeader_SigIsHtml) );
        headerSigIsHtmlTH.setAttribute("title", this.#message_listHeader_SigIsHtml_tooltip);
      headerTR.appendChild(headerSigIsHtmlTH);

    return headerTR;
  }  



  buildAccountSelectorUI() {
    // create the Account Selector
    const identityAccountSelect = document.createElement("select");
    identityAccountSelect.classList.add("identity-list-item-select");

    this.populateAccountSelectUI(identityAccountSelect);

    return identityAccountSelect;
  }



  populateAccountSelectUI(select) {
    if (select) {
      select.innerHTML = '';

      const noOption     = document.createElement("option");
      const noOptionText = getI18nMsg("idmIdentityImportIdentitiesSelector_account_select");
      noOption.setAttribute("value", "");
      noOption.appendChild( document.createTextNode(noOptionText) );
      select.appendChild(noOption);

      for (const account of this.#accounts) {
        if (account.type === 'none') {
          this.debug(`-- skipping account, local folder?: id="${account.id}" name="${account.name}" type="${account.type}"`);
        } else {
          this.debug(`-- adding account option: id="${account.id}" name="${account.name}" type="${account.type}"`);
          const option = document.createElement("option");
          option.setAttribute("value", account.id);
          option.appendChild( document.createTextNode(account.name) );
          select.appendChild(option);
        }
      }
    }
  }



  buildImportIdentityListItemUI(importIdentity, existingIdentityMatch, hideExistingIdentities) {
    if (! existingIdentityMatch) {
      this.debug( "-- BUILD LIST ITEM UI:"
                  + `\n- importIdentity.email = "${importIdentity.email}"`
                  + `\n- importIdentity.name = "${importIdentity.name}"`
                  + "\nIDENTITY IS NOT ALREADY CONFIGURED"
                );
    } else if (this.#DEBUG_VERBOSE) {
      this.debugAlways( "-- BUILD LIST ITEM UI -- IDENTITY IS ALREADY CONFIGURED:"
                         + `\n- importIdentity.email =================== "${importIdentity.email}"`
                         + `\n- importIdentity.name ==================== "${importIdentity.name}"`
                         + `\n- hideExistingIdentities ================= ${hideExistingIdentities}` 
                         + `\n- existingIdentityMatch.id ............. "${existingIdentityMatch.id}"`
                         + `\n- existingIdentityMatch.accountId ...... "${existingIdentityMatch.accountId}"`
                         + `\n- existingIdentityMatch.email .......... "${existingIdentityMatch.email}"`
                         + `\n- existingIdentityMatch.name ........... "${existingIdentityMatch.name}"`
                         + `\n- existingIdentityMatch.replyTo ........ "${existingIdentityMatch.replyTo}"`
                         + `\n- existingIdentityMatch.organization ... "${existingIdentityMatch.organization}"`
                         + `\n- existingIdentityMatch.label .......... "${existingIdentityMatch.label}"`
                         + `\n- existingIdentityMatch.signature ...... "${existingIdentityMatch.signature}"`
                       );
    }

    const identityTR = document.createElement("tr");
      identityTR.setAttribute("identityEmail", importIdentity.email.toLowerCase());
      identityTR.addEventListener("click", (e) => this.identityClicked(e));
      identityTR.classList.add("identity-list-item");                               // identity-list-item
      if (existingIdentityMatch) {
        identityTR.classList.add("identity-configured");                            // identity-configured
        if (hideExistingIdentities) {
          this.debug(`-- Hiding Existing Identity -- importIdentity.email="${importIdentity.email}"`);
          identityTR.classList.add("identity-hidden");                              // identity-hidden // MABXXX identity-configured-hidden
        }
      }

      // Create IdentityImport Status element and add it to the row
      const identityStatusTD = document.createElement("td");
        identityStatusTD.classList.add("identity-list-item-data");                  // identity-list-item > identity-list-item-data
        identityStatusTD.classList.add("identity-list-item-status");                // identity-list-item > identity-list-item-status
        if (existingIdentityMatch) {
          identityStatusTD.setAttribute("title", this.#message_listItem_Status_tooltip);
        } else {
          identityStatusTD.setAttribute("title", this.#message_editListItem_Status_tooltip);
        }

        const identityStatusDotSpan = document.createElement("span");
          identityStatusDotSpan .classList.add("identity-list-item-status-dot");    // identity-list-item > identity-list-item-status > identity-list-item-status-dot
        identityStatusTD.appendChild(identityStatusDotSpan);
      identityTR.appendChild(identityStatusTD);

      // Create IdentityImport Account Name/Select element and add it to the row
      const identityAccountTD = document.createElement("td");
        identityAccountTD.classList.add("identity-list-item-data");                 // identity-list-item > identity-list-item-data
        identityAccountTD.classList.add("identity-list-item-account");              // identity-list-item > identity-list-item-account
        if (existingIdentityMatch) {
          identityAccountTD.setAttribute("title", this.#message_listItem_Account_tooltip);
          const account = this.#accounts.find(obj => obj.id === existingIdentityMatch.accountId);
          identityAccountTD.appendChild( document.createTextNode(account.name) );
        } else {
          identityAccountTD.setAttribute("title", this.#message_editListItem_Account_tooltip);
          const accountSelector = this.buildAccountSelectorUI();
          identityAccountTD.appendChild(accountSelector);
        }
      identityTR.appendChild(identityAccountTD);

      // Create IdentityImport Email element and add it to the row
      const identityEmailTD = document.createElement("td");
        identityEmailTD.classList.add("identity-list-item-data");                   // identity-list-item > identity-list-item-data
        identityEmailTD.classList.add("identity-list-item-email");                  // identity-list-item > identity-list-item-email
        identityEmailTD.setAttribute("title", this.#message_listItem_Email_tooltip);
        identityEmailTD.appendChild( document.createTextNode(importIdentity.email) );
      identityTR.appendChild(identityEmailTD);

      // Create IdentityImport Name element and add it to the row
      const identityNameTD = document.createElement("td");
        identityNameTD.classList.add("identity-list-item-data");                    // identity-list-item > identity-list-item-data
        identityNameTD.classList.add("identity-list-item-name");                    // identity-list-item > identity-list-item-name
        if (existingIdentityMatch) {
          identityNameTD.setAttribute("title", this.#message_listItem_Name_tooltip);
          identityNameTD.appendChild( document.createTextNode(existingIdentityMatch.name) );
        } else {
          identityNameTD.setAttribute("title", this.#message_editListItem_Name_tooltip);
          const identityNameInput = document.createElement("input");
            identityNameInput.setAttribute("type", "text");
            identityNameInput.classList.add("identity-list-item-text");             // identity-list-item > identity-list-item-name > identity-list-item-text 
            if (importIdentity.name) {
              identityNameInput.value = importIdentity.name;
            }
          identityNameTD.appendChild(identityNameInput);
        }
      identityTR.appendChild(identityNameTD);

      // Create IdentityImport Label element and add it to the row
      const identityLabelTD = document.createElement("td");
        identityLabelTD.classList.add("identity-list-item-data");                   // identity-list-item > identity-list-item-data
        identityLabelTD.classList.add("identity-list-item-label");                  // identity-list-item > identity-list-item-label
        if (existingIdentityMatch) {
          identityLabelTD.setAttribute("title", this.#message_listItem_Label_tooltip);
          identityLabelTD.appendChild( document.createTextNode(existingIdentityMatch.label) );
        } else {
          identityLabelTD.setAttribute("title", this.#message_editListItem_Label_tooltip);
          const identityLabelInput = document.createElement("input");
            identityLabelInput.setAttribute("type", "text");
            identityLabelInput.classList.add("identity-list-item-text");            // identity-list-item > identity-list-item-label > identity-list-item-text 
          identityLabelTD.appendChild(identityLabelInput);
        }
      identityTR.appendChild(identityLabelTD);

      // Create IdentityImport ComposeHtml element and add it to the row
      const identityComposeHtmlTD = document.createElement("td");
        identityComposeHtmlTD.classList.add("identity-list-item-data");             // identity-list-item > identity-list-item-data
        identityComposeHtmlTD.classList.add("identity-list-item-composeHtml");      // identity-list-item > identity-list-item-composeHtml
        const identityComposeHtmlInput = document.createElement("input");
          identityComposeHtmlInput.setAttribute("type", "checkbox");
          identityComposeHtmlInput.classList.add("identity-list-item-check");       // identity-list-item > identity-list-item-composeHtml > identity-list-item-check 
        identityComposeHtmlTD.appendChild(identityComposeHtmlInput);
        if (existingIdentityMatch) {
          identityComposeHtmlTD.setAttribute("title", this.#message_listItem_ComposeHtml_tooltip);
          identityComposeHtmlInput.disabled = true;
          identityComposeHtmlInput.checked  = existingIdentityMatch.composeHtml;
        } else {
          identityComposeHtmlTD.setAttribute("title", this.#message_editListItem_ComposeHtml_tooltip);
        }
      identityTR.appendChild(identityComposeHtmlTD);

      // Create IdentityImport ReplyTo element and add it to the row
      const identityReplyToTD = document.createElement("td");
        identityReplyToTD.classList.add("identity-list-item-data");                 // identity-list-item > identity-list-item-data
        identityReplyToTD.classList.add("identity-list-item-replyTo");              // identity-list-item > identity-list-item-replyTo
        if (existingIdentityMatch) {
          identityReplyToTD.setAttribute("title", this.#message_listItem_ReplyTo_tooltip);
          identityReplyToTD.appendChild( document.createTextNode(existingIdentityMatch.replyTo) );
        } else {
          identityReplyToTD.setAttribute("title", this.#message_editListItem_ReplyTo_tooltip);
          const identityReplyToInput = document.createElement("input");
            identityReplyToInput.setAttribute("type", "text");
            identityReplyToInput.classList.add("identity-list-item-text");          // identity-list-item > identity-list-item-replyTo > identity-list-item-text 
          identityReplyToTD.appendChild(identityReplyToInput);
        }
      identityTR.appendChild(identityReplyToTD);

      // Create IdentityImport Org (organization) element and add it to the row
      const identityOrgTD = document.createElement("td");
        identityOrgTD.classList.add("identity-list-item-data");                     // identity-list-item > identity-list-item-data
        identityOrgTD.classList.add("identity-list-item-organization");             // identity-list-item > identity-list-item-organization
        if (existingIdentityMatch) {
          identityOrgTD.setAttribute("title", this.#message_listItem_Org_tooltip);
          identityOrgTD.appendChild( document.createTextNode(existingIdentityMatch.organization) );
        } else {
          identityOrgTD.setAttribute("title", this.#message_editListItem_Org_tooltip);
          const identityOrgInput = document.createElement("input");
            identityOrgInput.setAttribute("type", "text");
            identityOrgInput.classList.add("identity-list-item-text");              // identity-list-item > identity-list-item-organization > identity-list-item-text 
          identityOrgTD.appendChild(identityOrgInput);
        }
      identityTR.appendChild(identityOrgTD);

      // Create IdentityImport Signature element and add it to the row
      const identitySignatureTD = document.createElement("td");
        identitySignatureTD.classList.add("identity-list-item-data");               // identity-list-item > identity-list-item-data
        identitySignatureTD.classList.add("identity-list-item-signature");          // identity-list-item > identity-list-item-signature
        if (existingIdentityMatch) {
          identitySignatureTD.setAttribute("title", this.#message_listItem_Signature_tooltip);
          identitySignatureTD.appendChild( document.createTextNode(existingIdentityMatch.signature) );
        } else {
          identitySignatureTD.setAttribute("title", this.#message_editListItem_Signature_tooltip);
          const identitySignatureInput = document.createElement("input");
            identitySignatureInput.setAttribute("type", "text");
            identitySignatureInput.classList.add("identity-list-item-text");        // identity-list-item > identity-list-item-signature > identity-list-item-text 
//          identitySignatureInput.setAttribute("title", this.#message_editListItem_Signature_tooltip);
          identitySignatureTD.appendChild(identitySignatureInput);
        }
      identityTR.appendChild(identitySignatureTD);

      // Create IdentityImport SigIsHtml (signatureIsHtml) element and add it to the row
      const identitySigIsHtmlTD = document.createElement("td");
        identitySigIsHtmlTD.classList.add("identity-list-item-data");               // identity-list-item > identity-list-item-data
        identitySigIsHtmlTD.classList.add("identity-list-item-signatureIsHtml");    // identity-list-item > identity-list-item-signatureIsHtml
        const identitySigIsHtmlInput = document.createElement("input");
          identitySigIsHtmlInput.setAttribute("type", "checkbox");
          identitySigIsHtmlInput.classList.add("identity-list-item-check");         // identity-list-item > identity-list-item-signatureIsHtml > identity-list-item-check 
        identitySigIsHtmlTD.appendChild(identitySigIsHtmlInput);
        if (existingIdentityMatch) {
          identitySigIsHtmlTD.setAttribute("title", this.#message_listItem_SigIsHtml_tooltip);
//        identitySigIsHtmlInput.setAttribute("title", this.#message_listItem_SigIsHtml_tooltip);
          identitySigIsHtmlInput.disabled = true;
          identitySigIsHtmlInput.checked  = ! existingIdentityMatch.signatureIsPlainText;
        } else {
          identitySigIsHtmlTD.setAttribute("title", this.#message_editListItem_SigIsHtml_tooltip);
//        identitySigIsHtmlInput.setAttribute("title", this.#message_editListItem_SigIsHtml_tooltip);
        }
      identityTR.appendChild(identitySigIsHtmlTD);

    return identityTR;
  }  



  async localizePage() {
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



  async windowUnloading(e) {
    if (this.#DEBUG) this.debugAlways( "--- Window Unloading ---"
                                       + `\n- window.screenTop=${window.screenTop}`
                                       + `\n- window.screenLeft=${window.screenLeft}`
                                       + `\n- window.outerWidth=${window.outerWidth}`
                                       + `\n- window.outerHeight=${window.outerHeight}`
                                       + `\n- this.#canceled=${this.#canceled}`
                                     );
    await this.#idmOptionsApi.storeWindowBounds("identityImporterWindowBounds", window);

    if (this.#DEBUG) {
      let bounds = await this.#idmOptionsApi.getWindowBounds("identityImporterWindowBounds");

      if (! bounds) {
        this.debugAlways("--- WINDOW UNLOADING --- Retrieve Stored Window Bounds --- FAILED TO GET IdentityImport er Window Bounds ---");
      } else if (typeof bounds !== 'object') {
        this.debugAlways(`--- WINDOW UNLOADING --- Retrieve Stored Window Bounds --- IdentityImport er Window Bounds "identityImporterWindowBounds" IS NOT AN OBJECT: typeof='${typeof bounds}' ---`);
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



  async selectFileFilterGlobTextKeyPressed(e) {
    if (e.key === 'Enter') { // we care only about the Enter key
      this.debug(`-- begin -- ENTER KEY PRESSED - target=${e.target}`);
      this.resetErrors();

      let fileNameFilterGlob;

      const fileSelectorFilterGlobBtn     = document.getElementById("idmIdentityImportFileSelectorFilterGlobButton");
      const fileSelectorFilterResetBtn    = document.getElementById("idmIdentityImportFileSelectorFilterResetButton");
      fileSelectorFilterGlobBtn.disabled  = true;
      fileSelectorFilterResetBtn.disabled = true;

      const domFileNameFilterGlobText = e.target;
      fileNameFilterGlob = domFileNameFilterGlobText.value;
      this.debug(`-- fileNameFilterGlob="${fileNameFilterGlob}"`);

      await this.#idmOptionsApi.saveOption('idmIdentityImportFileSelectorFilterGlobText', fileNameFilterGlob);
      await this.showSelectImportFilePanel();

      this.debug("-- end");
    }
  }



  async selectFileFilterGlobTextChanged(e) {
    const fileNameFilterGlob            = e.target.value;
    const fileSelectorFilterGlobBtn     = document.getElementById("idmIdentityImportFileSelectorFilterGlobButton");
    const fileSelectorFilterResetBtn    = document.getElementById("idmIdentityImportFileSelectorFilterResetButton");

    if (fileNameFilterGlob) {
      fileSelectorFilterGlobBtn.disabled  = false;
      fileSelectorFilterResetBtn.disabled = false;
    } else {
      fileSelectorFilterGlobBtn.disabled  = true;
      fileSelectorFilterResetBtn.disabled = true;
    }
  }



  async selectFileFilterGlobButtonClicked(e) {
    this.debug(`-- begin -- e.target.tagName="${e.target.tagName}"`);
    e.preventDefault();
    this.resetErrors();

    const fileSelectorFilterGlobBtn     = document.getElementById("idmIdentityImportFileSelectorFilterGlobButton");
    const fileSelectorFilterResetBtn    = document.getElementById("idmIdentityImportFileSelectorFilterResetButton");
    fileSelectorFilterGlobBtn.disabled  = true;
    fileSelectorFilterResetBtn.disabled = true;

    const domFileNameFilterGlobText = document.getElementById("idmIdentityImportFileSelectorFilterGlobText");
    let   fileNameFilterGlob = domFileNameFilterGlobText.value;
    if (! domFileNameFilterGlobText) {
      this.error("-- failed to get domFileNameFilterGlobText: #idmIdentityImportFileSelectorFilterGlobText");
      this.addToErrorList("idmIdentityImporter_error_domIdFailed", "#idmIdentityImportFileSelectorFilterGlobText");

    } else {
      fileNameFilterGlob = domFileNameFilterGlobText.value;
      this.debug(`-- fileNameFilterGlob="${fileNameFilterGlob}"`);
      if (! fileNameFilterGlob) {
        this.error("-- FileName Filter GLOB Text is empty");
        // Filter Button should be enabled ONLY when idmIdentityImportFileSelectorFilterGlobText is NOT EMPTY
      } else {
        await this.#idmOptionsApi.saveOption('idmIdentityImportFileSelectorFilterGlobText', fileNameFilterGlob);
        await this.showSelectImportFilePanel();
      }
    }

    this.debug("-- end");
  }



  async selectFileFilterResetButtonClicked(e) {
    this.debug(`-- begin -- e.target.tagName="${e.target.tagName}"`);
    e.preventDefault();
    this.resetErrors();

    const fileSelectorFilterGlobBtn     = document.getElementById("idmIdentityImportFileSelectorFilterGlobButton");
    const fileSelectorFilterResetBtn    = document.getElementById("idmIdentityImportFileSelectorFilterResetButton");
    const fileSelectorContinueBtn       = document.getElementById("idmIdentityImportFileControlsContinueButton");
    fileSelectorFilterGlobBtn.disabled  = true;
    fileSelectorFilterResetBtn.disabled = true;
    fileSelectorContinueBtn.disabled    = true;

    const domFileNameFilterGlobText = document.getElementById("idmIdentityImportFileSelectorFilterGlobText");
    if (! domFileNameFilterGlobText) {
      this.error("-- failed to get domFileNameFilterGlobText: #idmIdentityImportFileSelectorFilterGlobText");
      this.addToErrorList("idmIdentityImporter_error_domIdFailed", "#idmIdentityImportFileSelectorFilterGlobText");

    } else {
      domFileNameFilterGlobText.value     = '';

      await this.#idmOptionsApi.saveOption('idmIdentityImportFileSelectorFilterGlobText', '');
      await this.showSelectImportFilePanel();
    }

    this.debug("-- end");
  }



  async selectFileContinueButtonClicked(e) {
    this.debug(`-- e.target.tagName="${e.target.tagName}"`);
    e.preventDefault();
    this.resetErrors();

    const continueBtn = document.getElementById("idmIdentityImportFileControlsContinueButton");
    continueBtn.disabled = true;

    if (! this.#importFileName) {
      this.debug("-- no file selected");
      this.addToErrorList("idmIdentityImportIdentitiesSelector_error_noFileSelected", "filename");
      continueBtn.disabled = false;

    } else {
      this.debug(`-- selected this.#importFileName="${this.#importFileName}"`);

      // hide our own panel
      const domSelectImportFilePanel = document.getElementById("idmIdentityImportFileSelector");
      domSelectImportFilePanel.style.setProperty("display", "none");

      // re-enable the Continue button in case we have to come back to this panel
      continueBtn.disabled = false;

      // show the Criteria Panel
      await this.showSelectImportCriteriaPanel();
    }
  }



  async selectCriteriaContinueButtonClicked(e) {
    this.debug(`-- e.target.tagName="${e.target.tagName}"`);
    e.preventDefault();
    this.resetErrors();

    const continueBtn = document.getElementById("idmIdentityImportCriteriaControlsContinueButton");
    continueBtn.disabled = true;

    let errors = 0;

    const hasHeaderRowCheck   = document.getElementById("idmIdentityImportCriteriaSelectionHasHeaderRowCheck");
    let   hasHeaderRowChecked = false;
    if (! hasHeaderRowCheck) {
      this.error("-- failed to get select: #idmIdentityImportCriteriaSelectionHasHeaderRowCheck");
      this.addToErrorList("idmIdentityImporter_error_domIdFailed", "#idmIdentityImportCriteriaSelectionHasHeaderRowCheck");
      errors++;
    } else {
      hasHeaderRowChecked = hasHeaderRowCheck.checked;
    }

    const emailColNumSelect = document.getElementById("idmIdentityImportCriteriaSelectionEmailColumnSelect");
    let   emailColNumSelectValue;
    if (! emailColNumSelect) {
      this.error("-- failed to get select: #idmIdentityImportCriteriaSelectionEmailColumnSelect");
      this.addToErrorList("idmIdentityImporter_error_domIdFailed", "#idmIdentityImportCriteriaSelectionEmailColumnSelect");
      errors++;
    } else {
      emailColNumSelectValue = emailColNumSelect.value;
    }

    const nameColNumSelect = document.getElementById("idmIdentityImportCriteriaSelectionNameColumnSelect");
    let   nameColNumSelectValue;
    if (! nameColNumSelect) {
      this.error("-- failed to get select: #idmIdentityImportCriteriaSelectionNameColumnSelect");
      this.addToErrorList("idmIdentityImporter_error_domIdFailed", "#idmIdentityImportCriteriaSelectionNameColumnSelect");
      errors++;
    } else {
      nameColNumSelectValue = nameColNumSelect.value;
    }

    this.debug(`-- hasHeaderRow=${this.#hasHeaderRow} emailColNum="${this.#emailColNum}" nameColNum="${this.#nameColNum}"`);

    if (! errors) {
      if (! emailColNumSelectValue) {
        errors++;
        this.debug("-- No Email Address Column Number Selected");
        this.addToErrorList("idmIdentityImportSelectCritera_error_noEmailColNum");
        this.markErrorTD(emailColNumSelect); // MABXXX Can we mark the label as well??
      } else if (nameColNumSelectValue === emailColNumSelectValue) {
        errors++;
        this.debug("-- Email Address and Name Column Numbers are the Same");
        this.addToErrorList("idmIdentityImportSelectCritera_error_sameEmailColNum_NameColNum");
        this.markErrorTD(emailColNumSelect); // MABXXX Can we mark the label as well??
        this.markErrorTD(nameColNumSelect); // MABXXX Can we mark the label as well??
      }
    }

    if (errors) {
      // allow the user to see the message(s) and try again
      continueBtn.disabled = false;

    } else {
      const domSelectImportCriteriaPanel = document.getElementById("idmIdentityImportCriteriaSelector");

      // hide our own panel
      domSelectImportCriteriaPanel.style.setProperty("display", "none");

      // save the criteria for the Identities Panel
      this.#hasHeaderRow = hasHeaderRowChecked;
      this.#emailColNum  = emailColNumSelectValue ? Number(emailColNumSelectValue) : undefined; // should never happen
      this.#nameColNum   = nameColNumSelectValue  ? Number(nameColNumSelectValue)  : undefined;

      // re-enable the Continue button in case we have to come back to this panel
      continueBtn.disabled = false;

      // show the Identities Panel
      await this.showSelectImportIdentitiesPanel();
    }
  }



  // a filename-list-item  (TR or TD) was clicked
  fileNameClicked(e) {
    if (! e) return;

////e.stopPropagation();
////e.stopImmediatePropagation();
////e.preventDefault();

    this.debug(`-- e.target.tagName="${e.target.tagName}"`);

    if (e.target.tagName == "TR" || e.target.tagName == "TD") {
      this.debug("-- TR or TD Clicked");

      const trElement = e.target.closest('tr');
      if (! trElement) {
        this.debug("-- Did NOT get our TR");

      } else {
        this.debug(`-- Got our TR -- filename-list-item? ${trElement.classList.contains("filename-list-item")}`);
        if (! trElement.classList.contains("filename-list-item")) {
          this.debug("-- TR classList does not contain 'filename-list-item'");

        } else {
          const fileName    = trElement.getAttribute("filename");
          const selected    = trElement.classList.contains('selected');
          const continueBtn = document.getElementById("idmIdentityImportFileControlsContinueButton");

          this.debug(`-- selected=${selected}  fileName="${fileName}"`);

          if (! selected) {
            // de-select all
            const domFileNamesList = document.getElementById("idmIdentityImportFileDataList");
            const domFileNameTRs   = domFileNamesList .children;
            for (const domFileNameTR of domFileNameTRs) {
              if (domFileNameTR.classList.contains('selected')) domFileNameTR.classList.remove('selected');
            }

            this.#importFileName = fileName;

            // select the clicked fileName
            trElement.classList.add('selected');
            continueBtn.disabled = false;

          } else {
            trElement.classList.remove('selected');
            continueBtn.disabled = true;
          }
        }
      }
    }
  }



  // an identity-list-item (TR or TD) was clicked
  async identityClicked(e) {
    if (! e) return;

////e.stopPropagation();
////e.stopImmediatePropagation();
////e.preventDefault();

    this.debug(`-- e.target.tagName="${e.target.tagName}"`);

    if (e.target.tagName == "TR" || e.target.tagName == "TD") {
      this.debug("-- TR or TD Clicked");

      const trElement = e.target.closest('tr');
      if (! trElement) {
        this.error("-- Failed to get our TR");

      } else {
        this.debug( "-- Got our TR --"
                    + ` identity-list-item? ${trElement.classList.contains("identity-list-item")}`
                    + ` identity-configured? ${trElement.classList.contains("identity-configured")}`
                  );
        if (! trElement.classList.contains("identity-list-item") || trElement.classList.contains("identity-configured")) {
          this.debug("-- Either the TR does NOT have class 'identity-list-item' or it DOES have class 'identity-configured'");

        } else {
          const identityEmail = trElement.getAttribute("identityEmail");
          const selected      = trElement.classList.contains('selected');

          this.debug(`-- selected=${selected}  identityEmail=$"{identityEmail}"`);

          if (e.shiftKey) {
            // MABXXX maybe we can select multiple items

          } else {
            if (! selected) {
              trElement.classList.add('selected');
              this.#lastSelectedIdentityTR = trElement;
              this.#lastSelectedIdentity   = identityEmail;
            } else {
              trElement.classList.remove('selected');
            }

            this.updateUIForIdentitySelectionChanged();
          }
        }
      }
    }
  }



  updateUIForIdentitySelectionChanged() {
    const selectedIdentityListCount = this.getSelectedDomIdentityListItemCount();
    const importBtn                 = document.getElementById("idmIdentityImportIdentitiesSelectorControlsImportButton");
    const setDataSelectedBtn        = document.getElementById("idmIdentityImportIdentitiesSelectorSetDataSelectedButton");
    const clearDataSelectedBtn      = document.getElementById("idmIdentityImportIdentitiesSelectorClearDataSelectedButton");

    if (selectedIdentityListCount) {
      importBtn.disabled            = false;
      setDataSelectedBtn.disabled   = false;
      clearDataSelectedBtn.disabled = false;
    } else {
      importBtn.disabled            = true;
      setDataSelectedBtn.disabled   = true;
      clearDataSelectedBtn.disabled = true;
    }
  }



  // ignores filtered identities // MABXXX
  getSelectedDomIdentityListItemCount() {
    const domIdentityList   = document.getElementById("idmIdentityImportIdentitiesSelectorIdentityList");
    const identityListItems = domIdentityList.children;

    let count = 0;
    for (const listChildTR of identityListItems) {
      if (    listChildTR.classList.contains('identity-list-item')
           && listChildTR.classList.contains('selected')
           && ! listChildTR.classList.contains('identity-filtered') // MABXXX
         )
      {
        count++;
      }
    }

    return count;
  }



  // ignores filtered identities // MABXXX
  getSelectedDomIdentityListItems() {
    const domIdentityList        = document.getElementById("idmIdentityImportIdentitiesSelectorIdentityList");
    const domIdentityListItemTRs = domIdentityList.children;

    const selectedDomIdentityItemTRs = [];
    for (const listChildTR of domIdentityListItemTRs) {
      if (    listChildTR.classList.contains('identity-list-item')
           && listChildTR.classList.contains('selected')
           && ! listChildTR.classList.contains('identity-filtered') // MABXXX
         )
      {
        selectedDomIdentityItemTRs.push(listChildTR);
      }
    }

    return selectedDomIdentityItemTRs;
  }



  getAllDomIdentityListItems() {
    const domIdentityList        = document.getElementById("idmIdentityImportIdentitiesSelectorIdentityList"); // <TABLE>
    const domIdentityListItemTRs = [];
    for (const listChildTR of domIdentityList.children) {
      if (listChildTR.classList.contains('identity-list-item')) domIdentityListItemTRs.push(listChildTR);
    }
    return domIdentityListItemTRs;
  }



  // MABXXX WHAT ABOUT FILTERS?
  getUnconfiguredDomIdentityListItems() {
    const domIdentityList        = document.getElementById("idmIdentityImportIdentitiesSelectorIdentityList");
    const domIdentityListItemTRs = domIdentityList.children;

    const unconfiguredDomIdentityItemTRs = [];
    for (const listChildTR of domIdentityListItemTRs) {
      if (listChildTR.classList.contains('identity-list-item') && ! listChildTR.classList.contains('identity-configured')) {
        unconfiguredDomIdentityItemTRs.push(listChildTR);
      }
    }

    return unconfiguredDomIdentityItemTRs;
  }



  getConfiguredDomIdentityListItems() {
    const domIdentityList        = document.getElementById("idmIdentityImportIdentitiesSelectorIdentityList");
    const domIdentityListItemTRs = domIdentityList.children;

    const configuredDomIdentityItemTRs = [];
    for (const listChildTR of domIdentityListItemTRs) {
      if (listChildTR.classList.contains('identity-list-item') && listChildTR.classList.contains('identity-configured')) {
        configuredDomIdentityItemTRs.push(listChildTR);
      }
    }

    return configuredDomIdentityItemTRs;
  }



  async selectIdentitiesFilterRegexTextChanged(e) {
    this.resetErrors();

    const identitiesFilterRegex= e.target.value;

    if (identitiesFilterRegex) {
      this.filterIdentities(e, identitiesFilterRegex);
    } else {
      this.unfilterIdentities(e);
    }
  }

  filterIdentities(e, filterRegex) {
    this.debug("-- begin");

    let regex;
    try {
      regex = new RegExp(filterRegex, 'i');
    } catch (error) {
      this.debug(`-- INVALID REGULAR EXPRESSION: filterRegex="${filterRegex}"`);
      this.addToErrorList("idmIdentityImportIdentitiesSelectorFilterRegexText_error_invalid", filterRegex);
      this.markErrorTD(e.target);
    }

    if (! regex) {
      this.unfilterIdentities(e);

    } else {
      let   deselectedIdentityCount = 0;
      const listItemTRs             = this.getAllDomIdentityListItems();
      if (listItemTRs && listItemTRs.length > 0) {
        for (const listItemTR of listItemTRs) {
          const identityEmail = listItemTR.getAttribute("identityEmail");
          if (regex.test(identityEmail)) {
            listItemTR.classList.remove('identity-filtered');
          } else {
            listItemTR.classList.add('identity-filtered');
            if (listItemTR.classList.contains('selected')) {
              listItemTR.classList.remove('selected');
              deselectedIdentityCount++;
            }
          }
        }

        if (deselectedIdentityCount) this.updateUIForIdentitySelectionChanged();
      }
    }

    this.debug("-- end");
  }

  unfilterIdentities(e) {
    this.debug("-- begin");

    const listItemTRs = this.getAllDomIdentityListItems();
    if (listItemTRs && listItemTRs.length > 0) {
      for (const listItemTR of listItemTRs) {
        listItemTR.classList.remove('identity-filtered');
      }
    }

    this.debug("-- end");
  }



  async selectIdentitiesFilterRegexTextKeyPressed(e) { // we're not operating on enter key -- yet
  }
    


  async selectIdentitiesFilterRegexResetButtonClicked(e) {
    e.preventDefault();

    const identitiesSelectorFilterRegexText = document.getElementById("idmIdentityImportIdentitiesSelectorFilterRegexText");
    identitiesSelectorFilterRegexText.value = '';

    this.unfilterIdentities(e);
  }



  async selectAllIdentitiesButtonClicked(e) {
    this.debug(`-- begin - e.target.tagName="${e.target.tagName}"`);
    e.preventDefault();

    const identitiesSelectorImportBtn            = document.getElementById("idmIdentityImportIdentitiesSelectorControlsImportButton");
    const identitiesSelectorSetDataSelectedBtn   = document.getElementById("idmIdentityImportIdentitiesSelectorSetDataSelectedButton");
    const identitiesSelectorClearDataSelectedBtn = document.getElementById("idmIdentityImportIdentitiesSelectorClearDataSelectedButton");

    identitiesSelectorImportBtn.disabled = true;

    // MABXXX WHAT ABOUT FILTERS?
    const listItemTRs = this.getUnconfiguredDomIdentityListItems();
    if (listItemTRs && listItemTRs.length > 0) {
      for (const listItemTR of listItemTRs) {
        if (! listItemTR.classList.contains('selected')) listItemTR.classList.add('selected');
      }
      // enable import button and other buttons that require at least one identity to be selected
      identitiesSelectorImportBtn.disabled            = false;
      identitiesSelectorSetDataSelectedBtn.disabled   = false;
      identitiesSelectorClearDataSelectedBtn.disabled = false;
    } else {
      identitiesSelectorImportBtn.disabled            = true;
      identitiesSelectorSetDataSelectedBtn.disabled   = true;
      identitiesSelectorClearDataSelectedBtn.disabled = true;
    }

    this.debug("-- end");
  }



  async deselectAllIdentitiesButtonClicked(e) {
    this.debug(`-- begin - e.target.tagName="${e.target.tagName}"`);
    e.preventDefault();

    const identitiesSelectorImportBtn            = document.getElementById("idmIdentityImportIdentitiesSelectorControlsImportButton");
    const identitiesSelectorSetDataSelectedBtn   = document.getElementById("idmIdentityImportIdentitiesSelectorSetDataSelectedButton");
    const identitiesSelectorClearDataSelectedBtn = document.getElementById("idmIdentityImportIdentitiesSelectorClearDataSelectedButton");

    identitiesSelectorImportBtn.disabled            = true;
    identitiesSelectorSetDataSelectedBtn.disabled   = true;
    identitiesSelectorClearDataSelectedBtn.disabled = true;

    const listItemTRs = this.getUnconfiguredDomIdentityListItems();
    for (const listItemTR of listItemTRs) {
      listItemTR.classList.remove('selected');
    }

    this.debug("-- end");
  }



  async keepComposeHtmlCheckClicked(e) {
    this.debug("-- begin");

    const domSetDataComposeHtmlInputCheck      = document.getElementById("idmIdentityImportIdentitiesSelector_actionsSetData_ComposeHtml.check");
    const domSetDataComposeHtmlInputCheckLabel = document.getElementById("idmIdentityImportIdentitiesSelector_actionsSetData_ComposeHtmlCheck.label");

    if (e.target.checked) {
      domSetDataComposeHtmlInputCheck.style.visibility      = 'hidden';  // set visibility to hidden as well
      domSetDataComposeHtmlInputCheckLabel.style.visibility = 'hidden';  // set label visibility to hidden as well
      domSetDataComposeHtmlInputCheck.disabled              = true;
      domSetDataComposeHtmlInputCheck.checked               = false; // MABXXX do we really want to do this?
    } else {
      domSetDataComposeHtmlInputCheck.disabled              = false;
      domSetDataComposeHtmlInputCheck.style.visibility      = 'visible';  // set visibility to visible as well
      domSetDataComposeHtmlInputCheckLabel.style.visibility = 'visible';  // set label visibility to visible as well
    }

    this.debug("-- end");
  }



  async keepSigIsHtmlCheckClicked(e) {
    this.debug("-- begin");

    const domSetDataSigIsHtmlInputCheck      = document.getElementById("idmIdentityImportIdentitiesSelector_actionsSetData_SigIsHtml.check");
    const domSetDataSigIsHtmlInputCheckLabel = document.getElementById("idmIdentityImportIdentitiesSelector_actionsSetData_SigIsHtmlCheck.label");

    if (e.target.checked) {
      domSetDataSigIsHtmlInputCheck.style.visibility      = 'hidden';  // set visibility to hidden as well
      domSetDataSigIsHtmlInputCheckLabel.style.visibility = 'hidden';  // set label visibility to hidden as well
      domSetDataSigIsHtmlInputCheck.disabled              = true;
      domSetDataSigIsHtmlInputCheck.checked               = false; // MABXXX do we really want to do this?
    } else {
      domSetDataSigIsHtmlInputCheck.disabled              = false;
      domSetDataSigIsHtmlInputCheck.style.visibility      = 'visible';  // set visibility to visible as well
      domSetDataSigIsHtmlInputCheckLabel.style.visibility = 'visible';  // set label visibility to visible as well
    }

    this.debug("-- end");
  }



  identitiesSelectorActionsDataResetButtonClicked(e) {
    this.debug("-- begin");
    e.preventDefault();

    let domErrors = 0;

    const domSetDataAccountSelect             = document.getElementById("idmIdentityImportIdentitiesSelector_actionsSetData_Account.select");
    const domSetDataNameInputText             = document.getElementById("idmIdentityImportIdentitiesSelector_actionsSetData_Name.text");
    const domSetDataLabelInputText            = document.getElementById("idmIdentityImportIdentitiesSelector_actionsSetData_Label.text");
    const domSetDataReplyToInputText          = document.getElementById("idmIdentityImportIdentitiesSelector_actionsSetData_ReplyTo.text");
    const domSetDataOrgInputText              = document.getElementById("idmIdentityImportIdentitiesSelector_actionsSetData_Organization.text");
    const domSetDataKeepComposeHtmlInputCheck = document.getElementById("idmIdentityImportIdentitiesSelector_actionsSetData_KeepComposeHtml.check");
    const domSetDataComposeHtmlInputCheck     = document.getElementById("idmIdentityImportIdentitiesSelector_actionsSetData_ComposeHtml.check");
    const domSetDataSignatureInputText        = document.getElementById("idmIdentityImportIdentitiesSelector_actionsSetData_Signature.text");
    const domSetDataKeepSigIsHtmlInputCheck   = document.getElementById("idmIdentityImportIdentitiesSelector_actionsSetData_KeepSigIsHtml.check");
    const domSetDataSigIsHtmlInputCheck       = document.getElementById("idmIdentityImportIdentitiesSelector_actionsSetData_SigIsHtml.check");

    if (! domSetDataAccountSelect) {
      domErrors++;
      this.error("-- Failed to get DOM Select Element for new Account ID value");
    } else {
      domSetDataAccountSelect.value = "";
    }

    if (! domSetDataNameInputText) {
      domErrors++;
      this.error("-- Failed to get DOM Input Text Element for new Name value");
    } else {
      domSetDataNameInputText.value = "";
    }

    if (! domSetDataLabelInputText) {
      domErrors++;
      this.error("-- Failed to get DOM Input Text Element for new Label value");
    } else {
      domSetDataLabelInputText.value = "";
    }

    if (! domSetDataReplyToInputText) {
      domErrors++;
      this.error("-- Failed to get DOM Input Text Element for new Reply To value");
    } else {
      domSetDataReplyToInputText.value = "";
    }

    if (! domSetDataOrgInputText) {
      domErrors++;
      this.error("-- Failed to get DOM Input Text Element for new Organization value");
    } else {
      domSetDataOrgInputText.value = "";
    }

    if (! domSetDataKeepComposeHtmlInputCheck) {
      domErrors++;
      this.error("-- Failed to get DOM Checkbox Element for Keep Compose HTML value");
    } else {
      domSetDataKeepComposeHtmlInputCheck.checked = false;
    }

    if (! domSetDataComposeHtmlInputCheck) {
      domErrors++;
      this.error("-- Failed to get DOM Checkbox Element for new Compose HTML value");
    } else {
      domSetDataComposeHtmlInputCheck.checked          = false;
      domSetDataComposeHtmlInputCheck.disabled         = false;
      domSetDataComposeHtmlInputCheck.style.visibility = 'visible';  // set visibility to visible as well
    }

    if (! domSetDataSignatureInputText) {
      domErrors++;
      this.error("-- Failed to get DOM Input Text Element for new Signature value");
    } else {
      domSetDataSignatureInputText.value = "";
    }

    if (! domSetDataKeepSigIsHtmlInputCheck) {
      domErrors++;
      this.error("-- Failed to get DOM Checkbox Element for Keep Signature Is HTML value");
    } else {
      domSetDataKeepSigIsHtmlInputCheck.checked = false;
    }

    if (! domSetDataSigIsHtmlInputCheck) {
      domErrors++;
      this.error("-- Failed to get DOM Checkbox Element for new Signature Is HTML value");
    } else {
      domSetDataSigIsHtmlInputCheck.checked          = false;
      domSetDataSigIsHtmlInputCheck.disabled         = false;
      domSetDataSigIsHtmlInputCheck.style.visibility = 'visible';  // set visibility to visible as well
    }

    if (domErrors) {
      this.error(`-- Failed to get ${domErrors} DOM Elements - Cannot Reset some of the Data`);
      this.addToErrorList("idmIdentityImporter_error_domIdFailed");
    }

    this.debug("-- end");
  }



  async setDataAllIdentitiesButtonClicked(e) {
    this.debug("-- begin");
    // MABXXX WHAT ABOUT FILTERS?
    const domIdentityItemTRs = this.getUnconfiguredDomIdentityListItems();
    // MABXXX Should test domIdentityItemTRs - All Identities already exist (configured)
    await this.setIdentitiesListData(e, domIdentityItemTRs);
    this.debug("--end");
  }

  async setDataSelectedIdentitiesButtonClicked(e) {
    this.debug("-- begin");
    const domIdentityItemTRs = this.getSelectedDomIdentityListItems();
    // MABXXX Should test domIdentityItemTRs - No Identities are selected - should never happen - button should not be enabled
    await this.setIdentitiesListData(e, domIdentityItemTRs);
    this.debug("--end");
  }

  async setIdentitiesListData(e, domIdentityItemTRs) {
    this.debug("-- begin");
    e.preventDefault();
    this.resetErrors();

    let domErrors = 0;

    // MABXXX Move this into the constructor
    const identityAccountSelectSelector         = ".identity-list-item-account > .identity-list-item-select";
    const identityNameInputTextSelector         = ".identity-list-item-name > .identity-list-item-text";
    const identityLabelInputTextSelector        = ".identity-list-item-label > .identity-list-item-text";
    const identityReplyToInputTextSelector      = ".identity-list-item-replyTo > .identity-list-item-text";
    const identityOrgInputTextSelector          = ".identity-list-item-organization > .identity-list-item-text";
    const identityComposeHtmlInputCheckSelector = ".identity-list-item-composeHtml > .identity-list-item-check";
    const identitySignatureInputTextSelector    = ".identity-list-item-signature > .identity-list-item-text";
    const identitySigIsHtmlInputCheckSelector   = ".identity-list-item-signatureIsHtml > .identity-list-item-check";

    // MABXXX Move ID's into the constructor???
    const domSetDataAccountSelect             = document.getElementById("idmIdentityImportIdentitiesSelector_actionsSetData_Account.select");
    const domSetDataNameInputText             = document.getElementById("idmIdentityImportIdentitiesSelector_actionsSetData_Name.text");
    const domSetDataLabelInputText            = document.getElementById("idmIdentityImportIdentitiesSelector_actionsSetData_Label.text");
    const domSetDataReplyToInputText          = document.getElementById("idmIdentityImportIdentitiesSelector_actionsSetData_ReplyTo.text");
    const domSetDataOrgInputText              = document.getElementById("idmIdentityImportIdentitiesSelector_actionsSetData_Organization.text");
    const domSetDataKeepComposeHtmlInputCheck = document.getElementById("idmIdentityImportIdentitiesSelector_actionsSetData_KeepComposeHtml.check");
    const domSetDataComposeHtmlInputCheck     = document.getElementById("idmIdentityImportIdentitiesSelector_actionsSetData_ComposeHtml.check");
    const domSetDataSignatureInputText        = document.getElementById("idmIdentityImportIdentitiesSelector_actionsSetData_Signature.text");
    const domSetDataKeepSigIsHtmlInputCheck   = document.getElementById("idmIdentityImportIdentitiesSelector_actionsSetData_KeepSigIsHtml.check");
    const domSetDataSigIsHtmlInputCheck       = document.getElementById("idmIdentityImportIdentitiesSelector_actionsSetData_SigIsHtml.check");

    let newAccountId;
    if (! domSetDataAccountSelect) {
      domErrors++;
      this.error("-- Failed to get DOM Select Element for new Account ID value");
    } else {
      newAccountId = domSetDataAccountSelect.value;
    }

    let newName;
    if (! domSetDataNameInputText) {
      domErrors++;
      this.error("-- Failed to get DOM Input Text Element for new Name value");
    } else {
      newName = domSetDataNameInputText.value;
    }

    let newLabel;
    let newLabelIsUseEmailUsernameDomainCmd = false;
    if (! domSetDataLabelInputText) {
      domErrors++;
      this.error("-- Failed to get DOM Input Text Element for new Label value");
    } else {
      newLabel = domSetDataLabelInputText.value;
      if (newLabel === "##") newLabelIsUseEmailUsernameDomainCmd = true; // MABXXX easier for now, but later maybe allow user to specify RegExp and Subst
    }

    let newReplyTo;
    if (! domSetDataReplyToInputText) {
      domErrors++;
      this.error("-- Failed to get DOM Input Text Element for new Reply To value");
    } else {
      newReplyTo = domSetDataReplyToInputText.value;
    }

    let newOrg;
    if (! domSetDataOrgInputText) {
      domErrors++;
      this.error("-- Failed to get DOM Input Text Element for new Organization value");
    } else {
      newOrg = domSetDataOrgInputText.value;
    }

    let keepComposeHtml;
    if (! domSetDataKeepComposeHtmlInputCheck) {
      domErrors++;
      this.error("-- Failed to get DOM Checkbox Element for Keep Compose HTML value");
    } else {
      keepComposeHtml = domSetDataKeepComposeHtmlInputCheck.checked;
    }

    let newComposeHtml;
    if (! keepComposeHtml) {
      if (! domSetDataComposeHtmlInputCheck) {
        domErrors++;
        this.error("-- Failed to get DOM Checkbox Element for new Compose HTML value");
      } else {
        newComposeHtml = domSetDataComposeHtmlInputCheck.checked;
      }
    }

    let newSignature;
    if (! domSetDataSignatureInputText) {
      domErrors++;
      this.error("-- Failed to get DOM Input Text Element for new Signature value");
    } else {
      newSignature = domSetDataSignatureInputText.value;
    }

    let keepSigIsHtml;
    if (! domSetDataKeepSigIsHtmlInputCheck) {
      domErrors++;
      this.error("-- Failed to get DOM Checkbox Element for Keep Signature Is HTML value");
    } else {
      keepSigIsHtml = domSetDataKeepSigIsHtmlInputCheck.checked;
    }

    let newSigIsHtml;
    if (! keepSigIsHtml) {
      if (! domSetDataSigIsHtmlInputCheck) {
        domErrors++;
        this.error("-- Failed to get DOM Checkbox Element for new Signature Is HTML value");
      } else {
        newSigIsHtml = domSetDataSigIsHtmlInputCheck.checked;
      }
    }

    if (domErrors) {
      this.error(`-- Failed to get ${domErrors} DOM Elements for new values - Cannot set new Data`);
      this.addToErrorList("idmIdentityImporter_error_domIdFailed");

    } else {
      for (const domIdentityItemTR of domIdentityItemTRs) {
        const identityEmail = domIdentityItemTR.getAttribute("identityEmail");

        const domIdentityAccountSelectElement = domIdentityItemTR.querySelector(identityAccountSelectSelector);
        if (! domIdentityAccountSelectElement) {
          domErrors++;
          this.error(`-- Failed to get DOM Select Element for Identity Account - identityEmail="${identityEmail}"`);
        } else if (newAccountId) {
          domIdentityAccountSelectElement.value = newAccountId;
        }

        const domIdentityNameInputTextElement = domIdentityItemTR.querySelector(identityNameInputTextSelector);
        if (! domIdentityNameInputTextElement) {
          domErrors++;
          this.error(`-- Failed to get DOM Input Text Element for Identity Name - identityEmail="${identityEmail}"`);
        } else if (newName) {
          domIdentityNameInputTextElement.value = newName;
        }

        const domIdentityLabelInputTextElement = domIdentityItemTR.querySelector(identityLabelInputTextSelector);
        if (! domIdentityLabelInputTextElement) {
          domErrors++;
          errors++;
          this.error(`-- Failed to get DOM Input Text Element for Identity Label - identityEmail="${identityEmail}"`);

        } else if (newLabelIsUseEmailUsernameDomainCmd) {
          // MABXXX If the user enters '##' for the new Identity Label, substitute the Domain from the User Name from the Identity Email Address
          // MABXXX This is easier for now, but later maybe allow user to specify RegExp and Subst
          this.#regexForUseIdentityEmailUsernameDomainForNewLabelCmd.lastIndex = 0;
          if (! this.#regexForUseIdentityEmailUsernameDomainForNewLabelCmd.test(identityEmail)) {
            this.debug( "## newLabelIsUseEmailUsernameDomainCmd ##"
                        + `\n- REGEX "${this.#regexForUseIdentityEmailUsernameDomainForNewLabelCmd.source}"`
                        + `\n- DOES NOT MATCH identityEmail="${identityEmail}""`
                      );
          } else {
            this.#regexForUseIdentityEmailUsernameDomainForNewLabelCmd.lastIndex = 0;
            newLabel = identityEmail.replace(this.#regexForUseIdentityEmailUsernameDomainForNewLabelCmd, this.#substForUseIdentityEmailUsernameDomainForNewLabelCmd);
            this.debug( "## newLabelIsUseEmailUsernameDomainCmd ##"
                        + `\n- REGEX "${this.#regexForUseIdentityEmailUsernameDomainForNewLabelCmd.source}"`
                        + `\n- MATCHES identityEmail="${identityEmail}" newLabel="${newLabel}"`
                      );
            domIdentityLabelInputTextElement.value = newLabel;
          }
        } else if (newLabel) {
          domIdentityLabelInputTextElement.value = newLabel;
        }

        const domIdentityReplyToInputTextElement = domIdentityItemTR.querySelector(identityReplyToInputTextSelector);
        if (! domIdentityReplyToInputTextElement) {
          domErrors++;
          this.error(`-- Failed to get DOM Input Text Element for Identity ReplyTo - identityEmail="${identityEmail}"`);
        } else if (newReplyTo) {
          domIdentityReplyToInputTextElement.value = newReplyTo;
        }

        const domIdentityOrgInputTextElement = domIdentityItemTR.querySelector(identityOrgInputTextSelector);
        if (! domIdentityOrgInputTextElement) {
          domErrors++;
          this.error(`-- Failed to get DOM Input Text Element for Identity Organization - identityEmail="${identityEmail}"`);
        } else if (newOrg) {
          domIdentityOrgInputTextElement.value = newOrg;
        }

        if (! keepComposeHtml) {
          const domIdentityComposeHtmlInputCheckElement = domIdentityItemTR.querySelector(identityComposeHtmlInputCheckSelector);
          if (! domIdentityComposeHtmlInputCheckElement) {
            domErrors++;
            this.error(`-- Failed to get DOM Input Check Element for Identity ComposeHtml - identityEmail="${identityEmail}"`);
          } else /* if (???) */ {
            domIdentityComposeHtmlInputCheckElement.checked = newComposeHtml;
          }
        }

        const domIdentitySignatureInputTextElement = domIdentityItemTR.querySelector(identitySignatureInputTextSelector);
        if (! domIdentitySignatureInputTextElement) {
          domErrors++;
          this.error(`-- Failed to get DOM Input Text Element for Identity Signature - identityEmail="${identityEmail}"`);
        } else if (newSignature) {
          domIdentitySignatureInputTextElement.value = newSignature;
        }

        if (! keepSigIsHtml) {
          const domIdentitySigIsHtmlInputCheckElement = domIdentityItemTR.querySelector(identitySigIsHtmlInputCheckSelector);
          if (! domIdentitySigIsHtmlInputCheckElement) {
            domErrors++;
            this.error(`-- Failed to get DOM Input Check Element for Identity SignatureIsHtml - identityEmail="${identityEmail}"`);
          } else /* if (???) */ {
            domIdentitySigIsHtmlInputCheckElement.checked = newSigIsHtml;
          }
        }
      }

      if (domErrors) {
        this.error(`-- Failed to get ${domErrors} DOM Elements - Cannot set data for all Identities`);
        this.addToErrorList("idmIdentityImporter_error_domIdFailed");
      }
    }

    this.debug("-- end");
  }




  async clearDataAllIdentitiesButtonClicked(e) {
    this.debug("-- begin");
    // MABXXX WHAT ABOUT FILTERS?
    const domIdentityItemTRs = this.getUnconfiguredDomIdentityListItems();
    // MABXXX Should test domIdentityItemTRs - All Identities already exist (configured)
    await this.clearIdentitiesListData(e, domIdentityItemTRs);
    this.debug("-- end");
  }

  async clearDataSelectedIdentitiesButtonClicked(e) {
    this.debug("-- begin");
    const domIdentityItemTRs = this.getSelectedDomIdentityListItems();
    // MABXXX Should test domIdentityItemTRs - No Identities are selected - should never happen - button should not be enabled
    await this.clearIdentitiesListData(e, domIdentityItemTRs);
    this.debug("-- end");
  }

  async clearIdentitiesListData(e, domIdentityItemTRs) {
    this.debug("-- begin");
    e.preventDefault();
    this.resetErrors();

    // MABXXX Move this into the constructor
    const identityAccountSelectSelector         = ".identity-list-item-account > .identity-list-item-select";
    const identityNameInputTextSelector         = ".identity-list-item-name > .identity-list-item-text";
    const identityLabelInputTextSelector        = ".identity-list-item-label > .identity-list-item-text";
    const identityReplyToInputTextSelector      = ".identity-list-item-replyTo > .identity-list-item-text";
    const identityOrgInputTextSelector          = ".identity-list-item-organization > .identity-list-item-text";
    const identityComposeHtmlInputCheckSelector = ".identity-list-item-composeHtml > .identity-list-item-check";
    const identitySignatureInputTextSelector    = ".identity-list-item-signature > .identity-list-item-text";
    const identitySigIsHtmlInputCheckSelector   = ".identity-list-item-signatureIsHtml > .identity-list-item-check";

    let domErrors = 0;
    for (const domIdentityItemTR of domIdentityItemTRs) {
      // classList must contain 'identity-list-item' and must not contain 'identity-configured', but then getUnconfiguredDomIdentityListItems() should never return these

      const identityEmail = domIdentityItemTR.getAttribute("identityEmail");

      const domIdentityAccountSelectElement = domIdentityItemTR.querySelector(identityAccountSelectSelector);
      if (! domIdentityAccountSelectElement) {
        domErrors++;
        this.error(`-- Failed to get DOM Select Element for Identity Account - identityEmail="${identityEmail}"`);
      } else {
        domIdentityAccountSelectElement.value = "";
      }

      const domIdentityNameInputTextElement = domIdentityItemTR.querySelector(identityNameInputTextSelector);
      if (! domIdentityNameInputTextElement) {
        domErrors++;
        this.error(`-- Failed to get DOM Input Text Element for Identity Name - identityEmail="${identityEmail}"`);
      } else {
        domIdentityNameInputTextElement.value = "";
      }

      const domIdentityLabelInputTextElement = domIdentityItemTR.querySelector(identityLabelInputTextSelector);
      if (! domIdentityLabelInputTextElement) {
        domErrors++;
        this.error(`-- Failed to get DOM Input Text Element for Identity Label - identityEmail="${identityEmail}"`);
      } else {
        domIdentityLabelInputTextElement.value = "";
      }

      const domIdentityReplyToInputTextElement = domIdentityItemTR.querySelector(identityReplyToInputTextSelector);
      if (! domIdentityReplyToInputTextElement) {
        domErrors++;
        this.error(`-- Failed to get DOM Input Text Element for Identity ReplyTo - identityEmail="${identityEmail}"`);
      } else {
        domIdentityReplyToInputTextElement.value = "";
      }

      const domIdentityOrgInputTextElement = domIdentityItemTR.querySelector(identityOrgInputTextSelector);
      if (! domIdentityOrgInputTextElement) {
        domErrors++;
        this.error(`-- Failed to get DOM Input Text Element for Identity Organization - identityEmail="${identityEmail}"`);
      } else {
        domIdentityOrgInputTextElement.value = "";
      }

      const domIdentityComposeHtmlInputCheckElement = domIdentityItemTR.querySelector(identityComposeHtmlInputCheckSelector);
      if (! domIdentityComposeHtmlInputCheckElement) {
        domErrors++;
        this.error(`-- Failed to get DOM Input Check Element for Identity ComposeHtml - identityEmail="${identityEmail}"`);
      } else {
        domIdentityComposeHtmlInputCheckElement.checked = false;
      }

      const domIdentitySignatureInputTextElement = domIdentityItemTR.querySelector(identitySignatureInputTextSelector);
      if (! domIdentitySignatureInputTextElement) {
        domErrors++;
        this.error(`-- Failed to get DOM Input Text Element for Identity Signature - identityEmail="${identityEmail}"`);
      } else {
        domIdentitySignatureInputTextElement.value = "";
      }

      const domIdentitySigIsHtmlInputCheckElement = domIdentityItemTR.querySelector(identitySigIsHtmlInputCheckSelector);
      if (! domIdentitySigIsHtmlInputCheckElement) {
        domErrors++;
        this.error(`-- Failed to get DOM Input Check Element for Identity SignatureIsHtml - identityEmail="${identityEmail}"`);
      } else {
        domIdentitySigIsHtmlInputCheckElement.checked = false;
      }
    }

    if (domErrors) {
      // MABXXX What to do about domErrors???
    }

    this.debug("-- end");
  }



  async selectIdentitiesImportButtonClicked(e) {
    this.debug(`-- begin - e.target.tagName="${e.target.tagName}"`);
    e.preventDefault();
    this.resetErrors();

    const importBtn = document.getElementById("idmIdentityImportIdentitiesSelectorControlsImportButton");
    importBtn.disabled = true;

    let identitiesSelectedCount = 0;
    let errors = 0;

    // MABXXX WHAT ABOUT FILTERS?
    const domSelectedIdentityItemTRs = this.getSelectedDomIdentityListItems();

    if (! domSelectedIdentityItemTRs || ! domSelectedIdentityItemTRs.length) {
      errors++;
      this.error("-- NO EXTENSIONS SELECTED -- Import Button should have been disabled!!!");

    } else {
      identitiesSelectedCount = domSelectedIdentityItemTRs.length;

      // MABXXX Move this into the constructor
      const identityAccountSelectSelector         = ".identity-list-item-account > .identity-list-item-select";
      const identityNameInputTextSelector         = ".identity-list-item-name > .identity-list-item-text";
      const identityLabelInputTextSelector        = ".identity-list-item-label > .identity-list-item-text";
      const identityReplyToInputTextSelector      = ".identity-list-item-replyTo > .identity-list-item-text";
      const identityOrgInputTextSelector          = ".identity-list-item-organization > .identity-list-item-text";
      const identityComposeHtmlInputCheckSelector = ".identity-list-item-composeHtml > .identity-list-item-check";
      const identitySignatureInputTextSelector    = ".identity-list-item-signature > .identity-list-item-text";
      const identitySigIsHtmlInputCheckSelector   = ".identity-list-item-signatureIsHtml > .identity-list-item-check";

      let domErrors     = 0;
      let accountErrors = 0;
      let nameErrors    = 0;

      const identitiesToCreate = [];

      for (const domIdentityItemTR of domSelectedIdentityItemTRs) {
        this.debug(`-- domIdentityItemTR=${domIdentityItemTR} domIdentityItemTR.tagName="${domIdentityItemTR.tagName}"`);

        if (domIdentityItemTR.classList.contains("identity-configured")) { // should never happen because should not be selectable
          this.error(`-- Selected Identity is already congifured: newIdentityEmail="${newIdentityEmail}"`);
          continue;
        }

        let error = false;

        const newIdentityEmail = domIdentityItemTR.getAttribute("identityEmail");

        let newIdentityAccountId       = undefined;
        let newIdentityName            = undefined;
        let newIdentityLabel           = "";
        let newIdentityReplyTo         = "";
        let newIdentityOrganization    = "";
        let newIdentityComposeHtml     = false;
        let newIdentitySignature       = "";
        let newIdentitySignatureIsHtml = false;

        const domIdentityAccountSelectElement = domIdentityItemTR.querySelector(identityAccountSelectSelector);
        if (! domIdentityAccountSelectElement) {
          error = true;
          domErrors++;
          errors++;
          this.error(`-- Failed to get DOM Select Element for Identity Account - newIdentityEmail="${newIdentityEmail}"`);
        } else {
          newIdentityAccountId = domIdentityAccountSelectElement.value;
          if (! newIdentityAccountId) {
            error = true;
            accountErrors++;
            errors++;
            this.debug(`-- No Input Select Value for Identity AccountId - newIdentityEmail="${newIdentityEmail}"`);
            // add a class to the dom to mark the error - to the TR?  The TD? The SELECT???
            this.markErrorTD(domIdentityAccountSelectElement);
          }
        }

        const domIdentityNameInputTextElement = domIdentityItemTR.querySelector(identityNameInputTextSelector);
        if (! domIdentityNameInputTextElement) {
          error = true;
          domErrors++;
          errors++;
          this.error(`-- Failed to get DOM Input Text Element for Identity Name - newIdentityEmail="${newIdentityEmail}"`);
        } else {
          newIdentityName = domIdentityNameInputTextElement.value;
          if (! newIdentityName) {
            error = true;
            nameErrors++;
            errors++;
            this.debug(`-- No Input Text Value for Identity Name - newIdentityEmail="${newIdentityEmail}"`);
            // add a class to the dom to mark the error - to the TR?  The TD? The INPUT???
            this.markErrorTD(domIdentityNameInputTextElement);
          }
        }

        const domIdentityLabelInputTextElement = domIdentityItemTR.querySelector(identityLabelInputTextSelector);
        if (! domIdentityLabelInputTextElement) {
          error = true;
          domErrors++;
          errors++;
          this.error(`-- Failed to get DOM Input Text Element for Identity Label - newIdentityEmail="${newIdentityEmail}"`);
        } else {
          newIdentityLabel = domIdentityLabelInputTextElement.value;
        }

        const domIdentityReplyToInputTextElement = domIdentityItemTR.querySelector(identityReplyToInputTextSelector);
        if (! domIdentityReplyToInputTextElement) {
          error = true;
          domErrors++;
          errors++;
          this.error(`-- Failed to get DOM Input Text Element for Identity ReplyTo - newIdentityEmail="${newIdentityEmail}"`);
        } else {
          newIdentityReplyTo = domIdentityReplyToInputTextElement.value;
        }

        const domIdentityOrgInputTextElement = domIdentityItemTR.querySelector(identityOrgInputTextSelector);
        if (! domIdentityOrgInputTextElement) {
          error = true;
          domErrors++;
          errors++;
          this.error(`-- Failed to get DOM Input Text Element for Identity Organization - newIdentityEmail="${newIdentityEmail}"`);
        } else {
          newIdentityOrganization = domIdentityOrgInputTextElement.value;
        }

        const domIdentityComposeHtmlInputCheckElement = domIdentityItemTR.querySelector(identityComposeHtmlInputCheckSelector);
        if (! domIdentityComposeHtmlInputCheckElement) {
          error = true;
          domErrors++;
          errors++;
          this.error(`-- Failed to get DOM Input Check Element for Identity ComposeHtml - newIdentityEmail="${newIdentityEmail}"`);
        } else {
          newIdentityComposeHtml = domIdentityComposeHtmlInputCheckElement.checked;
        }

        const domIdentitySignatureInputTextElement = domIdentityItemTR.querySelector(identitySignatureInputTextSelector);
        if (! domIdentitySignatureInputTextElement) {
          error = true;
          domErrors++;
          errors++;
          this.error(`-- Failed to get DOM Input Text Element for Identity Signature - newIdentityEmail="${newIdentityEmail}"`);
        } else {
          newIdentitySignature = domIdentitySignatureInputTextElement.value;
        }

        const domIdentitySigIsHtmlInputCheckElement = domIdentityItemTR.querySelector(identitySigIsHtmlInputCheckSelector);
        if (! domIdentitySigIsHtmlInputCheckElement) {
          error = true;
          domErrors++;
          errors++;
          this.error(`-- Failed to get DOM Input Check Element for Identity SignatureIsHtml - newIdentityEmail="${newIdentityEmail}"`);
        } else {
          newIdentitySignatureIsHtml = domIdentitySigIsHtmlInputCheckElement.checked;
        }

        if (error) {
          // MABXXX AND DO WHAT??? enabled-disable "Import" Button???

        } else {
          const newIdentity = {
            'accountId':            newIdentityAccountId,
            'email':                newIdentityEmail,
            'name':                 newIdentityName,
            'label':                newIdentityLabel,
            'replyTo':              newIdentityReplyTo,
            'organization':         newIdentityOrganization,
            'composeHtml':          newIdentityComposeHtml,
            'signature':            newIdentitySignature,
            'signatureIsPlainText': ! newIdentitySignatureIsHtml
          };

          this.debug( "-- NEW IDENTITY:"
                      + `\n- newIdentity.accountId .............. "${newIdentity.accountId}"`
                      + `\n- newIdentity.email .................. "${newIdentity.email}"`
                      + `\n- newIdentity.name ................... "${newIdentity.name}"`
                      + `\n- newIdentity.label .................. "${newIdentity.label}"`
                      + `\n- newIdentity.replyTo ................ "${newIdentity.replyTo}"`
                      + `\n- newIdentity.organization ........... "${newIdentity.organization}"`
                      + `\n- newIdentity.composeHtml ............ ${newIdentity.composeHtml}`
                      + `\n- newIdentity.signature .............. "${newIdentity.signature}"`
                      + `\n- newIdentity.signatureIsPlainText ... ${newIdentity.signatureIsPlainText}`
                    );

          identitiesToCreate.push(newIdentity);
        }
      }

      if (domErrors) {
        this.error(`-- FAILED TO FIND ELEMENTS IN THE DOM: domeErrors=${domErrors}`);
        this.addToErrorList("idmIdentityImporter_error_domSelectorFailed"); // FAILED TO FIND ELEMENT(S) IN THE DOM
      }
      if (accountErrors) {
        this.debug(`-- USER FAILED TO SELECT ACCOUNTS FOR NEW IDENTITIES: accountErrors=${accountErrors}`);
        this.addToErrorList("idmIdentityImportIdentitiesSelector_error_noAccountSelected"); // ALL IDENTITIES MUST HAVE AN ACCOUNT ID
      }
      if (nameErrors) {
        this.debug(`-- USER FAILED TO ENTER NAME FOR NEW IDENTITIES: nameErrors=${nameErrors}`);
        this.addToErrorList("idmIdentityImportIdentitiesSelector_error_noNameEntered"); // ALL IDENTITIES MUST HAVE A NAME
      }

      let createdIdmIdentities = [];
      let failedIdentities     = [];
      if (! errors && identitiesToCreate.length > 0) {
        for (const identityToCreate of identitiesToCreate) {
          this.debug(`-- Creating new IdmIdentity -- email="${identityToCreate.email}" name="${identityToCreate.name}"`);

          const accountId = identityToCreate.accountId;
          delete identityToCreate.accountId; // -- messenger.identities.create() - and thus createIdmIdentity() - fails if there is an accountId
          const identityProps = {
            "imported": true
          };
          const newIdmIdentity = await this.#idmIdentitiesApi.createIdmIdentity(accountId, identityToCreate, identityProps); // adds the new identity to the end of the list

          if (! newIdmIdentity) {
            this.error(`-- FAILED TO Create IDENTITY -- email="${identityToCreate.email}" name="${identityToCreate.name}"`);
            errors++;
            failedIdentities.push(identityToCreate);
          } else {
            this.debug(`-- IdmIdentity Created -- newIdmIdentity.id="${newIdmIdentity.id}" newIdmIdentity.name="${newIdmIdentity.name}"`);
            createdIdmIdentities.push(newIdmIdentity);
          }
        }

        this.debug(`-- New Identities created: ${createdIdmIdentities.length} -- failed: ${failedIdentities.length}`);

        if (failedIdentities.length > 0) {
          this.updateFailedIdentityRows(failedIdentities);
          this.updateCreatedIdentityRows(createdIdmIdentities);
        }
      }

      if (! errors) {
        const responseMessage = { 'IMPORTED': createdIdmIdentities };
        this.debug(`-- Sending responseMessage="${responseMessage}"`);

        try {
          await messenger.runtime.sendMessage(
            { IdentityImporterResponse: responseMessage }
          );
        } catch (error) {
          this.caught( error, 
                       "##### SEND RESPONSE MESSAGE FAILED #####"
                       + `\n- responseMessage="${responseMessage}"`
                     );
          errors++;
          this.addToErrorList("idmIdentityImporter_error_responseMessagefailed");
        }
      }
    }

    if (errors) {
      // allow the user to see the message(s) and try again
      importBtn.disabled = identitiesSelectedCount == 0;

    } else {
      this.debug("-- No Errors - closing window");
      const domSelectImportIdentitiesPanel = document.getElementById("idmIdentityImportIdentitiesSelector");
      domSelectImportIdentitiesPanel.style.setProperty("display", "none");
      window.close();
    }

    this.debug("-- end");
  }

  updateFailedIdentityRows(failedIdentities) {
    if (failedIdentities.length > 0) {
      this.debug(`-- Updating rows for FAILED identities, failedIdentities.length=${failedIdentities.length}`);
      for (const failedIdentity of failedIdentities) {
        this.updateFailedIdentityRow(failedIdentity);
      }
    }
  }

  updateFailedIdentityRow(failedIdentity) {
    this.debug(`-- Updating rows for FAILED identity: email="${failedIdentity.email}" : name="${failedIdentity.name}" `);

    // MABXXX Merely mark the TD with an error???

    // Get the identity-list-item TR for the Identity by email address
    const rowSelector = `tr.identity-list-item[email="${failedIdentity.email}"`
    const rowTR = document.querySelector(rowSelector);
    if (! rowTR) {
      // MABXXX do what???
      this.error(`-- Failed to get Row TR: rowSelector="${rowSelector}"`);

    } else {
      this.debug(`-- Updating Row for FAILED Identity email="${failedIdentity.email}" name="${failedIdentity.name}"`);
      rowTR.setAttribute('error', 'true');
    }
  }

  updateCreatedIdentityRows(createdIdmIdentities) {
    if (createdIdmIdentities.length > 0) {
      this.debug(`-- Updating rows for CREATED identities, createdIdmIdentities.length=${createdIdmIdentities.length}`);
      for (const createdIdmIdentity of createdIdmIdentities) {
        this.updateCreatedIdentityRow(createdIdmIdentity);
      }
    }
  }

  updateCreatedIdentityRow(createdIdmIdentity) {
    // Replace the input text and select fields with plain text, disable checkboxes, etc
    this.debug(`-- Updating row for CREATED identity: email="${createdIdmIdentity.email}" : name="${createdIdmIdentity.name}" `);

    // Get the identity-list-item TR for the Identity by email address
    const rowSelector = `tr.identity-list-item[email="${createdIdmIdentity.email}"`;
    const rowTR       = document.querySelector(rowSelector);
    if (! rowTR) {
      // MABXXX do what???
      this.error(`-- failed to get Row TR: rowSelector="${rowSelector}"`);

    } else {
      this.debug(`-- Updating Row for CREATED Identity email="${createdIdmIdentity.email}" name="${createdIdmIdentity.name}"`);

      // Mark the TR as a Created Identity
      rowTR.classList.add('identity-configured');
      rowTR.setAttribute('created', 'true');

      // MABXXX Change the Status Dot and TD title

      // Update Account element
      const identityAccountTD = rowTR.querySelector("td.identity-list-item-account");
      identityAccountTD.setAttribute("title", this.#message_listItem_Account_tooltip);
      const account = this.#accounts.find(obj => obj.id === createdIdmIdentity.accountId);
      identityAccountTD.firstChild.remove();
      identityAccountTD.appendChild( document.createTextNode(account.name) );

//    // Update Email element
//    const identityEmailTD = rowTR.querySelector("td.identity-list-item-email");
//    identityEmailTD.setAttribute("title", this.#message_listItem_Email_tooltip);
//    identityEmailTD.firstChild.remove();
//    identityEmailTD.appendChild( document.createTextNode(createdIdmIdentity.email) );

      // Update Name element
      const identityNameTD = rowTR.querySelector("td.identity-list-item-name");
      identityNameTD.setAttribute("title", this.#message_listItem_Name_tooltip);
      identityNameTD.firstChild.remove();
      identityNameTD.appendChild( document.createTextNode(createdIdmIdentity.name) );

      // Update Label element
      const identityLabelTD = rowTR.querySelector("td.identity-list-item-label");
      identityLabelTD.setAttribute("title", this.#message_listItem_Label_tooltip);
      identityLabelTD.firstChild.remove();
      identityLabelTD.appendChild( document.createTextNode(createdIdmIdentity.label) );

      // Update ReplyTo element
      const identityReplyToTD = rowTR.querySelector("td.identity-list-item-replyTo");
      identityReplyToTD.setAttribute("title", this.#message_listItem_ReplyTo_tooltip);
      identityReplyToTD.firstChild.remove();
      identityReplyToTD.appendChild( document.createTextNode(createdIdmIdentity.replyTo) );

      // Update Org (organization) element
      const identityOrgTD = rowTR.querySelector("td.identity-list-item-organization");
      identityOrgTD.setAttribute("title", this.#message_listItem_Org_tooltip);
      identityOrgTD.firstChild.remove();
      identityOrgTD.appendChild( document.createTextNode(createdIdmIdentity.organization) );

      // Update ComposeHtml element
      const identityComposeHtmlTD = rowTR.querySelector("td.identity-list-item-composeHtml");
      identityComposeHtmlTD.setAttribute("title", this.#message_listItem_ComposeHtml_tooltip);
      const identityComposeHtmlInput = identityComposeHtmlTD.firstChild;
      identityComposeHtmlInput.disabled = true;
      identityComposeHtmlInput.checked  = createdIdmIdentity.composeHtml;

      // Update Signature element
      const identitySignatureTD = rowTR.querySelector("td.identity-list-item-signature");
      identitySignatureTD.setAttribute("title", this.#message_listItem_Signature_tooltip);
      identitySignatureTD.firstChild.remove();
      identitySignatureTD.appendChild( document.createTextNode(createdIdmIdentity.signature) );

      // Update SigIsHtml (signatureIsHtml) element
      const identitySigIsHtmlTD = rowTR.querySelector("td.identity-list-item-signatureIsHtml");
      identitySigIsHtmlTD.setAttribute("title", this.#message_listItem_SigIsHtml_tooltip);
      const identitySigIsHtmlInput = identitySigIsHtmlTD.firstChild;
      identitySigIsHtmlInput.disabled = true;
      identitySigIsHtmlInput.checked  = ! createdIdmIdentity.signatureIsPlainText;
    }
  }

  resetErrors() {
    const errorList = document.getElementById("import_error_list");
    if (! errorList) {
      this.error("-- Failed to get errorList with ID='import_error_list'");
    } else {
      errorList.removeAttribute("error");
      errorList.innerHTML = '';
    }

    const errorDivs = document.querySelectorAll("div.import-data-error");
    if (errorDivs) {
      for (const errorDiv of errorDivs) {
        errorDiv.removeAttribute("error");
      }
    }

    const errorLabels = document.querySelectorAll("label.import-data-error-text");
    if (errorLabels) {
      for (const errorLabel of errorLabels) {
        errorLabel.removeAttribute("error"); // MABXXX nothing seems to actually set this to true (for now?)
        errorLabel.innerText = ""; // THIS IS A HUGE LESSON:  DO NOT USE: <label/>   USE: <label></label> 
      }
    }

////const errorElements = document.querySelectorAll('td[error="true"]'); // MABXXX
    const errorElements = document.querySelectorAll('[error="true"]');
    if (errorElements) {
      for (const errorElement of errorElements) {
        errorElement.removeAttribute("error");
      }
    }
  }

  setErrorFor(elementId, msgId) {
    if (elementId && msgId) {
      const errorDiv = document.querySelector("div.import-data-error[error-for='" + elementId + "']");
      if (errorDiv) {
        errorDiv.setAttribute("error", "true");
      }

      const errorLabel = document.querySelector("label.import-data-error-text[error-for='" + elementId + "']");
      if (errorLabel) {
        const i18nMessage = getI18nMsg(msgId);
        errorLabel.innerText = i18nMessage;
      }
    }
  }

  addToErrorList(msgId, text, msgId2) {
    if (msgId) {
      const errorList = document.getElementById("import_error_list");
      if (! errorList) {
        this.error("-- Failed to get errorListDiv with ID='import_error_list'");

      } else {
        errorList.setAttribute("error", "true");

/*      EXAMPLE:
        <tr class="import-error-item">
          <td class="import-error-info">
            <span class="import-error-icon-large">
              <img src="../images/icons/forbidden_16x16.png"/> // MABXXX this should be set by CSS
            </span>
          </td>
          <td class="import-error-info">
            <div class="import-error-text">
              <label>
                message + ": " + text
              </label>
              <label>  <!-- optional -->
                message2
              </label>
            </div>
          </td>
        </tr>
 */
        const errorTR = document.createElement("tr");
          errorTR.classList.add("import-error-item");
          const errorIconTD = document.createElement("td");
            errorIconTD.classList.add("import-error-info");
            const errorIconSpan = document.createElement("span");
              errorIconSpan.classList.add("import-error-icon-large");
              const errorIconImg = document.createElement("img");
                errorIconImg.setAttribute("src", "../images/icons/forbidden_16x16.png"); // MABXXX this should be set by CSS
              errorIconSpan.appendChild(errorIconImg);
            errorIconTD.appendChild(errorIconSpan);
          errorTR.appendChild(errorIconTD);
          const errorLabelTD = document.createElement("td");
            errorLabelTD.classList.add("import-error-info");
            const errorLabelDIV = document.createElement("div");
              errorLabelDIV.classList.add("import-error-text");
              const errorLabel = document.createElement("label");
                let msg = getI18nMsg(msgId);
                if (text) {
                  msg += ": " + text;
                }
                errorLabel.innerText = msg;
              errorLabelDIV.appendChild(errorLabel);

              if (msgId2) {
                const errorLabel2 = document.createElement("label");
                  msg = getI18nMsg(msgId2);
                  errorLabel2.innerText = msg;
                errorLabelDIV.appendChild(errorLabel2);
              }
            errorLabelTD.appendChild(errorLabelDIV);

          errorTR.appendChild(errorLabelTD);
        errorList.appendChild(errorTR);
      }
    }
  }

  markErrorTD(element) {
    if (element) {
      const tdElement = element.closest('td');
      if (tdElement) {
        tdElement.setAttribute("error", "true");
      }
    }
  }



  async cancelButtonClicked(e) {
    this.debug(`-- e.target.tagName="${e.target.tagName}"`);
    e.preventDefault();
    this.resetErrors();

    this.#canceled = true;

    // maybe not the best idea to do this... message receiver gets:
    //     Promise rejected after context unloaded: Actor 'Conduits' destroyed before query 'RuntimeMessage' was resolved
    let responseMessage = "CANCELED";
    this.debug(`-- Sending responseMessage="${responseMessage}"`);

    try {
      await messenger.runtime.sendMessage(
        { IdentityEditorResponse: responseMessage }
      );
    } catch (error) {
      // any need to tell the user???
      this.caught( error,
                   "##### SEND RESPONSE MESSAGE FAILED #####"
                   + `\n- responseMessage="${responseMessage}"`
                 );
    }

    this.debug("-- Closing window");
    window.close();
  }



  // One of the Options checkboxes or radio buttons (etc) has been clicked - store the new setting
  async optionChanged(e) {
    if (e == null) return;

    if ( e.target.tagName == "INPUT"
         && e.target.classList.contains("icGeneralOption")
         && ( e.target.type    == "checkbox"
              || e.target.type == "radio"
            )
       )
    {
      const optionName  = e.target.id;
      const optionValue = e.target.checked;

      /* if it's a radio button, set the values for all the other buttons in the group to false */
      if (e.target.type == "radio") { // is it a radio button?
        this.debug(`-- radio buttton selected ${optionName}=<${optionValue}> - group=${e.target.name}`);

        // first, set this option
        await this.#idmOptionsApi.storeOption({
          [optionName]: optionValue
        });

        // get all the elements with the same name, and if they're a radio, un-check them
        if (e.target.name) { /* && (optionValue == true || optionValue == 'true')) { Don't need this. Event fired *ONLY* when SELECTED, i.e. true */
          const radioGroupName = e.target.name;
          const radioGroup = document.querySelectorAll(`input[type="radio"][name="${radioGroupName}"]`);
          if (! radioGroup) {
            this.debug('-- no radio group found');
          } else {
            this.debug(`-- radio group members length=${radioGroup.length}`);
            if (radioGroup.length < 2) {
              this.debug('-- no radio group members to reset (length < 2)');
            } else {
              for (const radio of radioGroup) {
                if (radio.id != optionName) { // don't un-check the one that fired
                  this.debug(`-- resetting  radio button [${radio.id}]: ${false}`);
                  await this.#idmOptionsApi.storeOption({
                    [radio.id]: false
                  });
                }
              }
            }
          }
        }
      } else { // since we already tested for it, it's got to be a checkbox
        this.debug(`-- Setting Option [${optionName}]: ${optionValue}]`);
        await this.#idmOptionsApi.storeOption({
          [optionName]: optionValue
        });

        switch (optionName) {
          case "idmIdentityImportIdentitiesSelectorHideExistingCheck":
            await this.hideExistingIdentitiesCheckClicked(e);
            break;
        }
      }
    }
  }



  async hideExistingIdentitiesCheckClicked(e) {
    this.debug("-- begin");

////await this.showSelectImportIdentitiesPanel(); // MABXXX show the whole panel again?  Should just rebuild the list MABXXX OR USE CSS!!!

    const checked             = e.target.checked;
    const existingIdentityTRs = this.getConfiguredDomIdentityListItems();
    this.debug(`-- checked=${checked} existingIdentityTRs.length=${existingIdentityTRs.length} `);

    if (checked) {
      for (const identityTR of existingIdentityTRs) {
        identityTR.classList.add("identity-hidden"); // MABXXX identity-configured-hidden
      }
    } else {
      for (const identityTR of existingIdentityTRs) {
        identityTR.classList.remove("identity-hidden"); // MABXXX identity-configured-hidden
      }
    }

    this.debug("-- end");
  }

}

const identityImporter = new IdentityImporter();

document.addEventListener("DOMContentLoaded", (e) => identityImporter.run(e), {once: true});
