const CodexScreen = {
    tab: 'races',

    enter() {
        this.tab = 'races';
    },

    update(dt) {},

    render(ctx) {
        ctx.fillStyle = '#0a0a12';
        ctx.fillRect(0, 0, Renderer.w, Renderer.h);

        Utils.drawTextCentered(ctx, '📖 Codex', Renderer.cx, 36, 'bold 28px Segoe UI', '#c8a84e');

        // Tabs
        const tabs = ['races', 'classes', 'units', 'resources', 'controls'];
        const tabW = 120, tabH = 30;
        const tabsX = Renderer.cx - (tabs.length * (tabW + 8)) / 2;
        tabs.forEach((t, i) => {
            const tx = tabsX + i * (tabW + 8);
            const selected = this.tab === t;
            const hover = Input.isMouseInRect(tx, 58, tabW, tabH);
            Utils.drawPanel(ctx, tx, 58, tabW, tabH, selected ? '#e0c060' : hover ? '#8a8a9a' : '#3a3a4a', selected ? '#2a2a3a' : '#12121a');
            Utils.drawTextCentered(ctx, t.charAt(0).toUpperCase() + t.slice(1), tx + tabW / 2, 73, '13px Segoe UI', selected ? '#e0c060' : '#8a8a9a');
            if (Input.clickedInRect(tx, 58, tabW, tabH)) this.tab = t;
        });

        const contentX = 40, contentY = 105;
        ctx.textAlign = 'left';

        switch (this.tab) {
            case 'races': this.renderRaces(ctx, contentX, contentY); break;
            case 'classes': this.renderClasses(ctx, contentX, contentY); break;
            case 'units': this.renderUnits(ctx, contentX, contentY); break;
            case 'resources': this.renderResources(ctx, contentX, contentY); break;
            case 'controls': this.renderControls(ctx, contentX, contentY); break;
        }

        // Back button
        const bx = 30, by = Renderer.h - 55;
        Utils.drawPanel(ctx, bx, by, 120, 36, '#c8a84e', '#1a1a2a');
        Utils.drawTextCentered(ctx, '← Back', bx + 60, by + 18, 'bold 13px Segoe UI', '#f0d060');
        if (Input.clickedInRect(bx, by, 120, 36)) {
            const prev = GameState.previousScreen || 'mainMenu';
            ScreenManager.fadeToScreen(GameState.player ? 'campaignMap' : 'mainMenu');
        }
    },

    renderRaces(ctx, x, y) {
        Object.values(Races).forEach(race => {
            ctx.font = 'bold 18px Segoe UI';
            ctx.fillStyle = race.color;
            ctx.fillText(race.name, x, y); y += 20;
            ctx.font = '13px Segoe UI';
            ctx.fillStyle = '#a0a0b0';
            ctx.fillText(race.description, x + 10, y); y += 18;
            race.passives.forEach(p => {
                ctx.fillStyle = '#60a060';
                ctx.fillText(`• ${p.name}: ${p.desc}`, x + 10, y); y += 16;
            });
            y += 15;
        });
    },

    renderClasses(ctx, x, y) {
        Object.values(Classes).forEach(cls => {
            ctx.font = 'bold 18px Segoe UI';
            ctx.fillStyle = cls.color;
            ctx.fillText(cls.name, x, y); y += 20;
            ctx.font = '13px Segoe UI';
            ctx.fillStyle = '#a0a0b0';
            ctx.fillText(cls.description, x + 10, y); y += 18;
            cls.skills.forEach(s => {
                ctx.fillStyle = '#e0c060';
                const cskKey = 'skill_' + s.id;
                if (Sprites.get(cskKey)) {
                    Sprites.draw(ctx, cskKey, x + 18, y - 5, { scale: 0.45 });
                }
                ctx.fillText(`[${s.keyLabel}] ${s.name}: ${s.desc.substring(0, 70)}...`, x + 28, y);
                y += 16;
            });
            y += 15;
        });
    },

    renderUnits(ctx, x, y) {
        ctx.font = 'bold 16px Segoe UI';
        ctx.fillStyle = '#c8a84e';
        ctx.fillText('Allied Units', x, y); y += 22;

        Object.values(Units.allied).forEach(u => {
            ctx.font = 'bold 14px Segoe UI';
            ctx.fillStyle = u.color;
            ctx.fillText(`${u.name} (${u.role})`, x + 10, y); y += 16;
            ctx.font = '12px Segoe UI';
            ctx.fillStyle = '#8a8a9a';
            ctx.fillText(u.desc, x + 20, y); y += 14;
            ctx.fillStyle = '#6a6a7a';
            ctx.fillText(`HP:${u.baseStats.hp} ATK:${u.baseStats.attack} DEF:${u.baseStats.defense} SPD:${u.baseStats.speed}`, x + 20, y);
            y += 18;
        });

        y += 10;
        ctx.font = 'bold 16px Segoe UI';
        ctx.fillStyle = '#c04040';
        ctx.fillText('Enemy Units', x, y); y += 22;

        Object.values(Units.enemy).forEach(u => {
            ctx.font = 'bold 14px Segoe UI';
            ctx.fillStyle = u.color;
            ctx.fillText(`${u.name} (${u.role})`, x + 10, y); y += 16;
            ctx.font = '12px Segoe UI';
            ctx.fillStyle = '#8a8a9a';
            ctx.fillText(u.desc, x + 20, y); y += 18;
        });
    },

    renderResources(ctx, x, y) {
        const items = [
            { sprite: 'icon_gold', name: 'Gold', color: '#e0c040', desc: 'Primary currency. Used for recruiting, upgrading, and trading.' },
            { sprite: 'icon_iron', name: 'Iron', color: '#a0a0b0', desc: 'Used for weapon enhancements, armor upgrades, and equipment.' },
            { sprite: 'icon_food', name: 'Food', color: '#80c060', desc: 'Feeds your army. Used for resting, recruiting, and sustaining troops.' },
            { sprite: 'icon_relic', name: 'Relic Fragments', color: '#a040e0', desc: 'Rare artifacts dropped by bosses. Collect them for ultimate power.' },
        ];

        items.forEach(item => {
            Sprites.draw(ctx, item.sprite, x + 10, y - 4, { scale: 0.75 });
            ctx.font = 'bold 16px Segoe UI';
            ctx.fillStyle = item.color;
            ctx.fillText(item.name, x + 24, y); y += 20;
            ctx.font = '13px Segoe UI';
            ctx.fillStyle = '#a0a0b0';
            ctx.fillText(item.desc, x + 24, y); y += 25;
        });

        y += 15;
        ctx.font = 'bold 16px Segoe UI';
        ctx.fillStyle = '#c8a84e';
        ctx.fillText('Buildings', x, y); y += 22;

        const buildings = [
            { sprite: 'bldg_blacksmith', name: 'Blacksmith', desc: 'Enhance weapons and upgrade armor. Safe to +3, risky after.' },
            { sprite: 'bldg_barracks', name: 'Barracks', desc: 'Recruit new units and reinforce existing squads.' },
            { sprite: 'bldg_tavern', name: 'Tavern', desc: 'Hire mercenaries, gamble, and hear rumors.' },
            { sprite: 'bldg_healer', name: 'Healer', desc: 'Heal wounds and rest to restore HP/Mana.' },
            { sprite: 'bldg_market', name: 'Market', desc: 'Convert resources between gold, iron, and food.' },
        ];

        buildings.forEach(b => {
            Sprites.draw(ctx, b.sprite, x + 20, y - 5, { scale: 0.5 });
            ctx.font = 'bold 14px Segoe UI';
            ctx.fillStyle = '#e0c060';
            ctx.fillText(b.name, x + 32, y); y += 18;
            ctx.font = '12px Segoe UI';
            ctx.fillStyle = '#8a8a9a';
            ctx.fillText(b.desc, x + 32, y); y += 20;
        });
    },

    renderControls(ctx, x, y) {
        const controls = [
            ['WASD / Arrow Keys', 'Move hero in battle'],
            ['Space', 'Basic attack'],
            ['Q', 'Skill 1'],
            ['W', 'Skill 2'],
            ['E', 'Skill 3'],
            ['1', 'Army Order: Hold'],
            ['2', 'Army Order: Push'],
            ['3', 'Army Order: All-Out'],
            ['P / Escape', 'Pause battle'],
            ['Mouse Click', 'Select nodes, buy items, navigate menus'],
        ];

        ctx.font = 'bold 16px Segoe UI';
        ctx.fillStyle = '#c8a84e';
        ctx.fillText('Controls', x, y); y += 25;

        controls.forEach(([key, desc]) => {
            ctx.font = 'bold 14px Segoe UI';
            ctx.fillStyle = '#e0c060';
            ctx.fillText(`[${key}]`, x + 10, y);
            ctx.font = '13px Segoe UI';
            ctx.fillStyle = '#a0a0b0';
            ctx.fillText(desc, x + 200, y);
            y += 22;
        });

        y += 20;
        ctx.font = 'bold 16px Segoe UI';
        ctx.fillStyle = '#c8a84e';
        ctx.fillText('Army Orders', x, y); y += 22;
        ctx.font = '13px Segoe UI';
        ctx.fillStyle = '#a0a0b0';
        ctx.fillText('Hold: Troops advance slowly. Good for defensive play.', x + 10, y); y += 18;
        ctx.fillText('Push: Normal advance speed. Balanced approach.', x + 10, y); y += 18;
        ctx.fillText('All-Out: Troops charge fast with +15% damage but no retreat.', x + 10, y); y += 18;
    }
};
