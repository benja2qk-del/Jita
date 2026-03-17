const GameOverScreen = {
    enter() {},
    update(dt) {},

    render(ctx) {
        ctx.fillStyle = '#0a0612';
        ctx.fillRect(0, 0, Renderer.w, Renderer.h);

        // Red vignette
        const grad = ctx.createRadialGradient(Renderer.cx, Renderer.cy, 100, Renderer.cx, Renderer.cy, Renderer.w * 0.7);
        grad.addColorStop(0, 'rgba(0,0,0,0)');
        grad.addColorStop(1, 'rgba(120,0,0,0.3)');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, Renderer.w, Renderer.h);

        Utils.drawTextCentered(ctx, 'GAME OVER', Renderer.cx, Renderer.cy - 80, 'bold 52px Segoe UI', '#c03030');

        const p = GameState.player;
        if (p) {
            Utils.drawTextCentered(ctx, `${p.name} has fallen.`, Renderer.cx, Renderer.cy - 20, '18px Segoe UI', '#a08080');
            Utils.drawTextCentered(ctx, `Battles fought: ${p.totalBattles}  |  Enemies slain: ${p.totalKills}`, Renderer.cx, Renderer.cy + 20, '14px Segoe UI', '#6a5a5a');
        }

        // Try Again
        const bx = Renderer.cx - 100, by = Renderer.cy + 70;
        const hover = Input.isMouseInRect(bx, by, 200, 44);
        Utils.drawPanel(ctx, bx, by, 200, 44, hover ? '#e0c060' : '#c8a84e', '#1a1a2a');
        Utils.drawTextCentered(ctx, 'Return to Menu', Renderer.cx, by + 22, 'bold 16px Segoe UI', '#f0d060');
        if (Input.clickedInRect(bx, by, 200, 44)) {
            SaveSystem.deleteSave();
            GameState.init();
            ScreenManager.fadeToScreen('mainMenu');
        }
    }
};
