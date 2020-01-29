/*
PageMaster
Allows players to self-navigate to designated pages in Roll20.

On Github:	https://github.com/blawson69
Contact me: https://app.roll20.net/users/1781274/ben-l

Like this script? Become a patron:
    https://www.patreon.com/benscripts
*/

var PageMaster = PageMaster || (function () {
    'use strict';

    //---- INFO ----//

    var version = '1.0',
    debugMode = false,
    styles = {
        box:  'background-color: #fff; border: 1px solid #000; padding: 8px 10px; border-radius: 6px; margin-left: -40px; margin-right: 0px;',
        title: 'padding: 0 0 10px 0; color: ##591209; font-size: 1.5em; font-weight: bold; font-variant: small-caps; font-family: "Times New Roman",Times,serif;',
        button: 'background-color: #000; border-width: 0px; border-radius: 5px; padding: 5px 8px; color: #fff; text-align: center;',
        textButton: 'background-color: transparent; border: none; padding: 0; color: #591209; text-decoration: underline;',
        buttonWrapper: 'text-align: center; margin: 10px 0; clear: both;',
        code: 'font-family: "Courier New", Courier, monospace; background-color: #ddd; color: #000; padding: 2px 4px;',
        hr: 'margin: 6px 16px;'
    },

    checkInstall = function () {
        if (!_.has(state, 'PageMaster')) state['PageMaster'] = state['PageMaster'] || {};
        if (typeof state['PageMaster'].publicMarker == 'undefined') state['PageMaster'].publicMarker = '[Map]';
        if (typeof state['PageMaster'].notifyGM == 'undefined') state['PageMaster'].notifyGM = true;
        log('--> PageMaster v' + version + ' <-- Initialized');
		if (debugMode) {
			var d = new Date();
			showDialog('Debug Mode', 'PageMaster v' + version + ' loaded at ' + d.toLocaleTimeString() + '<br><a style=\'' + styles.textButton + '\' href="!page config">Show config</a>', 'GM');
		}
    },

    //----- INPUT HANDLER -----//

    handleInput = function (msg) {
        if (msg.type == 'api' && msg.content.startsWith('!page')) {
			var parms = msg.content.split(/\s+/i);
			if (parms[1]) {
				switch (parms[1]) {
					case 'config':
						if (playerIsGM(msg.playerid)) commandConfig(msg);
						break;
					case 'jump':
						commandSendToPage(msg);
						break;
					case 'menu':
						commandShowMenu(msg);
						break;
                    default:
                        commandHelp(msg);
				}
			} else {
				commandHelp(msg);
			}
		}
    },

    commandConfig = function (msg) {
        var message = '', parms = msg.content.split(/\s+/i);
        if (parms[2]) {
            var parts = parms[2].split('|');
            if (parts[0] == 'name-tag' && parts[1] && parts[1] != '') {
                state['PageMaster'].publicMarker = msg.content.replace('!page config name-tag|', '').trim().replace(/\s+/g, '');
            }
            if (parts[0] == 'toggle-notice') state['PageMaster'].notifyGM = !state['PageMaster'].notifyGM;
        }
        message += '<h4>Name Tag</h4>This is the snipped of text you add to the name of every page to which you wish to give players access. Make sure it\'s short, something that won\'t be accidentally used, and <i>do not</i> use spaces.<br><br>';
        message += 'Your current tag is <b>' + state['PageMaster'].publicMarker + '</b> <a style="' + styles.textButton + '" href="!page config name-tag|&#63;&#123;Tag&#124;&#125;">change</a>';

        message += '<hr style="' + styles.hr + '">';

        message += '<h4>GM Notification</h4>You will' + (state['PageMaster'].notifyGM ? '' : ' <i>not</i>') + ' be notified each time a player switches pages. ';
        message += '<a style="' + styles.textButton + '" href="!page config toggle-notice">turn ' + (state['PageMaster'].notifyGM ? 'off' : 'on') + '</a>';

        showDialog('Config Menu', message, 'GM');
	},

    commandShowMenu = function (msg) {
        var message = '', page_list = '', pages = findObjs({_type: 'page', archived: false});
        var player_pages = Campaign().get("playerspecificpages") || {};
        message += 'Jump to a page:<ul>';
        _.each(pages, function (page) {
            var page_name = page.get('name');
            if (page_name.search(esRE(state['PageMaster'].publicMarker)) !== -1) {
                if (page.get('id') == player_pages[msg.playerid]) page_list += '<li>' + page_name.replace(state['PageMaster'].publicMarker, '').trim() + ' (Current)</li>';
                else page_list += '<li><a style=\'' + styles.textButton + '\' href="!page jump ' + page.get('id') + '">' + page_name.replace(state['PageMaster'].publicMarker, '').trim() + '</a></li>';
            }
        });
        if (page_list == '') page_list = '<li><i>No pages available.</i></li>';
        message += page_list + '</ul>';

        if (typeof player_pages[msg.playerid] == 'string') {
            message += '<div style="' + styles.buttonWrapper + '"><a style=\'' + styles.button + '\' href="!page jump home">Return to Game</div>';
        }

        showDialog('Page Menu', message, msg.who);
    },

    commandSendToPage = function (msg) {
        var message = '', dest = msg.content.replace('!page jump ', '').trim();
        var page_id = (dest == 'home') ? Campaign().get("playerpageid") : dest;
        var player_pages = Campaign().get("playerspecificpages") || {};

        if (dest == 'home') {
            delete player_pages[msg.playerid];
            if (_.isEmpty(player_pages)) player_pages = false;
            showDialog('', 'Jumping back into the game...', msg.who);
            if (state['PageMaster'].notifyGM) showDialog('', msg.who + ' has returned to the game.', 'GM');
        } else {
            var dest_page = getObj('page', page_id);
            if (dest_page && dest_page.get('name').search(state['PageMaster'].publicMarker) != -1) {
                player_pages[msg.playerid] = page_id;
                showDialog('', 'Jumping to "' + dest_page.get('name').replace(state['PageMaster'].publicMarker, '').trim() + '"...<br><div style="' + styles.buttonWrapper + '"><a style=\'' + styles.button + '\' href="!page menu">Show Menu</div>', msg.who);
                if (state['PageMaster'].notifyGM) showDialog('', msg.who + ' has jumped to ' + dest_page.get('name').replace(state['PageMaster'].publicMarker, '').trim(), 'GM');
            } else {
                showDialog('Page Error', 'That page does not exist!', msg.who);
            }
        }

        Campaign().set("playerspecificpages", false);
        Campaign().set("playerspecificpages", player_pages);
    },

    commandHelp = function (msg) {
        // Show help dialog
        var message = 'Use the button below to get a list of pages you can jump to. If you are not on the current game page, you will also have a button to rejoin the game.';
        message += '<div style="' + styles.buttonWrapper + '"><a style=\'' + styles.button + '\' href="!page menu">Show Menu</div>';
        showDialog('PageMaster Help', message, msg.who);
    },

    showDialog = function (title, content, whisperTo = '') {
        // Outputs a pretty box in chat with a title and content
        var gm = /\(GM\)/i;
        title = (title == '') ? '' : '<div style=\'' + styles.title + '\'>' + title + '</div>';
        var body = '<div style=\'' + styles.box + '\'>' + title + '<div>' + content + '</div></div>';
        if (whisperTo.length > 0) {
            whisperTo = '/w ' + (gm.test(whisperTo) ? 'GM' : '"' + whisperTo + '"') + ' ';
            sendChat('PageMaster', whisperTo + body, null, {noarchive:true});
        } else  {
            sendChat('PageMaster', body);
        }
    },

    esRE = function (s) {
        var escapeForRegexp = /(\\|\/|\[|\]|\(|\)|\{|\}|\?|\+|\*|\||\.|\^|\$)/g;
        return s.replace(escapeForRegexp,"\\$1");
    },

    //---- PUBLIC FUNCTIONS ----//

    registerEventHandlers = function () {
		on('chat:message', handleInput);
	};

    return {
		checkInstall: checkInstall,
		registerEventHandlers: registerEventHandlers
	};
}());

on("ready", function () {
    PageMaster.checkInstall();
    PageMaster.registerEventHandlers();
});
