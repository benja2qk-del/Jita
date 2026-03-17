const Races = {
    Human: {
        name: 'Human',
        color: '#3a7ecf',
        description: 'Resilient and adaptable. Humans gain bonus gold income and maintain balanced stats across the board.',
        flavor: 'The banners of the Free Kingdoms still fly. Where others falter, humanity endures.',
        statBonuses: { power: 1, vitality: 1, command: 2, agility: 0, focus: 0, resolve: 1 },
        passives: [
            { name: 'Trade Routes', desc: '+20% gold from battles' },
            { name: 'Balanced Training', desc: 'All stats grow evenly on level up' }
        ],
        goldBonus: 0.20,
        recruitGrowth: 1.0,
        upkeepMod: 1.0,
        starterArmy: [
            { type: 'infantry', count: 8 },
            { type: 'archer', count: 5 }
        ]
    },

    Elf: {
        name: 'Elf',
        color: '#2eb872',
        description: 'Swift and precise. Elves excel at ranged combat with superior evasion and movement speed.',
        flavor: 'The Sylvan Courts remember what the world has forgotten. Their arrows do not miss.',
        statBonuses: { power: 0, vitality: -1, command: 0, agility: 3, focus: 2, resolve: 1 },
        passives: [
            { name: 'Wind Walker', desc: '+15% movement speed for hero and army' },
            { name: 'Keen Sight', desc: 'Ranged units gain +10% accuracy' }
        ],
        goldBonus: 0.0,
        recruitGrowth: 0.9,
        upkeepMod: 0.9,
        speedBonus: 0.15,
        rangedAccuracy: 0.10,
        starterArmy: [
            { type: 'archer', count: 8 },
            { type: 'infantry', count: 4 }
        ]
    },

    Dragonkin: {
        name: 'Dragonkin',
        color: '#cf4a2a',
        description: 'Mighty and armored. Dragonkin have the highest health and armor but recruit slowly and cost more to maintain.',
        flavor: 'Born of dragonfire and ancient stone. Each Dragonkin warrior is worth three lesser soldiers.',
        statBonuses: { power: 3, vitality: 3, command: 0, agility: -1, focus: 0, resolve: 0 },
        passives: [
            { name: 'Scales of the Wyrm', desc: '+15% armor for hero and army' },
            { name: 'Dragonfire', desc: 'Fire-themed attacks deal bonus damage' }
        ],
        goldBonus: -0.10,
        recruitGrowth: 0.6,
        upkeepMod: 1.3,
        armorBonus: 0.15,
        fireDamage: 0.10,
        starterArmy: [
            { type: 'infantry', count: 6 },
            { type: 'brute', count: 2 }
        ]
    }
};
