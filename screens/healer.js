const HealerScreen = {
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

        Sprites.draw(ctx, 'bldg_healer', Renderer.cx - 90, 36, { scale: 0.9 });
        Utils.drawTextCentered(ctx, 'Healer', Renderer.cx, 40, 'bold 28px Segoe UI', '#40c060');
        Utils.drawTextCentered(ctx, this.node ? this.node.name : 'Healing Tent', Renderer.cx, 66, '14px Segoe UI', '#6a6a7a');

        ctx.textAlign = 'left';
        ctx.font = '14px Segoe UI';
        Sprites.draw(ctx, 'icon_gold', 30, 38, { scale: 0.85 });
        ctx.fillStyle = '#e0c040';
        ctx.fillText(`${p.gold}`, 46, 40);

        const panelX = Renderer.cx - 220, panelY = 120;
        Utils.drawPanel(ctx, panelX, panelY, 440, 340, '#40c060', '#14141f');

        let y = panelY + 35;
        ctx.textAlign = 'center';

        // Current status
        ctx.font = '16px Segoe UI';
        ctx.fillStyle = '#a0a0b0';
        ctx.fillText(`Hero HP: ${p.hp} / ${p.maxHp}`, Renderer.cx, y); y += 22;
        ctx.fillStyle = p.wounds > 0 ? '#c04040' : '#40c060';
        ctx.fillText(`Wounds: ${p.wounds} / 3`, Renderer.cx, y); y += 35;

        // Heal wound
        if (p.wounds > 0) {
            ctx.font = '14px Segoe UI';
            ctx.fillStyle = '#a0a0b0';
            ctx.fillText('Each wound reduces your max HP by 15%.', Renderer.cx, y); y += 22;
            ctx.fillText('Healing a wound costs 25 gold.', Renderer.cx, y); y += 30;

            const canAfford = p.gold >= 25;
            Utils.drawPanel(ctx, Renderer.cx - 100, y, 200, 40, canAfford ? '#40c060' : '#3a3a4a', '#1a1a2a');
            if (canAfford) {
                ctx.font = 'bold 14px Segoe UI'; ctx.fillStyle = '#60ff80'; ctx.textAlign = 'center';
                ctx.fillText('Heal Wound', Renderer.cx - 18, y + 20);
                Sprites.draw(ctx, 'icon_gold', Renderer.cx + 38, y + 16, { scale: 0.55 });
                ctx.fillText('25', Renderer.cx + 55, y + 20);
            } else {
                Utils.drawTextCentered(ctx, 'Not enough gold', Renderer.cx, y + 20, 'bold 14px Segoe UI', '#4a4a5a');
            }

            if (canAfford && Input.clickedInRect(Renderer.cx - 100, y, 200, 40)) {
                const result = UpgradeSystem.healWound();
                this.message = result.message;
                this.messageColor = result.success ? '#40c060' : '#c04040';
                this.messageTimer = 2;
                SaveSystem.save();
            }
            y += 55;
        } else {
            ctx.font = '16px Segoe UI';
            ctx.fillStyle = '#40c060';
            ctx.fillText('You have no wounds. Stay safe out there.', Renderer.cx, y);
            y += 40;
        }

        // Full heal (restore HP/Mana)
        ctx.font = '14px Segoe UI';
        ctx.fillStyle = '#a0a0b0';
        ctx.fillText('Rest and restore full HP and Mana ', Renderer.cx, y);
        const restTW = ctx.measureText('Rest and restore full HP and Mana ').width;
        ctx.textAlign = 'left';
        Sprites.iconText(ctx, 'icon_food', '10', Renderer.cx + restTW / 2 + 2, y);
        ctx.textAlign = 'center';
        y += 28;

        const canRest = p.food >= 10 && (p.hp < p.maxHp || p.mana < p.maxMana);
        Utils.drawPanel(ctx, Renderer.cx - 100, y, 200, 40, canRest ? '#40c060' : '#3a3a4a', '#1a1a2a');
        Utils.drawTextCentered(ctx, canRest ? 'Rest & Recover' : (p.hp >= p.maxHp ? 'Already full' : 'Need food'),
            Renderer.cx, y + 20, 'bold 14px Segoe UI', canRest ? '#60ff80' : '#4a4a5a');

        if (canRest && Input.clickedInRect(Renderer.cx - 100, y, 200, 40)) {
            p.food -= 10;
            p.hp = p.maxHp;
            p.mana = p.maxMana;
            p.army.morale = Utils.clamp(p.army.morale + 5, 0, 100);
            this.message = 'Fully rested and restored!';
            this.messageColor = '#40c060';
            this.messageTimer = 2;
            SaveSystem.save();
        }

        // Message
        if (this.messageTimer > 0) {
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
