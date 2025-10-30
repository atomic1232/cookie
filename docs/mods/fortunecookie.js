// ==Fortune Cookie==
// Compatible with Cookie Clicker 2.052+ and CCSE
if (typeof FortuneCookie === 'undefined') var FortuneCookie = {};

FortuneCookie.name = 'Fortune Cookie';
FortuneCookie.version = '2.10-fixed';
FortuneCookie.GameVersion = '2.052';
FortuneCookie.isLoaded = 0;

// Load CCSE if needed
if (typeof CCSE === 'undefined') {
	Game.LoadMod('https://klattmose.github.io/CookieClicker/CCSE.js');
}

// ------------------------------
//  MAIN LAUNCH FUNCTION
// ------------------------------
FortuneCookie.launch = function () {
	if (FortuneCookie.isLoaded) return;
	FortuneCookie.isLoaded = 1;

	// --- Basic Setup ---
	FortuneCookie.config = FortuneCookie.defaultConfig ? FortuneCookie.defaultConfig() : {
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

	// --- Notifications ---
	if (Game.prefs.popups) Game.Popup('Fortune Cookie loaded!');
	else Game.Notify('Fortune Cookie loaded!', '', '', 1, 1);
	console.log("Fortune Cookie: Launch successful.");

	// --- Safe Grimoire hook ---
	FortuneCookie.ReplaceNativeGrimoire();

	// --- Register mod ---
	Game.registerMod(FortuneCookie.name, FortuneCookie);
};


// ------------------------------
//  SAFE GRIMOIRE TOOLTIP HOOK
// ------------------------------
FortuneCookie.ReplaceNativeGrimoire = function () {
	function tryAttach() {
		const wizard = Game.Objects['Wizard tower'];
		const mg = wizard ? wizard.minigame : null;

		if (wizard && mg && wizard.minigameLoaded) {
			const oldTooltip = mg.spellTooltip;

			if (typeof oldTooltip === 'function') {
				// Newer CC version (function-based tooltip)
				mg.spellTooltip = function (id) {
					let str = oldTooltip.call(this, id);
					try {
						const spell = mg.spellsById[id];
						if (FortuneCookie.spellForecast) {
							const forecast = FortuneCookie.spellForecast(spell);
							str = str.replace('</div></div>', `<div style="height:8px;"></div>${forecast}</div></div>`);
						}
					} catch (err) {
						console.error("Fortune Cookie tooltip error:", err);
					}
					return str;
				};
				console.log("Fortune Cookie: Wrapped function-based tooltip.");
			}
			else if (Array.isArray(Game.customMinigame['Wizard tower']?.spellTooltip)) {
				// Older CCSE (array-based tooltip)
				Game.customMinigame['Wizard tower'].spellTooltip.push(function (id, str) {
					try {
						return str.replace('</div></div>',
							'<div style="height:8px;"></div>' +
							FortuneCookie.spellForecast(Game.Objects['Wizard tower'].minigame.spellsById[id]) +
							'</div></div>');
					} catch (err) {
						console.error("Fortune Cookie tooltip error:", err);
						return str;
					}
				});
				console.log("Fortune Cookie: Added array-based tooltip hook.");
			} else {
				console.warn("Fortune Cookie: Tooltip structure not ready, retrying...");
				setTimeout(tryAttach, 500);
				return;
			}
		} else {
			setTimeout(tryAttach, 500);
		}
	}
	tryAttach();
};


// ------------------------------
//  CCSE WAIT WRAPPER
// ------------------------------
(function waitForCCSE() {
	if (typeof CCSE !== 'undefined' && typeof CCSE.ConfirmGameVersion === 'function') {
		if (CCSE.ConfirmGameVersion(FortuneCookie.name, FortuneCookie.version, FortuneCookie.GameVersion)) {
			FortuneCookie.launch();
		}
	} else {
		setTimeout(waitForCCSE, 200);
	}
})();
