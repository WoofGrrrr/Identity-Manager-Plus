import { parseDomain, ParseResultType } from "./parse-domain/build/main.js";

export class IdmIdentities {
  #CLASS_NAME = this.constructor.name;

  #LOG        = false;
  #DEBUG      = false;

  #logger;
  #idmOptionsApi;



  constructor(idmOptionsApi, logger) {
    this.#idmOptionsApi = idmOptionsApi;
    this.#logger        = logger;

    this.boundFunction1 = this.getIdmIdentity.bind(this);    // this makes sure "getIdmIdentity" can use "this"
    this.boundFunction2 = this.createIdmIdentity.bind(this); // this makes sure "createIdmIdentity" can use "this"
  }



  log(...info) {
    if (this.#LOG) {
      if (this.#logger) {
        this.#logger.log(this.#CLASS_NAME, ...info); // this adds the extension ID and Caller Info
    } else {
        console.log(this.#CLASS_NAME, ...info);
      }
    }
  }

  debug(...info) {
    if (this.#DEBUG) {
      if (this.#logger) {
        this.#logger.debug(this.#CLASS_NAME, ...info); // this adds the extension ID and Caller Info
      } else {
        console.debug(this.#CLASS_NAME, ...info);
      }
    }
  }

  debugAlways(...info) {
    if (this.#logger) {
      this.#logger.debugAlways(this.#CLASS_NAME, ...info); // this adds the extension ID and Caller Info
    } else {
      console.debug(this.#CLASS_NAME, ...info);
    }
  }

  error(...info) {
    if (this.#logger) {
      this.#logger.error(this.#CLASS_NAME, ...info); // this adds the extension ID and Caller Info
    } else {
      console.error(this.#CLASS_NAME, ...info);
    }
  }

  caught(e, msg, ...info) {
    // always log exceptions
    if (this.#logger) {
      this.#logger.error( this.#CLASS_NAME,
                          msg,
                          "\n- name:    " + e.name,
                          "\n- message: " + e.message,
                          "\n- stack:   " + e.stack
                        );
    } else {
      console.error( this.#CLASS_NAME,
                     msg,
                     "\n- name:    " + e.name,
                     "\n- message: " + e.message,
                     "\n- stack:   " + e.stack,
                     ...info
                   );
    }
  }



  /* This returns an array of messenger.identities.MailIdentity
   *
   *      "id":                    string  id,
   *      "accountId":             string  accountId
   *      "email":                 string  email,
   *      "name":                  string  name,
   *      "label":                 string  label
   *      "replyTo":               string  replyTo,
   *      "composeHtml":           boolean composeHtml,
   *      "organizaition":         string  organizaition,
   *      "signatureIsPlainText":  boolean signatureIsPlainText,
   *      "signature":             string  signature
   */
  async getMailIdentities() {
    this.debug("getMailIdentities -- begin");

    var mailAccounts   = await browser.accounts.list(false); // includeSubFolders=false: do not get sub-folders
    var mailIdentities = [];

    for (const mailAccount of mailAccounts) {
      this.debug(`getMailIdentities -- mailAccount.id="${mailAccount.id}" mailAccount.name="${mailAccount.name}"`);

      for (const mailIdentity of mailAccount.identities) {
        mailIdentities.push(mailIdentity);

        if (this.#DEBUG) this.debugAlways( "getMailIdentities --" // don't build all this just to be denied by this.#DEBUG in this.debug()
                                           + `\n- id="${mailIdentity.id}"`
                                           + `\n- accountId="${mailIdentity.accountId}"`
                                           + `\n- email="${mailIdentity.email}"`
                                           + `\n- name="${mailIdentity.name}"`
                                           + `\n- label="${mailIdentity.label}"`
                                           + '\n--'
                                         );
      }
    }
    this.debug(`getMailIdentities -- mailIdentities.length=${mailIdentities.length}`);

    this.debug("getMailIdentities -- end");
    return mailIdentities;
  }



  /* This returns an array of IdmIdentitiy - NOT JUST messenger.identities.MailIdentity -- in the correct order and with additional data:
   *
   *      "id":                    string  MailIdentity.id,
   *      "label":                 string  this.toIdentityLabel(MailIdentity),  // <----------------------------------- NOTE: different from MailIdentity -------------<<<<<
   *      "name":                  string  MailIdentity.name,
   *      "email":                 string  MailIdentity.email,
   *      "replyTo":               string  MailIdentity.replyTo,
   *      "composeHtml":           boolean MailIdentity.composeHtml,
   *      "organizaition":         string  MailIdentity.organizaition,
   *      "signatureIsPlainText":  boolean MailIdentity.signatureIsPlainText,
   *      "signature":             string  MailIdentity.signature,
   *      "idLabel":               string  MailIdentity.label,                  // <----------------------------------- NOTE: from MailIdentity -------------<<<<<
   *      "emailDomain":           string  this.toEmailDomain(MailIdentity),
   *      "emailHost":             string  this.toEmailHost(MailIdentity),
   *      "showInMenu":            boolean showInMenu,
   *      "lockInMenu":            boolean lockInMenu,
   *      "positionInMenu":        number  positionInMenu,
   *      "collected":             boolean collected,
   *      "imported":              boolean imported,
   *      "accountDefault":        boolean (defaultIdentityIds[MailAccount.id] === MailIdentity.id),
   *      "accountId":             string  MailIdentity.accountId
   *      "accountName":           string  MailAccount.name,
   *      "identity":              messenger.identities.MailIdentity, // MABXXX is this reference to the messenger.identities.MailIdentity useful???  MABXXX STORAGE EXPENSIVE!!!
   */
  async getIdmIdentities() {
    this.debug("getIdmIdentities -- begin");
    var identitiesProps    = await this.getUpdatedExtendedIdentitiesProps(); // sometimes a cleanup is necessary, like after a DELETE, etc
    var accounts           = await browser.accounts.list(false);             // includeSubFolders=false: do not get sub-folders
    var nextPositionInMenu = Object.entries(identitiesProps).length;         // for placing stray identities at the BOTTOM (it happens) - should not happen, but does
    var defaultIdentityIds = await this.getAccountDefaultIdentityIds();      // need to keep getting these as they can change over time
    var idmIdentities      = [];

    for (const account of accounts) { // MABXXX ABILITY TO SEPARATE BY ACCOUNT???
      for (const identity of account.identities) {
        var props          = identitiesProps[identity.id];
        var showInMenu     = (!props || typeof props.showInMenu     !== 'boolean') ? true                 : props.showInMenu;     // MABXXX Doesn't update ExtendedProps!!!
        var lockInMenu     = (!props || typeof props.lockInMenu     !== 'boolean') ? false                : props.lockInMenu;     // MABXXX Doesn't update ExtendedProps!!!
        var collected      = (!props || typeof props.collected      !== 'boolean') ? false                : props.collected;      // MABXXX Doesn't update ExtendedProps!!!
        var imported       = (!props || typeof props.imported       !== 'boolean') ? false                : props.imported;       // MABXXX Doesn't update ExtendedProps!!!
        var positionInMenu = (!props || typeof props.positionInMenu !== 'number' ) ? nextPositionInMenu++ : props.positionInMenu; // MABXXX Doesn't update ExtendedProps!!!

        var idmIdentity = {
          "id":                   identity.id,
          "label":                this.toIdentityLabel(identity),
          "name":                 identity.name,
          "email":                identity.email,
          "replyTo":              identity.replyTo,
          "composeHtml":          identity.composeHtml,
          "organization":         identity.organization,
          "signatureIsPlainText": identity.signatureIsPlainText,
          "signature":            identity.signature,
          "idLabel":              identity.label,
          "emailDomain":          this.toEmailDomain(identity),
          "emailHost":            this.toEmailHost(identity),
          "showInMenu":           showInMenu,
          "lockInMenu":           lockInMenu,
          "positionInMenu":       positionInMenu,
          "collected":            collected,
          "imported":             imported,
          "accountDefault":       (defaultIdentityIds[account.id] === identity.id),
          "accountId":            account.id,
          "accountName":          account.name,
          "identity":             identity, // MABXXX is this reference to the messenger.identities.MailIdentity useful???  MABXXX STORAGE MAY BE EXPENSIVE!!!
        };

        // inserting at index props.positionInMenu may create
        // non-continious indices. We'll filter these empty indexes
        // after this for loop.
        idmIdentities[positionInMenu] = idmIdentity;

        if (this.#DEBUG) this.debugAlways( "getIdmIdentities --" // don't build all this just to be denied by this.#DEBUG in this.debug()
                                           + `\n- id ............... "${idmIdentity.id}"`
                                           + `\n- accountId ........ "${idmIdentity.accountId}"`
                                           + `\n- accountName ...... "${idmIdentity.accountName}"`
                                           + `\n- accountDefault ... ${idmIdentity.accountDefault}`
                                           + `\n- label ............ "${idmIdentity.label}"`
                                           + `\n- name ............. "${idmIdentity.name}"`
                                           + `\n- email ............ "${idmIdentity.email}"`
                                           + `\n- domain ........... "${idmIdentity.emailDomain}"`
                                           + `\n- host ............. "${idmIdentity.emailHost}"`
                                           + `\n- showInMenu ....... ${idmIdentity.showInMenu}`
                                           + `\n- lockInMenu ....... ${idmIdentity.lockInMenu}`
                                           + `\n- collected ........ ${idmIdentity.collected}`
                                           + `\n- imported ......... ${idmIdentity.imported}`
                                           + `\n- positionInMenu ... ${idmIdentity.positionInMenu}`
                                           + '\n--'
                                         );
      }
    }

    idmIdentities = idmIdentities.filter(function (el) {
      return el != null;
    });

    this.debug("getIdmIdentities -- end");

    return idmIdentities;
  }



  async getAccountDefaultIdentityId(accountId) {
    let account = await browser.accounts.get(accountId, false); // includeSubFolders=false: do not get sub-folders

    if (! account) {
      this.error("getAccountDefaultIdentityId -- ACCOUNT NOT FOUND:" + ` - accountId="${accountId}"`);
    } else {
      let defaultIdentity = await messenger.identities.getDefault(account.id);
      if (! defaultIdentity) {
        this.error( "getAccountDefaultIdentityId -- NO DEFAULT IDENTITY FOR ACCOUNT:"
                    + `\n- id="${account.id}"`
                    + `\n- name="${account.name}"`
                    + `\n- type="${account.type}"`
                  );
      } else {
        if (this.#DEBUG) this.debugAlways( "getAccountDefaultIdentityId -- DEFAULT IDENTITY FOR ACCOUNT:"
                                           + `\n- account.id="${account.id}"`
                                           + `\n- account.name="${account.name}"`
                                           + `\n- defaultIdentity.id="${defaultIdentity.id}"`
                                           + `\n- defaultIdentity.name="${defaultIdentity.name}"`
                                           + `\n- defaultIdentity.email="${defaultIdentity.email}"`
                                         );
        return defaultIdentity.id;
      }
    }
  }



  async getAccountDefaultIdentityIds() {
    let accounts = await browser.accounts.list(false); // includeSubFolders=false: do not get sub-folders

    let defaultIdentityIds = [];

    for (const account of accounts) {
      if (account.type === 'none') {
        // just skip it
        //
      } else {
        let defaultIdentity = await messenger.identities.getDefault(account.id);

        if (! defaultIdentity) {
          this.error( "getAccountDefaultIdentityIds -- NO DEFAULT IDENTITY FOR ACCOUNT:"
                      + `\n- id="${account.id}"`
                      + `\n- name="${account.name}"`
                      + `\n- type="${account.type}"`
                    );
        } else {
          if (this.#DEBUG) this.debugAlways( "getAccountDefaultIdentityIds -- DEFAULT IDENTITY FOR ACCOUNT:"
                                             + `\n- account.id="${account.id}"`
                                             + `\n- account.name="${account.name}"`
                                             + `\n- defaultIdentity.id="${defaultIdentity.id}"`
                                             + `\n- defaultIdentity.name="${defaultIdentity.name}"`
                                             + `\n- defaultIdentity.email="${defaultIdentity.email}"`
                                           );
          defaultIdentityIds[account.id] = defaultIdentity.id;
          this.debug(`getAccountDefaultIdentityIds -- DEFAULT IDENTITY: defaultIdentityIds["${account.id}"]="${defaultIdentityIds[account.id]}" `);
        }
      }
    }

    return  defaultIdentityIds;
  }



  /* Get the messenger.identities.MailIdentity iwht the given identityID, create an IdIdentity from it, and return it.
   *
   *      "id":                    string identity.id,
   *      "label":                 string this.toIdentityLabel(identity),  // <----------------------------------- NOTE: different from MailIdentity -------------<<<<<
   *      "name":                  string identity.name,
   *      "email":                 string identity.email,
   *      "replyTo":               string identity.replyTo,
   *      "composeHtml":           boolean identity.composeHtml,
   *      "organizaition":         string identity.organizaition,
   *      "signatureIsPlainText":  boolean identity.signatureIsPlainText,
   *      "signature":             string identity.signature,
   *      "idLabel":               string identity.label,                  // <----------------------------------- NOTE: different from MailIdentity -------------<<<<<
   *      "emailDomain":           string this.toEmailDomain(identity),
   *      "emailHost":             string this.toEmailHost(identity),
   *      "showInMenu":            boolean showInMenu,
   *      "lockInMenu":            boolean lockInMenu,
   *      "positionInMenu":        number positionInMenu,
   *      "collected":             boolean collected,
   *      "imported":              boolean imported,
   *      "accountDefault":        boolean (defaultIdentityIds[account.id] === identity.id),
   *      "accountId":             string account.id,
   *      "accountName":           string account.name,
   *      "identity":              messenger.identities.MailIdentity, // MABXXX is this reference to the messenger.identities.MailIdentity useful???  MABXXX STORAGE EXPENSIVE!!!
   */
  async getIdmIdentity(identityId) {
    let identity = await messenger.identities.get(identityId);

    if (! identity) {
      this.error(`getIdmIdentity -- FAILED TO GET IDENTITY: identityId="${identityId}"`);

    } else {
//////let identitiesProps = await this.getUpdatedExtendedIdentitiesProps(); // sometimes a cleanup is necessary, like after a DELETE, etc
      let identitiesProps    = await this.#idmOptionsApi.getIdentitiesExtendedProps();
      let nextPositionInMenu = Object.entries(identitiesProps).length; // for placing stray (or new) identities at the BOTTOM (it happens)
      let props              = identitiesProps[identity.id];
      let defaultIdentityId  = await this.getAccountDefaultIdentityId(identity.accountId); // need to keep getting this as it can change over time
      let showInMenu         = (!props || typeof props.showInMenu     !== 'boolean') ? true               : props.showInMenu;     // MABXXX Doesn't update ExtendedProps!!!
      let lockInMenu         = (!props || typeof props.lockInMenu     !== 'boolean') ? false              : props.lockInMenu;     // MABXXX Doesn't update ExtendedProps!!!
      let collected          = (!props || typeof props.collected      !== 'boolean') ? false              : props.collected;      // MABXXX Doesn't update ExtendedProps!!!
      let imported           = (!props || typeof props.imported       !== 'boolean') ? false              : props.imported;       // MABXXX Doesn't update ExtendedProps!!!
      let positionInMenu     = (!props || typeof props.positionInMenu !== 'number' ) ? nextPositionInMenu : props.positionInMenu; // MABXXX Doesn't update ExtendedProps!!!

      this.debug(`getIdmIdentity - identityId="${identityId}" defaultIdentityId="${defaultIdentityId}"`);

      let account     = await messenger.accounts.get(identity.accountId);
      let accountName = account ? account.name : '';

      let idmIdentity = {
        "id":                   identity.id,
        "label":                this.toIdentityLabel(identity),
        "name":                 identity.name,
        "email":                identity.email,
        "replyTo":              identity.replyTo,
        "composeHtml":          identity.composeHtml,
        "organization":         identity.organization,
        "signatureIsPlainText": identity.signatureIsPlainText,
        "signature":            identity.signature,
        "idLabel":              identity.label,
        "emailDomain":          this.toEmailDomain(identity),
        "emailHost":            this.toEmailHost(identity),
        "showInMenu":           showInMenu,
        "lockInMenu":           lockInMenu,
        "positionInMenu":       positionInMenu,
        "collected":            collected,
        "imported":             imported,
        "accountDefault":       (defaultIdentityId === identity.id),
        "accountId":            identity.accountId,
        "accountName":          accountName,                 
        "identity":             identity,                     // MABXXX is this reference to the messenger.identities.MailIdentity useful???  MABXXX STORAGE MAY BE EXPENSIVE!!!
      };

      return idmIdentity;
    }
  }



  toIdentityLabel(mailIdentity) {
    let name    = mailIdentity.name;
    let email   = mailIdentity.email;
    let idlabel = mailIdentity.label;

    let label;
    if (name != '') {
//    label = `${name} <${email}>`;
      label = name;
    } else {
//    label = email;
    }
    if (idlabel != '') {
      label = label + " (" + idlabel + ")";
    }

    return label;
  }

  toEmailDomain(mailIdentity) {
    const email = mailIdentity.email;
    let emailDomain = '';

    if (email) {
      let parts = email.split('@');
      if (! parts) {
      } else if (parts.length < 2) {
      } else {
        emailDomain = parts[1];
      }
    }

    return emailDomain;
  }

  toEmailHost(mailIdentity) {
    const email = mailIdentity.email;
    let emailHost = '';

    if (email) {
      let parts = email.split('@');
      if (! parts) {
      } else if (parts.length < 2) {
      } else {
        const parseResult = parseDomain(parts[1]);
        // Check if the domain is listed in the public suffix list
        if (parseResult.type === ParseResultType.Listed) {
          const { subDomains, domain, topLevelDomains } = parseResult;
          emailHost = `${domain}.${topLevelDomains.join('.')}`;
        } else {
          // other parseResult types...
          this.log(`toEmailHost ######################## unexpected parseResult.type=${parseResult.type}`);
        }
      }
    }

    return emailHost;
  }



  /* Create a new Identity with the given details*, regardless of whether an Identity with
   * the same email already exists (Thunderbird Identity Manager allows this as well) and
   * place it at the very bottom of the Display Order.
   *
   * (* "details" defined by messenger.identities.MailIdentity BUT must NOT have accountId or id)
   *
   * Unlike with sortIdentities, moveIdentitiesToTop, and moveIdentitiesToBottom, existing
   * Identities with lockInMenu that are already at the bottom of the Display Order do not
   * affect this bottom position (FOR NOW.)  The new Identity is placed at the very bottom
   * of the Display Order regardless.  Ah, the semantics of lockInMenu...
   *
   * identityExtendedProps:
   * - can be either boolean, object, null, or undefined
   * - if null or undefined: showInMenu=true, lockInMenu=false, collected=false, imported=false
   * - if boolean, true indicates the identity is collected and showInMenu=true, lockInMenu=false, imported=false
   * - if object, ONLY showInMenu, lockInMenu, collected, and imported are used.
   */
  async createIdmIdentity(accountId, identityDetails, identityExtendedProps) { // identityDetails must NOT have accountId or id
    this.debug( "createIdmIdentity --"
                + `\n- accountId="${accountId}"`
                + `\n- identityDetails.email="${identityDetails.email}"`
                + `\n- identityDetails.name="${identityDetails.name}"`
                + `\n- identityExtendedProps=${identityExtendedProps}`
              );

    let isCollected = false;
    let isImported  = false;
    if (typeof identityExtendedProps === 'boolean') {
      isCollected = identityExtendedProps;
      identityExtendedProps = {
        "showInMenu": true,
        "lockInMenu": false,
        "collected":  isCollected,
        "imported":   false
      }
    } else if (identityExtendedProps == null || typeof identityExtendedProps === 'undefined') { // typeof null == 'object'
      identityExtendedProps = {
        "showInMenu": true,
        "lockInMenu": false,
        "collected":  false,
        "imported":   false
      }
    } else if (typeof identityExtendedProps === 'object') { // typeof null == "object"
      identityExtendedProps.showInMenu = (typeof identityExtendedProps.showInMenu === 'boolean')? identityExtendedProps.showInMenu : true;
      identityExtendedProps.lockInMenu = (typeof identityExtendedProps.lockInMenu === 'boolean')? identityExtendedProps.lockInMenu : false;
      identityExtendedProps.collected  = (typeof identityExtendedProps.collected  === 'boolean')? identityExtendedProps.collected  : false;
      identityExtendedProps.imported   = (typeof identityExtendedProps.imported   === 'boolean')? identityExtendedProps.imported   : false;

      isCollected = identityExtendedProps.collected;
      isImported  = identityExtendedProps.imported;
    } else {
      this.error("createIdmIdentity -- extnededIdentityProps must be 'boolean' or 'object'");
      return;
    }

    let newIdentity;
    try {
      // MABXXX Should we make sure it does NOT already exist???
      newIdentity = await messenger.identities.create(accountId, identityDetails); // identityDetails must NOT have accountId or id
    } catch (error) {
      this.error( "createIdmIdentity -- CREATE IDENTITY FAILED:"
                  + `\n- identityDetails.accountId="${identityDetails.accountId}"`
                  + `\n- identityDetails.composeHtml=${identityDetails.composeHtml}`
                  + `\n- identityDetails.email="${identityDetails.email}"`
                  + `\n- identityDetails.id="${identityDetails.id}"`
                  + `\n- identityDetails.label="${identityDetails.label}"`
                  + `\n- identityDetails.name="${identityDetails.name}"`
                  + `\n- identityDetails.organization="${identityDetails.organization}"`
                  + `\n- identityDetails.replyTo="${identityDetails.replyTo}"`
                  + `\n- identityDetails.signature="${identityDetails.signature}"`
                  + `\n- identityDetails.signatureisPlainText=${identityDetails.signatureisPlainText}`
                  + "\n",
                  error.name,
                  error.message,
                  error.stack
                );
      this.error( "createIdmIdentity -- identityDetails key/value pairs:");
      Object.entries(identityDetails).forEach(([key, value]) => {
        console.error(`${key}: '${typeof value}' - ${value}`);
      });

      return;
    }

    if (newIdentity) {
      this.debug( "createIdmIdentity -- Identity Created:"
                  + `\n- newIdentity.id="${newIdentity.id}"`
                  + `\n- newIdentity.email="${newIdentity.email}"`
                  + `\n- newIdentity.name="${newIdentity.name}"`
                  + `\n- isCollected=${isCollected}`
                  + `\n- isImported=${isImported}`
                );

      const identitiesProps    = await this.#idmOptionsApi.getIdentitiesExtendedProps();
      const nextPositionInMenu = Object.entries(identitiesProps).length;
      const newProps = { // cleanse the props that were passed in
        "showInMenu":     identityExtendedProps.showInMenu,
        "lockInMenu":     identityExtendedProps.lockInMenu,
        "positionInMenu": nextPositionInMenu,
        "collected":      identityExtendedProps.collected,
        "imported":       identityExtendedProps.imported
      };
      identitiesProps[newIdentity.id] = newProps;
      this.#idmOptionsApi.storeIdentitiesExtendedProps(identitiesProps);

      let newIdmIdentity = await this.getIdmIdentity(newIdentity.id); // this may alter the identity's Extended Props, e.g. positionInMenu

      if (isCollected) {
        await this.#idmOptionsApi.recordCollectedIdentityId(newIdentity.id);
      }

      return newIdmIdentity;
    }

    this.error( "createIdmIdentity -- No New Identity Returned:"
                + `\n- identityDetails.email="${identityDetails.email}"`
                + `\n- identityDetails.name="${identityDetails.name}"`
              );
  }



  /* Update the Identity with the given details*, regardless of whether an Identity with
   * the same email already exists (Thunderbird Identity Manager allows this as well)
   *
   * (* "details" defined by messenger.identities.MailIdentity BUT must NOT have accountId or id)
   *
   * updateIdentityExtendedProps: ONLY showInMenu, lockInMenu, collected, and imported are used.
   */
  // MABXXX Would it be easier to just pass in an IdmIdentity and then create the identityDetails and updateIdentityExtendedProps from that?
  async updateIdmIdentity(identityId, identityDetails, updateIdentityExtendedProps) { // identityDetails must NOT have id (or accountId ???)
    if (this.#DEBUG) this.debugAlways( "updateIdmIdentity --"
                                       + `\n- identityId="${identityId}"`
                                       + `\n- identityDetails.email="${identityDetails.email}"`
                                       + `\n- identityDetails.name="${identityDetails.name}"`
                                       + `\n- updateIdentityExtendedProps.showInMenu=${updateIdentityExtendedProps.showInMenu}`
                                       + `\n- updateIdentityExtendedProps.lockInMenu=${updateIdentityExtendedProps.lockInMenu}`
                                       + `\n- updateIdentityExtendedProps.collected=${updateIdentityExtendedProps.collected}`
                                       + `\n- updateIdentityExtendedProps.imported=${updateIdentityExtendedProps.imported}`
                                     );

    let updatedIdentity;
    try {
      // MABXXX Should we make sure it DOES already exist???
      updatedIdentity = await messenger.identities.update(identityId, identityDetails); // identityDetails must NOT have id (or accountId ???)
    } catch (error) {
      this.error( "updateIdmIdentity -- UPDATE IDENTITY FAILED:"
                  + `\n- identityDetails.email="${identityDetails.email}"\n`,
                  error.name,
                  error.message,
                  error.stack
                );
      return;
    }

    if (updatedIdentity) {
      this.debug( "updateIdmIdentity -- Identity Updated:"
                  + `\n- updatedIdentity.id="${updatedIdentity.id}"`
                  + `\n- updatedIdentity.email="${updatedIdentity.email}"`
                  + `\n- updatedIdentity.name="${updatedIdentity.name}"`
                );

      let identitiesProps = await this.#idmOptionsApi.getIdentitiesExtendedProps();
      let oldProps = identitiesProps[identityId];
      if (! oldProps) oldProps = {};
      oldProps.showInMenu = updateIdentityExtendedProps.showInMenu;
      oldProps.lockInMenu = updateIdentityExtendedProps.lockInMenu;
      oldProps.collected  = updateIdentityExtendedProps.collected;
      oldProps.imported   = updateIdentityExtendedProps.imported;
      identitiesProps[identityId] = oldProps;
      await this.#idmOptionsApi.storeIdentitiesExtendedProps(identitiesProps);
      await this.#idmOptionsApi.removeCollectedIdentityId(updatedIdentity.id);

      let updatedIdmIdentity = await this.getIdmIdentity(identityId); // this may alter the identity's Extended Props

      return updatedIdmIdentity;
    }

    this.error( "updateIdmIdentity -- No Updated Identity Returned:"
                + `\n- identityId="${identityId}"`
                + `\n- identityDetails.email="${identityDetails.email}"`
                + `\n- identityDetails.name="${identityDetails.name}"`
              );
  }




  /* Delete the Identity with the given ID.
   *
   * We leave it up to other functions to update the positionInMenu values for
   * any moves this might cause.
   */
  async deleteIdentity(identityId) {
    this.debug(`deleteIdentity -- identityId="${identityId}"`);

    try {
      let identity = await messenger.identities.get(identityId);

      if (! identity) {
        this.debug(`deleteIdentity -- IDENTITY NOT FOUND: identityId="${identityId}"`);

      } else {
        this.debug(`deleteIdentity -- Deleting Identity: identityId="${identityId}" identity.name="${identity.name}" identity.email="${identity.email}"`);
        messenger.identities.delete(identityId);
        this.debug(`deleteIdentity -- Identity deleted: identityId="${identityId}" identity.name="${identity.name}" identity.email="${identity.email}"`);

        let identitiesProps = await this.#idmOptionsApi.getIdentitiesExtendedProps();
        delete identitiesProps[identityId];
        await this.#idmOptionsApi.storeIdentitiesExtendedProps(identitiesProps);

        this.debug("deleteIdentity -- RETURNING true");
        return true;
      }
    } catch (error) {
      this.error( "deleteIdentity -- DELETE IDENTITY FAILED:"
                  + `\n- identityId="${identityId}"\n`,
                  error.name,
                  error.message,
                  error.stack
                );
    }

    this.debug("deleteIdentity -- RETURNING false");
    return false;
  }



  /* Sort Identities using the currently set sorting options.
   *
   * Get all Identities from Thunderbird, create an array of Objects
   * that represent them, sort the array, then get the IdentitiesExtendedProps
   * from local storage, update the positionInMenu values to reflect the new
   * sort order -- RESPECTING lockInMenu SETTINGS -- and finally store the 
   * updated IdentitiesExtendedProps back in local storage
   *
   * NOTE: Identities that are at the BOTTOM of the Display Order that have
   * lockInMenu will *STAY* at the BOTTOM.  This is technically a "move",
   * but I prefer these semantics. A delete can be a move as well, no?
   *
   * Perhaps createIdmIdentity() should work this way as well.
   */
  async sortIdentities() {
    this.debug("sortIdentities -- begin");

    var sortByName     = await this.#idmOptionsApi.isAutoSortByName();
    var sortByEmail    = await this.#idmOptionsApi.isAutoSortByEmail();
    var sortByDomain   = await this.#idmOptionsApi.isAutoSortByDomain();
    var sortByHost     = await this.#idmOptionsApi.isAutoSortByHost();
    var sortAscending  = await this.#idmOptionsApi.isAutoSortDirectionAscending();
    var sortDescending = await this.#idmOptionsApi.isAutoSortDirectionDescending();

    // precedence sanity check: sortByName > sortByEmail > sortByDomain > sortByHost
    sortByHost   = sortByHost   && !sortByDomain && !sortByEmail && !sortByName;   // sortByHost only if nothing else is enabled
    sortByDomain = sortByDomain && !sortByEmail  && ! sortByName;
    sortByEmail  = sortByEmail  && ! sortByName;
    sortByName   = sortByName || (!sortByDomain && !sortByEmail && !sortByName); // sortByName if nothing else is enabled

    // precedence sanity check: sortAscending > sortDescending
    sortDescending = sortDescending && !sortAscending; // sortDescending only if sortAscending is not enabled
    sortAscending  = sortAscending || !sortDescending; // default to sortAscending if sortDescending not enabled

    var compareMultiplier = sortDescending ? -1 : +1;
    var sortDirText       = sortDescending ? "Descending" : "Ascending";

    if (sortByHost) {
      this.debug("sortIdentities -- Sort By Host ", sortDirText);
    } else if (sortByDomain) {
      this.debug("sortIdentities -- Sort By Domain ", sortDirText);
    } else if (sortByEmail) {
      this.debug("sortIdentities -- Sort By Email ", sortDirText);
//  } else if (sortByName) { // default to byName
    } else {
        this.debug("sortIdentities -- Sort By Name ", sortDirText);
    }

    var idmIdentities = [];
    var accounts      = await browser.accounts.list(false); // includeSubFolders=false: do not get sub-folders
    for (const account of accounts) { // MABXXX ABILITY TO SEPARATE BY ACCOUNT???
      for (const identity of account.identities) {
        // we need only the fields on which we can sort
        idmIdentities.push({
          "id":          identity.id,                                                                  // <------------------ just for the debug below
//        "label":       this.toIdentityLabel(identity),
          "name":        identity.name,
          "email":       identity.email,
//        "idLabel":     identity.label,
          "emailDomain": this.toEmailDomain(identity),
          "emailHost":   this.toEmailHost(identity)
        });
      }
    }

    idmIdentities.sort((a, b) => compare(a, b));

    var identitiesProps = await this.#idmOptionsApi.getIdentitiesExtendedProps();

    // get lockInMenu positions for lookup below
    var positionsLockedByIdentityId = [];
    for (var [identityId, props] of Object.entries(identitiesProps)) {
      var lockInMenu = (typeof props.lockInMenu !== 'boolean') ? false : props.lockInMenu;
      if (lockInMenu) {
        var positionInMenu = (typeof props.positionInMenu !== 'number' ) ? -1 : props.positionInMenu;

        if (positionInMenu == -1) {
          this.debug(`sortIdentities -- INVALID PROPS POSITION IN MENU identityId="${identityId}" positionInMenu=${props.positionInMenu}`);
        } else {
          this.debug(`sortIdentities -- LOCKED IN MENU identityId="${identityId}" positionInMenu=${positionInMenu}`);
          positionsLockedByIdentityId[positionInMenu] = identityId;
        }
      }
    }

    var nextPositionInMenu = 0;
    for (const idmIdentity of idmIdentities) {
      var identityId        = idmIdentity.id;
      var props             = identitiesProps[identityId];
      var showInMenu        = (!props || typeof props.showInMenu     !== 'boolean') ? true  : props.showInMenu;
      var lockInMenu        = (!props || typeof props.lockInMenu     !== 'boolean') ? false : props.lockInMenu;
      var collected         = (!props || typeof props.collected      !== 'boolean') ? false : props.collected;
      var imported          = (!props || typeof props.imported       !== 'boolean') ? false : props.imported;
      var oldPositionInMenu = (!props || typeof props.positionInMenu !== 'number' ) ? -1    : props.positionInMenu;

      if (this.#DEBUG) this.debugAlways( "sortIdentities --"
                                         + `\n- identityId="${identityId}"`                             // <------------------ the debug I mentioned above
                                         + `\n- showInMenu=${showInMenu}`
                                         + `\n- lockInMenu=${lockInMenu}`
                                         + `\n- collected=${collected}`
                                         + `\n- imported=${imported}`
                                         + `\n- oldPositionInMenu=${oldPositionInMenu}`
                                         + `\n- nextPositionInMenu=${nextPositionInMenu}`
                                         + `\n- lockInMenuPosition=${positionsLockedByIdentityId[nextPositionInMenu]}`
                                       );

      var newPositionInMenu;
      if (lockInMenu && oldPositionInMenu != -1) {
        this.debug(`sortIdentities -- LOCKED IN MENU - NOT MOVING identityId="${identityId}" oldPositionInMenu=${oldPositionInMenu}`);
        newPositionInMenu = oldPositionInMenu; /* or nextPositionInMenu? */

      } else {
        // skip identities locked in position until an unlocked one is found
        var identityIdLockedHere = positionsLockedByIdentityId[nextPositionInMenu]; // identityId locked in this position
        while (identityIdLockedHere && identityIdLockedHere !== identityId) { // some identityId is LOCKED in this position, and it's not us...
          this.debug(`sortIdentities -- SKIPPING POSITION TAKEN BY LOCKED identityId="${identityIdLockedHere}" positionInMenu=${nextPositionInMenu}`);
          nextPositionInMenu++;
          identityIdLockedHere = positionsLockedByIdentityId[nextPositionInMenu]; // identityId locked in this position
        }

        newPositionInMenu = nextPositionInMenu++;
        this.debug( "sortIdentities -- MOVING"
                    + ` identityId="${identityId}"`
                    + ` ${oldPositionInMenu}-->${newPositionInMenu}`
                  );

        identitiesProps[identityId] = {
          "showInMenu":     showInMenu,
          "lockInMenu":     lockInMenu,
          "collected":      collected,
          "imported":       imported,
          "positionInMenu": newPositionInMenu
        };
      }

      if (this.#DEBUG) this.debugAlways( 'sortIdentities --' // don't build all this just to be denied by this.#DEBUG inside this.debug()
                                         + `\n- id="${identityId}"`
                                         + `\n- name="${idmIdentity.name}"`
                                         + `\n- email="${idmIdentity.email}"`
                                         + `\n- positionInMenu=${newPositionInMenu}`
                                         + `\n- props.showInMenu=${identitiesProps[identityId].showInMenu}`
                                         + `\n- props.lockInMenu=${identitiesProps[identityId].lockInMenu}`
                                         + `\n- props.collected=${identitiesProps[identityId].collected}`
                                         + `\n- props.imported=${identitiesProps[identityId].imported}`
                                         + `\n- props.positionInMenu=${identitiesProps[identityId].positionInMenu}`
                                       );
    }

    await this.#idmOptionsApi.storeIdentitiesExtendedProps(identitiesProps);

    this.debug("sortIdentities -- end");



    function compare(a, b) { // return negative if a before b, positive if a after b, 0 if equal
      if (!a && !b) {
        return 0;
      } else if (!a) {
        return sortAscending? -1 : +1;
      } else if (!b) {
        return sortAscending? +1 : -1;
      }


      if (sortByEmail) {
        const emailA = a.email ? a.email.toLowerCase() : '';
        const emailB = b.email ? b.email.toLowerCase() : '';

        if (!emailA && !emailB) return 0;
        if (!emailA) return sortAscending? -1 : +1;
        if (!emailB) return sortAscending? +1 : -1;

        return emailA.localeCompare(emailB) * compareMultiplier;
      }
      if (sortByHost) {
        const hostA = a.host ? a.host.toLowerCase() : '';
        const hostB = b.host ? b.host.toLowerCase() : '';

        if (!hostA && !hostB) return 0;
        if (!hostA) return sortAscending? -1 : +1;
        if (!hostB) return sortAscending? +1 : -1;

        return hostA.localeCompare(hostB) * compareMultiplier;
      } 
      if (sortByDomain) {
        const domainA = a.domain ? a.domain.toLowerCase() : '';
        const domainB = b.domain ? b.domain.toLowerCase() : '';

        if (!domainA && !domainB) return 0;
        if (!domainA) return sortAscending? -1 : +1;
        if (!domainB) return sortAscending? +1 : -1;

        return domainA.localeCompare(domainB) * compareMultiplier;
      } 
//    if (sortByName) { // default to byName
        const nameA = a.name ? a.name.toLowerCase() : '';
        const nameB = b.name ? b.name.toLowerCase() : '';

        if (!nameA && !nameB) return 0;
        if (!nameA) return sortAscending? -1 : +1;
        if (!nameB) return sortAscending? +1 : -1;

        return nameA.localeCompare(nameB) * compareMultiplier;
//    }

    }
  }



  /* Update ExtendedIdentitiesProps -- correcting lockInMenu, showInMenu, collected, imported, and positionInMenu - and return them
   * (sometimes a cleanup is necessary, like after a DELETE, etc)
   *
   * - Get the IdentitiesExtendedProps from local storage
   * - Build an array of the props with lockInMenu indexed by positionInMenu
   * - Build an array of the all props indexed by positionInMenu
   * - if given an array of Identity Ids and a (mover) function:
   * -   - call that function to Alter that all-props array by moving the identities with the given IDs to the correct position
   * - Loop through that array, updating the props, but respecting lockInMenu positions
   * - Store the updated IdentitiesExtendedProps back in local storage
   */
  async getUpdatedExtendedIdentitiesProps(identityIdsToMove, identityMover) {
    this.debug(`getUpdatedExtendedIdentitiesProps -- begin -- (typeof identityIdsToMove)="${typeof identityIdsToMove}" (typeof identityMover)="${typeof identityMover}" `);

    var identitiesProps = await this.#idmOptionsApi.getIdentitiesExtendedProps();

    // Build an array of the props with lockInMenu indexed by positionInMenu
    var positionsLockedByIdentityId = [];
    for (var [identityId, props] of Object.entries(identitiesProps)) {
      var lockInMenu = (typeof props.lockInMenu !== 'boolean') ? false : props.lockInMenu;
      if (lockInMenu) {
        var positionInMenu = (typeof props.positionInMenu !== 'number' ) ? -1 : props.positionInMenu;

        if (positionInMenu == -1) {
          this.debug(`getUpdatedExtendedIdentitiesProps -- CANNOT LOCK INVALID PROPS POSITION IN MENU identityId="${identityId}" positionInMenu=${props.positionInMenu}`);
        } else {
          this.debug(`getUpdatedExtendedIdentitiesProps -- LOCKED IN MENU identityId="${identityId}" positionInMenu=${positionInMenu}`);
          positionsLockedByIdentityId[positionInMenu] = identityId;
        }
      }
    }

    // Build an array of the all props indexed by positionInMenu
    var identityPropsByPosition = [];
    var nextPositionInMenu = Object.entries(identitiesProps).length; // for placing stray identities at the BOTTOM (it happens)
    for (var [identityId, props] of Object.entries(identitiesProps)) {
      this.debug(`getUpdatedExtendedIdentitiesProps -- BY POSITION  "${identityId}" ${props.positionInMenu} showInMenu=${props.showInMenu} lockInMenu=${props.lockInMenu}`);
      var positionInMenu = (typeof props.positionInMenu !== 'number' ) ? nextPositionInMenu++ : props.positionInMenu;

      props.identityId = identityId; // <================================ add this extra bit for the work below, no need to obtain it again
      identityPropsByPosition[positionInMenu] = props;
    }



    // call the given "MOVER" function to alter identityPropsByPosition
    if (    identityIdsToMove
         && identityMover
         && typeof identityIdsToMove === 'object'
         && Array.isArray(identityIdsToMove)
         && identityIdsToMove.length > 0
         && typeof identityMover === 'function'
       )
    {
      // make is so identityMover has our "this"
      const x = identityMover.bind(this); // Hey, JavaScript!  WTF???
      this.debug("getUpdatedExtendedIdentitiesProps -- calling identityMover");
      x(identitiesProps, identityPropsByPosition, identityIdsToMove);
      this.debug("getUpdatedExtendedIdentitiesProps -- returned from identityMover");
    }



    // filter out gaps
    identityPropsByPosition = identityPropsByPosition.filter(function (el) {
      return (typeof el != 'undefined') && el != null;
    });



    // Loop through that array, updating the props, but respecting lockInMenu positions
    nextPositionInMenu = 0;
    var newPositionInMenu = 0;
    for (var props of identityPropsByPosition) {
      var identityId        = props.identityId; // See? Told you it was helpful!!!
      var showInMenu        = (typeof props.showInMenu               !== 'boolean') ? true  : props.showInMenu;
      var lockInMenu        = (typeof props.lockInMenu               !== 'boolean') ? false : props.lockInMenu;
      var collected         = (typeof props.collected                !== 'boolean') ? false : props.collected;
      var imported          = (typeof props.imported                 !== 'boolean') ? false : props.imported;
      var oldPositionInMenu = (!props || typeof props.positionInMenu !== 'number' ) ? -1    : props.positionInMenu;

      if (lockInMenu && oldPositionInMenu != -1) {
        this.debug(`getUpdatedExtendedIdentitiesProps -- LOCKED IN MENU - NOT MOVING identityId="${identityId}" oldPositionInMenu=${oldPositionInMenu}`);
        newPositionInMenu = oldPositionInMenu; /* or nextPositionInMenu? */

      } else {
        // skip identities locked in position until an unlocked one is found
        var identityIdLockedHere = positionsLockedByIdentityId[nextPositionInMenu]; // identityId locked in this position
        while (identityIdLockedHere && identityIdLockedHere !== identityId) { // some identityId is LOCKED in this position, and it's not us...
          this.debug(`getUpdatedExtendedIdentitiesProps -- SKIPPING POSITION TAKEN BY LOCKED identityId="${identityIdLockedHere}" positionInMenu=${nextPositionInMenu}`);
          nextPositionInMenu++;
          identityIdLockedHere = positionsLockedByIdentityId[nextPositionInMenu]; // identityId locked in this position
        }

        newPositionInMenu = nextPositionInMenu++;
        this.debug( "getUpdatedExtendedIdentitiesProps -- MOVING"
                    + ` identityId="${identityId}"`
                    + ` ${oldPositionInMenu}-->${newPositionInMenu}`
                  );

        identitiesProps[identityId] = {
          "showInMenu":     showInMenu,
          "lockInMenu":     lockInMenu,
          "collected":      collected,
          "imported":       imported,
          "positionInMenu": newPositionInMenu
        };
      }

      if (this.#DEBUG) this.debugAlways( "getUpdatedExtendedIdentitiesProps --" // don't build all this just to be denied by this.#DEBUG inside this.debug()
                                         + `\n- id="${identityId}"`
                                         + `\n- ${oldPositionInMenu}---->${newPositionInMenu}`
                                         + `\n- props.showInMenu=${identitiesProps[identityId].showInMenu}`
                                         + `\n- props.lockInMenu=${identitiesProps[identityId].lockInMenu}`
                                         + `\n- props.collected=${identitiesProps[identityId].collected}`
                                         + `\n- props.imported=${identitiesProps[identityId].imported}`
                                         + `\n- identitiesProps[${identityId}].positionInMenu=${identitiesProps[identityId].positionInMenu}`
                                       );
    }

    await this.#idmOptionsApi.storeIdentitiesExtendedProps(identitiesProps);

    this.debug("getUpdatedExtendedIdentitiesProps -- end");

    return identitiesProps;
  }



  // Alter the given identityPropsByPosition array by removing the props with the given identity IDs and adding them to the TOP
  // respecting lockInMenu
  moveToTop(identitiesProps, identityPropsByPosition, identityIdsToMove) {
    this.debug(`moveToTop -- identityPropsByPosition.length=${identityPropsByPosition.length} identityIdsToMove.length=${identityIdsToMove.length}`);

    var propsToUnshift = [];

    for (var i = identityIdsToMove.length - 1; i >= 0; i--) {
      var identityId = identityIdsToMove[i];
      var props      = identitiesProps[identityId]

      if (! props) {
        this.debug(`moveToTop -- NO PROPS - CREATING NEW -- identityId="${identityId}"`);
        props = {
          "identityId":     identityId, // add this extra bit for the work below, no need to obtain it again
          "showInMenu":     true,
          "lockInMenu":     false,
          "positionInMenu": i // ???
        };
        propsToUnshift.push(props);

      } else {
        var oldPositionInMenu = (typeof props.positionInMenu !== 'number' ) ? -1 : props.positionInMenu;

        if (oldPositionInMenu == -1) {
          this.debug(`moveToTop -- NO OLD POSITION -- identityD="${identityId}"`);
        } else {
          delete identityPropsByPosition[oldPositionInMenu]; // it will now be 'undefined'
          this.debug( "moveToTop -- DELETED FROM OLD POSITION (is it undefined now?)"
                      + ` identityId="${identityId}":`
                      + ` identityPropsByPosition[${oldPositionInMenu}]=${identityPropsByPosition[oldPositionInMenu]}`);
        }

        props.positionInMenu = i; // this will change if there are lockInMenu items in the way
        propsToUnshift.push(props);
      }

      this.debug(`moveToTop -- MOVED TO TOP "${identityId}" i=${i} ${oldPositionInMenu}-->${props.positionInMenu}`);
    }

    for (var props of propsToUnshift) {
      // unshift earlier would screw up the index for "delete" above
      this.debug(`moveToTop -- UNSHIFTING ONTO identityPropsByPosition: "${props.identityId}"`);
      identityPropsByPosition.unshift(props);
    }
  }



  /* Move the Identities with the given Identity Ids to the top of the Display Order.
   *
   * - Get the IdentitiesExtendedProps from local storage
   * - Build an array of the props with lockInMenu indexed by positionInMenu
   * - Build an array of the all props indexed by positionInMenu
   * - Alter that all-props array by removing the props with the given identity IDs and adding them to the top
   * - Loop through that array, updating the props, but respecting lockInMenu positions
   * - Store the updated IdentitiesExtendedProps back in local storage
   *
   * NOTE: Identities that are at the BOTTOM of the Display Order that have
   * lockInMenu will *STAY* at the BOTTOM.  This is technically a "move",
   * but I prefer these semantics. A delete can be a move as well, no?
   *
   * Perhaps createIdmIdentity() should work this way as well.
   */
  async moveIdentitiesToTop(identityIdsToMove) {
    this.debug(`moveIdentitiesToTop -- begin -- (typeof identityIDs)="${typeof identityIdsToMove}"`);

    if (identityIdsToMove && identityIdsToMove.length > 0) {
      this.debug(`moveIdentitiesToTop -- identityIdsToMove.length=${identityIdsToMove.length}`);
      await this.getUpdatedExtendedIdentitiesProps(identityIdsToMove, this.moveToTop);
    }

    this.debug("moveIdentitiesToTop -- end");
  }



  /* Move the Identities with the given Identity Ids to the top of the Display Order.
   *
   * - Get the IdentitiesExtendedProps from local storage
   * - Build an array of the props with lockInMenu indexed by positionInMenu
   * - Build an array of the all props indexed by positionInMenu
   * - Alter that all-props array by removing the props with the given identity IDs and adding them to the top
   * - Loop through that array, updating the props, but respecting lockInMenu positions
   * - Store the updated IdentitiesExtendedProps back in local storage
   *
   * NOTE: Identities that are at the BOTTOM of the Display Order that have
   * lockInMenu will *STAY* at the BOTTOM.  This is technically a "move",
   * but I prefer these semantics. A delete can be a move as well, no?
   *
   * Perhaps createIdmIdentity() should work this way as well.
   */
  async #OLDmoveIdentitiesToTop(identityIdsToMove) {
    this.debug(`moveIdentitiesToTop -- begin -- (typeof identityIDs)="${typeof identityIdsToMove}"`);

    if (identityIdsToMove && identityIdsToMove.length > 0) {
      this.debug(`moveIdentitiesToTop -- identityIdsToMove.length=${identityIdsToMove.length}`);

      var identitiesProps = await this.#idmOptionsApi.getIdentitiesExtendedProps();

      // Build an array of the props with lockInMenu indexed by positionInMenu
      var positionsLockedByIdentityId = [];
      for (var [identityId, props] of Object.entries(identitiesProps)) {
        var lockInMenu = (typeof props.lockInMenu !== 'boolean') ? false : props.lockInMenu;
        if (lockInMenu) {
          var positionInMenu = (typeof props.positionInMenu !== 'number' ) ? -1 : props.positionInMenu;

          if (positionInMenu == -1) {
            this.debug(`moveIdentitiesToTop -- INVALID PROPS POSITION IN MENU identityId="${identityId}" positionInMenu=${props.positionInMenu}`);
          } else {
            this.debug(`moveIdentitiesToTop -- LOCKED IN MENU identityId="${identityId}" positionInMenu=${positionInMenu}`);
            positionsLockedByIdentityId[positionInMenu] = identityId;
          }
        }
      }

      // Build an array of the all props indexed by positionInMenu
      var identityPropsByPosition = [];
      var nextPositionInMenu = Object.entries(identitiesProps).length; // for placing stray identities at the BOTTOM (it happens)
      for (var [identityId, props] of Object.entries(identitiesProps)) {
        this.debug(`moveIdentitiesToTop -- BY POSITION  "${identityId}" ${props.positionInMenu} showInMenu=${props.showInMenu} lockInMenu=${props.lockInMenu}`);
        var positionInMenu = (typeof props.positionInMenu !== 'number' ) ? nextPositionInMenu++ : props.positionInMenu;

        props.identityId = identityId; // <================================ add this extra bit for the work below, no need to obtain it again
        identityPropsByPosition[positionInMenu] = props;
      }

/* MABXXX ======================== THIS IS THE ONLY THING THAT'S DIFFERENT BETWEEN moveIdentitiesTop AND moveIdentitiesToBottom =========================== MABXXX */
      // Alter that all-props array by removing the props with the given identity IDs and adding them to the top
      var propsToUnshift = [];
      for (var i = identityIdsToMove.length - 1; i >= 0; i--) {
        var identityId = identityIdsToMove[i];
        var props      = identitiesProps[identityId]

        if (! props) {
          this.debug(`moveIdentitiesToTop -- NO PROPS - CREATING NEW -- identityId="${identityId}"`);
          props = {
            "identityId":     identityId, // add this extra bit for the work below, no need to obtain it again
            "showInMenu":     true,
            "lockInMenu":     false,
            "collected":      false,
            "imported":       false,
            "positionInMenu": i // ???
          };
          propsToUnshift.push(props);

        } else {
          var oldPositionInMenu = (typeof props.positionInMenu !== 'number' ) ? -1 : props.positionInMenu;

          if (oldPositionInMenu == -1) {
            this.debug(`moveIdentitiesToTop -- NO OLD POSITION -- identityD="${identityId}"`);
          } else {
            delete identityPropsByPosition[oldPositionInMenu]; // it will now be 'undefined'
            this.debug( "moveIdentitiesToTop -- DELETED FROM OLD POSITION (is it undefined now?)"
                        + ` identityId="${identityId}":`
                        + ` identityPropsByPosition[${oldPositionInMenu}]=${identityPropsByPosition[oldPositionInMenu]}`);
          }

          props.positionInMenu = i; // this will change if there are lockInMenu items in the way
          propsToUnshift.push(props);
        }

        this.debug(`moveIdentitiesToTop -- MOVED TO TOP "${identityId}" i=${i} ${oldPositionInMenu}-->${props.positionInMenu}`);
      }
      for (var props of propsToUnshift) {
        // unshif earlier would screw up the index for "delete" above
        this.debug(`moveIdentitiesToTop -- UNSHIFTING ONTO identityPropsByPosition: "${props.identityId}"`);
        identityPropsByPosition.unshift(props);
      }
/* MABXXX ======================== THIS IS THE ONLY THING THAT'S DIFFERENT BETWEEN moveIdentitiesTop AND moveIdentitiesToBottom =========================== MABXXX */

      // filter out gaps
      identityPropsByPosition = identityPropsByPosition.filter(function (el) {
        return (typeof el != 'undefined') && el != null;
      });

      // Loop through that array, updating the props, but respecting lockInMenu positions
      nextPositionInMenu = 0;
      var newPositionInMenu = 0;
      for (var props of identityPropsByPosition) {
        var identityId        = props.identityId; // See? Told you it was helpful!!!
        var showInMenu        = (typeof props.showInMenu               !== 'boolean') ? true  : props.showInMenu; // MABXXX SANITY CHECK REALLY NEEDED???
        var lockInMenu        = (typeof props.lockInMenu               !== 'boolean') ? false : props.lockInMenu; // MABXXX SANITY CHECK REALLY NEEDED???
        var collected         = (typeof props.collected                !== 'boolean') ? false : props.collected;  // MABXXX SANITY CHECK REALLY NEEDED???
        var imported          = (typeof props.imported                 !== 'boolean') ? false : props.imported ;  // MABXXX SANITY CHECK REALLY NEEDED???
        var oldPositionInMenu = (!props || typeof props.positionInMenu !== 'number' ) ? -1    : props.positionInMenu;

        if (lockInMenu && oldPositionInMenu != -1) {
          this.debug(`moveIdentitiesToTop -- LOCKED IN MENU - NOT MOVING identityId="${identityId}" oldPositionInMenu=${oldPositionInMenu}`);
          newPositionInMenu = oldPositionInMenu; /* or nextPositionInMenu? */

        } else {
          // skip identities locked in position until an unlocked one is found
          var identityIdLockedHere = positionsLockedByIdentityId[nextPositionInMenu]; // identityId locked in this position
          while (identityIdLockedHere && identityIdLockedHere !== identityId) { // some identityId is LOCKED in this position, and it's not us...
            this.debug(`moveIdentitiesToTop -- SKIPPING POSITION TAKEN BY LOCKED identityId="${identityIdLockedHere}" positionInMenu=${nextPositionInMenu}`);
            nextPositionInMenu++;
            identityIdLockedHere = positionsLockedByIdentityId[nextPositionInMenu]; // identityId locked in this position
          }

          newPositionInMenu = nextPositionInMenu++;
          this.debug( "moveIdentitiesToTop -- MOVING"
                      + ` identityId="${identityId}"`
                      + ` ${oldPositionInMenu}-->${newPositionInMenu}`
                    );

          identitiesProps[identityId] = {
            "showInMenu":     showInMenu,
            "lockInMenu":     lockInMenu,
            "collected":      collected,
            "imported":       imported,
            "positionInMenu": newPositionInMenu
          };
        }

        if (this.#DEBUG) this.debugAlways( "moveIdentitiesToTop --" // don't build all this just to be denied by this.#DEBUG inside this.debug()
                                           + `\n- id="${identityId}"`
                                           + `\n- ${oldPositionInMenu}---->${newPositionInMenu}`
////////////////////////////////           + `\n- props.showInMenu=${identitiesProps[identityId].showInMenu}`
////////////////////////////////           + `\n- props.lockInMenu=${identitiesProps[identityId].lockInMenu}`
////////////////////////////////           + `\n- props.collected=${identitiesProps[identityId].collected}`
////////////////////////////////           + `\n- props.imported=${identitiesProps[identityId].imported}`
                                           + `\n- identitiesProps[${identityId}].positionInMenu=${identitiesProps[identityId].positionInMenu}`
                                         );
      }

      await this.#idmOptionsApi.storeIdentitiesExtendedProps(identitiesProps);
    } 

    this.debug("moveIdentitiesToTop -- end");
  }



  // Alter the given identityPropsByPosition array by removing the props with the given identity IDs and adding them to the BOTTOM
  // respecting lockInMenu
  moveToBottom(identitiesProps, identityPropsByPosition, identityIdsToMove) {
    this.debug(`moveToBottom -- identityPropsByPosition.length=${identityPropsByPosition.length} identityIdsToMove.length=${identityIdsToMove.length}`);

    var propsToPush = [];

    for (var i = identityIdsToMove.length - 1; i >= 0; i--) {
      var identityId = identityIdsToMove[i];
      var props      = identitiesProps[identityId]

      if (! props) {
        this.debug(`moveToBottom -- NO PROPS - CREATING NEW -- identityId="${identityId}"`);
        props = {
          "identityId":     identityId, // add this extra bit for the work below, no need to obtain it again
          "showInMenu":     true,
          "lockInMenu":     false,
          "positionInMenu": i // ???
        };
        propsToPush.push(props);

      } else {
        var oldPositionInMenu = (typeof props.positionInMenu !== 'number' ) ? -1 : props.positionInMenu;

        if (oldPositionInMenu == -1) {
          this.debug(`moveToBottom -- NO OLD POSITION -- identityD="${identityId}"`);
        } else {
          delete identityPropsByPosition[oldPositionInMenu]; // it will now be 'undefined'
          this.debug( "moveToBottom -- DELETED FROM OLD POSITION (is it undefined now?)"
                      + `\n- identityId="${identityId}":`
                      + `\n- identityPropsByPosition[${oldPositionInMenu}]=${identityPropsByPosition[oldPositionInMenu]}`);
        }

        props.positionInMenu = i; // this will change if there are lockInMenu items in the way
        propsToPush.push(props);
      }

      this.debug(`moveToBottom -- MOVED TO BOTTOM "${identityId}" i=${i} ${oldPositionInMenu}-->${props.positionInMenu}`);
    }

    for (var props of propsToPush) {
      // push earlier could screw up the index for "delete" above???? Probably not, but after dealing with unshift in moveToTop(),,,
      this.debug(`moveToBottom -- PUSHING ONTO identityPropsByPosition: "${props.identityId}"`);
      identityPropsByPosition.push(props);
    }
  }



  /* Move the Identities with the given Identity Ids to the bottom of the Display Order.
   *
   * - Get the IdentitiesExtendedProps from local storage
   * - Build an array of the props with lockInMenu indexed by positionInMenu
   * - Build an array of the all props indexed by positionInMenu
   * - Alter that all-props array by removing the props with the given identity IDs and adding them to the bottom
   * - Loop through that array, updating the props, but respecting lockInMenu positions
   * - Store the updated IdentitiesExtendedProps back in local storage
   *
   * NOTE: Identities that are at the BOTTOM of the Display Order that have
   * lockInMenu will *STAY* at the BOTTOM.  This is technically a "move",
   * but I prefer these semantics. A delete can be a move as well, no?
   *
   * Perhaps createIdmIdentity() should work this way as well.
   */
  async moveIdentitiesToBottom(identityIdsToMove) {
    this.debug(`moveIdentitiesToBottom -- begin -- (typeof identityIDs)="${typeof identityIdsToMove}"`);

    if (identityIdsToMove && identityIdsToMove.length > 0) {
      this.debug(`moveIdentitiesToBottom -- identityIdsToMove.length=${identityIdsToMove.length}`);
      await this.getUpdatedExtendedIdentitiesProps(identityIdsToMove, this.moveToBottom);
    }

    this.debug("moveIdentitiesToBottom -- end");
  }



  /* Move the Identities with the given Identity Ids to the bottom of the Display Order.
   *
   * - Get the IdentitiesExtendedProps from local storage
   * - Build an array of the props with lockInMenu indexed by positionInMenu
   * - Build an array of the all props indexed by positionInMenu
   * - Alter that all-props array by removing the props with the given identity IDs and adding them to the bottom
   * - Loop through that array, updating the props, but respecting lockInMenu positions
   * - Store the updated IdentitiesExtendedProps back in local storage
   *
   * NOTE: Identities that are at the BOTTOM of the Display Order that have
   * lockInMenu will *STAY* at the BOTTOM.  This is technically a "move",
   * but I prefer these semantics. A delete can be a move as well, no?
   *
   * Perhaps createIdmIdentity() should work this way as well.
   */
  async #OLDmoveIdentitiesToBottom(identityIdsToMove) {
    this.debug(`moveIdentitiesToBottom -- begin -- (typeof identityIDs)="${typeof identityIdsToMove}"`);

    if (identityIdsToMove && identityIdsToMove.length > 0) {
      this.debug(`moveIdentitiesToBottom -- identityIdsToMove.length=${identityIdsToMove.length}`);

      var identitiesProps = await this.#idmOptionsApi.getIdentitiesExtendedProps();

      // Build an array of the props with lockInMenu indexed by positionInMenu
      var positionsLockedByIdentityId = [];
      for (var [identityId, props] of Object.entries(identitiesProps)) {
        var lockInMenu = (typeof props.lockInMenu !== 'boolean') ? false : props.lockInMenu;
        if (lockInMenu) {
          var positionInMenu = (typeof props.positionInMenu !== 'number' ) ? -1 : props.positionInMenu;

          if (positionInMenu == -1) {
            this.debug(`moveIdentitiesToBottom -- INVALID PROPS POSITION IN MENU identityId="${identityId}" positionInMenu=${props.positionInMenu}`);
          } else {
            this.debug(`moveIdentitiesToBottom -- LOCKED IN MENU identityId="${identityId}" positionInMenu=${positionInMenu}`);
            positionsLockedByIdentityId[positionInMenu] = identityId;
          }
        }
      }

      // Build an array of the all props indexed by positionInMenu
      var identityPropsByPosition = [];
      var nextPositionInMenu = Object.entries(identitiesProps).length; // for placing stray identities at the BOTTOM (it happens)
      for (var [identityId, props] of Object.entries(identitiesProps)) {
        this.debug(`moveIdentitiesToBottom -- BY POSITION  "${identityId}" ${props.positionInMenu} showInMenu=${props.showInMenu} lockInMenu=${props.lockInMenu}`);
        var positionInMenu = (typeof props.positionInMenu !== 'number' ) ? nextPositionInMenu++ : props.positionInMenu;

        props.identityId = identityId; // <================================ add this extra bit for the work below, no need to obtain it again
        identityPropsByPosition[positionInMenu] = props;
      }

/* MABXXX ======================== THIS IS THE ONLY THING THAT'S DIFFERENT BETWEEN moveIdentitiesTop AND moveIdentitiesToBottom =========================== MABXXX */
      // Alter that all-props array by removing the props with the given identity IDs and adding them to the bottom
      var propsToPush = [];
      for (var i = identityIdsToMove.length - 1; i >= 0; i--) {
        var identityId = identityIdsToMove[i];
        var props      = identitiesProps[identityId]

        if (! props) {
          this.debug(`moveIdentitiesToBottom -- NO PROPS - CREATING NEW -- identityId="${identityId}"`);
          props = {
            "identityId":     identityId, // add this extra bit for the work below, no need to obtain it again
            "showInMenu":     true,
            "lockInMenu":     false,
            "collected":      false,
            "imported":       false,
            "positionInMenu": i // ???
          };
          propsToPush.push(props);

        } else {
          var oldPositionInMenu = (typeof props.positionInMenu !== 'number' ) ? -1 : props.positionInMenu;

          if (oldPositionInMenu == -1) {
            this.debug(`moveIdentitiesToBottom -- NO OLD POSITION -- identityD="${identityId}"`);
          } else {
            delete identityPropsByPosition[oldPositionInMenu]; // it will now be 'undefined'
            this.debug( "moveIdentitiesToBottom -- DELETED FROM OLD POSITION (is it undefined now?)"
                        + `\n- identityId="${identityId}":`
                        + `\n- identityPropsByPosition[${oldPositionInMenu}]=${identityPropsByPosition[oldPositionInMenu]}`);
          }

          props.positionInMenu = i; // this will change if there are lockInMenu items in the way
          propsToPush.push(props);
        }

        this.debug(`moveIdentitiesToBottom -- MOVED TO TOP "${identityId}" i=${i} ${oldPositionInMenu}-->${props.positionInMenu}`);
      }
      for (var props of propsToPush) {
        // push earlier could screw up the index for "delete" above???? Probably not, put after dealing with unshift in moveIdentitiesToTop(),,,
        this.debug(`moveIdentitiesToBottom -- PUSHING ONTO identityPropsByPosition: "${props.identityId}"`);
        identityPropsByPosition.push(props);
      }
/* MABXXX ======================== THIS IS THE ONLY THING THAT'S DIFFERENT BETWEEN moveIdentitiesTop AND moveIdentitiesToBottom =========================== MABXXX */

      // filter out gaps
      identityPropsByPosition = identityPropsByPosition.filter(function (el) {
        return (typeof el != 'undefined') && el != null;
      });

      // Loop through that array, updating the props, but respecting lockInMenu positions
      nextPositionInMenu = 0;
      var newPositionInMenu = 0;
      for (var props of identityPropsByPosition) {
        var identityId        = props.identityId; // See? Told you it was helpful!!!
        var showInMenu        = (typeof props.showInMenu               !== 'boolean') ? true  : props.showInMenu; // MABXXX SANITY CHECK REALLY NEEDED???
        var lockInMenu        = (typeof props.lockInMenu               !== 'boolean') ? false : props.lockInMenu; // MABXXX SANITY CHECK REALLY NEEDED???
        var collected         = (typeof props.collected                !== 'boolean') ? false : props.collected;  // MABXXX SANITY CHECK REALLY NEEDED???
        var imported          = (typeof props.imported                 !== 'boolean') ? false : props.imported;   // MABXXX SANITY CHECK REALLY NEEDED???
        var oldPositionInMenu = (!props || typeof props.positionInMenu !== 'number' ) ? -1    : props.positionInMenu;

        if (lockInMenu && oldPositionInMenu != -1) {
          this.debug(`moveIdentitiesToBottom -- LOCKED IN MENU - NOT MOVING identityId="${identityId}" oldPositionInMenu=${oldPositionInMenu}`);
          newPositionInMenu = oldPositionInMenu; /* or nextPositionInMenu? */

        } else {
          // skip identities locked in position until an unlocked one is found
          var identityIdLockedHere = positionsLockedByIdentityId[nextPositionInMenu]; // identityId locked in this position
          while (identityIdLockedHere && identityIdLockedHere !== identityId) { // some identityId is LOCKED in this position, and it's not us...
            this.debug(`moveIdentitiesToBottom -- SKIPPING POSITION TAKEN BY LOCKED identityId="${identityIdLockedHere}" positionInMenu=${nextPositionInMenu}`);
            nextPositionInMenu++;
            identityIdLockedHere = positionsLockedByIdentityId[nextPositionInMenu]; // identityId locked in this position
          }

          newPositionInMenu = nextPositionInMenu++;
          this.debug( "moveIdentitiesToBottom -- MOVING"
                      + ` identityId="${identityId}"`
                      + ` ${oldPositionInMenu}-->${newPositionInMenu}`
                    );

          identitiesProps[identityId] = {
            "showInMenu":     showInMenu,
            "lockInMenu":     lockInMenu,
            "collected":      collected,
            "imported":       imported,
            "positionInMenu": newPositionInMenu
          };
        }

        if (this.#DEBUG) this.debugAlways( "moveIdentitiesToBottom --" // don't build all this just to be denied by this.#DEBUG inside this.debug()
                                           + `\n- id="${identityId}"`
                                           + `\n- ${oldPositionInMenu}---->${newPositionInMenu}`
/////////////////////////////////          + `\n- props.showInMenu=${identitiesProps[identityId].showInMenu}`
/////////////////////////////////          + `\n- props.lockInMenu=${identitiesProps[identityId].lockInMenu}`
/////////////////////////////////          + `\n- props.collected=${identitiesProps[identityId].collected}`
/////////////////////////////////          + `\n- props.imported=${identitiesProps[identityId].imported}`
                                           + `\n- identitiesProps[${identityId}].positionInMenu=${identitiesProps[identityId].positionInMenu}`
                                         );
      }

      await this.#idmOptionsApi.storeIdentitiesExtendedProps(identitiesProps);
    } 

    this.debug("moveIdentitiesToBottom -- end");
  }



  async showInMenuSelected(identityIds) {
    this.debug("showInMenuSelected -- begin");

    if (! identityIds || identityIds.length <= 0) {
       this.debug("showInMenuSelected -- No Identity IDs");
    } else {
      const identitiesProps = await this.#idmOptionsApi.getIdentitiesExtendedProps();

      var changes = 0;
      for (const identityId of identityIds) {
        const props = identitiesProps[identityId];
        if (! props) {
          this.debug(`showInMenuSelected -- No PROPS for identityId="${identityId}"`);
        } else if (! props.showInMenu) {
          this.debug(`showInMenuSelected -- setting showInMenu for identityId="${identityId}" ${props.showInMenu}-->true`);
          props.showInMenu = true;
          ++changes;
          this.debug(`showInMenuSelected -- setting showInMenu for identityId="${identityId}" now ${props.showInMenu}`);
        }
      }

      if (changes) await this.#idmOptionsApi.storeIdentitiesExtendedProps(identitiesProps);
    }

    this.debug("showInMenuSelected -- end");
  }



  async showInMenuAll() {
    this.debug("showInMenuAll -- begin");

    const identitiesProps = await this.#idmOptionsApi.getIdentitiesExtendedProps();

    var changes = 0;
    for (const [identityId, props] of Object.entries(identitiesProps)) {
      this.debug(`showInMenuAll -- setting showInMenu for identityId="${identityId}" ${props.showInMenu}-->true`);
      if (! props.showInMenu) {
        props.showInMenu = true;
        ++changes;
        this.debug(`showInMenuAll -- setting showInMenu for identityId="${identityId}" now ${props.showInMenu}`);
      }
    }

    if (changes) await this.#idmOptionsApi.storeIdentitiesExtendedProps(identitiesProps);

    this.debug("showInMenuAll -- end");
  }



  async unshowInMenuSelected(identityIds) {
    this.debug("unshowInMenuSelected -- begin");

    if (! identityIds || identityIds.length <= 0) {
       this.debug("unshowInMenuSelected -- No Identity IDs");
    } else {
      const identitiesProps = await this.#idmOptionsApi.getIdentitiesExtendedProps();

      var changes = 0;
      for (const identityId of identityIds) {
        const props = identitiesProps[identityId];
        if (! props) {
          this.debug(`unshowInMenuSelected -- No PROPS for identityId="${identityId}"`);
        } else if (props.showInMenu) {
          this.debug(`unshowInMenuSelected -- setting showInMenu for identityId="${identityId}" ${props.showInMenu}-->false`);
          props.showInMenu = false;
          ++changes;
          this.debug(`unshowInMenuSelected -- setting showInMenu for identityId="${identityId}" now ${props.showInMenu}`);
        }
      }

      if (changes) await this.#idmOptionsApi.storeIdentitiesExtendedProps(identitiesProps);
    }

    this.debug("unshowInMenuSelected -- end");
  }



  async unshowInMenuAll() {
    this.debug("unshowInMenuAll -- begin");

    const identitiesProps = await this.#idmOptionsApi.getIdentitiesExtendedProps();

    var changes = 0;
    for (const [identityId, props] of Object.entries(identitiesProps)) {
      if (props.showInMenu) {
        this.debug(`unshowInMenuAll -- setting showInMenu for identityId="${identityId}" ${props.showInMenu}-->false`);
        props.showInMenu = false;
        ++changes;
        this.debug(`unshowInMenuAll -- setting showInMenu for identityId="${identityId}" now ${props.showInMenu}`);
      }
    }

    if (changes) await this.#idmOptionsApi.storeIdentitiesExtendedProps(identitiesProps);

    this.debug("unshowInMenuAll -- end");
  }



  async lockInMenuSelected(identityIds) {
    this.debug("lockInMenuSelected -- begin");

    if (! identityIds || identityIds.length <= 0) {
       this.debug("lockInMenuSelected -- No Identity IDs");
    } else {
      const identitiesProps = await this.#idmOptionsApi.getIdentitiesExtendedProps();

      var changes = 0;
      for (const identityId of identityIds) {
        const props = identitiesProps[identityId];
        if (! props) {
          this.debug(`lockInMenuSelected -- No PROPS for identityId="${identityId}"`);
        } else if (! props.lockInMenu) {
          this.debug(`lockInMenuSelected -- setting lockInMenu for identityId="${identityId}" ${props.lockInMenu}-->true`);
          props.lockInMenu = true;
          ++changes;
          this.debug(`lockInMenuSelected -- setting lockInMenu for identityId="${identityId}" now ${props.lockInMenu}`);
        }
      }

      if (changes) await this.#idmOptionsApi.storeIdentitiesExtendedProps(identitiesProps);
    }

    this.debug("lockInMenuSelected -- end");
  }



  async lockInMenuAll() {
    this.debug("lockInMenuAll -- begin");

    const identitiesProps = await this.#idmOptionsApi.getIdentitiesExtendedProps();

    var changes = 0;
    for (const [identityId, props] of Object.entries(identitiesProps)) {
      if (! props.lockInMenu) {
        this.debug(`lockInMenuAll -- setting lockInMenu for identityId="${identityId}" ${props.lockInMenu}-->true`);
        props.lockInMenu = true;
        ++changes;
        this.debug(`lockInMenuAll -- setting lockInMenu for identityId="${identityId}" now ${props.lockInMenu}`);
      }
    }

    if (changes) await this.#idmOptionsApi.storeIdentitiesExtendedProps(identitiesProps);

    this.debug("lockInMenuAll -- end");
  }



  async unlockInMenuSelected(identityIds) {
    this.debug("unlockInMenuSelected -- begin");

    if (! identityIds || identityIds.length <= 0) {
       this.debug("unlockInMenuSelected -- No Identity IDs");
    } else {
      const identitiesProps = await this.#idmOptionsApi.getIdentitiesExtendedProps();

      var changes = 0;
      for (const identityId of identityIds) {
        const props = identitiesProps[identityId];
        if (! props) {
          this.debug(`unlockInMenuSelected -- No PROPS for identityId="${identityId}"`);
        } else if (props.lockInMenu) {
          this.debug(`unlockInMenuSelected -- setting lockInMenu for identityId="${identityId}" ${props.lockInMenu}-->false`);
          props.lockInMenu = false;
          ++changes;
          this.debug(`unlockInMenuSelected -- setting lockInMenu for identityId="${identityId}" now ${props.lockInMenu}`);
        }
      }

      if (changes) await this.#idmOptionsApi.storeIdentitiesExtendedProps(identitiesProps);
    }

    this.debug("unlockInMenuSelected -- end");
  }



  async unlockInMenuAll() {
    this.debug("unlockInMenuAll -- begin");

    const identitiesProps = await this.#idmOptionsApi.getIdentitiesExtendedProps();

    var changes = 0;
    for (const [identityId, props] of Object.entries(identitiesProps)) {
      if (props.lockInMenu) {
        this.debug(`unlockInMenuAll -- setting lockInMenu for identityId="${identityId}" ${props.lockInMenu}-->false`);
        props.lockInMenu = false;
        ++changes;
        this.debug(`unlockInMenuAll -- setting lockInMenu for identityId="${identityId}" now ${props.lockInMenu}`);
      }
    }

    if (changes) await this.#idmOptionsApi.storeIdentitiesExtendedProps(identitiesProps);

    this.debug("unlockInMenuAll -- end");
  }



  async findByEmail(email) {
    let accounts = await browser.accounts.list(false); // includeSubFolders=false: do not get sub-folders
    let identities = [];
    for (const account of accounts) {
      for (const identity of account.identities) {
        if (identity.email === email) identities.push(identity);
      }
    }
    if (identities.length == 0) return null;
    return identities;
  }

  async findByName(name) {
    let accounts = await browser.accounts.list(false); // includeSubFolders=false: do not get sub-folders
    let identities = [];
    for (const account of accounts) {
      for (const identity of account.identities) {
        if (identity.name === name) identities.push(identity);
      }
    }
    if (identities.length == 0) return null;
    return identities;
  }
}
