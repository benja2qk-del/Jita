const BattleSystem = {
    battlefield: null,

    initBattle(nodeData) {
        const p = GameState.player;
        const cls = Classes[p.class];
        const race = Races[p.race];

        const allies = [];
        const enemies = [];

        // Spawn allied units
        let allyY = 320;
        p.army.slots.forEach(slot => {
            const template = Units.allied[slot.type];
            if (!template || slot.count <= 0) return;
            for (let i = 0; i < slot.count; i++) {
                const speedMod = race.speedBonus ? (1 + race.speedBonus) : 1;
                const armorMod = race.armorBonus ? (1 + race.armorBonus) : 1;
                allies.push({
                    id: Utils.uid(),
                    type: slot.type,
                    name: template.name,
                    side: 'ally',
                    role: template.role,
                    color: template.color,
                    shape: template.shape,
                    x: Utils.rand(40, 140),
                    y: allyY + Utils.rand(-15, 15),
                    hp: slot.hp || template.baseStats.hp,
                    maxHp: slot.maxHp || template.baseStats.maxHp,
                    attack: template.baseStats.attack + slot.veterancy * 2 + slot.equipTier * 2,
                    defense: Math.floor((template.baseStats.defense + slot.equipTier) * armorMod),
                    speed: template.baseStats.speed * speedMod,
                    attackRange: template.baseStats.attackRange,
                    attackCd: template.baseStats.attackCd,
                    size: template.baseStats.size,
                    attackTimer: Math.random() * 0.5,
                    target: null,
                    state: 'advance',
                    alive: true,
                    vx: 0, vy: 0,
                    stunTimer: 0,
                    flashTimer: 0,
                    // Animation
                    animState: 'idle',
                    animTimer: Math.random() * 6,
                    displayHp: slot.hp || template.baseStats.hp,
                    facingRight: true,
                    deathTimer: 0,
                    attackAnimTimer: 0,
                    hurtTimer: 0,
                    kbx: 0, kby: 0,
                    veterancy: slot.veterancy || 0,
                    equipTier: slot.equipTier || 0
                });
                allyY += 28;
                if (allyY > 650) allyY = 330;
            }
        });

        // Spawn enemy units
        let enemyY = 320;
        const nodeLevel = nodeData.level || 1;
        (nodeData.enemies || []).forEach(entry => {
            const scaled = Units.getScaledEnemy(entry.type, nodeLevel);
            if (!scaled) return;
            for (let i = 0; i < entry.count; i++) {
                const stats = scaled.baseStats;
                enemies.push({
                    id: Utils.uid(),
                    type: entry.type,
                    name: scaled.name,
                    side: 'enemy',
                    role: scaled.role,
                    color: scaled.color,
                    shape: scaled.shape,
                    x: Utils.rand(Renderer.w - 160, Renderer.w - 60),
                    y: enemyY + Utils.rand(-15, 15),
                    hp: stats.hp,
                    maxHp: stats.maxHp,
                    attack: stats.attack,
                    defense: stats.defense,
                    speed: stats.speed,
                    attackRange: stats.attackRange,
                    attackCd: stats.attackCd,
                    size: stats.size,
                    attackTimer: Math.random() * 0.8,
                    target: null,
                    state: 'advance',
                    alive: true,
                    vx: 0, vy: 0,
                    stunTimer: 0,
                    flashTimer: 0,
                    animState: 'idle',
                    animTimer: Math.random() * 6,
                    displayHp: stats.hp,
                    facingRight: false,
                    deathTimer: 0,
                    attackAnimTimer: 0,
                    hurtTimer: 0,
                    kbx: 0, kby: 0,
                    enemyLevel: nodeLevel
                });
                enemyY += 26;
                if (enemyY > 650) enemyY = 330;
            }
        });

        // Spawn Boss
        let boss = null;
        if (nodeData.boss) {
            const bossData = Units.bosses[nodeData.boss];
            if (bossData) {
                const bs = bossData.baseStats;
                const scale = 1 + (nodeLevel - 1) * 0.2;
                boss = {
                    id: Utils.uid(),
                    type: nodeData.boss,
                    name: bossData.name,
                    side: 'enemy',
                    role: 'boss',
                    color: bossData.color,
                    shape: bossData.shape,
                    x: Renderer.w - 100,
                    y: 470,
                    hp: Math.floor(bs.hp * scale),
                    maxHp: Math.floor(bs.maxHp * scale),
                    attack: Math.floor(bs.attack * scale),
                    defense: Math.floor(bs.defense * scale),
                    speed: bs.speed,
                    attackRange: bs.attackRange,
                    attackCd: bs.attackCd,
                    size: bs.size,
                    attackTimer: 0,
                    target: null,
                    state: 'advance',
                    alive: true,
                    vx: 0, vy: 0,
                    stunTimer: 0,
                    flashTimer: 0,
                    skills: bossData.skills ? bossData.skills.map(s => ({ ...s, timer: s.cooldown * 0.5 })) : [],
                    isBoss: true,
                    animState: 'idle',
                    animTimer: Math.random() * 6,
                    displayHp: Math.floor(bs.hp * scale),
                    facingRight: false,
                    deathTimer: 0,
                    attackAnimTimer: 0,
                    hurtTimer: 0,
                    kbx: 0, kby: 0
                };
                enemies.push(boss);
            }
        }

        // Hero entity
        const weaponDmg = Weapons.getWeaponDamage(p.weapon);
        const wb = p.weapon.bonus || {};
        const bonusPower = wb.power || 0;
        const bonusAgi = wb.agility || 0;
        const bonusFocus = wb.focus || 0;
        const bonusVit = wb.vitality || 0;
        const bonusAtkSpd = wb.attackSpeed || 0;
        const isRangedWeapon = Weapons.isRangedType && Weapons.isRangedType(p.weapon.type);
        const heroAttackRange = isRangedWeapon ? 220 : cls.attackRange;
        const heroRole = isRangedWeapon ? 'ranged' : 'melee';
        const hero = {
            id: 'hero',
            name: p.name,
            side: 'ally',
            role: heroRole,
            isRangedHero: isRangedWeapon,
            color: p.bannerColor || '#e0c040',
            shape: 'hero',
            x: isRangedWeapon ? 100 : 80,
            y: 470,
            hp: p.hp,
            maxHp: p.maxHp,
            mana: p.mana,
            maxMana: p.maxMana,
            attack: p.stats.power + weaponDmg + bonusPower,
            defense: p.stats.vitality + bonusVit + (p.armor ? p.armor.defense + p.armor.enhanceLevel * 2 : 0),
            speed: cls.moveSpeed + bonusAgi * 2,
            attackRange: heroAttackRange,
            attackCd: 1 / (cls.attackSpeed + bonusAtkSpd),
            size: 18,
            attackTimer: 0,
            target: null,
            state: 'idle',
            alive: true,
            vx: 0, vy: 0,
            stunTimer: 0,
            flashTimer: 0,
            skills: p.skills.map(s => ({ ...s })),
            isHero: true,
            facingRight: true,
            animState: 'idle',
            animTimer: 0,
            displayHp: p.hp,
            deathTimer: 0,
            attackAnimTimer: 0,
            hurtTimer: 0,
            kbx: 0, kby: 0,
            guardStance: false,
            guardTimer: 0,
            parryStance: false,
            parryTimer: 0,
            shadowStepBuff: false
        };

        this.battlefield = {
            allies,
            enemies,
            hero,
            boss,
            allUnits: [hero, ...allies, ...enemies],
            effects: [],
            damageNumbers: [],
            state: 'fighting', // fighting, victory, defeat, paused
            timer: 0,
            order: p.army.currentOrder || 'push',
            orderCooldown: 0,
            morale: p.army.morale,
            moraleMax: p.army.maxMorale,
            lowMoraleApplied: false,
            nodeData,
            killCount: 0,
            allyLosses: 0,
            screenShake: 0,
            particles: []
        };

        return this.battlefield;
    },

    update(dt) {
        const bf = this.battlefield;
        if (!bf || bf.state !== 'fighting') return;

        bf.timer += dt;
        if (bf.screenShake > 0) bf.screenShake -= dt;

        // Update all units
        bf.allUnits.forEach(u => {
            // Smooth HP display
            if (u.displayHp !== undefined) {
                u.displayHp += (u.hp - u.displayHp) * Math.min(1, 8 * dt);
            }
            // Knockback decay
            if (u.kbx) { u.x += u.kbx * dt * 8; u.kbx *= Math.max(0, 1 - 10 * dt); if (Math.abs(u.kbx) < 0.5) u.kbx = 0; }
            if (u.kby) { u.y += u.kby * dt * 8; u.kby *= Math.max(0, 1 - 10 * dt); if (Math.abs(u.kby) < 0.5) u.kby = 0; }
            // Hurt timer
            if (u.hurtTimer > 0) u.hurtTimer -= dt;
            // Attack anim timer
            if (u.attackAnimTimer > 0) u.attackAnimTimer -= dt;
            // Death animation
            if (!u.alive) {
                u.deathTimer = (u.deathTimer || 0) + dt;
                u.animState = 'dead';
                return;
            }
            // Anim timer always ticks
            u.animTimer = (u.animTimer || 0) + dt;
            if (u.stunTimer > 0) { u.stunTimer -= dt; u.animState = 'stun'; return; }
            if (u.flashTimer > 0) u.flashTimer -= dt;

            if (u.isHero) {
                this.updateHero(u, dt);
            } else if (u.isBoss) {
                this.updateBoss(u, dt);
            } else {
                this.updateUnit(u, dt);
            }
        });

        // Collision separation (prevent unit stacking)
        this.separateUnits(bf, dt);

        // Update effects
        bf.effects = bf.effects.filter(e => {
            e.timer -= dt;
            return e.timer > 0;
        });

        // Update damage numbers
        bf.damageNumbers = bf.damageNumbers.filter(d => {
            d.timer -= dt;
            d.y -= 30 * dt;
            return d.timer > 0;
        });

        // Update particles
        if (bf.particles) {
            bf.particles = bf.particles.filter(p => {
                p.x += p.vx * dt;
                p.y += p.vy * dt;
                p.vy += 120 * dt; // gravity
                p.life -= dt;
                return p.life > 0;
            });
        }

        // Check battle end
        const aliveEnemies = bf.enemies.filter(u => u.alive).length;
        const heroAlive = bf.hero.alive;
        const aliveAllies = bf.allies.filter(u => u.alive).length;

        if (aliveEnemies === 0) {
            bf.state = 'victory';
        } else if (!heroAlive && aliveAllies === 0) {
            bf.state = 'defeat';
        }

        // Morale effects
        if (bf.morale < 30 && !bf.lowMoraleApplied) {
            bf.lowMoraleApplied = true;
            bf.allies.forEach(u => {
                if (u.alive && !u.isHero) {
                    u._lowMoralePenalty = true;
                    u.attack = Math.floor(u.attack * 0.75);
                }
            });
        } else if (bf.morale >= 30 && bf.lowMoraleApplied) {
            bf.lowMoraleApplied = false;
            bf.allies.forEach(u => {
                if (u.alive && !u.isHero && u._lowMoralePenalty) {
                    u.attack = Math.floor(u.attack / 0.75);
                    u._lowMoralePenalty = false;
                }
            });
        }
    },

    separateUnits(bf, dt) {
        const alive = bf.allUnits.filter(u => u.alive);
        const sepForce = 200;
        for (let i = 0; i < alive.length; i++) {
            for (let j = i + 1; j < alive.length; j++) {
                const a = alive[i], b = alive[j];
                const dx = b.x - a.x, dy = b.y - a.y;
                const d = Math.sqrt(dx * dx + dy * dy) || 0.1;
                const minDist = (a.size + b.size) * 0.6;
                if (d < minDist) {
                    const overlap = (minDist - d) / minDist;
                    const fx = (dx / d) * overlap * sepForce * dt;
                    const fy = (dy / d) * overlap * sepForce * dt;
                    if (!a.isHero) { a.x -= fx; a.y -= fy; }
                    if (!b.isHero) { b.x += fx; b.y += fy; }
                }
            }
        }
    },

    addParticle(x, y, color, count) {
        const bf = this.battlefield;
        if (!bf.particles) bf.particles = [];
        for (let i = 0; i < (count || 3); i++) {
            const life = Utils.rand(0.3, 0.7);
            bf.particles.push({
                x, y,
                vx: Utils.rand(-60, 60),
                vy: Utils.rand(-80, -20),
                color,
                size: Utils.rand(1.5, 3.5),
                life,
                maxLife: life
            });
        }
    },

    updateHero(hero, dt) {
        const bf = this.battlefield;
        const speed = hero.speed;

        // Movement via Arrow keys
        let mx = 0, my = 0;
        if (Input.isDown('ArrowLeft')) mx -= 1;
        if (Input.isDown('ArrowRight')) mx += 1;
        if (Input.isDown('ArrowUp')) my -= 1;
        if (Input.isDown('ArrowDown')) my += 1;

        if (mx !== 0 || my !== 0) {
            const len = Math.sqrt(mx * mx + my * my);
            mx /= len; my /= len;
            hero.x += mx * speed * dt;
            hero.y += my * speed * dt;
            if (mx > 0) hero.facingRight = true;
            else if (mx < 0) hero.facingRight = false;
            hero.animState = 'walk';
        } else {
            hero.animState = hero.attackAnimTimer > 0 ? 'attack' : 'idle';
        }

        // Clamp to battlefield
        hero.x = Utils.clamp(hero.x, 20, Renderer.w - 20);
        hero.y = Utils.clamp(hero.y, 290, Renderer.h - 30);

        // Guard stance timer
        if (hero.guardStance) {
            hero.guardTimer -= dt;
            if (hero.guardTimer <= 0) hero.guardStance = false;
        }

        // Parry stance timer
        if (hero.parryStance) {
            hero.parryTimer -= dt;
            if (hero.parryTimer <= 0) hero.parryStance = false;
        }

        // Evasion buff timer
        if (hero.evasionTimer > 0) {
            hero.evasionTimer -= dt;
            if (hero.evasionTimer <= 0) hero.evasionBuff = 0;
        }
        // Divine shield timer
        if (hero.divineShieldTimer > 0) {
            hero.divineShieldTimer -= dt;
            if (hero.divineShieldTimer <= 0) hero.divineShieldDR = 0;
        }
        // Iron wall timer
        if (hero.ironWallTimer > 0) {
            hero.ironWallTimer -= dt;
            if (hero.ironWallTimer <= 0) hero.ironWallDR = 0;
        }
        // Freeze timer
        if (hero.freezeTimer > 0) {
            hero.freezeTimer -= dt;
            if (hero.freezeTimer > 0) return;
        }

        // Mana regen
        hero.mana = Utils.clamp(hero.mana + 3 * dt, 0, hero.maxMana);

        // Basic attack
        hero.attackTimer -= dt;
        if (Input.isDown('Space') && hero.attackTimer <= 0) {
            const target = this.findNearestEnemy(hero, hero.attackRange + 20);
            if (target) {
                // Face toward target
                hero.facingRight = target.x > hero.x;
                let dmg = this.calcDamage(hero.attack, target.defense);
                if (hero.shadowStepBuff) {
                    dmg = Math.floor(dmg * 1.5);
                    hero.shadowStepBuff = false;
                }
                // Apply weapon fire damage
                const wb = GameState.player.weapon.bonus || {};
                if (wb.fireDamage) dmg += wb.fireDamage;
                this.dealDamage(target, dmg);
                hero.attackTimer = hero.attackCd;
                hero.attackAnimTimer = 0.2;
                hero.animState = 'attack';
                if (hero.isRangedHero) {
                    Audio.play('arrowShoot');
                    this.addEffect(hero.x, hero.y, 'arrow', 0.3, { tx: target.x, ty: target.y });
                } else {
                    Audio.play('swordClash');
                    this.addEffect(target.x, target.y, 'slash', 0.2);
                }
            }
        }

        // Skills
        hero.skills.forEach(skill => {
            if (skill.currentCd > 0) skill.currentCd -= dt;
            if (Input.justPressed(skill.key) && skill.currentCd <= 0 && hero.mana >= skill.manaCost) {
                this.useSkill(hero, skill);
            }
        });
    },

    useSkill(hero, skill) {
        hero.mana -= skill.manaCost;
        skill.currentCd = skill.cooldown;
        Audio.play('skill');

        switch (skill.id) {
            case 'cleave': {
                const targets = this.getEnemiesInRange(hero, skill.range);
                targets.forEach(t => {
                    const dmg = Math.floor(hero.attack * skill.damage);
                    this.dealDamage(t, dmg);
                });
                this.addEffect(hero.x + (hero.facingRight ? 30 : -30), hero.y, 'cleave', 0.3);
                break;
            }
            case 'charge': {
                const dir = hero.facingRight ? 1 : -1;
                hero.x += dir * skill.range;
                hero.x = Utils.clamp(hero.x, 20, Renderer.w - 20);
                const target = this.findNearestEnemy(hero, 60);
                if (target) {
                    const dmg = Math.floor(hero.attack * skill.damage);
                    this.dealDamage(target, dmg);
                    target.stunTimer = skill.stun;
                    this.addEffect(target.x, target.y, 'impact', 0.3);
                }
                break;
            }
            case 'guardStance': {
                hero.guardStance = true;
                hero.guardTimer = skill.duration;
                const bf = this.battlefield;
                bf.morale = Utils.clamp(bf.morale + skill.moraleBoost, 0, bf.moraleMax);
                this.addEffect(hero.x, hero.y, 'shield', 0.5);
                break;
            }
            case 'dashSlash': {
                const dir = hero.facingRight ? 1 : -1;
                const startX = hero.x;
                hero.x += dir * skill.range;
                hero.x = Utils.clamp(hero.x, 20, Renderer.w - 20);
                this.battlefield.enemies.filter(e => e.alive).forEach(e => {
                    const minX = Math.min(startX, hero.x) - 20;
                    const maxX = Math.max(startX, hero.x) + 20;
                    if (e.x >= minX && e.x <= maxX && Math.abs(e.y - hero.y) < 40) {
                        const dmg = Math.floor(hero.attack * skill.damage);
                        this.dealDamage(e, dmg);
                    }
                });
                this.addEffect(hero.x, hero.y, 'slash', 0.3);
                break;
            }
            case 'parryStance': {
                hero.parryStance = true;
                hero.parryTimer = skill.duration;
                this.addEffect(hero.x, hero.y, 'parry', 0.3);
                break;
            }
            case 'crescentStrike': {
                const targets = this.getEnemiesInRange(hero, skill.range);
                targets.forEach(t => {
                    let dmg = Math.floor(hero.attack * skill.damage);
                    if (t.hp < t.maxHp * 0.5) dmg = Math.floor(dmg * skill.executeMod);
                    this.dealDamage(t, dmg);
                });
                this.addEffect(hero.x + (hero.facingRight ? 40 : -40), hero.y, 'crescent', 0.4);
                break;
            }
            case 'shadowStep': {
                const target = this.findNearestEnemy(hero, 400);
                if (target) {
                    hero.x = target.x - (hero.facingRight ? 30 : -30);
                    hero.y = target.y;
                    hero.shadowStepBuff = true;
                    this.addEffect(hero.x, hero.y, 'shadow', 0.3);
                }
                break;
            }
            case 'smokeBomb': {
                this.addEffect(hero.x, hero.y, 'smoke', skill.duration);
                this.battlefield.allies.forEach(a => {
                    if (a.alive && Utils.dist(a.x, a.y, hero.x, hero.y) < skill.radius) {
                        a.evasionBuff = skill.evasionBoost;
                        a.evasionTimer = skill.duration;
                    }
                });
                break;
            }
            case 'chainAttack': {
                let targets = this.getEnemiesInRange(hero, skill.range).slice(0, skill.hits);
                targets.forEach(t => {
                    const dmg = Math.floor(hero.attack * skill.damage);
                    this.dealDamage(t, dmg);
                    this.addEffect(t.x, t.y, 'slash', 0.15);
                });
                break;
            }
            // --- Archer skills ---
            case 'powerShot': {
                const target = this.findNearestEnemy(hero, skill.range);
                if (target) {
                    const dmg = Math.floor(hero.attack * skill.damage);
                    this.dealDamage(target, dmg);
                    if (skill.piercing) {
                        // Hit one enemy behind target
                        const behind = this.battlefield.enemies.filter(e =>
                            e.alive && e.id !== target.id &&
                            Math.abs(e.y - target.y) < 40 &&
                            (hero.facingRight ? e.x > target.x : e.x < target.x) &&
                            Utils.dist(target.x, target.y, e.x, e.y) < 120
                        );
                        if (behind[0]) this.dealDamage(behind[0], Math.floor(dmg * 0.6));
                    }
                    this.addEffect(hero.x, hero.y, 'arrow', 0.3, { tx: target.x, ty: target.y });
                }
                break;
            }
            case 'volley': {
                const targets = this.getEnemiesInRange(hero, skill.range).slice(0, skill.maxTargets || 6);
                targets.forEach(t => {
                    const dmg = Math.floor(hero.attack * skill.damage);
                    this.dealDamage(t, dmg);
                    this.addEffect(hero.x, hero.y, 'arrow', 0.3, { tx: t.x, ty: t.y });
                });
                if (!targets.length) this.addEffect(hero.x, hero.y - 30, 'arrow', 0.4);
                break;
            }
            case 'evasiveRoll': {
                const dir = hero.facingRight ? -1 : 1;
                hero.x += dir * skill.range;
                hero.x = Utils.clamp(hero.x, 20, Renderer.w - 20);
                hero.evasionBuff = skill.evasionBoost;
                hero.evasionTimer = skill.duration;
                this.addEffect(hero.x, hero.y, 'shadow', 0.3);
                break;
            }
            // --- Mage skills ---
            case 'fireball': {
                const targets = this.getEnemiesInRange(hero, skill.range);
                const center = targets[0];
                if (center) {
                    // AoE around first target
                    const splashTargets = this.battlefield.enemies.filter(e =>
                        e.alive && Utils.dist(e.x, e.y, center.x, center.y) < skill.aoeRadius
                    );
                    splashTargets.forEach(t => {
                        const dmg = Math.floor(hero.attack * skill.damage);
                        this.dealDamage(t, dmg);
                    });
                    this.addEffect(center.x, center.y, 'fireball', 0.5);
                }
                break;
            }
            case 'frostNova': {
                const targets = this.getEnemiesInRange(hero, skill.range);
                targets.forEach(t => {
                    const dmg = Math.floor(hero.attack * skill.damage);
                    this.dealDamage(t, dmg);
                    t.stunTimer = Math.max(t.stunTimer || 0, skill.freezeDuration);
                    t.speed *= 0.5;
                    setTimeout(() => { if (t.alive) t.speed *= 2; }, skill.freezeDuration * 1000);
                });
                this.addEffect(hero.x, hero.y, 'frost', 0.5);
                break;
            }
            case 'arcaneBarrage': {
                const targets = this.getEnemiesInRange(hero, skill.range).slice(0, skill.bolts || 5);
                targets.forEach((t, i) => {
                    const dmg = Math.floor(hero.attack * skill.damage);
                    this.dealDamage(t, dmg);
                    this.addEffect(t.x, t.y, 'arcane', 0.2 + i * 0.1);
                });
                break;
            }
            // --- Tank skills ---
            case 'shieldBash': {
                const target = this.findNearestEnemy(hero, 60);
                if (target) {
                    const dmg = Math.floor(hero.attack * skill.damage);
                    this.dealDamage(target, dmg);
                    target.stunTimer = skill.stunDuration;
                    this.addEffect(target.x, target.y, 'impact', 0.3);
                }
                break;
            }
            case 'taunt': {
                const targets = this.getEnemiesInRange(hero, skill.range);
                targets.forEach(t => { t.target = hero; });
                hero.guardStance = true;
                hero.guardTimer = skill.duration;
                this.addEffect(hero.x, hero.y, 'warcry', 0.4);
                break;
            }
            case 'ironWall': {
                hero.guardStance = true;
                hero.guardTimer = skill.duration;
                hero._ironWall = true;
                hero._ironWallReduction = skill.damageReduction;
                this.addEffect(hero.x, hero.y, 'shield', 0.5);
                const bf = this.battlefield;
                bf.allies.forEach(a => {
                    if (a.alive && Utils.dist(a.x, a.y, hero.x, hero.y) < skill.range) {
                        a.defense += skill.allyDefBoost || 3;
                    }
                });
                break;
            }
            // --- Healer skills ---
            case 'healingLight': {
                const bf = this.battlefield;
                const wounded = [bf.hero, ...bf.allies].filter(a => a.alive && a.hp < a.maxHp)
                    .sort((a, b) => (a.hp / a.maxHp) - (b.hp / b.maxHp));
                const target = wounded[0];
                if (target) {
                    const heal = Math.floor(hero.attack * (skill.healMod || 1));
                    target.hp = Math.min(target.maxHp, target.hp + heal);
                    this.addDmgNumber(target.x, target.y - target.size, '+' + heal, '#40e040');
                    this.addEffect(target.x, target.y, 'heal', 0.4);
                }
                break;
            }
            case 'purify': {
                const bf = this.battlefield;
                const allies = [bf.hero, ...bf.allies].filter(a => a.alive);
                allies.forEach(a => {
                    if (a.stunTimer > 0) a.stunTimer = 0;
                    const heal = Math.floor(hero.attack * (skill.healMod || 1));
                    a.hp = Math.min(a.maxHp, a.hp + heal);
                });
                this.addEffect(hero.x, hero.y, 'heal', 0.5);
                break;
            }
            case 'divineShield': {
                const bf = this.battlefield;
                const allies = [bf.hero, ...bf.allies].filter(a =>
                    a.alive && Utils.dist(a.x, a.y, hero.x, hero.y) < skill.range
                );
                allies.forEach(a => {
                    a._divineShield = true;
                    a._divineShieldTimer = skill.duration;
                    a._divineShieldReduction = skill.damageReduction;
                });
                this.addEffect(hero.x, hero.y, 'shield', 0.6);
                break;
            }
            // --- Bard skills ---
            case 'warSong': {
                const bf = this.battlefield;
                bf.allies.forEach(a => {
                    if (a.alive && Utils.dist(a.x, a.y, hero.x, hero.y) < skill.range) {
                        a.attack = Math.floor(a.attack * (1 + skill.attackBuff));
                        a._warSong = true;
                    }
                });
                bf.morale = Utils.clamp(bf.morale + skill.moraleBoost, 0, bf.moraleMax);
                this.addEffect(hero.x, hero.y, 'warcry', 0.5);
                break;
            }
            case 'discordantNote': {
                const targets = this.getEnemiesInRange(hero, skill.range);
                targets.forEach(t => {
                    const dmg = Math.floor(hero.attack * skill.damage);
                    this.dealDamage(t, dmg);
                    t.stunTimer = Math.max(t.stunTimer || 0, skill.confuseDuration);
                });
                this.addEffect(hero.x, hero.y, 'arcane', 0.4);
                break;
            }
            case 'balladOfResilience': {
                const bf = this.battlefield;
                const allies = [bf.hero, ...bf.allies].filter(a =>
                    a.alive && Utils.dist(a.x, a.y, hero.x, hero.y) < skill.range
                );
                allies.forEach(a => {
                    const heal = Math.floor(hero.attack * (skill.healMod || 1));
                    a.hp = Math.min(a.maxHp, a.hp + heal);
                    a.defense += skill.defBuff || 2;
                    this.addDmgNumber(a.x, a.y - a.size, '+' + heal, '#40e040');
                });
                this.addEffect(hero.x, hero.y, 'heal', 0.5);
                break;
            }
        }
    },

    updateUnit(unit, dt) {
        const bf = this.battlefield;
        const isAlly = unit.side === 'ally';
        const enemySide = isAlly ? bf.enemies : [bf.hero, ...bf.allies];
        const order = isAlly ? bf.order : 'push';

        // Buff timers
        if (unit.evasionTimer > 0) { unit.evasionTimer -= dt; if (unit.evasionTimer <= 0) unit.evasionBuff = 0; }
        if (unit.divineShieldTimer > 0) { unit.divineShieldTimer -= dt; if (unit.divineShieldTimer <= 0) unit.divineShieldDR = 0; }
        if (unit.ironWallTimer > 0) { unit.ironWallTimer -= dt; if (unit.ironWallTimer <= 0) unit.ironWallDR = 0; }
        if (unit.stunTimer > 0) { unit.stunTimer -= dt; if (unit.stunTimer > 0) return; }
        if (unit.freezeTimer > 0) { unit.freezeTimer -= dt; if (unit.freezeTimer > 0) { unit.animState = 'stun'; return; } }

        // Find target
        if (!unit.target || !unit.target.alive) {
            unit.target = this.findNearestAlive(unit, enemySide);
        }
        if (!unit.target) { unit.animState = 'idle'; return; }

        const dist = Utils.dist(unit.x, unit.y, unit.target.x, unit.target.y);
        // Face toward target
        unit.facingRight = unit.target.x > unit.x;

        // Movement
        let moved = false;
        if (dist > unit.attackRange) {
            let speedMod = 1;
            if (isAlly && order === 'hold') speedMod = 0.2;
            if (isAlly && order === 'allout') speedMod = 1.4;

            const dx = unit.target.x - unit.x;
            const dy = unit.target.y - unit.y;
            const len = Math.sqrt(dx * dx + dy * dy) || 1;
            unit.x += (dx / len) * unit.speed * speedMod * dt;
            unit.y += (dy / len) * unit.speed * speedMod * dt;
            moved = true;
        } else if (unit.role === 'ranged' && dist < unit.attackRange * 0.4) {
            // Ranged units kite back if enemy is too close
            const dx = unit.x - unit.target.x;
            const dy = unit.y - unit.target.y;
            const len = Math.sqrt(dx * dx + dy * dy) || 1;
            unit.x += (dx / len) * unit.speed * 0.6 * dt;
            unit.y += (dy / len) * unit.speed * 0.6 * dt;
            moved = true;
        }

        // Animation state
        if (unit.attackAnimTimer > 0) {
            unit.animState = 'attack';
        } else if (moved) {
            unit.animState = 'walk';
        } else {
            unit.animState = 'idle';
        }

        // Attack
        unit.attackTimer -= dt;
        if (dist <= unit.attackRange && unit.attackTimer <= 0) {
            let dmg = this.calcDamage(unit.attack, unit.target.defense);

            if (isAlly && bf.morale > 70) dmg = Math.floor(dmg * 1.1);
            if (isAlly && bf.order === 'allout') dmg = Math.floor(dmg * 1.15);

            if (unit.target.evasionBuff && Math.random() < unit.target.evasionBuff) {
                this.addDmgNumber(unit.target.x, unit.target.y, 'MISS', '#aaaaaa');
            } else {
                if (unit.target.isHero && unit.target.parryStance) {
                    const counterSkill = unit.target.skills.find(s => s.id === 'parryStance');
                    const counterDmg = Math.floor(unit.target.attack * (counterSkill ? counterSkill.counterDamage : 1.5));
                    this.dealDamage(unit, counterDmg);
                    unit.target.mana = Utils.clamp(unit.target.mana + (counterSkill ? counterSkill.manaRestore : 10), 0, unit.target.maxMana);
                    unit.target.parryStance = false;
                    this.addEffect(unit.target.x, unit.target.y, 'parryCounter', 0.3);
                } else {
                    if (unit.target.isHero && unit.target.guardStance) {
                        dmg = Math.floor(dmg * 0.5);
                    }
                    this.dealDamage(unit.target, dmg);
                }
            }
            unit.attackTimer = unit.attackCd;
            unit.attackAnimTimer = 0.15;

            if (unit.role === 'ranged' && unit.target) {
                Audio.play('arrowShoot');
                this.addEffect(unit.x, unit.y, 'arrow', 0.3, { tx: unit.target.x, ty: unit.target.y });
            } else {
                Audio.play('swordClash');
            }
        }

        // Clamp position
        unit.x = Utils.clamp(unit.x, 10, Renderer.w - 10);
        unit.y = Utils.clamp(unit.y, 290, Renderer.h - 30);
    },

    updateBoss(boss, dt) {
        this.updateUnit(boss, dt);

        // Boss skills
        if (boss.skills) {
            boss.skills.forEach(skill => {
                skill.timer -= dt;
                if (skill.timer <= 0) {
                    skill.timer = skill.cooldown;
                    this.useBossSkill(boss, skill);
                }
            });
        }
    },

    useBossSkill(boss, skill) {
        const bf = this.battlefield;
        if (skill.name === 'Warcry') {
            // Cap warcry at 2 stacks max (1.15 per stack, not 1.3)
            if (!boss._warcryStacks) boss._warcryStacks = 0;
            if (boss._warcryStacks < 2) {
                boss._warcryStacks++;
                bf.enemies.forEach(e => {
                    if (e.alive && !e.isBoss) e.attack = Math.floor(e.attack * 1.15);
                });
            }
            this.addEffect(boss.x, boss.y, 'warcry', 0.5);
        } else if (skill.name === 'Crushing Blow') {
            const target = this.findNearestAlive(boss, [bf.hero, ...bf.allies]);
            if (target) {
                const dmg = Math.floor(boss.attack * skill.damage);
                this.dealDamage(target, dmg);
                this.addEffect(target.x, target.y, 'impact', 0.4);
            }
        } else if (skill.name === 'Summon Minions') {
            for (let i = 0; i < skill.count; i++) {
                const scaled = Units.getScaledEnemy(skill.spawns, 2);
                if (!scaled) continue;
                const s = scaled.baseStats;
                const minion = {
                    id: Utils.uid(),
                    type: skill.spawns,
                    name: scaled.name,
                    side: 'enemy',
                    role: scaled.role,
                    color: scaled.color,
                    shape: scaled.shape,
                    x: boss.x + Utils.rand(-40, 40),
                    y: boss.y + Utils.rand(-60, 60),
                    hp: s.hp, maxHp: s.maxHp,
                    attack: s.attack, defense: s.defense,
                    speed: s.speed, attackRange: s.attackRange,
                    attackCd: s.attackCd, size: s.size,
                    attackTimer: 0.5, target: null,
                    state: 'advance', alive: true, vx: 0, vy: 0,
                    stunTimer: 0, flashTimer: 0
                };
                bf.enemies.push(minion);
                bf.allUnits.push(minion);
            }
            this.addEffect(boss.x, boss.y, 'summon', 0.5);
        }
    },

    calcDamage(atk, def) {
        const base = Math.max(1, atk - def * 0.5);
        return Math.floor(base * Utils.rand(0.85, 1.15));
    },

    dealDamage(target, dmg) {
        if (!target.alive) return;
        // Divine Shield damage reduction
        if (target._divineShield && target._divineShieldTimer > 0) {
            dmg = Math.floor(dmg * (1 - (target._divineShieldReduction || 0.3)));
        }
        // Iron Wall damage reduction
        if (target.isHero && target._ironWall && target.guardStance) {
            dmg = Math.floor(dmg * (1 - (target._ironWallReduction || 0.6)));
        }
        // Dragonkin fire bonus
        const p = GameState.player;
        if (target.side === 'enemy' && p && Races[p.race] && Races[p.race].fireDamage) {
            dmg = Math.floor(dmg * (1 + Races[p.race].fireDamage));
        }

        target.hp -= dmg;
        target.flashTimer = 0.1;
        target.hurtTimer = 0.12;
        target.animState = 'hurt';
        const color = target.side === 'enemy' ? '#ff4444' : '#ffaa00';
        this.addDmgNumber(target.x, target.y - target.size, dmg, color);

        // Combat SFX
        Audio.play('hit');

        // Knockback
        const attacker = this.battlefield.hero; // approximate direction
        if (target.target) {
            const dx = target.x - target.target.x;
            const dy = target.y - target.target.y;
            const len = Math.sqrt(dx * dx + dy * dy) || 1;
            target.kbx = (dx / len) * dmg * 0.3;
            target.kby = (dy / len) * dmg * 0.15;
        }

        // Spark particles
        this.addParticle(target.x, target.y, color, 4);

        if (target.hp <= 0) {
            target.hp = 0;
            target.alive = false;
            target.deathTimer = 0;
            Audio.play('death');
            if (target.side === 'enemy') {
                this.battlefield.killCount++;
            } else if (!target.isHero) {
                this.battlefield.allyLosses++;
            }
            this.addEffect(target.x, target.y, 'death', 0.4);
            // Screen shake on kills, bigger for bosses
            this.battlefield.screenShake = target.isBoss ? 0.4 : 0.1;
            // Death particles
            this.addParticle(target.x, target.y, target.color, 8);
        }
    },

    findNearestEnemy(from, range) {
        const bf = this.battlefield;
        let best = null, bestDist = range;
        bf.enemies.filter(e => e.alive).forEach(e => {
            const d = Utils.dist(from.x, from.y, e.x, e.y);
            if (d < bestDist) { bestDist = d; best = e; }
        });
        return best;
    },

    findNearestAlive(from, pool) {
        let best = null, bestDist = Infinity;
        pool.filter(u => u.alive).forEach(u => {
            const d = Utils.dist(from.x, from.y, u.x, u.y);
            if (d < bestDist) { bestDist = d; best = u; }
        });
        return best;
    },

    getEnemiesInRange(from, range) {
        return this.battlefield.enemies.filter(e =>
            e.alive && Utils.dist(from.x, from.y, e.x, e.y) <= range
        );
    },

    addEffect(x, y, type, duration, extra) {
        this.battlefield.effects.push({ x, y, type, timer: duration, maxTimer: duration, ...(extra || {}) });
    },

    addDmgNumber(x, y, value, color) {
        this.battlefield.damageNumbers.push({
            x: x + Utils.rand(-10, 10),
            y: y,
            value: String(value),
            color,
            timer: 0.7
        });
    },

    applyBattleResults() {
        const bf = this.battlefield;
        const p = GameState.player;

        // Save hero HP/mana back
        p.hp = bf.hero.hp;
        p.mana = bf.hero.mana;
        GameState.recalcDerived();

        // Count ally losses per slot
        p.army.slots.forEach(slot => {
            const template = Units.allied[slot.type];
            if (!template) return;
            const aliveCount = bf.allies.filter(a => a.alive && a.type === slot.type).length;
            const lost = slot.count - aliveCount;
            slot.count = aliveCount;
            if (lost > 0) {
                slot.morale = Utils.clamp(slot.morale - lost * 3, 0, 100);
            }
        });

        // Update army morale
        if (bf.state === 'victory') {
            p.army.morale = Utils.clamp(p.army.morale + 5, 0, 100);
        } else {
            p.army.morale = Utils.clamp(p.army.morale - 15, 0, 100);
        }

        p.totalBattles++;
        p.totalKills += bf.killCount;

        return {
            victory: bf.state === 'victory',
            killCount: bf.killCount,
            allyLosses: bf.allyLosses,
            heroAlive: bf.hero.alive
        };
    }
};
