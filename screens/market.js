const MarketScreen = {
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

        Sprites.draw(ctx, 'bldg_market', Renderer.cx - 90, 36, { scale: 0.9 });
        Utils.drawTextCentered(ctx, 'Market', Renderer.cx, 40, 'bold 28px Segoe UI', '#e0c040');
        Utils.drawTextCentered(ctx, 'Trade resources with local merchants', Renderer.cx, 66, '14px Segoe UI', '#6a6a7a');

        // Current resources
        ctx.textAlign = 'center';
        ctx.font = 'bold 16px Segoe UI';
        const ry = 110;
        Sprites.draw(ctx, 'icon_gold', Renderer.cx - 215, ry - 4, { scale: 1.0 });
        ctx.fillStyle = '#e0c040'; ctx.fillText(`Gold: ${p.gold}`, Renderer.cx - 180, ry);
        Sprites.draw(ctx, 'icon_iron', Renderer.cx - 35, ry - 4, { scale: 1.0 });
        ctx.fillStyle = '#a0a0b0'; ctx.fillText(`Iron: ${p.iron}`, Renderer.cx, ry);
        Sprites.draw(ctx, 'icon_food', Renderer.cx + 145, ry - 4, { scale: 1.0 });
        ctx.fillStyle = '#80c060'; ctx.fillText(`Food: ${p.food}`, Renderer.cx + 180, ry);

        // Trade options
        const iconMap = { gold: 'icon_gold', iron: 'icon_iron', food: 'icon_food' };
        const trades = [
            { from: 'gold', to: 'iron', rate: '3 → 2' },
            { from: 'gold', to: 'food', rate: '2 → 3' },
            { from: 'iron', to: 'gold', rate: '2 → 3' },
            { from: 'iron', to: 'food', rate: '2 → 2' },
            { from: 'food', to: 'gold', rate: '3 → 2' },
            { from: 'food', to: 'iron', rate: '3 → 2' },
        ];

        const cols = 3;
        const pw = 200, ph = 100;
        const gapX = 15, gapY = 15;
        const gridW = cols * (pw + gapX) - gapX;
        const gridX = Renderer.cx - gridW / 2;
        let gridY = 155;

        trades.forEach((trade, i) => {
            const col = i % cols;
            const row = Math.floor(i / cols);
            const tx = gridX + col * (pw + gapX);
            const ty = gridY + row * (ph + gapY);

            Utils.drawPanel(ctx, tx, ty, pw, ph, '#c8a84e', '#14141f');

            // Draw: [fromIcon] → [toIcon] centered
            const mid = tx + pw / 2;
            Sprites.draw(ctx, iconMap[trade.from], mid - 22, ty + 20, { scale: 0.8 });
            ctx.textAlign = 'center';
            ctx.font = 'bold 14px Segoe UI';
            ctx.fillStyle = '#e0c060';
            ctx.fillText('→', mid, ty + 24);
            Sprites.draw(ctx, iconMap[trade.to], mid + 22, ty + 20, { scale: 0.8 });

            ctx.font = '12px Segoe UI';
            ctx.fillStyle = '#a0a0b0';
            ctx.fillText(`Rate: ${trade.rate}`, tx + pw / 2, ty + 44);

            // Trade buttons ×1 and ×5
            [1, 5].forEach((amount, bi) => {
                const bx = tx + 20 + bi * 85;
                const by = ty + 58;
                const hover = Input.isMouseInRect(bx, by, 75, 28);

                Utils.drawPanel(ctx, bx, by, 75, 28, hover ? '#e0c060' : '#6a6a5a', '#1a1a2a');
                Utils.drawTextCentered(ctx, `×${amount}`, bx + 37.5, by + 14, '12px Segoe UI', hover ? '#ffe080' : '#c0b090');

                if (Input.clickedInRect(bx, by, 75, 28)) {
                    const result = UpgradeSystem.convertResource(trade.from, trade.to, amount);
                    this.message = result.message;
                    this.messageColor = result.success ? '#60c060' : '#c04040';
                    this.messageTimer = 2;
                    SaveSystem.save();
                }
            });
        });

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
