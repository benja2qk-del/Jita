const Classes = {
    Warrior: {
        name: 'Warrior',
        color: '#c06030',
        description: 'A frontline champion built for sustained melee combat. Excels at cleaving through enemy ranks and holding the line.',
        flavor: 'Steel and resolve — the Warrior breaks what cannot be broken.',
        statBonuses: { power: 3, vitality: 2, command: 1, agility: 0, focus: -1, resolve: 1 },
        levelBonuses: { power: 1, vitality: 1 },
        attackRange: 50,
        attackSpeed: 0.9,
        moveSpeed: 160,
        skills: [
            {
                id: 'cleave',
                name: 'Cleave',
                desc: 'A wide slash that hits all enemies in front. Deals 80% power as damage.',
                key: 'KeyQ',
                keyLabel: 'Q',
                manaCost: 10,
                cooldown: 2.5,
                damage: 0.8,
                range: 70,
                aoe: true,
                icon: '⚔'
            },
            {
                id: 'charge',
                name: 'Charge',
                desc: 'Rush forward dealing 60% power and stunning the first enemy hit for 1s.',
                key: 'KeyW',
                keyLabel: 'W',
                manaCost: 12,
                cooldown: 5,
                damage: 0.6,
                range: 200,
                stun: 1.0,
                icon: '🛡'
            },
            {
                id: 'guardStance',
                name: 'Guard Stance',
                desc: 'Enter a defensive stance for 3s, reducing damage taken by 50% and boosting nearby ally morale.',
                key: 'KeyE',
                keyLabel: 'E',
                manaCost: 14,
                cooldown: 8,
                duration: 3,
                damageReduction: 0.5,
                moraleBoost: 10,
                icon: '🏰'
            }
        ]
    },

    Ninja: {
        name: 'Ninja',
        color: '#505050',
        description: 'A shadow-walking assassin who excels at disrupting enemy backlines and eliminating commanders.',
        flavor: 'You won\'t see the Ninja until the battle is already over.',
        statBonuses: { power: 1, vitality: -1, command: 0, agility: 4, focus: 1, resolve: 1 },
        levelBonuses: { agility: 2 },
        attackRange: 40,
        attackSpeed: 1.3,
        moveSpeed: 220,
        skills: [
            {
                id: 'shadowStep',
                name: 'Shadow Step',
                desc: 'Teleport behind the nearest enemy. Next attack deals 130% power and cannot miss.',
                key: 'KeyQ',
                keyLabel: 'Q',
                manaCost: 10,
                cooldown: 3,
                damage: 1.3,
                teleport: true,
                guaranteedHit: true,
                icon: '👤'
            },
            {
                id: 'smokeBomb',
                name: 'Smoke Bomb',
                desc: 'Drop a smoke cloud. Allies inside gain evasion +40% for 3s. Enemies lose accuracy.',
                key: 'KeyW',
                keyLabel: 'W',
                manaCost: 12,
                cooldown: 7,
                duration: 3,
                evasionBoost: 0.4,
                radius: 100,
                icon: '💨'
            },
            {
                id: 'chainAttack',
                name: 'Chain Attack',
                desc: 'Strike up to 4 nearby enemies in rapid succession. Each hit deals 40% power.',
                key: 'KeyE',
                keyLabel: 'E',
                manaCost: 14,
                cooldown: 5,
                damage: 0.4,
                hits: 4,
                range: 120,
                icon: '🔗'
            }
        ]
    },

    Archer: {
        name: 'Archer',
        color: '#40a040',
        description: 'A ranged specialist who rains death from a distance. Excels at kiting and picking off high-value targets.',
        flavor: 'Every arrow finds its mark. The Archer never wastes a shot.',
        statBonuses: { power: 1, vitality: 0, command: 1, agility: 3, focus: 2, resolve: 0 },
        levelBonuses: { agility: 1, focus: 1 },
        attackRange: 220,
        attackSpeed: 1.1,
        moveSpeed: 190,
        skills: [
            {
                id: 'powerShot',
                name: 'Power Shot',
                desc: 'A piercing arrow that hits the target for 130% and enemies directly behind.',
                key: 'KeyQ',
                keyLabel: 'Q',
                manaCost: 10,
                cooldown: 3,
                damage: 1.3,
                range: 280,
                piercing: true,
                icon: '🏹'
            },
            {
                id: 'volley',
                name: 'Volley',
                desc: 'Fire a rain of arrows hitting up to 5 enemies for 50% power each.',
                key: 'KeyW',
                keyLabel: 'W',
                manaCost: 18,
                cooldown: 6,
                damage: 0.5,
                hits: 5,
                range: 250,
                icon: '🌧'
            },
            {
                id: 'evasiveRoll',
                name: 'Evasive Roll',
                desc: 'Roll backward, gaining 50% evasion for 2s.',
                key: 'KeyE',
                keyLabel: 'E',
                manaCost: 12,
                cooldown: 5,
                range: 120,
                duration: 2,
                evasionBoost: 0.5,
                icon: '💨'
            }
        ]
    },

    Mage: {
        name: 'Mage',
        color: '#6040c0',
        description: 'A wielder of destructive arcane forces. Devastating AoE damage but fragile in close quarters.',
        flavor: 'Reality bends to the Mage\'s will — and so do those who oppose them.',
        statBonuses: { power: 0, vitality: -1, command: 1, agility: 0, focus: 5, resolve: 1 },
        levelBonuses: { focus: 2 },
        attackRange: 200,
        attackSpeed: 0.8,
        moveSpeed: 150,
        skills: [
            {
                id: 'fireball',
                name: 'Fireball',
                desc: 'Hurl a fireball that explodes on impact, dealing 120% focus as AoE damage.',
                key: 'KeyQ',
                keyLabel: 'Q',
                manaCost: 14,
                cooldown: 3.5,
                damage: 1.2,
                range: 250,
                aoe: true,
                splashRadius: 80,
                icon: '🔥'
            },
            {
                id: 'frostNova',
                name: 'Frost Nova',
                desc: 'Blast of frost around the Mage. Deals 80% focus and freezes enemies for 1.5s.',
                key: 'KeyW',
                keyLabel: 'W',
                manaCost: 20,
                cooldown: 7,
                damage: 0.8,
                radius: 100,
                freezeDuration: 1.5,
                slowFactor: 0.5,
                icon: '❄'
            },
            {
                id: 'arcaneBarrage',
                name: 'Arcane Barrage',
                desc: 'Fire 3 arcane bolts at different enemies, each dealing 70% focus.',
                key: 'KeyE',
                keyLabel: 'E',
                manaCost: 22,
                cooldown: 6,
                damage: 0.7,
                bolts: 3,
                range: 230,
                icon: '✨'
            }
        ]
    },

    Tank: {
        name: 'Tank',
        color: '#808040',
        description: 'An unyielding bulwark who absorbs damage and protects allies. Slow but nearly indestructible.',
        flavor: 'Behind the Tank, there is only safety. Before the Tank, there is only ruin.',
        statBonuses: { power: 1, vitality: 5, command: 1, agility: -2, focus: 0, resolve: 2 },
        levelBonuses: { vitality: 2 },
        attackRange: 45,
        attackSpeed: 0.7,
        moveSpeed: 130,
        skills: [
            {
                id: 'shieldBash',
                name: 'Shield Bash',
                desc: 'Bash the target dealing 90% power and stunning them for 1.5s.',
                key: 'KeyQ',
                keyLabel: 'Q',
                manaCost: 10,
                cooldown: 4,
                damage: 0.9,
                range: 55,
                stun: 1.5,
                icon: '🛡'
            },
            {
                id: 'taunt',
                name: 'Taunt',
                desc: 'Force nearby enemies to attack you for 3s. Gain increased defense while taunting.',
                key: 'KeyW',
                keyLabel: 'W',
                manaCost: 14,
                cooldown: 8,
                duration: 3,
                radius: 120,
                defenseBoost: 0.3,
                icon: '😤'
            },
            {
                id: 'ironWall',
                name: 'Iron Wall',
                desc: 'Become immovable for 4s. Take 40% less damage and boost nearby ally defense.',
                key: 'KeyE',
                keyLabel: 'E',
                manaCost: 20,
                cooldown: 10,
                duration: 4,
                damageReduction: 0.4,
                allyDefBoost: 5,
                radius: 100,
                icon: '🏰'
            }
        ]
    },

};
