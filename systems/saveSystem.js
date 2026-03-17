const SaveSystem = {
    SAVE_KEY: 'shattered_dominion_save',

    save() {
        const data = {
            player: GameState.player,
            campaign: GameState.campaign,
            flags: GameState.flags,
            version: 1
        };
        try {
            localStorage.setItem(this.SAVE_KEY, JSON.stringify(data));
            return true;
        } catch (e) {
            console.error('Save failed:', e);
            return false;
        }
    },

    load() {
        try {
            const raw = localStorage.getItem(this.SAVE_KEY);
            if (!raw) return false;
            const data = JSON.parse(raw);
            if (!data.player || !data.campaign) return false;
            GameState.player = data.player;
            if (!GameState.player.inventory) GameState.player.inventory = [];
            GameState.campaign = data.campaign;
            GameState.flags = data.flags || {};
            GameState.recalcDerived();
            return true;
        } catch (e) {
            console.error('Load failed:', e);
            return false;
        }
    },

    hasSave() {
        return !!localStorage.getItem(this.SAVE_KEY);
    },

    deleteSave() {
        localStorage.removeItem(this.SAVE_KEY);
    }
};
