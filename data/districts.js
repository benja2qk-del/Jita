const Districts = {
    region: {
        name: 'The Shattered Dominion',
        description: 'A war-torn land spanning enchanted forests, scorching deserts, and volcanic wastelands.',
        districts: ['greenhollow', 'sunscar', 'grimspire']
    },

    data: {
        greenhollow: {
            name: 'Greenhollow',
            description: 'An ancient forest overrun by goblin tribes, corrupted beasts, and outlaws hiding among the roots.',
            color: '#3a7030',
            biome: 'forest',
            difficulty: 1,
            bonus: { type: 'food', desc: '+10 food after each battle', value: 10 },
            nodes: [
                { id: 'gh0', type: 'battle', name: 'Goblin Outpost', x: 0.12, y: 0.50, enemies: [{ type: 'goblin', count: 10 }], level: 1, next: ['gh1', 'gh2'] },
                { id: 'gh1', type: 'blacksmith', name: 'Roadside Smithy', x: 0.25, y: 0.28, next: ['gh3'] },
                { id: 'gh2', type: 'battle', name: 'Bandit Hideout', x: 0.25, y: 0.72, enemies: [{ type: 'forestBandit', count: 6 }, { type: 'forestRanger', count: 4 }], level: 1, next: ['gh4'] },
                { id: 'gh3', type: 'event', name: 'Overgrown Shrine', x: 0.40, y: 0.30, eventId: 'forestShrine', next: ['gh5'] },
                { id: 'gh4', type: 'battle', name: 'Wolf Den', x: 0.40, y: 0.68, enemies: [{ type: 'direwolf', count: 5 }, { type: 'goblin', count: 6 }], level: 2, next: ['gh5'] },
                { id: 'gh5', type: 'tavern', name: 'Hollow\'s Rest', x: 0.55, y: 0.50, next: ['gh6', 'gh7'] },
                { id: 'gh6', type: 'battle', name: 'Treant Glade', x: 0.70, y: 0.35, enemies: [{ type: 'treant', count: 2 }, { type: 'forestRanger', count: 5 }], level: 2, next: ['gh8'] },
                { id: 'gh7', type: 'barracks', name: 'Ranger Camp', x: 0.70, y: 0.65, next: ['gh8'] },
                { id: 'gh8', type: 'elite', name: 'Corrupted Grove', x: 0.82, y: 0.50, enemies: [{ type: 'treant', count: 3 }, { type: 'direwolf', count: 4 }, { type: 'forestRanger', count: 4 }], level: 3, next: ['gh9'] },
                { id: 'gh9', type: 'boss', name: 'The Thornmother\'s Lair', x: 0.92, y: 0.50, boss: 'forestWitch', enemies: [{ type: 'treant', count: 2 }, { type: 'direwolf', count: 3 }], level: 3, next: [] }
            ]
        },

        sunscar: {
            name: 'Sunscar Wastes',
            description: 'A blistering desert ruled by raiders, undead pharaohs, and sand-dwelling monstrosities.',
            color: '#c0a040',
            biome: 'desert',
            difficulty: 2,
            bonus: { type: 'gold', desc: '+12 gold after each battle', value: 12 },
            nodes: [
                { id: 'ss0', type: 'battle', name: 'Oasis Ambush', x: 0.12, y: 0.50, enemies: [{ type: 'desertRaider', count: 8 }, { type: 'sandArcher', count: 4 }], level: 2, next: ['ss1', 'ss2'] },
                { id: 'ss1', type: 'healer', name: 'Desert Hermit', x: 0.25, y: 0.28, next: ['ss3'] },
                { id: 'ss2', type: 'battle', name: 'Scorpion Nest', x: 0.25, y: 0.72, enemies: [{ type: 'scorpionRider', count: 3 }, { type: 'desertRaider', count: 5 }], level: 2, next: ['ss4'] },
                { id: 'ss3', type: 'event', name: 'Buried Temple', x: 0.40, y: 0.30, eventId: 'buriedTemple', next: ['ss5'] },
                { id: 'ss4', type: 'market', name: 'Caravan Market', x: 0.40, y: 0.68, next: ['ss5'] },
                { id: 'ss5', type: 'battle', name: 'Wraith Canyon', x: 0.55, y: 0.50, enemies: [{ type: 'dustWraith', count: 5 }, { type: 'sandArcher', count: 4 }], level: 3, next: ['ss6', 'ss7'] },
                { id: 'ss6', type: 'blacksmith', name: 'Dune Forge', x: 0.70, y: 0.35, next: ['ss8'] },
                { id: 'ss7', type: 'battle', name: 'Golem Quarry', x: 0.70, y: 0.65, enemies: [{ type: 'sandGolem', count: 2 }, { type: 'desertRaider', count: 6 }], level: 3, next: ['ss8'] },
                { id: 'ss8', type: 'elite', name: 'The Sun Gate', x: 0.82, y: 0.50, enemies: [{ type: 'scorpionRider', count: 4 }, { type: 'sandGolem', count: 1 }, { type: 'sandArcher', count: 5 }], level: 4, next: ['ss9'] },
                { id: 'ss9', type: 'boss', name: 'Pharaoh\'s Throne', x: 0.92, y: 0.50, boss: 'desertKing', enemies: [{ type: 'desertRaider', count: 6 }, { type: 'dustWraith', count: 3 }], level: 4, next: [] }
            ]
        },

        grimspire: {
            name: 'Grimspire Caldera',
            description: 'The volcanic heart of the Shattered Dominion. Warlord Grimtusk rules from his throne of bones.',
            color: '#4a2a2a',
            biome: 'volcanic',
            difficulty: 3,
            bonus: { type: 'iron', desc: '+10 iron after each battle', value: 10 },
            nodes: [
                { id: 'gs0', type: 'battle', name: 'Outer Defenses', x: 0.12, y: 0.50, enemies: [{ type: 'orcWarrior', count: 8 }, { type: 'darkArcher', count: 5 }], level: 3, next: ['gs1', 'gs2'] },
                { id: 'gs1', type: 'blacksmith', name: 'War Forge', x: 0.25, y: 0.28, next: ['gs3'] },
                { id: 'gs2', type: 'event', name: 'Ruined Shrine', x: 0.25, y: 0.72, eventId: 'volcanicRift', next: ['gs4'] },
                { id: 'gs3', type: 'battle', name: 'Cultist Sanctum', x: 0.40, y: 0.30, enemies: [{ type: 'flameCultist', count: 6 }, { type: 'obsidianKnight', count: 3 }], level: 3, next: ['gs5'] },
                { id: 'gs4', type: 'healer', name: 'Dark Apothecary', x: 0.40, y: 0.68, next: ['gs5'] },
                { id: 'gs5', type: 'battle', name: 'Obsidian Bridge', x: 0.55, y: 0.50, enemies: [{ type: 'obsidianKnight', count: 5 }, { type: 'flameCultist', count: 4 }, { type: 'darkArcher', count: 4 }], level: 4, next: ['gs6', 'gs7'] },
                { id: 'gs6', type: 'barracks', name: 'Mercenary Camp', x: 0.70, y: 0.35, next: ['gs8'] },
                { id: 'gs7', type: 'battle', name: 'Troll Warren', x: 0.70, y: 0.65, enemies: [{ type: 'troll', count: 3 }, { type: 'lavaBrute', count: 1 }], level: 4, next: ['gs8'] },
                { id: 'gs8', type: 'elite', name: 'Grimtusk\'s Guard', x: 0.82, y: 0.50, enemies: [{ type: 'orcWarrior', count: 10 }, { type: 'troll', count: 2 }, { type: 'flameCultist', count: 4 }, { type: 'lavaBrute', count: 1 }], level: 5, next: ['gs9'] },
                { id: 'gs9', type: 'boss', name: 'Grimtusk\'s Throne', x: 0.92, y: 0.50, boss: 'warlordGrimtusk', enemies: [{ type: 'orcWarrior', count: 6 }, { type: 'troll', count: 2 }, { type: 'lavaBrute', count: 1 }], level: 5, next: [] }
            ]
        }
    },

    getBiome(districtKey) {
        const d = Districts.data[districtKey];
        return d ? d.biome : 'forest';
    },

    getCurrentBiome() {
        if (GameState.campaign && GameState.campaign.currentDistrict) {
            return Districts.getBiome(GameState.campaign.currentDistrict);
        }
        return 'forest';
    },

    getNodeTypeIcon(type) {
        const icons = {
            battle: '⚔', elite: '💀', boss: '👑',
            blacksmith: '🔨', barracks: '🏕', tavern: '🍺',
            healer: '❤', market: '💰', event: '❓', capital: '🏰'
        };
        return icons[type] || '?';
    },

    getNodeTypeColor(type) {
        const colors = {
            battle: '#c04040', elite: '#e06020', boss: '#ff3030',
            blacksmith: '#8080a0', barracks: '#6080a0', tavern: '#c0a040',
            healer: '#40c060', market: '#e0c040', event: '#8060c0', capital: '#e0c060'
        };
        return colors[type] || '#808080';
    }
};
