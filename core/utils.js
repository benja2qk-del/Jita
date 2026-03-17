const Utils = {
    clamp(val, min, max) { return Math.max(min, Math.min(max, val)); },
    lerp(a, b, t) { return a + (b - a) * t; },
    rand(min, max) { return Math.random() * (max - min) + min; },
    randInt(min, max) { return Math.floor(Utils.rand(min, max + 1)); },
    pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; },
    chance(pct) { return Math.random() * 100 < pct; },
    uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 8); },

    deepClone(obj) {
        return JSON.parse(JSON.stringify(obj));
    },

    dist(x1, y1, x2, y2) {
        const dx = x2 - x1, dy = y2 - y1;
        return Math.sqrt(dx * dx + dy * dy);
    },

    formatNum(n) {
        if (n >= 1000) return (n / 1000).toFixed(1) + 'k';
        return String(n);
    },

    hsl(h, s, l) { return `hsl(${h}, ${s}%, ${l}%)`; },

    drawRoundRect(ctx, x, y, w, h, r) {
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.lineTo(x + w - r, y);
        ctx.quadraticCurveTo(x + w, y, x + w, y + r);
        ctx.lineTo(x + w, y + h - r);
        ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
        ctx.lineTo(x + r, y + h);
        ctx.quadraticCurveTo(x, y + h, x, y + h - r);
        ctx.lineTo(x, y + r);
        ctx.quadraticCurveTo(x, y, x + r, y);
        ctx.closePath();
    },

    drawBar(ctx, x, y, w, h, ratio, color, bgColor = '#1a1a2a') {
        ratio = Utils.clamp(ratio, 0, 1);
        ctx.fillStyle = bgColor;
        Utils.drawRoundRect(ctx, x, y, w, h, h / 2);
        ctx.fill();
        if (ratio > 0) {
            ctx.fillStyle = color;
            Utils.drawRoundRect(ctx, x, y, w * ratio, h, h / 2);
            ctx.fill();
        }
    },

    drawTextCentered(ctx, text, x, y, font, color) {
        const prevBaseline = ctx.textBaseline;
        const prevAlign = ctx.textAlign;
        ctx.font = font;
        ctx.fillStyle = color;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(text, x, y);
        ctx.textBaseline = prevBaseline;
        ctx.textAlign = prevAlign;
    },

    drawPanel(ctx, x, y, w, h, borderColor = '#c8a84e', bgColor = '#14141f') {
        ctx.fillStyle = bgColor;
        Utils.drawRoundRect(ctx, x, y, w, h, 8);
        ctx.fill();
        ctx.strokeStyle = borderColor;
        ctx.lineWidth = 1.5;
        Utils.drawRoundRect(ctx, x, y, w, h, 8);
        ctx.stroke();
    }
};
