# PageMaster

This [Roll20](http://roll20.net/) script for allows the GM to designate certain pages as "public" pages to which players can freely navigate on their own. By adding a short tag to the name of the page, you mark it as public. Players can use the `!page menu` command to get a list of available pages that are links that will send them to those pages. While not on the page with the Player Ribbon, they will have a button at the bottom of this list that allows them to rejoin the game.

By default, the GM will be notified every time a player jumps to another page or returns to the current one. This can be turned off in the config menu.

The GM can also prevent players from visiting other pages while in combat. If this setting is turned on, players who open the page menu when the Turn Tracker is open will get a warning and will not receive the page list for navigation. If they are on another page when combat begins, they will only get the "Return to Game" button.

GMs can change the tag used for marking pages and other options in the config menu, accessible by sending `!page config` in chat.
