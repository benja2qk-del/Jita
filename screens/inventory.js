const InventoryScreen = {
    tab: 'equipment',
    selectedSlot: -1,
    scrollOffset: 0,

    enter() {
        this.tab = 'equipment';
        this.selectedSlot = -1;
        this.scrollOffset = 0;
    },

    exit() {},
    update(dt) {},

    render(ctx) {
        const p = GameState.player;
        ctx.fillStyle = '#0a0a12';
        ctx.fillRect(0, 0, Renderer.w, Renderer.h);

        Utils.drawTextCentered(ctx, 'Inventory & Army', Renderer.cx, 36, 'bold 28px Segoe UI', '#c8a84e');

        // Tabs
        const tabs = ['equipment', 'army'];
        const tabW = 140, tabH = 30;
        const tabsX = Renderer.cx - (tabs.length * (tabW + 8)) / 2;
        tabs.forEach((t, i) => {
            const tx = tabsX + i * (tabW + 8);
            const selected = this.tab === t;
            const hover = Input.isMouseInRect(tx, 55, tabW, tabH);
            Utils.drawPanel(ctx, tx, 55, tabW, tabH, selected ? '#e0c060' : hover ? '#8a8a9a' : '#3a3a4a', selected ? '#2a2a3a' : '#12121a');
            const label = t === 'equipment' ? 'Equipment' : 'Army';
            Utils.drawTextCentered(ctx, label, tx + tabW / 2, 70, '13px Segoe UI', selected ? '#e0c060' : '#8a8a9a');
            if (Input.clickedInRect(tx, 55, tabW, tabH)) { this.tab = t; this.selectedSlot = -1; }
        });

        if (this.tab === 'equipment') this.renderEquipment(ctx, p);
        else this.renderArmy(ctx, p);

        // Back button
        const bx = 30, by = Renderer.h - 55;
        Utils.drawPanel(ctx, bx, by, 120, 36, '#c8a84e', '#1a1a2a');
        Utils.drawTextCentered(ctx, '← Back', bx + 60, by + 18, 'bold 13px Segoe UI', '#f0d060');
        if (Input.clickedInRect(bx, by, 120, 36)) {
            ScreenManager.fadeToScreen('campaignMap');
        }
    },

    renderEquipment(ctx, p) {
        const lx = 40, ly = 105;

        // Current weapon
        ctx.textAlign = 'left';
        ctx.font = 'bold 14px Segoe UI';
        ctx.fillStyle = '#c8a84e';
        ctx.fillText('Equipped Weapon', lx, ly);

        if (p.weapon) {
            const wy = ly + 10;
            Utils.drawPanel(ctx, lx, wy, 350, 60, Weapons.rarityColors[p.weapon.rarity] || '#3a3a4a', '#14141f');
            ctx.font = 'bold 13px Segoe UI';
            ctx.fillStyle = Weapons.rarityColors[p.weapon.rarity] || '#a0a0a0';
            Sprites.draw(ctx, 'icon_sword', lx + 8, wy + 10, { scale: 1.0 });
            ctx.fillText(`${p.weapon.name} +${p.weapon.enhanceLevel}`, lx + 30, wy + 22);
            ctx.font = '11px Segoe UI';
            ctx.fillStyle = '#a0a0b0';
            ctx.fillText(`DMG: ${Weapons.getWeaponDamage(p.weapon)}  |  Type: ${p.weapon.type}  |  ${p.weapon.rarity}`, lx + 30, wy + 40);
            const bonuses = Object.entries(p.weapon.bonus || {}).filter(([, v]) => v).map(([k, v]) => `+${v} ${k}`).join(', ');
            if (bonuses) {
                ctx.fillStyle = '#80c060';
                ctx.fillText(bonuses, lx + 30, wy + 54);
            }
        }

        // Armor
        const ay = ly + 80;
        ctx.font = 'bold 14px Segoe UI';
        ctx.fillStyle = '#c8a84e';
        ctx.fillText('Armor', lx, ay);
        if (p.armor) {
            Utils.drawPanel(ctx, lx, ay + 10, 350, 40, '#3a3a4a', '#14141f');
            ctx.font = 'bold 13px Segoe UI';
            ctx.fillStyle = '#a0a0b0';
            ctx.fillText(`${p.armor.name} +${p.armor.enhanceLevel}  (DEF: ${p.armor.defense})`, lx + 15, ay + 35);
        }

        // Inventory list
        const iy = ay + 70;
        ctx.font = 'bold 14px Segoe UI';
        ctx.fillStyle = '#c8a84e';
        ctx.fillText(`Inventory (${p.inventory.length} items)`, lx, iy);

        if (p.inventory.length === 0) {
            ctx.font = '12px Segoe UI';
            ctx.fillStyle = '#5a5a6a';
            ctx.fillText('No items in inventory. Weapons found in battle will appear here.', lx + 10, iy + 25);
        }

        const itemH = 50;
        const maxVisible = 7;
        const listY = iy + 10;
        const visibleItems = p.inventory.slice(this.scrollOffset, this.scrollOffset + maxVisible);

        visibleItems.forEach((item, i) => {
            const idx = i + this.scrollOffset;
            const y = listY + i * (itemH + 4);
            const selected = this.selectedSlot === idx;
            const hover = Input.isMouseInRect(lx, y, 350, itemH);
            const borderColor = selected ? '#e0c060' : hover ? '#6a6a7a' : '#3a3a4a';

            Utils.drawPanel(ctx, lx, y, 350, itemH, borderColor, selected ? '#1e1e2e' : '#12121a');
            ctx.font = 'bold 12px Segoe UI';
            ctx.fillStyle = Weapons.rarityColors[item.rarity] || '#a0a0a0';
            Sprites.draw(ctx, 'icon_sword', lx + 8, y + 8, { scale: 0.8 });
            ctx.fillText(`${item.name}`, lx + 26, y + 18);
            ctx.font = '10px Segoe UI';
            ctx.fillStyle = '#8a8a9a';
            ctx.fillText(`DMG: ${Weapons.getWeaponDamage(item)}  |  ${item.type}  |  ${item.rarity}`, lx + 26, y + 32);
            const bonuses = Object.entries(item.bonus || {}).filter(([, v]) => v).map(([k, v]) => `+${v} ${k}`).join(', ');
            if (bonuses) {
                ctx.fillStyle = '#80c060';
                ctx.fillText(bonuses, lx + 26, y + 44);
            }

            if (Input.clickedInRect(lx, y, 350, itemH)) {
                this.selectedSlot = idx;
            }
        });

        // Scroll indicators
        if (this.scrollOffset > 0) {
            ctx.fillStyle = '#c8a84e';
            ctx.font = '12px Segoe UI';
            ctx.fillText('▲ Scroll up', lx + 360, listY + 10);
            if (Input.clickedInRect(lx + 355, listY - 5, 80, 20)) this.scrollOffset--;
        }
        if (this.scrollOffset + maxVisible < p.inventory.length) {
            const bottomY = listY + maxVisible * (itemH + 4);
            ctx.fillStyle = '#c8a84e';
            ctx.font = '12px Segoe UI';
            ctx.fillText('▼ Scroll down', lx + 360, bottomY);
            if (Input.clickedInRect(lx + 355, bottomY - 15, 80, 20)) this.scrollOffset++;
        }

        // Action buttons (right side)
        if (this.selectedSlot >= 0 && this.selectedSlot < p.inventory.length) {
            const item = p.inventory[this.selectedSlot];
            const bx = 440, by = iy + 10;

            // Selected item detail
            Utils.drawPanel(ctx, bx, by, 280, 130, Weapons.rarityColors[item.rarity] || '#3a3a4a', '#14141f');
            ctx.font = 'bold 15px Segoe UI';
            ctx.fillStyle = Weapons.rarityColors[item.rarity] || '#a0a0a0';
            ctx.fillText(item.name, bx + 15, by + 25);
            ctx.font = '12px Segoe UI';
            ctx.fillStyle = '#a0a0b0';
            ctx.fillText(`Damage: ${Weapons.getWeaponDamage(item)}`, bx + 15, by + 45);
            ctx.fillText(`Type: ${item.type}  |  Rarity: ${item.rarity}`, bx + 15, by + 62);
            const bonuses = Object.entries(item.bonus || {}).filter(([, v]) => v).map(([k, v]) => `+${v} ${k}`).join(', ');
            if (bonuses) { ctx.fillStyle = '#80c060'; ctx.fillText(bonuses, bx + 15, by + 79); }
            if (item.desc) { ctx.fillStyle = '#6a6a7a'; ctx.font = '10px Segoe UI'; ctx.fillText(item.desc, bx + 15, by + 96); }

            // Class restriction check
            const canUse = Weapons.canClassUse(p.class, item.type);

            // Equip button
            const eby = by + 140;
            if (canUse) {
                Utils.drawPanel(ctx, bx, eby, 130, 34, '#c8a84e', '#1a1a2a');
                Utils.drawTextCentered(ctx, 'Equip', bx + 65, eby + 18, 'bold 13px Segoe UI', '#f0d060');
                if (Input.clickedInRect(bx, eby, 130, 34)) {
                    const old = p.weapon;
                    p.weapon = item;
                    p.inventory.splice(this.selectedSlot, 1);
                    if (old) p.inventory.push(old);
                    this.selectedSlot = -1;
                    GameState.recalcDerived();
                    SaveSystem.save();
                }
            } else {
                Utils.drawPanel(ctx, bx, eby, 130, 34, '#504040', '#1a1a1a');
                Utils.drawTextCentered(ctx, 'Wrong Class', bx + 65, eby + 18, 'bold 13px Segoe UI', '#804040');
            }

            // Discard button
            const dby = eby;
            Utils.drawPanel(ctx, bx + 140, dby, 130, 34, '#803030', '#1a1a2a');
            Utils.drawTextCentered(ctx, 'Discard', bx + 205, dby + 18, 'bold 13px Segoe UI', '#e06060');
            if (Input.clickedInRect(bx + 140, dby, 130, 34)) {
                p.inventory.splice(this.selectedSlot, 1);
                this.selectedSlot = -1;
                SaveSystem.save();
            }
        }
    },

    renderArmy(ctx, p) {
        const lx = 40, ly = 105;

        ctx.textAlign = 'left';
        ctx.font = 'bold 14px Segoe UI';
        ctx.fillStyle = '#c8a84e';
        ctx.fillText('Army Composition', lx, ly);

        let y = ly + 20;

        // Morale bar
        ctx.font = '12px Segoe UI';
        ctx.fillStyle = '#a0a0b0';
        ctx.fillText('Morale:', lx, y);
        const moraleColor = p.army.morale > 60 ? '#40c060' : p.army.morale > 30 ? '#c0a030' : '#c04040';
        Utils.drawBar(ctx, lx + 55, y - 8, 200, 14, p.army.morale / 100, moraleColor);
        ctx.fillText(`${p.army.morale}%`, lx + 265, y);
        y += 30;

        // Total strength
        let totalCount = 0;
        p.army.slots.forEach(slot => totalCount += slot.count);
        ctx.font = 'bold 13px Segoe UI';
        ctx.fillStyle = '#a0a0b0';
        ctx.fillText(`Total Soldiers: ${totalCount}`, lx, y);
        y += 28;

        // Unit slots
        p.army.slots.forEach((slot, i) => {
            const template = Units.allied[slot.type];
            const cardW = 500, cardH = 70;
            const hover = Input.isMouseInRect(lx, y, cardW, cardH);

            Utils.drawPanel(ctx, lx, y, cardW, cardH, hover ? '#5a5a6a' : '#3a3a4a', '#12121a');

            // Unit sprite
            const spriteKey = 'unit_' + slot.type;
            if (Sprites.get(spriteKey)) {
                Sprites.draw(ctx, spriteKey, lx + 25, y + 35, { scale: 1.2 });
            }

            // Unit info
            ctx.font = 'bold 13px Segoe UI';
            ctx.fillStyle = template ? template.color : '#a0a0b0';
            ctx.fillText(`${slot.name}`, lx + 50, y + 20);

            ctx.font = '11px Segoe UI';
            ctx.fillStyle = '#e0d8c0';
            ctx.fillText(`Count: ${slot.count}`, lx + 50, y + 36);

            if (template) {
                ctx.fillStyle = '#8a8a9a';
                ctx.fillText(`ATK: ${template.attack}  DEF: ${template.defense}  HP: ${template.hp}  SPD: ${template.speed}`, lx + 50, y + 52);
                ctx.fillText(`Role: ${template.role || 'melee'}   Range: ${template.attackRange || 40}`, lx + 280, y + 52);
            }

            y += cardH + 6;
        });

        // Battle orders explanation
        y += 10;
        ctx.font = 'bold 13px Segoe UI';
        ctx.fillStyle = '#c8a84e';
        ctx.fillText('Battle Orders (during combat)', lx, y);
        y += 20;
        ctx.font = '11px Segoe UI';
        ctx.fillStyle = '#8a8a9a';
        const orders = [
            ['1 - Push', 'Units advance and engage normally.'],
            ['2 - Hold', 'Units hold position, reduced movement.'],
            ['3 - All Out', 'Units move fast and deal bonus damage but take more risks.']
        ];
        orders.forEach(([key, desc]) => {
            ctx.fillStyle = '#e0c060';
            ctx.fillText(key, lx + 10, y);
            ctx.fillStyle = '#8a8a9a';
            ctx.fillText(desc, lx + 90, y);
            y += 16;
        });

        // Hero stats summary (right side)
        const rx = 600, ry = ly + 20;
        Utils.drawPanel(ctx, rx, ry, 220, 280, '#3a3a4a', '#12121a');
        ctx.font = 'bold 14px Segoe UI';
        ctx.fillStyle = '#c8a84e';
        ctx.fillText('Hero Stats', rx + 15, ry + 25);

        let sy = ry + 45;
        ctx.font = '12px Segoe UI';
        const statLabels = { power: 'Power', vitality: 'Vitality', command: 'Command', agility: 'Agility', focus: 'Focus', resolve: 'Resolve' };
        Object.entries(p.stats).forEach(([stat, val]) => {
            ctx.fillStyle = '#8a8a9a';
            ctx.fillText(`${statLabels[stat] || stat}:`, rx + 15, sy);
            ctx.fillStyle = '#e0d8c0';
            ctx.fillText(String(val), rx + 100, sy);
            sy += 18;
        });

        sy += 10;
        ctx.fillStyle = '#8a8a9a';
        ctx.fillText(`HP: ${p.hp}/${p.maxHp}`, rx + 15, sy); sy += 16;
        ctx.fillText(`Mana: ${p.mana}/${p.maxMana}`, rx + 15, sy); sy += 16;
        ctx.fillText(`Level: ${p.level}`, rx + 15, sy); sy += 16;
        ctx.fillText(`Wounds: ${p.wounds}`, rx + 15, sy);
    }
};
