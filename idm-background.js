import { IdmOptions }    from './modules/options.js';
import { Logger }        from './modules/logger.js';
import { IdmIdentities } from './modules/identities.js';
import { getExtensionId, getExtensionName, getI18nMsg, formatMsToDateTime12HR } from './modules/utilities.js';

class IdentityManagerPlus {
  #CLASS_NAME       = this.constructor.name;

  #LOG              = false;
  #DEBUG            = false;
  #WARN             = false;

  #logger           = new Logger();
  #idmOptionsApi    = new IdmOptions(this.#logger);
  #idmIdentitiesApi = new IdmIdentities(this.#idmOptionsApi, this.#logger);

  #activeIdentityChooserWindows    = [];
  #composeWindowInitialIdentityIds = [];

  #toolsMenuItemId;



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
    // always log exceptions
    this.#logger.error( this.#CLASS_NAME,
                        msg,
                        "\n name:    " + e.name,
                        "\n message: " + e.message,
                        "\n stack:   " + e.stack,
                        ...info
                      );
  }



  async run() {
    let extName = getExtensionName("Identity Manager Plus");
    this.logAlways("run", `=== EXTENSION ${extName} STARTED ===`);


    var   defaultOptionsSetup = false;
    var   attempts            = 0;
    const MAX_ATTEMPTS        = 3;

    while (! defaultOptionsSetup && attempts < MAX_ATTEMPTS) {
      attempts++;
      try {
        await this.#idmOptionsApi.setupDefaultOptions();
        defaultOptionsSetup = true;
      } catch (error) {
        // Workaround. Several users report issues with accessing the
        // messenger.local store
        //
        //    20:30:33.873 TransactionInactiveError: A request was placed
        //    against a transaction which is currently not active, or which
        //    is finished. IndexedDB.jsm:101:46
        //
        // Assuming that this error is caused by a timing issue while
        // accessing the store concurrently, we simply try to circumvent this by
        // reloading

        if (attempts >= MAX_ATTEMPTS) {
          this.caught(error, `-- Caught error while reading settings from local storage. Attempt >= ${MAX_ATTEMPTS}. Giving up.`);
          return;
        }

        this.caught(error, `-- Caught error while reading settings from local storage. Attempt #${attempts} of ${MAX_ATTEMPTS}. Reloading extension.`);
      }
    }

    this.setupListeners();

    const showOptionsWindowOnStartupEnabled = await this.#idmOptionsApi.isEnabledShowOptionsWindowOnStartup();
    if (showOptionsWindowOnStartupEnabled) {
      await this.showOptionsWindow();
    }

    // MABXXX this should be a function...
    try {
      const browserInfo = await browser.runtime.getBrowserInfo();
      const version     = browserInfo.version;
      const versionInfo = version.split('.');
      const major       = Number(versionInfo[0]);
      if (! isNaN(major) && Number.isInteger(major) && major > 114) {
        this.#toolsMenuItemId = await messenger.menus.create(
          {
            'contexts': [ "tools_menu" ],
            'enabled':  true,
            'icons':    { 
                          "24": "/images/icons/people/3_people_blue_24x24.png",
                          "32": "/images/icons/people/3_people_blue_32x32.png",
                          "64": "/images/icons/people/3_people_blue_64x64.png",
                        },
            'id':       "idmShowIdentityChooser",
            'onclick':  (onClicked, tab) => this.composeMenuItemClicked(onClicked, tab),
            'title':    getI18nMsg("idmComposeWindow_menuItem_identityChooser", "Choose and Identity"),
            'type':     "normal",
            'visible':  false,
          }
        );
      }
    } catch (error) {
      this.caught(error, "-- Adding menu item \"idmShowIdentityChooser\" to menu context \"tools_menu\"");
    }
  }

  setupListeners() {
    messenger.tabs.onCreated.addListener(            async (tab)                 => this.tabCreated(tab)                              );
    messenger.tabs.onRemoved.addListener(            async (tabId, removeInfo)   => this.tabRemoved(tabId, removeInfo)                );

    messenger.compose.onIdentityChanged.addListener( async (tab, identityId)     => this.composeIdentityChanged(tab, identityId)      );
    messenger.compose.onBeforeSend.addListener(      async (tab, composeDetails) => this.beforeComposeSend(tab, composeDetails)       );
    messenger.compose.onAfterSend.addListener(       async (tab, sendInfo)       => this.afterComposeSend(tab, sendInfo)              );

    messenger.menus.onShown.addListener(             async (onShowData, tab)     => this.onMenuShown(onShowData, tab)                 );

    messenger.composeAction.onClicked.addListener(   async (tab, onClickData)    => this.composeActionButtonClicked(tab, onClickData) );
  }



  async showOptionsWindow() {
    let   popupLeft   =  100;
    let   popupTop    =  100;
    let   popupHeight =  900;
    let   popupWidth  = 1000;
    const mainWindow  = await messenger.windows.getCurrent();

    if (! mainWindow) {
      this.error("-- DID NOT GET THE CURRENT (MAIN, mail:3pane) WINDOW!!! ---");
    } else {
      this.debug( "-- Got the Current (Main, mail:3pane) Window:"
                  + `\n- mainWindow.top=${mainWindow.top}`
                  + `\n- mainWindow.left=${mainWindow.left}`
                  + `\n- mainWindow.height=${mainWindow.height}`
                  + `\n- mainWindow.width=${mainWindow.width}`
                );
      popupTop  = mainWindow.top  + 100;
      popupLeft = mainWindow.left + 100;
      if (mainWindow.height - 200 > popupHeight) popupHeight = mainWindow.Height - 200;   // make it higher, but not shorter
//////if (mainWindow.Width  - 200 > popupWidth)  popupWidth  = mainWindow.Width  - 200;   // make it wider,  but not narrower --- eh, don't need it wider
    }

    let bounds = await this.#idmOptionsApi.getWindowBounds("optionsWindowBounds");

    if (! bounds) {
      this.debug("-- no previous window bounds");
    } else if (typeof bounds !== 'object') {
      this.error(`-- PREVIOUS WINDOW BOUNDS "optionsWindowBounds" IS NOT AN OBJECT: typeof='${typeof bounds}' #####`);
    } else {
      this.debug( "-- restoring previous Options window bounds:"
                  + `\n- bounds.top=${bounds.top}`
                  + `\n- bounds.left=${bounds.left}`
                  + `\n- bounds.width=${bounds.width}`
                  + `\n- bounds.height=${bounds.height}`
                );
      popupTop    = bounds.top;
      popupLeft   = bounds.left;
      popupWidth  = bounds.width;
      popupHeight = bounds.height;
    }

    const optionsUrl = messenger.runtime.getURL("optionsUI/optionsUI.html") + "?popupWindowMode=true";
    let optionsWindow = await messenger.windows.create({
      url:                 optionsUrl,
      type:                "popup",
      titlePreface:        getI18nMsg("options_identityManagerPlusOptionsTitle", "Options") + " - ",
      top:                 popupTop,
      left:                popupLeft,
      height:              popupHeight,
      width:               popupWidth,
      allowScriptsToClose: true,
    });

    this.debug(`-- OptionsUI Popup Window Created -- windowId="${optionsWindow.id}" URL="${optionsUrl}"`);
  }



  async tabCreated(tab) { // this a Tab, NOT a MailTab
    if (tab.type != 'messageCompose') return;

    const composeDetails = await messenger.compose.getComposeDetails(tab.id);

    if (this.#DEBUG) {
      this.debugAlways( "-- Compose Window --"
                        + `\n- tabId="${tab.id}"`
                        + `\n- windowId="${tab.windowId}"`
                        + `\n- composeDetails.type="${composeDetails.type}"`
                        + `\n- composeDetails.identityId="${composeDetails.identityId}"`
                        + `\n- enabledComposeMessage=${await this.#idmOptionsApi.isEnabledComposeMessage()}`
                        + `\n- enabledReplyMessage=${await this.#idmOptionsApi.isEnabledReplyMessage()}`
                        + `\n- enabledForwardMessage=${await this.#idmOptionsApi.isEnabledForwardMessage()}`
                        + `\n- enabledDraftMessage=${await this.#idmOptionsApi.isEnabledDraftMessage()}`
                        + `\n- collectFromAddresses=${await this.#idmOptionsApi.isEnabledCollectFromAddresses()}`
                      );
    }

    // MABXXX Why is initial compose window details set to isModified=true???
    //
    // This makes it so that, no matter whether the user has changed anything,
    // they have to say if they really want to close or not. I HATE THAT!!!
    //
    // MABXXX Maybe this should be yet another option???
    //
    composeDetails['isModified'] = false;
    await messenger.compose.setComposeDetails(tab.id, composeDetails);

    switch (composeDetails.type) {
      case "new":
        const isEnabledComposeMessage = await this.#idmOptionsApi.isEnabledComposeMessage();
        if (! isEnabledComposeMessage) return;
        break;

      case "reply":
        const isEnabledReplyMessage = await this.#idmOptionsApi.isEnabledReplyMessage();
        if (! isEnabledReplyMessage) return;
        break;

      case "forward":
        const isEnabledForwardMessage = await this.#idmOptionsApi.isEnabledForwardMessage();
        if (! isEnabledForwardMessage) return;
        break;

      case "draft":
        const isEnabledDraftMessage = await this.#idmOptionsApi.isEnabledDraftMessage();
        if (! isEnabledDraftMessage) return;
        break;

      default:
        return;
    }

    const initialIdentityId = composeDetails.identityId;
    if (! initialIdentityId) {
      this.debug("-- Compose Window -- NO IDENTITY ID");

    } else {
      // Store the Identity ID from when the Compose Window first opens so afterComposeSend()
      // can get the Account ID from it so it can have it to create New Identities.
      //
      // I can find no other way the Thunderbird Web Extension APIs can give us an Account ID.
      this.debug(`-- Compose Window -- initialIdentityId ["${tab.id}"] --> "${initialIdentityId}"`);

      const composeWindowIdentityIdInfo = {
        'tabId':      tab.id,
        'windowId':   tab.windowId,
        'identityId': initialIdentityId
      };
      this.debug( "-- Compose Window -- this.#composeWindowInitialIdentityIds -->"
                  + `\n- tabId="${composeWindowIdentityIdInfo.tabId}"`
                  + `\n- windowId="${composeWindowIdentityIdInfo.windowId}"`
                  + `\n- identityId="${composeWindowIdentityIdInfo.identityId}"`
                );
      this.#composeWindowInitialIdentityIds.push(composeWindowIdentityIdInfo);
    }

    await this.showIdentityChooser(tab);
  }



  async composeActionButtonClicked(tab, onClickData) {
    this.debug(`-- tab.id="${tab.id}" tab.windowId="${tab.windowId}" onClickData.button="${onClickData.button}" onClickData.modifiers:`, onClickData.modifiers);

    await this.showIdentityChooser(tab);
  }



  async composeMenuItemClicked(onClicked, tab) {
    this.debug( `\n---Menu Item Clicked:`,
                `\n- tab.id="${tab.id}"`,
                `\n- tab.windowId="${tab.windowId}"`,
                `\n- onClicked.menuItemId="${onClicked.menuItemId}"`,
                `\n- onClicked.button="${onClicked.button}"`,
                `\n- onClicked.modifiers:`, onClicked.modifiers,
              );

    if (onClicked.menuItemId === this.#toolsMenuItemId) {
      await this.showIdentityChooser(tab);
    }
  }



  // show "Choose Identity" ONLY on the Compose Window
  // hide it otherwise
  async onMenuShown(onShowData, tab) {
    const visible = (tab.type === 'messageCompose');
    this.debug(`-- Setting showIdentityChooser menuItem visible=${visible}`);
    messenger.menus.update(this.#toolsMenuItemId, { 'visible': visible } );
    messenger.menus.refresh();
  }



  async showIdentityChooser(tab) {
    const composeWindow     = await messenger.windows.get(tab.windowId);
    const composeDetails    = await messenger.compose.getComposeDetails(tab.id);
    const initialIdentityId = this.#composeWindowInitialIdentityIds.find(e => e.tabId == tab.id)?.identityId;
    var   popupLeft         = composeWindow.left   + 100;
    var   popupTop          = composeWindow.top    + 100;
    var   popupHeight       = composeWindow.height - 200;
    var   popupWidth        = composeWindow.width  - 200;
    const bounds            = await this.#idmOptionsApi.getWindowBounds("identityChooserWindowBounds");

    if (! bounds) {
      this.debug("-- no previous window bounds");
    } else if (typeof bounds !== 'object') {
      this.error(`-- PREVIOUS WINDOW BOUNDS "identityChooserWindowBounds" IS NOT AN OBJECT: typeof='${typeof bounds}' #####`);
    } else {
      this.debug( "-- restoring previous Identity Chooser window bounds:"
                  + `\n- bounds.top=${bounds.top}`
                  + `\n- bounds.left=${bounds.left}`
                  + `\n- bounds.width=${bounds.width}`
                  + `\n- bounds.height=${bounds.height}`
                );
      popupTop    = bounds.top;
      popupLeft   = bounds.left;
      popupWidth  = bounds.width;
      popupHeight = bounds.height;
    }

    const identityChooserUrl = messenger.runtime.getURL("identityChooser/identityChooser.html") + "?defaultIdentityId=" + composeDetails.identityId;
    const identityChooserWindow = await messenger.windows.create(
      {
        url:                 identityChooserUrl,
        type:                "popup",
        titlePreface:        getI18nMsg("identitiesPopup_identitiesPopupTitle", "Identity Chooser") + " - ",  // MABXXX preface to the title in the actual HTML???? 
        height:              popupHeight,
        width:               popupWidth,
        left:                popupLeft,
        top:                 popupTop,
        allowScriptsToClose: true,
      }
    );
    this.debug(`-- IdentityChooser Popup Window Created -- windowId="${identityChooserWindow.id}" URL="${identityChooserUrl}"`);

    const idFocusListener   = async (windowId) => this.identityChooserWindowFocusChanged( windowId, identityChooserWindow.id );
    const idRemovedListener = async (windowId) => this.identityChooserWindowRemoved(      windowId, identityChooserWindow.id );

    const activeIdentityChooserWindow = {
      identityChooserWindowId: identityChooserWindow.id,
      composeWindowId:         tab.windowId,
      removedListener:         idRemovedListener,
      focusListener:           idFocusListener,
    };
    this.#activeIdentityChooserWindows.push(activeIdentityChooserWindow);

    messenger.windows.onFocusChanged.addListener( activeIdentityChooserWindow.focusListener   );
    messenger.windows.onRemoved.addListener(      activeIdentityChooserWindow.removedListener );

    const chosenIdentityId   = await this.identityChooserPrompt(identityChooserWindow.id, null);  // chosenIdentityId is null if the user simply closed the IdentityChooser Window 
    const keepComposeOnClose = await this.#idmOptionsApi.isEnabledKeepComposeOnClose();
    this.debug(`-- Chosen Identity="${chosenIdentityId}" keepComposeOnClose=${keepComposeOnClose}`);

    if ( (chosenIdentityId == null && keepComposeOnClose)  // if the user simply closed the IdentityChooser Window and we're supposed to keep the Compose Window
         || chosenIdentityId == "default"                  // OR if they clicked the "default" button
       )
    {
      if (chosenIdentityId === "default") {
        this.debug(`-- Removing IdentityChooser Window id=${identityChooserWindow.id}`);
        messenger.windows.remove(identityChooserWindow.id);
      }

    } else if ( (chosenIdentityId == null && ! keepComposeOnClose)  // if the user simply closed the IdentityChooser Window and we're NOT supposed to keep the Compose Window
                || chosenIdentityId == "cancel")                    // OR if they clicked the "cancel" button
    {
//    if (chosenIdentityId === "cancel") {
        this.debug(`-- Removing Compose Window id=${composeWindow.id}`);
        messenger.windows.remove(composeWindow.id); // close the compose window ***without asking if you want to save***
//    }

    } else if (chosenIdentityId != null && chosenIdentityId != initialIdentityId) {
      this.debug(`-- Setting Identity "${chosenIdentityId}" on Compose Window id=${composeWindow.id} tabId=${tab.id}`);
      await messenger.compose.setComposeDetails( tab.id,
                                                 { 'identityId': chosenIdentityId,
                                                   'isModified': false
                                                 }
                                               );
    }
  }



  async tabRemoved(tabId) {
    this.debug(`-- tabId="${tabId}"`);

    //let tab = await messenger.tabs.get(tabId); // Why not pass a Tab, instead of just a tabId???  WE CAN'T GET THE TAB.  IT'S BEEN REMOVED. THAT'S WHY!!!
    //this.debugAlways(`-- tab.type="${tab.type}"`);
    //if (tab.type != 'messageCompose') return;

    const initialIdentityId = this.#composeWindowInitialIdentityIds.find(e => e.tabId == tabId)?.identityId;
    this.debug(`-- tabId="${tabId}" initialIdentityId="${initialIdentityId}"`);

    if (initialIdentityId) {
      // A Compose Window Tab has been removed, otherwise it would not be in this.#composeWindowInitialIdentityIds
      const idx = this.#composeWindowInitialIdentityIds.findIndex(e => e.tabId == tabId);
      this.#composeWindowInitialIdentityIds.splice(idx, 1);
    }
  }



  // MABXXX Just for learning now...
  async composeIdentityChanged(tab, identityId) {
    this.debug( "--"
                + `\n- tab.id="${tab.id}"`
                + `\n- tab.windowId="${tab.windowId}"`
                + `\n- tab.type="${tab.type}"`
                + `\n- identityId="${identityId}"`
              );
  }




  // MABXXX Just for learning now...
  async beforeComposeSend(tab, composeDetails) {
    this.debug( "-- "
                + `\n- tab.id="${tab.id}"`
                + `\n- tab.windowId="${tab.windowId}"`
                + `\n- tab.type="${tab.type}"`
                + `\n- composeDetails.identityId="${composeDetails.identityId}"`
                + `\n- composeDetails.from="${composeDetails.from}"` // this is a ComposeRecipient: String or { id, type } where type is 'contact' or 'mailingList'
              );

    // some other listener (like a spell-checker) could cancel!!!

    // can return cancel:true to cancel or cancel:false to not cancel
    // or can return ComposeDetails to update the Compose Window
    return { cancel: false };
  }



  // if user enabled it, check if the "From:" data email address(es) is/are a match for an existing Identity,
  // and if not, create a new Identity with the email address and name From the "From:" data
  async afterComposeSend(tab, sendInfo) {
    let collectFromAddresses = await this.#idmOptionsApi.isEnabledCollectFromAddresses();
    this.debug(`-- tab.id="${tab.id}" collectFromAddresses="${collectFromAddresses}"`);

////// I was hoping to get the Identity ID from the Compose Details,
////// but the Tab passed in has an INVALID TAB ID!!!
////// THEN WHAT'S THE POINT OF PASSING A Tab INTO THIS LISTENER???
////let composeDetails = await messenger.compose.getComposeDetails(tab.id);
////if (! composeDetails) {
//////this.debugAlways("-- @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@ NO Compose Details @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@");
////} else {
////  let identityId = composeDetails.identityId;
//////this.debugAlways(`-- @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@ composeDetails.identityId="${identityId}" @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@`);
////}

    if (this.#DEBUG) this.debugAlways( "-- "
                                       + `\n- collectFromAddresses="${collectFromAddresses}"`
                                       + `\n- tab.id="${tab.id}"`
                                       + `\n- tab.windowId="${tab.windowId}"`
                                       + `\n- tab.type="${tab.type}"`
                                       + `\n- sendInfo.mode="${sendInfo.mode}"`
                                       + `\n- sendInfo.error="${sendInfo.error}"`
                                       + `\n- sendInfo.headerMessageId="${sendInfo.headerMessageId}"` // The header messageId of outgoing message. Only included for actually sent messages. 
                                     );

    // if (sendInfo.error || ! sendInfo.headerMessageId) then the message did not actually get sent
    if (sendInfo.error || ! sendInfo.headerMessageId) {
      this.error(`-- EMAIL MESSAGE SEND FAILED: sendInfo.error="${sendInfo.error}"`);

    } else if (! collectFromAddresses) {
      this.debug("-- NOT COLLECTING FROM ADDRESSES");

    } else {

      // We have to wait until AFTER the email is ACTUALLY sent in order to really know the FROM address.
      //
      // With beforeSend, they can keep changing it, like when they cancel sending after spell check,
      // so we could keep recording something wrong or useless.
      //
      // AND, unfortunely, the only time we can get an Identity ID - and from that, an Account ID -
      // is when the (Message Compose) Tab is first created.  The Tab passed into this Listener is
      // useless because the Tab ID cannot be used to call getComposeDetails to get an Identity ID.
      //
      // MABXXX WE COULD TRY GETTING THE ACCOUNT FROM THE CURRENT FOLDER/TAB/MAILTAB/WHATEVER

      const initialIdentityId = this.#composeWindowInitialIdentityIds.find(e => e.tabId == tab.id)?.identityId;

      this.debug(`-- initialIdentityId="${initialIdentityId}"`);
      this.debug("-- COLLECTING FROM ADDRESS(ES) -- Looking for Message Headers");

      let msgHeaders = sendInfo.messages;
      if (! msgHeaders) {
        this.error(`-- Collecting Identity - NO MessageHeaders - sendInfo.headerMessageId="${sendInfo.headerMessageId}"`);
      } else {
        this.debug(`-- msgHeaders.length=${msgHeaders.length}  -- Looking for "From" addresses`);

        for (let msgHdr of msgHeaders) {
          this.debug( "--"
                      + `\n- msgHdr.id="${msgHdr.id}"`
                      + `\n- msgHdr.headerMessageId"=${msgHdr.headerMessageId}"`
                      + `\n- msgHdr.author"=${msgHdr.author}"`
                    );

          if (! msgHdr.author) {
            this.error(`-- Collecting Identity - NO Author - msgHdr.headerMessageId="${msgHdr.headerMessageId}"`);

          } else {
            this.debug(`-- msgHdr.author="${msgHdr.author}" - need to parse it...`);

            let parsedMailboxes = await messenger.messengerUtilities.parseMailboxString(msgHdr.author);  // Promise of an array of messenger.messengerUtilities.ParsedMailbox
            if (! parsedMailboxes) {
              this.error(`-- Collecting Identity - Author has NO ParsedMailboxes - msgHdr.author="${msgHdr.author}"`);

            } else {
              this.debug(`-- parsedMailboxes.length=${parsedMailboxes.length}`);

              for (let parsedMailbox of parsedMailboxes) {
                this.debug( "-- "
                            + `\n- parsedMailbox.email="${parsedMailbox.email}"`
                            + `\n- parsedMailbox.name="${parsedMailbox.name}"`
                            + `\n- parsedMailbox.group.length="${(parsedMailbox.group ? parsedMailbox.group.length : 'NONE')}"` // NOT DEALING WITH GROUP!!!!
                          );

                if (! parsedMailbox.email) {
                  this.debug(`-- Collecting Identity - Author - Either email is missing - msgHdr.author="${msgHdr.author}"`);

                } else if (await this.#idmIdentitiesApi.findByEmail(parsedMailbox.email) != null) {
                  this.debug(`-- Identity with email "${parsedMailbox.email}" already exists`);

                } else {
                  let account;
                  this.debug(`-- tabId="${tab.id}" - "FROM" Compose Window initialIdentityId="${initialIdentityId}"`);

                  if (! initialIdentityId) {
                    this.debug("--  Compose Window Initial Identity ID NOT FOUND --");
                  } else {
                    let identity = await messenger.identities.get(initialIdentityId);
                    if (! identity) {
                      this.debug(`-- Compose Window Initial Identity NOT FOUND -- id="${initialIdentityId}"`);
                    } else {
                      this.debug( "-- Compose Window Initial Identity found --"
                                  + `\n- identity.id="${identity.id}"`
                                  + `\n- identity.name="${identity.name}"`
                                  + `\n- identity.email="${identity.email}"`
                                  + `\n- identity.accountId="${identity.accountId}"`
                                );

                      account = await messenger.accounts.get(identity.accountId, false); // includeSubFolders = false
                      if (! account) {
                        this.debug( "-- Compose Window Initial Identity Account NOT found --"
                                    + `\n- identity.id="${identity.id}"`
                                    + `\n- identity.name="${identity.name}"`
                                    + `\n- identity.email="${identity.email}"`
                                    + `\n- identity.accountId="${identity.accountId}"`
                                );
                        } else {
                        this.debug( "-- Compose Window Initial Identity Account found --"
                                    + `\n- account.id="${account.id}"`
                                    + `\n- account.name="${account.name}"`
                                    + `\n- account.type="${account.type}"`
                                  );
                      }
                    }
                  }

                  // If we could not get an Identity or it's Account from when the Compose Window Tab first opened...
                  if (! account) {
                    this.debug("-- Using Default Account");
                    account = await messenger.accounts.getDefault(false); // includeSubFolders = false
                    this.debug( "-- Using Default Account --"
                                + `\n- account.id="${account.id}"`
                                + `\n- account.name="${account.name}"`
                                + `\n- account.type="${account.type}"`
                              );
                  }

                  var identityEmail = parsedMailbox.email;
                  var identityName  = parsedMailbox.name;
                  var identityLabel = "";
                  if (! identityName) {
                    identityName = parsedMailbox.email.split('@')[0];
                    this.debug(`-- identityName EXTRACTED FROM parseMailbox.email: identityName="${identityName}"`);
                  } else {
                    this.debug(`-- Parsing (identityLabel) from parsedMailbox.name="${parsedMailbox.name}"`);
                    const regex = /^([^(]*)\((.*)\)(.*)$/;
                    const matches = regex.exec(identityName);
                    if (! matches) {
                      this.debug(`-- No (label) found in parsedMailbox.name="${parsedMailbox.name}"`);
                    } else {
                      // matches[0] is this full parsedMailbox.name
                      // matches[1] is this part before first '('                                 - this will be the identityName
                      // matches[2] is this part after first '(' up to but not including last ')' - this will be the identityLabel
                      // matches[3] is this part after last ')'                                   - we append it to the identityName
                      identityName  = matches[1];
                      identityLabel = matches[2];
                      if (matches[3]) identityName += matches[3];
                    }
                  }
                  this.debug(`-- identityName="${identityName}" identityLabel="${identityLabel}" `);

                  // all we can do is email and name??? Otherwise we would have to STOP and ASK THE USER
                  let identityDetails = {
////////////////////accountId:            XX,                     // This key MUST **NOT** be present when creating a new Identity
//                  composeHtml:          ??,
                    email:                identityEmail,
////////////////////id,                   XX,                     // This key MUST **NOT** be present when creating a new Identity
                    label:                identityLabel,
                    name:                 identityName
//                  organization:         ??,
//                  replyTo:              ??,
//                  signature:            ??,
//                  signatureIsPlainText: ??,
                  };

                  let newIdentity;
                  try {
                    newIdentity = await this.#idmIdentitiesApi.createIdmIdentity(account.id, identityDetails, {"collected": true}); // identityExtendedProps 
                  } catch (error) {
                    this.caught( error,
                                 "-- Error Creating New Identity"
                                 + `\n- account.id="${account.id}"`
                                 + `\n- account.name="${account.name}"`
                                 + `\n- identityDetails.email="${identityDetails.email}"`
                                 + `\n- identityDetails.name="${identityDetails.name}"`
                                 + `\n- identityDetails.label="${identityDetails.label}"`
                                 + "\n",
                               );
                  }

                  if (! newIdentity) {
                    this.error( "-- No Identity Created"
                                + `\n- account.id="${account.id}"`
                                + `\n- account.name="${account.name}"`
                                + `\n- identityDetails.email="${identityDetails.email}"`
                                + `\n- identityDetails.name="${identityDetails.name}"`
                                + `\n- identityDetails.label="${identityDetails.label}"`
                              );
                  } else {
                    this.logAlways( "-- Collecting From Addresses - New Identity Created:"
                                    + `\n- accountId="${newIdentity.accountId}"`
                                    + `\n- id="${newIdentity.id}"`
                                    + `\n- email="${newIdentity.email}"`
                                    + `\n- name="${newIdentity.name}"`
                                    + `\n- label="${newIdentity.label}"`
                                  );
                    await this.#idmOptionsApi.recordCollectedIdentityId(newIdentity.id);

                    this.debug("-- SENDING IdentityCollected MESSAGE");
                    try {
                      // send message so that the OptionsUI can update its Display Order List if it wants to
                      await messenger.runtime.sendMessage(
                        { 'IdentityCollected': { 'id':        newIdentity.id,
                                                 'accountId': newIdentity.accountId,
                                                 'email':     newIdentity.email,
                                                 'name':      newIdentity.name,
                                                 'label':     newIdentity.label
                                               }
                        }
                      ); 
                    } catch (error) {
                      this.caught(error, "Failed to send 'IdentityCollected' message");
                    }

                    const collectedIdentityAlertEnabled = await this.#idmOptionsApi.isEnabledCollectFromAddressAlert();
                    if (collectedIdentityAlertEnabled) {
                      // MABXXX ALERT THE USER
                      // MABXXX ALERT THE USER
                      // MABXXX ALERT THE USER
                      // MABXXX ALERT THE USER
                      // MABXXX ALERT THE USER
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }



  async identityChooserWindowRemoved(windowId, identityChooserWindowId) {
    const identityChooserWindowInfo = this.#activeIdentityChooserWindows.find(e => e.identityChooserWindowId == identityChooserWindowId);
    const composeWindowId           = identityChooserWindowInfo.composeWindowId;

    if (windowId == identityChooserWindowId) {
      // identity window closed
      try {
        messenger.windows.onFocusChanged.removeListener( identityChooserWindowInfo.focusListener   );
      } catch (error) {
        this.caught(error, "-- removing onFocus listener");
      }

      try {
        messenger.windows.onRemoved.removeListener(      identityChooserWindowInfo.removedListener );
      } catch (error) {
        this.caught(error, "-- removing onWindowRemoved listener");
      }

      let idx = this.#activeIdentityChooserWindows.findIndex(e => e.identityChooserWindowId == identityChooserWindowId);
      this.#activeIdentityChooserWindows.splice(idx, 1);
    }

    if (windowId == composeWindowId) {
      // composer window closed
      messenger.windows.remove(identityChooserWindowId);
    }
  }



  async identityChooserWindowFocusChanged(windowId, identityChooserWindowId) {
    const identityChooserWindowInfo = this.#activeIdentityChooserWindows.find(e => e.identityChooserWindowId == identityChooserWindowId);
    const composeWindowId           = identityChooserWindowInfo.composeWindowId;

    if (windowId == composeWindowId) {
      messenger.windows.update(identityChooserWindowId, { focused: true });
    }
  }



  async identityChooserPrompt(identityChooserWindowId, defaultResponse) {
    try {
      await messenger.windows.get(identityChooserWindowId);
    } catch (e) {
      // Window does not exist, assume closed.
      return defaultResponse;
    }

    return new Promise(resolve => {
      let response = defaultResponse;

      function windowRemoveListener(closedWindowId) {
        if (identityChooserWindowId == closedWindowId) {
          messenger.windows.onRemoved.removeListener(windowRemoveListener);
          messenger.runtime.onMessage.removeListener(messageListener);
          resolve(response);
        }
      }

      /* The IdentityChooser sends a message as IdentityChooserResponse...
       * - the Identity ID if the user clicked on an Identity
       * - "default" if the user clicked the "default" button
       * - "cancel" if the user clicked the "cancel" button
       * Save this IdentityChooserResponse into response
       */
      function messageListener(request, sender, sendResponse) {
        if (sender.tab && sender.tab.windowId == identityChooserWindowId && request && request.hasOwnProperty("IdentityChooserResponse")) {
          response = request.IdentityChooserResponse;
        }
        return false; // we're not sending any response
      }

      messenger.runtime.onMessage.addListener(messageListener);
      messenger.windows.onRemoved.addListener(windowRemoveListener);
    });
  }
}



messenger.runtime.onInstalled.addListener(async ({ reason, previousVersion }) => onInstalled(reason, previousVersion));

async function onInstalled(reason, previousVersion) {
  const extId   = getExtensionId("");
  const extName = getExtensionName("Identity Manager Plus");

  const options = new IdmOptions();
  const isSkipOnboarding = await options.isEnabledSkipOnboarding(); // this call just goes to the local storage to get this option, no logging needed

  if (reason === "update") {
    console.log(`${extId} === EXTENSION ${extName} UPDATED ===`); 
  } else if (reason === "install") {
    console.log(`${extId} === EXTENSION ${extName} INSTALLED ===`); 
  } else { // last option is "browser_update"
    console.log(`${extId} === EXTENSION ${extName} INSTALLED (browser update) ===`); 
  }

  if (! isSkipOnboarding) {
    if (reason === "update" /* && previousVersion?.startsWith("3.") */) {
      messenger.tabs.create({ url: "/onboarding/onboarding.html" });
      messenger.tabs.create({ url: "/onboarding/changes.html" });
    } else if (reason === "install") {
      messenger.tabs.create({ url: "/onboarding/onboarding.html" });
    }
  }
}



messenger.runtime.onStartup.addListener(async () => {
  const extId   = getExtensionId("");
  const extName = getExtensionName("Identity Manager Plus");
  console.log(`${extId} === EXTENSION ${extName} STARTED ===`); 
});



messenger.runtime.onSuspend.addListener(async () => {
  const extId   = getExtensionId("");
  const extName = getExtensionName("Identity Manager Plus");
  console.log(`${extId} === EXTENSION ${extName} SUSPENDED ===`); 
});



// self-executing async "main" function
(async () => {
  const identityManagerPlus = new IdentityManagerPlus();
  identityManagerPlus.run();
})()
