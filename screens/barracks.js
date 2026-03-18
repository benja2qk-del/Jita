const BarracksScreen = {
    node: null,
    message: '',
    messageColor: '#a0a0b0',
    messageTimer: 0,

    enter(params) {
        this.node = params.node;
        this.message = '';
        this.messageTimer = 0;
    },

    update(dt) {
        if (this.messageTimer > 0) this.messageTimer -= dt;
    },

    render(ctx) {
        const p = GameState.player;
        ctx.fillStyle = '#0a0a12';
        ctx.fillRect(0, 0, Renderer.w, Renderer.h);

        Sprites.draw(ctx, 'bldg_barracks', Renderer.cx - 100, 36, { scale: 0.9 });
        Utils.drawTextCentered(ctx, 'Barracks', Renderer.cx, 40, 'bold 28px Segoe UI', '#c8a84e');
        Utils.drawTextCentered(ctx, 'Recruit and reinforce your army', Renderer.cx, 66, '14px Segoe UI', '#6a6a7a');

        // Resources
        ctx.textAlign = 'left';
        ctx.font = '14px Segoe UI';
        Sprites.draw(ctx, 'icon_gold', 30, 38, { scale: 0.85 });
        ctx.fillStyle = '#e0c040'; ctx.fillText(`${p.gold}`, 46, 40);
        Sprites.draw(ctx, 'icon_iron', 110, 38, { scale: 0.85 });
        ctx.fillStyle = '#a0a0b0'; ctx.fillText(`${p.iron}`, 126, 40);
        Sprites.draw(ctx, 'icon_food', 190, 38, { scale: 0.85 });
        ctx.fillStyle = '#80c060'; ctx.fillText(`${p.food}`, 206, 40);

        // Army slots
        const panelW = 260, panelH = 180;
        const startX = Renderer.cx - (p.army.slots.length * (panelW + 10)) / 2;
        const startY = 110;

        p.army.slots.forEach((slot, i) => {
            const template = Units.allied[slot.type];
            if (!template) return;
            const px = startX + i * (panelW + 10);
            const py = startY;

            Utils.drawPanel(ctx, px, py, panelW, panelH, template.color, '#14141f');

            ctx.textAlign = 'left';
            ctx.font = 'bold 16px Segoe UI';
            ctx.fillStyle = template.color;
            // Draw unit idle sprite
            const _barrUnitClsMap = { infantry: 'warrior', archer: 'archer', cavalry: 'samurai', brute: 'tank' };
            const _barrRace = (GameState.player && GameState.player.race || 'Human').toLowerCase();
            const _barrCls  = _barrUnitClsMap[slot.type] || 'warrior';
            const _barrDrawn = UnitSprites.draw(ctx, _barrRace, _barrCls, 'idle', px + panelW - 30, py + 70, 70 / 9, false);
            if (!_barrDrawn && Sprites.get('unit_' + slot.type)) {
                Sprites.draw(ctx, 'unit_' + slot.type, px + panelW - 35, py + 45, { scale: 1.2 });
            }
            ctx.fillText(`${template.name}`, px + 15, py + 28);

            ctx.font = '12px Segoe UI';
            ctx.fillStyle = '#a0a0b0';
            ctx.fillText(template.desc, px + 15, py + 46);

            ctx.fillStyle = '#e0d8c0';
            ctx.fillText(`Count: ${slot.count} / ${slot.maxCount}`, px + 15, py + 68);
            ctx.fillText(`Veterancy: ${slot.veterancy}`, px + 15, py + 84);
            ctx.fillText(`Equip Tier: ${slot.equipTier}`, px + 15, py + 100);

            // Recruit cost
            const cost = UpgradeSystem.getRecruitCost(slot.type);
            if (cost) {
                ctx.fillStyle = '#8a8a9a';
                ctx.font = '11px Segoe UI';
                let rc = px + 15;
                rc += ctx.measureText('Cost/unit: ').width; ctx.fillText('Cost/unit: ', px + 15, py + 118);
                ctx.fillStyle = '#e0c040'; rc += Sprites.iconText(ctx, 'icon_gold', cost.gold, rc, py + 118) + 4;
                ctx.fillStyle = '#a0a0b0'; rc += Sprites.iconText(ctx, 'icon_iron', cost.iron, rc, py + 118) + 4;
                ctx.fillStyle = '#80c060'; Sprites.iconText(ctx, 'icon_food', cost.food, rc, py + 118);
            }

            // Recruit buttons
            const canRecruit = slot.count < slot.maxCount;
            [1, 3, 5].forEach((count, bi) => {
                const bx = px + 15 + bi * 78;
                const by = py + 132;
                const actualCost = cost ? { gold: cost.gold * count, iron: cost.iron * count, food: cost.food * count } : null;
                const canAfford = actualCost && GameState.hasResources(actualCost.gold, actualCost.iron, actualCost.food);
                const enabled = canRecruit && canAfford;

                Utils.drawPanel(ctx, bx, by, 72, 30, enabled ? template.color : '#2a2a3a', enabled ? '#1a1a2a' : '#0e0e16');
                Utils.drawTextCentered(ctx, `+${count}`, bx + 36, by + 15, 'bold 13px Segoe UI', enabled ? '#e0d8c0' : '#3a3a4a');

                if (enabled && Input.clickedInRect(bx, by, 72, 30)) {
                    const result = UpgradeSystem.recruitUnit(i, count);
                    this.message = result.message;
                    this.messageColor = result.success ? '#60c060' : '#c04040';
                    this.messageTimer = 2;
                    SaveSystem.save();
                }
            });
        });

        // Also show available unit types not yet in army
        const allTypes = Object.keys(Units.allied);
        const currentTypes = p.army.slots.map(s => s.type);
        const missingTypes = allTypes.filter(t => !currentTypes.includes(t));

        if (missingTypes.length > 0) {
            const ny = startY + panelH + 30;
            Utils.drawTextCentered(ctx, 'Recruit New Unit Type', Renderer.cx, ny, 'bold 16px Segoe UI', '#c8a84e');

            missingTypes.forEach((type, i) => {
                const template = Units.allied[type];
                const bx = Renderer.cx - 150 + i * 160;
                const by = ny + 20;
                const cost = template.recruitCost;
                const recruitCost = { gold: cost.gold * 3, iron: cost.iron * 3, food: cost.food * 3 };
                const canAfford = GameState.hasResources(recruitCost.gold, recruitCost.iron, recruitCost.food);

                Utils.drawPanel(ctx, bx, by, 150, 80, canAfford ? template.color : '#2a2a3a', '#14141f');

                ctx.textAlign = 'center';
                ctx.font = 'bold 13px Segoe UI';
                ctx.fillStyle = template.color;
                ctx.fillText(template.name, bx + 75, by + 20);

                ctx.font = '10px Segoe UI';
                ctx.fillStyle = '#8a8a9a';
                let nc = bx + 20;
                ctx.fillStyle = '#e0c040'; nc += Sprites.iconText(ctx, 'icon_gold', recruitCost.gold, nc, by + 40) + 3;
                ctx.fillStyle = '#a0a0b0'; nc += Sprites.iconText(ctx, 'icon_iron', recruitCost.iron, nc, by + 40) + 3;
                ctx.fillStyle = '#80c060'; Sprites.iconText(ctx, 'icon_food', recruitCost.food, nc, by + 40);

                Utils.drawPanel(ctx, bx + 20, by + 50, 110, 24, canAfford ? '#c8a84e' : '#2a2a3a', '#1a1a2a');
                Utils.drawTextCentered(ctx, 'Recruit ×3', bx + 75, by + 62, '11px Segoe UI', canAfford ? '#f0d060' : '#3a3a4a');

                if (canAfford && Input.clickedInRect(bx + 20, by + 50, 110, 24)) {
                    if (GameState.spendResources(recruitCost.gold, recruitCost.iron, recruitCost.food)) {
                        p.army.slots.push({
                            type: type,
                            name: template.name,
                            count: 3,
                            maxCount: 8,
                            veterancy: 0,
                            equipTier: 0,
                            morale: 70,
                            ...Utils.deepClone(template.baseStats)
                        });
                        this.message = `Recruited 3 ${template.name}!`;
                        this.messageColor = '#60c060';
                        this.messageTimer = 2;
                        SaveSystem.save();
                    }
                }
            });
        }

        // Message
        if (this.messageTimer > 0 && this.message) {
            Utils.drawPanel(ctx, Renderer.cx - 200, Renderer.h - 120, 400, 40, this.messageColor, '#14141f');
            Utils.drawTextCentered(ctx, this.message, Renderer.cx, Renderer.h - 100, 'bold 14px Segoe UI', this.messageColor);
        }

        // Leave
        const bx = Renderer.cx - 80, by = Renderer.h - 60;
        Utils.drawPanel(ctx, bx, by, 160, 36, '#c8a84e', '#1a1a2a');
        Utils.drawTextCentered(ctx, '← Leave', Renderer.cx, by + 18, 'bold 14px Segoe UI', '#f0d060');
        if (Input.clickedInRect(bx, by, 160, 36)) {
            CampaignSystem.visitNode(this.node.id);
            SaveSystem.save();
            ScreenManager.fadeToScreen('campaignMap');
        }
    }
};
