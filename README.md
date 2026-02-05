# Identity Manager Plus for Mozilla Thunderbird

Identity Manager Plus makes managing and using your Thunderbid Account Identities\
just a bit easier.

<br>

### This extension started out as a fork of:
> [Identity Chooser MX(https://github.com/speedball2001/Identitychooser-mx)]

with some UI enhancements so that I could add the ability to sort my\
Identities by email address, but then I went from there.

Identity Manager Plus includes these features from Identity Chooser MX:

* It displays an Identity Chooser Pop-Up List when you compose a new email,\
where you choose an Identity to use for the **From** email address.

* On the extension's Options Page:

  + You can use drag-and-drop to specify the order in which your Identities\
    are listed on the Identity Chooser Pop-Up List.

  + For each Identity, you can click a check-box to **NOT Include** that\
    Identity on the Identity Chooser Pop-Up List.

  + You can chose when the Message Chooser Pop-Up List is displayed:
    - When you are composing a **New** Message
    - When you are **Replying** to a Message
    - When you are **Forwarding** a Message
    - When you are opening a **Draft** Messsage

<br>

### This extension adds these features:

* On the extension's Options Page, in addition to seeing a list of all your current\
Identities, where you can select which will be displayed to select from in the\
Identity Chooser Pop-Up Window when composing a new email:

  + You can filter the list using several different criteria so you find Identities easier

  + You can SORT your Identities for the Identity Chooser Pop-Up using criteria that you select:
    - By Name + Label
    - By Email Address
    - By Email Address Domain
    - Email Address Host Name
    - In Ascending Order
    - In Descending Order

  + You can select one or more Identities and click a button to:
    - **Show** or **Hide** them in the Identity Chooser Pop-Up list
    - **Lock** or **Unlock** them in their current positions in the list.
    - **Move** them to the **Top** or the **Bottom** of the list.

  + For each Identity, you can click a button to **Lock** that Identity at\
    its current position in the Identity Chooser Pop-Up list.

    Sorting the list or moving other Identities in the list will not displace\
    these Identities.

    (Because of the way that drag-and-drop works, it does not prevent you\
    from moving a Locked Identity when you move a different Identityi using\
    drag-and-drop. I am looking for a solution to this.)

  + You can **Create** NEW Identity

  + You can **EDIT** an Identity

  + You can **DELETE** an Identity

  + For each Identity, there is a button to:
    - **LOCK** the Identity into its current position in the Identity Chooser Pop-Up List
    - **MOVE** the Identity **UP** one position in the Identity Chooser List,\
    respecting any Identities that are Locked in position
    - **MOVE** the Identity **DOWN** one position in the Identity Chooser List,\
    respecting any Identities that are Locked in position
    - **MOVE** the Identity the the **TOP** of the Identity Chooser List,\
    respecting any Identities that are Locked in position
    - **MOVE** the Identity the the **BOTTOM** of the Identity Chooser List,\
    respecting any Identities that are Locked in position
    - **EDIT** the Identity
    - **DELETE** the Identity

  + You can **Import** Identities from a **Spreadsheet** or **CSV** File

    This feature requires the [FileSystemBroker Extension](https://github.com/WoofGrrrr/file-system-broker)

    The "Import..." Button is disabled if the FileSystemBroker Extension\
    is not installed or if this Identity Manager Plus Extension has not\
    been Granted Access to use it.

  + You can **Backup** the current settings to a file and later **Restore**\
    them from that file.

    This feature requires the [FileSystemBroker Extension](https://github.com/WoofGrrrr/file-system-broker)

    The "Manage Backups" Button is disabled if the FileSystemBroker\
    Extension is not installed or if this Identity Manager Plus Extension\
    has not been Granted Access to use it.

* You can automatially **"Collect"** new Identities.

  When you use a "From" email address that is NOT one of your Existing\
  Identities, a New Identity will be created automatically for you.

  You can enable or disable this feature on the Extension Options page.\
  You can also choose to see an Alert when a new Identity has been Collected.

* There is an option to choose what happens when you simply close the\
  Identity Chooser Pop-Up List without choosing an Identity.

  The default is to close the Message Compose Window as well. But now\
  there is an option to leave the Compose Window open and just use the\
  Default Identity as configured by Thunderbird.

* On the Indentity Chooser Pop-Up List:
  - There is now a **Use Default** button in addition to the **Cancel** button.

    This button simply closes the Identity Chooser Pop-Up List so that the\
    Message Compose Window will use the defaullt **From** email address as\
    configured by Thunderbird.

  - You can filter the list using several different criteria so you find an\
    Identity easier

<br>
<br>

## Future Ideas:

<br>


## How to install (FUTURE):

1. Download the .xpi file from GitHub
2. Open Thunderbird's **Add-ons and Themes** Tab
  + Tools -> Add-ons and Themes
3. Select the **Extensions** Tab on the left
4. CLick on the **Gear** icon
5. Select **Install Add-on From File...**
6. Find the file you downloaded from GitHub and double-click on it

<br>


## How to install (FUTURE):

Head over to [addons.thunderbird.net][ic-mx MABXXX] to find the current
version.  Development releases might be available earlier in the
[Releases] section on GitHub.

  [ic-mx]: MABXXX https://addons.thunderbird.net/addon/identity-chooser/
  [releases]: MABXXX https://github.com/speedball2001/identitychooser-mx/releases

<br>

## Notes

MABXXX

<br>

## Attribution

This addon uses code from other projects:

  * \[Identity Chooser MX\]: https://github.com/speedball2001/identitychooser-mx
  * \[sortable.js\]: https://github.com/SortableJS/sortablejs
  * \[parse-domain\]: https://github.com/peerigon/parse-domain

Some icons are from \[Iconpacks\]: https://iconpacks.net
