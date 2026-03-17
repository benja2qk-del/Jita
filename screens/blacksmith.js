const BlacksmithScreen = {
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

        // Title
        Sprites.draw(ctx, 'bldg_blacksmith', Renderer.cx - 120, 36, { scale: 0.9 });
        Utils.drawTextCentered(ctx, 'Blacksmith', Renderer.cx, 40, 'bold 28px Segoe UI', '#c8a84e');
        Utils.drawTextCentered(ctx, this.node ? this.node.name : 'Forge', Renderer.cx, 68, '14px Segoe UI', '#6a6a7a');

        // Resources
        ctx.textAlign = 'left';
        ctx.font = '14px Segoe UI';
        Sprites.draw(ctx, 'icon_gold', 30, 38, { scale: 0.85 });
        ctx.fillStyle = '#e0c040';
        ctx.fillText(`${p.gold}`, 46, 40);
        Sprites.draw(ctx, 'icon_iron', 110, 38, { scale: 0.85 });
        ctx.fillStyle = '#a0a0b0';
        ctx.fillText(`${p.iron}`, 126, 40);

        // Weapon panel
        const wpx = Renderer.cx - 280, wpy = 100, wpw = 280, wph = 400;
        Utils.drawPanel(ctx, wpx, wpy, wpw, wph, '#c8a84e', '#14141f');

        Utils.drawTextCentered(ctx, 'Weapon Enhancement', wpx + wpw / 2, wpy + 28, 'bold 18px Segoe UI', '#c8a84e');

        let y = wpy + 55;
        const lx = wpx + 20;

        // Current weapon
        ctx.textAlign = 'left';
        ctx.font = 'bold 16px Segoe UI';
        ctx.fillStyle = Weapons.rarityColors[p.weapon.rarity];
        Sprites.draw(ctx, 'icon_sword', lx - 2, y - 4, { scale: 0.7 });
        ctx.fillText(`${p.weapon.name}`, lx + 16, y);
        y += 20;

        ctx.font = '13px Segoe UI';
        ctx.fillStyle = '#a0a0b0';
        ctx.fillText(`Rarity: ${p.weapon.rarity}`, lx, y); y += 18;

        ctx.fillStyle = '#e0d8c0';
        ctx.fillText(`Enhancement: +${p.weapon.enhanceLevel}`, lx, y); y += 18;

        ctx.fillText(`Base Damage: ${p.weapon.baseDamage}`, lx, y); y += 18;
        ctx.fillStyle = '#60c060';
        ctx.fillText(`Total Damage: ${Weapons.getWeaponDamage(p.weapon)}`, lx, y); y += 30;

        // Enhance button
        const cost = UpgradeSystem.getEnhanceCost(p.weapon.enhanceLevel);
        const rate = UpgradeSystem.getEnhanceSuccessRate(p.weapon.enhanceLevel);
        const canAfford = GameState.hasResources(cost.gold, cost.iron, 0);

        ctx.font = '13px Segoe UI';
        ctx.fillStyle = '#a0a0b0';
        let cx1 = lx;
        cx1 += ctx.measureText('Cost: ').width; ctx.fillText('Cost: ', lx, y);
        ctx.fillStyle = '#e0c040'; cx1 += Sprites.iconText(ctx, 'icon_gold', cost.gold, cx1, y) + 8;
        ctx.fillStyle = '#a0a0b0'; Sprites.iconText(ctx, 'icon_iron', cost.iron, cx1, y);
        y += 18;

        ctx.fillStyle = rate > 70 ? '#60c060' : rate > 40 ? '#c0a030' : '#c04040';
        ctx.fillText(`Success Rate: ${rate}%`, lx, y); y += 8;

        if (p.weapon.enhanceLevel >= 3) {
            y += 6;
            ctx.fillStyle = '#c06040';
            ctx.font = '11px Segoe UI';
            Sprites.draw(ctx, 'icon_warning', lx + 8, y - 4, { scale: 0.6 });
            ctx.fillText(' Failure may downgrade or break the weapon!', lx + 18, y);
            y += 4;
        }

        y += 16;
        const ebx = lx, eby = y;
        const enabled = canAfford;
        Utils.drawPanel(ctx, ebx, eby, 240, 40, enabled ? '#c8a84e' : '#3a3a4a', enabled ? '#1a1a2a' : '#0e0e16');
        Utils.drawTextCentered(ctx, enabled ? `Enhance (+${p.weapon.enhanceLevel} → +${p.weapon.enhanceLevel + 1})` : 'Not enough resources',
            ebx + 120, eby + 20, 'bold 14px Segoe UI', enabled ? '#f0d060' : '#4a4a5a');

        if (enabled && Input.clickedInRect(ebx, eby, 240, 40)) {
            const result = UpgradeSystem.attemptEnhance(p.weapon);
            this.message = result.message;
            this.messageColor = result.success ? '#60c060' : '#c04040';
            this.messageTimer = 3;
            SaveSystem.save();
        }

        // Armor panel
        const apx = Renderer.cx + 10, apy = 100, apw = 280, aph = 280;
        Utils.drawPanel(ctx, apx, apy, apw, aph, '#c8a84e', '#14141f');

        Utils.drawTextCentered(ctx, 'Armor Upgrade', apx + apw / 2, apy + 28, 'bold 18px Segoe UI', '#c8a84e');

        let ay = apy + 55;
        const alx = apx + 20;

        ctx.textAlign = 'left';
        ctx.font = 'bold 16px Segoe UI';
        ctx.fillStyle = '#8080c0';
        Sprites.draw(ctx, 'icon_armor', alx + 8, ay - 5, { scale: 0.7 });
        ctx.fillText(` ${p.armor.name}`, alx + 20, ay); ay += 20;

        ctx.font = '13px Segoe UI';
        ctx.fillStyle = '#e0d8c0';
        ctx.fillText(`Enhancement: +${p.armor.enhanceLevel}`, alx, ay); ay += 18;
        ctx.fillText(`Defense: ${p.armor.defense}`, alx, ay); ay += 30;

        const armorCost = UpgradeSystem.getArmorUpgradeCost(p.armor.enhanceLevel);
        const canAffordArmor = GameState.hasResources(armorCost.gold, armorCost.iron, 0);

        ctx.font = '13px Segoe UI';
        ctx.fillStyle = '#a0a0b0';
        let cx2 = alx;
        cx2 += ctx.measureText('Cost: ').width; ctx.fillText('Cost: ', alx, ay);
        ctx.fillStyle = '#e0c040'; cx2 += Sprites.iconText(ctx, 'icon_gold', armorCost.gold, cx2, ay) + 8;
        ctx.fillStyle = '#a0a0b0'; Sprites.iconText(ctx, 'icon_iron', armorCost.iron, cx2, ay);
        ay += 24;

        Utils.drawPanel(ctx, alx, ay, 240, 38, canAffordArmor ? '#c8a84e' : '#3a3a4a', canAffordArmor ? '#1a1a2a' : '#0e0e16');
        Utils.drawTextCentered(ctx, canAffordArmor ? 'Upgrade Armor' : 'Not enough resources',
            alx + 120, ay + 19, 'bold 14px Segoe UI', canAffordArmor ? '#f0d060' : '#4a4a5a');

        if (canAffordArmor && Input.clickedInRect(alx, ay, 240, 38)) {
            const result = UpgradeSystem.upgradeArmor();
            this.message = result.message;
            this.messageColor = result.success ? '#60c060' : '#c04040';
            this.messageTimer = 3;
            SaveSystem.save();
        }

        // Message
        if (this.messageTimer > 0 && this.message) {
            Utils.drawPanel(ctx, Renderer.cx - 200, Renderer.h - 120, 400, 40, this.messageColor, '#14141f');
            Utils.drawTextCentered(ctx, this.message, Renderer.cx, Renderer.h - 100, 'bold 14px Segoe UI', this.messageColor);
        }

        // Leave button
        this.drawLeaveButton(ctx);
    },

    drawLeaveButton(ctx) {
        const bx = Renderer.cx - 80, by = Renderer.h - 60;
        const hover = Input.isMouseInRect(bx, by, 160, 36);
        Utils.drawPanel(ctx, bx, by, 160, 36, hover ? '#e0c060' : '#c8a84e', '#1a1a2a');
        Utils.drawTextCentered(ctx, '← Leave', Renderer.cx, by + 18, 'bold 14px Segoe UI', '#f0d060');
        if (Input.clickedInRect(bx, by, 160, 36)) {
            CampaignSystem.visitNode(this.node.id);
            SaveSystem.save();
            ScreenManager.fadeToScreen('campaignMap');
        }
    }
};
