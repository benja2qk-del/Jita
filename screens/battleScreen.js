const BattleScreen = {
    nodeData: null,
    paused: false,
    resultTimer: 0,
    resultShown: false,
    battleResult: null,
    loot: null,
    groundParticles: [],

    enter(params) {
        Audio.playMusic('battle');
        this.nodeData = params.node;
        this.paused = false;
        this.resultTimer = 0;
        this.resultShown = false;
        this.battleResult = null;
        this.loot = null;
        this.biome = Districts.getCurrentBiome();

        BattleSystem.initBattle(this.nodeData);

        // Ground particles vary by biome
        this.groundParticles = [];
        const biomeParticles = {
            forest: ['#5a8a40', '#4a7a30', '#6a9a50', '#3a6a20', '#7a5a30'],
            desert: ['#d0b868', '#c0a850', '#e0c878', '#b89840', '#c8b058'],
            volcanic: ['#4a3a3a', '#5a3020', '#3a2a2a', '#6a4030', '#2a1a1a']
        };
        const pColors = biomeParticles[this.biome] || biomeParticles.forest;
        for (let i = 0; i < 60; i++) {
            this.groundParticles.push({
                x: Utils.rand(0, Renderer.w),
                y: Utils.rand(300, Renderer.h - 25),
                size: Utils.rand(1, 4),
                color: Utils.pick(pColors)
            });
        }
        // Clouds drifting in sky
        this.envClouds = [
            { x: 120, y: 45, w: 55, h: 20, alpha: 0.75, drift: 2.0 },
            { x: 380, y: 30, w: 42, h: 16, alpha: 0.55, drift: 1.4 },
            { x: 750, y: 50, w: 65, h: 24, alpha: 0.65, drift: 2.6 },
            { x: 1050, y: 38, w: 48, h: 18, alpha: 0.5, drift: 1.7 },
        ];
        this.envTimer = 0;
    },

    exit() {
        BattleSystem.battlefield = null;
    },

    update(dt) {
        if (Input.justPressed('Escape') || Input.justPressed('KeyP')) {
            this.paused = !this.paused;
        }

        this.envTimer = (this.envTimer || 0) + dt;

        if (this.paused) return;

        const bf = BattleSystem.battlefield;
        if (!bf) return;

        if (bf.state === 'fighting') {
            BattleSystem.update(dt);

            // Order cooldown
            if (bf.orderCooldown > 0) bf.orderCooldown -= dt;

            // Army orders (1, 2, 3)
            if (bf.orderCooldown <= 0) {
                if (Input.justPressed('Digit1')) { bf.order = 'hold'; bf.orderCooldown = 8; }
                if (Input.justPressed('Digit2')) { bf.order = 'push'; bf.orderCooldown = 8; }
                if (Input.justPressed('Digit3')) { bf.order = 'allout'; bf.orderCooldown = 8; }
            }
        }

        if ((bf.state === 'victory' || bf.state === 'defeat') && !this.resultShown) {
            this.resultTimer += dt;
            if (this.resultTimer > 1.5) {
                this.resultShown = true;
                this.battleResult = BattleSystem.applyBattleResults();
                if (this.battleResult.victory) {
                    this.loot = LootSystem.generateBattleLoot(this.nodeData, this.battleResult);
                    LootSystem.applyLoot(this.loot);
                    CampaignSystem.completeNode(this.nodeData.id);
                } else {
                    LootSystem.applyDefeatPenalty();
                }
                SaveSystem.save();
            }
        }
    },

    render(ctx) {
        const bf = BattleSystem.battlefield;
        if (!bf) return;

        // Apply screen shake
        const shaking = bf.screenShake > 0;
        if (shaking) {
            ctx.save();
            const intensity = bf.screenShake * 12;
            ctx.translate(
                (Math.random() - 0.5) * intensity,
                (Math.random() - 0.5) * intensity
            );
        }

        this.renderBattlefield(ctx, bf);
        this.renderUnits(ctx, bf);
        this.renderParticles(ctx, bf);
        this.renderEffects(ctx, bf);
        this.renderDamageNumbers(ctx, bf);

        if (shaking) ctx.restore();

        this.renderHUD(ctx, bf);

        if (this.paused) this.renderPause(ctx);
        if (this.resultShown) this.renderResult(ctx);
    },

    renderBattlefield(ctx) {
        const biome = this.biome || 'forest';
        if (biome === 'desert') this._renderDesertBG(ctx);
        else if (biome === 'volcanic') this._renderVolcanicBG(ctx);
        else this._renderForestBG(ctx);
    },

    // ═══ FOREST BACKGROUND ═══
    _renderForestBG(ctx) {
        const t = this.envTimer || 0;
        const W = Renderer.w, H = Renderer.h, GY = 280;

        // Sky — soft blue-green forest light
        const sky = ctx.createLinearGradient(0, 0, 0, GY + 30);
        sky.addColorStop(0, '#4a90a0');
        sky.addColorStop(0.4, '#6ab0b8');
        sky.addColorStop(0.7, '#8ac8c0');
        sky.addColorStop(1, '#b0dcc8');
        ctx.fillStyle = sky;
        ctx.fillRect(0, 0, W, GY + 30);

        // Filtered sun through canopy
        const sunX = W * 0.45, sunY = 60;
        const sg = ctx.createRadialGradient(sunX, sunY, 6, sunX, sunY, 140);
        sg.addColorStop(0, 'rgba(220,255,200,0.6)');
        sg.addColorStop(0.3, 'rgba(180,230,160,0.2)');
        sg.addColorStop(1, 'rgba(100,180,80,0)');
        ctx.fillStyle = sg;
        ctx.beginPath(); ctx.arc(sunX, sunY, 140, 0, Math.PI * 2); ctx.fill();

        // Clouds
        if (this.envClouds) {
            this.envClouds.forEach(c => {
                const cx = (c.x + t * c.drift) % (W + 120) - 60;
                ctx.fillStyle = `rgba(220,240,220,${c.alpha * 0.6})`;
                ctx.beginPath(); ctx.ellipse(cx, c.y, c.w, c.h, 0, 0, Math.PI * 2); ctx.fill();
                ctx.beginPath(); ctx.ellipse(cx - c.w * 0.5, c.y + c.h * 0.1, c.w * 0.6, c.h * 0.75, 0, 0, Math.PI * 2); ctx.fill();
            });
        }

        // Distant tree line
        for (let i = 0; i < 20; i++) {
            const tx = i * 68 - 10;
            const th = 100 + Math.sin(i * 2.3) * 40;
            const tw = 40 + Math.sin(i * 1.7) * 15;
            ctx.fillStyle = `rgba(30,${70 + i * 3},20,0.7)`;
            // Triangle tree
            ctx.beginPath();
            ctx.moveTo(tx, GY - 10);
            ctx.lineTo(tx + tw / 2, GY - 10 - th);
            ctx.lineTo(tx + tw, GY - 10);
            ctx.closePath();
            ctx.fill();
            // Trunk
            ctx.fillStyle = '#3a2810';
            ctx.fillRect(tx + tw / 2 - 3, GY - 20, 6, 20);
        }

        // Ground — lush green-brown forest floor
        const grd = ctx.createLinearGradient(0, GY - 10, 0, H);
        grd.addColorStop(0, '#5a8a40');
        grd.addColorStop(0.15, '#4a7a34');
        grd.addColorStop(0.5, '#3a6a28');
        grd.addColorStop(1, '#2a5a1a');
        ctx.fillStyle = grd;
        ctx.fillRect(0, GY - 10, W, H - GY + 10);

        // Grass texture lines
        ctx.strokeStyle = 'rgba(0,0,0,0.04)';
        ctx.lineWidth = 1;
        for (let gy = GY + 20; gy < H - 20; gy += 40) {
            ctx.beginPath();
            ctx.moveTo(0, gy + Math.sin(gy * 0.1) * 3);
            ctx.lineTo(W, gy + Math.sin(gy * 0.1 + 2) * 3);
            ctx.stroke();
        }

        // Dappled light
        const sl = ctx.createRadialGradient(W * 0.4, GY + 80, 30, W * 0.4, GY + 120, 350);
        sl.addColorStop(0, 'rgba(200,255,160,0.08)');
        sl.addColorStop(1, 'rgba(100,200,60,0)');
        ctx.fillStyle = sl;
        ctx.fillRect(0, GY, W, H - GY);

        // Left large trees
        this._drawTree(ctx, 30, GY, 180, '#2a5a18', '#3a2010');
        this._drawTree(ctx, 140, GY, 140, '#1e4e14', '#3a2810');

        // Right trees
        this._drawTree(ctx, 1100, GY, 160, '#286018', '#3a2810');
        this._drawTree(ctx, 1200, GY, 130, '#1e5014', '#342810');

        // Bushes
        this._drawBush(ctx, 260, GY + 5);
        this._drawBush(ctx, 980, GY + 8);
        this._drawBush(ctx, 600, GY - 5);

        // Props
        this._drawCrate(ctx, 190, GY + 18);
        this._drawSignpost(ctx, 590, GY - 12);
        this._drawCrate(ctx, 810, GY + 10);

        // Ground particles
        this._renderGroundParticles(ctx);

        // Foreground shadow from trees
        const ts = ctx.createLinearGradient(0, GY - 5, 0, GY + 15);
        ts.addColorStop(0, 'rgba(0,30,0,0.15)');
        ts.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = ts;
        ctx.fillRect(0, GY - 5, 200, 20);
        ctx.fillRect(1060, GY - 5, 220, 20);
    },

    // ═══ DESERT BACKGROUND ═══
    _renderDesertBG(ctx) {
        const t = this.envTimer || 0;
        const W = Renderer.w, H = Renderer.h, GY = 280;

        // Sky — scorching orange-blue
        const sky = ctx.createLinearGradient(0, 0, 0, GY + 30);
        sky.addColorStop(0, '#2060a0');
        sky.addColorStop(0.3, '#5090c8');
        sky.addColorStop(0.6, '#c0a870');
        sky.addColorStop(1, '#e0c880');
        ctx.fillStyle = sky;
        ctx.fillRect(0, 0, W, GY + 30);

        // Blazing sun
        const sunX = W * 0.55, sunY = 48;
        const sg = ctx.createRadialGradient(sunX, sunY, 8, sunX, sunY, 160);
        sg.addColorStop(0, 'rgba(255,255,200,0.95)');
        sg.addColorStop(0.12, 'rgba(255,240,150,0.6)');
        sg.addColorStop(0.4, 'rgba(255,200,80,0.15)');
        sg.addColorStop(1, 'rgba(255,180,50,0)');
        ctx.fillStyle = sg;
        ctx.beginPath(); ctx.arc(sunX, sunY, 160, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#fffa80';
        ctx.beginPath(); ctx.arc(sunX, sunY, 22, 0, Math.PI * 2); ctx.fill();

        // Sparse clouds (wispy)
        if (this.envClouds) {
            this.envClouds.forEach(c => {
                const cx = (c.x + t * c.drift * 0.6) % (W + 120) - 60;
                ctx.fillStyle = `rgba(255,240,200,${c.alpha * 0.3})`;
                ctx.beginPath(); ctx.ellipse(cx, c.y, c.w * 1.5, c.h * 0.6, 0, 0, Math.PI * 2); ctx.fill();
            });
        }

        // Distant dunes silhouette
        ctx.fillStyle = '#d0b060';
        ctx.beginPath();
        ctx.moveTo(0, GY);
        for (let i = 0; i <= W; i += 20) {
            const dy = GY - 20 - Math.sin(i * 0.005) * 30 - Math.sin(i * 0.012 + 1) * 15;
            ctx.lineTo(i, dy);
        }
        ctx.lineTo(W, GY); ctx.closePath(); ctx.fill();

        // Mid dunes
        ctx.fillStyle = '#c8a848';
        ctx.beginPath();
        ctx.moveTo(0, GY);
        for (let i = 0; i <= W; i += 15) {
            const dy = GY - 8 - Math.sin(i * 0.008 + 2) * 18 - Math.sin(i * 0.02) * 8;
            ctx.lineTo(i, dy);
        }
        ctx.lineTo(W, GY); ctx.closePath(); ctx.fill();

        // Ground — sandy
        const grd = ctx.createLinearGradient(0, GY - 10, 0, H);
        grd.addColorStop(0, '#d8c478');
        grd.addColorStop(0.12, '#d0b868');
        grd.addColorStop(0.4, '#c8ac58');
        grd.addColorStop(1, '#b49840');
        ctx.fillStyle = grd;
        ctx.fillRect(0, GY - 10, W, H - GY + 10);

        // Sand ripple lines
        ctx.strokeStyle = 'rgba(0,0,0,0.04)';
        ctx.lineWidth = 1;
        for (let gy = GY + 15; gy < H - 15; gy += 30) {
            ctx.beginPath();
            for (let gx = 0; gx <= W; gx += 8) {
                const sy = gy + Math.sin(gx * 0.03 + gy * 0.02) * 2;
                gx === 0 ? ctx.moveTo(gx, sy) : ctx.lineTo(gx, sy);
            }
            ctx.stroke();
        }

        // Heat shimmer
        const sh = ctx.createRadialGradient(W * 0.5, GY + 50, 40, W * 0.5, GY + 100, 400);
        sh.addColorStop(0, 'rgba(255,240,180,0.08)');
        sh.addColorStop(1, 'rgba(255,200,100,0)');
        ctx.fillStyle = sh;
        ctx.fillRect(0, GY, W, H - GY);

        // Left: ruined pillars
        this._drawPillar(ctx, 40, GY, 120);
        this._drawPillar(ctx, 120, GY, 90);
        // Rubble
        ctx.fillStyle = '#b09848';
        for (let i = 0; i < 6; i++) {
            ctx.fillRect(30 + i * 22, GY + 2 + i * 3, 8 + i * 2, 6 + i);
        }

        // Right: desert tent / ruins
        this._drawDesertTent(ctx, 1060, GY);
        this._drawPillar(ctx, 1200, GY, 80);

        // Cacti
        this._drawCactus(ctx, 280, GY + 5);
        this._drawCactus(ctx, 950, GY + 2);

        // Skull prop
        ctx.fillStyle = '#e0d8c0';
        ctx.beginPath(); ctx.ellipse(620, GY + 6, 6, 5, 0.2, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#1a1a1a';
        ctx.fillRect(617, GY + 4, 2, 2); ctx.fillRect(622, GY + 4, 2, 2);

        this._renderGroundParticles(ctx);
    },

    // ═══ VOLCANIC BACKGROUND ═══
    _renderVolcanicBG(ctx) {
        const t = this.envTimer || 0;
        const W = Renderer.w, H = Renderer.h, GY = 280;

        // Sky — ominous red-dark
        const sky = ctx.createLinearGradient(0, 0, 0, GY + 30);
        sky.addColorStop(0, '#1a0a0a');
        sky.addColorStop(0.3, '#3a1a10');
        sky.addColorStop(0.6, '#5a2a18');
        sky.addColorStop(1, '#804028');
        ctx.fillStyle = sky;
        ctx.fillRect(0, 0, W, GY + 30);

        // Dim red sun/glow behind volcano
        const sunX = W * 0.5, sunY = 70;
        const sg = ctx.createRadialGradient(sunX, sunY, 10, sunX, sunY, 180);
        sg.addColorStop(0, 'rgba(255,100,30,0.5)');
        sg.addColorStop(0.3, 'rgba(200,60,20,0.2)');
        sg.addColorStop(1, 'rgba(100,20,10,0)');
        ctx.fillStyle = sg;
        ctx.beginPath(); ctx.arc(sunX, sunY, 180, 0, Math.PI * 2); ctx.fill();

        // Ash clouds (dark, smoky)
        if (this.envClouds) {
            this.envClouds.forEach(c => {
                const cx = (c.x + t * c.drift * 0.4) % (W + 120) - 60;
                ctx.fillStyle = `rgba(80,40,30,${c.alpha * 0.5})`;
                ctx.beginPath(); ctx.ellipse(cx, c.y, c.w * 1.3, c.h * 1.1, 0, 0, Math.PI * 2); ctx.fill();
                ctx.beginPath(); ctx.ellipse(cx - c.w * 0.5, c.y + 5, c.w * 0.7, c.h * 0.9, 0, 0, Math.PI * 2); ctx.fill();
            });
        }

        // Distant volcanic mountain silhouette
        ctx.fillStyle = '#2a1a10';
        ctx.beginPath();
        ctx.moveTo(0, GY);
        ctx.lineTo(W * 0.2, GY - 60);
        ctx.lineTo(W * 0.35, GY - 120);
        ctx.lineTo(W * 0.45, GY - 140);
        ctx.lineTo(W * 0.5, GY - 155);
        ctx.lineTo(W * 0.55, GY - 140);
        ctx.lineTo(W * 0.65, GY - 120);
        ctx.lineTo(W * 0.8, GY - 50);
        ctx.lineTo(W, GY - 20);
        ctx.lineTo(W, GY);
        ctx.closePath();
        ctx.fill();

        // Lava glow at volcano top
        const lavaG = ctx.createRadialGradient(W * 0.5, GY - 145, 5, W * 0.5, GY - 130, 50);
        lavaG.addColorStop(0, 'rgba(255,120,20,0.6)');
        lavaG.addColorStop(0.5, 'rgba(200,60,10,0.2)');
        lavaG.addColorStop(1, 'rgba(100,30,5,0)');
        ctx.fillStyle = lavaG;
        ctx.beginPath(); ctx.arc(W * 0.5, GY - 130, 50, 0, Math.PI * 2); ctx.fill();

        // Ground — dark basalt/obsidian
        const grd = ctx.createLinearGradient(0, GY - 10, 0, H);
        grd.addColorStop(0, '#4a3828');
        grd.addColorStop(0.15, '#3a2a1a');
        grd.addColorStop(0.5, '#2a1a10');
        grd.addColorStop(1, '#1a0a08');
        ctx.fillStyle = grd;
        ctx.fillRect(0, GY - 10, W, H - GY + 10);

        // Lava cracks in ground
        ctx.strokeStyle = 'rgba(255,80,20,0.15)';
        ctx.lineWidth = 2;
        for (let i = 0; i < 8; i++) {
            const sx = 100 + i * 150 + Math.sin(i * 3) * 40;
            const sy = GY + 40 + i * 45;
            ctx.beginPath();
            ctx.moveTo(sx, sy);
            ctx.lineTo(sx + 30 + Math.sin(i) * 20, sy + 15);
            ctx.lineTo(sx + 50, sy + 5);
            ctx.stroke();
        }

        // Lava pool / river (animated glow)
        const lavaX = W * 0.48, lavaY = H - 60;
        const lavaW = 200, lavaH = 25;
        const lp = ctx.createRadialGradient(lavaX, lavaY, 10, lavaX, lavaY, lavaW * 0.6);
        lp.addColorStop(0, `rgba(255,${120 + Math.sin(t * 2) * 30},20,0.4)`);
        lp.addColorStop(0.5, `rgba(200,${60 + Math.sin(t * 3) * 20},10,0.2)`);
        lp.addColorStop(1, 'rgba(100,20,5,0)');
        ctx.fillStyle = lp;
        ctx.beginPath(); ctx.ellipse(lavaX, lavaY, lavaW * 0.5, lavaH, 0, 0, Math.PI * 2); ctx.fill();

        // Left: obsidian spires
        this._drawObsidianSpire(ctx, 50, GY, 140);
        this._drawObsidianSpire(ctx, 150, GY, 100);

        // Right: ruined orc fortifications
        ctx.fillStyle = '#3a2818';
        ctx.fillRect(1060, GY - 80, 60, 80);
        ctx.fillRect(1140, GY - 60, 50, 60);
        // Skull banner
        ctx.fillStyle = '#8a2020';
        ctx.fillRect(1075, GY - 100, 4, 25);
        ctx.fillRect(1070, GY - 100, 14, 10);
        // Spikes
        for (let i = 0; i < 3; i++) {
            ctx.fillStyle = '#5a3818';
            ctx.beginPath();
            ctx.moveTo(1060 + i * 30, GY - 80);
            ctx.lineTo(1065 + i * 30, GY - 95);
            ctx.lineTo(1070 + i * 30, GY - 80);
            ctx.closePath(); ctx.fill();
        }

        // Ember particles floating up
        for (let i = 0; i < 12; i++) {
            const px = 200 + i * 90 + Math.sin(t * 0.7 + i * 2) * 30;
            const py = GY + 100 - ((t * 20 + i * 40) % 200);
            const alpha = Math.max(0, 0.5 - py / (GY + 200) * 0.5);
            if (alpha > 0) {
                ctx.fillStyle = `rgba(255,${100 + i * 10},20,${alpha})`;
                ctx.beginPath(); ctx.arc(px, py, 1.5, 0, Math.PI * 2); ctx.fill();
            }
        }

        this._renderGroundParticles(ctx);
    },

    _renderGroundParticles(ctx) {
        if (this.groundParticles) {
            this.groundParticles.forEach(p => {
                ctx.fillStyle = p.color;
                ctx.fillRect(p.x, p.y, p.size, p.size);
            });
        }
    },

    // ─── Forest helper: tree ───
    _drawTree(ctx, x, gy, height, foliageColor, trunkColor) {
        const tw = 12;
        // Trunk
        ctx.fillStyle = trunkColor;
        ctx.fillRect(x + 15, gy - height * 0.35, tw, height * 0.35);
        // Foliage layers
        ctx.fillStyle = foliageColor;
        const fw = 50 + height * 0.2;
        ctx.beginPath(); ctx.ellipse(x + 20, gy - height * 0.5, fw * 0.5, height * 0.35, 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = this._darkenColor(foliageColor, 0.85);
        ctx.beginPath(); ctx.ellipse(x + 25, gy - height * 0.65, fw * 0.38, height * 0.22, 0, 0, Math.PI * 2); ctx.fill();
    },

    // ─── Forest helper: bush ───
    _drawBush(ctx, x, y) {
        ctx.fillStyle = '#3a6a20';
        ctx.beginPath(); ctx.ellipse(x, y, 20, 12, 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#4a7a28';
        ctx.beginPath(); ctx.ellipse(x + 8, y - 3, 14, 9, 0, 0, Math.PI * 2); ctx.fill();
    },

    // ─── Desert helper: pillar ───
    _drawPillar(ctx, x, gy, height) {
        ctx.fillStyle = '#c0a868';
        ctx.fillRect(x, gy - height, 16, height);
        // Capital
        ctx.fillStyle = '#d0b878';
        ctx.fillRect(x - 4, gy - height, 24, 8);
        // Cracks
        ctx.strokeStyle = 'rgba(0,0,0,0.1)';
        ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(x + 5, gy - height * 0.7); ctx.lineTo(x + 10, gy - height * 0.3); ctx.stroke();
    },

    // ─── Desert helper: tent ───
    _drawDesertTent(ctx, x, gy) {
        ctx.fillStyle = '#c09848';
        ctx.beginPath();
        ctx.moveTo(x, gy);
        ctx.lineTo(x + 50, gy - 55);
        ctx.lineTo(x + 100, gy);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#a08038';
        ctx.beginPath();
        ctx.moveTo(x + 30, gy);
        ctx.lineTo(x + 50, gy - 55);
        ctx.lineTo(x + 70, gy);
        ctx.closePath();
        ctx.fill();
        // Poles
        ctx.fillStyle = '#6a4820';
        ctx.fillRect(x + 48, gy - 60, 4, 65);
    },

    // ─── Desert helper: cactus ───
    _drawCactus(ctx, x, y) {
        ctx.fillStyle = '#3a7a30';
        ctx.fillRect(x, y - 30, 8, 30);
        ctx.fillRect(x - 8, y - 22, 8, 5);
        ctx.fillRect(x - 8, y - 30, 5, 13);
        ctx.fillRect(x + 8, y - 18, 8, 5);
        ctx.fillRect(x + 11, y - 25, 5, 12);
    },

    // ─── Volcanic helper: obsidian spire ───
    _drawObsidianSpire(ctx, x, gy, height) {
        ctx.fillStyle = '#1a1a2a';
        ctx.beginPath();
        ctx.moveTo(x, gy);
        ctx.lineTo(x + 12, gy - height);
        ctx.lineTo(x + 24, gy);
        ctx.closePath();
        ctx.fill();
        // Glowing edge
        ctx.strokeStyle = 'rgba(255,60,20,0.2)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x + 2, gy);
        ctx.lineTo(x + 12, gy - height + 5);
        ctx.stroke();
    },

    renderUnits(ctx, bf) {
        // Draw dead units first (behind living)
        bf.allUnits.filter(u => !u.alive && (u.deathTimer || 0) < 1.2).forEach(u => {
            const dt = u.deathTimer || 0;
            const fade = Math.max(0, 1 - dt / 1.0);
            ctx.save();
            ctx.globalAlpha = 0.6 * fade;
            ctx.translate(u.x, u.y);
            // Fall to the side
            const fallAngle = (u.facingRight ? 1 : -1) * Math.min(dt * 3, Math.PI / 2);
            ctx.rotate(fallAngle);
            ctx.translate(-u.x, -u.y);
            if (u.isHero) {
                this.drawHero(ctx, u, true);
            } else if (u.isBoss) {
                this.drawBoss(ctx, u, true);
            } else {
                this.drawUnit(ctx, u, true);
            }
            ctx.restore();
        });

        // Draw all living units sorted by y for depth
        const sorted = bf.allUnits.filter(u => u.alive).sort((a, b) => a.y - b.y);

        sorted.forEach(u => {
            if (u.isHero) {
                this.drawHero(ctx, u, false);
            } else if (u.isBoss) {
                this.drawBoss(ctx, u, false);
            } else {
                this.drawUnit(ctx, u, false);
            }
        });
    },

    _getSpriteKey(u) {
        if (u.side === 'ally') {
            const map = { infantry: 'unit_infantry', archer: 'unit_archer', cavalry: 'unit_cavalry', brute: 'unit_brute' };
            return map[u.type] || null;
        } else {
            // All new enemy types just use the humanoid renderer (return null)
            return null;
        }
    },

    // ─── Appearance configs ───
    _unitAppearance: {
        // Allied
        infantry:    { skin: '#d4a87a', hair: '#5a3820', armor: '#3a5a8a', armorLight: '#5878a8', pants: '#2a3450', boots: '#3a2a1a', weapon: 'sword', shield: true, helmetColor: '#4a6a98', shoulderPad: true, skirtArmor: true },
        archer:      { skin: '#c8a478', hair: '#7a5a28', armor: '#3a5a3a', armorLight: '#4a7a48', pants: '#2a3828', boots: '#4a3818', weapon: 'bow', shield: false, helmetColor: null, shoulderPad: false, quiver: true },
        cavalry:     { skin: '#d4a87a', hair: '#2a1810', armor: '#8a7a38', armorLight: '#a89848', pants: '#4a3820', boots: '#5a3818', weapon: 'lance', shield: true, helmetColor: '#988a40', shoulderPad: true, mounted: true },
        brute:       { skin: '#bca080', hair: '#1a1a1a', armor: '#6a3828', armorLight: '#8a5840', pants: '#3a2818', boots: '#2a1810', weapon: 'hammer', shield: false, helmetColor: '#5a3020', shoulderPad: true, bulky: true },
    },

    _heroAppearance: {
        Warrior:  { armor: '#3a4a7a', armorLight: '#5868a0', weapon: 'greatsword', shield: true, helmetColor: '#4858a0', shoulderPad: true, capeColor: null, skirtArmor: true },
        Ninja:    { armor: '#2a2838', armorLight: '#3a3848', weapon: 'daggers', shield: false, helmetColor: null, shoulderPad: false, capeColor: null, mask: true, scarf: true },
        Archer:   { armor: '#3a5a3a', armorLight: '#488a48', weapon: 'longbow', shield: false, helmetColor: null, shoulderPad: false, capeColor: '#2a4a2a', quiver: true },
        Mage:     { armor: '#4a387a', armorLight: '#6050a0', weapon: 'staff', shield: false, helmetColor: null, shoulderPad: false, capeColor: '#3a2a6a', hat: true, robe: true },
        Tank:     { armor: '#5a5a5a', armorLight: '#7a7a7a', weapon: 'sword', shield: true, helmetColor: '#6a6a6a', shoulderPad: true, capeColor: null, heavy: true, skirtArmor: true },
    },

    // ─── Feudalism-style humanoid renderer ───
    _drawHumanoid(ctx, x, y, scale, facing, t, state, appearance, hurtTint, attackAnimTimer, options) {
        // ── Beast form early exit (direwolf etc.) ──
        if (appearance.beast && appearance.wolfForm) {
            this._drawBeast(ctx, x, y, scale, facing, t, state, appearance, hurtTint);
            return;
        }

        const S = scale;
        const f = facing;
        const atk = attackAnimTimer || 0;
        const opt = options || {};
        const bulky = appearance.bulky ? 1.4 : (appearance.heavy ? 1.28 : 1.0);
        const small = appearance.small ? 0.82 : 1.0;
        const slender = appearance.slender ? 0.88 : 1.0;

        // ─── Animation parameters (more pronounced walk cycle) ───
        let legAngleFront = 0, legAngleBack = 0, armSwingFront = 0, armSwingBack = 0;
        let bodyBob = 0, bodyLean = 0, weapSwing = 0;
        let footLiftFront = 0, footLiftBack = 0;
        let kneeBendFront = 0, kneeBendBack = 0;

        switch (state) {
            case 'idle':
                bodyBob = Math.sin(t * 2) * 0.8 * S;
                armSwingFront = Math.sin(t * 1.2) * 0.05;
                armSwingBack = -armSwingFront;
                break;
            case 'walk': {
                const walkCycle = t * 7;
                legAngleFront = Math.sin(walkCycle) * 0.6;
                legAngleBack = Math.sin(walkCycle + Math.PI) * 0.6;
                kneeBendFront = Math.max(0, Math.sin(walkCycle + 0.5)) * 0.45;
                kneeBendBack = Math.max(0, Math.sin(walkCycle + Math.PI + 0.5)) * 0.45;
                footLiftFront = Math.max(0, -Math.sin(walkCycle)) * 3.5 * S;
                footLiftBack = Math.max(0, -Math.sin(walkCycle + Math.PI)) * 3.5 * S;
                armSwingFront = Math.sin(walkCycle + Math.PI) * 0.4;
                armSwingBack = Math.sin(walkCycle) * 0.4;
                bodyBob = Math.abs(Math.sin(walkCycle * 2)) * 1.5 * S;
                bodyLean = Math.sin(walkCycle) * 0.025;
                break;
            }
            case 'attack': {
                const atkPhase = atk;
                const swingProg = Math.min(atkPhase * 6, 1);
                armSwingFront = -swingProg * 1.8 * f;
                weapSwing = -swingProg * 2.2;
                bodyLean = swingProg * 0.15 * f;
                bodyBob = -swingProg * 4 * S;
                legAngleFront = swingProg * 0.2;
                break;
            }
            case 'hurt':
                bodyBob = -3 * S;
                bodyLean = -0.1 * f;
                armSwingFront = 0.15;
                armSwingBack = 0.15;
                break;
            case 'stun':
                bodyBob = Math.sin(t * 14) * 2 * S;
                armSwingFront = Math.sin(t * 7) * 0.1;
                break;
        }

        // ─── Body proportions (tall realistic Feudalism 2 style) ───
        const bx = x;
        const by = y + bodyBob;
        const headH = 5.5 * S * small;
        const headW = 4.2 * S * small * bulky * slender;
        const neckH = 2 * S;
        const torsoH = 13 * S * small;
        const torsoW = 7 * S * bulky * small * slender;
        const hipW = torsoW * 0.88;
        const shoulderW = torsoW * 1.15;
        const armUpper = 6.5 * S * small;
        const armLower = 6 * S * small;
        const armThick = 2.2 * S * bulky * slender;
        const legUpper = 7.5 * S * small;
        const legLower = 7 * S * small;
        const legThick = 2.8 * S * bulky * small * slender;
        const bootH = 3 * S * small;
        const totalHeight = torsoH + legUpper + legLower + bootH + neckH + headH;

        const neckY = by - torsoH * 0.5;
        const headCY = neckY - neckH - headH * 0.42;
        const shoulderY = by - torsoH * 0.4;
        const hipY = by + torsoH * 0.44;

        const skin = hurtTint ? '#e88070' : (appearance.skin || '#d4a87a');
        const armorC = hurtTint ? '#c05050' : (appearance.armor || '#666');
        const armorL = hurtTint ? '#d06060' : (appearance.armorLight || '#888');
        const armorD = hurtTint ? '#a03030' : this._darkenColor(appearance.armor || '#666', 0.7);
        const pantsC = appearance.pants || '#333';
        const bootsC = appearance.boots || '#2a1a10';
        const hairC = appearance.hair || '#3a2010';
        const helmetC = appearance.helmetColor;

        ctx.save();
        ctx.translate(bx, by);
        ctx.rotate(bodyLean);
        ctx.translate(-bx, -by);

        // ── Ghostly transparency (dust wraith etc.) ──
        if (appearance.ghostly) {
            ctx.globalAlpha = 0.5 + Math.sin(t * 2) * 0.12;
        }

        // ── GROUND SHADOW ──
        ctx.fillStyle = 'rgba(0,0,0,0.18)';
        ctx.beginPath();
        ctx.ellipse(x, y + legUpper + legLower + bootH + 2 * S, 8 * S * bulky, 2.5 * S, 0, 0, Math.PI * 2);
        ctx.fill();

        // ── MOUNT (cavalry) ──
        if (appearance.mounted) {
            this._drawMount(ctx, bx, by + torsoH * 0.3, S, f, t, state);
        }

        // ── TAIL (Dragonkin) ──
        if (appearance.tail) {
            const tailLen = torsoH * 1.1;
            const tailWave = Math.sin(t * 2.5) * 4 * S;
            ctx.strokeStyle = appearance.scaleColor || skin;
            ctx.lineWidth = 2.5 * S;
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.moveTo(bx - f * hipW * 0.3, hipY + 2 * S);
            ctx.quadraticCurveTo(
                bx - f * (hipW * 0.6 + tailLen * 0.3), hipY + tailLen * 0.4 + tailWave,
                bx - f * (hipW * 0.2 + tailLen * 0.5), hipY + tailLen * 0.15
            );
            ctx.stroke();
            // Tail spade tip
            ctx.fillStyle = appearance.scaleColor || skin;
            const tipX = bx - f * (hipW * 0.2 + tailLen * 0.5);
            const tipY = hipY + tailLen * 0.15;
            ctx.beginPath();
            ctx.moveTo(tipX, tipY - 2 * S);
            ctx.lineTo(tipX - f * 3 * S, tipY);
            ctx.lineTo(tipX, tipY + 2 * S);
            ctx.closePath();
            ctx.fill();
        }

        // ── CAPE ──
        const capeC = opt.capeColor || appearance.capeColor;
        if (capeC) {
            const capeLen = torsoH * 1.4 + Math.sin(t * 2) * 2.5 * S;
            const capeW = shoulderW * 0.9;
            // Cape body with wave
            ctx.fillStyle = capeC;
            ctx.beginPath();
            ctx.moveTo(bx - f * capeW * 0.45, neckY + 1 * S);
            ctx.lineTo(bx - f * capeW * 0.15, neckY + 1 * S);
            ctx.quadraticCurveTo(
                bx - f * capeW * 0.05, by + torsoH * 0.3 + Math.sin(t * 1.5) * 2 * S,
                bx - f * capeW * 0.1, neckY + capeLen
            );
            ctx.quadraticCurveTo(
                bx - f * capeW * 0.4, neckY + capeLen + Math.sin(t * 2.5) * 3 * S,
                bx - f * capeW * 0.55, neckY + capeLen - 2 * S
            );
            ctx.quadraticCurveTo(
                bx - f * capeW * 0.85, by + torsoH * 0.2 + Math.sin(t * 1.8) * 3 * S,
                bx - f * capeW * 0.45, neckY + 1 * S
            );
            ctx.closePath();
            ctx.fill();
            // Cape highlight fold
            ctx.fillStyle = 'rgba(255,255,255,0.08)';
            ctx.beginPath();
            ctx.moveTo(bx - f * capeW * 0.35, neckY + 3 * S);
            ctx.lineTo(bx - f * capeW * 0.2, neckY + capeLen * 0.6);
            ctx.lineTo(bx - f * capeW * 0.45, neckY + capeLen * 0.4);
            ctx.closePath();
            ctx.fill();
            // Dark fold line
            ctx.strokeStyle = 'rgba(0,0,0,0.12)';
            ctx.lineWidth = 0.5 * S;
            ctx.beginPath();
            ctx.moveTo(bx - f * capeW * 0.35, neckY + 4 * S);
            ctx.quadraticCurveTo(bx - f * capeW * 0.5, neckY + capeLen * 0.5, bx - f * capeW * 0.3, neckY + capeLen * 0.85);
            ctx.stroke();
        }

        // ── QUIVER (archers) ──
        if (appearance.quiver) {
            ctx.fillStyle = '#6a4a20';
            const qx = bx - f * torsoW * 0.48;
            ctx.fillRect(qx, shoulderY + 1 * S, 3 * S, torsoH * 0.7);
            // Quiver rim
            ctx.fillStyle = '#8a6a30';
            ctx.fillRect(qx - 0.5 * S, shoulderY, 4 * S, 1.5 * S);
            // Arrow shafts + feathers
            for (let i = 0; i < 4; i++) {
                ctx.fillStyle = '#a08040';
                ctx.fillRect(qx + 0.5 * S + i * 0.6 * S, shoulderY - i * 2 * S - 2 * S, 0.5 * S, 4 * S + i * 2 * S);
                // Fletching
                ctx.fillStyle = i % 2 === 0 ? '#c06040' : '#d0d0c0';
                ctx.beginPath();
                ctx.moveTo(qx + 0.7 * S + i * 0.6 * S, shoulderY - i * 2 * S - 2 * S);
                ctx.lineTo(qx - 0.5 * S + i * 0.6 * S, shoulderY - i * 2 * S - 4 * S);
                ctx.lineTo(qx + 1.5 * S + i * 0.6 * S, shoulderY - i * 2 * S - 4 * S);
                ctx.closePath();
                ctx.fill();
            }
        }

        // ── BACK ARM ──
        {
            const sx = bx - f * shoulderW * 0.5;
            ctx.save();
            ctx.translate(sx, shoulderY);
            ctx.rotate(armSwingBack);
            // Upper arm (armored sleeve)
            ctx.fillStyle = armorD;
            this._drawLimb(ctx, 0, 0, 0, armUpper, armThick);
            // Elbow joint
            ctx.fillStyle = armorD;
            ctx.beginPath();
            ctx.arc(0, armUpper, armThick * 0.5, 0, Math.PI * 2);
            ctx.fill();
            // Forearm (exposed or bracer)
            ctx.fillStyle = appearance.bracers ? armorC : skin;
            this._drawLimb(ctx, 0, armUpper, 0, armUpper + armLower, armThick * 0.82);
            // Gauntlet / hand
            ctx.fillStyle = appearance.gauntlets ? armorD : skin;
            ctx.beginPath();
            ctx.arc(0, armUpper + armLower, armThick * 0.5, 0, Math.PI * 2);
            ctx.fill();
            // ── Shield on back arm ──
            if (appearance.shield && state !== 'attack') {
                const shW = 6.5 * S, shH = 10 * S;
                const shY = armUpper * 0.4;
                // Shield body (kite shape)
                ctx.fillStyle = '#4a5a78';
                ctx.beginPath();
                ctx.moveTo(0, shY);
                ctx.lineTo(shW * 0.5, shY + shH * 0.12);
                ctx.lineTo(shW * 0.45, shY + shH * 0.55);
                ctx.lineTo(0, shY + shH);
                ctx.lineTo(-shW * 0.45, shY + shH * 0.55);
                ctx.lineTo(-shW * 0.5, shY + shH * 0.12);
                ctx.closePath();
                ctx.fill();
                // Shield rim
                ctx.strokeStyle = '#6a7a98';
                ctx.lineWidth = 0.8 * S;
                ctx.stroke();
                // Shield cross / emblem
                ctx.strokeStyle = '#8a9ab8';
                ctx.lineWidth = 0.7 * S;
                ctx.beginPath();
                ctx.moveTo(0, shY + shH * 0.15);
                ctx.lineTo(0, shY + shH * 0.75);
                ctx.stroke();
                ctx.beginPath();
                ctx.moveTo(-shW * 0.3, shY + shH * 0.35);
                ctx.lineTo(shW * 0.3, shY + shH * 0.35);
                ctx.stroke();
                // Boss
                ctx.fillStyle = '#9aaac0';
                ctx.beginPath();
                ctx.arc(0, shY + shH * 0.35, 1.8 * S, 0, Math.PI * 2);
                ctx.fill();
                ctx.strokeStyle = '#b0c0d0';
                ctx.lineWidth = 0.3 * S;
                ctx.stroke();
            }
            ctx.restore();
        }

        // ── BACK LEG (with knee bend) ──
        {
            ctx.save();
            ctx.translate(bx - f * hipW * 0.22, hipY);
            ctx.rotate(legAngleBack);
            // Thigh
            ctx.fillStyle = pantsC;
            this._drawLimb(ctx, 0, 0, 0, legUpper, legThick);
            // Knee joint
            ctx.fillStyle = pantsC;
            ctx.beginPath();
            ctx.arc(0, legUpper, legThick * 0.45, 0, Math.PI * 2);
            ctx.fill();
            // Shin (from knee with bend)
            ctx.save();
            ctx.translate(0, legUpper);
            ctx.rotate(kneeBendBack);
            ctx.fillStyle = pantsC;
            this._drawLimb(ctx, 0, 0, 0, legLower, legThick * 0.85);
            // Boot
            ctx.fillStyle = bootsC;
            const bootTop = legLower;
            ctx.fillRect(-legThick * 0.55, bootTop - bootH * 0.3, legThick * 1.2, bootH);
            // Boot toe
            ctx.fillRect(-legThick * 0.2 + f * legThick * 0.15, bootTop + bootH * 0.35, legThick * 0.9, bootH * 0.35);
            // Boot sole
            ctx.fillStyle = '#1a1008';
            ctx.fillRect(-legThick * 0.6, bootTop + bootH * 0.6, legThick * 1.4, bootH * 0.25);
            // Boot laces
            ctx.strokeStyle = 'rgba(0,0,0,0.15)';
            ctx.lineWidth = 0.25 * S;
            for (let i = 0; i < 3; i++) {
                ctx.beginPath();
                ctx.moveTo(-legThick * 0.3, bootTop - bootH * 0.2 + i * bootH * 0.22);
                ctx.lineTo(legThick * 0.3, bootTop - bootH * 0.2 + i * bootH * 0.22);
                ctx.stroke();
            }
            ctx.restore();
            ctx.restore();
        }

        // ── TORSO (detailed armor) ──
        // Main torso (trapezoidal, wider shoulders)
        ctx.fillStyle = armorC;
        ctx.beginPath();
        ctx.moveTo(bx - shoulderW * 0.52, neckY);
        ctx.lineTo(bx + shoulderW * 0.52, neckY);
        ctx.lineTo(bx + hipW * 0.46, hipY);
        ctx.lineTo(bx - hipW * 0.46, hipY);
        ctx.closePath();
        ctx.fill();

        // Chest plate (front facing side is lighter)
        ctx.fillStyle = armorL;
        ctx.beginPath();
        ctx.moveTo(bx + f * torsoW * 0.08, neckY + 1.5 * S);
        ctx.lineTo(bx + f * shoulderW * 0.48, neckY + 1.5 * S);
        ctx.lineTo(bx + f * hipW * 0.42, hipY - 2 * S);
        ctx.lineTo(bx + f * torsoW * 0.12, hipY - 2 * S);
        ctx.closePath();
        ctx.fill();

        // Chest muscle lines / armor seam
        ctx.strokeStyle = 'rgba(0,0,0,0.1)';
        ctx.lineWidth = 0.5 * S;
        // Center seam
        ctx.beginPath();
        ctx.moveTo(bx, neckY + 2 * S);
        ctx.lineTo(bx, hipY - 2 * S);
        ctx.stroke();
        // Pectoral line
        ctx.beginPath();
        ctx.moveTo(bx - shoulderW * 0.3, neckY + 4 * S);
        ctx.quadraticCurveTo(bx, neckY + 5.5 * S, bx + shoulderW * 0.3, neckY + 4 * S);
        ctx.stroke();

        // Abdomen plate segments
        ctx.strokeStyle = 'rgba(0,0,0,0.06)';
        ctx.lineWidth = 0.3 * S;
        for (let i = 1; i <= 3; i++) {
            const segY = neckY + torsoH * (0.35 + i * 0.12);
            ctx.beginPath();
            ctx.moveTo(bx - hipW * 0.35, segY);
            ctx.lineTo(bx + hipW * 0.35, segY);
            ctx.stroke();
        }

        // Belt (wider, with buckle detail)
        ctx.fillStyle = '#3a2818';
        const beltY = hipY - 2.5 * S;
        ctx.fillRect(bx - hipW * 0.52, beltY, hipW * 1.04, 3 * S);
        // Belt buckle
        ctx.fillStyle = '#c0a040';
        ctx.fillRect(bx - 1.8 * S, beltY + 0.3 * S, 3.6 * S, 2.4 * S);
        ctx.fillStyle = '#3a2818';
        ctx.fillRect(bx - 0.8 * S, beltY + 0.7 * S, 1.6 * S, 1.6 * S);
        // Belt studs
        ctx.fillStyle = '#a08030';
        for (let i = -2; i <= 2; i++) {
            if (i === 0) continue;
            ctx.beginPath();
            ctx.arc(bx + i * hipW * 0.2, beltY + 1.5 * S, 0.5 * S, 0, Math.PI * 2);
            ctx.fill();
        }

        // Armor skirt / tassets
        if (appearance.skirtArmor) {
            ctx.fillStyle = armorC;
            const tassetCount = 5;
            for (let i = 0; i < tassetCount; i++) {
                const tx = bx + (i - (tassetCount - 1) / 2) * hipW * 0.2;
                const tw = hipW * 0.17;
                const th = 5 * S;
                ctx.fillStyle = i % 2 === 0 ? armorC : armorD;
                ctx.beginPath();
                ctx.moveTo(tx - tw / 2, hipY);
                ctx.lineTo(tx + tw / 2, hipY);
                ctx.lineTo(tx + tw / 2 * 0.8, hipY + th);
                ctx.lineTo(tx - tw / 2 * 0.8, hipY + th);
                ctx.closePath();
                ctx.fill();
                ctx.strokeStyle = 'rgba(0,0,0,0.12)';
                ctx.lineWidth = 0.3 * S;
                ctx.stroke();
            }
        }

        // Robe overlay (mage)
        if (appearance.robe) {
            const prevAlpha = ctx.globalAlpha;
            ctx.fillStyle = armorC;
            ctx.globalAlpha = prevAlpha * 0.88;
            const robeBottom = hipY + legUpper + legLower * 0.6;
            ctx.beginPath();
            ctx.moveTo(bx - hipW * 0.52, hipY);
            ctx.lineTo(bx + hipW * 0.52, hipY);
            ctx.lineTo(bx + hipW * 0.65, robeBottom);
            ctx.quadraticCurveTo(bx, robeBottom + 2 * S, bx - hipW * 0.65, robeBottom);
            ctx.closePath();
            ctx.fill();
            // Robe trim
            ctx.strokeStyle = armorL;
            ctx.lineWidth = 0.8 * S;
            ctx.beginPath();
            ctx.moveTo(bx + hipW * 0.65, robeBottom);
            ctx.quadraticCurveTo(bx, robeBottom + 2 * S, bx - hipW * 0.65, robeBottom);
            ctx.stroke();
            // Central robe line
            ctx.strokeStyle = 'rgba(0,0,0,0.08)';
            ctx.lineWidth = 0.4 * S;
            ctx.beginPath();
            ctx.moveTo(bx, hipY + 2 * S);
            ctx.lineTo(bx, robeBottom - 1 * S);
            ctx.stroke();
            ctx.globalAlpha = prevAlpha;
        }

        // Shoulder pads (with rivets)
        if (appearance.shoulderPad) {
            [1, -1].forEach(side => {
                const padX = bx + side * shoulderW * 0.54;
                ctx.fillStyle = side === f ? armorL : armorC;
                ctx.beginPath();
                ctx.ellipse(padX, shoulderY, 3.8 * S * bulky, 2.5 * S, side * 0.15, 0, Math.PI * 2);
                ctx.fill();
                ctx.strokeStyle = 'rgba(0,0,0,0.18)';
                ctx.lineWidth = 0.4 * S;
                ctx.stroke();
                // Rivet dots
                ctx.fillStyle = '#b0a880';
                ctx.beginPath();
                ctx.arc(padX - side * 1.5 * S, shoulderY, 0.5 * S, 0, Math.PI * 2);
                ctx.fill();
                ctx.beginPath();
                ctx.arc(padX + side * 1.5 * S, shoulderY, 0.5 * S, 0, Math.PI * 2);
                ctx.fill();
                // Spike on dragonkin pads
                if (appearance.spikePads) {
                    ctx.fillStyle = '#8a7a60';
                    ctx.beginPath();
                    ctx.moveTo(padX, shoulderY - 2 * S);
                    ctx.lineTo(padX - 1 * S, shoulderY - 0.5 * S);
                    ctx.lineTo(padX + 1 * S, shoulderY - 0.5 * S);
                    ctx.closePath();
                    ctx.fill();
                }
            });
        }

        // ── Bark texture overlay (treant) ──
        if (appearance.bark) {
            ctx.strokeStyle = 'rgba(30,20,5,0.35)';
            ctx.lineWidth = 0.8 * S;
            for (let i = 0; i < 6; i++) {
                const lx = bx + (Math.sin(i * 2.1) * torsoW * 0.3);
                const ly = neckY + torsoH * (0.1 + i * 0.13);
                ctx.beginPath();
                ctx.moveTo(lx - torsoW * 0.15, ly);
                ctx.quadraticCurveTo(lx, ly + 2 * S, lx + torsoW * 0.15, ly - 1 * S);
                ctx.stroke();
            }
            // Mossy patches
            ctx.fillStyle = 'rgba(60,120,30,0.25)';
            ctx.beginPath(); ctx.ellipse(bx - torsoW * 0.2, neckY + torsoH * 0.3, 2.5 * S, 1.5 * S, 0.3, 0, Math.PI * 2); ctx.fill();
            ctx.beginPath(); ctx.ellipse(bx + torsoW * 0.15, neckY + torsoH * 0.6, 2 * S, 1.2 * S, -0.2, 0, Math.PI * 2); ctx.fill();
        }

        // ── Rocky texture overlay (sand golem) ──
        if (appearance.rocky) {
            ctx.fillStyle = 'rgba(80,60,30,0.3)';
            for (let i = 0; i < 5; i++) {
                const rx = bx + Math.sin(i * 3.7) * torsoW * 0.3;
                const ry = neckY + torsoH * (0.15 + i * 0.15);
                ctx.beginPath();
                ctx.moveTo(rx - 2 * S, ry);
                ctx.lineTo(rx, ry - 1.5 * S);
                ctx.lineTo(rx + 2.2 * S, ry + 0.5 * S);
                ctx.lineTo(rx + 0.5 * S, ry + 2 * S);
                ctx.closePath();
                ctx.fill();
            }
            // Crack lines
            ctx.strokeStyle = 'rgba(160,130,60,0.4)';
            ctx.lineWidth = 0.6 * S;
            ctx.beginPath();
            ctx.moveTo(bx - torsoW * 0.1, neckY + torsoH * 0.2);
            ctx.lineTo(bx + torsoW * 0.05, neckY + torsoH * 0.5);
            ctx.lineTo(bx - torsoW * 0.15, neckY + torsoH * 0.7);
            ctx.stroke();
        }

        // ── Lava glow cracks overlay (lava brute) ──
        if (appearance.lavaGlow) {
            const glow = 0.4 + Math.sin(t * 3) * 0.2;
            ctx.strokeStyle = `rgba(255,120,20,${glow})`;
            ctx.lineWidth = 1.2 * S;
            ctx.lineCap = 'round';
            // Vertical crack
            ctx.beginPath();
            ctx.moveTo(bx + torsoW * 0.05, neckY + 3 * S);
            ctx.quadraticCurveTo(bx - torsoW * 0.1, neckY + torsoH * 0.4, bx + torsoW * 0.08, hipY - 2 * S);
            ctx.stroke();
            // Diagonal cracks
            ctx.beginPath();
            ctx.moveTo(bx - torsoW * 0.3, neckY + torsoH * 0.25);
            ctx.lineTo(bx - torsoW * 0.05, neckY + torsoH * 0.4);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(bx + torsoW * 0.25, neckY + torsoH * 0.5);
            ctx.lineTo(bx + torsoW * 0.05, neckY + torsoH * 0.65);
            ctx.stroke();
            // Ember glow around body
            ctx.fillStyle = `rgba(255,80,10,${glow * 0.3})`;
            ctx.beginPath();
            ctx.ellipse(bx, by, torsoW * 0.7, torsoH * 0.4, 0, 0, Math.PI * 2);
            ctx.fill();
        }

        // ── FRONT LEG (with knee bend and detailed boot) ──
        {
            ctx.save();
            ctx.translate(bx + f * hipW * 0.22, hipY);
            ctx.rotate(legAngleFront);
            // Thigh
            ctx.fillStyle = pantsC;
            this._drawLimb(ctx, 0, 0, 0, legUpper, legThick);
            // Knee joint
            ctx.fillStyle = pantsC;
            ctx.beginPath();
            ctx.arc(0, legUpper, legThick * 0.45, 0, Math.PI * 2);
            ctx.fill();
            // Knee guard (armored characters)
            if (appearance.shoulderPad || appearance.heavy) {
                ctx.fillStyle = armorD;
                ctx.beginPath();
                ctx.ellipse(0, legUpper, legThick * 0.55, legThick * 0.4, 0, 0, Math.PI * 2);
                ctx.fill();
            }
            // Shin
            ctx.save();
            ctx.translate(0, legUpper);
            ctx.rotate(kneeBendFront);
            ctx.fillStyle = pantsC;
            this._drawLimb(ctx, 0, 0, 0, legLower, legThick * 0.85);
            // Shin guard (armored)
            if (appearance.heavy || appearance.skirtArmor) {
                ctx.fillStyle = armorD;
                ctx.fillRect(-legThick * 0.35, legLower * 0.15, legThick * 0.7, legLower * 0.6);
            }
            // Boot (detailed)
            ctx.fillStyle = bootsC;
            const bootTop = legLower;
            ctx.fillRect(-legThick * 0.55, bootTop - bootH * 0.3, legThick * 1.2, bootH);
            ctx.fillRect(-legThick * 0.2 + f * legThick * 0.15, bootTop + bootH * 0.35, legThick * 0.9, bootH * 0.35);
            ctx.fillStyle = '#1a1008';
            ctx.fillRect(-legThick * 0.6, bootTop + bootH * 0.6, legThick * 1.4, bootH * 0.25);
            // Boot cuff
            ctx.fillStyle = bootsC;
            ctx.fillRect(-legThick * 0.6, bootTop - bootH * 0.3, legThick * 1.3, 1 * S);
            ctx.strokeStyle = 'rgba(0,0,0,0.15)';
            ctx.lineWidth = 0.25 * S;
            for (let i = 0; i < 3; i++) {
                ctx.beginPath();
                ctx.moveTo(-legThick * 0.3, bootTop - bootH * 0.15 + i * bootH * 0.22);
                ctx.lineTo(legThick * 0.3, bootTop - bootH * 0.15 + i * bootH * 0.22);
                ctx.stroke();
            }
            ctx.restore();
            ctx.restore();
        }

        // ── NECK ──
        ctx.fillStyle = skin;
        ctx.fillRect(bx - 1.8 * S, neckY - neckH, 3.6 * S, neckH + 1.5 * S);
        // Neck shadow
        ctx.fillStyle = 'rgba(0,0,0,0.06)';
        ctx.fillRect(bx - 1.8 * S, neckY - neckH * 0.3, 3.6 * S, neckH * 0.3);

        // ── Dragonkin scale pattern on neck/chest ──
        if (appearance.scales) {
            ctx.fillStyle = appearance.scaleColor || 'rgba(200,80,40,0.2)';
            for (let row = 0; row < 3; row++) {
                for (let col = -1; col <= 1; col++) {
                    const sx = bx + col * 2.5 * S;
                    const sy = neckY + row * 2.5 * S + (col % 2 === 0 ? 1.2 * S : 0);
                    ctx.beginPath();
                    ctx.moveTo(sx, sy - 1 * S);
                    ctx.lineTo(sx + 1.2 * S, sy);
                    ctx.lineTo(sx, sy + 1 * S);
                    ctx.lineTo(sx - 1.2 * S, sy);
                    ctx.closePath();
                    ctx.fill();
                }
            }
        }

        // ── HEAD ──
        ctx.fillStyle = skin;
        ctx.beginPath();
        ctx.ellipse(bx, headCY, headW * 0.52, headH * 0.56, 0, 0, Math.PI * 2);
        ctx.fill();

        // Jaw (more defined)
        ctx.fillStyle = skin;
        ctx.beginPath();
        ctx.moveTo(bx - headW * 0.4, headCY + headH * 0.08);
        ctx.quadraticCurveTo(bx - headW * 0.1, headCY + headH * 0.65, bx, headCY + headH * 0.58);
        ctx.quadraticCurveTo(bx + headW * 0.1, headCY + headH * 0.65, bx + headW * 0.4, headCY + headH * 0.08);
        ctx.fill();

        // Cheek shadow
        ctx.fillStyle = 'rgba(0,0,0,0.04)';
        ctx.beginPath();
        ctx.ellipse(bx - f * headW * 0.15, headCY + headH * 0.15, headW * 0.2, headH * 0.18, 0, 0, Math.PI * 2);
        ctx.fill();

        // ── HORNS (Dragonkin) ──
        if (appearance.horns) {
            const hornC = appearance.hornColor || '#5a4a30';
            for (const side of [-1, 1]) {
                ctx.fillStyle = hornC;
                ctx.beginPath();
                ctx.moveTo(bx + side * headW * 0.35, headCY - headH * 0.35);
                ctx.quadraticCurveTo(
                    bx + side * headW * 0.9, headCY - headH * 1.0,
                    bx + side * headW * 0.7, headCY - headH * 1.4
                );
                ctx.lineTo(bx + side * headW * 0.55, headCY - headH * 1.1);
                ctx.quadraticCurveTo(
                    bx + side * headW * 0.65, headCY - headH * 0.6,
                    bx + side * headW * 0.25, headCY - headH * 0.3
                );
                ctx.closePath();
                ctx.fill();
                // Horn ridges
                ctx.strokeStyle = 'rgba(0,0,0,0.15)';
                ctx.lineWidth = 0.3 * S;
                for (let r = 0; r < 3; r++) {
                    const ry = headCY - headH * (0.45 + r * 0.25);
                    ctx.beginPath();
                    ctx.moveTo(bx + side * headW * (0.35 + r * 0.08), ry);
                    ctx.lineTo(bx + side * headW * (0.55 + r * 0.05), ry - headH * 0.1);
                    ctx.stroke();
                }
            }
        }

        // ── Helmet ──
        if (helmetC) {
            ctx.fillStyle = helmetC;
            ctx.beginPath();
            ctx.ellipse(bx, headCY - headH * 0.06, headW * 0.57, headH * 0.48, 0, Math.PI, Math.PI * 2);
            ctx.fill();
            // Helmet sides
            ctx.fillStyle = helmetC;
            ctx.fillRect(bx - headW * 0.55, headCY - headH * 0.2, headW * 1.1, headH * 0.22);
            // Visor rim
            ctx.fillStyle = 'rgba(0,0,0,0.25)';
            ctx.fillRect(bx - headW * 0.56, headCY - headH * 0.02, headW * 1.12, 1.5 * S);
            // Nose guard
            ctx.fillStyle = helmetC;
            ctx.fillRect(bx + f * headW * 0.06 - 0.6 * S, headCY - headH * 0.08, 1.2 * S, headH * 0.35);
            // Helmet highlight
            ctx.fillStyle = 'rgba(255,255,255,0.1)';
            ctx.beginPath();
            ctx.ellipse(bx + f * headW * 0.1, headCY - headH * 0.3, headW * 0.2, headH * 0.15, 0, 0, Math.PI * 2);
            ctx.fill();
            // Plume (if dragonkin or heavy)
            if (appearance.plume) {
                ctx.fillStyle = appearance.plumeColor || '#aa2020';
                ctx.beginPath();
                ctx.moveTo(bx, headCY - headH * 0.52);
                ctx.quadraticCurveTo(bx - f * 2 * S, headCY - headH * 1.2, bx - f * 1 * S, headCY - headH * 1.5);
                ctx.quadraticCurveTo(bx + f * 2 * S, headCY - headH * 1.3, bx, headCY - headH * 0.52);
                ctx.fill();
            }
        } else if (appearance.mask) {
            // Ninja face wrap
            ctx.fillStyle = '#1a1828';
            ctx.beginPath();
            ctx.ellipse(bx, headCY + headH * 0.1, headW * 0.5, headH * 0.32, 0, 0, Math.PI);
            ctx.fill();
            // Headband
            ctx.fillStyle = '#2a2840';
            ctx.fillRect(bx - headW * 0.52, headCY - headH * 0.12, headW * 1.04, 2 * S);
            // Scarf tails
            if (appearance.scarf) {
                ctx.fillStyle = '#2a2838';
                ctx.beginPath();
                ctx.moveTo(bx - f * headW * 0.35, headCY + headH * 0.4);
                ctx.quadraticCurveTo(
                    bx - f * headW * 1.0, headCY + headH * 1.4 + Math.sin(t * 3) * 2.5 * S,
                    bx - f * headW * 0.7, headCY + headH * 2.0
                );
                ctx.lineTo(bx - f * headW * 0.5, headCY + headH * 1.8);
                ctx.quadraticCurveTo(
                    bx - f * headW * 0.8, headCY + headH * 1.0 + Math.sin(t * 3) * 2 * S,
                    bx - f * headW * 0.35, headCY + headH * 0.4
                );
                ctx.closePath();
                ctx.fill();
            }
        } else if (appearance.hat) {
            // Wizard hat (taller, more ornate)
            ctx.fillStyle = armorC;
            ctx.beginPath();
            ctx.moveTo(bx + f * 1.5 * S, headCY - headH * 2.0);
            ctx.quadraticCurveTo(bx + headW * 0.3, headCY - headH * 1.0, bx + headW * 0.85, headCY - headH * 0.15);
            ctx.lineTo(bx - headW * 0.85, headCY - headH * 0.15);
            ctx.quadraticCurveTo(bx - headW * 0.3, headCY - headH * 1.0, bx + f * 1.5 * S, headCY - headH * 2.0);
            ctx.closePath();
            ctx.fill();
            // Brim
            ctx.fillStyle = armorL;
            ctx.beginPath();
            ctx.ellipse(bx, headCY - headH * 0.18, headW * 0.9, headH * 0.2, 0, 0, Math.PI * 2);
            ctx.fill();
            // Hat band
            ctx.fillStyle = '#c0a040';
            ctx.fillRect(bx - headW * 0.45, headCY - headH * 0.35, headW * 0.9, 1.5 * S);
            // Star ornament
            ctx.fillStyle = '#e0d080';
            ctx.beginPath();
            ctx.arc(bx + f * headW * 0.15, headCY - headH * 0.35, 1 * S, 0, Math.PI * 2);
            ctx.fill();
        } else if (appearance.hood || appearance.cult) {
            // Hood (bandit, ranger, cultist)
            const hoodC = appearance.cult ? '#4a1810' : (armorC || '#3a4a28');
            ctx.fillStyle = hoodC;
            // Hood dome
            ctx.beginPath();
            ctx.ellipse(bx, headCY - headH * 0.15, headW * 0.7, headH * 0.6, 0, Math.PI, Math.PI * 2);
            ctx.fill();
            // Hood sides draping down
            ctx.beginPath();
            ctx.moveTo(bx - headW * 0.7, headCY - headH * 0.15);
            ctx.lineTo(bx - headW * 0.6, headCY + headH * 0.5);
            ctx.quadraticCurveTo(bx, headCY + headH * 0.35, bx + headW * 0.6, headCY + headH * 0.5);
            ctx.lineTo(bx + headW * 0.7, headCY - headH * 0.15);
            ctx.closePath();
            ctx.fill();
            // Hood shadow / inner darkness
            ctx.fillStyle = 'rgba(0,0,0,0.25)';
            ctx.beginPath();
            ctx.ellipse(bx + f * headW * 0.1, headCY + headH * 0.05, headW * 0.4, headH * 0.25, 0, 0, Math.PI * 2);
            ctx.fill();
            // Cultist: flame symbol on hood
            if (appearance.cult) {
                ctx.fillStyle = 'rgba(255,100,20,0.6)';
                ctx.beginPath();
                ctx.moveTo(bx, headCY - headH * 0.55);
                ctx.lineTo(bx - 1.5 * S, headCY - headH * 0.25);
                ctx.lineTo(bx + 1.5 * S, headCY - headH * 0.25);
                ctx.closePath();
                ctx.fill();
            }
        } else if (appearance.turban) {
            // Turban (desert raider, sand archer)
            ctx.fillStyle = '#e8dcc0';
            // Main wrap
            ctx.beginPath();
            ctx.ellipse(bx, headCY - headH * 0.2, headW * 0.6, headH * 0.5, 0, Math.PI, Math.PI * 2);
            ctx.fill();
            // Turban layers
            ctx.fillStyle = '#dfd0b0';
            ctx.beginPath();
            ctx.ellipse(bx + f * headW * 0.07, headCY - headH * 0.25, headW * 0.5, headH * 0.38, 0.1, Math.PI, Math.PI * 2);
            ctx.fill();
            // Band across forehead
            ctx.fillStyle = '#e0d0a8';
            ctx.fillRect(bx - headW * 0.55, headCY - headH * 0.12, headW * 1.1, 2 * S);
            // Trailing tail cloth
            ctx.fillStyle = '#d8c8a0';
            ctx.beginPath();
            ctx.moveTo(bx - f * headW * 0.4, headCY + headH * 0.05);
            ctx.quadraticCurveTo(
                bx - f * headW * 0.9, headCY + headH * 0.8 + Math.sin(t * 2) * 1.5 * S,
                bx - f * headW * 0.6, headCY + headH * 1.4
            );
            ctx.lineTo(bx - f * headW * 0.4, headCY + headH * 1.2);
            ctx.quadraticCurveTo(
                bx - f * headW * 0.7, headCY + headH * 0.6 + Math.sin(t * 2) * S,
                bx - f * headW * 0.3, headCY + headH * 0.05
            );
            ctx.closePath();
            ctx.fill();
        } else if (hairC && appearance.hair !== null) {
            // Hair (fuller, more detailed)
            ctx.fillStyle = hairC;
            // Top hair
            ctx.beginPath();
            ctx.ellipse(bx, headCY - headH * 0.18, headW * 0.54, headH * 0.48, 0, Math.PI * 1.0, Math.PI * 2.0);
            ctx.fill();
            // Side hair tufts
            ctx.fillRect(bx - headW * 0.52, headCY - headH * 0.3, headW * 0.18, headH * 0.55);
            ctx.fillRect(bx + headW * 0.34, headCY - headH * 0.3, headW * 0.18, headH * 0.55);
            // Back hair (longer for elves)
            if (appearance.longHair) {
                ctx.beginPath();
                ctx.moveTo(bx - f * headW * 0.45, headCY + headH * 0.1);
                ctx.quadraticCurveTo(
                    bx - f * headW * 0.6, headCY + headH * 1.5 + Math.sin(t * 1.5) * S,
                    bx - f * headW * 0.3, headCY + headH * 2.2
                );
                ctx.lineTo(bx - f * headW * 0.15, headCY + headH * 2.0);
                ctx.quadraticCurveTo(
                    bx - f * headW * 0.4, headCY + headH * 1.2,
                    bx - f * headW * 0.35, headCY + headH * 0.1
                );
                ctx.closePath();
                ctx.fill();
            }
        }

        // ── Pointy ears (Elf / Goblin) ──
        if (appearance.earPointy) {
            ctx.fillStyle = skin;
            for (const side of [-1, 1]) {
                ctx.beginPath();
                ctx.moveTo(bx + side * headW * 0.46, headCY + headH * 0.05);
                ctx.quadraticCurveTo(
                    bx + side * headW * 0.95, headCY - headH * 0.3,
                    bx + side * headW * 0.9, headCY - headH * 0.55
                );
                ctx.lineTo(bx + side * headW * 0.7, headCY - headH * 0.25);
                ctx.lineTo(bx + side * headW * 0.44, headCY - headH * 0.1);
                ctx.closePath();
                ctx.fill();
                // Inner ear shadow
                ctx.fillStyle = 'rgba(180,120,100,0.3)';
                ctx.beginPath();
                ctx.moveTo(bx + side * headW * 0.5, headCY);
                ctx.lineTo(bx + side * headW * 0.8, headCY - headH * 0.3);
                ctx.lineTo(bx + side * headW * 0.55, headCY - headH * 0.05);
                ctx.closePath();
                ctx.fill();
                ctx.fillStyle = skin;
            }
        }

        // ── Tusks (Orc enemies) ──
        if (appearance.tusks) {
            ctx.fillStyle = '#e8e0c8';
            for (const side of [-1, 1]) {
                ctx.beginPath();
                ctx.moveTo(bx + side * headW * 0.22, headCY + headH * 0.28);
                ctx.lineTo(bx + side * headW * 0.35, headCY - headH * 0.08);
                ctx.lineTo(bx + side * headW * 0.15, headCY + headH * 0.22);
                ctx.closePath();
                ctx.fill();
            }
        }

        // ── EYES ──
        const eyeY = headCY - headH * 0.04;
        const eyeSpace = headW * 0.195;
        if (!appearance.mask) {
            // Eye whites
            ctx.fillStyle = '#f0ece0';
            ctx.beginPath();
            ctx.ellipse(bx + f * eyeSpace, eyeY, 1.8 * S * small, 1.4 * S * small, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.ellipse(bx + f * eyeSpace * 3, eyeY, 1.8 * S * small, 1.4 * S * small, 0, 0, Math.PI * 2);
            ctx.fill();
            // Iris
            const eyeCol = opt.eyeColor || appearance.eyeColor || '#2a1a08';
            ctx.fillStyle = eyeCol;
            ctx.beginPath();
            ctx.arc(bx + f * eyeSpace * 1.2, eyeY, 1.0 * S * small, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(bx + f * eyeSpace * 3.2, eyeY, 1.0 * S * small, 0, Math.PI * 2);
            ctx.fill();
            // Pupil
            ctx.fillStyle = '#0a0a0a';
            ctx.beginPath();
            ctx.arc(bx + f * eyeSpace * 1.25, eyeY, 0.45 * S * small, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(bx + f * eyeSpace * 3.25, eyeY, 0.45 * S * small, 0, Math.PI * 2);
            ctx.fill();
            // Eye highlight
            ctx.fillStyle = 'rgba(255,255,255,0.6)';
            ctx.beginPath();
            ctx.arc(bx + f * eyeSpace * 1.0, eyeY - 0.3 * S, 0.35 * S, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(bx + f * eyeSpace * 3.0, eyeY - 0.3 * S, 0.35 * S, 0, Math.PI * 2);
            ctx.fill();
            // Eyebrows
            ctx.strokeStyle = hairC;
            ctx.lineWidth = 0.7 * S;
            ctx.beginPath();
            ctx.moveTo(bx + f * eyeSpace * 0.3, eyeY - 1.8 * S);
            ctx.lineTo(bx + f * eyeSpace * 1.8, eyeY - 2 * S);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(bx + f * eyeSpace * 2.3, eyeY - 2 * S);
            ctx.lineTo(bx + f * eyeSpace * 3.8, eyeY - 1.8 * S);
            ctx.stroke();
            // Dragonkin glowing eyes overlay
            if (appearance.glowEyes) {
                const glow = 0.3 + Math.sin(t * 4) * 0.2;
                ctx.fillStyle = `rgba(255,100,20,${glow})`;
                ctx.beginPath();
                ctx.arc(bx + f * eyeSpace * 1.2, eyeY, 2 * S, 0, Math.PI * 2);
                ctx.fill();
                ctx.beginPath();
                ctx.arc(bx + f * eyeSpace * 3.2, eyeY, 2 * S, 0, Math.PI * 2);
                ctx.fill();
            }
        } else {
            // Ninja slit eyes (more menacing)
            ctx.fillStyle = '#e0d8c0';
            const slitW = 3.5 * S;
            ctx.fillRect(bx + f * eyeSpace * 0.2 - slitW * 0.5, eyeY - 0.5 * S, slitW, 1 * S);
            ctx.fillRect(bx + f * eyeSpace * 2.5 - slitW * 0.5, eyeY - 0.5 * S, slitW, 1 * S);
        }

        // ── Nose ──
        if (!appearance.mask) {
            ctx.fillStyle = 'rgba(0,0,0,0.07)';
            ctx.beginPath();
            ctx.moveTo(bx + f * headW * 0.09, headCY - headH * 0.02);
            ctx.lineTo(bx + f * headW * 0.22, headCY + headH * 0.2);
            ctx.lineTo(bx + f * headW * 0.05, headCY + headH * 0.22);
            ctx.closePath();
            ctx.fill();
            // Nostril
            ctx.fillStyle = 'rgba(0,0,0,0.04)';
            ctx.beginPath();
            ctx.arc(bx + f * headW * 0.14, headCY + headH * 0.2, 0.5 * S, 0, Math.PI * 2);
            ctx.fill();
        }

        // ── Mouth ──
        if (!appearance.mask) {
            ctx.strokeStyle = 'rgba(0,0,0,0.18)';
            ctx.lineWidth = 0.6 * S;
            ctx.beginPath();
            ctx.moveTo(bx + f * headW * 0.02, headCY + headH * 0.3);
            ctx.quadraticCurveTo(bx + f * headW * 0.12, headCY + headH * 0.33, bx + f * headW * 0.22, headCY + headH * 0.29);
            ctx.stroke();
        }

        // ── FRONT ARM + WEAPON ──
        {
            const sx = bx + f * shoulderW * 0.5;
            ctx.save();
            ctx.translate(sx, shoulderY);
            ctx.rotate(armSwingFront);

            // Upper arm (armored)
            ctx.fillStyle = armorC;
            this._drawLimb(ctx, 0, 0, 0, armUpper, armThick);
            // Elbow joint
            ctx.fillStyle = armorC;
            ctx.beginPath();
            ctx.arc(0, armUpper, armThick * 0.5, 0, Math.PI * 2);
            ctx.fill();
            // Forearm (bracer or skin)
            ctx.fillStyle = appearance.bracers ? armorL : skin;
            this._drawLimb(ctx, 0, armUpper, 0, armUpper + armLower, armThick * 0.82);
            // Gauntlet / hand
            ctx.fillStyle = appearance.gauntlets ? armorC : skin;
            ctx.beginPath();
            ctx.arc(0, armUpper + armLower, armThick * 0.5, 0, Math.PI * 2);
            ctx.fill();
            // Fingers gripping
            ctx.fillStyle = appearance.gauntlets ? armorC : skin;
            ctx.fillRect(-armThick * 0.3, armUpper + armLower, armThick * 0.6, armThick * 0.4);

            // Weapon
            this._drawWeapon(ctx, 0, armUpper + armLower, S * small, f, appearance.weapon, weapSwing, t, hurtTint);
            ctx.restore();
        }

        ctx.restore();
    },

    // Color utility: darken a hex color
    _darkenColor(hex, factor) {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        const dr = Math.floor(r * factor);
        const dg = Math.floor(g * factor);
        const db = Math.floor(b * factor);
        return '#' + [dr, dg, db].map(v => Math.min(255, Math.max(0, v)).toString(16).padStart(2, '0')).join('');
    },

    // Tapered limb segment (with muscle bulge option)
    _drawLimb(ctx, x1, y1, x2, y2, width) {
        const hw = width * 0.5;
        const midY = (y1 + y2) * 0.5;
        const bulge = hw * 1.08;
        ctx.beginPath();
        ctx.moveTo(x1 - hw, y1);
        ctx.quadraticCurveTo(-bulge, midY, x2 - hw * 0.82, y2);
        ctx.lineTo(x2 + hw * 0.82, y2);
        ctx.quadraticCurveTo(bulge, midY, x1 + hw, y1);
        ctx.closePath();
        ctx.fill();
    },

    // Cavalry mount (detailed horse)
    _drawMount(ctx, x, y, S, f, t, state) {
        // Horse body
        ctx.fillStyle = '#6a4a28';
        ctx.beginPath();
        ctx.ellipse(x, y + 4 * S, 13 * S, 6.5 * S, 0, 0, Math.PI * 2);
        ctx.fill();
        // Body highlight
        ctx.fillStyle = 'rgba(255,255,255,0.06)';
        ctx.beginPath();
        ctx.ellipse(x + f * 2 * S, y + 2 * S, 8 * S, 3 * S, 0, 0, Math.PI * 2);
        ctx.fill();
        // Neck
        ctx.fillStyle = '#5a3a20';
        ctx.beginPath();
        ctx.moveTo(x + f * 9 * S, y - 1 * S);
        ctx.quadraticCurveTo(x + f * 15 * S, y - 9 * S, x + f * 13 * S, y - 11 * S);
        ctx.lineTo(x + f * 11 * S, y - 9 * S);
        ctx.quadraticCurveTo(x + f * 11 * S, y - 2 * S, x + f * 7 * S, y + 1 * S);
        ctx.closePath();
        ctx.fill();
        // Head
        ctx.fillStyle = '#5a3a20';
        ctx.beginPath();
        ctx.ellipse(x + f * 14 * S, y - 11 * S, 4 * S, 2.8 * S, f * 0.4, 0, Math.PI * 2);
        ctx.fill();
        // Nostril
        ctx.fillStyle = '#2a1810';
        ctx.beginPath();
        ctx.arc(x + f * 17 * S, y - 10.5 * S, 0.6 * S, 0, Math.PI * 2);
        ctx.fill();
        // Eye
        ctx.fillStyle = '#1a1008';
        ctx.beginPath();
        ctx.arc(x + f * 15.5 * S, y - 11.5 * S, 0.7 * S, 0, Math.PI * 2);
        ctx.fill();
        // Mane
        ctx.fillStyle = '#2a1808';
        for (let i = 0; i < 5; i++) {
            ctx.fillRect(x + f * (8 + i) * S, y - (10 - i * 1.5) * S, f * 2 * S, 2.5 * S);
        }
        // Legs with animated gait
        ctx.fillStyle = '#5a3a20';
        const legData = [[-1, 0], [-0.4, 0.5], [0.4, 1.0], [1, 1.5]];
        legData.forEach(([offX, phase]) => {
            const lx = x + offX * 8 * S;
            const ly = y + 8 * S;
            const swing = state === 'walk' ? Math.sin(t * 8 + phase * Math.PI) * 3 * S : 0;
            const lift = state === 'walk' ? Math.max(0, -Math.sin(t * 8 + phase * Math.PI)) * 2 * S : 0;
            ctx.fillRect(lx - 1 * S, ly - lift, 2 * S, 9 * S + swing);
            // Hoof
            ctx.fillStyle = '#1a1008';
            ctx.fillRect(lx - 1.2 * S, ly + 9 * S + swing - lift, 2.4 * S, 1.2 * S);
            ctx.fillStyle = '#5a3a20';
        });
        // Tail
        ctx.strokeStyle = '#2a1808';
        ctx.lineWidth = 2 * S;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(x - f * 12 * S, y + 1 * S);
        ctx.quadraticCurveTo(x - f * 17 * S, y + 7 * S + Math.sin(t * 2) * 4 * S, x - f * 16 * S, y + 12 * S);
        ctx.stroke();
        // Saddle
        ctx.fillStyle = '#8a2020';
        ctx.beginPath();
        ctx.ellipse(x, y - 1 * S, 5 * S, 3 * S, 0, 0, Math.PI * 2);
        ctx.fill();
        // Saddle blanket
        ctx.fillStyle = '#6a1818';
        ctx.fillRect(x - 6 * S, y - 0.5 * S, 12 * S, 3 * S);
        // Stirrup
        ctx.strokeStyle = '#808080';
        ctx.lineWidth = 0.5 * S;
        ctx.beginPath();
        ctx.moveTo(x + f * 3 * S, y);
        ctx.lineTo(x + f * 3 * S, y + 6 * S);
        ctx.stroke();
        ctx.fillStyle = '#808080';
        ctx.fillRect(x + f * 2 * S, y + 5.5 * S, 2.5 * S, 1 * S);
    },

    // ─── Beast / wolf form renderer ───
    _drawBeast(ctx, x, y, scale, facing, t, state, appearance, hurtTint) {
        const S = scale;
        const f = facing;
        const skin = hurtTint ? '#e88070' : (appearance.skin || '#8a8a9a');
        const darkSkin = hurtTint ? '#c06060' : this._darkenColor(skin, 0.7);

        let bodyBob = 0, legPhase = 0;
        if (state === 'walk') {
            bodyBob = Math.abs(Math.sin(t * 8)) * 2 * S;
            legPhase = t * 8;
        } else if (state === 'attack') {
            bodyBob = -3 * S;
        } else if (state === 'hurt') {
            bodyBob = -2 * S;
        } else {
            bodyBob = Math.sin(t * 2) * 0.5 * S;
        }

        const bx = x;
        const by = y + bodyBob;

        // Ground shadow
        ctx.fillStyle = 'rgba(0,0,0,0.18)';
        ctx.beginPath();
        ctx.ellipse(bx, y + 12 * S, 10 * S, 2.5 * S, 0, 0, Math.PI * 2);
        ctx.fill();

        // Body
        ctx.fillStyle = skin;
        ctx.beginPath();
        ctx.ellipse(bx, by, 10 * S, 5 * S, 0, 0, Math.PI * 2);
        ctx.fill();
        // Belly highlight
        ctx.fillStyle = 'rgba(255,255,255,0.08)';
        ctx.beginPath();
        ctx.ellipse(bx, by + 2 * S, 7 * S, 2.5 * S, 0, 0, Math.PI * 2);
        ctx.fill();

        // Legs (4 legs with walking animation)
        ctx.fillStyle = darkSkin;
        const legs = [[-0.6, 0], [-0.25, 0.5], [0.25, 1.0], [0.6, 1.5]];
        legs.forEach(([offX, phase]) => {
            const lx = bx + offX * 12 * S;
            const swing = state === 'walk' ? Math.sin(legPhase + phase * Math.PI) * 3 * S : 0;
            const lift = state === 'walk' ? Math.max(0, -Math.sin(legPhase + phase * Math.PI)) * 2 * S : 0;
            ctx.fillRect(lx - 1.2 * S, by + 3.5 * S - lift, 2.4 * S, 8 * S + swing);
            // Paw
            ctx.fillStyle = darkSkin;
            ctx.beginPath();
            ctx.ellipse(lx, by + 11.5 * S + swing - lift, 1.8 * S, 1 * S, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = darkSkin;
        });

        // Neck
        ctx.fillStyle = skin;
        ctx.beginPath();
        ctx.moveTo(bx + f * 8 * S, by - 3 * S);
        ctx.quadraticCurveTo(bx + f * 13 * S, by - 8 * S, bx + f * 12 * S, by - 10 * S);
        ctx.lineTo(bx + f * 9 * S, by - 8 * S);
        ctx.quadraticCurveTo(bx + f * 9 * S, by - 4 * S, bx + f * 6 * S, by - 1 * S);
        ctx.closePath();
        ctx.fill();

        // Head
        ctx.fillStyle = skin;
        ctx.beginPath();
        ctx.ellipse(bx + f * 13 * S, by - 10 * S, 4 * S, 3 * S, f * 0.3, 0, Math.PI * 2);
        ctx.fill();
        // Snout
        ctx.fillStyle = darkSkin;
        ctx.beginPath();
        ctx.ellipse(bx + f * 16.5 * S, by - 9.5 * S, 2.5 * S, 1.8 * S, f * 0.2, 0, Math.PI * 2);
        ctx.fill();
        // Nose
        ctx.fillStyle = '#1a1018';
        ctx.beginPath();
        ctx.arc(bx + f * 18.5 * S, by - 9.5 * S, 0.8 * S, 0, Math.PI * 2);
        ctx.fill();
        // Eye
        ctx.fillStyle = '#cc4400';
        ctx.beginPath();
        ctx.arc(bx + f * 14 * S, by - 11 * S, 1 * S, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#0a0a0a';
        ctx.beginPath();
        ctx.arc(bx + f * 14.2 * S, by - 11 * S, 0.5 * S, 0, Math.PI * 2);
        ctx.fill();
        // Ears
        for (const side of [-1, 1]) {
            ctx.fillStyle = skin;
            ctx.beginPath();
            ctx.moveTo(bx + f * 11 * S + side * 2 * S, by - 11 * S);
            ctx.lineTo(bx + f * 10.5 * S + side * 1 * S, by - 14 * S);
            ctx.lineTo(bx + f * 12 * S + side * 2.5 * S, by - 11.5 * S);
            ctx.closePath();
            ctx.fill();
        }

        // Tail
        ctx.strokeStyle = skin;
        ctx.lineWidth = 2 * S;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(bx - f * 10 * S, by - 1 * S);
        ctx.quadraticCurveTo(
            bx - f * 16 * S, by - 5 * S + Math.sin(t * 3) * 3 * S,
            bx - f * 14 * S, by - 8 * S + Math.sin(t * 2.5) * 2 * S
        );
        ctx.stroke();

        // Mouth / teeth when attacking
        if (state === 'attack') {
            ctx.fillStyle = '#aa2020';
            ctx.beginPath();
            ctx.ellipse(bx + f * 17 * S, by - 8.5 * S, 2 * S, 1.2 * S, f * 0.1, 0, Math.PI);
            ctx.fill();
            // Fangs
            ctx.fillStyle = '#fff';
            ctx.beginPath();
            ctx.moveTo(bx + f * 16 * S, by - 8.5 * S);
            ctx.lineTo(bx + f * 16.3 * S, by - 7 * S);
            ctx.lineTo(bx + f * 16.6 * S, by - 8.5 * S);
            ctx.fill();
            ctx.beginPath();
            ctx.moveTo(bx + f * 17.5 * S, by - 8.5 * S);
            ctx.lineTo(bx + f * 17.8 * S, by - 7 * S);
            ctx.lineTo(bx + f * 18.1 * S, by - 8.5 * S);
            ctx.fill();
        }

        // Fur texture lines
        ctx.strokeStyle = 'rgba(0,0,0,0.1)';
        ctx.lineWidth = 0.4 * S;
        for (let i = 0; i < 6; i++) {
            const fx = bx + (i - 2.5) * 3 * S;
            ctx.beginPath();
            ctx.moveTo(fx, by - 3 * S);
            ctx.lineTo(fx + f * 1.5 * S, by - 4.5 * S);
            ctx.stroke();
        }
    },

    // ─── Weapon renderer (bigger, more detailed) ───
    _drawWeapon(ctx, hx, hy, S, facing, weaponType, swingAngle, t, hurtTint) {
        const f = facing;
        ctx.save();
        ctx.translate(hx, hy);

        switch (weaponType) {
            case 'sword':
            case 'greatsword': {
                const isGreat = weaponType === 'greatsword';
                const len = isGreat ? 20 * S : 14 * S;
                const bladeW = isGreat ? 1.6 : 1.1;
                ctx.rotate(-swingAngle * 0.4 - 0.3);
                // Blade
                ctx.fillStyle = hurtTint ? '#c08888' : '#d0d0e0';
                ctx.beginPath();
                ctx.moveTo(-0.7 * S * bladeW, 0);
                ctx.lineTo(0.7 * S * bladeW, 0);
                ctx.lineTo(0.5 * S * bladeW, -len * 0.85);
                ctx.lineTo(0, -len);
                ctx.lineTo(-0.5 * S * bladeW, -len * 0.85);
                ctx.closePath();
                ctx.fill();
                // Blade edge highlight
                ctx.fillStyle = 'rgba(255,255,255,0.3)';
                ctx.beginPath();
                ctx.moveTo(0.4 * S * bladeW, -1 * S);
                ctx.lineTo(0.5 * S * bladeW, -len * 0.85);
                ctx.lineTo(0, -len);
                ctx.lineTo(0.1 * S, -1 * S);
                ctx.closePath();
                ctx.fill();
                // Fuller / blood groove
                ctx.strokeStyle = 'rgba(0,0,0,0.1)';
                ctx.lineWidth = 0.5 * S;
                ctx.beginPath();
                ctx.moveTo(0, -3 * S);
                ctx.lineTo(0, -len * 0.7);
                ctx.stroke();
                // Cross guard (ornate)
                ctx.fillStyle = hurtTint ? '#a06840' : '#b09030';
                const guardW = isGreat ? 4.5 : 3.5;
                ctx.beginPath();
                ctx.moveTo(-guardW * S, -0.8 * S);
                ctx.lineTo(-guardW * S, 0.8 * S);
                ctx.lineTo(-guardW * S * 0.8, 1.2 * S);
                ctx.lineTo(guardW * S * 0.8, 1.2 * S);
                ctx.lineTo(guardW * S, 0.8 * S);
                ctx.lineTo(guardW * S, -0.8 * S);
                ctx.closePath();
                ctx.fill();
                // Grip (leather wrapped)
                ctx.fillStyle = '#3a2010';
                const gripLen = isGreat ? 5 : 3.5;
                ctx.fillRect(-0.8 * S, 0.5 * S, 1.6 * S, gripLen * S);
                // Grip wrap lines
                ctx.strokeStyle = 'rgba(0,0,0,0.15)';
                ctx.lineWidth = 0.25 * S;
                for (let i = 0; i < 4; i++) {
                    ctx.beginPath();
                    ctx.moveTo(-0.8 * S, 1 * S + i * gripLen * S * 0.25);
                    ctx.lineTo(0.8 * S, 1.5 * S + i * gripLen * S * 0.25);
                    ctx.stroke();
                }
                // Pommel
                ctx.fillStyle = '#b09030';
                ctx.beginPath();
                ctx.arc(0, (gripLen + 1) * S, 1 * S, 0, Math.PI * 2);
                ctx.fill();
                // Pommel gem
                ctx.fillStyle = isGreat ? '#c04040' : '#4060c0';
                ctx.beginPath();
                ctx.arc(0, (gripLen + 1) * S, 0.4 * S, 0, Math.PI * 2);
                ctx.fill();
                break;
            }
            case 'daggers': {
                ctx.rotate(-swingAngle * 0.35 - 0.2);
                for (let i = -1; i <= 1; i += 2) {
                    const dLen = 9 * S;
                    // Blade
                    ctx.fillStyle = hurtTint ? '#c09999' : '#b8b8cc';
                    ctx.beginPath();
                    ctx.moveTo(i * 2 * S, 0);
                    ctx.lineTo(i * 1 * S, -dLen);
                    ctx.lineTo(i * 0.4 * S, -dLen - 1.5 * S);
                    ctx.lineTo(i * 1.2 * S, 0);
                    ctx.closePath();
                    ctx.fill();
                    // Edge highlight
                    ctx.fillStyle = 'rgba(255,255,255,0.25)';
                    ctx.beginPath();
                    ctx.moveTo(i * 1.5 * S, -1 * S);
                    ctx.lineTo(i * 0.7 * S, -dLen);
                    ctx.lineTo(i * 0.4 * S, -dLen - 1.5 * S);
                    ctx.lineTo(i * 1 * S, -1 * S);
                    ctx.closePath();
                    ctx.fill();
                    // Cross guard
                    ctx.fillStyle = '#605040';
                    ctx.fillRect(i * 0.5 * S - 1.5 * S, -0.6 * S, 3 * S, 1.2 * S);
                    // Grip
                    ctx.fillStyle = '#2a1808';
                    ctx.fillRect(i * 1.2 * S - 0.4 * S, 0, 0.8 * S, 2.5 * S);
                }
                break;
            }
            case 'axe': {
                ctx.rotate(-swingAngle * 0.4 - 0.3);
                const len = 15 * S;
                // Shaft
                ctx.fillStyle = '#6a4a20';
                ctx.fillRect(-0.65 * S, 0, 1.3 * S, -len);
                // Shaft texture
                ctx.strokeStyle = 'rgba(0,0,0,0.08)';
                ctx.lineWidth = 0.2 * S;
                for (let i = 0; i < 5; i++) {
                    ctx.beginPath();
                    ctx.moveTo(-0.65 * S, -i * len * 0.2);
                    ctx.lineTo(0.65 * S, -i * len * 0.2 - 0.5 * S);
                    ctx.stroke();
                }
                // Axe head (curved blade)
                ctx.fillStyle = hurtTint ? '#c08888' : '#98989a';
                ctx.beginPath();
                ctx.moveTo(0.65 * S, -len + 0.5 * S);
                ctx.quadraticCurveTo(6 * S, -len + 1 * S, 5.5 * S, -len + 6 * S);
                ctx.lineTo(0.65 * S, -len + 5 * S);
                ctx.closePath();
                ctx.fill();
                // Axe edge highlight
                ctx.strokeStyle = 'rgba(255,255,255,0.35)';
                ctx.lineWidth = 0.4 * S;
                ctx.beginPath();
                ctx.moveTo(0.65 * S, -len + 0.5 * S);
                ctx.quadraticCurveTo(6 * S, -len + 1 * S, 5.5 * S, -len + 6 * S);
                ctx.stroke();
                // Axe socket
                ctx.fillStyle = '#707078';
                ctx.fillRect(-0.3 * S, -len - 0.5 * S, 1.5 * S, 2 * S);
                break;
            }
            case 'hammer':
            case 'club': {
                ctx.rotate(-swingAngle * 0.35 - 0.2);
                const isHammer = weaponType === 'hammer';
                const len = isHammer ? 16 * S : 13 * S;
                // Shaft
                ctx.fillStyle = isHammer ? '#5a3818' : '#4a3a20';
                ctx.fillRect(-0.7 * S, 0, 1.4 * S, -len);
                // Head
                const headW = isHammer ? 4 : 3;
                ctx.fillStyle = hurtTint ? '#a07768' : (isHammer ? '#707078' : '#5a4a30');
                if (isHammer) {
                    ctx.fillRect(-headW * S, -len - 2 * S, headW * 2 * S, 5 * S);
                    ctx.strokeStyle = '#8a8a90';
                    ctx.lineWidth = 0.5 * S;
                    ctx.strokeRect(-headW * S, -len - 2 * S, headW * 2 * S, 5 * S);
                    // Hammer face
                    ctx.fillStyle = '#808088';
                    ctx.fillRect(headW * S - 1.5 * S, -len - 1.5 * S, 1.5 * S, 4 * S);
                } else {
                    // Gnarled club
                    ctx.beginPath();
                    ctx.ellipse(0, -len, headW * S, 3.5 * S, 0, 0, Math.PI * 2);
                    ctx.fill();
                    // Knots
                    ctx.fillStyle = '#4a3a20';
                    ctx.beginPath();
                    ctx.arc(1.5 * S, -len + 1 * S, 1 * S, 0, Math.PI * 2);
                    ctx.fill();
                }
                break;
            }
            case 'lance': {
                ctx.rotate(-swingAngle * 0.25 - 0.5);
                const len = 22 * S;
                // Shaft
                ctx.fillStyle = '#6a4a20';
                ctx.fillRect(-0.6 * S, -len, 1.2 * S, len);
                // Grip wrapping
                ctx.fillStyle = '#3a2010';
                ctx.fillRect(-0.8 * S, -2 * S, 1.6 * S, 6 * S);
                // Spearhead
                ctx.fillStyle = hurtTint ? '#c09999' : '#c8c8d8';
                ctx.beginPath();
                ctx.moveTo(0, -len - 5 * S);
                ctx.lineTo(1.5 * S, -len);
                ctx.lineTo(-1.5 * S, -len);
                ctx.closePath();
                ctx.fill();
                // Spearhead edge
                ctx.fillStyle = 'rgba(255,255,255,0.3)';
                ctx.beginPath();
                ctx.moveTo(0, -len - 5 * S);
                ctx.lineTo(1.5 * S, -len);
                ctx.lineTo(0.2 * S, -len);
                ctx.closePath();
                ctx.fill();
                // Cross guard
                ctx.fillStyle = '#707078';
                ctx.fillRect(-2.5 * S, -len - 0.5 * S, 5 * S, 1 * S);
                // Pennant
                ctx.fillStyle = '#c02020';
                ctx.beginPath();
                ctx.moveTo(1.5 * S, -len);
                ctx.lineTo(6 * S, -len + 2 * S + Math.sin(t * 4) * 1.5 * S);
                ctx.lineTo(1.5 * S, -len + 4 * S);
                ctx.closePath();
                ctx.fill();
                break;
            }
            case 'bow':
            case 'longbow': {
                const isLong = weaponType === 'longbow';
                const bLen = isLong ? 18 * S : 13 * S;
                ctx.rotate(-0.1);
                // Bow limbs (thicker, more defined)
                ctx.strokeStyle = '#7a5020';
                ctx.lineWidth = 1.8 * S;
                ctx.beginPath();
                ctx.arc(3.5 * S, -bLen * 0.35, bLen * 0.55, -1.3, 1.3);
                ctx.stroke();
                // Bow limb inner color
                ctx.strokeStyle = '#a07030';
                ctx.lineWidth = 0.8 * S;
                ctx.beginPath();
                ctx.arc(3.5 * S, -bLen * 0.35, bLen * 0.55, -1.3, 1.3);
                ctx.stroke();
                // String
                ctx.strokeStyle = '#c0b088';
                ctx.lineWidth = 0.35 * S;
                const strTopX = 3.5 * S + Math.cos(-1.3) * bLen * 0.55;
                const strTopY = -bLen * 0.35 + Math.sin(-1.3) * bLen * 0.55;
                const strBotX = 3.5 * S + Math.cos(1.3) * bLen * 0.55;
                const strBotY = -bLen * 0.35 + Math.sin(1.3) * bLen * 0.55;
                ctx.beginPath();
                ctx.moveTo(strTopX, strTopY);
                ctx.lineTo(strBotX, strBotY);
                ctx.stroke();
                // Arrow nocked
                ctx.fillStyle = '#a08040';
                ctx.fillRect(-1 * S, -bLen * 0.35 - 0.4 * S, 7 * S, 0.8 * S);
                // Arrow shaft rings
                ctx.strokeStyle = 'rgba(0,0,0,0.08)';
                ctx.lineWidth = 0.2 * S;
                for (let i = 0; i < 3; i++) {
                    ctx.beginPath();
                    ctx.moveTo(i * 2 * S, -bLen * 0.35 - 0.4 * S);
                    ctx.lineTo(i * 2 * S, -bLen * 0.35 + 0.4 * S);
                    ctx.stroke();
                }
                // Arrowhead (broadhead)
                ctx.fillStyle = '#b0b0b8';
                ctx.beginPath();
                ctx.moveTo(7.5 * S, -bLen * 0.35);
                ctx.lineTo(6 * S, -bLen * 0.35 - 1.5 * S);
                ctx.lineTo(6.5 * S, -bLen * 0.35);
                ctx.lineTo(6 * S, -bLen * 0.35 + 1.5 * S);
                ctx.closePath();
                ctx.fill();
                // Fletching (two-tone)
                ctx.fillStyle = '#c06040';
                ctx.beginPath();
                ctx.moveTo(-1 * S, -bLen * 0.35);
                ctx.lineTo(-3 * S, -bLen * 0.35 - 1.5 * S);
                ctx.lineTo(-0.5 * S, -bLen * 0.35);
                ctx.fill();
                ctx.fillStyle = '#d0d0c0';
                ctx.beginPath();
                ctx.moveTo(-1 * S, -bLen * 0.35);
                ctx.lineTo(-3 * S, -bLen * 0.35 + 1.5 * S);
                ctx.lineTo(-0.5 * S, -bLen * 0.35);
                ctx.fill();
                // Nock
                ctx.fillStyle = '#e0d0b0';
                ctx.fillRect(-1.5 * S, -bLen * 0.35 - 0.3 * S, 0.5 * S, 0.6 * S);
                break;
            }
            case 'staff': {
                ctx.rotate(-0.15);
                const len = 22 * S;
                // Staff shaft (gnarled wood)
                ctx.fillStyle = '#5a3a20';
                ctx.beginPath();
                ctx.moveTo(-0.9 * S, 2 * S);
                ctx.lineTo(0.9 * S, 2 * S);
                ctx.lineTo(0.7 * S, -len);
                ctx.lineTo(-0.7 * S, -len);
                ctx.closePath();
                ctx.fill();
                // Wood grain lines
                ctx.strokeStyle = 'rgba(0,0,0,0.08)';
                ctx.lineWidth = 0.2 * S;
                for (let i = 0; i < 4; i++) {
                    ctx.beginPath();
                    ctx.moveTo(0.3 * S, -i * len * 0.25);
                    ctx.quadraticCurveTo(-0.5 * S, -i * len * 0.25 - len * 0.12, 0.2 * S, -(i + 1) * len * 0.25);
                    ctx.stroke();
                }
                // Crystal / orb at top
                const glow = 0.5 + Math.sin(t * 4) * 0.3;
                // Orb cradle
                ctx.fillStyle = '#4a3020';
                ctx.beginPath();
                ctx.moveTo(-1.5 * S, -len);
                ctx.lineTo(-0.8 * S, -len - 3 * S);
                ctx.lineTo(0.8 * S, -len - 3 * S);
                ctx.lineTo(1.5 * S, -len);
                ctx.closePath();
                ctx.fill();
                // Main orb
                ctx.fillStyle = `rgba(140,100,255,${glow})`;
                ctx.beginPath();
                ctx.arc(0, -len - 3.5 * S, 3 * S, 0, Math.PI * 2);
                ctx.fill();
                // Orb inner glow
                ctx.fillStyle = `rgba(200,180,255,${glow * 0.5})`;
                ctx.beginPath();
                ctx.arc(-0.5 * S, -len - 4 * S, 1.5 * S, 0, Math.PI * 2);
                ctx.fill();
                // Orb highlight
                ctx.fillStyle = `rgba(255,255,255,${glow * 0.4})`;
                ctx.beginPath();
                ctx.arc(-0.8 * S, -len - 4.5 * S, 0.8 * S, 0, Math.PI * 2);
                ctx.fill();
                // Aura
                ctx.fillStyle = `rgba(140,100,255,${glow * 0.1})`;
                ctx.beginPath();
                ctx.arc(0, -len - 3.5 * S, 6 * S, 0, Math.PI * 2);
                ctx.fill();
                // Sparkle particles
                for (let i = 0; i < 3; i++) {
                    const ang = t * 3 + i * Math.PI * 2 / 3;
                    const pr = 4 * S + Math.sin(t * 5 + i) * 1.5 * S;
                    ctx.fillStyle = `rgba(180,160,255,${0.3 + Math.sin(t * 6 + i * 2) * 0.2})`;
                    ctx.beginPath();
                    ctx.arc(Math.cos(ang) * pr, -len - 3.5 * S + Math.sin(ang) * pr, 0.5 * S, 0, Math.PI * 2);
                    ctx.fill();
                }
                break;
            }
            case 'wand': {
                ctx.rotate(-0.2);
                const len = 12 * S;
                // Wand shaft
                ctx.fillStyle = '#7a6a50';
                ctx.beginPath();
                ctx.moveTo(-0.5 * S, 0);
                ctx.lineTo(0.5 * S, 0);
                ctx.lineTo(0.35 * S, -len);
                ctx.lineTo(-0.35 * S, -len);
                ctx.closePath();
                ctx.fill();
                // Wand handle
                ctx.fillStyle = '#5a4a38';
                ctx.fillRect(-0.6 * S, -1 * S, 1.2 * S, 3 * S);
                // Tip gem
                const glow = 0.5 + Math.sin(t * 5) * 0.4;
                ctx.fillStyle = `rgba(100,255,150,${glow})`;
                ctx.beginPath();
                ctx.arc(0, -len - 2 * S, 2.2 * S, 0, Math.PI * 2);
                ctx.fill();
                // Gem highlight
                ctx.fillStyle = `rgba(200,255,220,${glow * 0.5})`;
                ctx.beginPath();
                ctx.arc(-0.5 * S, -len - 2.5 * S, 0.8 * S, 0, Math.PI * 2);
                ctx.fill();
                // Aura
                ctx.fillStyle = `rgba(100,255,150,${glow * 0.08})`;
                ctx.beginPath();
                ctx.arc(0, -len - 2 * S, 5 * S, 0, Math.PI * 2);
                ctx.fill();
                break;
            }
            case 'dagger': {
                ctx.rotate(-swingAngle * 0.4 - 0.2);
                const dLen = 8 * S;
                ctx.fillStyle = hurtTint ? '#c09999' : '#b8b8cc';
                ctx.beginPath();
                ctx.moveTo(-0.6 * S, 0);
                ctx.lineTo(0.6 * S, 0);
                ctx.lineTo(0.3 * S, -dLen);
                ctx.lineTo(0, -dLen - 1.5 * S);
                ctx.lineTo(-0.3 * S, -dLen);
                ctx.closePath();
                ctx.fill();
                ctx.fillStyle = 'rgba(255,255,255,0.25)';
                ctx.beginPath();
                ctx.moveTo(0.3 * S, -1 * S);
                ctx.lineTo(0.3 * S, -dLen);
                ctx.lineTo(0, -dLen - 1.5 * S);
                ctx.lineTo(0, -1 * S);
                ctx.closePath();
                ctx.fill();
                ctx.fillStyle = '#605040';
                ctx.fillRect(-1.5 * S, -0.5 * S, 3 * S, 1 * S);
                ctx.fillStyle = '#3a2010';
                ctx.fillRect(-0.5 * S, 0, 1 * S, 2.5 * S);
                break;
            }
            case 'scimitar': {
                // Curved desert blade
                const sLen = 15 * S;
                ctx.rotate(-swingAngle * 0.4 - 0.3);
                ctx.fillStyle = hurtTint ? '#c08888' : '#d0d0e0';
                ctx.beginPath();
                ctx.moveTo(-0.5 * S, 0);
                ctx.lineTo(0.8 * S, 0);
                ctx.quadraticCurveTo(1.8 * S, -sLen * 0.5, 0.4 * S, -sLen);
                ctx.lineTo(-0.2 * S, -sLen * 0.95);
                ctx.quadraticCurveTo(1 * S, -sLen * 0.45, -0.5 * S, 0);
                ctx.closePath();
                ctx.fill();
                // Edge highlight
                ctx.fillStyle = 'rgba(255,255,255,0.3)';
                ctx.beginPath();
                ctx.moveTo(0.5 * S, -1 * S);
                ctx.quadraticCurveTo(1.5 * S, -sLen * 0.5, 0.4 * S, -sLen);
                ctx.lineTo(0 * S, -sLen * 0.95);
                ctx.quadraticCurveTo(1 * S, -sLen * 0.45, 0.5 * S, -1 * S);
                ctx.closePath();
                ctx.fill();
                // Guard (ornate crescent)
                ctx.fillStyle = hurtTint ? '#a06840' : '#c0a030';
                ctx.beginPath();
                ctx.ellipse(0, 0, 2 * S, 0.8 * S, 0, 0, Math.PI);
                ctx.fill();
                // Grip
                ctx.fillStyle = hurtTint ? '#a07768' : '#5a3018';
                ctx.fillRect(-0.6 * S, 0, 1.2 * S, 3.5 * S);
                // Pommel gem
                ctx.fillStyle = '#d04040';
                ctx.beginPath();
                ctx.arc(0, 3.5 * S, 0.7 * S, 0, Math.PI * 2);
                ctx.fill();
                break;
            }
            case 'fist': {
                // No weapon drawn — unarmed / fist attack
                // Just draw a rounded fist knuckle bump
                ctx.fillStyle = hurtTint ? '#c06060' : '#aaa';
                ctx.beginPath();
                ctx.arc(0, -2 * S, 1.8 * S, 0, Math.PI * 2);
                ctx.fill();
                // Knuckle lines
                ctx.strokeStyle = 'rgba(0,0,0,0.2)';
                ctx.lineWidth = 0.3 * S;
                for (let i = -1; i <= 1; i++) {
                    ctx.beginPath();
                    ctx.arc(i * 0.9 * S, -2.5 * S, 0.6 * S, 0, Math.PI);
                    ctx.stroke();
                }
                break;
            }
        }

        ctx.restore();
    },

    // ─── Environment prop helpers ───

    _drawBuilding(ctx, x, y, w, h, c) {
        // Main wall
        ctx.fillStyle = c.wall;
        ctx.fillRect(x, y, w, h);
        // Lighter inner panel
        ctx.fillStyle = c.wallLight;
        ctx.fillRect(x + 8, y + 12, w - 16, h - 16);
        // Roof ledge
        ctx.fillStyle = c.roof;
        ctx.fillRect(x - 4, y - 6, w + 8, 10);
        // Floor dividers
        const flH = h / c.floors;
        for (let f = 1; f < c.floors; f++) {
            ctx.fillStyle = c.trim;
            ctx.fillRect(x, y + f * flH - 2, w, 4);
        }
        // Windows
        for (let f = 0; f < c.floors; f++) {
            const fy = y + f * flH + flH * 0.28;
            const wn = Math.max(2, Math.floor(w / 50));
            const sp = w / (wn + 1);
            const ww = 18, wh = flH * 0.4;
            for (let i = 0; i < wn; i++) {
                const wx = x + sp * (i + 1) - ww / 2;
                ctx.fillStyle = c.window;
                ctx.fillRect(wx, fy, ww, wh);
                ctx.beginPath();
                ctx.arc(wx + ww / 2, fy, ww / 2, Math.PI, 0);
                ctx.fill();
                ctx.strokeStyle = c.trim;
                ctx.lineWidth = 1.2;
                ctx.strokeRect(wx, fy, ww, wh);
                ctx.beginPath();
                ctx.arc(wx + ww / 2, fy, ww / 2, Math.PI, Math.PI * 2);
                ctx.stroke();
            }
        }
        // Border
        ctx.strokeStyle = c.trim;
        ctx.lineWidth = 1;
        ctx.strokeRect(x, y, w, h);
    },

    _drawBarrel(ctx, x, y) {
        ctx.fillStyle = '#6a4a28';
        ctx.fillRect(x - 10, y, 20, 18);
        ctx.fillStyle = '#7a5a30';
        ctx.beginPath();
        ctx.ellipse(x, y, 10, 5, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#4a3a1a';
        ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.moveTo(x - 10, y + 5); ctx.lineTo(x + 10, y + 5); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(x - 10, y + 12); ctx.lineTo(x + 10, y + 12); ctx.stroke();
    },

    _drawCrate(ctx, x, y) {
        ctx.fillStyle = '#8a6830';
        ctx.fillRect(x - 11, y, 22, 20);
        ctx.strokeStyle = '#5a3818';
        ctx.lineWidth = 1;
        ctx.strokeRect(x - 11, y, 22, 20);
        ctx.beginPath();
        ctx.moveTo(x - 11, y); ctx.lineTo(x + 11, y + 20);
        ctx.moveTo(x + 11, y); ctx.lineTo(x - 11, y + 20);
        ctx.stroke();
    },

    _drawSignpost(ctx, x, y) {
        ctx.fillStyle = '#6a4820';
        ctx.fillRect(x - 2.5, y, 5, 55);
        ctx.fillStyle = '#8a6830';
        ctx.fillRect(x - 18, y + 8, 36, 16);
        ctx.strokeStyle = '#5a3818';
        ctx.lineWidth = 1;
        ctx.strokeRect(x - 18, y + 8, 36, 16);
        ctx.fillStyle = '#5a3818';
        ctx.beginPath();
        ctx.moveTo(x + 18, y + 12); ctx.lineTo(x + 24, y + 16); ctx.lineTo(x + 18, y + 20);
        ctx.closePath();
        ctx.fill();
    },

    drawUnit(ctx, u, isDead) {
        const s = u.size;
        const t = u.animTimer || 0;
        const state = u.animState || 'idle';
        const facing = u.facingRight ? 1 : -1;

        // Animation offsets
        let bobY = 0, swayX = 0, weaponAngle = 0;
        let hurtTint = false;

        if (!isDead) {
            switch (state) {
                case 'idle':
                    bobY = Math.sin(t * 2.5) * 1.5;
                    break;
                case 'walk':
                    bobY = Math.sin(t * 10) * 2;
                    swayX = Math.sin(t * 10) * 1;
                    break;
                case 'attack':
                    const at = u.attackAnimTimer || 0;
                    swayX = facing * at * 40;
                    weaponAngle = -at * 8;
                    break;
                case 'hurt':
                    swayX = -facing * 3;
                    hurtTint = true;
                    bobY = -1;
                    break;
                case 'stun':
                    bobY = Math.sin(t * 15) * 1;
                    break;
            }
        }

        const dx = u.x + swayX;
        const dy = u.y + bobY;

        ctx.save();
        if (hurtTint) {
            ctx.globalAlpha = (ctx.globalAlpha || 1) * 0.85;
        }

        const spriteKey = this._getSpriteKey(u);
        const sprite = spriteKey ? Sprites.get(spriteKey) : null;

        if (sprite) {
            const spriteScale = s / 16;
            Sprites.draw(ctx, spriteKey, dx, dy, { scale: spriteScale, flipX: !u.facingRight });
        } else {
            // Colored team platform
            const platCol = u.side === 'ally' ? 'rgba(40,130,160,0.32)' : 'rgba(170,50,40,0.32)';
            const platRim = u.side === 'ally' ? 'rgba(60,170,210,0.45)' : 'rgba(210,70,50,0.45)';
            ctx.fillStyle = platCol;
            ctx.beginPath(); ctx.ellipse(dx, dy + s * 0.35, s * 0.6, s * 0.2, 0, 0, Math.PI * 2); ctx.fill();
            ctx.strokeStyle = platRim; ctx.lineWidth = 1.2; ctx.stroke();

            // Look up appearance by unit type
            let baseApp;
            if (u.side === 'enemy') {
                baseApp = Units.getEnemyAppearance(u.type);
            } else {
                baseApp = this._unitAppearance[u.type] || {
                    skin: '#c0a080', armor: u.color, armorLight: u.color, pants: '#333',
                    boots: '#2a1a0a', weapon: u.role === 'ranged' ? 'bow' : 'sword', shield: false
                };
            }
            // Compute unit tier for visual upgrades (0-3)
            const tier = u.side === 'ally'
                ? Math.min(3, Math.floor(((u.veterancy || 0) + (u.equipTier || 0)) / 2))
                : Math.min(3, Math.floor(((u.enemyLevel || 1) - 1) / 1));

            // Clone to apply tier upgrades without mutating the shared config
            const appearance = Object.assign({}, baseApp);
            if (tier >= 1) {
                appearance.shoulderPad = true;
            }
            if (tier >= 2) {
                appearance.skirtArmor = true;
                appearance.helmetColor = appearance.helmetColor || appearance.armor;
            }

            // ── Race-specific features for allied units ──
            if (u.side === 'ally' && GameState.player && GameState.player.race) {
                const pRace = GameState.player.race;
                if (pRace === 'Elf') {
                    appearance.skin = '#f0e8d8';
                    appearance.earPointy = true;
                    appearance.slender = true;
                    appearance.hair = '#c0b070';
                    appearance.longHair = true;
                    appearance.eyeColor = '#30a060';
                    // Elf archers get green-tinted armor
                    if (u.type === 'archer') {
                        appearance.armor = '#2a6a30';
                        appearance.armorLight = '#3a8a40';
                    }
                } else if (pRace === 'Dragonkin') {
                    appearance.skin = '#c08a60';
                    appearance.horns = true;
                    appearance.hornColor = '#5a4a30';
                    appearance.scales = true;
                    appearance.scaleColor = 'rgba(200,80,40,0.2)';
                    appearance.glowEyes = true;
                    appearance.eyeColor = '#cc4400';
                    appearance.hair = '#1a0808';
                    // Dragonkin get spiked shoulder pads at tier 1+
                    if (tier >= 1) appearance.spikePads = true;
                    // Brutes get tails
                    if (u.type === 'brute') appearance.tail = true;
                }
            }

            const scale = s / 9;
            this._drawHumanoid(ctx, dx, dy, scale, facing, t, state, appearance, hurtTint, u.attackAnimTimer);

            // Tier visual flair (drawn on top)
            if (tier >= 2) {
                // Glow outline
                ctx.strokeStyle = u.side === 'ally' ? 'rgba(80,160,255,0.2)' : 'rgba(255,80,40,0.2)';
                ctx.lineWidth = 1.5;
                ctx.beginPath();
                ctx.arc(dx, dy, s * 0.6, 0, Math.PI * 2);
                ctx.stroke();
            }
            if (tier >= 3) {
                // Elite plume / crown indicator
                const plX = dx;
                const plY = dy - s * 1.1;
                ctx.fillStyle = u.side === 'ally' ? '#6090ff' : '#ff5030';
                ctx.beginPath();
                ctx.moveTo(plX, plY - 4);
                ctx.lineTo(plX - 3, plY + 2);
                ctx.lineTo(plX + 3, plY + 2);
                ctx.closePath();
                ctx.fill();
            }
        }

        ctx.restore();

        // Health bar (smooth display HP)
        if (!isDead && u.alive) {
            const dispHp = u.displayHp !== undefined ? u.displayHp : u.hp;
            if (dispHp < u.maxHp) {
                const barW = s + 6;
                const barH = 3;
                const ratio = Utils.clamp(dispHp / u.maxHp, 0, 1);
                Utils.drawBar(ctx, u.x - barW / 2, u.y - s * 0.8 - 10, barW, barH, ratio, u.side === 'ally' ? '#4080c0' : '#c04040');
            }
        }

        // Stun indicator (spinning stars)
        if (u.stunTimer > 0 && !isDead) {
            ctx.fillStyle = '#ffff40';
            ctx.font = '10px Segoe UI';
            ctx.textAlign = 'center';
            for (let i = 0; i < 3; i++) {
                const a = t * 5 + i * (Math.PI * 2 / 3);
                ctx.fillText('★', u.x + Math.cos(a) * 8, u.y - s * 0.8 - 8 + Math.sin(a) * 3);
            }
        }

        // Freeze indicator
        if (u.freezeTimer > 0 && !isDead) {
            ctx.strokeStyle = 'rgba(100,180,255,0.6)';
            ctx.lineWidth = 1.5;
            ctx.beginPath(); ctx.arc(u.x, u.y, s / 2 + 5, 0, Math.PI * 2); ctx.stroke();
            for (let i = 0; i < 4; i++) {
                const a = i * Math.PI / 2 + t * 0.5;
                const cx = u.x + Math.cos(a) * (s / 2 + 5);
                const cy = u.y + Math.sin(a) * (s / 2 + 5);
                ctx.fillStyle = 'rgba(150,220,255,0.5)';
                ctx.fillRect(cx - 1.5, cy - 1.5, 3, 3);
            }
        }

        // Divine shield glow
        if (u.divineShieldDR > 0 && !isDead) {
            ctx.fillStyle = 'rgba(255,220,80,0.15)';
            ctx.beginPath(); ctx.arc(u.x, u.y, s / 2 + 7, 0, Math.PI * 2); ctx.fill();
        }
        // Iron wall glow
        if (u.ironWallDR > 0 && !isDead) {
            ctx.strokeStyle = 'rgba(200,200,100,0.4)';
            ctx.lineWidth = 2;
            ctx.beginPath(); ctx.arc(u.x, u.y, s / 2 + 6, 0, Math.PI * 2); ctx.stroke();
        }
    },

    drawHero(ctx, h, isDead) {
        const s = h.size;
        const t = h.animTimer || 0;
        const state = h.animState || 'idle';
        const facing = h.facingRight ? 1 : -1;

        // Animation offsets
        let bobY = 0, swayX = 0;
        let hurtTint = false;

        if (!isDead) {
            switch (state) {
                case 'idle':
                    bobY = Math.sin(t * 2) * 2;
                    break;
                case 'walk':
                    bobY = Math.sin(t * 9) * 2.5;
                    swayX = Math.sin(t * 9) * 1.5;
                    break;
                case 'attack':
                    const at = h.attackAnimTimer || 0;
                    swayX = facing * at * 50;
                    break;
                case 'hurt':
                    swayX = -facing * 4;
                    hurtTint = true;
                    bobY = -2;
                    break;
                case 'stun':
                    bobY = Math.sin(t * 15) * 2;
                    break;
            }
        }

        const dx = h.x + swayX;
        const dy = h.y - 2 + bobY;

        // Hero glow
        ctx.shadowColor = hurtTint ? '#ff4040' : h.color;
        ctx.shadowBlur = 12;

        const heroClass = GameState.player.class;
        const spriteKey = 'hero_' + heroClass.toLowerCase();
        const sprite = Sprites.get(spriteKey);

        if (sprite) {
            const spriteScale = s / 18;
            Sprites.draw(ctx, spriteKey, dx, dy, { scale: spriteScale, flipX: !h.facingRight });
        } else {
            // Golden hero platform
            ctx.fillStyle = 'rgba(200,168,80,0.28)';
            ctx.beginPath(); ctx.ellipse(dx, dy + s * 0.35, s * 0.65, s * 0.22, 0, 0, Math.PI * 2); ctx.fill();
            ctx.strokeStyle = 'rgba(230,190,80,0.5)'; ctx.lineWidth = 1.5; ctx.stroke();

            // Get class-specific appearance
            const classApp = this._heroAppearance[heroClass] || this._heroAppearance.Warrior;
            const playerRace = GameState.player.race || 'Human';
            // Override weapon visual from equipped weapon
            const equippedWeaponType = (GameState.player.weapon && GameState.player.weapon.type) || classApp.weapon;
            // Map weapon types to visual weapon names
            const weaponVisualMap = { sword: 'sword', axe: 'axe', bow: 'longbow', staff: 'staff', wand: 'wand', daggers: 'daggers' };
            const visualWeapon = weaponVisualMap[equippedWeaponType] || classApp.weapon;

            // Race-specific skin/hair/features
            const raceSkin = { Human: '#e0d0b8', Elf: '#f0e8d8', Dragonkin: '#c08a60' };
            const raceHair = { Human: '#3a2010', Elf: '#c0b070', Dragonkin: '#1a0808' };
            const raceEyes = { Human: '#2a4a1a', Elf: '#30a060', Dragonkin: '#cc4400' };

            const appearance = {
                skin: raceSkin[playerRace] || '#e0d0b8',
                hair: raceHair[playerRace] || '#3a2010',
                armor: classApp.armor,
                armorLight: classApp.armorLight,
                pants: '#2a2a3a',
                boots: '#3a2a18',
                weapon: visualWeapon,
                shield: classApp.shield,
                helmetColor: classApp.helmetColor,
                shoulderPad: classApp.shoulderPad,
                capeColor: classApp.capeColor,
                mask: classApp.mask,
                hat: classApp.hat,
                heavy: classApp.heavy,
                robe: classApp.robe,
                scarf: classApp.scarf,
                quiver: classApp.quiver,
                skirtArmor: classApp.skirtArmor,
                bracers: classApp.heavy || classApp.shoulderPad,
                gauntlets: classApp.heavy,
                // Elf features
                earPointy: playerRace === 'Elf',
                slender: playerRace === 'Elf',
                longHair: playerRace === 'Elf',
                // Dragonkin features
                horns: playerRace === 'Dragonkin',
                hornColor: '#5a4a30',
                scales: playerRace === 'Dragonkin',
                scaleColor: 'rgba(200,80,40,0.25)',
                tail: playerRace === 'Dragonkin',
                glowEyes: playerRace === 'Dragonkin',
                spikePads: playerRace === 'Dragonkin' && classApp.shoulderPad,
                plume: playerRace === 'Dragonkin' && classApp.helmetColor,
                plumeColor: '#aa3020',
                eyeColor: raceEyes[playerRace],
            };
            const scale = s / 7;
            const capeCol = GameState.player.bannerColor || classApp.capeColor;
            this._drawHumanoid(ctx, dx, dy, scale, facing, t, state, appearance, hurtTint, h.attackAnimTimer, { capeColor: capeCol, eyeColor: raceEyes[playerRace] });

            // Weapon rarity glow (Rare+)
            const pw = GameState.player.weapon;
            if (pw && Weapons.rarityGlow) {
                const glowColor = Weapons.rarityGlow[pw.rarity];
                if (glowColor) {
                    const pulse = 0.6 + Math.sin(t * 3) * 0.3;
                    ctx.fillStyle = glowColor.replace(/[\d.]+\)$/, pulse + ')');
                    ctx.beginPath();
                    ctx.ellipse(dx + facing * s * 0.35, dy - s * 0.1, s * 0.4, s * 0.6, facing * 0.2, 0, Math.PI * 2);
                    ctx.fill();
                }
            }
        }

        ctx.shadowBlur = 0;

        if (isDead) return;

        // HP bar (smooth display HP)
        const barW = 30;
        const dispHp = h.displayHp !== undefined ? h.displayHp : h.hp;
        Utils.drawBar(ctx, h.x - barW / 2, h.y - s - 14, barW, 4, Utils.clamp(dispHp / h.maxHp, 0, 1), '#30c050');

        // Mana bar
        Utils.drawBar(ctx, h.x - barW / 2, h.y - s - 9, barW, 3, h.mana / h.maxMana, '#3060c0');

        // Guard stance visual
        if (h.guardStance) {
            ctx.strokeStyle = 'rgba(96,160,255,0.5)';
            ctx.lineWidth = 2;
            const pulseR = s + 8 + Math.sin(t * 4) * 2;
            ctx.beginPath();
            ctx.arc(h.x, h.y, pulseR, 0, Math.PI * 2);
            ctx.stroke();
        }

        // Parry stance visual
        if (h.parryStance) {
            ctx.strokeStyle = 'rgba(255,128,64,0.5)';
            ctx.lineWidth = 2;
            const pulseR = s + 6 + Math.sin(t * 6) * 2;
            ctx.beginPath();
            ctx.arc(h.x, h.y, pulseR, 0, Math.PI * 2);
            ctx.stroke();
        }

        // Name
        ctx.font = 'bold 10px Segoe UI';
        ctx.fillStyle = '#e0c060';
        ctx.textAlign = 'center';
        ctx.fillText(h.name, h.x, h.y + s + 14);
    },

    drawBoss(ctx, b, isDead) {
        const s = b.size;
        const t = b.animTimer || 0;
        const state = b.animState || 'idle';
        const facing = b.facingRight ? 1 : -1;

        // Animation offsets
        let bobY = 0, swayX = 0;
        let hurtTint = false;

        if (!isDead) {
            switch (state) {
                case 'idle':
                    bobY = Math.sin(t * 1.5) * 3;
                    break;
                case 'walk':
                    bobY = Math.sin(t * 6) * 3;
                    swayX = Math.sin(t * 6) * 2;
                    break;
                case 'attack':
                    const at = b.attackAnimTimer || 0;
                    swayX = facing * at * 60;
                    break;
                case 'hurt':
                    swayX = -facing * 6;
                    hurtTint = true;
                    bobY = -3;
                    break;
            }
        }

        const dx = b.x + swayX;
        const dy = b.y + bobY;

        ctx.shadowColor = hurtTint ? '#ff6060' : '#ff2020';
        ctx.shadowBlur = 16 + Math.sin(t * 3) * 4;

        const sprite = Sprites.get('boss_grimtusk');
        if (sprite) {
            const spriteScale = s / 28;
            Sprites.draw(ctx, 'boss_grimtusk', dx, dy, { scale: spriteScale, flipX: !b.facingRight });
        } else {
            // Hulking orc warlord with proper humanoid body
            // Boss platform with boss-specific color
            const bossColor = b.color || '#c02020';
            ctx.fillStyle = `rgba(${parseInt(bossColor.slice(1,3),16)},${parseInt(bossColor.slice(3,5),16)},${parseInt(bossColor.slice(5,7),16)},0.28)`;
            ctx.beginPath(); ctx.ellipse(dx, dy + s * 0.3, s * 0.55, s * 0.22, 0, 0, Math.PI * 2); ctx.fill();
            ctx.strokeStyle = `rgba(${parseInt(bossColor.slice(1,3),16)+40},${parseInt(bossColor.slice(3,5),16)+20},${parseInt(bossColor.slice(5,7),16)+20},0.45)`;
            ctx.lineWidth = 2; ctx.stroke();

            // Look up boss appearance from Units data
            const bossKey = b.type || 'warlordGrimtusk';
            const bossAppearance = Units.getBossAppearance(bossKey);
            const scale = s / 8;
            const bossOpts = {
                eyeColor: bossAppearance.eyeColor || '#cc3300',
                capeColor: bossAppearance.capeColor || '#4a1a0a',
            };
            this._drawHumanoid(ctx, dx, dy, scale, facing, t, state, bossAppearance, hurtTint, b.attackAnimTimer, bossOpts);

            // Extra boss flair: glowing eyes override
            if (bossAppearance.glowEyes) {
                const headCenterY = dy - 8 * (s / 8) * 0.45 - 4.5 * (s / 8) * 0.9;
                const eyeGlow = 0.5 + Math.sin(t * 4) * 0.3;
                const eyeCol = bossAppearance.eyeColor || '#ff6000';
                ctx.fillStyle = eyeCol.replace(')', `,${0.3 + eyeGlow * 0.3})`).replace('rgb', 'rgba');
                if (!eyeCol.startsWith('rgba')) {
                    const r = parseInt(eyeCol.slice(1,3),16), g = parseInt(eyeCol.slice(3,5),16), bl = parseInt(eyeCol.slice(5,7),16);
                    ctx.fillStyle = `rgba(${r},${g},${bl},${0.3 + eyeGlow * 0.3})`;
                }
                ctx.beginPath();
                ctx.arc(dx + facing * 2, headCenterY, 2.5 * (s / 8), 0, Math.PI * 2);
                ctx.fill();
                ctx.beginPath();
                ctx.arc(dx + facing * 5, headCenterY, 2.5 * (s / 8), 0, Math.PI * 2);
                ctx.fill();
            }
        }

        ctx.shadowBlur = 0;

        if (isDead) return;

        // Boss HP bar (wide, with smooth HP)
        const barW = 60;
        const dispHp = b.displayHp !== undefined ? b.displayHp : b.hp;
        Utils.drawBar(ctx, b.x - barW / 2, b.y - s * 0.8 - 14, barW, 6, Utils.clamp(dispHp / b.maxHp, 0, 1), '#ff3030');

        // Name
        ctx.font = 'bold 11px Segoe UI';
        ctx.fillStyle = '#ff6040';
        ctx.textAlign = 'center';
        ctx.fillText(b.name, b.x, b.y + s * 0.6 + 14);
    },

    renderEffects(ctx, bf) {
        bf.effects.forEach(e => {
            const progress = 1 - e.timer / e.maxTimer;
            ctx.globalAlpha = 1 - progress;

            switch (e.type) {
                case 'slash':
                    ctx.strokeStyle = '#ffffff';
                    ctx.lineWidth = 3;
                    ctx.beginPath();
                    ctx.moveTo(e.x - 15, e.y + 10);
                    ctx.lineTo(e.x + 15, e.y - 10);
                    ctx.stroke();
                    break;
                case 'impact':
                    ctx.fillStyle = '#ffaa00';
                    ctx.beginPath();
                    ctx.arc(e.x, e.y, 20 * progress, 0, Math.PI * 2);
                    ctx.fill();
                    break;
                case 'shield':
                    ctx.strokeStyle = '#60a0ff';
                    ctx.lineWidth = 3;
                    ctx.beginPath();
                    ctx.arc(e.x, e.y, 25 + 10 * progress, 0, Math.PI * 2);
                    ctx.stroke();
                    break;
                case 'death':
                    ctx.fillStyle = '#ff4040';
                    const r = 10 + 20 * progress;
                    ctx.globalAlpha = 0.5 * (1 - progress);
                    ctx.beginPath();
                    ctx.arc(e.x, e.y, r, 0, Math.PI * 2);
                    ctx.fill();
                    break;
                case 'shadow':
                    ctx.fillStyle = '#404060';
                    ctx.beginPath();
                    ctx.arc(e.x, e.y, 15, 0, Math.PI * 2);
                    ctx.fill();
                    break;
                case 'smoke':
                    ctx.fillStyle = 'rgba(100,100,120,0.4)';
                    ctx.beginPath();
                    ctx.arc(e.x, e.y, 80 + 20 * progress, 0, Math.PI * 2);
                    ctx.fill();
                    break;
                case 'crescent':
                    ctx.strokeStyle = '#c0c0ff';
                    ctx.lineWidth = 3;
                    ctx.beginPath();
                    ctx.arc(e.x, e.y, 30, -0.8, 0.8);
                    ctx.stroke();
                    break;
                case 'arrow': {
                    const t = progress;
                    const hasTgt = e.tx !== undefined;
                    const ax = hasTgt ? Utils.lerp(e.x, e.tx, t) : e.x + 60 * t;
                    const ay = hasTgt ? Utils.lerp(e.y, e.ty, t) : e.y;
                    const angle = hasTgt ? Math.atan2(e.ty - e.y, e.tx - e.x) : 0;
                    ctx.save();
                    ctx.translate(ax, ay);
                    ctx.rotate(angle);
                    ctx.globalAlpha = 1 - progress * 0.3;
                    // Shaft
                    ctx.fillStyle = '#a08040';
                    ctx.fillRect(-10, -1, 20, 2);
                    // Head
                    ctx.beginPath();
                    ctx.moveTo(12, 0);
                    ctx.lineTo(7, -3);
                    ctx.lineTo(7, 3);
                    ctx.closePath();
                    ctx.fillStyle = '#c0c0c0';
                    ctx.fill();
                    // Fletching
                    ctx.beginPath();
                    ctx.moveTo(-10, 0);
                    ctx.lineTo(-13, -2);
                    ctx.lineTo(-13, 2);
                    ctx.closePath();
                    ctx.fillStyle = '#c06040';
                    ctx.fill();
                    // Trail
                    ctx.globalAlpha = 0.15;
                    ctx.strokeStyle = '#c0a060';
                    ctx.lineWidth = 1;
                    ctx.beginPath();
                    ctx.moveTo(-10, 0);
                    ctx.lineTo(-30, 0);
                    ctx.stroke();
                    ctx.restore();
                    break;
                }
                case 'warcry':
                    ctx.strokeStyle = '#ff6040';
                    ctx.lineWidth = 4;
                    ctx.beginPath();
                    ctx.arc(e.x, e.y, 40 + 30 * progress, 0, Math.PI * 2);
                    ctx.stroke();
                    break;
                case 'summon':
                    ctx.fillStyle = '#80ff40';
                    ctx.beginPath();
                    ctx.arc(e.x, e.y, 30 * (1 - progress), 0, Math.PI * 2);
                    ctx.fill();
                    break;
                case 'parryCounter':
                    ctx.strokeStyle = '#ffaa40';
                    ctx.lineWidth = 2;
                    ctx.beginPath();
                    ctx.arc(e.x, e.y, 20, 0, Math.PI * 2);
                    ctx.stroke();
                    break;
                case 'cleave':
                    ctx.strokeStyle = '#ffddaa';
                    ctx.lineWidth = 4;
                    ctx.beginPath();
                    ctx.arc(e.x, e.y, 40, -0.6, 0.6);
                    ctx.stroke();
                    break;
                case 'fireball': {
                    const fr = 15 + 25 * progress;
                    const grad = ctx.createRadialGradient(e.x, e.y, 0, e.x, e.y, fr);
                    grad.addColorStop(0, 'rgba(255,200,60,0.9)');
                    grad.addColorStop(0.5, 'rgba(255,80,20,0.6)');
                    grad.addColorStop(1, 'rgba(100,20,0,0)');
                    ctx.fillStyle = grad;
                    ctx.beginPath(); ctx.arc(e.x, e.y, fr, 0, Math.PI * 2); ctx.fill();
                    break;
                }
                case 'frost': {
                    const fr2 = 25 + 15 * progress;
                    ctx.strokeStyle = `rgba(100,200,255,${0.7 * (1 - progress)})`;
                    ctx.lineWidth = 2;
                    for (let i = 0; i < 6; i++) {
                        const a = i * Math.PI / 3;
                        ctx.beginPath();
                        ctx.moveTo(e.x, e.y);
                        ctx.lineTo(e.x + Math.cos(a) * fr2, e.y + Math.sin(a) * fr2);
                        ctx.stroke();
                    }
                    break;
                }
                case 'heal': {
                    ctx.fillStyle = `rgba(80,255,100,${0.6 * (1 - progress)})`;
                    const hy = e.y - 20 * progress;
                    ctx.font = 'bold 14px Segoe UI';
                    ctx.textAlign = 'center';
                    ctx.fillText('+', e.x, hy);
                    ctx.strokeStyle = `rgba(80,255,100,${0.3 * (1 - progress)})`;
                    ctx.lineWidth = 2;
                    ctx.beginPath(); ctx.arc(e.x, e.y, 15 + 10 * progress, 0, Math.PI * 2); ctx.stroke();
                    break;
                }
                case 'arcane': {
                    const ar = 12 + 10 * progress;
                    ctx.strokeStyle = `rgba(180,120,255,${0.7 * (1 - progress)})`;
                    ctx.lineWidth = 2;
                    ctx.beginPath(); ctx.arc(e.x, e.y, ar, 0, Math.PI * 2); ctx.stroke();
                    ctx.beginPath(); ctx.arc(e.x, e.y, ar * 0.5, 0, Math.PI * 2); ctx.stroke();
                    break;
                }
                case 'parry':
                    ctx.strokeStyle = '#ffcc44';
                    ctx.lineWidth = 2;
                    ctx.beginPath();
                    ctx.arc(e.x, e.y, 18, -Math.PI / 4, Math.PI / 4);
                    ctx.stroke();
                    break;
            }
            ctx.globalAlpha = 1;
        });
    },

    renderDamageNumbers(ctx, bf) {
        bf.damageNumbers.forEach(d => {
            ctx.globalAlpha = Utils.clamp(d.timer / 0.3, 0, 1);
            ctx.font = 'bold 16px Segoe UI';
            ctx.fillStyle = d.color;
            ctx.textAlign = 'center';
            ctx.fillText(d.value, d.x, d.y);
        });
        ctx.globalAlpha = 1;
    },

    renderParticles(ctx, bf) {
        if (!bf.particles || bf.particles.length === 0) return;
        bf.particles.forEach(p => {
            const alpha = Utils.clamp(p.life / p.maxLife, 0, 1);
            ctx.globalAlpha = alpha;
            ctx.fillStyle = p.color;
            const sz = 2 + alpha * 2;
            ctx.fillRect(p.x - sz / 2, p.y - sz / 2, sz, sz);
        });
        ctx.globalAlpha = 1;
    },

    renderHUD(ctx, bf) {
        const hero = bf.hero;

        // Top HUD bar background
        ctx.fillStyle = 'rgba(10, 10, 18, 0.92)';
        ctx.fillRect(0, 0, Renderer.w, 80);
        // Subtle bottom glow line
        const hudGlow = ctx.createLinearGradient(0, 78, 0, 82);
        hudGlow.addColorStop(0, 'rgba(100,80,40,0.3)');
        hudGlow.addColorStop(1, 'rgba(100,80,40,0)');
        ctx.fillStyle = hudGlow;
        ctx.fillRect(0, 78, Renderer.w, 4);
        ctx.strokeStyle = '#2a2a3a';
        ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(0, 80); ctx.lineTo(Renderer.w, 80); ctx.stroke();

        // Hero name + level indicator
        ctx.textAlign = 'left';
        ctx.font = 'bold 13px Segoe UI';
        ctx.fillStyle = '#e0c060';
        ctx.fillText(`${hero.name}`, 15, 20);

        // Hero HP (smooth)
        const dispHeroHp = hero.displayHp !== undefined ? hero.displayHp : hero.hp;
        ctx.font = '11px Segoe UI';
        ctx.fillStyle = '#a0a0b0';
        ctx.fillText('HP', 15, 38);
        Utils.drawBar(ctx, 35, 30, 160, 12, Utils.clamp(dispHeroHp / hero.maxHp, 0, 1), '#c03030');
        // Damage preview (show gap between display and actual)
        if (dispHeroHp > hero.hp + 1) {
            const fullBarW = 160;
            const actualRatio = Utils.clamp(hero.hp / hero.maxHp, 0, 1);
            const dispRatio = Utils.clamp(dispHeroHp / hero.maxHp, 0, 1);
            ctx.fillStyle = 'rgba(255,100,50,0.4)';
            ctx.fillRect(35 + actualRatio * fullBarW, 30, (dispRatio - actualRatio) * fullBarW, 12);
        }
        ctx.fillStyle = '#e0d8c0';
        ctx.font = '10px Segoe UI';
        ctx.fillText(`${Math.ceil(hero.hp)}/${hero.maxHp}`, 200, 40);

        ctx.font = '11px Segoe UI';
        ctx.fillStyle = '#a0a0b0';
        ctx.fillText('MP', 15, 56);
        Utils.drawBar(ctx, 35, 48, 160, 10, hero.mana / hero.maxMana, '#3060c0');
        ctx.fillStyle = '#e0d8c0';
        ctx.font = '10px Segoe UI';
        ctx.fillText(`${Math.ceil(hero.mana)}/${hero.maxMana}`, 200, 56);

        // Skills
        let sx = 270;
        hero.skills.forEach(skill => {
            const ready = skill.currentCd <= 0 && hero.mana >= skill.manaCost;
            const onCd = skill.currentCd > 0;
            const bgColor = ready ? '#2a2a4a' : '#1a1a22';
            const borderCol = ready ? '#c8a84e' : '#2a2a3a';

            Utils.drawPanel(ctx, sx, 8, 100, 62, borderCol, bgColor);

            // Cooldown sweep overlay
            if (onCd && skill.cd > 0) {
                const cdRatio = Utils.clamp(skill.currentCd / skill.cd, 0, 1);
                ctx.fillStyle = 'rgba(0,0,0,0.4)';
                ctx.fillRect(sx + 1, 9, 98, 60 * cdRatio);
            }

            ctx.font = '18px Segoe UI';
            ctx.textAlign = 'center';
            ctx.fillStyle = ready ? '#e0c060' : '#4a4a5a';
            // Try to draw a sprite icon for the skill
            const skillSpriteMap = {
                'Cleave': 'skill_cleave', 'Charge': 'skill_charge', 'Guard Stance': 'skill_guardStance',
                'Dash Slash': 'skill_dashSlash', 'Parry Stance': 'skill_parryStance', 'Crescent Strike': 'skill_crescentStrike',
                'Shadow Step': 'skill_shadowStep', 'Smoke Bomb': 'skill_smokeBomb', 'Chain Attack': 'skill_chainAttack',
                'Power Shot': 'skill_powerShot', 'Volley': 'skill_volley', 'Evasive Roll': 'skill_evasiveRoll',
                'Fireball': 'skill_fireball', 'Frost Nova': 'skill_frostNova', 'Arcane Barrage': 'skill_arcaneBarrage',
                'Shield Bash': 'skill_shieldBash', 'Taunt': 'skill_taunt', 'Iron Wall': 'skill_ironWall',
                'Healing Light': 'skill_healingLight', 'Purify': 'skill_purify', 'Divine Shield': 'skill_divineShield',
                'War Song': 'skill_warSong', 'Discordant Note': 'skill_discordantNote', 'Ballad of Resilience': 'skill_balladOfResilience'
            };
            const skillSprite = skillSpriteMap[skill.name];
            if (skillSprite && Sprites.get(skillSprite)) {
                Sprites.draw(ctx, skillSprite, sx + 20, 34, { scale: 0.85, alpha: ready ? 1 : 0.3 });
            } else {
                ctx.fillText(skill.icon, sx + 20, 36);
            }

            ctx.font = 'bold 11px Segoe UI';
            ctx.fillStyle = ready ? '#e0d8c0' : '#5a5a6a';
            ctx.fillText(skill.name, sx + 58, 28);

            ctx.font = '10px Segoe UI';
            ctx.fillStyle = '#8a8a9a';
            ctx.fillText(`[${skill.keyLabel}]`, sx + 58, 42);

            if (onCd) {
                ctx.fillStyle = '#c04040';
                ctx.font = '10px Segoe UI';
                ctx.fillText(`${skill.currentCd.toFixed(1)}s`, sx + 58, 56);
            } else {
                ctx.fillStyle = ready ? '#3080e0' : '#303050';
                ctx.font = '10px Segoe UI';
                ctx.fillText(`${skill.manaCost} MP`, sx + 58, 56);
            }

            // Ready pulse effect
            if (ready) {
                const pulse = Math.sin((this.envTimer || 0) * 4) * 0.15 + 0.15;
                ctx.strokeStyle = `rgba(200,168,78,${pulse})`;
                ctx.lineWidth = 1;
                ctx.strokeRect(sx + 1, 9, 98, 60);
            }

            sx += 108;
        });

        // Army order
        const orders = ['hold', 'push', 'allout'];
        const orderLabels = { hold: 'Hold [1]', push: 'Push [2]', allout: 'All-Out [3]' };
        const orderIcons = { hold: 'icon_shield', push: 'icon_sword', allout: 'icon_skull' };
        let ox = Renderer.w - 340;
        ctx.font = 'bold 11px Segoe UI';
        ctx.fillStyle = '#a0a0b0';
        ctx.textAlign = 'left';
        ctx.fillText('Orders:', ox, 18);

        orders.forEach((ord, i) => {
            const bx = ox + i * 100;
            const active = bf.order === ord;
            const canUse = bf.orderCooldown <= 0;
            Utils.drawPanel(ctx, bx, 24, 94, 26, active ? '#e0c060' : '#2a2a3a', active ? '#2a2a3a' : '#12121a');
            Sprites.draw(ctx, orderIcons[ord], bx + 14, 37, { scale: 0.5, alpha: active ? 1 : canUse ? 0.6 : 0.2 });
            ctx.font = '11px Segoe UI';
            ctx.textAlign = 'center';
            ctx.fillStyle = active ? '#e0c060' : canUse ? '#8a8a9a' : '#3a3a4a';
            ctx.fillText(orderLabels[ord], bx + 55, 41);
        });

        if (bf.orderCooldown > 0) {
            ctx.font = '10px Segoe UI';
            ctx.textAlign = 'left';
            ctx.fillStyle = '#c04040';
            ctx.fillText(`CD: ${bf.orderCooldown.toFixed(1)}s`, ox, 66);
        }

        // Morale
        ctx.textAlign = 'left';
        ctx.font = '11px Segoe UI';
        ctx.fillStyle = '#a0a0b0';
        ctx.fillText('Morale:', Renderer.w - 110, 18);
        const moraleColor = bf.morale > 60 ? '#40c060' : bf.morale > 30 ? '#c0a030' : '#c04040';
        Utils.drawBar(ctx, Renderer.w - 110, 24, 90, 10, bf.morale / bf.moraleMax, moraleColor);
        ctx.fillStyle = '#e0d8c0';
        ctx.fillText(`${Math.floor(bf.morale)}%`, Renderer.w - 110, 50);

        // Battle timer
        ctx.textAlign = 'center';
        ctx.font = '12px Segoe UI';
        ctx.fillStyle = '#6a6a7a';
        ctx.fillText(`⏱ ${Math.floor(bf.timer)}s`, Renderer.cx, 70);

        // Kills / Losses
        ctx.textAlign = 'right';
        ctx.font = '11px Segoe UI';
        ctx.fillStyle = '#60c060';
        ctx.fillText(`Kills: ${bf.killCount}`, Renderer.w - 15, 66);
        ctx.fillStyle = '#c06060';
        ctx.fillText(`Lost: ${bf.allyLosses}`, Renderer.w - 15, 78);

        // Army counts (bottom bar)
        const aliveAllies = bf.allies.filter(u => u.alive).length;
        const totalAllies = bf.allies.length;
        const aliveEnemies = bf.enemies.filter(u => u.alive).length;
        const totalEnemies = bf.enemies.length;

        ctx.fillStyle = 'rgba(10,10,18,0.85)';
        ctx.fillRect(0, Renderer.h - 22, Renderer.w, 22);

        ctx.font = '10px Segoe UI';
        ctx.textAlign = 'left';
        ctx.fillStyle = '#4080c0';
        ctx.fillText(`⚔ Allies: ${aliveAllies}/${totalAllies}`, 10, Renderer.h - 8);
        ctx.fillStyle = '#c04040';
        ctx.fillText(`☠ Enemies: ${aliveEnemies}/${totalEnemies}`, 140, Renderer.h - 8);

        // Controls hint
        ctx.textAlign = 'center';
        ctx.font = '10px Segoe UI';
        ctx.fillStyle = '#3a3a5a';
        ctx.fillText('Arrows: Move | Space: Attack | Q/W/E: Skills | 1/2/3: Orders | P: Pause', Renderer.cx, Renderer.h - 8);
    },

    renderPause(ctx) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
        ctx.fillRect(0, 0, Renderer.w, Renderer.h);
        Utils.drawTextCentered(ctx, 'PAUSED', Renderer.cx, Renderer.cy - 50, 'bold 40px Segoe UI', '#c8a84e');
        Utils.drawTextCentered(ctx, 'Press P or ESC to resume', Renderer.cx, Renderer.cy, '16px Segoe UI', '#8a8a9a');

        // Retreat button
        const bx = Renderer.cx - 70, by = Renderer.cy + 30, bw = 140, bh = 36;
        const hover = Input.isMouseInRect(bx, by, bw, bh);
        Utils.drawPanel(ctx, bx, by, bw, bh, hover ? '#c04040' : '#804040', '#1a1010');
        Utils.drawTextCentered(ctx, 'Retreat', bx + bw / 2, by + bh / 2, '14px Segoe UI', '#e06060');
        if (Input.clickedInRect(bx, by, bw, bh)) {
            this.paused = false;
            LootSystem.applyDefeatPenalty();
            SaveSystem.save();
            ScreenManager.fadeToScreen('campaignMap');
        }
    },

    renderResult(ctx) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, Renderer.w, Renderer.h);

        const result = this.battleResult;
        const victory = result.victory;

        if (victory) {
            Utils.drawTextCentered(ctx, 'VICTORY!', Renderer.cx, 160, 'bold 44px Segoe UI', '#f0d060');
        } else {
            Utils.drawTextCentered(ctx, 'DEFEAT', Renderer.cx, 160, 'bold 44px Segoe UI', '#c04040');
        }

        let y = 220;
        ctx.textAlign = 'center';
        ctx.font = '16px Segoe UI';

        ctx.fillStyle = '#a0a0b0';
        ctx.fillText(`Enemies slain: ${result.killCount}`, Renderer.cx, y); y += 24;
        ctx.fillText(`Allies lost: ${result.allyLosses}`, Renderer.cx, y); y += 30;

        if (victory && this.loot) {
            ctx.font = 'bold 18px Segoe UI';
            ctx.fillStyle = '#c8a84e';
            ctx.fillText('Rewards', Renderer.cx, y); y += 26;

            ctx.font = '15px Segoe UI';
            ctx.fillStyle = '#e0c040';
            Sprites.draw(ctx, 'icon_gold', Renderer.cx - 60, y - 5, { scale: 1.0 });
            ctx.fillText(`${this.loot.gold} Gold`, Renderer.cx, y); y += 22;
            ctx.fillStyle = '#a0a0b0';
            Sprites.draw(ctx, 'icon_iron', Renderer.cx - 60, y - 5, { scale: 1.0 });
            ctx.fillText(`${this.loot.iron} Iron`, Renderer.cx, y); y += 22;
            ctx.fillStyle = '#80c060';
            Sprites.draw(ctx, 'icon_food', Renderer.cx - 60, y - 5, { scale: 1.0 });
            ctx.fillText(`${this.loot.food} Food`, Renderer.cx, y); y += 22;
            ctx.fillStyle = '#c0a030';
            Sprites.draw(ctx, 'icon_star', Renderer.cx - 60, y - 5, { scale: 1.0 });
            ctx.fillText(`${this.loot.xp} XP`, Renderer.cx, y); y += 22;

            if (this.loot.weapon) {
                const w = this.loot.weapon;
                ctx.fillStyle = Weapons.rarityColors[w.rarity];
                Sprites.draw(ctx, 'icon_sword', Renderer.cx - 60, y - 5, { scale: 1.0 });
                ctx.fillText(`${w.name} (${w.rarity})`, Renderer.cx, y);
                y += 22;

                // Equip button
                const ebx = Renderer.cx - 80, eby = y + 5;
                Utils.drawPanel(ctx, ebx, eby, 160, 32, '#c8a84e', '#1a1a2a');
                Utils.drawTextCentered(ctx, 'Equip Weapon', Renderer.cx, eby + 16, 'bold 13px Segoe UI', '#f0d060');
                if (Input.clickedInRect(ebx, eby, 160, 32)) {
                    if (GameState.player.weapon) {
                        GameState.player.inventory.push(GameState.player.weapon);
                    }
                    GameState.player.weapon = this.loot.weapon;
                    this.loot.weapon = null;
                    SaveSystem.save();
                }
                // Stash button
                const sbx = Renderer.cx - 80, sby = eby + 38;
                Utils.drawPanel(ctx, sbx, sby, 160, 32, '#4060a0', '#1a1a2a');
                Utils.drawTextCentered(ctx, 'Stash in Inventory', Renderer.cx, sby + 16, 'bold 13px Segoe UI', '#80a0e0');
                if (Input.clickedInRect(sbx, sby, 160, 32)) {
                    GameState.player.inventory.push(this.loot.weapon);
                    this.loot.weapon = null;
                    SaveSystem.save();
                }
                y += 82;
            }

            if (this.loot.relicFragment) {
                ctx.fillStyle = '#a040e0';
                Sprites.draw(ctx, 'icon_relic', Renderer.cx - 110, y - 5, { scale: 0.8 });
                ctx.fillText('Relic Fragment obtained!', Renderer.cx, y);
                y += 22;
            }
        } else if (!victory) {
            ctx.font = '14px Segoe UI';
            ctx.fillStyle = '#c04040';
            ctx.fillText('Your army suffered losses. A wound has been inflicted.', Renderer.cx, y);
            y += 22;
            if (GameState.isGameOver()) {
                ctx.fillStyle = '#ff3030';
                ctx.fillText('Your campaign has ended...', Renderer.cx, y);
                y += 40;

                Utils.drawPanel(ctx, Renderer.cx - 80, y, 160, 36, '#c04040', '#1a1a2a');
                Utils.drawTextCentered(ctx, 'Game Over', Renderer.cx, y + 18, 'bold 14px Segoe UI', '#c04040');
                if (Input.clickedInRect(Renderer.cx - 80, y, 160, 36)) {
                    ScreenManager.fadeToScreen('gameOver');
                }
                return;
            }
        }

        y += 10;
        // Continue button
        const cbx = Renderer.cx - 80, cby = y;
        Utils.drawPanel(ctx, cbx, cby, 160, 36, '#c8a84e', '#1a1a2a');
        Utils.drawTextCentered(ctx, 'Continue', Renderer.cx, cby + 18, 'bold 14px Segoe UI', '#f0d060');

        if (Input.clickedInRect(cbx, cby, 160, 36)) {
            if (victory && (this.nodeData.type === 'boss')) {
                ScreenManager.fadeToScreen('victory');
            } else if (CampaignSystem.isRegionComplete()) {
                ScreenManager.fadeToScreen('victory');
            } else {
                ScreenManager.fadeToScreen('campaignMap');
            }
        }
    }
};
