'use strict';

// Loads AI-generated PNG sprites and provides draw helpers for battleScreen.
// Images load asynchronously in the background; missing ones fail silently.
const UnitSprites = (() => {
    const RACES   = ['human', 'elf', 'dragonkin'];
    const CLASSES = ['warrior', 'samurai', 'ninja', 'archer', 'mage', 'tank'];

    // Poses that exist per class
    const POSES_MELEE  = ['idle', 'walk_left', 'walk_right', 'attack_melee', 'hurt', 'death'];
    const POSES_ARCHER = ['idle', 'walk_left', 'walk_right', 'attack_ranged', 'hurt', 'death'];
    const POSES_MAGE   = ['idle', 'walk_left', 'walk_right', 'cast', 'hurt', 'death'];

    function _posesFor(cls) {
        if (cls === 'archer') return POSES_ARCHER;
        if (cls === 'mage')   return POSES_MAGE;
        return POSES_MELEE;
    }

    const _images = {};

    function _key(race, cls, pose)  { return `${race}/${cls}/${pose}`; }
    function _path(race, cls, pose) { return `assets/generated/units/${race}/${cls}/${pose}_basic.png`; }
    function _portraitKey(race, cls)  { return `portrait/${race}/${cls}`; }
    function _portraitPath(race, cls) { return `assets/generated/portraits/${race}/${cls}/portrait_basic.png`; }

    // Fire-and-forget: images load in the background.
    // By the time the player reaches battle, they will be ready.
    function init() {
        for (const race of RACES) {
            for (const cls of CLASSES) {
                // Battle sprites
                for (const pose of _posesFor(cls)) {
                    const img = new Image();
                    img.onload = () => { _images[_key(race, cls, pose)] = img; };
                    img.src = _path(race, cls, pose);
                }
                // Portrait sprites
                const pimg = new Image();
                pimg.onload = () => { _images[_portraitKey(race, cls)] = pimg; };
                pimg.src = _portraitPath(race, cls);
            }
        }
    }

    function getImage(race, cls, pose) {
        return _images[_key(race, cls, pose)] || null;
    }

    // Returns the portrait image for the given race+class, or null if not loaded.
    function getPortrait(race, cls) {
        return _images[_portraitKey(race, cls)] || null;
    }

    // Draw the portrait centred at (cx, cy) filling a square of side `size`.
    // Clips to a rounded rectangle if `rounded` is truthy (pass corner radius).
    function drawPortrait(ctx, race, cls, cx, cy, size, rounded) {
        const img = getPortrait(race, cls);
        if (!img) return false;
        const half = size / 2;
        ctx.save();
        if (rounded) {
            const r = typeof rounded === 'number' ? rounded : size * 0.12;
            ctx.beginPath();
            ctx.roundRect(cx - half, cy - half, size, size, r);
            ctx.clip();
        }
        ctx.drawImage(img, cx - half, cy - half, size, size);
        ctx.restore();
        return true;
    }

    // Draw a sprite at (x, y) using the same coordinate system as _drawHumanoid.
    // scale = the same scale value passed to _drawHumanoid (s/9 for units, s/7 for hero).
    // flipX = mirror the image horizontally.
    // Returns true if the image was available and drawn, false otherwise.
    function draw(ctx, race, cls, pose, x, y, scale, flipX) {
        const img = getImage(race, cls, pose);
        if (!img) return false;

        // Match the visual size and ground anchor of _drawHumanoid.
        // The humanoid body spans from ~ y-14*S (head top) to y+23*S (feet),
        // where S = scale. The PNG character occupies ~80% of a square image.
        const drawH = 47.5 * scale;   // image draw height (S * 38 / 0.8)
        const drawW = drawH;           // source is a square 1024×1024
        const drawX = x - drawW / 2;
        const drawY = y - 19.5 * scale; // aligns head top to y - 14*S

        if (flipX) {
            ctx.save();
            ctx.scale(-1, 1);
            // After scale(-1,1): screen_x = -canvas_x, so to land at [drawX, drawX+drawW]
            // we draw at [-(drawX+drawW), drawY]
            ctx.drawImage(img, -(drawX + drawW), drawY, drawW, drawH);
            ctx.restore();
        } else {
            ctx.drawImage(img, drawX, drawY, drawW, drawH);
        }
        return true;
    }

    return { init, getImage, getPortrait, drawPortrait, draw };
})();
