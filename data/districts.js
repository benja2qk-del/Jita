const Districts = {
    region: {
        name: 'The Broken Peaks',
        description: 'A shattered mountain region ruled by warring orc clans and dark creatures.',
        districts: ['greenhollow', 'ironpass', 'grimspire']
    },

    data: {
        greenhollow: {
            name: 'Greenhollow',
            description: 'Fertile lowlands overrun by goblin raiders.',
            color: '#3a7030',
            difficulty: 1,
            bonus: { type: 'food', desc: '+10 food after each battle', value: 10 },
            nodes: [
                { id: 'gh0', type: 'battle', name: 'Goblin Outpost', x: 0.15, y: 0.50, enemies: [{ type: 'goblin', count: 10 }], level: 1, next: ['gh1', 'gh2'] },
                { id: 'gh1', type: 'blacksmith', name: 'Roadside Smithy', x: 0.30, y: 0.30, next: ['gh3'] },
                { id: 'gh2', type: 'battle', name: 'Goblin Camp', x: 0.30, y: 0.70, enemies: [{ type: 'goblin', count: 14 }, { type: 'darkArcher', count: 3 }], level: 1, next: ['gh3', 'gh4'] },
                { id: 'gh3', type: 'tavern', name: 'Hollow\'s Tavern', x: 0.50, y: 0.35, next: ['gh5'] },
                { id: 'gh4', type: 'event', name: 'Abandoned Cart', x: 0.50, y: 0.65, eventId: 'abandonedCart', next: ['gh5'] },
                { id: 'gh5', type: 'elite', name: 'Goblin Chieftain', x: 0.70, y: 0.50, enemies: [{ type: 'goblin', count: 12 }, { type: 'orcWarrior', count: 3 }], level: 2, next: ['gh6'] },
                { id: 'gh6', type: 'capital', name: 'Greenhollow Keep', x: 0.88, y: 0.50, enemies: [{ type: 'orcWarrior', count: 6 }, { type: 'darkArcher', count: 4 }, { type: 'goblin', count: 8 }], level: 2, next: [] }
            ]
        },

        ironpass: {
            name: 'Iron Pass',
            description: 'A treacherous mountain pass held by orc war-bands.',
            color: '#6a5a4a',
            difficulty: 2,
            bonus: { type: 'iron', desc: '+8 iron after each battle', value: 8 },
            nodes: [
                { id: 'ip0', type: 'battle', name: 'Pass Entrance', x: 0.12, y: 0.50, enemies: [{ type: 'orcWarrior', count: 6 }, { type: 'goblin', count: 8 }], level: 2, next: ['ip1', 'ip2'] },
                { id: 'ip1', type: 'healer', name: 'Mountain Hermit', x: 0.28, y: 0.30, next: ['ip3'] },
                { id: 'ip2', type: 'barracks', name: 'Mercenary Camp', x: 0.28, y: 0.70, next: ['ip4'] },
                { id: 'ip3', type: 'battle', name: 'Ambush Point', x: 0.47, y: 0.30, enemies: [{ type: 'darkArcher', count: 8 }, { type: 'orcWarrior', count: 4 }], level: 3, next: ['ip5'] },
                { id: 'ip4', type: 'market', name: 'Smuggler\'s Den', x: 0.47, y: 0.70, next: ['ip5'] },
                { id: 'ip5', type: 'elite', name: 'Orc Warlord Camp', x: 0.68, y: 0.50, enemies: [{ type: 'orcWarrior', count: 8 }, { type: 'troll', count: 1 }, { type: 'darkArcher', count: 4 }], level: 3, next: ['ip6'] },
                { id: 'ip6', type: 'capital', name: 'Iron Gate Fortress', x: 0.88, y: 0.50, enemies: [{ type: 'orcWarrior', count: 10 }, { type: 'troll', count: 2 }, { type: 'darkArcher', count: 6 }], level: 3, next: [] }
            ]
        },

        grimspire: {
            name: 'Grimspire',
            description: 'The dark heart of the Broken Peaks. Warlord Grimtusk rules from his throne of bones.',
            color: '#4a2a2a',
            difficulty: 3,
            bonus: { type: 'gold', desc: '+15 gold after each battle', value: 15 },
            nodes: [
                { id: 'gs0', type: 'battle', name: 'Outer Defenses', x: 0.12, y: 0.50, enemies: [{ type: 'orcWarrior', count: 10 }, { type: 'darkArcher', count: 6 }], level: 3, next: ['gs1', 'gs2'] },
                { id: 'gs1', type: 'blacksmith', name: 'War Forge', x: 0.28, y: 0.30, next: ['gs3'] },
                { id: 'gs2', type: 'event', name: 'Ruined Shrine', x: 0.28, y: 0.70, eventId: 'ruinedShrine', next: ['gs4'] },
                { id: 'gs3', type: 'battle', name: 'Troll Warren', x: 0.47, y: 0.30, enemies: [{ type: 'troll', count: 3 }, { type: 'goblin', count: 10 }], level: 4, next: ['gs5'] },
                { id: 'gs4', type: 'healer', name: 'Dark Apothecary', x: 0.47, y: 0.70, next: ['gs5'] },
                { id: 'gs5', type: 'elite', name: 'Grimtusk\'s Guard', x: 0.68, y: 0.50, enemies: [{ type: 'orcWarrior', count: 12 }, { type: 'troll', count: 2 }, { type: 'darkArcher', count: 6 }], level: 4, next: ['gs6'] },
                { id: 'gs6', type: 'boss', name: 'Grimtusk\'s Throne', x: 0.88, y: 0.50, boss: 'warlordGrimtusk', enemies: [{ type: 'orcWarrior', count: 8 }, { type: 'troll', count: 2 }], level: 5, next: [] }
            ]
        }
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
