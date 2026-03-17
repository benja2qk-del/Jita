const CampaignMapScreen = {
    hoveredNode: null,
    scrollOffset: 0,
    animTimer: 0,
    decorations: null,

    enter() {
        Audio.playMusic('map');
        this.hoveredNode = null;
        this.animTimer = 0;
        if (!this.decorations) this.generateDecorations();
    },

    generateDecorations() {
        const rng = (a, b) => a + Math.random() * (b - a);
        this.decorations = { trees: [], rocks: [], waves: [] };
        for (let i = 0; i < 40; i++) {
            this.decorations.trees.push({ x: rng(0.15, 0.85), y: rng(0.68, 0.94), size: rng(3, 7), shade: Math.random() });
        }
        for (let i = 0; i < 25; i++) {
            this.decorations.rocks.push({ x: rng(0.15, 0.85), y: rng(0.04, 0.30), size: rng(2, 7) });
        }
        for (let i = 0; i < 15; i++) {
            this.decorations.rocks.push({ x: rng(0.25, 0.75), y: rng(0.34, 0.62), size: rng(2, 5) });
        }
        for (let i = 0; i < 12; i++) {
            this.decorations.waves.push({ y: rng(0.1, 0.9), offset: Math.random() * Math.PI * 2, speed: rng(0.5, 1.5) });
        }
    },

    // Peninsula coastline polygon (relative 0-1)
    _landPoly: [
        [0.05,0],[0.95,0],
        [0.92,0.06],[0.88,0.14],[0.85,0.22],[0.82,0.28],
        [0.76,0.34],[0.72,0.40],[0.70,0.46],[0.71,0.52],[0.73,0.58],[0.77,0.63],
        [0.82,0.68],[0.85,0.74],[0.83,0.80],[0.79,0.86],
        [0.71,0.92],[0.62,0.96],[0.50,0.98],[0.38,0.96],[0.29,0.92],
        [0.21,0.86],[0.17,0.80],[0.15,0.74],[0.18,0.68],
        [0.23,0.63],[0.27,0.58],[0.29,0.52],[0.30,0.46],[0.28,0.40],[0.24,0.34],
        [0.18,0.28],[0.15,0.22],[0.12,0.14],[0.08,0.06],
    ],

    update(dt) {
        this.animTimer += dt;
    },

    render(ctx) {
        const p = GameState.player;
        const camp = GameState.campaign;
        if (!p || !camp) return;

        ctx.fillStyle = '#080810';
        ctx.fillRect(0, 0, Renderer.w, Renderer.h);

        this.renderTopBar(ctx, p);
        this.renderMap(ctx, camp);
        this.renderSidePanel(ctx, p);
        this.renderTooltip(ctx);
    },

    renderTopBar(ctx, p) {
        // Resource bar
        ctx.fillStyle = 'rgba(10, 10, 18, 0.95)';
        ctx.fillRect(0, 0, Renderer.w, 46);
        ctx.strokeStyle = '#3a3a4a';
        ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(0, 46); ctx.lineTo(Renderer.w, 46); ctx.stroke();

        ctx.font = '14px Segoe UI';
        ctx.textAlign = 'left';

        // Resources with sprite icons
        const resources = [
            { sprite: 'icon_gold', label: 'Gold', value: p.gold, color: '#e0c040' },
            { sprite: 'icon_iron', label: 'Iron', value: p.iron, color: '#a0a0b0' },
            { sprite: 'icon_food', label: 'Food', value: p.food, color: '#80c060' }
        ];

        let rx = 20;
        resources.forEach(r => {
            Sprites.draw(ctx, r.sprite, rx + 6, 28, { scale: 1.0 });
            ctx.fillStyle = r.color;
            ctx.fillText(`${r.value}`, rx + 20, 30);
            rx += 80;
        });

        // Hero info
        ctx.fillStyle = p.bannerColor;
        ctx.fillText(`${p.name} — Lv.${p.level} ${p.race} ${p.class}`, rx + 40, 30);

        // Wounds
        if (p.wounds > 0) {
            ctx.fillStyle = '#c04040';
            ctx.fillText(`Wounds: ${p.wounds}/3`, rx + 350, 30);
        }

        // Save button
        const saveX = Renderer.w - 110, saveY = 8;
        Utils.drawPanel(ctx, saveX, saveY, 90, 30, '#6a6a7a', '#1a1a2a');
        Utils.drawTextCentered(ctx, 'Save', saveX + 45, saveY + 15, '13px Segoe UI', '#a0a0b0');
        if (Input.clickedInRect(saveX, saveY, 90, 30)) {
            SaveSystem.save();
        }

        // Menu button
        const menuX = Renderer.w - 210, menuY = 8;
        Utils.drawPanel(ctx, menuX, menuY, 90, 30, '#5a5a6a', '#1a1a2a');
        Utils.drawTextCentered(ctx, 'Menu', menuX + 45, menuY + 15, '13px Segoe UI', '#a0a0b0');
        if (Input.clickedInRect(menuX, menuY, 90, 30)) {
            SaveSystem.save();
            ScreenManager.fadeToScreen('mainMenu');
        }
    },

    // --- Geographic Peninsula Map ---
    renderMap(ctx, camp) {
        const mapX = 20, mapY = 52;
        const mapW = Renderer.w - 260, mapH = Renderer.h - 62;

        ctx.save();
        ctx.beginPath();
        ctx.rect(mapX, mapY, mapW, mapH);
        ctx.clip();

        this.drawWater(ctx, mapX, mapY, mapW, mapH);
        this.drawLandMass(ctx, mapX, mapY, mapW, mapH);
        this.drawTerrain(ctx, mapX, mapY, mapW, mapH);
        this.drawDistrictZones(ctx, mapX, mapY, mapW, mapH, camp);
        this.drawRoads(ctx, camp, mapX, mapY, mapW, mapH);
        this.hoveredNode = null;
        this.drawAllNodes(ctx, camp, mapX, mapY, mapW, mapH);
        this.drawDistrictLabels(ctx, mapX, mapY, mapW, mapH, camp);

        Utils.drawTextCentered(ctx, Districts.region.name, mapX + mapW / 2, mapY + 16,
            'bold 14px Segoe UI', 'rgba(200,180,120,0.5)');
        ctx.font = '10px Segoe UI';
        ctx.fillStyle = 'rgba(120,120,140,0.4)';
        ctx.textAlign = 'right';
        ctx.fillText('N ↑', mapX + mapW - 8, mapY + 16);

        ctx.restore();
    },

    drawWater(ctx, mx, my, mw, mh) {
        const grad = ctx.createRadialGradient(mx + mw * 0.5, my + mh * 0.45, mw * 0.15,
            mx + mw * 0.5, my + mh * 0.5, mw * 0.7);
        grad.addColorStop(0, '#0c1e3a');
        grad.addColorStop(0.5, '#091828');
        grad.addColorStop(1, '#060e1a');
        ctx.fillStyle = grad;
        ctx.fillRect(mx, my, mw, mh);

        if (this.decorations) {
            ctx.strokeStyle = 'rgba(40,70,120,0.15)';
            ctx.lineWidth = 1;
            this.decorations.waves.forEach(w => {
                const wy = my + w.y * mh;
                ctx.beginPath();
                for (let x = mx; x < mx + mw; x += 4) {
                    const y = wy + Math.sin(x * 0.015 + w.offset + this.animTimer * w.speed) * 3;
                    if (x === mx) ctx.moveTo(x, y); else ctx.lineTo(x, y);
                }
                ctx.stroke();
            });
        }
    },

    drawLandMass(ctx, mx, my, mw, mh) {
        ctx.beginPath();
        this._landPoly.forEach((p, i) => {
            const x = mx + p[0] * mw, y = my + p[1] * mh;
            if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        });
        ctx.closePath();

        const landGrad = ctx.createLinearGradient(mx, my, mx, my + mh);
        landGrad.addColorStop(0, '#2a2020');
        landGrad.addColorStop(0.30, '#2a2518');
        landGrad.addColorStop(0.50, '#28261a');
        landGrad.addColorStop(0.70, '#1e2a18');
        landGrad.addColorStop(1, '#162812');
        ctx.fillStyle = landGrad;
        ctx.fill();

        ctx.strokeStyle = 'rgba(160,140,100,0.12)';
        ctx.lineWidth = 10;
        ctx.stroke();
        ctx.strokeStyle = 'rgba(180,160,120,0.25)';
        ctx.lineWidth = 2;
        ctx.stroke();
    },

    drawTerrain(ctx, mx, my, mw, mh) {
        if (!this.decorations) return;

        // Mountains in Grimspire (top)
        const peaks = [
            [0.20,0.85,0.12,0.55],[0.35,0.70,0.16,0.75],[0.50,0.60,0.20,0.90],
            [0.65,0.72,0.15,0.65],[0.80,0.80,0.12,0.50],[0.42,0.78,0.10,0.45],[0.58,0.68,0.18,0.80]
        ];
        const mtX = mx + mw * 0.20, mtY = my + mh * 0.02, mtW = mw * 0.60, mtH = mh * 0.22;
        peaks.forEach(([px,py,pw,ph]) => {
            const bx = mtX + px * mtW, by = mtY + py * mtH;
            const peakW = pw * mtW, peakH = ph * mtH;
            ctx.beginPath();
            ctx.moveTo(bx, by - peakH);
            ctx.lineTo(bx - peakW / 2, by);
            ctx.lineTo(bx + peakW / 2, by);
            ctx.closePath();
            ctx.fillStyle = 'rgba(55,45,40,0.8)';
            ctx.fill();
            ctx.strokeStyle = 'rgba(90,80,70,0.3)'; ctx.lineWidth = 1; ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(bx, by - peakH);
            ctx.lineTo(bx - peakW * 0.12, by - peakH * 0.75);
            ctx.lineTo(bx + peakW * 0.12, by - peakH * 0.75);
            ctx.closePath();
            ctx.fillStyle = 'rgba(190,190,200,0.5)';
            ctx.fill();
        });

        // Hills in Iron Pass (middle)
        for (let i = 0; i < 8; i++) {
            const hx = mx + mw * (0.32 + i * 0.045 + Math.sin(i * 2.3) * 0.02);
            const hy = my + mh * (0.38 + Math.sin(i * 1.7) * 0.08);
            const hr = 8 + Math.sin(i * 3.1) * 7;
            ctx.beginPath(); ctx.arc(hx, hy, Math.abs(hr), Math.PI, 0); ctx.closePath();
            ctx.fillStyle = 'rgba(50,45,35,0.5)'; ctx.fill();
        }

        // Trees in Greenhollow (bottom)
        this.decorations.trees.forEach(t => {
            const tx = mx + t.x * mw, ty = my + t.y * mh;
            if (!this.isOnLand(t.x, t.y)) return;
            const s = t.size;
            ctx.fillStyle = 'rgba(50,35,15,0.5)';
            ctx.fillRect(tx - 0.5, ty, 1, s * 0.8);
            ctx.beginPath();
            ctx.moveTo(tx, ty - s);
            ctx.lineTo(tx - s * 0.7, ty + s * 0.3);
            ctx.lineTo(tx + s * 0.7, ty + s * 0.3);
            ctx.closePath();
            ctx.fillStyle = `rgba(25,${60 + t.shade * 40 | 0},18,0.65)`;
            ctx.fill();
        });

        // Rocks
        this.decorations.rocks.forEach(r => {
            const rx = mx + r.x * mw, ry = my + r.y * mh;
            if (!this.isOnLand(r.x, r.y)) return;
            ctx.fillStyle = 'rgba(60,55,50,0.5)';
            ctx.beginPath(); ctx.arc(rx, ry, r.size, 0, Math.PI * 2); ctx.fill();
        });
    },

    isOnLand(rx, ry) {
        const pts = this._landPoly;
        let minX = 1, maxX = 0;
        for (let i = 0; i < pts.length; i++) {
            const [x1, y1] = pts[i];
            const [x2, y2] = pts[(i + 1) % pts.length];
            if ((y1 <= ry && y2 >= ry) || (y2 <= ry && y1 >= ry)) {
                const dy = y2 - y1;
                if (Math.abs(dy) < 0.001) continue;
                const ix = x1 + (ry - y1) / dy * (x2 - x1);
                if (ix < 0.5) minX = Math.min(minX, ix);
                else maxX = Math.max(maxX, ix);
            }
        }
        return rx > minX + 0.03 && rx < maxX - 0.03;
    },

    drawDistrictZones(ctx, mx, my, mw, mh, camp) {
        const zones = [
            { key: 'grimspire', y1: 0.0, y2: 0.32, color: 'rgba(100,30,20,0.12)' },
            { key: 'sunscar', y1: 0.32, y2: 0.64, color: 'rgba(180,140,50,0.10)' },
            { key: 'greenhollow', y1: 0.64, y2: 1.0, color: 'rgba(30,90,25,0.12)' },
        ];
        zones.forEach(z => {
            // Always show biome tint (stronger when current)
            const isCurrent = camp.currentDistrict === z.key;
            ctx.fillStyle = z.color;
            ctx.globalAlpha = isCurrent ? 1 : 0.4;
            ctx.fillRect(mx, my + z.y1 * mh, mw, (z.y2 - z.y1) * mh);
            ctx.globalAlpha = 1;
            if (z.y1 > 0) {
                ctx.strokeStyle = 'rgba(120,100,80,0.15)'; ctx.lineWidth = 1;
                ctx.setLineDash([6, 8]);
                ctx.beginPath(); ctx.moveTo(mx, my + z.y1 * mh); ctx.lineTo(mx + mw, my + z.y1 * mh); ctx.stroke();
                ctx.setLineDash([]);
            }
        });
    },

    getNodePos(districtKey, node, mx, my, mw, mh) {
        const bands = { grimspire: 0.02, sunscar: 0.34, greenhollow: 0.66 };
        const bandH = { grimspire: 0.30, sunscar: 0.28, greenhollow: 0.30 };
        const band = bands[districtKey] || 0;
        const bh = bandH[districtKey] || 0.30;
        const pad = 0.06;
        return {
            x: mx + (pad + node.x * (1 - pad * 2)) * mw,
            y: my + (band + pad + node.y * (bh - pad * 2)) * mh
        };
    },

    drawRoads(ctx, camp, mx, my, mw, mh) {
        const districtKeys = Districts.region.districts;

        districtKeys.forEach(key => {
            const dist = Districts.data[key];
            const distState = camp.districts[key];
            dist.nodes.forEach(node => {
                const ns = distState.nodeStates[node.id];
                const from = this.getNodePos(key, node, mx, my, mw, mh);
                (node.next || []).forEach(nextId => {
                    const nextNode = dist.nodes.find(n => n.id === nextId);
                    if (!nextNode) return;
                    const to = this.getNodePos(key, nextNode, mx, my, mw, mh);
                    ctx.strokeStyle = ns.completed ? 'rgba(80,100,60,0.35)' : 'rgba(100,85,60,0.2)';
                    ctx.lineWidth = ns.completed ? 2.5 : 1.5;
                    ctx.setLineDash(ns.completed ? [] : [4, 4]);
                    ctx.beginPath(); ctx.moveTo(from.x, from.y);
                    const cx = (from.x + to.x) / 2 + (to.y - from.y) * 0.1;
                    const cy = (from.y + to.y) / 2 - (to.x - from.x) * 0.1;
                    ctx.quadraticCurveTo(cx, cy, to.x, to.y);
                    ctx.stroke(); ctx.setLineDash([]);
                });
            });
        });

        // Inter-district connections
        for (let i = 0; i < districtKeys.length - 1; i++) {
            const curKey = districtKeys[i], nextKey = districtKeys[i + 1];
            const curDist = Districts.data[curKey], nextDist = Districts.data[nextKey];
            const curState = camp.districts[curKey];
            const lastNodes = curDist.nodes.filter(n =>
                n.type === 'capital' || n.type === 'boss' || !n.next || n.next.length === 0);
            const firstNode = nextDist.nodes[0];
            if (lastNodes.length && firstNode) {
                lastNodes.forEach(ln => {
                    const from = this.getNodePos(curKey, ln, mx, my, mw, mh);
                    const to = this.getNodePos(nextKey, firstNode, mx, my, mw, mh);
                    ctx.strokeStyle = curState.completed ? 'rgba(80,100,60,0.3)' : 'rgba(60,50,40,0.15)';
                    ctx.lineWidth = 2; ctx.setLineDash([6, 6]);
                    ctx.beginPath(); ctx.moveTo(from.x, from.y); ctx.lineTo(to.x, to.y); ctx.stroke();
                    ctx.setLineDash([]);
                });
            }
        }
    },

    drawAllNodes(ctx, camp, mx, my, mw, mh) {
        const districtKeys = Districts.region.districts;
        const serviceTypes = ['blacksmith', 'barracks', 'tavern', 'healer', 'market'];

        districtKeys.forEach(key => {
            const dist = Districts.data[key];
            const distState = camp.districts[key];
            const isCurrentDist = camp.currentDistrict === key;
            const distCompleted = distState.completed;
            const distAccessible = isCurrentDist || distCompleted;

            dist.nodes.forEach(node => {
                const ns = distState.nodeStates[node.id];
                const pos = this.getNodePos(key, node, mx, my, mw, mh);
                const r = 14;

                const isService = serviceTypes.includes(node.type);
                const accessible = distAccessible && ns.unlocked && (!ns.completed || isService);
                const completed = ns.completed && !isService;
                const visited = ns.visited;
                const locked = !distAccessible || !ns.unlocked;

                const typeColor = Districts.getNodeTypeColor(node.type);
                const hover = Utils.dist(Input.mouse.x, Input.mouse.y, pos.x, pos.y) < r + 6;
                if (hover && !locked) this.hoveredNode = { ...node, _districtKey: key };

                // Pulse ring
                if (accessible && !completed) {
                    const pulse = Math.sin(this.animTimer * 3) * 2;
                    ctx.strokeStyle = typeColor; ctx.lineWidth = 1.5;
                    ctx.globalAlpha = 0.25 + Math.sin(this.animTimer * 3) * 0.15;
                    ctx.beginPath(); ctx.arc(pos.x, pos.y, r + 5 + pulse, 0, Math.PI * 2); ctx.stroke();
                    ctx.globalAlpha = 1;
                }

                // Background
                ctx.fillStyle = completed ? '#1a2a1a' : locked ? '#0e0e14' : hover ? '#1e1e2a' : '#12121c';
                ctx.beginPath(); ctx.arc(pos.x, pos.y, r, 0, Math.PI * 2); ctx.fill();
                ctx.strokeStyle = completed ? '#408040' : locked ? '#1a1a22' : hover ? typeColor : visited ? '#5a5a4a' : typeColor;
                ctx.lineWidth = hover ? 2.5 : 1.5; ctx.stroke();

                ctx.globalAlpha = locked ? 0.2 : 1;
                if (completed) {
                    Utils.drawTextCentered(ctx, '✓', pos.x, pos.y, '13px Segoe UI', '#40a040');
                } else if (isService && visited) {
                    this.drawNodeIcon(ctx, node.type, pos.x, pos.y, typeColor);
                    ctx.fillStyle = '#40a040';
                    ctx.beginPath(); ctx.arc(pos.x + r - 2, pos.y - r + 2, 3, 0, Math.PI * 2); ctx.fill();
                } else {
                    this.drawNodeIcon(ctx, node.type, pos.x, pos.y, typeColor);
                }
                ctx.globalAlpha = 1;

                // Label
                ctx.font = '9px Segoe UI';
                ctx.fillStyle = locked ? 'rgba(60,60,70,0.3)' : 'rgba(180,170,150,0.7)';
                ctx.textAlign = 'center';
                ctx.fillText(node.name, pos.x, pos.y + r + 11);

                // Click
                if (accessible && hover && Input.mouse.clicked) {
                    if (camp.currentDistrict !== key) camp.currentDistrict = key;
                    this.onNodeClick(node);
                }
            });
        });
    },

    drawNodeIcon(ctx, type, x, y, color) {
        const spriteMap = {
            battle: 'node_battle', elite: 'node_elite', boss: 'node_boss',
            event: 'node_event', capital: 'node_capital',
            blacksmith: 'bldg_blacksmith', barracks: 'bldg_barracks',
            tavern: 'bldg_tavern', healer: 'bldg_healer', market: 'bldg_market'
        };
        const key = spriteMap[type];
        if (key && Sprites.get(key)) {
            Sprites.draw(ctx, key, x, y, { scale: 0.5 });
        } else {
            const icons = { battle:'⚔', elite:'💀', boss:'👑', blacksmith:'🔨',
                barracks:'🏕', tavern:'🍺', healer:'❤', market:'💰', event:'❓', capital:'🏰' };
            Utils.drawTextCentered(ctx, icons[type] || '?', x, y, '12px Segoe UI', color);
        }
    },

    drawDistrictLabels(ctx, mx, my, mw, mh, camp) {
        const labels = [
            { key: 'grimspire', name: 'Grimspire', y: 0.16, color: '#7a4040' },
            { key: 'sunscar', name: 'Sunscar Wastes', y: 0.48, color: '#c0a040' },
            { key: 'greenhollow', name: 'Greenhollow', y: 0.80, color: '#407a35' },
        ];
        labels.forEach(l => {
            const isCurrent = camp.currentDistrict === l.key;
            const done = camp.districts[l.key].completed;
            ctx.font = isCurrent ? 'bold 13px Segoe UI' : '11px Segoe UI';
            ctx.fillStyle = isCurrent ? l.color : 'rgba(120,110,100,0.3)';
            ctx.textAlign = 'left';
            ctx.fillText(l.name + (done ? ' ✓' : ''), mx + 6, my + l.y * mh);
        });
    },

    renderSidePanel(ctx, p) {
        const px = Renderer.w - 230, py = 52;
        const pw = 220, ph = Renderer.h - 62;

        Utils.drawPanel(ctx, px, py, pw, ph, '#2a2a3a', '#10101a');

        let y = py + 20;
        ctx.textAlign = 'left';
        const lx = px + 15;

        // Hero summary
        ctx.font = 'bold 15px Segoe UI';
        ctx.fillStyle = p.bannerColor;
        ctx.fillText(p.name, lx, y);
        y += 18;

        // Draw race portrait
        const racePortraitKey = 'race_' + p.race;
        if (Sprites.get(racePortraitKey)) {
            Sprites.draw(ctx, racePortraitKey, px + pw - 40, py + 40, { scale: 0.7 });
        }

        ctx.font = '12px Segoe UI';
        ctx.fillStyle = '#8a8a9a';
        ctx.fillText(`Lv.${p.level} ${p.race} ${p.class}`, lx, y);
        y += 20;

        // HP bar
        ctx.fillStyle = '#a0a0b0';
        ctx.font = '11px Segoe UI';
        ctx.fillText('HP', lx, y);
        Utils.drawBar(ctx, lx + 25, y - 8, 140, 10, p.hp / p.maxHp, '#c03030');
        ctx.fillStyle = '#c0c0c0';
        ctx.fillText(`${p.hp}/${p.maxHp}`, lx + 170, y);
        y += 18;

        // XP bar
        ctx.fillStyle = '#a0a0b0';
        ctx.fillText('XP', lx, y);
        Utils.drawBar(ctx, lx + 25, y - 8, 140, 10, p.xp / p.xpToNext, '#c0a030');
        ctx.fillStyle = '#c0c0c0';
        ctx.fillText(`${p.xp}/${p.xpToNext}`, lx + 170, y);
        y += 22;

        // Weapon
        ctx.font = 'bold 12px Segoe UI';
        ctx.fillStyle = Weapons.rarityColors[p.weapon.rarity] || '#a0a0a0';
        Sprites.draw(ctx, 'icon_sword', lx - 2, y - 4, { scale: 0.7 });
        ctx.fillText(`${p.weapon.name} +${p.weapon.enhanceLevel}`, lx + 14, y);
        y += 16;
        ctx.font = '11px Segoe UI';
        ctx.fillStyle = '#8a8a9a';
        ctx.fillText(`DMG: ${Weapons.getWeaponDamage(p.weapon)}`, lx, y);
        y += 22;

        // Army
        ctx.font = 'bold 13px Segoe UI';
        ctx.fillStyle = '#c8a84e';
        ctx.fillText('Army', lx, y);
        y += 16;

        p.army.slots.forEach(slot => {
            if (slot.count <= 0) return;
            const template = Units.allied[slot.type];
            ctx.fillStyle = template ? template.color : '#a0a0b0';
            ctx.font = '12px Segoe UI';
            ctx.fillText(`${slot.name} ×${slot.count}`, lx + 8, y);
            y += 16;
        });

        y += 8;
        // Morale
        ctx.font = '12px Segoe UI';
        ctx.fillStyle = '#a0a0b0';
        ctx.fillText('Morale:', lx, y);
        const moraleColor = p.army.morale > 60 ? '#40c060' : p.army.morale > 30 ? '#c0a030' : '#c04040';
        Utils.drawBar(ctx, lx + 55, y - 8, 100, 10, p.army.morale / 100, moraleColor);
        ctx.fillText(`${p.army.morale}%`, lx + 162, y);
        y += 25;

        // Stats
        ctx.font = 'bold 12px Segoe UI';
        ctx.fillStyle = '#c8a84e';
        ctx.fillText('Stats', lx, y);
        y += 16;
        const statLabels = { power: 'PWR', vitality: 'VIT', command: 'CMD', agility: 'AGI', focus: 'FOC', resolve: 'RES' };
        Object.entries(p.stats).forEach(([stat, val]) => {
            ctx.font = '11px Segoe UI';
            ctx.fillStyle = '#8a8a9a';
            ctx.fillText(`${statLabels[stat] || stat}:`, lx + 4, y);
            ctx.fillStyle = '#e0d8c0';
            ctx.fillText(String(val), lx + 40, y);
            y += 14;
        });

        // Inventory button
        y += 10;
        const ibx = px + 10, ibw = pw - 20, ibh = 30;
        const ibHover = Input.isMouseInRect(ibx, y, ibw, ibh);
        Utils.drawPanel(ctx, ibx, y, ibw, ibh, ibHover ? '#e0c060' : '#c8a84e', '#1a1a2a');
        Utils.drawTextCentered(ctx, 'Inventory & Army', ibx + ibw / 2, y + 16, 'bold 12px Segoe UI', '#f0d060');
        if (Input.clickedInRect(ibx, y, ibw, ibh)) {
            ScreenManager.fadeToScreen('inventory');
        }
    },

    renderTooltip(ctx) {
        const node = this.hoveredNode;
        if (!node) return;

        const mx = Input.mouse.x + 15;
        const my = Input.mouse.y - 10;
        const tw = 220, th = node.enemies ? 120 : 80;

        const tx = Math.min(mx, Renderer.w - tw - 10);
        const ty = Math.min(my, Renderer.h - th - 10);

        Utils.drawPanel(ctx, tx, ty, tw, th, '#c8a84e', '#14141f');

        ctx.textAlign = 'left';
        ctx.font = 'bold 14px Segoe UI';
        ctx.fillStyle = Districts.getNodeTypeColor(node.type);
        // Draw node type sprite + name
        const ttSpriteMap = {
            battle: 'node_battle', elite: 'node_elite', boss: 'node_boss',
            event: 'node_event', capital: 'node_capital',
            blacksmith: 'bldg_blacksmith', barracks: 'bldg_barracks',
            tavern: 'bldg_tavern', healer: 'bldg_healer', market: 'bldg_market'
        };
        const ttKey = ttSpriteMap[node.type];
        if (ttKey && Sprites.get(ttKey)) {
            Sprites.draw(ctx, ttKey, tx + 18, ty + 17, { scale: 0.45 });
            ctx.fillText(node.name, tx + 30, ty + 22);
        } else {
            ctx.fillText(node.name, tx + 10, ty + 22);
        }

        ctx.font = '12px Segoe UI';
        ctx.fillStyle = '#a0a0b0';
        ctx.fillText(`Type: ${node.type.charAt(0).toUpperCase() + node.type.slice(1)}`, tx + 10, ty + 42);

        if (node._districtKey) {
            const distName = Districts.data[node._districtKey] ? Districts.data[node._districtKey].name : node._districtKey;
            ctx.fillStyle = '#6a6a7a';
            ctx.fillText(`District: ${distName}`, tx + 10, ty + 56);
        }

        if (node.enemies) {
            ctx.fillStyle = '#c04040';
            ctx.fillText('Enemies:', tx + 10, ty + 60);
            let ey = ty + 74;
            node.enemies.forEach(e => {
                const template = Units.enemy[e.type];
                ctx.fillStyle = template ? template.color : '#a0a0b0';
                ctx.fillText(`  ${template ? template.name : e.type} ×${e.count}`, tx + 10, ey);
                ey += 14;
            });
        }

        if (node.level) {
            ctx.fillStyle = '#8a8a9a';
            ctx.fillText(`Difficulty: ${'★'.repeat(node.level)}`, tx + 10, ty + th - 10);
        }
    },

    onNodeClick(node) {
        const type = node.type;
        GameState.campaign.currentNodeId = node.id;
        SaveSystem.save();

        switch (type) {
            case 'battle':
            case 'elite':
            case 'capital':
            case 'boss':
                ScreenManager.fadeToScreen('battle', { node });
                break;
            case 'blacksmith':
                ScreenManager.fadeToScreen('blacksmith', { node });
                break;
            case 'barracks':
                ScreenManager.fadeToScreen('barracks', { node });
                break;
            case 'tavern':
                ScreenManager.fadeToScreen('tavern', { node });
                break;
            case 'healer':
                ScreenManager.fadeToScreen('healer', { node });
                break;
            case 'market':
                ScreenManager.fadeToScreen('market', { node });
                break;
            case 'event':
                ScreenManager.fadeToScreen('event', { node });
                break;
        }
    }
};
