// ============================================================
// Sprites — Pre-rendered Canvas sprite & icon system
// All art is drawn via Canvas 2D paths, cached to off-screen
// canvases for fast blitting during gameplay.
// ============================================================
const Sprites = {
    cache: {},
    scale: 1,

    // Create an off-screen canvas, draw on it, cache the result
    _make(key, w, h, drawFn) {
        const c = document.createElement('canvas');
        c.width = w;
        c.height = h;
        const cx = c.getContext('2d');
        drawFn(cx, w, h);
        this.cache[key] = c;
        return c;
    },

    get(key) { return this.cache[key] || null; },

    // Draw a cached sprite centered at (x, y) with optional scale & flip
    draw(ctx, key, x, y, opts = {}) {
        const c = this.cache[key];
        if (!c) return;
        const s = opts.scale || 1;
        const flip = opts.flipX || false;
        const w = c.width * s;
        const h = c.height * s;
        ctx.save();
        ctx.translate(x, y);
        if (flip) ctx.scale(-1, 1);
        if (opts.alpha !== undefined) ctx.globalAlpha = opts.alpha;
        ctx.drawImage(c, -w / 2, -h / 2, w, h);
        ctx.restore();
    },

    // Draw icon + value text inline (left-aligned). Returns total width consumed.
    iconText(ctx, key, value, x, y, scale) {
        const c = this.cache[key];
        if (!c) return 0;
        const s = scale || 0.65;
        const iw = c.width * s;
        this.draw(ctx, key, x + iw / 2, y - 4, { scale: s });
        const txt = String(value);
        ctx.fillText(txt, x + iw + 3, y);
        return iw + 3 + ctx.measureText(txt).width;
    },

    // Draw sprite with tint overlay (for team color, damage flash, etc.)
    drawTinted(ctx, key, x, y, tint, opts = {}) {
        const c = this.cache[key];
        if (!c) return;
        this.draw(ctx, key, x, y, opts);
        // Overlay tint
        ctx.save();
        ctx.globalCompositeOperation = 'source-atop';
        ctx.globalAlpha = opts.tintAlpha || 0.3;
        ctx.fillStyle = tint;
        const s = opts.scale || 1;
        ctx.fillRect(x - c.width * s / 2, y - c.height * s / 2, c.width * s, c.height * s);
        ctx.restore();
    },

    // ========================================================
    // INITIALIZATION — call once after page load
    // ========================================================
    init() {
        this._buildResourceIcons();
        this._buildUIIcons();
        this._buildHeroSprites();
        this._buildAllySprites();
        this._buildEnemySprites();
        this._buildBossSprite();
        this._buildBuildingIcons();
        this._buildNodeIcons();
        this._buildSkillIcons();
        this._buildRacePortraits();
        this._buildClassPortraits();
    },

    // ========================================================
    // RESOURCE ICONS (gold, iron, food, mana)
    // ========================================================
    _buildResourceIcons() {
        // Gold coin
        this._make('icon_gold', 24, 24, (cx, w, h) => {
            cx.translate(w / 2, h / 2);
            // Outer ring
            cx.beginPath(); cx.arc(0, 0, 10, 0, Math.PI * 2);
            cx.fillStyle = '#e8c840'; cx.fill();
            cx.beginPath(); cx.arc(0, 0, 10, 0, Math.PI * 2);
            cx.strokeStyle = '#a08020'; cx.lineWidth = 1.5; cx.stroke();
            // Inner circle
            cx.beginPath(); cx.arc(0, 0, 6, 0, Math.PI * 2);
            cx.strokeStyle = '#c0a030'; cx.lineWidth = 1; cx.stroke();
            // G symbol
            cx.font = 'bold 10px Segoe UI'; cx.fillStyle = '#806010';
            cx.textAlign = 'center'; cx.textBaseline = 'middle';
            cx.fillText('G', 0, 0);
        });

        // Iron ingot
        this._make('icon_iron', 24, 24, (cx, w, h) => {
            cx.translate(w / 2, h / 2);
            // Parallelogram ingot shape
            cx.beginPath();
            cx.moveTo(-8, 5); cx.lineTo(-4, -5); cx.lineTo(8, -5); cx.lineTo(4, 5);
            cx.closePath();
            cx.fillStyle = '#8090a8'; cx.fill();
            cx.strokeStyle = '#506070'; cx.lineWidth = 1; cx.stroke();
            // Top facet
            cx.beginPath();
            cx.moveTo(-4, -5); cx.lineTo(0, -9); cx.lineTo(12, -9); cx.lineTo(8, -5);
            cx.closePath();
            cx.fillStyle = '#a0b0c8'; cx.fill();
            cx.strokeStyle = '#506070'; cx.lineWidth = 1; cx.stroke();
            // Side facet
            cx.beginPath();
            cx.moveTo(8, -5); cx.lineTo(12, -9); cx.lineTo(8, 1); cx.lineTo(4, 5);
            cx.closePath();
            cx.fillStyle = '#607080'; cx.fill();
            cx.strokeStyle = '#506070'; cx.lineWidth = 1; cx.stroke();
        });

        // Food (drumstick)
        this._make('icon_food', 24, 24, (cx, w, h) => {
            cx.translate(w / 2, h / 2);
            // Bone
            cx.strokeStyle = '#e0d8c0'; cx.lineWidth = 3; cx.lineCap = 'round';
            cx.beginPath(); cx.moveTo(3, 3); cx.lineTo(9, 9); cx.stroke();
            // Bone tips
            cx.fillStyle = '#e0d8c0';
            cx.beginPath(); cx.arc(10, 10, 2, 0, Math.PI * 2); cx.fill();
            cx.beginPath(); cx.arc(9, 11, 1.5, 0, Math.PI * 2); cx.fill();
            cx.beginPath(); cx.arc(11, 9, 1.5, 0, Math.PI * 2); cx.fill();
            // Meat
            cx.beginPath();
            cx.ellipse(-2, -2, 8, 6, -Math.PI / 4, 0, Math.PI * 2);
            cx.fillStyle = '#c05030'; cx.fill();
            cx.strokeStyle = '#903020'; cx.lineWidth = 1; cx.stroke();
            // Highlight
            cx.beginPath();
            cx.ellipse(-3, -4, 3, 2, -Math.PI / 4, 0, Math.PI * 2);
            cx.fillStyle = '#d06040'; cx.fill();
        });

        // Mana crystal
        this._make('icon_mana', 24, 24, (cx, w, h) => {
            cx.translate(w / 2, h / 2);
            // Crystal shape (hexagonal prism)
            cx.beginPath();
            cx.moveTo(0, -10); cx.lineTo(6, -4); cx.lineTo(6, 4);
            cx.lineTo(0, 10); cx.lineTo(-6, 4); cx.lineTo(-6, -4);
            cx.closePath();
            cx.fillStyle = '#4060c0'; cx.fill();
            cx.strokeStyle = '#2040a0'; cx.lineWidth = 1; cx.stroke();
            // Inner glow facets
            cx.beginPath();
            cx.moveTo(0, -10); cx.lineTo(0, 10); cx.lineTo(-6, 4); cx.lineTo(-6, -4);
            cx.closePath();
            cx.fillStyle = '#5080e0'; cx.fill();
            // Sparkle
            cx.fillStyle = '#a0c0ff';
            cx.beginPath(); cx.arc(-2, -3, 2, 0, Math.PI * 2); cx.fill();
        });
    },

    // ========================================================
    // UI ICONS (heart, sword, shield, save, etc.)
    // ========================================================
    _buildUIIcons() {
        // Heart
        this._make('icon_heart', 20, 20, (cx, w, h) => {
            cx.translate(w / 2, h / 2 + 1);
            cx.fillStyle = '#e03040';
            cx.beginPath();
            cx.moveTo(0, 7);
            cx.bezierCurveTo(-1, 5, -8, 0, -8, -3);
            cx.bezierCurveTo(-8, -7, -4, -8, 0, -5);
            cx.bezierCurveTo(4, -8, 8, -7, 8, -3);
            cx.bezierCurveTo(8, 0, 1, 5, 0, 7);
            cx.fill();
        });

        // Sword
        this._make('icon_sword', 24, 24, (cx, w, h) => {
            cx.translate(w / 2, h / 2);
            cx.strokeStyle = '#c0c8d0'; cx.lineWidth = 2; cx.lineCap = 'round';
            // Blade
            cx.beginPath(); cx.moveTo(0, -10); cx.lineTo(0, 4); cx.stroke();
            // Blade edge
            cx.beginPath();
            cx.moveTo(0, -10); cx.lineTo(-3, -6); cx.lineTo(0, 4); cx.lineTo(3, -6);
            cx.closePath();
            cx.fillStyle = '#d0d8e0'; cx.fill();
            cx.strokeStyle = '#8890a0'; cx.lineWidth = 0.5; cx.stroke();
            // Crossguard
            cx.fillStyle = '#a08030';
            cx.fillRect(-5, 3, 10, 2);
            // Grip
            cx.fillStyle = '#604020';
            cx.fillRect(-1.5, 5, 3, 5);
            // Pommel
            cx.fillStyle = '#a08030';
            cx.beginPath(); cx.arc(0, 11, 2, 0, Math.PI * 2); cx.fill();
        });

        // Shield
        this._make('icon_shield', 24, 24, (cx, w, h) => {
            cx.translate(w / 2, h / 2);
            cx.beginPath();
            cx.moveTo(0, -9);
            cx.quadraticCurveTo(9, -9, 9, -2);
            cx.quadraticCurveTo(9, 6, 0, 11);
            cx.quadraticCurveTo(-9, 6, -9, -2);
            cx.quadraticCurveTo(-9, -9, 0, -9);
            cx.closePath();
            cx.fillStyle = '#4060a0'; cx.fill();
            cx.strokeStyle = '#8090b0'; cx.lineWidth = 1.5; cx.stroke();
            // Emblem line
            cx.strokeStyle = '#6080c0'; cx.lineWidth = 1;
            cx.beginPath(); cx.moveTo(0, -6); cx.lineTo(0, 8); cx.stroke();
            cx.beginPath(); cx.moveTo(-5, -1); cx.lineTo(5, -1); cx.stroke();
        });

        // Save/floppy
        this._make('icon_save', 20, 20, (cx, w, h) => {
            cx.translate(w / 2, h / 2);
            cx.fillStyle = '#4060a0';
            Utils.drawRoundRect(cx, -8, -8, 16, 16, 2);
            cx.fill();
            cx.strokeStyle = '#6080c0'; cx.lineWidth = 1;
            Utils.drawRoundRect(cx, -8, -8, 16, 16, 2);
            cx.stroke();
            // Label area
            cx.fillStyle = '#e0d8c0';
            cx.fillRect(-5, -8, 10, 7);
            // Slot
            cx.fillStyle = '#4060a0';
            cx.fillRect(-2, -8, 3, 4);
            // Data area
            cx.fillStyle = '#2a3050';
            cx.fillRect(-5, 3, 10, 4);
        });

        // Skull (death/elite)
        this._make('icon_skull', 24, 24, (cx, w, h) => {
            cx.translate(w / 2, h / 2);
            // Cranium
            cx.beginPath(); cx.ellipse(0, -2, 8, 9, 0, Math.PI, 0);
            cx.fillStyle = '#e0d8c0'; cx.fill();
            // Jaw
            cx.beginPath();
            cx.moveTo(-7, -2); cx.quadraticCurveTo(-7, 6, -3, 8);
            cx.lineTo(3, 8); cx.quadraticCurveTo(7, 6, 7, -2);
            cx.fillStyle = '#d0c8b0'; cx.fill();
            // Eyes
            cx.fillStyle = '#1a1a2a';
            cx.beginPath(); cx.ellipse(-3, -3, 2.5, 3, 0, 0, Math.PI * 2); cx.fill();
            cx.beginPath(); cx.ellipse(3, -3, 2.5, 3, 0, 0, Math.PI * 2); cx.fill();
            // Nose
            cx.beginPath();
            cx.moveTo(-1, 1); cx.lineTo(1, 1); cx.lineTo(0, 3); cx.closePath();
            cx.fill();
            // Teeth
            cx.strokeStyle = '#1a1a2a'; cx.lineWidth = 0.5;
            for (let i = -2; i <= 2; i++) {
                cx.beginPath(); cx.moveTo(i * 2, 5); cx.lineTo(i * 2, 7); cx.stroke();
            }
        });

        // Crown (boss)
        this._make('icon_crown', 24, 24, (cx, w, h) => {
            cx.translate(w / 2, h / 2);
            cx.fillStyle = '#e8c840';
            cx.beginPath();
            cx.moveTo(-9, 4); cx.lineTo(-9, -2); cx.lineTo(-5, 2);
            cx.lineTo(0, -6); cx.lineTo(5, 2); cx.lineTo(9, -2);
            cx.lineTo(9, 4); cx.closePath();
            cx.fill();
            cx.strokeStyle = '#a08020'; cx.lineWidth = 1; cx.stroke();
            // Band
            cx.fillStyle = '#c0a030';
            cx.fillRect(-9, 4, 18, 3);
            cx.strokeStyle = '#a08020'; cx.lineWidth = 0.5;
            cx.strokeRect(-9, 4, 18, 3);
            // Jewels
            cx.fillStyle = '#c03030';
            cx.beginPath(); cx.arc(0, 1, 2, 0, Math.PI * 2); cx.fill();
            cx.fillStyle = '#3050c0';
            cx.beginPath(); cx.arc(-5, 2, 1.5, 0, Math.PI * 2); cx.fill();
            cx.beginPath(); cx.arc(5, 2, 1.5, 0, Math.PI * 2); cx.fill();
        });

        // Potion
        this._make('icon_potion', 24, 24, (cx, w, h) => {
            cx.translate(w / 2, h / 2);
            // Bottle body
            cx.beginPath();
            cx.moveTo(-5, 0); cx.quadraticCurveTo(-7, 4, -6, 8);
            cx.quadraticCurveTo(-5, 10, 0, 10);
            cx.quadraticCurveTo(5, 10, 6, 8);
            cx.quadraticCurveTo(7, 4, 5, 0);
            cx.closePath();
            cx.fillStyle = '#40c060'; cx.fill();
            cx.strokeStyle = '#208040'; cx.lineWidth = 1; cx.stroke();
            // Neck
            cx.fillStyle = '#40c060';
            cx.fillRect(-2, -5, 4, 6);
            cx.strokeStyle = '#208040'; cx.lineWidth = 1;
            cx.strokeRect(-2, -5, 4, 6);
            // Cork
            cx.fillStyle = '#a08060';
            cx.fillRect(-3, -8, 6, 4);
            // Highlight
            cx.fillStyle = 'rgba(255,255,255,0.3)';
            cx.beginPath(); cx.ellipse(-2, 4, 2, 4, 0, 0, Math.PI * 2); cx.fill();
        });

        // Arrow icon (for ranged)
        this._make('icon_arrow', 24, 24, (cx, w, h) => {
            cx.translate(w / 2, h / 2);
            cx.strokeStyle = '#a0c060'; cx.lineWidth = 1.5; cx.lineCap = 'round';
            // Shaft
            cx.beginPath(); cx.moveTo(-8, 8); cx.lineTo(6, -6); cx.stroke();
            // Head
            cx.fillStyle = '#c0d080';
            cx.beginPath();
            cx.moveTo(8, -8); cx.lineTo(3, -5); cx.lineTo(5, -3); cx.closePath();
            cx.fill();
            // Fletching
            cx.strokeStyle = '#c05030'; cx.lineWidth = 1;
            cx.beginPath(); cx.moveTo(-8, 8); cx.lineTo(-6, 5); cx.stroke();
            cx.beginPath(); cx.moveTo(-8, 8); cx.lineTo(-5, 6); cx.stroke();
        });

        // Star icon (XP / level up)
        this._make('icon_star', 24, 24, (cx, w, h) => {
            cx.translate(w / 2, h / 2);
            cx.fillStyle = '#e0c040';
            cx.beginPath();
            for (let i = 0; i < 5; i++) {
                const a = -Math.PI / 2 + i * Math.PI * 2 / 5;
                const ai = a + Math.PI / 5;
                cx.lineTo(Math.cos(a) * 9, Math.sin(a) * 9);
                cx.lineTo(Math.cos(ai) * 4, Math.sin(ai) * 4);
            }
            cx.closePath(); cx.fill();
            cx.strokeStyle = '#c0a030'; cx.lineWidth = 0.5; cx.stroke();
        });

        // Question mark icon (events)
        this._make('icon_question', 24, 24, (cx, w, h) => {
            cx.translate(w / 2, h / 2);
            cx.fillStyle = '#8060c0';
            cx.beginPath(); cx.arc(0, 0, 10, 0, Math.PI * 2); cx.fill();
            cx.strokeStyle = '#a080e0'; cx.lineWidth = 1; cx.stroke();
            cx.fillStyle = '#e0d0ff'; cx.font = 'bold 14px Segoe UI'; cx.textAlign = 'center'; cx.textBaseline = 'middle';
            cx.fillText('?', 0, 1);
        });

        // Relic fragment icon
        this._make('icon_relic', 24, 24, (cx, w, h) => {
            cx.translate(w / 2, h / 2);
            cx.fillStyle = '#a040e0';
            cx.beginPath();
            for (let i = 0; i < 6; i++) {
                const a = -Math.PI / 2 + i * Math.PI / 3;
                const r = i % 2 === 0 ? 9 : 5;
                cx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
            }
            cx.closePath(); cx.fill();
            cx.strokeStyle = '#c060ff'; cx.lineWidth = 1; cx.stroke();
            cx.fillStyle = '#e0b0ff'; cx.beginPath(); cx.arc(-2, -2, 2, 0, Math.PI * 2); cx.fill();
        });

        // Warning triangle icon
        this._make('icon_warning', 24, 24, (cx, w, h) => {
            cx.translate(w / 2, h / 2);
            cx.fillStyle = '#c06040';
            cx.beginPath();
            cx.moveTo(0, -9); cx.lineTo(-9, 8); cx.lineTo(9, 8); cx.closePath();
            cx.fill();
            cx.strokeStyle = '#e08060'; cx.lineWidth = 0.8; cx.stroke();
            cx.fillStyle = '#fff'; cx.font = 'bold 10px Segoe UI'; cx.textAlign = 'center'; cx.textBaseline = 'middle';
            cx.fillText('!', 0, 2);
        });

        // Armor shield icon
        this._make('icon_armor', 24, 24, (cx, w, h) => {
            cx.translate(w / 2, h / 2);
            cx.fillStyle = '#6080c0';
            cx.beginPath();
            cx.moveTo(0, -10); cx.lineTo(-9, -6); cx.lineTo(-9, 2);
            cx.quadraticCurveTo(-8, 10, 0, 12);
            cx.quadraticCurveTo(8, 10, 9, 2);
            cx.lineTo(9, -6); cx.closePath(); cx.fill();
            cx.strokeStyle = '#80a0e0'; cx.lineWidth = 1; cx.stroke();
            cx.fillStyle = '#a0c0ff';
            cx.beginPath(); cx.arc(0, 0, 3, 0, Math.PI * 2); cx.fill();
        });
    },

    // ========================================================
    // HERO CHARACTER SPRITES (per class, facing right)
    // Size: 48×48 each
    // ========================================================
    _buildHeroSprites() {
        // --- WARRIOR ---
        this._make('hero_warrior', 48, 48, (cx) => {
            cx.translate(24, 24);
            // Legs
            cx.fillStyle = '#504030';
            cx.fillRect(-5, 6, 4, 10);
            cx.fillRect(1, 6, 4, 10);
            // Boots
            cx.fillStyle = '#604020';
            cx.fillRect(-6, 14, 6, 3);
            cx.fillRect(0, 14, 6, 3);
            // Body (armored torso)
            cx.fillStyle = '#707880';
            cx.beginPath();
            cx.moveTo(-8, -4); cx.lineTo(8, -4);
            cx.lineTo(7, 7); cx.lineTo(-7, 7); cx.closePath();
            cx.fill();
            cx.strokeStyle = '#505860'; cx.lineWidth = 1; cx.stroke();
            // Chest plate detail
            cx.fillStyle = '#808890';
            cx.fillRect(-5, -2, 10, 3);
            // Belt
            cx.fillStyle = '#604020';
            cx.fillRect(-7, 5, 14, 2);
            cx.fillStyle = '#e8c840';
            cx.fillRect(-1, 5, 2, 2);
            // Arms
            cx.fillStyle = '#707880';
            cx.fillRect(-12, -3, 5, 8);
            cx.fillRect(7, -3, 5, 8);
            // Shoulder pads
            cx.fillStyle = '#808890';
            cx.beginPath(); cx.ellipse(-10, -4, 5, 3, 0, 0, Math.PI * 2); cx.fill();
            cx.beginPath(); cx.ellipse(10, -4, 5, 3, 0, 0, Math.PI * 2); cx.fill();
            cx.strokeStyle = '#606870'; cx.lineWidth = 0.5;
            cx.beginPath(); cx.ellipse(-10, -4, 5, 3, 0, 0, Math.PI * 2); cx.stroke();
            cx.beginPath(); cx.ellipse(10, -4, 5, 3, 0, 0, Math.PI * 2); cx.stroke();
            // Neck
            cx.fillStyle = '#c0a080';
            cx.fillRect(-2, -8, 4, 5);
            // Head
            cx.fillStyle = '#c0a080';
            cx.beginPath(); cx.arc(0, -12, 7, 0, Math.PI * 2); cx.fill();
            // Helmet
            cx.fillStyle = '#808890';
            cx.beginPath();
            cx.arc(0, -14, 8, Math.PI, 0); cx.fill();
            cx.fillRect(-8, -14, 16, 3);
            // Helmet visor
            cx.fillStyle = '#404850';
            cx.fillRect(-4, -11, 8, 2);
            // Eyes
            cx.fillStyle = '#e0e8f0';
            cx.fillRect(-3, -11, 2, 1.5);
            cx.fillRect(1, -11, 2, 1.5);
            // Sword (right hand)
            cx.strokeStyle = '#c0c8d0'; cx.lineWidth = 2; cx.lineCap = 'round';
            cx.beginPath(); cx.moveTo(14, -2); cx.lineTo(14, -18); cx.stroke();
            cx.fillStyle = '#d0d8e0';
            cx.beginPath();
            cx.moveTo(14, -18); cx.lineTo(12, -14); cx.lineTo(14, -2); cx.lineTo(16, -14);
            cx.closePath(); cx.fill();
            // Crossguard
            cx.fillStyle = '#a08030';
            cx.fillRect(10, -3, 8, 2);
            // Shield (left hand)
            cx.beginPath();
            cx.moveTo(-14, -6);
            cx.quadraticCurveTo(-20, -6, -20, 0);
            cx.quadraticCurveTo(-20, 8, -14, 10);
            cx.quadraticCurveTo(-8, 8, -8, 0);
            cx.quadraticCurveTo(-8, -6, -14, -6);
            cx.closePath();
            cx.fillStyle = '#4060a0'; cx.fill();
            cx.strokeStyle = '#6080c0'; cx.lineWidth = 1; cx.stroke();
            // Shield emblem
            cx.strokeStyle = '#8090b0'; cx.lineWidth = 0.5;
            cx.beginPath(); cx.moveTo(-14, -4); cx.lineTo(-14, 8); cx.stroke();
            cx.beginPath(); cx.moveTo(-18, 1); cx.lineTo(-10, 1); cx.stroke();
        });

        // --- SAMURAI ---
        this._make('hero_samurai', 48, 48, (cx) => {
            cx.translate(24, 24);
            // Legs (hakama pants - wide)
            cx.fillStyle = '#1a1a40';
            cx.beginPath();
            cx.moveTo(-6, 5); cx.lineTo(-9, 16);
            cx.lineTo(-1, 16); cx.lineTo(0, 8);
            cx.fill();
            cx.beginPath();
            cx.moveTo(6, 5); cx.lineTo(9, 16);
            cx.lineTo(1, 16); cx.lineTo(0, 8);
            cx.fill();
            // Sandals
            cx.fillStyle = '#806040';
            cx.fillRect(-9, 15, 8, 2);
            cx.fillRect(1, 15, 8, 2);
            // Torso (kimono/armor)
            cx.fillStyle = '#c03030';
            cx.beginPath();
            cx.moveTo(-8, -5); cx.lineTo(8, -5);
            cx.lineTo(7, 6); cx.lineTo(-7, 6); cx.closePath();
            cx.fill();
            // Kimono overlap
            cx.strokeStyle = '#901010'; cx.lineWidth = 1;
            cx.beginPath(); cx.moveTo(-3, -5); cx.lineTo(2, 6); cx.stroke();
            // Chest armor plate
            cx.fillStyle = '#303040';
            cx.fillRect(-6, -3, 12, 4);
            cx.strokeStyle = '#505060'; cx.lineWidth = 0.5;
            cx.strokeRect(-6, -3, 12, 4);
            // Obi (belt)
            cx.fillStyle = '#e0c060';
            cx.fillRect(-7, 4, 14, 2);
            // Arms
            cx.fillStyle = '#c03030';
            cx.fillRect(-12, -3, 5, 7);
            cx.fillRect(7, -3, 5, 7);
            // Forearm guards
            cx.fillStyle = '#303040';
            cx.fillRect(-12, 0, 5, 3);
            cx.fillRect(7, 0, 5, 3);
            // Neck
            cx.fillStyle = '#c0a080';
            cx.fillRect(-2, -9, 4, 5);
            // Head
            cx.fillStyle = '#c0a080';
            cx.beginPath(); cx.arc(0, -13, 7, 0, Math.PI * 2); cx.fill();
            // Hair (top knot)
            cx.fillStyle = '#1a1a2a';
            cx.beginPath();
            cx.arc(0, -15, 6, Math.PI, 0); cx.fill();
            cx.beginPath();
            cx.ellipse(0, -20, 3, 4, 0, 0, Math.PI * 2); cx.fill();
            // Hair band
            cx.fillStyle = '#c03030';
            cx.fillRect(-6, -15, 12, 2);
            // Eyes
            cx.fillStyle = '#1a1a2a';
            cx.fillRect(-4, -13, 3, 1);
            cx.fillRect(1, -13, 3, 1);
            // Katana (right side)
            cx.save();
            cx.translate(12, 0);
            cx.rotate(-0.15);
            // Blade
            cx.fillStyle = '#d0d8e0';
            cx.beginPath();
            cx.moveTo(0, 4); cx.lineTo(-1, -20);
            cx.quadraticCurveTo(0, -22, 1, -20);
            cx.lineTo(2, 4); cx.closePath();
            cx.fill();
            cx.strokeStyle = '#a0a8b0'; cx.lineWidth = 0.5; cx.stroke();
            // Blade edge highlight
            cx.strokeStyle = '#ffffff'; cx.lineWidth = 0.3;
            cx.beginPath(); cx.moveTo(0.5, -18); cx.lineTo(1, 2); cx.stroke();
            // Tsuba (guard)
            cx.fillStyle = '#e8c840';
            cx.beginPath(); cx.ellipse(1, 4, 4, 2, 0, 0, Math.PI * 2); cx.fill();
            // Handle
            cx.fillStyle = '#2a2a40';
            cx.fillRect(-0.5, 5, 3, 8);
            // Handle wrap
            cx.strokeStyle = '#e0c060'; cx.lineWidth = 0.5;
            for (let i = 0; i < 4; i++) {
                cx.beginPath(); cx.moveTo(-0.5, 6 + i * 2); cx.lineTo(2.5, 7 + i * 2); cx.stroke();
            }
            cx.restore();
        });

        // --- NINJA ---
        this._make('hero_ninja', 48, 48, (cx) => {
            cx.translate(24, 24);
            // Legs (fitted)
            cx.fillStyle = '#1a1a2a';
            cx.fillRect(-5, 5, 4, 11);
            cx.fillRect(1, 5, 4, 11);
            // Shin wraps
            cx.strokeStyle = '#303040'; cx.lineWidth = 1;
            for (let i = 0; i < 3; i++) {
                cx.beginPath(); cx.moveTo(-5, 8 + i * 3); cx.lineTo(-1, 9 + i * 3); cx.stroke();
                cx.beginPath(); cx.moveTo(1, 8 + i * 3); cx.lineTo(5, 9 + i * 3); cx.stroke();
            }
            // Tabi boots
            cx.fillStyle = '#1a1a2a';
            cx.fillRect(-6, 14, 5, 3);
            cx.fillRect(1, 14, 5, 3);
            // Body (dark fitted suit)
            cx.fillStyle = '#1a1a2a';
            cx.beginPath();
            cx.moveTo(-7, -5); cx.lineTo(7, -5);
            cx.lineTo(6, 6); cx.lineTo(-6, 6); cx.closePath();
            cx.fill();
            // Chest wrap
            cx.strokeStyle = '#303040'; cx.lineWidth = 0.8;
            cx.beginPath(); cx.moveTo(-6, -3); cx.lineTo(6, -1); cx.stroke();
            cx.beginPath(); cx.moveTo(-6, -1); cx.lineTo(6, 1); cx.stroke();
            // Belt / sash
            cx.fillStyle = '#600820';
            cx.fillRect(-6, 4, 12, 2);
            // Arms
            cx.fillStyle = '#1a1a2a';
            cx.fillRect(-11, -3, 5, 7);
            cx.fillRect(6, -3, 5, 7);
            // Arm wraps
            cx.strokeStyle = '#303040'; cx.lineWidth = 0.5;
            cx.beginPath(); cx.moveTo(-11, -1); cx.lineTo(-6, 0); cx.stroke();
            cx.beginPath(); cx.moveTo(6, -1); cx.lineTo(11, 0); cx.stroke();
            // Neck
            cx.fillStyle = '#c0a080';
            cx.fillRect(-2, -8, 4, 4);
            // Head
            cx.fillStyle = '#c0a080';
            cx.beginPath(); cx.arc(0, -12, 7, 0, Math.PI * 2); cx.fill();
            // Mask (covers lower face)
            cx.fillStyle = '#1a1a2a';
            cx.beginPath();
            cx.moveTo(-7, -12); cx.lineTo(7, -12);
            cx.lineTo(7, -7); cx.quadraticCurveTo(0, -5, -7, -7);
            cx.closePath(); cx.fill();
            // Hood
            cx.fillStyle = '#1a1a2a';
            cx.beginPath();
            cx.arc(0, -14, 8, Math.PI, 0); cx.fill();
            cx.fillRect(-8, -15, 16, 3);
            // Eyes (intense)
            cx.fillStyle = '#e0e0e0';
            cx.fillRect(-4, -14, 3, 1.5);
            cx.fillRect(1, -14, 3, 1.5);
            cx.fillStyle = '#c03030';
            cx.fillRect(-3, -14, 1.5, 1.5);
            cx.fillRect(2, -14, 1.5, 1.5);
            // Trailing scarf
            cx.strokeStyle = '#600820'; cx.lineWidth = 2; cx.lineCap = 'round';
            cx.beginPath();
            cx.moveTo(-5, -10); cx.quadraticCurveTo(-12, -6, -16, -10);
            cx.stroke();
            cx.beginPath();
            cx.moveTo(-5, -11); cx.quadraticCurveTo(-14, -8, -18, -13);
            cx.stroke();
            // Kunai (right hand)
            cx.save();
            cx.translate(10, -2);
            cx.rotate(0.3);
            cx.fillStyle = '#a0a8b0';
            cx.beginPath();
            cx.moveTo(0, -12); cx.lineTo(-2, -4); cx.lineTo(2, -4); cx.closePath();
            cx.fill();
            // Handle
            cx.fillStyle = '#303040';
            cx.fillRect(-1, -4, 2, 8);
            // Ring
            cx.strokeStyle = '#a0a8b0'; cx.lineWidth = 1;
            cx.beginPath(); cx.arc(0, 6, 2.5, 0, Math.PI * 2); cx.stroke();
            cx.restore();
            // Shuriken on belt
            cx.save();
            cx.translate(-4, 3);
            cx.fillStyle = '#808890';
            for (let i = 0; i < 4; i++) {
                cx.beginPath();
                const a = Math.PI / 2 * i;
                cx.moveTo(0, 0);
                cx.lineTo(Math.cos(a) * 3 - Math.sin(a), Math.sin(a) * 3 + Math.cos(a));
                cx.lineTo(Math.cos(a) * 3 + Math.sin(a), Math.sin(a) * 3 - Math.cos(a));
                cx.closePath(); cx.fill();
            }
            cx.restore();
        });

        // --- ARCHER HERO ---
        this._make('hero_archer', 48, 48, (cx) => {
            cx.translate(24, 24);
            // Legs
            cx.fillStyle = '#3a5030';
            cx.fillRect(-5, 6, 4, 10);
            cx.fillRect(1, 6, 4, 10);
            // Boots
            cx.fillStyle = '#4a3820';
            cx.fillRect(-6, 14, 6, 3);
            cx.fillRect(0, 14, 6, 3);
            // Body (leather tunic)
            cx.fillStyle = '#506040';
            cx.beginPath();
            cx.moveTo(-7, -4); cx.lineTo(7, -4);
            cx.lineTo(6, 7); cx.lineTo(-6, 7); cx.closePath();
            cx.fill();
            cx.strokeStyle = '#405030'; cx.lineWidth = 1; cx.stroke();
            // Belt with quiver strap
            cx.fillStyle = '#604020';
            cx.fillRect(-7, 5, 14, 2);
            cx.strokeStyle = '#604020'; cx.lineWidth = 1.5;
            cx.beginPath(); cx.moveTo(-6, -4); cx.lineTo(3, 5); cx.stroke();
            // Arms
            cx.fillStyle = '#506040';
            cx.fillRect(-11, -3, 4, 8);
            cx.fillRect(7, -3, 4, 8);
            // Neck
            cx.fillStyle = '#c0a080';
            cx.fillRect(-2, -8, 4, 5);
            // Head
            cx.fillStyle = '#c0a080';
            cx.beginPath(); cx.arc(0, -12, 7, 0, Math.PI * 2); cx.fill();
            // Hood
            cx.fillStyle = '#3a5030';
            cx.beginPath();
            cx.arc(0, -14, 8, Math.PI + 0.3, -0.3); cx.fill();
            cx.fillRect(-7, -14, 14, 3);
            // Eyes
            cx.fillStyle = '#80c060';
            cx.fillRect(-3, -12, 2, 1.5);
            cx.fillRect(1, -12, 2, 1.5);
            // Bow (left hand)
            cx.strokeStyle = '#8B6914'; cx.lineWidth = 2; cx.lineCap = 'round';
            cx.beginPath();
            cx.moveTo(-14, -16); cx.quadraticCurveTo(-20, 0, -14, 14); cx.stroke();
            // Bowstring
            cx.strokeStyle = '#c0c0a0'; cx.lineWidth = 0.8;
            cx.beginPath(); cx.moveTo(-14, -16); cx.lineTo(-14, 14); cx.stroke();
            // Arrow (right hand)
            cx.strokeStyle = '#8B6914'; cx.lineWidth = 1.5;
            cx.beginPath(); cx.moveTo(12, -18); cx.lineTo(12, 2); cx.stroke();
            // Arrowhead
            cx.fillStyle = '#a0a8b0';
            cx.beginPath(); cx.moveTo(12, -18); cx.lineTo(10, -14); cx.lineTo(14, -14); cx.closePath(); cx.fill();
            // Quiver on back
            cx.fillStyle = '#604020';
            cx.fillRect(3, -8, 5, 12);
            cx.strokeStyle = '#503018'; cx.lineWidth = 0.5;
            cx.strokeRect(3, -8, 5, 12);
            // Arrow fletchings in quiver
            cx.fillStyle = '#e04040';
            cx.fillRect(4, -10, 1, 2);
            cx.fillRect(6, -11, 1, 2);
            cx.fillRect(5, -9, 1, 2);
        });

        // --- MAGE HERO ---
        this._make('hero_mage', 48, 48, (cx) => {
            cx.translate(24, 24);
            // Robe bottom
            cx.fillStyle = '#3030a0';
            cx.beginPath();
            cx.moveTo(-8, 4); cx.lineTo(8, 4);
            cx.lineTo(10, 16); cx.lineTo(-10, 16); cx.closePath();
            cx.fill();
            // Body (robe upper)
            cx.fillStyle = '#4040b0';
            cx.beginPath();
            cx.moveTo(-7, -4); cx.lineTo(7, -4);
            cx.lineTo(8, 5); cx.lineTo(-8, 5); cx.closePath();
            cx.fill();
            cx.strokeStyle = '#3030a0'; cx.lineWidth = 1; cx.stroke();
            // Robe trim
            cx.strokeStyle = '#c0a040'; cx.lineWidth = 1;
            cx.beginPath(); cx.moveTo(-7, -4); cx.lineTo(-10, 16); cx.stroke();
            cx.beginPath(); cx.moveTo(7, -4); cx.lineTo(10, 16); cx.stroke();
            // Belt
            cx.fillStyle = '#c0a040';
            cx.fillRect(-7, 3, 14, 2);
            // Sleeves (wide)
            cx.fillStyle = '#4040b0';
            cx.beginPath(); cx.moveTo(-7, -3); cx.lineTo(-14, 4); cx.lineTo(-10, 5); cx.lineTo(-7, 2); cx.closePath(); cx.fill();
            cx.beginPath(); cx.moveTo(7, -3); cx.lineTo(14, 4); cx.lineTo(10, 5); cx.lineTo(7, 2); cx.closePath(); cx.fill();
            // Neck
            cx.fillStyle = '#c0a080';
            cx.fillRect(-2, -8, 4, 5);
            // Head
            cx.fillStyle = '#c0a080';
            cx.beginPath(); cx.arc(0, -12, 7, 0, Math.PI * 2); cx.fill();
            // Wizard hat
            cx.fillStyle = '#3030a0';
            cx.beginPath();
            cx.moveTo(-9, -12); cx.lineTo(0, -24); cx.lineTo(9, -12);
            cx.closePath(); cx.fill();
            cx.fillRect(-9, -12, 18, 3);
            // Hat brim decoration
            cx.fillStyle = '#c0a040';
            cx.fillRect(-8, -12, 16, 1.5);
            // Star on hat
            cx.fillStyle = '#f0e060';
            cx.beginPath(); cx.arc(0, -18, 2, 0, Math.PI * 2); cx.fill();
            // Eyes
            cx.fillStyle = '#60a0ff';
            cx.fillRect(-3, -12, 2, 1.5);
            cx.fillRect(1, -12, 2, 1.5);
            // Staff (right hand)
            cx.strokeStyle = '#6B4226'; cx.lineWidth = 2.5; cx.lineCap = 'round';
            cx.beginPath(); cx.moveTo(14, -20); cx.lineTo(14, 14); cx.stroke();
            // Staff orb
            cx.fillStyle = '#8060ff';
            cx.beginPath(); cx.arc(14, -20, 4, 0, Math.PI * 2); cx.fill();
            cx.fillStyle = 'rgba(160,140,255,0.5)';
            cx.beginPath(); cx.arc(14, -20, 6, 0, Math.PI * 2); cx.fill();
            // Orb highlight
            cx.fillStyle = '#c0b0ff';
            cx.beginPath(); cx.arc(13, -22, 1.5, 0, Math.PI * 2); cx.fill();
        });

        // --- TANK HERO ---
        this._make('hero_tank', 48, 48, (cx) => {
            cx.translate(24, 24);
            // Legs (armored)
            cx.fillStyle = '#606860';
            cx.fillRect(-6, 5, 5, 11);
            cx.fillRect(1, 5, 5, 11);
            // Boots (heavy)
            cx.fillStyle = '#505850';
            cx.fillRect(-7, 14, 7, 4);
            cx.fillRect(0, 14, 7, 4);
            // Body (heavy plate)
            cx.fillStyle = '#707870';
            cx.beginPath();
            cx.moveTo(-10, -5); cx.lineTo(10, -5);
            cx.lineTo(9, 7); cx.lineTo(-9, 7); cx.closePath();
            cx.fill();
            cx.strokeStyle = '#505850'; cx.lineWidth = 1.5; cx.stroke();
            // Chest plate
            cx.fillStyle = '#808880';
            cx.fillRect(-7, -3, 14, 4);
            cx.strokeStyle = '#606860'; cx.lineWidth = 0.5;
            cx.strokeRect(-7, -3, 14, 4);
            // Belt
            cx.fillStyle = '#604020';
            cx.fillRect(-9, 5, 18, 2);
            cx.fillStyle = '#c0a040';
            cx.fillRect(-1, 5, 2, 2);
            // Arms (heavy armor)
            cx.fillStyle = '#707870';
            cx.fillRect(-14, -4, 5, 9);
            cx.fillRect(9, -4, 5, 9);
            // Large shoulder pads
            cx.fillStyle = '#808880';
            cx.beginPath(); cx.ellipse(-12, -5, 6, 4, 0, 0, Math.PI * 2); cx.fill();
            cx.beginPath(); cx.ellipse(12, -5, 6, 4, 0, 0, Math.PI * 2); cx.fill();
            cx.strokeStyle = '#606860'; cx.lineWidth = 1;
            cx.beginPath(); cx.ellipse(-12, -5, 6, 4, 0, 0, Math.PI * 2); cx.stroke();
            cx.beginPath(); cx.ellipse(12, -5, 6, 4, 0, 0, Math.PI * 2); cx.stroke();
            // Neck
            cx.fillStyle = '#c0a080';
            cx.fillRect(-2, -9, 4, 5);
            // Head
            cx.fillStyle = '#c0a080';
            cx.beginPath(); cx.arc(0, -13, 7, 0, Math.PI * 2); cx.fill();
            // Full helmet
            cx.fillStyle = '#808880';
            cx.beginPath(); cx.arc(0, -13, 8, 0, Math.PI * 2); cx.fill();
            // Visor slit
            cx.fillStyle = '#303830';
            cx.fillRect(-5, -13, 10, 2);
            // Eyes through visor
            cx.fillStyle = '#e0e8f0';
            cx.fillRect(-3, -13, 2, 1.5);
            cx.fillRect(1, -13, 2, 1.5);
            // Large shield (left hand)
            cx.fillStyle = '#808040';
            cx.beginPath();
            cx.moveTo(-16, -10);
            cx.quadraticCurveTo(-24, -10, -24, 2);
            cx.quadraticCurveTo(-24, 14, -16, 16);
            cx.quadraticCurveTo(-8, 14, -8, 2);
            cx.quadraticCurveTo(-8, -10, -16, -10);
            cx.closePath(); cx.fill();
            cx.strokeStyle = '#a0a040'; cx.lineWidth = 1.5; cx.stroke();
            // Shield cross
            cx.strokeStyle = '#c0c060'; cx.lineWidth = 1.5;
            cx.beginPath(); cx.moveTo(-16, -7); cx.lineTo(-16, 13); cx.stroke();
            cx.beginPath(); cx.moveTo(-21, 3); cx.lineTo(-11, 3); cx.stroke();
            // Sword (short, right hand)
            cx.fillStyle = '#c0c8d0';
            cx.beginPath();
            cx.moveTo(14, -10); cx.lineTo(12, -4); cx.lineTo(14, 4); cx.lineTo(16, -4);
            cx.closePath(); cx.fill();
            cx.fillStyle = '#a08030';
            cx.fillRect(11, 3, 6, 2);
        });

        // --- HEALER HERO ---
        this._make('hero_healer', 48, 48, (cx) => {
            cx.translate(24, 24);
            // Robe bottom
            cx.fillStyle = '#e0e0c0';
            cx.beginPath();
            cx.moveTo(-7, 4); cx.lineTo(7, 4);
            cx.lineTo(9, 16); cx.lineTo(-9, 16); cx.closePath();
            cx.fill();
            // Body (white robe)
            cx.fillStyle = '#f0f0e0';
            cx.beginPath();
            cx.moveTo(-6, -4); cx.lineTo(6, -4);
            cx.lineTo(7, 5); cx.lineTo(-7, 5); cx.closePath();
            cx.fill();
            cx.strokeStyle = '#c0c0a0'; cx.lineWidth = 1; cx.stroke();
            // Gold trim
            cx.strokeStyle = '#c0a040'; cx.lineWidth = 1;
            cx.beginPath(); cx.moveTo(-6, -4); cx.lineTo(-9, 16); cx.stroke();
            cx.beginPath(); cx.moveTo(6, -4); cx.lineTo(9, 16); cx.stroke();
            // Sash
            cx.fillStyle = '#40a040';
            cx.fillRect(-6, 2, 12, 2);
            // Sleeves
            cx.fillStyle = '#f0f0e0';
            cx.beginPath(); cx.moveTo(-6, -3); cx.lineTo(-12, 3); cx.lineTo(-9, 4); cx.lineTo(-6, 1); cx.closePath(); cx.fill();
            cx.beginPath(); cx.moveTo(6, -3); cx.lineTo(12, 3); cx.lineTo(9, 4); cx.lineTo(6, 1); cx.closePath(); cx.fill();
            // Neck
            cx.fillStyle = '#c0a080';
            cx.fillRect(-2, -8, 4, 5);
            // Head
            cx.fillStyle = '#c0a080';
            cx.beginPath(); cx.arc(0, -12, 7, 0, Math.PI * 2); cx.fill();
            // Circlet/halo
            cx.strokeStyle = '#f0d040'; cx.lineWidth = 1.5;
            cx.beginPath(); cx.ellipse(0, -16, 8, 3, 0, 0, Math.PI * 2); cx.stroke();
            // Hair
            cx.fillStyle = '#c09040';
            cx.beginPath(); cx.arc(0, -14, 7.5, Math.PI + 0.5, -0.5); cx.fill();
            // Eyes
            cx.fillStyle = '#40a040';
            cx.fillRect(-3, -12, 2, 1.5);
            cx.fillRect(1, -12, 2, 1.5);
            // Wand (right hand)
            cx.strokeStyle = '#e0e0c0'; cx.lineWidth = 2; cx.lineCap = 'round';
            cx.beginPath(); cx.moveTo(12, -14); cx.lineTo(12, 6); cx.stroke();
            // Wand gem
            cx.fillStyle = '#40e040';
            cx.beginPath(); cx.arc(12, -14, 3, 0, Math.PI * 2); cx.fill();
            cx.fillStyle = 'rgba(80,255,80,0.4)';
            cx.beginPath(); cx.arc(12, -14, 5, 0, Math.PI * 2); cx.fill();
            // Healing glow
            cx.fillStyle = 'rgba(80,255,80,0.15)';
            cx.beginPath(); cx.arc(12, -14, 8, 0, Math.PI * 2); cx.fill();
        });

        // --- BARD HERO ---
        this._make('hero_bard', 48, 48, (cx) => {
            cx.translate(24, 24);
            // Legs
            cx.fillStyle = '#603050';
            cx.fillRect(-5, 6, 4, 10);
            cx.fillRect(1, 6, 4, 10);
            // Boots (fancy)
            cx.fillStyle = '#502040';
            cx.fillRect(-6, 14, 6, 3);
            cx.fillRect(0, 14, 6, 3);
            cx.fillStyle = '#c0a040';
            cx.fillRect(-6, 14, 6, 1);
            cx.fillRect(0, 14, 6, 1);
            // Body (elaborate tunic)
            cx.fillStyle = '#903070';
            cx.beginPath();
            cx.moveTo(-7, -4); cx.lineTo(7, -4);
            cx.lineTo(6, 7); cx.lineTo(-6, 7); cx.closePath();
            cx.fill();
            cx.strokeStyle = '#702050'; cx.lineWidth = 1; cx.stroke();
            // Decorative V-collar
            cx.strokeStyle = '#c0a040'; cx.lineWidth = 1;
            cx.beginPath(); cx.moveTo(-4, -4); cx.lineTo(0, 1); cx.lineTo(4, -4); cx.stroke();
            // Belt
            cx.fillStyle = '#c0a040';
            cx.fillRect(-6, 5, 12, 2);
            // Cape/half-cloak
            cx.fillStyle = 'rgba(100,30,80,0.6)';
            cx.beginPath(); cx.moveTo(-7, -4); cx.lineTo(-12, 12); cx.lineTo(-4, 7); cx.closePath(); cx.fill();
            // Arms
            cx.fillStyle = '#903070';
            cx.fillRect(-10, -3, 4, 7);
            cx.fillRect(7, -3, 4, 7);
            // Puffy sleeves
            cx.fillStyle = '#a04080';
            cx.beginPath(); cx.ellipse(-9, -2, 4, 3, 0, 0, Math.PI * 2); cx.fill();
            cx.beginPath(); cx.ellipse(9, -2, 4, 3, 0, 0, Math.PI * 2); cx.fill();
            // Neck
            cx.fillStyle = '#c0a080';
            cx.fillRect(-2, -8, 4, 5);
            // Head
            cx.fillStyle = '#c0a080';
            cx.beginPath(); cx.arc(0, -12, 7, 0, Math.PI * 2); cx.fill();
            // Feathered hat
            cx.fillStyle = '#702050';
            cx.beginPath(); cx.arc(0, -14, 8, Math.PI + 0.2, -0.2); cx.fill();
            cx.fillRect(-8, -14, 16, 3);
            // Hat brim swept
            cx.fillStyle = '#702050';
            cx.beginPath(); cx.moveTo(7, -13); cx.quadraticCurveTo(12, -16, 10, -11); cx.lineTo(7, -11); cx.closePath(); cx.fill();
            // Feather
            cx.strokeStyle = '#e04060'; cx.lineWidth = 1.5; cx.lineCap = 'round';
            cx.beginPath(); cx.moveTo(6, -14); cx.quadraticCurveTo(14, -22, 10, -24); cx.stroke();
            cx.strokeStyle = '#ff6080'; cx.lineWidth = 1;
            cx.beginPath(); cx.moveTo(8, -18); cx.quadraticCurveTo(12, -22, 10, -24); cx.stroke();
            // Eyes
            cx.fillStyle = '#c060a0';
            cx.fillRect(-3, -12, 2, 1.5);
            cx.fillRect(1, -12, 2, 1.5);
            // Smile
            cx.strokeStyle = '#a07060'; cx.lineWidth = 0.5;
            cx.beginPath(); cx.arc(0, -10, 3, 0.2, Math.PI - 0.2); cx.stroke();
            // Lute (right hand)
            cx.fillStyle = '#8B6914';
            cx.beginPath(); cx.ellipse(13, 0, 5, 7, 0.2, 0, Math.PI * 2); cx.fill();
            cx.fillStyle = '#6B4914';
            cx.fillRect(11, -8, 3, 8);
            // Lute strings
            cx.strokeStyle = '#c0c0a0'; cx.lineWidth = 0.3;
            for (let i = 0; i < 4; i++) {
                cx.beginPath(); cx.moveTo(12 + i, -6); cx.lineTo(12 + i, 5); cx.stroke();
            }
            // Lute neck
            cx.strokeStyle = '#8B6914'; cx.lineWidth = 2.5;
            cx.beginPath(); cx.moveTo(12.5, -8); cx.lineTo(12.5, -16); cx.stroke();
            // Tuning pegs
            cx.fillStyle = '#604020';
            cx.fillRect(10, -16, 1.5, 1.5);
            cx.fillRect(14, -16, 1.5, 1.5);
        });
    },

    // ========================================================
    // ALLIED UNIT SPRITES (infantry, archer, cavalry, brute)
    // Size: 32×32
    // ========================================================
    _buildAllySprites() {
        // --- INFANTRY ---
        this._make('unit_infantry', 32, 32, (cx) => {
            cx.translate(16, 16);
            // Legs
            cx.fillStyle = '#504838';
            cx.fillRect(-3, 4, 3, 8);
            cx.fillRect(1, 4, 3, 8);
            // Boots
            cx.fillStyle = '#403020';
            cx.fillRect(-4, 10, 4, 3);
            cx.fillRect(0, 10, 4, 3);
            // Body (chainmail)
            cx.fillStyle = '#5080c0';
            cx.fillRect(-5, -4, 10, 9);
            cx.strokeStyle = '#3060a0'; cx.lineWidth = 0.5;
            // Chainmail texture
            for (let r = -3; r < 4; r += 2) {
                cx.beginPath(); cx.moveTo(-4, r); cx.lineTo(4, r); cx.stroke();
            }
            // Belt
            cx.fillStyle = '#604020';
            cx.fillRect(-5, 3, 10, 2);
            // Arms
            cx.fillStyle = '#5080c0';
            cx.fillRect(-8, -3, 3, 6);
            cx.fillRect(5, -3, 3, 6);
            // Head
            cx.fillStyle = '#c0a080';
            cx.beginPath(); cx.arc(0, -8, 5, 0, Math.PI * 2); cx.fill();
            // Helmet (open face)
            cx.fillStyle = '#707880';
            cx.beginPath(); cx.arc(0, -9, 5.5, Math.PI, 0); cx.fill();
            cx.fillRect(-5.5, -10, 11, 2);
            // Eyes
            cx.fillStyle = '#1a1a2a';
            cx.fillRect(-2, -9, 1.5, 1);
            cx.fillRect(1, -9, 1.5, 1);
            // Short sword
            cx.fillStyle = '#c0c8d0';
            cx.fillRect(7, -6, 1.5, 10);
            cx.fillStyle = '#a08030';
            cx.fillRect(6, -1, 4, 1.5);
        });

        // --- ARCHER ---
        this._make('unit_archer', 32, 32, (cx) => {
            cx.translate(16, 16);
            // Legs
            cx.fillStyle = '#405030';
            cx.fillRect(-3, 4, 3, 7);
            cx.fillRect(1, 4, 3, 7);
            // Boots
            cx.fillStyle = '#304020';
            cx.fillRect(-3, 10, 3, 2);
            cx.fillRect(1, 10, 3, 2);
            // Body (leather)
            cx.fillStyle = '#50b050';
            cx.fillRect(-5, -4, 10, 9);
            cx.strokeStyle = '#408040'; cx.lineWidth = 0.5;
            cx.beginPath(); cx.moveTo(-2, -4); cx.lineTo(1, 4); cx.stroke();
            // Belt
            cx.fillStyle = '#604020';
            cx.fillRect(-5, 3, 10, 2);
            // Quiver (on back)
            cx.fillStyle = '#604020';
            cx.fillRect(-7, -6, 3, 10);
            cx.strokeStyle = '#503010'; cx.lineWidth = 0.5;
            cx.strokeRect(-7, -6, 3, 10);
            // Arrow tips in quiver
            cx.fillStyle = '#c0c8d0';
            cx.beginPath(); cx.moveTo(-6, -8); cx.lineTo(-5, -6); cx.lineTo(-7, -6); cx.closePath(); cx.fill();
            cx.beginPath(); cx.moveTo(-5.5, -7); cx.lineTo(-4.5, -5); cx.lineTo(-6.5, -5); cx.closePath(); cx.fill();
            // Arms
            cx.fillStyle = '#50b050';
            cx.fillRect(5, -2, 3, 5);
            // Head
            cx.fillStyle = '#c0a080';
            cx.beginPath(); cx.arc(0, -8, 5, 0, Math.PI * 2); cx.fill();
            // Hood
            cx.fillStyle = '#408040';
            cx.beginPath(); cx.arc(0, -9, 6, Math.PI * 1.1, -0.1); cx.fill();
            // Eyes
            cx.fillStyle = '#1a1a2a';
            cx.fillRect(-2, -9, 1.5, 1);
            cx.fillRect(1, -9, 1.5, 1);
            // Bow (right side)
            cx.strokeStyle = '#806040'; cx.lineWidth = 1.5; cx.lineCap = 'round';
            cx.beginPath();
            cx.moveTo(9, -10); cx.quadraticCurveTo(12, 0, 9, 10);
            cx.stroke();
            // Bow string
            cx.strokeStyle = '#c0b8a0'; cx.lineWidth = 0.5;
            cx.beginPath(); cx.moveTo(9, -10); cx.lineTo(9, 10); cx.stroke();
        });

        // --- CAVALRY ---
        this._make('unit_cavalry', 40, 36, (cx) => {
            cx.translate(20, 20);
            // Horse body
            cx.fillStyle = '#80602a';
            cx.beginPath();
            cx.ellipse(0, 4, 14, 7, 0, 0, Math.PI * 2); cx.fill();
            // Horse head
            cx.fillStyle = '#80602a';
            cx.beginPath();
            cx.ellipse(12, -4, 5, 4, 0.3, 0, Math.PI * 2); cx.fill();
            // Horse ear
            cx.beginPath(); cx.moveTo(14, -8); cx.lineTo(16, -12); cx.lineTo(17, -8); cx.closePath();
            cx.fill();
            // Horse eye
            cx.fillStyle = '#1a1a2a';
            cx.beginPath(); cx.arc(14, -5, 1, 0, Math.PI * 2); cx.fill();
            // Mane
            cx.fillStyle = '#402a10';
            cx.beginPath();
            cx.moveTo(8, -8); cx.quadraticCurveTo(4, -12, 0, -8);
            cx.lineTo(0, -4); cx.lineTo(8, -6); cx.closePath();
            cx.fill();
            // Horse legs
            cx.fillStyle = '#70501a';
            cx.fillRect(-10, 9, 3, 7); cx.fillRect(-4, 9, 3, 7);
            cx.fillRect(4, 9, 3, 7); cx.fillRect(10, 9, 3, 7);
            // Hooves
            cx.fillStyle = '#303030';
            cx.fillRect(-10, 14, 3, 2); cx.fillRect(-4, 14, 3, 2);
            cx.fillRect(4, 14, 3, 2); cx.fillRect(10, 14, 3, 2);
            // Tail
            cx.strokeStyle = '#402a10'; cx.lineWidth = 2; cx.lineCap = 'round';
            cx.beginPath(); cx.moveTo(-14, 2); cx.quadraticCurveTo(-18, 6, -16, 10); cx.stroke();
            // Saddle
            cx.fillStyle = '#c0a040';
            cx.fillRect(-4, -4, 8, 4);
            cx.strokeStyle = '#806020'; cx.lineWidth = 0.5;
            cx.strokeRect(-4, -4, 8, 4);
            // Rider body
            cx.fillStyle = '#c0a040';
            cx.fillRect(-3, -13, 6, 9);
            // Rider head
            cx.fillStyle = '#c0a080';
            cx.beginPath(); cx.arc(0, -17, 4, 0, Math.PI * 2); cx.fill();
            // Rider helmet
            cx.fillStyle = '#808890';
            cx.beginPath(); cx.arc(0, -18, 4.5, Math.PI, 0); cx.fill();
            // Lance
            cx.strokeStyle = '#806040'; cx.lineWidth = 1.5;
            cx.beginPath(); cx.moveTo(5, -10); cx.lineTo(18, -18); cx.stroke();
            cx.fillStyle = '#c0c8d0';
            cx.beginPath(); cx.moveTo(18, -18); cx.lineTo(16, -16); cx.lineTo(19, -17); cx.closePath(); cx.fill();
        });

        // --- BRUTE ---
        this._make('unit_brute', 36, 36, (cx) => {
            cx.translate(18, 18);
            // Legs (thick)
            cx.fillStyle = '#504030';
            cx.fillRect(-5, 5, 5, 9);
            cx.fillRect(1, 5, 5, 9);
            // Boots
            cx.fillStyle = '#403020';
            cx.fillRect(-6, 12, 6, 3);
            cx.fillRect(0, 12, 6, 3);
            // Body (massive)
            cx.fillStyle = '#c05040';
            cx.beginPath();
            cx.moveTo(-10, -6); cx.lineTo(10, -6);
            cx.lineTo(8, 6); cx.lineTo(-8, 6); cx.closePath();
            cx.fill();
            cx.strokeStyle = '#a03020'; cx.lineWidth = 0.5; cx.stroke();
            // Chest fur/leather
            cx.fillStyle = '#604020';
            cx.fillRect(-6, -4, 12, 3);
            // Belt with skulls
            cx.fillStyle = '#604020';
            cx.fillRect(-8, 4, 16, 2);
            cx.fillStyle = '#d0c8b0';
            cx.beginPath(); cx.arc(0, 5, 2, 0, Math.PI * 2); cx.fill();
            cx.fillStyle = '#1a1a2a';
            cx.fillRect(-0.5, 4.5, 0.5, 0.5);
            cx.fillRect(0.5, 4.5, 0.5, 0.5);
            // Arms (massive)
            cx.fillStyle = '#c05040';
            cx.fillRect(-14, -4, 5, 9);
            cx.fillRect(9, -4, 5, 9);
            // Forearm wraps
            cx.fillStyle = '#604020';
            cx.fillRect(-14, 0, 5, 3);
            cx.fillRect(9, 0, 5, 3);
            // Head (smaller relative to body)
            cx.fillStyle = '#a08060';
            cx.beginPath(); cx.arc(0, -10, 6, 0, Math.PI * 2); cx.fill();
            // Brow ridge
            cx.fillStyle = '#806040';
            cx.fillRect(-5, -13, 10, 3);
            // Eyes (angry)
            cx.fillStyle = '#e0e020';
            cx.fillRect(-3, -11, 2, 1.5);
            cx.fillRect(1, -11, 2, 1.5);
            // Tusks
            cx.fillStyle = '#e0d8c0';
            cx.beginPath(); cx.moveTo(-3, -6); cx.lineTo(-2, -8); cx.lineTo(-1, -6); cx.closePath(); cx.fill();
            cx.beginPath(); cx.moveTo(1, -6); cx.lineTo(2, -8); cx.lineTo(3, -6); cx.closePath(); cx.fill();
            // Giant axe (right hand)
            cx.save();
            cx.translate(13, -4);
            // Shaft
            cx.fillStyle = '#604020';
            cx.fillRect(-1, -4, 2.5, 18);
            // Axe head
            cx.fillStyle = '#808890';
            cx.beginPath();
            cx.moveTo(1, -4); cx.quadraticCurveTo(8, -6, 9, 0);
            cx.quadraticCurveTo(8, 4, 1, 2);
            cx.closePath(); cx.fill();
            cx.strokeStyle = '#606870'; cx.lineWidth = 0.5; cx.stroke();
            cx.restore();
        });
    },

    // ========================================================
    // ENEMY SPRITES (goblin, orc, dark archer, troll)
    // Size: 32×32
    // ========================================================
    _buildEnemySprites() {
        // --- GOBLIN ---
        this._make('enemy_goblin', 28, 28, (cx) => {
            cx.translate(14, 14);
            // Legs (skinny)
            cx.fillStyle = '#708030';
            cx.fillRect(-2, 3, 2, 6);
            cx.fillRect(1, 3, 2, 6);
            cx.fillStyle = '#506020';
            cx.fillRect(-3, 8, 3, 2);
            cx.fillRect(0, 8, 3, 2);
            // Body (hunched)
            cx.fillStyle = '#80a030';
            cx.beginPath();
            cx.moveTo(-5, -2); cx.lineTo(5, -2);
            cx.lineTo(4, 4); cx.lineTo(-4, 4); cx.closePath();
            cx.fill();
            // Ragged cloth
            cx.fillStyle = '#504020';
            cx.fillRect(-4, 0, 8, 2);
            // Arms (long)
            cx.fillStyle = '#80a030';
            cx.fillRect(-8, -1, 3, 6);
            cx.fillRect(5, -1, 3, 6);
            // Head (large for body)
            cx.fillStyle = '#80a030';
            cx.beginPath(); cx.arc(0, -6, 5, 0, Math.PI * 2); cx.fill();
            // Big ears
            cx.beginPath(); cx.moveTo(-5, -7); cx.lineTo(-10, -10); cx.lineTo(-6, -4); cx.closePath(); cx.fill();
            cx.beginPath(); cx.moveTo(5, -7); cx.lineTo(10, -10); cx.lineTo(6, -4); cx.closePath(); cx.fill();
            // Eyes (beady, red)
            cx.fillStyle = '#e04020';
            cx.beginPath(); cx.arc(-2, -6, 1.2, 0, Math.PI * 2); cx.fill();
            cx.beginPath(); cx.arc(2, -6, 1.2, 0, Math.PI * 2); cx.fill();
            // Mouth
            cx.strokeStyle = '#506020'; cx.lineWidth = 0.5;
            cx.beginPath(); cx.arc(0, -3, 2, 0, Math.PI); cx.stroke();
            // Crude dagger
            cx.fillStyle = '#a0a0a0';
            cx.beginPath(); cx.moveTo(8, -2); cx.lineTo(7, -8); cx.lineTo(9, -8); cx.closePath(); cx.fill();
            cx.fillStyle = '#604020';
            cx.fillRect(7, -2, 2, 3);
        });

        // --- ORC WARRIOR ---
        this._make('enemy_orcWarrior', 34, 34, (cx) => {
            cx.translate(17, 17);
            // Legs
            cx.fillStyle = '#406020';
            cx.fillRect(-4, 4, 3, 9);
            cx.fillRect(1, 4, 3, 9);
            // Heavy boots
            cx.fillStyle = '#303020';
            cx.fillRect(-5, 11, 5, 3);
            cx.fillRect(0, 11, 5, 3);
            // Body (heavy armor)
            cx.fillStyle = '#508030';
            cx.beginPath();
            cx.moveTo(-8, -4); cx.lineTo(8, -4);
            cx.lineTo(7, 5); cx.lineTo(-7, 5); cx.closePath();
            cx.fill();
            // Crude plate armor
            cx.fillStyle = '#505830';
            cx.fillRect(-6, -3, 12, 4);
            cx.strokeStyle = '#404830'; cx.lineWidth = 0.5;
            cx.strokeRect(-6, -3, 12, 4);
            // Belt
            cx.fillStyle = '#403010';
            cx.fillRect(-7, 3, 14, 2);
            // Arms
            cx.fillStyle = '#508030';
            cx.fillRect(-11, -3, 4, 7);
            cx.fillRect(7, -3, 4, 7);
            // Shoulder plate
            cx.fillStyle = '#505830';
            cx.beginPath(); cx.ellipse(-9, -4, 4, 2.5, 0, 0, Math.PI * 2); cx.fill();
            cx.beginPath(); cx.ellipse(9, -4, 4, 2.5, 0, 0, Math.PI * 2); cx.fill();
            // Head
            cx.fillStyle = '#508030';
            cx.beginPath(); cx.arc(0, -8, 6, 0, Math.PI * 2); cx.fill();
            // Brow ridge
            cx.fillStyle = '#406020';
            cx.fillRect(-5, -11, 10, 3);
            // Eyes
            cx.fillStyle = '#e0e020';
            cx.fillRect(-3, -9, 2, 1.5);
            cx.fillRect(1, -9, 2, 1.5);
            // Tusks
            cx.fillStyle = '#e0d8c0';
            cx.beginPath(); cx.moveTo(-2, -4); cx.lineTo(-1.5, -6); cx.lineTo(-1, -4); cx.closePath(); cx.fill();
            cx.beginPath(); cx.moveTo(1, -4); cx.lineTo(1.5, -6); cx.lineTo(2, -4); cx.closePath(); cx.fill();
            // Sword
            cx.fillStyle = '#808890';
            cx.fillRect(10, -8, 2, 12);
            cx.fillStyle = '#605030';
            cx.fillRect(9, 0, 4, 2);
            cx.fillRect(10, 2, 2, 4);
        });

        // --- DARK ARCHER ---
        this._make('enemy_darkArcher', 30, 30, (cx) => {
            cx.translate(15, 15);
            // Legs
            cx.fillStyle = '#302010';
            cx.fillRect(-3, 4, 3, 7);
            cx.fillRect(1, 4, 3, 7);
            cx.fillStyle = '#201008';
            cx.fillRect(-3, 9, 3, 2);
            cx.fillRect(1, 9, 3, 2);
            // Body (dark leather)
            cx.fillStyle = '#906030';
            cx.fillRect(-5, -3, 10, 8);
            cx.strokeStyle = '#704820'; cx.lineWidth = 0.5;
            cx.beginPath(); cx.moveTo(-2, -3); cx.lineTo(1, 4); cx.stroke();
            // Belt
            cx.fillStyle = '#403020';
            cx.fillRect(-5, 3, 10, 2);
            // Hooded cloak
            cx.fillStyle = '#302010';
            cx.fillRect(-6, -4, 12, 8);
            // Arms
            cx.fillStyle = '#302010';
            cx.fillRect(-8, -2, 3, 5);
            cx.fillRect(5, -2, 3, 5);
            // Head
            cx.fillStyle = '#906030';
            cx.beginPath(); cx.arc(0, -7, 5, 0, Math.PI * 2); cx.fill();
            // Dark hood
            cx.fillStyle = '#302010';
            cx.beginPath(); cx.arc(0, -8, 6, Math.PI * 1.05, -0.05); cx.fill();
            cx.beginPath();
            cx.moveTo(-6, -8); cx.lineTo(-5, -3);
            cx.lineTo(5, -3); cx.lineTo(6, -8);
            cx.closePath(); cx.fill();
            // Glowing eyes
            cx.fillStyle = '#ff4020';
            cx.beginPath(); cx.arc(-2, -7, 1, 0, Math.PI * 2); cx.fill();
            cx.beginPath(); cx.arc(2, -7, 1, 0, Math.PI * 2); cx.fill();
            // Dark bow
            cx.strokeStyle = '#302010'; cx.lineWidth = 2; cx.lineCap = 'round';
            cx.beginPath();
            cx.moveTo(9, -10); cx.quadraticCurveTo(13, 0, 9, 10);
            cx.stroke();
            cx.strokeStyle = '#806020'; cx.lineWidth = 0.5;
            cx.beginPath(); cx.moveTo(9, -10); cx.lineTo(9, 10); cx.stroke();
        });

        // --- TROLL ---
        this._make('enemy_troll', 38, 42, (cx) => {
            cx.translate(19, 22);
            // Legs (thick)
            cx.fillStyle = '#507040';
            cx.fillRect(-5, 6, 5, 10);
            cx.fillRect(1, 6, 5, 10);
            // Feet (large)
            cx.fillStyle = '#406030';
            cx.fillRect(-7, 14, 7, 4);
            cx.fillRect(0, 14, 7, 4);
            // Toes
            cx.fillStyle = '#507040';
            cx.beginPath(); cx.arc(-5, 18, 1.5, 0, Math.PI * 2); cx.fill();
            cx.beginPath(); cx.arc(-2, 18, 1.5, 0, Math.PI * 2); cx.fill();
            cx.beginPath(); cx.arc(2, 18, 1.5, 0, Math.PI * 2); cx.fill();
            cx.beginPath(); cx.arc(5, 18, 1.5, 0, Math.PI * 2); cx.fill();
            // Body (hunched, massive)
            cx.fillStyle = '#607848';
            cx.beginPath();
            cx.moveTo(-12, -6); cx.lineTo(12, -6);
            cx.lineTo(10, 7); cx.lineTo(-10, 7); cx.closePath();
            cx.fill();
            // Belly
            cx.fillStyle = '#708058';
            cx.beginPath(); cx.ellipse(0, 2, 8, 5, 0, 0, Math.PI * 2); cx.fill();
            // Loincloth
            cx.fillStyle = '#504020';
            cx.beginPath();
            cx.moveTo(-8, 5); cx.lineTo(8, 5);
            cx.lineTo(6, 10); cx.lineTo(-6, 10); cx.closePath();
            cx.fill();
            // Arms (very long)
            cx.fillStyle = '#607848';
            cx.fillRect(-16, -4, 5, 12);
            cx.fillRect(11, -4, 5, 12);
            // Hands
            cx.fillStyle = '#507040';
            cx.beginPath(); cx.arc(-14, 9, 3, 0, Math.PI * 2); cx.fill();
            cx.beginPath(); cx.arc(14, 9, 3, 0, Math.PI * 2); cx.fill();
            // Head (small for body)
            cx.fillStyle = '#607848';
            cx.beginPath(); cx.arc(0, -11, 7, 0, Math.PI * 2); cx.fill();
            // Brow
            cx.fillStyle = '#506838';
            cx.fillRect(-6, -14, 12, 3);
            // Small angry eyes
            cx.fillStyle = '#e0e020';
            cx.fillRect(-3, -12, 2, 1.5);
            cx.fillRect(2, -12, 2, 1.5);
            // Wide mouth
            cx.fillStyle = '#304020';
            cx.beginPath(); cx.arc(0, -7, 4, 0, Math.PI); cx.fill();
            // Teeth
            cx.fillStyle = '#e0d8c0';
            cx.fillRect(-2, -7, 1.5, 2);
            cx.fillRect(1, -7, 1.5, 2);
            // Nose
            cx.fillStyle = '#507040';
            cx.beginPath(); cx.arc(0, -9, 2, 0, Math.PI * 2); cx.fill();
            // Club in right hand
            cx.save();
            cx.translate(14, 4);
            cx.rotate(0.3);
            cx.fillStyle = '#604020';
            cx.fillRect(-2, -14, 4, 14);
            // Club head
            cx.beginPath(); cx.ellipse(0, -14, 5, 4, 0, 0, Math.PI * 2);
            cx.fillStyle = '#504018'; cx.fill();
            // Nails in club
            cx.fillStyle = '#a0a8b0';
            cx.beginPath(); cx.arc(-3, -15, 1, 0, Math.PI * 2); cx.fill();
            cx.beginPath(); cx.arc(2, -13, 1, 0, Math.PI * 2); cx.fill();
            cx.beginPath(); cx.arc(0, -16, 1, 0, Math.PI * 2); cx.fill();
            cx.restore();
        });
    },

    // ========================================================
    // BOSS SPRITE (Warlord Grimtusk)
    // Size: 64×64
    // ========================================================
    _buildBossSprite() {
        this._make('boss_grimtusk', 64, 64, (cx) => {
            cx.translate(32, 34);
            // Legs (armored)
            cx.fillStyle = '#403820';
            cx.fillRect(-7, 8, 6, 12);
            cx.fillRect(1, 8, 6, 12);
            // Heavy boots
            cx.fillStyle = '#303020';
            cx.fillRect(-8, 18, 8, 4);
            cx.fillRect(0, 18, 8, 4);
            // Body (massive armored)
            cx.fillStyle = '#505040';
            cx.beginPath();
            cx.moveTo(-16, -8); cx.lineTo(16, -8);
            cx.lineTo(14, 10); cx.lineTo(-14, 10); cx.closePath();
            cx.fill();
            // Heavy plate armor
            cx.fillStyle = '#606050';
            cx.fillRect(-12, -6, 24, 8);
            cx.strokeStyle = '#404030'; cx.lineWidth = 1;
            cx.strokeRect(-12, -6, 24, 8);
            // Skull emblem on chest
            cx.fillStyle = '#c0b890';
            cx.beginPath(); cx.arc(0, -2, 4, 0, Math.PI * 2); cx.fill();
            cx.fillStyle = '#505040';
            cx.fillRect(-1.5, -3, 1, 1); cx.fillRect(0.5, -3, 1, 1);
            cx.beginPath(); cx.arc(0, 0, 1, 0, Math.PI); cx.fill();
            // Belt with trophy skulls
            cx.fillStyle = '#604020';
            cx.fillRect(-14, 6, 28, 3);
            cx.fillStyle = '#d0c8b0';
            cx.beginPath(); cx.arc(-6, 7, 2, 0, Math.PI * 2); cx.fill();
            cx.beginPath(); cx.arc(0, 7, 2, 0, Math.PI * 2); cx.fill();
            cx.beginPath(); cx.arc(6, 7, 2, 0, Math.PI * 2); cx.fill();
            // Arms
            cx.fillStyle = '#505040';
            cx.fillRect(-20, -6, 5, 12);
            cx.fillRect(15, -6, 5, 12);
            // Massive shoulder pauldrons
            cx.fillStyle = '#606050';
            cx.beginPath(); cx.ellipse(-17, -8, 7, 4, 0, 0, Math.PI * 2); cx.fill();
            cx.beginPath(); cx.ellipse(17, -8, 7, 4, 0, 0, Math.PI * 2); cx.fill();
            cx.strokeStyle = '#404030'; cx.lineWidth = 0.5;
            cx.beginPath(); cx.ellipse(-17, -8, 7, 4, 0, 0, Math.PI * 2); cx.stroke();
            cx.beginPath(); cx.ellipse(17, -8, 7, 4, 0, 0, Math.PI * 2); cx.stroke();
            // Spikes on shoulders
            cx.fillStyle = '#808070';
            cx.beginPath(); cx.moveTo(-17, -12); cx.lineTo(-15, -8); cx.lineTo(-19, -8); cx.closePath(); cx.fill();
            cx.beginPath(); cx.moveTo(-21, -10); cx.lineTo(-18, -7); cx.lineTo(-20, -5); cx.closePath(); cx.fill();
            cx.beginPath(); cx.moveTo(17, -12); cx.lineTo(15, -8); cx.lineTo(19, -8); cx.closePath(); cx.fill();
            cx.beginPath(); cx.moveTo(21, -10); cx.lineTo(18, -7); cx.lineTo(20, -5); cx.closePath(); cx.fill();
            // Head
            cx.fillStyle = '#508030';
            cx.beginPath(); cx.arc(0, -14, 9, 0, Math.PI * 2); cx.fill();
            // War helmet
            cx.fillStyle = '#606050';
            cx.beginPath(); cx.arc(0, -16, 10, Math.PI, 0); cx.fill();
            cx.fillRect(-10, -16, 20, 3);
            // Helmet horns
            cx.fillStyle = '#d0c8b0';
            cx.beginPath(); cx.moveTo(-10, -16); cx.lineTo(-14, -26); cx.lineTo(-8, -16); cx.closePath(); cx.fill();
            cx.beginPath(); cx.moveTo(8, -16); cx.lineTo(14, -26); cx.lineTo(10, -16); cx.closePath(); cx.fill();
            // Eyes (fiery)
            cx.fillStyle = '#ff4020';
            cx.shadowColor = '#ff4020'; cx.shadowBlur = 6;
            cx.beginPath(); cx.arc(-4, -14, 2, 0, Math.PI * 2); cx.fill();
            cx.beginPath(); cx.arc(4, -14, 2, 0, Math.PI * 2); cx.fill();
            cx.shadowBlur = 0;
            // Tusks (large)
            cx.fillStyle = '#e0d8c0';
            cx.beginPath(); cx.moveTo(-4, -8); cx.lineTo(-3, -12); cx.lineTo(-2, -8); cx.closePath(); cx.fill();
            cx.beginPath(); cx.moveTo(2, -8); cx.lineTo(3, -12); cx.lineTo(4, -8); cx.closePath(); cx.fill();
            // Mouth scar
            cx.strokeStyle = '#304020'; cx.lineWidth = 1;
            cx.beginPath(); cx.moveTo(-3, -9); cx.lineTo(3, -9); cx.stroke();
            // Massive war-axe (right hand)
            cx.save();
            cx.translate(20, -2);
            cx.rotate(0.2);
            // Shaft
            cx.fillStyle = '#503818';
            cx.fillRect(-2, -8, 4, 24);
            // Double axe head
            cx.fillStyle = '#808890';
            cx.beginPath();
            cx.moveTo(2, -8); cx.quadraticCurveTo(14, -12, 14, -4);
            cx.quadraticCurveTo(14, 0, 2, -2);
            cx.closePath(); cx.fill();
            cx.beginPath();
            cx.moveTo(-2, -8); cx.quadraticCurveTo(-14, -12, -14, -4);
            cx.quadraticCurveTo(-14, 0, -2, -2);
            cx.closePath(); cx.fill();
            cx.strokeStyle = '#606870'; cx.lineWidth = 0.5;
            cx.beginPath();
            cx.moveTo(2, -8); cx.quadraticCurveTo(14, -12, 14, -4);
            cx.quadraticCurveTo(14, 0, 2, -2);
            cx.stroke();
            cx.beginPath();
            cx.moveTo(-2, -8); cx.quadraticCurveTo(-14, -12, -14, -4);
            cx.quadraticCurveTo(-14, 0, -2, -2);
            cx.stroke();
            cx.restore();
        });
    },

    // ========================================================
    // BUILDING ICONS (for campaign map & building screens)
    // Size: 36×36
    // ========================================================
    _buildBuildingIcons() {
        // Blacksmith
        this._make('bldg_blacksmith', 36, 36, (cx) => {
            cx.translate(18, 18);
            // Anvil
            cx.fillStyle = '#606870';
            cx.beginPath();
            cx.moveTo(-8, 2); cx.lineTo(8, 2);
            cx.lineTo(10, 6); cx.lineTo(-10, 6); cx.closePath();
            cx.fill();
            cx.fillRect(-4, 6, 8, 3);
            cx.fillRect(-6, 9, 12, 2);
            // Hammer
            cx.save();
            cx.translate(2, -4); cx.rotate(-0.5);
            cx.fillStyle = '#604020';
            cx.fillRect(-1, -2, 2, 12);
            cx.fillStyle = '#808890';
            cx.fillRect(-4, -4, 8, 4);
            cx.restore();
            // Sparks
            cx.fillStyle = '#ffa020';
            cx.beginPath(); cx.arc(-3, -2, 1.5, 0, Math.PI * 2); cx.fill();
            cx.beginPath(); cx.arc(5, -5, 1, 0, Math.PI * 2); cx.fill();
            cx.beginPath(); cx.arc(-6, -6, 1, 0, Math.PI * 2); cx.fill();
        });

        // Barracks
        this._make('bldg_barracks', 36, 36, (cx) => {
            cx.translate(18, 18);
            // Tent
            cx.fillStyle = '#5a6870';
            cx.beginPath();
            cx.moveTo(0, -12); cx.lineTo(-14, 8); cx.lineTo(14, 8); cx.closePath();
            cx.fill();
            cx.strokeStyle = '#4a5860'; cx.lineWidth = 0.5; cx.stroke();
            // Tent stripe
            cx.fillStyle = '#6a7880';
            cx.beginPath();
            cx.moveTo(0, -12); cx.lineTo(-4, 8); cx.lineTo(4, 8); cx.closePath();
            cx.fill();
            // Entrance flap
            cx.fillStyle = '#3a4850';
            cx.beginPath();
            cx.moveTo(-3, 8); cx.lineTo(0, 0); cx.lineTo(3, 8); cx.closePath();
            cx.fill();
            // Flag on top
            cx.strokeStyle = '#604020'; cx.lineWidth = 1;
            cx.beginPath(); cx.moveTo(0, -12); cx.lineTo(0, -16); cx.stroke();
            cx.fillStyle = '#c04040';
            cx.beginPath();
            cx.moveTo(0, -16); cx.lineTo(6, -14); cx.lineTo(0, -12); cx.closePath();
            cx.fill();
            // Ground line
            cx.fillStyle = '#3a3a2a';
            cx.fillRect(-14, 8, 28, 3);
        });

        // Tavern
        this._make('bldg_tavern', 36, 36, (cx) => {
            cx.translate(18, 18);
            // Mug body
            cx.fillStyle = '#a08040';
            cx.beginPath();
            cx.moveTo(-7, -6); cx.lineTo(7, -6);
            cx.lineTo(6, 10); cx.lineTo(-6, 10); cx.closePath();
            cx.fill();
            cx.strokeStyle = '#806020'; cx.lineWidth = 1; cx.stroke();
            // Handle
            cx.strokeStyle = '#a08040'; cx.lineWidth = 2.5;
            cx.beginPath();
            cx.moveTo(7, -3); cx.quadraticCurveTo(13, 0, 13, 4);
            cx.quadraticCurveTo(13, 8, 7, 8);
            cx.stroke();
            // Foam
            cx.fillStyle = '#f0e8d0';
            cx.beginPath();
            cx.ellipse(0, -6, 8, 3, 0, 0, Math.PI * 2);
            cx.fill();
            // Beer color
            cx.fillStyle = '#c08020';
            cx.fillRect(-5, -4, 10, 13);
            // Foam drips
            cx.fillStyle = '#f0e8d0';
            cx.beginPath(); cx.ellipse(-4, -4, 2, 3, 0, 0, Math.PI * 2); cx.fill();
            cx.beginPath(); cx.ellipse(3, -3, 1.5, 2, 0, 0, Math.PI * 2); cx.fill();
        });

        // Healer
        this._make('bldg_healer', 36, 36, (cx) => {
            cx.translate(18, 18);
            // Potion bottle (large)
            cx.beginPath();
            cx.moveTo(-3, -8); cx.lineTo(3, -8);
            cx.lineTo(3, -4); cx.quadraticCurveTo(10, -2, 10, 6);
            cx.quadraticCurveTo(10, 12, 0, 12);
            cx.quadraticCurveTo(-10, 12, -10, 6);
            cx.quadraticCurveTo(-10, -2, -3, -4);
            cx.closePath();
            cx.fillStyle = '#c03040'; cx.fill();
            cx.strokeStyle = '#802020'; cx.lineWidth = 1; cx.stroke();
            // Cork
            cx.fillStyle = '#a08060';
            cx.fillRect(-4, -12, 8, 5);
            cx.strokeStyle = '#806040'; cx.lineWidth = 0.5;
            cx.strokeRect(-4, -12, 8, 5);
            // Cross symbol
            cx.fillStyle = '#f0e0e0';
            cx.fillRect(-1.5, 1, 3, 8);
            cx.fillRect(-4, 3.5, 8, 3);
            // Liquid highlight
            cx.fillStyle = 'rgba(255,255,255,0.2)';
            cx.beginPath(); cx.ellipse(-4, 5, 3, 5, -0.2, 0, Math.PI * 2); cx.fill();
        });

        // Market
        this._make('bldg_market', 36, 36, (cx) => {
            cx.translate(18, 18);
            // Chest body
            cx.fillStyle = '#806030';
            cx.fillRect(-12, -2, 24, 12);
            cx.strokeStyle = '#604020'; cx.lineWidth = 1;
            cx.strokeRect(-12, -2, 24, 12);
            // Chest lid
            cx.fillStyle = '#906838';
            cx.beginPath();
            cx.moveTo(-12, -2); cx.quadraticCurveTo(0, -10, 12, -2);
            cx.closePath(); cx.fill();
            cx.strokeStyle = '#604020'; cx.lineWidth = 0.5; cx.stroke();
            // Metal bands
            cx.fillStyle = '#a08040';
            cx.fillRect(-12, 2, 24, 2);
            cx.fillRect(-12, 7, 24, 2);
            // Lock
            cx.fillStyle = '#e8c840';
            cx.fillRect(-2, 3, 4, 3);
            cx.beginPath(); cx.arc(0, 3, 2, Math.PI, 0); cx.strokeStyle = '#e8c840'; cx.lineWidth = 1.5; cx.stroke();
            // Gold coins spilling out
            cx.fillStyle = '#e8c840';
            cx.beginPath(); cx.arc(-6, -5, 3, 0, Math.PI * 2); cx.fill();
            cx.beginPath(); cx.arc(4, -6, 2.5, 0, Math.PI * 2); cx.fill();
            cx.beginPath(); cx.arc(-2, -7, 2, 0, Math.PI * 2); cx.fill();
            cx.strokeStyle = '#a08020'; cx.lineWidth = 0.5;
            cx.beginPath(); cx.arc(-6, -5, 3, 0, Math.PI * 2); cx.stroke();
            cx.beginPath(); cx.arc(4, -6, 2.5, 0, Math.PI * 2); cx.stroke();
        });
    },

    // ========================================================
    // CAMPAIGN MAP NODE ICONS
    // Size: 28×28
    // ========================================================
    _buildNodeIcons() {
        // Battle node - crossed swords
        this._make('node_battle', 28, 28, (cx) => {
            cx.translate(14, 14);
            // Sword 1 (leaning left)
            cx.save(); cx.rotate(-0.5);
            cx.fillStyle = '#c0c8d0';
            cx.beginPath();
            cx.moveTo(0, -10); cx.lineTo(-1.5, -4); cx.lineTo(0, 4); cx.lineTo(1.5, -4);
            cx.closePath(); cx.fill();
            cx.fillStyle = '#a08030'; cx.fillRect(-3, 3, 6, 1.5);
            cx.fillStyle = '#604020'; cx.fillRect(-0.8, 4.5, 1.6, 4);
            cx.restore();
            // Sword 2 (leaning right)
            cx.save(); cx.rotate(0.5);
            cx.fillStyle = '#c0c8d0';
            cx.beginPath();
            cx.moveTo(0, -10); cx.lineTo(-1.5, -4); cx.lineTo(0, 4); cx.lineTo(1.5, -4);
            cx.closePath(); cx.fill();
            cx.fillStyle = '#a08030'; cx.fillRect(-3, 3, 6, 1.5);
            cx.fillStyle = '#604020'; cx.fillRect(-0.8, 4.5, 1.6, 4);
            cx.restore();
        });

        // Elite node - skull & sword
        this._make('node_elite', 28, 28, (cx) => {
            cx.translate(14, 14);
            // Skull
            cx.fillStyle = '#e0d8c0';
            cx.beginPath(); cx.ellipse(0, -1, 6, 7, 0, Math.PI, 0); cx.fill();
            cx.beginPath();
            cx.moveTo(-5, -1); cx.quadraticCurveTo(-5, 5, -2, 6);
            cx.lineTo(2, 6); cx.quadraticCurveTo(5, 5, 5, -1);
            cx.fill();
            cx.fillStyle = '#1a1a2a';
            cx.beginPath(); cx.ellipse(-2, -1, 2, 2.5, 0, 0, Math.PI * 2); cx.fill();
            cx.beginPath(); cx.ellipse(2, -1, 2, 2.5, 0, 0, Math.PI * 2); cx.fill();
            cx.beginPath(); cx.moveTo(-0.5, 2); cx.lineTo(0.5, 2); cx.lineTo(0, 3.5); cx.closePath(); cx.fill();
            // Glow
            cx.shadowColor = '#e06020'; cx.shadowBlur = 4;
            cx.fillStyle = '#e06020';
            cx.beginPath(); cx.arc(-2, -1, 1, 0, Math.PI * 2); cx.fill();
            cx.beginPath(); cx.arc(2, -1, 1, 0, Math.PI * 2); cx.fill();
            cx.shadowBlur = 0;
        });

        // Boss node - crown
        this._make('node_boss', 28, 28, (cx) => {
            cx.translate(14, 14);
            cx.fillStyle = '#ff3030';
            cx.beginPath();
            cx.moveTo(-10, 4); cx.lineTo(-10, -3); cx.lineTo(-5, 1);
            cx.lineTo(0, -7); cx.lineTo(5, 1); cx.lineTo(10, -3);
            cx.lineTo(10, 4); cx.closePath();
            cx.fill();
            cx.strokeStyle = '#a02020'; cx.lineWidth = 0.5; cx.stroke();
            cx.fillStyle = '#c02020'; cx.fillRect(-10, 4, 20, 3);
            cx.fillStyle = '#e8c840';
            cx.beginPath(); cx.arc(0, 0, 2, 0, Math.PI * 2); cx.fill();
            cx.fillStyle = '#4060c0';
            cx.beginPath(); cx.arc(-5, 2, 1.5, 0, Math.PI * 2); cx.fill();
            cx.beginPath(); cx.arc(5, 2, 1.5, 0, Math.PI * 2); cx.fill();
        });

        // Event node - question mark scroll
        this._make('node_event', 28, 28, (cx) => {
            cx.translate(14, 14);
            // Scroll
            cx.fillStyle = '#c0b090';
            cx.fillRect(-7, -6, 14, 14);
            cx.beginPath(); cx.arc(-7, -6, 2, 0, Math.PI * 2); cx.fill();
            cx.beginPath(); cx.arc(-7, 8, 2, 0, Math.PI * 2); cx.fill();
            cx.beginPath(); cx.arc(7, -6, 2, 0, Math.PI * 2); cx.fill();
            cx.beginPath(); cx.arc(7, 8, 2, 0, Math.PI * 2); cx.fill();
            cx.strokeStyle = '#907050'; cx.lineWidth = 0.5;
            cx.strokeRect(-7, -6, 14, 14);
            // Question mark
            cx.font = 'bold 16px Segoe UI'; cx.fillStyle = '#8060c0';
            cx.textAlign = 'center'; cx.textBaseline = 'middle';
            cx.fillText('?', 0, 1);
        });

        // Capital node - castle
        this._make('node_capital', 28, 28, (cx) => {
            cx.translate(14, 14);
            // Main wall
            cx.fillStyle = '#8a8070';
            cx.fillRect(-10, -2, 20, 12);
            // Towers
            cx.fillRect(-12, -6, 6, 16);
            cx.fillRect(6, -6, 6, 16);
            // Tower tops (crenellations)
            cx.fillStyle = '#9a9080';
            for (let i = 0; i < 3; i++) {
                cx.fillRect(-12 + i * 2.5, -8, 1.5, 2);
                cx.fillRect(6 + i * 2.5, -8, 1.5, 2);
            }
            // Gate
            cx.fillStyle = '#403020';
            cx.beginPath();
            cx.moveTo(-3, 10); cx.lineTo(-3, 3);
            cx.quadraticCurveTo(0, 0, 3, 3);
            cx.lineTo(3, 10); cx.closePath();
            cx.fill();
            // Flag
            cx.strokeStyle = '#604020'; cx.lineWidth = 1;
            cx.beginPath(); cx.moveTo(0, -2); cx.lineTo(0, -10); cx.stroke();
            cx.fillStyle = '#e0c060';
            cx.beginPath(); cx.moveTo(0, -10); cx.lineTo(5, -8); cx.lineTo(0, -6); cx.closePath(); cx.fill();
        });
    },

    // ========================================================
    // SKILL ICONS (per class)
    // Size: 28×28
    // ========================================================
    _buildSkillIcons() {
        // Warrior skills
        this._make('skill_cleave', 28, 28, (cx) => {
            cx.translate(14, 14);
            cx.strokeStyle = '#ffddaa'; cx.lineWidth = 3; cx.lineCap = 'round';
            cx.beginPath(); cx.arc(0, 0, 10, -0.8, 0.8); cx.stroke();
            cx.fillStyle = '#c0c8d0';
            cx.beginPath();
            cx.moveTo(8, -8); cx.quadraticCurveTo(12, -4, 10, 0);
            cx.quadraticCurveTo(12, 4, 8, 4); cx.lineTo(4, 0); cx.closePath();
            cx.fill();
        });

        this._make('skill_charge', 28, 28, (cx) => {
            cx.translate(14, 14);
            // Speed lines
            cx.strokeStyle = '#ffa040'; cx.lineWidth = 1.5; cx.lineCap = 'round';
            cx.beginPath(); cx.moveTo(-10, -2); cx.lineTo(-4, -2); cx.stroke();
            cx.beginPath(); cx.moveTo(-10, 2); cx.lineTo(-4, 2); cx.stroke();
            cx.beginPath(); cx.moveTo(-8, 0); cx.lineTo(-2, 0); cx.stroke();
            // Shield
            cx.fillStyle = '#4060a0';
            cx.beginPath();
            cx.moveTo(4, -6); cx.quadraticCurveTo(10, -6, 10, 0);
            cx.quadraticCurveTo(10, 6, 4, 8); cx.quadraticCurveTo(-2, 6, -2, 0);
            cx.quadraticCurveTo(-2, -6, 4, -6);
            cx.closePath(); cx.fill();
            cx.strokeStyle = '#6080c0'; cx.lineWidth = 1; cx.stroke();
        });

        this._make('skill_guardStance', 28, 28, (cx) => {
            cx.translate(14, 14);
            // Large shield
            cx.beginPath();
            cx.moveTo(0, -10);
            cx.quadraticCurveTo(12, -10, 12, 0);
            cx.quadraticCurveTo(12, 10, 0, 12);
            cx.quadraticCurveTo(-12, 10, -12, 0);
            cx.quadraticCurveTo(-12, -10, 0, -10);
            cx.closePath();
            cx.fillStyle = '#4060a0'; cx.fill();
            cx.strokeStyle = '#8090b0'; cx.lineWidth = 1.5; cx.stroke();
            cx.strokeStyle = '#6080c0'; cx.lineWidth = 1;
            cx.beginPath(); cx.moveTo(0, -7); cx.lineTo(0, 9); cx.stroke();
            cx.beginPath(); cx.moveTo(-8, 0); cx.lineTo(8, 0); cx.stroke();
        });

        // Samurai skills
        this._make('skill_dashSlash', 28, 28, (cx) => {
            cx.translate(14, 14);
            // Motion blur
            cx.fillStyle = 'rgba(200,200,255,0.3)';
            cx.fillRect(-12, -3, 10, 6);
            // Slash arc
            cx.strokeStyle = '#c0c0ff'; cx.lineWidth = 2; cx.lineCap = 'round';
            cx.beginPath(); cx.arc(4, 0, 8, -1.2, 1.2); cx.stroke();
            // Blade tip
            cx.fillStyle = '#e0e8f0';
            cx.beginPath(); cx.moveTo(12, -2); cx.lineTo(10, 0); cx.lineTo(12, 2); cx.closePath(); cx.fill();
        });

        this._make('skill_parryStance', 28, 28, (cx) => {
            cx.translate(14, 14);
            // Two crossed blades
            cx.strokeStyle = '#ff8040'; cx.lineWidth = 2; cx.lineCap = 'round';
            cx.beginPath(); cx.moveTo(-8, -8); cx.lineTo(8, 8); cx.stroke();
            cx.beginPath(); cx.moveTo(8, -8); cx.lineTo(-8, 8); cx.stroke();
            // Spark at center
            cx.fillStyle = '#ffe040';
            cx.beginPath(); cx.arc(0, 0, 3, 0, Math.PI * 2); cx.fill();
            cx.fillStyle = '#fff';
            cx.beginPath(); cx.arc(0, 0, 1.5, 0, Math.PI * 2); cx.fill();
        });

        this._make('skill_crescentStrike', 28, 28, (cx) => {
            cx.translate(14, 14);
            // Crescent arc
            cx.strokeStyle = '#c0c0ff'; cx.lineWidth = 3; cx.lineCap = 'round';
            cx.beginPath(); cx.arc(0, 0, 10, -1.5, 1.5); cx.stroke();
            // Inner glow
            cx.strokeStyle = '#e0e0ff'; cx.lineWidth = 1.5;
            cx.beginPath(); cx.arc(0, 0, 7, -1.2, 1.2); cx.stroke();
            // Sparkles
            cx.fillStyle = '#fff';
            cx.beginPath(); cx.arc(9, -4, 1.5, 0, Math.PI * 2); cx.fill();
            cx.beginPath(); cx.arc(8, 5, 1, 0, Math.PI * 2); cx.fill();
        });

        // Ninja skills
        this._make('skill_shadowStep', 28, 28, (cx) => {
            cx.translate(14, 14);
            // Shadow figure (fading)
            cx.fillStyle = 'rgba(40,40,60,0.6)';
            cx.beginPath(); cx.arc(-5, -2, 6, 0, Math.PI * 2); cx.fill();
            cx.fillStyle = 'rgba(40,40,60,0.3)';
            cx.beginPath(); cx.arc(-8, -2, 5, 0, Math.PI * 2); cx.fill();
            // Arrival figure
            cx.fillStyle = '#1a1a2a';
            cx.beginPath(); cx.arc(5, -2, 5, 0, Math.PI * 2); cx.fill();
            // Eyes
            cx.fillStyle = '#c03030';
            cx.fillRect(3.5, -3, 1, 1); cx.fillRect(5.5, -3, 1, 1);
            // Motion trail
            cx.strokeStyle = 'rgba(100,40,100,0.4)'; cx.lineWidth = 1;
            cx.setLineDash([2, 2]);
            cx.beginPath(); cx.moveTo(-10, -2); cx.lineTo(0, -2); cx.stroke();
            cx.setLineDash([]);
        });

        this._make('skill_smokeBomb', 28, 28, (cx) => {
            cx.translate(14, 14);
            // Smoke clouds
            cx.fillStyle = 'rgba(100,100,120,0.5)';
            cx.beginPath(); cx.arc(-3, 2, 8, 0, Math.PI * 2); cx.fill();
            cx.beginPath(); cx.arc(4, -1, 6, 0, Math.PI * 2); cx.fill();
            cx.beginPath(); cx.arc(-1, -4, 5, 0, Math.PI * 2); cx.fill();
            // Bomb
            cx.fillStyle = '#303030';
            cx.beginPath(); cx.arc(0, 4, 3, 0, Math.PI * 2); cx.fill();
            // Fuse
            cx.strokeStyle = '#a08040'; cx.lineWidth = 1;
            cx.beginPath(); cx.moveTo(1, 1); cx.quadraticCurveTo(4, -2, 3, -4); cx.stroke();
            // Spark
            cx.fillStyle = '#ffa020';
            cx.beginPath(); cx.arc(3, -4, 1.5, 0, Math.PI * 2); cx.fill();
        });

        this._make('skill_chainAttack', 28, 28, (cx) => {
            cx.translate(14, 14);
            // Multiple kunai
            for (let i = 0; i < 3; i++) {
                cx.save();
                cx.translate(-6 + i * 6, -4 + i * 2);
                cx.rotate(0.4);
                cx.fillStyle = '#a0a8b0';
                cx.beginPath();
                cx.moveTo(0, -5); cx.lineTo(-1.5, 0); cx.lineTo(1.5, 0); cx.closePath();
                cx.fill();
                cx.fillStyle = '#303040';
                cx.fillRect(-0.8, 0, 1.6, 4);
                cx.restore();
            }
            // Chain lines
            cx.strokeStyle = '#ffa040'; cx.lineWidth = 0.5;
            cx.setLineDash([1, 2]);
            cx.beginPath(); cx.moveTo(-6, -2); cx.lineTo(0, 0); cx.lineTo(6, 2); cx.stroke();
            cx.setLineDash([]);
        });

        // Archer skills
        this._make('skill_powerShot', 28, 28, (cx) => {
            cx.translate(14, 14);
            // Arrow
            cx.strokeStyle = '#8B6914'; cx.lineWidth = 2; cx.lineCap = 'round';
            cx.beginPath(); cx.moveTo(-10, 0); cx.lineTo(8, 0); cx.stroke();
            // Arrowhead
            cx.fillStyle = '#c0c8d0';
            cx.beginPath(); cx.moveTo(10, 0); cx.lineTo(6, -3); cx.lineTo(6, 3); cx.closePath(); cx.fill();
            // Speed lines
            cx.strokeStyle = '#ffa040'; cx.lineWidth = 1;
            cx.beginPath(); cx.moveTo(-10, -4); cx.lineTo(-5, -4); cx.stroke();
            cx.beginPath(); cx.moveTo(-10, 4); cx.lineTo(-5, 4); cx.stroke();
            // Glow
            cx.fillStyle = 'rgba(255,200,60,0.3)';
            cx.beginPath(); cx.arc(8, 0, 5, 0, Math.PI * 2); cx.fill();
        });

        this._make('skill_volley', 28, 28, (cx) => {
            cx.translate(14, 14);
            // Multiple arrows raining down
            for (let i = 0; i < 5; i++) {
                cx.save();
                cx.translate(-8 + i * 4, -6 + Math.abs(i - 2) * 2);
                cx.rotate(-0.3);
                cx.fillStyle = '#a0a8b0';
                cx.beginPath(); cx.moveTo(0, -4); cx.lineTo(-1, 0); cx.lineTo(1, 0); cx.closePath(); cx.fill();
                cx.strokeStyle = '#8B6914'; cx.lineWidth = 1;
                cx.beginPath(); cx.moveTo(0, 0); cx.lineTo(0, 5); cx.stroke();
                cx.restore();
            }
        });

        this._make('skill_evasiveRoll', 28, 28, (cx) => {
            cx.translate(14, 14);
            // Circular motion arrow
            cx.strokeStyle = '#60c060'; cx.lineWidth = 2; cx.lineCap = 'round';
            cx.beginPath(); cx.arc(0, 0, 8, -2, 1.5); cx.stroke();
            // Arrowhead on the arc
            cx.fillStyle = '#60c060';
            cx.beginPath(); cx.moveTo(6, 6); cx.lineTo(10, 4); cx.lineTo(7, 1); cx.closePath(); cx.fill();
            // Figure silhouette
            cx.fillStyle = 'rgba(80,180,80,0.4)';
            cx.beginPath(); cx.arc(0, -1, 4, 0, Math.PI * 2); cx.fill();
        });

        // Mage skills
        this._make('skill_fireball', 28, 28, (cx) => {
            cx.translate(14, 14);
            // Outer flame
            cx.fillStyle = 'rgba(255,100,0,0.5)';
            cx.beginPath(); cx.arc(0, 0, 10, 0, Math.PI * 2); cx.fill();
            // Inner flame
            cx.fillStyle = '#ff6020';
            cx.beginPath(); cx.arc(0, 0, 7, 0, Math.PI * 2); cx.fill();
            // Core
            cx.fillStyle = '#ffe040';
            cx.beginPath(); cx.arc(0, 0, 4, 0, Math.PI * 2); cx.fill();
            // Highlight
            cx.fillStyle = '#fff';
            cx.beginPath(); cx.arc(-2, -2, 2, 0, Math.PI * 2); cx.fill();
        });

        this._make('skill_frostNova', 28, 28, (cx) => {
            cx.translate(14, 14);
            // Ice burst
            cx.strokeStyle = '#80c0ff'; cx.lineWidth = 2;
            for (let i = 0; i < 8; i++) {
                const a = Math.PI / 4 * i;
                cx.beginPath();
                cx.moveTo(Math.cos(a) * 3, Math.sin(a) * 3);
                cx.lineTo(Math.cos(a) * 10, Math.sin(a) * 10);
                cx.stroke();
            }
            // Center crystal
            cx.fillStyle = '#a0e0ff';
            cx.beginPath();
            cx.moveTo(0, -4); cx.lineTo(3, 0); cx.lineTo(0, 4); cx.lineTo(-3, 0); cx.closePath();
            cx.fill();
            cx.strokeStyle = '#60a0ff'; cx.lineWidth = 1; cx.stroke();
        });

        this._make('skill_arcaneBarrage', 28, 28, (cx) => {
            cx.translate(14, 14);
            // Three arcane bolts
            const colors = ['#8060ff', '#a080ff', '#6040e0'];
            for (let i = 0; i < 3; i++) {
                cx.fillStyle = colors[i];
                cx.beginPath(); cx.arc(-4 + i * 4, -4 + i * 3, 3, 0, Math.PI * 2); cx.fill();
                cx.fillStyle = 'rgba(160,140,255,0.4)';
                cx.beginPath(); cx.arc(-4 + i * 4, -4 + i * 3, 5, 0, Math.PI * 2); cx.fill();
            }
            // Small sparkles
            cx.fillStyle = '#fff';
            cx.beginPath(); cx.arc(6, -6, 1, 0, Math.PI * 2); cx.fill();
            cx.beginPath(); cx.arc(-6, 4, 1, 0, Math.PI * 2); cx.fill();
        });

        // Tank skills
        this._make('skill_shieldBash', 28, 28, (cx) => {
            cx.translate(14, 14);
            // Shield
            cx.fillStyle = '#808040';
            cx.beginPath();
            cx.moveTo(0, -8); cx.quadraticCurveTo(10, -8, 10, 0);
            cx.quadraticCurveTo(10, 8, 0, 10); cx.quadraticCurveTo(-10, 8, -10, 0);
            cx.quadraticCurveTo(-10, -8, 0, -8);
            cx.closePath(); cx.fill();
            cx.strokeStyle = '#a0a040'; cx.lineWidth = 1.5; cx.stroke();
            // Impact lines
            cx.strokeStyle = '#ffe040'; cx.lineWidth = 1.5;
            cx.beginPath(); cx.moveTo(10, -3); cx.lineTo(13, -5); cx.stroke();
            cx.beginPath(); cx.moveTo(10, 0); cx.lineTo(14, 0); cx.stroke();
            cx.beginPath(); cx.moveTo(10, 3); cx.lineTo(13, 5); cx.stroke();
        });

        this._make('skill_taunt', 28, 28, (cx) => {
            cx.translate(14, 14);
            // Fist
            cx.fillStyle = '#c0a080';
            cx.beginPath();
            cx.moveTo(-2, -4); cx.lineTo(2, -4); cx.quadraticCurveTo(5, -4, 5, -1);
            cx.lineTo(5, 5); cx.quadraticCurveTo(5, 8, 2, 8);
            cx.lineTo(-2, 8); cx.quadraticCurveTo(-5, 8, -5, 5);
            cx.lineTo(-5, -1); cx.quadraticCurveTo(-5, -4, -2, -4);
            cx.closePath(); cx.fill();
            // Anger lines radiating out
            cx.strokeStyle = '#ff4040'; cx.lineWidth = 1.5; cx.lineCap = 'round';
            cx.beginPath(); cx.moveTo(-8, -8); cx.lineTo(-5, -5); cx.stroke();
            cx.beginPath(); cx.moveTo(8, -8); cx.lineTo(5, -5); cx.stroke();
            cx.beginPath(); cx.moveTo(0, -10); cx.lineTo(0, -6); cx.stroke();
            cx.beginPath(); cx.moveTo(-10, 0); cx.lineTo(-7, 0); cx.stroke();
            cx.beginPath(); cx.moveTo(10, 0); cx.lineTo(7, 0); cx.stroke();
        });

        this._make('skill_ironWall', 28, 28, (cx) => {
            cx.translate(14, 14);
            // Brick wall
            cx.fillStyle = '#707870';
            cx.fillRect(-10, -8, 20, 18);
            cx.strokeStyle = '#505850'; cx.lineWidth = 0.5;
            // Brick lines
            for (let y = -8; y < 10; y += 4) {
                cx.beginPath(); cx.moveTo(-10, y); cx.lineTo(10, y); cx.stroke();
            }
            for (let y = -8; y < 10; y += 4) {
                const off = ((y + 8) / 4 % 2) ? 5 : 0;
                for (let x = -10 + off; x < 10; x += 10) {
                    cx.beginPath(); cx.moveTo(x, y); cx.lineTo(x, y + 4); cx.stroke();
                }
            }
            // Glow border
            cx.strokeStyle = '#c0c060'; cx.lineWidth = 2;
            cx.strokeRect(-10, -8, 20, 18);
        });

        // Healer skills
        this._make('skill_healingLight', 28, 28, (cx) => {
            cx.translate(14, 14);
            // Green cross
            cx.fillStyle = '#40e040';
            cx.fillRect(-3, -10, 6, 20);
            cx.fillRect(-10, -3, 20, 6);
            // Glow
            cx.fillStyle = 'rgba(80,255,80,0.3)';
            cx.beginPath(); cx.arc(0, 0, 12, 0, Math.PI * 2); cx.fill();
            // Highlight
            cx.fillStyle = '#80ff80';
            cx.fillRect(-2, -8, 4, 5);
        });

        this._make('skill_purify', 28, 28, (cx) => {
            cx.translate(14, 14);
            // Radiant burst
            cx.fillStyle = 'rgba(255,255,200,0.4)';
            cx.beginPath(); cx.arc(0, 0, 11, 0, Math.PI * 2); cx.fill();
            // Rays
            cx.strokeStyle = '#f0e060'; cx.lineWidth = 1.5;
            for (let i = 0; i < 8; i++) {
                const a = Math.PI / 4 * i;
                cx.beginPath();
                cx.moveTo(Math.cos(a) * 4, Math.sin(a) * 4);
                cx.lineTo(Math.cos(a) * 10, Math.sin(a) * 10);
                cx.stroke();
            }
            // Center
            cx.fillStyle = '#fff';
            cx.beginPath(); cx.arc(0, 0, 4, 0, Math.PI * 2); cx.fill();
        });

        this._make('skill_divineShield', 28, 28, (cx) => {
            cx.translate(14, 14);
            // Shield outline with holy glow
            cx.fillStyle = 'rgba(255,220,80,0.3)';
            cx.beginPath(); cx.arc(0, 0, 12, 0, Math.PI * 2); cx.fill();
            // Shield
            cx.beginPath();
            cx.moveTo(0, -10); cx.quadraticCurveTo(10, -10, 10, 0);
            cx.quadraticCurveTo(10, 10, 0, 12); cx.quadraticCurveTo(-10, 10, -10, 0);
            cx.quadraticCurveTo(-10, -10, 0, -10);
            cx.closePath();
            cx.fillStyle = 'rgba(255,220,80,0.5)'; cx.fill();
            cx.strokeStyle = '#f0d040'; cx.lineWidth = 1.5; cx.stroke();
            // Cross
            cx.strokeStyle = '#f0d040'; cx.lineWidth = 1;
            cx.beginPath(); cx.moveTo(0, -6); cx.lineTo(0, 8); cx.stroke();
            cx.beginPath(); cx.moveTo(-6, 0); cx.lineTo(6, 0); cx.stroke();
        });

        // Bard skills
        this._make('skill_warSong', 28, 28, (cx) => {
            cx.translate(14, 14);
            // Music notes
            cx.fillStyle = '#ff6080';
            cx.beginPath(); cx.ellipse(-5, 2, 3, 2.5, -0.3, 0, Math.PI * 2); cx.fill();
            cx.strokeStyle = '#ff6080'; cx.lineWidth = 1.5;
            cx.beginPath(); cx.moveTo(-3, 2); cx.lineTo(-3, -6); cx.stroke();
            // Second note
            cx.fillStyle = '#ff6080';
            cx.beginPath(); cx.ellipse(5, -1, 3, 2.5, 0.3, 0, Math.PI * 2); cx.fill();
            cx.strokeStyle = '#ff6080'; cx.lineWidth = 1.5;
            cx.beginPath(); cx.moveTo(7, -1); cx.lineTo(7, -8); cx.stroke();
            // Beam
            cx.strokeStyle = '#ff6080'; cx.lineWidth = 2;
            cx.beginPath(); cx.moveTo(-3, -6); cx.lineTo(7, -8); cx.stroke();
            // Sound waves
            cx.strokeStyle = 'rgba(255,100,130,0.4)'; cx.lineWidth = 1;
            cx.beginPath(); cx.arc(0, 0, 10, -0.5, 0.5); cx.stroke();
        });

        this._make('skill_discordantNote', 28, 28, (cx) => {
            cx.translate(14, 14);
            // Jagged note
            cx.fillStyle = '#a040a0';
            cx.beginPath(); cx.ellipse(0, 2, 4, 3, 0, 0, Math.PI * 2); cx.fill();
            cx.strokeStyle = '#a040a0'; cx.lineWidth = 2;
            cx.beginPath(); cx.moveTo(3, 2); cx.lineTo(3, -8); cx.stroke();
            // Jagged lines (discord)
            cx.strokeStyle = '#ff4060'; cx.lineWidth = 1.5; cx.lineCap = 'round';
            cx.beginPath(); cx.moveTo(6, -4); cx.lineTo(9, -6); cx.lineTo(7, -2); cx.lineTo(10, -3); cx.stroke();
            cx.beginPath(); cx.moveTo(-6, -2); cx.lineTo(-9, -4); cx.lineTo(-7, 0); cx.lineTo(-10, -1); cx.stroke();
        });

        this._make('skill_balladOfResilience', 28, 28, (cx) => {
            cx.translate(14, 14);
            // Healing notes
            cx.fillStyle = '#40c080';
            cx.beginPath(); cx.ellipse(-3, 3, 3, 2.5, -0.2, 0, Math.PI * 2); cx.fill();
            cx.strokeStyle = '#40c080'; cx.lineWidth = 1.5;
            cx.beginPath(); cx.moveTo(-1, 3); cx.lineTo(-1, -5); cx.stroke();
            // Hearts around
            cx.fillStyle = '#ff80a0';
            cx.beginPath(); cx.arc(7, -3, 2, 0, Math.PI * 2); cx.fill();
            cx.beginPath(); cx.arc(-7, -4, 1.5, 0, Math.PI * 2); cx.fill();
            // Shield aura
            cx.strokeStyle = 'rgba(80,200,140,0.5)'; cx.lineWidth = 1.5;
            cx.beginPath(); cx.arc(0, 0, 10, 0, Math.PI * 2); cx.stroke();
        });
    },

    // ========================================================
    // RACE PORTRAITS (for character creation & side panel)
    // Size: 56×56
    // ========================================================
    _buildRacePortraits() {
        // Human
        this._make('race_Human', 56, 56, (cx) => {
            cx.translate(28, 28);
            // Background circle
            cx.fillStyle = '#1a1a2a';
            cx.beginPath(); cx.arc(0, 0, 26, 0, Math.PI * 2); cx.fill();
            cx.strokeStyle = '#c8a84e'; cx.lineWidth = 2;
            cx.beginPath(); cx.arc(0, 0, 26, 0, Math.PI * 2); cx.stroke();
            // Shoulders
            cx.fillStyle = '#707880';
            cx.beginPath();
            cx.moveTo(-18, 12); cx.quadraticCurveTo(-18, 6, -10, 4);
            cx.lineTo(10, 4); cx.quadraticCurveTo(18, 6, 18, 12);
            cx.lineTo(18, 24); cx.lineTo(-18, 24); cx.closePath();
            cx.fill();
            // Neck
            cx.fillStyle = '#c0a080';
            cx.fillRect(-4, 0, 8, 6);
            // Head
            cx.fillStyle = '#c0a080';
            cx.beginPath(); cx.ellipse(0, -6, 9, 10, 0, 0, Math.PI * 2); cx.fill();
            // Hair
            cx.fillStyle = '#604020';
            cx.beginPath(); cx.ellipse(0, -10, 10, 7, 0, Math.PI, 0); cx.fill();
            cx.fillRect(-10, -10, 3, 7);
            cx.fillRect(7, -10, 3, 7);
            // Eyes
            cx.fillStyle = '#ffffff';
            cx.beginPath(); cx.ellipse(-3.5, -5, 2.5, 1.5, 0, 0, Math.PI * 2); cx.fill();
            cx.beginPath(); cx.ellipse(3.5, -5, 2.5, 1.5, 0, 0, Math.PI * 2); cx.fill();
            cx.fillStyle = '#4060a0';
            cx.beginPath(); cx.arc(-3.5, -5, 1, 0, Math.PI * 2); cx.fill();
            cx.beginPath(); cx.arc(3.5, -5, 1, 0, Math.PI * 2); cx.fill();
            // Nose
            cx.strokeStyle = '#a08060'; cx.lineWidth = 0.5;
            cx.beginPath(); cx.moveTo(0, -3); cx.lineTo(-1, 0); cx.lineTo(1, 0); cx.stroke();
            // Mouth
            cx.strokeStyle = '#906050'; cx.lineWidth = 0.5;
            cx.beginPath(); cx.arc(0, 3, 3, 0.2, Math.PI - 0.2); cx.stroke();
        });

        // Elf
        this._make('race_Elf', 56, 56, (cx) => {
            cx.translate(28, 28);
            cx.fillStyle = '#1a1a2a';
            cx.beginPath(); cx.arc(0, 0, 26, 0, Math.PI * 2); cx.fill();
            cx.strokeStyle = '#40c060'; cx.lineWidth = 2;
            cx.beginPath(); cx.arc(0, 0, 26, 0, Math.PI * 2); cx.stroke();
            // Shoulders (elegant robe)
            cx.fillStyle = '#20603a';
            cx.beginPath();
            cx.moveTo(-16, 12); cx.quadraticCurveTo(-16, 6, -8, 4);
            cx.lineTo(8, 4); cx.quadraticCurveTo(16, 6, 16, 12);
            cx.lineTo(16, 24); cx.lineTo(-16, 24); cx.closePath();
            cx.fill();
            // Collar
            cx.strokeStyle = '#40a060'; cx.lineWidth = 1;
            cx.beginPath();
            cx.moveTo(-6, 4); cx.lineTo(0, 8); cx.lineTo(6, 4);
            cx.stroke();
            // Neck
            cx.fillStyle = '#d0c0a0';
            cx.fillRect(-3, 0, 6, 6);
            // Head (more angular)
            cx.fillStyle = '#d0c0a0';
            cx.beginPath(); cx.ellipse(0, -6, 8, 10, 0, 0, Math.PI * 2); cx.fill();
            // Long silver-blonde hair
            cx.fillStyle = '#d0c890';
            cx.beginPath(); cx.ellipse(0, -10, 10, 7, 0, Math.PI, 0); cx.fill();
            cx.fillRect(-10, -10, 3, 14);
            cx.fillRect(7, -10, 3, 14);
            // Pointed ears
            cx.fillStyle = '#d0c0a0';
            cx.beginPath(); cx.moveTo(-9, -4); cx.lineTo(-16, -10); cx.lineTo(-10, -2); cx.closePath(); cx.fill();
            cx.beginPath(); cx.moveTo(9, -4); cx.lineTo(16, -10); cx.lineTo(10, -2); cx.closePath(); cx.fill();
            // Almond eyes
            cx.fillStyle = '#ffffff';
            cx.beginPath(); cx.ellipse(-3.5, -5, 3, 1.2, -0.1, 0, Math.PI * 2); cx.fill();
            cx.beginPath(); cx.ellipse(3.5, -5, 3, 1.2, 0.1, 0, Math.PI * 2); cx.fill();
            cx.fillStyle = '#40a060';
            cx.beginPath(); cx.arc(-3.5, -5, 1, 0, Math.PI * 2); cx.fill();
            cx.beginPath(); cx.arc(3.5, -5, 1, 0, Math.PI * 2); cx.fill();
            // Delicate features
            cx.strokeStyle = '#b0a080'; cx.lineWidth = 0.3;
            cx.beginPath(); cx.moveTo(0, -3); cx.lineTo(0, 0); cx.stroke();
            cx.strokeStyle = '#a08070'; cx.lineWidth = 0.5;
            cx.beginPath(); cx.arc(0, 3, 2, 0.3, Math.PI - 0.3); cx.stroke();
            // Circlet gem
            cx.fillStyle = '#40c060';
            cx.beginPath(); cx.arc(0, -13, 2, 0, Math.PI * 2); cx.fill();
            cx.shadowColor = '#40c060'; cx.shadowBlur = 4;
            cx.beginPath(); cx.arc(0, -13, 1, 0, Math.PI * 2); cx.fill();
            cx.shadowBlur = 0;
        });

        // Dragonkin
        this._make('race_Dragonkin', 56, 56, (cx) => {
            cx.translate(28, 28);
            cx.fillStyle = '#1a1a2a';
            cx.beginPath(); cx.arc(0, 0, 26, 0, Math.PI * 2); cx.fill();
            cx.strokeStyle = '#c04040'; cx.lineWidth = 2;
            cx.beginPath(); cx.arc(0, 0, 26, 0, Math.PI * 2); cx.stroke();
            // Shoulders (heavy plate)
            cx.fillStyle = '#803020';
            cx.beginPath();
            cx.moveTo(-18, 12); cx.quadraticCurveTo(-18, 6, -10, 4);
            cx.lineTo(10, 4); cx.quadraticCurveTo(18, 6, 18, 12);
            cx.lineTo(18, 24); cx.lineTo(-18, 24); cx.closePath();
            cx.fill();
            // Spike shoulder
            cx.fillStyle = '#c04040';
            cx.beginPath(); cx.moveTo(-14, 6); cx.lineTo(-18, 0); cx.lineTo(-12, 4); cx.closePath(); cx.fill();
            cx.beginPath(); cx.moveTo(14, 6); cx.lineTo(18, 0); cx.lineTo(12, 4); cx.closePath(); cx.fill();
            // Neck (thick, scaled)
            cx.fillStyle = '#a06040';
            cx.fillRect(-5, -1, 10, 7);
            // Scale texture on neck
            cx.fillStyle = '#b07050';
            cx.beginPath(); cx.arc(-2, 2, 1.5, 0, Math.PI * 2); cx.fill();
            cx.beginPath(); cx.arc(2, 3, 1.5, 0, Math.PI * 2); cx.fill();
            // Head (angular, reptilian)
            cx.fillStyle = '#a06040';
            cx.beginPath();
            cx.moveTo(-9, -4); cx.lineTo(-6, -16); cx.lineTo(0, -18);
            cx.lineTo(6, -16); cx.lineTo(9, -4);
            cx.quadraticCurveTo(9, 0, 5, 2);
            cx.lineTo(-5, 2); cx.quadraticCurveTo(-9, 0, -9, -4);
            cx.closePath(); cx.fill();
            // Scales on forehead
            cx.fillStyle = '#b07050';
            cx.beginPath(); cx.arc(-3, -12, 2, 0, Math.PI * 2); cx.fill();
            cx.beginPath(); cx.arc(3, -12, 2, 0, Math.PI * 2); cx.fill();
            cx.beginPath(); cx.arc(0, -14, 2, 0, Math.PI * 2); cx.fill();
            // Horns
            cx.fillStyle = '#402020';
            cx.beginPath(); cx.moveTo(-7, -14); cx.lineTo(-12, -22); cx.lineTo(-5, -12); cx.closePath(); cx.fill();
            cx.beginPath(); cx.moveTo(7, -14); cx.lineTo(12, -22); cx.lineTo(5, -12); cx.closePath(); cx.fill();
            // Eyes (slitted, fiery)
            cx.fillStyle = '#ff6020';
            cx.shadowColor = '#ff6020'; cx.shadowBlur = 4;
            cx.beginPath(); cx.ellipse(-3.5, -6, 2.5, 2, 0, 0, Math.PI * 2); cx.fill();
            cx.beginPath(); cx.ellipse(3.5, -6, 2.5, 2, 0, 0, Math.PI * 2); cx.fill();
            cx.shadowBlur = 0;
            // Slitted pupils
            cx.fillStyle = '#1a1a2a';
            cx.fillRect(-4, -7.5, 1, 3);
            cx.fillRect(3, -7.5, 1, 3);
            // Snout/nostril
            cx.strokeStyle = '#805030'; cx.lineWidth = 0.5;
            cx.beginPath(); cx.arc(-2, -2, 1, 0, Math.PI * 2); cx.stroke();
            cx.beginPath(); cx.arc(2, -2, 1, 0, Math.PI * 2); cx.stroke();
            // Teeth showing
            cx.fillStyle = '#e0d8c0';
            cx.beginPath(); cx.moveTo(-3, 0); cx.lineTo(-2, 2); cx.lineTo(-1, 0); cx.closePath(); cx.fill();
            cx.beginPath(); cx.moveTo(1, 0); cx.lineTo(2, 2); cx.lineTo(3, 0); cx.closePath(); cx.fill();
        });
    },

    // ========================================================
    // CLASS PORTRAITS (for character creation)
    // Size: 56×56
    // ========================================================
    _buildClassPortraits() {
        // Warrior portrait
        this._make('class_Warrior', 56, 56, (cx) => {
            cx.translate(28, 28);
            cx.fillStyle = '#1a1a2a';
            cx.beginPath(); cx.arc(0, 0, 26, 0, Math.PI * 2); cx.fill();
            cx.strokeStyle = '#5080c0'; cx.lineWidth = 2;
            cx.beginPath(); cx.arc(0, 0, 26, 0, Math.PI * 2); cx.stroke();
            // Sword and shield crossed
            // Shield
            cx.beginPath();
            cx.moveTo(-4, -10); cx.quadraticCurveTo(-16, -10, -16, 0);
            cx.quadraticCurveTo(-16, 10, -4, 14);
            cx.quadraticCurveTo(4, 10, 4, 0);
            cx.quadraticCurveTo(4, -10, -4, -10);
            cx.closePath();
            cx.fillStyle = '#4060a0'; cx.fill();
            cx.strokeStyle = '#8090b0'; cx.lineWidth = 1.5; cx.stroke();
            cx.strokeStyle = '#6080c0'; cx.lineWidth = 1;
            cx.beginPath(); cx.moveTo(-4, -7); cx.lineTo(-4, 11); cx.stroke();
            cx.beginPath(); cx.moveTo(-10, 1); cx.lineTo(2, 1); cx.stroke();
            // Sword behind
            cx.fillStyle = '#d0d8e0';
            cx.beginPath();
            cx.moveTo(8, -18); cx.lineTo(6, -8); cx.lineTo(8, 6); cx.lineTo(10, -8);
            cx.closePath(); cx.fill();
            cx.fillStyle = '#a08030'; cx.fillRect(4, 5, 8, 2.5);
            cx.fillStyle = '#604020'; cx.fillRect(7, 7.5, 2, 6);
            cx.fillStyle = '#a08030';
            cx.beginPath(); cx.arc(8, 14, 2, 0, Math.PI * 2); cx.fill();
        });

        // Samurai portrait
        this._make('class_Samurai', 56, 56, (cx) => {
            cx.translate(28, 28);
            cx.fillStyle = '#1a1a2a';
            cx.beginPath(); cx.arc(0, 0, 26, 0, Math.PI * 2); cx.fill();
            cx.strokeStyle = '#c03030'; cx.lineWidth = 2;
            cx.beginPath(); cx.arc(0, 0, 26, 0, Math.PI * 2); cx.stroke();
            // Katana (diagonal)
            cx.save(); cx.rotate(-0.3);
            cx.fillStyle = '#d0d8e0';
            cx.beginPath();
            cx.moveTo(-1, -22); cx.quadraticCurveTo(0, -24, 1, -22);
            cx.lineTo(2, 2); cx.lineTo(-1, 2); cx.closePath();
            cx.fill();
            // Edge highlight
            cx.strokeStyle = '#ffffff'; cx.lineWidth = 0.3;
            cx.beginPath(); cx.moveTo(0.5, -20); cx.lineTo(1.5, 0); cx.stroke();
            // Tsuba
            cx.fillStyle = '#e8c840';
            cx.beginPath(); cx.ellipse(0.5, 3, 5, 2.5, 0, 0, Math.PI * 2); cx.fill();
            // Handle wrap
            cx.fillStyle = '#2a2a40';
            cx.fillRect(-0.5, 5, 2.5, 12);
            cx.strokeStyle = '#c03030'; cx.lineWidth = 0.5;
            for (let i = 0; i < 5; i++) {
                cx.beginPath(); cx.moveTo(-0.5, 6 + i * 2.2); cx.lineTo(2, 7 + i * 2.2); cx.stroke();
            }
            cx.restore();
            // Cherry blossom petals
            cx.fillStyle = '#ff8090';
            const petals = [[-8, -8], [10, -6], [-10, 8], [12, 10], [-4, 12]];
            petals.forEach(([px, py]) => {
                cx.beginPath(); cx.ellipse(px, py, 2, 3, Math.random() * Math.PI, 0, Math.PI * 2); cx.fill();
            });
        });

        // Ninja portrait
        this._make('class_Ninja', 56, 56, (cx) => {
            cx.translate(28, 28);
            cx.fillStyle = '#1a1a2a';
            cx.beginPath(); cx.arc(0, 0, 26, 0, Math.PI * 2); cx.fill();
            cx.strokeStyle = '#600820'; cx.lineWidth = 2;
            cx.beginPath(); cx.arc(0, 0, 26, 0, Math.PI * 2); cx.stroke();
            // Shuriken (large)
            cx.fillStyle = '#808890';
            cx.save(); cx.rotate(0.3);
            for (let i = 0; i < 4; i++) {
                cx.save(); cx.rotate(Math.PI / 2 * i);
                cx.beginPath();
                cx.moveTo(0, 0); cx.lineTo(-3, -12); cx.lineTo(0, -10); cx.lineTo(3, -12);
                cx.closePath(); cx.fill();
                cx.restore();
            }
            cx.restore();
            // Center hole
            cx.fillStyle = '#1a1a2a';
            cx.beginPath(); cx.arc(0, 0, 2.5, 0, Math.PI * 2); cx.fill();
            cx.strokeStyle = '#606870'; cx.lineWidth = 0.5;
            cx.beginPath(); cx.arc(0, 0, 2.5, 0, Math.PI * 2); cx.stroke();
            // Kunai below
            cx.save(); cx.translate(10, 12); cx.rotate(0.8);
            cx.fillStyle = '#a0a8b0';
            cx.beginPath(); cx.moveTo(0, -6); cx.lineTo(-2, 0); cx.lineTo(2, 0); cx.closePath(); cx.fill();
            cx.fillStyle = '#303040'; cx.fillRect(-1, 0, 2, 5);
            cx.strokeStyle = '#a0a8b0'; cx.lineWidth = 0.5;
            cx.beginPath(); cx.arc(0, 7, 2, 0, Math.PI * 2); cx.stroke();
            cx.restore();
        });

        // Archer portrait
        this._make('class_Archer', 56, 56, (cx) => {
            cx.translate(28, 28);
            cx.fillStyle = '#1a1a2a';
            cx.beginPath(); cx.arc(0, 0, 26, 0, Math.PI * 2); cx.fill();
            cx.strokeStyle = '#40a040'; cx.lineWidth = 2;
            cx.beginPath(); cx.arc(0, 0, 26, 0, Math.PI * 2); cx.stroke();
            // Bow
            cx.strokeStyle = '#8B6914'; cx.lineWidth = 3; cx.lineCap = 'round';
            cx.beginPath(); cx.arc(-6, 0, 16, -1.3, 1.3); cx.stroke();
            // Bowstring
            cx.strokeStyle = '#c0c0a0'; cx.lineWidth = 1;
            cx.beginPath();
            cx.moveTo(-6 + Math.cos(-1.3) * 16, Math.sin(-1.3) * 16);
            cx.lineTo(-6 + Math.cos(1.3) * 16, Math.sin(1.3) * 16);
            cx.stroke();
            // Arrow
            cx.strokeStyle = '#8B6914'; cx.lineWidth = 1.5;
            cx.beginPath(); cx.moveTo(-4, 0); cx.lineTo(18, 0); cx.stroke();
            // Arrowhead
            cx.fillStyle = '#c0c8d0';
            cx.beginPath(); cx.moveTo(20, 0); cx.lineTo(16, -3); cx.lineTo(16, 3); cx.closePath(); cx.fill();
            // Fletching
            cx.fillStyle = '#40a040';
            cx.beginPath(); cx.moveTo(-2, 0); cx.lineTo(-5, -3); cx.lineTo(-5, 0); cx.closePath(); cx.fill();
            cx.beginPath(); cx.moveTo(-2, 0); cx.lineTo(-5, 3); cx.lineTo(-5, 0); cx.closePath(); cx.fill();
        });

        // Mage portrait
        this._make('class_Mage', 56, 56, (cx) => {
            cx.translate(28, 28);
            cx.fillStyle = '#1a1a2a';
            cx.beginPath(); cx.arc(0, 0, 26, 0, Math.PI * 2); cx.fill();
            cx.strokeStyle = '#6040c0'; cx.lineWidth = 2;
            cx.beginPath(); cx.arc(0, 0, 26, 0, Math.PI * 2); cx.stroke();
            // Staff
            cx.strokeStyle = '#6B4226'; cx.lineWidth = 3;
            cx.beginPath(); cx.moveTo(-2, 20); cx.lineTo(-2, -10); cx.stroke();
            // Orb
            cx.fillStyle = '#8060ff';
            cx.beginPath(); cx.arc(-2, -14, 6, 0, Math.PI * 2); cx.fill();
            cx.fillStyle = 'rgba(160,140,255,0.4)';
            cx.beginPath(); cx.arc(-2, -14, 9, 0, Math.PI * 2); cx.fill();
            // Orb highlight
            cx.fillStyle = '#c0b0ff';
            cx.beginPath(); cx.arc(-4, -16, 2, 0, Math.PI * 2); cx.fill();
            // Arcane runes around
            cx.strokeStyle = 'rgba(160,140,255,0.6)'; cx.lineWidth = 1;
            for (let i = 0; i < 5; i++) {
                const a = Math.PI * 2 / 5 * i - Math.PI / 2;
                const r = 20;
                cx.beginPath(); cx.arc(-2 + Math.cos(a) * r, Math.sin(a) * r, 2, 0, Math.PI * 2); cx.stroke();
            }
        });

        // Tank portrait
        this._make('class_Tank', 56, 56, (cx) => {
            cx.translate(28, 28);
            cx.fillStyle = '#1a1a2a';
            cx.beginPath(); cx.arc(0, 0, 26, 0, Math.PI * 2); cx.fill();
            cx.strokeStyle = '#808040'; cx.lineWidth = 2;
            cx.beginPath(); cx.arc(0, 0, 26, 0, Math.PI * 2); cx.stroke();
            // Large kite shield
            cx.beginPath();
            cx.moveTo(0, -16); cx.quadraticCurveTo(16, -16, 16, 0);
            cx.quadraticCurveTo(16, 16, 0, 20);
            cx.quadraticCurveTo(-16, 16, -16, 0);
            cx.quadraticCurveTo(-16, -16, 0, -16);
            cx.closePath();
            cx.fillStyle = '#707840'; cx.fill();
            cx.strokeStyle = '#a0a040'; cx.lineWidth = 2; cx.stroke();
            // Shield cross
            cx.strokeStyle = '#c0c060'; cx.lineWidth = 2;
            cx.beginPath(); cx.moveTo(0, -12); cx.lineTo(0, 16); cx.stroke();
            cx.beginPath(); cx.moveTo(-12, 0); cx.lineTo(12, 0); cx.stroke();
            // Shield boss (center circle)
            cx.fillStyle = '#a0a040';
            cx.beginPath(); cx.arc(0, 0, 4, 0, Math.PI * 2); cx.fill();
            cx.strokeStyle = '#c0c060'; cx.lineWidth = 1;
            cx.beginPath(); cx.arc(0, 0, 4, 0, Math.PI * 2); cx.stroke();
        });

        // Healer portrait
        this._make('class_Healer', 56, 56, (cx) => {
            cx.translate(28, 28);
            cx.fillStyle = '#1a1a2a';
            cx.beginPath(); cx.arc(0, 0, 26, 0, Math.PI * 2); cx.fill();
            cx.strokeStyle = '#e0e040'; cx.lineWidth = 2;
            cx.beginPath(); cx.arc(0, 0, 26, 0, Math.PI * 2); cx.stroke();
            // Glowing cross
            cx.fillStyle = 'rgba(80,255,80,0.2)';
            cx.beginPath(); cx.arc(0, 0, 20, 0, Math.PI * 2); cx.fill();
            cx.fillStyle = '#40e040';
            cx.fillRect(-4, -14, 8, 28);
            cx.fillRect(-14, -4, 28, 8);
            // Glow on cross
            cx.fillStyle = '#80ff80';
            cx.fillRect(-2, -12, 4, 6);
            cx.fillRect(-12, -2, 6, 4);
            // Aura sparkles
            cx.fillStyle = '#f0d040';
            cx.beginPath(); cx.arc(-12, -12, 1.5, 0, Math.PI * 2); cx.fill();
            cx.beginPath(); cx.arc(12, -10, 1.5, 0, Math.PI * 2); cx.fill();
            cx.beginPath(); cx.arc(-10, 12, 1.5, 0, Math.PI * 2); cx.fill();
            cx.beginPath(); cx.arc(13, 11, 1.5, 0, Math.PI * 2); cx.fill();
        });

        // Bard portrait
        this._make('class_Bard', 56, 56, (cx) => {
            cx.translate(28, 28);
            cx.fillStyle = '#1a1a2a';
            cx.beginPath(); cx.arc(0, 0, 26, 0, Math.PI * 2); cx.fill();
            cx.strokeStyle = '#c06090'; cx.lineWidth = 2;
            cx.beginPath(); cx.arc(0, 0, 26, 0, Math.PI * 2); cx.stroke();
            // Lute body
            cx.fillStyle = '#8B6914';
            cx.beginPath(); cx.ellipse(0, 6, 10, 12, 0, 0, Math.PI * 2); cx.fill();
            cx.fillStyle = '#6B4914';
            cx.beginPath(); cx.ellipse(0, 4, 7, 8, 0, 0, Math.PI * 2); cx.fill();
            // Sound hole
            cx.fillStyle = '#1a1a2a';
            cx.beginPath(); cx.arc(0, 6, 3, 0, Math.PI * 2); cx.fill();
            // Neck
            cx.fillStyle = '#6B4914';
            cx.fillRect(-2, -20, 4, 18);
            // Strings
            cx.strokeStyle = '#c0c0a0'; cx.lineWidth = 0.4;
            for (let i = 0; i < 4; i++) {
                cx.beginPath(); cx.moveTo(-1 + i * 0.7, -18); cx.lineTo(-1.5 + i * 1, 14); cx.stroke();
            }
            // Music notes floating
            cx.fillStyle = '#ff6080';
            cx.beginPath(); cx.ellipse(-14, -10, 3, 2.5, -0.3, 0, Math.PI * 2); cx.fill();
            cx.strokeStyle = '#ff6080'; cx.lineWidth = 1.5;
            cx.beginPath(); cx.moveTo(-12, -10); cx.lineTo(-12, -18); cx.stroke();
            cx.fillStyle = '#ff80a0';
            cx.beginPath(); cx.ellipse(14, -6, 2.5, 2, 0.3, 0, Math.PI * 2); cx.fill();
            cx.strokeStyle = '#ff80a0'; cx.lineWidth = 1.5;
            cx.beginPath(); cx.moveTo(16, -6); cx.lineTo(16, -14); cx.stroke();
        });
    }
};
