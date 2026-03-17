const Units = {
    allied: {
        infantry: {
            name: 'Infantry',
            role: 'melee',
            color: '#5080c0',
            shape: 'square',
            baseStats: {
                hp: 50, maxHp: 50, attack: 9, defense: 6, speed: 65,
                attackRange: 30, attackCd: 1.1, size: 14
            },
            recruitCost: { gold: 10, food: 5, iron: 3 },
            desc: 'Frontline melee soldiers. Reliable and affordable.'
        },
        archer: {
            name: 'Archer',
            role: 'ranged',
            color: '#50b050',
            shape: 'triangle',
            baseStats: {
                hp: 28, maxHp: 28, attack: 10, defense: 2, speed: 55,
                attackRange: 200, attackCd: 1.6, size: 12
            },
            recruitCost: { gold: 12, food: 4, iron: 2 },
            desc: 'Ranged attackers. Fragile but deadly from a distance.'
        },
        cavalry: {
            name: 'Cavalry',
            role: 'melee',
            color: '#c0a040',
            shape: 'diamond',
            baseStats: {
                hp: 50, maxHp: 50, attack: 12, defense: 4, speed: 110,
                attackRange: 35, attackCd: 1.5, size: 16
            },
            recruitCost: { gold: 20, food: 10, iron: 5 },
            desc: 'Fast-moving heavy hitters. Excellent for flanking.'
        },
        brute: {
            name: 'Brute',
            role: 'melee',
            color: '#c05040',
            shape: 'hexagon',
            baseStats: {
                hp: 80, maxHp: 80, attack: 15, defense: 8, speed: 40,
                attackRange: 35, attackCd: 2.0, size: 20
            },
            recruitCost: { gold: 25, food: 12, iron: 8 },
            desc: 'Massive frontline tanks. Slow but extremely durable.'
        }
    },

    enemy: {
        goblin: {
            name: 'Goblin',
            role: 'melee',
            color: '#80a030',
            shape: 'square',
            baseStats: {
                hp: 25, maxHp: 25, attack: 6, defense: 2, speed: 70,
                attackRange: 25, attackCd: 1.0, size: 11
            },
            desc: 'Weak but fast. They overwhelm through numbers.'
        },
        orcWarrior: {
            name: 'Orc Warrior',
            role: 'melee',
            color: '#508030',
            shape: 'square',
            baseStats: {
                hp: 55, maxHp: 55, attack: 12, defense: 6, speed: 55,
                attackRange: 30, attackCd: 1.3, size: 16
            },
            desc: 'Strong and disciplined melee fighters.'
        },
        darkArcher: {
            name: 'Dark Archer',
            role: 'ranged',
            color: '#906030',
            shape: 'triangle',
            baseStats: {
                hp: 24, maxHp: 24, attack: 9, defense: 2, speed: 50,
                attackRange: 190, attackCd: 1.7, size: 12
            },
            desc: 'Enemy ranged units. Accurate and well-positioned.'
        },
        troll: {
            name: 'Troll',
            role: 'melee',
            color: '#408060',
            shape: 'hexagon',
            baseStats: {
                hp: 100, maxHp: 100, attack: 18, defense: 10, speed: 35,
                attackRange: 40, attackCd: 2.2, size: 22
            },
            desc: 'Hulking regenerating monsters. Kill them fast or don\'t bother.'
        }
    },

    bosses: {
        warlordGrimtusk: {
            name: 'Warlord Grimtusk',
            role: 'boss',
            color: '#c02020',
            shape: 'star',
            baseStats: {
                hp: 500, maxHp: 500, attack: 30, defense: 15, speed: 50,
                attackRange: 50, attackCd: 1.8, size: 32
            },
            skills: [
                { name: 'Warcry', cooldown: 12, effect: 'Boosts all allies attack by 30% for 5s' },
                { name: 'Crushing Blow', cooldown: 8, damage: 2.5, range: 60 },
                { name: 'Summon Minions', cooldown: 25, spawns: 'goblin', count: 3 }
            ],
            desc: 'The Warlord of the Broken Peaks. A fearsome orc commander.'
        }
    },

    getScaledEnemy(type, level) {
        const template = Units.enemy[type];
        if (!template) return null;
        const stats = Utils.deepClone(template.baseStats);
        const scale = 1 + (level - 1) * 0.15;
        stats.hp = Math.floor(stats.hp * scale);
        stats.maxHp = stats.hp;
        stats.attack = Math.floor(stats.attack * scale);
        stats.defense = Math.floor(stats.defense * scale);
        return { ...template, baseStats: stats };
    }
};
