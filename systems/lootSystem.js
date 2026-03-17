const LootSystem = {
    generateBattleLoot(nodeData, result) {
        const p = GameState.player;
        const race = Races[p.race];
        const level = nodeData.level || 1;
        const isElite = nodeData.type === 'elite';
        const isBoss = nodeData.type === 'boss';
        const isCapital = nodeData.type === 'capital';

        let goldBase = 15 + level * 8 + result.killCount * 2;
        let ironBase = 5 + level * 3 + result.killCount;
        let foodBase = 8 + level * 4;
        let xpBase = 20 + level * 15 + result.killCount * 3;

        if (isElite) { goldBase *= 1.5; xpBase *= 1.5; }
        if (isBoss) { goldBase *= 2.5; xpBase *= 3; ironBase *= 2; }
        if (isCapital) { goldBase *= 2; xpBase *= 2; }

        // Race bonuses
        if (race.goldBonus) goldBase = Math.floor(goldBase * (1 + race.goldBonus));

        // District bonuses
        const bonusGold = CampaignSystem.getDistrictBonusValue('gold');
        const bonusIron = CampaignSystem.getDistrictBonusValue('iron');
        const bonusFood = CampaignSystem.getDistrictBonusValue('food');
        goldBase += bonusGold;
        ironBase += bonusIron;
        foodBase += bonusFood;

        const gold = Math.floor(goldBase);
        const iron = Math.floor(ironBase);
        const food = Math.floor(foodBase);
        const xp = Math.floor(xpBase);

        const loot = { gold, iron, food, xp, weapon: null, relicFragment: false };

        // Weapon drop chance
        const weaponChance = isElite ? 40 : isBoss ? 80 : isCapital ? 50 : 15;
        if (Utils.chance(weaponChance)) {
            const biome = Districts.getCurrentBiome();
            loot.weapon = Weapons.generateLootWeapon(level, biome);
        }

        // Relic fragment from boss
        if (isBoss) {
            loot.relicFragment = true;
        }

        return loot;
    },

    applyLoot(loot) {
        const p = GameState.player;
        p.gold += loot.gold;
        p.iron += loot.iron;
        p.food += loot.food;
        GameState.addXP(loot.xp);
        if (loot.relicFragment) {
            p.relicFragments = (p.relicFragments || 0) + 1;
        }
    },

    applyDefeatPenalty() {
        const p = GameState.player;
        GameState.applyWound();
        p.army.morale = Utils.clamp(p.army.morale - 15, 0, 100);
        // Lose some resources
        p.gold = Math.floor(p.gold * 0.8);
        p.food = Math.max(0, p.food - 5);
    }
};
