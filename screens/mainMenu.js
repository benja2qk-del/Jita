const MainMenuScreen = {
    particles: [],
    titleY: 0,

    enter() {
        this.particles = [];
        for (let i = 0; i < 60; i++) {
            this.particles.push({
                x: Utils.rand(0, Renderer.w),
                y: Utils.rand(0, Renderer.h),
                speed: Utils.rand(10, 30),
                size: Utils.rand(1, 3),
                alpha: Utils.rand(0.2, 0.6)
            });
        }
        this.titleY = -50;
        Audio.playMusic('menu');
    },

    update(dt) {
        this.titleY = Utils.lerp(this.titleY, Renderer.cy - 160, dt * 3);
        this.particles.forEach(p => {
            p.y += p.speed * dt;
            if (p.y > Renderer.h) { p.y = -5; p.x = Utils.rand(0, Renderer.w); }
        });
    },

    render(ctx) {
        // Background particles
        this.particles.forEach(p => {
            ctx.fillStyle = `rgba(200, 168, 78, ${p.alpha})`;
            ctx.fillRect(p.x, p.y, p.size, p.size);
        });

        // Title
        Utils.drawTextCentered(ctx, 'SHATTERED', Renderer.cx, this.titleY, 'bold 52px Segoe UI', '#c8a84e');
        Utils.drawTextCentered(ctx, 'DOMINION', Renderer.cx, this.titleY + 56, 'bold 42px Segoe UI', '#e0c060');
        Utils.drawTextCentered(ctx, 'A Fantasy Conquest', Renderer.cx, this.titleY + 100, '16px Segoe UI', '#8a8a9a');

        // Buttons
        const btnW = 220, btnH = 48;
        const btnX = Renderer.cx - btnW / 2;
        let btnY = Renderer.cy + 10;

        // New Game
        this.drawButton(ctx, 'New Game', btnX, btnY, btnW, btnH, true);
        if (Input.clickedInRect(btnX, btnY, btnW, btnH)) {
            ScreenManager.fadeToScreen('characterCreation');
        }
        btnY += 64;

        // Continue
        const hasSave = SaveSystem.hasSave();
        this.drawButton(ctx, 'Continue', btnX, btnY, btnW, btnH, hasSave);
        if (hasSave && Input.clickedInRect(btnX, btnY, btnW, btnH)) {
            if (SaveSystem.load()) {
                ScreenManager.fadeToScreen('campaignMap');
            }
        }
        btnY += 64;

        // Help
        this.drawButton(ctx, 'Codex / Help', btnX, btnY, btnW, btnH, true);
        if (Input.clickedInRect(btnX, btnY, btnW, btnH)) {
            ScreenManager.fadeToScreen('codex');
        }
        btnY += 90;

        // Footer
        Utils.drawTextCentered(ctx, 'v1.1 — Shattered Dominion', Renderer.cx, Renderer.h - 30, '12px Segoe UI', '#4a4a5a');

        // Mute button
        const mx = Renderer.w - 50, my = 15, ms = 30;
        const mHover = Input.isMouseInRect(mx, my, ms, ms);
        Utils.drawPanel(ctx, mx, my, ms, ms, mHover ? '#8a8a9a' : '#3a3a4a', '#1a1a2a');
        Utils.drawTextCentered(ctx, Audio.muted ? '🔇' : '🔊', mx + ms / 2, my + ms / 2 + 1, '14px Segoe UI', '#a0a0b0');
        if (Input.clickedInRect(mx, my, ms, ms)) {
            Audio.resume();
            Audio.toggleMute();
        }
    },

    drawButton(ctx, text, x, y, w, h, enabled) {
        const hover = Input.isMouseInRect(x, y, w, h) && enabled;
        const bg = hover ? '#2a2a4a' : '#1a1a2a';
        const border = enabled ? (hover ? '#e0c060' : '#c8a84e') : '#3a3a4a';
        const textColor = enabled ? (hover ? '#ffe080' : '#f0d060') : '#4a4a5a';

        Utils.drawPanel(ctx, x, y, w, h, border, bg);
        Utils.drawTextCentered(ctx, text, x + w / 2, y + h / 2, 'bold 18px Segoe UI', textColor);
    }
};
