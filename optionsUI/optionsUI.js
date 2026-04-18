import { BorderColorsApi               } from '../modules/bordercolorsapi.js';

import { FileSystemBrokerAPI           } from '../modules/FileSystemBroker/filesystem_broker_api.js';
import { IdmIdentities                 } from '../modules/identities.js';
import { Logger                        } from '../modules/logger.js';
import { IdmOptions                    } from '../modules/options.js';
import { FileSystemBrokerMessagingTest } from '../modules/Tests/test_filesystembroker_messaging.js';
import { FileSystemBrokerApiTest       } from '../modules/Tests/test_filesystembroker_api.js';
import { FileSystemExpApiTest          } from '../modules/Tests/test_filesystemexp_api.js';
//import * as psl                        from '../modules/psl/psl.bundle.js';                 // Domain Parser
import { getExtensionName, acctNumFromId, getI18nMsg, getI18nMsgSubst, parseDocumentLocation, formatMsToDateTime12HR } from '../modules/utilities.js';


class OptionsUI {
  #CLASS_NAME                = this.constructor.name;

  #LOG                       = false;
  #DEBUG                     = false;
  #DEBUG_OPTION_CHANGED      = false;
  #DEBUG_ACTIION_CLICKED     = false;
  #DEBUG_IDENTITY_CONTROL    = false;
  #WARN                      = false;

  #PARSE_CSV_TEST_VERBOSE    = false;

  #logger                    = new Logger();;
  #idmOptionsApi             = new IdmOptions(this.#logger);
  #idmIdentitiesApi          = new IdmIdentities(this.#idmOptionsApi, this.#logger);
  #borderColorsApi           = new BorderColorsApi();

  #popupWindowMode           = false;
  #optionsPopupWindow        = null;

  #fileSystemBrokerAccessGranted  = false;
  #fileSystemBrokerAccessReadOnly = false;

  #prevFocusedWindowId       = -1;

  #accounts                  = null;
  #accountsById              = [];

  #totalIdentityCount        = 0;
  #filteredIdentityCount     = -1;

  #filterByAccountId         = '';
  #filterByImported          = '';
  #filterByLocked            = '';
  #filterByAccountDefault    = '';
  #filterByCollected         = '';
  #filterByShowInMenu        = '';
  #filterBylabelRegexText    = '';
  #filterByEmailRegexText    = '';

  // a (small) cache of some options - eventually cache them all and listen for changes from IdmOptions
  #option_displayIdentityPosition = false;
  #option_displayIdentityIndex    = false;
  #option_displayIdentityId       = false;

  #extensionOptionsTitleClickTimer     = null;  // for detecting single- vs double-click on the Options Title Text (for show/hide developer options)
  #EXTENSION_OPTIONS_TITLE_CLICK_DELAY = 500;   // 500ms, 1/2 second (the JavaScript runtime does not guarantee this time - it's single-threaded)

  #identityItemClickTimer              = null;  // for detecting single- vs double-click on an Identity (to open the Identity Editor)
  #IDENTITY_ITEM_CLICK_DELAY           = 500;   // 500ms, 1/2 second (the JavaScript runtime does not guarantee this time - it's single-threaded)

  // gather i18n messages for tooltips in the Display Order List
  // - these calls to getI18nMsg with "" as the 2nd parameter will return "" - NOT the message ID - if no message is configured


  #listHeader_text_controlsLeft                      = getI18nMsg( "options_idmDisplayOrder_listHeader_text_controlsLeft",                      ""                              );
  #listHeader_tooltip_controlsLeft                   = getI18nMsg( "options_idmDisplayOrder_listHeader_tooltip_controlsLeft",                   ""                              );
  #listHeader_text_identityColor                     = getI18nMsg( "options_idmDisplayOrder_listHeader_text_identityColor",                     ""                              );
  #listHeader_tooltip_identityColor                  = getI18nMsg( "options_idmDisplayOrder_listHeader_tooltip_identityColor",                  "Identity Color"                );
  #listHeader_text_account                           = getI18nMsg( "options_idmDisplayOrder_listHeader_text_account",                           "Account"                       );
  #listHeader_tooltip_account                        = getI18nMsg( "options_idmDisplayOrder_listHeader_tooltip_account",                        "Email Account"                 );
  #listHeader_tooltip_sortBy_accountId_ascending     = getI18nMsg( "options_idmDisplayOrder_listHeader_tooltip_sortBy_accountId_ascending",     "Sort Ascending"                );
  #listHeader_tooltip_sortBy_accountId_descending    = getI18nMsg( "options_idmDisplayOrder_listHeader_tooltip_sortBy_accountId_descending",    "Sort Descending"               );
  #listHeader_text_nameAndLabel                      = getI18nMsg( "options_idmDisplayOrder_listHeader_text_nameAndLabel",                      "Name+Label"                    );
  #listHeader_tooltip_nameAndLabel                   = getI18nMsg( "options_idmDisplayOrder_listHeader_tooltip_nameAndLabel",                   "Name + (Label)"                );
  #listHeader_tooltip_sortBy_nameAndLabel_ascending  = getI18nMsg( "options_idmDisplayOrder_listHeader_tooltip_sortBy_nameAndLabel_ascending",  "Sort Ascending"                );
  #listHeader_tooltip_sortBy_nameAndLabel_descending = getI18nMsg( "options_idmDisplayOrder_listHeader_tooltip_sortBy_nameAndLabel_descending", "Sort Descending"               );
  #listHeader_text_email                             = getI18nMsg( "options_idmDisplayOrder_listHeader_text_email",                             "Email"                         );
  #listHeader_tooltip_email                          = getI18nMsg( "options_idmDisplayOrder_listHeader_tooltip_email",                          "Email Address"                 );
  #listHeader_tooltip_sortBy_email_ascending         = getI18nMsg( "options_idmDisplayOrder_listHeader_tooltip_sortBy_email_ascending",         "Sort Ascending"                );
  #listHeader_tooltip_sortBy_email_descending        = getI18nMsg( "options_idmDisplayOrder_listHeader_tooltip_sortBy_email_descending",        "Sort Descending"               );
  #listHeader_text_pos                               = getI18nMsg( "options_idmDisplayOrder_listHeader_text_pos",                               "pos"                           );
  #listHeader_tooltip_pos                            = getI18nMsg( "options_idmDisplayOrder_listHeader_tooltip_pos",                            "Position in Identity List"     );
  #listHeader_text_id                                = getI18nMsg( "options_idmDisplayOrder_listHeader_text_id",                                "ID"                            );
  #listHeader_tooltip_id                             = getI18nMsg( "options_idmDisplayOrder_listHeader_tooltip_id",                             "Identity ID"                   );
  #listHeader_tooltip_sortBy_id_ascending            = getI18nMsg( "options_idmDisplayOrder_listHeader_tooltip_sortBy_id_ascending",            "Sort Ascending"                );
  #listHeader_tooltip_sortBy_id_descending           = getI18nMsg( "options_idmDisplayOrder_listHeader_tooltip_sortBy_id_descending",           "Sort Descending"               );
  #listHeader_text_index                             = getI18nMsg( "options_idmDisplayOrder_listHeader_text_index",                             "Index"                         );
  #listHeader_tooltip_index                          = getI18nMsg( "options_idmDisplayOrder_listHeader_tooltip_index",                          "Index in Identity List"        );
  #listHeader_text_controlsRight                     = getI18nMsg( "options_idmDisplayOrder_listHeader_text_controlsRight",                     ""                              );
  #listHeader_tooltip_controlsRight                  = getI18nMsg( "options_idmDisplayOrder_listHeader_tooltip_controlsRight",                  ""                              );

  #tooltip_check_showInMenu                          = getI18nMsg( "options_check_showInMenu.tooltip",                                          ""                              );
  #tooltip_check_lockInMenu                          = getI18nMsg( "options_check_lockInMenu.tooltip",                                          ""                              );
  #tooltip_button_moveUp                             = getI18nMsg( "options_button_moveIdentityUp.tooltip",                                     "Move Identity Up"              );
  #tooltip_button_moveDown                           = getI18nMsg( "options_button_moveIdentityDown.tooltip",                                   "Move Identity Down"            );
  #tooltip_button_moveToTop                          = getI18nMsg( "options_button_moveIdentityToTop.tooltip",                                  "Move Identity to Top"          );
  #tooltip_button_moveToBottom                       = getI18nMsg( "options_button_moveIdentityToBottom.tooltip",                               "Move Identity to Bottom"       );
  #tooltip_button_edit                               = getI18nMsg( "options_button_editIdentity.tooltip",                                       "Edit Identity"                 );
  #tooltip_button_create                             = getI18nMsg( "options_idmCreateIdentityButton.tooltip",                                   "Create New Identity"           );
  #tooltip_button_delete                             = getI18nMsg( "options_button_deleteIdentity.tooltip",                                     "Delete Identity"               );

  #tooltip_listItemMarker_accountDefault             = getI18nMsg( "options_listItemMarker_accountDefault.tooltip",                             ""                              );
  #tooltip_listItemMarker_collected                  = getI18nMsg( "options_listItemMarker_collected.tooltip",                                  ""                              );
  #tooltip_listItemMarker_imported                   = getI18nMsg( "options_listItemMarker_imported.tooltip",                                   ""                              );
  #tooltip_listItemMarker_notShowInMenu              = getI18nMsg( "options_listItemMarker_notShowInMenu.tooltip",                              ""                              );
  #tooltip_listItemMarker_lockInMenu                 = getI18nMsg( "options_listItemMarker_lockInMenu.tooltip",                                 ""                              );

  #error_invalidLabeLFilterRegex                     = getI18nMsg( "options_idmDisplayOrderFilterError_labelRegexInvalid",                      "Invalid Regular Expression"    );
  #error_invalidEmaiLFilterRegex                     = getI18nMsg( "options_idmDisplayOrderFilterError_emailRegexInvalid",                      "Invalid Regular Expression"    );


  constructor() {
  }



  log(...info) {
    if (this.#LOG) this.#logger.log(this.#CLASS_NAME, ...info); }

  logAlways(...info) {
    this.#logger.logAlways(this.#CLASS_NAME, ...info);
  }

  debug(...info) {
    if (this.#DEBUG) this.#logger.debug(this.#CLASS_NAME, ...info);
  }

  __debugOptionChanged(...info) {
    if (this.#DEBUG_OPTION_CHANGED) this.#logger.debug(this.#CLASS_NAME, ...info);
  }

  __debugActionClicked(...info) {
    if (this.#DEBUG_ACTIION_CLICKED) this.#logger.debug(this.#CLASS_NAME, ...info);
  }

  __debugIdentityControl(...info) {
    if (this.#DEBUG_IDENTITY_CONTROL) this.#logger.debug(this.#CLASS_NAME, ...info);
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



  async init(event) {
    this.debug("-- begin");

    const docLocationInfo = parseDocumentLocation(document);
    const params          = docLocationInfo.params;
    if (params) {
      const popupWindowMode = params.get('popupWindowMode');
      this.debug(`-- popupWindowMode="${popupWindowMode}"`);

      if (popupWindowMode === 'true') {
        this.#popupWindowMode = true;
      }
    }
  
    if (this.#popupWindowMode) {
        window.addEventListener("beforeunload", (e) => this.windowUnloading(e));
    } else {
      messenger.windows.onRemoved.addListener( async (windowId) => { this.popupWindowRemoved(windowId); } );
    }

    await this.#getAccounts();

    await this.localizePage();
    await this.applyTooltips(document);
    await this.buildUI();
    await this.setupEventListeners();

    this.debug("-- end");
  }



  async #getAccounts() {
    this.#accounts = await messenger.accounts.list(false); // includeSubFolders=false: do not get sub-folders
    for (const account of this.#accounts) {
      if (account.type !== 'none') this.#accountsById[account.id] = account;
    }
  }

  #getAccountName(accountId) {
    const mailAccount = this.#accountsById[accountId];
    if (mailAccount) return mailAccount.name;
    return accountId;
  }



  async windowUnloading(e) {
    if (this.#DEBUG) this.debugAlways( "--- WINDOW UNLOADING ---",
                                       `\n- this.#popupWindowMode=${this.#popupWindowMode}`,
                                       `\n- window.screenTop=${window.screenTop}`,
                                       `\n- window.screenLeft=${window.screenLeft}`,
                                       `\n- window.outerWidth=${window.outerWidth}`,
                                       `\n- window.outerHeight=${window.outerHeight}`,
                                     );

    if (this.#popupWindowMode) { // we should NOT have been called unless popupWindowMode===true, otherwise we would NOT have been added as a listnener
      await this.#idmOptionsApi.storeWindowBounds("optionsWindowBounds", window);

      if (this.#DEBUG) {
        const bounds = await this.#idmOptionsApi.getWindowBounds("optionsWindowBounds");

        if (! bounds) {
          this.debugAlways("--- WINDOW UNLOADING --- FAILED TO GET bounds ---");
        } else if (typeof bounds !== 'object') {
          this.error(`--- WINDOW UNLOADING --- PREVIOUS WINDOW BOUNDS "optionsWindowBounds" IS NOT AN OBJECT: typeof='${typeof bounds}' ---`);
        } else {
          this.debugAlways( "---",
                            `\n- bounds.top:    ${bounds.top}`,
                            `\n- bounds.left:   ${bounds.left}`,
                            `\n- bounds.width:  ${bounds.width}`,
                            `\n- bounds.height: ${bounds.height}`,
                          );
        }
      }
    }

    messenger.runtime.onMessage.removeListener(this.identityCollectedMessageListener);

    // Tell Thunderbird to close the window
    e.returnValue = '';  // any "non-truthy" value will do
    return false;
  }



  async localizePage() { // we could pass this the Document and then we could move it to utilities.js
    this.debug("-- start");

    for (const el of document.querySelectorAll("[data-l10n-id]")) {
      const id = el.getAttribute("data-l10n-id");
      const i18nMessage = getI18nMsg(id);
      el.textContent = i18nMessage;
    }

    for (const el of document.querySelectorAll("[data-html-l10n-id]")) {
      const id = el.getAttribute("data-html-l10n-id");
      const i18nMessage = getI18nMsg(id);
      el.insertAdjacentHTML('afterbegin', i18nMessage);
    }

    this.debug("-- end");
  }



  async applyTooltips(theDocument) { // we could move this to utilities.js
    this.debug("-- start");

    for (const el of theDocument.querySelectorAll("[tooltip-l10n-id]")) {
      const id = el.getAttribute("tooltip-l10n-id");
      const i18nMessage = getI18nMsg(id);
      el.setAttribute('title', i18nMessage);
    }

    this.debug("-- end");
  }



  async setupEventListeners() {
    // MABXXX NOTE: These two listeners are set ON THE DOCUMENT!!!  I inherited this.  I should change it.
    document.addEventListener( 'change', (e) => this.optionChanged(e) );   // One of the input items changed - input checkbox/radio/text, select, etc
    document.addEventListener( 'click',  (e) => this.actionClicked(e) );   // Something - anything - in the I was clicked

    const extensionOptionsTitleDIV = document.getElementById("idmExtensionOptionsTitle");
    if (extensionOptionsTitleDIV) {
      document.addEventListener( "dblclick",  (e) => this.extensionOptionsTitleDIVDoubleClicked(e) ); // why on the document, not the <div> ???
    }


    const filterIdentitiesByAccountSelect = document.getElementById("idmDisplayOrderFilterByAccountSelect");
    filterIdentitiesByAccountSelect.addEventListener('change', (e) => this.filterIdentitiesByAccountSelectChanged(e));
    const filterIdentitiesByAccountResetBtn = document.getElementById("idmDisplayOrderFilterByAccountResetButton");
    filterIdentitiesByAccountResetBtn.setAttribute("data", "reset-account-filter");
    filterIdentitiesByAccountResetBtn.addEventListener('click', (e) => this.filterIdentitiesByAccountResetButtonClicked(e));

    const filterIdentitiesByImportedSelect = document.getElementById("idmDisplayOrderFilterByImportedSelect");
    filterIdentitiesByImportedSelect.addEventListener('change', (e) => this.filterIdentitiesByImportedSelectChanged(e));
    const filterIdentitiesByImportedResetBtn = document.getElementById("idmDisplayOrderFilterByImportedResetButton");
    filterIdentitiesByImportedResetBtn.setAttribute("data", "reset-imported-filter");
    filterIdentitiesByImportedResetBtn.addEventListener('click', (e) => this.filterIdentitiesByImportedResetButtonClicked(e));

    const filterIdentitiesByLockedSelect = document.getElementById("idmDisplayOrderFilterByLockedSelect");
    filterIdentitiesByLockedSelect.addEventListener('change', (e) => this.filterIdentitiesByLockedSelectChanged(e));
    const filterIdentitiesByLockedResetBtn = document.getElementById("idmDisplayOrderFilterByLockedResetButton");
    filterIdentitiesByLockedResetBtn.setAttribute("data", "reset-locked-filter");
    filterIdentitiesByLockedResetBtn.addEventListener('click', (e) => this.filterIdentitiesByLockedResetButtonClicked(e));

    const filterIdentitiesByAccountDefaultSelect = document.getElementById("idmDisplayOrderFilterByAccountDefaultSelect");
    filterIdentitiesByAccountDefaultSelect.addEventListener('change', (e) => this.filterIdentitiesByAccountDefaultSelectChanged(e));
    const filterIdentitiesByAccountDefaultResetBtn = document.getElementById("idmDisplayOrderFilterByAccountDefaultResetButton");
    filterIdentitiesByAccountDefaultResetBtn.setAttribute("data", "reset-account-default-filter");
    filterIdentitiesByAccountDefaultResetBtn.addEventListener('click', (e) => this.filterIdentitiesByAccountDefaultResetButtonClicked(e));

    const filterIdentitiesByCollectedSelect = document.getElementById("idmDisplayOrderFilterByCollectedSelect");
    filterIdentitiesByCollectedSelect.addEventListener('change', (e) => this.filterIdentitiesByCollectedSelectChanged(e));
    const filterIdentitiesByCollectedResetBtn = document.getElementById("idmDisplayOrderFilterByCollectedResetButton");
    filterIdentitiesByCollectedResetBtn.setAttribute("data", "reset-collected-filter");
    filterIdentitiesByCollectedResetBtn.addEventListener('click', (e) => this.filterIdentitiesByCollectedResetButtonClicked(e));

    const filterIdentitiesByShowInMenuSelect = document.getElementById("idmDisplayOrderFilterByShowInMenuSelect");
    filterIdentitiesByShowInMenuSelect.addEventListener('change', (e) => this.filterIdentitiesByShowInMenuSelectChanged(e));
    const filterIdentitiesByShowInMenuResetBtn = document.getElementById("idmDisplayOrderFilterByShowInMenuResetButton");
    filterIdentitiesByShowInMenuResetBtn.setAttribute("data", "reset-show_hide-filter");
    filterIdentitiesByShowInMenuResetBtn.addEventListener('click', (e) => this.filterIdentitiesByShowInMenuResetButtonClicked(e));

    const filterIdentitiesByLabelRegexText = document.getElementById("idmDisplayOrderFilterByLabelRegexText");
////filterIdentitiesByLabelRegexText.addEventListener( "keydown", (e) => this.filterIdentitiesByLabelRegexTextKeyPressed(e) ); // we're not operating on enter key -- yet
    filterIdentitiesByLabelRegexText.addEventListener( "input",   (e) => this.filterIdentitiesByLabelRegexTextChanged(e)    );
    const filterIdentitiesByLabelResetBtn = document.getElementById("idmDisplayOrderFilterByLabelResetButton");
    filterIdentitiesByLabelResetBtn.setAttribute("data", "reset-label-filter");
    filterIdentitiesByLabelResetBtn.addEventListener('click', (e) => this.filterIdentitiesByLabelResetButtonClicked(e));

    const filterIdentitiesByEmailRegexText = document.getElementById("idmDisplayOrderFilterByEmailRegexText");
////filterIdentitiesByEmailRegexText.addEventListener( "keydown", (e) => this.filterIdentitiesByEmailRegexTextKeyPressed(e) ); // we're not operating on enter key -- yet
    filterIdentitiesByEmailRegexText.addEventListener( "input",   (e) => this.filterIdentitiesByEmailRegexTextChanged(e)    );
    const filterIdentitiesByEmailResetBtn = document.getElementById("idmDisplayOrderFilterByEmailResetButton");
    filterIdentitiesByEmailResetBtn.setAttribute("data", "reset-email-filter");
    filterIdentitiesByEmailResetBtn.addEventListener('click', (e) => this.filterIdentitiesByEmailResetButtonClicked(e));

    const filterIdentitiesResetAllBtn = document.getElementById("idmDisplayOrderFilterResetAllButton");
    filterIdentitiesResetAllBtn.setAttribute("data", "reset-all-filters");
    filterIdentitiesResetAllBtn.addEventListener('click', (e) => this.filterIdentitiesResetAllButtonClicked(e));

    // do it this way to make sure the message listener can access "this"
    messenger.runtime.onMessage.addListener( (request, sender, sendResponse) => { this.identityCollectedMessageListener(request, sender, sendResponse) } );
  }



  async buildUI() {
    this.debug("-- start");

    const collectFromAddressesAlertCheckPanel = document.getElementById("idmCollectFromAddressAlertCheckPanel");
    if (! collectFromAddressesAlertCheckPanel) {
      this.error("-- Failed to get collectFromAddressesAlertCheckPanel");
    } else {
      const collectFromAddresses = await this.#idmOptionsApi.isEnabledCollectFromAddresses();
      if (collectFromAddresses) {
        collectFromAddressesAlertCheckPanel.style.setProperty( "display", "BLOCK" );
      } else {
        collectFromAddressesAlertCheckPanel.style.setProperty( "display", "NONE"  );
      }
    }

    const isEnabledShowDeveloperOptions = await this.#idmOptionsApi.isEnabledOption("idmShowDeveloperOptions");
    if (isEnabledShowDeveloperOptions) {
      await this.addDeveloperOptions();
    } else {
      await this.removeDeveloperOptions();
    }

//  const isEnabledHideDisplayOrderControls = await this.#idmOptionsApi.isEnabledOption("idmHideDisplayOrderControls");
//  if (isEnabledHideDisplayOrderControls) {
//    await this.hideDisplayOrderControls();
//  } else {
//    await this.showDisplayOrderControls();
//  }

    const isEnabledShowPopupOptions = await this.#idmOptionsApi.isEnabledShowPopupOptions();
    if (isEnabledShowPopupOptions) {
      this.showPopupOptions();
    } else {
      this.hidePopupOptions();
    }

    const isEnabledShowDisplayOrderHints = await this.#idmOptionsApi.isEnabledShowDisplayOrderHints();
    if (isEnabledShowDisplayOrderHints) {
      this.showDisplayOrderHints();
    } else {
      this.hideDisplayOrderHints();
    }

    const isEnabledShowDisplayOrderActions = await this.#idmOptionsApi.isEnabledShowDisplayOrderActions();
    if (isEnabledShowDisplayOrderActions) {
      this.showDisplayOrderActions();
    } else {
      this.hideDisplayOrderActions();
    }

    this.populateSelectUIs();

    await this.updateUIForFileSystemBrokerAccess();
    await this.updateOptionsUI();
////await this.updateAutoSortUI();          // This is done in updateOptionsUI()
    await this.buildIdentitiesListUI();
////await this.clearFilterPanelMessages();  // This is done in buildIdentitiesListUI()
////await this.clearDisplayOrderMessages(); // This is done in buildIdentitiesListUI()
    this.enableDisableButtonsOnSelectionChanged();
  }



  async updateOptionsUI() {
    this.debug("-- start");

    const options = await this.#idmOptionsApi.getAllOptions();

    this.debug("-- sync options to UI");
    for (const [optionName, optionValue] of Object.entries(options)) {
      this.debug("-- option: ", optionName, "value: ", optionValue);

      const optionElement = document.getElementById(optionName);

      if (optionElement && optionElement.classList.contains("idmGeneralOption")) {
        if (optionElement.tagName === 'INPUT') {
          if (optionElement.type === 'checkbox') {
            this.debug("-- CHECKBOX option: ", optionName, "value: ", optionValue);
            optionElement.checked = optionValue;
          } else if (optionElement.type === 'radio') { // MABXXX what about other radio buttons in the same group???
            this.debug("-- RADIO option: ", optionName, "value: ", optionValue);
            optionElement.checked = optionValue;
          } else if (optionElement.type === 'text') {
            this.debug("-- TEXT option: ", optionName, "value: ", optionValue);
            optionElement.value = optionValue;
          }
        } else if (optionElement.tagName === 'SELECT') {
          this.debug("-- SELECT option: ", optionName, "value: ", optionValue);
          optionElement.value = optionValue;
          
          switch (optionName) {
            case 'idmAutoSortBySelect':
            case 'idmAutoSortDirectionSelect':
              await this.updateAutoSortUI();
              break;
          }
        }
      }
    }

    this.debug("-- end");
  }



  populateSelectUIs() {
    this.populateAutoSortBySelectUI();
    this.populateAutoSortDirectionSelectUI();
    this.populateFilterByAccountSelectUI();
    this.populateFilterByImportedSelectUI();
    this.populateFilterByLockedSelectUI();
    this.populateFilterByAccountDefaultSelectUI();
    this.populateFilterByCollectedSelectUI();
    this.populateFilterByShowInMenuSelectUI();
  } 



  populateAutoSortBySelectUI() {
    const select = document.getElementById("idmAutoSortBySelect");
    if (! select) {
      this.error("-- Failed to find Select id='idmAutoSortBySelect'");

    } else {
      const optionNone = document.createElement('option');
      optionNone.setAttribute('value',  IdmOptions.IDENTITY_AUTO_SORT_BY_VALUE_NONE);
      optionNone.appendChild( document.createTextNode( getI18nMsg("options_idmAutoSortBySelectOption_none") ) );
      select.appendChild(optionNone);

      const option1 = document.createElement('option');
      option1.setAttribute('value', IdmOptions.IDENTITY_AUTO_SORT_BY_VALUE_NAME);
      option1.appendChild( document.createTextNode( getI18nMsg("options_idmAutoSortBySelectOption_name") ) );
      select.appendChild(option1);

      const option2 = document.createElement('option');
      option2.setAttribute('value', IdmOptions.IDENTITY_AUTO_SORT_BY_VALUE_EMAIL);
      option2.appendChild( document.createTextNode( getI18nMsg("options_idmAutoSortBySelectOption_emailAddress") ) );
      select.appendChild(option2);

      const option3 = document.createElement('option');
      option3.setAttribute('value', IdmOptions.IDENTITY_AUTO_SORT_BY_VALUE_DOMAIN);
      option3.appendChild( document.createTextNode( getI18nMsg("options_idmAutoSortBySelectOption_emailDomain") ) );
      select.appendChild(option3);

      const option4 = document.createElement('option');
      option4.setAttribute('value', IdmOptions.IDENTITY_AUTO_SORT_BY_VALUE_HOST);
      option4.appendChild( document.createTextNode( getI18nMsg("options_idmAutoSortBySelectOption_emailHost") ) );
      select.appendChild(option4);

      const option5 = document.createElement('option');
      option5.setAttribute('value', IdmOptions.IDENTITY_AUTO_SORT_BY_VALUE_ACCOUNT);
      option5.appendChild( document.createTextNode( getI18nMsg("options_idmAutoSortBySelectOption_accountId") ) );
      select.appendChild(option5);
    }
  }



  populateAutoSortDirectionSelectUI() {
    const select = document.getElementById("idmAutoSortDirectionSelect");
    if (! select) {
      this.error("-- Failed to find Select id='idmAutoSortDirectionSelect'");
    } else {
      const optionNone = document.createElement('option');
      optionNone.setAttribute('value', IdmOptions.IDENTITY_AUTO_SORT_DIRECTION_VALUE_NONE);
      optionNone.appendChild( document.createTextNode( getI18nMsg("options_idmAutoSortDirectionSelectOption_none") ) );
      select.appendChild(optionNone);

      const option1 = document.createElement('option');
      option1.setAttribute('value', IdmOptions.IDENTITY_AUTO_SORT_DIRECTION_VALUE_ASCENDING);
      option1.appendChild( document.createTextNode( getI18nMsg("options_idmAutoSortDirectionSelectOption_ascending") ) );
      select.appendChild(option1);

      const option2 = document.createElement('option');
      option2.setAttribute('value', IdmOptions.IDENTITY_AUTO_SORT_DIRECTION_VALUE_DESCENDING);
      option2.appendChild( document.createTextNode( getI18nMsg("options_idmAutoSortDirectionSelectOption_descending") ) );
      select.appendChild(option2);

    }
  }



  populateFilterByAccountSelectUI() {
    const filterIdentitiesByAccountSelect = document.getElementById("idmDisplayOrderFilterByAccountSelect");
    filterIdentitiesByAccountSelect.innerHTML = '';

    const anyAccountOption     = document.createElement('option');
    const anyAccountOptionText = getI18nMsg("options_idmDisplayOrderFilterByAccountSelect_anyAccount");
    anyAccountOption.setAttribute('value', "");
    anyAccountOption.appendChild( document.createTextNode(anyAccountOptionText) );
    filterIdentitiesByAccountSelect.appendChild(anyAccountOption);

    for (const account of this.#accounts) {
      if (account.type !== 'none') {
        const option     = document.createElement('option');
        const acctNum    = acctNumFromId(account.id);
        const optionText = isNaN(acctNum) ? account.name : acctNum + ": " + account.name;
        option.setAttribute('value', account.id);
        option.appendChild( document.createTextNode(optionText) );
        filterIdentitiesByAccountSelect.appendChild(option);
      }
    }
  }



  populateFilterByImportedSelectUI() {
    const filterIdentitiesByImportedSelect = document.getElementById("idmDisplayOrderFilterByImportedSelect");
    filterIdentitiesByImportedSelect.innerHTML = '';

    const anyImportedOption     = document.createElement('option');
    const anyImportedOptionText = getI18nMsg("options_idmDisplayOrderFilterByImportedSelect_any");
    anyImportedOption.setAttribute('value', "");
    anyImportedOption.appendChild( document.createTextNode(anyImportedOptionText) );
    filterIdentitiesByImportedSelect.appendChild(anyImportedOption);

    const importedOption     = document.createElement('option');
    const importedOptionText = getI18nMsg("options_idmDisplayOrderFilterByImportedSelect_imported");
    importedOption.setAttribute('value', "IMPORTED");
    importedOption.appendChild( document.createTextNode(importedOptionText) );
    filterIdentitiesByImportedSelect.appendChild(importedOption);

    const notImportedOption     = document.createElement('option');
    const notImportedOptionText = getI18nMsg("options_idmDisplayOrderFilterByImportedSelect_notImported");
    notImportedOption.setAttribute('value', "NOT_IMPORTED");
    notImportedOption.appendChild( document.createTextNode(notImportedOptionText) );
    filterIdentitiesByImportedSelect.appendChild(notImportedOption);
  }



  populateFilterByLockedSelectUI() {
    const filterIdentitiesByLockedSelect = document.getElementById("idmDisplayOrderFilterByLockedSelect");
    filterIdentitiesByLockedSelect.innerHTML = '';

    const anyLockedOption     = document.createElement('option');
    const anyLockedOptionText = getI18nMsg("options_idmDisplayOrderFilterByLockedSelect_any");
    anyLockedOption.setAttribute('value', "");
    anyLockedOption.appendChild( document.createTextNode(anyLockedOptionText) );
    filterIdentitiesByLockedSelect.appendChild(anyLockedOption);

    const lockedOption     = document.createElement('option');
    const lockedOptionText = getI18nMsg("options_idmDisplayOrderFilterByLockedSelect_locked");
    lockedOption.setAttribute('value', "LOCKED");
    lockedOption.appendChild( document.createTextNode(lockedOptionText) );
    filterIdentitiesByLockedSelect.appendChild(lockedOption);

    const notLockedOption     = document.createElement('option');
    const notLockedOptionText = getI18nMsg("options_idmDisplayOrderFilterByLockedSelect_notLocked");
    notLockedOption.setAttribute('value', "NOT_LOCKED");
    notLockedOption.appendChild( document.createTextNode(notLockedOptionText) );
    filterIdentitiesByLockedSelect.appendChild(notLockedOption);
  }



  populateFilterByAccountDefaultSelectUI() {
    const filterIdentitiesByAccountDefaultSelect = document.getElementById("idmDisplayOrderFilterByAccountDefaultSelect");
    filterIdentitiesByAccountDefaultSelect.innerHTML = '';

    const anyAccountDefaultOption     = document.createElement('option');
    const anyAccountDefaultOptionText = getI18nMsg("options_idmDisplayOrderFilterByAccountDefaultSelect_any");
    anyAccountDefaultOption.setAttribute('value', "");
    anyAccountDefaultOption.appendChild( document.createTextNode(anyAccountDefaultOptionText) );
    filterIdentitiesByAccountDefaultSelect.appendChild(anyAccountDefaultOption);

    const accountDefaultOption     = document.createElement('option');
    const accountDefaultOptionText = getI18nMsg("options_idmDisplayOrderFilterByAccountDefaultSelect_accountDefault");
    accountDefaultOption.setAttribute('value', "DEFAULT");
    accountDefaultOption.appendChild( document.createTextNode(accountDefaultOptionText) );
    filterIdentitiesByAccountDefaultSelect.appendChild(accountDefaultOption);

    const notAccountDefaultOption     = document.createElement('option');
    const notAccountDefaultOptionText = getI18nMsg("options_idmDisplayOrderFilterByAccountDefaultSelect_notAccountDefault");
    notAccountDefaultOption.setAttribute('value', "NOT_DEFAULT");
    notAccountDefaultOption.appendChild( document.createTextNode(notAccountDefaultOptionText) );
    filterIdentitiesByAccountDefaultSelect.appendChild(notAccountDefaultOption);
  }



  populateFilterByCollectedSelectUI() {
    const filterIdentitiesByCollectedSelect = document.getElementById("idmDisplayOrderFilterByCollectedSelect");
    filterIdentitiesByCollectedSelect.innerHTML = '';

    const anyCollectedOption     = document.createElement('option');
    const anyCollectedOptionText = getI18nMsg("options_idmDisplayOrderFilterByCollectedSelect_any");
    anyCollectedOption.setAttribute('value', "");
    anyCollectedOption.appendChild( document.createTextNode(anyCollectedOptionText) );
    filterIdentitiesByCollectedSelect.appendChild(anyCollectedOption);

    const collectedOption     = document.createElement('option');
    const collectedOptionText = getI18nMsg("options_idmDisplayOrderFilterByCollectedSelect_collected");
    collectedOption.setAttribute('value', "COLLECTED");
    collectedOption.appendChild( document.createTextNode(collectedOptionText) );
    filterIdentitiesByCollectedSelect.appendChild(collectedOption);

    const notCollectedOption     = document.createElement('option');
    const notCollectedOptionText = getI18nMsg("options_idmDisplayOrderFilterByCollectedSelect_notCollected");
    notCollectedOption.setAttribute('value', "NOT_COLLECTED");
    notCollectedOption.appendChild( document.createTextNode(notCollectedOptionText) );
    filterIdentitiesByCollectedSelect.appendChild(notCollectedOption);
  }



  populateFilterByShowInMenuSelectUI() {
    const filterIdentitiesByShowInMenuSelect = document.getElementById("idmDisplayOrderFilterByShowInMenuSelect");
    filterIdentitiesByShowInMenuSelect.innerHTML = '';

    const anyShowInMenuOption     = document.createElement('option');
    const anyShowInMenuOptionText = getI18nMsg("options_idmDisplayOrderFilterByShowInMenuSelect_any");
    anyShowInMenuOption.setAttribute('value', "");
    anyShowInMenuOption.appendChild( document.createTextNode(anyShowInMenuOptionText) );
    filterIdentitiesByShowInMenuSelect.appendChild(anyShowInMenuOption);

    const showOption     = document.createElement('option');
    const showOptionText = getI18nMsg("options_idmDisplayOrderFilterByShowInMenuSelect_show");
    showOption.setAttribute('value', "SHOW");
    showOption.appendChild( document.createTextNode(showOptionText) );
    filterIdentitiesByShowInMenuSelect.appendChild(showOption);

    const hideOption     = document.createElement('option');
    const hideOptionText = getI18nMsg("options_idmDisplayOrderFilterByShowInMenuSelect_hide");
    hideOption.setAttribute('value', "HIDE");
    hideOption.appendChild( document.createTextNode(hideOptionText) );
    filterIdentitiesByShowInMenuSelect.appendChild(hideOption);
  }



  async checkAccessGrantedToFileSystemBroker() {
    var   isAccessGranted  = false;
    var   isAccessReadOnly = false;
    const fsBrokerApi      = new FileSystemBrokerAPI();
    const response         = await fsBrokerApi.access();

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

  async updateUIForFileSystemBrokerAccess() {
    // also stores to this.#fileSystemBrokerAccessGranted and this.#fileSystemBrokerAccessReadOnly;
    const response = await this.checkAccessGrantedToFileSystemBroker();

    if (response.granted) {
      // nothing to do
      this.debug("-- ACCESS TO FileSystemBroker is GRANTED -- nothing to do");
    } else {
      // disable buttons for things that require FileSystemBroker - or hide them???
      const showBackupManagerBtn         = document.getElementById("idmShowBackupManagerButton");
      const importIdentitiesBtn          = document.getElementById("idmImportIdentitiesButton");
      const tooltip_showBackupManagerBtn = getI18nMsg( "options_idmExtensionOptionsButtonBackupManager_noAccess.tooltip", "" );
      const tooltip_importIdentitiesBtn  = getI18nMsg( "options_idmImportIdentitiesButton_noAccess.tooltip",             "" );

      showBackupManagerBtn.disabled = true;
      importIdentitiesBtn.disabled  = true;

      showBackupManagerBtn.setAttribute( 'title', tooltip_showBackupManagerBtn );
      importIdentitiesBtn.setAttribute(  'title', tooltip_importIdentitiesBtn  );
    }
  }



  async buildIdentitiesListUI(e) { // the event is not used - is it even useful?
    this.debug("-- start");

    await this.initAllIdentityFilters(); // clears filters!!!
    await this.clearFilterPanelMessages();
    await this.clearDisplayOrderMessages();

    // a (small) cache of options
    this.#option_displayIdentityPosition = await this.#idmOptionsApi.isEnabledOption( "idmDisplayIdentityPositionInDisplayOrder", false );
    this.#option_displayIdentityIndex    = await this.#idmOptionsApi.isEnabledOption( "idmDisplayIdentityIndexInDisplayOrder",    false );
    this.#option_displayIdentityId       = await this.#idmOptionsApi.isEnabledOption( "idmDisplayIdentityIdInDisplayOrder",       false );

    const domIdentityDisplayOrderList = document.getElementById("idmIdentityDisplayOrderList");

    // Empty the any current Identities List and add the "Loading Identities List" DIV
    domIdentityDisplayOrderList.innerHTML = '';
    const i18nMessage = getI18nMsg("options_identitiesLoadingMessage", "...");
    const loadingTR = document.createElement('tr');
      const loadingTD = document.createElement('td');
        loadingTD.classList.add("loading-data-text");
        loadingTD.appendChild( document.createTextNode(i18nMessage) );
      loadingTR.appendChild(loadingTD);
    domIdentityDisplayOrderList.appendChild(loadingTR);

    // disable buttons that require something to be selected
    this.enableDisableButtonsOnSelectionChanged();

    const idmIdentities = await this.#idmIdentitiesApi.getIdmIdentities();
    const borderColors  = await this.#borderColorsApi.getAllColors(); // need to keep getting this as BorderColors-D maybe have changed its colors


    this.debug("-- building Identity Display Order list, length=" + idmIdentities.length);
    this.#totalIdentityCount    = idmIdentities.length;
    this.#filteredIdentityCount = -1;
    await this.updateMessageCountsUI();

    // Remove the "Loading Identities List" DIV and build the actual List UI
    domIdentityDisplayOrderList.innerHTML = '';

    const headerTR = this.buildIdentityListHeaderUI(borderColors);
    domIdentityDisplayOrderList.appendChild(headerTR);

    var displayOrderIndex = 0; // strangely, due to gaps in arrays, etc, this could be different from positionInMenu from IdentitiesExtendedProps

    for (const idmIdentity of idmIdentities) {
      this.debug("-- adding Identity at position", displayOrderIndex, idmIdentity.label, idmIdentity.email);

      const domIdentityTR = this.buildIdentityListItemUI(idmIdentity, displayOrderIndex, borderColors);

      // Add row to identity list
      domIdentityDisplayOrderList.appendChild(domIdentityTR);

      this.debug("-- finished adding IDentity at position", displayOrderIndex, idmIdentity.label, idmIdentity.email);

      displayOrderIndex++;
    }

    this.debug("-- finished building Identity Display Order list");



    // Set Up Sortable.js
    //
    // Unused Callbacks:
    // - onunChoose:      (e) => this.XXX(e), */              // Element is unchosen 
    // - onStart:         (e) => this.XXX(e), */              // Element dragging started 
    // - onAdd:           (e) => this.XXX(e), */              // Element is dropped into the list from another list 
    // - onSort:          (e) => this.XXX(e), */              // Called by any change to the list (add / update / remove) 
    // - onRemove:        (e) => this.XXX(e), */              // Element is removed from the list into another list 
    // - onClone:         (e) => this.XXX(e), */              // Called when creating a clone of element
    // - onChange:        (e) => this.XXX(e), */              // Called when dragging element changes position 

    new Sortable(domIdentityDisplayOrderList, {   // this is where we setup Sortable on the Display Order List
      animation:       150,                                   // ms, animation speed moving items when sorting, `0` — without animation
      filter:          ".lock-in-menu",                       // Selectors that do not lead to dragging (String or Function) (From, Item, & To are <TABLE>)
      preventOnFilter: true,                                  // Call `event.preventDefault()` when triggered `filter`
      draggable:       ".identity-item-draggable",            // Specifies which items inside the element should be draggable // apparently works only one level deep????
//   	ghostClass:      "sortable-ghost",                      // Class name for the drop placeholder
      chosenClass:     "sortable-chosen",                     // Class name for the chosen item
      dragClass:       "sortable-drag",                       // Class name for the dragging item
      onChoose:        (e)     => this.identityChosen(e),     // Element is chosen  (From, Item, & To are <TABLE>)
      onEnd:           (e)     => this.identityDragEnded(e),  // Element dragging ended (From, Item, & To are <TABLE>)
      onFilter:        (e)     => this.filterIdentity(e),     // Attempt to drag a filtered element
      onMove:          (e, oe) => this.identityMoved(e, oe),  // Event when you move an item in the list or between lists (From, Item, To are <TABLE>, Dragged, Related are <TR>)
      onUpdate:        (e)     => this.identitiesReordered(e) // Changed sorting within list 
    });

    this.debug("-- end");
  }



  buildIdentityListHeaderUI(borderColors) {
    const headerTR = document.createElement('tr');
    headerTR.classList.add("identity-list-header");                    // identity-list-header
    headerTR.addEventListener('click', (e) => this.identityHeaderClicked(e), true);    // <====== NOTE: event "capturing" phase

    const headerControlsLeftTH = document.createElement('th');
      headerControlsLeftTH.classList.add("header-controls-left");      // identity-list-header > header-controls-left
      //#listHeader_text_controlsLeft
      headerControlsLeftTH.setAttribute("title", this.#listHeader_tooltip_controlsLeft);
    headerTR.appendChild(headerControlsLeftTH);

    // if we have access to borderColors, add the color dot
    if (borderColors !== null) {
      const headerBorderColorsTH = document.createElement('th');
        headerBorderColorsTH.classList.add("header-item");             // identity-list-header > header-item
        headerBorderColorsTH.classList.add("header-border-color");     // identity-list-header > header-border-color
        headerBorderColorsTH.classList.add("dummy-icon");              // identity-list-header > dummy-icon
        //#listHeader_text_identityColor
        headerBorderColorsTH.setAttribute("title", this.#listHeader_tooltip_identityColor);
        const dotSPAN = document.createElement('span');
          dotSPAN.classList.add("header-border-color-dot");            // identity-list-header > header-border-color > header-border-color-dot
        headerBorderColorsTH.appendChild(dotSPAN);
      headerTR.appendChild(headerBorderColorsTH);
    }

    const headerAccountTH = document.createElement('th');
      headerAccountTH.classList.add("header-item");                    // identity-list-header > header-item
      headerAccountTH.classList.add("header-account");                 // identity-list-header > header-account
      headerAccountTH.setAttribute("id", "identityListHeaderAccount");
      headerAccountTH.setAttribute("sortBy", IdmOptions.IDENTITY_AUTO_SORT_BY_VALUE_ACCOUNT);
      headerAccountTH.setAttribute("title", this.#listHeader_tooltip_account);
      const headerAccountDIV = document.createElement('div');
        headerAccountDIV.classList.add("header-data");                 // identity-list-header > header-item > header-data
        const headerAccountSortDIV = document.createElement('div');
          headerAccountSortDIV.classList.add("header-sort");           // identity-list-header > header-item > header-data > header-sort
          const accountSortUpButton = document.createElement('button');
            accountSortUpButton.classList.add("header-button");        // identity-list-header > header-item > header-data > header-sort > header-button
            accountSortUpButton.classList.add("sort-button");          // identity-list-header > header-item > header-item > header-sort > sort-button
            accountSortUpButton.classList.add("sort-ascending");       // identity-list-header > header-item > header-item > header-sort > sort-ascending
            accountSortUpButton.classList.add("icon-button");          // identity-list-header > header-item > header-data > header-sort > icon-button
            accountSortUpButton.classList.add("icon-only");            // identity-list-header > header-item > header-data > header-sort > icon-only
            accountSortUpButton.classList.add("no-css");               // keep my userContent-css from messing with this
            accountSortUpButton.setAttribute("title", this.#listHeader_tooltip_sortBy_accountId_ascending);
            accountSortUpButton.addEventListener('click', (e) => this.identityListHeaderControlClicked(e));
          headerAccountSortDIV.appendChild(accountSortUpButton);
          const accountSortDownButton = document.createElement('button');
            accountSortDownButton.classList.add("header-button");      // identity-list-header > header-item > header-data > header-sort > header-button
            accountSortDownButton.classList.add("sort-button");        // identity-list-header > header-item > header-item > header-sort > sort-button
            accountSortDownButton.classList.add("sort-descending");    // identity-list-header > header-item > header-item > header-sort > sort-descending
            accountSortDownButton.classList.add("icon-button");        // identity-list-header > header-item > header-data > header-sort > icon-button
            accountSortDownButton.classList.add("icon-only");          // identity-list-header > header-item > header-data > header-sort > icon-only
            accountSortDownButton.classList.add("no-css");             // keep my userContent-css from messing with this
            accountSortDownButton.setAttribute("title", this.#listHeader_tooltip_sortBy_accountId_descending);
            accountSortDownButton.addEventListener('click', (e) => this.identityListHeaderControlClicked(e));
          headerAccountSortDIV.appendChild(accountSortDownButton);
        headerAccountDIV.appendChild(headerAccountSortDIV);
        const headerAccountTextSPAN = document.createElement('span');
          headerAccountTextSPAN.classList.add("header-text");          // identity-list-header > header-data > header-text
          headerAccountTextSPAN.appendChild( document.createTextNode(this.#listHeader_text_account) );
        headerAccountDIV.appendChild(headerAccountTextSPAN);
        const headerAccountSpaceSPAN = document.createElement('span');
          headerAccountSpaceSPAN.classList.add("header-space");        // identity-list-header > header-data > header-space
        headerAccountDIV.appendChild(headerAccountSpaceSPAN);
      headerAccountTH.appendChild(headerAccountDIV);
    headerTR.appendChild(headerAccountTH);

    const headerLabelTH = document.createElement('th');
      headerLabelTH.classList.add("header-item");                    // identity-list-header > header-item
      headerLabelTH.classList.add("header-label");                   // identity-list-header > header-label
      headerLabelTH.setAttribute("id", "identityListHeaderLabel");
      headerLabelTH.setAttribute("sortBy", IdmOptions.IDENTITY_AUTO_SORT_BY_VALUE_NAME);
      headerLabelTH.setAttribute("title", this.#listHeader_tooltip_nameAndLabel);
      const headerLabelDIV = document.createElement('div');
        headerLabelDIV.classList.add("header-data");                 // identity-list-header > header-data
        const headerLabelSortDIV = document.createElement('div');
          headerLabelSortDIV.classList.add("header-sort");           // identity-list-header > header-item > header-data > header-sort
          const labelSortUpButton = document.createElement('button');
            labelSortUpButton.classList.add("header-button");        // identity-list-header > header-item > header-data > header-sort > header-button
            labelSortUpButton.classList.add("sort-button");          // identity-list-header > header-item > header-item > header-sort > sort-button
            labelSortUpButton.classList.add("sort-ascending");       // identity-list-header > header-item > header-item > header-sort > sort-ascending
            labelSortUpButton.classList.add("icon-button");          // identity-list-header > header-item > header-data > header-sort > icon-button
            labelSortUpButton.classList.add("icon-only");            // identity-list-header > header-item > header-data > header-sort > icon-only
            labelSortUpButton.classList.add("no-css");               // keep my userContent-css from messing with this
            labelSortUpButton.setAttribute("title", this.#listHeader_tooltip_sortBy_nameAndLabel_ascending);
            labelSortUpButton.addEventListener('click', (e) => this.identityListHeaderControlClicked(e));
          headerLabelSortDIV.appendChild(labelSortUpButton);
          const labelSortDownButton = document.createElement('button');
            labelSortDownButton.classList.add("header-button");      // identity-list-header > header-item > header-data > header-sort > header-button
            labelSortDownButton.classList.add("sort-button");        // identity-list-header > header-item > header-item > header-sort > sort-button
            labelSortDownButton.classList.add("sort-descending");    // identity-list-header > header-item > header-item > header-sort > sort-descending
            labelSortDownButton.classList.add("icon-button");        // identity-list-header > header-item > header-data > header-sort > icon-button
            labelSortDownButton.classList.add("icon-only");          // identity-list-header > header-item > header-data > header-sort > icon-only
            labelSortDownButton.classList.add("no-css");             // keep my userContent-css from messing with this
            labelSortDownButton.setAttribute("title", this.#listHeader_tooltip_sortBy_nameAndLabel_descending);
            labelSortDownButton.addEventListener('click', (e) => this.identityListHeaderControlClicked(e));
          headerLabelSortDIV.appendChild(labelSortDownButton);
        headerLabelDIV.appendChild(headerLabelSortDIV);
        const headerLabelTextSPAN = document.createElement('span');
          headerLabelTextSPAN.classList.add("header-text");          // identity-list-header > header-data > header-text
          headerLabelTextSPAN.appendChild( document.createTextNode(this.#listHeader_text_nameAndLabel) );
        headerLabelDIV.appendChild(headerLabelTextSPAN);
        const headerLabelSpaceSPAN = document.createElement('span');
          headerLabelSpaceSPAN.classList.add("header-space");        // identity-list-header > header-data > header-space
        headerLabelDIV.appendChild(headerLabelSpaceSPAN);
      headerLabelTH.appendChild(headerLabelDIV);
    headerTR.appendChild(headerLabelTH);

    const headerEmailTH = document.createElement('th');
      headerEmailTH.classList.add("header-item");                            // identity-list-header > header-item
      headerEmailTH.classList.add("header-email");                           // identity-list-header > header-email
      headerEmailTH.setAttribute("id", "identityListHeaderEmail");
      headerEmailTH.setAttribute("sortBy", IdmOptions.IDENTITY_AUTO_SORT_BY_VALUE_EMAIL);
      headerEmailTH.setAttribute("title", this.#listHeader_tooltip_email);
      const headerEmailDIV = document.createElement('div');
        headerEmailDIV.classList.add("header-data");                         // identity-list-header > header-data
        const headerEmailSortDIV = document.createElement('div');
          headerEmailSortDIV.classList.add("header-sort");           // identity-list-header > header-item > header-data > header-sort
          const emailSortUpButton = document.createElement('button');
            emailSortUpButton.classList.add("header-button");        // identity-list-header > header-item > header-data > header-sort > header-button
            emailSortUpButton.classList.add("sort-button");          // identity-list-header > header-item > header-item > header-sort > sort-button
            emailSortUpButton.classList.add("sort-ascending");       // identity-list-header > header-item > header-item > header-sort > sort-ascending
            emailSortUpButton.classList.add("icon-button");          // identity-list-header > header-item > header-data > header-sort > icon-button
            emailSortUpButton.classList.add("icon-only");            // identity-list-header > header-item > header-data > header-sort > icon-only
            emailSortUpButton.classList.add("no-css");               // keep my userContent-css from messing with this
            emailSortUpButton.setAttribute("title", this.#listHeader_tooltip_sortBy_email_ascending);
            emailSortUpButton.addEventListener('click', (e) => this.identityListHeaderControlClicked(e));
          headerEmailSortDIV.appendChild(emailSortUpButton);
          const emailSortDownButton = document.createElement('button');
            emailSortDownButton.classList.add("header-button");      // identity-list-header > header-item > header-data > header-sort > header-button
            emailSortDownButton.classList.add("sort-button");        // identity-list-header > header-item > header-item > header-sort > sort-button
            emailSortDownButton.classList.add("sort-descending");    // identity-list-header > header-item > header-item > header-sort > sort-descending
            emailSortDownButton.classList.add("icon-button");        // identity-list-header > header-item > header-data > header-sort > icon-button
            emailSortDownButton.classList.add("icon-only");          // identity-list-header > header-item > header-data > header-sort > icon-only
            emailSortDownButton.classList.add("no-css");             // keep my userContent-css from messing with this
            emailSortDownButton.setAttribute("title", this.#listHeader_tooltip_sortBy_email_descending);
            emailSortDownButton.addEventListener('click', (e) => this.identityListHeaderControlClicked(e));
          headerEmailSortDIV.appendChild(emailSortDownButton);
        headerEmailDIV.appendChild(headerEmailSortDIV);
        const headerEmailTextSPAN = document.createElement('span');
          headerEmailTextSPAN.classList.add("header-text");          // identity-list-header > header-data > header-text
          headerEmailTextSPAN.appendChild( document.createTextNode(this.#listHeader_text_email) );
        headerEmailDIV.appendChild(headerEmailTextSPAN);
        const headerEmailSpaceSPAN = document.createElement('span');
          headerEmailSpaceSPAN.classList.add("header-space");        // identity-list-header > header-data > header-space
        headerEmailDIV.appendChild(headerEmailSpaceSPAN);
      headerEmailTH.appendChild(headerEmailDIV);
    headerTR.appendChild(headerEmailTH);

    if (this.#option_displayIdentityPosition) {
      const headerPosTH = document.createElement('th');
        headerPosTH.classList.add("header-item");                    // identity-list-header > header-item
        headerPosTH.classList.add("header-pos");                     // identity-list-header > header-pos
        headerPosTH.setAttribute("id", "identityListHeaderPos");
        headerPosTH.setAttribute("title", this.#listHeader_tooltip_pos);
        const headerPosDIV = document.createElement('div');
          headerPosDIV.classList.add("header-data");                 // identity-list-header > header-data
//        const headerPosSortSPAN = document.createElement('span');
//          headerPosSortSPAN.classList.add("header-space");         // identity-list-header > header-data > header-space
//        headerPosDIV.appendChild(headerPosSortSPAN);
          const headerPosTextSPAN = document.createElement('span');
            headerPosTextSPAN.classList.add("header-text");          // identity-list-header > header-data > header-text
            headerPosTextSPAN.appendChild( document.createTextNode(this.#listHeader_text_pos) );
          headerPosDIV.appendChild(headerPosTextSPAN);
//        const headerPosSpaceSPAN = document.createElement('span');
//          headerPosSpaceSPAN.classList.add("header-space");        // identity-list-header > header-data > header-space
//        headerPosDIV.appendChild(headerPosSpaceSPAN);
        headerPosTH.appendChild(headerPosDIV);
      headerTR.appendChild(headerPosTH);
    }

    if (this.#option_displayIdentityIndex) {
      const headerIndexTH = document.createElement('th');
        headerIndexTH.classList.add("header-item");                  // identity-list-header > header-item
        headerIndexTH.classList.add("header-index");                 // identity-list-header > header-index
        headerIndexTH.setAttribute("id", "identityListHeaderIndex");
        headerIndexTH.setAttribute("title", this.#listHeader_tooltip_index);
        const headerIndexDIV = document.createElement('div');
          headerIndexDIV.classList.add("header-data");               // identity-list-header > header-data
//        const headerIndexSortSPAN = document.createElement('span');
//          headerIndexSortSPAN .classList.add("header-space");      // identity-list-header > header-data > header-space
//        headerIndexDIV.appendChild(headerIndexSortSPAN);
          const headerIndexTextSPAN = document.createElement('span');
            headerIndexTextSPAN.classList.add("header-text");        // identity-list-header > header-data > header-text
            headerIndexTextSPAN.appendChild( document.createTextNode(this.#listHeader_text_index) );
          headerIndexDIV.appendChild(headerIndexTextSPAN);
//        const headerIndexSpaceSPAN = document.createElement('span');
//          headerIndexSpaceSPAN.classList.add("header-space");      // identity-list-header > header-data > header-space
//        headerIndexDIV.appendChild(headerIndexSpaceSPAN);
        headerIndexTH.appendChild(headerIndexDIV);
      headerTR.appendChild(headerIndexTH);
    }

    if (this.#option_displayIdentityId) {
      const headerIdTH = document.createElement('th');
        headerIdTH.classList.add("header-item");                     // identity-list-header > header-item
        headerIdTH.classList.add("header-id");                       // identity-list-header > header-id
        headerIdTH.setAttribute("id", "identityListHeaderId");
        headerIdTH.setAttribute("sortBy", IdmOptions.IDENTITY_AUTO_SORT_BY_VALUE_ID);
        headerIdTH.setAttribute("title", this.#listHeader_tooltip_id);
        const headerIdDIV = document.createElement('div');
          headerIdDIV.classList.add("header-data");                  // identity-list-header > header-data
          const headerIdSortDIV = document.createElement('div');
            headerIdSortDIV.classList.add("header-sort");            // identity-list-header > header-item > header-data > header-sort
            const idSortUpButton = document.createElement('button');
              idSortUpButton.classList.add("header-button");         // identity-list-header > header-item > header-data > header-sort > header-button
              idSortUpButton.classList.add("sort-button");           // identity-list-header > header-item > header-item > header-sort > sort-button
              idSortUpButton.classList.add("sort-ascending");        // identity-list-header > header-item > header-item > header-sort > sort-ascending
              idSortUpButton.classList.add("icon-button");           // identity-list-header > header-item > header-data > header-sort > icon-button
              idSortUpButton.classList.add("icon-only");             // identity-list-header > header-item > header-data > header-sort > icon-only
              idSortUpButton.classList.add("no-css");                // keep my userContent-css from messing with this
              idSortUpButton.setAttribute("title", this.#listHeader_tooltip_sortBy_id_ascending);
              idSortUpButton.addEventListener('click', (e) => this.identityListHeaderControlClicked(e));
            headerIdSortDIV.appendChild(idSortUpButton);
            const idSortDownButton = document.createElement('button');
              idSortDownButton.classList.add("header-button");       // identity-list-header > header-item > header-data > header-sort > header-button
              idSortDownButton.classList.add("sort-button");         // identity-list-header > header-item > header-item > header-sort > sort-button
              idSortDownButton.classList.add("sort-descending");     // identity-list-header > header-item > header-item > header-sort > sort-descending
              idSortDownButton.classList.add("icon-button");         // identity-list-header > header-item > header-data > header-sort > icon-button
              idSortDownButton.classList.add("icon-only");           // identity-list-header > header-item > header-data > header-sort > icon-only
              idSortDownButton.classList.add("no-css");              // keep my userContent-css from messing with this
              idSortDownButton.setAttribute("title", this.#listHeader_tooltip_sortBy_id_descending);
              idSortDownButton.addEventListener('click', (e) => this.identityListHeaderControlClicked(e));
            headerIdSortDIV.appendChild(idSortDownButton);
          headerIdDIV.appendChild(headerIdSortDIV);
          const headerIdTextSPAN = document.createElement('span');
            headerIdTextSPAN.classList.add("header-text");           // identity-list-header > header-data > header-text
            headerIdTextSPAN.appendChild( document.createTextNode(this.#listHeader_text_id) );
          headerIdDIV.appendChild(headerIdTextSPAN);
          const headerIdSpaceSPAN = document.createElement('span');
            headerIdSpaceSPAN.classList.add("header-space")          // identity-list-header > header-data > header-space;
          headerIdDIV.appendChild(headerIdSpaceSPAN);
        headerIdTH.appendChild(headerIdDIV);
      headerTR.appendChild(headerIdTH);
    }

    // Create controls-right element and add it to the row
    const headerControlsRightTH = document.createElement('th');
      headerControlsRightTH.classList.add("header-controls-right");    // identity-list-header > header-controls-right
      //#listHeader_text_controlsRight
      headerControlsRightTH.setAttribute("title", this.#listHeader_tooltip_controlsRight);

      // Create lock-in-menu checkbox AND label inside a SPAN and add it to the CELL
      // In CSS, We set the checkbox to display:none and set a background-image for the label to make an "image checkbox"
      // If you change classes identity-item-check or lock-in-menu, then identityOptionCheckClicked() will stop working
      const lockInMenuControlsSPAN = document.createElement('span');
        lockInMenuControlsSPAN.classList.add("lock-in-menu-controls"); // identity-list-header > header-controls-right > lock-in-menu-controls

        const lockInMenuCheck = document.createElement('input');
          lockInMenuCheck.setAttribute('type', 'checkbox');
          lockInMenuCheck.classList.add("identity-item-check");        // identity-list-header > header-controls-right > lock-in-menu-controls > identity-item-check
          lockInMenuCheck.classList.add("dummy-icon");                 // identity-list-header > header-controls-right > lock-in-menu-controls > dummy-icon
          lockInMenuCheck.classList.add("icon-button");                // identity-list-header > header-controls-right > lock-in-menu-controls > icon-button
          lockInMenuCheck.classList.add("icon-only");                  // identity-list-header > header-controls-right > lock-in-menu-controls > icon-only
          lockInMenuCheck.classList.add("lock-in-menu-check");         // identity-list-header > header-controls-right > lock-in-menu-controls > lock-in-menu-check
          lockInMenuCheck.setAttribute('id', "headerLockInMenu");
//        lockInMenuCheck.addEventListener('change', (e) => this.identityOptionCheckClicked(e), true); // <====== NOTE: true=event "capturing" phase
//        if (this.#tooltip_check_lockInMenu) lockInMenuCheck.setAttribute('title', this.#tooltip_check_lockInMenu);
          lockInMenuCheck.disabled = true;
        lockInMenuControlsSPAN.appendChild(lockInMenuCheck);

        const lockInMenuLabel = document.createElement('label');
          lockInMenuLabel.classList.add("lock-in-menu-label");         // identity-list-header > header-controls-right > lock-in-menu-controls > lock-in-menu-label
          lockInMenuLabel.classList.add("dummy-icon");                 // identity-list-header > header-controls-right > lock-in-menu-controls > dummy-icon
          lockInMenuLabel.setAttribute('for', "headerLockInMenu");     // IMPORTANT: the 'id' attribute for the checkbox and the 'for' attribute for the label MUST MATCH
//        lockInMenuLabel.addEventListener('click', (e) => this.identityOptionCheckClicked(e), true); // <====== NOTE: true=event "capturing" phase
//        if (this.#tooltip_check_lockInMenu) lockInMenuLabel.setAttribute('title', this.#tooltip_check_lockInMenu);
        lockInMenuControlsSPAN.appendChild(lockInMenuLabel);
      headerControlsRightTH.appendChild(lockInMenuControlsSPAN);

      const moveUpDownControlsDIV = document.createElement('div');
        moveUpDownControlsDIV.classList.add("identity-item-controls-panel"); // identity-list-header > header-controls-right > identity-item-controls-panel
        moveUpDownControlsDIV.classList.add("move-up-down-controls");        // identity-list-header > header-controls-right > move-up-down-controls

        const moveUpButton = document.createElement('button');
          moveUpButton.classList.add("identity-item-button");          // identity-list-header > header-controls-right > move-up-down-controls > identity-item-button
          moveUpButton.classList.add("dummy-icon");                    // identity-list-header > header-controls-right > move-up-down-controls > dummy-icon
          moveUpButton.classList.add("icon-button");                   // identity-list-header > header-controls-right > move-up-down-controls > icon-button
          moveUpButton.classList.add("icon-only");                     // identity-list-header > header-controls-right > move-up-down-controls > icon-only
          moveUpButton.classList.add("stacked-icon");                  // identity-list-header > header-controls-right > move-up-down-controls > stacked-icon
          moveUpButton.classList.add("move-identity-button");          // identity-list-header > header-controls-right > move-up-down-controls > move-identity-button
          moveUpButton.classList.add("move-identity-up");              // identity-list-header > header-controls-right > move-up-down-controls > move-identity-up
          moveUpButton.classList.add("no-css");                        // keep my userContent-css from messing with this
          moveUpButton.setAttribute("id", "headerMoveUp");
//        moveUpButton.addEventListener('click', (e) => this.identityControlButtonClicked(e), true); // <====== NOTE: event "capturing" phase
//        if (this.#tooltip_button_moveUp) moveUpButton.setAttribute('title', this.#tooltip_button_moveUp);
          moveUpButton.disabled = true;
        moveUpDownControlsDIV.appendChild(moveUpButton);

        const moveDownButton = document.createElement('button');
          moveDownButton.classList.add("identity-item-button");        // identity-list-header > header-controls-right > move-up-down-controls > identity-item-button
          moveDownButton.classList.add("dummy-icon");                  // identity-list-header > header-controls-right > move-up-down-controls > dummy-icon
          moveDownButton.classList.add("icon-button");                 // identity-list-header > header-controls-right > move-up-down-controls > icon-button
          moveDownButton.classList.add("icon-only");                   // identity-list-header > header-controls-right > move-up-down-controls > icon-only
          moveDownButton.classList.add("stacked-icon");                // identity-list-header > header-controls-right > move-up-down-controls > stacked-icon
          moveDownButton.classList.add("move-identity-button");        // identity-list-header > header-controls-right > move-up-down-controls > move-identity-button
          moveDownButton.classList.add("move-identity-down");          // identity-list-header > header-controls-right > move-up-down-controls > move-identity-down
          moveDownButton.classList.add("no-css");                      // keep my userContent-css from messing with this
          moveDownButton.setAttribute("id", "headerMoveDown");
//        moveDownButton.addEventListener('click', (e) => this.identityControlButtonClicked(e), true); // <====== NOTE: event "capturing" phase
//        if (this.#tooltip_button_moveDown) moveDownButton.setAttribute('title', this.#tooltip_button_moveDown);
          moveDownButton.disabled = true;
        moveUpDownControlsDIV.appendChild(moveDownButton);
      headerControlsRightTH.appendChild(moveUpDownControlsDIV);

      const moveTopBottomControlsDIV = document.createElement('div');
        moveTopBottomControlsDIV.classList.add("identity-item-controls-panel"); // identity-list-header > header-controls-right > identity-item-controls-panel
        moveTopBottomControlsDIV.classList.add("move-to-controls");             // identity-list-header > header-controls-right > move-to-controls

        const moveTopButton = document.createElement('button');
          moveTopButton.classList.add("identity-item-button");         // identity-list-header > header-controls-right > move-to-controls > identity-item-button
          moveTopButton.classList.add("dummy-icon");                   // identity-list-header > header-controls-right > move-to-controls > dummy-icon
          moveTopButton.classList.add("icon-button");                  // identity-list-header > header-controls-right > move-to-controls > icon-button
          moveTopButton.classList.add("icon-only");                    // identity-list-header > header-controls-right > move-to-controls > icon-only
          moveTopButton.classList.add("stacked-icon");                 // identity-list-header > header-controls-right > move-to-controls > stacked-icon
          moveTopButton.classList.add("move-identity-button");         // identity-list-header > header-controls-right > move-to-controls > move-identity-button
          moveTopButton.classList.add("move-identity-to-top");         // identity-list-header > header-controls-right > move-to-controls > move-identity-to-top
          moveTopButton.classList.add("no-css");                       // keep my userContent-css from messing with this
//        moveTopButton.addEventListener('click', (e) => this.identityControlButtonClicked(e));
//        if (this.#tooltip_button_moveToTop) moveTopButton.setAttribute('title', this.#tooltip_button_moveToTop);
          moveTopButton.disabled = true;
        moveTopBottomControlsDIV.appendChild(moveTopButton);

        const moveBottomButton = document.createElement('button');
          moveBottomButton.classList.add("identity-item-button");      // identity-list-header > header-controls-right > move-to-controls > identity-item-button
          moveBottomButton.classList.add("dummy-icon");                // identity-list-header > header-controls-right > move-to-controls > dummy-icon
          moveBottomButton.classList.add("icon-button");               // identity-list-header > header-controls-right > move-to-controls > icon-button
          moveBottomButton.classList.add("icon-only");                 // identity-list-header > header-controls-right > move-to-controls > icon-only
          moveBottomButton.classList.add("stacked-icon");              // identity-list-header > header-controls-right > move-to-controls > stacked-icon
          moveBottomButton.classList.add("move-identity-button");      // identity-list-header > header-controls-right > move-to-controls > move-identity-button
          moveBottomButton.classList.add("move-identity-to-bottom");   // identity-list-header > header-controls-right > move-to-controls > move-identity-to-bottom
          moveBottomButton.classList.add("no-css");                    // keep my userContent-css from messing with this
//        moveBottomButton.addEventListener('click', (e) => this.identityControlButtonClicked(e), true); // <====== NOTE: event "capturing" phase
//        if (this.#tooltip_button_moveToBottom) moveBottomButton.setAttribute('title', this.#tooltip_button_moveToBottom);
          moveBottomButton.disabled = true;
        moveTopBottomControlsDIV.appendChild(moveBottomButton);
      headerControlsRightTH.appendChild(moveTopBottomControlsDIV);

      const editControlsDIV = document.createElement('div');
        editControlsDIV.classList.add("identity-item-controls-panel"); // identity-list-header > header-controls-right > identity-item-controls-panel
        editControlsDIV.classList.add("edit-controls");                // identity-list-header > header-controls-right > edit-controls

        const createButton = document.createElement('button');
          createButton.classList.add("identity-item-button");          // identity-list-header > header-controls-right > edit-controls > identity-item-button
//        createButton.classList.add("dummy-icon");                    // identity-list-header > header-controls-right > edit-controls > dummy-icon
          createButton.classList.add("icon-button");                   // identity-list-header > header-controls-right > edit-controls > icon-button
          createButton.classList.add("icon-only");                     // identity-list-header > header-controls-right > edit-controls > icon-only
          createButton.classList.add("create-identity");               // identity-list-header > header-controls-right > edit-controls > create-identity
          createButton.classList.add("no-css");                        // keep my userContent-css from messing with this
          createButton.addEventListener('click', (e) => this.createIdentity(e));
          if (this.#tooltip_button_create) createButton.setAttribute('title', this.#tooltip_button_create);
//        createButton.disabled = true;
        editControlsDIV.appendChild(createButton);

        const deleteButton = document.createElement('button');
          deleteButton.classList.add("identity-item-button");          // identity-list-header > header-controls-right > edit-controls > identity-item-button
          deleteButton.classList.add("dummy-icon");                    // identity-list-header > header-controls-right > edit-controls > dummy-icon
          deleteButton.classList.add("icon-button");                   // identity-list-header > header-controls-right > edit-controls > icon-button
          deleteButton.classList.add("icon-only");                     // identity-list-header > header-controls-right > edit-controls > icon-only
          deleteButton.classList.add("delete-identity");               // identity-list-header > header-controls-right > edit-controls > delete-identity
          deleteButton.classList.add("no-css");                        // keep my userContent-css from messing with this
//        deleteButton.addEventListener('click', (e) => this.identityControlButtonClicked(e));
//        if (this.#tooltip_button_delete) deleteButton.setAttribute('title', this.#tooltip_button_delete);
          deleteButton.disabled = true;
        editControlsDIV.appendChild(deleteButton);
      headerControlsRightTH.appendChild(editControlsDIV);
    headerTR.appendChild(headerControlsRightTH);

    return headerTR;
  }



  // Build a drag'n'drop row for the given Identity and append it to the END of the Display Order List.
  // selectAndImportIdentities() may call us multiple times, so it passes in borderColors to save us from getting them over and over
  //
  // // Does NOT update positionInMenu
  async appendIdentityItemUI(idmIdentity, borderColors) { // Must be an IdmIdentity, not a messenger.identities.MailIdentity
    if (! borderColors) {
      borderColors = await this.#borderColorsApi.getAllColors(); // need to keep getting this as BorderColors-D maybe have changed its colors
    }
    const domIdentityDisplayOrderList = document.getElementById("idmIdentityDisplayOrderList");

    const domIdentityTR = this.buildIdentityListItemUI( idmIdentity,
                                                        domIdentityDisplayOrderList.childElementCount, // position at the bottom
                                                        borderColors
                                                      );
    domIdentityDisplayOrderList.appendChild(domIdentityTR);
  }



  /* Build a drag'n'drop row for the given IdmIdentity
   *
   * EXAMPLE:
   *    <!--
   *      CLASSES AND ATTRIBUTES FOR <TR>:
   *        - .identity-item
   *        - .identity-item-draggable REQUIRED for Sortable.js !!!
   *
   *        - identityId=id001
   *        - accountId=account001
   *
   *        - selected='true'/'false'
   *        - .not-show-in-menu & showInMenu='true'/'false' 
   *        - .lock-in-menu & lockInMenu='true'/'false'
   *
   *        - .account-default
   *        - .collected-identity
   *        - .imported-identity
   *
   *        - .filter-by-account
   *        - .filter-by-label
   *        - .filter-by-email
   *        - .filter-by-imported
   *        - .filter-by-locked
   *        - .filter-by-default
   *        - .filter-by-collected
   *        - .filter-by-showInMenu
   *    -->
   * 
   *    <tr class="identity-item identity-item-draggable lock-in-menu not-show-in-menu" identityId="id001" showInMenu='true' lockInMenu='false' selected='false'>
   *      <td class="identity-item-controls-left">
   *        <input type='checkbox' class="identity-item-check show-in-menu-check" identityId="id001"/>
   *      </td>
   * 
   *      <td class="identity-item-border-color identity-item-data" style="--bullet_color=XXX; --bullet-border-style=XXX; --bullet-border-color=XXX">
   *        <span class="identity-item-border-color-dot"></span>
   *      </td>
   * 
   *      <td class="identity-item-account identity-item-data">
   *        accountName
   *      </td>
   * 
   *      <td class="identity-item-label identity-item-data">
   *        <span class="identity-item-text identity-item-label-text">
   *          Ex Ample Name (identityLabel)
   *        </span>
   *        <span class="identity-item-markers">
   *          <span class="identity-item-marker marker-account-default"/>  <!-- uses background image -->
   *          <span class="identity-item-marker marker-collected"/>        <!-- uses background image -->
   *          <span class="identity-item-marker marker-imported"/>         <!-- uses background image -->
   *          <span class="identity-item-marker marker-lock-in-menu"/>     <!-- uses background image -->
   *          <span class="identity-item-marker marker-not-show-in-menu"/> <!-- uses background image -->
   *        </span>
   *        </span>
   *      </td>
   * 
   *      <td class="identity-item-email identity-item-data">
   *        ex1@ample.com
   *      </td>
   * 
   *      <td class="identity-item-pos identity-item-data">  <!-- optional -->
   *        0
   *      </td>
   * 
   *      <td class="identity-item-index identity-item-data">  <!-- optional -->
   *        0
   *      </td>
   * 
   *      <td class="identity-item-id identity-item-data">  <!-- optional -->
   *        id001
   *      </td>
   * 
   *      <td class="identity-item-controls-right">
   *        <span class="lock-in-menu-controls"> 
   *          <input type="checkbox" class="icon-button icon-only lock-in-menu-check" id="lockInMenu_id001" identityId="id001"/>
   *          <label for="lockInMenu_id001" class="lock-in-menu-label"></label>
   *        </span>
   *        <div class="identity-controls-panel move-up-down-controls">
   *          <button class="identity-item-button icon-button icon-only stacked-icon move-identity-button move-identity-up" identityId="id001"></button>
   *          <button class="identity-item-button icon-button icon-only stacked-icon move-identity-button move-identity-down" identityId="id001"></button>
   *        </div>
   *        <div class="identity-controls-panel move-to-controls">
   *          <button class="identity-item-button icon-button icon-only stacked-icon move-identity-button move-identity-to-top" identityId="id001"></button>
   *          <button class="identity-item-button icon-button icon-only stacked-icon move-identity-button move-identity-to-bottom" identityId="id001"></button>
   *        </div>
   *        <div class="identity-controls-panel edit-controls">
   *          <button class="identity-item-button icon-button icon-only edit-identity" identityId="id001"></button>
   *          <button class="identity-item-button icon-button icon-only delete-identity" identityId="id001"></button>
   *        </div>
   *      </td>
   *    </tr>
   */
  buildIdentityListItemUI(idmIdentity, identityIndex, borderColors) {
    const identityTR = document.createElement('tr');
    identityTR.classList.add("identity-item");
    identityTR.setAttribute( "identityId", idmIdentity.id        );
    identityTR.setAttribute( "accountId",  idmIdentity.accountId );
    identityTR.setAttribute( 'selected',   'false'               );
    identityTR.addEventListener( 'click',    (e) => this.identityClicked(e),       true ); // <===== NOTE: event "capturing" phase - but not helping - Sortable.js still getting it
    identityTR.addEventListener( 'dblclick', (e) => this.identityDoubleClicked(e), true ); // <===== NOTE: event "capturing" phase - but not helping - Sortable.js still getting it

    identityTR.setAttribute( "showInMenu", idmIdentity.showInMenu ? 'true' : 'false' );
    identityTR.setAttribute( "lockInMenu", idmIdentity.lockInMenu ? 'true' : 'false' );
    if (idmIdentity.lockInMenu)     identityTR.classList.add( "lock-in-menu"       );// lock-in-menu: Sortable.js is configured to use this class !!!
    if (! idmIdentity.showInMenu)   identityTR.classList.add( "not-show-in-menu"   ); // not-show-in-menu
    if (idmIdentity.collected)      identityTR.classList.add( "collected-identity" ); // collected-identity: was the Identity "collected" from un-matched "From" email address?
    if (idmIdentity.imported)       identityTR.classList.add( "imported-identity"  ); // imported-identity: was the Identity "imported"?
    if (idmIdentity.accountDefault) identityTR.classList.add( "account-default"    ); // account-default: is the Identhty the default for its Account?

    if (! idmIdentity.lockInMenu) {
      identityTR.classList.add("identity-item-draggable");    // Indicates to Sortable.js that this element is the "Draggable"
    }


    // Create show-in-menu checkbox inside a TD and add it to the row
    const controlsLeftTD = document.createElement('td');
      controlsLeftTD.classList.add("identity-item-controls-left");     // identity-item > identity-item-controls-left
        //
      const showInMenuCheck = document.createElement('input');
        showInMenuCheck.setAttribute( 'type',       'checkbox'     );
        showInMenuCheck.setAttribute( "identityId", idmIdentity.id );
        showInMenuCheck.classList.add( "identity-item-check" );        // identity-item > identity-item-controls-left > lock-in-menu-controls > identity-item-check
        showInMenuCheck.classList.add( "show-in-menu-check"  );        // identity-item > identity-item-controls-left > lock-in-menu-controls > show-in-menu-check
        showInMenuCheck.checked = idmIdentity.showInMenu; // <=================================================================================<<
        showInMenuCheck.addEventListener('change', (e) => this.identityOptionCheckClicked(e), true); // <====== NOTE: event "capturing" phase
        if (this.#tooltip_check_showInMenu) showInMenuCheck.setAttribute('title', this.#tooltip_check_showInMenu);
      controlsLeftTD.appendChild(showInMenuCheck);
    identityTR.appendChild(controlsLeftTD);

    // if we have access to borderColors, add the color dot
    if (borderColors !== null) {
      const identityBorderColorsTD = document.createElement('td');
        identityBorderColorsTD.classList.add( "identity-item-data"         ); // identity-item > identity-item-data
        identityBorderColorsTD.classList.add( "identity-item-border-color" ); // identity-item > identity-item-border-color
        const dotSPAN = document.createElement('span');
          dotSPAN.classList.add("identity-item-border-color-dot");            // identity-item > identity-item-label > identity-item-border-color-dot
        identityBorderColorsTD.appendChild(dotSPAN);

        if (idmIdentity.id in borderColors && borderColors[idmIdentity.id] !== undefined) {
          identityBorderColorsTD.style.setProperty( "--bullet-color",        borderColors[idmIdentity.id] );
          identityBorderColorsTD.style.setProperty( "--bullet-border-style", "solid"                      );
          identityBorderColorsTD.style.setProperty( "--bullet-border-color", "black"                      );
        }
      identityTR.appendChild(identityBorderColorsTD);
    }

    // Create idmIdentity account name element and add it to the row
    const acctName = this.#getAccountName(idmIdentity.accountId);
    const acctNum  = acctNumFromId(idmIdentity.accountId);
    const account  = isNaN(acctNum) ? acctName : acctNum + ": " + acctName;
    const identityAccountTD = document.createElement('td');
      identityAccountTD.classList.add( "identity-item-data"      );    // identity-item > identity-item-data
      identityAccountTD.classList.add( "identity-item-account"   );    // identity-item > identity-item-account
      identityAccountTD.setAttribute("accountId", idmIdentity.accountId);
      identityAccountTD.appendChild( document.createTextNode(account) );
    identityTR.appendChild(identityAccountTD);

    // Create idmIdentity name+label element and add it to the row
    const identityLabelTD = document.createElement('td');
      identityLabelTD.classList.add( "identity-item-data"      );      // identity-item > identity-item-data
      identityLabelTD.classList.add( "identity-item-label"     );      // identity-item > identity-item-label
      const identityLabelTextSPAN = document.createElement('span');
        identityLabelTextSPAN.classList.add( "identity-item-text"       );
        identityLabelTextSPAN.classList.add( "identity-item-label-text" );
        identityLabelTextSPAN.appendChild( document.createTextNode(idmIdentity.label) );
      identityLabelTD.appendChild(identityLabelTextSPAN);
      // markers for account-default identity, collected, imported, lock-in-menu
      const identityLabelMarkersSPAN = document.createElement('span');
        identityLabelMarkersSPAN.classList.add("identity-item-markers");
        // <SPAN> style for markers CSS attribute 'display' is set to 'none' or 'inline-block' based on the corresponding class in the <TR>
        const identityAccountDefaultMarkerSPAN = document.createElement('span');
          identityAccountDefaultMarkerSPAN.classList.add( "identity-item-marker"  );
          identityAccountDefaultMarkerSPAN.classList.add( "marker-account-default" );
          identityAccountDefaultMarkerSPAN.setAttribute("title", this.#tooltip_listItemMarker_accountDefault);
        identityLabelMarkersSPAN.appendChild(identityAccountDefaultMarkerSPAN);
        const identityCollectedMarkerSPAN = document.createElement('span');
          identityCollectedMarkerSPAN.classList.add( "identity-item-marker" );
          identityCollectedMarkerSPAN.classList.add( "marker-collected"     );
          identityCollectedMarkerSPAN.setAttribute("title", this.#tooltip_listItemMarker_collected);
        identityLabelMarkersSPAN.appendChild(identityCollectedMarkerSPAN);
        const identityImportedMarkerSPAN = document.createElement('span');
          identityImportedMarkerSPAN.classList.add( "identity-item-marker" );
          identityImportedMarkerSPAN.classList.add( "marker-imported"      );
          identityImportedMarkerSPAN.setAttribute("title", this.#tooltip_listItemMarker_imported);
        identityLabelMarkersSPAN.appendChild(identityImportedMarkerSPAN);
        const identityLockInMenu = document.createElement('span');
          identityLockInMenu.classList.add( "identity-item-marker" );
          identityLockInMenu.classList.add( "marker-lock-in-menu"  );
          identityLockInMenu.setAttribute("title", this.#tooltip_listItemMarker_lockInMenu);
        const identityNotShowInMenu = document.createElement('span');
          identityNotShowInMenu.classList.add( "identity-item-marker"    );
          identityNotShowInMenu.classList.add( "marker-not-show-in-menu" );
          identityNotShowInMenu.setAttribute("title", this.#tooltip_listItemMarker_notShowInMenu);
        identityLabelMarkersSPAN.appendChild(identityNotShowInMenu);
        identityLabelMarkersSPAN.appendChild(identityLockInMenu);
      identityLabelTD.appendChild(identityLabelMarkersSPAN);
    identityTR.appendChild(identityLabelTD);

    // Create idmIdentity email element and add it to the row
    const identityEmailTD = document.createElement('td');
      identityEmailTD.classList.add( "identity-item-data"      );      // identity-item > identity-item-data
      identityEmailTD.classList.add( "identity-item-email"     );      // identity-item > identity-item-email
      identityEmailTD.appendChild( document.createTextNode(idmIdentity.email) );
    identityTR.appendChild(identityEmailTD);

    if (this.#option_displayIdentityPosition) {
      // Create idmIdentity Position element and add it to the row
      const identityPosTD = document.createElement('td');
        identityPosTD.classList.add( "identity-item-data"      );      // identity-item > identity-item-data
        identityPosTD.classList.add( "identity-item-pos"       );      // identity-item > identity-item-pos
        if (idmIdentity.positionInMenu !== undefined) {
          identityPosTD.appendChild( document.createTextNode(idmIdentity.positionInMenu.toString()) );
        }
      identityTR.appendChild(identityPosTD);
    }

    if (this.#option_displayIdentityIndex) {
      // Create idmIdentity List Index element and add it to the row
      const identityIndexTD = document.createElement('td');
        identityIndexTD.classList.add( "identity-item-data"      );    // identity-item > identity-item-data
        identityIndexTD.classList.add( "identity-item-index"     );    // identity-item > identity-item-index
        identityIndexTD.appendChild( document.createTextNode(identityIndex.toString()) );
      identityTR.appendChild(identityIndexTD);
    }

    if (this.#option_displayIdentityId) {
      // Create idmIdentity ID element and add it to the row
      const identityIdTD = document.createElement('td');
        identityIdTD.classList.add( "identity-item-data"      );       // identity-item > identity-item-data
        identityIdTD.classList.add( "identity-item-id"        );       // identity-item > identity-item-id
        identityIdTD.appendChild( document.createTextNode(idmIdentity.id) );
      identityTR.appendChild(identityIdTD);
    }

    // Create controls-right element and add it to the row
    const controlsRightTD = document.createElement('td');
      controlsRightTD.classList.add("identity-item-controls-right");   // identity-item > identity-item-controls-right

      // Create lock-in-menu checkbox AND label inside a SPAN and add it to the CELL
      // In CSS, We set the checkbox to display:none and set a background-image for the label to make an "image checkbox"
      // If you change classes identity-item-check or lock-in-menu, then identityOptionCheckClicked() will stop working
      const lockInMenuControlsSPAN = document.createElement('span');
        lockInMenuControlsSPAN.classList.add("lock-in-menu-controls"); // identity-item > identity-item-controls-right > lock-in-menu-controls

        const lockInMenuCheck = document.createElement('input');
          lockInMenuCheck.setAttribute( 'type',       'checkbox'     );
          lockInMenuCheck.setAttribute( "identityId", idmIdentity.id );
          lockInMenuCheck.classList.add( "icon-button"         );      // identity-item > identity-item-controls-right > lock-in-menu-controls > icon-button
          lockInMenuCheck.classList.add( "icon-only"           );      // identity-item > identity-item-controls-right > lock-in-menu-controls > icon-only
          lockInMenuCheck.classList.add( "identity-item-check" );      // identity-item > identity-item-controls-right > lock-in-menu-controls > identity-item-check
          lockInMenuCheck.classList.add( "lock-in-menu-check"  );      // identity-item > identity-item-controls-right > lock-in-menu-controls > lock-in-menu-check
          const lockInMenuCheckId = "lockInMenu_" + idmIdentity.id;    // <===IMPORTANT: the 'id' attribute for the checkbox and the 'for' attribute for the label MUST MATCH
          lockInMenuCheck.setAttribute('id', lockInMenuCheckId);
          lockInMenuCheck.checked = idmIdentity.lockInMenu;            // <=================================================================================<<
          lockInMenuCheck.addEventListener('change', (e) => this.identityOptionCheckClicked(e), true); // <====== NOTE: true=event "capturing" phase
          if (this.#tooltip_check_lockInMenu) lockInMenuCheck.setAttribute('title', this.#tooltip_check_lockInMenu);
        lockInMenuControlsSPAN.appendChild(lockInMenuCheck);

        const lockInMenuLabel = document.createElement('label');
          lockInMenuLabel.classList.add("lock-in-menu-label");         // identity-item > identity-item-controls-right > lock-in-menu-controls > lock-in-menu-label
//////////lockInMenuLabel.setAttribute("identityId", idmIdentity.id);
          lockInMenuLabel.setAttribute('for', lockInMenuCheckId);      // IMPORTANT: the 'id' attribute for the checkbox and the 'for' attribute for the label MUST MATCH
          lockInMenuLabel.addEventListener('click', (e) => this.identityOptionCheckClicked(e), true); // <====== NOTE: true=event "capturing" phase
          if (this.#tooltip_check_lockInMenu) lockInMenuLabel.setAttribute('title', this.#tooltip_check_lockInMenu);
//lockInMenuLabel.appendChild(lockInMenuCheck);
        lockInMenuControlsSPAN.appendChild(lockInMenuLabel);
      controlsRightTD.appendChild(lockInMenuControlsSPAN);

      const moveUpDownControlsDIV = document.createElement('div');
        moveUpDownControlsDIV.classList.add( "identity-item-controls-panel" ); // identity-item > identity-item-controls-right > identity-item-controls-panel
        moveUpDownControlsDIV.classList.add( "move-up-down-controls"        );        // identity-item > identity-item-controls-right > move-up-down-controls

        const moveUpButton = document.createElement('button');
          moveUpButton.classList.add( "identity-item-button" );        // identity-item > identity-item-controls-right > move-up-down-controls > identity-item-button
          moveUpButton.classList.add( "icon-button"          );        // identity-item > identity-item-controls-right > move-up-down-controls > icon-button
          moveUpButton.classList.add( "icon-only"            );        // identity-item > identity-item-controls-right > move-up-down-controls > icon-only
          moveUpButton.classList.add( "stacked-icon"         );        // identity-item > identity-item-controls-right > move-up-down-controls > stacked-icon
          moveUpButton.classList.add( "move-identity-button" );        // identity-item > identity-item-controls-right > move-up-down-controls > move-identity-button
          moveUpButton.classList.add( "move-identity-up"     );        // identity-item > identity-item-controls-right > move-up-down-controls > move-identity-up
          moveUpButton.classList.add( "no-css"               );        // keep my userContent-css from messing with this
          moveUpButton.setAttribute("identityId", idmIdentity.id);
          moveUpButton.addEventListener('click', (e) => this.identityControlButtonClicked(e), true); // <====== NOTE: event "capturing" phase
          if (this.#tooltip_button_moveUp) moveUpButton.setAttribute('title', this.#tooltip_button_moveUp);
        moveUpDownControlsDIV.appendChild(moveUpButton);

        const moveDownButton = document.createElement('button');
          moveDownButton.classList.add( "identity-item-button" );      // identity-item > identity-item-controls-right > move-up-down-controls > identity-item-button
          moveDownButton.classList.add( "icon-button"          );      // identity-item > identity-item-controls-right > move-up-down-controls > icon-button
          moveDownButton.classList.add( "icon-only"            );      // identity-item > identity-item-controls-right > move-up-down-controls > icon-only
          moveDownButton.classList.add( "stacked-icon"         );      // identity-item > identity-item-controls-right > move-up-down-controls > stacked-icon
          moveDownButton.classList.add( "move-identity-button" );      // identity-item > identity-item-controls-right > move-up-down-controls > move-identity-button
          moveDownButton.classList.add( "move-identity-down"   );      // identity-item > identity-item-controls-right > move-up-down-controls > move-identity-down
          moveDownButton.classList.add( "no-css"               );      // keep my userContent-css from messing with this
          moveDownButton.setAttribute("identityId", idmIdentity.id);
          moveDownButton.addEventListener('click', (e) => this.identityControlButtonClicked(e), true); // <====== NOTE: event "capturing" phase
          if (this.#tooltip_button_moveDown) moveDownButton.setAttribute('title', this.#tooltip_button_moveDown);
        moveUpDownControlsDIV.appendChild(moveDownButton);
      controlsRightTD.appendChild(moveUpDownControlsDIV);

      const moveTopBottomControlsDIV = document.createElement('div');
        moveTopBottomControlsDIV.classList.add( "identity-item-controls-panel" ); // identity-item > identity-item-controls-right > identity-item-controls-panel
        moveTopBottomControlsDIV.classList.add( "move-to-controls"             ); // identity-item > identity-item-controls-right > move-to-controls

        const moveTopButton = document.createElement('button');
          moveTopButton.classList.add( "identity-item-button" );       // identity-item > identity-item-controls-right > move-top-bottom-controls > identity-item-button
          moveTopButton.classList.add( "icon-button"          );       // identity-item > identity-item-controls-right > move-top-bottom-controls > icon-button
          moveTopButton.classList.add( "icon-only"            );       // identity-item > identity-item-controls-right > move-top-bottom-controls > icon-only
          moveTopButton.classList.add( "stacked-icon"         );       // identity-item > identity-item-controls-right > move-up-down-controls > stacked-icon
          moveTopButton.classList.add( "move-identity-button" );       // identity-item > identity-item-controls-right > move-top-bottom-controls > move-identity-button
          moveTopButton.classList.add( "move-identity-to-top" );       // identity-item > identity-item-controls-right > move-top-bottom-controls > move-identity-to-top
          moveTopButton.classList.add( "no-css");                      // keep my userContent-css from messing with this
          moveTopButton.setAttribute("identityId", idmIdentity.id);
          moveTopButton.addEventListener('click', (e) => this.identityControlButtonClicked(e));
          if (this.#tooltip_button_moveToTop) moveTopButton.setAttribute('title', this.#tooltip_button_moveToTop);
        moveTopBottomControlsDIV.appendChild(moveTopButton);

        const moveBottomButton = document.createElement('button');
          moveBottomButton.classList.add( "identity-item-button"    ); // identity-item > identity-item-controls-right > move-top-bottom-controls > identity-item-button
          moveBottomButton.classList.add( "icon-button"             ); // identity-item > identity-item-controls-right > move-top-bottom-controls > icon-button
          moveBottomButton.classList.add( "icon-only"               ); // identity-item > identity-item-controls-right > move-top-bottom-controls > icon-only
          moveBottomButton.classList.add( "stacked-icon"            ); // identity-item > identity-item-controls-right > move-up-down-controls > stacked-icon
          moveBottomButton.classList.add( "move-identity-button"    ); // identity-item > identity-item-controls-right > move-top-bottom-controls > move-identity-button
          moveBottomButton.classList.add( "move-identity-to-bottom" ); // identity-item > identity-item-controls-right > move-top-bottom-controls > move-identity-to-bottom
          moveBottomButton.classList.add( "no-css"                  ); // keep my userContent-css from messing with this
          moveBottomButton.setAttribute("identityId", idmIdentity.id);
          moveBottomButton.addEventListener('click', (e) => this.identityControlButtonClicked(e), true); // <====== NOTE: event "capturing" phase
          if (this.#tooltip_button_moveToBottom) moveBottomButton.setAttribute('title', this.#tooltip_button_moveToBottom);
        moveTopBottomControlsDIV.appendChild(moveBottomButton);
      controlsRightTD.appendChild(moveTopBottomControlsDIV);

      const editControlsDIV = document.createElement('div');
        editControlsDIV.classList.add( "identity-item-controls-panel" ); // identity-item > identity-item-controls-right > identity-item-controls-panel
        editControlsDIV.classList.add( "edit-controls"                ); // identity-item > identity-item-controls-right > edit-controls

        const editButton = document.createElement('button');
          editButton.classList.add( "identity-item-button" );          // identity-item > identity-item-controls-right > edit-controls > identity-item-button
          editButton.classList.add( "icon-button"          );          // identity-item > identity-item-controls-right > edit-controls > icon-button
          editButton.classList.add( "icon-only"            );          // identity-item > identity-item-controls-right > edit-controls > icon-only
          editButton.classList.add( "edit-identity"        );          // identity-item > identity-item-controls-right > edit-controls > edit-identity
          editButton.classList.add( "no-css"               );          // keep my userContent-css from messing with this
          editButton.setAttribute("identityId", idmIdentity.id);
          editButton.addEventListener('click', (e) => this.identityControlButtonClicked(e));
          if (this.#tooltip_button_edit) editButton.setAttribute('title', this.#tooltip_button_edit);
        editControlsDIV.appendChild(editButton);

        const deleteButton = document.createElement('button');
          deleteButton.classList.add( "identity-item-button" );        // identity-item > identity-item-controls-right > edit-controls > identity-item-button
          deleteButton.classList.add( "icon-button"          );        // identity-item > identity-item-controls-right > edit-controls > icon-button
          deleteButton.classList.add( "icon-only"            );        // identity-item > identity-item-controls-right > edit-controls > icon-only
          deleteButton.classList.add( "delete-identity"      );        // identity-item > identity-item-controls-right > edit-controls > delete-identity
          deleteButton.classList.add( "no-css"               );        // keep my userContent-css from messing with this
          deleteButton.setAttribute("identityId", idmIdentity.id);
          deleteButton.addEventListener('click', (e) => this.identityControlButtonClicked(e));
          if (this.#tooltip_button_delete) deleteButton.setAttribute('title', this.#tooltip_button_delete);
          deleteButton.disabled = idmIdentity.accountDefault;
        editControlsDIV.appendChild(deleteButton);
      controlsRightTD.appendChild(editControlsDIV);

    identityTR.appendChild(controlsRightTD);

    return identityTR;
  }  



  /**************************************************** BEGIN CALLBACKS FOR Sortable.js **********************************************************/

  // Sortable has fired it's onChoose event.
  // Element is chosen
  //
  // - e.oldIndex;  // element index within parent 
  // THAT'S IT???
  async identityChosen(e) {
    if (e === null) return true;

/*
    const draggedElement     = e.dragged;
    const draggedElementTag  = draggedElement?.tagName;
    const draggedIdentityId  = draggedElement?.getAttribute("identityId")
    const draggedLockInMenu  = draggedElement?.classList.contains("lock-in-menu");

    const fromElement        = e.from; // from list
    const fromElementTag     = fromElement?.tagName;
    const fromIdentityId     = fromElement?.getAttribute("identityId")
    const fromLockInMenu     = fromElement?.classList.contains("lock-in-menu");

    const itemElement        = e.from;
    const itemElementTag     = itemElement?.tagName;
    const itemIdentityId     = itemElement?.getAttribute("identityId")
    const itemLockInMenu     = itemElement?.classList.contains("lock-in-menu");

    const toElement          = e.to; // to list
    const toElementTag       = toElement?.tagName;
    const toIdentityId       = toElement?.getAttribute("identityId")
    const toLockInMenu       = toElement?.classList.contains("lock-in-menu");

    const relatedElement     = e.related;
    const relatedElementTag  = relatedElement?.tagName;
    const relatedIdentityId  = relatedElement?.getAttribute("identityId")
    const relatedLockInMenu  = relatedElement?.classList.contains("lock-in-menu");

    this.debugAlways("@@@@@@@ identityChosen @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@",
                `\n- draggedElementTag ... "${draggedElementTag}"`,
                `\n- draggedIdentityId ... "${draggedIdentityId}"`,
                `\n- draggedLockInMenu ... ${draggedLockInMenu}`,
                "\n",
                `\n- fromElementTag ...... "${fromElementTag}"`,
                `\n- fromIdentityId ...... "${fromIdentityId}"`,
                `\n- fromLockInMenu ...... ${fromLockInMenu}`,
                "\n",
                `\n- itemElementTag ...... "${itemElementTag}"`,
                `\n- itemIdentityId ...... "${itemIdentityId}"`,
                `\n- itemLockInMenu ...... ${itemLockInMenu}`,
                "\n",
                `\n- relatedElementTag ... "${relatedElementTag}"`,
                `\n- relatedIdentityId ... "${relatedIdentityId}"`,
                `\n- relatedLockInMenu ... ${relatedLockInMenu}`,
                "\n",
                `\n- toElementTag ........ "${toElementTag}"`,
                `\n- toIdentityId ........ "${toIdentityId}"`,
                `\n- toLockInMenu ........ ${toLockInMenu}`,
              );
*/

    this.debug(`@@@@@@@@@@@@@@@@@@@@@@@@@@ e.oldIndex=${e.oldIndex}  @@@@@@@@@@@@@@@@@@@@@@@@@@`);

    if (typeof e.oldIndex === 'number' && e.oldIndex >= 0) {
      const domIdentityDisplayOrderList = document.getElementById("idmIdentityDisplayOrderList");
      this.debug(`@@@@@@@@@@@@@@@@@@@@@@@@@@ domIdentityDisplayOrderList.children.length=${domIdentityDisplayOrderList.children.length}  @@@@@@@@@@@@@@@@@@@@@@@@@@`);

      if (e.oldIndex < domIdentityDisplayOrderList.children.length) {
        const domIdentityTR = domIdentityDisplayOrderList.children.item(e.oldIndex);
        if (domIdentityTR) { 
          const IdentityID = domIdentityTR.getAttribute("identityId");
          const lockInMenu = domIdentityTR.classList.contains('lock-in-menu');
          this.debug(`@@@@@@@@@@@@@@@@@@@@@@@@@@ IdentityID="${IdentityID}" lockInMenu=${lockInMenu} @@@@@@@@@@@@@@@@@@@@@@@@@@`);
          return ! lockInMenu;
        }
      }
    }

    return true;
  }

  // Sortable has fired it's onEnd event.
	// Element dragging ended
  //
  // e.item;              // dragged HTMLElement
  // e.to;                // target list
  // e.from;              // previous list
  // e.oldIndex;          // element's old index within old parent
  // e.newIndex;          // element's new index within new parent
  // e.oldDraggableIndex; // element's old index within old parent, only counting draggable elements
  // e.newDraggableIndex; // element's new index within new parent, only counting draggable elements
  // e.clone              // the clone element
  // e.pullMode;          // when item is in another sortable: `"clone"` if cloning, `true` if moving 
  async identityDragEnded(e) {
    if (e === null) return true;

/*
    const draggedElement     = e.dragged;
    const draggedElementTag  = draggedElement?.tagName;
    const draggedIdentityId  = draggedElement?.getAttribute("identityId")
    const draggedLockInMenu  = draggedElement?.classList.contains("lock-in-menu");

    const fromElement        = e.from; // from list
    const fromElementTag     = fromElement?.tagName;
    const fromIdentityId     = fromElement?.getAttribute("identityId")
    const fromLockInMenu     = fromElement?.classList.contains("lock-in-menu");

    const itemElement        = e.from;
    const itemElementTag     = itemElement?.tagName;
    const itemIdentityId     = itemElement?.getAttribute("identityId")
    const itemLockInMenu     = itemElement?.classList.contains("lock-in-menu");

    const toElement          = e.to; // to list
    const toElementTag       = toElement?.tagName;
    const toIdentityId       = toElement?.getAttribute("identityId")
    const toLockInMenu       = toElement?.classList.contains("lock-in-menu");

    const relatedElement     = e.related;
    const relatedElementTag  = relatedElement?.tagName;
    const relatedIdentityId  = relatedElement?.getAttribute("identityId")
    const relatedLockInMenu  = relatedElement?.classList.contains("lock-in-menu");

    this.debugAlways("@@@@@@@ identityDragEnded @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@",
                `\n- draggedElementTag ... "${draggedElementTag}"`,
                `\n- draggedIdentityId ... "${draggedIdentityId}"`,
                `\n- draggedLockInMenu ... ${draggedLockInMenu}`,
                "\n",
                `\n- fromElementTag ...... "${fromElementTag}"`,
                `\n- fromIdentityId ...... "${fromIdentityId}"`,
                `\n- fromLockInMenu ...... ${fromLockInMenu}`,
                "\n",
                `\n- itemElementTag ...... "${itemElementTag}"`,
                `\n- itemIdentityId ...... "${itemIdentityId}"`,
                `\n- itemLockInMenu ...... ${itemLockInMenu}`,
                "\n",
                `\n- relatedElementTag ... "${relatedElementTag}"`,
                `\n- relatedIdentityId ... "${relatedIdentityId}"`,
                `\n- relatedLockInMenu ... ${relatedLockInMenu}`,
                "\n",
                `\n- toElementTag ........ "${toElementTag}"`,
                `\n- toIdentityId ........ "${toIdentityId}"`,
                `\n- toLockInMenu ........ ${toLockInMenu}`,
              );
*/

    this.debug(`@@@@@@@@@@@@@@@@@@@@@@@@@@ oldIndex=${e.oldIndex}-->newIndex=${e.newIndex} @@@@@@@@@@@@@@@@@@@@@@@@@@`);
    const item       = e.item;                            // the item that actually got dragged.  is there any reference to the item was dragged over???
    const identityId = item.getAttribute("identityId");

    this.debug(`@@@@ item="${item}" identityId="${identityId}" @@@`);

    if (e.newIndex > e.oldIndex) { // we dragged down
      this.debug(`@@@ Identity Dragged Down @@@`);
      //   make sure this is not causing us to move a LOCKED element UP!  THis is going to be complicated.  Too bad Sortable.js doesn't help!
    } else {                       // we dragged up
      this.debug(`@@@ Identity Dragged Up @@@`);
      //   make sure this is not causing us to move a LOCKED element DOWN!  THis is going to be complicated.  Too bad Sortable.js doesn't help!
    }
  }

  // Sortable has fired it's onFilter event.
  // Attempt to drag a filtered element
  //
  // - e.item  // HTMLElement receiving the `mousedown|tapstart` event./
  async filterIdentity(e) {
    if (e === null) return true;

    const draggedElement     = e.dragged;
    const draggedElementTag  = draggedElement?.tagName;
    const draggedIdentityId  = draggedElement?.getAttribute("identityId")
    const draggedLockInMenu  = draggedElement?.classList.contains("lock-in-menu");

    const fromElement        = e.from; // from list
    const fromElementTag     = fromElement?.tagName;
    const fromIdentityId     = fromElement?.getAttribute("identityId")
    const fromLockInMenu     = fromElement?.classList.contains("lock-in-menu");

    const itemElement        = e.from;
    const itemElementTag     = itemElement?.tagName;
    const itemIdentityId     = itemElement?.getAttribute("identityId")
    const itemLockInMenu     = itemElement?.classList.contains("lock-in-menu");

    const toElement          = e.to; // to list
    const toElementTag       = toElement?.tagName;
    const toIdentityId       = toElement?.getAttribute("identityId")
    const toLockInMenu       = toElement?.classList.contains("lock-in-menu");

    const relatedElement     = e.related;
    const relatedElementTag  = relatedElement?.tagName;
    const relatedIdentityId  = relatedElement?.getAttribute("identityId")
    const relatedLockInMenu  = relatedElement?.classList.contains("lock-in-menu");

    console.debug("@@@@@@@ filterIdentity @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@",
                `\n- oldIndex ............ ${e.oldIndex}`,
                `\n- newIndex ............ ${e.newIndex}`,
                `\n- oldDraggableIndex ... ${e.oldDraggableIndex}`,
                `\n- newDraggableIndex ... ${e.newDraggableIndex}`,
                "\n",
                `\n- draggedElementTag ... "${draggedElementTag}"`,
                `\n- draggedIdentityId ... "${draggedIdentityId}"`,
                `\n- draggedLockInMenu ... ${draggedLockInMenu}`,
                "\n",
                `\n- fromElementTag ...... "${fromElementTag}"`,
                `\n- fromIdentityId ...... "${fromIdentityId}"`,
                `\n- fromLockInMenu ...... ${fromLockInMenu}`,
                "\n",
                `\n- itemElementTag ...... "${itemElementTag}"`,
                `\n- itemIdentityId ...... "${itemIdentityId}"`,
                `\n- itemLockInMenu ...... ${itemLockInMenu}`,
                "\n",
                `\n- relatedElementTag ... "${relatedElementTag}"`,
                `\n- relatedIdentityId ... "${relatedIdentityId}"`,
                `\n- relatedLockInMenu ... ${relatedLockInMenu}`,
                "\n",
                `\n- toElementTag ........ "${toElementTag}"`,
                `\n- toIdentityId ........ "${toIdentityId}"`,
                `\n- toLockInMenu ........ ${toLockInMenu}`,
              );

//  if (e.item && e.item.classList.contains('lock-in-menu')) { 
//    this.debug("@@@@@@@@@@@@@@@@@@@@@@@@@@ LOCKED ITEM, RETURNING false @@@@@@@@@@@@@@@@@@@@@@@@@@");
//    return false; // I'm not sure the return value even does anything
//  }

    return true;
  }

  // Sortable has fired it's onMove event. // the return value doesn't seem to make any difference
  // Event when you move an item in the list or between lists
  //
  // - evt.dragged;         // dragged HTMLElement
  // - evt.draggedRect;     // DOMRect {left, top, right, bottom}
  // - evt.related;         // HTMLElement on which have guided
  // - evt.relatedRect;     // DOMRect
  // - evt.willInsertAfter; // Boolean that is true if Sortable will insert drag element after target by default
  // - originalEvt.clientY; // mouse position
  //
  // - return false;        // - for cancel                     !!! DOESN"T WORK!!!
  // - return -1;           // - insert before target
  // - return 1;            // - insert after target
  // - return true;         // - keep default insertion point based on the direction
  // - return void;         // - keep default insertion point based on the direction
  async identityMoved(evt, originalEvt) {
    if (evt === null) return true;

//  const draggedElement     = evt.dragged;
//  const draggedElementTag  = draggedElement?.tagName;
//  const draggedIdentityId  = draggedElement?.getAttribute("identityId")
//  const draggedLockInMenu  = draggedElement?.classList.contains("lock-in-menu");

    const relatedElement     = evt.related;
//  const relatedElementTag  = relatedElement?.tagName;
//  const relatedIdentityId  = relatedElement?.getAttribute("identityId")
    const relatedLockInMenu  = relatedElement?.classList.contains("lock-in-menu");

    if (relatedLockInMenu) { 
      this.debugAlways("@@@ LOCKED ITEM, RETURNING false @@@");
      return false; // This is SUPPOSED to CANCEL the Move, but it doesn't work for me.
    }

    return true;
  }

  // Sortable has fired it's onChange event.
  // Called when dragging element changes position
  //
  // e.item;              // dragged HTMLElement
  // e.to;                // target list
  // e.from;              // previous list
  // e.oldIndex;          // element's old index within old parent
  // e.newIndex;          // element's new index within new parent
  // e.oldDraggableIndex; // element's old index within old parent, only counting draggable elements
  // e.newDraggableIndex; // element's new index within new parent, only counting draggable elements
  // e.clone              // the clone element
  // e.pullMode;          // when item is in another sortable: `"clone"` if cloning, `true` if moving
  async identityPositionChanged(e) {
  }

  // Sortable has fired it's onUpdate event.
  // Changed sorting within list
  //
  // The user dragged and dropped an item.
  // Create & save the new order in local storage (IdentitiesExtendedProps)
  //
  // e.item;              // dragged HTMLElement
  // e.to;                // target list
  // e.from;              // previous list
  // e.oldIndex;          // element's old index within old parent
  // e.newIndex;          // element's new index within new parent
  // e.oldDraggableIndex; // element's old index within old parent, only counting draggable elements
  // e.newDraggableIndex; // element's new index within new parent, only counting draggable elements
  // e.clone              // the clone element
  // e.pullMode;          // when item is in another sortable: `"clone"` if cloning, `true` if moving 
  async identitiesReordered(e) {
    if (e === null) return;

    this.debug("-- begin");

    const oldIdentitiesProps = await this.#idmOptionsApi.getIdentitiesExtendedProps();

    const domIdentityDisplayOrderList = document.getElementById("idmIdentityDisplayOrderList");
    const newIdentitiesProps          = {};
    var   positionInMenu              = 0;
    for (const domIdentityTR of domIdentityDisplayOrderList.children) { // THESE ARE ALL TR ELEMENTS!!!
      const identityId                   = domIdentityTR.getAttribute("identityId");
//    const domIdentityShowInMenuInputTD = domIdentityTR.children.item(0);
//    const domIdentityShowInMenuInput   = domIdentityShowInMenuInputTD.children.item(0);
//    const domIdentityLabelTD           = domIdentityTR.children.item(1);
//    const domIdentityEmailTD           = domIdentityTR.children.item(2);

      const props      = oldIdentitiesProps[identityId];
      const showInMenu = (!props || typeof props.showInMenu !== 'boolean') ? true  : props.showInMenu; // 
      const lockInMenu = (!props || typeof props.lockInMenu !== 'boolean') ? false : props.lockInMenu;

      newIdentitiesProps[identityId] = {
        'showInMenu':     showInMenu,
        'lockInMenu':     lockInMenu,
        'positionInMenu': positionInMenu++
      }
    }

    this.debug("-- new sort order", newIdentitiesProps);

    await this.#idmOptionsApi.storeIdentitiesExtendedProps(newIdentitiesProps);

    this.debug("-- end");
  }

  /**************************************************** END CALLBACKS FOR Sortable.js **********************************************************/



  // One of the Options checkboxes or radio buttons or selects (etc) has been clicked
  // NOTE: This listener is added to the DOCUMENT!  **ANY** Change Event will cause this function to get called!!!
  async optionChanged(e) {
    if (e === null) return;

    this.__debugOptionChanged(`-- tagName="${e.target.tagName}" type="${e.target.type}" id="${e.target.id}" idmGeneralOption? ${e.target.classList.contains("idmGeneralOption")}`);

    if (e.target.classList.contains("idmGeneralOption")) {

      // MABXXX THIS CODE NEED TO BE RE-WRITTEN
      //
      if (e.target.tagName === 'INPUT') {
        if (e.target.type === 'checkbox' || e.target.type === 'radio') {
          const optionName  = e.target.id;
          const optionValue = e.target.checked;

          /* if it's a radio button, set the values for all the other buttons in the group to false */
          if (e.target.type === 'radio') { // is it a radio button?
            this.__debugOptionChanged(`-- Radio Button Setting option ${optionName}=<${optionValue}> - group=${e.target.name}`);

            // first, set this option
            await this.#idmOptionsApi.storeOption(
              { [optionName]: optionValue }
            );

            // get all the elements with the same name, and if they're a radio, un-check them
            if (e.target.name) { /* && (optionValue === true || optionValue === 'true')) { Don't need this. Event fired *ONLY* when SELECTED, i.e. true */
              const radioGroupName = e.target.name;
              const radioGroup = document.querySelectorAll(`input[type='radio'][name="${radioGroupName}"]`);
              if (! radioGroup) {
                this.__debugOptionChanged('-- no radio group found');
              } else {
                this.__debugOptionChanged(`-- radio group members length=${radioGroup.length}`);
                if (radioGroup.length < 2) {
                  this.__debugOptionChanged('-- no radio group members to reset (length < 2)');
                } else {
                  for (const radio of radioGroup) {
                    if (radio.id !== optionName) { // don't un-check the one that fired
                      this.__debugOptionChanged(`-- resetting  radio button [${radio.id}]: ${false}`);
                      await this.#idmOptionsApi.storeOption(
                        { [radio.id]: false }
                      );
                    }
                  }
                }
              }
            }
          } else { // since we already tested for it, it's got to be a checkbox
            this.__debugOptionChanged(`-- Checkbox Setting Option [${optionName}]: ${optionValue}]`);
            await this.#idmOptionsApi.storeOption(
              { [optionName]: optionValue }
            );

            switch (optionName) {
              case 'idmCollectFromAddresses':
                await this.collectFromAddressesCheckClicked(e);
                break;
              case 'idmDisplayIdentityPositionInDisplayOrder':
                // keep our (small) cache of options up to date
                this.#option_displayIdentityPosition = optionValue;
                break;
              case 'idmDisplayIdentityIndexInDisplayOrder':
                // keep our (small) cache of options up to date
                this.#option_displayIdentityIndex    = optionValue;
                break;
              case 'idmDisplayIdentityIdInDisplayOrder':
                // keep our (small) cache of options up to date
                this.#option_displayIdentityId       = optionValue;
                break;
              case 'idmShowPopupOptions':
                await this.showPopupOptionsCheckClicked(e);
                break;
              case 'idmShowDisplayOrderHints':
                await this.showDisplayOrderHintsCheckClicked(e);
                break;
              case 'idmShowDisplayOrderActions':
                await this.showDisplayOrderActionsCheckClicked(e);
                break;
            }
          }

        } else if (e.target.type === 'text') {
          // Not saving any TEXT options at this time
          // const optionName  = e.target.id;
          // const optionValue = e.target.value;
          // this.debugAlways(`-- Select Setting Option [${optionName}]: "${optionValue}"]`);
        } else {
          // unhandled <input> type
        }

      } else if (e.target.tagName === 'SELECT') {
        const optionName  = e.target.id;
        const optionValue = e.target.value;
        this.__debugOptionChanged(`-- Select Setting Option [${optionName}]: "${optionValue}"]`);

        await this.#idmOptionsApi.storeOption(
          { [optionName]: optionValue }
        );

        switch (optionName) {
          case 'idmAutoSortBySelect':
            await this.autoSortBySelectChanged(e);
            break;
          case 'idmAutoSortDirectionSelect':
            await this.autoSortDirectionSelectChanged(e);
            break;
        }

      } else {
        // unhandled HTML tag
      }
    } else {
      // Tag doesn't have class "idmGeneralOption"
    }
  }



  async identityListHeaderControlClicked(e) {
    if (e === null) return;
    e.preventDefault();
    e.stopPropagation();

    this.debug("-- begin, e.target:", e.target);

    if (e.target.tagName !== "BUTTON") {
      this.debug("Click Target is not a Button:", e.target);
    } else {
      const button = e.target;

      if (! button.classList.contains("header-button")) {
        this.debug("Button does not have class 'header-button':", button);
      } else {
        if (button.classList.contains("sort-button")) {
          const selectorForTH = 'th.header-item';
          const headerTH = button.closest(selectorForTH);

          if (! headerTH) {
            this.error(`FAILED TO GET HEADER TH for 'sort-button': selectorForTH="${selectorForTH}" - button:`, button);
          } else {
            const sortBy = headerTH.getAttribute('sortBy');

            if (! sortBy) {
              this.error("FAILED TO GET 'sortBy' Attribute from headerTH:", headerTH);
            } else {
              var sortDirection;
              if (button.classList.contains("sort-ascending")) {
                sortDirection = IdmOptions.IDENTITY_AUTO_SORT_DIRECTION_VALUE_ASCENDING;
              } else if (button.classList.contains("sort-descending")) {
                sortDirection = IdmOptions.IDENTITY_AUTO_SORT_DIRECTION_VALUE_DESCENDING;
              } else {
                this.error("Button 'sort-button' does not have class 'sort-ascending' or 'sort-descending' - button:", button);
              }

              if (sortDirection) {
                this.debug(`Sort by "${sortBy}" "${sortDirection}"`);
                await this.sortIdentityList(e, sortBy, sortDirection);

                const autoSortBySelect        = document.getElementById("idmAutoSortBySelect");
                const autoSortDirectionSelect = document.getElementById("idmAutoSortDirectionSelect");

                if (! autoSortBySelect || ! autoSortDirectionSelect) {
                  if (! autoSortBySelect)        this.error("-- failed to get autoSortBySelect, id='idmAutoSortBySelect'");
                  if (! autoSortDirectionSelect) this.error("-- failed to get autoSortDirectionSelect, id='idmAutoSortDirectionSelect'");
            
                } else if (sortBy === IdmOptions.IDENTITY_AUTO_SORT_BY_VALUE_ID) { // The SELECT does NOT include this OPTION because the column is optional
                  autoSortBySelect.value        = IdmOptions.IDENTITY_AUTO_SORT_BY_VALUE_NONE;            // MABXXX will this update the option? Doesn't seem to...
                  autoSortDirectionSelect.value = IdmOptions.IDENTITY_AUTO_SORT_DIRECTION_VALUE_NONE;     // MABXXX will this update the option? Doesn't seem to...
                } else {
                  autoSortBySelect.value        = sortBy;            // MABXXX will this update the option? It DOES seem to...
                  autoSortDirectionSelect.value = sortDirection;     // MABXXX will this update the option? It DOES seem to...
                }
              }
            }
          }

        } else {
          this.debug("Button does not have one of the expected button classes: ", button);
        }
      }
    }

    this.debug("-- end");
  }



  // the user clicked an identity-item-button: move-identity-up, move-identity-down, move-identity-to-top, move-identity-to-bottom, edit-identity, delete-identity, etc
  async identityControlButtonClicked(e) {
    if (e === null) return;
    e.preventDefault();
    e.stopPropagation();

    this.__debugIdentityControl("-- begin");

    if (this.#DEBUG_IDENTITY_CONTROL) this.debugAlways( "--", // don't build all this just to be denied by this.#DEBUG inside this.debug()
                                                        `\n- tagName="${e.target.tagName}"`,
                                                        `\n- identity-item-button?=${e.target.classList.contains("identity-item-button")}`,
                                                        `\n- move-identity-up?=${e.target.classList.contains("move-identity-up")}`,
                                                        `\n- move-identity-down?=${e.target.classList.contains("move-identity-down")}`,
                                                        `\n- move-identity-to-top?=${e.target.classList.contains("move-identity-to-top")}`,
                                                        `\n- move-identity-to-bottom?=${e.target.classList.contains("move-identity-to-bottom")}`,
                                                        `\n- edit-identity?=${e.target.classList.contains("edit-identity")}`,
                                                        `\n- delete-identity?=${e.target.classList.contains("delete-identity")}`,
                                                        `\n- identityId="${e.target.getAttribute('identityId')}"`,
                                                      );

    if (e.target.tagName === 'BUTTON' || e.target.tagName === 'LABEL') {
      this.__debugIdentityControl(`BUTTON OR LABEL CLICKED tagName="${e.target.tagName}" id="${e.target.id}"`);
      
      // I thought the browser was supposed to take care of this <label> with a 'for' attribute stuff...
      if (e.target.tagName === 'LABEL' && (! e.target.parentElement || e.target.parentElement.tagName !== 'BUTTON')) {
        this.__debugIdentityControl(`-- LABEL CLICKED BUT PARENT ELEMENT NOT A BUTTON -- id="${e.target.id}" parent="${e.target.parentElement.tagName}"`);
      } else {
        e.preventDefault();

        var button;
        if (e.target.tagName === 'LABEL') {
          button = e.target.parentElement;
        } else {
          button = e.target;
        }
        this.__debugIdentityControl(`-- BUTTON CLICKED id="${button.id}"`);

        if (button.classList.contains("identity-item-button")) {
          if ( button.classList.contains("move-identity-up")
               || button.classList.contains("move-identity-down")
               || button.classList.contains("move-identity-to-top")
               || button.classList.contains("move-identity-to-bottom")
               || button.classList.contains("edit-identity")
               || button.classList.contains("delete-identity")
             )
          {
            if (! button.hasAttribute("identityId")) { // if it doesn't have an identityID then we can't store in IdentitiesExtendedProps
              this.__debugIdentityControl("-- BUTTON HAS NO \"identitId\" ATTRIBUTE - CAN'T DO ANYTHING!!!");

            } else {
              const identityId = button.getAttribute("identityId");

              if (button.classList.contains("move-identity-up")) {
                await this.moveIdentityUp(e, identityId);

              } else if (button.classList.contains("move-identity-down")) {
                await this.moveIdentityDown(e, identityId);

              } else if (button.classList.contains("move-identity-to-top")) {
                await this.moveIdentityToTop(e, identityId);

              } else if (button.classList.contains("move-identity-to-bottom")) {
                await this.moveIdentityToBottom(e, identityId);

              } else if (button.classList.contains("edit-identity")) {
                await this.editIdentity(e, identityId);

              } else if (button.classList.contains("delete-identity")) {
                await this.deleteIdentity(e, identityId);
              }
            }
          } else {
            this.__debugIdentityControl("-- NOT OUR BUTTON -- got expected class 'identity-item-button', but button-specific class not found --"); 
          }
        } else {
          this.__debugIdentityControl("-- NOT OUR BUTTON -- expected class 'identity-item-button' not found --");
        }
      }
    } else {
      this.__debugIdentityControl(`-- BUTTON NOT FOUND -- tagName="${e.target.tagName}" id="${e.target.id}"`);
    }

    this.__debugIdentityControl("-- end");
  }



  // Move the given Identity up ONE position in the list,
  // skipping locked and filtered-out identities
  async moveIdentityUp(e, moveIdentityId) {
    this.__debugIdentityControl(`-- begin -- moveIdentityId="${moveIdentityId}"`);

    var identityMoved = false;
    var error         = false;
    if (! moveIdentityId) {
      this.error("-- No moveIdentityId");
      error = true;
    } else {
      const trSelector         = `tr.identity-item[identityId='${moveIdentityId}']`;
      const moveIdentityItemTR = e.target.closest(trSelector);
      if (! moveIdentityItemTR) {
        this.error(`-- CANNOT MOVE -- Failed to get TR Element for Identity id="${moveIdentityId}", trSelector="${trSelector}"`);
        error = true;
      } else {
        const identitiesProps    = await this.#idmOptionsApi.getIdentitiesExtendedProps();
        const moveIdentityProps  = identitiesProps[moveIdentityId];
        const moveLockInMenu     = (!moveIdentityProps || typeof moveIdentityProps.lockInMenu     !== 'boolean' ) ? false : moveIdentityProps.lockInMenu;
        const movePositionInMenu = (!moveIdentityProps || typeof moveIdentityProps.positionInMenu !== 'number'  ) ? -1    : moveIdentityProps.positionInMenu;

        this.__debugIdentityControl(`-- MOVE id="${moveIdentityId}" moveLockInMenu=${moveLockInMenu} movePositionInMenu=${movePositionInMenu}`);

        if (! moveIdentityProps) {
          this.error(`-- CANNOT MOVE -- No Old Identity Props: id="${moveIdentityId}"`);
          error = true;
        } else if (moveLockInMenu) {
          this.__debugIdentityControl(`-- CANNOT MOVE - Identity is lockInMenu: id="${moveIdentityId}"`);
        } else if (movePositionInMenu < 0) {
          this.error(`-- CANNOT MOVE - Identity has no positionInMenu: id="${moveIdentityId}"`);
          error = true;
        } else if (movePositionInMenu === 0) {
          this.__debugIdentityControl(`-- CANNOT MOVE - Identity is at the Beginning of the list: id="${moveIdentityId}"`);
        } else {
          const domIdentityDisplayOrderList = document.getElementById("idmIdentityDisplayOrderList"); // this is a <TABLE>
          const indexOfIdentityTR           = Array.from(domIdentityDisplayOrderList.children).indexOf(moveIdentityItemTR);
          var   foundEligibleSwapIdentity   = false;

          this.__debugIdentityControl(`-- movePositionInMenu=${movePositionInMenu} indexOfIdentityTR=${indexOfIdentityTR} id="${moveIdentityId}"`);

          // We have to do all this just to skip over LOCKED and/or FILTERED Identities
          // children[0] is the header row
          for (var childIndex = indexOfIdentityTR - 1; childIndex > 0; --childIndex) {
            const swapIdentityItemTR = domIdentityDisplayOrderList.children[childIndex]
            const swapIdentityId     = swapIdentityItemTR.getAttribute("identityId");

            if (this.isFilteredDomIdentityTR(swapIdentityItemTR)) {
              this.__debugIdentityControl(`-- Swap Identity is Filtered Out: id="${swapIdentityId}"`);

            } else if (! swapIdentityId) {
              this.error("-- No Swap Identity Id");
              error = true;
              break; // something is broken - give up

            } else {
              const swapIdentityProps = identitiesProps[swapIdentityId];
              if (! swapIdentityProps) {
                this.error(`-- No Swap Identity Props: id="${swapIdentityId}"`);
                error = true;
                break; // something is broken - give up

              } else {
                const swapLockInMenu     = (typeof swapIdentityProps.lockInMenu     !== 'boolean') ? false : swapIdentityProps.lockInMenu;
                const swapPositionInMenu = (typeof swapIdentityProps.positionInMenu !== 'number' ) ? -1    : swapIdentityProps.positionInMenu;
                this.__debugIdentityControl(`-- SWAP id="${swapIdentityId}" swapLockInMenu=${swapLockInMenu} swapPositionInMenu=${swapPositionInMenu}`);

                if (swapLockInMenu) {
                  this.__debugIdentityControl(`-- Swap Identity is lockInMenu, skipping: id="${swapIdentityId}"`);
                } else {
                  foundEligibleSwapIdentity = true;

                  if (swapPositionInMenu < 0) {
                    this.error(`-- Swap Identity has no positionInMenu: id="${swapIdentityId}"`);
                    error = true;
                    break; // something is broken - give up

                  } else if (swapPositionInMenu === movePositionInMenu) {
                    this.error(`-- Move & Swap positionInMenu are the same: id="${swapIdentityId}"`);
                    error = true;
                    break; // something is broken - give up

                  } else {
                    // SWAP!!!
                    this.__debugIdentityControl( "-- CAN SWAP --",
                                               `\n- Move Identity id="${moveIdentityId}" positionInMenu=${movePositionInMenu}`,
                                               `\n- Swap Identity id="${swapIdentityId}" positionInMenu=${swapPositionInMenu}`,
                              );

                    moveIdentityProps.positionInMenu = swapPositionInMenu;
                    swapIdentityProps.positionInMenu = movePositionInMenu;
                    await this.#idmOptionsApi.storeIdentitiesExtendedProps(identitiesProps);

                    this.swapIdentityItemTRs(false, domIdentityDisplayOrderList, moveIdentityItemTR, swapIdentityItemTR);

                    identityMoved = true;
                    break; // found what we needed - we're done
                  }
                }
              }
            }
          }

          if (! error && ! foundEligibleSwapIdentity) this.__debugIdentityControl(`-- FOUND NO UNLOCKED IDENTITY TO SWAP -- Identity id="${moveIdentityId}"`);
        }
      }
    }

    if (! identityMoved) this.__debugIdentityControl(`-- NOT MOVED -- Identity id="${moveIdentityId}"`);

    this.__debugIdentityControl("-- end");
  }

  // Move the given Identity up DOWN position in the list,
  // skipping locked and filtered-out identities
  async moveIdentityDown(e, moveIdentityId) {
    this.__debugIdentityControl(`-- begin -- moveIdentityId="${moveIdentityId}"`);

    var identityMoved = false;
    var error         = false;
    if (! moveIdentityId) {
      this.error("-- No moveIdentityId");
      error = true;
    } else {
      const trSelector         = `tr.identity-item[identityId='${moveIdentityId}']`;
      const moveIdentityItemTR = e.target.closest(trSelector);
      if (! moveIdentityItemTR) {
        this.error(`-- CANNOT MOVE -- Failed to get TR Element for Identity id="${moveIdentityId}", trSelector="${trSelector}"`);
        error = true;
      } else {
        const identitiesProps               = await this.#idmOptionsApi.getIdentitiesExtendedProps();
        const moveIdentityProps             = identitiesProps[moveIdentityId];
        const moveLockInMenu                = (!moveIdentityProps || typeof moveIdentityProps.lockInMenu     !== 'boolean' ) ? false : moveIdentityProps.lockInMenu;
        const movePositionInMenu            = (!moveIdentityProps || typeof moveIdentityProps.positionInMenu !== 'number'  ) ? -1    : moveIdentityProps.positionInMenu;

        this.__debugIdentityControl(`-- MOVE id="${moveIdentityId}" moveLockInMenu=${moveLockInMenu} movePositionInMenu=${movePositionInMenu}`);

        if (! moveIdentityProps) {
          this.error(`-- CANNOT MOVE -- No Old Identity Props: id="${moveIdentityId}"`);
          error = true;
        } else if (moveLockInMenu) {
          this.__debugIdentityControl(`-- CANNOT MOVE - Identity is lockInMenu: id="${moveIdentityId}"`);
        } else if (movePositionInMenu < 0) {
          this.error(`-- CANNOT MOVE - Identity has no positionInMenu: id="${moveIdentityId}"`);
          error = true;
        } else {
          const domIdentityDisplayOrderList = document.getElementById("idmIdentityDisplayOrderList"); // this is a <TABLE>
          const domListLength               = domIdentityDisplayOrderList.children.length;
          const indexOfIdentityTR           = Array.from(domIdentityDisplayOrderList.children).indexOf(moveIdentityItemTR);

          this.__debugIdentityControl(`-- movePositionInMenu=${movePositionInMenu} indexOfIdentityTR=${indexOfIdentityTR} domListLength=${domListLength} id="${moveIdentityId}"`);

          if (indexOfIdentityTR + 1 >= domListLength) {
            this.__debugIdentityControl(`-- CANNOT MOVE - Identity is at the End of the list: id="${moveIdentityId}"`);

          } else {
            var foundEligibleSwapIdentity = false;

            // We have to do all this just to skip over locked and/or FILTERED identities
            // children[0] is the header row
            for (var childIndex = indexOfIdentityTR + 1; childIndex < domListLength; ++childIndex) {
              const swapIdentityItemTR = domIdentityDisplayOrderList.children[childIndex]
              const swapIdentityId     = swapIdentityItemTR.getAttribute("identityId");

              if (this.isFilteredDomIdentityTR(swapIdentityItemTR)) {
                this.__debugIdentityControl(`-- Swap Identity is Filtered Out: id="${swapIdentityId}"`);

              } else if (! swapIdentityId) {
                this.error("-- No Swap Identity Id");
                error = true;
                break; // something is broken - give up

              } else {
                const swapIdentityProps = identitiesProps[swapIdentityId];
                if (! swapIdentityProps) {
                  this.error(`-- No Swap Identity Props: id="${swapIdentityId}"`);
                  error = true;
                  break; // something is broken - give up

                } else {
                  const swapLockInMenu     = (typeof swapIdentityProps.lockInMenu     !== 'boolean') ? false : swapIdentityProps.lockInMenu;
                  const swapPositionInMenu = (typeof swapIdentityProps.positionInMenu !== 'number' ) ? -1    : swapIdentityProps.positionInMenu;
                  this.__debugIdentityControl(`-- SWAP id="${swapIdentityId}" swapLockInMenu=${swapLockInMenu} swapPositionInMenu=${swapPositionInMenu}`);

                  if (swapLockInMenu) {
                    this.__debugIdentityControl(`-- Swap Identity is lockInMenu, skipping: id="${swapIdentityId}"`);
                  } else {
                    foundEligibleSwapIdentity = true;

                    if (swapPositionInMenu < 0) {
                      this.error(`-- Swap Identity has no positionInMenu: id="${swapIdentityId}"`);
                      error = true;
                      break; // something is broken - give up

                    } else if (swapPositionInMenu === movePositionInMenu) {
                      this.error(`-- Move & Swap positionInMenu are the same: id="${swapIdentityId}"`);
                      error = true;
                      break; // something is broken - give up

                    } else {
                      // SWAP!!!
                      this.__debugIdentityControl( "-- CAN SWAP --",
                                                 `\n- Move Identity id="${moveIdentityId}" positionInMenu=${movePositionInMenu}`,
                                                 `\n- Swap Identity id="${swapIdentityId}" positionInMenu=${swapPositionInMenu}`,
                                );

                      moveIdentityProps.positionInMenu = swapPositionInMenu;
                      swapIdentityProps.positionInMenu = movePositionInMenu;
                      await this.#idmOptionsApi.storeIdentitiesExtendedProps(identitiesProps);

                      this.swapIdentityItemTRs(true, domIdentityDisplayOrderList, moveIdentityItemTR, swapIdentityItemTR);

                      identityMoved = true;
                      break; // found what we needed - we're done
                    }
                  }
                }
              }
            }

            if (! error && ! foundEligibleSwapIdentity) this.__debugIdentityControl(`-- FOUND NO UNLOCKED IDENTITY TO SWAP -- Identity id="${moveIdentityId}"`);
          }
        }
      }
    }

    if (! identityMoved) this.__debugIdentityControl(`-- NOT MOVED -- Identity id="${moveIdentityId}"`);

    this.__debugIdentityControl("-- end");
  }

  swapIdentityItemTRs(downward, domIdentityList, identityItemTR1, identityItemTR2) {
    if (this.#DEBUG) {
      this.debugAlways(`downward=${downward} id1="${identityItemTR1.getAttribute('identityId')}" id2="${identityItemTR2.getAttribute('identityId')}" `);
    }

    if (identityItemTR1.parentNode !== domIdentityList || identityItemTR2.parentNode !== domIdentityList) {
      this.error("Both children must be direct descendants of the parent domIdentityList element");

    } else {
      if (this.#DEBUG) {
        const email1 = identityItemTR1.querySelector('.identity-item-email').textContent;
        const email2 = identityItemTR2.querySelector('.identity-item-email').textContent;
        this.debugAlways(`INSERT email1="${email1}" BEFORE email2="${email2}" `);
      }

      // If Pos and/or Idx are displayed they need to be updated in the DOM!!!
      if (this.#option_displayIdentityPosition) {
        const posSelector = 'td.identity-item-pos';
        const domPos1     = identityItemTR1.querySelector(posSelector);
        const domPos2     = identityItemTR2.querySelector(posSelector);
        if (! domPos1 || ! domPos2) {
          this.error(`Cannot swap DOM Identity Position values -- domPos1 and/or domPos2 not found: selector="${posSelector}"`);
        } else {
          const saveText    = domPos1.innerText;
          domPos1.innerText = domPos2.innerText;
          domPos2.innerText = saveText;
        }
      }
      if (this.#option_displayIdentityIndex) {
        const idxSelector = 'td.identity-item-index';
        const domIdx1     = identityItemTR1.querySelector(idxSelector);
        const domIdx2     = identityItemTR2.querySelector(idxSelector);
        if (! domIdx1 || ! domIdx2) {
          this.error(`Cannot swap DOM Identity Index values -- domIdx1 and/or domIdx2 not found: selector="${idxSelector}"`);
        } else {
          const saveText    = domIdx1.innerText;
          domIdx1.innerText = domIdx2.innerText;
          domIdx2.innerText = saveText;
        }
      }

      if (downward) {
        const identityItemTR2NextSibling = identityItemTR2.nextSibling;
        domIdentityList.insertBefore(identityItemTR2, identityItemTR1);
        domIdentityList.insertBefore(identityItemTR1, identityItemTR2NextSibling);
      } else {
        const identityItemTR1NextSibling = identityItemTR1.nextSibling;
        domIdentityList.insertBefore(identityItemTR1, identityItemTR2);
        domIdentityList.insertBefore(identityItemTR2, identityItemTR1NextSibling);
      }
    }
  }



  async DEADmoveIdentityToTop(e, identityIdToMove) {
    this.__debugIdentityControl(`-- identityIdToMove="${identityIdToMove}"`);

    if (identityIdToMove) {
      const domIdentityDisplayOrderList = document.getElementById("idmIdentityDisplayOrderList"); // MABXXX WHAT IF WE DIDN'T FIND IT?
      const identityToMoveTRSelector    = `tr.identity-item[identityId='${identityIdToMove}']`;
      const domIdentityToMoveTR         = domIdentityDisplayOrderList.querySelector(identityToMoveTRSelector);

      if (! domIdentityToMoveTR) {
        this.error(`-- FAILED TO FIND IDENTITY TO MOVE TR -- identityToMoveTRSelector="${identityToMoveTRSelector}"`);

      } else {
        this.__debugIdentityControl(`-- Found Identity To Move TR -- identityToMoveTRSelector="${identityToMoveTRSelector}"`);

        const identitiesProps   = await this.#idmOptionsApi.getIdentitiesExtendedProps();
        const identityPropsToMove = identitiesProps[identityIdToMove];

        if (! identityPropsToMove) {
          this.error(`-- CANNOT MOVE -- Identity Props to Move NOT Found: id="${identityIdToMove}"`);
        } else if (identityPropsToMove.lockInMenu) {
          this.__debugIdentityControl(`-- CANNOT MOVE - Identity to Move is lockInMenu: id="${identityIdToMove}"`);
        } else {
          const positionInMenuToMove = identityPropsToMove.positionInMenu;
          var   firstUnlockedFound   = false;
          var   storeIdentitiesProps = false;
          var   positionInMenu       = 0;
          var   swapIdentityId       = identityIdToMove;
          var   swapDomIdentityTR    = domIdentityToMoveTR;
          var   swapIdentityProps    = identityPropsToMove;
          var   swapPositionInMenu   = positionInMenuToMove
          const domIdentityTRs       = domIdentityDisplayOrderList.querySelectorAll('tr.identity-item'); // this does not include the Header!

          for (const domIdentityTR of domIdentityTRs) {
            const domIdentityId    = domIdentityTR.getAttribute('identityId');
            if (! identitiesProps) {
              this.error("FAILED TO GET identityId from identity-item TR:", domIdentityTR);
              storeIdentitiesProps = false;
              break;
            }

            const identityProps = identitiesProps[domIdentityId];             // MABXXX WHAT IF IT'S NOT FOUND???
            if (! identitiesProps) {
              this.error(`FAILED TO GET IdentityProps for Identity "${domIdentityId}"`);
              storeIdentitiesProps = false;
              break;
            }

            const idPositionInMenu = identityProps.positionInMenu;
            this.__debugIdentityControl( "\n----",
                                         `\n<< identityIdToMove ....... "${identityIdToMove}"`,
                                         `\n<< positionInMenuToMove ... ${positionInMenuToMove}`,
                                         `\n>> domIdentityId .......... "${domIdentityId}"`,
                                         `\n>> idPositionInMenu= ...... ${idPositionInMenu}`,
                                         `\n>> lockInMenu ............. ${(domIdentityTR.classList.contains('lock-in-menu'))}`,
                                         `\n-- swapIdentityId ......... "${swapIdentityId}"`,
                                         `\n-- swapPositionInMenu ..... ${swapPositionInMenu}`,
                                         `\n-- positionInMenu= ........ ${positionInMenu}`,
                                         );

            if (idPositionInMenu === positionInMenuToMove) { // have we reached the position of where we're moving from???
              this.__debugIdentityControl("\n---- IdentityToMove Reached:");
              if (! firstUnlockedFound) {
                this.__debugIdentityControl("\n---- Cannot Move UP -- IdentityToMove Reached Before finding FIRST Unlocked Identity:");
              }
              break;
            }

            if (domIdentityTR.classList.contains('lock-in-menu')) { // or identityProps.lockInMenu???
//            this.__debugIdentityControl( "\n---- Skipping Locked Identity:",
//                                         `\n>> domIdentityId .......... "${domIdentityId}"`,
//                                         `\n>> idPositionInMenu= ...... ${idPositionInMenu}`,
//                                         `\n-- swapIdentityId ......... "${swapIdentityId}"`,
//                                         `\n-- swapPositionInMenu ..... ${swapPositionInMenu}`,
//                                         `\n-- positionInMenu= ........ ${positionInMenu}`,
//                                         `\n<< positionInMenuToMove ... ${positionInMenuToMove}`,
//                                         `\n<< identityIdToMove ....... "${identityIdToMove}"`,
//                                       );
            } else {
//            this.__debugIdentityControl( `\n---- Found${(! firstUnlockedFound) ? " FIRST" : ""} Unlocked Identity, Swapping:`,
//                                         `\n>> domIdentityId .......... "${domIdentityId}"`,
//                                         `\n>> idPositionInMenu= ...... ${idPositionInMenu}`,
//                                         `\n-- swapIdentityId ......... "${swapIdentityId}"`,
//                                         `\n-- swapPositionInMenu ..... ${swapPositionInMenu}`,
//                                         `\n-- positionInMenu= ........ ${positionInMenu}`,
//                                         `\n<< positionInMenuToMove ... ${positionInMenuToMove}`,
//                                         `\n<< identityIdToMove ....... "${identityIdToMove}"`,
//                                       );
              firstUnlockedFound = true;

              this.debugAlways(`\n---- SWAPPING ${swapPositionInMenu} --> ${positionInMenu}`);
//            this.swapIdentityItemTRs(true, domIdentityDisplayOrderList, swapDomIdentityTR, domIdentityTR); // downward=true;
              const nextSibling = domIdentityTR.nextSibling;
              domIdentityDisplayOrderList.insertBefore(identityItemTR2, identityItemTR1);
//            domIdentityDisplayOrderList.insertBefore(identityItemTR1, identityItemTR2NextSibling);

              // swap the data
              swapIdentityProps.positionInMenu = positionInMenu;
              identityProps.positionInMenu     = swapPositionInMenu;
              storeIdentitiesProps = true;
              
              // set up for next iteration
              swapIdentityId     = domIdentityId;
              swapDomIdentityTR  = domIdentityTR;
              swapIdentityProps  = identityProps;
              swapPositionInMenu = idPositionInMenu;
            }

            positionInMenu++;
if (positionInMenu > 15) break;
          }

if (false && storeIdentitiesProps) {
            // store the swapped data
            this.__debugIdentityControl("\n---- Storing Props");
            await this.#idmOptionsApi.storeIdentitiesExtendedProps(identitiesProps);
          }
        }
      }
    }
  }



  async moveIdentityToTop(e, identityId) {
    this.debug(`-- identityId="${identityId}"`);

    if (identityId) {
      const identitiesProps = await this.#idmOptionsApi.getIdentitiesExtendedProps();
      const props           = identitiesProps[identityId];
      const lockInMenu      = (!props || typeof props.lockInMenu !== 'boolean') ? false : props.lockInMenu;

      if (! props) {
        this.error(`-- CANNOT MOVE -- No Old Identity Props: id="${identityId}"`);
      } else if (lockInMenu) {
        this.debug(`-- CANNOT MOVE - Identity is lockInMenu: id="${identityId}"`);
      } else {
        const identitiesToMove = [identityId];
        await this.#idmIdentitiesApi.moveIdentitiesToTop(identitiesToMove);

////////const scrollPosition = this.getScrollPosition();
        await this.buildIdentitiesListUI(e);
////////this.setScrollPosition(scrollPosition);
        this.scrollIdentityToTop(identityId, 50, true);
      }
    }
  }



  async moveIdentityToBottom(e, identityId) {
    this.__debugIdentityControl(`-- identityId="${identityId}"`);

    if (identityId) {
      const identitiesProps = await this.#idmOptionsApi.getIdentitiesExtendedProps();
      const props           = identitiesProps[identityId];
      const lockInMenu      = (!props || typeof props.lockInMenu !== 'boolean') ? false : props.lockInMenu;

      if (! props) {
        this.error(`-- CANNOT MOVE -- No Old Identity Props: id="${identityId}"`);
      } else if (lockInMenu) {
        this.__debugIdentityControl(`-- CANNOT MOVE - Identity is lockInMenu: id="${identityId}"`);

      } else {
        const identitiesToMove = [identityId];
        await this.#idmIdentitiesApi.moveIdentitiesToBottom(identitiesToMove);

////////const scrollPosition = this.getScrollPosition();
        await this.buildIdentitiesListUI(e);
////////this.setScrollPosition(scrollPosition);
        this.scrollIdentityToBottom(identityId, 50, true);
      }
    }
  }



  // the user clicked a showInMenu or lockInMenu checkbox, etc
  // NOTE: This listener was added to process in the "capturing" phase of event processing
  //       That ***STILL*** does not help us prevent events from getting to Sortable.js !!!
  async identityOptionCheckClicked(e) {
    if (e === null) return;
    var target = e.target;

    this.__debugIdentityControl("-- begin");
    if (this.#DEBUG_IDENTITY_CONTROL) this.debugAlways( "-- begin", // don't build all this just to be denied by this.#DEBUG in this.debug()
                                                        `\n- id="${target.getAttribute('id')}"`,
                                                        `\n- for="${target.getAttribute('for')}"`,
                                                        `\n- tagName="${target.tagName}"`,
                                                        `\n- type="${target.type}"`,
                                                        `\n- checked="${target.checked}"`,
                                                        `\n- identity-item-check?=${target.classList.contains("identity-item-check")}`,
                                                        `\n- show-in-menu-check?=${target.classList.contains("show-in-menu-check")}`,
                                                        `\n- lock-in-menu-check?=${target.classList.contains("lock-in-menu-check")}`,
                                                        `\n- identityId="${target.getAttribute('identityId')}"`,
                                                      );


    // I thought that if the 'for' attribute on a label matched the 'id' attribute on a checkbox,
    // then it would be automatic that when you clicked on the label, the state of the checkbox
    // would change, just like clicking on the checkbox itself. And I could SWEAR it was working
    // that way, but then it did not (anymore?)  I do not know why.  So I am making it work that
    // way here.
//  if (target.tagName === 'LABEL') {
//return; 
//    const labelForId = target.getAttribute('for');
//    target = undefined;
//    if (! labelForId) {
//      this.__debugIdentityControl("-- a LABEL was clicked but it has no 'for' attribute");
//    } else {
//      const forElement = document.getElementById(labelForId);
//      if (! forElement) {
//        this.error(`-- a LABEL was clicked but its 'for' element was not found: labelForId="${labelForId}"`);
//      } else if (! forElement.tagName === 'INPUT' || ! forElement.type === 'checkbox') {
//        this.error(`-- a LABEL was clicked but its 'for' element is not a checkbox: id="${labelForId}"`);
//      } else {
//        target = forElement;
//        target.checked = ! target.checked; // <------------------- flipping the checked status ------------------------<<<MM
//      }
//    }
//  }

    if ( target
         && target.tagName === 'INPUT'
         && target.type === 'checkbox'
         && target.classList.contains("identity-item-check")
         && ( target.classList.contains("show-in-menu-check")
              || target.classList.contains("lock-in-menu-check") )
       )
    {
      if (! target.hasAttribute("identityId")) { // if it doesn't have an identityID then we can't store in IdentitiesExtendedProps
        this.error("-- I DIDN'T GET AN \"identitId\" - I CAN'T DO ANYTHING!!!");

      } else {
        const identitiesProps    = await this.#idmOptionsApi.getIdentitiesExtendedProps();
        const nextPositionInMenu = Object.entries(identitiesProps).length; // for placing a stray identity at the end
        const optionValue        = target.checked;
        const identityId         = target.getAttribute("identityId");
        const props              = identitiesProps[identityId];
        var   showInMenu         = (!props || typeof props.showInMenu     !== 'boolean') ? true               : props.showInMenu;
        var   lockInMenu         = (!props || typeof props.lockInMenu     !== 'boolean') ? false              : props.lockInMenu;
        const positionInMenu     = (!props || typeof props.positionInMenu !== 'number' ) ? nextPositionInMenu : props.positionInMenu;

        if (! props) {
          this.__debugIdentityControl("-- NO OLD PROPS - CREATING NEW PROPS --");
        } else {
          this.__debugIdentityControl(`-- OLD PROPS: showInMenu=${props.showInMenu} lockInMenu=${props.lockInMenu} positionInMenu=${props.positionInMenu}`);
        }

        // is it a showInMenu checkbox?
        if (target.classList.contains("show-in-menu-check")) {          // identity-item > identity-item-controls-left > show-in-menu-check
          showInMenu = optionValue;

          this.__debugIdentityControl(`-- NEW PROPS: showInMenu=${showInMenu} lockInMenu=${lockInMenu} positionInMenu=${positionInMenu}`);

          identitiesProps[identityId] = {
            'showInMenu':     showInMenu,
            'lockInMenu':     lockInMenu,
            'positionInMenu': positionInMenu
          }

          await this.#idmOptionsApi.storeIdentitiesExtendedProps(identitiesProps);

          // now find the TR.identity-item and set the classes and attributes
          const identitySelector    = `tr.identity-item[identityId='${identityId}']`
          const domSelectedIdentity = document.querySelector(identitySelector);
          if (! domSelectedIdentity) {
            this.__debugIdentityControl(`-- DID NOT FIND OUR IDENTITY-ITEM: "${identitySelector}"`);
          } else {
            this.__debugIdentityControl(`-- Found our identity-item: "${identitySelector}"`);
            this.__debugIdentityControl(`-- Setting attribute "showInMenu" to: "${showInMenu? 'true' : 'false'}"`);
            domSelectedIdentity.setAttribute("showInMenu", showInMenu ? 'true' : 'false' );

            if (showInMenu) {
              this.__debugIdentityControl("-- removing class 'not-show-in-menu'");
              domSelectedIdentity.classList.remove("not-show-in-menu"); // Which is more expensive?  Removing a class that's not there, or checking for it first?
            } else {
              this.__debugIdentityControl("-- adding class 'not-show-in-menu'"); // Which is more expensive?  Adding a class that's already there, or checking for it first?
              domSelectedIdentity.classList.add("not-show-in-menu"); // Which is more expensive?  Adding a class that's already there, or checking for it first?
            }
          }

          this.__debugIdentityControl("-- new showInMenu checkbox status: ", identitiesProps);

        // is it a lockInMenu checkbox?
        } else if (target.classList.contains("lock-in-menu-check")) {   // identity-item > identity-item-controls-right > > lock-in-menu-check
          lockInMenu = optionValue;

          this.__debugIdentityControl(`-- NEW PROPS: showInMenu=${showInMenu} lockInMenu=${lockInMenu} positionInMenu=${positionInMenu}`);

          identitiesProps[identityId] = {
            'showInMenu':     showInMenu,
            'lockInMenu':     lockInMenu,
            'positionInMenu': positionInMenu
          }

          await this.#idmOptionsApi.storeIdentitiesExtendedProps(identitiesProps);

          // now find the TR.identity-item and set the classes and attributes
          const identitySelector    = `tr.identity-item[identityId='${identityId}']`
          const domSelectedIdentity = document.querySelector(identitySelector);
          if (! domSelectedIdentity) {
            this.__debugIdentityControl(`-- DID NOT FIND OUR IDENTITY-ITEM: "${identitySelector}"`);
          } else {
            this.__debugIdentityControl(`-- Found our identity-item: "${identitySelector}"`);
            this.__debugIdentityControl(`-- Setting attribute "lockInMenu" to: "${lockInMenu? 'true' : 'false'}"`);
            domSelectedIdentity.setAttribute("lockInMenu", lockInMenu ? 'true' : 'false');

            if (lockInMenu) {
              this.__debugIdentityControl("-- adding class 'lock-in-menu'");
              domSelectedIdentity.classList.add("lock-in-menu");    // need this for Sortable.js // Which is more expensive?  Adding a class that's already there, or checking for it first?
              domSelectedIdentity.classList.remove("identity-item-draggable");
            } else {
              this.__debugIdentityControl("-- removing class 'lock-in-menu'");
              domSelectedIdentity.classList.remove("lock-in-menu"); // need this for Sortable.js // Which is more expensive?  Removing a class that's not there, or checking for it first?
              domSelectedIdentity.classList.add("identity-item-draggable");
            }
          }

          this.__debugIdentityControl("-- new lockInMenu checkbox status: ", identitiesProps);

        } else {
          // We don't know exactly which checkbox it is!!!  This outer "if" should have prevented this
        }
      }
    } else {
      this.__debugIdentityControl("-- NOT OUR ELEMENT --");
    }

    this.__debugIdentityControl("-- end");
  }



  // Something was clicked.
  // Check if an Action Button was clicked - Sort, Refresh, Move to Top, Move to Bottom, Lock All, Unlock All, Show All, Hide All, Create, etc
  // NOTE: This listener is added to the DOCUMENT!  **ANY** Click Event will cause this function to get called!!!
  async actionClicked(e) {
    this.__debugActionClicked('--');
    if (e === null) return;

    this.__debugActionClicked(`-- tagName="${e.target.tagName}" id="${e.target.id}"`);

    if (e.target.tagName === 'BUTTON' || e.target.tagName === 'LABEL') {
      this.__debugActionClicked(`-- BUTTON OR LABEL CLICKED tagName="${e.target.tagName}" id="${e.target.id}"`);
      
      // I thought the browser was supposed to take care of this <label> with a 'for' attribute stuff...
      if (e.target.tagName === 'LABEL' && ! e.target.parentElement || e.target.parentElement.tagName !== 'BUTTON') {
        // ignore it - let optionChanged() handle it
      } else {
        e.preventDefault();

        var button;
        if (e.target.tagName === 'LABEL') {
          button = e.target.parentElement;
        } else {
          button = e.target;
        }

        const buttonId = button.id;
        this.__debugActionClicked(`-- BUTTON CLICKED tagName="${button.tagName}" id="${buttonId}"`);

        if (buttonId) switch (buttonId) {
          case "idmAutoSortButton":
            await this.autoSortButtonClicked(e);
            break;
          case "idmRefreshListButton":
          case "idmDisplayInDisplayOrderRefreshButton": // from developer options panel
            await this.buildIdentitiesListUI(e);  // clears filters!!!
            break;
          case "idmMoveSelectedToTopButton":
            await this.moveSelectedIdentitiesToTop(e);
            break;
          case "idmMoveSelectedToBottomButton":
            await this.moveSelectedIdentitiesToBottom(e);
            break;
          case "idmShowSelectedButton":
            await this.showInMenuSelected(e);
            break;
          case "idmHideSelectedButton":
            await this.unshowInMenuSelected(e);
            break;
          case "idmShowAllButton":
            await this.showInMenuAll(e);
            break;
          case "idmHideAllButton":
            await this.unshowInMenuAll(e);
            break;
          case "idmLockSelectedButton":
            await this.lockInMenuSelected(e);
            break;
          case "idmUnlockSelectedButton":
            await this.unlockInMenuSelected(e);
            break;
          case "idmLockAllButton":
            await this.lockInMenuAll(e);
            break;
          case "idmUnlockAllButton":
            await this.unlockInMenuAll(e);
            break;
          case "idmImportIdentitiesButton":
            await this.selectAndImportIdentities(e);
            break;
          case "idmCreateIdentityButton":
            await this.createIdentity(e);
            break;
          case "idmSelectAllButton":
            await this.selectAllIdentities(e);
            break;
          case "idmDeselectAllButton":
            await this.deselectAllIdentities(e);
            break;
//        case "idmHideOrShowChooserControls":
//          await this.hideOrShowChooserControlsButtonClicked(e);
//          break;
          case "idmShowBackupManagerButton":
            await this.showBackupManager(e);
            break;
          case "idmRunFilesystemBrokerMessagingTests":
          case "idmRunFilesystemApiTests":
          case "idmRunParseCSVFileTests":
          case "idmDisplayOrderFilterByAccountResetButton":
          case "idmDisplayOrderFilterByImportedResetButton":
          case "idmDisplayOrderFilterByLockedResetButton":
          case "idmDisplayOrderFilterByAccountDefaultResetButton":
          case "idmDisplayOrderFilterByCollectedResetButton":
          case "idmDisplayOrderFilterByLabelResetButton":
          case "idmDisplayOrderFilterByLabelResetButton":
          case "idmDisplayOrderFilterResetAllButton":
            // there are event listeners specific to these buttons - can stopPropagation() or something stop this function from getting called???
            // Does calling e.preventDefault() in the event listener prevent this?
            this.__debugActionClicked(`-- CLICK EVENT ON A BUTTON THAT HAS IT'S OWN LISTENER -- id="${buttonId}"`);
            break;
          default:
            this.__debugActionClicked(`-- CLICK EVENT ON A BUTTON WE DON'T KNOW ABOUT -- id="${buttonId}"`);
        }
      }

    } else if (e.target.tagName === "DIV") {
      const divId = e.target.id;

      if (divId === "idmExtensionOptionsTitle") {
        this.#extensionOptionsTitleClickTimer = setTimeout(() => this.extensionOptionsTitleDIVSingleClicked(e), this.#EXTENSION_OPTIONS_TITLE_CLICK_DELAY);
      } else {
        // we don't care about this click
        this.__debugActionClicked(`-- CLICK EVENT ON A DIV WE DON'T CARE ABOUT -- id="${e.target.id}"`);
      }

    } else {
      // we don't care about this click
      this.__debugActionClicked(`-- CLICK EVENT ON AN ELEMENT WE DON'T CARE ABOUT -- tagName="${e.target.tagName}" id="${e.target.id}"`);
    }
  }


  // Should be called ONLY when the this.#extensionOptionsTitleClickTimer has timed out
  async extensionOptionsTitleDIVSingleClicked(e) {
    this.#extensionOptionsTitleClickTimer = null; // is there sort of a race condition with this??? But isn't JavaScript single-threaded?

    if (! e) return;

    // nothing to do - we care only about the double-click
  }

  async extensionOptionsTitleDIVDoubleClicked(e) {
    if (! e) return;

    if (e.target.tagName === "DIV") {
      const divId = e.target.id;

      if (divId === "idmExtensionOptionsTitle") {
        if (this.#extensionOptionsTitleClickTimer) {
          const timer = this.#extensionOptionsTitleClickTimer; // is there sort of a race condition with this??? But isn't JavaScript single-threaded?
          this.#extensionOptionsTitleClickTimer = null;        // is there sort of a race condition with this??? But isn't JavaScript single-threaded?
          clearTimeout(timer);
        }

        const isEnabledShowDeveloperOptions = await this.#idmOptionsApi.isEnabledOption("idmShowDeveloperOptions");
        this.debug(`-- Extension Options DIV Double-Clicked isEnabledShowDeveloperOptions=${isEnabledShowDeveloperOptions}`);

        if (isEnabledShowDeveloperOptions) {
          // Developer Options ARE currently displayed, so remove them
          this.removeDeveloperOptions();
        } else {
          // Developer Options are NOT currently displayed, so add them
          await this.addDeveloperOptions();
        }

        await this.#idmOptionsApi.saveOption("idmShowDeveloperOptions", ! isEnabledShowDeveloperOptions); // flip the option
      }
    }
  }



  async addDeveloperOptions(e) {
    this.debug("-- started");

    const developerOptionsDIV = document.getElementById("idmDeveloperOptions");
    if (developerOptionsDIV) {
      // it's already there
    } else {
      const skipOnboardingEnabled                        = await this.#idmOptionsApi.isEnabledOption( "idmSkipOnboarding",                        false );
      const showOptionsWindowOnStartupEnabled            = await this.#idmOptionsApi.isEnabledOption( "idmShowOptionsWindowOnStartup",            false );
      const displayIdentityPositionInDisplayOrderEnabled = await this.#idmOptionsApi.isEnabledOption( "idmDisplayIdentityPositionInDisplayOrder", false ); // MABXXX cache value?
      const displayIdentityIndexInDisplayOrderEnabled    = await this.#idmOptionsApi.isEnabledOption( "idmDisplayIdentityIndexInDisplayOrder",    false ); // MABXXX cache value?
      const displayIdentityIdInDisplayOrderEnabled       = await this.#idmOptionsApi.isEnabledOption( "idmDisplayIdentityIdInDisplayOrder",       false ); // MABXXX cache value?

      const idmExtensionOptionsDIV = document.getElementById("idmExtensionOptions");

      const developerOptionsDIV =  document.createElement('div');
        developerOptionsDIV.setAttribute('id', "idmDeveloperOptions");

        const skipOnboardingDIV = document.createElement('div');
          skipOnboardingDIV.classList.add("option");
          const skipOnboardingCheck = document.createElement('input');
            skipOnboardingCheck.setAttribute('type', 'checkbox');
            skipOnboardingCheck.setAttribute('id', "idmSkipOnboarding");                            // <------- MUST MATCH OPTION NAME - ADD THIS TO modules/options.js
            skipOnboardingCheck.classList.add("idmGeneralOption");                                  // <------- IMPORTANT FOR AUTOMAMTIC STORAGE WHEN CHECKBOX CLICKED -------<<<<<
            skipOnboardingCheck.checked = skipOnboardingEnabled;
          skipOnboardingDIV.appendChild(skipOnboardingCheck);
          const skipOnboardingLabel = document.createElement('label');
            skipOnboardingLabel.setAttribute('for', "idmSkipOnboarding");                           // <------- MUST MATCH OPTION NAME
            skipOnboardingLabel.setAttribute("data-l10n-id", "options_idmSkipOnboardingCheck.label");
            const skipOnboardingLabelText = getI18nMsg("options_idmSkipOnboardingCheck.label");
            skipOnboardingLabel.appendChild( document.createTextNode(skipOnboardingLabelText) );
          skipOnboardingDIV.appendChild(skipOnboardingLabel);
        developerOptionsDIV.appendChild(skipOnboardingDIV);

        const showOptionsWindowOnStartupDIV = document.createElement('div');
          showOptionsWindowOnStartupDIV.classList.add("option");
          const showOptionsWindowOnStartupCheck = document.createElement('input');
            showOptionsWindowOnStartupCheck.setAttribute('type', 'checkbox');
            showOptionsWindowOnStartupCheck.setAttribute('id', "idmShowOptionsWindowOnStartup");     // <------- MUST MATCH OPTION NAME - ADD THIS TO modules/options.js
            showOptionsWindowOnStartupCheck.classList.add("idmGeneralOption");                      // <------- IMPORTANT FOR AUTOMAMTIC STORAGE WHEN CHECKBOX CLICKED -------<<<<<
            showOptionsWindowOnStartupCheck.checked = showOptionsWindowOnStartupEnabled;
          showOptionsWindowOnStartupDIV.appendChild(showOptionsWindowOnStartupCheck);
          const showOptionsWindowOnStartupLabel = document.createElement('label');
            showOptionsWindowOnStartupLabel.setAttribute('for', "idmShowOptionsWindowOnStartup");    // <------- MUST MATCH OPTION NAME
            showOptionsWindowOnStartupLabel.setAttribute("data-l10n-id", "options_idmShowOptionsWindowOnStartupCheck.label");
            const showOptionsWindowOnStartupLabelText = getI18nMsg("options_idmShowOptionsWindowOnStartupCheck.label");
            showOptionsWindowOnStartupLabel.appendChild( document.createTextNode(showOptionsWindowOnStartupLabelText) );
          showOptionsWindowOnStartupDIV.appendChild(showOptionsWindowOnStartupLabel);
        developerOptionsDIV.appendChild(showOptionsWindowOnStartupDIV);

        const displayColumnsInDisplayOrderDIV = document.createElement('div');
          displayColumnsInDisplayOrderDIV.classList.add("option");

          const displayColumnsInDisplayOrderLabel = document.createElement('label');
            displayColumnsInDisplayOrderLabel.setAttribute("data-l10n-id", "options_idmDisplayColumnsInDisplayOrder.label");
            const displayColumnsInDisplayOrderLabelText = getI18nMsg("options_idmDisplayColumnsInDisplayOrder.label");
            displayColumnsInDisplayOrderLabel.appendChild( document.createTextNode(displayColumnsInDisplayOrderLabelText) );
          displayColumnsInDisplayOrderDIV.appendChild(displayColumnsInDisplayOrderLabel);

          const displayIdentityPositionInDisplayOrderCheck = document.createElement('input');
            displayIdentityPositionInDisplayOrderCheck.setAttribute('type', 'checkbox');
            displayIdentityPositionInDisplayOrderCheck.setAttribute('id', "idmDisplayIdentityPositionInDisplayOrder");  // <-- MUST MATCH OPTION NAME - ADD THIS TO modules/options.js
            displayIdentityPositionInDisplayOrderCheck.style.setProperty("margin-left", "1.0em");
            displayIdentityPositionInDisplayOrderCheck.classList.add("idmGeneralOption");                     // <------- IMPORTANT FOR AUTOMAMTIC STORAGE WHEN CHECKBOX CLICKED ---<<
            displayIdentityPositionInDisplayOrderCheck.checked = displayIdentityPositionInDisplayOrderEnabled;
          displayColumnsInDisplayOrderDIV.appendChild(displayIdentityPositionInDisplayOrderCheck);
          const displayIdentityPositionInDisplayOrderLabel = document.createElement('label');
            displayIdentityPositionInDisplayOrderLabel.setAttribute('for', "idmDisplayIdentityPositionInDisplayOrder"); // <------- MUST MATCH OPTION NAME
            displayIdentityPositionInDisplayOrderLabel.setAttribute("data-l10n-id", "options_idmDisplayIdentityPositionInDisplayOrderCheck.label");
            const displayIdentityPositionInDisplayOrderLabelText = getI18nMsg("options_idmDisplayIdentityPositionInDisplayOrderCheck.label");
            displayIdentityPositionInDisplayOrderLabel.appendChild( document.createTextNode(displayIdentityPositionInDisplayOrderLabelText) );
          displayColumnsInDisplayOrderDIV.appendChild(displayIdentityPositionInDisplayOrderLabel);

          const displayIdentityIndexInDisplayOrderCheck = document.createElement('input');
            displayIdentityIndexInDisplayOrderCheck.setAttribute('type', 'checkbox');
            displayIdentityIndexInDisplayOrderCheck.setAttribute('id', "idmDisplayIdentityIndexInDisplayOrder");  // <------- MUST MATCH OPTION NAME - ADD THIS TO modules/options.js
            displayIdentityIndexInDisplayOrderCheck.style.setProperty("margin-left", "1.0em");
            displayIdentityIndexInDisplayOrderCheck.classList.add("idmGeneralOption");                     // <------- IMPORTANT FOR AUTOMAMTIC STORAGE WHEN CHECKBOX CLICKED ---<<<<
            displayIdentityIndexInDisplayOrderCheck.checked = displayIdentityIndexInDisplayOrderEnabled;
          displayColumnsInDisplayOrderDIV.appendChild(displayIdentityIndexInDisplayOrderCheck);
          const displayIdentityIndexInDisplayOrderLabel = document.createElement('label');
            displayIdentityIndexInDisplayOrderLabel.setAttribute('for', "idmDisplayIdentityIndexInDisplayOrder"); // <------- MUST MATCH OPTION NAME
            displayIdentityIndexInDisplayOrderLabel.setAttribute("data-l10n-id", "options_idmDisplayIdentityIndexInDisplayOrderCheck.label");
            const displayIdentityIndexInDisplayOrderLabelText = getI18nMsg("options_idmDisplayIdentityIndexInDisplayOrderCheck.label");
            displayIdentityIndexInDisplayOrderLabel.appendChild( document.createTextNode(displayIdentityIndexInDisplayOrderLabelText) );
          displayColumnsInDisplayOrderDIV.appendChild(displayIdentityIndexInDisplayOrderLabel);

          const displayIdentityIdInDisplayOrderCheck = document.createElement('input');
            displayIdentityIdInDisplayOrderCheck.setAttribute('type', 'checkbox');
            displayIdentityIdInDisplayOrderCheck.setAttribute('id', "idmDisplayIdentityIdInDisplayOrder");  // <------- MUST MATCH OPTION NAME - ADD THIS TO modules/options.js
            displayIdentityIdInDisplayOrderCheck.style.setProperty("margin-left", "1.0em");
            displayIdentityIdInDisplayOrderCheck.classList.add("idmGeneralOption");                     // <------- IMPORTANT FOR AUTOMAMTIC STORAGE WHEN CHECKBOX CLICKED ------<<<<
            displayIdentityIdInDisplayOrderCheck.checked = displayIdentityIdInDisplayOrderEnabled;
          displayColumnsInDisplayOrderDIV.appendChild(displayIdentityIdInDisplayOrderCheck);
          const displayIdentityIdInDisplayOrderLabel = document.createElement('label');
            displayIdentityIdInDisplayOrderLabel.setAttribute('for', "idmDisplayIdentityIdInDisplayOrder"); // <------- MUST MATCH OPTION NAME
            displayIdentityIdInDisplayOrderLabel.setAttribute("data-l10n-id", "options_idmDisplayIdentityIdInDisplayOrderCheck.label");
            const displayIdentityIdInDisplayOrderLabelText = getI18nMsg("options_idmDisplayIdentityIdInDisplayOrderCheck.label");
            displayIdentityIdInDisplayOrderLabel.appendChild( document.createTextNode(displayIdentityIdInDisplayOrderLabelText) );
          displayColumnsInDisplayOrderDIV.appendChild(displayIdentityIdInDisplayOrderLabel);

          const refreshListButton = document.createElement('button');
            refreshListButton.setAttribute('id', "idmDisplayInDisplayOrderRefreshButton");
            refreshListButton.setAttribute("data-l10n-id", "options_idmDisplayInDisplayOrderRefreshButton.label");
            refreshListButton.style.setProperty("margin-left", "2.0em");
            const refreshListButtonText = getI18nMsg("options_idmDisplayInDisplayOrderRefreshButton.label");
            refreshListButton.appendChild( document.createTextNode(refreshListButtonText) );
          displayColumnsInDisplayOrderDIV.appendChild(refreshListButton);

        developerOptionsDIV.appendChild(displayColumnsInDisplayOrderDIV);

        const buttonPanelDIV = document.createElement('div');
          buttonPanelDIV.classList.add("option");
          buttonPanelDIV.classList.add("option-panel");
          buttonPanelDIV.classList.add("dev-option-panel");
          buttonPanelDIV.classList.add("dev-button-panel");
          buttonPanelDIV.setAttribute('id', "idmDevButtonPanel");

          const runFilesystemBrokerTestsButton = document.createElement('button');
            runFilesystemBrokerTestsButton.setAttribute('id', "idmRunFilesystemBrokerMessagingTests");
            runFilesystemBrokerTestsButton.setAttribute('title', getI18nMsg("options_idmp-dev-RunFilesystemBrokerTestsButton.tooltip"));
            runFilesystemBrokerTestsButton.addEventListener('click', (e) => this.testFilesystemBrokerMessagingButtonClicked(e)); //, true);
            const runFilesystemBrokerTestsButtonLabel = document.createElement('label');
              runFilesystemBrokerTestsButtonLabel.setAttribute('id', "idmRunFilesystemBrokerMessagingTestsLabel");
              runFilesystemBrokerTestsButtonLabel.setAttribute('for', "idmRunFilesystemBrokerMessagingTests");
              runFilesystemBrokerTestsButtonLabel.setAttribute("data-l10n-id", "options_idmp-dev-RunFilesystemBrokerTestsButton.label");
              const runFilesystemBrokerTestsButtonLabelText = getI18nMsg("options_idmp-dev-RunFilesystemBrokerTestsButton.label");
              runFilesystemBrokerTestsButtonLabel.appendChild( document.createTextNode(runFilesystemBrokerTestsButtonLabelText) );
            runFilesystemBrokerTestsButton.appendChild(runFilesystemBrokerTestsButtonLabel);
          buttonPanelDIV.appendChild(runFilesystemBrokerTestsButton);

          const runFilesystemBrokerApiTestsButton = document.createElement('button');
            runFilesystemBrokerApiTestsButton.setAttribute('id', "idmRunFilesystemBrokerApiTests");
            runFilesystemBrokerApiTestsButton.setAttribute('title', getI18nMsg("options_idmp-dev-RunFilesystemBrokerApiTestsButton.tooltip"));
            runFilesystemBrokerApiTestsButton.addEventListener('click', (e) => this.testFilesystemBrokerApiButtonClicked(e)); //, true);
            const runFilesystemBrokerApiTestsButtonLabel = document.createElement('label');
              runFilesystemBrokerApiTestsButtonLabel.setAttribute('id', "idmRunFilesystemBrokerApiTestsLabel");
              runFilesystemBrokerApiTestsButtonLabel.setAttribute('for', "idmRunFilesystemBrokerApiTests");
              runFilesystemBrokerApiTestsButtonLabel.setAttribute("data-l10n-id", "options_idmp-dev-RunFilesystemBrokerApiTestsButton.label");
              const runFilesystemBrokerApiTestsButtonLabelText = getI18nMsg("options_idmp-dev-RunFilesystemBrokerApiTestsButton.label");
              runFilesystemBrokerApiTestsButtonLabel.appendChild( document.createTextNode(runFilesystemBrokerApiTestsButtonLabelText) );
            runFilesystemBrokerApiTestsButton.appendChild(runFilesystemBrokerApiTestsButtonLabel);
          buttonPanelDIV.appendChild(runFilesystemBrokerApiTestsButton);

          const runFilesystemApiTestsButton = document.createElement('button');
            runFilesystemApiTestsButton.setAttribute('id', "idmRunFilesystemApiTests");
            runFilesystemApiTestsButton.setAttribute('title', getI18nMsg("options_idmp-dev-RunFilesystemApiTestsButton.tooltip"));
            runFilesystemApiTestsButton.addEventListener('click', (e) => this.testFilesystemApiButtonClicked(e)); //, true);
            const runFilesystemApiTestsButtonLabel = document.createElement('label');
              runFilesystemApiTestsButtonLabel.setAttribute('id', "idmRunFilesystemApiTestsLabel");
              runFilesystemApiTestsButtonLabel.setAttribute('for', "idmRunFilesystemApiTests");
              runFilesystemApiTestsButtonLabel.setAttribute("data-l10n-id", "options_idmp-dev-RunFilesystemApiTestsButton.label");
              const runFilesystemApiTestsButtonLabelText = getI18nMsg("options_idmp-dev-RunFilesystemApiTestsButton.label");
              runFilesystemApiTestsButtonLabel.appendChild( document.createTextNode(runFilesystemApiTestsButtonLabelText) );
            runFilesystemApiTestsButton.appendChild(runFilesystemApiTestsButtonLabel);
          buttonPanelDIV.appendChild(runFilesystemApiTestsButton);

          const runParseCSVFileTestsButton = document.createElement('button');
            runParseCSVFileTestsButton.setAttribute('id', "idmRunParseCSVFileTests");
            runParseCSVFileTestsButton.setAttribute('title', getI18nMsg("options_idmp-dev-RunParseCSVFileTestsButton.tooltip"));
            runParseCSVFileTestsButton.addEventListener('click', (e) => this.testParseCSVFileButtonClicked(e)); //, true);
            const runParseCSVFileTestsButtonLabel = document.createElement('label');
              runParseCSVFileTestsButtonLabel.setAttribute('id', "idmRunParseCSVFileTestsLabel");
              runParseCSVFileTestsButtonLabel.setAttribute('for', "idmRunParseCSVFileTests");
              runParseCSVFileTestsButtonLabel.setAttribute("data-l10n-id", "options_idmp-dev-RunParseCSVFileTestsButton.label");
              const runParseCSVFileTestsButtonLabelText = getI18nMsg("options_idmp-dev-RunParseCSVFileTestsButton.label");
              runParseCSVFileTestsButtonLabel.appendChild( document.createTextNode(runParseCSVFileTestsButtonLabelText) );
            runParseCSVFileTestsButton.appendChild(runParseCSVFileTestsButtonLabel);
          buttonPanelDIV.appendChild(runParseCSVFileTestsButton);

          const runOptionsBackupTestsButton = document.createElement('button');
            runOptionsBackupTestsButton.setAttribute('id', "idmRunOptionsBackupTests");
            runOptionsBackupTestsButton.setAttribute('title', getI18nMsg("options_idmp-dev-RunOptionsBackupTestsButton.tooltip"));
            runOptionsBackupTestsButton.addEventListener('click', (e) => this.testOptionsBackupButtonClicked(e)); //, true);
            const runOptionsBackupTestsButtonLabel = document.createElement('label');
              runOptionsBackupTestsButtonLabel.setAttribute('id', "idmRunOptionsBackupTestsLabel");
              runOptionsBackupTestsButtonLabel.setAttribute('for', "idmRunOptionsBackupTests");
              runOptionsBackupTestsButtonLabel.setAttribute("data-l10n-id", "options_idmp-dev-RunOptionsBackupTestsButton.label");
              const runOptionsBackupTestsButtonLabelText = getI18nMsg("options_idmp-dev-RunOptionsBackupTestsButton.label");
              runOptionsBackupTestsButtonLabel.appendChild( document.createTextNode(runOptionsBackupTestsButtonLabelText) );
            runOptionsBackupTestsButton.appendChild(runOptionsBackupTestsButtonLabel);
          buttonPanelDIV.appendChild(runOptionsBackupTestsButton);

          if (! this.#popupWindowMode) {
            const displayOptionsAsPopupButton = document.createElement('button');
              displayOptionsAsPopupButton.setAttribute('id', "idmDisplayOptionsAsPopup");
              displayOptionsAsPopupButton.setAttribute('title', getI18nMsg("options_idmp-dev-displayOptionsAsPopupButton.tooltip"));
              displayOptionsAsPopupButton.addEventListener('click', (e) => this.displayOptionsAsPopupButtonClicked(e), true); // true: capturing phase
              const displayOptionsAsPopupButtonLabel = document.createElement('label');
                displayOptionsAsPopupButtonLabel.setAttribute('id', "idmDisplayOptionsAsPopup");
                displayOptionsAsPopupButtonLabel.setAttribute('for', "idmDisplayOptionsAsPopup");
                displayOptionsAsPopupButtonLabel.setAttribute("data-l10n-id", "options_idmp-dev-displayOptionsAsPopupButton.label");;
                const displayOptionsAsPopupButtonLabelText = getI18nMsg("options_idmp-dev-displayOptionsAsPopupButton.label");
                displayOptionsAsPopupButtonLabel.appendChild( document.createTextNode(displayOptionsAsPopupButtonLabelText) );
              displayOptionsAsPopupButton.appendChild(displayOptionsAsPopupButtonLabel);
            buttonPanelDIV.appendChild(displayOptionsAsPopupButton);
          }
        developerOptionsDIV.appendChild(buttonPanelDIV);

  /*  
        const showOptionsWindowOnStartupDIV = document.createElement('div');
          showOptionsWindowOnStartupDIV.classList.add("option");
          const showOptionsWindowOnStartupCheck = document.createElement('input');
            showOptionsWindowOnStartupCheck.setAttribute('type', 'checkbox');
            showOptionsWindowOnStartupCheck.setAttribute('id', "idmShowOptionsWindowOnStartup");  // <------- MUST MATCH OPTION NAME - ADD THIS TO modules/options.js
            showOptionsWindowOnStartupCheck.classList.add("idmGeneralOption");                     // <------- IMPORTANT FOR AUTOMAMTIC STORAGE WHEN CHECKBOX CLICKED -------<<<<<
            showOptionsWindowOnStartupCheck.checked = showOptionsWindowOnStartupEnabled;
          showOptionsWindowOnStartupDIV.appendChild(showOptionsWindowOnStartupCheck);
          const showOptionsWindowOnStartupLabel = document.createElement('label');
            showOptionsWindowOnStartupLabel.setAttribute('for', "idmShowOptionsWindowOnStartup"); // <------- MUST MATCH OPTION NAME
            showOptionsWindowOnStartupLabel.setAttribute("data-l10n-id", "options_idmSkipOnboardingCheck.label"); // update _locales/<lang>/messages.json
            const showOptionsWindowOnStartupLabelText = getI18nMsg("options_idmSkipOnboardingCheck.label");
            showOptionsWindowOnStartupLabel.appendChild( document.createTextNode(showOptionsWindowOnStartupLabelText) );
          showOptionsWindowOnStartupDIV.appendChild(showOptionsWindowOnStartupLabel);
        developerOptionsDIV.appendChild(showOptionsWindowOnStartupDIV);
  */
      const lastChild = idmExtensionOptionsDIV.lastElementChild;
      idmExtensionOptionsDIV.insertBefore(developerOptionsDIV, lastChild);
    }

    this.debug("-- done");
  }



  removeDeveloperOptions(e) {
    const developerOptionsDIV = document.getElementById("idmDeveloperOptions");
    if (developerOptionsDIV) {
      developerOptionsDIV.remove();
    }
  }



  // An Identity List header-item was clicked
  async identityHeaderClicked(e) {
    if (! e) return;

    this.debugAlways(`-- e.target.tagName="${e.target.tagName}" e.detail=${e.detail}`);
    const headerTH = e.target.tagName === 'TH' ? e.target : e.target.closest('th');

    if (! headerTH) {
      this.debugAlways("-- HEADER TH NOT FOUND");

    } else {
      this.debugAlways("\n-- HEADER TH:", headerTH, "\n--classlist:", headerTH.classList);

      if (! headerTH.classList.contains("header-item")) {
        this.debugAlways('-- click target does NOT have class "header-item"');

      } else {
        this.debugAlways('-- click target DOES has class "header-item"');

        const headerId = headerTH.getAttribute("id");
        this.debugAlways(`-- headerId="${headerId}"`);

        if (! headerId) {
          this.debugAlways("-- NO headerId");
        } else {
          const headerSort = headerTH.querySelector(".header-sort");

          if (! headerSort) {
            this.debugAlways("\n-- headerSort: NOT FOUND!!!");
          } else {
            const sortButtons = headerSort.querySelectorAll('button.sort-button');

            if (! sortButtons) {
              this.debugAlways("\n-- sortButtons: NOT FOUND!!!");
            } else {
              this.debugAlways(`\n-- sortButtons: lenngth=${sortButtons.length}`);
              for (const sortButton of sortButtons) {
                this.debugAlways("\n-- sortButton:", sortButton, "\n--classlist:", sortButton.classList);

                if (sortButton.classList.contains('sort-ascending')) {
                  this.debugAlways("\n-- sortButton: sort-ascending");
                } else if (sortButton.classList.contains('sort-descending')) {
                  this.debugAlways("\n-- sortButton: sort-descending");
                } else {
                  this.debugAlways("\n-- sortButton: sort ???");
                }
              }
            }
          }
        }
      }
    }
  }



  // An Identity List identity-item was clicked
  async identityClicked(e) {
    if (! e) return;

    this.debug(`-- e.target.tagName="${e.target.tagName}" e.detail=${e.detail}`);

    if (e.detail === 1 && (e.target.tagName === "TR" || e.target.tagName === "TD" || e.target.tagName === "SPAN") ) {
      this.debug("-- TR, TD, or SPAN Clicked");

      var trElement;
      if (e.target.tagName === "TR") {
        trElement = e.target;
      } else if (e.target.tagName === "TD") {
        if (e.target.parentElement && e.target.parentElement.tagName === "TR") {
          trElement = e.target.parentElement;
        }
      } else if (e.target.tagName === "SPAN") { // td.identity-item-label has descendent elements to enable markers
        const classList = e.target.classList;
        if (    classList.contains("identity-item-text")
             || classList.contains("identity-item-markers")
             || classList.contains("identity-item-marker")
           )
        {
          trElement = e.target.closest("tr.identity-item");
        }
      }

      if (trElement) {
        this.debug("-- Got TR");

        if (trElement.classList.contains("identity-item")) {
          const identityId = trElement.getAttribute("identityId");
          this.debug(`-- Got TR.identity-item identityId=${identityId} IDENTITY_ITEM_CLICK_DELAY=${this.#IDENTITY_ITEM_CLICK_DELAY}`);

          this.#identityItemClickTimer = setTimeout(() => this.identitySingleClicked(e, trElement), this.#IDENTITY_ITEM_CLICK_DELAY);
        }
      }
    }
  }

  // An identity-item was single-clicked
  // Should be called ONLY when the identityItemClickTimer for an identity-item click has timed out
  async identitySingleClicked(e, identityElement) {
    this.#identityItemClickTimer = null; // is there sort of a race condition with this??? But isn't JavaScript single-threaded?

    if (! e) return;

    const identityId = identityElement.getAttribute("identityId");
    const selected   = identityElement.getAttribute('selected');
    const lockInMenu = identityElement.classList.contains("lock-in-menu");

    this.debug(`-- Got SINGLE-CLICK ON TR: identityId=${identityId} selected=${selected} lockInMenu=${lockInMenu}`);

    var selectionChanged = false;
    if (lockInMenu) { // cannot select a lock-in-menu Identity
      if (identityElement.getAttribute('selected') ===  'true') {
        identityElement.setAttribute('selected', 'false');
        selectionChanged = true;
      }
    } else if (! selected || selected === 'false') {
      identityElement.setAttribute('selected', 'true');
      selectionChanged = true;
    } else {
      identityElement.setAttribute('selected', 'false');
      selectionChanged = true;
    }

    if (selectionChanged) this.enableDisableButtonsOnSelectionChanged();
  }



  enableDisableButtonsOnSelectionChanged() {
    // If one or more identities are selected, enable buttons that reqiuire selection
    // Otherwise disable them
    const showSelectedButton         = document.getElementById("idmShowSelectedButton");
    const hideSelectedButton         = document.getElementById("idmHideSelectedButton");
    const unlockSelectedButton       = document.getElementById("idmUnlockSelectedButton");
    const lockSelectedButton         = document.getElementById("idmLockSelectedButton");
    const moveSelectedToTopButton    = document.getElementById("idmMoveSelectedToTopButton");
    const moveSelectedToBottomButton = document.getElementById("idmMoveSelectedToBottomButton");
    const deselectAllButton          = document.getElementById("idmDeselectAllButton");

    if (this.getSelectedIdentityCount() === 0) {
      showSelectedButton.disabled         = true;
      hideSelectedButton.disabled         = true;
      unlockSelectedButton.disabled       = true;
      lockSelectedButton.disabled         = true;
      moveSelectedToTopButton.disabled    = true;
      moveSelectedToBottomButton.disabled = true;
      deselectAllButton.disabled          = true;
      showSelectedButton.setAttribute(         'disabled', 'true' );
      hideSelectedButton.setAttribute(         'disabled', 'true' );
      unlockSelectedButton.setAttribute(       'disabled', 'true' );
      lockSelectedButton.setAttribute(         'disabled', 'true' );
      moveSelectedToTopButton.setAttribute(    'disabled', 'true' );
      moveSelectedToBottomButton.setAttribute( 'disabled', 'true' );
      deselectAllButton.setAttribute(          'disabled', 'true' );
    } else {
      showSelectedButton.disabled         = false;
      hideSelectedButton.disabled         = false;
      unlockSelectedButton.disabled       = false;
      lockSelectedButton.disabled         = false;
      moveSelectedToTopButton.disabled    = false;
      moveSelectedToBottomButton.disabled = false;
      deselectAllButton.disabled          = false;
      showSelectedButton.removeAttribute(         'disabled' );
      hideSelectedButton.removeAttribute(         'disabled' );
      unlockSelectedButton.removeAttribute(       'disabled' );
      lockSelectedButton.removeAttribute(         'disabled' );
      moveSelectedToTopButton.removeAttribute(    'disabled' );
      moveSelectedToBottomButton.removeAttribute( 'disabled' );
      deselectAllButton.removeAttribute(          'disabled' );
    }
  }

  // An identity-item was double-clicked
  async identityDoubleClicked(e) {
    if (! e) return;

    this.debug(`-- e.target.tagName="${e.target.tagName}" e.detail=${e.detail}`);

    if (e.detail === 2 && (e.target.tagName === "TR" || e.target.tagName === "TD" || e.target.tagName === "SPAN" )) {
      this.debug("-- TR, TD, or SPAN Double-Clicked");

      var trElement;
      if (e.target.tagName === "TR") {
        trElement = e.target;
      } else if (e.target.tagName === "TD") {
        if (e.target.parentElement && e.target.parentElement.tagName === "TR") {
          trElement = e.target.parentElement;
        }
      } else if (e.target.tagName === "SPAN") { // td.identity-item-label has descendent elements to enable markers
        const classList = e.target.classList;
        if (    classList.contains("identity-item-text")
             || classList.contains("identity-item-markers")
             || classList.contains("identity-item-marker")
           )
        {
          trElement = e.target.closest("tr.identity-item");
        }
      }

      if (trElement) {
        this.debug("-- Got TR");

        if (trElement.classList.contains("identity-item")) {
          if (this.#identityItemClickTimer) {
            const timer = this.#identityItemClickTimer; // is there sort of a race condition with this??? But isn't JavaScript single-threaded?
            this.#identityItemClickTimer = null;      // is there sort of a race condition with this??? But isn't JavaScript single-threaded?
            clearTimeout(timer);
          }

          const identityId = trElement.getAttribute("identityId");
          this.debug(`-- Got TR.identity-item identityId=${identityId}`);

          if (identityId) {
            await this.editIdentity(e, identityId);
          }

          e.stopImmediatePropagation();  // MABXXX  DOES THIS MESS UP Sortable.js??? does not seem to, but it doesn't help us, either
        }
      }
    }
  }



  async editIdentity(e, identityId) {
    // MABXXX PREVENT MORE THAN ONE OF THESE!!!
    if (! identityId) return;

    this.debug(`-- identityId="${identityId}"`);

    var popupTop    = window.screenTop  + 200; 
    var popupLeft   = window.screenLeft + 200; 
    var popupWidth  = 650;
    var popupHeight = 730;

    const bounds = await this.#idmOptionsApi.getWindowBounds("editorWindowBounds");

    if (! bounds) {
      this.debug("-- no previous window bounds");
    } else if (typeof bounds !== 'object') {
      this.error(`-- PREVIOUS WINDOW BOUNDS "editorWindowBounds" IS NOT AN OBJECT: typeof='${typeof bounds}' #####`);
    } else {
      this.debug( "-- restoring previous window bounds:",
                  `\n- bounds.top=${bounds.top}`,
                  `\n- bounds.left=${bounds.left}`,
                  `\n- bounds.width=${bounds.width}`,
                  `\n- bounds.height=${bounds.height}`,
                );
      popupTop    = bounds.top;
      popupLeft   = bounds.left;
      popupWidth  = bounds.width;
      popupHeight = bounds.height;
    }

    const identityEditorUrl = messenger.runtime.getURL("identityEditor/identityEditor.html") + "?identityId=" + identityId;
    const identityEditorWindow = await messenger.windows.create(
      {
        url:                 identityEditorUrl,
        type:                "popup",
        titlePreface:        getExtensionName() + " - ",
        top:                 popupTop,
        left:                popupLeft,
        width:               popupWidth,
        height:              popupHeight,
        allowScriptsToClose: true,
      }
    );

    this.debug( "-- IdentityEditor Popup Window Created --",
                `\n- from window.id="${window.id}"`,
                `\n- identityEditorWindow.id="${identityEditorWindow.id}"`,
                `\n- URL="${identityEditorUrl}"`,
              );

    // window.id does not exist.  how do we get our own window id???
    var   ourTabId;
    var   ourWindowId;
    const currentTab = await messenger.tabs.getCurrent();
    if (! currentTab) {
      this.debug("-- messenger.tabs.getCurrent() didn't return a Tab");
    } else {
      this.debug(`-- currentTab.id="${currentTab.id}" currentTab.windowId="${currentTab.windowId}"`);
      ourTabId    = currentTab.id;
      ourWindowId = currentTab.windowId;
    }

    this.debug( "-- IdentityEditor Popup Window Created --",
                `\n-from ourTabId="${ourTabId}"`,
                `\n-from ourWindowId="${ourWindowId}"`,
                `\n-identityEditorWindow.id="${identityEditorWindow.id}"`,
////////////////`\n-URL="${identityEditorUrl}"`,
              );

    // Re-focus on the identityEditor window when our window gets focus
    // MABXXX PERHAPS THIS SHOULD BE DONE INSIDE identityEditorPrompt() ???
    const focusListener = async (windowId) => this.windowFocusChanged(windowId, ourTabId, ourWindowId, identityEditorWindow.id);
    messenger.windows.onFocusChanged.addListener(focusListener);

    // editorResponse - expected:
    // - null                  - the user closed the popup window                 (set by our own windows.onRemoved listener - the defaultResponse sent to identityEditorPrompt)
    // - CLOSED                - the user closed the popup window                 (sent by the IdentityEditor window's window.onClosed listener)
    // - CANCELED              - the user clicked the Cancel button               (sent by the IdentityEditor window's Cancel button listener)
    // - UPDATED               - the given Identity was updated                   (sent by the IdentityEditor window's Save button listener when editing)
    // - CREATED:newIdentityId - a new Identity was created with id=newIdentityId (sent by the IdentityEditor window's Save button listener when creating)

    const editorResponse = await this.identityEditorPrompt(identityEditorWindow.id, focusListener, null);
    this.debug(`-- IdentityEditor editorResponse="${editorResponse}"`);

    // NOW UPDATE THE UI!!!
    switch (editorResponse) {
      case 'UPDATED':
        {
          const selector   = `tr.identity-item[identityId='${identityId}']`;
          const domIdentityTR = e.target.closest(selector);

          if (! domIdentityTR) {
            this.error(`-- Failed to get identity container for update: selector="${selector}"`);

          } else {
            const idmIdentity = await this.#idmIdentitiesApi.getIdmIdentity(identityId);

            if (! idmIdentity) {
              this.error(`-- Failed to get idmIdentity for update: identityId="${identityId}"`);

            } else {
              // updating an Identity makes it no longer "collected" or "imported"
              if (domIdentityTR.classList.contains("collected-identity")) domIdentityTR.classList.remove("collected-identity");
              if (domIdentityTR.classList.contains("imported-identity"))  domIdentityTR.classList.remove("imported-identity");

// Markers are handled using CSS now
//////////////const markersSPAN = domIdentityTR.querySelector('.identity-item-markers');
//////////////if (markersSPAN) {
//////////////  const collectedMarkerSPAN = markersSPAN.querySelector('.identity-item-marker.marker-collected');
//////////////  const importedMarkerSPAN  = markersSPAN.querySelector('.identity-item-marker.marker-imported');
//////////////  if (collectedMarkerSPAN) collectedMarkerSPAN.remove();
//////////////  if (importedMarkerSPAN)  importedMarkerSPAN.remove();
//////////////
//////////////  if (markersSPAN.childElementCount === 0) {
//////////////    markersSPAN.remove();
//////////////  }
//////////////}

              if (idmIdentity.showInMenu) {
                if (domIdentityTR.classList.contains("not-show-in-menu")) domIdentityTR.classList.remove("not-show-in-menu");
                domIdentityTR.setAttribute("showInMenu", 'true');
              } else {
                if (! domIdentityTR.classList.contains("not-show-in-menu")) domIdentityTR.classList.add("not-show-in-menu");
                domIdentityTR.setAttribute("showInMenu", 'false');
              }
              if (idmIdentity.lockInMenu) {
                if (! domIdentityTR.classList.contains("lock-in-menu")) domIdentityTR.classList.add("lock-in-menu");
                domIdentityTR.classList.remove("identity-item-draggable");
                domIdentityTR.setAttribute("lockInMenu", 'true');
              } else {
                if (domIdentityTR.classList.contains("lock-in-menu")) domIdentityTR.classList.remove("lock-in-menu");
                domIdentityTR.classList.add("identity-item-draggable");
                domIdentityTR.setAttribute("lockInMenu", 'false');
              }

              const showInMenuCheck = domIdentityTR.querySelector("input.show-in-menu-check");
              const labelTD         = domIdentityTR.querySelector("td.identity-item-label");
              const emailTD         = domIdentityTR.querySelector("td.identity-item-email");
              const lockInMenuCheck = domIdentityTR.querySelector("input.lock-in-menu-check");

              showInMenuCheck.checked                 = idmIdentity.showInMenu;
//////////////labelTD.firstChild.nodeValue            = this.#idmIdentitiesApi.toIdentityLabel(identity);
              labelTD.firstChild.firstChild.nodeValue = idmIdentity.label; // label text is now in a <span>, not directly in the <td> anymore
              emailTD.firstChild.nodeValue            = idmIdentity.email;
              lockInMenuCheck.checked                 = idmIdentity.lockInMenu;
            }
          }
        }
        break;

      case 'CANCELED':
      case 'CLOSED':
      case null:
        break;

      default:
        if (editorResponse.startsWith("CREATED:")) { // "CREATED:newIdentityId" // should not happen without "identityId=CREATE" // MABXXX Perhaps this should be an object instead???
          // new Identity was created with id=newIdentityId
          const splits = editorResponse.split(":");
          if (splits.length === 2) {
            this.error(`-- UNEXPECTED IdentityEditorResponse: "${editorResponse}"`);
            break;
          } else {
            this.error(`-- MALFORMED IdentityEditorResponse: "${editorResponse}"`);
          }
        } else {
          this.error(`-- UNKNOWN IdentityEditorResponse: "${editorResponse}"`);
        }
    }
  }



  // IdentityEditor (identenEditor.js) does the actual creating of the new
  // IdmIdentity and places it at the END of the list via positionInMenu.
  // We just need to add them to the UI.
  //
  // Adds the Created Identity to the END of the UI list
  async createIdentity(e) {
    // MABXXX PREVENT MORE THAN ONE OF THESE!!!
    this.debug("-- begin");

    const identityEditorUrl = messenger.runtime.getURL("identityEditor/identityEditor.html") + "?identityId=CREATE";
    const identityEditorWindow = await messenger.windows.create(
      {
        url:                 identityEditorUrl,
        type:                "popup",
        titlePreface:        getExtensionName() + " - ",
        height:              580,                     // should store window size in local storage and use it here
        width:               670,                     // should store window size in local storage and use it here
        left:                window.screenLeft + 200, // should store window position in local storage and use it here
        top:                 window.screenTop  + 200, // should store window position in local storage and use it here
        allowScriptsToClose: true,
      }
    );

    this.debug( " -- IdentityEditor Popup Window Created --",
                `\n- from window.id="${window.id}"`,
                `\n- identityEditorWindow.id="${identityEditorWindow.id}"`,
                `\n- URL="${identityEditorUrl}"`,
              );

    // window.id does not exist.  how do we get our own window id???
    var   ourTabId;
    var   ourWindowId;
    const currentTab = await messenger.tabs.getCurrent();
    if (! currentTab) {
      this.error("-- messenger.tabs.getCurrent() didn't return a Tab");
    } else {
      this.debug(` -- currentTab.id="${currentTab.id}" currentTab.windowId="${currentTab.windowId}"`);
      ourTabId    = currentTab.id;
      ourWindowId = currentTab.windowId;
    }

    this.debug( " -- IdentityEditor Popup Window Created --",
                `\n-from ourTabId="${ourTabId}"`,
                `\n-from ourWindowId="${ourWindowId}"`,
                `\n-identityEditorWindow.id="${identityEditorWindow.id}"`,
////////////////`\n-URL="${identityEditorUrl}"`,
              );

    // Re-focus on the identityEditor window when our window gets focus
    // MABXXX PERHAPS THIS SHOULD BE DONE INSIDE identityEditorPrompt() ???
    const focusListener = async (windowId) => this.windowFocusChanged(windowId, ourTabId, ourWindowId, identityEditorWindow.id);
    messenger.windows.onFocusChanged.addListener(focusListener);

    // editorResponse - expected:
    // - null                  - the user closed the popup window                 (set by our own windows.onRemoved listener - the defaultResponse sent to identityEditorPrompt)
    // - CLOSED                - the user closed the popup window                 (sent by the IdentityEditor window's window.onClosed listener)
    // - CANCELED              - the user clicked the Cancel button               (sent by the IdentityEditor window's Cancel button listener)
    // - UPDATED               - the given Identity was updated                   (sent by the IdentityEditor window's Save button listener when editing)
    // - CREATED:newIdentityId - a new Identity was created with id=newIdentityId (sent by the IdentityEditor window's Save button listener when creating)

    const editorResponse = await this.identityEditorPrompt(identityEditorWindow.id, focusListener, null);
    this.debug(` -- IdentityEditor editorResponse="${editorResponse}"`);

    // NOW UPDATE THE UI!!!
    switch (editorResponse) {
      case 'UPDATED': // should not happen with "identityId=CREATE"
        this.error(`-- UNEXPECTED IdentityEditorResponse: "${editorResponse}"`);
        break;

      case 'CANCELED':
      case 'CLOSED':
      case null:
        break;

      default:
        if (editorResponse.startsWith("CREATED:")) { // "CREATED:newIdentityId" // MABXXX Perhaps this should be an object instead???
          // new Identity was created with id=newIdentityId

          const splits = editorResponse.split(":");
          if (splits.length === 2) {
            const newIdentityId = splits[1];
            this.debug(` -- newIdentityId="${newIdentityId}"`);

            const newIdmIdentity = await this.#idmIdentitiesApi.getIdmIdentity(newIdentityId);

            if (! newIdmIdentity) {
              this.error(`-- FAILED TO GET NEW IDENTITY -- newIdentityId="${newIdentityId}"`);
            } else {
              this.debug( " -- Got New Identity:",
                          `\n- id="${newIdmIdentity.id}"`,
                          `\n- name="${newIdmIdentity.name}"`,
                          `\n- email="${newIdmIdentity.email}"`,
                        );
              await this.appendIdentityItemUI(newIdmIdentity); // Does NOT update positionInMenu
            }

          } else {
            this.error(`-- MALFORMED IdentityEditorResponse: "${editorResponse}"`);
          }
        } else {
          this.error(`-- UNKNOWN IdentityEditorResponse: "${editorResponse}"`);
        }
    }
  }



  async identityEditorPrompt(identityEditorWindowId, focusListener, defaultResponse) {
    try {
      await messenger.windows.get(identityEditorWindowId);
    } catch (error) {
      // Window does not exist, assume closed.
      return defaultResponse;
    }

    return new Promise(resolve => {
      var response = defaultResponse;

      function windowRemovedListener(windowId) {
        if (windowId === identityEditorWindowId) {

          messenger.runtime.onMessage.removeListener(messageListener);
          messenger.windows.onRemoved.removeListener(windowRemovedListener);
          messenger.windows.onFocusChanged.removeListener(focusListener);

          resolve(response);
        }
      }

      /* The IdentityEditor sends a message as IdentityEditorResponse:
       *  - CLOSED                - the user closed the popup window                  --  Problem - message "conduit" gets destroyed before message is sent/received
       *  - CANCELED              - the user clicked the Cancel button
       *  - UPDATED:identityId    - the given Identity was updated, id=identityId // MABXXX Perhaps this should be an object instead???
       *  - CREATED:newIdentityId - a new Identity was created with id=newIdentityId // MABXXX Perhaps this should be an object instead???
       * Save this IdentityEditorResponse into response for resolve()
       */
      function messageListener(request, sender, sendResponse) {
        if (sender.tab && sender.tab.windowId === identityEditorWindowId && request && request.hasOwnProperty("IdentityEditorResponse")) {
          response = request.IdentityEditorResponse;
        }
        return false; // we're not sending any response
      }

      messenger.runtime.onMessage.addListener(messageListener);
      messenger.windows.onRemoved.addListener(windowRemovedListener);
    });
  }



  // IdentityImporter does the actual creating of the new IdmIdentities
  // and places them at the END of the list via positionInMenu.  We just
  // need to add them to the UI
  //
  // Adds the Imported Identities to the END of the UI list
  async selectAndImportIdentities(e) {
    // MABXXX PREVENT MORE THAN ONE OF THESE!!!
    var   popupLeft   = 100;
    var   popupTop    = 100;
    var   popupHeight = 900;
    var   popupWidth  = 1000;
    const mainWindow  = await messenger.windows.getCurrent();

    if (! mainWindow) {
      this.debug("-- DID NOT GET THE CURRENT (MAIN, mail:3pane) WINDOW!!! ---");

    } else {
      this.debug( "-- Got the Current (Main, mail:3pane) Window:",
                  `\n- mainWindow.top=${mainWindow.top}`,
                  `\n- mainWindow.left=${mainWindow.left}`,
                  `\n- mainWindow.height=${mainWindow.height}`,
                  `\n- mainWindow.width=${mainWindow.width}`,
                );
      popupTop  = mainWindow.top  + 100;
      popupLeft = mainWindow.left + 100;
      if (mainWindow.height - 200 > popupHeight) popupHeight = mainWindow.Height - 200;   // make it higher, but not shorter
////////if (mainWindow.Width  - 200 > popupWidth)  popupWidth  = mainWindow.Width  - 200;   // make it wider,  but not narrower --- eh, don't need it wider
    }

    const bounds = await this.#idmOptionsApi.getWindowBounds("identityImporterWindowBounds");

    if (! bounds) {
      this.debug("-- no previous window bounds");
    } else if (typeof bounds !== 'object') {
      this.error(`-- PREVIOUS WINDOW BOUNDS "identityImporterWindowBounds" IS NOT AN OBJECT: typeof='${typeof bounds}' #####`);
    } else {
      this.debug( "-- restoring previous window bounds:",
                  `\n- bounds.top=${bounds.top}`,
                  `\n- bounds.left=${bounds.left}`,
                  `\n- bounds.width=${bounds.width}`,
                  `\n- bounds.height=${bounds.height}`,
                );
      popupTop    = bounds.top;
      popupLeft   = bounds.left;
      popupWidth  = bounds.width;
      popupHeight = bounds.height;
    }



    // window.id does not exist.  how do we get our own window id???
    var   ourTabId;
    var   ourWindowId;
    const currentTab = await messenger.tabs.getCurrent();
    if (! currentTab) {
      this.debug("-- messenger.tabs.getCurrent() didn't return a Tab");
    } else {
      this.debug(`-- currentTab.id="${currentTab.id}" currentTab.windowId="${currentTab.windowId}"`);
      ourTabId    = currentTab.id;
      ourWindowId = currentTab.windowId;
    }



    const identityImporterUrl = messenger.runtime.getURL("../identityImporter/identityImporter.html");
    const identityImporterWindow = await messenger.windows.create(
      {
        url:                 identityImporterUrl,
        type:                "popup",
        titlePreface:        getI18nMsg("options_identityManagerPlusOptionsTitle") + " - ",
        top:                 popupTop,
        left:                popupLeft,
        height:              popupHeight,
        width:               popupWidth,
        allowScriptsToClose: true,
      }
    );

    this.debug( "-- Identity Importer Popup Window Created --",
                `\n-from ourTabId="${ourTabId}"`,
                `\n-from ourWindowId="${ourWindowId}"`,
                `\n-identityImporterWindow.id="${identityImporterWindow.id}"`,
////////////////`\n-URL="${identityImporterUrl}"`,
              );

    // Re-focus on the identityImporter window when our window gets focus
    // MABXXX PERHAPS THIS SHOULD BE DONE INSIDE identityImporterPrompt() ???
    const focusListener = async (windowId) => this.windowFocusChanged(windowId, ourTabId, ourWindowId, identityImporterWindow.id);
    messenger.windows.onFocusChanged.addListener(focusListener);

    // identityImporterResponse - expected:
    // - null                  - the user closed the popup window   (set by our own windows.onRemoved listener - defaultResponse sent to identityImporterPrompt)
    // - CLOSED                - the user closed the popup window   (sent by the IdentityImporter window's window.onClosed listener)
    // - CANCELED              - the user clicked the Cancel button (sent by the IdentityImporter window's Cancel button listener)
    // - { 'IMPORTED': array of IdmIdentity } - Identities imported (sent by the IdentityImporter window's Save button listener)

    const identityImporterResponse = await this.identityImporterPrompt(identityImporterWindow.id, focusListener, null);
    this.debug(`-- IdentityImporter identityImporterResponse="${identityImporterResponse}"`);

    // NOW UPDATE THE UI!!!
    switch (identityImporterResponse) {
      case 'CANCELED':
      case 'CLOSED':
      case null:
        break;

      default:
        if (! typeof (identityImporterResponse === 'object')) {
          this.error(`-- UNKNOWN IdentityImporter Response - NOT A KEYWORD OR OBJECT: "${identityImporterResponse}"`);

        } else {
          if (! identityImporterResponse.hasOwnProperty('IMPORTED')) {
            this.error(`-- UNKNOWN IdentityImporter Response - Has No 'IMPORTED' Property: "${identityImporterResponse}"`);

          } else {
            const importedIdmIdentities = identityImporterResponse.IMPORTED;
            if (typeof importedIdmIdentities !== 'object') {
              this.error(`-- MALFORMED IdentityImporter Response - Invalid 'IMPORTED' Property type - expected 'object', got: "${typeof importedIdmIdentities}"`);

            } else if (! Array.isArray(importedIdmIdentities)) {
              this.error("-- MALFORMED IdentityImporter Response - Invalid 'IMPORTED' Property - Not an Array");

            } else if (importedIdmIdentities.length === 0) {
              this.debug("-- No Identities were imported");

            } else {
              this.debug(`-- ${importedIdmIdentities.length} Identities were imported`);
              //await this.buildIdentitiesListUI(e);  // clears filters!!!
              // Instead of re-building the entire list, manually add each imported Identity to the end of the list
              const borderColors  = await this.#borderColorsApi.getAllColors(); // need to keep getting this as BorderColors-D maybe have changed its colors
              for (const idmIdentity of importedIdmIdentities) {
                this.debug(`-- Appending to list: id="${idmIdentity.id}" accountId="${idmIdentity.accountId}" email="${idmIdentity.email}" name+label="${idmIdentity.label}"`);
                // MABXXX if IdmIdentities.createIdmIdentity() does not add to the end of the list (via positionInMenu) then this is a problem
                await this.appendIdentityItemUI(idmIdentity, borderColors); // Does NOT update positionInMenu
              }
            }
          }
        }
    }
  }



  async identityImporterPrompt(identityImporterWindowId, focusListener, defaultResponse) {
    try {
      await messenger.windows.get(identityImporterWindowId);
    } catch (error) {
      // Window does not exist, assume closed.
      this.caught(error, "-- failed to get importer window, PERHAPS WINDOW CLOSED???");
      return defaultResponse;
    }

    return new Promise(resolve => {
      var response = defaultResponse;

      function windowRemovedListener(windowId) {
        if (windowId === identityImporterWindowId) {

          messenger.runtime.onMessage.removeListener(messageListener);
          messenger.windows.onRemoved.removeListener(windowRemovedListener);
          messenger.windows.onFocusChanged.removeListener(focusListener);

          resolve(response);
        }
      }

      /* The IdentityImporter sends a message as identityImporterResponse:
       *  - CLOSED                - the user closed the popup window                  --  Problem - message "conduit" gets destroyed before message is sent/received
       *  - CANCELED              - the user clicked the Cancel button
       *  - { 'IMPORTED': count } - Identities imported, count is how many (may be 0) -- MABXXX NEED TO CHANGE { 'IMPORTED': 0 } to something else???
       * Save this IdentityImporterResponse into response for resolve()
       */
      function messageListener(request, sender, sendResponse) {
        if (sender.tab && sender.tab.windowId === identityImporterWindowId && request && request.hasOwnProperty("IdentityImporterResponse")) {
          response = request.IdentityImporterResponse;
        }
        return false; // we're not sending any response
      }

      messenger.runtime.onMessage.addListener(messageListener);
      messenger.windows.onRemoved.addListener(windowRemovedListener);
    });
  }



  async showBackupManager(e) {
    this.debug("-- begin");

    var   popupLeft   = 100;
    var   popupTop    = 100;
    var   popupHeight = 900;
    var   popupWidth  = 600;
    const mainWindow  = await messenger.windows.getCurrent();

    if (! mainWindow) {
      this.debug("-- DID NOT GET THE CURRENT (MAIN, mail:3pane) WINDOW!!! ---");

    } else {
      this.debug( "-- Got the Current (Main, mail:3pane) Window:",
                  `\n- mainWindow.top=${mainWindow.top}`,
                  `\n- mainWindow.left=${mainWindow.left}`,
                  `\n- mainWindow.height=${mainWindow.height}`,
                  `\n- mainWindow.width=${mainWindow.width}`,
                );
      popupTop  = mainWindow.top  + 100;
      popupLeft = mainWindow.left + 100;
      if (mainWindow.height - 200 > popupHeight) popupHeight = mainWindow.Height - 200;   // make it higher, but not shorter
////////if (mainWindow.Width  - 200 > popupWidth)  popupWidth  = mainWindow.Width  - 200;   // make it wider,  but not narrower --- eh, don't need it wider
    }

    const bounds = await this.#idmOptionsApi.getWindowBounds("backupManagerWindowBounds");

    if (! bounds) {
      this.debug("-- no previous window bounds");
    } else if (typeof bounds !== 'object') {
      this.error(`-- PREVIOUS WINDOW BOUNDS IS NOT AN OBJECT: typeof='${typeof bounds}' #####`);
    } else {
      this.debug( "-- restoring previous window bounds:",
                  `\n- bounds.top=${bounds.top}`,
                  `\n- bounds.left=${bounds.left}`,
                  `\n- bounds.width=${bounds.width}`,
                  `\n- bounds.height=${bounds.height}`,
                );
      popupTop    = bounds.top;
      popupLeft   = bounds.left;
      popupWidth  = bounds.width;
      popupHeight = bounds.height;
    }



    // window.id does not exist.  how do we get our own window id???
    var   ourTabId;
    var   ourWindowId;
    const currentTab = await messenger.tabs.getCurrent();
    if (! currentTab) {
      this.debug("-- messenger.tabs.getCurrent() didn't return a Tab");
    } else {
      this.debug(`-- currentTab.id="${currentTab.id}" currentTab.windowId="${currentTab.windowId}"`);
      ourTabId    = currentTab.id;
      ourWindowId = currentTab.windowId;
    }



    const backupManagerUrl = messenger.runtime.getURL("../backupManager/backupManager.html");
    const backupManagerWindow = await messenger.windows.create(
      {
        url:                 backupManagerUrl,
        type:                "popup",
        titlePreface:        getI18nMsg("options_identityManagerPlusOptionsTitle") + " - ",
        top:                 popupTop,
        left:                popupLeft,
        height:              popupHeight,
        width:               popupWidth,
        allowScriptsToClose: true,
      }
    );

    this.debug( "-- Installed Backup Manager Popup Window Created --",
                `\n-from ourTabId="${ourTabId}"`,
                `\n-from ourWindowId="${ourWindowId}"`,
                `\n-backupManagerWindow.id="${backupManagerWindow.id}"`,
////////////////`\n-URL="${backupManagerUrl}"`,
              );

    // Re-focus on the backupManager window when our window gets focus
    // MABXXX PERHAPS THIS SHOULD BE DONE INSIDE backupManagerPrompt() ???
    const focusListener = async (windowId) => this.windowFocusChanged(windowId, ourTabId, ourWindowId, backupManagerWindow.id);
    messenger.windows.onFocusChanged.addListener(focusListener);
 
    // BackupManagerResponse - expected:
    // - null                     - the user closed the popup window               (set by our own windows.onRemoved listener - the defaultResponse sent to backupManagerPrompt)
    // - CLOSED                   - the user closed the popup window               (sent by the BackupManager window's window.onClosed listener)
    // - DONE                     - the user clicked the Done button               (sent by the BackupManager window's Done button listener)
    // - { 'RESTORED': fileName } - Options restored from file with given fileName (sent by the BackupManager window's Restore button listener)

    const backupManagerResponse = await this.backupManagerPrompt(backupManagerWindow.id, focusListener, null);
    this.debug(`-- BackupManager backupManagerResponse="${backupManagerResponse}"`);

    // NOW UPDATE THE UI!!!
    switch (backupManagerResponse) {
      case 'DONE':
      case 'CLOSED':
      case null:
        break;

      default:
        if (! typeof (backupManagerResponse === 'object')) {
          this.error(`-- UNKNOWN BackupManager Response - NOT A KEYWORD OR OBJECT: "${backupManagerResponse}"`);

        } else {
          if (! backupManagerResponse.hasOwnProperty('RESTORED')) {
            this.error(`-- UNKNOWN BackupManager Response - Object has No 'RESTORED' Property: "${backupManagerResponse}"`);

          } else {
            const fileName = backupManagerResponse.RESTORED;
            if (typeof fileName !== 'string') {
              this.error(`-- MALFORMED BackupManager Response - Invalid 'RESTORED' Property type - expected string, got: "${typeof fileName}"`);

            } else if (fileName.length === 0) {
              this.error(`-- MALFORMED BackupManager Response - Invalid 'RESTORED' Property fileName.length=${fileName.length}`);

            } else {
              this.debugAlways(`-- Options Restored from file "${fileName}"`);
              await this.buildUI();
            }
          }
        }
    }
  }



  async backupManagerPrompt(backupManagerWindowId, focusListener, defaultResponse) {
    try {
      await messenger.windows.get(backupManagerWindowId);
    } catch (error) {
      // Window does not exist, assume closed.
      this.caught(error, "-- failed to get backup manager window, PERHAPS WINDOW CLOSED???");
      return defaultResponse;
    }

    return new Promise(resolve => {
      var response = defaultResponse;

      function windowRemovedListener(windowId) {
        if (windowId === backupManagerWindowId) {

          messenger.runtime.onMessage.removeListener(messageListener);
          messenger.windows.onRemoved.removeListener(windowRemovedListener);
          messenger.windows.onFocusChanged.removeListener(focusListener);

          resolve(response);
        }
      }

      /* The BackupManager sends a message as BackupManagerResponse:
       *  - CLOSED                   - the user closed the popup window               (sent by the BackupManager window's window.onClosed listener)
       *  - DONE                     - the user clicked the Done button               (sent by the BackupManager window's Done button listener)
       *  - { 'RESTORED': fileName } - Options restored from file with given fileName (sent by the BackupManager window's Restore button listener)
       * Save this BackupManagerResponse into response for resolve()
       */
      function messageListener(request, sender, sendResponse) {
        if (sender.tab && sender.tab.windowId === backupManagerWindowId && request && request.hasOwnProperty("BackupManagerResponse")) {
          response = request.BackupManagerResponse;
        }
        return false; // we're not sending any response
      }

      messenger.runtime.onMessage.addListener(messageListener);
      messenger.windows.onRemoved.addListener(windowRemovedListener);
    });
  }



  async windowFocusChanged(windowId, creatorTabId, creatorWindowId, identityEditorWindowId) {
    const lastFocusedWindow = await messenger.windows.getLastFocused();
    var   lastFocusedWindowId;
    if (lastFocusedWindow) lastFocusedWindowId = lastFocusedWindow.id;

    this.debug( "--",
                "\n- windowId="                  + windowId,
                "\n- this.#prevFocusedWindowId=" + this.#prevFocusedWindowId,
                "\n- lastFocusedWindowId="       + lastFocusedWindowId,
                "\n- creatorTabId="              + creatorTabId,
                "\n- creatorWindowId="           + creatorWindowId,
                "\n- identityEditorWindowId="    + identityEditorWindowId,
              );

    if ( windowId
         && windowId               !== messenger.windows.WINDOW_ID_NONE
         && windowId               !== identityEditorWindowId
         && windowId               === creatorWindowId
/////////&& creatorWindowId        !== lastFocusedWindowId
         && identityEditorWindowId
/////////&& identityEditorWindowId !== lastFocusedWindowId
         && identityEditorWindowId !== this.#prevFocusedWindowId
       )
    {
      this.debug( "-- Creator Window got focus, bring Identity Editor Window into focus above it --",
                  "\n- creatorTabId="           + creatorTabId,
                  "\n- creatorWindowId="        + creatorWindowId,
                  "\n- identityEditorWindowId=" + identityEditorWindowId,
                );
      try {
        messenger.windows.update(identityEditorWindowId, { focused: true });
      } catch (error) {
        this.debug("-- PERHAPS WINDOW CLOSED???");
      }
    }

    if (windowId !== messenger.windows.WINDOW_ID_NONE) this.#prevFocusedWindowId = windowId;
  }



  async deleteIdentity(e, identityId) {
    if (! identityId) return;

    this.debug(`-- identityId="${identityId}"`);

    const deleted = await this.#idmIdentitiesApi.deleteIdentity(identityId);
    if (! deleted) {
      this.debug(`-- IDENTITY NOT DELETED identityId="${identityId}"`);

    } else {
      this.debug(`-- Identity Deleted identityId="${identityId}"`);
      --this.#totalIdentityCount;
      await this.updateMessageCountsUI();

      // NOW UPDATE THE UI!!!
      const selector   = `tr.identity-item[identityId='${identityId}']`;
      const domIdentityTR = e.target.closest(selector);

      if (! domIdentityTR) {
        this.error(`-- Failed to get identity container for update: selector="${selector}"`);
      } else {
        domIdentityTR.remove();
      }
    }
  }



  // if a Sort By field has actually been selected (not NONE) then sort - may want to re-think this, maybe just rely on the Sort Button instead
  async autoSortBySelectChanged(e) {
    this.debug(`-- e.target.value="${e.target.value}"`);

    await this.updateAutoSortUI();

    if (! e.target.value || e.target.value === IdmOptions.IDENTITY_AUTO_SORT_BY_VALUE_NONE) {
      //
    } else {
      await this.autoSortIdentities(e);
    }
  }

  // if a Sort Direction has actually been selected (not NONE) then sort - may want to re-think this, maybe just rely on the Sort Button instead
  async autoSortDirectionSelectChanged(e) {
    this.debug(`-- e.target.value="${e.target.value}"`);

    await this.updateAutoSortUI();

    if (! e.target.value || e.target.value === IdmOptions.IDENTITY_AUTO_SORT_DIRECTION_VALUE_NONE) {
      //
    } else {
      await this.autoSortIdentities(e);
    }
  }

  async autoSortButtonClicked(e) { // MABXXX This button should be enabled only when a Sort By field is selected!!!!
    await this.autoSortIdentities(e);
  }



  async updateAutoSortUI() {
    const autoSortBySelect        = document.getElementById("idmAutoSortBySelect");
    const autoSortDirectionSelect = document.getElementById("idmAutoSortDirectionSelect");
    const autoSortButton          = document.getElementById("idmAutoSortButton");

    if (! autoSortBySelect || ! autoSortDirectionSelect || ! autoSortButton) {
      if (! autoSortBySelect)        this.error("-- failed to get Auto Sort By Select, id='idmAutoSortBySelect'");
      if (! autoSortDirectionSelect) this.error("-- failed to get Auto Sort Direction Select, id='idmAutoSortDirectionSelect'");
      if (! autoSortButton)          this.error("-- failed to get Auto Sort Button, id='idmAutoSortButton'");

    } else {
      const autoSortBy        = autoSortBySelect.value;         // this one MUST have a selected value
      const autoSortDirection = autoSortDirectionSelect.value;  // this one defaults to the most-recent selection (stored in OPTIONS)

      if (    ! autoSortBy        || autoSortBy        === IdmOptions.IDENTITY_AUTO_SORT_BY_VALUE_NONE
           || ! autoSortDirection || autoSortDirection === IdmOptions.IDENTITY_AUTO_SORT_DIRECTION_VALUE_NONE
         )
      {
        autoSortButton.disabled = true;
        if (! autoSortBy       ) autoSortBySelect.value        === IdmOptions.IDENTITY_AUTO_SORT_BY_VALUE_NONE;
        if (! autoSortDirection) autoSortDirectionSelect.value === IdmOptions.IDENTITY_AUTO_SORT_DIRECTION_VALUE_NONE;
      } else {
        autoSortButton.disabled = false;
      }
    }
  }



  async autoSortIdentities(e) {
    this.debug("-- begin");

    const autoSortBySelect        = document.getElementById("idmAutoSortBySelect");
    const autoSortDirectionSelect = document.getElementById("idmAutoSortDirectionSelect");

    if (! autoSortBySelect || ! autoSortDirectionSelect) {
      if (! autoSortBySelect)        this.error("-- failed to get autoSortBySelect, id='idmAutoSortBySelect'");
      if (! autoSortDirectionSelect) this.error("-- failed to get autoSortDirectionSelect, id='idmAutoSortDirectionSelect'");

    } else {
      const autoSortBy        = autoSortBySelect.value;
      const autoSortDirection = autoSortDirectionSelect.value;

      if (    ! autoSortBy        || autoSortBy        === IdmOptions.IDENTITY_AUTO_SORT_BY_VALUE_NONE
           || ! autoSortDirection || autoSortDirection === IdmOptions.IDENTITY_AUTO_SORT_DIRECTION_VALUE_NONE
         ) 
      {
        // don't sort
      } else {
        await this.sortIdentityList(e, autoSortBy, autoSortDirection);
      }
    }
  }



  async sortIdentityList(e, sortBy, sortDirection) {
    this.debug(`-- begin sortBy="${sortBy}" sortDirection="${sortDirection}"`);

    if (    ! sortBy        || sortBy        === IdmOptions.IDENTITY_AUTO_SORT_BY_VALUE_NONE
         || ! sortDirection || sortDirection === IdmOptions.IDENTITY_AUTO_SORT_DIRECTION_VALUE_NONE
       ) 
    {
      // don't sort
    } else {
      await this.#idmIdentitiesApi.sortIdentities(sortBy, sortDirection);
      await this.buildIdentitiesListUI(e);  // clears filters!!!
    }

    this.debug("-- end");
  }



  async moveSelectedIdentitiesToTop(e) {
    this.debug("-- begin");
    this.debug(`-- selected Identities: ${this.getSelectedIdentityCount(e)}`);

    const selectedIdentityIds = this.getSelectedIdentityIds(e);

    if (! selectedIdentityIds || selectedIdentityIds.length === 0) {
      this.debug("-- NO IDENTITIES SELECTED");
    } else {
      await this.#idmIdentitiesApi.moveIdentitiesToTop(selectedIdentityIds);
      await this.buildIdentitiesListUI(e); // MABXXX Build the WHOLE LIST just to move a few identities???  // clears filters!!!
    }

    this.debug("-- end");
  }



  async moveSelectedIdentitiesToBottom(e) {
    this.debug("-- begin");
    this.debug(`-- selected Identities: ${this.getSelectedIdentityCount(e)}`);

    const selectedIdentityIds = this.getSelectedIdentityIds(e);

    if (! selectedIdentityIds || selectedIdentityIds.length === 0) {
      this.debug("-- NO IDENTITIES SELECTED");
    } else {
      await this.#idmIdentitiesApi.moveIdentitiesToBottom(selectedIdentityIds);
      await this.buildIdentitiesListUI(e); // MABXXX Build the WHOLE LIST just to move a few identities???  // clears filters!!!
    }

    this.debug("-- end");
  }



  async showInMenuSelected(e) {
    this.debug("-- begin");

    const selectedIdentityIds = this.getSelectedIdentityIds(e); // MABXXX filtering de-selects!!!, but should we double-check filtered identities?

    if (! selectedIdentityIds) {
      this.debug("-- No Identities Selected");
    } else {
      await this.#idmIdentitiesApi.showInMenuSelected(selectedIdentityIds);

      for (const identityId of selectedIdentityIds) {
        const trSelector     = `tr.identity-item[identityId='${identityId}']`;
        const identityItemTR = document.querySelector(trSelector);
        if (! identityItemTR) {
          this.error(`-- FAILED TO SELECT IDENTITY TR "${trSelector}"`);
        } else if (! identityItemTR.classList.contains('selected')) {
          this.debug(`-- Identity is not Selected, identityId="${identityId}"`);
        // MABXXX AND WHAT IF IT'S FLTERED??? (filtering should have de-selected)  
        } else {
          const checkSelector      = `input[type='checkbox', id="${identityId}"].show-in-menu-check`;
          const domShowInMenuCheck = identityItemTR.querySelector(checkSelector);
          if (! domShowInMenuCheck) {
            this.error(`-- FAILED TO SELECT IDENTITY SHOW-IN-MENU CHECKBOX "${checkSelector}"`);
          } else {
            this.debug(`-- identityId="${identityId}" setting check=true`);
            domShowInMenuCheck.checked = true;
            this.debug(`-- removing class "not-show-in-menu" and setting attribute showInMenu='true'`);
            identityItemTR.classList.remove("not-show-in-menu"); // Which is more expensive?  Removing a class that's not there, or checking for it first?
            identityItemTR.setAttribute("showInMenu", 'true');
          }
        }
      }
    }

    this.debug("-- end");
  }



  async showInMenuAll(e) { // ALL means just visible (unfiltered)???
    this.debug("-- begin");

////await this.#idmIdentitiesApi.showInMenuAll(); // MABXXX FIXME does not account for FILTERS!!!

    const domShowInMenuChecks = document.querySelectorAll("input[type='checkbox'].show-in-menu-check");
    this.debug(`-- domShowInMenuChecks.length=${domShowInMenuChecks.length}`);

    const showInMenuIdentityIds = [];
    for (const check of domShowInMenuChecks) {
      const identityId     = check.getAttribute("identityId");
      const selector       = `tr.identity-item[identityId='${identityId}']`;
      const identityItemTR = document.querySelector(selector);
      if (! identityItemTR) {
        this.error(`-- FAILED TO SELECT IDENTITY TR "${selector}"`);
      } else if (this.isFilteredDomIdentityTR(identityItemTR)) {
        this.debug(`-- Identity is Filtered, identityId="${identityId}"`);
      } else {
        this.debug(`-- identityId="${identityId}" setting check=true`);
        check.checked = true;
        this.debug('-- removing class "not-show-in-menu" and setting attribute showInMenu="true"');
        identityItemTR.classList.remove("not-show-in-menu"); // Which is more expensive?  Removing a class that's not there, or checking for it first?
        identityItemTR.setAttribute("showInMenu", 'true');
        showInMenuIdentityIds.push(identityId);
      }
    }

    this.debug(`-- showInMenuIdentityIds.length="${showInMenuIdentityIds.length}`);
    if (showInMenuIdentityIds.length > 0) await this.#idmIdentitiesApi.showInMenuSelected(showInMenuIdentityIds);

    this.debug("-- end");
  }



  async unshowInMenuSelected(e) {
    this.debug("-- begin");

    const selectedIdentityIds = this.getSelectedIdentityIds(e); // MABXXX filtering de-selects!!!, but should we double-check filtered identities?

    if (! selectedIdentityIds) {
      this.debug("-- No Identities Selected");
    } else {
      await this.#idmIdentitiesApi.unshowInMenuSelected(selectedIdentityIds);

      for (const identityId of selectedIdentityIds) {
        const trSelector     = `tr.identity-item[identityId='${identityId}']`;
        const identityItemTR = document.querySelector(trSelector);
        if (! identityItemTR) {
          this.error(`-- FAILED TO SELECT IDENTITY TR "${trSelector}"`);
        } else if (! identityItemTR.classList.contains('selected')) {
          this.debug(`-- Identity is not Selected, identityId="${identityId}"`);
        // MABXXX AND WHAT IF IT'S FLTERED??? (filtering should have de-selected)  
        } else {
          const checkSelector      = `input[type='checkbox', id="${identityId}"].show-in-menu-check`;
          const domShowInMenuCheck = identityItemTR.querySelector(checkSelector);

          if (! domShowInMenuCheck) {
            this.error(`-- FAILED TO SELECT IDENTITY SHOW-IN-MENU CHECKBOX "${checkSelector}"`);
          } else {
            this.debug(`-- identityId="${identityId}" setting check=false`);
            domShowInMenuCheck.checked = false;
            this.debug(`-- adding class "not-show-in-menu" and setting attribute showInMenu='false'`);
            identityItemTR.classList.add("not-show-in-menu"); // Which is more expensive?  Adding a class that's already there, or checking for it first?
            identityItemTR.setAttribute("showInMenu", 'false');
          }
        }
      }
    }

    this.debug("-- end");
  }



  async unshowInMenuAll(e) { // ALL means just visible (unfiltered)???
    this.debug("-- begin");

////await this.#idmIdentitiesApi.unshowInMenuAll(); // MABXXX FIXME does not account for FILTERS!!!

    const domShowInMenuChecks = document.querySelectorAll("input[type='checkbox'].show-in-menu-check");
    this.debug(`-- domShowInMenuChecks.length=${domShowInMenuChecks.length}`);

    const unshowInMenuIdentityIds = [];
    for (const check of domShowInMenuChecks) {
      const identityId     = check.getAttribute("identityId");
      const selector       = `tr.identity-item[identityId='${identityId}']`;
      const identityItemTR = document.querySelector(selector);
      if (! identityItemTR) {
        this.error(`-- FAILED TO SELECT IDENTITY TR "${selector}"`);
      } else if (this.isFilteredDomIdentityTR(identityItemTR)) {
        this.debug(`-- Identity is Filtered, identityId="${identityId}"`);
      } else {
        this.debug(`-- identityId="${identityId}" setting check=false`);
        check.checked = false;
        this.debug(`-- adding class "not-show-in-menu" and setting attribute showInMenu='false'`);
        identityItemTR.classList.add("not-show-in-menu"); // Which is more expensive?  Adding a class that's already there, or checking for it first?
        identityItemTR.setAttribute("showInMenu", 'false');
        unshowInMenuIdentityIds.push(identityId);
      }
    }

    this.debug(`-- unshowInMenuIdentityIds.length="${unshowInMenuIdentityIds.length}`);
    if (unshowInMenuIdentityIds.length > 0) await this.#idmIdentitiesApi.unshowInMenuSelected(unshowInMenuIdentityIds);

    this.debug("-- end");
  }



  async lockInMenuSelected(e) {
    this.debug("-- begin");

    const selectedIdentityIds = this.getSelectedIdentityIds(e); // MABXXX filtering de-selects!!!, but should we double-check filtered identities?

    if (! selectedIdentityIds) {
      this.debug("-- No Identities Selected");
    } else {
      await this.#idmIdentitiesApi.lockInMenuSelected(selectedIdentityIds);

      for (const identityId of selectedIdentityIds) {
        const trSelector     = `tr.identity-item[identityId='${identityId}']`;
        const identityItemTR = document.querySelector(trSelector);
        if (! identityItemTR) {
          this.debug(`-- FAILED TO SELECT IDENTITY TR "${trSelector}"`);
        } else if (! identityItemTR.classList.contains('selected')) { // why this second check?
          this.debug(`-- Identity is not Selected, identityId="${identityId}"`);
        // MABXXX AND WHAT IF IT'S FLTERED??? (filtering should have de-selected)  
        } else {
          const checkSelector      = `input[type='checkbox', id="${identityId}"].lock-in-menu-check`;
          const domLockInMenuCheck = identityItemTR.querySelector(checkSelector);
          if (! domLockInMenuCheck) {
            this.debug(`-- FAILED TO SELECT IDENTITY LOCK-IN-MENU CHECKBOX "${checkSelector}"`);
          } else {
            this.debug(`-- identityId="${identityId}" setting check=true`);
            domLockInMenuCheck.checked = true;
            this.debug(`-- adding class "lock-in-menu" and setting attribute lockInMenu='true'`);
            identityItemTR.classList.add("lock-in-menu"); // Which is more expensive?  Adding a class that's already there, or checking for it first?
            identityItemTR.classList.remove("identity-item-draggable");
            identityItemTR.setAttribute("lockInMenu", 'true');
          }
        }
      }
    }

    this.debug("-- end");
  }



  async lockInMenuAll(e) { // ALL means just visible (unfiltered)???
    this.debug("-- begin");

////await this.#idmIdentitiesApi.lockInMenuAll(); // MABXXX FIXME does not account for FILTERS!!!

    const domLockInMenuChecks = document.querySelectorAll("input[type='checkbox'].lock-in-menu-check");
    this.debug(`-- domLockInnMenuChecks.length=${domLockInMenuChecks.length}`);

    const lockInMenuIdentityIds = [];
    for (const check of domLockInMenuChecks) {
      const identityId     = check.getAttribute("identityId");
      const selector       = `tr.identity-item[identityId='${identityId}']`;
      const identityItemTR = document.querySelector(selector);
      if (! identityItemTR) {
        this.debug(`-- FAILED TO SELECT IDENTITY TR "${selector}"`);
      } else if (this.isFilteredDomIdentityTR(identityItemTR)) {
        this.debug(`-- Identity is Filtered, identityId="${identityId}"`);
      } else {
        this.debug(`-- identityId="${identityId}" setting check=true`);
        check.checked = true;
        this.debug(`-- adding class "lock-in-menu" and setting attribute lockInMenu='true'`);
        identityItemTR.classList.add("lock-in-menu"); // Which is more expensive?  Adding a class that's already there, or checking for it first?
        identityItemTR.classList.remove("identity-item-draggable");
        identityItemTR.setAttribute("lockInMenu", 'true');
        lockInMenuIdentityIds.push(identityId);
      }
    }

    this.debug(`-- lockInMenuIdentityIds.length=${lockInMenuIdentityIds.length}`);
    if (lockInMenuIdentityIds.length > 0) await this.#idmIdentitiesApi.lockInMenuSelected(lockInMenuIdentityIds);

    this.debug("-- end");
  }



  async unlockInMenuSelected(e) {
    this.debug("-- begin");

    const selectedIdentityIds = this.getSelectedIdentityIds(e); // MABXXX filtering de-selects!!!, but should we double-check filtered identities?

    if (! selectedIdentityIds) {
      this.debug("-- No Identities Selected");
    } else {
      await this.#idmIdentitiesApi.unlockInMenuSelected(selectedIdentityIds);

      for (const identityId of selectedIdentityIds) {
        const trSelector     = `tr.identity-item[identityId='${identityId}']`;
        const identityItemTR = document.querySelector(trSelector);
        if (! identityItemTR) {
          this.error(`-- FAILED TO SELECT IDENTITY TR "${trSelector}"`);
        } else if (! identityItemTR.classList.contains('selected')) { // why this second check?
          this.debug(`-- Identity is not Selected, identityId="${identityId}"`);
        // MABXXX AND WHAT IF IT'S FILTERED??? (filtering should have de-selected)  
        } else {
          const checkSelector      = `input[type='checkbox', id="${identityId}"].lock-in-menu-check`;
          const domLockInMenuCheck = identityItemTR.querySelector(checkSelector);
          if (! domLockInMenuCheck) {
            this.error(`-- FAILED TO SELECT IDENTITY LOCK-IN-MENU CHECKBOX "${checkSelector}"`);
          } else {
            this.debug(`-- identityId="${identityId}" setting check=false`);
            domLockInMenuCheck.checked = false;
            this.debug(`-- removing class "lock-in-menu" and setting attribute lockInMenu='false'`);
            identityItemTR.classList.remove("lock-in-menu"); // Which is more expensive?  Removing a class that's not there, or checking for it first?
            identityItemTR.classList.add("identity-item-draggable");
            identityItemTR.setAttribute("lockInMenu", 'false');
          }
        }
      }
    }

    this.debug("-- end");
  }



  async unlockInMenuAll(e) { // ALL means  just visible (unfiltered)???
    this.debug("-- begin");

////await this.#idmIdentitiesApi.unlockInMenuAll(); // MABXXX FIXME does not account for FILTERS!!!

    const domLockInMenuChecks = document.querySelectorAll("input[type='checkbox'].lock-in-menu-check");
    this.debug(`-- domLockInMenuChecks.length=${domLockInMenuChecks.length}`);

    const unlockInMenuIdentityIds = [];
    for (const check of domLockInMenuChecks) {
      const identityId     = check.getAttribute("identityId");
      const selector       = `tr.identity-item[identityId='${identityId}']`;
      const identityItemTR = document.querySelector(selector);
      if (! identityItemTR) {
        this.debug(`-- FAILED TO SELECT IDENTITY TR "${selector}"`);
      } else if (this.isFilteredDomIdentityTR(identityItemTR)) {
        this.debug(`-- Identity is Filtered, identityId="${identityId}"`);
      } else {
        this.debug(`-- identityId="${identityId}" setting check=false`);
        check.checked = false;
        this.debug(`-- removing class "lock-in-menu" and setting attribute lockInMenu='false'`);
        identityItemTR.classList.remove("lock-in-menu"); // Which is more expensive?  Removing a class that's not there, or checking for it first?
        identityItemTR.classList.add("identity-item-draggable");
        identityItemTR.setAttribute("lockInMenu", 'false');
        unlockInMenuIdentityIds.push(identityId);
      }
    }

    this.debug(`-- unlockInMenuIdentityIds.length=${unlockInMenuIdentityIds.length}`);
    if (unlockInMenuIdentityIds.length > 0) await this.#idmIdentitiesApi.unlockInMenuSelected(unlockInMenuIdentityIds);

    this.debug("-- end");
  }



  getSelectedIdentityCount() { // MABXXX filtering de-selects!!!, but should we double-check filtered identities?
    this.debug("-- begin");

    const domSelectedIdentityTRs = document.querySelectorAll("tr.identity-item[selected='true']");
    this.debug(`-- end -- count=${domSelectedIdentityTRs.length}`);

    return domSelectedIdentityTRs.length;
  }

  getSelectedIdentityIds() { // MABXXX filtering de-selects!!!, but should we double-check filtered identities?
    this.debug("-- begin");

    const domSelectedIdentityTRs = document.querySelectorAll("tr.identity-item[selected='true']");
    this.debug(`-- domSelectedIdentityTRs.length=${domSelectedIdentityTRs.length}`);

    const selectedIdentityIds = [];
    for (const domSelectedIdentityTR of domSelectedIdentityTRs) {
      this.debug(`-- selected Identity Id: "${domSelectedIdentityTR.getAttribute("identityId")}"`);
      selectedIdentityIds.push( domSelectedIdentityTR.getAttribute("identityId") );
    }

    this.debug("-- end");

    return selectedIdentityIds;
  }

  getSelectedIdentityTRs() { // MABXXX filtering de-selects!!!, but should we double-check filtered identities?
    this.debug("-- begin");

    const domSelectedIdentityTRs = document.querySelectorAll("tr.identity-item[selected='true']");
    this.debug(`-- domSelectedIdentityTRs.length=${domSelectedIdentityTRs.length}`);

    if (this.#DEBUG) {
      for (const domSelectedIdentityTR of domSelectedIdentityTRs) {
        this.debugAlways(`-- selected Identity Id: "${domSelectedIdentityTR.getAttribute("identityId")}"`);
      }
    }

    this.debug("-- end");

    return domSelectedIdentityTRs;
  }



  async getFilteredIdentityCount() {
    this.debug("-- begin");

    const domIdentityTRs = document.querySelectorAll("tr.identity-item");
    this.debug(`-- domIdentityTRs.length=${domIdentityTRs.length}`);

    var filteredIdentityCount = 0;
    for (const domIdentityTR of domIdentityTRs) {
      if (! this.isFilteredDomIdentityTR(domIdentityTR)) {
        this.debug(`-- Filtered Identity Id: "${domIdentityTR.getAttribute("identityId")}"`);
        ++filteredIdentityCount;
      }
    }

    this.debug(`-- end -- filteredIdentityCount=${filteredIdentityCount}`);
    return filteredIdentityCount;
  }

  async getFilteredIdentityIds() {
    this.debug("-- begin");

    const domIdentityTRs = document.querySelectorAll("tr.identity-item");
    this.debug(`-- domIdentityTRs.length=${domIdentityTRs.length}`);

    const filteredIdentityIds = [];
    for (const domIdentityTR of domIdentityTRs) {
      if (! this.isFilteredDomIdentityTR(domIdentityTR)) {
        const identityId = domIdentityTR.getAttribute("identityId");
        this.debug(`-- Filtered Identity Id: "${identityId}"`);
        if (identityId) {
          filteredIdentityIds.push(identityId);
        }
      }
    }

    this.debug(`-- end -- filteredIdentityIds.length=${filteredIdentityIds.length}`);

    return domFilteredIdentityIds;
  }

  async getFilteredIdentityTRs() {
    this.debug("-- begin");

    const domIdentityTRs = document.querySelectorAll("tr.identity-item");
    this.debug(`-- domIdentityTRs.length=${domIdentityTRs.length}`);

    const domFilteredIdentityTRs = [];
    for (const domIdentityTR of domIdentityTRs) {
      if (! this.isFilteredDomIdentityTR(domIdentityTR)) {
        this.debug(`-- Filtered Identity Id: "${domIdentityTR.getAttribute("identityId")}"`);
        domFilteredIdentityTRs.push(domIdentityTR);
      }
    }

    this.debug("-- end");

    return domFilteredIdentityTRs;
  }



  selectIdentityTRByIdentityId(identityId) {
    const domIdentityTR = this.findIdentityTRByIdentityId(identityId);
    if (domIdentityTR && domIdentityTR.getAttribute('selected') !== 'true') { 
      domIdentityTR.setAttribute('selected', 'true');
      this.enableDisableButtonsOnSelectionChanged();
    }
  }

  selectAllIdentities(e) {
    const domIdentityTRs = document.querySelectorAll("tr.identity-item");
    var selected = 0;
    for (const domIdentityTR of domIdentityTRs) {
      if (this.isFilteredDomIdentityTR(domIdentityTR)) {
        this.debug(`-- Skipping fltered Identity, id="${domIdentityTR.getAttribute("identityId")}"`);
      } else if (domIdentityTR.getAttribute('selected') !== 'true') {
        this.debug(`-- Selecting Identity, id="${domIdentityTR.getAttribute("identityId")}"`);
        domIdentityTR.setAttribute('selected', 'true');
        ++selected;
      }
    }
    if (selected) this.enableDisableButtonsOnSelectionChanged();
  }

  deselectAllIdentities(e) {
    const domIdentityTRs = document.querySelectorAll("tr.identity-item");
    var deselected = 0;
    for (const domIdentityTR of domIdentityTRs) {
      if (domIdentityTR.getAttribute('selected') === 'true') {
        this.debug(`-- De-Selecting Identity, id="${domIdentityTR.getAttribute("identityId")}"`);
        domIdentityTR.setAttribute('selected', 'false');
        ++deselected;
      }
    }
    if (deselected) this.enableDisableButtonsOnSelectionChanged();
  }



  async collectFromAddressesCheckClicked(e) {
    this.debug(`-- begin -- checked=${e.target.checked}`);

    const collectFromAddressesAlertCheckPanel = document.getElementById("idmCollectFromAddressAlertCheckPanel");
    if (! collectFromAddressesAlertCheckPanel) {
      this.error("-- Failed to get collectFromAddressesAlertCheckPanel");
    } else {
      const checked = e.target.checked;
      if (checked) {
        collectFromAddressesAlertCheckPanel.style.setProperty( "display", "BLOCK" );
      } else {
        collectFromAddressesAlertCheckPanel.style.setProperty( "display", "NONE"  );
      }
    }

    this.debug("-- end");
  }



  async showPopupOptionsCheckClicked(e) {
    if (e.target.checked) {
      this.showPopupOptions();
    } else {
      this.hidePopupOptions();
    }
  }

  showPopupOptions() {
    const popupOptionsDIV = document.getElementById("idmPopupOptions");
    if (popupOptionsDIV) {
      popupOptionsDIV.style.setProperty("display", "BLOCK");
    }
  }

  hidePopupOptions() {
    const popupOptionsDIV = document.getElementById("idmPopupOptions");
    if (popupOptionsDIV) {
      popupOptionsDIV.style.setProperty("display", "NONE");
    }
  }



  async showDisplayOrderHintsCheckClicked(e) {
    if (e.target.checked) {
      this.showDisplayOrderHints();
    } else {
      this.hideDisplayOrderHints();
    }
  }

  showDisplayOrderHints() {
    const popupOptionsDIV = document.getElementById("idmDisplayOrderHints");
    if (popupOptionsDIV) {
      popupOptionsDIV.style.setProperty("display", "BLOCK");
    }
  }

  hideDisplayOrderHints() {
    const popupOptionsDIV = document.getElementById("idmDisplayOrderHints");
    if (popupOptionsDIV) {
      popupOptionsDIV.style.setProperty("display", "NONE");
    }
  }



  async showDisplayOrderActionsCheckClicked(e) {
    if (e.target.checked) {
      this.showDisplayOrderActions();
    } else {
      this.hideDisplayOrderActions();
    }
  }

  showDisplayOrderActions() {
    const openCloseActionTRs = document.querySelectorAll("tr.open-close-action");
    if (openCloseActionTRs) {
      for (const tr of openCloseActionTRs) {
        tr.style.setProperty('display', 'table-row');
      }
    }
  }

  hideDisplayOrderActions() {
    const openCloseActionTRs = document.querySelectorAll("tr.open-close-action");
    if (openCloseActionTRs) {
      for (const tr of openCloseActionTRs) {
        tr.style.setProperty('display', 'none');
      }
    }
  }



  // filtering is a UI-Only concept
  async initAllIdentityFilters() {
    const filterIdentitiesByAccountSelect        = document.getElementById("idmDisplayOrderFilterByAccountSelect");
    const filterIdentitiesByImportedSelect       = document.getElementById("idmDisplayOrderFilterByImportedSelect");
    const filterIdentitiesByLockedSelect         = document.getElementById("idmDisplayOrderFilterByLockedSelect");
    const filterIdentitiesByAccountDefaultSelect = document.getElementById("idmDisplayOrderFilterByAccountDefaultSelect");
    const filterIdentitiesByCollectedSelect      = document.getElementById("idmDisplayOrderFilterByCollectedSelect");
    const filterIdentitiesByShowInMenuSelect     = document.getElementById("idmDisplayOrderFilterByShowInMenuSelect");
    const filterIdentitiesByLabelRegexText       = document.getElementById("idmDisplayOrderFilterByLabelRegexText");
    const filterIdentitiesByEmailRegexText       = document.getElementById("idmDisplayOrderFilterByEmailRegexText");

    filterIdentitiesByAccountSelect.value        = '';
    filterIdentitiesByImportedSelect.value       = '';
    filterIdentitiesByLockedSelect.value         = '';
    filterIdentitiesByAccountDefaultSelect.value = '';
    filterIdentitiesByCollectedSelect.value      = '';
    filterIdentitiesByShowInMenuSelect.value     = '';
    filterIdentitiesByLabelRegexText.value       = '';
    filterIdentitiesByEmailRegexText.value       = '';

    this.#filterByAccountId                      = '';
    this.#filterByImported                       = '';
    this.#filterByLocked                         = '';
    this.#filterByAccountDefault                 = '';
    this.#filterByCollected                      = '';
    this.#filterByShowInMenu                     = '';
    this.#filterBylabelRegexText                 = '';
    this.#filterByEmailRegexText                 = '';
  }



  // filtering is a UI-Only concept - filtered out items are de-selected
  async filterIdentitiesByAccountSelectChanged(e) {
    const selectedAccountId = e.target.value;
    this.#filterByAccountId = selectedAccountId;

    await this.clearFilterPanelMessages();
    await this.clearDisplayOrderMessages();

    if (! selectedAccountId) {
      await this.filterIdentitiesByAccountReset();

    } else {
      const selectedAccountName = this.#getAccountName(selectedAccountId);
      const domIdentityTRs      = document.querySelectorAll("tr.identity-item");

      var deselected = 0;
      for (const domIdentityTR of domIdentityTRs) {
        const domIdentityAccountTD = domIdentityTR.querySelector("td.identity-item-data.identity-item-account");
        if (domIdentityAccountTD) {
          const identityAccountName = domIdentityAccountTD.textContent;
          if (identityAccountName === selectedAccountName) {
            domIdentityTR.classList.remove("filter-by-account");
          } else {
            domIdentityTR.classList.add("filter-by-account"); // Which is more expensive?  Adding a class that's already there, or checking for it first?
            if (domIdentityTR.getAttribute('selected') === 'true') {
              domIdentityTR.setAttribute('selected', 'false');
              ++deselected;
            }
          }
        }
      }

      if (deselected) this.enableDisableButtonsOnSelectionChanged();
    }
  }

  // filtering is a UI-Only concept
  async filterIdentitiesByAccountResetButtonClicked(e) {
    if (e === null) return;
    e.preventDefault();
    e.stopPropagation();

    await this.clearFilterPanelMessages();
    await this.clearDisplayOrderMessages();

    await this.filterIdentitiesByAccountReset();
  }

  // filtering is a UI-Only concept
  async filterIdentitiesByAccountReset() {
    const filterIdentitiesByAccountSelect = document.getElementById("idmDisplayOrderFilterByAccountSelect");
    const domIdentityTRs                  = document.querySelectorAll("tr.identity-item");

    filterIdentitiesByAccountSelect.value = '';
    this.#filterByAccountId               = '';

    for (const domIdentityTR of domIdentityTRs) {
      domIdentityTR.classList.remove("filter-by-account");
    }

    await this.updateMessageCountsUIAfterFilterChange();
  }



  // filtering is a UI-Only concept - filtered out items are de-selected
  async filterIdentitiesByImportedSelectChanged(e) {
    const selectedId = e.target.value; // values are "", "IMPORTED", "NOT_IMPORTED"
    this.#filterByImported = selectedId;

    await this.clearFilterPanelMessages();
    await this.clearDisplayOrderMessages();

    if (! selectedId) {
      this.filterIdentitiesByImportedReset(true);

    } else {
      this.filterIdentitiesByImportedReset(false); // MABXXX IS THIS REALLY NECESSARY???

      var importedTest = false;
      switch (selectedId) {
        case "IMPORTED":
          importedTest = true;
          break;
        case "NOT_IMPORTED":
          importedTest = false;
          break;
        default:
          this.error(`-- Unknown Selection ID: "${selectedId}"`);
          return;
      }

      var deselected = 0;
      const domIdentityTRs = document.querySelectorAll("tr.identity-item");
      for (const domIdentityTR of domIdentityTRs) {
// *        - .imported-identity
        const identityImported = domIdentityTR.classList.contains("imported-identity");
        if (identityImported === importedTest) {
          domIdentityTR.classList.remove("filter-by-imported");
        } else {
          domIdentityTR.classList.add("filter-by-imported"); // Which is more expensive?  Adding a class that's already there, or checking for it first?
          if (domIdentityTR.getAttribute('selected') === 'true') {
            domIdentityTR.setAttribute('selected', 'false');
            ++deselected;
          }
        }
      }

      if (deselected) this.enableDisableButtonsOnSelectionChanged();

      await this.updateMessageCountsUIAfterFilterChange();
    }
  }

  // filtering is a UI-Only concept
  async filterIdentitiesByImportedResetButtonClicked(e) {
    if (e === null) return;
    e.preventDefault();
    e.stopPropagation();

    await this.clearFilterPanelMessages();
    await this.clearDisplayOrderMessages();

    this.filterIdentitiesByImportedReset(true);

    await this.updateMessageCountsUIAfterFilterChange();
  }

  // filtering is a UI-Only concept
  filterIdentitiesByImportedReset(resetSelection) {
    if (resetSelection) {
      const filterIdentitiesByImportedSelect = document.getElementById("idmDisplayOrderFilterByImportedSelect");
      filterIdentitiesByImportedSelect.value = '';
      this.#filterByImported                 = '';
    }

    const domIdentityTRs = document.querySelectorAll("tr.identity-item");
    for (const domIdentityTR of domIdentityTRs) {
      domIdentityTR.classList.remove("filter-by-imported");
    }
  }



  // filtering is a UI-Only concept - filtered out items are de-selected
  async filterIdentitiesByLockedSelectChanged(e) {
    const selectedId = e.target.value; // values are "", "LOCKED", "NOT_LOCKED"
    this.#filterByLocked = selectedId;

    await this.clearFilterPanelMessages();
    await this.clearDisplayOrderMessages();

    if (! selectedId) {
      this.filterIdentitiesByLockedReset(true);

    } else {
      this.filterIdentitiesByLockedReset(false); // MABXXX IS THIS REALLY NECESSARY???

      var lockedTest = false;
      switch (selectedId) {
        case "LOCKED":
          lockedTest = true;
          break;
        case "NOT_LOCKED":
          lockedTest = false;
          break;
        default:
          this.error(`-- Unknown Selection ID: "${selectedId}"`);
          return;
      }

      var deselected = 0;
      const domIdentityTRs = document.querySelectorAll("tr.identity-item");
      for (const domIdentityTR of domIdentityTRs) {
// *        - .lock-in-menu
        const identityLocked = domIdentityTR.classList.contains("lock-in-menu");
        if (identityLocked === lockedTest) {
          domIdentityTR.classList.remove("filter-by-locked");
        } else {
          domIdentityTR.classList.add("filter-by-locked"); // Which is more expensive?  Adding a class that's already there, or checking for it first?
          if (domIdentityTR.getAttribute('selected') === 'true') {
            domIdentityTR.setAttribute('selected', 'false');
            ++deselected;
          }
        }
      }

      if (deselected) this.enableDisableButtonsOnSelectionChanged();

      await this.updateMessageCountsUIAfterFilterChange();
    }
  }

  // filtering is a UI-Only concept
  async filterIdentitiesByLockedResetButtonClicked(e) {
    if (e === null) return;
    e.preventDefault();
    e.stopPropagation();

    await this.clearFilterPanelMessages();
    await this.clearDisplayOrderMessages();

    this.filterIdentitiesByLockedReset(true);

    await this.updateMessageCountsUIAfterFilterChange();
  }

  // filtering is a UI-Only concept
  filterIdentitiesByLockedReset(resetSelection) {
    if (resetSelection) {
      const filterIdentitiesByLockedSelect = document.getElementById("idmDisplayOrderFilterByLockedSelect");
      filterIdentitiesByLockedSelect.value = '';
      this.#filterByLocked                 = '';
    }

    const domIdentityTRs = document.querySelectorAll("tr.identity-item");
    for (const domIdentityTR of domIdentityTRs) {
      domIdentityTR.classList.remove("filter-by-locked");
    }
  }



  // filtering is a UI-Only concept - filtered out items are de-selected
  async filterIdentitiesByAccountDefaultSelectChanged(e) {
    const selectedId = e.target.value; // values are "", "DEFAULT_ACCOUNT", "NOT_DEFAULT_ACCOUNT"
    this.#filterByAccountDefault = selectedId;

    await this.clearFilterPanelMessages();
    await this.clearDisplayOrderMessages();

    if (! selectedId) {
      this.filterIdentitiesByAccountDefaultReset(true);

    } else {
      this.filterIdentitiesByAccountDefaultReset(false); // MABXXX IS THIS REALLY NECESSARY???

      var accountDefaultTest = false;
      switch (selectedId) {
        case "DEFAULT":
          accountDefaultTest = true;
          break;
        case "NOT_DEFAULT":
          accountDefaultTest = false;
          break;
        default:
          this.error(`-- Unknown Selection ID: "${selectedId}"`);
          return;
      }

      var deselected = 0;
      const domIdentityTRs = document.querySelectorAll("tr.identity-item");
      for (const domIdentityTR of domIdentityTRs) {
// *        - .lock-in-menu
        const identityAccountDefault = domIdentityTR.classList.contains("account-default");
        if (identityAccountDefault === accountDefaultTest) {
          domIdentityTR.classList.remove("filter-by-default");
        } else {
          domIdentityTR.classList.add("filter-by-default"); // Which is more expensive?  Adding a class that's already there, or checking for it first?
          if (domIdentityTR.getAttribute('selected') === 'true') {
            domIdentityTR.setAttribute('selected', 'false');
            ++deselected;
          }
        }
      }

      if (deselected) this.enableDisableButtonsOnSelectionChanged();

      await this.updateMessageCountsUIAfterFilterChange();
    }
  }

  // filtering is a UI-Only concept
  async filterIdentitiesByAccountDefaultResetButtonClicked(e) {
    if (e === null) return;
    e.preventDefault();
    e.stopPropagation();

    await this.clearFilterPanelMessages();
    await this.clearDisplayOrderMessages();

    this.filterIdentitiesByAccountDefaultReset(true);

    await this.updateMessageCountsUIAfterFilterChange();
  }

  // filtering is a UI-Only concept
  filterIdentitiesByAccountDefaultReset(resetSelection) {
    if (resetSelection) {
      const filterIdentitiesByAccountDefaultSelect = document.getElementById("idmDisplayOrderFilterByAccountDefaultSelect");
      filterIdentitiesByAccountDefaultSelect.value = '';
      this.#filterByAccountDefault                 = '';
    }

    const domIdentityTRs = document.querySelectorAll("tr.identity-item");
    for (const domIdentityTR of domIdentityTRs) {
      domIdentityTR.classList.remove("filter-by-default");
    }
  }



  // filtering is a UI-Only concept - filtered out items are de-selected
  async filterIdentitiesByCollectedSelectChanged(e) {
    const selectedId = e.target.value; // values are "", "COLLECTED", "NOT_COLLECTED"
    this.#filterByCollected = selectedId;

    await this.clearFilterPanelMessages();
    await this.clearDisplayOrderMessages();

    if (! selectedId) {
      this.filterIdentitiesByCollectedReset(true);

    } else {
      this.filterIdentitiesByCollectedReset(false); // MABXXX IS THIS REALLY NECESSARY???

      var collectedTest = false;
      switch (selectedId) {
        case "COLLECTED":
          collectedTest = true;
          break;
        case "NOT_COLLECTED":
          collectedTest = false;
          break;
        default:
          this.error(`-- Unknown Selection ID: "${selectedId}"`);
          return;
      }

      var deselected = 0;
      const domIdentityTRs = document.querySelectorAll("tr.identity-item");
      for (const domIdentityTR of domIdentityTRs) {
// *        - .collected-identity
        const identityCollected = domIdentityTR.classList.contains("collected-identity");
        if (identityCollected === collectedTest) {
          domIdentityTR.classList.remove("filter-by-collected");
        } else {
          domIdentityTR.classList.add("filter-by-collected"); // Which is more expensive?  Adding a class that's already there, or checking for it first?
          if (domIdentityTR.getAttribute('selected') === 'true') {
            domIdentityTR.setAttribute('selected', 'false');
            ++deselected;
          }
        }
      }

      if (deselected) this.enableDisableButtonsOnSelectionChanged();

      await this.updateMessageCountsUIAfterFilterChange();
    }
  }

  // filtering is a UI-Only concept
  async filterIdentitiesByCollectedResetButtonClicked(e) {
    if (e === null) return;
    e.preventDefault();
    e.stopPropagation();

    await this.clearFilterPanelMessages();
    await this.clearDisplayOrderMessages();

    this.filterIdentitiesByCollectedReset(true);

    await this.updateMessageCountsUIAfterFilterChange();
  }

  // filtering is a UI-Only concept
  filterIdentitiesByCollectedReset(resetSelection) {
    if (resetSelection) {
      const filterIdentitiesByCollectedSelect = document.getElementById("idmDisplayOrderFilterByCollectedSelect");
      filterIdentitiesByCollectedSelect.value = '';
      this.#filterByCollected                 = '';
    }

    const domIdentityTRs = document.querySelectorAll("tr.identity-item");
    for (const domIdentityTR of domIdentityTRs) {
      domIdentityTR.classList.remove("filter-by-collected");
    }
  }



  // filtering is a UI-Only concept - filtered out items are de-selected
  async filterIdentitiesByShowInMenuSelectChanged(e) {
    const selectedId = e.target.value; // values are "", "SHOW", "HIDE"
    this.#filterByShowInMenu = selectedId;

    await this.clearFilterPanelMessages();
    await this.clearDisplayOrderMessages();

    if (! selectedId) {
      this.filterIdentitiesByShowInMenuReset(true);

    } else {
      this.filterIdentitiesByShowInMenuReset(false); // MABXXX IS THIS REALLY NECESSARY???

      var showInMenuTest = false;
      switch (selectedId) {
        case "SHOW":
          showInMenuTest = true;
          break;
        case "HIDE":
          showInMenuTest = false;
          break;
        default:
          this.error(`-- Unknown Selection ID: "${selectedId}"`);
          return;
      }

      var deselected = 0;
      const domIdentityTRs = document.querySelectorAll("tr.identity-item");
      for (const domIdentityTR of domIdentityTRs) {
// *        - .not-show-in-menu & showInMenu='true'/'false' 
        const identityShowInMenu = ! domIdentityTR.classList.contains("not-show-in-menu") || domIdentityTR.getAttribute("showInMenu") === 'true';
        if (identityShowInMenu === showInMenuTest) {
          domIdentityTR.classList.remove("filter-by-showInMenu");
        } else {
          domIdentityTR.classList.add("filter-by-showInMenu"); // Which is more expensive?  Adding a class that's already there, or checking for it first?
          if (domIdentityTR.getAttribute('selected') === 'true') {
            domIdentityTR.setAttribute('selected', 'false');
            ++deselected;
          }
        }
      }

      if (deselected) this.enableDisableButtonsOnSelectionChanged();

      await this.updateMessageCountsUIAfterFilterChange();
    }
  }

  // filtering is a UI-Only concept
  async filterIdentitiesByShowInMenuResetButtonClicked(e) {
    if (e === null) return;
    e.preventDefault();
    e.stopPropagation();

    await this.clearFilterPanelMessages();
    await this.clearDisplayOrderMessages();

    this.filterIdentitiesByShowInMenuReset(true);

    await this.updateMessageCountsUIAfterFilterChange();
  }

  // filtering is a UI-Only concept
  filterIdentitiesByShowInMenuReset(resetSelection) {
    if (resetSelection) {
      const filterIdentitiesByShowInMenuSelect = document.getElementById("idmDisplayOrderFilterByShowInMenuSelect");
      filterIdentitiesByShowInMenuSelect.value = '';
      this.#filterByShowInMenu                 = '';
    }

    const domIdentityTRs = document.querySelectorAll("tr.identity-item");
    for (const domIdentityTR of domIdentityTRs) {
      domIdentityTR.classList.remove("filter-by-showInMenu");
    }
  }



  // filtering is a UI-Only concept
  async filterIdentitiesByLabelRegexTextKeyPressed(e) {
    if (e.key === 'Enter') { // we care only about the Enter key
    }
  }

  // filtering is a UI-Only concept - filtered out items are de-selected
  async filterIdentitiesByLabelRegexTextChanged(e) {
    const regexText = e.target.value;
    this.#filterBylabelRegexText = regexText;

    await this.clearFilterPanelMessages();
    await this.clearDisplayOrderMessages();

    this.debug(`-- begin -- regexText="${regexText}"`);
    this.unmarkErrorTR(e.target);
    this.clearFilterPanelError("ERROR_FOR_IDM_LABEL_FILTER_REGEX");

    if (! regexText) {
      await this.filterIdentitiesByLabelReset();

    } else {
      var regex;
      try {
        regex = new RegExp(regexText, 'i');
      } catch (error) {
        // REPORT THE ERROR
        this.debug(`-- INVALID REGULAR EXPRESSION: regexText="${regexText}"`);
        this.markErrorTR(e.target);
        this.showFilterPanelError("ERROR_FOR_IDM_LABEL_FILTER_REGEX", this.#error_invalidLabeLFilterRegex);
      }

      if (regex) {
        const domIdentityTRs = document.querySelectorAll("tr.identity-item");
        var deselected = 0;
        for (const domIdentityTR of domIdentityTRs) {
          const domIdentityLabelTD = domIdentityTR.querySelector("td.identity-item-data.identity-item-label");
          if (domIdentityLabelTD) {
            const identityLabel = domIdentityLabelTD.textContent;
            if (regex.test(identityLabel)) {
              domIdentityTR.classList.remove("filter-by-label");
            } else {
              domIdentityTR.classList.add("filter-by-label"); // Which is more expensive?  Adding a class that's already there, or checking for it first?
              if (domIdentityTR.getAttribute('selected') === 'true') {
                domIdentityTR.setAttribute('selected', 'false');
                ++deselected;
              }
            }
          }
        }

        if (deselected) this.enableDisableButtonsOnSelectionChanged();

        await this.updateMessageCountsUIAfterFilterChange();
      }
    }
  }

  // filtering is a UI-Only concept
  async filterIdentitiesByLabelResetButtonClicked(e) {
    if (e === null) return;
    e.preventDefault();
    e.stopPropagation();

    await this.clearFilterPanelMessages();
    await this.clearDisplayOrderMessages();
    this.clearFilterPanelError("ERROR_FOR_IDM_LABEL_FILTER_REGEX");
    this.unmarkErrorTR(e.target);

    await this.filterIdentitiesByLabelReset();
  }

  // filtering is a UI-Only concept
  async filterIdentitiesByLabelReset() {
    const filterIdentitiesByLabelRegexText = document.getElementById("idmDisplayOrderFilterByLabelRegexText");
    const domIdentityTRs                   = document.querySelectorAll("tr.identity-item");

    filterIdentitiesByLabelRegexText.value = '';
    this.#filterBylabelRegexText           = '';

    for (const domIdentityTR of domIdentityTRs) {
      domIdentityTR.classList.remove("filter-by-label");
    }

    await this.updateMessageCountsUIAfterFilterChange();
  }



  // filtering is a UI-Only concept
  async filterIdentitiesByEmailRegexTextKeyPressed(e) {
    if (e.key === 'Enter') { // we care only about the Enter key
    }
  }

  // filtering is a UI-Only concept - filtered out items are de-selected
  async filterIdentitiesByEmailRegexTextChanged(e) {
    const regexText = e.target.value;
    this.#filterByEmailRegexText = regexText;

    await this.clearFilterPanelMessages();
    await this.clearDisplayOrderMessages();
    this.unmarkErrorTR(e.target);
    this.clearFilterPanelError("ERROR_FOR_IDM_EMAIL_FILTER_REGEX");

    if (! regexText) {
      await this.filterIdentitiesByEmailReset();

    } else {
      var regex;
      try {
        regex = new RegExp(regexText, 'i');
      } catch (error) {
        // REPORT THE ERROR
        this.debug(`-- INVALID REGULAR EXPRESSION: regexText="${regexText}"`);
        this.markErrorTR(e.target);
        this.showFilterPanelError("ERROR_FOR_IDM_EMAIL_FILTER_REGEX", this.#error_invalidEmaiLFilterRegex);
      }

      if (regex) {
        const domIdentityTRs = document.querySelectorAll("tr.identity-item");
        var deselected = 0;
        for (const domIdentityTR of domIdentityTRs) {
          const domIdentityEmailTD = domIdentityTR.querySelector("td.identity-item-data.identity-item-email");
          if (domIdentityEmailTD) {
            const identityEmail = domIdentityEmailTD.textContent;
            if (regex.test(identityEmail)) {
              domIdentityTR.classList.remove("filter-by-email");
            } else {
              domIdentityTR.classList.add("filter-by-email"); // Which is more expensive?  Adding a class that's already there, or checking for it first?
              if (domIdentityTR.getAttribute('selected') === 'true') {
                domIdentityTR.setAttribute('selected', 'false');
                ++deselected;
              }
            }
          }
        }

        if (deselected) this.enableDisableButtonsOnSelectionChanged();

        await this.updateMessageCountsUIAfterFilterChange();
      }
    }
  }

  // filtering is a UI-Only concept
  async filterIdentitiesByEmailResetButtonClicked(e) {
    if (e === null) return;
    e.preventDefault();
    e.stopPropagation();

    await this.clearFilterPanelMessages();
    await this.clearDisplayOrderMessages();
    this.clearFilterPanelError("ERROR_FOR_IDM_EMAIL_FILTER_REGEX");
    this.unmarkErrorTR(e.target);

    await this.filterIdentitiesByEmailReset();
  }

  // filtering is a UI-Only concept
  async filterIdentitiesByEmailReset() {
    const filterIdentitiesByEmailRegexText = document.getElementById("idmDisplayOrderFilterByEmailRegexText");
    const domIdentityTRs                   = document.querySelectorAll("tr.identity-item");

    filterIdentitiesByEmailRegexText.value = '';
    this.#filterByEmailRegexText           = '';

    for (const domIdentityTR of domIdentityTRs) {
      domIdentityTR.classList.remove("filter-by-email");
    }

    await this.updateMessageCountsUIAfterFilterChange();
  }



  // filtering is a UI-Only concept
  async filterIdentitiesResetAllButtonClicked(e) {
    if (e === null) return;
    e.preventDefault();
    e.stopPropagation();

    await this.clearFilterPanelMessages();
    await this.clearDisplayOrderMessages();
    this.clearAllFilterPanelErrors();
    this.unmarkAllFilterErrors();

    await this.filterIdentitiesResetAll();
  }

  // filtering is a UI-Only concept
  async filterIdentitiesResetAll() {
    const CLASSES_TO_REMOVE = [
      "filter-by-account",
      "filter-by-label",
      "filter-by-email",
      "filter-by-imported",
      "filter-by-locked",
      "filter-by-default",
      "filter-by-collected",
      "filter-by-showInMenu",
    ];

    await this.initAllIdentityFilters();

    const domIdentityTRs = document.querySelectorAll("tr.identity-item");
    for (const domIdentityTR of domIdentityTRs) {
      domIdentityTR.classList.remove(...CLASSES_TO_REMOVE);
    }

    this.#filteredIdentityCount = -1;
    await this.updateMessageCountsUI();
  }



  async updateMessageCountsUIAfterFilterChange() {
    this.#filteredIdentityCount = await this.getFilteredIdentityCount();
    await this.updateMessageCountsUI();
  }

  async updateMessageCountsUI() {
    this.debug(`\n--- this.#totalIdentityCount=${this.#totalIdentityCount}  this.#filteredIdentityCount=${this.#filteredIdentityCount}`);

    if (this.#filteredIdentityCount === 0) { // has everything been filtered out?
      this.addFilterPanelMessageNoIdentitiesMatch(); // note that this message goes just under the filters
    }
    
    if ( this.#filteredIdentityCount < 0 // this means no filter has been applied SINCE the list was last built or SINCE ALL filters were reset
         || this.#filteredIdentityCount === this.#totalIdentityCount // OR if the values are the same, notnhig has been filtered
       )
    { // display just the total identity count
      const subst = this.#totalIdentityCount;
      const msg   = getI18nMsgSubst("options_idmDisplayOrderFilter_message_nnIdentities", subst);
      this.addDisplayOrderMessage(msg);
    } else { // display the filtered count AND the total identity count
      const subst = [ this.#filteredIdentityCount, this.#totalIdentityCount ];
      const msg   = getI18nMsgSubst( "options_idmDisplayOrderFilter_message_nnFilteredOfmmIdentities", subst);
      this.addDisplayOrderMessage(msg);
    }
  }



  async clearFilterPanelMessages() {
    const domFilterPanelMessagesDIV = document.getElementById("idmDisplayOrderFiltersPanelMessages");
    if (! domFilterPanelMessagesDIV) {
      this.error("-- Failed to get Filter Panel Message <DIV> with id=\"idmDisplayOrderFiltersPanelMessages\"");
    } else {
      domFilterPanelMessagesDIV.style.setProperty("display", "NONE");
      domFilterPanelMessagesDIV.innerHTML = '';
    }
  }

  addFilterPanelMessageNoIdentitiesMatch() {
    const msg = getI18nMsg("options_idmDisplayOrderFilter_message_noMatch");
    this.addFilterPanelMessage(msg);
  }

  addFilterPanelMessage(msg) {
    this.debug(`\n--- msg="${msg}"`);

    if (msg) {
      const domFilterPanelMessagesDIV = document.getElementById("idmDisplayOrderFiltersPanelMessages");
      if (! domFilterPanelMessagesDIV) {
        this.error("-- Failed to get Filter Panel Messages <DIV> with id=\"idmDisplayOrderFiltersPanelMessages\"");
      } else {
        const msgDIV = document.createElement('div');
          msgDIV.classList.add("filter-panel-message");
          msgDIV.textContent = msg;
        domFilterPanelMessagesDIV.appendChild(msgDIV);
        domFilterPanelMessagesDIV.style.setProperty("display", "BLOCK");
      }
    }
  }



  async clearDisplayOrderMessages() {
    const domDisplayOrderMessagesDIV = document.getElementById("idmDisplayOrderMessagesPanel");
    if (! domDisplayOrderMessagesDIV) {
      this.error("-- Failed to get Filter Panel Message <DIV> with id=\"idmDisplayOrderMessagesPanel\"");
    } else {
      domDisplayOrderMessagesDIV.style.setProperty("display", "NONE");
      domDisplayOrderMessagesDIV.innerHTML = '';
    }
  }

  addDisplayOrderMessageNoIdentitiesMatch() {
    const msg = getI18nMsg("options_idmDisplayOrderFilter_message_noMatch");
    this.addDisplayOrderMessage(msg);
  }

  addDisplayOrderMessage(msg) {
    this.debug(`\n--- msg="${msg}"`);

    if (msg) {
      const domDisplayOrderMessagesDIV = document.getElementById("idmDisplayOrderMessagesPanel");
      if (! domDisplayOrderMessagesDIV) {
        this.error("-- Failed to get Display Order Messages <DIV> with id=\"idmDisplayOrderMessagesPanel\"");
      } else {
        const msgDIV = document.createElement('div');
          msgDIV.classList.add("display-order-message");
          msgDIV.textContent = msg;
        domDisplayOrderMessagesDIV.appendChild(msgDIV);
        domDisplayOrderMessagesDIV.style.setProperty("display", "BLOCK");
      }
    }
  }



  showFilterPanelError(id, msg) {
    if (id && msg) {
      const domFiltersPanelErrorsSPAN = document.getElementById("idmDisplayOrderFiltersPanelErrors");
      if (! domFiltersPanelErrorsSPAN) {
        this.error("-- Failed to get Filter Panel Errors <DIV> with id=\"idmDisplayOrderFiltersPanelErrors\"");
      } else {
        const errorMsgDIVSelector = `#${id}.filter-panel-error`
        const errorMsgDIV         = domFiltersPanelErrorsSPAN.querySelector(errorMsgDIVSelector);
        if (! errorMsgDIV) {
          const newErrorMsgDIV = document.createElement('div');
            newErrorMsgDIV.setAttribute('id', id);
            newErrorMsgDIV.classList.add("filter-panel-error");
            newErrorMsgDIV.textContent = msg;
          domFiltersPanelErrorsSPAN.appendChild(newErrorMsgDIV);
        } else {
          errorMsgDIV.textContent = msg;
        }
      }
    }
  }

  clearFilterPanelError(id) {
    if (id) {
      const domFiltersPanelErrorsSPAN = document.getElementById("idmDisplayOrderFiltersPanelErrors");
      if (! domFiltersPanelErrorsSPAN) {
        this.error("-- Failed to get Filter Panel Errors <DIV> with id=\"idmDisplayOrderFiltersPanelErrors\"");
      } else {
        const errorMsgDIVSelector = `#${id}.filter-panel-error`
        const errorMsgDIV         = domFiltersPanelErrorsSPAN.querySelector(errorMsgDIVSelector);
        if (! errorMsgDIV) {
          this.debug(`-- No Filter Panel Errors <SPAN> with selector="${errorMsgDIVSelector}"`);
        } else {
          errorMsgDIV.textContent = '';
          errorMsgDIV.remove();
        }
      }
    }
  }

  clearAllFilterPanelErrors() {
    const domFiltersPanelErrorsSPAN = document.getElementById("idmDisplayOrderFiltersPanelErrors");
    if (! domFiltersPanelErrorsSPAN) {
      this.error("-- Failed to get Filter Panel Errors <DIV> with id=\"idmDisplayOrderFiltersPanelErrors\"");
    } else {
      for (const errorMsgDIV of domFiltersPanelErrorsSPAN.childNodes) {
        errorMsgDIV.remove();
      }
    }
  }

  unmarkAllFilterErrors() {
    const identityFilterControls = document.querySelectorAll(".identity-filter-control");
    if (identityFilterControls) for (const identityFilterControl of identityFilterControls) {
      if (identityFilterControl.classList.contains("can-mark-error")) {
        identityFilterControl.removeAttribute("error");
      }
      const markedErrorElements = identityFilterControl.querySelectorAll(".can-mark-error[error='true'");
      if (markedErrorElements) for (const markedErrorElement of markedErrorElements) {
        markedErrorElement.removeAttribute("error");
      }
    }
  }

  // filtering is a UI-Only concept
  isIdentityFiltered(identityId) {
    const domIdentityTR = document.querySelector(`tr.identity-item[identityId="${identitiId}"]`);
    if (domIdentityTR) {
      return this.isFilteredDomIdentityTR(domIdentityTR);
    }
    return false;
  }

  // filtering is a UI-Only concept
  isFilteredDomIdentityTR(domIdentityTR) {
    if (domIdentityTR) {
      return    domIdentityTR.classList.contains("filter-by-account")
             || domIdentityTR.classList.contains("filter-by-label")
             || domIdentityTR.classList.contains("filter-by-email")
             || domIdentityTR.classList.contains("filter-by-imported")
             || domIdentityTR.classList.contains("filter-by-locked")
             || domIdentityTR.classList.contains("filter-by-default")
             || domIdentityTR.classList.contains("filter-by-collected")
             || domIdentityTR.classList.contains("filter-by-showInMenu");
    }
    return false;
  }



  // Listen for messages that indicate that a New Identity has been "Collected"
  //
  // This means they were created automatically because, when sending a message
  // from the Compose window, the "From" address didn't match any existing
  // Identity.
  //
  // IdentityManagerPlus (background.js) does the actual creating of the new
  // IdmIdentity and places it at the END of the list via positionInMenu.
  // We just need to add it to the UI at the end of the list.
  //
  // Adds the Collected Identity to the END of the UI list
  async identityCollectedMessageListener(request, sender, sendResponse) {
    // The IdentityManagerPlus (background.js) sends a message as IdentityCollected:
    //  { 'id':        New Identity id
    //    'accountId': New Identity accountId
    //    'name':      New Identity name
    //    'email':     New Identity email
    //    'label':     New Identity label
    //  } 

    this.debug("OptionsUI#identityCollectedMessageListener -- request:", request);
 
    if (request && request.hasOwnProperty("IdentityCollected")) {
      const collectedIdentityInfo = request.IdentityCollected;
      this.logAlways( "NEW IDENTITY COLLECTED:",
                      `\n- id="${collectedIdentityInfo.id}"`,
                      `\n- accountId="${collectedIdentityInfo.accountId}"`,
                      `\n- name="${collectedIdentityInfo.name}"`,
                      `\n- email="${collectedIdentityInfo.email}"`,
                      `\n- label="${collectedIdentityInfo.label}"`,
                    );

      const idmIdentity = await this.#idmIdentitiesApi.getIdmIdentity(collectedIdentityInfo.id);
      if (! idmIdentity) {
        this.error(`-- FAILED TO GET COLLECTED IDENTITY: collectedIdentityInfo.id="${collectedIdentityInfo.id}"`);
      } else {
        await this.appendIdentityItemUI(idmIdentity); // Does NOT update positionInMenu
        ++this.#totalIdentityCount;
        await this.updateMessageCountsUI();
      }
    }

    return false; // not sending a response
  }



  markErrorTR(element) {
    if (element) {
      const trElement = element.closest('tr.can-mark-error');
      if (! trElement) {
      } else {
        trElement.setAttribute("error", 'true');
      }
    }
  }

  unmarkErrorTR(element) {
    if (element) {
      const trElement = element.closest('tr.can-mark-error');
      if (trElement) {
        trElement.removeAttribute("error");
      }
    }
  }

  markErrorTD(element) {
    if (element) {
      const tdElement = element.closest('td.can-mark-error');
      if (! tdElement) {
      } else {
        tdElement.setAttribute("error", 'true');
      }
    }
  }

  unmarkErrorTD(element) {
    if (element) {
      const tdElement = element.closest('td.can-mark-error');
      if (tdElement) {
        tdElement.removeAttribute("error");
      }
    }
  }

  markErrorSPAN(element) {
    if (element) {
      const spanElement = element.closest('span.can-mark-error');
      if (spanElement) {
        spanElement.setAttribute("error", 'true');
      }
    }
  }

  unmarkErrorSPAN(element) {
    if (element) {
      const spanElement = element.closest('span.can-mark-error');
      if (spanElement) {
        spanElement.removeAttribute("error");
      }
    }
  }



  findIdentityTRByIdentityId(identityId) {
    return document.querySelector(`tr.identity-item[identityId='${identityId}']`);
  }

  scrollIdentityToTop(identityId, offset, select) {
    const domIdentityTR = this.findIdentityTRByIdentityId(identityId);
    if (domIdentityTR) {
      domIdentityTR.scrollIntoView(
        { 'behavior': 'auto',
          'block':    'start',
          'inline':   'start'
        }
      );

      const posOffset = Number.isInteger(offset) ? offset : 50;
      const pos = this.getScrollPosition();
      pos.y -= posOffset;
      this.setScrollPosition(pos);

      const doSelect = (typeof select === 'boolean') ? select : false;
      if (doSelect && domIdentityTR.getAttribute('selected') !== 'true') {
        domIdentityTR.setAttribute('selected', 'true');
        this.enableDisableButtonsOnSelectionChanged();
      }
    }
  }

  scrollIdentityToBottom(identityId, offset, select) {
    const domIdentityTR = this.findIdentityTRByIdentityId(identityId);
    if (domIdentityTR) {
      domIdentityTR.scrollIntoView(
        { 'behavior': 'auto',
          'block':    'end',
          'inline':   'start'
        }
      );

      const posOffset = Number.isInteger(offset) ? offset : 50;
      const pos = this.getScrollPosition();
      pos.y += posOffset;
      this.setScrollPosition(pos);

      const doSelect = (typeof select === 'boolean') ? select : false;
      if (doSelect && domIdentityTR.getAttribute('selected') !== 'true') {
        domIdentityTR.setAttribute('selected', 'true');
        this.enableDisableButtonsOnSelectionChanged();
      }
    }
  }



  getScrollPosition() {
    return {
      x: window.scrollX || document.documentElement.scrollLeft || document.body.scrollLeft,
      y: window.scrollY || document.documentElement.scrollTop || document.body.scrollTop
    };
  }

  setScrollPosition(position) {
    window.scrollTo(position.x, position.y);
  }



  async testFilesystemBrokerMessagingButtonClicked(e) {
    if (e === null) return;
    e.preventDefault();
    e.stopPropagation();

    await this.testFilesystemBrokerMessaging();
  }

  async testFilesystemBrokerMessaging() {
    const tester = new FileSystemBrokerMessagingTest(this.#logger);
    await tester.testFileSystemBroker();
  }



  async testFilesystemBrokerApiButtonClicked(e) {
    if (e === null) return;
    e.preventDefault();
    e.stopPropagation();

    await this.testFilesystemBrokerApi();
  }

  async testFilesystemBrokerApi() {
    const tester = new FileSystemBrokerApiTest(this.#logger);
    await tester.testFileSystemApi();
  }



  async testFilesystemApiButtonClicked(e) {
    if (e === null) return;
    e.preventDefault();
    e.stopPropagation();

    await this.testFilesystemApi();
  }

  async testFilesystemApi() {
    const tester = new FileSystemExpApiTest(this.#logger);
    await tester.testFileSystemExpApi();
  }



  async testParseCSVFileButtonClicked(e) {
    if (e === null) return;
    e.preventDefault();
    e.stopPropagation();

    await this.testParseCSVFile();
  }

  async testParseCSVFile() {
    this.debugAlways("...\n\n********** TESTING PARSE CSV FILE **********\n\n");

    const CSV_FILE_NAME = "ionos-email-export-14449248.csv";
    const fsBrokerApi   = new FileSystemBrokerAPI();
    var   response;

    // returns { "fileName": string, "exists": boolean }
    response = await fsBrokerApi.exists(CSV_FILE_NAME);

    if (this.#PARSE_CSV_TEST_VERBOSE) this.debugAlways(`-- fileName="${CSV_FILE_NAME}" response.error=${response.error}`);
    if ('error' in response) {
      this.debugAlways(`-- GOT AN ERROR: response.error="${response.error}"`);
    } else {
      if (this.#PARSE_CSV_TEST_VERBOSE) this.debugAlways(`-- fileName="${CSV_FILE_NAME}" response.exists=${response.exists}`);
      if (! ('exists' in response) || ! response.exists) {
        this.debugAlways(`-- file does not exist: fileName="${CSV_FILE_NAME}"`);
      } else {
        // returns { "fileName": string, "isRegularFile": boolean }
        response = await fsBrokerApi.isRegularFile(CSV_FILE_NAME);
        if (this.#PARSE_CSV_TEST_VERBOSE) this.debugAlways(`-- fileName="${CSV_FILE_NAME}" response.isRegularFile=${response.isRegularFile}`);
        if (! ('isRegularFile' in response) || ! response.isRegularFile) {
          this.debugAlways(`-- file is not a Regular File: fileName="${CSV_FILE_NAME}"`);
        } else {
          // returns { "fileName": string, "data": UTF8-String }
          response = await fsBrokerApi.readFile(CSV_FILE_NAME);
          if (! ('data' in response)) {
            this.debugAlways(`-- readFile("${CSV_FILE_NAME}") did not return response.data`);
          } else {
            const fileData = response.data;
            if (this.#PARSE_CSV_TEST_VERBOSE) {
              this.debugAlways(`-- readFile("${CSV_FILE_NAME}") fileData.length=${fileData.length}`);
              this.debugAlways(`-- \n\nfileData ==========\n\n${fileData}\n\n==========\n\n`);
              const fileLines = fileData.split(/\r\n|\r|\n/);
              this.debugAlways(`-- fileLines.length=${fileLines.length}`);
              for (const fileLine of fileLines) {
                this.debugAlways(`-- fileLine="${fileLine}"`);
              }
            }
            const workbook  = XLSX.read( fileData, { type: 'string' } );
            const worksheet = workbook.Sheets[workbook.SheetNames[0]];
            const sheetData = XLSX.utils.sheet_to_json(worksheet, { header: 1 } ); // MABXXX Option to indicate if sheet has a header row
            if (this.#PARSE_CSV_TEST_VERBOSE) this.debugAlways(`-- sheetData.length=${sheetData.length}`);
            for (const sheetRow of sheetData) {
              // MABXXX Present a dialog to choose which row is header (if any)???, which column is email address, and which rows to add/exclude, and permanently exclude or not?
              // MABXXX HOW DO WE GET THE COLUMN COUNT???
              // this is ONLY for ionos.com email address export
              this.debugAlways(`-- email="${sheetRow[0]}" type="${sheetRow[1]}" contract="${sheetRow[2]}"`);
            }
          }
        }
      }
    }

    this.debugAlways("...\n\n********** DONE TESTING PARSE CSV FILE **********\n\n");
  }



  async testOptionsBackupButtonClicked(e) {
    if (e === null) return;
    e.preventDefault();
    e.stopPropagation();

    await this.testOptionsBackup();
  }

  async testOptionsBackup() {
    this.debugAlways("...\n\n********** TESTING OPTIONS BACKUP **********\n\n");

    var backupResponse;
    try {
      backupResponse = await this.#idmOptionsApi.backupToFile();
    } catch (error) {
      this.caught(error, "-- failed to backup to file");
    }

    if (! backupResponse) {
      this.debugAlways("-- backupToFile -- NO RESPONSE");
    } else if (backupResponse.invalid) {
      this.debugAlways(`-- backupToFile -- WRITE FILE ERROR: ${backupResponse.invalid}`);
    } else if (backupResponse.error) {
      this.debugAlways(`-- backupToFile -- WRITE FILE ERROR: ${backupResponse.error}`);
    } else if (! backupResponse.fileName) {
      this.debugAlways("-- backupToFile -- NO FILENAME RETURNED");
    } else {
      this.debugAlways(`-- backupToFile -- fileName="${backupResponse.fileName}" bytesWritten=${backupResponse.bytesWritten}`);

      var listBackupFilesResponse;
      try {
        listBackupFilesResponse = await this.#idmOptionsApi.listBackupFiles();
      } catch (error) {
        this.caught(error, "-- failed to get list of backup files");
      }

      if (! listBackupFilesResponse) {
        this.debugAlways("-- listBackupFiles -- NO RESPONSE");
      } else if (listBackupFilesResponse.invalid) {
        this.debugAlways(`-- listBackupFiles -- LIST FILES ERROR: ${listBackupFilesResponse.invalid}`);
      } else if (listBackupFilesResponse.error) {
        this.debugAlways(`-- listBackupFiles -- LIST FILES ERROR: ${listBackupFilesResponse.error}`);
      } else if (! listBackupFilesResponse.fileNames) {
        this.debugAlways("-- listBackupFiles -- NO FILENAMES RETURNED");
      } else if (listBackupFilesResponse.fileNames.length < 1) {
        this.debugAlways("-- listBackupFiles -- ZERO FILENAMES RETURNED");
      } else {
        for (const fileName of listBackupFilesResponse.fileNames) {
          this.debugAlways(`-- listBackupFiles -- fileName="${fileName}"`);
        }

        var readBackupFileResponse;
        try {
          readBackupFileResponse = await this.#idmOptionsApi.readBackupFile(backupResponse.fileName);
        } catch (error) {
          this.caught(error, "-- failed to read backup file");
        }

        if (! readBackupFileResponse) {
          this.debugAlways("-- readBackupFile -- NO RESPONSE");
        } else if (readBackupFileResponse.invalid) {
          this.debugAlways(`-- readBackupFile -- READ FILE ERROR: ${readBackupFileResponse.invalid}`);
        } else if (readBackupFileResponse.error) {
          this.debugAlways(`-- readBackupFile -- READ FILE ERROR: ${readBackupFileResponse.error}`);
        } else if (! readBackupFileResponse.fileName) {
          this.debugAlways("-- readBackupFile -- NO FILENAME RETURNED");
        } else if (! readBackupFileResponse.object) {
          this.debugAlways("-- readBackupFile -- NO OBJECT RETURNED");
        } else {
          this.debugAlways(`-- DATA RETURNED:\n\n`);
          for (const [optionName, optionValue] of Object.entries(readBackupFileResponse.object)) {
            this.debugAlways(`-- ${optionName}: "${optionValue}"`);
          }
        }
      }
    }

    this.debugAlways("...\n\n********** DONE TESTING OPTIONS BACKUP **********\n\n");
  }



  async displayOptionsAsPopupButtonClicked(e) {
    if (e === null) return;
    e.preventDefault();
    e.stopPropagation();

    this.showPopupWindow("OptionsUI");
  }



  // open ourself as a popup window
  async showPopupWindow(requestedBy) {
    if (this.#popupWindowMode) {
      this.error("showPopupWindow", "Attempt to display popup window in windowMode");

    } else if (this.#optionsPopupWindow) {
      this.error("showPopupWindow", "Attempt to display popup window with existing this.#optionsPopupWindow");

    } else {
      var   popupLeft   = 100;
      var   popupTop    = 100;
      var   popupHeight = 900;
      var   popupWidth  = 700;
      const mainWindow  = await messenger.windows.getCurrent();

      if (! mainWindow) {
        this.debug("-- DID NOT GET THE CURRENT (MAIN, mail:3pane) WINDOW!!! ---");
      } else {
        this.debug( "-- Got the Current (Main, mail:3pane) Window:",
                    `\n- mainWindow.top=${mainWindow.top}`,
                    `\n- mainWindow.left=${mainWindow.left}`,
                    `\n- mainWindow.height=${mainWindow.height}`,
                    `\n- mainWindow.width=${mainWindow.width}`,
                  );
        popupTop  = mainWindow.top  + 100;
        popupLeft = mainWindow.left + 100;
        if (mainWindow.height - 200 > popupHeight) popupHeight = mainWindow.Height - 200;   // make it higher, but not shorter
  ////////if (mainWindow.Width  - 200 > popupWidth)  popupWidth  = mainWindow.Width  - 200;   // make it wider,  but not narrower --- eh, don't need it wider
      }

      const bounds = await this.#idmOptionsApi.getWindowBounds("optionsWindowBounds");

      if (! bounds) {
        this.debug("-- no previous window bounds");
      } else if (typeof bounds !== 'object') {
        this.error(`-- PREVIOUS WINDOW BOUNDS "optionsWindowBounds" IS NOT AN OBJECT: typeof='${typeof bounds}' #####`);
      } else {
        this.debug( "-- restoring previous window bounds:",
                    `\n- bounds.top=${bounds.top}`,
                    `\n- bounds.left=${bounds.left}`,
                    `\n- bounds.width=${bounds.width}`,
                    `\n- bounds.height=${bounds.height}`,
                  );
        popupTop    = bounds.top;
        popupLeft   = bounds.left;
        popupWidth  = bounds.width;
        popupHeight = bounds.height;
      }

      const requestedByParam = ((typeof requestedBy === 'string') && requestedBy.length > 0)
                               ? `&requestedBy=${encodeURIComponent(requestedBy)}`
                               : '';

      // "?popupWindowMode=true" tells us we're running as a pop window
      // otherwise we don't want to add a window.beforeunload listener: windowUnloading()
      const optionsUrl = messenger.runtime.getURL( "optionsUI/optionsUI.html") + "?popupWindowMode=true" + requestedByParam;
      this.#optionsPopupWindow = await messenger.windows.create(
        {
          url:                 optionsUrl,
          type:                "popup",
          titlePreface:        getI18nMsg("options_optionsPageTitle", "Options") + " - ",
          top:                 popupTop,
          left:                popupLeft,
          height:              popupHeight,
          width:               popupWidth,
          allowScriptsToClose: true,
        }
      );

      // hide Show Options in Popup Window button
      const showPopupWindowButton = document.getElementById("idmDisplayOptionsAsPopup");
      if (showPopupWindowButton) {
        showPopupWindowButton.style.setProperty("display", "none");
      }

      this.debug(`-- OptionsUI Popup Window Created -- windowId="${this.#optionsPopupWindow.id}" URL="${optionsUrl}"`);
    }
  }

  async popupWindowRemoved(windowId) {
    this.debug( "--- WINDOW REMOVED ---",
                `\n- windowId="${windowId}"`,
                `\n- this.#optionsPopupWindow.id="${this.#optionsPopupWindow ? this.#optionsPopupWindow.id : "(NONE)"}"`,
                `\n- this.windowMode=${this.windowMode}`,
              );


    if (this.#optionsPopupWindow && windowId === this.#optionsPopupWindow.id) { // it's a windowRemoved event for some other window
      this.#optionsPopupWindow = null;
    
      if (this.#popupWindowMode) {
        this.error(`-- POPUP WINDOW MODE`);

      } else {
        const showPopupWindowButton = document.getElementById("idmDisplayOptionsAsPopup");
        if (showPopupWindowButton) {
          showPopupWindowButton.style.setProperty("display", "inline-block");
        }
      }
    }
  }
}



var optionsUI  = new OptionsUI();

document.addEventListener("DOMContentLoaded", (e) => optionsUI.init(e), {once: true});
