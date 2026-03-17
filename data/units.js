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
        // ═══ FOREST / GREENHOLLOW enemies ═══
        goblin: {
            name: 'Goblin',
            role: 'melee',
            color: '#80a030',
            shape: 'square',
            biome: 'forest',
            baseStats: {
                hp: 25, maxHp: 25, attack: 6, defense: 2, speed: 70,
                attackRange: 25, attackCd: 1.0, size: 11
            },
            desc: 'Weak but fast. They overwhelm through numbers.'
        },
        forestBandit: {
            name: 'Forest Bandit',
            role: 'melee',
            color: '#5a7a3a',
            shape: 'square',
            biome: 'forest',
            baseStats: {
                hp: 40, maxHp: 40, attack: 8, defense: 4, speed: 62,
                attackRange: 28, attackCd: 1.15, size: 14
            },
            desc: 'Outlaws hiding among the trees. Quick with a blade.'
        },
        forestRanger: {
            name: 'Forest Ranger',
            role: 'ranged',
            color: '#3a6a2a',
            shape: 'triangle',
            biome: 'forest',
            baseStats: {
                hp: 26, maxHp: 26, attack: 10, defense: 2, speed: 58,
                attackRange: 195, attackCd: 1.5, size: 12
            },
            desc: 'Rogue archers who know the woods like the back of their hand.'
        },
        direwolf: {
            name: 'Dire Wolf',
            role: 'melee',
            color: '#6a6a7a',
            shape: 'diamond',
            biome: 'forest',
            baseStats: {
                hp: 35, maxHp: 35, attack: 11, defense: 3, speed: 95,
                attackRange: 26, attackCd: 0.9, size: 14
            },
            desc: 'Savage beasts that hunt in packs. Terrifyingly fast.'
        },
        treant: {
            name: 'Treant',
            role: 'melee',
            color: '#4a6830',
            shape: 'hexagon',
            biome: 'forest',
            baseStats: {
                hp: 90, maxHp: 90, attack: 14, defense: 12, speed: 28,
                attackRange: 38, attackCd: 2.4, size: 22
            },
            desc: 'Ancient trees awakened by dark magic. Nearly impervious to arrows.'
        },

        // ═══ DESERT / SUNSCAR enemies ═══
        desertRaider: {
            name: 'Desert Raider',
            role: 'melee',
            color: '#c09840',
            shape: 'square',
            biome: 'desert',
            baseStats: {
                hp: 42, maxHp: 42, attack: 10, defense: 4, speed: 72,
                attackRange: 28, attackCd: 1.1, size: 14
            },
            desc: 'Nomadic warriors hardened by the sands. Swift and ruthless.'
        },
        sandArcher: {
            name: 'Sand Archer',
            role: 'ranged',
            color: '#b08838',
            shape: 'triangle',
            biome: 'desert',
            baseStats: {
                hp: 28, maxHp: 28, attack: 11, defense: 2, speed: 54,
                attackRange: 200, attackCd: 1.6, size: 12
            },
            desc: 'Precision marksmen who blend with the dunes.'
        },
        scorpionRider: {
            name: 'Scorpion Rider',
            role: 'melee',
            color: '#a07830',
            shape: 'diamond',
            biome: 'desert',
            baseStats: {
                hp: 55, maxHp: 55, attack: 13, defense: 6, speed: 80,
                attackRange: 32, attackCd: 1.4, size: 16
            },
            desc: 'Heavily armored riders mounted on giant scorpions.'
        },
        dustWraith: {
            name: 'Dust Wraith',
            role: 'ranged',
            color: '#c0a060',
            shape: 'triangle',
            biome: 'desert',
            baseStats: {
                hp: 30, maxHp: 30, attack: 14, defense: 1, speed: 50,
                attackRange: 210, attackCd: 1.8, size: 13
            },
            desc: 'Cursed spirits of desert travelers. Their touch drains life.'
        },
        sandGolem: {
            name: 'Sand Golem',
            role: 'melee',
            color: '#d0b060',
            shape: 'hexagon',
            biome: 'desert',
            baseStats: {
                hp: 110, maxHp: 110, attack: 16, defense: 10, speed: 30,
                attackRange: 40, attackCd: 2.2, size: 24
            },
            desc: 'Massive constructs of living sand. Shatter them before they reform.'
        },

        // ═══ VOLCANIC / ASHEN enemies ═══
        orcWarrior: {
            name: 'Orc Warrior',
            role: 'melee',
            color: '#508030',
            shape: 'square',
            biome: 'volcanic',
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
            biome: 'volcanic',
            baseStats: {
                hp: 24, maxHp: 24, attack: 9, defense: 2, speed: 50,
                attackRange: 190, attackCd: 1.7, size: 12
            },
            desc: 'Enemy ranged units. Accurate and well-positioned.'
        },
        flameCultist: {
            name: 'Flame Cultist',
            role: 'ranged',
            color: '#c04828',
            shape: 'triangle',
            biome: 'volcanic',
            baseStats: {
                hp: 32, maxHp: 32, attack: 15, defense: 2, speed: 45,
                attackRange: 180, attackCd: 2.0, size: 13
            },
            desc: 'Fanatics who channel volcanic fire into devastating bolts.'
        },
        obsidianKnight: {
            name: 'Obsidian Knight',
            role: 'melee',
            color: '#3a3a3a',
            shape: 'square',
            biome: 'volcanic',
            baseStats: {
                hp: 70, maxHp: 70, attack: 14, defense: 10, speed: 45,
                attackRange: 30, attackCd: 1.4, size: 17
            },
            desc: 'Warriors clad in volcanic glass. Their armor is nearly impenetrable.'
        },
        troll: {
            name: 'Troll',
            role: 'melee',
            color: '#408060',
            shape: 'hexagon',
            biome: 'volcanic',
            baseStats: {
                hp: 100, maxHp: 100, attack: 18, defense: 10, speed: 35,
                attackRange: 40, attackCd: 2.2, size: 22
            },
            desc: 'Hulking regenerating monsters. Kill them fast or don\'t bother.'
        },
        lavaBrute: {
            name: 'Lava Brute',
            role: 'melee',
            color: '#c04020',
            shape: 'hexagon',
            biome: 'volcanic',
            baseStats: {
                hp: 120, maxHp: 120, attack: 20, defense: 12, speed: 30,
                attackRange: 42, attackCd: 2.4, size: 26
            },
            desc: 'Molten-skinned giants from the caldera depths. Contact burns everything.'
        }
    },

    bosses: {
        forestWitch: {
            name: 'The Thornmother',
            role: 'boss',
            color: '#2a8a30',
            shape: 'star',
            biome: 'forest',
            baseStats: {
                hp: 400, maxHp: 400, attack: 22, defense: 10, speed: 40,
                attackRange: 180, attackCd: 2.0, size: 30
            },
            skills: [
                { name: 'Thorn Barrage', cooldown: 8, damage: 1.8, range: 200 },
                { name: 'Entangle', cooldown: 15, effect: 'Roots all enemies for 2s' },
                { name: 'Summon Wolves', cooldown: 22, spawns: 'direwolf', count: 3 }
            ],
            desc: 'An ancient druid corrupted by the forest\'s rage. Roots and thorns obey her will.'
        },
        desertKing: {
            name: 'Pharaoh Solkhet',
            role: 'boss',
            color: '#e0c030',
            shape: 'star',
            biome: 'desert',
            baseStats: {
                hp: 550, maxHp: 550, attack: 28, defense: 14, speed: 45,
                attackRange: 60, attackCd: 1.6, size: 32
            },
            skills: [
                { name: 'Sandstorm', cooldown: 10, damage: 1.5, range: 250, aoe: true },
                { name: 'Royal Decree', cooldown: 14, effect: 'All allies gain +40% attack for 5s' },
                { name: 'Summon Guard', cooldown: 20, spawns: 'desertRaider', count: 4 }
            ],
            desc: 'An undead pharaoh risen from the dunes. His golden mask radiates ancient power.'
        },
        warlordGrimtusk: {
            name: 'Warlord Grimtusk',
            role: 'boss',
            color: '#c02020',
            shape: 'star',
            biome: 'volcanic',
            baseStats: {
                hp: 650, maxHp: 650, attack: 32, defense: 16, speed: 50,
                attackRange: 50, attackCd: 1.8, size: 34
            },
            skills: [
                { name: 'Warcry', cooldown: 12, effect: 'Boosts all allies attack by 30% for 5s' },
                { name: 'Crushing Blow', cooldown: 8, damage: 2.5, range: 60 },
                { name: 'Summon Minions', cooldown: 25, spawns: 'orcWarrior', count: 3 }
            ],
            desc: 'The Warlord of the Broken Peaks. A fearsome orc commander ruling from his throne of bones.'
        }
    },

    // ═══ Race-specific troop visual configs ═══
    raceAppearance: {
        Human: {
            skin: '#e0d0b8', hair: '#5a3820', banner: '#3a6abd',
            armorTint: null, // default steel
            troopNames: { infantry: 'Man-at-Arms', archer: 'Longbowman', cavalry: 'Knight', brute: 'Champion' }
        },
        Elf: {
            skin: '#f0e8d8', hair: '#c0b070', banner: '#2eb872',
            armorTint: '#2a6a38',
            troopNames: { infantry: 'Blade Dancer', archer: 'Sylvan Archer', cavalry: 'Stag Rider', brute: 'War Treant' }
        },
        Dragonkin: {
            skin: '#c08a60', hair: '#1a0808', banner: '#cf4a2a',
            armorTint: '#6a3020',
            troopNames: { infantry: 'Scale Guard', archer: 'Fire Archer', cavalry: 'Drake Rider', brute: 'Wyvern' }
        }
    },

    // ═══ Enemy appearance configs per biome ═══
    enemyAppearance: {
        // Forest enemies
        goblin:         { skin: '#8aaa42', hair: null, armor: '#5a4828', armorLight: '#6a5838', pants: '#3a3818', boots: '#2a2810', weapon: 'dagger', shield: false, earPointy: true, small: true },
        forestBandit:   { skin: '#c0a070', hair: '#5a3820', armor: '#4a5a2a', armorLight: '#5a6a3a', pants: '#3a3820', boots: '#3a2a18', weapon: 'sword', shield: false, hood: true },
        forestRanger:   { skin: '#b09868', hair: '#4a3018', armor: '#3a5a28', armorLight: '#4a6a38', pants: '#2a3818', boots: '#3a2a18', weapon: 'bow', shield: false, quiver: true, hood: true },
        direwolf:       { skin: '#8a8a9a', hair: null, armor: null, pants: null, boots: null, weapon: null, shield: false, beast: true, wolfForm: true },
        treant:         { skin: '#5a7a3a', hair: null, armor: '#4a5828', armorLight: '#5a6838', pants: '#3a4818', boots: '#2a3810', weapon: 'club', shield: false, bulky: true, bark: true },

        // Desert enemies
        desertRaider:   { skin: '#c09858', hair: '#2a1808', armor: '#b09030', armorLight: '#c0a040', pants: '#8a7030', boots: '#6a5020', weapon: 'scimitar', shield: true, turban: true },
        sandArcher:     { skin: '#b89050', hair: '#1a1008', armor: '#a08028', armorLight: '#b09038', pants: '#8a6828', boots: '#6a4818', weapon: 'bow', shield: false, quiver: true, turban: true },
        scorpionRider:  { skin: '#b08a48', hair: '#1a0808', armor: '#8a6020', armorLight: '#a07830', pants: '#6a4818', boots: '#5a3810', weapon: 'lance', shield: true, mounted: true, shoulderPad: true },
        dustWraith:     { skin: '#c0b890', hair: null, armor: '#8a7a5a', armorLight: '#a09068', pants: '#6a5a3a', boots: '#5a4a2a', weapon: 'staff', shield: false, ghostly: true, robe: true },
        sandGolem:      { skin: '#d0b870', hair: null, armor: '#c0a858', armorLight: '#d0b868', pants: '#b09848', boots: '#a08838', weapon: 'fist', shield: false, bulky: true, rocky: true },

        // Volcanic enemies
        orcWarrior:     { skin: '#4a7a32', hair: '#1a1810', armor: '#5a5848', armorLight: '#6a6858', pants: '#3a3828', boots: '#2a2818', weapon: 'axe', shield: true, helmetColor: '#5a5838', shoulderPad: true, tusks: true },
        darkArcher:     { skin: '#7a6050', hair: '#1a0a08', armor: '#3a2828', armorLight: '#5a3838', pants: '#2a1818', boots: '#1a0a08', weapon: 'bow', shield: false, helmetColor: '#3a2020', quiver: true },
        flameCultist:   { skin: '#8a6048', hair: null, armor: '#6a2018', armorLight: '#8a3828', pants: '#3a1810', boots: '#2a1008', weapon: 'staff', shield: false, robe: true, cult: true, glowEyes: true, eyeColor: '#ff4400' },
        obsidianKnight: { skin: '#5a5a5a', hair: '#1a1a1a', armor: '#2a2a30', armorLight: '#3a3a40', pants: '#1a1a20', boots: '#0a0a10', weapon: 'sword', shield: true, helmetColor: '#2a2a38', shoulderPad: true, heavy: true },
        troll:          { skin: '#4a8868', hair: null, armor: '#4a5838', armorLight: '#5a6848', pants: '#3a4828', boots: '#2a3818', weapon: 'club', shield: false, bulky: true, tusks: true },
        lavaBrute:      { skin: '#aa4020', hair: null, armor: '#5a2018', armorLight: '#7a3028', pants: '#3a1810', boots: '#2a1008', weapon: 'fist', shield: false, bulky: true, glowEyes: true, eyeColor: '#ff6600', lavaGlow: true }
    },

    // ═══ Boss appearance configs ═══
    bossAppearance: {
        forestWitch: {
            skin: '#7aaa60', hair: '#2a5a18', armor: '#3a5a20', armorLight: '#4a6a30',
            pants: '#2a3818', boots: '#1a2810', weapon: 'staff', shield: false,
            robe: true, hat: true, capeColor: '#2a5a18', glowEyes: true, eyeColor: '#40ff60'
        },
        desertKing: {
            skin: '#c0a050', hair: null, armor: '#c0a020', armorLight: '#d0b030',
            pants: '#8a6020', boots: '#6a4018', weapon: 'scimitar', shield: false,
            helmetColor: '#e0c030', shoulderPad: true, capeColor: '#8a6020',
            heavy: true, glowEyes: true, eyeColor: '#ffe040'
        },
        warlordGrimtusk: {
            skin: '#5a8a3a', hair: null, armor: '#5a3020', armorLight: '#7a4830',
            pants: '#3a2a1a', boots: '#2a1a0a', weapon: 'axe', shield: false,
            helmetColor: '#6a4020', shoulderPad: true, bulky: true, earPointy: true,
            capeColor: '#4a1a0a', tusks: true
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
    },

    getEnemyAppearance(type) {
        return Units.enemyAppearance[type] || {
            skin: '#c0a080', armor: '#666', armorLight: '#888', pants: '#333',
            boots: '#2a1a0a', weapon: 'sword', shield: false
        };
    },

    getBossAppearance(bossKey) {
        return Units.bossAppearance[bossKey] || Units.bossAppearance.warlordGrimtusk;
    }
};
