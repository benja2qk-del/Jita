const ScreenManager = {
    screens: {},
    currentScreen: null,

    register(name, screen) {
        this.screens[name] = screen;
    },

    switchTo(name, params) {
        if (this.currentScreen && this.currentScreen.exit) {
            this.currentScreen.exit();
        }
        GameState.previousScreen = GameState.screen;
        GameState.screen = name;
        this.currentScreen = this.screens[name];
        if (this.currentScreen && this.currentScreen.enter) {
            this.currentScreen.enter(params);
        }
    },

    fadeToScreen(name, params, duration = 300) {
        if (GameState.transitioning) return;
        GameState.transitioning = true;
        GameState.transitionAlpha = 0;
        GameState.transitionTarget = { name, params, duration, phase: 'out', timer: 0 };
    },

    update(dt) {
        const t = GameState.transitionTarget;
        if (t) {
            t.timer += dt * 1000;
            const half = t.duration / 2;
            if (t.phase === 'out') {
                GameState.transitionAlpha = Utils.clamp(t.timer / half, 0, 1);
                if (t.timer >= half) {
                    t.phase = 'in';
                    t.timer = 0;
                    this.switchTo(t.name, t.params);
                }
            } else {
                GameState.transitionAlpha = 1 - Utils.clamp(t.timer / half, 0, 1);
                if (t.timer >= half) {
                    GameState.transitionAlpha = 0;
                    GameState.transitioning = false;
                    GameState.transitionTarget = null;
                }
            }
        }

        if (this.currentScreen && this.currentScreen.update) {
            this.currentScreen.update(dt);
        }
    },

    render(ctx) {
        if (this.currentScreen && this.currentScreen.render) {
            this.currentScreen.render(ctx);
        }
        if (GameState.transitionAlpha > 0) {
            ctx.fillStyle = `rgba(0, 0, 0, ${GameState.transitionAlpha})`;
            ctx.fillRect(0, 0, Renderer.w, Renderer.h);
        }
    }
};
