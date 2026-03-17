const EventScreen = {
    node: null,
    eventData: null,
    phase: 'choosing', // choosing, result
    result: null,

    enter(params) {
        this.node = params.node;
        this.phase = 'choosing';
        this.result = null;

        const eventId = this.node.eventId || Utils.pick(Object.keys(Events.data));
        this.eventData = Events.data[eventId];
        this.eventId = eventId;

        if (!this.eventData) {
            // Fallback to a random event
            const keys = Object.keys(Events.data);
            this.eventId = Utils.pick(keys);
            this.eventData = Events.data[this.eventId];
        }
    },

    update(dt) {},

    render(ctx) {
        ctx.fillStyle = '#0a0a12';
        ctx.fillRect(0, 0, Renderer.w, Renderer.h);

        if (!this.eventData) {
            Utils.drawTextCentered(ctx, 'Nothing here...', Renderer.cx, Renderer.cy, '18px Segoe UI', '#8a8a9a');
            this.drawLeaveBtn(ctx);
            return;
        }

        if (this.phase === 'choosing') this.renderChoosing(ctx);
        else this.renderResult(ctx);
    },

    renderChoosing(ctx) {
        const evt = this.eventData;

        Sprites.draw(ctx, 'icon_question', Renderer.cx - 70, 32, { scale: 0.9 });
        Utils.drawTextCentered(ctx, 'Event', Renderer.cx, 40, 'bold 28px Segoe UI', '#8060c0');

        // Event panel
        const pw = 600, ph = 120;
        const px = Renderer.cx - pw / 2, py = 80;
        Utils.drawPanel(ctx, px, py, pw, ph, '#8060c0', '#14141f');

        Utils.drawTextCentered(ctx, evt.title, Renderer.cx, py + 30, 'bold 20px Segoe UI', '#c0a0ff');

        ctx.font = '14px Segoe UI';
        ctx.fillStyle = '#a0a0b0';
        ctx.textAlign = 'center';
        // Wrap description
        const words = evt.description.split(' ');
        let line = '';
        let ly = py + 55;
        words.forEach(word => {
            const test = line + word + ' ';
            if (ctx.measureText(test).width > pw - 40) {
                ctx.fillText(line, Renderer.cx, ly);
                ly += 18;
                line = word + ' ';
            } else {
                line = test;
            }
        });
        if (line) ctx.fillText(line, Renderer.cx, ly);

        // Choice buttons
        let cy = 230;
        evt.choices.forEach((choice, i) => {
            const cw = 500, ch = 50;
            const cx = Renderer.cx - cw / 2;
            const hover = Input.isMouseInRect(cx, cy, cw, ch);

            Utils.drawPanel(ctx, cx, cy, cw, ch, hover ? '#c0a0ff' : '#5a4a7a', hover ? '#1e1e30' : '#14141f');

            ctx.textAlign = 'left';
            ctx.font = '14px Segoe UI';
            ctx.fillStyle = hover ? '#e0d0ff' : '#c0b0d0';
            ctx.fillText(`${i + 1}. ${choice.text}`, cx + 18, cy + 30);

            if (Input.clickedInRect(cx, cy, cw, ch)) {
                this.result = Events.resolveChoice(this.eventId, i);
                this.phase = 'result';
                SaveSystem.save();
            }

            cy += ch + 12;
        });
    },

    renderResult(ctx) {
        Sprites.draw(ctx, 'icon_question', Renderer.cx - 100, 32, { scale: 0.9 });
        Utils.drawTextCentered(ctx, 'Event Result', Renderer.cx, 40, 'bold 28px Segoe UI', '#8060c0');

        const pw = 500, ph = 180;
        const px = Renderer.cx - pw / 2, py = 120;
        Utils.drawPanel(ctx, px, py, pw, ph, '#8060c0', '#14141f');

        ctx.textAlign = 'center';
        ctx.font = '16px Segoe UI';
        ctx.fillStyle = '#e0d8c0';

        // Wrap result text
        const text = this.result.text || 'Something happened.';
        const words = text.split(' ');
        let line = '';
        let ly = py + 40;
        words.forEach(word => {
            const test = line + word + ' ';
            if (ctx.measureText(test).width > pw - 40) {
                ctx.fillText(line, Renderer.cx, ly);
                ly += 22;
                line = word + ' ';
            } else {
                line = test;
            }
        });
        if (line) ctx.fillText(line, Renderer.cx, ly);

        ly += 30;

        // Show gains/losses
        ctx.font = '14px Segoe UI';
        if (this.result.gold && this.result.gold > 0) { ctx.fillStyle = '#e0c040'; ctx.fillText(`+${this.result.gold} Gold`, Renderer.cx, ly); ly += 20; }
        if (this.result.iron && this.result.iron > 0) { ctx.fillStyle = '#a0a0b0'; ctx.fillText(`+${this.result.iron} Iron`, Renderer.cx, ly); ly += 20; }
        if (this.result.food && this.result.food > 0) { ctx.fillStyle = '#80c060'; ctx.fillText(`+${this.result.food} Food`, Renderer.cx, ly); ly += 20; }
        if (this.result.xp) { ctx.fillStyle = '#c0a030'; ctx.fillText(`+${this.result.xp} XP`, Renderer.cx, ly); ly += 20; }
        if (this.result.healWound) { ctx.fillStyle = '#40c060'; ctx.fillText('Wound healed!', Renderer.cx, ly); ly += 20; }
        if (this.result.relicFragment) { ctx.fillStyle = '#a040e0'; ctx.fillText('+1 Relic Fragment', Renderer.cx, ly); ly += 20; }
        if (this.result.moraleLoss) { ctx.fillStyle = '#c06040'; ctx.fillText(`-${this.result.moraleLoss} Morale`, Renderer.cx, ly); ly += 20; }
        if (this.result.moraleGain) { ctx.fillStyle = '#40c060'; ctx.fillText(`+${this.result.moraleGain} Morale`, Renderer.cx, ly); ly += 20; }
        if (this.result.weaponEnhance) { ctx.fillStyle = '#e0c060'; ctx.fillText(`Weapon +${this.result.weaponEnhance} enhanced!`, Renderer.cx, ly); ly += 20; }

        this.drawLeaveBtn(ctx);
    },

    drawLeaveBtn(ctx) {
        const bx = Renderer.cx - 80, by = Renderer.h - 80;
        const hover = Input.isMouseInRect(bx, by, 160, 36);
        Utils.drawPanel(ctx, bx, by, 160, 36, hover ? '#e0c060' : '#c8a84e', '#1a1a2a');
        Utils.drawTextCentered(ctx, 'Continue', Renderer.cx, by + 18, 'bold 14px Segoe UI', '#f0d060');
        if (Input.clickedInRect(bx, by, 160, 36)) {
            CampaignSystem.completeNode(this.node.id);
            SaveSystem.save();
            ScreenManager.fadeToScreen('campaignMap');
        }
    }
};
