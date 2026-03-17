const Events = {
    data: {
        // ═══ FOREST EVENTS ═══
        forestShrine: {
            title: 'Overgrown Shrine',
            description: 'Moss-covered stones hum with nature magic. Vines pulse like a living heartbeat. The air is thick with pollen and old power.',
            biome: 'forest',
            choices: [
                {
                    text: 'Pray at the shrine (heal wounds)',
                    outcome: { healWound: true, text: 'Warm green light washes over you. Your wounds knit with the speed of spring growth.' }
                },
                {
                    text: 'Harvest rare herbs (+12 food, +8 iron)',
                    outcome: { food: 12, iron: 8, text: 'You carefully gather glowing herbs and bark with alchemical properties.' }
                },
                {
                    text: 'Channel the nature magic into your weapon',
                    outcome: {
                        chance: 50,
                        success: { weaponEnhance: 2, text: 'Thorned vines wrap your weapon, infusing it with primal fury!' },
                        failure: { text: 'The vines recoil from your touch. The magic fades.', moraleLoss: 3 }
                    }
                }
            ]
        },
        abandonedCart: {
            title: 'Abandoned Supply Cart',
            description: 'An overturned cart lies among the roots. Claw marks scar the wood — whatever attacked it left in a hurry.',
            biome: 'forest',
            choices: [
                {
                    text: 'Search thoroughly (+15 gold, +10 food)',
                    outcome: { gold: 15, food: 10, text: 'Your soldiers gather useful supplies from the wreckage.' }
                },
                {
                    text: 'Take only what you need (+8 gold, +5 iron, +5 food)',
                    outcome: { gold: 8, iron: 5, food: 5, text: 'You take only essentials and move on quickly.' }
                },
                {
                    text: 'Set a trap for whoever returns (chance of bonus)',
                    outcome: {
                        chance: 55,
                        success: { gold: 30, xp: 20, text: 'Bandits return and fall into your ambush! You claim their loot.' },
                        failure: { text: 'Nobody returns. You wasted time waiting.', moraleLoss: 5 }
                    }
                }
            ]
        },
        wolfPackEncounter: {
            title: 'Wolf Pack',
            description: 'A massive pack of wolves blocks the path. Their alpha watches you with intelligent, unsettling eyes.',
            biome: 'forest',
            choices: [
                {
                    text: 'Offer food to pass peacefully (-8 food)',
                    outcome: { food: -8, text: 'The alpha accepts your offering and leads the pack aside.' }
                },
                {
                    text: 'Try to tame the alpha (chance)',
                    outcome: {
                        chance: 35,
                        success: { xp: 30, moraleGain: 15, text: 'The alpha bows its head. Your troops are inspired by your courage!' },
                        failure: { moraleLoss: 10, text: 'The wolves snarl and drive you back. Your troops are shaken.' }
                    }
                },
                {
                    text: 'Find another path (+morale from caution)',
                    outcome: { moraleGain: 5, text: 'A wise retreat. Your troops respect your caution.' }
                }
            ]
        },

        // ═══ DESERT EVENTS ═══
        buriedTemple: {
            title: 'Buried Temple Entrance',
            description: 'Sand has parted to reveal ancient stone doors etched with golden hieroglyphs. Warm air rises from below.',
            biome: 'desert',
            choices: [
                {
                    text: 'Explore the temple depths (+relic fragment)',
                    outcome: {
                        chance: 60,
                        success: { relicFragment: 1, gold: 20, text: 'You navigate treacherous traps and emerge with a glowing relic fragment!' },
                        failure: { moraleLoss: 8, text: 'Collapsing corridors force you to retreat. Some soldiers are bruised.' }
                    }
                },
                {
                    text: 'Loot the entrance carvings (+25 gold)',
                    outcome: { gold: 25, text: 'The golden inlays pry loose easily. Good coin, if nothing else.' }
                },
                {
                    text: 'Camp in the shade and rest (heal)',
                    outcome: { healWound: true, food: -5, text: 'The temple entrance provides blessed shade. Your army rests well.' }
                }
            ]
        },
        mirageOasis: {
            title: 'Shimmering Oasis',
            description: 'An oasis glistens in the heat. Real or mirage? A caravan of traders waves from the water\'s edge.',
            biome: 'desert',
            choices: [
                {
                    text: 'Trade with the caravan (-15 gold, +20 iron)',
                    outcome: { gold: -15, iron: 20, text: 'Desert steel is expensive but excellent quality.' }
                },
                {
                    text: 'Rest and refill water (+10 food, heal)',
                    outcome: { food: 10, healWound: true, text: 'The water is real — and cold. Your troops are reinvigorated.' }
                },
                {
                    text: 'Demand tribute from the merchants',
                    outcome: {
                        chance: 40,
                        success: { gold: 35, iron: 10, text: 'The merchants hand over valuables rather than fight.' },
                        failure: { gold: -10, moraleLoss: 8, text: 'The merchants fight back and escape. Your soldiers are disappointed.' }
                    }
                }
            ]
        },
        sandstormApproaching: {
            title: 'Sandstorm Approaching',
            description: 'A wall of orange sand builds on the horizon. Your scouts estimate minutes before it hits.',
            biome: 'desert',
            choices: [
                {
                    text: 'Dig in and wait it out (-5 food)',
                    outcome: { food: -5, moraleGain: 5, text: 'Your troops hunker down. The storm passes over you safely.' }
                },
                {
                    text: 'Push through using the storm as cover',
                    outcome: {
                        chance: 50,
                        success: { xp: 25, text: 'You navigate blind through the storm and emerge ahead of schedule!' },
                        failure: { moraleLoss: 12, text: 'Several soldiers are separated in the storm. Morale plummets.' }
                    }
                },
                {
                    text: 'Search for shelter in nearby ruins (+gold)',
                    outcome: { gold: 15, text: 'The ruins provide both shelter and a few forgotten coins.' }
                }
            ]
        },

        // ═══ VOLCANIC EVENTS ═══
        volcanicRift: {
            title: 'Volcanic Rift',
            description: 'The ground cracks open revealing a chasm of magma. Obsidian shards and rare ore glitter at the edges.',
            biome: 'volcanic',
            choices: [
                {
                    text: 'Mine the obsidian ore (+15 iron)',
                    outcome: { iron: 15, text: 'Your soldiers carefully extract precious obsidian from the rift edge.' }
                },
                {
                    text: 'Forge weapons in the magma (+weapon enhance)',
                    outcome: {
                        chance: 45,
                        success: { weaponEnhance: 3, text: 'The extreme heat tempers your weapon to impossible hardness!' },
                        failure: { text: 'The heat is too intense. Your attempt fails and you retreat singed.', moraleLoss: 5 }
                    }
                },
                {
                    text: 'Collapse the rift to block pursuers (+morale)',
                    outcome: { moraleGain: 10, text: 'A controlled detonation seals the path behind you. Your troops feel safer.' }
                }
            ]
        },
        ruinedShrine: {
            title: 'Ruined Shrine of the Ancients',
            description: 'An ancient shrine radiates faint magical energy. Relic fragments shimmer among the rubble. The air reeks of sulfur.',
            biome: 'volcanic',
            choices: [
                {
                    text: 'Pray at the shrine (heal wounds)',
                    outcome: { healWound: true, text: 'A warm light washes over you. Your wounds begin to mend.' }
                },
                {
                    text: 'Search for relics (+1 Relic Fragment)',
                    outcome: { relicFragment: 1, text: 'You carefully extract a glowing relic fragment from the rubble.' }
                },
                {
                    text: 'Channel the energy into your weapon (+2 enhance)',
                    outcome: {
                        chance: 50,
                        success: { weaponEnhance: 2, text: 'Ancient power surges into your weapon! It glows with renewed strength.' },
                        failure: { text: 'The energy is unstable and dissipates harmlessly.', moraleLoss: 3 }
                    }
                }
            ]
        },
        flameCultRitual: {
            title: 'Cult Ritual in Progress',
            description: 'Distant chanting echoes off obsidian walls. A flame cult ritual is underway — dark energy crackles in the air.',
            biome: 'volcanic',
            choices: [
                {
                    text: 'Disrupt the ritual (+XP, +gold)',
                    outcome: {
                        chance: 55,
                        success: { xp: 35, gold: 20, text: 'You scatter the cultists! Their ritual components are valuable.' },
                        failure: { moraleLoss: 10, text: 'The cultists complete their spell. Dark energy washes over your army.' }
                    }
                },
                {
                    text: 'Observe and learn (+XP)',
                    outcome: { xp: 20, text: 'You study the ritual from afar. The dark knowledge may prove useful.' }
                },
                {
                    text: 'Sneak past while they\'re distracted',
                    outcome: { moraleGain: 5, text: 'You slip past unnoticed. No risk, no reward — but no casualties either.' }
                }
            ]
        },

        // ═══ GENERIC EVENTS (can appear anywhere) ═══
        wanderingMerchant: {
            title: 'Wandering Merchant',
            description: 'A merchant with a heavily-laden mule blocks the narrow path. He eyes your banner with a mix of fear and opportunism.',
            choices: [
                {
                    text: 'Trade fairly (-20 gold, +15 iron, +10 food)',
                    outcome: { gold: -20, iron: 15, food: 10, text: 'A fair trade. The merchant tips his hat and moves on.' }
                },
                {
                    text: 'Intimidate for a discount (-10 gold, +15 iron)',
                    outcome: {
                        chance: 65,
                        success: { gold: -10, iron: 15, text: 'The merchant nervously agrees to "friendly prices."' },
                        failure: { gold: -10, text: 'The merchant packs up and leaves. You got nothing useful.', moraleLoss: 3 }
                    }
                },
                {
                    text: 'Share a meal and hear rumors (+morale)',
                    outcome: { food: -5, moraleGain: 10, text: 'Over shared bread, the merchant shares useful scouting intel.' }
                }
            ]
        },
        mysteriousFog: {
            title: 'Mysterious Fog',
            description: 'A thick, unnatural fog rolls in. Shadows move at the edges of perception. Your troops grow uneasy.',
            choices: [
                {
                    text: 'Push through cautiously',
                    outcome: { text: 'You emerge on the other side unharmed but shaken.', moraleLoss: 5 }
                },
                {
                    text: 'Send scouts ahead',
                    outcome: {
                        chance: 60,
                        success: { xp: 25, gold: 10, text: 'Your scouts find a hidden cache of supplies in the fog!' },
                        failure: { text: 'The scouts return with nothing, and one is wounded.', moraleLoss: 8 }
                    }
                },
                {
                    text: 'Wait for it to pass (+heal)',
                    outcome: { healWound: true, food: -8, text: 'You camp and rest. The fog lifts by morning and your army is refreshed.' }
                }
            ]
        }
    },

    getEventsForBiome(biome) {
        const result = [];
        for (const [key, evt] of Object.entries(Events.data)) {
            if (!evt.biome || evt.biome === biome) result.push(key);
        }
        return result;
    },

    applyOutcome(outcome) {
        const p = GameState.player;
        if (outcome.gold) p.gold = Math.max(0, p.gold + outcome.gold);
        if (outcome.iron) p.iron = Math.max(0, p.iron + outcome.iron);
        if (outcome.food) p.food = Math.max(0, p.food + outcome.food);
        if (outcome.xp) GameState.addXP(outcome.xp);
        if (outcome.healWound && p.wounds > 0) GameState.removeWound();
        if (outcome.moraleLoss) {
            p.army.morale = Utils.clamp(p.army.morale - outcome.moraleLoss, 0, 100);
        }
        if (outcome.moraleGain) {
            p.army.morale = Utils.clamp(p.army.morale + outcome.moraleGain, 0, 100);
        }
        if (outcome.relicFragment) {
            p.relicFragments = (p.relicFragments || 0) + outcome.relicFragment;
        }
        if (outcome.weaponEnhance) {
            p.weapon.enhanceLevel += outcome.weaponEnhance;
        }
    },

    resolveChoice(eventId, choiceIndex) {
        const evt = Events.data[eventId];
        if (!evt) return { text: 'Nothing happens.' };
        const choice = evt.choices[choiceIndex];
        if (!choice) return { text: 'Nothing happens.' };

        const outcome = choice.outcome;
        if (outcome.chance !== undefined) {
            if (Utils.chance(outcome.chance)) {
                Events.applyOutcome(outcome.success);
                return outcome.success;
            } else {
                const fail = outcome.failure || { text: 'Nothing happens.' };
                Events.applyOutcome(fail);
                return fail;
            }
        } else {
            Events.applyOutcome(outcome);
            return outcome;
        }
    }
};
