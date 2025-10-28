// ==Fortune Cookie Mod==
// Ensure FortuneCookie object exists
if (typeof FortuneCookie === 'undefined') var FortuneCookie = {};

// Load CCSE if it doesn't exist
if (typeof CCSE === 'undefined') {
    Game.LoadMod('https://klattmose.github.io/CookieClicker/CCSE.js');
}

// Mod metadata
FortuneCookie.name = 'Fortune Cookie';
FortuneCookie.version = '2.10';
FortuneCookie.GameVersion = '2.052';

// Core launch function
FortuneCookie.launch = function() {
    FortuneCookie.init = function() {
        FortuneCookie.isLoaded = 1;
        FortuneCookie.Backup = {};
        FortuneCookie.config = FortuneCookie.defaultConfig();

        if (CCSE.config.OtherMods.FortuneCookie && !Game.modSaveData[FortuneCookie.name])
            Game.modSaveData[FortuneCookie.name] = JSON.stringify(CCSE.config.OtherMods.FortuneCookie);

        FortuneCookie.ReplaceNativeGrimoire();
        FortuneCookie.initMembraneForecast();
        FortuneCookie.initDragonDropForecast();

        Game.customOptionsMenu.push(function() {
            CCSE.AppendCollapsibleOptionsMenu(FortuneCookie.name, FortuneCookie.getMenuString());
        });

        Game.customStatsMenu.push(function() {
            CCSE.AppendStatsVersionNumber(FortuneCookie.name, FortuneCookie.version);
        });

        if (FortuneCookie.postLoadHooks) {
            for (var i = 0; i < FortuneCookie.postLoadHooks.length; ++i) {
                (FortuneCookie.postLoadHooks[i])();
            }
        }

        if (Game.prefs.popups) Game.Popup('Fortune Cookie loaded!');
        else Game.Notify('Fortune Cookie loaded!', '', '', 1, 1);
    };

    // Configuration
    FortuneCookie.save = function() {
        return JSON.stringify(FortuneCookie.config);
    };

    FortuneCookie.load = function(str) {
        var config = JSON.parse(str);
        for (var pref in config) {
            FortuneCookie.config[pref] = config[pref];
        }
    };

    FortuneCookie.defaultConfig = function() {
        return {
            spellForecastLength: 10,
            simGCs: 0,
            colorOverride: {
                'Building Special': "#FF00FF",
                'Click Frenzy': "#4BB8F0",
                'Elder Frenzy': "#E1C699",
                'Free Sugar Lump': "#DAA560"
            },
            forecastDragonDrop: true
        };
    };

    FortuneCookie.UpdatePref = function(prefName, value) {
        FortuneCookie.config[prefName] = value;
    };

    FortuneCookie.SetOverrideColor = function(effect, color) {
        FortuneCookie.config.colorOverride[effect] = color;
        Game.UpdateMenu();
    };

    FortuneCookie.getSimGCs = function() {
        return (FortuneCookie.config.simGCs ? FortuneCookie.config.simGCs : 0);
    };

    FortuneCookie.AddColorOverride = function() {
        var str = '<h3>New color override</h3><div class="block">';
        str += '<table style="width:80%;">';
        str += '<tr><td style="text-align:right; width:45%;">Effect:</td><td style="width:5%;"></td><td style="text-align:left; width:50%;"><input id="effectEditor" class="option" type="text" value="" style="width: 65px;" /></td></tr>';
        str += '<tr><td style="text-align:right;">Color:</td><td></td><td style="text-align:left;"><input id="colorEditor" class="option" type="text" value="#FFFFFF" style="width: 65px;" /></td></tr>';
        str += '</table></div>';

        Game.Prompt(str, [
            ['Save', 'FortuneCookie.config.colorOverride[l("effectEditor").value] = l("colorEditor").value; Game.ClosePrompt(); Game.UpdateMenu();'],
            ['Nevermind', 'Game.ClosePrompt();']
        ], 0);
    };

    // Menu string
    FortuneCookie.getMenuString = function() {
        let m = CCSE.MenuHelper;
        var str = '<div class="listing">' +
            m.Slider('spellForecastSlider', 'Forecast Length', '[$]', function() {
                return FortuneCookie.config.spellForecastLength;
            }, "FortuneCookie.UpdatePref('spellForecastLength', Math.round(l('spellForecastSlider').value)); l('spellForecastSliderRightText').innerHTML = FortuneCookie.config.spellForecastLength;", 0, 100, 1) + '<br>' +
            '</div>';

        str += m.Header('Force the Hand of Fate') +
            '<div class="listing">This spell\'s outcome changes based on the season, how many Golden Cookies are already on screen, and if a Dragonflight buff is currently active.</div>' +
            '<div class="listing">Column 1 : The season is <b>neither</b> Easter nor Valentine\'s.</div>' +
            '<div class="listing">Column 2 : The season is <b>either</b> Easter or Valentine\'s.</div>' +
            '<div class="listing">You can use this slider to forecast the outcome with more Golden Cookies on screen.</div>' +
            '<div class="listing">' +
            m.Slider('simGCsSlider', 'Simulate GCs', '[$]', FortuneCookie.getSimGCs, "FortuneCookie.UpdatePref('simGCs', Math.round(l('simGCsSlider').value)); l('simGCsSliderRightText').innerHTML = FortuneCookie.config.simGCs;", 0, 10, 1) + '<br>' +
            '</div>';

        str += m.Header('Color Override') +
            '<div class="listing">Set the color coding of the Force the Hand of Fate outcomes.</div>' +
            '<div class="listing">Default is <span class="green">green for success</span>, and <span class="red">red for backfire</span>.</div>';
        str += '<div class="listing">' + m.ActionButton("FortuneCookie.AddColorOverride();", 'Add') + '</div>';

        for (var color in FortuneCookie.config.colorOverride) {
            var style = 'width:65px;background-color:' + FortuneCookie.config.colorOverride[color] + ';';
            str += '<div class="listing">' +
                m.ActionButton("delete FortuneCookie.config.colorOverride['" + color + "']; Game.UpdateMenu();", 'Remove') +
                '<input id="FortuneCookieColorOverride' + color + '" class="option" style="' + style + '" value="' + FortuneCookie.config.colorOverride[color] + '" onChange="FortuneCookie.SetOverrideColor(\'' + color + '\', l(\'FortuneCookieColorOverride' + color + '\').value)">' +
                '<label>' + color + '</label>' +
                '</div>';
        }

        str += m.Header('Dragon Drop forecast') +
            '<div class="listing">' + m.ToggleButton(FortuneCookie.config, 'forecastDragonDrop', 'forecastDragonDropButton', 'Tooltip ON', 'Tooltip OFF', "FortuneCookie.Toggle") + '<label>Show/Hide the tooltip that displays the available drops for petting the dragon.</label></div>';

        return str;
    };

    FortuneCookie.Toggle = function(prefName, button, on, off, invert) {
        if (FortuneCookie.config[prefName]) {
            l(button).innerHTML = off;
            FortuneCookie.config[prefName] = 0;
        } else {
            l(button).innerHTML = on;
            FortuneCookie.config[prefName] = 1;
        }
        l(button).className = 'smallFancyButton prefButton option' + ((FortuneCookie.config[prefName] ^ invert) ? '' : ' off');

        if (Game.specialTab == 'dragon') Game.ToggleSpecialMenu(1);
    };

    FortuneCookie.ReplaceNativeGrimoire = function() {
        if (!Game.customMinigame['Wizard tower'].spellTooltip) Game.customMinigame['Wizard tower'].spellTooltip = [];
        Game.customMinigame['Wizard tower'].spellTooltip.push(function(id, str) {
            return str.replace('</div></div>',
                '<div style="height:8px;"></div>' +
                FortuneCookie.spellForecast(Game.Objects['Wizard tower'].minigame.spellsById[id]) +
                '</div></div>');
        });
    };

    // Confirm game version and register
    if (CCSE.ConfirmGameVersion(FortuneCookie.name, FortuneCookie.version, FortuneCookie.GameVersion))
        Game.registerMod(FortuneCookie.name, FortuneCookie);
};

// Wait for CCSE to load, then launch
if (!FortuneCookie.isLoaded) {
    var waitCCSE = setInterval(function() {
        if (typeof CCSE !== 'undefined' && typeof CCSE.ConfirmGameVersion === 'function') {
            clearInterval(waitCCSE);
            FortuneCookie.launch();
        }
    }, 200);
}
