const VictoryScreen = {
    particles: [],

    enter() {
        this.particles = [];
        for (let i = 0; i < 100; i++) {
            this.particles.push({
                x: Utils.rand(0, Renderer.w),
                y: Utils.rand(-Renderer.h, 0),
                speed: Utils.rand(40, 120),
                size: Utils.rand(2, 6),
                color: Utils.pick(['#f0d060', '#e0c040', '#c8a84e', '#ff8040', '#60c060', '#4080e0']),
                wobble: Utils.rand(0, Math.PI * 2),
                wobbleSpeed: Utils.rand(1, 3)
            });
        }
    },

    update(dt) {
        this.particles.forEach(p => {
            p.y += p.speed * dt;
            p.x += Math.sin(p.wobble) * 30 * dt;
            p.wobble += p.wobbleSpeed * dt;
            if (p.y > Renderer.h + 10) {
                p.y = -10;
                p.x = Utils.rand(0, Renderer.w);
            }
        });
    },

    render(ctx) {
        ctx.fillStyle = '#06060f';
        ctx.fillRect(0, 0, Renderer.w, Renderer.h);

        // Particles
        this.particles.forEach(p => {
            ctx.fillStyle = p.color;
            ctx.globalAlpha = 0.6;
            ctx.fillRect(p.x, p.y, p.size, p.size);
        });
        ctx.globalAlpha = 1;

        // Gold glow
        const grad = ctx.createRadialGradient(Renderer.cx, Renderer.cy - 60, 40, Renderer.cx, Renderer.cy - 60, 300);
        grad.addColorStop(0, 'rgba(200, 168, 78, 0.15)');
        grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, Renderer.w, Renderer.h);

        Sprites.draw(ctx, 'icon_sword', Renderer.cx - 170, Renderer.cy - 130, { scale: 1.5 });
        Utils.drawTextCentered(ctx, 'VICTORY', Renderer.cx, Renderer.cy - 120, 'bold 52px Segoe UI', '#f0d060');
        Sprites.draw(ctx, 'icon_sword', Renderer.cx + 170, Renderer.cy - 130, { scale: 1.5, flipX: true });
        Utils.drawTextCentered(ctx, 'The Broken Peaks are yours!', Renderer.cx, Renderer.cy - 60, '20px Segoe UI', '#c8a84e');

        const p = GameState.player;
        if (p) {
            Utils.drawTextCentered(ctx, `${p.name} of ${p.kingdomName}`, Renderer.cx, Renderer.cy - 20, 'bold 22px Segoe UI', p.bannerColor);
            Utils.drawTextCentered(ctx, `Level ${p.level} ${p.race} ${p.class}`, Renderer.cx, Renderer.cy + 12, '16px Segoe UI', '#a0a0b0');

            let y = Renderer.cy + 50;
            ctx.textAlign = 'center';
            ctx.font = '14px Segoe UI';
            ctx.fillStyle = '#8a8a9a';
            ctx.fillText(`Battles fought: ${p.totalBattles}`, Renderer.cx, y); y += 20;
            ctx.fillText(`Enemies slain: ${p.totalKills}`, Renderer.cx, y); y += 20;
            ctx.fillText(`Districts conquered: ${GameState.campaign.completedDistricts.length}`, Renderer.cx, y); y += 20;
            ctx.fillText(`Relic Fragments: ${p.relicFragments || 0}`, Renderer.cx, y);
        }

        // Return to Menu
        const bx = Renderer.cx - 120, by = Renderer.cy + 160;
        const hover = Input.isMouseInRect(bx, by, 240, 48);
        Utils.drawPanel(ctx, bx, by, 240, 48, hover ? '#ffe060' : '#c8a84e', '#1a1a2a');
        Utils.drawTextCentered(ctx, 'Return to Menu', Renderer.cx, by + 24, 'bold 18px Segoe UI', '#f0d060');
        if (Input.clickedInRect(bx, by, 240, 48)) {
            GameState.init();
            ScreenManager.fadeToScreen('mainMenu');
        }
    }
};
