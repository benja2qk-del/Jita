const CharacterCreationScreen = {
    selectedRace: 'Human',
    selectedClass: 'Warrior',
    playerName: 'Hero',
    kingdomName: 'Valorheim',
    bannerColor: '#c8a84e',
    step: 0, // 0: race, 1: class, 2: details, 3: confirm
    inputActive: null,

    enter() {
        this.selectedRace = 'Human';
        this.selectedClass = 'Warrior';
        this.playerName = 'Hero';
        this.kingdomName = 'Valorheim';
        this.bannerColor = '#c8a84e';
        this.step = 0;
        this.inputActive = null;
        this.setupDOM();
    },

    exit() {
        const ui = document.getElementById('ui-layer');
        ui.innerHTML = '';
    },

    setupDOM() {
        const ui = document.getElementById('ui-layer');
        ui.innerHTML = '';

        // Create a styled form overlay for step 2 (details)
        const form = document.createElement('div');
        form.id = 'cc-form';
        form.style.cssText = 'position:absolute;display:none;pointer-events:auto;z-index:20;';

        // Name field
        const nameLabel = document.createElement('label');
        nameLabel.className = 'cc-label';
        nameLabel.textContent = 'Hero Name';
        const nameInput = document.createElement('input');
        nameInput.type = 'text';
        nameInput.id = 'cc-name';
        nameInput.value = this.playerName;
        nameInput.maxLength = 16;
        nameInput.className = 'cc-input';
        nameInput.addEventListener('input', () => { this.playerName = nameInput.value || 'Hero'; });

        // Kingdom field
        const kingLabel = document.createElement('label');
        kingLabel.className = 'cc-label';
        kingLabel.textContent = 'Kingdom Name';
        const kingdomInput = document.createElement('input');
        kingdomInput.type = 'text';
        kingdomInput.id = 'cc-kingdom';
        kingdomInput.value = this.kingdomName;
        kingdomInput.maxLength = 20;
        kingdomInput.className = 'cc-input';
        kingdomInput.addEventListener('input', () => { this.kingdomName = kingdomInput.value || 'Valorheim'; });

        // Color field
        const colorLabel = document.createElement('label');
        colorLabel.className = 'cc-label';
        colorLabel.textContent = 'Banner Color';
        const colorWrap = document.createElement('div');
        colorWrap.className = 'cc-color-wrap';
        const colorInput = document.createElement('input');
        colorInput.type = 'color';
        colorInput.id = 'cc-color';
        colorInput.value = this.bannerColor;
        colorInput.className = 'cc-color';
        colorInput.addEventListener('input', () => { this.bannerColor = colorInput.value; });
        const colorPreview = document.createElement('span');
        colorPreview.id = 'cc-color-preview';
        colorWrap.appendChild(colorInput);
        colorWrap.appendChild(colorPreview);

        form.appendChild(nameLabel);
        form.appendChild(nameInput);
        form.appendChild(kingLabel);
        form.appendChild(kingdomInput);
        form.appendChild(colorLabel);
        form.appendChild(colorWrap);

        ui.appendChild(form);
    },

    update(dt) {},

    render(ctx) {
        // Background
        ctx.fillStyle = '#08080f';
        ctx.fillRect(0, 0, Renderer.w, Renderer.h);

        // Title
        Utils.drawTextCentered(ctx, 'Create Your Champion', Renderer.cx, 40, 'bold 30px Segoe UI', '#c8a84e');

        // Step indicator
        const steps = ['Race', 'Class', 'Details', 'Confirm'];
        for (let i = 0; i < steps.length; i++) {
            const sx = Renderer.cx - 200 + i * 130;
            const active = i === this.step;
            const done = i < this.step;
            ctx.fillStyle = active ? '#f0d060' : done ? '#60a060' : '#3a3a4a';
            ctx.beginPath();
            ctx.arc(sx, 78, 12, 0, Math.PI * 2);
            ctx.fill();
            Utils.drawTextCentered(ctx, String(i + 1), sx, 78, 'bold 12px Segoe UI', '#0a0a12');
            Utils.drawTextCentered(ctx, steps[i], sx, 100, '13px Segoe UI', active ? '#e0c060' : '#6a6a7a');
        }

        // Show/hide HTML form based on step
        const form = document.getElementById('cc-form');
        if (form) form.style.display = this.step === 2 ? 'block' : 'none';

        if (this.step === 0) this.renderRaceSelect(ctx);
        else if (this.step === 1) this.renderClassSelect(ctx);
        else if (this.step === 2) this.renderDetails(ctx);
        else if (this.step === 3) this.renderConfirm(ctx);

        // Navigation
        const navY = Renderer.h - 60;
        if (this.step > 0) {
            this.drawBtn(ctx, '← Back', 40, navY, 120, 40);
            if (Input.clickedInRect(40, navY, 120, 40)) this.step--;
        } else {
            this.drawBtn(ctx, '← Menu', 40, navY, 120, 40);
            if (Input.clickedInRect(40, navY, 120, 40)) ScreenManager.fadeToScreen('mainMenu');
        }
        if (this.step < 3) {
            this.drawBtn(ctx, 'Next →', Renderer.w - 160, navY, 120, 40);
            if (Input.clickedInRect(Renderer.w - 160, navY, 120, 40)) this.step++;
        }
        if (this.step === 3) {
            this.drawBtn(ctx, 'Begin Conquest', Renderer.w - 220, navY, 180, 40);
            if (Input.clickedInRect(Renderer.w - 220, navY, 180, 40)) {
                this.startGame();
            }
        }
    },

    renderRaceSelect(ctx) {
        const raceKeys = Object.keys(Races);
        const startX = Renderer.cx - (raceKeys.length * 210) / 2;
        const y = 140;

        raceKeys.forEach((key, i) => {
            const race = Races[key];
            const x = startX + i * 210;
            const selected = key === this.selectedRace;
            const hover = Input.isMouseInRect(x, y, 190, 420);
            const border = selected ? '#ffe060' : hover ? '#8a8a9a' : '#3a3a4a';

            Utils.drawPanel(ctx, x, y, 190, 420, border, selected ? '#1a1a2a' : '#101018');

            // Race portrait — render humanoid preview
            const raceAppearances = {
                Human:     { skin: '#e0d0b8', hair: '#5a3820', armor: '#3a5a8a', armorLight: '#5878a8', pants: '#2a3450', boots: '#3a2a1a', weapon: 'sword', shield: true, helmetColor: '#4a6a98', shoulderPad: true, skirtArmor: true, bracers: true },
                Elf:       { skin: '#f0e8d8', hair: '#c0b070', armor: '#2a5a3a', armorLight: '#3a7a48', pants: '#1a3a20', boots: '#2a3a18', weapon: 'longbow', shield: false, helmetColor: null, earPointy: true, slender: true, longHair: true, quiver: true, capeColor: '#1a4a20' },
                Dragonkin: { skin: '#c08a60', hair: '#1a0808', armor: '#5a2818', armorLight: '#7a3828', pants: '#2a1810', boots: '#1a0808', weapon: 'axe', shield: false, helmetColor: '#5a2020', horns: true, hornColor: '#5a4a30', scales: true, scaleColor: 'rgba(200,80,40,0.25)', glowEyes: true, eyeColor: '#cc4400', shoulderPad: true, spikePads: true, tail: true }
            };
            const raceApp = raceAppearances[key] || raceAppearances.Human;
            ctx.save();
            ctx.beginPath(); ctx.rect(x + 5, y + 5, 180, 90); ctx.clip();
            BattleScreen._drawHumanoid(ctx, x + 95, y + 82, 3.8, 1, 0, 'idle', raceApp, false, 0, {});
            ctx.restore();

            // Name
            Utils.drawTextCentered(ctx, race.name, x + 95, y + 95, 'bold 18px Segoe UI', race.color);

            // Description (wrap)
            ctx.font = '12px Segoe UI';
            ctx.fillStyle = '#a0a0b0';
            ctx.textAlign = 'left';
            this.wrapText(ctx, race.description, x + 12, y + 120, 166, 16);

            // Flavor
            ctx.font = 'italic 11px Segoe UI';
            ctx.fillStyle = '#6a6a7a';
            this.wrapText(ctx, `"${race.flavor}"`, x + 12, y + 210, 166, 14);

            // Passives
            ctx.font = '12px Segoe UI';
            ctx.fillStyle = '#80c080';
            let py = y + 280;
            race.passives.forEach(p => {
                ctx.fillStyle = '#60a060';
                ctx.fillText('• ' + p.name, x + 12, py);
                py += 14;
                ctx.fillStyle = '#7a7a8a';
                ctx.font = '11px Segoe UI';
                ctx.fillText('  ' + p.desc, x + 12, py);
                py += 16;
                ctx.font = '12px Segoe UI';
            });

            // Stat bonuses
            py += 6;
            ctx.fillStyle = '#8a8a9a';
            ctx.font = '11px Segoe UI';
            Object.entries(race.statBonuses).forEach(([stat, val]) => {
                if (val !== 0) {
                    const sign = val > 0 ? '+' : '';
                    ctx.fillStyle = val > 0 ? '#60c060' : '#c06060';
                    ctx.fillText(`${stat}: ${sign}${val}`, x + 12, py);
                    py += 14;
                }
            });

            if ((hover || selected) && Input.mouse.clicked) {
                this.selectedRace = key;
            }
        });
    },

    renderClassSelect(ctx) {
        const classKeys = Object.keys(Classes);
        const cols = Math.min(classKeys.length, 5);
        const cardW = 152, cardH = 280, gapX = 8, gapY = 8;
        const rows = Math.ceil(classKeys.length / cols);
        const totalW = cols * cardW + (cols - 1) * gapX;
        const startX = Renderer.cx - totalW / 2;
        const baseY = 110;

        classKeys.forEach((key, i) => {
            const cls = Classes[key];
            const col = i % cols;
            const row = Math.floor(i / cols);
            const x = startX + col * (cardW + gapX);
            const y = baseY + row * (cardH + gapY);
            const selected = key === this.selectedClass;
            const hover = Input.isMouseInRect(x, y, cardW, cardH);
            const border = selected ? '#ffe060' : hover ? '#8a8a9a' : '#3a3a4a';

            Utils.drawPanel(ctx, x, y, cardW, cardH, border, selected ? '#1a1a2a' : '#101018');

            // Class icon — render humanoid preview
            const classHeroApps = BattleScreen._heroAppearance;
            const classApp = classHeroApps[key] || classHeroApps.Warrior;
            const classPreviewApp = {
                skin: '#e0d0b8', hair: '#3a2010',
                armor: classApp.armor, armorLight: classApp.armorLight,
                pants: '#2a2a3a', boots: '#3a2a18',
                weapon: classApp.weapon, shield: classApp.shield,
                helmetColor: classApp.helmetColor, shoulderPad: classApp.shoulderPad,
                mask: classApp.mask, hat: classApp.hat, heavy: classApp.heavy,
                robe: classApp.robe, scarf: classApp.scarf, quiver: classApp.quiver,
                skirtArmor: classApp.skirtArmor, hood: classApp.hood,
                bracers: classApp.bracers, gauntlets: classApp.gauntlets,
                plume: classApp.plume, plumeColor: classApp.plumeColor
            };
            ctx.save();
            ctx.beginPath(); ctx.rect(x + 5, y + 5, cardW - 10, 64); ctx.clip();
            BattleScreen._drawHumanoid(ctx, x + cardW / 2, y + 64, 2.5, 1, 0, 'idle', classPreviewApp, false, 0, { capeColor: classApp.capeColor });
            ctx.restore();

            Utils.drawTextCentered(ctx, cls.name, x + cardW / 2, y + 68, 'bold 14px Segoe UI', cls.color);

            ctx.font = '10px Segoe UI';
            ctx.fillStyle = '#a0a0b0';
            ctx.textAlign = 'left';
            this.wrapText(ctx, cls.description, x + 8, y + 82, cardW - 16, 12);

            // Skills (compact)
            let sy = y + 150;
            ctx.font = 'bold 10px Segoe UI';
            ctx.fillStyle = '#c8a84e';
            ctx.fillText('Skills:', x + 8, sy);
            sy += 14;

            cls.skills.forEach(skill => {
                ctx.font = '10px Segoe UI';
                ctx.fillStyle = '#e0c060';
                const skillKey = 'skill_' + skill.id;
                if (Sprites.get(skillKey)) {
                    Sprites.draw(ctx, skillKey, x + 22, sy - 2, { scale: 0.35 });
                }
                ctx.fillText(`[${skill.keyLabel}] ${skill.name}`, x + 34, sy);
                sy += 12;
                ctx.fillStyle = '#7a7a8a';
                ctx.font = '9px Segoe UI';
                const maxChars = Math.floor((cardW - 24) / 4.5);
                const truncDesc = skill.desc.length > maxChars ? skill.desc.slice(0, maxChars - 3) + '...' : skill.desc;
                ctx.fillText(truncDesc, x + 14, sy);
                sy += 14;
            });

            if ((hover || selected) && Input.mouse.clicked) {
                this.selectedClass = key;
            }
        });
    },

    renderDetails(ctx) {
        const panelX = Renderer.cx - 200;
        const panelY = 150;
        Utils.drawPanel(ctx, panelX, panelY, 400, 340, '#c8a84e', '#14141f');

        Utils.drawTextCentered(ctx, 'Your Identity', Renderer.cx, panelY + 30, 'bold 22px Segoe UI', '#c8a84e');

        // Position the HTML form overlay
        const form = document.getElementById('cc-form');
        if (form) {
            const rect = Renderer.canvas.getBoundingClientRect();
            const sx = rect.width / Renderer.w;
            const sy = rect.height / Renderer.h;

            form.style.left = ((panelX + 30) * sx + rect.left) + 'px';
            form.style.top = ((panelY + 50) * sy + rect.top) + 'px';
            form.style.width = (340 * sx) + 'px';

            // Update color preview
            const preview = document.getElementById('cc-color-preview');
            if (preview) {
                preview.style.backgroundColor = this.bannerColor;
            }
        }

        // Preview at bottom of panel — full humanoid hero preview
        const fy = panelY + 225;
        Utils.drawTextCentered(ctx, `${this.playerName} of ${this.kingdomName}`, Renderer.cx, fy - 10, 'bold 18px Segoe UI', this.bannerColor);
        Utils.drawTextCentered(ctx, `${this.selectedRace} ${this.selectedClass}`, Renderer.cx, fy + 10, '13px Segoe UI', '#a0a0b0');

        // Draw hero humanoid preview
        const classApp = BattleScreen._heroAppearance[this.selectedClass] || BattleScreen._heroAppearance.Warrior;
        const raceSkin = { Human: '#e0d0b8', Elf: '#f0e8d8', Dragonkin: '#c08a60' };
        const raceHair = { Human: '#3a2010', Elf: '#c0b070', Dragonkin: '#1a0808' };
        const raceEyes = { Human: '#2a4a1a', Elf: '#30a060', Dragonkin: '#cc4400' };
        const p = this.selectedRace;
        const previewApp = {
            skin: raceSkin[p] || '#e0d0b8', hair: raceHair[p] || '#3a2010',
            armor: classApp.armor, armorLight: classApp.armorLight,
            pants: '#2a2a3a', boots: '#3a2a18',
            weapon: classApp.weapon, shield: classApp.shield,
            helmetColor: classApp.helmetColor, shoulderPad: classApp.shoulderPad,
            mask: classApp.mask, hat: classApp.hat, heavy: classApp.heavy,
            robe: classApp.robe, scarf: classApp.scarf, quiver: classApp.quiver,
            skirtArmor: classApp.skirtArmor, hood: classApp.hood,
            bracers: classApp.bracers, gauntlets: classApp.gauntlets,
            plume: classApp.plume, plumeColor: classApp.plumeColor,
            earPointy: p === 'Elf', slender: p === 'Elf', longHair: p === 'Elf',
            horns: p === 'Dragonkin', hornColor: '#5a4a30',
            scales: p === 'Dragonkin', scaleColor: 'rgba(200,80,40,0.25)',
            tail: p === 'Dragonkin', glowEyes: p === 'Dragonkin',
            spikePads: p === 'Dragonkin' && classApp.shoulderPad,
            eyeColor: raceEyes[p]
        };
        ctx.save();
        ctx.beginPath(); ctx.rect(Renderer.cx - 50, fy + 15, 100, 110); ctx.clip();
        BattleScreen._drawHumanoid(ctx, Renderer.cx, fy + 100, 4.5, 1, 0, 'idle', previewApp, false, 0, { capeColor: this.bannerColor });
        ctx.restore();
    },

    renderConfirm(ctx) {
        const race = Races[this.selectedRace];
        const cls = Classes[this.selectedClass];
        const panelX = Renderer.cx - 300;
        const panelY = 110;

        Utils.drawPanel(ctx, panelX, panelY, 600, 480, '#c8a84e', '#14141f');
        Utils.drawTextCentered(ctx, 'Confirm Your Champion', Renderer.cx, panelY + 30, 'bold 22px Segoe UI', '#c8a84e');

        // Hero humanoid preview on the right side
        const previewX = panelX + 480;
        const previewY = panelY + 280;
        const classApp = BattleScreen._heroAppearance[this.selectedClass] || BattleScreen._heroAppearance.Warrior;
        const raceSkin = { Human: '#e0d0b8', Elf: '#f0e8d8', Dragonkin: '#c08a60' };
        const raceHair = { Human: '#3a2010', Elf: '#c0b070', Dragonkin: '#1a0808' };
        const raceEyes = { Human: '#2a4a1a', Elf: '#30a060', Dragonkin: '#cc4400' };
        const p = this.selectedRace;
        const confirmApp = {
            skin: raceSkin[p] || '#e0d0b8', hair: raceHair[p] || '#3a2010',
            armor: classApp.armor, armorLight: classApp.armorLight,
            pants: '#2a2a3a', boots: '#3a2a18',
            weapon: classApp.weapon, shield: classApp.shield,
            helmetColor: classApp.helmetColor, shoulderPad: classApp.shoulderPad,
            mask: classApp.mask, hat: classApp.hat, heavy: classApp.heavy,
            robe: classApp.robe, scarf: classApp.scarf, quiver: classApp.quiver,
            skirtArmor: classApp.skirtArmor, hood: classApp.hood,
            bracers: classApp.bracers, gauntlets: classApp.gauntlets,
            plume: classApp.plume, plumeColor: classApp.plumeColor,
            earPointy: p === 'Elf', slender: p === 'Elf', longHair: p === 'Elf',
            horns: p === 'Dragonkin', hornColor: '#5a4a30',
            scales: p === 'Dragonkin', scaleColor: 'rgba(200,80,40,0.25)',
            tail: p === 'Dragonkin', glowEyes: p === 'Dragonkin',
            spikePads: p === 'Dragonkin' && classApp.shoulderPad,
            eyeColor: raceEyes[p]
        };
        // Glow ring behind preview
        ctx.shadowColor = this.bannerColor;
        ctx.shadowBlur = 16;
        ctx.fillStyle = 'rgba(0,0,0,0)';
        ctx.beginPath(); ctx.arc(previewX, previewY, 1, 0, Math.PI * 2); ctx.fill();
        ctx.shadowBlur = 0;
        ctx.save();
        ctx.beginPath(); ctx.rect(previewX - 70, panelY + 50, 140, 300); ctx.clip();
        BattleScreen._drawHumanoid(ctx, previewX, previewY, 6.5, 1, 0, 'idle', confirmApp, false, 0, { capeColor: this.bannerColor });
        ctx.restore();

        let y = panelY + 65;
        const lx = panelX + 40;
        ctx.textAlign = 'left';

        // Hero summary
        ctx.font = 'bold 18px Segoe UI';
        ctx.fillStyle = this.bannerColor;
        ctx.fillText(`${this.playerName} — ${this.selectedRace} ${this.selectedClass}`, lx, y);
        y += 22;
        ctx.font = '14px Segoe UI';
        ctx.fillStyle = '#8a8a9a';
        ctx.fillText(`Kingdom: ${this.kingdomName}`, lx, y);
        y += 30;

        // Stats preview
        ctx.font = 'bold 14px Segoe UI';
        ctx.fillStyle = '#c8a84e';
        ctx.fillText('Starting Stats:', lx, y);
        y += 20;

        const baseStats = { power: 10, vitality: 10, command: 10, agility: 10, focus: 10, resolve: 10 };
        Object.entries(race.statBonuses).forEach(([k, v]) => baseStats[k] += v);
        Object.entries(cls.statBonuses).forEach(([k, v]) => baseStats[k] += v);

        ctx.font = '13px Segoe UI';
        const statNames = ['power', 'vitality', 'command', 'agility', 'focus', 'resolve'];
        statNames.forEach((stat, i) => {
            const col = i < 3 ? lx : lx + 200;
            const row = y + (i % 3) * 22;
            ctx.fillStyle = '#a0a0b0';
            ctx.fillText(`${stat.charAt(0).toUpperCase() + stat.slice(1)}:`, col, row);
            ctx.fillStyle = '#e0c060';
            ctx.fillText(String(baseStats[stat]), col + 80, row);
        });

        y += 80;

        // Skills
        ctx.font = 'bold 14px Segoe UI';
        ctx.fillStyle = '#c8a84e';
        ctx.fillText('Skills:', lx, y);
        y += 20;

        cls.skills.forEach(skill => {
            ctx.font = '13px Segoe UI';
            ctx.fillStyle = '#e0c060';
            const skKey = 'skill_' + skill.id;
            if (Sprites.get(skKey)) {
                Sprites.draw(ctx, skKey, lx + 8, y - 5, { scale: 0.5 });
            }
            ctx.fillText(`[${skill.keyLabel}] ${skill.name} — `, lx + 20, y);
            const textW = ctx.measureText(`[${skill.keyLabel}] ${skill.name} — `).width + 20;
            ctx.fillStyle = '#8a8a9a';
            ctx.fillText(skill.desc.substring(0, 50) + (skill.desc.length > 50 ? '...' : ''), lx + textW, y);
            y += 20;
        });

        y += 15;

        // Race passives
        ctx.font = 'bold 14px Segoe UI';
        ctx.fillStyle = race.color;
        ctx.fillText(`${race.name} Passives:`, lx, y);
        y += 20;
        race.passives.forEach(p => {
            ctx.font = '13px Segoe UI';
            ctx.fillStyle = '#60a060';
            ctx.fillText(`• ${p.name}: ${p.desc}`, lx, y);
            y += 18;
        });

        y += 15;

        // Starter army
        ctx.font = 'bold 14px Segoe UI';
        ctx.fillStyle = '#c8a84e';
        ctx.fillText('Starting Army:', lx, y);
        y += 20;
        race.starterArmy.forEach(entry => {
            const template = Units.allied[entry.type];
            ctx.font = '13px Segoe UI';
            ctx.fillStyle = template ? template.color : '#a0a0b0';
            ctx.fillText(`• ${template ? template.name : entry.type} ×${entry.count}`, lx, y);
            y += 18;
        });
    },

    drawBtn(ctx, text, x, y, w, h) {
        const hover = Input.isMouseInRect(x, y, w, h);
        Utils.drawPanel(ctx, x, y, w, h, hover ? '#e0c060' : '#c8a84e', hover ? '#2a2a4a' : '#1a1a2a');
        Utils.drawTextCentered(ctx, text, x + w / 2, y + h / 2, 'bold 15px Segoe UI', hover ? '#ffe080' : '#f0d060');
    },

    wrapText(ctx, text, x, y, maxW, lineH) {
        const words = text.split(' ');
        let line = '';
        let cy = y;
        words.forEach(word => {
            const test = line + word + ' ';
            if (ctx.measureText(test).width > maxW && line) {
                ctx.fillText(line, x, cy);
                cy += lineH;
                line = word + ' ';
            } else {
                line = test;
            }
        });
        if (line) ctx.fillText(line, x, cy);
    },

    startGame() {
        GameState.init();
        GameState.newPlayer(
            this.playerName || 'Hero',
            this.selectedRace,
            this.selectedClass,
            this.bannerColor,
            this.kingdomName || 'Valorheim'
        );
        CampaignSystem.initCampaign();
        SaveSystem.save();
        this.exit();
        ScreenManager.fadeToScreen('campaignMap');
    }
};
