// Shattered Dominion — Main Entry Point

(function () {
    'use strict';

    Renderer.init();
    Input.init(Renderer.canvas);
    Sprites.init();
    Audio.init();

    // Register all screens
    ScreenManager.register('mainMenu', MainMenuScreen);
    ScreenManager.register('characterCreation', CharacterCreationScreen);
    ScreenManager.register('campaignMap', CampaignMapScreen);
    ScreenManager.register('battle', BattleScreen);
    ScreenManager.register('blacksmith', BlacksmithScreen);
    ScreenManager.register('barracks', BarracksScreen);
    ScreenManager.register('tavern', TavernScreen);
    ScreenManager.register('healer', HealerScreen);
    ScreenManager.register('market', MarketScreen);
    ScreenManager.register('reward', RewardScreen);
    ScreenManager.register('event', EventScreen);
    ScreenManager.register('codex', CodexScreen);
    ScreenManager.register('gameOver', GameOverScreen);
    ScreenManager.register('victory', VictoryScreen);
    ScreenManager.register('inventory', InventoryScreen);

    // Start at main menu
    ScreenManager.switchTo('mainMenu');

    let lastTime = performance.now();

    function gameLoop(now) {
        const dt = Math.min((now - lastTime) / 1000, 0.05);
        lastTime = now;

        // Update
        ScreenManager.update(dt);

        // Render
        Renderer.clear();
        ScreenManager.render(Renderer.ctx);

        // End frame
        Input.endFrame();

        requestAnimationFrame(gameLoop);
    }

    requestAnimationFrame(gameLoop);
})();
