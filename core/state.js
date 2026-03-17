const GameState = {
    screen: 'mainMenu',
    previousScreen: null,
    player: null,
    campaign: null,
    battle: null,
    flags: {},
    transitionAlpha: 0,
    transitioning: false,
    transitionTarget: null,
    transitionCallback: null,

    init() {
        this.player = null;
        this.campaign = null;
        this.battle = null;
        this.flags = {};
    },

    newPlayer(name, raceName, className, bannerColor, kingdomName) {
        const race = Races[raceName];
        const cls = Classes[className];
        const baseStats = {
            power: 10, vitality: 10, command: 10, agility: 10, focus: 10, resolve: 10
        };
        Object.entries(race.statBonuses).forEach(([k, v]) => baseStats[k] += v);
        Object.entries(cls.statBonuses).forEach(([k, v]) => baseStats[k] += v);

        this.player = {
            name,
            race: raceName,
            class: className,
            bannerColor,
            kingdomName,
            level: 1,
            xp: 0,
            xpToNext: 100,
            stats: baseStats,
            hp: 0,
            maxHp: 0,
            mana: 0,
            maxMana: 0,
            skills: cls.skills.map(s => ({ ...s, currentCd: 0 })),
            weapon: Utils.deepClone(Weapons.starterWeapons[className]),
            armor: { name: 'Leather Armor', tier: 0, defense: 2, enhanceLevel: 0 },
            wounds: 0,
            gold: 80,
            iron: 30,
            food: 40,
            army: this.createStarterArmy(raceName),
            inventory: [],
            relicFragments: 0,
            districtBonuses: [],
            totalBattles: 0,
            totalKills: 0
        };
        this.recalcDerived();
    },

    createStarterArmy(raceName) {
        const race = Races[raceName];
        const slots = [];
        race.starterArmy.forEach(entry => {
            const template = Units.allied[entry.type];
            slots.push({
                type: entry.type,
                name: template.name,
                count: entry.count,
                maxCount: entry.count + 4,
                veterancy: 0,
                equipTier: 0,
                morale: 75,
                ...Utils.deepClone(template.baseStats)
            });
        });
        return {
            slots,
            morale: 75,
            maxMorale: 100,
            formation: 'standard',
            orderCooldown: 0,
            currentOrder: 'push'
        };
    },

    recalcDerived() {
        const p = this.player;
        if (!p) return;
        const s = p.stats;
        p.maxHp = 80 + s.vitality * 8 + p.level * 5;
        p.maxMana = 30 + s.focus * 4 + p.level * 2;
        if (p.hp === 0) p.hp = p.maxHp;
        if (p.mana === 0) p.mana = p.maxMana;
        p.hp = Utils.clamp(p.hp, 0, p.maxHp);
        p.mana = Utils.clamp(p.mana, 0, p.maxMana);
    },

    addXP(amount) {
        const p = this.player;
        p.xp += amount;
        while (p.xp >= p.xpToNext) {
            p.xp -= p.xpToNext;
            p.level++;
            p.xpToNext = Math.floor(p.xpToNext * 1.4);

            // Only class-specific stat gains per level
            const cls = Classes[p.class];
            if (cls.levelBonuses) {
                Object.entries(cls.levelBonuses).forEach(([k, v]) => p.stats[k] += v);
            }
            this.recalcDerived();
            p.hp = p.maxHp;
            p.mana = p.maxMana;
        }
    },

    addGold(n) { this.player.gold += n; },
    addIron(n) { this.player.iron += n; },
    addFood(n) { this.player.food += n; },

    hasResources(gold, iron, food) {
        const p = this.player;
        return p.gold >= gold && p.iron >= iron && p.food >= food;
    },

    spendResources(gold, iron, food) {
        const p = this.player;
        if (!this.hasResources(gold, iron, food)) return false;
        p.gold -= gold;
        p.iron -= iron;
        p.food -= food;
        return true;
    },

    applyWound() {
        this.player.wounds = Math.min(this.player.wounds + 1, 3);
        this.player.hp = Math.floor(this.player.maxHp * (1 - this.player.wounds * 0.15));
    },

    removeWound() {
        this.player.wounds = Math.max(this.player.wounds - 1, 0);
        this.recalcDerived();
    },

    isGameOver() {
        const p = this.player;
        if (!p) return false;
        const allDead = p.army.slots.every(s => s.count <= 0);
        return p.wounds >= 3 && allDead;
    }
};
