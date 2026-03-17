const Weapons = {
    rarities: ['Common', 'Uncommon', 'Rare', 'Epic', 'Legendary'],
    rarityColors: {
        Common: '#a0a0a0',
        Uncommon: '#40c040',
        Rare: '#4080e0',
        Epic: '#a040e0',
        Legendary: '#e0a020'
    },

    rangedTypes: ['bow', 'staff', 'wand'],

    isRangedType(type) {
        return this.rangedTypes.includes(type);
    },

    classWeapons: {
        Warrior: ['sword', 'axe'],
        Ninja: ['daggers', 'sword'],
        Archer: ['bow'],
        Mage: ['staff', 'wand'],
        Tank: ['sword', 'axe']
    },

    canClassUse(className, weaponType) {
        const allowed = this.classWeapons[className];
        return allowed ? allowed.includes(weaponType) : true;
    },

    starterWeapons: {
        Warrior: {
            name: 'Iron Greatsword',
            type: 'sword',
            rarity: 'Common',
            baseDamage: 12,
            enhanceLevel: 0,
            bonus: {},
            desc: 'A reliable two-handed blade.'
        },
        Ninja: {
            name: 'Shadow Daggers',
            type: 'daggers',
            rarity: 'Common',
            baseDamage: 8,
            enhanceLevel: 0,
            bonus: { attackSpeed: 0.2 },
            desc: 'Twin daggers that strike faster than sight.'
        },
        Archer: {
            name: 'Hunting Bow',
            type: 'bow',
            rarity: 'Common',
            baseDamage: 11,
            enhanceLevel: 0,
            bonus: { focus: 1 },
            desc: 'A sturdy longbow carved from yew.'
        },
        Mage: {
            name: 'Apprentice Staff',
            type: 'staff',
            rarity: 'Common',
            baseDamage: 10,
            enhanceLevel: 0,
            bonus: { focus: 2 },
            desc: 'A staff humming with latent arcane energy.'
        },
        Tank: {
            name: 'Guardian Blade',
            type: 'sword',
            rarity: 'Common',
            baseDamage: 10,
            enhanceLevel: 0,
            bonus: { vitality: 2 },
            desc: 'A heavy blade made for those who stand firm.'
        }
    },

    templates: [
        { name: 'Iron Blade', type: 'sword', rarity: 'Common', baseDamage: 12, bonus: {} },
        { name: 'War Axe', type: 'axe', rarity: 'Common', baseDamage: 14, bonus: { power: 1 } },
        { name: 'Hunter\'s Bow', type: 'bow', rarity: 'Common', baseDamage: 10, bonus: { focus: 1 } },
        { name: 'Oak Staff', type: 'staff', rarity: 'Common', baseDamage: 9, bonus: { focus: 2 } },
        { name: 'Willow Wand', type: 'wand', rarity: 'Common', baseDamage: 8, bonus: { focus: 2 } },
        { name: 'Worn Lute', type: 'instrument', rarity: 'Common', baseDamage: 8, bonus: { focus: 1 } },
        { name: 'Mithril Edge', type: 'sword', rarity: 'Uncommon', baseDamage: 18, bonus: { agility: 2 } },
        { name: 'Serpent Fang', type: 'daggers', rarity: 'Uncommon', baseDamage: 14, bonus: { agility: 3, attackSpeed: 0.15 } },
        { name: 'Composite Bow', type: 'bow', rarity: 'Uncommon', baseDamage: 15, bonus: { focus: 2, agility: 1 } },
        { name: 'Runewood Staff', type: 'staff', rarity: 'Uncommon', baseDamage: 14, bonus: { focus: 3 } },
        { name: 'Crystal Wand', type: 'wand', rarity: 'Uncommon', baseDamage: 12, bonus: { focus: 3 } },
        { name: 'Silver Harp', type: 'instrument', rarity: 'Uncommon', baseDamage: 12, bonus: { focus: 2, agility: 1 } },
        { name: 'Flamebrand', type: 'sword', rarity: 'Rare', baseDamage: 24, bonus: { power: 3, fireDamage: 5 } },
        { name: 'Stormcleaver', type: 'axe', rarity: 'Rare', baseDamage: 28, bonus: { power: 4 } },
        { name: 'Galeforce Bow', type: 'bow', rarity: 'Rare', baseDamage: 22, bonus: { focus: 3, agility: 2 } },
        { name: 'Ember Staff', type: 'staff', rarity: 'Rare', baseDamage: 20, bonus: { focus: 4, fireDamage: 4 } },
        { name: 'Frostfire Wand', type: 'wand', rarity: 'Rare', baseDamage: 18, bonus: { focus: 5 } },
        { name: 'War Drum', type: 'instrument', rarity: 'Rare', baseDamage: 17, bonus: { focus: 3, power: 2 } },
        { name: 'Dragonbone Katana', type: 'katana', rarity: 'Epic', baseDamage: 32, bonus: { power: 3, agility: 3, fireDamage: 8 } },
        { name: 'Voidblade', type: 'sword', rarity: 'Epic', baseDamage: 35, bonus: { power: 5, focus: 3 } },
        { name: 'Doombow', type: 'bow', rarity: 'Epic', baseDamage: 30, bonus: { focus: 5, agility: 3 } },
        { name: 'Archmage\'s Staff', type: 'staff', rarity: 'Epic', baseDamage: 28, bonus: { focus: 6, fireDamage: 6 } },
        { name: 'Soulweaver Wand', type: 'wand', rarity: 'Epic', baseDamage: 25, bonus: { focus: 7, vitality: 3 } },
        { name: 'Dirge of Shadows', type: 'instrument', rarity: 'Epic', baseDamage: 24, bonus: { focus: 5, agility: 3 } },
        { name: 'Ashbringer', type: 'sword', rarity: 'Legendary', baseDamage: 45, bonus: { power: 8, vitality: 5, fireDamage: 12 } },
        { name: 'Starfall Longbow', type: 'bow', rarity: 'Legendary', baseDamage: 40, bonus: { focus: 8, agility: 5 } },
        { name: 'Staff of the Void', type: 'staff', rarity: 'Legendary', baseDamage: 38, bonus: { focus: 10, fireDamage: 10 } },
        { name: 'Symphony of Ruin', type: 'instrument', rarity: 'Legendary', baseDamage: 35, bonus: { focus: 8, power: 4, agility: 4 } }
    ],

    getWeaponDamage(weapon) {
        const enhanceMul = 1 + weapon.enhanceLevel * 0.08;
        return Math.floor(weapon.baseDamage * enhanceMul);
    },

    generateLootWeapon(level) {
        const roll = Math.random();
        let rarity;
        if (roll < 0.50) rarity = 'Common';
        else if (roll < 0.80) rarity = 'Uncommon';
        else if (roll < 0.95) rarity = 'Rare';
        else if (roll < 0.99) rarity = 'Epic';
        else rarity = 'Legendary';

        const playerClass = GameState.player ? GameState.player.class : null;
        let pool = Weapons.templates.filter(w => w.rarity === rarity);
        if (playerClass && this.classWeapons[playerClass]) {
            const classPool = pool.filter(w => this.canClassUse(playerClass, w.type));
            if (classPool.length > 0) pool = classPool;
        }
        if (pool.length === 0) return null;
        const template = Utils.pick(pool);
        return {
            ...Utils.deepClone(template),
            enhanceLevel: 0,
            desc: `A ${rarity.toLowerCase()} weapon found in battle.`
        };
    }
};
