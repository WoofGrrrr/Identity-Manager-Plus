import { IdmOptions      } from '../modules/options.js';
import { IdmIdentities   } from '../modules/identities.js';
import { BorderColorsApi } from '../modules/bordercolorsapi.js';
import { Logger          } from '../modules/logger.js';
import { parseDocumentLocation, isValidEmail, getI18nMsg } from '../modules/utilities.js';



class IdentityEditor {
  #CLASS_NAME       = this.constructor.name;
  
  #LOG              = false;
  #DEBUG            = false;
  #WARN             = false;

  #logger           = new Logger();
  #idmOptionsApi    = new IdmOptions(this.#logger);
  #idmIdentitiesApi = new IdmIdentities(this.#idmOptionsApi, this.#logger);

  #canceled         = false;
  #saved            = false;



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

////window.onbeforeunload = (e) => this.windowUnloading(e, createNewIdentity, idmIdentity);
    window.addEventListener("beforeunload", (e) => this.windowUnloading(e, createNewIdentity, idmIdentity));

    await this.localizePage();

    let borderColorsApi   = new BorderColorsApi();
    let borderColors      = await borderColorsApi.getAllColors();

    let thisWindow        = await messenger.windows.getCurrent();
    let docLocationInfo   = parseDocumentLocation(document);
    let params            = docLocationInfo.params;
    let identityId; 
    let idmIdentity; 
    let identityNotFound  = false;
    let createNewIdentity = false;
    let accountId; 
    let account; 

    if (params) {
      identityId = params.get('identityId');
      this.debug(`-- identityId="${identityId}"`);
    }

    if (! identityId) {
      this.error("##### No Identity ID was provided #####");
      this.setErrorFor("instructions", "identityEditor_error_message_no_identity_id");

    } else if (identityId === 'CREATE') {
      this.debug("-- CREATING NEW IDENTITY --");
      createNewIdentity = true;
 
    } else {
      idmIdentity = await this.#idmIdentitiesApi.getIdmIdentity(identityId);

      if (! idmIdentity) {
        identityNotFound  = true;
        this.error(`##### IDENTITY NOT FOUND ##### identityId="${identityId}"`);
        let instructionsDiv = document.getElementById("instructions");
        let msg = getI18nMsg("identityEditor_error_message_identity_not_found") + ` Identity Id="${identityId}"`;
        instructionsDiv.textContent = msg;

      } else {
        if (this.#DEBUG) this.debugAlways( "-- Identity found:"
                                           + `\n- id="${idmIdentity.id}"`
                                           + `\n- name="${idmIdentity.name}"`
                                           + `\n- email="${idmIdentity.email}"`
                                           + `\n- collected="${idmIdentity.collected}"`
                                           + `\n- imported="${idmIdentity.imported}"`
                                           + `\n- showInMenu="${idmIdentity.showInMenu}"`
                                           + `\n- accountId="${idmIdentity.accountId}"`
                                           + `\n- accountDefault="${idmIdentity.accountDefault}"`
                                           + `\n- positionInMenu="${idmIdentity.positionInMenu}"`
                                           + `\n- lockInMenu="${idmIdentity.lockInMenu}"`
                                         );

        accountId = idmIdentity.accountId;
        if (! accountId) {
          this.error(`##### IDENTITY HAS NO ACCOUNT ID ##### identityId="${identityId}" `);
          let instructionsDiv = document.getElementById("instructions");
          let msg = getI18nMsg("identityEditor_error_message_identity_missing_account_id") + ` Identity Id="${identityId}"`;
          instructionsDiv.textContent = msg;

        } else {
          account = await messenger.accounts.get(accountId);
          if (! account) {
            this.error(`##### ACCOUNT NOT FOUND ##### accountId="${accountId}" identityId="${identityId}"`);
            let instructionsDiv = document.getElementById("instructions");
            let msg = getI18nMsg("identityEditor_error_message_account_not_found") + ` Account ID="${accountId}"`;
            instructionsDiv.textContent = msg;

          } else {
            this.debug(`-- account.id="${account.id}" account.name="${account.name}"`);
          }
        }
      }
    }


    if (! identityNotFound) {
      if (borderColors && ! createNewIdentity) {
        let identityBorderColor = ((identityId in borderColors) && (borderColors[identityId] !== undefined)) ? borderColors[identityId] : null;
        this.debug(`-- identityBorderColor="${identityBorderColor}"`);

        if (identityBorderColor) {
          this.debug(`-- For BorderColors D: adding style variable --identity-border-color="${identityBorderColor}" on "identity_editor"`);
          let identityEditorDiv = document.getElementById("identity_editor");
          identityEditorDiv.style.setProperty("--identity-border-color", identityBorderColor);
          this.debug("run -- For BorderColors D: adding class identity-border-color to identity_editor");
          identityEditorDiv.classList.add("identity-border-color");

//////////this.debug("-- For BorderColors D: adding class identity-border-color to identity_data_panel");
//////////let identityDataPanelDiv = document.getElementById("identity_data_panel");
//////////identityDataPanelDiv.classList.add("identity-border-color");
        }
      } else {
        // the css could just hide the border color instead
      }


      let instructionsDiv = document.getElementById("instructions");
      let instructions    = 'Enter Identity data and click "Save"';
      if (createNewIdentity) {
        instructions = getI18nMsg("identityEditor_instructions_create");
      } else {
        instructions = getI18nMsg("identityEditor_instructions_edit");
      }
      instructionsDiv.textContent = instructions;

      let identityAccountNameLabel = document.getElementById("identity_account_name");
      let identityAccountDiv       = document.getElementById("identity_account");
      let identityAccountSelect    = document.getElementById("identity_account_select");

      if (createNewIdentity) {
        // create the Account Selector
        const accounts = await messenger.accounts.list(false); // includeSubFolders=false: do not get sub-folders
        this.debug(`-- CREATE NEW IDENTITY -- got ${accounts.length} Accounts`);
        for (const account of accounts) {
          if (account.type === 'none') {
            this.debug(`-- CREATE NEW IDENTITY -- skipping account, local folder?: id="${account.id}" name="${account.name}" type="${account.type}"`);
          } else {
            this.debug(`-- CREATE NEW IDENTITY -- adding account option: id="${account.id}" name="${account.name}" type="${account.type}"`);
            let option = document.createElement("option");
            option.setAttribute("value", account.id);
            option.appendChild(document.createTextNode(account.name));
            identityAccountSelect.appendChild(option);
          }
        }

        identityAccountNameLabel.setAttribute("hide-me", "true"); // hide the Account Name label
        identityAccountDiv.setAttribute("hide-me", "false");      // show the Account selector

        let identityCollectedPanel              = document.getElementById("identity_collected_panel"); /* don't worry about collecting data, it's read-only */
        let identityCollectedCheck              = document.getElementById("identity_collected_check");
        identityCollectedCheck.checked          = false;
        identityCollectedPanel.setAttribute("hide-me", "true");

        let identityImportedPanel               = document.getElementById("identity_imported_panel"); /* don't worry about collecting data, it's read-only */
        let identityImportedCheck               = document.getElementById("identity_imported_check");
        identityImportedCheck.checked           = false;
        identityImportedPanel.setAttribute("hide-me", "true");

        let identityAccountDefaultPanel         = document.getElementById("identity_accountdefault_panel"); /* don't worry about collecting data, it's read-only */
        identityAccountDefaultPanel.setAttribute("hide-me", "true");

        let identityPositionInMenuPanel         = document.getElementById("identity_positioninmenu_panel"); /* don't worry about collecting data, it's read-only */
        identityPositionInMenuPanel.setAttribute("hide-me", "true");

        let identityShowInMenuCheck             = document.getElementById("identity_showinmenu_check");
        identityShowInMenuCheck.checked         = true;

        let identityLockInMenuCheck             = document.getElementById("identity_lockinmenu_check");
        identityLockInMenuCheck.checked         = false;

        // MABXXX default the Email Address field to Domain of Account Default Identity???

      } else {
        identityAccountNameLabel.setAttribute("hide-me", "false"); // show the Account Name label
        identityAccountDiv.setAttribute("hide-me", "true")         // hide the Account selector

        identityAccountNameLabel.textContent = (account && (typeof account.name === 'string')) ? account.name : "";

        let isIdentityAccountDefault   = (typeof idmIdentity.accountDefault === 'boolean') ? idmIdentity.accountDefault : false;
        let isIdentityCollected        = (typeof idmIdentity.collected === 'boolean') ? idmIdentity.collected : false;
        let isIdentityImported         = (typeof idmIdentity.imported === 'boolean') ? idmIdentity.imported : false;

        let identityCollectedPanel     = document.getElementById("identity_collected_panel");
        let identityCollectedCheck     = document.getElementById("identity_collected_check");

        let identityImportedPanel      = document.getElementById("identity_imported_panel");
        let identityImportedCheck      = document.getElementById("identity_imported_check");

        identityCollectedCheck.checked = isIdentityCollected;
        if (isIdentityCollected) {
          identityCollectedPanel.setAttribute("hide-me", "false");
        } else {
          identityCollectedPanel.setAttribute("hide-me", "true");
        }

        identityImportedCheck.checked  = isIdentityImported;
        if (isIdentityImported) {
          identityImportedPanel.setAttribute("hide-me", "false");
        } else {
          identityImportedPanel.setAttribute("hide-me", "true");
        }

        let identityShowInMenuCheck             = document.getElementById("identity_showinmenu_check");
        identityShowInMenuCheck.checked         = (typeof idmIdentity.showInMenu === 'boolean') ? idmIdentity.showInMenu : true;

        let identityAccountDefaultCheck         = document.getElementById("identity_accountdefault_check");
        identityAccountDefaultCheck.checked     = isIdentityAccountDefault;

        /* use this CSS selector instead: #identity_accountdefault_check:checked + label { */
  //////let identityAccountDefaultCheckLabel    = document.querySelector(".identity-item-check-label[for='identity_accountdefault_check']");

        let identityNameInput                   = document.getElementById("identity_name");
        identityNameInput.value                 = (typeof idmIdentity.name === 'string') ? idmIdentity.name : "";

        let identityEmailInput                  = document.getElementById("identity_email");
        identityEmailInput.value                = (typeof idmIdentity.email === 'string') ? idmIdentity.email : "";

        let identityReplyToInput                = document.getElementById("identity_replyto");
        identityReplyToInput.value              = (typeof idmIdentity.name === 'string') ? idmIdentity.replyTo : "";

        let identityComposeHtmlCheck            = document.getElementById("identity_compose_html_check");
        identityComposeHtmlCheck.checked        = (typeof idmIdentity.composeHtml === 'boolean') ? idmIdentity.composeHtml : false;

        let identityOrganizationInput           = document.getElementById("identity_organization");
        identityOrganizationInput.value         = (typeof idmIdentity.organization == 'string') ? idmIdentity.organization : "";

        let identityLabelInput                  = document.getElementById("identity_label");
        identityLabelInput.value                = (typeof idmIdentity.idLabel === 'string') ? idmIdentity.idLabel : ""; // <------------ idLabel, NOT label ----------------<<<

        let identityPositionInMenuLabel         = document.getElementById("identity_positioninmenu");
        identityPositionInMenuLabel.textContent = (typeof idmIdentity.positionInMenu === 'number') ? idmIdentity.positionInMenu : -1;

        let identityLockInMenuCheck             = document.getElementById("identity_lockinmenu_check");
        identityLockInMenuCheck.checked         = (typeof idmIdentity.lockInMenu === 'boolean') ? idmIdentity.lockInMenu : false;

        let identitySignatureHtmlCheck          = document.getElementById("identity_signature_html_check");
        identitySignatureHtmlCheck.checked      = (typeof idmIdentity.signatureIsPlainText === 'boolean') ? (! idmIdentity.signatureIsPlainText) : false;

        let identitySignatureTextarea           = document.getElementById("identity_signature");
        identitySignatureTextarea.value         = (typeof idmIdentity.signature === 'string') ? idmIdentity.signature : "";
      }
    }



    let saveButton = document.getElementById("save_button");
    saveButton.addEventListener("click", (e) => this.saveButtonClicked(e, createNewIdentity, identityId, thisWindow.id));

    let cancelButton = document.getElementById("cancel_button");
    cancelButton.addEventListener("click", (e) => this.cancelButtonClicked(e, thisWindow.id));

    messenger.windows.onRemoved.addListener((windowId) => this.windowRemoved(windowId, thisWindow.id));

    this.debug("-- end");
  }
  


  async windowUnloading(e, createNewIdentity, idmIdentity) {
    if (this.#DEBUG) this.debugAlways( "--- Window Unloading ---"
                                       + `\n- createNewIdentity=${createNewIdentity}`
                                       + `\n- window.screenTop=${window.screenTop}`
                                       + `\n- window.screenLeft=${window.screenLeft}`
                                       + `\n- window.outerWidth=${window.outerWidth}`
                                       + `\n- window.outerHeight=${window.outerHeight}`
                                     );

    let okayToClose = false;

    if (this.#canceled || this.#saved) {
      okayToClose = true;
      if (this.#DEBUG) this.debugAlways( "--- Window Unloading ---"
                                         + `\n- this.#saved=${this.#saved}`
                                         + `\n- this.#canceled=${this.#canceled}`
                                         + `\n- okayToClose=${okayToClose}`
                                       );
    } else {
      // see if there are any unsaved changes
      let isDataChanged = this.isUIDataChanged(createNewIdentity, idmIdentity);
      okayToClose = ! isDataChanged;
      if (this.#DEBUG) this.debugAlways( "--- Window Unloading ---"
                                         + `\n- this.#saved=${this.#saved}`
                                         + `\n- this.#canceled=${this.#canceled}`
                                         + `\n- isDataChanged=${isDataChanged}`
                                         + `\n- okayToClose=${okayToClose}`
                                       );
    }

    if (okayToClose) {
//    let bounds = {
//      "top":    window.screenTop,
//      "left":   window.screenLeft,
//      "width":  window.outerWidth,
//      "height": window.outerHeight
//    }
      await this.#idmOptionsApi.storeWindowBounds("editorWindowBounds", window);

      if (this.#DEBUG) {
        let bounds = await this.#idmOptionsApi.getWindowBounds("editorWindowBounds");

        if (! bounds) {
          this.debugAlways("--- WINDOW UNLOADING --- FAILED TO GET Editor Window Bounds ---");
        } else if (typeof bounds !== 'object') {
          this.debugAlways(`--- WINDOW UNLOADING --- Editor Window Bounds IS NOT AN OBJECT: typeof='${typeof bounds}' ---`);
        } else {
          this.debugAlways( "---"
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

    } else {
      this.debug("--- WINDOW UNLOADING --- TELLING TB TO PREVENT CLOSING, BUT DID *IT* DETECT USER INTERACTION???");

      // Tell Thunderbird NOT to close the window
      // If Thunderbird did not detect any user interaction, it will close anyway.  How to prevent that???
      e.preventDefault();
      e.returnValue = 'Data has changed.  Please Save or Cancel.';  // any "truthy" value will do.  TB doesn't use the string.
      return true;
    }
  }



  async localizePage() {
    this.debug("-- start");

    for (let el of document.querySelectorAll("[data-l10n-id]")) {
      let id = el.getAttribute("data-l10n-id");
      let i18nMessage = getI18nMsg(id);
      el.textContent = i18nMessage;
    }

    for (let el of document.querySelectorAll("[data-html-l10n-id]")) {
      let id = el.getAttribute("data-html-l10n-id");
      let i18nMessage = getI18nMsg(id);
      el.insertAdjacentHTML('afterbegin', i18nMessage);
    }

    this.debug("-- end");
  }



  async saveButtonClicked(e, createNew, identityId, thisWindowId) {
    this.debug(`-- createNew="${createNew}" identityId="${identityId}" thisWindowId="${thisWindowId}"`);

    let errors = 0;
    this.resetErrors();

    let accountId;
    if (createNew) {
      let identityAccountSelect = document.getElementById("identity_account_select");
      accountId = identityAccountSelect.value;
      if (! accountId) {
        this.debug("-- Error: No Account selected");
        this.setErrorFor("identity_account_select", "identityEditor_error_message_missing_account");
        errors++;
      }
    }



    let mailIdentity          = this.createMailIdentityFromUI();
    let identityExtendedProps = this.createIdentityExtendedPropsFromUI(); // MABXXX Gets only showInMenu and lockInMenu - SETS "collected" & "imported" to false !!!



    if (! mailIdentity.name) {
      this.debug("-- Error: No Identity Name");
      this.setErrorFor("identity_name", "identityEditor_error_message_missing_name");
      errors++;
    }

    if (! mailIdentity.email) {
      this.debug("-- Error: No Identity Email");
      this.setErrorFor("identity_email", "identityEditor_error_message_missing_email");
      errors++;
    } else if (! isValidEmail(mailIdentity.email)) {
      this.debug("-- Error: Invalid Identity Email");
      this.setErrorFor("identity_email", "identityEditor_error_message_invalid_email");
      errors++;
    }

    if (mailIdentity.replyTo && ! isValidEmail(mailIdentity.replyTo)) {
      this.debug("-- Error: Invalid Identity ReplyTo");
      this.setErrorFor("identity_replyto", "identityEditor_error_message_invalid_replyto");
      errors++;
    }



    let responseMessage = "";

    if (errors > 0) {
      this.debug(`-- ERRORS: ${errors}`);
      this.setErrorFor("instructions", "identityEditor_error_message_instructions");

    } else {
      if (createNew) {
        try {
          let newIdmIdentity  = await this.#idmIdentitiesApi.createIdmIdentity(accountId, mailIdentity, identityExtendedProps);
         
          responseMessage = "CREATED:" + newIdmIdentity.id;
          this.debug(`-- create successful: accountId="${accountId}" newIdmIdentity.id="${newIdmIdentity.id}" responseMessage="${responseMessage}"`);

          this.#saved = true;

        } catch (error) {
          this.caught(error, "##### Error: Create Failed #####");
          errors++;
          this.setErrorFor("instructions", "identityEditor_error_message_create_failed");
        }

      } else {
        try {
          let updatedIdmIdentity = await this.#idmIdentitiesApi.updateIdmIdentity(identityId, mailIdentity, identityExtendedProps);
          responseMessage = "UPDATED";
          this.debug( "-- update successful:"
                       + `\n- identityId="${identityId}"`
                       + `\n- updatedIdmIdentity.id="${updatedIdmIdentity.id}"`
                       + `\n- responseMessage="${responseMessage}"`
                    );

          this.#saved = true;

        } catch (error) {
          this.caught(error, "##### Error: Update Failed #####");
          errors++;
          this.setErrorFor("instructions", "identityEditor_error_message_update_failed");
        }
      }
    }

    if (errors == 0) {
      this.debug(`-- No Errors - sending responseMessage="${responseMessage}"`);

      try {
        await messenger.runtime.sendMessage(
          { IdentityEditorResponse: responseMessage }
        );
      } catch (error) {
        this.caught( error, 
                     "##### SEND RESPONSE MESSAGE FAILED #####"
                     + `\n- thisWindowId="${thisWindowId}"`
                     + `\n- responseMessage="${responseMessage}"`
                   );
        errors++;
        this.setErrorFor("instructions", "identityEditor_error_message_response_message_failed_ui");
      }

      if (errors > 0) {
        // allow the user to see the message

      } else if (! thisWindowId) {
        this.error("##### ERROR: CANNOT CLOSE WINDOW - NO WINDOW ID #####");
        this.setErrorFor("instructions", "identityEditor_error_message_close_failed_no_window_id");

      } else {
        this.debug("-- No Errors - closing window");
////////messenger.windows.remove(thisWindowId); // this can cause an error with message send/receive - something about conduit destroyed
        window.close();
      }
    }
  }

  resetErrors() {
    let errorDivs = document.querySelectorAll("div.identity-data-error");
    if (errorDivs) {
      for (let errorDiv of errorDivs) {
        errorDiv.setAttribute("error", "false");
      }
    }

    let errorLabels = document.querySelectorAll("label.identity-data-error-text");
    if (errorLabels) {
      for (let errorLabel of errorLabels) {
        errorLabel.setAttribute("error", "false");
        errorLabel.innerText = ""; // MABXXX THIS IS A HUGE LESSON:  DO NOT USE: <label/>   USE: <label></label> 
      }
    }
  }

  setErrorFor(elementId, msgId) {
    if (elementId && msgId) {
      let errorDiv = document.querySelector("div.identity-data-error[error-for='" + elementId + "']");
      if (errorDiv) {
        errorDiv.setAttribute("error", "true");
      }

      let errorLabel = document.querySelector("label.identity-data-error-text[error-for='" + elementId + "']");
      if (errorLabel) {
        let i18nMessage = getI18nMsg(msgId);
        errorLabel.innerText = i18nMessage;
      }
    }
  }



  createMailIdentityFromUI() {

////let identityAccountNameLabel   = document.getElementById("identity_account_name");
////let identityAccountName        = identityAccountNameLabel.textContent

    let identityNameInput          = document.getElementById("identity_name");
    let identityName               = identityNameInput.value

    let identityEmailInput         = document.getElementById("identity_email");
    let identityEmail              = identityEmailInput.value

    let identityReplyToInput       = document.getElementById("identity_replyto");
    let identityReplyTo            = identityReplyToInput.value

    let identityComposeHtmlCheck   = document.getElementById("identity_compose_html_check");
    let identityComposeHtml        = identityComposeHtmlCheck.checked

    let identityOrganizationInput  = document.getElementById("identity_organization");
    let identityOrganization       = identityOrganizationInput.value

    let identityLabelInput         = document.getElementById("identity_label");
    let identityLabel              = identityLabelInput.value

    let identitySignatureHtmlCheck = document.getElementById("identity_signature_html_check");
    let identitySignatureIsHtml    = identitySignatureHtmlCheck.checked

    let identitySignatureTextarea  = document.getElementById("identity_signature");
    let identitySignature          = identitySignatureTextarea.value

    let mailIdentity = {
      "name":                 identityName,
      "email":                identityEmail,
      "replyTo":              identityReplyTo,
      "composeHtml":          identityComposeHtml,
      "organization":         identityOrganization,
      "label":                identityLabel,               // this is a MialIdentity. so "label" not "idLabel"
      "signatureIsPlainText": ! identitySignatureIsHtml,
      "signature":            identitySignature
    };

    return mailIdentity;
  }



  createIdentityExtendedPropsFromUI() {
    let showInMenuCheck = document.getElementById("identity_showinmenu_check");
    let showInMenu      = showInMenuCheck.checked

    let lockInMenuCheck = document.getElementById("identity_lockinmenu_check");
    let lockInMenu      = lockInMenuCheck.checked

    let identityExtendedProps = {
      "showInMenu": showInMenu,
      "lockInMenu": lockInMenu,
      "collected":  false,
      "imported":  false
    }

    return identityExtendedProps;
  }



  isUIDataChanged(createNewIdentity, oldIdmIdentity) {
    this.debug(`-- createNewIdentity=${createNewIdentity}" oldIdmIdentity=${oldIdmIdentity}`);

    let newMailIdentity = this.createMailIdentityFromUI();

    if (false) {
      if (oldIdmIdentity) {
        this.debugAlways( "-- oldIdmIdentity:"
                          + `\n- name                 = "${oldIdmIdentity.name}"`
                          + `\n- email                = "${oldIdmIdentity.email}"`
                          + `\n- replyTo              = "${oldIdmIdentity.replyTo}"`
                          + `\n- composeHtml          = ${oldIdmIdentity.composeHtml}`
                          + `\n- organization         = "${oldIdmIdentity.organization}"`
                          + `\n- idLabel              = "${oldIdmIdentity.idLabel}"` // <------------ idLabel ----------------<<<
                          + `\n- signatureIsPlainText = ${oldIdmIdentity.signatureIsPlainText}`
                          + `\n- signature            = "${oldIdmIdentity.signature}"`
                        );
      }

      this.debugAlways( "-- newMailIdentity:"
                        + `\n- name                 = "${newMailIdentity.name}"`
                        + `\n- email                = "${newMailIdentity.email}"`
                        + `\n- replyTo              = "${newMailIdentity.replyTo}"`
                        + `\n- composeHtml          = ${newMailIdentity.composeHtml}`
                        + `\n- organization         = "${newMailIdentity.organization}"`
                        + `\n- label                = "${newMailIdentity.label}"`
                        + `\n- signatureIsPlainText = ${newMailIdentity.signatureIsPlainText}`
                        + `\n- signature            = "${newMailIdentity.signature}"`
                      );
    }
    
    if (createNewIdentity || ! oldIdmIdentity) { // creating new identity
      return    newMailIdentity.name
             || newMailIdentity.email
             || newMailIdentity.replyTo
             || newMailIdentity.composeHtml            // did they check the "Compose messsages in HTML" checkbox? (default is un-checked)
             || newMailIdentity.organization
             || newMailIdentity.label
             || ! newMailIdentity.signatureIsPlainText // did they check the "Signature Text: Use HTML" checkbox? (default is un-checked)
             || newMailIdentity.signature;
      // MABXXX OTHERS NOW!!!
    }

    if (false) {
      this.debugAlways("-- COMPARING IDENTITIES --");
      this.debugAlways(`name??? ................... ${( newMailIdentity.name                 !== oldIdmIdentity.name                 )}`);
      this.debugAlways(`email??? .................. ${( newMailIdentity.email                !== oldIdmIdentity.email                )}`);
      this.debugAlways(`replyTo??? ................ ${( newMailIdentity.replyTo              !== oldIdmIdentity.replyTo              )}`);
      this.debugAlways(`composeHtml??? ............ ${( newMailIdentity.composeHtml          !== oldIdmIdentity.composeHtml          )}`);
      this.debugAlways(`organization??? ........... ${( newMailIdentity.organization         !== oldIdmIdentity.organization         )}`);
      this.debugAlways(`label??? .................. ${( newMailIdentity.label                !== oldIdmIdentity.idLabel              )}`);
      this.debugAlways(`signatureIsPlainText??? ... ${( newMailIdentity.signatureIsPlainText !== oldIdmIdentity.signatureIsPlainText )}`);
      this.debugAlways(`signature??? .............. ${( newMailIdentity.signature            !== oldIdmIdentity.signature            )}`);
      // MABXXX OTHERS NOW!!!
    }

    return    ( newMailIdentity.name                 !== oldIdmIdentity.name                 )
           || ( newMailIdentity.email                !== oldIdmIdentity.email                )
           || ( newMailIdentity.replyTo              !== oldIdmIdentity.replyTo              )
           || ( newMailIdentity.composeHtml          !== oldIdmIdentity.composeHtml          )
           || ( newMailIdentity.organization         !== oldIdmIdentity.organization         )
           || ( newMailIdentity.label                !== oldIdmIdentity.idLabel              ) // <------------ idLabel ----------------<<<
           || ( newMailIdentity.signatureIsPlainText !== oldIdmIdentity.signatureIsPlainText )
           || ( newMailIdentity.signature            !== oldIdmIdentity.signature            );
      // MABXXX OTHERS NOW!!!
  }



  async cancelButtonClicked(e, thisWindowId) {
     this.debug(`-- thisWindowId="${thisWindowId}"`);

    this.#canceled = true;

    if (! thisWindowId) {
      this.error("##### ERROR: CANNOT CLOSE WINDOW - NO WINDOW ID #####");
      this.setErrorFor("instructions", "identityEditor_error_message_close_failed_no_window_id");

    } else {
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
                     + `\n- thisWindowId="${thisWindowId}"`
                     + `\n- responseMessage="${responseMessage}"`
                   );
      }

      this.debug("-- Closing window");
//////messenger.windows.remove(thisWindowId); // this is what causes the "'Conduits' destroyed" error described above
      window.close();
    }
  }



  async windowRemoved(windowId, thisWindowId) {
    this.debug(`-- windowId="${windowId}" thisWindowId="${thisWindowId}" `);

    if (true) { // <==========================================================================================<<<
      // sending the message causes the "'Conduits' destroyed" error mentioned below.
      // they'll just have to listen for the onRemoved() event.
    } else {
      let responseMessage = "CLOSED";
      this.debug(`-- Sending responseMessage="${responseMessage}"`);

      try { // just in case the window is not listening for windowRemoved (any more)
        // maybe not the best idea to do this... message receiver gets:
        //     Promise rejected after context unloaded: Actor 'Conduits' destroyed before query 'RuntimeMessage' was resolved
        await messenger.runtime.sendMessage(
          { IdentityEditorResponse: responseMessage }
        );
      } catch (error) {
        // any need to tell the user???
        this.caught( error,
                     "##### SEND RESPONSE MESSAGE FAILED #####"
                     + `\n- windowId="${windowId}"`
                     + `\n- thisWindowId="${thisWindowId}"`
                     + `\n- responseMessage="${responseMessage}"`
                   );
      }
    }
  }
}



let identityEditor = new IdentityEditor();

document.addEventListener("DOMContentLoaded", (e) => identityEditor.run(e), {once: true});
