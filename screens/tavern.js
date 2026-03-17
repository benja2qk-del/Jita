const TavernScreen = {
    node: null,
    offers: [],
    rumor: '',
    message: '',
    messageColor: '#a0a0b0',
    messageTimer: 0,

    enter(params) {
        this.node = params.node;
        this.message = '';
        this.messageTimer = 0;
        this.generateOffers();
        this.rumor = this.generateRumor();
    },

    generateOffers() {
        this.offers = [];
        // Mercenary offer
        const unitType = Utils.pick(Object.keys(Units.allied));
        const template = Units.allied[unitType];
        const count = Utils.randInt(2, 5);
        const cost = Math.floor((template.recruitCost.gold + template.recruitCost.iron) * count * 1.3);
        this.offers.push({
            type: 'mercenary',
            unitType,
            name: `${template.name} Mercenaries ×${count}`,
            desc: `Hire ${count} experienced ${template.name}(s) right now.`,
            cost,
            count,
            bought: false
        });

        // Random small event
        if (Utils.chance(60)) {
            this.offers.push({
                type: 'gamble',
                name: 'Gambler\'s Challenge',
                desc: 'Bet 20 gold. Win double or lose it all.',
                cost: 20,
                bought: false
            });
        }

        // Intel
        this.offers.push({
            type: 'intel',
            name: 'Tactical Intel',
            desc: 'Gain +5 morale from local intelligence.',
            cost: 15,
            bought: false
        });
    },

    generateRumor() {
        const rumors = [
            'They say the Warlord hoards relic fragments in his throne room...',
            'The mountain pass is crawling with trolls. Bring fire.',
            'An old sword was seen in the hands of a goblin chieftain. Might be worth taking.',
            'Some say Dragonkin fire can melt even enchanted shields.',
            'The elves once had a city here. Now only ruins and regret remain.',
            'A merchant was robbed on the old road. His goods might still be there.',
            'The blacksmith in Ironpass is said to be the best this side of the mountains.'
        ];
        return Utils.pick(rumors);
    },

    update(dt) {
        if (this.messageTimer > 0) this.messageTimer -= dt;
    },

    render(ctx) {
        const p = GameState.player;
        ctx.fillStyle = '#0a0a12';
        ctx.fillRect(0, 0, Renderer.w, Renderer.h);

        Sprites.draw(ctx, 'bldg_tavern', Renderer.cx - 90, 36, { scale: 0.9 });
        Utils.drawTextCentered(ctx, 'Tavern', Renderer.cx, 40, 'bold 28px Segoe UI', '#c8a84e');
        Utils.drawTextCentered(ctx, this.node ? this.node.name : 'The Wayfarer\'s Rest', Renderer.cx, 66, '14px Segoe UI', '#6a6a7a');

        ctx.textAlign = 'left';
        ctx.font = '14px Segoe UI';
        Sprites.draw(ctx, 'icon_gold', 30, 38, { scale: 0.85 });
        ctx.fillStyle = '#e0c040';
        ctx.fillText(`${p.gold}`, 46, 40);

        // Rumor panel
        const rpx = 60, rpy = 100, rpw = Renderer.w - 120, rph = 60;
        Utils.drawPanel(ctx, rpx, rpy, rpw, rph, '#6a5a3a', '#1a1812');
        ctx.font = 'italic 14px Segoe UI';
        ctx.fillStyle = '#c0a860';
        ctx.textAlign = 'left';
        ctx.fillText(`🗣 "${this.rumor}"`, rpx + 15, rpy + 35);

        // Offers
        let oy = 190;
        this.offers.forEach((offer, i) => {
            const pw = 500, ph = 80;
            const ox = Renderer.cx - pw / 2;
            const bought = offer.bought;
            const canAfford = p.gold >= offer.cost;

            Utils.drawPanel(ctx, ox, oy, pw, ph, bought ? '#2a3a2a' : '#c8a84e', '#14141f');

            ctx.textAlign = 'left';
            ctx.font = 'bold 15px Segoe UI';
            ctx.fillStyle = bought ? '#4a5a4a' : '#e0c060';
            ctx.fillText(offer.name, ox + 15, oy + 24);

            ctx.font = '12px Segoe UI';
            ctx.fillStyle = bought ? '#3a4a3a' : '#a0a0b0';
            ctx.fillText(offer.desc, ox + 15, oy + 44);

            if (!bought) {
                ctx.fillStyle = canAfford ? '#e0c040' : '#c04040';
                let tc = ox + 15;
                tc += ctx.measureText('Cost: ').width; ctx.fillText('Cost: ', ox + 15, oy + 64);
                Sprites.iconText(ctx, 'icon_gold', offer.cost, tc, oy + 64);

                const bbx = ox + pw - 110, bby = oy + 15;
                Utils.drawPanel(ctx, bbx, bby, 90, 34, canAfford ? '#c8a84e' : '#3a3a4a', '#1a1a2a');
                Utils.drawTextCentered(ctx, 'Buy', bbx + 45, bby + 17, 'bold 13px Segoe UI', canAfford ? '#f0d060' : '#4a4a5a');

                if (canAfford && Input.clickedInRect(bbx, bby, 90, 34)) {
                    this.buyOffer(offer, i);
                }
            } else {
                ctx.fillStyle = '#40a040';
                ctx.fillText('✓ Purchased', ox + 15, oy + 64);
            }

            oy += ph + 10;
        });

        // Message
        if (this.messageTimer > 0) {
            Utils.drawPanel(ctx, Renderer.cx - 200, Renderer.h - 120, 400, 40, this.messageColor, '#14141f');
            Utils.drawTextCentered(ctx, this.message, Renderer.cx, Renderer.h - 100, 'bold 14px Segoe UI', this.messageColor);
        }

        // Leave
        const bx = Renderer.cx - 80, by = Renderer.h - 60;
        Utils.drawPanel(ctx, bx, by, 160, 36, '#c8a84e', '#1a1a2a');
        Utils.drawTextCentered(ctx, '← Leave', Renderer.cx, by + 18, 'bold 14px Segoe UI', '#f0d060');
        if (Input.clickedInRect(bx, by, 160, 36)) {
            CampaignSystem.visitNode(this.node.id);
            SaveSystem.save();
            ScreenManager.fadeToScreen('campaignMap');
        }
    },

    buyOffer(offer, index) {
        const p = GameState.player;
        if (p.gold < offer.cost) return;

        p.gold -= offer.cost;
        offer.bought = true;

        switch (offer.type) {
            case 'mercenary': {
                const existing = p.army.slots.find(s => s.type === offer.unitType);
                if (existing) {
                    existing.count = Math.min(existing.count + offer.count, existing.maxCount);
                } else {
                    const template = Units.allied[offer.unitType];
                    p.army.slots.push({
                        type: offer.unitType,
                        name: template.name,
                        count: offer.count,
                        maxCount: offer.count + 5,
                        veterancy: 1,
                        equipTier: 0,
                        morale: 70,
                        ...Utils.deepClone(template.baseStats)
                    });
                }
                this.message = `Hired ${offer.count} mercenaries!`;
                this.messageColor = '#60c060';
                break;
            }
            case 'gamble': {
                if (Utils.chance(50)) {
                    p.gold += 40;
                    this.message = 'Lady luck smiles! You won 40 gold!';
                    this.messageColor = '#e0c040';
                } else {
                    this.message = 'You lost the bet. Better luck next time.';
                    this.messageColor = '#c04040';
                }
                break;
            }
            case 'intel': {
                p.army.morale = Utils.clamp(p.army.morale + 5, 0, 100);
                this.message = 'Your army\'s morale has improved!';
                this.messageColor = '#60c060';
                break;
            }
        }
        this.messageTimer = 3;
        SaveSystem.save();
    }
};
