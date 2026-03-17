const Input = {
    keys: {},
    keysJustPressed: {},
    mouse: { x: 0, y: 0, down: false, clicked: false, rightClicked: false },
    _listeners: [],

    init(canvas) {
        this._canvas = canvas;

        const onKeyDown = (e) => {
            if (!this.keys[e.code]) this.keysJustPressed[e.code] = true;
            this.keys[e.code] = true;
        };
        const onKeyUp = (e) => {
            this.keys[e.code] = false;
        };
        const onMouseMove = (e) => {
            const rect = canvas.getBoundingClientRect();
            const scaleX = canvas.width / rect.width;
            const scaleY = canvas.height / rect.height;
            this.mouse.x = (e.clientX - rect.left) * scaleX;
            this.mouse.y = (e.clientY - rect.top) * scaleY;
        };
        const onMouseDown = (e) => {
            if (e.button === 0) {
                this.mouse.down = true;
                this.mouse.clicked = true;
            }
            if (e.button === 2) this.mouse.rightClicked = true;
            if (typeof Audio !== 'undefined' && Audio.resume) Audio.resume();
        };
        const onMouseUp = (e) => {
            if (e.button === 0) this.mouse.down = false;
        };
        const onContext = (e) => e.preventDefault();

        window.addEventListener('keydown', onKeyDown);
        window.addEventListener('keyup', onKeyUp);
        canvas.addEventListener('mousemove', onMouseMove);
        canvas.addEventListener('mousedown', onMouseDown);
        canvas.addEventListener('mouseup', onMouseUp);
        canvas.addEventListener('contextmenu', onContext);

        this._listeners = [
            ['keydown', onKeyDown, window],
            ['keyup', onKeyUp, window],
            ['mousemove', onMouseMove, canvas],
            ['mousedown', onMouseDown, canvas],
            ['mouseup', onMouseUp, canvas],
            ['contextmenu', onContext, canvas]
        ];
    },

    endFrame() {
        this.mouse.clicked = false;
        this.mouse.rightClicked = false;
        this.keysJustPressed = {};
    },

    isDown(code) { return !!this.keys[code]; },
    justPressed(code) { return !!this.keysJustPressed[code]; },

    isMouseInRect(x, y, w, h) {
        return this.mouse.x >= x && this.mouse.x <= x + w &&
               this.mouse.y >= y && this.mouse.y <= y + h;
    },

    clickedInRect(x, y, w, h) {
        return this.mouse.clicked && this.isMouseInRect(x, y, w, h);
    }
};
