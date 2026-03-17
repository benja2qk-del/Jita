const UpgradeSystem = {
    getEnhanceCost(currentLevel) {
        const base = 10 + currentLevel * 8;
        return { gold: base, iron: Math.floor(base * 0.6) };
    },

    getEnhanceSuccessRate(currentLevel) {
        if (currentLevel < 3) return 100;
        if (currentLevel === 3) return 85;
        if (currentLevel === 4) return 70;
        if (currentLevel === 5) return 55;
        if (currentLevel === 6) return 40;
        if (currentLevel === 7) return 30;
        if (currentLevel === 8) return 20;
        return 15;
    },

    attemptEnhance(weapon) {
        const cost = this.getEnhanceCost(weapon.enhanceLevel);
        if (!GameState.spendResources(cost.gold, cost.iron, 0)) {
            return { success: false, reason: 'insufficient', message: 'Not enough resources!' };
        }

        const rate = this.getEnhanceSuccessRate(weapon.enhanceLevel);
        const smithDiscount = CampaignSystem.getDistrictBonusValue('smithCost');

        if (Utils.chance(rate)) {
            weapon.enhanceLevel++;
            return {
                success: true,
                message: `Enhancement succeeded! ${weapon.name} is now +${weapon.enhanceLevel}!`,
                level: weapon.enhanceLevel
            };
        } else {
            // Failure effects
            if (weapon.enhanceLevel >= 5 && Utils.chance(20)) {
                // Break — reset to 0
                weapon.enhanceLevel = 0;
                return {
                    success: false,
                    reason: 'break',
                    message: `The weapon shattered under the strain! ${weapon.name} reset to +0!`
                };
            } else if (weapon.enhanceLevel >= 3) {
                // Downgrade by 1
                weapon.enhanceLevel = Math.max(0, weapon.enhanceLevel - 1);
                return {
                    success: false,
                    reason: 'downgrade',
                    message: `Enhancement failed. ${weapon.name} dropped to +${weapon.enhanceLevel}.`
                };
            } else {
                return {
                    success: false,
                    reason: 'fail',
                    message: `Enhancement failed, but the weapon is intact.`
                };
            }
        }
    },

    getArmorUpgradeCost(currentLevel) {
        const base = 8 + currentLevel * 6;
        return { gold: base, iron: Math.floor(base * 0.8) };
    },

    upgradeArmor() {
        const p = GameState.player;
        const cost = this.getArmorUpgradeCost(p.armor.enhanceLevel);
        if (!GameState.spendResources(cost.gold, cost.iron, 0)) {
            return { success: false, message: 'Not enough resources!' };
        }
        p.armor.enhanceLevel++;
        p.armor.defense += 2;
        return { success: true, message: `Armor upgraded to +${p.armor.enhanceLevel}!` };
    },

    getRecruitCost(unitType) {
        const template = Units.allied[unitType];
        if (!template) return null;
        const baseCost = template.recruitCost;
        const upkeepMod = Races[GameState.player.race].upkeepMod;
        return {
            gold: Math.ceil(baseCost.gold * upkeepMod),
            food: Math.ceil(baseCost.food * upkeepMod),
            iron: Math.ceil(baseCost.iron * upkeepMod)
        };
    },

    recruitUnit(slotIndex, count) {
        const p = GameState.player;
        const slot = p.army.slots[slotIndex];
        if (!slot) return { success: false, message: 'Invalid slot!' };

        const cost = this.getRecruitCost(slot.type);
        if (!cost) return { success: false, message: 'Unknown unit type!' };

        const actualCount = Math.min(count, slot.maxCount - slot.count);
        if (actualCount <= 0) return { success: false, message: 'Slot is full!' };

        const totalGold = cost.gold * actualCount;
        const totalFood = cost.food * actualCount;
        const totalIron = cost.iron * actualCount;

        if (!GameState.spendResources(totalGold, totalIron, totalFood)) {
            return { success: false, message: 'Not enough resources!' };
        }

        slot.count += actualCount;
        return { success: true, message: `Recruited ${actualCount} ${slot.name}!`, count: actualCount };
    },

    healWound() {
        const cost = { gold: 25 };
        if (GameState.player.wounds <= 0) return { success: false, message: 'No wounds to heal.' };
        if (!GameState.spendResources(cost.gold, 0, 0)) {
            return { success: false, message: 'Not enough gold!' };
        }
        GameState.removeWound();
        return { success: true, message: 'A wound has been healed.' };
    },

    convertResource(from, to, amount) {
        const rates = {
            'gold_iron': { from: 3, to: 2 },
            'gold_food': { from: 2, to: 3 },
            'iron_gold': { from: 2, to: 3 },
            'iron_food': { from: 2, to: 2 },
            'food_gold': { from: 3, to: 2 },
            'food_iron': { from: 3, to: 2 }
        };
        const key = `${from}_${to}`;
        const rate = rates[key];
        if (!rate) return { success: false, message: 'Invalid conversion.' };

        const totalFrom = rate.from * amount;
        const totalTo = rate.to * amount;
        const p = GameState.player;

        if (p[from] < totalFrom) return { success: false, message: `Not enough ${from}!` };

        p[from] -= totalFrom;
        p[to] += totalTo;
        return { success: true, message: `Converted ${totalFrom} ${from} → ${totalTo} ${to}.` };
    }
};
