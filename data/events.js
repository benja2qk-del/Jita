const Events = {
    data: {
        abandonedCart: {
            title: 'Abandoned Supply Cart',
            description: 'You find an overturned cart by the road. Its contents are scattered but salvageable. A strange mark is carved into the wood.',
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

        ruinedShrine: {
            title: 'Ruined Shrine of the Ancients',
            description: 'An ancient shrine radiates faint magical energy. Relic fragments shimmer among the rubble. The air feels heavy with power.',
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
                        success: { weaponEnhance: 2, text: 'The ancient power surges into your weapon! It glows with renewed strength.' },
                        failure: { text: 'The energy is unstable and dissipates harmlessly.', moraleLoss: 3 }
                    }
                }
            ]
        },

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
                        success: { gold: -10, iron: 15, text: 'The merchant nervously agrees to \"friendly prices.\"' },
                        failure: { gold: -10, text: 'The merchant packs up and leaves in a hurry. You got nothing useful.', moraleLoss: 3 }
                    }
                },
                {
                    text: 'Share a meal and hear rumors (+morale)',
                    outcome: { food: -5, moraleGain: 10, text: 'Over shared bread, the merchant shares useful intelligence about enemy positions.' }
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
