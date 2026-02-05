import { IdmOptions }      from '../modules/options.js';
import { IdmIdentities }   from '../modules/identities.js';
import { BorderColorsApi } from '../modules/bordercolorsapi.js';
import { Logger }          from '../modules/logger.js';
import { getI18nMsg, parseDocumentLocation, getIdentityNameAndEmail } from '../modules/utilities.js';



class IdentityChooser {
  #CLASS_NAME     = this.constructor.name;

  #LOG            = false;
  #DEBUG          = false;
  #WARN           = false;

  #filterByRegex  = false; // MABXXX Make this an option or a checkbox on this page or something

  #logger         = new Logger();
  #idmOptionsApi  = new IdmOptions(this.#logger);



  constructor() {
    this.boundFunction1 = this.identityClicked.bind(this);       // this makes sure "identityClicked" can use "this"
    this.boundFunction2 = this.identityButtonClicked.bind(this); // this makes sure "identityButtonClicked" can use "this"
    this.boundFunction3 = this.debugAlways.bind(this);           // this makes sure "debugAlways" can use "this"
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
    window.addEventListener("beforeunload", (e) => this.windowUnloading(e));

    this.setupEventListeners();

    await this.localizePage();
    await this.applyTooltips(document);

    const docLocationInfo = parseDocumentLocation(document);
    const params          = docLocationInfo.params;
    let   defaultIdentityId; 
    let   defaultComposeToNameAndEmail; 

    if (params) {
      defaultIdentityId = params.get('defaultIdentityId');
      this.debug(`-- defaultIdentityId="${defaultIdentityId}"`);
    }
    if (! defaultIdentityId) {
      this.debugAlways(`-- no default Identity ID was provided`);
    } else {
      defaultComposeToNameAndEmail = await getIdentityNameAndEmail(defaultIdentityId, this.#logger);
    }

    const optionsApi       = new IdmOptions(this.#logger);
    const idmIdentitiesApi = new IdmIdentities(optionsApi, this.#logger);
    const idmIdentities    = await idmIdentitiesApi.getIdmIdentities();
    const identitiesList   = document.getElementById("idmIdentityList");
    const borderColorsApi  = new BorderColorsApi();
    const borderColors     = await borderColorsApi.getAllColors();

    this.debug(`-- idmIdentities.length=${idmIdentities.length}`);

    for (const idmIdentity of idmIdentities) {
      const isDefaultIdentity = idmIdentity.id === defaultIdentityId;

      this.debug(`-- id="${idmIdentity.id}" name="${idmIdentity.name}" email="${idmIdentity.email}" showInMenu="${idmIdentity.showInMenu}" DEFAULT=${isDefaultIdentity}`);

      if (idmIdentity.showInMenu) {
        this.debug("-- adding idmIdentity ", idmIdentity.name, idmIdentity.email);

        const identityItemTR = document.createElement("tr");
          identityItemTR.setAttribute( "identityId",     idmIdentity.id    );
          identityItemTR.setAttribute( "identity-email", idmIdentity.email );
          identityItemTR.classList.add("identity-item");
//        if (isDefaultIdentity) identityItemTR.classList.add("default-identity");
          identityItemTR.addEventListener("click", (e) => this.identityClicked(e));

          const identityBorderColorTD = document.createElement("td");
            identityBorderColorTD.classList.add("identity-item-border-color");
            identityBorderColorTD.classList.add("identity-item-data");

            if (borderColors != null) {
              const borderColorDotSpan = document.createElement("span");
                borderColorDotSpan.classList.add("identity-item-border-color-dot");
                if (idmIdentity.id in borderColors && borderColors[idmIdentity.id] !== undefined) {
                  identityItemTR.style.setProperty("--bullet-color", borderColors[idmIdentity.id]);
                  identityItemTR.style.setProperty("--bullet-border-style", "solid");
                }
              identityBorderColorTD.appendChild(borderColorDotSpan);
            }
          identityItemTR.appendChild(identityBorderColorTD);

          const identityLabelTD = document.createElement("td");
            identityLabelTD.classList.add("identity-item-label");
            identityLabelTD.classList.add("identity-item-data");
            if (isDefaultIdentity) identityLabelTD.classList.add("default-identity");
            identityLabelTD.appendChild( document.createTextNode(idmIdentity.label) );
          identityItemTR.appendChild(identityLabelTD);

          const identityEmailTD = document.createElement("td");
            identityEmailTD.classList.add("identity-item-email");
            identityEmailTD.classList.add("identity-item-data");
            if (isDefaultIdentity) identityEmailTD.classList.add("default-identity");
            identityEmailTD.appendChild( document.createTextNode('<' + idmIdentity.email + '>') );
          identityItemTR.appendChild(identityEmailTD);

        identitiesList.appendChild(identityItemTR);

        this.debug(`run -- done adding idmIdentity -- id="${idmIdentity.id}" label="${idmIdentity.label}" email="${idmIdentity.email}"`);
      }
    }

    const defaultIdentityLabel = document.getElementById("defaultIdentityLabel");
    const defaultIdentityInfo  = document.getElementById("defaultIdentityInfo");
    if (defaultComposeToNameAndEmail) {
      defaultIdentityLabel.hidden     = false;
      defaultIdentityInfo.hidden      = false;
      defaultIdentityInfo.textContent = defaultComposeToNameAndEmail; 
    } else {
      defaultIdentityLabel.hidden     = true;
      defaultIdentityInfo.hidden      = true;
      defaultIdentityInfo.textContent = ""; 
    }

    const defaultBtn = document.getElementById("defaultButton");
    defaultBtn.setAttribute("data", "default");
    defaultBtn.addEventListener("click", (e) => this.identityButtonClicked(e));

    const cancelBtn = document.getElementById("cancelButton");
    cancelBtn.setAttribute("data", "cancel");
    cancelBtn.addEventListener("click", (e) => this.identityButtonClicked(e));

    this.debug("-- end");
  }



  async windowUnloading(e) {
    if (this.#DEBUG) this.debugAlways( "--- Window Unloading ---"
                                       + `\n- window.screenTop=${window.screenTop}`
                                       + `\n- window.screenLeft=${window.screenLeft}`
                                       + `\n- window.outerWidth=${window.outerWidth}`
                                       + `\n- window.outerHeight=${window.outerHeight}`
                                       + `\n- this.canceled=${this.canceled}`
                                     );
    await this.#idmOptionsApi.storeWindowBounds("identityChooserWindowBounds", window);

    if (this.#DEBUG) {
      let bounds = await this.#idmOptionsApi.getWindowBounds("identityChooserWindowBounds");

      if (! bounds) {
        this.debugAlways("--- WINDOW UNLOADING --- Retrieve Stored Window Bounds --- FAILED TO GET Identity Chooser Window Bounds ---");
      } else if (typeof bounds !== 'object') {
        this.debugAlways(`--- WINDOW UNLOADING --- Retrieve Stored Window Bounds --- identityChooserWindowBounds IS NOT AN OBJECT: typeof='${typeof bounds}' ---`);
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




  markErrorTD(element) {
    if (element) {
      const tdElement = element.closest('td');
      if (tdElement) {
        tdElement.setAttribute("error", "true");
      }
    }
  }

  unmarkErrorTD(element) {
    if (element) {
      const tdElement = element.closest('td');
      if (tdElement) {
        tdElement.removeAttribute("error");
      }
    }
  }

  markErrorSPAN(element) {
    if (element) {
      const spanElement = element.closest('span');
      if (spanElement) {
        spanElement.setAttribute("error", "true");
      }
    }
  }

  unmarkErrorSPAN(element) {
    if (element) {
      const spanElement = element.closest('span');
      if (spanElement) {
        spanElement.removeAttribute("error");
      }
    }
  }




  setupEventListeners() {
    const filterIdentitiesByLabelRegexText = document.getElementById("idmIdentityListFilterByLabelRegexText");
////filterIdentitiesByLabelRegexText.addEventListener( "keydown", (e) => this.filterIdentitiesByLabelRegexTextKeyPressed(e) ); // we're not operating on enter key -- yet
    filterIdentitiesByLabelRegexText.addEventListener( "input",   (e) => this.filterIdentitiesByLabelRegexTextChanged(e)    );

    const filterIdentitiesByLabelResetBtn = document.getElementById("idmIdentityListFilterByLabelResetButton");
    filterIdentitiesByLabelResetBtn.setAttribute("data", "reset-name-filter");
    filterIdentitiesByLabelResetBtn.addEventListener("click", (e) => this.filterIdentitiesByLabelResetButtonClicked(e));

    const filterIdentitiesByEmailRegexText = document.getElementById("idmIdentityListFilterByEmailRegexText");
////filterIdentitiesByEmailRegexText.addEventListener( "keydown", (e) => this.filterIdentitiesByEmailRegexTextKeyPressed(e) ); // we're not operating on enter key -- yet
    filterIdentitiesByEmailRegexText.addEventListener( "input",   (e) => this.filterIdentitiesByEmailRegexTextChanged(e)    );

    const filterIdentitiesByEmailResetBtn = document.getElementById("idmIdentityListFilterByEmailResetButton");
    filterIdentitiesByEmailResetBtn.setAttribute("data", "reset-email-filter");
    filterIdentitiesByEmailResetBtn.addEventListener("click", (e) => this.filterIdentitiesByEmailResetButtonClicked(e));

    const filterIdentitiesResetAllBtn = document.getElementById("idmIdentityListFilterResetAllButton");
    filterIdentitiesResetAllBtn.setAttribute("data", "reset-all-filters");
    filterIdentitiesResetAllBtn.addEventListener("click", (e) => this.filterIdentitiesResetAllButtonClicked(e));
  }



  async localizePage() {
    this.debug("-- start");

    for (const el of document.querySelectorAll("[data-l10n-id]")) {
      const id = el.getAttribute("data-l10n-id");
      const i18nMessage = browser.i18n.getMessage(id);
      if (i18nMessage == "") {
        i18nMessage = id;
      }
      el.textContent = i18nMessage;
    }

    for (const el of document.querySelectorAll("[data-html-l10n-id]")) {
      const id = el.getAttribute("data-html-l10n-id");
      const i18nMessage = getI18nMsg(id);
      if (i18nMessage == "") {
        i18nMessage = id;
      }
      el.insertAdjacentHTML('afterbegin', i18nMessage);
    }

    this.debug("-- end");
  }



  async applyTooltips(theDocument) { // we could move this to utilities.js
    this.debug("-- start");

    for (const el of theDocument.querySelectorAll("[tooltip-l10n-id]")) {
      const id = el.getAttribute("tooltip-l10n-id");
      const i18nMessage = getI18nMsg(id);
      el.setAttribute("title", i18nMessage);
    }

    this.debug("-- end");
  }



  async identityClicked(e) {
    if (e == null) return;

    this.debug('-- begin');

    if (e.target.tagName == "TR" || e.target.tagName == "TD") {
      this.debug('-- TR or TD Clicked');

      const selector       = 'tr.identity-item';
      const identityItemTR = e.target.closest(selector);

      if (! identityItemTR) {
        this.error(`-- IDENTITY ITEM TR NOT FOUND - selector="${selector}"`);

      } else {
        const identityId = identityItemTR.getAttribute("identityId");
        this.debug(`-- Identity Item TR Found -- identityId=${identityId}`);

        this.debug(`-- sending IdentityChooserResponse: "${identityId}"`);
        await messenger.runtime.sendMessage(
          { IdentityChooserResponse: identityId }
        );

        window.close();
      }

    } else {
      this.debug(`-- Identity Item TR or TD NOT FOUND !!!!!!!!!!!!!"`);
      // MABXXX Ummm... the window just sits there???
    }

    this.debug('-- end');
  }



  async identityButtonClicked(e) {
    if (e == null) return;

    this.debug(`-- tagNName=${e.target.tagName}`);

    let response;
    const btn = e.target.closest("button");
    if (! btn) {
      this.debug("-- DID NOT FIND OUR BUTTON");
    } else {
      response = btn.getAttribute("data")
    }

    if (! response) {
      this.debug(`-- NO BUTTON DATA!!!!!!!!!!!!!"`);
      // MABXXX Ummm... the window just sits there???

    } else {
      this.debug(`-- sending IdentityChooserResponse "${response}"`);
      await messenger.runtime.sendMessage(
        { IdentityChooserResponse: response }
      );

      window.close();
    }
  }



  async filterIdentitiesByLabelRegexTextKeyPressed(e) {
    if (e.key === 'Enter') { // we care only about the Enter key
    }
  }

  async filterIdentitiesByLabelRegexTextChanged(e) {
    const regexText = e.target.value;
    this.debug(`-- begin -- regexText="${regexText}"`);

    this.unmarkErrorSPAN(e.target);

    if (! regexText) {
      this.filterIdentitiesByLabelReset();

    } else if (this.filterByRegex) {
      let regex;
      try {
        regex = new RegExp(regexText, 'i');
      } catch (error) {
        // MABXXX REPORT THE ERROR
        this.debugAlways(`-- INVALID REGULAR EXPRESSION: regexText="${regexText}"`);
        this.markErrorSPAN(e.target);
      }

      if (regex) {
        const domIdentityTRs = document.querySelectorAll("tr.identity-item");
        for (const domIdentityTR of domIdentityTRs) {
          const domIdentityLabelTD = domIdentityTR.querySelector("td.identity-item-data.identity-item-label");
          if (domIdentityLabelTD) {
            const identityLabel = domIdentityLabelTD.textContent;
            if (regex.test(identityLabel)) {
              domIdentityTR.classList.remove("identity-filtered-by-label");
            } else {
              domIdentityTR.classList.add("identity-filtered-by-label");
            }
          }
        }
      }
    } else {
      const regexTextLC    = regexText.toLowerCase();
      const domIdentityTRs = document.querySelectorAll("tr.identity-item");
      for (const domIdentityTR of domIdentityTRs) {
        const domIdentityLabelTD = domIdentityTR.querySelector("td.identity-item-data.identity-item-label");
        if (domIdentityLabelTD) {
          const identityLabel = domIdentityLabelTD.textContent;
          if (identityLabel && identityLabel.toLowerCase().includes(regexTextLC)) {
            domIdentityTR.classList.remove("identity-filtered-by-label");
          } else {
            domIdentityTR.classList.add("identity-filtered-by-label");
          }
        }
      }
    }
  }

  async filterIdentitiesByLabelResetButtonClicked(e) {
    if (e == null) return;
    e.preventDefault();

    this.filterIdentitiesByLabelReset();
  }

  filterIdentitiesByLabelReset() {
    const filterIdentitiesByLabelRegexText = document.getElementById("idmIdentityListFilterByLabelRegexText");
    const domIdentityTRs                   = document.querySelectorAll("tr.identity-item");

    filterIdentitiesByLabelRegexText.value = '';

    for (const domIdentityTR of domIdentityTRs) {
      domIdentityTR.classList.remove("identity-filtered-by-label");
    }
  }



  async filterIdentitiesByEmailRegexTextKeyPressed(e) {
    if (e.key === 'Enter') { // we care only about the Enter key
    }
  }

  async filterIdentitiesByEmailRegexTextChanged(e) {
    const regexText = e.target.value;
    this.debug(`-- begin -- regexText="${regexText}"`);

    this.unmarkErrorSPAN(e.target);

    if (! regexText) {
      this.filterIdentitiesByEmailReset();

    } else if (this.filterByRegex) {
      let regex;
      try {
        regex = new RegExp(regexText, 'i');
      } catch (error) {
        // MABXXX REPORT THE ERROR
        this.debugAlways(`-- INVALID REGULAR EXPRESSION: regexText="${regexText}"`);
        this.markErrorSPAN(e.target);
      }

      if (regex) {
        const domIdentityTRs = document.querySelectorAll("tr.identity-item");
        for (const domIdentityTR of domIdentityTRs) {
          const identityEmail = domIdentityTR.getAttribute("identity-email"); // filter without the "<" and ">"

//        const domIdentityEmailTD = domIdentityTR.querySelector("td.identity-item-data.identity-item-email");
//        if (domIdentityEmailTD) {
//          const identityEmail = domIdentityEmailTD.textContent;
            if (regex.test(identityEmail)) {
              domIdentityTR.classList.remove("identity-filtered-by-email");
            } else {
              domIdentityTR.classList.add("identity-filtered-by-email");
            }
//        }
        }
      }
    } else {
      const regexTextLC    = regexText.toLowerCase();
      const domIdentityTRs = document.querySelectorAll("tr.identity-item");
      for (const domIdentityTR of domIdentityTRs) {
        const identityEmail = domIdentityTR.getAttribute("identity-email"); // filter without the "<" and ">"

//      const domIdentityEmailTD = domIdentityTR.querySelector("td.identity-item-data.identity-item-email");
//      if (domIdentityEmailTD) {
//        const identityEmail = domIdentityEmailTD.textContent;
          if (identityEmail && identityEmail.toLowerCase().includes(regexTextLC)) {
            domIdentityTR.classList.remove("identity-filtered-by-email");
          } else {
            domIdentityTR.classList.add("identity-filtered-by-email");
          }
//      }
      }
    }
  }

  async filterIdentitiesByEmailResetButtonClicked(e) {
    if (e == null) return;
    e.preventDefault();

    this.filterIdentitiesByEmailReset();
  }

  filterIdentitiesByEmailReset() {
    const filterIdentitiesByEmailRegexText = document.getElementById("idmIdentityListFilterByEmailRegexText");
    const domIdentityTRs                   = document.querySelectorAll("tr.identity-item");

    filterIdentitiesByEmailRegexText.value = '';

    for (const domIdentityTR of domIdentityTRs) {
      domIdentityTR.classList.remove("identity-filtered-by-email");
    }
  }



  async filterIdentitiesResetAllButtonClicked(e) {
    if (e == null) return;
    e.preventDefault();

    this.filterIdentitiesResetAll();
  }

  filterIdentitiesResetAll() {
    const filterIdentitiesByLabelRegexText = document.getElementById("idmIdentityListFilterByLabelRegexText");
    const filterIdentitiesByEmailRegexText = document.getElementById("idmIdentityListFilterByEmailRegexText");
    const domIdentityTRs                   = document.querySelectorAll("tr.identity-item");

    filterIdentitiesByLabelRegexText.value = '';
    filterIdentitiesByEmailRegexText.value = '';

    for (const domIdentityTR of domIdentityTRs) {
      domIdentityTR.classList.remove("identity-filtered-by-label");
      domIdentityTR.classList.remove("identity-filtered-by-email");
    }
  }
}



const identityChooser = new IdentityChooser();

document.addEventListener("DOMContentLoaded", (e) => identityChooser.run(e), {once: true});
