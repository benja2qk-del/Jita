const RewardScreen = {
    loot: null,

    enter(params) {
        this.loot = params.loot;
    },

    update(dt) {},

    render(ctx) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.fillRect(0, 0, Renderer.w, Renderer.h);

        Utils.drawTextCentered(ctx, '🏆 Rewards', Renderer.cx, 120, 'bold 32px Segoe UI', '#f0d060');

        if (!this.loot) {
            Utils.drawTextCentered(ctx, 'No rewards.', Renderer.cx, 200, '16px Segoe UI', '#8a8a9a');
            return;
        }

        let y = 180;
        ctx.textAlign = 'center';
        ctx.font = '18px Segoe UI';

        if (this.loot.gold) { ctx.fillStyle = '#e0c040'; Sprites.draw(ctx, 'icon_gold', Renderer.cx - 60, y - 5, { scale: 1.0 }); ctx.fillText(`${this.loot.gold} Gold`, Renderer.cx, y); y += 30; }
        if (this.loot.iron) { ctx.fillStyle = '#a0a0b0'; Sprites.draw(ctx, 'icon_iron', Renderer.cx - 60, y - 5, { scale: 1.0 }); ctx.fillText(`${this.loot.iron} Iron`, Renderer.cx, y); y += 30; }
        if (this.loot.food) { ctx.fillStyle = '#80c060'; Sprites.draw(ctx, 'icon_food', Renderer.cx - 60, y - 5, { scale: 1.0 }); ctx.fillText(`${this.loot.food} Food`, Renderer.cx, y); y += 30; }
        if (this.loot.xp) { ctx.fillStyle = '#c0a030'; Sprites.draw(ctx, 'icon_star', Renderer.cx - 60, y - 5, { scale: 1.0 }); ctx.fillText(`${this.loot.xp} XP`, Renderer.cx, y); y += 30; }

        y += 20;
        const bx = Renderer.cx - 80, by = y;
        Utils.drawPanel(ctx, bx, by, 160, 40, '#c8a84e', '#1a1a2a');
        Utils.drawTextCentered(ctx, 'Continue', Renderer.cx, by + 20, 'bold 15px Segoe UI', '#f0d060');
        if (Input.clickedInRect(bx, by, 160, 40)) {
            ScreenManager.fadeToScreen('campaignMap');
        }
    }
};
